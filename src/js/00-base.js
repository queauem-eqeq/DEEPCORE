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
const NIVEAUX=[null,
  {recette:'atterrissage',part:{ext:75,bati:20,tunnel:5}},
  {recette:'cavernes',part:{ext:80,bati:18,tunnel:2}},
  {recette:'base',part:{ext:35,bati:60,tunnel:5}}];
const NIV_MAX=NIVEAUX.length-1,NIVS=NIVEAUX.map((_,i)=>i).slice(1),nivBorne=n=>Math.max(1,Math.min(NIV_MAX,n||1));
const RECETTE_NIV=n=>NIVEAUX[nivBorne(n)].recette,   // la recette de chaque niveau de la descente
  NIV_RECETTE=r=>Math.max(1,NIVEAUX.findIndex(v=>v&&v.recette===r));   // et l'inverse (recette « classique » : niveau 1)
const DIRN=['est','ouest','sud','nord','sud-est','nord-est','sud-ouest','nord-ouest'];
// (la table STATS de la colonne a disparu avec le sous-menu Statistiques, le 15 novembre 2026)
let VISEE=null;   // visée d'une charge sismique en cours : {i, x, y} — voir 14-inventaire.js
/* Visée longue du phaseur (26 novembre 2026) : {x, y} — la foreuse est démontée, on choisit où elle se reforme, n'importe où
   sur le terrain déjà découvert. La vue suit le viseur (10-rendu), qui n'est donc plus borné à VISEE_R cases. Voir 14d-objets.js. */
let PHASE=null;
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
const FPS=20;
function raf20(cb){return requestAnimationFrame(function attend(now){
  if(now-(cb._img||0)<1000/FPS-4){requestAnimationFrame(attend);return;}cb._img=now;cb(now);});}

