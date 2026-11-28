/* Règles de survie (28 novembre 2026, chantier « Survie », bloc B : valeurs arbitrées par l'utilisateur). Une constante par règle.
   Fuel : jauge qui baisse en permanence ; à sec, la coque se dégrade et rien ne la répare plus. Vie : remonte seule, lentement en
   marche, vite au repos (à l'arrêt, en passant un tour). Lus par 08-faune (survieTick), 07 (gisements, descente), 09 (éclats,
   forage), 12 (repos), 14d (cellule de fuel, Module de puissance), 14g (SYMBIOSE), 11 (jauge). */
const REGLES={
  FUEL_MAX:100,            // jauge de fuel : maximum, et plein au départ
  FUEL_BAISSE_BAT:12,      // −1 de fuel tous les 12 battements, en permanence
  SEC_PERTE_BAT:5,         // à sec : −1 de vie tous les 5 battements
  FUEL_ALERTE:.25,         // alerte (jauge, journal, fin du repos) sous 25 % du maximum
  FUEL_ECLATS:[0,15,20,25],// éclats de métal ramassés : fuel selon la densité (petits, moyens, gros)
  FUEL_GISEMENTS:4,        // gisements d'éclats de métal par carte, quelle que soit sa taille
  FUEL_CELLULE:30,         // cellule de fuel (consommable)
  FUEL_DESCENTE:30,        // chaque descente rend du fuel
  VIE_MARCHE_BAT:20,       // +1 de vie tous les 20 battements en marche (même en combat)
  VIE_REPOS_BAT:4,         // +1 de vie tous les 4 battements au repos (à l'arrêt, un tour passé)
  REPOS_MAX:600,           // bouton REPOS : garde-fou, battements d'affilée au plus
  REPARO_POIDS:2,          // réparobots dans le butin (poids parmi les capsules ; 5 jusqu'au 28 novembre 2026)
  FORAGE_ENERGIE:5,        // énergie d'un coup de foreuse sur la roche (10 jusqu'au 28 novembre 2026)
  COURSE_ENERGIE:5,        // énergie d'un pas de course
  MODULE_VIE_MAX:10,       // Module de puissance : vie maximale en plus (la vie courante monte d'autant)
  SYMB_VIE:2,              // hack SYMBIOSE : récupération de vie multipliée
  SYMB_FUEL:1.5,           // hack SYMBIOSE : baisse du fuel multipliée
  /* Ennemis moins nombreux, plus dangereux (bloc C du chantier survie, 28 novembre 2026). Une valeur par niveau (1, 2, 3),
     appliquée PAR-DESSUS les réglages du joueur (groupes, budgets par niveau, bestiaire : rien n'est réécrit). Voir menaceNb,
     menaceDeg, degReels (plus bas) et spawnGroupes (08-faune). */
  // Recalés au pilote (docs/mesures.md, « Survie C ») depuis 0,6 / 1,6 partout : aux niveaux 2 et 3, 0,4 garde le prudent en vie
  // sans baisser les dégâts ; au niveau 1, 1,4 (à 2,0, le prudent meurt une fois sur deux dès l'Astroport).
  MENACE_NB:[.6,.4,.4],    // part des groupes hostiles (gardes, sans rôle) achetés qui sont posés ; les ferrailleuses restent toutes
  MENACE_DEG:[1.4,1.6,1.6]};// dégâts des créatures (coups, tirs, explosions de mines) multipliés ; lasers et pièges des machines inchangés
/* Numéro d'unité (28 novembre 2026, histoire : chaque partie est l'unité suivante). F467 à la première partie, puis +1 à chaque
   destruction de la foreuse (pas à une partie recommencée). Gardé dans np-unite (et dans la base de l'artefact, avec le journal de
   bord : 14l-histoire.js). NOM_FOREUSE est VIVANT : il change au début d'une partie (uniteApplique, 14l) ; les textes construits au
   chargement (rôles des BEASTS, descriptions des objets, aides) sont réécrits à ce moment-là. */
let UNITE_NUM=467;try{const v=parseInt(localStorage.getItem('np-unite')||'',10);if(v>=467&&v<100000)UNITE_NUM=v;}catch(e){}
let NOM_FOREUSE='F'+UNITE_NUM; // nom de l'unité, utilisé dans les messages du journal
let W=96,H=64;const NSITES=1,S=32;   // un seul site de forage par carte (13 novembre 2026)
// Taille de la carte : réglage « Taille » de Génération, de 1 à 5 ; 4 = la taille d'origine (96 × 64)
const SIZES=[null,[32,22],[48,32],[72,48],[96,64],[144,96]];
function setSize(n){const s=SIZES[n]||SIZES[4];W=s[0];H=s[1];F=W/96;}
// Échelle de génération : 1 pour une planète de 96 × 64 (taille actuelle) ; les tailles de relief, lacs et distances suivent
let F=W/96;const SZ=(v,mn)=>Math.max(mn||2,Math.round(v*F));
// 23 à 30 : machines (07f-machines)
// SECRET = porte dérobée : en tout point un mur, jusqu'à ce qu'on la découvre en se reposant à côté
// LOCK = porte verrouillée (19 novembre 2026) : un mur tant qu'on n'a pas de clé
const GROUND=0,ROCK=1,MOUNT=2,LIQ=3,GRASS=4,FLAT=5,DEEP=6,CHASM=7,BRIDGE=8,RUBBLE=9,LOW=10,SHIP=11,DECK=12,HARD=13,WALL=14,FLOOR=15,DOOR=16,
  PILLAR=17,LOCK=18,SECRET=19,MACHINE=20,ANTENNA=21,TERMINAL=22,TURRET=23,PYLON=24,PILE=25,FABRIC=26,LEVIER=27,GRILLE=28,
  STATION=29,CHARGEUR=30,VITRE=31;
// VITRE = mur vitré (24 novembre 2026) : infranchissable comme un mur, mais on voit au travers (des deux côtés). Posé par les modules.
// Bâtiments (18 novembre 2026) : WALL = mur bâti, FLOOR = sol bâti, DOOR = porte (fermée tant que personne n'est dessus), PILLAR = pilier.
// Murs et piliers : infranchissables, opaques, et la foreuse ne les entame pas ; seules une charge sismique ou l'explosion d'une mine les ouvrent.
const bati=v=>v===WALL||v===PILLAR||v===LOCK||v===SECRET;
// HARD = roche dure (16 novembre 2026) : au cœur des massifs, impossible à creuser ; seule la charge sismique en vient à bout.
// FLAT = herbes basses (13 novembre 2026 : les herbes couchées et les herbes basses n'en font plus qu'une).
// LOW n'est plus produit ; il ne sert qu'à convertir une partie commencée avant ce changement.
/* LA DESCENTE, NIVEAU PAR NIVEAU (23 novembre 2026). C'est LA table à allonger pour ajouter un niveau : tout le reste du jeu
   (groupes et budget par niveau, artefacts par niveau, fenêtre LIFE, boutons du Lab, butin, fin de partie) lit NIV_MAX et NIVS.
   recette : la recette de carte du niveau (06-reglages.js, 07-generation.js) ; part : où naissent les groupes, en % du budget. */
/* taille : la taille de la carte du niveau en jeu (SIZES ; 28 novembre 2026 : 4 pour l'Astroport, 3 ensuite). Le curseur
   « Taille » du menu Monde ne vaut plus que pour GÉNÉRER LA CARTE et les outils d'essai.
   dens : le budget de menace du niveau (fenêtre LIFE) est compté sur cette part de la surface : l'Astroport, deux fois plus grand
   qu'une carte de taille 3, n'a pas deux fois plus d'ennemis (moins d'ennemis, plus dangereux). */
const NIVEAUX=[null,
  {recette:'atterrissage',part:{ext:75,bati:20,tunnel:5},taille:4,dens:.55},
  {recette:'cavernes',part:{ext:80,bati:18,tunnel:2},taille:3},
  {recette:'base',part:{ext:35,bati:60,tunnel:5},taille:3}];
const NIV_MAX=NIVEAUX.length-1,NIVS=NIVEAUX.map((_,i)=>i).slice(1),nivBorne=n=>Math.max(1,Math.min(NIV_MAX,n||1));
/* Multiplicateurs de menace du niveau n (REGLES.MENACE_NB, REGLES.MENACE_DEG). Niveau 0 : dégâts de base (banc de combat, mesures
   de la valeur des groupes). degReels : la fourchette de dégâts d'une espèce telle qu'elle frappe au niveau n (G.niv par défaut) ;
   dmgDe (07-generation) tire dedans, et les fiches (survol, journal de bord, Bestiaire) l'affichent. */
const menaceVal=(v,n)=>{const x=Array.isArray(v)?v[nivBorne(n)-1]:v;return typeof x==='number'&&isFinite(x)&&x>0?x:1;};
const menaceNb=n=>Math.min(1,menaceVal(REGLES.MENACE_NB,n));
const menaceDeg=n=>n===0?1:menaceVal(REGLES.MENACE_DEG,n);
const degReels=(sp,n)=>{const k=menaceDeg(n===undefined?(typeof G!=='undefined'&&G?G.niv:1):n);
  return [Math.round(sp.dmin*k),Math.round(sp.dmax*k)];};
const RECETTE_NIV=n=>NIVEAUX[nivBorne(n)].recette,   // la recette de chaque niveau de la descente
  NIV_RECETTE=r=>Math.max(1,NIVEAUX.findIndex(v=>v&&v.recette===r));   // et l'inverse (recette « classique » : niveau 1)
const DIRN=['est','ouest','sud','nord','sud-est','nord-est','sud-ouest','nord-ouest'];
// (la table STATS de la colonne a disparu avec le sous-menu Statistiques, le 15 novembre 2026)
let VISEE=null;   // visée d'une charge sismique en cours : {i, x, y} — voir 14-inventaire.js
/* Visée longue du phaseur (26 novembre 2026) : {x, y} — la foreuse est démontée, on choisit où elle se reforme, n'importe où
   sur le terrain déjà découvert. La vue suit le viseur (10-rendu), qui n'est donc plus borné à VISEE_R cases. Voir 14d-objets.js. */
let PHASE=null;
// Visée de l'arme de tir (28 novembre 2026, bloc D) : {x, y} — case visée ; voir 14m-tir.js
let TIR=null;
const CRIT_X=3;   // dégâts d'un coup critique
const $=id=>document.getElementById(id);
// Horodatage de la dernière retouche faite dans ce navigateur (palettes, tuiles, génération, faune, bestiaire) :
// au chargement, les réglages de la base ne remplacent les réglages locaux que s'ils sont plus récents.
let APPLYING=false,BOOT=true;   // BOOT : les sauvegardes faites pendant le démarrage ne comptent pas comme des retouches
const touchLocal=()=>{if(APPLYING||BOOT)return;try{localStorage.setItem('np-maj',String(Date.now()));}catch(e){}};
const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const idx=(x,y)=>y*W+x;
const DIRS=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const LETTERS='ABCDE';
/* Cadence des animations (26 novembre 2026) : 20 images par seconde partout (effets, fumée, explosions, cinématiques), au
   lieu du rythme du navigateur (60, plus sur un écran rapide). Chaque image redessine beaucoup : trois fois moins
   d'images, trois fois moins de dessin. Les animations suivent l'horloge, pas le nombre d'images : leur durée ne change
   pas. raf20(f) remplace requestAnimationFrame(f) : il laisse passer les images trop rapprochées. */
const FPS=30;   // 30 images par seconde depuis le 28 novembre 2026 (demande du joueur : 20 paraissait saccadé)
function raf20(cb){return requestAnimationFrame(function attend(now){
  if(now-(cb._img||0)<1000/FPS-4){requestAnimationFrame(attend);return;}cb._img=now;cb(now);});}

