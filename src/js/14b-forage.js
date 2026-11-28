/* ---------- Cinématique de forage (21 novembre 2026, environ 15 s) ----------
   Pour le passage au niveau suivant. Vue de côté, tout en caractères ASCII (comme les dessins d'équipement).
   La foreuse démarre couchée à l'horizontale sur le sol, se cabre, plante son nez et plonge à la verticale ;
   à l'arrivée elle touche le fond, bascule sur le côté et se recouche à l'horizontale. Le dessin est tourné en
   échantillonnant la grille de caractères (aucun lissage), et les caractères de cadre sont remplacés par leur
   équivalent tourné d'un quart de tour au-delà de 45 degrés : la machine reste en ASCII à tous les angles.
   La roche n'est pas en bandes : c'est un champ en deux dimensions, des lentilles de matières entremêlées, avec
   de grosses masses de roche dure semées dedans. Devant une masse, la foreuse pivote d'elle-même pour la
   contourner ; le joueur l'aide avec les flèches, Q et D, ou 4 et 6 du pavé numérique (ou le doigt sur l'écran).
   playForage(suite, niv) lance la scène et appelle suite() à la fin ; NIV2 et NIV3 la lancent pour l'essayer (F9 ne la lance plus depuis le 23 novembre 2026).
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
const FG_AMAS_PRES=3,FG_AMAS_LOIN=16;
// une tache irrégulière de n cases autour de (x,y) : on part d'une case et on ajoute au hasard une voisine libre, plus souvent sur les côtés
function fgAmasForme(x,y,n){const c=[{x,y,ok:1}],vu=new Set([x+','+y]);let g=0;
  while(c.length<n&&g++<900){const b=c[(Math.random()*c.length)|0],r=Math.random(),dx=r<.35?-1:r<.7?1:0,dy=dx?0:(Math.random()<.5?-1:1),
    X=b.x+dx,Y=b.y+dy,k=X+','+Y;
    if(vu.has(k)||Math.abs(Y-y)>3)continue;vu.add(k);c.push({x:X,y:Y,ok:1});}
  return c;}
/* La foreuse (26 novembre 2026 : réduite de 11 × 15 à 9 × 11 cases, sans ses deux nacelles latérales, quand les descentes
   sont passées à 40 rangées : elle aurait pris près de 40 % de la hauteur). FG_AC : colonne de l'axe ; FG_AB : rangée du nez. */
const FG_ART=[
  "  ▄▄▄▄▄  ",
  " ▐█▀▀▀█▌ ",
  "╔╧═════╧╗",
  "║ ◉ ▒▒▒ ║",
  "╠═══════╣",
  "║░░░░░░░║",
  "╚╗▓▓▓▓▓╔╝",
  " ╲▓▓▓▓▓╱ ",
  "  ╲▓▓▓╱  ",
  "   ╲▓╱   ",
  "    ▼    "];
const FG_MSK=[   // d gris sombre · g gris · w blanc · a accent (couleur 1) · b couleur 2 · o ambre
  "ddddddddd","ggggggggg","ggggggggg","ggogaaagg","ggggggggg","gaaaaaaag","ggwwwwwgg",
  "ggwwwwwgg","gggwwwggg","ggggwgggg","ooooooooo"];
const FG_AC=(FG_ART[0].length-1)/2,FG_AB=FG_ART.length-1,FG_AOEIL=FG_ART.findIndex(l=>l.includes('◉'));
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
const FG_ENT=.8,FG_ANN_T0=1,FG_ANN_T1=3,FG_ANNONCE=8,FG_T0=2.5,FG_PLG=1.3,FG_CAV=34,FG_R=5,FG_POSE=2.6,
  FG_FONT='"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace';
/* Mini-jeu des mines (26 novembre 2026, avec le passage à 40 rangées) : descente ralentie de 15 %, la foreuse réagit plus
   vite (accélération 52 → 64, vitesse de côté 24 → 28, commande prise en compte plus tôt). */
const FG_JEU_VIT=.85,FG_JEU_ACC=64,FG_JEU_VMAX=28;
const FG_SMOKE=['#c4cdd0','#9aa5a9','#737f84','#4d585d','#2e373b'];
let FORAGE=null,FG_CB=null;
/* Profondeur du haut de chaque niveau, en mètres (22 novembre 2026) : 0 au niveau 1, puis la fin de chaque descente (le
   perçage et la chute dans la caverne, (D0 + FG_CAV) × 8,5 m). Le compteur PROFONDEUR des descentes part de là, et la
   Carte de la colonne affiche la même valeur : les chiffres se suivent d'un écran à l'autre. */
const FG_M=8.5;
function profNiv(n){let d=0;for(let k=1;k<(n||1);k++){const P=FG_NIV[Math.min(FG_NIV.length-1,k-1)];
  d+=Math.round((P.D0+FG_CAV)*FG_M);}return d;}
const fgCv=$('forageCv'),fgx=fgCv.getContext('2d');
function fgMix(hex,k){const m=/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex)||['','b5','c2','c6'],
  v=i=>Math.max(0,Math.min(255,Math.round(parseInt(m[i],16)*k)));return `rgb(${v(1)},${v(2)},${v(3)})`;}
function fgH(F,x,y,k){let h=(x*374761393+y*668265263+(k||0)*1442695041+F.seed)|0;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;
  return (h>>>0)/4294967296;}
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
/* Palettes (23 novembre 2026) : les roches passent de la palette du départ (F.palA) à celle du niveau d'arrivée (F.palB) pendant la
   descente. FG_PS paliers de profondeur, une table de couleurs par palier. La foreuse garde les couleurs du départ. */
const FG_PS=14;
function fgLerp(a,b,u){const p=h=>{const m=/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(h)||['','b5','c2','c6'];return [1,2,3].map(i=>parseInt(m[i],16));},
  A=p(a),B=p(b);return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*u).toString(16).padStart(2,'0')).join('');}
// le gris des roches prend un peu de la couleur monde de la palette
const fgGris=pal=>fgLerp('#b5c2c6',pal['3']||'#b5c2c6',.38);
function fgStart(){const F=FORAGE,pa=F.palA,pb=F.palB,bas=(p,k)=>({'1':p['1'],'2':p['2'],'3':p['3'],g:fgGris(p)}[k]);
  F.mcT=[];for(let s=0;s<FG_PS;s++){const u=s/(FG_PS-1),base={};for(const k of ['1','2','3','g'])base[k]=fgLerp(bas(pa,k),bas(pb,k),u);
    F.mcT.push(FG_MAT.map(M=>[fgMix(base[M.k[0]],M.k[1]*.74),fgMix(base[M.k[0]],M.k[1]),fgMix(base[M.k[0]],Math.min(1.3,M.k[1]*1.25))]));}
  F.D0=F.P.D0;F.fl=F.D0+FG_CAV;F.oreCol=fgMix(pa['1'],1.35);F.cDim=fgMix(fgGris(pa),.26);F.cRock=fgMix(fgGris(pb),.24);
    F.cRock2=fgMix(fgGris(pb),.42);
  F.pal={a:fgMix(pa['1'],1.15),b:fgMix(pa['2'],1.1),d:'#6b7a80',g:'#a9b6ba',w:'#f2f7f8',o:'#ffb347'};
  F.tr=new Float32Array(F.D0+4).fill(NaN);F.tr[0]=F.cx;}
const fgMC=(F,y)=>F.mcT[Math.max(0,Math.min(FG_PS-1,Math.floor(y/F.D0*FG_PS)))];
// le centre du puits à la ligne y (interpolé), ou la position actuelle si rien n'est encore creusé
function fgTrace(F,y){if(y<=0)return F.tr[0];if(y>=F.d)return F.cx;
  const i=Math.floor(y),a=F.tr[Math.min(i,F.D0)],b=F.tr[Math.min(i+1,F.D0)];
  if(isNaN(a))return F.cx;return isNaN(b)?a:a+(b-a)*(y-i);}
const fgCreuse=(F,y)=>{const i=Math.max(0,Math.min(F.D0,Math.round(y)));if(isNaN(F.tr[i])){F.tr[i]=F.cx;fgFond(F,i);}};
  /* la rangée percée fond (fgFond) */
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
  if(y>=F.fl){const k=y-F.fl;F.oc=k===0?(fgH(F,x,y,11)<.5?'▓':'█'):['█','▓','█','▒'][Math.floor(fgH(F,x,y,12)*4)];
    F.ok=k===0?F.cRock2:F.cRock;return true;}
  if(y<2){if(fgH(F,x,y,14)>.85)return false;F.oc=y?'▒':['"',';',"'",'^'][Math.floor(fgH(F,x,y,15)*4)];F.ok=F.mcT[0][0][2];return true;}
  const c=F.tr[Math.min(F.D0,y)];if(!F.sansTrou&&!isNaN(c)&&Math.abs(x-c)<=FG_R-(fgH(F,x,y,5)<.3?1:0))return false;
  const mi=fgMat(F,x,y),M=FG_MAT[mi];
  if(fgH(F,x,y,2)>M.dn)return false;
  F.oc=M.ch[Math.floor(fgH(F,x,y,4)*M.ch.length)];
  F.ok=fgMC(F,y)[mi][fgMat(F,x,y-1)!==mi?2:Math.floor(fgH(F,x,y,6)*3)];
  if(M.ore&&fgH(F,x,y,16)<M.ore){F.oc=M.oreCh;F.ok=(Math.floor(F.t*4+fgH(F,x,y,17)*5)%5===0)?'#fff':F.oreCol;}
  return true;}
function fgEmit(F,o){if(F.pt.length<420)F.pt.push(Object.assign({age:0,g:0,drag:0,sd:(Math.random()*999)|0},o));}
const fgRnd=(a,b)=>a+Math.random()*(b-a);
function fgSmoke(F,x,y,vx,vy,life,r0,gr){fgEmit(F,{type:'sm',x,y,vx,vy,life,r0,gr,drag:.6,col:FG_SMOKE[(Math.random()*3)|0]});}
const fgIci=F=>fgMat(F,Math.round(F.cx),Math.max(0,Math.min(F.D0-1,Math.round(F.d))));
function fgChips(F,n,x,y,spread,up,g,mi,col){const k=mi==null?fgIci(F):mi,M=FG_MAT[k];
  for(let i=0;i<n;i++)fgEmit(F,{type:'ch',x:x+fgRnd(-spread,spread)*.5,y:y+fgRnd(-1,1),vx:fgRnd(-spread,spread),vy:up<0?fgRnd(up,up*.35):fgRnd(up*.2,up),g,life:fgRnd(.7,1.5),
    ch:M.ch[(Math.random()*M.ch.length)|0],col:col||fgMC(F,y)[k][(Math.random()*3)|0]});}
function fgSparks(F,n,x,y,s){for(let i=0;i<n;i++)fgEmit(F,{type:'ch',x:x+fgRnd(-3,3),y,vx:fgRnd(-s,s),vy:-fgRnd(5,15),g:22,life:fgRnd(.25,.6),ch:'*+·'[(Math.random()*3)|0],col:Math.random()<.5?'#ffe9a8':'#ffffff'});}
/* ---- son : synthèse Web Audio (moteur, grincement, grondement) ---- */
function fgSound(){const a=audio();if(!a)return null;
  const buf=a.createBuffer(1,a.sampleRate*2,a.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  const out=a.createGain();out.gain.value=0;out.connect(MASTER);
  const nz=()=>{const s=a.createBufferSource();s.buffer=buf;s.loop=true;s.start();return s;};
  const r=nz(),rf=a.createBiquadFilter(),rg=a.createGain();rf.type='lowpass';rf.frequency.value=120;rg.gain.value=0;r.connect(rf);
    rf.connect(rg);rg.connect(out);
  const g=nz(),gf=a.createBiquadFilter(),gg=a.createGain(),lfo=a.createOscillator(),lg=a.createGain();gf.type='bandpass';
    gf.frequency.value=900;gf.Q.value=1.4;gg.gain.value=0;
  lfo.frequency.value=17;lg.gain.value=0;lfo.connect(lg);lg.connect(gg.gain);lfo.start();g.connect(gf);gf.connect(gg);gg.connect(out);
  const m=a.createOscillator(),mf=a.createBiquadFilter(),mg=a.createGain();m.type='sawtooth';m.frequency.value=40;mf.type='lowpass';
    mf.frequency.value=260;mg.gain.value=0;
  m.connect(mf);mf.connect(mg);mg.connect(out);m.start();
  const set=(p,v,k)=>p.setTargetAtTime(v,a.currentTime,k||.08);
  return {update(o){set(out.gain,o.vol);set(rg.gain,o.rum);set(rf.frequency,o.rumF);set(gg.gain,o.grind*.5);set(lg.gain,o.grind*.5);
    set(gf.frequency,o.grindF);set(lfo.frequency,o.rot);set(mg.gain,o.mot);set(m.frequency,o.motF);},
    stop(){set(out.gain,0,.15);setTimeout(()=>{try{r.stop();g.stop();m.stop();lfo.stop();}catch(e){}},700);}};}
function fgBoom(F,k){
  if(k==='start'){tone(55,1.6,'sawtooth',.16,140);noiz(1.4,.12,300,'lowpass',0,900);}
  else if(k==='plonge'){noiz(.8,.3,500,'lowpass',0,120);tone(140,.5,'sawtooth',.14,70);}
  else if(k==='strate'){noiz(.25,.2,900,'bandpass');tone(300,.12,'square',.04,150);}
  else if(k==='roc'){noiz(.07,.16,400+Math.random()*700);}
  else if(k==='perce'){noiz(1.4,.45,1200,'lowpass',0,80);tone(110,.9,'sawtooth',.2,30);}
  else if(k==='impact'){noiz(1.8,.6,700,'lowpass',0,50);tone(75,.7,'sine',.5,25);tone(180,.35,'triangle',.12,90,.05);
    for(let i=0;i<7;i++)noiz(.05,.09,3000,'highpass',.3+Math.random()*1.2);}
  else if(k==='couche'){noiz(1.1,.45,420,'lowpass',0,60);tone(85,.5,'sine',.32,38);noiz(.3,.14,2200,'highpass',.05);}
  else if(k==='petit'){noiz(.5,.25,500,'lowpass',0,60);tone(95,.3,'sine',.25,40);}}
/* Décor du plancher (23 novembre 2026). En haut de la descente, le plancher montre l'endroit où l'on fore ; en bas, celui du niveau
   d'arrivée. La carte (vue de dessus) est lue en coupe, sur une bande de cinq rangées autour de la foreuse, puis dressée de côté :
   une case de carte = FG_TW colonnes, un mur = FG_HM rangées. Murs et toit du bâtiment en couleur bâti, machines et roches en couleur
   monde, la porte percée dans le mur. fgCoupe rend des cellules {x (colonnes depuis la foreuse), h (rangées au-dessus du sol), ch, c}. */
const FG_TW=4,FG_HM=14,FG_DM=22,FG_EAU_BAS=3,FG_EAU_FOND=7;   // profondeur de l'eau en cases : hauts-fonds, eau profonde
const FG_MACH=new Set([MACHINE,ANTENNA,TERMINAL,TURRET,PYLON,PILE,FABRIC,LEVIER,GRILLE,STATION,CHARGEUR]);
function fgCoupe(cx,cy){
  const T=(x,y)=>x<0||y<0||x>=W||y>=H?GROUND:G.t[idx(x,y)],col=[],cells=[],vu=new Set();
  const put=(x,h,ch,c)=>{const k=x+','+h;if(vu.has(k))return;vu.add(k);cells.push({x,h,ch,c});};
  const hs=(a,b)=>{let v=(a*374761393+b*668265263)|0;v=Math.imul(v^(v>>>13),1274126177);return ((v^(v>>>16))>>>0)/4294967296;};
  for(let d=-FG_DM;d<=FG_DM;d++){const k={b:0,porte:0,sol:0,m:0,ant:0,r:0};
    for(let j=-2;j<=2;j++){const v=T(cx+d,cy+j),c=j===0;   // murs, portes et sol : la rangée de la foreuse seule ; machines : une rangée de chaque côté
      if(c&&bati(v))k.b=1;else if(c&&v===DOOR)k.porte=1;else if(c&&v===FLOOR)k.sol=1;
      else if(Math.abs(j)<=1&&v===GRASS)k.herbe=1;
      else if(Math.abs(j)<=1&&v===LIQ)k.eau=Math.max(k.eau||0,FG_EAU_BAS);
      else if(Math.abs(j)<=1&&v===DEEP)k.eau=FG_EAU_FOND;
      else if(Math.abs(j)<=1&&(v===ANTENNA||v===PYLON))k.ant=1;else if(Math.abs(j)<=1&&FG_MACH.has(v))k.m=1;
      else if(v===HARD)k.r=Math.max(k.r,7);else if(v===MOUNT)k.r=Math.max(k.r,5);else if(v===ROCK)k.r=Math.max(k.r,3);}
    col.push(k);}
  const K=d=>col[d+FG_DM];let L=null,R=null;
  for(let d=0;d>=-FG_DM;d--)if(K(d).b){L=d;break;}
  for(let d=0;d<=FG_DM;d++)if(K(d).b){R=d;break;}
  const dedans=L!==null&&R!==null&&R-L>=3,x0=d=>d*FG_TW-(FG_TW>>1);
  // murs, porte et toit
  for(let d=-FG_DM;d<=FG_DM;d++){const k=K(d);
    if(k.b||(dedans&&d>=L&&d<=R&&k.porte)){const bas=dedans&&d>=L&&d<=R?FG_HM:7,
        porte=k.porte&&(!dedans||(d>=L&&d<=R));
      for(let i=0;i<FG_TW;i++)for(let h=1;h<=bas;h++){
        if(porte&&h<=4){if(i===0||i===FG_TW-1)put(x0(d)+i,h,'▌▐'[i?1:0],'b');else put(x0(d)+i,h,'▒','b');continue;}
        if(porte&&h===5){put(x0(d)+i,h,'▀','b');continue;}
        put(x0(d)+i,h,(h+i)&1?'▓':'█','b');}}}
  if(dedans)for(let x=x0(L)-1;x<=x0(R)+FG_TW;x++){put(x,FG_HM+1,'█','b');put(x,FG_HM+2,'▀','b');}
  // machines : au plus deux ensembles, les plus proches (pas sous la foreuse)
  const gr=[];for(let d=-FG_DM;d<=FG_DM;d++){const k=K(d);if(Math.abs(d)<=2||!(k.m||k.ant))continue;
    const g=gr[gr.length-1];if(g&&g.f===d-1&&!!g.ant===!!k.ant&&!(g.n>=2))g.f=d,g.n++;else gr.push({d0:d,f:d,n:1,ant:k.ant});}
  gr.sort((a,b)=>Math.abs(a.d0)-Math.abs(b.d0));
  for(const g of gr.slice(0,2)){const xa=x0(g.d0),xb=x0(g.f)+FG_TW-1;
    if(g.ant){const xm=(xa+xb)>>1;for(let h=1;h<=8;h++)put(xm,h,h===8?'╤':'│','m');put(xm-1,5,'─','m');put(xm+1,5,'─','m');
      for(let x=xa;x<=xb;x++)put(x,1,'▄','m');}
    else for(let x=xa;x<=xb;x++)for(let h=1;h<=5;h++)put(x,h,h===5?'▄':(x+h)&1?'▓':'█','m');}
  // roches alentour : une crête, lissée d'une case à l'autre pour qu'elle ondule au lieu de former des dalles
  const hr=[];for(let d=-FG_DM;d<=FG_DM;d++){const k=K(d);hr.push(k.b||(dedans&&d>=L&&d<=R)?0:k.r?k.r*1.5:0);}
  for(let d=-FG_DM;d<=FG_DM;d++){const j=d+FG_DM;if(!hr[j])continue;
    const moy=(hr[j]*2+(hr[j-1]||0)+(hr[j+1]||0))/4;
    for(let i=0;i<FG_TW;i++){const x=x0(d)+i,hh=Math.max(1,Math.round(moy+hs(x,7)*3-1.5));
      for(let h=1;h<=hh;h++){const prof=hh-h;   // du sommet vers le bas : la roche s'épaissit
        put(x,h,prof===0?'▀':prof===1?(hs(x,h+3)<.5?'░':'▒'):prof<4?'▒':'▓','m');}}}
  /* Herbes : de hautes tiges, pas des touffes au ras du sol (24 novembre 2026, demande de l'utilisateur) — 2 à 6 rangées,
     droites ou penchées, avec un épi au sommet ; des trous pour que la rangée ne fasse pas un mur. */
  const HERBE_EPI='¤#*:',HERBE_PIED='│└┘';
  for(let d=-FG_DM;d<=FG_DM;d++){const k=K(d);if(!k.herbe||k.eau||k.b||(dedans&&d>=L&&d<=R)||hr[d+FG_DM])continue;
    for(let i=0;i<FG_TW;i++){const x=x0(d)+i,r=hs(x,21);if(r<.3)continue;
      const haut=2+Math.floor(hs(x,22)*5),pen=hs(x,23);
      for(let q=1;q<=haut;q++){
        const ch=q===haut?HERBE_EPI[Math.floor(hs(x,24+q)*4)]
          :q===1?HERBE_PIED[Math.floor(hs(x,25)*3)]
          :pen<.28?'/':pen>.72?'\\':'│';
        put(x,q,ch,'v');}}}
  /* L'eau (24 novembre 2026) : la surface sur la ligne de sol, et sa profondeur en dessous — trois cases pour les hauts-fonds,
     sept pour l'eau profonde, de plus en plus sombres et denses vers le fond. */
  {const ce=PAL['e']||PAL['3'];
   for(let d=-FG_DM;d<=FG_DM;d++){const k=K(d);if(!k.eau||k.b||(dedans&&d>=L&&d<=R))continue;
    for(let i=0;i<FG_TW;i++){const x=x0(d)+i,r=hs(x,31);
      put(x,0,r<.5?'~':'≈',ce);
      for(let q=1;q<k.eau;q++){const u=q/(k.eau-1);
        put(x,-q,u<.4?'▒':u<.75?'▓':'█',fgMix(ce,1-.72*u));}}}}
  return {cells,cb:PAL['5'],cm:PAL['3'],cv:PAL['2'],ce:PAL['e']||PAL['3']};}
/* Le décor est dessiné une seule fois dans son propre canevas, puis posé d'un bloc à chaque image : sinon ce sont deux mille
   caractères à retracer soixante fois par seconde. */
function fgDecorCv(F,D){if(D.img&&D.cwv===F.cw)return;
  let x0=1e9,x1=-1e9,h1=-1e9,h0=1e9;
  for(const c of D.cells){if(c.x<x0)x0=c.x;if(c.x>x1)x1=c.x;if(c.h>h1)h1=c.h;if(c.h<h0)h0=c.h;}
  if(!D.cells.length){D.img=null;D.cwv=F.cw;return;}
  const teinte=c=>c==='b'?D.cb:c==='v'?(D.cv||D.cm):c==='e'?(D.ce||D.cm):/^[#r]/.test(c)?c:D.cm;   // une case peut porter sa propre couleur
  const cv=document.createElement('canvas');cv.width=(x1-x0+1)*F.cw;cv.height=(h1-h0+1)*F.chh;const g=cv.getContext('2d');
  for(const c of D.cells){const px=(c.x-x0)*F.cw,py=(h1-c.h)*F.chh;
    g.fillStyle='#000';g.fillRect(px,py,F.cw,F.chh);g.drawImage(fgGlyph(F,c.ch,teinte(c.c)),px,py);}
  D.img=cv;D.cwv=F.cw;D.x0=x0;D.h1=h1;}
function fgDecor(F,D,gy,ox){if(!D)return;fgDecorCv(F,D);if(!D.img)return;
  const px=Math.round((ox+D.x0-F.camX)*F.cw+F.w/2),py=Math.round((gy-D.h1-F.camY)*F.chh);
  if(px>F.w||px+D.img.width<0||py>F.h||py+D.img.height<0)return;
  F.x.drawImage(D.img,px,py);}
function playForage(suite,niv,opt){
  if(reduced||FORAGE){suite&&suite();return;}
  unlock();if(typeof TRAV!=='undefined'&&TRAV)stopTravel();
  // même échelle aux deux descentes (22 novembre 2026 ; la première était plus zoomée, h ÷ 36) ; 40 rangées depuis le
  // 26 novembre 2026 (52 avant) : caractères plus gros, environ 20 % de calcul en moins par image (docs/mesures.md)
  const jeu=(niv||1)>=2,dpr=Math.min(devicePixelRatio||1,2),w=Math.round(innerWidth*dpr),h=Math.round(innerHeight*dpr),
    size=Math.max(9,Math.round(h/40)),chh=size,cw=Math.round(size*.6);
  fgCv.width=w;fgCv.height=h;
  FORAGE={x:fgx,w,h,dpr,cw,chh,font:`${size}px ${FG_FONT}`,R:Math.ceil(h/chh)+1,C:Math.ceil(w/cw)+3,
    P:FG_NIV[Math.max(0,Math.min(FG_NIV.length-1,(niv||1)-1))],niv:niv||1,
    jeu,mines:[],mNext:30,touche:0,perdu:0,stun:0,amas:null,amasY:0,amasL:[],recolte:0,
    seed:(Math.random()*1e9)|0,atl:{},pt:[],t0:performance.now(),last:performance.now(),t:0,ph:0,d:0,cx:0,vx:0,hs:0,evit:0,
    th:90,nx:0,ny:-FG_POSE,side:1,camX:0,camY:0,imp:0,flash:0,matPrev:-1,kl:0,kr:0,man:0,
    snd:fgSound(),acc:{ex:0,dust:0,chip:0,spark:0,roc:0},vy:0,ox:null};
  {const o=opt||{},pa=o.palA||Object.assign({},PAL);FORAGE.palA=pa;FORAGE.palB=o.palB||pa;FORAGE.decD=o.decD||null;FORAGE.decA=o.decA||null;}
  fgStart();FG_CB=suite||null;
  // première descente : les profondeurs des amas, proches et lointains, étalées sur toute la descente
  if(!jeu){const F=FORAGE,D=F.D0,l=[];
    for(let i=0;i<FG_AMAS_PRES;i++)l.push({y:Math.round(D*(.2+.6*(i+fgRnd(.15,.85))/FG_AMAS_PRES)),loin:0});
    for(let i=0;i<FG_AMAS_LOIN;i++)l.push({y:Math.round(D*(.1+.8*(i+fgRnd(.1,.9))/FG_AMAS_LOIN)),loin:i%2?1:-1});
    F.amasL=l.sort((a,b)=>a.y-b.y);F.amasY=l.find(a=>!a.loin).y;}
  FORAGE.camY=-FORAGE.R*.62;
  fgCv.hidden=false;$('forageSkip').hidden=false;$('forageSkip').textContent=jeu?`Échap : passer (−${FG_PASSE_DM} vie)`:'Échap : passer';
    fgBoom(FORAGE,'start');
  raf20(forageFrame);}
/* Descente complète (23 novembre 2026) : le décor du départ est lu sur la carte actuelle, le niveau d'arrivée est généré (palette tirée) AVANT la
   scène pour qu'on en voie le décor sur le plancher d'arrivée, puis la scène se joue par-dessus la partie déjà changée. prep : Lab (niveau forcé). */
function descendre(niv,hasard,prep){
  if(reduced||FORAGE){if(prep)prep();niveauSuivant(hasard);render();return;}
  const A=Object.assign({},PAL),dep=fgCoupe(G.px,G.py);
  if(prep)prep();niveauSuivant(hasard);
  const arr=fgCoupe(G.px,G.py);
  playForage(()=>{render();},niv,{palA:A,palB:Object.assign({},PAL),decD:dep,decA:arr});}
function skipForage(){const F=FORAGE;if(!F||F.ph>=4)return;
  // descente en aveugle : elle coûte, sans jamais tuer
  if(F.jeu&&F.ph<2&&typeof G!=='undefined'&&G&&G.st){const dm=Math.max(0,Math.min(FG_PASSE_DM,Math.floor(G.st.vie)-1));G.st.vie-=dm;
    F.perdu+=dm;F.passe=1;}
  F.ph=4;F.tFade=F.t;F.fadeLen=.35;}
/* Mines du mini-jeu. Elles naissent une par une, juste sous le bas de l'écran : sept sur dix sont visées sur la route de la foreuse
   (là où elle sera si elle ne tourne pas), les autres semées plus loin ; une fois sur quatre, une seconde mine vient à côté et ne
   laisse qu'un couloir. L'écart entre deux rangées se resserre avec la profondeur. Une mine saute dès qu'elle est dans le puits. */
/* Deux mines gardent au moins cinq cases de vide entre elles (24 novembre 2026 ; avant : elles se touchaient sans se chevaucher).
   Le pavé fait 7 colonnes sur 3 rangées, d'où 7+5 et 3+5 : toute nouvelle mine garde cet écart avec celles déjà posées, y compris
   celles des rangées précédentes. */
const FG_MDX=12,FG_MDY=8;
const fgMLibre=(F,x,y)=>!F.mines.some(m=>m.ok&&Math.abs(m.x-x)<FG_MDX&&Math.abs(m.y-y)<FG_MDY);
/* pose une mine en (x, y) ; si la place est prise, essaie un peu plus loin sur les côtés, puis renonce */
function fgMPose(F,x,y){
  for(let k=0;k<5;k++){const xx=x+(k?(k&1?1:-1)*FG_MDX*((k+1)>>1):0);
    if(fgMLibre(F,xx,y)){F.mines.push({x:xx,y,ok:1});return true;}}
  return false;}
function fgMines(F,dt){const bas=F.R*1.15;   // bien sous le bas de l'écran (0,7 R) : sinon la rangée apparaissait à vue (24 novembre 2026)
  while(F.mNext<F.D0-16&&F.d+bas>=F.mNext){const p=F.d/F.D0,vise=Math.random()<.7,
    x=Math.round(F.cx+F.vx*.9+(vise?fgRnd(-4,4):(Math.random()<.5?-1:1)*fgRnd(12,26)));
    fgMPose(F,x,F.mNext);
      if(Math.random()<.25)fgMPose(F,x+(Math.random()<.5?-1:1)*Math.round(fgRnd(15,19)),F.mNext+Math.round(fgRnd(-2,2)));
    // plus loin sur les côtés, sur toute la largeur de l'écran : des mines qui ne dépendent pas de la route de la foreuse (23 novembre 2026)
    for(let i=0,n=Math.random()<.5?0:1;i<n;i++){const sd=Math.random()<.5?-1:1,xf=Math.round(F.camX+sd*fgRnd(14,F.C*.5));
      if(Math.abs(xf-F.cx)<12)continue;fgMPose(F,xf,F.mNext+Math.round(fgRnd(-4,4)));}
    // rangées espacées quand la descente a été allongée de 5 secondes, pour ne pas doubler les dégâts
    F.mNext+=Math.round(fgRnd(13,19)*(1-.25*p));}   // rangées plus espacées : il y avait un peu trop de mines (24 novembre 2026)
  for(const m of F.mines){if(!m.ok||Math.abs(m.y-F.d)>1.4||Math.abs(m.x-F.cx)>FG_R-1)continue;m.ok=0;F.touche++;F.stun=.45;F.imp=1.6;
    fgBoom(F,'impact');fgExploseMine(F,m);   /* la mine explose comme la foreuse : cratère, onde de choc, éclats */
    for(let i=0;i<8;i++)fgSmoke(F,m.x+fgRnd(-4,4),m.y+fgRnd(-2,2),fgRnd(-9,9),fgRnd(-6,3),fgRnd(1.2,2),1,2.4);
    if(typeof G!=='undefined'&&G&&G.st){const dm=Math.min(FG_MINE_DM,G.st.vie);G.st.vie-=dm;F.perdu+=dm;
      if(G.st.vie<=0&&!F.mort){F.mort=1;F.ph=5;F.tMort=F.t;F.flash=0;F.imp=2.6;F.pt.length=0;fgExploseForeuse(F);fgBoom(F,'perce');}}}
  F.stun=Math.max(0,F.stun-dt);}
/* L’amas naît juste sous le bas de l’écran quand la foreuse approche de sa profondeur, de 9 à 13 cases à côté de là où elle va (côté au hasard) :
   il faut tourner un peu pour passer dessus. Il est récolté si le puits le touche (moitié de largeur du puits + 2 cases). */
function fgAmas(F){
  for(const A of F.amasL){
    // l'amas naît bien sous le bas de l'écran (0,7 R) : sinon on le voyait apparaître (24 novembre 2026)
    if(!A.c){if(F.d+F.R*1.15<A.y)continue;
      const sd=A.loin||(Math.random()<.5?-1:1);let ax=0;
      // les taches ne se posent pas l'une sur l'autre : on cherche une place libre avant de renoncer (23 novembre 2026)
      for(let k=0;k<6;k++){ax=Math.round(F.cx+F.vx*.6+sd*(A.loin?fgRnd(26,Math.max(30,F.C*.48)):fgRnd(9,14)));
        if(!F.amasL.some(O=>O!==A&&O.c&&Math.abs(O.y-A.y)<7&&Math.abs(O.c[0].x-ax)<11))break;ax=NaN;}
      if(isNaN(ax)){A.c=[];continue;}
      A.c=fgAmasForme(ax,A.y,FG_AMAS_MAT);if(!A.loin&&A.c.length)F.amas={x:A.c[0].x,y:A.y,ok:1,A};}
    if(Math.abs(A.y-F.d)>5)continue;
    for(const c of A.c){if(!c.ok||Math.abs(c.y-F.d)>1.3||Math.abs(c.x-F.cx)>FG_R+1)continue;   // le puits touche ce caractère : +1
      c.ok=0;F.recolte++;F.tRec=F.t;F.imp=Math.max(F.imp,.15);if(typeof G!=='undefined'&&G&&G.st)G.st.matiere=(G.st.matiere||0)+1;
      if(F.recolte%4===1)try{SFX.spot();}catch(e){}
      for(let i=0;i<3;i++)fgEmit(F,{type:'ch',x:c.x,y:c.y,vx:fgRnd(-14,14),vy:-fgRnd(4,14),g:26,life:fgRnd(.4,1),ch:'◆◇*·'[(Math.random()*4)|0],col:Math.random()<.35?F.pal.w:F.pal.a});}}
  if(F.amas&&F.amas.A)F.amas.ok=F.amas.A.c.some(c=>c.ok)?1:0;}
function endForage(){const F=FORAGE;if(F&&F.snd)F.snd.stop();FORAGE=null;fgCv.hidden=true;$('forageSkip').hidden=true;
  const cb=FG_CB;FG_CB=null;
  // détruite pendant la descente : pas de niveau suivant
  if(F&&F.mort){G.over={dead:true,forage:1};try{say('Une mine de trop : '+NOM_FOREUSE+' explose dans le puits.','warn');render();
    }catch(e){}dead();return;}
  try{render();}catch(e){}if(cb)cb();
  if(F&&F.recolte&&typeof G!=='undefined'&&G&&!G.over){try{sayMore(`Amas de Matière {µ} récolté pendant la descente : +${F.recolte} (réserve : ${G.st.matiere}).`,'good');
    render();}catch(e){}}
  if(F&&F.jeu&&typeof G!=='undefined'&&G&&!G.over){try{sayMore(F.passe?`Descente à l’aveugle : −${F.perdu} vie.`:F.touche?`Descente : ${F.touche} mine${F.touche>1?'s':''} touchée${F.touche>1?'s':''}, −${F.perdu} vie.`:'Descente sans une égratignure : aucune mine touchée.',F.perdu?'warn':'good');
    render();}catch(e){}}}
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
    F.vy=20*pousse*mont/Math.max(.5,dur*.85)*(F.stun>0?.35:1)*(F.jeu?FG_JEU_VIT:1);F.d+=F.vy*dt;
    // pivoter : sonder devant, à gauche et à droite, et glisser vers le plus tendre ; le joueur appuie dans le même sens ou contre
    const look=11,dc=fgSonde(F,F.cx,F.d+look),dl=fgSonde(F,F.cx-10,F.d+look),dr=fgSonde(F,F.cx+10,F.d+look);
    F.evit=dc;
    if(dc>1.5)F.vx+=(dl<dr?-1:1)*Math.min(3,dc-1.5)*24*dt;
    F.man+=((F.kr-F.kl)-F.man)*Math.min(1,dt*(F.jeu?11:8));F.vx+=F.man*(F.jeu?FG_JEU_ACC:28)*dt;   // mini-jeu : la foreuse répond plus vite
    F.vx*=Math.exp(-dt*2.4);F.vx=Math.max(F.jeu?-FG_JEU_VMAX:-16,Math.min(F.jeu?FG_JEU_VMAX:16,F.vx));F.cx+=F.vx*dt;
    if(F.jeu)fgMines(F,dt);else fgAmas(F);
    for(let y=Math.floor(dPrev);y<=Math.floor(F.d);y++)fgCreuse(F,y);
    F.nx=F.cx;F.ny=F.d;
    if(F.d>=F.D0){F.d=F.D0;F.ny=F.d;F.ph=2;if(F.ox==null)F.ox=Math.round(F.cx);F.tF=t;F.vy=Math.max(7,(F.d-dPrev)/dt);F.side=F.vx<-1?-1:1;F.vx*=.3;fgBoom(F,'perce');
      F.flash=.35;F.imp=.5;
      fgChips(F,70,F.cx,F.D0+1,9,4,34);
        for(let i=0;i<10;i++)fgSmoke(F,F.cx+fgRnd(-5,5),F.D0+fgRnd(0,3),fgRnd(-6,6),fgRnd(-1,5),fgRnd(1.4,2.2),1.1,2.2);}}
  else if(F.ph===2){F.vy+=55*dt;F.d+=F.vy*dt;F.cx+=F.vx*dt;F.vx*=Math.exp(-dt*3);F.nx=F.cx;F.ny=F.d;
    if(F.d>=F.fl){F.d=F.fl;F.ny=F.fl;if(!F.bounced){F.bounced=1;F.imp=1;F.flash=.55;fgBoom(F,'impact');F.vy=-F.vy*.2;
        fgChips(F,90,F.cx,F.fl-1,16,-17,32,2,F.cRock2);fgSparks(F,36,F.cx,F.fl-2,18);
        for(let i=0;i<24;i++){const sd=i%2?1:-1;
          fgSmoke(F,F.cx+sd*fgRnd(1,6),F.fl-fgRnd(.5,2),sd*fgRnd(3,16),-fgRnd(.3,2.4),fgRnd(1.2,2.1),.9,2.1);}}
      else{F.ph=3;F.tL=t;F.vy=0;F.imp=Math.max(F.imp,.3);fgChips(F,26,F.cx,F.fl-1,9,-9,28,2,F.cRock2);}}}
  // phase 3 : elle bascule sur le côté autour de son nez et se recouche à l'horizontale, avec un rebond amorti
  else if(F.ph===3){const u=t-F.tL,k=Math.min(1,u/.85),e=1-Math.pow(1-k,3),
      reb=k>=1?Math.exp(-(u-.85)*6)*Math.sin((u-.85)*20)*6:0;
    F.th=F.side*(90*e+reb);F.ny=F.fl-FG_POSE*e;F.nx=F.cx;
    if(k>=.78&&!F.couche){F.couche=1;F.imp=.8;fgBoom(F,'couche');
      const bx=F.cx-F.side*7;fgChips(F,34,bx,F.fl-1,11,-10,30,2,F.cRock2);
      for(let i=0;i<12;i++)fgSmoke(F,bx+fgRnd(-7,7),F.fl-fgRnd(.2,1.6),fgRnd(-8,8),-fgRnd(.3,1.8),fgRnd(1,1.7),.8,1.9);}
    if(u>=2.1){F.ph=4;F.tFade=t;F.fadeLen=.75;}}
  else if(F.ph===5){if(t-F.tMort>=FG_MORT){F.ph=4;F.tFade=t;F.fadeLen=.25;}}   // la foreuse a explosé : l'explosion se joue, puis le noir
  else if(F.ph===4&&F.tFade==null){F.tFade=t;F.fadeLen=.75;}
  const mi=fgIci(F),M=FG_MAT[mi],hT=F.ph===1?Math.min(1,(M.d-.5)/3):0;
  F.hs+=(hT-F.hs)*Math.min(1,dt*5);
  if(F.ph===1)F.th+=((Math.max(-25,Math.min(25,Math.atan2(F.vx,Math.max(2,F.vy))*180/Math.PI)))-F.th)*Math.min(1,dt*5);
  if(F.ph===1&&mi!==F.matPrev){if(F.matPrev>=0)fgBoom(F,'strate');F.matPrev=mi;}
  F.imp*=Math.exp(-dt*(F.ph>=3?2.6:3.4));F.flash=Math.max(0,F.flash-dt*1.6);
  // fumée aux deux échappements, qui suivent la machine quand elle tourne
  const ex=F.ph<=1?(F.ph===0?5+9*Math.min(1,t/FG_T0):18):F.ph===2?12:5;
  if(!F.mort)F.acc.ex+=ex*dt;while(F.acc.ex>=1){F.acc.ex--;const e=fgLoc(F,Math.random()<.5?-2:2,-15.5);
    fgSmoke(F,e[0]+fgRnd(-.5,.5),e[1],fgRnd(-1.4,1.4),-fgRnd(3,7),fgRnd(1.8,2.8),.7,1.5);}
  if(F.ph===0&&t>.7){F.acc.dust+=(5+9*Math.min(1,(t-.7)/1.5))*dt;while(F.acc.dust>=1){F.acc.dust--;const sd=Math.random()<.5?-1:1;
    fgSmoke(F,F.cx+sd*fgRnd(1,9),-fgRnd(.2,1.5),sd*fgRnd(3,8),-fgRnd(.3,2),fgRnd(1.5,2.4),.6,1.9);}}
  if(F.ph===1){F.acc.chip+=(14+55*F.hs)*dt;while(F.acc.chip>=1){F.acc.chip--;fgChips(F,1,F.nx,F.ny-2,13,-11,16);}
    if(F.hs>.5){F.acc.spark+=45*(F.hs-.4)*dt;while(F.acc.spark>=1){F.acc.spark--;fgSparks(F,1,F.nx,F.ny-3,14);}}
    F.acc.roc+=5*F.hs*dt;while(F.acc.roc>=1){F.acc.roc--;fgBoom(F,'roc');}}
  for(const p of F.pt){p.age+=dt;p.vy+=p.g*dt;const k=Math.max(0,1-p.drag*dt);p.vx*=k;if(p.type==='sm')p.vy*=k;p.x+=p.vx*dt;p.y+=p.vy*dt;
    if(p.type==='ch'&&F.ph<3&&p.y>2&&p.y<F.D0-1){const c=fgTrace(F,p.y);if(Math.abs(p.x-c)>FG_R){p.x=c+Math.sign(p.x-c)*FG_R;p.vx*=-.5;}}}
  F.pt=F.pt.filter(p=>p.age<p.life);
  // pendant la descente, la foreuse est tenue en haut de l'écran pour voir venir (mines, amas) : aux deux descentes depuis le 23 novembre
  // 2026 (la première était à .62)
  const tgt=F.d-(F.ph>=2?.6:.3)*F.R,tg0=-.62*F.R;
  if(F.ph===5){}else if(F.ph===0)F.camY=tg0;else F.camY+=((F.ph===1?Math.max(tgt,tg0):tgt)-F.camY)*Math.min(1,dt*(F.ph===1?3.4:4.8));
  if(F.ph!==5)F.camX+=(F.cx-F.camX)*Math.min(1,dt*2.6);
  if(F.snd){const sp=Math.min(1,F.vy/22),ig=Math.min(1,t/1.6);
    F.snd.update({vol:F.ph===0?.55*ig:F.ph===1?.9:F.ph===2?.5:F.ph===3?.14:0,rum:.18+.5*F.hs+(F.ph===0?.25*ig:0)+F.imp*.5,rumF:90+F.hs*190+F.imp*260,
      grind:F.ph===1?.1+.3*F.hs+.04*sp:F.ph===0?.04*ig:0,grindF:700+F.hs*1700+sp*400,rot:14+sp*10+(F.ph===0?6*ig:0),
        mot:.05+.05*sp+(F.ph===0?.07*ig:0),motF:36+ig*10+sp*38+F.hs*8});}
  /* Le décor d'arrivée se fige dès qu'il pourrait entrer dans le champ, et non au percement : sinon il apparaissait d'un coup
     alors que le sol de la caverne était déjà à l'écran (24 novembre 2026). */
  if(F.ox==null&&F.decA){fgDecorCv(F,F.decA);if(F.decA.img&&F.fl-F.decA.h1<F.camY+F.R+3)F.ox=Math.round(F.cx);}
  if(!F.sansRendu)fgDraw(F,t);   // sansRendu : pour rejouer la scène en accéléré dans les essais (outils/scripts/test-forage.js)
  if(F.ph===4&&t>=F.tFade+F.fadeLen){endForage();return;}
  raf20(forageFrame);}
const fgGlyph=(F,ch,col)=>{let A=F.atl[col];if(!A)A=F.atl[col]={};let g=A[ch];
  if(!g){g=document.createElement('canvas');g.width=F.cw;g.height=F.chh;const x=g.getContext('2d');x.font=F.font;x.textAlign='center';
    x.textBaseline='middle';x.fillStyle=col;x.fillText(ch,F.cw/2,F.chh/2);A[ch]=g;}
  return g;};
const fgPut=(F,xw,yw,ch,col)=>F.x.drawImage(fgGlyph(F,ch,col),Math.round((xw-F.camX)*F.cw+F.w/2),Math.round((yw-F.camY)*F.chh));
/* Mort pendant la descente (23 novembre 2026) : la foreuse explose en ASCII dans le puits, puis l'écran passe au noir et le jeu
   montre aussitôt « FOREUSE DÉTRUITE » sur fond noir (sans l'explosion du jeu, ni la carte du niveau en dessous).
   Explosion revue le même jour : tout reste sur la grille de la descente, chaque case dessinée est opaque. Coup très
   fort : cratère au bout du trou (roche détruite au centre, abîmée autour, bord déchiqueté), et chaque caractère de la
   foreuse est projeté dans tous les sens ; en traversant la roche, il la creuse et abîme les cases voisines, de moins en
   moins loin. Les cases détruites passent par « █ ▓ ▒ ░ · », les abîmées changent de caractère ; tout brûle (blanc,
   jaune, orange, rouge) puis refroidit en cendre ; des braises et les débris restent. Enfin tout l'écran s'éteint,
   case par case, par « ▒ ░ · ». Durée : FG_MORT. */
const FG_MORT=3.6,FG_NOIR0=2.55,   /* à FG_NOIR0 après la mort, tout l'écran commence à s'éteindre */
  FG_FEU=['#ffffff','#fff3a0','#ffd23f','#ffb020','#ff6a1f','#e8240f','#a8180c','#5a1410'],
  FG_DENSE='█▓▒░·',FG_ABIME=['▓╬█▒╫▓','▒╪┼═║╠╣╬','░┐└┘┌╒╛─│┤├'];   /* caractères abîmés, du plus dense au plus clair */
const fgK=(x,y)=>(y+30000)*60000+(x+30000);
const fgExE=F=>F.ex||(F.ex={c:new Map(),p:[],tl:0,vu:new Map()});
/* la roche d'origine d'une case, même si le puits l'a creusée depuis */
const fgRoc=(F,x,y)=>{F.sansTrou=1;const r=fgCell(F,x,y);F.sansTrou=0;return r;};
/* Une case touchée : d = dégâts cumulés (1 = détruite), q = chaleur reçue ; elle garde sa roche d'origine. */
function fgExDegat(F,x,y,v,t,orig){if(v<=.02)return;const E=fgExE(F),k=fgK(x,y);let c=E.c.get(k);
  if(!c){const roc=orig?fgRoc(F,x,y):fgCell(F,x,y);c={x,y,roc,ch:roc?F.oc:' ',col:roc?F.ok:'#000',d:0,q:0,tq:t,t0:t};E.c.set(k,c);}
  if(c.d<1&&c.d+v>=1)c.tD=Math.max(t,c.t0);c.d+=v;c.q=Math.min(1.3,c.q*Math.exp(-Math.max(0,t-c.tq)/1.1)+v);c.tq=Math.max(t,c.tq);}
const fgExRoc=(F,x,y)=>{const c=fgExE(F).c.get(fgK(x,y));return c?c.roc&&c.d<1:fgCell(F,x,y);};
const fgExFeu=q=>FG_FEU[q>.9?0:q>.75?1:q>.6?2:q>.47?3:q>.34?4:q>.22?5:q>.11?6:7];
/* Une explosion (mine ou foreuse) : cratère au bord déchiqueté, onde de choc dégressive, éclats projetés qui creusent la roche. */
function fgExplose(F,cx,cy,o){const E=fgExE(F),t=F.t,r0=o.r,ch=o.choc;cx=Math.round(cx);cy=Math.round(cy);
  for(let j=-Math.ceil(r0+5);j<=r0+5;j++)for(let i=-Math.ceil((r0+5)/.6);i<=(r0+5)/.6;i++){const d=Math.hypot(i*.6,j),
    b=fgH(F,cx+i,cy+j,22),r=r0*(1+b*.65);
    const v=1.8*Math.pow(Math.max(0,1-d/r),1.1)+(d<r+3?(fgH(F,cx+i,cy+j,23)-.6)*.5:0);if(v>.03)fgExDegat(F,cx+i,cy+j,v,t+d*.012);}
  for(let j=-ch;j<=ch;j++)for(let i=-Math.ceil(ch/.6);i<=ch/.6;i++){const d=Math.hypot(i*.6,j),d0=r0+2;if(d<d0||d>ch)continue;
    /* l'onde de choc : dégâts épars, forts près du cratère, rares et légers au loin */
    const f=1-(d-d0)/(ch-d0),b=fgH(F,cx+i,cy+j,28);if(b<f*f*.55)fgExDegat(F,cx+i,cy+j,(.08+.5*f*fgH(F,cx+i,cy+j,29))*f,t+(d-r0)*.018);}
  for(const e of o.eclats){const a=Math.atan2(e.y-cy,(e.x-cx)*.6||fgRnd(-.1,.1))+fgRnd(-1.4,1.4),v=fgRnd(o.v[0],o.v[1]);
    /* chaque éclat part, très vite, dans tous les sens */
    E.p.push({x:e.x,y:e.y,vx:Math.cos(a)*v/.6,vy:Math.sin(a)*v,ch:e.ch,col:e.col,e:fgRnd(.6,1.25)*(o.e||1),gx:Math.round(e.x),gy:Math.round(e.y),t0:t});}}
function fgExploseForeuse(F){const ec=[];
  for(let r=0;r<FG_ART.length;r++)for(let c=0;c<FG_ART[r].length;c++){const ch=FG_ART[r][c];
    if(ch!==' ')ec.push({x:F.nx+c-FG_AC,y:F.ny+r-FG_AB,ch,col:F.pal[FG_MSK[r][c]]||'#fff'});}
  fgExplose(F,F.nx,F.ny-3,{r:6,choc:24,v:[30,95],eclats:ec});}
function fgExploseMine(F,m){const ec=[];   /* la mine : son pavé rouge et blanc part en éclats */
  for(let j=-1;j<=1;j++)for(let i=-3;i<=3;i++)ec.push({x:m.x+i,y:m.y+j,ch:i===0&&j===0?'●':Math.abs(i)===1&&!j?'▓':'█',col:(i+j)&1?'#ff3b30':'#ffffff'});
  fgExplose(F,m.x,m.y,{r:3.2,choc:13,v:[22,70],e:.8,eclats:ec});}
/* Le cône de la foreuse fait fondre la roche : chaque rangée creusée brûle (« █ ▓ ▒ ░ · » couleur de feu) au lieu de
   disparaître, et les parois du puits, chauffées, s'abîment et rougeoient avant de refroidir en cendre. */
function fgFond(F,y){const c=F.tr[y];if(isNaN(c)||y<2||y>=F.D0)return;const t=F.t;
  for(let x=Math.floor(c-FG_R-3);x<=c+FG_R+3;x++){const e=Math.abs(x-c);if(!fgRoc(F,x,y))continue;
    if(e<=FG_R)fgExDegat(F,x,y,1.05,t+fgH(F,x,y,30)*.08,1);
    else if(fgH(F,x,y,31)<(e<=FG_R+1.5?.9:.45))fgExDegat(F,x,y,(e<=FG_R+1.5?.25:.1)+fgH(F,x,y,32)*.35,t,1);}}
/* la roche juste sous le nez chauffe avant d'être percée */
function fgChauffe(F,t,put){if(F.mort||F.ph>=2||F.d<2)return;const tic=Math.floor(t*12);
  for(let k=1;k<=4;k++){const y=Math.floor(F.d)+k;
    for(let x=Math.round(F.cx-FG_R);x<=F.cx+FG_R;x++){if(F.ex&&F.ex.c.has(fgK(x,y))||!fgCell(F,x,y))continue;
    const e=Math.abs(x-F.cx)/FG_R,q=(.95-k*.2-e*e*.55)*(.75+.5*fgH(F,x,y,tic));if(q<.12)continue;
      /* une poche de chaleur sous la pointe, plus chaude au centre, qui palpite */
    put(x,y,q>.5?F.oc:fgH(F,x,y,34)<.5?'▒':F.oc,fgExFeu(q));}}}
function fgExAvance(F,t){const E=fgExE(F),dt=Math.min(.05,Math.max(0,t-E.tl));E.tl=t;if(!dt)return;
  for(const p of E.p){if(p.tS!==undefined)continue;const sp=Math.hypot(p.vx*.6,p.vy);if(sp<2.5||t-p.t0>1.6){p.tS=t;continue;}
    const n=Math.ceil(sp*dt/.45);
    for(let s=0;s<n;s++){p.x+=p.vx*dt/n;p.y+=p.vy*dt/n;const gx=Math.round(p.x),gy=Math.round(p.y);
      if(gx===p.gx&&gy===p.gy)continue;p.gx=gx;p.gy=gy;
      const roc=fgExRoc(F,gx,gy);fgExDegat(F,gx,gy,p.e*(roc?.6:.2),t);   /* il creuse la case qu'il traverse… */
      for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++)if((a||b)&&fgH(F,gx+a,gy+b,7+(t*40|0))<.45)fgExDegat(F,gx+a,gy+b,p.e*.22*fgH(F,gx+a,gy+b,9),t);
        /* …et abîme ses voisines */
      if(roc){p.vx*=.93;p.vy*=.93;}p.e*=.95;}
    const fr=Math.exp(-dt*1.9);p.vx*=fr;p.vy=p.vy*fr+dt*5;}}
/* case opaque, sur la grille : fond noir plein, puis le caractère */
function fgExPut(F,xw,yw,ch,col){const X=Math.round((xw-F.camX)*F.cw+F.w/2),Y=Math.round((yw-F.camY)*F.chh);
  if(X<-F.cw||X>F.w||Y<-F.chh||Y>F.h)return;
  const x=F.x;x.fillStyle='#000';x.fillRect(X,Y,F.cw,F.chh);const vu=fgExE(F).vu;if(ch!==' '){x.drawImage(fgGlyph(F,ch,col),X,Y);
    vu.set(fgK(xw,yw),col);}else vu.set(fgK(xw,yw),null);}
function fgExCases(F,t){const E=fgExE(F);fgExAvance(F,t);E.vu.clear();
  const tic=Math.floor(t*12),put=(a,b,c,d)=>fgExPut(F,a,b,c,d),y0=F.camY-2,y1=F.camY+F.R+2;
  for(const [k,c] of E.c){if(t<c.t0||c.y<y0||c.y>y1)continue;const q=c.q*Math.exp(-(t-c.tq)/1.1)*(.8+.4*fgH(F,c.x,c.y,tic)),chaud=q>.06;
    if(!c.roc){if(chaud&&q>.25&&fgH(F,c.x,c.y,24)<.3)put(c.x,c.y,'·',fgExFeu(q));continue;}
    if(c.d>=1){const st=Math.floor((t-c.tD)/.08);   /* détruite : des caractères de moins en moins denses, puis le noir */
      if(st<FG_DENSE.length)put(c.x,c.y,FG_DENSE[st],fgExFeu(Math.max(q,.5)));
      else if(chaud&&fgH(F,c.x,c.y,25)<.24)put(c.x,c.y,fgH(F,c.x,c.y,tic+3)<.5?'·':'°',fgExFeu(q));   /* braises */
      else if(!fgCell(F,c.x,c.y)){if(!chaud&&t-c.tq>4)E.c.delete(k);}   /* creusée par le puits et refroidie : on l'oublie */
      else put(c.x,c.y,' ');continue;}
    const l=c.d>.6?0:c.d>.3?1:c.d>.1?2:-1,set=FG_ABIME[l];   /* abîmée : autre caractère, couleur de braise puis de cendre */
    const ch=l<0?c.ch:set[Math.floor(fgH(F,c.x,c.y,26+(q>.5?tic:0))*set.length)];
    put(c.x,c.y,ch,chaud?fgExFeu(q):l<0?c.col:'#4a403c');}
  fgChauffe(F,t,put);}
function fgExDebris(F,t){const E=fgExE(F),tic=Math.floor(t*12);   /* les éclats brûlent, puis restent */
  for(const p of E.p){const q=p.tS===undefined?.75+.25*p.e:.7*Math.exp(-(t-p.tS)/1.3)*(.8+.4*fgH(F,p.gx,p.gy,tic));
    fgExPut(F,p.gx,p.gy,p.ch,q>.08?fgExFeu(q):'#55504c');}}
/* Mort : à FG_NOIR0, tout s'éteint, case par case, par des caractères de moins en moins denses */
function fgExNoir(F,u){if(u<FG_NOIR0)return;const E=fgExE(F),r0=Math.floor(F.camY),c0=Math.floor(F.camX)-((F.C/2)|0);
  for(let r=-1;r<=F.R;r++)for(let c=0;c<F.C;c++){const xw=c0+c,yw=r0+r,tf=FG_NOIR0+fgH(F,xw,yw,27)*.6;if(u<tf)continue;
    const k=Math.floor((u-tf)/.09),K=fgK(xw,yw);let col=E.vu.has(K)?E.vu.get(K):fgCell(F,xw,yw)?F.ok:null;
    fgExPut(F,xw,yw,col&&k<3?'▒░·'[k]:' ',col);}}
/* Extinction de fin de descente, sans transparence : l'écran se découpe en cases ; chacune, à son tour, prend la couleur
   qu'elle montrait et passe par « ▒ ░ · » avant le noir. */
function fgEteint(F,k){const x=F.x,{w,h,cw,chh}=F,C=Math.ceil(w/cw),R=Math.ceil(h/chh);
  let s=F.eteint;if(!s||s.width!==C||s.height!==R){s=F.eteint=document.createElement('canvas');s.width=C;s.height=R;}
  const sx=s.getContext('2d');sx.imageSmoothingEnabled=true;sx.clearRect(0,0,C,R);sx.drawImage(x.canvas,0,0,C*cw,R*chh,0,0,C,R);
    const px=sx.getImageData(0,0,C,R).data;
  for(let j=0;j<R;j++)for(let i=0;i<C;i++){const tf=fgH(F,i,j,33)*.55;if(k<tf)continue;const st=Math.floor((k-tf)/.15),o=(j*C+i)*4;
    x.fillStyle='#000';x.fillRect(i*cw,j*chh,cw,chh);if(st>=3)continue;
    const m=Math.max(px[o],px[o+1],px[o+2]);if(m<14)continue;const f=Math.min(3.2,200/m);   /* la teinte de la case, ravivée */
    x.drawImage(fgGlyph(F,'▒░·'[st],`rgb(${Math.min(255,px[o]*f|0)},${Math.min(255,px[o+1]*f|0)},${Math.min(255,px[o+2]*f|0)})`),i*cw,j*chh);}}
/* La foreuse, tournée d'un angle quelconque : on balaie les cases de l'écran autour du nez et, pour chacune, on
   remonte à la case du dessin par la rotation inverse (donc jamais de trou). Au-delà de 45 degrés, chaque
   caractère est remplacé par son équivalent tourné d'un quart de tour. */
function fgDrill(F,t){const th=F.th*Math.PI/180,co=Math.cos(th),si=Math.sin(th),
    tab=F.th>45?FG_RG:F.th<-45?FG_RD:null,
    fr=Math.floor(t*(F.ph===0?10+Math.min(1,t/FG_T0)*14:F.ph===1?26:F.ph===2?14:3)),
    jx=F.hs>.5?(fgH(F,Math.floor(t*14),7,0)-.5)*2*(F.hs-.3)*1.2:0;
  let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
  const hx=(FG_AC+.5)*.6,hy=FG_AB+.6;
  for(const q of [[-hx,-hy],[hx,-hy],[-hx,.6],[hx,.6]]){const ex=q[0]*co+q[1]*si,ey=-q[0]*si+q[1]*co;
    x0=Math.min(x0,ex);x1=Math.max(x1,ex);y0=Math.min(y0,ey);y1=Math.max(y1,ey);}
  for(let j=Math.floor(y0)-1;j<=Math.ceil(y1)+1;j++)for(let i=Math.floor(x0/.6)-1;i<=Math.ceil(x1/.6)+1;i++){
    const ex=i*.6,lx=ex*co-j*si,ly=ex*si+j*co,c=Math.round(lx/.6+FG_AC),r=Math.round(ly+FG_AB);
    if(r<0||r>FG_AB||c<0||c>2*FG_AC)continue;
    let ch=FG_ART[r][c];if(ch===' ')continue;
    let col=F.pal[FG_MSK[r][c]];
    if(r>FG_AOEIL&&r<FG_AB&&ch==='▓'){const ph=(c+r*2+fr)&3;ch=ph<2?'▓':'▒';col=ph<2?F.pal.w:F.pal.g;}
    else if(r===FG_AOEIL&&ch==='◉')col=(Math.floor(t*3)&1)||F.ph>=2?F.pal.o:F.pal.b;
    else if(r===FG_AB&&F.ph===1)col=(Math.floor(t*20)&1)?'#fff':F.pal.o;
    if(tab&&tab[ch])ch=tab[ch];
    {const X=Math.round((F.nx+i+jx-F.camX)*F.cw+F.w/2),Y=Math.round((F.ny+j-F.camY)*F.chh);F.x.fillStyle='#000';
      F.x.fillRect(X,Y,F.cw,F.chh);F.x.drawImage(fgGlyph(F,ch,col),X,Y);}}}   /* case opaque */
/* Roche des descentes en cache (26 novembre 2026) : la grille de roche (146 × 55 cases environ) était redessinée en entier à
   chaque image, soit 8 000 caractères. Elle est gardée dans un canevas à part, aux dimensions de la grille : chaque case est
   recalculée à chaque image (fgCell, sans dessin) et n'est repeinte que si son caractère ou sa couleur a changé ; quand la
   caméra passe d'une rangée ou d'une colonne à la suivante, l'image est décalée d'autant. Le canevas est ensuite posé d'un
   bloc, à la place exacte des cases (largeur et hauteur de case entières : même position au pixel près). Le scintillement
   des filons, le tunnel creusé et le plancher passent par fgCell : ils sont suivis sans les énumérer.
   FG_ROCHE_OFF = true : dessin direct, case par case (contrôle : outils/scripts/test-forage-cache.js). */
let FG_ROCHE_OFF=false;
// le caractère sur fond noir, d'une pièce : même image que « fond noir puis caractère », en un seul dessin
function fgGlyphNoir(F,ch,col){const A=F.atlN||(F.atlN={}),k=ch+'\u0001'+col;let g=A[k];
  if(!g){g=document.createElement('canvas');g.width=F.cw;g.height=F.chh;const x=g.getContext('2d');x.fillStyle='#000';
    x.fillRect(0,0,F.cw,F.chh);x.drawImage(fgGlyph(F,ch,col),0,0);A[k]=g;}return g;}
function fgRoche(F){const x=F.x,{w,cw,chh}=F,r0=Math.floor(F.camY),c0=Math.floor(F.camX)-((F.C/2)|0);
  /* position de la grille : une seule origine arrondie, puis des pas entiers. Avant, chaque rangée arrondissait sa propre
     position : quand la caméra tombait pile sur un demi-pixel, l'imprécision des calculs en arrondissait certaines vers le
     haut, d'autres vers le bas, et des rangées sautaient d'un pixel le temps d'une image (vu à 125 %, 26 novembre 2026). */
  const bx=Math.round((c0-F.camX)*cw+w/2),by=Math.round((r0-F.camY)*chh);
  if(FG_ROCHE_OFF){for(let r=-1;r<=F.R;r++){const y=r0+r,py=by+r*chh;
    for(let c=0;c<F.C;c++){const xw=c0+c;if(fgCell(F,xw,y))x.drawImage(fgGlyph(F,F.oc,F.ok),bx+c*cw,py);}}return;}
  const NC=F.C,NR=F.R+2;let K=F.roc;
  if(!K||K.nc!==NC||K.nr!==NR||K.cw!==cw||K.chh!==chh){
    K=F.roc={cv:document.createElement('canvas'),cv2:document.createElement('canvas'),nc:NC,nr:NR,cw,chh,sig:new Array(NC*NR).fill(''),r0:null,c0:null};   // un canevas neuf est noir : toutes les cases sont « vides »
    for(const c of [K.cv,K.cv2]){c.width=NC*cw;c.height=NR*chh;const g=c.getContext('2d');g.fillStyle='#000';g.fillRect(0,0,c.width,c.height);}}
  // la caméra a changé de rangée ou de colonne : décaler l'image et les signatures, les cases nouvelles restent à peindre
  if(K.r0!==null&&(K.r0!==r0||K.c0!==c0)){const dr=r0-K.r0,dc=c0-K.c0,g2=K.cv2.getContext('2d');
    g2.fillStyle='#000';g2.fillRect(0,0,K.cv2.width,K.cv2.height);
    if(Math.abs(dr)<NR&&Math.abs(dc)<NC)g2.drawImage(K.cv,-dc*cw,-dr*chh);
    const t=K.cv;K.cv=K.cv2;K.cv2=t;const s2=new Array(NC*NR).fill('');   // les cases nouvelles sont noires
    for(let j=0;j<NR;j++){const jj=j+dr;if(jj<0||jj>=NR)continue;
      for(let i=0;i<NC;i++){const ii=i+dc;if(ii>=0&&ii<NC)s2[j*NC+i]=K.sig[jj*NC+ii];}}
    K.sig=s2;}
  K.r0=r0;K.c0=c0;
  const g=K.cv.getContext('2d');g.globalAlpha=1;
  for(let r=-1;r<=F.R;r++){const y=r0+r,j=r+1;
    for(let c=0;c<NC;c++){const s=fgCell(F,c0+c,y)?F.oc+'\u0001'+F.ok:'',q=j*NC+c;const av=K.sig[q];if(av===s)continue;K.sig[q]=s;
      // un seul geste : le caractère déjà posé sur son fond noir ; une case qui se vide repasse au noir
      if(s)g.drawImage(fgGlyphNoir(F,F.oc,F.ok),c*cw,j*chh);else{g.fillStyle='#000';g.fillRect(c*cw,j*chh,cw,chh);}}}
  x.drawImage(K.cv,bx,by-chh);}
function fgDraw(F,t){const x=F.x,{w,h,cw,chh,dpr}=F;
  x.setTransform(1,0,0,1,0,0);x.fillStyle='#000';x.fillRect(0,0,w,h);
  const amp=(F.ph===0?1.4*Math.min(1,t/FG_T0):F.ph===1?1.4+F.hs*4.2:F.ph===2?2.2:.6)*dpr+F.imp*16*dpr;
  x.save();x.translate(Math.round((Math.random()-.5)*2*amp),Math.round((Math.random()-.5)*2*amp));
  fgRoche(F);
  fgDecor(F,F.decD,0,0);if(F.ox!=null)fgDecor(F,F.decA,F.fl,F.ox);   /* le plancher du départ et celui de l'arrivée */
  fgExCases(F,t);   /* roche qui fond sous le cône, cratères des mines (et de la foreuse) */
  // mine : un pavé plein de 7 × 3 caractères, rouge et blanc en alternance, bien plus gros que les filons de la roche
  for(const m of F.mines){if(!m.ok)continue;const py=Math.round((m.y-F.camY)*chh);if(py<-2*chh||py>h+chh)continue;
    const px=Math.round((m.x-3-F.camX)*cw+w/2),on=Math.floor(t*6+m.x)&1,A=on?'#ffffff':'#ff3b30',B=on?'#ff3b30':'#ffffff';
    x.fillStyle='#000';x.fillRect(px-cw,py-2*chh,cw*9,chh*5);x.fillStyle=A;x.fillRect(px,py-chh,cw*7,chh*3);x.fillStyle='#000';
      x.fillRect(px+cw,py,cw*5,chh);
    fgPut(F,m.x-1,m.y,'▓',B);fgPut(F,m.x,m.y,'●',B);fgPut(F,m.x+1,m.y,'▓',B);}
  // amas de Matière : taches irrégulières, couleur accent, éclats blancs qui scintillent
  for(const A of F.amasL||[]){if(!A.c)continue;const py0=Math.round((A.y-F.camY)*chh);if(py0<-5*chh||py0>h+5*chh)continue;
    for(const c of A.c){if(!c.ok)continue;const px=Math.round((c.x-F.camX)*cw+w/2),py=Math.round((c.y-F.camY)*chh);x.fillStyle='#000';
      x.fillRect(px,py,cw,chh);
      const k=(c.x*7+c.y*13)&3,br=k===0&&((Math.floor(t*5)+c.x+c.y*3)%5===0);fgPut(F,c.x,c.y,k===0?'◆':k===1?'▓':'█',br?F.pal.w:F.pal.a);}}
  if(!F.mort)fgDrill(F,t);
  for(const p of F.pt){const a=p.age/p.life;
    if(p.type==='sm'){const rad=p.r0+p.age*p.gr,rx=Math.ceil(rad*1.9),ry=Math.ceil(rad),px=Math.round(p.x),py=Math.round(p.y);
      /* fumée : elle ne s'assombrit pas, elle perd sa densité, « ▓ ▒ ░ · », puis disparaît */
      for(let j=-ry;j<=ry;j++)for(let i=-rx;i<=rx;i++){const d=Math.hypot(i/1.9,j)/rad;if(d>1)continue;
        if(d>.55&&fgH(F,i+px,j+py,p.sd)<.22+a*.4)continue;
        const n=(1-a)*(1.25-d*.75);if(n<.1)continue;fgExPut(F,px+i,py+j,n>.8?'▓':n>.52?'▒':n>.28?'░':'·',p.col);}}
    else fgExPut(F,Math.round(p.x),Math.round(p.y),p.ch,p.col);}
  fgExDebris(F,t);if(F.mort)fgExNoir(F,t-F.tMort);
  x.restore();
  fgHud(F,t);
  if(F.ph===4)fgEteint(F,Math.min(1,(t-F.tFade)/F.fadeLen));
  else if(t<FG_ENT)fgEteint(F,1-t/FG_ENT);}   /* entrée : le noir se rallume case par case, comme la sortie s'éteint */   /* jamais de transparence dans les descentes : ni éclair blanc, ni fondu */
/* Annonce au début de la séquence (22 novembre 2026, revue le 23). La forme reste celle choisie le 22 : un cadre plein à fond noir,
   avec deux bandes de chantier (un caractère sur deux) au-dessus et au-dessous du message. Depuis le 23 novembre 2026, tout est
   écrit en police DOS (02b-police-dos.js : Modern DOS 8x16, CP437), case par case, pixel de police calé sur des pixels d'écran,
   et l'apparition reprend les références de l'utilisateur (dossier REF) :
   - chaque case passe par une montée de densité « . → i → 0 », puis un caractère au hasard sur un pavé de couleur (inverse
     vidéo : couleur de l'alerte ou gris), avant de se figer ; le rebord et les bandes montent en « ░ ▒ ▓ █ » ;
   - le cadre se forme de gauche à droite avec du désordre, de FG_ANN_T0 (1 s) à FG_ANN_T1 (3 s) ; le message reste 4 s ;
   - la disparition (la dernière seconde avant FG_ANNONCE, 8 s) défait les cases dans l'ordre inverse, colonne par colonne,
     de gauche à droite : pavé de couleur, « 0 → i → . », puis plus rien. */
// caractères tirés au hasard (CP437)
const FG_ANN_GL='#%&$@/\\<>=+*?!;:-_|[]{}()0123456789ABCDEFGHJKLMNPQRSTUVWXYZ£¥§¶«»±÷≈∙√ⁿ²■ΣΩδ∞φε∩≡';
const FG_ANN_FIN=1;   // durée de la disparition (23 novembre 2026 : doublée, 0,5 s avant)
const FG_ANN_COLS=30;
/* Taille d'un pixel de police des alertes (entier), la même partout (arrivée et descentes).
   26 novembre 2026 : elle ne suit **plus** la largeur de la fenêtre. Elle se calculait sur la largeur réelle (30 %
   de la largeur, 41 % jusqu'au 23 novembre, jugé trop gros), si bien que les alertes grossissaient à chaque fois
   qu'on agrandissait la fenêtre. Le calcul est le même, mais sur une **largeur de référence** : la taille est donc
   fixe, celle qu'elles avaient dans une fenêtre de FG_ANN_REF pixels CSS de large. Le dpr reste pris en compte,
   pour la même taille apparente sur un écran fin. Un seul nombre à changer pour les agrandir : FG_ANN_REF. */
const FG_ANN_REF=1280;
// largeur du cadre, en cases, la même aux deux descentes : le plus long message (26) + 4
const fgAnnP=(w,dpr)=>Math.max(1,Math.floor(FG_ANN_REF*(dpr||1)*.30/((FG_ANN_COLS+2)*8)));
const FG_ANN_RAMPE='.i0',FG_ANN_BLOC='░▒▓';
function fgAnnonce(F,t){const x=F.x,{w,h}=F,[l1,l2]=F.jeu?['EXPLOSIFS DÉTECTÉS','ATTENTION SOUS-SOL PIÉGÉ !']:['MATIÈRE {µ} DÉTECTÉE',
  'COLLECTE POSSIBLE'],col=F.jeu?'#ff3b30':F.pal.a,blanc=F.pal.w,gris=F.cRock2;
  const cols=FG_ANN_COLS,rows=9;   // même cadre, même taille de caractères aux deux descentes (23 novembre 2026)
  // alignée à gauche sous le tableau de bord ; un pixel de police = p pixels d'écran (entier), le cadre tenant dans 41 % de la largeur
  const p=fgAnnP(w,F.dpr),cw=8*p,chh=16*p,x0=(F.hudG??Math.round(w*.02))+cw,y0=(F.hudB??Math.round(h*.3))+chh+Math.round(6*(F.dpr||1));
    /* sa bordure noire (une case autour) commence sous le tableau */
  const pa=Math.max(0,Math.min(1,(t-FG_ANN_T0)/(FG_ANN_T1-FG_ANN_T0))),q=Math.max(0,Math.min(1,(t-(FG_ANNONCE-FG_ANN_FIN))/FG_ANN_FIN)),
    tic=Math.floor(t*20);
  const H=(a,b,k)=>{let v=(a*73856093)^(b*19349663)^(k*83492791);v^=v<<13;v^=v>>>17;v^=v<<5;return (v>>>0)/4294967296;};
  const d1=Math.floor((cols-l1.length)/2),d2=Math.floor((cols-l2.length)/2);
  // ce que porte chaque case, une fois figée : [caractère, couleur, est-ce du cadre]
  const cible=(c,r)=>{if(r===0||r===rows-1||c===0||c===cols-1)return ['█',col,1];
    if(r===1||r===rows-2)return (c+(r===1?0:1))%2?['█',col,1]:[' ',col,0];
    if(r===3&&c>=d1&&c<d1+l1.length)return [l1[c-d1],col,0];if(r===5&&c>=d2&&c<d2+l2.length)return [l2[c-d2],blanc,0];return [' ',blanc,0];};
  for(let r=-1;r<=rows;r++)for(let c=-1;c<=cols;c++){const px=x0+c*cw,py=y0+r*chh,bord=r<0||c<0||r>=rows||c>=cols;
    // avancement de la case : à l'apparition, de gauche à droite avec du désordre ; à la disparition, l'inverse
    let s=Math.max(0,Math.min(1,pa*2.05-(c+1)/(cols+2)*.7-H(c,r,1)*.35));   /* tout est figé quand pa = 1 */
    if(q>0)s=Math.min(s,Math.max(0,Math.min(1,((c+1)/(cols+2))*1.2+.25-q*1.6+H(c,r,2)*.15)));
    if(s<=0)continue;x.fillStyle='#000';x.fillRect(px,py,cw,chh);   // le fond noir n'existe que là où la case a commencé
    if(bord)continue;const [ch,cc,cadre]=cible(c,r),k=Math.floor(s*5);   // 0-1 rampe . i 0, 2-3 hasard sur pavé, 4 (s=1) figé
    if(s>=1){if(ch!==' ')dosCar(x,ch,px,py,p,cc);continue;}
    if(cadre){dosCar(x,FG_ANN_BLOC[Math.min(2,Math.floor(s*3))],px,py,p,col);continue;}
    if(s<.45){const g=FG_ANN_RAMPE[Math.min(2,Math.floor(s/.45*3))];dosCar(x,g,px,py,p,gris);continue;}
    const g=FG_ANN_GL[Math.floor(H(c,r,tic)*FG_ANN_GL.length)],fond=H(c,r,tic+7)<.5?col:gris;
    if(H(c,r,tic+3)<.55)dosCar(x,g,px,py,p,'#000',fond);else dosCar(x,g,px,py,p,H(c,r,tic+5)<.5?col:blanc);}}
function fgHud(F,t){const x=F.x,{w,h,dpr}=F,fs=Math.round(12*dpr),lh=Math.round(17*dpr),m=Math.round(20*dpr),
  fall=F.ph>=2,M=FG_MAT[fgIci(F)];
  x.font=`${fs}px ${FG_FONT}`;x.textAlign='left';x.textBaseline='top';
  const nd=Math.max(0,Math.min(5,Math.round(F.hs*5))),esp=v=>String(v).replace(/\B(?=(\d{3})+$)/g,' '),
    cap=F.ph!==1?'—':F.th<-2?'◄'.repeat(Math.min(3,1+Math.round(-F.th/9))):F.th>2?'►'.repeat(Math.min(3,1+Math.round(F.th/9))):'▼',
    rpm=F.mort?0:F.ph===0?Math.round(400+2600*Math.min(1,t/FG_T0)):fall?Math.max(0,Math.round(3200*(1-(t-F.tF)/2))):Math.round(2300+900*F.hs);
  const L=[['FORAGE ▸ SÉQUENCE DE DESCENTE',F.pal.a],[`NIVEAU     ${F.niv} → ${F.niv+1}`,F.pal.g],
    [`PROFONDEUR ${esp(profNiv(F.niv)+Math.round(F.d*FG_M))} m`,F.pal.g],
    [`MATIÈRE    ${fall?'CAVERNE':F.ph===0?'SURFACE':M.n}`,F.ph===1&&M.d>2.5?F.pal.o:F.pal.g],
    [`DURETÉ     ${'▮'.repeat(nd)}${'▯'.repeat(5-nd)}`,F.pal.g],[`CAP        ${cap}`,F.pal.g],[`ROTATION   ${esp(rpm)} tr/min`,F.pal.g]];
  // la vie de la foreuse, à toutes les descentes
  {const st=typeof G!=='undefined'&&G&&G.st;
    if(st){const v=Math.max(0,Math.round(st.vie)),mx=Math.max(1,Math.round(st.vieMax||100)),n=Math.max(0,Math.min(10,Math.ceil(v*10/mx)));
      L.push([`VIE        ${'▮'.repeat(n)}${'▯'.repeat(10-n)} ${v}/${mx}`,v*4<=mx?'#ff5a4a':v*2<=mx?F.pal.o:F.pal.w]);}}
  F.hudN=L.length+(F.jeu||F.amasY?1:0);   // lignes fixes du tableau (MINES ou RÉCOLTE comprises), sans les alertes qui clignotent
  if(F.jeu){L.push([`MINES      ${F.touche} touchée${F.touche>1?'s':''}`,F.touche?F.pal.o:F.pal.g]);
    if(F.ph===1&&Math.floor(t*5)%2===0&&F.mines.some(m=>m.ok&&m.y>F.d&&m.y<F.d+F.R*.7&&Math.abs(m.x-F.cx-F.vx*(m.y-F.d)/Math.max(6,F.vy))<FG_R))L.push(['▲ MINE SUR LA ROUTE ▸ ÉCARTEZ-VOUS','#ff5a4a']);
    if(F.mort)L.push(['FOREUSE DÉTRUITE','#ff5a4a']);}
  if(!F.jeu&&F.amasY){const A=F.amas;L.push([`RÉCOLTE    ${F.recolte?'+'+F.recolte+' Matière {µ}':'0'}`,F.recolte?F.pal.a:F.pal.g]);
    if(F.recolte&&F.t-F.tRec<1.2&&Math.floor(t*6)%2===0)L.push([`◆ MATIÈRE {µ} RÉCOLTÉE ▸ +${F.recolte}`,F.pal.a]);
    else if(F.ph===1&&A&&A.ok&&A.y>F.d-1&&Math.floor(t*4)%2===0)L.push(['◆ AMAS DE MATIÈRE {µ} EN VUE ▸ PASSEZ DESSUS',F.pal.a]);}
  if(F.ph===1&&F.evit>1.7&&Math.floor(t*4)%2===0)L.push(['▲ MASSE DURE DEVANT ▸ CONTOURNEMENT',F.pal.o]);
  if(F.ph===2&&Math.floor(t*5)%2===0)L.push(['ALERTE ▸ PERTE DE SUPPORT','#ff5a4a']);
  if(F.ph>=3&&!F.mort)L.push(['IMPACT ▸ ARRIVÉE AU NIVEAU SUIVANT',F.pal.o]);
  {let lg=0;for(const l of L)lg=Math.max(lg,x.measureText(l[0]).width);x.fillStyle='#000';
    x.fillRect(m-Math.round(8*dpr),m-Math.round(8*dpr),Math.round(lg)+Math.round(16*dpr),L.length*lh+Math.round(12*dpr));
    // bord gauche et bas du tableau (sans les alertes qui clignotent) : l'annonce se cale dessous
    // fond noir plein : le texte reste lisible sur la roche
    F.hudG=m-Math.round(8*dpr);F.hudB=m-Math.round(8*dpr)+(F.hudN+2)*lh+Math.round(12*dpr);
      }   /* deux lignes réservées aux alertes qui clignotent, que l'annonce ne doit pas cacher */
  L.forEach((l,i)=>{x.fillStyle='#000';x.fillText(l[0],m+1,m+i*lh+1);x.fillStyle=l[1];x.fillText(l[0],m,m+i*lh);});
  if(F.ph<=1){const aide=F.jeu?'◄ ►  Q D  4 6   ÉVITER LES MINES':'◄ ►  Q D  4 6   DIRIGER LA FOREUSE';x.fillStyle='#000';
    x.fillRect(m-Math.round(8*dpr),h-m-fs-Math.round(6*dpr),Math.round(x.measureText(aide).width)+Math.round(16*dpr),fs+Math.round(12*dpr));
    x.fillStyle=F.ph===0?F.pal.g:F.pal.d;x.fillText(aide,m,h-m-fs);}
  if(t>=FG_ANN_T0&&t<FG_ANNONCE&&!F.mort)fgAnnonce(F,t);x.textAlign='left';x.textBaseline='top';x.font=`${fs}px ${FG_FONT}`;
  // coupe : les matières de fond du niveau, et le repère de profondeur
  const sw=Math.round(8*dpr),sx=w-m-sw,st=Math.round(h*.22),sh=Math.round(h*.5),B=F.P.b;
  B.forEach((e,i)=>{const y0=st+sh*e[0],y1=st+sh*(i+1<B.length?B[i+1][0]:1);x.fillStyle=F.mcT[Math.min(FG_PS-1,Math.round(e[0]*(FG_PS-1)))][e[1]][1];x.fillRect(sx,Math.round(y0),sw,Math.max(1,Math.round(y1-y0)));});
  x.fillStyle='#2a1c1c';x.fillRect(sx,st+sh,sw,Math.round(sh*FG_CAV/F.D0*.5));
  const my=st+sh*Math.min(1,F.d/F.D0);x.fillStyle='#fff';
    x.fillRect(sx-Math.round(6*dpr),Math.round(my)-1,sw+Math.round(12*dpr),Math.max(2,Math.round(2*dpr)));
  x.textAlign='right';x.fillStyle=F.pal.g;x.fillText('COUPE',sx+sw,st-lh);}
