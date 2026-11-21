/* ---------- Rendu ---------- */
const cv=$('view'),ctx=cv.getContext('2d'),fcv=$('fxv'),fctx=fcv.getContext('2d');let cols=20,rows=15,camX=0,camY=0,vw=0,vh=0;
function resize(){const r=$('mapwrap').getBoundingClientRect();vw=Math.max(1,Math.floor(r.width));vh=Math.max(1,Math.floor(r.height));
  const dpr=devicePixelRatio||1;cv.width=vw*dpr;cv.height=vh*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);fcv.width=vw*dpr;fcv.height=vh*dpr;fctx.setTransform(dpr,0,0,dpr,0,0);
  cols=Math.ceil(vw/S);rows=Math.ceil(vh/S);render();}
const hash=(x,y)=>((x*73856093)^(y*19349663))>>>0;
let ox=0,oy=0;
/* ---------- Effets de percussion ---------- */
let FX=[],fxRaf=0,SHOWVIS=false;
// Champ de vision (touche V) : contour pointillé blanc, en pixels de tuile opaques, sur le bord de la zone ; l'intérieur reste intact
function drawVisCells(cells,col){ctx.globalAlpha=1;ctx.fillStyle=col||'#ffffff';
  for(const i of cells){const x=i%W,y=(i/W)|0,px=(x-camX)*S,py=(y-camY)*S,edge=(dx,dy)=>!cells.has(idx(x+dx,y+dy));
    for(let k=0;k<16;k+=2){if(edge(0,-1))ctx.fillRect(px+k*2,py,2,2);if(edge(0,1))ctx.fillRect(px+k*2,py+S-2,2,2);if(edge(-1,0))ctx.fillRect(px,py+k*2,2,2);if(edge(1,0))ctx.fillRect(px+S-2,py+k*2,2,2);}}}
/* ---------- Foreuse endommagée : fumée sous 50 PV, fumée + flammèches sous 20 PV ----------
   Dessiné sur un calque transparent posé sur la vue (#fxv), animé en continu sans redessiner la carte.
   Particules en pixels de carte (case × S) : la fumée qui s'élève reste sur place quand la foreuse avance (traînée).
   Pixel art strict : grains opaques de 1 ou 2 pixels de tuile, sans fondu ni agrandissement ; chacun disparaît d'un coup. */
const SMOKE={p:[],raf:0,last:0,acc:0,accF:0};
/* Destruction d'un ennemi (19 novembre 2026 ; avant : une giclée de sang et une tache). Les ennemis sont des machines :
   - une gerbe d'étincelles (accent et monde) qui filent droit, très vite, avec une courte traîne, et s'éteignent en
     un quart de seconde ;
   - des débris de carcasse, monde et accent eux aussi, projetés en l'air : ils retombent, rebondissent une ou deux fois,
     puis restent au sol (G.splat, pixels de carte), sauf dans l'eau ou un gouffre. Au plus SPLAT_MAX débris gardés.
   Pixel art strict : grains opaques de 1 ou 2 pixels de tuile, calés sur la grille, qui disparaissent d'un coup. */
const SPLAT_MAX=1500;
function gore(x,y){const cx=(x+.5)*S,cy=(y+.5)*S,deb=[PAL['3'],PAL['3'],PAL['1']],ETINC_COLS=[PAL['1'],PAL['1'],PAL['3']];   // deux couleurs seulement : monde et accent
  for(let j=0,n=34+((Math.random()*14)|0);j<n;j++){const an=Math.random()*Math.PI*2,v=150+Math.random()*330;
    SMOKE.p.push({x:cx+Math.cos(an)*4,y:cy+Math.sin(an)*4,vx:Math.cos(an)*v,vy:Math.sin(an)*v-40,a:0,l:.1+Math.random()*.3,sz:2,c:ETINC_COLS[(Math.random()*ETINC_COLS.length)|0],spark:true});}
  for(let j=0,n=14+((Math.random()*8)|0);j<n;j++){const an=Math.random()*Math.PI*2,v=50+Math.random()*150,r0=2+Math.random()*5;
    SMOKE.p.push({x:cx+Math.cos(an)*r0,y:cy+Math.sin(an)*r0*.8,z:4+Math.random()*8,vx:Math.cos(an)*v,vy:Math.sin(an)*v*.8,vz:120+Math.random()*220,a:0,l:9,sz:Math.random()<.3?4:2,
      c:deb[(Math.random()*deb.length)|0],blood:true,reb:1+((Math.random()*2)|0)});}
  smokeKick();}
function smokeOn(){return G&&!G.over&&G.st&&G.st.vie<50&&$('introCv').hidden;}
function smokeKick(){if(!SMOKE.raf&&(smokeOn()||SMOKE.p.length)){SMOKE.last=performance.now();SMOKE.raf=requestAnimationFrame(smokeStep);}}
function smokeStep(now){const dt=Math.min(.05,(now-SMOKE.last)/1000);SMOKE.last=now;const on=smokeOn(),fire=on&&G.st.vie<20;
  if(on){const cx=(G.px+.5)*S,cy=(G.py+.5)*S;
    SMOKE.acc+=dt*(fire?24:12);while(SMOKE.acc>=1){SMOKE.acc--;const g=85+((Math.random()*60)|0);
      SMOKE.p.push({x:cx+(Math.random()-.5)*S*.5,y:cy-S*.1+(Math.random()-.5)*S*.3,vx:(Math.random()-.5)*6,vy:-(18+Math.random()*18),
        a:0,l:.8+Math.random()*1.2,sz:Math.random()<.35?4:2,c:`rgb(${g+8},${g+14},${g+12})`,smoke:true});}
    if(fire){SMOKE.accF+=dt*14;while(SMOKE.accF>=1){SMOKE.accF--;
      SMOKE.p.push({x:cx+(Math.random()-.5)*S*.55,y:cy+(Math.random()-.3)*S*.4,vx:(Math.random()-.5)*8,vy:-(18+Math.random()*22),
        a:0,l:.2+Math.random()*.35,sz:2,c:['#ffe066','#ff9a1f','#ff9a1f','#e8432a'][(Math.random()*4)|0],smoke:false});}}}
  fctx.clearRect(0,0,vw,vh);let n=0,landed=false;
  for(const q of SMOKE.p){q.a+=dt;if(q.a>=q.l)continue;
    if(q.blood){const dr=Math.exp(-5*dt);q.vx*=dr;q.vy*=dr;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vz-=1100*dt;q.z+=q.vz*dt;
      if(q.z<=0&&q.reb>0&&q.vz<-80){q.z=0;q.vz=-q.vz*.42;q.vx*=.6;q.vy*=.6;q.reb--;}   // un débris rebondit avant de s'immobiliser
      if(q.z<=0){const mx=Math.floor(q.x/S),my=Math.floor(q.y/S),t=mx>=0&&my>=0&&mx<W&&my<H?G.t[idx(mx,my)]:ROCK;
        if(t!==LIQ&&t!==DEEP&&t!==CHASM&&!blocks(t)){G.splat=G.splat||[];G.splat.push([Math.round(q.x/2)*2,Math.round(q.y/2)*2,q.c,q.sz]);
          if(G.splat.length>SPLAT_MAX)G.splat.splice(0,G.splat.length-SPLAT_MAX);landed=true;}continue;}
      SMOKE.p[n++]=q;fctx.fillStyle=q.c;fctx.fillRect(Math.round((q.x-camX*S)/2)*2,Math.round((q.y-q.z-camY*S)/2)*2,q.sz,q.sz);continue;}
    if(q.spark){const dr=Math.exp(-7*dt);q.vx*=dr;q.vy*=dr;q.x+=q.vx*dt;q.y+=q.vy*dt;SMOKE.p[n++]=q;fctx.fillStyle=q.c;   // étincelle : le grain et sa traîne, un cran derrière
      fctx.fillRect(Math.round((q.x-camX*S)/2)*2,Math.round((q.y-camY*S)/2)*2,2,2);fctx.fillRect(Math.round((q.x-q.vx*.018-camX*S)/2)*2,Math.round((q.y-q.vy*.018-camY*S)/2)*2,2,2);continue;}
    q.x+=(q.vx+Math.sin(now/600+q.l*9)*4)*dt;q.y+=q.vy*dt;if(q.smoke)q.vy*=Math.exp(-.6*dt);
    SMOKE.p[n++]=q;   // pixel art strict : taille fixe, opaque, calé sur la grille des pixels de tuile (2 px), disparaît d'un coup
    fctx.fillStyle=q.c;fctx.fillRect(Math.round((q.x-camX*S)/2)*2,Math.round((q.y-camY*S)/2)*2,q.sz,q.sz);}
  SMOKE.p.length=n;fctx.globalAlpha=1;if(landed)render();
  SMOKE.raf=(on||n)?requestAnimationFrame(smokeStep):0;if(!SMOKE.raf)fctx.clearRect(0,0,vw,vh);}
/* ---------- Explosion de la foreuse (mort) ----------
   Comme la poussière d'atterrissage : des centaines d'éclats (couleurs de la foreuse) projetés en l'air, qui retombent,
   rebondissent au sol, ricochent sur les obstacles, tombent dans les gouffres et disparaissent d'un coup, chacun à son
   heure. Positions en cases de carte ; z = hauteur. Quand tout est retombé, done() est appelé. */
let BOOM=null;
function explode(done){
  const cols=[PAL['1'],PAL['1'],PAL['2'],PAL['2'],PAL['2'],'#ffffff'],p=[],cx=G.px+.5,cy=G.py+.5;
  for(let j=0;j<520;j++){const an=Math.random()*Math.PI*2,v=1.5+Math.random()*11;
    p.push({x:cx+Math.cos(an)*.2,y:cy+Math.sin(an)*.2,z:.1+Math.random()*.3,vx:Math.cos(an)*v,vy:Math.sin(an)*v,vz:2+Math.random()*9,
      l:.6+Math.random()*1.6,a:0,sz:2+(Math.random()<.3?1:0)+(Math.random()<.06?2:0),c:cols[(Math.random()*cols.length)|0]});}
  BOOM={p,last:performance.now(),t0:performance.now(),done};SFX.explode();addFx({kind:'shake',amp:10,dur:600});
  if(reduced){BOOM=null;render();setTimeout(done,400);return;}
  const hard=(x,y)=>{const a=Math.floor(x),b=Math.floor(y);if(a<0||b<0||a>=W||b>=H)return true;const i=idx(a,b),v=G.t[i];return v===ROCK||v===MOUNT||v===HARD||v===SHIP||bati(v)||(fog&&!vis[i]);};   // la zone hors de vue arrête les éclats
  const step=now=>{if(!BOOM)return;const dt=Math.min(.05,(now-BOOM.last)/1000);BOOM.last=now;let n=0;
    for(const q of BOOM.p){q.a+=dt;if(q.a>=q.l)continue;const air=q.z>0||q.vz>0,dr=Math.exp(-(air?1:7)*dt);q.vx*=dr;q.vy*=dr;
      const nx=q.x+q.vx*dt,ny=q.y+q.vy*dt;
      if(hard(nx,ny)){const hx=hard(nx,q.y),hy=hard(q.x,ny);if(hx)q.vx*=-.55;if(hy)q.vy*=-.55;if(!hx&&!hy){q.vx*=-.55;q.vy*=-.55;}}else{q.x=nx;q.y=ny;}
      if(air){q.vz-=28*dt;q.z+=q.vz*dt;if(q.z<=0){q.z=0;if(G.t[idx(Math.floor(q.x),Math.floor(q.y))]===CHASM)continue;   // tombe dans le gouffre
        if(q.vz<-1.2){q.vz=-q.vz*.45;q.vx*=.75;q.vy*=.75;}else q.vz=0;}}
      BOOM.p[n++]=q;}
    BOOM.p.length=n;render();
    if(n)requestAnimationFrame(step);else{const d=BOOM.done;BOOM=null;render();setTimeout(d,250);}};
  requestAnimationFrame(step);}
function drawBoom(){const fl=1-(performance.now()-BOOM.t0)/180;
  if(fl>0){ctx.globalAlpha=fl*.8;ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc((G.px+.5-camX)*S,(G.py+.5-camY)*S,S*1.6,0,Math.PI*2);ctx.fill();}   // éclair de l'explosion
  ctx.globalAlpha=1;for(const q of BOOM.p){ctx.fillStyle=q.c;ctx.fillRect(Math.round((q.x-camX)*S/2)*2,Math.round((q.y-q.z-camY)*S/2)*2,q.sz,q.sz);}}
function addFx(f){f.t0=performance.now();if(f.kind==='num')f.stack=FX.filter(o=>o.kind==='num'&&o.x===f.x&&o.y===f.y&&fxP(o)<.5).length;FX.push(f);if(!fxRaf)fxRaf=requestAnimationFrame(fxLoop);}
// grains d'un effet de consommable : position dans la case et instant d'apparition, tirés une fois pour toutes
const fxGrains=n=>Array.from({length:n},()=>({x:rnd(0,13),y:rnd(3,14),d:Math.random()*.55}));
function fxLoop(){const now=performance.now();FX=FX.filter(f=>now-f.t0<f.dur);render();fxRaf=(FX.length||animVif())?requestAnimationFrame(fxLoop):0;}   // une mine armée ou un paralyzor accroché gardent le rendu en marche
const fxP=f=>Math.min(1,(performance.now()-f.t0)/f.dur);
function lungeOff(match){if(reduced)return [0,0];const f=FX.find(match);if(!f)return [0,0];const k=Math.sin(Math.PI*fxP(f))*.4*S;return [f.dx*k,f.dy*k];}

function put(t,x,y,a){ctx.globalAlpha=a;ctx.drawImage(t,ox+(x-camX)*S,oy+(y-camY)*S,S,S);}
/* ---------- Gouffres lisibles (variante D′) ----------
   Lèvre irrégulière couleur sol (1 à 3 pixels, ondulation lente) sur chaque côté de gouffre qui touche le sol,
   et sous chaque pixel de bord tourné vers le nord (bord, flanc, éperon, dessous de pont) une paroi en dégradé plein :
   7 teintes sur 7 pixels, de la couleur monde atténuée jusqu'au noir. Calculé une fois par planète et par palette,
   dans une image de la taille de la carte (16 pixels par case), puis recopié case par case au rendu. */
let CHASM_OV=null,CHASM_KEY='';
const hash3=(a,b,c)=>{let h=(a*73856093)^(b*19349663)^(c*83492791);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;};
const lipD=(gx,gy,side,i)=>{const s=hash3(gx,gy,side);return 1+Math.min(2,Math.floor((Math.sin(i*.42+s*20)+Math.sin(i*.95+s*7)*.35+1.35)/2.7*3));};
const isCh=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&G.t[idx(x,y)]===CHASM;
const solid=(x,y)=>!(x>=0&&y>=0&&x<W&&y<H)||(G.t[idx(x,y)]!==CHASM&&G.t[idx(x,y)]!==BRIDGE);   // côté « sol » (pas gouffre, pas pont)
function chasmLip(cx,cy){const N=solid(cx,cy-1),Sd=solid(cx,cy+1),Wd=solid(cx-1,cy),E=solid(cx+1,cy),lip=new Uint8Array(256);
  const cor=(dx,dy,a,b)=>solid(cx+dx,cy+dy)&&isCh(cx+dx,cy)&&isCh(cx,cy+dy)&&a+b<3;
  for(let j=0;j<16;j++)for(let i=0;i<16;i++){
    if((N&&j<lipD(cx,cy,0,i))||(Sd&&15-j<lipD(cx,cy,1,i))||(Wd&&i<lipD(cx,cy,2,j))||(E&&15-i<lipD(cx,cy,3,j))||
       cor(-1,-1,i,j)||cor(1,-1,15-i,j)||cor(-1,1,i,15-j)||cor(1,1,15-i,15-j))lip[j*16+i]=1;}
  return lip;}
function ensureChasmOv(){if(!G)return;const key=(G.seed||'')+'|'+PAL['3']+'|'+G.t.length;if(CHASM_OV&&CHASM_KEY===key&&CHASM_OV._g===G)return;
  const PW=W*16,PH=H*16,c=document.createElement('canvas');c.width=PW;c.height=PH;const x=c.getContext('2d'),img=x.createImageData(PW,PH),d=img.data,vd=new Uint8Array(PW*PH);
  const m=hexRgb3(PAL['3']),vo=[2,6,5],GRc=vo.map((v,n)=>Math.round(v+(m[n]-v)*.08)),base=m.map(v=>v*.6),NT=7;
  const set=(i,c)=>{d[i*4]=c[0];d[i*4+1]=c[1];d[i*4+2]=c[2];d[i*4+3]=255;};
  for(let cy=0;cy<H;cy++)for(let cx=0;cx<W;cx++){if(!isCh(cx,cy))continue;const lip=chasmLip(cx,cy);
    for(let j=0;j<16;j++)for(let i=0;i<16;i++){const pi=(cy*16+j)*PW+cx*16+i;if(lip[j*16+i])set(pi,GRc);else vd[pi]=1;}}
  for(let X=0;X<PW;X++){let dd=99;for(let Y=0;Y<PH;Y++){const i=Y*PW+X;if(!vd[i]){dd=99;continue;}dd=(Y===0||!vd[i-PW])?0:dd+1;
    if(dd<NT){const f=(NT-dd)/(NT+1);set(i,base.map(v=>Math.round(v*f)));}}}
  x.putImageData(img,0,0);c._g=G;CHASM_OV=c;CHASM_KEY=key;}
function hexRgb3(h){const n=parseInt(h.slice(1),16);return [(n>>16)&255,(n>>8)&255,n&255];}
// la tuile « Bord croisé » teinte en rouge, refaite si elle est retouchée au Tile editor
let VIS_T=null,VIS_K='';
function viseeTuile(){const r=rowsOf('nuage3'),k=r.join('');if(!VIS_T||VIS_K!==k){VIS_T=curCanvas(r,'#b8242a');VIS_K=k;}return VIS_T;}
/* Texture du sol (16 novembre 2026, variante « plaques rugueuses » choisie sur la planche planches/sol-grain.js) :
   chaque case prend une nuance de la couleur monde très légèrement décalée (grandes plages douces, teinte ±4°, saturation ±13 %),
   et un grain de 0 à 11 pixels par case dont la DENSITÉ varie par zones : des coins presque lisses, d'autres nettement granuleux.
   Comme les gouffres, c'est calculé une fois par planète et par palette, dans une image de 16 pixels par case. */
let SOL_OV=null,SOL_KEY='';
const solH=(a,b,k)=>{let n=((a*73856093)^(b*19349663)^(k*83492791))>>>0;n^=n<<13;n>>>=0;n^=n>>17;n^=n<<5;n>>>=0;return n/4294967296;};
const solN=(a,b,sc)=>{const X=a/sc,Y=b/sc,x0=Math.floor(X),y0=Math.floor(Y),tx=X-x0,ty=Y-y0,sx=tx*tx*(3-2*tx),sy=ty*ty*(3-2*ty),v=(i,j)=>solH(i,j,7);
  return (v(x0,y0)*(1-sx)+v(x0+1,y0)*sx)*(1-sy)+(v(x0,y0+1)*(1-sx)+v(x0+1,y0+1)*sx)*sy;};
/* Les six nombres du réglage. teinte, clarte, satu : amplitude totale des nuances d'une plage à l'autre (en degrés et en %).
   grainMax : nombre maximal de pixels de grain sur une case, dans les coins les plus rugueux.
   fond, grain : opacités sur 255 du voile et des pixels de grain (20 = les 8 % d'origine).
   echPlage, echGrain : taille des plages et des zones de rugosité, en cases (un écran en fait une trentaine de large).
   Valeurs renforcées le 16 novembre 2026 à la demande de l'utilisateur : grain plus marqué, plages plus contrastées et plus nombreuses. */
const SOL_REG={teinte:18,clarte:9,satu:58,grainMax:20,fond:20,grain:72,echPlage:10,echGrain:5};
function ensureSolOv(){if(!G)return;const R=SOL_REG,key=(G.seed||'')+'|'+PAL['3']+'|'+G.t.length+'|'+Object.values(R).join(',');
  if(SOL_OV&&SOL_KEY===key&&SOL_OV._g===G)return;
  const PW=W*16,PH=H*16,c=document.createElement('canvas');c.width=PW;c.height=PH;const x=c.getContext('2d'),img=x.createImageData(PW,PH),d=img.data;
  for(let cy=0;cy<H;cy++)for(let cx=0;cx<W;cx++){
    const [r,g,b]=hexRgb3(teinter(PAL['3'],(solN(cx,cy,R.echPlage)-.5)*R.teinte,(solN(cx+99,cy,R.echPlage*.85)-.5)*R.clarte,(solN(cx,cy+99,R.echPlage*1.15)-.5)*R.satu));
    for(let j=0;j<16;j++){let pi=((cy*16+j)*PW+cx*16)*4;for(let i=0;i<16;i++,pi+=4){d[pi]=r;d[pi+1]=g;d[pi+2]=b;d[pi+3]=R.fond;}}
    const n=Math.round(solN(cx,cy,R.echGrain)*R.grainMax);
    for(let k=0;k<n;k++){const gx=Math.floor(solH(cx,cy,5+k*3)*16),gy=Math.floor(solH(cx,cy,5+k*3+1)*16);
      d[((cy*16+gy)*PW+cx*16+gx)*4+3]=R.grain;}}
  x.putImageData(img,0,0);c._g=G;SOL_OV=c;SOL_KEY=key;}
// le voile de couleur monde d'une case : l'image précalculée, ou la couleur unie tant qu'elle n'est pas prête
function voile(x,y,px,py,a,cx2,uni){const c=cx2||ctx;   // uni : couleur unie, sans la texture du sol (ponts des bâtiments)
  if(!uni&&SOL_OV&&SOL_OV._g===G){c.globalAlpha=a;c.drawImage(SOL_OV,x*16,y*16,16,16,px,py,S,S);return;}
  c.globalAlpha=.08*a;c.fillStyle=PAL['3'];c.fillRect(px,py,S,S);}
/* Sonar (13 novembre 2026, revu le 15) : 10 à 20 tours après l'arrivée sur un niveau, la foreuse émet une onde circulaire qui balaie toute
   la carte et détecte les gisements (éclats de métal et Matière). G.sonar : 1 = à émettre (au tour G.sonarAt), 2 = émis.
   Ce qui est détecté s'affiche sur la carte et la mini-carte, même là où la foreuse n'a rien vu, au fur et à mesure que l'onde l'atteint.
   L'onde se dessine aussi sur la mini-carte ; un « blip blip » l'accompagne pendant tout le balayage. */
const SONAR_V=38,SONAR_MIN=2600;                         // cases par seconde ; durée minimale du balayage, en ms
function sonarStart(){G.sonar=2;G.sonX=G.px;G.sonY=G.py;const r=Math.hypot(Math.max(G.px,W-G.px),Math.max(G.py,H-G.py))+2,dur=reduced?1:Math.max(SONAR_MIN,r/SONAR_V*1000);
  addFx({kind:'sonar',x:G.px,y:G.py,r,dur});SFX.sonar(dur/1000);
  const l=Object.values(G.ore||{}),m=l.filter(oreMat).length,n=l.length-m;
  sayMore(`Sonar : ${n} gisement${n>1?'s':''} de métal et ${m} de Matière détecté${l.length>1?'s':''}.`,'info');}
function sonarR(){if(!G||G.sonar===1)return -1;const f=FX.find(f=>f.kind==='sonar');return f?fxP(f)*f.r:Infinity;}
const sonarVu=(i,sr)=>Math.hypot(i%W-(G.sonX??G.px),((i/W)|0)-(G.sonY??G.py))<=sr;
function render(){
  if(!fxRaf&&animVif())fxRaf=requestAnimationFrame(fxLoop);
  if(G&&G.sonar===1&&G.turn>=(G.sonarAt||0)&&started&&!INTRO&&!BOOM&&!G.over&&$('overlay').hidden&&$('introCv').hidden)sonarStart();
  if(!G||!TL.robot)return;ensureChasmOv();ensureSolOv();
  const vc=vw/S,vr=vh/S;
  const fx0=freeCam?camCX:G.px,fy0=freeCam?camCY:G.py;
  camX=Math.max(0,Math.min(W-Math.floor(vc),fx0-Math.floor(vc/2)));camY=Math.max(0,Math.min(H-Math.floor(vr),fy0-Math.floor(vr/2)));
  ox=0;oy=0;
  ctx.globalAlpha=1;ctx.imageSmoothingEnabled=false;ctx.fillStyle='#020605';ctx.fillRect(0,0,vw,vh);
  const sh=reduced?null:FX.find(f=>f.kind==='shake');ctx.save();
  if(sh){const a=(1-fxP(sh))*sh.amp;ctx.translate(Math.round((Math.random()*2-1)*a),Math.round((Math.random()*2-1)*a));}
  for(let y=camY;y<Math.min(H,camY+rows+1);y++)for(let x=camX;x<Math.min(W,camX+cols+1);x++){
    const i=idx(x,y),v=fog?vis[i]:1;if(!v&&!G.seen[i])continue;const t=G.t[i],h=hash(x,y),k=v?1:.28;
    const pb=t===BRIDGE&&G.pb&&G.pb[i];   // pont d'un bâtiment : couleur unie et tuile du sol bâti (19 novembre 2026)
    if(t!==CHASM)voile(x,y,(x-camX)*S,(y-camY)*S,k,null,pb||t>=WALL);   // rien de bâti ne porte la texture du sol naturel
    if(pb)put(TL.floor,x,y,.5*k);
    if(t>=WALL)batiTuile(t,x,y,(tl,a)=>put(tl,x,y,a*k));else
    if(t!==BRIDGE)put(TL.ground0,x,y,.6*k);   // sol uniforme : plus de variations près des sites (13 novembre 2026)
    if(t===ROCK)put(h%3?TL.rock:TL.rock2,x,y,.95*k);
    else if(t===MOUNT)put(y>0&&G.t[idx(x,y-1)]===MOUNT?TL.mtBody:TL.mtTop,x,y,.9*k);
    else if(t===HARD){const up=y>0?G.t[idx(x,y-1)]:-1;   // comme la montagne : crête irrégulière en haut, posée sur de la roche tendre
      if(up!==HARD){if(up===MOUNT||up===ROCK)put(TL.mtBody,x,y,.9*k);put(TL.hardTop,x,y,.9*k);}else put(TL.hardBody,x,y,.9*k);}
    else if((t===SHIP||t===DECK)&&G.ship){const sk=TL['ship_'+(x-G.ship.x)+'_'+(y-G.ship.y)];if(sk)put(sk,x,y,k);}
    if(t===MOUNT&&G.ore&&G.ore[i]&&!oreSol(G.ore[i]))put(oreTile(G.ore[i],false),x,y,k);
    else if(t===LIQ){ctx.globalAlpha=.24*k;ctx.fillStyle=PAL['e'];ctx.fillRect((x-camX)*S,(y-camY)*S,S,S);put((liqFrame+(h%2))%2?TL.liq1:TL.liq0,x,y,.9*k);}
    else if(t===DEEP){ctx.globalAlpha=k;ctx.fillStyle='#01060c';ctx.fillRect((x-camX)*S,(y-camY)*S,S,S);ctx.globalAlpha=.08*k;ctx.fillStyle=PAL['e'];ctx.fillRect((x-camX)*S,(y-camY)*S,S,S);put((liqFrame+(h%2))%2?TL.deep1:TL.deep0,x,y,.4*k);}
    else if(t===CHASM){ctx.globalAlpha=1;ctx.fillStyle='#000';ctx.fillRect((x-camX)*S,(y-camY)*S,S,S);if(CHASM_OV){ctx.globalAlpha=k;ctx.drawImage(CHASM_OV,x*16,y*16,16,16,(x-camX)*S,(y-camY)*S,S,S);}}
    else if(t===RUBBLE)put(TL.rubble,x,y,.65*k);
    // herbes assombries de moitié le 15 novembre 2026 (elles ressortaient trop) : même teinte, luminosité divisée par deux
    else if(t===GRASS)put(TL.grass0,x,y,.45*k);
    else if(t===FLAT)put(TL.flat0,x,y,.38*k);
    const dm=G.dmg&&G.dmg[i];if(dm&&(t===ROCK||t===MOUNT))put(TL.crackH,x,y,.95*k);
  }
  if(G.tracks)for(const k in G.tracks){const tr=G.tracks[k],age=G.turn-tr.t;if(age>=TRACK_LIFE){delete G.tracks[k];continue;}
    const i=+k;if(tr.i==null||(fog&&!vis[i]))continue;put(TL[`tk${tr.i}${tr.o}${Math.max(0,age)}`],i%W,(i/W)|0,.6);}
  if(G.ore)for(const k in G.ore){if(!oreSol(G.ore[k]))continue;const i=+k;if(fog&&!G.seen[i])continue;put(oreTile(G.ore[k],true),i%W,(i/W)|0,fog&&!vis[i]?.35:1);}
  {const sr=sonarR();if(sr>0&&G.ore&&fog)for(const k in G.ore){const i=+k;if(G.seen[i]||!sonarVu(i,sr))continue;put(oreTile(G.ore[k],oreSol(G.ore[k])),i%W,(i/W)|0,1);}}   // gisements détectés par le sonar, même hors de vue
  if(G.cles)for(const k in G.cles){const i=+k;if(fog&&!G.seen[i])continue;put(TL.cle,i%W,(i/W)|0,fog&&!vis[i]?.35:1);}   // clés au sol
  if(G.items)for(const k in G.items){const i=+k;if(fog&&!G.seen[i])continue;put(TL.objet,i%W,(i/W)|0,fog&&!vis[i]?.35:1);}   // objets posés au sol
  if(G.splat)for(const [px,py,c,sz] of G.splat){const i=idx(Math.floor(px/S),Math.floor(py/S));if(fog&&!G.seen[i])continue;   // débris au sol
    ctx.globalAlpha=fog&&!vis[i]?.3:1;ctx.fillStyle=c;ctx.fillRect(px-camX*S,py-camY*S,sz,sz);}
  ctx.globalAlpha=1;
  // (les taches de sang ne sont plus dessinées depuis le 19 novembre 2026 : les ennemis laissent des débris)
  for(const s of G.sites){if(fog&&!G.seen[idx(s.x,s.y)])continue;put(s.known?(TL['site'+s.depth]||TL.site10):TL.siteUnknown,s.x,s.y,!fog||vis[idx(s.x,s.y)]?1:.35);}
  // touche V : portée de discrétion de la foreuse — les cases d'où un ennemi peut vous remarquer, entourées d'un pointillé
  if(SHOWVIS&&!G.over){
    const r=G.stealth||STEALTH_BASE,cells=new Set();
    for(let y=Math.max(0,G.py-r);y<=Math.min(H-1,G.py+r);y++)for(let x=Math.max(0,G.px-r);x<=Math.min(W-1,G.px+r);x++){
      const i=idx(x,y);if(Math.hypot(x-G.px,y-G.py)>r)continue;if(lastAct==='dig'||los(G.px,G.py,x,y))cells.add(i);}
    drawVisCells(cells,'#ffffff');}
  drawPath();
  // barre de vie au-dessus d'une créature blessée (insectoïdes compris depuis le 16 novembre 2026 : ils en étaient privés)
  const barreVie=(px,py,hp,pv)=>{if(hp>=pv)return;const w=S-6;ctx.fillStyle='#000';ctx.fillRect(px+3,py-4,w,3);ctx.fillStyle='#ff3b3b';ctx.fillRect(px+3,py-4,Math.round(w*Math.max(0,hp)/pv),3);};
  if(G.animals)for(const a of G.animals)if(!fog||vis[idx(a.x,a.y)]){const [lx,ly]=lungeOff(f=>f.kind==='lunge'&&f.beast===a);
    const px=(a.x-camX)*S+lx,py=(a.y-camY)*S+ly;ctx.globalAlpha=1;ctx.drawImage(TL['an'+a.sp+(a.dir<0?'l':'r')],px,py,S,S);
    const sp=SPECIES[a.sp];barreVie(px,py,a.hp??pvDe(sp),pvDe(sp));}
  if(G.beasts)for(const b of G.beasts){if(!beastVisible(b)||beastCache(b))continue;const [lx,ly]=lungeOff(f=>f.kind==='lunge'&&f.beast===b);
    const px=(b.x-camX)*S+lx,py=(b.y-camY)*S+ly,img=b.fuse>0&&Math.floor(performance.now()/130)%2?TL.mineA:TL['bz'+b.sp+(b.dir<0?'l':'r')];   // mine armée : elle clignote
    ctx.globalAlpha=1;ctx.drawImage(img,px,py,S,S);
    const fl=FX.find(f=>f.kind==='flash'&&f.beast===b);if(fl){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=1-fxP(fl);ctx.drawImage(img,px,py,S,S);ctx.drawImage(img,px,py,S,S);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;}
    barreVie(px,py,b.hp,pvDe(BEASTS[b.sp]));}
  // nuage d'un fumigène : les tuiles de nuage par-dessus le terrain et les créatures, sous la foreuse ; elles pâlissent en se dissipant
  // la fumée se voit même là où elle coupe la vue : sinon on ne verrait que les neuf cases autour de la foreuse
  if(G.fum)for(const k in G.fum){const i=+k;if(fog&&!vis[i]&&!G.seen[i])continue;const c=G.fum[k],t=TL['nuage'+c.k];
    if(t)put(t,i%W,(i/W)|0,Math.min(1,c.v/4)*(c.k<2?.72:.5)*(vis[i]?1:.55));}
  // zone visée d'une charge sismique : carré de 3 × 3 en « Bord croisé » rouge
  if(VISEE){const t=viseeTuile();ctx.globalAlpha=1;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const zx=VISEE.x+dx,zy=VISEE.y+dy;
      if(zx<0||zy<0||zx>=W||zy>=H)continue;ctx.drawImage(t,(zx-camX)*S,(zy-camY)*S,S,S);}}
  const wreck=BOOM||(G.over&&G.over.dead);   // foreuse détruite : plus dessinée
  if(!wreck){const [lx,ly]=lungeOff(f=>f.kind==='lunge'&&f.robot);ctx.globalAlpha=1;ctx.drawImage(TL['robot_'+(G.face||'u')],(G.px-camX)*S+lx,(G.py-camY)*S+ly,S,S);}
  const ht=G.t[idx(G.px,G.py)];if(wreck){}else if(ht===LIQ)put(TL.wade,G.px,G.py,.95);else if(ht===DEEP)put(TL.wadeDeep,G.px,G.py,.95);
  for(const f of FX){if(f.kind!=='num')continue;const p=fxP(f),rise=reduced?0:p*14;
    ctx.globalAlpha=p<.6?1:1-(p-.6)/.4;ctx.font='bold 14px "JetBrains Mono", ui-monospace, monospace';ctx.textAlign='center';ctx.textBaseline='bottom';
    const tx=(f.x-camX)*S+S/2,ty=(f.y-camY)*S-2-rise-(f.stack||0)*14;ctx.fillStyle='#000';ctx.fillText(f.txt,tx+1,ty+1);ctx.fillStyle=f.col;ctx.fillText(f.txt,tx,ty);}
  ctx.globalAlpha=1;
  // Consommables : + rouges (réparobots) et flèches bio (batterie) qui montent, filet pulsé autour de la foreuse (purge).
  // Pixel art strict : taille fixe, opaques, calés sur la grille des pixels de tuile ; chaque grain apparaît à son heure et s'efface d'un coup.
  {const u=S/16;
   for(const f of FX){if(f.kind!=='soin'&&f.kind!=='ener')continue;const p=fxP(f),bx=(f.x-camX)*16,by=(f.y-camY)*16;
     ctx.fillStyle=f.kind==='soin'?'#ff3b3b':PAL['2'];
     const bas=f.kind==='ener'?7:0,mont=f.kind==='ener'?24:13;   // les flèches partent plus bas et montent plus haut : sinon elles se perdent dans la foreuse, de la même couleur
     for(const g of f.gr){const q=(p-g.d)*2.2;if(q<0||q>1)continue;const gx=Math.round(bx+g.x),gy=Math.round(by+g.y+bas-q*mont);
       if(f.kind==='soin'){ctx.fillRect(gx*u,(gy+1)*u,3*u,u);ctx.fillRect((gx+1)*u,gy*u,u,3*u);}           // une petite croix
       else{ctx.fillRect((gx+1)*u,gy*u,u,4*u);ctx.fillRect(gx*u,(gy+1)*u,u,u);ctx.fillRect((gx+2)*u,(gy+1)*u,u,u);}}}   // une flèche vers le haut
}
  // Dessins au pixel de tuile (u = 1/16 de case), calés sur la grille, opaques : le projectile d'un tireur et l'onde du sonar
  {const u=S/16;ctx.fillStyle=PAL['1'];
   /* Laser des sentinelles : un trait rouge d'un pixel de tuile, avec quelques étincelles blanches ou accent qui sautent le
      long du trait (tirage renouvelé 12 fois par seconde). Pixels pleins, sans transparence. */
   {const laser=(ax,ay,bx,by,graine,etinc)=>{let x0=Math.round(ax),y0=Math.round(ay);const x1=Math.round(bx),y1=Math.round(by);
       const dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1,pts=[];let e=dx+dy;
       for(let n=0;n<600;n++){pts.push([x0,y0]);if(x0===x1&&y0===y1)break;const e2=2*e;if(e2>=dy){e+=dy;x0+=sx;}if(e2<=dx){e+=dx;y0+=sy;}}
       ctx.fillStyle='#ff3b3b';for(const [x,y] of pts)ctx.fillRect(x*u,y*u,u,u);
       if(!reduced&&etinc){const T=Math.floor(performance.now()/85),h=n=>{const v=Math.sin(n*12.9898+T*78.233+graine)*43758.5453;return v-Math.floor(v);};
         for(let k=0;k<etinc;k++){const [x,y]=pts[Math.floor(h(k)*pts.length)],ox=Math.round(h(k+10)*4-2),oy=Math.round(h(k+20)*4-2);
           ctx.fillStyle=h(k+30)<.5?'#fff':PAL['1'];ctx.fillRect((x+ox)*u,(y+oy)*u,u,u);if(h(k+40)<.4)ctx.fillRect((x+ox+(h(k+50)<.5?1:-1))*u,(y+oy)*u,u,u);}}
       ctx.fillStyle=PAL['1'];},cx=o=>(o.x+.5-camX)*16,cy=o=>(o.y+.5-camY)*16;
     // laser d'une sentinelle : le trait part d'elle ; touché, il finit sur la foreuse, raté, à côté. Il crépite puis s'éteint d'un coup.
     for(const f of FX)if(f.kind==='laser'&&G.beasts.includes(f.o)&&fxP(f)<.75)laser(cx(f.o),cy(f.o),(f.x+.5-camX)*16+f.ox,(f.y+.5-camY)*16+f.oy,f.ox*5.3+f.oy+f.t0,4);}
   // Explosion (mine, charge sismique) : le carré de 3 × 3 en pavés fins de 2 pixels de tuile — blanc plein, puis damier accent, puis braises monde éparses
   for(const f of FX)if(f.kind==='boom'){const p=fxP(f),ph=p<.2?0:p<.6?1:2,t=Math.floor(p*16);ctx.fillStyle=ph===0?'#fff':ph===1?PAL['1']:PAL['3'];
     for(let cy=-1;cy<=1;cy++)for(let cx=-1;cx<=1;cx++){const bx=Math.round((f.x+cx-camX)*16),by=Math.round((f.y+cy-camY)*16);
       for(let gy=0;gy<8;gy++)for(let gx=0;gx<8;gx++){
         if(ph===1&&((gx+gy+t)&1))continue;
         if(ph===2&&((gx*7+gy*13+cx*5+cy*3+t*3)%7)>(p<.8?1:0))continue;
         ctx.fillRect((bx+gx*2)*u,(by+gy*2)*u,2*u,2*u);}}
     ctx.fillStyle=PAL['1'];}
   // « ! » d'un ennemi qui repère la foreuse : un trait d'un pixel de tuile, blanc cerné de noir, au-dessus de lui ; il monte de 2 pixels puis s'éteint d'un coup (affiné le 16 novembre 2026)
   for(const f of FX)if(f.kind==='alerte'&&(G.beasts.includes(f.o)||G.animals.includes(f.o))&&vis[idx(f.o.x,f.o.y)]){const p=fxP(f),px=Math.round((f.o.x-camX)*16)+7,py=Math.round((f.o.y-camY)*16)-10-(reduced?2:Math.min(2,Math.floor(p*12)));
     ctx.fillStyle='#000';ctx.fillRect((px-1)*u,(py-1)*u,3*u,9*u);ctx.fillStyle='#fff';ctx.fillRect(px*u,py*u,u,5*u);ctx.fillRect(px*u,(py+6)*u,u,u);ctx.fillStyle=PAL['1'];}
   for(const f of FX)if(f.kind==='sonar'){const R=fxP(f)*f.r*16,cx=Math.round((f.x+.5-camX)*16),cy=Math.round((f.y+.5-camY)*16),w=Math.ceil(vw/u),h=Math.ceil(vh/u),q=R*Math.SQRT1_2;
     const dot=(px,py)=>{if(px>=0&&py>=0&&px<w&&py<h)ctx.fillRect(px*u,py*u,u,u);};
     for(let d=-Math.ceil(q);d<=Math.ceil(q);d++){const e=Math.round(Math.sqrt(Math.max(0,R*R-d*d)));dot(cx+d,cy-e);dot(cx+d,cy+e);dot(cx-e,cy+d);dot(cx+e,cy+d);}}}
  if(BOOM)drawBoom();
  ctx.restore();
  smokeKick();
  if(HOV&&CURT&&!busy()){const ok=(x,y)=>{const i=idx(x,y);return (!fog||G.seen[i])&&(getPath()||Math.max(Math.abs(x-G.px),Math.abs(y-G.py))<=1);};
    ctx.globalAlpha=1;ctx.drawImage(ok(HOV.x,HOV.y)?CURT:CURT_DIM,(HOV.x-camX)*S,(HOV.y-camY)*S,S,S);}
  ctx.globalAlpha=1;side();mini();
}
const mv=$('mini'),mctx=mv.getContext('2d');
