/* ---------- Vision ---------- */
const opaque=(x,y)=>{const v=G.t[idx(x,y)];return v===MOUNT||v===GRASS;};
function line(x0,y0,x1,y1){const p=[];let dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1,e=dx+dy;
  for(;;){p.push([x0,y0]);if(x0===x1&&y0===y1)break;const e2=2*e;if(e2>=dy){e+=dy;x0+=sx;}if(e2<=dx){e+=dx;y0+=sy;}}return p;}
function los(x0,y0,x1,y1){const p=line(x0,y0,x1,y1);for(let i=1;i<p.length-1;i++)if(opaque(p[i][0],p[i][1]))return false;return true;}
// Capteur de la foreuse (elle seule) : la case juste derrière un obstacle à la vue (montagne, herbes hautes) est aperçue
// en mode souvenir — terrain affiché assombri, sans les créatures. Les ennemis, eux, ne voient pas à travers.
function peekBehind(x0,y0,x1,y1){const p=line(x0,y0,x1,y1),n=p.length;if(n<3)return false;
  for(let i=1;i<n-2;i++)if(opaque(p[i][0],p[i][1]))return false;return opaque(p[n-2][0],p[n-2][1]);}
function computeFOV(){vis=new Uint8Array(W*H);const r=G.st.capteur,px=G.px,py=G.py;
  for(let y=py-r;y<=py+r;y++)for(let x=px-r;x<=px+r;x++){if(x<0||y<0||x>=W||y>=H)continue;if((x-px)**2+(y-py)**2>r*r+r)continue;
    if(los(px,py,x,y)){vis[idx(x,y)]=1;G.seen[idx(x,y)]=1;}else if(peekBehind(px,py,x,y))G.seen[idx(x,y)]=1;}
  if(G.animals)for(const a of G.animals)if(vis[idx(a.x,a.y)]&&!G.fauna.includes(a.sp)){G.fauna.push(a.sp);const sp=SPECIES[a.sp];
    sayMore(`Nouvelle espèce observée : ${sp.n} (vitesse ${sp.v}).`,'info');SFX.chirp();}
  if(G.beasts){if(typeof G.beastSeen!=='object'||!G.beastSeen)G.beastSeen={};for(const b of G.beasts){if(G.beastSeen[b.sp]||!vis[idx(b.x,b.y)])continue;G.beastSeen[b.sp]=true;const sp=BEASTS[b.sp];
    sayMore(`Ennemi repéré : ${sp.n} (vitesse ${sp.v}, ${sp.pv} PV).`,'warn');SFX.roar();}}
  for(const s of G.sites)if(vis[idx(s.x,s.y)]&&!s.seen){s.seen=true;SFX.spot();say(`Site ${s.id} repéré.`,'info');}
}

/* ---------- Portée de discrétion (13 novembre 2026) ----------
   Un seul rayon, celui de la foreuse, le même pour tous les ennemis : dans ce rayon et en ligne de vue, un ennemi
   qui ne vous a pas repéré a NOTICE de chance par tour de vous remarquer. Un ennemi déjà en chasse vous garde en vue
   jusqu'à HUNT_MULT fois ce rayon (2 ×) ; au-delà il se rabat sur votre dernière position connue, fouille, puis oublie.
   Hors du rayon mais encore dans la bande de chasse, il a LOSE_TRACK par tour de perdre votre trace (les 3 % de Brogue) :
   il garde la dernière position connue et s'y rend, mais ne vous suit plus de loin — il doit vous remarquer de nouveau
   (NOTICE) à l'intérieur du rayon. Marqué par o.lost, remis à zéro dès qu'il vous revoit ou qu'il oublie.
   Calcul, dans cet ordre : base, ×1,5 en brisant une paroi, ÷2 en attendant sur place, ÷2 sur des herbes couchées
   (arrondi au supérieur à chaque division), −1 par paroi adjacente (rocher ou montagne), plancher STEALTH_MIN. */
let STEALTH_BASE=10;const NOTICE=.25,HUNT_MULT=2,STEALTH_MIN=2,DIG_MULT=1.5,LOSE_TRACK=.03;
try{const s=+localStorage.getItem('np-stealth');if(s>=2&&s<=30)STEALTH_BASE=s;}catch(e){}
function setStealthBase(v){STEALTH_BASE=Math.max(2,Math.min(30,v|0));try{localStorage.setItem('np-stealth',STEALTH_BASE);}catch(e){}touchLocal();}
let lastAct='move';                                   // ce que la foreuse vient de faire : 'move', 'wait' ou 'dig'
function stealthRange(act){
  let r=STEALTH_BASE;
  if(act==='dig')r=Math.ceil(r*DIG_MULT);
  if(act==='wait')r=Math.ceil(r/2);
  if(G.t[idx(G.px,G.py)]===FLAT)r=Math.ceil(r/2);     // herbes couchées : couvert
  let walls=0;for(const [dx,dy] of DIRS){const x=G.px+dx,y=G.py+dy;if(x<0||y<0||x>=W||y>=H)continue;const v=G.t[idx(x,y)];if(v===ROCK||v===MOUNT)walls++;}
  return Math.max(STEALTH_MIN,r-walls);}
function turnStealth(){G.stealth=stealthRange(lastAct);}

/* ---------- Déplacement ---------- */
const siteAt=(x,y)=>G.sites.find(s=>s.x===x&&s.y===y);
// Dérive dans l'eau profonde : seulement quand la foreuse attend (un pas, lui, est dévié au moment même : DEEP_MISS)
function drift(wait){if(!wait)return;
  if(G.t[idx(G.px,G.py)]!==DEEP)return;
  const k=rnd(0,7),[dx,dy]=DIRS[k],nx=G.px+dx,ny=G.py+dy,v=G.t[idx(nx,ny)];
  if(v===ROCK||v===MOUNT||v===CHASM||!diagOk(G.px,G.py,dx,dy)||beastAt(nx,ny)||animalAt(nx,ny)){SFX.thud();sayMore(`Le courant plaque le robot contre un obstacle (${DIRN[k]}).`,'warn');return;}
  G.px=nx;G.py=ny;G.lastDir=null;if(v===GRASS)G.t[idx(nx,ny)]=FLAT;
  SFX.drift();sayMore(`Eau profonde : le courant entraîne le robot vers ${['l’est','l’ouest','le sud','le nord','le sud-est','le nord-est','le sud-ouest','le nord-ouest'][k]}.`,'warn');
}
const MOVE_COST=2;   // énergie dépensée à chaque pas
const DEEP_MISS=.5;   // eau profonde : chance qu'un pas parte dans une autre direction, tirée au hasard
function tryMove(dx,dy){
  if(G.over||drilling)return;lastAct='move';let nx=G.px+dx,ny=G.py+dy;if(nx<0||ny<0||nx>=W||ny>=H)return;
  let v=G.t[idx(nx,ny)];
  G.face=dx>0?'r':dx<0?'l':dy>0?'d':'u';
  if(!diagOk(G.px,G.py,dx,dy)){say('Coin de paroi : pas de passage en diagonale.');SFX.blocked();render();return;}
  const bz=beastAt(nx,ny);
  if(bz){if(!spend())return;const sp=BEASTS[bz.sp];G.turn++;G.msg=null;const sur=!(bz.hunt>0),cr=sur||roll(G.st.crit??5);   // surprise : ne vous a pas repéré
    {const ch=hitChance(G.st.pre,sp.esq+terrMod(nx,ny));if(!sur&&!roll(ch)){bz.hunt=1;spot(bz);addFx({kind:'lunge',robot:true,dx,dy,dur:180});addFx({kind:'num',x:nx,y:ny,txt:'0',col:'#8aa9a2',dur:750});
      say(`La foreuse rate le ${sp.n.toLowerCase()} (${ch} %).`);SFX.whoosh();drift();animalsAct();beastsAct();regen();computeFOV();render();if(G.over&&G.over.dead)dead();return;}}
    const dm=G.st.degats*(cr?CRIT_X:1);bz.hp-=dm;bz.hunt=1;spot(bz);addFx({kind:'num',x:nx,y:ny,txt:'-'+dm+(cr?'!':''),col:cr?PAL['1']:PAL['3'],dur:cr?1000:750});if(cr){addFx({kind:'shake',amp:6,dur:220});SFX.crit();}
    addFx({kind:'lunge',robot:true,dx,dy,dur:180});addFx({kind:'flash',beast:bz,dur:180});if(bz.hp<=0)addFx({kind:'shake',amp:4,dur:200});
    const tag=sur?'Coup par surprise ! ':cr?'Coup critique ! ':'';
    if(bz.hp<=0){G.beasts.splice(G.beasts.indexOf(bz),1);bleed(bz.x,bz.y);say(`${tag}La foreuse abat le ${sp.n.toLowerCase()}.`,'good');SFX.break();}
    else{say(`${tag}La foreuse percute le ${sp.n.toLowerCase()} : −${dm} PV (${bz.hp}/${sp.pv}).`,'warn');SFX.crack();}
    drift();animalsAct();beastsAct();regen();computeFOV();render();if(G.over&&G.over.dead)dead();return;}
  const an=animalAt(nx,ny);
  if(an){if(!spend())return;const sp=SPECIES[an.sp];G.turn++;G.msg=null;const sur=!an.aware,cr=sur||roll(G.st.crit??5);
    {const ch=hitChance(G.st.pre,sp.esq+terrMod(nx,ny));if(!sur&&!roll(ch)){an.aware=1;spot(an);addFx({kind:'lunge',robot:true,dx,dy,dur:180});addFx({kind:'num',x:nx,y:ny,txt:'0',col:'#8aa9a2',dur:750});
      say(`La foreuse rate l’${sp.n.toLowerCase()} (${ch} %).`);SFX.whoosh();drift();animalsAct();beastsAct();regen();computeFOV();render();if(G.over&&G.over.dead)dead();return;}}
    const dm=G.st.degats*(cr?CRIT_X:1),tag=sur?'Coup par surprise ! ':cr?'Coup critique ! ':'';an.hp=(an.hp??sp.pv)-dm;addFx({kind:'num',x:nx,y:ny,txt:'-'+dm+(cr?'!':''),col:cr?PAL['1']:PAL['3'],dur:cr?1000:750});if(cr){addFx({kind:'shake',amp:6,dur:220});SFX.crit();}addFx({kind:'lunge',robot:true,dx,dy,dur:180});
    if(an.hp<=0){G.animals.splice(G.animals.indexOf(an),1);bleed(an.x,an.y);say(`${tag}La foreuse écrase l’${sp.n.toLowerCase()}.`,'warn');SFX.squish();}
    else{an.aware=1;spot(an);say(`${tag}La foreuse heurte l’${sp.n.toLowerCase()}.`);SFX.crack();}
   drift();animalsAct();beastsAct();regen();computeFOV();render();if(G.over&&G.over.dead)dead();return;}
  if(v===CHASM){say('Gouffre : passage impossible.');SFX.blocked();render();return;}
  if(v===SHIP){say('Coque du vaisseau : indestructible.');SFX.blocked();render();return;}
  if(v===ROCK||v===MOUNT){
    if(nx===0||ny===0||nx===W-1||ny===H-1){say('Bord de la carte : roche impossible à briser.');SFX.blocked();render();return;}
    if(!spend())return;
    lastAct='dig';                                   // briser une paroi fait du bruit : portée de discrétion ×1,5
    const i=idx(nx,ny),hp=2;G.dmg=G.dmg||{};const hits=(G.dmg[i]||0)+1;G.turn++;G.msg=null;
    {const brk=hits>=hp;addFx({kind:'lunge',robot:true,dx,dy,dur:180});}
    if(hits>=hp){delete G.dmg[i];G.t[i]=RUBBLE;SFX.break();say(v===ROCK?'Rocher brisé : il ne reste que des gravats.':'La paroi cède : passage ouvert.','good');
      if(G.gems&&G.gems[i]==='cache'){G.gems[i]='visible';sayMore('Un joyau brille dans les gravats !','info');SFX.spot();}
      if(G.ore&&G.ore[i]&&!oreSol(G.ore[i])){const l=oreLv(G.ore[i]);G.ore[i]='sol'+l;sayMore(['','De petits éclats de métal tombent au sol.','Des éclats de métal tombent au sol.','De gros éclats de métal tombent au sol.'][l],'info');}}
    else{G.dmg[i]=hits;SFX.crack();say(v===ROCK?'La foreuse frappe le rocher : il se fissure.':`La foreuse attaque la montagne : fissure ${hits}/${hp-1}.`,'warn');}
    drift();animalsAct();beastsAct();regen();computeFOV();render();if(G.over&&G.over.dead)dead();return;}
  // chaque pas coûte MOVE_COST d'énergie ; sans assez d'énergie, la foreuse ne bouge pas (attendre recharge l'énergie)
  if(G.st.energie<MOVE_COST){say(`Énergie insuffisante pour avancer (${Math.floor(G.st.energie)}/${MOVE_COST}). Attendez qu’elle se recharge.`,'warn');SFX.blocked();render();return;}
  G.st.energie-=MOVE_COST;
  // eau profonde : une fois sur deux, le courant emporte le pas dans une autre direction au hasard
  if(G.t[idx(G.px,G.py)]===DEEP&&Math.random()<DEEP_MISS){const o=DIRS.map((d,k)=>k).filter(k=>DIRS[k][0]!==dx||DIRS[k][1]!==dy),k=o[rnd(0,o.length-1)],[ex,ey]=DIRS[k],ax=G.px+ex,ay=G.py+ey,av=G.t[idx(ax,ay)];
    const dirs=['l’est','l’ouest','le sud','le nord','le sud-est','le nord-est','le sud-ouest','le nord-ouest'];
    if(ax<1||ay<1||ax>=W-1||ay>=H-1||blocks(av)||!diagOk(G.px,G.py,ex,ey)||beastAt(ax,ay)||animalAt(ax,ay)){G.turn++;G.msg=null;SFX.thud();
      say(`Eau profonde : le courant plaque la foreuse contre un obstacle (${dirs[k]}).`,'warn');animalsAct();beastsAct();regen();computeFOV();render();if(G.over&&G.over.dead)dead();return;}
    dx=ex;dy=ey;nx=ax;ny=ay;v=av;G.face=dx>0?'r':dx<0?'l':dy>0?'d':'u';SFX.drift();G.devMsg=`Eau profonde : le courant dévie la foreuse vers ${dirs[k]}.`;}
  {const oi=idx(G.px,G.py),ov=G.t[oi],dk=DIRS.findIndex(d=>d[0]===dx&&d[1]===dy);
    if(ov!==LIQ&&ov!==DEEP&&ov!==BRIDGE&&ov!==DECK){G.tracks=G.tracks||{};G.tracks[oi]={t:G.turn+1,i:G.lastDir??dk,o:dk};}G.lastDir=dk;}
  const doorway=(G.t[idx(G.px,G.py)]===DECK)!==(v===DECK);   // passage de la porte du vaisseau
  G.px=nx;G.py=ny;G.turn++;G.dist++;G.msg=null;if(G.devMsg){say(G.devMsg,'warn');G.devMsg=null;}
  if(v===GRASS){G.t[idx(nx,ny)]=FLAT;SFX.grass();}else if(v===FLAT)SFX.grass();
  if(v===LIQ)SFX.water();else if(v===DEEP)SFX.deep();else SFX.step();
  if(doorway){SFX.door();say(v===DECK?'La porte du vaisseau s’ouvre : la foreuse rentre dans la soute.':'La porte du vaisseau s’ouvre : la foreuse sort.','info');}
  drift();animalsAct();beastsAct();regen();
  {const oi=idx(G.px,G.py);if(G.ore&&G.ore[oi]&&oreSol(G.ore[oi])){const l=oreLv(G.ore[oi]);delete G.ore[oi];const av=G.st.vie;G.st.vie=Math.min(G.st.vieMax,G.st.vie+ORE_PV[l]);
    addFx({kind:'num',x:G.px,y:G.py,txt:'+'+(G.st.vie-av),col:PAL['2'],dur:750});   // affiché comme les dégâts, couleur des éclats
    sayMore(`Éclats de métal récupérés : +${G.st.vie-av} PV.`,'good');SFX.spot();}}
  {const gi=idx(G.px,G.py);if(G.gems&&G.gems[gi]==='visible'){delete G.gems[gi];computeFOV();render();SFX.analyse();chooseUpgrade();return;}}
  const s=siteAt(G.px,G.py);
  if(s){if(!s.known)SFX.analyse();s.known=true;say(`Site ${s.id} : profondeur ${s.depth} niveau${s.depth>1?'x':''}. [F] pour forer.`,'good');}
  computeFOV();render();if(G.over&&G.over.dead)dead();
}

/* ---------- Forage ---------- */
function waitTurn(){
  if(G.over||drilling||!$('overlay').hidden)return;lastAct='wait';G.turn++;G.msg=null;say('Le robot attend.');
  drift(true);animalsAct();beastsAct();regen();computeFOV();render();if(G.over&&G.over.dead)dead();
}
function askDrill(){
  if(G.over||drilling||!$('overlay').hidden)return;const s=siteAt(G.px,G.py);if(!s)return;
  const known=G.sites.filter(x=>x.known).length;
  $('card').innerHTML=`<div class="tag">Confirmation de forage</div><h2>SITE ${s.id}</h2>
    <p>Profondeur estimée : <b style="color:var(--c3)">${s.depth} niveau${s.depth>1?'x':''}</b>. Une fois le forage lancé, le robot descend et ne peut plus revenir à la surface.</p>
    <p class="stats"><span>${known} site${known>1?'s':''} analysé${known>1?'s':''} sur ${NSITES}</span></p>
    <div class="row"><button class="go" id="yes">Lancer le forage</button><button id="no">Continuer l’exploration</button></div>`;
  $('overlay').hidden=false;$('yes').onclick=()=>drill(s);$('no').onclick=()=>{$('overlay').hidden=true;};$('yes').focus();
}
function drill(s){drilling=true;let k=0;const n=12;
  const step=()=>{$('card').innerHTML=`<div class="tag">Forage en cours · site ${s.id}</div><h2>DESCENTE</h2><p class="prog">${'▮'.repeat(k)}${'·'.repeat(n-k)}</p>`;
    if(k<n){SFX.drill(k);k++;setTimeout(step,reduced?0:110);}else{SFX.done();end(s);}};step();}
// Mort : la foreuse explose (voir explode, rendu), puis un seul bouton pour repartir
function dead(){if(G.over.boom)return;G.over.boom=true;if(TRAV)stopTravel();
  explode(()=>{$('card').innerHTML=`<h2 class="huge">FOREUSE<br>DÉTRUITE</h2>
    <div class="upg one"><button id="again"><span>Nouvelle exploration</span><b>▶</b></button><button id="quit"><span>Quitter</span><b>■</b></button></div>`;
    $('overlay').hidden=false;$('again').onclick=()=>{unlock();SFX.start();newGame();$('overlay').hidden=true;render();};$('quit').onclick=quitGame;$('again').focus();});
}
// Quitter : une page ne peut pas fermer son onglet ; tout s'éteint (écran noir, son coupé), un bouton discret rallume le jeu
function quitGame(){$('overlay').hidden=true;$('off').hidden=false;try{if(AC)AC.suspend();}catch(e){}$('offOn').focus();}
$('offOn').onclick=()=>{$('off').hidden=true;try{if(AC)AC.resume();}catch(e){}unlock();SFX.start();newGame();render();};
function end(s){
  drilling=false;G.over={site:s.id};const known=G.sites.filter(x=>x.known).length;
  $('card').innerHTML=`<div class="tag">Niveau 1 terminé</div><h2>ENTRÉE<br>NIVEAU 2</h2>
    <div class="stats"><span>Site foré : ${s.id} · profondeur ${s.depth} niveau${s.depth>1?'x':''}</span><span>Sites analysés : ${known}/${NSITES}</span><span>${G.turn} tours · ${G.dist} cases parcourues</span></div>
    <p>Le niveau 2 (sous-sol) reste à concevoir. En attendant, vous pouvez explorer une nouvelle planète.</p>
    <button class="go" id="again">Nouvelle planète</button>`;
  $('overlay').hidden=false;$('again').onclick=()=>{newGame();$('overlay').hidden=true;render();};$('again').focus();
}

