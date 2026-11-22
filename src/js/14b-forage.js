/* ---------- Cinématique de forage (21 novembre 2026, environ 15 s) ----------
   Pour le passage au niveau suivant. Vue de côté, tout en caractères ASCII (comme les dessins d'équipement).
   La foreuse démarre couchée à l'horizontale sur le sol, se cabre, plante son nez et plonge à la verticale ;
   à l'arrivée elle touche le fond, bascule sur le côté et se recouche à l'horizontale. Le dessin est tourné en
   échantillonnant la grille de caractères (aucun lissage), et les caractères de cadre sont remplacés par leur
   équivalent tourné d'un quart de tour au-delà de 45 degrés : la machine reste en ASCII à tous les angles.
   La roche n'est pas en bandes : c'est un champ en deux dimensions, des lentilles de matières entremêlées, avec
   de grosses masses de roche dure semées dedans. Devant une masse, la foreuse pivote d'elle-même pour la
   contourner ; le joueur l'aide avec les flèches, Q et D, ou 4 et 6 du pavé numérique (ou le doigt sur l'écran).
   playForage(suite, niv) lance la scène et appelle suite() à la fin ; F9 la lance pour l'essayer.
   Niveau 1 : terre, argile, roche, quelques masses dures. Les filons, cristaux et basalte sont pour plus bas.
   SECONDE DESCENTE (niveau 2 vers 3, 21 novembre 2026) : un vrai mini-jeu. La foreuse est plus petite à l'écran (on voit plus loin
   devant elle), la descente est plus longue, et des MINES EXPLOSIVES sont semées dans la roche, la plupart sur sa route. Toucher
   une mine coûte FG_MINE_DM points de vie, de la vraie vie de la foreuse (G.st.vie) : à zéro, elle explose et la partie est
   perdue. Les mines apparaissent juste sous le bas de l'écran, visées sur la trajectoire du moment : il faut les voir venir et
   s'écarter. Passer la scène (Échap) coûte FG_PASSE_DM points de vie, sans jamais tuer.
   La vie restante est affichée pendant toutes les descentes, la première comprise.
   AMAS DE MATIÈRE (première descente, 22 novembre 2026) : plusieurs amas irréguliers, couleur accent ; chaque caractère touché par le puits
   rapporte 1 de Matière (G.st.matiere). Voir FG_AMAS_PRES, FG_AMAS_LOIN plus bas.
   ANNONCE : les FG_ANNONCE premières secondes, deux lignes en gros au milieu de l'écran disent ce que la descente réserve. */
const FG_MINE_DM=12,FG_PASSE_DM=30,FG_AMAS_MAT=20;
/* 22 novembre 2026 (choix de l'utilisateur) : plusieurs amas, irréguliers, de FG_AMAS_MAT caractères ; chaque caractère touché par le
   puits rapporte 1 de Matière. FG_AMAS_PRES amas naissent près de la route (9 à 14 cases à côté : il faut tourner), FG_AMAS_LOIN
   loin à gauche et à droite, hors d'atteinte : le sous-sol a l'air d'exister aussi sur les côtés. F.amasL : la liste, dans l'ordre
   des profondeurs ; un amas {y, loin, c:[{x,y,ok}]} prend forme (fgAmasForme) quand il arrive au bas de l'écran. */
const FG_AMAS_PRES=3,FG_AMAS_LOIN=6;
// une tache irrégulière de n cases autour de (x,y) : on part d'une case et on ajoute au hasard une voisine libre, plus souvent sur les côtés
function fgAmasForme(x,y,n){const c=[{x,y,ok:1}],vu=new Set([x+','+y]);let g=0;
  while(c.length<n&&g++<900){const b=c[(Math.random()*c.length)|0],r=Math.random(),dx=r<.35?-1:r<.7?1:0,dy=dx?0:(Math.random()<.5?-1:1),X=b.x+dx,Y=b.y+dy,k=X+','+Y;
    if(vu.has(k)||Math.abs(Y-y)>3)continue;vu.add(k);c.push({x:X,y:Y,ok:1});}
  return c;}
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
// un quart de tour du caractère lui-même : FG_RG quand le nez part à droite, FG_RD quand il part à gauche
const FG_RG={'▄':'▐','▐':'▀','▀':'▌','▌':'▄','═':'║','║':'═','╔':'╚','╚':'╝','╝':'╗','╗':'╔','╠':'╩','╣':'╦','╧':'╣','╲':'╱','╱':'╲','▼':'►'};
const FG_RD={'▄':'▌','▌':'▀','▀':'▐','▐':'▄','═':'║','║':'═','╔':'╗','╗':'╝','╝':'╚','╚':'╔','╠':'╦','╣':'╩','╧':'╠','╲':'╱','╱':'╲','▼':'◄'};
// Les matières. d dureté (temps de forage) · ch caractères · dn densité (part de cases occupées) · k [couleur de palette, luminosité]
const FG_MAT=[
  {n:'TERRE MEUBLE',d:.5,ch:"·.,'`",dn:.55,k:['3',.5]},
  {n:'ARGILE',d:.85,ch:"∙:;·°",dn:.82,k:['3',.42]},
  {n:'ROCHE',d:1.3,ch:"░▒░",dn:.95,k:['g',.52]},
  {n:'ROCHE DURE',d:2.8,ch:"▓█▓",dn:1,k:['2',.6]},
  {n:'FILON',d:1.6,ch:"▒░▒",dn:.95,k:['g',.52],ore:.12,oreCh:'◆'},
  {n:'BASALTE',d:4.2,ch:"█▓█",dn:1,k:['2',.5]},   // la roche dure du mini-jeu : couleur bio (21 novembre 2026 ; gris avant)
  {n:'CRISTAUX',d:2.4,ch:"▒╬▓",dn:.95,k:['3',.8],ore:.09,oreCh:'◇'},
  {n:'NOYAU DENSE',d:5,ch:"█▓█",dn:1,k:['1',.45]}];
/* Un profil par niveau. b : la matière de fond selon la profondeur relative (perturbée par un bruit, donc les
   limites ondulent beaucoup) · dur : la matière des masses dures semées dedans · seuil(p) : au-delà de quoi le
   bruit donne une masse dure (plus bas = plus de dur) · des : profondeur où les masses commencent ·
   mel(m,n) : l'entremêlement, deux matières de fond qui s'interpénètrent en lentilles. */
const FG_NIV=[
  {D0:150,b:[[0,0],[.05,1],[.17,2]],dur:3,seuil:p=>.665-.05*p,des:.15,mel:(m,n)=>m===2&&n>.70?1:m===1&&n<.30?2:m},
  {D0:390,b:[[0,2],[.22,4],[.5,2]],dur:5,seuil:p=>.6-.05*p,des:.05,mel:(m,n)=>m===2&&n>.68?4:m},
  {D0:190,b:[[0,5],[.3,6],[.62,5],[.84,7]],dur:7,seuil:p=>.6-.07*p,des:.05,mel:(m,n)=>m===5&&n>.72?6:m}];
const FG_ANNONCE=3.2,FG_T0=2.5,FG_PLG=1.3,FG_CAV=34,FG_R=6,FG_POSE=3.2,FG_FONT='"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace';
const FG_SMOKE=['#c4cdd0','#9aa5a9','#737f84','#4d585d','#2e373b'];
let FORAGE=null,FG_CB=null;
const fgCv=$('forageCv'),fgx=fgCv.getContext('2d');
function fgMix(hex,k){const m=/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex)||['','b5','c2','c6'],v=i=>Math.max(0,Math.min(255,Math.round(parseInt(m[i],16)*k)));return `rgb(${v(1)},${v(2)},${v(3)})`;}
function fgH(F,x,y,k){let h=(x*374761393+y*668265263+(k||0)*1442695041+F.seed)|0;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return (h>>>0)/4294967296;}
// bruit de valeur lissé, étiré à l'horizontale : des lentilles larges et plates, comme des strates remuées
function fgNz(F,x,y,sx,sy,k){const px=x*sx,py=y*sy,x0=Math.floor(px),y0=Math.floor(py),fx=px-x0,fy=py-y0,
  u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),a=fgH(F,x0,y0,k),b=fgH(F,x0+1,y0,k),c=fgH(F,x0,y0+1,k),d=fgH(F,x0+1,y0+1,k),
  s=a+(b-a)*u;return s+((c+(d-c)*u)-s)*v;}
const fgNz2=(F,x,y,sx,sy,k)=>fgNz(F,x,y,sx,sy,k)*.72+fgNz(F,x,y,sx*2.9,sy*2.5,k+31)*.28;
// la matière en (x, y) : fond par profondeur perturbée, lentilles d'entremêlement, puis masses dures
function fgMat(F,x,y){const P=F.P;
  const p=y/P.D0+(fgNz2(F,x,y,.045,.12,1)-.5)*.085;
  let m=P.b[0][1];for(const e of P.b)if(p>=e[0])m=e[1];
  m=P.mel(m,fgNz2(F,x,y,.055,.3,7));
  if(p>P.des&&fgNz2(F,x,y,.042,.13,13)>P.seuil(p))m=P.dur;
  return m;}
const fgDur=(F,x,y)=>FG_MAT[fgMat(F,Math.round(x),Math.round(y))].d;
// dureté moyenne d'une plaque, pour sonder ce qui vient
function fgSonde(F,x,y){let s=0;for(let j=0;j<3;j++)for(let i=-3;i<=3;i+=3)s+=fgDur(F,x+i,y+j*3);return s/9;}
function fgStart(){const F=FORAGE,pal=k=>(PAL&&PAL[k])||'#b5c2c6',base={'1':pal('1'),'2':pal('2'),'3':pal('3'),g:'#b5c2c6'};
  F.mc=FG_MAT.map(M=>[fgMix(base[M.k[0]],M.k[1]*.74),fgMix(base[M.k[0]],M.k[1]),fgMix(base[M.k[0]],Math.min(1.3,M.k[1]*1.25))]);
  F.D0=F.P.D0;F.fl=F.D0+FG_CAV;F.oreCol=fgMix(base['1'],1.35);F.cDim=fgMix('#b5c2c6',.26);F.cRock=fgMix('#b5c2c6',.24);F.cRock2=fgMix('#b5c2c6',.42);
  F.pal={a:fgMix(base['1'],1.15),b:fgMix(base['2'],1.1),d:'#6b7a80',g:'#a9b6ba',w:'#f2f7f8',o:'#ffb347'};
  F.tr=new Float32Array(F.D0+4).fill(NaN);F.tr[0]=F.cx;}
// le centre du puits à la ligne y (interpolé), ou la position actuelle si rien n'est encore creusé
function fgTrace(F,y){if(y<=0)return F.tr[0];if(y>=F.d)return F.cx;const i=Math.floor(y),a=F.tr[Math.min(i,F.D0)],b=F.tr[Math.min(i+1,F.D0)];
  if(isNaN(a))return F.cx;return isNaN(b)?a:a+(b-a)*(y-i);}
const fgCreuse=(F,y)=>{const i=Math.max(0,Math.min(F.D0,Math.round(y)));if(isNaN(F.tr[i]))F.tr[i]=F.cx;};
// un point du dessin (lx en colonnes, ly en lignes depuis le nez) ramené en cases du monde, la machine tournée
function fgLoc(F,lx,ly){const th=F.th*Math.PI/180,co=Math.cos(th),si=Math.sin(th),ex=lx*.6;
  return [F.nx+(ex*co+ly*si)/.6,F.ny+(-ex*si+ly*co)];}
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
  else if(k==='plonge'){noiz(.8,.3,500,'lowpass',0,120);tone(140,.5,'sawtooth',.14,70);}
  else if(k==='strate'){noiz(.25,.2,900,'bandpass');tone(300,.12,'square',.04,150);}
  else if(k==='roc'){noiz(.07,.16,400+Math.random()*700);}
  else if(k==='perce'){noiz(1.4,.45,1200,'lowpass',0,80);tone(110,.9,'sawtooth',.2,30);}
  else if(k==='impact'){noiz(1.8,.6,700,'lowpass',0,50);tone(75,.7,'sine',.5,25);tone(180,.35,'triangle',.12,90,.05);for(let i=0;i<7;i++)noiz(.05,.09,3000,'highpass',.3+Math.random()*1.2);}
  else if(k==='couche'){noiz(1.1,.45,420,'lowpass',0,60);tone(85,.5,'sine',.32,38);noiz(.3,.14,2200,'highpass',.05);}
  else if(k==='petit'){noiz(.5,.25,500,'lowpass',0,60);tone(95,.3,'sine',.25,40);}}
function playForage(suite,niv){
  if(reduced||FORAGE){suite&&suite();return;}
  unlock();if(typeof TRAV!=='undefined'&&TRAV)stopTravel();
  const jeu=(niv||1)>=2,dpr=Math.min(devicePixelRatio||1,2),w=Math.round(innerWidth*dpr),h=Math.round(innerHeight*dpr),size=Math.max(jeu?9:12,Math.round(h/(jeu?52:36))),chh=size,cw=Math.round(size*.6);   // mini-jeu : caractères plus petits, la foreuse aussi
  fgCv.width=w;fgCv.height=h;
  FORAGE={x:fgx,w,h,dpr,cw,chh,font:`${size}px ${FG_FONT}`,R:Math.ceil(h/chh)+1,C:Math.ceil(w/cw)+3,
    P:FG_NIV[Math.max(0,Math.min(FG_NIV.length-1,(niv||1)-1))],niv:niv||1,
    jeu,mines:[],mNext:30,touche:0,perdu:0,stun:0,amas:null,amasY:0,amasL:[],recolte:0,
    seed:(Math.random()*1e9)|0,atl:{},pt:[],t0:performance.now(),last:performance.now(),t:0,ph:0,d:0,cx:0,vx:0,hs:0,evit:0,
    th:90,nx:0,ny:-FG_POSE,side:1,camX:0,camY:0,imp:0,flash:0,matPrev:-1,kl:0,kr:0,man:0,
    snd:fgSound(),acc:{ex:0,dust:0,chip:0,spark:0,roc:0},vy:0};
  fgStart();FG_CB=suite||null;
  if(!jeu){const F=FORAGE,D=F.D0,l=[];   // première descente : les profondeurs des amas, proches et lointains, étalées sur toute la descente
    for(let i=0;i<FG_AMAS_PRES;i++)l.push({y:Math.round(D*(.2+.6*(i+fgRnd(.15,.85))/FG_AMAS_PRES)),loin:0});
    for(let i=0;i<FG_AMAS_LOIN;i++)l.push({y:Math.round(D*(.1+.8*(i+fgRnd(.1,.9))/FG_AMAS_LOIN)),loin:i%2?1:-1});
    F.amasL=l.sort((a,b)=>a.y-b.y);F.amasY=l.find(a=>!a.loin).y;}
  FORAGE.camY=-FORAGE.R*.62;
  fgCv.hidden=false;$('forageSkip').hidden=false;$('forageSkip').textContent=jeu?`Échap : passer (−${FG_PASSE_DM} vie)`:'Échap : passer';fgBoom(FORAGE,'start');
  requestAnimationFrame(forageFrame);}
function skipForage(){const F=FORAGE;if(!F||F.ph>=4)return;
  if(F.jeu&&F.ph<2&&typeof G!=='undefined'&&G&&G.st){const dm=Math.max(0,Math.min(FG_PASSE_DM,Math.floor(G.st.vie)-1));G.st.vie-=dm;F.perdu+=dm;F.passe=1;}   // descente en aveugle : elle coûte, sans jamais tuer
  F.ph=4;F.tFade=F.t;F.fadeLen=.35;}
/* Mines du mini-jeu. Elles naissent une par une, juste sous le bas de l'écran : sept sur dix sont visées sur la route de la foreuse
   (là où elle sera si elle ne tourne pas), les autres semées plus loin ; une fois sur quatre, une seconde mine vient à côté et ne
   laisse qu'un couloir. L'écart entre deux rangées se resserre avec la profondeur. Une mine saute dès qu'elle est dans le puits. */
function fgMines(F,dt){const bas=F.R*.7;
  while(F.mNext<F.D0-16&&F.d+bas>=F.mNext){const p=F.d/F.D0,vise=Math.random()<.7,x=Math.round(F.cx+F.vx*.9+(vise?fgRnd(-4,4):(Math.random()<.5?-1:1)*fgRnd(12,26)));
    F.mines.push({x,y:F.mNext,ok:1});if(Math.random()<.25)F.mines.push({x:x+(Math.random()<.5?-1:1)*Math.round(fgRnd(15,19)),y:F.mNext+Math.round(fgRnd(-2,2)),ok:1});
    F.mNext+=Math.round(fgRnd(17,25)*(1-.3*p));}   // rangées espacées quand la descente a été allongée de 5 secondes, pour ne pas doubler les dégâts
  for(const m of F.mines){if(!m.ok||Math.abs(m.y-F.d)>1.4||Math.abs(m.x-F.cx)>FG_R-1)continue;m.ok=0;F.touche++;F.stun=.45;F.flash=.5;F.imp=1.1;fgBoom(F,'impact');
    fgSparks(F,40,m.x,m.y,22);fgChips(F,50,m.x,m.y,18,-14,30);for(let i=0;i<14;i++)fgSmoke(F,m.x+fgRnd(-4,4),m.y+fgRnd(-2,2),fgRnd(-9,9),fgRnd(-6,3),fgRnd(1.2,2),1,2.4);
    if(typeof G!=='undefined'&&G&&G.st){const dm=Math.min(FG_MINE_DM,G.st.vie);G.st.vie-=dm;F.perdu+=dm;
      if(G.st.vie<=0&&!F.mort){F.mort=1;F.ph=4;F.tFade=F.t;F.fadeLen=1.3;F.flash=.9;F.imp=2;fgBoom(F,'perce');for(let i=0;i<40;i++)fgSmoke(F,F.cx+fgRnd(-8,8),F.d-fgRnd(0,12),fgRnd(-14,14),fgRnd(-12,6),fgRnd(1.5,2.6),1.2,3);fgSparks(F,90,F.cx,F.d-6,30);}}}
  F.stun=Math.max(0,F.stun-dt);}
/* L’amas naît juste sous le bas de l’écran quand la foreuse approche de sa profondeur, de 9 à 13 cases à côté de là où elle va (côté au hasard) :
   il faut tourner un peu pour passer dessus. Il est récolté si le puits le touche (moitié de largeur du puits + 2 cases). */
function fgAmas(F){
  for(const A of F.amasL){
    if(!A.c){if(F.d+F.R*.6<A.y)continue;const sd=A.loin||(Math.random()<.5?-1:1),ec=A.loin?fgRnd(26,Math.max(30,F.C*.42)):fgRnd(9,14);
      A.c=fgAmasForme(Math.round(F.cx+F.vx*.6+sd*ec),A.y,FG_AMAS_MAT);if(!A.loin)F.amas={x:A.c[0].x,y:A.y,ok:1,A};}
    if(Math.abs(A.y-F.d)>5)continue;
    for(const c of A.c){if(!c.ok||Math.abs(c.y-F.d)>1.3||Math.abs(c.x-F.cx)>FG_R+1)continue;   // le puits touche ce caractère : +1
      c.ok=0;F.recolte++;F.tRec=F.t;F.imp=Math.max(F.imp,.15);if(typeof G!=='undefined'&&G&&G.st)G.st.matiere=(G.st.matiere||0)+1;
      if(F.recolte%4===1)try{SFX.spot();}catch(e){}
      for(let i=0;i<3;i++)fgEmit(F,{type:'ch',x:c.x,y:c.y,vx:fgRnd(-14,14),vy:-fgRnd(4,14),g:26,life:fgRnd(.4,1),ch:'◆◇*·'[(Math.random()*4)|0],col:Math.random()<.35?F.pal.w:F.pal.a});}}
  if(F.amas&&F.amas.A)F.amas.ok=F.amas.A.c.some(c=>c.ok)?1:0;}
function endForage(){const F=FORAGE;if(F&&F.snd)F.snd.stop();FORAGE=null;fgCv.hidden=true;$('forageSkip').hidden=true;const cb=FG_CB;FG_CB=null;
  if(F&&F.mort){G.over={dead:true};try{say('Une mine de trop : la foreuse explose dans le puits.','warn');render();}catch(e){}dead();return;}   // détruite pendant la descente : pas de niveau suivant
  try{render();}catch(e){}if(cb)cb();
  if(F&&F.recolte&&typeof G!=='undefined'&&G&&!G.over){try{sayMore(`Amas de Matière récolté pendant la descente : +${F.recolte} (réserve : ${G.st.matiere}).`,'good');render();}catch(e){}}
  if(F&&F.jeu&&typeof G!=='undefined'&&G&&!G.over){try{sayMore(F.passe?`Descente à l’aveugle : −${F.perdu} vie.`:F.touche?`Descente : ${F.touche} mine${F.touche>1?'s':''} touchée${F.touche>1?'s':''}, −${F.perdu} vie.`:'Descente sans une égratignure : aucune mine touchée.',F.perdu?'warn':'good');render();}catch(e){}}}
// diriger : flèches, Q et D, 4 et 6 du pavé numérique
function fgKey(e,v){const F=FORAGE;if(!F)return;const k=(e.key||'').toLowerCase(),c=e.code||'';
  // commandes inversées à la demande de l'utilisateur (21 novembre 2026) : la touche de gauche pousse la foreuse à droite, et l'inverse
  if(k==='arrowleft'||k==='q'||c==='Numpad4')F.kr=v;else if(k==='arrowright'||k==='d'||c==='Numpad6')F.kl=v;}
addEventListener('keydown',e=>fgKey(e,1));
addEventListener('keyup',e=>fgKey(e,0));
// au doigt ou à la souris : maintenir d'un côté de la foreuse pour la tirer de ce côté
function fgPointer(e,on){const F=FORAGE;if(!F)return;unlock();if(!on){F.kl=F.kr=0;return;}
  const s=(e.clientX*F.dpr-F.w/2)/F.cw+F.camX;F.kr=s<F.cx-1?1:0;F.kl=s>F.cx+1?1:0;}   // inversé aussi au doigt et à la souris
fgCv.addEventListener('pointerdown',e=>fgPointer(e,true));
fgCv.addEventListener('pointermove',e=>{if(e.buttons)fgPointer(e,true);});
fgCv.addEventListener('pointerup',e=>fgPointer(e,false));
fgCv.addEventListener('pointercancel',e=>fgPointer(e,false));
function forageFrame(now){const F=FORAGE;if(!F)return;
  const t=(now-F.t0)/1000,dt=Math.min(.05,Math.max(.001,(now-F.last)/1000));F.last=now;F.t=t;
  const dPrev=F.d;
  // phase 0 : couchée sur le sol, moteur qui monte ; puis elle se cabre et plante son nez dans la terre
  if(F.ph===0){const k=Math.max(0,Math.min(1,(t-(FG_T0-FG_PLG))/FG_PLG)),e=k*k*(3-2*k);
    if(k>0&&!F.plg){F.plg=1;fgBoom(F,'plonge');}
    F.th=90*(1-e);F.nx=F.cx;F.ny=-FG_POSE*(1-e);
    if(t>=FG_T0){F.ph=1;F.tD=t;F.th=0;F.ny=0;}}
  if(F.ph===1){F.te=t-F.tD;
    const dur=fgDur(F,F.cx,F.d+1),pousse=1+Math.max(0,F.te-6)*.14,mont=Math.min(1,F.te/.7);
    F.vy=20*pousse*mont/Math.max(.5,dur*.85)*(F.stun>0?.35:1);F.d+=F.vy*dt;
    // pivoter : sonder devant, à gauche et à droite, et glisser vers le plus tendre ; le joueur appuie dans le même sens ou contre
    const look=11,dc=fgSonde(F,F.cx,F.d+look),dl=fgSonde(F,F.cx-10,F.d+look),dr=fgSonde(F,F.cx+10,F.d+look);
    F.evit=dc;
    if(dc>1.5)F.vx+=(dl<dr?-1:1)*Math.min(3,dc-1.5)*24*dt;
    F.man+=((F.kr-F.kl)-F.man)*Math.min(1,dt*8);F.vx+=F.man*(F.jeu?52:28)*dt;   // mini-jeu : la foreuse répond plus vite
    F.vx*=Math.exp(-dt*2.4);F.vx=Math.max(F.jeu?-24:-16,Math.min(F.jeu?24:16,F.vx));F.cx+=F.vx*dt;
    if(F.jeu)fgMines(F,dt);else fgAmas(F);
    for(let y=Math.floor(dPrev);y<=Math.floor(F.d);y++)fgCreuse(F,y);
    F.nx=F.cx;F.ny=F.d;
    if(F.d>=F.D0){F.d=F.D0;F.ny=F.d;F.ph=2;F.tF=t;F.vy=Math.max(7,(F.d-dPrev)/dt);F.side=F.vx<-1?-1:1;F.vx*=.3;fgBoom(F,'perce');F.flash=.35;F.imp=.5;
      fgChips(F,70,F.cx,F.D0+1,9,4,34);for(let i=0;i<10;i++)fgSmoke(F,F.cx+fgRnd(-5,5),F.D0+fgRnd(0,3),fgRnd(-6,6),fgRnd(-1,5),fgRnd(1.4,2.2),1.1,2.2);}}
  else if(F.ph===2){F.vy+=55*dt;F.d+=F.vy*dt;F.cx+=F.vx*dt;F.vx*=Math.exp(-dt*3);F.nx=F.cx;F.ny=F.d;
    if(F.d>=F.fl){F.d=F.fl;F.ny=F.fl;if(!F.bounced){F.bounced=1;F.imp=1;F.flash=.55;fgBoom(F,'impact');F.vy=-F.vy*.2;
        fgChips(F,90,F.cx,F.fl-1,16,-17,32,2,F.cRock2);fgSparks(F,36,F.cx,F.fl-2,18);
        for(let i=0;i<24;i++){const sd=i%2?1:-1;fgSmoke(F,F.cx+sd*fgRnd(1,6),F.fl-fgRnd(.5,2),sd*fgRnd(3,16),-fgRnd(.3,2.4),fgRnd(1.2,2.1),.9,2.1);}}
      else{F.ph=3;F.tL=t;F.vy=0;F.imp=Math.max(F.imp,.3);fgChips(F,26,F.cx,F.fl-1,9,-9,28,2,F.cRock2);}}}
  // phase 3 : elle bascule sur le côté autour de son nez et se recouche à l'horizontale, avec un rebond amorti
  else if(F.ph===3){const u=t-F.tL,k=Math.min(1,u/.85),e=1-Math.pow(1-k,3),
      reb=k>=1?Math.exp(-(u-.85)*6)*Math.sin((u-.85)*20)*6:0;
    F.th=F.side*(90*e+reb);F.ny=F.fl-FG_POSE*e;F.nx=F.cx;
    if(k>=.78&&!F.couche){F.couche=1;F.imp=.8;fgBoom(F,'couche');
      const bx=F.cx-F.side*7;fgChips(F,34,bx,F.fl-1,11,-10,30,2,F.cRock2);
      for(let i=0;i<12;i++)fgSmoke(F,bx+fgRnd(-7,7),F.fl-fgRnd(.2,1.6),fgRnd(-8,8),-fgRnd(.3,1.8),fgRnd(1,1.7),.8,1.9);}
    if(u>=2.1){F.ph=4;F.tFade=t;F.fadeLen=.75;}}
  else if(F.ph===4&&F.tFade==null){F.tFade=t;F.fadeLen=.75;}
  const mi=fgIci(F),M=FG_MAT[mi],hT=F.ph===1?Math.min(1,(M.d-.5)/3):0;
  F.hs+=(hT-F.hs)*Math.min(1,dt*5);
  if(F.ph===1)F.th+=((Math.max(-25,Math.min(25,Math.atan2(F.vx,Math.max(2,F.vy))*180/Math.PI)))-F.th)*Math.min(1,dt*5);
  if(F.ph===1&&mi!==F.matPrev){if(F.matPrev>=0)fgBoom(F,'strate');F.matPrev=mi;}
  F.imp*=Math.exp(-dt*(F.ph>=3?2.6:3.4));F.flash=Math.max(0,F.flash-dt*1.6);
  // fumée aux deux échappements, qui suivent la machine quand elle tourne
  const ex=F.ph<=1?(F.ph===0?5+9*Math.min(1,t/FG_T0):18):F.ph===2?12:5;
  F.acc.ex+=ex*dt;while(F.acc.ex>=1){F.acc.ex--;const e=fgLoc(F,Math.random()<.5?-2:2,-15.5);fgSmoke(F,e[0]+fgRnd(-.5,.5),e[1],fgRnd(-1.4,1.4),-fgRnd(3,7),fgRnd(1.8,2.8),.7,1.5);}
  if(F.ph===0&&t>.7){F.acc.dust+=(5+9*Math.min(1,(t-.7)/1.5))*dt;while(F.acc.dust>=1){F.acc.dust--;const sd=Math.random()<.5?-1:1;fgSmoke(F,F.cx+sd*fgRnd(1,9),-fgRnd(.2,1.5),sd*fgRnd(3,8),-fgRnd(.3,2),fgRnd(1.5,2.4),.6,1.9);}}
  if(F.ph===1){F.acc.chip+=(14+55*F.hs)*dt;while(F.acc.chip>=1){F.acc.chip--;fgChips(F,1,F.nx,F.ny-2,13,-11,16);}
    if(F.hs>.5){F.acc.spark+=45*(F.hs-.4)*dt;while(F.acc.spark>=1){F.acc.spark--;fgSparks(F,1,F.nx,F.ny-3,14);}}
    F.acc.roc+=5*F.hs*dt;while(F.acc.roc>=1){F.acc.roc--;fgBoom(F,'roc');}}
  for(const p of F.pt){p.age+=dt;p.vy+=p.g*dt;const k=Math.max(0,1-p.drag*dt);p.vx*=k;if(p.type==='sm')p.vy*=k;p.x+=p.vx*dt;p.y+=p.vy*dt;
    if(p.type==='ch'&&F.ph<3&&p.y>2&&p.y<F.D0-1){const c=fgTrace(F,p.y);if(Math.abs(p.x-c)>FG_R){p.x=c+Math.sign(p.x-c)*FG_R;p.vx*=-.5;}}}
  F.pt=F.pt.filter(p=>p.age<p.life);
  const tgt=F.d-(F.ph>=2?.6:F.jeu?.3:.62)*F.R,tg0=-.62*F.R;   // mini-jeu : la foreuse est tenue en haut de l'écran, pour voir venir les mines
  if(F.ph===0)F.camY=tg0;else F.camY+=((F.ph===1?Math.max(tgt,tg0):tgt)-F.camY)*Math.min(1,dt*(F.ph===1?3.4:4.8));
  F.camX+=(F.cx-F.camX)*Math.min(1,dt*2.6);
  if(F.snd){const sp=Math.min(1,F.vy/22),ig=Math.min(1,t/1.6);
    F.snd.update({vol:F.ph===0?.55*ig:F.ph===1?.9:F.ph===2?.5:F.ph===3?.14:0,rum:.18+.5*F.hs+(F.ph===0?.25*ig:0)+F.imp*.5,rumF:90+F.hs*190+F.imp*260,
      grind:F.ph===1?.1+.3*F.hs+.04*sp:F.ph===0?.04*ig:0,grindF:700+F.hs*1700+sp*400,rot:14+sp*10+(F.ph===0?6*ig:0),mot:.05+.05*sp+(F.ph===0?.07*ig:0),motF:36+ig*10+sp*38+F.hs*8});}
  if(!F.sansRendu)fgDraw(F,t);   // sansRendu : pour rejouer la scène en accéléré dans les essais (outils/scripts/test-forage.js)
  if(F.ph===4&&t>=F.tFade+F.fadeLen){endForage();return;}
  requestAnimationFrame(forageFrame);}
const fgGlyph=(F,ch,col)=>{let A=F.atl[col];if(!A)A=F.atl[col]={};let g=A[ch];
  if(!g){g=document.createElement('canvas');g.width=F.cw;g.height=F.chh;const x=g.getContext('2d');x.font=F.font;x.textAlign='center';x.textBaseline='middle';x.fillStyle=col;x.fillText(ch,F.cw/2,F.chh/2);A[ch]=g;}
  return g;};
const fgPut=(F,xw,yw,ch,col)=>F.x.drawImage(fgGlyph(F,ch,col),Math.round((xw-F.camX)*F.cw+F.w/2),Math.round((yw-F.camY)*F.chh));
/* La foreuse, tournée d'un angle quelconque : on balaie les cases de l'écran autour du nez et, pour chacune, on
   remonte à la case du dessin par la rotation inverse (donc jamais de trou). Au-delà de 45 degrés, chaque
   caractère est remplacé par son équivalent tourné d'un quart de tour. */
function fgDrill(F,t){const th=F.th*Math.PI/180,co=Math.cos(th),si=Math.sin(th),
    tab=F.th>45?FG_RG:F.th<-45?FG_RD:null,
    fr=Math.floor(t*(F.ph===0?10+Math.min(1,t/FG_T0)*14:F.ph===1?26:F.ph===2?14:3)),
    jx=F.hs>.5?(fgH(F,Math.floor(t*14),7,0)-.5)*2*(F.hs-.3)*1.2:0;
  let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
  for(const q of [[-3.3,-14.6],[3.3,-14.6],[-3.3,.6],[3.3,.6]]){const ex=q[0]*co+q[1]*si,ey=-q[0]*si+q[1]*co;
    x0=Math.min(x0,ex);x1=Math.max(x1,ex);y0=Math.min(y0,ey);y1=Math.max(y1,ey);}
  for(let j=Math.floor(y0)-1;j<=Math.ceil(y1)+1;j++)for(let i=Math.floor(x0/.6)-1;i<=Math.ceil(x1/.6)+1;i++){
    const ex=i*.6,lx=ex*co-j*si,ly=ex*si+j*co,c=Math.round(lx/.6+5),r=Math.round(ly+14);
    if(r<0||r>14||c<0||c>10)continue;
    let ch=FG_ART[r][c];if(ch===' ')continue;
    let col=F.pal[FG_MSK[r][c]];
    if(r>=7&&r<=13&&ch==='▓'){const ph=(c+r*2+fr)&3;ch=ph<2?'▓':'▒';col=ph<2?F.pal.w:F.pal.g;}
    else if(r===3&&ch==='◉')col=(Math.floor(t*3)&1)||F.ph>=2?F.pal.o:F.pal.b;
    else if(r===14&&F.ph===1)col=(Math.floor(t*20)&1)?'#fff':F.pal.o;
    if(tab&&tab[ch])ch=tab[ch];
    fgPut(F,F.nx+i+jx,F.ny+j,ch,col);}}
function fgDraw(F,t){const x=F.x,{w,h,cw,chh,dpr}=F;
  x.setTransform(1,0,0,1,0,0);x.fillStyle='#000';x.fillRect(0,0,w,h);
  const amp=(F.ph===0?1.4*Math.min(1,t/FG_T0):F.ph===1?1.4+F.hs*4.2:F.ph===2?2.2:.6)*dpr+F.imp*16*dpr;
  x.save();x.translate(Math.round((Math.random()-.5)*2*amp),Math.round((Math.random()-.5)*2*amp));
  const r0=Math.floor(F.camY),c0=Math.floor(F.camX)-((F.C/2)|0);
  for(let r=-1;r<=F.R;r++){const y=r0+r,py=Math.round((y-F.camY)*chh);
    for(let c=0;c<F.C;c++){const xw=c0+c;if(fgCell(F,xw,y))x.drawImage(fgGlyph(F,F.oc,F.ok),Math.round((xw-F.camX)*cw+w/2),py);}}
  for(const m of F.mines){if(!m.ok)continue;const py=Math.round((m.y-F.camY)*chh);if(py<-2*chh||py>h+chh)continue;   // mine : un pavé plein de 7 × 3 caractères, rouge et blanc en alternance, bien plus gros que les filons de la roche
    const px=Math.round((m.x-3-F.camX)*cw+w/2),on=Math.floor(t*6+m.x)&1,A=on?'#ffffff':'#ff3b30',B=on?'#ff3b30':'#ffffff';
    x.fillStyle='#000';x.fillRect(px-cw,py-2*chh,cw*9,chh*5);x.fillStyle=A;x.fillRect(px,py-chh,cw*7,chh*3);x.fillStyle='#000';x.fillRect(px+cw,py,cw*5,chh);
    fgPut(F,m.x-1,m.y,'▓',B);fgPut(F,m.x,m.y,'●',B);fgPut(F,m.x+1,m.y,'▓',B);}
  for(const A of F.amasL||[]){if(!A.c)continue;const py0=Math.round((A.y-F.camY)*chh);if(py0<-5*chh||py0>h+5*chh)continue;   // amas de Matière : taches irrégulières, couleur accent, éclats blancs qui scintillent
    for(const c of A.c){if(!c.ok)continue;const px=Math.round((c.x-F.camX)*cw+w/2),py=Math.round((c.y-F.camY)*chh);x.fillStyle='#000';x.fillRect(px,py,cw,chh);
      const k=(c.x*7+c.y*13)&3,br=k===0&&((Math.floor(t*5)+c.x+c.y*3)%5===0);fgPut(F,c.x,c.y,k===0?'◆':k===1?'▓':'█',br?F.pal.w:F.pal.a);}}
  fgDrill(F,t);
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
    cap=F.ph!==1?'—':F.th<-2?'◄'.repeat(Math.min(3,1+Math.round(-F.th/9))):F.th>2?'►'.repeat(Math.min(3,1+Math.round(F.th/9))):'▼',
    rpm=F.ph===0?Math.round(400+2600*Math.min(1,t/FG_T0)):fall?Math.max(0,Math.round(3200*(1-(t-F.tF)/2))):Math.round(2300+900*F.hs);
  const L=[['FORAGE ▸ SÉQUENCE DE DESCENTE',F.pal.a],[`NIVEAU     ${F.niv} → ${F.niv+1}`,F.pal.g],[`PROFONDEUR ${esp(Math.round(F.d*8.5))} m`,F.pal.g],
    [`MATIÈRE    ${fall?'CAVERNE':F.ph===0?'SURFACE':M.n}`,F.ph===1&&M.d>2.5?F.pal.o:F.pal.g],
    [`DURETÉ     ${'▮'.repeat(nd)}${'▯'.repeat(5-nd)}`,F.pal.g],[`CAP        ${cap}`,F.pal.g],[`ROTATION   ${esp(rpm)} tr/min`,F.pal.g]];
  {const st=typeof G!=='undefined'&&G&&G.st;if(st){const v=Math.max(0,Math.round(st.vie)),mx=Math.max(1,Math.round(st.vieMax||100)),n=Math.max(0,Math.min(10,Math.ceil(v*10/mx)));   // la vie de la foreuse, à toutes les descentes
      L.push([`VIE        ${'▮'.repeat(n)}${'▯'.repeat(10-n)} ${v}/${mx}`,v*4<=mx?'#ff5a4a':v*2<=mx?F.pal.o:F.pal.w]);}}
  if(F.jeu){L.push([`MINES      ${F.touche} touchée${F.touche>1?'s':''}`,F.touche?F.pal.o:F.pal.g]);
    if(F.ph===1&&Math.floor(t*5)%2===0&&F.mines.some(m=>m.ok&&m.y>F.d&&m.y<F.d+F.R*.7&&Math.abs(m.x-F.cx-F.vx*(m.y-F.d)/Math.max(6,F.vy))<FG_R))L.push(['▲ MINE SUR LA ROUTE ▸ ÉCARTEZ-VOUS','#ff5a4a']);
    if(F.mort)L.push(['FOREUSE DÉTRUITE','#ff5a4a']);}
  if(!F.jeu&&F.amasY){const A=F.amas;L.push([`RÉCOLTE    ${F.recolte?'+'+F.recolte+' matière':'0'}`,F.recolte?F.pal.a:F.pal.g]);
    if(F.recolte&&F.t-F.tRec<1.2&&Math.floor(t*6)%2===0)L.push([`◆ MATIÈRE RÉCOLTÉE ▸ +${F.recolte}`,F.pal.a]);
    else if(F.ph===1&&A&&A.ok&&A.y>F.d-1&&Math.floor(t*4)%2===0)L.push(['◆ AMAS DE MATIÈRE EN VUE ▸ PASSEZ DESSUS',F.pal.a]);}
  if(F.ph===1&&F.evit>1.7&&Math.floor(t*4)%2===0)L.push(['▲ MASSE DURE DEVANT ▸ CONTOURNEMENT',F.pal.o]);
  if(F.ph===2&&Math.floor(t*5)%2===0)L.push(['ALERTE ▸ PERTE DE SUPPORT','#ff5a4a']);
  if(F.ph>=3)L.push(['IMPACT ▸ ARRIVÉE AU NIVEAU SUIVANT',F.pal.o]);
  {let lg=0;for(const l of L)lg=Math.max(lg,x.measureText(l[0]).width);x.fillStyle='#000';x.fillRect(m-Math.round(8*dpr),m-Math.round(8*dpr),Math.round(lg)+Math.round(16*dpr),L.length*lh+Math.round(12*dpr));}   // fond noir plein : le texte reste lisible sur la roche
  L.forEach((l,i)=>{x.fillStyle='#000';x.fillText(l[0],m+1,m+i*lh+1);x.fillStyle=l[1];x.fillText(l[0],m,m+i*lh);});
  if(F.ph<=1){const aide=F.jeu?'◄ ►  Q D  4 6   ÉVITER LES MINES':'◄ ►  Q D  4 6   DIRIGER LA FOREUSE';x.fillStyle='#000';x.fillRect(m-Math.round(8*dpr),h-m-fs-Math.round(6*dpr),Math.round(x.measureText(aide).width)+Math.round(16*dpr),fs+Math.round(12*dpr));x.fillStyle=F.ph===0?F.pal.g:F.pal.d;x.fillText(aide,m,h-m-fs);}
  // annonce en gros, au début de la séquence (22 novembre 2026) : ce que la descente réserve
  if(t<FG_ANNONCE){const [l1,l2]=F.jeu?['EXPLOSIFS DÉTECTÉS','ATTENTION SOUS-SOL PIÉGÉ !']:['MATIÈRE {µ} DÉTECTÉE','COLLECTE POSSIBLE'],col=F.jeu?'#ff3b30':F.pal.a,on=t<.25||Math.floor(t*4)%2===0||t>1.2;
    let g=Math.round(Math.min(h/11,w/15));x.font=`700 ${g}px ${FG_FONT}`;const lw=Math.max(x.measureText(l1).width,x.measureText(l2).width);if(lw>w*.9){g=Math.floor(g*w*.9/lw);x.font=`700 ${g}px ${FG_FONT}`;}
    const L2=Math.max(x.measureText(l1).width,x.measureText(l2).width),bh=Math.round(g*2.9),by=Math.round(h*.5-bh/2),u=Math.max(2,Math.round(3*dpr));
    x.fillStyle='#000';x.fillRect(0,by,w,bh);x.fillStyle=col;x.fillRect(0,by,w,u);x.fillRect(0,by+bh-u,w,u);
    if(on){x.textAlign='center';x.textBaseline='middle';x.fillStyle=col;x.fillText(l1,Math.round(w/2),by+Math.round(bh*.32));x.fillStyle=F.pal.w;x.fillText(l2,Math.round(w/2),by+Math.round(bh*.72));}
    x.textAlign='left';x.textBaseline='top';x.font=`${fs}px ${FG_FONT}`;}
  // coupe : les matières de fond du niveau, et le repère de profondeur
  const sw=Math.round(8*dpr),sx=w-m-sw,st=Math.round(h*.22),sh=Math.round(h*.5),B=F.P.b;
  B.forEach((e,i)=>{const y0=st+sh*e[0],y1=st+sh*(i+1<B.length?B[i+1][0]:1);x.fillStyle=F.mc[e[1]][1];x.fillRect(sx,Math.round(y0),sw,Math.max(1,Math.round(y1-y0)));});
  x.fillStyle='#2a1c1c';x.fillRect(sx,st+sh,sw,Math.round(sh*FG_CAV/F.D0*.5));
  const my=st+sh*Math.min(1,F.d/F.D0);x.fillStyle='#fff';x.fillRect(sx-Math.round(6*dpr),Math.round(my)-1,sw+Math.round(12*dpr),Math.max(2,Math.round(2*dpr)));
  x.textAlign='right';x.fillStyle=F.pal.g;x.fillText('COUPE',sx+sw,st-lh);}
