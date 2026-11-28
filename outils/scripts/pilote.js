/* Pilote automatique de partie entière (28 novembre 2026, chantier « Survie », bloc A).
   Chargé une fois dans la page par outils/pilote.py, il définit window.pilotePartie({profil, graine, plafond}) : une partie complète
   (niveau 1 → descente → niveau 2 → mini-jeu des mines → niveau 3 → noyau), jouée par le vrai moteur, sans dessin ni son, hasard semé.
   Il ne change aucune règle : il appelle les mêmes fonctions que le clavier (tryMove, waitTurn, askDrill, invEquip, termFait, fabFais…)
   et observe (vie, énergie, Matière, battements) par des enveloppes posées autour de fonctions du jeu.

   Deux profils :
   - prudent : explore tout ce qui s'atteint sans forer, contourne les groupes calmes (pénalité de trajet autour d'eux), attend l'ennemi
     plutôt que de foncer, se replie et se soigne quand la vie est basse, mine les éclats quand la vie n'est pas pleine, lit les terminaux
     (DATA, HACK, BLUEPRINT), passe au FABLAB (réparobots), utilise une station de réparation ;
   - fonceur : connaît la position du site (signal de l'orbiteur), y va tout droit en forant au besoin, frappe tout ce qui est à côté de lui
     ou en travers de sa route, ne se soigne jamais.

   Points d'accroche pour les règles des blocs suivants (aujourd'hui sans effet si la règle n'existe pas) :
   - piloteBesoinRepos(P) : faut-il se reposer maintenant (repos qui soigne) ? Renvoie true pour attendre sur place.
   - piloteBesoinFuel(P)  : faut-il aller miner du fuel ? Renvoie une liste de cases cibles (gisements) ou null.
   - piloteTir(P, cibles)  : tirer sur un ennemi à distance ? Renvoie true si une action a été jouée.
   - PILOTE_MESURES : fonctions appelées à chaque battement pour mesurer de nouvelles grandeurs (ex. fuel). */
(() => {
if (window.pilotePartie) return 'déjà chargé';
const PIL = window.PIL = {ctx: [], R: null, seule: false};
const raf0 = window.requestAnimationFrame;
const graine = s => {let a = s >>> 0; Math.random = () => {a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
  PIL.tir = (PIL.tir || 0) + 1; t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296;};};

/* ---------- Sans dessin ni son ---------- */
window.requestAnimationFrame = () => 0;
render = () => {}; side = () => {}; try {mini = () => {};} catch (e) {}
addFx = () => {}; try {logDraw = () => {};} catch (e) {}
for (const k in SFX) if (typeof SFX[k] === 'function') SFX[k] = () => {};
try {explode = () => {};} catch (e) {}
const STOCK = {}; for (let i = 0; i < localStorage.length; i++) {const k = localStorage.key(i); STOCK[k] = localStorage.getItem(k);}
// chaque partie repart du même navigateur : stockage remis, journal de bord relu (il tire au hasard selon ce qu'il contient déjà)
const stockRemet = () => {localStorage.clear(); for (const k in STOCK) localStorage.setItem(k, STOCK[k]);
  if (typeof jnCharge === 'function') jnCharge(); if (typeof SAV_GARDE !== 'undefined') SAV_GARDE = null;};

/* ---------- Points d'accroche (blocs suivants du chantier survie) ---------- */
/* Repos qui soigne (bloc B, 28 novembre 2026 : +1 vie / 4 battements au repos tant qu'il reste du fuel). Le prudent se met au repos
   sous 60 % de vie, sans chasseur, avec du fuel au-dessus de l'alerte (25 %) ; il le tient jusqu'à 95 % de vie (comme le bouton
   REPOS, qui s'arrête au plein, au chasseur et à l'alerte du fuel). Le fonceur ne se repose jamais. */
window.piloteBesoinRepos = window.piloteBesoinRepos || (P => {
  if (P.profil !== 'prudent' || typeof REGLES === 'undefined') return false;
  const st = G.st, fuelOk = st.fuel >= st.fuelMax * REGLES.FUEL_ALERTE;
  if (P.chasseurs.length || !fuelOk) {P.enRepos = false; return false;}
  if (P.enRepos) {if (st.vie >= st.vieMax * .95) P.enRepos = false;}
  else if (st.vie < st.vieMax * .6) P.enRepos = true;
  return P.enRepos;});
/* Fuel à miner (bloc B) : sous 40 % de fuel, le pilote va au gisement d'éclats de métal connu le plus proche (dans la paroi ou au
   sol). Connus : tous après l'onde du sonar d'arrivée, sinon ceux des cases déjà vues. */
window.PILOTE_FUEL_CASES = window.PILOTE_FUEL_CASES || (() => {const l = [];
  for (const k in G.ore || {}) {const o = G.ore[k], i = +k; if (oreMat(o)) continue; if (G.sonar !== 2 && !G.seen[i]) continue;
    const x = i % W, y = (i / W) | 0; if (!oreSol(o) && (x <= 0 || y <= 0 || x >= W - 1 || y >= H - 1)) continue; l.push(i);}
  return l;});
window.piloteBesoinFuel = window.piloteBesoinFuel || (P => {
  if (G.st.fuel == null || !window.PILOTE_FUEL_CASES) return null;
  const mx = G.st.fuelMax || 100; if (G.st.fuel >= mx * .4) return null; const l = window.PILOTE_FUEL_CASES(); return l.length ? l : null;});
window.piloteTir = window.piloteTir || ((P, cibles) => false);   // arme de tir : à écrire quand elle existe (tir sur la cible la plus proche)
window.PILOTE_MESURES = window.PILOTE_MESURES || [];

/* ---------- Mesures : enveloppes autour des fonctions du jeu ---------- */
const ctx = () => PIL.ctx[PIL.ctx.length - 1] || null;
const enveloppe = (nom, f) => {const o = window[nom]; if (typeof o !== 'function') return;
  window[nom] = function (...a) {const c = f(...a); if (c) PIL.ctx.push(c); try {return o.apply(this, a);} finally {if (c) PIL.ctx.pop();}};};
enveloppe('hurtRobot', (b, sp) => ({t: 'ennemi', nom: (sp || BEASTS[b.sp]).n, gi: b.gi}));
enveloppe('explose', b => ({t: 'ennemi', nom: BEASTS[b.sp].n, gi: b.gi}));
enveloppe('effTick', () => ({t: G.eff && (G.eff.repar || G.eff.recharge) ? 'reparobots' : 'effets'}));
enveloppe('machTick', () => ({t: 'laser'}));
enveloppe('machBump', () => ({t: 'station'}));
enveloppe('invEquip', () => ({t: 'objet'}));
enveloppe('consoCible', () => ({t: 'objet'}));
enveloppe('viseeOk', () => ({t: 'objet'}));
enveloppe('tryMove', () => ({t: 'eclats'}));        // les seuls gains de vie dans un pas, hors enveloppes ci-dessus : les éclats ramassés
enveloppe('forageFrame', () => ({t: 'descente'}));
enveloppe('niveauSuivant', () => ({t: 'descente'}));            // +30 de fuel à l'arrivée (bloc B)
enveloppe('survieTick', w => ({t: w ? 'repos' : 'marche'}));      // vie qui remonte seule, fuel qui baisse, pertes à sec (bloc B)
{const o = battement; battement = function (w) {const R = PIL.R; if (R && R.niv) {R.niv.bat++; if (G.st.energie < 1) R.niv.e0++;
    if (w) R.niv.repos++; if (G.st.fuel <= 0) R.niv.sec++;
    for (const f of PILOTE_MESURES) try {f(R.niv);} catch (e) {}}
  return o.apply(this, arguments);};}
// source d'une perte de vie : l'ennemi (par espèce), le laser, la descente, le poison, un objet ; le reste : « autre »
const cle = c => !c ? 'autre' : c.t === 'ennemi' ? 'ennemi:' + c.nom : c.t === 'effets' || c.t === 'reparobots' ? 'poison'
  : c.t === 'repos' || c.t === 'marche' ? 'fuel à sec'
  : ['laser', 'descente', 'objet'].includes(c.t) ? c.t : 'autre';
function surveille(st) {if (st.__pil) return; let v = st.vie, m = st.matiere || 0, fu = st.fuel;
  Object.defineProperty(st, '__pil', {value: 1, enumerable: false});
  // mode « immortel » (mesure de la durée pure d'un niveau) : à 0, la vie repart au maximum ; les pertes sont comptées en entier
  Object.defineProperty(st, 'vie', {enumerable: true, configurable: true, get: () => v, set: n => {const R = PIL.R, d = n - v; let sauve = false;
    if (R && R.immortel && n < 1) {n = st.vieMax; sauve = true; R.sauvetages = (R.sauvetages || 0) + 1;} v = n;   // « nouvelle vie » : le pilote garde un comportement normal
    if (!R || !R.niv || !d) return; const N = R.niv, c = ctx();
    if (d > 0) {const k = c && c.t !== 'ennemi' ? c.t : 'autre'; N.rendu[k] = (N.rendu[k] || 0) + d;}
    else {const k = cle(c); N.perdu[k] = (N.perdu[k] || 0) - d; R.dernier = k; if (sauve) {N.morts = (N.morts || 0) + 1; if (!N.mortIci) {N.mortIci = k; N.mortBat = N.bat;}}
      if (c && c.t === 'ennemi' && c.gi != null) {N.grAff.add(c.gi); N.grVie[c.gi] = (N.grVie[c.gi] || 0) - d;}}}});
  // fuel gagné par source (éclats, cellule, descente) et consommé
  Object.defineProperty(st, 'fuel', {enumerable: true, configurable: true, get: () => fu, set: n => {const d = n - (fu || 0); fu = n;
    const R = PIL.R; if (!R || !R.niv || !d || fu == null) return; const N = R.niv, c = ctx();
    if (d > 0) {const k = !c ? 'autre' : c.t === 'eclats' ? 'eclats' : c.t === 'objet' ? 'cellule' : c.t === 'descente' ? 'descente' : c.t;
      N.fuelGagne[k] = (N.fuelGagne[k] || 0) + d;} else N.fuelConso -= d;}});
  Object.defineProperty(st, 'matiere', {enumerable: true, configurable: true, get: () => m, set: n => {const d = n - m; m = n;
    const R = PIL.R; if (R && R.niv && d > 0) R.niv.matiere += d;}});}

/* ---------- Outils de décision ---------- */
const cheb = (a, b, x, y) => Math.max(Math.abs(a - x), Math.abs(b - y));
const visible = o => vis[idx(o.x, o.y)];
function ennemisVus() {const l = [];
  for (const b of G.beasts || []) if (visible(b) && !beastCache(b)) l.push({o: b, b: 1, sp: BEASTS[b.sp], chasse: b.hunt > 0 && !aOuvrage(b)});
  for (const a of G.animals || []) if (visible(a)) l.push({o: a, b: 0, sp: SPECIES[a.sp], chasse: !!a.aware && !!a.enraged});
  return l;}
const frappable = o => cheb(o.x, o.y, G.px, G.py) === 1 && diagOk(G.px, G.py, Math.sign(o.x - G.px), Math.sign(o.y - G.py));
const bord = (x, y) => x <= 0 || y <= 0 || x >= W - 1 || y >= H - 1;
const forable = v => v === ROCK || v === MOUNT;
// coût d'une case de roche dans un trajet : deux coups (2 × 10 d'énergie) à ~1 d'énergie par battement, soit une dizaine de pas
const FORER_COUT = 12;
/* Dijkstra depuis la foreuse. o.inconnu : cases jamais vues praticables ; o.forer : roche (pas au bord) praticable, plus chère ;
   o.evite : Float32Array de pénalités ; o.cibles : Set de cases bloquantes qu'on peut prendre comme destination (terminal, roche à éclats…). */
function dijkstra(o) {o = o || {}; const N = W * H, d = new Float64Array(N).fill(Infinity), pr = new Int32Array(N).fill(-1), h = heap(), s0 = idx(G.px, G.py);
  const cles = nbCles() > 0, cib = o.cibles || null; d[s0] = 0; h.push(s0, 0);
  while (h.size) {const [dc, c] = h.pop(); if (dc > d[c]) continue; if (cib && cib.has(c) && c !== s0) continue;   // une cible bloquante est un cul-de-sac
    const x = c % W, y = (c / W) | 0;
    for (const [dx, dy] of DIRS) {const a = x + dx, b = y + dy; if (a < 0 || b < 0 || a >= W || b >= H) continue; const j = idx(a, b), v = G.t[j];
      const unk = fog && !G.seen[j]; if (!diagOk(x, y, dx, dy)) continue;   // coins de paroi : le pilote les connaît (sinon il bute dessus)
      let w = dx && dy ? 1.001 : 1;
      if (j === o.but) {}
      else if (cib && cib.has(j)) w += forable(v) ? 2 : 0;
      else if (unk) {if (!o.inconnu) continue; w += .3;}
      else if (v === LOCK) {if (!cles) continue;}
      else if (forable(v)) {if (!o.forer || bord(a, b)) continue; w += FORER_COUT;}
      else if (blocks(v)) continue;
      else if (v === DEEP) w += 6; else if (v === LIQ) w += .4;
      if (!unk && G.vit && G.vit[j] === 1) continue;
      if (!(cib && cib.has(j)) && j !== o.but) {const oc = occupant(a, b); if (oc) {if (!o.traverser) continue; w += 3;}}
      if (o.evite) w += o.evite[j];
      const nd = dc + w; if (nd < d[j]) {d[j] = nd; pr[j] = c; h.push(j, nd);}}}
  return {d, pr, s0};}
function premierPas(D, c) {if (D.d[c] === Infinity || c === D.s0) return null; while (D.pr[c] !== D.s0) {c = D.pr[c]; if (c < 0) return null;} return c;}
// une action : renvoie true si le temps du jeu a avancé
function joue(f) {const t = G.time, tu = G.turn; f(); return G.time !== t || G.turn !== tu || !!G.over;}
function vers(c) {const nx = c % W, ny = (c / W) | 0; return joue(() => tryMove(nx - G.px, ny - G.py));}
const attendre = () => joue(() => waitTurn());
function fermerTout() {if (TERM) closeTerminal(); if (!$('fabric').hidden) fabClose(); if (typeof VISEE !== 'undefined' && VISEE) VISEE = null;}

/* ---------- Gestes « simples » : terminaux, FABLAB, objets ---------- */
function termUtilise(i, P) {const N = PIL.R.niv; termOuvre(i); if (!TERM) return false; const m = TERM.m; N.term++;
  if (P.profil !== 'prudent') {try {if (m.act) for (let n = 0; n < m.act.length; n++) if (!m.act[n].fait && termAgit(m, n)) N.termAct = (N.termAct || 0) + 1;} catch (e) {}
    P.termFait.add(i); closeTerminal(); return true;}
  try {
    if (!m.data && m.s !== 'antenne') {termFait('data'); N.termData++;}
    if (m.s === 'terminal' && !m.hack) {if (termFait('hack') && m.hkChoix && m.hkChoix.length && !m.hack) {hackPrend(m, m.hkChoix[0]); if (m.hack) N.hacks++;}}
    if (m.act) for (let n = 0; n < m.act.length; n++) if (!m.act[n].fait && termAgit(m, n)) {N.termAct = (N.termAct || 0) + 1; termMenu();}
    if (m.s === 'terminal' && !m.bp) {if (termFait('bp') && m.bpChoix && m.bpChoix.length && !m.bp) {
      const k = m.bpChoix.includes('repar') ? 'repar' : m.bpChoix[0]; bpPrend(m, k); if (m.bp) N.plans++;}}
  } catch (e) {N.erreurs.push('terminal : ' + e.message);}
  P.termFait.add(i); closeTerminal(); return true;}
function fabUtilise(i, P) {const N = PIL.R.niv; P.fabFait.add(i); fabOpen(i); N.fablab++;
  try {const l = fabListe(i); for (let t = 0; t < 3; t++) {const k = l.find(k => k === 'repar') || null; if (!k) break;
      const n = (G.inv.find(o => o.k === 'repar') || {}).n || 0; if (n >= 3 || (G.st.matiere || 0) < FAB_PRIX[k]) break;
      fabFais(l.indexOf(k)); N.fabrique[k] = (N.fabrique[k] || 0) + 1;}} catch (e) {N.erreurs.push('fablab : ' + e.message);}
  fabClose();}
function utilise(k) {const i = G.inv.findIndex(o => o.k === k); if (i < 0) return false; const d = ITEMS[k], N = PIL.R.niv, n0 = G.inv.length,
    nn = (G.inv[i].n || 1), t0 = G.time;
  if (d.vise) {viseeStart(i); if (VISEE) {VISEE.x = G.px; VISEE.y = G.py; viseeOk();}} else invEquip(i);
  if (typeof VISEE !== 'undefined' && VISEE) VISEE = null;
  const fait = G.inv.length < n0 || ((G.inv[i] && G.inv[i].k === k) ? (G.inv[i].n || 1) < nn : true) || G.time !== t0;
  if (fait) N.objets[k] = (N.objets[k] || 0) + 1; return fait;}
// sac presque plein : le pilote jette d'abord l'équipement non porté, puis un exemplaire du consommable le plus nombreux (jamais réparobots ni clé)
function gererSac(P) {if (sacPlaces() < SAC_MAX - 1) return;
  const rang = o => {const d = ITEMS[o.k]; if (!d || o.eq || o.k === 'cle' || o.k === 'repar' || d.hack) return -1;
    if (!d.conso) return 30; return ((o.n || 1) > 3 ? 20 : 0) + (o.n || 1);};   // puis le consommable le plus nombreux
  let i = -1, b = -1; G.inv.forEach((o, k) => {const r = rang(o); if (r > b) {b = r; i = k;}}); if (i < 0) return;
  const avant = {}; for (const c in G.items || {}) avant[c] = (G.items[c] || []).length; const k = G.inv[i].k; invDrop(i);
  for (const c in G.items || {}) if ((G.items[c] || []).length > (avant[c] || 0)) P.jetes.add(+c);   // la case où l'objet est tombé
  PIL.R.niv.jetes[k] = (PIL.R.niv.jetes[k] || 0) + 1;}
function equiper() {for (let i = 0; i < G.inv.length; i++) {const o = G.inv[i], d = ITEMS[o.k];
  if (!d || o.eq || d.conso || d.hack || !d.slot || !SLOTS[d.slot]) continue;
  if (G.inv.some(x => x.eq && ITEMS[x.k] && ITEMS[x.k].slot === d.slot)) continue;
  invEquip(i); if (o.eq) PIL.R.niv.equipe.push(o.k);}}

/* ---------- La décision d'un pas ---------- */
function cibleEcl(i) {const o = G.ore && G.ore[i]; return o && !oreSol(o) && !oreMat(o);}
function choixPrudent(P, forer) {
  const prud = P.profil === 'prudent', sacLibre = sacPlaces() < SAC_MAX, st = G.st, plein = !(st.fuel < st.fuelMax), cib = new Set(), but = new Map(), sonar = G.sonar === 2;
  // pénalité autour des groupes calmes en vue (et de ceux vus récemment, mémorisés)
  const ev = new Float32Array(W * H);
  for (const [k, p] of P.tireurs) {if (G.turn - p.t > 80 || !(G.beasts || []).includes(k)) {P.tireurs.delete(k); continue;}
    for (let y = Math.max(0, p.y - p.r); y <= Math.min(H - 1, p.y + p.r); y++) for (let x = Math.max(0, p.x - p.r); x <= Math.min(W - 1, p.x + p.r); x++)
      ev[idx(x, y)] += 25;}   // zone de tir d'un tireur qui nous a pris pour cible
  for (const [k, p] of P.calmes) {if (G.turn - p.t > 40) {P.calmes.delete(k); continue;}
    const r = p.r || 5;
    for (let y = Math.max(0, p.y - r); y <= Math.min(H - 1, p.y + r); y++) for (let x = Math.max(0, p.x - r); x <= Math.min(W - 1, p.x + r); x++)
      ev[idx(x, y)] += 12 / (1 + cheb(x, y, p.x, p.y));}
  // destinations : cases d'où l'on découvre, butin, terminaux, FABLAB, station, éclats dans la roche
  for (let i = 0; i < W * H; i++) {if (!G.seen[i]) continue; const v = G.t[i], x = i % W, y = (i / W) | 0;
    if (v === LEVIER && !P.levFait.has(i)) {cib.add(i); but.set(i, 'levier'); continue;}   // un levier peut poser un pont, ouvrir une grille
    if ((v === TERMINAL || v === ANTENNA) && !P.termFait.has(i))   // le fonceur n'y vient que bloqué, pour la CONNEXION (portes, lasers)
      {cib.add(i); but.set(i, 'term'); continue;}
    if (prud && v === FABRIC && !P.fabFait.has(i) && (G.st.matiere || 0) >= 20) {cib.add(i); but.set(i, 'fab'); continue;}
    if (prud && v === STATION && !(G.art && G.art[i]) && st.vie < st.vieMax * .6) {cib.add(i); but.set(i, 'station'); continue;}
    // éclats dans la paroi : du fuel depuis le bloc B ; le prudent les mine en passant sous 75 % de fuel
    if (prud && sonar && forable(v) && !bord(x, y) && cibleEcl(i) && st.fuel < st.fuelMax * .75) {cib.add(i); but.set(i, 'eclat'); continue;}
    if (blocks(v)) continue;
    if (G.cles && G.cles[i]) {but.set(i, 'cle'); continue;}
    if (G.items && G.items[i] && G.items[i].length && (sacLibre && !P.jetes.has(i) || G.items[i].includes('cle')) && !(G.pieges || []).some(p => p.on && p.c === i) && !(G.vit && G.vit[i])) {but.set(i, 'objet'); continue;}
    const o = G.ore && G.ore[i]; if (o && oreSol(o) && (oreMat(o) || !plein)) {but.set(i, 'sol'); continue;}
    if (!P.vu.has(i)) for (const [dx, dy] of DIRS) {const a = x + dx, b = y + dy; if (a >= 0 && b >= 0 && a < W && b < H && !G.seen[idx(a, b)]) {but.set(i, 'front'); break;}}}
  const fuel = piloteBesoinFuel(P); if (fuel) for (const i of fuel) {if (!(G.ore[i] && oreSol(G.ore[i]))) cib.add(i); but.set(i, 'fuel');}
  const D = dijkstra({cibles: cib, evite: ev, forer});
  let best = -1, bd = Infinity;
  for (const [i, k] of but) {let d = D.d[i]; if (d === Infinity || i === D.s0) continue;
    if (k === 'station' || k === 'eclat' || k === 'fuel') d *= .5;   // se soigner passe avant
    if (d < bd) {bd = d; best = i;}}
  if (best >= 0) return {c: best, k: but.get(best), D};
  return null;}

function pas(P) {if (PIL.trace) PIL.trace.push([G.turn, G.px, G.py, Math.round(G.st.vie), Math.round(G.st.energie)]); if (PIL.trace && PIL.trace.length > 60) PIL.trace.shift();
  const st = G.st, N = PIL.R.niv;
  // on note les groupes rencontrés, et la position des groupes calmes
  const vus = ennemisVus();
  for (const e of vus) {if (e.o.gi != null) N.grVus.add(e.o.gi); if (!e.chasse && e.b) P.calmes.set(e.o, {x: e.o.x, y: e.o.y, t: G.turn, r: Math.max(5, e.sp.laser || 0, e.sp.glu || 0)});}
  for (const e of vus) if (e.chasse && (e.sp.laser || e.sp.glu)) P.tireurs.set(e.o, {x: e.o.x, y: e.o.y, t: G.turn, r: (e.sp.laser || e.sp.glu) + 1});
  const ch = vus.filter(e => e.chasse && !(P.ignore.get(e.o) > G.turn));
  // un tireur hors d'atteinte nous vise : on sort de sa portée
  if (P.profil === 'prudent') {const loin = vus.filter(e => e.chasse && (e.sp.laser || e.sp.glu) && P.ignore.get(e.o) > G.turn && cheb(e.o.x, e.o.y, G.px, G.py) <= (e.sp.laser || e.sp.glu));
    if (loin.length) {const r = repli(loin); if (r != null && vers(r)) {N.replis++; return true;}}}
  P.chasseurs = ch;
  equiper(); gererSac(P);
  if (G.sonar === 1 && G.turn >= (G.sonarAt || 0)) try {sonarStart();} catch (e) {}
  const prudent = P.profil === 'prudent';
  // 1. ennemis à portée de coup : on frappe (le prudent à bout de vie tente d'abord de se replier)
  const adj = vus.filter(e => frappable(e.o) && (e.chasse || (e.b && !aOuvrage(e.o) && P.profil === 'fonceur' && P.barre && P.barre.has(idx(e.o.x, e.o.y)))));
  if (prudent && st.vie < st.vieMax * .5 && !(G.eff && G.eff.repar) && G.inv.some(o => o.k === 'repar')) if (utilise('repar')) return true;
  if (prudent && st.vie < st.vieMax * .3 && ch.length) {const r = repli(ch); if (r != null && vers(r)) {N.replis++; return true;}}
  if (st.fuel < st.fuelMax * .3 && G.inv.some(o => o.k === 'fuel')) if (utilise('fuel')) return true;   // cellule de fuel (bloc B)
  if (window.piloteTir(P, ch)) return true;
  if (adj.length) {adj.sort((a, b) => (a.o.hp ?? 99) - (b.o.hp ?? 99)); const e = adj[0];
    if (e.o.gi != null) N.grAff.add(e.o.gi); N.coups++;
    if (vers(idx(e.o.x, e.o.y))) return true;}
  // 2. chasseurs en vue mais pas à portée
  if (ch.length && prudent) {const pres = ch.reduce((a, e) => Math.min(a, cheb(e.o.x, e.o.y, G.px, G.py)), 99);
    const tireur = ch.some(e => e.sp.laser || e.sp.glu);
    // un tireur : on le rejoint pour le frapper (ou on se met hors de vue si la vie est basse) ; au contact, on les laisse venir
    if (tireur && st.vie < st.vieMax * .4) {const r = repli(ch); if (r != null && vers(r)) {N.replis++; return true;}}
    if (!tireur && pres <= 6 && P.attente < 4) {P.attente++; return attendre();}   // c'est nous qui frappons les premiers
    P.attente = 0;
    if (allerFrapper(P)) return true;}
  else P.attente = 0;
  if (piloteBesoinRepos(P)) return attendre();
  // sous 40 % de fuel, les deux profils vont miner le gisement connu le plus proche, en forant au besoin
  {const f = piloteBesoinFuel(P); if (f) {const r = allerFuel(P, f); if (r !== null) {N.versFuel = (N.versFuel || 0) + 1; return r;}}}
  // 3. le fonceur : droit au site ; s'il est hors d'atteinte (pièce fermée à clé…), il explore comme le prudent
  if (!prudent) {const r = versSite(P, true); if (r !== null) return r; return explorer(P, false) ?? explorer(P, true) ?? (P.bloque++, attendre());}
  // 4. le prudent : explorer, ramasser, utiliser ; puis le site ; s'il est hors d'atteinte, explorer en forant
  const r = explorer(P, false); if (r !== null) return r;
  const v = versSite(P, false); if (v !== null) return v;
  return explorer(P, true) ?? (P.bloque++, attendre());}

// un pas d'exploration (prudent, ou fonceur bloqué) ; null s'il n'y a plus rien à aller voir
function explorer(P, forer) {const st = G.st, N = PIL.R.niv;
  const r = choixPrudent(P, forer); if (!r) return null;
  {const {c, k, D} = r, x = c % W, y = (c / W) | 0;
    if (D.pr[c] === D.s0 && (k === 'term' || k === 'fab' || k === 'station' || k === 'eclat' || k === 'fuel' || k === 'levier')) {
      if (k === 'levier') {P.levFait.add(c); N.leviers = (N.leviers || 0) + 1; return vers(c) || attendre();}
      if (k === 'term') {termUtilise(c, P); return true;}
      if (k === 'fab') {fabUtilise(c, P); return true;}
      if (k === 'station') {N.stations++; return vers(c);}
      if (st.energie < coutE(st.cout)) return attendre();
      return vers(c);}
    const n = premierPas(D, c); if (n == null) return attendre();
    if (forable(G.t[n])) {if (st.energie < coutE(st.cout)) {if (P.profil === 'prudent' && G.inv.some(o => o.k === 'batterie') && utilise('batterie')) return true; return attendre();}}
    P.vu.add(idx(G.px, G.py)); const ok = vers(n); P.vu.add(idx(G.px, G.py)); if (!ok) P.vu.add(n); return ok || attendre();}}

// aller au gisement de fuel le plus proche, en forant au besoin ; null s'il n'y en a aucun d'atteignable
// un gisement visé plus de 200 pas sans l'atteindre (derrière un mur inconnu, roche dure…) est laissé 600 battements
function allerFuel(P, l) {const st = G.st; P.fuelVise = P.fuelVise || new Map(); P.fuelLaisse = P.fuelLaisse || new Map();
  l = l.filter(i => !(P.fuelLaisse.get(i) > G.turn)); if (!l.length) return null;
  const cib = new Set(l.filter(i => !(G.ore[i] && oreSol(G.ore[i])))), D = dijkstra({cibles: cib, forer: true, inconnu: true});
  let best = -1, bd = Infinity; for (const i of l) {const d = D.d[i]; if (d < bd && i !== D.s0) {bd = d; best = i;}}
  if (best < 0) return null;
  {const n = (P.fuelVise.get(best) || 0) + 1; P.fuelVise.set(best, n); if (n > 200) {P.fuelVise.delete(best); P.fuelLaisse.set(best, G.turn + 600); return null;}}
  if (D.pr[best] === D.s0) {if (cib.has(best) && st.energie < coutE(st.cout)) return attendre(); return vers(best) || attendre();}
  const n = premierPas(D, best); if (n == null) return null;
  if (forable(G.t[n]) && st.energie < coutE(st.cout)) return attendre();
  return vers(n) || attendre();}
// marcher vers le chasseur le plus proche (pour le frapper) ; false s'il est hors d'atteinte
function allerFrapper(P) {const e = P.chasseurs.slice().sort((a, b) => cheb(a.o.x, a.o.y, G.px, G.py) - cheb(b.o.x, b.o.y, G.px, G.py))[0];
  if (!e) return false; const j = idx(e.o.x, e.o.y), D = dijkstra({but: j}), c = premierPas(D, j);
  if (c == null || c === j) {P.ignore.set(e.o, G.turn + 30); return false;}
  // une poursuite qui n'aboutit pas (il recule, il nage) : on le laisse 40 battements
  const n = (P.poursuite.get(e.o) || 0) + 1; P.poursuite.set(e.o, n); if (n > 15) {P.poursuite.delete(e.o); P.ignore.set(e.o, G.turn + 40); return false;}
  return vers(c);}
// le pas qui éloigne le plus des chasseurs (somme des distances), sans entrer dans l'eau profonde
function repli(ch) {let best = null, bs = ch.reduce((a, e) => a + cheb(e.o.x, e.o.y, G.px, G.py), 0);
  for (const [dx, dy] of DIRS) {const x = G.px + dx, y = G.py + dy, j = idx(x, y), v = G.t[j];
    if (bord(x, y) || blocks(v) || v === DEEP || !diagOk(G.px, G.py, dx, dy) || occupant(x, y) || beastAt(x, y) || animalAt(x, y)) continue;
    const s = ch.reduce((a, e) => a + cheb(e.o.x, e.o.y, x, y), 0); if (s > bs) {bs = s; best = j;}}
  return best;}

function versSite(P, foncer) {const s = G.sites[0], st = G.st; if (!s) return null;
  const si = idx(s.x, s.y);
  if (G.px === s.x && G.py === s.y) {P.forer = true; return true;}
  // le prudent rejoint un site vu par les cases connues ; sinon (ou fonceur) : à travers l'inconnu, en forant au besoin
  let D = !foncer && s.seen ? dijkstra({but: si}) : null;
  if (!D || D.d[si] === Infinity) D = dijkstra({inconnu: true, forer: true, traverser: foncer, but: si});
  if (D.d[si] === Infinity && !foncer) D = dijkstra({inconnu: true, forer: true, traverser: true, but: si});   // une créature immobile barre le seul passage : on la frappe
  const c = premierPas(D, si); if (PIL.trace && 0) PIL.trace.push(['site', G.px, G.py, c == null ? null : [c % W, (c / W) | 0, G.t[c]], D.d[si], G.st.energie]);
  if (c == null) return null;   // site hors d'atteinte, même en forant
  P.barre = new Set([c]);
  if (forable(G.t[c]) && st.energie < coutE(st.cout)) {   // forer demande de l'énergie ; en attendant, le fonceur va frapper qui le vise
    if (foncer && P.chasseurs.length && allerFrapper(P)) return true;
    return attendre();}
  const ok = vers(c); if (!ok) {P.bloque++; if (P.bloque % 5 === 0) return attendre();} return ok;}

/* ---------- La descente : scène de forage jouée sans dessin, comme test-descente ---------- */
function descente(R) {const N = R.niv, vie0 = G.st.vie, s = G.sites[0];
  N.vieFin = Math.round(G.st.vie); N.finT = G.time; N.explore = explore(); N.tirFin = PIL.tir; N.fuelFin = Math.round(G.st.fuel ?? -1);
  N.gisementsMines = N.gisements - metal();
  if ((G.niv || 1) >= NIV_MAX) {end(s); return;}   // dernier forage : la barre « Forage en cours » est minutée (setTimeout), on va droit au noyau
  askDrill();
  const F = FORAGE; let n = 0;
  if (F) {F.sansRendu = 1; F.last = F.t0; let now = F.t0;   // horloge de la scène tenue par le pilote (33 ms par image)
    while (FORAGE && n++ < 4000) {now += 33;
      if (F.jeu) {F.kl = F.kr = 0; for (const m of F.mines) if (m.ok && m.y > F.d && m.y < F.d + F.R * .6 && Math.abs(m.x - F.cx) < 8) {if (m.x >= F.cx) F.kl = 1; else F.kr = 1; break;}}
      forageFrame(now);}
    N.descente = {jeu: !!F.jeu, mines: F.touche || 0, perdu: Math.round(vie0 - G.st.vie)};}
  if (!G.over && !$('overlay').hidden && (G.niv || 1) <= NIV_MAX && !(G.over && G.over.win)) $('overlay').hidden = true;}

const metal = () => Object.values(G.ore || {}).filter(o => !oreMat(o)).length;
function nouveauNiveau(R) {const N = {niv: G.niv || 1, recette: G.recette, amb: G.amb || '', bat: 0, e0: 0, debT: G.time, vieDebut: Math.round(G.st.vie),
    fuelDebut: Math.round(G.st.fuel ?? -1), fuelFin: null, fuelGagne: {}, fuelConso: 0, sec: 0, repos: 0, gisements: metal(), gisementsMines: 0,
    perdu: {}, rendu: {}, grVus: new Set(), grAff: new Set(), grVie: {}, matiere: 0, objets: {}, term: 0, termData: 0, hacks: 0, plans: 0,
    fablab: 0, fabrique: {}, jetes: {}, stations: 0, coups: 0, replis: 0, equipe: [], erreurs: [], descente: null, groupesNiveau: 0};
  {const s = new Set(); for (const b of G.beasts || []) if (b.gi != null) s.add(b.gi); for (const a of G.animals || []) if (a.gi != null) s.add(a.gi); N.groupesNiveau = s.size;}
  {let x = 2166136261; const t = G.t; for (let i = 0; i < t.length; i++) {x ^= t[i]; x = Math.imul(x, 16777619);}
   N.tirDebut = PIL.tir; for (const b of G.beasts) {x ^= b.x * 131 + b.y * 7 + b.sp; x = Math.imul(x, 16777619);} N.carte = (x >>> 0).toString(16);}   // empreinte de la carte
  R.niveaux.push(N); R.niv = N; surveille(G.st); return N;}
function explore() {let vu = 0, tot = 0; for (let i = 0; i < W * H; i++) {const v = G.t[i]; if (blocks(v) && !(v === LOCK || v >= MACHINE)) continue; tot++; if (G.seen[i]) vu++;}
  return Math.round(vu / Math.max(1, tot) * 100);}
function finNiveau(N) {if (N.explore == null) N.explore = explore();
  if (N.fuelFin == null) {N.fuelFin = Math.round(G.st.fuel ?? -1); N.gisementsMines = N.gisements - metal();}
  const gv = N.grVie, aff = [...N.grAff]; N.grVus = N.grVus.size; N.grAff = aff.length;
  N.bloque = PIL.P ? PIL.P.bloque : 0; N.vieParGroupe = aff.map(g => Math.round(gv[g] || 0)); delete N.grVie;
  for (const o of [N.perdu, N.rendu, N.fuelGagne]) for (const k in o) o[k] = Math.round(o[k] * 10) / 10;}

window.pilotePartie = function (cfg) {
  const profil = cfg.profil || 'prudent', plafond = cfg.plafond || 8000, t0 = performance.now();
  stockRemet(); graine(cfg.graine || 1); fermerTout(); FORAGE = null; drilling = false; PHASE = null;
  if (typeof TRAV !== 'undefined' && TRAV) stopTravel(); if (EXPL) stopExplore(); if (REST) stopRest();
  const R = PIL.R = {profil, graine: cfg.graine, immortel: !!cfg.immortel, niveaux: [], niv: null, dernier: null};
  const sauve = JSON.parse(JSON.stringify(GEN)); recRange(); recPrend(RECETTE_NIV(1)); GEN.recette = 'atterrissage'; enJeu(newGame, 1); genRemet(sauve);
  fog = true; started = true; $('overlay').hidden = true; computeFOV();
  let P = null, niv = 0, garde = 0, statut = null;
  while (!statut) {
    if (G.over) {statut = G.over.win ? 'noyau' : 'mort'; break;}
    if ((G.niv || 1) !== niv) {if (R.niv) finNiveau(R.niv); niv = G.niv || 1; nouveauNiveau(R);
      P = {profil, vu: new Set(), calmes: new Map(), tireurs: new Map(), jetes: new Set(), levFait: new Set(), poursuite: new Map(), ignore: new Map(), termFait: new Set(), fabFait: new Set(), attente: 0, bloque: 0, forer: false, chasseurs: [], barre: null}; PIL.P = P;}
    if (R.niv.bat > plafond || garde++ > 60000) {statut = 'bloquée';
      {const st0 = G.sites[0], c = {}; if (st0) for (let y = st0.y - 6; y <= st0.y + 6; y++) for (let x = st0.x - 6; x <= st0.x + 6; x++) {
         if (x < 0 || y < 0 || x >= W || y >= H) continue; const v = G.t[idx(x, y)]; c[v] = (c[v] || 0) + 1;}
       R.niv.diag = {pos: [G.px, G.py], site: st0 && [st0.x, st0.y, !!st0.seen], cles: nbCles(), autour: c,
         lock: Array.from(G.t).filter(v => v === LOCK).length, clesSol: Object.keys(G.cles || {}).length,
         P: {attente: P.attente, bloque: P.bloque, chasseurs: P.chasseurs.length, ignores: P.ignore.size}, journal: G.log.slice(-6).map(l => l.m)};}
      break;}
    fermerTout(); if (!$('overlay').hidden && !G.over) $('overlay').hidden = true;
    let ok = false;
    try {ok = pas(P);} catch (e) {R.niv.erreurs.push(String(e && e.stack || e).slice(0, 300)); attendre();}
    if (P.forer) {P.forer = false; descente(R); continue;}
    if (!ok) attendre();
  }
  const N = R.niv; if (N) {if (N.vieFin == null) N.vieFin = Math.round(Math.max(0, G.st.vie)); finNiveau(N);}
  const res = {profil, graine: cfg.graine, statut, niveau: G.niv || 1, tuePar: statut === 'mort' ? (G.over && G.over.forage ? 'descente' : R.dernier) : null,
    vieFin: Math.round(Math.max(0, G.st.vie)), matiere: G.st.matiere || 0, inventaire: G.inv.map(o => o.k + (o.n > 1 ? '×' + o.n : '') + (o.eq ? '*' : '')),
    ms: Math.round(performance.now() - t0), pas: garde, immortel: R.immortel, sauvetages: R.sauvetages || 0, niveaux: R.niveaux};
  PIL.R = null; G.over = G.over || {fin: 1}; $('overlay').hidden = true; return JSON.stringify(res);};
Object.assign(PIL, {choixPrudent, dijkstra, premierPas, explorer, versSite, ennemisVus});   // pour la mise au point
return 'pilote chargé';
})()
