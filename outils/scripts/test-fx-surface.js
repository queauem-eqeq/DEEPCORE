/* Effets de surface (26 novembre 2026) : pour chaque effet posé par-dessus le décor, compare l'image obtenue par le chemin
   rapide (décor recollé + effets seuls, fxRapide) à celle d'un rendu complet, au même instant (horloge figée).
   Une ligne par effet : « ok » si les deux images sont identiques au pixel près.
   Usage : python3 outils/jeu.py DOSSIER outils/scripts/test-fx-surface.js */
(() => {
  const vraiNow = performance.now.bind(performance), raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0;
  const h = s => { let x = 2166136261; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; };
  fog = false; const b = G.beasts.find(e => beastVisible(e)) || G.beasts[0];
  if (b) { b.x = G.px + 2; b.y = G.py; }
  // découpe d'une ferrailleuse (28 novembre 2026, soir) : la bête devient une ouvrière à l'ouvrage, le temps de l'essai
  if (b) { b.role = 'ferraille'; if (b.gi == null) b.gi = 9999; G.patr = G.patr || {}; G.patr[b.gi] = Object.assign(G.patr[b.gi] || {}, { role: 'ferraille', ouv: '' }); }
  const x = G.px, y = G.py, gr = n => fxGrains(n);
  const CAS = {
    num: { x, y, txt: '12', col: '#ffffff', dur: 900 }, soin: { x, y, dur: 900, gr: gr(9) }, ener: { x, y, dur: 900, gr: gr(9) },
    laser: { o: b, x, y, ox: 2, oy: 1, dur: 420 }, boule: { ax: x + 2, ay: y, bx: x, by: y, dur: 320 },
    boom: { x: x + 1, y: y + 1, cases: [[x + 1, y + 1], [x + 2, y + 1]], dur: 420 }, alerte: { o: b, dur: 900 }, etinc: { o: b, dx: 1, dy: 0, x0: b ? b.x : 0, y0: b ? b.y : 0, s: 7, dur: 2400 },
    onde: { x, y, r: 4.5, dur: 600 }, boost: { x, y, dur: 900, gr: gr(14) }, fury: { x, y, dur: 800 }, veil: { x, y, dur: 750 },
    zap: { ax: x - .5, ay: y - .5, bx: x + .5, by: y + .5, dur: 320 },
    // arme de tir (28 novembre 2026, 14m) : un projectile par arme, et les braises d'une cible qui brûle
    ...Object.fromEntries(['canon', 'lanceflamme', 'canonglu', 'shotgun', 'laser'].map(a => ['tir:' + a,
      { arme: a, ax: x, ay: y, bx: x + 4, by: y - 1, vol: 200, dur: 460, g: 3, mur: false, cases: null }])),
    braise: { x: x + 2, y, dur: 600, g: 7 },
  };
  const out = [];
  for (const [cle, f] of Object.entries(CAS)) {const kind = cle.split(':')[0], nom = cle.replace('tir:', 'tir ');
    FX.length = 0; let T = vraiNow(); performance.now = () => T;
    try {
      render(); addFx(Object.assign({ kind }, f)); render();          // rendu complet avec l'effet : garde la copie du décor
      T += f.dur * .4; render(); const plein = h($('view').toDataURL());   // même instant, rendu complet
      const ok = fxSurface(); fxRapide(); const rapide = h($('view').toDataURL());
      out.push(`${nom.padEnd(7)} ${!ok ? 'ÉCHEC (chemin rapide refusé)' : plein === rapide ? 'ok' : 'ÉCHEC (images différentes)'}`);
    } catch (e) { out.push(`${nom.padEnd(7)} ÉCHEC ${String(e).slice(0, 120)}`); }
  }
  // un effet qui touche le décor doit refuser le chemin rapide
  FX.length = 0; addFx({ kind: 'shake', amp: 5, dur: 220 }); render();
  out.push(`shake   ${fxSurface() ? 'ÉCHEC (chemin rapide accepté)' : 'ok (rendu complet)'}`);
  FX.length = 0; performance.now = vraiNow; window.requestAnimationFrame = raf; render();
  return '\n' + out.join('\n');
})()
