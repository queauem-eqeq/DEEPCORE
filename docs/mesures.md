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

### Avec la fouille de 20 battements (18 novembre 2026, soir)

Depuis le 18 novembre 2026 l'ennemi ratisse la zone avant d'oublier ; la fouille passe ce soir de 30 à 20 battements.
« Semée » compte désormais le temps de fouille, d'où des durées plus longues que dans les tableaux ci-dessus. 40 essais par cas.

| Situation | En marchant | En courant |
|---|---|---|
| Terrain dégagé, 4 cases d'avance | jamais semée | 43 %, en 47 tours |
| Terrain dégagé, 12 cases d'avance | 43 %, en 44 tours | à tous les coups, en 50 tours |
| Terrain dégagé, 21 cases d'avance | à tous les coups, en 41 tours | — |
| Herbes hautes, en ligne droite | 85 %, en 27 tours | à tous les coups, en 29 tours |
| Herbes hautes, en zigzag | à tous les coups, en 24 tours | — |
| Ouverture dans un mur, puis obliquer | 45 %, en 31 tours | 95 %, en 30 tours |
| La même, avec 12 cases d'avance | 68 %, en 37 tours | — |
| Zone de rochers épars | jamais semée | — |

Détection inchangée (portée 10, repérée à tous les coups jusqu'à 8 cases, jamais à 11). La fuite est bornée à 55 tours :
une partie des « non semée » sont des fouilles encore en cours à la fin de l'essai.

### Ce que ces chiffres disent

- **De près, à découvert, on ne sème personne.** Le crabos va aussi vite que la foreuse (vitesse 5
  contre 5) et la puce plus vite encore : l'écart ne grandit jamais, la bête reste dans le cercle,
  et la règle des 3 % ne s'applique pas. Il n'y a pas d'issue sans terrain.
- **De loin, à découvert, oui.** Avec une douzaine de cases d'avance, la bête est hors du cercle : les
  3 % mordent et elle finit par renoncer. C'est le seul cas où fuir tout droit fonctionne.
- **Les herbes hautes sont le meilleur abri du jeu**, parce que celles qu'on ne couche pas bloquent la
  vue. Zigzaguer évite de laisser derrière soi un couloir d'herbes couchées bien dégagé.
- **Les rochers épars ne cachent pas** : ils gênent la foreuse plus qu'ils ne coupent la ligne de vue.
- **La course change la donne** : de près et à découvert, on sème maintenant un crabos un peu moins
  d'une fois sur deux, au prix de toute l'énergie (donc sans pouvoir frapper ensuite). Avec un abri à
  portée, la course suffit presque toujours. Contre une puce (vitesse 6), l'avance gagnée est
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
> retiré ce jour-là avec la descente (`conception-carte.md` § 3 bis). Elles restent utiles pour comparer la dangerosité des espèces.

## Banc de combat : coût et pression par espèce (15 novembre 2026)

Mesures faites sur le **banc de combat** (`outils/banc.py` l'assemble, `outils/banc_series.py` lance les séries ; artefact
https://claude.ai/artifact/9BKRaoB4hzgdWhzYFx5A6q). Le vrai moteur tourne sur une **carte de taille 1** (32 × 22) générée à chaque essai ;
un pilote automatique va tuer tout ce qui vit, en frappant le plus proche. Sauf mention, la foreuse est **sans équipement** et reçoit une
vie d'essai très haute : on mesure les **dégâts encaissés**, sans que la mort n'arrête le combat. Environ 60 000 combats en tout,
120 à 200 par configuration ; données brutes dans `banc/archives/2026-11-15/` (effacées du dépôt le 22 novembre 2026, toujours dans l'historique git).

### Ce que coûte un ennemi

| Espèce | Ancien coût (duels) | Coût de base | Pression | Par tête à 6, calmes | Par tête à 6, en alerte |
|---|---|---|---|---|---|
| Puce | 4 | 3,3 | 0,15 | 3,5 | 3,9 |
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

### Après le retour de la puce fuyante (15 novembre 2026, soir)

La puce recule de nouveau au contact et ne se bat que si la foreuse est engagée ou le frappe. Seule, elle ne coûte plus que **1,3** point par
tête (3,3 avant) ; mêlé à des ennemis qui chassent, rien ne change : le mélange du Plateau donne 43 points (48 avant) et son double 139
(131 avant), dans le bruit de la mesure. Le coût de menace de 3,3 est donc gardé : il vaut pour la puce en compagnie, son cas normal.

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

Défense multiplicative, dégâts en fourchette, POW requis (voir `conception-joueur.md` § 6). Conversion voulue **à puissance
égale** : un duel contre un seul ennemi, foreuse sans équipement, pilote « chasse », 300 essais (1 000 pour le mastok).

| Ennemi | Vie perdue avant | Vie perdue après | Battements avant → après |
|---|---|---|---|
| Puce | 1,4 | 2,5 | 20 → 21 |
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
| Puce | 2,5 | 1,7 | 21 → 20 |
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
| Puce | 1,7 | 2,8 | 20 → 20 |
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
| Puce | 2,4 | 20 |
| Crabot | 9 | 11 |
| Broyeur | 58,3 | 16 |
| Torpille | 0 | 0 |

La torpille ne quitte jamais l'eau : sur l'arène sèche il n'attaque pas, et le relais ne se mesure pas seul (il va en
bande). Ces deux-là demandent une carte avec de l'eau et une bande pour être évalués.

## Après les stats revues par l'utilisateur (17 novembre 2026, soir)

Bestiaire revu dans le Lab puis adopté comme norme : Puce 2-3 dégâts, PRE 80, DEF 20, CRIT 2 % ; Crabot 22 PV, 3-6
dégâts, CRIT 2 % ; Relais 3-4 dégâts ; Torpille 4-5 dégâts, PRE 80, DEF 20 ; Broyeur CRIT 0 %. Duel contre un seul
ennemi, 300 essais.

| Ennemi | Vie perdue (avant) | Vie perdue (après) | Battements |
|---|---|---|---|
| Puce | 2,4 | 1,9 | 20 → 19 |
| Crabot | 9 | 7,1 | 11 → 11 |
| Broyeur | 58,3 | 48,7 | 16 → 16 |

Chaque duel coûte 15 à 20 % de vie en moins : le Crabot perd 8 PV et le Broyeur son critique, et les deux espèces
rapides touchent plus souvent mais pour moins cher. Relais et Torpille ne se mesurent pas en duel sur l'arène sèche.

## Parois adjacentes plafonnées à −2 (18 novembre 2026)

`WALL_MAX` passe de 4 à 2 : 1 ou 2 parois voisines retirent 1 au rayon, 3 et plus en retirent 2. Attendre dans un
recoin donne donc **3** au lieu de 2. `simul.py` après le changement : détection et fuite **inchangées** — les scènes
mesurées se jouent en terrain dégagé ou en herbes hautes, où aucune paroi ne touche la foreuse. La zone de rochers
épars reste « jamais semée » : ces rochers gênent la foreuse plus qu'ils ne coupent la ligne de vue, le plafond n'y
change rien.

## Piège de méthode

Une mesure à longue distance exige de **dégager toute la carte**. Un relief laissé au hasard coupe la
ligne de vue et fausse le résultat sans rien signaler : c'est arrivé le 13 novembre 2026, où un test
ne dégageait que 12 cases autour de la foreuse et laissait croire à une perte de contact à 15 cases.
Prévoir aussi assez d'essais : un seul tirage ne dit rien d'une règle à 3 %.

## Génération, bâtiments et faune (chiffres déplacés de `conception.md`, 20 novembre 2026)

Jusqu'au 20 novembre 2026, ces mesures vivaient dans `conception.md`, mêlées aux règles. Elles sont regroupées ici ;
la date de chaque mesure est celle à laquelle elle a été prise, avec le jeu de ce jour-là.

### Terrain

- **Lacs** (15 novembre, 12 cartes) : 94 étendues d'eau — 23 % sans eau profonde, 7 % entièrement profondes,
  70 % mêlées.
- **Bord de carte irrégulier** : environ 17 % de la surface, jamais plus de 19 % (le tirage est refait sinon).
- **Texture du sol** (16 novembre) : 70 à 100 ms à la génération, rien de plus à l'affichage.

### Patrouilles et fouille

- **Styles de patrouille** (19 novembre, 220 battements) : affût 0 case parcourue ; sentinelle 26 pas ; territoire
  68 pas dans 9 cases d'envergure ; ronde 108 pas dans 12 cases ; voyage 53 cases d'envergure.
- **Errance** (20 novembre, 300 battements) : 0,67 pas par battement, 1 % de demi-tours.
- **Échange de places** (20 novembre) : deux groupes de cinq en ronde face à face, 400 battements, couloir d'une
  case puis de deux — aucun battement figé, 5 à 6 traversées par groupe (le maximum possible). Avec le seul
  demi-tour : aucun blocage, mais aucune traversée.
- **Fouille** (18 novembre) : 6,6 ms par battement avec 20 ennemis en fouille sur une grande carte dégagée — cas
  extrême, ils sont d'ordinaire une poignée.

### Bâtiments

- **Surface bâtie** (19 novembre) : 10 % demandés donnent 10-11 %, 20 % donnent 18 %, 30 % donnent 26 %. Le soir,
  après l'élargissement à 70 % : 30 % donnent 25 %, 50 % donnent 40 %, 70 % donnent 67 % (le terrain enfermé entre
  les murs, changé en mur plein, compte).
- **Emplacement** (19 novembre, 40 cartes) : le mur le plus proche est à 5 à 45 cases du départ, à moins de
  10 cases une fois sur cinq.
- **Pièces étroites** (20 novembre, 15 cartes) : la part du sol bâti large de moins de 3 cases passe de 28 % à
  10 % après l'élargissement des formes. Ce qui reste : les couloirs, voulus étroits, et les cavernes.
- **Pièces secrètes** (19 novembre) : 1,4 en moyenne pour 2 demandées, faute de culs-de-sac et de massifs de mur.
- **Clés** (19 novembre, 25 cartes) : 17 serrures, 17 clés. Une porte enferme le site de forage sur environ une
  carte sur deux.
- **Artefacts** (20 novembre, 20 cartes aux réglages par défaut) : 1 antenne, 2 terminaux, 2 pièces d'herbe et
  9 machines par carte en moyenne. Sur 40 cartes : aucune case rendue inaccessible par un obstacle.

### Refonte du niveau 1 (20 novembre 2026)

- **60 cartes de taille 4** : un complexe et un réseau de tunnels à chaque fois ; zone extérieure 50 à 69 % (59 en
  moyenne) ; 152 à 348 cases de tunnel (254 en moyenne) ; 3 à 16 pièces (10 en moyenne) ; de la sortie de tunnel la
  plus proche à la porte, 40 à 97 pas (63 en moyenne) ; du vaisseau à la porte, 68 à 162 pas (109 en moyenne) ;
  génération en 116 ms en moyenne.
- **Petites cartes**, avec les réglages de l'utilisateur (eau 60, avant-poste, 3 pièces, surface bâtie 6 %) :
  40 complexes enfouis sur 40 en tailles 2, 3 et 4. En taille 1 (32 × 22) il n'y a pas la place : aucune structure.
- **Menu par recette**, 40 cartes par ligne (`outils/scripts/mesure-recettes.js`) :

| Série | Complexes | Tunnels (moyenne) | Sorties | Extérieur | Vaisseau dehors |
|---|---|---|---|---|---|
| défaut, taille 2 | 40/40 | 69 | 1,1 | 59 % | 40/40 |
| défaut, taille 3 | 40/40 | 150 | 1,6 | 60 % | 40/40 |
| défaut, taille 4 | 40/40 | 230 | 1,6 | 59 % | 40/40 |
| curseurs au minimum, taille 2 | 40/40 | 34 | 1,0 | 64 % | 40/40 |
| curseurs au maximum, taille 4 | 40/40 | 264 | 1,3 | 36 % | 40/40 |
| un côté, taille 4 | 40/40 | 241 | 1,4 | 59 % | 40/40 |
| un coin, taille 4 | 40/40 | 243 | 1,6 | 59 % | 40/40 |
| classique, tailles 2 et 4 | 40/40 | 0 | — | — | 40/40 |

- **Réglages au hasard** (40 tirages) : complexe présent 40 fois sur 40, les huit combinaisons forme × archétype
  sorties, aucune erreur.
- **Ce que ces chiffres disent** : les sorties demandées ne sont pas toutes creusées (1,4 à 1,6 pour 2 demandées),
  et demander 400 cases de tunnel n'en donne que 230 à 260 — complexe et tunnels se partagent le massif.

## Nuit du 21 novembre 2026 : ambiances, machines, ennemis, mini-jeu

Tout est mesuré en **taille 3** (72 × 48), dans le vrai moteur. Détection et fuite relancées (`outils/simul.py`) : inchangées.

### Ambiances : quinze cartes par ambiance (`outils/scripts/mesure-ambiances.js`)

Pourcentages de la carte entière. « machines » compte toutes les cases de décor et de machine. Site accessible partout.

```
== atterrissage
Grande prairie               accès 15/15 · ouvert 45 % · eau  5 % · gouffre  2 % · bâti  2 % · 3.7 pièces · tunnels 148 · machines 8 · trajet 108 · sans bâtiment 0 · 132 ms
Rives du grand lac           accès 15/15 · ouvert 33 % · eau 20 % · gouffre  0 % · bâti  2 % · 2.9 pièces · tunnels 155 · machines 7 · trajet 111 · sans bâtiment 0 · 157 ms
Marais                       accès 15/15 · ouvert 40 % · eau 14 % · gouffre  0 % · bâti  2 % · 3.5 pièces · tunnels 140 · machines 9 · trajet 118 · sans bâtiment 0 · 122 ms
Désert de pierre             accès 15/15 · ouvert 49 % · eau  0 % · gouffre  1 % · bâti  2 % · 3.3 pièces · tunnels 113 · machines 7 · trajet 103 · sans bâtiment 0 · 102 ms
Terre fracturée              accès 15/15 · ouvert 38 % · eau  2 % · gouffre 11 % · bâti  2 % · 3.6 pièces · tunnels 148 · machines 9 · trajet 115 · sans bâtiment 0 · 87 ms
Chaos rocheux                accès 15/15 · ouvert 36 % · eau  2 % · gouffre  1 % · bâti  2 % · 3.3 pièces · tunnels 146 · machines 8 · trajet 104 · sans bâtiment 0 · 87 ms
Chaîne de montagnes          accès 15/15 · ouvert 33 % · eau  5 % · gouffre  2 % · bâti  2 % · 3.9 pièces · tunnels 139 · machines 9 · trajet 122 · sans bâtiment 0 · 108 ms
Forteresse sous la montagne  accès 15/15 · ouvert 30 % · eau  2 % · gouffre  1 % · bâti  8 % · 8.4 pièces · tunnels 83 · machines 24 · trajet 145 · sans bâtiment 0 · 108 ms
Dédale de tunnels            accès 15/15 · ouvert 35 % · eau  2 % · gouffre  1 % · bâti  2 % · 4.6 pièces · tunnels 231 · machines 9 · trajet 106 · sans bâtiment 0 · 96 ms
Ruines noyées                accès 15/15 · ouvert 32 % · eau 10 % · gouffre  1 % · bâti  4 % · 7.1 pièces · tunnels 144 · machines 15 · trajet 128 · sans bâtiment 0 · 105 ms
== cavernes
Grottes sauvages             accès 15/15 · ouvert 37 % · eau  4 % · gouffre  2 % · bâti  2 % · 3.7 pièces · tunnels 4 · machines 8 · trajet 76 · sans bâtiment 0 · 147 ms
Cathédrale                   accès 15/15 · ouvert 35 % · eau  2 % · gouffre  2 % · bâti  3 % · 5.3 pièces · tunnels 8 · machines 11 · trajet 72 · sans bâtiment 0 · 151 ms
Termitière                   accès 15/15 · ouvert 28 % · eau  1 % · gouffre  1 % · bâti  4 % · 6.3 pièces · tunnels 5 · machines 15 · trajet 77 · sans bâtiment 0 · 193 ms
Cité enfouie                 accès 15/15 · ouvert 20 % · eau  1 % · gouffre  1 % · bâti 11 % · 22.7 pièces · tunnels 35 · machines 31 · trajet 69 · sans bâtiment 0 · 207 ms
Avant-postes                 accès 15/15 · ouvert 26 % · eau  3 % · gouffre  1 % · bâti  3 % · 9.9 pièces · tunnels 11 · machines 12 · trajet 82 · sans bâtiment 0 · 164 ms
Lac souterrain               accès 15/15 · ouvert 23 % · eau 23 % · gouffre  0 % · bâti  3 % · 4.8 pièces · tunnels 11 · machines 11 · trajet 72 · sans bâtiment 0 · 121 ms
Jardins engloutis            accès 15/15 · ouvert 36 % · eau  4 % · gouffre  0 % · bâti  3 % · 5.9 pièces · tunnels 8 · machines 12 · trajet 80 · sans bâtiment 0 · 274 ms
Abîmes                       accès 15/15 · ouvert 35 % · eau  0 % · gouffre  5 % · bâti  3 % · 5.1 pièces · tunnels 8 · machines 12 · trajet 87 · sans bâtiment 0 · 103 ms
Dédale de boyaux             accès 15/15 · ouvert 18 % · eau  1 % · gouffre  0 % · bâti  3 % · 7.2 pièces · tunnels 9 · machines 14 · trajet 90 · sans bâtiment 0 · 167 ms
Bunker                       accès 15/15 · ouvert 16 % · eau  1 % · gouffre  1 % · bâti 14 % · 20.0 pièces · tunnels 3 · machines 35 · trajet 98 · sans bâtiment 0 · 388 ms
Chaos d’éboulis              accès 15/15 · ouvert 35 % · eau  1 % · gouffre  0 % · bâti  2 % · 3.6 pièces · tunnels 3 · machines 8 · trajet 97 · sans bâtiment 0 · 89 ms
== base
Citadelle                    accès 15/15 · ouvert 14 % · eau  1 % · gouffre  1 % · bâti 15 % · 21.1 pièces · tunnels 137 · machines 49 · trajet 109 · sans bâtiment 0 · 332 ms
Ruche                        accès 15/15 · ouvert 15 % · eau  1 % · gouffre  1 % · bâti 13 % · 31.1 pièces · tunnels 170 · machines 42 · trajet 98 · sans bâtiment 0 · 130 ms
Deux ailes                   accès 15/15 · ouvert 12 % · eau  1 % · gouffre  1 % · bâti 15 % · 25.3 pièces · tunnels 74 · machines 46 · trajet 98 · sans bâtiment 0 · 106 ms
Complexe piégé               accès 15/15 · ouvert 13 % · eau  1 % · gouffre  1 % · bâti 15 % · 21.4 pièces · tunnels 98 · machines 57 · trajet 113 · sans bâtiment 0 · 244 ms
Base morte                   accès 15/15 · ouvert 15 % · eau  3 % · gouffre  1 % · bâti 12 % · 17.6 pièces · tunnels 104 · machines 32 · trajet 87 · sans bâtiment 0 · 241 ms
Galeries de mine             accès 15/15 · ouvert 13 % · eau  1 % · gouffre  1 % · bâti  9 % · 17.9 pièces · tunnels 102 · machines 31 · trajet 89 · sans bâtiment 0 · 71 ms
Serres                       accès 15/15 · ouvert 22 % · eau  3 % · gouffre  0 % · bâti  9 % · 14.4 pièces · tunnels 71 · machines 32 · trajet 84 · sans bâtiment 0 · 320 ms
Réservoirs                   accès 15/15 · ouvert 14 % · eau 11 % · gouffre  0 % · bâti 12 % · 17.3 pièces · tunnels 120 · machines 41 · trajet 110 · sans bâtiment 0 · 255 ms
Blockhaus                    accès 15/15 · ouvert 12 % · eau  1 % · gouffre  1 % · bâti 16 % · 33.6 pièces · tunnels 44 · machines 50 · trajet 134 · sans bâtiment 0 · 163 ms
Hangars de maintenance       accès 15/15 · ouvert 14 % · eau  1 % · gouffre  1 % · bâti 14 % · 15.3 pièces · tunnels 84 · machines 47 · trajet 95 · sans bâtiment 0 · 264 ms
== classique
Avant-poste isolé            accès 15/15 · ouvert 52 % · eau  7 % · gouffre  2 % · bâti  2 % · 3.9 pièces · tunnels 0 · machines 8 · trajet 66 · sans bâtiment 0 · 75 ms
Citadelle                    accès 15/15 · ouvert 29 % · eau  0 % · gouffre  0 % · bâti 22 % · 27.1 pièces · tunnels 0 · machines 48 · trajet 115 · sans bâtiment 0 · 79 ms
Bases jumelles               accès 15/15 · ouvert 43 % · eau  3 % · gouffre  2 % · bâti 11 % · 18.5 pièces · tunnels 0 · machines 31 · trajet 107 · sans bâtiment 0 · 138 ms
Hangars                      accès 15/15 · ouvert 45 % · eau  1 % · gouffre  0 % · bâti 15 % · 14.0 pièces · tunnels 0 · machines 38 · trajet 78 · sans bâtiment 0 · 84 ms
Ruines sous les herbes       accès 15/15 · ouvert 53 % · eau  4 % · gouffre  2 % · bâti  8 % · 10.5 pièces · tunnels 0 · machines 23 · trajet 78 · sans bâtiment 0 · 78 ms
Station lacustre             accès 15/15 · ouvert 24 % · eau 37 % · gouffre  0 % · bâti  4 % · 7.5 pièces · tunnels 0 · machines 16 · trajet 69 · sans bâtiment 0 · 111 ms
Plateau désert               accès 15/15 · ouvert 61 % · eau  0 % · gouffre  1 % · bâti  4 % · 4.0 pièces · tunnels 0 · machines 12 · trajet 70 · sans bâtiment 0 · 157 ms
Champ de failles             accès 15/15 · ouvert 41 % · eau  2 % · gouffre 20 % · bâti  4 % · 5.7 pièces · tunnels 0 · machines 16 · trajet 63 · sans bâtiment 0 · 105 ms
Cols de montagne             accès 15/15 · ouvert 25 % · eau  3 % · gouffre  2 % · bâti  3 % · 6.1 pièces · tunnels 0 · machines 13 · trajet 67 · sans bâtiment 0 · 129 ms
Marécage                     accès 15/15 · ouvert 43 % · eau 25 % · gouffre  0 % · bâti  3 % · 5.8 pièces · tunnels 0 · machines 13 · trajet 54 · sans bâtiment 0 · 84 ms
```

### Machines de la grande base (`outils/scripts/test-machines.js`, 150 cartes)

Par carte, fréquences du Lab au cran du milieu : ponts 1,5 · tourelles 2,1 salles · croix 1,3 salle · piles 0,7 ·
station 0,7 · fabricateur 1,0. Site accessible sur 150 cartes sur 150 ; 22 vérifications de comportement réussies.

### Valeur des groupes au banc (`outils/valeur_groupes.py`, 40 combats par effectif)

Foreuse de série, vie d'essai 1000, groupe en assaut, arène dégagée (marécage pour les torpilles). Valeur = moyenne ÷ 4.

| Groupe | Vie perdue (min) | (max) | Moyenne | Valeur mesurée | Valeur retenue | Avant |
|---|---|---|---|---|---|---|
| Family | 27,3 | 32,6 | 30,0 | 7 | 7 | 4 |
| 3-5 puces + sentinelles | 17,7 | 43,4 | 30,5 | 8 | 8 | 5 |
| 1-2 Mines | 3,0 | 7,0 | 5,0 | 1 | 3 (surprise) | 4 |
| Mines & Sentinelles | 11,1 | 15,1 | 13,1 | 3 | 5 (surprise) | 4 |
| Bande de relais | 7,2 | 19,1 | 13,2 | 3 | 5 (alerte) | 6 |
| 2-3 sentinelles | 9,1 | 14,4 | 11,8 | 3 | 3 | 5 |
| Crabots | 7,1 | 15,2 | 11,1 | 3 | 3 | 3 |
| Banc de torpilles | 7,1 | 17,1 | 12,1 | 3 | 3 | 5 |
| Broyeur solitaire | 43,5 | 47,7 | 45,6 | 11 | 11 | 10 |
| Puces en groupes | 36,2 | 89,5 | 62,9 | 16 | 16 | 15 |
| Poste de garde | 35,9 | 40,1 | 38,0 | 10 | 10 | nouveau |
| Batterie | 29,2 | 77,3 | 53,2 | 13 | 13 | nouveau |
| Essaim de drones | 8,3 | 19,0 | 13,7 | 3 | 3 | nouveau |
| Escouade de réparation | 25,3 | 22,9 | 24,1 | 6 | 6 | nouveau |
| Embuscade gluante | 6,4 | 12,1 | 9,2 | 2 | 4 (glu, surprise) | nouveau |
| Chasse à courre | 9,8 | 20,3 | 15,1 | 4 | 6 (glu, alerte) | nouveau |
| Convoi | 46,3 | 45,4 | 45,8 | 11 | 11 | nouveau |
| Tireurs embusqués | 10,8 | 31,2 | 21,0 | 5 | 5 | nouveau |
| Ronde de drones | 9,2 | 7,0 | 8,1 | 2 | 2 | nouveau |

Par espèce, seule, en assaut : puce 1,6 · crabot 8,7 · relais 2,9 · broyeur 47 · mine 6 · sentinelle 3,1 · gardien 28
(48 avant réglage) · artilleur 11 · drone 1,3 · soudeur 1,6 · englueur 3,5. Le banc sous-estime ce qui ne blesse pas
directement : son pilote fonce sur tout et ne fuit jamais.

### Peuplement : vingt cartes par niveau (`outils/scripts/mesure-faune.js`)

**21 novembre 2026, soir — répartition directe par lieu** (12 cartes par niveau, ambiances au hasard). Budget dépensé : 79 / 95 / 111 aux niveaux 1 / 2 / 3 (65 / 81 / 112 avec les anciennes densités, qui laissaient une part du budget inemployée aux niveaux 1 et 2). Part dépensée extérieur / bâti / tunnels : 77 / 18 / 5, 83 / 17 / 1, 34 / 61 / 5. Les chiffres ci-dessous datent d'avant ce changement.

```
== atterrissage (niveau 1) : budget 45.0, dépensé 35.2 · 7.2 groupes · 21.1 créatures par carte
   par lieu : ext 16.3 créatures sur 1334.7 cases (1.2 pour 100 cases, budget 28.6) · bati 4.0 créatures sur 116.2 cases (3.5 pour 100 cases, budget 5.0) · tunnel 0.7 créatures sur 148.4 cases (0.5 pour 100 cases, budget 1.6)
   espèces : Puce 4.0 · Relais 3.7 · Crabot 3.5 · Drone 3.0 · Sentinelle 2.3 · Mine 1.1 · Artilleur 0.9 · Englueur 0.9 · Torpille 0.9 · Soudeur 0.6 · Gardien 0.1
   groupes : Crabots 1.3 · Tireurs embusqués 0.7 · Bande de relais 0.7 · Chasse à courre 0.6 · Escouade de réparation 0.6 · Banc de torpilles 0.5 · 2-3 sentinelles 0.5 · Essaim de drones 0.5 · Ronde de drones 0.5 · Puces en groupes 0.3 · Family 0.3 · 3-5 puces + sentinelles 0.3 · 1-2 Mines 0.2 · Embuscade gluante 0.2 · Poste de garde 0.1
== cavernes (niveau 2) : budget 54.0, dépensé 46.4 · 8.8 groupes · 26.4 créatures par carte
   par lieu : ext 19.0 créatures sur 1082.5 cases (1.8 pour 100 cases, budget 36.0) · bati 7.3 créatures sur 154.1 cases (4.8 pour 100 cases, budget 10.3) · tunnel 0.0 créatures sur 9.5 cases (0.0 pour 100 cases, budget 0.0)
   espèces : Puce 7.3 · Drone 3.6 · Relais 3.4 · Crabot 3.2 · Sentinelle 3.0 · Mine 1.4 · Artilleur 1.3 · Torpille 1.2 · Englueur 1.1 · Soudeur 0.8 · Gardien 0.1
   groupes : Crabots 1.0 · 3-5 puces + sentinelles 0.9 · Banc de torpilles 0.8 · Escouade de réparation 0.8 · Ronde de drones 0.8 · Chasse à courre 0.7 · Tireurs embusqués 0.6 · Bande de relais 0.6 · Essaim de drones 0.6 · Puces en groupes 0.5 · 2-3 sentinelles 0.5 · 1-2 Mines 0.4 · Family 0.3 · Embuscade gluante 0.3 · Batterie 0.1 · Poste de garde 0.1
== base (niveau 3) : budget 63.0, dépensé 61.1 · 12.3 groupes · 33.9 créatures par carte
   par lieu : ext 12.9 créatures sur 489.6 cases (2.6 pour 100 cases, budget 22.3) · bati 19.8 créatures sur 476.1 cases (4.2 pour 100 cases, budget 36.9) · tunnel 1.1 créatures sur 102.2 cases (1.1 pour 100 cases, budget 1.9)
   espèces : Drone 6.5 · Crabot 5.6 · Sentinelle 5.0 · Puce 3.8 · Mine 3.3 · Relais 2.5 · Englueur 2.0 · Soudeur 1.4 · Gardien 1.4 · Artilleur 1.4 · Torpille 0.9
   groupes : Crabots 2.3 · 1-2 Mines 1.1 · Embuscade gluante 1.0 · Escouade de réparation 0.9 · Ronde de drones 0.9 · 2-3 sentinelles 0.8 · Essaim de drones 0.8 · Poste de garde 0.7 · Banc de torpilles 0.6 · Convoi 0.6 · 3-5 puces + sentinelles 0.5 · Tireurs embusqués 0.5 · Chasse à courre 0.4 · Bande de relais 0.4 · Family 0.3 · Batterie 0.3 · Puces en groupes 0.2
```

### Mini-jeu des mines : douze descentes par pilote (`outils/scripts/test-forage.js`)

```
aucun pilote  : 17.5 mines semées · 5.6 touchées · −66 vie en moyenne · 2/12 foreuses détruites · 10/12 arrivées au niveau 3 · 21.9 s
maladroit     : 18.2 mines semées · 2.5 touchées · −30 vie en moyenne · 0/12 foreuses détruites · 12/12 arrivées au niveau 3 · 22.6 s
attentif      : 18.9 mines semées · 0.5 touchées · −6 vie en moyenne · 0/12 foreuses détruites · 12/12 arrivées au niveau 3 · 22.6 s
première descente : 0 mine, vie 77/100, arrivée oui, 15.4 s
25 de vie, aucun pilote : 11/12 foreuses détruites, 0 passées quand même au niveau suivant (attendu : 0)
passer avec 12 de vie : vie 1, arrivée oui, mort non
```

### Peuplement avec la référence du joueur (21 novembre 2026, 22 h 30)

Groupes et niveaux relus dans l'artefact (voir conception, « Référence du joueur »). Même script (`mesure-faune.js`),
moyennes par carte :

| Niveau | Budget dépensé | Groupes | Créatures | Extérieur / bâti / tunnels (créatures) |
|---|---|---|---|---|
| 1 (atterrissage) | 39,5 sur 45 | 5,7 | 28,2 | 23,2 / 4,0 / 1,1 |
| 2 (cavernes) | 53,0 sur 54 | 10,3 | 34,3 | 28,6 / 5,1 / 0,6 |
| 3 (base) | 62,5 sur 63 | 11,1 | 33,4 | 13,7 / 17,8 / 1,9 |

Le niveau 1 ne pose que des crabots (seul groupe permis : Large crabot groupe, 4 à 6 crabots). Le crabot est l'espèce la plus
présente aux trois niveaux (28, 10 et 9 par carte). Les valeurs de groupes ne sont plus toutes celles du banc : ce sont celles
du joueur. Essais `test-ennemis.js` : tous passent ; l'essai « navette » échoue de temps en temps selon le tirage de la carte
(1 fois sur 5 ce soir-là, y compris avant ce changement de réglages : il ne dépend pas des groupes).

### Peuplement avec la référence relue à 23 h 39 (21 novembre 2026)

| Niveau | Budget dépensé | Groupes | Créatures | Espèces les plus présentes |
|---|---|---|---|---|
| 1 (atterrissage) | 44,3 sur 45 | 10,5 | 27,3 | Relais 11,2 · Crabot 7,0 · Mine 3,9 · Puce 2,6 · Torpille 1,4 |
| 2 (cavernes) | 53,4 sur 54 | 10,8 | 34,0 | Crabot 8,2 · Drone 6,1 · Relais 5,7 · Sentinelle 5,0 · Mine 3,8 |
| 3 (base) | 62,5 sur 63 | 11,8 | 37,0 | Crabot 8,4 · Relais 5,8 · Drone 5,5 · Sentinelle 5,2 · Mine 3,5 |

Le niveau 1 n'est plus fait que de crabots : cinq groupes y sont permis, le relais y domine. `test-machines.js` met désormais
toutes les machines en service pour ses essais (la croix laser est désactivée par défaut). Ses essais de levier et de grille
échouent de temps en temps selon le tirage de la carte, avant comme après ce changement.


## Nuit du 22 novembre 2026 : machines lisibles, objets, équilibrage

Branche `claude/machines-objets-2026-11-22`. Données brutes : `banc/archives/2026-11-22/` (effacées du dépôt le 22 novembre 2026, toujours dans l'historique git).

### Machines et butin (`outils/scripts/test-machines.js`, 30 cartes de la grande base, toutes machines actives)

Site accessible 30/30, 258 ms par carte. Par carte : lasers 2,1 · croix 1,7 · salles piégées 1,0 · stations 0,7 · ponts 0,4 ·
vitrines 0,4 · piles 0,3 · fabricateur 1,0. **Les ponts et les piles sont plus rares qu'avant** (0,5 à 1,5 visés) : un pont
n'est gardé que s'il est le seul chemin ou s'il mène à un cul-de-sac, et la pile doit pouvoir être poussée jusqu'au socle
par les portes. À surveiller en jouant : monter leur fréquence (Lab → Artefacts, « + ») si on en voit trop peu.

Butin par carte, réglages de départ, dix cartes par niveau (script de mesure de la séance) :

| Niveau | Culs-de-sac garnis | Pièces secrètes garnies | Matière au sol (blocs de 15) | Plans | Modules de puissance | Capsules | Équipements | Gisements de Matière |
|---|---|---|---|---|---|---|---|---|
| 1 (atterrissage) | 6,0 | 0,3 | 3,3 | 1,5 | 1,0 | 2,7 | 0,2 | 76 |
| 2 (cavernes) | 6,0 | 0,3 | 3,4 | 1,5 | 1,0 | 3,2 | 0,4 | 78 |
| 3 (base) | 6,0 | 1,2 | 6,3 | 2,7 | 1,4 | 5,9 | 0,6 | 74 |

Soit, sans compter ce que lâchent les robots : 125 de Matière au niveau 1, 130 au niveau 2, 170 au niveau 3.

### Valeur des groupes au banc (assaut, arène dégagée, vie d'essai 1000, 120 combats par effectif)

Valeur = vie perdue en moyenne ÷ 4. La colonne « écart » signale les groupes dont le coût ne suit plus la mesure.

| Groupe | Vie perdue (mini) | Vie perdue (maxi) | Valeur mesurée | Coût actuel | Écart |
|---|---|---|---|---|---|
| Crabots | 6,3 | 14,4 | 2,6 | 3 |  |
| Large crabot groupe | 34,7 | 74,5 | 13,7 | 7 | sous-évalué |
| Bande de relais | 12,7 | 22,1 | 4,3 | 5 |  |
| Family | 26,8 | 26,3 | 6,6 | 7 |  |
| 3-5 puces + sentinelles | 19,8 | 43,9 | 8,0 | 8 |  |
| 1-2 Mines | 0,7 | 1,2 | 0,2 | 3 | surévalué |
| Mines & Sentinelles | 20,9 | 21,3 | 5,3 | 6 |  |
| 2-3 sentinelles | 8,5 | 14,6 | 2,9 | 3 |  |
| Banc de torpilles | 7,4 | 15,1 | 2,8 | 3 |  |
| Broyeur solitaire | 49,1 | 50,4 | 12,4 | 11 |  |
| Puces en groupes | 40,2 | 93,1 | 16,7 | 10 | sous-évalué |
| Poste de garde | 12,9 | 19,7 | 4,1 | 10 | surévalué |
| Batterie | 30,4 | 54,3 | 10,6 | 13 |  |
| Essaim de drones | 8,2 | 15,6 | 3,0 | 3 |  |
| Escouade de réparation | 22,5 | 22 | 5,6 | 6 |  |
| Embuscade gluante | 4 | 9,1 | 1,6 | 4 | surévalué |
| Chasse à courre | 17 | 24,5 | 5,2 | 7 |  |
| Convoi | 20,1 | 19,7 | 5,0 | 11 | surévalué |
| Tireurs embusqués | 10,3 | 31,7 | 5,2 | 5 |  |
| Ronde de drones | 8,6 | 8 | 2,1 | 2 |  |

Lecture. **Le Bloqueur fait peu de dégâts** (Poste de garde 38 → 16 de vie perdue, Convoi 46 → 20) : sa menace est
d'immobiliser, ce que l'assaut en terrain dégagé ne mesure pas. Les groupes qui le contiennent sont à rechiffrer (Poste de
garde 10 → 5, Convoi 11 → 6) ou à renforcer avec des tireurs. **Large crabot groupe** (13,7 pour 7) et **Puces en groupes**
(16,7 pour 10) sont les plus sous-évalués. Les coûts n'ont pas été changés : les groupes sont un réglage du joueur.

### Groupes contre équipements (vie réelle 100, assaut, 200 combats par case)

Vie perdue en moyenne, et entre parenthèses la part de foreuses détruites quand elle n'est pas nulle.

| Ennemis | nu | 2 réparobots | 1 batterie | 1 surrégime | trousse complète | Vrille | Carène | Viseur + stabilisateur + gyroscope |
|---|---|---|---|---|---|---|---|---|
| 4 crabots | 34 | 28 | 30 | 25 | 24 | 28 | 35 | 25 |
| 6 crabots | 72 (14 %) | 25 | 62 (10 %) | 50 (3 %) | 28 | 54 (3 %) | 70 (15 %) | 53 (5 %) |
| 4 relais | 20 | 22 | 20 | 22 | 19 | 18 | 23 | 15 |
| 7 relais (salle piégée) | 53 (4 %) | 27 | 52 (2 %) | 51 (5 %) | 26 | 39 | 53 (4 %) | 34 |
| Broyeur | 51 (3 %) | 27 | 52 (1 %) | 33 | 27 | 40 (1 %) | 51 (1 %) | 37 (1 %) |
| Broyeur + 2 crabots | 70 (15 %) | 30 | 64 (11 %) | 56 (5 %) | 26 | 61 (7 %) | 72 (18 %) | 55 (7 %) |
| Bloqueur seul | 8 | 8 | 2 | 6 | 2 | 6 | 8 | 5 |
| Bloqueur + 2 artilleurs | 52 (1 %) | 26 | 47 | 49 (1 %) | 26 | 44 | 38 | 40 |
| Bloqueur + 2 mines | 13 | 12 | 7 | 10 | 10 | 9 | 12 | 8 |
| Bloqueur + 2 sentinelles | 20 | 21 | 14 | 15 | 12 | 15 | 20 | 14 |
| 2 Bloqueurs + 3 crabots | 58 (4 %) | 26 | 53 (2 %) | 43 (1 %) | 28 | 45 | 60 (5 %) | 40 |
| 8 puces | 75 (26 %) | 29 | 73 (21 %) | 74 (22 %) | 30 | 54 (2 %) | 62 (15 %) | 55 (3 %) |
| Englueur + 4 relais | 25 | 25 | 22 | 25 | 23 | 20 | 23 | 17 |
| 2 englueurs + 2 mines | 10 | 10 | 11 | 9 | 12 | 7 | 5 | 7 |
| 3 sentinelles + 3 mines | 30 | 28 | 32 | 26 | 28 | 21 | 32 | 23 |
| Soudeur + 2 crabots | 22 | 20 | 21 | 15 | 15 | 17 | 21 | 16 |
| 5 drones | 17 | 17 | 14 | 16 | 14 | 13 | 18 | 12 |
| 2 artilleurs | 32 | 26 | 32 | 31 | 27 | 29 | 17 | 25 |

Mesuré avec la batterie à 8 dégâts et 4 battements d'étourdissement, le surrégime à 8 battements (valeurs d'avant la série
suivante). « Trousse complète » : 2 réparobots, 1 charge, 1 batterie, 1 surrégime, utilisés par le pilote (`consoPilote`,
`banc/banc.js`) ; dans cette série la charge n'était pas réellement lancée (défaut du pilote, corrigé ensuite).

### Variantes d'objets (vie réelle 100, 200 combats par case)

| Équipement | 6 crabots | Broyeur + 2 crabots | 8 puces | Bloqueur + 2 artilleurs | 2 artilleurs | 7 relais | 2 Bloqueurs + 3 crabots | 3 sentinelles + 3 mines |
|---|---|---|---|---|---|---|---|---|
| nu | 71 (15 %) | 72 (20 %) | 73 (24 %) | 52 | 30 | 49 (2 %) | 60 (2 %) | 32 |
| POW 11 | 68 (12 %) | 70 (17 %) | 71 (21 %) | 49 (1 %) | 30 | 49 (1 %) | 56 (1 %) | 30 |
| POW 12 | 70 (17 %) | 68 (12 %) | 70 (19 %) | 52 (1 %) | 29 | 47 (1 %) | 57 (1 %) | 31 |
| POW 13 | 66 (7 %) | 67 (17 %) | 66 (15 %) | 49 | 31 | 45 (1 %) | 53 (1 %) | 28 |
| Trépan P12 (2d6+4) | 62 (7 %) | 64 (17 %) | 63 (13 %) | 47 | 29 | 55 (7 %) | 54 (2 %) | 29 |
| Trépan P12 2d6+6 | 48 (1 %) | 55 (5 %) | 53 (8 %) | 44 (1 %) | 28 | 48 (4 %) | 43 | 24 |
| Trépan P12 2d6+8 | 43 (1 %) | 45 (2 %) | 46 (1 %) | 41 | 26 | 31 | 34 | 20 |
| Trépan P13 2d6+6 | 46 (2 %) | 55 (8 %) | 51 (4 %) | 42 | 27 | 43 (2 %) | 41 (1 %) | 23 |
| Vrille P10 | 52 (2 %) | 62 (8 %) | 55 (2 %) | 44 | 30 | 36 | 41 (1 %) | 21 |
| Vrille P12 | 50 (1 %) | 59 (8 %) | 52 (2 %) | 44 | 27 | 36 | 42 | 20 |
| Blindage P12 (+18,VIT-1) | 67 (15 %) | 70 (21 %) | 70 (12 %) | 75 (14 %) | 57 (1 %) | 48 (1 %) | 52 (1 %) | 32 |
| Blindage +25 VIT-1 | 61 (7 %) | 62 (9 %) | 68 (10 %) | 71 (9 %) | 52 (1 %) | 42 (1 %) | 49 | 30 |
| Blindage +18 VIT 0 | 62 (7 %) | 62 (11 %) | 66 (16 %) | 46 (1 %) | 28 | 46 (1 %) | 52 (1 %) | 29 |
| Blindage +25 VIT 0 | 61 (5 %) | 58 (9 %) | 62 (13 %) | 41 | 26 | 40 (1 %) | 47 | 26 |
| Blindage +30 VIT-1 | 58 (7 %) | 56 (7 %) | 62 (4 %) | 67 (5 %) | 52 (1 %) | 40 (1 %) | 46 (1 %) | 28 |
| Surrégime 8 | 48 (1 %) | 53 (6 %) | 72 (22 %) | 49 | 30 | 51 (4 %) | 44 (1 %) | 26 |
| Surrégime 12 | 40 (2 %) | 46 (3 %) | 74 (26 %) | 47 | 31 | 52 (3 %) | 35 (1 %) | 23 |
| Batterie 4 | 62 (9 %) | 62 (6 %) | 78 (32 %) | 47 (1 %) | 32 | 47 (3 %) | 52 (1 %) | 31 |
| Batterie étourdi 6, choc 12 | 60 (7 %) | 57 (7 %) | 64 (10 %) | 44 | 30 | 50 (1 %) | 51 (4 %) | 29 |
| Charge 30 | 36 | 42 (2 %) | 29 | 27 | 25 | 26 | 34 | 16 |
| 2 charges | 19 | 16 | 14 | 21 | 24 | 9 | 19 | 8 |

Les lignes « Charge 30 » et « 2 charges » viennent de la série refaite avec le pilote corrigé.

Ce que les chiffres disent, et ce qui a été réglé en conséquence :

- **La charge sismique est le consommable le plus fort** : 30 à 40 points de vie épargnés par charge contre un groupe
  (6 crabots : 71 → 36 → 19), sans compter la roche. Prix **26 → 34**.
- **Réparobots** : deux réparobots épargnent 45 points dans les gros combats (prix 18, inchangé).
- **Surrégime** : 20 points épargnés contre crabots et Broyeur, rien contre les puces (trop nombreuses). Durée **8 → 10**, prix 20.
- **Batterie en décharge** : faible à 8 dégâts et 4 battements ; à 12 et 6 elle épargne 10 à 15 points et libère d'un
  Bloqueur. Valeurs retenues : **12 dégâts, 6 battements**.
- **POW** : un Module de puissance changeait +1,5 % de dégâts, autant dire rien. Passé à **+8 % par point au-dessus du POW
  requis** ; l'effet reste modeste avec la foreuse de série (les seuils de coups pour tuer bougent peu) et se sent surtout
  avec le Trépan. À rejuger en jouant : 10 à 12 % se défendrait.
- **Trépan lourd** : à 2d6+4 il valait à peine mieux que la foreuse de série, et moins que la Vrille (moins chère, POW 9).
  Passé à **2d6+6**. Porté sans le POW requis (POW 10), il est désastreux (89 % de morts contre 6 crabots) : le malus fonctionne.
- **Blindage composite** : à DEF +18 (soit +8 sur la coque d'usine), aucun gain, et VIT −1 le rend pire contre les tireurs
  (2 artilleurs : 31 → 57). Passé à **DEF +25** ; il reste mauvais contre les tireurs, c'est son défaut voulu.
- **Carène légère** : la meilleure réponse aux tireurs (2 artilleurs : 31 → 17).
- **Salle piégée** : 7 relais d'un coup coûtent 50 points de vie à une foreuse sans rien, 4 relais 20 ; une charge bien
  placée divise par deux.
- **8 puces** et **Broyeur + 2 crabots** sont les combats les plus meurtriers (20 à 25 % de morts sans objets).

### Détection et fuite (`outils/simul.py tout`)

Relancé après les changements : valeurs inchangées (perd la trace à 13 cases : 100 % en 36 tours ; terrain dégagé, 12 cases
d'avance : 50 % semée ; herbes hautes en zigzag : 100 %).

Relancé le 25 novembre 2026 après les trois familles face à l'eau (terrestres, aquatiques, amphibies) : ces mesures se font
à sec et ne bougent pas (combat : 1 Crabot vie restante 93, 1 Broyeur 54, 1 Torpille 91, Mastok + 2 Crabos 74 % de victoires ;
fuite en courant, 12 cases d'avance : 100 % semée). **Non mesuré : les combats dans l'eau**, où le Crabot et la Torpille ne
perdent plus 20 de défense et où la Torpille n'est plus ralentie.

### Réseau de cavernes (21 novembre 2026)

25 cartes par réglage (`outils/scripts/mesure-cavernes.js`), taille 4 sauf mention : part de cavernes obtenue à moins de
2 points de la part visée dans tous les cas (15, 32, 45 et 55 %) ; nombre de cavernes 8,1 pour 8,1 visées au départ, 4,6
pour 4,7 avec des cavernes de 400 cases, 24 pour 30 avec des cavernes de 50 cases ; surface bâtie 12,7 % pour 13,9 visés au
départ, 28,8 pour 29,5 en « Cité enfouie » ; toutes les cartes sont entièrement reliées. Avant la refonte : une seule
caverne faisait 82 à 87 % de la surface quel que soit le nombre demandé, et 14 % de surface bâtie demandés en donnaient
9 à 10.

## Butin par priorité de lieu et clés loin des serrures (24 novembre 2026)

20 cartes par niveau, taille 3, mesurées dans le moteur (script jetable passé à `outils/jeu.py`). « Pas » : distance
de marche de la clé à la porte verrouillée la plus proche, serrures fermées.

| Niveau | Clé → serrure, avant (min / médiane) | à moins de 18 pas, avant | Clé → serrure, après (min / médiane) | à moins de 18 pas, après |
|---|---|---|---|---|
| 1 (atterrissage) | 2 / 8 | 16 sur 17 | 18 / 26 | 0 sur 17 |
| 2 (cavernes) | 2 / 24 | 8 sur 19 | 18 / 27 | 0 sur 17 |
| 3 (grande base) | 2 / 32 | 5 sur 18 | 18 / 29 | 0 sur 18 |

Au niveau 3, deux clés par série (avant comme après) se retrouvent coupées de toute serrure quand on mesure en fin de
génération : une machine posée ensuite (pont à levier, par exemple) sépare la clé de la porte. Ce n'est pas nouveau et
ce n'est pas compté dans le tableau.

| Niveau | Butins derrière une serrure | en cul-de-sac | autres salles | Module de puissance derrière serrure ou porte dérobée, avant → après |
|---|---|---|---|---|
| 1 | 0,8 par carte | 5,2 | 0 | 2 sur 22 → 16 sur 20 |
| 2 | 0,6 | 5,2 | 0 | 6 sur 25 → 16 sur 24 |
| 3 | 0,6 | 5,05 | 0 | 2 sur 22 → 14 sur 22 |

Le nombre total de butins par carte ne change pas (6 sur une carte de taille 3) : c'est leur répartition qui change.

`outils/simul.py` (détection et fuite) relancé le même jour : ces mesures se font sur carte dégagée, sans butin ni clé,
et ne dépendent pas de ce changement.

**Tirage pondéré (même jour, plus tard).** Le tableau ci-dessus mesurait un ordre fixe (le Module de puissance toujours
au premier lieu servi). À la demande du joueur, c'est devenu une préférence : tirage au sort pondéré (`BUTIN_POIDS`,
fermée à clé 6, cul-de-sac 1, autre 0,5). 30 cartes par niveau, en ne comptant que les cartes qui ont une pièce fermée
garnie :

| Niveau | Cartes avec pièce fermée garnie | Module de puissance derrière la serrure | Plan derrière la serrure |
|---|---|---|---|
| 1 | 19 | 11 | 5 |
| 2 | 22 | 11 | 8 |
| 3 | 22 | 16 | 7 |
| Total | 63 | 38 (60 %) | 20 (32 %) |

## Horloge par créature : pas et coup séparés (25 novembre 2026)

Les créatures ne comptent plus en points de mouvement mais en unités de temps, avec deux durées par espèce
(`dpas`, `dcoup`). Voir `conception-joueur.md`, 5 bis. Trois effets se mesurent.

**1. La cadence au contact est exacte.** Robot immobile, bêtes collées, 40 actions, tentatives de coup par bête et
par action (`hurtRobot` compté) :

| Espèce | Coup | avant | après |
|---|---|---|---|
| Crabot | 100 | 1,00 | 1,00 |
| Broyeur | 200 | 1,00 | 0,50 |
| Drone | 50 | 1,00 | 2,00 |

**2. L'approche est plus régulière, donc un peu plus lente.** La réserve de deux points de mouvement a disparu :
une bête bloquée ou immobile ne peut plus repartir de deux cases d'un coup. Les combats durent plus d'actions et
coûtent moins de vie.

**3. Le jeu est plus facile.** `outils/simul.py combat`, 100 duels, vie restante sur 100 (et nombre d'actions) :

| Combat | avant | après |
|---|---|---|
| 1 Crabot | 91 (6) | 91 (6) |
| 1 Broyeur | 54 (10) | 77 (10) |
| 1 Bloqueur | 91 (6) | 88 (6) |
| 1 Drone | 99 (3) | 97 (3) |
| 2 Crabos | 78 (9) | 84 (11) |
| 4 Cafars | 66 (13) | 82 (21) |
| Mastok + 2 Crabos | 28 · **75 % de victoires** (16) | 60 · 100 % (23) |
| RÉF. (2 Crabos + 1 Vipérin) · foreuse nue | 67 (12) | 78 (17) |
| Mastok seul | 55 · 99 % (10) | 77 · 100 % (10) |

Lecture. **Le Broyeur est la grosse perte** : son coup à 200 divise ses dégâts par deux, et il portait à lui seul la
difficulté des groupes qui le contiennent (« Mastok + 2 Crabos » passe de 75 % à 100 % de victoires). Les duels sans
Broyeur bougent de 6 à 16 points de vie, par l'effet 2. Les espèces accélérées (Drone, Puce, coup 50) ne compensent
pas : elles meurent en un ou deux coups avant d'avoir frappé deux fois. **À reprendre** : rendre au Broyeur sa
dangerosité autrement que par la cadence (dégâts, PV, ou un coup à 150), et remesurer.

Artilleur, Soudeur et Englueur sortaient du duel par épuisement du compteur (98, 117 et 135 actions) ; ils se règlent
maintenant en 5 ou 6 actions, parce que leur tir suit la même horloge que le reste.

`outils/simul.py detection` et `fuite` : inchangés, ces mesures ne dépendent pas de l'horloge des créatures.

## Portes dérobées : on cherche en marchant (26 novembre 2026)

La foreuse ne cherchait qu'en attendant (25 % par battement, rayon DET 5) : en marchant, elle pouvait longer une
porte dérobée sans aucune chance de la voir. Elle cherche maintenant à chaque battement, rayon DET 3, 15 % par
battement en agissant et 35 % à un battement passé sur place. Mesuré dans le moteur, 3 000 essais par ligne.

| Situation | avant | après |
|---|---|---|
| Porte à 1 ou 3 cases, battement en agissant | 0 % | 15 % |
| Porte à 1 ou 3 cases, battement sur place | 25 % | 35 % |
| Porte à 4 cases | 25 % (DET 5) | 0 % (hors du rayon) |
| Battements pour trouver une porte à 2 cases, à l'arrêt | 4,0 | 2,9 |
| Battements pour trouver une porte à 2 cases, en agissant | jamais | 6,7 |
| Longer un mur, 13 pas, porte au milieu | 0 % | **58 %** |

Lecture. Le rayon se resserre (5 → 3) et l'attente devient plus efficace (25 → 35 %), mais le vrai changement est
la dernière ligne : **passer devant une porte dérobée suffit maintenant à la trouver plus d'une fois sur deux**,
alors qu'avant il fallait s'arrêter au bon endroit sans savoir qu'il y avait quelque chose. Se reposer reste la
façon de fouiller un endroit précis : deux fois moins de battements qu'en marchant sur place.

## Fluidité et temps de calcul (26 novembre 2026)

Mesuré avec `python3 outils/jeu.py DOSSIER outils/scripts/mesure-perf.js`, sur la branche de la PR #55 (carte 96×64, Chromium sans carte graphique : **les chiffres sont pessimistes** par rapport à un vrai ordinateur, à refaire sur la machine du joueur avant de conclure). Objectifs : image sous 16 ms, tour sous 50 ms.

| Étape | Médiane | p95 | Pire |
|---|---|---|---|
| Génération d'un niveau (`newGame`) | 386 ms | 475 ms | 475 ms |
| `computeFOV` | 0,1 ms | 0,4 ms | 2,9 ms |
| `render` | 1,7 ms | 29 ms | 79 ms |
| `beastsAct` | 0,1 ms | 3,3 ms | 8,4 ms |
| `animalsAct` | 1,7 ms | 2,7 ms | 12,9 ms |
| Tour complet (`tryMove`) | 5,8 ms | 36 ms | 159 ms |
| Au repos, rappels d'image sur 3 s | 3,0 ms | 7,4 ms | 10,4 ms |

Mémoire JS : 19,6 Mo. *Correction du même jour : les « 8 % de CPU au repos » venaient des effets laissés par les pas d'essai.
Une fois ces effets finis, la boucle d'animation s'arrête bien ; au repos, seul le battement des liquides (`setInterval`, toutes
les 650 ms) redessine l'écran.*

Lecture :
- Le moteur (vue, ennemis) est léger. Le coût vient du **dessin** : `render` redessine toute la fenêtre à chaque appel.
- Les pics de 30 à 80 ms **ne sont pas un effet de démarrage** : ils reviennent tout au long de la mesure (ramasse-miettes probable, à confirmer au profileur).
### Allègement du rendu (26 novembre 2026, même jour)

Profil (`python3 outils/profil.py`, 200 rendus + 200 pas) avant : `drawImage` 49 %, `fillRect` 10 %, journal (`logDraw`) 9 %,
mini-carte 6 %, patrouilles (`etend`) 5 %. Deux changements, **sans rien changer à l'écran** (contrôlé au pixel près par
`outils/scripts/empreinte-image.js`, vue + mini-carte + journal) ni au jeu (`outils/verifier.py` : empreinte identique) :
- **Mini-carte** : son fond est gardé dans un canevas à part ; on ne repeint que les cases dont le terrain ou l'état « vu »
  a changé (avant : 6 144 cases à chaque rendu, y compris chaque image d'effet et chaque battement des liquides).
- **Journal** : seuls les tours qui ont changé sont refaits (avant : les 200 messages reconstruits à chaque tour).

Résultat, trois passes de chaque côté : **environ 15 % de CPU en moins** sur le même scénario (17 300 → 14 700
échantillons de profil). Les temps moyens de `render` et du tour bougent peu (≈ 6 ms et ≈ 11 ms) : le bruit de Chromium
sans carte graphique est du même ordre.

Ce qui reste : **60 % du temps est le dessin des tuiles de la vue principale** (`drawImage`, plusieurs couches par case).
Le gros gain serait un cache du terrain de la vue (ne repeindre que les cases changées, décaler l'image quand la caméra
bouge, liquides à part). C'est une refonte de `render` (voisins des murs, ponts, gisements, brouillard) : à faire avec Opus,
contrôlée par `empreinte-image.js`, et **après une mesure sur un vrai navigateur** : avec une carte graphique, `drawImage`
coûte bien moins cher et le gain pourrait ne pas valoir le risque.

### Tablette : vue plafonnée à 21 cases (26 novembre 2026)

Rendu moyen (`render`, 100 appels), écran d'iPad simulé (densité 2), même Chromium sans carte graphique :

| | Pleine résolution, sans plafond | Plafond 21 cases, zoom entier, pleine résolution | Plafond 21 cases, canevas à la résolution de l'ordinateur (retenu) |
|---|---|---|---|
| Paysage 1180 × 820 | 11 à 14 ms (29 × 22 cases) | 15 à 17 ms (19 × 15 cases) | **3,7 à 4,0 ms** |
| Portrait 820 × 1180 | 10 à 15 ms (23 × 41 cases) | 19 à 23 ms (11 × 20 cases) | **3,8 à 4,4 ms** |

Leçon : ici, le coût suit le **nombre de pixels à remplir**, pas le nombre de cases. Moins de cases agrandies à pleine
résolution coûte même plus cher. Le gain vient de dessiner moins de pixels et de laisser le navigateur agrandir ; l'image
obtenue est identique au pixel près à la pleine résolution (comparée). Sur ordinateur, l'écran reste identique
(`empreinte-image.js`).


### Ce qui ralentit un tour (26 novembre 2026)

Outils : `outils/scripts/acoups.js` (chaque étape d'un pas chronométrée, 300 pas, hasard fixé) et
`outils/scripts/mesure-logique.js` (le calcul de jeu seul, sans dessin, 1000 pas par recette).

- **Le calcul de jeu est léger.** Sans le dessin, un pas coûte en moyenne 1 à 2 ms ; 99 % des pas restent sous 7 ms ;
  le pire vu, 16 ms (cavernes, 33 ennemis). Rien à corriger d'urgence.
- **Les pics de 30 à 50 ms d'un tour sont tous dans le dessin**, et **pas dans le jeu** : la même scène, redessinée
  100 fois de suite sans jouer, dépasse 15 ms une fois sur trois. C'est Chromium sans carte graphique qui exécute le
  dessin par paquets ; sur une vraie machine, ce comportement est probablement différent. À confirmer sur le PC du joueur.
- Une seule exception réelle dans le dessin : le **premier rendu d'un niveau** calcule le voile du sol et les bords des
  gouffres (environ 30 ms, une fois par niveau ; pendant la descente, invisible).
- Ce qui coûte dans les pas les plus lents du calcul de jeu :
  - **`patBfs` (chemins de patrouille de la faune)** : 1 à 1,5 ms par appel, jusqu'à 6 appels dans un même battement ;
  - **poursuites** (`chaseStep`, `robotDistAvoid`, `distFrom`) : jusqu'à 6 ou 7 ms quand plusieurs ennemis chassent ;
  - **champ de vision** dans les cavernes : jusqu'à 8 ms (près de 400 lignes de vue tirées).
- Pendant les effets (coups, projectiles, sonar), la boucle d'animation redessine **tout l'écran à chaque image** (60 fois
  par seconde). C'est là que le dessin pèse vraiment en combat, sur n'importe quelle machine.

Pistes, par gain attendu : (1) pendant un effet, ne redessiner que la couche des effets (`fxv`) quand le décor ne bouge
pas ; (2) garder en mémoire les chemins de patrouille de la faune, recalculés seulement si la carte change ; (3) le cache
du terrain de la vue (voir plus haut).

**Effets à 30 images par seconde (même jour)** : pendant un effet de 2 s, 61 → 31 rendus par seconde, et le dessin
passe de 20 % à 8,5 % de CPU (Chromium sans carte graphique). Écran identique hors animation (`empreinte-image.js`).

**20 images par seconde et effets de surface (même jour)** : pendant un effet de surface de 2 s, 4 rendus complets
(8 ms) et 40 images rapides (**0,17 ms**) ; le dessin passe de **20 % de CPU (60 images/s) à environ 2 %**. Un effet
qui touche le décor (secousse…) : 22 rendus complets par seconde au lieu de 61, soit environ 6 % au lieu de 20 %.

### Décor en cache (26 novembre 2026, même jour)

Recette classique, hasard fixé, 300 pas puis la même scène redessinée 100 fois (`render`, en ms ; moyenne · p95) :

| Écran | Sans cache, en jouant | Avec cache, en jouant | Sans cache, même scène | Avec cache, même scène |
|---|---|---|---|---|
| Ordinateur 1280 × 800 | 8,2 à 8,7 · 23 à 26 | 5,7 à 6,3 · 15 à 17 | 6,6 à 7,3 · 18 à 22 | **1,0** · 1,3 |
| Ordinateur, densité 2 | 18 · 58 | 11,6 · 31 | 15 · 46 | **1,6** · 2,7 |
| Ordinateur, zoom 125 % | 10,3 · 30 | 7,0 · 19 | 9,0 · 30 | **1,0** · 1,3 |
| Tablette (iPad simulé) | 6,3 · 22 | 4,3 · 9 | 5,2 · 23 | **0,9** · 1,4 |

Une scène qui ne bouge pas (battement de l'eau sans eau visible, survol, effets qui touchent le décor) coûte 5 à 9 fois
moins. En jouant, la caméra suit la foreuse à chaque pas : il faut décaler l'image et peindre une rangée de cases, d'où un
gain plus faible (environ un tiers). Le premier rendu d'un niveau reste cher (60 à 80 ms : voile du sol, bords des
gouffres et toutes les cases), une fois, pendant la descente. Écran identique au pixel près (`test-decor-cache.js` sur
quatre recettes et trois écrans, `empreinte-image.js`, `test-fx-surface.js`).


### Intro et descentes : audit (26 novembre 2026)

Outil : `python3 outils/perf_scenes.py [intro|niv1|niv2] [--profil] [--densite D]`. Chromium sans carte graphique, 1280 × 800.

| Scène | Images/s | Calcul par image dessinée (moy · p95) | CPU |
|---|---|---|---|
| Arrivée (intro) | 20 | 15 ms · 31 à 36 ms | 29 à 30 % |
| Première descente | 20 | 22 ms · 32 à 35 ms | 43 à 45 % |
| Seconde descente (mines) | 20 | 24 à 26 ms · 34 à 39 ms | 48 à 51 % |

- Ces scènes sont des grilles de caractères plein écran : 146 × 55 cases dans les descentes, environ 160 × 50 pour
  l'arrivée. **Chaque case est redessinée à chaque image** (fond noir, puis le caractère) : 8 000 à 15 000 opérations de
  dessin par image. C'est le nombre d'opérations qui coûte, pas le nombre de pixels : en densité 2, le coût ne change
  presque pas.
- Descentes : la roche est une fonction fixe de la position. Elle défile d'environ 0,8 rangée par image, et presque pas
  sur le côté. La foreuse, les mines, la Matière, la fumée et les débris se dessinent par-dessus.
- Arrivée : la grille est reconstruite à chaque image (étoiles, planète, nuages, vaisseau, flammes), puis dessinée en
  entier, décalée d'un bloc quand ça tremble.
- Les bruits de la roche (`fgH`, `fgNz`) prennent 4 à 5 %.
