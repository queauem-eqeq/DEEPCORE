# Point de la nuit du 23 novembre 2026

Ce qui a été fait cette nuit, ce que disent les mesures, et ce qu'il reste à décider. Les règles en vigueur sont dans
`conception.md`, les chiffres dans `mesures.md` (section « Nuit du 23 novembre 2026 »).

## 1. Ce qui ne fonctionnait pas bien (mesuré)

1. **La vie n'était jamais une contrainte.** Sept gisements d'éclats par carte rendaient 260 PV par niveau, plus que ce
   que coûtait le niveau entier affronté de face (176 à 251), et les réparobots étaient le consommable le plus fréquent.
   → Corrigé : éclats en fuel, réparobots rares, repos qui répare contre du fuel.
2. **Beaucoup d'ennemis, peu de danger.** 27 à 38 créatures par carte, mais un groupe moyen n'enlevait qu'une vingtaine
   de points. → Corrigé : moitié moins de groupes, dégâts doublés. Deux crabots coûtent 44 de vie, quatre relais tuent
   une fois sur huit, le Broyeur gagne presque un duel sur deux.
3. **Le fabricateur annule la rareté des soins.** Un réparobot coûte 18 de Matière ; un niveau en rapporte 50 à 100, la
   première descente jusqu'à 60. Dès que le plan est connu, les soins sont illimités. **Non corrigé** : les prix sont un
   de vos réglages enregistrés (voir question 1).
4. **Quatre coûts de groupe sont faux**, ce qui fausse le budget : « Large crabot groupe » vaut 13,7 pour un coût de 7,
   « Puces en groupes » 16,7 pour 10 (sous-évalués : le jeu en pose trop) ; « Poste de garde » 4,1 pour 10, « Convoi » 5,0
   pour 11, « 1-2 Mines » 0,2 pour 3, « Embuscade gluante » 1,6 pour 4 (surévalués). Non modifié : ce sont vos réglages.
5. **Le Bloqueur seul est inoffensif** (8 de vie perdue) et **la mine ne blesse presque jamais** (0,7 à 1,2) : on s'écarte
   avant l'explosion. Leur danger n'existe qu'accompagnés de tireurs.
6. **Les duels contre Artilleur, Soudeur et Englueur durent 140 à 180 battements** : ils reculent et la foreuse ne les
   rattrape pas. C'est long plutôt que dangereux. Piste : recul limité à quelques cases, ou dos au mur ils chargent.
7. **Le mini-jeu des mines coûte désormais cher** : −12 de vie par mine, et cette vie ne revient plus toute seule
   (pilote attentif −11, maladroit −43 par descente). À surveiller en jouant.
8. **Essai en échec avant cette nuit** : « les groupes d'extérieur naissent dehors », 8 sur 12 seulement
   (`test-ennemis.js`). Le lieu demandé par un groupe n'est pas toujours respecté. Non corrigé.
9. **La recette « cavernes » n'est pas reproductible** à hasard fixé (les trois autres le sont). Cause non trouvée ; cela
   empêche un contrôle exact de cette recette.
10. **L'exploration automatique** cherche encore les éclats « pour se soigner » : sans effet grave, à reprendre.
11. **Le Bestiaire du Lab montre les dégâts de base**, le jeu les double (les fiches en jeu montrent les vrais).

## 2. Ce qui a été codé

| Sujet | Règle | Où la régler |
|---|---|---|
| Fuel | 1 500, s'écoule de 1 par battement ; à sec : ni réparation ni recharge d'énergie | `REGLES`, `00-base.js` |
| Repos | attendre répare 0,5 de vie par battement, pour 4 de fuel | idem |
| Éclats de métal | fuel +100 / +150 / +200 et énergie, plus de vie ; 4 gisements par carte au lieu de 7 | idem |
| Descente | chaque descente rend 400 de fuel | idem |
| Ennemis | budget de menace × 0,5, dégâts × 2 | idem |
| Renforts | un groupe entre par un bord après 500 battements, puis 350, puis de plus en plus vite | idem |
| Réparobots | deux fois et demie plus rares dans le butin | `CONSO_POIDS`, `14d-objets.js` |
| Niveau 4 | la station noyée, jouable (bouton Niv4 du Lab), la descente compte quatre niveaux | `NIVEAUX`, `07h-inonde.js` |

Ces valeurs sont un **premier jet raisonné** : aucune partie entière n'a été jouée par un pilote automatique.

## 3. Tâches pour régler les consommables

Dans l'ordre où je les ferais.

1. **Fabricateur : rendre les soins chers.** Réparobots 18 → 45 de Matière, ou un seul exemplaire par fabricateur.
2. **Créer le Bidon de fuel** (+400), nouveau consommable : c'est lui, plus que le réparobot, qui devient la récompense
   d'exploration. Le mettre au fond des culs-de-sac et dans les vitrines.
3. **Réparobots : +50 → +35**, pour qu'un combat raté ne s'efface pas d'une capsule.
4. **Batterie** : l'énergie n'est presque jamais rare. Lui donner son vrai rôle : arme (décharge 12 → 20, étourdi 6) et,
   lancée dans l'eau, elle électrise toutes les créatures qui s'y trouvent (niveau 4).
5. **Fumigène** : il ne fait perdre la trace que si la foreuse est dedans. Le faire aussi couper les lignes de tir
   (artilleurs, sentinelles, tourelles) : il devient l'outil contre les tireurs qui reculent (point 6 ci-dessus).
6. **Charge sismique** : 30 de dégâts, y compris à la foreuse. Avec des ennemis plus rares elle reste forte ; la garder,
   mais vérifier au banc contre « Large crabot groupe » et le Broyeur après le doublement des dégâts.
7. **Surrégime et camouflage** : 10 battements. Mesurer au banc ce que vaut un surrégime contre un Broyeur (c'est la
   réponse prévue à cet ennemi) ; régler la durée sur ce résultat.
8. **Capsules non identifiées** : neuf sortes, dont deux néfastes. Avec moins de butin, identifier en essayant coûte
   trop. Ajouter un moyen de savoir : le terminal d'un niveau révèle une capsule, ou la station d'analyse.
9. **Module de puissance** : 1,1 par niveau, garanti. Sur huit niveaux cela fait POW 18. Vérifier que les armes
   suivent (Trépan requis 12) ou passer à un module tous les deux niveaux.
10. **Butin des ennemis** (`DROPS`) : le Broyeur lâche un objet 9 fois sur 10. Puisqu'il est devenu l'ennemi à éviter,
    en faire un coffre ambulant est cohérent ; garantir alors un objet de valeur (bidon, équipement).
11. **Passer les 18 scénarios du banc** (« groupes contre équipements », `mesures.md`) avec les nouvelles règles, et
    régler prix et effets sur ce tableau. Le banc est à republier (`outils/banc.py`).

## 4. Huit niveaux : signature, carte, groupes, ennemis, machines

Budget de menace après la règle « moitié moins » : 40, 48, 56, 64, 72, 80, 88, 96. Chaque niveau introduit **une** idée
neuve et réutilise ce que le joueur a appris au-dessus.

| Niv. | Nom | Signature | Ce que le joueur doit apprendre |
|---|---|---|---|
| 1 | Atterrissage | extérieur, massif, complexe enfoui | la discrétion, le forage |
| 2 | Cavernes | tout sous roche, bâtiments enchâssés | les lasers, le fabricateur |
| 3 | Grande base | intérieur, machines | ponts, piles, salles piégées |
| 4 | **Station noyée** (codé) | l'eau ralentit la foreuse, pas ce qui y nage | choisir son chemin : îlots, berges, bâtiments |
| 5 | **Ruche** | le vivant a tout envahi et se reproduit | tuer la source, pas les rejetons ; le feu |
| 6 | **Fonderie** | le niveau est une machine en marche | lire les rythmes, couper le courant |
| 7 | **Coffre-fort** | noir total, être vu déclenche l'alarme | ne jamais être vu |
| 8 | **Antichambre du Noyau** | le fuel brûle deux fois plus vite | tout ce qui précède, contre la montre |

### Niveau 4 — Station noyée (recette `inonde`, jouable)

- **Carte** : les cavernes du niveau 2, puis l'eau monte. Hauts-fonds près des parois (foreuse × 1,5 plus lente), eau
  profonde au large (× 2, et le courant l'emporte), îlots au sec, roseaux sur les berges, bâtiments au sec. Quatre
  archétypes : Lagune souterraine, Citernes, Archipel, Docks engloutis.
- **Groupes codés** : Meute de torpilles (3 à 5, valeur 8), Patrouille amphibie (2 crabots + 2 torpilles, valeur 7) ; avec
  eux drones (ils survolent l'eau) et tireurs embusqués (ils tirent pendant qu'on patauge).
- **À faire** : ennemi *Sondeur* (immergé, invisible en eau profonde, surgit au contact) ; machines *Pompe* (un levier
  fait baisser l'eau d'une caverne d'un cran), *Écluse* (porte qui ne s'ouvre que salle vidée), *Câble dénudé* (une nappe
  d'eau électrifiée par intermittence, au rythme d'une croix laser).

### Niveau 5 — Ruche

- **Carte** : beaucoup de petites alvéoles reliées par des boyaux courts, herbes hautes partout (vue courte, pour les
  deux camps), bâtiments rares et en ruine, sol gluant par plaques.
- **Ennemis** : *Nid* (immobile, 40 PV, pond une puce tous les 12 battements, six au plus : il faut le détruire),
  *Reine* (près du site, 80 PV, appelle les puces de la carte), Englueurs, Puces.
- **Groupes** : Couvain (nid + 3 puces), Essaim (8 à 10 puces), Garde de la reine (reine + 2 englueurs).
- **Machines** : *Incubateur* (le briser arrête les éclosions d'une zone) ; *Purgeur* (levier qui met le feu à l'herbe
  d'une salle). **Le feu** est la mécanique neuve, reprise de Brogue : il court dans l'herbe, blesse tout le monde, et
  une charge sismique l'allume.

### Niveau 6 — Fonderie

- **Carte** : la grande base, en longues halles. *Convoyeurs* (déplacent d'une case par battement tout ce qui est
  dessus), *coulées* de métal en fusion (infranchissables, passerelles), *presses* (une case mortelle un battement sur
  quatre). Le bruit des machines couvre celui de la foreuse : portée de discrétion réduite.
- **Ennemis** : *Fondeur* (lance des scories : 3 × 3 brûlant pendant 5 battements), *Ouvrier* (inoffensif, court donner
  l'alerte au poste de garde), Soudeurs, Broyeurs, Convois.
- **Groupes** : Équipe d'atelier (2 soudeurs + 2 crabots), Contremaître (Bloqueur + 2 artilleurs), Coulée (2 fondeurs).
- **Machines** : *Chaîne de montage* (fabrique un drone toutes les 30 battements tant qu'elle est alimentée) ;
  *Coupe-circuit général* (retirer la pile arrête convoyeurs, presses et chaîne… et éteint la lumière).

### Niveau 7 — Coffre-fort

- **Carte** : un bunker, beaucoup de serrures et de portes dérobées, la salle des coffres au centre, le site derrière.
  **Noir total** : vision de 4 cases hors des zones éclairées ; dans la lumière on voit loin et on est vu de loin. Les
  lasers, eux, se voient dans le noir : ce sont les repères.
- **Ennemis** : *Veilleur* (projecteur tournant : voit à 12 cases dans son cône, aveugle ailleurs, n'attaque pas, donne
  l'alarme), *Traqueur* (rapide, chasse au bruit, visible seulement au contact), Sentinelles, Bloqueurs.
- **Groupes** : Ronde de nuit (veilleur + 2 sentinelles), Peloton d'intervention (2 bloqueurs + 2 artilleurs, **seulement
  sur alarme** : l'alarme fait arriver les renforts tout de suite).
- **Machines** : *Coffres* à trois serrures (le meilleur butin du jeu), *Disjoncteur* (coupe lasers et lumières),
  *Plaques de pression*.

### Niveau 8 — Antichambre du Noyau

- **Carte** : une base en anneaux autour de la salle du Noyau. La chaleur fait brûler le fuel deux fois plus vite : il
  n'y a pas le temps de tout visiter.
- **Ennemis** : le *Gardien du Noyau*, immobile au centre, lasers à motif tournant, protégé par quatre générateurs à
  éteindre (les piles du niveau 3) ; groupes mixtes tirés de tous les niveaux.
- **Machines** : les quatre générateurs, chacun dans une aile gardée par la mécanique d'un niveau précédent (eau, feu,
  convoyeurs, noir) : le dernier niveau fait repasser l'examen.

## 5. Nettoyage du code : ce qui a été fait, ce qui reste

**Fait**, le jeu se comportant à l'identique (contrôle d'empreinte) : 14 fonctions et tables jamais utilisées retirées ;
les conversions de parties d'avant le 17 novembre retirées (la famille de code qui avait causé les Broyeurs à 6 PV) ; une
seule table `NIVEAUX` décrit la descente (trois endroits disaient « 3 niveaux » chacun à sa façon) ; une seule table
`REGLES` pour l'équilibrage ; `python3 outils/verifier.py` lance tous les contrôles d'un coup ; vos 13 tuiles retouchées
et vos palettes Jungle et Glacier sont maintenant les dessins par défaut du code.

**Pas fait** : le code reste écrit en très longues lignes (5 900 lignes pour 716 Ko). Le redécouper sans rien casser
demande une conversation à part, fichier par fichier, avec l'empreinte comme filet. Ordre conseillé : `08-faune.js`
(52 Ko, l'IA des ennemis), `14b-forage.js`, `07-generation.js`. `docs/conception.md` (133 Ko) est aussi à condenser.

## 6. Questions

1. **Prix du fabricateur** : je monte le réparobot à 45 de Matière dans vos réglages enregistrés ?
2. **Dégâts × 2** : je les inscris dans vos stats du Bestiaire (le crabot afficherait 6-12) et je retire le
   multiplicateur, ou vous préférez garder un bouton de difficulté global ?
3. **Coûts des groupes** (point 4 du § 1) : je les aligne sur les valeurs mesurées ?
4. **Renforts** : le message « Signal lointain… » vous prévient. On le garde, ou l'arrivée doit rester silencieuse ?
5. **Ordre des niveaux 5 à 8** : il vous convient ? Lequel je code ensuite ?
6. **Niveau 4** : la pompe et l'écluse d'abord, ou le Sondeur ?
