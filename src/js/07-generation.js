/* ---------- Génération ---------- */
function noise(scale){const gw=Math.ceil(W/scale)+2,g=Array.from({length:gw*(Math.ceil(H/scale)+2)},Math.random);
  return (x,y)=>{const gx=x/scale,gy=y/scale,x0=Math.floor(gx),y0=Math.floor(gy),tx=gx-x0,ty=gy-y0,sx=tx*tx*(3-2*tx),
    sy=ty*ty*(3-2*ty),v=(i,j)=>g[j*gw+i];
    return (v(x0,y0)*(1-sx)+v(x0+1,y0)*sx)*(1-sy)+(v(x0,y0+1)*(1-sx)+v(x0+1,y0+1)*sx)*sy;};}
function fbm(g){g=g||1;const a=noise(Math.max(3,Math.round(SZ(14,4)*g))),b=noise(Math.max(2,Math.round(SZ(6,3)*g)));
  return (x,y)=>a(x,y)*.7+b(x,y)*.3;}
let G,vis=new Uint8Array(W*H),liqFrame=0,started=false,drilling=false;

function logPush(m,c){G.log=G.log||[];const last=G.log[G.log.length-1];
  if(last&&last.m===m&&last.t===G.turn)return;
  if(last&&last.m===m){last.n=(last.n||1)+1;last.t=G.turn;}else G.log.push({m,c:c||'',t:G.turn});
  if(G.log.length>200)G.log.shift();}   // le journal du bas défile : on garde les 200 derniers messages
function say(m,c){G.msg={m,c:c||''};logPush(m,c);}
function sayMore(m,c){G.msg=G.msg?{m:G.msg.m+' '+m,c:c||G.msg.c}:{m,c:c||''};logPush(m,c);}
// machines, antennes et terminaux barrent le pas (mais pas la vue)
const blocks=v=>v===ROCK||v===MOUNT||v===HARD||v===CHASM||v===SHIP||v===WALL||v===PILLAR||v===LOCK||v===SECRET||v>=MACHINE;
// Diagonales comme dans Brogue : un pas (ou un coup) en diagonale est impossible si l'une des deux cases voisines
// orthogonales est une paroi (rocher, montagne, coque du vaisseau) — on ne coupe pas les coins. Vaut pour tout le monde.
const wallish=v=>v===ROCK||v===MOUNT||v===SHIP||v===WALL||v===PILLAR||v===LOCK||v===SECRET||v===VITRE;
const diagOk=(x,y,dx,dy,t)=>{t=t||G.t;return !(dx&&dy)||(!wallish(t[idx(x+dx,y)])&&!wallish(t[idx(x,y+dy)]));};
const sc=f=>{const a=new Float32Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++)a[idx(x,y)]=f(x,y);return a;};
function rankFill(t,score,n,val){const c=[];for(let i=0;i<W*H;i++)if(t[i]===GROUND)c.push(i);
  c.sort((a,b)=>score[b]-score[a]);const take=c.slice(0,Math.max(0,Math.min(n,c.length)));for(const i of take)t[i]=val;return take.length;}

// Automate cellulaire (règle B5678/S45678, comme les lacs de Brogue) : renvoie le plus gros blob
function caBlob(w,h,fill,iters){
  let g=new Uint8Array(w*h);for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++)g[y*w+x]=Math.random()<fill?1:0;
  for(let it=0;it<iters;it++){const n=new Uint8Array(w*h);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){let c=0;for(const[dx,dy]of DIRS){const a=x+dx,b=y+dy;if(a>=0&&b>=0&&a<w&&b<h)c+=g[b*w+a];}
      n[y*w+x]=g[y*w+x]?(c>=4?1:0):(c>=5?1:0);}
    g=n;}
  const lab=new Uint8Array(w*h);let best=[];
  for(let i=0;i<w*h;i++){if(!g[i]||lab[i])continue;const q=[i];lab[i]=1;
    for(let k=0;k<q.length;k++){const c=q[k],x=c%w,y=(c/w)|0;for(let d=0;d<4;d++){const a=x+DIRS[d][0],b=y+DIRS[d][1];
      if(a<0||b<0||a>=w||b>=h)continue;const j=b*w+a;if(g[j]&&!lab[j]){lab[j]=1;q.push(j);}}}
    if(q.length>best.length)best=q;}
  return best.map(c=>[c%w,(c/w)|0]);
}
// Toutes les cases franchissables sont-elles reliées ?
function connectedAll(t){let s0=-1,tot=0;for(let i=0;i<W*H;i++)if(!blocks(t[i])){tot++;if(s0<0)s0=i;}
  if(s0<0)return true;const seen=new Uint8Array(W*H),q=[s0];seen[s0]=1;
  for(let k=0;k<q.length;k++){const c=q[k],x=c%W,y=(c/W)|0;for(const[dx,dy]of DIRS){const a=x+dx,b=y+dy;if(a<0||b<0||a>=W||b>=H)continue;
    const j=idx(a,b);if(!seen[j]&&!blocks(t[j])&&diagOk(x,y,dx,dy,t)){seen[j]=1;q.push(j);}}}
  return q.length===tot;}
// Pose des blobs un par un ; avec check, un blob qui coupe la carte est refusé
// aff, K (21 novembre 2026, « regroupement ») : parmi K emplacements tirés, on garde celui où le champ d'affinité du terrain est le plus
// fort ; les taches d'un même terrain se rassemblent alors en régions (une chaîne, une prairie) au lieu de s'éparpiller.
const meilleurePlace=(w,h,aff,K,x0,y0)=>{let bx=rnd(x0,Math.max(x0,W-w-x0)),by=rnd(y0,Math.max(y0,H-h-y0));if(!aff||K<2)return [bx,by];
  let bv=aff(bx+w/2,by+h/2)+Math.random()*.2;
    for(let k=1;k<K;k++){const x=rnd(x0,Math.max(x0,W-w-x0)),y=rnd(y0,Math.max(y0,H-h-y0)),v=aff(x+w/2,y+h/2)+Math.random()*.2;
    if(v>bv){bv=v;bx=x;by=y;}}return [bx,by];};
function placeBlobs(t,target,val,size,fill,iters,check,aff,K){
  let count=0,tries=0;
  while(count<target&&tries<300){tries++;
    const [w,h]=size(count/Math.max(1,target)),cells=caBlob(w,h,fill,iters);if(cells.length<4)continue;
    const [ox,oy]=meilleurePlace(w,h,aff,tries<150?K:1,1,1),ch=[];
    for(const [x,y] of cells){const i=idx(ox+x,oy+y);if(t[i]===GROUND){ch.push(i);t[i]=val;}}
    if(!ch.length)continue;
    if(check&&!connectedAll(t)){for(const i of ch)t[i]=GROUND;continue;}
    count+=ch.length;}
  return count;}
// Lacs à la Brogue : cœur d'eau profonde + couronne de 2 cases de liquide peu profond
// Lacs à la Brogue, tenus à distance des gouffres (marge de GAP cases de terre ferme)
const GAP=2;
function nearChasm(t){const n=new Uint8Array(W*H);
  for(let i=0;i<W*H;i++){if(t[i]!==CHASM&&t[i]!==BRIDGE)continue;const x=i%W,y=(i/W)|0;
    for(let dy=-GAP;dy<=GAP;dy++)for(let dx=-GAP;dx<=GAP;dx++){const a=x+dx,b=y+dy;if(a>=0&&b>=0&&a<W&&b<H)n[idx(a,b)]=1;}}
  return n;}
/* Un lac : une forme tirée à l'automate, puis une rive propre à ce lac (15 novembre 2026).
   Avant, tout lac était pareil : un cœur d'eau profonde entouré d'une couronne de deux cases d'eau peu profonde, et l'eau
   profonde ne touchait jamais la terre. Maintenant chaque lac tire son caractère, et la largeur de sa rive ondule autour de lui
   (bruit) : une plage d'un côté, un bord franc de l'autre.
     - « étang » (1 sur 5)   : pas une goutte d'eau profonde ;
     - « à-pic » (1 sur 5)   : que de l'eau profonde, qui descend d'un coup depuis la rive ;
     - sinon                 : rive de largeur moyenne tirée entre 0,4 et 3,6 cases, ondulée de ×0,3 à ×1,9 autour du lac.
   La profondeur se lit à la distance au rivage (en cases, diagonales comprises) : profond là où elle dépasse la largeur de rive. */
function placeLakes(t,target,gs,aff,K){gs=gs||1;
  const near=nearChasm(t),ok=i=>t[i]===GROUND&&!near[i],rive=noise(SZ(8,3));
  let count=0,tries=0;
  while(count<target&&tries<600){tries++;
    const p=count/Math.max(1,target),w=Math.min(W-6,Math.max(10,Math.round((26-p*10)*F*gs))),
      h=Math.min(H-6,Math.max(6,Math.round((13-p*5)*F*gs))),cells=caBlob(w,h,.55,5);if(cells.length<6)continue;
    const [ox,oy]=meilleurePlace(w,h,aff,tries<300?K:1,2,2);
    // un lac qui empiète trop sur la marge d'un gouffre est refusé, pour garder des rives naturelles
    let hit=0;for(const [x,y] of cells)if(near[idx(ox+x,oy+y)])hit++;
    if(tries<450&&hit>cells.length*.15)continue;
    const lac=[],dans=new Set();
    for(const [x,y] of cells){const i=idx(ox+x,oy+y);if(ok(i)){lac.push(i);dans.add(i);}}
    if(lac.length<6)continue;
    for(const i of lac)t[i]=LIQ;
    count+=lac.length;
    const r=Math.random(),large=r<.2?1e9:r<.4?0:.4+Math.random()*3.2;   // étang · à-pic · rive ordinaire
    if(large>=1e9)continue;                                            // étang : tout reste peu profond
    // distance au rivage : 1 au bord du lac, puis de proche en proche (8 directions)
    const d=new Map();let bord=[];
    for(const i of lac){const x=i%W,y=(i/W)|0;   // l'eau d'un lac déjà posé ne fait pas rivage : deux lacs qui se touchent n'en font qu'un
      if(DIRS.some(([dx,dy])=>{const j=idx(x+dx,y+dy);return !dans.has(j)&&!isWater(t[j]);})){d.set(i,1);bord.push(i);}}
    for(let k=0;k<bord.length;k++){const c=bord[k],x=c%W,y=(c/W)|0;
      for(const [dx,dy] of DIRS){const j=idx(x+dx,y+dy);if(dans.has(j)&&!d.has(j)){d.set(j,d.get(c)+1);bord.push(j);}}}
    // aucun rivage atteint : pleine eau, donc profond
    for(const i of lac){const x=i%W,y=(i/W)|0;if((d.has(i)?d.get(i):1e9)>large*(.3+rive(x,y)*1.6))t[i]=DEEP;}
  }
}
// Sécurité finale : aucune case d'eau au contact d'un gouffre ou d'un pont
function separateWater(t){const near=nearChasm(t);for(let i=0;i<W*H;i++)if((t[i]===LIQ||t[i]===DEEP)&&near[i])t[i]=GROUND;}
// Petit tas binaire pour Dijkstra
function heap(){const a=[];return{push(v,p){a.push([p,v]);let i=a.length-1;while(i>0){const j=(i-1)>>1;if(a[j][0]<=a[i][0])break;
  [a[i],a[j]]=[a[j],a[i]];i=j;}},
  pop(){const top=a[0],last=a.pop();if(a.length){a[0]=last;let i=0;for(;;){const l=2*i+1,r=l+1;let m=i;if(l<a.length&&a[l][0]<a[m][0])m=l;
    if(r<a.length&&a[r][0]<a[m][0])m=r;if(m===i)break;[a[i],a[m]]=[a[m],a[i]];i=m;}}return top;},get size(){return a.length;}};}
// Relie toutes les zones : ponts au-dessus des gouffres, cols dans la montagne, rochers dégagés
function connect(t){
  for(let guard=0;guard<60;guard++){
    const lab=new Int32Array(W*H).fill(-1),regs=[];
    for(let i=0;i<W*H;i++){if(blocks(t[i])||lab[i]>=0)continue;const id=regs.length,q=[i];lab[i]=id;
      for(let k=0;k<q.length;k++){const c=q[k],x=c%W,y=(c/W)|0;for(const[dx,dy]of DIRS){const a=x+dx,b=y+dy;
        if(a<0||b<0||a>=W||b>=H)continue;const j=idx(a,b);if(lab[j]<0&&!blocks(t[j])&&diagOk(x,y,dx,dy,t)){lab[j]=id;q.push(j);}}}
      regs.push(q);}
    if(regs.length<=1)return;
    let main=0;regs.forEach((r,i)=>{if(r.length>regs[main].length)main=i;});
    // petites poches isolées : comblées par des rochers
    let other=-1;for(let i=0;i<regs.length;i++){if(i===main)continue;
      if(regs[i].length<5){for(const c of regs[i])if(t[c]!==DEEP&&t[c]!==LIQ)t[c]=ROCK;else t[c]=ROCK;}else if(other<0)other=i;}
    if(other<0)continue;
    const dist=new Float64Array(W*H).fill(Infinity),prev=new Int32Array(W*H).fill(-1),hp=heap();
    for(const c of regs[main]){dist[c]=0;hp.push(c,0);}
    let hit=-1;
    while(hp.size){const [d,c]=hp.pop();if(d>dist[c])continue;if(lab[c]===other){hit=c;break;}
      const x=c%W,y=(c/W)|0;
      for(let k=0;k<4;k++){const a=x+DIRS[k][0],b=y+DIRS[k][1];if(a<1||b<1||a>=W-1||b>=H-1)continue;const j=idx(a,b),v=t[j];
        if(v===SHIP||v===WALL||v===PILLAR)continue;const cost=v===CHASM?3:v===ROCK?2:v===MOUNT?7:1;const nd=d+cost;
          if(nd<dist[j]){dist[j]=nd;prev[j]=c;hp.push(j,nd);}}}
    for(let c=hit;c>=0;c=prev[c]){const v=t[c];if(v===CHASM)t[c]=BRIDGE;else if(v===ROCK||v===MOUNT)t[c]=GROUND;}
  }
}
// Gouffres : jamais de petit trou (moins de CHASM_MIN cases reliées par les côtés), jamais deux gouffres reliés seulement par un coin.
// On ne fait que combler (gouffre -> sol) : la carte ne peut que gagner en passages, la connexion reste garantie.
const CHASM_MIN=4;
function tidyChasms(t){
  for(let pass=0;pass<20;pass++){let ch=false;
    // contact par un coin seulement : on comble une des deux cases
    for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){if(t[idx(x,y)]!==CHASM)continue;
      for(const dy of [-1,1]){const x2=x+1,y2=y+dy;if(t[idx(x,y)]!==CHASM||x2>=W-1||y2<1||y2>=H-1)continue;
        if(t[idx(x2,y2)]===CHASM&&t[idx(x2,y)]!==CHASM&&t[idx(x,y2)]!==CHASM){const [rx,ry]=Math.random()<.5?[x,y]:[x2,y2];
          t[idx(rx,ry)]=GROUND;ch=true;}}}
    // petits trous : comblés
    const seen=new Uint8Array(W*H);
    for(let i=0;i<W*H;i++){if(t[i]!==CHASM||seen[i])continue;const q=[i];seen[i]=1;
      for(let k=0;k<q.length;k++){const c=q[k],x=c%W,y=(c/W)|0;for(let d=0;d<4;d++){const a=x+DIRS[d][0],b=y+DIRS[d][1];
        if(a<0||b<0||a>=W||b>=H)continue;const j=idx(a,b);if(!seen[j]&&t[j]===CHASM){seen[j]=1;q.push(j);}}}
      if(q.length<CHASM_MIN){for(const c of q)t[c]=GROUND;ch=true;}}
    // ponts qui ne franchissent plus rien : redeviennent du sol
    for(let i=0;i<W*H;i++){if(t[i]!==BRIDGE)continue;const x=i%W,y=(i/W)|0;
      if(![0,1,2,3].some(d=>{const a=x+DIRS[d][0],b=y+DIRS[d][1];return a>=0&&b>=0&&a<W&&b<H&&t[idx(a,b)]===CHASM;})){t[i]=GROUND;ch=true;}}
    if(!ch)break;}}
// Pose le vaisseau sur une zone dégagée (marge d'une case autour) ; à défaut, sur la zone la moins encombrée, puis relie tout
// La zone dégagée est un OVALE centré sur le vaisseau (21 novembre 2026 ; un rectangle avant), qui déborde de sa coque d'une case au moins.
const SHIP_OVALE=(()=>{const l=[],a=SGW/2+2.4,b=SGH/2+2.4,cx=(SGW-1)/2,cy=(SGH-1)/2;for(let y=-3;y<SGH+3;y++)for(let x=-3;x<SGW+3;x++){const dx=(x-cx)/a,dy=(y-cy)/b;let dans=dx*dx+dy*dy<=1;
    // jamais moins d'une case de marge autour de la coque
    if(!dans)for(let v=-1;v<=1&&!dans;v++)for(let u=-1;u<=1;u++){const r=SHIP_GRID[y+v];if(r&&r[x+u]&&r[x+u]!=='.'){dans=true;break;}}
    if(dans)l.push([x,y]);}return l;})();
function placeShip(t,ou){const ok=v=>v===GROUND||v===GRASS||v===FLAT||v===RUBBLE||v===ROCK;let bx=4,by=4,bb=1e9;
  // ou : zone d'atterrissage imposée, relâchée si elle ne donne rien
  for(let k=0;k<800&&bb>0;k++){const x0=rnd(4,W-SGW-5),y0=rnd(4,H-SGH-5);let bad=0;if(ou&&k<600&&!ou(x0+SGW/2,y0+SGH/2))continue;
    for(const [dx,dy] of SHIP_OVALE)if(!ok(t[idx(x0+dx,y0+dy)]))bad++;
    if(bad<bb){bb=bad;bx=x0;by=y0;}}
  for(const [dx,dy] of SHIP_OVALE)t[idx(bx+dx,by+dy)]=GROUND;
  for(let cy=0;cy<SGH;cy++)for(let cx=0;cx<SGW;cx++){const c=SHIP_GRID[cy][cx];if(c==='.')continue;
    t[idx(bx+cx,by+cy)]=(c==='I'||c==='D')?DECK:SHIP;}
  if(bb>0)connect(t);
  tidyChasms(t);
  return {x:bx,y:by};}
// Bord de carte irrégulier : une bande de montagne d'épaisseur variable (1 à 10 cases, environ 3 en moyenne, caps et baies ; 20 % de surface au plus)
// suit les quatre côtés, puis un passage d'automate cellulaire casse les angles droits. La rangée extérieure reste indestructible.
function roughBorder(t){for(let k=0;k<8;k++){t.fill(GROUND);roughBorderOnce(t);let m=0;for(let i=0;i<W*H;i++)if(t[i]===MOUNT)m++;
  if(m<=W*H*.19)return;}}
function roughBorderOnce(t){const n1=noise(SZ(7,3)),n2=noise(SZ(3,2)),band=new Uint8Array(W*H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const d=Math.min(x,y,W-1-x,H-1-y),v=n1(x,y)*.75+n2(x,y)*.25,th=.5+Math.pow(v,2.2)*10;
    if(d<th){t[idx(x,y)]=MOUNT;}if(d<15)band[idx(x,y)]=1;}
  for(let it=0;it<2;it++){const nt=t.slice();
    for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=idx(x,y);if(!band[i])continue;let c=0;
      for(const[dx,dy]of DIRS)if(t[idx(x+dx,y+dy)]===MOUNT)c++;
      nt[i]=t[i]===MOUNT?(c>=4?MOUNT:GROUND):(c>=5?MOUNT:GROUND);}
    for(let i=0;i<W*H;i++)if(band[i])t[i]=nt[i];}
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(x===0||y===0||x===W-1||y===H-1)t[idx(x,y)]=MOUNT;}
/* Plan de zones (20 novembre 2026, formes ajoutées le même jour). Le massif prend UN CÔTÉ de la carte ou UN COIN ; sa lisière serpente (bruit à grande échelle, plus un grain fin). On classe les cases par
   « profondeur » depuis le massif et l'on garde en extérieur la part demandée par la recette : la part est comptée sur les cases
   libres, bord de carte déduit, pour que la zone extérieure, sa bordure comprise, tienne dans la fourchette.
   f(x,y) donne cette profondeur sans le bruit, de 0 au cœur du massif à 1 au plus loin : ZINFO la garde pour poser le vaisseau
   dans la partie de l'extérieur la plus éloignée du massif, quelle que soit la forme. */
let ZONE=null,ZINFO=null,ZESSAI=0;
const FORMES=['cote','coin'];
function massif(t,ext,forme){const N=W*H,n1=noise(SZ(9,4)),n2=noise(SZ(3,2)),val=new Float32Array(N),sol=[];
  if(!FORMES.includes(forme))forme=FORMES[rnd(0,FORMES.length-1)];
  let f,g,L;
  // a : coin étiré en largeur ou en hauteur
  if(forme==='coin'){const cx=Math.random()<.5?0:W-1,cy=Math.random()<.5?0:H-1,a=.75+Math.random()*.5;
    L=Math.max(W,H);f=(x,y)=>Math.min(1,Math.hypot((x-cx)/W*a,(y-cy)/H/a)/1.414);g=(x,y)=>(n1(x,y)-.5)*.3;}
  else{const hor=Math.random()<(W>=H?.8:.2),inv=Math.random()<.5;L=hor?W:H;
    f=(x,y)=>{const d=hor?x:y;return (inv?L-1-d:d)/L;};g=(x,y)=>(n1(hor?y:x,2)-.5)*.3;}
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=idx(x,y);val[i]=f(x,y)+g(x,y)+(n2(x,y)-.5)*3/L;if(t[i]===GROUND)sol.push(i);}
  sol.sort((a,b)=>val[b]-val[a]);
  const garde=Math.min(sol.length-Math.round(N*.22),Math.round(sol.length*(ext[0]+Math.random()*(ext[1]-ext[0])))),
    cut=val[sol[Math.max(0,garde-1)]],z=new Uint8Array(N);
  for(let i=0;i<N;i++)if(val[i]<cut){z[i]=1;t[i]=MOUNT;}
  ZINFO={f,cut,forme};return z;}
/* Taille de la carte en jeu (28 novembre 2026) : chaque niveau a la sienne (NIVEAUX[n].taille, 00-base). TAILLE_JEU la porte
   pendant une génération lancée par le jeu (nouvelle partie, REGEN, descente, boutons Niv) ; sinon (GÉNÉRER LA CARTE, outils
   d'essai, banc) c'est le curseur du menu Monde, GEN.taille. */
let TAILLE_JEU=0;
const tailleNiv=n=>(NIVEAUX[nivBorne(n)]||{}).taille||GEN.taille;
function enJeu(f,niv){TAILLE_JEU=tailleNiv(niv??NIV_RECETTE(GEN.recette));try{return f();}finally{TAILLE_JEU=0;}}
function genPlanet(){
  setSize(TAILLE_JEU||GEN.taille);vis=new Uint8Array(W*H);
  const N=W*H,rec=RECETTES[GEN.recette]||RECETTES.classique;let Nt=N;
    const P=k=>Math.round(Nt*GEN[k]/100),fill=GEN.remplissage/100,it=GEN.iterations;
  for(let attempt=0;attempt<30;attempt++){
    const relax=attempt>=15,last=attempt===29;
    const t=new Array(N).fill(GROUND);
    roughBorder(t);   // bord de carte irrégulier, en roche
    // curseur « Part d'extérieur » : le centre, ± 10 points ; le massif s'épaissit si le complexe n'a pas tenu (ZESSAI)Nt=N;
    {const c=GEN.zExt/100-Math.max(0,ZESSAI-2)*.06;
      ZONE=rec.cavernes?cavernes(t):rec.zones?massif(t,[Math.max(.25,c-.1),Math.min(.9,c+.1)],GEN.zForme):null;}
    if(ZONE){Nt=0;for(let i=0;i<N;i++)if(t[i]===GROUND)Nt++;}   // les pourcentages du relief valent pour la zone extérieure
    // cavernes : le sol a son propre relief, plus doux (curseurs de la recette)
    const mode=GEN.methode,mt=rec.cavernes?Math.round(Nt*(GEN.cvMont??4)/100):P('montagne'),
      ct=rec.cavernes?Math.round(Nt*(GEN.cvGouf??3)/100):P('gouffre');
    /* Grain et regroupement (21 novembre 2026) : « grain » règle la taille des taches de relief (50 : la taille d'avant ; 0 : émietté ;
       100 : massif), « regroupe » le nombre d'emplacements essayés pour chaque tache (0 : éparpillé comme avant). Chaque terrain a son
       propre champ d'affinité, à grande échelle : ses taches se rassemblent là où il est fort. */
    const gs=Math.pow(2,((GEN.grain??50)-50)/40),KR=1+Math.round((GEN.regroupe??0)/100*9),affN=()=>noise(Math.max(8,Math.round(W/3.2))),
      aM=affN(),aC=affN(),aE=affN(),aH=affN();
    const bx=v=>Math.max(3,Math.min(W-6,Math.round(v*gs))),by=v=>Math.max(3,Math.min(H-6,Math.round(v*gs)));
    const mSize=p=>[bx(rnd(SZ(14,4),SZ(30,6))-Math.round(p*8*F)),by(rnd(SZ(9,3),SZ(18,5))-Math.round(p*4*F))],
      cSize=()=>[bx(rnd(SZ(8,3),SZ(18,5))),by(rnd(SZ(5,3),SZ(10,4)))];
    const cz=noise(SZ(11,4)),cm=fbm(),crev=sc((x,y)=>-Math.abs(cz(x,y)-.5)-(cm(x,y)<.45?1:0));
    if(mode==='bruit'){rankFill(t,sc(fbm(gs)),mt,MOUNT);rankFill(t,crev,ct,CHASM);}
    else if(mode==='automate'){const a=placeBlobs(t,mt,MOUNT,mSize,fill,it,true,aM,KR);if(a<mt)rankFill(t,sc(fbm(gs)),mt-a,MOUNT);
      const b=placeBlobs(t,ct,CHASM,cSize,fill,it,false,aC,KR);if(b<ct)rankFill(t,crev,ct-b,CHASM);}
    else{const n=rankFill(t,sc(fbm()),Math.round(mt/2),MOUNT),a=placeBlobs(t,mt-n,MOUNT,mSize,fill,it,true,aM,KR);
      if(n+a<mt)rankFill(t,sc(fbm()),mt-n-a,MOUNT);
      const c=rankFill(t,crev,Math.round(ct/2),CHASM),b=placeBlobs(t,ct-c,CHASM,cSize,fill,it,false,aC,KR);
        if(c+b<ct)rankFill(t,crev,ct-c-b,CHASM);}
    placeLakes(t,P('eau'),gs,aE,KR);
    const gC=placeBlobs(t,P('herbe'),GRASS,()=>[bx(rnd(SZ(10,4),SZ(22,6))),by(rnd(SZ(6,3),SZ(13,4)))],.5,4,false,aH,KR);
      if(gC<P('herbe'))rankFill(t,sc(fbm()),P('herbe')-gC,GRASS);
    // Herbes hautes / basses (15 novembre 2026) : plus de coupure nette moitié-moitié. Trois couches s'additionnent : de grandes zones
    // (qui donnent parfois une forte majorité de hautes ou de basses), des bosquets et des touffes de 2 à 6 cases, et un grain case par case.
    // Les grandes zones sont écrasées vers le milieu (mises au carré) : le plus souvent c'est le mélange qui l'emporte.
    // La part d'herbes hautes varie d'une carte à l'autre, de 35 à 65 %.
    {const gros=noise(SZ(15,5)),moyen=noise(SZ(6,3)),touffe=noise(SZ(3,2)),gc=[],gn=new Float32Array(N);
      for(let i=0;i<N;i++)if(t[i]===GRASS)gc.push(i);
      for(const i of gc){const x=i%W,y=(i/W)|0,g=gros(x,y)*2-1;
        gn[i]=Math.sign(g)*g*g*1.5+(moyen(x,y)*2-1)*.45+(touffe(x,y)*2-1)*.6+(Math.random()*2-1)*.35;}
      gc.sort((a,b)=>gn[a]-gn[b]);for(const i of gc.slice(0,Math.round(gc.length*(.35+Math.random()*.3))))t[i]=FLAT;}
    for(let i=0;i<N;i++)if(t[i]===GROUND&&Math.random()<(rec.cavernes?(GEN.cvRoc??2)/100:.035))t[i]=ROCK;
    tidyChasms(t);connect(t);tidyChasms(t);separateWater(t);
    // on atterrit loin du massiflet sx,sy;
    const ship=(SANS_VAISSEAU||rec.sansVaisseau)?null:placeShip(t,ZONE&&((x,y)=>ZINFO.f(x,y)>ZINFO.cut+(1-ZINFO.cut)*.4));
    if(ship){sx=ship.x+2;sy=ship.y+2;}
    else{let ok=false;                                             // niveaux suivants : arrivée par le puits, sur un carré de sol dégagé
      // le puits débouche toujours au sec
      for(let k=0;k<4000&&!ok;k++){sx=rnd(4,W-5);sy=rnd(4,H-5);ok=true;
        for(let dy=-1;dy<=1&&ok;dy++)for(let dx=-1;dx<=1;dx++){const v=t[idx(sx+dx,sy+dy)];
        if(!canWalk(v,true)||isWater(v)||(rec.cavernes&&ZONE[idx(sx+dx,sy+dy)])){ok=false;break;}}}
      // herbes comprises : le puits les a couchées (sans cela, un biome très herbu ne trouvait pas de place et la génération traînait)
      if(ok)for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)t[idx(sx+dx,sy+dy)]=GROUND;
      if(!ok){if(!last)continue;sx=W>>1;sy=H>>1;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)t[idx(sx+dx,sy+dy)]=GROUND;}}
    const st=idx(sx,sy);   // la foreuse démarre au fond du couloir (case du haut), mèche vers la porte
    const d=new Int32Array(N).fill(-1),q=[st];d[st]=0;
    for(let k=0;k<q.length;k++){const c=q[k],x=c%W,y=(c/W)|0;for(const[dx,dy]of DIRS){const n=idx(x+dx,y+dy);
      if(d[n]>=0||blocks(t[n])||!diagOk(x,y,dx,dy,t))continue;d[n]=d[c]+1;q.push(n);}}
    let cand=q.filter(c=>t[c]===GROUND&&d[c]>(relax?SZ(6,3):SZ(14,5)));
    if(last&&cand.length<NSITES)cand=q.filter(c=>c!==st&&t[c]!==DEEP);
    // site unique : dans le tiers le plus éloigné de l'arrivée, il faut traverser la carte
    cand.sort((a,b)=>d[b]-d[a]);cand=cand.slice(0,Math.max(1,Math.ceil(cand.length/3)));
    const sites=[],gap=relax?SZ(10,4):SZ(20,6);
    for(let k=0;k<800&&sites.length<NSITES;k++){const c=cand[Math.floor(Math.random()*cand.length)];if(c==null)break;const x=c%W,y=(c/W)|0;
      if(sites.some(s=>Math.abs(s.x-x)+Math.abs(s.y-y)<(last?4:gap)))continue;sites.push({x,y});}
    if(sites.length<NSITES&&!last)continue;
    G={t,recette:ZONE?GEN.recette:'classique',seen:new Array(N).fill(0),px:sx,py:sy,turn:0,dist:0,over:null,msg:null,ship,face:'d',
      st:{detec:3,vie:100,vieMax:100,energie:100,energieMax:100,repar:0,power:10,pas:0,degats:0,capteur:10,cout:REGLES.FORAGE_ENERGIE,pre:100,def:10,crit:5,
        fuel:REGLES.FUEL_MAX,fuelMax:REGLES.FUEL_MAX},
      sites:sites.map((s,i)=>({x:s.x,y:s.y,depth:10,id:LETTERS[i],seen:false,known:false}))};
    return;
  }
}
/* ---------- Le niveau (16 novembre 2026) ----------
   Un seul niveau, toujours celui de l'atterrissage : le vaisseau, un site de forage, et le relief et la faune réglés
   dans le menu Monde. La descente en 5 niveaux, ses six biomes, ses archétypes de monde, son budget de menace par
   niveau et les cartes d'essai ont été retirés ce jour-là, à la demande de l'utilisateur : le jeu se règle maintenant
   entièrement depuis le menu Monde, et REGEN tire une nouvelle carte avec les mêmes réglages. */
// pvDe / dmgDe : points de vie et dégâts d'une espèce tels que le jeu les lit (PV : ceux du Bestiaire ; dégâts : voir plus bas) ;
// ces deux fonctions restent le seul endroit à changer si l'on veut un jour les faire varier.
// dégâts d'une créature : tirés à chaque coup entre dmin et dmax (16 novembre 2026 ; une valeur fixe avant)
// 28 novembre 2026 (bloc C du chantier survie) : les dégâts sont ceux du niveau en cours (degReels, 00-base : Bestiaire × REGLES.MENACE_DEG).
const pvDe=sp=>sp.pv,dmgDe=sp=>{const [a,b]=degReels(sp);return a+Math.floor(Math.random()*(Math.max(a,b)-a+1));},
  dmgTxt=(sp,n)=>{const [a,b]=degReels(sp,n);return a===b?''+a:a+'-'+b;};
// Gisements pour une carte de taille 2 ; les autres tailles en proportion de leur surface.
const GISEMENTS={metal:3,mat:1};
let SANS_VAISSEAU=false;
// Génère la carte à partir des réglages en cours du menu Monde (relief, taille, faune), avec le vaisseau.
function niveau(refait){drilling=false;
  // structures bâties (07b), avant la roche dure et les métaux. Recette à complexe enfoui : si le complexe n'a pas tenu dans le
  // massif, on retire une carte entière (dix fois au plus) plutôt que de le poser en terrain ouvert.
  const cv=!!(RECETTES[GEN.recette]||{}).cavernes;let mieux=null;
  for(let k=0;k<10;k++){ZESSAI=k;genPlanet();G.w=W;G.h=H;batiments();
    // cavernes : la carte est mesurée ; trop loin de ce qui est demandé, elle est refaite (six au plus) et la meilleure est gardée
    if(cv){const e=cvBilan();if(!mieux||e<mieux.e)mieux={e,G,ZONE,ZINFO,SECT,CVT,BD:BATI_DER};if(e<=1.6||k>=5)break;continue;}
    if(G.batis.length||!ZONE||!(ENFOUI()||GEN.structure>0))break;}
  if(mieux&&mieux.G!==G){G=mieux.G;ZONE=mieux.ZONE;ZINFO=mieux.ZINFO;SECT=mieux.SECT;CVT=mieux.CVT;BATI_DER=mieux.BD;}
  if(astroRec())astroport();   // Astroport (niveau 1) : fosses d'atterrissage et épaves (07h)
  {const o=cv&&typeof document!=='undefined'&&document.getElementById('genObt');if(o)o.textContent=obtenuTxt();}
  // les deux archétypes, un par un, pour la Carte de la colonne
  // « monde · bâti », les deux archétypes, affiché dans le Statut et à l'arrivée
  G.amb=ambDouble();G.archM=ambMNom(GEN.ambM)||'Personnalisé';G.archB=ambNom(GEN.recette,GEN.amb)||'Personnalisé';
  durcir();   // la roche dure avant les métaux : ils n'y apparaissent jamais
  {const a=W*H/(48*32);G.eff={};G.fum={};hideOre(REGLES.FUEL_GISEMENTS,Math.max(1,Math.round(GISEMENTS.mat*a)));}   // métal : 4 par carte (fuel, 28 novembre 2026)
  G.sonar=1;   // sonar à émettre (voir sonarStart, 10-rendu) : il part 10 à 30 tours après l’arrivée (22 novembre 2026 ; avant 10 à 20)
  G.items={};G.tracks={};G.lastDir=null;G.beasts=[];G.blood={};G.fv=2;
  G.inv=invTest();G.log=[];
  G.st.matiere=G.st.matiere||0;G.sonarAt=(G.turn||0)+10+Math.floor(Math.random()*21);
  if(typeof baseFinir==='function'&&(RECETTES[GEN.recette]||{}).base)baseFinir();
  const PLANS_POSES_M=PLANS_POSES={};
  machines();
  PLANS_POSES=PLANS_POSES_M;butinExplo();   // butin des pièces secrètes, des culs-de-sac et des coins reculés (22 novembre 2026)
  if(astroRec())astroportFin();   // butin des épaves, enregistreurs des épaves scellées
  terminauxFin();   // deux terminaux au moins, leurs actions locales, le réduit à cloison au besoin (07i)
  // garde-fou : un site inatteignable, la carte est refaite (trois fois au plus)
  if(G.sites[0]&&accesSite()<0&&(refait||0)<3)return niveau((refait||0)+1);
  spawnGroupes();mdlRemplit();   // butin et ennemis des emplacements de modules (07b)
  lastAct='move';palBiome(null);buildTiles();turnStealth();computeFOV();}
/* Le niveau d'une carte générée depuis le menu (REGEN, GÉNÉRER LA CARTE) est celui de sa recette (22 novembre 2026 ; avant,
   toujours 1) : une carte « cavernes » est un niveau 2, une « base » un niveau 3, et prend la faune (fenêtre LIFE) et les
   artefacts de ce niveau. La descente reprend de là. */
function newGame(){if(typeof uniteApplique==='function')uniteApplique();   // numéro d'unité en service (14l : +1 après une destruction)
  palNiveauRaz();SANS_VAISSEAU=false;NIV_GEN=NIV_RECETTE(GEN.recette);niveau();G.niv=NIV_GEN;   // G n'existe qu'une fois la carte générée
  // niveau 1 de l'Astroport : atterrissage en jargon machine, partie notée au registre du port (14l)
  if(G.ship&&G.niv===1&&G.fosses&&typeof n1Debut==='function')n1Debut();
  else if(G.ship)say('Atterrissage confirmé. Un site de forage signalé par l’orbiteur. '+NOM_FOREUSE+' est dans la soute ; la porte est à l’arrière.','info');
  else if(G.arrivee==='base')say(`Niveau ${G.niv} : ${NOM_FOREUSE} a traversé le plafond d’une salle, dans une base enfouie. Un site de forage est signalé plus loin.`,'info');
  // arrivée par un puits
  else say(`Niveau ${G.niv} : ${NOM_FOREUSE} a débouché dans un réseau de cavernes. Un site de forage plus bas est signalé.`,'info');
  G.st.nivMax=G.niv;if(typeof heritageRecoit==='function')heritageRecoit();}   // hacks hérités de l'unité précédente (14g)
// Nouvelle partie lancée par le joueur : la cinématique d'arrivée se rejoue (21 novembre 2026)
function nouvellePartie(){enJeu(newGame);started=true;$('overlay').hidden=true;render();playIntro();}
/* Foreuse détruite → « Déployer une nouvelle foreuse » (22 novembre 2026) : on repart toujours du niveau 1 (recette
   « atterrissage », avec le vaisseau), quelle que soit la recette affichée dans le menu Monde, et la cinématique d'arrivée
   se rejoue. La foreuse est neuve : rien n'est gardé de la précédente. Le menu Monde du joueur est remis en place après. */
function deployerForeuse(){const sauve=JSON.parse(JSON.stringify(GEN));recRange();recPrend(RECETTE_NIV(1));
  GEN.recette='atterrissage';enJeu(newGame,1);genRemet(sauve);started=true;$('overlay').hidden=true;render();playIntro();}
/* Niveau suivant (21 novembre 2026) : pas de vaisseau, on arrive par le puits. Le niveau 2 (et les suivants, tant qu'ils n'ont
   pas leur recette) est généré avec la recette « cavernes » et les réglages que le joueur lui a donnés dans le menu Monde,
   quelle que soit la recette affichée ; la case « Réglages au hasard » les tire d'abord, comme pour REGEN. Le menu Monde du
   joueur est remis en place aussitôt après. Avant : tous les réglages étaient tirés au hasard, sur la recette du menu.
   La foreuse garde tout ce qu'elle avait : vie, énergie, inventaire et matière en réserve. */
/* Éboulis d'arrivée (21 novembre 2026) : la foreuse a percé le plafond, des débris de roche sont éparpillés autour d'elle.
   Des gravats (praticables), serrés au pied de la foreuse et de plus en plus rares jusqu'à 5 cases, et un à trois rochers
   posés seulement là où leurs huit voisines sont libres : ils ne peuvent donc fermer aucun passage. Rien sur l'eau, les
   gouffres, les bâtiments, un objet, une clé ou une créature. */
function eboulis(){
  const t=G.t,R=5,dansBase=G.arrivee==='base',sol=v=>v===GROUND||v===GRASS||v===FLAT||(dansBase&&v===FLOOR),libre=(x,y)=>{const i=idx(x,y);
    if(dansBase&&((G.soc&&G.soc[i]!=null)||(G.lz&&G.lz[i])||B_PORTE(i)))return false;
    return !(G.items&&G.items[i]&&G.items[i].length)&&!(G.cles&&G.cles[i])&&!beastAt(x,y)&&!animalAt(x,y)&&!G.sites.some(s=>s.x===x&&s.y===y);};
  for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){const x=G.px+dx,y=G.py+dy,d=Math.hypot(dx,dy);
    if((!dx&&!dy)||d>R+.5||x<1||y<1||x>=W-1||y>=H-1)continue;
    if(sol(t[idx(x,y)])&&libre(x,y)&&Math.random()<.85*Math.pow(1-d/(R+1),1.6))t[idx(x,y)]=RUBBLE;}
  for(let k=0,n=rnd(1,3),e=0;k<n&&e<60;e++){const a=Math.random()*6.283,d=1.6+Math.random()*2.4,x=G.px+Math.round(Math.cos(a)*d),
    y=G.py+Math.round(Math.sin(a)*d);
    if(x<2||y<2||x>=W-2||y>=H-2||Math.max(Math.abs(x-G.px),Math.abs(y-G.py))<2)continue;const v=t[idx(x,y)];
    if(!(sol(v)||v===RUBBLE)||!libre(x,y)||DIRS.some(([dx,dy])=>!canWalk(t[idx(x+dx,y+dy)],true)||isWater(t[idx(x+dx,y+dy)])))continue;
    t[idx(x,y)]=ROCK;k++;}
  computeFOV();}
// remet le menu Monde tel qu'il était avant un tirage provisoire (les réglages d'une autre recette ne doivent pas y traîner)
function genRemet(sauve){for(const k in GEN)if(!(k in sauve))delete GEN[k];Object.assign(GEN,sauve);saveGen();buildGen();}
function niveauSuivant(hasard){   // hasard : un archétype monde et un archétype bâti tirés au hasard (Lab → Niv2, Niv3)
  // la génération tire les plans d'après ce que la foreuse sait déjà
  const sauve=JSON.parse(JSON.stringify(GEN)),inv=G.inv,st=G.st,tour=G.turn,dist=G.dist,niv=(G.niv||1)+1;SAV_GARDE=st.savoir||null;
  // sans hasard : les réglages en cours du menu Monde pour cette recette
  palNiveauSuivant();recRange();recPrend(RECETTE_NIV(niv));if(hasard)hasardReglages();SANS_VAISSEAU=true;NIV_GEN=niv;
  enJeu(niveau,niv);   // genPlanet refait l'objet G : tout ce que la foreuse garde est remis en place juste après
  SANS_VAISSEAU=false;genRemet(sauve);
  G.inv=inv;G.st=st;G.niv=niv;G.turn=tour;G.dist=dist;G.over=null;drilling=false;SAV_GARDE=null;
  // le délai du sonar (10 à 30 battements) part de l'arrivée : niveau() l'a compté depuis 0, avant qu'on remette le compteur de tours (22
  // novembre 2026 : il partait tout de suite)
  G.sonarAt=tour+(G.sonarAt||0);
  eboulis();
  say(G.arrivee==='base'?`Niveau ${G.niv}${G.amb?' — '+G.amb:''}. ${NOM_FOREUSE} a traversé le plafond d’une salle : il est dans une base enfouie. Un site de forage est signalé plus loin.`:`Niveau ${G.niv}${G.amb?' — '+G.amb:''}. ${NOM_FOREUSE} a percé le plafond et s'est écrasée plus bas. Un nouveau site de forage est signalé.`,'info');
  fuelDescente();   // chaque descente rend du fuel (28 novembre 2026)
  if(typeof hacksArrivee==='function')hacksArrivee();}   // emplacements de hack aux niveaux 3, 6, 9 (14g)
// devant un passage : pas de débris
const B_PORTE=i=>!!(BATI_DER&&BATI_DER.B.porte[i])||D4.some(([dx,dy])=>{const v=G.t[idx(i%W+dx,((i/W)|0)+dy)];return v===DOOR||v===LOCK;});

/* ---------- Bestiaire : édition des statistiques ---------- */
/* Durées à la place de la Vitesse (25 novembre 2026) : « Pas » et « Coup » en unités de temps, sur les paliers
   50 / 75 / 100 / 150 / 200 — plus petit, plus rapide (voir l'horloge dans 09 et 08-faune). */
const BFIELDS=[['dpas','Pas',25,400],['dcoup','Coup',100,400],['pv','PV',1,200],['dmin','Dégâts min',0,100],['dmax','Dégâts max',0,100],['pre','Précision',0,250],
  ['def','Défense',0,150],['crit','Crit %',0,100]];
const BEST_LIST=()=>[{key:'puce',o:SPECIES[0],ic:'an0r',
  role:'Suit à distance et recule ; attaque dès qu’un coup est tenté, par vous ou contre vous'},
  ...BEASTS.map((o,i)=>({key:o.bk||o.key,o,ic:'bz'+i+'r',role:o.role}))];
const BEST_DEF={};BEST_LIST().forEach(e=>{BEST_DEF[e.key]={};BFIELDS.forEach(([f])=>BEST_DEF[e.key][f]=e.o[f]);});
/* Coup 100 au moins (28 novembre 2026, demande du joueur : le double coup ne marchait pas) : aucune créature ne frappe plus
   vite qu'un battement ; celles qui frappent plus lentement (Broyeur, Artilleur) gardent leur durée. Les durées enregistrées
   (navigateur, base de l'artefact, Lab) sont ramenées à COUP_MIN au plus bas. */
const COUP_MIN=100;
const coupBorne=()=>BEST_LIST().forEach(e=>{if(!(e.o.dcoup>=COUP_MIN))e.o.dcoup=COUP_MIN;});
/* Bestiaire du code (28 novembre 2026) : quand les stats changent dans le code après une recopie des réglages du joueur, on
   avance BEST_CODE_LE. Un bestiaire enregistré avant cette date (base de l'artefact, navigateur) est déjà dans le code : il
   n'est pas repris, sinon il écraserait le changement. Un nouvel enregistrement depuis le Lab est repris normalement. */
const BEST_CODE_LE=Date.parse('2026-11-28T02:15:00Z');
try{const b=clePuce(JSON.parse(localStorage.getItem('np-best')||'null')),
    ok=(+localStorage.getItem('np-best-le')||0)>=BEST_CODE_LE;
  if(b&&ok)BEST_LIST().forEach(e=>{if(b[e.key])BFIELDS.forEach(([f])=>{if(typeof b[e.key][f]==='number')e.o[f]=b[e.key][f];});});}catch(e){}
coupBorne();
function saveBest(){const o={};BEST_LIST().forEach(e=>{o[e.key]={};BFIELDS.forEach(([f])=>o[e.key][f]=e.o[f]);});
  try{localStorage.setItem('np-best',JSON.stringify(o));localStorage.setItem('np-best-le',String(Math.max(Date.now(),BEST_CODE_LE)));
    }catch(e){}touchLocal();}
/* Les réglages enregistrés d'avant le 25 novembre 2026 portaient une Vitesse, qui n'existe plus : les durées
   gardent alors les valeurs du code, et le reste (PV, dégâts, précision…) reste celui du joueur. */
try{if(localStorage.getItem('np-mig')!=='horloge1'){saveBest();
  /* le crabot garde les PV de BEASTS (22, réglage du joueur) : la mise à 25 est retirée le 21 novembre 2026 */
  localStorage.setItem('np-mig','horloge1');}}catch(e){}
/* Fenêtre Bestiaire (refaite le 19 novembre 2026) : à droite la liste des espèces en colonne ; à gauche, jusqu'à quatre
   espèces choisies, côte à côte dans un tableau — une ligne par statistique — pour les modifier et les comparer.
   Un clic dans la liste ajoute ou retire une espèce ; la cinquième choisie remplace la plus ancienne. */
let BEST_SEL=null;
// dégâts en jeu de chaque niveau (bloc C du chantier survie, 28 novembre 2026) : lecture seule, sous les champs du Bestiaire
const bestReel=o=>NIVS.map(n=>`<span>niv. ${n} : <b>${dmgTxt(o,n)}</b></span>`).join('<br>');
function buildBest(){const L=BEST_LIST();
  if(!BEST_SEL)BEST_SEL=L.slice(0,4).map(e=>e.key);BEST_SEL=BEST_SEL.filter(k=>L.some(e=>e.key===k));
  const S=BEST_SEL.map(k=>L.find(e=>e.key===k));
  $('bestSide').innerHTML=L.map(e=>{const n=BEST_SEL.indexOf(e.key);return `<button class="bli${n>=0?' sel':''}" data-k="${e.key}" aria-pressed="${n>=0}"><img src="${ICON[e.ic]||''}" alt=""><b>${e.o.n}</b><span>${n>=0?n+1:''}</span></button>`;}).join('');
  $('bestList').innerHTML=!S.length?'<p class="mnote">Choisissez jusqu’à quatre espèces dans la liste.</p>':`<table class="btab"><thead><tr><th></th>${S.map(e=>`<th scope="col"><img src="${ICON[e.ic]||''}" alt=""><b>${e.o.n}</b><button class="gx" data-x="${e.key}" aria-label="Retirer ${e.o.n} de la comparaison" title="Retirer">×</button></th>`).join('')}</tr></thead>
    <tbody>${BFIELDS.map(([f,l,mn,mx])=>`<tr><th scope="row">${l}</th>${S.map(e=>`<td><input type="number" id="bf-${e.key}-${f}" data-k="${e.key}" data-f="${f}" min="${mn}" max="${mx}" step="1" value="${e.o[f]}" aria-label="${l} : ${e.o.n}"></td>`).join('')}</tr>`).join('')}
    <tr class="breel"><th scope="row" title="Dégâts min et max multipliés par la menace de chaque niveau (REGLES.MENACE_DEG) : c’est ce qui frappe en jeu">Dégâts en jeu</th>${S.map(e=>`<td id="breel-${e.key}">${bestReel(e.o)}</td>`).join('')}</tr>
    <tr class="brole"><th scope="row">Rôle</th>${S.map(e=>`<td>${e.role}</td>`).join('')}</tr></tbody></table>`;}
function bestToggle(k){const i=BEST_SEL.indexOf(k);if(i>=0)BEST_SEL.splice(i,1);else{BEST_SEL.push(k);
  if(BEST_SEL.length>4)BEST_SEL.shift();}buildBest();}
$('bestSide').addEventListener('click',e=>{const b=e.target.closest('.bli');if(!b)return;bestToggle(b.dataset.k);const n=$('bestSide').querySelector(`.bli[data-k="${b.dataset.k}"]`);if(n)n.focus();});
$('bestList').addEventListener('click',e=>{const b=e.target.closest('button[data-x]');if(b)bestToggle(b.dataset.x);});
/* ---------- Discrétion : base modifiable et liste des modificateurs (13 novembre 2026) ---------- */
function buildDisc(){
  const b=STEALTH_BASE,c=(a,f,w,r)=>stealthCalc(b,a,f,w,r),now=G.stealth||STEALTH_BASE;
  const rows=[
    ['Marcher','—',c('move',0,0)],
    ['Briser une paroi',`× ${String(DIG_MULT).replace('.',',')} · le bruit s’entend aussi hors de vue`,c('dig',0,0)],
    ['Attendre sur place','÷ 2',c('wait',0,0)],
    ['Herbes basses (couvert)','÷ 2',c('move',1,0)],
    ['Parois adjacentes',`− 1 par 2 parois (max − ${WALL_MAX})`,`${c('move',0,1)} · ${c('move',0,3)} · ${c('move',0,8)} <small>(2, 4, 8 parois)</small>`],
    ['Courir',`+ ${SPRINT_NOISE}, après tout le reste`,c('move',0,0,1)]];
  // mise en page large et basse (15 novembre 2026) : la base et l'état en une ligne, les modificateurs à gauche, les règles à droite
  $('discList').innerHTML=`<div class="dtop"><label for="bf-stealth">Base<input type="number" id="bf-stealth" min="2" max="30" step="1" value="${b}"></label>
      <span>En ce moment : <b>${now}</b> case${now>1?'s':''}</span><span class="dhint">Rayon commun à tous les ennemis · mémorisé · touche V pour l’afficher</span></div>
    <div class="dcols"><div><h3>Modificateurs</h3><table class="dtab dmod"><thead><tr><th>Situation</th><th>Effet</th><th>Portée (base ${b})</th></tr></thead><tbody>`
    +rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')+`</tbody></table></div>
    <div class="dregles"><h3>Règles</h3>
      <div><span>Dans ce rayon et en vue, chance par tour d’être remarqué</span><b>${Math.round(NOTICE*100)} %</b></div>
      <div><span>Un ennemi en chasse vous garde en vue jusqu’à</span><b>× ${HUNT_MULT} la portée</b></div>
      <div><span>Au-delà, chance par tour qu’il perde votre trace</span><b>${Math.round(LOSE_TRACK*100)} %</b></div>
      <div><span>Portée minimale</span><b>${STEALTH_MIN}</b></div>
      <div><span>Arrondis</span><b>au supérieur</b></div>
      <div><span>Ordre</span><b>base, briser, attendre, herbes, parois, course</b></div></div></div>`;
}
function openDisc(){buildDisc();$('discretion').hidden=false;$('discClose').focus();}
function closeDisc(){$('discretion').hidden=true;$('discBtn').focus();render();}
function openBest(){buildBest();$('bestiary').hidden=false;bestHaut();$('bestClose').focus();}
function bestHaut(){}
function closeBest(){$('bestiary').hidden=true;$('bestBtn').focus();render();}

// Éclats de métal : ORE_PCT % des cases de montagne (hors rangée extérieure indestructible) en contiennent ; brisée, la roche les laisse
// tomber au sol ; la foreuse qui passe dessus les ramasse et regagne des points de vie selon la densité.
// G.ore[i] = 'roche1|2|3' (dans la paroi) ou 'sol1|2|3' (tombés) ; 1 petits, 2 moyens, 3 gros (ORE_MIX : part de chaque densité)
const ORE_PCT=10,ORE_PV=[0,30,40,50],   // gisements rares mais gros depuis le 13 novembre 2026 (avant : 10, 15, 20)
      ORE_MIX=[0,.5,.3,.2],ORE_NOM=['','petits','moyens','gros'];
// Matière (13 novembre 2026) : second métal, couleur accent, même code précédé de « m » ('mroche2', 'msol2'). Ramassée, elle remplit la réserve G.st.matiere.
const oreLv=v=>+String(v).slice(-1)||3,oreSol=v=>/^m?sol/.test(String(v)),oreMat=v=>String(v)[0]==='m',oreTile=(v,sol)=>{const l=oreLv(v);
  return TL[(oreMat(v)?'mat':'ore')+(sol?'Sol':'')+(l===3?'':l)];};
// nMetal gisements d'éclats de métal et nMat de Matière, tirés parmi les cases de montagne (dans la limite des places)
/* Roche dure (16 novembre 2026) : plus on s'enfonce dans un massif, plus la montagne devient dure.
   La profondeur d'une case est sa distance au premier terrain qui n'est pas de la montagne (4 directions) ;
   la chance de durcir monte avec elle, de sorte qu'un massif garde une écorce tendre et un cœur impénétrable.
   La rangée extérieure de la carte est en roche dure (21 novembre 2026). */
const DURCIR=[0,0,0,.3,.65,.9,1];   // rien sous deux cases de profondeur : les massifs gardent une écorce tendre
function durcir(){const t=G.t,d=new Int16Array(W*H).fill(-1),q=[];
  for(let i=0;i<W*H;i++)if(t[i]!==MOUNT){d[i]=0;q.push(i);}
  for(let k=0;k<q.length;k++){const c=q[k],x=c%W,y=(c/W)|0;
    for(let n=0;n<4;n++){const a=x+DIRS[n][0],b=y+DIRS[n][1];if(a<0||b<0||a>=W||b>=H)continue;const j=idx(a,b);
      if(d[j]<0){d[j]=d[c]+1;q.push(j);}}}
  for(let i=0;i<W*H;i++){const x=i%W,y=(i/W)|0;if(x<1||y<1||x>=W-1||y>=H-1){t[i]=HARD;continue;}
    if(t[i]!==MOUNT)continue;if(Math.random()<DURCIR[Math.min(d[i],DURCIR.length-1)])t[i]=HARD;}}
/* Coût en forages pour atteindre chaque case (26 novembre 2026), depuis la zone où la foreuse arrive : entrer dans
   une case praticable ne coûte rien, percer une roche ou une montagne coûte 1. La roche dure, les murs, les piliers,
   les vitres, les gouffres et les machines ne se percent pas. Les cases laissées à −1 demandent plus de max forages,
   ou sont inatteignables. Sert à ne pas enfermer un gisement (voir hideOre). */
function coutForage(max){const N=W*H,d=new Int32Array(N).fill(-1),
    dur=v=>v===ROCK||v===MOUNT,
    libre=v=>!(dur(v)||v===HARD||v===WALL||v===PILLAR||v===VITRE||v===CHASM||v>=MACHINE);
  let dep=-1;
  if(G.px!=null&&G.py!=null&&G.px>=0&&G.py>=0){const i=idx(G.px,G.py);if(libre(G.t[i])||dur(G.t[i]))dep=i;}
  if(dep<0)for(let i=0;i<N&&dep<0;i++)if(libre(G.t[i]))dep=i;
  if(dep<0)return d;
  d[dep]=0;let front=[dep];
  for(let k=0;k<=max&&front.length;k++){
    const q=front.slice();                                   // à coût k : on s'étend librement sur le praticable
    for(let p=0;p<q.length;p++){const c=q[p],x=c%W,y=(c/W)|0;
      for(const [dx,dy] of D4){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;
        const j=idx(nx,ny);if(d[j]>=0)continue;if(!libre(G.t[j]))continue;d[j]=k;q.push(j);}}
    const suiv=[];                                            // puis on perce une couche : coût k+1
    if(k<max)for(const c of q)for(const [dx,dy] of D4){const nx=c%W+dx,ny=((c/W)|0)+dy;
      if(nx<0||ny<0||nx>=W||ny>=H)continue;const j=idx(nx,ny);
      if(d[j]>=0||!dur(G.t[j]))continue;d[j]=k+1;suiv.push(j);}
    front=suiv;}
  return d;}
const ORE_DIGS=6;   // un gisement ne doit jamais demander plus de six cases à percer pour être atteint
function hideOre(nMetal=3,nMat=1){G.ore={};const lib=[];
  /* Un gisement doit rester atteignable : pas plus de ORE_DIGS cases à percer depuis la zone de départ (26 novembre
     2026, demande de l'utilisateur). Avant, on ne regardait que ses 8 voisines (« pas plus de 3 roches dures »), ce
     qui laissait passer des gisements enfermés un peu plus loin par la roche dure. L'ancien test reste en second
     filtre : il écarte en plus les gisements collés à la roche dure, pénibles à dégager. */
  const cout=coutForage(ORE_DIGS);
  const dures=i=>{let n=0;for(const [dx,dy] of DIRS)if(G.t[idx(i%W+dx,((i/W)|0)+dy)]===HARD)n++;return n;},tous=[];
  for(let i=0;i<W*H;i++){const x=i%W,y=(i/W)|0;
    if(G.t[i]===MOUNT&&x>0&&y>0&&x<W-1&&y<H-1&&cout[i]>=0){tous.push(i);if(dures(i)<=3)lib.push(i);}}
  if(lib.length<nMetal+nMat)lib.splice(0,lib.length,...tous);   // carte sans roche tendre assez dégagée : on reprend tout, faute de mieux
  for(let i=lib.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[lib[i],lib[j]]=[lib[j],lib[i]];}
  lib.slice(0,nMetal+nMat).forEach((i,k)=>{const r=Math.random();G.ore[i]=(k<nMetal?'':'m')+'roche'+(r<ORE_MIX[1]?1:r<ORE_MIX[1]+ORE_MIX[2]?2:3);});}
