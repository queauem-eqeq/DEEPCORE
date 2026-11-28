# Noyau Profond — document de conception

**Les règles du jeu telles qu'elles sont aujourd'hui.** Ce document ne raconte pas comment on y est arrivé : les
décisions passées, ce qui a été essayé puis retiré et pourquoi vivent dans `historique.md`, à lire avant de
reproposer une idée déjà écartée. Les chiffres mesurés sont dans `mesures.md`, les points de comparaison avec
Brogue dans `brogue.md`.

Le document est découpé par thème (voir « Où lire quoi » plus bas). Version détaillée d'avant la condensation du 23 novembre 2026 : `git show ad818a7:docs/conception.md`.

- **Jeu jouable** : https://claude.ai/artifact/NL3Dn842a32JiGimprg8cm (artefact privé, capacité `db` déclarée)
- **En ligne** : https://queauem-eqeq.github.io/DEEPCORE/ (à chaque fusion dans `main`)
- **Sources** : dépôt `queauem-eqeq/DEEPCORE`, dossier `src/` — une page `index.html`, `style.css`, des scripts
  `js/NN-nom.js` chargés par balises, sans assemblage. Chaque version publiée est marquée par une branche
  `claude/version-AAAA-MM-JJ-n`.

## 1. Concept

Roguelike au tour par tour dans une esthétique inspirée de Cogmind et de Brogue (aucun élément repris de ces jeux).
Un robot foreur se pose sur une planète inconnue, cherche le site de forage et fore pour descendre. La descente
compte **3 niveaux** (table `NIVEAUX`) ; forer le site du dernier atteint le noyau.

## Où lire quoi

Ne jamais lire un fichier en entier : y chercher la section utile (mot-clé).

- `conception-carte.md` : la planète, le niveau, les zones, les recettes, les cavernes, les tunnels, les artefacts, les terrains, les bâtiments.
- `conception-faune.md` : groupes et budget de menace, lieux, styles de patrouille, bestiaire, comportements, portée de discrétion.
- `conception-joueur.md` : machines, butin, fabricateur, foreuse, horloge, combat, équipement, inventaire, capsules.
- `conception-descente.md` : objectifs, cinématique d'intro, cinématique de forage, seconde descente (mini-jeu des mines).
- `conception-interface.md` : direction visuelle, interface, souris, éditeur de tuiles, touches, sauvegarde des réglages.
- `boucle-amelioration.md` : la boucle d'amélioration (ordre des chantiers, tableau des cibles : survie, vie par niveau, coût d'un groupe).
- `arbitrage-survie.md` : les arbitrages du chantier survie (fuel, vie qui remonte, ennemis moins nombreux et plus dangereux).

Documents d'histoire (recopiés du projet claude.ai le 28 novembre 2026 ; **ils font foi** pour l'histoire, le niveau 1, les terminaux, hacks et journal de bord, et les fiches de robots ; rien n'y est encore codé) :

- `histoire.md` : le cadre de l'histoire (ton, trame, éveil de la foreuse niveau par niveau, cinq canaux de récit, les deux fins).
- `histoire-niveau-1.md` : le niveau 1, l'Astroport (cimetière spatial) : bâtisseur, épaves, ennemis, textes de référence, chantiers de code.
- `terminaux-journal.md` : terminaux et antennes (menu DATA / CONNEXION / ENCODAGE), journal de bord, hacks (familles Base, Tir, Noyau), blueprints et FABLAB.
- `fiches-robots.md` : fiches du journal de bord, paliers d'information des robots (contact, stats, comportement, origine), fiches d'objets.

## 11. Règles à ne pas casser

- **Pas de blindage.** La défense fait rater les coups, elle ne les réduit jamais.
- **La vie remonte seule, contre du fuel** (règle levée le 28 novembre 2026 : jusque-là, « pas de réparation automatique »).
  +1 vie tous les 20 battements en marche, tous les 4 au repos (à l'arrêt, un tour passé) ; le **fuel** baisse en permanence
  (1 tous les 12 battements) et, à sec, plus rien ne répare et la coque perd 1 vie tous les 5 battements. Toutes les valeurs
  sont dans `REGLES` (`00-base.js`) ; détail : `conception-joueur.md`, « Fuel, vie qui remonte, repos ».
- **Une nouvelle espèce s'ajoute à la fin de `BEASTS`** (`conception-faune.md`).
- **Un objet ne change pas de clé** (`ITEMS`) : les plans connus, les capsules identifiées et les réglages de Lab → Items
  sont enregistrés sous ces clés.
- **Ne pas renommer les clés `np-*` ni `reglages/courant`** (`conception-interface.md`). Renommer une tuile (clé de `PAT`) abandonne les
  retouches faites dessus : le signaler.
- **Pas de dépendance externe ni d'étape de compilation** : ce qui est dans `src/` est ce qui est publié. Une
  bibliothèque ne peut venir que d'un hôte autorisé par l'artefact (cdnjs, jsdelivr, unpkg) ou être copiée dans `src/`.
- **Scripts classiques, portée globale partagée** : attention aux `const` redéclarées et aux noms déjà dans
  `window`. Un nouveau fichier doit être ajouté en balise `<script>` dans `index.html`.
- Avant de reproposer une idée, vérifier dans `historique.md` qu'elle n'a pas déjà été essayée et écartée.

## 12. Pistes ouvertes

- **Refonte des niveaux, suite** : faune par lieu (dehors / dedans), descente sur 3 niveaux et arrivée par un
  puits, recettes des niveaux 2 et 3, mesures par recette. Plan détaillé dans le projet
  (`claude/refonte-niveaux-plan.md`).
- **Progression à reconstruire** : il ne reste aucune progression permanente. À concevoir : d'où viennent les
  objets, comment la foreuse se renforce, comment la difficulté monte, et ce qui tient lieu de profondeur.
- **Idées de Brogue sur les ennemis** (`brogue.md`) : hordes composées et liées, ennemis endormis à l'arrivée,
  renforts au fil du temps ; ensuite hors-profondeur, mutations, fuite des blessés.
- **Bâtiments, pas encore fait** : pièces murées, densité de créatures à l'intérieur, mesure sur cent cartes du
  nombre d'itinéraires distincts entre l'entrée et la pièce la plus profonde.
- Donner un effet à la profondeur des sites (risque / récompense) ; récompenser les combats ; provenance des objets
  et attaques spéciales ; autres terrains lents ; source de soin limitée.
