/* Journal de bord (28 novembre 2026, 14k-journal.js). Une ligne par essai : « ok » ou « ÉCHEC ».
   Paliers des fiches de robots (Stats à la 10e destruction, DATA, origine refusée sous l'éveil), persistance (nouvelle partie,
   rechargement de la page simulé, format ancien ou inconnu, fusion avec la base), DATA du terminal et de la boîte noire,
   six onglets rendus sans erreur, fenêtre jamais plus haute que l'écran, touche J, Lab (tout débloquer, effacer avec confirmation). */
(() => {
  const out=[],ok=(b,t)=>out.push(`${b?'ok':'ÉCHEC'} : ${t}`),sauve=JSON.parse(JSON.stringify(GEN)),raf=window.requestAnimationFrame,rnd0=Math.random;
  window.requestAnimationFrame=()=>0;const JN0=JSON.stringify(JN);
  // hasard fixé à 0 pendant la DATA (catégorie, puis entrée) ; les noms de code des capsules sont tirés avant (savoir)
  const zero=()=>{savoir();Math.random=()=>0;};
  const carte=()=>{recRange();recPrend('atterrissage');hasardReglages();enJeu(newGame,1);};
  const key=k=>dispatchEvent(new KeyboardEvent('keydown',{key:k,bubbles:true}));
  const logTxt=()=>$('log')?$('log').textContent:'';
  try{
  JN=jnVide();jnSauve();carte();
  // 1. Stats à la 10e destruction (vraie voie : butinMort, comme RECYCLAGE)
  {const sp=BEASTS.findIndex(b=>b.key==='crabos');let a9=null;
    for(let n=1;n<=10;n++){butinMort({sp,x:G.px,y:G.py,nd:1});if(n===9)a9=jnStats(JN.rob.crabos);}
    ok(a9===false&&jnStats(JN.rob.crabos)&&JN.rob.crabos.det===10,`Stats : absentes à 9 destructions, acquises à la 10e (${JN.rob.crabos.det})`);
    const b={sp,x:1,y:1,nd:1};butinMort(b);butinMort(b);ok(JN.rob.crabos.det===11,'une destruction comptée une seule fois par robot');
    ok(/FICHE MISE À JOUR : CRABOT — STATS/.test(JSON.stringify(G.log||'')+logTxt()),'ligne discrète au journal du jeu : « FICHE MISE À JOUR : CRABOT — STATS. »');}
  // une puce écrasée compte pour la Puce
  {const a=G.animals[0]||null;if(a){a.hp=0;jnDetruit(a,0);}ok(!a||JN.rob.puce.det===1,'puce détruite comptée');}
  // 2. persistance : nouvelle partie, puis rechargement de la page simulé
  {carte();ok(JN.rob.crabos.det===11&&jnStats(JN.rob.crabos),'nouvelle partie : la fiche du Crabot est gardée');
    const avant=JSON.stringify(JN);JN=jnVide();jnCharge();ok(JSON.stringify(JN)===avant,'rechargement simulé : journal relu depuis np-journal');}
  // format ancien ou inconnu : relu sans erreur, champs inconnus ignorés
  {const d=jnSain({v:99,rob:{crabos:{det:'5',x:1,vu:true}},obj:[1,2],pg:{jf_398:{n:'12'}},foo:1});
    ok(d.v===JN_VER&&d.rob.crabos.det===5&&d.rob.crabos.vu===1&&!Object.keys(d.obj).length&&d.pg.jf_398.n===12,'format inconnu relu sans erreur');
    const a={raz:5,rob:{drone:{det:3}},pg:{a:{}}},b={raz:5,rob:{drone:{det:7,c:1}},pg:{b:{}}},f=jnFusion(a,b);
    ok(f.rob.drone.det===7&&f.rob.drone.c===1&&f.pg.a&&f.pg.b,'fusion (navigateur + base) : union, rien ne se perd');
    ok(jnFusion({raz:9},{raz:5,obj:{repar:1}}).raz===9&&!jnFusion({raz:9},{raz:5,obj:{repar:1}}).obj.repar,'fusion : un effacement plus récent l’emporte');}
  // 3. paliers par DATA, et origine refusée sous le niveau d'éveil
  {JN.rob.crabos.c=1;JN.rob.crabos.o=0;G.niv=1;const e=+jnFicheTx('crabos').eveil;
    ok(jnSuivant('crabos',1)===null&&jnSuivant('crabos',e)==='o',`origine du Crabot refusée au niveau 1, ouverte au niveau ${e}`);
    ok(!jnEspecesNiv().filter(k=>jnSuivant(k,1)).includes('crabos'),'la DATA ne tire pas une fiche qui ne peut pas monter');
    // espèce sans texte : stats seulement
    ok(Object.keys(JN_FICHE).every(k=>ESPECES().some(e=>e[0]===k))&&ESPECES().every(([k])=>JN_FICHE[k]),'chaque espèce a sa clé de fiche');}
  // DATA au terminal : Math.random fixé → une fiche de robot du niveau monte d'un palier
  {const T=Object.values(G.term).filter(m=>m.s==='terminal'),m=T[0],R=jnEspecesNiv().filter(k=>jnSuivant(k,1)),
      av=JSON.parse(JSON.stringify(JN.rob)),pal=r=>r?(jnStats(r)?1:0)+r.c+r.o:-1;
    zero();termOuvre(m.i);$('termMenu').querySelector('.tl[data-a="data"]').click();Math.random=rnd0;
    const t=$('termOut').textContent;
    const k=m.lu.id.slice(2);
    ok(m.lu.type==='robot'&&R.includes(k)&&pal(JN.rob[k])===Math.max(0,pal(av[k]))+1&&/PAGE AJOUTÉE AU JOURNAL DE BORD/.test(t),
      `DATA : fiche ${k} du niveau montée d’un palier (${JSON.stringify(av[k]||null)} → ${JSON.stringify(JN.rob[k])})`);
    closeTerminal();
    // un journal : sa ligne d'analyse au terminal
    const m2=T[1];JN.rob={};for(const [kk] of ESPECES())JN.rob[kk]={vu:1,det:99,s:1,c:1,o:1};
    for(const c in CONSO)identifier(c);zero();termOuvre(m2.i);$('termMenu').querySelector('.tl[data-a="data"]').click();Math.random=rnd0;
    const t2=$('termOut').textContent,id=m2.lu.id,tx=jnTexte(id);
    ok(tx&&tx.source!=='boite_noire'&&JN.pg[id]&&/PAGE AJOUTÉE/.test(t2)&&/ANALYSE/.test(t2)&&!/\{UNITE\}|\{NUM\}/.test(t2),`DATA : journal « ${m2.lu.titre} » lu, analyse affichée`);
    closeTerminal();}
  // capsule non identifiée : la DATA l'identifie
  {carte();const k=Object.keys(CONSO)[0];ok(!identifie(k),'capsule non identifiée en début de partie');const d=jnObjetData(k);
    ok(identifie(k)&&JN.obj[k]&&d.type==='objet','DATA objet : la capsule est identifiée et sa fiche entre au journal');}
  // 4. boîte noire : un texte d'enregistreur au numéro de l'épave
  {let bx=null;for(let n=0;n<8&&!bx;n++){carte();bx=Object.values(G.term).find(m=>m.s==='boite_noire');}
    if(bx){const e=G.epaves[G.art[bx.i].boite];termOuvre(bx.i);$('termMenu').querySelector('.tl[data-a="data"]').click();
      const id=bx.lu.id;ok(bx.lu.type==='boite_noire'&&jnTexte(id)&&jnTexte(id).source==='boite_noire'&&bx.lu.titre.includes(num4(e.num))&&JN.pg[id]&&JN.pg[id].n===e.num,
        `boîte noire : « ${bx.lu.titre} » (${id}), numéro de l’épave ${num4(e.num)}`);closeTerminal();}
    else ok(false,'boîte noire : aucune en 8 cartes');}
  // espèces du niveau : groupes réglés par le joueur compris
  {const g={n:'Essai journal',on:1,m:[{k:'englueur',min:1,max:1}],pats:[],lieux:[],cout:1,f:1};GROUPES.liste.push(g);nivDe(1).gr.push(g.n);
    const L=jnEspecesNiv();GROUPES.liste.pop();nivDe(1).gr.pop();ok(L.includes('englueur'),'espèces du niveau : un groupe du joueur compte');}
  // 5. la fenêtre : six onglets, sans erreur, jamais plus haute que l'écran ; J ouvre et ferme
  {jnToutDebloquer();key('j');let err=null;const tailles=[];
    try{for(const [t] of JN_ONGLETS){jnOnglet(t);const E=jnEntrees(t);for(let n=0;n<E.length;n++){jnChoix(n);}
      tailles.push(Math.round($('jdb').querySelector('.mcard').getBoundingClientRect().height));}}catch(e){err=e;}
    const T=[...$('jdbTabs').querySelectorAll('.jtab')].map(b=>b.textContent.trim());
    ok(!err&&T.length===6,`six onglets rendus sans erreur : ${T.join(' · ')}${err?' — '+err:''}`);
    ok(Math.max(...tailles)<=innerHeight,`fenêtre : ${Math.max(...tailles)} px au plus (écran ${innerHeight})`);
    jnOnglet('rob');jnChoix(1);ok($('jdbFiche').querySelectorAll('.jpal').length===4&&!$('jdbFiche').querySelector('.manque'),'fiche de robot : quatre paliers, tout acquis');
    key('j');ok($('jdb').hidden,'J ferme le journal');}
  // 6. Lab : effacer demande un second clic
  {$('jnLabEff').click();const reste=Object.keys(JN.rob).length;$('jnLabEff').click();
    ok(reste>0&&!Object.keys(JN.rob).length&&JN.raz>0,'Lab : effacer demande confirmation, puis vide le journal');
    ok(jnEntrees('tut').filter(e=>e.connu).length===JN_TUTO_DEPART,`tutoriel : ${JN_TUTO_DEPART} pages d’office`);}
  }catch(e){ok(false,'exception : '+e+' '+(e.stack||'').split('\n')[1]);}
  Math.random=rnd0;window.requestAnimationFrame=raf;genRemet(sauve);JN=jnSain(JSON.parse(JN0));jnSauve();
  return out.join('\n');
})()
