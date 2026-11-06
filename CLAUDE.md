# DEEPCORE — « Noyau Profond »

Roguelike au tour par tour, style Cogmind / Brogue : une foreuse explore et fore une planète inconnue.
Le jeu est une page web en plusieurs fichiers (`src/`), **sans étape d'assemblage**, publiée comme artefact claude.ai ; ce dépôt (GitHub) garde tous les fichiers et l'historique des versions.

## L'utilisateur
- Ne code pas : il décrit ce qu'il veut, en français. Répondre en **français**, de façon concise.
- Tâche claire → agir directement. Tâche ambiguë ou coûteuse à refaire → poser d'abord les questions nécessaires.
- Il juge sur le rendu : montrer le résultat (captures) quand c'est visuel.

## Organisation
- `src/index.html` : la page (balisage) ; elle charge `style.css` et chaque `js/NN-nom.js` par une balise `<script>`.
- `src/style.css` : tout le style.
- `src/js/NN-nom.js` : le script, découpé par thème. **Scripts classiques chargés dans l'ordre des numéros, même portée
  globale (pas de modules, pas d'import/export)** : une constante déclarée dans un fichier est visible dans les suivants ;
  attention aux noms en double (`const` redéclarée = erreur de syntaxe) et aux noms qui existent déjà dans `window`.
  Un nouveau fichier doit aussi être ajouté en balise `<script>` dans `index.html`.
  00 base · 01 sons · 02 palette · 03 tuiles (motifs 16×16) · 04 vaisseau · 05 tuiles éditables · 06 réglages ·
  07 génération de carte · 08 faune et prédateurs · 09 vision, déplacement, forage · 10 rendu et gouffres ·
  11 interface (mode carte, « En vue », commandes, enregistrement) · 12 souris et inspection · 13 éditeur de tuiles ·
  14 cinématique d'intro.
- `docs/conception.md` : **document de conception, source de vérité** des règles et décisions. Le lire avant
  de modifier une mécanique.
- `planches/` : planches de travail (vaisseau, gouffres). `outils/` : scripts de vérification.

## Après chaque modification
1. Syntaxe : `for f in src/js/*.js; do node --check "$f"; done`.
2. Vérifier le rendu quand c'est visuel : `python3 outils/captures.py DOSSIER t1 t2 …` (le jeu est lu directement dans
   `src/` ; captures de l'intro à ces instants, contrôle de fin d'intro et des erreurs). Fluidité : `python3 outils/perf.py`.
3. **Mettre à jour `docs/conception.md`** (section concernée) pour décrire le nouveau comportement.
4. **Commit** en français (message court décrivant le changement pour un joueur), puis **push sur la branche
   `claude/NOM-COURT`** (la session ne peut pousser que sur des branches `claude/…`, jamais sur `main` ni sur des tags :
   erreur 403 sinon). L'utilisateur fusionne dans `main` par pull request (lien affiché par git, ou `gh pr create` s'il le demande).
5. **Publier** sur l'artefact existant, toujours le même (https://claude.ai/artifact/NL3Dn842a32JiGimprg8cm), avec
   `publish_files` depuis le disque : `src/index.html` → `index.html`, `src/style.css` → `style.css`,
   `src/js/*.js` → `js/…`, mode `replace`, slug et `base_version` de l'artefact. Ne pas passer le contenu par la conversation.
6. **Marquer la version publiée** : pousser une branche `claude/version-AAAA-MM-JJ-n` (ex. `claude/version-2026-11-06-1`)
   qui pointe sur le commit publié (`git push origin HEAD:refs/heads/claude/version-AAAA-MM-JJ-n`). Ne pas utiliser de tags.
   Ne plus synchroniser de HTML dans le projet claude.ai « GAME » ; mettre à jour seulement
   `claude/noyau-profond-conception.md` (copie de `docs/conception.md`) quand ce document change.

## Revenir à une version précédente
`git branch -r | grep version` liste les versions publiées. Pour revenir : `git checkout origin/claude/version-… -- src/`,
republier (étape 5), puis commit « Retour à la version … ». Ne jamais réécrire l'historique de `main`. Avant une grosse
modification, marquer la version actuelle. Dernière version à fichier unique : branche `claude/version-avant-fichiers-separes`.

## Règles à ne pas casser
- Les réglages du joueur (palettes, tuiles retouchées, intro déjà vue…) vivent dans le `localStorage` du navigateur
  (`np-*`) et dans la base de l'artefact (`reglages/courant`, chargée seulement si plus récente que `np-maj`).
  Ne pas renommer ces clés. Renommer une tuile (clé de `PAT`) abandonne les retouches faites dessus : le signaler.
- Tuiles : motifs 16×16 en texte. Codes : `.` transparent · `0` noir · `w` blanc · `r` rouge · `1` accent · `2` bio · `3` monde.
- Pas de dépendance externe ni d'étape de compilation : ce qui est dans `src/` est ce qui est publié. Une bibliothèque
  ne peut venir que d'un des hôtes autorisés par l'artefact (cdnjs, jsdelivr, unpkg) ou être copiée dans `src/`.
