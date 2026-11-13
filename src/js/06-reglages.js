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
let GEN={taille:4,eau:10,montagne:12,gouffre:4,herbe:15,methode:'automate',remplissage:55,iterations:5};
try{const g=JSON.parse(localStorage.getItem('np-gen')||'null');if(g&&typeof g.eau==='number')GEN=Object.assign(GEN,g);}catch(e){}
if(!(GEN.taille>=1&&GEN.taille<=5))GEN.taille=4;
function setTaille(v){v=Math.max(1,Math.min(5,Math.round(+v||4)));GEN.taille=v;$('gr-taille').value=v;$('gn-taille').value=v;
  $('genTaille').textContent=`${SIZES[v][0]} × ${SIZES[v][1]} cases${v===4?' (taille d’origine)':''}. Appliqué au prochain lancement.`;saveGen();}
const saveGen=()=>{try{localStorage.setItem('np-gen',JSON.stringify(GEN));}catch(e){}touchLocal();};
function setGen(k,v){const others=GEN_LBL.reduce((a,[kk])=>a+(kk===k?0:GEN[kk]),0),mx=GEN_LBL.find(l=>l[0]===k)[2];
  v=Math.max(0,Math.min(mx,GEN_SUM-others,Math.round(+v||0)));GEN[k]=v;$('gr-'+k).value=v;$('gn-'+k).value=v;
  $('genSum').textContent=`Total ${GEN_LBL.reduce((a,[kk])=>a+GEN[kk],0)} % · maximum ${GEN_SUM} %. Appliqué au prochain lancement.`;saveGen();}
function setCA(k,v,mn,mx){v=Math.max(mn,Math.min(mx,Math.round(+v||mn)));GEN[k]=v;$('gn-'+k).value=v;saveGen();}
function caState(){const off=GEN.methode==='bruit';$('gn-remplissage').disabled=off;$('gn-iterations').disabled=off;}
/* Faune : une INTENSITÉ par espèce (13 novembre 2026), et non plus un nombre d'individus.
   Le nombre réel (LIFE) se calcule au lancement : effectif de référence de l'espèce × coefficient du niveau × surface de la carte
   rapportée à la taille d'origine. Une petite carte reçoit donc moins de créatures, sans rien régler. */
// nom, coefficient, effectif minimal (pour qu'un niveau élevé se voie même sur une toute petite carte)
const NIVEAUX=[['Aucun',0,0],['Rare',.5,1],['Normal',1,1],['Nombreux',2,2],['Infesté',4,4]];
const LIFE_REF={insectoide:21};BEASTS.forEach(b=>{LIFE_REF[b.key]=b.nb;});
const LIFE_LBL=[['insectoide','Insectoïde'],...BEASTS.map(b=>[b.key,b.n])];
let INTENS={};LIFE_LBL.forEach(([k])=>{INTENS[k]=2;});
// anciens réglages en nombres : ramenés au niveau le plus proche
const nivDe=(k,n)=>{const r=n/(LIFE_REF[k]||1);return n<=0?0:r<=.75?1:r<=1.5?2:r<=3?3:4;};
try{const i=JSON.parse(localStorage.getItem('np-intens')||'null');
  if(i&&typeof i==='object'){for(const k in INTENS)if(i[k]>=0&&i[k]<=4)INTENS[k]=Math.round(i[k]);}
  else{const l=JSON.parse(localStorage.getItem('np-life')||'null');if(l&&typeof l.crabos==='number')for(const k in INTENS)if(typeof l[k]==='number')INTENS[k]=nivDe(k,l[k]);}}catch(e){}
let LIFE={};
function lifeCalc(niv,mult){const src=niv||INTENS,m=mult||1,surf=W*H/(96*64);   // niv, mult : niveaux d'un biome et multiplicateur de profondeur (descente) ; sans eux, les réglages du joueur (carte d'essai)
  for(const k in INTENS){const [,c,mn]=NIVEAUX[src[k]||0];LIFE[k]=c?Math.max(mn,k==='cafar'?2:1,Math.round(LIFE_REF[k]*c*surf*m)):0;}}   // les cafars vont au moins par deux
lifeCalc();
function intensAff(){LIFE_LBL.forEach(([k])=>{$('lr-'+k).value=INTENS[k];$('ll-'+k).textContent=NIVEAUX[INTENS[k]][0];});
  const v=Object.values(INTENS),m=v.every(x=>x===v[0]);$('lr-tout').value=m?v[0]:2;$('ll-tout').textContent=m?NIVEAUX[v[0]][0]:'Mixte';}
function setIntens(k,v){v=Math.max(0,Math.min(4,Math.round(+v||0)));if(k==='tout')for(const q in INTENS)INTENS[q]=v;else INTENS[k]=v;
  intensAff();try{localStorage.setItem('np-intens',JSON.stringify(INTENS));}catch(e){}touchLocal();}
function buildLife(){
  const row=(k,l,cls)=>`<div class="g niv${cls||''}"><label for="lr-${k}">${l}</label><input type="range" id="lr-${k}" min="0" max="4" step="1" value="2" aria-label="Intensité : ${l}" aria-describedby="ll-${k}"><span id="ll-${k}"></span></div>`;
  $('life').innerHTML=row('tout','Toutes',' tout')+LIFE_LBL.map(([k,l])=>row(k,l)).join('')
    +'<div class="sum">Intensité par espèce : Aucun, Rare, Normal, Nombreux, Infesté. Le nombre de créatures suit la taille de la carte. S’applique aux cartes d’essai (REGEN) ; en descente, chaque biome a sa faune.</div>';
  ['tout',...LIFE_LBL.map(l=>l[0])].forEach(k=>$('lr-'+k).addEventListener('input',e=>setIntens(k,e.target.value)));
  intensAff();
}
function buildGen(){
  $('gen').innerHTML=`<div class="g"><label for="gn-taille">Taille de la carte</label><input type="range" id="gr-taille" min="1" max="5" step="1" value="${GEN.taille}" aria-label="Taille de la carte, de 1 à 5"><input type="number" id="gn-taille" min="1" max="5" step="1" value="${GEN.taille}"></div><div class="sum" id="genTaille"></div>`
   +GEN_LBL.map(([k,l,mx])=>`<div class="g"><label for="gn-${k}">${l} (%)</label><input type="range" id="gr-${k}" min="0" max="${mx}" step="1" value="${GEN[k]}" aria-label="${l} en pourcentage"><input type="number" id="gn-${k}" min="0" max="${mx}" step="1" value="${GEN[k]}"></div>`).join('')
   +'<div class="sum" id="genSum"></div><div class="sub">Relief (montagnes et gouffres)</div>'
   +`<div class="g2"><label for="gm">Méthode</label><select id="gm">${METHODS.map(([v,l])=>`<option value="${v}"${GEN.methode===v?' selected':''}>${l}</option>`).join('')}</select></div>`
   +`<div class="g2"><label for="gn-remplissage">Remplissage initial (%)</label><input type="number" id="gn-remplissage" min="35" max="70" value="${GEN.remplissage}"></div>`
   +`<div class="g2"><label for="gn-iterations">Itérations</label><input type="number" id="gn-iterations" min="1" max="10" value="${GEN.iterations}"></div>`;
  GEN_LBL.forEach(([k])=>{$('gr-'+k).addEventListener('input',e=>setGen(k,e.target.value));$('gn-'+k).addEventListener('change',e=>setGen(k,e.target.value));});
  $('gr-taille').addEventListener('input',e=>setTaille(e.target.value));$('gn-taille').addEventListener('change',e=>setTaille(e.target.value));setTaille(GEN.taille);
  $('gm').addEventListener('change',e=>{GEN.methode=e.target.value;saveGen();caState();});
  $('gn-remplissage').addEventListener('change',e=>setCA('remplissage',e.target.value,35,70));
  $('gn-iterations').addEventListener('change',e=>setCA('iterations',e.target.value,1,10));
  GEN_LBL.forEach(([k,,mx])=>{if(GEN[k]>mx)GEN[k]=mx;});setGen('eau',GEN.eau);caState();
}

