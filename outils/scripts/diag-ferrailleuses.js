/* Diagnostic des ferrailleuses du niveau 1 (28 novembre 2026, bloc F) : qui passe en chasse, et pourquoi.
   Lancé par outils/jeu.py (SANS_ANIM=1 conseillé). Réglages du joueur simulés : les groupes enregistrés dans la base de l'artefact
   (reglages/courant, lus le 28 novembre 2026), passés par applySaved comme au chargement de l'artefact. Hasard semé, N cartes.
   window.DIAG = {n: 6, scenes: 'abc', defaut: false} ; defaut : true joue les groupes du code au lieu de ceux du joueur.
   Scènes, pour chaque carte :
     a) la foreuse sort du vaisseau, marche vers l'épave la plus proche où travaille un groupe, entre dans son périmètre, y reste
        3 battements, ressort et s'éloigne de 10 cases, puis attend 40 battements ;
     b) idem, mais elle ressort dès l'alerte ;
     c) elle traverse l'aire d'atterrissage vers le sas du dépôt en contournant les périmètres (à OUVR_R + 1 cases des épaves occupées)
        quand c'est possible. Les trajets de a et b contournent aussi les périmètres des autres épaves.
   Chaque entrée en chasse est notée : battement, groupe (nom, rôle, épave), espèce, distance, cause (vue, bruit, périmètre, coup,
   meute = un relais de la bande a vu, cri, vacarme, renfort, autre). Rend un JSON. */
(() => {
  const REG = {"budget":80,"liste":[{"cout":3,"f":2,"lieux":[],"m":[{"k":"crabos","max":2,"min":1}],"n":"Crabots","on":1,"pats":["voyage","ronde","navette","sentinelle"]},{"cout":7,"f":2,"lieux":[],"m":[{"k":"crabos","max":6,"min":4}],"n":"Large crabot groupe","on":1,"pats":["voyage","navette","ronde"]},{"cout":5,"f":2,"lieux":[],"m":[{"k":"cafar","max":4,"min":3}],"n":"Bande de relais","on":1,"pats":["voyage","errance","ronde"]},{"cout":7,"f":0,"lieux":[],"m":[{"k":"paralyzor","max":1,"min":1},{"k":"crabos","max":1,"min":1},{"k":"cafar","max":1,"min":1},{"k":"mine","max":1,"min":1},{"k":"puce","max":1,"min":1}],"n":"Family","on":1,"pats":["territoire","ronde"]},{"cout":8,"f":0,"lieux":[],"m":[{"k":"puce","max":5,"min":3},{"k":"paralyzor","max":1,"min":1}],"n":"3-5 puces + sentinelles","on":1,"pats":["voyage"]},{"cout":3,"f":1,"lieux":[],"m":[{"k":"mine","max":2,"min":1}],"n":"1-2 Mines","on":1,"pats":["errance"]},{"cout":6,"f":1,"lieux":[],"m":[{"k":"mine","max":3,"min":3},{"k":"paralyzor","max":2,"min":2}],"n":"Mines & Sentinelles","on":1,"pats":["navette","ronde"]},{"cout":3,"f":1,"lieux":[],"m":[{"k":"paralyzor","max":3,"min":2}],"n":"2-3 sentinelles","on":1,"pats":["territoire","ronde","navette"]},{"cout":3,"f":0,"lieux":["ext"],"m":[{"k":"brochon","max":2,"min":1}],"n":"Banc de torpilles","on":1,"pats":["errance"]},{"cout":11,"f":1,"lieux":[],"m":[{"k":"mastok","max":1,"min":1}],"n":"Broyeur solitaire","on":1,"pats":["territoire","garde","sentinelle"]},{"cout":10,"f":0,"lieux":[],"m":[{"k":"puce","max":8,"min":6},{"k":"mine","max":1,"min":0}],"n":"Puces en groupes","on":1,"pats":["voyage"]},{"cout":10,"f":1,"lieux":[],"m":[{"k":"gardien","max":1,"min":1},{"k":"paralyzor","max":2,"min":1}],"n":"Poste de garde","on":1,"pats":["garde"]},{"cout":13,"f":1,"lieux":[],"m":[{"k":"artilleur","max":2,"min":2},{"k":"gardien","max":1,"min":0}],"n":"Batterie","on":1,"pats":["garde","sentinelle"]},{"cout":3,"f":1,"lieux":["bati","ext"],"m":[{"k":"drone","max":5,"min":3}],"n":"Essaim de drones","on":1,"pats":["voyage","navette","ronde"]},{"cout":6,"f":1,"lieux":[],"m":[{"k":"crabos","max":2,"min":2},{"k":"soudeur","max":1,"min":1}],"n":"Escouade de réparation","on":1,"pats":["ronde","navette"]},{"cout":4,"f":1,"lieux":[],"m":[{"k":"englueur","max":2,"min":1},{"k":"mine","max":2,"min":1}],"n":"Embuscade gluante","on":1,"pats":["affut"]},{"cout":7,"f":1,"lieux":["ext"],"m":[{"k":"englueur","max":1,"min":1},{"k":"cafar","max":4,"min":3}],"n":"Chasse à courre","on":1,"pats":["voyage","navette"]},{"cout":11,"f":1,"lieux":[],"m":[{"k":"gardien","max":1,"min":1},{"k":"soudeur","max":1,"min":1},{"k":"drone","max":2,"min":2}],"n":"Convoi","on":1,"pats":["navette"]},{"cout":5,"f":1,"lieux":[],"m":[{"k":"artilleur","max":2,"min":1}],"n":"Tireurs embusqués","on":1,"pats":["affut","sentinelle"]},{"cout":2,"f":1,"lieux":[],"m":[{"k":"drone","max":2,"min":2},{"k":"paralyzor","max":1,"min":1}],"n":"Ronde de drones","on":1,"pats":["ronde"]}],"niv":{"1":{"budget":80,"gr":["Crabots","Bande de relais","1-2 Mines","Banc de torpilles","Puces en groupes"],"part":{"bati":20,"ext":75,"tunnel":5}},"2":{"budget":96,"gr":["Crabots","Large crabot groupe","Bande de relais","Family","3-5 puces + sentinelles","1-2 Mines","Mines & Sentinelles","2-3 sentinelles","Banc de torpilles","Broyeur solitaire","Puces en groupes","Batterie","Essaim de drones","Tireurs embusqués","Ronde de drones"],"part":{"bati":18,"ext":80,"tunnel":2}},"3":{"budget":112,"gr":["Crabots","Large crabot groupe","Bande de relais","Family","3-5 puces + sentinelles","1-2 Mines","Mines & Sentinelles","2-3 sentinelles","Banc de torpilles","Broyeur solitaire","Puces en groupes","Poste de garde","Batterie","Essaim de drones","Escouade de réparation","Embuscade gluante","Chasse à courre","Convoi","Tireurs embusqués","Ronde de drones"],"part":{"bati":60,"ext":35,"tunnel":5}}},"pente":20,"v":2};
  const C = Object.assign({n: 6, scenes: 'abc', defaut: false, g0: 1}, window.DIAG || {});
  const raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0;
  const vrai = Math.random, sauveGen = JSON.parse(JSON.stringify(GEN)), sauveGr = JSON.parse(JSON.stringify(GROUPES));
  const graine = s => {let a = s >>> 0; Math.random = () => {a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296;};};
  if (!C.defaut && REG) {APPLYING = true; try {applySaved({enregistreLe: new Date(0).toISOString(), groupes: JSON.parse(JSON.stringify(REG))});} finally {APPLYING = false;}}
  const NIV1 = GROUPES.niv[1].gr.slice();
  // --- causes : enveloppes posées le temps du diagnostic ---
  let TAG = new Map();
  const tag = (o, c) => {if (!TAG.has(o)) TAG.set(o, c);};
  const orig = {voitForeuse, ouvrProvoque, raiseAlarm, tryMove};
  voitForeuse = function (o, ch) {const r = orig.voitForeuse.apply(this, arguments);
    if (r && !ch) tag(o, (lastAct === 'dig' || lastAct === 'tir') && !los(o.x, o.y, G.px, G.py) ? 'bruit' : 'vue'); return r;};
  ouvrProvoque = function (id, zone) {const P = G.patr && G.patr[id], avant = P && P.ouv;
    for (const o of [...G.beasts, ...G.animals]) if (o.gi === +id) tag(o, zone ? 'périmètre' : 'coup');
    return orig.ouvrProvoque.apply(this, arguments);};
  raiseAlarm = function (b) {for (const o of [...G.beasts, ...G.animals]) if (o !== b && cheb(o, b.x, b.y) <= ALARM_R) tag(o, 'cri');
    return orig.raiseAlarm.apply(this, arguments);};
  tryMove = function (dx, dy) {const c = beastAt(G.px + dx, G.py + dy) || animalAt(G.px + dx, G.py + dy); if (c) tag(c, 'coup');
    return orig.tryMove.apply(this, arguments);};
  const remet = () => {voitForeuse = orig.voitForeuse; ouvrProvoque = orig.ouvrProvoque; raiseAlarm = orig.raiseAlarm; tryMove = orig.tryMove;};
  const chasse = o => G.beasts.includes(o) ? o.hunt > 0 && !aOuvrage(o) : !!o.aware;
  const nomGr = o => {const g = GROUPES.liste[o.gr]; return g ? g.n : '?';};
  const roleDe = o => o.role || '';
  const SPN = o => G.beasts.includes(o) ? BEASTS[o.sp].key : 'puce';
  // --- carte ---
  function carte(s) {graine(s); recRange(); recPrend('atterrissage'); hasardReglages(); enJeu(newGame, 1);
    fog = true; started = true; $('overlay').hidden = true; G.st.vie = G.st.vieMax = 100000; computeFOV();}
  // emprise des zones : part de l'extérieur praticable couverte par 0, 1, 2+ périmètres (épaves avec ouvriers)
  function zones() {let ext = 0, z1 = 0, z2 = 0; const occ = G.epaves.map((e, k) => k).filter(k => G.epaves[k].groupes.length);
    for (let i = 0; i < W * H; i++) {if (!canWalk(G.t[i], true) || lieuDe(i) !== 'ext') continue; ext++; const x = i % W, y = (i / W) | 0;
      const n = occ.filter(k => ouvrDist(G.epaves[k], x, y) <= OUVR_R).length; if (n >= 1) z1++; if (n >= 2) z2++;}
    // écart entre deux épaves occupées (bord à bord) : le plus petit, par épave
    const ec = occ.map(k => Math.min(99, ...occ.filter(j => j !== k).map(j => {const a = G.epaves[k], b = G.epaves[j];
      return Math.max(0, a.x - (b.x + b.w), b.x - (a.x + a.w), a.y - (b.y + b.h), b.y - (a.y + a.h));})));
    return {epaves: G.epaves.length, occupees: occ.length, ext, dansZone: +(z1 / ext * 100).toFixed(1), deuxZones: +(z2 / ext * 100).toFixed(1),
      ecartMin: ec.length ? Math.min(...ec) : null, ecartMoy: ec.length ? +(ec.reduce((a, b) => a + b, 0) / ec.length).toFixed(1) : null};}
  function population() {const gr = {}; for (const o of [...G.beasts, ...G.animals]) {if (o.gi == null) continue; const k = o.gi;
      gr[k] = gr[k] || {nom: nomGr(o), role: roleDe(o), n: 0, sp: {}, lieu: lieuDe(idx(o.x, o.y)), epave: o.epave ?? -1}; gr[k].n++; gr[k].sp[SPN(o)] = (gr[k].sp[SPN(o)] || 0) + 1;}
    return gr;}
  // --- marche : un pas vers la cible par le plus court chemin (cases libres, interdits évités) ---
  function bfs(but, interdit) {const d = new Int32Array(W * H).fill(-1), q = [but]; d[but] = 0;
    for (let k = 0; k < q.length; k++) {const c = q[k], x = c % W, y = (c / W) | 0;
      for (const [dx, dy] of DIRS) {const a = x + dx, b = y + dy; if (a < 1 || b < 1 || a >= W - 1 || b >= H - 1) continue; const j = idx(a, b);
        if (d[j] >= 0 || !diagOk(x, y, dx, dy) || !canWalk(G.t[j], true) || (interdit && interdit[j])) continue; d[j] = d[c] + 1; q.push(j);}}
    return d;}
  function pas(d) {const h = d[idx(G.px, G.py)]; let best = null, bv = h < 0 ? 1e9 : h;
    for (const [dx, dy] of DIRS) {const x = G.px + dx, y = G.py + dy, v = d[idx(x, y)]; if (v < 0 || v >= bv || !diagOk(G.px, G.py, dx, dy)) continue;
      if (beastAt(x, y) || animalAt(x, y)) continue; bv = v; best = [dx, dy];}
    if (best) tryMove(best[0], best[1]); else waitTurn();}
  const attendre = () => waitTurn();
  // --- journal des chasses ---
  let VISITE = new Set();
  function suivi(nom, cible) {VISITE = new Set();const J = {scene: nom, evts: [], fin: {}, max: 0, maxGr: 0, t0: G.turn, etats: []}; const en = new Map();
    const tour = (lib) => {const t = G.turn - J.t0, gr = new Set(); G.epaves.forEach((e, k) => {if (ouvrDist(e, G.px, G.py) <= OUVR_R) VISITE.add(k);});
      for (const o of [...G.beasts, ...G.animals]) {const c = chasse(o); if (c) gr.add(o.gi);
        if (c && !en.has(o)) {let cause = TAG.get(o) || null;
          if (!cause && G.beasts.includes(o) && o.nd) cause = 'renfort';
          if (!cause && G.beasts.includes(o) && BEASTS[o.sp].pack && mates(o).some(m => TAG.get(m) === 'vue')) cause = 'meute';
          if (!cause) cause = 'autre';
          en.set(o, t); J.evts.push({t, gi: o.gi, nom: nomGr(o), role: roleDe(o), sp: SPN(o), d: cheb(o, G.px, G.py), cause, lieu: lieuDe(idx(o.x, o.y)),
            epave: o.epave ?? -1, cible: cible != null && o.epave === cible, act: lib, zone: o.epave != null && VISITE.has(o.epave)});}
        else if (!c && en.has(o)) {J.fin[J.evts.findIndex(e => e.t === en.get(o) && e.gi === o.gi)] = t; en.delete(o);}}
      const n = [...en.keys()].filter(o => G.beasts.includes(o) || G.animals.includes(o)).length; J.max = Math.max(J.max, n); J.maxGr = Math.max(J.maxGr, gr.size);
      if (cible != null) {const ids = G.epaves[cible].groupes; J.etats.push(ids.map(id => (G.patr[id] || {}).ouv || '-').join('/'));}
      TAG = new Map();};
    return {J, tour, encore: () => [...en.keys()].filter(o => G.beasts.includes(o) || G.animals.includes(o)).length};}
  function cibleEpave() {const d = bfs(idx(G.px, G.py)); let best = -1, bv = 1e9;
    G.epaves.forEach((e, k) => {const vivants = e.groupes.filter(id => [...G.beasts, ...G.animals].some(o => o.gi === id)); if (!vivants.length) return;
      let m = 1e9; for (let y = e.y - OUVR_R; y <= e.y + e.h - 1 + OUVR_R; y++) for (let x = e.x - OUVR_R; x <= e.x + e.w - 1 + OUVR_R; x++) {
        if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) continue; const v = d[idx(x, y)]; if (v >= 0 && v < m) m = v;}
      if (m < bv) {bv = m; best = k;}});
    return best;}
  const evite = (sauf, r) => {const m = new Uint8Array(W * H); G.epaves.forEach((e, k) => {if (k === sauf || !e.groupes.length) return;
      for (let y = e.y - r; y <= e.y + e.h - 1 + r; y++) for (let x = e.x - r; x <= e.x + e.w - 1 + r; x++) if (x >= 0 && y >= 0 && x < W && y < H) m[idx(x, y)] = 1;});
    m[idx(G.px, G.py)] = 0; return m;};
  const bfsE = (but, m) => {const d = bfs(but, m); return d[idx(G.px, G.py)] >= 0 ? d : bfs(but);};
  function sceneAB(s, sortieAlerte) {carte(s); const k = cibleEpave(); if (k < 0) return {scene: sortieAlerte ? 'b' : 'a', rien: 'aucune épave occupée joignable'};
    const e = G.epaves[k], S = suivi(sortieAlerte ? 'b' : 'a', k), J = S.J; J.epave = {k, nom: epNom(e), grs: e.groupes.slice()};
    // case du périmètre la plus proche, joignable
    const but = (() => {const d = bfs(idx(G.px, G.py)); let b = -1, bv = 1e9;
      for (let y = e.y - OUVR_R; y <= e.y + e.h - 1 + OUVR_R; y++) for (let x = e.x - OUVR_R; x <= e.x + e.w - 1 + OUVR_R; x++) {
        if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) continue; const i = idx(x, y), v = d[i]; if (v >= 0 && v < bv && canWalk(G.t[i], true)) {bv = v; b = i;}}
      return b;})();
    let n = 0; const D = bfsE(but, evite(k, OUVR_R + 1)); J.marche = 0;
    while (ouvrDist(e, G.px, G.py) > OUVR_R && n++ < 300 && !G.over) {pas(D); S.tour('marche'); J.marche++;}
    J.entre = G.turn - J.t0; J.alerteA = null;
    for (let i = 0; i < 3; i++) {if (sortieAlerte && e.groupes.some(id => G.patr[id] && G.patr[id].ouv)) break;
      if (ouvrDist(e, G.px, G.py) <= OUVR_R) attendre(); else pas(D); S.tour('dedans');}
    // sortie : 10 cases au moins de la position, en s'éloignant de l'épave (18 à 26 pas)
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2, ev = evite(k, OUVR_R + 1), d0 = bfs(idx(G.px, G.py), ev);
    let sortie = -1, sv = -1e9; for (let i = 0; i < W * H; i++) {const v = d0[i]; if (v < 18 || v > 26) continue; const x = i % W, y = (i / W) | 0;
      const sc = Math.hypot(x - cx, y - cy); if (sc > sv) {sv = sc; sortie = i;}}
    const D2 = sortie >= 0 ? bfsE(sortie, ev) : null; n = 0;
    while (D2 && idx(G.px, G.py) !== sortie && n++ < 60 && !G.over) {pas(D2); S.tour('sortie');}
    J.sortie = G.turn - J.t0;
    for (let i = 0; i < 60 && !G.over; i++) {attendre(); S.tour('loin');}
    J.encoreEnChasse = S.encore(); J.etatFinal = e.groupes.map(id => (G.patr[id] || {}).ouv || '-');
    J.ouvVu = J.etats.join(' '); return J;}
  function sceneC(s) {carte(s); const S = suivi('c', null), J = S.J; if (G.sas == null) return {scene: 'c', rien: 'pas de sas'};
    const interdit = evite(-1, OUVR_R + 1);
    let D = bfs(G.sas, interdit); J.libre = D[idx(G.px, G.py)] >= 0; if (!J.libre) D = bfs(G.sas);   // pas de chemin propre : le plus court
    let n = 0, minC = 99; while (idx(G.px, G.py) !== G.sas && n++ < 400 && !G.over) {pas(D); S.tour('marche');
      for (const e of G.epaves.filter(e => e.groupes.length)) minC = Math.min(minC, ouvrDist(e, G.px, G.py));}
    J.arrive = idx(G.px, G.py) === G.sas; J.marche = n; J.coqueMin = minC;
    for (let i = 0; i < 20 && !G.over; i++) {attendre(); S.tour('sas');}
    return J;}
  const R = {groupesNiv1: NIV1, cartes: []};
  try {
    for (let s = C.g0; s < C.g0 + C.n; s++) {const c = {graine: s};
      carte(s); c.zones = zones(); c.pop = population(); c.menace = G.menace.pose; c.saute = G.menace.saute;
      if (C.scenes.includes('a')) c.a = sceneAB(s, false);
      if (C.scenes.includes('b')) c.b = sceneAB(s, true);
      if (C.scenes.includes('c')) c.c = sceneC(s);
      R.cartes.push(c);}
  } finally {remet(); Math.random = vrai; window.requestAnimationFrame = raf; genRemet(sauveGen);}
  return JSON.stringify(R);
})()
