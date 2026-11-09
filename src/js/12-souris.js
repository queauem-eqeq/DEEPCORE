/* ---------- Souris, inspection et déplacement automatique (inspirés de Brogue) ---------- */
let HOV=null,INSPECT=false,TRAV=null,lastPT='mouse',PC={k:'',p:null};
const busy=()=>!G||!!G.over||drilling||!$('overlay').hidden;
// créature visible sur une case (les animaux cachés par le brouillard ne bloquent pas le tracé)
function occupant(x,y){const seenHere=!fog||vis[idx(x,y)];if(!seenHere)return null;return beastAt(x,y)||animalAt(x,y)||null;}
// Plus court chemin (Dijkstra, 8 directions) sur les cases connues ; l'eau profonde est évitée autant que possible.
// La destination peut être une créature ou une roche : la dernière étape devient alors un coup de foreuse.
function findPath(tx,ty){
  if(tx<0||ty<0||tx>=W||ty>=H||(tx===G.px&&ty===G.py))return null;const ti=idx(tx,ty),v=G.t[ti];
  if((fog&&!G.seen[ti])||v===CHASM)return null;
  if((v===ROCK||v===MOUNT)&&(tx===0||ty===0||tx===W-1||ty===H-1))return null;
  const N=W*H,dist=new Float64Array(N).fill(Infinity),prev=new Int32Array(N).fill(-1),hp=heap(),s0=idx(G.px,G.py);dist[s0]=0;hp.push(s0,0);
  while(hp.size){const [d,c]=hp.pop();if(d>dist[c])continue;if(c===ti)break;const x=c%W,y=(c/W)|0;
    for(const [dx,dy] of DIRS){const a=x+dx,b=y+dy;if(a<0||b<0||a>=W||b>=H)continue;const j=idx(a,b);
      if(j!==ti&&(blocks(G.t[j])||(fog&&!G.seen[j])||occupant(a,b)))continue;
      const w=G.t[j],nd=d+(dx&&dy?1.001:1)+(w===DEEP?6:w===LIQ?.4:0);
      if(nd<dist[j]){dist[j]=nd;prev[j]=c;hp.push(j,nd);}}}
  if(dist[ti]===Infinity)return null;
  const p=[];for(let c=ti;c!==s0;c=prev[c])p.push([c%W,(c/W)|0]);return p.reverse();}
function getPath(){if(!HOV||!G)return null;const k=[HOV.x,HOV.y,G.turn,G.px,G.py,fog,G.t[idx(HOV.x,HOV.y)]].join();
  if(PC.k!==k){PC.k=k;PC.p=findPath(HOV.x,HOV.y);}return PC.p;}
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
  const p=findPath(x,y);if(!p){say(fog&&!G.seen[idx(x,y)]?'Zone inexplorée : destination inconnue.':'Destination inaccessible.');SFX.blocked();render();return;}
  const gk=new Set();if(G.gems)for(const k in G.gems)if(vis[+k])gk.add(k);
  const seen=new Set();for(const e of [...(G.beasts||[]),...(G.animals||[])])if(vis[idx(e.x,e.y)])seen.add(e);
  TRAV={path:p,i:0,seen,gk,vie:G.st.vie,sites:G.sites.filter(s=>s.seen).length,tm:0};travelStep();}
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
  const [nx,ny]=T.path[T.i],dx=nx-G.px,dy=ny-G.py,last=T.i===T.path.length-1;
  if(Math.max(Math.abs(dx),Math.abs(dy))!==1){stopTravel('Trajet interrompu : la foreuse a dévié de sa route.');return;}
  if(!last&&occupant(nx,ny)){stopTravel('Trajet interrompu : passage bloqué.');return;}
  const turn=G.turn;tryMove(dx,dy);T.i++;
  if(TRAV!==T)return;
  if(G.turn===turn){stopTravel();return;}
  const why=travelEvent(T);
  if(why||T.i>=T.path.length||busy()){stopTravel(why);return;}
  T.tm=setTimeout(travelStep,reduced?30:90);}
// Mode inspection au clavier (touche X)
function setInspect(on){INSPECT=on;$('inspTag').hidden=!on;if(on){if(freeCam)setFreeCam(false);HOV={x:G.px,y:G.py};}else HOV=null;render();}
function moveInspect(dx,dy){const vc=Math.floor(vw/S),vr=Math.floor(vh/S);
  HOV={x:Math.max(camX,Math.min(Math.min(W,camX+vc)-1,HOV.x+dx)),y:Math.max(camY,Math.min(Math.min(H,camY+vr)-1,HOV.y+dy))};render();}
const cellAt=ev=>{const r=cv.getBoundingClientRect();return {x:Math.floor((ev.clientX-r.left)/S)+camX,y:Math.floor((ev.clientY-r.top)/S)+camY};};
cv.addEventListener('pointerdown',ev=>{lastPT=ev.pointerType||'mouse';});
cv.addEventListener('pointermove',ev=>{if(ev.pointerType==='touch'||!G)return;const c=cellAt(ev);if(c.x<0||c.y<0||c.x>=W||c.y>=H)return;
  if(!HOV||HOV.x!==c.x||HOV.y!==c.y){HOV=c;render();}});
cv.addEventListener('pointerleave',()=>{if(INSPECT||lastPT==='touch')return;if(HOV){HOV=null;render();}});
cv.addEventListener('click',ev=>{if(busy())return;if(TRAV){stopTravel('Trajet interrompu.');return;}
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
  [FLAT]:['Herbes couchées','Praticables, ne bloquent plus la vue.'],[LOW]:['Herbe basse','Praticable.'],
  [CHASM]:['Gouffre','Infranchissable. Ne bloque pas la vue.'],[BRIDGE]:['Pont','Praticable. Permet de franchir un gouffre.'],
  [RUBBLE]:['Gravats','Praticables. Restes d’une roche brisée.'],
  [SHIP]:['Coque du vaisseau','Infranchissable et indestructible, ne bloque pas la vue. Le cargo qui a déposé la foreuse.'],
  [DECK]:['Soute du vaisseau','Praticable. La foreuse peut toujours y revenir ; la porte est à l’arrière.']};
const BEHAV={insectoide:'Suit la foreuse à 2 ou 3 cases ; passe à l’attaque si un ennemi la chasse à proximité, et ne recule plus ensuite.',
  crabos:'Chasse la foreuse dès qu’il la voit et l’attaque au contact. Abandonne environ 8 tours après l’avoir perdue de vue.',
  cafar:'Vit en bande. À la détection, pousse un cri d’alerte qui met en chasse tous les ennemis à 5 cases ou moins.'};
function inspectHTML(){const {x,y}=HOV;if(x<0||y<0||x>=W||y>=H)return '';
  const i=idx(x,y),seen=!fog||G.seen[i],see=!fog||vis[i],d=Math.max(Math.abs(x-G.px),Math.abs(y-G.py)),dt=d?`${d} case${d>1?'s':''}`:'ici';
  const head=(ic,n,ex)=>`<div class="ih">${ic?`<img src="${ic}" alt="">`:''}<b>${n}</b><span>${ex||''}</span></div>`;
  if(!seen)return `<div class="insp">${head('','Zone inexplorée',dt)}<p>Aucune donnée : la foreuse n’est jamais passée à portée de ce secteur.</p></div>`;
  const out=[],t=G.t[i],[tn,td]=TDESC[t]||['Terrain',''],border=x===0||y===0||x===W-1||y===H-1;
  const occ=see?occupant(x,y):null;
  if(d===0){const st=G.st;out.push(head(ICON.robot_r,'Foreuse U-7',dt),
    `<div class="kv"><span>Vie <b>${Math.ceil(st.vie)}/${st.vieMax}</b></span><span>Énergie <b>${Math.floor(st.energie)}/${st.energieMax}</b></span><span>ESQ <b>${robotEsq()}</b></span></div>`);}
  else if(occ){const isB=(G.beasts||[]).includes(occ),sp=isB?BEASTS[occ.sp]:SPECIES[occ.sp],key=isB?(occ.sp===0?'crabos':'cafar'):'insectoide',hp=Math.max(0,occ.hp??sp.pv);
    const P=isB&&sp.pack&&G.packs?G.packs[occ.pack]:null;
    const state=isB?(occ.hunt>0?'en chasse':P?(P.pause>0?'au repos':'en route'):'erre'):({attack:'attaque',flee:'recule',follow:'suit',hold:'observe'}[occ.mode]||'ne vous a pas repéré');
    const me=hitChance(G.st.pre,sp.esq+terrMod(x,y)),them=isB||occ.mode==='attack'?hitChance(sp.pre,robotEsq()):null;
    out.push(head(ICON[isB?'bz'+occ.sp+'r':'an'+occ.sp+'r'],sp.n,`${state} · ${dt}`),
      `<div class="kv"><span>PV <b>${hp}/${sp.pv}</b></span><span>DÉG <b>${sp.dmg}</b></span><span>PRE <b>${sp.pre}</b></span><span>ESQ <b>${sp.esq+terrMod(x,y)}</b></span><span>VIT <b>${sp.v}</b></span><span>DÉT <b>${sp.d}</b></span></div>`,
      `<p>Toucher <b style="color:${chanceCol(me)}">${me} %</b> · Subir <b style="color:${them==null?'var(--dim)':chanceCol(100-them)}">${them==null?'—':them+' %'}</b></p>`,
      `<p>${BEHAV[key]}</p>`);}
  else out.push(head('',tn,dt));
  const s=siteAt(x,y);
  if(s)out.push(`<p><b>Site de forage ${s.id}</b> · ${s.known?`profondeur ${s.depth} niveau${s.depth>1?'x':''}.`:'non analysé : placez la foreuse dessus pour mesurer sa profondeur.'}</p>`);
  const gm=G.gems&&G.gems[i];
  if(gm==='visible')out.push('<p><b>Joyau</b> · placez la foreuse dessus pour le ramasser et choisir une amélioration.</p>');
  else if(gm==='cache')out.push('<p><b>Joyau pris dans la roche</b> · brisez la roche pour le libérer.</p>');
  const om=G.ore&&G.ore[i];
  if(om&&oreSol(om))out.push(`<p><b>Éclats de métal ${ORE_NOM[oreLv(om)]}</b> · placez la foreuse dessus pour les ramasser : +${ORE_PV[oreLv(om)]} PV.</p>`);
  else if(om)out.push('<p><b>Éclats de métal '+ORE_NOM[oreLv(om)]+' pris dans la montagne</b> · brisez la paroi pour les faire tomber (+'+ORE_PV[oreLv(om)]+' PV).</p>');
  if(G.blood&&G.blood[i]!=null)out.push('<p>Traces de sang.</p>');
  if(d!==0&&occ||d===0)out.push(`<p><b>${tn}</b> · ${td}</p>`);else out.push(`<p>${td}</p>`);
  const dm=G.dmg&&G.dmg[i];if(dm&&(t===ROCK||t===MOUNT))out.push('<p>Fissurée : encore 1 coup pour la briser.</p>');
  if(border&&(t===ROCK||t===MOUNT))out.push('<p>Bord de la carte : indestructible.</p>');
  if(!see)out.push('<p>Hors de vue : souvenir du dernier passage.</p>');
  let act='';
  if(d===0)act=s?'<kbd>F</kbd> ou clic : forer ce site.':'';
  else if(d===1&&occ)act='Clic : frapper avec la foreuse (10 énergie).';
  else if(d===1&&(t===ROCK||t===MOUNT))act=border?'':'Clic : coup de foreuse (10 énergie).';
  else if(d===1&&t===CHASM)act='';
  else if(d===1)act='Clic : avancer d’une case.';
  else{const p=getPath();act=p?`Clic : y aller · ${p.length} tour${p.length>1?'s':''}${occ||t===ROCK||t===MOUNT?', puis frapper':''}.`:t===CHASM?'':'Inaccessible depuis votre position.';}
  if(act)out.push(`<p class="act">${act}</p>`);
  return `<div class="insp">${out.join('')}</div>`;}

