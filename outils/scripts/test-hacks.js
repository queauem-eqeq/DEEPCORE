/* Hacks (28 novembre 2026, 14g) : programmes gratuits choisis parmi 3 au terminal.
   1. Tirage : chances des familles par tranche de niveaux (2 000 propositions), Tir compris depuis le 28 novembre 2026, jamais deux fois le même.
   2. Emplacements : 2, 3, 4, 5 aux niveaux 1, 3, 6, 9 ; le plus profond atteint compte.
   3. Chaque hack Base agit vraiment sur ce qu'il touche ; la colonne Stats et son survol montrent la part du hack.
   4. Un seul exemplaire par sorte, un seul Noyau ; retirer range dans l'inventaire (refusé s'il est plein) ; jeter.
   5. SURSIS, SYMBIOSE, HÉRITAGE (np-heritage, puis vidée).
   6. Terminal : ENCODAGE → HACK montre 3 cartes, renoncer garde les mêmes, choisir équipe ; plein partout : écraser.
   7. Anciennes données : partie sans hacks, réglages d'objets enregistrés sans hacks.
   Une ligne par essai : « ok » ou « ÉCHEC ». */
(() => {
  const out=[],sauve=JSON.parse(JSON.stringify(GEN)),raf=window.requestAnimationFrame;window.requestAnimationFrame=()=>0;
  const ok=(b,t)=>out.push(`${b?'ok':'ÉCHEC'} : ${t}`);
  const carte=rec=>{recRange();recPrend(rec);hasardReglages();enJeu(newGame,NIV_RECETTE(rec));};
  const neuf=()=>{carte('atterrissage');G.inv=G.inv.filter(o=>!estHack(o.k));};
  const met=k=>{const o={k,eq:0};G.inv.push(o);invEquip(G.inv.indexOf(o));return o;};
  // 1. tirage
  for(const [niv,att] of [[1,{base:85,tir:15,noyau:0}],[5,{base:50,tir:40,noyau:10}],[8,{base:25,tir:35,noyau:40}]]){   // Tir proposé depuis le bloc D (28 novembre 2026)
    carte('atterrissage');G.niv=niv;G.inv=G.inv.filter(o=>!estHack(o.k));const n={base:0,tir:0,noyau:0};let dbl=0,rang=true,N=0;
    for(let k=0;k<700;k++){const l=hackTirage(niv,3);if(new Set(l.map(c=>ITEMS[c].hk)).size!==l.length)dbl++;
      for(const c of l){n[ITEMS[c].fam]++;N++;if(ITEMS[c].fam!=='noyau'&&ITEMS[c].rang!==niv)rang=false;}}
    const p=f=>Math.round(n[f]/N*1000)/10;
    ok(Math.abs(p('tir')-att.tir)<4&&dbl===0&&rang&&Math.abs(p('base')-att.base)<4&&Math.abs(p('noyau')-att.noyau)<4,
      `tirage niveau ${niv} (${N} propositions) : Base ${p('base')} %, Noyau ${p('noyau')} % (visé ${att.base} / ${att.noyau}, Tir visé ${att.tir} %), Tir ${p('tir')} %, doublons ${dbl}, rang ${rang?'= niveau':'FAUX'}`);}
  // 2. emplacements
  {const r=[1,2,3,5,6,8,9,10].map(n=>hackPlaces(n));ok(r.join()==='2,2,3,3,4,4,5,5',`emplacements par niveau 1,2,3,5,6,8,9,10 : ${r.join(', ')}`);
    neuf();G.niv=2;G.st.nivMax=6;ok(SLOTS.hack.n===4,`le plus profond atteint compte (niveau 2, déjà 6) : ${SLOTS.hack.n} emplacements`);
    neuf();G.niv=2;G.st.nivMax=2;G.niv=3;G.msg=null;hacksArrivee();const m=G.msg&&G.msg.m||'';
    ok(G.st.nivMax===3&&SLOTS.hack.n===3&&/EMPLACEMENTS DE HACK : 3/.test(m),`arrivée au niveau 3 : ligne au journal « ${m} »`);
    G.msg=null;G.niv=4;hacksArrivee();ok(!G.msg,'arrivée au niveau 4 : rien au journal');}
  // 3. effets réels des hacks Base (rang 4 : E = 5)
  {neuf();const st0=JSON.parse(JSON.stringify(G.st)),R=4,E=HACK_E[R-1],res=[];
    const essai=(h,mesure)=>{neuf();const a=mesure();const o=met(hackCle(h,R));const b=mesure();invEquip(G.inv.indexOf(o));const c=mesure();
      res.push([h,a,b,c]);return [a,b,c];};
    let [a,b,c]=essai('crit',()=>statVal('crit',G.st)[0]);ok(b-a===E&&c===a,`CRIT.SYS R${R} : CRIT ${a} → ${b} % → retiré ${c}`);
    [a,b,c]=essai('visee',()=>robotPre());ok(b>a&&c===a,`VISÉE R${R} : PRE ${a} → ${b}`);
    [a,b,c]=essai('blindage',()=>robotDefNu());ok(b-a===E&&c===a,`BLINDAGE.RT R${R} : DEF ${a} → ${b}`);
    [a,b,c]=essai('force',()=>robotDegs()[1]);ok(b>a&&c===a,`FORCE R${R} : dégâts max ${a} → ${b} (+${2*E} %)`);
    [a,b,c]=essai('echo',()=>G.st.capteur);ok(b-a===2&&c===a,`ÉCHO.SCAN R${R} : vue ${a} → ${b}`);
    [a,b,c]=essai('regen',()=>{const e=G.st.energie;G.st.energie=0;regen(false);const g=G.st.energie;G.st.energie=e;return Math.round(g*1000)/1000;});
    ok(Math.abs(b/a-(1+5*E/100))<1e-6&&c===a,`RÉGÉN.CELL R${R} : recharge ${a} → ${b} par battement`);
    [a,b,c]=essai('sourdine',()=>{lastRun=false;return stealthCalc(10,'dig',false,0,false,digMult());});
    ok(b<a&&c===a,`SOURDINE R${R} : portée en forant ${a} → ${b} cases (base 10)`);
    [a,b,c]=essai('signature',()=>noticeCh());ok(Math.abs(b/a-(1-2.5*E/100))<1e-9&&c===a,`SIGNATURE R${R} : chance d’être remarqué ${a*100} → ${Math.round(b*1000)/10} % par battement`);
    [a,b,c]=essai('recyclage',()=>{const sp=BEASTS.findIndex(s=>!s.mine);G.st.energie=10;butinMort({sp,x:G.px,y:G.py,nd:1});return G.st.energie;});
    ok(b-a===E&&c===a,`RECYCLAGE R${R} : énergie après un ennemi détruit ${a} → ${b}`);
    [a,b,c]=essai('traque',()=>{const sp=BEASTS.findIndex(s=>!s.mine);const z={sp,x:G.px+3,y:G.py,hunt:5};const y=traqueVoit(z);z.hunt=0;return (y?1:0)+(traqueVoit(z)?10:0);});
    ok(a===0&&b===1&&c===0,`TRAQUE R${R} (${2+Math.round(E/2)} cases) : ennemi en chasse à 3 cases signalé, pas un ennemi au calme`);
    // stats et survol : la part du hack est nommée
    neuf();met(hackCle('crit',R));met(hackCle('force',R));
    const ic=statInfo('crit').l.map(x=>x[0]).join('|'),id=statInfo('degats').l.map(x=>x[0]).join('|');
    ok(ic.includes('CRIT.SYS')&&id.includes('FORCE'),`survol des stats : « ${ic} » ; « ${id} »`);
    side();const hs=$('hstats').textContent;ok(/CRIT\s*\d+ %/.test(hs)&&hs.includes(String(5+E)),`colonne Stats : ${hs.replace(/\s+/g,' ').trim()}`);
    Object.assign(G.st,st0);}
  // 4. règles d'équipement
  {neuf();met(hackCle('crit',1));const o2=met(hackCle('crit',3));ok(!o2.eq,`deux CRIT.SYS : le second reste dans l’inventaire (« ${INV_MSG&&INV_MSG.m} »)`);
    const s1=met('hk_sursis'),s2=met('hk_symbiose');ok(s1.eq&&!s2.eq&&/Noyau/.test(INV_MSG.m),`un seul Noyau : SYMBIOSE refusée (« ${INV_MSG.m} »)`);
    neuf();met(hackCle('crit',1));met(hackCle('visee',1));const o3=met(hackCle('force',1));ok(!o3.eq&&/emplacements de hack/.test(INV_MSG.m),`niveau 1 : 2 emplacements, le troisième refusé`);
    const h=G.inv.find(o=>o.eq&&ITEMS[o.k].hk==='crit'),p0=sacPlaces(),c0=G.st.crit;invEquip(G.inv.indexOf(h));
    ok(!h.eq&&sacPlaces()===p0+1&&G.st.crit===c0-1,`retirer CRIT.SYS : rangé dans l’inventaire (${p0} → ${sacPlaces()} places), CRIT ${c0} → ${G.st.crit}`);
    invEquip(G.inv.indexOf(h));ok(h.eq&&G.st.crit===c0,'rééquipé');
    const pad=SAC_MAX-sacPlaces();G.inv.push({k:'repar',eq:0,n:pad});invEquip(G.inv.indexOf(h));
    ok(h.eq&&/Inventaire plein/.test(INV_MSG.m),'inventaire plein : retrait refusé');G.inv=G.inv.filter(o=>o.k!=='repar'||o.n!==pad);
    const n0=G.inv.length;invDrop(G.inv.indexOf(h));const sol=Object.values(G.items).some(l=>l.includes(h.k));
    ok(G.inv.length===n0-1&&sol&&G.st.crit===c0-1,'jeter un hack : il tombe au sol, son effet s’en va');
    ok(!!TL.o_hack&&itemTile(h.k)===TL.o_hack,'tuile au sol : la puce');
    ok(!Object.values(G.items).flat().some(estHack)||sol,'aucun hack dans le butin d’une carte neuve');
    let tire=0;for(let k=0;k<300;k++)if(estHack(equipTire()))tire++;ok(tire===0,'butin : equipTire ne donne jamais de hack');
    $('inventaire').hidden=false;invDraw();const t=$('inv').textContent;ok(/HACKS\s*1\/2/.test(t)&&/EMPLACEMENT LIBRE/.test(t),'fenêtre d’équipement : section HACKS, 1/2, un emplacement libre');invOpen(false);}
  // 5. Noyau
  {neuf();met('hk_sursis');G.st.vie=0;const v=mortForeuse();ok(!v&&G.st.vie===1&&!G.over&&!G.inv.some(o=>o.k==='hk_sursis'),`SURSIS : à 0 de vie, survie à 1 PV, hack effacé`);
    G.st.vie=0;ok(mortForeuse()&&G.over&&G.over.dead,'sans SURSIS : la foreuse est détruite');G.over=null;
    // SYMBIOSE (28 novembre 2026, définition d'origine) : récupération de vie × 2, baisse du fuel × 1,5 ; l'énergie n'est plus touchée
    {const mesure=symb=>{neuf();if(symb)met('hk_symbiose');Object.assign(G.st,{vie:50,vieT:0,fuel:100,fuelT:0});
       for(let k=0;k<24;k++)regen(false);return [G.st.vie-50,100-G.st.fuel];};
     const [v0,f0]=mesure(0),[v1,f1]=mesure(1),c=coutE(10);
     ok(v0===1&&v1===2&&f0===2&&f1===3&&c===10,`SYMBIOSE : en 24 battements de marche, vie +${v0} → +${v1}, fuel −${f0} → −${f1}, coup à ${c} d’énergie`);}
    neuf();G.niv=4;met('hk_heritage');met(hackCle('crit',2));met(hackCle('blindage',4));localStorage.removeItem('np-heritage');
    G.over={dead:true,forage:1};dead();const cle=JSON.parse(localStorage.getItem('np-heritage')||'null');$('overlay').hidden=true;$('overlay').classList.remove('noir');
    ok(cle&&cle.length===2&&cle[0]==='hk_heritage'&&cle[1]===hackCle('blindage',4),`HÉRITAGE à la mort : np-heritage = ${JSON.stringify(cle)}`);
    carte('atterrissage');const eq=G.inv.filter(o=>o.eq&&estHack(o.k)).map(o=>o.k);
    ok(eq.length===2&&eq.includes('hk_heritage')&&localStorage.getItem('np-heritage')===null,`nouvelle foreuse : ${eq.join(' + ')} équipés, clé vidée`);
    carte('atterrissage');ok(!G.inv.some(o=>estHack(o.k)),'la partie suivante ne reçoit plus rien');}
  // 6. terminal
  {neuf();const m=Object.values(G.term||{}).find(m=>m.s==='terminal');termOuvre(m.i);
    $('termMenu').querySelector('.tl[data-a="hack"]').click();let cartes=[...$('termOut').querySelectorAll('.hkc')];
    const sel=$('terminal').querySelector('.tl.sel');
    ok(cartes.length===3&&sel&&sel.classList.contains('hkc'),`ENCODAGE → HACK : ${cartes.length} cartes (${cartes.map(b=>b.querySelector('b').textContent).join(', ')}), la première choisie`);
    const k0=cartes.map(b=>b.dataset.k).join();termKey(new KeyboardEvent('keydown',{key:'ArrowRight'}));
    ok($('terminal').querySelector('.tl.sel')===cartes[1],'flèche droite : carte suivante');
    termKey(new KeyboardEvent('keydown',{key:'Escape'}));termOuvre(m.i);$('termMenu').querySelector('.tl[data-a="hack"]').click();
    cartes=[...$('termOut').querySelectorAll('.hkc')];ok(!m.hack&&cartes.map(b=>b.dataset.k).join()===k0,'renoncer (Échap) : la ligne reste, mêmes propositions au retour');
    const k=cartes[0].dataset.k;termKey(new KeyboardEvent('keydown',{key:'Enter'}));
    ok(m.hack===1&&G.inv.some(o=>o.k===k&&o.eq)&&$('termMenu').querySelector('.tl[data-a="hack"]')===null,`Entrée : ${ITEMS[k].n} actif, HACK : ENCODAGE DÉJÀ EFFECTUÉ`);
    closeTerminal();
    // tout plein : écraser
    neuf();met(hackCle('crit',1));met(hackCle('visee',1));G.inv.push({k:'repar',eq:0,n:SAC_MAX-sacPlaces()});
    const m2=Object.values(G.term).filter(x=>x.s==='terminal')[1]||m;m2.hack=0;m2.hkChoix=[hackCle('force',1),hackCle('regen',1),hackCle('echo',1)];
    termOuvre(m2.i);$('termMenu').querySelector('.tl[data-a="hack"]').click();$('termOut').querySelector('.hkc').click();
    const e=[...$('termOut').querySelectorAll('.hke')];ok(e.length===2,`emplacements et inventaire pleins : ${e.length} hacks à écraser proposés`);
    e[0].click();ok(m2.hack===1&&G.inv.some(o=>o.k===hackCle('force',1)&&o.eq)&&!G.inv.some(o=>o.k===hackCle('crit',1)),'écrasé : FORCE actif, CRIT.SYS effacé');
    closeTerminal();
    // Lab
    hackLab();ok($('termOut').querySelectorAll('.hkc').length===3&&!$('terminal').hidden,'Lab → Hacks : un choix parmi 3');closeTerminal();
    openItems();ok(/Hacks \(lecture\)/.test($('itList').textContent)&&$('itList').querySelectorAll('.hktab tr').length>=18,'Lab → Items : famille Hacks en lecture');closeItems();}
  // 7. anciennes données
  {neuf();const g=JSON.parse(JSON.stringify(G));delete g.st.nivMax;g.inv=g.inv.filter(o=>!estHack(o.k));G=g;invMigre();
    ok(SLOTS.hack.n===2&&hacksPortes().length===0,'ancienne partie sans hacks : relue, 2 emplacements');
    const vieux=JSON.parse(JSON.stringify(ITEMS_DEF));vieux.mod.viseur={crit:12};itemsApplique(vieux);
    const tous=Object.keys(ITEMS).filter(estHack).length,etat=itemsEtat();
    ok(ITEMS.viseur.mod.crit===12&&tous===10*14+3&&!Object.keys(etat.mod).some(estHack),`réglages d’objets enregistrés (Viseur CRIT 12) : gardés, ${tous} hacks présents, jamais enregistrés`);
    itemsApplique(JSON.parse(JSON.stringify(ITEMS_DEF)));}
  window.requestAnimationFrame=raf;genRemet(sauve);
  return out.join('\n');
})()
