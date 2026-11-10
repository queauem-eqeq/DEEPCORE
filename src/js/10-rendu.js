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
// Giclée de sang à la mort d'un ennemi : une trentaine de gouttes (pixels de tuile, opaques) projetées en l'air ;
// en retombant elles restent collées au sol (G.splat, pixels de carte), sauf dans l'eau ou un gouffre. Au plus SPLAT_MAX gouttes gardées.
const SPLAT_MAX=1500,BLOOD_COLS=['#b8242a','#b8242a','#8a1a20','#d8333a'];
function gore(x,y){const cx=(x+.5)*S,cy=(y+.5)*S,n=24+((Math.random()*12)|0);
  for(let j=0;j<n;j++){const an=Math.random()*Math.PI*2,v=70+Math.random()*110,r0=3+Math.random()*6;   // giclée vive : départ rapide, déjà écartée du centre
    SMOKE.p.push({x:cx+Math.cos(an)*r0,y:cy+Math.sin(an)*r0*.8,z:4+Math.random()*8,vx:Math.cos(an)*v,vy:Math.sin(an)*v*.8,vz:90+Math.random()*170,a:0,l:9,sz:Math.random()<.2?4:2,
      c:BLOOD_COLS[(Math.random()*BLOOD_COLS.length)|0],blood:true});}
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
      if(q.z<=0){const mx=Math.floor(q.x/S),my=Math.floor(q.y/S),t=mx>=0&&my>=0&&mx<W&&my<H?G.t[idx(mx,my)]:ROCK;
        if(t!==LIQ&&t!==DEEP&&t!==CHASM&&!blocks(t)){G.splat=G.splat||[];G.splat.push([Math.round(q.x/2)*2,Math.round(q.y/2)*2,q.c,q.sz]);
          if(G.splat.length>SPLAT_MAX)G.splat.splice(0,G.splat.length-SPLAT_MAX);landed=true;}continue;}
      SMOKE.p[n++]=q;fctx.fillStyle=q.c;fctx.fillRect(Math.round((q.x-camX*S)/2)*2,Math.round((q.y-q.z-camY*S)/2)*2,q.sz,q.sz);continue;}q.x+=(q.vx+Math.sin(now/600+q.l*9)*4)*dt;q.y+=q.vy*dt;if(q.smoke)q.vy*=Math.exp(-.6*dt);
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
  const hard=(x,y)=>{const a=Math.floor(x),b=Math.floor(y);if(a<0||b<0||a>=W||b>=H)return true;const i=idx(a,b),v=G.t[i];return v===ROCK||v===MOUNT||v===SHIP||(fog&&!vis[i]);};   // la zone hors de vue arrête les éclats
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
function fxLoop(){const now=performance.now();FX=FX.filter(f=>now-f.t0<f.dur);render();fxRaf=FX.length?requestAnimationFrame(fxLoop):0;}
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
function render(){
  if(!G||!TL.robot)return;ensureChasmOv();
  const vc=vw/S,vr=vh/S;
  const fx0=freeCam?camCX:G.px,fy0=freeCam?camCY:G.py;
  camX=Math.max(0,Math.min(W-Math.floor(vc),fx0-Math.floor(vc/2)));camY=Math.max(0,Math.min(H-Math.floor(vr),fy0-Math.floor(vr/2)));
  ox=0;oy=0;
  ctx.globalAlpha=1;ctx.imageSmoothingEnabled=false;ctx.fillStyle='#020605';ctx.fillRect(0,0,vw,vh);
  const sh=reduced?null:FX.find(f=>f.kind==='shake');ctx.save();
  if(sh){const a=(1-fxP(sh))*sh.amp;ctx.translate(Math.round((Math.random()*2-1)*a),Math.round((Math.random()*2-1)*a));}
  for(let y=camY;y<Math.min(H,camY+rows+1);y++)for(let x=camX;x<Math.min(W,camX+cols+1);x++){
    const i=idx(x,y),v=fog?vis[i]:1;if(!v&&!G.seen[i])continue;const t=G.t[i],h=hash(x,y),k=v?1:.28;
    if(t!==CHASM){ctx.globalAlpha=.08*k;ctx.fillStyle=PAL['3'];ctx.fillRect((x-camX)*S,(y-camY)*S,S,S);}
    const lv=densLevel(i);if(t===BRIDGE){}else if(lv)put(TL[`gd${lv}_${h%3}`],x,y,(.55+lv*.08)*k);else put(TL.ground0,x,y,.6*k);
    if(t===ROCK)put(h%3?TL.rock:TL.rock2,x,y,.95*k);
    else if(t===MOUNT)put(y>0&&G.t[idx(x,y-1)]===MOUNT?TL.mtBody:TL.mtTop,x,y,.9*k);
    else if((t===SHIP||t===DECK)&&G.ship){const sk=TL['ship_'+(x-G.ship.x)+'_'+(y-G.ship.y)];if(sk)put(sk,x,y,k);}
    if((t===ROCK||t===MOUNT)&&G.gems&&G.gems[i]==='cache'){put(TL.gemHole,x,y,k);put(TL.gemDim,x,y,k);}
    else if(t===MOUNT&&G.ore&&G.ore[i]&&!oreSol(G.ore[i]))put(oreTile(G.ore[i],false),x,y,k);
    else if(t===LIQ){ctx.globalAlpha=.24*k;ctx.fillStyle=PAL['2'];ctx.fillRect((x-camX)*S,(y-camY)*S,S,S);put((liqFrame+(h%2))%2?TL.liq1:TL.liq0,x,y,.9*k);}
    else if(t===DEEP){ctx.globalAlpha=k;ctx.fillStyle='#01060c';ctx.fillRect((x-camX)*S,(y-camY)*S,S,S);ctx.globalAlpha=.08*k;ctx.fillStyle=PAL['2'];ctx.fillRect((x-camX)*S,(y-camY)*S,S,S);put((liqFrame+(h%2))%2?TL.deep1:TL.deep0,x,y,.4*k);}
    else if(t===CHASM){ctx.globalAlpha=1;ctx.fillStyle='#000';ctx.fillRect((x-camX)*S,(y-camY)*S,S,S);if(CHASM_OV){ctx.globalAlpha=k;ctx.drawImage(CHASM_OV,x*16,y*16,16,16,(x-camX)*S,(y-camY)*S,S,S);}}
    else if(t===RUBBLE)put(TL.rubble,x,y,.65*k);
    else if(t===GRASS)put(TL.grass0,x,y,.9*k);
    else if(t===LOW)put(TL.low,x,y,.75*k);
    else if(t===FLAT)put(TL.flat0,x,y,.5*k);
    const dm=G.dmg&&G.dmg[i];if(dm&&(t===ROCK||t===MOUNT))put(TL.crackH,x,y,.95*k);
  }
  if(G.tracks)for(const k in G.tracks){const tr=G.tracks[k],age=G.turn-tr.t;if(age>=TRACK_LIFE){delete G.tracks[k];continue;}
    const i=+k;if(tr.i==null||(fog&&!vis[i]))continue;put(TL[`tk${tr.i}${tr.o}${Math.max(0,age)}`],i%W,(i/W)|0,.6);}
  if(G.gems)for(const k in G.gems){if(G.gems[k]!=='visible')continue;const i=+k;if(fog&&!G.seen[i])continue;put(TL.gemDim,i%W,(i/W)|0,fog&&!vis[i]?.35:1);}
  if(G.ore)for(const k in G.ore){if(!oreSol(G.ore[k]))continue;const i=+k;if(fog&&!G.seen[i])continue;put(oreTile(G.ore[k],true),i%W,(i/W)|0,fog&&!vis[i]?.35:1);}
  if(G.splat)for(const [px,py,c,sz] of G.splat){const i=idx(Math.floor(px/S),Math.floor(py/S));if(fog&&!G.seen[i])continue;   // gouttes de sang au sol
    ctx.globalAlpha=fog&&!vis[i]?.3:1;ctx.fillStyle=c;ctx.fillRect(px-camX*S,py-camY*S,sz,sz);}
  ctx.globalAlpha=1;
  if(G.blood)for(const k in G.blood){const i=+k,bx=i%W,by=(i/W)|0;if(fog&&!G.seen[i])continue;put(TL['blood'+G.blood[k]],bx,by,fog&&!vis[i]?.3:.9);}
  for(const s of G.sites){if(fog&&!G.seen[idx(s.x,s.y)])continue;put(s.known?TL['site'+s.depth]:TL.siteUnknown,s.x,s.y,!fog||vis[idx(s.x,s.y)]?1:.35);}
  // touche V : champ de vision de chaque ennemi visible (cases qu'il peut voir : portée de détection et ligne de vue), entouré d'un pointillé
  if(SHOWVIS){   // deux zones sans superposition : rouge = ennemis qui vous ont repéré (prioritaire), blanche = les autres
    const seen=new Set(),calm=new Set();
    for(const [o,r,al] of [...(G.beasts||[]).map(b=>[b,BEASTS[b.sp].d,b.hunt>0]),...(G.animals||[]).map(a=>[a,SPECIES[a.sp].d+(a.aware?5:0),!!a.aware])]){
      if(fog&&!vis[idx(o.x,o.y)])continue;const cells=al?seen:calm;
      for(let y=Math.max(0,o.y-r);y<=Math.min(H-1,o.y+r);y++)for(let x=Math.max(0,o.x-r);x<=Math.min(W-1,o.x+r);x++){
        const i=idx(x,y);if(cells.has(i)||Math.hypot(x-o.x,y-o.y)>r||(fog&&!G.seen[i]))continue;if(inCone(o,x,y)&&los(o.x,o.y,x,y))cells.add(i);}}
    for(const i of seen)calm.delete(i);
    drawVisCells(calm,'#ffffff');drawVisCells(seen,'#b8242a');}
  drawPath();
  if(G.animals)for(const a of G.animals)if(!fog||vis[idx(a.x,a.y)]){const [lx,ly]=lungeOff(f=>f.kind==='lunge'&&f.beast===a);ctx.globalAlpha=1;ctx.drawImage(TL['an'+a.sp+(a.dir<0?'l':'r')],(a.x-camX)*S+lx,(a.y-camY)*S+ly,S,S);}
  if(G.beasts)for(const b of G.beasts){if(!beastVisible(b))continue;const [lx,ly]=lungeOff(f=>f.kind==='lunge'&&f.beast===b);
    const px=(b.x-camX)*S+lx,py=(b.y-camY)*S+ly,img=TL['bz'+b.sp+(b.dir<0?'l':'r')];
    ctx.globalAlpha=1;ctx.drawImage(img,px,py,S,S);
    const fl=FX.find(f=>f.kind==='flash'&&f.beast===b);if(fl){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=1-fxP(fl);ctx.drawImage(img,px,py,S,S);ctx.drawImage(img,px,py,S,S);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;}
    const pv=BEASTS[b.sp].pv;if(b.hp<pv){const w=S-6;ctx.fillStyle='#000';ctx.fillRect(px+3,py-4,w,3);ctx.fillStyle='#ff3b3b';ctx.fillRect(px+3,py-4,Math.round(w*b.hp/pv),3);}}
  const wreck=BOOM||(G.over&&G.over.dead);   // foreuse détruite : plus dessinée
  if(!wreck){const [lx,ly]=lungeOff(f=>f.kind==='lunge'&&f.robot);ctx.globalAlpha=1;ctx.drawImage(TL['robot_'+(G.face||'u')],(G.px-camX)*S+lx,(G.py-camY)*S+ly,S,S);}
  const ht=G.t[idx(G.px,G.py)];if(wreck){}else if(ht===LIQ)put(TL.wade,G.px,G.py,.95);else if(ht===DEEP)put(TL.wadeDeep,G.px,G.py,.95);
  for(const f of FX){if(f.kind!=='num')continue;const p=fxP(f),rise=reduced?0:p*14;
    ctx.globalAlpha=p<.6?1:1-(p-.6)/.4;ctx.font='bold 14px "JetBrains Mono", ui-monospace, monospace';ctx.textAlign='center';ctx.textBaseline='bottom';
    const tx=(f.x-camX)*S+S/2,ty=(f.y-camY)*S-2-rise-(f.stack||0)*14;ctx.fillStyle='#000';ctx.fillText(f.txt,tx+1,ty+1);ctx.fillStyle=f.col;ctx.fillText(f.txt,tx,ty);}
  ctx.globalAlpha=1;
  if(BOOM)drawBoom();
  ctx.restore();
  smokeKick();
  if(HOV&&CURT&&!busy()){const ok=(x,y)=>{const i=idx(x,y);return (!fog||G.seen[i])&&(getPath()||Math.max(Math.abs(x-G.px),Math.abs(y-G.py))<=1);};
    ctx.globalAlpha=1;ctx.drawImage(ok(HOV.x,HOV.y)?CURT:CURT_DIM,(HOV.x-camX)*S,(HOV.y-camY)*S,S,S);}
  ctx.globalAlpha=1;side();mini();
}
const mv=$('mini'),mctx=mv.getContext('2d');
