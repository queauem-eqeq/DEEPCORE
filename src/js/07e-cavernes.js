/* ---------- Réseau de cavernes (21 novembre 2026) ----------
   Recette « cavernes » : tout est sous roche. Des cavernes irrégulières (automate cellulaire) sont creusées dans un massif
   plein, reliées par des boyaux sinueux (arbre couvrant, plus quelques boucles et culs-de-sac). ZONE vaut 0 dans les
   cavernes et les boyaux (l'« extérieur » de cette recette) et 1 dans la roche : distExt() donne donc la distance à la
   caverne la plus proche. Les bâtiments sont ensuite enchâssés dans la roche (07b, mode `cav`) avec une porte qui regarde
   vers une caverne, reliée à elle par un petit boyau (reliePortes). */
function cavernes(t){
  const N=W*H,z=new Uint8Array(N).fill(1);t.fill(MOUNT);
  const part=Math.max(.18,Math.min(.6,autour('cvPart',.12)/100)),nb=Math.max(1,Math.min(14,Math.round(autour('cvNb',.25)))),cible=N*part,
    haut=(x,y)=>x>=2&&y>=2&&x<W-2&&y<H-2,ouvre=(x,y)=>{if(haut(x,y)){const i=idx(x,y);t[i]=GROUND;z[i]=0;}};
  const poids=Array.from({length:nb},()=>.6+Math.random()*.8),ps=poids.reduce((a,b)=>a+b,0),cen=[];
  for(let n=0;n<nb;n++){
    const a=cible*poids[n]/ps,asp=1+Math.random()*.8;   // surface visée pour cette caverne, rapport largeur/hauteur
    let w=Math.round(Math.sqrt(a*3.3*asp)),h=Math.round(a*3.3/Math.max(1,w));w=Math.max(6,Math.min(W-8,w));h=Math.max(5,Math.min(H-8,h));
    const cells=caBlob(w,h,.52,4);if(cells.length<8)continue;
    let best=null,bd=-1;   // meilleur candidat : le plus loin des cavernes déjà posées
    for(let k=0;k<40;k++){const x0=rnd(3,Math.max(3,W-w-4)),y0=rnd(3,Math.max(3,H-h-4)),cx=x0+w/2,cy=y0+h/2;
      let d=1e9;for(const c of cen)d=Math.min(d,Math.hypot(c[0]-cx,c[1]-cy));if(d>bd){bd=d;best=[x0,y0];}}
    const [x0,y0]=best;let sx=0,sy=0;for(const [x,y] of cells){ouvre(x0+x,y0+y);sx+=x0+x;sy+=y0+y;}
    const mx=sx/cells.length,my=sy/cells.length;   // la case de la caverne la plus proche de son centre : là partent les boyaux
    let c0=cells[0],cd=1e9;for(const [x,y] of cells){const d=Math.hypot(x0+x-mx,y0+y-my);if(d<cd){cd=d;c0=[x,y];}}
    cen.push([x0+c0[0],y0+c0[1]]);}
  if(!cen.length){const x=W>>1,y=H>>1;for(let dy=-3;dy<=3;dy++)for(let dx=-4;dx<=4;dx++)ouvre(x+dx,y+dy);cen.push([x,y]);}
  // boyau : marche sinueuse de a vers b, de 1 à 2 cases de large
  const boyau=(a,b,larg)=>{let [x,y]=a;const [tx,ty]=b;let g=W*H,k=0;
    while((x!==tx||y!==ty)&&g-->0){ouvre(x,y);if(larg>1&&Math.random()<.45)ouvre(x+(k%2?1:0),y+(k%2?0:1));
      const dx=tx-x,dy=ty-y,r=Math.random();let mx=0,my=0;
      const majeur=Math.abs(dx)>=Math.abs(dy);
      if(r<.58){if(majeur)mx=Math.sign(dx);else my=Math.sign(dy);}
      else if(r<.86){if(majeur&&dy)my=Math.sign(dy);else if(!majeur&&dx)mx=Math.sign(dx);else if(majeur)my=Math.random()<.5?1:-1;else mx=Math.random()<.5?1:-1;}
      else{const d=D4[rnd(0,3)];mx=d[0];my=d[1];}
      if(!mx&&!my)continue;
      if(!haut(x+mx,y+my)){if(majeur)my=Math.sign(dy)||1;else mx=Math.sign(dx)||1;if(!haut(x+mx,y+my))continue;}
      x+=mx;y+=my;k++;}
    ouvre(tx,ty);};
  // arbre couvrant (Prim) entre les centres, puis quelques boucles
  const dans=[0],reste=cen.map((_,i)=>i).slice(1),arcs=[];
  while(reste.length){let bi=-1,bj=-1,bd=1e9;for(const i of dans)for(const j of reste){const d=Math.hypot(cen[i][0]-cen[j][0],cen[i][1]-cen[j][1]);if(d<bd){bd=d;bi=i;bj=j;}}
    arcs.push([bi,bj]);dans.push(bj);reste.splice(reste.indexOf(bj),1);}
  for(const [i,j] of arcs)boyau(cen[i],cen[j],Math.random()<.35?2:1);
  const nbBoucles=Math.round(autour('cvBoyaux',.2));
  for(let k=0;k<nbBoucles&&cen.length>2;k++){const i=rnd(0,cen.length-1);let bj=-1,bd=1e9;
    for(let j=0;j<cen.length;j++){if(j===i||arcs.some(a=>(a[0]===i&&a[1]===j)||(a[0]===j&&a[1]===i)))continue;const d=Math.hypot(cen[i][0]-cen[j][0],cen[i][1]-cen[j][1]);if(d<bd){bd=d;bj=j;}}
    if(bj>=0){arcs.push([i,bj]);boyau(cen[i],cen[bj],1);}}
  // culs-de-sac : un boyau parti d'une caverne vers un point de roche, 8 à 18 cases
  for(let k=0,n=rnd(1,3);k<n;k++){const c=cen[rnd(0,cen.length-1)],a=Math.random()*6.283,L=SZ(rnd(8,18),5);
    boyau(c,[Math.max(3,Math.min(W-4,Math.round(c[0]+Math.cos(a)*L))),Math.max(3,Math.min(H-4,Math.round(c[1]+Math.sin(a)*L)))],1);}
  ZINFO={f:()=>0,cut:0,forme:'cavernes'};
  return z;}
// Relie chaque porte à la caverne la plus proche par un boyau étroit et sinueux, creusé dans la roche (chemin le moins cher dans un
// bruit, loin des autres bâtiments). Renvoie faux si une porte ne trouve pas de caverne.
function reliePortes(t,B,strs){
  const N=W*H,pied=B.pied,bruit=new Float64Array(N);for(let i=0;i<N;i++)bruit[i]=Math.random()*1.6;
  const cave=j=>!ZONE[j]&&!blocks(t[j])&&!isWater(t[j])&&!B.own[j]&&!pied[j],tun={};let n=0;
  for(const S of strs)for(const e of S.entrees){
    const d=new Float64Array(N).fill(1e9),from=new Int32Array(N).fill(-1),h=heap();d[e.o]=0;h.push(e.o,0);let fin=-1;
    while(h.size){const [c0,c]=h.pop();if(c0>d[c])continue;if(cave(c)&&c!==e.o){fin=c;break;}
      const x=c%W,y=(c/W)|0;
      for(const [dx,dy] of D4){const a=x+dx,b=y+dy;if(a<2||b<2||a>=W-2||b>=H-2)continue;const j=idx(a,b);
        if(pied[j]||B.own[j]||t[j]===WALL||t[j]===DOOR)continue;const v=t[j];if(v!==MOUNT&&!cave(j)&&!(v===GROUND||v===GRASS||v===FLAT))continue;
        const nd=c0+1+(v===MOUNT?bruit[j]:0);if(nd<d[j]){d[j]=nd;from[j]=c;h.push(j,nd);}}}
    if(fin<0)return false;
    for(let c=fin;c>=0&&c!==e.o;c=from[c]){if(t[c]===MOUNT){t[c]=GROUND;tun[c]=1;n++;}}
    if(blocks(t[e.o])||t[e.o]===MOUNT){t[e.o]=GROUND;tun[e.o]=1;n++;}}
  G.tun=tun;G.tunN=n;G.tunS=0;return true;}
