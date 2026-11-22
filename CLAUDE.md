# DEEPCORE — « Noyau Profond »

Roguelike au tour par tour, style Cogmind / Brogue : une foreuse explore et fore une planète inconnue.
Le jeu est une page web en plusieurs fichiers (`src/`), **sans étape d'assemblage**, publiée comme artefact claude.ai ; ce dépôt (GitHub) garde tous les fichiers et l'historique des versions.

## Démarrer une session
1. **Ouvrir le dépôt** : l'attacher à la session (outil `add_repo`, propriétaire `queauem-eqeq`, dépôt
   `DEEPCORE`, accès `push`), puis le cloner là où il est indiqué, puis `register_repo_root`. Ce fichier
   arrive alors tout seul : ne pas le lire à la main.
2. **Regarder ce qui existe déjà**, avant de toucher à quoi que ce soit :
   `git ls-remote --heads origin | sed 's#.*refs/heads/##' | sort` (la **liste entière**, sans `head` ni
   `tail`) et `gh api "repos/queauem-eqeq/DEEPCORE/pulls?state=open"`.
   **`main` n'est pas forcément à jour** : du travail fini peut dormir dans une branche non fusionnée.
   Le 12 novembre 2026, une liste tronquée a fait manquer `claude/surprise-crit` ; en publiant depuis
   `main`, les coups par surprise et les critiques ont disparu de l'artefact. Travailler depuis une
   branche qui contient tout, ou fusionner d'abord.
3. **Plusieurs conversations peuvent travailler en parallèle** sur le même dépôt et le même artefact.
   Avant de publier, vérifier que l'artefact n'a pas bougé (`get_artifact` donne la version en cours).

## Documents
- `docs/conception.md` : **source de vérité** des règles du jeu, telles qu'elles sont aujourd'hui. Le lire avant de
  modifier une mécanique, en cherchant la section utile, jamais en entier.
- `docs/historique.md` : ce qui a été essayé, retiré, et pourquoi, par date. **À consulter avant de reproposer une
  idée** : beaucoup ont déjà été écartées après avoir été codées.
- `docs/mesures.md` : les chiffres mesurés (détection, fuite) et la date de leur mesure. À comparer après
  un changement d'équilibrage.
- `docs/brogue.md` : ce que fait Brogue, pour s'y référer quand on règle le jeu.

## Outils de vérification
- `python3 outils/captures.py DOSSIER t1 t2 …` : images de l'intro à ces instants, contrôle des erreurs.
- `python3 outils/forage.py DOSSIER t1 t2 …` : images de la cinématique de forage à ces instants (la touche F9 la lance dans le jeu).
- `python3 outils/jeu.py DOSSIER [script.js]` : image de la partie, intro passée ; le script prépare la
  scène dans la page et renvoie ce qu'on veut lire.
- `python3 outils/simul.py [detection|fuite|tout]` : rejoue des situations dans le moteur et mesure.
- `python3 outils/perf.py` : fluidité.
- `python3 outils/animation_cavernes.py SORTIE.gif [essais] [réglages]` : GIF animé de la génération d'un niveau « cavernes » (roche, cavernes, boyaux, bâtiments, portes), tiré du vrai moteur sans toucher à `src/`.
- `python3 outils/animation_niveau.py atterrissage|classique SORTIE.gif [essais]` : même chose pour le niveau 1 et la recette classique (relief, vaisseau, site, bâtiments, tunnels).
- `python3 outils/planche_cartes.py SORTIE.png amb:RECETTE [taille]` : douze cartes côte à côte avec leurs mesures, une par
  ambiance de la recette (`amb:RECETTE:CLE` : douze cartes de la même ambiance ; ou un fichier de cas en JSON).
- `python3 outils/valeur_groupes.py [essais]` (après `outils/banc.py`) : la valeur de chaque groupe de départ, mesurée au banc.
- `python3 outils/forage.py DOSSIER niv2 t1 t2 …` : images de la seconde descente (le mini-jeu des mines).
- **Essais automatiques**, à passer à `jeu.py` et à relancer après tout changement de ces systèmes : `test-machines.js`
  (machines), `test-ennemis.js` (espèces, patrouilles, lieux), `test-forage.js` (mini-jeu), `test-descente.js` (la descente
  entière, trois niveaux) ; mesures : `mesure-ambiances.js`, `mesure-faune.js`. Chacun renvoie une ligne par essai.
- `outils/scripts/` : scripts à passer à `jeu.py` — `six-cartes.js` (six cartes côte à côte, tunnels en jaune),
  `mesure-recettes.js` (40 cartes par taille et par recette : complexes, tunnels, sorties), `cavernes.js` (six cartes de la recette cavernes, secteurs teintés ; `window.CAS` choisit les cartes), `planche-objets.js` (chaque objet : illustration ASCII et tuile au sol côte à côte), `mesure-cavernes.js` (25 cartes par réglage et par ambiance : obtenu contre visé, pièces, connexité).

## Banc de combat
Artefact à part (https://claude.ai/artifact/9BKRaoB4hzgdWhzYFx5A6q) qui rejoue des combats dans le vrai moteur, sur carte de taille 1.
- `banc/banc.js`, `banc/banc.css` : le panneau. Les archives (`banc/resultats.js`, `banc/archives/`) ont été **effacées le 22 novembre 2026** à la demande de l'utilisateur ; elles restent dans l'historique git. Le bouton **Générer** pose l'arène et laisse jouer soi-même, inventaire plein (2 de chaque consommable). Le Lab du jeu a un bouton **Combat** qui ouvre ce banc.
- `python3 outils/banc.py` assemble `banc/site/` (non versionné) à partir de `src/` : c'est ce dossier qu'on publie sur l'artefact du banc
  (`publish_files`, mêmes chemins). **À republier quand le moteur change**, sinon le banc mesure l'ancien jeu.
- `python3 outils/banc_series.py CONFIGS.json SORTIE.json [essais] [processus]` lance des séries en lot.
- Les six **reliefs d'essai** du banc (`RELIEFS` dans `banc/banc.js`) sont ceux des anciens biomes, gardés le 16 novembre 2026 pour que les séries archivées restent comparables.

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
  00 base · 01 sons · 02 palette · 03 tuiles (motifs 16×16) · 03b tuiles des machines · 04 vaisseau · 05 tuiles éditables · 06 réglages et ambiances ·
  06b groupes · 07 génération de la carte · 07b bâtiments · 07c artefacts · 07d zones et tunnels · 07e cavernes · 07f machines · 07g grande base · 08 faune et prédateurs · 09 vision, déplacement, forage · 10 rendu et gouffres ·
  11 interface (mode carte, « En vue », commandes, enregistrement) · 12 souris et inspection · 13 éditeur de tuiles ·
  14 inventaire et équipement · 14b forage (cinématique et mini-jeu des mines) · 14c fabricateur · 14d objets (butin, capsules à identifier, visée, plans, Lab → Items) · 15 cinématique d'intro (qui lance aussi le jeu : rester le dernier).
- `docs/` : conception, mesures, notes sur Brogue (voir plus haut). `planches/` : planches de travail
  (vaisseau, gouffres). `outils/` : scripts de vérification (voir plus haut).

## Après chaque modification
1. Syntaxe : `for f in src/js/*.js; do node --check "$f"; done`.
2. Vérifier le rendu quand c'est visuel, avec les outils ci-dessus (le jeu est lu directement dans `src/`).
   Après un changement d'équilibrage, relancer `outils/simul.py` et mettre `docs/mesures.md` à jour.
3. **Mettre à jour `docs/conception.md`** (section concernée) pour décrire le nouveau comportement.
4. **Commit** en français (message court décrivant le changement pour un joueur), puis **push sur la branche
   `claude/NOM-COURT`** (la session ne peut pousser que sur des branches `claude/…`, jamais sur `main` ni sur des tags :
   erreur 403 sinon). L'utilisateur fusionne dans `main` par pull request (lien affiché par git, ou `gh pr create` s'il le demande).
5. **Publier** sur l'artefact existant, toujours le même (https://claude.ai/artifact/NL3Dn842a32JiGimprg8cm), avec
   `publish_files` depuis le disque : `src/index.html` → `index.html`, `src/style.css` → `style.css`,
   `src/js/*.js` → `js/…`, mode `replace`, slug et `base_version` de l'artefact. Ne pas passer le contenu par la conversation.
6. **Marquer une version publiée seulement quand l'utilisateur le demande** (pas à chaque changement, consigne du 10 novembre 2026) :
   pousser alors une branche `claude/version-AAAA-MM-JJ-n` qui pointe sur le commit publié
   (`git push origin HEAD:refs/heads/claude/version-AAAA-MM-JJ-n`). Ne pas utiliser de tags. Les commits vont sur la branche de travail en cours, sans en créer de nouvelle à chaque changement.
   **Rien à synchroniser dans le projet claude.ai « GAME »** (décision du 20 novembre 2026) : ni HTML, ni copie des
   documents. `docs/` est le seul exemplaire ; le projet n'en garde qu'un renvoi. Ne pas recréer de copie.

## Copie sur l'ordinateur de l'utilisateur
**À chaque fois que l'utilisateur demande de pousser sur GitHub** (consigne du 16 novembre 2026), déposer en même temps
le jeu sur son ordinateur, dans `F:\WORK\IAZONE\DEEPCORE`, **un dossier par version** nommé comme la branche de
version : `version-AAAA-MM-JJ-n`. Y copier le contenu de `src/` tel quel (`index.html`, `style.css`, `js/*.js`), pour que
le jeu se lance en ouvrant `index.html`. Passer par le pont vers l'ordinateur : copier les fichiers dans
`/mnt/user-data/outputs/<version>/`, puis `device_commit_files` ; si le dossier n'est pas encore relié à la session,
`device_request_folder_access` le demande. Inutile de recopier quand seuls des documents changent.

## Archive des captures d'écran
**Chaque capture d'écran de contrôle prise pendant une conversation est aussi sauvegardée** (consigne du 21 novembre 2026),
dans `F:\WORK\IAZONE\DEEPCORE\captures\AAAA-MM-JJ\` : un dossier par jour, des noms de fichier parlants, et un
`LISEZ-MOI.txt` qui dit ce que montre chaque image. Même chemin que la copie du jeu : copier les images dans
`/mnt/user-data/outputs/captures-AAAA-MM-JJ/`, puis `device_commit_files` ; `device_request_folder_access` si le dossier
n'est pas relié. Si le dossier du jour existe déjà, y ajouter les nouvelles images. Les captures de mise au point qui
s'écrasent à chaque génération ne comptent pas. Les captures des conversations d'avant cette date sont perdues : les images ne
survivent pas à une séance.

## Publication sur GitHub Pages
Le jeu est en ligne sur https://queauem-eqeq.github.io/DEEPCORE/ à chaque fusion dans `main`.

Publication **automatique par la branche** (Settings → Pages → Source : `main`, racine) : GitHub met tout le dépôt en
ligne, sans workflow. Le jeu vivant dans `src/`, il est servi à `/DEEPCORE/src/index.html` ; l'`index.html` à la racine
du dépôt y redirige, pour que l'adresse courte marche. `.nojekyll` évite que GitHub fasse passer les fichiers par Jekyll.

Le workflow `.github/workflows/pages.yml`, qui publiait `src/` à la racine du site, a été **supprimé le 13 novembre 2026** :
il faisait doublon avec la publication automatique, les deux écrivaient sur le même site et la dernière arrivée écrasait
l'autre (c'est ainsi que le README s'affichait à la place du jeu). Choix de l'utilisateur : garder l'automatique, le plus
simple. Ne pas le réintroduire sans basculer en même temps la source sur GitHub Actions.

Pas de réglages d'artefact (base `db`) sur Pages : les réglages du joueur restent dans le navigateur (`localStorage`).

## Revenir à une version précédente
`git branch -r | grep version` liste les versions publiées. Pour revenir : `git checkout origin/claude/version-… -- src/`,
republier (étape 5), puis commit « Retour à la version … ». Ne jamais réécrire l'historique de `main`. Avant une grosse
modification, marquer la version actuelle. Dernière version à fichier unique : branche `claude/version-avant-fichiers-separes`.

## Règles à ne pas casser
- Les réglages du joueur (palettes, tuiles retouchées, intro déjà vue…) vivent dans le `localStorage` du navigateur
  (`np-*`) et dans la base de l'artefact (`reglages/courant`, chargée seulement si plus récente que `np-maj`).
  Ne pas renommer ces clés.
  **L'utilisateur règle ses tuiles et ses stats dans l'artefact** (décision du 16 novembre 2026), parce que c'est la
  seule des trois versions dont la session peut relire les réglages : sur GitHub Pages et dans la copie du disque, il
  n'y a pas de base, et le stockage du navigateur n'est pas lisible depuis la session. Quand il demande que ses
  réglages deviennent ceux du jeu publié, les lire avec `db_get` sur `reglages/courant` (artefact
  `acb8696b-fff0-42ad-824a-fd58fe7cdf1e`) et les recopier dans `src/` : dessins dans `rows` des `BEASTS` et dans `PAT`,
  stats dans les `BEASTS`, couleurs dans `PRESETS`, objets (`items` : prix, effets, butin) dans `14c`/`14d`. Ne pas recopier la configuration d'essai que la base contient aussi
  (génération, intensités, état de la partie). Le 16 novembre, l'insectoïde a été laissé tel quel à sa demande. Renommer une tuile (clé de `PAT`) abandonne les retouches faites dessus : le signaler.
- **Une nouvelle espèce s'ajoute à la fin de `BEASTS`**, jamais au milieu : les tuiles des créatures sont numérotées
  (`bz0`…`bz9`, dans l'ordre de la liste) et les retouches du joueur sont enregistrées sous ces numéros. Insérer une
  espèce décale toutes les suivantes et colle leurs retouches sur la mauvaise bête (16 novembre 2026 : le brochon,
  inséré avant le mastok, portait la tuile du mastok).
- Tuiles : motifs 16×16 en texte. Codes : `.` transparent · `0` noir · `w` blanc · `r` danger (rouge de la palette) · `R` rouge fixe (#d8180b, ne suit pas la palette) · `1` accent · `2` bio · `3` monde · `5` bâti (`5` et `R` : 22 novembre 2026)
  (lu « bâti » sur les tuiles de `BATI_TUILES`). Palettes à cinq couleurs, toutes tirées de LACKING64 (`02-palette.js`).
- Pas de dépendance externe ni d'étape de compilation : ce qui est dans `src/` est ce qui est publié. Une bibliothèque
  ne peut venir que d'un des hôtes autorisés par l'artefact (cdnjs, jsdelivr, unpkg) ou être copiée dans `src/`.
