/* ---------- Faune ---------- */
const animalAt=(x,y)=>G.animals&&G.animals.find(a=>a.x===x&&a.y===y);
// Eau : seuls les crabos (swim) y entrent ; insectoïdes et cafars évitent l'eau peu profonde comme l'eau profonde
const isWater=v=>v===LIQ||v===DEEP,canWalk=(v,swim)=>!blocks(v)&&(swim||!isWater(v));
const canHit=o=>Math.max(Math.abs(o.x-G.px),Math.abs(o.y-G.py))<=1;
const animalOk=(x,y)=>{if(x<1||y<1||x>=W-1||y>=H-1)return false;const v=G.t[idx(x,y)];return canWalk(v,false)&&!(x===G.px&&y===G.py)&&!animalAt(x,y)&&!beastAt(x,y);};
function spawnAnimals(){
  const pool=[...SPECIES.keys()].sort(()=>Math.random()-.5).slice(0,1);G.animals=[];G.fauna=[];G.pool=pool;
  for(let k=0,tries=0;k<LIFE.insectoide&&tries<LIFE.insectoide*300+500;tries++){const x=rnd(2,W-3),y=rnd(2,H-3),v=G.t[idx(x,y)];
    if(!(v===GROUND||v===GRASS||v===FLAT||v===LOW)||Math.hypot(x-G.px,y-G.py)<SZ(10,4)||animalAt(x,y))continue;
    G.animals.push({sp:pool[k%pool.length],x,y,hp:SPECIES[pool[k%pool.length]].pv,mp:Math.random(),flee:0,dir:Math.random()<.5?1:-1});k++;}
}
// Insectoïde : une fois le robot repéré, il le suit à 2 ou 3 cases (recule au contact,
// se rapproche au-delà de 3). Quand un crabos chasse le robot à proximité, il passe à l'attaque.
const KEEP_MIN=1,KEEP_MAX=3,BACKUP_R=4;
const cheb=(a,x,y)=>Math.max(Math.abs(a.x-x),Math.abs(a.y-y));
function stepToward(a,dist){chaseStep(a,dist,animalOk);}
// Distance à la foreuse en traitant les autres créatures comme des obstacles (soi-même exclu)
function robotDistAvoid(self){const occ=new Uint8Array(W*H),swim=(G.beasts||[]).includes(self)&&!!BEASTS[self.sp].swim;
  for(const o of [...(G.beasts||[]),...(G.animals||[])])if(o!==self)occ[idx(o.x,o.y)]=1;
  const d=new Int16Array(W*H).fill(-1),q=[idx(G.px,G.py)];d[q[0]]=0;
  for(let k=0;k<q.length;k++){const c=q[k],x=c%W,y=(c/W)|0;for(const[dx,dy]of DIRS){const a=x+dx,b=y+dy;if(a<1||b<1||a>=W-1||b>=H-1)continue;
    const j=idx(a,b),v=G.t[j];if(d[j]>=0||!canWalk(v,swim)||occ[j])continue;d[j]=d[c]+1;q.push(j);}}
  return d;}
// Poursuite commune à tous les ennemis : avance par le plus court chemin ; si un autre ennemi bloque le passage,
// contourne l'obstacle (détour de 10 cases au plus) vers une case libre autour de la foreuse, pour attaquer à plusieurs
const DETOUR_MAX=10;
function chaseStep(o,dist,fits){const h=dist[idx(o.x,o.y)],cur=h<0?9999:h;let best=null,bv=cur;
  for(const[dx,dy]of DIRS){const nx=o.x+dx,ny=o.y+dy;if(!fits(nx,ny))continue;const v=dist[idx(nx,ny)];if(v>=0&&v<bv){bv=v;best=[nx,ny,dx];}}
  if(!best&&cur>1){const d2=robotDistAvoid(o),h2=d2[idx(o.x,o.y)];
    if(h2>0&&h2<=cur+DETOUR_MAX){let b2=h2;
      for(const[dx,dy]of DIRS){const nx=o.x+dx,ny=o.y+dy;if(!fits(nx,ny))continue;const v=d2[idx(nx,ny)];if(v>=0&&v<b2){b2=v;best=[nx,ny,dx];}}}}
  if(best){o.x=best[0];o.y=best[1];if(best[2])o.dir=best[2]>0?1:-1;return true;}return false;}
function stepAway(a){const cur=(a.x-G.px)**2+(a.y-G.py)**2;let best=null,bd=cur;
  for(const[dx,dy]of [...DIRS].sort(()=>Math.random()-.5)){const nx=a.x+dx,ny=a.y+dy;if(!animalOk(nx,ny))continue;const nd=(nx-G.px)**2+(ny-G.py)**2;if(nd>bd){bd=nd;best=[nx,ny,dx];}}
  if(best){a.x=best[0];a.y=best[1];if(best[2])a.dir=best[2]>0?1:-1;}}
function animalsAct(){
  if(!G.animals||G.over)return;let fled=null,swarm=null;const dist=robotDist(false);
  const backup=(G.beasts||[]).some(b=>b.hunt>0&&cheb(b,G.px,G.py)<=BACKUP_R);
  for(const a of G.animals){if(G.over)break;const sp=SPECIES[a.sp];a.mp=Math.min(2,a.mp+sp.v/5);
    const d=Math.hypot(a.x-G.px,a.y-G.py),sees=d<=sp.d&&los(a.x,a.y,G.px,G.py),seeLong=d<=sp.d+5&&los(a.x,a.y,G.px,G.py);
    if(sees)a.aware=10;else if(seeLong&&a.aware>0)a.aware=Math.max(a.aware,6);else if(a.aware>0)a.aware--;
    const prev=a.mode,c=cheb(a,G.px,G.py);
    // une fois passé à l'attaque, l'insectoïde ne recule plus jamais
    if(a.aware&&backup)a.enraged=true;
    a.mode=!a.aware?'':a.enraged?'attack':c<=KEEP_MIN?'flee':c>KEEP_MAX?'follow':'hold';
    if(a.mode==='attack'&&prev!=='attack'&&vis[idx(a.x,a.y)])swarm=swarm||sp;
    if(a.mode==='flee'&&prev!=='flee'&&vis[idx(a.x,a.y)])fled=fled||sp;
    if(a.mode==='attack'&&canHit(a)){hurtRobot(a,sp);continue;}
    while(a.mp>=1&&!G.over){a.mp-=1;
      if(a.mode==='attack'){if(canHit(a)){a.mp=Math.min(a.mp,.99);break;}stepToward(a,dist);}
      else if(a.mode==='flee')stepAway(a);
      else if(a.mode==='follow')stepToward(a,dist);
      else if(Math.random()<(a.mode==='hold'?.15:.3)){const [dx,dy]=DIRS[rnd(0,7)];const nx=a.x+dx,ny=a.y+dy;
        if(animalOk(nx,ny)&&(a.mode!=='hold'||cheb({x:nx,y:ny},G.px,G.py)>KEEP_MIN)){a.x=nx;a.y=ny;if(dx)a.dir=dx;}}
      else a.mp=Math.min(a.mp,.99);}
  }
  if(swarm){sayMore(`Renforts de crabos : les ${swarm.n.toLowerCase()}s passent à l’attaque !`,'warn');SFX.chirp();}
  else if(fled){sayMore(`Un ${fled.n.toLowerCase()} recule.`);SFX.chirp();}
}

/* ---------- Prédateurs ---------- */
const FOOT=[[0,0]];
const beastAt=(x,y)=>G.beasts&&G.beasts.find(b=>b.x===x&&b.y===y);
function beastFits(b,x,y){for(const[dx,dy]of FOOT){const cx=x+dx,cy=y+dy;if(cx<1||cy<1||cx>=W-1||cy>=H-1)return false;const v=G.t[idx(cx,cy)];
  if(!canWalk(v,!!BEASTS[b.sp].swim)||(cx===G.px&&cy===G.py)||animalAt(cx,cy))return false;const o=beastAt(cx,cy);if(o&&o!==b)return false;}return true;}
const beastVisible=b=>!fog||FOOT.some(([dx,dy])=>vis[idx(b.x+dx,b.y+dy)]);
function spawnBeasts(){G.beasts=[];G.beastSeen={};G.packs={};let packId=0;
  const tryPut=(sp,x,y,pack)=>{const b={sp,x,y,hp:BEASTS[sp].pv,mp:Math.random(),hunt:0,dir:-1,pack};if(!beastFits(b,x,y))return false;G.beasts.push(b);return true;};
  for(let k=0,t=0;k<LIFE.crabos&&t<LIFE.crabos*400+500;t++){const x=rnd(2,W-4),y=rnd(2,H-4);if(Math.hypot(x-G.px,y-G.py)<SZ(20,6))continue;if(tryPut(0,x,y,-1))k++;}
  // cafars : bandes de 3 à 6 individus regroupés autour d'un point
  let left=LIFE.cafar||0;
  for(let t=0;left>0&&t<400;t++){const cx=rnd(3,W-4),cy=rnd(3,H-4);if(Math.hypot(cx-G.px,cy-G.py)<SZ(20,6))continue;
    let n=Math.min(left,rnd(3,6));if(left-n>0&&left-n<3)n=left<=6?left:n-(3-(left-n));let put=0;
    for(let u=0;u<60&&put<n;u++){if(tryPut(1,cx+rnd(-2,2),cy+rnd(-2,2),packId))put++;}
    if(put){left-=put;packId++;}}}
function robotDist(swim){const d=new Int16Array(W*H).fill(-1),q=[idx(G.px,G.py)];d[q[0]]=0;
  for(let k=0;k<q.length;k++){const c=q[k],x=c%W,y=(c/W)|0;for(const[dx,dy]of DIRS){const a=x+dx,b=y+dy;if(a<1||b<1||a>=W-1||b>=H-1)continue;const j=idx(a,b),v=G.t[j];if(d[j]>=0||!canWalk(v,swim))continue;d[j]=d[c]+1;q.push(j);}}return d;}
const footDist=(x,y,d)=>Math.min(...FOOT.map(([dx,dy])=>{const v=d[idx(x+dx,y+dy)];return v<0?9999:v;}));
const nearRobot=b=>canHit(b);
// Chance de toucher = précision − esquive, bornée entre 5 et 95 %.
// Terrain de la cible : eau (peu profonde ou profonde) −20 d'esquive, herbes hautes +10 (caché).
const terrMod=(x,y)=>{const v=G.t[idx(x,y)];return v===DEEP||v===LIQ?-20:v===GRASS?10:0;};
const robotEsq=()=>G.st.esq+terrMod(G.px,G.py);
const hitChance=(pre,esq)=>Math.max(5,Math.min(95,pre-esq));
const roll=ch=>Math.random()*100<ch;
const chanceCol=ch=>ch>=70?'var(--c1)':ch>=40?'var(--c3)':'var(--life)';
function hurtRobot(b,sp){sp=sp||BEASTS[b.sp];const le=sp.n.match(/^[aeiouyéèêîïôâ]/i)?'L’':'Le ';
  const ch=hitChance(sp.pre,robotEsq());
  if(!roll(ch)){addFx({kind:'lunge',beast:b,dx:Math.sign(G.px-b.x),dy:Math.sign(G.py-b.y),dur:200});addFx({kind:'num',x:G.px,y:G.py,txt:'0',col:'#8aa9a2',dur:750});
    SFX.whoosh();sayMore(`${le}${sp.n.toLowerCase()} attaque et rate (${ch} %).`);return;}
  addFx({kind:'lunge',beast:b,dx:Math.sign(G.px-b.x),dy:Math.sign(G.py-b.y),dur:200});
  addFx({kind:'shake',amp:5,dur:220});G.st.vie=Math.max(0,G.st.vie-sp.dmg);addFx({kind:'num',x:G.px,y:G.py,txt:'-'+sp.dmg,col:'#ff3b3b',dur:750});SFX.bite();sayMore(`${le}${sp.n.toLowerCase()} attaque : −${sp.dmg} vie.`,'warn');
  if(G.st.vie<=0){G.over={dead:true};}}
function beastsAct(){
  if(!G.beasts||!G.beasts.length||G.over)return;const distDry=robotDist(false),distWet=robotDist(true);let charged=null;const alarms=[];packTick();
  for(const b of G.beasts){if(G.over)break;const sp=BEASTS[b.sp];b.mp=Math.min(2,b.mp+sp.v/5);
    const d=Math.hypot(b.x-G.px,b.y-G.py),sees=d<=sp.d&&los(b.x,b.y,G.px,G.py);
    if(sees){if(!b.hunt&&sp.alarm)alarms.push(b);if(!b.hunt&&beastVisible(b))charged=charged||sp;b.hunt=8;if(G.px!==b.x)b.dir=Math.sign(G.px-b.x);}else if(b.hunt>0)b.hunt--;
    if(alarms.length&&alarms[alarms.length-1]===b)raiseAlarm(b);
    if(b.hunt>0&&nearRobot(b)){hurtRobot(b);continue;}
    while(b.mp>=1&&!G.over){b.mp-=1;
      if(b.hunt>0){
        if(nearRobot(b)){b.mp=Math.min(b.mp,.99);break;}
        chaseStep(b,sp.swim?distWet:distDry,(x,y)=>beastFits(b,x,y));}
      else if(sp.pack){packMove(b);}
      else if(Math.random()<.25){const[dx,dy]=DIRS[rnd(0,7)];if(beastFits(b,b.x+dx,b.y+dy)&&(!sp.pack||packOk(b,b.x+dx,b.y+dy))){b.x+=dx;b.y+=dy;if(dx)b.dir=dx;}}
      else b.mp=Math.min(b.mp,.99);}
  }
  if(charged){sayMore(`Le ${charged.n.toLowerCase()} vous a repéré et charge !`,'warn');SFX.roar();}
}
// Plus de réparation automatique : seule l'énergie se recharge à chaque tour
function regen(){if(G.over)return;G.st.energie=Math.min(G.st.energieMax,G.st.energie+G.st.power);}
// Coup de foreuse : consomme de l'énergie ; refusé si la réserve est insuffisante
function spend(){if(G.st.energie<G.st.cout){say(`Énergie insuffisante pour frapper (${Math.floor(G.st.energie)}/${G.st.cout}). Attendez qu’elle se recharge.`,'warn');SFX.blocked();render();return false;}G.st.energie-=G.st.cout;return true;}
const TRACK_LIFE=5;
// Bande : chaque cafar reste à PACK_R cases au plus du centre de son groupe, sinon il y revient.
// Hors chasse, la bande voyage vers un point accessible tiré au hasard, s'y arrête PACK_PAUSE tours, puis repart.
const PACK_R=4,PACK_PAUSE=50;
function packBfs(tx,ty){const d=new Int16Array(W*H).fill(-1),q=[idx(tx,ty)];d[q[0]]=0;
  for(let k=0;k<q.length;k++){const c=q[k],x=c%W,y=(c/W)|0;for(const[dx,dy]of DIRS){const a=x+dx,b=y+dy;if(a<1||b<1||a>=W-1||b>=H-1)continue;const j=idx(a,b),v=G.t[j];if(d[j]>=0||!canWalk(v,false))continue;d[j]=d[c]+1;q.push(j);}}return d;}
function packTarget(P,cx,cy){for(let t=0;t<40;t++){const x=rnd(2,W-3),y=rnd(2,H-3),v=G.t[idx(x,y)];if(!canWalk(v,false)||Math.hypot(x-cx,y-cy)<10)continue;
    const d=packBfs(x,y);if(d[idx(Math.round(cx),Math.round(cy))]<0&&d[idx(Math.floor(cx),Math.floor(cy))]<0)continue;P.tx=x;P.ty=y;P.dist=d;P.pause=0;return;}
  P.pause=PACK_PAUSE;}
// Une fois par tour : chaque bande hors chasse avance vers sa destination ou fait sa pause
function packTick(){G.packs=G.packs||{};const groups={};
  for(const b of G.beasts)if(b.pack>=0)(groups[b.pack]=groups[b.pack]||[]).push(b);
  for(const id in groups){const m=groups[id],P=G.packs[id]=G.packs[id]||{pause:rnd(0,PACK_PAUSE)};if(m.some(b=>b.hunt>0))continue;
    const [cx,cy]=packCenter(m);
    if(P.pause>0){if(--P.pause===0)packTarget(P,cx,cy);continue;}
    if(!P.dist||P.tx==null){packTarget(P,cx,cy);continue;}
    if(Math.max(Math.abs(cx-P.tx),Math.abs(cy-P.ty))<=2){P.pause=PACK_PAUSE;P.dist=null;}}}
function packMove(b){const P=G.packs&&G.packs[b.pack];
  if(packStep(b))return;                                   // trop loin des siens : il revient
  if(P&&P.dist&&!P.pause){let best=null,bv=P.dist[idx(b.x,b.y)];if(bv<0)bv=9999;   // voyage : il avance vers la destination
    for(const[dx,dy]of DIRS){const nx=b.x+dx,ny=b.y+dy;if(!beastFits(b,nx,ny)||!packOk(b,nx,ny))continue;const v=P.dist[idx(nx,ny)];if(v>=0&&v<bv){bv=v;best=[nx,ny,dx];}}
    if(best){b.x=best[0];b.y=best[1];if(best[2])b.dir=best[2];return;}}
  if(Math.random()<.25){const[dx,dy]=DIRS[rnd(0,7)];if(beastFits(b,b.x+dx,b.y+dy)&&packOk(b,b.x+dx,b.y+dy)){b.x+=dx;b.y+=dy;if(dx)b.dir=dx;}}   // pause : il piétine sur place
  else b.mp=Math.min(b.mp,.99);}
const mates=b=>G.beasts.filter(o=>o!==b&&o.pack===b.pack&&o.pack>=0);
const packCenter=m=>[m.reduce((s,o)=>s+o.x,0)/m.length,m.reduce((s,o)=>s+o.y,0)/m.length];
function packOk(b,x,y){const m=mates(b);if(!m.length)return true;const [cx,cy]=packCenter(m);return Math.max(Math.abs(x-cx),Math.abs(y-cy))<=PACK_R;}
function packStep(b){const m=mates(b);if(!m.length)return false;const [cx,cy]=packCenter(m);if(Math.max(Math.abs(b.x-cx),Math.abs(b.y-cy))<=PACK_R)return false;
  let best=null,bd=Math.hypot(b.x-cx,b.y-cy);
  for(const[dx,dy]of DIRS){const nx=b.x+dx,ny=b.y+dy;if(!beastFits(b,nx,ny))continue;const d=Math.hypot(nx-cx,ny-cy);if(d<bd){bd=d;best=[nx,ny,dx];}}
  if(best){b.x=best[0];b.y=best[1];if(best[2])b.dir=best[2];return true;}return false;}
// Cri d'alerte : tous les ennemis à 5 cases ou moins du cafar se mettent en chasse
const ALARM_R=5;
function raiseAlarm(b){const sp=BEASTS[b.sp];let n=0;
  for(const o of G.beasts)if(o!==b&&Math.max(Math.abs(o.x-b.x),Math.abs(o.y-b.y))<=ALARM_R){if(!o.hunt)n++;o.hunt=8;}
  for(const a of (G.animals||[]))if(Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y))<=ALARM_R){if(!a.aware)n++;a.aware=10;}
  if(beastVisible(b)||n){addFx({kind:'num',x:b.x,y:b.y,txt:'!',col:PAL['3'],dur:900});SFX.screech();
    sayMore(`Un cafar pousse un cri d’alerte${n?` : ${n} ennemi${n>1?'s':''} alerté${n>1?'s':''}`:''} !`,'warn');}}
function bleed(x,y){G.blood=G.blood||{};G.blood[idx(x,y)]=rnd(0,1);}

