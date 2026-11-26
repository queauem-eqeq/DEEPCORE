// Mesure CPU du moteur, à passer à jeu.py : python3 outils/jeu.py DOSSIER outils/scripts/mesure-perf.js
// Renvoie, pour chaque étape, la médiane, le 95e centile et le pire cas en millisecondes.
(async () => {
  const st = a => { const s = [...a].sort((x, y) => x - y), q = p => s[Math.min(s.length - 1, Math.floor(p * s.length))];
    return `méd ${q(.5).toFixed(2)} · p95 ${q(.95).toFixed(2)} · max ${s[s.length - 1].toFixed(2)} ms (n=${s.length})`; };
  const chrono = (n, f) => { const t = []; for (let i = 0; i < n; i++) { const a = performance.now(); try { f(i); } catch (e) { t.push(-1); continue; } t.push(performance.now() - a); } return t; };
  const out = {};
  // 1. Génération complète d'un niveau (carte, bâtiments, faune)
  out['génération newGame'] = st(chrono(6, () => newGame()));
  // 2. Pièces du tour, isolées
  out['computeFOV'] = st(chrono(300, () => computeFOV()));
  out['render'] = st(chrono(200, () => render()));
  out['beastsAct'] = st(chrono(100, () => beastsAct()));
  out['animalsAct'] = st(chrono(100, () => animalsAct()));
  // 3. Un tour complet vu du joueur : un pas dans une direction au hasard (déplacement + IA + vue + rendu)
  const D = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  out['tour (tryMove)'] = st(chrono(300, i => { const d = D[(i * 7 + (i >> 2)) % 4]; tryMove(d[0], d[1]); }));
  // 4. Charge au repos : temps passé dans les rappels d'image pendant 3 s sans rien faire
  const T = [], raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = cb => raf(ts => { const a = performance.now(); cb(ts); T.push(performance.now() - a); });
  await new Promise(r => setTimeout(r, 3000));
  window.requestAnimationFrame = raf;
  out['repos : rappels d\'image sur 3 s'] = T.length ? st(T) + ` ; part de CPU ≈ ${(T.reduce((a, b) => a + b, 0) / 30).toFixed(1)} %` : 'aucun rappel (rien ne tourne au repos)';
  if (performance.memory) out['mémoire JS'] = (performance.memory.usedJSHeapSize / 1048576).toFixed(1) + ' Mo';
  out['carte'] = `${W}×${H} = ${W * H} cases`;
  return JSON.stringify(out, null, 1);
})()
