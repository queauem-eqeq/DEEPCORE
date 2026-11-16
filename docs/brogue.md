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
- **L'exploration automatique** vers la zone inexplorée la plus proche : faite le 13 novembre 2026
  (touche O, `conception.md` § 3 ter), sur le moteur de trajet déjà en place.

## Comment Brogue gère ses ennemis

Relevé le 15 novembre 2026, pour préparer la suite (l'utilisateur veut en reprendre des idées). Sources :
le wiki (https://brogue.fandom.com/wiki/Level_Generation, https://brogue.fandom.com/wiki/Mutations,
https://brogue.fandom.com/wiki/Stairdancing), le site du jeu (https://www.sites.google.com/site/broguegame)
et un article sur la version 1.7
(https://waltoriouswritesaboutgames.com/2012/11/07/roguelike-updates-who-needs-leveling-anyway/).
Le wiki décrit surtout la version d'origine ; l'édition communautaire (CE) peut différer sur des détails.
Les lignes marquées « de mémoire » n'ont pas été retrouvées dans une source ce jour-là.

### Les hordes : on ne pose pas des monstres, on pose des groupes

- L'unité de peuplement est la **horde** : un meneur et, parfois, des compagnons en nombre tiré au hasard
  (une chauve-souris vampire vient avec 0 à 2 autres). Certaines espèces sont toujours seules.
- Chaque horde a une **plage de profondeur** et une **fréquence** de tirage. Plus bas, on trouve de
  nouvelles espèces, mais aussi des hordes **plus grosses** des espèces déjà connues.
- **Les membres d'une horde sont liés** : dès que l'un sait où est le joueur, tous le savent. Surprendre
  un groupe est donc bien plus difficile que surprendre un isolé.
- D'après le wiki, un niveau reçoit **six hordes à sa création, endormies**, posées hors de vue de
  l'escalier d'arrivée ; ce nombre ne monte qu'au-delà du niveau de l'amulette (26), jusqu'à 20.
  La difficulté ne vient donc pas du nombre de groupes, mais de ce qu'ils contiennent.

### La profondeur : d'autres monstres, pas des monstres gonflés

- **Les statistiques d'une espèce ne changent pas avec la profondeur.** C'est la liste des hordes
  possibles qui change. Même choix que « Noyau Profond » (décision du 13 novembre 2026).
- **Hors profondeur** : à partir du niveau 2, **10 % des hordes** sont tirées comme si l'on était de
  1 à K niveaux plus bas, avec K = la moitié de la profondeur, plafonné à 5. Un ogre (niveau 7 au
  plus tôt) peut ainsi se présenter au niveau 5. C'est ce qui casse la routine : de temps en temps,
  quelque chose de trop fort qu'il vaut mieux contourner.
- **Mutations** : à partir du niveau 11, un monstre a une petite chance de recevoir une variante
  (1 % au niveau 11, + 1 point par niveau, 10 % du niveau 20 au 26). Huit variantes, à chances
  égales, par exemple : *explosif* (moitié moins de vie, explose en mourant), *agile* (deux fois
  plus rapide, fuit quand il est blessé), *colosse* (trois fois la vie, deux fois les dégâts, deux
  fois plus lent), *toxique* (empoisonne, frappe deux fois moins vite). Une variante est interdite
  à l'espèce qui a déjà ce trait. Avec peu d'espèces, cela donne beaucoup de rencontres différentes.

### Le temps joue contre le joueur : les renforts

- **Toutes les 125 à 175 actions, une nouvelle horde arrive sur le niveau, éveillée.**
- Elle n'apparaît jamais en vue, ni à moins de 15 cases du joueur, ni dans une salle spéciale, ni
  dans l'eau ; les monstres immobiles n'arrivent jamais ainsi.
- Conséquence : un niveau « nettoyé » ne le reste pas, et s'attarder (se reposer, tout fouiller) a un prix.

### États et poursuite

- Un monstre **dort**, **erre**, **chasse**, **fuit** ou est **allié**. Frapper un monstre qui dort
  ou erre lui fait perdre un temps avant de riposter (voir plus haut « La récompense de la discrétion »).
- **Piste d'odeur** : le joueur laisse une trace derrière lui ; le monstre qui chasse sans le voir
  remonte cette trace, il ne connaît pas sa position réelle. Quand la piste est trop vieille, il
  se remet à errer. Franchir un gouffre, de l'eau profonde ou de la lave **coupe la piste**.
- **Les monstres suivent le joueur dans l'escalier** : changer de niveau ne suffit pas à semer un poursuivant.

### Des traits simples par espèce

Chaque espèce porte quelques étiquettes de comportement, combinables. Attestées par les règles des
mutations : *garde ses distances* (tireurs et lanceurs de sorts), *fuit quand il est blessé*,
*se téléporte à courte distance*, *agrippe sa proie*, *se soigne en frappant*. Attestés ailleurs :
le singe qui **vole un objet et s'enfuit**, l'anguille qui ne vit que dans l'eau. De mémoire, non
revérifié : le monstre blessé qui a fui revient une fois soigné ; certains évitent les couloirs.

### Pas d'expérience, et des alliés

- Depuis la version 1.7, **tuer ne rapporte rien** : plus de niveaux ni d'expérience ; la puissance
  vient des objets trouvés. Seuls de rares monstres lâchent un objet. Éviter un combat est donc
  toujours un choix valable, et la discrétion un vrai style de jeu.
- **Captifs** : des monstres en tiennent d'autres enchaînés. Libéré, le captif suit le joueur et se
  bat à ses côtés ; les alliés puissants n'apparaissent que plus bas.

### Où en est « Noyau Profond », et ce qui serait à reprendre

| Idée de Brogue | Noyau Profond aujourd'hui | À reprendre ? |
|---|---|---|
| Stats fixes, la profondeur change les espèces | stats fixes, budget de menace par niveau, biomes | déjà là |
| Hordes composées (meneur + suite), liées entre elles | effectifs par espèce posés un à un ; seuls les cafars vont en bande et partagent ce qu'ils voient | **oui** : des groupes mixtes écrits à la main (un mastok et ses vipérins, un crachin gardé par deux crabos) |
| Monstres endormis à l'arrivée | tous éveillés, ils errent | **oui** : donne du prix à l'approche discrète et au coup par surprise |
| Renforts toutes les 125 à 175 actions | aucun : une carte vidée reste vide | **oui** : fait payer le repos (touche P) et l'exploration complète |
| 10 % de hordes hors profondeur | chaque niveau est pile à son budget | à voir : une rencontre trop forte de temps en temps |
| Mutations | aucune | plus tard : beaucoup de variété pour peu de dessin |
| Piste d'odeur | dernière position connue, puis fouille | pas nécessaire : notre règle est plus lisible |
| Fuite quand il est blessé | seul l'insectoïde recule ; le crachin s'écarte | à voir, espèce par espèce |
| Poursuite d'un niveau à l'autre | forer termine le niveau, personne ne suit | à voir |
| Rien à gagner à tuer | rien non plus (les objets ne tombent pas encore) | à décider avec la provenance des objets |
| Captifs et alliés | aucun | plus tard |
