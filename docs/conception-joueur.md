# Noyau Profond — conception : Foreuse, combat et objets

Partie du document de conception (sommaire et règles à ne pas casser : `conception.md`). Les règles telles qu'elles sont aujourd'hui ; l'historique est dans `historique.md`, les chiffres dans `mesures.md`.

## 3 quinquies. Machines (`07f-machines.js`)

Des **salles-machines** greffées sur les bâtiments : beaucoup
dans la grande base, un tiers ailleurs. Elles s'activent et se dosent dans Lab → Artefacts, comme les autres artefacts.
Terrains 23 à 30 (`00-base.js`), tous infranchissables, aucun ne coupe la vue ; tuiles dans `03b-tuiles-machines.js`,
retouchables dans le Tile editor (groupe « Machines »).

| Machine | Règle |
|---|---|
| **Tourelle laser** | Encastrée dans un mur, elle tire un rayon droit à travers la pièce jusqu'au premier obstacle. Deux tourelles voisines tirent ensemble : le « laser large », deux cases. Une salle porte 1 à 4 bandes, séparées par deux cases sûres. Période 4 à 7 battements, allumée 1. |
| **Croix laser** | Un pylône qui éclaire ses quatre cases voisines ; les diagonales sont sûres. Quadrillage d'un pylône sur trois. Période 3 à 7, allumée 1 ou 2. |
| **Levier** | La foreuse l'actionne en avançant dessus. Il déploie un pont (une fois pour toutes) ou coupe les lasers de sa salle (il se rebascule). **Toujours dans la salle de ce qu'il commande.** |
| **Pont à levier** | Le **gouffre prend presque toute la salle**, d'un mur à l'autre ; il ne reste qu'une bande de sol (une ou deux cases) à chaque bout. Le levier est **au pied du pont**, du côté d'où l'on vient. Deux cas seulement : le pont est le **seul chemin** vers le site, ou l'autre rive est un **cul-de-sac avec un butin** (Matière). Si les deux rives se rejoignent par ailleurs, la salle n'est pas retenue. Une fois sur trois, un socle remplace le levier. |
| **Pile énergétique** | La foreuse la pousse en avançant dessus, jamais en diagonale, sur sol libre ; **elle passe les portes**. Posée sur son **socle**, elle alimente ce qui y est relié ; retirée, tout se referme. Elle arrête les lasers. |
| **Distributeur de pile** (l'ancien chargeur) | **La pile attend à côté de lui.** Avancer dessus la rappelle à cette place : une pile coincée ne bloque rien pour de bon. |
| **Socle** | Posé **près de ce qu'il alimente** : devant la grille (2 à 4 pas), ou au pied du pont. La pile et son distributeur sont à 6-18 pas, dans une pièce voisine quand il y en a une. |
| **Grille d'énergie** | Ferme l'unique entrée d'un **dépôt** (un plan, deux capsules ou une capsule et un équipement, de la Matière). Elle ne garde jamais le chemin du site. |
| **Salle piégée** | Un butin au milieu de la pièce (plan ou équipement, capsule, Matière) ; 8 à 16 **relais cachés dans des niches** (moins si les murs manquent de place) des murs (tuile « niche », visible : le piège se lit). Ramasser l'appât les fait surgir, déjà en chasse. Ils ne lâchent rien. L'exploration automatique ne touche pas à l'appât. |
| **Vitrines** | Une petite pièce en cul-de-sac, trois lots sous vitrine (un plan, un équipement, deux capsules) : **on n'en emporte qu'un**, les deux autres se verrouillent. Idée des coffres de Brogue. |
| **Station de réparation** | Une fois : vie et énergie au maximum. Le bruit met en chasse les ennemis à 12 cases. |
| **Fabricateur** | Voir « Fabricateur ». Un par niveau, garanti. |

- **Lisibilité (d'après Brogue)** : un mécanisme est toujours à côté de ce qu'il commande, et chaque salle
  se comprend d'un coup d'œil. Une salle à lasers porte 7 fois sur 10 un butin au fond (Matière ou capsule).
- **Un laser ne tire que si la foreuse le voit** : sa tourelle, son pylône ou une case de son rayon est en
  vue (`machVu`). Sans témoin il reste éteint : les ennemis en vadrouille ne s'y blessent plus. Le rythme, lui, continue de
  tourner (`G.mt`). On peut toujours attirer un ennemi dans un rayon qu'on regarde.
- **Le tir ne s'entend qu'en vue et à moins de 5 cases**.
- **Aucun avertissement avant un tir** (choix de l'utilisateur) : chaque laser a sa période et son décalage, tirés à la
  génération ; on apprend le rythme en regardant. L'état affiché est celui du battement en cours.
- **Les lasers blessent tout le monde**, 10 points (`MACH_DM`) : la foreuse comme les ennemis. Un ennemi calme n'entre
  pas dans le champ d'un laser (`G.lz`), un ennemi en chasse le traverse : on peut l'y attirer.
- Un rayon s'arrête à une porte : jamais de piège sur une case de passage ni devant une porte.
- La pose d'une pile et de son socle est vérifiée par un parcours de type « sokoban » sur le sol et les portes à 18 pas du socle (3 poussées au moins) ; à sa place, la pile ne coupe aucun passage.
- Une charge sismique détruit tourelle, pylône, grille, levier, station, chargeur et fabricateur.
- État dans `G` (sauvegardé) : `G.mt`, `G.las`, `G.lz`, `G.circ`, `G.soc`, `G.piles`, `G.pieges`, `G.niche`, `G.choix`, `G.vit`. `accesSite()` dit si le site reste
  atteignable, leviers et socles compris.

Essais : `outils/scripts/test-machines.js` (33 vérifications dans le vrai moteur).

### Butin d'exploration (`butinExplo`, `14d-objets.js`)

Posé à la fin de la génération, sur toutes les recettes. **Ordre de priorité des lieux** (24 novembre 2026) :
**pièce secrète > pièce fermée à clé > cul-de-sac > autres salles.**

- **Pièces secrètes** : chacune reçoit un lot au fond (capsule, Matière, une fois sur deux un plan, une fois sur quatre
  un Module de puissance), en plus du reste. Une « pièce secrète » est ici **tout ce qu'on n'atteint qu'en passant
  une porte dérobée** : une suite de plusieurs salles derrière la même porte ne reçoit qu'un lot, dans la plus
  reculée ; une porte dérobée qui ne fait que relier deux endroits déjà accessibles (un raccourci) ne cache rien.
  **Corrigé le 24 novembre 2026** : une pièce secrète située au-delà d'un bras d'eau profonde n'était pas vue et
  restait vide (16 sur 56 au niveau 2, 4 sur 40 au niveau 3, sur 60 cartes) ; plus aucune après correction.
- Les autres lieux se partagent **5 à 10 butins par carte** (6 sur une carte de taille 3). Les lieux sont **choisis**
  dans l'ordre de priorité :
  - **Pièce fermée à clé** : une zone qu'on n'atteint qu'en ouvrant une porte verrouillée ; un butin par zone, sur sa
    case la plus à l'écart du trajet arrivée → site.
  - **Cul-de-sac et coin reculé** : une case d'où plus rien ne mène ailleurs, entourée d'obstacles sur trois côtés au
    moins, les plus loin du trajet d'abord ; espacés.
  - **Autres salles** : seulement s'il reste des butins à poser ; le sol bâti le plus à l'écart du trajet, jamais
    contre une porte, à 8 cases au moins d'un autre butin.
- **Qui reçoit quoi : une préférence, pas une règle fixe** (demande du 24 novembre 2026, pour que le meilleur butin ne
  soit pas toujours au même genre d'endroit). Un **Module de puissance**, puis un **plan**, puis une **capsule** sont
  tirés au sort parmi les lieux encore vides ; chaque lieu pèse selon sa priorité (`BUTIN_POIDS` : fermée à clé 6,
  cul-de-sac 1, autre salle 0,5). Les lieux restants reçoivent de la **Matière** (15).
- Mesuré le 24 novembre 2026 (30 cartes par niveau, taille 3) : 0,6 à 0,7 butin derrière une serrure par carte, 5,2 à
  5,4 en cul-de-sac, aucun en « autres salles » (les culs-de-sac suffisent). Sur les 63 cartes qui avaient une pièce
  fermée garnie, le Module de puissance y était **38 fois (60 %)** et le plan 20 fois (32 %). Mesures : `docs/mesures.md`.

### Fabricateur (`14c-fabricateur.js`)

Premier usage de la **Matière**. Avancer sur un fabricateur ouvre une liste : **seulement les objets dont la foreuse a trouvé le plan** (sans aucun plan, il le dit et ne propose rien). Les plans se trouvent au sol, dans les dépôts, les salles piégées, les vitrines et sur les robots abattus : objets simples au niveau 1 (réparobots, batterie, fumigène, clé), consommables avancés et accessoires au niveau 2, armes et armures au niveau 3 (un cran d'avance possible). Un plan déjà connu se recycle en 10 de Matière. Le Module de puissance ne se fabrique pas. Une fabrication prend 3 battements ; l'objet est ramassé s'il y a de la place, sinon posé sous la foreuse.

- **Commandes** : flèches (ou Z/S) et Entrée, ou clic ; Échap ferme. Pavé numérique : 8 et 2 montent et descendent, 5 fabrique ; les chiffres 1 à 9 du haut du clavier choisissent l'objet de ce numéro, affiché devant son nom.
- **Fenêtre de taille fixe** : liste et panneau de droite gardent leur hauteur d'un objet à l'autre. Nom coloré par famille : consommables en bio, accessoires en monde, armes et armures en accent (grisé si la Matière manque).
- **À droite de la liste** : l'illustration ASCII de l'objet sélectionné (celle de l'inventaire, `artHTML`), son nom, son effet et sa description ; elle suit les flèches, le survol et le focus. Elle reprend la tuile de l'objet posé au sol (même silhouette, mêmes couleurs) ; la tuile fait foi : quand on redessine une tuile `o_…`, l'illustration est à reprendre à la main. Les quatre objets du fabricateur ont leur tuile (`o_vrille`, `o_trepan`, `o_carene`, `o_blindage`). Contrôle : `outils/scripts/planche-objets.js`.

| Objet | Prix | Objet | Prix |
|---|---|---|---|
| Batterie | 14 | Stabilisateur, Servomoteur | 45 |
| Fumigène | 16 | Viseur laser, Gyroscope | 50 |
| Réparobots | 18 | Condensateur | 55 |
| Surrégime | 20 | Carène légère (armure) | 60 |
| Clé | 22 | Vrille rapide (arme) | 70 |
| Camouflage optique | 24 | Trépan lourd (arme), Blindage composite (armure) | 85 |
| Charge sismique | **34** (le consommable qui épargne le plus de vie, voir mesures) | Accumulateur, Téléobjectif | 40 |

Tous les prix se règlent dans **Lab → Items**.

Repère : une carte de taille 3 porte deux gisements de Matière de 30 à 50, soit 70 à 80 par niveau, plus le butin au sol
(2 à 4 blocs de 15) et ce que lâchent les robots : 120 à 150 par niveau en explorant tout.
Quatre pièces nouvelles (choix de l'utilisateur, « consommables + équipement ») : **Vrille rapide** (1d4+4, coup −30,
CRIT +5, POW 9), **Trépan lourd** (2d6+6 ; coup +25, POW 12), **Carène légère** (DEF +5, VIT +1, DIS −1, POW 9),
**Blindage composite** (DEF +25 ; VIT −1, POW 12). Leurs tuiles au sol sont la tuile générique, à dessiner.

## 5. Foreuse

| Stat | Valeur | Rôle |
|---|---|---|
| Vie | 100 | **pas de réparation automatique** |
| Énergie | 100 | se recharge de POW par battement, **× 2 en attendant sur place** ; se déplacer ne coûte rien, un coup sur la roche 10, frapper un animal rien |
| VIT | 5 | **vitesse de déplacement** : un pas dure 100 × 5 ÷ VIT. À 5, un pas = un battement. Ne joue ni sur les coups ni sur le forage |
| EYE | 10 | rayon de vision |
| DEG | 0 | **bonus fixe** ajouté au jet de dés de l'arme |
| PRE | 100 | précision |
| DEF | 10 | défense : fait rater les coups reçus, sans réduire les dégâts. Modifiée par le terrain et l'armure (10 viennent de la Coque d'usine) |
| CRIT | 5 % | coup critique (×3) ; coup par surprise toujours critique |
| DET | 5 | portée de découverte des portes dérobées |
| POW | 10 | seuil d'équipement (POW requis) et recharge d'énergie : POW/10 par battement |

- **Aperçu derrière les obstacles** (foreuse seulement) : dans le rayon EYE, la case juste derrière un obstacle à la
  vue (montagne, herbes hautes) est aperçue en **mode souvenir**, sans les créatures. Une seule case ; un obstacle
  de 2 cases d'épaisseur cache toujours la suite. Ne marche pas derrière un mur ou une porte. Les ennemis ne voient
  pas à travers les obstacles.
- **Attendre** (Espace ou 5) : la recharge d'énergie est doublée. C'est la façon de refaire le plein après avoir
  couru ou foré.
- **Repos** (P) : enchaîne des attentes **jusqu'à l'énergie pleine**. Chaque battement est une attente ordinaire
  (recharge doublée, portée de discrétion ÷ 2) ; le journal n'en garde que le début et la fin. S'arrête net si une
  créature **entre dans le champ de vision**, si un ennemi déjà visible **repère** la foreuse, si elle est
  **touchée**, ou à la moindre touche. Refusé si l'énergie est pleine ou si un ennemi visible vous chasse.
  Garde-fou : 400 battements.
- **Course** (R) : mode qu'on allume et qu'on éteint. Chaque pas dure moitié moins et coûte **5 d'énergie** ; sans
  assez d'énergie, la foreuse reprend la marche. **Le moteur s'entend : + 2 cases de portée de discrétion**,
  appliquées après tous les autres modificateurs.

## 5 bis. Horloge : le temps continu

Le jeu compte en **unités de temps**, pas en tours.

- Chaque action de la foreuse a une **durée** (table `DUR` dans `09`) : pas 100, coup de foreuse 100, coup sur la
  roche 100, attendre 100.
- Durée d'un pas = 100 × 5 ÷ VIT × terrain (eau peu profonde 1,5 ; eau profonde 2) × 0,5 en course.
- Le monde **bat toutes les 100 unités** : à chaque battement les ennemis agissent, la détection et la perte de
  trace sont tirées, l'énergie remonte de POW. Une action de 50 laisse passer un battement une fois sur deux ; une
  action de 200 en laisse passer deux.
- Conséquence voulue : **la détection se tire au temps, pas à l'action**. Courir fait traverser une zone avec deux
  fois moins de tirages ; une action longue en fait subir davantage.
- Les ennemis gardent leurs points de mouvement (VIT ÷ 5 par battement), divisés par le ralentissement du terrain.
- Limite connue : les ennemis agissent par battements entiers, seule la foreuse a des durées fines.

## 6. Combat

Modèle Brogue :

- **Chance de toucher = précision × 0,987^défense**, bornée entre 5 et 95 %. Chaque point de défense retire 1,3 %
  des coups ; 53 points les divisent par deux. **La défense fait rater, elle ne réduit jamais les dégâts.**
- **Dégâts en fourchette**. Créatures : `dmin`-`dmax` par espèce. Foreuse : **dés de l'arme + DEG**, puis le facteur
  de POW requis.
- **Dés de dégâts** : chaque arme porte ses dés, `de:{n,f,p}` dans `ITEMS` — `n` dés à `f` faces plus `p`. La
  foreuse d'origine : **1d6+5**. La fiche de l'objet affiche les dés et la fourchette obtenue.
- **POW requis** : chaque arme et chaque armure demande un POW. **Arme** : chaque point manquant multiplie
  précision et dégâts par 0,85 ; chaque point en trop, par 1,015. **Armure** : chaque point manquant retire 10 de
  défense ; chaque point en trop en ajoute 1. Calculé à la lecture : gagner du POW agit aussitôt.
- **Critique** : ×3 dégâts. **Coup par surprise** : frapper un ennemi qui ne vous a pas repéré touche toujours et
  est toujours critique.
- Les animaux attaquent **une fois par battement au contact** ; leur vitesse ne règle que les déplacements.
- **Barre de vie** au-dessus de toute créature blessée. Coup raté : « 0 » en gris. Animation : bond de l'attaquant,
  flash, chiffres flottants, tremblement d'écran quand le robot est touché ou qu'un ennemi meurt.

## 6 bis. Équipement et inventaire

**Rien n'est donné au départ**, sauf la foreuse et la Coque d'usine : tout le reste se trouve ou se fabrique.

### Capsules, visée, plans (`14d-objets.js`)

- **Consommables non identifiés.** Chaque sorte porte un **nom de code** tiré à chaque partie (« Capsule //KZ7-3FQ ») et la même
  tuile de capsule au sol. Le premier usage révèle ce que c'est, pour toute la partie ; trouver le plan aussi. La clé et la
  Matière sont toujours connues. Ce que la foreuse sait (plans, capsules identifiées, codes) est dans `G.st.savoir` et la
  suit d'un niveau à l'autre. **À la mort de la foreuse, toutes les capsules se dévoilent** dans l'inventaire (message dans
  le journal) ; la partie suivante repart avec de nouveaux codes.
- **Tout consommable se vise**, comme la charge sismique, jusqu'à 4 cases. **La visée montre toujours une seule case**
   : une capsule inconnue ne se trahit
  pas par sa zone. La visée s'ouvre **sur la foreuse** pour les objets qui la servent **et pour toute capsule non
  identifiée** : Entrée deux fois = sur soi, quitte à faire sauter une charge sismique sous ses pieds. La charge connue
  s'ouvre une case devant.
  Sur un ennemi, l'objet sert l'ennemi ou le frappe ; dans le vide, il est perdu.

| Consommable | Sur la foreuse | Sur un ennemi |
|---|---|---|
| Réparobots | Vie +50 | le répare de 50 PV |
| Batterie | Énergie +50 | décharge : 12 dégâts, **étourdi 6 battements** (un Bloqueur étourdi lâche prise) |
| Fumigène | nuage là où on le lance ; **les ennemis ne perdent la trace que si la foreuse est dedans** | idem |
| Charge sismique | explose comme une mine (3 × 3 et 5 cases autour), 30 dégâts **à la foreuse aussi**, roche brisée | idem |
| **Module de puissance** | **POW +1 pour toujours** ; chaque point de POW au-dessus du POW requis par l'arme donne **+5 % de dégâts**  | ses coups portent 25 % plus fort |
| **Surrégime** | CRIT +50 pendant 10 battements ; la foreuse vire au rouge | ses coups sont tous critiques pendant 10 battements |
| **Camouflage optique** | invisible 10 battements : vue seulement au contact, les poursuivants à distance lâchent ; **rompu par un coup ou un forage** ; « Camouflé N » sous les barres, comme « Englué N » | il disparaît 10 battements (visible au contact) |
| **Balise** (néfaste sur soi) | une **sirène à deux tons** retentit ; tous les ennemis à 20 cases savent où est la foreuse ; **elle rompt son camouflage optique** | **lancée ailleurs, c'est un leurre posé au sol** (ci-dessous) |
| **Court-circuit** (néfaste) | énergie à zéro | hors service 10 battements, sans dégât ; un Bloqueur lâche |
| **Matière** (butin au sol) | +15 en réserve, dès qu'on marche dessus ; au sol, elle a le dessin des **éclats moyens** en couleur Matière  | – |

**Balise posée.** Lancée ailleurs que sur la foreuse, la balise **vole jusqu'à la case visée** et s'y pose (case libre la plus proche si elle est occupée). Elle **hurle 25 battements** (« Balise N » sous les barres, point rouge clignotant). Tant qu'elle hurle, **tout ennemi à 20 cases d'elle, ou qui chasse la foreuse, la délaisse pour s'acharner sur elle** : il l'attaque au contact, les tireurs (Sentinelle, Artilleur, Englueur) lui tirent dessus à portée, les mines s'arment à côté. **Chaque coup la touche** (critique possible) ; un seul bruit d'attaque par battement. Elle a **40 PV**, barre le passage comme une créature et, **détruite, explose sur sa seule case**, sans dégâts alentour ; mines et charges sismiques l'abîment aussi. Les ennemis attirés **restent en chasse** (pas de coup par surprise sur eux) et gardent le souvenir de la foreuse ; balise éteinte ou détruite, ils reprennent la chasse (sur la foreuse s'ils la voient, sinon là où ils l'ont vue). Un ennemi frappé par la foreuse délaisse la balise. La balise posée ne rompt pas le camouflage. Valeurs réglables dans Lab → Items (rayon, durée, PV). 

**Créature étourdie** (batterie, Court-circuit) : elle ne fait plus rien, Puces comprises. Toute sa silhouette devient un **damier d'un pixel sur deux, couleur bio et couleur bâti en quinconce**, les deux couleurs **s'échangeant à chaque battement**. **La foreuse prend le même damier quand elle est immobilisée** (tenue par un Bloqueur) ; il prime sur ses autres allures (engluée, camouflée, en surrégime).

Les deux capsules néfastes (choix de l'utilisateur) font de l'identification un pari : essayer une capsule
inconnue sur soi peut coûter cher, la lancer sur un ennemi peut le servir. Fabricables une fois le plan trouvé (12 et 16).

- **Butin des robots** : un robot abattu lâche parfois un objet (Broyeur 90 %, Bloqueur 60 %, Soudeur 45 %, Artilleur et
  Englueur 35 %, Sentinelle 25 %, Torpille 10 %, Crabot 8 %, Relais 6 %, Drone 5 %, Mine 0) : Matière 40 %, capsule 35 %,
  plan 18 %, équipement 7 %.
- **Lab → Items** : tout ce qui existe, avec ses valeurs modifiables (prix, effets, dés, modificateurs, POW requis, butin par
  espèce), « Rétablir » et « Enregistrer » (navigateur `np-items`, et base de l'artefact sous `items`).
- **Allure de la foreuse** : engluée, elle prend la couleur bio ; en surrégime, la couleur danger ; camouflée, une trame.

- **Emplacements** : 1 arme, 1 armure, 3 accessoires. **Il y a toujours une arme en main** : on ne peut ni la
  retirer ni la jeter, seulement la remplacer. **Toute arme fore la roche pareil** : l'arme ne change que le
  combat et le visuel.
- **Deux endroits, un seul sac** : la fenêtre **Équipement** (armes, armures, accessoires) et le sous-menu
  repliable **Inventaire** de la colonne (les consommables : nom, nombre, **USE**, **[X]**).
- **Vingt places** dans l'inventaire, **une par exemplaire**  :
  les exemplaires s'empilent à l'affichage (×3), mais trois batteries prennent trois places. Le compteur affiche
  `[places/20]`. Ramasser quand les 20 places sont prises est refusé et **l'objet reste au sol**. **[X] jette UN
  exemplaire au sol**, sur une case libre voisine , et libère une place.
- **Un objet par case au sol** : un objet qui tombe — jeté par la foreuse, lâché par un robot abattu,
  sorti du fabricateur quand le sac est plein — ne se pose jamais sur un autre objet ; il roule sur la case libre la plus
  proche (`caseSol`, 14-inventaire). **Jamais sous la foreuse** (24 novembre 2026) : si la case de chute est la sienne, l'objet roule
  ailleurs. Jamais non plus sous une créature vivante, sauf quand une créature vient se poser sur un objet déjà au sol. Les lots posés à la génération (appât d'une salle piégée, dépôts, vitrines) restent
  groupés sur leur case.
  La **clé** est un consommable comme les autres (voir § portes verrouillées) : elle s'empile, se jette, se ramasse.
- **Touche I** : ouvre le sous-menu et choisit le premier consommable ; **↑ ↓** parcourir, **Entrée** utiliser,
  **X**, **Suppr** ou **J** jeter un exemplaire au sol, **Échap** ou **I** sortir.
- **Touche T** : la fenêtre Équipement, plein écran. Liste à gauche (`/` arme, `[` armure, `=` accessoire ; un
  objet équipé y reste, en couleur monde, mention « équipé ») ; fiche à droite (dessin ASCII coloré, description,
  effets, **Équiper / Retirer**, **Jeter**). Clavier : ↑ ↓, **Entrée** équiper, **J** jeter, **G** ramasser.
  Le jeu ne reçoit plus les touches tant qu'elle est ouverte ; le temps ne passe pas.
- **Équiper** est gratuit et instantané ; un 4ᵉ accessoire est refusé. **Un consommable coûte un battement.**
- **Statistiques** sous la fiche : les onze valeurs actuelles ; **PRE, DEG, DEF et DIS telles qu'elles comptent sur
  place** (POW requis et terrain compris). La fiche d'une arme ou d'une armure affiche « POW requis N (vous : M) »
  et ce que l'écart coûte ; pour l'objet choisi, la valeur qu'aurait chaque stat après Entrée (« DEG 10 → 25 »).
- **Maximum de vie ou d'énergie modifié par un objet** : la jauge garde sa proportion (100/100 → 130/130, 50/100 →
  65/130). S'équiper ne soigne pas, retirer puis remettre ne rapporte rien.
- **Le visuel de la foreuse suit l'équipement** : l'arme dessine la moitié avant, l'armure la moitié arrière.
- **Jeter** (et **[X]** du sac) pose l'objet **sur la première case libre la plus proche, jamais sous la foreuse** (`caseJet`) : les huit cases voisines d'abord (orthogonales avant diagonales), puis de plus en plus loin. Libre : ni obstacle, ni eau profonde, ni porte, ni créature, ni autre objet ; sans case libre, il tombe sous la foreuse. Marcher dessus le ramasse, ou **G**. **Tuile au sol** : chaque objet a la sienne, `o_` + clé de l'objet (`o_foreuse`, `o_usine`, `o_servo`, `o_optique`, `o_viseur`, `o_conden`, `o_gyro`, `o_stabil`, `o_accu`, `o_repar`, `o_batterie`, `o_fumigene`, `o_charge`), retouchable dans l'éditeur (groupe « Objets au sol ») ; la clé garde `cle`. Plusieurs objets sur une case : on voit le dernier posé. `PAT.objet` ne sert que de repli.

| Objet | Type | POW | Effets |
|---|---|---|---|
| Foreuse | arme | 10 | **seule arme** : dégâts **1d6+5** (6 à 11), coup 100 |
| Coque d'usine | armure | 10 | **seule armure** : DEF +10 (déjà compris dans les stats de départ) |
| Servomoteur | accessoire | – | VIT +2 |
| Téléobjectif | accessoire | – | EYE +3 |
| Viseur laser | accessoire | – | CRIT +10 % |
| Condensateur | accessoire | – | POW +1 |
| Gyroscope | accessoire | – | DEF +12 |
| Stabilisateur | accessoire | – | PRE +10 |
| Accumulateur | accessoire | – | Énergie max +40 |
| Réparobots (×2) | consommable | – | Vie +50 ; **croix rouges** autour de la foreuse |
| Batterie (×2) | consommable | – | Énergie +50 ; **flèches bio** qui montent |
| Fumigène (×2) | consommable | – | un **nuage de fumée** (ci-dessous) |
| Charge sismique (×2) | consommable | – | **visée** d'une case jusqu'à 4 cases ; explosion de mine, **30 dégâts** ; bruyante |

**Fumigène.** À la pose, une **galette ovale** autour de la foreuse (7 cases de large et de haut, 5 en diagonale : 37 cases). Chaque case dure de **15 à 25 battements** ; à chaque battement le nuage **gagne une à trois cases voisines** au hasard, plus brèves : il s'étend de travers, plafonné à 90 cases, puis s'efface case par case. Les ennemis qui chassaient **perdent aussitôt la trace**.
- **Il passe au-dessus des gouffres** ; seuls les obstacles pleins l'arrêtent.
- **Une case de fumée cache la vue dans les deux sens** : les ennemis ne vous voient plus, et vous ne voyez qu'à une case autour de vous.
- Dessiné avec les **six tuiles de nuage** de l'intro, qui changent d'un battement à l'autre (cœur si les huit voisines sont de la fumée, bord sinon ; une case sur deux tire sa tuile au hasard dans sa famille) et pâlissent dans les quatre derniers battements.
- Sous les barres, « Dans la fumée N » tant que la foreuse y est.

**Charge sismique : une visée.** Une **case rouge** s'ouvre une case devant la foreuse (sur elle tant que la capsule n'est pas identifiée) ; on la déplace à la souris ou aux directions, dans un **rayon de 4 cases** (butée nette). **Entrée** ou **clic** tire, **Échap** annule sans rien consommer. **L'explosion est celle d'une mine** : le carré de 3 × 3 autour de la case visée **et 5 cases tirées au hasard parmi les 12 qui le bordent par un côté**. **30 dégâts** à chaque créature de la zone, **la foreuse comprise**, et **la roche vole en éclats** (rocher, montagne, **roche dure**, murs, piliers, portes verrouillées, machines) ; les métaux tombent au sol. Le tir prend un battement et fait le bruit d'un coup sur la roche (portée de discrétion ×1,5) ; le combat est engagé.

**Effets visuels et bruitages** : chaque objet peut déclarer son bruit (champ `son`) et son effet (`fx`) ; les
autres gardent le petit bip d'usage. Pixel art strict : taille fixe, opaques, calés sur la grille des pixels de
tuile, chaque grain apparaît à son heure et s'efface d'un coup.

**Bruits de coup variés** (24 novembre 2026) : en combat, chaque bruit de coup existe en plusieurs versions tirées au
hasard, jamais deux fois la même de suite, et chaque coup est légèrement désaccordé (hauteur ±8 %, force ±10 %) :
**4 versions** quand la foreuse frappe une créature (sec, lourd, métallique, doublé), **4** quand une créature frappe
(morsure, griffe, boutoir, mâchoires), **3** pour le coup critique. Le coup sur la roche garde son bruit unique.
Réglage : `coup`, `bite` et `crit` dans `01-sons.js`.

