/* ---------- Viseur (curseur de la souris et du mode inspection) ---------- */
let CURT=null,CURT_DIM=null;
function rowsOf(k){const f=TF(k),[w,h]=tileDim(k),r=[];for(let y=0;y<h;y++){let l='';for(let x=0;x<w;x++)l+=f(x,y)||'.';r.push(l);}return r;}
function curCanvas(rows,ink){const c=document.createElement('canvas');c.width=c.height=16;const x=c.getContext('2d');
  for(let j=0;j<16;j++)for(let i=0;i<16;i++){const ch=rows[j][i];if(ch==='.')continue;x.fillStyle=ch==='w'&&ink?ink:inkCol(ch);x.fillRect(i,j,1,1);}return c;}
// viseur tel que dessiné sur une case accessible ; ses pixels blancs passent en gris sur une case inexplorée ou hors d'atteinte
function buildCursor(){const r=rowsOf('cursor');CURT=curCanvas(r);CURT_DIM=curCanvas(r,'#8aa9a2');}

/* ---------- Réglages de génération ---------- */
// Maximums par terrain : au-delà, la planète perd son intérêt (eau : plus assez de terre ferme ; montagne : le jeu doit percer
// des couloirs partout ; gouffre : la carte devient un réseau de ponts). L'herbe ne gêne que la vue.
const GEN_LBL=[['eau','Eau',60],['montagne','Montagne',70],['gouffre','Gouffre',30],['herbe','Herbe',80]],GEN_SUM=80;
const METHODS=[['automate','Automate cellulaire'],['bruit','Bruit (chaînes)'],['mixte','Mixte']];
let GEN={eau:10,montagne:12,gouffre:4,herbe:15,methode:'automate',remplissage:55,iterations:5};
try{const g=JSON.parse(localStorage.getItem('np-gen')||'null');if(g&&typeof g.eau==='number')GEN=Object.assign(GEN,g);}catch(e){}
const saveGen=()=>{try{localStorage.setItem('np-gen',JSON.stringify(GEN));}catch(e){}touchLocal();};
function setGen(k,v){const others=GEN_LBL.reduce((a,[kk])=>a+(kk===k?0:GEN[kk]),0),mx=GEN_LBL.find(l=>l[0]===k)[2];
  v=Math.max(0,Math.min(mx,GEN_SUM-others,Math.round(+v||0)));GEN[k]=v;$('gr-'+k).value=v;$('gn-'+k).value=v;
  $('genSum').textContent=`Total ${GEN_LBL.reduce((a,[kk])=>a+GEN[kk],0)} % · maximum ${GEN_SUM} %. Appliqué au prochain lancement.`;saveGen();}
function setCA(k,v,mn,mx){v=Math.max(mn,Math.min(mx,Math.round(+v||mn)));GEN[k]=v;$('gn-'+k).value=v;saveGen();}
function caState(){const off=GEN.methode==='bruit';$('gn-remplissage').disabled=off;$('gn-iterations').disabled=off;}
/* ---------- Réglages de faune : nombre d'individus par planète ---------- */
let LIFE={insectoide:21,crabos:15,cafar:12};
try{const l=JSON.parse(localStorage.getItem('np-life')||'null');if(l&&typeof l.crabos==='number')LIFE=Object.assign(LIFE,l);}catch(e){}
const LIFE_LBL=[['insectoide','Insectoïde',100],['crabos','Crabos',100],['cafar','Cafar',100]];
function setLife(k,v){const mx=LIFE_LBL.find(l=>l[0]===k)[2];v=Math.max(0,Math.min(mx,Math.round(+v||0)));LIFE[k]=v;$('lr-'+k).value=v;$('ln-'+k).value=v;
  try{localStorage.setItem('np-life',JSON.stringify(LIFE));}catch(e){}touchLocal();}
function buildLife(){
  $('life').innerHTML=LIFE_LBL.map(([k,l,mx])=>`<div class="g"><label for="ln-${k}">${l}</label><input type="range" id="lr-${k}" min="0" max="${mx}" step="1" value="${LIFE[k]}" aria-label="Nombre de ${l}"><input type="number" id="ln-${k}" min="0" max="${mx}" step="1" value="${LIFE[k]}"></div>`).join('')
    +'<div class="sum">Nombre d’individus par planète. Appliqué au prochain lancement.</div>';
  LIFE_LBL.forEach(([k])=>{$('lr-'+k).addEventListener('input',e=>setLife(k,e.target.value));$('ln-'+k).addEventListener('change',e=>setLife(k,e.target.value));});
}
function buildGen(){
  $('gen').innerHTML=GEN_LBL.map(([k,l,mx])=>`<div class="g"><label for="gn-${k}">${l} (%)</label><input type="range" id="gr-${k}" min="0" max="${mx}" step="1" value="${GEN[k]}" aria-label="${l} en pourcentage"><input type="number" id="gn-${k}" min="0" max="${mx}" step="1" value="${GEN[k]}"></div>`).join('')
   +'<div class="sum" id="genSum"></div><div class="sub">Relief (montagnes et gouffres)</div>'
   +`<div class="g2"><label for="gm">Méthode</label><select id="gm">${METHODS.map(([v,l])=>`<option value="${v}"${GEN.methode===v?' selected':''}>${l}</option>`).join('')}</select></div>`
   +`<div class="g2"><label for="gn-remplissage">Remplissage initial (%)</label><input type="number" id="gn-remplissage" min="35" max="70" value="${GEN.remplissage}"></div>`
   +`<div class="g2"><label for="gn-iterations">Itérations</label><input type="number" id="gn-iterations" min="1" max="10" value="${GEN.iterations}"></div>`;
  GEN_LBL.forEach(([k])=>{$('gr-'+k).addEventListener('input',e=>setGen(k,e.target.value));$('gn-'+k).addEventListener('change',e=>setGen(k,e.target.value));});
  $('gm').addEventListener('change',e=>{GEN.methode=e.target.value;saveGen();caState();});
  $('gn-remplissage').addEventListener('change',e=>setCA('remplissage',e.target.value,35,70));
  $('gn-iterations').addEventListener('change',e=>setCA('iterations',e.target.value,1,10));
  GEN_LBL.forEach(([k,,mx])=>{if(GEN[k]>mx)GEN[k]=mx;});setGen('eau',GEN.eau);caState();
}

