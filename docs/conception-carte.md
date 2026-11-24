# Noyau Profond — conception : Carte et génération

Partie du document de conception (sommaire et règles à ne pas casser : `conception.md`). Les règles telles qu'elles sont aujourd'hui ; l'historique est dans `historique.md`, les chiffres dans `mesures.md`.

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
    **Couleur de l'eau** : dérivée de la couleur monde du biome (teinte −12°, clarté −8 ; `EAU` dans `02-palette.js`, `PAL['e']`) : un vert-bleu sombre. Les tuiles d'eau gardent le code `2`, lu comme `e` (`EAU_TUILES`).
- **Roche dure au cœur des massifs** : chaque case de montagne est durcie avec une chance qui monte avec sa
  **profondeur** dans le massif (distance au premier terrain qui n'est pas de la montagne, en 4 directions) : rien
  à une ou deux cases, puis 30 %, 65 %, 90 %, 100 %. Écorce tendre, cœur impénétrable. Posée **avant** les métaux,
  qui n'apparaissent jamais dedans.
    **Pas de crête sur la rangée du haut de la carte** (24 novembre 2026) : une case du bord haut est traitée comme prolongée
    vers le haut, donc elle porte le corps de la montagne et non la crête, qui laissait croire à un sommet au ras du bord.
    **La rangée extérieure de la carte est en roche dure.** **Dessin** : par défaut elle reprend celles de la montagne tendre (`mtBody`, `mtTop`, retouches comprises) en encre foncée (`PAL['d']` = couleur monde, clarté −16, `HARD_CLAIR`). La case dont le haut n'est pas de la roche dure porte la crête irrégulière, posée sur un fond de roche tendre (`softTopBg`) quand la case du dessus est de la montagne ou du rocher ; seule la partie au-dessus de la ligne de crête est un fond (`hardTopBg`, `softTopBg`). La crête d'une montagne tendre située sous de la roche dure se pose sur un fond de roche dure.
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
- `cavernes` (niveau 2) : **tout est sous roche**. Voir « Réseau de cavernes » plus bas.
- `base` (niveau 3) : **la grande base**. Voir « La grande base » plus bas.
- `classique` : la génération d'avant la refonte (terrain partout, une ou deux structures posées dessus).

**La descente compte trois niveaux** (`NIV_MAX`, `RECETTE_NIV`) : niveau 1 `atterrissage`, niveau 2 `cavernes`, niveau 3 `base`.
Forer le site du niveau 3 atteint le noyau. Chaque niveau est généré avec les réglages que le menu Monde garde pour sa
recette (le monde, colonne de gauche, est commun à toutes). Les boutons Lab → Niv1/Niv2/Niv3 tirent un archétype
monde et un archétype bâti au hasard.

`ENFOUI()` dit si la recette en cours a un complexe enfoui ; dans ce cas `GEN.structure` (« Surface bâtie ») ne compte pas.

Les pourcentages du menu Monde (eau, montagne, gouffre, herbe) valent pour la **zone extérieure** seule.

### Menu Monde par recette

Disposition (demande de l'utilisateur), de haut en bas :

1. **Recette de niveau**, sur toute la largeur ;
2. **Archétype monde** et **Archétype bâti**, côte à côte (voir « Archétypes monde et bâti ») ;
3. **Preset de niveau** : liste, nom, Enregistrer, Supprimer ;
4. **GÉNÉRER LA CARTE** : ferme la fenêtre et génère une carte avec les réglages en cours ;
5. un trait, puis les deux colonnes de réglages : à gauche le **monde**, à droite le **bâti** de la recette.

Chaque recette **déclare ses réglages**
dans `RECETTES[…].regl` : la colonne de droite se reconstruit au changement de recette et n'affiche que ceux-là.
Ajouter une recette, c'est ajouter une entrée à `RECETTES` ; le menu n'est pas à retoucher.

Une ligne de `regl` : `['num',clé,libellé,min,max,départ,[fourchette de hasard]]` ou
`['sel',clé,libellé,choix,départ,[valeurs tirables]]`. La fourchette finale n'est plus lue. La valeur en cours est dans `GEN[clé]` ; celles des autres recettes attendent
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

### Grain, regroupement et ambiances

Deux réglages de relief, colonne de gauche du menu Monde :

- **Grain** (`GEN.grain`, 0 à 100, départ 65) : taille des taches de montagne, de gouffre, d'eau et d'herbe.
  50 donne la taille d'avant ; 100 des masses (un grand lac, une chaîne) ; 0 un relief émietté.
- **Regroupement par régions** (`GEN.regroupe`, 0 à 100, départ 45) : chaque terrain a un champ d'affinité à grande
  échelle ; pour chaque tache, on tire jusqu'à dix emplacements et on garde celui où ce champ est le plus fort
  (`meilleurePlace`). À 0, les taches sont éparpillées comme avant.

### Archétypes monde et bâti

Deux listes, choisies
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
qui n'y servent pas. 

**Qui tire quoi** :
- **REGEN** et **GÉNÉRER LA CARTE** : les réglages en cours, tels quels. La carte prend **le niveau de sa recette**
  (`NIV_RECETTE` : cavernes 2, base 3, les autres 1), donc la faune (fenêtre LIFE) et les artefacts de ce niveau .
- **Lab → Niv1, Niv2, Niv3** : un archétype monde et un archétype bâti de la recette du niveau, tirés au hasard
  (`hasardReglages()`), puis le menu du joueur est remis en place.
- **La descente** en jeu : les réglages en cours du menu pour la recette du niveau.

**Presets de niveau** (`MONDES`, `np-mondes`) : la recette, les deux archétypes choisis et tous les curseurs des deux
colonnes, enregistrés sous un nom. La liste ne montre que ceux de la recette en cours ; recharger un preset rend la
recette, le monde et le bâti. La taille de la carte n'en fait pas partie.

**Règle** : tout réglage de génération ajouté plus tard va dans l'une des deux colonnes
(`MONDE_KEYS` à gauche, `regl` de la recette à droite), et **les archétypes de cette colonne doivent lui donner une
valeur** dès qu'il change leur caractère.

Outils : `outils/planche_cartes.py` (douze cartes côte à côte avec leurs mesures) et
`outils/scripts/mesure-ambiances.js` (quinze cartes par ambiance). Chiffres dans `docs/mesures.md`.

### Réseau de cavernes (`07e-cavernes.js`)

Recette `cavernes` (`zones`, `enfoui`, `cavernes`, `sansVaisseau`). Pas d'extérieur à ciel ouvert : la carte est une roche
pleine où l'on creuse. Ici `ZONE` vaut **0 dans les cavernes et les boyaux** et 1 dans la roche, si bien que `distExt()`
donne la distance à la caverne la plus proche. 

La génération, dans l'ordre :

1. **Secteurs** (`secteurs()`, `SECT`) : la carte est coupée en 6 à 18 zones aux frontières sinueuses (une pour 400 cases environ), chacune avec un rôle : **0 cavernes, 1 bâti, 2 roche pleine**. La place des cavernes et du bâti se déduit de « Part de cavernes » et de « Surface bâtie ». La **disposition** dit où vont les uns et les autres : mélangée, un côté chacun, cité au centre (bâti au milieu, cavernes en anneau), cavernes au centre, ou l'une des quatre au hasard.
2. **Cavernes** (`cavernes()`, `caForme()`) : chaque forme est un disque déformé par un bruit puis lissé. Posées les plus grandes d'abord, **dans les secteurs « cavernes », sans jamais se chevaucher**, à `cvEcart` cases de roche au moins les unes des autres. Leur nombre vient de la part demandée divisée par la taille demandée (30 au plus) ; une caverne qui ne tient nulle part est réduite.
3. **Complément** : les cavernes grossissent par leurs bords (lobes guidés par un bruit), sans sortir de leur secteur ni s'approcher d'une autre, jusqu'à la surface demandée.
4. **Boyaux** : arbre couvrant (Prim) entre les cavernes, puis `cvBoyaux` boucles et `cvCuls` culs-de-sac de 8 à 18 cases. Chaque boyau est le chemin le moins cher dans un bruit, **de bord de caverne à bord de caverne** ; la sinuosité règle le poids du bruit, et traverser un secteur bâti coûte cinq fois plus.
5. **Relief du sol** : montagne, gouffre, rochers épars, eau et herbe viennent de la colonne de gauche (`cvMont`, `cvGouf`, `cvRoc` : le « sol sous roche », réglé par l'archétype monde).
6. **Arrivée par un puits** : pas de vaisseau ; la foreuse débouche sur un carré de 3 × 3 sec, **toujours dans une caverne ou un boyau large**.
7. **Bâtiments enchâssés** (`batiments()`, mode `cav`) : chaque bâtiment part d'une graine dans un secteur bâti, loin des autres, et s'étale **sans sortir des secteurs bâtis**, à plus de 2 cases d'une caverne et de 3 du bord ; trois cases de roche séparent deux bâtiments, jamais reliés entre eux. « Pièces par bâtiment » est un **nombre visé** : la taille des pièces est ajustée (0,55 à 2 fois) pour tenir la surface, qui peut déborder d'un tiers. Chaque bâtiment a `cvPortes` portes, du côté de la caverne la plus proche.
8. **Boyau de porte** (`reliePortes()`) : de chaque porte à la caverne la plus proche, compté dans `G.tun` (jaune sur les planches). Si une porte n'atteint aucune caverne, la structure est refaite (douze essais).
9. Site de forage dans la pièce la plus profonde du plus grand bâtiment (`siteAuFond`) ; verrous, secrets, pièces secrètes et artefacts passent par le même code que le niveau 1.
10. **Contrôle** (`cvBilan()`, dans `niveau()`) : la carte est mesurée et comparée à ce que le tirage visait (`CVT`) ; trop loin, elle est refaite, et au bout de six on garde la meilleure. Le résultat (`G.obt`) s'affiche sous les réglages du menu Monde (« Carte en cours : 32 % de cavernes (visé 31) · 8 cavernes (8) · … »).

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

S'y ajoutent les réglages communs : archétype, ouvertures, verrous, secrets.

**Archétypes bâtis** (`AMBIANCES.cavernes`, `06-reglages.js` ; liste dans « Archétypes monde et bâti ») : un préréglage remet tous les curseurs `cv…` à leur valeur de départ puis pose les siens ; toucher ensuite à un curseur repasse sur « Personnalisé ». Le sol (montagne, gouffre, rochers) est réglé par l'archétype monde.

**Mesures** : `mesures.md` (section cavernes).

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
**Matière**, affichée sous les jauges. Elle se dépense au **fabricateur**.

### Sonar

**10 à 30 tours après l'arrivée** , la foreuse émet une **onde circulaire** qui balaie toute la carte : un cercle
d'un pixel de tuile, calé sur la grille, opaque, couleur accent, à 38 cases par seconde et pendant 2,6 s au moins.
L'onde se voit **aussi sur la mini-carte**, et un « blip blip » l'accompagne.

Elle **détecte tous les gisements** (métal et Matière) : chacun apparaît quand l'onde l'atteint, sur la carte comme
sur la mini-carte (bio pour le métal, accent pour la Matière), même en zone jamais vue et au cœur d'un massif. Le
journal donne le compte ; survoler ce qui est détecté dit ce que c'est et s'il faudra forer.

### Menus Monde et Life

Deux fenêtres, ouvertes par les boutons **MONDE** (le relief) et **LIFE** (la faune), à côté de **REGEN** (nouvelle carte, réglages en cours). Un preset de niveau ne décrit **que la génération**.

- **Monde** : voir « Menu Monde par recette ». **GÉNÉRER LA CARTE** ferme la fenêtre et génère aussitôt.
- **Life** : budget de menace, groupes et artefacts par niveau. Sous le budget, tout défile : la fenêtre ne dépasse jamais l'écran (la fenêtre Artefacts du Lab non plus). Ces réglages ne font partie d'aucun archétype ni preset : ils valent pour toutes les cartes jusqu'à ce qu'on les change.
- **Presets de niveau** (`np-mondes`, joints à l'enregistrement dans la base) : champ **Nom**, **Enregistrer** (sous un nom existant : met à jour), liste, **Supprimer**. Détail dans « Archétypes monde et bâti ».

### Banc de combat

Artefact à part (https://claude.ai/artifact/9BKRaoB4hzgdWhzYFx5A6q) : la page du jeu avec un panneau à la place de la colonne. On y choisit une carte de taille 1 (arène nue ou l'un des six reliefs d'essai), des ennemis, un équipement, une consigne de pilote automatique (chasse ou traversée), et l'on lance une **série** sans affichage (victoires, vie restante, points perdus, durée) ou **un combat à l'écran**. **Générer** pose la même arène et laisse jouer soi-même, inventaire plein (2 de chaque consommable, tous identifiés). Ouvert par le bouton **Combat** du Lab ; sert à régler les coûts de menace ; **à republier quand le moteur change**. Outillage : `CLAUDE.md`.

### La grande base (`07g-base.js`)

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
| **Antenne** | La foreuse l'active **en avançant dessus** (un battement). Elle ne lève le brouillard que **15 tours**, sur un **disque de 30 cases de large**, murs compris (découvert anneau par anneau) ; ensuite le brouillard revient, mais elle **continue de signaler les ennemis** du disque par un **point en couleur danger**, sur la carte et la mini-carte.  |
| **Pièces envahies d'herbe** | La pièce entière est couverte d'herbes hautes et basses mêlées par touffes (le site et les clés gardent leur sol). | 8 % / 18 % / 35 % des pièces |
| **Machines** | Dix machines hors d'usage (tuyaux, serveur, caisses, ordinateur, établi, cuve, générateur, console, turbine, armoire électrique), posées en **obstacles** : une à cinq par pièce choisie. **Elles barrent le pas mais pas la vue**, au contraire des piliers. Une charge sismique les réduit en gravats. | 15 % / 35 % / 60 % des pièces |
| **Terminal** | La foreuse l'active en avançant dessus : une fenêtre affiche **un texte** (huit fragments de journal, provisoires ; le temps ne passe pas). | 1 / 2 / 4 par carte |

- Trois terrains : `MACHINE`, `ANTENNA`, `TERMINAL`. Infranchissables pour tous, transparents à la vue, sans effet
  sur la discrétion. `G.art[case]` : la variante d'une machine, l'état d'une antenne, le texte d'un terminal.
- **Un obstacle ne coupe jamais un passage** : il n'est posé ni devant une porte ou une ouverture, ni là où il
  séparerait la pièce en deux. Antennes et terminaux vont de préférence contre un mur, les machines sept fois sur dix.
- Treize tuiles retouchables au Tile editor, groupe « Artefacts ».

### Deux règles de génération

- **Un gisement de métal ou de Matière ne touche jamais plus de 3 roches dures** (parmi ses 8 voisines) : `hideOre`
  ne retient que ces cases. Faute de place, sur une carte qui n'en offre pas assez, il reprend toute la roche tendre.
- **La zone dégagée autour du vaisseau est un ovale** (`SHIP_OVALE`), centré sur lui, avec une case de marge au moins
  autour de la coque. 

## 4. Terrains

| Terrain | Passage | Vue | Effet |
|---|---|---|---|
| Sol rocheux | oui | libre | texture « plaques rugueuses » (`conception-interface.md`) |
| Rocher | brisé en 2 coups | libre | laisse des gravats ; **trois dessins tirés à parts égales** (`rock`, `rock2`, `rock3`, 24 novembre 2026) |
| Montagne | brisée en 2 coups (sauf bord de carte) | bloquée | 10 % contiennent des éclats de métal |
| Roche dure | **indestructible à la foreuse** | bloquée | le cœur des massifs ; seule une **charge sismique** la brise. **Pas de métal** dedans |
| Eau peu profonde | oui | libre | −20 de défense ; **terrain lent : pas ×1,5**, sauf pour les nageurs |
| Eau profonde | oui | libre | −20 de défense ; **chaque pas a 50 % de chance de partir dans une autre direction** (si cette case est bloquée, la foreuse est plaquée contre l'obstacle et le tour passe) ; **attendre** y déplace d'une case au hasard ; **pas ×2**, sauf pour les nageurs. Seule la foreuse dérive : les créatures y nagent droit |
| Herbes hautes | oui | bloquée | **deviennent des herbes basses** au passage ; +12 de défense pour qui s'y trouve ; froufrou |
| Herbes basses | oui | libre | **portée de discrétion ÷ 2** : c'est le couvert du jeu |
| Fumée | oui | **bloquée** | nuage de fumigène : cache la vue des deux côtés, se dissipe en 15 à 25 battements (`conception-joueur.md`) |
| Gouffre | non | libre | — |
| Pont / gravats | oui | libre | — |
| Mur, pilier | non | bloquée | bâtiments : la foreuse ne les entame pas, la charge sismique les réduit en gravats ; comptés comme parois pour la discrétion. Le capteur ne devine pas la case derrière |
| Porte | oui | fermée : bloquée | **fermée tant que personne n'est dedans** ; s'ouvre quand la foreuse ou une créature s'y tient, se referme derrière. Pas de diagonale par une porte |
| Porte verrouillée | avec une clé | bloquée | un mur tant qu'elle est fermée, pour tous. **Avancer dessus avec une clé l'ouvre** (clé consommée, un battement) ; une charge sismique la détruit |
| Machine, antenne, terminal | non | libre | `conception-carte.md` |
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
- **Modules** (24 novembre 2026, **niveau 1 seulement**) : les morceaux dessinés dans Lab → Modules deviennent des
  **pièces du complexe**. La recette tire sans remise le nombre réglé (« Modules posés par carte ») parmi ceux qui la
  cochent et qui ont au moins une entrée ; chacun est tourné ou retourné au hasard.
  - **Pose en priorité** : le premier module tient lieu de **première pièce** du complexe ; les suivants se collent aux
    pièces déjà posées, parfois au bout d'un couloir de 2 à 5 cases. Un module qui ne trouve pas sa place est
    **abandonné** (la carte en reçoit moins), et la seconde moitié des essais se fait sans modules : la carte se
    génère toujours.
  - **Entrées** : on n'entre dans un module et on n'en sort **que par ses entrées**. Sur une **porte** du bord ou dans
    une **brèche du mur** (un mur de chaque côté), la case est le passage lui-même : porte, ou ouverture si c'était
    une brèche. Sur un sol du bord sans mur autour, la porte est créée juste dehors. **Une entrée qui ne sert pas est
    murée.**
  - **Le dessin est respecté** : ses murs ne sont jamais percés (ni raccourcis, ni porte d'entrée du complexe, ni
    pièce secrète creusée dedans), pas de piliers ajoutés, pas de porte retirée ou dérobée. Un sol au bord du module
    reçoit un mur juste dehors, comme toute pièce. Les **portes verrouillées** restent possibles sur ses entrées.
  - **Le site de forage** n'est jamais dans un module.
  - **Gouffre et pont** (24 novembre 2026) : un module peut contenir des cases Gouffre et des cases « Sol (pont) » ;
    le pont se dessine avec la tuile `solPont`, **retouchable à part** dans l'éditeur de tuiles (groupe du bâti) et
    utilisée par tous les ponts de bâtiment. Au départ, c'est le même dessin que le sol bâti. **En extérieur, un pont
    est du sol, et le gouffre lui fait le même rebord irrégulier qu'au reste de la berge** (rendu : un pont
    d'extérieur compte comme du sol pour la lèvre du gouffre, et porte la tuile du sol), comme tous les ponts naturels : un pont de module n'est « bâti » que
    si son gouffre touche du bâti du module (sol bâti, porte, pilier, mur, vitre).
  - **Mur vitré** (24 novembre 2026) : terrain `VITRE`, tuile `vitre` (retouchable, groupe du bâti). **Infranchissable
    comme un mur, mais on voit au travers, dans les deux sens** : la foreuse voit dehors, les créatures voient dedans.
    La foreuse ne l'entame pas ; la charge sismique le réduit en gravats. Il ne compte pas comme une paroi pour la
    discrétion. **Seuls les modules en posent** (pinceau « Mur vitré » de Lab → Modules) : la génération ordinaire
    n'en met nulle part. Dans un module, il vaut un mur : il ferme une brèche d'entrée comme un mur plein.
  - **Emplacements** : **Machine** = une machine de décor ; **Butin** = un consommable (6 fois sur 10) ou de la
    Matière ; **Ennemi** = une espèce tirée parmi les groupes du niveau, seule et sans patrouille. Un emplacement
    déjà occupé (clé, artefact, créature) est laissé tel quel.
  - Mesuré le 24 novembre sur les trois modules du joueur (15 cartes chacun) : posé 15 fois sur 15, site toujours
    atteignable. Code : `mdlTirage`, `mdlPrepare`, `accretion`, `mdlMachines`, `mdlRemplit` (`07b-batiments.js`) ;
    `G.mods` garde les modules posés.
- **Petites pièces** : une pièce de moins de 8 cases dont tous les passages sont des portes en perd une, remplacée
  par une ouverture (jamais une porte d'entrée).
- **Ouvertures sans porte** : part des passages intérieurs laissés ouverts (25 % par défaut) — on voit à travers,
  rien ne se referme. Les entrées gardent toujours une porte.
- **Portes verrouillées et clés** (0 à 3, 1 par défaut). Une porte n'est verrouillée que si elle est **le seul
  passage** vers ce qu'il y a derrière (au moins 6 cases) ; on choisit d'abord celle qui **enferme le site de
  forage**, sinon la plus petite réserve. Jamais une porte d'entrée. Les **clés sont posées au sol**, une par
  serrure, toutes pareilles, **là où l'on arrive sans rien ouvrir** — aucune impasse possible — de préférence à
  l'intérieur d'une structure et loin du départ. **La clé est un objet du sac** : plus de ligne « Clés » sous Statut ; on la ramasse comme un objet, elle prend une place
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

