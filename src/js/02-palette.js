/* ---------- Palette ---------- */
const PRESETS=[
  {n:'Origine',c:['#8fe6cf','#4fb8ff','#ffa53a']},
  {n:'Phosphore',c:['#7dff6a','#2fd08a','#e6ff4a']},
  {n:'Mars',c:['#ffd2a8','#ff7a45','#d9442a']},
  {n:'Glace',c:['#e8f6ff','#7fc8ff','#b28bff']},
  {n:'Néon',c:['#ff4fd8','#33f0ff','#fff05a']},
  {n:'Rouille',c:['#c9b79c','#7fa6a1','#e0703b']},
  {n:'Abysse',c:['#5fd3c4','#2f6fff','#9b6bff']},
  {n:'Ambre',c:['#ffd27a','#ff9f43','#ffe9b8']}
];
// Les palettes prédéfinies sont modifiables : la palette sélectionnée suit les sélecteurs de couleur
const PRESETS_DEF=PRESETS.map(p=>({n:p.n,c:p.c.slice()}));
let PRESET_ACTIVE=0;
try{const sv=JSON.parse(localStorage.getItem('np-presets')||'null');if(Array.isArray(sv))sv.forEach((c,i)=>{if(PRESETS[i]&&Array.isArray(c)&&c.length===3)PRESETS[i].c=c;});}catch(e){}
try{const a=+localStorage.getItem('np-preset-active');if(PRESETS[a])PRESET_ACTIVE=a;}catch(e){}
let PAL={'1':'#8fe6cf','2':'#4fb8ff','3':'#ffa53a'};
try{const p=JSON.parse(localStorage.getItem('np-palette')||'null');if(p&&p['1'])PAL=p;}catch(e){}

