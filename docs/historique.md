# Noyau Profond — historique des décisions

**Pourquoi ce document.** `conception.md` dit ce que le jeu est aujourd'hui ; celui-ci dit **ce qui a été essayé,
retiré, et pourquoi**. À consulter avant de reproposer une idée : beaucoup ont déjà été écartées, souvent après
avoir été codées. Chaque ligne est datée ; « demande de l'utilisateur » signifie que le choix est le sien et ne se
rediscute pas sans lui.

Les chiffres mesurés sont dans `mesures.md`.

## Refus de fond, à ne pas reproposer

- **Gerbe d'éclats à l'impact** et **tremblement d'écran quand la roche cède** : essayés, retirés (trop bruyants).
- **Police pixel pour les chiffres de dégâts** : essayée, abandonnée (illisible).
- **Roches incassables à la place des gouffres** : essayées, annulées.
- **Gros prédateurs 2 × 2** : supprimés.
- **Pas de blindage, pas de réparation automatique** : règle tenue depuis le début, confirmée au passage au modèle
  Brogue (16 novembre 2026).
- **Export / import texte des tuiles** : essayé puis retiré le 6 novembre 2026 (« on verra plus tard »).
- **Panneau d'équipement dans la colonne** : essayé le 13 novembre 2026, abandonné le jour même pour une fenêtre
  plein écran.
- **Workflow GitHub Actions pour Pages** : supprimé le 13 novembre 2026, il faisait doublon avec la publication
  automatique par la branche et les deux s'écrasaient (le README s'affichait à la place du jeu). Ne pas le
  réintroduire sans basculer la source sur Actions en même temps.

## 5-6 novembre 2026 — les bases

- Carte portée de 72 × 48 à **96 × 64** ; lacs, massifs et distances recalibrés (facteur d'échelle F).
- Le jeu cesse d'être **un fichier unique** : `src/` en fichiers numérotés, projet sous git, chaque version publiée
  marquée par une branche `claude/version-…` (la session ne peut pas pousser de tags). Dernière version à fichier
  unique : branche `claude/version-avant-fichiers-separes`.
- **Aperçu derrière les obstacles** ajouté (une seule case, en mode souvenir).
- **Gouffres** : variante D′ validée sur planche (lèvre irrégulière, paroi en dégradé sous les bords nord).
- Sprites validés : foreuse modèle D, puce et relais retouchés par l'utilisateur adoptés comme dessins par défaut.
- **Sauvegarde** : jusque-là, la base de l'artefact écrasait les retouches locales à chaque rechargement — des
  palettes et des tuiles ont été perdues. Depuis, la base n'est relue que si elle est plus récente que `np-maj`.
- Le bouton « Enregistrer » est retiré du Lab, puis rétabli le 9 novembre.

## 9-10 novembre 2026

- **Éclats de métal** dans 10 % des cases de montagne ; densités petits / moyens / gros.
- **Mort de la foreuse** : explosion, ~520 éclats qui rebondissent, écran « FOREUSE DÉTRUITE ». Pas de menu
  principal (choix du 9 novembre).
- **Foreuse endommagée** : fumée sous 50 PV, flammèches sous 20 PV.
- **Clic dans le brouillard** : une case inexplorée devient une destination valide, le trajet se recalcule à chaque pas.
- **EYE passe de 5 à 10** (10 novembre).
- **Mémoire des ennemis** (10 novembre) : ils ne connaissent la position de la foreuse que s'ils la voient, et
  retiennent la dernière position connue. Remplace une poursuite « à l'aveugle » de 8 tours qui connaissait la
  position réelle.
- **Diagonales comme dans Brogue** : on ne coupe pas les coins.
- **Intro** : éclairs refaits en pixel art, tonnerre synthétisé, variations à chaque lancement.
- **POW** : 6 puis 3 le 9 novembre, 5 le 13, 1 le 16, 10 le 16 au soir (échelle de la force de Brogue).

## 13 novembre 2026 — l'horloge, la discrétion, l'équipement

- **Temps continu** : le jeu compte en unités de temps, plus en tours. Chaque action a une durée ; le monde bat
  toutes les 100 unités. **La détection se tire au temps, pas à l'action.**
- **VIT** devient la vitesse de déplacement ; **se déplacer ne coûte plus d'énergie** (2 par pas avant, constante
  `MOVE_COST`) ; **frapper un animal non plus**.
- **Course** (R) et **repos** (P) ajoutés. La course ajoute +2 cases de portée de discrétion.
- **Portée de discrétion** inspirée de Brogue : la détection appartient à la foreuse. **La stat DÉT par espèce est
  supprimée** ; toutes les espèces partagent le même rayon, avec 25 % de chance plate par battement.
- **Taille de carte réglable** de 1 à 5.
- **Un seul site de forage** par carte (5 auparavant), profondeur sans effet de jeu.
- **Équipement et inventaire** : première version. Fenêtre plein écran après l'échec du panneau en colonne.
- **Exploration automatique** (O).
- **Cri d'alerte des relais retiré** (le code reste, `alarm:false`) : seule la mémoire partagée de la bande subsiste.
- **Herbes basses et herbes basses fusionnées** en un seul terrain ; la variante « moitié inférieure des brins »
  disparaît.
- Éclats de métal et sites **retirés de la liste « En vue »** : on les lit à la fiche de survol.

## 15 novembre 2026

- **Lacs refaits** : chaque lac a sa rive (étang, à-pic, ou rive ondulée). **L'eau profonde peut désormais toucher
  la terre** — on peut y tomber d'un pas. Avant, tout lac avait un cœur profond entouré de deux cases peu profondes.
- **Herbes hautes et basses mêlées** par trois échelles de bruit ; avant, deux moitiés coupées net en grandes zones.
- **Herbes hautes assombries de moitié** : elles ressortaient trop.
- **Sonar décalé** : 10 à 20 tours après l'arrivée, au lieu de l'arrivée même.
- **Menus Monde et Life** créés (deux boutons sous la mini-carte).
- **Inventaire à dix places**, une par sorte ; `[X]` détruit la pile ; un consommable ne peut plus être jeté au sol.
- Ouverture de l'équipement : **I**, puis **E**, puis **T** (le jour même).
- **Sous-menu Statistiques supprimé** : les stats passent dans la fenêtre Équipement.
- **Fenêtre Discrétion** remise en page (940 × 390 au lieu de 640 × 835).
- **Banc de combat** créé, artefact à part.
- **Puce** : règle d'attaque revue — elle suit sans attaquer, et passe à l'attaque dès qu'un coup est échangé.
  Règles retirées le même jour : « attaque dès qu'un ennemi chasse la foreuse à 4 cases » et « au contact elle
  attaque toujours ».
- **Repérage : un « ! »** au-dessus de l'ennemi.
- **Forage sans confirmation** : la barre part tout de suite.
- Tuile « Sol » vidée (quatre petits points avant).

## 16 novembre 2026 — la grande simplification

- **Modèle de combat Brogue** : « précision × 0,987^défense » remplace « précision − esquive » ; **DEF remplace
  ESQ** ; dégâts en fourchette ; POW requis par arme et armure. Conversion faite à puissance égale (esquive 5 → 5,
  25 → 30, 35 → 45).
- **POW de base passe à 10** (le soir), PRE de 80 à 100.
- **Roche dure au cœur des massifs** ajoutée.
- **Texture du sol** (« plaques rugueuses », variante 5 sur six proposées).
- **La descente en 5 niveaux est retirée**, avec les **six biomes** (Plateau, Marécage, Hautes herbes, Galeries,
  Pierrier, Failles), leurs reliefs, leurs faunes, leurs teintes, le tirage des mondes et le budget de menace par
  niveau (`COURBE`, `lifeMenace`, `menaceDe`, `MENACE_ESP`). Les cartes d'essai deviennent le mode normal. Les six
  reliefs sont recopiés dans le **banc de combat** (`RELIEFS`) pour que les séries archivées restent comparables.
- **Le joyau est retiré**, avec le **menu des trois améliorations** qu'il ouvrait : plus aucune progression
  permanente dans le jeu.
- **Toutes les armes et armures sont retirées sauf l'équipement d'origine** (Foreuse, Coque d'usine) : Foret
  diamant, Marteau-pilon, Scie circulaire, Lance thermique, Châssis renforcé, Coque furtive, Châssis allégé, Coque
  isolante. Accessoires et consommables restent.
- **Fumigène : un vrai nuage** qui s'étend et cache la vue des deux côtés (avant : un simple effet de 5 battements).
- **Charge sismique : une visée** déplaçable, au lieu d'un effet immédiat.
- **Trois rapports à l'eau** (nageurs, au sec, les autres) ; la veille, tout le monde y entrait sans distinction.
- **Barres de vie et d'énergie corrigées** : elles comptaient 20 caractères là où la colonne en montrait 14.
- **Consommables : un battement** (gratuits et instantanés avant).
- **Éclats de métal** : rendent autant d'énergie que de vie.
- **Tuiles et stats réglées par l'utilisateur adoptées** comme valeurs du code (la Puce laissée telle quelle à sa
  demande). Décision du même jour : **il règle ses tuiles et ses stats dans l'artefact**, seule version dont la
  session peut relire les réglages.

## 17 novembre 2026 — les machines

- **Six espèces retirées** : Crachin, Vipérin, Gluar, Siphon, Tapi, Taupar. Restent la Puce et quatre bêtes.
- **Les créatures deviennent des machines** : Insectoïde → **Puce**, Crabos → **Crabot**, Cafar → **Relais**,
  Mastok → **Broyeur**, Brochon → **Torpille**. Seuls les noms affichés changent ; les clés internes restent (sauf celle de la Puce, devenue `puce` le 25 novembre 2026 : l'ancienne est convertie à la lecture des réglages enregistrés, `clePuce` dans `06b-groupes.js`).
  Les retouches faites sur les anciens dessins sont jetées une fois (`np-robo17`).
- Les tuiles étant numérotées par rang, le Broyeur passe de `bz8` à `bz2` et la Torpille de `bz9` à `bz3`
  (`migreBz`, marqué par `np-bz17`).
- **Dés de dégâts** : la foreuse passe à **1d6+5**, DEG devient un bonus fixe (il valait 10, avec un tirage à ±30 %).
- **Articles accordés au genre de l'espèce** : « l'puce » et « le torpille » disparaissent.
- Le soir : stats et dessins revus par l'utilisateur adoptés ; la palette **Rouille** qu'il a réglée remplace celle
  du code.

## 18 novembre 2026

- **La faune sort du menu Monde** : un archétype de monde ne décrit que la génération. Les archétypes enregistrés
  avant portaient une faune : elle est effacée une fois, au chargement.
- **Fouille** : l'ennemi ratisse la zone autour du dernier point connu (30 battements, ramenés à 20 le soir).
  Avant, il faisait 4 battements de pas au hasard et dérivait.
- **Parois adjacentes plafonnées à −2** (`WALL_MAX`), au lieu de −4.
- **Bâtiments décidés** : accrétion façon Brogue, boucles par détour borné, salles isolées, styles, murs que la
  foreuse ne perce pas. Étape 1 faite le jour même (mur, sol bâti, porte, pilier) ; la pièce d'essai posée près du
  vaisseau est retirée le 19 avec l'arrivée du générateur.

## 19 novembre 2026 — générateur de bâtiments, groupes

- **Le générateur de bâtiments entre en jeu** : accrétion, boucles et longs couloirs, piliers, portes d'entrée,
  styles, une ou deux structures par carte jamais reliées entre elles. Les structures recouvrent le terrain,
  gouffres naturels compris.
- **Portes verrouillées et clés**, **pièces secrètes** et stat **DET**.
- **Surface bâtie** portée de 30 à 70 % ; partage entre deux structures élargi à 20-80 % (35-65 avant).
- **Textes d'aide retirés du menu Monde**, à la demande de l'utilisateur.
- **Aucune clé dans les pièces secrètes** : il n'y a jamais plus de clés que de serrures.
- **Life passe aux groupes** : un budget de menace achète des groupes d'espèces. Les cinq niveaux d'intensité par
  espèce (13 novembre) disparaissent ; les effectifs par espèce ne servent plus qu'au banc et aux mesures.
- **Styles de patrouille** (six) portés par le groupe, pas par l'espèce ; plusieurs styles possibles par groupe.
- **Deux espèces ajoutées** : la **Mine** et la **Sentinelle** (d'abord appelée Paralyzor). La paralysie de celle-ci
  — la foreuse ne pouvait plus se déplacer tant qu'elle vivait — est **retirée le soir même**, avec le nom.
- **Les capacités des espèces disparues sont supprimées du moteur** (`range`, `poison`, `slow`, `drain`, `ambush`,
  `dig`) : plus rien n'inflige poison ni glu.
- **Plus de sang** : les ennemis étant des machines, étincelles et débris de carcasse. L'éclat blanc en croix du
  premier essai est retiré le soir. Les tuiles « Sang A » et « Sang B » quittent le Tile editor.
- **Fenêtres Bestiaire et Groupes refaites** : liste en colonne à droite, fiches à gauche (grille de fiches avant).
- **Bruit de porte** unifié pour toutes les portes.
- **Le pilier bloque le pas** : confirmé par l'utilisateur.

## 20 novembre 2026 — artefacts, puis refonte des niveaux

- **Artefacts** : antennes, pièces d'herbe, machines, terminaux, avec leur fréquence (Lab → Artefacts).
  L'**antenne** passe de 20 à 30 cases et **reste allumée** au lieu de révéler la carte une fois.
- **Purge supprimée** : plus aucun ennemi n'inflige poison ou glu, l'objet n'avait plus d'usage.
- **Gouffres intérieurs retirés « pour l'instant »** : plus de gouffre ni de chemin-pont dans les pièces (drapeau
  `GOUFFRES_INT`, le code reste). Ils pouvaient occuper toute une pièce, avec un chemin-pont par porte.
- **Pièces moins étroites** : rectangles d'au moins 4 × 4, halls de 3-4 cases (2-3 avant).
- **Échange de places** entre groupes qui se croisent (règle de Brogue). Essayé d'abord avec le seul demi-tour :
  aucun blocage, mais **aucune traversée** non plus — le couloir devenait une frontière.
- **Errance revue** : un pas tous les battements ou tous les deux, sans jamais repartir d'où l'on vient. Avant : un
  pas au hasard un battement sur quatre, et une bande de relais ne restait pas groupée.
- **Si aucun style de patrouille n'est choisi, il est tiré** parmi les six.
- **Seuls les relais partagent** leur mémoire : précision demandée par l'utilisateur.
- **Réglages du joueur adoptés** : 33 tuiles retouchées, dix groupes, Sentinelle à 18 PV, machines en « + »,
  palettes Néon et Abysse.

### Refonte des niveaux (même jour)

- **Décisions** : la descente revient **sur 3 niveaux** ; roche à écorce tendre et cœur dur ; tunnels de 100 à 400
  cases avec des salles irrégulières, sans ennemis propres ; **la porte du complexe doit être loin de l'entrée des
  tunnels** ; **jamais de complexe en terrain ouvert**.
- **Le complexe sans massif** : un premier correctif posait la structure dehors quand elle ne tenait pas dans la
  montagne — refusé. Règle retenue : si rien ne tient, **la carte entière est retirée** (dix fois au plus).
- **Menu Monde par recette** : chaque recette déclare ses réglages, le menu se reconstruit tout seul. « Surface
  bâtie » n'avait presque aucun effet dans la recette du niveau 1 (le complexe était plafonné à 45 % du massif) :
  elle est remplacée par « Taille du complexe ».
- **Forme du massif** : un côté ou un coin. **« Deux côtés opposés » a été codé, essayé, puis retiré** le jour même
  à la demande de l'utilisateur : les deux massifs étant plus minces, le complexe s'y étalait en ruban et le second
  massif ne servait à rien.
- **Case « Réglages au hasard »** sous REGEN.
- **Fusion dans `main`** (PR n° 22) ; version `claude/version-2026-11-20-7`.
- **Ce document est créé** le même jour : `conception.md` passe de 118 à 65 Ko en perdant son historique, qui
  atterrit ici, et ses mesures, qui vont dans `mesures.md`.

## 21 novembre 2026 : recette « réseau de cavernes »

- Demande : une recette de niveau « réseau de caverne avec bâtiments ». Choix de l'utilisateur : c'est le **niveau 2**
  (la grande « pièce extérieure » du plan devient une caverne), **tout sous roche** (arrivée par un puits), bâtiments
  **enchâssés avec une porte sur une caverne**, cavernes **réglables entre « peu de grandes » et « beaucoup de petites »**.
- Premier essai : `Float32Array` pour les distances du chemin de porte, alors que la priorité du tas est un double :
  les cases étaient prises pour périmées et un tiers des portes ne trouvait pas de caverne. Distances en `Float64Array`.
- Les bâtiments posés dans un lot rectangulaire (meilleur de 60 tirages) ne remplissaient que 8 % de la carte ; avec un
  lot égal à la carte entière, un peu plus (9 à 12 %). Piste non retenue pour l'instant : réserver la place des bâtiments
  avant de creuser les cavernes, pour qu'ils puissent aussi se trouver au centre de la carte.
- **Réservation de la place des bâtiments avant de creuser les cavernes : essayée, jugée moins bien par l'utilisateur,
  retirée le soir même** (PR n° 24). Elle donnait environ 2 bâtiments et 11 % de surface bâtie, au centre comme en
  périphérie, mais les cavernes, contournant les réserves, perdaient leur forme. On est revenu au premier état : cavernes
  creusées d'abord, bâtiments glissés ensuite dans la roche qui reste (surtout en périphérie).
- **Refonte de la recette le même jour** (demande : des cartes plus précises et plus thématiques). Constat, mesuré sur
  300 cartes : les cavernes se chevauchaient et se fondaient en une seule (82 à 87 % de la surface pour 2, 4 ou 6
  cavernes demandées), les bâtiments restaient au bord et n'atteignaient pas la surface demandée, le relief rebouchait
  19 % du sol. Refait : **secteurs** (cavernes, bâti, roche pleine) avec quatre dispositions, cavernes sans
  chevauchement avec écart de roche, complément de surface, boyaux par chemin le moins cher, relief propre à la
  recette, pièces visées, contrôle de la carte et **cinq ambiances**. « Nombre de cavernes » est remplacé par
  « Taille des cavernes ».
- Les secteurs ne sont pas la réservation rejetée plus haut : une caverne naît entière dans son secteur, elle ne
  contourne rien.
- **Proposés puis non retenus** : les curseurs « Équilibre cavernes ↔ bâti » et « Roche pleine ». Ils faisaient
  doublon avec « Part de cavernes » et « Surface bâtie » et pouvaient les contredire ; la place des secteurs se
  déduit maintenant de ces deux-là.
- **Premier essai de forme** (automate cellulaire semé plus dense au centre) : des cavernes en pavés serrés, comme
  des pâtés de maisons. Remplacé par un disque déformé par un bruit, et un complément qui pousse en lobes.
- **Couloir de service entre deux bâtiments** : proposé, refusé par l'utilisateur.

## 21 novembre 2026 (nuit) : ce qui a été remplacé

- **Relief semé en petites taches partout** : remplacé par le grain et le regroupement par régions. En taille 3, toutes
  les cartes se ressemblaient.
- **« Réglages au hasard » tirait chaque curseur séparément** : il tire maintenant une ambiance, puis fait varier le
  reste. Le tirage curseur par curseur donnait une moyenne de tout, sans caractère.
- **Archétypes de monde enregistrés** : effacés à la demande de l'utilisateur. Les ambiances les remplacent ; la
  fonction d'enregistrement reste.
- **Couloir de sentinelles** (proposé le 20 novembre) : écarté par l'utilisateur au profit des tourelles à rythme
  prévisible. **Avertissement avant le tir** : essayé en maquette, retiré, il aidait trop.
- **Valeurs de groupe réglées à la main** : remplacées par des valeurs mesurées au banc. Budget de 110 ramené à 80.
- **Seconde descente en simple cinématique** : remplacée par le mini-jeu des mines. Espace et Entrée ne passent plus
  cette scène, pour qu'on ne perde pas 30 points de vie par mégarde.

## 22 novembre 2026 : archétypes monde et bâti séparés

- **Ambiances mêlant monde et bâti** (21 novembre, 41 ambiances) : une seule liste par recette réglait à la fois la
  colonne de gauche (terrain, relief) et celle de droite (massif, tunnels, bâti). Remplacée par deux listes
  indépendantes : 14 archétypes monde communs à toutes les recettes, une dizaine d'archétypes bâtis par recette. Les
  ambiances surtout « de terrain » (Grande prairie, Rives du grand lac, Désert de pierre, Lac souterrain, Jardins
  engloutis, Abîmes, Serres, Réservoirs, Station lacustre, Plateau désert, Cols…) sont devenues des mondes ou ont été
  refaites en bâti.
- **Case « Réglages au hasard »** sous REGEN : retirée. REGEN relance les réglages en cours ; seuls les boutons Lab →
  Niv1/Niv2/Niv3 tirent au hasard (un monde et un bâti).
- **Sol des cavernes et des poches** (montagne, gouffre, rochers) : sorti de la colonne de droite, rangé par recette,
  pour la colonne Monde, commun.
- **Archétypes de monde** enregistrés (relief seul) : deviennent les **presets de niveau** (recette, deux archétypes,
  tous les curseurs). Ceux déjà enregistrés restent lisibles, sans recette.
- **Bug corrigé : baisser les PV d'une espèce au Bestiaire ramenait TOUTES les créatures de la carte à ce maximum**
  (passer le drone à 6 PV mettait les broyeurs à 6). Seule l'espèce modifiée est désormais concernée.
- **Bug corrigé (22 novembre 2026, 21 h 30) : des Broyeurs à 6 PV après chaque mise à jour de l'artefact.** La vraie cause
  était ailleurs : la conversion des parties du 17 novembre (six espèces retirées, rangs renumérotés) se rejouait à chaque
  reprise à chaud d'une partie neuve, qui n'en portait pas la marque. Les Broyeurs, Torpilles, Mines, Sentinelles,
  Bloqueurs et Artilleurs disparaissaient, les Drones devenaient des Broyeurs à 6 PV et les Soudeurs des Torpilles.
  Conversion retirée ; une partie déjà touchée le reste (REGEN pour repartir sur une carte saine).
- **Réglages du joueur recopiés dans le code** (22 novembre 2026, 21 h 55) : relus dans la base de l'artefact (enregistrés à
  21 h 53). Deux différences seulement : la tuile **Tourelle laser (tir)**, dont le rayon devient un filet blanc qui ondule
  (au lieu de deux colonnes blanches droites), et la **précision du Bloqueur**, 75 → 100. Toutes les autres tuiles et
  stats du Bestiaire étaient déjà celles du code.
- **Réglages du joueur recopiés dans le code** (22 novembre 2026, 2 h) : relus dans la base de l'artefact (enregistrés à
  0 h 31). Stats, palettes, groupes, artefacts et discrétion étaient déjà identiques ; deux dessins différaient (le site
  de forage et le Gardien) et la palette par défaut devient **Rouille**. Bug corrigé au passage : sans réglage
  enregistré dans le navigateur, le jeu prenait la palette n° 0 (Origine) au lieu de la palette par défaut.

## 22 novembre 2026 (nuit) : machines lisibles, objets à trouver

Ce qui a été remplacé, et pourquoi (demandes de l'utilisateur, « chaque machine doit se lire comme dans Brogue ») :

- **Le pont au fossé de deux cases, levier posé n'importe où** : remplacé par un gouffre qui prend la salle, levier au pied du
  pont. Le levier placé dans une autre pièce ne se comprenait pas.
- **Pile, socle et chargeur dans la même pièce, loin de la grille** : le socle est maintenant près de la grille, la pile près
  de son distributeur, dans la pièce voisine.
- **Les lasers qui tirent sans témoin** : ils blessaient les monstres en vadrouille. Ils ne tirent plus que vus.
- **Le Gardien** (lent, blindé, 45 PV) : devenu le Bloqueur. L'idée d'un ennemi qui immobilise avait déjà été codée le
  19 novembre (le Paralyzor) puis retirée le soir même ; elle revient à la demande de l'utilisateur, sous une autre forme
  (rapide, frappe peu, lâche s'il est étourdi).
- **Le jet de glu dessiné comme un laser** : c'est une boule.
- **Tous les objets donnés au départ** (phase d'essai) : plus rien n'est donné.
- **Le fabricateur qui propose tout** : il faut les plans.
- **Les palettes à trois couleurs et le nuancier maison de 64 teintes** : cinq couleurs, LACKING64.
- **Le fumigène qui fait perdre la trace où qu'il soit posé** : seulement si la foreuse est dans le nuage, puisqu'on peut
  maintenant le lancer à distance.

## 23 novembre 2026 — l'arrivée en ASCII
- **L'intro en pixels** (tuiles de la carte, nuages en tuiles, fondu final) n'est plus jouée : l'arrivée au niveau 1 est
  refaite en ASCII (`14e-arrivee.js`), comme les descentes, sans aucune transparence. Son code reste dans `15-intro.js`.
- **La foreuse toujours au centre de la vue, avec de la roche dure dessinée au-delà de la carte** (essayé le 23 novembre
  2026, retiré le même jour à la demande : « map trafiquée »). La caméra reste bornée au bord de la carte ; à l'arrivée,
  c'est le glissement amorti vers la place du vaisseau, commencé dès la descente, qui absorbe le décalage.

## 24 novembre 2026 — les mines éventrent le bâti
- **Les murs, les portes et les machines résistaient à l'explosion d'une mine** (règle du 22 novembre 2026 : seule la charge
  sismique en venait à bout). Retiré à la demande : l'explosion d'une mine les détruit désormais, la roche dure exceptée.
  La charge sismique détruit aussi les portes, qu'elle épargnait par oubli.

## 25 novembre 2026 — plus de plan de clé
- **La clé se fabriquait** (plan de niveau 1, 22 de Matière). Retiré à la demande : il n'existe plus de plan de clé, les clés
  se trouvent seulement sur la carte.

## 25 novembre 2026 — le coup réel ignorait les +5 % de dégâts par point de POW
- La règle du 22 novembre 2026 (+5 % de dégâts par point de POW au-dessus du POW requis par l'arme) n'avait été appliquée qu'à
  l'affichage (`robotDegs`) ; le coup lui-même (`robotDeg`) était resté à +1,5 %, la règle de la précision. Corrigé : le coup
  applique `degFact`. La précision garde ses +1,5 % par point. Mesures de combat non relancées (demande de l'utilisateur).

## 25 novembre 2026 — réglages du joueur recopiés dans le code
- Relus dans la base de l'artefact (`reglages/courant`, enregistré le 25 novembre 2026 à 22 h 05) et comparés au code dans le vrai
  moteur. **Identiques, rien à recopier** : bestiaire, objets (prix, effets, butin), groupes et niveaux, artefacts, discrétion.
- **Recopié** : 28 tuiles (robots `bz0`…`bz10`, Puce, foreuse, machines `mach0`…`mach9`, terminal, site de forage, sol des ponts,
  module de puissance ; **Montagne dure et Crête dure**, qui ne suivent donc plus la montagne tendre), les **huit palettes**
  (Lagon → Lagoon, Désert → Désert sombre, Glacier → Dark forest, Améthyste et Magma retouchées) avec **Améthyste au démarrage**,
  et la **banque de modules** (10 modules, 2 par niveau 1, 1 en cavernes et en base) devenue la banque de départ (`MODULES_DEF`).
- Non recopié, comme toujours : la configuration d'essai (génération, taille de planète, état de la foreuse).

## 28 novembre 2026 — réglages du joueur recopiés dans le code
- Relus dans la base de l'artefact (`reglages/courant`, enregistré le 28 novembre 2026 à 2 h 10) et comparés au code dans le vrai
  moteur (`applySaved` contre l'état du code, contrôle : plus aucune différence après recopie).
- **Recopié** : les stats de 9 espèces sur 12 (Puce, Relais, Broyeur, Mine, Sentinelle, Artilleur, Drone, Soudeur, Englueur ; le
  Crabot, la Torpille et le Bloqueur étaient déjà identiques) ; la batterie étourdit 10 battements au lieu de 6 ; le phaseur envoie un
  ennemi à 25 cases au moins au lieu de 14 ; palette de départ : **Braise**, toujours, sauf demande contraire (la palette active de la base, Magma, n'est pas recopiée) ; 10 tuiles (bz9r, mach5, o_accu, o_batterie, o_repar,
  siteUnknown, vitre, levier, levierOn, o_camo) ; la banque de modules (13 modules : « Vitrine REF » retirée, « Gouffre HUB2 »,
  « Water HUB », « Arene BIG » et « Arene SMALL » ajoutés ; 1 au niveau 1, 2 en cavernes, 2 en base).
- Identiques, rien à recopier : groupes et niveaux, artefacts, discrétion, prix et effets des autres objets, butin.
- Non recopié, comme toujours : la configuration d'essai (génération, taille de planète, état de la foreuse).
- Le pas du Soudeur, réglé à 125 (hors paliers), est porté à **150** à la demande du joueur.

## 28 novembre 2026 — coups étalés, attaques combinées, double coup : retirés
- **Coups étalés** (chaque créature montrait son coup 70 puis 100 ms après la précédente, après le geste de la foreuse) puis
  **attaques combinées** (un groupe par demi-battement, 130 ms d'écart, un seul bruit par groupe) : essayés le 28 novembre 2026,
  retirés le même jour à la demande du joueur : le combat paraissait en retard et le double coup ne se lisait pas.
- **Coup 100 pour toutes les espèces** : plus de créature qui frappe deux fois dans un tour. Les durées de coup déjà enregistrées
  (navigateur, base de l'artefact) ne sont pas reprises si elles datent d'avant (`COUP100_LE`, `07-generation.js`).
- Gardés : 30 images/s, élan, secousse et chiffres à 60 images/s, secousse adoucie.
- **Défaut corrigé le même jour** : de 2 h 37 à 3 h, en adoucissant la secousse, un commentaire avait avalé la ligne qui retire la vie :
  les ennemis frappaient sans faire de dégâts (vu par `outils/simul.py` : vie restante 100 partout). La vérification
  `outils/verifier.py` ne l'avait pas vu : son empreinte ne couvre pas les dégâts reçus.
