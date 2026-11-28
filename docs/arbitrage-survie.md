# Fiche d'arbitrage — Survie (fuel, vie, repos, ennemis, arme de tir)

Arbitrée par l'utilisateur le 28 novembre 2026 à 10 h 30. Recopiée du projet claude.ai : le dépôt fait foi. Les règles
de principe sont dans `boucle-amelioration.md` ; ce qui est codé est décrit dans `conception-*.md`, les mesures dans
`mesures.md` (sections « Référence avant le chantier survie », « Survie B », « Survie C »).

## Décisions (utilisateur, 28 novembre 2026)

1. **Fuel** : 1 point tous les 12 battements (jauge de 100).
2. **Vie automatique** : +1 tous les 20 battements en marche, +1 tous les 4 au repos.
3. **Ennemis** : nombre × 0,6, dégâts × 1,6, recalé par simulation sur « un groupe de face = un tiers de la vie ».
4. **Arme de tir : pas de plug-ins.** Feu, glu, shotgun et laser sont des **armes à part entière** ; en équiper une
   **remplace le canon** de base. Une seule arme de tir à la fois. Cela remplace la décision du 27 novembre
   (« chaque plug-in ajoute à la consommation »).

## Constat de départ

- Avant le chantier : vie 100, énergie 100 (rechargée de POW/10 par battement, doublée en attendant), forage 10,
  course 5, frapper gratuit. Ni fuel, ni vie qui remonte, ni arme de tir.
- Mesuré le 23 novembre (avant la PR #43) : les éclats rendaient 260 PV par niveau, plus que le niveau affronté de
  face (176 à 251). La vie n'était jamais une contrainte.
- Mesuré dans la PR #43 (ennemis × 0,5, dégâts × 2) : deux crabots coûtaient 44 de vie, le Broyeur gagnait presque un
  duel sur deux. Cible : un groupe affronté de face = un tiers de la vie.

## 1. Fuel (jauge de 100)

| | Rythme | Autonomie sans miner | Ce que ça change |
|---|---|---|---|
| **A, retenu** | 1 point tous les 12 battements | 1 200 battements | Il faut miner environ 2 gisements par niveau. Traîner coûte. |
| B, serré | 1 point tous les 8 | 800 | Chaque niveau est une course. |
| C, large | 1 point tous les 20 | 2 000 | Le fuel ne gêne que si on campe. |

Par défaut : 4 gisements par carte (7 auparavant) qui donnent +15 / +20 / +25 de fuel au lieu de la vie ; objet
« cellule de fuel » +30 ; chaque descente rend +30 ; à sec, −1 de vie tous les 5 battements.

## 2. Vie automatique

| | En marche | Au repos | Ce que ça change |
|---|---|---|---|
| **A, retenu** | +1 tous les 20 battements | +1 tous les 4 | Un niveau rend environ 50 PV en jouant. Se refaire de 0 à 100 coûte 400 battements, soit un tiers du fuel. |
| B, lente | +1 tous les 40 | +1 tous les 8 | La vie reste rare. |
| C, rapide | +1 tous les 10 | +1 tous les 2 | Seul le fuel limite. |

Par défaut : repos interrompu dès qu'un ennemi chasse (on peut encore attendre à la main) ; réparobots gardés (+50),
deux fois et demie plus rares dans le butin ; Module de puissance : POW inchangé, et +10 de vie maximale.

## 3. Ennemis

| | Nombre | Dégâts | Ce que ça change |
|---|---|---|---|
| A, comme la PR #43 | × 0,5 | × 2 | Mesuré au-dessus de la cible. |
| **B, retenu** | × 0,6 | × 1,6 | Vise le tiers de vie par groupe ; recalé par simulation avant publication. |
| C, prudent | × 0,75 | × 1,3 | Changement léger. |

Par défaut : le niveau 1 garde ses ferrailleuses indifférentes ; le multiplicateur s'applique aux groupes hostiles.
Les renforts périodiques ne sont pas dans ce cycle.

## 4. Arme de tir

Fixé : arme secondaire à projectiles, portée = la vue, bruit du forage de base, 20 d'énergie par tir.

Proposé par défaut, à régler après essai :

| Arme | Effet | Énergie par tir |
|---|---|---|
| Canon (de base, dès le départ) | cinétique : 70 % du coup de forage, précision −10 | 20 |
| Lance-flammes | dégâts + brûle | 25 |
| Canon à glu | dégâts + ralentit | 25 |
| Shotgun | courte portée, dégâts de zone | 30 |
| Laser | le tir traverse les ennemis | 30 |

Un tir = un coup (durée 100). Les quatre armes sont des objets du FABLAB (blueprints au terminal) ; l'arme retirée
retourne dans l'inventaire. Objets « forage silencieux » et « tir silencieux » (bruit ÷ 2). Équipement : 5 objets +
foreuse + tir + armure. Énergie : forage 5, course 5. Les hacks Tir deviennent proposables au terminal, et SYMBIOSE
revient à « vie × 2, fuel × 1,5 ».

## Après l'essai, trois questions

Trop facile, trop dur ou juste ; le moment le plus tendu ; ce qui a paru injuste ou ennuyeux.
