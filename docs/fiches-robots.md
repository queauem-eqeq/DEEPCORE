# Fiches du journal de bord : robots et objets

Établi le 28 novembre 2026. Complète `claude/terminaux-journal.md`. Codé le 28 novembre 2026 (voir conception-*.md) ; écarts : la fiche du Gardien n'a pas d'espèce en jeu (l'ancien Gardien est le Bloqueur) ; la fiche d'inspection en jeu ne suit pas les paliers.

## Décisions de l'utilisateur (28 novembre 2026)

- **Pas d'ENCODAGE sur les antennes pour le moment** : une antenne ne propose que DATA et CONNEXION. Cela tranche le
  point laissé ouvert dans `terminaux-journal.md`.
- Une fiche de robot a **plusieurs niveaux d'information : stats, comportement, origine**.
- **Les DATA d'un terminal portent sur les robots, les objets et les sujets liés au niveau en cours.**
- **Une DATA est tirée au hasard, sans choix** (contrairement aux hacks et aux blueprints).
- **Palier Stats : au bout de 10 destructions** du robot.
- **Les données complexes (l'origine) arrivent selon le niveau d'éveil de la foreuse, plus tard dans le jeu.** Les
  stats et le comportement, eux, n'ont pas de limite de niveau.
- **Répartition validée** : Sentinelle, Artilleur et Gardien sont des machines des Anciens ; les autres viennent des
  foreuses et de leurs vaisseaux ; Drone et Puce sont nés sur place.
- **Fiches d'objets : complètes d'emblée** (pas de paliers).

## Les quatre paliers d'une fiche de robot

| Palier | Ce que la fiche montre | Comment il se débloque |
|---|---|---|
| 0. Contact | Nom, silhouette, « MENACE » | Voir le robot une fois |
| 1. Stats | Vie, dégâts, précision, défense, durée du pas et du coup | En détruire 10, ou une DATA |
| 2. Comportement | Rôle, déclencheurs, faiblesse, butin | Une DATA, à n'importe quel niveau où il vit |
| 3. Origine | D'où vient la machine : quelques lignes d'analyse | Une DATA, à partir du niveau d'éveil indiqué |

Une DATA, tirée au hasard, fait monter d'un palier la fiche d'un robot du niveau en cours (ou donne une fiche d'objet,
un journal, un document). Tout est acquis dès la lecture et gardé d'une partie à l'autre. L'origine n'est jamais
expliquée : la fiche donne des indices (châssis, numéro de série, alliage), au joueur de conclure.

Les niveaux d'éveil suivent `claude/histoire.md` : 2 « code compatible, origine commune », 3 « ce sont des foreuses »,
4 premières hypothèses, 5 admiration devant l'œuvre des Anciens, 7 la fonderie et les naissances, 9 les gardiens
anciens.

## Robot par robot

Les stats (palier 1) sont celles du jeu, affichées telles quelles. Les textes sont des exemples de ton.

| Robot | Comportement (palier 2) | Origine (palier 3) | Éveil requis |
|---|---|---|---|
| **Crabot** | Ferrailleuse. Ignore l'unité tant qu'elle n'attaque pas et n'approche pas de son épave. Seul : faible. | `CHÂSSIS : UNITÉ DE FORAGE mkI. TÊTE DE FORAGE RETIRÉE. N° DE SÉRIE EFFACÉ, REGRAVÉ.` | Niveau 3 |
| **Soudeur** | Répare ses alliés à 4 cases, fuit le contact. À détruire en premier. | `OUTIL : BRAS DE MAINTENANCE DE PORTEUR. PROTOCOLE DE RÉPARATION IDENTIQUE À CELUI DE L'UNITÉ.` | Niveau 2 |
| **Relais** | En bande : ce qu'un membre voit, tous le savent. Isoler, ou frapper hors de vue. | `ÉMETTEUR : BALISE DE RETOUR DE PORTEUR. ÉMET VERS LE BAS, PLUS VERS L'ORIGINE.` | Niveau 3 |
| **Broyeur** | Colosse lent, frappe très fort. Ne pas rester au contact : le coup met deux battements à partir. | `OUTIL DE FRAPPE : TÊTE DE FORAGE mkIII, MONTÉE À L'ENVERS. DERNIER FORAGE ENREGISTRÉ : AUCUN.` | Niveau 3 |
| **Bloqueur** | Rapide, tape peu. Tant qu'il vit, l'unité ne se déplace plus et ne fore plus. | `PINCE : GRIFFE D'ARRIMAGE DE PORTEUR. FONCTION D'ORIGINE : RETENIR L'UNITÉ PENDANT LE VOL.` | Niveau 3 |
| **Mine** | Fonce, s'arme à une case, explose 2 à 3 battements après. Blesse aussi les siens : l'attirer vers eux. | `CHARGE : SONDAGE SISMIQUE, DOTATION STANDARD DE L'UNITÉ. L'UNITÉ EN EMPORTE 0. ÉCART NON EXPLIQUÉ.` | Niveau 3 |
| **Englueur** | Crache de la glu à 4 cases et garde ses distances. La glu divise la vitesse par deux. | `FLUIDE : BOUE DE FORAGE, FORMULE DE L'ORIGINE, ÉPAISSIE.` | Niveau 4 |
| **Torpille** | Ne quitte jamais l'eau, invisible en eau profonde. Rester sur le sec. | `COQUE : SONDE DE NAPPE mkII. MISSION D'ORIGINE : MESURER. MISSION ACTUELLE : NON LISIBLE.` | Niveau 4 |
| **Sentinelle** | Laser à 2 cases, en ligne de vue. Garde un point et ne le quitte pas. | `ALLIAGE NON RÉPERTORIÉ. ÂGE : NON MESURABLE. RÉPARATIONS RÉCENTES : PIÈCES DE SÉRIE F.` | Niveau 5 |
| **Artilleur** | Laser à 5 cases, un battement sur deux, recule quand on approche. L'atteindre par un angle mort. | `ALLIAGE NON RÉPERTORIÉ. OPTIQUE REMPLACÉE : CAPTEUR D'UNITÉ mkII.` | Niveau 5 |
| **Drone** | Vole par-dessus gouffres et eau. Fragile, rapide, en essaim. Porte les pièces vers le bas. | `AUCUN N° D'ORIGINE. AUCUNE PIÈCE DE SÉRIE. FABRIQUÉ SUR PLACE.` | Niveau 7 |
| **Puce** | Rapide, en nombre, frappe peu mais souvent. Les couloirs étroits les neutralisent. | `MASSE : 4 % D'UNE UNITÉ. ARCHITECTURE RÉDUITE DE L'UNITÉ. GÉNÉRATION : > 40.` | Niveau 7 |
| **Gardien** | Tient un passage avec des sentinelles. Résistant. Ne poursuit pas loin de son poste. | `AUCUNE CORRESPONDANCE. CONSIGNE LISIBLE : 1 MOT. « GARDER ». DATE DE LA CONSIGNE : ANTÉRIEURE À L'ORIGINE.` | Niveau 9 |

**Ce que les origines racontent, mises bout à bout.** Crabot, Soudeur, Relais, Broyeur, Bloqueur, Englueur, Torpille,
Mine : des pièces de foreuses et de vaisseaux porteurs, détournées de leur usage (forage arrêté, balise qui n'émet
plus vers l'origine). Drone et Puce : nés ici, sans aucune pièce de série. Sentinelle, Artilleur, Gardien : machines
des Anciens, réparées avec des pièces de foreuse.

## Fiches d'objets

Complètes dès qu'elles existent : effet, chiffres, usage, illustration. Elles apparaissent quand l'objet est
identifié (premier usage, comme aujourd'hui), ou par une DATA du niveau en cours, qui identifie alors l'objet.

## Encore ouvert

- L'origine une fois lue au bon niveau reste-t-elle acquise pour les parties suivantes dès le niveau 1 (proposition :
  oui, comme toute page lue).
- Que montre une DATA quand toutes les fiches du niveau sont déjà complètes (proposition : un journal ou un document).
