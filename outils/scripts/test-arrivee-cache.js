/* Grille de l'arrivée en cache (26 novembre 2026) : pendant l'intro, compare régulièrement l'image dessinée avec le tampon
   à celle du dessin direct (TAMPON_OFF), au même instant et avec le même tremblement (hasard figé). Entre deux comparaisons,
   l'intro continue avec le tampon. À lancer sans passer l'intro :
   python3 outils/arrivee_cache.py   (ou à la main, dans la page, dès le début de l'intro) */
(async () => {
  const h = s => { let x = 2166136261; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; };
  const A = window.arriveeControle, cv = $('introCv'); let ok = 0, ko = 0, direct = 0, vu = 0;
  for (let k = 0; k < 40; k++) {
    await new Promise(r => setTimeout(r, 300));
    const S = A.S; if (!S) break;
    const now = performance.now(), t = (now - S.t0) / 1000 + S.saut; if (t > A.T_NOIR - .05) break; vu++;
    const vraiR = Math.random, raf = window.requestAnimationFrame; Math.random = () => .37; window.requestAnimationFrame = () => 0;
    try {
      A.off = false; A.image(now); const a = h(cv.toDataURL());
      A.off = true; A.image(now); const b = h(cv.toDataURL()); A.image(now); const c = h(cv.toDataURL());
      if (b !== c) direct++; else a === b ? ok++ : ko++;
    } finally { A.off = false; Math.random = vraiR; window.requestAnimationFrame = raf; }
  }
  return `arrivée : ${ko ? 'ÉCHEC' : 'ok'} · ${ok} images identiques, ${ko} différentes` + (direct ? ` (${direct} comparaisons impossibles)` : '') + ` · ${vu} instants`;
})()
