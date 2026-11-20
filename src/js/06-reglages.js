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
let GEN={taille:4,eau:10,montagne:12,gouffre:4,herbe:15,methode:'automate',remplissage:55,iterations:5,structure:10,sNb:0,sStyle:'',sPieces:0,sEntrees:0,sOuvert:25,sVerrous:1,sSecrets:1,recette:'atterrissage'};   // structure : part de la carte occupée par les bâtiments (19 novembre 2026)
try{const g=JSON.parse(localStorage.getItem('np-gen')||'null');if(g&&typeof g.eau==='number')GEN=Object.assign(GEN,g);}catch(e){}
if(!(GEN.taille>=1&&GEN.taille<=5))GEN.taille=4;
if(!(GEN.structure>=0&&GEN.structure<=30))GEN.structure=10;
/* Recettes de niveau (20 novembre 2026) : la carte est un plan de zones, décrit ici. « classique » est la génération d'avant la
   refonte (terrain partout, bâtiments posés dessus), gardée telle quelle. zones : la carte a une zone extérieure et un massif ;
   enfoui : le complexe est creusé dans le massif et relié au dehors par des tunnels.
   Chaque recette DÉCLARE SES RÉGLAGES dans « regl » : le menu Monde se construit à partir de cette liste et n'affiche rien d'autre.
   Une ligne vaut ['sub',titre], ['num',clé,libellé,minimum,maximum,valeur de départ] ou ['sel',clé,libellé,choix,valeur de départ].
   Ajouter une recette, c'est ajouter une entrée ici : le menu n'est pas à retoucher.
   La valeur en cours d'un réglage est dans GEN[clé] (c'est là que la génération la lit) ; celles des autres recettes attendent dans
   GEN.rec[recette], pour que changer de recette et revenir ne perde rien. Les réglages des zones (clés « z… ») donnent un CENTRE :
   la génération tire autour à chaque carte (voir autour()). */
const STYLES_LBL=[['avant','Avant-poste'],['hangar','Hangar'],['forage','Complexe de forage'],['ruine','Ruine']];
const R_STYLE=['sel','sStyle','Archétype de structure',[['','Au hasard']].concat(STYLES_LBL),''],R_PIECES=['num','sPieces','Pièces par structure',0,40,0],
  R_OUVERT=['num','sOuvert','Ouvertures sans porte (%)',0,100,25],R_VERROUS=['num','sVerrous','Portes verrouillées',0,3,1],R_SECRETS=['num','sSecrets','Pièces secrètes',0,3,1];
const R_AIDE='Avant-poste : petites pièces, peu de boucles. Hangar : grandes salles à piliers. Complexe de forage : couloirs et gouffres. Ruine : cavernes effondrées.';
const RECETTES={atterrissage:{n:'Niveau 1 : extérieur, montagne, complexe enfoui',zones:true,enfoui:true,titre:'Massif, tunnels, complexe',
    aide:'Chaque curseur donne un centre : la carte varie autour à chaque tirage. '+R_AIDE,
    regl:[['sub','Massif'],['sel','zForme','Forme du massif',[['','Au hasard'],['cote','Un côté'],['coin','Un coin']],''],['num','zExt','Part d’extérieur (%)',35,80,60],['num','zComplexe','Taille du complexe (% du massif)',10,70,45],
      ['sub','Tunnels'],['num','zTunnels','Taille du réseau (cases)',100,400,245],['num','zSalles','Salles de tunnel',0,8,4],
      ['num','zSorties','Sorties du réseau',1,3,2],['num','zPorte','Éloignement de la porte (cases)',10,45,30],
      ['sub','Complexe'],R_STYLE,R_PIECES,R_OUVERT,R_VERROUS,R_SECRETS]},
  classique:{n:'Classique : terrain partout, bâtiments posés dessus',titre:'Structures',aide:R_AIDE,
    regl:[R_STYLE,['sel','sNb','Nombre de structures',[[0,'Une ou deux'],[1,'Une'],[2,'Deux']],0],['num','structure','Surface bâtie (%)',0,70,10],
      R_PIECES,['num','sEntrees','Portes d’entrée',0,4,0],R_OUVERT,R_VERROUS,R_SECRETS]}};
if(!RECETTES[GEN.recette])GEN.recette='atterrissage';
const ENFOUI=()=>!!(RECETTES[GEN.recette]||{}).enfoui;
const recLignes=r=>RECETTES[r].regl.filter(l=>l[0]!=='sub');
const recBon=(l,v)=>l[0]==='num'?typeof v==='number'&&v>=l[3]&&v<=l[4]:l[3].some(([o])=>o===v);
// range les réglages de la recette en cours dans GEN.rec
function recRange(){if(!GEN.rec||typeof GEN.rec!=='object')GEN.rec={};const o=GEN.rec[GEN.recette]={};for(const l of recLignes(GEN.recette))o[l[1]]=GEN[l[1]];}
// passe à la recette r : ses valeurs gardées, sinon celles en cours (réglages communs), sinon les valeurs de départ
function recPrend(r){if(!RECETTES[r])r='atterrissage';const s=(GEN.rec&&GEN.rec[r])||{};
  for(const l of recLignes(r)){const k=l[1],d=l[l.length-1];GEN[k]=recBon(l,s[k])?s[k]:recBon(l,GEN[k])?GEN[k]:d;}
  GEN.recette=r;}
recPrend(GEN.recette);
// valeur tirée autour du centre donné par un curseur : centre × (1 ± p)
const autour=(k,p)=>GEN[k]*(1+(Math.random()*2-1)*p);
function setTaille(v){v=Math.max(1,Math.min(5,Math.round(+v||4)));GEN.taille=v;$('gr-taille').value=v;$('gn-taille').value=v;
  $('genTaille').textContent=`${SIZES[v][0]} × ${SIZES[v][1]} cases${v===4?' (taille d’origine)':''}. Appliqué au prochain lancement.`;saveGen();}
const saveGen=()=>{recRange();try{localStorage.setItem('np-gen',JSON.stringify(GEN));}catch(e){}touchLocal();};
function setGen(k,v){const others=GEN_LBL.reduce((a,[kk])=>a+(kk===k?0:GEN[kk]),0),mx=GEN_LBL.find(l=>l[0]===k)[2];
  v=Math.max(0,Math.min(mx,GEN_SUM-others,Math.round(+v||0)));GEN[k]=v;$('gr-'+k).value=v;$('gn-'+k).value=v;saveGen();}
function setCA(k,v,mn,mx){v=Math.max(mn,Math.min(mx,Math.round(+v||mn)));GEN[k]=v;$('gn-'+k).value=v;saveGen();}
function caState(){const off=GEN.methode==='bruit';$('gn-remplissage').disabled=off;$('gn-iterations').disabled=off;}
// La faune se règle par groupes : voir 06b-groupes (19 novembre 2026 ; avant, une intensité par espèce).
// Colonne de droite du menu Monde : les réglages que déclare la recette en cours (20 novembre 2026 ; avant, une liste fixe de « Structures »).
function setS(k,v){const l=recLignes(GEN.recette).find(l=>l[1]===k);if(!l)return;v=Math.max(l[3],Math.min(l[4],Math.round(+v||0)));GEN[k]=v;$('gr-'+k).value=v;$('gn-'+k).value=v;saveGen();}
function setStruct(v){setS('structure',v);}
function buildStruct(){
  recPrend(GEN.recette);const rec=RECETTES[GEN.recette];
  $('genR').innerHTML=`<label for="gs-recette">Recette de niveau</label><select id="gs-recette">${Object.keys(RECETTES).map(k=>`<option value="${k}"${GEN.recette===k?' selected':''}>${RECETTES[k].n}</option>`).join('')}</select>`;
  $('genSTitre').textContent=rec.titre||'Structures';
  $('genS').innerHTML=rec.regl.map(l=>{const [ty,k,lb]=l;
    if(ty==='sub')return `<div class="sub">${k}</div>`;
    if(ty==='sel')return `<div class="g2"><label for="gs-${k}">${lb}</label><select id="gs-${k}">${l[3].map(([v,t])=>`<option value="${v}"${GEN[k]===v?' selected':''}>${t}</option>`).join('')}</select></div>`;
    return `<div class="g"><label for="gn-${k}">${lb}</label><input type="range" id="gr-${k}" min="${l[3]}" max="${l[4]}" step="1" value="${GEN[k]}" aria-label="${lb}"><input type="number" id="gn-${k}" min="${l[3]}" max="${l[4]}" step="1" value="${GEN[k]}"></div>`;}).join('')
   +`<div class="sum">${rec.aide||''}</div>`;
  $('gs-recette').addEventListener('change',e=>{recRange();recPrend(e.target.value);saveGen();buildStruct();$('gs-recette').focus();});
  for(const l of recLignes(GEN.recette)){const k=l[1];
    if(l[0]==='sel')$('gs-'+k).addEventListener('change',e=>{const v=e.target.value;GEN[k]=typeof l[4]==='number'?+v:v;saveGen();});
    else{$('gr-'+k).addEventListener('input',e=>setS(k,e.target.value));$('gn-'+k).addEventListener('change',e=>setS(k,e.target.value));}}
}
function buildGen(){
  $('gen').innerHTML=`<div class="g"><label for="gn-taille">Taille de la carte</label><input type="range" id="gr-taille" min="1" max="5" step="1" value="${GEN.taille}" aria-label="Taille de la carte, de 1 à 5"><input type="number" id="gn-taille" min="1" max="5" step="1" value="${GEN.taille}"></div><div class="sum" id="genTaille"></div>`
   +GEN_LBL.map(([k,l,mx])=>`<div class="g"><label for="gn-${k}">${l} (%)</label><input type="range" id="gr-${k}" min="0" max="${mx}" step="1" value="${GEN[k]}" aria-label="${l} en pourcentage"><input type="number" id="gn-${k}" min="0" max="${mx}" step="1" value="${GEN[k]}"></div>`).join('')
   +'<div class="sub">Relief (montagnes et gouffres)</div>'
   +`<div class="g2"><label for="gm">Méthode</label><select id="gm">${METHODS.map(([v,l])=>`<option value="${v}"${GEN.methode===v?' selected':''}>${l}</option>`).join('')}</select></div>`
   +`<div class="g2"><label for="gn-remplissage">Remplissage initial (%)</label><input type="number" id="gn-remplissage" min="35" max="70" value="${GEN.remplissage}"></div>`
   +`<div class="g2"><label for="gn-iterations">Itérations</label><input type="number" id="gn-iterations" min="1" max="10" value="${GEN.iterations}"></div>`
   +'<button class="go" id="essaiBtn" title="Fermer et générer une nouvelle carte avec ces réglages">GÉNÉRER LA CARTE</button>';
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
  for(const k of ['taille','eau','montagne','gouffre','herbe','methode','remplissage','iterations','structure','sNb','sStyle','sPieces','sEntrees','sOuvert','sVerrous','sSecrets'])if(gen&&gen[k]!=null)GEN[k]=gen[k];
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
function lifeOpen(){if(TRAV)stopTravel();if(REST)stopRest();if(EXPL)stopExplore();buildLife();$('faune').hidden=false;$('faune').querySelector('.mcard').focus();}
function lifeClose(){$('faune').hidden=true;$('lifeBtn').focus();render();}
$('lifeBtn').onclick=lifeOpen;$('lfClose').onclick=lifeClose;
$('faune').addEventListener('pointerdown',ev=>{if(ev.target===$('faune'))lifeClose();});
function mondeClose(){$('monde').hidden=true;$('mondeBtn').focus();render();}
$('mondeBtn').onclick=mondeOpen;$('mdClose').onclick=mondeClose;$('mdSave').onclick=mondeSave;$('mdDel').onclick=mondeDel;
$('mdSel').addEventListener('change',e=>mondeCharge(e.target.value));
$('mdNom').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();mondeSave();}});
$('monde').addEventListener('pointerdown',ev=>{if(ev.target===$('monde'))mondeClose();});
