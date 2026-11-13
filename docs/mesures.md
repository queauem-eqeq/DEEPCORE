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

### Ce que ces chiffres disent

- **De près, à découvert, on ne sème personne.** Le crabos va aussi vite que la foreuse (vitesse 5
  contre 5) et l'insectoïde plus vite encore : l'écart ne grandit jamais, la bête reste dans le cercle,
  et la règle des 3 % ne s'applique pas. Il n'y a pas d'issue sans terrain.
- **De loin, à découvert, oui.** Avec une douzaine de cases d'avance, la bête est hors du cercle : les
  3 % mordent et elle finit par renoncer. C'est le seul cas où fuir tout droit fonctionne.
- **Les herbes hautes sont le meilleur abri du jeu**, parce que celles qu'on ne couche pas bloquent la
  vue. Zigzaguer évite de laisser derrière soi un couloir d'herbes couchées bien dégagé.
- **Les rochers épars ne cachent pas** : ils gênent la foreuse plus qu'ils ne coupent la ligne de vue.
- Tant que la stat **VIT** n'a aucun effet, prendre de la distance reste impossible : c'est le levier
  qui rendrait la fuite jouable (voir les pistes ouvertes de `conception.md`).

## Piège de méthode

Une mesure à longue distance exige de **dégager toute la carte**. Un relief laissé au hasard coupe la
ligne de vue et fausse le résultat sans rien signaler : c'est arrivé le 13 novembre 2026, où un test
ne dégageait que 12 cases autour de la foreuse et laissait croire à une perte de contact à 15 cases.
Prévoir aussi assez d'essais : un seul tirage ne dit rien d'une règle à 3 %.
