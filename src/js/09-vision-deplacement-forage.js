/* ---------- Vision ---------- */
// la fumée d'un fumigène cache la vue, des deux côtés (16 novembre 2026)
const opaque=(x,y)=>{const i=idx(x,y);if(G.fum&&G.fum[i])return true;
  const v=G.t[i];if(v===DOOR)return !porteOuverte(x,y);   // une porte cache la vue tant que personne ne se tient dedans
  return v===MOUNT||v===HARD||v===GRASS||v===WALL||v===PILLAR||v===LOCK||v===SECRET;};
const porteOuverte=(x,y)=>(G.px===x&&G.py===y)||!!(beastAt(x,y)||animalAt(x,y));
function line(x0,y0,x1,y1){const p=[];let dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1,e=dx+dy;
  for(;;){p.push([x0,y0]);if(x0===x1&&y0===y1)break;const e2=2*e;if(e2>=dy){e+=dy;x0+=sx;}if(e2<=dx){e+=dx;y0+=sy;}}return p;}
function los(x0,y0,x1,y1){const p=line(x0,y0,x1,y1);for(let i=1;i<p.length-1;i++)if(opaque(p[i][0],p[i][1]))return false;return true;}
// Capteur de la foreuse (elle seule) : la case juste derrière un obstacle à la vue (montagne, herbes hautes) est aperçue
// en mode souvenir — terrain affiché assombri, sans les créatures. Les ennemis, eux, ne voient pas à travers.
function peekBehind(x0,y0,x1,y1){const p=line(x0,y0,x1,y1),n=p.length;if(n<3)return false;
  for(let i=1;i<n-2;i++)if(opaque(p[i][0],p[i][1]))return false;
  const o=G.t[idx(p[n-2][0],p[n-2][1])];if(bati(o)||o===DOOR)return false;   // le capteur ne devine rien derrière un mur bâti ou une porte
  return opaque(p[n-2][0],p[n-2][1]);}
function computeFOV(){vis=new Uint8Array(W*H);const r=G.st.capteur,px=G.px,py=G.py;
  for(let y=py-r;y<=py+r;y++)for(let x=px-r;x<=px+r;x++){if(x<0||y<0||x>=W||y>=H)continue;if((x-px)**2+(y-py)**2>r*r+r)continue;
    if(los(px,py,x,y)){vis[idx(x,y)]=1;G.seen[idx(x,y)]=1;}else if(peekBehind(px,py,x,y))G.seen[idx(x,y)]=1;}
  if(G.animals)for(const a of G.animals)if(vis[idx(a.x,a.y)]&&!G.fauna.includes(a.sp)){G.fauna.push(a.sp);const sp=SPECIES[a.sp];
    sayMore(`Nouvelle espèce observée : ${sp.n} (pas ${motDuree(sp.dpas)}, coup ${motDuree(sp.dcoup)}).`,'info');SFX.chirp();}
  antVis();   // les antennes allumées tiennent leur zone en vue
  if(G.beasts){if(typeof G.beastSeen!=='object'||!G.beastSeen)G.beastSeen={};
    for(const b of G.beasts){if(G.beastSeen[b.sp]||!vis[idx(b.x,b.y)]||beastCache(b))continue;G.beastSeen[b.sp]=true;const sp=BEASTS[b.sp];
    sayMore(`Ennemi repéré : ${sp.n} (pas ${motDuree(sp.dpas)}, coup ${motDuree(sp.dcoup)}, ${pvDe(sp)} PV).`,'warn');SFX.roar();}}
  for(const s of G.sites)if(vis[idx(s.x,s.y)]&&!s.seen){s.seen=true;SFX.spot();say(`Site ${s.id} repéré.`,'info');}
}

/* ---------- Portée de discrétion (13 novembre 2026) ----------
   Un seul rayon, celui de la foreuse, le même pour tous les ennemis : dans ce rayon et en ligne de vue, un ennemi
   qui ne vous a pas repéré a NOTICE de chance par tour de vous remarquer. Un ennemi déjà en chasse vous garde en vue
   jusqu'à HUNT_MULT fois ce rayon (2 ×) ; au-delà il se rabat sur votre dernière position connue, fouille, puis oublie.
   Hors du rayon mais encore dans la bande de chasse, il a LOSE_TRACK par tour de perdre votre trace (les 3 % de Brogue) :
   il garde la dernière position connue et s'y rend, mais ne vous suit plus de loin — il doit vous remarquer de nouveau
   (NOTICE) à l'intérieur du rayon. Marqué par o.lost, remis à zéro dès qu'il vous revoit ou qu'il oublie.
   Calcul, dans cet ordre : base, ×1,5 en brisant une paroi, ÷2 en attendant sur place, ÷2 sur des herbes basses
   (arrondi au supérieur à chaque division), −1 par 2 parois adjacentes, arrondi au supérieur (rocher ou montagne), au plus −4, plancher STEALTH_MIN. */
// courir s'entend : + 2 cases de portée
let STEALTH_BASE=10;const NOTICE=.25,HUNT_MULT=2,STEALTH_MIN=2,DIG_MULT=1.5,LOSE_TRACK=.03,SPRINT_NOISE=2;
try{const s=+localStorage.getItem('np-stealth');if(s>=2&&s<=30)STEALTH_BASE=s;}catch(e){}
function setStealthBase(v){STEALTH_BASE=Math.max(2,Math.min(30,v|0));try{localStorage.setItem('np-stealth',STEALTH_BASE);
  }catch(e){}touchLocal();}
let lastAct='move';                                   // ce que la foreuse vient de faire : 'move', 'wait' ou 'dig'
let lastRun=false;                                     // ce pas a-t-il été couru ? (portée de discrétion + SPRINT_NOISE)
// retrait maximal dû aux parois adjacentes (−2 depuis le 18 novembre 2026 ; −4 avant)
const WALL_MAX=2;
// flat : sur des herbes basses ; walls : parois adjacentes (0 à 8) : retrait = parois ÷ 2 arrondi au supérieur, au plus WALL_MAX
function stealthCalc(base,act,flat,walls,run){
  let r=base;
  if(act==='dig')r=Math.ceil(r*DIG_MULT);
  if(act==='wait')r=Math.ceil(r/2);
  if(flat)r=Math.ceil(r/2);                           // herbes basses : couvert
  r=Math.max(STEALTH_MIN,r-Math.min(Math.ceil(walls/2),WALL_MAX));
  return r+(run?SPRINT_NOISE:0);}                      // la course s'entend : + 2, après tout le reste
function stealthRange(act){
  let walls=0;for(const [dx,dy] of DIRS){const x=G.px+dx,y=G.py+dy;if(x<0||y<0||x>=W||y>=H)continue;const v=G.t[idx(x,y)];
    if(v===ROCK||v===MOUNT||bati(v))walls++;}
  return stealthCalc(Math.max(STEALTH_MIN,STEALTH_BASE+(G.st.dis||0)),act,G.t[idx(G.px,G.py)]===FLAT,walls,lastRun);}
function turnStealth(){G.stealth=stealthRange(lastAct);}

/* ---------- Horloge (13 novembre 2026, horloge par créature le 25 novembre 2026) ----------
   Le temps ne se compte pas en tours mais en unités : chaque action a une durée (100 = l'allure de base).
   **Chaque créature a son horloge** : `o.pret` est l'instant où elle pourra agir. Quand elle agit, l'effet est
   immédiat, puis elle est occupée pendant la durée de son action — un pas (`dpas` de l'espèce, allongé par le
   terrain) ou un coup (`dcoup`). Le temps avance jusqu'au plus proche des deux prochains instants : la créature
   prête la première, ou le prochain battement. Rien n'est arrondi ni perdu : le reste de temps d'une action se
   reporte tout seul sur l'action suivante. Une créature rapide vient donc au contact et frappe pendant une seule
   action de la foreuse, et un coup de 50 frappe deux fois par battement.
   Restent calés sur le battement, toutes les TICK unités : la détection et la perte de trace, la recharge
   d'énergie, la durée des effets (étourdi, glu, mèche d'une mine), les soins du Soudeur et les machines.
   Égalités : le battement passe avant une créature prête au même instant (la détection avant l'action), et la
   foreuse passe avant une créature prête à l'instant même où son action à elle se termine.
   Durée d'un pas de la foreuse = DUR.pas × 5 ÷ VIT × terrain (SLOW) × 0,5 en course. */
const TICK=100;
const DUR={pas:100,coup:100,forage:100,attente:100};   // durée de chaque action ; un équipement pourra les modifier
const PALIERS=[50,75,100,150,200];                     // les durées des créatures s'écrivent sur ces paliers (voir 03-tuiles)
const SLOW={[LIQ]:1.5,[DEEP]:2};                        // terrains lents : eau peu profonde ×1,5, eau profonde ×2
const SPRINT_COST=5,SPRINT_MULT=.5;                     // course : énergie par pas, et durée du pas multipliée
const WAIT_REGEN=2;                                     // attendre sur place : recharge d'énergie multipliée
const slowOf=(v,swim)=>swim?1:(SLOW[v]||1);             // les nageurs (crabos) ne sont pas ralentis par l'eau
const coupDur=()=>Math.max(25,DUR.coup+(G.st.coup||0));   // une arme peut allonger ou raccourcir le coup (14-inventaire)
const robotVit=()=>Math.max(1,G.st.vitesse||5);
// englué : pas deux fois plus longs
function stepDur(v,run){return DUR.pas*5/robotVit()*slowOf(v)*(run?SPRINT_MULT:1)*(G.eff&&G.eff.glu>0?2:1);}
// Une créature qui pousse une porte à portée de vue s'entend (19 novembre 2026) : on compare les portes occupées avant et après le battement.
function portesPrises(){const s=new Set();for(const l of [G.animals,G.beasts])for(const o of l||[]){const i=idx(o.x,o.y);
  if(G.t[i]===DOOR)s.add(i);}return s;}
function portesBruit(av){for(const i of portesPrises())if(!av.has(i)&&vis[i]){SFX.porte(.6);return;}}
/* Le temps passe : on déroule, dans l'ordre des instants, les actions des créatures et les battements du monde qui
   tombent pendant la durée d de l'action de la foreuse. G.bat porte l'instant du prochain battement. */
function pass(d,wait){const fin=(G.time||0)+d;
  if(G.bat==null)G.bat=(G.time||0)+TICK;
  let garde=0;
  while(!G.over&&garde++<4000){
    const c=prochaineCreature(),tc=c?c.pret:Infinity,
      batOk=G.bat<=fin+1e-6,                            // le battement qui tombe au bout de l'action compte, lui
      creOk=tc<fin-1e-6;                                // mais la foreuse joue avant une créature prête au même instant
    if(!batOk&&!creOk)break;
    if(creOk&&(!batOk||tc<G.bat)){G.time=tc;creatureJoue(c);}   // une créature agit sur son horloge
    else{G.time=G.bat;G.bat+=TICK;battement(wait);}}    // le battement du monde (égalité : il passe d'abord)
  G.time=fin;
  if(!G.over)turnStealth();}                            // une action rapide peut ne faire battre personne : la portée affichée reste juste
function battement(wait){if(wait)drift(true);const av=portesPrises();animalsAct();beastsAct();machTick();
  portesBruit(av);effTick();regen(wait);}
function toggleSprint(){if(!G||G.over)return;
  if(!G.sprint&&G.st.energie<SPRINT_COST){say(`Énergie insuffisante pour courir (${Math.floor(G.st.energie)}/${SPRINT_COST}).`,'warn');
    SFX.blocked();render();return;}
  G.sprint=!G.sprint;G.sprint?SFX.motorOn():SFX.motorOff();
    say(G.sprint?`Course : deux fois plus vite, ${SPRINT_COST} d’énergie par pas, et ${SPRINT_NOISE} cases de discrétion en plus.`:'La foreuse reprend la marche.','info');render();}

/* ---------- Déplacement ---------- */
const siteAt=(x,y)=>G.sites.find(s=>s.x===x&&s.y===y);
// Dérive dans l'eau profonde : seulement quand la foreuse attend (un pas, lui, est dévié au moment même : DEEP_MISS)
function drift(wait){if(!wait)return;
  if(G.t[idx(G.px,G.py)]!==DEEP)return;
  const k=rnd(0,7),[dx,dy]=DIRS[k],nx=G.px+dx,ny=G.py+dy,v=G.t[idx(nx,ny)];
  if(v===ROCK||v===MOUNT||v===CHASM||bati(v)||!diagOk(G.px,G.py,dx,dy)||beastAt(nx,ny)||animalAt(nx,ny)){SFX.thud();
    sayMore(`Le courant plaque le robot contre un obstacle (${DIRN[k]}).`,'warn');return;}
  G.px=nx;G.py=ny;G.lastDir=null;if(v===GRASS)G.t[idx(nx,ny)]=FLAT;
  SFX.drift();sayMore(`Eau profonde : le courant entraîne le robot vers ${['l’est','l’ouest','le sud','le nord','le sud-est','le nord-est','le sud-ouest','le nord-ouest'][k]}.`,'warn');
}
const DEEP_MISS=.5;   // eau profonde : chance qu'un pas parte dans une autre direction, tirée au hasard
function tryMove(dx,dy){
  if(G.over||drilling)return;lastAct='move';lastRun=false;let nx=G.px+dx,ny=G.py+dy;if(nx<0||ny<0||nx>=W||ny>=H)return;
  let v=G.t[idx(nx,ny)];
  G.face=dx>0?'r':dx<0?'l':dy>0?'d':'u';
  if(!diagOk(G.px,G.py,dx,dy)){say('Coin de paroi : pas de passage en diagonale.');SFX.blocked();render();return;}
  if(G.balises&&baliseAt(nx,ny)){say('Une balise posée barre le passage.');SFX.blocked();render();return;}   // 23 novembre 2026
  const bz=beastAt(nx,ny);
  // surprise : ne vous a pas repéré
  if(bz){const sp=BEASTS[bz.sp];G.turn++;G.msg=null;engage();camoCasse();bz.leurre=0;
    /* frappé, il oublie la balise */const sur=!(bz.hunt>0),cr=sur||roll((G.st.crit??5)+critBonus());
    {const ch=hitChance(robotPre(),sp.def+terrModDe(sp,nx,ny));if(!sur&&!roll(ch)){if(!bz.hunt)alerte(bz);bz.hunt=1;spot(bz);
      addFx({kind:'lunge',robot:true,dx,dy,dur:180});addFx({kind:'num',x:nx,y:ny,txt:'0',col:'#8aa9a2',dur:750});
      say(`La foreuse rate ${leNom(sp)} (${ch} %).`);SFX.whoosh();pass(coupDur());computeFOV();render();if(G.over&&G.over.dead)dead();return;}}
    const dm=robotDeg()*(cr?CRIT_X:1);bz.hp-=dm;if(!bz.hunt&&bz.hp>0)alerte(bz);bz.hunt=1;spot(bz);
      addFx({kind:'num',x:nx,y:ny,txt:'-'+dm+(cr?'!':''),col:cr?PAL['1']:PAL['3'],dur:cr?1000:750});
      if(cr){addFx({kind:'shake',amp:6,dur:220});SFX.crit();}
    addFx({kind:'lunge',robot:true,dx,dy,dur:180});addFx({kind:'flash',beast:bz,dur:180});if(bz.hp<=0)addFx({kind:'shake',amp:4,dur:200});
    const tag=sur?'Coup par surprise ! ':cr?'Coup critique ! ':'';
    if(bz.hp<=0){G.beasts.splice(G.beasts.indexOf(bz),1);bleed(bz.x,bz.y);butinMort(bz);
      say(`${tag}La foreuse abat ${leNom(sp)}.`,'good');SFX.break();}
    else{say(`${tag}La foreuse percute ${leNom(sp)} : −${dm} PV (${bz.hp}/${pvDe(sp)}).`,'warn');SFX.coup();}
    pass(coupDur());computeFOV();render();if(G.over&&G.over.dead)dead();return;}
  const an=animalAt(nx,ny);
  if(an){const sp=SPECIES[an.sp];G.turn++;G.msg=null;engage();camoCasse();const sur=!an.aware,cr=sur||roll((G.st.crit??5)+critBonus());
    {const ch=hitChance(robotPre(),sp.def+terrModDe(sp,nx,ny));if(!sur&&!roll(ch)){an.aware=1;an.enraged=true;spot(an);
      addFx({kind:'lunge',robot:true,dx,dy,dur:180});addFx({kind:'num',x:nx,y:ny,txt:'0',col:'#8aa9a2',dur:750});
      say(`La foreuse rate ${leNom(sp)} (${ch} %).`);SFX.whoosh();pass(coupDur());computeFOV();render();if(G.over&&G.over.dead)dead();return;}}
    const dm=robotDeg()*(cr?CRIT_X:1),tag=sur?'Coup par surprise ! ':cr?'Coup critique ! ':'';an.hp=(an.hp??pvDe(sp))-dm;
      addFx({kind:'num',x:nx,y:ny,txt:'-'+dm+(cr?'!':''),col:cr?PAL['1']:PAL['3'],dur:cr?1000:750});
      if(cr){addFx({kind:'shake',amp:6,dur:220});SFX.crit();}addFx({kind:'lunge',robot:true,dx,dy,dur:180});
    if(an.hp<=0){G.animals.splice(G.animals.indexOf(an),1);bleed(an.x,an.y);say(`${tag}La foreuse écrase ${leNom(sp)}.`,'warn');SFX.squish();}
    else{if(!an.aware)alerte(an);an.aware=1;an.enraged=true;spot(an);say(`${tag}La foreuse heurte ${leNom(sp)}.`);SFX.coup();}
   pass(coupDur());computeFOV();render();if(G.over&&G.over.dead)dead();return;}
  // Bloqueur (22 novembre 2026)
  {const bl=tenuPar();
    if(bl){say(`${LeNom(BEASTS[bl.sp])} tient la foreuse : impossible de bouger tant qu’il n’est pas détruit ou étourdi.`,'warn');
    SFX.blocked();render();return;}}
  if(v===CHASM){say('Gouffre : passage impossible.');SFX.blocked();render();return;}
  if(v===SHIP){say('Coque du vaisseau : indestructible.');SFX.blocked();render();return;}
  if(v===HARD){say('Roche dure : la foreuse ne l’entame pas. Seule une charge sismique en vient à bout.');SFX.blocked();render();return;}
  if(v===LOCK){const i=idx(nx,ny);
    if(!nbCles()){say('Porte verrouillée : il faut une clé.');SFX.blocked();render();return;}
    invTake(G.inv.findIndex(o=>o.k==='cle'));sacFix();SAC_H='';G.t[i]=DOOR;G.turn++;G.msg=null;SFX.serrure();
      say('La clé tourne dans la serrure : la porte est ouverte.','good');pass(DUR.wait||100);computeFOV();render();return;}
  if(machTuile(v)){if(machBump(nx,ny,dx,dy)!=='go')return;v=G.t[idx(nx,ny)];}
  if(v===ANTENNA){antenneUse(idx(nx,ny));return;}
  if(v===TERMINAL){terminalUse(idx(nx,ny));return;}
  if(v===MACHINE){say('Machine hors d’usage : elle barre le passage. Une charge sismique la réduirait en gravats.');SFX.blocked();render();return;}
  if(bati(v)||v===VITRE){say((v===PILLAR?'Pilier':v===VITRE?'Mur vitré':'Mur bâti')+' : la foreuse ne l’entame pas. Seule une charge sismique l’ouvre.');
    SFX.blocked();render();return;}
  if(v===ROCK||v===MOUNT){
    if(nx===0||ny===0||nx===W-1||ny===H-1){say('Bord de la carte : roche impossible à briser.');SFX.blocked();render();return;}
    if(!spend())return;
    lastAct='dig';camoCasse();                       // briser une paroi fait du bruit : portée de discrétion ×1,5
    const i=idx(nx,ny),hp=2;G.dmg=G.dmg||{};const hits=(G.dmg[i]||0)+1;G.turn++;G.msg=null;
    {const brk=hits>=hp;addFx({kind:'lunge',robot:true,dx,dy,dur:180});}
    if(hits>=hp){delete G.dmg[i];G.t[i]=RUBBLE;SFX.break();
      say(v===ROCK?'Rocher brisé : il ne reste que des gravats.':'La paroi cède : passage ouvert.','good');
      if(G.ore&&G.ore[i]&&!oreSol(G.ore[i])){const l=oreLv(G.ore[i]),mt=oreMat(G.ore[i]);G.ore[i]=(mt?'m':'')+'sol'+l;sayMore(mt?['','Un peu de Matière {µ} tombe au sol.','De la Matière {µ} tombe au sol.','Un gros bloc de Matière {µ} tombe au sol.'][l]:['','De petits éclats de métal tombent au sol.','Des éclats de métal tombent au sol.','De gros éclats de métal tombent au sol.'][l],'info');}}
    else{G.dmg[i]=hits;SFX.crack();
      say(v===ROCK?'La foreuse frappe le rocher : il se fissure.':`La foreuse attaque la montagne : fissure ${hits}/${hp-1}.`,'warn');}
    pass(DUR.forage);computeFOV();render();if(G.over&&G.over.dead)dead();return;}
  // eau profonde : une fois sur deux, le courant emporte le pas dans une autre direction au hasard
  if(G.t[idx(G.px,G.py)]===DEEP&&Math.random()<DEEP_MISS){const o=DIRS.map((d,k)=>k).filter(k=>DIRS[k][0]!==dx||DIRS[k][1]!==dy),
    k=o[rnd(0,o.length-1)],[ex,ey]=DIRS[k],ax=G.px+ex,ay=G.py+ey,av=G.t[idx(ax,ay)];
    const dirs=['l’est','l’ouest','le sud','le nord','le sud-est','le nord-est','le sud-ouest','le nord-ouest'];
    if(ax<1||ay<1||ax>=W-1||ay>=H-1||blocks(av)||!diagOk(G.px,G.py,ex,ey)||beastAt(ax,ay)||animalAt(ax,ay)){G.turn++;G.msg=null;SFX.thud();
      say(`Eau profonde : le courant plaque la foreuse contre un obstacle (${dirs[k]}).`,'warn');pass(DUR.pas);computeFOV();render();
        if(G.over&&G.over.dead)dead();return;}
    dx=ex;dy=ey;nx=ax;ny=ay;v=av;G.face=dx>0?'r':dx<0?'l':dy>0?'d':'u';SFX.drift();
      G.devMsg=`Eau profonde : le courant dévie la foreuse vers ${dirs[k]}.`;}
  {const oi=idx(G.px,G.py),ov=G.t[oi],dk=DIRS.findIndex(d=>d[0]===dx&&d[1]===dy);
    if(ov!==LIQ&&ov!==DEEP&&ov!==BRIDGE&&ov!==DECK){G.tracks=G.tracks||{};G.tracks[oi]={t:G.turn+1,i:G.lastDir??dk,o:dk};}G.lastDir=dk;}
  // course : chaque pas coûte SPRINT_COST d'énergie et dure moitié moins ; à sec, la foreuse reprend la marche
  let run=false;if(G.sprint){if(G.st.energie>=SPRINT_COST){G.st.energie-=SPRINT_COST;run=true;}else{G.sprint=false;SFX.motorOff();
    G.devMsg=(G.devMsg?G.devMsg+' ':'')+'Énergie insuffisante : la foreuse reprend la marche.';}}
  lastRun=run;
  const doorway=(G.t[idx(G.px,G.py)]===DECK)!==(v===DECK);   // passage de la porte du vaisseau
  G.px=nx;G.py=ny;G.turn++;G.dist++;G.msg=null;if(G.devMsg){say(G.devMsg,'warn');G.devMsg=null;}
  if(v===GRASS){G.t[idx(nx,ny)]=FLAT;SFX.grass();}else if(v===FLAT)SFX.grass();
  if(v===LIQ)SFX.water();else if(v===DEEP)SFX.deep();else SFX.step();
  if(run)SFX.motor();
  if(doorway){SFX.door();say(v===DECK?'La porte du vaisseau s’ouvre : la foreuse rentre dans la soute.':'La porte du vaisseau s’ouvre : la foreuse sort.','info');}
  pass(stepDur(v,run));
  if(G.t[idx(G.px,G.py)]===DOOR)SFX.porte();   // la foreuse pousse une porte
  {const ci=idx(G.px,G.py);if(G.cles&&G.cles[ci]){delete G.cles[ci];G.items=G.items||{};(G.items[ci]=G.items[ci]||[]).push('cle');
    addFx({kind:'num',x:G.px,y:G.py,txt:'clé',col:PAL['1'],dur:900});
    /* la clé est un objet : elle est ramassée avec les autres, juste après (invPickup) */}}
  {const oi=idx(G.px,G.py);if(G.ore&&G.ore[oi]&&oreSol(G.ore[oi])){const l=oreLv(G.ore[oi]),mt=oreMat(G.ore[oi]);delete G.ore[oi];
    if(mt){G.st.matiere=(G.st.matiere||0)+ORE_PV[l];addFx({kind:'num',x:G.px,y:G.py,txt:'+'+ORE_PV[l],col:PAL['1'],dur:750});
      sayMore(`Matière {µ} récupérée : +${ORE_PV[l]} (réserve : ${G.st.matiere}).`,'good');SFX.spot();}
    else{const av=G.st.vie,ae=G.st.energie;   // les éclats refont le plein de vie ET d'énergie (16 novembre 2026)
    G.st.vie=Math.min(G.st.vieMax,G.st.vie+ORE_PV[l]);G.st.energie=Math.min(G.st.energieMax,G.st.energie+ORE_PV[l]);
    const dv=Math.round(G.st.vie-av),de=Math.round(G.st.energie-ae);
    addFx({kind:'num',x:G.px,y:G.py,txt:'+'+dv,col:PAL['2'],dur:750});   // affiché comme les dégâts, couleur des éclats
    // l'énergie regagnée, en blanc comme sa barre (22 novembre 2026)
    if(de)addFx({kind:'num',x:G.px,y:G.py,txt:'+'+de,col:'#ffffff',dur:750,stack:1});
    sayMore(`Éclats de métal récupérés : +${dv} PV, +${de} d’énergie.`,'good');SFX.spot();
    if(dv)addFx({kind:'soin',x:G.px,y:G.py,dur:900,gr:fxGrains(9)});if(de)addFx({kind:'ener',x:G.px,y:G.py,dur:900,gr:fxGrains(9)});}}}
  invPickup(true);
  const s=siteAt(G.px,G.py);
  if(s){if(!s.known)SFX.analyse();s.known=true;say('Site de forage détecté. [F] pour forer.','good');}
  computeFOV();render();if(G.over&&G.over.dead)dead();
}

/* ---------- Forage ---------- */
function waitTurn(){
  if(G.over||drilling||!$('overlay').hidden)return;lastAct='wait';lastRun=false;G.turn++;G.msg=null;
    if(!REST)say(`Le robot attend : recharge ${WAIT_REGEN} fois plus vite (${+(G.st.power/POW_BASE*WAIT_REGEN).toFixed(1)}/t).`);
  pass(DUR.attente,true);chercheSecrets();computeFOV();render();if(G.over&&G.over.dead)dead();
}
function askDrill(){
  if(G.over||drilling||!$('overlay').hidden)return;const s=siteAt(G.px,G.py);if(!s)return;
  if(TRAV)stopTravel();if(REST)stopRest();
  // 22 novembre 2026 : plus d'écran « FORAGE » intermédiaire, la descente en ASCII part tout de suite (il reste pour le dernier niveau, et en mouvement réduit)
  if((G.niv||1)<NIV_MAX&&!reduced){drilling=true;end(s);return;}
  $('overlay').hidden=false;drill(s);   // pas de confirmation (15 novembre 2026) : F fore tout de suite
}
function drill(s){drilling=true;let k=0;const n=12;
  const step=()=>{$('card').innerHTML=`<div class="tag">Forage en cours · site ${s.id}</div><h2>FORAGE</h2><p class="prog">${'▮'.repeat(k)}${'·'.repeat(n-k)}</p>`;
    if(k<n){SFX.drill(k);k++;setTimeout(step,reduced?0:110);}else{SFX.done();end(s);}};step();}
// Mort : la foreuse explose (voir explode, rendu), puis « Déployer une nouvelle foreuse » : retour au niveau 1, intro comprise
// « FOREUSE DÉTRUITE » toujours en rouge, quelle que soit la palette (23 novembre 2026). Détruite pendant une descente (G.over.forage),
// l'explosion s'est jouée dans le puits : pas d'explosion sur la carte, et un fond noir plein cache le niveau.
function dead(){if(G.over.boom)return;G.over.boom=true;if(TRAV)stopTravel();if(REST)stopRest();
  // à la mort, toutes les capsules se dévoilent dans l'inventaire (23 novembre 2026)
  let devoile=0;for(const k in CONSO)if(identifier(k))devoile++;
  if(devoile){say('La foreuse détruite, toutes les capsules se dévoilent.','warn');try{side();}catch(e){}}
  const carte=()=>{$('card').innerHTML=`<h2 class="huge mort">FOREUSE<br>DÉTRUITE</h2>
    <div class="upg one"><button id="again"><span>Déployer une nouvelle foreuse</span><b>▶</b></button><button id="quit"><span>Quitter</span><b>■</b></button></div>`;
    $('overlay').classList.toggle('noir',!!G.over.forage);$('overlay').hidden=false;$('again').onclick=()=>{unlock();SFX.start();
      $('overlay').classList.remove('noir');deployerForeuse();};$('quit').onclick=()=>{$('overlay').classList.remove('noir');quitGame();};
      $('again').focus();};
  if(G.over.forage)carte();else explode(carte);
}
// Quitter : une page ne peut pas fermer son onglet ; tout s'éteint (écran noir, son coupé), un bouton discret rallume le jeu
function quitGame(){$('overlay').hidden=true;$('off').hidden=false;try{if(AC)AC.suspend();}catch(e){}$('offOn').focus();}
$('offOn').onclick=()=>{$('off').hidden=true;try{if(AC)AC.resume();}catch(e){}unlock();SFX.start();nouvellePartie();};
/* Site foré. Au dernier niveau, le noyau est atteint et la partie est gagnée. Avant (21 novembre 2026), la
   cinématique de forage se joue et le niveau suivant commence. */
function end(s){
  drilling=false;
  if((G.niv||1)<NIV_MAX){$('overlay').hidden=true;descendre(G.niv||1);return;
    }const bilan=`<div class="stats"><span>${G.turn} tours · ${G.dist} cases parcourues</span><span>Matière {µ} en réserve : ${G.st.matiere||0}</span></div>`;
  G.over={site:s.id,win:true};
  $('card').innerHTML=`<div class="tag">Site ${s.id} foré</div><h2>NOYAU<br>ATTEINT</h2>${bilan}<p>La foreuse a percé jusqu’au noyau de la planète.</p><button class="go" id="again">Nouvelle exploration</button>`;
  $('overlay').hidden=false;$('again').onclick=()=>{nouvellePartie();};$('again').focus();
}

