/* ---------- Cinématique d'intro (vue de dessus, environ 15 s) ----------
   0-1 s hyperespace · 0,85-3 s la planète entre par le haut (disque de 12 tuiles taillé dans la vraie carte réduite) ;
   le vaisseau ne s'arrête jamais : les étoiles continuent de défiler lentement et il tangue de gauche à droite.
   2,2-14 s descente, commencée avant que la planète s'immobilise : les tuiles gardent leur taille et le disque montre de plus
   en plus de cases jusqu'à l'échelle réelle. Six couches de nuages en tuiles, posées sur la planète, grossissent chacune à son
   rythme et passent de part et d'autre du vaisseau (parallaxe de descente). L'entrée dans l'atmosphère monte en puissance
   jusqu'à un pic critique (tremblement, plasma, traînées, chaleur, alerte rouge) puis se calme.
   11,6-14 s posé : le vaisseau rejoint sa place, son ombre le rejoint, poussière ; brouillard de guerre puis fondu.
   La foreuse est dans la soute du début à la fin. Échap, Espace ou Entrée : passer. */
const TH=1,TE0=.85,TE1=2.4,TZ0=1.6,PLANET_D=12;
// Chaque intro est un peu différente : durée de la descente, entrée dans l'atmosphère (début, pic, retombée),
// nombre et rythme des éclairs, densité des nuages (tirés au lancement de l'intro, voir introTiming)
let TZ1=9,TL0,TF0,TF1,T5,TEND,HS=.12,HP=.7,HF=.16,CLOUD_K=1,BOLTS=[.62,.68,.73];
function introTiming(){const r=Math.random;
  TZ1=TZ0+7.4*(.8+r()*.45);TL0=TZ1-1.6;TF0=TZ1+1.4;TF1=TF0+.6;T5=TF1+.1;TEND=T5+.5;   // descente de 5,9 à 9,3 s
  HS=.05+r()*.15;HP=.6+r()*.16;HF=.1+r()*.14;                                          // chaleur : début, pic critique, retombée (en part de la descente)
  CLOUD_K=.4+r()*1.3;                                                                   // densité des nuages : de très clairsemés à très chargés
  const n=2+Math.floor(r()*5);BOLTS=[];                                                 // 2 à 6 éclairs, rythme irrégulier, parfois en doublé
  while(BOLTS.length<n){const d=HP-.12+r()*.27;BOLTS.push(d);if(BOLTS.length<n&&r()<.3)BOLTS.push(d+.025+r()*.035);}
  BOLTS.sort((a,b)=>a-b);}
introTiming();
// Nuages accrochés à la surface de la carte, à faible altitude. Altitude de la caméra : Z = 0,2 + 30 (k − 1)², où k est le nombre
// de cases de carte par tuile affichée (k ≈ 5,3 quand la planète entre, 1 au sol). Vu de l'espace, Z est très grand devant
// l'altitude des nuages : ils restent collés au sol. La parallaxe n'apparaît que quand la planète remplit presque l'écran (k < 1,6),
// et chaque couche passe le vaisseau quand Z descend à son altitude.
const CLOUD_ALT=[.2,.295,.605,1.344,2.6],CLOUD_SIZES=[6,6,9,12,12,18,24];   // altitude des couches ; tailles des nuages, en cases
const camZ=k=>.2+30*(k-1)*(k-1);
let INTRO=null;
const introCv=$('introCv'),ictx=introCv.getContext('2d');
const introSeen=()=>{try{return localStorage.getItem('np-intro')==='vu';}catch(e){return false;}};
const markIntro=()=>{try{localStorage.setItem('np-intro','vu');}catch(e){}};
const clamp01=v=>Math.max(0,Math.min(1,v));
const smooth3=v=>{v=clamp01(v);return v*v*(3-2*v);};
const smooth5=p=>p*p*p*(p*(p*6-15)+10);
function shipShadow(){const c=document.createElement('canvas');c.width=TL.ship.width;c.height=TL.ship.height;const x=c.getContext('2d');x.drawImage(TL.ship,0,0);x.globalCompositeOperation='source-in';x.fillStyle='#000';x.fillRect(0,0,c.width,c.height);return c;}
let INTRO_CLOUD_AT=null;
// toute la carte pré-composée une fois, à la résolution des motifs (16 px par case) : pendant l'intro, chaque tuile affichée
// n'est plus qu'une copie, au lieu de 2 à 4 dessins avec changements d'opacité (l'intro ramait)
/* Éclair en pixel art, sur toute la hauteur de l'écran : tronc par déplacement des points milieux (zigzags à toutes les
   échelles), branches qui se ramifient une fois, tracés sur une grille de 2 px (un pixel de tuile), tout en couleur accent :
   tronc de 2 pixels, branches et rameaux d'un pixel.
   Opaque, sans lissage ; dessiné une fois dans une image de la taille de l'écran. */
function boltImage(x0,y1,w,h){const P=2,trunk=new Set(),branch=new Set();
  const zig=(ax,ay,bx,by,rough,depth,out)=>{if(depth===0){out.push([bx,by]);return;}const mx=(ax+bx)/2,my=(ay+by)/2,dx=bx-ax,dy=by-ay,l=Math.hypot(dx,dy)||1,d=(Math.random()*2-1)*rough*l;
    const px=mx-dy/l*d,py=my+dx/l*d;zig(ax,ay,px,py,rough,depth-1,out);zig(px,py,bx,by,rough,depth-1,out);};
  const line=(a,c,b,d,set,wide)=>{let x=Math.round(a/P),y=Math.round(c/P);const X=Math.round(b/P),Y=Math.round(d/P),sx=x<X?1:-1,sy=y<Y?1:-1,ddx=Math.abs(X-x),ddy=-Math.abs(Y-y);let err=ddx+ddy;
    for(;;){set.add(x+','+y);if(wide)set.add((x+1)+','+y);if(x===X&&y===Y)break;const e2=2*err;if(e2>=ddy){err+=ddy;x+=sx;}if(e2<=ddx){err+=ddx;y+=sy;}}};
  // level 0 : tronc (2 pixels, cœur blanc) ; level 1 : branches ; level 2 : rameaux (1 pixel, couleur bio)
  const path=(ax,ay,bx,by,depth,level)=>{const pts=[[ax,ay]];zig(ax,ay,bx,by,level?.28:.2,depth,pts);
    for(let k=1;k<pts.length;k++)line(pts[k-1][0],pts[k-1][1],pts[k][0],pts[k][1],level?branch:trunk,level===0);
    if(level<2)for(let k=3;k<pts.length-3;k++){if(Math.random()>(level===0?.045:.05))continue;const [qx,qy]=pts[k];
      const down=Math.atan2(by-ay,bx-ax),ang=down+(Math.random()<.5?-1:1)*(.3+Math.random()*.55),len=Math.hypot(bx-ax,by-ay)*(level===0?.22+Math.random()*.25:.1+Math.random()*.12);
      path(qx,qy,qx+Math.cos(ang)*len,qy+Math.sin(ang)*len,level===0?5:4,level+1);}};
  path(x0,-8,x0+(Math.random()*2-1)*w*.2,y1,8,0);
  const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.fillStyle=PAL['1'];   // tout en couleur accent
  for(const k of new Set([...trunk,...branch])){const [x,y]=k.split(',').map(Number);g.fillRect(x*P,y*P,P,P);}
  return c;}
function introMapImg(){ensureChasmOv();const c=document.createElement('canvas');c.width=W*16;c.height=H*16;const x=c.getContext('2d');
  x.imageSmoothingEnabled=false;x.setTransform(16/S,0,0,16/S,0,0);
  for(let i=0;i<W*H;i++)introCell(x,i,(i%W)*S,((i/W)|0)*S);
  return c;}
function playIntro(){
  if(reduced||!G||!G.ship){markIntro();return;}
  if(TRAV)stopTravel();HOV=null;if(freeCam)setFreeCam(false);   // l'intro sort du mode carte : elle se pose sur la vue centrée sur la foreuse
  introTiming();   // nouveaux tirages : durée, chaleur, éclairs, nuages
  const R=seeded((Math.random()*1e9)|0);
  // nuages : formes procédurales (union de disques) de 6 à 24 cases de carte, posées sur la carte. Ils sont échantillonnés
  // à chaque image sur la grille des tuiles affichées : la tuile garde toujours sa taille, un nuage proche est fait de plus de tuiles.
  // En plus des nuages dispersés, chaque couche en pose quelques-uns autour du point d'atterrissage, dans la zone que l'écran
  // couvre quand elle passe (les couches basses passent en dernier, de près : zone plus serrée) → des nuages jusqu'à la fin.
  const cloudLayer=(i)=>{const circ=[],style=[],grid=Array.from({length:W*H},()=>[]),n=Math.round((8+Math.floor(R()*4))*CLOUD_K),near=Math.max(1,Math.round(4*CLOUD_K)),rx=5+5*i,ry=3+3*i;
    for(let c=0;c<n+near;c++){const size=CLOUD_SIZES[(R()*CLOUD_SIZES.length)|0],loc=c>=n,
      cx=loc?G.px+(R()*2-1)*rx:R()*W,cy=loc?G.py+(R()*2-1)*ry:R()*H,m=Math.max(2,Math.round(size/3)),own=[];
      style.push([1+((R()*2)|0),3+((R()*4)|0)]);   // tuile de cœur, style de bord
      for(let j=0;j<m;j++){const o=j?own[(R()*own.length)|0]:null,r=.9+R()*.7,
          x0=o?o[0]+(R()*2-1)*1.6:cx,y0=o?o[1]+(R()*2-1)*.7:cy;own.push([x0,y0,r,c]);}   // plus large que haut
      for(const q of own){const id=circ.length;circ.push(q);
        for(let yy=Math.floor(q[1]-q[2]);yy<=Math.floor(q[1]+q[2]);yy++)for(let xx=Math.floor(q[0]-q[2]);xx<=Math.floor(q[0]+q[2]);xx++)grid[wrapIdx(xx,yy)].push(id);}}
    return {circ,style,grid};};
  // nuage présent au point (x, y) de la carte ? renvoie l'indice du nuage + 1, ou 0
  INTRO_CLOUD_AT=(L,px,py)=>{for(const id of L.grid[wrapIdx(Math.floor(px),Math.floor(py))]){const q=L.circ[id];let dx=px-q[0],dy=py-q[1];
      dx-=Math.round(dx/W)*W;dy-=Math.round(dy/H)*H;if(dx*dx+dy*dy<=q[2]*q[2])return q[3]+1;}return 0;};
  INTRO={t0:performance.now(),last:performance.now(),ev:{},flash:0,
    stars:Array.from({length:150},(_,i)=>({x:R(),y:R(),l:i<80?0:i<128?1:2})),
    layers:CLOUD_ALT.map((a,i)=>Object.assign({a},cloudLayer(i))),
    bolts:BOLTS.map(dd=>({t:TZ0+dd*(TZ1-TZ0),x:.15+R()*.7,pts:null})),
    dust:null,shadow:shipShadow(),mapImg:introMapImg()};
  introCv.hidden=false;introCv.style.opacity=1;$('introSkip').hidden=false;
  requestAnimationFrame(introFrame);}
function skipIntro(){if(!INTRO)return;const now=performance.now();if((now-INTRO.t0)/1000<T5)INTRO.t0=now-T5*1000;INTRO.ev.touch=true;INTRO.ev.reen=true;}
function endIntro(){INTRO=null;introCv.hidden=true;$('introSkip').hidden=true;introCv.style.opacity=1;markIntro();render();}
introCv.addEventListener('pointerdown',()=>{unlock();});
// une case de terrain, comme dans le jeu (sans brouillard ni créatures) ; le vaisseau au sol n'est pas dessiné
function introCell(x,i,px,py){const t=G.t[i],h=hash(i%W,(i/W)|0),put2=(tl,a)=>{if(!tl)return;x.globalAlpha=a;x.drawImage(tl,px,py,S,S);};
  x.globalAlpha=1;x.fillStyle='#020605';x.fillRect(px,py,S,S);
  if(t!==CHASM){x.globalAlpha=.08;x.fillStyle=PAL['3'];x.fillRect(px,py,S,S);}
  if(t!==BRIDGE)put2(TL.ground0,.6);
  if(t===ROCK)put2(h%3?TL.rock:TL.rock2,.95);
  else if(t===MOUNT){const up=i>=W&&G.t[i-W]===MOUNT;put2(up?TL.mtBody:TL.mtTop,.9);}
  else if(t===LIQ){x.globalAlpha=.24;x.fillStyle=PAL['2'];x.fillRect(px,py,S,S);put2(h%2?TL.liq1:TL.liq0,.9);}
  else if(t===DEEP){x.globalAlpha=1;x.fillStyle='#01060c';x.fillRect(px,py,S,S);x.globalAlpha=.08;x.fillStyle=PAL['2'];x.fillRect(px,py,S,S);put2(h%2?TL.deep1:TL.deep0,.4);}
  else if(t===CHASM){x.globalAlpha=1;x.fillStyle='#000';x.fillRect(px,py,S,S);if(CHASM_OV)x.drawImage(CHASM_OV,(i%W)*16,((i/W)|0)*16,16,16,px,py,S,S);}
  else if(t===RUBBLE)put2(TL.rubble,.65);else if(t===GRASS)put2(TL.grass0,.9);else if(t===FLAT)put2(TL.flat0,.75);
  x.globalAlpha=1;}
const wrapIdx=(mx,my)=>(((my%H)+H)%H)*W+(((mx%W)+W)%W);
function introFrame(now){const I=INTRO;if(!I)return;ensureChasmOv();
  const t=(now-I.t0)/1000,dt=Math.min(.05,(now-I.last)/1000);I.last=now;
  const dpr0=devicePixelRatio||1,dpr=dpr0>=2?Math.max(1,Math.floor(dpr0/2)):dpr0,w=innerWidth,h=innerHeight;if(introCv.width!==Math.round(w*dpr)||introCv.height!==Math.round(h*dpr)){introCv.width=Math.round(w*dpr);introCv.height=Math.round(h*dpr);}
  const x=ictx;x.setTransform(dpr,0,0,dpr,0,0);x.imageSmoothingEnabled=false;x.globalAlpha=1;x.globalCompositeOperation='source-over';x.fillStyle='#000';x.fillRect(0,0,w,h);
  const ev=k=>{if(I.ev[k])return false;I.ev[k]=true;return true;};
  const DUR=TZ1-TZ0,d=clamp01((t-TZ0)/DUR);
  // intensité de l'entrée dans l'atmosphère : monte en accélérant jusqu'au pic critique (d = 0,7, quand on traverse les nuages), puis retombe
  const heat=d<HP?Math.pow(smooth3((d-HS)/(HP-HS)),2):1-smooth3((d-HP)/HF);
  if(t<.05&&ev('hyper'))SFX.hyper();if(t>TE0&&ev('hum'))SFX.hum();if(t>TZ0&&ev('appr'))SFX.approach();
  if(d>HS&&ev('reen'))SFX.reentry(DUR*(.88-HS),DUR*(HP-HS));if(t>TL0&&ev('thr'))SFX.thrust();
  // grille des tuiles calée sur la vue du jeu, et cadrage final identique à celui du jeu (foreuse au centre, caméra bornée)
  const mr=$('mapwrap').getBoundingClientRect(),vw2=Math.floor(mr.width),vh2=Math.floor(mr.height),vc=vw2/S,vr=vh2/S;
  const camX2=Math.max(0,Math.min(W-Math.floor(vc),G.px-Math.floor(vc/2))),camY2=Math.max(0,Math.min(H-Math.floor(vr),G.py-Math.floor(vr/2)));
  const shipFX=mr.left+(G.ship.x-camX2)*S+SGW*S/2,shipFY=mr.top+(G.ship.y-camY2)*S+SGH*S/2;
  const gx0=Math.floor(-mr.left/S)-1,gx1=Math.ceil((w-mr.left)/S)+1,gy0=Math.floor(-mr.top/S)-1,gy1=Math.ceil((h-mr.top)/S)+1;
  const G0x=Math.round((w/2-mr.left)/S),G0y=Math.round((h*.42-mr.top)/S);   // centre du disque : un coin de case
  const e5=t<TL0?0:smooth5(clamp01((t-TL0)/(TZ1-TL0)));
  // tremblement : suit l'intensité de l'entrée dans l'atmosphère, avec des à-coups au pic
  let shx=0,shy=0;const shA=heat*6+(heat>.9?3:0);if(shA>.2){shx=Math.round((Math.random()*2-1)*shA);shy=Math.round((Math.random()*2-1)*shA);}
  /* --- étoiles : traînées d'hyperespace, puis le vaisseau continue d'avancer (défilement lent), elles s'effacent quand la planète remplit l'écran --- */
  if(t<TZ0+.5*DUR){const fade=1-clamp01((t-(TZ0+.25*DUR))/(.23*DUR)),stretch=clamp01((TH+.15-t)/1),move=.3+.7*(1-clamp01((t-TH)/(TE1-TH))),SP=[50,120,300];
    for(const st of I.stars){const sp=SP[st.l]*(1+16*stretch)*move;st.y=(st.y+sp*dt/h)%1;
      const len=Math.max(st.l===2?2:1,sp*.07),sz=st.l===2?2:1,px=Math.round(st.x*w),py=Math.round(st.y*h);
      x.globalAlpha=fade*(st.l===0?.45:st.l===1?.75:1);x.fillStyle=st.l===2||stretch>.2?'#ffffff':PAL['1'];x.fillRect(px,py-len,sz,len);}
    x.globalAlpha=1;}
  /* --- planète en tuiles, puis sol : le disque montre de plus en plus de cases jusqu'à l'échelle réelle --- */
  let Rt=0,yOff=0,kz=H/PLANET_D,Ax=W/2,Ay=H/2;
  if(t>TE0){
    const pe=1-(1-d)*(1-d),k0=H/PLANET_D;kz=Math.pow(k0,1-pe);Rt=H/kz/2;   // kz : cases de carte par tuile affichée
    Ax=W/2+(camX2+G0x-W/2)*pe;Ay=H/2+(camY2+G0y-H/2)*pe;
    if(t<TE1){const q=clamp01((t-TE0)/(TE1-TE0));yOff=-Math.pow(1-q,3)*(mr.top+G0y*S+Rt*S+60);}
    const lim=clamp01((22-Rt)/10),rc=Math.ceil(Rt)+1,fogF=fog?clamp01((t-TF0)/(TF1-TF0)):0;
    for(let gy=Math.max(gy0,G0y-rc);gy<=Math.min(gy1,G0y+rc);gy++)for(let gx=Math.max(gx0,G0x-rc);gx<=Math.min(gx1,G0x+rc);gx++){
      const cx=gx+.5-G0x,cy=gy+.5-G0y,dd=Math.hypot(cx,cy);if(dd>Rt)continue;
      const px=Math.round(mr.left+gx*S+shx),py=Math.round(mr.top+gy*S+yOff+shy),ci=wrapIdx(Math.floor(Ax+cx*kz),Math.floor(Ay+cy*kz));
      x.globalAlpha=1;x.drawImage(I.mapImg,(ci%W)*16,((ci/W)|0)*16,16,16,px,py,S,S);   // case pré-composée : une seule copie par tuile
      if(lim>0){const e=dd/Rt;if(e>.7){x.globalAlpha=lim*Math.min(.65,(e-.7)*2);x.fillStyle='#000';x.fillRect(px,py,S,S);}   // ombre du limbe
        if(Rt-dd<1){x.globalAlpha=lim*.35;x.fillStyle=PAL['2'];x.fillRect(px,py,S,S);}x.globalAlpha=1;}   // liseré d'atmosphère
      if(fogF>0&&!vis[ci]){x.globalAlpha=fogF*(G.seen[ci]?.72:1);x.fillStyle='#020605';x.fillRect(px,py,S,S);x.globalAlpha=1;}}   // brouillard de guerre, pour un raccord exact
    // ombre du vaisseau au posé
    if(e5>0){const sOff=(1-e5)*70;x.globalAlpha=.45*clamp01(e5*3);x.drawImage(I.shadow,Math.round(shipFX-SGW*S/2+sOff+shx),Math.round(shipFY-SGH*S/2+sOff*.6+shy),SGW*S,SGH*S);x.globalAlpha=1;}}
  /* --- nuages : couches accrochées à la carte, vues à kc = k / f cases de carte par tuile (f = Z / (Z − altitude) : parallaxe).
         Les tuiles gardent toujours leur taille et restent sur la grille de l'écran, comme le sol : chaque tuile échantillonne
         la couche (plusieurs points quand elle couvre un grand bloc de carte) → loin, un nuage = une ou deux tuiles ;
         près, des dizaines. Tuile pleine au cœur, tuile de bord (hachures, semi-transparente) au pourtour --- */
  const sway=clamp01((t-TH)/1)*(1-clamp01((t-(TL0-1.5))/1.5)),swx=(Math.sin(t*.8)*22+Math.sin(t*1.9+1)*6)*sway,swy=Math.sin(t*1.15)*8*sway;
  const scl=1.3-.3*e5,cxs=w/2+swx,cys=h*.56+swy,shipCX=cxs+(shipFX-cxs)*e5,shipCY=cys+(shipFY-cys)*e5,shipR=Math.hypot(SGW,SGH)*scl/2+.5;   // vaisseau, en tuiles pour le rayon
  const Z=camZ(kz),lim=clamp01((22-Rt)/10),NX=gx1-gx0+1,NY=gy1-gy0+1,OC=new Float32Array(NX*NY),ID=new Int32Array(NX*NY);
  const drawClouds=near=>{if(t<=TE0)return;
    for(const L of I.layers){if(Z<=L.a*1.02)continue;const f=Z/(Z-L.a);if(f>7||(f>2.4)!==near)continue;
      const kc=kz/f,sn=Math.min(4,Math.max(2,Math.ceil(kc))),st=kc/sn;
      // les nuages s'écartent autour du vaisseau : chaque tuile échantillonne la couche comme si elle était plus près de lui,
      // d'un rayon de vaisseau (aucun trou, la couche est simplement « fendue » et repoussée sur les côtés)
      const Rr=shipR*clamp01((f-1.08)/.5),scx=(shipCX-(mr.left+G0x*S))/S,scy=(shipCY-(mr.top+G0y*S+yOff))/S;
      OC.fill(0);
      for(let gy=gy0;gy<=gy1;gy++)for(let gx=gx0;gx<=gx1;gx++){
        const cx=gx+.5-G0x,cy=gy+.5-G0y;if(lim>0&&Math.hypot(cx,cy)>Rt)continue;   // tant que la planète est un disque : nuages sur le disque
        let ux=cx-scx,uy=cy-scy;if(Rr>0){const r=Math.hypot(ux,uy);if(r<Rr)continue;ux*=(r-Rr)/r;uy*=(r-Rr)/r;}
        const bx=Ax+(scx+ux-.5)*kc,by=Ay+(scy+uy-.5)*kc;let hit=0,id=0;
        for(let sy=0;sy<sn;sy++)for(let sx=0;sx<sn;sx++){const v=INTRO_CLOUD_AT(L,bx+(sx+.5)*st,by+(sy+.5)*st);if(v){hit++;id=v;}}
        const o=(gy-gy0)*NX+(gx-gx0);OC[o]=hit/(sn*sn);ID[o]=id;}
      for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){const o=j*NX+i,c=OC[o];if(c<.25)continue;
        const st2=L.style[ID[o]-1],core=c>=.75&&i>0&&j>0&&i<NX-1&&j<NY-1&&OC[o-1]>=.25&&OC[o+1]>=.25&&OC[o-NX]>=.25&&OC[o+NX]>=.25;
        const img=TL['nuage'+((core?st2[0]:st2[1])-1)];if(!img)continue;
        x.globalAlpha=core?1:Math.min(.85,.35+c*.6);x.drawImage(img,Math.round(mr.left+(gx0+i)*S+shx),Math.round(mr.top+(gy0+j)*S+yOff+shy),S,S);}}
    x.globalAlpha=1;};
  // chaleur (sous les nuages, qui restent blancs) : bords de l'écran, alerte rouge au pic critique
  if(heat>.02){const g=x.createRadialGradient(w/2,h/2,Math.min(w,h)*.3,w/2,h/2,Math.max(w,h)*.75);g.addColorStop(0,'rgba(255,90,20,0)');g.addColorStop(1,`rgba(255,60,10,${.6*heat})`);x.fillStyle=g;x.fillRect(0,0,w,h);
    if(heat>.9&&Math.floor(now/90)%2){x.globalAlpha=.14;x.fillStyle='#ff3b3b';x.fillRect(0,0,w,h);x.globalAlpha=1;}}
  drawClouds(false);
  // poussière (sous le vaisseau), couleur monde : soulevée par les réacteurs pendant l'approche, puis gerbe à l'impact.
  // Chaque grain a une hauteur : il retombe et rebondit au sol, ricoche sur les obstacles (roche, montagne, vaisseau), tombe
  // dans les gouffres, et disparaît d'un coup à la fin de sa vie (durées différentes, pas de fondu)
  if(!I.parts)I.parts=[];
  const puff=(n,r0,v0,v1,l0,l1)=>{for(let j=0;j<n;j++){const an=Math.random()*Math.PI*2,v=v0+Math.random()*(v1-v0),r=r0*(.9+Math.random()*.3);
      I.parts.push({x:shipFX+Math.cos(an)*r,y:shipFY+Math.sin(an)*r*.85,z:Math.random()*8,vx:Math.cos(an)*v,vy:Math.sin(an)*v*.85,vz:60+Math.random()*240,
        l:l0+Math.random()*(l1-l0),a:0,sz:2+(Math.random()<.35?1:0)});}};
  const cellAt=(px,py)=>{const mx=camX2+Math.floor((px-mr.left)/S),my=camY2+Math.floor((py-mr.top)/S);return mx<0||my<0||mx>=W||my>=H?ROCK:G.t[my*W+mx];};
  const hard=v=>v===ROCK||v===MOUNT||v===SHIP;
  if(e5>.45&&e5<.985)puff(Math.round(12*e5),Math.hypot(SGW,SGH)*S*.3,40,160,.25,.7);                          // souffle des réacteurs
  if(e5>=.985&&ev('touch')){SFX.touchdown();puff(650,Math.hypot(SGW,SGH)*S*.36,80,520,.35,1.35);}              // impact : tout est retombé avant le brouillard
  if(I.parts.length){let n=0;x.fillStyle=PAL['3'];x.globalAlpha=1;
    for(const q of I.parts){q.a+=dt;if(q.a>=q.l)continue;
      const air=q.z>0||q.vz>0,dr=Math.exp(-(air?1.1:7)*dt);q.vx*=dr;q.vy*=dr;
      const nx=q.x+q.vx*dt,ny=q.y+q.vy*dt;
      if(hard(cellAt(nx,ny))){if(hard(cellAt(nx,q.y)))q.vx*=-.55;if(hard(cellAt(q.x,ny)))q.vy*=-.55;if(!hard(cellAt(nx,q.y))&&!hard(cellAt(q.x,ny))){q.vx*=-.55;q.vy*=-.55;}}
      else{q.x=nx;q.y=ny;}
      if(air){q.vz-=900*dt;q.z+=q.vz*dt;if(q.z<=0){q.z=0;if(cellAt(q.x,q.y)===CHASM)continue;   // tombe dans le gouffre
          if(q.vz<-40){q.vz=-q.vz*.45;q.vx*=.75;q.vy*=.75;}else q.vz=0;}}
      I.parts[n++]=q;x.fillRect(Math.round(q.x/2)*2,Math.round((q.y-q.z)/2)*2,q.sz,q.sz);}
    I.parts.length=n;}
  /* --- éclairs, au plus fort de la traversée --- */
  for(const b of I.bolts){if(t<b.t||t>b.t+.22)continue;
    if(!b.img){b.img=boltImage(b.x*w,h+8,w,h);I.flash=1;SFX.thunder();}
    const e=t-b.t;if(e<.07||(e>.1&&e<.17))x.drawImage(b.img,0,0,w,h);}   // éclair stroboscopique : allumé, éteint, rallumé, sans fondu
  /* --- vaisseau (foreuse dans la soute) : il tangue en avançant, puis rejoint sa place d'atterrissage ; plus gros en altitude --- */
  const cx=shipCX,cy=shipCY,sw=SGW*S*scl,sh=SGH*S*scl,ox=Math.round(cx-sw/2+shx),oy=Math.round(cy-sh/2+shy),k=2*scl;
  const fl=clamp01(1-e5*1.15);
  if(fl>0)for(const ex of [24,56]){const len=Math.round((t<TH?22:16)*fl+(Math.floor(now/70)%3)*2*fl);
    for(let j=0;j<len;j++){const half=Math.max(1,4-Math.floor(j/5));x.fillStyle=j<4?'#ffffff':PAL['3'];x.globalAlpha=j<len*.6?1:.5;x.fillRect(Math.round(ox+(ex-half)*k),Math.round(oy+(94+j)*k),Math.round(half*2*k),Math.ceil(k));}}
  x.globalAlpha=1;
  if(heat>.03){
    // traînées le long de la coque
    const ns=Math.round(26*heat);for(let n=0;n<ns;n++){const sx=ox+(Math.random()*96-8)*k,sy=oy+(Math.random()*30)*k,len=(8+Math.random()*40)*k*heat;
      x.fillStyle=Math.random()<.3?'#ffffff':Math.random()<.6?PAL['3']:'#ff3b3b';x.fillRect(Math.round(sx),Math.round(sy),Math.ceil(k),Math.round(len));}
    // arc de plasma devant le nez : plus large et plus chaud à mesure que l'intensité monte
    const na=10+Math.round(12*heat);
    for(let i=-na;i<=na;i++){if(Math.random()>.88)continue;const r=Math.abs(i)/na,ax=ox+(40+i*2.6*(1+.4*heat))*k,ay=oy+(-5-7*heat+r*r*(14+10*heat)+Math.sin(now/40+i)*1.5)*k;
      x.fillStyle=r<.3?'#ffffff':r<.65||heat<.6?PAL['3']:'#ff3b3b';const sz=Math.ceil(k*(1.5+1.5*heat));x.fillRect(Math.round(ax),Math.round(ay),sz,sz);}}
  x.drawImage(TL.ship,ox,oy,Math.round(sw),Math.round(sh));
  if(TL.robot_d)x.drawImage(TL.robot_d,Math.round(ox+2*16*k),Math.round(oy+2*16*k),Math.round(16*k),Math.round(16*k));   // la foreuse, au fond du couloir
  drawClouds(true);   // couches toutes proches : elles passent au-dessus du vaisseau
  // posé : nuage de poussière
  if(I.flash>0){x.globalAlpha=I.flash*.55;x.fillStyle='#ffffff';x.fillRect(0,0,w,h);x.globalAlpha=1;I.flash=Math.max(0,I.flash-dt*5);}
  introCv.style.opacity=t>T5?String(1-clamp01((t-T5)/(TEND-T5))):'1';
  if(t>=TEND){endIntro();return;}
  requestAnimationFrame(introFrame);}
$('campBtn').onclick=()=>{unlock();if(TRAV)stopTravel();SFX.start();newGame();started=true;$('overlay').hidden=true;render();};
$('introBtn').onclick=()=>{unlock();if(TRAV)stopTravel();newGame();started=true;$('overlay').hidden=true;render();playIntro();};
function savePresets(){try{localStorage.setItem('np-presets',JSON.stringify(PRESETS.map(p=>p.c)));localStorage.setItem('np-preset-active',PRESET_ACTIVE);}catch(e){}touchLocal();}
function drawPresets(){$('presets').innerHTML=PRESETS.map((p,i)=>`<button data-p="${i}" title="${p.n}" aria-label="Palette ${p.n}" aria-pressed="${i===PRESET_ACTIVE}">${[2,1,0].map(j=>`<i style="background:${p.c[j]}"></i>`).join('')}</button>`).join('');
  $('palName').textContent=PRESETS[PRESET_ACTIVE].n;}
function usePreset(i){closePick();PRESET_ACTIVE=i;const c=PRESETS[i].c;savePresets();drawPresets();setPal({'1':c[0],'2':c[1],'3':c[2]});}
// Sélecteur à 64 couleurs : 8 familles (neutre, turquoise, bleu, violet, magenta, rouge, ambre, vert)
// en rampes de 8 nuances du clair au sombre ; les couleurs d'origine du jeu y figurent.
const COLORS64=["#e9ebec","#cdd3d5","#abb5ba","#89989f","#687a83","#4c5a61","#333d42","#1d2226","#e0f5f2","#b4efe3","#8fe6cf","#4bdcba","#30ba96","#307e67","#245143","#142e25","#dee9f8","#adcef5","#4fb8ff","#3c97ec","#227dc9","#285e86","#1f4056","#122531","#ebe1f5","#d1b6ed","#af81e4","#8b51d7","#6935b5","#4d337b","#342650","#1c152d","#f6e0ec","#f0b3d7","#e97cc0","#df49ab","#bc2e8f","#7f2f67","#522346","#2e1428","#f7dfe0","#f2b0b2","#ee7777","#e54743","#c23029","#82312b","#542621","#2f1613","#f9e8dc","#f9cba9","#ffa53a","#f69131","#d37818","#8b5b22","#593f1c","#322510","#e6f4e1","#c4ebb7","#98e283","#6bd454","#4bb238","#3c7934","#2a4f27","#172c16"];
let pickKey=null;
function openPick(k){const grid=$('cgrid');if(pickKey===k){closePick();return;}pickKey=k;
  ['1','2','3'].forEach(x=>$('pc'+x).setAttribute('aria-expanded',x===k));
  $('pc'+k).closest('label').after(grid);
  grid.innerHTML=COLORS64.map(c=>`<button role="option" data-c="${c}" style="background:${c}" title="${c}" aria-label="${c}" aria-selected="${c.toLowerCase()===String(PAL_U[k]).toLowerCase()}"></button>`).join('');
  grid.hidden=false;}
function closePick(){pickKey=null;$('cgrid').hidden=true;['1','2','3'].forEach(x=>$('pc'+x).setAttribute('aria-expanded','false'));}
function applyColor(k,c){const j=+k-1;PRESETS[PRESET_ACTIVE].c[j]=c;savePresets();drawPresets();setPal(Object.assign({},PAL_U,{[k]:c}));}
['1','2','3'].forEach(k=>$('pc'+k).addEventListener('click',e=>{e.preventDefault();openPick(k);}));
$('cgrid').addEventListener('click',e=>{const b=e.target.closest('button[data-c]');if(!b||!pickKey)return;const k=pickKey;applyColor(k,b.dataset.c);closePick();$('pc'+k).focus();});
addEventListener('keydown',e=>{if(e.key==='Escape'&&pickKey)closePick();});
$('presets').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;usePreset(+b.dataset.p);});
$('palReset').onclick=()=>{PRESETS[PRESET_ACTIVE].c=PRESETS_DEF[PRESET_ACTIVE].c.slice();usePreset(PRESET_ACTIVE);};
drawPresets();
if(!reduced)setInterval(()=>{liqFrame^=1;if(G&&$('overlay').hidden)render();},650);

function start(data){
  buildTiles();buildGen();buildLife();
  // partie reprise à chaud : la carte garde la taille qu'elle avait
  if(data&&data.G&&data.G.t){const g=data.G,w=g.w||96,h=g.h||64;if(g.t.length===w*h){W=w;H=h;F=W/96;vis=new Uint8Array(W*H);}}
  const fromHot=!!(data&&data.G&&data.G.t&&data.G.t.length===W*H);
  if(data&&data.G&&data.G.t&&data.G.st&&data.G.t.length===W*H){G=data.G;G.dmg=G.dmg||{};for(let i=0;i<G.t.length;i++)if(G.t[i]===LOW)G.t[i]=FLAT;   // herbes basses et couchées fusionnées
    if(G.st&&G.st.crit==null)G.st.crit=5;if(G.st)G.st.cout=10;if(G.st&&G.st.power<1)G.st.power=1;if(G.st&&(G.st.capteur<10||G.st.capteur===12||G.st.capteur===15))G.st.capteur=10;if(!G.ore)hideOre();if(!G.st||G.st.pre==null||G.st.energieMax==null){G.st={vie:100,vieMax:100,energie:100,energieMax:100,repar:0,power:5,vitesse:5,degats:10,capteur:10,cout:10,pre:80,esq:10,crit:5};if(G.inv)G.inv.forEach(o=>o.eq=0);}
  if(!G.inv)G.inv=invTest();if(!G.items)G.items={};if(!G.eff)G.eff={};if(!G.amb)G.amb=[];G.w=W;G.h=H;invMigre();
  if(!G.mode){G.mode='descente';G.niv=1;G.biome='plateau';G.suite=tirageBiomes();}if(G.st.matiere==null)G.st.matiere=0;if(G.sonar==null)G.sonar=1;   // partie commencée avant la descente
  palBiome(G.biome?BIOMES[G.biome].teinte:null);buildTiles();   // partie commencée avant l'inventaire
  if(!G.gems)hideGems();
  if(!G.beasts||!G.beasts.some(b=>b.sp===1)&&LIFE.cafar>0)spawnBeasts();
  if(G.fv!==2){G.fv=2;G.blood={};G.beasts=[];spawnAnimals();spawnBeasts();}started=!!data.started;computeFOV();}else newGame();
  new ResizeObserver(resize).observe($('mapwrap'));resize();
  if(G.over&&G.over.dead)dead();else if(G.over)end(G.sites.find(s=>s.id===G.over.site));else{started=true;$('overlay').hidden=true;}   // pas d'écran d'accueil : la partie commence directement
  // cinématique d'arrivée au tout premier lancement seulement (pas sur une partie reprise après une mise à jour)
  if(!fromHot&&!G.over&&!introSeen())playIntro();
  BOOT=false;
}
try{window.claude&&window.claude.hot&&window.claude.hot.snapshot&&window.claude.hot.snapshot(()=>({G,started}));}catch(e){}
const hot=window.claude&&window.claude.hot;
hot&&hot.ready?hot.ready(start):start((hot&&hot.data)||{});
