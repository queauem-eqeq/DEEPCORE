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


/* PAL : les couleurs affichées. PAL_U : la palette choisie par le joueur (celle des sélecteurs, celle qui est mémorisée).
   Chaque biome applique à PAL_U une petite variation : TEINTE = [rotation de teinte accent, bio, monde (degrés), clarté monde, saturation monde (points)]. */
let PAL_U=PAL,TEINTE=[0,0,0,0,0];
function teinter(hex,dh,dl,ds){if(!dh&&!dl&&!ds)return hex;const n=parseInt(hex.slice(1),16),r=(n>>16&255)/255,g=(n>>8&255)/255,b=(n&255)/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;
  let h=0,l=(mx+mn)/2,s=d?d/(1-Math.abs(2*l-1)):0;if(d){h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;h*=60;}
  h=((h+dh)%360+360)%360;l=Math.max(.08,Math.min(.92,l+(dl||0)/100));s=Math.max(0,Math.min(1,s+(ds||0)/100));
  const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs(h/60%2-1)),m=l-c/2,q=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];
  return '#'+q.map(v=>Math.round((v+m)*255).toString(16).padStart(2,'0')).join('');}
function palBiome(t){TEINTE=t||[0,0,0,0,0];PAL={'1':teinter(PAL_U['1'],TEINTE[0]),'2':teinter(PAL_U['2'],TEINTE[1]),'3':teinter(PAL_U['3'],TEINTE[2],TEINTE[3],TEINTE[4])};}
