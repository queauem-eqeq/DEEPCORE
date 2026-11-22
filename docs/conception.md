# Noyau Profond — document de conception

**Les règles du jeu telles qu'elles sont aujourd'hui.** Ce document ne raconte pas comment on y est arrivé : les
décisions passées, ce qui a été essayé puis retiré et pourquoi vivent dans `historique.md`, à lire avant de
reproposer une idée déjà écartée. Les chiffres mesurés sont dans `mesures.md`, les points de comparaison avec
Brogue dans `brogue.md`.

Ne jamais lire ce document en entier : y chercher la section utile.

- **Jeu jouable** : https://claude.ai/artifact/NL3Dn842a32JiGimprg8cm (artefact privé, capacité `db` déclarée)
- **En ligne** : https://queauem-eqeq.github.io/DEEPCORE/ (à chaque fusion dans `main`)
- **Sources** : dépôt `queauem-eqeq/DEEPCORE`, dossier `src/` — une page `index.html`, `style.css`, des scripts
  `js/NN-nom.js` chargés par balises, sans assemblage. Chaque version publiée est marquée par une branche
  `claude/version-AAAA-MM-JJ-n`.

## 1. Concept

Roguelike au tour par tour dans une esthétique inspirée de Cogmind et de Brogue (aucun élément repris de ces jeux).
Un robot foreur se pose sur une planète inconnue, cherche le site de forage et fore pour descendre. La descente
revient sur **3 niveaux** ; elle n'est pas encore codée, et forer termine la partie.

## 2. Direction visuelle

- Tuiles pixel art 16 × 16, affichées en 32 × 32 ; fond quasi noir. Pas d'effet d'écran.
- **Palette à cinq couleurs** (22 novembre 2026 ; trois avant), dans cet ordre dans le menu : **#1 Monde** (sol, rochers,
  montagnes), **#2 Bio**, **#3 Accent**, **#4 Danger** (lasers, dégâts, alertes : l'ancien rouge fixe), **#5 Bâti** (murs, sols,
  portes et piliers des bâtiments, pour que l'intérieur ne se confonde plus avec la montagne). Le blanc reste fixe. Dans le
  code les clés sont `3` monde, `2` bio, `1` accent, `4` danger, `5` bâti ; les encres `r` et `L` des tuiles se lisent en
  couleur danger, et l'encre `3` se lit en couleur bâti sur les tuiles de `BATI_TUILES` (`02-palette.js`).
- **Toutes les couleurs viennent de LACKING64** (lospec.com/palette-list/lacking64) : 8 palettes neuves, toutes modifiables
  (Braise, Lagon, Désert, Jungle, Améthyste, Cendre, Glacier, Magma ; Braise par défaut, la plus proche de l'ancienne
  Rouille), et le **sélecteur de teinte montre les 64 couleurs de LACKING64**. Il reste ouvert après un choix ; on le ferme
  en recliquant sur la pastille ou avec Échap. Bouton « Rétablir ». Un réglage enregistré à trois couleurs est ignoré.
- Polices : Chakra Petch (titres), JetBrains Mono (interface).
- **Les dessins par défaut sont ceux de l'utilisateur**, retouchés au Tile editor et recopiés dans le code (bloc
  `TUILES_JOUEUR` à la fin de `03-tuiles.js`, qui passe après toutes les autres définitions). Dernière recopie le 22 novembre 2026 à 16 h 33 : antenne allumée, Torpille, Mine, Drone, Soudeur, machine 5, Blindage composite dans `TUILES_JOUEUR`, et capsule, Court-circuit, Matière, plan, Module de puissance, rayon laser, explosion 2 dans `TUILES_JOUEUR_B` (fin de `03b-tuiles-machines.js`, parce que ces tuiles y sont définies). Recopie précédente le 21 novembre 2026 à 22 h 25 (pile et site de forage inconnu) ; plus tôt le même jour : Sentinelle, abysse, liquides, machines 6 à 8 et tous les objets au sol, redessinés dans les couleurs du monde (dont le nouveau gyroscope).

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

## 3. Planète et génération

- Carte **96 × 64 cases** par défaut (taille 4). Facteur d'échelle `F = W/96`.
- **Bord de carte irrégulier** : une bande de montagne d'épaisseur variable (1 à 10 cases, 3 en moyenne) suit les
  quatre côtés, tirée d'un bruit à deux échelles, puis 2 passes d'automate cellulaire cassent les angles droits.
  Elle prend environ 17 % de la surface, jamais plus de 19 % (tirage refait sinon). La rangée extérieure est
  indestructible ; le reste se creuse comme une montagne normale.
- **Lacs** : chaque lac est une forme tirée à l'automate cellulaire (règle B5678/S45678), puis **sa rive lui est
  propre** — **1 sur 5 est un étang** (pas d'eau profonde), **1 sur 5 un à-pic** (que de l'eau profonde, qui
  descend d'un coup depuis la rive), les autres ont une rive de largeur moyenne tirée entre 0,4 et 3,6 cases,
  **ondulée de ×0,3 à ×1,9** par un bruit : une plage d'un côté, un bord franc de l'autre. La profondeur se lit à
  la distance au rivage, diagonales comprises. Deux lacs qui se touchent n'en font qu'un.
  **L'eau profonde peut toucher la terre** : on peut y tomber d'un pas, sans bande d'eau peu profonde pour prévenir.
  **Couleur de l'eau (21 novembre 2026)** : l'eau n'est plus de la couleur bio mais **dérivée de la couleur monde** du biome,
  décalée de [teinte −12°, clarté −8, saturation 0] (`EAU` dans `02-palette.js`, couleur `PAL['e']`) : un vert-bleu sombre. Choisie par
  l'utilisateur parmi six variantes d'essai ; les tuiles d'eau gardent le code `2` dans leurs dessins, lu comme `e` (`EAU_TUILES`).
- **Roche dure au cœur des massifs** : chaque case de montagne est durcie avec une chance qui monte avec sa
  **profondeur** dans le massif (distance au premier terrain qui n'est pas de la montagne, en 4 directions) : rien
  à une ou deux cases, puis 30 %, 65 %, 90 %, 100 %. Écorce tendre, cœur impénétrable. Posée **avant** les métaux,
  qui n'apparaissent jamais dedans.
  **La rangée extérieure de la carte est en roche dure** (21 novembre 2026). **Dessin** : plus de tuile propre — la roche dure reprend
  les tuiles de la montagne tendre (`mtBody`, `mtTop`, retouches comprises) en encre foncée (`PAL['d']` = couleur monde, clarté −16,
  `HARD_CLAIR` dans `02-palette.js`). Même logique : la case dont le haut n'est pas de la roche dure porte la crête irrégulière,
  posée sur un fond de roche tendre quand la case du dessus est de la montagne ou du rocher.
  Seule la partie **au-dessus de la ligne de crête** est un fond (`hardTopBg`, `softTopBg`) : sinon les trous de la crête laissent voir la
  roche tendre et la crête paraît plus claire. Réciproquement, la crête d'une montagne tendre située **sous** de la roche dure se pose sur un
  fond de roche dure, pas sur le sol.
- Relief : méthode **Automate cellulaire**, **Bruit** ou **Mixte** ; réglages Remplissage (35-70 %) et Itérations (1-10).
- Connectivité garantie : les zones isolées sont reliées par le plus court chemin (pont sur gouffre, col dans la
  montagne, rocher dégagé) ; petites poches comblées.
- L'eau ne touche jamais un gouffre (marge de 2 cases de terre ferme).
- **Gouffres** : jamais de trou de moins de 4 cases reliées par les côtés, jamais deux gouffres reliés seulement
  par un coin. Nettoyage avant et après la connexion automatique, et après la pose du vaisseau ; il ne fait que
  combler, donc la connexion reste garantie. Un pont qui ne franchit plus rien redevient du sol.
- Curseurs (en %) : Eau ≤ 60, Montagne ≤ 70, Gouffre ≤ 30, Herbe ≤ 80, total ≤ 80.
- **Herbes hautes et basses mêlées de façon irrégulière** : trois échelles s'additionnent — de grandes zones qui
  donnent parfois une forte majorité de l'une, des bosquets et touffes de 2 à 6 cases, un grain case par case. La
  part d'herbes hautes varie d'une carte à l'autre, de 35 à 65 %.

### Taille de la carte

Réglage de **1 à 5**, appliqué au prochain lancement. Le relief, les lacs, les distances de sécurité et la faune
suivent l'échelle.

| Taille | Cases | Usage |
|---|---|---|
| 1 | 32 × 22 | arène : tient presque dans l'écran, pour essayer des monstres |
| 2 | 48 × 32 | |
| 3 | 72 × 48 | |
| 4 | 96 × 64 | **défaut** |
| 5 | 144 × 96 | |

### Faune : groupes et budget de menace

La carte est peuplée par **groupes**. Un groupe réunit une ou plusieurs espèces, chacune avec un effectif minimal
et maximal, et porte une **valeur de menace** fixée à la main.

- **Génération** (`spawnGroupes`) : un **budget de menace** (110 par défaut, donné pour une carte de 96 × 64 et
  rapporté à la surface jouée) achète des groupes **actifs** tirés au hasard, tant qu'il en reste un d'abordable.
  Chaque groupe est posé d'un bloc autour d'un point, à 20 cases au moins de la foreuse ; un groupe qui ne trouve
  pas sa place (pas d'eau pour des torpilles) est écarté après trois échecs.
- **Fréquence** : un sélecteur [− = +] par groupe. Au tirage, un groupe « − » sort deux fois moins souvent qu'un
  « = », un « + » deux fois plus.
- **Effectif à partir de 0** : l'effectif minimal d'une espèce peut être 0 (« 0 à 3 puces ») : elle est alors
  parfois absente. Si tout le groupe tire 0, rien n'est posé et rien n'est dépensé. Le maximum reste d'au moins 1.
- **Lab → Groupes** : à gauche la fiche du groupe choisi (nom, valeur, styles de patrouille, case « actif »,
  jusqu'à six espèces avec leur effectif, fréquence, Dupliquer, Supprimer) ; à droite la liste des groupes en
  colonne, qu'on réordonne en glissant ou par ↑ ↓. La fenêtre ne montre plus ni texte d'explication, ni budget, ni rappel de la carte en cours
  (retirés le 21 novembre 2026) : le budget se règle par niveau dans LIFE. « Groupes par défaut » (deux clics) remet les groupes de départ. **Enregistrer** écrit groupes, valeurs
  et budget dans la base de l'artefact (`reglages/courant`, champ `groupes`).
- **LIFE** (colonne de droite) : le budget et une case à cocher par groupe.
  Bouton **Enregistrer** en bas de la fenêtre (21 novembre 2026) : le même enregistrement que dans Groupes, Bestiaire et le
  Tile editor — tout part d'un bloc dans la base de l'artefact (`reglages/courant`).
- Mémorisé dans le navigateur (`np-groupes`) et dans l'enregistrement des réglages.
- Les effectifs par espèce (`LIFE`, `spawnAnimals`, `spawnBeasts`) ne servent plus qu'au banc de combat et aux mesures.

### Lieux, densité et valeurs mesurées (21 novembre 2026)

- **Trois lieux** (`lieuDe`) : l'**extérieur** (terrain naturel, poches et cavernes comprises), le **bâti** (sol des
  bâtiments) et les **tunnels**. Le budget de chaque niveau est **réparti directement** entre eux
  (`GROUPES.niv[n].part`, fenêtre LIFE, en % du budget) : niveau 1 : 75 / 20 / 5 ; niveau 2 : 80 / 18 / 2 ; niveau 3 :
  35 / 60 / 5 (extérieur / bâti / tunnels). Les trois parts sont ramenées à 100. Un lieu absent de la carte rend sa part
  aux autres ; un lieu ne reçoit jamais plus de **trois fois sa part de surface** (`PART_PLAFOND`), le surplus va aux
  autres. Remplace, le 21 novembre 2026 au soir, les « densités par lieu » (80 / 130 / 40 % de la surface), que
  l'utilisateur ne comprenait pas ; les parts de départ sont celles que ces densités donnaient en moyenne.
- Chaque groupe déclare ses **lieux** (Lab → Groupes ; aucun coché : partout). Un groupe naît dans son lieu.
- Le budget monte de **20 % par niveau** (`GROUPES.pente`). Budget de départ : **80** pour 96 × 64 (110 avant ; les
  valeurs mesurées étant plus basses que les anciennes, le budget a suivi pour garder la même densité).
- **Valeur d'un groupe = vie perdue au banc ÷ 4** (`outils/valeur_groupes.py`), avec un supplément pour ce que le banc
  ne voit pas : mines (explosion par surprise), relais (alerte), englueur (il empêche la fuite). Tableau dans `mesures.md`.
- **Référence du joueur, relue le 21 novembre 2026 à 23 h 39** (remplace sur ces points celle de 22 h 25, décrite juste
  après) : niveau 1, cinq groupes permis (Crabots, Bande de relais, 1-2 Mines, Banc de torpilles, Puces en groupes) ;
  niveau 2, quinze ; niveau 3, les vingt. Ronde de drones est actif. Artefacts : croix laser **désactivée** par défaut,
  machines en fréquence normale, ponts à levier et station de réparation au niveau 3 seulement, fabricateur aux niveaux 2
  et 3. Palette Néon : `#ffa53a`, `#8fe6cf`, `#285e86`. Bestiaire et tuiles : inchangés. La configuration d'essai
  (génération, taille de carte, état de la partie) n'est pas recopiée.
- **Référence du joueur, 21 novembre 2026 à 22 h 25** : les groupes de départ (`GROUPES_DEF`), leur ordre, leurs valeurs,
  fréquences, patrouilles et lieux, et les groupes permis par niveau (`GR_NIV_DEF`) sont ceux que l'utilisateur a réglés
  dans l'artefact (`reglages/courant`). Vingt groupes, avec le nouveau « Large crabot groupe » (4 à 6 crabots, valeur 7).
  Les valeurs sont désormais **les siennes**, plus forcément celles mesurées au banc (Puces en groupes : 10 au lieu de 16 ;
  Chasse à courre : 7 ; Mines & Sentinelles : 6). Presque tous les groupes sont **sans lieu imposé** (partout) ; seuls
  Banc de torpilles et Chasse à courre restent en extérieur, Essaim de drones en extérieur et bâti. Niveaux : **niveau 1,
  un seul groupe permis (Large crabot groupe)** ; niveau 2, 17 groupes ; niveau 3, les 20. Budgets (80, 96, 112) et
  répartition par lieu inchangés. Bestiaire : identique au code, sauf qu'une vieille mise à niveau remettait le crabot à
  25 PV sur un navigateur neuf ; elle est retirée, il a 22 PV partout. Tuiles relues : pile et site de forage inconnu.
  Fabricateur : niveaux 2 et 3 seulement (`ART_NIV_DEF`).
- Avant cette date, dix-neuf groupes de départ : les dix de l'utilisateur et neuf nouveaux (Poste de garde, Batterie, Essaim de drones,
  Escouade de réparation, Embuscade gluante, Chasse à courre, Convoi, Tireurs embusqués, Ronde de drones). Des groupes
  enregistrés avant cette date passent une fois par `groupesV2` : lieux et valeurs mesurées pour ceux qui portent un nom
  de départ, groupes nouveaux ajoutés à la suite, budget rapporté de 110 à 80.
- Mesuré en taille 3 : 22 créatures au niveau 1, 26 au niveau 2, 32 au niveau 3.
  Avec la référence du joueur du 21 novembre à 23 h 39 : 27, 34 et 37 créatures par carte (`mesures.md`).

### Fenêtre LIFE : tout se règle par niveau de profondeur (21 novembre 2026, après-midi)

Demande de l'utilisateur. De haut en bas : un **sélecteur de niveau** (1, 2, 3), puis pour ce niveau le **budget de
menace**, les **groupes possibles** et les **artefacts et machines possibles**. Les deux listes se règlent comme les
patrouilles d'un groupe : des étiquettes qu'on retire, un menu déroulant pour en ajouter. En dessous, la **répartition des ennemis** du niveau entre extérieur, bâti
et tunnels (% du budget).

- `GROUPES.niv[n] = {budget, gr:[noms]}`. Budgets de départ 80, 96 et 112 ; la « menace en plus par niveau » en % a
  disparu, chaque budget se règle à part. Un groupe n'est posé que s'il est actif (Lab → Groupes) **et** dans la liste du
  niveau. Au départ (référence du joueur, 21 novembre 2026 à 23 h 39) : 5 groupes au niveau 1, 15 au niveau 2, les 20 au
  niveau 3. Un groupe créé ou dupliqué est permis partout ; renommé ou supprimé, les
  listes suivent.
- `ARTEFACTS[k].niv` : niveaux où l'artefact peut apparaître (`artOn`). Départ : tourelles laser, piles et fabricateur à partir du
  niveau 2 ; croix laser, ponts à levier et station de réparation au niveau 3 ; tout le reste partout. La fréquence reste dans Lab → Artefacts.

### Styles de patrouille

Deux styles ajoutés le 21 novembre 2026 : **navette** (va-et-vient entre le point de départ et un point à 16-30 cases,
halte de 2 à 5 battements à chaque bout) et **garde** (le groupe se poste près du point à garder le plus proche — site,
porte verrouillée, grille, fabricateur, station, porte d'entrée — et ne s'en écarte pas de plus de 3 cases).


Le style est porté par le **groupe**, pas par l'espèce : un crabot peut faire la ronde dans un groupe et garder un
territoire dans un autre. Le sélecteur **ajoute** un style ; chaque style choisi s'affiche en étiquette, retirable.
**Si aucun n'est choisi, il est tiré parmi les six.** Quand il y en a plusieurs, **chaque groupe posé sur la carte
en tire un au hasard** (champ `pats`).

- **Errance** : **un pas tous les battements ou tous les deux**. La créature ne repart **jamais d'où elle vient, ni
  par les deux diagonales voisines** : il lui reste tout droit, les deux diagonales de devant et les deux virages à
  90°. Dans un cul-de-sac seulement, elle fait demi-tour.
- **Voyage en bande** : longs trajets vers un point éloigné, pause de 50 battements, nouveau départ.
- **Ronde** : une boucle de 3 ou 4 points fixes, à 7-13 cases du point de départ, toujours dans le même ordre, avec
  une halte de 3 à 6 battements à chaque point. Prévisible : on peut passer derrière. Les points sont pris
  n'importe où sur le terrain praticable ; un groupe de torpilles fait sa ronde dans l'eau.
- **Territoire** : le groupe tourne dans un rayon de 6 cases autour de son point de départ, haltes de 8 à 20 battements.
- **Sentinelle** : 2 ou 3 postes ; le groupe reste **immobile** à un poste 40 à 80 battements, puis rejoint le suivant.
- **Affût** : immobile à son point de départ.

**Échange de places** (la règle de Brogue) : une créature en patrouille dont le chemin est barré par une créature
calme d'un **autre groupe** prend sa case, et l'autre prend la sienne. Deux groupes qui se croisent dans un passage
étroit se traversent au lieu de se bloquer. Jamais avec un ennemi qui chasse ou qui a repéré la foreuse, ni avec
une mine armée ; une fois par battement et par créature ; chacune doit pouvoir tenir sur la case de l'autre. **En
chasse, rien ne change** : les ennemis se gênent et se contournent, le joueur garde l'avantage des goulots.

**Demi-tour, en dernier recours** : un groupe qui n'avance plus depuis 8 battements malgré l'échange repart vers
son point précédent (ronde, sentinelle) ou s'en choisit un autre (territoire ; une bande en voyage change de
destination).

La patrouille ne joue que tant qu'aucun membre n'a repéré la foreuse. Chasse et fouille finies, le groupe **reprend
sa patrouille** : il rentre chez lui au lieu de rester là où la chasse l'a mené. En patrouille on marche — un pas
par battement au plus, quelle que soit la vitesse de l'espèce.

Groupes de départ : puces en errance, crabot en ronde, relais en voyage, torpilles en ronde, broyeur en territoire,
mines à l'affût, sentinelle en sentinelle. Code : `patInit`, `patTick`, `patMove` dans `08-faune.js`, état dans `G.patr`.

## 3 bis. Le niveau

La partie tient sur **une seule carte**, celle de l'atterrissage : le vaisseau, un site de forage, le relief et la
faune réglés dans le **menu Monde**. **REGEN** (et **GÉNÉRER LA CARTE**, dans le menu Monde) en tire une nouvelle
avec les réglages du moment. Forer le site atteint le noyau : écran « NOYAU ATTEINT », puis une nouvelle carte.
Mort : idem.

- **Taille** : celle du menu Monde. Affichée en jeu en haut de la colonne (« Niveau 1 · 96 × 64 »).
- **Gisements** : 3 de métal et 1 de Matière pour une carte de taille 2, les autres tailles en proportion de leur
  surface. Chaque gisement vaut **30, 40 ou 50**.
- **Palette** : celle du joueur, sans variation.

### La carte est un plan de zones

L'essentiel du jeu se passe en intérieur, donc la logique est inversée : la carte est un **plan de zones**.
L'extérieur est une « pièce » parmi d'autres, faite de terrain naturel ; le reste est de la roche où les bâtiments
sont creusés. `ZONE` vaut 0 dans la zone extérieure et 1 dans le massif ; `ZINFO` garde la fonction de profondeur
et le seuil ; `ZESSAI` compte les cartes retirées. Ces trois variables sont de génération, pas dans `G` ;
`G.recette`, `G.tun` (cases de tunnel), `G.tunN` et `G.tunS` (nombre de sorties) y sont.

**Recettes** (`RECETTES`, `06-reglages.js` ; choix en haut du menu Monde, réglage `GEN.recette`) :

- `atterrissage` (défaut) : une zone extérieure, un **massif** sur un côté ou dans un coin, à la lisière sinueuse.
  Le vaisseau se pose dans la partie de l'extérieur la plus éloignée du massif. Un seul complexe, **creusé dans le
  massif** à plus de 5 cases de la lisière et du bord de carte (4 en taille 2, 3 en taille 1), atteint par un
  réseau de tunnels. Le site de forage est au fond du complexe.
- `cavernes` (21 novembre 2026, niveau 2) : **tout est sous roche**. Voir « Réseau de cavernes » plus bas.
- `base` (21 novembre 2026, niveau 3) : **la grande base**. Voir « La grande base » plus bas.
- `classique` : la génération d'avant la refonte (terrain partout, une ou deux structures posées dessus).

**La descente compte trois niveaux** (`NIV_MAX`, `RECETTE_NIV`) : niveau 1 `atterrissage`, niveau 2 `cavernes`, niveau 3 `base`.
Forer le site du niveau 3 atteint le noyau. Chaque niveau est généré avec les réglages que le menu Monde garde pour sa
recette (le monde, colonne de gauche, est commun à toutes). Les boutons Lab → Niv1/Niv2/Niv3 tirent un archétype
monde et un archétype bâti au hasard.

`ENFOUI()` dit si la recette en cours a un complexe enfoui ; dans ce cas `GEN.structure` (« Surface bâtie ») ne compte pas.

Les pourcentages du menu Monde (eau, montagne, gouffre, herbe) valent pour la **zone extérieure** seule.

### Menu Monde par recette

Disposition (22 novembre 2026, demande de l'utilisateur), de haut en bas :

1. **Recette de niveau**, sur toute la largeur ;
2. **Archétype monde** et **Archétype bâti**, côte à côte (voir « Archétypes monde et bâti ») ;
3. **Preset de niveau** : liste, nom, Enregistrer, Supprimer ;
4. **GÉNÉRER LA CARTE** : ferme la fenêtre et génère une carte avec les réglages en cours ;
5. un trait, puis les deux colonnes de réglages : à gauche le **monde**, à droite le **bâti** de la recette.

Chaque recette **déclare ses réglages**
dans `RECETTES[…].regl` : la colonne de droite se reconstruit au changement de recette et n'affiche que ceux-là.
Ajouter une recette, c'est ajouter une entrée à `RECETTES` ; le menu n'est pas à retoucher.

Une ligne de `regl` : `['num',clé,libellé,min,max,départ,[fourchette de hasard]]` ou
`['sel',clé,libellé,choix,départ,[valeurs tirables]]`. La fourchette finale servait à l'ancienne case « Réglages au
hasard » (retirée le 22 novembre 2026) ; elle n'est plus lue. La valeur en cours est dans `GEN[clé]` ; celles des autres recettes attendent
dans `GEN.rec[recette]` (enregistré avec `np-gen`), si bien que changer de recette et revenir ne perd rien.

Réglages de `atterrissage`. Chacun donne **un centre** ; la génération tire autour à chaque carte (`autour()`).

| Réglage (clé) | Bornes, départ | Tirage |
|---|---|---|
| Forme du massif (`zForme`) | un côté, un coin, au hasard (départ) | « au hasard » tire l'une des deux à chaque carte |
| Part d'extérieur (`zExt`) | 35 à 80 %, 60 | centre ± 10 points ; au moins 22 % de la carte reste au massif |
| Taille du complexe (`zComplexe`) | 10 à 70 % du massif, 45 | ± 15 % ; un tiers de plus sous la taille 3 ; jamais moins de 50 cases |
| Taille du réseau (`zTunnels`) | 100 à 400 cases, 245 | ± 30 %, borné à 100-400, réduit en proportion sur les petites cartes |
| Salles de tunnel (`zSalles`) | 0 à 8, 4 | ± 1 (0 : aucune salle) |
| Sorties du réseau (`zSorties`) | 1 à 3, 2 | nombre visé ; une sortie de plus n'est creusée que si la lisière offre un point à 12 cases des autres |
| Éloignement de la porte (`zPorte`) | 10 à 45 cases, 30 | ± 15 %, puis 80, 60 et 40 % de cette distance si le massif est petit |

S'y ajoutent, communs : archétype de structure, pièces par structure, ouvertures sans porte, portes verrouillées,
pièces secrètes. « Surface bâtie », « Nombre de structures » et « Portes d'entrée » ne figurent pas dans cette
recette : le complexe a toujours une seule porte, et sa taille vient de `zComplexe`.

**Case « Réglages au hasard »** (20 novembre 2026) : **retirée le 22 novembre 2026**. REGEN relance toujours les réglages
en cours ; le hasard ne sert plus qu'aux boutons Lab → Niv1/Niv2/Niv3, qui tirent les deux archétypes.

### Grain, regroupement et ambiances (21 novembre 2026)

Constat en taille 3 : toutes les cartes se ressemblaient, parce que chaque terrain était semé en petites taches
partout (une « soupe »). Deux réglages de relief, dans la colonne de gauche du menu Monde, y remédient :

- **Grain** (`GEN.grain`, 0 à 100, départ 65) : taille des taches de montagne, de gouffre, d'eau et d'herbe.
  50 donne la taille d'avant ; 100 des masses (un grand lac, une chaîne) ; 0 un relief émietté.
- **Regroupement par régions** (`GEN.regroupe`, 0 à 100, départ 45) : chaque terrain a un champ d'affinité à grande
  échelle ; pour chaque tache, on tire jusqu'à dix emplacements et on garde celui où ce champ est le plus fort
  (`meilleurePlace`). À 0, les taches sont éparpillées comme avant.

### Archétypes monde et bâti (22 novembre 2026)

Les ambiances du 21 novembre réglaient à la fois le monde et le bâti. Elles sont **séparées en deux listes**, choisies
indépendamment sous la recette (`06-reglages.js`) :

- **Archétype monde** (`AMB_MONDE`, choix dans `GEN.ambM`) : **commun à toutes les recettes**. Il règle la colonne de
  gauche et elle seule (`MONDE_KEYS`) : eau, montagne, gouffre, herbe, méthode, remplissage, itérations, grain,
  regroupement, et le **sol sous roche** des recettes souterraines (`cvMont`, `cvGouf`, `cvRoc`). Il remet d'abord ces
  réglages à `AMB_DEF`, puis pose les siens. Quatorze mondes : Désert de poussière, Prairie ondoyante, Bocage, Herbes
  géantes, Archipel, Mer intérieure, Marais, Canyons, Champ de cratères, Terre engloutie, Chaîne de montagnes,
  Pierrier, Mesas, Toundra fracturée. Leviers : ce qui domine (rien, herbe, eau, montagne, gouffre) ; la forme des
  taches (« bruit » fait des chaînes et des failles, l'automate des taches ; peu d'itérations avec un fort
  remplissage les déchiquette, beaucoup les arrondit) ; leur taille (grain) ; leur rassemblement (regroupement).
- **Archétype bâti** (`AMBIANCES[recette]`, choix dans `GEN.amb`, rangé par recette) : **propre à chaque recette**.
  Il règle la colonne de droite et elle seule : il la remet à ses valeurs de départ, puis pose les siennes.
  - Niveau 1 : Forteresse sous la montagne, Dédale de tunnels, Ruines effondrées, Petit poste isolé, Mine
    abandonnée, Coffre-fort, Falaise, Terrier, Hangars creusés, Sanctuaire caché.
  - Niveau 2 : Grottes sauvages, Cathédrale, Termitière, Cité enfouie, Avant-postes, Front de taille, Ruines
    englouties, Dédale de boyaux, Bunker, Grottes déchiquetées.
  - Niveau 3 : Citadelle, Ruche, Deux ailes, Complexe piégé, Base morte, Galeries de mine, Grand atrium, Base
    adossée, Blockhaus, Hangars de maintenance.
  - Classique : Avant-poste isolé, Citadelle, Bases jumelles, Hangars, Ruines, Hameau, Entrepôt, Station de forage,
    Labyrinthe, Camp ouvert.

Toucher un curseur repasse sur « Personnalisé » **la liste de sa colonne seulement**. Le nom affiché dans le Statut
et à l'arrivée (`G.amb`, `ambDouble()`) est « monde · bâti ».

**Recettes souterraines** (cavernes, base) : la colonne de gauche montre l'eau et l'herbe, puis la montagne, le
gouffre et les rochers épars **du sol sous roche** (`SOL_LBL`), à la place de la montagne et du gouffre du dehors,
qui n'y servent pas. Ces trois réglages étaient avant dans la colonne de droite, rangés par recette ; ils sont
désormais communs, comme le reste du monde.

**Qui tire quoi** :
- **REGEN** et **GÉNÉRER LA CARTE** : les réglages en cours, tels quels. La carte prend **le niveau de sa recette**
  (`NIV_RECETTE` : cavernes 2, base 3, les autres 1), donc la faune (fenêtre LIFE) et les artefacts de ce niveau ;
  avant le 22 novembre 2026, toujours le niveau 1, si bien qu'une carte « cavernes » ou « base » générée depuis le
  menu avait la faune et les artefacts du niveau 1.
- **Lab → Niv1, Niv2, Niv3** : un archétype monde et un archétype bâti de la recette du niveau, tirés au hasard
  (`hasardReglages()`), puis le menu du joueur est remis en place.
- **La descente** en jeu : les réglages en cours du menu pour la recette du niveau.

**Presets de niveau** (`MONDES`, `np-mondes`) : la recette, les deux archétypes choisis et tous les curseurs des deux
colonnes, enregistrés sous un nom. La liste ne montre que ceux de la recette en cours ; recharger un preset rend la
recette, le monde et le bâti. La taille de la carte n'en fait pas partie.

**Règle (22 novembre 2026)** : tout réglage de génération ajouté plus tard va dans l'une des deux colonnes
(`MONDE_KEYS` à gauche, `regl` de la recette à droite), et **les archétypes de cette colonne doivent lui donner une
valeur** dès qu'il change leur caractère.

Outils : `outils/planche_cartes.py` (douze cartes côte à côte avec leurs mesures) et
`outils/scripts/mesure-ambiances.js` (quinze cartes par ambiance). Chiffres dans `docs/mesures.md`.

### Réseau de cavernes (`07e-cavernes.js`)

Recette `cavernes` (`zones`, `enfoui`, `cavernes`, `sansVaisseau`). Pas d'extérieur à ciel ouvert : la carte est une roche
pleine où l'on creuse. Ici `ZONE` vaut **0 dans les cavernes et les boyaux** et 1 dans la roche, si bien que `distExt()`
donne la distance à la caverne la plus proche. Refait le 21 novembre 2026 (secteurs, cavernes séparées, ambiances).

La génération, dans l'ordre :

1. **Secteurs** (`secteurs()`, variable `SECT`) : la carte est coupée en 6 à 18 zones aux frontières sinueuses (une pour
   400 cases environ). Chacune reçoit un rôle : **0 cavernes, 1 bâti, 2 roche pleine**. La place donnée aux cavernes et
   au bâti se déduit de « Part de cavernes » et de « Surface bâtie » ; le reste est de la roche pleine. La
   **disposition** dit où vont les uns et les autres : mélangée, cavernes d'un côté et bâti de l'autre, cité au centre
   (bâti au milieu, cavernes en anneau), cavernes au centre, ou l'une des quatre au hasard.
2. **Cavernes** (`cavernes()`, `caForme()`) : chaque forme est un disque déformé par un bruit puis lissé. Elles sont
   posées les plus grandes d'abord, **dans les secteurs « cavernes », sans jamais se chevaucher**, à au moins
   `cvEcart` cases de roche les unes des autres. Leur nombre vient de la part demandée divisée par la taille demandée
   (30 au plus). Une caverne qui ne tient nulle part est réduite.
3. **Complément** : les cavernes grossissent par leurs bords (en lobes, guidés par un bruit), sans sortir de leurs
   secteurs ni s'approcher d'une autre, jusqu'à la surface demandée.
4. **Boyaux** : arbre couvrant (Prim) entre les cavernes, puis `cvBoyaux` boucles et `cvCuls` culs-de-sac de 8 à 18
   cases. Chaque boyau est le chemin le moins cher dans un bruit, **de bord de caverne à bord de caverne** ; la
   sinuosité règle le poids du bruit, et traverser un secteur bâti coûte cinq fois plus cher.
5. **Relief du sol** : la montagne, le gouffre et les rochers épars viennent du « sol sous roche » de la colonne de
   gauche (`cvMont`, `cvGouf`, `cvRoc`, réglés par l'archétype monde depuis le 22 novembre 2026), pas de la montagne
   et du gouffre du dehors ; l'eau et l'herbe aussi viennent de la colonne de gauche.
6. **Arrivée par un puits** : pas de vaisseau, la foreuse débouche sur un carré de 3 × 3 sec, **toujours dans une
   caverne ou un boyau large**. Le message d'arrivée est celui de la descente.
7. **Bâtiments enchâssés** (`batiments()`, mode `cav`) : chaque bâtiment part d'une graine tirée dans un secteur bâti,
   loin des autres graines, et s'étale **sans sortir des secteurs bâtis**, à plus de 2 cases d'une caverne et à plus de
   3 cases du bord ; trois cases de roche séparent deux bâtiments, et ils ne sont jamais reliés entre eux. « Pièces par
   bâtiment » est un **nombre visé** : la taille des pièces est ajustée (de 0,55 à 2 fois) pour tenir la surface, qui
   peut déborder d'un tiers. Chaque bâtiment a `cvPortes` portes, du côté de la caverne la plus proche.
8. **Boyau de porte** (`reliePortes()`) : de chaque porte à la caverne la plus proche ; il compte dans `G.tun` (jaune
   sur les planches). Si une porte n'atteint aucune caverne, la structure est refaite (douze essais).
9. Site de forage dans la pièce la plus profonde du plus grand bâtiment (`siteAuFond`). Verrous, secrets, pièces
   secrètes et artefacts passent par le même code que le niveau 1.
10. **Contrôle** (`cvBilan()`, dans `niveau()`) : la carte est mesurée et comparée à ce que le tirage visait (`CVT`).
    Trop loin, elle est refaite ; au bout de six, la meilleure est gardée. Le résultat est dans `G.obt` et s'affiche
    sous les réglages du menu Monde (« Carte en cours : 32 % de cavernes (visé 31) · 8 cavernes (8) · … »).

Réglages (centre autour duquel la carte varie à chaque tirage). Les tailles sont en cases ; sous la taille 4, la taille
des cavernes est réduite en proportion de la surface de la carte.

| Réglage (clé) | Bornes, départ | Tirage |
|---|---|---|
| Ambiance (`cvAmb`) | voir plus bas | un préréglage |
| Disposition (`cvDispo`) | au hasard (départ), mélangée, un côté chacun, cité au centre, cavernes au centre | |
| Part de cavernes (`cvPart`) | 10 à 60 %, 32 | ± 8 % de la valeur |
| Taille des cavernes (`cvTaille`) | 30 à 800 cases, 240 | ± 15 % ; le nombre de cavernes s'en déduit |
| Variété des tailles (`cvVar`) | 0 à 100, 40 | 0 : toutes pareilles ; 100 : de 1 à 13 |
| Roche entre deux cavernes (`cvEcart`) | 1 à 8 cases, 3 | |
| Forme (`cvForme`) | 0 (ronde) à 100 (déchiquetée), 50 | |
| Largeur des boyaux (`cvLarg`) | 1 à 3, 1 | chaque boyau : la valeur, ou une case de moins quatre fois sur dix |
| Sinuosité (`cvSinu`) | 0 à 100, 50 | |
| Boucles (`cvBoyaux`) | 0 à 6, 2 | ± 20 % |
| Culs-de-sac (`cvCuls`) | 0 à 6, 2 | ± 25 % |
| Montagne, gouffre, rochers (`cvMont`, `cvGouf`, `cvRoc`) | 0 à 15, 4 · 0 à 10, 3 · 0 à 8, 2 (% du sol) | |
| Nombre de bâtiments (`cvBati`) | 1 à 6, 2 | ± 20 %, au moins 50 cases chacun |
| Surface bâtie (`cvSurf`) | 5 à 40 %, 14 | ± 10 % |
| Pièces par bâtiment (`cvPieces`) | 0 (automatique), 2 à 25 | nombre visé |
| Portes par bâtiment (`cvPortes`) | 1 à 3, 1 | |

S'y ajoutent les réglages communs : archétype, ouvertures, verrous, secrets. « Nombre de cavernes » (`cvNb`) n'existe
plus : il est remplacé par la taille.

**Archétypes bâtis** (`AMBIANCES.cavernes`, `06-reglages.js`) : un préréglage remet tous les curseurs `cv…` à leur
valeur de départ puis pose les siens ; toucher ensuite à un curseur repasse sur « Personnalisé ». Le sol (montagne,
gouffre, rochers) est réglé par l'archétype monde. Liste complète dans « Archétypes monde et bâti ».

| Ambiance | Ce qu'elle règle |
|---|---|
| Grottes sauvages | 45 % de cavernes de 300 cases, très variées et déchiquetées ; un petit bâtiment de 4 pièces |
| Cathédrale | cavernes de 800 cases au centre, 6 cases de roche entre elles, boyaux larges ; 2 bâtiments |
| Termitière | une trentaine de cavernes de 50 cases, 5 boucles, 5 culs-de-sac, boyaux très sinueux |
| Cité enfouie | cité au centre : 4 bâtiments de 12 pièces sur 30 % de la carte, 18 % de cavernes autour |
| Avant-postes | 5 bâtiments de 4 pièces, mélangés aux cavernes |

**Mesures** du 21 novembre 2026 (25 cartes par réglage, `outils/scripts/mesure-cavernes.js`), taille 4 sauf mention :
part de cavernes obtenue à moins de 2 points de la part visée dans tous les cas (15, 32, 45 et 55 %) ; nombre de
cavernes 8,1 pour 8,1 visées au départ, 4,6 pour 4,7 avec des cavernes de 400 cases, 24 pour 30 avec des cavernes de
50 cases ; surface bâtie 12,7 % pour 13,9 visés au départ, 28,8 pour 29,5 en « Cité enfouie » ; toutes les cartes
sont entièrement reliées. Avant la refonte : une seule caverne faisait 82 à 87 % de la surface quel que soit le
nombre demandé, et 14 % de surface bâtie demandés en donnaient 9 à 10.

**Limites connues** : en taille 2, un seul bâtiment la moitié du temps ; 6 bâtiments sur 30 % ne donnent que 22 % ;
au-delà d'une dizaine de pièces par bâtiment, le nombre visé n'est atteint que si la surface le permet (8 à 9 pièces
obtenues pour 10 à 12 demandées) ; avec 55 % de cavernes la surface bâtie plafonne vers 10 % ; la faune n'est pas
encore répartie par lieu. Vue d'ensemble : `outils/scripts/cavernes.js` (les secteurs y sont teintés ; `window.CAS`
permet de choisir les six cartes).

### Forme du massif

Chaque case reçoit une **profondeur** `f(x,y)`, de 0 au cœur du massif à 1 au point le plus éloigné ; on y ajoute
un bruit à grande échelle (lisière sinueuse) et un grain fin, puis on garde en extérieur la part demandée. Seule
`f` change d'une forme à l'autre (`massif()`, `07-generation.js`, `FORMES`) :

- **un côté** : profondeur mesurée depuis un bord, le côté long quatre fois sur cinq ;
- **un coin** : distance au coin, en ellipse (`hypot`), le coin étiré au hasard en largeur ou en hauteur.

Ajouter une forme = ajouter une branche qui définit `f` (profondeur) et `g` (bruit de lisière). **`ZINFO.f` sert à
poser le vaisseau** loin du massif : toute nouvelle forme doit la fournir.

Le cadre où le complexe est posé est la boîte du **plus grand morceau** de massif éligible (parcours en largeur sur
les cases à plus de 5 cases de la lisière et du bord), pas la boîte de tout le massif : une échancrure profonde ne
peut pas faire poser le complexe à cheval sur l'extérieur. Si le complexe ne tient pas, la carte entière est
retirée (dix fois au plus) et le massif s'épaissit de 6 points par essai à partir du quatrième (`ZESSAI`) : avec
80 % d'extérieur sur une petite carte, on obtient donc moins d'extérieur que demandé, mais toujours un complexe.
En taille 1 il n'y a pas la place : la carte n'a alors aucune structure.

**Limite connue** : complexe et tunnels se partagent le massif. Avec un complexe à 45 %, demander 400 cases de
tunnel n'en donne souvent que 200 à 250, et la deuxième ou troisième sortie manque souvent ; il faut baisser le
complexe ou l'extérieur pour que le réseau ait la place.

### Tunnels (`07d-tunnels.js`)

La porte du complexe (une seule) est prise du côté le plus enfoncé dans le massif, et la **sortie du boyau est
choisie loin d'elle** : une case de la lisière à `zPorte` cases au moins de la porte, puis 80, 60 et 40 % de cette
distance si le massif est petit. Le boyau serpente — chemin le moins cher dans un bruit, élargi par endroits — en
restant à 3 cases au moins de l'extérieur jusqu'à ses dernières cases, et à une case au moins des murs du
complexe : il le contourne souvent. Une porte supplémentaire rejoint le réseau, jamais l'extérieur directement.

S'y ajoutent une ou deux **sorties de plus** (`zSorties`), à 12 cases au moins des autres et 20 de la porte ; la
deuxième part de la moitié du boyau la plus éloignée de la porte, la troisième de la moitié la plus proche.

Puis le réseau grandit jusqu'à la taille tirée : d'abord les **salles irrégulières** (automate cellulaire, cadre de
10-16 × 7-11), chacune au bout d'un boyau, creusées de préférence au cœur du massif ; ensuite des **culs-de-sac**
de 6 à 16 cases terminés par une petite poche. Un boyau ne longe jamais un autre tunnel à moins de 3 cases. Jamais
plus de 400 cases ; à moins de 100 (× surface), `tunnels()` renvoie faux et la structure est refaite (douze
essais). Si aucun passage n'est trouvé, la structure est retirée ; au dernier essai, `connect` perce tout droit.

La roche dure vient ensuite : le cœur du massif est impénétrable, les parois des tunnels restent tendres sur deux cases.

### Matière

Second métal, **couleur accent** (les éclats de réparation sont couleur bio), mêmes dessins et mêmes trois tailles.
Pris dans la montagne, il tombe quand on brise la paroi ; passer dessus ajoute **30, 40 ou 50** à la réserve
**Matière**, affichée sous les jauges. Elle se dépense au **fabricateur** (21 novembre 2026).

### Sonar

**10 à 30 tours après l'arrivée** (10 à 20 jusqu'au 22 novembre 2026), la foreuse émet une **onde circulaire** qui balaie toute la carte : un cercle
d'un pixel de tuile, calé sur la grille, opaque, couleur accent, à 38 cases par seconde et pendant 2,6 s au moins.
L'onde se voit **aussi sur la mini-carte**, et un « blip blip » l'accompagne.

Elle **détecte tous les gisements** (métal et Matière) : chacun apparaît quand l'onde l'atteint, sur la carte comme
sur la mini-carte (bio pour le métal, accent pour la Matière), même en zone jamais vue et au cœur d'un massif. Le
journal donne le compte ; survoler ce qui est détecté dit ce que c'est et s'il faudra forer.

### Menus Monde et Life

Deux fenêtres, ouvertes par deux boutons sous la mini-carte, à côté de **REGEN** : **MONDE** (le relief) et
**LIFE** (la faune). Un preset de niveau ne décrit **que la génération**.

- **REGEN** génère une nouvelle carte avec les réglages en cours.
- **Monde** : en haut la recette, les archétypes monde et bâti, le preset de niveau et **GÉNÉRER LA CARTE** (ferme
  la fenêtre et génère aussitôt) ; dessous, à gauche le monde (taille, terrain, relief), à droite les réglages de la
  recette. Voir « Menu Monde par recette ».
- **Life** : budget de menace et groupes actifs. Sous le budget, tout défile (22 novembre 2026) : la fenêtre ne dépasse
  jamais l'écran ; la fenêtre Artefacts du Lab aussi. Ces réglages **ne font partie d'aucun archétype** : ils valent
  pour toutes les cartes jusqu'à ce qu'on les change.
- **Presets de niveau** : un champ **Nom** et **Enregistrer** gardent la recette, les deux archétypes et tous les
  réglages de génération sous ce nom ; la liste les recharge ; **Supprimer** retire le preset choisi. Enregistrer
  sous un nom existant le met à jour. Mémorisés sous `np-mondes` et joints à l'enregistrement dans la base.

### Banc de combat

Artefact à part (https://claude.ai/artifact/9BKRaoB4hzgdWhzYFx5A6q) : la page du jeu, plus un panneau qui remplace
la colonne. On y choisit une carte de taille 1 (arène nue ou l'un des six reliefs d'essai), des ennemis, un
équipement, une consigne de pilote automatique (chasse ou traversée), et l'on lance une **série** sans affichage
(moyennes : victoires, vie restante, points perdus, points perdus par ennemi tué, durée) ou **un combat à l'écran**.
Options : ennemis en alerte, vie d'essai. Onglet « Mes résultats » (gardés dans le navigateur ; un clic sur une ligne
reprend la configuration). L'onglet « Archives » et ses données ont été **effacés le 22 novembre 2026**.
**Générer** (22 novembre 2026) : pose la même arène et ses ennemis, puis **on joue soi-même**, au clavier et à la souris ;
le haut de la colonne du jeu revient à côté du panneau (barres, boutons, Inventaire ouvert). Inventaire **plein au
départ : 2 exemplaires de chaque consommable**, tous identifiés (18 places sur 20), plus l'équipement choisi. Foreuse
détruite : « Déployer une nouvelle foreuse » relance la même arène. Le Lab du jeu ouvre le banc par son bouton **Combat**.
Il sert à régler les coûts de menace ; **à republier quand le moteur change**, sinon il mesure l'ancien jeu.

### La grande base (`07g-base.js`, 21 novembre 2026)

Recette `base` (`zones`, `enfoui`, `cavernes`, `base`, `sansVaisseau`) : le moteur du niveau 2, réglé autrement. Beaucoup de
bâti (2 à 6 **ailes**, 18 à 45 % de la carte), une ou deux petites **poches** de terrain naturel qui servent d'extérieur
(8 à 22 %), et un **réseau de tunnels** qui relie les portes des ailes aux poches et entre elles. `baseFinir()` ajoute :

1. **des galeries en plus**, comme au niveau 1 : culs-de-sac de 4 à 14 cases et petites salles irrégulières, creusés dans
   la roche à partir du réseau, jamais à moins de 2 cases d'un bâtiment (`bsTunnels`, `bsSalles`) ;
2. **l'arrivée dans la base** : la foreuse débouche dans une pièce d'une aile, parmi le quart des emplacements les plus
   éloignés du site, sur un carré de 3 × 3 de sol bâti. Jamais derrière une porte verrouillée ou dérobée : on vérifie
   qu'elle rejoint l'ancien point d'arrivée sans clé. Des débris tombent autour d'elle (`eboulis`, sol bâti compris).

« Salles-machines (% de la fréquence du Lab) » (`bsMachines`) multiplie le nombre de machines de la base.
Garde-fou valable pour toutes les recettes : si, machines posées, le site n'est plus atteignable (`accesSite()`), la carte
est refaite (trois fois au plus).

## 3 ter. Exploration automatique

Touche **O** ou bouton **EXPLORER** : la foreuse explore seule.

- **Où elle va** : vers la case connue la plus proche d'où l'on découvre du terrain. Au passage elle ramasse ce qui
  est en vue : objets, Matière, clés, et les éclats de réparation **seulement si la vie n'est pas pleine** (sinon
  elle les contourne pour ne pas les gâcher).
- **Jamais** : forer la roche, attaquer. Elle n'entre dans l'eau profonde que s'il ne reste rien d'autre à voir.
- **Elle s'arrête** dès qu'un événement survient : une créature jamais signalée entre en vue (chaque créature
  n'interrompt qu'une fois), un ennemi visible la chasse, elle est touchée, le site de forage est repéré, un
  message d'alerte tombe, ou à la moindre touche et au moindre clic. Le journal dit pourquoi ; O reprend.
- **Refusée** tant qu'un ennemi visible chasse la foreuse.
- **Quand tout est exploré** : elle rejoint le site s'il est connu (« [F] pour forer »), sinon « Plus rien à
  explorer sans forer la roche ».
- Chaque pas est un déplacement normal : le temps passe, la course et la discrétion s'appliquent.

## 3 quater. Artefacts

Des **systèmes greffés sur chaque carte**, à l'intérieur des bâtiments. Chacun s'active ou se coupe pour la
génération et a une **fréquence sur trois crans [− = +]**, dans **Lab → Artefacts** (mémorisé sous `np-artefacts`).
Code : `07c-artefacts.js`, appelé à la fin de la génération des bâtiments.

| Artefact | Ce qu'il fait | Fréquence − / = / + |
|---|---|---|
| **Antenne** | La foreuse l'active **en avançant dessus** (un battement). Depuis le 22 novembre 2026 elle ne lève le brouillard que **15 tours**, sur un **disque de 30 cases de large**, murs compris (découvert anneau par anneau) ; ensuite le brouillard revient, mais elle **continue de signaler les ennemis** du disque par un **point en couleur danger**, sur la carte et la mini-carte. Avant : le disque restait en vue pour toujours. |
| **Pièces envahies d'herbe** | La pièce entière est couverte d'herbes hautes et basses mêlées par touffes (le site et les clés gardent leur sol). | 8 % / 18 % / 35 % des pièces |
| **Machines** | Dix machines hors d'usage (tuyaux, serveur, caisses, ordinateur, établi, cuve, générateur, console, turbine, armoire électrique), posées en **obstacles** : une à cinq par pièce choisie. **Elles barrent le pas mais pas la vue**, au contraire des piliers. Une charge sismique les réduit en gravats. | 15 % / 35 % / 60 % des pièces |
| **Terminal** | La foreuse l'active en avançant dessus : une fenêtre affiche **un texte** (huit fragments de journal, provisoires ; le temps ne passe pas). | 1 / 2 / 4 par carte |

- Trois terrains : `MACHINE`, `ANTENNA`, `TERMINAL`. Infranchissables pour tous, transparents à la vue, sans effet
  sur la discrétion. `G.art[case]` : la variante d'une machine, l'état d'une antenne, le texte d'un terminal.
- **Un obstacle ne coupe jamais un passage** : il n'est posé ni devant une porte ou une ouverture, ni là où il
  séparerait la pièce en deux. Antennes et terminaux vont de préférence contre un mur, les machines sept fois sur dix.
- Treize tuiles retouchables au Tile editor, groupe « Artefacts ».

## 3 quinquies. Machines (`07f-machines.js`, 21 novembre 2026)

Nées de la conversation « Couloir de tourelles laser ». Des **salles-machines** greffées sur les bâtiments : beaucoup
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
| **Salle piégée** | Un butin au milieu de la pièce (plan ou équipement, capsule, Matière) ; 8 à 16 **relais cachés dans des niches** (doublé le 22 novembre 2026 ; moins si les murs manquent de place) des murs (tuile « niche », visible : le piège se lit). Ramasser l'appât les fait surgir, déjà en chasse. Ils ne lâchent rien. L'exploration automatique ne touche pas à l'appât. |
| **Vitrines** | Une petite pièce en cul-de-sac, trois lots sous vitrine (un plan, un équipement, deux capsules) : **on n'en emporte qu'un**, les deux autres se verrouillent. Idée des coffres de Brogue. |
| **Station de réparation** | Une fois : vie et énergie au maximum. Le bruit met en chasse les ennemis à 12 cases. |
| **Fabricateur** | Voir « Fabricateur ». Un par niveau, garanti. |

- **Lisibilité (22 novembre 2026, d'après Brogue)** : un mécanisme est toujours à côté de ce qu'il commande, et chaque salle
  se comprend d'un coup d'œil. Une salle à lasers porte 7 fois sur 10 un butin au fond (Matière ou capsule).
- **Un laser ne tire que si la foreuse le voit** (22 novembre 2026) : sa tourelle, son pylône ou une case de son rayon est en
  vue (`machVu`). Sans témoin il reste éteint : les ennemis en vadrouille ne s'y blessent plus. Le rythme, lui, continue de
  tourner (`G.mt`). On peut toujours attirer un ennemi dans un rayon qu'on regarde.
- **Le tir ne s'entend qu'en vue et à moins de 5 cases** (22 novembre 2026).
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

### Butin d'exploration (`butinExplo`, `14d-objets.js`, 22 novembre 2026)

Posé à la fin de la génération, sur toutes les recettes. **Pièces secrètes** : chacune reçoit un lot au fond (capsule,
Matière, une fois sur deux un plan, une fois sur quatre un Module de puissance). **Culs-de-sac et coins reculés** : les cases
d'où plus rien ne mène ailleurs, entourées d'obstacles sur trois côtés au moins, et les plus loin du trajet arrivée → site ;
5 à 10 par carte (6 sur une carte de taille 3), espacées. La plus reculée porte un **Module de puissance**, la suivante un
**plan**, la troisième une **capsule**, les autres de la **Matière** (15). Mesures : `docs/mesures.md`.

### Fabricateur (`14c-fabricateur.js`)

Premier usage de la **Matière**. Avancer sur un fabricateur ouvre une liste : **seulement les objets dont la foreuse a trouvé
le plan** (22 novembre 2026 ; avant : tous les consommables et quatre équipements au hasard). Sans aucun plan, il le dit et
ne propose rien. Les plans se trouvent au sol, dans les dépôts, les salles piégées, les vitrines, et sur les robots abattus :
objets simples au niveau 1 (réparobots, batterie, fumigène, clé), consommables avancés et accessoires au niveau 2, armes et
armures au niveau 3 (un cran d'avance possible). Un plan déjà connu se recycle en 10 de Matière. Le Module de puissance ne se fabrique pas. Une fabrication prend 3 battements ; l'objet est ramassé s'il y
a de la place, sinon posé sous la foreuse. Flèches (ou Z/S) et Entrée, ou clic ; Échap ferme. **Pavé numérique** (22 novembre
2026) : 8 et 2 montent et descendent, 5 fabrique ; les chiffres 1 à 9 du haut du clavier choisissent l'objet de ce numéro,
affiché devant son nom. **La fenêtre ne bouge pas** d'un objet à l'autre : liste et panneau de droite ont une hauteur fixe,
et les descriptions trop longues (Fumigène, Charge sismique, Clé) ont été raccourcies. **Couleur du nom par famille** :
consommables en bio, accessoires en monde, armes et armures en accent (grisé si la Matière manque).
**Chaque illustration ASCII reprend la tuile de l'objet posé au sol** (21 novembre 2026) : même silhouette, mêmes couleurs (accent, bio, monde, blanc, rouge). La tuile fait foi : quand on redessine une tuile `o_…`, l'illustration est à reprendre à la main. Les quatre objets du fabricateur ont leur propre tuile (`o_vrille`, `o_trepan`, `o_carene`, `o_blindage`). Contrôle : `outils/scripts/planche-objets.js` montre les deux côte à côte.

**À droite de la liste, l'illustration ASCII de l'objet sélectionné** (celle de l'inventaire, `artHTML`), son nom, son effet
et sa description ; elle suit les flèches, le survol et le focus (21 novembre 2026, après-midi).

| Objet | Prix | Objet | Prix |
|---|---|---|---|
| Batterie | 14 | Stabilisateur, Servomoteur | 45 |
| Fumigène | 16 | Viseur laser, Gyroscope | 50 |
| Réparobots | 18 | Condensateur | 55 |
| Surrégime | 20 | Carène légère (armure) | 60 |
| Clé | 22 | Vrille rapide (arme) | 70 |
| Camouflage optique | 24 | Trépan lourd (arme), Blindage composite (armure) | 85 |
| Charge sismique | **34** (26 avant : c'est le consommable qui épargne le plus de vie, voir mesures) | Accumulateur, Téléobjectif | 40 |

Tous les prix se règlent dans **Lab → Items**.

Repère : une carte de taille 3 porte deux gisements de Matière de 30 à 50, soit 70 à 80 par niveau, plus le butin au sol
(2 à 4 blocs de 15) et ce que lâchent les robots : 120 à 150 par niveau en explorant tout.
Quatre pièces nouvelles (choix de l'utilisateur, « consommables + équipement ») : **Vrille rapide** (1d4+4, coup −30,
CRIT +5, POW 9), **Trépan lourd** (2d6+6 depuis le 22 novembre 2026, 2d6+4 avant ; coup +25, POW 12), **Carène légère** (DEF +5, VIT +1, DIS −1, POW 9),
**Blindage composite** (DEF +25 depuis le 22 novembre 2026, +18 avant ; VIT −1, POW 12). Leurs tuiles au sol sont la tuile générique, à dessiner.

### Deux règles de génération du 21 novembre 2026 (après-midi)

- **Un gisement de métal ou de Matière ne touche jamais plus de 3 roches dures** (parmi ses 8 voisines) : `hideOre`
  ne retient que ces cases. Faute de place, sur une carte qui n'en offre pas assez, il reprend toute la roche tendre.
- **La zone dégagée autour du vaisseau est un ovale** (`SHIP_OVALE`), centré sur lui, avec une case de marge au moins
  autour de la coque. C'était un rectangle.

## 4. Terrains

| Terrain | Passage | Vue | Effet |
|---|---|---|---|
| Sol rocheux | oui | libre | texture « plaques rugueuses » (§ 2) |
| Rocher | brisé en 2 coups | libre | laisse des gravats |
| Montagne | brisée en 2 coups (sauf bord de carte) | bloquée | 10 % contiennent des éclats de métal |
| Roche dure | **indestructible à la foreuse** | bloquée | le cœur des massifs ; seule une **charge sismique** la brise. **Pas de métal** dedans |
| Eau peu profonde | oui | libre | −20 de défense ; **terrain lent : pas ×1,5**, sauf pour les nageurs |
| Eau profonde | oui | libre | −20 de défense ; **chaque pas a 50 % de chance de partir dans une autre direction** (si cette case est bloquée, la foreuse est plaquée contre l'obstacle et le tour passe) ; **attendre** y déplace d'une case au hasard ; **pas ×2**, sauf pour les nageurs. Seule la foreuse dérive : les créatures y nagent droit |
| Herbes hautes | oui | bloquée | **deviennent des herbes basses** au passage ; +12 de défense pour qui s'y trouve ; froufrou |
| Herbes basses | oui | libre | **portée de discrétion ÷ 2** : c'est le couvert du jeu |
| Fumée | oui | **bloquée** | nuage de fumigène : cache la vue des deux côtés, se dissipe en 15 à 25 battements (§ 6 bis) |
| Gouffre | non | libre | — |
| Pont / gravats | oui | libre | — |
| Mur, pilier | non | bloquée | bâtiments : la foreuse ne les entame pas, la charge sismique les réduit en gravats ; comptés comme parois pour la discrétion. Le capteur ne devine pas la case derrière |
| Porte | oui | fermée : bloquée | **fermée tant que personne n'est dedans** ; s'ouvre quand la foreuse ou une créature s'y tient, se referme derrière. Pas de diagonale par une porte |
| Porte verrouillée | avec une clé | bloquée | un mur tant qu'elle est fermée, pour tous. **Avancer dessus avec une clé l'ouvre** (clé consommée, un battement) ; une charge sismique la détruit |
| Machine, antenne, terminal | non | libre | § 3 quater |
| Coque du vaisseau | non, indestructible | libre | — |
| Soute du vaisseau (intérieur + porte) | oui | libre | point de départ ; pas de traces de chenilles |

### Vaisseau Cargo

Grille 5 × 6 cases, nez vers le haut : `..H..` / `.HHH.` / `HHIHH` / `HHIHH` / `.HDH.` / `.E.E.` (H coque, I soute,
D porte, E réacteur). **Seulement 3 cases praticables** : 2 de soute + la porte, toutes entourées de coque, donc
aucun passage en diagonale possible. Sortie vers le bas entre les deux réacteurs.

Posé à la génération sur une zone dégagée (marge d'une case tout autour) ; à défaut sur la zone la moins
encombrée, nettoyée puis reliée au reste de la carte. La connexion automatique ne perce jamais la coque. La foreuse
démarre au fond du couloir, mèche vers la porte ; elle peut toujours y revenir, les ennemis peuvent y entrer.

Passer la porte joue un bruitage de porte automatique (souffle pneumatique, servo, rail) : **c'est le bruit de
toutes les portes**, celles des bâtiments comprises, à volume réduit quand une créature en pousse une.

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

**Rien n'est donné au départ** (22 novembre 2026), sauf la foreuse et la Coque d'usine : tout le reste se trouve ou se fabrique.

### Capsules, visée, plans (`14d-objets.js`, 22 novembre 2026)

- **Consommables non identifiés.** Chaque sorte porte un **nom de code** tiré à chaque partie (« Capsule //KZ7-3FQ ») et la même
  tuile de capsule au sol. Le premier usage révèle ce que c'est, pour toute la partie ; trouver le plan aussi. La clé et la
  Matière sont toujours connues. Ce que la foreuse sait (plans, capsules identifiées, codes) est dans `G.st.savoir` et la
  suit d'un niveau à l'autre.
- **Tout consommable se vise**, comme la charge sismique, jusqu'à 4 cases. **La visée montre toujours une seule case**
  (22 novembre 2026, avant : le carré de 3 × 3 de la charge, le disque du fumigène) : une capsule inconnue ne se trahit
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
| **Module de puissance** | **POW +1 pour toujours** ; chaque point de POW au-dessus du POW requis par l'arme donne **+5 % de dégâts** (+1,5 % avant ; 8 % essayé quelques heures le 22 novembre, baissé parce que la foreuse de série rattrapait le Trépan) | ses coups portent 25 % plus fort |
| **Surrégime** | CRIT +50 pendant 10 battements ; la foreuse vire au rouge | ses coups sont tous critiques pendant 10 battements |
| **Camouflage optique** | invisible 10 battements : vue seulement au contact, les poursuivants à distance lâchent ; **rompu par un coup ou un forage** ; « Camouflé N » sous les barres, comme « Englué N » (22 novembre 2026) | il disparaît 10 battements (visible au contact) |
| **Balise** (néfaste) | une **sirène à deux tons** retentit (22 novembre 2026) ; tous les ennemis à 20 cases savent où est la foreuse | lancée au loin, ils y courent : un leurre |
| **Court-circuit** (néfaste) | énergie à zéro | hors service 10 battements, sans dégât ; un Bloqueur lâche |
| **Matière** (butin au sol) | +15 en réserve, dès qu'on marche dessus | – |

**Créature étourdie** (batterie, Court-circuit ; 22 novembre 2026) : elle ne fait plus rien, Puces comprises (elles n’en
tenaient pas compte avant). Toute sa silhouette devient un **damier d'un pixel sur deux, couleur bio et couleur bâti en
quinconce** ; les deux couleurs **s'échangent à chaque battement**, pour qu'on voie d'un coup d'œil qu'elle est immobilisée. **La foreuse prend le même damier
quand elle est immobilisée**, c'est-à-dire tenue par un Bloqueur (22 novembre 2026) ; il prime sur ses autres allures
(engluée, camouflée, en surrégime).

Les deux capsules néfastes (22 novembre 2026, choix de l'utilisateur) font de l'identification un pari : essayer une capsule
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
- **Vingt places** dans l'inventaire, **une par exemplaire** (22 novembre 2026 ; avant, dix places, une par sorte) :
  les exemplaires s'empilent à l'affichage (×3), mais trois batteries prennent trois places. Le compteur affiche
  `[places/20]`. Ramasser quand les 20 places sont prises est refusé et **l'objet reste au sol**. **[X] jette UN
  exemplaire au sol**, sur une case libre voisine (21 novembre 2026 ; avant, il détruisait la pile), et libère une place.
- **Un objet par case au sol** (22 novembre 2026) : un objet qui tombe — jeté par la foreuse, lâché par un robot abattu,
  sorti du fabricateur quand le sac est plein — ne se pose jamais sur un autre objet ; il roule sur la case libre la plus
  proche (`caseSol`, 14-inventaire). Les lots posés à la génération (appât d'une salle piégée, dépôts, vitrines) restent
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
- **Jeter** (et **[X]** du sac) pose l'objet au sol **sur la première case libre la plus proche, jamais sous la foreuse** (21 novembre 2026) : les huit
  cases voisines d'abord (orthogonales avant diagonales), puis de plus en plus loin en suivant les cases praticables (`caseJet`). Libre : ni obstacle,
  ni eau profonde, ni porte, ni créature, ni autre objet. Sans aucune case libre, il tombe sous la foreuse. Marcher dessus le ramasse, ou touche **G**.
  **Tuile au sol** (21 novembre 2026) : chaque objet a la sienne, `o_` + clé de l'objet (`PAT.o_foreuse`, `o_usine`, `o_servo`, `o_optique`,
  `o_viseur`, `o_conden`, `o_gyro`, `o_stabil`, `o_accu`, `o_repar`, `o_batterie`, `o_fumigene`, `o_charge`), retouchables dans l'éditeur
  (groupe « Objets au sol ») ; la clé garde `cle`. S'il y a plusieurs objets sur une case, on voit le dernier posé. `PAT.objet` ne sert plus que de repli.

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

**Fumigène.** À la pose, une **galette ovale** autour de la foreuse : 7 cases de large et de haut, 5 en diagonale
(37 cases). Chaque case tire sa durée entre **15 et 25 battements**. À chaque battement le nuage **gagne une à
trois cases voisines** au hasard, avec une durée plus courte : il s'étend de travers, plafonné à 90 cases, puis
s'efface case par case. Les ennemis qui chassaient **perdent aussitôt la trace**.
- **Il passe au-dessus des gouffres** ; seuls les obstacles pleins l'arrêtent.
- **Une case de fumée cache la vue dans les deux sens** : les ennemis ne vous voient plus, et vous ne voyez plus
  qu'à une case autour de vous. Le nuage reste dessiné en entier, en plus pâle là où il coupe la vue.
- Dessiné avec les **six tuiles de nuage** de l'intro ; **les tuiles changent d'un battement à l'autre** (cœur si
  les huit voisines sont de la fumée, bord sinon ; une case sur deux retire sa tuile au hasard dans sa famille), si
  bien que le nuage a l'air de vivre. Elles pâlissent dans leurs quatre derniers battements.
- Sous les barres, « Dans la fumée N » tant que la foreuse y est.

**Charge sismique : une visée.** L'utiliser n'explose pas tout de suite : une **case rouge** s'ouvre une case devant
la foreuse (sur elle tant que la capsule n'est pas identifiée). On la déplace à la souris ou aux touches de direction,
sans que la foreuse bouge, dans un **rayon de 4 cases** (butée nette). **Entrée** ou un **clic** tire. **L'explosion est
celle d'une mine** (22 novembre 2026) : le carré de 3 × 3 autour de la case visée **et 5 cases tirées au hasard parmi les
12 qui le bordent par un côté**. **30 dégâts** à chaque créature de la zone, **la foreuse comprise** si elle y est, et
**la roche vole en éclats** — rocher, montagne, **roche dure**, murs, piliers, portes verrouillées et
machines ; les métaux tombent au sol. Le tir prend **un battement** et fait autant de bruit qu'un coup sur la roche
(portée de discrétion ×1,5 ce battement-là) ; le combat est engagé. **Échap** annule sans rien consommer.

**Effets visuels et bruitages** : chaque objet peut déclarer son bruit (champ `son`) et son effet (`fx`) ; les
autres gardent le petit bip d'usage. Pixel art strict : taille fixe, opaques, calés sur la grille des pixels de
tuile, chaque grain apparaît à son heure et s'efface d'un coup.

## 7. Bestiaire

Les ennemis sont des **machines** : contour noir franc, blindage en couleur monde, **capteur rouge** à la place des
yeux, chenilles ou pattes rigides. Les clés internes gardent les anciens noms (`crabos`, `cafar`, `mastok`,
`brochon`, `paralyzor`), pour que les archétypes et les réglages enregistrés continuent de marcher.

| Espèce | VIT | PV | DÉG | PRE | DEF | CRIT |
|---|---|---|---|---|---|---|
| Puce | 6 | 10 | 2-3 | 80 | 20 | 2 % |
| Crabot | 5 | 22 | 3-6 | 65 | 0 | 2 % |
| Relais | 5 | 15 | 3-4 | 50 | 10 | 5 % |
| Torpille | 7 | 14 | 4-5 | 80 | 20 | 2 % |
| Broyeur | 4 | 60 | 10-18 | 60 | 0 | 0 % |
| Mine | 8 | 12 | 20 (explosion) | — | 0 | 0 % |
| Sentinelle | 7 | 14 | 1-2 (laser, 2 cases) | 75 | 10 | 0 % |

Ce sont les valeurs réglées en jeu par l'utilisateur et recopiées dans le code. **Une nouvelle espèce s'ajoute à la
fin de la liste**, jamais au milieu : les tuiles sont numérotées par rang (`bz0`…) et insérer une espèce colle les
retouches du joueur sur la mauvaise bête.

**Les articles des messages suivent le genre de l'espèce** (champ `fem`), avec élision devant une voyelle et pas de
s au pluriel sur un nom qui en porte déjà un : « la puce », « la torpille », « le crabot », « les relais ».

- **Puce** — *sans avoir repéré la foreuse* : elle erre. *Une fois repérée, tant qu'aucun coup n'est échangé* : elle
  **suit sans attaquer** (à plus de 3 cases elle se rapproche, à 2-3 cases elle piétine, **au contact elle recule**).
  **Dès que la foreuse est attaquée, ou attaque n'importe quelle créature — que le coup porte ou rate** (la charge
  sismique compte) —, **toutes les puces qui la suivent passent à l'attaque** : « Les puces passent à l'attaque ! ».
  Elles ne reculent plus tant qu'elles n'ont pas oublié la foreuse. *Si elle la perd de vue* : dernière position
  connue, fouille, oubli, et elle redevient pacifique.
- **Crabot** : erre ; dès qu'il voit le robot, le chasse et l'attaque au contact.
- **Relais** : vit en bande ; chaque individu reste à 4 cases au plus du centre. **Mémoire partagée** : ce qu'un
  relais voit, tous les relais de sa bande le savent. **Seuls les relais partagent** — les autres espèces de leur
  groupe ne sont pas alertées, et aucune autre espèce ne partage.
- **Torpille** : ne quitte jamais l'eau ; invisible dès qu'elle plonge en eau profonde.
- **Mine** : elle fonce dès qu'elle a repéré la foreuse. Arrivée **à une case**, elle **s'arme** : elle ne bouge
  plus et **clignote**, puis **explose 2 à 3 battements plus tard** (1 à 3 jusqu'au 22 novembre 2026 : à 1, elle sautait au battement suivant) — **20 dégâts** dans un **carré de 3 × 3, plus 5 cases tirées
  au hasard parmi les 12 qui le bordent par un côté** (les coins du 5 × 5 exclus ; 22 novembre 2026), à la foreuse et à
  toute créature qui s'y trouve. Les flammes se dessinent sur toute la zone, si bien qu'aucune explosion n'a la même forme. Détruite avant, elle n'explose pas ; elle n'a pas d'autre attaque.
  **L'explosion brise la roche et la montagne tendre** du carré (22 novembre 2026) : elles deviennent des gravats, et le
  métal ou la Matière qu'elles cachaient tombent au sol, sur toute la zone. La roche dure, les murs et les machines tiennent : seule la
  charge sismique en vient à bout.
  L'animation pose sur chaque case du carré les tuiles **boom0** (éclair blanc), **boom1** (damier accent) puis
  **boom2** (braises monde), qui alternent avec une variante décalée pour crépiter ; elles se retouchent au Tile
  editor, groupe FX (22 novembre 2026 ; avant, un dessin en code). **La charge sismique montre la même**.
- **Sentinelle** : **tire un laser jusqu'à 2 cases**, en ligne de vue, une fois par battement, jet pour toucher
  ordinaire. **Le trait rouge se voit toujours** : droit sur la foreuse s'il touche, à côté s'il rate ; il crépite
  puis s'éteint. Attention : « Sentinelle » est aussi le nom d'un style de patrouille.

### Cinq espèces du 21 novembre 2026

Ajoutées à la fin de `BEASTS` (tuiles `bz6` à `bz10`, dessins de départ). Stats dans le Bestiaire.

| Espèce | Rôle | Capacité (`08-faune.js`) |
|---|---|---|
| **Bloqueur** (l'ancien Gardien, 22 novembre 2026) | Rapide (VIT 8), 30 PV, DEF 15, frappe à 2-4 | `bloque` : au contact il **agrippe la foreuse, qui ne peut plus se déplacer** (ni forer) tant qu'il vit ; trois rayons parallèles couleur bio, espacés d'un pixel, les relient en passant sous eux (un trait rouge jusqu'au 22 novembre 2026, 21 h 50). Étourdi (batterie), il lâche. La clé reste `gardien` pour les groupes ; ses stats s'enregistrent sous `bloqueur` (`bk`). |
| **Artilleur** | Laser à 5 cases, 4-7 dégâts | `cadence:2` (un tir tous les deux battements), `recul:2` (s'écarte quand la foreuse est à 2 cases) |
| **Drone** | Rapide, fragile, en essaim | `vol` : gouffres et eau ne l'arrêtent pas ; partage ce qu'il voit avec sa bande |
| **Soudeur** | Soutien | `soin:5`, `portee:4` : répare l'allié le plus abîmé à portée ; `recul:1` : fuit le contact |
| **Englueur** | Contrôle | `glu:4` : une **boule de glu** (tuile « glu », plus un trait de laser) tous les 3 battements englue la foreuse 3 battements (pas deux fois plus longs) ; **la foreuse engluée prend la couleur bio** ; garde ses distances |

L'englueur reprend l'idée du Gluar, retiré le 17 novembre 2026 avec les espèces absentes du Bestiaire. Aucune stat des
espèces existantes n'a été changée. Essais : `outils/scripts/test-ennemis.js`.

### Comportements communs

- **Eau, trois cas** : **nageurs** (Crabot, Torpille) — ils y vont naturellement, en chasse comme en errance ;
  **au sec** (Relais) — il n'y met jamais une patte, même pour poursuivre, et contourne le lac ou renonce ; **les
  autres** — ils évitent l'eau en errance, mais la traversent pour **poursuivre la foreuse**. Une créature déjà
  dans l'eau peut toujours en sortir. Toutes y subissent −20 de défense ; aucune ne dérive (la dérive est propre à
  la foreuse) ; seuls les nageurs n'y sont pas ralentis.
- **Poursuite** : chaque ennemi qui chasse suit le plus court chemin. Si un autre ennemi bloque le passage, il
  contourne (détour de 10 cases au plus) vers une case libre autour de la foreuse au lieu d'attendre : plusieurs
  ennemis peuvent l'encercler et attaquer en même temps (jusqu'à 8). Un ennemi qui a vu la foreuse disparaître
  derrière une porte vient **jusque dans l'embrasure**, ce qui l'ouvre et lui rend la vue.
- **Diagonales comme dans Brogue** : un pas ou un coup en diagonale est **impossible si l'une des deux cases
  voisines orthogonales est une paroi** — on ne coupe pas les coins. Vaut pour la foreuse (« Coin de paroi »), tous
  les ennemis, le courant de l'eau profonde, les trajets automatiques et la génération. L'eau et les gouffres ne
  bloquent pas les diagonales. Dans le brouillard, le trajet ne tient compte que des coins déjà vus.
- **Mémoire** : un ennemi ne connaît la position de la foreuse que s'il la voit. Il retient l'endroit où il l'a
  vue ; quand il ne la voit plus, il s'y rend par le plus court chemin. Arrivé (ou bloqué 3 tours), il **fouille**,
  puis **oublie** et reprend sa patrouille. Un coup de foreuse le met au courant. État affiché : « en chasse »,
  « cherche », « fouille ».
- **Fouille** : il ratisse la zone pendant **20 battements**. Il se choisit un point accessible **à 7-13 cases du
  dernier point connu**, s'y rend, puis en choisit un autre. Les points sont toujours tirés **autour du dernier
  point connu**, jamais autour de lui : il tourne dans la zone au lieu de dériver. Bloqué 3 battements, il change
  de point. Pendant la fouille il peut vous **remarquer de nouveau** aux conditions ordinaires. Constantes
  `SEARCH_T`, `SEARCH_R`, `SEARCH_VAR`.
- **Repérage : un « ! »** blanc cerné de noir au-dessus de l'ennemi qui repère la foreuse ; un trait d'un pixel de
  tuile, qui monte de deux pixels et disparaît d'un coup après 0,9 s.

### Portée de discrétion

La détection appartient à la foreuse, pas aux ennemis. **Un seul rayon, le même pour toutes les espèces** : un
ennemi qui ne vous a pas repéré, situé dans ce rayon **et en ligne de vue**, a **25 % de chance par battement** de
vous remarquer (chance plate, sans effet de la distance — le choix de Brogue, pour la lisibilité).

Calcul, dans cet ordre : **base 10**, **×1,5 en brisant un rocher ou une montagne** (le bruit s'entend **à travers
les parois** : ce battement-là, un ennemi calme dans le rayon peut vous remarquer **même hors de vue**), **÷2 en
attendant sur place**, **÷2 sur des herbes basses** (arrondi au supérieur à chaque division), **−1 par 2 parois
adjacentes** (les 8 voisines ; rocher, montagne, mur, pilier ; **retrait limité à −2**, constante `WALL_MAX`),
**plancher 2**, puis **+ 2 en courant**.

Exemples : 10 en terrain dégagé, 8 le long d'une falaise, 5 sur des herbes basses, 5 en attendant, 3 en attendant
sur des herbes basses, 3 en attendant dans un recoin, 15 en brisant une paroi.

Un ennemi **déjà en chasse** vous garde en vue jusqu'à **2 fois** ce rayon ; **dès qu'il perd le contact visuel**
— ligne de vue coupée, ou au-delà de ce double rayon — il rejoint votre dernière position connue, y fouille, puis
oublie. **Perte de trace** : tant qu'il vous suit **hors du rayon** mais dans cette bande de chasse, il a **3 % par
battement** de perdre votre trace. Il garde sa dernière position connue et s'y rend, mais ne vous suit plus de
loin : il lui faut **vous remarquer de nouveau** à l'intérieur du rayon. Dans le rayon, il ne vous perd jamais.

Base réglable dans **Lab → Discrétion** (2 à 30, défaut 10), affichée dans la colonne sous **DIS** (ambre sous la
base, rouge au-dessus). Calcul partagé avec le jeu (`stealthCalc`). La fenêtre montre la base, la portée du moment,
le tableau des modificateurs et les règles liées. **Touche V** : affiche les cases d'où un ennemi pourrait vous
remarquer, entourées d'un **contour pointillé blanc**.

**Fenêtre Bestiaire** : à droite la liste des espèces en colonne ; à gauche **jusqu'à quatre espèces choisies**,
côte à côte dans un tableau, une ligne par statistique, pour les modifier et les comparer. La cinquième choisie
remplace la plus ancienne. **Enregistrer** écrit les valeurs dans la base de l'artefact.

## 8. Objectifs et progression

- **Un seul site de forage par carte**. Son marqueur (tuile « Site ») **reste le même une fois trouvé** (21 novembre 2026 : il ne se change plus en anneau chiffré, et la profondeur n'est plus affichée) ; en posant la foreuse dessus : « Site de forage détecté. [F] pour forer. ». Il est **dans la
  pièce la plus profonde** du complexe, la plus éloignée des entrées : traverser le bâtiment est l'objectif.
- **Forer** : touche F sur le site (ou clic sur la foreuse posée dessus) → barre « Forage en cours » d'une seconde,
  **Depuis le 22 novembre 2026, plus d'écran « FORAGE » intermédiaire entre les niveaux** : la descente en ASCII part tout de
  suite ; la barre ne reste que pour le dernier forage (le noyau) et en mouvement réduit.
  puis l'écran **« NOYAU ATTEINT »** (bilan en tours, cases parcourues, Matière) et **Nouvelle exploration**.
- **Éclats de métal** : **10 % des cases de montagne** (hors rangée extérieure ; réglage `ORE_PCT`) en contiennent.
  Briser la paroi les fait **tomber au sol** ; passer dessus les ramasse et regagne **autant de vie que d'énergie**
  selon la densité — **petits +10** (50 %), **moyens +15** (30 %), **gros +20** (20 %), sans dépasser les maximums.
  Deux chiffres flottants, et les deux effets visuels (croix rouges et flèches bio) partent ensemble.
- **Destruction d'un ennemi** : une **gerbe d'étincelles** (35 à 50) qui filent droit, très vite, avec une courte
  traîne, éteintes en un quart de seconde, et **14 à 22 débris de carcasse** projetés en l'air qui retombent,
  **rebondissent une ou deux fois**, puis **restent au sol** (sauf dans l'eau, un gouffre ou un obstacle). **Deux
  couleurs seulement, monde et accent.** Au plus 1 500 débris gardés sur la carte ; ils restent en souvenir
  (atténués) hors de vue. Pixel art strict, sans opacité.
- **Foreuse endommagée** : sous **50 PV** elle **fume** (grains gris opaques de 1 ou 2 pixels de tuile, qui montent
  en ondulant et disparaissent d'un coup, et restent sur place quand elle avance, comme une traînée) ; sous **20
  PV** la fumée double et de **petites flammèches** s'échappent de la coque.
- **Mort** : à 0 PV la foreuse **explose** — éclair blanc, secousse, détonation, ~520 éclats (accent et bio,
  quelques blancs, 2 à 5 px) qui retombent, **rebondissent**, ricochent sur les obstacles, tombent dans les
  gouffres et disparaissent d'un coup chacun à son heure ; ils restent dans la zone visible. Puis **« FOREUSE
  DÉTRUITE »** et deux boutons : **Déployer une nouvelle foreuse** et **Quitter**.
- **Déployer une nouvelle foreuse** (22 novembre 2026 ; avant « Nouvelle exploration », qui repartait sur la recette du
  menu Monde) : on repart **toujours du niveau 1** (recette « atterrissage », vaisseau compris), **cinématique d'arrivée
  comprise**, avec une foreuse neuve ; le menu Monde du joueur est remis tel qu'il était.
- **Quitter** : l'écran devient noir avec « SIGNAL COUPÉ », le son est coupé, un bouton discret « Rallumer »
  relance une exploration.
- **Aucune progression permanente** pour l'instant : c'est le grand chantier qui reste (§ 12).

## 8 bis. Bâtiments

Générateur dans `07b-batiments.js`, appelé après le relief, le vaisseau et le site, avant la roche dure et les
métaux. **Les structures recouvrent le terrain** (montagne, eau, herbes, gouffres naturels compris : sous une
pièce ils deviennent du sol, sous un mur du mur) ; seuls le vaisseau et le bord de carte sont évités.

- **Accrétion** (le principe de Brogue) : une première pièce, puis des pièces **collées contre un mur existant**
  avec une porte à la jonction, parfois au bout d'un **couloir** (2 à 5 cases, une fois sur quatre 7 à 14) ; on
  retire quand ça ne rentre pas. La structure obtenue est un arbre. Formes : rectangle, L, croix, ronde, hall
  long, caverne.
- **Pièces jamais trop étroites** : rectangles d'au moins 4 × 4, halls de 3 ou 4 cases de large, branches des L et
  barres des croix d'au moins 3. Les couloirs, eux, sont voulus étroits.
- **Boucles et longs couloirs** : depuis chaque sol on tire tout droit à travers le mur ; si l'on retombe sur le
  sol d'une autre pièce et que **le détour à pied dépasse le seuil du style** (12 à 26 pas, ou trois fois la
  longueur à percer), on perce — une porte si le mur fait une case, sinon **un couloir jusqu'à 19 cases** avec une
  porte à chaque bout. Peu de longs couloirs : un, plus un par tranche de sept pièces. Critère objectif : on ne
  crée que des raccourcis utiles.
- **Styles** : avant-poste (petites pièces, peu de boucles), hangar (grandes salles à piliers), complexe de forage
  (couloirs et enfilades), ruine (cavernes effondrées). Le style règle la taille des pièces, la part de couloirs,
  de piliers, de cavernes et le seuil des boucles.
- **Piliers** : dans les pièces rectangulaires, en croix ou rondes, tous les 2 ou 3 pas, jamais contre un mur ni
  devant une porte. Ils bloquent le pas et la vue, et comptent comme parois : **une salle à piliers rend plus discret**.
- **Portes d'entrée** : une à trois selon le nombre de pièces (deux à partir de 7, trois à partir de 16),
  éloignées les unes des autres, de préférence sur un dehors déjà praticable. **Si l'entrée donne sur de la roche,
  un couloir est percé** jusqu'au reste de la carte. Un terrain enfermé entre des murs devient du mur plein. Dans
  la recette `atterrissage`, le complexe n'a **qu'une porte**, du côté le plus enfoncé dans le massif.
- **Petites pièces** : une pièce de moins de 8 cases dont tous les passages sont des portes en perd une, remplacée
  par une ouverture (jamais une porte d'entrée).
- **Ouvertures sans porte** : part des passages intérieurs laissés ouverts (25 % par défaut) — on voit à travers,
  rien ne se referme. Les entrées gardent toujours une porte.
- **Portes verrouillées et clés** (0 à 3, 1 par défaut). Une porte n'est verrouillée que si elle est **le seul
  passage** vers ce qu'il y a derrière (au moins 6 cases) ; on choisit d'abord celle qui **enferme le site de
  forage**, sinon la plus petite réserve. Jamais une porte d'entrée. Les **clés sont posées au sol**, une par
  serrure, toutes pareilles, **là où l'on arrive sans rien ouvrir** — aucune impasse possible — de préférence à
  l'intérieur d'une structure et loin du départ. **La clé est un objet du sac** (21 novembre 2026) : plus de ligne « Clés » sous Statut ; on la ramasse comme un objet, elle prend une place
  d'inventaire (les clés s'empilent), on peut la jeter, et la porte la prélève dans le sac. Il n'y a **jamais plus de clés
  que de serrures**. Ouvrir fait tourner la clé (`SFX.serrure`).
- **Pièces secrètes** (0 à 3, 1 par défaut) : une pièce à **un seul passage** dont la porte est **dérobée** — elle
  a en tout point l'air d'un mur (dessin, fiche de survol, mini-carte) et se comporte comme tel. Jamais la pièce du
  site, jamais une entrée. S'il manque de culs-de-sac, une pièce de 3 × 3 à 5 × 4 est **creusée dans un massif de
  mur plein** ; s'il n'y a pas de massif non plus, la carte en a moins que demandé. **Aucune clé** dedans.
  **Découverte en se reposant** : chaque porte dérobée à **DET cases ou moins** a **25 % de chance par battement**
  d'apparaître ; elle devient une porte ordinaire, un « ! » la signale et le repos s'interrompt. Une charge
  sismique ouvre aussi le mur.
- **Les murs ne se percent pas à la foreuse** : seule la **charge sismique** les ouvre. Entrer dans une salle
  murée coûte donc un consommable rare.
- **Pas de gouffre à l'intérieur des pièces** pour l'instant : le code existe, désactivé par le drapeau
  `GOUFFRES_INT` (`07b-batiments.js`).

## 9. Interface

- **Pas d'écran d'accueil** : la partie commence directement, foreuse dans la soute. Le son s'active à la première
  touche ou au premier clic.
- **Barres de défilement** (22 novembre 2026) : 4 pixels, sans fond, couleur du texte secondaire (`--dim`), plus
  claires au survol ; « thin » sous Firefox. Ne pas poser `scrollbar-width` ou `scrollbar-color` sur un élément :
  Chrome les préférerait et rendrait la barre épaisse.
- Plein écran ; colonne noire à droite. **Son haut reste fixe** (22 novembre 2026) : barres Vie, Énergie, Matière,
  boutons, effets en cours et **Inventaire**. **Seul ce qui suit défile**, à la molette ou au doigt, sans barre de
  défilement. Le titre « Statut » a été retiré le même jour.
  Journal
  de bord sous la carte (5 lignes visibles, numéro de tour, ×N pour les répétitions). **Il défile** (22 novembre 2026) :
molette ou fine barre pour remonter jusqu'aux 200 derniers messages ; un nouveau message le ramène tout en bas. Un message
  trop long passe à la ligne, aligné après le numéro de tour.
- **Barres** (l'ancien Statut) : barres ASCII `█`/`░` — Vie en bio, Énergie en blanc (accent jusqu’au 22 novembre 2026 ; le « +N » d’énergie regagnée aussi, éclats de métal comme batterie) — suivies de leur valeur chiffrée. Le
  remplissage est un **calque de `█` découpé à la largeur exacte** posé sur un fond de `░`, donc juste à toute
  largeur de colonne et à toute taille de police.
- **En vue** (sous la Carte) : la fiche d'inspection de la case survolée, puis les créatures visibles (icône,
  barre de vie ASCII, colonnes TOUCHER / SUBIR colorées).
- **En tête de colonne, au-dessus de Vie** (22 novembre 2026 ; d'abord placées sous la mini-carte, remontées le soir
  même) : trois lignes en capitales couleur monde, sans étiquette — `NIVEAU 2 · −1564 M · 96×64` (le niveau, sa profondeur et la taille de la carte ; la
  profondeur vaut 0 au niveau 1, puis la fin de chaque descente, les mêmes chiffres que le compteur PROFONDEUR des
  cinématiques de forage, qui part de la profondeur du niveau quitté : `profNiv`, 14b), puis l'**archétype monde** et
  l'**archétype bâti** de la carte (« Personnalisé » s'il n'y en a pas).
- **Carte** (sous-menu repliable sous l'Inventaire, 22 novembre 2026) : la mini-carte. Elle **s'ouvre d'elle-même en mode
  carte (M)** et se referme en sortant, sauf si elle était déjà ouverte avant.
- **Mini-carte** pleine largeur ; ennemis en points rouges ; un clic recentre la vue ; bouton maintenu + glisser =
  défilement en temps réel. Saisie à l'intérieur, le cadre suit le pointeur sans sauter ; à l'extérieur, il se
  centre d'abord sous le pointeur.
- **Tile editor** (Lab) : encres sur deux lignes (22 novembre 2026) — les cinq couleurs de la palette (Monde, Bio, Accent,
  Danger, Bâti), puis Blanc, Noir, **Rouge fixe** (`R`, #d8180b, le même avec toutes les palettes) et Transparent.
  Nouveaux codes de tuile : `5` (bâti) et `R` (rouge fixe). Le texte d'explication en tête de la fenêtre a été retiré.
- Sous **REGEN · MONDE · LIFE**, une rangée **NIV1 · NIV2 · NIV3** (sortie du Lab le 22 novembre 2026), à 5 px.
- Sous-menus repliables : **Inventaire**, **Carte**, **Lab**, **Palette**, **Contrôles** (Palette sous Lab depuis le 22 novembre 2026 ; Carte sous Inventaire et Palette sous Lab à 5 px, les autres à 20) (Bestiaire,
  Groupes, Artefacts, Items, Discrétion, Tile editor, **Combat** — un lien qui ouvre le banc de combat dans un autre onglet, 22 novembre 2026), puis **Contrôles** sous Palette (22 novembre 2026 : l'aide des touches, sortie du Lab, une commande par ligne — la touche, puis ce qu'elle fait en dessous — en trois groupes : Se déplacer, Objets, Voir).

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
Machines ; Vaisseau (édité d'un bloc, 80 × 96 pixels) ; **FX** (22 novembre 2026, avant « Intro ») : les trois temps de
l'explosion (`boom0`, `boom1`, `boom2`), le rayon laser (`laserV`, l'horizontal en est la rotation), la case d'une croix
laser (`laserX`), puis les nuages de l'intro. Le rouge `r` des rayons s'affiche en jeu en rouge vif `#ff2a2a`, comme
avant. Le trait du laser des sentinelles, en biais, reste dessiné en code. Pas de barre de défilement horizontale. Les variantes suivent la tuile de base (4 orientations de la foreuse,
animaux tournés à gauche, 2ᵉ image de l'eau profonde).

Éditeur 16 × 16 : encres en pastilles — **Monde, Bio, Accent** (suivent la palette active), **Blanc**, **Noir**,
**Rouge** `#b8242a`, Gomme ; clic droit = effacer ; Miroir ↔ et ↕ (les deux = symétrie ×4) ; Contour auto, Vider,
**Rétablir l'enregistré**. Aperçu : la tuile en grand, puis en pavage ou posée sur le sol. Retouches mémorisées
dans `np-tiles` ; « Enregistrer » les écrit dans la base et en fait la nouvelle référence (`np-tiles-base`).
Codes des motifs : `.` transparent · `0` noir · `w` blanc · `r` rouge · `1` accent · `2` bio · `3` monde.

### Touches

ZQSD / flèches / pavé numérique : déplacer · A E W C : diagonales · Souris : survol = inspection, clic = y aller ·
X : inspection au clavier · R : courir / marcher · T : équipement · I : inventaire · O : exploration automatique ·
F : forer · Espace / 5 : attendre · P : repos · V : portée de discrétion · B : brouillard · ! : son · M : mode
carte (déplacements = défilement, Maj = plus vite, Échap ou M pour revenir ; Espace / 5 y attendent toujours, pour les
essais, sans bouger la vue — 22 novembre 2026).

## 10. Sauvegarde des réglages

Les réglages du joueur vivent dans le **`localStorage`** du navigateur (clés `np-*` : palettes, tuiles retouchées,
génération, groupes, artefacts, intro déjà vue) et dans la **base de l'artefact** (`reglages/courant`). **Ne pas
renommer ces clés.**

Au chargement, la base n'est relue que si elle est **plus récente que les retouches locales** (horodatage
`np-maj`, mis à jour à chaque changement). Sinon les réglages locaux sont conservés.

**L'utilisateur règle ses tuiles et ses stats dans l'artefact** : c'est la seule des trois versions dont la session
peut relire les réglages (sur GitHub Pages et dans la copie du disque, il n'y a pas de base). Quand il demande que
ses réglages deviennent ceux du jeu publié, les lire avec `db_get` sur `reglages/courant` et les recopier dans
`src/` : dessins dans `rows` des `BEASTS` et dans `PAT`, stats dans les `BEASTS`, couleurs dans `PRESETS`. **Ne pas
recopier** la configuration d'essai que la base contient aussi (génération, état de la partie).

## 10 bis. Cinématique d'intro

Vue de dessus du début à la fin, vaisseau nez vers le haut. Durée ≈ 11,6 s. Jouée au premier lancement
(`np-intro`) et, depuis le 21 novembre 2026, **à chaque nouvelle partie lancée par le joueur** (`nouvellePartie`,
appelée par « Nouvelle exploration » après la victoire et par le rallumage ; après la destruction de la foreuse,
`deployerForeuse` force en plus le niveau 1) : elle marque l'arrivée au niveau 1, comme la
cinématique de forage marque le passage au niveau suivant. Pas après une mise à jour de page en cours de partie,
pas si l'utilisateur a demandé moins d'animations. **Lab → Niv1** rejoue la scène puis lance un niveau 1 (recette « atterrissage ») aux réglages tirés au hasard ; **Lab → Niv2** joue la cinématique de forage puis lance un niveau 2 (recette « cavernes ») aux réglages tirés au hasard, la foreuse gardant ce qu'elle a. Dans les deux cas le menu Monde du joueur est remis tel qu'il était ; seule la taille de carte en est reprise (21 novembre 2026 ; avant, un bouton « Intro » rejouait l'arrivée sur la carte du menu). REGEN ne joue aucune cinématique. **Échap,
Espace ou Entrée** passe directement au posé.

- **Variations à chaque lancement** : descente de 5,9 à 9,3 s ; l'entrée dans l'atmosphère commence entre 5 et
  20 % de la descente, culmine entre 60 et 76 % et retombe en 10 à 24 % ; **2 à 6 éclairs** à rythme irrégulier
  autour du pic ; densité des nuages × 0,4 à × 1,7.
- **Hyperespace** : étoiles étirées en traînées blanches qui raccourcissent. Puis **la planète entre par le haut**,
  disque de 12 tuiles taillé dans une version réduite de la vraie carte (limbe assombri, liseré bio). **Le vaisseau
  ne s'arrête jamais** : les étoiles défilent encore (30 % de la vitesse) et il tangue jusqu'au posé.
- **Descente sans temps mort** : le zoom démarre à pleine vitesse et ralentit (courbe 1 − (1 − d)²) ; les tuiles
  gardent leur taille (32 px), le disque montre de plus en plus de cases jusqu'à l'échelle réelle, sans défilement.
- **Nuages procéduraux en tuiles** : 6 tuiles jointives éditables (Nuage plein, Nuage texturé, et quatre bords
  hachurés). Formes = union de disques couvrant 6 à 24 cases ; 5 couches de 8 à 11 nuages, plus 4 par couche autour
  du point d'atterrissage ; altitudes réglées pour que les couches sortent du cadre l'une après l'autre entre 60 et
  86 % de la descente. **Les tuiles ne sont jamais agrandies** : chaque tuile échantillonne la couche, donc un
  nuage vu de loin ne fait qu'une ou deux tuiles et se détaille en approchant. Parallaxe : altitude caméra
  Z = 0,2 + 30 (k − 1)², couche vue à kc = k / f avec f = Z / (Z − altitude). **Les nuages ne passent jamais sur le
  vaisseau** : chaque couche s'écarte autour de lui d'un rayon de vaisseau, sans trou.
- **Entrée dans l'atmosphère** : intensité qui monte en accélérant jusqu'à un **pic** à 70 % de la descente, puis
  retombe. Elle pilote le tremblement (jusqu'à 6 px), l'arc de plasma devant le nez (blanc → monde → rouge), des
  traînées le long de la coque, une teinte chaude sur le sol, une bordure rouge-orangé et un clignotement d'alerte
  au pic. **Éclairs en pixel art** : toute la hauteur de l'écran, grille d'un pixel de tuile, tronc tortueux par
  déplacement des points milieux, branches d'un pixel vers le bas, **tout en couleur accent**, opaques, qui
  clignotent au lieu de s'estomper. **Tonnerre** : claquement sec et craquements aigus, puis grondement grave de
  3,4 à 4,2 s qui roule par bouffées et s'assourdit.
- **Posé** : le vaisseau cesse de tanguer, rejoint sa place, rapetisse ; son ombre le rejoint, réacteurs coupés ;
  **poussière couleur monde** — les réacteurs soulèvent des grains dès la moitié du posé, puis gerbe de 650 grains
  à l'impact (2 à 3 px). Chaque grain a une hauteur : il retombe, **rebondit**, **ricoche sur les obstacles**,
  tombe dans les gouffres et **disparaît d'un coup** à son heure ; tout est retombé 1,35 s après l'impact. **Le
  brouillard de guerre ne se pose qu'une fois la poussière retombée**, puis fondu de 0,5 s. Raccord au pixel près
  avec la vue du jeu.
- **Performance** : la carte entière est pré-composée une fois (16 px par case) ; chaque tuile du sol n'est plus
  qu'une copie. Sur écran haute densité, l'intro est rendue à densité réduite puis agrandie sans lissage.

## 10 ter. Cinématique de forage (21 novembre 2026)

Pour le passage au niveau suivant. Vue **de côté**, tout en **caractères ASCII** (comme les dessins d'équipement),
environ 15 s ; `src/js/14b-forage.js`. **`playForage(suite, niv)`** la lance et appelle `suite()` à la fin (rien ne
l'appelle encore dans le jeu : la descente par niveaux, étape 4 de la refonte, doit s'y brancher) ; **F9** la lance pour
l'essayer. **Échap, Espace ou Entrée** la passent. Pas jouée si l'utilisateur a demandé moins d'animations.

- **Échelle** : caractères d'un 52ᵉ de la hauteur d'écran, comme à la seconde descente (22 novembre 2026 ; avant, un
  36ᵉ, trop zoomé). Le compteur **PROFONDEUR** part de la profondeur du niveau quitté (`profNiv`) : 0 → 1 564 m à la
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
- **Amas de Matière (22 novembre 2026, demande de l'utilisateur)** : à la première descente, **plusieurs amas irréguliers de
  20 caractères**, couleur accent. **Chaque caractère touché par le puits rapporte 1 de Matière.** Trois amas naissent près de
  la route (9 à 14 cases à côté : il faut tourner), six loin à gauche et à droite, hors d'atteinte, pour que le sous-sol ait
  l'air d'exister aussi sur les côtés. Maximum 60 par descente ; mesuré : 6 sans piloter, 54 en visant (`test-forage.js`).
  Avant, le même jour : un seul amas de 7 × 3, +20 d'un bloc.
- **Annonce en gros (22 novembre 2026)** : en haut de l'écran, entre le tableau de bord et la coupe (ni la foreuse ni le HUD ne
  sont couverts), dans un cadre à fond noir, rebord plein et bandes de chantier (dessin n° 3 de quatre proposés, `FG_ANN`).
  Le cadre paraît à 1 s ; les caractères défilent au hasard puis se figent de gauche à droite ; message complet à 2 s. De 4 s à 4,5 s il
  s'efface colonne par colonne, de gauche à droite, les caractères se remettant à défiler juste avant de partir. Le défilement
  n'emploie que des signes ASCII, des chiffres et des lettres ordinaires. Première descente : « MATIÈRE {µ} DÉTECTÉE / COLLECTE POSSIBLE » (couleur accent) ; seconde : « EXPLOSIFS DÉTECTÉS /
  ATTENTION SOUS-SOL PIÉGÉ ! » (rouge).

### Seconde descente : le mini-jeu des mines (21 novembre 2026)

Du niveau 2 au niveau 3, la descente se joue. `playForage(suite, 2)` ; Lab → **Niv3** ou Maj + F9 pour l'essayer.

- Caractères d'un 52ᵉ de la hauteur d'écran — **la même échelle aux deux descentes depuis le 22 novembre 2026** (la
  première, en 36ᵉ, était trop zoomée). La foreuse est tenue en haut de l'écran :
  on voit 0,7 écran devant elle. La descente est plus longue que la première et la foreuse répond
  plus vite aux commandes.
- Des **mines explosives** naissent juste sous le bas de l'écran, par rangées de plus en plus
  serrées. Sept sur dix sont visées sur la route de la foreuse ; une fois sur quatre, une seconde mine vient à côté.
  Une mine est un pavé plein de 7 × 3 caractères, rouge et blanc en alternance.
- Toucher une mine (elle saute dès qu'elle est dans le puits) coûte **12 points de vie** (`FG_MINE_DM`), de la vraie vie de la
  foreuse. **À zéro, la foreuse explose** : écran « FOREUSE DÉTRUITE », pas de niveau 3.
- Échap passe la scène contre **30 points de vie** (`FG_PASSE_DM`), sans jamais tuer. Espace et Entrée ne passent plus.
- **La vie restante est affichée pendant toutes les descentes**, la première comprise, sur un fond noir plein (le
  texte se lisait mal sur la roche). Le mini-jeu ajoute le compte des mines touchées et l'alerte « mine sur la route ».
- **Retouches du 21 novembre 2026, soir** (demande de l'utilisateur) : la descente dure **5 secondes de plus** (390 lignes,
  27 secondes environ ; les rangées de mines sont espacées de 17 à 25 lignes pour ne pas doubler les dégâts, 23 mines
  environ) ; **la roche dure du mini-jeu est en couleur bio** (le basalte était gris) ; **les commandes de direction sont
  inversées aux deux descentes** : la touche de gauche pousse la foreuse à droite, et l'inverse, au clavier comme au doigt.
- Mesuré après ces retouches (`outils/scripts/test-forage.js`, douze descentes par pilote) : sans diriger, 6,5 mines
  touchées et 75 points perdus, 4 foreuses détruites sur 12 ; pilote maladroit, 41 points ; pilote attentif, 6 points.

### Enchaînement dans le jeu (21 novembre 2026)

**La descente par niveaux est revenue**, sur `NIV_MAX = 2` niveaux pour commencer (`07-generation.js`).

- **Éboulis d'arrivée** (`eboulis()`, appelé par `niveauSuivant()`) : la foreuse a percé le plafond, des débris de roche
  sont éparpillés autour d'elle. Des **gravats** (praticables) serrés à son pied et de plus en plus rares jusqu'à
  5 cases, plus **un à trois rochers** à 2 à 4 cases, posés seulement là où leurs huit voisines sont libres (aucun
  passage ne peut être fermé). Rien sur l'eau, les gouffres, les bâtiments, les objets ni les créatures. Seulement à la
  descente : REGEN sur la recette cavernes n'en pose pas.
- `G.niv` porte le numéro du niveau ; le panneau affiche « Niveau N · largeur × hauteur ».
- **Forer le site du dernier niveau** gagne la partie comme avant (« NOYAU ATTEINT »). **Forer celui d'un niveau
  précédent** (`end`, `09-vision-deplacement-forage.js`) ferme l'écran de forage, joue la cinématique, puis appelle
  `niveauSuivant()`.
- `niveauSuivant()` : le niveau 2 est généré avec **la recette « cavernes » et les réglages que le joueur lui a
  donnés dans le menu Monde** (ceux gardés dans `GEN.rec.cavernes`, archétype bâti compris ; les valeurs de départ s'il n'y
  a jamais touché), quelle que soit la recette affichée dans le menu (`RECETTE_NIV`). La taille de carte, l'eau et
  l'herbe sont celles du menu. Lab → Niv2 et Niv3 tirent d'abord un archétype monde et un archétype bâti. Le
  menu Monde du joueur est remis en place aussitôt après. Avant le 21 novembre au soir, tout était tiré au hasard. Pas de
  vaisseau : on arrive par le puits. `genPlanet` refait l'objet `G`, donc ce que **la foreuse garde est remis en
  place juste après** : vie, énergie, inventaire, matière en réserve, tours et distance parcourue.
- **F9 reste** : il joue la cinématique seule, sans changer de niveau.
- La taille de la carte ne change pas d'un niveau à l'autre (elle s'applique au lancement).

## 11. Règles à ne pas casser

- **Pas de blindage, pas de réparation automatique.** La défense fait rater les coups, elle ne les réduit jamais.
- **Une nouvelle espèce s'ajoute à la fin de `BEASTS`** (§ 7).
- **Un objet ne change pas de clé** (`ITEMS`) : les plans connus, les capsules identifiées et les réglages de Lab → Items
  sont enregistrés sous ces clés.
- **Ne pas renommer les clés `np-*` ni `reglages/courant`** (§ 10). Renommer une tuile (clé de `PAT`) abandonne les
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
