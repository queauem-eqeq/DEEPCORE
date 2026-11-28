// icône d'œil (pixel art) de la fiche de survol : risque d'être repéré par un ennemi calme
const EYE_SVG='<svg class="eyeic" viewBox="0 0 11 7" width="22" height="14" shape-rendering="crispEdges" aria-hidden="true"><path fill="currentColor" d="M3 0h5v1H3zM1 1h2v1H1zM8 1h2v1H8zM0 2h1v3H0zM10 2h1v3h-1zM1 5h2v1H1zM8 5h2v1H8zM3 6h5v1H3zM4 2h3v3H4z"/></svg>';
/* ---------- Souris, inspection et déplacement automatique (inspirés de Brogue) ---------- */
let HOV=null,INSPECT=false,TRAV=null,lastPT='mouse',PC={k:'',p:null};
// pendant la visée longue du phaseur la foreuse est démontée : aucune action ne doit partir (26 novembre 2026)
const busy=()=>!G||!!G.over||drilling||!!PHASE||!$('overlay').hidden;
// créature visible sur une case (les animaux cachés par le brouillard ne bloquent pas le tracé)
function occupant(x,y){const seenHere=!fog||vis[idx(x,y)];if(!seenHere)return null;const b=beastAt(x,y);
  return (b&&!beastCache(b)?b:null)||animalAt(x,y)||null;}
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
    // coin connu seulement
    for(const [dx,dy] of DIRS){const a=x+dx,b=y+dy;if(a<0||b<0||a>=W||b>=H)continue;const j=idx(a,b);
      if(!diagOk(x,y,dx,dy)&&(!fog||(G.seen[idx(x+dx,y)]&&G.seen[idx(x,y+dy)])))continue;
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
function drawPath(){const p=PHASE?phaseLigne():TRAV?TRAV.path.slice(TRAV.i):(HOV&&!busy()?getPath():null);if(!p||!p.length)return;   // phaseur (28 novembre 2026) : même pointillé, en ligne droite
  ctx.globalAlpha=.7;
  for(const [x,y] of p){if(!PHASE&&HOV&&x===HOV.x&&y===HOV.y)continue;ctx.drawImage(PATH_DOT,(x-camX)*S,(y-camY)*S,S,S);}
  ctx.globalAlpha=1;}
function goTo(x,y){if(busy())return;const d=Math.max(Math.abs(x-G.px),Math.abs(y-G.py));
  if(d===0){if(siteAt(x,y))askDrill();return;}
  if(d===1){tryMove(x-G.px,y-G.py);return;}
  const p=findPath(x,y)||findPath(x,y,true);if(!p){say('Destination inaccessible.');SFX.blocked();render();return;}
  const seen=new Set();for(const e of [...(G.beasts||[]),...(G.animals||[])])if(vis[idx(e.x,e.y)])seen.add(e);
  TRAV={path:p,i:0,tx:x,ty:y,explore:p.some(([a,b])=>fog&&!G.seen[idx(a,b)]),seen,vie:G.st.vie,sec:G.st.secN||0,sites:G.sites.filter(s=>s.seen).length,
    tm:0};travelStep();}
function stopTravel(m){if(!TRAV)return;clearTimeout(TRAV.tm);TRAV=null;if(m)sayMore(m,'warn');render();}
/* La vie remonte seule depuis le 28 novembre 2026 : « attaquée » se juge par rapport à la vie du pas précédent (T.vie suit),
   et la perte d'un point à sec (G.st.secN, 08-faune) n'est pas une attaque. */
function attaquee(T){const s=G.st.secN||0,v=G.st.vie,r=v<T.vie-(T.sec==null?0:s-T.sec);T.vie=v;T.sec=s;return r;}
// Un pas par tour ; le trajet s'arrête au moindre imprévu
function travelEvent(T){
  if(attaquee(T))return 'Trajet interrompu : '+NOM_FOREUSE+' est attaquée.';
  for(const b of G.beasts||[])if(vis[idx(b.x,b.y)]&&!T.seen.has(b)&&!aOuvrage(b))return `Trajet interrompu : ${BEASTS[b.sp].n.toLowerCase()} en vue.`;
  for(const a of G.animals||[])if(vis[idx(a.x,a.y)]&&!T.seen.has(a)&&!aOuvrage(a))return `Trajet interrompu : ${SPECIES[a.sp].n.toLowerCase()} en vue.`;
  if(G.sites.filter(s=>s.seen).length>T.sites)return 'Trajet interrompu : site de forage repéré.';
  if(T.i<T.path.length&&siteAt(G.px,G.py))return 'Trajet interrompu : site de forage atteint.';
  return null;}
function travelStep(){const T=TRAV;if(!T)return;if(busy()){stopTravel();return;}
  // trajet lancé à travers l'inexploré : la route est recalculée à chaque pas avec ce que la foreuse voit, sans jamais forer
  if(T.explore){
    const np=findPath(T.tx,T.ty)||findPath(T.tx,T.ty,true);
    if(!np){stopTravel(''+NOM_FOREUSE+' s’arrête : plus de passage vers la destination.');return;}
    T.path=np;T.i=0;
    const [fx,fy]=np[0];
      if(blocks(G.t[idx(fx,fy)])){stopTravel(np.length===1?''+NOM_FOREUSE+' s’arrête : la destination est infranchissable.':''+NOM_FOREUSE+' s’arrête : passage bloqué.');return;}}
  const [nx,ny]=T.path[T.i],dx=nx-G.px,dy=ny-G.py,last=T.i===T.path.length-1;
  if(Math.max(Math.abs(dx),Math.abs(dy))!==1){stopTravel('Trajet interrompu : '+NOM_FOREUSE+' a dévié de sa route.');return;}
  if(!last&&occupant(nx,ny)){stopTravel('Trajet interrompu : passage bloqué.');return;}
  const turn=G.turn;tryMove(dx,dy);T.i++;
  if(TRAV!==T)return;
  if(G.turn===turn){stopTravel();return;}
  const why=travelEvent(T);
  if(why||T.i>=T.path.length||busy()){stopTravel(why);return;}
  T.tm=setTimeout(travelStep,reduced?30:90);}
/* ---------- Exploration automatique (touche O, bouton EXPLORER) ----------
   La foreuse va d'elle-même à la case connue la plus proche d'où l'on découvre du terrain, en ramassant au passage ce qui est en vue
   (objets, Matière, et les éclats de métal seulement si le fuel n'est pas plein : sinon elle les contourne pour ne pas les gâcher).
   Elle ne fore jamais et n'entre dans l'eau profonde que s'il ne reste rien d'autre. Elle s'arrête au moindre événement (exploreEvent),
   à la moindre touche ou au moindre clic. Quand tout est exploré, elle rejoint le site de forage s'il est connu. */
let EXPL=null;
// créatures déjà signalées : chacune n'interrompt l'exploration qu'une fois (sinon une puce qui suit la foreuse l'arrêterait sans cesse)
const EXPL_VUS=new WeakSet();
// vitrines déjà signalées : chacune n'arrête l'exploration qu'une fois (26 novembre 2026)
const EXPL_VIT=new WeakSet();
// éclats de métal : l'exploration les ramasse quand le fuel n'est pas plein (28 novembre 2026 ; avant, quand la vie ne l'était pas)
function exploreScan(E,deep){const N=W*H,prev=new Int32Array(N).fill(-2),q=[idx(G.px,G.py)];prev[q[0]]=-1;const plein=!(G.st.fuel<G.st.fuelMax);
  const butin=j=>{if(G.cles&&G.cles[j])return 'une clé';
    if(G.items&&G.items[j]&&G.items[j].length&&!(G.pieges||[]).some(p=>p.on&&p.c===j)&&!(G.vit&&G.vit[j]))return 'un objet';
    /* l'exploration automatique ne touche ni à l'appât d'une salle piégée ni aux vitrines : c'est au joueur de choisir */const o=G.ore&&G.ore[j];
    if(o&&oreSol(o)&&(oreMat(o)||!plein))return oreMat(o)?'de la Matière {µ}':'des éclats de métal (fuel)';
    return null;};
  for(let k=0;k<q.length;k++){const c=q[k],x=c%W,y=(c/W)|0;
    if(k>0){if(butin(c))return {c,prev};
      if(!E.vu.has(c))for(const[dx,dy]of DIRS){const a=x+dx,b=y+dy;if(a>=0&&b>=0&&a<W&&b<H&&!G.seen[idx(a,b)])return {c,prev};}}
    for(const[dx,dy]of DIRS){const a=x+dx,b=y+dy;if(a<1||b<1||a>=W-1||b>=H-1)continue;const j=idx(a,b);
      if(prev[j]!==-2||!G.seen[j])continue;const v=G.t[j];
      if(blocks(v)||(v===DEEP&&!deep)||!diagOk(x,y,dx,dy)||occupant(a,b))continue;
      /* Une vitrine encore fermée ne se traverse pas (26 novembre 2026) : y poser la foreuse ramasserait le lot et
         condamnerait les deux autres. L'exploration la contourne, et s'arrête dès qu'elle en voit une. */
      if(G.vit&&G.vit[j]===1)continue;
      const o=G.ore&&G.ore[j];if(plein&&o&&oreSol(o)&&!oreMat(o))continue;
      prev[j]=c;q.push(j);}}
  return null;}
function exploreEvent(E){
  if(attaquee(E))return ''+NOM_FOREUSE+' est attaquée';
  let nv=null;for(const e of [...(G.beasts||[]),...(G.animals||[])])if(vis[idx(e.x,e.y)]&&!EXPL_VUS.has(e)&&!aOuvrage(e)){EXPL_VUS.add(e);nv=nv||e;}
  if(nv)return `${(G.beasts.includes(nv)?BEASTS:SPECIES)[nv.sp].n.toLowerCase()} en vue`;
  if((G.beasts||[]).some(b=>b.hunt>0&&vis[idx(b.x,b.y)]))return 'un ennemi vous chasse';
  // des vitrines en vue : on s'arrête, le choix revient au joueur
  if(G.choix)for(const g of G.choix)if(g.on&&!EXPL_VIT.has(g)&&g.c.some(i=>vis[i])){EXPL_VIT.add(g);
    return 'vitrines en vue : à vous de choisir le lot';}
  if(G.sites.filter(s=>s.seen).length>E.sites)return 'site de forage repéré';
  const ef=G.eff||{};if(ef.poison>0||ef.glu>0)return ''+NOM_FOREUSE+' subit un effet';
  if(G.msg&&G.msg.c==='warn')return 'alerte';
  return null;}
function stopExplore(m,c){if(!EXPL)return;clearTimeout(EXPL.tm);EXPL=null;$('explBtn').classList.remove('on');
  if(m)sayMore(m,c||'warn');render();}
function startExplore(){
  if(EXPL){stopExplore('Exploration interrompue.');return;}
  if(busy()||TRAV||REST)return;
  if((G.beasts||[]).some(b=>b.hunt>0&&vis[idx(b.x,b.y)])){say('Un ennemi vous chasse : pas d’exploration automatique.','warn');
    SFX.blocked();render();return;}
  for(const e of [...(G.beasts||[]),...(G.animals||[])])if(vis[idx(e.x,e.y)])EXPL_VUS.add(e);
  for(const g of G.choix||[])if(g.c.some(i=>vis[i]))EXPL_VIT.add(g);   // vitrines déjà en vue : elles n'arrêtent pas aussitôt
  EXPL={vie:G.st.vie,sec:G.st.secN||0,sites:G.sites.filter(s=>s.seen).length,vu:new Set(),n:0,tm:0};$('explBtn').classList.add('on');
  say('Exploration automatique.','info');exploreStep();}
function exploreStep(){const E=EXPL;if(!E)return;if(busy()){stopExplore();return;}
  E.vu.add(idx(G.px,G.py));
  const r=exploreScan(E,false)||exploreScan(E,true);
  if(!r){const s=G.sites.find(s=>s.seen);
    if(s&&!(s.x===G.px&&s.y===G.py)){stopExplore('Tout est exploré : '+NOM_FOREUSE+' rejoint le site de forage.','info');goTo(s.x,s.y);}
    else stopExplore(s?'Tout est exploré. [F] pour forer.':'Plus rien à explorer sans forer la roche.','info');
    return;}
  let c=r.c;const s0=idx(G.px,G.py);while(r.prev[c]!==s0)c=r.prev[c];
  const turn=G.turn;tryMove(c%W-G.px,((c/W)|0)-G.py);E.n++;
  if(EXPL!==E)return;
  if(G.turn===turn){stopExplore('Exploration interrompue : passage bloqué.');return;}
  if(busy()){stopExplore();return;}
  const why=exploreEvent(E);if(why){stopExplore(why==='alerte'?'Exploration interrompue.':`Exploration interrompue : ${why}.`);return;}
  E.tm=setTimeout(exploreStep,reduced?20:70);}
/* ---------- Repos (touche P) : attendre pour se réparer (28 novembre 2026 ; avant : jusqu'à l'énergie pleine) ----------
   Chaque battement est une attente normale (recharge doublée, portée de discrétion ÷ 2, vie +1 tous les VIE_REPOS_BAT
   battements tant qu'il reste du fuel). Le repos s'arrête quand la vie et l'énergie sont pleines, quand le fuel passe sous
   l'alerte (ou tombe à sec), qu'une créature entre dans le champ de vision, qu'un ennemi vous repère ou vous chasse, que la
   foreuse est touchée, ou au moindre geste du joueur. Attendre à la main soigne de même, chasseur ou pas. */
let REST=null;
const REST_MAX=REGLES.REPOS_MAX;                      // garde-fou : jamais plus de 600 battements d'affilée (un plein de vie : 400)
const restPlein=()=>G.st.vie>=G.st.vieMax&&G.st.energie>=G.st.energieMax;
const visibles=()=>{const s=new Set();for(const e of [...(G.beasts||[]),...(G.animals||[])])if(vis[idx(e.x,e.y)])s.add(e);return s;};
function restEvent(T){
  if(attaquee(T))return ''+NOM_FOREUSE+' est attaquée';
  for(const b of G.beasts||[])if(vis[idx(b.x,b.y)]&&!T.seen.has(b)&&!aOuvrage(b))return `${BEASTS[b.sp].n.toLowerCase()} en vue`;
  for(const a of G.animals||[])if(vis[idx(a.x,a.y)]&&!T.seen.has(a)&&!aOuvrage(a))return `${SPECIES[a.sp].n.toLowerCase()} en vue`;
  for(const b of G.beasts||[])if(b.hunt>0&&vis[idx(b.x,b.y)])return `${BEASTS[b.sp].n.toLowerCase()} vous a repéré`;
  for(const a of G.animals||[])if(a.aware&&vis[idx(a.x,a.y)])return `${SPECIES[a.sp].n.toLowerCase()} vous a repéré`;
  // un ennemi qui chasse la foreuse, même hors de vue (28 novembre 2026)
  for(const b of G.beasts||[])if(b.hunt>0&&b.sees&&!aOuvrage(b))return `${BEASTS[b.sp].n.toLowerCase()} vous chasse`;
  if(G.st.fuel<=0)return 'fuel à sec, plus de réparation';
  if(fuelAlerte(G.st)&&!T.bas)return 'fuel sous le seuil d’alerte';
  return null;}
function startRest(){
  if(busy()||TRAV||EXPL)return;
  if(restPlein()){say('Vie et énergie déjà au maximum : repos inutile.');SFX.blocked();render();return;}
  // déjà sous l'alerte : le repos est permis, il s'arrête à sec
  const T={seen:visibles(),vie:G.st.vie,sec:G.st.secN||0,n:0,tm:0,bas:fuelAlerte(G.st)},why=restEvent(T);
  if(why){say(`Repos impossible : ${why}.`,'warn');SFX.blocked();render();return;}
  REST=T;say(''+NOM_FOREUSE+' se met au repos.');restStep();}
function stopRest(m,c){if(!REST)return;clearTimeout(REST.tm);REST=null;if(m)sayMore(m,c||'warn');render();}
function restStep(){const T=REST;if(!T)return;if(busy()){stopRest();return;}
  const turn=G.turn;waitTurn();
  if(REST!==T)return;
  if(G.turn===turn){stopRest();return;}
  T.n++;
  const why=restEvent(T);
  if(why){stopRest(`Repos interrompu (${T.n} tour${T.n>1?'s':''}) : ${why}.`);return;}
  if(restPlein()){stopRest(`Repos terminé : vie et énergie au maximum, en ${T.n} tour${T.n>1?'s':''}.`,'good');SFX.spot();return;}
  if(T.n>=REST_MAX){stopRest('Repos interrompu : trop long.');return;}
  T.tm=setTimeout(restStep,reduced?0:45);}

// Mode inspection au clavier (touche X)
function setInspect(on){INSPECT=on;$('inspTag').hidden=!on;if(on){if(freeCam)setFreeCam(false);HOV={x:G.px,y:G.py};}else HOV=null;render();}
function moveInspect(dx,dy){const vc=Math.floor(vw/S),vr=Math.floor(vh/S);
  HOV={x:Math.max(camX,Math.min(Math.min(W,camX+vc)-1,HOV.x+dx)),y:Math.max(camY,Math.min(Math.min(H,camY+vr)-1,HOV.y+dy))};render();}
const cellAt=ev=>{const r=cv.getBoundingClientRect();
  return {x:Math.floor((ev.clientX-r.left)/(S*VZ))+camX,y:Math.floor((ev.clientY-r.top)/(S*VZ))+camY};};   // VZ : zoom de la vue sur tablette
cv.addEventListener('pointerdown',ev=>{lastPT=ev.pointerType||'mouse';});
cv.addEventListener('pointermove',ev=>{if(ev.pointerType==='touch'||!G)return;const c=cellAt(ev);if(c.x<0||c.y<0||c.x>=W||c.y>=H)return;
  if(PHASE){phaseVers(c.x,c.y);phaseSouris(ev);return;}   // visée du phaseur : la vue défile près du bord (28 novembre 2026)
  if(VISEE){viseeVers(c.x,c.y);return;}
  selSouris(ev);
  if(!HOV||HOV.x!==c.x||HOV.y!==c.y){HOV=c;render();}});
/* Sélecteur habituel (28 novembre 2026) : comme le viseur du phaseur, la vue défile d'une case vers le bord quand le pointeur
   reste à PHASE_BORD cases du cadre ; elle revient sur la foreuse dès que le pointeur sort, qu'on clique ou qu'on appuie sur une touche. */
let selPtr=null,selTimer=0;
function selStop(){selPtr=null;if(selTimer){clearInterval(selTimer);selTimer=0;}if(SELCAM){SELCAM=null;if(G)render();}}
function selTick(){if(!G||!selPtr||PHASE||VISEE||freeCam||INSPECT||busy()){return;}
  const vc=Math.floor(vw/S),vr=Math.floor(vh/S),c=cellAt(selPtr);
  const sens=(v,cam,n,max)=>{if(v<cam+PHASE_BORD&&cam>0)return -1;if(v>cam+n-1-PHASE_BORD&&cam<max-n)return 1;return 0;};
  const dx=sens(c.x,camX,vc,W),dy=sens(c.y,camY,vr,H);if(!dx&&!dy)return;
  if(!SELCAM)SELCAM={cx:camX+Math.floor(vc/2),cy:camY+Math.floor(vr/2)};
  SELCAM.cx+=dx;SELCAM.cy+=dy;camX+=dx;camY+=dy;
  const n=cellAt(selPtr);if(n.x>=0&&n.y>=0&&n.x<W&&n.y<H)HOV=n;render();}
function selSouris(ev){if(PHASE||freeCam||INSPECT||lastPT==='touch')return;selPtr=ev;if(!selTimer)selTimer=setInterval(selTick,PHASE_PAS);}
cv.addEventListener('pointerleave',()=>{selStop();phasePtr=null;if(INSPECT||lastPT==='touch')return;if(HOV){HOV=null;render();}});
cv.addEventListener('click',ev=>{if(PHASE){const c=cellAt(ev);phaseVers(c.x,c.y);phaseOk();return;}
  if(VISEE){const c=cellAt(ev);viseeVers(c.x,c.y);viseeOk();return;}
  if(busy())return;if(EXPL){stopExplore('Exploration interrompue.');return;}if(REST){stopRest('Repos interrompu.');return;
    }if(TRAV){stopTravel('Trajet interrompu.');return;}
  const c=cellAt(ev);if(c.x<0||c.y<0||c.x>=W||c.y>=H)return;
  selStop();
  // écran tactile : un premier appui inspecte et montre le trajet, un second sur la même case lance le déplacement
  if(lastPT==='touch'&&(!HOV||HOV.x!==c.x||HOV.y!==c.y)){HOV=c;render();return;}
  if(INSPECT){INSPECT=false;$('inspTag').hidden=true;}if(freeCam)setFreeCam(false);
  HOV=c;goTo(c.x,c.y);});
// Fiche complète de la case visée : en tête du panneau « En vue » au survol, dans la colonne en mode viseur.
/* 28 novembre 2026 : les textes sont le relevé de F467, en jargon machine, sans règle chiffrée ni mode d'emploi ; les
   chiffres restent dans les stats (PV, DÉG, Toucher…) et la ligne d'action. */
const viseCible=()=>!G?null:PHASE?{x:PHASE.x,y:PHASE.y}:VISEE?{x:VISEE.x,y:VISEE.y}:INSPECT&&HOV?HOV:null;
const TDESC={[GROUND]:['Sol rocheux','Roche tassée. Praticable. Particules plus denses à l’approche d’une couche profonde.'],
  [ROCK]:['Rocher','Bloc isolé. Gêne le passage, pas les capteurs. Friable.'],
  [MOUNT]:['Montagne','Paroi de massif. Opaque. Forable.'],
  [HARD]:['Roche dure','Cœur du massif. Densité hors normes : la foreuse glisse dessus. Seule une onde de choc pourrait la fendre.'],
  [WALL]:['Mur bâti','Alliage de construction, origine non répertoriée. Hors de portée de la foreuse. Un explosif, peut-être.'],
  [FLOOR]:['Sol bâti','Dalle artificielle. Quelque chose a construit ici.'],
  [DOOR]:['Porte','Battant automatique. Réagit à la présence, se referme derrière.'],
  [SECRET]:['Mur bâti','Alliage de construction, origine non répertoriée. Hors de portée de la foreuse. Un explosif, peut-être.'],
  [LOCK]:['Porte verrouillée','Battant scellé. Serrure codée. Il existe une clé. Ou un explosif.'],
  [MACHINE]:['Machine hors d’usage','Carcasse mécanique. Inerte. Les capteurs passent par-dessus.'],
  [ANTENNA]:['Antenne','Relais de communication. Accès au contact : DATA, CONNEXION.'],
  [TERMINAL]:['Terminal','Console de données. Encore alimentée. Accès au contact : DATA, CONNEXION, ENCODAGE.'],
  [TURRET]:['Tourelle laser','Émetteur encastré. Cycle de tir irrégulier, aucun signal préalable. Observer avant de traverser.'],
  [PYLON]:['Croix laser','Pylône émetteur. Balaie ses abords par intermittence. Les angles semblent épargnés.'],
  [PILE]:['Pile énergétique','Cellule d’énergie mobile. Se déplace par poussée. Format compatible avec les socles du secteur.'],
  [LEVIER]:['Levier','Commande mécanique reliée à cette salle. Fonction : à vérifier.'],
  [GRILLE]:['Grille d’énergie','Barrière active, alimentée par un socle. Transparente aux capteurs.'],
  [STATION]:['Station de réparation','Poste de maintenance compatible. Réserve unique. Le cycle de réparation est bruyant.'],
  [CHARGEUR]:['Distributeur de pile','Délivre une cellule d’énergie. Peut rappeler la sienne.'],
  [FABRIC]:['FABLAB','Unité de fabrication. Accepte la Matière {µ}. Protocole d’échange compatible.'],
  [VITRE]:['Mur vitré','Paroi transparente : les capteurs la traversent, dans les deux sens. Résiste à la foreuse.'],
  [PILLAR]:['Pilier','Élément porteur. Opaque. Bon écran contre les capteurs adverses.'],
  [LIQ]:['Eau peu profonde','Liquide. Freine la progression. Châssis exposé.'],
  [DEEP]:['Eau profonde','Liquide, courant instable : la trajectoire dérive. Châssis exposé.'],
  [GRASS]:['Herbes hautes','Végétation dense. Masque, dans les deux sens. Bonne couverture.'],
  [FLAT]:['Herbes basses','Végétation rase. Étouffe la signature des mouvements.'],
  [CHASM]:['Gouffre','Faille. Fond non détecté. Infranchissable.'],[BRIDGE]:['Pont','Passerelle au-dessus de la faille. Structure stable.'],
  [RUBBLE]:['Gravats','Débris de roche. Praticables.'],
  [SHIP]:['Coque du vaisseau','Cargo de largage. Point d’arrivée. Blindage intact.'],
  [DECK]:['Soute du vaisseau','Intérieur du cargo. Retour toujours possible.']};
const BEHAV={puce:'Petite unité furtive. Suit à distance, se dérobe au contact. Rarement seule : en frapper une réveille les autres.',
  crabos:'Unité de chasse. Prend la trace dès qu’elle repère une cible, ne la lâche pas de sitôt.',
  cafar:'Unité de liaison. Se déplace en bande. Ce que l’une perçoit, toutes le savent.',
  mastok:'Masse lourde, blindage épais. Lente. Un seul impact peut suffire. Éviter.',
  brochon:'Signature aquatique. Disparaît des capteurs en eau profonde. Ne quitte pas l’eau.',
  mine:'Charge explosive autonome. Se colle à sa cible avant de détoner. Ne pas rester près.',
  paralyzor:'Poste de garde. Émetteur à courte portée, tire sur ce qu’il voit.',
  gardien:'Unité d’interception. Rapide, peu dangereuse en soi, mais son champ immobilise. À neutraliser d’abord.',
  artilleur:'Plateforme de tir à longue portée. Cadence lente. Recule quand on la serre de près.',
  drone:'Unité volante, légère. Ignore failles et liquides. Arrive en essaim.',
  soudeur:'Unité de maintenance. Remet ses alliés en état et fuit le combat. Cible prioritaire.',
  englueur:'Projette une substance adhésive. Entrave les mouvements. Garde ses distances.'};
function inspectHTML(c){const {x,y}=c||HOV;if(x<0||y<0||x>=W||y>=H)return '';const vise=!!(PHASE||VISEE);
  const i=idx(x,y),seen=!fog||G.seen[i],see=!fog||vis[i],d=Math.max(Math.abs(x-G.px),Math.abs(y-G.py)),dt=d?`${d} case${d>1?'s':''}`:'ici';
  const head=(ic,n,ex)=>`<div class="ih">${ic?`<img src="${ic}" alt="">`:''}<b>${n}</b><span>${ex||''}</span></div>`;
  if(!seen&&G.ore&&G.ore[i]&&sonarVu(i,sonarR())){const o=G.ore[i];
    return `<div class="insp">${head('','Gisement détecté',dt)}<p>Écho sonar : <b>${oreMat(o)?'Matière {µ}':'éclats de métal (fuel)'}</b>, ${oreSol(o)?'au sol':'pris dans la roche'}.</p></div>`;}
  if(!seen)return `<div class="insp">${head('','Zone inexplorée',dt)}<p>Aucune donnée. Secteur jamais balayé par les capteurs.</p></div>`;
  const out=[],t=G.t[i];let [tn,td]=TDESC[t]||['Terrain',''];const border=x===0||y===0||x===W-1||y===H-1;
  // Une niche de salle piégée repérée se nomme par ce qu'elle cache ; cachée, c'est un mur ordinaire.
  {const nc=G.niche&&G.niche[i];
    if(nc===1)[tn,td]=['Niche fermée','Cavité dans la paroi. Présence mécanique en veille. Elle attend quelque chose.'];
    else if(nc===2)[tn,td]=['Niche ouverte','Cavité vide. Ce qui s’y tenait est sorti.'];}
  // épaves et fosses de l'Astroport (07h) : nom, numéro, état
  {const f=typeof epaveFiche==='function'&&(G.epI||G.fosI)?epaveFiche(i):null;if(f)[tn,td]=f;}
  const occ=see?occupant(x,y):null;
  if(d===0){const st=G.st;out.push(head(ICON.robot_r,NOM_FOREUSE,dt),
    `<div class="kv"><span>Vie <b>${Math.ceil(st.vie)}/${st.vieMax}</b></span><span>Énergie <b>${Math.floor(st.energie)}/${st.energieMax}</b></span><span>DEF <b>${robotDef()}</b></span></div>`,
    '<p>Unité de forage autonome. Mission en cours.</p>');}
  else if(occ){const isB=(G.beasts||[]).includes(occ),sp=isB?BEASTS[occ.sp]:SPECIES[occ.sp],key=isB?sp.key:'puce',
    hp=Math.max(0,occ.hp??pvDe(sp));
    const P=isB&&sp.pack&&G.packs?G.packs[occ.pack]:null;
    const ouv=aOuvrage(occ)?(ouvrAlerte(occ)?'alertée':'à l’ouvrage'):'';
    const state=ouv?ouv:isB?(occ.hunt>0?(occ.sees?'en chasse':occ.search>0?'fouille les environs':'remonte la trace'):P?(P.pause>0?'au repos':'en route'):'erre'):({attack:'attaque',flee:'recule',follow:'suit',hold:'observe',seek:'remonte la trace',search:'fouille les environs'}[occ.mode]||'n’a rien repéré');
    const me=hitChance(robotPre(),sp.def+terrModDe(sp,x,y)),them=isB||occ.mode==='attack'?hitChance(sp.pre,robotDef()):null;
    out.push(head(ICON[isB?'bz'+occ.sp+'r':'an'+occ.sp+'r'],sp.n,`${state} · ${dt}`),
      `<div class="kv"><span>PV <b>${hp}/${pvDe(sp)}</b></span><span>DÉG <b>${dmgTxt(sp)}</b></span><span>PRE <b>${sp.pre}</b></span><span>DEF <b>${sp.def+terrModDe(sp,x,y)}</b></span><span title="Durée d’un pas sur cette case : plus petit, plus rapide">PAS <b>${Math.round(dpasDe(occ,sp))}</b></span><span title="Durée d’un coup : 50 frappe deux fois par battement, 200 une fois sur deux">COUP <b>${dcoupDe(occ,sp)}</b></span></div>`,
      (ouv?`<p class="ouvrp">${ouv==='alertée'?'MOBILE EN ARRÊT. ORIENTATION : UNITÉ. PÉRIMÈTRE DE DÉCOUPE FRANCHI.':'MOBILE IGNORE L’UNITÉ. ACTIVITÉ : DÉCOUPE.'} CLASSEMENT MAINTENU : MENACE.</p>`:'')+
      (!ouv&&(isB?!(occ.hunt>0):!occ.mode)?`<p class="eye" title="Chance qu’il vous repère à chaque tour">${EYE_SVG} <b>${detectChance(occ)} %</b></p>`:''),
      `<p>Toucher <b style="color:${chanceCol(me)}">${me} %</b> · Subir <b style="color:${them==null?'var(--dim)':chanceCol(100-them)}">${them==null?'—':them+' %'}</b></p>`,
      `<p>${BEHAV[key]||''}</p>`);}
  else out.push(head('',tn,dt));
  const s=siteAt(x,y);
  if(s)out.push(`<p><b>Site de forage</b> · ${s.known?'couche profonde confirmée. Descente possible.':'signature probable. Analyse sur place requise.'}</p>`);
  const om=G.ore&&G.ore[i];
  if(om&&oreMat(om))out.push(oreSol(om)?'<p><b>Matière {µ}</b> · au sol. Récupérable au passage.</p>':'<p><b>Matière {µ}</b> · prise dans la paroi. Forer pour la libérer.</p>');
  // éclats de métal : du fuel depuis le 28 novembre 2026
  else if(om&&oreSol(om))out.push(`<p><b>Éclats de métal ${ORE_NOM[oreLv(om)]}</b> · au sol. Fuel +${REGLES.FUEL_ECLATS[oreLv(om)]}, récupérable au passage.</p>`);
  else if(om)out.push(`<p><b>Éclats de métal ${ORE_NOM[oreLv(om)]}</b> · pris dans la paroi : fuel +${REGLES.FUEL_ECLATS[oreLv(om)]}. Forer pour les libérer.</p>`);
  if(G.cles&&G.cles[i])out.push('<p><b>Clé</b> · codée pour une serrure du secteur.</p>');
  const sol=G.items&&G.items[i];
  if(sol&&sol.length)out.push(`<p><b>${sol.length>1?'Objets au sol':'Objet au sol'}</b> · ${sol.map(k=>ITEMS[k].n).join(', ')}. Récupérable au passage.</p>`);
  if(d!==0&&occ||d===0)out.push(`<p><b>${tn}</b> · ${td}</p>`);else out.push(`<p>${td}</p>`);
  const dm=G.dmg&&G.dmg[i];if(dm&&(t===ROCK||t===MOUNT))out.push('<p>Structure fissurée : sur le point de céder.</p>');
  if(border&&(t===ROCK||t===MOUNT))out.push('<p>Paroi d’ancrage du secteur. Insensible à la foreuse.</p>');
  if(!see)out.push('<p>Hors de portée des capteurs : données du dernier passage.</p>');
  let act='';
  if(vise)act='';   // phaseur, capsule : pas de ligne d'action (le clic valide la visée)
  else if(d===0)act=s?'<kbd>F</kbd> ou clic : forer ce site.':'';
  else if(d===1&&occ)act='Clic : frapper avec '+NOM_FOREUSE+'.';
  else if(d===1&&t===LOCK)act=nbCles()>0?'Clic : ouvrir avec une clé.':'';
  else if(d===1&&(t===HARD||t===VITRE||bati(t)))act='';
  else if(d===1&&(t===ROCK||t===MOUNT))act=border?'':'Clic : coup de foreuse (10 énergie).';
  else if(d===1&&t===CHASM)act='';
  else if(d===1)act='Clic : avancer d’une case.';
  else{const p=getPath();
    act=p?`Clic : y aller · ${p.length} tour${p.length>1?'s':''}${occ||t===ROCK||t===MOUNT?', puis frapper':''}.`:t===CHASM?'':'Inaccessible depuis votre position.';}
  if(act)out.push(`<p class="act">${act}</p>`);
  return `<div class="insp">${out.join('')}</div>`;}

