/* Blueprints et Sonar (28 novembre 2026, étape 5). window.TB = {k} : cartes par recette.
   1. Aucun plan au sol sur k cartes de chaque recette ; aucun plan dans 500 butins de robots, de dépôts, de salles piégées, de pièces secrètes.
   2. Il existe un plan de tout : chaque capsule, accessoire, arme et armure (hors objets de départ, clé, Module de puissance, Matière, hacks).
   3. Terminal : ENCODAGE → BLUEPRINT montre 3 plans distincts, inconnus, de rang ≤ niveau + 1 ; renoncer garde les mêmes ; choisir apprend
      (capsule identifiée) ; moins de 3 libres : ce qu'il reste ; aucun : Matière.
   4. Niveau 1, de bout en bout : un FABLAB au dépôt, un plan appris à un terminal, l'objet fabriqué au FABLAB.
   5. Sonar 3 à 7 : point rouge à la bonne distance, pas au-delà, même hors de vue ; le meilleur porté compte ; pas les mines.
   6. Anciennes données : un plan resté au sol se ramasse sans erreur ; réglages d'objets enregistrés sans Sonar : le Sonar est là,
      le prix retouché du joueur est gardé.
   Une ligne par essai : « ok » ou « ÉCHEC ». */
(() => {
  const K=(window.TB||{}).k||5,out=[],sauve=JSON.parse(JSON.stringify(GEN)),raf=window.requestAnimationFrame;window.requestAnimationFrame=()=>0;
  const ok=(b,t)=>out.push(`${b?'ok':'ÉCHEC'} : ${t}`);
  const carte=rec=>{recRange();recPrend(rec);hasardReglages();enJeu(newGame,NIV_RECETTE(rec));};
  const terms=()=>Object.values(G.term||{}).filter(m=>m.s==='terminal');
  const ferme=()=>{if(!$('terminal').hidden)closeTerminal();};
  const estPlan=o=>typeof o==='string'&&o.startsWith('plan_');
  // 1. aucun plan au sol
  {const n={};let tot=0;
    for(const rec of ['atterrissage','cavernes','base','classique']){n[rec]=0;
      for(let k=0;k<K;k++){carte(rec);const l=Object.values(G.items||{}).flat();n[rec]+=l.filter(estPlan).length;tot+=l.length;}}
    ok(Object.values(n).every(v=>v===0),`aucun plan au sol sur ${K} cartes par recette (${tot} objets posés) : ${JSON.stringify(n)}`);}
  {carte('atterrissage');const P=G.px,Q=G.py,sp=BEASTS.findIndex(s=>!s.mine),d0=Object.assign({},DROPS);for(const k in DROPS)DROPS[k]=100;
    const pris={},plans=[];let n=0;
    for(let k=0;k<500;k++){G.items={};butinMort({sp,x:P,y:Q});for(const o of Object.values(G.items).flat()){n++;pris[o]=(pris[o]||0)+1;if(estPlan(o))plans.push(o);}}
    Object.assign(DROPS,d0);
    const coffre=[];for(const q of ['depot','piege','secret'])for(let k=0;k<500;k++)coffre.push(...butinCoffre(q).filter(estPlan));
    const mat=Math.round((pris.matiere||0)/n*100);
    ok(!plans.length&&!coffre.length&&n===500&&mat>=40&&mat<=60,`500 robots abattus : ${n} objets, aucun plan (Matière ${mat} %) ; 1 500 coffres : ${coffre.length} plan`);
    const eq=[];for(let k=0;k<400;k++)eq.push(equipTire());ok(!eq.some(k=>ITEMS[k].sonar),'le Sonar ne se trouve pas : il se fabrique');}
  // 2. un plan de tout
  {const hors=k=>{const d=ITEMS[k];return d.plan||d.hack||d.base||d.mat||['usine','cle','puissance'].includes(k);};
    const manque=Object.keys(ITEMS).filter(k=>!hors(k)&&(ITEMS[k].conso||ITEMS[k].slot)&&!(bpTout().includes(k)&&FAB_PRIX[k]>0));
    const S=SONAR_VERS.map(v=>FAB_PRIX['sonar'+v]);
    ok(!manque.length&&bpTout().length>=25,`un plan de tout : ${bpTout().length} objets fabricables${manque.length?', MANQUE '+manque.join(','):''}`);
    ok(S.every((p,n)=>!n||p>S[n-1]),`Sonar 3 à 7 : prix croissants ${S.join(' / ')}`);
    const r=SONAR_VERS.map(v=>[1,2,4,6,8].find(n=>PLAN_RANG('sonar'+v)<=n+1));
    ok(r.join()==='1,2,4,6,8',`Sonar 3, 4, 5, 6, 7 proposés à partir des niveaux ${r.join(', ')}`);}
  // 3. terminal
  {carte('atterrissage');const s=savoir();s.plans={};const m=terms()[0];termOuvre(m.i);
    $('termMenu').querySelector('.tl[data-a="bp"]').click();
    const lit=()=>[...$('termOut').querySelectorAll('.bpc')].map(b=>b.dataset.k),L=lit(),niv=G.niv||1;
    ok(L.length===3&&new Set(L).size===3&&L.every(k=>!s.plans[k]&&PLAN_RANG(k)<=niv+1&&FAB_PRIX[k]!=null),`ENCODAGE → BLUEPRINT : ${L.join(', ')} (rang ≤ ${niv+1})`);
    ok($('terminal').querySelector('.tl.sel')===$('termOut').querySelector('.bpc'),'la sélection est sur la première carte');
    $('termOut').querySelector('.hkr').click();$('termMenu').querySelector('.tl[data-a="bp"]').click();
    ok(lit().join()===L.join()&&m.bp===0,'renoncer puis revenir : les mêmes trois plans');
    const k=L.find(k=>ITEMS[k].conso)||L[0];$('termOut').querySelector(`.bpc[data-k="${k}"]`).click();
    const b=$('termMenu').querySelector('.tl[data-a="bp"]');
    ok(s.plans[k]===1&&m.bp===1&&identifie(k)&&(!b||b.disabled)&&/FABLAB/.test($('termOut').textContent),`choisi : ${k} appris${ITEMS[k].conso?', capsule identifiée':''}, la ligne n'est plus disponible`);
    ferme();
    // moins de trois : ce qu'il reste ; aucun : Matière
    const lib=bpLibres(niv);for(const x of lib.slice(2))s.plans[x]=1;const m2=terms()[1];termOuvre(m2.i);$('termMenu').querySelector('.tl[data-a="bp"]').click();
    ok(lit().length===2,`deux plans libres : ${lit().length} cartes`);ferme();
    for(const x of lib)s.plans[x]=1;const m3=terms()[1];m3.bp=0;m3.bpChoix=null;const mat0=G.st.matiere||0;termOuvre(m3.i);
    $('termMenu').querySelector('.tl[data-a="bp"]').click();
    ok(G.st.matiere===mat0+BP_MATIERE&&m3.bp===1,`aucun plan libre : Matière +${BP_MATIERE} à la place`);ferme();}
  // 4. niveau 1 de bout en bout : terminal → FABLAB
  {carte('atterrissage');savoir().plans={};let f=-1;for(let i=0;i<W*H;i++)if(G.t[i]===FABRIC){f=i;break;}
    const T=terms(),d=T.map(m=>Math.round(Math.sqrt(termD2(m.i,f)))).sort((a,b)=>a-b);
    // le terminal le plus proche du FABLAB
    const m=T.sort((a,b)=>termD2(a.i,f)-termD2(b.i,f))[0];termOuvre(m.i);$('termMenu').querySelector('.tl[data-a="bp"]').click();
    const k=$('termOut').querySelector('.bpc').dataset.k;$('termOut').querySelector('.bpc').click();ferme();
    G.st.matiere=500;G.px=f%W;G.py=((f/W)|0)+1;const n0=G.inv.filter(o=>o.k===k).reduce((a,o)=>a+(o.n||1),0),c0=(G.items[idx(G.px,G.py)]||[]).length;
    fabOpen(f);const l=fabListe(f),n=l.indexOf(k);fabFais(n);fabClose();
    const n1=G.inv.filter(o=>o.k===k).reduce((a,o)=>a+(o.n||1),0)+(G.items[idx(G.px,G.py)]||[]).length-c0;
    ok(f>=0&&n>=0&&d[0]<=TERM_R&&n1===n0+1&&G.st.matiere===500-FAB_PRIX[k],`niveau 1 : FABLAB présent, ${T.length} terminaux à ${d.join(', ')} cases ; plan ${k} appris au terminal, fabriqué (−${FAB_PRIX[k]} Matière)`);}
  // 5. Sonar
  {carte('atterrissage');G.inv=G.inv.filter(o=>!ITEMS[o.k].sonar);const sp=BEASTS.findIndex(s=>!s.mine),mine=BEASTS.findIndex(s=>s.mine);
    const met=k=>{const o={k,eq:0};G.inv.push(o);invEquip(G.inv.indexOf(o));return o;};
    const z=dx=>({sp,x:G.px+dx,y:G.py});let bon=true;const L=[];
    for(const v of SONAR_VERS){G.inv=G.inv.filter(o=>!ITEMS[o.k].sonar);met('sonar'+v);const a=sonarVoit(z(v)),b=sonarVoit(z(v+1)),c=sonarVoit({sp,x:G.px+v,y:G.py-v});
      if(!(a&&!b&&c))bon=false;L.push(`${v}:${a?1:0}${b?1:0}${c?1:0}`);}
    ok(bon,`Sonar 3 à 7 : signalé à N cases (diagonale comprise), pas à N + 1 — ${L.join(' ')}`);
    G.inv=G.inv.filter(o=>!ITEMS[o.k].sonar);met('sonar3');met('sonar6');met('sonar4');
    ok(sonarPortee()===6&&sonarVoit(z(6))&&!sonarVoit(z(7)),`trois portés (3, 6, 4) : le meilleur compte (${sonarPortee()} cases)`);
    ok(mine<0||!sonarVoit({sp:mine,x:G.px+2,y:G.py}),'une mine posée ne renvoie pas l’onde');
    G.inv=G.inv.filter(o=>!ITEMS[o.k].sonar);ok(sonarPortee()===0&&!sonarVoit(z(1)),'sans Sonar : rien');
    // rendu : un ennemi hors de vue à 4 cases → point en couleur danger ; à 6 cases avec un Sonar 5 → rien
    met('sonar5');fog=true;G.beasts=[];const b4={sp,x:G.px+4,y:G.py,pv:10,hunt:0},b6={sp,x:G.px-6,y:G.py,pv:10,hunt:0};
    for(const q of [[4,0],[-6,0]]){const i=idx(G.px+q[0],G.py);if(blocks(G.t[i]))G.t[i]=FLOOR;}
    G.beasts.push(b4,b6);computeFOV();vis[idx(b4.x,b4.y)]=0;vis[idx(b6.x,b6.y)]=0;
    const rouge=String(PAL['4']).toLowerCase(),f0=ctx.fillRect,pts=[];
    ctx.fillRect=function(x,y,w,h){if(String(ctx.fillStyle).toLowerCase()===rouge)pts.push([x,y]);return f0.apply(this,arguments);};
    try{render();}finally{ctx.fillRect=f0;}
    const q=S/16,au=b=>pts.some(([x,y])=>Math.abs(x-((b.x-camX)*S+6*q))<.5&&Math.abs(y-((b.y-camY)*S+6*q))<.5);
    ok(au(b4)&&!au(b6),`rendu : Sonar 5, ennemi hors de vue à 4 cases marqué d’un point rouge, à 6 cases rien`);
    const o=G.inv.find(o=>o.k==='sonar5');ok(!!o&&/5 cases/.test(modHTML(ITEMS.sonar5))&&/5 cases/.test(fabEffet('sonar5')),`fiche : « ${fabEffet('sonar5')} »`);
    window.SONAR_SCENE={b4,b6};}
  // 6. anciennes données
  {carte('atterrissage');const s=savoir();s.plans={};const c=idx(G.px,G.py);G.items[c]=['plan_repar','plan_sonar3','plan_cle','matiere'];const m0=G.st.matiere||0;let err=null;
    try{butinPrend(c);}catch(e){err=e;}
    ok(!err&&s.plans.repar===1&&s.plans.sonar3===1&&!G.items[c]&&G.st.matiere===m0+PLAN_DOUBLON+ITEM_VAL.matiere.mat,`ancienne partie : plans au sol ramassés et appris sans erreur${err?' : '+err:''}`);
    const avant=itemsEtat(),reg=JSON.parse(JSON.stringify(avant));for(const v of SONAR_VERS){delete reg.prix['sonar'+v];delete reg.mod['sonar'+v];}reg.prix.repar=77;
    for(const v of SONAR_VERS)FAB_PRIX['sonar'+v]=SONAR_PRIX[v];itemsApplique(reg);
    ok(FAB_PRIX.repar===77&&SONAR_VERS.every(v=>FAB_PRIX['sonar'+v]===SONAR_PRIX[v]&&ITEMS['sonar'+v]),'réglages d’objets enregistrés sans Sonar : prix du joueur gardé, Sonar présent');
    itemsApplique(avant);}
  window.requestAnimationFrame=raf;genRemet(sauve);
  return out.join('\n');
})()
