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
- **Palette à trois couleurs**, dans cet ordre dans le menu : **#1 Monde** (ambre `#ffa53a` : sol, rochers,
  montagnes), **#2 Bio** (bleu `#4fb8ff`), **#3 Accent** (turquoise `#8fe6cf`). Dans le code les clés sont `3`
  monde, `2` bio, `1` accent.
- 8 palettes prédéfinies, toutes modifiables (Origine, Phosphore, Mars, Glace, Néon, Rouille, Abysse, Ambre) ;
  Le sélecteur à 64 couleurs **reste ouvert après un choix** (21 novembre 2026), pour essayer plusieurs couleurs de suite ; on le ferme en recliquant sur la pastille ou avec Échap.
  sélecteur de 64 teintes (8 familles × 8 nuances) ; bouton « Rétablir ».
- Polices : Chakra Petch (titres), JetBrains Mono (interface).
- **Les dessins par défaut sont ceux de l'utilisateur**, retouchés au Tile editor et recopiés dans le code (bloc
  `TUILES_JOUEUR` à la fin de `03-tuiles.js`, qui passe après toutes les autres définitions).

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
  colonne, qu'on réordonne en glissant ou par ↑ ↓. La fenêtre rappelle le budget de la carte en cours et ce qu'il a
  acheté. « Groupes par défaut » (deux clics) remet les groupes de départ. **Enregistrer** écrit groupes, valeurs
  et budget dans la base de l'artefact (`reglages/courant`, champ `groupes`).
- **LIFE** (colonne de droite) : le budget et une case à cocher par groupe.
- Mémorisé dans le navigateur (`np-groupes`) et dans l'enregistrement des réglages.
- Les effectifs par espèce (`LIFE`, `spawnAnimals`, `spawnBeasts`) ne servent plus qu'au banc de combat et aux mesures.

### Styles de patrouille

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

- **Taille** : celle du menu Monde. Affichée en jeu sous le titre Statut (« Carte 96 × 64 »).
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
- `classique` : la génération d'avant la refonte (terrain partout, une ou deux structures posées dessus).

`ENFOUI()` dit si la recette en cours a un complexe enfoui ; dans ce cas `GEN.structure` (« Surface bâtie ») ne compte pas.

Les pourcentages du menu Monde (eau, montagne, gouffre, herbe) valent pour la **zone extérieure** seule.

### Menu Monde par recette

« Recette de niveau » est le premier choix, en haut, sur toute la largeur. Chaque recette **déclare ses réglages**
dans `RECETTES[…].regl` : la colonne de droite se reconstruit au changement de recette et n'affiche que ceux-là.
Ajouter une recette, c'est ajouter une entrée à `RECETTES` ; le menu n'est pas à retoucher.

Une ligne de `regl` : `['num',clé,libellé,min,max,départ,[fourchette de hasard]]` ou
`['sel',clé,libellé,choix,départ,[valeurs tirables]]`. La fourchette finale sert à la case « Réglages au hasard » ;
absente, le réglage n'est pas tiré. La valeur en cours est dans `GEN[clé]` ; celles des autres recettes attendent
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

**Case « Réglages au hasard »**, sous le bouton REGEN. Cochée, REGEN tire d'abord tous les réglages du menu Monde,
puis génère ; le menu se met à jour, donc on voit ce qui a été tiré et on peut repartir de là. Chaque réglage a sa
fourchette de tirage, plus étroite que ses bornes : le hasard ne doit jamais rendre une carte sans intérêt. Sont
laissés tels quels la **taille de la carte** et les réglages dont 0 veut dire « automatique » (pièces par
structure, portes d'entrée). Le relief est tiré avec un biais vers le bas (plafonds `HASARD_REL` : eau 30,
montagne 30, gouffre 12, herbe 45). État mémorisé dans `GEN.hasard`. Code : `hasardReglages()`, `06-reglages.js`.

### Réseau de cavernes (`07e-cavernes.js`)

Recette `cavernes` (`zones`, `enfoui`, `cavernes`, `sansVaisseau`). Pas d'extérieur à ciel ouvert : la carte est une roche
pleine où l'on creuse. Ici `ZONE` vaut **0 dans les cavernes et les boyaux** et 1 dans la roche, si bien que `distExt()`
donne la distance à la caverne la plus proche et que les pourcentages de relief (eau, montagne, gouffre, herbe) valent
pour le sol des cavernes.

- **Cavernes** (`cavernes()`) : `cvNb` blobs irréguliers (automate cellulaire, `caBlob`), posés le plus loin possible
  des précédents, pour une surface totale `cvPart` % de la carte. Le nombre est le curseur « peu de grandes ↔ beaucoup
  de petites » ; chaque blob est un poids tiré entre 0,6 et 1,4.
- **Boyaux** : arbre couvrant (Prim) entre les centres, de 1 à 2 cases de large, sinueux (marche qui penche vers
  la cible) ; puis `cvBoyaux` boucles entre cavernes voisines non reliées, et 1 à 3 culs-de-sac de 8 à 18 cases.
- **Arrivée par un puits** : pas de vaisseau, la foreuse débouche sur un carré de sol sec de 3 × 3 (chemin déjà là pour
  `SANS_VAISSEAU`). Le message d'arrivée est celui de la descente.
- **Bâtiments enchâssés** (`batiments()`, mode `cav`) : `cvBati` bâtiments (± 1 au tirage, 4 au plus, au moins deux quand
  on en demande deux) se partagent `cvSurf` % de la carte (visée : la roche disponible plafonne le résultat, 8 à 12 %
  en pratique). Le lot est toute la carte : le bâtiment s'étale là où la roche est assez épaisse, à plus de 2 cases
  d'une caverne et à plus de 3 cases du bord ; trois cases de roche séparent deux bâtiments. Chaque bâtiment a **une
  porte** (deux si l'emprise dépasse 170 cases), du côté de la caverne la plus proche (`entrees(…, proche)`).
- **Boyau de porte** (`reliePortes()`) : de chaque porte à la caverne la plus proche, chemin le moins cher dans un bruit,
  loin des autres bâtiments ; il compte dans `G.tun` (jaune sur les planches). Si une porte n'atteint aucune caverne, la
  structure est refaite (douze essais).
- Le site de forage est dans la pièce la plus profonde du plus grand bâtiment (`siteAuFond`). Verrous, secrets, pièces
  secrètes et artefacts passent par le même code que le niveau 1.

Réglages (centre autour duquel la carte varie à chaque tirage) :

| Réglage (clé) | Bornes, départ | Tirage |
|---|---|---|
| Part de cavernes (`cvPart`) | 20 à 55 %, 36 | ± 12 % de la valeur ; 18 à 60 % au final |
| Nombre de cavernes (`cvNb`) | 1 à 12, 6 | ± 25 % |
| Boucles entre cavernes (`cvBoyaux`) | 0 à 4, 2 | ± 20 % |
| Nombre de bâtiments (`cvBati`) | 1 à 4, 2 | ± 30 %, au moins 60 cases chacun |
| Surface bâtie (`cvSurf`) | 6 à 30 %, 14 | ± 15 % |

S'y ajoutent les réglages communs : archétype, pièces, ouvertures, verrous, secrets. **Limites connues** : les
bâtiments se logent surtout en périphérie, là où la roche est épaisse ; sur les petites cartes (taille 2), un seul
bâtiment, parfois aucun ; la faune (étape 3) n'est pas encore répartie par lieu. Mesure : `outils/scripts/mesure-cavernes.js` ;
vue d'ensemble : `outils/scripts/cavernes.js`.

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
**Matière**, affichée sous les jauges. Elle servira à construire de l'équipement ; elle ne sert encore à rien.

### Sonar

**10 à 20 tours après l'arrivée**, la foreuse émet une **onde circulaire** qui balaie toute la carte : un cercle
d'un pixel de tuile, calé sur la grille, opaque, couleur accent, à 38 cases par seconde et pendant 2,6 s au moins.
L'onde se voit **aussi sur la mini-carte**, et un « blip blip » l'accompagne.

Elle **détecte tous les gisements** (métal et Matière) : chacun apparaît quand l'onde l'atteint, sur la carte comme
sur la mini-carte (bio pour le métal, accent pour la Matière), même en zone jamais vue et au cœur d'un massif. Le
journal donne le compte ; survoler ce qui est détecté dit ce que c'est et s'il faudra forer.

### Menus Monde et Life

Deux fenêtres, ouvertes par deux boutons sous la mini-carte, à côté de **REGEN** : **MONDE** (le relief) et
**LIFE** (la faune). Un archétype de monde ne décrit **que la génération**.

- **REGEN** génère une nouvelle carte avec les réglages en cours.
- **Monde** : à gauche taille, eau, montagne, gouffre, herbe, méthode de relief, remplissage, itérations ; à droite
  les réglages de la recette. En bas, **GÉNÉRER LA CARTE** ferme la fenêtre et génère aussitôt.
- **Life** : budget de menace et groupes actifs. Ces réglages **ne font partie d'aucun archétype** : ils valent
  pour toutes les cartes jusqu'à ce qu'on les change.
- **Archétypes de monde** : en tête de la fenêtre Monde, un champ **Nom** et **Enregistrer** gardent **les seuls
  réglages de génération** sous ce nom ; la liste déroulante les recharge ; **Supprimer** retire l'archétype
  choisi. Enregistrer sous un nom existant le met à jour. Mémorisés sous `np-mondes` et joints à l'enregistrement
  dans la base. Ils ne portent ni la recette ni les réglages « z… ».

### Banc de combat

Artefact à part (https://claude.ai/artifact/9BKRaoB4hzgdWhzYFx5A6q) : la page du jeu, plus un panneau qui remplace
la colonne. On y choisit une carte de taille 1 (arène nue ou l'un des six reliefs d'essai), des ennemis, un
équipement, une consigne de pilote automatique (chasse ou traversée), et l'on lance une **série** sans affichage
(moyennes : victoires, vie restante, points perdus, points perdus par ennemi tué, durée) ou **un combat à l'écran**.
Options : ennemis en alerte, vie d'essai. Onglets « Mes résultats » (gardés dans le navigateur) et « Archives »
(un clic sur une ligne reprend la configuration). Il sert à régler les coûts de menace ; **à republier quand le
moteur change**, sinon il mesure l'ancien jeu.

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
| **Antenne** | La foreuse l'active **en avançant dessus** (un battement) : elle **reste allumée** et tient en vue un **disque de 30 cases de large** autour d'elle, murs compris — le brouillard n'y revient pas, où que soit la foreuse, et les créatures qui s'y trouvent se voient. | une carte sur deux / 1 / 2 par carte |
| **Pièces envahies d'herbe** | La pièce entière est couverte d'herbes hautes et basses mêlées par touffes (le site et les clés gardent leur sol). | 8 % / 18 % / 35 % des pièces |
| **Machines** | Dix machines hors d'usage (tuyaux, serveur, caisses, ordinateur, établi, cuve, générateur, console, turbine, armoire électrique), posées en **obstacles** : une à cinq par pièce choisie. **Elles barrent le pas mais pas la vue**, au contraire des piliers. Une charge sismique les réduit en gravats. | 15 % / 35 % / 60 % des pièces |
| **Terminal** | La foreuse l'active en avançant dessus : une fenêtre affiche **un texte** (huit fragments de journal, provisoires ; le temps ne passe pas). | 1 / 2 / 4 par carte |

- Trois terrains : `MACHINE`, `ANTENNA`, `TERMINAL`. Infranchissables pour tous, transparents à la vue, sans effet
  sur la discrétion. `G.art[case]` : la variante d'une machine, l'état d'une antenne, le texte d'un terminal.
- **Un obstacle ne coupe jamais un passage** : il n'est posé ni devant une porte ou une ouverture, ni là où il
  séparerait la pièce en deux. Antennes et terminaux vont de préférence contre un mur, les machines sept fois sur dix.
- Treize tuiles retouchables au Tile editor, groupe « Artefacts ».

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

Version d'essai : tous les objets sont donnés au départ, non équipés sauf la foreuse et la Coque d'usine.

- **Emplacements** : 1 arme, 1 armure, 3 accessoires. **Il y a toujours une arme en main** : on ne peut ni la
  retirer ni la jeter, seulement la remplacer. **Toute arme fore la roche pareil** : l'arme ne change que le
  combat et le visuel.
- **Deux endroits, un seul sac** : la fenêtre **Équipement** (armes, armures, accessoires) et le sous-menu
  repliable **Inventaire** de la colonne (les consommables : nom, nombre, **USE**, **[X]**).
- **Dix places** dans l'inventaire, **une par sorte** quel que soit le nombre d'exemplaires. Ramasser une sorte
  nouvelle quand les 10 places sont prises est refusé et **l'objet reste au sol**. **[X] jette UN exemplaire au sol**,
  sur une case libre voisine (21 novembre 2026 ; avant, il détruisait la pile) : la place se libère quand le dernier exemplaire est jeté.
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
| Charge sismique (×2) | consommable | – | **visée** : 3 × 3 à placer jusqu'à 4 cases, **30 dégâts** ; bruyante |

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
- Sous Statut, « Dans la fumée N » tant que la foreuse y est.

**Charge sismique : une visée.** L'utiliser n'explose pas tout de suite : un **carré de 3 × 3 rouge** s'ouvre une
case devant la foreuse. On le déplace à la souris ou aux touches de direction, sans que la foreuse bouge, dans un
**rayon de 4 cases** (butée nette). **Entrée** ou un **clic** tire : **30 dégâts** à chaque créature des neuf
cases, et **la roche vole en éclats** — rocher, montagne, **roche dure**, murs, piliers, portes verrouillées et
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
  plus et **clignote**, puis **explose 1 à 3 battements plus tard** — **20 dégâts** dans un **carré de 3 × 3** à la
  foreuse et à toute créature qui s'y trouve. Détruite avant, elle n'explose pas ; elle n'a pas d'autre attaque.
  L'animation est un carré de 3 × 3 en pavés fins de 2 pixels (blanc plein, damier accent, braises couleur monde) ;
  **la charge sismique montre la même**.
- **Sentinelle** : **tire un laser jusqu'à 2 cases**, en ligne de vue, une fois par battement, jet pour toucher
  ordinaire. **Le trait rouge se voit toujours** : droit sur la foreuse s'il touche, à côté s'il rate ; il crépite
  puis s'éteint. Attention : « Sentinelle » est aussi le nom d'un style de patrouille.

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

- **Un seul site de forage par carte**, de profondeur 10 (valeur affichée, sans effet de jeu). Il est **dans la
  pièce la plus profonde** du complexe, la plus éloignée des entrées : traverser le bâtiment est l'objectif.
- **Forer** : touche F sur le site (ou clic sur la foreuse posée dessus) → barre « Forage en cours » d'une seconde,
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
  DÉTRUITE »** et deux boutons : **Nouvelle exploration** et **Quitter**.
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
- Plein écran ; colonne noire à droite, défilable à la molette ou au doigt mais sans barre de défilement ; journal
  de bord sous la carte (5 dernières lignes, numéro de tour, ×N pour les répétitions).
- **Statut** : barres ASCII `█`/`░` — Vie en bio, Énergie en accent — suivies de leur valeur chiffrée. Le
  remplissage est un **calque de `█` découpé à la largeur exacte** posé sur un fond de `░`, donc juste à toute
  largeur de colonne et à toute taille de police.
- **En vue** (sous la mini-carte) : la fiche d'inspection de la case survolée, puis les créatures visibles (icône,
  barre de vie ASCII, colonnes TOUCHER / SUBIR colorées).
- **Mini-carte** pleine largeur ; ennemis en points rouges ; un clic recentre la vue ; bouton maintenu + glisser =
  défilement en temps réel. Saisie à l'intérieur, le cadre suit le pointeur sans sauter ; à l'extérieur, il se
  centre d'abord sous le pointeur.
- Sous-menus repliables : **Inventaire**, **Génération** (+ REGEN), **Life**, **Palette**, **Lab** (Bestiaire,
  Groupes, Artefacts, Discrétion, Tile editor, Intro, aide des touches).

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

Liste des tuiles éditables par groupe : Viseur ; Foreuse et faune ; Terrain ; Objets ; Artefacts ; Intro ;
Vaisseau (édité d'un bloc, 80 × 96 pixels). Les variantes suivent la tuile de base (4 orientations de la foreuse,
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
carte (déplacements = défilement, Maj = plus vite, Échap ou M pour revenir).

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

Vue de dessus du début à la fin, vaisseau nez vers le haut. Durée ≈ 11,6 s. Jouée **au premier lancement
seulement** (`np-intro`), pas après une mise à jour de page en cours de partie, pas si l'utilisateur a demandé
moins d'animations. **Lab → Intro** génère une nouvelle planète et rejoue la scène ; REGEN ne la joue pas. **Échap,
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

- **Foreuse** : 15 lignes sur 11 colonnes (`FG_ART`, couleurs par `FG_MSK`, tirées de la palette en cours), nez vers le
  bas, 42 % de la hauteur de l'écran. Le foret tourne en alternant `▓`/`▒` ; la pointe clignote.
- **La roche n'est pas en bandes** : c'est un champ en deux dimensions (`fgMat`). Un bruit de valeur lissé, **étiré à
  l'horizontale**, donne des lentilles larges et plates qui s'interpénètrent ; un deuxième bruit sème des **masses de
  roche dure** dedans (environ 9 % du volume au niveau 1). Les limites de matière ondulent au lieu d'être droites.
- **Un profil par niveau** (`FG_NIV`) : matières de fond selon la profondeur, matière dure semée, seuil, entremêlement.
  **Niveau 1 : terre meuble, argile, roche, quelques masses de roche dure** — rien de plus. Filon, basalte, cristaux et
  noyau dense (`FG_MAT`) sont réservés aux profils des niveaux plus bas, esquissés mais pas encore réglés.
- **Pivoter et contourner** : la foreuse sonde la dureté 9 lignes devant elle, à gauche et à droite. Au-delà de 1,5 elle
  glisse vers le côté le plus tendre, prend un angle et contourne la masse ; le bandeau affiche « masse dure devant ».
- **Diriger** : **flèches gauche et droite**, ou maintenir le doigt d'un côté de l'écran. Vitesse latérale bornée à
  15 colonnes par seconde. Mesuré : sans rien faire, la foreuse traverse 6 % de roche dure contre 9 % en ligne droite.
- **Vitesse** : inversement proportionnelle à la dureté sous la pointe ; la poussée monte après 6 s pour que la descente
  ne traîne pas. Plus c'est dur, plus elle tremble, grince et crache d'étincelles.
- **Le puits garde la trace du chemin** (`F.tr`, un centre par ligne) : il se courbe, la foreuse **épouse cette courbe**
  (chaque ligne du dessin suit la trace), et les éclats rebondissent sur les parois.
- **Fin** : la foreuse perce le plafond d'une caverne (34 lignes, stalactites), tombe (alerte « perte de support »),
  s'écrase (flash, grand tremblement, poussière, éclats, étincelles), rebondit, puis fondu au noir.
- **Bandeau** : niveau, profondeur, matière, dureté, cap, rotation, et une coupe des matières à droite.
- **Son** : synthétisé, sans fichier (moteur, grincement haché par la rotation, grondement ; impacts de roche,
  changement de matière, fracas du plafond et de l'impact).
- **Vérification** : `python3 outils/forage.py DOSSIER [t1 t2 …]`. Mesuré le 21 novembre 2026 : 62 images par seconde.

## 11. Règles à ne pas casser

- **Pas de blindage, pas de réparation automatique.** La défense fait rater les coups, elle ne les réduit jamais.
- **Une nouvelle espèce s'ajoute à la fin de `BEASTS`** (§ 7).
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
