/* ---------- Faune ---------- */
const animalAt=(x,y)=>G.animals&&G.animals.find(a=>a.x===x&&a.y===y);
// Eau : depuis le 15 novembre 2026, TOUTES les créatures y entrent (avant : seuls les crabos). Les nageurs (swim) gardent leur avantage :
// eux seuls ne sont pas ralentis par l'eau (slowOf). L'argument swim encore passé à canWalk et distFrom est sans effet, il est ignoré.
/* Eau : trois rapports à l'eau selon l'espèce (16 novembre 2026).
   - `nage` (crabos, brochon) : elles y vont naturellement, en chasse comme en errance ;
   - `sec` (cafar) : elles n'y mettent jamais une patte, même pour poursuivre ;
   - les autres (insectoïde, mastok) : elles l'évitent, mais la traversent pour poursuivre la foreuse.
   Une créature déjà dans l'eau peut toujours en sortir, sinon elle y resterait coincée en cessant la poursuite.
   `swim` reste à part : il ne dit pas qui entre dans l'eau, mais qui n'y est pas ralenti (le crabos seul). */
const isWater=v=>v===LIQ||v===DEEP,canWalk=(v,mouille)=>!blocks(v)&&(mouille||!isWater(v));
const mouilleOk=(sp,o)=>!!sp.nage||(!sp.sec&&(o.hunt>0||!!o.aware||!!o.enraged))||isWater(G.t[idx(o.x,o.y)]);
const canHit=o=>Math.max(Math.abs(o.x-G.px),Math.abs(o.y-G.py))<=1&&diagOk(o.x,o.y,Math.sign(G.px-o.x),Math.sign(G.py-o.y));   // pas d'attaque à travers un coin
const animalOk=(x,y,m)=>{if(x<1||y<1||x>=W-1||y>=H-1)return false;const v=G.t[idx(x,y)];return canWalk(v,m)&&!(G.lz&&G.lz[idx(x,y)])&&!(x===G.px&&y===G.py)&&!animalAt(x,y)&&!beastAt(x,y);};   // les insectoïdes n'entrent pas dans le champ d'un laser
/* Deux façons de peupler la carte (19 novembre 2026).
   - spawnGroupes : le jeu. Un budget de menace achète des groupes réglés dans Lab → Groupes (voir 06b-groupes).
   - spawnAnimals / spawnBeasts : effectifs par espèce lus dans LIFE. Ne sert plus qu'au banc de combat et aux mesures. */
const newPuce=(x,y,gr)=>({sp:0,x,y,hp:pvDe(SPECIES[0]),mp:Math.random(),flee:0,dir:Math.random()<.5?1:-1,gr});
const newBeast=(sp,x,y,pack,gr)=>({sp,x,y,hp:pvDe(BEASTS[sp]),mp:Math.random(),hunt:0,dir:-1,pack,gr});
const puceSol=(x,y)=>{const v=G.t[idx(x,y)];return (v===GROUND||v===GRASS||v===FLAT)&&!animalAt(x,y)&&!beastAt(x,y)&&!(x===G.px&&y===G.py);};
function spawnAnimals(){G.animals=[];G.fauna=[];G.pool=[0];const n=LIFE.insectoide||0;
  for(let k=0,tries=0;k<n&&tries<n*300+500;tries++){const x=rnd(2,W-3),y=rnd(2,H-3);
    if(!puceSol(x,y)||Math.hypot(x-G.px,y-G.py)<SZ(10,4))continue;G.animals.push(newPuce(x,y,-1));k++;}
}
// Petit animal (la Puce) : une fois le robot repéré, il le suit à 2 ou 3 cases (recule au contact,
// se rapproche au-delà de 3). Quand un crabos chasse le robot à proximité, il passe à l'attaque.
const KEEP_MIN=1,KEEP_MAX=3;
const cheb=(a,x,y)=>Math.max(Math.abs(a.x-x),Math.abs(a.y-y));
function stepToward(a,dist,fits){chaseStep(a,dist,fits||animalOk);}
// Distance à la foreuse en traitant les autres créatures comme des obstacles (soi-même exclu)
function robotDistAvoid(self,tx=G.px,ty=G.py,mouille){const occ=new Uint8Array(W*H);
  for(const o of [...(G.beasts||[]),...(G.animals||[])])if(o!==self)occ[idx(o.x,o.y)]=1;
  const d=new Int16Array(W*H).fill(-1),q=[idx(tx,ty)];d[q[0]]=0;
  for(let k=0;k<q.length;k++){const c=q[k],x=c%W,y=(c/W)|0;for(const[dx,dy]of DIRS){const a=x+dx,b=y+dy;if(a<1||b<1||a>=W-1||b>=H-1)continue;
    const j=idx(a,b),v=G.t[j];if(d[j]>=0||!diagOk(x,y,dx,dy)||!canWalk(v,mouille)||occ[j])continue;d[j]=d[c]+1;q.push(j);}}
  return d;}
// Poursuite commune à tous les ennemis : avance par le plus court chemin ; si un autre ennemi bloque le passage,
// contourne l'obstacle (détour de 10 cases au plus) vers une case libre autour de la foreuse, pour attaquer à plusieurs
const DETOUR_MAX=10;
function chaseStep(o,dist,fits,tx=G.px,ty=G.py){const h=dist[idx(o.x,o.y)],cur=h<0?9999:h;let best=null,bv=cur;
  for(const[dx,dy]of DIRS){const nx=o.x+dx,ny=o.y+dy;if(!fits(nx,ny)||!diagOk(o.x,o.y,dx,dy))continue;const v=dist[idx(nx,ny)];if(v>=0&&v<bv){bv=v;best=[nx,ny,dx];}}
  if(!best&&cur>1){const d2=robotDistAvoid(o,tx,ty,mouilleOk(G.beasts&&G.beasts.includes(o)?BEASTS[o.sp]:SPECIES[o.sp],o)),h2=d2[idx(o.x,o.y)];
    if(h2>0&&h2<=cur+DETOUR_MAX){let b2=h2;
      for(const[dx,dy]of DIRS){const nx=o.x+dx,ny=o.y+dy;if(!fits(nx,ny)||!diagOk(o.x,o.y,dx,dy))continue;const v=d2[idx(nx,ny)];if(v>=0&&v<b2){b2=v;best=[nx,ny,dx];}}}}
  if(best){o.x=best[0];o.y=best[1];if(best[2])o.dir=best[2]>0?1:-1;return true;}return false;}
/* Mémoire des ennemis (10 novembre 2026) : un ennemi qui voit la foreuse retient sa position (o.mem) ; quand il ne la voit
   plus, il se dirige vers cette dernière position connue — celle de son groupe pour une bande de cafars (partagée entre
   membres). Arrivé, il fouille la zone pendant SEARCH_T battements, puis oublie et reprend son errance.
   Plus aucune connaissance de la position réelle de la foreuse sans la voir. */
/* Fouille (18 novembre 2026) : il ratisse la zone. Il se choisit un point accessible à une dizaine de cases du dernier
   endroit où il a vu la foreuse, s'y rend par le plus court chemin, puis en choisit un autre, pendant SEARCH_T
   battements. Les points sont toujours tirés autour de ce dernier point connu, jamais autour de lui : il tourne donc
   dans la zone au lieu de dériver. Avant le 18 novembre, il faisait 4 battements de pas au hasard et s'éloignait. */
const SEARCH_T=20,SEARCH_R=10,SEARCH_VAR=3;
/* Perte de trace (13 novembre 2026, les 3 % de Brogue) : une bête qui vous chasse hors du rayon de discrétion,
   mais encore dans la bande de chasse (HUNT_MULT ×), a LOSE_TRACK par tour de vous perdre. Elle garde alors sa
   dernière position connue et s'y rend, mais ne vous suit plus de loin : il lui faut vous remarquer de nouveau
   (NOTICE) à l'intérieur du rayon. Dans le rayon, elle ne vous perd jamais. */
function voitForeuse(o,chasse){
  if(G.eff&&G.eff.fum>0)return false;                                    // fumigène : personne ne voit la foreuse
  const d=Math.hypot(o.x-G.px,o.y-G.py);
  const bruit=lastAct==='dig';                                          // briser une paroi s'entend à travers les parois
  if(!bruit&&!los(o.x,o.y,G.px,G.py))return false;
  if(chasse&&!o.lost){
    if(!los(o.x,o.y,G.px,G.py))return false;
    if(d>G.stealth*HUNT_MULT)return false;
    if(d>G.stealth&&Math.random()<LOSE_TRACK){o.lost=1;return false;}   // perd la trace
    return true;}
  if(d<=G.stealth&&Math.random()<NOTICE){o.lost=0;return true;}         // vous remarque (de nouveau)
  return false;}
// Petit « ! » au-dessus d'un ennemi qui vient de repérer la foreuse (15 novembre 2026) : seulement s'il est en vue
function alerte(o){if(vis[idx(o.x,o.y)])addFx({kind:'alerte',o,dur:900});}
function spot(o){o.mem=[G.px,G.py];o.search=0;o.stuck=0;o.lost=0;o.sg=null;const dx=Math.sign(G.px-o.x);if(dx)o.dir=dx;}
/* Chance qu'un ennemi calme vous remarque ce tour-ci (affichée au survol) : plate dans la portée de
   discrétion et en ligne de vue, nulle au-delà. Voir la portée de discrétion dans 09. */
function detectChance(o){return (Math.hypot(o.x-G.px,o.y-G.py)<=(G.stealth||STEALTH_BASE)&&(lastAct==='dig'||los(o.x,o.y,G.px,G.py)))?Math.round(NOTICE*100):0;}
function forget(o){o.mem=null;o.search=0;o.stuck=0;o.lost=0;o.sg=null;}
// un pas vers la dernière position connue ; renvoie false quand il faut passer à la fouille
function seekStep(o,fits,DC,m){const [mx,my]=o.mem,k=mx+','+my+','+(m?1:0),d=DC[k]||(DC[k]=distFrom(mx,my,m)),h=d[idx(o.x,o.y)];
  if(h<0){forget(o);return false;}if(h<=(G.t[idx(mx,my)]===DOOR?0:1)){o.search=SEARCH_T;return false;}   // la foreuse a disparu derrière une porte : il vient jusque dans l'embrasure, ce qui l'ouvre et lui rend la vue
  if(chaseStep(o,d,fits,mx,my)){o.stuck=0;return true;}if(++o.stuck>2)o.search=SEARCH_T;return false;}
// un point à fouiller : accessible depuis le dernier point connu, à SEARCH_R cases environ de lui, et pas là où il est déjà
function searchGoal(o,fits,DC,m){const [mx,my]=o.mem,k=mx+','+my+','+(m?1:0),d=DC[k]||(DC[k]=distFrom(mx,my,m));
  for(let t=0;t<20;t++){const a=Math.random()*Math.PI*2,r=SEARCH_R+rnd(-SEARCH_VAR,SEARCH_VAR);
    const x=Math.round(mx+Math.cos(a)*r),y=Math.round(my+Math.sin(a)*r);
    if(x<1||y<1||x>=W-1||y>=H-1||Math.abs(x-o.x)+Math.abs(y-o.y)<2)continue;
    const h=d[idx(x,y)];if(h<0||h>SEARCH_R*2||!fits(x,y))continue;
    return [x,y];}
  return null;}
function searchStep(o,fits,DC,m){
  if(o.sg&&o.x===o.sg[0]&&o.y===o.sg[1])o.sg=null;                                   // arrivé : il lui en faut un autre
  if(!o.sg){o.sg=searchGoal(o,fits,DC,m);o.sstuck=0;}
  if(o.sg){const [gx,gy]=o.sg,k=gx+','+gy+','+(m?1:0),d=DC[k]||(DC[k]=distFrom(gx,gy,m));
    if(chaseStep(o,d,fits,gx,gy)){o.sstuck=0;return;}
    if(++o.sstuck>2)o.sg=null;}                                                      // bloqué : il change de point
  if(Math.random()<.6){const [dx,dy]=DIRS[rnd(0,7)];if(fits(o.x+dx,o.y+dy)&&diagOk(o.x,o.y,dx,dy)){o.x+=dx;o.y+=dy;if(dx)o.dir=dx;}}}
function stepAway(a,fits){const cur=(a.x-G.px)**2+(a.y-G.py)**2;let best=null,bd=cur;const ok=fits||animalOk;
  for(const[dx,dy]of [...DIRS].sort(()=>Math.random()-.5)){const nx=a.x+dx,ny=a.y+dy;if(!ok(nx,ny)||!diagOk(a.x,a.y,dx,dy))continue;const nd=(nx-G.px)**2+(ny-G.py)**2;if(nd>bd){bd=nd;best=[nx,ny,dx];}}
  if(best){a.x=best[0];a.y=best[1];if(best[2])a.dir=best[2]>0?1:-1;}}
// Le combat est engagé (15 novembre 2026) : la foreuse vient d'être attaquée ou d'attaquer une créature, que le coup porte ou non.
// Tous les insectoïdes qui la suivent (ceux qui l'ont repérée, en vue ou sur sa trace) passent à l'attaque, et ne reculeront plus.
function engage(){for(const a of (G.animals||[]))if(a.aware)a.enraged=true;}
/* Fumigène : un nuage de cases, et non plus un simple effet (16 novembre 2026).
   À la pose, une galette ovale autour de la foreuse : 7 cases de large et de haut, 5 en diagonale (dx² + dy² ≤ 10, 37 cases).
   Chaque case vit FUM_VIE battements, tirés un par un ; à chaque battement le nuage gagne une à trois cases voisines, au hasard,
   avec une vie plus courte — il s'étend donc de travers, puis s'efface case par case. Une case de fumée est opaque (voir `opaque`). */
const FUM_R2=10,FUM_VIE=[15,25],FUM_MAX=90;
function fumPose(){const F=G.fum=G.fum||{};
  for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const d2=dx*dx+dy*dy;if(d2>FUM_R2)continue;
    const x=G.px+dx,y=G.py+dy;if(x<1||y<1||x>=W-1||y>=H-1)continue;const i=idx(x,y);if(blocks(G.t[i])&&G.t[i]!==CHASM)continue;   // la fumée passe au-dessus des gouffres
    const v=rnd(FUM_VIE[0],FUM_VIE[1]);
    F[i]={v:F[i]?Math.max(F[i].v,v):v,k:d2<=2?rnd(0,1):2+rnd(0,3)};}   // cœur : nuage plein ou texturé ; pourtour : les quatre bords
  for(const b of G.beasts||[])if(b.hunt){b.hunt=0;forget(b);}
  for(const a of G.animals||[]){a.aware=0;a.enraged=false;forget(a);}}
function fumTick(){const F=G.fum;if(!F)return;let ks=Object.keys(F);if(!ks.length)return;
  if(ks.length<FUM_MAX&&Math.random()<.7){let n=rnd(1,3);
    for(let t=0;t<14&&n>0;t++){const i=+ks[rnd(0,ks.length-1)],c=F[i];if(c.v<6)continue;
      const [dx,dy]=DIRS[rnd(0,7)],x=(i%W)+dx,y=((i/W)|0)+dy;
      if(x<1||y<1||x>=W-1||y>=H-1)continue;const j=idx(x,y);
      if(F[j]||(blocks(G.t[j])&&G.t[j]!==CHASM))continue;
      F[j]={v:Math.max(4,c.v-rnd(2,5)),k:2+rnd(0,3)};n--;}}
  // les tuiles changent d'un battement à l'autre : une case bien entourée se densifie, les bords tournent — le nuage a l'air de vivre
  for(const k in F){const i=+k,x=i%W,y=(i/W)|0;let n=0;
    for(const [dx,dy] of DIRS)if(F[idx(x+dx,y+dy)])n++;
    if(Math.random()<.55)F[k].k=n>=8?rnd(0,1):2+rnd(0,3);}
  for(const k in F)if(--F[k].v<=0)delete F[k];
  if(!Object.keys(F).length)sayMore('La fumée se dissipe.');}
/* ---------- Styles de patrouille (19 novembre 2026) ----------
   Le style appartient au groupe (Lab → Groupes) et ne joue que tant qu'aucun membre n'a repéré la foreuse ; dès que la
   chasse et la fouille sont finies, le groupe reprend sa patrouille là où elle en était, donc il rentre chez lui.
   - errance    : un pas tous les battements ou tous les deux, jamais en arrière (errStep).
   - voyage     : la bande traverse la carte vers un point éloigné, s'y arrête, repart (packTick, plus bas).
   - ronde      : une boucle de 3 ou 4 points fixes autour du point de départ, toujours dans le même ordre, courte halte à chacun.
   - territoire : le groupe tourne dans un rayon de 6 cases autour de son point de départ, avec de longues haltes.
   - sentinelle : 2 ou 3 postes ; le groupe reste immobile à un poste 40 à 80 battements, puis rejoint le suivant.
   - affut      : immobile à son point de départ ; il y revient après une chasse.
   Chaque groupe posé a son état dans G.patr[id] : pts (les points), k (le point visé), pause, age. Une créature connaît
   son groupe par o.gi. En patrouille on marche : un pas par battement au plus, quelle que soit la vitesse de l'espèce. */
const PAT_CIBLE={ronde:1,territoire:1,sentinelle:1,affut:1},PAT_BLOC=8;let PAT_BT=0;
let PATD={};
function patBfs(tx,ty,eau){const d=new Int16Array(W*H).fill(-1),q=[idx(tx,ty)];d[q[0]]=0;
  for(let k=0;k<q.length;k++){const c=q[k],x=c%W,y=(c/W)|0;for(const[dx,dy]of DIRS){const a=x+dx,b=y+dy;if(a<1||b<1||a>=W-1||b>=H-1)continue;
    const j=idx(a,b),v=G.t[j];if(d[j]>=0||!diagOk(x,y,dx,dy)||(eau?!isWater(v):!canWalk(v,false))||(G.lz&&G.lz[j]))continue;d[j]=d[c]+1;q.push(j);}}return d;}
const patD=P=>{const k=P.tx+','+P.ty+','+P.eau;return PATD[k]||(PATD[k]=patBfs(P.tx,P.ty,P.eau));};
// n points accessibles depuis le point de départ, entre a et b cases de lui, écartés les uns des autres, rangés en boucle
function patPoints(P,n,a,b){const d=patBfs(P.hx,P.hy,P.eau),pts=[];
  for(let t=0;t<400&&pts.length<n;t++){const an=Math.random()*Math.PI*2,r=a+Math.random()*(b-a),x=Math.round(P.hx+Math.cos(an)*r),y=Math.round(P.hy+Math.sin(an)*r);
    if(x<2||y<2||x>W-3||y>H-3)continue;const h=d[idx(x,y)];if(h<Math.min(a,2)||h>b*2.5||G.t[idx(x,y)]===DOOR)continue;
    if(pts.some(p=>Math.hypot(p[0]-x,p[1]-y)<Math.max(3,a*.7)))continue;pts.push([x,y]);}
  return pts.sort((p,q)=>Math.atan2(p[1]-P.hy,p[0]-P.hx)-Math.atan2(q[1]-P.hy,q[0]-P.hx));}
// point à garder le plus proche (style « garde ») : le site, une porte verrouillée, une grille, un fabricateur, une station, une porte
// d'entrée de bâtiment. On renvoie une case praticable voisine, accessible depuis le départ du groupe ; à défaut, le départ lui-même.
function patInteret(hx,hy){const c=[];for(const s of G.sites||[])c.push([s.x,s.y,0]);
  for(let i=0;i<W*H;i++){const v=G.t[i];if(v===LOCK||v===GRILLE||v===FABRIC||v===STATION)c.push([i%W,(i/W)|0,2]);}
  for(const b of G.batis||[])for(const e of b.entrees||[])c.push([e[0],e[1],6]);
  const d=patBfs(hx,hy,0);let best=null,bv=1e9;
  for(const [x,y,malus] of c){const dd=Math.hypot(x-hx,y-hy)+malus;if(dd>18||dd>=bv)continue;
    for(const [dx,dy] of DIRS){const a=x+dx,b=y+dy;if(a<1||b<1||a>=W-1||b>=H-1)continue;const h=d[idx(a,b)];if(h>=0&&h<40&&G.t[idx(a,b)]!==DOOR){best=[a,b];bv=dd;break;}}}
  return best||[hx,hy];}
function patInit(g,id,mb){const o=mb[0],P={pat:g.pat,hx:o.x,hy:o.y,k:0,pause:0,age:0,sp:mb.length<=1?0:mb.length<=4?1:2,
    eau:mb.every(m=>G.beasts.includes(m)&&BEASTS[m.sp].aqua)?1:0};
  if(g.pat==='ronde'){P.pts=patPoints(P,rnd(3,4),7,13);if(P.pts.length<2)P.pts=patPoints(P,3,3,7);}
  else if(g.pat==='sentinelle')P.pts=[[P.hx,P.hy],...patPoints(P,rnd(1,2),5,10)];
  else if(g.pat==='territoire')P.pts=patPoints(P,1,2,6);
  else if(g.pat==='affut')P.pts=[[P.hx,P.hy]];
  else if(g.pat==='navette'){P.pts=[[P.hx,P.hy],...patPoints(P,1,16,30)];if(P.pts.length<2)P.pts=[[P.hx,P.hy],...patPoints(P,1,8,16)];}   // va-et-vient entre deux points éloignés
  else if(g.pat==='garde'){const [gx,gy]=patInteret(P.hx,P.hy);P.hx=gx;P.hy=gy;P.pts=patPoints(P,1,1,3);}   // il se poste près d'un point à garder (site, porte verrouillée, machine) et n'en bouge guère
  if(P.pts&&!P.pts.length)P.pts=[[P.hx,P.hy]];
  if(P.pat==='sentinelle'||P.pat==='affut')P.pause=P.pat==='affut'?9999:rnd(20,60);   // déjà en poste à l'arrivée sur la carte
  G.patr[id]=P;}
// une fois par battement : chaque groupe en patrouille regarde s'il est arrivé, fait sa halte, choisit le point suivant
function patTick(){PATD={};PAT_BT++;if(!G.patr||G.over)return;const mb={};
  for(const o of [...(G.beasts||[]),...(G.animals||[])])if(o.gi!=null)(mb[o.gi]=mb[o.gi]||[]).push(o);
  for(const id in G.patr){const P=G.patr[id],m=mb[id];if(!m){delete G.patr[id];continue;}
    if(!P.pts||m.some(o=>o.hunt>0||o.aware))continue;
    [P.tx,P.ty]=P.pts[P.k];
    if(P.pause>0){if(--P.pause===0){
        if(P.pat==='territoire'||P.pat==='garde'){const n=patPoints(P,1,1,P.pat==='garde'?3:6);if(n.length)P.pts=n;}
        else if(P.pat==='affut')P.pause=9999;
        else P.k=(P.k+1)%P.pts.length;
        P.age=0;P.bh=null;P.bl=0;}
      continue;}
    const d=patD(P),h=Math.min(...m.map(o=>{const v=d[idx(o.x,o.y)];return v<0?9999:v;}));
    if(h<=P.sp||++P.age>90){P.pause=P.pat==='ronde'?rnd(3,6):P.pat==='navette'?rnd(2,5):P.pat==='territoire'?rnd(8,20):P.pat==='garde'?rnd(15,40):P.pat==='sentinelle'?rnd(40,80):9999;P.bh=null;P.bl=0;}
    /* Demi-tour, en dernier recours (20 novembre 2026) : un groupe qui n'avance plus vers son point depuis PAT_BLOC battements
       malgré l'échange de places (patSwap) — un ennemi en chasse ou une mine armée lui barre le passage — renonce et
       repart vers son point précédent (ronde, sentinelle) ou s'en choisit un autre (territoire). */
    else if(P.bh==null||h<P.bh){P.bh=h;P.bl=0;}
    else if(++P.bl>=PAT_BLOC){P.bl=0;P.bh=null;P.age=0;
      if(P.pat==='territoire'||P.pat==='garde'){const n=patPoints(P,1,1,P.pat==='garde'?3:6);if(n.length)P.pts=n;}
      else if(P.pts.length>1)P.k=(P.k-1+P.pts.length)%P.pts.length;}}}
/* Échange de places (20 novembre 2026, la règle de Brogue) : une créature en patrouille dont le chemin est barré par une
   créature calme d'un AUTRE groupe prend sa case, et l'autre prend la sienne. Deux groupes qui se croisent dans un passage
   étroit se traversent donc au lieu de se bloquer. Jamais avec un ennemi qui chasse ou qui a repéré la foreuse, ni avec une
   mine armée ; chaque créature ne change de place qu'une fois par battement ; chacune doit pouvoir tenir sur la case de
   l'autre (une torpille ne sort pas de l'eau). En chasse, rien ne change : les ennemis se gênent et se contournent. */
const terrOk=(o,x,y)=>{const sp=G.beasts.includes(o)?BEASTS[o.sp]:SPECIES[o.sp],v=G.t[idx(x,y)];return !(sp.aqua&&!isWater(v))&&canWalk(v,mouilleOk(sp,o));};
function patSwap(o,d){if(o.sw===PAT_BT)return false;let best=null,bv=d[idx(o.x,o.y)];
  for(const [dx,dy] of DIRS){const nx=o.x+dx,ny=o.y+dy;if(!diagOk(o.x,o.y,dx,dy))continue;const v=d[idx(nx,ny)];if(v<0||v>=bv)continue;
    const c=beastAt(nx,ny)||animalAt(nx,ny);if(!c||c.gi==null||c.gi===o.gi||c.hunt>0||c.aware||c.fuse>0||c.sw===PAT_BT)continue;
    if(!terrOk(o,nx,ny)||!terrOk(c,o.x,o.y))continue;bv=v;best=c;}
  if(!best)return false;const x=o.x,y=o.y;if(best.x!==x){o.dir=Math.sign(best.x-x);best.dir=-o.dir;}
  o.x=best.x;o.y=best.y;best.x=x;best.y=y;o.sw=best.sw=PAT_BT;return true;}
// le pas de patrouille d'une créature calme ; renvoie false si son groupe n'a pas de point à rejoindre (errance, voyage)
function patMove(o,fits){const P=G.patr&&G.patr[o.gi];if(!P||!P.pts||P.tx==null)return false;
  const d=patD(P),h=d[idx(o.x,o.y)];if(h<0)return false;
  if(h>P.sp){const libre=DIRS.some(([dx,dy])=>{const v=d[idx(o.x+dx,o.y+dy)];return v>=0&&v<h&&fits(o.x+dx,o.y+dy)&&diagOk(o.x,o.y,dx,dy);});
    if(libre||!patSwap(o,d))chaseStep(o,d,fits,P.tx,P.ty);}   // un pas libre, sinon l'échange de places, sinon le détour
  else if((P.pat==='territoire'||P.pat==='garde')&&Math.random()<(P.pat==='garde'?.06:.15)){const [dx,dy]=DIRS[rnd(0,7)],v=d[idx(o.x+dx,o.y+dy)];if(v>=0&&v<=P.sp+1&&fits(o.x+dx,o.y+dy)&&diagOk(o.x,o.y,dx,dy)){o.x+=dx;o.y+=dy;if(dx)o.dir=dx;}}
  o.mp=Math.min(o.mp,.99);return true;}
/* Errance (règle du 20 novembre 2026) : un pas tous les battements ou tous les deux (une fois sur deux, la créature marque
   un temps après son pas). Elle ne repart jamais d'où elle vient, ni par les deux diagonales voisines : il lui reste tout
   droit, les deux diagonales de devant et les deux virages à 90°. Dans un cul-de-sac seulement, elle fait demi-tour.
   o.lx, o.ly : son dernier pas ; o.ew : battements d'attente avant le prochain. */
function errStep(o,fits){o.mp=Math.min(o.mp,.99);if(o.ew>0){o.ew--;return;}
  const lx=o.lx||0,ly=o.ly||0,libres=DIRS.filter(([dx,dy])=>fits(o.x+dx,o.y+dy)&&diagOk(o.x,o.y,dx,dy));if(!libres.length)return;
  const devant=libres.filter(([dx,dy])=>dx*lx+dy*ly>=0),c=devant.length?devant:libres,[dx,dy]=c[rnd(0,c.length-1)];
  o.x+=dx;o.y+=dy;o.lx=dx;o.ly=dy;if(dx)o.dir=dx;o.ew=rnd(0,1);}
const patDe=o=>{const P=G.patr&&G.patr[o.gi];return P?P.pat:null;};
function animalsAct(){
  turnStealth();
  if(G&&!G.over)patTick();
  if(!G.animals||G.over)return;let fled=null,swarm=null;const distSec=robotDist(false),distEau=robotDist(true),DC={};
  for(const a of G.animals){if(G.over)break;const sp=SPECIES[a.sp];a.mp=Math.min(2,a.mp+sp.v/5/slowOf(G.t[idx(a.x,a.y)],sp.swim));
    const mA=mouilleOk(sp,a),okA=(x,y)=>animalOk(x,y,mA),dist=mA?distEau:distSec;
    const d=Math.hypot(a.x-G.px,a.y-G.py),sees=voitForeuse(a,!!a.aware);
    if(sees){if(!a.aware)alerte(a);a.aware=1;spot(a);}
    else if(a.aware&&a.search>0&&--a.search===0){a.aware=0;a.enraged=false;forget(a);}   // fouille terminée : il oublie
    else if(a.aware&&!a.mem)a.aware=0;
    const prev=a.mode,c=cheb(a,G.px,G.py);
    // l'insectoïde garde ses distances et recule au contact tant que le combat n'est pas engagé (voir engage) ;
    // une fois passé à l'attaque (enraged), il ne recule plus jamais, jusqu'à ce qu'il oublie la foreuse
    a.mode=!a.aware?'':!sees?(a.search>0?'search':'seek'):a.enraged?'attack':c<=KEEP_MIN?'flee':c>KEEP_MAX?'follow':'hold';
    if(a.mode==='attack'&&prev!=='attack'&&vis[idx(a.x,a.y)])swarm=swarm||sp;
    if(a.mode==='flee'&&prev!=='flee'&&vis[idx(a.x,a.y)])fled=fled||sp;
    if(a.mode==='attack'&&canHit(a)){hurtRobot(a,sp);continue;}
    while(a.mp>=1&&!G.over){a.mp-=1;
      if(a.mode==='attack'){if(canHit(a)){a.mp=Math.min(a.mp,.99);break;}stepToward(a,dist,okA);}
      else if(a.mode==='flee')stepAway(a,okA);
      else if(a.mode==='follow')stepToward(a,dist,okA);
      else if(a.mode==='seek'){if(!seekStep(a,okA,DC,mA)){a.mode=a.search>0?'search':'';break;}}
      else if(a.mode==='search')searchStep(a,okA,DC,mA);
      else if(a.mode===''&&patMove(a,okA))break;                                          // calme : la patrouille de son groupe
      else if(a.mode===''){errStep(a,okA);break;}                                         // calme, sans point à rejoindre : errance
      else if(Math.random()<(a.mode==='hold'?.15:.3)){const [dx,dy]=DIRS[rnd(0,7)];const nx=a.x+dx,ny=a.y+dy;
        if(okA(nx,ny)&&diagOk(a.x,a.y,dx,dy)&&(a.mode!=='hold'||cheb({x:nx,y:ny},G.px,G.py)>KEEP_MIN)){a.x=nx;a.y=ny;if(dx)a.dir=dx;}}
      else a.mp=Math.min(a.mp,.99);}
  }
  if(swarm){sayMore(`${LesNoms(swarm)} passent à l’attaque !`,'warn');SFX.chirp();}
  else if(fled){sayMore(`${UnNom(fled)} recule.`);SFX.chirp();}
}

/* ---------- Prédateurs ---------- */
const FOOT=[[0,0]];
const beastAt=(x,y)=>G.beasts&&G.beasts.find(b=>b.x===x&&b.y===y);
function beastFits(b,x,y){const spB=BEASTS[b.sp],mB=mouilleOk(spB,b);
  for(const[dx,dy]of FOOT){const cx=x+dx,cy=y+dy;if(cx<1||cy<1||cx>=W-1||cy>=H-1)return false;const v=G.t[idx(cx,cy)];
  if(spB.aqua&&!isWater(v))return false;   // le brochon ne quitte jamais l'eau
  if(!(b.hunt>0)&&G.lz&&G.lz[idx(cx,cy)])return false;   // calme, il n'entre pas dans le champ d'un laser ; en chasse, il fonce (21 novembre 2026)
  if(!(spB.vol&&v===CHASM)&&!canWalk(v,mB)||(cx===G.px&&cy===G.py)||animalAt(cx,cy))return false;const o=beastAt(cx,cy);if(o&&o!==b)return false;}return true;}
const beastCache=b=>!!BEASTS[b.sp].cache&&G.t[idx(b.x,b.y)]===DEEP;   // le brochon en eau profonde : invisible, même à côté
const beastVisible=b=>!beastCache(b)&&(!fog||FOOT.some(([dx,dy])=>vis[idx(b.x+dx,b.y+dy)]));
function spawnBeasts(){G.beasts=[];G.beastSeen={};G.packs={};let packId=0;
  const tryPut=(sp,x,y,pack)=>{const b=newBeast(sp,x,y,pack,-1);if(!beastFits(b,x,y))return false;G.beasts.push(b);return true;};
  BEASTS.forEach((sp,i)=>{let left=LIFE[sp.key]||0;
    if(sp.pack){const PACK_SIZES=[2,3,4,4];   // bandes de 2 à 4, jamais d'individu seul
      for(let t=0;left>0&&t<400;t++){const cx=rnd(3,W-4),cy=rnd(3,H-4);if(Math.hypot(cx-G.px,cy-G.py)<SZ(20,6))continue;
        let n=Math.min(left,PACK_SIZES[rnd(0,PACK_SIZES.length-1)]);if(left-n===1)n=left<=5?left:n-1;let put=0;
        for(let u=0;u<60&&put<n;u++){if(tryPut(i,cx+rnd(-2,2),cy+rnd(-2,2),packId))put++;}
        if(put===1&&left>1){G.beasts.pop();put=0;}
        if(put){left-=put;packId++;}}
      return;}
    for(let k=0,t=0;k<left&&t<left*400+500;t++){const x=rnd(2,W-3),y=rnd(2,H-3);if(Math.hypot(x-G.px,y-G.py)<SZ(20,6))continue;if(tryPut(i,x,y,-1))k++;}});}
/* Peuplement par groupes. Le budget (GROUPES.budget, donné pour la carte de référence 96 × 64 et rapporté à la surface)
   est dépensé groupe après groupe, tirés au hasard parmi les groupes actifs encore abordables. Un groupe est posé d'un
   bloc autour d'un point, loin de la foreuse ; s'il ne trouve pas sa place (pas d'eau pour des torpilles…), il est écarté
   après trois échecs. Chaque créature garde le rang de son groupe (gr) : il servira aux styles de patrouille. */
function poseGroupe(g,gi,id,cases){{const l=g.pats&&g.pats.length?g.pats:g.pat?[g.pat]:PATS.map(p=>p[0]);   // aucun style choisi : tous sont possibles
  g=Object.assign({},g,{pat:l[rnd(0,l.length-1)]});}   // plusieurs styles cochés : ce groupe-ci en tire un
  const esp=k=>k==='insectoide'?-1:BEASTS.findIndex(b=>b.key===k);
  const mb=[];for(const m of g.m){const s=esp(m.k);if(m.k!=='insectoide'&&s<0)continue;for(let n=rnd(Math.min(m.min,m.max),Math.max(m.min,m.max));n>0;n--)mb.push(s);}
  if(!mb.length)return 'vide';   // tous les effectifs tirés valent 0 : rien à poser, ni échec ni dépense
  const lieu=cases&&cases.length?lieuDe(cases[0]):null;
  for(let t=0;t<80;t++){let cx=rnd(3,W-4),cy=rnd(3,H-4);if(cases&&cases.length){const c=cases[rnd(0,cases.length-1)];cx=c%W;cy=(c/W)|0;if(cx<3||cy<3||cx>W-4||cy>H-4)continue;}   // le groupe naît dans son lieu
    if(Math.hypot(cx-G.px,cy-G.py)<SZ(20,6))continue;
    const posA=[],posB=[];let ok=true;
    for(const s of mb){let put=false;
      for(let u=0;u<50&&!put;u++){const r=u<6?1:u<25?2:3,x=cx+rnd(-r,r),y=cy+rnd(-r,r);if(x<2||y<2||x>W-3||y>H-3)continue;if(lieu&&u<30&&lieuDe(idx(x,y))!==lieu)continue;
        if(s<0){if(!puceSol(x,y))continue;const a=newPuce(x,y,gi);a.gi=id;G.animals.push(a);posA.push(a);put=true;}
        else{const sp=BEASTS[s],b=newBeast(s,x,y,(sp.pack||g.pat==='voyage')?id:-1,gi);b.gi=id;if(!beastFits(b,x,y))continue;G.beasts.push(b);posB.push(b);put=true;}}
      if(!put){ok=false;break;}}
    if(ok){patInit(g,id,[...posB,...posA]);return true;}
    G.animals=G.animals.filter(a=>!posA.includes(a));G.beasts=G.beasts.filter(b=>!posB.includes(b));}
  return false;}
let NIV_GEN=1;   // niveau de la descente en cours de génération (posé par newGame et niveauSuivant) : la menace monte avec lui
const lieuDe=i=>{const v=G.t[i];return G.tun&&G.tun[i]?'tunnel':(v===FLOOR||v===DOOR||(v===BRIDGE&&G.pb&&G.pb[i]))?'bati':'ext';};
function spawnGroupes(){G.animals=[];G.fauna=[];G.pool=[0];G.beasts=[];G.beastSeen={};G.packs={};G.patr={};
  const NV=nivDe(NIV_GEN),total=Math.round(NV.budget*W*H/(96*64));let id=0;const rate={},pose={};   // budget et groupes du niveau de profondeur (fenêtre LIFE)
  // cases praticables de chaque lieu, et part du budget qui lui revient : la répartition du niveau (fenêtre LIFE), ramenée à 100 sur les
  // lieux présents ; un lieu ne dépasse pas PART_PLAFOND fois sa part de surface, le surplus va aux autres à proportion de leur part
  const cases={ext:[],bati:[],tunnel:[]};for(let i=0;i<W*H;i++)if(canWalk(G.t[i],true))cases[lieuDe(i)].push(i);
  const tot=cases.ext.length+cases.bati.length+cases.tunnel.length||1,lieux={},bud={};let report=0,depense=0;
  {let libres=LIEUX.map(l=>l[0]).filter(l=>cases[l].length&&NV.part[l]>0),resteB=total;
   for(let t=0;t<3&&libres.length;t++){const sp=libres.reduce((a,l)=>a+NV.part[l],0),trop=libres.filter(l=>resteB*NV.part[l]/sp>total*PART_PLAFOND*cases[l].length/tot);
     if(!trop.length){for(const l of libres)bud[l]=resteB*NV.part[l]/sp;break;}
     for(const l of trop){bud[l]=total*PART_PLAFOND*cases[l].length/tot;resteB-=bud[l];}libres=libres.filter(l=>!trop.includes(l));}}
  for(const [l] of LIEUX.slice().sort((a,b)=>cases[b[0]].length-cases[a[0]].length)){const b=Math.round(bud[l]||0);let reste=b+report;lieux[l]={b,dep:0};
    if(!cases[l].length){report=reste;continue;}
    for(let t=0;t<300;t++){const ok=GROUPES.liste.map((g,i)=>[g,i]).filter(([g,i])=>g.on&&NV.gr.includes(g.n)&&g.m.length&&Math.max(1,g.cout)<=reste&&(rate[i+l]||0)<3&&(!g.lieux||!g.lieux.length||g.lieux.includes(l)));if(!ok.length)break;
      // tirage pondéré par la fréquence du groupe : − deux fois moins souvent, + deux fois plus
      const pds=ok.map(([g])=>[.5,1,2][g.f??1]);let tir=Math.random()*pds.reduce((a,b)=>a+b,0),ki=0;while(ki<ok.length-1&&(tir-=pds[ki])>0)ki++;
      const [g,gi]=ok[ki],r=poseGroupe(g,gi,id,cases[l]);
      if(r===true){const c=Math.max(1,g.cout);reste-=c;lieux[l].dep+=c;depense+=c;id++;pose[g.n]=(pose[g.n]||0)+1;}else if(r!=='vide')rate[gi+l]=(rate[gi+l]||0)+1;}
    report=Math.min(reste,4);}   // un petit reste passe au lieu suivant ; un gros reste (aucun groupe ne convient à ce lieu) est perdu
  G.menace={total,reste:total-depense,pose,lieux};}
function robotDist(m){return distFrom(G.px,G.py,m);}
// distance pour qui vole : l'eau et les gouffres se franchissent
function distFromVol(tx,ty){const d=new Int16Array(W*H).fill(-1),q=[idx(tx,ty)];d[q[0]]=0;
  for(let k=0;k<q.length;k++){const c=q[k],x=c%W,y=(c/W)|0;for(const[dx,dy]of DIRS){const a=x+dx,b=y+dy;if(a<1||b<1||a>=W-1||b>=H-1)continue;const j=idx(a,b),v=G.t[j];if(d[j]>=0||!diagOk(x,y,dx,dy)||(v!==CHASM&&blocks(v)))continue;d[j]=d[c]+1;q.push(j);}}return d;}
function distFrom(tx,ty,mouille){const d=new Int16Array(W*H).fill(-1),q=[idx(tx,ty)];d[q[0]]=0;
  for(let k=0;k<q.length;k++){const c=q[k],x=c%W,y=(c/W)|0;for(const[dx,dy]of DIRS){const a=x+dx,b=y+dy;if(a<1||b<1||a>=W-1||b>=H-1)continue;const j=idx(a,b),v=G.t[j];if(d[j]>=0||!diagOk(x,y,dx,dy)||!canWalk(v,mouille))continue;d[j]=d[c]+1;q.push(j);}}return d;}
const footDist=(x,y,d)=>Math.min(...FOOT.map(([dx,dy])=>{const v=d[idx(x+dx,y+dy)];return v<0?9999:v;}));
const nearRobot=b=>canHit(b);
// Chance de toucher = précision × 0,987^défense, bornée entre 5 et 95 % (modèle Brogue, 16 novembre 2026 ;
// précision − esquive avant). Chaque point de défense retire 1,3 % des coups ; 53 points les divisent par deux.
// Terrain de la cible : eau (peu profonde ou profonde) −20 de défense, herbes hautes +12 (caché).
const DEF_BASE=.987;
const terrMod=(x,y)=>{const v=G.t[idx(x,y)];return v===DEEP||v===LIQ?-20:v===GRASS?12:0;};
const hitChance=(pre,def)=>Math.max(5,Math.min(95,Math.round(pre*Math.pow(DEF_BASE,def))));
/* POW requis (16 novembre 2026) : chaque arme et chaque armure demande un POW (champ req de l'objet).
   POW de base 10 (échelle de la force de Brogue, 16 novembre 2026 au soir ; 1 avant).
   Arme : chaque point manquant multiplie précision et dégâts par 0,85 ; chaque point en trop, par 1,015.
   Armure : chaque point manquant retire 10 de défense ; chaque point en trop en ajoute 1.
   La recharge d'énergie vaut POW/10 par battement : 1 à POW 10, comme avant.
   Rien n'est écrit dans G.st : tout se recalcule à la lecture, donc gagner ou perdre du POW agit aussitôt. */
const POW_MANQUE=.85,POW_EXCES=1.015,POW_DEF_MANQUE=10,POW_DEF_EXCES=1,POW_BASE=10;
/* Dés de dégâts d'une arme (17 novembre 2026) : {n:nombre de dés, f:faces, p:bonus fixe}. La foreuse d'origine fait
   1d6+5, soit 6 à 11. Avant, les dégâts étaient une stat unique (DEG 10) étalée de ±30 %. La stat DEG reste, mais
   comme un bonus fixe ajouté au jet (0 au départ) : un futur objet qui donne « DEG +2 » marche sans rien changer ici. */
const DE_DEFAUT={n:1,f:6,p:5};
const armeDe=d=>(d&&d.de)||DE_DEFAUT;
const deTxt=d=>`${d.n}d${d.f}${d.p?(d.p>0?'+':'')+d.p:''}`;
const deTire=d=>{let s=d.p;for(let i=0;i<d.n;i++)s+=1+Math.floor(Math.random()*d.f);return s;};
const eqDe=slot=>{const o=(G.inv||[]).find(o=>o.eq&&ITEMS[o.k]&&ITEMS[o.k].slot===slot);return o?ITEMS[o.k]:null;};
const powEcart=(d,st)=>d&&d.req?st.power-d.req:0;
const armeFact=(st,d)=>{const e=powEcart(d,st);return e<0?Math.pow(POW_MANQUE,-e):Math.pow(POW_EXCES,e);};
const armureDef=(st,d)=>{const e=powEcart(d,st);return e<0?POW_DEF_MANQUE*e:POW_DEF_EXCES*e;};
// stats de combat de la foreuse telles qu'elles comptent ; st, arme, armure : pour simuler un autre équipement (fenêtre Équipement)
const robotPre=(st,d)=>{st=st||G.st;return Math.round(st.pre*armeFact(st,d===undefined?eqDe('arme'):d));};
const robotDegs=(st,d)=>{st=st||G.st;const a=d===undefined?eqDe('arme'):d,de=armeDe(a),k=armeFact(st,a),b=st.degats||0;
  return [Math.max(1,Math.round((de.n+de.p+b)*k)),Math.max(1,Math.round((de.n*de.f+de.p+b)*k))];};
const robotDeg=()=>{const a=eqDe('arme');return Math.max(1,Math.round((deTire(armeDe(a))+(G.st.degats||0))*armeFact(G.st,a)));};
const robotDefNu=(st,d)=>{st=st||G.st;return st.def+armureDef(st,d===undefined?eqDe('armure'):d);};
const robotDef=()=>robotDefNu()+terrMod(G.px,G.py);
const roll=ch=>Math.random()*100<ch;
const chanceCol=ch=>ch>=70?'var(--c1)':ch>=40?'var(--c3)':'var(--life)';
/* Attaque d'un ennemi sur la foreuse. o.sur : par surprise (touche toujours, critique). */
/* Articles (17 novembre 2026) : chaque espèce porte son genre (`fem`), au lieu de l'article figé d'avant, qui donnait
   « l'puce » et « le torpille ». Élision devant une voyelle, et pas de s au pluriel sur un nom qui finit déjà par s
   (le Relais). Nom toujours en minuscules dans les messages. */
const nomDe=sp=>sp.n.toLowerCase();
const leNom=sp=>{const n=nomDe(sp);return /^[aeiouyéèêîïôâ]/i.test(n)?'l’'+n:(sp.fem?'la ':'le ')+n;};
const LeNom=sp=>{const a=leNom(sp);return a[0].toUpperCase()+a.slice(1);};
const unNom=sp=>(sp.fem?'une ':'un ')+nomDe(sp);
const UnNom=sp=>{const a=unNom(sp);return a[0].toUpperCase()+a.slice(1);};
const LesNoms=sp=>{const n=nomDe(sp);return 'Les '+n+(/s$/.test(n)?'':'s');};
function hurtRobot(b,sp,o){sp=sp||BEASTS[b.sp];o=o||{};const le=LeNom(sp),nom='',verbe=o.laser?'tire':'attaque';
  const ch=hitChance(sp.pre,robotDef());engage();   // la foreuse est attaquée, que le coup porte ou non : les insectoïdes qui suivent attaquent
  // geste : le bond de l'attaquant, ou le trait du laser — droit sur la foreuse s'il touche, à côté s'il rate
  const geste=rate=>{if(!o.laser){addFx({kind:'lunge',beast:b,dx:Math.sign(G.px-b.x),dy:Math.sign(G.py-b.y),dur:200});return;}
    const an=Math.random()*Math.PI*2,r=rate?10+Math.random()*5:0;if(G.px!==b.x)b.dir=Math.sign(G.px-b.x);SFX.laser();
    addFx({kind:'laser',o:b,x:G.px,y:G.py,ox:Math.round(Math.cos(an)*r),oy:Math.round(Math.sin(an)*r),dur:rate?420:300});};
  if(!o.sur&&!roll(ch)){geste(true);addFx({kind:'num',x:G.px,y:G.py,txt:'0',col:'#8aa9a2',dur:750});
    if(!o.laser)SFX.whoosh();sayMore(`${le}${nom} ${verbe} et rate (${ch} %).`);return;}
  geste();
  const cr=o.sur||roll(sp.crit||0),dm=dmgDe(sp)*(cr?CRIT_X:1);   // coup critique de l'ennemi : selon sa stat CRIT
  addFx({kind:'shake',amp:cr?9:5,dur:cr?320:220});G.st.vie=Math.max(0,G.st.vie-dm);addFx({kind:'num',x:G.px,y:G.py,txt:'-'+dm+(cr?'!':''),col:'#ff3b3b',dur:cr?1000:750});if(!o.laser)SFX.bite();sayMore(`${le}${nom} ${verbe}${o.sur?' par surprise':cr?' : coup critique':''} : −${dm} vie.`,'warn');
  if(G.st.vie<=0){G.over={dead:true};return;}}
// Une fois par battement : effets durables sur la foreuse
function effTick(){const E=G.eff;if(!E||G.over)return;
  if(E.poison>0){E.poison--;const dm=Math.min(G.st.vie,E.pdmg||2);G.st.vie-=dm;addFx({kind:'num',x:G.px,y:G.py,txt:'-'+dm,col:'#ff3b3b',dur:750});
    if(G.st.vie<=0){G.over={dead:true};sayMore('Le poison achève la foreuse.','warn');return;}
    if(!E.poison)sayMore('Le poison est éliminé.','good');}
  if(E.glu>0&&--E.glu===0)sayMore('La glu se détache : la foreuse retrouve sa vitesse.','good');
  fumTick();}
/* Mine (19 novembre 2026) : elle fonce sur la foreuse ; arrivée à une case, elle s'arme (elle clignote) et ne bouge plus,
   puis explose 2 à 3 battements plus tard (22 novembre 2026 ; avant 1 à 3 : à 1, elle sautait au battement suivant, sans
   laisser le temps de réagir). L'explosion frappe un carré de 3 × 3 centré sur elle : la foreuse et toute
   créature qui s'y trouve. Ses dégâts sont ceux de sa fiche (dégâts min et max du Bestiaire). Détruite avant, elle n'explose pas. */
/* Englueur (21 novembre 2026) : un jet de glu à distance. S'il touche, la foreuse est engluée 3 battements (pas deux fois plus
   longs, voir stepDur) ; le jet lui-même ne blesse pas. */
function glue(b,sp){const ch=hitChance(sp.pre,robotDef());engage();if(G.px!==b.x)b.dir=Math.sign(G.px-b.x);SFX.drift();
  const rate=!roll(ch),an=Math.random()*Math.PI*2,r=rate?12:0;addFx({kind:'laser',o:b,x:G.px,y:G.py,ox:Math.round(Math.cos(an)*r),oy:Math.round(Math.sin(an)*r),dur:320});
  if(rate){sayMore(`${LeNom(sp)} crache sa glu et rate (${ch} %).`);return;}
  G.eff=G.eff||{};G.eff.glu=Math.max(G.eff.glu||0,3);addFx({kind:'num',x:G.px,y:G.py,txt:'glu',col:PAL['2'],dur:900});sayMore(`${LeNom(sp)} englue la foreuse : elle avance deux fois moins vite pendant 3 battements.`,'warn');}
function explose(b){const sp=BEASTS[b.sp],k=G.beasts.indexOf(b);if(k>=0)G.beasts.splice(k,1);
  const dans=o=>Math.max(Math.abs(o.x-b.x),Math.abs(o.y-b.y))<=1,vu=vis[idx(b.x,b.y)];
  addFx({kind:'boom',x:b.x,y:b.y,dur:420});if(vu||dans({x:G.px,y:G.py})||cheb(b,G.px,G.py)<=10){addFx({kind:'shake',amp:9,dur:320});SFX.explode();}
  for(const [liste,fiches] of [[G.beasts,BEASTS],[G.animals||[],SPECIES]])for(const o of [...liste])if(dans(o)){const dm=dmgDe(sp);o.hp=(o.hp??pvDe(fiches[o.sp]))-dm;
    addFx({kind:'num',x:o.x,y:o.y,txt:'-'+dm,col:PAL['3'],dur:750});if(o.hp<=0){liste.splice(liste.indexOf(o),1);bleed(o.x,o.y);}}
  if(dans({x:G.px,y:G.py})){const dm=dmgDe(sp);G.st.vie=Math.max(0,G.st.vie-dm);addFx({kind:'num',x:G.px,y:G.py,txt:'-'+dm,col:'#ff3b3b',dur:1000});
    sayMore(`La mine explose : −${dm} vie.`,'warn');if(G.st.vie<=0)G.over={dead:true};}
  else if(vu)sayMore('La mine explose.','warn');
  else if(cheb(b,G.px,G.py)<=10)sayMore('Une explosion, tout près.','warn');
  // l'explosion brise la roche et la montagne tendre du carré (22 novembre 2026) ; la roche dure, les murs et les machines
  // tiennent : seule la charge sismique en vient à bout. Le métal et la Matière qu'elles cachaient tombent au sol.
  let roches=0;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const zx=b.x+dx,zy=b.y+dy;if(zx<1||zy<1||zx>=W-1||zy>=H-1)continue;
    const j=idx(zx,zy),v=G.t[j];if(v!==ROCK&&v!==MOUNT)continue;G.t[j]=RUBBLE;if(G.dmg)delete G.dmg[j];roches++;
    if(G.ore&&G.ore[j]&&!oreSol(G.ore[j]))G.ore[j]=(oreMat(G.ore[j])?'m':'')+'sol'+oreLv(G.ore[j]);}
  if(roches){computeFOV();if(vu)sayMore(`L’explosion pulvérise ${roches} case${roches>1?'s':''} de roche.`);}}
/* Sentinelle (19 novembre 2026 ; d'abord « Paralyzor », qui accrochait la foreuse et la paralysait — retiré le soir même à la
   demande de l'utilisateur). Elle tire un laser jusqu'à sp.laser cases, en ligne de vue, une fois par battement : un jet
   pour toucher ordinaire, et le trait rouge se voit toujours — droit sur la foreuse s'il touche, à côté s'il rate.
   La clé interne de l'espèce reste `paralyzor`, pour que les groupes déjà réglés continuent de marcher. */
const animVif=()=>!!(G&&G.beasts&&G.beasts.some(b=>b.fuse>0));   // une mine armée clignote : le rendu doit tourner
function beastsAct(){
  turnStealth();
  if(!G.beasts||!G.beasts.length||G.over)return;const distSec=robotDist(false),distEau=robotDist(true),DC={};let charged=null,distVol=null;const alarms=[],boom=[];packTick();
  for(const b of G.beasts){if(G.over)break;if(b.skip){b.skip=0;continue;}const sp=BEASTS[b.sp];b.mp=Math.min(2,b.mp+sp.v/5/slowOf(G.t[idx(b.x,b.y)],sp.swim));
    const d=Math.hypot(b.x-G.px,b.y-G.py),sees=voitForeuse(b,b.hunt>0);
    if(sees){if(!b.hunt&&sp.alarm)alarms.push(b);if(!b.hunt&&beastVisible(b))charged=charged||sp;if(!b.hunt)alerte(b);b.hunt=1;spot(b);if(G.px!==b.x)b.dir=Math.sign(G.px-b.x);
      if(sp.pack)for(const o of mates(b))if(BEASTS[o.sp].pack){if(!o.hunt)alerte(o);o.hunt=1;spot(o);}}   // seuls les relais partagent ce qu'un des leurs voit — pas les autres espèces de leur groupe (20 novembre 2026)
    else if(b.hunt&&b.search>0&&--b.search===0){b.hunt=0;forget(b);}                // fouille terminée : il oublie
    else if(b.hunt&&!b.mem)b.hunt=0;
    b.sees=sees;
    if(alarms.length&&alarms[alarms.length-1]===b)raiseAlarm(b);
    if(sp.mine){                                                                      // mine : armée, elle attend l'explosion ; sinon elle s'arme à une case de la foreuse
      if(b.fuse>0){if(--b.fuse<=0)boom.push(b);continue;}
      if(b.hunt>0&&cheb(b,G.px,G.py)<=1){b.fuse=rnd(2,3);if(beastVisible(b)){sayMore('La mine s’arme !','warn');SFX.spot();}continue;}}
    if(sp.soin){let c=null,m=0;for(const o of G.beasts){if(o===b||cheb(o,b.x,b.y)>(sp.portee||3))continue;const q=pvDe(BEASTS[o.sp])-o.hp;if(q>m){m=q;c=o;}}   // soudeur : répare l'allié le plus abîmé à portée
      if(c){const h=Math.min(sp.soin,m);c.hp+=h;if(beastVisible(c)){addFx({kind:'num',x:c.x,y:c.y,txt:'+'+h,col:PAL['2'],dur:750});addFx({kind:'laser',o:b,x:c.x,y:c.y,ox:0,oy:0,dur:260});}}}
    if(sp.recul&&b.hunt>0&&sees&&cheb(b,G.px,G.py)<=sp.recul){const x0=b.x,y0=b.y;stepAway(b,(x,y)=>beastFits(b,x,y));if(b.x!==x0||b.y!==y0){b.mp=Math.min(b.mp,.99);if(b.cd>0)b.cd--;continue;}}   // il s'écarte ; acculé, il se bat
    if(sp.glu&&b.hunt>0&&sees&&cheb(b,G.px,G.py)<=sp.glu&&cheb(b,G.px,G.py)>1&&los(b.x,b.y,G.px,G.py)){if((b.cd=(b.cd||0)-1)<=0){b.cd=sp.cadence||3;glue(b,sp);}continue;}   // entre deux jets, il tient sa distance
    if(sp.laser&&b.hunt>0&&sees&&cheb(b,G.px,G.py)<=sp.laser&&los(b.x,b.y,G.px,G.py)){if(sp.cadence){if((b.cd=(b.cd||0)-1)>0)continue;b.cd=sp.cadence;}hurtRobot(b,sp,{laser:1});continue;}   // sentinelle : elle tire dès qu'elle est à portée
    if(b.hunt>0&&nearRobot(b)){hurtRobot(b);continue;}
    while(b.mp>=1&&!G.over){b.mp-=1;
      if(b.hunt>0&&sees){
        if(nearRobot(b)){b.mp=Math.min(b.mp,.99);break;}
        chaseStep(b,sp.vol?(distVol=distVol||distFromVol(G.px,G.py)):mouilleOk(sp,b)?distEau:distSec,(x,y)=>beastFits(b,x,y));}
      else if(b.hunt>0&&b.search>0)searchStep(b,(x,y)=>beastFits(b,x,y),DC,mouilleOk(sp,b));                // fouille autour du dernier point connu
      else if(b.hunt>0){if(!seekStep(b,(x,y)=>beastFits(b,x,y),DC,mouilleOk(sp,b)))break;}       // vers la dernière position connue
      else if(patMove(b,(x,y)=>beastFits(b,x,y)))break;                                   // calme : la patrouille de son groupe
      else if(b.pack>=0&&patDe(b)!=='errance'){packMove(b);}
      else{errStep(b,(x,y)=>beastFits(b,x,y));break;}}                                     // errance
  }
  for(const b of boom)if(G.beasts.includes(b)&&!G.over)explose(b);
  if(charged){sayMore(`${LeNom(charged)} vous a repéré et charge !`,'warn');SFX.roar();}
}
// Plus de réparation automatique : seule l'énergie se recharge à chaque battement.
// Attendre sur place la recharge WAIT_REGEN fois plus vite (13 novembre 2026) : 2/t au lieu de 1/t à POW 1.
function regen(wait){if(G.over)return;G.st.energie=Math.min(G.st.energieMax,G.st.energie+G.st.power/POW_BASE*(wait?WAIT_REGEN:1));}
// Coup de foreuse : consomme de l'énergie ; refusé si la réserve est insuffisante
function spend(){if(G.st.energie<G.st.cout){say(`Énergie insuffisante pour frapper (${Math.floor(G.st.energie)}/${G.st.cout}). Attendez qu’elle se recharge.`,'warn');SFX.blocked();render();return false;}G.st.energie-=G.st.cout;return true;}
const TRACK_LIFE=5;
// Bande : chaque cafar reste à PACK_R cases au plus du centre de son groupe, sinon il y revient.
// Hors chasse, la bande voyage vers un point accessible tiré au hasard, s'y arrête PACK_PAUSE tours, puis repart.
const PACK_R=4,PACK_PAUSE=50;
function packBfs(tx,ty){const d=new Int16Array(W*H).fill(-1),q=[idx(tx,ty)];d[q[0]]=0;
  for(let k=0;k<q.length;k++){const c=q[k],x=c%W,y=(c/W)|0;for(const[dx,dy]of DIRS){const a=x+dx,b=y+dy;if(a<1||b<1||a>=W-1||b>=H-1)continue;const j=idx(a,b),v=G.t[j];if(d[j]>=0||!diagOk(x,y,dx,dy)||!canWalk(v,false))continue;d[j]=d[c]+1;q.push(j);}}return d;}
function packTarget(P,cx,cy){for(let t=0;t<40;t++){const x=rnd(2,W-3),y=rnd(2,H-3),v=G.t[idx(x,y)];if(!canWalk(v,false)||Math.hypot(x-cx,y-cy)<10)continue;
    const d=packBfs(x,y);if(d[idx(Math.round(cx),Math.round(cy))]<0&&d[idx(Math.floor(cx),Math.floor(cy))]<0)continue;P.tx=x;P.ty=y;P.dist=d;P.pause=0;return;}
  P.pause=PACK_PAUSE;}
// Une fois par tour : chaque bande hors chasse avance vers sa destination ou fait sa pause
function packTick(){G.packs=G.packs||{};const groups={};
  for(const b of G.beasts)if(b.pack>=0)(groups[b.pack]=groups[b.pack]||[]).push(b);
  for(const id in groups){const m=groups[id],P=G.packs[id]=G.packs[id]||{pause:rnd(0,PACK_PAUSE)};if(m.some(b=>b.hunt>0))continue;
    {const R=G.patr&&G.patr[m[0].gi];if(R&&R.pat!=='voyage'){P.dist=null;P.pause=0;continue;}}
    const [cx,cy]=packCenter(m);
    if(P.pause>0){if(--P.pause===0)packTarget(P,cx,cy);continue;}
    if(!P.dist||P.tx==null){packTarget(P,cx,cy);continue;}
    if(Math.max(Math.abs(cx-P.tx),Math.abs(cy-P.ty))<=2){P.pause=PACK_PAUSE;P.dist=null;P.bh=null;P.bl=0;continue;}
    const h=Math.min(...m.map(b=>{const v=P.dist[idx(b.x,b.y)];return v<0?9999:v;}));   // bloquée PAT_BLOC + 2 battements : la bande change de destination
    if(P.bh==null||h<P.bh){P.bh=h;P.bl=0;}else if(++P.bl>=PAT_BLOC+2){P.bl=0;P.bh=null;packTarget(P,cx,cy);}}}
function packMove(b){const P=G.packs&&G.packs[b.pack];
  if(packStep(b))return;                                   // trop loin des siens : il revient
  if(P&&P.dist&&!P.pause){let best=null,bv=P.dist[idx(b.x,b.y)];if(bv<0)bv=9999;   // voyage : il avance vers la destination
    for(const[dx,dy]of DIRS){const nx=b.x+dx,ny=b.y+dy;if(!diagOk(b.x,b.y,dx,dy)||!beastFits(b,nx,ny)||!packOk(b,nx,ny))continue;const v=P.dist[idx(nx,ny)];if(v>=0&&v<bv){bv=v;best=[nx,ny,dx];}}
    if(best){b.x=best[0];b.y=best[1];if(best[2])b.dir=best[2];return;}}
  if(Math.random()<.25){const[dx,dy]=DIRS[rnd(0,7)];if(beastFits(b,b.x+dx,b.y+dy)&&diagOk(b.x,b.y,dx,dy)&&packOk(b,b.x+dx,b.y+dy)){b.x+=dx;b.y+=dy;if(dx)b.dir=dx;}}   // pause : il piétine sur place
  else b.mp=Math.min(b.mp,.99);}
const mates=b=>G.beasts.filter(o=>o!==b&&o.pack===b.pack&&o.pack>=0);
const packCenter=m=>[m.reduce((s,o)=>s+o.x,0)/m.length,m.reduce((s,o)=>s+o.y,0)/m.length];
function packOk(b,x,y){const m=mates(b);if(!m.length)return true;const [cx,cy]=packCenter(m);return Math.max(Math.abs(x-cx),Math.abs(y-cy))<=PACK_R;}
function packStep(b){const m=mates(b);if(!m.length)return false;const [cx,cy]=packCenter(m);if(Math.max(Math.abs(b.x-cx),Math.abs(b.y-cy))<=PACK_R)return false;
  let best=null,bd=Math.hypot(b.x-cx,b.y-cy);
  for(const[dx,dy]of DIRS){const nx=b.x+dx,ny=b.y+dy;if(!diagOk(b.x,b.y,dx,dy)||!beastFits(b,nx,ny))continue;const d=Math.hypot(nx-cx,ny-cy);if(d<bd){bd=d;best=[nx,ny,dx];}}
  if(best){b.x=best[0];b.y=best[1];if(best[2])b.dir=best[2];return true;}return false;}
// Cri d'alerte (désactivé le 13 novembre 2026 : sp.alarm=false pour tous) : tous les ennemis à 5 cases ou moins du cafar se mettent en chasse
const ALARM_R=5;
function raiseAlarm(b){const sp=BEASTS[b.sp];let n=0;
  for(const o of G.beasts)if(o!==b&&Math.max(Math.abs(o.x-b.x),Math.abs(o.y-b.y))<=ALARM_R){if(!o.hunt){n++;alerte(o);}o.hunt=1;spot(o);}   // le cri transmet la position de la foreuse
  for(const a of (G.animals||[]))if(Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y))<=ALARM_R){if(!a.aware){n++;alerte(a);}a.aware=1;spot(a);}
  if(beastVisible(b)||n){addFx({kind:'num',x:b.x,y:b.y,txt:'!',col:PAL['3'],dur:900});SFX.screech();
    sayMore(`Un cafar pousse un cri d’alerte${n?` : ${n} ennemi${n>1?'s':''} alerté${n>1?'s':''}`:''} !`,'warn');}}
function bleed(x,y){gore(x,y);}   // plus de tache de sang : étincelles et débris (10-rendu)

