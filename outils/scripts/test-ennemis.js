/* Essais des cinq ennemis du 21 novembre 2026, des styles de patrouille « navette » et « garde », et de la répartition par lieu.
   Tout se joue dans le vrai moteur, sur une carte dégagée (ou une grande base pour la garde et les lieux). Une ligne par essai.
   25 novembre 2026 : les patrouilles passent par pass(100) comme le reste. Depuis l'horloge par créature, beastsAct() ne fait
   plus que le battement (détection, effets) et ne déplace plus personne : l'appeler seul laissait la bête immobile. */
(() => {
  const out=[],v=(nom,ok,det)=>out.push((ok?'ok    ':'ÉCHEC ')+nom+(det!=null?' — '+det:'')),sauve=JSON.parse(JSON.stringify(GEN)),E=k=>BEASTS.findIndex(b=>b.key===k);
  const arene=()=>{GEN.taille=3;recRange();recPrend('classique');GEN.structure=0;NIV_GEN=1;newGame();for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++)G.t[idx(x,y)]=GROUND;G.beasts=[];G.animals=[];G.patr={};G.px=30;G.py=24;G.st.vie=G.st.vieMax=1000;G.eff={};G.over=null;G.las=[];G.lz={};computeFOV();};
  const bete=(k,x,y,chasse)=>{const b=newBeast(E(k),x,y,-1,0);if(chasse){b.hunt=1;b.mem=[G.px,G.py];}G.beasts.push(b);return b;},bat=n=>{for(let k=0;k<n&&!G.over;k++)pass(100);};
  // drone : traverse un gouffre, pas le crabot
  arene();for(let y=1;y<H-1;y++)for(let x=36;x<=38;x++)G.t[idx(x,y)]=CHASM;
  {const d=bete('drone',44,24,true),c=bete('crabos',44,26,true);bat(14);v('drone : franchit le gouffre pour atteindre la foreuse',d.x<36||!G.beasts.includes(d),`drone en x=${d.x}`);v('crabot : arrêté par le gouffre',c.x>38,`crabot en x=${c.x}`);}
  // artilleur : cadence et recul
  arene();{const a=bete('artilleur',34,24,true);let tirs=0;const h=hurtRobot;hurtRobot=(b,sp,o)=>{if(o&&o.laser)tirs++;return h(b,sp,o);};
    const sv=stepAway;stepAway=()=>{};bat(10);stepAway=sv;v('artilleur : un tir tous les deux battements, à 4 cases',tirs>=4&&tirs<=6,`${tirs} tirs en 10 battements`);
    a.x=31;a.y=24;const d0=cheb(a,G.px,G.py);bat(3);hurtRobot=h;v('artilleur : recule quand la foreuse est à côté',cheb(a,G.px,G.py)>d0,`distance ${d0} → ${cheb(a,G.px,G.py)}`);}
  // soudeur
  arene();{const c=bete('crabos',40,24,false),s=bete('soudeur',42,24,false);c.hp=5;G.px=5;G.py=5;bat(6);v('soudeur : répare un allié à portée, 5 PV par battement',c.hp>=15,`PV du crabot 5 → ${c.hp}`);
    c.hp=pvDe(BEASTS[c.sp]);bat(2);v('soudeur : ne dépasse pas la vie maximale',c.hp===pvDe(BEASTS[c.sp]));}
  // englueur
  arene();{bete('englueur',33,24,true);let glu=0;for(let k=0;k<20;k++){pass(100);glu=Math.max(glu,G.eff.glu||0);}v('englueur : englue la foreuse à distance',glu>0,`glu ${glu} battements`);
    G.eff.glu=3;v('foreuse engluée : pas deux fois plus longs',stepDur(GROUND,false)===2*DUR.pas*5/robotVit());}
  // gardien
  arene();{const g=bete('gardien',31,24,true);bat(6);v('gardien : frappe la foreuse au contact',G.st.vie<1000,`vie 1000 → ${G.st.vie}`);}
  // navette et garde, sur une grande base
  {recRange();recPrend('base');ambiance('citadelle','base');GEN.taille=3;SANS_VAISSEAU=true;NIV_GEN=3;niveau();SANS_VAISSEAU=false;G.beasts=[];G.animals=[];G.patr={};G.px=1;G.py=1;
    const sol=[];for(let i=0;i<W*H;i++)if(G.t[i]===FLOOR)sol.push(i);
    let pos,b,P;for(let e=0;e<8;e++){G.beasts=[];G.patr={};pos=sol[rnd(0,sol.length-1)];b=newBeast(E('crabos'),pos%W,(pos/W)|0,-1,0);b.gi=0;G.beasts.push(b);patInit({pat:'navette'},0,[b]);P=G.patr[0];if(P.pts.length===2)break;}   // une pièce close n'offre pas de second point : on en essaie une autre
    const vus=new Set();let loin=0;
    for(let k=0;k<400;k++){pass(100);loin=Math.max(loin,Math.hypot(b.x-pos%W,b.y-((pos/W)|0)));P.pts.forEach((p,n)=>{if(Math.hypot(p[0]-b.x,p[1]-b.y)<=2)vus.add(n);});}
    v('navette : va-et-vient entre deux points éloignés',P.pts.length===2&&vus.size===2&&loin>=6,`${P.pts.length} points, ${vus.size} atteints, éloignement ${loin.toFixed(0)} cases`);
    G.beasts=[];G.patr={};const s=G.sites[0],pres=sol.filter(i=>{const d=Math.hypot(i%W-s.x,((i/W)|0)-s.y);return d>4&&d<10;}),p2=pres[rnd(0,pres.length-1)]??sol[0],g=newBeast(E('gardien'),p2%W,(p2/W)|0,-1,0);g.gi=1;G.beasts.push(g);patInit({pat:'garde'},1,[g]);
    let mx=0;for(let k=0;k<300;k++){pass(100);if(k>80)mx=Math.max(mx,Math.hypot(g.x-G.patr[1].hx,g.y-G.patr[1].hy));}
    v('garde : se poste près d’un point à garder et y reste',mx<=5,`poste à ${Math.hypot(G.patr[1].hx-s.x,G.patr[1].hy-s.y).toFixed(0)} cases du site, écart maximal ${mx.toFixed(0)}`);}
  // lieux : sur dix bases, où naissent les membres des groupes réservés au bâti et à l'extérieur
  {let bOk=0,bTot=0,eOk=0,eTot=0;const G0=GROUPES;GROUPES=GROUPES_DEF();
    for(let k=0;k<10;k++){recRange();recPrend('base');ambiance(Object.keys(AMBIANCES.base)[k],'base');GEN.taille=3;SANS_VAISSEAU=true;NIV_GEN=3;niveau();SANS_VAISSEAU=false;
      for(const o of [...G.beasts,...G.animals]){const g=GROUPES.liste[o.gr];if(!g||!g.lieux||g.lieux.length!==1)continue;const l=lieuDe(idx(o.x,o.y));if(g.lieux[0]==='bati'){bTot++;if(l==='bati')bOk++;}else if(g.lieux[0]==='ext'){eTot++;if(l==='ext')eOk++;}}}
    GROUPES=G0;v('lieux : les groupes du bâti naissent dans le bâti',bOk>=bTot*.9,`${bOk}/${bTot}`);v('lieux : les groupes d’extérieur naissent dehors',eOk>=eTot*.9,`${eOk}/${eTot}`);}
  genRemet(sauve);return out.join('\n');
})()
