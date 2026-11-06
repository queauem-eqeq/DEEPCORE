/* ---------- Tile editor ---------- */
let edKey='cursor',edInk='3',symH=false,symV=false,curDown=null;
const TERRAIN=new Set(TILE_LIST[2][1].map(([k])=>k));
const tileName=k=>{for(const [,l] of TILE_LIST)for(const [kk,n] of l)if(kk===k)return n;return k;};
const tileImg=k=>k==='cursor'?CURT:TL[k];
function curBg(x,w,h){x.imageSmoothingEnabled=false;x.globalAlpha=1;x.fillStyle='#020605';x.fillRect(0,0,w,h);x.globalAlpha=.08;x.fillStyle=PAL['3'];x.fillRect(0,0,w,h);x.globalAlpha=1;}
// fond d'aperçu : sol pour la foreuse, la faune, les objets et le viseur ; fond nu pour le terrain
function tileBg(x,k,px,py,sz){if(!TERRAIN.has(k)){x.globalAlpha=.6;x.drawImage(TL.ground0,px,py,sz,sz);x.globalAlpha=1;}}
function drawThumb(c,k){const x=c.getContext('2d'),[w,h]=tileDim(k),sc=48/Math.max(w,h),dw=w*sc,dh=h*sc;curBg(x,48,48);tileBg(x,k,0,0,48);x.drawImage(tileImg(k),(48-dw)/2,(48-dh)/2,dw,dh);}
function drawCurList(){$('curList').innerHTML=TILE_LIST.map(([g,l])=>`<div class="tgrp"><h3>${g}</h3><div class="cur-list">${l.map(([k,n])=>`<button data-k="${k}" aria-pressed="${k===edKey}" aria-label="Tuile ${n}"><canvas width="48" height="48"></canvas>${n}</button>`).join('')}</div></div>`).join('');
  $('curList').querySelectorAll('button[data-k]').forEach(b=>drawThumb(b.querySelector('canvas'),b.dataset.k));}
function drawInks(){$('curInks').querySelectorAll('button[data-ink]').forEach(b=>{const i=b.querySelector('i');if(b.dataset.ink!=='.')i.style.background=inkCol(b.dataset.ink);});}
const edPs=k=>tileDim(k)[0]>16?4:16;   // taille d'un pixel dans l'éditeur
function drawCurEd(){const cv=$('curEd'),[w,h]=tileDim(edKey),ps=edPs(edKey);if(cv.width!==w*ps||cv.height!==h*ps){cv.width=w*ps;cv.height=h*ps;}cv.style.width=w*ps+'px';
  const x=cv.getContext('2d'),r=rowsOf(edKey);x.imageSmoothingEnabled=false;$('edName').textContent=tileName(edKey)+(TILE_OV[edKey]?' · retouchée':'');
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){const ch=r[j][i];x.fillStyle=ch==='.'?((i+j)%2?'#07100e':'#0b1714'):inkCol(ch)||'#0b1714';x.fillRect(i*ps,j*ps,ps,ps);
    if(ch==='0'){const m=Math.max(1,ps>>2);x.fillStyle='#3a5a55';x.fillRect(i*ps+(ps>>1)-m/2,j*ps+(ps>>1)-m/2,m,m);}}
  if(ps>=8){x.fillStyle='rgba(255,255,255,.07)';for(let k=1;k<w;k++)x.fillRect(k*ps,0,1,h*ps);for(let k=1;k<h;k++)x.fillRect(0,k*ps,w*ps,1);}
  else{x.fillStyle='rgba(255,255,255,.12)';for(let k=16;k<w;k+=16)x.fillRect(k*ps,0,1,h*ps);for(let k=16;k<h;k+=16)x.fillRect(0,k*ps,w*ps,1);}   // limites des cases
  x.fillStyle='rgba(255,165,58,.35)';x.fillRect(w*ps/2,0,1,h*ps);x.fillRect(0,h*ps/2,w*ps,1);}
function drawCurPrev(){const x=$('curPrev').getContext('2d'),k=edKey,img=tileImg(k);curBg(x,256,96);
  if(k==='ship'){for(let j=0;j<3;j++)for(let i=0;i<8;i++){x.globalAlpha=.6;x.drawImage(TL.ground0,i*32,j*32,32,32);}x.globalAlpha=1;x.drawImage(img,8,0,80,96);x.drawImage(img,128,8,66,80);return;}
  tileBg(x,k,0,0,96);x.drawImage(img,0,0,96,96);          // grand format, pixels visibles
  for(let j=0;j<3;j++)for(let i=0;i<4;i++){const px=112+i*32,py=j*32;
    if(TERRAIN.has(k))x.drawImage(img,px,py,32,32);       // terrain : pavage pour juger les raccords
    else{x.globalAlpha=.6;x.drawImage(TL.ground0,px,py,32,32);x.globalAlpha=1;if((i+j)%2===1)x.drawImage(img,px,py,32,32);}}}
function tileChanged(){if(TILE_OV[edKey])saveTiles();else saveTiles();rebuildTile(edKey);drawCurEd();drawCurPrev();
  const b=$('curList').querySelector(`button[data-k="${edKey}"]`);if(b)drawThumb(b.querySelector('canvas'),edKey);render();}
function curPaint(ev){const [w,h]=tileDim(edKey),r=$('curEd').getBoundingClientRect(),px=Math.floor((ev.clientX-r.left)/r.width*w),py=Math.floor((ev.clientY-r.top)/r.height*h);
  if(px<0||py<0||px>=w||py>=h)return;const rows=rowsOf(edKey).map(l=>[...l]);
  const pts=[[px,py]];if(symH)pts.push([w-1-px,py]);if(symV)pts.push([px,h-1-py]);if(symH&&symV)pts.push([w-1-px,h-1-py]);let ch=false;
  for(const [a,b] of pts)if(rows[b][a]!==curDown){rows[b][a]=curDown;ch=true;}
  if(ch){TILE_OV[edKey]=rows.map(l=>l.join(''));tileChanged();}}
function openCur(){if(TRAV)stopTravel();drawInks();drawCurList();drawCurEd();drawCurPrev();$('viseurs').hidden=false;$('curClose').focus();}
function closeCur(){$('viseurs').hidden=true;$('curBtn').focus();render();}
$('curBtn').onclick=openCur;$('curClose').onclick=closeCur;
$('viseurs').addEventListener('click',e=>{if(e.target===$('viseurs'))closeCur();});
$('curList').addEventListener('click',e=>{const b=e.target.closest('button[data-k]');if(!b)return;edKey=b.dataset.k;
  $('curList').querySelectorAll('button[data-k]').forEach(x=>x.setAttribute('aria-pressed',x===b));drawCurEd();drawCurPrev();});
$('curInks').addEventListener('click',e=>{const b=e.target.closest('button[data-ink]');if(!b)return;edInk=b.dataset.ink;
  $('curInks').querySelectorAll('button[data-ink]').forEach(x=>x.setAttribute('aria-pressed',x===b));});
$('symH').onclick=()=>{symH=!symH;$('symH').setAttribute('aria-pressed',symH);};
$('symV').onclick=()=>{symV=!symV;$('symV').setAttribute('aria-pressed',symV);};
$('curEd').addEventListener('contextmenu',e=>e.preventDefault());
$('curEd').addEventListener('pointerdown',e=>{e.preventDefault();$('curEd').setPointerCapture(e.pointerId);curDown=e.button===2?'.':edInk;curPaint(e);});
$('curEd').addEventListener('pointermove',e=>{if(curDown!=null)curPaint(e);});
$('curEd').addEventListener('pointerup',()=>{curDown=null;});$('curEd').addEventListener('pointercancel',()=>{curDown=null;});
$('curOutline').onclick=()=>{TILE_OV[edKey]=curOutline(rowsOf(edKey).map(l=>l.replace(/0/g,'.')));tileChanged();};
$('curClear').onclick=()=>{const [w,h]=tileDim(edKey);TILE_OV[edKey]=Array(h).fill('.'.repeat(w));tileChanged();};
$('curReset').onclick=()=>{if(TILE_BASE[edKey])TILE_OV[edKey]=TILE_BASE[edKey].slice();else delete TILE_OV[edKey];tileChanged();};
