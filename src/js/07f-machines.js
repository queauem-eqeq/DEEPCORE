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
const machCasse=v=>v===TURRET||v===PYLON||v===GRILLE||v===STATION||v===FABRIC||v===LEVIER||v===CHARGEUR;   // ce qu'une charge sismique réduit en gravats
const machCouleur=v=>v===TURRET||v===PYLON?'#ff2a2a':v===PILE?'#ffe14d':v===GRILLE?'#ff7ad1':v===FABRIC?'#c77dff':v===STATION?'#5aff8a':'#ff8c1a';
const MACH_DIR=[[0,1],[0,-1],[1,0],[-1,0]],MACH_SENS=['d','u','r','l'];
let BATI_DER=null;   // {B, strs} du dernier appel réussi à batiments() : les pièces, pour y poser les machines (génération seulement)

/* ----- Lasers ----- */
// cases éclairées par un laser s'il tirait maintenant : le rayon part de la tourelle et s'arrête au premier obstacle (une pile en est un)
function machRayon(l){const out=[],t=G.t;
  if(l.k==='x'){const i=l.c[0];if(t[i]!==PYLON)return out;const x=i%W,y=(i/W)|0;for(const [dx,dy] of D4){const j=idx(x+dx,y+dy);if(!blocks(t[j])&&t[j]!==DOOR)out.push(j);}return out;}
  for(const i of l.c){if(t[i]!==TURRET)continue;let x=i%W+l.d[0],y=((i/W)|0)+l.d[1];
    while(x>0&&y>0&&x<W-1&&y<H-1){const j=idx(x,y),v=t[j];if(blocks(v)&&v!==CHASM||v===DOOR)break;out.push(j);x+=l.d[0];y+=l.d[1];}}
  return out;}
const machVivant=l=>l.c.some(i=>G.t[i]===(l.k==='x'?PYLON:TURRET));
const machTire=(l,t)=>!l.cut&&machVivant(l)&&((((t??G.mt)||0)+l.off)%l.per)<l.on;
// cases éclairées en ce moment : {case: 'v' | 'h' | 'x'}
function machLit(t){const m={};for(const l of G.las||[])if(machTire(l,t))for(const j of machRayon(l))m[j]=l.k==='x'?'x':l.d[0]?'h':'v';return m;}
function machZone(){const z={};for(const l of G.las||[])if(!l.cut&&machVivant(l))for(const j of machRayon(l))z[j]=1;G.lz=z;}
// un battement : les lasers avancent d'un cran, et tout ce qui se tient dans un rayon allumé prend MACH_DM
function machTick(){if(!G.las||!G.las.length||G.over)return;G.mt=(G.mt||0)+1;const lit=machLit();let n=0,vu=false;
  for(const k in lit){n++;if(vis[+k])vu=true;}if(!n)return;
  if(vu&&typeof SFX!=='undefined')SFX.laser();
  for(const [liste,fiches] of [[G.beasts||[],BEASTS],[G.animals||[],SPECIES]])for(const o of [...liste]){
    const pieds=liste===G.beasts&&typeof FOOT!=='undefined'?FOOT:[[0,0]];if(!pieds.some(([dx,dy])=>lit[idx(o.x+dx,o.y+dy)]))continue;
    o.hp=(o.hp??pvDe(fiches[o.sp]))-MACH_DM;if(vis[idx(o.x,o.y)])addFx({kind:'num',x:o.x,y:o.y,txt:'-'+MACH_DM,col:PAL['3'],dur:750});
    if(o.hp<=0){liste.splice(liste.indexOf(o),1);bleed(o.x,o.y);if(vis[idx(o.x,o.y)])sayMore(`${LeNom(fiches[o.sp])} est détruit par un laser.`,'good');}}
  if(lit[idx(G.px,G.py)]){G.st.vie=Math.max(0,G.st.vie-MACH_DM);addFx({kind:'num',x:G.px,y:G.py,txt:'-'+MACH_DM,col:'#ff3b3b',dur:900});addFx({kind:'shake',amp:5,dur:220});
    sayMore(`Laser : −${MACH_DM} vie.`,'warn');if(G.st.vie<=0)G.over={dead:true};}}
// rendu des rayons allumés : cases pleines, sans transparence (consigne « pixel perfect »)
function machDraw(){if(!G.las||!G.las.length)return;const lit=machLit(),R='#ff2a2a',B='#ffffff',a=Math.round(S*3/8),b=Math.round(S/4),c=Math.round(S*7/16),e=Math.round(S/8);
  for(const k in lit){const i=+k;if(fog&&!vis[i])continue;const px=(i%W-camX)*S,py=(((i/W)|0)-camY)*S,o=lit[k];ctx.globalAlpha=1;
    if(o==='v'){ctx.fillStyle=R;ctx.fillRect(px+a,py,b,S);ctx.fillStyle=B;ctx.fillRect(px+c,py,e,S);}
    else if(o==='h'){ctx.fillStyle=R;ctx.fillRect(px,py+a,S,b);ctx.fillStyle=B;ctx.fillRect(px,py+c,S,e);}
    else{ctx.fillStyle=R;ctx.fillRect(px+e,py+e,S-2*e,S-2*e);ctx.fillStyle=B;ctx.fillRect(px+a,py+a,b,b);}}}
// tuile d'un terrain de machine (appelé par batiTuile, le sol est déjà posé)
function machTuileRendu(t,x,y,put){const i=idx(x,y),a=G.art&&G.art[i];
  if(t===TURRET){put(TL.wall,.95);const l=(G.las||[]).find(l=>l.c.includes(i));put(TL[(l&&machTire(l)?'tourelleOn_':'tourelle_')+MACH_SENS[a||0]],1);}
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
        else{t[j]=CHASM;if(G.pb)delete G.pb[j];const b=beastAt(j%W,(j/W)|0);if(b){G.beasts.splice(G.beasts.indexOf(b),1);if(!muet)sayMore(`${LeNom(BEASTS[b.sp])} tombe dans le gouffre.`,'good');}}}
      CHASM_OV=null;}
    else if(k.t==='grille')k.c.forEach((j,n)=>{if(c.on){if(t[j]===GRILLE)t[j]=k.sous[n];}else if(t[j]===k.sous[n]&&!(G.px===j%W&&G.py===((j/W)|0))&&!beastAt(j%W,(j/W)|0)&&!animalAt(j%W,(j/W)|0))t[j]=GRILLE;});
    else if(k.t==='lasers'){for(const l of G.las||[])if(l.g===k.g)l.cut=c.on?1:0;machZone();}}}
const circTxt=c=>c.cib.map(k=>k.t==='pont'?(c.on?'un pont se déploie':'le pont se rétracte'):k.t==='grille'?(c.on?'une grille d’énergie s’éteint':'la grille d’énergie se rallume'):(c.on?'les lasers de la salle s’éteignent':'les lasers se rallument')).join(', ');
// les socles : alimentés tant qu'une pile est posée dessus
function socMaj(){for(const k in G.soc||{}){const c=G.circ[G.soc[k]];if(!c)continue;const on=G.t[+k]===PILE?1:0;if(on!==c.on){c.on=on;circApplique(c);sayMore((on?'Socle alimenté : ':'Socle hors tension : ')+circTxt(c)+'.',on?'good':'warn');if(on)SFX.spot();}}}
// la foreuse avance sur une machine. Renvoie 'go' si le pas peut se faire (pile poussée), sinon le coup est déjà joué.
function machBump(nx,ny,dx,dy){const i=idx(nx,ny),v=G.t[i],fin=d=>{G.turn++;G.msg=null;pass(d||100);computeFOV();render();if(G.over&&G.over.dead)dead();return 'stop';};
  if(v===LEVIER){const c=(G.circ||[]).find(c=>c.k==='levier'&&c.c===i);if(!c)return fin();
    if(c.on&&c.perm){say('Levier déjà actionné.');SFX.blocked();render();return 'stop';}
    c.on=c.on?0:1;G.art[i]=c.on;circApplique(c);SFX.serrure();say('Levier actionné : '+circTxt(c)+'.','good');return fin();}
  if(v===PILE){if(dx&&dy){say('Pile énergétique : elle ne se pousse pas en diagonale.');SFX.blocked();render();return 'stop';}
    const tx=nx+dx,ty=ny+dy,j=idx(tx,ty),w=G.t[j];
    if(!pileLibre(j)){say('Pile énergétique : quelque chose l’empêche d’avancer.');SFX.blocked();render();return 'stop';}
    const p=G.piles[i];delete G.piles[i];G.t[i]=p.sous;p.sous=w;G.piles[j]=p;G.t[j]=PILE;SFX.thud();
    say(G.soc&&G.soc[j]!=null?'La pile s’enclenche sur le socle.':'La foreuse pousse la pile énergétique.','info');socMaj();machZone();return 'go';}
  if(v===CHARGEUR){const e=Object.entries(G.piles||{}).find(([,p])=>p.ch===i);if(!e){say('Chargeur de pile : vide.');SFX.blocked();render();return 'stop';}
    const [k,p]=e,de=+k;if(de===p.home){say('Chargeur de pile : la pile est déjà à sa place.');SFX.blocked();render();return 'stop';}
    if(!pileLibre(p.home)){say('Chargeur de pile : la place de la pile est occupée.');SFX.blocked();render();return 'stop';}
    delete G.piles[de];G.t[de]=p.sous;p.sous=G.t[p.home];G.piles[p.home]=p;G.t[p.home]=PILE;SFX.serrure();say('Le chargeur rappelle la pile à son point de départ.','info');socMaj();machZone();return fin();}
  if(v===STATION){if(G.art[i]){say('Station de réparation : vide.');SFX.blocked();render();return 'stop';}
    G.art[i]=1;const dv=Math.round(G.st.vieMax-G.st.vie),de=Math.round(G.st.energieMax-G.st.energie);G.st.vie=G.st.vieMax;G.st.energie=G.st.energieMax;
    addFx({kind:'num',x:G.px,y:G.py,txt:'+'+dv,col:PAL['2'],dur:900});addFx({kind:'soin',x:G.px,y:G.py,dur:900,gr:fxGrains(9)});SFX.analyse();
    let n=0;for(const b of G.beasts||[])if(!b.hunt&&Math.hypot(b.x-G.px,b.y-G.py)<=12&&!BEASTS[b.sp].mine){b.hunt=1;spot(b);n++;}
    say(`Station de réparation : +${dv} vie, +${de} énergie. Le vacarme s’entend de loin${n?` : ${n} ennemi${n>1?'s':''} vien${n>1?'nent':'t'} voir`:''}.`,'good');return fin(200);}
  if(v===FABRIC){if(typeof fabOpen==='function')fabOpen(i);else{say('Fabricateur.');render();}return 'stop';}
  if(v===GRILLE){say('Grille d’énergie : fermée. Un socle, quelque part, attend sa pile.');SFX.blocked();render();return 'stop';}
  if(v===TURRET||v===PYLON){say((v===TURRET?'Tourelle laser':'Croix laser')+' : la foreuse ne l’entame pas. Une charge sismique la détruit.');SFX.blocked();render();return 'stop';}
  return 'stop';}
// une pile peut-elle venir sur cette case ? sol bâti ou naturel, libre de toute créature, d'objet, de clé et de site
function pileLibre(j){const x=j%W,y=(j/W)|0,v=G.t[j];return (v===FLOOR||v===GROUND||v===RUBBLE||v===FLAT)&&!beastAt(x,y)&&!animalAt(x,y)&&!(G.px===x&&G.py===y)&&!(G.items&&G.items[j]&&G.items[j].length)&&!(G.cles&&G.cles[j])&&!G.sites.some(s=>s.x===x&&s.y===y)&&!(G.ore&&G.ore[j]);}

/* ----- Accessibilité : le site reste-t-il atteignable, leviers et socles compris ? -----
   Parcours depuis la foreuse ; un levier ou une pile touchés ouvrent ce qu'ils commandent, et on recommence jusqu'à stabilité.
   Les grilles et les ponts fermés barrent le passage ; clés et portes dérobées sont comptées comme franchissables.
   Renvoie la longueur du trajet jusqu'au site, ou -1. */
function accesSite(depuis){const N=W*H,t=G.t,ouvert=new Set();let d;
  for(let tour=0;tour<12;tour++){d=new Int32Array(N).fill(-1);const q=[depuis??idx(G.px,G.py)];d[q[0]]=0;const touche=new Set();
    const ok=j=>{const v=t[j];if(ouvert.has(j))return true;if(v===LEVIER||v===PILE||v===CHARGEUR){touche.add(j);return v===PILE;}return !blocks(v)||v===LOCK||v===SECRET;};
    for(let a=0;a<q.length;a++){const c=q[a],x=c%W,y=(c/W)|0;for(const [dx,dy] of D4){const j=idx(x+dx,y+dy);if(d[j]<0&&ok(j)){d[j]=d[c]+1;q.push(j);}}}
    let neuf=false;
    for(const c of G.circ||[]){if(c._vu)continue;
      const atteint=c.k==='levier'?touche.has(c.c):Object.entries(G.piles||{}).some(([k,p])=>p.soc===c.c&&(touche.has(+k)||d[+k]>=0));
      if(atteint||c.on){c._vu=1;neuf=true;for(const k of c.cib)if(k.t!=='lasers')for(const j of k.c)ouvert.add(j);}}
    if(!neuf)break;}
  for(const c of G.circ||[])delete c._vu;
  const s=G.sites[0];return s?d[idx(s.x,s.y)]:-1;}
/* ----- Génération ----- */
const BUTIN_DEPOT=()=>{const c=Object.keys(ITEMS).filter(k=>ITEMS[k].conso&&k!=='cle'),e=Object.keys(ITEMS).filter(k=>!ITEMS[k].conso&&!ITEMS[k].base&&k!=='cle'&&ITEMS[k].slot);
  const l=[c[rnd(0,c.length-1)],c[rnd(0,c.length-1)]];if(e.length&&Math.random()<.6)l.push(e[rnd(0,e.length-1)]);return l;};
function machines(){G.las=[];G.lz={};G.circ=[];G.soc={};G.piles={};G.mt=0;G.machN={};
  if(!BATI_DER||!G.batis||!G.batis.length)return;const {B,strs}=BATI_DER,t=G.t,N=W*H,A=ARTEFACTS,site=G.sites&&G.sites[0]?idx(G.sites[0].x,G.sites[0].y):-1,dep=idx(G.px,G.py);
  const base=!!(RECETTES[GEN.recette]||{}).base,fac=base?(GEN.bsMachines??100)/100:.35,compte=n=>Math.floor(n)+(Math.random()<n-Math.floor(n)?1:0);
  const fq=(k,f)=>{const a=A[k];if(!a||!a.on)return 0;return compte(ART_LISTE.find(m=>m[0]===k)[3][a.f]*(f??fac));};
  const pieces=[];for(const S of strs)for(const p of S.pieces)if(p.c.length>=9&&!p.c.includes(site)&&!p.c.includes(dep)&&!p.c.some(i=>t[i]!==FLOOR&&t[i]!==PILLAR&&t[i]!==CHASM&&t[i]!==BRIDGE&&t[i]!==MACHINE))pieces.push(p);
  if(!pieces.length)return;
  const mel=l=>l.slice().sort(()=>Math.random()-.5),murV=i=>D4.some(([dx,dy])=>t[idx(i%W+dx,((i/W)|0)+dy)]===WALL);
  const pres=i=>{const x=i%W,y=(i/W)|0;return B.porte[i]||D4.some(([dx,dy])=>{const j=idx(x+dx,y+dy);return B.porte[j]||t[j]===DOOR||t[j]===LOCK;});};   // case de passage : jamais de piège juste devant une porte
  const libre=i=>t[i]===FLOOR&&i!==site&&i!==dep&&!(G.items[i]&&G.items[i].length)&&!G.cles[i]&&!(G.soc[i]!=null)&&!G.lz[i];
  const pose=(p,terrain,val,mur)=>{const c=p.c.filter(i=>libre(i)&&artLibre(B,i,site));if(!c.length)return -1;const m=c.filter(murV),l=mur&&m.length?m:c,i=l[rnd(0,l.length-1)];t[i]=terrain;G.art[i]=val;return i;};
  // distance depuis l'arrivée ; une porte verrouillée se franchit (sa clé est toujours accessible), une porte dérobée seulement si « secret »
  const dist=secret=>{const d=new Int32Array(N).fill(-1),q=[dep];d[dep]=0;for(let a=0;a<q.length;a++){const c=q[a],x=c%W,y=(c/W)|0;for(const [dx,dy] of D4){const j=idx(x+dx,y+dy),v=t[j];if(d[j]<0&&(!blocks(v)||v===LOCK||(secret&&v===SECRET))){d[j]=d[c]+1;q.push(j);}}}return d;};
  const inc=k=>G.machN[k]=(G.machN[k]||0)+1;let grp=0;
  // -- tourelles : des bandes de deux cases de large, séparées par deux cases sûres au moins
  const tourelles=p=>{const P=new Set(p.c),g=++grp;let mieux=null;
    for(const o of mel([0,1,2,3])){const [dx,dy]=MACH_DIR[o],vert=!dx,bandes=[];
      // colonnes (ou rangées) où un rayon d'au moins 3 cases part d'un mur et finit sur un obstacle
      const rayon=(x,y)=>{const m=idx(x,y);if(t[m]!==WALL||pres(m))return 0;let n=0,a=x+dx,b=y+dy;while(P.has(idx(a,b))&&t[idx(a,b)]===FLOOR&&!pres(idx(a,b))&&idx(a,b)!==site){n++;a+=dx;b+=dy;}
        return n>=3&&blocks(t[idx(a,b)])?n:0;};
      for(const i of p.c){const x=i%W,y=(i/W)|0,mx=x-dx,my=y-dy;if(t[idx(mx,my)]!==WALL)continue;const cle=vert?mx:my;
        const a=rayon(mx,my),b=vert?rayon(mx+1,my):rayon(mx,my+1);if(a&&b&&Math.abs(a-b)<=2)bandes.push([cle,idx(mx,my),vert?idx(mx+1,my):idx(mx,my+1)]);}
      bandes.sort((a,b)=>a[0]-b[0]+(Math.random()-.5)*.1);const pris=[];
      for(const b of bandes)if(!pris.length||b[0]>=pris[pris.length-1][0]+4)pris.push(b);
      if(pris.length&&(!mieux||pris.length>mieux.pris.length))mieux={o,pris};}
    if(!mieux||(mieux.pris.length<2&&p.c.length>40))return 0;const {o,pris}=mieux,[dx,dy]=MACH_DIR[o];
    for(const b of pris.slice(0,4)){const per=rnd(4,7);for(const m of [b[1],b[2]]){t[m]=TURRET;G.art[m]=o;}G.las.push({k:'t',c:[b[1],b[2]],d:[dx,dy],per,off:rnd(0,per-1),on:1,g,cut:0});}
    p.mach='lasers';return g;};
  // -- croix : un quadrillage de pylônes, un sur trois
  const croix=p=>{const P=new Set(p.c),g=++grp;let best=null;
    for(let ax=0;ax<3;ax++)for(let ay=0;ay<3;ay++){const l=p.c.filter(i=>(i%W)%3===ax&&((i/W)|0)%3===ay&&libre(i)&&!pres(i)&&D4.every(([dx,dy])=>{const j=idx(i%W+dx,((i/W)|0)+dy);return P.has(j)&&t[j]===FLOOR&&!pres(j);}));if(!best||l.length>best.length)best=l;}
    if(!best||best.length<2)return 0;const poses=[];
    for(const i of mel(best).slice(0,9)){if(!artLibre(B,i,site))continue;t[i]=PYLON;G.art[i]=0;poses.push(i);}
    if(poses.length<2){for(const i of poses){t[i]=FLOOR;delete G.art[i];}return 0;}
    for(const i of poses){const per=rnd(3,7);G.las.push({k:'x',c:[i],d:[0,0],per,off:rnd(0,per-1),on:rnd(1,2),g,cut:0});}
    p.mach='croix';return g;};
  // -- levier coupe-circuit, au fond de la salle : la traversée une fois réussie, le retour est sûr
  const coupe=(p,g)=>{machZone();const d=dist(),c=p.c.filter(i=>libre(i)&&artLibre(B,i,site)&&d[i]>=0).sort((a,b)=>d[b]-d[a]);if(!c.length)return;
    const i=c[rnd(0,Math.min(2,c.length-1))];t[i]=LEVIER;G.art[i]=0;G.circ.push({k:'levier',c:i,on:0,perm:0,cib:[{t:'lasers',g}]});};
  // -- pont à levier : un fossé de deux cases coupe la pièce ; le levier est posé du côté d'où l'on vient
  const pont=p=>{const P=new Set(p.c),xs=p.c.map(i=>i%W),ys=p.c.map(i=>(i/W)|0),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
    for(const vert of mel(x1-x0>=y1-y0?[true,true,false]:[false,false,true])){const a0=vert?x0:y0,a1=vert?x1:y1;if(a1-a0<6)continue;
      for(const c of mel(Array.from({length:a1-a0-5},(_,k)=>a0+3+k))){
        const fosse=p.c.filter(i=>{const v=vert?i%W:(i/W)|0;return v===c||v===c+1;});if(fosse.length<4||fosse.length>16||fosse.some(i=>t[i]!==FLOOR||pres(i)||i===site||i===dep||G.lz[i]))continue;
        // le fossé doit couper la pièce d'un bord à l'autre : ses voisins hors de la pièce, sur les côtés, sont des murs
        if(fosse.some(i=>{const x=i%W,y=(i/W)|0;return (vert?[[0,1],[0,-1]]:[[1,0],[-1,0]]).some(([dx,dy])=>{const j=idx(x+dx,y+dy);return !P.has(j)&&!blocks(t[j]);});}))continue;
        const lignes=[...new Set(fosse.map(i=>vert?(i/W)|0:i%W))],lg=lignes[rnd(0,lignes.length-1)],pt=fosse.filter(i=>(vert?(i/W)|0:i%W)===lg);if(pt.length!==2)continue;
        const sv=fosse.map(i=>t[i]);for(const i of fosse)t[i]=CHASM;
        const d=dist(),pres1=p.c.filter(i=>d[i]>=0&&libre(i)&&artLibre(B,i,site)),loin=p.c.some(i=>t[i]===FLOOR&&d[i]<0);
        // le levier : dans cette pièce du côté accessible, ou ailleurs dans la partie accessible de la carte
        let cand=pres1;if(!loin||Math.random()<.5){const autres=[];for(const q of pieces)if(q!==p&&!q.mach)for(const i of q.c)if(d[i]>=0&&libre(i)&&artLibre(B,i,site)&&murV(i))autres.push(i);if(autres.length)cand=autres;}
        if(!cand.length){fosse.forEach((i,n)=>t[i]=sv[n]);continue;}
        if(Math.random()<.35){const q=alimente([{t:'pont',c:pt}],p);   // une fois sur trois, le pont est alimenté par une pile sur son socle
          if(q){if(accesSite()>=0){p.mach='pont';inc('piles');return true;}annule(q);}}
        const lv=cand[rnd(0,cand.length-1)];t[lv]=LEVIER;G.art[lv]=0;G.circ.push({k:'levier',c:lv,on:0,perm:1,cib:[{t:'pont',c:pt}]});
        if(accesSite()<0){G.circ.pop();t[lv]=FLOOR;delete G.art[lv];fosse.forEach((i,n)=>t[i]=sv[n]);continue;}
        p.mach='pont';return true;}}
    return false;};
  // -- dépôt : une pièce à une seule entrée, fermée par une grille ; la pile, son socle et son chargeur sont dans une autre pièce
  const sokoban=(q,a,s)=>{   // peut-on pousser la pile de a jusqu'à s, en restant dans la pièce q ? (parcours des états pile + côté de la foreuse)
    const Q=new Set(q.c.filter(i=>t[i]===FLOOR)),lib=(i,pile)=>Q.has(i)&&i!==pile,vu=new Set(),file=[];
    const zone=(de,pile)=>{const z=new Set([de]),f=[de];for(let k=0;k<f.length;k++){const x=f[k]%W,y=(f[k]/W)|0;for(const [dx,dy] of D4){const j=idx(x+dx,y+dy);if(lib(j,pile)&&!z.has(j)){z.add(j);f.push(j);}}}return z;};
    const e0=q.c.find(i=>lib(i,a)&&pres(i))??q.c.find(i=>lib(i,a));if(e0==null)return -1;
    file.push([a,e0,0]);vu.add(a+'|'+e0);
    for(let k=0;k<file.length&&k<4000;k++){const [pl,jo,n]=file[k];if(pl===s)return n;const z=zone(jo,pl),x=pl%W,y=(pl/W)|0;
      for(const [dx,dy] of D4){const der=idx(x-dx,y-dy),dev=idx(x+dx,y+dy);if(!z.has(der)||!Q.has(dev))continue;const cle=dev+'|'+pl;if(vu.has(cle))continue;vu.add(cle);file.push([dev,pl,n+1]);}}
    return -1;};
  // pose une pile, son socle et son chargeur dans une pièce accessible, et relie le socle à « cib ». exclu : pièce à ne pas prendre.
  const alimente=(cib,exclu)=>{const d2=dist();
    for(const q of mel(pieces)){if(q===exclu||q.mach||q.c.length<16||q.c.some(i=>d2[i]<0||t[i]!==FLOOR))continue;
      for(let k=0;k<25;k++){const c=q.c.filter(i=>libre(i)&&!pres(i)),a=c[rnd(0,c.length-1)],s=c[rnd(0,c.length-1)];if(a==null||a===s||Math.hypot(a%W-s%W,((a/W)|0)-((s/W)|0))<3||!artLibre(B,a,site))continue;
        const n=sokoban(q,a,s);if(n<2)continue;
        t[a]=PILE;const ch=pose(q,CHARGEUR,0,true);if(ch<0){t[a]=FLOOR;break;}
        t[a]=FLOOR;const n2=sokoban(q,a,s);t[a]=PILE;if(n2<2){t[a]=FLOOR;t[ch]=FLOOR;delete G.art[ch];continue;}
        G.piles[a]={home:a,sous:FLOOR,ch,soc:s};G.soc[s]=G.circ.length;G.circ.push({k:'socle',c:s,on:0,perm:0,cib});q.mach='pile';return q;}}
    return null;};
  const annule=q=>{const c=G.circ.pop(),s=c.c;delete G.soc[s];for(const k in G.piles)if(G.piles[k].soc===s){t[+k]=FLOOR;t[G.piles[k].ch]=FLOOR;delete G.art[G.piles[k].ch];delete G.piles[k];}q.mach=null;};
  const depot=p=>{const P=new Set(p.c),ent=[];if(p.c.length>60)return false;
    for(const i of p.c){const x=i%W,y=(i/W)|0;for(const [dx,dy] of D4){const j=idx(x+dx,y+dy);if(!P.has(j)&&!blocks(t[j])&&!ent.includes(j))ent.push(j);}}
    if(ent.length!==1||(t[ent[0]]!==DOOR&&t[ent[0]]!==FLOOR)||G.lz[ent[0]])return false;const e=ent[0],sous=t[e];
    t[e]=GRILLE;const d=dist(true);if(d[site]<0||p.c.some(i=>d[i]>=0)){t[e]=sous;return false;}   // la grille ne doit enfermer que ce dépôt, jamais le site
    if(!alimente([{t:'grille',c:[e],sous:[sous]}],p)){t[e]=sous;return false;}
    const but=BUTIN_DEPOT(),cs=mel(p.c.filter(i=>t[i]===FLOOR));but.forEach((o,n)=>{if(cs[n]!=null)(G.items[cs[n]]=G.items[cs[n]]||[]).push(o);});
    p.mach='depot';return true;};
  // ----- répartition -----
  const essaie=(n,f)=>{let fait=0;for(const p of mel(pieces)){if(fait>=n)break;if(p.mach||p.herbe)continue;if(f(p))fait++;}return fait;};
  for(let k=essaie(fq('ponts'),pont);k>0;k--)inc('ponts');
  for(let k=essaie(fq('piles'),depot);k>0;k--)inc('piles');
  essaie(fq('lasers'),p=>{const g=tourelles(p);if(!g)return false;inc('lasers');if(Math.random()<.6)coupe(p,g);return true;});
  essaie(fq('croix'),p=>{const g=croix(p);if(!g)return false;inc('croix');if(Math.random()<.4)coupe(p,g);return true;});
  for(let k=fq('station');k>0;k--)for(const p of mel(pieces)){if(p.mach==='lasers'||p.mach==='croix')continue;if(pose(p,STATION,0,true)>=0){inc('station');break;}}
  for(let k=fq('fabric',1);k>0;k--)for(const p of mel(pieces)){if(p.mach==='lasers'||p.mach==='croix')continue;if(pose(p,FABRIC,0,true)>=0){inc('fabric');break;}}
  machZone();if(G.artN)Object.assign(G.artN,G.machN);
  // garde-fou : si malgré tout le site n'est plus atteignable, tous les circuits sont ouverts d'office
  if(accesSite()<0){for(const c of G.circ){c.on=1;c.perm=1;if(c.k==='levier')G.art[c.c]=1;circApplique(c,true);}}
}
