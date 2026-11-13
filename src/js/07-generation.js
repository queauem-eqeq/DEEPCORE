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
const blocks=v=>v===ROCK||v===MOUNT||v===CHASM||v===SHIP;
// Diagonales comme dans Brogue : un pas (ou un coup) en diagonale est impossible si l'une des deux cases voisines
// orthogonales est une paroi (rocher, montagne, coque du vaisseau) — on ne coupe pas les coins. Vaut pour tout le monde.
const wallish=v=>v===ROCK||v===MOUNT||v===SHIP;
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
function placeLakes(t,target){
  const near=nearChasm(t),ok=i=>t[i]===GROUND&&!near[i];
  let count=0,tries=0;
  while(count<target&&tries<600){tries++;
    const p=count/Math.max(1,target),w=Math.max(6,Math.round((26-p*10)*F)),h=Math.max(4,Math.round((13-p*5)*F)),cells=caBlob(w,h,.55,5);if(cells.length<6)continue;
    const ox=rnd(2,W-w-2),oy=rnd(2,H-h-2);
    // un lac qui empiète trop sur la marge d'un gouffre est refusé, pour garder des rives naturelles
    let hit=0;for(const [x,y] of cells)if(near[idx(ox+x,oy+y)])hit++;
    if(tries<450&&hit>cells.length*.15)continue;
    const core=[];
    for(const [x,y] of cells){const i=idx(ox+x,oy+y);if(ok(i)){t[i]=DEEP;core.push(i);count++;}}
    for(const c of core){const cx=c%W,cy=(c/W)|0;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const a=cx+dx,b=cy+dy;if(a<1||b<1||a>=W-1||b>=H-1)continue;const j=idx(a,b);if(ok(j)){t[j]=LIQ;count++;}}}
  }
  // l'eau profonde ne touche jamais la terre : toute eau profonde au bord passe en peu profonde
  for(let i=0;i<W*H;i++){if(t[i]!==DEEP)continue;const x=i%W,y=(i/W)|0;
    if(DIRS.some(([dx,dy])=>{const v=t[idx(x+dx,y+dy)];return v!==DEEP&&v!==LIQ;}))t[i]=LIQ;}
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
        if(v===SHIP)continue;const cost=v===CHASM?3:v===ROCK?2:v===MOUNT?7:1;const nd=d+cost;if(nd<dist[j]){dist[j]=nd;prev[j]=c;hp.push(j,nd);}}}
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
    {const gn=sc(fbm()),gc=[];for(let i=0;i<N;i++)if(t[i]===GRASS)gc.push(i);gc.sort((a,b)=>gn[a]-gn[b]);for(const i of gc.slice(0,gc.length>>1))t[i]=FLAT;}
    for(let i=0;i<N;i++)if(t[i]===GROUND&&Math.random()<.035)t[i]=ROCK;
    tidyChasms(t);connect(t);tidyChasms(t);separateWater(t);
    const ship=SANS_VAISSEAU?null:placeShip(t);let sx,sy;
    if(ship){sx=ship.x+2;sy=ship.y+2;}
    else{let ok=false;                                             // niveaux suivants : arrivée par le puits, sur un carré de sol dégagé
      for(let k=0;k<4000&&!ok;k++){sx=rnd(4,W-5);sy=rnd(4,H-5);ok=true;for(let dy=-1;dy<=1&&ok;dy++)for(let dx=-1;dx<=1;dx++)if(t[idx(sx+dx,sy+dy)]!==GROUND){ok=false;break;}}
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
      st:{vie:100,vieMax:100,energie:100,energieMax:100,repar:0,power:1,vitesse:5,degats:10,capteur:10,cout:10,pre:80,esq:10,crit:5},
      sites:sites.map((s,i)=>({x:s.x,y:s.y,depth:10,id:LETTERS[i],seen:false,known:false}))};
    return;
  }
}
/* ---------- Descente : 5 niveaux, un biome par niveau (13 novembre 2026) ----------
   Un biome = un relief (réglages de génération), une faune (niveau d'intensité par espèce, voir NIVEAUX), une petite variation de palette.
   rang : les biomes tirés pour une descente sont rangés du moins au plus dangereux. */
const NIV_MAX=5;
const BIOMES={
  plateau:{n:'Plateau',rang:1,d:'La surface, là où le vaisseau s’est posé : terrain ouvert, quelques massifs, peu de danger.',
    gen:{eau:8,montagne:10,gouffre:3,herbe:14,methode:'automate'},vie:{insectoide:2,crabos:1,cafar:1},teinte:[0,0,0,0,0]},
  marecage:{n:'Marécage',rang:2,d:'De l’eau partout et de hautes herbes : les crabos y sont chez eux, et les tapis attendent dans les roseaux.',
    gen:{eau:30,montagne:6,gouffre:1,herbe:28,methode:'automate'},vie:{crabos:3,tapi:2,gluar:2,viperin:1,insectoide:1},teinte:[0,-12,14,-4,-10]},
  herbes:{n:'Hautes herbes',rang:2,d:'Une prairie à perte de vue : idéale pour se cacher, donc pour les embuscades.',
    gen:{eau:6,montagne:6,gouffre:2,herbe:55,methode:'automate'},vie:{tapi:3,insectoide:2,siphon:2,crachin:1},teinte:[0,-18,10,2,0]},
  galeries:{n:'Galeries',rang:3,d:'De la roche presque partout, des couloirs étroits : les bandes de cafars y circulent et les taupars percent les parois.',
    gen:{eau:2,montagne:46,gouffre:3,herbe:4,methode:'bruit'},vie:{cafar:3,taupar:2,viperin:2,gluar:1},teinte:[0,0,-10,-8,-10]},
  pierrier:{n:'Pierrier',rang:3,d:'Un désert de pierres, sec et à découvert : rien pour s’abriter des crachins.',
    gen:{eau:1,montagne:14,gouffre:6,herbe:2,methode:'bruit'},vie:{crachin:3,siphon:2,crabos:1,mastok:1},teinte:[0,0,-4,4,-25]},
  failles:{n:'Failles',rang:4,d:'Un terrain éventré de gouffres, tout près du noyau : le territoire des mastoks et des vipérins.',
    gen:{eau:4,montagne:22,gouffre:18,herbe:6,methode:'automate'},vie:{mastok:3,viperin:3,cafar:2,taupar:1},teinte:[6,12,-16,-6,0]}
};
// Courbe de difficulté, par niveau : m = multiplicateur du nombre de monstres ; metal, mat = gisements d'éclats de métal (réparation) et de
// Matière (construction) POUR 1000 CASES de carte, quelle que soit la part de montagne du biome.
// Plus on descend : plus de monstres, moins de réparation, plus de Matière.
const COURBE=[null,{m:.7,metal:26,mat:3},{m:.85,metal:18,mat:6},{m:1,metal:12,mat:10},{m:1.25,metal:8,mat:14},{m:1.5,metal:4,mat:18}];
const TAILLES_NIV=[2,3,4,5];           // tailles tirées au hasard à partir du niveau 2 (le niveau 1 est toujours de taille 2)
// biomes des niveaux 2 à 5 : quatre des cinq autres, du moins au plus dangereux
function tirageBiomes(){return Object.keys(BIOMES).filter(k=>k!=='plateau').sort(()=>Math.random()-.5).slice(0,NIV_MAX-1).sort((a,b)=>BIOMES[a].rang-BIOMES[b].rang||Math.random()-.5);}
let SANS_VAISSEAU=false;
// o : {niv, biome, taille, suite} pour la descente, {test:true} pour une carte d'essai (réglages Génération et Life) ;
// o.garde : ce que la foreuse emporte d'un niveau au suivant
function niveau(o){drilling=false;const g0=GEN,bio=o.test?null:BIOMES[o.biome],garde=o.garde;
  if(bio)GEN=Object.assign({},g0,bio.gen,{taille:o.taille});
  SANS_VAISSEAU=!!garde;try{genPlanet();}finally{GEN=g0;SANS_VAISSEAU=false;}
  G.w=W;G.h=H;G.mode=o.test?'test':'descente';G.niv=o.test?0:o.niv;G.biome=o.test?null:o.biome;G.suite=o.suite||null;
  const c=o.test?null:COURBE[o.niv];
  if(o.test)lifeCalc();else lifeCalc(bio.vie,c.m);
  G.eff={};hideGems();if(o.test)hideOre();else hideOre(Math.round(c.metal*W*H/1000),Math.round(c.mat*W*H/1000));G.items={};G.tracks={};G.lastDir=null;G.beasts=[];G.blood={};G.fv=2;
  if(garde)Object.assign(G,garde);else{G.inv=invTest();G.log=[];}
  G.st.matiere=G.st.matiere||0;
  spawnAnimals();spawnBeasts();lastAct='move';palBiome(bio?bio.teinte:null);buildTiles();turnStealth();computeFOV();}
const fauneTxt=()=>LIFE_LBL.filter(([k])=>LIFE[k]>0).map(([,l])=>l).join(', ')||'aucune';
function newGame(){niveau({niv:1,biome:'plateau',taille:2,suite:tirageBiomes()});
  say(`Atterrissage confirmé. Niveau 1 sur ${NIV_MAX} : ${BIOMES.plateau.n}. Un site de forage signalé par l’orbiteur. La foreuse est dans la soute ; la porte est à l’arrière.`,'info');}
function testGame(){niveau({test:true});say('Carte d’essai : réglages Génération et Life. Le forage relance une carte d’essai.','info');}
function descendre(){const n=G.niv+1,b=G.suite[n-2];
  niveau({niv:n,biome:b,taille:TAILLES_NIV[Math.floor(Math.random()*TAILLES_NIV.length)],suite:G.suite,
    garde:{st:G.st,inv:G.inv,turn:G.turn,dist:G.dist,time:G.time,debt:0,beastSeen:G.beastSeen,log:G.log}});
  say(`Niveau ${n} sur ${NIV_MAX} : ${BIOMES[b].n}. La foreuse débouche du puits ; impossible de remonter.`,'info');}

/* ---------- Bestiaire : édition des statistiques ---------- */
const BFIELDS=[['v','Vitesse',1,10],['pv','PV',1,200],['dmg','Dégâts',0,100],['pre','Précision',0,100],['esq','Esquive',0,100],['crit','Crit %',0,100]];
const BEST_LIST=()=>[{key:'insectoide',o:SPECIES[0],ic:'an0r',role:'Suit à distance, attaque avec les crabos'},...BEASTS.map((o,i)=>({key:o.key,o,ic:'bz'+i+'r',role:o.role}))];
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
    ['Marcher','aucun',c('move',0,0)],
    ['Briser une paroi (bruit)',`× ${String(DIG_MULT).replace('.',',')}, arrondi au supérieur ; le bruit s’entend aussi hors de vue`,c('dig',0,0)],
    ['Attendre sur place (Espace ou 5)','÷ 2, arrondi au supérieur',c('wait',0,0)],
    ['Sur des herbes basses (couvert)','÷ 2, arrondi au supérieur',c('move',1,0)],
    ['Parois adjacentes (rocher ou montagne)',`− 1 par 2 parois (arrondi au supérieur), au plus − ${WALL_MAX}`,`${c('move',0,1)} (1-2 parois) · ${c('move',0,3)} (3-4 parois) · ${c('move',0,8)} (7-8 parois)`],
    ['Courir (touche R)',`+ ${SPRINT_NOISE}, après tout le reste`,c('move',0,0,1)]];
  $('discList').innerHTML=`<div class="bcard"><div class="bh"><div><b>Portée de discrétion</b><br><span>Rayon commun à tous les ennemis : dans ce rayon et en vue, ${Math.round(NOTICE*100)} % par tour de vous remarquer. Touche V : l’afficher sur la carte.</span></div></div>
    <div class="fields"><label for="bf-stealth">Base<input type="number" id="bf-stealth" min="2" max="30" step="1" value="${b}"></label></div>
    <p class="mnote">En ce moment : <b>${now}</b> case${now>1?'s':''}</p></div>
  <div class="bcard"><div class="bh"><div><b>Modificateurs</b><br><span>Appliqués dans cet ordre : base, briser, attendre, herbes basses, parois, course. Plancher : ${STEALTH_MIN}.</span></div></div>
    <table class="dtab eq3"><thead><tr><th>Situation</th><th>Modificateur</th><th>Portée (base ${b})</th></tr></thead><tbody>`
    +rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')+`</tbody></table></div>
  <div class="bcard"><div class="bh"><div><b>Règles liées</b></div></div>
    <table class="dtab"><tbody>
    <tr><td>Un ennemi qui vous chasse vous garde en vue jusqu’à</td><td>× ${HUNT_MULT} la portée</td></tr>
    <tr><td>Hors de la portée, il peut perdre votre trace (par tour)</td><td>${Math.round(LOSE_TRACK*100)} %</td></tr>
    </tbody></table></div>`;
}
function openDisc(){buildDisc();$('discretion').hidden=false;$('discClose').focus();}
function closeDisc(){$('discretion').hidden=true;$('discBtn').focus();render();}
function openBest(){buildBest();$('bestiary').hidden=false;$('bestClose').focus();}
function closeBest(){$('bestiary').hidden=true;$('bestBtn').focus();render();}

/* ---------- Joyaux cachés dans la roche ---------- */
// Les joyaux ne se trouvent que dans la roche des montagnes, jamais en bordure : il faut creuser pour les atteindre.
// Une case peut en contenir un si ses 8 voisines sont aussi de la roche (et jamais au bord de la carte).
const GEM_COUNT=1;
const UPGRADES=[
  ['vie','Vie max','+10',st=>{st.vieMax+=10;st.vie+=10;}],
  ['energie','Énergie max','+10',st=>{st.energieMax+=10;st.energie+=10;}],
  ['capteur','EYE (vision)','+1',st=>{st.capteur+=1;}],
  ['degats','DEG (dégâts)','+5',st=>{st.degats+=5;}],
  ['pre','PRE (précision)','+5',st=>{st.pre+=5;}],
  ['esq','ESQ (esquive)','+5',st=>{st.esq+=5;}],
  ['crit','CRIT (coup critique)','+5 %',st=>{st.crit=(st.crit??5)+5;}],
  ['power','POW (énergie/tour)','+1',st=>{st.power+=1;}],
  ['vitesse','VIT (vitesse)','+1',st=>{st.vitesse+=1;}]
];
// Éclats de métal : ORE_PCT % des cases de montagne (hors rangée extérieure indestructible et joyau) en contiennent ; brisée, la roche les laisse
// tomber au sol ; la foreuse qui passe dessus les ramasse et regagne des points de vie selon la densité.
// G.ore[i] = 'roche1|2|3' (dans la paroi) ou 'sol1|2|3' (tombés) ; 1 petits, 2 moyens, 3 gros (ORE_MIX : part de chaque densité)
const ORE_PCT=10,ORE_PV=[0,10,15,20],ORE_MIX=[0,.5,.3,.2],ORE_NOM=['','petits','moyens','gros'];
// Matière (13 novembre 2026) : second métal, couleur accent, même code précédé de « m » ('mroche2', 'msol2'). Ramassée, elle remplit la réserve G.st.matiere.
const oreLv=v=>+String(v).slice(-1)||3,oreSol=v=>/^m?sol/.test(String(v)),oreMat=v=>String(v)[0]==='m',oreTile=(v,sol)=>{const l=oreLv(v);return TL[(oreMat(v)?'mat':'ore')+(sol?'Sol':'')+(l===3?'':l)];};
// Sans argument (carte d'essai) : ORE_PCT % des cases de montagne en métal, 2 % en Matière.
// Avec nMetal, nMat (descente) : ce nombre de gisements, tirés parmi les cases de montagne, dans la limite des places.
function hideOre(nMetal,nMat){G.ore={};const lib=[];
  for(let i=0;i<W*H;i++){const x=i%W,y=(i/W)|0;if(G.t[i]===MOUNT&&x>0&&y>0&&x<W-1&&y<H-1&&!(G.gems&&G.gems[i]))lib.push(i);}
  for(let i=lib.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[lib[i],lib[j]]=[lib[j],lib[i]];}
  if(nMetal==null){nMetal=Math.round(lib.length*ORE_PCT/100);nMat=Math.round(lib.length*.02);}
  lib.slice(0,nMetal+nMat).forEach((i,k)=>{const r=Math.random();G.ore[i]=(k<nMetal?'':'m')+'roche'+(r<ORE_MIX[1]?1:r<ORE_MIX[1]+ORE_MIX[2]?2:3);});}
function hideGems(){G.gems={};
  // Toujours GEM_COUNT joyaux : d'abord au cœur des massifs (8 voisines en roche), sinon au plus profond disponible
  const deep=i=>DIRS.filter(([dx,dy])=>G.t[idx(i%W+dx,((i/W)|0)+dy)]===MOUNT).length;
  const cand=[];for(let i=0;i<W*H;i++){const x=i%W,y=(i/W)|0;if(G.t[i]!==MOUNT||x<2||y<2||x>W-3||y>H-3)continue;cand.push([i,deep(i)+Math.random()*.5]);}
  cand.sort((a,b)=>b[1]-a[1]);
  const full=cand.filter(c=>c[1]>=8),pool=(full.length>=GEM_COUNT?full:cand).slice();
  for(let n=0;n<GEM_COUNT&&pool.length;n++){const k=full.length>=GEM_COUNT?Math.floor(Math.random()*pool.length):0;
    const [i]=pool.splice(k,1)[0];G.gems[i]='cache';
    for(let j=pool.length-1;j>=0;j--){const o=pool[j][0];if(Math.abs(o%W-i%W)+Math.abs(((o/W)|0)-((i/W)|0))<6)pool.splice(j,1);}}
  // pas assez de massifs espacés : on complète avec les cases de roche restantes les plus profondes
  for(const [i] of cand){if(Object.keys(G.gems).length>=GEM_COUNT)break;if(!G.gems[i])G.gems[i]='cache';}}
function chooseUpgrade(){
  $('card').innerHTML=`<div class="tag">Joyau récupéré</div><h2>AMÉLIORATION</h2>
    <p>Le joyau peut renforcer un de ces trois systèmes de la foreuse. Choisissez lequel.</p>
    <div class="upg">${[...UPGRADES.keys()].sort(()=>Math.random()-.5).slice(0,3).sort((a,b)=>a-b).map(i=>{const [k,l,v]=UPGRADES[i];return `<button data-u="${i}"><span>${l}</span><b>${v}</b></button>`;}).join('')}</div>`;
  $('overlay').hidden=false;$('card').querySelector('button').focus();
  $('card').querySelector('.upg').onclick=e=>{const b=e.target.closest('button[data-u]');if(!b)return;const u=UPGRADES[+b.dataset.u];
    u[3](G.st);computeFOV();say(`Joyau intégré : ${u[1]} ${u[2]}.`,'good');SFX.done();$('overlay').hidden=true;render();};
}

