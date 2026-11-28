/* ---------- Objets : butin, noms de code, visée, plans (22 novembre 2026) ----------
   1. Rien au départ : la foreuse n'a que son outil et sa coque. Tout le reste se trouve (sol, robots abattus, dépôts,
      salles piégées, pièces secrètes) ou se fabrique.
   2. Consommables non identifiés : chaque sorte porte un nom de code tiré à chaque partie (« //KZ7-3FQ ») et la même
      tuile de capsule. Le premier usage, ou le plan de fabrication, révèle ce que c'est.
   3. Tout consommable se vise, comme la charge sismique : une case jusqu'à VISEE_R cases (jamais de zone dessinée). Sur la foreuse,
      il la sert ; sur un ennemi, il sert l'ennemi (réparé, surrégime…) ou le frappe (batterie : décharge et étourdissement).
   4. Plans : le fabricateur ne propose que les objets dont on a trouvé le plan.
   5. Matière au sol (butin d'exploration), Module de puissance (POW +1 pour toujours), Surrégime, Camouflage optique.
   Ce que la foreuse sait (plans, capsules identifiées, noms de code) vit dans G.st.savoir : G.st suit la foreuse d'un niveau
   à l'autre. Valeurs réglables : Lab → Items (np-items). */
const ITEM_VAL_DEF={repar:{soin:50},batterie:{energie:50,choc:12,etourdi:10},charge:{degats:30},puissance:{pow:1,deg:5},
  berserk:{crit:50,duree:30},camo:{duree:30},balise:{rayon:20,duree:25,pv:40},court:{etourdi:10},matiere:{mat:15},
  phaseur:{loin:25}};
const ITEM_VAL_LIB={soin:'Vie rendue',energie:'Énergie rendue',choc:'Dégâts de la décharge',etourdi:'Étourdissement (battements)',degats:'Dégâts',pow:'POW gagné',deg:'Dégâts par point de POW en trop (%)',crit:'CRIT en plus (points)',duree:'Durée (battements)',rayon:'Rayon de l’appel (cases)',pv:'PV de la balise posée',mat:'Matière {µ} rendue',loin:'Distance mini où l’ennemi reparaît (cases)'};
let ITEM_VAL=JSON.parse(JSON.stringify(ITEM_VAL_DEF));
// chance qu'un robot abattu lâche un objet, par espèce (clé du Bestiaire)
const DROPS_DEF={crabos:8,cafar:6,mastok:90,brochon:10,mine:0,paralyzor:25,gardien:60,artilleur:35,drone:5,soudeur:45,englueur:35};
let DROPS=Object.assign({},DROPS_DEF);
const PLAN_DOUBLON=10;   // un plan déjà connu se recycle en Matière

Object.assign(ITEMS,{
  puissance:{n:'Module de puissance',conso:1,son:'boost',eff:'POW +1, pour toujours',
    d:'Un étage d’alimentation de plus : POW +1 définitivement. Les coups portent plus fort et un équipement plus lourd devient utilisable.',
    plein:st=>false,non:'',use:st=>'',
    art:["    ┌─────┐    ", "   ─┤  ▲  ├─   ", "   ─┤ ▲▲▲ ├─   ", "   ─┤  █  ├─   ", "    └─────┘    "],
    col:["....wwwwwww....", "...ww..1..ww...", "...ww.111.ww...", "...ww..1..ww...", "....wwwwwww...."]},
  berserk:{n:'Surrégime',conso:1,son:'fury',eff:'CRIT +50 pendant 8 battements',
    d:'Débride le moteur quelques battements : presque tous les coups sont critiques. Injecté à un ennemi, c’est lui qui frappe en critique.',
    plein:st=>false,non:'',use:st=>'',
    art:["          ▄▄   ", "        ▄▀▒▀   ", "      ▄▀▒▄▀    ", "    ▄▀▒▄▀      ", "  ▄█▄▄▀        ", "  ▀▀           "],
    col:["..........ww...", "........wwrw...", "......wwrww....", "....wwrww......", "..wwwww........", "..ww..........."]},
  camo:{n:'Camouflage optique',conso:1,son:'veil',eff:'Invisible 10 battements',
    d:'La coque renvoie ce qui l’entoure : les ennemis ne voient plus '+NOM_FOREUSE+', sauf au contact. Un coup ou un forage rompt l’effet.',
    plein:st=>false,non:'',use:st=>'',
    art:["   ·  ·  ·  ·  ", "  ·  ▄▄▄▄▄  ·  ", "  · █░▒█▒░█ ·  ", "  ·  ▀▀▀▀▀  ·  ", "   ·  ·  ·  ·  "],
    col:["...3..3..3..3..", "..3..wwwww..3..", "..3.w33w33w.3..", "..3..wwwww..3..", "...3..3..3..3.."]},
  // Capsules néfastes (22 novembre 2026) : mauvaises sur la foreuse, utiles lancées ailleurs. C'est ce qui fait de l'identification un pari.
  balise:{n:'Balise',conso:1,son:'alarme',eff:'Leurre : attire les ennemis 25 battements',
    d:'Un émetteur qui hurle. Lancée au loin, elle reste au sol 25 battements : les ennemis à 20 cases, et tous ceux qui chassent '+NOM_FOREUSE+', l’oublient et s’acharnent sur la balise (40 PV) ; détruite, elle explose. Ils restent en chasse : pas de coup par surprise, et ensuite ils cherchent '+NOM_FOREUSE+'. Sur '+NOM_FOREUSE+', c’est une catastrophe : tous savent où il est.',
    plein:st=>false,non:'',use:st=>'',
    art:["      ) ) )    ", "     ▄▄█▄▄     ", "     █ ● █     ", "     ▀▀█▀▀     ", "    ▄▄▄█▄▄▄    "],
    col:["......r.r.r....", ".....wwwww.....", ".....w.r.w.....", ".....wwwww.....", "....wwwwwww...."]},
  court:{n:'Court-circuit',conso:1,son:'zap',eff:'Énergie à zéro, ou ennemi hors service',
    d:'Une surtension brutale. Sur '+NOM_FOREUSE+' : l’énergie tombe à zéro. Lancé sur un ennemi : il reste hors service 10 battements, sans dégât.',
    plein:st=>false,non:'',use:st=>'',
    art:["     ▄▄▄▄▄     ", "    █  ▄▀ █    ", "    █ ▀▄  █    ", "    █  ▄▀ █    ", "     ▀▀▀▀▀     "],
    col:[".....wwwww.....", "....w..11.w....", "....w.11..w....", "....w..11.w....", ".....wwwww....."]},
  /* Phaseur (26 novembre 2026, demande de l'utilisateur). Sur la foreuse : elle se démonte et un grand viseur s'ouvre ;
     elle se reforme n'importe où sur le terrain DÉJÀ DÉCOUVERT (G.seen), pourvu qu'elle y tienne. Sur un ennemi : il se
     disperse et reparaît au hasard sur le niveau, à `loin` cases au moins, et perd la trace de la foreuse. */
  phaseur:{n:'Phaseur',conso:1,son:'phase',eff:'Téléportation sur le terrain connu',
    d:'Un champ de phase à usage unique. Sur '+NOM_FOREUSE+' : il entre en phase et sort de phase où l’on veut, pourvu que le terrain ait déjà été découvert. Lancé sur un ennemi : il passe en phase ailleurs sur le niveau, sans plus savoir où '+NOM_FOREUSE+' se trouve.',
    plein:st=>false,non:'',use:st=>'',
    art:["     ▄▄▄▄▄     ", "    █ ▐▌  █    ", "    █ ▐▌░ █    ", "    █ ▐▌  █    ", "     ▀▀▀▀▀     "],
    col:[".....wwwww.....", "....w.11..w....", "....w.112.w....", "....w.11..w....", ".....wwwww....."]},
  matiere:{n:'Matière {µ}',mat:1,eff:'Matière {µ} +15',d:'Un bloc de Matière {µ} brute : il rejoint la réserve dès qu’on le ramasse.',
    art:["     ▄▄        ", "   ▄████▄  ▄▄  ", "  ████████████ ", "   ▀████████▀  ", "      ▀▀▀▀     "],
    col:[".....11........", "...11w111..11..", "..111111111w11.", "...1111111111..", "......1111....."]}});
Object.assign(FAB_PRIX,{berserk:20,camo:24,balise:12,court:16,phaseur:45});

/* ----- Ce que la foreuse sait ----- */
// zone d'effet d'un consommable : r = 0 une case, 1 l'explosion (3 × 3 et 5 cases autour), 'f' le disque du fumigène ; la visée, elle,
// ne montre toujours qu'une case. soi : la visée s'ouvre sur la foreuse (de même pour toute capsule non identifiée)
const CONSO={repar:{r:0,soi:1},batterie:{r:0,soi:1},fumigene:{r:'f',soi:1},charge:{r:1,soi:0},puissance:{r:0,soi:1},berserk:{r:0,soi:1},
  camo:{r:0,soi:1},balise:{r:0,soi:1},court:{r:0,soi:1},phaseur:{r:0,soi:1}};
let SAV_GARDE=null;   // pendant la génération du niveau suivant, G.st est neuf : on garde la main sur le savoir de la foreuse
const codeTire=()=>{const L='BDFGHJKLMNPQRSTVWXZ',H='0123456789ABCDEF',l=()=>L[rnd(0,L.length-1)],h=()=>H[rnd(0,15)];
  return `//${l()}${l()}${rnd(2,9)}-${h()}${h()}${l()}`;};
function savoir(){const st=typeof G!=='undefined'&&G&&G.st;if(!st)return SAV_GARDE||{plans:{},ident:{},codes:{}};
  if(!st.savoir){if(SAV_GARDE)return SAV_GARDE;st.savoir={plans:{},ident:{},codes:{}};}
  const s=st.savoir;for(const k in CONSO)if(!s.codes[k]){let c;do c=codeTire();while(Object.values(s.codes).includes(c));s.codes[k]=c;}
  return s;}
let TOUT_CONNU=false;   // Lab → Items et planches : les vrais noms
const identifie=k=>TOUT_CONNU||!CONSO[k]||!!savoir().ident[k];
function identifier(k){if(!CONSO[k]||savoir().ident[k])return false;savoir().ident[k]=1;SAC_H='';INV_H=null;return true;}
const ART_CAPSULE={art:["     ▄▄▄▄▄     ", "    █▒▒▒▒▒█    ", "    ███████    ", "    █░?░?░█    ", "     ▀▀▀▀▀     "],col:[".....wwwww.....", "....w33333w....", "....wwwwwww....", "....w2w2w2w....", ".....wwwww....."]};
// les consommables répondent par leur nom de code tant qu'ils ne sont pas identifiés : tout l'affichage lit ITEMS[k].n, .eff, .d, .art, .col
for(const k in CONSO){const d=ITEMS[k],v={n:d.n,eff:d.eff,d:d.d,art:d.art,col:d.col};d.vrai=v;d.vise=1;
  const lie=(c,inconnu)=>Object.defineProperty(d,c,{get:()=>identifie(k)?v[c]:inconnu(),set:x=>{v[c]=x;},enumerable:true,configurable:true});
  lie('n',()=>'Capsule '+savoir().codes[k]);lie('eff',()=>'Effet inconnu');
  lie('d',()=>'Capsule scellée, marquage illisible. Il faut l’utiliser, ou trouver son plan, pour savoir ce qu’elle contient.');
  lie('art',()=>ART_CAPSULE.art);lie('col',()=>ART_CAPSULE.col);}
// textes d'effet tirés des valeurs réglables
/* Réparobots et batterie sur la foreuse (28 novembre 2026) : le gain n'est plus d'un coup, il est réparti sur RECUP_TOURS battements
   (statuts « Réparation » et « Recharge » avec les battements restants). Sur un ennemi, la réparation reste immédiate. */
const RECUP_TOURS=5;
function itemTxt(){const V=ITEM_VAL,v=k=>ITEMS[k].vrai;
  v('repar').eff=`Vie +${V.repar.soin} sur ${RECUP_TOURS} battements`;v('repar').d=`Essaim de micro-robots réparateurs : rend ${V.repar.soin} points de vie à ce qu’il touche — ${NOM_FOREUSE} (répartis sur ${RECUP_TOURS} battements) ou un ennemi (d’un coup).`;
  v('batterie').eff=`Énergie +${V.batterie.energie} sur ${RECUP_TOURS} battements, ou décharge`;
    v('batterie').d=`Sur ${NOM_FOREUSE} : rend ${V.batterie.energie} points d’énergie, répartis sur ${RECUP_TOURS} battements. Lancée sur un ennemi : ${V.batterie.choc} dégâts, et il reste étourdi ${V.batterie.etourdi} battements.`;
  v('fumigene').d='Un nuage opaque là où on le lance : il cache la vue des deux côtés. Si '+NOM_FOREUSE+' est dedans, les ennemis perdent sa trace.';
  v('charge').eff=`${V.charge.degats} dégâts, roche brisée, 3 × 3 et plus`;v('charge').d=`Explose jusqu’à la portée de vue, comme une mine : un carré de 3 × 3 et 5 cases autour, au hasard. ${V.charge.degats} dégâts, ${NOM_FOREUSE} comprise si elle est dedans, et roche brisée, même la roche dure. Très bruyante.`;
  v('puissance').eff=`POW +${V.puissance.pow}, pour toujours`;
  v('berserk').eff=`CRIT +${V.berserk.crit} pendant ${V.berserk.duree} battements`;
  v('camo').eff=`Invisible ${V.camo.duree} battements`;
  v('balise').eff=`Appelle les ennemis à ${V.balise.rayon} cases`;v('court').eff=`Énergie à zéro, ou ennemi hors service ${V.court.etourdi} battements`;
  v('phaseur').eff='Téléportation sur le terrain connu';
  ITEMS.matiere.eff=`Matière {µ} +${V.matiere.mat}`;}
// plans de fabrication : un objet « plan_<clé> » par objet fabricable ; jamais dans le sac, il s'apprend en le ramassant
const ART_PLAN={art:["  ┌─────────┐  ", "  │ ┌──┐ ── │  ", "  │ │  │ ── │  ", "  │ └──┘ ── │  ", "  └─────────┘  "],col:["..wwwwwwwwwww..", "..w.2222.22.w..", "..w.2..2.22.w..", "..w.2222.22.w..", "..wwwwwwwwwww.."]};
function plansInit(){for(const k in FAB_PRIX)if(ITEMS[k]&&!ITEMS['plan_'+k]){const o={plan:k,art:ART_PLAN.art,col:ART_PLAN.col,
  d:'Un plan de fabrication : une fois ramassé, le FABLAB sait produire cet objet.',eff:'Plan de fabrication'};
  Object.defineProperty(o,'n',{get:()=>'Plan : '+((ITEMS[k].vrai||ITEMS[k]).n),enumerable:true});ITEMS['plan_'+k]=o;}}
plansInit();
const critBonus=()=>G&&G.eff&&G.eff.berserk>0?ITEM_VAL.berserk.crit:0;
function camoCasse(){if(G&&G.eff&&G.eff.camo>0){G.eff.camo=0;sayMore('Le camouflage optique se rompt.','warn');}}
// la foreuse est-elle tenue par un Bloqueur ? (un Bloqueur étourdi lâche prise)
const tenuPar=()=>(G.beasts||[]).find(b=>b.tient&&!(b.stun>0)&&Math.max(Math.abs(b.x-G.px),Math.abs(b.y-G.py))<=1);

/* ----- Phaseur (26 novembre 2026) -----
   Deux temps quand il sert la foreuse, un seul quand il sert contre un ennemi.
   1. La capsule est dépensée, la foreuse se démonte (animation « phase », pixel par pixel) et PHASE s'ouvre : un viseur libre,
      que la vue suit (10-rendu). Il part de la foreuse.
   2. On valide une case : la foreuse s'y reforme. La case doit avoir été DÉCOUVERTE (G.seen) et pouvoir la porter —
      ni obstacle, ni créature, ni balise ; l'eau, elle, est permise, la foreuse patauge.
   Échap, ou une case impossible validée trois fois, ramène la foreuse où elle était : la capsule est perdue, mais on ne
   reste jamais bloqué hors du monde. Le battement ne passe qu'à l'arrivée, et la téléportation rompt le camouflage. */
const PHASE_DUR=420;
// tuile d'une créature, pour l'animation (la même que celle du rendu)
const creatureTuile=c=>{const b=(G.beasts||[]).includes(c);return TL[(b?'bz':'an')+c.sp+(c.dir<0?'l':'r')];};
const phaseFx=(x,y,tl,out)=>{if(tl)addFx({kind:'phase',x,y,tl,out,dur:PHASE_DUR});
  addFx({kind:'onde',x,y,r:4.5,dur:PHASE_DUR});};
// la foreuse tient-elle sur cette case ? (destination du phaseur)
function phaseTient(x,y){if(x<1||y<1||x>=W-1||y>=H-1)return false;const i=idx(x,y);
  return !blocks(G.t[i])&&!beastAt(x,y)&&!animalAt(x,y)&&!baliseAt(x,y);}
const phaseConnu=(x,y)=>!!(G.seen&&G.seen[idx(x,y)]);
// une case au hasard pour une créature téléportée : à `loin` cases au moins, et où elle tient (eau, salle de module, lasers compris)
function phaseCase(c,loin){const b=(G.beasts||[]).includes(c);
  // beastFits connaît tout des ennemis (eau, salle d'un module, lasers, balises) ; pour la faune, terrOk suffit
  const ok=(x,y)=>b?beastFits(c,x,y):terrOk(c,x,y)&&!(x===G.px&&y===G.py)&&!beastAt(x,y)&&!animalAt(x,y)&&!baliseAt(x,y);
  // on desserre la distance plutôt que de ne rien faire : une petite carte, ou un aquatique dans une flaque, n'offre pas toujours 14 cases
  for(const d of [loin,Math.round(loin/2),3,1]){const l=[];
    for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){if(cheb(c,x,y)<d||!ok(x,y))continue;l.push([x,y]);}
    if(l.length)return l[rnd(0,l.length-1)];}
  return null;}
// la foreuse se démonte : le viseur s'ouvre
function phaseOuvre(neuf){const nom=ITEMS.phaseur.vrai.n;
  PHASE={x:G.px,y:G.py,x0:G.px,y0:G.py,cx:G.px,cy:G.py,rate:0};
  phaseFx(G.px,G.py,null,1);addFx({kind:'phase',x:G.px,y:G.py,robot:1,out:1,dur:PHASE_DUR});
  SFX.phase();camoCasse();
  say(`${neuf?`Capsule ${savoir().codes.phaseur} : c’était un ${nom}. `:''}${nom} : ${NOM_FOREUSE} entre en phase. Choisir la destination.`,'warn');
  render();}
function phaseVers(x,y){if(!PHASE)return;const cx=Math.max(1,Math.min(W-2,x)),cy=Math.max(1,Math.min(H-2,y));
  if(cx!==PHASE.x||cy!==PHASE.y){PHASE.x=cx;PHASE.y=cy;render();}}
/* Défilement de la vue pendant le phasage (28 novembre 2026) : la vue reste centrée sur la foreuse ; quand le viseur s'approche
   du bord du cadre (PHASE_BORD cases), elle défile d'une case vers lui, au rythme de PHASE_PAS. Un viseur posé hors de la vue
   par la mini-carte ne la déplace pas : on le suit sur la mini-carte. `loin` : on ramène la vue d'un coup (touches). */
// cases intermédiaires, en ligne droite, entre la boule restée sur place et le viseur (le phasage ignore le terrain) ; ni l'une ni l'autre
function phaseLigne(){if(!PHASE)return null;let x=PHASE.x0,y=PHASE.y0;const tx=PHASE.x,ty=PHASE.y,dx=Math.abs(tx-x),dy=-Math.abs(ty-y),
  sx=x<tx?1:-1,sy=y<ty?1:-1,p=[];let e=dx+dy;
  for(let n=0;n<W+H;n++){if(x===tx&&y===ty)break;const e2=2*e;if(e2>=dy){e+=dy;x+=sx;}if(e2<=dx){e+=dx;y+=sy;}if(!(x===tx&&y===ty))p.push([x,y]);}
  return p;}
const PHASE_BORD=2,PHASE_PAS=70;let phaseTimer=0,phasePtr=null;
function phaseDefile(loin){if(!PHASE)return false;const vc=Math.floor(vw/S),vr=Math.floor(vh/S);let bouge=false;
  const sens=(v,cam,n,max)=>{if(v<cam+PHASE_BORD&&cam>0)return -1;if(v>cam+n-1-PHASE_BORD&&cam<max-n)return 1;return 0;};
  for(let k=0;k<(loin?60:1);k++){const dx=sens(PHASE.x,camX,vc,W),dy=sens(PHASE.y,camY,vr,H);if(!dx&&!dy)break;
    PHASE.cx+=dx;PHASE.cy+=dy;camX+=dx;camY+=dy;bouge=true;}
  if(bouge)render();return bouge;}
// souris : tant qu'elle reste près du bord, la vue continue de défiler (le viseur suit la case sous le pointeur)
function phaseSouris(ev){if(!PHASE)return;phasePtr=ev;
  if(!phaseTimer)phaseTimer=setInterval(()=>{if(!PHASE){clearInterval(phaseTimer);phaseTimer=0;return;}
    if(phasePtr&&phaseDefile(0)&&phasePtr.type!=='click'){const c=cellAt(phasePtr);phaseVers(c.x,c.y);}},PHASE_PAS);}
// la foreuse se reforme sur la case visée
function phaseOk(){if(!PHASE||G.over)return;const {x,y}=PHASE;
  if(!phaseConnu(x,y)||!phaseTient(x,y)){PHASE.rate++;SFX.blocked();
    say(phaseConnu(x,y)?'Le champ de phase refuse cette case : '+NOM_FOREUSE+' n’y tiendrait pas.':'Terrain jamais découvert : le champ de phase n’a pas de point d’ancrage.','warn');
    if(PHASE.rate>=3)phaseRetour('Trop d’essais : '+NOM_FOREUSE+' sort de phase sur place.');else render();return;}
  const loin=Math.round(Math.hypot(x-PHASE.x0,y-PHASE.y0));PHASE=null;phasePtr=null;
  G.px=x;G.py=y;G.tracks=null;   // la trace s'arrête net : rien ne relie les deux points
  phaseArrive(`${NOM_FOREUSE} sort de phase ${loin} case${loin>1?'s':''} plus loin.`);}
// Échap, ou trois refus : retour sur place
function phaseRetour(m){if(!PHASE)return;G.px=PHASE.x0;G.py=PHASE.y0;PHASE=null;phasePtr=null;phaseArrive(m||'Le champ de phase se referme : '+NOM_FOREUSE+' sort de phase sur place.');}
function phaseArrive(m){addFx({kind:'phase',x:G.px,y:G.py,robot:1,dur:PHASE_DUR});
  addFx({kind:'onde',x:G.px,y:G.py,r:4.5,dur:PHASE_DUR});SFX.phase();
  say(m,'good');computeFOV();invChanged();
  if(consoTemps())return;
  render();}

/* ----- Butin ----- */
// objets simples d'abord, les meilleurs plus bas
const PLAN_RANG=k=>{const d=ITEMS[k];return ['repar','batterie','fumigene','balise'].includes(k)?1:d.conso||d.slot==='acc'?2:3;};
const nivCarte=()=>nivBorne((typeof G!=='undefined'&&G&&G.niv)||(typeof NIV_GEN==='number'?NIV_GEN:1));
let PLANS_POSES={};   // plans déjà posés sur la carte en cours de génération : pas deux fois le même
function planTire(){const s=savoir(),niv=nivCarte(),lib=Object.keys(FAB_PRIX).filter(k=>ITEMS[k]&&!s.plans[k]&&!PLANS_POSES[k]);
  let l=lib.filter(k=>PLAN_RANG(k)<=niv);if(!l.length)l=lib.filter(k=>PLAN_RANG(k)<=niv+1);if(!l.length)return 'matiere';
  const k=l[rnd(0,l.length-1)];PLANS_POSES[k]=1;return 'plan_'+k;}
const CONSO_POIDS=[['repar',5],['batterie',4],['fumigene',3],['charge',3],['berserk',2],['camo',2],['balise',2],['court',2],
  ['phaseur',2]];
function consoTire(){let t=CONSO_POIDS.reduce((a,c)=>a+c[1],0),r=Math.random()*t;
  for(const [k,p] of CONSO_POIDS){if((r-=p)<0)return k;}return 'repar';}
function equipTire(){const l=Object.keys(ITEMS).filter(k=>ITEMS[k].slot&&!ITEMS[k].base&&k!=='usine'&&PLAN_RANG(k)<=nivCarte()+1);
  return l.length?l[rnd(0,l.length-1)]:'matiere';}
// contenu d'un coffre : dépôt derrière une grille, appât d'une salle piégée, pièce secrète
function butinCoffre(q){const h=p=>Math.random()<p;
  if(q==='depot')return [planTire(),consoTire(),h(.5)?equipTire():consoTire(),'matiere'];
  if(q==='piege')return [h(.5)?planTire():equipTire(),consoTire(),'matiere'];
  return [consoTire(),'matiere',...(h(.5)?[planTire()]:[]),...(h(.25)?['puissance']:[])];}
// un robot abattu lâche parfois un objet (les relais d'une salle piégée, jamais : b.nd)
// Un objet au plus par robot, quel que soit le nombre de coups qui l'achèvent au même battement (b.butin, 25 novembre 2026).
function butinMort(b){if(!b||b.nd||b.butin)return;b.butin=1;const sp=BEASTS[b.sp],p=DROPS[sp.key]||0;if(Math.random()*100>=p)return;
  const i0=idx(b.x,b.y);if(blocks(G.t[i0])||G.t[i0]===DEEP)return;
    const r=Math.random(),k=r<.4?'matiere':r<.75?consoTire():r<.93?planTire():equipTire();
  const i=caseSol(b.x,b.y,true);   // un objet déjà là : celui-ci roule sur la case libre la plus proche (22 novembre 2026)
  G.items=G.items||{};(G.items[i]=G.items[i]||[]).push(k);
    if(typeof vis!=='undefined'&&vis[i])sayMore(`${LeNom(sp)} lâche quelque chose.`,'good');}
/* Butin d'exploration. Ordre de priorité des lieux (24 novembre 2026) : pièces secrètes > pièces fermées à clé > culs-de-sac
   > autres salles. Les pièces secrètes reçoivent chacune leur lot. Les autres lieux se partagent 5 à 10 butins, choisis dans cet
   ordre ; un Module de puissance, un plan et une capsule y sont tirés au sort, les lieux prioritaires pesant plus lourd (une
   préférence, pas une règle fixe), et le reste reçoit de la Matière.
   – fermée à clé : une zone qu'on n'atteint qu'en ouvrant une porte verrouillée ; une case par zone, la plus reculée ;
   – cul-de-sac : une case d'où plus rien ne mène ailleurs, loin du trajet arrivée → site ;
   – autres salles : s'il reste des butins à poser, le sol bâti le plus à l'écart du trajet.
   Appelé à la fin de la génération, après les machines. */
// poids d'un lieu dans le tirage des meilleurs butins : une pièce fermée à clé pèse six culs-de-sac
const BUTIN_POIDS={ferme:6,impasse:1,autres:.5};
function butinExplo(){const N=W*H,t=G.t,dep=idx(G.px,G.py),s0=G.sites&&G.sites[0],site=s0?idx(s0.x,s0.y):-1;G.items=G.items||{};
  G.butinN={secret:0,explo:0,ferme:0,impasse:0,autres:0};
  const pose=(i,k)=>{(G.items[i]=G.items[i]||[]).push(k);};
  const bfs=(src,secret,ferme,eau)=>{const d=new Int32Array(N).fill(-1),q=src.slice();for(const c of q)d[c]=0;
    for(let a=0;a<q.length;a++){const c=q[a],x=c%W,y=(c/W)|0;for(const [dx,dy] of D4){const X=x+dx,Y=y+dy;
      if(X<1||Y<1||X>=W-1||Y>=H-1)continue;const j=idx(X,Y),v=t[j];
      if(d[j]<0&&(!blocks(v)||(v===LOCK&&!ferme)||(secret&&v===SECRET))&&(eau||v!==DEEP)){d[j]=d[c]+1;q.push(j);}}}return d;};
  const d=bfs([dep],false),d0=bfs([dep],false,true);   // d0 : sans ouvrir aucune serrure
  const libre=i=>(t[i]===FLOOR||t[i]===GROUND||t[i]===FLAT||t[i]===RUBBLE)&&i!==site&&i!==dep&&!(G.items[i]&&G.items[i].length)&&!(G.cles&&G.cles[i])&&!(G.lz&&G.lz[i])&&!(G.soc&&G.soc[i]!=null)&&!(G.ore&&G.ore[i])&&!(G.sites||[]).some(s=>idx(s.x,s.y)===i);
  // pièces secrètes : ce qu'on n'atteint qu'en passant une porte dérobée ; le butin est au fond.
  // Ici l'eau profonde se traverse (24 novembre 2026) : sans cela, une pièce secrète située au-delà d'un bras d'eau profonde
  // n'était pas vue du tout et restait vide (16 pièces sur 56 au niveau 2).
  const dE=bfs([dep],false,false,true),dsE=bfs([dep],true,false,true);
  const vu=new Uint8Array(N);
  for(let i=0;i<N;i++){if(vu[i]||dsE[i]<0||dE[i]>=0||blocks(t[i]))continue;const comp=[i];vu[i]=1;
    for(let a=0;a<comp.length;a++){const c=comp[a],x=c%W,y=(c/W)|0;for(const [dx,dy] of D4){const j=idx(x+dx,y+dy);
      if(j>=0&&j<N&&!vu[j]&&dsE[j]>=0&&dE[j]<0&&!blocks(t[j])){vu[j]=1;comp.push(j);}}}
    const c=comp.filter(libre).sort((a,b)=>dsE[b]-dsE[a]);if(!c.length)continue;
    butinCoffre('secret').forEach((k,n)=>pose(c[Math.min(n,c.length-1)],k));G.butinN.secret++;}
  // trajet principal, puis l'écart de chaque case à ce trajet
  const chemin=[dep];if(site>=0&&d[site]>=0){let c=site;while(c!==dep){chemin.push(c);const x=c%W,y=(c/W)|0;let m=c;
    for(const [dx,dy] of D4){const j=idx(x+dx,y+dy);if(d[j]>=0&&d[j]<d[m])m=j;}if(m===c)break;c=m;}}
  const dc=bfs(chemin,false),nb=Math.max(5,Math.min(10,Math.round(N/600))),pris=[];
  // pièces fermées à clé : chaque zone qu'on n'atteint qu'en ouvrant une serrure ; sa case la plus à l'écart du trajet, puis la plus loin
  {const vuF=new Uint8Array(N),ferm=[];
    for(let i=0;i<N;i++){if(vuF[i]||d[i]<0||d0[i]>=0||blocks(t[i]))continue;const comp=[i];vuF[i]=1;
      for(let a=0;a<comp.length;a++){const c=comp[a],x=c%W,y=(c/W)|0;for(const [dx,dy] of D4){const j=idx(x+dx,y+dy);
        if(j>=0&&j<N&&!vuF[j]&&d[j]>=0&&d0[j]<0&&!blocks(t[j])){vuF[j]=1;comp.push(j);}}}
      const c=comp.filter(libre).sort((a,b)=>dc[b]-dc[a]||d[b]-d[a]);if(c.length)ferm.push(c[0]);}
    ferm.sort((a,b)=>dc[b]-dc[a]);for(const i of ferm)if(pris.length<nb)pris.push(i);G.butinN.ferme=pris.length;}
  // rien ne mène plus loin, et un mur au moins sur trois côtés : un fond de cul-de-sac ou un coin. On commence par les plus reculés
  // (12 pas d'écart au trajet, 10 cases entre deux butins), puis on desserre si la carte en offre trop peu.
  for(const [ecart,esp] of [[12,10],[8,8],[5,6]]){if(pris.length>=nb)break;const cand=[];
    for(let y=2;y<H-2;y++)for(let x=2;x<W-2;x++){const i=idx(x,y);if(d[i]<0||dc[i]<ecart||!libre(i)||pris.includes(i))continue;
      let n=0,max=true,porte=false;
      for(const [dx,dy] of DIRS){const j=idx(x+dx,y+dy),v=t[j];if(v===DOOR||v===LOCK||v===SECRET)porte=true;if(d[j]>=0){n++;
        if(d[j]>d[i])max=false;}}
      if(max&&!porte&&n<=5)cand.push(i);}
    cand.sort((a,b)=>dc[b]-dc[a]);
    for(const i of cand){if(pris.length>=nb)break;
      if(pris.some(j=>Math.max(Math.abs(i%W-j%W),Math.abs(((i/W)|0)-((j/W)|0)))<esp))continue;pris.push(i);}}
  G.butinN.impasse=pris.length-G.butinN.ferme;
  // autres salles : s'il reste des butins, le sol bâti le plus à l'écart du trajet, jamais contre une porte
  if(pris.length<nb){const cand=[];
    for(let y=2;y<H-2;y++)for(let x=2;x<W-2;x++){const i=idx(x,y);if(t[i]!==FLOOR||d[i]<0||dc[i]<3||!libre(i)||pris.includes(i))continue;
      if(!DIRS.some(([dx,dy])=>{const v=t[idx(x+dx,y+dy)];return v===DOOR||v===LOCK||v===SECRET;}))cand.push(i);}
    cand.sort((a,b)=>dc[b]-dc[a]);
    for(const i of cand){if(pris.length>=nb)break;
      if(pris.some(j=>Math.max(Math.abs(i%W-j%W),Math.abs(((i/W)|0)-((j/W)|0)))<8))continue;pris.push(i);G.butinN.autres++;}}
  // Qui reçoit quoi : une PRÉFÉRENCE, pas une règle fixe (24 novembre 2026). Le Module de puissance, puis le plan, puis la capsule
  // sont tirés au sort parmi les lieux encore vides, chaque lieu pesant selon sa priorité (BUTIN_POIDS) ; le reste reçoit de la Matière.
  {const nF=G.butinN.ferme,nI=G.butinN.impasse,poids=pris.map((_,n)=>n<nF?BUTIN_POIDS.ferme:n<nF+nI?BUTIN_POIDS.impasse:BUTIN_POIDS.autres),
      lot=pris.map(()=>null);
    for(const k of ['puissance','plan','conso']){const vides=pris.map((_,n)=>n).filter(n=>!lot[n]);if(!vides.length)break;
      let r=Math.random()*vides.reduce((a,n)=>a+poids[n],0),choix=vides[vides.length-1];
      for(const n of vides){r-=poids[n];if(r<0){choix=n;break;}}
      lot[choix]=k;}
    pris.forEach((i,n)=>pose(i,lot[n]==='plan'?planTire():lot[n]==='conso'?consoTire():lot[n]||'matiere'));}
  G.butinN.explo=pris.length;}

/* ----- Ramassage : la Matière rejoint la réserve, un plan s'apprend, le reste va au sac ----- */
function butinPrend(c,more){const l=G.items&&G.items[c];if(!l)return;const dire=more?sayMore:invSay,reste=[];
  for(const k of l){const d=ITEMS[k];
    // la clé ne se fabrique plus (25 novembre 2026) : un plan de clé resté au sol d'une ancienne partie se recycle en Matière
    if(k==='plan_cle'){G.st.matiere=(G.st.matiere||0)+PLAN_DOUBLON;dire(`Plan périmé, recyclé en Matière {µ} (+${PLAN_DOUBLON}).`,'info');continue;}
    if(d&&d.mat){const m=ITEM_VAL.matiere.mat;G.st.matiere=(G.st.matiere||0)+m;
      addFx({kind:'num',x:G.px,y:G.py,txt:'+'+m,col:PAL['1'],dur:750});
      dire(`Matière {µ} ramassée : +${m} (réserve ${G.st.matiere}).`,'good');SFX.spot();}
    else if(d&&d.plan){const s=savoir();if(s.plans[d.plan]){G.st.matiere=(G.st.matiere||0)+PLAN_DOUBLON;
      dire(`${d.n} : déjà connu, recyclé en Matière {µ} (+${PLAN_DOUBLON}).`,'info');}
      else{s.plans[d.plan]=1;identifier(d.plan);dire(`${d.n} appris : le FABLAB sait maintenant le produire.`,'good');}SFX.analyse();}
    else reste.push(k);}
  if(reste.length)G.items[c]=reste;else delete G.items[c];}

/* ----- Visée de tous les consommables ----- */
// la visée montre toujours une seule case (22 novembre 2026) : une zone dessinée trahirait la charge sismique ou le fumigène
function viseeCases(){return VISEE?[[VISEE.x,VISEE.y]]:[];}
function retire(c){const isB=(G.beasts||[]).includes(c);(isB?G.beasts:G.animals).splice((isB?G.beasts:G.animals).indexOf(c),1);
  bleed(c.x,c.y);if(isB){butinMort(c);minePartie(c);}}
function consoCible(i,x,y){const o=G.inv[i];if(!o)return;const k=o.k,d=ITEMS[k],V=ITEM_VAL[k]||{},st=G.st,nom=d.vrai.n,connu=identifie(k);
  const moi=x===G.px&&y===G.py,b=beastAt(x,y),an=b?null:animalAt(x,y),c=b||an,sp=b?BEASTS[b.sp]:an?SPECIES[an.sp]:null;
  // objet connu, inutile sur la foreuse : refusé, rien n'est dépensé
  if(connu&&moi&&((k==='repar'&&st.vie>=st.vieMax)||(k==='batterie'&&st.energie>=st.energieMax))){say(k==='repar'?'Vie déjà au maximum : réparobots inutiles.':'Énergie déjà au maximum : batterie inutile.','warn');
    SFX.blocked();render();return;}
  VISEE=null;
  // Phaseur sur la foreuse : la capsule part tout de suite, la foreuse se démonte, et le grand viseur s'ouvre pour choisir
  // où elle se reforme. Le battement ne passe qu'à l'arrivée (phaseArrive), pas ici.
  if(k==='phaseur'&&moi){const neuf=identifier(k);invTake(i);sacFix();SAC_H='';phaseOuvre(neuf);return;}
  let txt='',ton='good',son=d.son;const num=(t,col)=>addFx({kind:'num',x,y,txt:t,col,dur:900});
  if(k==='repar'){if(moi){const E=G.eff=G.eff||{};E.repar={t:RECUP_TOURS,v:(E.repar?E.repar.v:0)+V.soin};txt=`réparation en cours : +${V.soin} PV sur ${RECUP_TOURS} battements`;
    addFx({kind:'soin',x,y,dur:1000,gr:fxGrains(12)});}
    else if(c){const m=pvDe(sp),a=c.hp??m;c.hp=Math.min(m,a+V.soin);txt=`${leNom(sp)} est réparé (+${c.hp-a} PV)`;ton='warn';
      num('+'+(c.hp-a),PAL['2']);addFx({kind:'soin',x,y,dur:1000,gr:fxGrains(12)});}
    else{txt='les réparobots se dispersent sans rien trouver à réparer';ton='warn';}}
  // l'énergie regagnée, en blanc comme sa barre (22 novembre 2026)
  else if(k==='batterie'){if(moi){const E=G.eff=G.eff||{};E.recharge={t:RECUP_TOURS,v:(E.recharge?E.recharge.v:0)+V.energie};
    txt=`recharge en cours : +${V.energie} énergie sur ${RECUP_TOURS} battements`;
addFx({kind:'ener',x,y,dur:1000,gr:fxGrains(12)});}
    else if(c){c.hp=(c.hp??pvDe(sp))-V.choc;num('-'+V.choc,PAL['3']);son='laser';addFx({kind:'flash',beast:c,dur:220});
      if(c.hp<=0){retire(c);txt=`la décharge détruit ${leNom(sp)}`;}
      else{c.stun=V.etourdi;if(b){b.hunt=1;spot(b);}else{an.aware=1;spot(an);
        }txt=`${leNom(sp)} est électrisé : −${V.choc} PV, étourdi ${V.etourdi} battements`;}engage();}
    else{txt='la décharge se perd dans le sol';ton='warn';}}
  else if(k==='fumigene'){fumPose(x,y);txt=fumDedans()?'le nuage se répand, les ennemis perdent votre trace':'le nuage se répand là-bas';}
  else if(k==='puissance'){if(moi){st.power=(st.power||0)+V.pow;txt=`POW +${V.pow} (POW ${st.power})`;
    addFx({kind:'boost',x,y,dur:900,gr:fxGrains(14)});}
    else if(b){b.pow=(b.pow||0)+1;txt=`${leNom(sp)} gagne en puissance : ses coups portent plus fort`;ton='warn';num('POW+',PAL['3']);
      addFx({kind:'boost',x,y,dur:900,gr:fxGrains(14)});}
    else{txt='le module grille sans rien alimenter';ton='warn';}}
  else if(k==='berserk'){if(moi){G.eff.berserk=V.duree;txt=`surrégime : CRIT +${V.crit} pendant ${V.duree} battements`;
    addFx({kind:'fury',x,y,dur:800});}
    else if(b){b.bers=V.duree;b.hunt=1;spot(b);
      txt=`${leNom(sp)} passe en surrégime : ses coups sont critiques pendant ${V.duree} battements`;ton='warn';num('!!',PAL['3']);
      addFx({kind:'fury',x,y,dur:800});}
    else{txt='la dose se perd';ton='warn';}}
  else if(k==='camo'){if(moi){G.eff.camo=V.duree;
    for(const e of G.beasts||[])if(e.hunt&&Math.max(Math.abs(e.x-G.px),Math.abs(e.y-G.py))>1){e.hunt=0;forget(e);
    }txt=`${NOM_FOREUSE} disparaît pendant ${V.duree} battements`;addFx({kind:'veil',x,y,dur:750});}
    else if(b){b.camo=V.duree;txt=`${leNom(sp)} disparaît pendant ${V.duree} battements`;ton='warn';
      addFx({kind:'veil',x,y,dur:750});}
    else{txt='le voile se dissipe sans rien couvrir';ton='warn';}}
  else if(k==='balise'){
    if(moi){const camo=G.eff&&G.eff.camo>0;if(camo)G.eff.camo=0;let n=0;
      /* sur la foreuse : tous savent où il est, et le camouflage se rompt */
      for(const e of G.beasts||[])if(Math.max(Math.abs(e.x-x),Math.abs(e.y-y))<=V.rayon&&!(e.stun>0)){e.hunt=1;e.leurre=0;spot(e);n++;}
      addFx({kind:'shake',amp:4,dur:250});txt=`la balise hurle sur ${NOM_FOREUSE} : ${n} ennemi${n>1?'s':''} alentour ${n>1?'savent':'sait'} où il est`+(camo?' ; le camouflage optique se rompt':'');ton='warn';}
    else{const q=balisePose(x,y);
      txt=`la balise tombe au sol et hurle : ${q} ennemi${q>1?'s':''} l’${q>1?'oublient':'oublie'} pour elle, pendant ${V.duree} battements`;}}
  // Phaseur sur une créature : elle se disperse et reparaît au hasard, à `loin` cases au moins, et perd la trace de la foreuse
  else if(k==='phaseur'){if(c){const p=phaseCase(c,V.loin||14);
    if(!p){txt=`le champ se referme : nulle part où envoyer ${leNom(sp)}`;ton='warn';}
    else{phaseFx(c.x,c.y,creatureTuile(c),1);
      c.x=p[0];c.y=p[1];c.tient=0;c.leurre=0;
      if(b){b.hunt=0;b.fuse=0;}else an.aware=0;
      forget(c);phaseFx(c.x,c.y,null,0);
      txt=`${leNom(sp)} passe en phase, ailleurs sur le niveau`;}}
    else{txt='le champ de phase se referme sur le vide';ton='warn';}}
  else if(k==='court'){if(moi){st.energie=0;txt='surtension : l’énergie tombe à zéro';ton='warn';addFx({kind:'shake',amp:5,dur:250});
    addFx({kind:'zap',ax:x-.5,ay:y-.5,bx:x+.5,by:y+.5,dur:320});addFx({kind:'zap',ax:x+.5,ay:y-.5,bx:x-.5,by:y+.5,dur:320});}
    else if(b){b.stun=V.etourdi;b.tient=0;txt=`${leNom(sp)} est hors service pendant ${V.etourdi} battements`;num('HS',PAL['3']);
      addFx({kind:'zap',ax:G.px,ay:G.py,bx:x,by:y,dur:320});addFx({kind:'flash',beast:b,dur:220});}
    else{txt='la surtension se perd dans le sol';ton='warn';}}
  const neuf=identifier(k);invTake(i);sacFix();SAC_H='';
  say(`${neuf?`Capsule ${savoir().codes[k]} : c’était ${nom}. `:''}${nom} : ${txt}.`,ton);(son&&SFX[son]?SFX[son]:SFX.spot)();
  if(consoTemps())return;invChanged();}
/* Balise posée (23 novembre 2026). Lancée ailleurs que sur la foreuse, la balise vole jusqu'à la case visée (sur la case libre
   la plus proche si un obstacle ou une créature l'occupe), s'y pose et hurle pendant `duree` battements (25). Tant qu'elle hurle,
   tout ennemi à `rayon` cases d'elle (20), ou qui chasse la foreuse, l'oublie et s'acharne sur la balise : il y court et
   l'attaque (les tireurs à portée lui tirent dessus, les mines s'arment à côté) ; chaque coup la touche. Elle a `pv` PV (40),
   barre les passages comme une créature, et explose sur sa seule case quand elle est détruite (sans dégâts alentour).
   Les ennemis attirés restent EN CHASSE (pas de coup par surprise possible) et gardent le souvenir de la foreuse : la balise
   éteinte ou détruite, ils la cherchent là où ils l'ont vue (ou, s'ils ne l'avaient jamais vue, autour de la balise).
   Statut : « Balise N ». G.balises = [{id, x, y, hp, t}]. Correctifs du 23 novembre 2026, 0 h 40. */
const baliseAt=(x,y)=>(G.balises||[]).find(q=>q.x===x&&q.y===y);
function balisePose(x,y){const V=ITEM_VAL.balise;G.balises=G.balises||[];
  let c=idx(x,y);if(blocks(G.t[c])||G.t[c]===DEEP||beastAt(x,y)||animalAt(x,y)||baliseAt(x,y)||(x===G.px&&y===G.py))c=caseSol(x,y,false);
  const q={id:(G.baliseN=(G.baliseN||0)+1),x:c%W,y:(c/W)|0,hp:V.pv,t:V.duree};G.balises.push(q);
  addFx({kind:'jet',ax:G.px,ay:G.py,bx:q.x,by:q.y,q:q.id,dur:280});addFx({kind:'shake',amp:4,dur:250});
  return baliseAppel(q);}
// les ennemis à portée, ou en chasse, passent sur la balise : ils oublient la foreuse
function baliseAppel(q){const V=ITEM_VAL.balise;let n=0;
  for(const e of G.beasts||[]){if(e.leurre===q.id){n++;continue;}if(e.stun>0)continue;
    // en chasse, souvenir gardé
    if(Math.max(Math.abs(e.x-q.x),Math.abs(e.y-q.y))<=V.rayon||e.hunt>0){e.leurre=q.id;e.hunt=1;e.search=0;e.tient=0;n++;}}
  return n;}
const baliseDe=e=>e.leurre?(G.balises||[]).find(q=>q.id===e.leurre)||null:null;
// une fois par battement, avant que les ennemis jouent
// cartes de distance vers chaque balise, refaites à chaque battement (hors de G : rien de lourd dans la sauvegarde)
const BAL_D=new Map();
let BAL_SON=false;   // un seul bruit d'attaque sur les balises par battement, quel que soit le nombre d'attaquants (23 novembre 2026)
function baliseTick(){BAL_D.clear();BAL_SON=false;if(!G.balises||!G.balises.length)return;
  for(const q of [...G.balises]){if(--q.t<=0){baliseFin(q,false);continue;}baliseAppel(q);}}
// la balise s'éteint (ou explose) : ses ennemis viennent fouiller où elle était
function baliseFin(q,boum){const k=G.balises.indexOf(q);if(k<0)return;G.balises.splice(k,1);
  // ils reprennent la chasse : vers la foreuse s'ils la voient, sinon là où ils l'ont vue
  for(const e of G.beasts||[])if(e.leurre===q.id){e.leurre=0;e.hunt=1;if(!e.mem)e.mem=[q.x,q.y];e.search=0;e.stuck=0;}
  const vu=vis[idx(q.x,q.y)];
  if(boum)baliseBoom(q,vu);else if(vu)sayMore('La balise se tait.','info');}
// un coup sur la balise (ennemi au contact ou tireur, explosion)
function baliseCoup(q,dm,o){q.hp-=dm;if(vis[idx(q.x,q.y)])addFx({kind:'num',x:q.x,y:q.y,txt:'-'+dm,col:PAL['3'],dur:700});
  if(q.hp<=0)baliseFin(q,true);}
// la balise ne se dérobe pas : chaque coup la touche
function baliseFrappe(e,sp,q,laser){const vu=beastVisible(e)||vis[idx(q.x,q.y)],proche=!BAL_SON&&(vu||cheb(e,G.px,G.py)<=10);
  if(proche)BAL_SON=true;
  if(laser){if(q.x!==e.x)e.dir=Math.sign(q.x-e.x);if(vu)addFx({kind:'laser',o:e,x:q.x,y:q.y,ox:0,oy:0,dur:300});if(proche)SFX.laser();}
  else{if(vu)addFx({kind:'lunge',beast:e,dx:Math.sign(q.x-e.x),dy:Math.sign(q.y-e.y),dur:200});if(proche)SFX.bite();}
  const cr=e.bers>0||roll(sp.crit||0);baliseCoup(q,Math.round(dmgDe(sp)*(cr?CRIT_X:1)*(1+.25*(e.pow||0))));}
// l'explosion de la balise : sur sa seule case, sans dégâts alentour (23 novembre 2026)
function baliseBoom(q,vu){addFx({kind:'boom',x:q.x,y:q.y,cases:[[q.x,q.y]],dur:420});
  if(vu||cheb(q,G.px,G.py)<=10){addFx({kind:'shake',amp:5,dur:250});SFX.explode();}
  if(vu)sayMore('La balise est détruite : elle explose.','warn');else if(cheb(q,G.px,G.py)<=10)sayMore('Une explosion, tout près.','warn');}
/* Un ennemi qui suit une balise : il y court et l'attaque, au lieu de la foreuse. Rend la durée de ce qu'il a fait
   (son horloge, voir 08-faune), ou 0 s'il n'a rien à suivre. La mèche d'une mine armée brûle au battement. */
function baliseJoue(e,sp){const q=baliseDe(e);if(!q){e.leurre=0;return 0;}const d=cheb(e,q.x,q.y);
  if(sp.mine){if(e.fuse>0)return dcoupDe(e,sp);
    if(d<=1){e.fuse=rnd(2,3);return dcoupDe(e,sp);}}
  else if((sp.laser||sp.glu)&&d<=(sp.laser||sp.glu)&&d>1&&los(e.x,e.y,q.x,q.y)){
    baliseFrappe(e,sp,q,true);return dcoupDe(e,sp)*(sp.glu?(sp.cadence||3):1);}
  else if(d<=1){baliseFrappe(e,sp,q,false);return dcoupDe(e,sp);}
  const m=mouilleOk(sp,e),kD=q.id+':'+(m?1:0);let D=BAL_D.get(kD);
    if(!D){D=distFrom(q.x,q.y,m);BAL_D.set(kD,D);}
  chaseStep(e,D,(x,y)=>beastFits(e,x,y),q.x,q.y);
  return dpasDe(e,sp);}
/* F9 (23 novembre 2026, pour les essais) : au moins un exemplaire de chaque consommable existant (capsules et clé) dans le sac,
   identifié. Une sorte déjà présente n'est pas ajoutée. S'il manque des places, F9 retire des doublons — un exemplaire à la
   fois, toujours sur la plus grosse pile — jusqu'à ce que toutes les sortes tiennent. */
function f9Consos(){const sortes=Object.keys(ITEMS).filter(k=>ITEMS[k].conso),
  manque=sortes.filter(k=>!G.inv.some(o=>o.k===k));let retires=0;
  for(const k of sortes)if(CONSO[k])identifier(k);
  while(sacPlaces()+manque.length>SAC_MAX){const piles=G.inv.filter(o=>ITEMS[o.k].conso&&(o.n||1)>1).sort((a,b)=>(b.n||1)-(a.n||1));
    if(!piles.length)break;piles[0].n--;retires++;}
  const pris=[];for(const k of manque){if(sacPlaces()>=SAC_MAX)break;G.inv.push({k,eq:0,n:1});pris.push(k);}
  say(!manque.length?`F9 : l’inventaire a déjà un exemplaire de chaque consommable (${sacPlaces()}/${SAC_MAX}).`
    :`F9 : ${pris.length} consommable${pris.length>1?'s':''} ajouté${pris.length>1?'s':''}${retires?`, ${retires} doublon${retires>1?'s':''} retiré${retires>1?'s':''} pour faire de la place`:''} (${sacPlaces()}/${SAC_MAX}).`,'good');
  SFX.spot();sacFix();SAC_H='';INV_H=null;render();}
const fumDedans=()=>!!(G.fum&&G.fum[idx(G.px,G.py)]);

/* ----- La foreuse change d'allure : immobilisée (damier bio / bâti), engluée (teinte bio), camouflée (trame), en surrégime (rouge) ----- */
const ROBOT_VAR=new WeakMap();
function robotTuile(){const base=TL['robot_'+(G.face||'u')],E=G.eff||{};
  // tenue par un Bloqueur, donc immobilisée : le même damier bio / bâti qu'un ennemi étourdi (22 novembre 2026)
  if(base&&tenuPar())return tuileEtourdie(base);
  const mode=E.camo>0?'camo':E.glu>0?'glu':E.berserk>0?'bers':null;if(!mode||!base)return base;
  const col=mode==='glu'?PAL['2']:mode==='camo'?PAL['3']:(PAL['4']||'#ff3b3b'),cle=mode+col;let m=ROBOT_VAR.get(base);if(!m){m={};
    ROBOT_VAR.set(base,m);}if(m[cle])return m[cle];
  const c=document.createElement('canvas');c.width=c.height=16;const x=c.getContext('2d');x.drawImage(base,0,0);
  try{const im=x.getImageData(0,0,16,16),p=im.data,n=parseInt(col.slice(1),16),R=n>>16&255,Gv=n>>8&255,B=n&255;
    for(let j=0;j<16;j++)for(let i=0;i<16;i++){const q=(j*16+i)*4;if(!p[q+3])continue;const noir=p[q]+p[q+1]+p[q+2]<40;
      if(mode==='camo'){if(noir||(i+j)%2)p[q+3]=0;else{p[q]=R;p[q+1]=Gv;p[q+2]=B;}}
      else if(!noir){p[q]=R;p[q+1]=Gv;p[q+2]=B;}}
    x.putImageData(im,0,0);}catch(e){}
  return m[cle]=c;}

/* ----- Réglages : Lab → Items ----- */
const itemsEtat=()=>{const mod={},req={},de={};for(const k in ITEMS){const d=ITEMS[k];if(!d.slot)continue;mod[k]=Object.assign({},d.mod);
  if(d.req!=null)req[k]=d.req;if(d.de)de[k]=Object.assign({},d.de);}
  return {val:JSON.parse(JSON.stringify(ITEM_VAL)),prix:Object.assign({},FAB_PRIX),drops:Object.assign({},DROPS),mod,req,de};};
const ITEMS_DEF=itemsEtat();
function itemsApplique(o){const num=v=>typeof v==='number'&&isFinite(v);if(!o||typeof o!=='object')return;
  for(const k in o.val||{})if(ITEM_VAL[k])for(const f in o.val[k])if(f in ITEM_VAL[k]&&num(o.val[k][f]))ITEM_VAL[k][f]=o.val[k][f];
  /* 28 novembre 2026 : surrégime et camouflage passent de 10 à 30 battements. Un réglage enregistré qui vaut encore l'ancienne
     valeur d'origine (10) n'a jamais été retouché : il suit la nouvelle valeur ; toute autre valeur est celle du joueur. */
  for(const k of ['berserk','camo'])if(o.val&&o.val[k]&&o.val[k].duree===10)ITEM_VAL[k].duree=30;
  for(const k in o.prix||{})if(k in FAB_PRIX&&num(o.prix[k]))FAB_PRIX[k]=o.prix[k];
  for(const k in o.drops||{})if(k in DROPS&&num(o.drops[k]))DROPS[k]=o.drops[k];
  for(const k in o.mod||{})if(ITEMS[k]&&ITEMS[k].slot)for(const f in o.mod[k])if(MODS[f]&&num(o.mod[k][f]))ITEMS[k].mod[f]=o.mod[k][f];
  for(const k in o.req||{})if(ITEMS[k]&&ITEMS[k].req!=null&&num(o.req[k]))ITEMS[k].req=o.req[k];
  for(const k in o.de||{})if(ITEMS[k]&&ITEMS[k].de)for(const f of ['n','f','p'])if(num(o.de[k][f]))ITEMS[k].de[f]=o.de[k][f];
  itemTxt();}
try{itemsApplique(JSON.parse(localStorage.getItem('np-items')||'null'));}catch(e){}
// 22 novembre 2026, choix de l'utilisateur : +5 % de dégâts par point de POW en trop (8 % quelques heures). Un réglage déjà gardé à 8 est ramené à 5, une fois.
try{if(localStorage.getItem('np-mig-pow')!=='5'){localStorage.setItem('np-mig-pow','5');
  if(ITEM_VAL.puissance.deg===8){ITEM_VAL.puissance.deg=5;
  if(localStorage.getItem('np-items'))localStorage.setItem('np-items',JSON.stringify(itemsEtat()));}}}catch(e){}
itemTxt();
function saveItems(){try{localStorage.setItem('np-items',JSON.stringify(itemsEtat()));}catch(e){}touchLocal();itemTxt();
  SAC_H='';INV_H=null;}
const ITEMS_FAM=[['Consommables',k=>CONSO[k]||k==='cle'],['Butin',k=>k==='matiere'],['Armes',k=>ITEMS[k].slot==='arme'],['Armures',
  k=>ITEMS[k].slot==='armure'],['Accessoires',k=>ITEMS[k].slot==='acc']];
function buildItems(){TOUT_CONNU=true;
  const champ=(lib,chemin,v,min,max)=>`<label class="itf"><span>${lib}</span><input type="number" data-c="${chemin}" value="${v}" min="${min}" max="${max}" step="1"></label>`;
  let h='';
  for(const [titre,test] of ITEMS_FAM){const l=Object.keys(ITEMS).filter(k=>!ITEMS[k].plan&&test(k));if(!l.length)continue;
    h+=`<h3>${titre}</h3>`;
    for(const k of l){const d=ITEMS[k],f=[];
      if(k in FAB_PRIX)f.push(champ('Prix (Matière {µ})',`prix.${k}`,FAB_PRIX[k],0,500));
      for(const c in ITEM_VAL[k]||{})f.push(champ(ITEM_VAL_LIB[c]||c,`val.${k}.${c}`,ITEM_VAL[k][c],0,500));
      if(d.req!=null)f.push(champ('POW requis',`req.${k}`,d.req,0,30));
      if(d.de){f.push(champ('Dés',`de.${k}.n`,d.de.n,1,9));f.push(champ('Faces',`de.${k}.f`,d.de.f,1,30));
        f.push(champ('Bonus',`de.${k}.p`,d.de.p,0,60));}
      for(const m in d.mod||{})f.push(champ(MODS[m]?MODS[m][0]:m,`mod.${k}.${m}`,d.mod[m],-200,200));
      const tu=(k==='matiere'?TL.mat2:TL[k==='cle'?'cle':'o_'+k])||TL.objet;let ic='';try{ic=tu.toDataURL();}catch(e){}
      h+=`<div class="itl"><img src="${ic}" alt="" width="32" height="32"><div><b>${(d.vrai||d).n}</b><small>${k in FAB_PRIX?'fabricable (plan)':k==='puissance'?'se trouve, ne se fabrique pas':k==='matiere'?'butin':d.base?'équipement de départ':'se trouve'} · ${(d.vrai||d).eff||(d.slot?fabEffet(k):'')}</small></div><div class="itfs">${f.join('')||'<i>rien à régler</i>'}</div></div>`;}}
  h+=`<h3>Butin des robots abattus (chance en %)</h3><div class="itl"><div></div><div><small>Ce qu’un robot lâche : Matière {µ} 40 %, capsule 35 %, plan 18 %, équipement 7 %.</small></div><div class="itfs">${BEASTS.map(b=>champ(b.n,`drops.${b.key}`,DROPS[b.key]||0,0,100)).join('')}</div></div>`;
  $('itList').innerHTML=h;TOUT_CONNU=false;}
function itemsLit(){const o=itemsEtat();for(const e of $('itList').querySelectorAll('input[data-c]')){const v=+e.value;
  if(!isFinite(v))continue;const c=e.dataset.c.split('.');let p=o;for(let n=0;n<c.length-1;n++)p=p[c[n]]=p[c[n]]||{};
  p[c[c.length-1]]=Math.round(v);}return o;}
function openItems(){if(TRAV)stopTravel();if(REST)stopRest();if(EXPL)stopExplore();buildItems();$('itMsg').textContent='';
  $('items').hidden=false;$('items').querySelector('.mcard').focus();}
function closeItems(){$('items').hidden=true;$('itBtn').focus();render();}
if(typeof document!=='undefined'&&$('itBtn')){
  $('itBtn').onclick=openItems;$('itClose').onclick=closeItems;
  $('items').addEventListener('pointerdown',ev=>{if(ev.target===$('items'))closeItems();});
  $('items').addEventListener('keydown',ev=>{if(ev.key==='Escape'){ev.preventDefault();closeItems();}ev.stopPropagation();});
  $('itList').addEventListener('change',()=>{itemsApplique(itemsLit());saveItems();$('itMsg').className='saved';$('itMsg').textContent='Modifié (gardé dans ce navigateur). « Enregistrer » l’envoie dans la base de l’artefact.';});
  $('itReset').onclick=()=>{itemsApplique(JSON.parse(JSON.stringify(ITEMS_DEF)));saveItems();buildItems();
    $('itMsg').textContent='Valeurs d’origine rétablies.';};
  $('itSave').onclick=()=>{itemsApplique(itemsLit());saveItems();
    if(typeof saveSettings==='function'&&DB)saveSettings($('itSave'),$('itMsg'));else{$('itMsg').className='saved ok';
    $('itMsg').textContent='Valeurs enregistrées dans ce navigateur.';}};}
