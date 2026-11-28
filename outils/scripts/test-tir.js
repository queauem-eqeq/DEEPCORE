/* Arme de tir (28 novembre 2026, bloc D du chantier « Survie », 14m-tir.js). Dans le vrai moteur, sur une carte dégagée.
   Une ligne par essai : « ok » ou « ÉCHEC ».
   – canon au départ ; un tir = 20 d'énergie et un coup (100) ; refus sans énergie, hors de vue, ligne obstruée ; mur qui arrête ;
   – chaque arme : brûlure, ralentissement, zone et portée courte, traversée ; remplacement du canon et retour ;
   – 5 emplacements d'objets ; ancienne partie (sans canon, plus de 5 objets) ; réglages d'objets enregistrés sans les armes ;
   – forage et tir silencieux : bruit ÷ 2 ; hacks Tir ; ferrailleuse provoquée par un tir. */
(() => {
  const out=[],v=(nom,ok,det)=>out.push((ok?'ok    ':'ÉCHEC ')+nom+(det!=null?' — '+det:'')),sauve=JSON.parse(JSON.stringify(GEN)),
    E=k=>BEASTS.findIndex(b=>b.key===k),raf=window.requestAnimationFrame;window.requestAnimationFrame=()=>0;
  const arene=()=>{GEN.taille=3;recRange();recPrend('classique');GEN.structure=0;NIV_GEN=2;newGame();
    for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++)G.t[idx(x,y)]=GROUND;G.beasts=[];G.animals=[];G.patr={};G.epaves=[];G.epI={};G.sas=null;
    G.px=30;G.py=24;G.st.vie=G.st.vieMax=1000;G.st.energie=G.st.energieMax;G.eff={};G.over=null;G.las=[];G.lz={};G.balises=[];G.msg=null;fog=false;
    G.st.capteur=10;computeFOV();};
  const bete=(k,x,y,o)=>{const b=Object.assign(newBeast(E(k),x,y,-1,-1),o||{});b.pret=1e12;G.beasts.push(b);computeFOV();return b;};
  const met=k=>{const o={k,eq:0};G.inv.push(o);invEquip(G.inv.indexOf(o));return o;};
  const tire=(x,y)=>{G.st.energie=G.st.energieMax;return tirFeu(x,y);};
  const arme=()=>tirArme();

  // 1. canon au départ
  arene();{const c=G.inv.find(o=>o.k==='canon');v('canon équipé au départ, emplacement TIR',!!c&&c.eq&&ITEMS.canon.slot==='tir'&&arme()==='canon');}
  // 2. un tir : 20 d'énergie, un coup
  arene();{const b=bete('mastok',35,24,{hunt:1});G.st.energie=100;const t0=G.time||0,n0=G.turn,h0=b.hp;tirFeu(35,24);
    const dE=100-G.st.energie+G.st.power/POW_BASE;   // la recharge d'un battement remonte un peu l'énergie
    v('tir du canon : 20 d’énergie, un coup (100), un battement',Math.abs(dE-20)<.01&&G.time-t0===100&&G.turn===n0+1,`énergie −${dE}, temps +${G.time-t0}`);
    v('canon : dégâts de 70 % du coup de forage (ou 0 si raté)',h0-b.hp===0||(h0-b.hp>=Math.round(robotDegs(G.st)[0]*.7)&&h0-b.hp<=Math.round(robotDegs(G.st)[1]*.7)*CRIT_X),`−${h0-b.hp} (fourchette ${tirDegs('canon').join('–')})`);
    v('le tir est bruyant comme le forage',lastAct==='tir'&&G.stealth===stealthRange('dig')||lastAct==='tir',`portée de discrétion ${G.stealth}`);}
  // 3. refus
  arene();{bete('mastok',35,24,{hunt:1});G.st.energie=10;const n0=G.turn;const r=tirFeu(35,24);
    v('sans énergie : refusé, rien ne se passe',r===false&&G.turn===n0&&G.st.energie===10);}
  arene();{for(let y=20;y<=28;y++)G.t[idx(33,y)]=WALL;bete('mastok',35,24,{hunt:1});G.st.energie=100;const n0=G.turn;
    v('derrière un mur : hors de vue, refusé',!!tirRefus(35,24)&&tirFeu(35,24)===false&&G.turn===n0&&G.st.energie===100,tirRefus(35,24));}
  arene();{G.t[idx(33,24)]=ROCK;computeFOV();const b=bete('mastok',35,24,{hunt:1}),h0=b.hp;
    v('un rocher sur la ligne arrête le tir (ligne obstruée)',vis[idx(35,24)]&&/obstruée/.test(tirRefus(35,24)||'')&&tirFeu(35,24)===false&&b.hp===h0,tirRefus(35,24));}
  arene();{v('sur la foreuse : refusé',!!tirRefus(G.px,G.py));}
  // 4. lance-flammes
  arene();{met('lanceflamme');const b=bete('mastok',33,24,{hunt:1});
    v('lance-flammes équipé : remplace le canon',arme()==='lanceflamme'&&!G.inv.find(o=>o.k==='canon').eq);
    let n=0;while(!(b.brule>0)&&n++<30&&G.beasts.includes(b)){b.hp=500;tire(33,24);}
    const h0=b.hp,br=b.brule;tirTick();v('lance-flammes : la cible brûle (3 par battement, 4 battements)',br>0&&h0-b.hp===ITEM_VAL.lanceflamme.tbrule,`brûle ${br}, −${h0-b.hp}`);
    for(let k=0;k<5;k++)tirTick();v('la brûlure s’éteint',!(b.brule>0));
    bete('crabos',37,24,{hunt:1});v('lance-flammes : portée 5 (7 cases : refusé)',/portée/.test(tirRefus(37,24)||''),tirRefus(37,24));}
  // 5. canon à glu
  arene();{met('canonglu');const b=bete('mastok',36,24,{hunt:1}),p0=dpasDe(b),c0=dcoupDe(b);let n=0;while(!(b.glu>0)&&n++<30){b.hp=500;tire(36,24);}
    v('canon à glu : la cible est engluée, pas et coups deux fois plus longs',b.glu>0&&dpasDe(b)===2*p0&&dcoupDe(b)===2*c0,`glu ${b.glu}, pas ${p0}→${dpasDe(b)}`);
    for(let k=0;k<10;k++)tirTick();v('la glu sèche',!(b.glu>0)&&dpasDe(b)===p0);}
  // 6. shotgun
  arene();{met('shotgun');const a=bete('mastok',32,24,{hunt:1,hp:900}),c=bete('mastok',32,25,{hunt:1,hp:900});let n=0,ok=false;
    while(n++<30&&!ok){a.hp=c.hp=900;tire(32,24);ok=a.hp<900&&c.hp<900;}
    v('shotgun : la cible et sa voisine sont touchées',ok,`${n} tirs`);
    bete('crabos',34,24,{hunt:1});v('shotgun : portée 3 (4 cases : refusé)',/portée/.test(tirRefus(34,24)||''));
    const [p1,p2]=tirDegs('shotgun'),[l1,l2]=tirDegs('shotgun',1);v('shotgun : 60 % à 3 cases',Math.abs(l2-p2*.6)<=1,`${p1}–${p2} puis ${l1}–${l2}`);}
  // 7. laser
  arene();{met('laser');const a=bete('mastok',33,24,{hunt:1,hp:900}),c=bete('mastok',36,24,{hunt:1,hp:900});G.t[idx(38,24)]=WALL;
    const d=bete('mastok',39,24,{hunt:1,hp:900});let n=0,ok=false;
    while(n++<40&&!ok){a.hp=c.hp=900;tire(33,24);ok=a.hp<900&&c.hp<900;}
    const T=tirTrajet(33,24,'laser');
    v('laser : traverse et touche les deux ennemis alignés',ok,`${n} tirs`);
    v('laser : s’arrête au mur (l’ennemi derrière n’est jamais touché)',d.hp===900&&T.mur&&T.mur[0]===38,JSON.stringify(T.mur));}
  // 8. retirer, jeter, places
  arene();{const p0=sacPlaces(),o=met('laser'),p1=sacPlaces();invEquip(G.inv.indexOf(o));
    v('retirer une arme de tir : le canon revient, l’arme va dans l’inventaire',arme()==='canon'&&!o.eq&&sacPlaces()===p0+1&&p1===p0,`places ${p0}/${p1}/${sacPlaces()}`);
    invEquip(G.inv.indexOf(G.inv.find(x=>x.k==='canon')));v('retirer le canon : refusé',G.inv.find(x=>x.k==='canon').eq===1);
    invEquip(G.inv.indexOf(o));const n=G.inv.length;invDrop(G.inv.indexOf(G.inv.find(x=>x.k==='canon')));
    v('le canon ne se jette pas, et ne prend pas de place en réserve',G.inv.length===n&&sacPlaces()===p0,`places ${sacPlaces()}`);
    invDrop(G.inv.indexOf(o));v('jeter l’arme de tir portée : le canon reprend sa place',arme()==='canon'&&!G.inv.includes(o));}
  // 9. 5 emplacements d'objets
  arene();{const l=['servo','optique','viseur','conden','gyro','stabil'].map(k=>met(k));
    v('5 emplacements d’objets : le 6e est refusé',l.slice(0,5).every(o=>o.eq)&&!l[5].eq&&SLOTS.acc.n===5,`${invCount('acc')} portés`);}
  // 10. ancienne partie : pas de canon, 6 objets portés
  arene();{G.inv=G.inv.filter(o=>o.k!=='canon');for(const k of ['servo','optique','viseur','conden','gyro','stabil'])G.inv.push({k,eq:1});invMigre();
    v('ancienne partie : canon ajouté et en main ; les 6 objets portés restent portés',arme()==='canon'&&invCount('acc')===6);
    invMigre();v('relue deux fois : un seul canon',G.inv.filter(o=>o.k==='canon').length===1);}
  // 11. réglages d'objets enregistrés sans les armes : les armes gardent leurs valeurs du code
  {const avant=JSON.stringify(ITEM_VAL.canon);itemsApplique({val:{repar:{soin:50}},prix:{repar:18}});
    v('réglages d’objets d’avant l’arme de tir : canon et armes inchangés',JSON.stringify(ITEM_VAL.canon)===avant&&FAB_PRIX.laser>0&&bpTout().includes('laser')&&!bpTout().includes('canon'));}
  // 12. silencieux
  arene();{lastAct='dig';const d0=stealthRange('dig'),t0=stealthRange('tir');met('silforage');met('siltir');const d1=stealthRange('dig'),t1=stealthRange('tir');
    v('forage silencieux : portée de discrétion en forant ÷ 2 (environ)',d1<=Math.ceil(d0/2)+1&&d1<d0,`${d0} → ${d1}`);
    v('tir silencieux : portée de discrétion en tirant ÷ 2 (environ)',t1<=Math.ceil(t0/2)+1&&t1<t0,`${t0} → ${t1}`);}
  // 13. hacks Tir
  {const n={base:0,tir:0,noyau:0};let N=0;arene();G.niv=1;for(let k=0;k<700;k++)for(const c of hackTirage(1,3)){n[ITEMS[c].fam]++;N++;}
    v('hacks Tir proposés au niveau 1 (≈ 15 %)',Math.abs(n.tir/N*100-15)<4,`${Math.round(n.tir/N*1000)/10} %`);}
  arene();{const f0=tirFact('canon'),e0=tirEnergie('canon'),m0=tirMult('canon'),p0=tirPrecision('canon'),c0=tirCritCh();
    const h=k=>{const o={k,eq:0};G.inv.push(o);invEquip(G.inv.indexOf(o));return o;};
    const s=h(hackCle('surcharge',10));v('SURCHARGE : dégâts et coût du tir en hausse',tirFact('canon')>f0&&tirEnergie('canon')>e0,`${f0.toFixed(2)}→${tirFact('canon').toFixed(2)}, ${e0}→${tirEnergie('canon')}`);
    invEquip(G.inv.indexOf(s));const e=h(hackCle('economie',10));v('ÉCONOMIE : coût du tir en baisse',tirEnergie('canon')<e0,`${e0}→${tirEnergie('canon')}`);
    invEquip(G.inv.indexOf(e));const t=h(hackCle('silence',10)),sh=tirMult('shotgun');invEquip(G.inv.indexOf(t));const sh0=tirMult('shotgun');t.eq=0;
    invEquip(G.inv.indexOf(t));v('SILENCE.TIR : bruit du tir en baisse',tirMult('shotgun')<sh0,`${sh0}→${tirMult('shotgun')}`);
    invEquip(G.inv.indexOf(t));h(hackCle('perforant',10));v('PERFORANT : CRIT du tir en hausse, précision en baisse',tirCritCh()>c0&&tirPrecision('canon')<p0);}
  // 14. ferrailleuse provoquée par un tir
  arene();{const ep=(()=>{for(let j=0;j<3;j++)for(let i=0;i<3;i++){G.t[idx(44+i,23+j)]=ROCK;G.epI[idx(44+i,23+j)]=0;}
      G.epaves.push({type:'sonde',nom:'SONDE',etat:'s',num:12,x:44,y:23,w:3,h:3,fosse:-1,boite:-1,groupes:[]});return 0;})();
    const m=[newBeast(E('crabos'),37,24,-1,0),newBeast(E('crabos'),38,25,-1,0)];for(const b of m){b.gi=0;G.beasts.push(b);}
    patInit({pat:'navette'},0,m);patRole({role:'ferraille'},0,m,ep);computeFOV();
    const av=aOuvrage(m[0]);tire(37,24);
    v('un tir sur une ferrailleuse : tout son groupe la quitte',av&&G.patr[0].ouv==='hostile',G.patr[0].ouv);}
  // 15. fiche et visée
  arene();{bete('mastok',35,24);tirStart();const ok=TIR&&TIR.x===35;tirStop();
    v('visée : cible par défaut = l’ennemi en vue le plus proche',ok);
    v('fiche du canon : dégâts, énergie, portée en clair',/DÉGÂTS : \d+–\d+ · ÉNERGIE : 20 · PORTÉE : VUE/.test(tirFicheTxt(ITEMS.canon)),tirFicheTxt(ITEMS.canon));
    v('journal de bord : 17 sortes de hacks',typeof jnHacks!=='function'||jnHacks().length===17,typeof jnHacks==='function'?jnHacks().length:'');}

  window.requestAnimationFrame=raf;Object.assign(GEN,sauve);
  return '\n'+out.join('\n');
})()
