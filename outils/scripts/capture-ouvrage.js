/* Capture des ferrailleuses au travail (28 novembre 2026, bloc F). window.CAP = {graine: 3, mode: 'travail' | 'alerte' | 'chasse' | 'envue'}.
   Une carte du niveau 1 (hasard semé), la première équipe à l'ouvrage à sa coque ; la foreuse posée à 5 cases de l'épave (contour du
   périmètre visible), ou dedans pour 'alerte' (un battement : « ? », contour rouge) ; 'chasse' : elle y reste jusqu'à la chasse (« ! »).
   L'image est prise par outils/jeu.py ; le script rend l'état lu dans la page. */
(() => {
  const C = Object.assign({graine: 3, mode: 'travail'}, window.CAP || {});
  const vrai = Math.random; let a = C.graine >>> 0;
  Math.random = () => {a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296;};
  const sauve = JSON.parse(JSON.stringify(GEN));
  recRange(); recPrend('atterrissage'); hasardReglages(); enJeu(newGame, 1); genRemet(sauve);
  fog = true; started = true; $('overlay').hidden = true; G.st.vie = G.st.vieMax = 1000;
  // l'équipe au travail : un groupe de ferrailleuses en halte à son épave, membres à leur poste
  const ids = Object.keys(G.patr).filter(id => G.patr[id].role === 'ferraille' && ouvrEpave(G.patr[id]));
  const id = ids.sort((x, y) => (G.patr[y].pause > 0 && G.patr[y].k === 0) - (G.patr[x].pause > 0 && G.patr[x].k === 0))[0];
  const P = G.patr[id], e = ouvrEpave(P), m = G.beasts.filter(o => o.gi === +id);
  P.k = 0; P.pause = 200; ouvrAffecte(P, m); for (const o of m) if (o.poste >= 0) {const x = o.poste % W, y = (o.poste / W) | 0; if (beastFits(o, x, y)) {o.x = x; o.y = y;}}
  // une case praticable à 5 cases de l'emprise (ou à 2 pour l'alerte), du côté où il y a le plus d'ouvrières
  const dv = C.mode === 'travail' || C.mode === 'envue' ? 5 : 2; let best = null, bv = 1e9;
  for (let y = e.y - dv; y <= e.y + e.h - 1 + dv; y++) for (let x = e.x - dv; x <= e.x + e.w - 1 + dv; x++) {
    if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1 || ouvrDist(e, x, y) !== dv || !canWalk(G.t[idx(x, y)], false) || beastAt(x, y)) continue;
    const v = m.reduce((s, o) => s + Math.hypot(o.x - x, o.y - y), 0); if (v < bv) {bv = v; best = [x, y];}}
  if (best) {G.px = best[0]; G.py = best[1];}
  // les autres créatures loin de la scène (la capture ne montre que l'équipe)
  for (const o of G.beasts.concat(G.animals)) if (o.gi !== +id && Math.hypot(o.x - G.px, o.y - G.py) < 14) {o.x = 2; o.y = 2;}
  G.beasts = G.beasts.filter(o => o.gi === +id || Math.hypot(o.x - G.px, o.y - G.py) >= 14);
  computeFOV();
  for (let k = 0; k < 3; k++) {pass(100, true); computeFOV();}
  // 'envue' : un crabot hostile ordinaire (sans rôle) en chasse à côté, pour la fenêtre « En vue » : menace, puis « À L'OUVRAGE »
  if (C.mode === 'envue') {const sp = BEASTS.findIndex(b => b.key === 'crabos'); for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [-2, -2], [2, -2]]) {
      const b = newBeast(sp, G.px + dx, G.py + dy, -1, -1); if (!beastFits(b, b.x, b.y)) continue; b.hunt = 1; b.sees = true; spot(b); G.beasts.push(b); break;}
    computeFOV();}
  if (C.mode === 'chasse') for (let k = 0; k < 4 && P.ouv !== 'hostile'; k++) {pass(100, true); computeFOV();}
  G.turn++; render(); side();
  Math.random = vrai;
  return JSON.stringify({id, epave: epNom(e), etat: e.etat, ouv: P.ouv, al: P.al, pos: [G.px, G.py], dist: ouvrDist(e, G.px, G.py),
    membres: m.map(o => [BEASTS[o.sp].key, o.x, o.y, !!ouvrCoque(P.epave, o.x, o.y)]), etinc: FX.filter(f => f.kind === 'etinc').length,
    contour: typeof ouvrContour === 'function'});
})()
