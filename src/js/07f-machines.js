/* ---------- Machines (21 novembre 2026) ----------
   Des salles-machines greffées sur les bâtiments, nées de la conversation « Couloir de tourelles laser ».
   Terrains (00-base), tous infranchissables, aucun ne coupe la vue :
     TURRET   tourelle laser encastrée dans un mur : elle tire un rayon droit à travers la pièce, jusqu'au premier obstacle.
              Deux tourelles voisines tirent ensemble : c'est le « laser large ». Touche toujours, MACH_DM dégâts.
     PYLON    croix laser : un pylône qui éclaire ses quatre cases voisines.
     LEVIER   la foreuse l'actionne en avançant dessus. Il déploie un pont ou coupe les lasers de sa salle.
     PILE     pile énergétique : la foreuse la pousse (jamais en diagonale). Posée sur un SOCLE, elle alimente ce qui y est relié.
     CHARGEUR rappelle sa pile à son point de départ : une pile coincée dans un coin ne bloque jamais rien pour de bon.
     GRILLE   grille d'énergie : fermée tant que son socle n'est pas alimenté. Elle garde un dépôt (du butin), jamais le chemin du site.
     STATION  station de réparation : une fois, vie et énergie au maximum ; le bruit attire les ennemis proches.
     FABRIC   fabricateur : fabrique des objets contre de la Matière (voir 14c-fabricateur).
   Pas d'avertissement avant un tir : chaque laser a sa période et son décalage, tirés à la génération, et le joueur apprend le
   rythme en regardant. Les lasers blessent tout le monde : un ennemi en chasse traverse le rayon, un ennemi calme l'évite.
   État, tout dans G (donc sauvegardé avec la partie) :
     G.mt    battements écoulés, pour le rythme des lasers
     G.las   [{k:'t'|'x', c:[cases des émetteurs], d:[dx,dy], per, off, on, g:salle, cut}]
     G.lz    {case:1} : cases qu'un laser peut éclairer (les ennemis calmes n'y entrent pas)
     G.circ  [{k:'levier'|'socle', c:case, on, perm, cib:[{t:'pont',c:[…]}|{t:'grille',c:[…],sous:[…]}|{t:'lasers',g}]}]
     G.soc   {case:n° de circuit} : les socles, dessinés sur le sol
     G.piles {case:{home, sous}} : chaque pile, sa case de départ et le sol qu'elle recouvre
     G.art[case] : sens d'une tourelle (0 bas, 1 haut, 2 droite, 3 gauche), état d'un levier ou d'une station. */
const MACH_DM=10;
const machTuile=v=>v>=TURRET&&v<=CHARGEUR;
// ce qu'une charge sismique réduit en gravats
const machCasse=v=>v===TURRET||v===PYLON||v===GRILLE||v===STATION||v===FABRIC||v===LEVIER||v===CHARGEUR;
const MACH_DIR=[[0,1],[0,-1],[1,0],[-1,0]],MACH_SENS=['d','u','r','l'];
let BATI_DER=null;   // {B, strs} du dernier appel réussi à batiments() : les pièces, pour y poser les machines (génération seulement)

/* ----- Lasers ----- */
// cases éclairées par un laser s'il tirait maintenant : le rayon part de la tourelle et s'arrête au premier obstacle (une pile en est un)
function machRayon(l){const out=[],t=G.t;
  if(l.k==='x'){const i=l.c[0];if(t[i]!==PYLON)return out;const x=i%W,y=(i/W)|0;for(const [dx,dy] of D4){const j=idx(x+dx,y+dy);
    if(!blocks(t[j])&&t[j]!==DOOR)out.push(j);}return out;}
  for(const i of l.c){if(t[i]!==TURRET)continue;let x=i%W+l.d[0],y=((i/W)|0)+l.d[1];
    while(x>0&&y>0&&x<W-1&&y<H-1){const j=idx(x,y),v=t[j];if(blocks(v)&&v!==CHASM||v===DOOR)break;out.push(j);x+=l.d[0];y+=l.d[1];}}
  return out;}
const machVivant=l=>l.c.some(i=>G.t[i]===(l.k==='x'?PYLON:TURRET));
// Un laser ne tire que si la foreuse le voit (22 novembre 2026) : la tourelle, le pylône ou une case de son rayon est en vue.
// Sans témoin, il reste éteint : les ennemis en vadrouille ne s'y blessent plus. MACH_VUE=false rend l'ancien comportement (essais).
let MACH_VUE=true;const MACH_SON=5;
const machVu=l=>!MACH_VUE||typeof vis==='undefined'||!vis||l.c.some(i=>vis[i])||machRayon(l).some(j=>vis[j]);
const machTire=(l,t)=>!l.cut&&machVivant(l)&&((((t??G.mt)||0)+l.off)%l.per)<l.on&&machVu(l);
// cases éclairées en ce moment : {case: 'v' | 'h' | 'x'}
function machLit(t){const m={};
  for(const l of G.las||[])if(machTire(l,t))for(const j of machRayon(l))m[j]=l.k==='x'?'x':l.d[0]?'h':'v';return m;}
function machZone(){const z={};for(const l of G.las||[])if(!l.cut&&machVivant(l))for(const j of machRayon(l))z[j]=1;G.lz=z;}
// un battement : les lasers avancent d'un cran, et tout ce qui se tient dans un rayon allumé prend MACH_DM
function machTick(){if(!G.las||!G.las.length||G.over)return;G.mt=(G.mt||0)+1;const lit=machLit();let n=0,vu=false;
  // le tir ne s'entend qu'en vue et à moins de 5 cases (22 novembre 2026)
  for(const k in lit){n++;const j=+k;if(vis[j]&&Math.max(Math.abs(j%W-G.px),Math.abs(((j/W)|0)-G.py))<MACH_SON)vu=true;}if(!n)return;
  if(vu&&typeof SFX!=='undefined')SFX.laser();
  for(const [liste,fiches] of [[G.beasts||[],BEASTS],[G.animals||[],SPECIES]])for(const o of [...liste]){
    const pieds=liste===G.beasts&&typeof FOOT!=='undefined'?FOOT:[[0,0]];if(!pieds.some(([dx,dy])=>lit[idx(o.x+dx,o.y+dy)]))continue;
    o.hp=(o.hp??pvDe(fiches[o.sp]))-MACH_DM;if(vis[idx(o.x,o.y)])addFx({kind:'num',x:o.x,y:o.y,txt:'-'+MACH_DM,col:PAL['3'],dur:750});
    if(o.hp<=0){liste.splice(liste.indexOf(o),1);bleed(o.x,o.y);if(liste===G.beasts&&typeof butinMort==='function')butinMort(o);
      if(vis[idx(o.x,o.y)])sayMore(`${LeNom(fiches[o.sp])} est détruit par un laser.`,'good');}}
  if(lit[idx(G.px,G.py)]){G.st.vie=Math.max(0,G.st.vie-MACH_DM);addFx({kind:'num',x:G.px,y:G.py,txt:'-'+MACH_DM,col:PAL['4'],dur:900});
    addFx({kind:'shake',amp:5,dur:220});
    sayMore(`Laser : −${MACH_DM} vie.`,'warn');if(G.st.vie<=0)G.over={dead:true};}}
// rendu des rayons allumés : cases pleines, sans transparence (consigne « pixel perfect »)
// tuiles du Tile editor, groupe FX (22 novembre 2026) : laserV (vertical ; l'horizontal en est la rotation) et laserX (croix)
function machDraw(){if(!G.las||!G.las.length)return;const lit=machLit(),T={v:TL.laserV_,h:TL.laserH_,x:TL.laserX_};ctx.globalAlpha=1;
  for(const k in lit){const i=+k;if(fog&&!vis[i])continue;const t=T[lit[k]];if(t)ctx.drawImage(t,(i%W-camX)*S,(((i/W)|0)-camY)*S,S,S);}}
// tuile d'un terrain de machine (appelé par batiTuile, le sol est déjà posé)
function machTuileRendu(t,x,y,put){const i=idx(x,y),a=G.art&&G.art[i];
  if(t===TURRET){put(TL.wall,.95);const l=(G.las||[]).find(l=>l.c.includes(i));
    put(TL[(l&&machTire(l)?'tourelleOn_':'tourelle_')+MACH_SENS[a||0]],1);}
  else if(t===PYLON){const l=(G.las||[]).find(l=>l.c[0]===i);put(l&&machTire(l)?TL.pyloneOn:TL.pylone,1);}
  else if(t===PILE){if(G.soc&&G.soc[i]!=null)put(TL.socleOn,1);put(TL.pile,1);}
  else if(t===LEVIER)put(a?TL.levierOn:TL.levier,1);
  else if(t===GRILLE)put(TL.grille,1);
  else if(t===STATION)put(a?TL.stationOff:TL.station,1);
  else if(t===CHARGEUR)put(TL.chargeur,1);
  else if(t===FABRIC)put(TL.fabric,1);}

/* ----- Circuits : leviers, socles, ponts, grilles ----- */
function circApplique(c,muet){const t=G.t;
  for(const k of c.cib){
    if(k.t==='pont'){for(const j of k.c){if(c.on){t[j]=BRIDGE;G.pb=G.pb||{};G.pb[j]=1;}
        else{t[j]=CHASM;if(G.pb)delete G.pb[j];const b=beastAt(j%W,(j/W)|0);if(b){G.beasts.splice(G.beasts.indexOf(b),1);
          if(!muet)sayMore(`${LeNom(BEASTS[b.sp])} tombe dans le gouffre.`,'good');}}}
      CHASM_OV=null;}
    else if(k.t==='grille')k.c.forEach((j,n)=>{if(c.on){if(t[j]===GRILLE)t[j]=k.sous[n];}else if(t[j]===k.sous[n]&&!(G.px===j%W&&G.py===((j/W)|0))&&!beastAt(j%W,(j/W)|0)&&!animalAt(j%W,(j/W)|0))t[j]=GRILLE;});
    else if(k.t==='lasers'){for(const l of G.las||[])if(l.g===k.g)l.cut=c.on?1:0;machZone();}}}
const circTxt=c=>c.cib.map(k=>k.t==='pont'?(c.on?'un pont se déploie':'le pont se rétracte'):k.t==='grille'?(c.on?'une grille d’énergie s’éteint':'la grille d’énergie se rallume'):(c.on?'les lasers de la salle s’éteignent':'les lasers se rallument')).join(', ');
// les socles : alimentés tant qu'une pile est posée dessus
function socMaj(){for(const k in G.soc||{}){const c=G.circ[G.soc[k]];if(!c)continue;const on=G.t[+k]===PILE?1:0;if(on!==c.on){c.on=on;
  circApplique(c);sayMore((on?'Socle alimenté : ':'Socle hors tension : ')+circTxt(c)+'.',on?'good':'warn');if(on)SFX.spot();}}}
// la foreuse avance sur une machine. Renvoie 'go' si le pas peut se faire (pile poussée), sinon le coup est déjà joué.
function machBump(nx,ny,dx,dy){const i=idx(nx,ny),v=G.t[i],fin=d=>{G.turn++;G.msg=null;pass(d||100);computeFOV();render();
  if(G.over&&G.over.dead)dead();return 'stop';};
  if(v===LEVIER){const c=(G.circ||[]).find(c=>c.k==='levier'&&c.c===i);if(!c)return fin();
    if(c.on&&c.perm){say('Levier déjà actionné.');SFX.blocked();render();return 'stop';}
    c.on=c.on?0:1;G.art[i]=c.on;circApplique(c);SFX.serrure();say('Levier actionné : '+circTxt(c)+'.','good');return fin();}
  if(v===PILE){if(dx&&dy){say('Pile énergétique : elle ne se pousse pas en diagonale.');SFX.blocked();render();return 'stop';}
    const tx=nx+dx,ty=ny+dy,j=idx(tx,ty),w=G.t[j];
    if(!pileLibre(j)){say('Pile énergétique : quelque chose l’empêche d’avancer.');SFX.blocked();render();return 'stop';}
    const p=G.piles[i];delete G.piles[i];G.t[i]=p.sous;p.sous=w;G.piles[j]=p;G.t[j]=PILE;SFX.thud();
    say(G.soc&&G.soc[j]!=null?'La pile s’enclenche sur le socle.':'La foreuse pousse la pile énergétique.','info');socMaj();
      machZone();return 'go';}
  if(v===CHARGEUR){const e=Object.entries(G.piles||{}).find(([,p])=>p.ch===i);if(!e){say('Distributeur de pile : vide.');SFX.blocked();
    render();return 'stop';}
    const [k,p]=e,de=+k;if(de===p.home){say('Distributeur de pile : la pile est déjà à côté de lui.');SFX.blocked();render();return 'stop';}
    if(!pileLibre(p.home)){say('Distributeur de pile : la place de la pile est occupée.');SFX.blocked();render();return 'stop';}
    delete G.piles[de];G.t[de]=p.sous;p.sous=G.t[p.home];G.piles[p.home]=p;G.t[p.home]=PILE;SFX.serrure();
      say('Le distributeur rappelle la pile à côté de lui.','info');socMaj();machZone();return fin();}
  if(v===STATION){if(G.art[i]){say('Station de réparation : vide.');SFX.blocked();render();return 'stop';}
    G.art[i]=1;const dv=Math.round(G.st.vieMax-G.st.vie),de=Math.round(G.st.energieMax-G.st.energie);G.st.vie=G.st.vieMax;
      G.st.energie=G.st.energieMax;
    addFx({kind:'num',x:G.px,y:G.py,txt:'+'+dv,col:PAL['2'],dur:900});addFx({kind:'soin',x:G.px,y:G.py,dur:900,gr:fxGrains(9)});SFX.analyse();
    let n=0;for(const b of G.beasts||[])if(!b.hunt&&Math.hypot(b.x-G.px,b.y-G.py)<=12&&!BEASTS[b.sp].mine){b.hunt=1;spot(b);n++;}
    say(`Station de réparation : +${dv} vie, +${de} énergie. Le vacarme s’entend de loin${n?` : ${n} ennemi${n>1?'s':''} vien${n>1?'nent':'t'} voir`:''}.`,'good');return fin(200);}
  if(v===FABRIC){if(typeof fabOpen==='function')fabOpen(i);else{say('Fabricateur.');render();}return 'stop';}
  if(v===GRILLE){say('Grille d’énergie : fermée. Son socle, tout près, attend une pile.');SFX.blocked();render();return 'stop';}
  if(v===TURRET||v===PYLON){say((v===TURRET?'Tourelle laser':'Croix laser')+' : la foreuse ne l’entame pas. Une charge sismique la détruit.');
    SFX.blocked();render();return 'stop';}
  return 'stop';}
// une pile peut-elle venir sur cette case ? sol bâti ou naturel, libre de toute créature, d'objet, de clé et de site
function pileLibre(j){const x=j%W,y=(j/W)|0,v=G.t[j];
  return (v===FLOOR||v===GROUND||v===RUBBLE||v===FLAT||v===DOOR)&&!beastAt(x,y)&&!animalAt(x,y)&&!(G.px===x&&G.py===y)&&!(G.items&&G.items[j]&&G.items[j].length)&&!(G.cles&&G.cles[j])&&!G.sites.some(s=>s.x===x&&s.y===y)&&!(G.ore&&G.ore[j]);}

/* ----- Accessibilité : le site reste-t-il atteignable, leviers et socles compris ? -----
   Parcours depuis la foreuse ; un levier ou une pile touchés ouvrent ce qu'ils commandent, et on recommence jusqu'à stabilité.
   Les grilles et les ponts fermés barrent le passage ; clés et portes dérobées sont comptées comme franchissables.
   Renvoie la longueur du trajet jusqu'au site, ou -1. */
function accesSite(depuis){const N=W*H,t=G.t,ouvert=new Set();let d;
  for(let tour=0;tour<12;tour++){d=new Int32Array(N).fill(-1);const q=[depuis??idx(G.px,G.py)];d[q[0]]=0;const touche=new Set();
    const ok=j=>{const v=t[j];if(ouvert.has(j))return true;if(v===LEVIER||v===PILE||v===CHARGEUR){touche.add(j);return v===PILE;
      }return !blocks(v)||v===LOCK||v===SECRET;};
    for(let a=0;a<q.length;a++){const c=q[a],x=c%W,y=(c/W)|0;for(const [dx,dy] of D4){const j=idx(x+dx,y+dy);
      if(d[j]<0&&ok(j)){d[j]=d[c]+1;q.push(j);}}}
    let neuf=false;
    for(const c of G.circ||[]){if(c._vu)continue;
      const atteint=c.k==='levier'?touche.has(c.c):Object.entries(G.piles||{}).some(([k,p])=>p.soc===c.c&&(touche.has(+k)||d[+k]>=0));
      if(atteint||c.on){c._vu=1;neuf=true;for(const k of c.cib)if(k.t!=='lasers')for(const j of k.c)ouvert.add(j);}}
    if(!neuf)break;}
  for(const c of G.circ||[])delete c._vu;
  const s=G.sites[0];return s?d[idx(s.x,s.y)]:-1;}
/* ----- Génération ----- */
const BUTIN_DEPOT=()=>typeof butinCoffre==='function'?butinCoffre('depot'):['matiere','matiere'];
function machines(){G.las=[];G.lz={};G.circ=[];G.soc={};G.piles={};G.mt=0;G.machN={};G.pieges=[];G.niche={};G.choix=[];G.vit={};
  if(!BATI_DER||!G.batis||!G.batis.length)return;
    const {B,strs}=BATI_DER,t=G.t,N=W*H,A=ARTEFACTS,site=G.sites&&G.sites[0]?idx(G.sites[0].x,G.sites[0].y):-1,dep=idx(G.px,G.py);
  const base=!!(RECETTES[GEN.recette]||{}).base,fac=base?(GEN.bsMachines??100)/100:.35,
    compte=n=>Math.floor(n)+(Math.random()<n-Math.floor(n)?1:0);
  const fq=(k,f)=>{const a=A[k];if(!a||!artOn(k))return 0;return compte(ART_LISTE.find(m=>m[0]===k)[3][a.f]*(f??fac));};
  const pieces=[];
    for(const S of strs)for(const p of S.pieces)if(p.c.length>=9&&!p.c.includes(site)&&!p.c.includes(dep)&&!p.c.some(i=>t[i]!==FLOOR&&t[i]!==PILLAR&&t[i]!==CHASM&&t[i]!==BRIDGE&&t[i]!==MACHINE))pieces.push(p);
  const mel=l=>l.slice().sort(()=>Math.random()-.5),murV=i=>D4.some(([dx,dy])=>t[idx(i%W+dx,((i/W)|0)+dy)]===WALL);
  // case de passage : jamais de piège juste devant une porte
  const pres=i=>{const x=i%W,y=(i/W)|0;
    return B.porte[i]||D4.some(([dx,dy])=>{const j=idx(x+dx,y+dy);return B.porte[j]||t[j]===DOOR||t[j]===LOCK;});};
  const libre=i=>t[i]===FLOOR&&i!==site&&i!==dep&&!(G.items[i]&&G.items[i].length)&&!G.cles[i]&&!(G.soc[i]!=null)&&!G.lz[i];
  const pose=(p,terrain,val,mur)=>{const c=p.c.filter(i=>libre(i)&&artLibre(B,i,site));if(!c.length)return -1;
    const m=c.filter(murV),l=mur&&m.length?m:c,i=l[rnd(0,l.length-1)];t[i]=terrain;G.art[i]=val;return i;};
  // distance depuis l'arrivée ; une porte verrouillée se franchit (sa clé est toujours accessible), une porte dérobée seulement si « secret »
  const dist=secret=>{const d=new Int32Array(N).fill(-1),q=[dep];d[dep]=0;for(let a=0;a<q.length;a++){const c=q[a],x=c%W,y=(c/W)|0;
    for(const [dx,dy] of D4){const j=idx(x+dx,y+dy),v=t[j];if(d[j]<0&&(!blocks(v)||v===LOCK||(secret&&v===SECRET))){d[j]=d[c]+1;
    q.push(j);}}}return d;};
  const inc=k=>G.machN[k]=(G.machN[k]||0)+1;let grp=0;
  // -- tourelles : des bandes de deux cases de large, séparées par deux cases sûres au moins
  const tourelles=p=>{const P=new Set(p.c),g=++grp;let mieux=null;
    for(const o of mel([0,1,2,3])){const [dx,dy]=MACH_DIR[o],vert=!dx,bandes=[];
      // colonnes (ou rangées) où un rayon d'au moins 3 cases part d'un mur et finit sur un obstacle
      const rayon=(x,y)=>{const m=idx(x,y);if(t[m]!==WALL||pres(m))return 0;let n=0,a=x+dx,b=y+dy;
        while(P.has(idx(a,b))&&t[idx(a,b)]===FLOOR&&!pres(idx(a,b))&&idx(a,b)!==site){n++;a+=dx;b+=dy;}
        return n>=3&&blocks(t[idx(a,b)])?n:0;};
      for(const i of p.c){const x=i%W,y=(i/W)|0,mx=x-dx,my=y-dy;if(t[idx(mx,my)]!==WALL)continue;const cle=vert?mx:my;
        const a=rayon(mx,my),b=vert?rayon(mx+1,my):rayon(mx,my+1);
          if(a&&b&&Math.abs(a-b)<=2)bandes.push([cle,idx(mx,my),vert?idx(mx+1,my):idx(mx,my+1)]);}
      bandes.sort((a,b)=>a[0]-b[0]+(Math.random()-.5)*.1);const pris=[];
      for(const b of bandes)if(!pris.length||b[0]>=pris[pris.length-1][0]+4)pris.push(b);
      if(pris.length&&(!mieux||pris.length>mieux.pris.length))mieux={o,pris};}
    if(!mieux||(mieux.pris.length<2&&p.c.length>40))return 0;const {o,pris}=mieux,[dx,dy]=MACH_DIR[o];
    for(const b of pris.slice(0,4)){const per=rnd(4,7);for(const m of [b[1],b[2]]){t[m]=TURRET;G.art[m]=o;
      }G.las.push({k:'t',c:[b[1],b[2]],d:[dx,dy],per,off:rnd(0,per-1),on:1,g,cut:0});}
    p.mach='lasers';return g;};
  // -- croix : un quadrillage de pylônes, un sur trois
  const croix=p=>{const P=new Set(p.c),g=++grp;let best=null;
    for(let ax=0;ax<3;ax++)for(let ay=0;ay<3;ay++){const l=p.c.filter(i=>(i%W)%3===ax&&((i/W)|0)%3===ay&&libre(i)&&!pres(i)&&D4.every(([dx,dy])=>{const j=idx(i%W+dx,((i/W)|0)+dy);return P.has(j)&&t[j]===FLOOR&&!pres(j);}));
      if(!best||l.length>best.length)best=l;}
    if(!best||best.length<2)return 0;const poses=[];
    for(const i of mel(best).slice(0,9)){if(!artLibre(B,i,site))continue;t[i]=PYLON;G.art[i]=0;poses.push(i);}
    if(poses.length<2){for(const i of poses){t[i]=FLOOR;delete G.art[i];}return 0;}
    for(const i of poses){const per=rnd(3,7);G.las.push({k:'x',c:[i],d:[0,0],per,off:rnd(0,per-1),on:rnd(1,2),g,cut:0});}
    p.mach='croix';return g;};
  // -- levier coupe-circuit, au fond de la salle : la traversée une fois réussie, le retour est sûr
  const coupe=(p,g)=>{machZone();const d=dist(),c=p.c.filter(i=>libre(i)&&artLibre(B,i,site)&&d[i]>=0).sort((a,b)=>d[b]-d[a]);
    if(!c.length)return;
    const i=c[rnd(0,Math.min(2,c.length-1))];t[i]=LEVIER;G.art[i]=0;G.circ.push({k:'levier',c:i,on:0,perm:0,cib:[{t:'lasers',g}]});};
  /* ----- Machines lisibles (22 novembre 2026) : le mécanisme est à côté de ce qu'il commande -----
     Pont à levier : le gouffre prend presque toute la salle, d'un mur à l'autre ; il ne reste qu'une bande de sol à chaque bout.
       Le levier (ou le socle) est au pied du pont, du côté d'où l'on vient. Deux cas seulement : le pont est le seul chemin
       vers le site, ou l'autre rive est un cul-de-sac et porte un butin (Matière).
     Pile et socle : le socle est près de ce qu'il alimente ; la pile attend à côté de son distributeur, dans une pièce
       voisine, et se pousse jusqu'au socle (elle passe les portes). Le distributeur la rappelle à côté de lui. */
  const piece=new Int32Array(N).fill(-1);pieces.forEach((p,n)=>{for(const i of p.c)piece[i]=n;});
  const sol=v=>v===FLOOR||v===DOOR,v4=i=>D4.map(([dx,dy])=>idx(i%W+dx,((i/W)|0)+dy));
  const pas=(a,b)=>Math.abs(a%W-b%W)+Math.abs(((a/W)|0)-((b/W)|0));
  // peut-on pousser la pile de a jusqu'à s dans la région Q ? (parcours des états pile + côté de la foreuse) ; nombre de poussées, ou -1
  const sokoban=(Q,a,s)=>{const lib=(i,pile)=>Q.has(i)&&i!==pile&&sol(t[i]),vu=new Set(),file=[];
    const zone=(de,pile)=>{const z=new Set([de]),f=[de];
      for(let k=0;k<f.length;k++)for(const j of v4(f[k]))if(lib(j,pile)&&!z.has(j)){z.add(j);f.push(j);}return z;};
    const vo=v4(a).filter(j=>lib(j,a));if(!vo.length)return -1;
    const z0=zone(vo[0],a);if(vo.some(j=>!z0.has(j)))return -1;   // posée à sa place, la pile ne coupe aucun passage
    file.push([a,vo[0],0]);vu.add(a+'|'+vo[0]);
    for(let k=0;k<file.length&&k<2500;k++){const [pl,jo,n]=file[k];if(pl===s)return n;const z=zone(jo,pl),x=pl%W,y=(pl/W)|0;
      for(const [dx,dy] of D4){const der=idx(x-dx,y-dy),dev=idx(x+dx,y+dy);if(!z.has(der)||!lib(dev,pl))continue;const cle=dev+'|'+pl;
        if(vu.has(cle))continue;vu.add(cle);file.push([dev,pl,n+1]);}}
    return -1;};
  // le socle s est déjà choisi, près de ce qu'il alimente : on pose la pile et son distributeur à 6-18 pas de là, dans une autre pièce si possible
  const alimente=(cib,s)=>{const dR=new Map([[s,0]]),f=[s];
    for(let k=0;k<f.length;k++){const c=f[k],n=dR.get(c);if(n>=18)continue;
      for(const j of v4(c))if(!dR.has(j)&&sol(t[j])&&j!==site){dR.set(j,n+1);f.push(j);}}
    const Q=new Set(f),d2=dist();
    const cand=f.filter(a=>dR.get(a)>=6&&d2[a]>=0&&libre(a)&&!pres(a)&&artLibre(B,a,site)&&piece[a]>=0&&!pieces[piece[a]].mach);
    const autre=cand.filter(a=>piece[a]!==piece[s]),l=mel(autre.length?autre:cand);
    for(const a of l.slice(0,12)){const chs=mel(v4(a).filter(j=>libre(j)&&!pres(j)&&j!==s&&artLibre(B,j,site))),ch=chs.find(murV)??chs[0];
      if(ch==null)continue;
      t[ch]=CHARGEUR;const n=sokoban(Q,a,s);if(n<3){t[ch]=FLOOR;continue;}
      G.art[ch]=0;t[a]=PILE;G.piles[a]={home:a,sous:FLOOR,ch,soc:s};G.soc[s]=G.circ.length;G.circ.push({k:'socle',c:s,on:0,perm:0,cib});
      const q=pieces[piece[a]];q.mach='pile';return q;}
    return null;};
  const annule=q=>{const c=G.circ.pop(),s=c.c;delete G.soc[s];for(const k in G.piles)if(G.piles[k].soc===s){t[+k]=FLOOR;
    t[G.piles[k].ch]=FLOOR;delete G.art[G.piles[k].ch];delete G.piles[k];}q.mach=null;};
  const pont=p=>{if(p.c.length<20)return false;
    const P=new Set(p.c),xs=p.c.map(i=>i%W),ys=p.c.map(i=>(i/W)|0),x0=Math.min(...xs),x1=Math.max(...xs),
    y0=Math.min(...ys),y1=Math.max(...ys);
    for(const vert of mel([true,false])){const a0=vert?x0:y0,a1=vert?x1:y1,co=i=>vert?i%W:(i/W)|0,li=i=>vert?(i/W)|0:i%W;
      for(const m of a1-a0>=8?[2,1]:[1]){if(a1-a0-2*m+1<3)continue;   // m : largeur de la bande de sol gardée à chaque bout
        const fosse=p.c.filter(i=>co(i)>=a0+m&&co(i)<=a1-m);
        if(fosse.length<6||fosse.some(i=>t[i]!==FLOOR||pres(i)||i===site||i===dep||G.lz[i]||G.cles[i]||(G.items[i]&&G.items[i].length)||G.soc[i]!=null))continue;
        // le gouffre va d'un mur à l'autre : sur ses côtés, hors de la pièce, il n'y a que des obstacles
        if(fosse.some(i=>{const x=i%W,y=(i/W)|0;return (vert?[[0,1],[0,-1]]:[[1,0],[-1,0]]).some(([dx,dy])=>{const j=idx(x+dx,y+dy);return !P.has(j)&&!blocks(t[j]);});}))continue;
        const large=a1-a0-2*m+1,bout=(lg,c)=>p.c.find(i=>li(i)===lg&&co(i)===c);
        const lignes=mel([...new Set(fosse.map(li))]).filter(lg=>fosse.filter(i=>li(i)===lg).length===large&&bout(lg,a0+m-1)!=null&&bout(lg,a1-m+1)!=null&&t[bout(lg,a0+m-1)]===FLOOR&&t[bout(lg,a1-m+1)]===FLOOR);
        if(!lignes.length)continue;const lg=lignes[0],pt=fosse.filter(i=>li(i)===lg).sort((a,b)=>co(a)-co(b));
        const sv=fosse.map(i=>t[i]),defait=()=>fosse.forEach((i,n)=>t[i]=sv[n]);for(const i of fosse)t[i]=CHASM;
        const d=dist(),pres1=p.c.filter(i=>t[i]===FLOOR&&d[i]>=0),loin=p.c.filter(i=>t[i]===FLOOR&&d[i]<0);
        // les deux rives se rejoignent par ailleurs : ni passage obligé, ni cul-de-sac
        if(!pres1.length||!loin.length){defait();continue;}
        const pied=[bout(lg,a0+m-1),bout(lg,a1-m+1)].find(i=>d[i]>=0);if(pied==null){defait();continue;}
        const cand=pres1.filter(i=>i!==pied&&libre(i)&&!pres(i)&&artLibre(B,i,site)).sort((a,b)=>pas(a,pied)-pas(b,pied));
        if(!cand.length||pas(cand[0],pied)>3){defait();continue;}const mec=cand[0];
        let fait=false;
        if(Math.random()<.35){const q=alimente([{t:'pont',c:pt}],mec);if(q){if(accesSite()>=0){fait=true;inc('piles');}else annule(q);}}
        if(!fait){t[mec]=LEVIER;G.art[mec]=0;G.circ.push({k:'levier',c:mec,on:0,perm:1,cib:[{t:'pont',c:pt}]});
          if(accesSite()<0){G.circ.pop();t[mec]=FLOOR;delete G.art[mec];defait();continue;}}
        // l'autre rive est un cul-de-sac : un butin y attend, au plus loin du pont
        if(d[site]>=0||site<0){const c=loin.filter(i=>libre(i)).sort((a,b)=>pas(b,pied)-pas(a,pied))[0];
          if(c!=null){(G.items[c]=G.items[c]||[]).push('matiere');p.butin=1;}}
        p.mach='pont';CHASM_OV=null;return true;}}
    return false;};
  // -- dépôt : une pièce à une seule entrée, fermée par une grille ; le socle est devant, à deux ou trois pas ; la pile vient de la pièce voisine
  const depot=p=>{const P=new Set(p.c),ent=[];if(p.c.length>60)return false;
    for(const i of p.c)for(const j of v4(i))if(!P.has(j)&&!blocks(t[j])&&!ent.includes(j))ent.push(j);
    if(ent.length!==1||(t[ent[0]]!==DOOR&&t[ent[0]]!==FLOOR)||G.lz[ent[0]])return false;const e=ent[0],sous=t[e];
    // la grille ne doit enfermer que ce dépôt, jamais le site
    t[e]=GRILLE;const d=dist(true);if(d[site]<0||p.c.some(i=>d[i]>=0)){t[e]=sous;return false;}
    const socs=[];{const vu=new Map([[e,0]]),f=[e];for(let k=0;k<f.length;k++){const c=f[k],n=vu.get(c);if(n>=4)continue;
      for(const j of v4(c))if(!vu.has(j)&&!P.has(j)&&d[j]>=0&&sol(t[j])){vu.set(j,n+1);f.push(j);
      if(n+1>=2&&libre(j)&&!pres(j)&&artLibre(B,j,site))socs.push(j);}}}
    let q=null;for(const s of mel(socs).slice(0,4)){q=alimente([{t:'grille',c:[e],sous:[sous]}],s);
      if(q){if(piece[s]>=0&&!pieces[piece[s]].mach)pieces[piece[s]].mach='socle';break;}}
    if(!q){t[e]=sous;return false;}
    const but=BUTIN_DEPOT(),cs=mel(p.c.filter(i=>t[i]===FLOOR));
      but.forEach((o,n)=>{if(cs[n]!=null)(G.items[cs[n]]=G.items[cs[n]]||[]).push(o);});
    p.mach='depot';return true;};
  /* -- salle piégée (22 novembre 2026) : un butin au milieu de la pièce, des relais cachés dans les murs. Les niches se voient
     (tuile « niche ») : un joueur attentif lit le piège avant de prendre l'appât. Ramasser l'appât fait surgir la bande. */
  const piege=p=>{if(p.c.length<20||p.c.length>140)return false;const P=new Set(p.c),niches=[],vuM=new Set(),vuS=new Set();
    const cx=p.c.reduce((a,i)=>a+i%W,0)/p.c.length,cy=p.c.reduce((a,i)=>a+((i/W)|0),0)/p.c.length;
    const app=p.c.filter(i=>libre(i)&&!pres(i)).sort((a,b)=>Math.hypot(a%W-cx,((a/W)|0)-cy)-Math.hypot(b%W-cx,((b/W)|0)-cy))[0];
      if(app==null)return false;
    for(const i of mel(p.c)){if(i===app||!libre(i)||pres(i)||vuS.has(i))continue;
      const j=v4(i).find(j=>t[j]===WALL&&!P.has(j)&&!vuM.has(j)&&!pres(j));if(j==null)continue;vuM.add(j);vuS.add(i);niches.push([j,i]);}
    // deux fois plus de relais (22 novembre 2026, choix de l'utilisateur) : 8 à 16, autant que les murs le permettent
    const n=Math.max(8,Math.min(16,Math.round(p.c.length/4.5)));if(niches.length<6)return false;const sel=niches.slice(0,n);
    G.pieges.push({c:app,n:sel.map(a=>a[0]),f:sel.map(a=>a[1]),on:1});for(const [j] of sel)G.niche[j]=1;
    const but=typeof butinCoffre==='function'?butinCoffre('piege'):['matiere','matiere'];
      for(const o of but)(G.items[app]=G.items[app]||[]).push(o);
    p.mach='piege';return true;};
  /* -- vitrines (22 novembre 2026, d'après les coffres de Brogue) : une petite pièce en cul-de-sac, trois vitrines, un lot dans chacune.
     On n'en emporte qu'un : les autres se verrouillent. Rien à combattre : le choix est le jeu. */
  const vitrines=p=>{const P=new Set(p.c),ent=[];if(p.c.length<9||p.c.length>48)return false;
    for(const i of p.c)for(const j of v4(i))if(!P.has(j)&&!blocks(t[j])&&!ent.includes(j))ent.push(j);
    if(ent.length!==1||G.lz[ent[0]])return false;
    const c=p.c.filter(i=>libre(i)&&!pres(i)&&artLibre(B,i,site)).sort((a,b)=>pas(b,ent[0])-pas(a,ent[0])),sel=[];
    for(const i of c){if(sel.length>=3)break;if(sel.every(j=>pas(i,j)>=2))sel.push(i);}
    if(sel.length<3)return false;const bc=typeof butinCoffre==='function';
    const lots=bc?[[planTire()],[equipTire()],[consoTire(),consoTire()]]:[['matiere'],['matiere'],['matiere']];
    sel.forEach((i,n)=>{G.items[i]=lots[n].slice();G.vit[i]=1;});G.choix.push({c:sel,on:1});p.mach='vitrines';return true;};
  // récompense d'une salle à lasers : un butin au fond, là où mène la traversée
  const recompense=p=>{const d=dist(),c=p.c.filter(i=>libre(i)&&d[i]>=0&&!G.lz[i]).sort((a,b)=>d[b]-d[a])[0];
    if(c!=null&&Math.random()<.7)(G.items[c]=G.items[c]||[]).push(typeof consoTire==='function'&&Math.random()<.5?consoTire():'matiere');};
  // ----- répartition -----
  const essaie=(n,f)=>{let fait=0;for(const p of mel(pieces)){if(fait>=n)break;if(p.mach||p.herbe)continue;if(f(p))fait++;}return fait;};
  for(let k=essaie(fq('ponts'),pont);k>0;k--)inc('ponts');
  for(let k=essaie(fq('piles'),depot);k>0;k--)inc('piles');
  for(let k=essaie(fq('pieges'),piege);k>0;k--)inc('pieges');
  essaie(fq('lasers'),p=>{const g=tourelles(p);if(!g)return false;inc('lasers');machZone();recompense(p);if(Math.random()<.6)coupe(p,g);return true;});
  essaie(fq('croix'),p=>{const g=croix(p);if(!g)return false;inc('croix');machZone();recompense(p);if(Math.random()<.4)coupe(p,g);return true;});
  for(let k=essaie(fq('vitrines',1),vitrines);k>0;k--)inc('vitrines');
  for(let k=fq('station');k>0;k--)for(const p of mel(pieces)){if(p.mach==='lasers'||p.mach==='croix')continue;
    if(pose(p,STATION,0,true)>=0){inc('station');break;}}
  // le fabricateur : dans une pièce sans laser ; à défaut (petit complexe du niveau 1), n'importe où dans un bâtiment
  for(let k=fq('fabric',1);k>0;k--){let fait=false;for(const p of mel(pieces)){if(p.mach==='lasers'||p.mach==='croix')continue;
    if(pose(p,FABRIC,0,true)>=0){fait=true;break;}}
    if(!fait)for(const S of mel(strs)){for(const p of mel(S.pieces)){if(p.c.length>=6&&pose(p,FABRIC,0,true)>=0){fait=true;
      break;}}if(fait)break;}
    if(fait)inc('fabric');}
  machZone();if(G.artN)Object.assign(G.artN,G.machN);
  // garde-fou : si malgré tout le site n'est plus atteignable, tous les circuits sont ouverts d'office
  if(accesSite()<0){for(const c of G.circ){c.on=1;c.perm=1;if(c.k==='levier')G.art[c.c]=1;circApplique(c,true);}}
}

/* ----- Salle piégée : l'appât ramassé, les relais sortent des murs (22 novembre 2026) -----
   G.pieges [{c:case de l'appât, n:[murs-niches], f:[cases de sol devant chaque niche], on}] ; G.niche {mur: 1 fermée | 2 ouverte}. */
function piegeTest(c){const p=(G.pieges||[]).find(p=>p.on&&p.c===c);if(!p)return;p.on=0;
  const s=BEASTS.findIndex(b=>b.key==='cafar');let n=0;const bande=9000+((Math.random()*900)|0);
  p.f.forEach((i,k)=>{const x=i%W,y=(i/W)|0;G.niche[p.n[k]]=2;if(s<0||blocks(G.t[i])||beastAt(x,y)||animalAt(x,y)||(G.px===x&&G.py===y))return;
    const b=newBeast(s,x,y,bande,-1);b.hunt=1;b.nd=1;spot(b);G.beasts.push(b);n++;addFx({kind:'alerte',o:b,dur:900});});
  if(!n)return;addFx({kind:'shake',amp:7,dur:300});if(typeof SFX!=='undefined')SFX.explode();
  sayMore(`Piège ! ${n} relais surgissent des murs.`,'warn');}

/* ----- Vitrines : un seul lot (22 novembre 2026). G.choix [{c:[cases], on}] ; G.vit {case:1} pour le dessin du socle. ----- */
function choixTest(c){const g=(G.choix||[]).find(g=>g.on&&g.c.includes(c));if(!g)return;g.on=0;
  for(const i of g.c){if(i!==c&&G.items)delete G.items[i];if(i!==c)G.vit[i]=2;}delete G.vit[c];
  if(typeof SFX!=='undefined')SFX.serrure();sayMore('Vous prenez un lot : les deux autres vitrines se verrouillent.','info');}
