// icône d'œil (pixel art) de la fiche de survol : risque d'être repéré par un ennemi calme
const EYE_SVG='<svg class="eyeic" viewBox="0 0 11 7" width="22" height="14" shape-rendering="crispEdges" aria-hidden="true"><path fill="currentColor" d="M3 0h5v1H3zM1 1h2v1H1zM8 1h2v1H8zM0 2h1v3H0zM10 2h1v3h-1zM1 5h2v1H1zM8 5h2v1H8zM3 6h5v1H3zM4 2h3v3H4z"/></svg>';
/* ---------- Souris, inspection et déplacement automatique (inspirés de Brogue) ---------- */
let HOV=null,INSPECT=false,TRAV=null,lastPT='mouse',PC={k:'',p:null};
const busy=()=>!G||!!G.over||drilling||!$('overlay').hidden;
// créature visible sur une case (les animaux cachés par le brouillard ne bloquent pas le tracé)
function occupant(x,y){const seenHere=!fog||vis[idx(x,y)];if(!seenHere)return null;return beastAt(x,y)||animalAt(x,y)||null;}
// Plus court chemin (Dijkstra, 8 directions) sur les cases connues ; l'eau profonde est évitée autant que possible.
// La destination peut être une créature ou une roche : la dernière étape devient alors un coup de foreuse.
// explore : les cases jamais vues sont supposées franchissables (coût uniforme, sans regarder ce qu'elles cachent) ;
// la foreuse avance vers une destination dans le brouillard et recalcule sa route à chaque pas
function findPath(tx,ty,explore){
  if(tx<0||ty<0||tx>=W||ty>=H||(tx===G.px&&ty===G.py))return null;const ti=idx(tx,ty),v=G.t[ti],tUnk=fog&&!G.seen[ti];
  if(tUnk&&!explore)return null;if(!tUnk&&v===CHASM)return null;
  if(!tUnk&&(v===ROCK||v===MOUNT)&&(tx===0||ty===0||tx===W-1||ty===H-1))return null;
  const N=W*H,dist=new Float64Array(N).fill(Infinity),prev=new Int32Array(N).fill(-1),hp=heap(),s0=idx(G.px,G.py);dist[s0]=0;hp.push(s0,0);
  while(hp.size){const [d,c]=hp.pop();if(d>dist[c])continue;if(c===ti)break;const x=c%W,y=(c/W)|0;
    for(const [dx,dy] of DIRS){const a=x+dx,b=y+dy;if(a<0||b<0||a>=W||b>=H)continue;const j=idx(a,b);if(!diagOk(x,y,dx,dy)&&(!fog||(G.seen[idx(x+dx,y)]&&G.seen[idx(x,y+dy)])))continue;   // coin connu seulement
      const unk=fog&&!G.seen[j];
      if(j!==ti&&(unk?!explore:(blocks(G.t[j])||occupant(a,b))))continue;
      const w=G.t[j],nd=d+(dx&&dy?1.001:1)+(unk?.3:w===DEEP?6:w===LIQ?.4:0);
      if(nd<dist[j]){dist[j]=nd;prev[j]=c;hp.push(j,nd);}}}
  if(dist[ti]===Infinity)return null;
  const p=[];for(let c=ti;c!==s0;c=prev[c])p.push([c%W,(c/W)|0]);return p.reverse();}
function getPath(){if(!HOV||!G)return null;const k=[HOV.x,HOV.y,G.turn,G.px,G.py,fog,G.t[idx(HOV.x,HOV.y)]].join();
  if(PC.k!==k){PC.k=k;PC.p=findPath(HOV.x,HOV.y)||findPath(HOV.x,HOV.y,true);}return PC.p;}
// Trajet : un petit rond blanc en pixel art (4 × 4 pixels de tuile) au centre de chaque case intermédiaire,
// rien sur la case du viseur (trajet en cours, sinon trajet vers la case survolée)
const PATH_DOT=curCanvas(Array.from({length:16},(_,y)=>y===6||y===9?'.......ww.......':y===7||y===8?'......wwww......':'................'));
function drawPath(){const p=TRAV?TRAV.path.slice(TRAV.i):(HOV&&!busy()?getPath():null);if(!p||!p.length)return;
  ctx.globalAlpha=.7;
  for(const [x,y] of p){if(HOV&&x===HOV.x&&y===HOV.y)continue;ctx.drawImage(PATH_DOT,(x-camX)*S,(y-camY)*S,S,S);}
  ctx.globalAlpha=1;}
function goTo(x,y){if(busy())return;const d=Math.max(Math.abs(x-G.px),Math.abs(y-G.py));
  if(d===0){if(siteAt(x,y))askDrill();return;}
  if(d===1){tryMove(x-G.px,y-G.py);return;}
  const p=findPath(x,y)||findPath(x,y,true);if(!p){say('Destination inaccessible.');SFX.blocked();render();return;}
  const gk=new Set();if(G.gems)for(const k in G.gems)if(vis[+k])gk.add(k);
  const seen=new Set();for(const e of [...(G.beasts||[]),...(G.animals||[])])if(vis[idx(e.x,e.y)])seen.add(e);
  TRAV={path:p,i:0,tx:x,ty:y,explore:p.some(([a,b])=>fog&&!G.seen[idx(a,b)]),seen,gk,vie:G.st.vie,sites:G.sites.filter(s=>s.seen).length,tm:0};travelStep();}
function stopTravel(m){if(!TRAV)return;clearTimeout(TRAV.tm);TRAV=null;if(m)sayMore(m,'warn');render();}
// Un pas par tour ; le trajet s'arrête au moindre imprévu
function travelEvent(T){
  if(G.st.vie<T.vie)return 'Trajet interrompu : la foreuse est attaquée.';
  for(const b of G.beasts||[])if(vis[idx(b.x,b.y)]&&!T.seen.has(b))return `Trajet interrompu : ${BEASTS[b.sp].n.toLowerCase()} en vue.`;
  for(const a of G.animals||[])if(vis[idx(a.x,a.y)]&&!T.seen.has(a))return `Trajet interrompu : ${SPECIES[a.sp].n.toLowerCase()} en vue.`;
  if(G.sites.filter(s=>s.seen).length>T.sites)return 'Trajet interrompu : site de forage repéré.';
  if(T.i<T.path.length&&siteAt(G.px,G.py))return 'Trajet interrompu : site de forage atteint.';
  if(G.gems)for(const k in G.gems)if(vis[+k]&&!T.gk.has(k))return 'Trajet interrompu : joyau repéré.';
  return null;}
function travelStep(){const T=TRAV;if(!T)return;if(busy()){stopTravel();return;}
  if(T.explore){   // trajet lancé à travers l'inexploré : la route est recalculée à chaque pas avec ce que la foreuse voit, sans jamais forer
    const np=findPath(T.tx,T.ty)||findPath(T.tx,T.ty,true);
    if(!np){stopTravel('La foreuse s’arrête : plus de passage vers la destination.');return;}
    T.path=np;T.i=0;
    const [fx,fy]=np[0];if(blocks(G.t[idx(fx,fy)])){stopTravel(np.length===1?'La foreuse s’arrête : la destination est infranchissable.':'La foreuse s’arrête : passage bloqué.');return;}}
  const [nx,ny]=T.path[T.i],dx=nx-G.px,dy=ny-G.py,last=T.i===T.path.length-1;
  if(Math.max(Math.abs(dx),Math.abs(dy))!==1){stopTravel('Trajet interrompu : la foreuse a dévié de sa route.');return;}
  if(!last&&occupant(nx,ny)){stopTravel('Trajet interrompu : passage bloqué.');return;}
  const turn=G.turn;tryMove(dx,dy);T.i++;
  if(TRAV!==T)return;
  if(G.turn===turn){stopTravel();return;}
  const why=travelEvent(T);
  if(why||T.i>=T.path.length||busy()){stopTravel(why);return;}
  T.tm=setTimeout(travelStep,reduced?30:90);}
/* ---------- Exploration automatique (touche O, bouton EXPLORER) ----------
   La foreuse va d'elle-même à la case connue la plus proche d'où l'on découvre du terrain, en ramassant au passage ce qui est en vue
   (objets, Matière, joyau, et les éclats de réparation seulement si la vie n'est pas pleine : sinon elle les contourne pour ne pas les gâcher).
   Elle ne fore jamais et n'entre dans l'eau profonde que s'il ne reste rien d'autre. Elle s'arrête au moindre événement (exploreEvent),
   à la moindre touche ou au moindre clic. Quand tout est exploré, elle rejoint le site de forage s'il est connu. */
let EXPL=null;
const EXPL_VUS=new WeakSet();   // créatures déjà signalées : chacune n'interrompt l'exploration qu'une fois (sinon un insectoïde qui suit la foreuse l'arrêterait sans cesse)
function exploreScan(E,deep){const N=W*H,prev=new Int32Array(N).fill(-2),q=[idx(G.px,G.py)];prev[q[0]]=-1;const plein=G.st.vie>=G.st.vieMax;
  const butin=j=>{if(G.items&&G.items[j]&&G.items[j].length)return 'un objet';const o=G.ore&&G.ore[j];if(o&&oreSol(o)&&(oreMat(o)||!plein))return oreMat(o)?'de la Matière':'des éclats de métal';
    return G.gems&&G.gems[j]==='visible'?'un joyau':null;};
  for(let k=0;k<q.length;k++){const c=q[k],x=c%W,y=(c/W)|0;
    if(k>0){if(butin(c))return {c,prev};
      if(!E.vu.has(c))for(const[dx,dy]of DIRS){const a=x+dx,b=y+dy;if(a>=0&&b>=0&&a<W&&b<H&&!G.seen[idx(a,b)])return {c,prev};}}
    for(const[dx,dy]of DIRS){const a=x+dx,b=y+dy;if(a<1||b<1||a>=W-1||b>=H-1)continue;const j=idx(a,b);if(prev[j]!==-2||!G.seen[j])continue;const v=G.t[j];
      if(blocks(v)||(v===DEEP&&!deep)||!diagOk(x,y,dx,dy)||occupant(a,b))continue;
      const o=G.ore&&G.ore[j];if(plein&&o&&oreSol(o)&&!oreMat(o))continue;
      prev[j]=c;q.push(j);}}
  return null;}
function exploreEvent(E){
  if(G.st.vie<E.vie)return 'la foreuse est attaquée';
  let nv=null;for(const e of [...(G.beasts||[]),...(G.animals||[])])if(vis[idx(e.x,e.y)]&&!EXPL_VUS.has(e)){EXPL_VUS.add(e);nv=nv||e;}
  if(nv)return `${(G.beasts.includes(nv)?BEASTS:SPECIES)[nv.sp].n.toLowerCase()} en vue`;
  if((G.beasts||[]).some(b=>b.hunt>0&&vis[idx(b.x,b.y)]))return 'un ennemi vous chasse';
  if(G.sites.filter(s=>s.seen).length>E.sites)return 'site de forage repéré';
  if(G.gems)for(const k in G.gems)if(vis[+k]&&!E.gk.has(k))return 'joyau repéré';
  const ef=G.eff||{};if(ef.poison>0||ef.glu>0)return 'la foreuse subit un effet';
  if(G.msg&&G.msg.c==='warn')return 'alerte';
  return null;}
function stopExplore(m,c){if(!EXPL)return;clearTimeout(EXPL.tm);EXPL=null;$('explBtn').classList.remove('on');if(m)sayMore(m,c||'warn');render();}
function startExplore(){
  if(EXPL){stopExplore('Exploration interrompue.');return;}
  if(busy()||TRAV||REST)return;
  if((G.beasts||[]).some(b=>b.hunt>0&&vis[idx(b.x,b.y)])){say('Un ennemi vous chasse : pas d’exploration automatique.','warn');SFX.blocked();render();return;}
  const gk=new Set();if(G.gems)for(const k in G.gems)if(vis[+k])gk.add(k);
  for(const e of [...(G.beasts||[]),...(G.animals||[])])if(vis[idx(e.x,e.y)])EXPL_VUS.add(e);
  EXPL={gk,vie:G.st.vie,sites:G.sites.filter(s=>s.seen).length,vu:new Set(),n:0,tm:0};$('explBtn').classList.add('on');
  say('Exploration automatique. Une touche ou un clic pour l’arrêter.','info');exploreStep();}
function exploreStep(){const E=EXPL;if(!E)return;if(busy()){stopExplore();return;}
  E.vu.add(idx(G.px,G.py));
  const r=exploreScan(E,false)||exploreScan(E,true);
  if(!r){const s=G.sites.find(s=>s.seen);
    if(s&&!(s.x===G.px&&s.y===G.py)){stopExplore('Tout est exploré : la foreuse rejoint le site de forage.','info');goTo(s.x,s.y);}
    else stopExplore(s?'Tout est exploré. [F] pour forer.':'Plus rien à explorer sans forer la roche.','info');
    return;}
  let c=r.c;const s0=idx(G.px,G.py);while(r.prev[c]!==s0)c=r.prev[c];
  const turn=G.turn;tryMove(c%W-G.px,((c/W)|0)-G.py);E.n++;
  if(EXPL!==E)return;
  if(G.turn===turn){stopExplore('Exploration interrompue : passage bloqué.');return;}
  if(busy()){stopExplore();return;}
  const why=exploreEvent(E);if(why){stopExplore(why==='alerte'?'Exploration interrompue.':`Exploration interrompue : ${why}.`);return;}
  E.tm=setTimeout(exploreStep,reduced?20:70);}
/* ---------- Repos (touche P) : attendre jusqu'à l'énergie pleine ----------
   Chaque battement est une attente normale (recharge doublée, portée de discrétion ÷ 2). Le repos
   s'arrête dès que l'énergie est pleine, qu'une créature entre dans le champ de vision, qu'un ennemi
   visible vous repère, que la foreuse est touchée, ou au moindre geste du joueur. */
let REST=null;
const REST_MAX=400;                                   // garde-fou : jamais plus de 400 battements d'affilée
const visibles=()=>{const s=new Set();for(const e of [...(G.beasts||[]),...(G.animals||[])])if(vis[idx(e.x,e.y)])s.add(e);return s;};
function restEvent(T){
  if(G.st.vie<T.vie)return 'la foreuse est attaquée';
  for(const b of G.beasts||[])if(vis[idx(b.x,b.y)]&&!T.seen.has(b))return `${BEASTS[b.sp].n.toLowerCase()} en vue`;
  for(const a of G.animals||[])if(vis[idx(a.x,a.y)]&&!T.seen.has(a))return `${SPECIES[a.sp].n.toLowerCase()} en vue`;
  for(const b of G.beasts||[])if(b.hunt>0&&vis[idx(b.x,b.y)])return `${BEASTS[b.sp].n.toLowerCase()} vous a repéré`;
  for(const a of G.animals||[])if(a.aware&&vis[idx(a.x,a.y)])return `${SPECIES[a.sp].n.toLowerCase()} vous a repéré`;
  return null;}
function startRest(){
  if(busy()||TRAV||EXPL)return;
  if(G.st.energie>=G.st.energieMax){say('Énergie déjà au maximum : repos inutile.');SFX.blocked();render();return;}
  const T={seen:visibles(),vie:G.st.vie,n:0,tm:0},why=restEvent(T);
  if(why){say(`Repos impossible : ${why}.`,'warn');SFX.blocked();render();return;}
  REST=T;say('La foreuse se met au repos.');restStep();}
function stopRest(m,c){if(!REST)return;clearTimeout(REST.tm);REST=null;if(m)sayMore(m,c||'warn');render();}
function restStep(){const T=REST;if(!T)return;if(busy()){stopRest();return;}
  const turn=G.turn;waitTurn();
  if(REST!==T)return;
  if(G.turn===turn){stopRest();return;}
  T.n++;
  const why=restEvent(T);
  if(why){stopRest(`Repos interrompu (${T.n} tour${T.n>1?'s':''}) : ${why}.`);return;}
  if(G.st.energie>=G.st.energieMax){stopRest(`Repos terminé : énergie au maximum, en ${T.n} tour${T.n>1?'s':''}.`,'good');SFX.spot();return;}
  if(T.n>=REST_MAX){stopRest('Repos interrompu : trop long.');return;}
  T.tm=setTimeout(restStep,reduced?0:45);}

// Mode inspection au clavier (touche X)
function setInspect(on){INSPECT=on;$('inspTag').hidden=!on;if(on){if(freeCam)setFreeCam(false);HOV={x:G.px,y:G.py};}else HOV=null;render();}
function moveInspect(dx,dy){const vc=Math.floor(vw/S),vr=Math.floor(vh/S);
  HOV={x:Math.max(camX,Math.min(Math.min(W,camX+vc)-1,HOV.x+dx)),y:Math.max(camY,Math.min(Math.min(H,camY+vr)-1,HOV.y+dy))};render();}
const cellAt=ev=>{const r=cv.getBoundingClientRect();return {x:Math.floor((ev.clientX-r.left)/S)+camX,y:Math.floor((ev.clientY-r.top)/S)+camY};};
cv.addEventListener('pointerdown',ev=>{lastPT=ev.pointerType||'mouse';});
cv.addEventListener('pointermove',ev=>{if(ev.pointerType==='touch'||!G)return;const c=cellAt(ev);if(c.x<0||c.y<0||c.x>=W||c.y>=H)return;
  if(!HOV||HOV.x!==c.x||HOV.y!==c.y){HOV=c;render();}});
cv.addEventListener('pointerleave',()=>{if(INSPECT||lastPT==='touch')return;if(HOV){HOV=null;render();}});
cv.addEventListener('click',ev=>{if(busy())return;if(EXPL){stopExplore('Exploration interrompue.');return;}if(REST){stopRest('Repos interrompu.');return;}if(TRAV){stopTravel('Trajet interrompu.');return;}
  const c=cellAt(ev);if(c.x<0||c.y<0||c.x>=W||c.y>=H)return;
  // écran tactile : un premier appui inspecte et montre le trajet, un second sur la même case lance le déplacement
  if(lastPT==='touch'&&(!HOV||HOV.x!==c.x||HOV.y!==c.y)){HOV=c;render();return;}
  if(INSPECT){INSPECT=false;$('inspTag').hidden=true;}if(freeCam)setFreeCam(false);
  HOV=c;goTo(c.x,c.y);});
// Fiche complète de la case survolée, affichée en tête du panneau « En vue »
const TDESC={[GROUND]:['Sol rocheux','Praticable. Les points au sol se densifient à l’approche d’un site de forage.'],
  [ROCK]:['Rocher','Infranchissable, ne bloque pas la vue. Cède en 2 coups de foreuse et laisse des gravats.'],
  [MOUNT]:['Montagne','Infranchissable et opaque. Cède en 2 coups de foreuse, sauf en bordure de carte. Peut renfermer un joyau.'],
  [LIQ]:['Eau peu profonde','Praticable. Esquive −20 pour qui s’y trouve. Insectoïdes et cafars l’évitent ; les crabos y entrent.'],
  [DEEP]:['Eau profonde','Praticable. Esquive −20, et le courant déplace la foreuse d’une case au hasard à chaque tour. Seuls les crabos s’y aventurent.'],
  [GRASS]:['Herbes hautes','Praticables mais opaques. Esquive +10 pour qui s’y cache. Elles se couchent au passage.'],
  [FLAT]:['Herbes basses','Ne bloquent pas la vue. Vous y êtes deux fois plus discret.'],
  [CHASM]:['Gouffre','Infranchissable. Ne bloque pas la vue.'],[BRIDGE]:['Pont','Praticable. Permet de franchir un gouffre.'],
  [RUBBLE]:['Gravats','Praticables. Restes d’une roche brisée.'],
  [SHIP]:['Coque du vaisseau','Infranchissable et indestructible, ne bloque pas la vue. Le cargo qui a déposé la foreuse.'],
  [DECK]:['Soute du vaisseau','Praticable. La foreuse peut toujours y revenir ; la porte est à l’arrière.']};
const BEHAV={insectoide:'Suit la foreuse à 2 ou 3 cases ; passe à l’attaque si un ennemi la chasse à proximité, et ne recule plus ensuite.',
  crabos:'Chasse la foreuse dès qu’il la voit et l’attaque au contact. Abandonne environ 8 tours après l’avoir perdue de vue.',
  cafar:'Vit en bande : ce qu’un membre voit, toute la bande le sait.',
  crachin:'Crache de l’acide jusqu’à 5 cases tant qu’il vous voit ; recule une fois sur deux quand on le serre. Fragile au contact.',
  viperin:'Morsure empoisonnée : 2 points de vie perdus par battement pendant 5 battements.',
  gluar:'Lent et résistant. Sa glu double la durée de vos pas pendant 4 battements.',
  siphon:'Rapide, difficile à toucher. Chaque piqûre vole 15 d’énergie.',
  tapi:'Embusqué dans les herbes hautes, invisible : frappe par surprise (coup critique) quand on passe à son contact.',
  taupar:'Creuseur : une fois en chasse, il vient en ligne droite en perçant la roche.',
  mastok:'Colosse lent : beaucoup de points de vie, des coups très lourds. Mieux vaut l’éviter ou le fuir.'};
function inspectHTML(){const {x,y}=HOV;if(x<0||y<0||x>=W||y>=H)return '';
  const i=idx(x,y),seen=!fog||G.seen[i],see=!fog||vis[i],d=Math.max(Math.abs(x-G.px),Math.abs(y-G.py)),dt=d?`${d} case${d>1?'s':''}`:'ici';
  const head=(ic,n,ex)=>`<div class="ih">${ic?`<img src="${ic}" alt="">`:''}<b>${n}</b><span>${ex||''}</span></div>`;
  if(!seen&&G.ore&&G.ore[i]&&sonarVu(i,sonarR())){const o=G.ore[i];return `<div class="insp">${head('','Gisement détecté',dt)}<p><b>${oreMat(o)?'Matière':'Éclats de métal'}</b> · repéré par le sonar : ${oreMat(o)?`+${ORE_PV[oreLv(o)]} en réserve`:`+${ORE_PV[oreLv(o)]} PV`}. ${oreSol(o)?'Au sol.':'Pris dans la roche : il faudra forer.'}</p></div>`;}
  if(!seen)return `<div class="insp">${head('','Zone inexplorée',dt)}<p>Aucune donnée : la foreuse n’est jamais passée à portée de ce secteur.</p></div>`;
  const out=[],t=G.t[i],[tn,td]=TDESC[t]||['Terrain',''],border=x===0||y===0||x===W-1||y===H-1;
  const occ=see?occupant(x,y):null;
  if(d===0){const st=G.st;out.push(head(ICON.robot_r,'Foreuse U-7',dt),
    `<div class="kv"><span>Vie <b>${Math.ceil(st.vie)}/${st.vieMax}</b></span><span>Énergie <b>${Math.floor(st.energie)}/${st.energieMax}</b></span><span>ESQ <b>${robotEsq()}</b></span></div>`);}
  else if(occ){const isB=(G.beasts||[]).includes(occ),sp=isB?BEASTS[occ.sp]:SPECIES[occ.sp],key=isB?sp.key:'insectoide',hp=Math.max(0,occ.hp??pvDe(sp));
    const P=isB&&sp.pack&&G.packs?G.packs[occ.pack]:null;
    const state=isB?(occ.hunt>0?(occ.sees?'en chasse':occ.search>0?'fouille les environs':'se dirige vers votre dernière position connue'):P?(P.pause>0?'au repos':'en route'):'erre'):({attack:'attaque',flee:'recule',follow:'suit',hold:'observe',seek:'se dirige vers votre dernière position connue',search:'fouille les environs'}[occ.mode]||'ne vous a pas repéré');
    const me=hitChance(G.st.pre,sp.esq+terrMod(x,y)),them=isB||occ.mode==='attack'?hitChance(sp.pre,robotEsq()):null;
    out.push(head(ICON[isB?'bz'+occ.sp+'r':'an'+occ.sp+'r'],sp.n,`${state} · ${dt}`),
      `<div class="kv"><span>PV <b>${hp}/${pvDe(sp)}</b></span><span>DÉG <b>${dmgDe(sp)}</b></span><span>PRE <b>${sp.pre}</b></span><span>ESQ <b>${sp.esq+terrMod(x,y)}</b></span><span>VIT <b>${sp.v}</b></span></div>`,
      ((isB?!(occ.hunt>0):!occ.mode)?`<p class="eye" title="Chance qu’il vous repère à chaque tour">${EYE_SVG} <b>${detectChance(occ)} %</b></p>`:''),
      `<p>Toucher <b style="color:${chanceCol(me)}">${me} %</b> · Subir <b style="color:${them==null?'var(--dim)':chanceCol(100-them)}">${them==null?'—':them+' %'}</b></p>`,
      `<p>${BEHAV[key]}</p>`);}
  else out.push(head('',tn,dt));
  const s=siteAt(x,y);
  if(s)out.push(`<p><b>Site de forage</b> · ${s.known?`profondeur ${s.depth}. [F] pour forer et descendre.`:'non analysé : placez la foreuse dessus.'}</p>`);
  const gm=G.gems&&G.gems[i];
  if(gm==='visible')out.push('<p><b>Joyau</b> · placez la foreuse dessus pour le ramasser et choisir une amélioration.</p>');
  else if(gm==='cache')out.push('<p><b>Joyau pris dans la roche</b> · brisez la roche pour le libérer.</p>');
  const om=G.ore&&G.ore[i];
  if(om&&oreMat(om))out.push(oreSol(om)?`<p><b>Matière</b> · placez la foreuse dessus pour la ramasser : +${ORE_PV[oreLv(om)]} en réserve.</p>`:`<p><b>Matière prise dans la montagne</b> · brisez la paroi pour la faire tomber (+${ORE_PV[oreLv(om)]}).</p>`);
  else if(om&&oreSol(om))out.push(`<p><b>Éclats de métal ${ORE_NOM[oreLv(om)]}</b> · placez la foreuse dessus pour les ramasser : +${ORE_PV[oreLv(om)]} PV.</p>`);
  else if(om)out.push('<p><b>Éclats de métal '+ORE_NOM[oreLv(om)]+' pris dans la montagne</b> · brisez la paroi pour les faire tomber (+'+ORE_PV[oreLv(om)]+' PV).</p>');
  const sol=G.items&&G.items[i];
  if(sol&&sol.length)out.push(`<p><b>${sol.length>1?'Objets au sol':'Objet au sol'}</b> · ${sol.map(k=>ITEMS[k].n).join(', ')} · placez la foreuse dessus pour ramasser.</p>`);
  if(G.blood&&G.blood[i]!=null)out.push('<p>Traces de sang.</p>');
  if(d!==0&&occ||d===0)out.push(`<p><b>${tn}</b> · ${td}</p>`);else out.push(`<p>${td}</p>`);
  const dm=G.dmg&&G.dmg[i];if(dm&&(t===ROCK||t===MOUNT))out.push('<p>Fissurée : encore 1 coup pour la briser.</p>');
  if(border&&(t===ROCK||t===MOUNT))out.push('<p>Bord de la carte : indestructible.</p>');
  if(!see)out.push('<p>Hors de vue : souvenir du dernier passage.</p>');
  let act='';
  if(d===0)act=s?'<kbd>F</kbd> ou clic : forer ce site.':'';
  else if(d===1&&occ)act='Clic : frapper avec la foreuse.';
  else if(d===1&&(t===ROCK||t===MOUNT))act=border?'':'Clic : coup de foreuse (10 énergie).';
  else if(d===1&&t===CHASM)act='';
  else if(d===1)act='Clic : avancer d’une case.';
  else{const p=getPath();act=p?`Clic : y aller · ${p.length} tour${p.length>1?'s':''}${occ||t===ROCK||t===MOUNT?', puis frapper':''}.`:t===CHASM?'':'Inaccessible depuis votre position.';}
  if(act)out.push(`<p class="act">${act}</p>`);
  return `<div class="insp">${out.join('')}</div>`;}

