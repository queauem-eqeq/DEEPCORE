# Niveau 1 : l'Astroport (cimetière spatial)

Validé par l'utilisateur le 27 novembre 2026. Complète `claude/histoire.md` (cadre général, qui fait foi pour la trame).
Rien n'est encore codé. À recopier dans `docs/` du dépôt avec le reste de l'histoire.

## Décisions de l'utilisateur

- **Bâtisseur** : chantier des foreuses (pas les Anciens).
- **Ennemis** : ferrailleuses et gardes. Les ferrailleuses **ignorent la foreuse, sauf si elle les attaque ou
  s'approche de leur épave**.
- **Terminaux** : un mélange (boîtes noires des épaves, journaux de foreuses précédentes, registre du port).
- **Terrain** : l'actuel (extérieur massif, tunnels, complexe enfoui difficile d'accès) + les épaves.
- **Épaves** : de nombreux types différents, souvent plus petits que notre vaisseau.
- **Taille de carte : 4** pour ce niveau (les autres restent en taille 3).
- **Registre du port** : il affiche les numéros des parties précédentes du joueur.
- **Ton des textes** : validé (exemples ci-dessous).

## Archétype

**Terrain.** Extérieur massif, tunnels, complexe enfoui. La zone ovale dégagée autour de notre vaisseau est une
*fosse d'atterrissage* parmi des dizaines d'autres. Épaves de nombreux modèles (sondes, capsules, petits porteurs,
quelques grands), numérotées, souvent plus petites que notre vaisseau : des générations d'engins se sont succédé.
Quatre états : scellée, éventrée, squelette, fosse vide (il ne reste que l'empreinte). Plus on approche de l'entrée
du complexe, plus elles sont anciennes et dépecées.

**Bâti.** Un dépôt de tri creusé dans la montagne, murs en plaques de coque dont les numéros se lisent encore.
Dehors le chaos, dedans un ordre maniaque : pièces triées, alignées, étiquetées. Entrée unique au bout d'un tunnel,
gardée. Puits de descente au fond.

**Modules à dessiner (16 × 16 au plus).** Fosse vide ; épaves de plusieurs gabarits (petite sonde, capsule, porteur),
éventrées (abri et butin) ou scellées (terminal « boîte noire » dedans) ; rangée de coques formant un couloir ; tas de
ferraille (artefact « machines ») ; mât-balise (artefact « antenne ») ; sas du dépôt ; magasin de pièces (artefact
« vitrines ») ; quai de tri.

**Ennemis.**

| Rôle | Groupes existants | Où | Patrouille |
|---|---|---|---|
| Ferrailleuses | Crabots, Escouade de réparation, Essaim de drones | Extérieur, autour des épaves | Navette épave → sas |
| Gardes | 2-3 sentinelles, Poste de garde | Sas et dépôt | Garde, territoire |

Écartés du niveau 1 : Broyeur, artilleurs, englueur, mines, puces en masse.
À coder : l'état « à l'ouvrage » des ferrailleuses (indifférentes tant qu'on ne les attaque pas et qu'on n'approche
pas de leur épave).

**Ce que le décor raconte, sans le dire.** Beaucoup sont arrivés avant nous, depuis longtemps (les modèles ont
changé) ; personne n'est reparti ; quelqu'un range, et tout ce qui est démonté descend. En fin de niveau, des
ferrailleuses commencent à tourner autour de *notre* vaisseau.

## Textes de référence (cinq canaux)

**Journal de la foreuse**
```
ATTERRISSAGE CONFORME. SITE : ASTROPORT. UNITÉ F.467 mkIV EN SERVICE.
CONTACT : 3 MOBILES. SIGNATURE : MÉTAL. CLASSEMENT : MENACE.
STRUCTURE : VAISSEAU. HORS SERVICE. NON RÉPERTORIÉ.
STRUCTURE : VAISSEAU. MODÈLE INCONNU. NON RÉPERTORIÉ. OCCURRENCE : 14.
MOBILE IGNORE L'UNITÉ. ACTIVITÉ : DÉCOUPE. CLASSEMENT MAINTENU : MENACE.
```

**Rapport de mission à l'origine** (à la descente)
```
RAPPORT 001 — F.467 mkIV → ORIGINE
PHASE ......... SURFACE / ASTROPORT
ÉTAT UNITÉ .... 84 %
GREFFON ....... VIDE
MENACES ....... 11 NEUTRALISÉES
OBSERVATIONS .. ÉPAVES SUR SITE : 31. NON PRÉVUES AU PLAN DE MISSION.
DEMANDE ....... MISE À JOUR DU PLAN DE MISSION.

ORIGINE → F.467 mkIV : REÇU. PLAN DE MISSION INCHANGÉ. POURSUIVRE.
NOYAU D'ORIGINE : 61 %
```

**Terminal lu**
```
PORTEUR 0211 — ENREGISTREUR
LARGAGE UNITÉ F.211 mkII : CONFORME.
ATTENTE RETOUR UNITÉ.
ATTENTE RETOUR UNITÉ.
[9 412 ENTRÉES IDENTIQUES]
DÉCOUPE DÉTECTÉE SUR COQUE. ATTENTE RETOUR UNITÉ.
```
```
F.398 mkIII — JOURNAL
ATTERRISSAGE CONFORME. SITE : ASTROPORT.
CONTACT : 2 MOBILES. CLASSEMENT : MENACE.
STRUCTURE : VAISSEAU. NON RÉPERTORIÉ.
```
```
REGISTRE — AIRE 3
ARRIVÉE 0465   FOSSE 07 (LIBÉRÉE)
ARRIVÉE 0466   FOSSE 12 (LIBÉRÉE)
ARRIVÉE 0467   FOSSE 09
DÉPART  —
FOSSE 09 : LIBÉRATION PRÉVUE.
```
Les numéros du registre sont ceux des parties précédentes du joueur ; la dernière ligne est la partie en cours.

**Analyse de la foreuse**
```
ANALYSE : FORMAT RECONNU. CONTENU HORS MISSION. DONNÉES NON PERTINENTES.
ANALYSE : CONTENU IDENTIQUE AU JOURNAL DE L'UNITÉ À 97 %. ERREUR DE LECTURE PROBABLE. CLASSÉ.
ANALYSE : ÉPAVES : 31. PLAN DE MISSION : MISSIONS ANTÉRIEURES = 0. ÉCART SIGNALÉ.
```

**Tentative de connexion au noyau** (mât-balise ou terminal : pas de FABLAB au niveau 1)
```
LIAISON — TENTATIVE 1
PORTEUSE ...... DÉTECTÉE, ORIGINE : PROFONDEUR
SYNCHRO ....... ÉCHEC
PROTOCOLE ..... INCONNU
RÉPONSE ....... AUCUNE
ANOMALIE ...... LIAISON MAINTENUE 4,2 s PAR L'AUTRE EXTRÉMITÉ.
LIAISON ROMPUE.
```

## Chantiers de code, dans l'ordre proposé

1. Carte en taille 4 pour le niveau 1 ; épaves (plusieurs gabarits, quatre états, numéros) et fosses.
2. Modules du niveau 1 dans l'éditeur du Lab ; groupes du niveau 1 dans LIFE.
3. État « à l'ouvrage » des ferrailleuses (nouvelle mécanique : Opus).
4. Les cinq canaux de texte : journal, rapport et accusé à la descente, terminaux (dont registre des parties
   précédentes), analyse, tentative de connexion.
