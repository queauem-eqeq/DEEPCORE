# Mesures d'équilibrage

Chiffres obtenus en rejouant des situations dans le vrai moteur, avec `python3 outils/simul.py`.
Valeurs de référence : si une modification de la discrétion les change, c'est voulu ou c'est un bug.
Relancer l'outil après chaque changement et mettre cette page à jour.

**État mesuré le 13 novembre 2026**, avec les réglages d'alors : portée de base 10, 25 % par tour pour
être remarqué, bande de chasse au double du rayon, 3 % par tour de perte de trace hors du rayon.

## Détection

Une bête calme, en vue, maintenue à distance fixe sur une carte entièrement dégagée.

| Distance | Vous remarque |
|---|---|
| 3 cases | toujours, en 3,9 tours |
| 8 cases | toujours, en 4,0 tours |
| 10 cases (le bord du cercle) | 93 % des cas, en 9,9 tours |
| 11 cases | jamais |

Les 3,9 tours collent à la théorie : une chance sur quatre par tour. Le cas des 10 cases est le bord
exact du cercle, où l'arrondi de la distance fait parfois basculer la case hors de portée.

## Perte de trace

Une bête **déjà en chasse**, en vue, maintenue à distance fixe.

| Distance | Perd votre trace |
|---|---|
| 5 cases | jamais |
| 10 cases | jamais |
| 13 cases | toujours, en 35 tours |
| 19 cases | toujours, en 30 tours |
| 25 cases (hors de la bande de chasse) | contact rompu aussitôt, sans tirage |

Dans le rayon, elle ne vous perd jamais : c'est voulu. Au-delà, la trentaine de tours correspond aux
3 % par tour. Entre les deux, rien ne change : le seuil est net.

## Peut-on semer une bête ?

Un crabos lancé à vos trousses, la foreuse fuit vers l'est pendant 55 tours au plus, 40 essais par cas.
Le contrôle vérifie que la méthode est saine : une bête enfermée derrière des montagnes abandonne bien.

| Situation | Résultat |
|---|---|
| **CONTRÔLE** : bête enfermée, incapable de suivre | abandonne à tous les coups, en 2 tours |
| Terrain dégagé, 4 cases d'avance | **jamais semée** |
| Terrain dégagé, 12 cases d'avance | 78 % des cas, en 31 tours |
| Terrain dégagé, 21 cases d'avance | à tous les coups, en 25 tours |
| Herbes hautes, en ligne droite | 95 % des cas, en 11 tours |
| Herbes hautes, en zigzag | **à tous les coups, en 8 tours** |
| Ouverture dans un mur, puis obliquer derrière | 85 % des cas, en 15 tours |
| La même, avec 12 cases d'avance | à tous les coups, en 22 tours |
| Zone de rochers épars | **jamais semée** |

La même chose **en courant** (13 novembre 2026 : deux pas par battement tant qu'il reste de l'énergie,
soit une vingtaine de cases avec le plein, puis marche) :

| Situation | En marchant | En courant |
|---|---|---|
| Terrain dégagé, 4 cases d'avance | jamais semée | **une fois sur deux environ** (43 à 65 % selon le tirage, en 40 tours) |
| Terrain dégagé, 12 cases d'avance | 70 à 83 % | **à tous les coups, en 29 à 36 tours** |
| Herbes hautes, en ligne droite | 90 à 95 % | à tous les coups, en 9 à 11 tours |
| Ouverture dans un mur, puis obliquer | 70 à 85 % | à tous les coups, en 14 tours |

Mesuré après l'ajout des **+ 2 cases de portée en courant** (13 novembre 2026) : le bruit du moteur ne
referme pas la fuite, parce qu'une fois lancée la foreuse sort de toute façon du rayon. Attention à la
précision de ces chiffres : **40 essais par cas**, donc ± 15 points ; deux mesures d'affilée du cas à
4 cases ont donné 43 % puis 65 %. Seuls les écarts francs (jamais / toujours) sont solides.

### Ce que ces chiffres disent

- **De près, à découvert, on ne sème personne.** Le crabos va aussi vite que la foreuse (vitesse 5
  contre 5) et l'insectoïde plus vite encore : l'écart ne grandit jamais, la bête reste dans le cercle,
  et la règle des 3 % ne s'applique pas. Il n'y a pas d'issue sans terrain.
- **De loin, à découvert, oui.** Avec une douzaine de cases d'avance, la bête est hors du cercle : les
  3 % mordent et elle finit par renoncer. C'est le seul cas où fuir tout droit fonctionne.
- **Les herbes hautes sont le meilleur abri du jeu**, parce que celles qu'on ne couche pas bloquent la
  vue. Zigzaguer évite de laisser derrière soi un couloir d'herbes couchées bien dégagé.
- **Les rochers épars ne cachent pas** : ils gênent la foreuse plus qu'ils ne coupent la ligne de vue.
- **La course change la donne** : de près et à découvert, on sème maintenant un crabos un peu moins
  d'une fois sur deux, au prix de toute l'énergie (donc sans pouvoir frapper ensuite). Avec un abri à
  portée, la course suffit presque toujours. Contre un insectoïde (vitesse 6), l'avance gagnée est
  un peu plus faible.

## Combats (13 novembre 2026)

Duels simulés dans le vrai moteur (`python3 outils/simul.py combat`) : la foreuse, 100 PV, marche sur l'ennemi et frappe jusqu'à
la mort de l'un des deux, sur terrain dégagé, ennemis déjà en chasse à 6 cases. **300 essais par cas**, soit ± 3 points sur les
victoires et ± 2 sur la vie. « Vie restante » : moyenne sur les combats gagnés, poison restant déduit.

### Un ennemi, puis des groupes, foreuse sans équipement

| Adversaires | Victoires | Vie restante | Durée (battements) |
|---|---|---|---|
| 1 Crabos | 100 % | 85 | 7 |
| 1 Cafar | 100 % | 97 | 4 |
| 1 Crachin | 100 % | 85 | 11 |
| 1 Vipérin | 100 % | 80 | 7 |
| 1 Gluar | 100 % | 88 | 8 |
| 1 Siphon | 100 % | 97 | 5 |
| 1 Tapi (embusqué) | 100 % | 74 | 4 |
| 1 Taupar | 100 % | 77 | 9 |
| 1 Mastok | 92 % | 48 | 11 |
| 2 Crabos | 100 % | 59 | 12 |
| 3 Cafars | 100 % | 85 | 7 |
| 4 Cafars | 100 % | 76 | 8 |
| 2 Crachins | 100 % | 56 | 20 |
| 2 Vipérins | 100 % | 62 | 10 |
| Mastok + 2 Crabos | 28 % | 25 | 15 |

Lecture : un ennemi seul coûte de 3 à 26 points de vie, le Mastok une cinquantaine (et une défaite sur douze). Sans réparation
automatique, c'est l'accumulation qui tue : deux crabos coûtent déjà 40 points. Le Siphon et le Gluar font peu de dégâts, leur
danger est ailleurs (énergie volée, fuite ralentie) et ne se lit pas dans un duel. « Mastok + 2 Crabos » est voulu comme un
combat à fuir.

### Ce que vaut chaque objet

Même combat de référence pour tous : **2 Crabos + 1 Vipérin**, un seul objet équipé.

| Équipement | Victoires | Vie restante | Durée |
|---|---|---|---|
| foreuse nue | 81 % | 28 | 14 |
| Foret diamant | 100 % | 52 | 10 |
| Marteau-pilon | 97 % | 55 | 12 |
| Châssis renforcé | 94 % | 47 | 16 |
| Coque furtive | 86 % | 28 | 15 |
| Servomoteur | 87 % | 32 | 14 |
| Téléobjectif | 80 % | 28 | 15 |
| Viseur laser | 82 % | 33 | 14 |
| Condensateur | 84 % | 27 | 15 |
| Gyroscope | 92 % | 32 | 15 |
| Scie circulaire | 98 % | 53 | 11 |
| Lance thermique | 98 % | 46 | 11 |
| Châssis allégé | 88 % | 28 | 14 |
| Coque isolante | 87 % | 38 | 15 |
| Stabilisateur | 93 % | 34 | 13 |
| Accumulateur | 82 % | 27 | 15 |

Contre un Mastok seul : Marteau-pilon 97 % / 57 PV · Foret diamant 99 % / 60 PV · Scie circulaire 97 % / 62 PV · Lance thermique 99 % / 54 PV (foreuse nue : 92 % / 48 PV).

Lecture : les quatre armes spéciales se tiennent (97 à 100 % de victoires, 46 à 55 PV restants) et valent toutes nettement mieux que
la foreuse nue (81 %, 28 PV). Le Châssis renforcé est la seule armure qui pèse dans un duel ; Coque furtive, Châssis allégé,
Servomoteur, Téléobjectif, Condensateur et Accumulateur servent hors du corps à corps (discrétion, fuite, vision, énergie), ce que
ce test ne mesure pas.

Réglages faits à la suite de la première mesure : Foret diamant affaibli (il gagnait 100 % des combats avec 70 PV), Marteau-pilon
renforcé (il faisait moins bien que la foreuse nue), Stabilisateur ramené de +15 à +10, Gluar porté de 4 à 6 de dégâts, et la vie
qui suit le maximum quand on équipe un châssis (sans quoi les +30 PV ne servaient à rien dans un combat).

### Renforcement des ennemis par niveau : essayé puis retiré (13 novembre 2026)

Deux essais de renforcement avec la profondeur (+15 %, puis +25 % de PV et de dégâts par niveau) ont été mesurés puis abandonnés à la demande
de l'utilisateur : les PV et les dégâts ne bougent plus, c'est le nombre d'ennemis qui monte. À retenir de ces mesures : sur le combat de
référence, la foreuse équipée (Scie, Châssis renforcé, Gyroscope, Viseur, Stabilisateur) gagnait encore 79 % des combats face à des ennemis
deux fois plus forts, quand la foreuse nue n'en gagnait aucun. **L'équipement pèse bien plus que la profondeur** tant qu'il est donné au départ.

### Menace par monde et par niveau (15 novembre 2026)

Menace = somme effectif × coût d'un duel (colonne « vie restante » plus haut, retranchée de 100). Valeurs pour 1000 cases, taille 3.

| Monde | Avant (multiplicateur par niveau), niveaux 1 à 5 | Après (budget) |
|---|---|---|
| Plateau | 56 / 81 / 114 / 152 / 189 | 60 / 121 / 181 / 252 / 322 |
| Marécage | 162 / 236 / 327 / 440 / 540 | 59 / 117 / 185 / 254 / 320 |
| Hautes herbes | 85 / 117 / 163 / 218 / 274 | 59 / 122 / 181 / 250 / 323 |
| Galeries | 68 / 100 / 140 / 188 / 233 | 62 / 117 / 182 / 253 / 319 |
| Pierrier | 106 / 147 / 193 / 253 / 312 | 70 / 129 / 184 / 248 / 316 |
| Failles | 80 / 106 / 159 / 194 / 257 | 68 / 110 / 178 / 249 / 326 |

Les écarts qui restent (60 à 70 au niveau 1) viennent des arrondis et du minimum d'un individu par espèce. Deux archétypes extrêmes,
« que des mastoks » et « tout infesté », tombent eux aussi sur le budget (60 à 72 au niveau 1, 316 au niveau 5).

> **Note du 16 novembre 2026** : les mesures de coût et de pression ci-dessous servaient au budget de menace par niveau,
> retiré ce jour-là avec la descente (`conception.md` § 3 bis). Elles restent utiles pour comparer la dangerosité des espèces.

## Banc de combat : coût et pression par espèce (15 novembre 2026)

Mesures faites sur le **banc de combat** (`outils/banc.py` l'assemble, `outils/banc_series.py` lance les séries ; artefact
https://claude.ai/artifact/9BKRaoB4hzgdWhzYFx5A6q). Le vrai moteur tourne sur une **carte de taille 1** (32 × 22) générée à chaque essai ;
un pilote automatique va tuer tout ce qui vit, en frappant le plus proche. Sauf mention, la foreuse est **sans équipement** et reçoit une
vie d'essai très haute : on mesure les **dégâts encaissés**, sans que la mort n'arrête le combat. Environ 60 000 combats en tout,
120 à 200 par configuration ; données brutes dans `banc/archives/2026-11-15/`, tableaux complets dans l'onglet Archives du banc.

### Ce que coûte un ennemi

| Espèce | Ancien coût (duels) | Coût de base | Pression | Par tête à 6, calmes | Par tête à 6, en alerte |
|---|---|---|---|---|---|
| Insectoïde | 4 | 3,3 | 0,15 | 3,5 | 3,9 |
| Cafar | 5 | 2 | 0,3 | 2,4 | 2,8 |
| Siphon | 3 | 1,1 | 0,31 | 1,7 | 4,1 |
| Gluar | 12 | 5,7 | 0,67 | 8,7 | 14,3 |
| Crachin | 15 | 4,9 | 1,12 | 12,5 | 23,8 |
| Crabos | 15 | 7,3 | 0,86 | 11,6 | 26,4 |
| Vipérin | 20 | 10,8 | 0,57 | 12,4 | 21,3 |
| Taupar | 23 | 16,7 | 0,63 | 19,5 | 25,6 |
| Tapi | 26 | 27,1 | 0,49 | 28,4 | 29,1 |
| Mastok | 52 | 46 | 1,51 | 59,1 | 103,3 |

- **Coût de base** : points de vie perdus par individu quand on les prend un à un, sans qu'ils soient avertis (la foreuse a souvent le
  premier coup, par surprise). Les anciens coûts venaient de duels où l'ennemi chargeait déjà : ils étaient trop hauts pour presque tous.
- **Pression** : ce que la foule ajoute. À 24 crabos sur la carte, chacun coûte 25 points au lieu de 7 ; à 24 crachins, 36 au lieu de 5.
  Le Tapi, lui, coûte le même prix seul ou à quatorze : c'est son embuscade qui fait mal, pas le nombre.
- **En alerte** (tous convergent d'emblée), le coût par tête double à six pour les crabos, les crachins et les mastoks.

### Le modèle

    menace = terrain × [ Σ effectif × coût  +  (704 / surface) × ( Σ effectif × pression )² ]

Vérifié sur des **groupes mixtes** (série 4, terrain neutre) : l'écart entre prévu et mesuré reste sous 15 %, là où une simple somme
des coûts se trompait du simple au triple (mélange Marécage × 3 : 776 points mesurés, 746 prévus, 282 par la somme simple).

**Terrain** (mêmes ennemis, relief du biome au lieu du Plateau) : Marécage 0,87 · Hautes herbes 0,92 · Failles 0,95 · Pierrier 1,3 ·
Galeries 0,5. Les Galeries sont le cas mal couvert : leurs couloirs protègent d'autant plus que la foule est grande (de 0,85 à 0,3) ;
0,5 est juste vers le niveau 3, trop bas avant, trop haut après.

### Le budget tient-il ?

Dégâts mesurés ÷ budget visé, pour la faune que le jeu pose à chaque niveau (1 = pile sur le budget), niveaux 1 à 5 :

| Biome | N1 | N2 | N3 | N4 | N5 |
|---|---|---|---|---|---|
| Plateau | 0,95 | 1,09 | 1,08 | 1,07 | 1,31 |
| Marécage | 0,61 | 1,04 | 0,92 | 0,97 | 0,97 |
| Hautes herbes | 1,09 | 1,13 | 1,06 | 1,00 | 1,04 |
| Galeries | 1,69 | 1,12 | 0,95 | 0,75 | 0,55 |
| Pierrier | 1,33 | 0,94 | 1,01 | 1,02 | 0,84 |
| Failles | 0,48 | 0,75 | 1,32 | 1,07 | 0,91 |

Avant ce réglage, les mêmes niveaux allaient de 0,56 à 2,9. Restent hors des clous : les Galeries (voir plus haut), le Plateau au
niveau 5 (33 ennemis sur 704 cases : la pression est sous-estimée dans une telle cohue) et les tout petits budgets, où l'arrondi à
trois ou quatre ennemis pèse lourd. Ce dernier point est propre à la taille 1 : en taille 3 les effectifs sont cinq fois plus grands.

### Ce que ça veut dire en partie

Même faune, vie normale. Victoires en tuant tout, foreuse **nue / équipée** (Scie circulaire, Châssis renforcé, Gyroscope, Viseur laser,
Stabilisateur), puis part des **traversées** réussies (aller au site en se défendant seulement, foreuse nue) :

| Biome | N1 | N2 | N3 | N4 | N5 |
|---|---|---|---|---|---|
| Plateau | 100 / 100 / 100 | 87 / 100 / 89 | 43 / 98 / 59 | 6 / 79 / 32 | 1 / 42 / 14 |
| Marécage | 100 / 100 / 100 | 89 / 100 / 99 | 43 / 99 / 86 | 14 / 92 / 50 | 1 / 76 / 40 |
| Hautes herbes | 100 / 100 / 100 | 98 / 100 / 100 | 19 / 92 / 100 | 0 / 38 / 99 | 0 / 0 / 86 |
| Galeries | 97 / 100 / 98 | 76 / 100 / 78 | 45 / 99 / 65 | 41 / 92 / 64 | 56 / 88 / 58 |
| Pierrier | 98 / 100 / 99 | 95 / 99 / 92 | 48 / 98 / 62 | 8 / 88 / 44 | 6 / 82 / 30 |
| Failles | 100 / 100 / 100 | 99 / 100 / 98 | 20 / 93 / 48 | 5 / 92 / 29 | 1 / 88 / 27 |

Lecture : tout nettoyer sans équipement n'est tenable qu'aux niveaux 1 et 2 ; équipée, la foreuse tient jusqu'au niveau 4 et commence
à tomber au niveau 5. Traverser sans chercher le combat reste possible plus longtemps, surtout dans les Hautes herbes où les tapis ne
frappent que si l'on passe à leur contact. C'est une carte de taille 1, où tout se rejoint vite : en taille 3 il y a de la place
pour contourner.

### Après le retour de l'insectoïde fuyant (15 novembre 2026, soir)

L'insectoïde recule de nouveau au contact et ne se bat que si la foreuse est engagée ou le frappe. Seul, il ne coûte plus que **1,3** point par
tête (3,3 avant) ; mêlé à des ennemis qui chassent, rien ne change : le mélange du Plateau donne 43 points (48 avant) et son double 139
(131 avant), dans le bruit de la mesure. Le coût de menace de 3,3 est donc gardé : il vaut pour l'insectoïde en compagnie, son cas normal.

### Limites

- Le pilote est simple : il fonce sur le plus proche, n'utilise ni la course, ni la discrétion, ni les consommables, ne fuit jamais.
- Le coût ne compte que les points de vie : ni l'énergie volée par le Siphon, ni la glu du Gluar. Leur coût mesuré est donc bas, et un
  monde qui n'aurait qu'eux en recevrait énormément.
- Les coefficients de terrain ne valent que pour les six biomes d'origine ; un archétype enregistré vaut 1.
- Les coûts ne suivent pas les retouches du Bestiaire : il faut relancer les séries après un changement de stats.

## Après la reprise des stats réglées en jeu (16 novembre 2026)

Les valeurs du joueur ont été recopiées dans le code : **crabos** 30 PV / 65 préc. / 0 esq. (au lieu de 25 / 70 / 15),
**cafar** 15 PV / 50 préc. / 10 esq. (au lieu de 10 / 60 / 0), **crachin** vitesse 3, **taupar** et **mastok** vitesse 4.

Les duels d'équipement rejoués avec ces valeurs donnent **96 à 100 % de victoires** pour chaque objet sur le combat de
référence (2 crabos + 1 vipérin), contre 80 à 100 % dans le tableau ci-dessus : le crabos, privé de son esquive et moins
précis, est devenu nettement moins dangereux malgré ses 5 PV de plus. L'écart entre les armes spéciales et le reste de
l'équipement s'écrase donc : la mesure ne sépare plus grand-chose.

Le tableau ci-dessus n'est pas remplacé : il faudrait un combat de référence plus dur pour que la comparaison garde du
sens, et les coûts de menace du banc sont à reprendre en même temps — l'utilisateur a demandé le 15 novembre d'attendre,
les stats bougeant encore.

## Passage au modèle Brogue (16 novembre 2026)

Défense multiplicative, dégâts en fourchette, POW requis (voir `conception.md` § 6). Conversion voulue **à puissance
égale** : un duel contre un seul ennemi, foreuse sans équipement, pilote « chasse », 300 essais (1 000 pour le mastok).

| Ennemi | Vie perdue avant | Vie perdue après | Battements avant → après |
|---|---|---|---|
| Insectoïde | 1,4 | 2,5 | 20 → 21 |
| Crabos | 8,8 | 8,5 | 12 → 12 |
| Crachin | 11,3 | 10,7 | 16 → 16 |
| Vipérin | 14,2 | 14,2 | 11 → 12 |
| Gluar | 9,6 | 10,8 | 12 → 13 |
| Siphon | 2,0 | 2,3 | 10 → 11 |
| Tapi | 26,0 | 27,5 | 12 → 12 |
| Taupar | 19,7 | 21,3 | 15 → 15 |
| Mastok | 51,5 | 57,4 | 16 → 16 |

Les duels restent proches. La légère hausse (surtout le mastok, +11 %) vient de la fourchette : avec des dégâts fixes de
10, il fallait exactement 6 coups pour 60 PV ; avec 7-13, il en faut parfois 7. Les coûts de menace (`MENACE_ESP`) n'ont
pas été recalculés, l'écart restant dans le bruit de leur mesure. Cafar et brochon : non mesurables seuls sur l'arène.
Détection et fuite (`simul.py`) : inchangées, ce changement n'y touche pas.

## Nouvelles stats de base (16 novembre 2026, soir)

Précision 100 (80 avant), POW 10 (1 avant, seuils et pénalités remis à l'échelle), DEF 10 apportée par la Coque d'usine
équipée au départ (12 de base avant). Mêmes duels, 300 essais, foreuse avec son équipement de départ.

| Ennemi | Vie perdue (modèle Brogue, précision 80) | Vie perdue (précision 100) | Battements |
|---|---|---|---|
| Insectoide | 2,5 | 1,7 | 21 → 20 |
| Crabos | 8,5 | 7,6 | 12 → 12 |
| Crachin | 10,7 | 9,8 | 16 → 15 |
| Viperin | 14,2 | 11,1 | 12 → 10 |
| Gluar | 10,8 | 9,7 | 13 → 13 |
| Siphon | 2,3 | 1,7 | 11 → 10 |
| Tapi | 27,5 | 24 | 12 → 12 |
| Taupar | 21,3 | 16,3 | 15 → 14 |
| Mastok | 62,2 | 49,5 | 16 → 15 |

La foreuse touche plus souvent, donc les combats sont plus courts et coûtent moins de vie : le jeu est plus facile
qu'avant ce changement, c'est voulu par la demande. Coûts de menace non recalculés.

## Dégâts de la foreuse en 1d6+5 (17 novembre 2026)

La foreuse ne fait plus DEG 10 étalé de ±30 % (7-13, moyenne 10) mais **1d6+5** (6 à 11, moyenne 8,5, chaque valeur une
fois sur six). Mêmes duels, 300 essais, foreuse avec son équipement de départ.

| Ennemi | Vie perdue (DEG 10, 7-13) | Vie perdue (1d6+5) | Battements |
|---|---|---|---|
| Insectoide | 1,7 | 2,8 | 20 → 20 |
| Crabos | 7,6 | 8 | 12 → 11 |
| Crachin | 9,8 | 10,7 | 15 → 15 |
| Viperin | 11,1 | 12,6 | 10 → 11 |
| Gluar | 9,7 | 11,1 | 13 → 13 |
| Siphon | 1,7 | 2,1 | 10 → 11 |
| Tapi | 24 | 25 | 12 → 12 |
| Taupar | 16,3 | 19,2 | 14 → 14 |
| Mastok | 49,5 | 58,1 | 15 → 16 |

Les combats coûtent **15 à 20 % de vie en plus**, pour une moyenne de dégâts en baisse de 15 % : la foreuse met un coup
de plus à abattre les grosses cibles et encaisse d'autant. Le mastok (60 PV) passe de 6 à 7 coups. Toujours 100 % de
victoires en duel : c'est l'attrition qui monte, pas le risque de perdre un combat isolé.

## Les quatre bêtes restantes (17 novembre 2026)

Après le retrait de six espèces, duel contre un seul ennemi, foreuse avec son équipement de départ, 300 essais.

| Ennemi | Vie perdue | Battements |
|---|---|---|
| Insectoïde | 2,4 | 20 |
| Crabos | 9 | 11 |
| Mastok | 58,3 | 16 |
| Brochon | 0 | 0 |

Le brochon ne quitte jamais l'eau : sur l'arène sèche il n'attaque pas, et le cafar ne se mesure pas seul (il va en
bande). Ces deux-là demandent une carte avec de l'eau et une bande pour être évalués.

## Piège de méthode

Une mesure à longue distance exige de **dégager toute la carte**. Un relief laissé au hasard coupe la
ligne de vue et fausse le résultat sans rien signaler : c'est arrivé le 13 novembre 2026, où un test
ne dégageait que 12 cases autour de la foreuse et laissait croire à une perte de contact à 15 cases.
Prévoir aussi assez d'essais : un seul tirage ne dit rien d'une règle à 3 %.
