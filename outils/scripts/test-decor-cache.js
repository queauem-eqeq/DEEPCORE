/* Décor en cache (26 novembre 2026) : sur quatre recettes, joue des pas à hasard fixé et compare régulièrement l'image de la
   vue obtenue avec le cache du décor à celle du dessin direct (DECOR_OFF), au pixel près. Une ligne par recette.
   Usage : python3 outils/jeu.py DOSSIER outils/scripts/test-decor-cache.js */
(() => {
  const vrai = Math.random, raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0;
  const graine = s => { let a = s >>> 0; Math.random = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const h = s => { let x = 2166136261; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; };
  const vue = () => h($('view').toDataURL());
  // horloge figée pendant la comparaison : une mine armée ou une balise clignotent selon l'heure, pas selon le cache
  const now0 = performance.now.bind(performance);
  const compare = () => { const T = now0(); performance.now = () => T; FX.length = 0; DECOR_OFF = false; render(); const a = vue();
    DECOR_OFF = true; render(); const b = vue(); DECOR_OFF = false; render(); performance.now = now0; return a === b; };
  const out = [];
  for (const [rec, g] of [['atterrissage', 3], ['classique', 5], ['cavernes', 7], ['base', 9]]) {
    graine(g); recRange(); recPrend(rec); GEN.taille = 3; GEN.hasard = true; hasardReglages(); newGame();
    let ok = 0, ko = 0; const D = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];
    G.st.vie = 1e6; G.st.vieMax = 1e6;
    for (let i = 1; i <= 160 && !G.over; i++) {
      const d = D[Math.floor(Math.random() * 8)]; try { tryMove(d[0], d[1]); } catch (e) {}
      if (i % 8 === 0) { compare() ? ok++ : ko++; }
      if (i % 40 === 0) { liqFrame ^= 1; compare() ? ok++ : ko++; }   // battement de l'eau
      if (i === 80) { fog = false; compare() ? ok++ : ko++; fog = true; compare() ? ok++ : ko++; }   // brouillard levé puis remis
    }
    out.push(`${rec.padEnd(13)} ${ko ? 'ÉCHEC' : 'ok'} : ${ok} images identiques, ${ko} différentes`);
  }
  Math.random = vrai; window.requestAnimationFrame = raf;
  return '\n' + out.join('\n');
})()
