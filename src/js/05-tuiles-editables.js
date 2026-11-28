/* ---------- Tile editor : tuiles éditables ---------- */
// Codes : '.' transparent, '0' noir, 'w' blanc, '1' accent, '2' bio, '3' monde, 'r' danger (rouge de la palette), '5' bâti,
// 'R' rouge fixe, le même quelle que soit la palette ('5' et 'R' : 22 novembre 2026)
function curGen(f){const r=[];for(let y=0;y<16;y++){let l='';for(let x=0;x<16;x++)l+=f(x,y)?'w':'.';r.push(l);}return r;}
// contour noir automatique autour des pixels colorés, pour rester lisible sur un terrain clair
function curOutline(r){return r.map((l,y)=>[...l].map((c,x)=>c!=='.'?c:[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>{const n=(r[y+dy]||'')[x+dx];return n&&n!=='.'&&n!=='0';})?'0':'.').join(''));}
const CURSOR_DEF=curOutline(curGen((x,y)=>((y===0||y===15)&&(x<5||x>10))||((x===0||x===15)&&(y<5||y>10))));   // viseur « Crochets »
const TILE_LIST=[
  ['Viseur',[['cursor','Viseur']]],
  ['Foreuse et faune',[['robot_u','Foreuse'],['an0r',SPECIES[0].n],...BEASTS.map((b,i)=>['bz'+i+'r',b.n])]],
  ['Terrain',[['ground0','Sol'],['rock','Rocher'],['rock2','Rocher 2'],['rock3','Rocher 3'],['mtTop','Crête'],['mtBody','Montagne'],['hardTop','Crête dure'],['hardBody','Montagne dure'],['wall','Mur'],['wallFace','Mur (face)'],['floor','Sol bâti'],['solPont','Sol (pont)'],['door','Porte'],['doorOpen','Porte ouverte'],['doorOpenV','Porte ouverte (côté)'],['pillar','Pilier'],['vitre','Mur vitré'],['lock','Porte verrouillée'],['cle','Clé'],['liq0','Eau A'],['liq1','Eau B'],['deep0','Eau profonde'],['grass0','Herbes hautes'],['flat0','Herbes basses'],['rubble','Gravats'],['crackH','Fissures'],['wade','Remous'],['wadeDeep','Remous profond']]],
  ['Objets au sol',[['o_foreuse','Foreuse'],['o_usine','Coque d’usine'],['o_servo','Servomoteur'],['o_optique','Téléobjectif'],['o_viseur','Viseur laser'],['o_conden','Condensateur'],['o_gyro','Gyroscope'],['o_stabil','Stabilisateur'],['o_accu','Accumulateur'],['o_repar','Réparobots'],['o_batterie','Batterie'],['o_fumigene','Fumigène'],['o_charge','Charge sismique'],['o_vrille','Vrille rapide'],['o_trepan','Trépan lourd'],['o_carene','Carène légère'],['o_blindage','Blindage composite'],['o_capsule','Consommable non identifié'],['o_puissance','Module de puissance'],['o_berserk','Surrégime'],['o_camo','Camouflage optique'],['o_balise','Balise'],['o_court','Court-circuit'],['o_plan','Plan de fabrication']]],
  ['Objets',[['siteUnknown','Site'],['objet','Objet au sol (générique)'],['ore1','Éclats petits (montagne)'],['ore2','Éclats moyens (montagne)'],['ore','Éclats gros (montagne)'],['oreSol1','Éclats petits (sol)'],['oreSol2','Éclats moyens (sol)'],['oreSol','Éclats gros (sol)']]],
  ['Artefacts',[['antenne','Antenne'],['antenneOn','Antenne allumée'],['terminal','Terminal'],['mach0','Tuyaux'],['mach1','Serveur'],['mach2','Caisses'],['mach3','Ordinateur'],['mach4','Établi'],['mach5','Cuve'],['mach6','Générateur'],['mach7','Console'],['mach8','Turbine'],['mach9','Armoire électrique']]],
  ['Machines',[['tourelle','Tourelle laser'],['tourelleOn','Tourelle laser (tir)'],['pylone','Croix laser'],['pyloneOn','Croix laser (allumée)'],['pile','Pile énergétique'],['socle','Socle'],['socleOn','Socle alimenté'],['levier','Levier'],['levierOn','Levier (actionné)'],['grille','Grille d’énergie'],['station','Station de réparation'],['stationOff','Station (vide)'],['chargeur','Distributeur de pile'],['fabric','FABLAB'],['niche','Niche (salle piégée)'],['nicheOuverte','Niche ouverte'],['glu','Boule de glu'],['vitrine','Vitrine'],['vitrineOff','Vitrine verrouillée']]],
  ['Vaisseau',[['ship','Cargo']]],
  ['Épaves',[...EPV_CLES.map(k=>['epv_'+k,EPV_MODELES[k].n[0]+EPV_MODELES[k].n.slice(1).toLowerCase()]),['coque','Plaque de coque'],
    ['fosseSol','Fosse (sol)'],['fosseBord','Fosse (bord)']]],
  ['FX',[['boom0','Explosion 1 (éclair)'],['boom1','Explosion 2 (damier)'],['boom2','Explosion 3 (braises)'],['laserV','Laser (rayon)'],['laserX','Laser (croix)'],['nuage0','Nuage plein'],['nuage1','Nuage texturé'],['nuage2','Bord diagonal'],['nuage3','Bord croisé'],['nuage4','Bord rayé'],['nuage5','Bord tramé']]]];
const TILE_DEPS={robot_u:['robot_u','robot_r','robot_d','robot_l'],an0r:['an0r','an0l'],bz0r:['bz0r','bz0l'],bz1r:['bz1r','bz1l'],
  deep0:['deep0','deep1'],grass0:['grass0'],gem:['gem','gemDim','gemHole'],ship:['ship',...SHIP_KEYS]};
// dimensions en pixels : 16 x 16, sauf le vaisseau édité d'un bloc (5 x 6 tuiles)
BEASTS.forEach((_,i)=>{TILE_DEPS['bz'+i+'r']=['bz'+i+'r','bz'+i+'l'];});
// grandes tuiles, retouchées d'un bloc : le cargo et les modèles d'épaves (28 novembre 2026)
const TILE_GRANDES={ship:[SGW*16,SGH*16]};
for(const k of EPV_CLES){const g=EPV_MODELES[k].g;TILE_GRANDES['epv_'+k]=[Math.max(...g.map(r=>r.length))*16,g.length*16];}
const tileDim=k=>TILE_GRANDES[k]||[16,16];
const validTile=(r,k)=>{const [w,h]=tileDim(k);
  return Array.isArray(r)&&r.length===h&&r.every(l=>typeof l==='string'&&l.length===w&&/^[.0w123r5Rd]+$/.test(l));};
const PAT_ORIG={};
let TILE_OV={},TILE_BASE={};   // TILE_BASE : dernières tuiles enregistrées, auxquelles « Rétablir » revient
try{const o=JSON.parse(localStorage.getItem('np-tiles-base')||'null');
  if(o&&typeof o==='object')for(const k in o)if(validTile(o[k],k))TILE_BASE[k]=o[k];}catch(e){}
function commitTileBase(){TILE_BASE=JSON.parse(JSON.stringify(TILE_OV));
  try{localStorage.setItem('np-tiles-base',JSON.stringify(TILE_BASE));}catch(e){}}
try{const o=JSON.parse(localStorage.getItem('np-tiles')||'null');
  if(o&&typeof o==='object')for(const k in o)if(validTile(o[k],k))TILE_OV[k]=o[k];}catch(e){}
const saveTiles=()=>{try{localStorage.setItem('np-tiles',JSON.stringify(TILE_OV));}catch(e){}touchLocal();};
// version retouchée si elle existe, sinon l'originale
const TF=k=>{const o=TILE_OV[k];if(o)return (x,y)=>o[y][x];const p=PAT_ORIG[k];return typeof p==='function'?p:(x,y)=>p[y][x];};
for(const [,l] of TILE_LIST)for(const [k] of l)PAT_ORIG[k]=k==='cursor'?CURSOR_DEF:k==='ship'?shipPixels(SHIP_GRID):
  k.startsWith('epv_')?epvPixels(EPV_MODELES[k.slice(4)].g):PAT[k];
for(const k in PAT_ORIG)if(k!=='cursor'&&!TILE_GRANDES[k])PAT[k]=(x,y)=>TF(k)(x,y);
// tuiles du vaisseau posées case par case sur la carte, découpées dans l'image d'ensemble
for(const k of SHIP_KEYS){const [,cx,cy]=k.split('_').map(Number);PAT[k]=(x,y)=>TF('ship')(cx*16+x,cy*16+y);}
// tourelle : quatre sens de tir
for(const k of ['tourelle','tourelleOn']){PAT[k+'_d']=(x,y)=>TF(k)(x,y);PAT[k+'_u']=(x,y)=>TF(k)(15-x,15-y);
  PAT[k+'_l']=(x,y)=>TF(k)(y,15-x);PAT[k+'_r']=(x,y)=>TF(k)(15-y,x);TILE_DEPS[k]=[k,k+'_d',k+'_u',k+'_r',k+'_l'];}
PAT.robot_r=(x,y)=>TF('robot_u')(y,15-x);PAT.robot_d=(x,y)=>TF('robot_u')(15-x,15-y);PAT.robot_l=(x,y)=>TF('robot_u')(15-y,x);
for(const k of ['an0',...BEASTS.map((_,i)=>'bz'+i)])PAT[k+'l']=(x,y)=>TF(k+'r')(15-x,y);
// mine armée : la tuile de la mine, bio en rouge et accent en blanc ; elle alterne avec la tuile normale (clignotement)
// Roche dure (21 novembre 2026) : mêmes dessins que la montagne tendre (retouches comprises), en encre foncée 'd'
PAT.hardBody=(x,y)=>{const c=TF('mtBody')(x,y);return c==='3'?'d':c;};PAT.hardTop=(x,y)=>{const c=TF('mtTop')(x,y);return c==='3'?'d':c;};
// retouchables comme les autres (24 novembre 2026) : sans retouche, elles suivent la montagne tendre ; avec, elles vivent leur vie
// Montagne dure et Crête dure : dessins du joueur adoptés (base de l'artefact, 25 novembre 2026 à 22 h 05) ; ils ne suivent donc plus
// la Montagne et la Crête tendres.
PAT.hardBody=[".ddd.ddd.ddd.d.d", "d.d.d.d.d.d.ddd.", "dd.ddd.ddd.ddd.d", "d.d.d.d.d.d.d.dd", ".ddd.ddd.d.d.ddd", "d.d.d.d.d.d.d.d.", "dd.d.d.ddd.ddd.d", "d.ddd.ddd.d.d.d.", ".ddd.ddd.ddd.ddd", "d.d.d.d.d.d.ddd.", "dd.ddd.ddd.ddd.d", "d.d.d.d.d.d.d.d.", ".ddd.ddd.d.d.ddd", "ddd.d.d.d.d.ddd.", "dd.ddd.ddd.ddd.d", "d.ddd.d.d.d.d.d."];
PAT.hardTop=["................", "................", "................", "....d...........", "...d.d..........", "..d.d.d.........", ".d.ddd.d...d....", "d.d.d.d.d.ddd...", ".ddd.ddd.ddd.d..", "d.d.ddd.d.d.d.d.", "dd.ddd.ddd.ddd.d", "d.d.d.d.d.d.d.d.", ".ddd.ddd.ddd.ddd", "d.d.d.d.ddd.d.d.", "dd.ddd.d.d.ddd.d", "d.ddd.d.d.ddd.d."];
for(const k of ['hardBody','hardTop']){PAT_ORIG[k]=PAT[k];PAT[k]=(x,y)=>TF(k)(x,y);}
// Fonds des crêtes : seule la partie AU-DESSUS de la ligne de crête est un fond, le reste garde ses trous (sinon la crête sombre paraît plus claire)
const crestY=(f,x)=>{for(let y=0;y<16;y++)if(f(x,y)!=='.')return y;return 16;};
// crête de roche dure : fond de roche tendre
PAT.hardTopBg=(x,y)=>{const f=TF('hardTop');return y<crestY(f,x)&&TF('mtBody')(x,y)==='3'?'3':'.';};
// crête de roche tendre sous de la roche dure : fond de roche dure
PAT.softTopBg=(x,y)=>{const f=TF('mtTop');return y<crestY(f,x)&&TF('mtBody')(x,y)==='3'?'d':'.';};
TILE_DEPS.mtBody=['mtBody','hardBody','hardTopBg','softTopBg'];TILE_DEPS.mtTop=['mtTop','hardTop','hardTopBg','softTopBg'];TILE_DEPS.hardTop=['hardTop','hardTopBg'];
PAT.mineA=(x,y)=>{const c=TF('bz'+MINE_I+'r')(x,y);return c==='2'?'r':c==='1'?'w':c==='r'?'w':c;};TILE_DEPS['bz'+MINE_I+'r'].push('mineA');
PAT.deep1=(x,y)=>TF('deep0')((x+14)%16,y);
// FX (22 novembre 2026) : rayons en rouge vif ('L'), l'horizontal tourné du vertical ; variantes décalées des explosions pour le crépitement
const laserL=k=>(x,y)=>{const c=TF(k)(x,y);return c==='r'?'L':c;};
PAT.laserV_=laserL('laserV');PAT.laserH_=(x,y)=>laserL('laserV')(y,15-x);PAT.laserX_=laserL('laserX');
PAT.boom1b=(x,y)=>TF('boom1')((x+2)%16,y);PAT.boom2b=(x,y)=>TF('boom2')(15-x,y);
Object.assign(TILE_DEPS,{laserV:['laserV','laserV_','laserH_'],laserX:['laserX','laserX_'],boom1:['boom1','boom1b'],boom2:['boom2','boom2b']});
let TL={},ANIMG=[],fog=true;
try{fog=localStorage.getItem('np-fog')!=='off';}catch(e){}
const ROUGE_FIXE='#d8180b';   // pris dans LACKING64
const inkCol=ch=>ch==='0'?'#020605':ch==='r'||ch==='L'?PAL['4']:ch==='R'?ROUGE_FIXE:ch==='w'?'#ffffff':PAL[ch];
function tileCanvas(src,w=16,h=16){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){const ch=typeof src==='function'?src(i,j):src[j][i];const col=inkCol(ch);if(col){x.fillStyle=col;
    x.fillRect(i,j,1,1);}}return c;}
// reconstruit une tuile retouchée et ses variantes
// tuiles du bâti : encre monde -> couleur bâti (22 novembre 2026)
const batiSrc=k=>{const f=PAT[k];return typeof f==='function'?(x,y)=>{const c=f(x,y);return c==='3'?'5':c;}:f.map(r=>r.replace(/3/g,'5'));};
const tuileSrc=k=>EAU_TUILES.includes(k)?eauSrc(k):BATI_TUILES.includes(k)?batiSrc(k):PAT[k];
// tuiles d'eau : encre bio -> couleur eau
function eauSrc(k){const f=PAT[k];return typeof f==='function'?(x,y)=>{const c=f(x,y);return c==='2'?'e':c;}:f.map(r=>r.replace(/2/g,'e'));}
/* Une tuile posée DANS une autre (26 novembre 2026) : le caractère du dessus s'il n'est pas transparent, sinon celui
   du dessous. Sert aux niches et aux murs piégés, composés une fois pour toutes dans la tuile du mur. Les superposer
   au moment du rendu les rendait toutes deux translucides dans le brouillard (chaque couche est dessinée à l'opacité
   du brouillard), et la niche se lisait en transparence : ici le mur disparaît vraiment sous la niche. */
const tuileDans=(bas,haut)=>{const b=tuileSrc(bas),h=tuileSrc(haut);
  return (x,y)=>{const c=typeof h==='function'?h(x,y):h[y][x];
    return c&&c!=='.'?c:(typeof b==='function'?b(x,y):b[y][x]);};};
const MUR_DANS=['niche','nicheOuverte'];
function murComposites(){for(const bas of ['wall','wallFace'])for(const haut of MUR_DANS)
  TL[bas+'_'+haut]=tileCanvas(tuileDans(bas,haut));}
function rebuildTile(k){if(k.startsWith('epv_')&&typeof epvOublie==='function')epvOublie();
  for(const d of TILE_DEPS[k]||[k]){if(TILE_GRANDES[d])TL[d]=tileCanvas(TF(d),...TILE_GRANDES[d]);
  else if(PAT[d])TL[d]=tileCanvas(tuileSrc(d));if(/^(an|bz)\d+r$|^robot_r$/.test(d)){try{ICON[d]=TL[d].toDataURL();
  }catch(e){}}}murComposites();buildCursor();if(k==='robot_u')robotTiles();}
function buildTiles(){
  TL={};for(const k in PAT)TL[k]=tileCanvas(tuileSrc(k));
  // la Matière reprend les dessins des éclats de métal (retouches comprises), en couleur accent au lieu de bio
  for(const k of ['ore','ore1','ore2','oreSol','oreSol1','oreSol2']){const f=TF(k);
    TL[k.replace('ore','mat')]=tileCanvas((x,y)=>{const c=f(x,y);return c==='2'?'1':c;});
    }for(const k in TILE_GRANDES)TL[k]=tileCanvas(TF(k),...TILE_GRANDES[k]);murComposites();buildCursor();
  ICON={};for(const k in TL)if(/^(an|bz)\d+r$|^robot_r$/.test(k)){try{ICON[k]=TL[k].toDataURL();}catch(e){}}
  robotTiles();
  ANIMG=SPECIES.map((_,i)=>{try{return TL['an'+i+'r'].toDataURL();}catch(e){return '';}});
  const r=document.documentElement.style;r.setProperty('--c1',PAL['1']);r.setProperty('--c2',PAL['2']);r.setProperty('--c3',PAL['3']);
    r.setProperty('--c4',PAL['4']);r.setProperty('--c5',PAL['5']);r.setProperty('--life',PAL['4']);
  PAL_CLES.forEach(k=>{$('pc'+k).style.background=PAL_U[k];$('pc'+k).title=PAL_U[k];});
}
function setPal(p){PAL_U=p;palNiveauRaz();try{localStorage.setItem('np-palette',JSON.stringify(PAL_U));}catch(e){}touchLocal();palBiome(TEINTE);
  buildTiles();render();}

