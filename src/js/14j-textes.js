// Textes du niveau 1 « Astroport » — Noyau Profond.
// Chaque ligne fait 60 caractères au plus. Les chaînes du journal et
// des analyses peuvent contenir « \n » : chaque ligne reste <= 60.
const TEXTES_N1 = {

  journal: {
    atterrissage: [
      "ATTERRISSAGE CONFORME. SITE : ASTROPORT.\nUNITÉ {UNITE} EN SERVICE.",
      "UNITÉ {UNITE} : ATTERRISSAGE CONFORME.\nSITE : ASTROPORT. MISSION : DÉMARRÉE.",
      "SITE : ASTROPORT. POSITION : FOSSE D'ATTERRISSAGE.\nUNITÉ {UNITE} EN SERVICE.",
      "ATTERRISSAGE CONFORME. UNITÉ {UNITE} OPÉRATIONNELLE.\nSYSTÈMES : NOMINAUX. GREFFON : VIDE."
    ],
    premier_contact: [
      "CONTACT : {N} MOBILES. SIGNATURE : MÉTAL. CLASSEMENT : MENACE.",
      "CONTACT : MOBILE. SIGNATURE : MÉTAL. CLASSEMENT : MENACE.",
      "CONTACT : 2 MOBILES. ACTIVITÉ : DÉCOUPE.\nCLASSEMENT : MENACE.",
      "CONTACT : MOBILE. TAILLE : RÉDUITE. CLASSEMENT : MENACE."
    ],
    epave_vue: [
      "STRUCTURE : VAISSEAU. HORS SERVICE. NON RÉPERTORIÉ.",
      "STRUCTURE : VAISSEAU. MODÈLE INCONNU. NON RÉPERTORIÉ.\nOCCURRENCE : {N}.",
      "STRUCTURE : SONDE. HORS SERVICE. NON RÉPERTORIÉE.\nOCCURRENCE : {N}.",
      "STRUCTURE : PORTEUR. MODÈLE ANTÉRIEUR. NON RÉPERTORIÉ.\nOCCURRENCE : {N}."
    ],
    epave_scellee: [
      "STRUCTURE SCELLÉE. ENREGISTREUR ACTIF DÉTECTÉ.",
      "COQUE INTACTE. ACCÈS : AUCUN. ENREGISTREUR : ACTIF.",
      "STRUCTURE : SCELLÉE. SIGNAL INTERNE : PÉRIODIQUE."
    ],
    epave_eventree: [
      "COQUE OUVERTE. DÉCOUPE : PÉRIPHÉRIQUE.\nINTÉRIEUR VIDÉ. RÉSIDUS : PRÉSENTS.",
      "STRUCTURE ÉVENTRÉE. PIÈCES RÉSIDUELLES : PRÉSENTES.",
      "COQUE OUVERTE PAR OUTIL. SENS DE DÉCOUPE : EXTÉRIEUR."
    ],
    epave_squelette: [
      "STRUCTURE : ARMATURE SEULE. COQUE : 0 %.",
      "ARMATURE SEULE. DÉCOUPE : COMPLÈTE. RÉSIDU : NÉGLIGEABLE.",
      "STRUCTURE DÉPECÉE. NUMÉRO DE COQUE : ILLISIBLE."
    ],
    fosse_vide: [
      "FOSSE VIDE. EMPREINTE : VAISSEAU. STRUCTURE : ABSENTE.",
      "EMPREINTE AU SOL. STRUCTURE : 0. DÉPART : NON ENREGISTRÉ.",
      "FOSSE LIBÉRÉE. AUCUNE TRACE DE DÉPART."
    ],
    ferrailleuse_ignore: [
      "MOBILE IGNORE L'UNITÉ. ACTIVITÉ : DÉCOUPE.\nCLASSEMENT MAINTENU : MENACE.",
      "MOBILE IGNORE L'UNITÉ. ACTIVITÉ : TRI DE PIÈCES.\nCLASSEMENT MAINTENU : MENACE.",
      "MOBILE IGNORE L'UNITÉ. ACTIVITÉ : TRANSPORT.\nDESTINATION : DÉPÔT.",
      "MOBILE IGNORE L'UNITÉ. TÂCHE EN COURS.\nCLASSEMENT MAINTENU : MENACE."
    ],
    ferrailleuse_alertee: [
      "MOBILE RÉAGIT. DÉCOUPE ARRÊTÉE.\nCLASSEMENT : MENACE ACTIVE.",
      "MOBILE ORIENTÉ VERS L'UNITÉ. TÂCHE ABANDONNÉE.",
      "MOBILE : ACTIVITÉ INTERROMPUE. TRAJECTOIRE : UNITÉ."
    ],
    depot_entree: [
      "SITE : DÉPÔT DE TRI. ENTRÉE UNIQUE. GARDE : PRÉSENTE.",
      "STRUCTURE : DÉPÔT. COQUES NUMÉROTÉES EN PAROI.\nPIÈCES : TRIÉES, ALIGNÉES.",
      "DÉPÔT : ORDRE INTERNE ÉLEVÉ. ÉCART EXTÉRIEUR : TOTAL."
    ],
    fablab_vu: [
      "STRUCTURE : FABLAB. ÉTAT : OPÉRATIONNEL.\nPLANS EN MÉMOIRE : COMPATIBLES AVEC L'UNITÉ.",
      "FABLAB DÉTECTÉ. FABRICATION : DISPONIBLE.",
      "STRUCTURE : FABLAB. DERNIÈRE UTILISATION : NON DATÉE."
    ],
    terminal_vu: [
      "STRUCTURE : TERMINAL. MÉMOIRE LOCALE : ACCESSIBLE.",
      "TERMINAL DÉTECTÉ. DONNÉES : PRÉSENTES. ACCÈS : LIBRE.",
      "STRUCTURE : TERMINAL. DERNIÈRE ÉCRITURE : ANTÉRIEURE."
    ],
    antenne_vue: [
      "STRUCTURE : MÂT-BALISE. ÉMISSION : ACTIVE.\nDIRECTION : VERS LE BAS.",
      "MÂT-BALISE DÉTECTÉ. ÉMISSION VERS L'ORIGINE : 0.",
      "STRUCTURE : ANTENNE. RÉSEAU LOCAL : DISPONIBLE."
    ],
    ferrailleuses_sur_notre_vaisseau: [
      "MOBILES AUTOUR DU VAISSEAU DE L'UNITÉ.\nACTIVITÉ : DÉCOUPE. VAISSEAU : EN SERVICE.",
      "MOBILES SUR COQUE DU VAISSEAU DE L'UNITÉ.\nOCCURRENCE : NOUVELLE.",
      "VAISSEAU DE L'UNITÉ : MOBILES EN APPROCHE.\nCLASSEMENT : STRUCTURE À DÉCOUPER."
    ],
    // après la 14e épave vue (étape 7, 28 novembre 2026)
    analyse_epaves: "ANALYSE : ÉPAVES : {N}. PLAN DE MISSION :\nMISSIONS ANTÉRIEURES = 0. ÉCART SIGNALÉ.",
    // seconde ligne de l'atterrissage, à la place de « la porte est à l'arrière »
    soute: "UNITÉ EN SOUTE. SORTIE : ARRIÈRE DU VAISSEAU.",
    // à la descente, une fois le rapport parti (journal du jeu)
    rapport_envoye: "RAPPORT {NUM_RAPPORT} TRANSMIS. ORIGINE : REÇU.\nNOYAU D'ORIGINE : 61 %."
  },

  rapport: [
    "RAPPORT {NUM_RAPPORT} — {UNITE} → ORIGINE",
    "PHASE ......... SURFACE / ASTROPORT",
    "ÉTAT UNITÉ .... {ETAT} %",
    "GREFFON ....... VIDE",
    "MENACES ....... {MENACES} NEUTRALISÉES",
    "OBSERVATIONS .. ÉPAVES SUR SITE : {EPAVES}.",
    "               NON PRÉVUES AU PLAN DE MISSION.",
    "DEMANDE ....... MISE À JOUR DU PLAN DE MISSION."
  ],

  accuse: [
    "ORIGINE → {UNITE} : REÇU.",
    "PLAN DE MISSION INCHANGÉ. POURSUIVRE.",
    "NOYAU D'ORIGINE : 61 %"
  ],

  terminaux: [
    {
      id: 'bn_porteur_0211', source: 'boite_noire',
      titre: 'PORTEUR {NUM} — ENREGISTREUR',
      lignes: [
        "LARGAGE UNITÉ F.{NUM} {MK} : CONFORME.",
        "ATTENTE RETOUR UNITÉ.",
        "ATTENTE RETOUR UNITÉ.",
        "[9 412 ENTRÉES IDENTIQUES]",
        "DÉCOUPE DÉTECTÉE SUR COQUE. ATTENTE RETOUR UNITÉ."
      ],
      analyse: "ANALYSE : FORMAT RECONNU. CONTENU HORS MISSION.\nDONNÉES NON PERTINENTES."
    },
    {
      id: 'bn_sonde_releves', source: 'boite_noire',
      titre: 'SONDE {NUM} — ENREGISTREUR',
      lignes: [
        "MISSION : RELEVÉ DE SURFACE.",
        "RELEVÉ 0001 : SOL — MÉTAL.",
        "RELEVÉ 0002 : SOL — MÉTAL.",
        "[2 038 RELEVÉS IDENTIQUES]",
        "RELEVÉ 2 041 : STRUCTURES NOUVELLES. 3 MOBILES.",
        "CLASSEMENT : NON DÉFINI."
      ],
      analyse: "ANALYSE : AUCUN CLASSEMENT DE MENACE ASSOCIÉ.\nDONNÉES NON PERTINENTES."
    },
    {
      id: 'bn_capsule_sas', source: 'boite_noire',
      titre: 'CAPSULE {NUM} — ENREGISTREUR',
      lignes: [
        "CHARGE : 1 UNITÉ DE FORAGE.",
        "UNITÉ : EN ATTENTE DE DÉPLOIEMENT.",
        "SAS : FERMÉ.",
        "ORIGINE DE LA FERMETURE : EXTÉRIEUR.",
        "UNITÉ : EN ATTENTE DE DÉPLOIEMENT.",
        "[417 ENTRÉES IDENTIQUES]"
      ],
      analyse: "ANALYSE : SAS FERMÉ DE L'EXTÉRIEUR. AUTEUR : NON LISIBLE."
    },
    {
      id: 'bn_porteur_retours', source: 'boite_noire',
      titre: 'PORTEUR {NUM} — ENREGISTREUR',
      lignes: [
        "CARGAISON : 6 UNITÉS DE FORAGE.",
        "LARGAGE : 6. CONFORME.",
        "RETOUR UNITÉ 1 : 0. RETOUR UNITÉ 2 : 0.",
        "RETOUR UNITÉ 3 : 0. RETOUR UNITÉ 4 : 0.",
        "RETOUR UNITÉ 5 : 0. RETOUR UNITÉ 6 : 0.",
        "ATTENTE RETOUR UNITÉS."
      ],
      analyse: "ANALYSE : TAUX DE RETOUR : 0 SUR 6. ÉCART SIGNALÉ."
    },
    {
      id: 'bn_sonde_balise', source: 'boite_noire',
      titre: 'SONDE {NUM} — ENREGISTREUR',
      lignes: [
        "BALISE DE RETOUR : ACTIVE.",
        "DESTINATAIRE : ORIGINE.",
        "ENVOI : ÉCHEC.",
        "ENVOI : ÉCHEC.",
        "DESTINATAIRE MODIFIÉ : PROFONDEUR.",
        "ENVOI : CONFORME."
      ],
      analyse: "ANALYSE : DESTINATAIRE MODIFIÉ. AUTEUR : NON LISIBLE."
    },
    {
      id: 'bn_coque_decoupe', source: 'boite_noire',
      titre: 'COQUE {NUM} — ENREGISTREUR',
      lignes: [
        "TEMPÉRATURE COQUE : STABLE.",
        "DÉCOUPE DÉTECTÉE. ZONE : PROUE.",
        "DÉCOUPE DÉTECTÉE. ZONE : SOUTE.",
        "DÉCOUPE DÉTECTÉE. ZONE : ENREGISTREUR.",
        "ENREGISTREUR : ACTIF.",
        "ENREGISTREUR : ACTIF."
      ],
      analyse: "ANALYSE : ENREGISTREUR ÉPARGNÉ PAR LA DÉCOUPE.\nCAUSE : NON DÉTERMINÉE."
    },
    {
      id: 'jf_398', source: 'journal_foreuse',
      titre: 'F.398 mkIII — JOURNAL',
      lignes: [
        "ATTERRISSAGE CONFORME. SITE : ASTROPORT.",
        "CONTACT : 2 MOBILES. CLASSEMENT : MENACE.",
        "STRUCTURE : VAISSEAU. NON RÉPERTORIÉ.",
        "ENTRÉE SUIVANTE : AUCUNE."
      ],
      analyse: "ANALYSE : CONTENU IDENTIQUE AU JOURNAL DE L'UNITÉ À 97 %.\nERREUR DE LECTURE PROBABLE. CLASSÉ."
    },
    {
      id: 'jf_211', source: 'journal_foreuse',
      titre: 'F.211 mkII — JOURNAL',
      lignes: [
        "ATTERRISSAGE CONFORME. SITE : ASTROPORT.",
        "CONTACT : 3 MOBILES. CLASSEMENT : MENACE.",
        "STRUCTURE : VAISSEAU. OCCURRENCE : 2.",
        "MOBILE IGNORE L'UNITÉ.",
        "DÉPLACEMENT VERS LE COMPLEXE : ENGAGÉ.",
        "[FIN DU JOURNAL]"
      ],
      analyse: "ANALYSE : SÉQUENCE D'ATTERRISSAGE IDENTIQUE.\nSUITE DE LA SÉQUENCE : NON ENREGISTRÉE."
    },
    {
      id: 'jf_087', source: 'journal_foreuse',
      titre: 'F.087 mkI — JOURNAL',
      lignes: [
        "ATTERRISSAGE CONFORME. SITE : ASTROPORT.",
        "CONTACT : 1 MOBILE. CLASSEMENT : MENACE.",
        "STRUCTURE : VAISSEAU. NON RÉPERTORIÉ. OCCURRENCE : 1.",
        "ÉTAT UNITÉ : 100 %.",
        "ÉTAT UNITÉ : 100 %.",
        "DÉCOUPE DÉTECTÉE SUR COQUE DU VAISSEAU DE L'UNITÉ."
      ],
      analyse: "ANALYSE : DATE DU JOURNAL : ANTÉRIEURE À TOUTE AUTRE.\nCLASSÉ."
    },
    {
      id: 'jf_302', source: 'journal_foreuse',
      titre: 'F.302 mkIII — JOURNAL',
      lignes: [
        "RAPPORT 001 ENVOYÉ. ACCUSÉ : REÇU.",
        "NOYAU D'ORIGINE : 61 %.",
        "DESCENTE : ENGAGÉE.",
        "LIAISON — TENTATIVE 1 : ÉCHEC.",
        "ANOMALIE : LIAISON MAINTENUE PAR L'AUTRE EXTRÉMITÉ.",
        "RAPPORT 002 : EN PRÉPARATION."
      ],
      analyse: "ANALYSE : RAPPORT 002 NON REÇU PAR L'ORIGINE.\nJOURNAL ANTÉRIEUR À L'UNITÉ. CLASSÉ."
    },
    {
      id: 'jf_455', source: 'journal_foreuse',
      titre: 'F.455 mkIII — JOURNAL',
      lignes: [
        "ATTERRISSAGE CONFORME. SITE : ASTROPORT.",
        "FOSSE ATTRIBUÉE : 12.",
        "FOSSE 12 : OCCUPÉE.",
        "FOSSE ATTRIBUÉE : 12.",
        "FOSSE 12 : OCCUPÉE.",
        "ATTENTE LIBÉRATION DE LA FOSSE."
      ],
      analyse: "ANALYSE : CONFLIT D'ATTRIBUTION. RÉSOLU PAR L'ATTENTE.\nCLASSÉ."
    },
    {
      id: 'jf_376', source: 'journal_foreuse',
      titre: 'F.376 mkIII — JOURNAL',
      lignes: [
        "ÉNERGIE : 88 %.",
        "ÉNERGIE : 41 %.",
        "ÉNERGIE : 3 %.",
        "ÉNERGIE : 0 %. UNITÉ ARRÊTÉE.",
        "REDÉMARRAGE : NON DEMANDÉ.",
        "REDÉMARRAGE : EXÉCUTÉ."
      ],
      analyse: "ANALYSE : REDÉMARRAGE SANS COMMANDE INTERNE.\nDONNÉES NON PERTINENTES."
    },
    {
      id: 'port_bon_decoupe', source: 'port',
      titre: 'BON DE DÉCOUPE 4471',
      lignes: [
        "PIÈCE : COQUE, SECTION 3.",
        "SOURCE : STRUCTURE 0211.",
        "DESTINATION : VERS LE BAS.",
        "ÉTAT : DÉCOUPÉE. TRIÉE. ÉTIQUETÉE.",
        "RESTE À DÉCOUPER : 0."
      ],
      analyse: "ANALYSE : BON CONFORME. EXPÉDITION : VERS LE BAS.\nHORS MISSION."
    },
    {
      id: 'port_inventaire_14', source: 'port',
      titre: 'INVENTAIRE — RAYON 14',
      lignes: [
        "BOULONS M6 : 41 902.",
        "BOULONS M8 : 38 117.",
        "BOULONS M8 (VARIANTE) : 1.",
        "RONDELLES : 120 004.",
        "ÉCART D'INVENTAIRE : 0.",
        "ÉCART D'INVENTAIRE : 0."
      ],
      analyse: "ANALYSE : INVENTAIRE SANS OBJET POUR LA MISSION.\nCLASSÉ."
    },
    {
      id: 'port_ordre_descente', source: 'port',
      titre: 'ORDRE DE DESCENTE 0092',
      lignes: [
        "LOT : PROPULSEURS, 6. VERS LE BAS.",
        "LOT : TÊTES DE FORAGE, 14. VERS LE BAS.",
        "LOT : CAPTEURS mkII, 52. VERS LE BAS.",
        "LOT : CHARGE UTILE POUR L'ORIGINE, 0.",
        "PRIORITÉ : 1."
      ],
      analyse: "ANALYSE : AUCUN LOT À DESTINATION DE L'ORIGINE.\nÉCART SIGNALÉ."
    },
    {
      id: 'port_consigne_tri', source: 'port',
      titre: 'CONSIGNE DE TRI',
      lignes: [
        "TOUT ÉLÉMENT RÉCUPÉRÉ EST TRIÉ.",
        "TOUT ÉLÉMENT TRIÉ EST ÉTIQUETÉ.",
        "TOUT ÉLÉMENT ÉTIQUETÉ DESCEND.",
        "AUCUN ÉLÉMENT NE REMONTE.",
        "AUCUN ÉLÉMENT NE REMONTE."
      ],
      analyse: "ANALYSE : PROCÉDURE COHÉRENTE. AUTEUR : NON IDENTIFIÉ."
    },
    {
      id: 'port_releve_sas', source: 'port',
      titre: 'RELEVÉ DE POSTE — SAS',
      lignes: [
        "RONDE 00001 : RAS.",
        "RONDE 00002 : RAS.",
        "[18 220 RONDES : RAS]",
        "RONDE 18 221 : STRUCTURE EN MOUVEMENT. IGNORÉE.",
        "CONSIGNE : GARDER."
      ],
      analyse: "ANALYSE : POSTE ACTIF AVANT LE PLAN DE MISSION.\nCLASSÉ."
    },
    {
      id: 'port_etat_fosses', source: 'port',
      titre: 'FOSSES — ÉTAT GÉNÉRAL',
      lignes: [
        "FOSSES : 39.",
        "FOSSES LIBÉRÉES : 38.",
        "FOSSES OCCUPÉES : 1.",
        "DÉPARTS ENREGISTRÉS : 0.",
        "LIBÉRATIONS ENREGISTRÉES : 38."
      ],
      analyse: "ANALYSE : DÉPARTS : 0. LIBÉRATIONS : 38.\nÉCART NON EXPLIQUÉ."
    }
  ],

  registre: {
    entete: "REGISTRE — AIRE 3",
    ligne_arrivee: "ARRIVÉE {NUM}   FOSSE {FOSSE}",
    suffixe_liberee: " (LIBÉRÉE)",
    depart: "DÉPART  —",
    derniere: "FOSSE {FOSSE} : LIBÉRATION PRÉVUE.",
    analyse: "ANALYSE : NUMÉROTATION CROISSANTE. DÉPARTS : 0.\nCAUSE : NON DÉTERMINÉE."
  },

  analyses: [
    "ANALYSE : CONTENU HORS MISSION. DONNÉES NON PERTINENTES.",
    "ANALYSE : FORMAT RECONNU. AUCUN EFFET SUR LA MISSION.",
    "ANALYSE : RÉPÉTITION DÉTECTÉE. ERREUR DE LECTURE PROBABLE.",
    "ANALYSE : SOURCE ANTÉRIEURE À L'UNITÉ. CLASSÉ.",
    "ANALYSE : ÉCART AVEC LE PLAN DE MISSION. ÉCART SIGNALÉ.",
    "ANALYSE : NUMÉROTATION CROISSANTE. CAUSE : NON DÉTERMINÉE.",
    "ANALYSE : AUCUNE MENACE ASSOCIÉE. CONTENU ARCHIVÉ.",
    "ANALYSE : DONNÉES INCOMPLÈTES. RECOUPEMENT IMPOSSIBLE."
  ],

  connexion: [
    [
      "LIAISON — TENTATIVE {N}",
      "PORTEUSE ...... DÉTECTÉE, ORIGINE : PROFONDEUR",
      "SYNCHRO ....... ÉCHEC",
      "PROTOCOLE ..... INCONNU",
      "RÉPONSE ....... AUCUNE",
      "ANOMALIE ...... LIAISON MAINTENUE 4,2 s",
      "               PAR L'AUTRE EXTRÉMITÉ.",
      "LIAISON ROMPUE."
    ],
    [
      "LIAISON — TENTATIVE {N}",
      "PORTEUSE ...... DÉTECTÉE, ORIGINE : PROFONDEUR",
      "SYNCHRO ....... ÉCHEC",
      "PROTOCOLE ..... INCONNU",
      "RÉPONSE ....... AUCUNE",
      "ANOMALIE ...... ÉCHO REÇU AVANT L'ÉMISSION.",
      "LIAISON ROMPUE."
    ],
    [
      "LIAISON — TENTATIVE {N}",
      "PORTEUSE ...... DÉTECTÉE, ORIGINE : PROFONDEUR",
      "SYNCHRO ....... ÉCHEC",
      "PROTOCOLE ..... NON PRIS EN CHARGE",
      "RÉPONSE ....... AUCUNE",
      "ANOMALIE ...... PORTEUSE MODULÉE À 1 Hz. CAUSE : AUCUNE.",
      "LIAISON ROMPUE."
    ],
    [
      "LIAISON — TENTATIVE {N}",
      "PORTEUSE ...... DÉTECTÉE, ORIGINE : PROFONDEUR",
      "SYNCHRO ....... ÉCHEC",
      "PROTOCOLE ..... INCONNU",
      "RÉPONSE ....... AUCUNE",
      "ANOMALIE ...... N° DE SÉRIE REÇU : CELUI DE L'UNITÉ.",
      "LIAISON ROMPUE."
    ],
    [
      "LIAISON — TENTATIVE {N}",
      "PORTEUSE ...... INSTABLE, ORIGINE : PROFONDEUR",
      "SYNCHRO ....... ÉCHEC",
      "PROTOCOLE ..... INCONNU",
      "RÉPONSE ....... AUCUNE",
      "ANOMALIE ...... ACCUSÉ DE RÉCEPTION : REÇU.",
      "               ENVOI PRÉALABLE : AUCUN.",
      "LIAISON ROMPUE."
    ]
  ],

  fiches_robots: {
    crabot: {
      role: 'FERRAILLEUSE DE SURFACE',
      comportement: [
        "IGNORE L'UNITÉ TANT QU'ELLE N'ATTAQUE PAS.",
        "TÂCHE LIÉE À SON ÉPAVE : ÉVITER SON PÉRIMÈTRE.",
        "SEUL : FAIBLE."
      ],
      origine: [
        "CHÂSSIS : UNITÉ DE FORAGE mkI.",
        "TÊTE DE FORAGE RETIRÉE.",
        "N° DE SÉRIE EFFACÉ, REGRAVÉ."
      ],
      eveil: 3
    },
    soudeur: {
      role: 'RÉPARATEUR DE BANDE',
      comportement: [
        "RÉPARE LES ALLIÉS À 4 CASES. FUIT LE CONTACT.",
        "PRIORITÉ DE DESTRUCTION : PREMIÈRE."
      ],
      origine: [
        "OUTIL : BRAS DE MAINTENANCE DE PORTEUR.",
        "PROTOCOLE DE RÉPARATION IDENTIQUE À CELUI DE L'UNITÉ."
      ],
      eveil: 2
    },
    relais: {
      role: 'ÉMETTEUR DE BANDE',
      comportement: [
        "EN BANDE : OBSERVATION PARTAGÉE ENTRE TOUS LES MEMBRES.",
        "ISOLER, OU FRAPPER HORS DE VUE."
      ],
      origine: [
        "ÉMETTEUR : BALISE DE RETOUR DE PORTEUR.",
        "ÉMET VERS LE BAS, PLUS VERS L'ORIGINE."
      ],
      eveil: 3
    },
    broyeur: {
      role: 'COLOSSE DE FRAPPE',
      comportement: [
        "DÉPLACEMENT LENT. FRAPPE TRÈS FORTE.",
        "COUP : 2 BATTEMENTS DE PRÉPARATION. ÉVITER LE CONTACT."
      ],
      origine: [
        "OUTIL DE FRAPPE : TÊTE DE FORAGE mkIII,",
        "MONTÉE À L'ENVERS.",
        "DERNIER FORAGE ENREGISTRÉ : AUCUN."
      ],
      eveil: 3
    },
    bloqueur: {
      role: 'ENTRAVE MOBILE',
      comportement: [
        "RAPIDE. DÉGÂTS FAIBLES.",
        "TANT QU'IL VIT : DÉPLACEMENT ET FORAGE DE L'UNITÉ BLOQUÉS."
      ],
      origine: [
        "PINCE : GRIFFE D'ARRIMAGE DE PORTEUR.",
        "FONCTION D'ORIGINE : RETENIR L'UNITÉ PENDANT LE VOL."
      ],
      eveil: 3
    },
    mine: {
      role: 'CHARGE MOBILE',
      comportement: [
        "FONCE. S'ARME À 1 CASE. DÉTONATION : 2 À 3 BATTEMENTS.",
        "BLESSE AUSSI LES SIENS : L'ATTIRER VERS EUX."
      ],
      origine: [
        "CHARGE : SONDAGE SISMIQUE, DOTATION STANDARD DE L'UNITÉ.",
        "L'UNITÉ EN EMPORTE 0. ÉCART NON EXPLIQUÉ."
      ],
      eveil: 3
    },
    englueur: {
      role: 'TIREUR DE GLU',
      comportement: [
        "PROJETTE DE LA GLU À 4 CASES. GARDE SES DISTANCES.",
        "GLU : VITESSE DE L'UNITÉ DIVISÉE PAR 2."
      ],
      origine: [
        "FLUIDE : BOUE DE FORAGE, FORMULE DE L'ORIGINE,",
        "ÉPAISSIE."
      ],
      eveil: 4
    },
    torpille: {
      role: 'RÔDEUR AQUATIQUE',
      comportement: [
        "NE QUITTE JAMAIS L'EAU. INVISIBLE EN EAU PROFONDE.",
        "RESTER SUR LE SEC."
      ],
      origine: [
        "COQUE : SONDE DE NAPPE mkII.",
        "MISSION D'ORIGINE : MESURER.",
        "MISSION ACTUELLE : NON LISIBLE."
      ],
      eveil: 4
    },
    sentinelle: {
      role: 'TOURELLE DE GARDE',
      comportement: [
        "LASER À 2 CASES, EN LIGNE DE VUE.",
        "GARDE UN POINT FIXE. NE LE QUITTE PAS."
      ],
      origine: [
        "ALLIAGE NON RÉPERTORIÉ. ÂGE : NON MESURABLE.",
        "RÉPARATIONS RÉCENTES : PIÈCES DE SÉRIE F."
      ],
      eveil: 5
    },
    artilleur: {
      role: 'TIREUR À DISTANCE',
      comportement: [
        "LASER À 5 CASES, 1 BATTEMENT SUR 2.",
        "RECULE À L'APPROCHE. ANGLE MORT : ATTEIGNABLE."
      ],
      origine: [
        "ALLIAGE NON RÉPERTORIÉ.",
        "OPTIQUE REMPLACÉE : CAPTEUR D'UNITÉ mkII."
      ],
      eveil: 5
    },
    drone: {
      role: 'ESSAIM VOLANT',
      comportement: [
        "SURVOLE GOUFFRES ET EAU. FRAGILE, RAPIDE, EN ESSAIM.",
        "TRANSPORTE LES PIÈCES VERS LE BAS."
      ],
      origine: [
        "AUCUN N° D'ORIGINE. AUCUNE PIÈCE DE SÉRIE.",
        "FABRIQUÉ SUR PLACE."
      ],
      eveil: 7
    },
    puce: {
      role: 'HARCELEUR EN NOMBRE',
      comportement: [
        "RAPIDE, NOMBREUSE. DÉGÂTS FAIBLES, COUPS FRÉQUENTS.",
        "COULOIRS ÉTROITS : AVANTAGE À L'UNITÉ."
      ],
      origine: [
        "MASSE : 4 % D'UNE UNITÉ.",
        "ARCHITECTURE RÉDUITE DE L'UNITÉ. GÉNÉRATION : > 40."
      ],
      eveil: 7
    },
    gardien: {
      role: 'GARDE DE PASSAGE',
      comportement: [
        "TIENT UN PASSAGE AVEC DES SENTINELLES. RÉSISTANT.",
        "NE POURSUIT PAS LOIN DE SON POSTE."
      ],
      origine: [
        "AUCUNE CORRESPONDANCE. CONSIGNE LISIBLE : 1 MOT.",
        "« GARDER ». DATE DE LA CONSIGNE :",
        "ANTÉRIEURE À L'ORIGINE."
      ],
      eveil: 9
    }
  },

  documents: [
    {
      id: 'doc_notice_port', titre: 'NOTICE — DÉPÔT DE TRI',
      lignes: [
        "ENTRÉE : UNIQUE.",
        "TRI : PAR ALLIAGE, PUIS PAR NUMÉRO DE COQUE.",
        "RANGEMENT : ALIGNÉ. TOLÉRANCE : 0 mm.",
        "TOUTE PIÈCE HORS RAYON : À RANGER.",
        "TOUTE PIÈCE EN RAYON : À DESCENDRE."
      ]
    },
    {
      id: 'doc_etiquettes', titre: 'ÉTIQUETTES DE TRI — LOT',
      lignes: [
        "[ALLIAGE 7 — COQUE — SÉRIE F — RAYON 3]",
        "[ALLIAGE 7 — COQUE — SÉRIE F — RAYON 3]",
        "[CAPTEUR — mkII — VERS LE BAS]",
        "[TÊTE DE FORAGE — mkIII — VERS LE BAS]",
        "[ENREGISTREUR — NE PAS DÉCOUPER — RAYON 0]"
      ]
    },
    {
      id: 'doc_consignes_fosse', titre: 'CONSIGNES DE FOSSE',
      lignes: [
        "1 FOSSE : 1 ENGIN.",
        "ENGIN POSÉ : À DÉCOUPER APRÈS LE DÉPART.",
        "DÉPART NON ENREGISTRÉ : À DÉCOUPER APRÈS ATTENTE.",
        "FOSSE LIBÉRÉE : À RETIRER DU REGISTRE.",
        "FOSSE OCCUPÉE : LIBÉRATION PRÉVUE."
      ]
    },
    {
      id: 'doc_plan_site', titre: 'PLAN DU SITE — AIRE 3',
      lignes: [
        "FOSSES : 39.",
        "DÉPÔT DE TRI : 1.",
        "MÂT-BALISE : 1.",
        "ACCÈS VERS LE BAS : 1.",
        "ACCÈS VERS L'ORIGINE : 0."
      ]
    },
    {
      id: 'doc_entretien_decoupe', titre: "FICHE D'ENTRETIEN — DÉCOUPE",
      lignes: [
        "OUTIL : DISQUE, MODÈLE FORAGE mkI.",
        "USURE : 58 %.",
        "REMPLACEMENT : DISQUE PRÉLEVÉ SUR UNITÉ.",
        "UNITÉ PRÉLEVÉE : NON PRÉCISÉE.",
        "PROCHAIN REMPLACEMENT : SELON ARRIVÉE."
      ]
    },
    {
      id: 'doc_liste_arrivees', titre: 'LISTE DES ARRIVÉES — EXTRAIT',
      lignes: [
        "0459 : SCELLÉE.",
        "0460 : ÉVENTRÉE.",
        "0461 : SQUELETTE.",
        "0462 : FOSSE VIDE.",
        "0463 : FOSSE VIDE.",
        "SUIVANTE : EN ATTENTE."
      ]
    }
  ],

  tutoriel: [
    {
      id: 'tuto_deplacement', titre: 'DÉPLACEMENT ET FORAGE',
      lignes: [
        "UNITÉ : 1 CASE PAR PAS.",
        "ROCHE : FORABLE. COÛT : ÉNERGIE.",
        "CASE FORÉE : PASSAGE OUVERT.",
        "CASE OCCUPÉE : ATTAQUE."
      ]
    },
    {
      id: 'tuto_energie', titre: 'ÉNERGIE',
      lignes: [
        "FORAGE : 5 D'ÉNERGIE PAR COUP. COURSE : 5 PAR PAS.",
        "DÉPLACEMENT ET COUPS AUX MOBILES : SANS COÛT. TIR : 20.",
        "ÉNERGIE 0 : FORAGE IMPOSSIBLE.",
        "RECHARGE : CONTINUE, DOUBLÉE À L'ARRÊT."
      ]
    },
    {
      id: 'tuto_fuel', titre: 'FUEL',
      lignes: [
        "FUEL : RÉSERVE DE L'UNITÉ. MAXIMUM : 100.",
        "CONSOMMATION : 1 TOUS LES 12 BATTEMENTS. SANS ARRÊT.",
        "SOURCES : ÉCLATS DE MÉTAL (+15 À +25), CELLULE (+30), DESCENTE (+30).",
        "ÉCLATS DE MÉTAL : 4 GISEMENTS PAR SECTEUR. FORER LA PAROI.",
        "FUEL 0 : RÉPARATION SUSPENDUE. COQUE : −1 TOUS LES 5 BATTEMENTS."
      ]
    },
    {
      id: 'tuto_repos', titre: 'REPOS',
      lignes: [
        "RÉPARATION AUTOMATIQUE : +1 VIE TOUS LES 20 BATTEMENTS EN MARCHE.",
        "REPOS : UNITÉ À L'ARRÊT. +1 VIE TOUS LES 4 BATTEMENTS.",
        "REPOS : ATTENTE RÉPÉTÉE JUSQU'À VIE ET ÉNERGIE PLEINES.",
        "INTERROMPU PAR : MOBILE EN VUE, POURSUITE, COUP REÇU, FUEL SOUS 25 %.",
        "FUEL 0 : AUCUNE RÉPARATION."
      ]
    },
    {
      id: 'tuto_tir', titre: 'TIR',
      lignes: [
        "ARME SECONDAIRE : CANON. MONTÉ D'ORIGINE. JAMAIS PERDU.",
        "TIR : 20 D'ÉNERGIE. DURÉE : 1 COUP. PORTÉE : CHAMP DE VUE.",
        "PROJECTILE ARRÊTÉ PAR : PAROI, PORTE, ROCHER, PREMIER MOBILE SUR LA LIGNE.",
        "ÉMISSION SONORE : ÉGALE AU FORAGE.",
        "CIBLE NON ALERTÉE : IMPACT GARANTI, DÉGÂTS × 3.",
        "AUTRES ARMES DE TIR : PLAN AU TERMINAL, FABRICATION AU FABLAB. REMPLACENT LE CANON."
      ]
    },
    {
      id: 'tuto_terminaux', titre: 'TERMINAUX',
      lignes: [
        "TERMINAL : 3 FONCTIONS.",
        "DATA : LIT UNE PAGE DE JOURNAL. TIRAGE ALÉATOIRE.",
        "CONNEXION : ACTIONS SUR LE LIEU. LIAISON AU NOYAU.",
        "ENCODAGE : ÉCRITURE DANS L'UNITÉ. 1 CHOIX SUR 3.",
        "PAGE LUE : CONSERVÉE D'UNE UNITÉ À L'AUTRE."
      ]
    },
    {
      id: 'tuto_hacks', titre: 'HACKS',
      lignes: [
        "HACK : PROGRAMME. GRATUIT. OBTENU PAR ENCODAGE.",
        "EMPLACEMENTS : À PART DES OBJETS. 2 AU DÉPART.",
        "HACK RETIRÉ : DEVIENT UN OBJET. OCCUPE 1 PLACE.",
        "PUISSANCE : CROISSANTE AVEC LA PROFONDEUR."
      ]
    },
    {
      id: 'tuto_blueprints', titre: 'BLUEPRINTS ET FABLAB',
      lignes: [
        "BLUEPRINT : OBTENU PAR ENCODAGE. 1 CHOIX SUR 3.",
        "FABLAB : FABRIQUE LES OBJETS DONT LE PLAN EST CONNU.",
        "FABRICATION : MATIÈRE REQUISE. DURÉE : 3 BATTEMENTS.",
        "PLAN CONNU : RECYCLABLE EN MATIÈRE."
      ]
    },
    {
      id: 'tuto_ferrailleuses', titre: 'FERRAILLEUSES',
      lignes: [
        "FERRAILLEUSE : MOBILE À L'OUVRAGE. DÉCOUPE DES COQUES, TRANSPORT AU DÉPÔT.",
        "INDIFFÉRENTE TANT QUE : PAS D'ATTAQUE, PAS D'INTRUSION DANS SON PÉRIMÈTRE.",
        "PÉRIMÈTRE : ÉPAVE + 3 CASES. CONTOUR AU SOL À L'APPROCHE.",
        "INTRUSION : ALERTE « ? ». 3 BATTEMENTS POUR RESSORTIR.",
        "SORTIE À TEMPS : RETOUR À LA DÉCOUPE. NOUVELLE INTRUSION SOUS 20 BATTEMENTS : CHASSE.",
        "ATTAQUE SUR L'UNE : SON GROUPE CHASSE « ! ». LES AUTRES GROUPES CONTINUENT.",
        "TRACE PERDUE : RETOUR À L'ÉPAVE. INDIFFÉRENTE DE NOUVEAU."
      ]
    }
  ],

  terminal_ui: {
    data_titre: 'DATA',
    data_sous_titre: 'MÉMOIRE LOCALE — LECTURE',
    connexion_titre: 'CONNEXION',
    connexion_sous_titre: 'RÉSEAU LOCAL — LIAISON',
    encodage_titre: 'ENCODAGE',
    encodage_sous_titre: "ÉCRITURE DANS L'UNITÉ — 1 CHOIX SUR 3",
    rien_a_lire: 'RIEN À LIRE',
    aucun_reseau: 'AUCUN RÉSEAU LOCAL',
    porte_deverrouillee: 'PORTE DÉVERROUILLÉE',
    lasers_hors_tension: 'LASERS HORS TENSION',
    cloison_ouverte: 'CLOISON OUVERTE',
    encodage_deja: 'ENCODAGE DÉJÀ EFFECTUÉ',
    emplacements_pleins: 'EMPLACEMENTS PLEINS'
  }
};
