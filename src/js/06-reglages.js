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
let GEN={taille:4,eau:10,montagne:12,gouffre:4,herbe:15,methode:'automate',remplissage:55,iterations:5,structure:10,sNb:0,sStyle:'',sPieces:0,sEntrees:0,sOuvert:25,sVerrous:1};   // structure : part de la carte occupée par les bâtiments (19 novembre 2026)
try{const g=JSON.parse(localStorage.getItem('np-gen')||'null');if(g&&typeof g.eau==='number')GEN=Object.assign(GEN,g);}catch(e){}
if(!(GEN.taille>=1&&GEN.taille<=5))GEN.taille=4;
if(!(GEN.structure>=0&&GEN.structure<=30))GEN.structure=10;
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
const LIFE_LBL=[['insectoide',SPECIES[0].n],...BEASTS.map(b=>[b.key,b.n])];   // la clé reste 'insectoide' : elle porte les intensités déjà enregistrées, seul le nom affiché a changé le 17 novembre 2026
let INTENS={};LIFE_LBL.forEach(([k])=>{INTENS[k]=2;});
// anciens réglages en nombres : ramenés au niveau le plus proche
const nivDe=(k,n)=>{const r=n/(LIFE_REF[k]||1);return n<=0?0:r<=.75?1:r<=1.5?2:r<=3?3:4;};
try{const i=JSON.parse(localStorage.getItem('np-intens')||'null');
  if(i&&typeof i==='object'){for(const k in INTENS)if(i[k]>=0&&i[k]<=4)INTENS[k]=Math.round(i[k]);}
  else{const l=JSON.parse(localStorage.getItem('np-life')||'null');if(l&&typeof l.crabos==='number')for(const k in INTENS)if(typeof l[k]==='number')INTENS[k]=nivDe(k,l[k]);}}catch(e){}
let LIFE={};
function lifeCalc(){const src=INTENS,m=1,surf=W*H/(96*64);   // effectifs tirés des intensités réglées dans le menu Monde (le budget de menace par niveau est parti avec la descente, 16 novembre 2026)
  for(const k in INTENS){const [,c,mn]=NIVEAUX[src[k]||0];LIFE[k]=c?Math.max(mn,k==='cafar'?2:1,Math.round(LIFE_REF[k]*c*surf*m)):0;}}   // les cafars vont au moins par deux
lifeCalc();
function intensAff(){LIFE_LBL.forEach(([k])=>{$('lr-'+k).value=INTENS[k];$('ll-'+k).textContent=NIVEAUX[INTENS[k]][0];});
  const v=Object.values(INTENS),m=v.every(x=>x===v[0]);$('lr-tout').value=m?v[0]:2;$('ll-tout').textContent=m?NIVEAUX[v[0]][0]:'Mixte';}
function setIntens(k,v){v=Math.max(0,Math.min(4,Math.round(+v||0)));if(k==='tout')for(const q in INTENS)INTENS[q]=v;else INTENS[k]=v;
  intensAff();try{localStorage.setItem('np-intens',JSON.stringify(INTENS));}catch(e){}touchLocal();}
function buildLife(){
  const row=(k,l,cls)=>`<div class="g niv${cls||''}"><label for="lr-${k}">${l}</label><input type="range" id="lr-${k}" min="0" max="4" step="1" value="2" aria-label="Intensité : ${l}" aria-describedby="ll-${k}"><span id="ll-${k}"></span></div>`;
  $('life').innerHTML=row('tout','Toutes',' tout')+LIFE_LBL.map(([k,l])=>row(k,l)).join('')
    +'<div class="sum">Intensité par espèce : Aucun, Rare, Normal, Nombreux, Infesté. L’intensité donne directement le nombre de créatures, à la taille de la carte près.</div>';
  ['tout',...LIFE_LBL.map(l=>l[0])].forEach(k=>$('lr-'+k).addEventListener('input',e=>setIntens(k,e.target.value)));
  intensAff();
}
// Colonne « Structures » du menu Monde (19 novembre 2026) : tout ce qui règle les bâtiments.
const S_NUM=[['structure','Surface bâtie (%)',0,30,'Part de la carte occupée par les bâtiments, murs compris. 0 : aucune structure.'],
  ['sPieces','Pièces par structure',0,40,'0 : autant que la surface le permet. Sinon la structure s’arrête à ce nombre de pièces, même si la surface n’est pas atteinte.'],
  ['sEntrees','Portes d’entrée',0,4,'0 : une à trois selon la taille. Sinon ce nombre, si les murs le permettent.'],
  ['sOuvert','Ouvertures sans porte (%)',0,100,'Part des passages intérieurs laissés ouverts : on voit à travers, rien ne se referme.'],
  ['sVerrous','Portes verrouillées',0,3,'Chacune ferme une partie de la structure ; autant de clés sont posées au sol, toutes accessibles sans ouvrir de serrure.']];
function setS(k,v){const [, ,mn,mx]=S_NUM.find(l=>l[0]===k);v=Math.max(mn,Math.min(mx,Math.round(+v||0)));GEN[k]=v;$('gr-'+k).value=v;$('gn-'+k).value=v;saveGen();}
function setStruct(v){setS('structure',v);}
function buildStruct(){
  for(const [k,,mn,mx] of S_NUM)if(!(GEN[k]>=mn&&GEN[k]<=mx))GEN[k]={structure:10,sOuvert:25,sVerrous:1}[k]||0;
  if(![0,1,2].includes(GEN.sNb))GEN.sNb=0;if(GEN.sStyle&&!STYLES_LBL.some(([v])=>v===GEN.sStyle))GEN.sStyle='';
  $('genS').innerHTML=`<div class="g2"><label for="gs-style">Archétype de structure</label><select id="gs-style"><option value="">Au hasard</option>${STYLES_LBL.map(([v,l])=>`<option value="${v}"${GEN.sStyle===v?' selected':''}>${l}</option>`).join('')}</select></div>`
   +`<div class="g2"><label for="gs-nb">Nombre de structures</label><select id="gs-nb">${[[0,'Une ou deux'],[1,'Une'],[2,'Deux']].map(([v,l])=>`<option value="${v}"${GEN.sNb===v?' selected':''}>${l}</option>`).join('')}</select></div>`
   +S_NUM.map(([k,l,mn,mx,aide])=>`<div class="g"><label for="gn-${k}">${l}</label><input type="range" id="gr-${k}" min="${mn}" max="${mx}" step="1" value="${GEN[k]}" aria-label="${l}"><input type="number" id="gn-${k}" min="${mn}" max="${mx}" step="1" value="${GEN[k]}"></div><div class="sum">${aide}</div>`).join('')
   +'<div class="sum">Avant-poste : petites pièces, peu de boucles. Hangar : grandes salles à piliers. Complexe de forage : couloirs et gouffres. Ruine : cavernes effondrées.</div>';
  $('gs-style').addEventListener('change',e=>{GEN.sStyle=e.target.value;saveGen();});
  $('gs-nb').addEventListener('change',e=>{GEN.sNb=+e.target.value;saveGen();});
  S_NUM.forEach(([k])=>{$('gr-'+k).addEventListener('input',e=>setS(k,e.target.value));$('gn-'+k).addEventListener('change',e=>setS(k,e.target.value));});
}
const STYLES_LBL=[['avant','Avant-poste'],['hangar','Hangar'],['forage','Complexe de forage'],['ruine','Ruine']];
function buildGen(){
  $('gen').innerHTML=`<div class="g"><label for="gn-taille">Taille de la carte</label><input type="range" id="gr-taille" min="1" max="5" step="1" value="${GEN.taille}" aria-label="Taille de la carte, de 1 à 5"><input type="number" id="gn-taille" min="1" max="5" step="1" value="${GEN.taille}"></div><div class="sum" id="genTaille"></div>`
   +GEN_LBL.map(([k,l,mx])=>`<div class="g"><label for="gn-${k}">${l} (%)</label><input type="range" id="gr-${k}" min="0" max="${mx}" step="1" value="${GEN[k]}" aria-label="${l} en pourcentage"><input type="number" id="gn-${k}" min="0" max="${mx}" step="1" value="${GEN[k]}"></div>`).join('')
   +'<div class="sum" id="genSum"></div><div class="sub">Relief (montagnes et gouffres)</div>'
   +`<div class="g2"><label for="gm">Méthode</label><select id="gm">${METHODS.map(([v,l])=>`<option value="${v}"${GEN.methode===v?' selected':''}>${l}</option>`).join('')}</select></div>`
   +`<div class="g2"><label for="gn-remplissage">Remplissage initial (%)</label><input type="number" id="gn-remplissage" min="35" max="70" value="${GEN.remplissage}"></div>`
   +`<div class="g2"><label for="gn-iterations">Itérations</label><input type="number" id="gn-iterations" min="1" max="10" value="${GEN.iterations}"></div>`
   +'<button class="go" id="essaiBtn" title="Fermer et générer une nouvelle carte avec ces réglages">GÉNÉRER LA CARTE</button><div class="sum">Ces réglages donnent le relief et la taille de la carte. GÉNÉRER LA CARTE, comme REGEN, en tire une nouvelle avec les réglages du moment. La faune se règle à part, bouton LIFE.</div>';
  $('essaiBtn').onclick=()=>{$('monde').hidden=true;unlock();SFX.start();newGame();started=true;$('overlay').hidden=true;render();};
  GEN_LBL.forEach(([k])=>{$('gr-'+k).addEventListener('input',e=>setGen(k,e.target.value));$('gn-'+k).addEventListener('change',e=>setGen(k,e.target.value));});
  $('gr-taille').addEventListener('input',e=>setTaille(e.target.value));$('gn-taille').addEventListener('change',e=>setTaille(e.target.value));setTaille(GEN.taille);
  buildStruct();
  $('gm').addEventListener('change',e=>{GEN.methode=e.target.value;saveGen();caState();});
  $('gn-remplissage').addEventListener('change',e=>setCA('remplissage',e.target.value,35,70));
  $('gn-iterations').addEventListener('change',e=>setCA('iterations',e.target.value,1,10));
  GEN_LBL.forEach(([k,,mx])=>{if(GEN[k]>mx)GEN[k]=mx;});setGen('eau',GEN.eau);caState();
}


/* ---------- Menu Monde (15 novembre 2026) : Génération et Life réunis dans une fenêtre, comme le Tile editor ----------
   Archétype de monde : les réglages en cours (relief, taille, faune) enregistrés sous un nom ; MONDES = {nom:{gen:{…},vie:{…}}}, mémorisé
   sous np-mondes. (Les six biomes de la descente ont disparu de la liste le 16 novembre 2026, avec la descente elle-même.) */
let MONDES={};try{const m=JSON.parse(localStorage.getItem('np-mondes')||'null');if(m&&typeof m==='object')MONDES=m;}catch(e){}
let mdPurge=false;for(const n in MONDES)if(MONDES[n]&&MONDES[n].vie){delete MONDES[n].vie;mdPurge=true;}   // archétypes d'avant le 18 novembre 2026 : la faune qu'ils portaient est jetée
const saveMondes=()=>{try{localStorage.setItem('np-mondes',JSON.stringify(MONDES));}catch(e){}touchLocal();};
if(mdPurge)saveMondes();
const mdEsc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function mondeListe(sel){const noms=Object.keys(MONDES).sort((a,b)=>a.localeCompare(b,'fr')),o=(v,l)=>`<option value="${mdEsc(v)}">${mdEsc(l)}</option>`;
  $('mdSel').innerHTML=o('','— Réglages en cours —')+(noms.length?`<optgroup label="Mes archétypes">${noms.map(n=>o('u:'+n,n)).join('')}</optgroup>`:'');
  $('mdSel').value=sel||'';if($('mdSel').selectedIndex<0)$('mdSel').value='';}
function mondeMsg(t,err){const m=$('mdMsg');m.textContent=t;m.className='saved'+(err?' err':'');}
/* Un archétype n'enregistre que la génération (18 novembre 2026, demande de l'utilisateur) : relief, taille, méthode.
   La faune a son propre menu (bouton LIFE) et ne suit plus l'archétype — charger un monde ne touche plus aux espèces.
   Les archétypes enregistrés avant cette date gardent une clé « vie » : on l'efface une fois, au chargement du jeu. */
// applique un relief aux réglages en cours (les champs absents gardent leur valeur)
function mondeApplique(gen){
  for(const k of ['taille','eau','montagne','gouffre','herbe','methode','remplissage','iterations','structure','sNb','sStyle','sPieces','sEntrees','sOuvert','sVerrous'])if(gen&&gen[k]!=null)GEN[k]=gen[k];
  if(!(GEN.taille>=1&&GEN.taille<=5))GEN.taille=4;saveGen();buildGen();}
function mondeCharge(v){
  if(v.startsWith('u:')){const n=v.slice(2),m=MONDES[n];if(!m)return;mondeApplique(m.gen);$('mdNom').value=n;mondeMsg(`« ${n} » chargé (relief et taille ; la faune ne change pas).`);}
  else mondeMsg('');}
function mondeSave(){const n=$('mdNom').value.trim().replace(/\s+/g,' ');if(!n){mondeMsg('Donnez un nom à cet archétype.',true);$('mdNom').focus();return;}
  const neuf=!MONDES[n];MONDES[n]={gen:Object.assign({},GEN)};saveMondes();mondeListe('u:'+n);mondeMsg(neuf?`« ${n} » enregistré.`:`« ${n} » mis à jour.`);}
function mondeDel(){const v=$('mdSel').value;if(!v.startsWith('u:')){mondeMsg('Choisissez un de vos archétypes dans la liste.',true);return;}
  const n=v.slice(2);delete MONDES[n];saveMondes();mondeListe('');$('mdNom').value='';mondeMsg(`« ${n} » supprimé.`);}
function mondeOpen(){if(TRAV)stopTravel();if(REST)stopRest();if(EXPL)stopExplore();mondeListe($('mdSel').value);mondeMsg('');$('monde').hidden=false;$('monde').querySelector('.mcard').focus();}
// Fenêtre Life : la faune, sortie du menu Monde le 18 novembre 2026
function lifeOpen(){if(TRAV)stopTravel();if(REST)stopRest();if(EXPL)stopExplore();$('faune').hidden=false;$('faune').querySelector('.mcard').focus();}
function lifeClose(){$('faune').hidden=true;$('lifeBtn').focus();render();}
$('lifeBtn').onclick=lifeOpen;$('lfClose').onclick=lifeClose;
$('faune').addEventListener('pointerdown',ev=>{if(ev.target===$('faune'))lifeClose();});
function mondeClose(){$('monde').hidden=true;$('mondeBtn').focus();render();}
$('mondeBtn').onclick=mondeOpen;$('mdClose').onclick=mondeClose;$('mdSave').onclick=mondeSave;$('mdDel').onclick=mondeDel;
$('mdSel').addEventListener('change',e=>mondeCharge(e.target.value));
$('mdNom').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();mondeSave();}});
$('monde').addEventListener('pointerdown',ev=>{if(ev.target===$('monde'))mondeClose();});
