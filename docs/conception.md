# Noyau Profond — document de conception

État du projet au 5 novembre 2026. Ce document résume les règles, les valeurs et les choix déjà validés, pour reprendre le travail dans une nouvelle conversation ou dans Claude Code.

- **Jeu jouable** : https://claude.ai/artifact/NL3Dn842a32JiGimprg8cm (artefact privé, capacité `db` déclarée)
- **Sources** : dépôt GitHub queauem-eqeq/DEEPCORE, dossier `src/` (page `index.html`, `style.css`, scripts `js/NN-nom.js` chargés par balises `<script>`, sans assemblage). Depuis le 6 novembre 2026 le jeu n'est plus un fichier unique ; l'artefact est publié en plusieurs fichiers et chaque version publiée est marquée par une branche git `claude/version-AAAA-MM-JJ-n` pour pouvoir y revenir (la session ne peut pas pousser de tags). Dernière version à fichier unique : branche `claude/version-avant-fichiers-separes`.
- **Planche de sprites** (propositions archivées) : https://claude.ai/artifact/9q4nEBMjc2r2TCaWPuKUXu

## 1. Concept

Roguelike au tour par tour dans une esthétique inspirée de Cogmind et de Brogue (aucun élément repris de ces jeux). Un robot foreur explore la surface d'une planète inconnue (niveau 1), cherche le site de forage, puis fore pour descendre : cinq niveaux, un biome par niveau, jusqu'au noyau (§ 3 bis).

## 2. Direction visuelle

- Tuiles pixel art 16 × 16, affichées en 32 × 32 ; fond quasi noir.
- **Palette à trois couleurs**, affichées dans cet ordre dans le menu Palette : **#1 Monde** (ambre #ffa53a par défaut, ex-« signal » : sol, rochers, montagnes), **#2 Bio** (bleu #4fb8ff, ex-« technologie »), **#3 Accent** (turquoise #8fe6cf, ex-« structure »). Dans le code, les clés restent `3` monde, `2` bio, `1` accent ; dans ce document, « structure » = accent et « technologie » = bio.
- 8 palettes prédéfinies, toutes modifiables (Origine, Phosphore, Mars, Glace, Néon, Rouille, Abysse, Ambre) ; sélecteur de 64 teintes (8 familles × 8 nuances) ; bouton « Rétablir ».
- Pas d'effet d'écran (lignes de balayage retirées).
- Polices : Chakra Petch (titres), JetBrains Mono (interface).

### Sprites validés
- **Foreuse** : modèle D — longue mèche triangulaire + moteur arrondi à grilles + deux échappements. Deux couleurs seulement : mèche, grilles et échappements en technologie, contour du moteur en structure. La mèche pointe dans la direction du dernier déplacement.
- **Insectoïde** : version retouchée au Tile editor, devenue le dessin par défaut le 6 novembre 2026 (corps rayé bio/monde, antennes et pattes, œil noir).
- **Crabos** : vu de face, grandes pinces et yeux pédonculés ; corps technologie, pinces structure.
- **Cafar** : version retouchée au Tile editor, devenue le dessin par défaut le 6 novembre 2026 (cafard vu de dessus, carapace bio striée d'accent, sillon noir, tête monde, six pattes, antennes).
- **Joyau** : losange (forme A) avec facettes (style B) : face claire structure / face foncée technologie, inversées sous l'arête. Pas d'éclat. Liseré sombre quand il est pris dans la roche.
- **Herbe** : deux dessins, tous deux éditables — **herbes hautes** (brins fins) et **herbes basses** (la tuile qui s'appelait « Herbes basses » jusqu'au 13 novembre 2026). La variante « moitié inférieure des brins » a été supprimée.
- **Ponts** : couleur unie du sol, sans motif.
- **Gouffres** (variante D′, validée le 6 novembre 2026 sur la planche « Gouffres lisibles », https://claude.ai/artifact/R7HUx9acYDg84dRHtw9XmF) : fond noir ; **lèvre irrégulière couleur sol** (1 à 3 pixels, ondulation lente, petits éperons dans les coins) sur chaque côté qui touche le sol (pas du côté des ponts), sans rebord ambré ; sous **chaque pixel de bord tourné vers le nord** (bord nord, flancs irréguliers, éperons, dessous des ponts), **paroi en dégradé plein de 7 teintes sur 7 pixels**, de la couleur monde atténuée (60 %) jusqu'au noir. Pas de paroi sous les bords tournés vers le sud. L'inconnu reste en noir plat. Calculé une fois par planète et par palette (image de 16 pixels par case), utilisé aussi par la cinématique.
- **Traces de chenilles** : deux pointillés qui suivent une courbe (64 combinaisons entrée/sortie), effacement pixel par pixel en 5 tours.
- **Roche fracturée** : fissures épaisses, coins arrachés, trous (après le premier coup).
- **Viseur** (curseur souris et inspection) : modèle « Crochets » seul (les 7 autres ont été supprimés) ; blanc avec contour noir automatique ; ses pixels blancs passent en gris quand la case est inexplorée ou hors d'atteinte. Modifiable dans le Tile editor (voir § 9).

## 3. Planète et génération (inspirée de Brogue)

- Carte **96 × 64 cases** (depuis le 6 novembre 2026 ; avant : 72 × 48), 5 sites de forage, 1 joyau. Les tailles de lacs, massifs et distances sont calibrées pour cette taille (facteur d'échelle F = 1).
- **Bord de carte irrégulier** : une bande de montagne d'épaisseur variable (de 1 à 10 cases, environ 3 en moyenne) suit les quatre côtés, tirée d'un bruit à deux échelles, puis 2 passes d'automate cellulaire cassent les angles droits (caps et baies). Elle prend environ 17 % de la surface, jamais plus de 19 % (tirage refait sinon). La rangée extérieure reste indestructible ; le reste de la bande se creuse comme une montagne normale.
- Lacs posés par automate cellulaire (règle B5678/S45678) : cœur d'eau profonde + couronne de 2 cases d'eau peu profonde.
- Relief (montagnes, gouffres) : méthode **Automate cellulaire**, **Bruit** ou **Mixte** ; réglages Remplissage (35–70 %) et Itérations (1–10).
- Connectivité garantie : les zones isolées sont reliées par le plus court chemin (pont sur gouffre, col dans la montagne, rocher dégagé) ; petites poches comblées.
- L'eau ne touche jamais un gouffre (marge de 2 cases de terre ferme).
- **Gouffres** : jamais de trou de moins de 4 cases reliées par les côtés, et jamais deux gouffres reliés seulement par un coin. Nettoyage avant et après la connexion automatique, et après la pose du vaisseau ; il ne fait que combler (gouffre → sol), donc la connexion reste garantie. Un pont qui ne franchit plus rien redevient du sol.
- Curseurs de génération (en %) : Eau ≤ 60, Montagne ≤ 70, Gouffre ≤ 30, Herbe ≤ 80, total ≤ 80. Herbe répartie moitié haute, moitié basse.
- Bouton **REGEN** dans le titre « Génération » : nouvelle planète immédiate.

### Taille de la carte (13 novembre 2026)

Réglage « Taille de la carte » en tête du sous-menu Génération, de **1 à 5**, appliqué au prochain lancement (REGEN) :

| Taille | Cases | Usage |
|---|---|---|
| 1 | 32 × 22 | arène : tient presque dans l'écran, pour essayer des monstres |
| 2 | 48 × 32 | |
| 3 | 72 × 48 | |
| 4 | 96 × 64 | **taille d'origine**, valeur par défaut |
| 5 | 144 × 96 | |

Le relief, les lacs et les distances de sécurité suivent l'échelle, et la faune aussi depuis le passage de Life aux intensités (ci-dessous).

### Life : intensité par espèce (13 novembre 2026)

Le sous-menu Life ne demande plus un nombre d'individus mais une **intensité** par espèce, sur cinq niveaux, plus une ligne « Toutes » qui règle les dix espèces d'un coup (elle affiche « Mixte » quand elles diffèrent).

| Niveau | Coefficient | Minimum |
|---|---|---|
| Aucun | 0 | 0 |
| Rare | × 0,5 | 1 |
| Normal | × 1 | 1 |
| Nombreux | × 2 | 2 |
| Infesté | × 4 | 4 |

Nombre de créatures = effectif de référence de l'espèce (colonne « Référence » du § 7) × coefficient × surface de la carte rapportée à la taille 4, avec le minimum du niveau (2 pour les cafars, qui vont en bande). En taille 4 et au niveau Normal on retrouve les effectifs d'avant ; en taille 1, un ou deux individus par espèce, et « Infesté » en donne au moins quatre. Les anciens réglages en nombres sont convertis au niveau le plus proche. Mémorisé sous `np-intens` (l'ancienne clé `np-life` n'est plus écrite).

## 3 bis. Descente : niveaux, biomes, difficulté (13 novembre 2026)

La partie est une **descente en 5 niveaux** (5 pour commencer ; on allongera). Forer le site d'un niveau fait arriver sur une nouvelle carte, d'un autre biome ; on ne remonte pas. Forer le site du niveau 5 atteint le noyau : écran « NOYAU ATTEINT ».

- **Niveau 1** : toujours le biome Plateau, **taille 2** (48 × 32), avec le vaisseau.
- **Niveaux 2 à 5** : taille **tirée au hasard entre 2 et 5** (la taille 1, trop petite, reste réservée aux essais) ; pas de vaisseau, la foreuse débouche du puits sur un carré de sol dégagé.
- **Biomes** : quatre des cinq autres biomes sont tirés au début de la descente et rangés du moins au plus dangereux (rang).
- **Ce que la foreuse emporte** : vie, énergie, équipement, bonus de joyaux, Matière, journal. Les effets durables (poison, glu) et les objets laissés au sol sont perdus.
- **Carte d'arrivée** : une fiche annonce le niveau, le biome, sa faune et ses gisements, puis « Continuer ».
- **En jeu** : « Niveau 2/5 · Marécage » sous le titre Statut.
- **Mort** : nouvelle descente au niveau 1.

### Biomes : un relief, une faune

| Biome | Rang | Relief (eau / montagne / gouffre / herbe, en %) | Faune (intensité, § 3) | Idée |
|---|---|---|---|---|
| Plateau | 1 | 8 / 10 / 3 / 14 | Insectoïde normal, Crabos rare, Cafar rare | l'arrivée : ouvert, peu de danger |
| Marécage | 2 | 30 / 6 / 1 / 28 | Crabos nombreux, Tapi normal, Gluar normal, Vipérin rare, Insectoïde rare | les crabos nagent, la glu et l'eau ralentissent la fuite |
| Hautes herbes | 2 | 6 / 6 / 2 / 55 | Tapi nombreux, Insectoïde normal, Siphon normal, Crachin rare | on se cache bien, les embusqués aussi |
| Galeries | 3 | 2 / 46 / 3 / 4 (bruit) | Cafar nombreux, Taupar normal, Vipérin normal, Gluar rare | couloirs étroits, bandes, parois percées |
| Pierrier | 3 | 1 / 14 / 6 / 2 (bruit) | Crachin nombreux, Siphon normal, Crabos rare, Mastok rare | à découvert sous les tirs |
| Failles | 4 | 4 / 22 / 18 / 6 | Mastok nombreux, Vipérin nombreux, Cafar normal, Taupar rare | gouffres partout, les plus gros ennemis |

**Palette** : la même partout (choix de l'utilisateur), avec une petite variation par biome appliquée à la palette du joueur : rotation de teinte de 4 à 18°, clarté et saturation de la couleur monde légèrement modifiées. Le sous-menu Palette règle toujours la palette de base.

### Courbe de difficulté

| Niveau | Monstres (× l'effectif du biome) | Métal de réparation (gisements pour 1000 cases) | Matière (pour 1000 cases) |
|---|---|---|---|
| 1 | × 0,7 | 26 | 3 |
| 2 | × 0,85 | 18 | 6 |
| 3 | × 1 | 12 | 10 |
| 4 | × 1,25 | 8 | 14 |
| 5 | × 1,5 | 4 | 18 |

Plus on descend : plus de monstres, moins de quoi se réparer, plus de Matière. Les gisements se comptent par surface de carte et non plus en part de la montagne, sinon un biome très rocheux (Galeries) aurait été le mieux fourni en réparation. **Courbe posée à la main, pas encore mesurée** : à régler en jouant, puis par simulation.

### Matière

Second métal, **couleur accent** (les éclats de réparation sont couleur bio), mêmes dessins et mêmes trois tailles. Pris dans la montagne, il tombe quand on brise la paroi (ou qu'un taupar la perce) ; passer dessus ajoute **10, 15 ou 20** à la réserve **Matière**, affichée sous les jauges. La Matière servira à construire de l'équipement (plus tard) ; elle ne sert encore à rien.

### Cartes d'essai

Le bouton **REGEN** ne lance plus une partie mais une **carte d'essai** : taille, relief (Génération) et faune (Life) choisis par le joueur, palette de base, 10 % de montagne en métal et 2 % en Matière. « Carte d'essai » s'affiche sous Statut ; y forer relance une carte d'essai. Le bouton **Nouvelle descente** du Lab repart au niveau 1. (Hypothèse retenue faute de réponse de l'utilisateur à la question : à confirmer.)

## 4. Terrains

**13 novembre 2026** : les herbes basses et les herbes basses, qui faisaient deux terrains distincts, n'en font plus qu'un, **les herbes basses**. La génération pose donc des herbes hautes et des herbes basses ; marcher dans les hautes les couche en basses. La tuile éditable « Herbes basses » a été renommée « Herbes basses » (sa clé `flat0` n'a pas changé : les retouches sont conservées).

| Terrain | Passage | Vue | Effet |
|---|---|---|---|
| Sol rocheux | oui | libre | des points de plus en plus denses à 9, 6 et 3 cases d'un site |
| Rocher | brisé en 2 coups | libre | laisse des gravats |
| Montagne | brisée en 2 coups (sauf bord de carte) | bloquée | peut contenir le joyau ; 10 % contiennent des éclats de métal |
| Eau peu profonde | oui | libre | −20 d'esquive ; évitée par les insectoïdes et les cafars, praticable pour les crabos ; **terrain lent : pas ×1,5** (sauf crabos) |
| Eau profonde | oui | libre | −20 d'esquive ; **chaque pas a 50 % de chance de partir dans une autre direction tirée au hasard** (si cette case est bloquée, la foreuse est plaquée contre l'obstacle et ne bouge pas ; le tour passe) ; **attendre** dans l'eau profonde déplace la foreuse d'une case au hasard (le courant) ; seuls les crabos y entrent (sans dérive) ; **terrain lent : pas ×2** (sauf crabos) |
| Herbes hautes | oui | bloquée | **deviennent des herbes basses** au passage ; +10 d'esquive pour qui s'y trouve ; froufrou au passage (bruitage refait le 13 novembre 2026 : trois coups de brosse décalés, tirés au hasard à chaque pas) |
| Herbes basses | oui | libre | **portée de discrétion ÷ 2** : c'est le couvert du jeu |
| Gouffre | non | libre | — |
| Pont / gravats | oui | libre | — |
| Coque du vaisseau | non, indestructible | libre | — |
| Soute du vaisseau (intérieur + porte) | oui | libre | point de départ ; pas de traces de chenilles |

### Vaisseau Cargo sur la carte
- Grille 5 × 6 cases, nez vers le haut : `..H..` / `.HHH.` / `HHIHH` / `HHIHH` / `.HDH.` / `.E.E.` (H coque, I soute, D porte, E réacteur). **Seulement 3 cases praticables** : 2 de soute + la porte, toutes entourées de coque, donc aucun passage en diagonale possible (le haut du couloir, sous la verrière, est de la coque). Sortie vers le bas entre les deux réacteurs.
- Posé à la génération sur une zone dégagée (marge d'une case tout autour) ; à défaut sur la zone la moins encombrée, nettoyée puis reliée au reste de la carte. La connexion automatique ne perce jamais la coque.
- La foreuse démarre au fond du couloir (case de soute du haut), mèche vers la porte. La coque bloque le passage mais pas la vue ; la foreuse peut toujours revenir dans la soute. Les ennemis peuvent aussi y entrer. Aucune règle d'exception sur les diagonales : c'est la forme du couloir qui empêche d'entrer ou de sortir ailleurs que par la porte.
- Dessin : coque en accent avec coutures et rivets bio, sol de soute à grille bio, verrière bio avec un reflet blanc dans le nez (case du haut), porte à bandes monde, tuyères bio.
- Passer la porte (entrer ou sortir) joue un bruitage de porte automatique (souffle pneumatique, servo, choc de fin de course) et l'écrit dans le journal.

## 5. Foreuse (robot)

| Stat | Valeur | Rôle |
|---|---|---|
| Vie | 100 | **pas de réparation automatique** |
| Énergie | 100 | se recharge de POW par battement (**1/t** au départ depuis le 13 novembre 2026, **× 2 en attendant sur place**) ; **se déplacer ne coûte plus d'énergie** (13 novembre 2026 ; 2 par pas avant, constante `MOVE_COST`), un coup de foreuse sur la roche 10 (frapper un animal : gratuit) |
| VIT | 5 | **vitesse de déplacement** (13 novembre 2026) : un pas dure 100 × 5 ÷ VIT. À 5, un pas = un battement ; à 10, deux pas par battement. Ne joue ni sur les coups ni sur le forage. Améliorable par joyau (+1). |
| EYE | 10 | rayon de vision (5 avant le 10 novembre 2026) |
| DEG | 10 | dégâts par coup de foreuse |
| PRE | 80 | précision |
| ESQ | 10 | esquive (modifiée par le terrain) |
| CRIT | 5 % | chance de coup critique (×3 dégâts) ; coup par surprise toujours critique |
| POW | 1 / battement | recharge d'énergie (doublée en attendant sur place) (5 avant le 13 novembre 2026 ; 6 puis 3 le 9 novembre) |

- Un coup de foreuse sur une **roche** coûte **10 d'énergie** (refusé sous 10) ; **attaquer un animal ne coûte plus d'énergie** (13 novembre 2026).
- **Aperçu derrière les obstacles** (foreuse seulement, depuis le 6 novembre 2026) : dans le rayon EYE, la case juste derrière un obstacle à la vue (montagne, herbes hautes) est aperçue en **mode souvenir** — terrain affiché assombri comme une case explorée hors de vue, sans les créatures. Une seule case : un obstacle de 2 cases d'épaisseur cache toujours la suite. Les ennemis ne voient pas à travers les obstacles.
- Attendre un tour : Espace ou 5. **La recharge d'énergie y est doublée** (13 novembre 2026) : 2/t à POW 1, 2 × POW en général. C'est la façon de refaire le plein après avoir couru ou foré.
- **Repos** (touche P, ou bouton « REPOS » du pavé, 13 novembre 2026) : enchaîne des attentes **jusqu'à l'énergie pleine**. Chaque battement est une attente ordinaire (recharge doublée, portée de discrétion ÷ 2), le journal n'en garde que le début et la fin. Le repos s'arrête net si une créature **entre dans le champ de vision**, si un ennemi déjà visible **repère** la foreuse, si elle est **touchée**, ou à la moindre touche ou clic du joueur. Il est refusé d'emblée si l'énergie est déjà pleine ou si un ennemi visible vous chasse déjà. Garde-fou : 400 battements au plus.
- **Course** (touche R, ou bouton « MARCHE / COURSE » sous l'énergie ; le mot « Allure » et l'indication « vitesse × » ont été retirés le 13 novembre 2026) : mode qu'on allume et qu'on éteint. Chaque pas dure moitié moins et coûte **5 d'énergie** ; sans assez d'énergie, la foreuse reprend la marche d'elle-même. **Le moteur s'entend : + 2 cases de portée de discrétion** (13 novembre 2026), appliquées après tous les autres modificateurs. Bruitage de moteur électrique au démarrage, à l'arrêt et à chaque pas couru.

## 5 bis. Horloge : le temps continu (13 novembre 2026)

Le jeu ne compte plus en tours mais en **unités de temps**, comme Brogue et Cogmind.

- Chaque action de la foreuse a une **durée** (table `DUR` dans `09`) : pas 100, coup de foreuse 100, coup sur la roche 100, attendre 100. Ces durées sont faites pour être réglées et, plus tard, modifiées par l'équipement.
- Durée d'un pas = 100 × 5 ÷ VIT × terrain (eau peu profonde 1,5 ; eau profonde 2) × 0,5 en course.
- Le monde **bat toutes les 100 unités** : à chaque battement les ennemis agissent, la détection et la perte de trace sont tirées, l'énergie remonte de POW. Une action de 50 laisse passer un battement une fois sur deux ; une action de 200 en laisse passer deux.
- Conséquence voulue : **la détection se tire au temps, pas à l'action**. Courir fait traverser une zone avec deux fois moins de tirages ; une action longue en fait subir davantage.
- À VIT 5, en marchant sur sol sec, un pas vaut exactement un battement : rien ne change par rapport à avant, et les mesures de `mesures.md` restent valables. « Par tour » dans ce document se lit désormais « par battement ».
- Les ennemis gardent leurs points de mouvement (VIT ÷ 5 par battement), divisés par le ralentissement du terrain où ils se trouvent.
- Limite connue : les ennemis agissent par battements entiers, seule la foreuse a des durées fines.

## 6. Combat

- Chance de toucher = précision de l'attaquant − esquive de la cible, bornée entre 5 et 95 %.
- Foncer sur un animal = coup de foreuse (dégâts DEG). Coup raté : « 0 » affiché (gris). Frapper un animal ne consomme pas d'énergie.
- Les animaux attaquent **une fois par battement au contact** ; leur vitesse ne règle que les déplacements (vitesse 5 = 1 case par battement), et l'eau les ralentit comme la foreuse, sauf les nageurs.
- Animation : bond de l'attaquant, flash, chiffres de dégâts flottants (« -10 », « 0 » pour un coup raté, de part et d'autre), « +10 / +15 / +20 » en couleur bio au ramassage d'éclats de métal, tremblement d'écran quand le robot est touché ou qu'un ennemi meurt.
- Un animal tué laisse une trace de sang.

## 6 bis. Inventaire et équipement (13 novembre 2026)

Version d'essai : tous les objets sont donnés au départ, non équipés sauf la foreuse, pour pouvoir tout essayer (choix confirmé le 13 novembre 2026 pour la phase d'équilibrage).

- **Emplacements** : 1 arme, 1 armure, 3 accessoires. Le sac n'a pas de limite pour l'instant.
- **Ouverture** : bouton « INVENTAIRE » à côté de « MARCHE / COURSE », ou touche **I**. L'inventaire est une **fenêtre plein écran, comme le Tile editor** (le panneau dans la colonne, essayé d'abord, a été abandonné le jour même). Le jeu ne reçoit plus les touches tant qu'elle est ouverte ; le temps ne passe pas.
- **Liste à gauche** : une ligne par objet, précédée d'un signe (`/` arme, `[` armure, `=` accessoire, `!` consommable), suivie de son type. Un objet **équipé reste dans la liste**, en couleur monde, avec la mention « équipé ». Les consommables identiques s'empilent (« ×2 »).
- **Fiche à droite** de l'objet choisi : dessin **ASCII coloré** aux couleurs de la palette, description, effets (en accent s'ils sont favorables, en rouge sinon), boutons **Équiper / Retirer / Utiliser** et **Jeter**. Le dernier message est répété sous la liste, le journal étant caché.
- **Choisir** : à la souris (clic ; double-clic = Entrée) ou au clavier : ↑ ↓ (ou Z S, 8 2) pour parcourir, **Entrée** pour équiper, retirer ou utiliser, **J** (ou Suppr) pour jeter, **G** pour ramasser ce qui est sous la foreuse, **I** ou **Échap** pour fermer.
- **Équiper** est gratuit et instantané. Une arme ou une armure remplace celle qui est portée ; un 4ᵉ accessoire est refusé tant qu'un emplacement n'est pas libéré.
- **Effets** : l'objet ajoute ses modificateurs aux stats tant qu'il est porté ; les stats modifiées s'affichent en couleur dans « Statistiques ». Les bonus des joyaux s'additionnent.
- **Consommables** : usage unique, gratuit et instantané pour l'instant. Refusé si la jauge est déjà pleine (l'objet n'est pas perdu) ; le surplus au-delà du maximum est perdu.
- **Jeter** pose l'objet (un seul exemplaire pour une pile) au sol sous la foreuse (tuile « Objet au sol », retouchable au Tile editor). Repasser sur la case le ramasse ; sans bouger, touche G ou bouton « Ramasser ». La fiche de survol nomme les objets posés.
- **Durée du coup** : une arme peut allonger ou raccourcir le coup de foreuse (§ 5 bis) ; plancher à 25.
- « Pas de blindage » (§ 11) tient toujours : aucune armure ne réduit les dégâts, elles jouent sur la vie max, l'esquive ou la discrétion.

| Objet | Type | Effets |
|---|---|---|
| Foreuse | arme | arme de départ, sans modificateur : DEG 10, coup 100 |
| Foret diamant | arme | DEG −2, PRE +15, coup rapide (60) |
| Marteau-pilon | arme | DEG +15, PRE −10, coup lent (150) |
| Scie circulaire | arme | DEG +3, CRIT +15 % |
| Lance thermique | arme | DEG +7, ESQ −10 |
| Châssis renforcé | armure | Vie max +30, VIT −1 |
| Coque furtive | armure | ESQ +5, DIS −2 (portée de discrétion) |
| Châssis allégé | armure | VIT +1, ESQ +10, Vie max −15 |
| Coque isolante | armure | poison et glu durent deux fois moins, Vie max +10 |
| Servomoteur | accessoire | VIT +2 |
| Téléobjectif | accessoire | EYE +3 |
| Viseur laser | accessoire | CRIT +10 % |
| Condensateur | accessoire | POW +1 |
| Gyroscope | accessoire | ESQ +10 |
| Stabilisateur | accessoire | PRE +10 |
| Accumulateur | accessoire | Énergie max +40 |
| Réparobots (×2) | consommable | Vie +50 |
| Batterie (×2) | consommable | Énergie +50 |
| Purge (×2) | consommable | supprime poison et glu |
| Fumigène (×2) | consommable | les ennemis perdent la trace et ne voient plus la foreuse pendant 5 battements |
| Charge sismique (×2) | consommable | 20 dégâts à tous les ennemis à 2 cases ou moins ; bruyante (comme un forage) |

Vingt et un objets depuis le 13 novembre 2026. Règles ajoutées ce jour-là :

- **La foreuse est une arme** : c'est l'arme de départ, déjà équipée. Il y a **toujours une arme en main** : on ne peut ni la retirer ni la jeter, seulement la remplacer. **Toute arme fore la roche pareil** (choix de l'utilisateur) : l'arme ne change que le combat et le visuel.
- **Le visuel de la foreuse suit l'équipement** : l'arme dessine la moitié avant (la pointe), l'armure la moitié arrière (le corps), dans les quatre orientations. Sans armure et avec la foreuse d'origine, c'est la tuile « Foreuse » du Tile editor, retouches comprises ; les autres combinaisons ne sont pas encore retouchables.
- **Maximum de vie ou d'énergie modifié par un objet** : la jauge garde sa proportion (100/100 devient 130/130, 50/100 devient 65/130). S'équiper ne soigne pas, ne blesse pas, et retirer puis remettre ne rapporte rien.
- **Statistiques dans la fenêtre** : sous la fiche, les onze valeurs actuelles ; pour l'objet choisi, la valeur qu'aurait chaque stat après Entrée s'affiche à côté (« DEG 10 → 25 »), en accent si elle y gagne, en rouge si elle y perd.
- Dessins ASCII agrandis (30 px).

Premier équilibrage mesuré le 13 novembre 2026 (duels simulés, `outils/simul.py combat`, résultats dans `mesures.md`) : les quatre armes spéciales valent à peu près autant, chacune nettement mieux que la foreuse nue ; les armures et accessoires de combat apportent un gain modéré. Rien n'étant équipé au départ, les mesures de détection et de fuite restent valables.

Reste à faire : faire **trouver** les objets (au sol, lâchés par les ennemis, fabrication plus tard) et retirer le sac de départ ; attaques spéciales (plus tard) ; décider si équiper ou utiliser prend du temps ; limite du sac.

## 7. Bestiaire

| Espèce | VIT | PV | DÉG | PRE | ESQ | CRIT | Référence (niveau Normal, taille 4) |
|---|---|---|---|---|---|---|---|
| Insectoïde | 6 | 10 | 3 | 60 | 30 | 5 % | 21 |
| Crabos | 5 | 25 | 5 | 70 | 15 | 5 % | 15 |
| Cafar | 5 | 10 | 5 | 60 | 0 | 5 % | 12 (bandes de 2 à 4 : tirage parmi 2, 3, 4, 4 — 2 à 5 avant le 13 novembre 2026) |
| Crachin | 4 | 12 | 4 | 65 | 10 | 0 | 4 |
| Vipérin | 6 | 12 | 3 | 70 | 25 | 5 % | 4 |
| Gluar | 3 | 30 | 6 | 65 | 0 | 0 | 3 |
| Siphon | 7 | 8 | 2 | 70 | 35 | 0 | 3 |
| Tapi | 4 | 18 | 6 | 85 | 5 | 5 % | 4 |
| Taupar | 3 | 35 | 7 | 70 | 5 | 5 % | 2 |
| Mastok | 3 | 60 | 14 | 60 | 0 | 10 % | 1 |

**Dix espèces depuis le 13 novembre 2026.** Les sept nouvelles ont chacune un rôle :

| Espèce | Rôle | Particularité |
|---|---|---|
| Crachin | tireur | crache de l'acide jusqu'à **5 cases** tant qu'il voit la foreuse ; serré à 2 cases ou moins, il recule une fois sur deux au lieu de tirer |
| Vipérin | empoisonneur | sa morsure pose un **poison** : 2 points de vie par battement pendant 5 battements (se renouvelle, ne se cumule pas) |
| Gluar | entrave | sa **glu** double la durée des pas pendant 4 battements : gênant pour fuir, pas pour se battre |
| Siphon | harceleur | chaque piqûre **vole 15 d'énergie** ; rapide, difficile à toucher, très fragile |
| Tapi | embusqué | caché dans les **herbes hautes**, invisible et absent de toutes les listes ; frappe **par surprise** (touche toujours, critique) dès que la foreuse est à son contact, puis se bat normalement. Si la foreuse bute dessus avant, c'est elle qui a la surprise |
| Taupar | creuseur | en chasse, il vient **en ligne droite en perçant la roche** (une paroi = un battement) ; les éclats et joyaux de la paroi tombent comme pour la foreuse |
| Mastok | colosse | lent, 60 PV, 14 de dégâts : à éviter ou à fuir sans équipement |

Effets durables sur la foreuse : affichés sous les jauges (« Poison 4 · Englué 2 »), décomptés à chaque battement. La Coque isolante divise leur durée par deux, la Purge les supprime.

La statistique **DÉT (détection)** par espèce a été supprimée le 13 novembre 2026 : toutes les espèces partagent désormais la portée de discrétion de la foreuse (ci-dessous).

(Valeurs par défaut du code. Les valeurs réellement utilisées sont celles enregistrées par le joueur — voir § 10.)

### Comportements
- **Eau** : les crabos entrent dans l'eau peu profonde et profonde (et y subissent −20 d'esquive) ; les insectoïdes et les cafars n'entrent dans aucune eau et la contournent (bandes de cafars comprises). Si la foreuse est dans l'eau, ils l'attaquent depuis la rive.
- **Poursuite (tous les ennemis)** : chaque ennemi qui chasse ou attaque suit le plus court chemin vers la foreuse. Si un autre ennemi bloque le passage, il contourne l'obstacle (détour de 10 cases au plus) vers une case libre autour de la foreuse, au lieu d'attendre : plusieurs ennemis peuvent ainsi l'encercler et attaquer en même temps (jusqu'à 8).
- **Diagonales comme dans Brogue** (10 novembre 2026) : un pas ou un coup en diagonale est **impossible si l'une des deux cases voisines orthogonales est une paroi** (rocher, montagne, coque du vaisseau) — on ne coupe pas les coins. Vaut pour la foreuse (message « Coin de paroi »), tous les ennemis (déplacements et attaques), le courant de l'eau profonde, les trajets automatiques et la génération (connexion des zones et accès aux sites calculés avec la même règle). L'eau et les gouffres ne bloquent pas les diagonales. Dans le brouillard, le trajet ne tient compte que des coins déjà vus.
- **Coup par surprise** : frapper un ennemi qui **ne vous a pas repéré** (ni en chasse, ni alerté, ni en train de vous chercher) **touche toujours** et est **toujours critique**. Message « Coup par surprise ! ».
- **Coups critiques** : un critique fait **×3 dégâts**. Foreuse : stat **CRIT 5 %** au départ (+5 % par amélioration de joyau). Ennemis : chacun a sa stat CRIT (5 % par défaut, réglable dans le Bestiaire, colonne « Critique % »). Chiffre flottant suivi de « ! » (couleur accent pour la foreuse), secousse et son sec.
- **Mémoire, dernière position connue (tous les ennemis, 10 novembre 2026)** : un ennemi ne connaît la position de la foreuse que s'il la voit. Il retient l'endroit où il l'a vue ; quand il ne la voit plus, il s'y rend par le plus court chemin. Pour une **bande de cafars**, cette position est **partagée** : ce qu'un membre voit, toute la bande le sait . Crabos et insectoïdes ont chacun leur propre mémoire. Arrivé (ou bloqué 3 tours), il **fouille 4 tours** autour, puis **oublie** et reprend son comportement de départ (errance, voyage de la bande). Un coup de foreuse le met aussi au courant. État affiché : « en chasse », « cherche » (vers la dernière position), « fouille ». Remplace l'ancienne poursuite « à l'aveugle » de 8 tours (qui connaissait la position réelle).
- **Portée de discrétion (13 novembre 2026, inspirée de Brogue)** : la détection appartient à la foreuse, pas aux ennemis. **Un seul rayon, le même pour toutes les espèces** : un ennemi qui ne vous a pas repéré, situé dans ce rayon **et en ligne de vue**, a **25 % de chance par tour** de vous remarquer (chance plate, sans effet de la distance : c'est le choix de Brogue depuis sa version 1.7.3, pour la lisibilité). Calcul, dans cet ordre : **base 10**, **×1,5 en brisant un rocher ou une montagne** (le bruit s'entend **à travers les parois** : ce tour-là, un ennemi calme dans le rayon peut vous remarquer **même hors de vue**, toujours 25 %), **÷2 en attendant sur place**, **÷2 sur des herbes basses** (arrondi au supérieur à chaque division), **−1 par 2 parois adjacentes, arrondi au supérieur** (rocher ou montagne, les 8 voisines : 1-2 parois −1, 3-4 −2, 5-6 −3, 7-8 −4 ; **retrait limité à −4**, constante `WALL_MAX`), **plancher 2**, puis **+ 2 en courant** (13 novembre 2026 ; ajouté après le plancher, donc toujours exactement + 2 cases). Exemples : 10 en terrain dégagé, 8 le long d'une falaise (3 parois), 5 sur des herbes basses, 5 en attendant, 3 en attendant sur des herbes basses, 2 en attendant dans un recoin, 15 en brisant une paroi. Un ennemi **déjà en chasse** vous garde en vue jusqu'à **2 fois** ce rayon (13 novembre 2026 ; Brogue en met trois) ; **dès qu'il perd le contact visuel** — ligne de vue coupée, ou au-delà de ce double rayon — il rejoint votre **dernière position connue**, y fouille, puis oublie. **Perte de trace** (13 novembre 2026, les 3 % de Brogue) : tant qu'il vous suit **hors du rayon** mais dans cette bande de chasse, il a **3 % par tour** de perdre votre trace — une trentaine de tours en moyenne. Il garde alors sa dernière position connue et s'y rend, mais ne vous suit plus de loin : il lui faut **vous remarquer de nouveau** (25 % par tour) à l'intérieur du rayon. Dans le rayon, il ne vous perd jamais. Mesuré : jamais de perte à 5 ou 10 cases, 32 tours en moyenne à 13 et 19 cases, contact rompu aussitôt au-delà de 20 ; après une perte, repérage de nouveau en 3,8 tours à 4 cases. Valeur de base réglable dans **Lab → Discrétion** (fenêtre dédiée, voir ci-dessous ; plus dans le Bestiaire depuis le 13 novembre 2026), affichée dans la colonne de droite sous **DIS** (ambre quand elle est sous la base, rouge au-dessus). Le forage d'un site ne compte pas : il termine le niveau, les ennemis ne jouent plus.
- **Fenêtre Discrétion** (Lab → Discrétion, 13 novembre 2026) : affiche la **base** (modifiable, 2 à 30, défaut 10, bouton « Valeur par défaut », effet immédiat), la portée actuelle, le **tableau des modificateurs** (marcher, briser, attendre, herbes basses, parois adjacentes, avec la portée obtenue pour la base choisie) et les règles liées (×2 en chasse, 3 % de perte de trace). Calcul partagé avec le jeu (`stealthCalc`). Échap ou Fermer pour quitter.
- **Touche V** (10 novembre 2026, refaite le 13 novembre) : affiche ou masque la **portée de discrétion** — les cases d'où un ennemi pourrait vous remarquer (rayon et ligne de vue depuis la foreuse), **entourées d'un contour pointillé blanc** (pixels de tuile opaques, un sur deux, sur le bord de la zone ; l'intérieur reste intact). Remplace l'ancien affichage du champ de vision de chaque ennemi.
- **Crabos** : erre ; dès qu'il voit le robot, le chasse et l'attaque au contact ; le perd de vue → dernière position connue (ci-dessus).
- **Insectoïde** : une fois le robot repéré, le suit à 2–3 cases (recule au contact, se rapproche au-delà de 3). Si un ennemi chasse le robot à 4 cases ou moins, il passe à l'attaque et **ne recule plus jamais** ensuite.
- **Cafar** : vit en bande ; chaque individu reste à 4 cases au plus du centre de sa bande. Hors chasse, la bande voyage vers un point accessible tiré au hasard (≥ 10 cases), y fait une **pause de 50 tours**, puis repart. **Cri d'alerte retiré le 13 novembre 2026** (le code reste, désactivé par `alarm:false` dans la fiche de l'espèce) : seule la mémoire partagée de la bande subsiste, les autres ennemis ne sont plus alertés. La fiche du Bestiaire ne mentionne plus l'alerte (corrigé le 13 novembre 2026) ; la colonne « Critique % » y est devenue « Crit % », sur une seule ligne.

## 8. Objectifs et progression

- **Un seul site de forage par carte** depuis le 13 novembre 2026 (5 auparavant), toujours de **profondeur 10** : simple valeur affichée, sans effet de jeu (choix de l'utilisateur). Il est placé dans le tiers de la carte le plus éloigné de l'arrivée : il faut la traverser. Forer fait descendre au niveau suivant (§ 3 bis).
- Forage : touche F sur un site → confirmation → descente → écran « Entrée niveau 2 ».
- **1 joyau** par planète, au cœur d'un massif (8 voisines en roche, jamais en bordure), visible dès que la case est vue. Briser la roche, le ramasser → choix de **3 améliorations tirées au hasard** parmi : Vie max +10, Énergie max +10, EYE +1, DEG +5, PRE +5, ESQ +5, POW +1, VIT +1 (13 novembre 2026).
- **Éclats de métal** (9 novembre 2026) : **10 % des cases de montagne** (hors rangée extérieure indestructible et joyau ; réglage `ORE_PCT` dans la génération) montrent des éclats de métal couleur bio — ceux pris au cœur d'un massif ne se voient qu'en creusant jusqu'à eux. Briser la paroi les fait **tomber au sol** ; la foreuse qui passe dessus les ramasse et regagne des PV selon la **densité** : **petits +10 PV** (50 % des éclats), **moyens +15 PV** (30 %), **gros +20 PV** (20 %), sans dépasser la vie max (réglages `ORE_PV`, `ORE_MIX`). Chaque densité a sa tuile, dans la paroi et au sol. Signalés dans la fiche de survol (plus de liste dans « En vue » depuis le 13 novembre 2026). Tuiles éditables : Éclats petits / moyens / gros, en montagne et au sol (dessins retouchés au Tile editor et adoptés comme norme le 9 novembre 2026).
- **Mort d'un ennemi** (9 novembre 2026) : en plus de la tache de sang, une **petite giclée** de 24 à 35 gouttes (pixels de tuile opaques, rouges, 1 ou 2 pixels) projetées en l'air dès l'impact, vite (70 à 180 px/s, freinées par l'air, retombées en moins d'une demi-seconde, à une ou deux cases au plus) ; en retombant elles **restent collées au sol** (sauf dans l'eau, un gouffre ou un obstacle). Au plus 1 500 gouttes gardées sur la carte (les plus anciennes s'effacent) ; comme le sang, elles restent en souvenir (atténuées) hors de vue.
- **Foreuse endommagée** (9 novembre 2026) : sous **50 PV** elle **fume** (grains gris opaques de 1 ou 2 pixels de tuile, calés sur la grille des pixels, qui montent en ondulant et disparaissent d'un coup — **pixel perfect, sans opacité ni changement de taille** ; la fumée reste sur place quand elle avance, comme une traînée) ; sous **20 PV** la fumée double et de **petites flammèches** (jaune, orange, rouge) s'échappent de la coque. Dessiné sur un calque transparent au-dessus de la vue, animé en continu sans redessiner la carte.
- **Mort de la foreuse** (9 novembre 2026) : à 0 PV, la foreuse **explose** — éclair blanc, secousse, détonation, et ~520 éclats (couleurs accent et bio, quelques blancs, 2 à 5 px) projetés en l'air qui retombent, **rebondissent** au sol, ricochent sur rochers, montagnes et vaisseau, tombent dans les gouffres et disparaissent d'un coup chacun à son heure (comme la poussière d'atterrissage). Ils **restent dans la zone visible** (le bord de la vue les arrête comme un mur). La foreuse n'est plus dessinée. Quand tout est retombé : **« FOREUSE DÉTRUITE »** en très gros, puis deux boutons au style du menu d'amélioration : **Nouvelle exploration** et **Quitter**. Pas de menu principal pour l'instant (choix du 9 novembre 2026).
- **Quitter** : une page web ne peut pas fermer son onglet ; l'écran devient noir avec « SIGNAL COUPÉ », le son est coupé, et un bouton discret « Rallumer » relance une nouvelle exploration.
- **Bouton Enregistrer du Bestiaire** (10 novembre 2026) : même enregistrement (base de l'artefact, `reglages/courant`) ; Claude lit ensuite les valeurs et en fait les nouvelles valeurs de référence dans le code (celles de « Valeurs par défaut »).
- **Bouton Enregistrer** (Tile editor, rétabli le 9 novembre 2026) : envoie les tuiles retouchées et les autres réglages dans la base de l'artefact (`reglages/courant`). Claude peut alors les lire et les adopter comme dessins de référence dans le code.

## 9. Interface

- **Pas d'écran d'accueil** : la partie commence directement, foreuse dans la soute (plus de texte d'explication ni de bouton « Déployer le robot »). Le son s'active à la première touche ou au premier clic (règle des navigateurs).
- Plein écran ; colonne noire à droite, défilable à la molette ou au doigt mais sans barre de défilement (pour ne pas la déformer) ; journal de bord sous la carte (5 dernières lignes, numéro de tour, ×N pour les répétitions).
- **Statut** : barres ASCII `█`/`░` (20 caractères) — Vie en couleur technologie, Énergie en couleur structure ; pas de chiffres.
- **Statut** : barres Vie et Énergie suivies de leur valeur chiffrée (« 63/100 »), remises le 10 novembre 2026.
- **Statistiques** (sous-menu repliable, sous Statut) en **grille 3 × 3** : VIT, EYE, DEG / PRE, ESQ, CRIT / POW, NUL 0, NUL 0 (deux emplacements libres) (ESQ affiche la valeur modifiée, colorée, sans le modificateur).
- **En vue** (sans titre, sous la mini-carte) : fiche d'inspection de la case survolée en tête (voir ci-dessous), puis animaux visibles (icône, barre de vie ASCII 10 caractères, colonnes TOUCHER / SUBIR colorées). Joyaux, roches à joyau, éclats de métal et sites ne sont plus listés ici (retirés le 13 novembre 2026) : on les lit à la fiche de survol.
- **Mini-carte** pleine largeur ; ennemis en points rouges ; un clic recentre la vue (mode carte) ; bouton maintenu + glisser = défilement en temps réel. Saisi à l'intérieur, le cadre suit le pointeur sans sauter ; saisi à l'extérieur, il se centre d'abord sous le pointeur. Fonctionne aussi au doigt.
- Sous-menus repliables : **Statistiques**, **Génération** (+ bouton REGEN), **Life** (intensité par espèce, § 3), **Palette**, **Lab** (Bestiaire, Discrétion, Tile editor, Intro ; plus de bouton Enregistrer pour l'instant les réglages, aide des touches).

### Souris et inspection (inspirées de Brogue)
- Le curseur système est masqué sur la carte ; le **viseur** est dessiné sur la case survolée. Dès qu'on appuie sur une touche (hors mode inspection), le viseur, la fiche et le trajet disparaissent jusqu'au prochain mouvement de souris.
- **Survol** : fiche complète dans « En vue » — terrain et ses effets, distance, créature (état, PV, DÉG, PRE, ESQ modifiée, VIT, chances Toucher / Subir, comportement), site (profondeur ou « non analysé »), joyau (libre ou pris dans la roche), roche fissurée, bord indestructible, traces de sang, « souvenir » si la case est hors de vue, et l'action du clic (« y aller · N tours », « frapper », « forer »).
- **Trajet** : le plus court chemin (Dijkstra, 8 directions, cases connues seulement, eau profonde évitée, créatures visibles contournées) s'affiche par un petit rond blanc en pixel art (4 × 4 pixels de tuile, opacité 70 %) au centre de chaque case intermédiaire, rien sur la case du viseur.
- **Clic** : case voisine = action immédiate (pas, coup de foreuse, attaque) ; case lointaine = déplacement automatique, un pas toutes les 90 ms. Si la destination est une roche ou une créature, la dernière étape est un coup de foreuse. Clic sur la foreuse posée sur un site = forer.
- **Clic dans le brouillard** (9 novembre 2026) : une case inexplorée (ou une case vue mais atteignable seulement en passant par l'inexploré) est une destination valide. Le trajet suppose franchissables les cases jamais vues, sans regarder ce qu'elles cachent (l'aperçu ne révèle donc rien), et **se recalcule à chaque pas** avec ce que la foreuse découvre. Elle ne fore jamais pendant un tel trajet : elle **s'arrête** quand plus aucun passage ne mène à la destination, ou quand la destination se révèle infranchissable (montagne, rocher, gouffre). Les autres arrêts (ennemi, site, joyau…) s'appliquent aussi.
- **Arrêt du trajet** : nouvel ennemi en vue, foreuse attaquée, nouveau site repéré, passage sur un site, joyau repéré, dérive dans l'eau profonde, passage bloqué, énergie insuffisante, ou toute touche / tout clic du joueur. Le motif s'affiche dans le journal.
- **Touche X** : mode inspection au clavier ; le viseur part de la foreuse, se déplace avec les touches de direction (Maj = 5 cases), Entrée ou Espace = y aller, X ou Échap = quitter.
- **Écran tactile** : premier appui = inspection et trajet, second appui sur la même case = déplacement.

### Tile editor (Lab → Tile editor)
- Liste des tuiles éditables, par groupe : **Viseur** ; **Foreuse et faune** (Foreuse, Insectoïde, Crabos, Cafar) ; **Terrain** (Sol, Rocher, Rocher 2, Crête, Montagne, Eau A, Eau B, Eau profonde, Herbes hautes, Herbes basses, Gravats, Fissures, Remous, Remous profond) ; **Objets** (Site, Joyau, Éclats petits / moyens / gros (montagne et sol), Sang A, Sang B) ; **Vaisseau** (Cargo, édité d'un bloc : 80 × 96 pixels, pixels affichés en 4 × 4, limites des cases repérées ; sur la carte il est découpé case par case).
- Les variantes suivent la tuile de base : 4 orientations de la foreuse, animaux tournés à gauche, 2e image de l'eau profonde, joyau dans la roche et son liseré.
- Non éditables pour l'instant : sites analysés (chiffres), traces de chenilles, ancien sprite robot.
- Éditeur 16 × 16 : encres en pastilles de couleur, sans nom (nom au survol) : **Monde, Bio, Accent** (suivent la palette active), **Blanc**, **Noir**, **Rouge** (#b8242a, celui du sang), Gomme (pastille hachurée) ; clic droit = effacer ; Miroir ↔ et Miroir ↕ (désactivés par défaut, les deux ensemble = symétrie ×4) ; boutons Contour auto, Vider, **Rétablir l'enregistré** : revient à la version enregistrée avec « Enregistrer les réglages » (ou au dessin d'origine si la tuile n'a jamais été enregistrée). Le titre de l'éditeur indique « enregistrée » ou « non enregistrée ».
- Aperçu : la tuile en grand, puis en pavage (terrain) ou posée sur le sol (foreuse, faune, objets, viseur).
- Retouches mémorisées dans le navigateur (`np-tiles`). « Enregistrer les réglages » les écrit dans la base (champ `tuiles`) et en fait la nouvelle référence (`np-tiles-base`) ; au chargement, les tuiles de la base deviennent aussi la référence.

- Export / import texte : essayé puis retiré le 6 novembre 2026 (« on verra plus tard »).

### Touches
ZQSD / flèches / pavé numérique : déplacer · A E W C : diagonales · Souris : survol = inspection, clic = y aller · X : inspection au clavier · R : courir / marcher · I : inventaire · F : forer · Espace / 5 : attendre · P : repos jusqu’à l’énergie pleine · V : portée de discrétion · B : brouillard de guerre · ! : son · M : mode carte (déplacements = défilement, Maj = plus vite, Échap ou M pour revenir).

## 10. Sauvegarde des réglages

**État au 6 novembre 2026 : bouton « Enregistrer » retiré du Lab (à reprendre plus tard).** Les réglages restent dans le navigateur ; au chargement, la base n'est relue que si elle est plus récente que les retouches locales. La fonction d'enregistrement est conservée dans le code, inactive. Le Tile editor affiche « retouchée » et son bouton s'appelle de nouveau « Rétablir » (retour à la tuile de référence).

- Bouton « Enregistrer les réglages » (Lab) → document `reglages/courant` dans la base de l'artefact (bestiaire, Life, génération, palettes, tuiles retouchées, stats du robot).
- Au chargement, ces réglages sont réappliqués (sauf les stats du robot) **seulement s'ils sont plus récents que les retouches faites dans ce navigateur** (horodatage local `np-maj`, mis à jour à chaque changement de palette, de tuile, de génération, de faune ou de bestiaire, et à chaque enregistrement). Sinon les réglages locaux sont conservés et un message invite à enregistrer. Avant le 6 novembre 2026, la base écrasait systématiquement les retouches locales non enregistrées à chaque rechargement : c'est ainsi que des palettes et des tuiles ont été perdues.
- Claude peut lire ce document avec l'outil ArtifactData pour analyser l'équilibrage avec les vraies valeurs.

## 10 bis. Scène d'intro (en cours)

Décisions validées le 6 novembre 2026 :
- **Vue de dessus** du début à la fin, vaisseau nez vers le haut.
- Séquence : hyperespace (lignes blanches, 2 s) → étoiles en parallaxe (2 s) → la planète grossit (dessinée à partir de la vraie carte générée) → entrée dans l'atmosphère (tremblement, nuages, éclairs) → survol du vrai terrain qui défile, ralentit, et le vaisseau se pose. Passable (Échap ou clic).
- Jouée **seulement au premier lancement** ; un bouton du Lab relance la scène et génère une nouvelle carte.
- **Vaisseau sur la carte** : cœur de 3 × 5 cases, 3 cases praticables (2 de soute + la porte), porte à l'arrière, quelques cases en plus pour la silhouette. Simple décor **indestructible** ; la foreuse commence à l'intérieur et peut toujours y revenir.
- **Vaisseau retenu : A Cargo** (planche des 3 propositions : artefact « Vaisseau U-7 », https://claude.ai/artifact/CzS1RLUyHHM164NPRuUECA).
- Étape 2 faite : le Cargo est posé sur la carte (voir § 4 et § 9).
- **Étape 3 faite : la cinématique** (version du 6 novembre 2026 après-midi, environ 10 s — raccourcie d'un tiers, canvas plein écran au-dessus du jeu). La foreuse est visible dans la soute (case du haut du couloir) du début à la fin.
  - **Variations à chaque lancement** (10 novembre 2026) : la descente dure de 5,9 à 9,3 s (7,4 s avant ; le posé et la suite se décalent d'autant) ; l'entrée dans l'atmosphère commence entre 5 et 20 % de la descente, culmine entre 60 et 76 % et retombe en 10 à 24 % ; **2 à 6 éclairs** à rythme irrégulier autour du pic, parfois en doublé rapproché ; densité des nuages × 0,4 à × 1,7 (nuages dispersés et nuages autour du point d'atterrissage). Les instants cités ci-dessous sont ceux d'un tirage moyen.
  - 0–1 s **hyperespace** : étoiles étirées en traînées blanches qui raccourcissent.
  - 0,85–2,4 s **la planète entre par le haut** : disque de 12 tuiles de diamètre taillé dans une version réduite de la vraie carte (limbe assombri, liseré bio). **Le vaisseau ne s'arrête jamais** : les étoiles continuent de défiler lentement (30 % de la vitesse) et il tangue de gauche à droite (et un peu d'avant en arrière) jusqu'au posé.
  - 1,6–9 s **descente** (plus rapide, 7,4 s), commencée pendant l'entrée de la planète, **sans temps mort** : le zoom démarre à pleine vitesse et ralentit jusqu'au posé (courbe 1 − (1 − d)²) : les tuiles gardent leur taille (32 px), le disque montre de plus en plus de cases jusqu'à l'échelle réelle, sans défilement ; les étoiles s'effacent quand la planète remplit l'écran.
  - **Nuages procéduraux en tuiles** (version du 6 novembre 2026, midi). 6 tuiles jointives éditables dans le Tile editor, groupe « Intro » : *Nuage plein* et *Nuage texturé* pour le cœur (opaques), *Bord diagonal*, *Bord croisé*, *Bord rayé* et *Bord tramé* pour le pourtour (hachures : le terrain se voit entre les traits ; bords dessinés semi-transparents). Chaque nuage a son style de bord.
    - Formes procédurales : union de disques (rayon 0,9 à 1,6 case, plus larges que hautes) couvrant environ **6, 9, 12, 18 ou 24 cases** de carte. 5 couches de 8 à 11 nuages dispersés, plus 4 nuages par couche autour du point d'atterrissage (zone d'autant plus serrée que la couche est basse). Altitudes 0,2 / 0,295 / 0,605 / 1,344 / 2,6, réglées pour que les couches sortent du cadre l'une après l'autre entre 60 % et 86 % de la descente : **des nuages jusqu'à la fin**, le dernier sort environ 1 s avant le posé.
    - **Les tuiles de nuage ne sont jamais agrandies** (32 px, sur la grille de l'écran comme le sol). Chaque tuile échantillonne la couche (2 × 2 à 4 × 4 points) : vu de loin, un nuage ne fait qu'une ou deux tuiles ; en s'approchant il est fait de **plus en plus de tuiles**. Tuile pleine au cœur, tuile de bord (hachures, semi-transparente selon la couverture) au pourtour ; sous 25 % de couverture, rien.
    - Parallaxe : altitude caméra Z = 0,2 + 30 (k − 1)², la couche est vue à kc = k / f avec f = Z / (Z − altitude). Elle ne se voit que quand la planète remplit presque l'écran. **Les nuages ne passent jamais sur le vaisseau** : à mesure que la parallaxe monte, chaque couche s'écarte autour de lui d'un rayon de vaisseau (la couche est « fendue » et repoussée sur les côtés, sans trou), et les nuages défilent de part et d'autre. Tant que la planète est un disque, les nuages restent sur le disque. Les teintes de chaleur sont dessinées sous les nuages.
  - **Entrée dans l'atmosphère progressive** : intensité qui monte en accélérant jusqu'à un **pic critique** à 70 % de la descente (traversée des nuages), puis retombe en 16 %. Elle pilote le tremblement (jusqu'à 6 px, à-coups au pic), l'arc de plasma devant le nez (plus large, plus chaud : blanc → monde → rouge), des traînées le long de la coque, une teinte chaude sur le sol, une bordure d'écran rouge-orangé et un clignotement rouge d'alerte au pic. Trois éclairs autour du pic (62, 68, 73 %), **en pixel art** (9-10 novembre 2026) : **sur toute la hauteur de l'écran**, grille d'un pixel de tuile (2 px), tronc tortueux généré par déplacement des points milieux (zigzags à toutes les échelles), de 2 pixels, et quelques branches et rameaux d'un pixel qui partent vers le bas, **tout en couleur accent**. Opaques, sans lissage ; ils clignotent (allumé, éteint, rallumé) au lieu de s'estomper. **Tonnerre** (10 novembre 2026 ; un tonnerre qui suit le précédent de moins de 1,6 s ne rejoue que son claquement, et un limiteur en sortie empêche la saturation quand les sons s'empilent) : claquement sec et craquements aigus, puis long grondement grave de 3,4 à 4,2 s qui roule par bouffées irrégulières et s'assourdit, avec une basse profonde.
  - 7,4–9 s **posé** : le vaisseau cesse de tanguer, rejoint sa place, rapetisse (altitude) ; son ombre le rejoint, réacteurs coupés ; **poussière abondante, couleur monde uniquement** : les réacteurs soulèvent des grains dès la moitié du posé, puis gerbe de 650 grains à l'impact (2 à 3 px). Chaque grain a une hauteur : il retombe et **rebondit au sol**, **ricoche sur les obstacles** (roche, montagne, vaisseau), tombe dans les gouffres, et **disparaît d'un coup** à la fin de sa vie (chacun à son rythme, sans fondu) ; tout est retombé 1,35 s après l'impact. Dessinés sous le vaisseau ; **le brouillard de guerre ne se pose qu'une fois la poussière retombée** (de 1,4 à 2 s après l'impact), puis fondu (0,5 s). Durée totale ≈ 11,6 s. Raccord au pixel près avec la vue du jeu.
  - Sons synthétisés : souffle d'hyperespace (1 s), bourdonnement, montée, grondement de rentrée qui enfle jusqu'au pic puis retombe (environ 9 s), tonnerre, poussée, impact au posé. Le son ne démarre qu'après un clic ou une touche (règle des navigateurs) : un clic pendant l'intro l'active.
  - **Performance** : la carte entière est pré-composée une fois au lancement de l'intro (16 px par case) ; chaque tuile affichée du sol n'est plus qu'une copie. Sur écran haute densité, l'intro est rendue à densité réduite (×2 → ×1) puis agrandie sans lissage : même rendu pixel art, quatre fois moins de pixels. Mesuré en test à 2× : de ~15 à ~55–60 images/s au plus fort de la descente.
  - **Échap, Espace ou Entrée** : passer directement au posé. Les autres touches sont ignorées pendant l'intro.
- L'intro quitte le mode carte (mini-carte) si il était actif.
- Jouée **au premier lancement seulement** (mémorisé dans le navigateur, `np-intro`), pas après une mise à jour de la page en cours de partie, et pas si l'utilisateur a demandé moins d'animations. **Lab → Intro** génère une nouvelle planète et rejoue la scène. REGEN ne la joue pas.
- Boutons du Lab au format du bouton REGEN (petits, bordure et texte ambre) ; « Enregistrer les réglages » devient « Enregistrer ».

## 11. Décisions et refus à retenir

- Gerbe d'éclats d'impact : retirée. Tremblement quand la roche cède : retiré.
- Police pixel pour les dégâts : essayée puis abandonnée.
- Roches incassables à la place des gouffres : essayées puis annulées.
- Gros prédateurs 2 × 2 : supprimés.
- Pas de blindage, pas de réparation automatique.

## 12. Pistes ouvertes

Chiffres à l'appui dans `mesures.md`, points de comparaison avec Brogue dans `brogue.md`.

- Niveau 2 (sous-sol) : à concevoir (salles par accrétion ou caverne par automate cellulaire).
- Donner un effet à la profondeur des sites (risque / récompense).
- Récompenser les combats (fragments, énergie).
- **Inventaire et équipement** : première version faite le 13 novembre 2026 (§ 6 bis). Suite : provenance des objets (sol, ennemis, fabrication), attaques spéciales, équilibrage.
- Autres terrains lents possibles (gravats, herbes hautes) ; rendre la course bruyante ; donner des durées différentes aux actions (table `DUR`).
- Source de soin limitée (kits, forage qui répare).
- Exploration automatique façon Brogue (vers la zone inexplorée la plus proche), sur le même moteur de trajet.
- Fait le 6 novembre 2026 : projet sous git, fichiers séparés par thème. Reste possible : passer à de vrais modules ES (imports) si la portée globale partagée devient gênante (niveau 2).
