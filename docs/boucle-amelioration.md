# Boucle d'amélioration de « Noyau Profond »

Cadre fixé le 27 novembre 2026. Recopié du projet claude.ai le 28 novembre 2026 : le dépôt fait foi.

## Décisions de cadrage (utilisateur, 27 novembre 2026)

- **PR #43 abandonnée comme code** : on repart de zéro. Une seule règle en est gardée telle quelle : **moins
  d'ennemis, plus dangereux**. Le reste (fuel, repos, renforts, niveau 4) est redécidé ci-dessous ou dans la boucle.
  La branche reste une source d'idées (`docs/propositions-2026-11-23.md`).
- **Premier thème : la survie** (vie, fuel, danger des ennemis) sur les 3 niveaux actuels.
- **Rythme : nuit autonome.** Arbitrage le soir, fabrication et simulation la nuit, essai le matin.
- **Cibles chiffrées : Claude propose, l'utilisateur valide.**

## Un cycle, cinq temps

Un seul thème par cycle, une conversation par cycle.

1. **Arbitrage** (utilisateur, le soir) : fiche d'une page. Constat mesuré, 2 à 4 choix à cocher, ce que chaque choix
   change pour le joueur. Rien n'est codé avant la réponse.
2. **Fabrication** (Claude, la nuit) : branche `claude/AAAA-MM-JJ_Version_nom`, `outils/verifier.py` au vert,
   `conception-*.md` du thème mis à jour.
3. **Simulation** (Claude, la nuit) : pilote automatique sur des parties entières, banc de combat, `simul.py`.
   Résultats dans `docs/mesures.md`, comparés aux cibles et au cycle précédent.
4. **Essai** (utilisateur, le matin) : sur l'artefact. Trois questions de ressenti : trop facile, trop dur ou juste ;
   le moment le plus tendu ; ce qui a paru injuste ou ennuyeux.
5. **Analyse** (Claude) : mesure contre cible contre ressenti. Trois issues : garder (PR, fusion si demandée),
   corriger (nouveau cycle sur le même thème), retirer (noté dans `historique.md`).

Règles de la boucle : un cycle ne change qu'une famille de règles à la fois ; toute règle porte une valeur réglable
nommée ; un changement non mesuré n'est pas fusionné ; le ressenti du joueur l'emporte sur la mesure, et l'écart
entre les deux sert à corriger le pilote automatique.

## Ordre des chantiers

0. **Outillage** (aucune règle ne change) : pilote automatique de partie entière (`outils/pilote.py`, profils
   prudent et fonceur, empreinte du jeu identique), mesure de référence de `main`, tableau de cibles, ménage des
   branches, PR #43 fermée.
1. **Survie A** : fuel, régénération, repos, coûts en énergie, moins d'ennemis plus dangereux.
2. **Survie B** : arme de tir, emplacements d'équipement, objets silencieux.
3. **Identité des niveaux** : un archétype précis par niveau, modules par niveau, filtres du Lab.
4. Consommables et prix du FABLAB, progression de la foreuse, puis un nouveau niveau par cycle.

**En parallèle, hors boucle : l'histoire du jeu.** Elle oriente les chantiers 3 et suivants.

## Cibles proposées (à valider après la mesure de référence)

| Indicateur | Cible proposée |
|---|---|
| Pilote prudent : atteint le noyau | 5 à 6 parties sur 10 |
| Pilote fonceur : atteint le noyau | 1 partie sur 10 au plus |
| Un groupe affronté de face | un tiers de la vie (décision du 23 novembre) |
| Vie perdue par niveau, pilote prudent | 30 à 50 % |
| Rester longtemps au même niveau | doit coûter, de plus en plus |
| Soins disponibles par niveau | moins que la vie perdue en jouant de face |
| Durée d'un niveau | à fixer d'après la référence |

## Règles décidées par l'utilisateur (27 novembre 2026)

Valeurs de base, à mesurer puis ajuster. Les valeurs chiffrées retenues ensuite sont dans `arbitrage-survie.md`.

### Vie, fuel, repos
- **La vie remonte seule, en permanence et doucement ; le repos et l'attente soignent plus vite.** Cela lève la règle
  « pas de réparation automatique » de `conception.md` (section 11).
- **Le fuel baisse de manière constante, à chaque battement. À zéro, la vie baisse.**
- **Fuel : 100 au départ.** Il se **mine** et se trouve en **objet**.
- **Repos = être à l'arrêt et passer un tour.** Si un ennemi nous chasse, le repos s'interrompt, mais on peut toujours
  attendre à la main.
- **Les réparobots sont gardés.**
- **Les modules de puissance** gardent leur effet sur le POW **et** augmentent la vie maximale.
- **Ennemis : moins nombreux, plus dangereux** (gardé de la PR #43).

### Énergie
- Forage **5** (10 auparavant), course **5** par pas (inchangé), tir **20**.

### Arme de tir
- Arme secondaire de la foreuse, à projectiles. **Portée : la vue.** **Bruit : celui du forage de base.**
- Objet **forage silencieux** : bruit du forage divisé par 2. Objet **tir silencieux** : bruit du tir divisé par 2.
- **Cinétique** : le tir de base. Feu (dégâts + brûle), glu (dégâts + ralentit), shotgun (courte portée, dégâts de
  zone), laser (le tir traverse les ennemis) : d'abord pensés comme des plug-ins, **devenus des armes à part entière
  qui remplacent le canon** (décision du 28 novembre 2026, voir `arbitrage-survie.md`).

### Équipement de la foreuse
- **5 emplacements d'objets équipables**, plus **2 armes** (foreuse et tir) et **l'armure**.

### Niveaux, modules, groupes
- Le système de génération est bon, mais chaque niveau reçoit **un archétype plus précis** : moins variable
  qu'aujourd'hui, plus identifiable.
- **Créer d'autres modules** et choisir lesquels vont dans chaque niveau selon son thème.
- **Lab → Modules : filtre par niveau, et « tous »**, pour les passer en revue. **Même filtre dans Lab → Groupes.**

### Histoire
- **Écrire l'histoire du jeu**, pour savoir où aller et intégrer des éléments d'histoire (fait : `histoire.md`).

État du jeu le 27 novembre, pour mémoire : énergie 100, rechargée de POW/10 par battement (doublée en attendant) ;
frapper ne coûte rien ; aucune arme à distance pour la foreuse ; ni fuel ni réparation automatique sur `main` ;
équipement réduit à l'arme et à l'armure de base ; modules posés au niveau 1 seulement.
