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
| **Pont à levier** | Le **gouffre prend presque toute la salle**, d'un mur à l'autre ; il ne reste qu'une bande de sol (une ou deux cases) à chaque bout. Le levier est **au pied du pont**, du côté d'où l'on vient. Deux cas seulement : le pont est le **seul chemin** vers le site, ou l'autre rive est un **cul-de-sac avec un butin** (Matière). Si les deux rives se rejoignent par ailleurs, la salle n'est pas retenue. Une fois sur trois, un socle remplace le levier. **Le pont n'est pas forcément droit** (26 novembre 2026) : il avance d'une colonne à la suivante et peut se décaler d'une ligne en chemin, le coude posé pour qu'il reste d'un seul tenant ; il lui faut seulement partir d'une rive et atteindre l'autre. Mesure sur 30 cartes de niveau 3 : 37 ponts, 20 avec virage, 17 droits, 5,3 cases en moyenne. **Il se déploie planche par planche**, depuis la rive du levier, une case toutes les 70 ms, avec un claquement par planche : seul le dessin est retardé, le pont est franchissable dès l'instant où le levier est actionné. |
| **Pile énergétique** | La foreuse la pousse en avançant dessus, jamais en diagonale, sur sol libre ; **elle passe les portes**. Posée sur son **socle**, elle alimente ce qui y est relié ; retirée, tout se referme. Elle arrête les lasers. |
| **Distributeur de pile** (l'ancien chargeur) | **La pile attend à côté de lui.** Avancer dessus la rappelle à cette place : une pile coincée ne bloque rien pour de bon. |
| **Socle** | Posé **près de ce qu'il alimente** : devant la grille (2 à 4 pas), ou au pied du pont. La pile et son distributeur sont à 6-18 pas, dans une pièce voisine quand il y en a une. |
| **Grille d'énergie** | Ferme l'unique entrée d'un **dépôt** (trois blocs de Matière, deux capsules ou une capsule et un équipement ; jusqu'au 28 novembre 2026, un plan au lieu de deux des blocs). Elle ne garde jamais le chemin du site. |
| **Salle piégée** | Un butin au milieu de la pièce (équipement, capsule, Matière ; plus de plan depuis le 28 novembre 2026) ; 8 à 16 **relais cachés dans des niches** (moins si les murs manquent de place) des murs (tuile « niche », visible : le piège se lit). Ramasser l'appât les fait surgir, déjà en chasse. Ils ne lâchent rien. L'exploration automatique ne touche pas à l'appât. |
| **Vitrines** | Un banc **bâti contre un mur de la pièce**, **trois niches côte à côte séparées par des murs vitrés** — `[niche][vitre][niche][vitre][niche]` — un lot dans chacune (trois blocs de Matière — un plan jusqu'au 28 novembre 2026 —, un équipement, deux capsules) : **on n'en emporte qu'un**, les deux autres se verrouillent. Idée des coffres de Brogue. Refaites le 26 novembre 2026 d'après le module « Vitrine REF » du joueur : avant, c'étaient trois socles éparpillés dans la pièce, sans une seule vitre, et rien ne disait que c'était un choix. Le banc fait **deux rangées** : les niches contre le mur du fond, puis **une porte devant chacune**, les cloisons vitrées traversant les deux rangées. Ses deux bouts sont soit bâtis, soit des murs de la pièce déjà là (renfoncement de cinq, coin de six, banc de sept) ; la pièce peut avoir **jusqu'à deux entrées** et compter jusqu'à 120 cases. Ces quatre combinaisons, essayées le 26 novembre, font passer la vitrine de **1 carte sur 10 à 1 sur 3** ; n'essayer que le renfoncement et le banc complet la rendait introuvable. **L'exploration automatique ne les traverse pas et s'arrête dès qu'elle en voit une** : marcher sur une niche prendrait le lot et condamnerait les deux autres, le choix revient au joueur. |
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
- Une charge sismique ou l'explosion d'une mine (24 novembre 2026) détruit tourelle, pylône, grille, levier, station, chargeur et fabricateur, ainsi que les murs, les piliers et les portes.
- État dans `G` (sauvegardé) : `G.mt`, `G.las`, `G.lz`, `G.circ`, `G.soc`, `G.piles`, `G.pieges`, `G.niche`, `G.choix`, `G.vit`. `accesSite()` dit si le site reste
  atteignable, leviers et socles compris.

Essais : `outils/scripts/test-machines.js` (33 vérifications dans le vrai moteur).

### Terminaux et antennes : le menu (`07i-terminaux.js`, 28 novembre 2026)

Avancer sur un terminal, un enregistreur d'épave ou une antenne ouvre une fenêtre (le jeu attend) : menu à gauche, sortie
de la machine à droite. Clavier (flèches, ZQSD, pavé ; Entrée ; Échap), souris, doigt (lignes de 44 px). L'exploration
automatique ne l'ouvre jamais (les machines barrent le pas).

| Entrée | Terminal | Enregistreur d'épave | Antenne |
|---|---|---|---|
| **DATA** | une donnée tirée sans choix (`dataTirer`, 14k) pour le journal de bord : voir plus bas | un texte d'enregistreur au numéro de l'épave | un palier de fiche de robot, ou le relevé du site (signatures, formations, épaves, cap du site) |
| **CONNEXION** | actions locales, puis LIAISON AU NOYAU | LIAISON AU NOYAU | RÉSEAU DU SITE, puis LIAISON AU NOYAU |
| **ENCODAGE** | HACK, BLUEPRINT (une fois chacun) | — | — |

- Chaque ligne ne sert qu'une fois ; une ligne faite reste affichée, grisée (« RIEN À LIRE », « PORTE DÉVERROUILLÉE »…).
- **Actions locales** (règle des machines lisibles : la cible est à 15 cases au plus ; chaque cible n'appartient qu'à un
  terminal ; la ligne donne la distance et le cap) : **ouvrir la porte** à clé la plus proche (sinon **couper une grille
  d'énergie**, pour de bon : le socle n'y peut plus rien) ; **couper les lasers** d'une salle, pour de bon (son levier reste
  baissé) ; **ouvrir une porte dérobée**. Une cible déjà ouverte autrement disparaît du menu. Aucune action : « AUCUN
  RÉSEAU LOCAL ».
- **Réduit à cloison** : si aucun terminal de la carte n'a d'action, un réduit de 3 × 3 ou 4 × 3 cases est creusé dans la
  masse derrière le mur de la salle d'un terminal, butin de pièce secrète dedans ; sa CONNEXION fait tomber la cloison
  (gravats praticables). **Repli garanti** (28 novembre 2026, une carte sur 200 n'en avait pas) : réduit de 2 × 2, sinon
  une **porte dérobée** posée dans un mur simple de la salle (action « ouvrir la porte dérobée »).
  En dernier recours (bloc E), pour une salle close de toutes parts : le réduit (3 × 3, 2 × 2, puis 1 case) est creusé depuis la case
  praticable la plus proche du terminal, à 15 cases au plus, sinon n'importe où sur la carte (`termNiche`).
- **Pose garantie** : au moins deux terminaux complets, dont un à 15 cases au plus d'un **FABLAB** (les plans ne viennent
  que des terminaux) et un du site. Salles toutes encombrées : couloirs et petites pièces, puis une case qui porte un
  objet (l'objet roule à côté), enfin une console encastrée dans un mur de la salle. Une carte sur 700 restait sans terminal avant ce repli.
- **RÉSEAU DU SITE** (antenne) : l'effet d'avant — brouillard levé 15 tours sur 30 cases, puis ennemis signalés.
- **LIAISON AU NOYAU** : une tentative par machine, numérotée (`G.st.liaisons`) ; texte `liaisonTexte(niv, n)`, toujours un
  échec pour l'instant ; une ligne au journal.
- **ENCODAGE** : HACK (`encodageHack`, 14g, ci-dessous) et **BLUEPRINT** (`encodageBlueprint`, `14i-blueprints.js`, 28 novembre
  2026) : **trois plans distincts encore inconnus**, de rang ≤ niveau + 1, en cartes (illustration, type, coût en Matière,
  effet, description) ; on en choisit un, **appris tout de suite** (la capsule correspondante est identifiée) : le FABLAB sait
  le produire. Renoncer garde les mêmes trois plans dans la machine. Moins de trois libres : ce qu'il reste ; aucun : 30 de
  Matière à la place. Une fois par terminal. Lab → **Blueprints** : le même choix sans terminal (nouveau tirage, Matière +100).
- Le temps : lire et encoder ne coûtent rien ; une action de CONNEXION (actions locales, réseau, liaison exceptée) prend un
  battement, compté à la fermeture de la fenêtre, quand les repères « ! » apparaissent sur les cibles.
- État : `G.term[case]` (créé au premier besoin : une partie d'avant se recharge, antennes allumées comprises).

Essais : `outils/scripts/test-terminaux.js`.

**DATA (28 novembre 2026, `14k-journal.js`).** Tirée au hasard, sans choix, parmi ce qui concerne le niveau en cours : un
palier de la fiche d'un robot du niveau (poids 4 ; espèces des groupes permis au niveau, réglages du joueur compris, et ce qui
vit sur la carte), la fiche d'une capsule non identifiée du niveau, qui l'identifie (2), un journal non lu (3), un document
non lu (2), une page de tutoriel non lue (1). Seules les catégories non vides comptent ; tout lu : un journal déjà lu, au
hasard. Une fiche ne monte que si son palier suivant peut s'ouvrir (l'origine attend le niveau d'éveil). Enregistreur d'épave :
toujours un texte de source `boite_noire`, du modèle de l'épave si possible, titré au nom et au numéro de l'épave.
Antenne : un palier de robot (une chance sur deux) ou le relevé du site. Le texte s'affiche à droite avec « PAGE AJOUTÉE AU
JOURNAL DE BORD. » (ou « FICHE MISE À JOUR — STATS. »…) et, pour un texte, sa ligne d'analyse, reprise au journal du jeu.
Les textes viennent de `TEXTES_N1` (`14j-textes.js`), jeton `{UNITE}` remplacé par `NOM_FOREUSE`, `{NUM}` par le numéro.

### Hacks (`14g-hacks.js`, 28 novembre 2026)

Programmes **gratuits**, écrits dans la foreuse au terminal : **ENCODAGE → HACK**, **un choix parmi 3** (trois cartes côte à
côte : nom, famille en couleur, effet chiffré, puce ASCII ; empilées sur écran étroit ; flèches, Entrée, Échap, souris). Renoncer
(RENONCER ou Échap) laisse la ligne disponible, avec **les trois mêmes propositions** (`m.hkChoix`). Le choix est **équipé** s'il le
peut, sinon **rangé dans l'inventaire** ; emplacements et inventaire pleins : on peut **écraser** un hack actif. Jamais dans le butin
ni au FABLAB.

- **Ce sont des objets** (`hk_<sorte>_<rang>`, `hk_<sorte>` pour un Noyau) : on les retire (ils prennent alors une place dans
  l'inventaire, refus si plein), on les rééquipe, on les jette (puce au sol, tuile `o_hack`). Section **HACKS** de la fenêtre
  d'équipement : un cadre par emplacement, puis les hacks transportés.
- **Emplacements à part** des objets : **2**, puis **3, 4, 5** en arrivant aux niveaux **3, 6, 9** (le plus profond atteint,
  `G.st.nivMax` ; une ligne au journal). **Un seul exemplaire équipé par sorte, un seul hack Noyau.**
- **Rang = niveau où le hack est obtenu.** Échelle `E` par rang : 1, 2, 3, 5, 6, 8, 10, 12, 13, 15.
- Les effets passent par les **modificateurs d'équipement** (`G.st`) : la colonne Stats, la fenêtre d'équipement (« si vous
  l'équipez ») et le survol des stats montrent la part de chaque hack.
- **Chances** (chaque proposition tirée à part, jamais deux fois la même sorte ; un Noyau déjà porté n'est pas reproposé) :

| Niveaux | Base | Tir | Noyau |
|---|---|---|---|
| 1 à 3 | 85 % | 15 % | 0 % |
| 4 à 6 | 50 % | 40 % | 10 % |
| 7 à 10 | 25 % | 35 % | 40 % |

  **Depuis le 28 novembre 2026 (bloc D), l'arme de tir existe** (`TIR_DISPO=true`) : les hacks Tir sont proposés selon la table et
  agissent sur l'arme de tir équipée (voir « Arme de tir »). Avant, leur part allait à Base (100 / 0 / 0, 90 / 0 / 10, 60 / 0 / 40).

| Hack | Famille | Effet au rang n (E = échelle) | R1 | R4 | R7 | R10 |
|---|---|---|---|---|---|---|
| CRIT.SYS | Base | CRIT + E % | +1 % | +5 % | +10 % | +15 % |
| FORCE | Base | dégâts du coup + 2E % (multiplie le jet) | +2 % | +10 % | +20 % | +30 % |
| VISÉE | Base | PRE + E | +1 | +5 | +10 | +15 |
| BLINDAGE.RT | Base | DEF + E | +1 | +5 | +10 | +15 |
| RÉGÉN.CELL | Base | recharge d'énergie + 5E % | +5 % | +25 % | +50 % | +75 % |
| ÉCHO.SCAN | Base | vue +1 (rangs 1-3), +2 (4-6), +3 (7-10) | +1 | +2 | +3 | +3 |
| SOURDINE | Base | multiplicateur du forage (× 1,5) − 3E %, jamais sous × 1 | −3 % | −15 % | −30 % | −45 % |
| SIGNATURE | Base | chance d'être remarqué (25 %/battement) − 2,5E % | −2,5 % | −12,5 % | −25 % | −37,5 % |
| RECYCLAGE | Base | + E énergie par ennemi détruit (tout moyen, sauf une mine qui explose) | +1 | +5 | +10 | +15 |
| TRAQUE | Base | ennemis en chasse signalés à travers les murs (point danger, comme l'antenne) à 2 + E/2 cases | 3 | 5 | 7 | 10 |
| SURCHARGE | Tir | dégâts du tir + 3E %, coût + 2E % | | | | |
| SILENCE.TIR | Tir | bruit du tir − 3E %, dégâts − E % | | | | |
| ÉCONOMIE | Tir | coût du tir − 2E %, dégâts − E % | | | | |
| PERFORANT | Tir | crit du tir + E %, précision − E/2 | | | | |
| SYMBIOSE | Noyau | récupération de vie × 2 ; baisse du fuel × 1,5 (28 novembre 2026) | | | | |
| SURSIS | Noyau | à 0 de vie, survit une fois à 1 PV ; le hack s'efface | | | | |
| HÉRITAGE | Noyau | à la destruction, ce hack et l'autre hack équipé de meilleur rang passent à la foreuse suivante (`np-heritage`, vidée à la réception) ; ne donne rien d'autre | | | | |

- **Mort décidée à un seul endroit** : `mortForeuse()` (08-faune), appelée par les coups, le poison, les mines, les lasers, la charge
  sismique ; la descente (14b) appelle SURSIS elle-même. HÉRITAGE s'enregistre dans `dead()` ; la foreuse suivante reçoit les hacks
  équipés (dans l'inventaire si un emplacement manque).
- **Lab** : bouton **Hacks** (un choix parmi 3 au rang du niveau, comme au terminal) ; Lab → Items : famille « Hacks (lecture) ».
- Fiches : une ligne d'ambiance du point de vue de F467 et l'effet chiffré, en majuscules.

### Butin d'exploration (`butinExplo`, `14d-objets.js`)

Posé à la fin de la génération, sur toutes les recettes. **Ordre de priorité des lieux** (24 novembre 2026) :
**pièce secrète > pièce fermée à clé > cul-de-sac > autres salles.**

- **Pièces secrètes** : chacune reçoit un lot au fond (capsule, Matière, une fois sur deux une seconde capsule — un plan
  jusqu'au 28 novembre 2026 —, une fois sur quatre un Module de puissance), en plus du reste. Une « pièce secrète » est ici **tout ce qu'on n'atteint qu'en passant
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
  soit pas toujours au même genre d'endroit). Un **Module de puissance**, puis un **équipement** (un plan jusqu'au 28 novembre 2026), puis une **capsule** sont
  tirés au sort parmi les lieux encore vides ; chaque lieu pèse selon sa priorité (`BUTIN_POIDS` : fermée à clé 6,
  cul-de-sac 1, autre salle 0,5). Les lieux restants reçoivent de la **Matière** (15).
- Mesuré le 24 novembre 2026 (30 cartes par niveau, taille 3) : 0,6 à 0,7 butin derrière une serrure par carte, 5,2 à
  5,4 en cul-de-sac, aucun en « autres salles » (les culs-de-sac suffisent). Sur les 63 cartes qui avaient une pièce
  fermée garnie, le Module de puissance y était **38 fois (60 %)** et le plan 20 fois (32 %). Mesures : `docs/mesures.md`.

### FABLAB (`14c-fabricateur.js`)

Appelé **Fabricateur** jusqu'au 26 novembre 2026. Les clés internes (`FABRIC`, tuile `fabric`, `fab*`) n'ont pas changé.

Premier usage de la **Matière**. Avancer sur un FABLAB ouvre une liste : **seulement les objets dont la foreuse a le plan** (sans aucun plan, il le dit et ne propose rien). **Depuis le 28 novembre 2026, les plans ne viennent que des terminaux** (ENCODAGE → BLUEPRINT, choix parmi 3) : plus aucun plan au sol, dans les dépôts, salles piégées, vitrines, pièces secrètes ni sur les robots. Rang d'un plan (`PLAN_RANG`) : objets simples 1 (réparobots, batterie, fumigène, balise), autres consommables et accessoires 2, armes et armures 3 ; un plan est proposé si son rang ≤ niveau + 1. **Il existe un plan de tout** ce qui n'est ni objet de départ, ni clé, ni Module de puissance, ni Matière, ni hack (25 objets). Le FABLAB est présent dès le niveau 1 (dépôt de l'Astroport), avec un terminal à 15 cases au plus. Un plan resté au sol d'une ancienne partie se ramasse encore (déjà connu : 10 de Matière). Le Module de puissance ne se fabrique pas, la clé non plus (25 novembre 2026 : plus de plan de clé, les clés se trouvent). Une fabrication prend 3 battements ; l'objet est ramassé s'il y a de la place, sinon posé sous la foreuse.

- **Boutons en ligne (26 novembre 2026).** Un bouton ne porte plus que **le numéro entre crochets, le nom et le prix** — deux fois moins large qu'avant, où l'effet occupait la moitié de la place. Les boutons **se suivent sur la même ligne** et **reviennent à la ligne** quand la place manque. L'effet et la description complète restent sous l'illustration ASCII, à droite ; la fiche **défile** plutôt que de couper un texte long.
- **En-tête (26 novembre 2026)** : la Matière en réserve, puis **« Inventaire x/20 »** et les **vingt places en quatre rangées de cinq carrés**. Un carré vide est un contour blanc d'un pixel sur fond noir ; rempli, il prend la couleur du type de l'objet qui l'occupe — **bio** pour un consommable, **monde** pour un accessoire, **bâti** pour une arme ou une armure. Les carrés sont **classés par type**, dans cet ordre. Ce qui est **porté** ne prend pas de place et ne figure donc pas dans la grille.
- **Commandes** : flèches (ou Z/S, Q/D) et Entrée, ou clic ; Échap ferme. Les boutons se suivant en ligne, **droite et gauche avancent comme bas et haut**. Pavé numérique : 8, 2, 4 et 6 parcourent, 5 fabrique ; les chiffres 1 à 9 du haut du clavier choisissent l'objet de ce numéro, affiché devant son nom.
- **Fenêtre de taille fixe** : liste et panneau de droite gardent leur hauteur d'un objet à l'autre. Nom coloré par famille : consommables en bio, accessoires en monde, armes et armures en **bâti** (accent jusqu'au 26 novembre 2026 ; grisé si la Matière manque).
- **À droite de la liste** : l'illustration ASCII de l'objet sélectionné (celle de l'inventaire, `artHTML`), son nom, son effet et sa description ; elle suit les flèches, le survol et le focus. Elle reprend la tuile de l'objet posé au sol (même silhouette, mêmes couleurs) ; la tuile fait foi : quand on redessine une tuile `o_…`, l'illustration est à reprendre à la main. Les quatre objets du fabricateur ont leur tuile (`o_vrille`, `o_trepan`, `o_carene`, `o_blindage`). Contrôle : `outils/scripts/planche-objets.js`.

| Objet | Prix | Objet | Prix |
|---|---|---|---|
| Batterie | 14 | Stabilisateur, Servomoteur | 45 |
| Fumigène | 16 | Viseur laser, Gyroscope | 50 |
| Réparobots | 18 | Condensateur | 55 |
| Surrégime | 20 | Carène légère (armure) | 60 |
| — | | Vrille rapide (arme) | 70 |
| Camouflage optique | 24 | Trépan lourd (arme), Blindage composite (armure) | 85 |
| **Phaseur** | **45** | **Sonar 3 / 4 / 5 / 6 / 7** | 30 / 45 / 60 / 80 / 100 |
| Charge sismique | **34** (le consommable qui épargne le plus de vie, voir mesures) | Accumulateur, Téléobjectif | 40 |

Tous les prix se règlent dans **Lab → Items**.

Repère : une carte de taille 3 porte deux gisements de Matière de 30 à 50, soit 70 à 80 par niveau, plus le butin au sol
(2 à 4 blocs de 15) et ce que lâchent les robots : 120 à 150 par niveau en explorant tout (un peu plus depuis le 28 novembre 2026 :
la Matière prend la place des plans dans les dépôts, les vitrines et le butin des robots).

**Sonar** (28 novembre 2026, `sonar3` … `sonar7`, accessoire, fabriqué seulement) : les **ennemis à 3, 4, 5, 6 ou 7 cases**
(diagonales comprises) se montrent par un **point rouge**, même hors de vue et derrière un mur — le point de l'antenne et du
hack TRAQUE, sur la vue et la mini-carte. Plusieurs portés : le meilleur compte. Les mines posées ne renvoient pas l'onde.
Plans : Sonar 3 dès le niveau 1, 4 au niveau 2, 5 au 4, 6 au 6, 7 au 8 (`SONAR_RANG`). Une illustration ASCII et une tuile
au sol par version, le chiffre au centre (`o_sonar3` … `o_sonar7`). Rien à voir avec l'onde des gisements émise à l'arrivée.
Quatre pièces nouvelles (choix de l'utilisateur, « consommables + équipement ») : **Vrille rapide** (1d4+4, coup −30,
CRIT +5, POW 9), **Trépan lourd** (2d6+6 ; coup +25, POW 12), **Carène légère** (DEF +5, pas −10, DIS −1, POW 9),
**Blindage composite** (DEF +25 ; pas +25, POW 12). Leurs tuiles au sol sont la tuile générique, à dessiner.

## 5. Foreuse

| Stat | Valeur | Rôle |
|---|---|---|
| Vie | 100 | **remonte seule** depuis le 28 novembre 2026 : +1 tous les 20 battements en marche, +1 tous les 4 au repos, rien à sec (voir « Fuel, vie qui remonte, repos ») |
| Énergie | 100 | se recharge de POW par battement, **× 2 en attendant sur place** ; se déplacer ne coûte rien, un coup sur la roche **5** (10 jusqu'au 28 novembre 2026), un pas de course 5, frapper un animal rien |
| Fuel | 100 | réserve qui baisse **en permanence** (1 tous les 12 battements) ; voir ci-dessous |
| PAS | 100 | **durée d'un déplacement**, en unités de temps comme pour les créatures : 100 = un battement. Plus c'est bas, plus la foreuse marche vite. Ne joue ni sur les coups ni sur le forage |
| EYE | 10 | rayon de vision |
| DEG | 0 | **bonus fixe** ajouté au jet de dés de l'arme |
| PRE | 100 | précision |
| DEF | 10 | défense : fait rater les coups reçus, sans réduire les dégâts. Modifiée par le terrain et l'armure (10 viennent de la Coque d'usine) |
| CRIT | 5 % | coup critique (×3) ; coup par surprise toujours critique |
| DET | 3 | portée de découverte des portes dérobées : 15 % par battement en agissant, 35 % en attendant sur place (voir `conception-carte.md`) |
| POW | 10 | seuil d'équipement (POW requis) et recharge d'énergie : POW/10 par battement |

- **Aperçu derrière les obstacles** (foreuse seulement) : dans le rayon EYE, la case juste derrière un obstacle à la
  vue (montagne, herbes hautes) est aperçue en **mode souvenir**, sans les créatures. Une seule case ; un obstacle
  de 2 cases d'épaisseur cache toujours la suite. Ne marche pas derrière un mur ou une porte. Les ennemis ne voient
  pas à travers les obstacles.
- **Attendre** (Espace ou 5) : la recharge d'énergie est doublée. C'est la façon de refaire le plein après avoir
  couru ou foré.
- **Repos** (P, bouton REPOS ; refait le 28 novembre 2026 pour **se réparer**) : enchaîne des attentes **jusqu'à la vie et
  l'énergie pleines**. Chaque battement est une attente ordinaire (recharge doublée, portée de discrétion ÷ 2, vie +1 tous
  les 4 battements tant qu'il reste du fuel) ; le journal n'en garde que le début et la fin. S'arrête net si une créature
  **entre dans le champ de vision**, si un ennemi **repère** la foreuse ou **la chasse** (même hors de vue), si elle est
  **touchée** (la vie qui baisse par rapport au battement d'avant ; la perte à sec n'en est pas une), si le fuel **passe sous
  25 %** (un repos commencé sous 25 % va jusqu'à sec) ou **tombe à sec**, ou à la moindre touche. Refusé si vie et énergie
  sont pleines ou si un ennemi vous chasse. Garde-fou : 600 battements (un plein de vie en demande 400). **Attendre à la
  main compte comme du repos**, chasseur ou pas.
- **Course** (R) : mode qu'on allume et qu'on éteint. Chaque pas dure moitié moins et coûte **5 d'énergie** ; sans
  assez d'énergie, la foreuse reprend la marche. **Le moteur s'entend : + 2 cases de portée de discrétion**,
  appliquées après tous les autres modificateurs.

### Fuel, vie qui remonte, repos (28 novembre 2026, chantier « Survie », bloc B)

Valeurs arbitrées par l'utilisateur, toutes dans l'objet `REGLES` (`00-base.js`), une constante par règle ; le battement les
applique dans `survieTick` (`08-faune.js`), appelé par `regen`.
- **Fuel** : jauge de **100** (maximum 100), pleine au départ, qui **suit la foreuse** d'un niveau à l'autre. Elle baisse de
  **1 tous les 12 battements**, en marche comme au repos. **À sec : −1 de vie tous les 5 battements**, et plus aucune
  réparation automatique (ni en marche ni au repos) ; le dernier point perdu détruit la foreuse.
- **Où en trouver** : les **éclats de métal** (+15 / +20 / +25 selon la densité ; **4 gisements de métal par carte**, quelle que
  soit sa taille), la **cellule de fuel** (+30, consommable), et **chaque descente rend +30** (« FUEL : +30 RÉCUPÉRÉ DANS LE PUITS »).
- **Vie** : **+1 tous les 20 battements en marche**, en permanence, même en combat ; **+1 tous les 4 battements au repos**
  (= la foreuse est à l'arrêt et passe son tour : attente, bouton REPOS). Rien quand le fuel est à sec. Statut **« Repos »**
  sous les boutons quand la foreuse vient de passer son tour et que la vie remonte vite ; **« À SEC »** tant que la jauge est vide.
- **Journal** (jargon machine) : au passage sous 25 % (« FUEL : 25 %. RÉSERVE BASSE. »), à sec, à la première conversion de
  métal (« MÉTAL ASSIMILÉ : CONVERTI EN FUEL. »), puis à chaque éclat ramassé et à chaque descente.
- **Réparobots** gardés (+50 sur 5 battements), **deux fois et demie plus rares dans le butin** (poids 5 → 2 parmi les capsules).
  Prix au FABLAB inchangé (réglage du joueur). **Station de réparation** et autres soins inchangés.
- **Module de puissance** : POW +1 **et vie maximale +10** par module (la vie courante monte d'autant).
- **Hack SYMBIOSE** : **récupération de vie × 2, baisse du fuel × 1,5** (définition d'origine ; du 27 au 28 novembre, faute de
  fuel, il valait +1 vie / 4 battements contre 25 % d'énergie en plus).
- **Mini-jeu des mines** (descentes) : la vie qu'on y perd reste telle quelle.
- Une partie enregistrée avant le fuel se recharge avec la jauge pleine (`fuelInit`).

### Numéro d'unité, registre du port, niveau 1 raconté (`14l-histoire.js`, 28 novembre 2026)

- **Numéro d'unité** : la foreuse s'appelle **F467** à la première partie ; chaque **destruction** donne le numéro suivant à la
  partie d'après (F468, F469…). Une partie recommencée (REGEN, Nouvelle exploration, Quitter puis rallumer) garde le numéro.
  Rangé dans `np-unite` et dans le journal de bord (`JN.u`, donc aussi dans la base de l'artefact `journal/courant`) ; le plus
  grand des deux gagne. `NOM_FOREUSE` est vivant : `uniteApplique()` (début de partie) le met à jour, avec `EPV_UNITE` (toutes les
  épaves ont un numéro plus petit), et réécrit les textes construits au chargement (rôles des robots, objets, stats, aides).
  « Journal : effacer » (Lab) ne remet pas le numéro à zéro.
- **Registre du port** : chaque partie note son unité et le numéro de sa fosse au niveau 1 (`np-registre`, `JN.reg`, une entrée par
  unité). Le registre (« REGISTRE — AIRE 3 ») est le **premier DATA du terminal du dépôt le plus proche de l'entrée** (`G.regTerm`) :
  les 6 dernières unités précédentes « ARRIVÉE 04xx   FOSSE nn (LIBÉRÉE) », complétées au besoin par les épaves aux plus grands numéros
  de la carte (deux lignes au moins avant la nôtre : à la toute première partie, rien n'est inventé), puis la partie en cours,
  « DÉPART  — » et « FOSSE nn : LIBÉRATION PRÉVUE. ». La page du journal de bord (onglet Documents) garde le registre **tel qu'il
  était à la dernière lecture**.
- **Journal de la foreuse** (niveau 1 de l'Astroport) : atterrissage en jargon (« ATTERRISSAGE CONFORME. SITE : ASTROPORT. UNITÉ F467
  EN SERVICE. »), premier contact (nombre de mobiles en vue), épaves vues (la 1re, la 5e et la 14e, avec « OCCURRENCE : N » ; à la 14e,
  une analyse « MISSIONS ANTÉRIEURES = 0. ÉCART SIGNALÉ. »), l'état de chaque sorte d'épave et la fosse vide à la première rencontre,
  FABLAB, terminal, mât-balise vus, entrée au dépôt. Une ligne par battement au plus (le contact passe tout de suite).
- **Fin de niveau** : à l'entrée au dépôt, le groupe de ferrailleuses à l'ouvrage (non provoqué) le plus proche de notre vaisseau le
  prend pour épave : il y va, découpe la coque, fait la navette avec le sas. Notre vaisseau ne compte comme épave qu'à partir de là
  (pas de piège à l'atterrissage) ; s'en approcher ensuite les alerte comme ailleurs. Une ligne au journal si la foreuse les voit autour.
- **Terminaux** : la liaison tire ses textes de `TEXTES_N1.connexion` (5 variantes, toujours un échec au niveau 1) ; une page lue
  sans analyse propre reçoit une analyse générique de `TEXTES_N1.analyses` ; quelques libellés du menu viennent de `terminal_ui`.
- **Hacks** : les lignes d'ambiance sont un relevé de l'unité en jargon machine, sans « je » (la foreuse n'en a pas avant le niveau 7).

## 5 bis. Horloge : le temps continu

Le jeu compte en **unités de temps**, pas en tours.

- Chaque action de la foreuse a une **durée** (table `DUR` dans `09`) : pas 100, coup de foreuse 100, coup sur la
  roche 100, attendre 100.
- Durée d'un pas = PAS × terrain (toute eau ×2, peu profonde comme profonde, depuis le 28 novembre 2026 ; avant 1,5 en eau peu profonde) × 0,5 en course × 2 si la foreuse est engluée.
- Le monde **bat toutes les 100 unités**. À chaque battement : la détection et la perte de trace sont tirées,
  l'énergie remonte de POW, les effets s'épuisent (étourdi, glu, mèche d'une mine), le Soudeur répare, les machines
  tournent. Une action de 50 laisse passer un battement une fois sur deux ; une action de 200 en laisse passer deux.
- Conséquence voulue : **la détection se tire au temps, pas à l'action**. Courir fait traverser une zone avec deux
  fois moins de tirages ; une action longue en fait subir davantage.

### Chaque créature a son horloge (25 novembre 2026)

Avant, les créatures agissaient par battements entiers, avec des points de mouvement : une seule VIT servait au
déplacement, un coup prenait toujours un battement, et une bête rapide ne pouvait ni frapper en arrivant au contact,
ni frapper deux fois. Maintenant elles comptent le temps comme la foreuse.

- Deux durées par espèce, dans les mêmes unités : **`dpas`** (un pas) et **`dcoup`** (un coup). **Plus petit, plus
  rapide.** Elles s'écrivent sur cinq paliers : **50 très rapide · 75 rapide · 100 normal · 150 lent · 200 très lent**.
  Elles remplacent la VIT, qui n'existe plus pour les créatures ; le Lab les règle à sa place (Pas, Coup).
- `o.pret` est l'instant où la créature pourra agir. Elle agit, l'effet est immédiat, puis elle est occupée pendant
  la durée de son action. Le temps avance jusqu'au plus proche des deux instants suivants : la créature prête la
  première, ou le prochain battement. **Rien n'est arrondi ni perdu** : le reste de temps se reporte tout seul.
- Le terrain allonge le pas (toute eau ×2, sauf pour les nageurs ; statut « Ralenti ×2 » affiché tant que la foreuse est dans l'eau) et **jamais le coup**.
- Les tirs sur cadence deviennent des coups : l'intervalle entre deux lasers est `dcoup` (Sentinelle 100, Artilleur
  150) ; la glu garde son `cadence` comme multiplicateur (Englueur 100 × 3 = 300, inchangé).
- **Au calme** — patrouille, bande, errance, retour à terre — un pas prend au moins un battement, quelle que soit la
  vitesse de l'espèce (règle du 20 novembre 2026, conservée).
- **Égalités** : le battement passe avant une créature prête au même instant, et la foreuse passe avant une créature
  prête à l'instant même où son action à elle se termine.
- Ce qui disparaît : la **réserve de points de mouvement** (2 au plus). Une créature immobile ne stocke plus rien,
  donc plus de bond de deux cases d'un coup — l'approche est régulière, et un peu plus lente qu'avant.
- Ce qui apparaît : **la charge** (venir au contact et frapper pendant une seule action de la foreuse) et la **double
  frappe** (`dcoup` 50). Une phase tirée au hasard à la naissance évite que toutes les bêtes d'une espèce agissent au
  même instant.
- **La foreuse compte pareil** (26 novembre 2026) : sa VIT en base 5 a disparu, remplacée par **PAS**, en base 100 comme
  COUP et comme les créatures. `G.st.pas` et `G.st.coup` sont des modificateurs que l'équipement ajoute ou retire,
  **négatif = plus rapide** ; la colonne affiche la durée obtenue. Objets adaptés : Servomoteur **pas −25**, Carène
  légère **pas −10**, Blindage composite **pas +25**. Une partie d'avant est convertie une fois, en recalculant le
  modificateur depuis l'équipement porté (pas depuis le total, qui dériverait au premier objet retiré).

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
- Les créatures attaquent au contact **tous les `dcoup`** : une fois par battement à 100, deux fois à 50, une fois sur
  deux à 200 (voir l'horloge au 5 bis).
- **Barre de vie** au-dessus de toute créature blessée. Coup raté : « 0 » en gris. Animation : bond de l'attaquant,
  flash, chiffres flottants, tremblement d'écran quand le robot est touché ou qu'un ennemi meurt.

## 6 ter. Arme de tir (`14m-tir.js`, 28 novembre 2026, chantier « Survie », bloc D)

Décision de l'utilisateur (27-28 novembre, `arbitrage-survie.md` § 4) : une arme secondaire à projectiles, dès le départ ; pas de
plug-ins, quatre armes à part entière qui **remplacent le canon** ; une seule arme de tir à la fois.

- **Viser** : touche **G** ou bouton **TIR** (sous ÉQUIPEMENT) ; la visée s'ouvre sur l'ennemi en vue le plus proche qu'on peut
  toucher. **Tab** passe à la cible suivante (Maj+Tab : précédente), les flèches déplacent le viseur, **Entrée** ou **G** tire,
  **Échap** annule. Souris : le viseur suit le pointeur, un clic tire. Tablette : toucher la case vise, la toucher de nouveau tire.
  Viseur habituel couleur accent et pointillé du trajet ; case impossible (hors de vue, hors de portée, ligne obstruée, la foreuse
  elle-même) : le viseur rouge barré du phaseur, et le tir est refusé sans rien coûter. La fiche de survol d'une créature ajoute
  « Tir (arme) NN % » et ses états (« En feu N », « Englué N »).
- **Un tir = un coup** (durée 100). **Énergie** : 20 pour le canon ; refusé s'il n'y en a pas assez. Pas de munitions.
- **Dégâts** : un jet du coup de forage (dés de l'arme de forage, DEG, POW, FORCE) × le pourcentage de l'arme × les hacks Tir.
  **Précision** : celle de la foreuse moins le malus de l'arme. **Critique** (CRIT + PERFORANT) et **coup par surprise** (cible
  qui n'a pas repéré la foreuse : touche toujours, × 3) comme au contact.
- **Trajet** : la ligne droite (Bresenham) depuis la foreuse. Murs, portes fermées, rochers, machines arrêtent le projectile (le
  gouffre non) ; la **première créature ou balise** sur la ligne le prend, même si ce n'est pas la cible (sauf le laser).
- **Bruit** : celui du forage de base (× 1,5, s'entend à travers les parois ; SOURDINE ne joue pas), × 1,5 encore pour le shotgun.
- Le tir **provoque les ferrailleuses** comme une attaque, réveille et met en chasse la cible (et rompt le camouflage).

| Arme | Dégâts | Précision | Énergie | Portée | Particularité |
|---|---|---|---|---|---|
| **Canon** (de base, jamais perdu) | 70 % | −10 | 20 | la vue | — |
| Lance-flammes | 50 % | −10 | 25 | 5 cases | la cible **brûle** : 3 par battement pendant 4 battements (`o.brule`, `tirTick`) |
| Canon à glu | 50 % | −10 | 25 | la vue | la cible est **engluée 4 battements** : pas et coups deux fois plus longs (`o.glu`, `dpasDe`/`dcoupDe`) |
| Shotgun | 100 % à 1-2 cases, 60 % à 3 | 0 | 30 | 3 cases | touche **la cible et toutes les cases voisines** ; bruit × 1,5 |
| Laser | 60 % | 0 | 30 | la vue | **traverse** : touche chaque créature de la ligne jusqu'au mur |

Valeurs dans `ITEM_VAL` (14d : `tdeg`, `tpre`, `tcout`, `tport`, `tbrule`, `tbruleBat`, `tglu`, `tloin`, `tbruit`), réglables dans
**Lab → Items → Armes de tir**. Les fiches les donnent en clair, jamais en formule : « DÉGÂTS : 4–8 · ÉNERGIE : 20 · PORTÉE : VUE ».
La colonne montre la même ligne sous les boutons (en rouge quand l'énergie manque).

- **Le canon** est dans l'emplacement TIR au départ. Il **ne prend jamais de place** dans l'inventaire, ne se jette pas, ne se
  retire pas. **Équiper une autre arme de tir le remplace** (il passe « réserve ») ; **retirer ou jeter cette arme le remet en main**.
  L'arme retirée retourne dans l'inventaire (une place).
- Les quatre armes (lance-flammes 70, canon à glu 65, shotgun 75, laser 90 de Matière) et les deux **silencieux** (45) ne s'obtiennent
  que par **blueprint** au terminal puis **FABLAB** : ni butin, ni sol. Rang de plan : 3 pour les armes (dès le niveau 2), 2 pour les
  silencieux.
- **Forage silencieux** (accessoire) : bruit du forage ÷ 2 (après SOURDINE). **Tir silencieux** (accessoire) : bruit du tir ÷ 2 (après
  SILENCE.TIR). Mesuré : portée de discrétion en forant 15 → 8, en tirant 15 → 8.
- **Hacks Tir** : SURCHARGE (dégâts + 3E %, énergie + 2E %), SILENCE.TIR (bruit − 3E %, jamais sous le bruit d'un pas, dégâts − E %),
  ÉCONOMIE (énergie − 2E %, dégâts − E %), PERFORANT (CRIT du tir + E %, précision − E/2), sur l'arme équipée quelle qu'elle soit.
- **Chaque arme a son projectile et son son** (règle du 26 novembre), dessinés au pixel de tuile, opaques, sur la couche des effets
  de surface (`tirFx` dans `fxCouche`) : canon, un obus blanc et une traînée, quatre éclats à l'impact ; lance-flammes, une langue de
  pixels qui s'étend puis se retire, blanche à la buse, rouge au bout (et des braises sur la cible tant qu'elle brûle) ; canon à glu,
  une boule bio en cloche qui éclate en gouttes ; shotgun, cinq plombs en gerbe puis des bouffées ; laser, un faisceau d'un seul tenant,
  cœur blanc et liserés couleur monde. Les chiffres de dégâts attendent l'arrivée du projectile. Illustration ASCII et tuile au sol
  (`o_canon`, `o_lanceflamme`, `o_canonglu`, `o_shotgun`, `o_laser`, `o_silforage`, `o_siltir`) pour chacun.

## 6 bis. Équipement et inventaire

**Rien n'est donné au départ**, sauf la foreuse et la Coque d'usine : tout le reste se trouve ou se fabrique.

**Vingt places, équipement compris (26 novembre 2026).** L'inventaire tient **20 places** : **chaque exemplaire transporté en prend une, l'équipement aussi** — seul ce qui est **porté** est gratuit. S'équiper libère donc une place, se déséquiper en reprend une (refusé quand le sac est plein : il faut d'abord jeter quelque chose). Sac plein, un objet ramassé **reste au sol**, équipement compris. Jusqu'au 26 novembre 2026, seuls les consommables comptaient et l'équipement transporté était gratuit.

### Capsules, visée, plans (`14d-objets.js`)

- **Consommables non identifiés.** Chaque sorte porte un **nom de code** tiré à chaque partie (« Capsule //KZ7-3FQ ») et la même
  tuile de capsule au sol. Le premier usage révèle ce que c'est, pour toute la partie ; apprendre son plan au terminal aussi. La clé et la
  Matière sont toujours connues. Ce que la foreuse sait (plans, capsules identifiées, codes) est dans `G.st.savoir` et la
  suit d'un niveau à l'autre. **À la mort de la foreuse, toutes les capsules se dévoilent** dans l'inventaire (message dans
  le journal) ; la partie suivante repart avec de nouveaux codes.
- **Tout consommable se vise**, comme la charge sismique, jusqu'à la portée de vue (capteur), depuis le 28 novembre 2026. **La visée montre toujours une seule case**
   : une capsule inconnue ne se trahit
  pas par sa zone. La visée s'ouvre **sur la foreuse** pour les objets qui la servent **et pour toute capsule non
  identifiée** : Entrée deux fois = sur soi, quitte à faire sauter une charge sismique sous ses pieds. La charge connue
  s'ouvre une case devant.
  Sur un ennemi, l'objet sert l'ennemi ou le frappe ; dans le vide, il est perdu.

| Consommable | Sur la foreuse | Sur un ennemi |
|---|---|---|
| Réparobots | Vie +50 | le répare de 50 PV |
| Batterie | Énergie +50 | décharge : 12 dégâts, **étourdi 10 battements** (un Bloqueur étourdi lâche prise) |
| **Cellule de fuel** (28 novembre 2026) | Fuel +30 ; refusée si le fuel est plein (une fois identifiée) | se vide sur le sol, sans effet |
| Fumigène | nuage là où on le lance ; **les ennemis ne perdent la trace que si la foreuse est dedans** | idem |
| Charge sismique | explose comme une mine (3 × 3 et 5 cases autour), 30 dégâts **à la foreuse aussi**, roche brisée | idem |
| **Module de puissance** | **POW +1 et vie max +10 pour toujours** (vie courante +10) ; chaque point de POW au-dessus du POW requis par l'arme donne **+5 % de dégâts**  | ses coups portent 25 % plus fort |
| **Surrégime** | CRIT +50 pendant 10 battements ; la foreuse vire au rouge | ses coups sont tous critiques pendant 10 battements |
| **Camouflage optique** | invisible 10 battements : vue seulement au contact, les poursuivants à distance lâchent ; **rompu par un coup ou un forage** ; « Camouflé N » sous les barres, comme « Englué N » | il disparaît 10 battements (visible au contact) |
| **Balise** (néfaste sur soi) | une **sirène à deux tons** retentit ; tous les ennemis à 20 cases savent où est la foreuse ; **elle rompt son camouflage optique** | **lancée ailleurs, c'est un leurre posé au sol** (ci-dessous) |
| **Court-circuit** (néfaste) | énergie à zéro | hors service 10 battements, sans dégât ; un Bloqueur lâche |
| **Phaseur** | **elle entre en phase et sort de phase où l'on veut**, sur le terrain déjà découvert (ci-dessous) | **il passe en phase ailleurs sur le niveau**, à 25 cases au moins, et **perd la trace de la foreuse** ; un Bloqueur lâche |
| **Matière** (butin au sol) | +15 en réserve, dès qu'on marche dessus ; au sol, elle a le dessin des **éclats moyens** en couleur Matière  | – |

**Balise posée.** Lancée ailleurs que sur la foreuse, la balise **vole jusqu'à la case visée** et s'y pose (case libre la plus proche si elle est occupée). Elle **hurle 25 battements** (« Balise N » sous les barres, point rouge clignotant). Tant qu'elle hurle, **tout ennemi à 20 cases d'elle, ou qui chasse la foreuse, la délaisse pour s'acharner sur elle** : il l'attaque au contact, les tireurs (Sentinelle, Artilleur, Englueur) lui tirent dessus à portée, les mines s'arment à côté. **Chaque coup la touche** (critique possible) ; un seul bruit d'attaque par battement. Elle a **40 PV**, barre le passage comme une créature et, **détruite, explose sur sa seule case**, sans dégâts alentour ; mines et charges sismiques l'abîment aussi. Les ennemis attirés **restent en chasse** (pas de coup par surprise sur eux) et gardent le souvenir de la foreuse ; balise éteinte ou détruite, ils reprennent la chasse (sur la foreuse s'ils la voient, sinon là où ils l'ont vue). Un ennemi frappé par la foreuse délaisse la balise. La balise posée ne rompt pas le camouflage. Valeurs réglables dans Lab → Items (rayon, durée, PV). 

**Phaseur (26 novembre 2026).** Sur la foreuse, il se joue **en deux temps**. La visée courte ordinaire choisit d'abord la cible : la foreuse elle-même, ou un ennemi à 4 cases. Sur la foreuse, la capsule part aussitôt, **la foreuse se démonte pixel par pixel** et un **grand viseur** s'ouvre : il n'est plus borné à 4 cases, **la vue reste centrée sur la foreuse** (28 novembre 2026) et ne défile que lorsque le viseur s'approche du bord du cadre (2 cases ; la souris maintenue au bord fait défiler la vue en continu, les touches ramènent la vue d'un coup). Maj : cinq cases d'un coup. Pour viser **hors de l'écran**, un clic sur la mini-carte y porte le viseur sans déplacer la vue ; le viseur y est dessiné en carré creux. Tant que la foreuse est démontée, **une petite boule bio frémit à son emplacement** (tremblement d'un pixel de tuile) et **le pointillé du trajet habituel** (mêmes petits ronds blancs, `drawPath`) la relie au viseur, en ligne droite puisque le phasage ignore le terrain. Le viseur est **le viseur habituel** (mêmes crochets pointillés) : **bio** quand la foreuse peut s'y reformer ; sur une case impossible, **rouge danger barré d'une croix en X**. Il faut que la case ait été **découverte** (`G.seen`) et qu'elle **porte la foreuse** — ni obstacle, ni créature, ni balise ; l'eau, elle, est permise, la foreuse patauge. Échap, ou trois cases impossibles validées de suite, **la reforme sur place** : la capsule est perdue, mais on ne reste jamais bloqué hors du monde. **La trace au sol s'arrête net** (rien ne relie les deux points), le camouflage se rompt, et **le battement ne passe qu'à l'arrivée**. Distance minimale de réapparition d'un ennemi : réglable dans Lab → Items.

**Créature étourdie** (batterie, Court-circuit) : elle ne fait plus rien, Puces comprises. Toute sa silhouette devient un **damier d'un pixel sur deux, couleur bio et couleur bâti en quinconce**, les deux couleurs **s'échangeant à chaque battement**. **La foreuse prend le même damier quand elle est immobilisée** (tenue par un Bloqueur) ; il prime sur ses autres allures (engluée, camouflée, en surrégime).

Les deux capsules néfastes (choix de l'utilisateur) font de l'identification un pari : essayer une capsule
inconnue sur soi peut coûter cher, la lancer sur un ennemi peut le servir. Fabricables une fois le plan appris (12 et 16).

- **Butin des robots** : un robot abattu lâche parfois un objet (Broyeur 90 %, Bloqueur 60 %, Soudeur 45 %, Artilleur et
  Englueur 35 %, Sentinelle 25 %, Torpille 10 %, Crabot 8 %, Relais 6 %, Drone 5 %, Mine 0) : Matière 50 %, capsule 38 %,
  équipement 12 % (jusqu'au 28 novembre 2026 : 40 / 35 / plan 18 / 7).
- **Lab → Items** : tout ce qui existe, avec ses valeurs modifiables (prix, effets, dés, modificateurs, POW requis, butin par
  espèce), « Rétablir » et « Enregistrer » (navigateur `np-items`, et base de l'artefact sous `items`).
- **Allure de la foreuse** : engluée, elle prend la couleur bio ; en surrégime, la couleur danger ; camouflée, une trame.

- **Emplacements** (28 novembre 2026) : **l'arme de forage, l'arme de tir, l'armure, et 5 objets équipables** (accessoires ; 3 jusque-là).
  Les hacks ont leurs emplacements à part. Une ancienne partie qui porterait plus d'objets que la limite les garde tous : on ne peut
  simplement plus en équiper d'autre avant d'être repassé sous la limite. La fenêtre Équipement montre un cadre par emplacement :
  FOREUSE, TIR, ARMURE, OBJETS (5 cadres, « EMPLACEMENT LIBRE » quand il est vide), puis TRANSPORTÉ, puis HACKS.
  **Il y a toujours une arme en main** : on ne peut ni la
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
- **Touche I** : ouvre le sous-menu et choisit le **premier consommable**, prêt à l'emploi ; **I** de nouveau
  **referme le sous-menu**. **↑ ↓** parcourir, **Entrée** utiliser, **X**, **Suppr** ou **J** jeter un exemplaire au
  sol, **Échap** sort de la navigation en laissant le sous-menu ouvert.
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
| Servomoteur | accessoire | – | Pas −25 (la foreuse marche plus vite) |
| Téléobjectif | accessoire | – | EYE +3 |
| Viseur laser | accessoire | – | CRIT +10 % |
| Condensateur | accessoire | – | POW +1 |
| Gyroscope | accessoire | – | DEF +12 |
| Stabilisateur | accessoire | – | PRE +10 |
| Accumulateur | accessoire | – | Énergie max +40 |
| Réparobots (×2) | consommable | – | Vie +50 ; **croix rouges** autour de la foreuse |
| Batterie (×2) | consommable | – | Énergie +50 ; **flèches bio** qui montent |
| Cellule de fuel | consommable | – | Fuel +30 ; **gouttes couleur monde** qui tombent dans la foreuse ; son propre bruit (bouchon, trois gorgées) ; tuile `o_fuel` ; capsule à identifier ; aussi courante que la batterie dans le butin ; blueprint de rang 1 (14 Matière) |
| Fumigène (×2) | consommable | – | un **nuage de fumée** (ci-dessous) |
| Charge sismique (×2) | consommable | – | **visée** d'une case jusqu'à la portée de vue ; explosion de mine, **30 dégâts** ; bruyante |

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

- **Journal (28 novembre 2026)** : pas d'indications de touches dans les messages du journal (visée, phaseur, exploration) ; et pour le phaseur on parle de **phase** (« entre en phase », « sort de phase », « passe en phase »), jamais de « disperse » ni de « reforme ».

- **Statuts et durées (28 novembre 2026).** Sous les boutons, la ligne de statuts affiche aussi **Surrégime N**, **Réparation N** et **Recharge N** (battements restants), comme Englué, Camouflé et Dans la fumée. Les **réparobots** et la **batterie** utilisés sur la foreuse ne rendent plus tout d'un coup : le gain est **réparti sur 5 battements** (`RECUP_TOURS`, une part égale du reste à chaque battement ; un second objet ajoute son total et repart sur 5). Sur un ennemi, la réparation reste immédiate. **Surrégime et camouflage durent 30 battements** (au lieu de 10) ; un réglage enregistré resté à 10 suit la nouvelle valeur.

- **Fumée opaque (28 novembre 2026).** Le nuage du fumigène ne se dessine plus avec de la transparence : chaque pixel est opaque ou absent. On garde le dessin des tuiles de nuage (plein ou texturé au cœur, hachures de tailles, d'inclinaisons et de densités variées sur les bords). En se dissipant, ou hors de vue, les cases passent à des hachures plus claires (rayures puis pointillé).
