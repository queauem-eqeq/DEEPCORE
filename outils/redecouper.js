#!/usr/bin/env node
// Redécoupe les lignes trop longues de src/js sans rien changer au programme.
//
//   NODE_PATH=/chemin/vers/node_modules node outils/redecouper.js [--ecrire] [LIMITE] [fichiers…]
//   (acorn requis : `npm i acorn` dans un dossier temporaire, puis NODE_PATH vers son node_modules)
//
// Règles, toutes sans effet sur le programme :
// - un commentaire de fin de ligne monte sur sa propre ligne, au-dessus du code ;
// - un commentaire seul trop long est replié en plusieurs lignes `//` ;
// - une ligne de code trop longue est coupée après un `;` (hors parenthèses), sinon après une `,` ;
//   les lignes de suite sont décalées de deux espaces ;
// - les lignes surtout faites de chaînes (motifs de tuiles, données) sont laissées telles quelles.
// Contrôle : l'arbre syntaxique avant et après doit être identique, sinon le fichier n'est pas écrit.
// Sans --ecrire : affiche seulement ce qui serait changé.
'use strict';
const fs = require('fs'), path = require('path'), acorn = require('acorn');

const args = process.argv.slice(2);
const ECRIRE = args.includes('--ecrire');
const nums = args.filter(a => /^\d+$/.test(a));
const LIM = nums.length ? +nums[0] : 140;
// 02b : police en données ; 07e : outils/animation_cavernes.py cherche le texte exact de cavernes()
const EXCLUS = ['02b-police-dos.js', '07e-cavernes.js'];
let fichiers = args.filter(a => a.endsWith('.js'));
if (!fichiers.length) {
  const d = path.join(__dirname, '..', 'src', 'js');
  fichiers = fs.readdirSync(d).filter(f => f.endsWith('.js') && !EXCLUS.includes(f)).sort().map(f => path.join(d, f));
}

const OPT = { ecmaVersion: 'latest', sourceType: 'script', allowHashBang: true };

function arbre(src) {
  const a = acorn.parse(src, OPT);
  return JSON.stringify(a, (k, v) => (k === 'start' || k === 'end' || k === 'loc' || k === 'range') ? undefined : v);
}

function replieCommentaire(indent, texte) {
  // texte : le commentaire complet, « // … » ; plusieurs commentaires collés (« //a     //b ») sont séparés
  const morceaux = texte.split(/\s{3,}(?=\/\/)/).map(s => s.replace(/^\/\/\s?/, '').trim());
  const out = [];
  for (const m of morceaux) {
    // un peu trop long seulement : on laisse sur une ligne plutôt que d'y laisser un mot orphelin
    if (indent.length + 3 + m.length <= LIM + 25) { out.push(indent + '// ' + m); continue; }
    const mots = m.split(/\s+/);
    let l = '';
    for (const w of mots) {
      if (l && (indent.length + 3 + l.length + 1 + w.length) > LIM) { out.push(indent + '// ' + l); l = w; }
      else l = l ? l + ' ' + w : w;
    }
    out.push(indent + '// ' + l);
  }
  return out;
}

function traite(src) {
  const toks = [], coms = [];
  acorn.parse(src, Object.assign({}, OPT, { onToken: toks, onComment: coms }));
  const lignes = src.split('\n');
  const debuts = [];
  { let p = 0; for (const l of lignes) { debuts.push(p); p += l.length + 1; } }
  const ligneDe = pos => { let lo = 0, hi = debuts.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (debuts[m] <= pos) lo = m; else hi = m - 1; } return lo; };
  // positions couvertes par un jeton ou commentaire sur plusieurs lignes : on ne touche pas ces lignes
  const bloquees = new Set();
  for (const t of [...toks, ...coms]) { const a = ligneDe(t.start), b = ligneDe(t.end); for (let i = a; i <= b && b > a; i++) bloquees.add(i); }
  const parLigne = new Map();
  for (const t of toks) { if (t.type.label === 'eof') continue; const i = ligneDe(t.start); (parLigne.get(i) || parLigne.set(i, []).get(i)).push(t); }
  const comLigne = new Map();
  for (const c of coms) if (c.type === 'Line') comLigne.set(ligneDe(c.start), c);

  const sortie = [];
  let changees = 0;
  lignes.forEach((ligne, i) => {
    if (ligne.length <= LIM || bloquees.has(i)) { sortie.push(ligne); return; }
    const indent = ligne.match(/^\s*/)[0];
    const d0 = debuts[i];
    const ts = parLigne.get(i) || [];
    const com = comLigne.get(i);
    let code = ligne, avant = [];
    if (com) {
      const texteCom = src.slice(com.start, com.end);
      code = src.slice(d0, com.start).replace(/\s+$/, '');
      if (!code.trim()) { sortie.push(...replieCommentaire(indent, texteCom)); changees++; return; }
      avant = replieCommentaire(indent, texteCom);
    }
    const tsCode = ts.filter(t => !com || t.start < com.start);
    const lenStr = tsCode.filter(t => t.type.label === 'string' || t.type.label === 'template').reduce((s, t) => s + t.end - t.start, 0);
    if (lenStr > 0.6 * code.trim().length) {
      // données : on remonte seulement le commentaire
      if (com) { sortie.push(...avant, code); changees++; } else sortie.push(ligne);
      return;
    }
    // points de coupe : décalage dans la ligne juste après le jeton
    const coupes = [];
    let prof = 0;
    for (const t of tsCode) {
      const lab = t.type.label;
      if (lab === '(') prof++;
      else if (lab === ')') prof--;
      else if (lab === ';' && prof <= 0) coupes.push({ p: t.end - d0, prio: 2 });
      else if (lab === ',' && prof <= 0) coupes.push({ p: t.end - d0, prio: 1 });
    }
    const morceaux = [];
    let reste = code, base = 0, premier = true;
    while (true) {
      const larg = (premier ? 0 : indent.length + 2) + reste.trim().length;
      if (larg <= LIM) break;
      const off = premier ? 0 : (indent.length + 2) - (reste.length - reste.trimStart().length);
      // pas de coupe qui laisserait un bout de moins de 20 caractères
      const possibles = coupes.filter(c => c.p > base && c.p < base + reste.length && code.slice(c.p).trim().length >= 20);
      const dedans = possibles.filter(c => c.p - base + off <= LIM);
      let choix = null;
      for (const prio of [2, 1]) { const l = dedans.filter(c => c.prio === prio); if (l.length) { choix = l[l.length - 1]; break; } }
      if (choix && choix.prio === 1) {
        // une coupe « ; » trop loin vaut mieux qu'une « , » trop tôt dans la ligne
        const pv = dedans.filter(c => c.prio === 2);
        if (!pv.length && (choix.p - base) < LIM * 0.5) { const s = possibles.find(c => c.prio === 2); if (s) choix = s; }
      }
      if (!choix) choix = possibles.find(c => c.prio === 2) || possibles[0];
      if (!choix) break;
      morceaux.push(reste.slice(0, choix.p - base));
      reste = reste.slice(choix.p - base);
      base = choix.p;
      premier = false;
    }
    morceaux.push(reste);
    const out = morceaux.map((m, k) => k === 0 ? m.replace(/\s+$/, '') : indent + '  ' + m.trim()).filter(m => m.trim());
    if (out.length === 1 && !com) { sortie.push(ligne); return; }
    sortie.push(...avant, ...out);
    changees++;
  });
  return { texte: sortie.join('\n'), changees };
}

let bon = true;
for (const f of fichiers) {
  const src = fs.readFileSync(f, 'utf8');
  const avantLongues = src.split('\n').filter(l => l.length > LIM).length;
  const r = traite(src);
  let ok;
  try { ok = arbre(src) === arbre(r.texte); } catch (e) { ok = false; console.log('  ', e.message); }
  const apresLongues = r.texte.split('\n').filter(l => l.length > LIM).length;
  console.log(`${path.basename(f).padEnd(34)} ${String(r.changees).padStart(4)} lignes retouchées  >${LIM} : ${avantLongues} → ${apresLongues}  ${ok ? 'arbre identique' : 'ARBRE DIFFÉRENT, non écrit'}`);
  if (!ok) { bon = false; continue; }
  if (ECRIRE && r.texte !== src) fs.writeFileSync(f, r.texte);
}
process.exit(bon ? 0 : 1);
