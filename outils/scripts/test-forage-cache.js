/* Roche des descentes en cache (26 novembre 2026) : pendant une vraie descente (niveau 1 puis 2), compare régulièrement
   l'image dessinée avec le cache de la roche à celle du dessin direct (FG_ROCHE_OFF), au même instant et avec le même
   tremblement (hasard figé). Les images du jeu continuent avec le cache entre deux comparaisons.
   Usage : python3 outils/jeu.py DOSSIER outils/scripts/test-forage-cache.js */
(async () => {
  const h = s => { let x = 2166136261; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; };
  const out = [];
  for (const niv of [1, 2]) {
    descendre(niv); let ok = 0, ko = 0, direct = 0;
    for (let k = 0; k < 26; k++) {
      await new Promise(r => setTimeout(r, 450));
      const F = FORAGE; if (!F || !F.x) continue;
      const vrai = Math.random; Math.random = () => .37;
      const t = F.t, cv = F.x.canvas;
      try {
        FG_ROCHE_OFF = false; fgDraw(F, t); const a = h(cv.toDataURL());
        FG_ROCHE_OFF = true; fgDraw(F, t); const b = h(cv.toDataURL());
        fgDraw(F, t); const c = h(cv.toDataURL());
        if (b !== c) direct++; else a === b ? ok++ : ko++;
      } finally { FG_ROCHE_OFF = false; Math.random = vrai; }
    }
    out.push(`descente ${niv} : ${ko ? 'ÉCHEC' : 'ok'} · ${ok} images identiques, ${ko} différentes` + (direct ? ` (${direct} comparaisons impossibles : le dessin direct n'est pas reproductible)` : ''));
    for (let k = 0; k < 40 && FORAGE; k++) await new Promise(r => setTimeout(r, 500));
  }
  return '\n' + out.join('\n');
})()
