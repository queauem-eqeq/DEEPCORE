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
/* Budget de menace (15 novembre 2026) : en descente, chaque niveau a un total de menace fixé, quel que soit le monde tiré.
   La menace d'une carte est ce que la foreuse SANS ÉQUIPEMENT perd de points de vie en tuant tout ce qui s'y trouve, d'après les séries
   du banc de combat (outils/banc.py, banc/resultats.js, docs/mesures.md) :
       menace = terrain × [ Σ effectif × coût  +  (704 / surface) × ( Σ effectif × pression )² ]
   - coût     : points de vie perdus par individu tué quand on les rencontre un à un ;
   - pression : ce que chaque individu ajoute quand ils sont nombreux à la fois (les coups pleuvent pendant qu'on en frappe un seul) :
                le terme au carré fait monter la menace plus vite que le nombre. 704 = surface de la carte de taille 1 où c'est mesuré ;
   - terrain  : coefficient du biome (couloirs et couvert protègent, le terrain nu expose).
   Les intensités d'un monde ne règlent que les PROPORTIONS entre espèces ; l'échelle est celle qui amène la menace au budget du niveau. */
const MENACE_ESP={insectoide:[3.3,.15],cafar:[2,.3],siphon:[1.1,.31],crabos:[7.3,.86],crachin:[4.9,1.12],viperin:[10.8,.57],gluar:[5.7,.67],tapi:[27.1,.49],taupar:[16.7,.63],mastok:[46,1.51]};
function menaceDe(eff,terrain){let l=0,q=0;for(const k in eff){const m=MENACE_ESP[k]||[10,.6];l+=eff[k]*m[0];q+=eff[k]*m[1];}return (terrain||1)*(l+704/(W*H)*q*q);}
function lifeMenace(vie,parMille,terrain){const cible=parMille*W*H/1000/(terrain||1),p={};let L=0,Q=0;
  for(const k in INTENS){p[k]=NIVEAUX[(vie&&vie[k])||0][1]*LIFE_REF[k];const m=MENACE_ESP[k]||[10,.6];L+=p[k]*m[0];Q+=p[k]*m[1];}
  const a=704/(W*H)*Q*Q,s=!L?0:a?(-L+Math.sqrt(L*L+4*a*cible))/(2*a):cible/L;          // a·s² + L·s = cible
  // arrondi simple : une espèce trop chère pour le budget disparaît (pas de minimum forcé, qui faisait déborder les petits budgets) ;
  // les cafars vont au moins par deux ; s'il ne reste personne, un individu de l'espèce la plus présente
  let tot=0,top=null;for(const k in INTENS){let n=Math.round(p[k]*s);if(k==='cafar'&&n===1)n=2;LIFE[k]=n;tot+=n;if(p[k]&&(!top||p[k]>p[top]))top=k;}
  if(!tot&&top)LIFE[top]=top==='cafar'?2:1;}
const menaceTotale=terrain=>menaceDe(LIFE,terrain);
function intensAff(){LIFE_LBL.forEach(([k])=>{$('lr-'+k).value=INTENS[k];$('ll-'+k).textContent=NIVEAUX[INTENS[k]][0];});
  const v=Object.values(INTENS),m=v.every(x=>x===v[0]);$('lr-tout').value=m?v[0]:2;$('ll-tout').textContent=m?NIVEAUX[v[0]][0]:'Mixte';}
function setIntens(k,v){v=Math.max(0,Math.min(4,Math.round(+v||0)));if(k==='tout')for(const q in INTENS)INTENS[q]=v;else INTENS[k]=v;
  intensAff();try{localStorage.setItem('np-intens',JSON.stringify(INTENS));}catch(e){}touchLocal();}
function buildLife(){
  const row=(k,l,cls)=>`<div class="g niv${cls||''}"><label for="lr-${k}">${l}</label><input type="range" id="lr-${k}" min="0" max="4" step="1" value="2" aria-label="Intensité : ${l}" aria-describedby="ll-${k}"><span id="ll-${k}"></span></div>`;
  $('life').innerHTML=row('tout','Toutes',' tout')+LIFE_LBL.map(([k,l])=>row(k,l)).join('')
    +'<div class="sum">Intensité par espèce : Aucun, Rare, Normal, Nombreux, Infesté. Le nombre de créatures suit la taille de la carte. Sur une carte d’essai, l’intensité donne directement le nombre. En descente, elle ne règle que les proportions entre espèces : le total suit le budget de menace du niveau.</div>';
  ['tout',...LIFE_LBL.map(l=>l[0])].forEach(k=>$('lr-'+k).addEventListener('input',e=>setIntens(k,e.target.value)));
  intensAff();
}
function buildGen(){
  $('gen').innerHTML=`<div class="g"><label for="gn-taille">Taille de la carte</label><input type="range" id="gr-taille" min="1" max="5" step="1" value="${GEN.taille}" aria-label="Taille de la carte, de 1 à 5"><input type="number" id="gn-taille" min="1" max="5" step="1" value="${GEN.taille}"></div><div class="sum" id="genTaille"></div>`
   +GEN_LBL.map(([k,l,mx])=>`<div class="g"><label for="gn-${k}">${l} (%)</label><input type="range" id="gr-${k}" min="0" max="${mx}" step="1" value="${GEN[k]}" aria-label="${l} en pourcentage"><input type="number" id="gn-${k}" min="0" max="${mx}" step="1" value="${GEN[k]}"></div>`).join('')
   +'<div class="sum" id="genSum"></div><div class="sub">Relief (montagnes et gouffres)</div>'
   +`<div class="g2"><label for="gm">Méthode</label><select id="gm">${METHODS.map(([v,l])=>`<option value="${v}"${GEN.methode===v?' selected':''}>${l}</option>`).join('')}</select></div>`
   +`<div class="g2"><label for="gn-remplissage">Remplissage initial (%)</label><input type="number" id="gn-remplissage" min="35" max="70" value="${GEN.remplissage}"></div>`
   +`<div class="g2"><label for="gn-iterations">Itérations</label><input type="number" id="gn-iterations" min="1" max="10" value="${GEN.iterations}"></div>`
   +'<button class="go" id="essaiBtn" title="Créer une carte d’essai avec ces réglages et ceux de Life, hors de la descente">CARTE D’ESSAI</button><div class="sum">Ces réglages et ceux de la faune ne servent qu’aux cartes d’essai. REGEN relance la descente au niveau 1 : chaque niveau y tire un biome ou l’un de vos archétypes.</div>';
  $('essaiBtn').onclick=()=>{$('monde').hidden=true;unlock();SFX.start();testGame();started=true;$('overlay').hidden=true;render();};
  GEN_LBL.forEach(([k])=>{$('gr-'+k).addEventListener('input',e=>setGen(k,e.target.value));$('gn-'+k).addEventListener('change',e=>setGen(k,e.target.value));});
  $('gr-taille').addEventListener('input',e=>setTaille(e.target.value));$('gn-taille').addEventListener('change',e=>setTaille(e.target.value));setTaille(GEN.taille);
  $('gm').addEventListener('change',e=>{GEN.methode=e.target.value;saveGen();caState();});
  $('gn-remplissage').addEventListener('change',e=>setCA('remplissage',e.target.value,35,70));
  $('gn-iterations').addEventListener('change',e=>setCA('iterations',e.target.value,1,10));
  GEN_LBL.forEach(([k,,mx])=>{if(GEN[k]>mx)GEN[k]=mx;});setGen('eau',GEN.eau);caState();
}


/* ---------- Menu Monde (15 novembre 2026) : Génération et Life réunis dans une fenêtre, comme le Tile editor ----------
   Archétype de monde : les réglages en cours (relief, taille, faune) enregistrés sous un nom ; MONDES = {nom:{gen:{…},vie:{…}}}, mémorisé
   sous np-mondes. La liste déroulante propose aussi les biomes de la descente, à charger comme point de départ (ils ne sont pas modifiables). */
let MONDES={};try{const m=JSON.parse(localStorage.getItem('np-mondes')||'null');if(m&&typeof m==='object')MONDES=m;}catch(e){}
const saveMondes=()=>{try{localStorage.setItem('np-mondes',JSON.stringify(MONDES));}catch(e){}touchLocal();};
const mdEsc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function mondeListe(sel){const noms=Object.keys(MONDES).sort((a,b)=>a.localeCompare(b,'fr')),o=(v,l)=>`<option value="${mdEsc(v)}">${mdEsc(l)}</option>`;
  $('mdSel').innerHTML=o('','— Réglages en cours —')+(noms.length?`<optgroup label="Mes archétypes">${noms.map(n=>o('u:'+n,n)).join('')}</optgroup>`:'')
    +`<optgroup label="Biomes de la descente">${Object.entries(BIOMES).map(([k,b])=>o('b:'+k,b.n)).join('')}</optgroup>`;
  $('mdSel').value=sel||'';if($('mdSel').selectedIndex<0)$('mdSel').value='';}
function mondeMsg(t,err){const m=$('mdMsg');m.textContent=t;m.className='saved'+(err?' err':'');}
// applique un relief et une faune aux réglages en cours (les champs absents gardent leur valeur)
function mondeApplique(gen,vie){
  for(const k of ['taille','eau','montagne','gouffre','herbe','methode','remplissage','iterations'])if(gen&&gen[k]!=null)GEN[k]=gen[k];
  if(!(GEN.taille>=1&&GEN.taille<=5))GEN.taille=4;saveGen();buildGen();
  for(const k in INTENS)INTENS[k]=Math.max(0,Math.min(4,Math.round(+(vie&&vie[k])||0)));
  intensAff();try{localStorage.setItem('np-intens',JSON.stringify(INTENS));}catch(e){}touchLocal();}
function mondeCharge(v){
  if(v.startsWith('u:')){const n=v.slice(2),m=MONDES[n];if(!m)return;mondeApplique(m.gen,m.vie);$('mdNom').value=n;mondeMsg(`« ${n} » chargé.`);}
  else if(v.startsWith('b:')){const b=BIOMES[v.slice(2)];if(!b)return;mondeApplique(b.gen,b.vie);$('mdNom').value='';mondeMsg(`Biome « ${b.n} » chargé : donnez un nom pour en garder une variante.`);}
  else mondeMsg('');}
function mondeSave(){const n=$('mdNom').value.trim().replace(/\s+/g,' ');if(!n){mondeMsg('Donnez un nom à cet archétype.',true);$('mdNom').focus();return;}
  const neuf=!MONDES[n];MONDES[n]={gen:Object.assign({},GEN),vie:Object.assign({},INTENS)};saveMondes();mondeListe('u:'+n);mondeMsg(neuf?`« ${n} » enregistré.`:`« ${n} » mis à jour.`);}
function mondeDel(){const v=$('mdSel').value;if(!v.startsWith('u:')){mondeMsg('Choisissez un de vos archétypes dans la liste.',true);return;}
  const n=v.slice(2);delete MONDES[n];saveMondes();mondeListe('');$('mdNom').value='';mondeMsg(`« ${n} » supprimé.`);}
function mondeOpen(){if(TRAV)stopTravel();if(REST)stopRest();if(EXPL)stopExplore();mondeListe($('mdSel').value);mondeMsg('');$('monde').hidden=false;$('monde').querySelector('.mcard').focus();}
function mondeClose(){$('monde').hidden=true;$('mondeBtn').focus();render();}
$('mondeBtn').onclick=mondeOpen;$('mdClose').onclick=mondeClose;$('mdSave').onclick=mondeSave;$('mdDel').onclick=mondeDel;
$('mdSel').addEventListener('change',e=>mondeCharge(e.target.value));
$('mdNom').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();mondeSave();}});
$('monde').addEventListener('pointerdown',ev=>{if(ev.target===$('monde'))mondeClose();});
