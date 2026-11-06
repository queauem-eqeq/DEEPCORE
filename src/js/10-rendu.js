/* ---------- Rendu ---------- */
const cv=$('view'),ctx=cv.getContext('2d');let cols=20,rows=15,camX=0,camY=0,vw=0,vh=0;
function resize(){const r=$('mapwrap').getBoundingClientRect();vw=Math.max(1,Math.floor(r.width));vh=Math.max(1,Math.floor(r.height));
  const dpr=devicePixelRatio||1;cv.width=vw*dpr;cv.height=vh*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
  cols=Math.ceil(vw/S);rows=Math.ceil(vh/S);render();}
const hash=(x,y)=>((x*73856093)^(y*19349663))>>>0;
let ox=0,oy=0;
/* ---------- Effets de percussion ---------- */
let FX=[],fxRaf=0;
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
  if(G.blood)for(const k in G.blood){const i=+k,bx=i%W,by=(i/W)|0;if(fog&&!G.seen[i])continue;put(TL['blood'+G.blood[k]],bx,by,fog&&!vis[i]?.3:.9);}
  for(const s of G.sites){if(fog&&!G.seen[idx(s.x,s.y)])continue;put(s.known?TL['site'+s.depth]:TL.siteUnknown,s.x,s.y,!fog||vis[idx(s.x,s.y)]?1:.35);}
  drawPath();
  if(G.animals)for(const a of G.animals)if(!fog||vis[idx(a.x,a.y)]){const [lx,ly]=lungeOff(f=>f.kind==='lunge'&&f.beast===a);ctx.globalAlpha=1;ctx.drawImage(TL['an'+a.sp+(a.dir<0?'l':'r')],(a.x-camX)*S+lx,(a.y-camY)*S+ly,S,S);}
  if(G.beasts)for(const b of G.beasts){if(!beastVisible(b))continue;const [lx,ly]=lungeOff(f=>f.kind==='lunge'&&f.beast===b);
    const px=(b.x-camX)*S+lx,py=(b.y-camY)*S+ly,img=TL['bz'+b.sp+(b.dir<0?'l':'r')];
    ctx.globalAlpha=1;ctx.drawImage(img,px,py,S,S);
    const fl=FX.find(f=>f.kind==='flash'&&f.beast===b);if(fl){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=1-fxP(fl);ctx.drawImage(img,px,py,S,S);ctx.drawImage(img,px,py,S,S);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;}
    const pv=BEASTS[b.sp].pv;if(b.hp<pv){const w=S-6;ctx.fillStyle='#000';ctx.fillRect(px+3,py-4,w,3);ctx.fillStyle='#ff3b3b';ctx.fillRect(px+3,py-4,Math.round(w*b.hp/pv),3);}}
  {const [lx,ly]=lungeOff(f=>f.kind==='lunge'&&f.robot);ctx.globalAlpha=1;ctx.drawImage(TL['robot_'+(G.face||'u')],(G.px-camX)*S+lx,(G.py-camY)*S+ly,S,S);}
  const ht=G.t[idx(G.px,G.py)];if(ht===LIQ)put(TL.wade,G.px,G.py,.95);else if(ht===DEEP)put(TL.wadeDeep,G.px,G.py,.95);
  for(const f of FX){if(f.kind!=='num')continue;const p=fxP(f),rise=reduced?0:p*14;
    ctx.globalAlpha=p<.6?1:1-(p-.6)/.4;ctx.font='bold 14px "JetBrains Mono", ui-monospace, monospace';ctx.textAlign='center';ctx.textBaseline='bottom';
    const tx=(f.x-camX)*S+S/2,ty=(f.y-camY)*S-2-rise-(f.stack||0)*14;ctx.fillStyle='#000';ctx.fillText(f.txt,tx+1,ty+1);ctx.fillStyle=f.col;ctx.fillText(f.txt,tx,ty);}
  ctx.globalAlpha=1;
  ctx.restore();
  if(HOV&&CURT&&!busy()){const ok=(x,y)=>{const i=idx(x,y);return (!fog||G.seen[i])&&(getPath()||Math.max(Math.abs(x-G.px),Math.abs(y-G.py))<=1);};
    ctx.globalAlpha=1;ctx.drawImage(ok(HOV.x,HOV.y)?CURT:CURT_DIM,(HOV.x-camX)*S,(HOV.y-camY)*S,S,S);}
  ctx.globalAlpha=1;side();mini();
}
const mv=$('mini'),mctx=mv.getContext('2d');
