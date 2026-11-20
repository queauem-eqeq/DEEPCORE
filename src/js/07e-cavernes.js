/* ---------- Réseau de cavernes (21 novembre 2026) ----------
   Recette « cavernes » : tout est sous roche. Des cavernes irrégulières (automate cellulaire) sont creusées dans un massif
   plein, reliées par des boyaux sinueux (arbre couvrant, plus quelques boucles et culs-de-sac). ZONE vaut 0 dans les
   cavernes et les boyaux (l'« extérieur » de cette recette) et 1 dans la roche : distExt() donne donc la distance à la
   caverne la plus proche. Les bâtiments sont ensuite enchâssés dans la roche (07b, mode `cav`) avec une porte qui regarde
   vers une caverne, reliée à elle par un petit boyau (reliePortes). */
let CAVRES=null;   // places réservées aux bâtiments : {cibles (emprise visée de chacun), rects (lot [x0,y0,x1,y1])}
function cavernes(t){
  const N=W*H,z=new Uint8Array(N).fill(1),res=new Uint8Array(N);let nCav=0;t.fill(MOUNT);
  const part=Math.max(.18,Math.min(.6,autour('cvPart',.12)/100)),nb=Math.max(1,Math.min(14,Math.round(autour('cvNb',.25)))),cible=N*part*1.2,   // 20 % de plus : les places réservées et les recouvrements rognent la surface obtenue
    
    haut=(x,y)=>x>=2&&y>=2&&x<W-2&&y<H-2,ouvre=(x,y)=>{if(haut(x,y)){const i=idx(x,y);if(!res[i]){if(z[i])nCav++;t[i]=GROUND;z[i]=0;}}};
  // 1. La place des bâtiments est réservée avant de creuser : des rectangles de roche, séparés les uns des autres, n'importe où
  //    sur la carte (le centre compris). Les cavernes les contournent à 2 cases près, ce qui laisse la roche d'un boyau de porte.
  const nr=noise(SZ(4,3));
  {const ci=cibles_cav(Math.max(60,Math.round(N*autour('cvSurf',.15)/100))),rects=[],cib=[];
    for(const c0 of ci){let c=c0,best=null,lw=0,lh=0;
     for(let essai=0;essai<4&&!best;essai++,c=Math.round(c*.8)){   // si la place manque, le bâtiment est réduit d'un cinquième, trois fois au plus
      const aire=c*1.8,asp=1+Math.random()*.9;lw=Math.round(Math.sqrt(aire*asp));lh=Math.round(aire/Math.max(1,lw));
      lw=Math.max(10,Math.min(W-12,lw));lh=Math.max(8,Math.min(H-12,lh));
      let bs=-1e9;
      for(let k=0;k<80;k++){const x0=rnd(4,Math.max(4,W-lw-5)),y0=rnd(4,Math.max(4,H-lh-5));
        let d=1e9;for(const r of rects)d=Math.min(d,Math.max(r[0]-(x0+lw-1),x0-r[2],r[1]-(y0+lh-1),y0-r[3]));   // écart entre deux rectangles
        if(d<7)continue;const sc=Math.min(d,14)+Math.random()*10;if(sc>bs){bs=sc;best=[x0,y0,x0+lw-1,y0+lh-1];}}}
      if(best){rects.push(best);cib.push(c);
        // la réserve est une ellipse carrée aux bords bruités (et non un rectangle net) : les cavernes l'épousent, la roche garde l'air naturel.
        // Un coin que les cavernes rognent n'est pas perdu : le bâtiment s'écarte tout seul de deux cases d'une caverne.
        const rx=(best[2]-best[0]+1)/2+2,ry=(best[3]-best[1]+1)/2+2,cx=(best[0]+best[2])/2,cy=(best[1]+best[3])/2;
        for(let y=best[1]-3;y<=best[3]+3;y++)for(let x=best[0]-3;x<=best[2]+3;x++){if(x<0||y<0||x>=W||y>=H)continue;
          const u=Math.abs(x-cx)/rx,v=Math.abs(y-cy)/ry;if(Math.pow(u,4)+Math.pow(v,4)<=1+(nr(x,y)-.5)*.9)res[idx(x,y)]=1;}}}
    CAVRES={cibles:cib,rects};}
  // 2. Les cavernes : blobs irréguliers, posés le plus loin possible les uns des autres et à l'écart des places réservées
  const poids=Array.from({length:nb},()=>.6+Math.random()*.8),ps=poids.reduce((a,b)=>a+b,0),cen=[];
  const poseBlob=a=>{
    const asp=1+Math.random()*.8;   // surface visée pour cette caverne, rapport largeur/hauteur
    let w=Math.round(Math.sqrt(a*3.3*asp)),h=Math.round(a*3.3/Math.max(1,w));w=Math.max(6,Math.min(W-8,w));h=Math.max(5,Math.min(H-8,h));
    const cells=caBlob(w,h,.52,4);if(cells.length<8)return;
    let best=null,bs=-1e9;   // meilleur candidat : le plus loin des cavernes déjà posées, avec très peu de recouvrement des places réservées
    for(let k=0;k<50;k++){const x0=rnd(3,Math.max(3,W-w-4)),y0=rnd(3,Math.max(3,H-h-4)),cx=x0+w/2,cy=y0+h/2;
      let ov=0,tot=0;for(const [x,y] of cells){tot++;if(res[idx(x0+x,y0+y)])ov++;}
      let d=1e9;for(const c of cen)d=Math.min(d,Math.hypot(c[0]-cx,c[1]-cy));if(d>1e8)d=40;
      const sc=Math.min(d,40)-ov/tot*400;if(sc>bs){bs=sc;best=[x0,y0];}}
    const [x0,y0]=best,vivantes=[];for(const [x,y] of cells){const X=x0+x,Y=y0+y;ouvre(X,Y);if(haut(X,Y)&&!res[idx(X,Y)])vivantes.push([X,Y]);}
    if(vivantes.length<8)return;
    let sx=0,sy=0;for(const [X,Y] of vivantes){sx+=X;sy+=Y;}const mx=sx/vivantes.length,my=sy/vivantes.length;   // la case de la caverne la plus proche de son centre : là partent les boyaux
    let c0=vivantes[0],cd=1e9;for(const c of vivantes){const d=Math.hypot(c[0]-mx,c[1]-my);if(d<cd){cd=d;c0=c;}}
    cen.push(c0);};
  for(let n=0;n<nb;n++)poseBlob(cible*poids[n]/ps);
  // les places réservées rognent les blobs : on ajoute des cavernes jusqu'à retrouver la surface demandée (huit au plus)
  for(let k=0;k<8&&nCav<cible*.9;k++)poseBlob(Math.max(20,(cible-nCav)/2));
  if(!cen.length){const x=W>>1,y=H>>1;for(let dy=-3;dy<=3;dy++)for(let dx=-4;dx<=4;dx++)ouvre(x+dx,y+dy);cen.push([x,y]);}
  // 3. Boyaux : chemin le moins cher dans un bruit, qui contourne les places réservées et préfère les cases déjà creusées
  const nz=noise(SZ(5,3));
  const boyau=(a,b,larg)=>{const d=new Float64Array(N).fill(1e9),from=new Int32Array(N).fill(-1),h=heap(),ia=idx(a[0],a[1]),ib=idx(b[0],b[1]);d[ia]=0;h.push(ia,0);
    while(h.size){const [c0,c]=h.pop();if(c0>d[c])continue;if(c===ib)break;const x=c%W,y=(c/W)|0;
      for(const [dx,dy] of D4){const X=x+dx,Y=y+dy;if(!haut(X,Y))continue;const j=idx(X,Y);if(res[j]&&j!==ib)continue;
        const nd=c0+(z[j]?1+nz(X,Y)*3.5:.35);if(nd<d[j]){d[j]=nd;from[j]=c;h.push(j,nd);}}}
    if(from[ib]<0&&ia!==ib)return;let k=0;
    for(let c=ib;c>=0;c=from[c]){const x=c%W,y=(c/W)|0;ouvre(x,y);if(larg>1&&Math.random()<.5)ouvre(x+(k%2?1:0),y+(k%2?0:1));k++;}};
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
  for(let k=0,n=rnd(1,3);k<n;k++){const c=cen[rnd(0,cen.length-1)],L=SZ(rnd(8,18),5);
    for(let e=0;e<12;e++){const a=Math.random()*6.283,X=Math.max(3,Math.min(W-4,Math.round(c[0]+Math.cos(a)*L))),Y=Math.max(3,Math.min(H-4,Math.round(c[1]+Math.sin(a)*L)));
      if(res[idx(X,Y)])continue;boyau(c,[X,Y],1);break;}}
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
