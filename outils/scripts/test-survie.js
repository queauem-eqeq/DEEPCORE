/* Survie (28 novembre 2026, chantier « Survie », bloc B) : fuel, vie qui remonte seule, repos qui soigne, forage moins coûteux.
   1. Fuel : −1 tous les 12 battements ; à sec : −1 de vie tous les 5 battements, et plus aucun soin (marche ni repos).
   2. Éclats de métal → fuel (+15 / +20 / +25), la vie ne bouge pas ; 4 gisements de métal par carte.
   3. Cellule de fuel : +30, illustration, tuile, son et animation à elle ; dans le butin ; blueprint ; réparobots plus rares.
   4. Descente : +30 de fuel, qui suit la foreuse.
   5. Vie : +1 / 20 battements en marche, +1 / 4 au repos (attente à la main comprise) ; statut « Repos », « À SEC ».
   6. Bouton REPOS : refusé si un ennemi chasse ; s'arrête vie et énergie pleines ; s'arrête quand le fuel passe sous l'alerte.
   7. Module de puissance : POW +1 et vie max +10 (vie courante +10). Forage : 5 d'énergie.
   8. Ancienne partie sans fuel : relue, jauge pleine. Réglages d'objets enregistrés sans cellule : la cellule est là, les leurs gardés.
   9. fxGrains : réparobots, station et éclats ramassés blessé vont au bout du geste, sans erreur.
   10. Bloc C (ennemis moins nombreux, plus dangereux) : REGLES.MENACE_NB réduit les groupes hostiles posés, pas les ferrailleuses,
       sans toucher aux réglages enregistrés (budget du joueur gardé) ; REGLES.MENACE_DEG multiplie les coups et les explosions de
       mines ; survol, journal de bord et Bestiaire montrent les vrais dégâts.
   Une ligne par essai : « ok » ou « ÉCHEC ». */
(async () => {
  const out=[],sauve=JSON.parse(JSON.stringify(GEN));
  const ok=(b,t)=>out.push(`${b?'ok':'ÉCHEC'} : ${t}`);
  const carte=rec=>{recRange();recPrend(rec);hasardReglages();enJeu(newGame,NIV_RECETTE(rec));fog=true;started=true;$('overlay').hidden=true;};
  const neuf=()=>{carte('atterrissage');G.beasts=[];G.animals=[];G.eff={};computeFOV();};
  const bats=(n,w)=>{for(let k=0;k<n;k++)regen(!!w);};
  const voisin=()=>{for(const [dx,dy] of DIRS){const x=G.px+dx,y=G.py+dy,i=idx(x,y);
    if(canWalk(G.t[i],true)&&!isWater(G.t[i])&&!blocks(G.t[i])&&diagOk(G.px,G.py,dx,dy)&&!(G.items&&G.items[i]&&G.items[i].length)&&!siteAt(x,y))return [dx,dy];}return null;};
  const dort=ms=>new Promise(r=>setTimeout(r,ms));
  try{
  // 1. fuel
  {neuf();ok(G.st.fuel===100&&G.st.fuelMax===100,`partie neuve : fuel ${G.st.fuel}/${G.st.fuelMax}`);
    Object.assign(G.st,{fuel:100,fuelT:0});bats(120);ok(G.st.fuel===90,`120 battements de marche : fuel 100 → ${G.st.fuel} (−1 / 12)`);
    Object.assign(G.st,{fuel:100,fuelT:0});bats(60,1);ok(G.st.fuel===95,`60 battements au repos : fuel 100 → ${G.st.fuel} (le repos consomme aussi)`);
    Object.assign(G.st,{fuel:0,fuelT:0,secT:0,vie:50,vieT:0});bats(25);const a=G.st.vie;bats(20,1);
    ok(a===45&&G.st.vie===41,`à sec : vie 50 → ${a} en 25 battements de marche, → ${G.st.vie} après 20 au repos (aucun soin)`);
    G.msg=null;Object.assign(G.st,{fuel:25,fuelT:11});bats(1);const m1=(G.log||[]).slice(-3).map(l=>l.m).join(' | ');
    Object.assign(G.st,{fuel:1,fuelT:11});bats(1);const m2=(G.log||[]).slice(-3).map(l=>l.m).join(' | ');
    ok(/RÉSERVE BASSE/.test(m1)&&/À SEC/.test(m2),`journal : passage sous 25 % (« ${m1.slice(-60)} ») et à sec`);
    side();ok($('fuRow').classList.contains('sec')&&$('fuN').textContent==='À SEC'&&/À SEC/.test($('effs').textContent),`colonne à sec : « ${$('fuN').textContent} », statut « ${$('effs').textContent} »`);
    G.st.fuel=20;side();ok($('fuRow').classList.contains('bas')&&!$('fuRow').classList.contains('sec'),'colonne en alerte sous 25 %');
    G.st.vie=0;Object.assign(G.st,{fuel:0,secT:4,vie:1});bats(1);ok(G.over&&G.over.dead&&G.over.fuel,'à sec, le dernier point de vie perdu détruit la foreuse');G.over=null;}
  // 2. éclats → fuel ; 4 gisements
  {neuf();const v=voisin();
    if(!v)ok(false,'éclats : aucune case libre à côté de la foreuse');
    else{const i=idx(G.px+v[0],G.py+v[1]);G.ore[i]='sol3';Object.assign(G.st,{fuel:50,vie:60,energie:40});const t=G.turn;
      tryMove(v[0],v[1]);
      ok(G.st.fuel===75&&G.st.vie===60&&G.turn===t+1&&!G.ore[i],`éclats gros ramassés blessée : fuel 50 → ${G.st.fuel}, vie ${G.st.vie}, énergie ${Math.round(G.st.energie)} (geste allé au bout)`);
      const v2=voisin();if(v2){const j=idx(G.px+v2[0],G.py+v2[1]);G.ore[j]='sol1';G.st.fuel=95;tryMove(v2[0],v2[1]);
        ok(G.st.fuel===100,`éclats petits avec 95 de fuel : ${G.st.fuel} (plafonné)`);}}
    const nb=[];for(const r of ['atterrissage','classique','cavernes']){carte(r);nb.push(Object.values(G.ore).filter(o=>!oreMat(o)).length);}
    ok(nb.every(n=>n===4),`gisements de métal par carte (atterrissage, classique, cavernes) : ${nb.join(', ')}`);}
  // 3. cellule de fuel
  {neuf();const d=ITEMS.fuel;
    ok(d&&d.vrai.art.length&&d.vrai.art.every(l=>l.length===15)&&TL.o_fuel&&typeof SFX.fuel==='function'&&ITEMS.fuel.son==='fuel'&&CONSO.fuel,
      'cellule de fuel : illustration, tuile o_fuel, son et capsule à elle');
    ok(!['repar','batterie','fumigene','charge','berserk','camo','balise','court','phaseur','puissance'].some(k=>ITEMS[k].son==='fuel'||(ITEMS[k].vrai||ITEMS[k]).art===d.vrai.art),'son et illustration jamais partagés');
    const n={};for(let k=0;k<20000;k++){const c=consoTire();n[c]=(n[c]||0)+1;}
    ok(n.fuel>0&&Math.abs(n.repar/n.batterie-REGLES.REPARO_POIDS/4)<.08,`butin (20 000 capsules) : cellule ${n.fuel}, réparobots ${n.repar} (poids ${REGLES.REPARO_POIDS}), batteries ${n.batterie}`);
    ok(FAB_PRIX.fuel>0&&bpTout().includes('fuel')&&PLAN_RANG('fuel')===1,`blueprint de la cellule (rang 1, ${FAB_PRIX.fuel} Matière)`);
    G.inv.push({k:'fuel',n:1});G.st.fuel=40;const fx0=FX.length;consoCible(G.inv.findIndex(o=>o.k==='fuel'),G.px,G.py);
    ok(G.st.fuel===70&&!G.inv.some(o=>o.k==='fuel')&&FX.some(f=>f.kind==='fuel'),`cellule utilisée : fuel 40 → ${G.st.fuel}, animation « fuel »`);
    G.inv.push({k:'fuel',n:1});G.st.fuel=100;identifier('fuel');consoCible(G.inv.findIndex(o=>o.k==='fuel'),G.px,G.py);
    ok(G.inv.some(o=>o.k==='fuel'),'fuel plein : cellule refusée, gardée');}
  // 4. descente
  {neuf();G.st.fuel=40;niveauSuivant();ok(G.niv===2&&G.st.fuel===70,`descente : fuel 40 → ${G.st.fuel} au niveau ${G.niv}`);
    G.st.fuel=90;niveauSuivant();ok(G.st.fuel===100,`descente avec 90 : ${G.st.fuel} (plafonné)`);}
  // 5. vie qui remonte
  {neuf();Object.assign(G.st,{vie:50,vieT:0,fuel:100});bats(40);const a=G.st.vie;bats(8,1);
    ok(a===52&&G.st.vie===54,`vie : 50 → ${a} en 40 battements de marche, → ${G.st.vie} en 8 au repos`);
    Object.assign(G.st,{vie:50,vieT:0});for(let k=0;k<4;k++)waitTurn();side();
    ok(G.st.vie===51&&/Repos/.test($('effs').textContent),`attente à la main : vie 50 → ${G.st.vie} en 4 tours, statut « ${$('effs').textContent} »`);
    Object.assign(G.st,{vie:G.st.vieMax,vieT:0});bats(40);ok(G.st.vie===G.st.vieMax,'vie pleine : ne dépasse pas le maximum');}
  // 6. bouton REPOS
  {neuf();const sp=BEASTS.findIndex(s=>!s.mine);
    G.beasts=[{sp,x:1,y:1,hp:5,hunt:5,sees:1,pret:1e9}];G.st.vie=50;G.msg=null;startRest();
    ok(!REST&&/chasse/.test(G.msg&&G.msg.m||''),`repos refusé quand un ennemi chasse : « ${G.msg&&G.msg.m} »`);
    G.beasts=[];Object.assign(G.st,{vie:G.st.vieMax-2,vieT:0,energie:G.st.energieMax,fuel:100});startRest();
    for(let k=0;k<200&&REST;k++)await dort(20);
    ok(!REST&&G.st.vie===G.st.vieMax&&/Repos terminé/.test((G.log||[]).slice(-3).map(l=>l.m).join(' ')),`repos : vie pleine en 8 battements, arrêt (vie ${G.st.vie})`);
    Object.assign(G.st,{vie:50,vieT:0,fuel:25,fuelT:6});startRest();for(let k=0;k<200&&REST;k++)await dort(20);
    const m=(G.log||[]).slice(-3).map(l=>l.m).join(' ');
    ok(!REST&&G.st.fuel===24&&/fuel sous le seuil/.test(m),`repos interrompu quand le fuel passe sous 25 % (fuel ${G.st.fuel}, vie ${G.st.vie})`);
    Object.assign(G.st,{vie:50,vieT:0,fuel:20,fuelT:0});startRest();await dort(60);const enCours=!!REST;
    {const v=voisin()||[1,0];G.beasts=[{sp,x:G.px+v[0]*1,y:G.py+v[1],hp:5,hunt:5,sees:1,pret:1e9}];computeFOV();}for(let k=0;k<100&&REST;k++)await dort(20);
    {const m=(G.log||[]).slice(-2).map(l=>l.m).join(' | ');ok(enCours&&!REST&&/chasse|repéré|en vue/.test(m),`repos commencé sous l’alerte : permis, puis interrompu par un chasseur (« ${m} »)`);}
    G.beasts=[];}
  // 7. Module de puissance, forage
  {neuf();const p=G.st.power,vm=G.st.vieMax;G.st.vie=60;G.inv.push({k:'puissance',n:1});consoCible(G.inv.findIndex(o=>o.k==='puissance'),G.px,G.py);
    ok(G.st.power===p+1&&G.st.vieMax===vm+10&&G.st.vie===70,`Module de puissance : POW ${p} → ${G.st.power}, vie max ${vm} → ${G.st.vieMax}, vie 60 → ${G.st.vie}`);
    let r=null;for(const [dx,dy] of D4){const i=idx(G.px+dx,G.py+dy);if(G.t[i]===ROCK||G.t[i]===MOUNT){r=[dx,dy];break;}}
    if(!r){const [dx,dy]=D4[0];G.t[idx(G.px+dx,G.py+dy)]=ROCK;r=[dx,dy];}
    G.st.energie=50;G.st.regen=0;const e0=G.st.energie,t0=G.turn;tryMove(r[0],r[1]);const dep=e0-(G.st.energie-G.st.power/POW_BASE);
    ok(G.st.cout===5&&Math.abs(dep-5)<.01,`coup de foreuse sur la roche : ${Math.round(dep*100)/100} d’énergie (règle ${REGLES.FORAGE_ENERGIE})`);}
  // 8. anciennes données
  {neuf();const g=JSON.parse(JSON.stringify(G));delete g.st.fuel;delete g.st.fuelMax;delete g.st.fuelT;
    start({G:g,started:true});side();ok(G.st.fuel===100&&G.st.fuelMax===100&&$('fuN').textContent==='100/100',`ancienne partie sans fuel : relue, fuel ${G.st.fuel}/${G.st.fuelMax}`);
    const vieux=JSON.parse(JSON.stringify(ITEMS_DEF));delete vieux.val.fuel;delete vieux.prix.fuel;vieux.val.repar.soin=60;vieux.prix.repar=25;
    itemsApplique(vieux);
    ok(ITEM_VAL.fuel.fuel===30&&FAB_PRIX.fuel===14&&ITEM_VAL.repar.soin===60&&FAB_PRIX.repar===25&&REGLES.FUEL_ECLATS[3]===25,
      'réglages d’objets enregistrés sans cellule : la cellule est là (+30, 14 Matière), les réparobots du joueur gardés (60, 25), éclats en fuel');
    itemsApplique(JSON.parse(JSON.stringify(ITEMS_DEF)));}
  // 9. fxGrains : les gestes de soin vont au bout
  {neuf();ok(typeof fxGrains==='function'&&fxGrains(5).length===5,'fxGrains est définie');
    G.st.vie=30;G.inv.push({k:'repar',n:1});const t=G.turn;let err='';
    try{consoCible(G.inv.findIndex(o=>o.k==='repar'),G.px,G.py);}catch(e){err=e.message;}
    ok(!err&&G.eff.repar&&G.turn===t+1&&FX.some(f=>f.kind==='soin'),`réparobots sur la foreuse : sans erreur, battement compté${err?' — '+err:''}`);
    let k=0;for(const tr of ['atterrissage','classique','base','cavernes']){if(G.t.includes(STATION))break;carte(tr);if(++k>8)break;}
    const i=G.t.indexOf(STATION);
    if(i<0)ok(true,'station : aucune sur les cartes essayées (essai sauté)');
    else{G.art=G.art||{};delete G.art[i];G.st.vie=40;err='';try{machBump(i%W,(i/W)|0,1,0);}catch(e){err=e.message;}
      ok(!err&&G.st.vie===G.st.vieMax,`station de réparation : sans erreur${err?' — '+err:''}`);}}
  // 10. bloc C : nombre et dégâts
  {const R0={nb:REGLES.MENACE_NB,deg:REGLES.MENACE_DEG},grRole=g=>(GROUPES.liste.find(x=>x.n===g)||{}).role;
    const compte=(nb,n)=>{REGLES.MENACE_NB=nb;let h=0,f=0;for(let k=0;k<n;k++){spawnGroupes();
        for(const [g,v] of Object.entries(G.menace.pose))(grRole(g)==='ferraille'?(f+=v):(h+=v));}return {h:h/n,f:f/n};};
    // réglages enregistrés simulés : le joueur a mis 150 au budget du niveau 2
    carte('cavernes');const avant=JSON.stringify(GROUPES),ls0=localStorage.getItem('np-groupes'),b0=GROUPES.niv[2].budget;GROUPES.niv[2].budget=150;
    const a=compte([1,1,1],8),bb=compte([1,.4,1],8),tot=G.menace.total;
    ok(bb.h>0&&bb.h<a.h*.6&&bb.h>a.h*.2,`niveau 2 : groupes hostiles posés ${a.h.toFixed(1)} → ${bb.h.toFixed(1)} avec MENACE_NB 0,4 (sautés : ${Object.values(G.menace.saute).reduce((x,y)=>x+y,0)})`);
    ok(GROUPES.niv[2].budget===150&&tot===Math.round(150*W*H/(96*64)),`budget du joueur gardé (150 → total ${tot} sur cette carte), rien de réécrit`);
    GROUPES.niv[2].budget=b0;ok(JSON.stringify(GROUPES)===avant&&localStorage.getItem('np-groupes')===ls0,'groupes et réglages enregistrés intacts après le peuplement');
    carte('atterrissage');const c=compte([1,1,1],60),d=compte([.4,.4,.4],60);   // 60 peuplements : 6 ne suffisaient pas (gardes 1,5 → 1,5 au hasard)
    ok(c.f>0&&Math.abs(d.f-c.f)<=Math.max(1,c.f*.25)&&d.h<c.h,`Astroport : ferrailleuses ${c.f.toFixed(1)} → ${d.f.toFixed(1)} (inchangées), gardes ${c.h.toFixed(1)} → ${d.h.toFixed(1)}`);
    REGLES.MENACE_NB=R0.nb;
    // dégâts
    neuf();REGLES.MENACE_DEG=[1.4,1.6,1.6];G.niv=2;const cr=BEASTS.find(b=>b.key==='crabos'),c0=[cr.dmin,cr.dmax,cr.crit];Object.assign(cr,{dmin:3,dmax:6,crit:0});
    const [mn,mx]=degReels(cr);ok(mn===5&&mx===10,`crabot 3-6 au niveau 2 (× 1,6) : ${mn}-${mx}`);
    const ti=[];for(let k=0;k<300;k++)ti.push(dmgDe(cr));ok(Math.min(...ti)===5&&Math.max(...ti)===10,`dmgDe tire entre ${Math.min(...ti)} et ${Math.max(...ti)}`);
    const v=voisin(),b={sp:BEASTS.indexOf(cr),x:G.px+v[0],y:G.py+v[1],hp:22,hunt:1,dir:1,mp:0};G.beasts=[b];const pertes=[];
    for(let k=0;k<60;k++){G.st.vie=G.st.vieMax=500;G.over=null;hurtRobot(b,cr);const p=500-G.st.vie;if(p>0)pertes.push(p);}
    ok(pertes.length&&Math.min(...pertes)>=5&&Math.max(...pertes)<=10&&Math.max(...pertes)>6,`coups reçus d'un crabot au niveau 2 : ${Math.min(...pertes)} à ${Math.max(...pertes)} (base 3-6)`);
    G.niv=0;ok(degReels(cr)[1]===6,'niveau 0 (banc, dégâts de base) : 3-6');G.niv=1;ok(degReels(cr)[1]===8,'niveau 1 (× 1,4) : 4-8');G.niv=2;
    const mi=BEASTS.findIndex(x=>x.mine),ms=BEASTS[mi],[m1,m2]=degReels(ms),mpert=[];
    for(let k=0;k<20;k++){G.st.vie=500;G.over=null;const m={sp:mi,x:G.px+v[0],y:G.py+v[1],hp:5,hunt:1,dir:1,mp:0};G.beasts=[m];explose(m);mpert.push(500-G.st.vie);}
    ok(Math.min(...mpert)>=m1&&Math.max(...mpert)<=m2&&m2>ms.dmax,`explosion de mine au niveau 2 : ${Math.min(...mpert)} à ${Math.max(...mpert)} (base ${ms.dmin}-${ms.dmax})`);
    // fiches
    G.st.vie=G.st.vieMax=100;G.beasts=[b];b.hp=22;computeFOV();const h=inspectHTML({x:b.x,y:b.y});
    ok(/DÉG <b>5-10<\/b>/.test(h),`survol : « ${(h.match(/DÉG <b>[^<]*<\/b>/)||['?'])[0]} »`);
    const jl=jnStatsLignes(cr).join(' ');ok(/DÉGÂTS : 5–10 \(NIV\. 2\)/.test(jl),`journal de bord, palier Stats : « ${jl.match(/DÉGÂTS[^.]*\./)} »`);
    BEST_SEL=['crabos'];openBest();const cell=$('breel-crabos');const tx=cell?cell.textContent:'';closeBest();
    ok(/niv\. 1 : 4-8/.test(tx)&&/niv\. 2 : 5-10/.test(tx)&&/niv\. 3 : 5-10/.test(tx),`Bestiaire, « Dégâts en jeu » : ${tx}`);
    Object.assign(cr,{dmin:c0[0],dmax:c0[1],crit:c0[2]});REGLES.MENACE_DEG=R0.deg;G.beasts=[];G.over=null;}
  }catch(e){ok(false,'exception : '+(e&&e.stack||e).toString().slice(0,300));}
  genRemet(sauve);
  return out.join('\n');
})()
