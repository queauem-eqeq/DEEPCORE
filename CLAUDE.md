# DEEPCORE — « Noyau Profond »

Roguelike au tour par tour, style Cogmind / Brogue : une foreuse explore et fore une planète inconnue.
Le jeu est un **seul fichier HTML** publié comme artefact claude.ai ; ce dépôt en contient les sources découpées.

## L'utilisateur
- Ne code pas : il décrit ce qu'il veut, en français. Répondre en **français**, de façon concise.
- Tâche claire → agir directement. Tâche ambiguë ou coûteuse à refaire → poser d'abord les questions nécessaires.
- Il juge sur le rendu : montrer le résultat (captures) quand c'est visuel.

## Organisation
- `src/index.html` : la page (balisage), avec deux repères `/*@@CSS@@*/` et `/*@@JS@@*/`.
- `src/style.css` : tout le style.
- `src/js/NN-nom.js` : le script, découpé par thème. **Concaténés dans l'ordre des numéros, même portée globale
  (pas de modules, pas d'import/export)** : une constante déclarée dans un fichier est visible dans les suivants ;
  attention aux noms en double (`const` redéclarée = erreur de syntaxe).
  00 base · 01 sons · 02 palette · 03 tuiles (motifs 16×16) · 04 vaisseau · 05 tuiles éditables · 06 réglages ·
  07 génération de carte · 08 faune et prédateurs · 09 vision, déplacement, forage · 10 rendu et gouffres ·
  11 interface (mode carte, « En vue », commandes, enregistrement) · 12 souris et inspection · 13 éditeur de tuiles ·
  14 cinématique d'intro.
- `build.py` : assemble `dist/noyau-profond.html` (non versionné).
- `docs/conception.md` : **document de conception, source de vérité** des règles et décisions. Le lire avant
  de modifier une mécanique.
- `planches/` : planches de travail (vaisseau, gouffres). `outils/` : scripts de vérification.

## Après chaque modification
1. `python3 build.py`, puis vérifier la syntaxe : extraire le script ou `node --check` sur la concaténation
   (`cat src/js/*.js > /tmp/jeu.js && node --check /tmp/jeu.js`).
2. Vérifier le rendu quand c'est visuel : `python3 outils/captures.py DOSSIER t1 t2 …` (captures de l'intro à ces
   instants, contrôle de fin d'intro et des erreurs). Fluidité de l'intro : `python3 outils/perf.py`.
3. **Publier** `dist/noyau-profond.html` sur l'artefact existant, toujours le même :
   https://claude.ai/artifact/NL3Dn842a32JiGimprg8cm
4. **Mettre à jour `docs/conception.md`** (section concernée) pour décrire le nouveau comportement.
5. Mettre aussi à jour les documents du projet claude.ai « GAME » s'il est attaché à la session :
   `claude/noyau-profond.html` (le fichier assemblé) et `claude/noyau-profond-conception.md`.
6. Commit en français, message court décrivant le changement pour un joueur, puis push sur `main`.

## Règles à ne pas casser
- Les réglages du joueur (palettes, tuiles retouchées, intro déjà vue…) vivent dans le `localStorage` du navigateur
  (`np-*`) et dans la base de l'artefact (`reglages/courant`, chargée seulement si plus récente que `np-maj`).
  Ne pas renommer ces clés. Renommer une tuile (clé de `PAT`) abandonne les retouches faites dessus : le signaler.
- Tuiles : motifs 16×16 en texte. Codes : `.` transparent · `0` noir · `w` blanc · `r` rouge · `1` accent · `2` bio · `3` monde.
- Pas de dépendance externe ni d'étape de compilation autre que `build.py` : le fichier publié reste autonome.
