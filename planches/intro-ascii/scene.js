/* Essai (23 novembre 2026) : la cinématique d'arrivée refaite en ASCII, comme les descentes.
   Même grille de caractères, chaque case opaque (jamais d'alpha), alerte en police DOS, tableau de bord adapté.
   Vue de dessus, environ 14 s : hyperespace · la planète entre par le haut · descente (le disque grandit jusqu'à
   l'échelle réelle) · entrée dans l'atmosphère (plasma, traînées, chaleur) · nuages et éclairs · posé (ombre,
   poussière) · extinction case par case. */
const PRESETS=[
  {n:'Braise',c:['#c99acf','#6de6e7','#ca614e','#d8180b','#7c85c5']},
  {n:'Lagon',c:['#f7f688','#3ab99d','#116bb5','#d8180b','#75a3a8']},
  {n:'Désert',c:['#6de6e7','#947e31','#dfae65','#a91d18','#966949']},
  {n:'Jungle',c:['#ebbf4a','#e09f9d','#1a946c','#d8180b','#4d858d']},
  {n:'Améthyste',c:['#6de6e7','#e8bfe2','#7f65bb','#d8180b','#30626d']},
  {n:'Cendre',c:['#e38d18','#3ab99d','#6f6f6e','#d8180b','#af8568']},
  {n:'Glacier',c:['#ebbf4a','#2e9adc','#b5c8ea','#ca614e','#7c85c5']},
  {n:'Magma',c:['#f7f688','#e38d18','#833e11','#d8180b','#6f6f6e']}];
let P={};   // A accent, B bio, M monde, D danger, T bâti, W blanc, G gris, K gris sombre
function setPal(i){const c=PRESETS[i].c;P={A:c[0],B:c[1],M:c[2],D:c[3],T:c[4],W:'#f2f7f8',G:'#a9b6ba',K:'#6b7a80'};MIX={};}
let MIX={};
// une couleur de la palette, assombrie (f < 1) ou éclaircie vers le blanc (f > 1)
function col(k,f){const key=k+f;let r=MIX[key];if(r)return r;const h=P[k]||k,n=parseInt(h.slice(1),16);let R=n>>16,G=(n>>8)&255,B=n&255;
  if(f<=1){R*=f;G*=f;B*=f;}else{const g=f-1;R+=(255-R)*g;G+=(255-G)*g;B+=(255-B)*g;}
  return MIX[key]='#'+((1<<24)|(Math.round(R)<<16)|(Math.round(G)<<8)|Math.round(B)).toString(16).slice(1);}
const FEU=['#ffffff','#fff3a0','#ffd23f','#ffb020','#ff6a1f','#e8240f','#a8180c','#5a1410'];
const feu=q=>FEU[q>.9?0:q>.75?1:q>.6?2:q>.47?3:q>.34?4:q>.22?5:q>.11?6:7];
const cl=v=>Math.max(0,Math.min(1,v)),s3=v=>{v=cl(v);return v*v*(3-2*v);};
function hsh(a,b,s){let v=(a*374761393+b*668265263+(s|0)*1442695041)|0;v=Math.imul(v^(v>>>13),1274126177);v^=v>>>16;return (v>>>0)/4294967296;}

/* ---------- la carte : 96 × 64 cases, qui se referme sur elle-même (bruit périodique) ---------- */
const W=96,H=64;let MAP=[],SEED=1;
function vn(x,y,p,q,s){const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),m=(a,b)=>hsh(((a%p)+p)%p,((b%q)+q)%q,s);
  return (m(xi,yi)*(1-u)+m(xi+1,yi)*u)*(1-v)+(m(xi,yi+1)*(1-u)+m(xi+1,yi+1)*u)*v;}
const fbm=(x,y,s)=>.55*vn(x/16,y/16,6,4,s)+.3*vn(x/8,y/8,12,8,s+1)+.15*vn(x/4,y/4,24,16,s+2);
function genMap(){MAP=new Array(W*H);const S=SEED*7;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const m=fbm(x,y,S),v=fbm(x,y,S+11),c=fbm(x+.5,y+.5,S+23),h=hsh(x,y,S+5),
      dS=Math.hypot(x-W/2,y-H/2),plat=cl((dS-5)/4);   // le site d'atterrissage, au centre, est dégagé
    let e;
    if(m*plat+(1-plat)*.4>.6){const k=m-.6;e=k<.025?['▒','M',.75]:k<.08?['▓','M',.62+.25*h]:['█','M',.5+.3*h];}   // montagne
    else if(c*plat+(1-plat)*.6<.27)e=c<.24?[' ','K',1]:['░','M',.35];   // gouffre et son bord
    else if(v>.6)e=[h<.5?'w':h<.8?'ʷ':'"','A',.55+.3*h];   // végétation
    else e=h<.1?['.','M',.4]:h<.13?['o','M',.6]:h<.16?[',','M',.35]:[' ','K',1];   // sol
    MAP[y*W+x]=e;}}
const cellMap=(mx,my)=>MAP[(((Math.floor(my)%H)+H)%H)*W+(((Math.floor(mx)%W)+W)%W)];

/* ---------- le vaisseau, vu de dessus (11 × 8 caractères) ---------- */
const NEF=[
  '    ▄▲▄    ',
  '   ╔╝◆╚╗   ',
  ' ▄╔╬═╦═╬╗▄ ',
  '▐█║▒║█║▒║█▌',
  '▐█║▒║◆║▒║█▌',
  ' ▀╚╬═╩═╬╝▀ ',
  '   ║▒ ▒║   ',
  '   ╨   ╨   '];
const nefCol=(c,r)=>c==='▲'?['W',1]:c==='◆'?['B',1.35]:c==='▒'?['T',.55]:'█▐▌▄▀'.includes(c)?['A',.8]:['B',1];

/* ---------- la scène ---------- */
const cv=document.getElementById('cv'),x=cv.getContext('2d');
let w,h,dpr,cw,chh,C,R,FONT,ATL={},CH=[],CO=[];
function setup(){dpr=Math.min(devicePixelRatio||1,2);w=Math.round(innerWidth*dpr);h=Math.round(innerHeight*dpr);cv.width=w;cv.height=h;
  const size=Math.max(9,Math.round(h/52));chh=size;cw=Math.round(size*.6);C=Math.ceil(w/cw)+1;R=Math.ceil(h/chh)+1;
  FONT=`${size}px "JetBrains Mono", ui-monospace, Menlo, Consolas, monospace`;ATL={};CH=new Array(C*R);CO=new Array(C*R);}
function glyph(ch,co){const k=ch+co;let g=ATL[k];if(!g){g=document.createElement('canvas');g.width=cw;g.height=chh;const c=g.getContext('2d');
  c.font=FONT;c.textAlign='center';c.textBaseline='middle';c.fillStyle=co;c.fillText(ch,cw/2,chh/2);ATL[k]=g;}return g;}
const put=(i,j,ch,co)=>{if(i<0||j<0||i>=C||j>=R)return;CH[j*C+i]=ch;CO[j*C+i]=co;};   // la dernière écriture gagne : pas de superposition

const T_HYP=1.3,T_P0=.85,T_P1=3,T_D0=2.2,T_D1=10.6,T_POSE=11.4,T_NOIR=12.7,T_FIN=13.8;   // secondes
const ANN={t0:1.2,t1:3.2,fin:8.2,sortie:1,l1:'PLANÈTE EN VUE',l2:'ATTERRISSAGE IMMINENT'};
let S=null;
function nouvelle(){SEED=(Math.random()*1e6)|0;genMap();const r=()=>Math.random();
  S={t0:performance.now(),saut:0,
    stars:Array.from({length:170},(_,i)=>({x:r(),y:r(),l:i<90?0:i<140?1:2})),
    nuages:[.2,.295,.605,1.344,2.6].map((a,i)=>({a,s:SEED+100+i*17,thr:.63-.05*r()})),
    eclairs:Array.from({length:2+((r()*4)|0)},()=>({t:5.6+r()*2.6,x:.15+r()*.7,s:(r()*1e5)|0})).sort((a,b)=>a.t-b.t),
    pic:.5+r()*.1};}

// altitude : k = cases de carte par rangée d'écran (5,3 en entrant, 1 au sol) ; rayon du disque, en rangées
function zoom(t){const u=s3((t-T_D0)/(T_D1-T_D0)),k=1+4.3*(1-u)*(1-u);return {k,Z:.2+30*(k-1)*(k-1),Rs:8*Math.pow(5.3/k,1.72)};}
function chaleur(t){const u=(t-T_D0)/(T_D1-T_D0);return u<.08?0:u<S.pic?s3((u-.08)/(S.pic-.08)):cl(1-(u-S.pic)/.3);}

function frame(now){if(!S)return;const t=(now-S.t0)/1000+S.saut;
  CH.fill(' ');CO.fill('#000');
  const {k,Z,Rs}=zoom(t),hc=chaleur(t),ent=s3((t-T_P0)/(T_P1-T_P0)),PX=w/2,PY=-Rs*chh*1.2+(h/2+Rs*chh*1.2)*ent,
    LX=W/2+14*(1-s3(t/4.5)),LY=H/2;   // le site d'atterrissage au centre ; la planète tourne un peu en entrant
  // étoiles : traînées d'hyperespace, puis points qui défilent lentement (le vaisseau ne s'arrête jamais)
  const hy=cl(1-t/T_HYP);
  for(const s of S.stars){const v=(.08+.05*s.l)*(1+60*hy*hy),y=((s.y+t*v)%1)*R,i=Math.floor(s.x*C),L=Math.round(1+hy*hy*(10+6*s.l));
    for(let q=0;q<L;q++){const j=Math.floor(y)-q;put(i,j,q===0?(hy>.05?'│':s.l===2?'*':s.l?'+':'·'):q<L/2?'│':'¦',q===0?(s.l?P.W:P.K):q<L/2?P.G:P.K);}}
  // la planète : un disque, courbé sur les bords (projection en arc sinus), avec son anneau d'atmosphère
  if(t>T_P0){for(let j=0;j<R;j++)for(let i=0;i<C;i++){const dx=((i+.5)*cw-PX)/chh,dy=((j+.5)*chh-PY)/chh,d=Math.hypot(dx,dy),r=d/Rs;
      if(r>=1){if(r<1+1.3/Rs&&Rs<70)put(i,j,hsh(i,j,(t*8)|0)<.5?'░':'▒',col('B',.7));continue;}
      const md=d?k*Rs*Math.asin(Math.min(1,r))/d:0,e=cellMap(LX+dx*md,LY+dy*md);let ch=e[0],c=col(e[1],e[2]);
      if(r>.9&&Rs<70){if(ch!==' ')ch=r>.96?'░':'▒';c=col(e[1]==='K'?'M':e[1],.45);}   // le bord du disque, plus clair
      if(ch!==' ')put(i,j,ch,c);}}
  // ombre du vaisseau sur le sol, qui le rejoint en se posant
  const sc=Math.floor(C/2)-5,sr=Math.floor(R/2)-4,sw=t<T_POSE?Math.round(Math.sin(t*1.1)*1.3*cl((T_POSE-t)/1.5)):0;
  if(k<1.35){const a=cl((T_POSE-t)/1.6),ox=Math.round(a*7),oy=Math.round(a*4);
    NEF.forEach((l,r)=>{for(let c=0;c<l.length;c++)if(l[c]!==' '){const q=(sr+r+oy)*C+(sc+c+sw+ox);if(q>=0&&q<CH.length){CO[q]=col('M',.22);if(CH[q]===' ')CH[q]='░';}}});}
  // nuages : chaque couche, à son altitude, grossit à son rythme et s'effiloche en passant le vaisseau
  const lame=[];
  for(const L of S.nuages){if(Z<=L.a||Rs<12)continue;const kl=k*(Z-L.a)/Z,pres=cl((Z-L.a)/(L.a*1.6)),thr=L.thr+.3*(1-pres)*(1-pres)+.1*cl((Z-6)/60);   /* vus de l'espace, les nuages sont clairsemés */
    const dessus=pres<.35;for(let j=0;j<R;j++)for(let i=0;i<C;i++){const dx=((i+.5)*cw-w/2)/chh,dy=((j+.5)*chh-h/2)/chh;
      if(Rs<70&&Math.hypot(((i+.5)*cw-PX)/chh,((j+.5)*chh-PY)/chh)>Rs)continue;
      const n=fbm(LX+dx*kl+t*.15*k,LY+dy*kl,L.s)-thr;if(n<0)continue;const ch=n<.035?'░':n<.08?'▒':n<.14?'▓':'█',c=n<.035?P.K:n<.08?P.G:P.W;
      if(dessus)lame.push([i,j,ch,c]);else put(i,j,ch,c);}}
  // éclairs : zigzag de haut en bas, quelques centièmes de seconde, nuages alentour illuminés
  let orage=false;
  for(const e of S.eclairs){const a=t-e.t;if(a<0||a>.2)continue;orage=true;if(((a*30)|0)%2&&a>.07)continue;let i=Math.floor(e.x*C);const fin=Math.floor(R*(.55+.4*hsh(e.s,0,1)));
    for(let j=0;j<fin;j++){const r=hsh(e.s,j,2),di=r<.33?-1:r<.66?0:1;put(i,j,di<0?'╱':di>0?'╲':'│',j%3?P.W:'#fff3a0');
      for(let q=-5;q<=5;q++){const o=j*C+i+q;if(q&&o>=0&&o<CH.length&&'░▒▓█'.includes(CH[o]))CO[o]=P.W;}i+=di;}}
  // le vaisseau et ses réacteurs
  const flam=t<T_POSE?(t<T_HYP?6:2+Math.round(hsh(1,(t*14)|0,3)*2)):0;
  for(const ec of [3,7])for(let q=1;q<=flam;q++)put(sc+ec+sw,sr+7+q,q===1?'▼':q<flam?'║':'¦',feu(.95-q*.13));
  NEF.forEach((l,r)=>{for(let c=0;c<l.length;c++){const ch=l[c];if(ch===' ')continue;const[k0,f]=nefCol(ch);
    put(sc+c+sw,sr+r,ch,ch==='◆'&&r===1&&((t*3)|0)%2?P.W:col(k0,f));}});
  // entrée dans l'atmosphère : un arc de plasma devant le nez, des traînées de feu de part et d'autre
  if(hc>.03){const ra=6.2+hc*1.4,ci=sc+5+sw,cj=sr+3.5,tic=(t*14)|0;
    for(let j=Math.floor(cj-ra-3);j<=cj;j++)for(let i=ci-16;i<=ci+16;i++){const dx=(i-ci)*cw/chh,dy=j-cj,d=Math.hypot(dx,dy),an=Math.atan2(dx,-dy);
      if(Math.abs(an)>1.45||d<ra-.8||d>ra+.5+hc*1.6)continue;const q=hc*(1-Math.abs(an)/1.45*.55)*(.7+.6*hsh(i,j,tic));if(q<.12)continue;
      put(i,j,q>.6?'▀':q>.4?'≈':q>.25?'~':'·',feu(q));}
    for(const sd of [-1,1])for(let q=0;q<Math.round(4+hc*14);q++){const i=ci+sd*Math.round((ra*.92)*chh/cw)+(hsh(sd,q,tic)<.3?sd:0),j=Math.round(cj-1+q);
      if(hsh(sd*7,q,tic+1)>1-q/(4+hc*14)*.8)continue;put(i,j,q<3?'║':'¦',feu(hc*(1-q/(5+hc*14))));}}
  // posé : un anneau de poussière qui s'éloigne en perdant sa densité
  if(t>T_POSE){const a=t-T_POSE,rr=1.5+a*15,ci=sc+5,cj=sr+4;
    for(let j=Math.floor(cj-rr-2);j<=cj+rr+2;j++)for(let i=Math.floor(ci-(rr+2)*chh/cw);i<=ci+(rr+2)*chh/cw;i++){const d=Math.hypot((i-ci)*cw/chh,j-cj);
      if(Math.abs(d-rr)>1.1)continue;const n=(1-a/1.3)*hsh(i,j,7);if(n<.25)continue;put(i,j,n>.6?'▒':n>.42?'░':'·',col('M',1.25));}}
  for(const l of lame)put(...l);   // la couche que le vaisseau traverse passe par-dessus
  // dessin : chaque case opaque sur le noir, décalée d'un bloc quand ça tremble
  const choc=hc*hc*7+(t>T_POSE&&t<T_POSE+.5?(1-(t-T_POSE)/.5)*6:0),ox=Math.round((Math.random()-.5)*2*choc*dpr),oy=Math.round((Math.random()-.5)*2*choc*dpr);
  x.fillStyle='#000';x.fillRect(0,0,w,h);
  for(let j=0;j<R;j++)for(let i=0;i<C;i++){const ch=CH[j*C+i];if(ch!==' ')x.drawImage(glyph(ch,CO[j*C+i]),i*cw+ox,j*chh+oy);}
  hud(t,{k,Z,Rs,hc,orage});
  // extinction : chaque case, à son tour, passe par « ▒ ░ · » dans sa couleur, puis le noir
  if(t>T_NOIR)for(let j=0;j<R;j++)for(let i=0;i<C;i++){const tf=T_NOIR+hsh(i,j,33)*.6;if(t<tf)continue;const st=Math.floor((t-tf)/.1),q=j*C+i;
    x.fillStyle='#000';x.fillRect(i*cw,j*chh,cw,chh);if(st<3&&CH[q]!==' ')x.drawImage(glyph('▒░·'[st],CO[q]),i*cw,j*chh);}
  if(t>=T_FIN){S=null;document.getElementById('fin').hidden=false;return;}
  requestAnimationFrame(frame);}

/* ---------- tableau de bord (repris des descentes) ---------- */
let HUDG=0,HUDB=0;
const esp=v=>String(v).replace(/\B(?=(\d{3})+$)/g,' ');
function hud(t,o){const fs=Math.round(12*dpr),lh=Math.round(17*dpr),m=Math.round(20*dpr),pose=t>=T_POSE;
  x.font=`${fs}px "JetBrains Mono", ui-monospace, Menlo, Consolas, monospace`;x.textAlign='left';x.textBaseline='top';
  const alt=pose?0:Math.round(o.Z*420),vit=t<T_HYP?'HYPER':pose?'0 m/s':esp(Math.round(7800*Math.pow(o.k-1,1.3)/Math.pow(4.3,1.3)+40*(1-s3((t-T_D1)/(T_POSE-T_D1)))))+' m/s',
    atm=pose?'SOL':o.Z>60?'VIDE':o.Z>8?'HAUTE':o.Z>1.2?'DENSE':'BASSE',tp=Math.round(20+1650*o.hc),nb=Math.round(o.hc*5);
  const L=[["ARRIVÉE ▸ SÉQUENCE D'ATTERRISSAGE",P.A],['CIBLE      NIVEAU 1 ▸ SITE DE FORAGE',P.G],
    [`ALTITUDE   ${alt>=10000?esp(Math.round(alt/1000))+' km':esp(alt)+' m'}`,P.G],[`VITESSE    ${vit}`,P.G],[`ATMOSPHÈRE ${atm}`,P.G],
    [`COQUE      ${'▮'.repeat(nb)}${'▯'.repeat(5-nb)} ${esp(tp)} °C`,o.hc>.6?'#ff5a4a':o.hc>.3?'#ffb347':P.G],[`CAP        ${pose?'—':'▼'}`,P.G],
    ['SOUTE      FOREUSE ▸ ARRIMÉE',P.W]];
  const nFixe=L.length;
  if(t<T_HYP&&((t*5)|0)%2===0)L.push(['HYPERESPACE ▸ SORTIE',P.A]);
  if(o.hc>.55&&((t*5)|0)%2===0)L.push(['▲ CHALEUR CRITIQUE ▸ BOUCLIER THERMIQUE','#ff5a4a']);
  if(o.orage)L.push(['◆ ORAGE ▸ DÉCHARGE ÉLECTRIQUE',P.A]);
  if(pose)L.push(['CONTACT ▸ ATTERRISSAGE CONFIRMÉ','#ffb347']);
  let lg=0;for(const l of L)lg=Math.max(lg,x.measureText(l[0]).width);
  HUDG=m-Math.round(8*dpr);HUDB=HUDG+(nFixe+2)*lh+Math.round(12*dpr);   // deux lignes réservées aux alertes qui clignotent
  x.fillStyle='#000';x.fillRect(HUDG,HUDG,Math.round(lg)+Math.round(16*dpr),L.length*lh+Math.round(12*dpr));
  L.forEach((l,i)=>{x.fillStyle=l[1];x.fillText(l[0],m,m+i*lh);});
  const aide='ÉCHAP ▸ PASSER';x.fillStyle='#000';x.fillRect(HUDG,h-m-fs-Math.round(6*dpr),Math.round(x.measureText(aide).width)+Math.round(16*dpr),fs+Math.round(12*dpr));x.fillStyle=P.K;x.fillText(aide,m,h-m-fs);
  // jauge d'altitude, à droite (à la place de la coupe)
  const gw=Math.round(8*dpr),gx=w-m-gw,gt=Math.round(h*.22),gh=Math.round(h*.5),f=pose?1:1-cl(Math.log(o.Z/.2)/Math.log(555/.2));
  [[0,.35,col('K',.5)],[.35,.75,col('B',.45)],[.75,1,col('M',.8)]].forEach(([a,b,c])=>{x.fillStyle=c;x.fillRect(gx,gt+Math.round(gh*a),gw,Math.round(gh*(b-a)));});
  x.fillStyle='#fff';x.fillRect(gx-Math.round(6*dpr),Math.round(gt+gh*f)-1,gw+Math.round(12*dpr),Math.max(2,Math.round(2*dpr)));
  x.textAlign='right';x.fillStyle=P.G;x.fillText('ALT',gx+gw,gt-lh);x.textAlign='left';
  if(t>=ANN.t0&&t<ANN.fin)annonce(t);}

/* ---------- l'alerte, en police DOS (même cadre que les descentes), couleur monde ---------- */
const GL='#%&$@/\\<>=+*?!;:-_|[]{}()0123456789ABCDEFGHJKLMNPQRSTUVWXYZ£¥§¶«»±÷≈∙√ⁿ²■ΣΩδ∞φε∩≡',RAMPE='.i0',BLOC='░▒▓';
function annonce(t){const cols=30,rows=9,c0=P.M,blanc=P.W,gris=P.K,{l1,l2}=ANN;
  const p=Math.max(1,Math.floor(w*.41/((cols+2)*8))),aw=8*p,ah=16*p,x0=HUDG+aw,y0=HUDB+ah+Math.round(6*dpr);
  const pa=cl((t-ANN.t0)/(ANN.t1-ANN.t0)),q=cl((t-(ANN.fin-ANN.sortie))/ANN.sortie),tic=Math.floor(t*20);
  const Hh=(a,b,k)=>{let v=(a*73856093)^(b*19349663)^(k*83492791);v^=v<<13;v^=v>>>17;v^=v<<5;return (v>>>0)/4294967296;};
  const d1=Math.floor((cols-l1.length)/2),d2=Math.floor((cols-l2.length)/2);
  const cible=(c,r)=>{if(r===0||r===rows-1||c===0||c===cols-1)return ['█',c0,1];
    if(r===1||r===rows-2)return (c+(r===1?0:1))%2?['█',c0,1]:[' ',c0,0];
    if(r===3&&c>=d1&&c<d1+l1.length)return [l1[c-d1],c0,0];if(r===5&&c>=d2&&c<d2+l2.length)return [l2[c-d2],blanc,0];return [' ',blanc,0];};
  for(let r=-1;r<=rows;r++)for(let c=-1;c<=cols;c++){const px=x0+c*aw,py=y0+r*ah,bord=r<0||c<0||r>=rows||c>=cols;
    let s=cl(pa*2.05-(c+1)/(cols+2)*.7-Hh(c,r,1)*.35);
    if(q>0)s=Math.min(s,cl(((c+1)/(cols+2))*1.2+.25-q*1.6+Hh(c,r,2)*.15));
    if(s<=0)continue;x.fillStyle='#000';x.fillRect(px,py,aw,ah);
    if(bord)continue;const [ch,cc,cadre]=cible(c,r);
    if(s>=1){if(ch!==' ')dosCar(x,ch,px,py,p,cc);continue;}
    if(cadre){dosCar(x,BLOC[Math.min(2,Math.floor(s*3))],px,py,p,c0);continue;}
    if(s<.45){dosCar(x,RAMPE[Math.min(2,Math.floor(s/.45*3))],px,py,p,gris);continue;}
    const g=GL[Math.floor(Hh(c,r,tic)*GL.length)],fond=Hh(c,r,tic+7)<.5?c0:gris;
    if(Hh(c,r,tic+3)<.55)dosCar(x,g,px,py,p,'#000',fond);else dosCar(x,g,px,py,p,Hh(c,r,tic+5)<.5?c0:blanc);}}

/* ---------- commandes ---------- */
const sel=document.getElementById('pal');PRESETS.forEach((p,i)=>{const o=document.createElement('option');o.value=i;o.textContent=p.n;sel.appendChild(o);});
sel.onchange=()=>{setPal(+sel.value);ATL={};};
function lance(){document.getElementById('fin').hidden=true;nouvelle();requestAnimationFrame(frame);}
document.getElementById('rej').onclick=lance;document.getElementById('rej2').onclick=lance;
addEventListener('keydown',e=>{if(!S){if(e.key==='Enter'||e.key===' '||e.key==='r')lance();return;}
  if(e.key==='Escape'||e.key===' '||e.key==='Enter'){const t=(performance.now()-S.t0)/1000+S.saut;if(t<T_D1)S.saut+=T_D1-t;}});
addEventListener('resize',setup);
setPal(0);setup();lance();
