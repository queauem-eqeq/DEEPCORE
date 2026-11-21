/* ---------- Cinématique de forage (21 novembre 2026, environ 15 s) ----------
   Vue de côté, tout en caractères ASCII (comme les dessins d'équipement). La foreuse (15 lignes de haut) s'allume en surface,
   fumée et poussière ; puis elle s'enfonce, la caméra la suit : le sol défile en strates de couleur et de densité différentes
   (sol meuble, argile, roche tendre, roche dure, filon, basalte, cristaux, noyau dense). Plus la roche est dure, plus la
   foreuse ralentit, tremble et crache d'étincelles. Elle perce enfin le plafond d'une caverne, tombe, s'écrase et la scène
   s'éteint en fondu. Le son est synthétisé (moteur, grincement, impacts).
   playForage(suite) lance la scène et appelle suite() à la fin ; Échap, Espace ou Entrée la passent. F9 la lance pour l'essayer. */
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
// strates : h épaisseur (lignes) · w coût en temps par ligne (la dureté) · ch caractères · d densité · k couleur [clé de palette, luminosité]
const FG_LAY=[
  {n:'SOL MEUBLE',h:7,w:.5,ch:"·.,'`",d:.5,k:['3',.5]},
  {n:'ARGILE',h:18,w:.7,ch:"∙:;·°",d:.75,k:['2',.4]},
  {n:'ROCHE TENDRE',h:24,w:1,ch:"░░▒░",d:1,k:['g',.6]},
  {n:'ROCHE DURE',h:20,w:1.6,ch:"▒▒▓▒",d:1,k:['2',.55]},
  {n:'FILON MÉTALLIFÈRE',h:10,w:1.2,ch:"▒░▒",d:1,k:['g',.5],ore:.1,oreCh:'◆'},
  {n:'BASALTE',h:30,w:2.1,ch:"▓█▓▓",d:1,k:['g',.3]},
  {n:'CRISTAUX',h:16,w:1.4,ch:"▒▓╬▒",d:1,k:['3',.7],ore:.07,oreCh:'◇'},
  {n:'NOYAU DENSE',h:20,w:1.8,ch:"█▓█",d:1,k:['1',.4]}];
const FG_T0=2.4,FG_TD=10.2,FG_CAV=34,FG_SHAFT=6,FG_FONT='"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace';
const FG_SMOKE=['#c4cdd0','#9aa5a9','#737f84','#4d585d','#2e373b'];
let FORAGE=null,FG_CB=null;
const fgCv=$('forageCv'),fgx=fgCv.getContext('2d');
function fgMix(hex,k){const m=/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex)||['','b5','c2','c6'],v=i=>Math.max(0,Math.min(255,Math.round(parseInt(m[i],16)*k)));return `rgb(${v(1)},${v(2)},${v(3)})`;}
function fgH(F,x,y,k){let h=(x*374761393+y*668265263+(k||0)*2147483647+F.seed)|0;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return (h>>>0)/4294967296;}
function fgGlyph(F,ch,col){let A=F.atl[col];if(!A)A=F.atl[col]={};let g=A[ch];
  if(!g){g=document.createElement('canvas');g.width=F.cw;g.height=F.chh;const x=g.getContext('2d');x.font=F.font;x.textAlign='center';x.textBaseline='middle';x.fillStyle=col;x.fillText(ch,F.cw/2,F.chh/2+F.dy);A[ch]=g;}
  return g;}
const fgPut=(F,x,y,ch,col)=>F.x.drawImage(fgGlyph(F,ch,col),Math.round(x*F.cw),Math.round((y-F.camY)*F.chh));
function fgStart(){const F=FORAGE,pal=k=>(PAL&&PAL[k])||'#b5c2c6',base={'1':pal('1'),'2':pal('2'),'3':pal('3'),g:'#b5c2c6'};
  F.lay=FG_LAY.map(L=>({cols:[fgMix(base[L.k[0]],L.k[1]*.78),fgMix(base[L.k[0]],L.k[1]),fgMix(base[L.k[0]],Math.min(1.25,L.k[1]*1.22))]}));
  F.layAt=[];F.D0=0;F.totW=0;FG_LAY.forEach((L,i)=>{for(let j=0;j<L.h;j++){F.layAt.push(i);F.totW+=L.w;}F.D0+=L.h;});
  F.fl=F.D0+FG_CAV;F.oreCol=fgMix(base['1'],1.35);F.cDim=fgMix('#b5c2c6',.28);F.cRock=fgMix('#b5c2c6',.24);F.cRock2=fgMix('#b5c2c6',.42);
  F.pal={a:fgMix(base['1'],1.15),b:fgMix(base['2'],1.1),d:'#6b7a80',g:'#a9b6ba',w:'#f2f7f8',o:'#ffb347',k:'#3b464b'};
  F.nph=[Math.random()*6,Math.random()*6,Math.random()*6];}
function fgBn(F,x){return Math.round(Math.sin(x*.31+F.nph[0])*1.4+Math.sin(x*.13+F.nph[1])*1.8+Math.sin(x*.7+F.nph[2])*.5);}
function fgDepthAt(F,wt){let y=0;for(;y<F.D0;y++){const w=FG_LAY[F.layAt[y]].w;if(wt<w)return y+wt/w;wt-=w;}return F.D0;}
// une case du monde : renvoie vrai et remplit F.oc (caractère) et F.ok (couleur), ou faux si elle est vide
function fgCell(F,x,y){const dx=x-F.cx;
  if(y<0){if(fgH(F,x,y,3)<.008){F.oc='·';F.ok=F.cDim;return true;}return false;}
  if(y>=F.D0&&y<F.fl){   // la caverne : vide, avec des stalactites au plafond
    if(Math.abs(dx)>FG_SHAFT){const len=Math.floor(fgH(F,x,0,8)*5),k=y-F.D0;
      if(fgH(F,x,0,9)<.6&&k<len){F.oc=k===len-1?'▼':'▓';F.ok=F.cRock2;return true;}}
    if(fgH(F,x,y,10)<.012){F.oc='·';F.ok=F.cDim;return true;}return false;}
  if(y>=F.fl){const k=y-F.fl;F.oc=k===0?(fgH(F,x,y,11)<.5?'▓':'█'):['█','▓','█','▒'][Math.floor(fgH(F,x,y,12)*4)];F.ok=k===0?F.cRock2:F.cRock;return true;}
  if(Math.abs(dx)<=FG_SHAFT+(fgH(F,y,dx<0?1:2,5)<.35?1:0)&&y<F.d-6)return false;   // déjà creusé
  if(y<2){if(fgH(F,x,y,13)>.85)return false;F.oc=y?'▒':['"',';','\'','^'][Math.floor(fgH(F,x,y,14)*4)];F.ok=F.lay[0].cols[2];return true;}   // la surface : un liseré d'herbe
  const yy=Math.max(0,Math.min(F.D0-1,y+fgBn(F,x))),li=F.layAt[yy],L=FG_LAY[li];
  if(fgH(F,x,y,1)>L.d)return false;
  F.oc=L.ch[Math.floor(fgH(F,x,y,2)*L.ch.length)];
  F.ok=F.lay[li].cols[F.layAt[Math.max(0,yy-1)]!==li?2:Math.floor(fgH(F,x,y,4)*3)];
  if(L.ore&&fgH(F,x,y,6)<L.ore){F.oc=L.oreCh;F.ok=(Math.floor(F.te*4+fgH(F,x,y,7)*5)%5===0)?'#fff':F.oreCol;}
  return true;}
function fgEmit(F,o){if(F.pt.length<420)F.pt.push(Object.assign({age:0,g:0,drag:0,sd:(Math.random()*999)|0},o));}
const fgRnd=(a,b)=>a+Math.random()*(b-a);
function fgSmoke(F,x,y,vx,vy,life,r0,gr){fgEmit(F,{type:'sm',x,y,vx,vy,life,r0,gr,drag:.6});}
function fgChips(F,n,x,y,spread,up,g,L,ground){for(let i=0;i<n;i++){const li=L==null?F.layAt[Math.max(0,Math.min(F.D0-1,Math.floor(F.d-1)))]:L,Ly=FG_LAY[li];
  fgEmit(F,{type:'ch',x:x+fgRnd(-spread,spread)*.5,y:y+fgRnd(-1,1),vx:fgRnd(-spread,spread),vy:up<0?fgRnd(up,up*.35):fgRnd(up*.2,up),g,life:fgRnd(.7,1.5),ch:Ly.ch[(Math.random()*Ly.ch.length)|0],col:ground||F.lay[li].cols[(Math.random()*3)|0]});}}
function fgSparks(F,n,x,y,s){for(let i=0;i<n;i++)fgEmit(F,{type:'ch',x:x+fgRnd(-3,3),y,vx:fgRnd(-s,s),vy:-fgRnd(5,15),g:22,life:fgRnd(.25,.6),ch:'*+·'[(Math.random()*3)|0],col:Math.random()<.5?'#ffe9a8':'#ffffff'});}
/* ---- son : synthèse Web Audio (moteur, grincement, grondement) ---- */
function fgSound(){const a=audio();if(!a)return null;
  const buf=a.createBuffer(1,a.sampleRate*2,a.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  const out=a.createGain();out.gain.value=0;out.connect(MASTER);
  const nz=()=>{const s=a.createBufferSource();s.buffer=buf;s.loop=true;s.start();return s;};
  const r=nz(),rf=a.createBiquadFilter(),rg=a.createGain();rf.type='lowpass';rf.frequency.value=120;rg.gain.value=0;r.connect(rf);rf.connect(rg);rg.connect(out);   // grondement
  const g=nz(),gf=a.createBiquadFilter(),gg=a.createGain(),lfo=a.createOscillator(),lg=a.createGain();gf.type='bandpass';gf.frequency.value=900;gf.Q.value=1.4;gg.gain.value=0;
  lfo.frequency.value=17;lg.gain.value=0;lfo.connect(lg);lg.connect(gg.gain);lfo.start();g.connect(gf);gf.connect(gg);gg.connect(out);   // grincement haché par la rotation
  const m=a.createOscillator(),mf=a.createBiquadFilter(),mg=a.createGain();m.type='sawtooth';m.frequency.value=40;mf.type='lowpass';mf.frequency.value=260;mg.gain.value=0;
  m.connect(mf);mf.connect(mg);mg.connect(out);m.start();   // moteur
  const set=(p,v,k)=>p.setTargetAtTime(v,a.currentTime,k||.08);
  return {a,update(o){set(out.gain,o.vol);set(rg.gain,o.rum);set(rf.frequency,o.rumF);set(gg.gain,o.grind*.5);set(lg.gain,o.grind*.5);set(gf.frequency,o.grindF);set(lfo.frequency,o.rot);set(mg.gain,o.mot);set(m.frequency,o.motF);},
    stop(){set(out.gain,0,.15);setTimeout(()=>{try{r.stop();g.stop();m.stop();lfo.stop();}catch(e){}},700);}};}
function fgBoom(F,k){   // impacts ponctuels
  if(k==='start'){tone(55,1.6,'sawtooth',.16,140);noiz(1.4,.12,300,'lowpass',0,900);}
  else if(k==='strate'){noiz(.25,.2,900,'bandpass');tone(300,.12,'square',.04,150);}
  else if(k==='roc'){noiz(.07,.16,400+Math.random()*700);}
  else if(k==='perce'){noiz(1.4,.45,1200,'lowpass',0,80);tone(110,.9,'sawtooth',.2,30);}
  else if(k==='impact'){noiz(1.8,.6,700,'lowpass',0,50);tone(75,.7,'sine',.5,25);tone(180,.35,'triangle',.12,90,.05);for(let i=0;i<7;i++)noiz(.05,.09,3000,'highpass',.3+Math.random()*1.2);}
  else if(k==='petit'){noiz(.5,.25,500,'lowpass',0,60);tone(95,.3,'sine',.25,40);}}
function playForage(suite){
  if(reduced||FORAGE){suite&&suite();return;}
  unlock();if(typeof TRAV!=='undefined'&&TRAV)stopTravel();
  const dpr=Math.min(devicePixelRatio||1,2),w=Math.round(innerWidth*dpr),h=Math.round(innerHeight*dpr),size=Math.max(12,Math.round(h/36)),chh=size,cw=Math.round(size*.6);
  fgCv.width=w;fgCv.height=h;
  FORAGE={x:fgx,w,h,dpr,cw,chh,dy:0,font:`${size}px ${FG_FONT}`,R:Math.ceil(h/chh)+1,C:Math.ceil(w/cw)+2,cx:Math.floor(w/cw/2),
    seed:(Math.random()*1e9)|0,atl:{},pt:[],t0:performance.now(),last:performance.now(),ph:0,d:0,v:0,hs:0,te:0,camY:0,imp:0,flash:0,layPrev:-1,tE:0,snd:fgSound(),acc:{ex:0,dust:0,chip:0,spark:0,roc:0},vy:0};
  fgStart();FG_CB=suite||null;
  const F=FORAGE;F.camY=-F.R*.72+0;F.sy=0;
  fgCv.hidden=false;$('forageSkip').hidden=false;fgBoom(F,'start');
  requestAnimationFrame(forageFrame);}
function skipForage(){const F=FORAGE;if(!F||F.ph>=4)return;F.ph=4;F.tFade=(performance.now()-F.t0)/1000;F.fadeLen=.35;}
function endForage(){const F=FORAGE;if(F&&F.snd)F.snd.stop();FORAGE=null;fgCv.hidden=true;$('forageSkip').hidden=true;const cb=FG_CB;FG_CB=null;try{render();}catch(e){}if(cb)cb();}
function forageFrame(now){const F=FORAGE;if(!F)return;
  const t=(now-F.t0)/1000,dt=Math.min(.05,Math.max(.001,(now-F.last)/1000));F.last=now;F.t=t;
  // ---- avancement ----
  const dPrev=F.d;
  if(F.ph===0&&t>=FG_T0){F.ph=1;F.tD=t;}
  if(F.ph===1){F.te=t-F.tD;const tr=.9,te=F.te<tr?F.te*F.te/(2*tr):F.te-tr/2,s=Math.min(1,te/(FG_TD-tr/2));F.d=fgDepthAt(F,s*F.totW);
    if(s>=1||F.d>=F.D0-.001){F.d=F.D0;F.ph=2;F.tF=t;F.vy=Math.max(6,(F.d-dPrev)/dt);fgBoom(F,'perce');F.flash=.35;F.imp=.5;
      fgChips(F,70,F.cx,F.D0+1,9,4,34,F.layAt[F.D0-1]);for(let i=0;i<14;i++)fgSmoke(F,F.cx+fgRnd(-5,5),F.D0+fgRnd(0,3),fgRnd(-6,6),fgRnd(-1,5),fgRnd(2,3.4),1.4,3);}}
  else if(F.ph===2){F.vy+=55*dt;F.d+=F.vy*dt;
    if(F.d>=F.fl){F.d=F.fl;if(!F.bounced){F.bounced=1;F.imp=1;F.flash=.55;fgBoom(F,'impact');F.vy=-F.vy*.2;
        fgChips(F,90,F.cx,F.fl-1,16,-17,32,7,F.cRock2);fgSparks(F,36,F.cx,F.fl-2,18);
        for(let i=0;i<46;i++){const sd=i%2?1:-1;fgSmoke(F,F.cx+sd*fgRnd(1,6),F.fl-fgRnd(.5,2),sd*fgRnd(3,18),-fgRnd(.3,3),fgRnd(2,3.8),1,2.8);}}
      else{F.ph=3;F.tL=t;F.vy=0;F.imp=Math.max(F.imp,.35);fgBoom(F,'petit');fgChips(F,26,F.cx,F.fl-1,9,-9,28,7,F.cRock2);}}}
  else if(F.ph===3&&t>=F.tL+1.3){F.ph=4;F.tFade=t;F.fadeLen=.75;}
  F.v=F.ph===1?(F.d-dPrev)/dt:F.ph===2?F.vy:0;
  const li=F.layAt[Math.max(0,Math.min(F.D0-1,Math.floor(F.d-1)))],hT=F.ph===1?FG_LAY[li].w/2.1:0;F.hs+=(hT-F.hs)*Math.min(1,dt*5);
  if(F.ph===1&&li!==F.layPrev){if(F.layPrev>=0)fgBoom(F,'strate');F.layPrev=li;}
  F.imp*=Math.exp(-dt*(F.ph>=3?2.6:3.4));F.flash=Math.max(0,F.flash-dt*1.6);
  // ---- émissions ----
  const pipes=[F.cx-2,F.cx+2],y0=F.d-15,ex=F.ph<=1?(F.ph===0?6+24*Math.min(1,t/FG_T0):24):F.ph===2?22:8;
  F.acc.ex+=ex*dt;while(F.acc.ex>=1){F.acc.ex--;const px=pipes[(Math.random()*2)|0];fgSmoke(F,px+fgRnd(-.5,.5),y0-.5,fgRnd(-1.4,1.4),-fgRnd(3,7),fgRnd(1.8,2.8),.7,1.5);}
  if(F.ph===0&&t>.9){F.acc.dust+=(8+18*Math.min(1,(t-.9)/1.5))*dt;while(F.acc.dust>=1){F.acc.dust--;const sd=Math.random()<.5?-1:1;fgSmoke(F,F.cx+sd*fgRnd(1,6),-fgRnd(.2,1.5),sd*fgRnd(3,8),-fgRnd(.3,2),fgRnd(1.5,2.4),.6,1.9);}}
  if(F.ph===1){F.acc.chip+=(14+55*F.hs)*dt;while(F.acc.chip>=1){F.acc.chip--;fgChips(F,1,F.cx,F.d-2,13,-11,16);}
    if(F.hs>.5){F.acc.spark+=45*(F.hs-.4)*dt;while(F.acc.spark>=1){F.acc.spark--;fgSparks(F,1,F.cx,F.d-3,14);}}
    F.acc.roc+=5*F.hs*dt;while(F.acc.roc>=1){F.acc.roc--;fgBoom(F,'roc');}}
  // particules
  for(const p of F.pt){p.age+=dt;p.vy+=p.g*dt;const k=Math.max(0,1-p.drag*dt);p.vx*=k;if(p.type==='sm')p.vy*=k;p.x+=p.vx*dt;p.y+=p.vy*dt;
    if(p.type==='ch'&&F.ph<3&&F.d<F.D0&&p.y<F.D0-1&&Math.abs(p.x-F.cx)>FG_SHAFT){p.x=F.cx+Math.sign(p.x-F.cx)*FG_SHAFT;p.vx*=-.5;}}   // dans le puits, les éclats rebondissent sur la paroi
  F.pt=F.pt.filter(p=>p.age<p.life);
  // ---- caméra ----
  const tgt=F.d-(F.ph>=2?.6:.62)*F.R,tg0=-.72*F.R+0;
  if(F.ph===0)F.camY=tg0+F.d*0;else F.camY+=((F.ph===1?Math.max(tgt,tg0):tgt)-F.camY)*Math.min(1,dt*(F.ph===1?3.4:4.8));
  F.te=F.te||0;
  // ---- son ----
  if(F.snd){const sp=Math.min(1,F.v/22),ig=Math.min(1,t/1.6);
    F.snd.update({vol:F.ph===0?.55*ig:F.ph===1?.9:F.ph===2?.5:F.ph===3?.12:0,rum:.18+.5*F.hs+(F.ph===0?.25*ig:0)+F.imp*.5,rumF:90+F.hs*190+F.imp*260,
      grind:F.ph===1?.1+.3*F.hs+.04*sp:F.ph===0?.04*ig:0,grindF:700+F.hs*1700+sp*400,rot:14+sp*10+(F.ph===0?6*ig:0),mot:.05+.05*sp+(F.ph===0?.07*ig:0),motF:36+ig*10+sp*38+F.hs*8});}
  // ---- dessin ----
  fgDraw(F,t);
  if(F.ph===4&&t>=F.tFade+F.fadeLen){endForage();return;}
  requestAnimationFrame(forageFrame);}
function fgDraw(F,t){const x=F.x,{w,h,cw,chh,dpr}=F;
  F.x.setTransform(1,0,0,1,0,0);x.fillStyle='#000';x.fillRect(0,0,w,h);
  // tremblement : amplitude en pixels de l'écran
  const amp=(F.ph===0?1.4*Math.min(1,t/FG_T0):F.ph===1?1.4+F.hs*4.2:F.ph===2?2.2:.6)*dpr+F.imp*16*dpr,sx=Math.round((Math.random()-.5)*2*amp),sy=Math.round((Math.random()-.5)*2*amp);
  x.save();x.translate(sx,sy);
  // terrain
  const r0=Math.floor(F.camY);
  for(let r=-1;r<=F.R;r++){const y=r0+r,py=Math.round((y-F.camY)*chh);
    for(let c=-1;c<F.C;c++)if(fgCell(F,c,y))x.drawImage(fgGlyph(F,F.oc,F.ok),c*cw,py);}
  // foreuse
  const jx=F.hs>.5?Math.round((fgH(F,Math.floor(t*14),7,0)-.5)*2*(F.hs-.3)*1.2):0,top=F.d-15,fr=Math.floor(t*(F.ph===0?10+Math.min(1,t/FG_T0)*14:F.ph===1?26:F.ph===2?14:2));
  for(let r=0;r<15;r++){const row=FG_ART[r],mk=FG_MSK[r];
    for(let c=0;c<11;c++){let ch=row[c];if(ch===' ')continue;let col=F.pal[mk[c]];
      if(r>=7&&r<=13&&ch==='▓'){const ph=(c+r*2+fr)&3;ch=ph<2?'▓':'▒';col=ph<2?F.pal.w:F.pal.g;}
      else if(r===3&&ch==='◉')col=(Math.floor(t*3)&1)||F.ph>=2?F.pal.o:F.pal.b;
      else if(r===14&&F.ph===1)col=(Math.floor(t*20)&1)?'#fff':F.pal.o;
      fgPut(F,F.cx-5+c+jx,top+r,ch,col);}}
  // particules
  for(const p of F.pt){const a=p.age/p.life;
    if(p.type==='sm'){const rad=p.r0+p.age*p.gr,rx=Math.ceil(rad*1.9),ry=Math.ceil(rad),ci=Math.min(4,Math.floor(a*5)),col=FG_SMOKE[ci],px=Math.round(p.x),py=Math.round(p.y);
      for(let j=-ry;j<=ry;j++)for(let i=-rx;i<=rx;i++){const d=Math.hypot(i/1.9,j)/rad;if(d>1)continue;if(d>.55&&fgH(F,i+px,j+py,p.sd)<.22+a*.4)continue;
        fgPut(F,px+i,py+j,d<.4&&a<.55?'▓':d<.75&&a<.8?'▒':'░',col);}}
    else fgPut(F,Math.round(p.x),Math.round(p.y),p.ch,p.col);}
  x.restore();
  fgHud(F,t);
  // flash blanc à l'impact, fondu final
  if(F.flash>0){x.globalAlpha=Math.min(.7,F.flash);x.fillStyle='#fff';x.fillRect(0,0,w,h);x.globalAlpha=1;}
  if(F.ph===4){x.globalAlpha=Math.min(1,(t-F.tFade)/F.fadeLen);x.fillStyle='#000';x.fillRect(0,0,w,h);x.globalAlpha=1;}}
function fgHud(F,t){const x=F.x,{w,h,dpr}=F,fs=Math.round(12*dpr),lh=Math.round(17*dpr),m=Math.round(20*dpr),li=F.layAt[Math.max(0,Math.min(F.D0-1,Math.floor(F.d-1)))],L=FG_LAY[li],fall=F.ph>=2;
  x.font=`${fs}px ${FG_FONT}`;x.textAlign='left';x.textBaseline='top';
  const hard='▮'.repeat(Math.round(F.hs*5))+'▯'.repeat(5-Math.round(F.hs*5)),m1=Math.round(F.d*8.5),rpm=F.ph===0?Math.round(400+2600*Math.min(1,t/FG_T0)):fall?Math.max(0,Math.round(3200*(1-(t-F.tF)/2))):Math.round(2600+600*F.hs+(F.v*20));
  const lines=[['FORAGE ▸ SÉQUENCE DE DESCENTE',F.pal.a],[`PROFONDEUR  ${String(m1).replace(/\B(?=(\d{3})+$)/g,' ')} m`,F.pal.g],
    [`STRATE     ${fall?'CAVERNE':F.ph===0?'SURFACE':L.n}`,F.pal.g],[`ROTATION   ${String(rpm).replace(/\B(?=(\d{3})+$)/g,' ')} tr/min`,F.pal.g],[`DURETÉ     ${hard}`,F.pal.g]];
  if(F.ph===2&&Math.floor(t*5)%2===0)lines.push(['ALERTE ▸ PERTE DE SUPPORT','#ff5a4a']);
  if(F.ph>=3)lines.push(['IMPACT ▸ ARRIVÉE AU NIVEAU SUIVANT',F.pal.o]);
  lines.forEach((l,i)=>{x.fillStyle='#000';x.fillText(l[0],m+1,m+i*lh+1);x.fillStyle=l[1];x.fillText(l[0],m,m+i*lh);});
  // coupe géologique à droite
  const sw=Math.round(8*dpr),sx=w-m-sw,st=Math.round(h*.22),sh=Math.round(h*.5);let yy=st;
  FG_LAY.forEach((Ly,i)=>{const hh=sh*Ly.h/F.D0;x.fillStyle=F.lay[i].cols[1];x.fillRect(sx,Math.round(yy),sw,Math.max(1,Math.round(hh)-1));yy+=hh;});
  x.fillStyle='#2a1c1c';const cav=sh*FG_CAV/F.D0*.5;x.fillRect(sx,Math.round(yy),sw,Math.round(cav));
  const my=st+sh*Math.min(1,F.d/F.D0);x.fillStyle='#fff';x.fillRect(sx-Math.round(6*dpr),Math.round(my)-1,sw+Math.round(12*dpr),Math.max(2,Math.round(2*dpr)));
  x.textAlign='right';x.fillStyle=F.pal.g;x.fillText('COUPE',sx+sw,st-lh);}
