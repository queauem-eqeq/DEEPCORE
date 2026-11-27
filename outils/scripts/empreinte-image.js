/* Empreinte de l'affichage (26 novembre 2026) : avec un hasard fixé, génère une carte, joue 60 pas et relève à intervalles
   l'image de la vue, de la mini-carte et le texte du journal. Une optimisation du rendu qui ne doit rien changer à l'écran
   doit laisser ces lignes identiques. Usage : SANS_ANIM=1 python3 outils/jeu.py DOSSIER outils/scripts/empreinte-image.js */
(() => {
  const vrai = Math.random, raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0;
  const graine = s => { let a = s >>> 0; Math.random = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const h = s => { let x = 2166136261; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return (x >>> 0).toString(16); };
  const vue = $('view');
  const out = [];
  const releve = n => { FX.length = 0; render(); out.push(`${n} vue ${h(vue.toDataURL())} mini ${h(mv.toDataURL())} journal ${h($('log').innerHTML)}`); };
  for (const [rec, g] of [['atterrissage', 11], ['classique', 44]]) {
    graine(g); recRange(); recPrend(rec); GEN.taille = 3; GEN.hasard = true; hasardReglages(); newGame();
    releve(rec + ' 0');
    const D = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (let i = 1; i <= 60; i++) { const d = D[Math.floor(Math.random() * 4)]; try { tryMove(d[0], d[1]); } catch (e) {} if (i % 15 === 0) releve(rec + ' ' + i); }
    fog = false; releve(rec + ' sans brouillard'); fog = true;
  }
  Math.random = vrai; window.requestAnimationFrame = raf;
  return '\n' + out.join('\n');
})()
