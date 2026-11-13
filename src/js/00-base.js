const W=96,H=64,NSITES=5,S=32;
// Échelle de génération : 1 pour une planète de 96 × 64 (taille actuelle) ; les tailles de relief, lacs et distances suivent
const F=W/96,SZ=(v,mn)=>Math.max(mn||2,Math.round(v*F));
const GROUND=0,ROCK=1,MOUNT=2,LIQ=3,GRASS=4,FLAT=5,DEEP=6,CHASM=7,BRIDGE=8,RUBBLE=9,LOW=10,SHIP=11,DECK=12;
// FLAT = herbes basses (13 novembre 2026 : les herbes couchées et les herbes basses n'en font plus qu'une).
// LOW n'est plus produit ; il ne sert qu'à convertir une partie commencée avant ce changement.
const TNAME=['sol rocheux','rocher','montagne','liquide','herbes hautes','herbes basses','eau profonde','gouffre','pont','gravats','(inutilisé)','coque du vaisseau','soute du vaisseau'];
const DIRN=['est','ouest','sud','nord','sud-est','nord-est','sud-ouest','nord-ouest'];
const STATS=[['vitesse','VIT','Vitesse'],['capteur','EYE','Portée capteur'],['degats','DEG','Dégâts'],['pre','PRE','Précision'],['esq','ESQ','Esquive (modifiée par le terrain)'],['crit','CRIT','Chance de coup critique (×3 dégâts) ; un coup par surprise est toujours critique'],['power','POW','Power : énergie rechargée par tour'],['stealth','DIS','Portée de discrétion : rayon où un ennemi en vue a 25 % par tour de vous remarquer (touche V)'],['nul2','NUL','Emplacement libre']];
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

