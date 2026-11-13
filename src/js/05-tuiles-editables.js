/* ---------- Tile editor : tuiles éditables ---------- */
// Codes : '.' transparent, '0' noir, 'w' blanc, '1' accent, '2' bio, '3' monde, 'r' rouge (sang)
function curGen(f){const r=[];for(let y=0;y<16;y++){let l='';for(let x=0;x<16;x++)l+=f(x,y)?'w':'.';r.push(l);}return r;}
// contour noir automatique autour des pixels colorés, pour rester lisible sur un terrain clair
function curOutline(r){return r.map((l,y)=>[...l].map((c,x)=>c!=='.'?c:[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>{const n=(r[y+dy]||'')[x+dx];return n&&n!=='.'&&n!=='0';})?'0':'.').join(''));}
const CURSOR_DEF=curOutline(curGen((x,y)=>((y===0||y===15)&&(x<5||x>10))||((x===0||x===15)&&(y<5||y>10))));   // viseur « Crochets »
const TILE_LIST=[
  ['Viseur',[['cursor','Viseur']]],
  ['Foreuse et faune',[['robot_u','Foreuse'],['an0r','Insectoïde'],['bz0r','Crabos'],['bz1r','Cafar']]],
  ['Terrain',[['ground0','Sol'],['rock','Rocher'],['rock2','Rocher 2'],['mtTop','Crête'],['mtBody','Montagne'],['liq0','Eau A'],['liq1','Eau B'],['deep0','Eau profonde'],['grass0','Herbes hautes'],['flat0','Herbes basses'],['rubble','Gravats'],['crackH','Fissures'],['wade','Remous'],['wadeDeep','Remous profond']]],
  ['Objets',[['siteUnknown','Site'],['gem','Joyau'],['ore1','Éclats petits (montagne)'],['ore2','Éclats moyens (montagne)'],['ore','Éclats gros (montagne)'],['oreSol1','Éclats petits (sol)'],['oreSol2','Éclats moyens (sol)'],['oreSol','Éclats gros (sol)'],['blood0','Sang A'],['blood1','Sang B']]],
  ['Vaisseau',[['ship','Cargo']]],
  ['Intro',[['nuage0','Nuage plein'],['nuage1','Nuage texturé'],['nuage2','Bord diagonal'],['nuage3','Bord croisé'],['nuage4','Bord rayé'],['nuage5','Bord tramé']]]];
const TILE_DEPS={robot_u:['robot_u','robot_r','robot_d','robot_l'],an0r:['an0r','an0l'],bz0r:['bz0r','bz0l'],bz1r:['bz1r','bz1l'],deep0:['deep0','deep1'],grass0:['grass0'],gem:['gem','gemDim','gemHole'],ship:['ship',...SHIP_KEYS]};
// dimensions en pixels : 16 x 16, sauf le vaisseau édité d'un bloc (5 x 6 tuiles)
const tileDim=k=>k==='ship'?[SGW*16,SGH*16]:[16,16];
const validTile=(r,k)=>{const [w,h]=tileDim(k);return Array.isArray(r)&&r.length===h&&r.every(l=>typeof l==='string'&&l.length===w&&/^[.0w123r]+$/.test(l));};
const PAT_ORIG={};
let TILE_OV={},TILE_BASE={};   // TILE_BASE : dernières tuiles enregistrées, auxquelles « Rétablir » revient
try{const o=JSON.parse(localStorage.getItem('np-tiles-base')||'null');if(o&&typeof o==='object')for(const k in o)if(validTile(o[k],k))TILE_BASE[k]=o[k];}catch(e){}
function commitTileBase(){TILE_BASE=JSON.parse(JSON.stringify(TILE_OV));try{localStorage.setItem('np-tiles-base',JSON.stringify(TILE_BASE));}catch(e){}}
try{const o=JSON.parse(localStorage.getItem('np-tiles')||'null');if(o&&typeof o==='object')for(const k in o)if(validTile(o[k],k))TILE_OV[k]=o[k];}catch(e){}
const saveTiles=()=>{try{localStorage.setItem('np-tiles',JSON.stringify(TILE_OV));}catch(e){}touchLocal();};
// version retouchée si elle existe, sinon l'originale
const TF=k=>{const o=TILE_OV[k];if(o)return (x,y)=>o[y][x];const p=PAT_ORIG[k];return typeof p==='function'?p:(x,y)=>p[y][x];};
for(const [,l] of TILE_LIST)for(const [k] of l)PAT_ORIG[k]=k==='cursor'?CURSOR_DEF:k==='ship'?shipPixels(SHIP_GRID):PAT[k];
PAT_ORIG.gem=PAT.gem.map(l=>l.replace(/w/g,'.'));   // joyau sans éclat (choix validé)
for(const k in PAT_ORIG)if(k!=='cursor'&&k!=='ship')PAT[k]=(x,y)=>TF(k)(x,y);
// tuiles du vaisseau posées case par case sur la carte, découpées dans l'image d'ensemble
for(const k of SHIP_KEYS){const [,cx,cy]=k.split('_').map(Number);PAT[k]=(x,y)=>TF('ship')(cx*16+x,cy*16+y);}
PAT.robot_r=(x,y)=>TF('robot_u')(y,15-x);PAT.robot_d=(x,y)=>TF('robot_u')(15-x,15-y);PAT.robot_l=(x,y)=>TF('robot_u')(15-y,x);
for(const k of ['an0','bz0','bz1'])PAT[k+'l']=(x,y)=>TF(k+'r')(15-x,y);
PAT.deep1=(x,y)=>TF('deep0')((x+14)%16,y);
PAT.gemDim=(x,y)=>TF('gem')(x,y);
PAT.gemHole=(x,y)=>[[0,0],[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>{const a=x+dx,b=y+dy;if(a<0||b<0||a>15||b>15)return false;const c=TF('gem')(a,b);return c&&c!=='.';})?'0':'.';
let TL={},ANIMG=[],fog=true;
try{fog=localStorage.getItem('np-fog')!=='off';}catch(e){}
const inkCol=ch=>ch==='0'?'#020605':ch==='r'?'#b8242a':ch==='w'?'#ffffff':PAL[ch];
function tileCanvas(src,w=16,h=16){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){const ch=typeof src==='function'?src(i,j):src[j][i];const col=inkCol(ch);if(col){x.fillStyle=col;x.fillRect(i,j,1,1);}}return c;}
// reconstruit une tuile retouchée et ses variantes
function rebuildTile(k){for(const d of TILE_DEPS[k]||[k]){if(d==='ship')TL.ship=tileCanvas(TF('ship'),SGW*16,SGH*16);else if(PAT[d])TL[d]=tileCanvas(PAT[d]);if(/^(an|bz)\d+r$|^robot_r$/.test(d)){try{ICON[d]=TL[d].toDataURL();}catch(e){}}}buildCursor();}
function buildTiles(){
  TL={};for(const k in PAT)TL[k]=tileCanvas(PAT[k]);TL.ship=tileCanvas(TF('ship'),SGW*16,SGH*16);buildCursor();
  ICON={};for(const k in TL)if(/^(an|bz)\d+r$|^robot_r$/.test(k)){try{ICON[k]=TL[k].toDataURL();}catch(e){}}
  ANIMG=SPECIES.map((_,i)=>{try{return TL['an'+i+'r'].toDataURL();}catch(e){return '';}});
  const r=document.documentElement.style;r.setProperty('--c1',PAL['1']);r.setProperty('--c2',PAL['2']);r.setProperty('--c3',PAL['3']);
  ['1','2','3'].forEach(k=>{$('pc'+k).style.background=PAL[k];$('pc'+k).title=PAL[k];});
}
function setPal(p){PAL=p;try{localStorage.setItem('np-palette',JSON.stringify(PAL));}catch(e){}touchLocal();buildTiles();render();}

