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
let GEN={taille:4,eau:10,montagne:12,gouffre:4,herbe:15,methode:'automate',remplissage:55,iterations:5,structure:10,sNb:0,sStyle:'',sPieces:0,sEntrees:0,sOuvert:25,sVerrous:1,sSecrets:1,recette:'atterrissage',hasard:false,grain:65,regroupe:45};   // structure : part de la carte occupée par les bâtiments (19 novembre 2026)
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
const R_STYLE=['sel','sStyle','Archétype de structure',[['','Au hasard']].concat(STYLES_LBL),'',STYLES_LBL.map(([v])=>v)],
  R_PIECES=['num','sPieces','Pièces par structure',0,40,0],   // sans fourchette de hasard : 0 veut dire « pas de limite », et un tirage bas ferait un complexe de trois pièces
  R_OUVERT=['num','sOuvert','Ouvertures sans porte (%)',0,100,25,[0,60]],R_VERROUS=['num','sVerrous','Portes verrouillées',0,3,1,[0,3]],R_SECRETS=['num','sSecrets','Pièces secrètes',0,3,1,[0,3]];
const R_AIDE='Avant-poste : petites pièces, peu de boucles. Hangar : grandes salles à piliers. Complexe de forage : couloirs et gouffres. Ruine : cavernes effondrées.';
/* Ambiances (21 novembre 2026 ; avant, cinq ambiances pour la seule recette « cavernes ») : chaque recette a une dizaine de préréglages
   nommés, au caractère reconnaissable. Une ambiance remet les réglages de sa recette à leur valeur de départ et le relief de la colonne
   de gauche à AMB_DEF, puis pose les siens. Toucher ensuite à un curseur repasse sur « Personnalisée ».
   La case « Réglages au hasard » tire une ambiance, puis fait varier les curseurs qu'elle laisse libres (voir hasardReglages). */
const AMB_DEF={eau:10,montagne:12,gouffre:4,herbe:15,methode:'automate',remplissage:55,iterations:5,grain:65,regroupe:45};
const AMBIANCES={
 atterrissage:{
  prairie:{n:'Grande prairie',v:{herbe:58,eau:5,montagne:3,gouffre:1,grain:85,regroupe:60,zExt:68,zComplexe:35,sStyle:'avant'}},
  lac:{n:'Rives du grand lac',v:{eau:36,herbe:12,montagne:3,gouffre:0,grain:100,regroupe:100,zExt:72,zComplexe:40}},
  marais:{n:'Marais',v:{eau:26,herbe:38,montagne:2,gouffre:0,grain:40,regroupe:15,zExt:66}},
  desert:{n:'Désert de pierre',v:{eau:0,herbe:2,montagne:7,gouffre:2,grain:60,regroupe:30,zExt:72,zTunnels:160,zSalles:2}},
  failles:{n:'Terre fracturée',v:{gouffre:22,montagne:5,eau:2,herbe:8,grain:85,regroupe:40,methode:'bruit',zExt:66}},
  chaos:{n:'Chaos rocheux',v:{montagne:36,eau:3,herbe:6,gouffre:2,grain:38,regroupe:0,methode:'mixte',zExt:70}},
  chaine:{n:'Chaîne de montagnes',v:{montagne:30,eau:6,herbe:14,gouffre:1,grain:100,regroupe:100,zExt:68}},
  forteresse:{n:'Forteresse sous la montagne',v:{eau:4,herbe:8,montagne:6,gouffre:1,zExt:40,zComplexe:68,zTunnels:120,zSalles:1,zSorties:1,zPorte:14,sStyle:'hangar',sVerrous:3,sOuvert:10}},
  dedale:{n:'Dédale de tunnels',v:{eau:5,herbe:10,montagne:8,gouffre:2,zExt:44,zComplexe:20,zTunnels:400,zSalles:8,zSorties:3,zPorte:45,sStyle:'avant'}},
  ruines:{n:'Ruines noyées',v:{eau:24,herbe:26,montagne:3,gouffre:1,grain:75,regroupe:55,zForme:'coin',zExt:55,zComplexe:58,sStyle:'ruine',sOuvert:70,sSecrets:3,sVerrous:0}}},
 cavernes:{
  sauvage:{n:'Grottes sauvages',v:{herbe:22,eau:8,cvDispo:'mel',cvPart:45,cvTaille:300,cvVar:70,cvForme:70,cvBoyaux:3,cvCuls:3,cvMont:5,cvRoc:3,cvBati:1,cvSurf:6,cvPieces:4}},
  cathedrale:{n:'Cathédrale',v:{herbe:3,eau:4,cvDispo:'cav',cvPart:40,cvTaille:800,cvVar:30,cvEcart:6,cvForme:35,cvLarg:2,cvBoyaux:1,cvCuls:1,cvMont:2,cvGouf:5,cvBati:2,cvSurf:10}},
  termitiere:{n:'Termitière',v:{herbe:4,eau:2,cvDispo:'mel',cvPart:26,cvTaille:50,cvVar:20,cvEcart:2,cvForme:40,cvSinu:70,cvBoyaux:5,cvCuls:5,cvMont:0,cvGouf:1,cvRoc:1,cvBati:2,cvSurf:10}},
  cite:{n:'Cité enfouie',v:{herbe:5,eau:3,cvDispo:'cite',cvPart:18,cvTaille:120,cvBati:4,cvSurf:30,cvPieces:12,cvPortes:2}},
  postes:{n:'Avant-postes',v:{cvDispo:'mel',cvPart:30,cvTaille:160,cvBati:5,cvSurf:12,cvPieces:4,sStyle:'avant'}},
  lac:{n:'Lac souterrain',v:{eau:50,herbe:4,grain:100,regroupe:100,cvDispo:'cav',cvPart:44,cvTaille:750,cvVar:35,cvForme:40,cvMont:0,cvGouf:0,cvRoc:1,cvBati:2,cvSurf:8}},
  jardins:{n:'Jardins engloutis',v:{herbe:72,eau:6,grain:80,regroupe:50,cvPart:40,cvTaille:260,cvForme:30,cvMont:1,cvGouf:0,cvBati:2,cvSurf:10,sStyle:'ruine',sOuvert:60}},
  abimes:{n:'Abîmes',v:{eau:0,herbe:3,grain:85,regroupe:60,cvPart:40,cvTaille:420,cvVar:50,cvGouf:10,cvMont:2,cvRoc:1,cvBoyaux:1,cvBati:2,cvSurf:9,sStyle:'forage'}},
  boyaux:{n:'Dédale de boyaux',v:{eau:2,herbe:2,cvDispo:'mel',cvPart:15,cvTaille:45,cvVar:30,cvEcart:3,cvSinu:90,cvBoyaux:6,cvCuls:6,cvLarg:1,cvMont:0,cvGouf:0,cvBati:3,cvSurf:8,cvPieces:3}},
  bunker:{n:'Bunker',v:{eau:2,herbe:2,cvDispo:'cite',cvPart:14,cvTaille:140,cvVar:20,cvBati:1,cvSurf:34,cvPieces:20,cvPortes:1,sStyle:'forage',sVerrous:3,sOuvert:5}},
  eboulis:{n:'Chaos d’éboulis',v:{eau:2,herbe:6,grain:35,regroupe:0,cvPart:46,cvTaille:360,cvForme:95,cvVar:60,cvRoc:8,cvMont:14,cvGouf:2,cvBati:1,cvSurf:6}}},
 classique:{
  isole:{n:'Avant-poste isolé',v:{herbe:22,eau:8,montagne:10,gouffre:2,structure:5,sNb:1,sStyle:'avant',sPieces:4}},
  citadelle:{n:'Citadelle',v:{herbe:8,eau:3,montagne:6,gouffre:1,structure:46,sNb:1,sStyle:'forage',sEntrees:2,sVerrous:3,sOuvert:10}},
  jumelles:{n:'Bases jumelles',v:{herbe:12,eau:6,montagne:8,gouffre:3,structure:24,sNb:2,sStyle:'avant',sEntrees:1}},
  hangars:{n:'Hangars',v:{herbe:6,eau:2,montagne:4,gouffre:0,structure:30,sNb:2,sStyle:'hangar',sOuvert:60}},
  herbes:{n:'Ruines sous les herbes',v:{herbe:64,eau:5,montagne:3,gouffre:1,grain:85,regroupe:40,structure:16,sStyle:'ruine',sOuvert:80,sSecrets:3,sVerrous:0}},
  lacustre:{n:'Station lacustre',v:{eau:44,herbe:8,montagne:2,gouffre:0,grain:100,regroupe:90,structure:9,sNb:1,sStyle:'avant'}},
  plateau:{n:'Plateau désert',v:{eau:0,herbe:2,montagne:6,gouffre:1,grain:55,structure:8,sNb:1,sStyle:'hangar'}},
  failles:{n:'Champ de failles',v:{gouffre:24,montagne:4,eau:1,herbe:6,grain:85,methode:'bruit',structure:9,sNb:1,sStyle:'forage'}},
  cols:{n:'Cols de montagne',v:{montagne:46,eau:3,herbe:8,gouffre:2,grain:75,regroupe:25,methode:'mixte',structure:7,sNb:2,sStyle:'avant'}},
  archipel:{n:'Marécage',v:{eau:30,herbe:40,montagne:1,gouffre:0,grain:42,regroupe:10,structure:8,sNb:2,sStyle:'ruine',sOuvert:70}}}};
const ambNom=(rec,a)=>((AMBIANCES[rec]||{})[a]||{}).n||'';
const R_AMB=rec=>['sel','amb','Ambiance (préréglage)',[['','Personnalisée']].concat(Object.keys(AMBIANCES[rec]||{}).map(k=>[k,AMBIANCES[rec][k].n])),''];
function ambiance(a,rec){rec=rec||GEN.recette;const A=(AMBIANCES[rec]||{})[a];if(!A)return;
  for(const l of recLignes(rec))if(l[1]!=='amb')GEN[l[1]]=recDef(l);
  Object.assign(GEN,AMB_DEF,A.v);GEN.amb=a;}
// Ce que la dernière carte « cavernes » a donné, sous les réglages (G.obt, rempli par cvBilan)
function obtenuTxt(){const r=n=>Math.round(n),N=SIZES[GEN.taille][0]*SIZES[GEN.taille][1],v=Math.max(1,Math.min(30,Math.round(N*GEN.cvPart/100/Math.max(16,GEN.cvTaille*Math.max(.3,Math.min(1,N/6144))))));
  let s=`Ces réglages visent environ ${v} caverne${v>1?'s':''}.`;const o=typeof G!=='undefined'&&G&&G.recette==='cavernes'&&G.obt;
  if(o)s+=` Carte en cours : ${r(o.cav)} % de cavernes (visé ${r(o.vise.cav)}) · ${o.nb} caverne${o.nb>1?'s':''} (${o.vise.nb}) · ${o.bat} bâtiment${o.bat>1?'s':''} (${o.vise.bat}) · ${r(o.surf)} % bâti (${r(o.vise.surf)}) · ${({mel:'zones mélangées',cote:'un côté chacun',cite:'cité au centre',cav:'cavernes au centre'})[o.dispo]}.`;
  return s;}
const RECETTES={atterrissage:{n:'Niveau 1 : extérieur, montagne, complexe enfoui',zones:true,enfoui:true,titre:'Massif, tunnels, complexe',
    aide:'Chaque curseur donne un centre : la carte varie autour à chaque tirage. '+R_AIDE,
    regl:[R_AMB('atterrissage'),['sub','Massif'],['sel','zForme','Forme du massif',[['','Au hasard'],['cote','Un côté'],['coin','Un coin']],'',['cote','coin']],
      ['num','zExt','Part d’extérieur (%)',35,80,60,[40,75]],['num','zComplexe','Taille du complexe (% du massif)',10,70,45,[25,65]],
      ['sub','Tunnels'],['num','zTunnels','Taille du réseau (cases)',100,400,245,[140,380]],['num','zSalles','Salles de tunnel',0,8,4,[1,7]],
      ['num','zSorties','Sorties du réseau',1,3,2,[1,3]],['num','zPorte','Éloignement de la porte (cases)',10,45,30,[15,42]],
      ['sub','Complexe'],R_STYLE,R_PIECES,R_OUVERT,R_VERROUS,R_SECRETS]},
  cavernes:{n:'Niveau 2 : réseau de cavernes, bâtiments enchâssés',zones:true,enfoui:true,cavernes:true,sansVaisseau:true,titre:'Cavernes, boyaux, bâtiments',
    aide:'Tout est sous roche : la foreuse arrive par un puits. Chaque curseur donne un centre : la carte varie autour à chaque tirage. L’eau et l’herbe de la colonne de gauche valent pour le sol des cavernes ; la montagne et le gouffre de cette recette se règlent ici. '+R_AIDE,
    regl:[R_AMB('cavernes'),
      ['sel','cvDispo','Disposition des zones',[['','Au hasard'],['mel','Mélangée'],['cote','Cavernes d’un côté, bâti de l’autre'],['cite','Cité au centre'],['cav','Cavernes au centre']],'',['mel','cote','cite','cav']],
      ['sub','Cavernes'],['num','cvPart','Part de cavernes (% de la carte)',10,60,32,[22,45]],['num','cvTaille','Taille des cavernes (cases)',30,800,240,[60,450]],
      ['num','cvVar','Variété des tailles (0 : toutes pareilles)',0,100,40,[10,80]],['num','cvEcart','Roche entre deux cavernes (cases)',1,8,3,[2,5]],
      ['num','cvForme','Forme (0 : ronde · 100 : déchiquetée)',0,100,50,[20,80]],
      ['sub','Boyaux'],['num','cvLarg','Largeur des boyaux',1,3,1,[1,2]],['num','cvSinu','Sinuosité',0,100,50,[20,80]],
      ['num','cvBoyaux','Boucles entre cavernes',0,6,2,[0,4]],['num','cvCuls','Culs-de-sac',0,6,2,[0,4]],
      ['sub','Sol des cavernes'],['num','cvMont','Montagne (%)',0,15,4,[0,8]],['num','cvGouf','Gouffre (%)',0,10,3,[0,6]],['num','cvRoc','Rochers épars (%)',0,8,2,[0,4]],
      ['sub','Bâtiments'],['num','cvBati','Nombre de bâtiments',1,6,2,[1,4]],['num','cvSurf','Surface bâtie (% de la carte)',5,40,14,[8,24]],
      ['num','cvPieces','Pièces par bâtiment (0 : automatique)',0,25,0],['num','cvPortes','Portes par bâtiment',1,3,1,[1,2]],
      R_STYLE,R_OUVERT,R_VERROUS,R_SECRETS]},
  classique:{n:'Classique : terrain partout, bâtiments posés dessus',titre:'Structures',aide:R_AIDE,
    regl:[R_AMB('classique'),R_STYLE,['sel','sNb','Nombre de structures',[[0,'Une ou deux'],[1,'Une'],[2,'Deux']],0,[0,1,2]],['num','structure','Surface bâtie (%)',0,70,10,[6,22]],
      R_PIECES,['num','sEntrees','Portes d’entrée',0,4,0],R_OUVERT,R_VERROUS,R_SECRETS]}};
if(!RECETTES[GEN.recette])GEN.recette='atterrissage';
const ENFOUI=()=>!!(RECETTES[GEN.recette]||{}).enfoui;
const recLignes=r=>RECETTES[r].regl.filter(l=>l[0]!=='sub');
const recBon=(l,v)=>l[0]==='num'?typeof v==='number'&&v>=l[3]&&v<=l[4]:l[3].some(([o])=>o===v);
const recDef=l=>l[0]==='num'?l[5]:l[4];   // valeur de départ ; ce qui suit est la fourchette dans laquelle le bouton REGEN tire au hasard (rien : réglage laissé tel quel)
// range les réglages de la recette en cours dans GEN.rec
function recRange(){if(!GEN.rec||typeof GEN.rec!=='object')GEN.rec={};const o=GEN.rec[GEN.recette]={};for(const l of recLignes(GEN.recette))o[l[1]]=GEN[l[1]];}
// passe à la recette r : ses valeurs gardées, sinon celles en cours (réglages communs), sinon les valeurs de départ
function recPrend(r){if(!RECETTES[r])r='atterrissage';const s=(GEN.rec&&GEN.rec[r])||{};
  for(const l of recLignes(r)){const k=l[1],d=recDef(l);GEN[k]=recBon(l,s[k])?s[k]:recBon(l,GEN[k])?GEN[k]:d;}
  GEN.recette=r;}
recPrend(GEN.recette);
/* Case « Réglages au hasard » (20 novembre 2026) : cochée, le bouton REGEN tire d'abord tous les réglages du menu Monde, puis
   génère. On ne touche ni à la taille de la carte ni aux réglages dont 0 veut dire « automatique » (pièces par structure,
   portes d'entrée). Le relief est tiré avec un biais vers le bas : une planète noyée ou murée n'a pas d'intérêt. */
const HASARD_REL={eau:30,montagne:30,gouffre:12,herbe:45};   // plafond de chaque terrain pour le tirage, bien en deçà des maximums du menu
function hasardReglages(){
  const rec=GEN.recette,cles=Object.keys(AMBIANCES[rec]||{});
  if(cles.length){   // une ambiance au hasard, puis de la variété sur les curseurs qu'elle ne fixe pas (21 novembre 2026)
    const a=cles[rnd(0,cles.length-1)],A=AMBIANCES[rec][a].v;ambiance(a,rec);
    for(const l of recLignes(rec)){const k=l[1];if(k==='amb'||k in A)continue;
      if(l[0]==='num'){const f=l[6];if(f)GEN[k]=rnd(f[0],f[1]);}
      else{const f=l[5];if(f&&f.length)GEN[k]=f[rnd(0,f.length-1)];}}
    for(const [k,,mx] of GEN_LBL)if(GEN[k]>0)GEN[k]=Math.max(0,Math.min(mx,Math.round(GEN[k]*(.85+Math.random()*.3))));
    saveGen();buildGen();return;}
  let reste=GEN_SUM;
  for(const [k,,mx] of GEN_LBL){const v=Math.max(0,Math.min(mx,reste,Math.round(Math.pow(Math.random(),1.4)*HASARD_REL[k])));GEN[k]=v;reste-=v;}
  GEN.methode=METHODS[rnd(0,METHODS.length-1)][0];
  for(const l of recLignes(GEN.recette)){const k=l[1];
    if(l[0]==='num'){const f=l[6];if(f)GEN[k]=rnd(f[0],f[1]);}
    else{const f=l[5];if(f&&f.length)GEN[k]=f[rnd(0,f.length-1)];}}
  saveGen();buildGen();}
// valeur tirée autour du centre donné par un curseur : centre × (1 ± p)
const autour=(k,p)=>GEN[k]*(1+(Math.random()*2-1)*p);
function setTaille(v){v=Math.max(1,Math.min(5,Math.round(+v||4)));GEN.taille=v;$('gr-taille').value=v;$('gn-taille').value=v;
  $('genTaille').textContent=`${SIZES[v][0]} × ${SIZES[v][1]} cases${v===4?' (taille d’origine)':''}. Appliqué au prochain lancement.`;saveGen();}
const saveGen=()=>{recRange();try{localStorage.setItem('np-gen',JSON.stringify(GEN));}catch(e){}touchLocal();};
function setGen(k,v,muet){const others=GEN_LBL.reduce((a,[kk])=>a+(kk===k?0:GEN[kk]),0),mx=GEN_LBL.find(l=>l[0]===k)[2];
  v=Math.max(0,Math.min(mx,GEN_SUM-others,Math.round(+v||0)));GEN[k]=v;$('gr-'+k).value=v;$('gn-'+k).value=v;if(!muet)persoAmb(k);saveGen();}
function setCA(k,v,mn,mx){v=Math.max(mn,Math.min(mx,Math.round(+v||mn)));GEN[k]=v;$('gn-'+k).value=v;persoAmb(k);saveGen();}
function setRel(k,v){v=Math.max(0,Math.min(100,Math.round(+v||0)));GEN[k]=v;$('gr-'+k).value=v;$('gn-'+k).value=v;persoAmb(k);saveGen();}
function caState(){const off=GEN.methode==='bruit';$('gn-remplissage').disabled=off;$('gn-iterations').disabled=off;}
// La faune se règle par groupes : voir 06b-groupes (19 novembre 2026 ; avant, une intensité par espèce).
// Colonne de droite du menu Monde : les réglages que déclare la recette en cours (20 novembre 2026 ; avant, une liste fixe de « Structures »).
function setS(k,v){const l=recLignes(GEN.recette).find(l=>l[1]===k);if(!l)return;v=Math.max(l[3],Math.min(l[4],Math.round(+v||0)));GEN[k]=v;$('gr-'+k).value=v;$('gn-'+k).value=v;persoAmb(k);saveGen();}
function persoAmb(k){if(k==='amb'||APPLYING_AMB)return;if(GEN.amb){GEN.amb='';const e=$('gs-amb');if(e)e.value='';}const o=$('genObt');if(o)o.textContent=obtenuTxt();}
let APPLYING_AMB=false;
function setStruct(v){setS('structure',v);}
function buildStruct(){
  recPrend(GEN.recette);const rec=RECETTES[GEN.recette];
  $('genR').innerHTML=`<label for="gs-recette">Recette de niveau</label><select id="gs-recette">${Object.keys(RECETTES).map(k=>`<option value="${k}"${GEN.recette===k?' selected':''}>${RECETTES[k].n}</option>`).join('')}</select>`;
  $('genSTitre').textContent=rec.titre||'Structures';
  $('genS').innerHTML=rec.regl.map(l=>{const [ty,k,lb]=l;
    if(ty==='sub')return `<div class="sub">${k}</div>`;
    if(ty==='sel')return `<div class="g2"><label for="gs-${k}">${lb}</label><select id="gs-${k}">${l[3].map(([v,t])=>`<option value="${v}"${GEN[k]===v?' selected':''}>${t}</option>`).join('')}</select></div>`;
    return `<div class="g"><label for="gn-${k}">${lb}</label><input type="range" id="gr-${k}" min="${l[3]}" max="${l[4]}" step="1" value="${GEN[k]}" aria-label="${lb}"><input type="number" id="gn-${k}" min="${l[3]}" max="${l[4]}" step="1" value="${GEN[k]}"></div>`;}).join('')
   +(rec.cavernes?`<div class="sum" id="genObt">${obtenuTxt()}</div>`:'')+`<div class="sum">${rec.aide||''}</div>`;
  $('gs-recette').addEventListener('change',e=>{recRange();recPrend(e.target.value);if(GEN.amb&&ambNom(GEN.recette,GEN.amb)){ambiance(GEN.amb);saveGen();buildGen();}else{saveGen();buildStruct();}$('gs-recette').focus();});
  for(const l of recLignes(GEN.recette)){const k=l[1];
    if(l[0]==='sel')$('gs-'+k).addEventListener('change',e=>{const v=e.target.value;GEN[k]=typeof l[4]==='number'?+v:v;if(k==='amb'){if(v){ambiance(v);saveGen();buildGen();$('gs-amb').focus();}else saveGen();return;}persoAmb(k);saveGen();});
    else{$('gr-'+k).addEventListener('input',e=>setS(k,e.target.value));$('gn-'+k).addEventListener('change',e=>setS(k,e.target.value));}}
}
function buildGen(){
  $('gen').innerHTML=`<div class="g"><label for="gn-taille">Taille de la carte</label><input type="range" id="gr-taille" min="1" max="5" step="1" value="${GEN.taille}" aria-label="Taille de la carte, de 1 à 5"><input type="number" id="gn-taille" min="1" max="5" step="1" value="${GEN.taille}"></div><div class="sum" id="genTaille"></div>`
   +GEN_LBL.map(([k,l,mx])=>`<div class="g"><label for="gn-${k}">${l} (%)</label><input type="range" id="gr-${k}" min="0" max="${mx}" step="1" value="${GEN[k]}" aria-label="${l} en pourcentage"><input type="number" id="gn-${k}" min="0" max="${mx}" step="1" value="${GEN[k]}"></div>`).join('')
   +'<div class="sub">Relief (montagnes et gouffres)</div>'
   +`<div class="g2"><label for="gm">Méthode</label><select id="gm">${METHODS.map(([v,l])=>`<option value="${v}"${GEN.methode===v?' selected':''}>${l}</option>`).join('')}</select></div>`
   +`<div class="g2"><label for="gn-remplissage">Remplissage initial (%)</label><input type="number" id="gn-remplissage" min="35" max="70" value="${GEN.remplissage}"></div>`
   +`<div class="g2"><label for="gn-iterations">Itérations</label><input type="number" id="gn-iterations" min="1" max="10" value="${GEN.iterations}"></div>`
   +[['grain','Grain (0 : émietté · 100 : massif)'],['regroupe','Regroupement par régions']].map(([k,l])=>`<div class="g"><label for="gn-${k}">${l}</label><input type="range" id="gr-${k}" min="0" max="100" step="1" value="${GEN[k]}" aria-label="${l}"><input type="number" id="gn-${k}" min="0" max="100" step="1" value="${GEN[k]}"></div>`).join('')
   +'<button class="go" id="essaiBtn" title="Fermer et générer une nouvelle carte avec ces réglages">GÉNÉRER LA CARTE</button>';
  $('essaiBtn').onclick=()=>{$('monde').hidden=true;unlock();SFX.start();newGame();started=true;$('overlay').hidden=true;render();};
  GEN_LBL.forEach(([k])=>{$('gr-'+k).addEventListener('input',e=>setGen(k,e.target.value));$('gn-'+k).addEventListener('change',e=>setGen(k,e.target.value));});
  $('gr-taille').addEventListener('input',e=>setTaille(e.target.value));$('gn-taille').addEventListener('change',e=>setTaille(e.target.value));setTaille(GEN.taille);
  buildStruct();
  $('gm').addEventListener('change',e=>{GEN.methode=e.target.value;persoAmb('methode');saveGen();caState();});
  $('gn-remplissage').addEventListener('change',e=>setCA('remplissage',e.target.value,35,70));
  $('gn-iterations').addEventListener('change',e=>setCA('iterations',e.target.value,1,10));
  for(const k of ['grain','regroupe']){$('gr-'+k).addEventListener('input',e=>setRel(k,e.target.value));$('gn-'+k).addEventListener('change',e=>setRel(k,e.target.value));}
  GEN_LBL.forEach(([k,,mx])=>{if(GEN[k]>mx)GEN[k]=mx;});setGen('eau',GEN.eau,true);caState();
}


/* ---------- Menu Monde (15 novembre 2026) : Génération et Life réunis dans une fenêtre, comme le Tile editor ----------
   Archétype de monde : les réglages en cours (relief, taille, faune) enregistrés sous un nom ; MONDES = {nom:{gen:{…},vie:{…}}}, mémorisé
   sous np-mondes. (Les six biomes de la descente ont disparu de la liste le 16 novembre 2026, avec la descente elle-même.) */
let MONDES={};try{const m=JSON.parse(localStorage.getItem('np-mondes')||'null');if(m&&typeof m==='object')MONDES=m;}catch(e){}
/* Archétypes enregistrés avant le 21 novembre 2026 : effacés une fois, à la demande de l'utilisateur (les ambiances les remplacent). */
try{if(localStorage.getItem('np-mondes-v')!=='2'){MONDES={};localStorage.setItem('np-mondes','{}');localStorage.setItem('np-mondes-v','2');}}catch(e){}
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
  for(const k of ['taille','eau','montagne','gouffre','herbe','methode','remplissage','iterations','grain','regroupe','structure','sNb','sStyle','sPieces','sEntrees','sOuvert','sVerrous','sSecrets'])if(gen&&gen[k]!=null)GEN[k]=gen[k];
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
