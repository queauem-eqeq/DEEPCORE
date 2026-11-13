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

## Piège de méthode

Une mesure à longue distance exige de **dégager toute la carte**. Un relief laissé au hasard coupe la
ligne de vue et fausse le résultat sans rien signaler : c'est arrivé le 13 novembre 2026, où un test
ne dégageait que 12 cases autour de la foreuse et laissait croire à une perte de contact à 15 cases.
Prévoir aussi assez d'essais : un seul tirage ne dit rien d'une règle à 3 %.
