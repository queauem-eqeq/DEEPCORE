/* Astroport (niveau 1, 28 novembre 2026) : K cartes du niveau 1 en jeu (window.TA = {k}), puis la fusion des réglages enregistrés.
   1. Carte : taille 4 ; fosses et épaves numérotées (sous 467, sans doublon), notre fosse, quatre états, épaves plus anciennes près
      de l'entrée, FABLAB au dépôt, modules du thème réellement posés (dehors et dans le dépôt), ferrailleuses nées près d'une épave,
      site accessible. Le niveau 2 revient en taille 3, sans épaves.
   2. Réglages : des groupes et une banque de modules « enregistrés par le joueur » (window.REGLAGES = {groupes, modules} s'il est
      donné, sinon un exemple) passent avant le code ; les nouveautés s'y ajoutent sans rien effacer, une seule fois, et la carte
      qui suit les pose. Une ligne par essai : « ok » ou « ÉCHEC ». */
(() => {
  const K=(window.TA||{}).k||8,out=[],sauve=JSON.parse(JSON.stringify(GEN)),raf=window.requestAnimationFrame;window.requestAnimationFrame=()=>0;
  const ok=(b,t)=>out.push(`${b?'ok':'ÉCHEC'} : ${t}`);
  const THEME_INT=MODULES_ASTRO.filter(m=>!m.ext).map(m=>m.nom);
  const carte=()=>{recRange();recPrend('atterrissage');hasardReglages();enJeu(newGame,1);};
  const bilan=()=>{const b={taille:true,notre:true,nums:true,fab:0,acces:true,ext:0,int:0,etats:{},fer:0,ferEp:0,near:[],far:[],fosses:0,epaves:0,pose:{}};
    for(let k=0;k<K;k++){carte();
      if(W!==96||H!==64)b.taille=false;
      if(G.fosses.filter(f=>f.notre).length!==1)b.notre=false;
      const nums=G.epaves.map(e=>e.num);if(nums.some(n=>!(n>=1&&n<EPV_UNITE))||new Set(nums).size!==nums.length)b.nums=false;
      b.fosses+=G.fosses.length;b.epaves+=G.epaves.length;
      for(const e of G.epaves)b.etats[e.etat]=(b.etats[e.etat]||0)+1;
      if(G.t.some(v=>v===FABRIC))b.fab++;
      if(accesSite()<0)b.acces=false;
      b.ext+=G.fosses.filter(f=>f.mod).length;if((G.mods||[]).some(m=>THEME_INT.includes(m.nom)))b.int++;
      for(const id in G.patr){const P=G.patr[id];if(P.role==='ferraille'){b.fer++;if(P.epave>=0){const e=G.epaves[P.epave],
        m=(G.beasts||[]).filter(o=>o.gi===+id);if(e&&m.length&&m.every(o=>o.epave===P.epave))b.ferEp++;}}}
      // âge : numéros des épaves du tiers le plus proche de l'entrée contre ceux du tiers le plus loin
      const E=G.epaves.slice().sort((a,c)=>a.f-c.f),t=Math.floor(E.length/3);
      if(t){b.near.push(...E.slice(0,t).map(e=>e.num));b.far.push(...E.slice(-t).map(e=>e.num));}
      for(const n in G.menace.pose)b.pose[n]=(b.pose[n]||0)+G.menace.pose[n];}
    return b;};
  const moy=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
  {const t0=performance.now(),b=bilan(),ms=(performance.now()-t0)/K;
    ok(b.taille,`taille 4 au niveau 1 (${W} × ${H}) · ${ms.toFixed(0)} ms par carte`);
    ok(b.fosses/K>=8,`fosses : ${(b.fosses/K).toFixed(1)} par carte, épaves : ${(b.epaves/K).toFixed(1)}`);
    ok(b.notre,'notre fosse, une et une seule, numérotée');
    ok(b.nums,'numéros des épaves sous 467, sans doublon');
    ok(['s','e','q','v'].every(s=>b.etats[s]>0),`quatre états : ${JSON.stringify(b.etats)}`);
    ok(moy(b.near)<moy(b.far),`plus anciennes près de l'entrée : numéro moyen ${moy(b.near).toFixed(0)} près, ${moy(b.far).toFixed(0)} loin`);
    ok(b.fab===K,`FABLAB au dépôt : ${b.fab}/${K} cartes`);
    ok(b.acces,'site toujours accessible');
    ok(b.ext>=K/2,`modules d'extérieur posés dans les fosses : ${b.ext} sur ${K} cartes`);
    ok(b.int>=K*.75,`module du thème dans le dépôt : ${b.int}/${K} cartes`);
    ok(b.fer>0&&b.ferEp===b.fer,`ferrailleuses nées près d'une épave et qui la retiennent : ${b.ferEp}/${b.fer} groupes`);
    ok(!['1-2 Mines','Puces en groupes','Broyeur solitaire','Batterie','Embuscade gluante'].some(n=>b.pose[n]),`groupes du niveau 1 : ${JSON.stringify(b.pose)}`);}
  // le niveau 2 : retour en taille 3, sans épaves
  {niveauSuivant(true);ok(W===72&&!G.epaves,`niveau 2 en taille 3 (${W} × ${H}), sans épaves`);}
  // inspection d'une épave et enregistreur
  {carte();const e=G.epaves.find(x=>x.etat!=='v'&&EPV_MODELES[x.type]),i=e?idx(e.x+1,e.y+1):-1,f=e?epaveFiche(G.epI[i]!=null?i:idx(e.x,e.y+e.h-1)):null;
    ok(!e||(f&&/^[A-Z ]+ \d{4}$/.test(f[0])&&/NON RÉPERTORIÉ/.test(f[1])),`fiche d'inspection : ${f?f.join(' / '):'—'}`);
    const bx=G.epaves.find(x=>x.boite>=0);ok(!bx||(G.t[bx.boite]===TERMINAL&&epaveBoite(G.epaves.indexOf(bx))[0].includes('ENREGISTREUR')),'enregistreur d’épave scellée lisible');}
  // 2. Réglages enregistrés du joueur : fusion par identifiant
  const R=window.REGLAGES||{groupes:{budget:80,v:2,pente:20,liste:[
      {n:'Crabots',cout:9,on:1,f:2,pats:['ronde'],lieux:[],m:[{k:'crabos',min:3,max:3}]},
      {n:'1-2 Mines',cout:3,on:1,f:1,pats:['errance'],lieux:[],m:[{k:'mine',min:1,max:2}]},
      {n:'Mon groupe',cout:4,on:1,f:1,pats:['voyage'],lieux:[],m:[{k:'drone',min:2,max:2}]}],
      niv:{1:{budget:70,gr:['Crabots','1-2 Mines','Mon groupe'],part:{ext:75,bati:20,tunnel:5}},2:{budget:96,gr:['1-2 Mines'],part:{ext:80,bati:18,tunnel:2}},
        3:{budget:112,gr:['Crabots'],part:{ext:35,bati:60,tunnel:5}}}},
    modules:{nb:{atterrissage:1,cavernes:2,base:2,classique:0},liste:[{id:'mmJoueur1',nom:'Ma salle',w:5,h:4,rec:{atterrissage:true},
      t:['XXDXX','XSSSX','XSSSX','XXXXX'],m:['..x..','.....','..b..','.....']}]}};
  {const avant=JSON.parse(JSON.stringify(R.groupes)),g=groupesAstroport(groupesV2(groupesSains(JSON.parse(JSON.stringify(R.groupes)))));
    const siens=avant.liste.every(a=>{const x=g.liste.find(y=>y.n===a.n);return x&&x.cout===a.cout&&x.on===(a.on?1:0)&&JSON.stringify(x.m.map(m=>[m.k,m.min,m.max]))===JSON.stringify(a.m.map(m=>[m.k,m.min,m.max]));});
    ok(siens&&g.liste.length===Math.min(40,avant.liste.length+GR_ASTRO.filter(d=>!avant.liste.some(a=>a.n===d.n)).length),
      `groupes : les ${avant.liste.length} du joueur gardés tels quels, ${g.liste.length-avant.liste.length} ajoutés`);
    ok(GR_ASTRO.every(d=>g.niv[1].gr.includes(d.n)&&g.liste.find(x=>x.n===d.n).role===d.role),'nouveaux groupes attribués au niveau 1, avec leur rôle');
    const hors=avant.niv[1].gr.filter(n=>!g.niv[1].gr.includes(n));
    ok(hors.every(n=>GR_ASTRO_HORS(avant.liste.find(x=>x.n===n))),`niveau 1 : écartés par le thème ${JSON.stringify(hors)} ; gardés ${JSON.stringify(avant.niv[1].gr.filter(n=>g.niv[1].gr.includes(n)))}`);
    ok([2,3].every(n=>JSON.stringify(g.niv[n].gr)===JSON.stringify(groupesSains(avant).niv[n].gr))&&g.niv[1].budget===groupesSains(avant).niv[1].budget,
      'niveaux 2 et 3, et budget du niveau 1, inchangés');
    const g2=groupesAstroport(groupesV2(groupesSains(JSON.parse(JSON.stringify(g)))));
    ok(JSON.stringify(g2)===JSON.stringify(g)&&g.astro===1,'groupes : rejouée sur la version enregistrée, la fusion ne change rien');
    const g3=groupesAstroport(groupesV2(groupesSains(JSON.parse(JSON.stringify(R.groupes)))));
    ok(JSON.stringify(g3)===JSON.stringify(g),'groupes : rejouée sur l’ancienne copie (base de l’artefact), même résultat');
    // le chemin réel du chargement : applySaved, comme au démarrage de l'artefact
    APPLYING=true;try{applySaved({enregistreLe:new Date(0).toISOString(),groupes:JSON.parse(JSON.stringify(R.groupes)),modules:JSON.parse(JSON.stringify(R.modules))});}finally{APPLYING=false;}
    ok(JSON.stringify(GROUPES)===JSON.stringify(g),'applySaved (chargement de reglages/courant) : même fusion des groupes');
    // (un module mal formé est écarté à la lecture, comme avant : mdlValide)
    const ids=R.modules.liste.filter(m=>mdlValide(m)).map(m=>m.id),mien=MODULES.filter(m=>ids.includes(m.id)),
      rejet=R.modules.liste.length-ids.length;
    ok(mien.length===ids.length&&mien.every(m=>{const a=R.modules.liste.find(x=>x.id===m.id);return m.nom===String(a.nom).slice(0,30)&&m.w===a.w&&m.h===a.h;})
      &&MODULES_ASTRO.every(d=>MODULES.some(m=>m.id===d.id)),`modules : les ${ids.length} du joueur gardés${rejet?` (${rejet} mal formé${rejet>1?'s':''}, écarté${rejet>1?'s':''} à la lecture comme avant)`:''}, ${MODULES.length-ids.length} du thème ajoutés`);
    ok(MODULES_NB.atterrissage===Math.max(R.modules.nb.atterrissage||0,MDL_ASTRO_NB)&&MODULES_NB.cavernes===(R.modules.nb.cavernes||0),
      `modules posés par carte : niveau 1 ${R.modules.nb.atterrissage} → ${MODULES_NB.atterrissage}, autres recettes inchangées`);
    const n0=MODULES.length;modulesApplique(modulesEtat());
    ok(MODULES.length===n0,'modules : rejouée sur la banque enregistrée, la fusion ne change rien');
    const b=bilan();
    ok(b.ext>=K/2&&b.int>=K*.75&&GR_ASTRO.some(d=>b.pose[d.n]),`avec ces réglages, en jeu : modules dehors ${b.ext}, dépôt ${b.int}/${K}, groupes ${JSON.stringify(b.pose)}`);}
  window.requestAnimationFrame=raf;genRemet(sauve);
  return out.join('\n');
})()
