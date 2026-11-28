# Noyau Profond — conception : Faune et bestiaire

Partie du document de conception (sommaire et règles à ne pas casser : `conception.md`). Les règles telles qu'elles sont aujourd'hui ; l'historique est dans `historique.md`, les chiffres dans `mesures.md`.

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
- **Lab → Groupes** : à gauche la fiche du groupe choisi (nom, valeur, styles de patrouille, case « actif », jusqu'à six espèces avec leur effectif, fréquence, Dupliquer, Supprimer) ; à droite la liste des groupes, qu'on réordonne en glissant ou par ↑ ↓. « Groupes par défaut » (deux clics) remet les groupes de départ. **Enregistrer** écrit groupes, valeurs et budget dans la base de l'artefact (`reglages/courant`, champ `groupes`).
- **LIFE** : budget et groupes par niveau (voir plus bas). Les boutons **Enregistrer** de Groupes, Bestiaire, LIFE et du Tile editor écrivent le même bloc dans la base de l'artefact (`reglages/courant`).
- Mémorisé dans le navigateur (`np-groupes`) et dans l'enregistrement des réglages.
- Les effectifs par espèce (`LIFE`, `spawnAnimals`, `spawnBeasts`) ne servent plus qu'au banc de combat et aux mesures.

### Lieux, densité et valeurs mesurées

- **Trois lieux** (`lieuDe`) : l'**extérieur** (terrain naturel, poches et cavernes comprises), le **bâti** (sol des bâtiments) et les **tunnels**. Le budget de chaque niveau est réparti entre eux (`GROUPES.niv[n].part`, fenêtre LIFE, en % du budget) : niveau 1 : 75 / 20 / 5 ; niveau 2 : 80 / 18 / 2 ; niveau 3 : 35 / 60 / 5 (extérieur / bâti / tunnels), ramenées à 100. Un lieu absent de la carte rend sa part aux autres ; un lieu ne reçoit jamais plus de **trois fois sa part de surface** (`PART_PLAFOND`).
- Chaque groupe déclare ses **lieux** (Lab → Groupes ; aucun coché : partout) et naît dans son lieu.
- Budget de départ **80** pour 96 × 64, rapporté à la surface ; il monte de **20 % par niveau** (`GROUPES.pente`).
- **Valeur d'un groupe = vie perdue au banc ÷ 4** (`outils/valeur_groupes.py`), avec un supplément pour ce que le banc ne voit pas : mines (explosion par surprise), relais (alerte), englueur (il empêche la fuite). Tableau dans `mesures.md`.
- **Référence du joueur** (relue le 21 novembre 2026, 23 h 39) : les vingt groupes de départ (`GROUPES_DEF`), leur ordre, valeurs, fréquences, patrouilles et lieux, et les groupes permis par niveau (`GR_NIV_DEF`) sont ceux qu'il a réglés dans l'artefact ; les valeurs sont les siennes, pas forcément celles du banc (Puces en groupes 10, Chasse à courre 7, Mines & Sentinelles 6, Large crabot groupe 7). Presque tous les groupes sont sans lieu imposé ; Banc de torpilles et Chasse à courre restent en extérieur, Essaim de drones en extérieur et bâti. Groupes permis : niveau 1, cinq (Crabots, Bande de relais, 1-2 Mines, Banc de torpilles, Puces en groupes) ; niveau 2, quinze ; niveau 3, les vingt. Artefacts : croix laser désactivée par défaut, ponts à levier et station de réparation au niveau 3 seulement, fabricateur aux niveaux 2 et 3 (`ART_NIV_DEF`). Palette Néon : `#ffa53a`, `#8fe6cf`, `#285e86`.
- Mesuré en taille 3 : 27, 34 et 37 créatures aux niveaux 1, 2 et 3 (`mesures.md`).

### Fenêtre LIFE : tout se règle par niveau de profondeur

De haut en bas : un **sélecteur de niveau** (1, 2, 3), puis pour ce niveau le **budget de
menace**, les **groupes possibles** et les **artefacts et machines possibles**. Les deux listes se règlent comme les
patrouilles d'un groupe : des étiquettes qu'on retire, un menu déroulant pour en ajouter. En dessous, la **répartition des ennemis** du niveau entre extérieur, bâti
et tunnels (% du budget).

- `GROUPES.niv[n] = {budget, gr:[noms]}`. Budgets de départ 80, 96 et 112 ; la « menace en plus par niveau » en % a
  disparu, chaque budget se règle à part. Un groupe n'est posé que s'il est actif (Lab → Groupes) **et** dans la liste du
  niveau.  Un groupe créé ou dupliqué est permis partout ; renommé ou supprimé, les
  listes suivent.
- `ARTEFACTS[k].niv` : niveaux où l'artefact peut apparaître (`artOn`). Départ : tourelles laser, piles et fabricateur à partir du
  niveau 2 ; croix laser, ponts à levier et station de réparation au niveau 3 ; tout le reste partout. La fréquence reste dans Lab → Artefacts.

### Styles de patrouille

 par le **groupe**, pas par l'espèce : un crabot peut faire la ronde dans un groupe et garder un
territoire dans un autre. Le sélecteur **ajoute** un style ; chaque style choisi s'affiche en étiquette, retirable.
**Si aucun n'est choisi, il est tiré parmi les huit.** Quand il y en a plusieurs, **chaque groupe posé sur la carte
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
- **Navette** : va-et-vient entre le point de départ et un point à 16-30 cases, halte de 2 à 5 battements à chaque bout.
- **Garde** : le groupe se poste près du point à garder le plus proche (site, porte verrouillée, grille, fabricateur, station, porte d'entrée) et ne s'en écarte pas de plus de 3 cases.

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
par battement au plus, quelle que soit la vitesse de l'espèce (un pas au calme dure donc `max(100, dpas)`).

Groupes de départ : puces en errance, crabot en ronde, relais en voyage, torpilles en ronde, broyeur en territoire,
mines à l'affût, sentinelle en sentinelle. Code : `patInit`, `patTick`, `patMove` dans `08-faune.js`, état dans `G.patr`.

## 7. Bestiaire

Les ennemis sont des **machines** : contour noir franc, blindage en couleur monde, **capteur rouge** à la place des
yeux, chenilles ou pattes rigides. Les clés internes gardent les anciens noms (`crabos`, `cafar`, `mastok`,
`brochon`, `paralyzor`), pour que les archétypes et les réglages enregistrés continuent de marcher.

**Pas** et **Coup** sont des durées, dans les unités de l'horloge (voir `conception-joueur.md`, 5 bis) : plus petit,
plus rapide. Elles ont remplacé la VIT le 25 novembre 2026 ; les paliers sont 50 · 75 · 100 · 150 · 200.

| Espèce | Pas | Coup | PV | DÉG | PRE | DEF | CRIT |
|---|---|---|---|---|---|---|---|
| Puce | 75 | 75 | 10 | 1-2 | 80 | 20 | 2 % |
| Crabot | 100 | 100 | 22 | 3-6 | 65 | 0 | 2 % |
| Relais | 75 | 100 | 10 | 2-4 | 50 | 10 | 2 % |
| Torpille | 75 | 100 | 14 | 4-5 | 80 | 20 | 2 % |
| Broyeur | 150 | 150 | 60 | 12-20 | 60 | 0 | 0 % |
| Mine | 50 | 100 | 18 | 20-30 (explosion) | — | 0 | 0 % |
| Sentinelle | 75 | 50 | 18 | 1 (laser, 2 cases) | 70 | 10 | 0 % |
| Bloqueur | 50 | 100 | 30 | 2-4 | 100 | 15 | 0 % |
| Artilleur | 75 | 200 | 14 | 4-7 (laser, 5 cases) | 65 | 5 | 0 % |
| Drone | 50 | 75 | 6 | 2-3 | 80 | 30 | 0 % |
| Soudeur | 125 | 100 | 16 | 1-2 | 60 | 10 | 0 % |
| Englueur | 100 | 100 | 18 | 2 (glu, 4 cases) | 75 | 10 | 0 % |

Ce sont les valeurs réglées en jeu par l'utilisateur et recopiées dans le code (dernière relecture : 28 novembre 2026, 2 h 10). Le pas du Soudeur, 125, sort des paliers : c'est le réglage du joueur, gardé tel quel. Une nouvelle espèce s'ajoute à la fin de la liste (`conception.md`).

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
  plus et **clignote**, puis **explose 2 à 3 battements plus tard** (**abattue à distance** — décharge de batterie, laser, onde sismique — **elle explose aussitôt** ; abattue **au contact par la foreuse**, elle éclate comme les autres sans exploser, 28 novembre 2026)  — **20 dégâts** dans un **carré de 3 × 3, plus 5 cases tirées
  au hasard parmi les 12 qui le bordent par un côté** (les coins du 5 × 5 exclus), à la foreuse et à
  toute créature qui s'y trouve. Les flammes se dessinent sur toute la zone, si bien qu'aucune explosion n'a la même forme. Détruite avant, elle n'explose pas ; elle n'a pas d'autre attaque.
  **L'explosion brise la roche et la montagne tendre** du carré : elles deviennent des gravats, et le
  métal ou la Matière qu'elles cachaient tombent au sol, sur toute la zone. **Elle détruit aussi les murs (vitrés compris), les portes
  (même verrouillées ou secrètes), les piliers et les machines** de sa zone (24 novembre 2026), qui deviennent des gravats : une mine
  attirée contre un mur ouvre un passage. Seule la roche dure tient : la charge sismique reste le seul moyen de l'entamer.
  L'animation pose sur chaque case du carré les tuiles **boom0** (éclair blanc), **boom1** (damier accent) puis
  **boom2** (braises monde), qui alternent avec une variante décalée pour crépiter ; elles se retouchent au Tile
  editor, groupe FX. **La charge sismique montre la même**.
- **Sentinelle** : **tire un laser jusqu'à 2 cases**, en ligne de vue, une fois par battement, jet pour toucher
  ordinaire. **Le trait rouge se voit toujours** : droit sur la foreuse s'il touche, à côté s'il rate ; il crépite
  puis s'éteint. Attention : « Sentinelle » est aussi le nom d'un style de patrouille.

### Cinq espèces ajoutées

Ajoutées à la fin de `BEASTS` (tuiles `bz6` à `bz10`, dessins de départ). Stats dans le Bestiaire.

| Espèce | Rôle | Capacité (`08-faune.js`) |
|---|---|---|
| **Bloqueur** (l'ancien Gardien) | Pas très rapide (50), coup normal (100), 30 PV, DEF 15, frappe à 2-4 | `bloque` : au contact il **agrippe la foreuse, qui ne peut plus se déplacer** (ni forer) tant qu'il vit ; trois rayons parallèles couleur bio, espacés d'un pixel, les relient en passant sous eux . Étourdi (batterie), il lâche. La clé reste `gardien` pour les groupes ; ses stats s'enregistrent sous `bloqueur` (`bk`). |
| **Artilleur** | Laser à 5 cases, 4-7 dégâts | `cadence:2` (un tir tous les deux battements), `recul:2` (s'écarte quand la foreuse est à 2 cases) |
| **Drone** | Pas et coup très rapides (50) : il charge et frappe deux fois par battement ; fragile, en essaim | `vol` : gouffres et eau ne l'arrêtent pas ; partage ce qu'il voit avec sa bande |
| **Soudeur** | Soutien | `soin:5`, `portee:4` : répare l'allié le plus abîmé à portée ; `recul:1` : fuit le contact |
| **Englueur** | Contrôle | `glu:4` : une **boule de glu** (tuile « glu », plus un trait de laser) tous les 3 battements englue la foreuse 3 battements (pas deux fois plus longs) ; **la foreuse engluée prend la couleur bio** ; garde ses distances |

 Essais : `outils/scripts/test-ennemis.js`.

### Comportements communs

- **Eau, trois familles** (25 novembre 2026 ; `eauLibre`, `terrestre`, `patBfs`, `sortEau` dans `08-faune.js`) :
  - **terrestres** (Broyeur, Relais, Mine, Sentinelle, Bloqueur, Artilleur, Soudeur, Englueur, Puce) : ils **ne naissent pas
    dans l'eau** et aucun **point de patrouille** n'y tombe. Ils y entrent pour **poursuivre la foreuse** ; en patrouille, ils ne la
    franchissent que si **aucun chemin à sec** ne mène à leur point ; calmes, ils **regagnent la terre la plus proche** et n'y
    restent pas. Dans l'eau ils sont **ralentis** (×1,5) et perdent **20 de défense**. Exception gardée : le **Relais** n'y met
    jamais une patte, même pour poursuivre (`sec`) ;
  - **aquatiques** (Torpille) : ils **ne naissent que dans l'eau** et n'en sortent pas ; **aucun malus d'eau** (avant : −20 de
    défense et ralentie, comme les autres) ;
  - **amphibies** (Crabot) : l'eau et le sol se valent, pour naître comme pour patrouiller (leurs points peuvent être dans l'eau) ;
    **aucun malus d'eau** (avant : −20 de défense).
  Le Drone vole : ni malus ni remous. Aucune créature ne dérive (la dérive est propre à la foreuse).
  **Remous** : dans l'eau, terrestres et amphibies portent le même remous que la foreuse (`wade`, `wadeDeep`) ; pas la Torpille.
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

