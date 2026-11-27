/* À-coups d'un tour (26 novembre 2026) : chronomètre chaque étape d'un pas de la foreuse (hasard fixé, 300 pas) et
   détaille les tours les plus lents. Usage : python3 outils/jeu.py DOSSIER outils/scripts/acoups.js
   Les fonctions mesurées sont des déclarations globales : les remplacer dans window intercepte tous leurs appels. */
(() => {
  const NOMS = ['beastsAct', 'animalsAct', 'computeFOV', 'render', 'side', 'mini', 'logDraw', 'machDraw', 'patBfs', 'etend',
    'antVis', 'turnStealth', 'sonarStart', 'drawPath', 'seenHTML', 'pass', 'battement', 'creatureJoue', 'machTick', 'effTick', 'chercheSecrets', 'portesBruit', 'portesPrises', 'regen', 'prochaineCreature', 'antDetecte', 'distFrom', 'robotDistAvoid', 'chaseStep', 'los'];
  let tour = null; const pile = [];
  const vrais = {};
  for (const n of NOMS) { if (typeof window[n] !== 'function') continue; const f = vrais[n] = window[n];
    window[n] = function () { const a = performance.now(); pile.push(n);
      try { return f.apply(this, arguments); } finally { pile.pop(); const d = performance.now() - a;
        if (tour && !pile.includes(n)) { tour[n] = (tour[n] || 0) + d; tour['n_' + n] = (tour['n_' + n] || 0) + 1; } } }; }   // temps inclusif, sans double compte des appels récursifs
  let a = 7; const vraiR = Math.random; Math.random = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0;   // pas d'animation : on ne mesure que le tour
  recRange(); recPrend('classique'); GEN.taille = 3; GEN.hasard = true; hasardReglages(); newGame();
  const D = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]], tours = [];
  for (let i = 0; i < 300; i++) { const d = D[Math.floor(Math.random() * 8)]; tour = {}; const t0 = performance.now();
    try { tryMove(d[0], d[1]); } catch (e) { tour.erreur = 1; } tour.total = performance.now() - t0; tour.i = i;
    tour.ennemis = (G.beasts || []).length; tours.push(tour); tour = null; FX.length = 0; }
  Math.random = vraiR; window.requestAnimationFrame = raf; for (const n in vrais) window[n] = vrais[n];
  const somme = {}; for (const t of tours) for (const k in t) if (NOMS.includes(k)) somme[k] = (somme[k] || 0) + t[k];
  const tot = tours.reduce((s, t) => s + t.total, 0), f = v => v.toFixed(1);
  const lignes = [`300 pas : ${f(tot)} ms au total, ${f(tot / 300)} ms par pas en moyenne`, 'part de chaque étape (temps inclusif) :'];
  for (const [k, v] of Object.entries(somme).sort((x, y) => y[1] - x[1])) lignes.push(`  ${k.padEnd(12)} ${f(v).padStart(7)} ms  ${f(100 * v / tot).padStart(5)} %`);
  const appels = {}; for (const t of tours) for (const k in t) if (k.startsWith('n_')) appels[k.slice(2)] = (appels[k.slice(2)] || 0) + t[k];
  lignes.push('appels par pas (moyenne) : ' + ['render', 'side', 'mini', 'computeFOV', 'logDraw'].map(k => `${k} ${f((appels[k] || 0) / 300)}`).join(' · '));
  lignes.push('les 8 pas les plus lents :');
  for (const t of [...tours].sort((x, y) => y.total - x.total).slice(0, 8)) {
    const det = `render ×${t.n_render || 0} · ` + Object.entries(t).filter(([k]) => NOMS.includes(k)).sort((x, y) => y[1] - x[1]).slice(0, 4).map(([k, v]) => `${k} ${f(v)}`).join(' · ');
    const reste = t.total - Object.entries(t).filter(([k]) => ['pass', 'computeFOV', 'render'].includes(k)).reduce((s, [, v]) => s + v, 0);
    lignes.push(`  pas ${String(t.i).padStart(3)} : ${f(t.total)} ms  (${det} · hors étapes ${f(reste)})`); }
  return '\n' + lignes.join('\n');
})()
