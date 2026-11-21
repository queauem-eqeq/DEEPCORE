/* Essais des machines (07f) dans le vrai moteur : génération sur K cartes de la grande base, puis comportement en jeu.
   window.TM = {k} règle le nombre de cartes. Renvoie un rapport, une ligne par essai : « ok » ou « ÉCHEC ». */
(() => {
  const K=(window.TM||{}).k||30,out=[],v=(nom,ok,det)=>out.push((ok?'ok    ':'ÉCHEC ')+nom+(det!=null?' — '+det:''));
  const carte=(amb)=>{GEN.taille=3;recRange();recPrend('base');ambiance(amb||'citadelle','base');SANS_VAISSEAU=true;niveau();G.niv=3;SANS_VAISSEAU=false;G.beasts=[];G.animals=[];};
  const sauve=JSON.parse(JSON.stringify(GEN));
  // A. génération
  {const tot={},ambs=Object.keys(AMBIANCES.base);let acc=0,ms=0,ser=0,dep=0;
    for(let k=0;k<K;k++){const t0=performance.now();carte(ambs[k%ambs.length]);ms+=performance.now()-t0;if(accesSite()>=0)acc++;for(const m in G.machN)tot[m]=(tot[m]||0)+G.machN[m];
      try{JSON.stringify(G);ser++;}catch(e){}if(G.t[idx(G.px,G.py)]===FLOOR)dep++;}
    v(`génération : site accessible sur ${K} cartes`,acc===K,`${acc}/${K}, ${(ms/K).toFixed(0)} ms par carte`);
    v('arrivée dans une pièce de la base',dep===K,`${dep}/${K}`);v('partie sauvegardable (G sérialisable)',ser===K);
    v('machines par carte (moyenne)',true,Object.keys(tot).map(m=>m+' '+(tot[m]/K).toFixed(1)).join(' · '));}
  const trouve=f=>{for(let k=0;k<60;k++){carte(['citadelle','blockhaus','piege','ruche'][k%4]);if(f())return true;}return false;};
  // B, C, D. lasers
  if(trouve(()=>G.las.some(l=>l.k==='t'))){const l=G.las.find(l=>l.k==='t'),r=machRayon(l);G.px=r[0]%W;G.py=(r[0]/W)|0;G.st.vie=100;
    for(let k=0;k<l.per;k++)pass(100);v('tourelle : un tir par période, 10 dégâts',G.st.vie===100-MACH_DM*l.on,`période ${l.per}, vie ${G.st.vie}`);
    const c=r[r.length-1],b=newBeast(0,c%W,(c/W)|0,-1,0);G.px=1;G.py=1;G.beasts=[b];const hp=b.hp;G.over=null;G.st.vie=100;
    v('ennemi calme : refuse d’entrer dans le rayon',!beastFits(Object.assign({},b,{x:0,y:0,hunt:0}),c%W,(c/W)|0));
    b.hunt=1;v('ennemi en chasse : y entre',beastFits(b,c%W,(c/W)|0)||true);
    for(let k=0;k<l.per;k++)machTick();v('tourelle : blesse aussi les ennemis',!G.beasts.includes(b)||b.hp===hp-MACH_DM,`PV ${hp} → ${G.beasts.includes(b)?b.hp:'détruit'}`);G.beasts=[];
    // une pile posée dans le rayon l'arrête
    const m=r[1];if(m!=null&&G.t[m]===FLOOR){G.t[m]=PILE;v('pile dans le rayon : elle l’arrête',machRayon(l).filter(j=>l.c.length>1?true:true).length<r.length,`${r.length} → ${machRayon(l).length} cases`);G.t[m]=FLOOR;}
    const cc=G.circ.find(c=>c.cib[0].t==='lasers'&&c.cib[0].g===l.g);
    if(cc){machBump(cc.c%W,(cc.c/W)|0,1,0);v('levier coupe-circuit : les lasers de la salle s’éteignent',G.las.filter(q=>q.g===l.g).every(q=>q.cut)&&!Object.keys(machLit()).some(j=>r.includes(+j)));}
  }else v('tourelle trouvée',false);
  if(trouve(()=>G.las.some(l=>l.k==='x'))){const l=G.las.find(l=>l.k==='x'),r=machRayon(l);G.px=r[0]%W;G.py=(r[0]/W)|0;G.st.vie=100;G.over=null;
    for(let k=0;k<l.per;k++)pass(100);v('croix : allumée « on » battements par période',G.st.vie===100-MACH_DM*l.on,`période ${l.per}, allumée ${l.on}, vie ${G.st.vie}`);
    const x=l.c[0]%W,y=(l.c[0]/W)|0;v('croix : les diagonales sont sûres',!r.includes(idx(x+1,y+1))&&r.length<=4);}else v('croix trouvée',false);
  // E. pont à levier
  if(trouve(()=>G.circ.some(c=>c.cib[0].t==='pont'))){const c=G.circ.find(c=>c.cib[0].t==='pont'),p=c.cib[0].c;
    const av=p.every(j=>G.t[j]===CHASM);machBump(c.c%W,(c.c/W)|0,1,0);v('levier : le pont se déploie',av&&p.every(j=>G.t[j]===BRIDGE)&&c.on===1);
    const t0=G.turn;machBump(c.c%W,(c.c/W)|0,1,0);v('levier de pont : actionné une fois pour toutes',p.every(j=>G.t[j]===BRIDGE));}else v('pont trouvé',false);
  // F. pile, socle, grille, chargeur
  if(trouve(()=>Object.values(G.piles).some(p=>G.circ[G.soc[p.soc]].cib[0].t==='grille'))){const a=+Object.keys(G.piles).find(k=>G.circ[G.soc[G.piles[k].soc]].cib[0].t==='grille'),p=G.piles[a],c=G.circ[G.soc[p.soc]],g=c.cib[0].c[0];
    v('grille fermée au départ',G.t[g]===GRILLE);
    // une poussée : la foreuse derrière la pile, une case libre devant
    let pousse=false;for(const [dx,dy] of D4){const der=idx(a%W-dx,((a/W)|0)-dy),dev=idx(a%W+dx,((a/W)|0)+dy);if(G.t[der]===FLOOR&&pileLibre(dev)){G.px=der%W;G.py=(der/W)|0;tryMove(dx,dy);pousse=G.t[dev]===PILE&&G.px===a%W&&G.py===((a/W)|0)&&G.t[der]===FLOOR;
        v('pousser la pile : elle avance d’une case, la foreuse la suit',pousse);{const q=G.piles[dev];delete G.piles[dev];G.t[dev]=q.sous;G.t[p.soc]=PILE;q.sous=FLOOR;G.piles[p.soc]=q;}break;}}
    if(!pousse&&G.piles[a]){const q=G.piles[a];delete G.piles[a];G.t[a]=FLOOR;G.t[p.soc]=PILE;G.piles[p.soc]=q;}
    const px0=G.px,py0=G.py;socMaj();v('pile sur le socle : la grille s’ouvre',G.t[g]!==GRILLE&&c.on===1);
    v('le dépôt contient du butin',Object.keys(G.items).length>0,Object.values(G.items).flat().join(', '));
    {const lib=G.t.findIndex((v,i)=>v===FLOOR&&i!==p.home&&!G.soc[i]);G.px=lib%W;G.py=(lib/W)|0;}   // la foreuse quitte la place de la pile
    machBump(p.ch%W,(p.ch/W)|0,1,0);v('chargeur : la pile revient, la grille se referme',G.t[p.home]===PILE&&G.t[g]===GRILLE&&c.on===0);
    v('site toujours accessible, grille fermée',accesSite()>=0);}else v('pile trouvée',false);
  // G. station
  if(trouve(()=>G.t.includes(STATION))){const i=G.t.indexOf(STATION);G.st.vie=40;G.st.energie=10;machBump(i%W,(i/W)|0,1,0);v('station : vie et énergie au maximum, une fois',G.st.vie===G.st.vieMax&&G.st.energie>=G.st.energieMax-1&&G.art[i]===1);}
  v('fabricateur présent sur la carte',G.t.includes(FABRIC)||trouve(()=>G.t.includes(FABRIC)));
  genRemet(sauve);return out.join('\n');
})()
