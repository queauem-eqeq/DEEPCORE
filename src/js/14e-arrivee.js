/* ---------- Arrivée sur la planète, en ASCII (23 novembre 2026) ----------
   Remplace l'intro en pixels (15-intro.js) au niveau 1 : même grille de caractères que les descentes (14b), chaque case
   opaque (jamais d'alpha ni de transparence), alerte en police DOS (02b) « PLANÈTE EN VUE / ATTERRISSAGE IMMINENT » en
   couleur monde, tableau de bord repris des descentes. Vue de dessus, environ 14 s : hyperespace · la planète (la vraie
   carte du niveau, enroulée en globe) entre par le haut · descente jusqu'à l'échelle réelle · entrée dans l'atmosphère
   (arc de plasma, traînées de feu, coque qui chauffe, tremblement) · nuages et éclairs · posé sur la case du vaisseau
   (ombre, poussière) · extinction case par case, puis le jeu. Mêmes bruitages que l'ancienne intro (01-sons.js).
   Essai d'origine, avec palette et carte de démonstration : planches/intro-ascii/. Échap, Espace, Entrée : passer. */
(()=>{
let P={},MIX={};
function palJeu(){P={A:PAL['1'],B:PAL['2'],M:PAL['3'],D:PAL['4'],T:PAL['5']||PAL['3'],E:PAL['e']||PAL['3'],H:PAL['d']||PAL['3'],W:'#f2f7f8',G:'#a9b6ba',K:'#6b7a80'};MIX={};}
// une couleur de la palette, assombrie (f < 1) ou éclaircie vers le blanc (f > 1)
function col(k,f){const key=k+f;let r=MIX[key];if(r)return r;const hx=P[k]||k,n=parseInt(hx.slice(1),16);let R=n>>16,Gc=(n>>8)&255,B=n&255;
  if(f<=1){R*=f;Gc*=f;B*=f;}else{const g=f-1;R+=(255-R)*g;Gc+=(255-Gc)*g;B+=(255-B)*g;}
  return MIX[key]='#'+((1<<24)|(Math.round(R)<<16)|(Math.round(Gc)<<8)|Math.round(B)).toString(16).slice(1);}
const FEU=['#ffffff','#fff3a0','#ffd23f','#ffb020','#ff6a1f','#e8240f','#a8180c','#5a1410'];
const feu=q=>FEU[q>.9?0:q>.75?1:q>.6?2:q>.47?3:q>.34?4:q>.22?5:q>.11?6:7];
const cl=v=>Math.max(0,Math.min(1,v)),s3=v=>{v=cl(v);return v*v*(3-2*v);};
function hsh(a,b,s){let v=(a*374761393+b*668265263+(s|0)*1442695041)|0;v=Math.imul(v^(v>>>13),1274126177);v^=v>>>16;return (v>>>0)/4294967296;}


/* ---------- la carte du niveau, en caractères (enroulée sur elle-même : bruit périodique pour les nuages) ---------- */
let MAP=[],SEED=1,NX=6,NY=4;
function vn(x,y,p,q,s){const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),m=(a,b)=>hsh(((a%p)+p)%p,((b%q)+q)%q,s);
  return (m(xi,yi)*(1-u)+m(xi+1,yi)*u)*(1-v)+(m(xi,yi+1)*(1-u)+m(xi+1,yi+1)*u)*v;}
const fbm=(x,y,s)=>.55*vn(x*NX/W,y*NY/H,NX,NY,s)+.3*vn(x*2*NX/W,y*2*NY/H,2*NX,2*NY,s+1)+.15*vn(x*4*NX/W,y*4*NY/H,4*NX,4*NY,s+2);
function carteAscii(){MAP=new Array(W*H);FICT.clear();NX=Math.max(2,Math.round(W/16));NY=Math.max(2,Math.round(H/16));
  for(let y=0;y<H;y++)for(let xx=0;xx<W;xx++){const i=y*W+xx,v=G.t[i],h=hsh(xx,y,9),up=y?G.t[i-W]:-1;let e;
    const autour=(f)=>[-1,1,-W,W].some(o=>{const j=i+o;return j>=0&&j<W*H&&!f(G.t[j]);}),bord=xx<2||y<2||xx>=W-2||y>=H-2;
    if(v===ROCK)e=[h<.35?'▒':'▓','M',.6+.25*h];
    else if(v===MOUNT)e=autour(q=>q===MOUNT||q===HARD)?['▒','M',.75]:[h<.6?'▓':'█','M',.5+.3*h];   /* comme l'essai : bord clair, cœur dense */
    else if(v===HARD)e=bord?null:autour(q=>q===MOUNT||q===HARD)?['▒','H',.9]:['█','H',.7+.2*h];   /* le mur de roche dure du bord de carte : remplacé par le terrain inventé */
    else if(v===LIQ)e=[h<.5?'≈':'~','E',.85];
    else if(v===DEEP)e=['≈','E',.5];
    else if(v===CHASM)e=[' ','K',1];
    else if(v===BRIDGE)e=['═','M',.8];
    else if(v===RUBBLE)e=[h<.5?',':'∙','M',.6];
    else if(v===GRASS)e=[h<.5?'w':h<.8?'ʷ':'"','A',.55+.3*h];
    else if(v===FLAT)e=[h<.3?'_':' ','M',.45];
    else if(bati(v))e=[h<.5?'█':'▓','T',.7+.2*h];
    else if(v===FLOOR)e=['·','T',.45];
    else if(v===DOOR)e=['▒','T',1];
    else if(v>=MACHINE)e=['■','T',1.1];
    else e=h<.07?['.','M',.4]:h<.09?['o','M',.6]:h<.2?['·','M',.3]:[' ','K',1];   // sol nu (et la place du vaisseau, encore vide)
    MAP[i]=e;}}
/* Au-delà de la carte (et à la place de son mur de bord), un terrain inventé, comme celui de l'essai : le vaisseau se pose
   au milieu d'une région, jamais au bord d'un plateau. Plus montagneux près de la carte, dont les bords sont des massifs. */
const FICT=new Map();
function fict(a,b){const K=(b+5000)*20000+(a+5000);let e=FICT.get(K);if(e)return e;
  const F=(s,f)=>.55*vn(a/f,b/f,1e4,1e4,s)+.3*vn(a/(f/2),b/(f/2),1e4,1e4,s+1)+.15*vn(a/(f/4),b/(f/4),1e4,1e4,s+2);
  const d=Math.max(0,-a,a-W+1,-b,b-H+1),m=F(SEED+31,14)+.1*Math.exp(-d/7),v=F(SEED+41,12),c=F(SEED+51,13),h=hsh(a,b,9);
  if(d<6+12*F(SEED+61,8)){const bd=d>=4+11*F(SEED+61,8);e=bd?['▒','H',.85]:[h<.6?'▓':'█','H',.65+.25*h];}   /* le massif de roche dure qui entoure la carte, au bord déchiqueté : au sol, il rejoint la roche dure que le jeu en pixels dessine au-delà du bord */
  else if(m>.6){const k=m-.6;e=k<.025?['▒','M',.75]:k<.08?['▓','M',.62+.25*h]:['█','M',.5+.3*h];}
  else if(c<.27)e=c<.24?[' ','K',1]:['░','M',.35];
  else if(v>.62)e=[h<.5?'w':h<.8?'ʷ':'"','A',.55+.3*h];
  else e=h<.07?['.','M',.4]:h<.09?['o','M',.6]:h<.2?['·','M',.3]:[' ','K',1];
  FICT.set(K,e);return e;}
let ENROULE=true;   /* vue de loin, le disque est courbé en globe ; de près, à plat */
/* la planète ne répète jamais la carte : tout autour, le relief inventé (choisi le 23 novembre 2026, plutôt qu'une répétition en miroir) */
const cellMap=(mx,my)=>{const a=Math.floor(mx),b=Math.floor(my);if(a<0||b<0||a>=W||b>=H)return fict(a,b);return MAP[b*W+a]||fict(a,b);};

/* ---------- le vaisseau, vu de dessus : tiré de SHIP_GRID, chaque case du vaisseau = 4 caractères × 2 rangées, ce qui,
   au sol, est exactement sa taille dans le jeu (une tuile de 32 px = 4 × 2 cases de 8 × 16 px) ---------- */
const NEF=(()=>{const g=SHIP_GRID,NWc=g[0].length*4,NHc=g.length*2,on=(c,r)=>c>=0&&r>=0&&c<NWc&&r<NHc&&g[r>>1][c>>2]!=='.',rows=[];
  for(let r=0;r<NHc;r++){let l='';for(let c=0;c<NWc;c++){if(!on(c,r)){l+=' ';continue;}const k=g[r>>1][c>>2];
    if(k==='E'){l+=r%2?'▀':'█';continue;}   // réacteurs
    const u=on(c,r-1),d=on(c,r+1),gc=on(c-1,r),dr=on(c+1,r);
    if(!u&&!gc)l+='╔';else if(!u&&!dr)l+='╗';else if(!d&&!gc)l+='╚';else if(!d&&!dr)l+='╝';else if(!u||!d)l+='═';else if(!gc||!dr)l+='║';
    else if(r<2)l+='▲';   // le nez
    else if(k==='I')l+=r===6&&(c%4===1||c%4===2)?'◆':'░';   // le couloir, la foreuse dans la soute
    else if(k==='D')l+='▬';   // la porte
    else l+=c%4===0?'│':'▒';}
    rows.push(l);}
  return rows;})(),NW=NEF[0].length,NH=NEF.length;
const nefCol=c=>c==='▲'?['W',1]:c==='◆'?['B',1.35]:c==='▒'?['T',.55]:c==='░'?['B',.4]:c==='│'?['B',.45]:c==='▬'?['A',1]:'█▀'.includes(c)?['A',.8]:['B',1];
const REACT=[5,6,13,14];
const NU_CH=['··:','·:░','░░:','░▒░','▒░▒','▒▒▓','▒▓▒','▓▒▓'],NU_GRIS=['#4d585d','#737f84','#9aa5a9','#c4cdd0','#eef2f3'];   /* nuages : du plus clairsemé au plus dense, et cinq gris */   // colonnes des flammes, sous les réacteurs

/* ---------- la scène, sur le canvas de l'intro ---------- */
let x=null;   /* le contexte du canvas de l'intro (déclaré par 15-intro.js, chargé après) */
let w,h,dpr,cw,chh,C,R,FONT,ATL={},CH=[],CO=[],DIM='';
function setup(){dpr=Math.min(devicePixelRatio||1,2);w=Math.round(innerWidth*dpr);h=Math.round(innerHeight*dpr);if(DIM===w+'x'+h)return;DIM=w+'x'+h;
  introCv.width=w;introCv.height=h;cw=8*dpr;chh=16*dpr;C=Math.ceil(w/cw)+2;R=Math.ceil(h/chh)+2;   /* case de 8 × 16 px : 4 × 2 cases par tuile du jeu */
  FONT=`${Math.round(cw/.6)}px ${FG_FONT}`;ATL={};CH=new Array(C*R);CO=new Array(C*R);}
function glyph(ch,co){const k=ch+co;let g=ATL[k];if(!g){g=document.createElement('canvas');g.width=cw;g.height=chh;const c=g.getContext('2d');
  c.font=FONT;c.textAlign='center';c.textBaseline='middle';c.fillStyle=co;c.fillText(ch,cw/2,chh/2);ATL[k]=g;}return g;}
const put=(i,j,ch,co)=>{if(i<0||j<0||i>=C||j>=R)return;CH[j*C+i]=ch;CO[j*C+i]=co;};   // la dernière écriture gagne : pas de superposition

const T_HYP=1.3,T_P0=.85,T_P1=2.2,T_D0=2.2,T_D1=10.6,T_POSE=11.4,T_NOIR=12.7,T_FIN=13.8;   // secondes
const ANN={t0:1.2,t1:3.2,fin:8.2,sortie:1,l1:'PLANÈTE EN VUE',l2:'ATTERRISSAGE IMMINENT'};
let S=null;
function nouvelle(){x=ictx;SEED=(Math.random()*1e6)|0;palJeu();carteAscii();DIM='';setup();const r=()=>Math.random();
  S={t0:performance.now(),saut:0,ev:{},ascii:1,
    stars:Array.from({length:170},(_,i)=>({x:r(),y:r(),l:i<90?0:i<140?1:2})),
    nuages:[.2,.295,.605,1.344,2.6].map((a,i)=>({a,s:SEED+100+i*17,thr:.66-.05*r()})),
    eclairs:Array.from({length:2+((r()*4)|0)},()=>({t:5.6+r()*2.6,x:.15+r()*.7,s:(r()*1e5)|0})).sort((a,b)=>a.t-b.t),
    pic:.5+r()*.1};}

// altitude : k = cases de carte par rangée d'écran (5,3 en entrant, 1 au sol) ; rayon du disque, en rangées
function zoom(t){const u=s3((t-T_D0)/(T_D1-T_D0)),k=.5+4.8*(1-u)*(1-u);return {k,Z:.2+30*(k-.5)*(k-.5),Rs:8*Math.pow(5.3/k,1.72)};}   /* au sol, une case de carte fait deux rangées : l'écran montre moins que la carte */
function chaleur(t){const u=(t-T_D0)/(T_D1-T_D0);return u<.08?0:u<S.pic?s3((u-.08)/(S.pic-.08)):cl(1-(u-S.pic)/.3);}

/* cadrage final : celui du jeu (foreuse au centre, caméra bornée), pour finir à l'échelle et à la place exactes des pixels */
function cadreJeu(){const el=$('mapwrap'),mr=el?el.getBoundingClientRect():{left:0,top:0,width:innerWidth,height:innerHeight},vc=Math.floor(mr.width)/S_TUILE,vr=Math.floor(mr.height)/S_TUILE;
  const camX=G.px-Math.floor(vc/2),camY=G.py-Math.floor(vr/2);   /* comme le jeu : la foreuse au centre, sans bornes */
  return {gx:(((mr.left*dpr)%cw)+cw)%cw-cw,gy:(((mr.top*dpr)%chh)+chh)%chh-chh,
    px:(mr.left+(G.ship.x+SGW/2-camX)*S_TUILE)*dpr,py:(mr.top+(G.ship.y+SGH/2-camY)*S_TUILE)*dpr};}
const S_TUILE=32;
const lisse5=v=>{v=cl(v);return v*v*v*(v*(v*6-15)+10);};   /* S, la taille d'une tuile du jeu en pixels (00-base.js) */
// position des étoiles : l'intégrale de leur vitesse, qui retombe en douceur à la sortie d'hyperespace (jamais de recul)
const trajet=t=>t<T_HYP?t+20*T_HYP*(1-Math.pow(1-t/T_HYP,3)):t+20*T_HYP;
function frame(now){if(!S||INTRO!==S)return;setup();const t=(now-S.t0)/1000+S.saut,ev=k=>{if(S.ev[k])return false;S.ev[k]=true;return true;};
  sons(t,ev);x.setTransform(1,0,0,1,0,0);x.globalAlpha=1;
  CH.fill(' ');CO.fill('#000');
  const J=cadreJeu(),GX0=J.gx,GY0=J.gy,cx0=i=>i*cw+GX0+cw/2,cy0=j=>j*chh+GY0+chh/2;
  // le point d'atterrissage : au centre de l'écran pendant la descente, puis il glisse jusqu'à la place du vaisseau dans le jeu
  const {k,Z,Rs}=zoom(t),hc=chaleur(t),ent=s3((t-T_P0)/(T_P1-T_P0)),cal=lisse5((t-T_D0)/(T_POSE-.2-T_D0)),
    PX=w/2+(J.px-w/2)*cal,PY0=h*.45+(J.py-h*.45)*cal,PY=-Rs*chh*1.2+(PY0+Rs*chh*1.2)*ent,
    LX=G.ship.x+SGW/2+14*(1-s3(t/4.5)),LY=G.ship.y+SGH/2;   // le vaisseau se pose à sa place sur la carte ; la planète tourne un peu en entrant
  // étoiles : traînées d'hyperespace qui raccourcissent pendant un ralenti amorti, puis points qui défilent lentement
  const hy=cl(1-t/T_HYP),tr=trajet(t);
  for(const s of S.stars){const v=.08+.05*s.l,y=((s.y+tr*v)%1)*R,i=Math.floor(s.x*C),L=Math.round(1+hy*hy*(10+6*s.l));
    for(let q=0;q<L;q++){const j=Math.floor(y)-q;put(i,j,q===0?(hy>.05?'│':s.l===2?'*':s.l?'+':'·'):q<L/2?'│':'¦',q===0?(s.l?P.W:P.K):q<L/2?P.G:P.K);}}
  // la planète : un disque, courbé sur les bords (projection en arc sinus), avec son anneau d'atmosphère ; de près, à plat
  ENROULE=Rs<90;
  if(t>T_P0){for(let j=0;j<R;j++)for(let i=0;i<C;i++){const dx=(cx0(i)-PX)/chh,dy=(cy0(j)-PY)/chh,d=Math.hypot(dx,dy),r=d/Rs;
      if(r>=1){if(r<1+1.3/Rs&&Rs<70)put(i,j,hsh(i,j,(t*8)|0)<.5?'░':'▒',col('B',.7));continue;}
      const md=!ENROULE||!d?k:k*Rs*Math.asin(Math.min(1,r))/d,e=cellMap(LX+dx*md,LY+dy*md);let ch=e[0],c=col(e[1],e[2]);
      if(r>.9&&Rs<70){if(ch!==' ')ch=r>.96?'░':'▒';c=col(e[1]==='K'?'M':e[1],.45);}   // le bord du disque, plus clair
      put(i,j,ch,c);}}   /* le disque cache les étoiles, même là où le sol est nu */
  // le vaisseau est centré sur le point d'atterrissage ; il tangue, puis se stabilise
  const mont=1-Math.pow(1-cl(t/T_D0),4),SYv=(h+NH*chh*.6)+(PY0-(h+NH*chh*.6))*mont;   /* le vaisseau entre par le bas et rejoint le milieu de la planète quand la descente commence */
  const sw=t<T_POSE?Math.round(Math.sin(t*1.1)*1.6*cl((T_POSE-t)/1.5)):0,sc=Math.round((PX-GX0)/cw)-NW/2+sw,sr=Math.round((SYv-GY0)/chh)-NH/2;
  // ombre du vaisseau sur le sol, qui le rejoint en se posant
  if(k<.85){const a=cl((T_POSE-t)/1.6),ox=Math.round(a*9),oy=Math.round(a*5);
    NEF.forEach((l,r)=>{for(let c=0;c<l.length;c++)if(l[c]!==' '){const i=sc+c+ox,j=sr+r+oy;if(i<0||j<0||i>=C||j>=R)continue;const q=j*C+i;CO[q]=col('M',.22);if(CH[q]===' ')CH[q]='░';}});}
  // nuages : chaque couche, à son altitude, grossit à son rythme et s'effiloche en passant le vaisseau ; ils apparaissent peu à peu
  const lame=[],monte=1-cl((Rs-12)/32);
  for(const L of S.nuages){if(Z<=L.a||Rs<12)continue;const kl=k*(Z-L.a)/Z,pres=cl((Z-L.a)/(L.a*1.6)),thr=L.thr+.3*(1-pres)*(1-pres)+.1*cl((Z-6)/60)+.45*monte;   /* vus de l'espace, clairsemés ; ils s'épaississent en douceur */
    const dessus=pres<.35;for(let j=0;j<R;j++)for(let i=0;i<C;i++){const dx=(cx0(i)-PX)/chh,dy=(cy0(j)-PY)/chh;
      if(Rs<70&&Math.hypot(dx,dy)>Rs)continue;
      const n0=fbm(LX+dx*kl+t*.15*k,LY+dy*kl,L.s)-thr;if(n0<0)continue;const gr=hsh(i,j,L.s+((t*3)|0)),n=n0+(gr-.5)*.07;if(n<.005)continue;   /* du grain dans la matière, qui bouge lentement */
      const q=Math.min(NU_CH.length-1,Math.floor(n/.032)),ch=NU_CH[q][Math.floor(hsh(i,j,L.s+7)*NU_CH[q].length)],c=NU_GRIS[Math.min(4,Math.max(0,Math.floor(n/.04)+(gr<.2?-1:gr>.85?1:0)))];   /* nuages légers : jamais de pavé plein */
      if(dessus)lame.push([i,j,ch,c]);else put(i,j,ch,c);}}
  // éclairs : zigzag de haut en bas, quelques centièmes de seconde, nuages alentour illuminés
  let orage=false;
  for(const e of S.eclairs){const a=t-e.t;if(a<0||a>.2)continue;orage=true;if(!e.son){e.son=1;SFX.thunder();}if(((a*30)|0)%2&&a>.07)continue;let i=Math.floor(e.x*C);const fin=Math.floor(R*(.55+.4*hsh(e.s,0,1)));
    for(let j=0;j<fin;j++){const r=hsh(e.s,j,2),di=r<.33?-1:r<.66?0:1;put(i,j,di<0?'╱':di>0?'╲':'│',j%3?P.W:'#fff3a0');
      for(let q=-6;q<=6;q++){const o=j*C+i+q;if(q&&o>=0&&o<CH.length&&'░▒▓█'.includes(CH[o]))CO[o]=P.W;}i+=di;}}
  // le vaisseau et ses réacteurs
  const flam=t<T_POSE?(t<T_HYP?7:2+Math.round(hsh(1,(t*14)|0,3)*2)):0;
  for(const ec of REACT)for(let q=1;q<=flam;q++)put(sc+ec,sr+NH-1+q,q===1?'▼':q<flam?'║':'¦',feu(.95-q*.12));
  NEF.forEach((l,r)=>{for(let c=0;c<l.length;c++){const ch=l[c];if(ch===' ')continue;const[k0,f]=nefCol(ch);
    put(sc+c,sr+r,ch,ch==='◆'&&((t*3)|0)%2?P.W:col(k0,f));}});
  // entrée dans l'atmosphère : un arc de plasma devant le nez, des traînées de feu de part et d'autre
  if(hc>.03){const ra=7.5+hc*1.6,ci=sc+NW/2,cj=sr+NH*.45,tic=(t*14)|0;
    for(let j=Math.floor(cj-ra-3);j<=cj;j++)for(let i=ci-30;i<=ci+30;i++){const dx=(i-ci)*cw/chh,dy=j-cj,d=Math.hypot(dx,dy),an=Math.atan2(dx,-dy);
      if(Math.abs(an)>1.45||d<ra-.8||d>ra+.5+hc*1.6)continue;const q=hc*(1-Math.abs(an)/1.45*.55)*(.7+.6*hsh(i,j,tic));if(q<.12)continue;
      put(i,j,q>.6?'▀':q>.4?'≈':q>.25?'~':'·',feu(q));}
    for(const sd of [-1,1])for(let q=0;q<Math.round(5+hc*16);q++){const i=ci+sd*Math.round((ra*.92)*chh/cw)+(hsh(sd,q,tic)<.3?sd:0),j=Math.round(cj-1+q);
      if(hsh(sd*7,q,tic+1)>1-q/(5+hc*16)*.8)continue;put(i,j,q<3?'║':'¦',feu(hc*(1-q/(6+hc*16))));}}
  // posé : un anneau de poussière qui s'éloigne en perdant sa densité
  if(t>T_POSE){const a=t-T_POSE,rr=4+a*16,ci=sc+NW/2,cj=sr+NH/2;
    for(let j=Math.floor(cj-rr-2);j<=cj+rr+2;j++)for(let i=Math.floor(ci-(rr+2)*chh/cw);i<=ci+(rr+2)*chh/cw;i++){const d=Math.hypot((i-ci)*cw/chh,j-cj);
      if(Math.abs(d-rr)>1.1)continue;const n=(1-a/1.3)*hsh(i,j,7);if(n<.25)continue;put(i,j,n>.6?'▒':n>.42?'░':'·',col('M',1.25));}}
  for(const l of lame)put(...l);   // la couche que le vaisseau traverse passe par-dessus
  // dessin : chaque case opaque (fond noir plein, puis le caractère), décalée d'un bloc quand ça tremble
  const choc=hc*hc*7+(t>T_POSE&&t<T_POSE+.5?(1-(t-T_POSE)/.5)*6:0),ox=Math.round((Math.random()-.5)*2*choc*dpr),oy=Math.round((Math.random()-.5)*2*choc*dpr);
  const fini=(i,j)=>t-(T_NOIR+hsh(i,j,33)*.6);   /* extinction : depuis combien de temps la case s'éteint */
  if(t<=T_NOIR){x.fillStyle='#000';x.fillRect(0,0,w,h);for(let j=0;j<R;j++)for(let i=0;i<C;i++){const ch=CH[j*C+i];if(ch!==' ')x.drawImage(glyph(ch,CO[j*C+i]),i*cw+GX0+ox,j*chh+GY0+oy);}}
  else{x.clearRect(0,0,w,h);x.fillStyle='#000';for(let j=0;j<R;j++)for(let i=0;i<C;i++){if(fini(i,j)>=0)continue;const ch=CH[j*C+i],X=i*cw+GX0,Y=j*chh+GY0;x.fillRect(X,Y,cw,chh);if(ch!==' ')x.drawImage(glyph(ch,CO[j*C+i]),X,Y);}}
  hud(t,{k,Z,Rs,hc,orage});
  // extinction : chaque case, à son tour, passe par « ▒ ░ · » dans sa couleur, puis s'efface et laisse voir le jeu en pixels,
  // à la même échelle et à la même place (le tableau de bord s'efface avec les cases qu'il couvre)
  if(t>T_NOIR)for(let j=0;j<R;j++)for(let i=0;i<C;i++){const f=fini(i,j);if(f<0)continue;const st=Math.floor(f/.1),q=j*C+i,X=i*cw+GX0,Y=j*chh+GY0;
    x.clearRect(X,Y,cw,chh);if(st<3&&CH[q]!==' '){x.fillStyle='#000';x.fillRect(X,Y,cw,chh);x.drawImage(glyph('▒░·'[st],CO[q]),X,Y);}}
  if(t>=T_FIN){S=null;introCv.style.background='';endIntro();return;}
  requestAnimationFrame(frame);}

/* ---------- tableau de bord (repris des descentes) ---------- */
let HUDG=0,HUDB=0;
const esp=v=>String(v).replace(/\B(?=(\d{3})+$)/g,' ');
function hud(t,o){const fs=Math.round(12*dpr),lh=Math.round(17*dpr),m=Math.round(20*dpr),pose=t>=T_POSE;
  x.font=`${fs}px ${FG_FONT}`;x.textAlign='left';x.textBaseline='top';
  const alt=pose?0:Math.round(o.Z*420),vit=t<T_HYP?'HYPER':pose?'0 m/s':esp(Math.round(7800*Math.pow(o.k-.5,1.3)/Math.pow(4.8,1.3)+40*(1-s3((t-T_D1)/(T_POSE-T_D1)))))+' m/s',
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
  // jauge d'altitude, à droite (à la place de la coupe)
  const gw=Math.round(8*dpr),gx=w-m-gw,gt=Math.round(h*.22),gh=Math.round(h*.5),f=pose?1:1-cl(Math.log(o.Z/.2)/Math.log(555/.2));
  [[0,.35,col('K',.5)],[.35,.75,col('B',.45)],[.75,1,col('M',.8)]].forEach(([a,b,c])=>{x.fillStyle=c;x.fillRect(gx,gt+Math.round(gh*a),gw,Math.round(gh*(b-a)));});
  x.fillStyle='#fff';x.fillRect(gx-Math.round(6*dpr),Math.round(gt+gh*f)-1,gw+Math.round(12*dpr),Math.max(2,Math.round(2*dpr)));
  x.textAlign='right';x.fillStyle=P.G;x.fillText('ALT',gx+gw,gt-lh);x.textAlign='left';
  /* pas d'alerte à l'arrivée (retirée le 23 novembre 2026, à la demande) ; annonce() reste pour mémoire */}

/* ---------- l'alerte, en police DOS (même cadre que les descentes), couleur monde ---------- */
const GL='#%&$@/\\<>=+*?!;:-_|[]{}()0123456789ABCDEFGHJKLMNPQRSTUVWXYZ£¥§¶«»±÷≈∙√ⁿ²■ΣΩδ∞φε∩≡',RAMPE='.i0',BLOC='░▒▓';
function annonce(t){const cols=30,rows=9,c0=P.M,blanc=P.W,gris=P.K,{l1,l2}=ANN;
  const p=fgAnnP(w),aw=8*p,ah=16*p,x0=HUDG+aw,y0=HUDB+ah+Math.round(6*dpr);
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

/* bruitages : ceux de l'ancienne intro, calés sur les temps de la scène */
function sons(t,ev){const D=T_D1-T_D0;
  if(t<T_HYP&&ev('hyper'))SFX.hyper();if(t>T_P0&&ev('hum'))SFX.hum();if(t>T_D0&&ev('appr'))SFX.approach();
  if(t>T_D0+.08*D&&ev('reen'))SFX.reentry(D*.8,D*(S.pic-.08));if(t>T_D1-1.6&&t<T_POSE&&ev('thr'))SFX.thrust();
  if(t>=T_POSE&&ev('touch'))SFX.touchdown();}
window.arriveeStart=()=>{nouvelle();INTRO=S;introCv.hidden=false;introCv.style.opacity=1;introCv.style.background='transparent';   /* le jeu en pixels, dessous, apparaît case par case à la fin */
  $('introSkip').hidden=false;requestAnimationFrame(frame);};
// passer : on saute à l'extinction (les sons d'ici là ne sont plus joués)
window.arriveeSkip=()=>{if(!S)return;const t=(performance.now()-S.t0)/1000+S.saut;if(t<T_NOIR){S.saut+=T_NOIR-t;for(const k of ['hyper','hum','appr','reen','thr','touch'])S.ev[k]=true;for(const e of S.eclairs)e.son=1;}};
})();
