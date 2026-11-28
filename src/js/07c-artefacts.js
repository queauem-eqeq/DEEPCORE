/* ---------- Artefacts (20 novembre 2026) ----------
   Des systèmes qui viennent se greffer sur chaque carte, à l'intérieur des bâtiments. Chacun s'active ou se coupe pour la
   génération, et a une fréquence sur trois crans [− = +] (Lab → Artefacts, mémorisé sous np-artefacts).
   1. Antenne   : la foreuse l'active en avançant dessus ; elle s'allume pour de bon et tient en vue un disque de 30 cases de
                  large autour d'elle : le brouillard n'y revient pas (antVis).
   2. Herbe     : des pièces entièrement envahies d'herbes, hautes et basses mêlées.
   3. Machines  : dix machines hors d'usage, posées en obstacles dans certaines pièces. Elles barrent le pas mais pas la vue
                  (au contraire des piliers). Une charge sismique les réduit en gravats.
   4. Terminal  : la foreuse l'active en avançant dessus ; il ouvre le menu DATA / CONNEXION / ENCODAGE (07i-terminaux).
   Terrains : MACHINE, ANTENNA, TERMINAL (00-base). G.art[case] : la variante d'une machine, l'état d'une antenne (1 = allumée),
   le texte d'un terminal. Posés par artefacts(), appelé à la fin de la génération des bâtiments. */
const ART_LISTE=[['antenne','Antenne','Au contact, un menu DATA / CONNEXION : sa connexion lève le brouillard 15 tours sur un disque de 30 cases, puis y signale les ennemis par un point rouge.',[.5,1,2]],
  ['herbe','Pièces envahies d’herbe','Des pièces remplies d’herbes hautes et basses mêlées.',[.08,.18,.35]],
  ['machines','Machines','Dix machines hors d’usage posées en obstacles : elles barrent le pas, pas la vue.',[.15,.35,.6]],
  ['terminal','Terminal','Au contact, un menu DATA / CONNEXION / ENCODAGE : une donnée, des portes, lasers ou pièces secrètes proches, la liaison au noyau. Deux au moins par niveau.',[1,2,4]],
  // machines (21 novembre 2026, 07f-machines) : nombre de salles par carte dans la grande base ; un tiers ailleurs (le fabricateur : partout pareil)
  ['lasers','Tourelles laser','Des tourelles encastrées dans un mur balaient la pièce par bandes. Aucun avertissement : chaque bande a son rythme.',[1,2,4]],
  ['croix','Croix laser','Un champ de pylônes qui éclairent leurs quatre cases voisines, chacun à son rythme.',[1,2,3]],
  ['ponts','Ponts à levier','Un gouffre prend presque toute la salle ; le levier, au pied du pont, le déploie. Passage obligé, ou cul-de-sac avec butin.',[.5,1.5,3]],
  ['piles','Piles, socles et dépôts','Une grille d’énergie garde un dépôt ; son socle est devant. La pile attend près de son distributeur, dans la pièce voisine.',[.5,1.5,3]],
  ['pieges','Salles piégées','Un butin au milieu de la pièce, des relais cachés dans les murs : ils surgissent quand on le ramasse.',[.5,1,2]],
  ['vitrines','Vitrines','Une petite pièce en cul-de-sac, trois lots sous vitrine : on n’en emporte qu’un.',[.4,1,2]],
  ['station','Station de réparation','Vie et énergie au maximum, une seule fois. Le bruit attire les ennemis proches.',[.3,.7,1.2]],
  ['fabric','FABLAB','Fabrique des objets contre de la Matière {µ}.',[.5,1,2]]];
// réglage du joueur, relu le 21 novembre 2026 à 23 h 39 (croix laser désactivée, machines en fréquence normale)
const ARTEFACTS_DEF=()=>({antenne:{on:1,f:1},herbe:{on:1,f:1},machines:{on:1,f:1},terminal:{on:1,f:1},lasers:{on:1,f:1},croix:{on:0,f:1},ponts:{on:1,f:1},piles:{on:1,f:1},pieges:{on:1,f:1},vitrines:{on:1,f:1},station:{on:1,f:1},fabric:{on:1,f:1}});
/* Niveaux de profondeur où un artefact peut apparaître (21 novembre 2026, réglé dans la fenêtre LIFE). Départ : les lasers à partir
   du niveau 2, les croix au niveau 3, les piles à partir du niveau 2, tout le reste partout. */
const ART_NIV_DEF={lasers:[2,3],croix:[3],piles:[2,3],pieges:[2,3],fabric:[2,3],ponts:[3],station:[3]},ART_NIVS=NIVS;
function artefactsSains(d){const o=ARTEFACTS_DEF();for(const [k] of ART_LISTE)o[k].niv=(ART_NIV_DEF[k]||ART_NIVS).slice();
  if(d&&typeof d==='object')for(const [k] of ART_LISTE)if(d[k]){o[k].on=d[k].on?1:0;o[k].f=[0,1,2].includes(+d[k].f)?+d[k].f:1;
    if(Array.isArray(d[k].niv))o[k].niv=ART_NIVS.filter(n=>d[k].niv.includes(n));}return o;}
// l'artefact est-il permis sur la carte en cours de génération ? (actif dans le Lab, et permis à ce niveau)
const artOn=k=>{const a=ARTEFACTS[k];return !!(a&&a.on&&(!a.niv||a.niv.includes(nivBorne(typeof NIV_GEN==='number'?NIV_GEN:1))));};
let ARTEFACTS=artefactsSains(null);
try{ARTEFACTS=artefactsSains(JSON.parse(localStorage.getItem('np-artefacts')||'null'));}catch(e){}
function saveArtefacts(){try{localStorage.setItem('np-artefacts',JSON.stringify(ARTEFACTS));}catch(e){}touchLocal();}
// sélecteur de fréquence à trois crans, partagé avec la fenêtre Groupes
const freqHtml=(v,nom)=>`<span class="freq" role="group" aria-label="Fréquence : ${nom}">${[['−','rare'],['=','normale'],['+','fréquente']].map(([s,l],i)=>`<button data-fq="${i}" aria-pressed="${i===v}" aria-label="Fréquence ${l}" title="Fréquence ${l}">${s}</button>`).join('')}</span>`;

/* Textes des terminaux : des fragments de journal laissés par ceux qui ont bâti ces structures. Un terminal garde le sien. */
const TERM_TXT=[
  ['Journal de forage · entrée 114','Le trépan a calé à 2 300 mètres. La roche du cœur ne cède à rien de ce que nous avons apporté. Demande de charges sismiques transmise à l’orbiteur. Pas de réponse depuis neuf jours.'],
  ['Note de service','Rappel à tout le personnel : les portes se referment seules. Ne laissez rien dans l’embrasure, et surtout pas vous. La maintenance ne viendra plus avant la relève.'],
  ['Relevé de l’antenne','Signal propre sur vingt cases, puis plus rien. Quelque chose brouille la surface au-delà. Les relais reviennent toujours par le même chemin : ils se parlent, nous en sommes sûrs maintenant.'],
  ['Inventaire · réserve 3','Réparobots : 2. Batteries : 2. Fumigènes : 2. Charges : 2. Clés : une de moins que de serrures, comme d’habitude. Celui qui a fermé la réserve du fond est prié de se signaler.'],
  ['Message non envoyé','Les machines du dehors ne sont pas hostiles tant qu’on ne les regarde pas. Elles font leur ronde. Nous avons appris les horaires. Hier, l’une d’elles a changé d’itinéraire.'],
  ['Consigne de sécurité','En présence d’une mine : ne restez pas à côté. Elle clignote avant d’exploser. Trois battements, parfois moins. Comptez en reculant.'],
  ['Journal personnel','Les herbes ont gagné la salle des cuves. Personne ne sait d’où viennent les graines. On s’y cache bien, cela dit. Les sentinelles ne tirent pas sur ce qu’elles ne voient pas.'],
  ['Dernière entrée','Le noyau est plus près qu’on ne le pensait. Le site est derrière la dernière porte. Nous laissons '+NOM_FOREUSE+' suivante finir le travail.']];

// une case de pièce où poser un obstacle sans rien couper : pas devant un passage, et les cases praticables autour d'elle restent d'un seul tenant
function artLibre(B,i,site){const t=G.t;if(t[i]!==FLOOR||G.cles[i]||i===site||(G.art&&G.art[i]!=null))return false;const x=i%W,y=(i/W)|0;
  if(x===G.px&&y===G.py)return false;
  for(const [dx,dy] of D4){const j=idx(x+dx,y+dy),v=t[j];if(v===DOOR||v===LOCK||v===SECRET||B.porte[j])return false;}
  const ring=[[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]].map(([dx,dy])=>!blocks(t[idx(x+dx,y+dy)]));let runs=0;
  for(let k=0;k<8;k++)if(ring[k]&&!ring[(k+7)%8])runs++;
  return runs===1||ring.every(Boolean);}
function artefacts(B,strs){G.art={};const A=ARTEFACTS,t=G.t,site=G.sites&&G.sites[0]?idx(G.sites[0].x,G.sites[0].y):-1;
  const pieces=[];for(const S of strs)for(const p of S.pieces)if(p.g!=='couloir'&&p.c.length>=9)pieces.push(p);if(!pieces.length)return;
  const fq=k=>ART_LISTE.find(a=>a[0]===k)[3][A[k].f],mel=()=>pieces.slice().sort(()=>Math.random()-.5),
    murV=i=>D4.some(([dx,dy])=>t[idx(i%W+dx,((i/W)|0)+dy)]===WALL);
  const compte=n=>Math.floor(n)+(Math.random()<n-Math.floor(n)?1:0);
  // pose un obstacle dans une pièce, de préférence contre un mur ; renvoie la case, ou -1
  const pose=(p,terrain,val,mur)=>{const c=p.c.filter(i=>artLibre(B,i,site));if(!c.length)return -1;
    const m=c.filter(murV),l=mur&&m.length?m:c,i=l[rnd(0,l.length-1)];t[i]=terrain;G.art[i]=val;return i;};
  G.artN={antenne:0,herbe:0,machines:0,terminal:0};
  // 2. herbe : la pièce entière, hautes et basses mêlées par petites touffes (le site et les clés gardent leur sol)
  if(artOn('herbe')){const pris=mel().filter(p=>!p.c.includes(site)).slice(0,compte(pieces.length*fq('herbe')));
    for(const p of pris){const g=Math.random()*10,h=Math.random()*10;p.herbe=1;G.artN.herbe++;
      // sous une clé : de la terre nue, pas la dalle du bâtiment (22 novembre 2026)
      for(const i of p.c)if(t[i]===FLOOR&&i!==site){const x=i%W,y=(i/W)|0;
        t[i]=G.cles[i]?FLAT:Math.sin(x*.9+g)+Math.cos(y*1.1+h)+Math.random()*.9>.45?GRASS:FLAT;}}}
  const libres=()=>mel().filter(p=>!p.herbe);
  // 1. antenne et 4. terminal : un par pièce, contre un mur si possible
  if(artOn('antenne')){let n=compte(fq('antenne'));for(const p of libres()){if(n<=0)break;if(pose(p,ANTENNA,0,true)>=0){n--;p.ant=1;
    G.artN.antenne++;}}}
  if(artOn('terminal')){let n=compte(fq('terminal')),k=rnd(0,TERM_TXT.length-1);for(const p of libres()){if(n<=0)break;if(p.ant)continue;
    if(pose(p,TERMINAL,k%TERM_TXT.length,true)>=0){n--;k++;G.artN.terminal++;}}}
  // 3. machines : une à cinq par pièce choisie, selon sa taille
  if(artOn('machines')){const pris=libres().slice(0,compte(pieces.length*fq('machines')));
    for(const p of pris){let n=Math.max(1,Math.min(5,Math.round(p.c.length/14)));
      for(let k=0;k<n;k++)if(pose(p,MACHINE,rnd(0,9),Math.random()<.7)>=0)G.artN.machines++;}}}

// la foreuse avance sur une antenne : elle s'allume et lève le brouillard autour d'elle
const ANT_R=15;
/* Allumage (22 novembre 2026) : le disque se découvre en une seconde, anneau par anneau — les cases à 1 de l'antenne, puis à 2,
   à 3… jusqu'au bord, au rythme du cercle qui s'étend. ANT_ANIM[case] = instant de l'allumage, le temps de l'animation
   (fxLoop rappelle antVis à chaque image). Mouvement réduit : tout d'un coup, comme avant. */
const ANT_DUR=1000,ANT_ANIM={};
const antAnime=()=>{for(const k in ANT_ANIM)return true;return false;};
/* 22 novembre 2026 (choix de l'utilisateur) : l'antenne ne lève le brouillard que ANT_TOURS tours (G.antFin[case] = tour de fin).
   Ensuite le brouillard revient sur son disque, mais elle continue de détecter : tout ennemi dans le disque se montre par un
   point en couleur danger, sur la carte et la mini-carte (antDetecte). G.art[case] : 1 = disque en vue, 2 = détection seule. */
const ANT_TOURS=15;
const antDetecte=o=>{if(!G.art)return false;for(const k in G.art){const i=+k,e=G.art[k];if((e!==1&&e!==2)||G.t[i]!==ANTENNA)continue;
  const dx=o.x-i%W,dy=o.y-((i/W)|0);if(dx*dx+dy*dy<=ANT_R*ANT_R+ANT_R)return true;}return false;};
function antVis(){if(!G.art)return;const now=performance.now();for(const k in G.art){const i=+k;if(G.art[k]!==1||G.t[i]!==ANTENNA)continue;
  const x=i%W,y=(i/W)|0;
  if(G.antFin&&G.antFin[i]!=null&&G.turn>=G.antFin[i]){G.art[k]=2;delete G.antFin[i];
    sayMore('L’antenne cesse d’éclairer la zone : le brouillard revient, mais elle signale toujours les ennemis (points rouges).','info');continue;}
  // anneau r : les cases à moins de r de distance
  let R2=ANT_R*ANT_R+ANT_R;if(ANT_ANIM[i]!=null){const p=(now-ANT_ANIM[i])/ANT_DUR;if(p>=1||reduced)delete ANT_ANIM[i];
    else{const r=Math.floor(p*(ANT_R+1))+1;R2=Math.min(R2,r*r);}}
  for(let dy=-ANT_R;dy<=ANT_R;dy++)for(let dx=-ANT_R;dx<=ANT_R;dx++){const a=x+dx,b=y+dy;if(a<0||b<0||a>=W||b>=H||dx*dx+dy*dy>R2)continue;
    const j=idx(a,b);vis[j]=1;G.seen[j]=1;}}}
/* 28 novembre 2026 : la foreuse qui avance sur une antenne ou un terminal ouvre le menu DATA / CONNEXION / ENCODAGE (07i-terminaux).
   L'allumage de l'antenne est l'action RÉSEAU DU SITE de ce menu : antAllume (l'effet, renvoie le nombre de cases découvertes) et
   antAnime0 (le cercle et l'anneau qui s'étend, joués à la fermeture de la fenêtre). */
function antAllume(i){G.art=G.art||{};const x=i%W,y=(i/W)|0;
  G.art[i]=1;(G.antFin=G.antFin||{})[i]=G.turn+1+ANT_TOURS;let n=0;
    for(let dy=-ANT_R;dy<=ANT_R;dy++)for(let dx=-ANT_R;dx<=ANT_R;dx++){const a=x+dx,b=y+dy;
    if(a<0||b<0||a>=W||b>=H||dx*dx+dy*dy>ANT_R*ANT_R+ANT_R)continue;if(!G.seen[idx(a,b)])n++;}
  SFX.sonar(.7);
  say(`L’antenne s’allume : ${n?`${n} cases apparaissent sur la carte`:'la zone alentour est en vue'} pendant ${ANT_TOURS} tours. Ensuite elle signalera encore les ennemis.`,'good');
  return n;}
function antAnime0(i){if(!reduced)ANT_ANIM[i]=performance.now();addFx({kind:'sonar',ant:1,x:i%W,y:(i/W)|0,r:ANT_R+1,dur:reduced?1:ANT_DUR});}
function antenneUse(i){termOuvre(i);}
function terminalUse(i){termOuvre(i);}

// Fenêtre Lab → Artefacts
function buildArtefacts(){const n=G&&G.artN;
  $('artList').innerHTML=ART_LISTE.map(([k,nom,d])=>`<div class="artl${ARTEFACTS[k].on?'':' inactif'}" data-k="${k}">
    <input type="checkbox" id="art-${k}"${ARTEFACTS[k].on?' checked':''}><label for="art-${k}"><b>${nom}</b><span>${d}${n?` Sur cette carte : ${n[k]||0}.`:''}</span></label>${freqHtml(ARTEFACTS[k].f,nom)}</div>`).join('');}
function openArtefacts(){if(TRAV)stopTravel();if(REST)stopRest();if(EXPL)stopExplore();buildArtefacts();$('artefacts').hidden=false;
  $('artefacts').querySelector('.mcard').focus();}
function closeArtefacts(){$('artefacts').hidden=true;$('artBtn').focus();render();}
$('artBtn').onclick=openArtefacts;$('artClose').onclick=closeArtefacts;
$('artefacts').addEventListener('pointerdown',ev=>{if(ev.target===$('artefacts'))closeArtefacts();});
$('artList').addEventListener('change',e=>{const r=e.target.closest('.artl');if(!r||e.target.type!=='checkbox')return;ARTEFACTS[r.dataset.k].on=e.target.checked?1:0;saveArtefacts();buildArtefacts();const c=$('art-'+r.dataset.k);if(c)c.focus();});
$('artList').addEventListener('click',e=>{const b=e.target.closest('button[data-fq]');if(!b)return;const k=b.closest('.artl').dataset.k;ARTEFACTS[k].f=+b.dataset.fq;saveArtefacts();buildArtefacts();
  const n=$('artList').querySelector(`.artl[data-k="${k}"] button[data-fq="${b.dataset.fq}"]`);if(n)n.focus();});
