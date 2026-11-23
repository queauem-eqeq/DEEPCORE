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
let GEN={taille:4,eau:10,montagne:12,gouffre:4,herbe:15,methode:'automate',remplissage:55,iterations:5,structure:10,sNb:0,sStyle:'',sPieces:0,sEntrees:0,sOuvert:25,sVerrous:1,sSecrets:1,recette:'atterrissage',grain:65,regroupe:45,cvMont:4,cvGouf:3,cvRoc:2,ambM:''};   // structure : part de la carte occupée par les bâtiments (19 novembre 2026)
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
/* Ambiances (21 novembre 2026 ; séparées en deux listes le 22 novembre 2026, demande de l'utilisateur).
   Deux préréglages indépendants, choisis sous la recette, en haut du menu Monde :
   – AMB_MONDE, l'archétype MONDE : commun à toutes les recettes. Il règle la colonne de gauche et elle seule : le terrain
     (eau, montagne, gouffre, herbe), le relief (méthode, remplissage, itérations, grain, regroupement) et le sol sous roche
     des recettes souterraines (cvMont, cvGouf, cvRoc). Il remet d'abord ces réglages à AMB_DEF, puis pose les siens.
   – AMBIANCES[recette], l'archétype BÂTI : propre à chaque recette. Il règle la colonne de droite et elle seule (massif,
     tunnels, complexe, cavernes, bâtiments…) : il la remet à ses valeurs de départ, puis pose les siennes.
   Toucher ensuite à un curseur repasse sur « Personnalisée » la liste de SA colonne seulement.
   RÈGLE (22 novembre 2026) : tout réglage de génération ajouté plus tard va dans l'une des deux colonnes (MONDE_KEYS à gauche,
   « regl » de la recette à droite), et les ambiances de cette colonne doivent lui donner une valeur dès qu'il change leur caractère.
   Les boutons Lab → Niv1/Niv2/Niv3 tirent une ambiance de chaque liste (hasardReglages) ; REGEN relance les réglages en cours. */
const MONDE_KEYS=['eau','montagne','gouffre','herbe','methode','remplissage','iterations','grain','regroupe','cvMont','cvGouf','cvRoc'];
const AMB_DEF={eau:10,montagne:12,gouffre:4,herbe:15,methode:'automate',remplissage:55,iterations:5,grain:65,regroupe:45,cvMont:4,cvGouf:3,cvRoc:2};
/* Quatorze mondes, chacun reconnaissable d'un coup d'œil. Les leviers : ce qui domine (rien, herbe, eau, montagne, gouffre),
   la forme des taches (méthode : « bruit » fait des chaînes et des failles, l'automate des taches ; peu d'itérations avec un fort
   remplissage les déchiquette, beaucoup les arrondit), leur taille (grain) et leur rassemblement (regroupement : 0 éparpillé,
   100 une seule grande région). Le sol sous roche suit le même caractère, à l'échelle plus douce des cavernes. */
const AMB_MONDE={
  poussiere:{n:'Désert de poussière',v:{eau:0,herbe:0,montagne:3,gouffre:0,grain:50,regroupe:0,cvMont:1,cvGouf:0,cvRoc:1}},
  prairie:{n:'Prairie ondoyante',v:{eau:0,herbe:58,montagne:4,gouffre:0,grain:100,regroupe:100,cvMont:1,cvGouf:0,cvRoc:1}},
  bocage:{n:'Bocage',v:{eau:6,herbe:32,montagne:12,gouffre:0,grain:28,regroupe:15,remplissage:55,iterations:4,cvMont:4,cvGouf:0,cvRoc:3}},
  jungle:{n:'Herbes géantes',v:{eau:10,herbe:70,montagne:0,gouffre:0,grain:35,regroupe:0,methode:'mixte',cvMont:0,cvGouf:0,cvRoc:2}},
  archipel:{n:'Archipel',v:{eau:44,herbe:10,montagne:3,gouffre:0,grain:40,regroupe:0,cvMont:1,cvGouf:0,cvRoc:1}},
  lac:{n:'Mer intérieure',v:{eau:40,herbe:8,montagne:4,gouffre:0,grain:100,regroupe:100,cvMont:1,cvGouf:0,cvRoc:1}},
  marais:{n:'Marais',v:{eau:24,herbe:44,montagne:1,gouffre:0,grain:25,regroupe:10,methode:'bruit',cvMont:0,cvGouf:0,cvRoc:0}},
  canyons:{n:'Canyons',v:{eau:0,herbe:4,montagne:6,gouffre:26,grain:80,regroupe:40,methode:'bruit',cvMont:2,cvGouf:9,cvRoc:1}},
  crateres:{n:'Champ de cratères',v:{eau:2,herbe:6,montagne:4,gouffre:18,grain:60,regroupe:0,remplissage:45,iterations:9,cvMont:1,cvGouf:7,cvRoc:2}},
  engloutie:{n:'Terre engloutie',v:{eau:20,herbe:6,montagne:2,gouffre:16,grain:70,regroupe:60,methode:'mixte',cvMont:0,cvGouf:8,cvRoc:1}},
  chaine:{n:'Chaîne de montagnes',v:{eau:4,herbe:8,montagne:40,gouffre:1,grain:100,regroupe:100,methode:'bruit',cvMont:12,cvGouf:1,cvRoc:2}},
  pierrier:{n:'Pierrier',v:{eau:1,herbe:4,montagne:30,gouffre:2,grain:20,regroupe:0,remplissage:65,iterations:2,cvMont:10,cvGouf:1,cvRoc:8}},
  mesas:{n:'Mesas',v:{eau:0,herbe:3,montagne:26,gouffre:3,grain:100,regroupe:0,remplissage:50,iterations:10,cvMont:8,cvGouf:2,cvRoc:3}},
  toundra:{n:'Toundra fracturée',v:{eau:12,herbe:18,montagne:14,gouffre:8,grain:10,regroupe:0,methode:'mixte',remplissage:60,iterations:3,cvMont:6,cvGouf:4,cvRoc:5}}};
/* Archétypes bâtis : la colonne de droite seulement, une dizaine par recette. */
const AMBIANCES={
 atterrissage:{
  forteresse:{n:'Forteresse sous la montagne',v:{zExt:40,zComplexe:68,zTunnels:120,zSalles:1,zSorties:1,zPorte:14,sStyle:'hangar',sVerrous:3,sOuvert:10}},
  dedale:{n:'Dédale de tunnels',v:{zExt:44,zComplexe:20,zTunnels:400,zSalles:8,zSorties:3,zPorte:45,sStyle:'avant'}},
  ruines:{n:'Ruines effondrées',v:{zForme:'coin',zExt:55,zComplexe:58,sStyle:'ruine',sOuvert:70,sSecrets:3,sVerrous:0}},
  poste:{n:'Petit poste isolé',v:{zExt:75,zComplexe:15,zTunnels:140,zSalles:2,zSorties:1,zPorte:25,sStyle:'avant',sPieces:5}},
  mine:{n:'Mine abandonnée',v:{zExt:50,zComplexe:40,zTunnels:330,zSalles:5,zSorties:2,zPorte:38,sStyle:'forage',sVerrous:1}},
  coffre:{n:'Coffre-fort',v:{zExt:60,zComplexe:30,zTunnels:200,zSalles:1,zSorties:1,zPorte:42,sStyle:'forage',sVerrous:3,sSecrets:3,sOuvert:5}},
  falaise:{n:'Falaise',v:{zForme:'cote',zExt:68,zComplexe:45,zTunnels:160,zSalles:2,zSorties:3,zPorte:20,sStyle:'hangar',sOuvert:45}},
  terrier:{n:'Terrier',v:{zForme:'coin',zExt:58,zComplexe:25,zTunnels:380,zSalles:7,zSorties:2,zPorte:30,sStyle:'avant',sOuvert:40}},
  hangars:{n:'Hangars creusés',v:{zExt:48,zComplexe:62,zTunnels:180,zSalles:3,zSorties:2,sStyle:'hangar',sOuvert:60,sVerrous:1}},
  sanctuaire:{n:'Sanctuaire caché',v:{zExt:70,zComplexe:22,zTunnels:260,zSalles:4,zSorties:1,zPorte:45,sStyle:'ruine',sSecrets:3,sOuvert:30}}},
 cavernes:{
  sauvage:{n:'Grottes sauvages',v:{cvDispo:'mel',cvPart:45,cvTaille:300,cvVar:70,cvForme:70,cvBoyaux:3,cvCuls:3,cvBati:1,cvSurf:6,cvPieces:4}},
  cathedrale:{n:'Cathédrale',v:{cvDispo:'cav',cvPart:40,cvTaille:800,cvVar:30,cvEcart:6,cvForme:35,cvLarg:2,cvBoyaux:1,cvCuls:1,cvBati:2,cvSurf:10}},
  termitiere:{n:'Termitière',v:{cvDispo:'mel',cvPart:26,cvTaille:50,cvVar:20,cvEcart:2,cvForme:40,cvSinu:70,cvBoyaux:5,cvCuls:5,cvBati:2,cvSurf:10}},
  cite:{n:'Cité enfouie',v:{cvDispo:'cite',cvPart:18,cvTaille:120,cvBati:4,cvSurf:30,cvPieces:12,cvPortes:2}},
  postes:{n:'Avant-postes',v:{cvDispo:'mel',cvPart:30,cvTaille:160,cvBati:5,cvSurf:12,cvPieces:4,sStyle:'avant'}},
  front:{n:'Front de taille',v:{cvDispo:'cote',cvPart:35,cvTaille:260,cvVar:50,cvBati:3,cvSurf:22,cvPortes:2,sStyle:'forage'}},
  englouties:{n:'Ruines englouties',v:{cvPart:40,cvTaille:260,cvForme:30,cvBati:3,cvSurf:12,sStyle:'ruine',sOuvert:60,sSecrets:3}},
  boyaux:{n:'Dédale de boyaux',v:{cvDispo:'mel',cvPart:15,cvTaille:45,cvVar:30,cvEcart:3,cvSinu:90,cvBoyaux:6,cvCuls:6,cvLarg:1,cvBati:3,cvSurf:8,cvPieces:3}},
  bunker:{n:'Bunker',v:{cvDispo:'cite',cvPart:14,cvTaille:140,cvVar:20,cvBati:1,cvSurf:34,cvPieces:20,cvPortes:1,sStyle:'forage',sVerrous:3,sOuvert:5}},
  dechiquetees:{n:'Grottes déchiquetées',v:{cvPart:46,cvTaille:360,cvForme:95,cvVar:60,cvEcart:2,cvSinu:80,cvBati:1,cvSurf:6}}},
 base:{
  citadelle:{n:'Citadelle',v:{cvDispo:'cite',cvBati:5,cvSurf:42,cvPortes:2,bsTunnels:90,sStyle:'forage',sVerrous:2}},
  ruche:{n:'Ruche',v:{cvDispo:'mel',cvBati:6,cvSurf:36,cvPieces:7,cvPortes:3,bsTunnels:180,bsSalles:3,sStyle:'avant'}},
  ailes:{n:'Deux ailes',v:{cvDispo:'cote',cvBati:2,cvSurf:34,cvPieces:14,cvPortes:2,bsTunnels:120}},
  piege:{n:'Complexe piégé',v:{cvDispo:'cite',cvBati:4,cvSurf:40,bsMachines:220,sVerrous:3,sStyle:'forage',bsTunnels:60}},
  morte:{n:'Base morte',v:{cvDispo:'mel',cvBati:5,cvSurf:34,bsMachines:40,sStyle:'ruine',sOuvert:75,sVerrous:0,sSecrets:3,cvPart:13}},
  mine:{n:'Galeries de mine',v:{cvDispo:'mel',cvBati:4,cvSurf:24,cvPieces:5,bsTunnels:290,bsSalles:5,cvCuls:5,sStyle:'avant'}},
  atrium:{n:'Grand atrium',v:{cvDispo:'cav',cvPart:20,cvTaille:560,cvBati:4,cvSurf:30,sOuvert:60}},
  adossee:{n:'Base adossée',v:{cvDispo:'cote',cvPart:18,cvTaille:500,cvBati:4,cvSurf:32}},
  blockhaus:{n:'Blockhaus',v:{cvDispo:'cite',cvBati:3,cvSurf:40,cvPieces:18,cvPortes:1,sStyle:'forage',sVerrous:3,sOuvert:5,bsTunnels:50,bsSalles:1}},
  hangars:{n:'Hangars de maintenance',v:{cvDispo:'mel',cvBati:4,cvSurf:42,cvPortes:2,sStyle:'hangar',sOuvert:55,bsTunnels:100}}},
 classique:{
  isole:{n:'Avant-poste isolé',v:{structure:5,sNb:1,sStyle:'avant',sPieces:4}},
  citadelle:{n:'Citadelle',v:{structure:46,sNb:1,sStyle:'forage',sEntrees:2,sVerrous:3,sOuvert:10}},
  jumelles:{n:'Bases jumelles',v:{structure:24,sNb:2,sStyle:'avant',sEntrees:1}},
  hangars:{n:'Hangars',v:{structure:30,sNb:2,sStyle:'hangar',sOuvert:60}},
  ruines:{n:'Ruines',v:{structure:16,sStyle:'ruine',sOuvert:80,sSecrets:3,sVerrous:0}},
  hameau:{n:'Hameau',v:{structure:20,sNb:2,sStyle:'avant',sOuvert:50,sEntrees:3}},
  entrepot:{n:'Entrepôt',v:{structure:12,sNb:1,sStyle:'hangar',sEntrees:1}},
  station:{n:'Station de forage',v:{structure:14,sNb:1,sStyle:'forage',sVerrous:2}},
  labyrinthe:{n:'Labyrinthe',v:{structure:55,sNb:1,sStyle:'forage',sOuvert:0,sSecrets:3,sVerrous:2,sEntrees:1}},
  camp:{n:'Camp ouvert',v:{structure:10,sNb:2,sStyle:'avant',sOuvert:90,sVerrous:0,sSecrets:0}}}};
const ambNom=(rec,a)=>((AMBIANCES[rec]||{})[a]||{}).n||'';
const ambMNom=a=>(AMB_MONDE[a]||{}).n||'';
const ambDouble=()=>[ambMNom(GEN.ambM),ambNom(GEN.recette,GEN.amb)].filter(Boolean).join(' · ');   // le nom affiché dans le Statut et à l'arrivée
const R_AMB=rec=>['sel','amb','Archétype bâti',[['','Personnalisé']].concat(Object.keys(AMBIANCES[rec]||{}).map(k=>[k,AMBIANCES[rec][k].n])),''];   // gardé dans « regl » pour être rangé par recette ; affiché en haut du menu, pas dans la colonne
// archétype bâti : la colonne de droite seulement
function ambiance(a,rec){rec=rec||GEN.recette;const A=(AMBIANCES[rec]||{})[a];if(!A)return;
  for(const l of recLignes(rec))if(l[1]!=='amb')GEN[l[1]]=recDef(l);
  Object.assign(GEN,A.v);GEN.amb=a;}
// archétype monde : la colonne de gauche seulement
function ambMonde(a){const A=AMB_MONDE[a];if(!A)return;Object.assign(GEN,AMB_DEF,A.v);GEN.ambM=a;}
// Ce que la dernière carte « cavernes » a donné, sous les réglages (G.obt, rempli par cvBilan)
function obtenuTxt(){const r=n=>Math.round(n),N=SIZES[GEN.taille][0]*SIZES[GEN.taille][1],v=Math.max(1,Math.min(30,Math.round(N*GEN.cvPart/100/Math.max(16,GEN.cvTaille*Math.max(.3,Math.min(1,N/6144))))));
  let s=`Ces réglages visent environ ${v} caverne${v>1?'s':''}.`;const o=typeof G!=='undefined'&&G&&(RECETTES[G.recette]||{}).cavernes&&G.obt;
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
    aide:'Tout est sous roche : la foreuse arrive par un puits. Chaque curseur donne un centre : la carte varie autour à chaque tirage. Le sol des cavernes (eau, herbe, montagne, gouffre, rochers) se règle dans la colonne Monde. '+R_AIDE,
    regl:[R_AMB('cavernes'),
      ['sel','cvDispo','Disposition des zones',[['','Au hasard'],['mel','Mélangée'],['cote','Cavernes d’un côté, bâti de l’autre'],['cite','Cité au centre'],['cav','Cavernes au centre']],'',['mel','cote','cite','cav']],
      ['sub','Cavernes'],['num','cvPart','Part de cavernes (% de la carte)',10,60,32,[22,45]],['num','cvTaille','Taille des cavernes (cases)',30,800,240,[60,450]],
      ['num','cvVar','Variété des tailles (0 : toutes pareilles)',0,100,40,[10,80]],['num','cvEcart','Roche entre deux cavernes (cases)',1,8,3,[2,5]],
      ['num','cvForme','Forme (0 : ronde · 100 : déchiquetée)',0,100,50,[20,80]],
      ['sub','Boyaux'],['num','cvLarg','Largeur des boyaux',1,3,1,[1,2]],['num','cvSinu','Sinuosité',0,100,50,[20,80]],
      ['num','cvBoyaux','Boucles entre cavernes',0,6,2,[0,4]],['num','cvCuls','Culs-de-sac',0,6,2,[0,4]],
      ['sub','Bâtiments'],['num','cvBati','Nombre de bâtiments',1,6,2,[1,4]],['num','cvSurf','Surface bâtie (% de la carte)',5,40,14,[8,24]],
      ['num','cvPieces','Pièces par bâtiment (0 : automatique)',0,25,0],['num','cvPortes','Portes par bâtiment',1,3,1,[1,2]],
      R_STYLE,R_OUVERT,R_VERROUS,R_SECRETS]},
  base:{n:'Niveau 3 : grande base, poches extérieures, tunnels',zones:true,enfoui:true,cavernes:true,base:true,sansVaisseau:true,titre:'Base, poches, tunnels',
    aide:'La foreuse débouche dans une aile de la base. Les ailes sont reliées par un réseau de tunnels ; une ou deux poches de terrain naturel servent d’extérieur. Les salles-machines (lasers, ponts, piles, dépôts) se règlent ici et dans Lab → Artefacts. Chaque curseur donne un centre. '+R_AIDE,
    regl:[R_AMB('base'),['sel','cvDispo','Disposition',[['','Au hasard'],['mel','Ailes et poches mêlées'],['cote','Base d’un côté, poches de l’autre'],['cite','Base au centre'],['cav','Poche au centre']],'cite',['mel','cote','cite']],
      ['sub','Base'],['num','cvBati','Ailes de la base',2,6,5,[4,6]],['num','cvSurf','Surface bâtie (% de la carte)',18,45,38,[32,42]],
      ['num','cvPieces','Pièces par aile (0 : automatique)',0,25,0],['num','cvPortes','Portes par aile',1,3,2,[2,3]],['num','bsMachines','Salles-machines (% de la fréquence du Lab)',0,250,100,[70,160]],
      ['sub','Poches extérieures'],['num','cvPart','Part de la carte (%)',8,22,9,[8,13]],['num','cvTaille','Taille d’une poche (cases)',120,600,320,[240,420]],['num','cvForme','Forme (0 : ronde · 100 : déchiquetée)',0,100,50,[20,80]],
      ['sub','Tunnels'],['num','bsTunnels','Galeries en plus (cases)',0,300,110,[60,200]],['num','bsSalles','Salles de tunnel',0,5,2,[1,4]],
      ['num','cvBoyaux','Boucles entre poches',0,6,1,[0,2]],['num','cvCuls','Culs-de-sac des poches',0,6,2,[0,3]],['num','cvSinu','Sinuosité',0,100,50,[20,80]],
      R_STYLE,R_OUVERT,R_VERROUS,R_SECRETS]},
  classique:{n:'Classique : terrain partout, bâtiments posés dessus',titre:'Structures',aide:R_AIDE,
    regl:[R_AMB('classique'),R_STYLE,['sel','sNb','Nombre de structures',[[0,'Une ou deux'],[1,'Une'],[2,'Deux']],0,[0,1,2]],['num','structure','Surface bâtie (%)',0,70,10,[6,22]],
      R_PIECES,['num','sEntrees','Portes d’entrée',0,4,0],R_OUVERT,R_VERROUS,R_SECRETS]}};
/* Niveau 4, la station noyée (23 novembre 2026) : la carte des cavernes, puis l'eau monte (07h-inonde.js). */
RECETTES.inonde=Object.assign({},RECETTES.cavernes,{n:'Niveau 4 : station noyée',inonde:true,titre:'Station noyée',
  aide:'Les cavernes sont noyées : hauts-fonds près des parois, eau profonde au large, quelques îlots au sec. La foreuse y est lente, torpilles et crabots y nagent. Chaque curseur donne un centre. '+R_AIDE,
  regl:[R_AMB('inonde'),['sub','Eau'],['num','inIles','Îlots au sec (% des cavernes)',5,60,20,[10,45]],['num','inProf','Largeur des hauts-fonds (cases)',1,5,3,[2,4]],...RECETTES.cavernes.regl.slice(1)]});
AMBIANCES.inonde={
  lagune:{n:'Lagune souterraine',v:{cvDispo:'cav',cvPart:48,cvTaille:500,cvVar:40,cvForme:40,cvBati:2,cvSurf:12,inIles:25,inProf:3}},
  citernes:{n:'Citernes',v:{cvDispo:'mel',cvPart:34,cvTaille:160,cvVar:20,cvForme:15,cvBoyaux:3,cvBati:3,cvSurf:16,inIles:10,inProf:2}},
  archipel:{n:'Archipel',v:{cvDispo:'cav',cvPart:55,cvTaille:700,cvForme:60,cvBati:1,cvSurf:8,inIles:45,inProf:3}},
  docks:{n:'Docks engloutis',v:{cvDispo:'cote',cvPart:36,cvTaille:300,cvBati:4,cvSurf:22,cvPortes:2,sStyle:'hangar',inIles:15,inProf:4}}};
if(!RECETTES[GEN.recette])GEN.recette='atterrissage';
const ENFOUI=()=>!!(RECETTES[GEN.recette]||{}).enfoui;
const recLignes=r=>RECETTES[r].regl.filter(l=>l[0]!=='sub');
const recBon=(l,v)=>l[0]==='num'?typeof v==='number'&&v>=l[3]&&v<=l[4]:l[3].some(([o])=>o===v);
const recDef=l=>l[0]==='num'?l[5]:l[4];   // valeur de départ ; ce qui suit est la fourchette dans laquelle le bouton REGEN tire au hasard (rien : réglage laissé tel quel)
// range les réglages de la recette en cours dans GEN.rec
function recRange(){if(!GEN.rec||typeof GEN.rec!=='object')GEN.rec={};const o=GEN.rec[GEN.recette]={};for(const l of recLignes(GEN.recette))o[l[1]]=GEN[l[1]];}
// passe à la recette r : ses valeurs gardées, sinon celles en cours (réglages communs), sinon les valeurs de départ
function recPrend(r){if(!RECETTES[r])r='atterrissage';const s=(GEN.rec&&GEN.rec[r])||{};
  for(const l of recLignes(r)){const k=l[1],d=recDef(l);GEN[k]=recBon(l,s[k])?s[k]:k!=='amb'&&recBon(l,GEN[k])?GEN[k]:d;}   // l'ambiance ne se transmet pas d'une recette à l'autre : deux recettes ont des ambiances de même clé
  GEN.recette=r;}
recPrend(GEN.recette);
/* Tirage au hasard (22 novembre 2026 ; avant : case « Réglages au hasard » sous REGEN, retirée) : un archétype monde et un
   archétype bâti de la recette en cours, tirés chacun dans sa liste. Seuls les boutons Lab → Niv1/Niv2/Niv3 s'en servent ;
   REGEN relance les réglages en cours, la descente aussi. Les curseurs donnant un centre, chaque carte varie déjà autour. */
function hasardReglages(){const m=Object.keys(AMB_MONDE),b=Object.keys(AMBIANCES[GEN.recette]||{});
  ambMonde(m[rnd(0,m.length-1)]);if(b.length)ambiance(b[rnd(0,b.length-1)]);saveGen();buildGen();}
// valeur tirée autour du centre donné par un curseur : centre × (1 ± p)
const autour=(k,p)=>GEN[k]*(1+(Math.random()*2-1)*p);
const setv=(id,v)=>{const e=$(id);if(e)e.value=v;};
function setTaille(v){v=Math.max(1,Math.min(5,Math.round(+v||4)));GEN.taille=v;setv('gr-taille',v);setv('gn-taille',v);
  const e=$('genTaille');if(e)e.textContent=`${SIZES[v][0]} × ${SIZES[v][1]} cases${v===4?' (taille d’origine)':''}. Appliqué au prochain lancement.`;saveGen();}
const saveGen=()=>{recRange();try{localStorage.setItem('np-gen',JSON.stringify(GEN));}catch(e){}touchLocal();};
const SOUS_ROCHE=()=>!!(RECETTES[GEN.recette]||{}).cavernes;   // recettes souterraines : la montagne et le gouffre du sol sont ceux du « sol sous roche »
const GEN_VIS=()=>SOUS_ROCHE()?GEN_LBL.filter(([k])=>k==='eau'||k==='herbe'):GEN_LBL;
const SOL_LBL=[['cvMont','Montagne',15],['cvGouf','Gouffre',10],['cvRoc','Rochers épars',8]];
function setGen(k,v,muet){const others=GEN_VIS().reduce((a,[kk])=>a+(kk===k?0:GEN[kk]),0),mx=GEN_LBL.find(l=>l[0]===k)[2];
  v=Math.max(0,Math.min(mx,GEN_SUM-others,Math.round(+v||0)));GEN[k]=v;setv('gr-'+k,v);setv('gn-'+k,v);if(!muet)persoAmb(k);saveGen();}
function setCA(k,v,mn,mx){v=Math.max(mn,Math.min(mx,Math.round(+v||mn)));GEN[k]=v;setv('gn-'+k,v);persoAmb(k);saveGen();}
function setRel(k,v,mx){v=Math.max(0,Math.min(mx||100,Math.round(+v||0)));GEN[k]=v;setv('gr-'+k,v);setv('gn-'+k,v);persoAmb(k);saveGen();}
function caState(){const off=GEN.methode==='bruit';$('gn-remplissage').disabled=off;$('gn-iterations').disabled=off;}
// La faune se règle par groupes : voir 06b-groupes (19 novembre 2026 ; avant, une intensité par espèce).
// Colonne de droite du menu Monde : les réglages que déclare la recette en cours (20 novembre 2026 ; avant, une liste fixe de « Structures »).
function setS(k,v){const l=recLignes(GEN.recette).find(l=>l[1]===k);if(!l)return;v=Math.max(l[3],Math.min(l[4],Math.round(+v||0)));GEN[k]=v;setv('gr-'+k,v);setv('gn-'+k,v);persoAmb(k);saveGen();}
// un curseur touché : la liste d'archétypes de SA colonne repasse sur « Personnalisé »
function persoAmb(k){if(k==='amb'||k==='ambM'||APPLYING_AMB)return;const m=MONDE_KEYS.includes(k),c=m?'ambM':'amb';
  if(GEN[c]){GEN[c]='';setv('gs-'+c,'');}const o=$('genObt');if(o)o.textContent=obtenuTxt();}
let APPLYING_AMB=false;
const ligneNum=(k,lb,mn,mx,v)=>`<div class="g"><label for="gn-${k}">${lb}</label><input type="range" id="gr-${k}" min="${mn}" max="${mx}" step="1" value="${v}" aria-label="${lb}"><input type="number" id="gn-${k}" min="${mn}" max="${mx}" step="1" value="${v}"></div>`;
/* Haut du menu Monde (22 novembre 2026) : la recette, puis les deux archétypes (monde, bâti) côte à côte. Viennent ensuite,
   dans le balisage, le preset de niveau (enregistrement), le bouton GÉNÉRER LA CARTE, puis les deux colonnes de réglages. */
function buildStruct(){
  recPrend(GEN.recette);const rec=RECETTES[GEN.recette],opt=(v,t,sel)=>`<option value="${v}"${sel===v?' selected':''}>${t}</option>`;
  $('genR').innerHTML=`<label for="gs-recette">Recette de niveau</label><select id="gs-recette">${Object.keys(RECETTES).map(k=>opt(k,RECETTES[k].n,GEN.recette)).join('')}</select>`;
  $('genA').innerHTML=`<label for="gs-ambM">Archétype monde</label><select id="gs-ambM">${opt('','Personnalisé',GEN.ambM||'')}${Object.keys(AMB_MONDE).map(k=>opt(k,AMB_MONDE[k].n,GEN.ambM)).join('')}</select>`
   +`<label for="gs-amb">Archétype bâti</label><select id="gs-amb">${opt('','Personnalisé',GEN.amb||'')}${Object.keys(AMBIANCES[GEN.recette]||{}).map(k=>opt(k,AMBIANCES[GEN.recette][k].n,GEN.amb)).join('')}</select>`;
  $('genSTitre').textContent=rec.titre||'Structures';
  $('genS').innerHTML=rec.regl.map(l=>{const [ty,k,lb]=l;
    if(ty==='sub')return `<div class="sub">${k}</div>`;
    if(k==='amb')return '';
    if(ty==='sel')return `<div class="g2"><label for="gs-${k}">${lb}</label><select id="gs-${k}">${l[3].map(([v,t])=>`<option value="${v}"${GEN[k]===v?' selected':''}>${t}</option>`).join('')}</select></div>`;
    return ligneNum(k,lb,l[3],l[4],GEN[k]);}).join('')
   +(rec.cavernes?`<div class="sum" id="genObt">${obtenuTxt()}</div>`:'')+`<div class="sum">${rec.aide||''}</div>`;
  $('gs-recette').addEventListener('change',e=>{recRange();recPrend(e.target.value);saveGen();buildGen();mondeListe('');$('gs-recette').focus();});
  $('gs-ambM').addEventListener('change',e=>{const v=e.target.value;if(v)ambMonde(v);else GEN.ambM='';saveGen();buildGen();$('gs-ambM').focus();});
  $('gs-amb').addEventListener('change',e=>{const v=e.target.value;if(v)ambiance(v);else GEN.amb='';saveGen();buildGen();$('gs-amb').focus();});
  for(const l of recLignes(GEN.recette)){const k=l[1];if(k==='amb')continue;
    if(l[0]==='sel')$('gs-'+k).addEventListener('change',e=>{const v=e.target.value;GEN[k]=typeof l[4]==='number'?+v:v;persoAmb(k);saveGen();});
    else{$('gr-'+k).addEventListener('input',e=>setS(k,e.target.value));$('gn-'+k).addEventListener('change',e=>setS(k,e.target.value));}}
}
// Colonne de gauche : le monde. Recettes souterraines : la montagne et le gouffre du dehors n'y servent pas, le « sol sous roche » les remplace.
function buildGen(){const sr=SOUS_ROCHE();
  $('gen').innerHTML=`<div class="g"><label for="gn-taille">Taille de la carte</label><input type="range" id="gr-taille" min="1" max="5" step="1" value="${GEN.taille}" aria-label="Taille de la carte, de 1 à 5"><input type="number" id="gn-taille" min="1" max="5" step="1" value="${GEN.taille}"></div><div class="sum" id="genTaille"></div>`
   +(sr?'<div class="sub">Sol des cavernes</div>':'<div class="sub">Terrain</div>')
   +GEN_VIS().map(([k,l,mx])=>ligneNum(k,l+' (%)',0,mx,GEN[k])).join('')
   +(sr?SOL_LBL.map(([k,l,mx])=>ligneNum(k,l+' (%)',0,mx,GEN[k]??AMB_DEF[k])).join(''):'')
   +'<div class="sub">Relief (montagnes et gouffres)</div>'
   +`<div class="g2"><label for="gm">Méthode</label><select id="gm">${METHODS.map(([v,l])=>`<option value="${v}"${GEN.methode===v?' selected':''}>${l}</option>`).join('')}</select></div>`
   +`<div class="g2"><label for="gn-remplissage">Remplissage initial (%)</label><input type="number" id="gn-remplissage" min="35" max="70" value="${GEN.remplissage}"></div>`
   +`<div class="g2"><label for="gn-iterations">Itérations</label><input type="number" id="gn-iterations" min="1" max="10" value="${GEN.iterations}"></div>`
   +[['grain','Grain (0 : émietté · 100 : massif)'],['regroupe','Regroupement par régions']].map(([k,l])=>ligneNum(k,l,0,100,GEN[k])).join('');
  GEN_VIS().forEach(([k])=>{$('gr-'+k).addEventListener('input',e=>setGen(k,e.target.value));$('gn-'+k).addEventListener('change',e=>setGen(k,e.target.value));});
  if(sr)SOL_LBL.forEach(([k,,mx])=>{$('gr-'+k).addEventListener('input',e=>setRel(k,e.target.value,mx));$('gn-'+k).addEventListener('change',e=>setRel(k,e.target.value,mx));});
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
/* Presets de niveau (22 novembre 2026 ; avant, « archétypes de monde ») : la recette, les deux archétypes choisis (monde et
   bâti) et tous les curseurs des deux colonnes, enregistrés sous un nom : MONDES = {nom:{recette,gen:{…}}}, mémorisé sous
   np-mondes. La liste ne montre que les presets de la recette en cours (et ceux d'avant, sans recette). La taille de la carte
   n'est ni enregistrée ni rechargée. */
const mondeDeRec=m=>!m.recette||m.recette===GEN.recette;
function mondeListe(sel){const noms=Object.keys(MONDES).filter(n=>MONDES[n]&&mondeDeRec(MONDES[n])).sort((a,b)=>a.localeCompare(b,'fr')),o=(v,l)=>`<option value="${mdEsc(v)}">${mdEsc(l)}</option>`;
  $('mdSel').innerHTML=o('','— Réglages en cours —')+(noms.length?`<optgroup label="Mes presets">${noms.map(n=>o('u:'+n,n)).join('')}</optgroup>`:'');
  $('mdSel').value=sel||'';if($('mdSel').selectedIndex<0)$('mdSel').value='';}
function mondeMsg(t,err){const m=$('mdMsg');m.textContent=t;m.className='saved'+(err?' err':'');}
// applique un preset : sa recette, puis les réglages des deux colonnes et les deux archétypes (les champs absents gardent leur valeur)
function mondeApplique(m){const gen=m.gen||{};
  if(m.recette&&RECETTES[m.recette]&&m.recette!==GEN.recette){recRange();recPrend(m.recette);}
  for(const k of MONDE_KEYS.concat(recLignes(GEN.recette).map(l=>l[1]),['ambM']))if(gen[k]!=null)GEN[k]=gen[k];
  saveGen();buildGen();}
function mondeCharge(v){
  if(v.startsWith('u:')){const n=v.slice(2),m=MONDES[n];if(!m)return;mondeApplique(m);mondeListe(v);$('mdNom').value=n;mondeMsg(`« ${n} » chargé.`);}
  else mondeMsg('');}
function mondeSave(){const n=$('mdNom').value.trim().replace(/\s+/g,' ');if(!n){mondeMsg('Donnez un nom à ce preset.',true);$('mdNom').focus();return;}
  const g=Object.assign({},GEN);delete g.rec;delete g.taille;
  const neuf=!MONDES[n];MONDES[n]={recette:GEN.recette,gen:g};saveMondes();mondeListe('u:'+n);mondeMsg(neuf?`« ${n} » enregistré.`:`« ${n} » mis à jour.`);}
function mondeDel(){const v=$('mdSel').value;if(!v.startsWith('u:')){mondeMsg('Choisissez un de vos presets dans la liste.',true);return;}
  const n=v.slice(2);delete MONDES[n];saveMondes();mondeListe('');$('mdNom').value='';mondeMsg(`« ${n} » supprimé.`);}
function mondeOpen(){if(TRAV)stopTravel();if(REST)stopRest();if(EXPL)stopExplore();mondeListe($('mdSel').value);mondeMsg('');$('monde').hidden=false;$('monde').querySelector('.mcard').focus();}
// Fenêtre Life : la faune, sortie du menu Monde le 18 novembre 2026
function lifeOpen(){if(TRAV)stopTravel();if(REST)stopRest();if(EXPL)stopExplore();LIFE_NIV=nivBorne(G&&G.niv);buildLife();$('faune').hidden=false;$('faune').querySelector('.mcard').focus();}
function lifeClose(){$('faune').hidden=true;$('lifeBtn').focus();render();}
$('lifeBtn').onclick=lifeOpen;$('lfClose').onclick=lifeClose;
$('faune').addEventListener('pointerdown',ev=>{if(ev.target===$('faune'))lifeClose();});
function mondeClose(){$('monde').hidden=true;$('mondeBtn').focus();render();}
$('mondeBtn').onclick=mondeOpen;$('mdClose').onclick=mondeClose;$('mdSave').onclick=mondeSave;$('mdDel').onclick=mondeDel;
$('mdSel').addEventListener('change',e=>mondeCharge(e.target.value));
$('essaiBtn').onclick=()=>{$('monde').hidden=true;unlock();SFX.start();newGame();started=true;$('overlay').hidden=true;render();};   // les réglages en cours, tels quels
$('mdNom').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();mondeSave();}});
$('monde').addEventListener('pointerdown',ev=>{if(ev.target===$('monde'))mondeClose();});
