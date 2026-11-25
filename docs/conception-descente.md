# Noyau Profond — conception : Descente et progression

Partie du document de conception (sommaire et règles à ne pas casser : `conception.md`). Les règles telles qu'elles sont aujourd'hui ; l'historique est dans `historique.md`, les chiffres dans `mesures.md`.

## 8. Objectifs et progression

- **Un seul site de forage par carte**. Son marqueur (tuile « Site ») **reste le même une fois trouvé** (pas d'anneau chiffré, pas de profondeur affichée) ; en posant la foreuse dessus : « Site de forage détecté. [F] pour forer. ». Il est **dans la
  pièce la plus profonde** du complexe, la plus éloignée des entrées : traverser le bâtiment est l'objectif.
- **Forer** : touche F sur le site (ou clic sur la foreuse posée dessus). Aux niveaux intermédiaires la descente en ASCII part tout de suite (`conception-descente.md`) ; seul le dernier forage (le noyau), et le mode « moins d'animations », passent par la barre « Forage en cours » d'une seconde, puis l'écran **« NOYAU ATTEINT »** (bilan en tours, cases parcourues, Matière) et **Nouvelle exploration**.
- **Éclats de métal** : **10 % des cases de montagne** (hors rangée extérieure ; réglage `ORE_PCT`) en contiennent.
  Briser la paroi les fait **tomber au sol** ; passer dessus les ramasse et regagne **autant de vie que d'énergie**
  selon la densité — **petits +10** (50 %), **moyens +15** (30 %), **gros +20** (20 %), sans dépasser les maximums.
  Deux chiffres flottants, et les deux effets visuels (croix rouges et flèches bio) partent ensemble.
- **Destruction d'un ennemi** : une **gerbe d'étincelles** (35 à 50) qui filent droit, très vite, avec une courte
  traîne, éteintes en un quart de seconde, et **14 à 22 débris de carcasse** projetés en l'air qui retombent,
  **rebondissent une ou deux fois**, puis **restent au sol** (sauf dans l'eau, un gouffre ou un obstacle). **Une
  seule couleur : le monde.** Une porte fermée cache les débris tombés sur son seuil ; ils reparaissent quand elle s'ouvre (25 novembre 2026). Au plus 1 500 débris gardés sur la carte ; ils restent en souvenir
  (atténués) hors de vue. Pixel art strict, sans opacité.
- **Foreuse endommagée** : sous **50 PV** elle **fume** (grains gris opaques de 1 ou 2 pixels de tuile, qui montent
  en ondulant et disparaissent d'un coup, et restent sur place quand elle avance, comme une traînée) ; sous **20
  PV** la fumée double et de **petites flammèches** s'échappent de la coque.
- **Mort** : à 0 PV la foreuse **explose** — éclair blanc, secousse, détonation, ~520 éclats (accent et bio,
  quelques blancs, 2 à 5 px) qui retombent, **rebondissent**, ricochent sur les obstacles, tombent dans les
  gouffres et disparaissent d'un coup chacun à son heure ; ils restent dans la zone visible. Puis **« FOREUSE
  DÉTRUITE »** et deux boutons : **Déployer une nouvelle foreuse** et **Quitter**.
- **Déployer une nouvelle foreuse**  : on repart **toujours du niveau 1** (recette « atterrissage », vaisseau compris), **cinématique d'arrivée
  comprise**, avec une foreuse neuve ; le menu Monde du joueur est remis tel qu'il était.
- **Quitter** : l'écran devient noir avec « SIGNAL COUPÉ », le son est coupé, un bouton discret « Rallumer »
  relance une exploration.
- **Aucune progression permanente** pour l'instant : c'est le grand chantier qui reste (`conception.md`).

## 10 bis. Cinématique d'intro

**L'arrivée est en ASCII** (`src/js/14e-arrivee.js`, lancée par `playIntro`) ; l'intro en
pixels décrite plus bas n'est plus jouée (son code reste dans `15-intro.js`). Mêmes règles que les descentes : grille de
caractères, **chaque case opaque, jamais d'alpha ni de transparence**, rien ne s'efface en fondu. Vue de dessus, ≈ 14 s :
- **Le vaisseau entre par le bas** pendant l'hyperespace, **décélère** et s'arrête au milieu de la planète quand la descente commence (2,2 s) ; la planète entre par le haut et s'immobilise au même moment. Pendant la descente, la vue glisse vers la place du vaisseau dans le jeu (décalée à gauche par la colonne de droite), avec un amorti.
- **0-1,3 s, hyperespace** : étoiles en traînées « │ ¦ », puis points qui ralentissent en douceur (jamais de recul).
- **0,85-3 s, la planète** : la **vraie carte du niveau 1** en caractères (roche « ▒ ▓ », montagne « ▲ █ » et roche dure en couleur monde, eau « ≈ », herbe « w », bâtiments en couleur bâti, sol nu « · . o »), enroulée en globe avec un anneau d'atmosphère.
- **2,2-10,6 s, la descente** : le disque grandit jusqu'à finir **exactement à l'échelle du jeu en pixels** (cases de 8 × 16 px ; une tuile de 32 px = 4 caractères × 2 rangées, grille calée sur celle des tuiles, même cadrage que le jeu, caméra bornée au bord de la carte). Le vaisseau ASCII (`SHIP_GRID`, 20 × 12 caractères, foreuse dans la soute, contour couleur accent) se pose **à la place exacte du vaisseau en pixels**. **La planète ne répète jamais la carte** : la vraie carte est posée dans un **relief inventé plus large**, avec autour un **massif de roche dure** au bord déchiqueté (dans la continuité du mur de roche dure du bord de carte), puis un relief libre (montagnes, gouffres, herbe, sol nu). Nuages en « · : ░ ▒ ▓ » (cinq gris, jamais de pavé plein, caractère et gris variant lentement d'une case à l'autre), clairsemés de loin, qui **apparaissent peu à peu**, grossissent et s'effilochent au passage du vaisseau. **Entrée dans l'atmosphère** : arc de plasma devant le nez, traînées de feu, coque qui chauffe (≈ 1 700 °C), écran qui tremble ; **éclairs** en zigzag « ╱ │ ╲ » qui illuminent les nuages.
- **11,4 s, posé** : l'ombre rejoint le vaisseau, un anneau de poussière s'éloigne en perdant sa densité.
- **12,7-13,8 s** : l'écran s'éteint case par case (« ▒ ░ · ») et chaque case éteinte **laisse voir le jeu en pixels**, à la même échelle et à la même place : un fondu entre les deux styles, sans transparence.
- **Ni alerte ni tableau de bord** : l'écran ne montre que la scène.
- **Bruitages** : ceux de l'intro en pixels (hyperespace, ronronnement, approche, rentrée, tonnerre à chaque éclair,
  poussée, contact au sol).
- **Échap, Espace, Entrée** : passer (on saute à l'extinction). Essai d'origine, avec palette et carte de démonstration :
  `planches/intro-ascii/` (artefact à part).

**Quand elle se joue** : au premier lancement (`np-intro`) et à chaque nouvelle partie lancée par le joueur (`nouvellePartie`, appelée par « Nouvelle exploration » et par le rallumage ; après la destruction de la foreuse, `deployerForeuse` force en plus le niveau 1) : elle marque l'arrivée au niveau 1, comme la cinématique de forage marque le passage au suivant. Pas après une mise à jour de page en cours de partie, pas si l'utilisateur a demandé moins d'animations. **Lab → Niv1** la rejoue puis lance un niveau 1 aux réglages tirés au hasard ; **Lab → Niv2** joue la cinématique de forage puis lance un niveau 2 (la foreuse garde ce qu'elle a). Dans les deux cas le menu Monde du joueur est remis tel qu'il était, sauf la taille de carte. REGEN ne joue aucune cinématique.

*Intro en pixels (plus jouée depuis le 23 novembre 2026, code gardé dans `15-intro.js`) :* vue de dessus, ≈ 11,6 s ; durée de descente, entrée dans l'atmosphère, 2 à 6 éclairs et densité des nuages tirés à chaque lancement ; hyperespace puis planète taillée dans la vraie carte ; nuages procéduraux en 6 tuiles éditables, sur 5 couches en parallaxe, qui ne passent jamais sur le vaisseau ; plasma, tremblement et éclairs en pixel art (couleur accent, opaques) ; poussière couleur monde (650 grains qui rebondissent et ricochent) ; brouillard de guerre posé une fois la poussière retombée, raccord au pixel près avec la vue du jeu. Description complète : `git show ad818a7:docs/conception.md`.

## 10 ter. Cinématique de forage

**Règle permanente** : jamais d'alpha ni de transparence (voir `CLAUDE.md`). La fumée garde sa couleur et perd sa densité (« ▓ ▒ ░ · ») avant de s'effacer ; la fin de chaque descente s'éteint case par case (« ▒ ░ · » puis noir) ; plus d'éclair blanc translucide : les chocs se sentent par le tremblement et la roche chauffée à blanc.

**La roche fond au contact du cône**. Une poche de chaleur palpite sous la pointe (rouge, orange, jaune
au centre). Chaque rangée percée brûle au lieu de disparaître (« █ ▓ ▒ ░ · » en couleurs de feu, puis braises) ; les parois
du puits, chauffées, prennent des caractères abîmés (« ╬ ═ ┼ ┐ ░ … »), rougeoient puis refroidissent en cendre : le puits
garde une trace brûlée.

**Les mines explosent comme la foreuse** (seconde descente) : même cratère au bord déchiqueté (plus petit),
même onde de choc dégressive, et leur pavé rouge et blanc part en éclats qui creusent la roche puis restent en débris.

Pour le passage au niveau suivant. Vue **de côté**, tout en **caractères ASCII** (comme les dessins d'équipement), environ 15 s ; `src/js/14b-forage.js`. **`playForage(suite, niv)`** la lance et appelle `suite()` à la fin (`end`, `09-vision-deplacement-forage.js`) ; **NIV2** et **NIV3** la lancent pour l'essayer. **Échap, Espace ou Entrée** la passent (à la seconde descente, Échap seulement). Pas jouée si l'utilisateur a demandé moins d'animations.

- **Échelle** : caractères d'un 52ᵉ de la hauteur d'écran, comme à la seconde descente . Le compteur **PROFONDEUR** part de la profondeur du niveau quitté (`profNiv`) : 0 → 1 564 m à la
  première descente, 1 564 → 5 168 m à la seconde.
- **La machine tourne.** Elle démarre **couchée à l'horizontale** sur l'herbe, nez à droite, moteur qui monte ; elle se
  cabre, plante son nez et **plonge à la verticale** (1,3 s) ; à l'arrivée elle touche le fond, **bascule sur le côté**
  autour de son nez, rebondit et se **recouche à l'horizontale**. Le dessin (`FG_ART`, 15 lignes sur 11 colonnes) est
  tourné en **échantillonnant la grille de caractères** depuis l'écran (`fgDrill`, donc jamais de trou, aucun lissage) ;
  au-delà de 45 degrés chaque caractère est remplacé par son équivalent tourné d'un quart de tour (`FG_RG`, `FG_RD`).
  Elle reste en ASCII à tous les angles, un peu anguleuse à l'horizontale.
- **La roche n'est pas en bandes** : c'est un champ en deux dimensions (`fgMat`). Un bruit de valeur lissé, **étiré à
  l'horizontale**, donne des lentilles larges et plates qui s'interpénètrent ; un deuxième bruit, de plus basse
  fréquence, sème de **grosses masses de roche dure** (mesuré le 21 novembre 2026 : 23 % du volume en moyenne, de 20 à
  27 % selon le tirage). Les limites de matière ondulent au lieu d'être droites.
- **Un profil par niveau** (`FG_NIV`) : matières de fond selon la profondeur, matière dure semée, seuil, entremêlement.
  **Niveau 1 : terre meuble, argile, roche, de grosses masses de roche dure** — rien de plus. Filon, basalte, cristaux
  et noyau dense (`FG_MAT`) sont réservés aux profils des niveaux plus bas, esquissés mais pas encore réglés.
- **Pivoter et contourner** : la foreuse sonde la dureté 11 lignes devant elle, à gauche et à droite. Au-delà de 1,5 elle
  glisse vers le côté le plus tendre, **prend un angle** (l'inclinaison suit sa vitesse latérale, bornée à 25 degrés) et
  contourne la masse ; le bandeau affiche « masse dure devant ».
- **Diriger** : **flèches gauche et droite, Q et D, 4 et 6 du pavé numérique**, ou maintenir le doigt d'un côté de
  l'écran. Vitesse latérale bornée à 16 colonnes par seconde.
- **Vitesse** : inversement proportionnelle à la dureté sous la pointe ; la poussée monte après 6 s pour que la descente
  ne traîne pas. Plus c'est dur, plus elle tremble, grince et crache d'étincelles. Forage mesuré : environ 9 s.
- **Le puits garde la trace du chemin** (`F.tr`, un centre par ligne) : il se courbe, et les éclats rebondissent sur les
  parois.
- **Bandeau** : niveau, profondeur, matière, dureté, cap, rotation, et une coupe des matières à droite.
- **Son** : synthétisé, sans fichier (moteur, grincement haché par la rotation, grondement ; plongeon, impacts de roche,
  changement de matière, fracas du plafond, de l'impact et de la machine qui se couche).
- **Vérification** : `python3 outils/forage.py DOSSIER [t1 t2 …]`. Mesuré le 21 novembre 2026 : 52 images par seconde.
- **Amas de Matière (demande de l'utilisateur)** : à la première descente, **plusieurs amas irréguliers de
  20 caractères**, couleur accent. **Chaque caractère touché par le puits rapporte 1 de Matière.** Ils naissent eux aussi **bien sous le bas de l'écran** (1,15 écran ; mesuré : au moins 25 rangées sous le bord une fois la descente lancée). Trois amas naissent près de
  la route (9 à 14 cases à côté : il faut tourner), seize loin à gauche et à droite (jusqu'au bord de l'écran), hors d'atteinte, pour que le sous-sol ait
  l'air d'exister aussi sur les côtés (23 novembre 2026 : six avant). Deux taches ne se posent pas l'une sur l'autre (7 rangées et 11 colonnes d'écart au minimum) : celle qui n'a pas de place est
  abandonnée. Maximum 60 par descente ; mesuré : 6 sans piloter, 54 en visant (`test-forage.js`).
  
- **Annonce en gros** : alignée à gauche, juste sous le tableau de bord, dans un cadre plein à fond noir avec deux bandes de chantier. Tout en **police DOS** (Modern DOS 8x16, CP437, domaine public : `02b-police-dos.js`, `dosCar`, `dosTexte`), un pixel de police calé sur des pixels d'écran, d'après les références de l'utilisateur (`F:\WORK\IAZONE\DEEPCORE\REF`). **Apparition** (2 s), de gauche à droite avec du désordre : chaque case monte en densité « . → i → 0 », puis montre des caractères au hasard sur des pavés de couleur (couleur de l'alerte ou gris, en inverse vidéo) avant de se figer ; le rebord et les bandes montent en « ░ ▒ ▓ █ ». Le message reste 4 s. **Disparition** (1 s), colonne par colonne de gauche à droite, à rebours : pavés, « 0 → i → . », plus rien ; la roche reparaît derrière. Première descente : « MATIÈRE {µ} DÉTECTÉE / COLLECTE POSSIBLE » (couleur accent) ; seconde : « EXPLOSIFS DÉTECTÉS / ATTENTION SOUS-SOL PIÉGÉ ! » (rouge). Le cadre a **la même taille aux deux descentes et à l'arrivée** (30 cases de large, règle `fgAnnP`, 30 % de la largeur de l'écran) ; deux lignes sont réservées sous le tableau de bord pour ses alertes qui clignotent, que l'annonce ne cache pas.

**Foreuse détruite pendant une descente** . Tout se joue
**sur la grille de la descente** (elle ne change pas), **chaque case dessinée opaque** (aucune transparence). Un coup très
fort, d'un seul coup : l'écran tremble, le bout du trou devient un **cratère** (roche détruite au centre, abîmée autour,
bord déchiqueté), chauffé à blanc ; une onde de choc abîme la roche alentour par endroits, **fort près du cratère, de plus
en plus rarement et légèrement au loin**. Chaque **caractère de la foreuse est projeté** dans tous les sens : en traversant
la roche, il la **creuse** et abîme ses voisines, puis ralentit et s'arrête. Une case détruite passe par « █ ▓ ▒ ░ · »
puis disparaît ; une case abîmée prend un autre caractère (« ╬ ╪ ═ ║ ┼ ┐ ░ … », plus clair si moins touchée). Tout **brûle**
(blanc, jaune, orange, rouge) puis refroidit en cendre ; des braises restent au fond du cratère et **les débris de la foreuse
restent** là où ils sont tombés. À 2,55 s, tout l'écran s'éteint case par case, par « ▒ ░ · », et à 3,6 s le jeu montre
aussitôt **« FOREUSE DÉTRUITE »** sur fond **noir plein** : ni la carte du niveau, ni une seconde explosion sur la carte.
Partout, mort en descente ou non, « FOREUSE DÉTRUITE » est **toujours rouge**, quelle que soit la palette.

### Seconde descente : le mini-jeu des mines

Du niveau 2 au niveau 3, la descente se joue. `playForage(suite, 2)` ; **NIV3** pour l'essayer.

- Caractères d'un 52ᵉ de la hauteur d'écran, comme à la première descente. La foreuse est tenue en haut de l'écran : on voit 0,7 écran devant elle (aux deux descentes). La descente est plus longue que la première et la foreuse répond plus vite aux commandes.
- Des **mines explosives** naissent **bien sous le bas de l'écran** (1,15 écran sous la foreuse, qui en voit 0,7 : avant, la rangée
  apparaissait à vue), par rangées de plus en plus serrées. Sept sur dix sont visées sur la route de la foreuse ; une fois sur quatre, une seconde mine vient à côté.
  Une mine est un pavé plein de 7 × 3 caractères, rouge et blanc en alternance. **Une mine de plus par rangée** une fois sur deux est
  semées sur toute la largeur de l'écran, indépendamment de la route de la foreuse (au moins 12 colonnes d'elle), pour que les mines
  n'existent pas seulement sous elle (23 novembre 2026).
- **Deux mines gardent au moins cinq cases de vide entre elles** (24 novembre 2026 ; avant, elles pouvaient se toucher) : le pavé fait
  7 × 3, d'où un écart minimum de 12 colonnes ou 8 rangées (`fgMPose`, `FG_MDX`, `FG_MDY`), les rangées précédentes comprises. Si la
  place est prise, la mine glisse de 12 colonnes, jusqu'à deux fois de chaque côté, puis renonce. Vérifié : 241 mines posées, aucune
  paire trop proche.
- **Moins de mines** (24 novembre 2026) : rangées espacées de 13 à 19 lignes, mines des côtés ramenées de une ou deux à zéro ou une.
  Environ **42 mines par descente** au lieu de 52 (réglé par l'utilisateur, après un essai à 30).
- Toucher une mine (elle saute dès qu'elle est dans le puits) coûte **12 points de vie** (`FG_MINE_DM`), de la vraie vie de la
  foreuse. **À zéro, la foreuse explose** : écran « FOREUSE DÉTRUITE », pas de niveau 3.
- Échap passe la scène contre **30 points de vie** (`FG_PASSE_DM`), sans jamais tuer. Espace et Entrée ne passent plus.
- **La vie restante est affichée pendant toutes les descentes**, la première comprise, sur un fond noir plein (le
  texte se lisait mal sur la roche). Le mini-jeu ajoute le compte des mines touchées et l'alerte « mine sur la route ».
- **Réglages** (demande de l'utilisateur) : la descente dure **5 secondes de plus** (390 lignes,
  27 secondes environ ; les rangées de mines sont espacées de 17 à 25 lignes pour ne pas doubler les dégâts, 23 mines
  environ) ; **la roche dure du mini-jeu est en couleur bio** (le basalte était gris) ; **les commandes de direction sont
  inversées aux deux descentes** : la touche de gauche pousse la foreuse à droite, et l'inverse, au clavier comme au doigt.
- Mesuré (`outils/scripts/test-forage.js`, vingt descentes par pilote, 24 novembre 2026, à 42 mines) : sans diriger, 7,8 mines
  touchées et 89 points perdus, 9 foreuses détruites sur 20 ; pilote maladroit, 3,3 mines et 40 points ; pilote attentif, 0,8 mine
  et 10 points. (À 30 mines : 5,1 touchées, 61 points, aucune détruite.)

### Transitions, plancher et palettes des descentes (23 novembre 2026)

- **Entrée et sortie des deux descentes** : la sortie éteint l'écran case par case (« ▒ ░ · » puis le noir) ; l'entrée joue la même
  animation à l'envers (`FG_ENT`, 0,8 s : le noir se rallume case par case). La mort garde sa propre extinction.
- **Plancher de départ et plancher d'arrivée** : la carte, vue de dessus, est lue en coupe sur la rangée de la foreuse et dressée de
  côté (`fgCoupe`, `fgDecor`) : une case de carte = 4 colonnes, un mur = 14 rangées, et le décor peut descendre **sous** la ligne de
  sol (l'eau). Le décor est tracé **une seule fois dans son
  propre canevas**, puis posé d'un bloc à chaque image (sinon deux mille caractères à retracer soixante fois par seconde). **Départ** : l'endroit réel où l'on fore, lu
  sur le niveau quitté. Un bâtiment montre ses **murs et son toit en couleur bâti**, sa **porte** percée dans le mur, au plus
  **deux ensembles de machines** en couleur monde (une antenne est un mât) ; les roches alentour dessinent une **crête** en couleur
  monde, lissée d'une case à l'autre pour qu'elle ondule, et de plus en plus dense vers sa base (« ▀ ░ ▒ ▓ »). **Les herbes** de la case et de ses
  voisines deviennent de **hautes tiges en ASCII** en couleur bio — 2 à 6 rangées, droites (`│`) ou penchées (`/ \`), pied `│ └ ┘`,
  épi `¤ # * :`, avec des trous pour que la rangée ne fasse pas un mur —, là où il n'y a ni bâtiment, ni roche, ni eau.
  **L'eau** se montre avec sa profondeur, en couleur eau : une surface `~ ≈` sur la ligne de sol, puis **trois cases de profondeur
  pour les hauts-fonds et sept pour l'eau profonde** (`FG_EAU_BAS`, `FG_EAU_FOND`), de plus en plus denses (`▒ ▓ █`) et **de plus en
  plus sombres** vers le fond (24 novembre 2026). **Arrivée** : le même dessin, lu sur le niveau d'arrivée, posé sur le sol de la caverne. Son abscisse se fige
  dès que le décor pourrait entrer dans le champ, et non au percement : sinon il apparaissait d'un coup alors que le sol de la
  caverne était déjà visible (mesuré : figé 3 rangées avant d'être visible). Le niveau d'arrivée est donc
  **généré avant la scène** (`descendre()`, `14b-forage.js`), qui se joue par-dessus la partie déjà changée.
- **Palette par niveau** : à chaque niveau, la palette change (`palNiveauSuivant`, `02-palette.js`), tirée au hasard parmi les
  palettes prédéfinies, jamais la même deux fois de suite ; elle ne touche pas à la palette choisie par le joueur, que reprend le
  niveau 1. Pendant la descente, **les roches passent de la palette du départ à celle de l'arrivée** (14 paliers de profondeur,
  `fgMC`) ; leur gris prend un peu de la couleur monde. **La foreuse garde les couleurs du départ.**

### Enchaînement dans le jeu

La descente compte `NIV_MAX = 3` niveaux (table `NIVEAUX`, `00-base.js`).

- **Éboulis d'arrivée** (`eboulis()`, appelé par `niveauSuivant()`) : la foreuse a percé le plafond, des débris de roche
  sont éparpillés autour d'elle. Des **gravats** (praticables) serrés à son pied et de plus en plus rares jusqu'à
  5 cases, plus **un à trois rochers** à 2 à 4 cases, posés seulement là où leurs huit voisines sont libres (aucun
  passage ne peut être fermé). Rien sur l'eau, les gouffres, les bâtiments, les objets ni les créatures. Seulement à la
  descente : REGEN sur la recette cavernes n'en pose pas.
- `G.niv` porte le numéro du niveau ; le panneau affiche « Niveau N · largeur × hauteur ».
- **Forer le site du dernier niveau** gagne la partie comme avant (« NOYAU ATTEINT »). **Forer celui d'un niveau
  précédent** (`end`, `09-vision-deplacement-forage.js`) ferme l'écran de forage et lance `descendre()` : `niveauSuivant()` est appelé **avant** la scène (voir ci-dessus).
- `niveauSuivant()` : le niveau 2 est généré avec **la recette « cavernes » et les réglages que le joueur lui a
  donnés dans le menu Monde** (ceux gardés dans `GEN.rec.cavernes`, archétype bâti compris ; les valeurs de départ s'il n'y
  a jamais touché), quelle que soit la recette affichée dans le menu (`RECETTE_NIV`). La taille de carte, l'eau et
  l'herbe sont celles du menu. Lab → Niv2 et Niv3 tirent d'abord un archétype monde et un archétype bâti. Le
  menu Monde du joueur est remis en place aussitôt après.  Pas de
  vaisseau : on arrive par le puits. `genPlanet` refait l'objet `G`, donc ce que **la foreuse garde est remis en
  place juste après** : vie, énergie, inventaire, matière en réserve, tours et distance parcourue.
- **F9** ne lance plus la cinématique : il garantit **au moins un exemplaire de chaque consommable** dans l'inventaire (capsules identifiées et clé) : une sorte déjà présente n'est pas ajoutée ; s'il manque des places, il **retire des doublons** (un exemplaire à la fois, sur la plus grosse pile) jusqu'à ce que toutes les sortes tiennent. Touche d'essai, absente du sous-menu Contrôles.
- La taille de la carte ne change pas d'un niveau à l'autre (elle s'applique au lancement).

