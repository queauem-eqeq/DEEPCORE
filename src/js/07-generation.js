/* ---------- Génération ---------- */
function noise(scale){const gw=Math.ceil(W/scale)+2,g=Array.from({length:gw*(Math.ceil(H/scale)+2)},Math.random);
  return (x,y)=>{const gx=x/scale,gy=y/scale,x0=Math.floor(gx),y0=Math.floor(gy),tx=gx-x0,ty=gy-y0,sx=tx*tx*(3-2*tx),sy=ty*ty*(3-2*ty),v=(i,j)=>g[j*gw+i];
    return (v(x0,y0)*(1-sx)+v(x0+1,y0)*sx)*(1-sy)+(v(x0,y0+1)*(1-sx)+v(x0+1,y0+1)*sx)*sy;};}
function fbm(){const a=noise(SZ(14,4)),b=noise(SZ(6,3));return (x,y)=>a(x,y)*.7+b(x,y)*.3;}
let G,vis=new Uint8Array(W*H),liqFrame=0,started=false,drilling=false;

function logPush(m,c){G.log=G.log||[];const last=G.log[G.log.length-1];
  if(last&&last.m===m&&last.t===G.turn)return;
  if(last&&last.m===m){last.n=(last.n||1)+1;last.t=G.turn;}else G.log.push({m,c:c||'',t:G.turn});
  if(G.log.length>60)G.log.shift();}
function say(m,c){G.msg={m,c:c||''};logPush(m,c);}
function sayMore(m,c){G.msg=G.msg?{m:G.msg.m+' '+m,c:c||G.msg.c}:{m,c:c||''};logPush(m,c);}
const blocks=v=>v===ROCK||v===MOUNT||v===HARD||v===CHASM||v===SHIP||v===WALL||v===PILLAR||v===LOCK;
// Diagonales comme dans Brogue : un pas (ou un coup) en diagonale est impossible si l'une des deux cases voisines
// orthogonales est une paroi (rocher, montagne, coque du vaisseau) — on ne coupe pas les coins. Vaut pour tout le monde.
const wallish=v=>v===ROCK||v===MOUNT||v===SHIP||v===WALL||v===PILLAR||v===LOCK;
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
    for(let k=0;k<q.length;k++){const c=q[k],x=c%w,y=(c/w)|0;for(let d=0;d<4;d++){const a=x+DIRS[d][0],b=y+DIRS[d][1];if(a<0||b<0||a>=w||b>=h)continue;const j=b*w+a;if(g[j]&&!lab[j]){lab[j]=1;q.push(j);}}}
    if(q.length>best.length)best=q;}
  return best.map(c=>[c%w,(c/w)|0]);
}
// Toutes les cases franchissables sont-elles reliées ?
function connectedAll(t){let s0=-1,tot=0;for(let i=0;i<W*H;i++)if(!blocks(t[i])){tot++;if(s0<0)s0=i;}
  if(s0<0)return true;const seen=new Uint8Array(W*H),q=[s0];seen[s0]=1;
  for(let k=0;k<q.length;k++){const c=q[k],x=c%W,y=(c/W)|0;for(const[dx,dy]of DIRS){const a=x+dx,b=y+dy;if(a<0||b<0||a>=W||b>=H)continue;const j=idx(a,b);if(!seen[j]&&!blocks(t[j])&&diagOk(x,y,dx,dy,t)){seen[j]=1;q.push(j);}}}
  return q.length===tot;}
// Pose des blobs un par un ; avec check, un blob qui coupe la carte est refusé
function placeBlobs(t,target,val,size,fill,iters,check){
  let count=0,tries=0;
  while(count<target&&tries<300){tries++;
    const [w,h]=size(count/Math.max(1,target)),cells=caBlob(w,h,fill,iters);if(cells.length<4)continue;
    const ox=rnd(1,W-w-1),oy=rnd(1,H-h-1),ch=[];
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
function placeLakes(t,target){
  const near=nearChasm(t),ok=i=>t[i]===GROUND&&!near[i],rive=noise(SZ(8,3));
  let count=0,tries=0;
  while(count<target&&tries<600){tries++;
    const p=count/Math.max(1,target),w=Math.max(6,Math.round((26-p*10)*F)),h=Math.max(4,Math.round((13-p*5)*F)),cells=caBlob(w,h,.55,5);if(cells.length<6)continue;
    const ox=rnd(2,W-w-2),oy=rnd(2,H-h-2);
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
    for(const i of lac){const x=i%W,y=(i/W)|0;if((d.has(i)?d.get(i):1e9)>large*(.3+rive(x,y)*1.6))t[i]=DEEP;}   // aucun rivage atteint : pleine eau, donc profond
  }
}
// Sécurité finale : aucune case d'eau au contact d'un gouffre ou d'un pont
function separateWater(t){const near=nearChasm(t);for(let i=0;i<W*H;i++)if((t[i]===LIQ||t[i]===DEEP)&&near[i])t[i]=GROUND;}
// Petit tas binaire pour Dijkstra
function heap(){const a=[];return{push(v,p){a.push([p,v]);let i=a.length-1;while(i>0){const j=(i-1)>>1;if(a[j][0]<=a[i][0])break;[a[i],a[j]]=[a[j],a[i]];i=j;}},
  pop(){const top=a[0],last=a.pop();if(a.length){a[0]=last;let i=0;for(;;){const l=2*i+1,r=l+1;let m=i;if(l<a.length&&a[l][0]<a[m][0])m=l;if(r<a.length&&a[r][0]<a[m][0])m=r;if(m===i)break;[a[i],a[m]]=[a[m],a[i]];i=m;}}return top;},get size(){return a.length;}};}
// Relie toutes les zones : ponts au-dessus des gouffres, cols dans la montagne, rochers dégagés
function connect(t){
  for(let guard=0;guard<60;guard++){
    const lab=new Int32Array(W*H).fill(-1),regs=[];
    for(let i=0;i<W*H;i++){if(blocks(t[i])||lab[i]>=0)continue;const id=regs.length,q=[i];lab[i]=id;
      for(let k=0;k<q.length;k++){const c=q[k],x=c%W,y=(c/W)|0;for(const[dx,dy]of DIRS){const a=x+dx,b=y+dy;if(a<0||b<0||a>=W||b>=H)continue;const j=idx(a,b);if(lab[j]<0&&!blocks(t[j])&&diagOk(x,y,dx,dy,t)){lab[j]=id;q.push(j);}}}
      regs.push(q);}
    if(regs.length<=1)return;
    let main=0;regs.forEach((r,i)=>{if(r.length>regs[main].length)main=i;});
    // petites poches isolées : comblées par des rochers
    let other=-1;for(let i=0;i<regs.length;i++){if(i===main)continue;if(regs[i].length<5){for(const c of regs[i])if(t[c]!==DEEP&&t[c]!==LIQ)t[c]=ROCK;else t[c]=ROCK;}else if(other<0)other=i;}
    if(other<0)continue;
    const dist=new Float64Array(W*H).fill(Infinity),prev=new Int32Array(W*H).fill(-1),hp=heap();
    for(const c of regs[main]){dist[c]=0;hp.push(c,0);}
    let hit=-1;
    while(hp.size){const [d,c]=hp.pop();if(d>dist[c])continue;if(lab[c]===other){hit=c;break;}
      const x=c%W,y=(c/W)|0;
      for(let k=0;k<4;k++){const a=x+DIRS[k][0],b=y+DIRS[k][1];if(a<1||b<1||a>=W-1||b>=H-1)continue;const j=idx(a,b),v=t[j];
        if(v===SHIP||v===WALL||v===PILLAR)continue;const cost=v===CHASM?3:v===ROCK?2:v===MOUNT?7:1;const nd=d+cost;if(nd<dist[j]){dist[j]=nd;prev[j]=c;hp.push(j,nd);}}}
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
        if(t[idx(x2,y2)]===CHASM&&t[idx(x2,y)]!==CHASM&&t[idx(x,y2)]!==CHASM){const [rx,ry]=Math.random()<.5?[x,y]:[x2,y2];t[idx(rx,ry)]=GROUND;ch=true;}}}
    // petits trous : comblés
    const seen=new Uint8Array(W*H);
    for(let i=0;i<W*H;i++){if(t[i]!==CHASM||seen[i])continue;const q=[i];seen[i]=1;
      for(let k=0;k<q.length;k++){const c=q[k],x=c%W,y=(c/W)|0;for(let d=0;d<4;d++){const a=x+DIRS[d][0],b=y+DIRS[d][1];if(a<0||b<0||a>=W||b>=H)continue;const j=idx(a,b);if(!seen[j]&&t[j]===CHASM){seen[j]=1;q.push(j);}}}
      if(q.length<CHASM_MIN){for(const c of q)t[c]=GROUND;ch=true;}}
    // ponts qui ne franchissent plus rien : redeviennent du sol
    for(let i=0;i<W*H;i++){if(t[i]!==BRIDGE)continue;const x=i%W,y=(i/W)|0;
      if(![0,1,2,3].some(d=>{const a=x+DIRS[d][0],b=y+DIRS[d][1];return a>=0&&b>=0&&a<W&&b<H&&t[idx(a,b)]===CHASM;})){t[i]=GROUND;ch=true;}}
    if(!ch)break;}}
// Pose le vaisseau sur une zone dégagée (marge d'une case autour) ; à défaut, sur la zone la moins encombrée, puis relie tout
function placeShip(t){const ok=v=>v===GROUND||v===GRASS||v===FLAT||v===RUBBLE||v===ROCK;let bx=3,by=3,bb=1e9;
  for(let k=0;k<800&&bb>0;k++){const x0=rnd(3,W-SGW-4),y0=rnd(3,H-SGH-4);let bad=0;
    for(let y=y0-1;y<=y0+SGH;y++)for(let x=x0-1;x<=x0+SGW;x++)if(!ok(t[idx(x,y)]))bad++;
    if(bad<bb){bb=bad;bx=x0;by=y0;}}
  for(let y=by-1;y<=by+SGH;y++)for(let x=bx-1;x<=bx+SGW;x++)t[idx(x,y)]=GROUND;
  for(let cy=0;cy<SGH;cy++)for(let cx=0;cx<SGW;cx++){const c=SHIP_GRID[cy][cx];if(c==='.')continue;t[idx(bx+cx,by+cy)]=(c==='I'||c==='D')?DECK:SHIP;}
  if(bb>0)connect(t);
  tidyChasms(t);
  return {x:bx,y:by};}
// Bord de carte irrégulier : une bande de montagne d'épaisseur variable (1 à 10 cases, environ 3 en moyenne, caps et baies ; 20 % de surface au plus)
// suit les quatre côtés, puis un passage d'automate cellulaire casse les angles droits. La rangée extérieure reste indestructible.
function roughBorder(t){for(let k=0;k<8;k++){t.fill(GROUND);roughBorderOnce(t);let m=0;for(let i=0;i<W*H;i++)if(t[i]===MOUNT)m++;if(m<=W*H*.19)return;}}
function roughBorderOnce(t){const n1=noise(SZ(7,3)),n2=noise(SZ(3,2)),band=new Uint8Array(W*H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const d=Math.min(x,y,W-1-x,H-1-y),v=n1(x,y)*.75+n2(x,y)*.25,th=.5+Math.pow(v,2.2)*10;
    if(d<th){t[idx(x,y)]=MOUNT;}if(d<15)band[idx(x,y)]=1;}
  for(let it=0;it<2;it++){const nt=t.slice();
    for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=idx(x,y);if(!band[i])continue;let c=0;for(const[dx,dy]of DIRS)if(t[idx(x+dx,y+dy)]===MOUNT)c++;
      nt[i]=t[i]===MOUNT?(c>=4?MOUNT:GROUND):(c>=5?MOUNT:GROUND);}
    for(let i=0;i<W*H;i++)if(band[i])t[i]=nt[i];}
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(x===0||y===0||x===W-1||y===H-1)t[idx(x,y)]=MOUNT;}
function genPlanet(){
  setSize(GEN.taille);vis=new Uint8Array(W*H);
  const N=W*H,P=k=>Math.round(N*GEN[k]/100),fill=GEN.remplissage/100,it=GEN.iterations;
  for(let attempt=0;attempt<30;attempt++){
    const relax=attempt>=15,last=attempt===29;
    const t=new Array(N).fill(GROUND);
    roughBorder(t);   // bord de carte irrégulier, en roche
    const mode=GEN.methode,mt=P('montagne'),ct=P('gouffre');
    const mSize=p=>[rnd(SZ(14,4),SZ(30,6))-Math.round(p*8*F),rnd(SZ(9,3),SZ(18,5))-Math.round(p*4*F)],cSize=()=>[rnd(SZ(8,3),SZ(18,5)),rnd(SZ(5,3),SZ(10,4))];
    const cz=noise(SZ(11,4)),cm=fbm(),crev=sc((x,y)=>-Math.abs(cz(x,y)-.5)-(cm(x,y)<.45?1:0));
    if(mode==='bruit'){rankFill(t,sc(fbm()),mt,MOUNT);rankFill(t,crev,ct,CHASM);}
    else if(mode==='automate'){const a=placeBlobs(t,mt,MOUNT,mSize,fill,it,true);if(a<mt)rankFill(t,sc(fbm()),mt-a,MOUNT);const b=placeBlobs(t,ct,CHASM,cSize,fill,it,false);if(b<ct)rankFill(t,crev,ct-b,CHASM);}
    else{const n=rankFill(t,sc(fbm()),Math.round(mt/2),MOUNT),a=placeBlobs(t,mt-n,MOUNT,mSize,fill,it,true);if(n+a<mt)rankFill(t,sc(fbm()),mt-n-a,MOUNT);
      const c=rankFill(t,crev,Math.round(ct/2),CHASM),b=placeBlobs(t,ct-c,CHASM,cSize,fill,it,false);if(c+b<ct)rankFill(t,crev,ct-c-b,CHASM);}
    placeLakes(t,P('eau'));
    const gC=placeBlobs(t,P('herbe'),GRASS,()=>[rnd(SZ(10,4),SZ(22,6)),rnd(SZ(6,3),SZ(13,4))],.5,4,false);if(gC<P('herbe'))rankFill(t,sc(fbm()),P('herbe')-gC,GRASS);
    // Herbes hautes / basses (15 novembre 2026) : plus de coupure nette moitié-moitié. Trois couches s'additionnent : de grandes zones
    // (qui donnent parfois une forte majorité de hautes ou de basses), des bosquets et des touffes de 2 à 6 cases, et un grain case par case.
    // Les grandes zones sont écrasées vers le milieu (mises au carré) : le plus souvent c'est le mélange qui l'emporte.
    // La part d'herbes hautes varie d'une carte à l'autre, de 35 à 65 %.
    {const gros=noise(SZ(15,5)),moyen=noise(SZ(6,3)),touffe=noise(SZ(3,2)),gc=[],gn=new Float32Array(N);for(let i=0;i<N;i++)if(t[i]===GRASS)gc.push(i);
      for(const i of gc){const x=i%W,y=(i/W)|0,g=gros(x,y)*2-1;gn[i]=Math.sign(g)*g*g*1.5+(moyen(x,y)*2-1)*.45+(touffe(x,y)*2-1)*.6+(Math.random()*2-1)*.35;}
      gc.sort((a,b)=>gn[a]-gn[b]);for(const i of gc.slice(0,Math.round(gc.length*(.35+Math.random()*.3))))t[i]=FLAT;}
    for(let i=0;i<N;i++)if(t[i]===GROUND&&Math.random()<.035)t[i]=ROCK;
    tidyChasms(t);connect(t);tidyChasms(t);separateWater(t);
    const ship=SANS_VAISSEAU?null:placeShip(t);let sx,sy;
    if(ship){sx=ship.x+2;sy=ship.y+2;}
    else{let ok=false;                                             // niveaux suivants : arrivée par le puits, sur un carré de sol dégagé
      for(let k=0;k<4000&&!ok;k++){sx=rnd(4,W-5);sy=rnd(4,H-5);ok=true;for(let dy=-1;dy<=1&&ok;dy++)for(let dx=-1;dx<=1;dx++){const v=t[idx(sx+dx,sy+dy)];if(!canWalk(v,true)||isWater(v)){ok=false;break;}}}   // le puits débouche toujours au sec
      if(ok)for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)t[idx(sx+dx,sy+dy)]=GROUND;   // herbes comprises : le puits les a couchées (sans cela, un biome très herbu ne trouvait pas de place et la génération traînait)
      if(!ok){if(!last)continue;sx=W>>1;sy=H>>1;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)t[idx(sx+dx,sy+dy)]=GROUND;}}
    const st=idx(sx,sy);   // la foreuse démarre au fond du couloir (case du haut), mèche vers la porte
    const d=new Int32Array(N).fill(-1),q=[st];d[st]=0;
    for(let k=0;k<q.length;k++){const c=q[k],x=c%W,y=(c/W)|0;for(const[dx,dy]of DIRS){const n=idx(x+dx,y+dy);if(d[n]>=0||blocks(t[n])||!diagOk(x,y,dx,dy,t))continue;d[n]=d[c]+1;q.push(n);}}
    let cand=q.filter(c=>t[c]===GROUND&&d[c]>(relax?SZ(6,3):SZ(14,5)));
    if(last&&cand.length<NSITES)cand=q.filter(c=>c!==st&&t[c]!==DEEP);
    cand.sort((a,b)=>d[b]-d[a]);cand=cand.slice(0,Math.max(1,Math.ceil(cand.length/3)));   // site unique : dans le tiers le plus éloigné de l'arrivée, il faut traverser la carte
    const sites=[],gap=relax?SZ(10,4):SZ(20,6);
    for(let k=0;k<800&&sites.length<NSITES;k++){const c=cand[Math.floor(Math.random()*cand.length)];if(c==null)break;const x=c%W,y=(c/W)|0;
      if(sites.some(s=>Math.abs(s.x-x)+Math.abs(s.y-y)<(last?4:gap)))continue;sites.push({x,y});}
    if(sites.length<NSITES&&!last)continue;
    G={t,seen:new Array(N).fill(0),px:sx,py:sy,turn:0,dist:0,over:null,msg:null,ship,face:'d',
      st:{vie:100,vieMax:100,energie:100,energieMax:100,repar:0,power:10,vitesse:5,degats:0,capteur:10,cout:10,pre:100,def:10,crit:5},
      sites:sites.map((s,i)=>({x:s.x,y:s.y,depth:10,id:LETTERS[i],seen:false,known:false}))};
    return;
  }
}
/* ---------- Le niveau (16 novembre 2026) ----------
   Un seul niveau, toujours celui de l'atterrissage : le vaisseau, un site de forage, et le relief et la faune réglés
   dans le menu Monde. La descente en 5 niveaux, ses six biomes, ses archétypes de monde, son budget de menace par
   niveau et les cartes d'essai ont été retirés ce jour-là, à la demande de l'utilisateur : le jeu se règle maintenant
   entièrement depuis le menu Monde, et REGEN tire une nouvelle carte avec les mêmes réglages. */
// pvDe / dmgDe : points de vie et dégâts d'une espèce tels que le jeu les lit. Aujourd'hui ce sont les valeurs du Bestiaire, sans modification ;
// ces deux fonctions restent le seul endroit à changer si l'on veut un jour les faire varier.
// dégâts d'une créature : tirés à chaque coup entre dmin et dmax (16 novembre 2026 ; une valeur fixe avant)
const pvDe=sp=>sp.pv,dmgDe=sp=>sp.dmin+Math.floor(Math.random()*(sp.dmax-sp.dmin+1)),dmgTxt=sp=>sp.dmin===sp.dmax?''+sp.dmin:sp.dmin+'-'+sp.dmax,dmgMoy=sp=>(sp.dmin+sp.dmax)/2;
// Gisements pour une carte de taille 2 ; les autres tailles en proportion de leur surface.
const GISEMENTS={metal:3,mat:1};
let SANS_VAISSEAU=false;
// Génère la carte à partir des réglages en cours du menu Monde (relief, taille, faune), avec le vaisseau.
function niveau(){drilling=false;
  genPlanet();
  G.w=W;G.h=H;
  batiments();   // structures bâties (07b), avant la roche dure et les métaux
  lifeCalc();
  durcir();   // la roche dure avant les métaux : ils n'y apparaissent jamais
  {const a=W*H/(48*32);G.eff={};G.fum={};hideOre(Math.max(1,Math.round(GISEMENTS.metal*a)),Math.max(1,Math.round(GISEMENTS.mat*a)));}
  G.sonar=1;   // sonar à émettre (voir sonarStart, 10-rendu) : il part 10 à 20 tours après l'arrivée
  G.items={};G.tracks={};G.lastDir=null;G.beasts=[];G.blood={};G.fv=2;
  G.inv=invTest();G.log=[];
  G.st.matiere=G.st.matiere||0;G.sonarAt=(G.turn||0)+10+Math.floor(Math.random()*11);
  spawnAnimals();spawnBeasts();lastAct='move';palBiome(null);buildTiles();turnStealth();computeFOV();}
const fauneTxt=()=>LIFE_LBL.filter(([k])=>LIFE[k]>0).map(([,l])=>l).join(', ')||'aucune';
function newGame(){niveau();
  say('Atterrissage confirmé. Un site de forage signalé par l’orbiteur. La foreuse est dans la soute ; la porte est à l’arrière.','info');}

/* ---------- Bestiaire : édition des statistiques ---------- */
const BFIELDS=[['v','Vitesse',1,10],['pv','PV',1,200],['dmin','Dégâts min',0,100],['dmax','Dégâts max',0,100],['pre','Précision',0,250],['def','Défense',0,150],['crit','Crit %',0,100]];
const BEST_LIST=()=>[{key:'insectoide',o:SPECIES[0],ic:'an0r',role:'Suit à distance et recule ; attaque dès qu’un coup est tenté, par vous ou contre vous'},...BEASTS.map((o,i)=>({key:o.key,o,ic:'bz'+i+'r',role:o.role}))];
const BEST_DEF={};BEST_LIST().forEach(e=>{BEST_DEF[e.key]={};BFIELDS.forEach(([f])=>BEST_DEF[e.key][f]=e.o[f]);});
try{const b=JSON.parse(localStorage.getItem('np-best')||'null');if(b)BEST_LIST().forEach(e=>{if(b[e.key])BFIELDS.forEach(([f])=>{if(typeof b[e.key][f]==='number')e.o[f]=b[e.key][f];});});}catch(e){}
function saveBest(){const o={};BEST_LIST().forEach(e=>{o[e.key]={};BFIELDS.forEach(([f])=>o[e.key][f]=e.o[f]);});try{localStorage.setItem('np-best',JSON.stringify(o));}catch(e){}touchLocal();}
try{if(localStorage.getItem('np-mig')!=='eq1'){SPECIES[0].v=6;BEASTS[0].pv=25;saveBest();
  localStorage.setItem('np-mig','eq1');}}catch(e){}
function buildBest(){
  $('bestList').innerHTML=BEST_LIST().map(e=>`<div class="bcard"><div class="bh"><img src="${ICON[e.ic]||''}" alt=""><div><b>${e.o.n}</b><br><span>${e.role}</span></div></div>
    <div class="fields">${BFIELDS.map(([f,l,mn,mx])=>`<label for="bf-${e.key}-${f}">${l}<input type="number" id="bf-${e.key}-${f}" data-k="${e.key}" data-f="${f}" min="${mn}" max="${mx}" step="1" value="${e.o[f]}"></label>`).join('')}</div></div>`).join('');
}
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
// trois fiches par ligne ; au-delà de trois lignes la liste défile (molette) : sa hauteur est celle des trois premières lignes
function bestHaut(){const l=$('bestList'),c=[...l.children];if(c.length<=9){l.style.maxHeight='';return;}
  l.style.maxHeight=(c[0].offsetHeight+c[3].offsetHeight+c[6].offsetHeight+24+2)+'px';l.scrollTop=0;}
function closeBest(){$('bestiary').hidden=true;$('bestBtn').focus();render();}

// Éclats de métal : ORE_PCT % des cases de montagne (hors rangée extérieure indestructible) en contiennent ; brisée, la roche les laisse
// tomber au sol ; la foreuse qui passe dessus les ramasse et regagne des points de vie selon la densité.
// G.ore[i] = 'roche1|2|3' (dans la paroi) ou 'sol1|2|3' (tombés) ; 1 petits, 2 moyens, 3 gros (ORE_MIX : part de chaque densité)
const ORE_PCT=10,ORE_PV=[0,30,40,50],   // gisements rares mais gros depuis le 13 novembre 2026 (avant : 10, 15, 20)
      ORE_MIX=[0,.5,.3,.2],ORE_NOM=['','petits','moyens','gros'];
// Matière (13 novembre 2026) : second métal, couleur accent, même code précédé de « m » ('mroche2', 'msol2'). Ramassée, elle remplit la réserve G.st.matiere.
const oreLv=v=>+String(v).slice(-1)||3,oreSol=v=>/^m?sol/.test(String(v)),oreMat=v=>String(v)[0]==='m',oreTile=(v,sol)=>{const l=oreLv(v);return TL[(oreMat(v)?'mat':'ore')+(sol?'Sol':'')+(l===3?'':l)];};
// nMetal gisements d'éclats de métal et nMat de Matière, tirés parmi les cases de montagne (dans la limite des places)
/* Roche dure (16 novembre 2026) : plus on s'enfonce dans un massif, plus la montagne devient dure.
   La profondeur d'une case est sa distance au premier terrain qui n'est pas de la montagne (4 directions) ;
   la chance de durcir monte avec elle, de sorte qu'un massif garde une écorce tendre et un cœur impénétrable.
   La rangée extérieure de la carte reste de la montagne ordinaire (déjà indestructible par ailleurs). */
const DURCIR=[0,0,0,.3,.65,.9,1];   // rien sous deux cases de profondeur : les massifs gardent une écorce tendre
function durcir(){const t=G.t,d=new Int16Array(W*H).fill(-1),q=[];
  for(let i=0;i<W*H;i++)if(t[i]!==MOUNT){d[i]=0;q.push(i);}
  for(let k=0;k<q.length;k++){const c=q[k],x=c%W,y=(c/W)|0;
    for(let n=0;n<4;n++){const a=x+DIRS[n][0],b=y+DIRS[n][1];if(a<0||b<0||a>=W||b>=H)continue;const j=idx(a,b);
      if(d[j]<0){d[j]=d[c]+1;q.push(j);}}}
  for(let i=0;i<W*H;i++){const x=i%W,y=(i/W)|0;if(t[i]!==MOUNT||x<1||y<1||x>=W-1||y>=H-1)continue;
    if(Math.random()<DURCIR[Math.min(d[i],DURCIR.length-1)])t[i]=HARD;}}
function hideOre(nMetal=3,nMat=1){G.ore={};const lib=[];
  for(let i=0;i<W*H;i++){const x=i%W,y=(i/W)|0;if(G.t[i]===MOUNT&&x>0&&y>0&&x<W-1&&y<H-1)lib.push(i);}
  for(let i=lib.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[lib[i],lib[j]]=[lib[j],lib[i]];}
  lib.slice(0,nMetal+nMat).forEach((i,k)=>{const r=Math.random();G.ore[i]=(k<nMetal?'':'m')+'roche'+(r<ORE_MIX[1]?1:r<ORE_MIX[1]+ORE_MIX[2]?2:3);});}
