/* ---------- Bâtiments ----------
   Étape 1 (18 novembre 2026) : les tuiles (mur, sol, porte, pilier) et une pièce posée à la main près du vaisseau, pour
   vérifier le rendu, la ligne de vue, la discrétion et le passage des ennemis. La génération par accrétion vient ensuite
   (voir docs/conception.md, « Bâtiments »). */
// dessin d'une case bâtie ; put(tuile, opacité) vient du rendu de la partie ou de celui de l'intro
function batiTuile(t,x,y,put){
  if(t===WALL){put(y<H-1&&G.t[idx(x,y+1)]===WALL?TL.wall:TL.wallFace,.95);return;}
  put(TL.floor,.5);
  if(t===PILLAR)put(TL.pillar,.95);
  else if(t===DOOR){const cote=y>0&&y<H-1&&G.t[idx(x,y-1)]===WALL&&G.t[idx(x,y+1)]===WALL;   // porte percée dans un mur vertical
    put(porteOuverte(x,y)?(cote?TL.doorOpenV:TL.doorOpen):TL.door,1);}
}
// La pièce d'essai : un hall à piliers (deux entrées) et une petite salle en cul-de-sac derrière une porte intérieure.
const PIECE_ESSAI=[
  "###############",
  "#.......#.....#",
  "#.o...o.#.....#",
  "#.......+.....#",
  "+.......#.....#",
  "#.o...o.#.....#",
  "#.......#.....#",
  "####+##########"];
function pieceEssai(){
  const t=G.t,P=PIECE_ESSAI,w=P[0].length,h=P.length,libre=v=>v===GROUND||v===GRASS||v===FLAT||v===RUBBLE||v===ROCK;
  const cx=G.ship?G.ship.x+SGW/2:G.px,cy=G.ship?G.ship.y+SGH/2:G.py;
  // d'abord un terrain dégagé ; à défaut on rase montagne et eau (jamais le vaisseau, un gouffre ou un pont)
  for(const ok of [libre,v=>v!==SHIP&&v!==DECK&&v!==CHASM&&v!==BRIDGE]){const cand=[];
    for(let y0=3;y0<H-h-3;y0++)for(let x0=3;x0<W-w-3;x0++){let bon=true;
      for(let y=y0-1;y<=y0+h&&bon;y++)for(let x=x0-1;x<=x0+w;x++){const v=t[idx(x,y)];
        if(!ok(v)||(x===G.px&&y===G.py)||G.sites.some(s=>Math.abs(s.x-x)<3&&Math.abs(s.y-y)<3)){bon=false;break;}}
      if(bon)cand.push([Math.hypot(x0+w/2-cx,y0+h/2-cy),x0,y0]);}
    cand.sort((a,b)=>a[0]-b[0]);
    for(const [,x0,y0] of cand.slice(0,40)){const sauve=[];
      for(let y=y0-1;y<=y0+h;y++)for(let x=x0-1;x<=x0+w;x++){const i=idx(x,y);sauve.push([i,t[i]]);
        const c=P[y-y0]&&P[y-y0][x-x0];t[i]=c==='#'?WALL:c==='.'?FLOOR:c==='+'?DOOR:c==='o'?PILLAR:(t[i]===GRASS||t[i]===FLAT||t[i]===RUBBLE?t[i]:GROUND);}
      if(connectedAll(t)){G.bati={x:x0,y:y0,w,h};return;}
      for(const [i,v] of sauve)t[i]=v;}}
}
