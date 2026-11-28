/* Coût d'un tour en combat rapproché (28 novembre 2026) : N drones (coup 50, deux coups par tour) collés à la foreuse,
   qui attend ou frappe. Mesure le calcul de chaque tour, puis les images dessinées pendant les animations qui suivent.
   Usage : python3 outils/jeu.py DOSSIER outils/scripts/mesure-combat.js   (window.NB = nombre d'ennemis, 6 par défaut) */
(async () => {
  const NOMS = ['beastsAct', 'animalsAct', 'computeFOV', 'render', 'side', 'mini', 'logDraw', 'pass', 'battement',
    'creatureJoue', 'hurtRobot', 'chaseStep', 'distCarte', 'distFrom', 'turnStealth', 'fxRapide', 'addFx', 'antVis', 'seenHTML'];
  let tour = null; const vrais = {}, pile = [];
  for (const n of NOMS) { if (typeof window[n] !== 'function') continue; const f = vrais[n] = window[n];
    window[n] = function () { const a = performance.now(); pile.push(n);
      try { return f.apply(this, arguments); } finally { pile.pop(); const d = performance.now() - a;
        if (tour && !pile.includes(n)) { tour[n] = (tour[n] || 0) + d; tour['n_' + n] = (tour['n_' + n] || 0) + 1; } } }; }
  recRange(); recPrend('classique'); GEN.taille = 3; GEN.hasard = true; hasardReglages(); newGame();
  const cx = G.px, cy = G.py;
  for (let y = cy - 6; y <= cy + 6; y++) for (let x = cx - 6; x <= cx + 6; x++) G.t[idx(x, y)] = GROUND;
  G.st.vie = G.st.vieMax = 99999; G.beasts = []; G.animals = [];
  const sp = BEASTS.findIndex(b => b.key === (window.ESP || 'drone')), NB = window.NB || 6;
  const pos = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];
  for (let k = 0; k < NB; k++) { const [dx, dy] = pos[k % 8]; const b = newBeast(sp, cx + dx * (1 + (k >> 3)), cy + dy * (1 + (k >> 3)), -1, -1);
    b.hunt = 99; b.sees = 1; b.mem = { x: cx, y: cy }; G.beasts.push(b); }
  computeFOV(); render();
  const tours = [], images = []; let enJeu = true;
  // chaque image réellement dessinée par la boucle d'animation
  const vraiFx = window.fxLoop; window.fxLoop = function () { const a = performance.now(); const r = vraiFx.apply(this, arguments);
    if (enJeu) images.push({ t: a, d: performance.now() - a, rapide: fxSurface() }); return r; };
  for (let i = 0; i < 30; i++) {
    tour = {}; const nfx = FX.length, t0 = performance.now();
    if (i % 2) waitTurn(); else { const b = G.beasts[0]; if (b) tryMove(Math.sign(b.x - G.px), Math.sign(b.y - G.py)); else waitTurn(); }
    tour.total = performance.now() - t0; tour.fx = FX.length - nfx; tours.push(tour); tour = null;
    await new Promise(r => setTimeout(r, 150));   // le joueur tape environ 6 à 7 touches par seconde
  }
  await new Promise(r => setTimeout(r, 1500)); enJeu = false;
  for (const n in vrais) window[n] = vrais[n]; window.fxLoop = vraiFx;
  const f = v => v.toFixed(1), moy = a => a.reduce((s, v) => s + v, 0) / (a.length || 1),
    p95 = a => [...a].sort((x, y) => x - y)[Math.floor(a.length * .95)] || 0;
  const tt = tours.map(t => t.total), somme = {};
  for (const t of tours) for (const k in t) if (NOMS.includes(k)) somme[k] = (somme[k] || 0) + t[k];
  const L = [`${NB} × ${BEASTS[sp].n} : tour moy ${f(moy(tt))} ms · p95 ${f(p95(tt))} · pire ${f(Math.max(...tt))} ; effets ajoutés par tour ${f(moy(tours.map(t => t.fx)))}`];
  L.push('  part du calcul des tours : ' + Object.entries(somme).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k} ${f(v / 30)}`).join(' · '));
  L.push('  appels par tour : ' + ['render', 'creatureJoue', 'hurtRobot', 'logDraw', 'side'].map(k => `${k} ${f(moy(tours.map(t => t['n_' + k] || 0)))}`).join(' · '));
  const dd = images.map(i => i.d), ec = images.slice(1).map((im, k) => im.t - images[k].t);
  L.push(`  animations : ${images.length} images en ${f((images.at(-1)?.t - images[0]?.t) / 1000 || 0)} s, dont ${images.filter(i => !i.rapide).length} complètes ; ` +
    `image moy ${f(moy(dd))} ms · p95 ${f(p95(dd))} ; écart entre images moy ${f(moy(ec))} ms · p95 ${f(p95(ec))}`);
  L.push(`  PV perdus : ${99999 - G.st.vie}`);
  return L.join('\n');
})()
