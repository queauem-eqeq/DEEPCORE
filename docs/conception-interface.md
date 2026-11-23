# Noyau Profond — conception : Interface et rendu

Partie du document de conception (sommaire et règles à ne pas casser : `conception.md`). Les règles telles qu'elles sont aujourd'hui ; l'historique est dans `historique.md`, les chiffres dans `mesures.md`.

## 2. Direction visuelle

- Tuiles pixel art 16 × 16, affichées en 32 × 32 ; fond quasi noir. Pas d'effet d'écran.
- **Un objet sous une créature** : la créature le cache ; un petit **+ blanc de 3 × 3 pixels de tuile** s'affiche dans le coin
  bas droit de la case, tant que la créature est dessus.
- **Palette à cinq couleurs** (trois avant), dans cet ordre dans le menu : **#1 Monde** (sol, rochers,
  montagnes), **#2 Bio**, **#3 Accent**, **#4 Danger** (lasers, dégâts, alertes : l'ancien rouge fixe), **#5 Bâti** (murs, sols,
  portes et piliers des bâtiments, pour que l'intérieur ne se confonde plus avec la montagne). Le blanc reste fixe. Dans le
  code les clés sont `3` monde, `2` bio, `1` accent, `4` danger, `5` bâti ; les encres `r` et `L` des tuiles se lisent en
  couleur danger, et l'encre `3` se lit en couleur bâti sur les tuiles de `BATI_TUILES` (`02-palette.js`).
- **Réglages du joueur adoptés le 23 novembre 2026** : les dessins retouchés dans l'artefact (`reglages/courant`) sont recopiés dans
  `TUILES_JOUEUR` (`03-tuiles.js`) et `TUILES_JOUEUR_B` (`03b-tuiles-machines.js`) — bz6r, bz7r, mach5, robot_u, siteUnknown, niche,
  stationOff, chargeur, o_capsule, o_plan — et la palette **Désert** retouchée dans `PRESETS` ; **Désert** devient la palette de départ
  (`PRESET_ACTIVE`). La recopie **fusionne** : les tuiles déjà adoptées et absentes de la base sont gardées telles quelles.
- **Une palette par niveau** (23 novembre 2026) : à chaque niveau suivant, la palette est tirée au hasard parmi les prédéfinies (jamais la
  même deux fois de suite) ; la palette choisie par le joueur n'est pas modifiée et revient au niveau 1. Voir `conception-descente.md`.
- **Toutes les couleurs viennent de LACKING64** (lospec.com/palette-list/lacking64) : 8 palettes neuves, toutes modifiables
  (Braise, Lagon, Désert, Jungle, Améthyste, Cendre, Glacier, Magma ; Braise par défaut, la plus proche de l'ancienne
  Rouille), et le **sélecteur de teinte montre les 64 couleurs de LACKING64**. Il reste ouvert après un choix ; on le ferme
  en recliquant sur la pastille ou avec Échap. Bouton « Rétablir ». Un réglage enregistré à trois couleurs est ignoré.
- Polices : Chakra Petch (titres), JetBrains Mono (interface).
- **Les dessins par défaut sont ceux de l'utilisateur**, retouchés au Tile editor et recopiés dans le code : bloc `TUILES_JOUEUR` à la fin de `03-tuiles.js` (il passe après toutes les autres définitions) et `TUILES_JOUEUR_B` à la fin de `03b-tuiles-machines.js` pour les tuiles définies là. Dernière recopie : 22 novembre 2026, 16 h 33.

### Rendu des terrains particuliers

- **Gouffres** : fond noir ; **lèvre irrégulière couleur sol** (1 à 3 pixels, ondulation lente, petits éperons dans
  les coins) sur chaque côté qui touche le sol, pas du côté des ponts, sans rebord ambré. Sous **chaque pixel de
  bord tourné vers le nord**, **paroi en dégradé plein de 7 teintes sur 7 pixels**, de la couleur monde atténuée
  (60 %) jusqu'au noir ; rien sous les bords tournés vers le sud. L'inconnu reste en noir plat. Calculé une fois par
  planète et par palette (image de 16 pixels par case), utilisé aussi par la cinématique.
- **Texture du sol** : sur le voile de couleur monde à 8 % posé sur chaque case s'ajoutent des **nuances par
  plages** (teinte ±9°, clarté ±4,5 %, saturation ±29 %, par un bruit lisse d'une dizaine de cases) et un **grain à
  densité variable** (0 à 20 pixels par case, opacité 72 contre 20 sur 255, second bruit d'échelle 5 cases).
  Calculé une fois par planète et par palette, dans une image de 16 pixels par case ; la cinématique utilise la
  même, donc le raccord est exact. Réglage dans `SOL_REG` (`10-rendu.js`) : `teinte`, `clarte`, `satu`, `grainMax`,
  `fond`, `grain`, `echPlage`, `echGrain`. La planche `planches/sol-grain.js` sert à comparer d'autres réglages.
- **Aucune case bâtie ne porte cette texture** (sols, portes, piliers, murs, ponts de bâtiment) : fond uni à
  l'intérieur.
- **Traces de chenilles** : deux pointillés qui suivent une courbe (64 combinaisons entrée/sortie), effacement
  pixel par pixel en 5 tours.
- **Viseur** (curseur souris et inspection) : blanc avec contour noir automatique ; ses pixels blancs passent en
  gris quand la case est inexplorée ou hors d'atteinte.

## 9. Interface

- **« Matière {µ} »** : partout où le jeu parle de la ressource (colonne, fabricateur, journal, objets,
  inspection, sonar, Lab → Items, descente), elle s'écrit « Matière {µ} ». Le « MATIÈRE » du tableau de bord des descentes
  désigne la roche traversée (argile, filon…) et garde son nom.

- **Pas d'écran d'accueil** : la partie commence directement, foreuse dans la soute. Le son s'active à la première
  touche ou au premier clic.
- **Barres de défilement** : 4 pixels, sans fond, couleur du texte secondaire (`--dim`), plus
  claires au survol ; « thin » sous Firefox. Ne pas poser `scrollbar-width` ou `scrollbar-color` sur un élément :
  Chrome les préférerait et rendrait la barre épaisse.
- Plein écran ; colonne noire à droite. **Son haut reste fixe** : barres Vie, Énergie, Matière,
  boutons, effets en cours et **Inventaire**. **Seul ce qui suit défile**, à la molette ou au doigt, sans barre de
  défilement. 
  Journal
  de bord sous la carte (5 lignes visibles, numéro de tour, ×N pour les répétitions). **Il défile** :
molette ou fine barre pour remonter jusqu'aux 200 derniers messages ; un nouveau message le ramène tout en bas. Un message
  trop long passe à la ligne, aligné après le numéro de tour.
- **Barres** (l'ancien Statut) : barres ASCII `█`/`░` — Vie en bio, Énergie en blanc  — suivies de leur valeur chiffrée. Le
  remplissage est un **calque de `█` découpé à la largeur exacte** posé sur un fond de `░`, donc juste à toute
  largeur de colonne et à toute taille de police.
- **En vue** (sous la Carte) : la fiche d'inspection de la case survolée, puis les créatures visibles (icône,
  barre de vie ASCII, colonnes TOUCHER / SUBIR colorées).
- **En tête de colonne, au-dessus de Vie**  : trois lignes en capitales couleur monde, sans étiquette — `NIVEAU 2 · −1564 M · 96×64` (le niveau, sa profondeur et la taille de la carte ; la
  profondeur vaut 0 au niveau 1, puis la fin de chaque descente, les mêmes chiffres que le compteur PROFONDEUR des
  cinématiques de forage, qui part de la profondeur du niveau quitté : `profNiv`, 14b), puis l'**archétype monde** et
  l'**archétype bâti** de la carte (« Personnalisé » s'il n'y en a pas).
- **Carte** (sous-menu repliable sous l'Inventaire) : la mini-carte. Elle **s'ouvre d'elle-même en mode
  carte (M)** et se referme en sortant, sauf si elle était déjà ouverte avant.
- **Mini-carte** pleine largeur ; ennemis en points rouges ; un clic recentre la vue ; bouton maintenu + glisser =
  défilement en temps réel. Saisie à l'intérieur, le cadre suit le pointeur sans sauter ; à l'extérieur, il se
  centre d'abord sous le pointeur.
- **Tile editor** (Lab) : encres sur deux lignes — les cinq couleurs de la palette (Monde, Bio, Accent,
  Danger, Bâti), puis Blanc, Noir, **Rouge fixe** (`R`, #d8180b, le même avec toutes les palettes) et Transparent.
  Nouveaux codes de tuile : `5` (bâti) et `R` (rouge fixe). 
- Sous **REGEN · MONDE · LIFE**, une rangée **NIV1 · NIV2 · NIV3** .
- Sous-menus repliables : **Inventaire**, **Carte**, **Lab** (Bestiaire, Groupes, Artefacts, Items, Discrétion, Tile editor, **Combat** : un lien qui ouvre le banc dans un autre onglet), **Palette**, **Contrôles** (l'aide des touches, une commande par ligne : la touche, puis ce qu'elle fait ; trois groupes : Se déplacer, Objets, Voir).

### Souris et inspection

- Le curseur système est masqué sur la carte ; le **viseur** est dessiné sur la case survolée. Dès qu'on appuie sur
  une touche, viseur, fiche et trajet disparaissent jusqu'au prochain mouvement de souris.
- **Survol** : fiche complète dans « En vue » — terrain et ses effets, distance, créature (état, PV, DÉG, PRE, DEF
  modifiée, VIT, chances Toucher / Subir, comportement), site, roche fissurée, bord indestructible, objets posés,
  « souvenir » si la case est hors de vue, et l'action du clic (« y aller · N tours », « frapper », « forer »).
- **Trajet** : le plus court chemin (Dijkstra, 8 directions, cases connues seulement, eau profonde évitée,
  créatures visibles contournées), montré par un petit rond blanc (4 × 4 pixels de tuile, opacité 70 %) au centre
  de chaque case intermédiaire.
- **Clic** : case voisine = action immédiate ; case lointaine = déplacement automatique, un pas toutes les 90 ms.
  Si la destination est une roche ou une créature, la dernière étape est un coup de foreuse.
- **Clic dans le brouillard** : une case inexplorée est une destination valide. Le trajet suppose franchissables
  les cases jamais vues et **se recalcule à chaque pas**. La foreuse ne fore jamais pendant un tel trajet : elle
  **s'arrête** quand plus aucun passage ne mène à la destination, ou quand celle-ci se révèle infranchissable.
- **Arrêt du trajet** : nouvel ennemi en vue, foreuse attaquée, nouveau site repéré, passage sur un site, dérive
  dans l'eau profonde, passage bloqué, énergie insuffisante, ou toute touche. Le motif s'affiche dans le journal.
- **Touche X** : inspection au clavier (Maj = 5 cases, Entrée = y aller). **Écran tactile** : premier appui =
  inspection, second appui sur la même case = déplacement.

### Tile editor (Lab → Tile editor)

Liste des tuiles éditables par groupe : Viseur ; Foreuse et faune ; Terrain ; Objets au sol ; Objets ; Artefacts ;
Machines ; Vaisseau (édité d'un bloc, 80 × 96 pixels) ; **FX** : les trois temps de
l'explosion (`boom0`, `boom1`, `boom2`), le rayon laser (`laserV`, l'horizontal en est la rotation), la case d'une croix
laser (`laserX`), puis les nuages de l'intro. Le rouge `r` des rayons s'affiche en jeu en rouge vif `#ff2a2a`, comme
avant. Le trait du laser des sentinelles, en biais, reste dessiné en code. Pas de barre de défilement horizontale. Les variantes suivent la tuile de base (4 orientations de la foreuse,
animaux tournés à gauche, 2ᵉ image de l'eau profonde).

Éditeur 16 × 16 : encres en pastilles (voir plus haut), Gomme ; clic droit = effacer ; Miroir ↔ et ↕ (les deux = symétrie ×4) ; Contour auto, Vider,
**Rétablir l'enregistré**. Aperçu : la tuile en grand, puis en pavage ou posée sur le sol. Retouches mémorisées
dans `np-tiles` ; « Enregistrer » les écrit dans la base et en fait la nouvelle référence (`np-tiles-base`).
Codes des motifs : `CLAUDE.md`.

### Touches

ZQSD / flèches / pavé numérique : déplacer · A E W C : diagonales · Souris : survol = inspection, clic = y aller ·
X : inspection au clavier · R : courir / marcher · T : équipement · I : inventaire · O : exploration automatique ·
F : forer · Espace / 5 : attendre · P : repos · V : portée de discrétion · B : brouillard · ! : son · M : mode
carte (déplacements = défilement, Maj = plus vite, Échap ou M pour revenir ; Espace / 5 y attendent toujours, pour les
essais, sans bouger la vue ).

## 10. Sauvegarde des réglages

Les réglages du joueur vivent dans le **`localStorage`** du navigateur (clés `np-*` : palettes, tuiles retouchées,
génération, groupes, artefacts, intro déjà vue) et dans la **base de l'artefact** (`reglages/courant`). **Ne pas
renommer ces clés.**

Au chargement, la base n'est relue que si elle est **plus récente que les retouches locales** (horodatage
`np-maj`, mis à jour à chaque changement). Sinon les réglages locaux sont conservés.

**L'utilisateur règle ses tuiles et ses stats dans l'artefact**, seule version dont la session peut relire les réglages (pas de base sur GitHub Pages ni dans la copie du disque). Procédure de recopie dans le code : `CLAUDE.md`.

