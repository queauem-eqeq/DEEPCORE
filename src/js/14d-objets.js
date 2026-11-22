/* ---------- Objets : butin, noms de code, visée, plans (22 novembre 2026) ----------
   1. Rien au départ : la foreuse n'a que son outil et sa coque. Tout le reste se trouve (sol, robots abattus, dépôts,
      salles piégées, pièces secrètes) ou se fabrique.
   2. Consommables non identifiés : chaque sorte porte un nom de code tiré à chaque partie (« //KZ7-3FQ ») et la même
      tuile de capsule. Le premier usage, ou le plan de fabrication, révèle ce que c'est.
   3. Tout consommable se vise, comme la charge sismique : une case (ou une zone) jusqu'à VISEE_R cases. Sur la foreuse,
      il la sert ; sur un ennemi, il sert l'ennemi (réparé, surrégime…) ou le frappe (batterie : décharge et étourdissement).
   4. Plans : le fabricateur ne propose que les objets dont on a trouvé le plan.
   5. Matière au sol (butin d'exploration), Module de puissance (POW +1 pour toujours), Surrégime, Camouflage optique.
   Ce que la foreuse sait (plans, capsules identifiées, noms de code) vit dans G.st.savoir : G.st suit la foreuse d'un niveau
   à l'autre. Valeurs réglables : Lab → Items (np-items). */
const ITEM_VAL_DEF={repar:{soin:50},batterie:{energie:50,choc:12,etourdi:6},charge:{degats:30},puissance:{pow:1,deg:5},
  berserk:{crit:50,duree:10},camo:{duree:10},balise:{rayon:20},court:{etourdi:10},matiere:{mat:15}};
const ITEM_VAL_LIB={soin:'Vie rendue',energie:'Énergie rendue',choc:'Dégâts de la décharge',etourdi:'Étourdissement (battements)',degats:'Dégâts',pow:'POW gagné',deg:'Dégâts par point de POW en trop (%)',crit:'CRIT en plus (points)',duree:'Durée (battements)',rayon:'Rayon de l’appel (cases)',mat:'Matière rendue'};
let ITEM_VAL=JSON.parse(JSON.stringify(ITEM_VAL_DEF));
// chance qu'un robot abattu lâche un objet, par espèce (clé du Bestiaire)
const DROPS_DEF={crabos:8,cafar:6,mastok:90,brochon:10,mine:0,paralyzor:25,gardien:60,artilleur:35,drone:5,soudeur:45,englueur:35};
let DROPS=Object.assign({},DROPS_DEF);
const PLAN_DOUBLON=10;   // un plan déjà connu se recycle en Matière

Object.assign(ITEMS,{
  puissance:{n:'Module de puissance',conso:1,son:'analyse',eff:'POW +1, pour toujours',
    d:'Un étage d’alimentation de plus : POW +1 définitivement. Les coups portent plus fort et un équipement plus lourd devient utilisable.',
    plein:st=>false,non:'',use:st=>'',
    art:["    ┌─────┐    ", "   ─┤  ▲  ├─   ", "   ─┤ ▲▲▲ ├─   ", "   ─┤  █  ├─   ", "    └─────┘    "],
    col:["....wwwwwww....", "...ww..1..ww...", "...ww.111.ww...", "...ww..1..ww...", "....wwwwwww...."]},
  berserk:{n:'Surrégime',conso:1,son:'crit',eff:'CRIT +50 pendant 8 battements',
    d:'Débride le moteur quelques battements : presque tous les coups sont critiques. Injecté à un ennemi, c’est lui qui frappe en critique.',
    plein:st=>false,non:'',use:st=>'',
    art:["          ▄▄   ", "        ▄▀▒▀   ", "      ▄▀▒▄▀    ", "    ▄▀▒▄▀      ", "  ▄█▄▄▀        ", "  ▀▀           "],
    col:["..........ww...", "........wwrw...", "......wwrww....", "....wwrww......", "..wwwww........", "..ww..........."]},
  camo:{n:'Camouflage optique',conso:1,son:'smoke',eff:'Invisible 10 battements',
    d:'La coque renvoie ce qui l’entoure : les ennemis ne voient plus la foreuse, sauf au contact. Un coup ou un forage rompt l’effet.',
    plein:st=>false,non:'',use:st=>'',
    art:["   ·  ·  ·  ·  ", "  ·  ▄▄▄▄▄  ·  ", "  · █░▒█▒░█ ·  ", "  ·  ▀▀▀▀▀  ·  ", "   ·  ·  ·  ·  "],
    col:["...3..3..3..3..", "..3..wwwww..3..", "..3.w33w33w.3..", "..3..wwwww..3..", "...3..3..3..3.."]},
  // Capsules néfastes (22 novembre 2026) : mauvaises sur la foreuse, utiles lancées ailleurs. C'est ce qui fait de l'identification un pari.
  balise:{n:'Balise',conso:1,son:'spot',eff:'Appelle les ennemis à 20 cases',
    d:'Un émetteur qui hurle : tous les ennemis alentour convergent vers lui. Sur la foreuse, c’est une catastrophe ; lancée au loin, c’est un leurre.',
    plein:st=>false,non:'',use:st=>'',
    art:["      ) ) )    ", "     ▄▄█▄▄     ", "     █ ● █     ", "     ▀▀█▀▀     ", "    ▄▄▄█▄▄▄    "],
    col:["......r.r.r....", ".....wwwww.....", ".....w.r.w.....", ".....wwwww.....", "....wwwwwww...."]},
  court:{n:'Court-circuit',conso:1,son:'laser',eff:'Énergie à zéro, ou ennemi hors service',
    d:'Une surtension brutale. Sur la foreuse : l’énergie tombe à zéro. Lancé sur un ennemi : il reste hors service 10 battements, sans dégât.',
    plein:st=>false,non:'',use:st=>'',
    art:["     ▄▄▄▄▄     ", "    █  ▄▀ █    ", "    █ ▀▄  █    ", "    █  ▄▀ █    ", "     ▀▀▀▀▀     "],
    col:[".....wwwww.....", "....w..11.w....", "....w.11..w....", "....w..11.w....", ".....wwwww....."]},
  matiere:{n:'Matière',mat:1,eff:'Matière +15',d:'Un bloc de Matière brute : il rejoint la réserve dès qu’on le ramasse.',
    art:["     ▄▄        ", "   ▄████▄  ▄▄  ", "  ████████████ ", "   ▀████████▀  ", "      ▀▀▀▀     "],
    col:[".....11........", "...11w111..11..", "..111111111w11.", "...1111111111..", "......1111....."]}});
Object.assign(FAB_PRIX,{berserk:20,camo:24,balise:12,court:16});
const FAB_PRIX_DEF=Object.assign({},FAB_PRIX);

/* ----- Ce que la foreuse sait ----- */
// zone d'un consommable : r = 0 une case, 1 un carré de 3 × 3, 'f' le disque du fumigène ; soi : la visée s'ouvre sur la foreuse
const CONSO={repar:{r:0,soi:1},batterie:{r:0,soi:1},fumigene:{r:'f',soi:1},charge:{r:1,soi:0},puissance:{r:0,soi:1},berserk:{r:0,soi:1},camo:{r:0,soi:1},balise:{r:0,soi:1},court:{r:0,soi:1}};
let SAV_GARDE=null;   // pendant la génération du niveau suivant, G.st est neuf : on garde la main sur le savoir de la foreuse
const codeTire=()=>{const L='BDFGHJKLMNPQRSTVWXZ',H='0123456789ABCDEF',l=()=>L[rnd(0,L.length-1)],h=()=>H[rnd(0,15)];return `//${l()}${l()}${rnd(2,9)}-${h()}${h()}${l()}`;};
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
function itemTxt(){const V=ITEM_VAL,v=k=>ITEMS[k].vrai;
  v('repar').eff=`Vie +${V.repar.soin}`;v('repar').d=`Essaim de micro-robots réparateurs : rend ${V.repar.soin} points de vie à ce qu’il touche — la foreuse, ou un ennemi.`;
  v('batterie').eff=`Énergie +${V.batterie.energie}, ou décharge`;v('batterie').d=`Sur la foreuse : rend ${V.batterie.energie} points d’énergie. Lancée sur un ennemi : ${V.batterie.choc} dégâts, et il reste étourdi ${V.batterie.etourdi} battements.`;
  v('fumigene').d='Un nuage opaque là où on le lance : il cache la vue des deux côtés. Si la foreuse est dedans, les ennemis perdent sa trace.';
  v('charge').eff=`${V.charge.degats} dégâts, roche brisée, 3 × 3`;v('charge').d=`Un carré de 3 × 3, jusqu’à 4 cases : ${V.charge.degats} dégâts et roche brisée, même la roche dure. Très bruyante.`;
  v('puissance').eff=`POW +${V.puissance.pow}, pour toujours`;
  v('berserk').eff=`CRIT +${V.berserk.crit} pendant ${V.berserk.duree} battements`;
  v('camo').eff=`Invisible ${V.camo.duree} battements`;
  v('balise').eff=`Appelle les ennemis à ${V.balise.rayon} cases`;v('court').eff=`Énergie à zéro, ou ennemi hors service ${V.court.etourdi} battements`;
  ITEMS.matiere.eff=`Matière +${V.matiere.mat}`;}
// plans de fabrication : un objet « plan_<clé> » par objet fabricable ; jamais dans le sac, il s'apprend en le ramassant
const ART_PLAN={art:["  ┌─────────┐  ", "  │ ┌──┐ ── │  ", "  │ │  │ ── │  ", "  │ └──┘ ── │  ", "  └─────────┘  "],col:["..wwwwwwwwwww..", "..w.2222.22.w..", "..w.2..2.22.w..", "..w.2222.22.w..", "..wwwwwwwwwww.."]};
function plansInit(){for(const k in FAB_PRIX)if(ITEMS[k]&&!ITEMS['plan_'+k]){const o={plan:k,art:ART_PLAN.art,col:ART_PLAN.col,d:'Un plan de fabrication : une fois ramassé, le fabricateur sait produire cet objet.',eff:'Plan de fabrication'};
  Object.defineProperty(o,'n',{get:()=>'Plan : '+((ITEMS[k].vrai||ITEMS[k]).n),enumerable:true});ITEMS['plan_'+k]=o;}}
plansInit();
const critBonus=()=>G&&G.eff&&G.eff.berserk>0?ITEM_VAL.berserk.crit:0;
function camoCasse(){if(G&&G.eff&&G.eff.camo>0){G.eff.camo=0;sayMore('Le camouflage optique se rompt.','warn');}}
// la foreuse est-elle tenue par un Bloqueur ? (un Bloqueur étourdi lâche prise)
const tenuPar=()=>(G.beasts||[]).find(b=>b.tient&&!(b.stun>0)&&Math.max(Math.abs(b.x-G.px),Math.abs(b.y-G.py))<=1);

/* ----- Butin ----- */
const PLAN_RANG=k=>{const d=ITEMS[k];return ['repar','batterie','fumigene','cle','balise'].includes(k)?1:d.conso||d.slot==='acc'?2:3;};   // objets simples d'abord, les meilleurs plus bas
const nivCarte=()=>Math.max(1,Math.min(3,(typeof G!=='undefined'&&G&&G.niv)||(typeof NIV_GEN==='number'?NIV_GEN:1)));
let PLANS_POSES={};   // plans déjà posés sur la carte en cours de génération : pas deux fois le même
function planTire(){const s=savoir(),niv=nivCarte(),lib=Object.keys(FAB_PRIX).filter(k=>ITEMS[k]&&!s.plans[k]&&!PLANS_POSES[k]);
  let l=lib.filter(k=>PLAN_RANG(k)<=niv);if(!l.length)l=lib.filter(k=>PLAN_RANG(k)<=niv+1);if(!l.length)return 'matiere';
  const k=l[rnd(0,l.length-1)];PLANS_POSES[k]=1;return 'plan_'+k;}
const CONSO_POIDS=[['repar',5],['batterie',4],['fumigene',3],['charge',3],['berserk',2],['camo',2],['balise',2],['court',2]];
function consoTire(){let t=CONSO_POIDS.reduce((a,c)=>a+c[1],0),r=Math.random()*t;for(const [k,p] of CONSO_POIDS){if((r-=p)<0)return k;}return 'repar';}
function equipTire(){const l=Object.keys(ITEMS).filter(k=>ITEMS[k].slot&&!ITEMS[k].base&&k!=='usine'&&PLAN_RANG(k)<=nivCarte()+1);return l.length?l[rnd(0,l.length-1)]:'matiere';}
// contenu d'un coffre : dépôt derrière une grille, appât d'une salle piégée, pièce secrète
function butinCoffre(q){const h=p=>Math.random()<p;
  if(q==='depot')return [planTire(),consoTire(),h(.5)?equipTire():consoTire(),'matiere'];
  if(q==='piege')return [h(.5)?planTire():equipTire(),consoTire(),'matiere'];
  return [consoTire(),'matiere',...(h(.5)?[planTire()]:[]),...(h(.25)?['puissance']:[])];}
// un robot abattu lâche parfois un objet (les relais d'une salle piégée, jamais : b.nd)
function butinMort(b){if(!b||b.nd)return;const sp=BEASTS[b.sp],p=DROPS[sp.key]||0;if(Math.random()*100>=p)return;
  const i=idx(b.x,b.y);if(blocks(G.t[i])||G.t[i]===DEEP)return;const r=Math.random(),k=r<.4?'matiere':r<.75?consoTire():r<.93?planTire():equipTire();
  G.items=G.items||{};(G.items[i]=G.items[i]||[]).push(k);if(typeof vis!=='undefined'&&vis[i])sayMore(`${LeNom(sp)} lâche quelque chose.`,'good');}
/* Butin d'exploration : les pièces secrètes, puis les culs-de-sac et les coins reculés — les cases les plus loin du trajet
   arrivée → site, là où plus rien ne mène ailleurs. Le plus reculé porte un Module de puissance, le suivant un plan,
   puis une capsule, et le reste de la Matière. Appelé à la fin de la génération, après les machines. */
function butinExplo(){const N=W*H,t=G.t,dep=idx(G.px,G.py),s0=G.sites&&G.sites[0],site=s0?idx(s0.x,s0.y):-1;G.items=G.items||{};G.butinN={secret:0,explo:0};
  const pose=(i,k)=>{(G.items[i]=G.items[i]||[]).push(k);};
  const bfs=(src,secret)=>{const d=new Int32Array(N).fill(-1),q=src.slice();for(const c of q)d[c]=0;
    for(let a=0;a<q.length;a++){const c=q[a],x=c%W,y=(c/W)|0;for(const [dx,dy] of D4){const X=x+dx,Y=y+dy;if(X<1||Y<1||X>=W-1||Y>=H-1)continue;const j=idx(X,Y),v=t[j];
      if(d[j]<0&&(!blocks(v)||v===LOCK||(secret&&v===SECRET))&&v!==DEEP){d[j]=d[c]+1;q.push(j);}}}return d;};
  const d=bfs([dep],false),ds=bfs([dep],true);
  const libre=i=>(t[i]===FLOOR||t[i]===GROUND||t[i]===FLAT||t[i]===RUBBLE)&&i!==site&&i!==dep&&!(G.items[i]&&G.items[i].length)&&!(G.cles&&G.cles[i])&&!(G.lz&&G.lz[i])&&!(G.soc&&G.soc[i]!=null)&&!(G.ore&&G.ore[i])&&!(G.sites||[]).some(s=>idx(s.x,s.y)===i);
  // pièces secrètes : ce qu'on n'atteint qu'en passant une porte dérobée ; le butin est au fond
  const vu=new Uint8Array(N);
  for(let i=0;i<N;i++){if(vu[i]||ds[i]<0||d[i]>=0||blocks(t[i]))continue;const comp=[i];vu[i]=1;
    for(let a=0;a<comp.length;a++){const c=comp[a],x=c%W,y=(c/W)|0;for(const [dx,dy] of D4){const j=idx(x+dx,y+dy);if(j>=0&&j<N&&!vu[j]&&ds[j]>=0&&d[j]<0&&!blocks(t[j])){vu[j]=1;comp.push(j);}}}
    const c=comp.filter(libre).sort((a,b)=>ds[b]-ds[a]);if(!c.length)continue;
    butinCoffre('secret').forEach((k,n)=>pose(c[Math.min(n,c.length-1)],k));G.butinN.secret++;}
  // trajet principal, puis l'écart de chaque case à ce trajet
  const chemin=[dep];if(site>=0&&d[site]>=0){let c=site;while(c!==dep){chemin.push(c);const x=c%W,y=(c/W)|0;let m=c;for(const [dx,dy] of D4){const j=idx(x+dx,y+dy);if(d[j]>=0&&d[j]<d[m])m=j;}if(m===c)break;c=m;}}
  const dc=bfs(chemin,false),nb=Math.max(5,Math.min(10,Math.round(N/600))),pris=[];
  // rien ne mène plus loin, et un mur au moins sur trois côtés : un fond de cul-de-sac ou un coin. On commence par les plus reculés
  // (12 pas d'écart au trajet, 10 cases entre deux butins), puis on desserre si la carte en offre trop peu.
  for(const [ecart,esp] of [[12,10],[8,8],[5,6]]){if(pris.length>=nb)break;const cand=[];
    for(let y=2;y<H-2;y++)for(let x=2;x<W-2;x++){const i=idx(x,y);if(d[i]<0||dc[i]<ecart||!libre(i)||pris.includes(i))continue;let n=0,max=true,porte=false;
      for(const [dx,dy] of DIRS){const j=idx(x+dx,y+dy),v=t[j];if(v===DOOR||v===LOCK||v===SECRET)porte=true;if(d[j]>=0){n++;if(d[j]>d[i])max=false;}}
      if(max&&!porte&&n<=5)cand.push(i);}
    cand.sort((a,b)=>dc[b]-dc[a]);
    for(const i of cand){if(pris.length>=nb)break;if(pris.some(j=>Math.max(Math.abs(i%W-j%W),Math.abs(((i/W)|0)-((j/W)|0)))<esp))continue;pris.push(i);}}
  pris.forEach((i,n)=>pose(i,n===0?'puissance':n===1?planTire():n===2?consoTire():'matiere'));G.butinN.explo=pris.length;}

/* ----- Ramassage : la Matière rejoint la réserve, un plan s'apprend, le reste va au sac ----- */
function butinPrend(c,more){const l=G.items&&G.items[c];if(!l)return;const dire=more?sayMore:invSay,reste=[];
  for(const k of l){const d=ITEMS[k];
    if(d&&d.mat){const m=ITEM_VAL.matiere.mat;G.st.matiere=(G.st.matiere||0)+m;addFx({kind:'num',x:G.px,y:G.py,txt:'+'+m,col:PAL['1'],dur:750});dire(`Matière ramassée : +${m} (réserve ${G.st.matiere}).`,'good');SFX.spot();}
    else if(d&&d.plan){const s=savoir();if(s.plans[d.plan]){G.st.matiere=(G.st.matiere||0)+PLAN_DOUBLON;dire(`${d.n} : déjà connu, recyclé en Matière (+${PLAN_DOUBLON}).`,'info');}
      else{s.plans[d.plan]=1;identifier(d.plan);dire(`${d.n} appris : le fabricateur sait maintenant le produire.`,'good');}SFX.analyse();}
    else reste.push(k);}
  if(reste.length)G.items[c]=reste;else delete G.items[c];}

/* ----- Visée de tous les consommables ----- */
const FUM_PORTEE=3;
function viseeCases(){if(!VISEE)return [];const o=G.inv[VISEE.i],c=o&&CONSO[o.k],r=c?c.r:1,out=[];
  if(r==='f'){for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++)if(dx*dx+dy*dy<=FUM_R2)out.push([VISEE.x+dx,VISEE.y+dy]);return out;}
  for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)out.push([VISEE.x+dx,VISEE.y+dy]);return out;}
function retire(c){const isB=(G.beasts||[]).includes(c);(isB?G.beasts:G.animals).splice((isB?G.beasts:G.animals).indexOf(c),1);bleed(c.x,c.y);if(isB)butinMort(c);}
function consoCible(i,x,y){const o=G.inv[i];if(!o)return;const k=o.k,d=ITEMS[k],V=ITEM_VAL[k]||{},st=G.st,nom=d.vrai.n,connu=identifie(k);
  const moi=x===G.px&&y===G.py,b=beastAt(x,y),an=b?null:animalAt(x,y),c=b||an,sp=b?BEASTS[b.sp]:an?SPECIES[an.sp]:null;
  // objet connu, inutile sur la foreuse : refusé, rien n'est dépensé
  if(connu&&moi&&((k==='repar'&&st.vie>=st.vieMax)||(k==='batterie'&&st.energie>=st.energieMax))){say(k==='repar'?'Vie déjà au maximum : réparobots inutiles.':'Énergie déjà au maximum : batterie inutile.','warn');SFX.blocked();render();return;}
  VISEE=null;let txt='',ton='good',son=d.son;const num=(t,col)=>addFx({kind:'num',x,y,txt:t,col,dur:900});
  if(k==='repar'){if(moi){const a=st.vie;st.vie=Math.min(st.vieMax,st.vie+V.soin);txt=`+${Math.round(st.vie-a)} PV`;addFx({kind:'soin',x,y,dur:1000,gr:fxGrains(12)});}
    else if(c){const m=pvDe(sp),a=c.hp??m;c.hp=Math.min(m,a+V.soin);txt=`${leNom(sp)} est réparé (+${c.hp-a} PV)`;ton='warn';num('+'+(c.hp-a),PAL['2']);addFx({kind:'soin',x,y,dur:1000,gr:fxGrains(12)});}
    else{txt='les réparobots se dispersent sans rien trouver à réparer';ton='warn';}}
  else if(k==='batterie'){if(moi){const a=st.energie;st.energie=Math.min(st.energieMax,st.energie+V.energie);txt=`+${Math.round(st.energie-a)} énergie`;addFx({kind:'ener',x,y,dur:1000,gr:fxGrains(12)});}
    else if(c){c.hp=(c.hp??pvDe(sp))-V.choc;num('-'+V.choc,PAL['3']);son='laser';addFx({kind:'flash',beast:c,dur:220});
      if(c.hp<=0){retire(c);txt=`la décharge détruit ${leNom(sp)}`;}
      else{c.stun=V.etourdi;if(b){b.hunt=1;spot(b);}else{an.aware=1;spot(an);}txt=`${leNom(sp)} est électrisé : −${V.choc} PV, étourdi ${V.etourdi} battements`;}engage();}
    else{txt='la décharge se perd dans le sol';ton='warn';}}
  else if(k==='fumigene'){fumPose(x,y);txt=fumDedans()?'le nuage se répand, les ennemis perdent votre trace':'le nuage se répand là-bas';}
  else if(k==='puissance'){if(moi){st.power=(st.power||0)+V.pow;txt=`POW +${V.pow} (POW ${st.power})`;addFx({kind:'ener',x,y,dur:1000,gr:fxGrains(12)});}
    else if(b){b.pow=(b.pow||0)+1;txt=`${leNom(sp)} gagne en puissance : ses coups portent plus fort`;ton='warn';num('POW+',PAL['3']);}
    else{txt='le module grille sans rien alimenter';ton='warn';}}
  else if(k==='berserk'){if(moi){G.eff.berserk=V.duree;txt=`surrégime : CRIT +${V.crit} pendant ${V.duree} battements`;}
    else if(b){b.bers=V.duree;b.hunt=1;spot(b);txt=`${leNom(sp)} passe en surrégime : ses coups sont critiques pendant ${V.duree} battements`;ton='warn';num('!!',PAL['3']);}
    else{txt='la dose se perd';ton='warn';}}
  else if(k==='camo'){if(moi){G.eff.camo=V.duree;for(const e of G.beasts||[])if(e.hunt&&Math.max(Math.abs(e.x-G.px),Math.abs(e.y-G.py))>1){e.hunt=0;forget(e);}txt=`la foreuse disparaît pendant ${V.duree} battements`;}
    else if(b){b.camo=V.duree;txt=`${leNom(sp)} disparaît pendant ${V.duree} battements`;ton='warn';}
    else{txt='le voile se dissipe sans rien couvrir';ton='warn';}}
  else if(k==='balise'){let n=0;for(const e of G.beasts||[])if(Math.max(Math.abs(e.x-x),Math.abs(e.y-y))<=V.rayon&&!(e.stun>0)){e.hunt=1;e.mem=[x,y];if(moi)spot(e);n++;}
    addFx({kind:'shake',amp:4,dur:250});txt=moi?`la balise hurle sur la foreuse : ${n} ennemi${n>1?'s':''} alentour ${n>1?'savent':'sait'} où elle est`:`la balise hurle là-bas : ${n} ennemi${n>1?'s':''} y ${n>1?'courent':'court'}`;ton=moi?'warn':'good';}
  else if(k==='court'){if(moi){st.energie=0;txt='surtension : l’énergie tombe à zéro';ton='warn';addFx({kind:'shake',amp:5,dur:250});}
    else if(b){b.stun=V.etourdi;b.tient=0;txt=`${leNom(sp)} est hors service pendant ${V.etourdi} battements`;num('HS',PAL['3']);addFx({kind:'flash',beast:b,dur:220});}
    else{txt='la surtension se perd dans le sol';ton='warn';}}
  const neuf=identifier(k);invTake(i);sacFix();SAC_H='';
  say(`${neuf?`Capsule ${savoir().codes[k]} : c’était ${nom}. `:''}${nom} : ${txt}.`,ton);(son&&SFX[son]?SFX[son]:SFX.spot)();
  if(consoTemps())return;invChanged();}
const fumDedans=()=>!!(G.fum&&G.fum[idx(G.px,G.py)]);

/* ----- La foreuse change d'allure : engluée (teinte bio), camouflée (trame), en surrégime (rouge) ----- */
const ROBOT_VAR=new WeakMap();
function robotTuile(){const base=TL['robot_'+(G.face||'u')],E=G.eff||{},mode=E.camo>0?'camo':E.glu>0?'glu':E.berserk>0?'bers':null;if(!mode||!base)return base;
  const col=mode==='glu'?PAL['2']:mode==='camo'?PAL['3']:(PAL['4']||'#ff3b3b'),cle=mode+col;let m=ROBOT_VAR.get(base);if(!m){m={};ROBOT_VAR.set(base,m);}if(m[cle])return m[cle];
  const c=document.createElement('canvas');c.width=c.height=16;const x=c.getContext('2d');x.drawImage(base,0,0);
  try{const im=x.getImageData(0,0,16,16),p=im.data,n=parseInt(col.slice(1),16),R=n>>16&255,Gv=n>>8&255,B=n&255;
    for(let j=0;j<16;j++)for(let i=0;i<16;i++){const q=(j*16+i)*4;if(!p[q+3])continue;const noir=p[q]+p[q+1]+p[q+2]<40;
      if(mode==='camo'){if(noir||(i+j)%2)p[q+3]=0;else{p[q]=R;p[q+1]=Gv;p[q+2]=B;}}
      else if(!noir){p[q]=R;p[q+1]=Gv;p[q+2]=B;}}
    x.putImageData(im,0,0);}catch(e){}
  return m[cle]=c;}

/* ----- Réglages : Lab → Items ----- */
const itemsEtat=()=>{const mod={},req={},de={};for(const k in ITEMS){const d=ITEMS[k];if(!d.slot)continue;mod[k]=Object.assign({},d.mod);if(d.req!=null)req[k]=d.req;if(d.de)de[k]=Object.assign({},d.de);}
  return {val:JSON.parse(JSON.stringify(ITEM_VAL)),prix:Object.assign({},FAB_PRIX),drops:Object.assign({},DROPS),mod,req,de};};
const ITEMS_DEF=itemsEtat();
function itemsApplique(o){const num=v=>typeof v==='number'&&isFinite(v);if(!o||typeof o!=='object')return;
  for(const k in o.val||{})if(ITEM_VAL[k])for(const f in o.val[k])if(f in ITEM_VAL[k]&&num(o.val[k][f]))ITEM_VAL[k][f]=o.val[k][f];
  for(const k in o.prix||{})if(k in FAB_PRIX&&num(o.prix[k]))FAB_PRIX[k]=o.prix[k];
  for(const k in o.drops||{})if(k in DROPS&&num(o.drops[k]))DROPS[k]=o.drops[k];
  for(const k in o.mod||{})if(ITEMS[k]&&ITEMS[k].slot)for(const f in o.mod[k])if(MODS[f]&&num(o.mod[k][f]))ITEMS[k].mod[f]=o.mod[k][f];
  for(const k in o.req||{})if(ITEMS[k]&&ITEMS[k].req!=null&&num(o.req[k]))ITEMS[k].req=o.req[k];
  for(const k in o.de||{})if(ITEMS[k]&&ITEMS[k].de)for(const f of ['n','f','p'])if(num(o.de[k][f]))ITEMS[k].de[f]=o.de[k][f];
  itemTxt();}
try{itemsApplique(JSON.parse(localStorage.getItem('np-items')||'null'));}catch(e){}
// 22 novembre 2026, choix de l'utilisateur : +5 % de dégâts par point de POW en trop (8 % quelques heures). Un réglage déjà gardé à 8 est ramené à 5, une fois.
try{if(localStorage.getItem('np-mig-pow')!=='5'){localStorage.setItem('np-mig-pow','5');if(ITEM_VAL.puissance.deg===8){ITEM_VAL.puissance.deg=5;if(localStorage.getItem('np-items'))localStorage.setItem('np-items',JSON.stringify(itemsEtat()));}}}catch(e){}
itemTxt();
function saveItems(){try{localStorage.setItem('np-items',JSON.stringify(itemsEtat()));}catch(e){}touchLocal();itemTxt();SAC_H='';INV_H=null;}
const ITEMS_FAM=[['Consommables',k=>CONSO[k]||k==='cle'],['Butin',k=>k==='matiere'],['Armes',k=>ITEMS[k].slot==='arme'],['Armures',k=>ITEMS[k].slot==='armure'],['Accessoires',k=>ITEMS[k].slot==='acc']];
function buildItems(){TOUT_CONNU=true;const champ=(lib,chemin,v,min,max)=>`<label class="itf"><span>${lib}</span><input type="number" data-c="${chemin}" value="${v}" min="${min}" max="${max}" step="1"></label>`;
  let h='';
  for(const [titre,test] of ITEMS_FAM){const l=Object.keys(ITEMS).filter(k=>!ITEMS[k].plan&&test(k));if(!l.length)continue;h+=`<h3>${titre}</h3>`;
    for(const k of l){const d=ITEMS[k],f=[];
      if(k in FAB_PRIX)f.push(champ('Prix (Matière)',`prix.${k}`,FAB_PRIX[k],0,500));
      for(const c in ITEM_VAL[k]||{})f.push(champ(ITEM_VAL_LIB[c]||c,`val.${k}.${c}`,ITEM_VAL[k][c],0,500));
      if(d.req!=null)f.push(champ('POW requis',`req.${k}`,d.req,0,30));
      if(d.de){f.push(champ('Dés',`de.${k}.n`,d.de.n,1,9));f.push(champ('Faces',`de.${k}.f`,d.de.f,1,30));f.push(champ('Bonus',`de.${k}.p`,d.de.p,0,60));}
      for(const m in d.mod||{})f.push(champ(MODS[m]?MODS[m][0]:m,`mod.${k}.${m}`,d.mod[m],-200,200));
      const tu=TL[k==='cle'?'cle':'o_'+k]||TL.objet;let ic='';try{ic=tu.toDataURL();}catch(e){}
      h+=`<div class="itl"><img src="${ic}" alt="" width="32" height="32"><div><b>${(d.vrai||d).n}</b><small>${k in FAB_PRIX?'fabricable (plan)':k==='puissance'?'se trouve, ne se fabrique pas':k==='matiere'?'butin':d.base?'équipement de départ':'se trouve'} · ${(d.vrai||d).eff||(d.slot?fabEffet(k):'')}</small></div><div class="itfs">${f.join('')||'<i>rien à régler</i>'}</div></div>`;}}
  h+=`<h3>Butin des robots abattus (chance en %)</h3><div class="itl"><div></div><div><small>Ce qu’un robot lâche : Matière 40 %, capsule 35 %, plan 18 %, équipement 7 %.</small></div><div class="itfs">${BEASTS.map(b=>champ(b.n,`drops.${b.key}`,DROPS[b.key]||0,0,100)).join('')}</div></div>`;
  $('itList').innerHTML=h;TOUT_CONNU=false;}
function itemsLit(){const o=itemsEtat();for(const e of $('itList').querySelectorAll('input[data-c]')){const v=+e.value;if(!isFinite(v))continue;const c=e.dataset.c.split('.');let p=o;for(let n=0;n<c.length-1;n++)p=p[c[n]]=p[c[n]]||{};p[c[c.length-1]]=Math.round(v);}return o;}
function openItems(){if(TRAV)stopTravel();if(REST)stopRest();if(EXPL)stopExplore();buildItems();$('itMsg').textContent='';$('items').hidden=false;$('items').querySelector('.mcard').focus();}
function closeItems(){$('items').hidden=true;$('itBtn').focus();render();}
if(typeof document!=='undefined'&&$('itBtn')){
  $('itBtn').onclick=openItems;$('itClose').onclick=closeItems;
  $('items').addEventListener('pointerdown',ev=>{if(ev.target===$('items'))closeItems();});
  $('items').addEventListener('keydown',ev=>{if(ev.key==='Escape'){ev.preventDefault();closeItems();}ev.stopPropagation();});
  $('itList').addEventListener('change',()=>{itemsApplique(itemsLit());saveItems();$('itMsg').className='saved';$('itMsg').textContent='Modifié (gardé dans ce navigateur). « Enregistrer » l’envoie dans la base de l’artefact.';});
  $('itReset').onclick=()=>{itemsApplique(JSON.parse(JSON.stringify(ITEMS_DEF)));saveItems();buildItems();$('itMsg').textContent='Valeurs d’origine rétablies.';};
  $('itSave').onclick=()=>{itemsApplique(itemsLit());saveItems();if(typeof saveSettings==='function'&&DB)saveSettings($('itSave'),$('itMsg'));else{$('itMsg').className='saved ok';$('itMsg').textContent='Valeurs enregistrées dans ce navigateur.';}};}
