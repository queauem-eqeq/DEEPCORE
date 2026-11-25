/* ---------- Palette ---------- */
/* 22 novembre 2026 : cinq couleurs par palette — accent, bio, monde, danger, bâti — toutes prises dans LACKING64
   (lospec.com/palette-list/lacking64, 64 couleurs), qui est aussi le nuancier du sélecteur de teinte (LACKING64, plus bas).
   danger : lasers, dégâts, alertes (l'ancien rouge fixe, encres 'r' et 'L'). bâti : murs, sols et portes des bâtiments,
   pour que l'intérieur ne se confonde plus avec la montagne et la roche (encre '5', lue à la place de '3' sur BATI_TUILES).
   Le blanc reste fixe. Les palettes d'avant (trois couleurs) sont abandonnées : un réglage enregistré à trois couleurs est ignoré. */
const LACKING64=['#d6e0f9','#b5c8ea','#94aada','#7c85c5','#7f65bb','#80459e','#9e79b3','#c99acf','#e8bfe2','#ebd2d4','#e0b5bb','#e09f9d','#da827a','#ca614e','#d8180b','#a91d18','#8d1123','#650c25','#380b2a','#1c0b21','#010000','#11103b','#1f088e','#171fa9','#0443be','#116bb5','#2e9adc','#6de6e7','#3ab99d','#1a946c','#0b5d40','#073a31','#041623','#163d4a','#30626d','#4d858d','#75a3a8','#afc8c8','#fffeff','#f7f688','#ebbf4a','#e38d18','#b56303','#833e11','#532918','#331b1a','#140e0e','#966949','#af8568','#c3a389','#d7bea7','#ffe7ad','#efd28b','#dfae65','#be8f44','#947e31','#676920','#395609','#164402','#0a3001','#1d1d1c','#414040','#6f6f6e','#a9a9a9'];
const PAL_N=5,PAL_CLES=['1','2','3','4','5'];
const PRESETS=[   // c : accent, bio, monde, danger, bâti ; palettes du joueur relues dans l'artefact le 25 novembre 2026
  {n:'Braise',c:['#c99acf','#6de6e7','#ca614e','#d8180b','#7c85c5']},
  {n:'Lagoon',c:['#da827a','#f7f688','#2e9adc','#d8180b','#75a3a8']},
  {n:'Désert sombre',c:['#1a946c','#ffe7ad','#833e11','#d8180b','#163d4a']},
  {n:'Jungle',c:['#2e9adc','#ebbf4a','#1a946c','#d8180b','#4d858d']},
  {n:'Améthyste',c:['#116bb5','#6de6e7','#7f65bb','#d8180b','#30626d']},
  {n:'Cendre',c:['#e38d18','#3ab99d','#6f6f6e','#d8180b','#af8568']},
  {n:'Dark forest',c:['#4d858d','#f7f688','#164402','#d8180b','#833e11']},
  {n:'Magma',c:['#f7f688','#e38d18','#8d1123','#d8180b','#6f6f6e']}
];
// Les palettes prédéfinies sont modifiables : la palette sélectionnée suit les sélecteurs de couleur
const PRESETS_DEF=PRESETS.map(p=>({n:p.n,c:p.c.slice()}));
const palDe=c=>({'1':c[0],'2':c[1],'3':c[2],'4':c[3],'5':c[4]});
let PRESET_ACTIVE=4;   // Améthyste, la palette choisie par le joueur (25 novembre 2026 ; Désert le 23)
try{const sv=JSON.parse(localStorage.getItem('np-presets')||'null');
  // une entrée est soit les cinq couleurs (ancien format), soit {n, c} : le nom de la palette est modifiable depuis le 24 novembre 2026
  if(Array.isArray(sv))sv.forEach((e,i)=>{if(!PRESETS[i])return;const c=Array.isArray(e)?e:e&&e.c;
    if(Array.isArray(c)&&c.length===PAL_N)PRESETS[i].c=c;
    if(e&&!Array.isArray(e)&&typeof e.n==='string'&&e.n.trim())PRESETS[i].n=e.n;});}catch(e){}
// premier lancement à cinq couleurs : on repart de Braise
try{if(localStorage.getItem('np-pal5')){const s=localStorage.getItem('np-preset-active');if(s!==null&&PRESETS[+s])PRESET_ACTIVE=+s;
  }else localStorage.setItem('np-pal5','1');}catch(e){}
let PAL=palDe(PRESETS[PRESET_ACTIVE].c);   // les couleurs de la palette par défaut
try{const p=JSON.parse(localStorage.getItem('np-palette')||'null');if(p&&p['1']&&p['5'])PAL=p;}catch(e){}


/* PAL : les couleurs affichées. PAL_U : la palette choisie par le joueur (celle des sélecteurs, celle qui est mémorisée).
   Chaque biome applique à PAL_U une petite variation : TEINTE = [rotation de teinte accent, bio, monde (degrés), clarté monde, saturation monde (points)]. */
let PAL_U=PAL,TEINTE=[0,0,0,0,0];
/* Palette du niveau (23 novembre 2026) : à chaque niveau, la foreuse change de palette, tirée au hasard parmi les palettes prédéfinies,
   jamais deux fois la même de suite. Elle ne touche pas à la palette choisie par le joueur (PAL_U, mémorisée) : le niveau 1 la reprend. */
let PAL_NIV=null,PAL_NIV_I=-1;
function palNiveauSuivant(){const exclu=PAL_NIV_I>=0?PAL_NIV_I:PRESET_ACTIVE,l=PRESETS.map((_,i)=>i).filter(i=>i!==exclu);
  PAL_NIV_I=l[Math.floor(Math.random()*l.length)];PAL_NIV=palDe(PRESETS[PAL_NIV_I].c);}
function palNiveauRaz(){PAL_NIV=null;PAL_NIV_I=-1;}
function teinter(hex,dh,dl,ds){if(!dh&&!dl&&!ds)return hex;
  const n=parseInt(hex.slice(1),16),r=(n>>16&255)/255,g=(n>>8&255)/255,b=(n&255)/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;
  let h=0,l=(mx+mn)/2,s=d?d/(1-Math.abs(2*l-1)):0;if(d){h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;h*=60;}
  h=((h+dh)%360+360)%360;l=Math.max(.08,Math.min(.92,l+(dl||0)/100));s=Math.max(0,Math.min(1,s+(ds||0)/100));
  const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs(h/60%2-1)),m=l-c/2,q=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,
    c]:h<300?[x,0,c]:[c,0,x];
  return '#'+q.map(v=>Math.round((v+m)*255).toString(16).padStart(2,'0')).join('');}
/* L'eau est une couleur dérivée du monde (21 novembre 2026) : PAL['e'] = couleur monde du biome + décalage EAU = [teinte (degrés), clarté, saturation (points)].
   Les tuiles d'eau gardent le code '2' dans leurs dessins ; buildTiles() le lit comme 'e' pour elles seules (EAU_TUILES). */
const EAU=[-12,-8,0];   // choix du 21 novembre 2026 après essai de six variantes : teinte −12°, clarté −8
const HARD_CLAIR=16;   // la roche dure : la couleur monde en plus sombre (clarté −16), code d'encre 'd'
const EAU_TUILES=['liq0','liq1','deep0','deep1','wade','wadeDeep'];
// dessinées en couleur bâti : l'encre '3' y est lue '5'
const BATI_TUILES=['wall','wallFace','floor','solPont','door','doorOpen','doorOpenV','pillar','vitre','lock','niche','nicheOuverte'];
function palBiome(t){TEINTE=t||[0,0,0,0,0];const U=PAL_NIV||PAL_U;
  PAL={'1':teinter(U['1'],TEINTE[0]),'2':teinter(U['2'],TEINTE[1]),'3':teinter(U['3'],TEINTE[2],TEINTE[3],TEINTE[4]),
  '4':U['4']||'#d8180b','5':U['5']||U['3']};PAL['e']=teinter(PAL['3'],EAU[0],EAU[1],EAU[2]);
  PAL['d']=teinter(PAL['3'],0,-HARD_CLAIR,0);}
