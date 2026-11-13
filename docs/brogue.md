# Brogue : notes de référence

Ce que fait Brogue, pour comparer quand on règle « Noyau Profond ». **Idées et chiffres seulement** :
aucun code de Brogue n'est repris, Brogue CE étant sous licence AGPL.

Relevé le 13 novembre 2026 à partir de la documentation publique du jeu, notamment le wiki
(https://brogue.fandom.com/wiki/Stealth), le guide communautaire et les notes de version. Les valeurs
ci-dessous sont celles des versions modernes, 1.7.3 et suivantes.

## La discrétion appartient au joueur

C'est l'idée centrale, et celle qu'on a reprise : **un seul rayon, celui du joueur**, et non une
portée de détection par monstre. Tout ce qui se trouve dedans peut vous remarquer. Le joueur n'a
qu'un nombre à lire, affiché dans la colonne latérale et, en option, dessiné sur la carte.

## Le calcul du rayon

- Base **7**.
- **Doublé en pleine lumière**, divisé par deux dans l'obscurité, arrondi au supérieur. Le donjon
  étant éclairé la plupart du temps, la valeur courante est donc 14.
- **+1** par point d'exigence en force de l'armure au-dessus de 12 : une armure lourde fait du bruit.
- **Divisé par deux** si le joueur s'est reposé au tour précédent.
- Moins le niveau d'un anneau de discrétion ; plus 1 par tour restant d'un effet qui attire les monstres.
- Plancher à **2**, ramené à 1 si le joueur s'est reposé. Sous invisibilité, le rayon vaut toujours 1.

Les divisions se cumulent.

## Remarquer le joueur : une chance plate

Un monstre dans le rayon a **25 % par tour** de vous remarquer. Plate : la distance ne joue pas.

C'est un choix délibéré, et récent. Jusqu'à la version 1.7.2, la chance dépendait de la distance, ce
qui rendait l'approche en diagonale avantageuse. La refonte de la **1.7.3** l'a remplacée par cette
chance unique, explicitement « pour favoriser la transparence et l'intérêt tactique ». Autrement dit,
Brogue a sacrifié du réalisme pour de la lisibilité. C'est la raison pour laquelle « Noyau Profond »
a fait le même choix le 13 novembre 2026.

## Perdre la trace

- Un monstre qui chasse a **3 % par tour** de perdre votre trace, **pour chaque tour passé hors de
  votre rayon de discrétion**. Dans le rayon, jamais.
- Il la perd d'un coup au-delà de **trois fois** le rayon (ou à plus de deux cases si vous êtes invisible).
- En fouillant, les monstres vous repèrent de **deux fois** plus loin.

## La récompense de la discrétion

Frapper un monstre qui ne vous a pas remarqué — endormi, errant ou paralysé — **ne manque jamais sa
cible, inflige le triple des dégâts, et le monstre perd un tour** avant de riposter. Sans une
récompense de cet ordre, se cacher ne servirait qu'à éviter le combat.

## Ce que « Noyau Profond » en a retenu, et ce qu'il en écarte

| | Brogue | Noyau Profond |
|---|---|---|
| Rayon de base | 7, doublé en lumière | 10, réglable |
| Lumière et obscurité | ×2 et ÷2 | pas de lumière : remplacé par les parois adjacentes (−1 chacune) |
| Couvert | — | herbes basses, ÷2 |
| Immobile au tour précédent | ÷2 | ÷2 |
| Armure lourde | +1 par point | — |
| Bruit | fouille ×2 | briser une paroi ×1,5 |
| Chance par tour | 25 % | 25 % |
| Bande de chasse | triple du rayon | **double** du rayon |
| Perte de trace hors du rayon | 3 % par tour | 3 % par tour |
| Coup par surprise | toujours touché, ×3 | toujours touché, toujours critique (×3) |

La seule divergence délibérée est la bande de chasse, portée au double plutôt qu'au triple : les
ennemis renoncent plus tôt que dans Brogue.

## Deux autres emprunts, ailleurs dans le jeu

- **Les coins** : un pas ou un coup en diagonale est impossible si l'une des deux cases orthogonales
  voisines est une paroi. Même règle pour tout le monde, et c'est ce qui permet de forcer les ennemis
  à passer un par un. La **vue**, elle, ne suit pas cette règle : on voit en diagonale à travers un
  coin qu'on ne peut pas franchir.
- **L'exploration automatique** vers la zone inexplorée la plus proche : pas encore faite, elle
  tournerait sur le moteur de trajet déjà en place.
