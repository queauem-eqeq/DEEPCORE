/* ---------- Cinématique de forage (21 novembre 2026, environ 15 s) ----------
   Pour le passage au niveau suivant. Vue de côté, tout en caractères ASCII (comme les dessins d'équipement).
   La roche n'est pas en bandes horizontales : c'est un champ en deux dimensions, des lentilles de matières
   entremêlées (bruit allongé à l'horizontale), avec des masses de roche dure semées dedans.
   Devant une masse trop dure, la foreuse pivote d'elle-même et prend un angle pour la contourner ; le joueur
   l'aide avec les flèches gauche et droite (ou en maintenant le doigt d'un côté de l'écran). Le puits garde la
   trace du chemin, et la foreuse épouse cette courbe.
   playForage(suite, niv) lance la scène et appelle suite() à la fin ; F9 la lance pour l'essayer.
   Niveau 1 : terre, argile, roche, quelques masses dures. Les filons, cristaux et basalte sont pour plus bas. */
const FG_ART=[
  "   ▄▄▄▄▄   ",
  "  ▐█▀▀▀█▌  ",
  " ╔╧═════╧╗ ",
  " ║ ◉ ▒▒▒ ║ ",
  "╔╣═══════╠╗",
  "║║░░░░░░░║║",
  "╚╣▒▒▒▒▒▒▒╠╝",
  " ╚╗▓▓▓▓▓╔╝ ",
  "  ╲▓▓▓▓▓╱  ",
  "  ╲▓▓▓▓▓╱  ",
  "   ╲▓▓▓╱   ",
  "   ╲▓▓▓╱   ",
  "    ╲▓╱    ",
  "    ╲▓╱    ",
  "     ▼     "];
const FG_MSK=[   // d gris sombre · g gris · w blanc · a accent (couleur 1) · b couleur 2 · o ambre
  "ddddddddddd","ggggggggggg","ggggggggggg","gggogaaaggg","ggggggggggg","ggaaaaaaagg","ggaaaaaaagg",
  "gggwwwwwggg","gggwwwwwggg","gggwwwwwggg","ggggwwwgggg","ggggwwwgggg","gggggwggggg","gggggwggggg","ooooooooooo"];
// Les matières. d dureté (temps de forage) · ch caractères · dn densité (part de cases occupées) · k [couleur de palette, luminosité]
const FG_MAT=[
  {n:'TERRE MEUBLE',d:.5,ch:"·.,'`",dn:.55,k:['3',.5]},
  {n:'ARGILE',d:.85,ch:"∙:;·°",dn:.82,k:['3',.42]},
  {n:'ROCHE',d:1.3,ch:"░▒░",dn:.95,k:['g',.52]},
  {n:'ROCHE DURE',d:3.4,ch:"▓█▓",dn:1,k:['2',.6]},
  {n:'FILON',d:1.6,ch:"▒░▒",dn:.95,k:['g',.52],ore:.12,oreCh:'◆'},
  {n:'BASALTE',d:4.2,ch:"█▓█",dn:1,k:['g',.24]},
  {n:'CRISTAUX',d:2.4,ch:"▒╬▓",dn:.95,k:['3',.8],ore:.09,oreCh:'◇'},
  {n:'NOYAU DENSE',d:5,ch:"█▓█",dn:1,k:['1',.45]}];
/* Un profil par niveau. b : la matière de fond selon la profondeur relative (perturbée par un bruit, donc les
   limites ondulent beaucoup) · dur : la matière des masses dures semées dedans · seuil(p) : au-delà de quoi le
   bruit donne une masse dure (plus bas = plus de dur) · des : profondeur où les masses commencent ·
   mel(m,n) : l'entremêlement, deux matières de fond qui s'interpénètrent en lentilles. */
const FG_NIV=[
  {D0:150,b:[[0,0],[.05,1],[.17,2]],dur:3,seuil:p=>.76-.07*p,des:.15,mel:(m,n)=>m===2&&n>.70?1:m===1&&n<.30?2:m},
  {D0:170,b:[[0,2],[.22,4],[.5,2]],dur:5,seuil:p=>.62-.08*p,des:.05,mel:(m,n)=>m===2&&n>.68?4:m},
  {D0:190,b:[[0,5],[.3,6],[.62,5],[.84,7]],dur:7,seuil:p=>.64-.12*p,des:.05,mel:(m,n)=>m===5&&n>.72?6:m}];
const FG_T0=2.4,FG_CAV=34,FG_R=6,FG_FONT='"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace';
const FG_SMOKE=['#c4cdd0','#9aa5a9','#737f84','#4d585d','#2e373b'];
let FORAGE=null,FG_CB=null;
const fgCv=$('forageCv'),fgx=fgCv.getContext('2d');
function fgMix(hex,k){const m=/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex)||['','b5','c2','c6'],v=i=>Math.max(0,Math.min(255,Math.round(parseInt(m[i],16)*k)));return `rgb(${v(1)},${v(2)},${v(3)})`;}
function fgH(F,x,y,k){let h=(x*374761393+y*668265263+(k||0)*1442695041+F.seed)|0;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return (h>>>0)/4294967296;}
// bruit de valeur lissé, étiré à l'horizontale : des lentilles larges et plates, comme des strates remuées
function fgNz(F,x,y,sx,sy,k){const px=x*sx,py=y*sy,x0=Math.floor(px),y0=Math.floor(py),fx=px-x0,fy=py-y0,
  u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),a=fgH(F,x0,y0,k),b=fgH(F,x0+1,y0,k),c=fgH(F,x0,y0+1,k),d=fgH(F,x0+1,y0+1,k),
  s=a+(b-a)*u;return s+((c+(d-c)*u)-s)*v;}
const fgNz2=(F,x,y,sx,sy,k)=>fgNz(F,x,y,sx,sy,k)*.68+fgNz(F,x,y,sx*2.7,sy*2.3,k+31)*.32;
// la matière en (x, y) : fond par profondeur perturbée, lentilles d'entremêlement, puis masses dures
function fgMat(F,x,y){const P=F.P;
  const p=y/P.D0+(fgNz2(F,x,y,.045,.12,1)-.5)*.085;
  let m=P.b[0][1];for(const e of P.b)if(p>=e[0])m=e[1];
  m=P.mel(m,fgNz2(F,x,y,.055,.3,7));
  if(p>P.des&&fgNz2(F,x,y,.115,.3,13)>P.seuil(p))m=P.dur;
  return m;}
const fgDur=(F,x,y)=>FG_MAT[fgMat(F,Math.round(x),Math.round(y))].d;
// dureté moyenne d'une plaque, pour sonder ce qui vient
function fgSonde(F,x,y){let s=0;for(let j=0;j<3;j++)for(let i=-2;i<=2;i+=2)s+=fgDur(F,x+i,y+j*2);return s/9;}
function fgStart(){const F=FORAGE,pal=k=>(PAL&&PAL[k])||'#b5c2c6',base={'1':pal('1'),'2':pal('2'),'3':pal('3'),g:'#b5c2c6'};
  F.mc=FG_MAT.map(M=>[fgMix(base[M.k[0]],M.k[1]*.74),fgMix(base[M.k[0]],M.k[1]),fgMix(base[M.k[0]],Math.min(1.3,M.k[1]*1.25))]);
  F.D0=F.P.D0;F.fl=F.D0+FG_CAV;F.oreCol=fgMix(base['1'],1.35);F.cDim=fgMix('#b5c2c6',.26);F.cRock=fgMix('#b5c2c6',.24);F.cRock2=fgMix('#b5c2c6',.42);
  F.pal={a:fgMix(base['1'],1.15),b:fgMix(base['2'],1.1),d:'#6b7a80',g:'#a9b6ba',w:'#f2f7f8',o:'#ffb347'};
  F.tr=new Float32Array(F.D0+4).fill(NaN);F.tr[0]=F.cx;}
// le centre du puits à la ligne y (interpolé), ou la position actuelle si rien n'est encore creusé
function fgTrace(F,y){if(y<=0)return F.tr[0];if(y>=F.d)return F.cx;const i=Math.floor(y),a=F.tr[Math.min(i,F.D0)],b=F.tr[Math.min(i+1,F.D0)];
  if(isNaN(a))return F.cx;return isNaN(b)?a:a+(b-a)*(y-i);}
const fgCreuse=(F,y)=>{const i=Math.max(0,Math.min(F.D0,Math.round(y)));if(isNaN(F.tr[i]))F.tr[i]=F.cx;};
// une case du monde : renvoie vrai et remplit F.oc (caractère) et F.ok (couleur), ou faux si elle est vide
function fgCell(F,x,y){
  if(y<0){if(fgH(F,x,y,3)<.008){F.oc='·';F.ok=F.cDim;return true;}return false;}
  if(y>=F.D0&&y<F.fl){const c0=fgTrace(F,F.D0-1);
    if(Math.abs(x-c0)>FG_R+2){const len=Math.floor(fgH(F,x,0,8)*5),k=y-F.D0;
      if(fgH(F,x,0,9)<.6&&k<len){F.oc=k===len-1?'▼':'▓';F.ok=F.cRock2;return true;}}
    if(fgH(F,x,y,10)<.012){F.oc='·';F.ok=F.cDim;return true;}return false;}
  if(y>=F.fl){const k=y-F.fl;F.oc=k===0?(fgH(F,x,y,11)<.5?'▓':'█'):['█','▓','█','▒'][Math.floor(fgH(F,x,y,12)*4)];F.ok=k===0?F.cRock2:F.cRock;return true;}
  if(y<2){if(fgH(F,x,y,14)>.85)return false;F.oc=y?'▒':['"',';',"'",'^'][Math.floor(fgH(F,x,y,15)*4)];F.ok=F.mc[0][2];return true;}
  const c=F.tr[Math.min(F.D0,y)];if(!isNaN(c)&&Math.abs(x-c)<=FG_R-(fgH(F,x,y,5)<.3?1:0))return false;
  const mi=fgMat(F,x,y),M=FG_MAT[mi];
  if(fgH(F,x,y,2)>M.dn)return false;
  F.oc=M.ch[Math.floor(fgH(F,x,y,4)*M.ch.length)];
  F.ok=F.mc[mi][fgMat(F,x,y-1)!==mi?2:Math.floor(fgH(F,x,y,6)*3)];
  if(M.ore&&fgH(F,x,y,16)<M.ore){F.oc=M.oreCh;F.ok=(Math.floor(F.t*4+fgH(F,x,y,17)*5)%5===0)?'#fff':F.oreCol;}
  return true;}
function fgEmit(F,o){if(F.pt.length<420)F.pt.push(Object.assign({age:0,g:0,drag:0,sd:(Math.random()*999)|0},o));}
const fgRnd=(a,b)=>a+Math.random()*(b-a);
function fgSmoke(F,x,y,vx,vy,life,r0,gr){fgEmit(F,{type:'sm',x,y,vx,vy,life,r0,gr,drag:.6});}
const fgIci=F=>fgMat(F,Math.round(F.cx),Math.max(0,Math.min(F.D0-1,Math.round(F.d))));
function fgChips(F,n,x,y,spread,up,g,mi,col){const k=mi==null?fgIci(F):mi,M=FG_MAT[k];
  for(let i=0;i<n;i++)fgEmit(F,{type:'ch',x:x+fgRnd(-spread,spread)*.5,y:y+fgRnd(-1,1),vx:fgRnd(-spread,spread),vy:up<0?fgRnd(up,up*.35):fgRnd(up*.2,up),g,life:fgRnd(.7,1.5),
    ch:M.ch[(Math.random()*M.ch.length)|0],col:col||F.mc[k][(Math.random()*3)|0]});}
function fgSparks(F,n,x,y,s){for(let i=0;i<n;i++)fgEmit(F,{type:'ch',x:x+fgRnd(-3,3),y,vx:fgRnd(-s,s),vy:-fgRnd(5,15),g:22,life:fgRnd(.25,.6),ch:'*+·'[(Math.random()*3)|0],col:Math.random()<.5?'#ffe9a8':'#ffffff'});}
/* ---- son : synthèse Web Audio (moteur, grincement, grondement) ---- */
function fgSound(){const a=audio();if(!a)return null;
  const buf=a.createBuffer(1,a.sampleRate*2,a.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  const out=a.createGain();out.gain.value=0;out.connect(MASTER);
  const nz=()=>{const s=a.createBufferSource();s.buffer=buf;s.loop=true;s.start();return s;};
  const r=nz(),rf=a.createBiquadFilter(),rg=a.createGain();rf.type='lowpass';rf.frequency.value=120;rg.gain.value=0;r.connect(rf);rf.connect(rg);rg.connect(out);
  const g=nz(),gf=a.createBiquadFilter(),gg=a.createGain(),lfo=a.createOscillator(),lg=a.createGain();gf.type='bandpass';gf.frequency.value=900;gf.Q.value=1.4;gg.gain.value=0;
  lfo.frequency.value=17;lg.gain.value=0;lfo.connect(lg);lg.connect(gg.gain);lfo.start();g.connect(gf);gf.connect(gg);gg.connect(out);
  const m=a.createOscillator(),mf=a.createBiquadFilter(),mg=a.createGain();m.type='sawtooth';m.frequency.value=40;mf.type='lowpass';mf.frequency.value=260;mg.gain.value=0;
  m.connect(mf);mf.connect(mg);mg.connect(out);m.start();
  const set=(p,v,k)=>p.setTargetAtTime(v,a.currentTime,k||.08);
  return {update(o){set(out.gain,o.vol);set(rg.gain,o.rum);set(rf.frequency,o.rumF);set(gg.gain,o.grind*.5);set(lg.gain,o.grind*.5);set(gf.frequency,o.grindF);set(lfo.frequency,o.rot);set(mg.gain,o.mot);set(m.frequency,o.motF);},
    stop(){set(out.gain,0,.15);setTimeout(()=>{try{r.stop();g.stop();m.stop();lfo.stop();}catch(e){}},700);}};}
function fgBoom(F,k){
  if(k==='start'){tone(55,1.6,'sawtooth',.16,140);noiz(1.4,.12,300,'lowpass',0,900);}
  else if(k==='strate'){noiz(.25,.2,900,'bandpass');tone(300,.12,'square',.04,150);}
  else if(k==='roc'){noiz(.07,.16,400+Math.random()*700);}
  else if(k==='perce'){noiz(1.4,.45,1200,'lowpass',0,80);tone(110,.9,'sawtooth',.2,30);}
  else if(k==='impact'){noiz(1.8,.6,700,'lowpass',0,50);tone(75,.7,'sine',.5,25);tone(180,.35,'triangle',.12,90,.05);for(let i=0;i<7;i++)noiz(.05,.09,3000,'highpass',.3+Math.random()*1.2);}
  else if(k==='petit'){noiz(.5,.25,500,'lowpass',0,60);tone(95,.3,'sine',.25,40);}}
function playForage(suite,niv){
  if(reduced||FORAGE){suite&&suite();return;}
  unlock();if(typeof TRAV!=='undefined'&&TRAV)stopTravel();
  const dpr=Math.min(devicePixelRatio||1,2),w=Math.round(innerWidth*dpr),h=Math.round(innerHeight*dpr),size=Math.max(12,Math.round(h/36)),chh=size,cw=Math.round(size*.6);
  fgCv.width=w;fgCv.height=h;
  FORAGE={x:fgx,w,h,dpr,cw,chh,font:`${size}px ${FG_FONT}`,R:Math.ceil(h/chh)+1,C:Math.ceil(w/cw)+3,
    P:FG_NIV[Math.max(0,Math.min(FG_NIV.length-1,(niv||1)-1))],niv:niv||1,
    seed:(Math.random()*1e9)|0,atl:{},pt:[],t0:performance.now(),last:performance.now(),t:0,ph:0,d:0,cx:0,vx:0,sl:0,hs:0,evit:0,
    camX:0,camY:0,imp:0,flash:0,matPrev:-1,kl:0,kr:0,man:0,bend:1,snd:fgSound(),acc:{ex:0,dust:0,chip:0,spark:0,roc:0},vy:0};
  fgStart();FG_CB=suite||null;
  FORAGE.camY=-FORAGE.R*.62;
  fgCv.hidden=false;$('forageSkip').hidden=false;fgBoom(FORAGE,'start');
  requestAnimationFrame(forageFrame);}
function skipForage(){const F=FORAGE;if(!F||F.ph>=4)return;F.ph=4;F.tFade=F.t;F.fadeLen=.35;}
function endForage(){const F=FORAGE;if(F&&F.snd)F.snd.stop();FORAGE=null;fgCv.hidden=true;$('forageSkip').hidden=true;const cb=FG_CB;FG_CB=null;try{render();}catch(e){}if(cb)cb();}
addEventListener('keydown',e=>{if(!FORAGE)return;if(e.key==='ArrowLeft')FORAGE.kl=1;else if(e.key==='ArrowRight')FORAGE.kr=1;});
addEventListener('keyup',e=>{if(!FORAGE)return;if(e.key==='ArrowLeft')FORAGE.kl=0;else if(e.key==='ArrowRight')FORAGE.kr=0;});
// au doigt ou à la souris : maintenir d'un côté de la foreuse pour la tirer de ce côté
function fgPointer(e,on){const F=FORAGE;if(!F)return;unlock();if(!on){F.kl=F.kr=0;return;}
  const s=(e.clientX*F.dpr-F.w/2)/F.cw+F.camX;F.kl=s<F.cx-1?1:0;F.kr=s>F.cx+1?1:0;}
fgCv.addEventListener('pointerdown',e=>fgPointer(e,true));
fgCv.addEventListener('pointermove',e=>{if(e.buttons)fgPointer(e,true);});
fgCv.addEventListener('pointerup',e=>fgPointer(e,false));
fgCv.addEventListener('pointercancel',e=>fgPointer(e,false));
function forageFrame(now){const F=FORAGE;if(!F)return;
  const t=(now-F.t0)/1000,dt=Math.min(.05,Math.max(.001,(now-F.last)/1000));F.last=now;F.t=t;
  const dPrev=F.d;
  if(F.ph===0&&t>=FG_T0){F.ph=1;F.tD=t;}
  if(F.ph===1){F.te=t-F.tD;
    const dur=fgDur(F,F.cx,F.d+1),pousse=1+Math.max(0,F.te-6)*.14,mont=Math.min(1,F.te/.9);
    F.vy=16*pousse*mont/Math.max(.5,dur*.85);F.d+=F.vy*dt;
    // pivoter : sonder devant, à gauche et à droite, et glisser vers le plus tendre ; le joueur appuie dans le même sens ou contre
    const look=9,dc=fgSonde(F,F.cx,F.d+look),dl=fgSonde(F,F.cx-9,F.d+look),dr=fgSonde(F,F.cx+9,F.d+look);
    F.evit=dc;
    if(dc>1.5)F.vx+=(dl<dr?-1:1)*Math.min(3,dc-1.5)*22*dt;
    F.man+=((F.kr-F.kl)-F.man)*Math.min(1,dt*8);F.vx+=F.man*26*dt;
    F.vx*=Math.exp(-dt*2.4);F.vx=Math.max(-15,Math.min(15,F.vx));F.cx+=F.vx*dt;
    for(let y=Math.floor(dPrev);y<=Math.floor(F.d);y++)fgCreuse(F,y);
    if(F.d>=F.D0){F.d=F.D0;F.ph=2;F.tF=t;F.vy=Math.max(7,(F.d-dPrev)/dt);F.vx*=.3;fgBoom(F,'perce');F.flash=.35;F.imp=.5;
      fgChips(F,70,F.cx,F.D0+1,9,4,34);for(let i=0;i<14;i++)fgSmoke(F,F.cx+fgRnd(-5,5),F.D0+fgRnd(0,3),fgRnd(-6,6),fgRnd(-1,5),fgRnd(2,3.4),1.4,3);}}
  else if(F.ph===2){F.vy+=55*dt;F.d+=F.vy*dt;F.cx+=F.vx*dt;F.vx*=Math.exp(-dt*3);F.bend+=(0-F.bend)*Math.min(1,dt*4);
    if(F.d>=F.fl){F.d=F.fl;if(!F.bounced){F.bounced=1;F.imp=1;F.flash=.55;fgBoom(F,'impact');F.vy=-F.vy*.2;
        fgChips(F,90,F.cx,F.fl-1,16,-17,32,2,F.cRock2);fgSparks(F,36,F.cx,F.fl-2,18);
        for(let i=0;i<46;i++){const sd=i%2?1:-1;fgSmoke(F,F.cx+sd*fgRnd(1,6),F.fl-fgRnd(.5,2),sd*fgRnd(3,18),-fgRnd(.3,3),fgRnd(2,3.8),1,2.8);}}
      else{F.ph=3;F.tL=t;F.vy=0;F.imp=Math.max(F.imp,.35);fgBoom(F,'petit');fgChips(F,26,F.cx,F.fl-1,9,-9,28,2,F.cRock2);}}}
  else if(F.ph===3&&t>=F.tL+1.3){F.ph=4;F.tFade=t;F.fadeLen=.75;}
  const mi=fgIci(F),M=FG_MAT[mi],hT=F.ph===1?Math.min(1,(M.d-.5)/3):0;
  F.hs+=(hT-F.hs)*Math.min(1,dt*5);
  F.sl+=((F.ph===1?Math.max(-.3,Math.min(.3,F.vx/22)):0)-F.sl)*Math.min(1,dt*6);
  if(F.ph===1&&mi!==F.matPrev){if(F.matPrev>=0)fgBoom(F,'strate');F.matPrev=mi;}
  F.imp*=Math.exp(-dt*(F.ph>=3?2.6:3.4));F.flash=Math.max(0,F.flash-dt*1.6);
  const ptop=F.d-15,ex=F.ph<=1?(F.ph===0?6+24*Math.min(1,t/FG_T0):24):F.ph===2?22:8;
  F.acc.ex+=ex*dt;while(F.acc.ex>=1){F.acc.ex--;fgSmoke(F,F.cx+(Math.random()<.5?-2:2)-F.sl*13+fgRnd(-.5,.5),ptop-.5,fgRnd(-1.4,1.4),-fgRnd(3,7),fgRnd(1.8,2.8),.7,1.5);}
  if(F.ph===0&&t>.9){F.acc.dust+=(8+18*Math.min(1,(t-.9)/1.5))*dt;while(F.acc.dust>=1){F.acc.dust--;const sd=Math.random()<.5?-1:1;fgSmoke(F,F.cx+sd*fgRnd(1,6),-fgRnd(.2,1.5),sd*fgRnd(3,8),-fgRnd(.3,2),fgRnd(1.5,2.4),.6,1.9);}}
  if(F.ph===1){F.acc.chip+=(14+55*F.hs)*dt;while(F.acc.chip>=1){F.acc.chip--;fgChips(F,1,F.cx,F.d-2,13,-11,16);}
    if(F.hs>.5){F.acc.spark+=45*(F.hs-.4)*dt;while(F.acc.spark>=1){F.acc.spark--;fgSparks(F,1,F.cx,F.d-3,14);}}
    F.acc.roc+=5*F.hs*dt;while(F.acc.roc>=1){F.acc.roc--;fgBoom(F,'roc');}}
  for(const p of F.pt){p.age+=dt;p.vy+=p.g*dt;const k=Math.max(0,1-p.drag*dt);p.vx*=k;if(p.type==='sm')p.vy*=k;p.x+=p.vx*dt;p.y+=p.vy*dt;
    if(p.type==='ch'&&F.ph<3&&p.y>2&&p.y<F.D0-1){const c=fgTrace(F,p.y);if(Math.abs(p.x-c)>FG_R){p.x=c+Math.sign(p.x-c)*FG_R;p.vx*=-.5;}}}
  F.pt=F.pt.filter(p=>p.age<p.life);
  const tgt=F.d-(F.ph>=2?.6:.62)*F.R,tg0=-.62*F.R;
  if(F.ph===0)F.camY=tg0;else F.camY+=((F.ph===1?Math.max(tgt,tg0):tgt)-F.camY)*Math.min(1,dt*(F.ph===1?3.4:4.8));
  F.camX+=(F.cx-F.camX)*Math.min(1,dt*2.6);
  if(F.snd){const sp=Math.min(1,F.vy/22),ig=Math.min(1,t/1.6);
    F.snd.update({vol:F.ph===0?.55*ig:F.ph===1?.9:F.ph===2?.5:F.ph===3?.12:0,rum:.18+.5*F.hs+(F.ph===0?.25*ig:0)+F.imp*.5,rumF:90+F.hs*190+F.imp*260,
      grind:F.ph===1?.1+.3*F.hs+.04*sp:F.ph===0?.04*ig:0,grindF:700+F.hs*1700+sp*400,rot:14+sp*10+(F.ph===0?6*ig:0),mot:.05+.05*sp+(F.ph===0?.07*ig:0),motF:36+ig*10+sp*38+F.hs*8});}
  fgDraw(F,t);
  if(F.ph===4&&t>=F.tFade+F.fadeLen){endForage();return;}
  requestAnimationFrame(forageFrame);}
const fgGlyph=(F,ch,col)=>{let A=F.atl[col];if(!A)A=F.atl[col]={};let g=A[ch];
  if(!g){g=document.createElement('canvas');g.width=F.cw;g.height=F.chh;const x=g.getContext('2d');x.font=F.font;x.textAlign='center';x.textBaseline='middle';x.fillStyle=col;x.fillText(ch,F.cw/2,F.chh/2);A[ch]=g;}
  return g;};
const fgPut=(F,xw,yw,ch,col)=>F.x.drawImage(fgGlyph(F,ch,col),Math.round((xw-F.camX)*F.cw+F.w/2),Math.round((yw-F.camY)*F.chh));
function fgDraw(F,t){const x=F.x,{w,h,cw,chh,dpr}=F;
  x.setTransform(1,0,0,1,0,0);x.fillStyle='#000';x.fillRect(0,0,w,h);
  const amp=(F.ph===0?1.4*Math.min(1,t/FG_T0):F.ph===1?1.4+F.hs*4.2:F.ph===2?2.2:.6)*dpr+F.imp*16*dpr;
  x.save();x.translate(Math.round((Math.random()-.5)*2*amp),Math.round((Math.random()-.5)*2*amp));
  const r0=Math.floor(F.camY),c0=Math.floor(F.camX)-((F.C/2)|0);
  for(let r=-1;r<=F.R;r++){const y=r0+r,py=Math.round((y-F.camY)*chh);
    for(let c=0;c<F.C;c++){const xw=c0+c;if(fgCell(F,xw,y))x.drawImage(fgGlyph(F,F.oc,F.ok),Math.round((xw-F.camX)*cw+w/2),py);}}
  // la foreuse épouse la courbe du puits : chaque ligne suit la trace, et le corps penche du côté où elle va
  const top=F.d-15,jx=F.hs>.5?(fgH(F,Math.floor(t*14),7,0)-.5)*2*(F.hs-.3)*1.2:0,fr=Math.floor(t*(F.ph===0?10+Math.min(1,t/FG_T0)*14:F.ph===1?26:F.ph===2?14:2));
  for(let r=0;r<15;r++){const row=FG_ART[r],mk=FG_MSK[r],yw=top+r,
      ctr=F.cx+(fgTrace(F,yw)-F.cx)*F.bend+(r-14)*F.sl*(1-F.bend*.35)+jx;
    for(let c=0;c<11;c++){let ch=row[c];if(ch===' ')continue;let col=F.pal[mk[c]];
      if(r>=7&&r<=13&&ch==='▓'){const ph=(c+r*2+fr)&3;ch=ph<2?'▓':'▒';col=ph<2?F.pal.w:F.pal.g;}
      else if(r===3&&ch==='◉')col=(Math.floor(t*3)&1)||F.ph>=2?F.pal.o:F.pal.b;
      else if(r===14&&F.ph===1)col=(Math.floor(t*20)&1)?'#fff':F.pal.o;
      fgPut(F,Math.round(ctr-5+c),yw,ch,col);}}
  for(const p of F.pt){const a=p.age/p.life;
    if(p.type==='sm'){const rad=p.r0+p.age*p.gr,rx=Math.ceil(rad*1.9),ry=Math.ceil(rad),col=FG_SMOKE[Math.min(4,Math.floor(a*5))],px=Math.round(p.x),py=Math.round(p.y);
      for(let j=-ry;j<=ry;j++)for(let i=-rx;i<=rx;i++){const d=Math.hypot(i/1.9,j)/rad;if(d>1)continue;if(d>.55&&fgH(F,i+px,j+py,p.sd)<.22+a*.4)continue;
        fgPut(F,px+i,py+j,d<.4&&a<.55?'▓':d<.75&&a<.8?'▒':'░',col);}}
    else fgPut(F,Math.round(p.x),Math.round(p.y),p.ch,p.col);}
  x.restore();
  fgHud(F,t);
  if(F.flash>0){x.globalAlpha=Math.min(.7,F.flash);x.fillStyle='#fff';x.fillRect(0,0,w,h);x.globalAlpha=1;}
  if(F.ph===4){x.globalAlpha=Math.min(1,(t-F.tFade)/F.fadeLen);x.fillStyle='#000';x.fillRect(0,0,w,h);x.globalAlpha=1;}}
function fgHud(F,t){const x=F.x,{w,h,dpr}=F,fs=Math.round(12*dpr),lh=Math.round(17*dpr),m=Math.round(20*dpr),fall=F.ph>=2,M=FG_MAT[fgIci(F)];
  x.font=`${fs}px ${FG_FONT}`;x.textAlign='left';x.textBaseline='top';
  const nd=Math.max(0,Math.min(5,Math.round(F.hs*5))),esp=v=>String(v).replace(/\B(?=(\d{3})+$)/g,' '),
    cap=F.sl<-.05?'◄'.repeat(Math.min(3,1+Math.round(-F.sl*8))):F.sl>.05?'►'.repeat(Math.min(3,1+Math.round(F.sl*8))):'▼',
    rpm=F.ph===0?Math.round(400+2600*Math.min(1,t/FG_T0)):fall?Math.max(0,Math.round(3200*(1-(t-F.tF)/2))):Math.round(2300+900*F.hs);
  const L=[['FORAGE ▸ SÉQUENCE DE DESCENTE',F.pal.a],[`NIVEAU     ${F.niv} → ${F.niv+1}`,F.pal.g],[`PROFONDEUR ${esp(Math.round(F.d*8.5))} m`,F.pal.g],
    [`MATIÈRE    ${fall?'CAVERNE':F.ph===0?'SURFACE':M.n}`,F.ph===1&&M.d>2.5?F.pal.o:F.pal.g],
    [`DURETÉ     ${'▮'.repeat(nd)}${'▯'.repeat(5-nd)}`,F.pal.g],[`CAP        ${cap}`,F.pal.g],[`ROTATION   ${esp(rpm)} tr/min`,F.pal.g]];
  if(F.ph===1&&F.evit>1.7&&Math.floor(t*4)%2===0)L.push(['▲ MASSE DURE DEVANT ▸ CONTOURNEMENT',F.pal.o]);
  if(F.ph===2&&Math.floor(t*5)%2===0)L.push(['ALERTE ▸ PERTE DE SUPPORT','#ff5a4a']);
  if(F.ph>=3)L.push(['IMPACT ▸ ARRIVÉE AU NIVEAU SUIVANT',F.pal.o]);
  L.forEach((l,i)=>{x.fillStyle='#000';x.fillText(l[0],m+1,m+i*lh+1);x.fillStyle=l[1];x.fillText(l[0],m,m+i*lh);});
  if(F.ph<=1){const aide='◄ ►  DIRIGER LA FOREUSE';x.fillStyle='#000';x.fillText(aide,m+1,h-m-fs+1);x.fillStyle=F.ph===0?F.pal.g:F.pal.d;x.fillText(aide,m,h-m-fs);}
  // coupe : les matières de fond du niveau, et le repère de profondeur
  const sw=Math.round(8*dpr),sx=w-m-sw,st=Math.round(h*.22),sh=Math.round(h*.5),B=F.P.b;
  B.forEach((e,i)=>{const y0=st+sh*e[0],y1=st+sh*(i+1<B.length?B[i+1][0]:1);x.fillStyle=F.mc[e[1]][1];x.fillRect(sx,Math.round(y0),sw,Math.max(1,Math.round(y1-y0)));});
  x.fillStyle='#2a1c1c';x.fillRect(sx,st+sh,sw,Math.round(sh*FG_CAV/F.D0*.5));
  const my=st+sh*Math.min(1,F.d/F.D0);x.fillStyle='#fff';x.fillRect(sx-Math.round(6*dpr),Math.round(my)-1,sw+Math.round(12*dpr),Math.max(2,Math.round(2*dpr)));
  x.textAlign='right';x.fillStyle=F.pal.g;x.fillText('COUPE',sx+sw,st-lh);}
