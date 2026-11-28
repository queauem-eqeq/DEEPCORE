# Terminaux, antennes, journal de bord et hacks

Décidé par l'utilisateur les 27 et 28 novembre 2026. Valable pour **tous les niveaux**. Rien n'est encore codé.
Complète `claude/histoire.md` (les cinq canaux) et `claude/histoire-niveau-1.md`.

## Décisions de l'utilisateur

- Les **terminaux et les antennes** ouvrent un **menu à trois entrées** : DATA, CONNEXION, ENCODAGE.
- Chaque machine donne **les trois entrées** (pas un choix exclusif).
- **Un terminal peut aussi agir sur le lieu** : ouvrir une porte, éteindre des lasers, ouvrir une pièce secrète.
  Ces actions sont rangées **sous CONNEXION** (pas de quatrième entrée).
- Le **journal de bord** s'enrichit : fiches de robots (rôle, spécificités, stats), fiches d'objets, entrées de
  journaux, documents, hacks, tutoriel.
- Les fiches ont **plusieurs niveaux d'information, qui se débloquent au fil des parties** (exemple : fiche technique
  « Crabot mkIII »).
- Une page est **acquise dès la lecture** (pas besoin d'avoir envoyé le rapport ni de survivre).
- **Deux familles d'objets, bien séparées** :
  - les **hacks** : des programmes, **gratuits, obtenus au terminal** (ENCODAGE) ;
  - les **objets physiques** : on trouve leur **blueprint** au terminal, puis on les **fabrique au FABLAB**. Pas de
    hack pour un objet physique.
- **Il existe un blueprint de tout** : capsules (consommables), objets, armes.
- **L'objet « blueprint » n'est plus lâché ni posé dans les niveaux** : les blueprints ne viennent que des terminaux.
- Au terminal, **choix parmi 3 hacks**, et **choix parmi 3 blueprints**.
- **Le FABLAB est présent dès le niveau 1** (aujourd'hui il n'apparaît qu'aux niveaux 2 et 3 : à changer). À
  l'Astroport, sa place naturelle est le dépôt de tri.
- **Les hacks sont des objets** : on peut les **retirer** de leur emplacement et les **garder dans l'inventaire**, où
  ils **prennent une place** comme tout objet transporté.
- **Pas de répartition stricte des hacks par niveau : des pourcentages de chances**, qui évoluent avec la profondeur.
- **Les hacks gagnent en puissance avec la descente** ; la « meilleure connexion au noyau » se mesure **à la
  profondeur seulement** (pas de compteur de connexions). Exemple donné : critique + 1 % au niveau 1, + 5 % au
  niveau 4.
- Un hack **booste les caractéristiques** de la foreuse : critique, **dégâts**, **précision**, défense, récupération
  d'énergie… ; plus bas, l'arme à distance. Claude est libre d'être créatif, les valeurs s'ajusteront.
- **Trois familles de hacks validées : Base, Tir, Noyau** (définitions ci-dessous), avec **un seul hack Noyau équipé
  à la fois**.
- **Hack « Signature » : baisse la détection** de la foreuse par les ennemis (un simple chiffre, famille Base).
- **Hack « Voix » : refusé**, retiré de la liste.
- **Emplacements de hacks, à part** des 5 emplacements d'objets : **2 au départ, puis 1 de plus aux niveaux 3, 6
  et 9** (3, 4, puis 5 emplacements).
- **Objet FABLAB « Sonar »**, en versions 3, 4, 5, 6 et 7 : montre les ennemis en point rouge à 3, 4, 5, 6 ou 7 cases
  de distance.

## Le menu

| Entrée | Ce que le joueur obtient | Durée |
|---|---|---|
| **DATA** | Pages du journal de bord : fiches de robots et d'objets, journaux, documents, tutoriel | D'une partie à l'autre |
| **CONNEXION** | Réseau du lieu : porte ouverte, lasers éteints, pièce secrète révélée, brouillard levé, ennemis signalés ; puis tentative de liaison au noyau (canal 5) | Immédiat |
| **ENCODAGE** | La machine lit le code de la foreuse et y écrit : un hack parmi 3 (gratuit), ou un blueprint parmi 3 pour le FABLAB | La partie en cours |

Le terminal n'affiche que les actions qui existent près de lui, selon la règle des machines lisibles (le mécanisme
est proche de ce qu'il commande).

**Terminal** (intérieur, mémoire locale) : DATA riche, ENCODAGE complet, CONNEXION locale (porte, lasers, pièce
secrète).
**Antenne** (extérieur, réseau) : CONNEXION large (son effet actuel + liaison au noyau), DATA du site (groupes
présents, relevés), ENCODAGE léger ou vide (proposition de Claude).

### Journal de bord (proposition de Claude)

Six onglets : Robots, Objets, Journaux, Documents, Hacks, Tutoriel. Paliers d'une fiche de robot :

1. **Vu** : nom, silhouette, « MENACE ».
2. **Détruit plusieurs fois** : vie, dégâts, vitesse.
3. **DATA lue** : rôle et comportement, faiblesse, butin.
4. **DATA des niveaux profonds** : son origine (le numéro de la foreuse dont il descend). L'histoire s'y glisse.

Justification dans la fiction : ce qu'une unité a lu, l'unité suivante le reçoit.

### Objets physiques (blueprint au terminal → FABLAB)

Capsules, objets, armes, plug-ins de l'arme de tir (feu, glu, shotgun, laser). Certains objets existent en
**versions de puissance croissante**, comme le Sonar (3 à 7 cases).

À revoir au moment de coder : le butin des ennemis et des recoins ne contient plus de blueprint.

### Hacks : les trois familles (validées le 28 novembre 2026)

| | **Base** | **Tir** | **Noyau** |
|---|---|---|---|
| Ce que ça touche | Une caractéristique de la foreuse | L'arme à distance uniquement | Une règle du jeu, pas un chiffre |
| Qui l'a écrit | Réglages d'usine, que toute machine du même modèle sait réécrire | Les foreuses précédentes devenues gardiennes | Le noyau |
| Forme | Un bonus simple, sans contrepartie | Un compromis : plus d'un côté, moins de l'autre | Un effet unique, toujours avec un prix |
| Progression | Le chiffre monte avec la profondeur | Le chiffre monte, le prix aussi | L'effet est entier dès qu'on l'a |
| Limite | Aucune | Aucune | Un seul équipé à la fois |

**Chances par niveau** (proposition de Claude, à ajuster ; chacun des 3 hacks proposés est tiré à part) :

| Niveaux | Base | Tir | Noyau |
|---|---|---|---|
| 1 à 3 | 85 % | 15 % | 0 % |
| 4 à 6 | 50 % | 40 % | 10 % |
| 7 à 10 | 25 % | 35 % | 40 % |

**Puissance** : chaque hack Base ou Tir porte un rang, fixé par le niveau où il est obtenu. Modèle du critique :
+ 1 % au niveau 1, + 5 % au niveau 4, environ + 10 % au niveau 7, + 15 % au niveau 10.

| Famille | Hack | Effet |
|---|---|---|
| Base | CRIT.SYS | Chance de coup critique |
| Base | FORCE | Dégâts |
| Base | VISÉE | Précision |
| Base | BLINDAGE.RT | Défense |
| Base | RÉGÉN.CELL | Récupération d'énergie plus rapide |
| Base | ÉCHO.SCAN | Vue plus longue |
| Base | SOURDINE | Bruit du forage réduit |
| Base | SIGNATURE | Détection par les ennemis réduite |
| Base | RECYCLAGE | Un ennemi détruit rend un peu d'énergie |
| Base | TRAQUE | Les ennemis en chasse se voient à travers les murs, à courte distance |
| Tir | SURCHARGE | Dégâts du tir en hausse, coût en énergie aussi |
| Tir | SILENCE.TIR | Bruit du tir réduit, dégâts un peu réduits |
| Tir | ÉCONOMIE | Coût du tir réduit, dégâts un peu réduits |
| Tir | PERFORANT | Chance de critique au tir, précision un peu réduite |
| Noyau | SYMBIOSE | La vie remonte plus vite ; le fuel baisse plus vite |
| Noyau | SURSIS | À zéro de vie, la foreuse survit une fois ; le hack se détruit |
| Noyau | HÉRITAGE | Ce hack et un autre passent à l'unité suivante à la mort ; il occupe son emplacement sans rien donner d'autre |

Noms et valeurs sont provisoires.

## Encore ouvert

- Ce que donne l'ENCODAGE sur une antenne.
- Contenu exact de chaque palier de fiche, robot par robot.
- Valeurs de chaque hack par niveau, et chances des familles.
