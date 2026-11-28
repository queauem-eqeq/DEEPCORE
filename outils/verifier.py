#!/usr/bin/env python3
"""Tout vérifier d'un coup, après n'importe quel changement.

    python3 outils/verifier.py          # syntaxe, essais automatiques, empreinte
    python3 outils/verifier.py --maj    # idem, puis enregistre l'empreinte comme nouvelle référence

1. Syntaxe de chaque fichier de src/js.
2. Les essais automatiques (machines, ennemis, forage, descente entière) : aucune ligne « ÉCHEC » de plus que
   celles connues (ECHECS_CONNUS), aucune erreur de page.
3. L'empreinte (outils/scripts/empreinte.js) : avec un hasard fixé, trois recettes générées puis 250 actions jouées.
   Comparée à outils/empreinte-reference.txt. Un nettoyage qui ne doit rien changer au jeu doit la laisser
   identique ; un changement de règle la modifie, et c'est alors voulu : relancer avec --maj.
   (Les recettes « cavernes » et « base » ne sont pas reproductibles à hasard fixé : elles n'entrent pas dans l'empreinte.)
Code de sortie 0 si tout va bien.
"""
import os, pathlib, subprocess, sys

RACINE = pathlib.Path(__file__).resolve().parent.parent
REF = RACINE / 'outils' / 'empreinte-reference.txt'
ESSAIS = ['test-machines', 'test-ennemis', 'test-forage', 'test-descente', 'test-astroport', 'test-ouvrage', 'test-terminaux']
ECHECS_CONNUS = ['lieux : les groupes d’extérieur naissent dehors']   # déjà en échec avant le 23 novembre 2026


def jeu(script, sans_anim=False):
    env = dict(os.environ, **({'SANS_ANIM': '1'} if sans_anim else {}))
    r = subprocess.run([sys.executable, str(RACINE / 'outils' / 'jeu.py'), '/tmp/verif', str(script)],
                       capture_output=True, text=True, env=env, timeout=1500)
    return r.stdout + r.stderr


def main():
    bon = True
    for f in sorted((RACINE / 'src' / 'js').glob('*.js')):
        r = subprocess.run(['node', '--check', str(f)], capture_output=True, text=True)
        if r.returncode:
            bon = False
            print('SYNTAXE', f.name, r.stderr.strip().splitlines()[:3])
    print('syntaxe :', 'ok' if bon else 'ERREUR')
    if not bon:
        return 1
    for e in ESSAIS:
        s = jeu(RACINE / 'outils' / 'scripts' / (e + '.js'))
        echecs = [l for l in s.splitlines() if 'ÉCHEC' in l and not any(c in l for c in ECHECS_CONNUS)]
        page = 'erreurs de la page : aucune' in s
        if echecs or not page:
            bon = False
        print(f'{e} :', 'ok' if not echecs and page else 'ÉCHEC')
        for l in echecs:
            print('   ', l)
        if not page:
            print('   ', s.strip().splitlines()[-3:])
    s = jeu(RACINE / 'outils' / 'scripts' / 'empreinte.js', sans_anim=True)
    # « cavernes » et « base » ne sont pas reproductibles à hasard fixé : elles sortent de l'empreinte (base ajoutée le 24 novembre
    # 2026 — elle changeait une fois sur trois et faisait crier au loup).
    HORS = ('cavernes', 'base')
    lignes = [l.replace('résultat : ', '') for l in s.splitlines()
              if ' · carte ' in l and not l.replace('résultat : ', '').startswith(HORS)]
    emp = '\n'.join(lignes) + '\n'
    if '--maj' in sys.argv:
        REF.write_text(emp)
        print('empreinte : référence mise à jour')
    elif not REF.exists():
        print('empreinte : pas de référence (lancer avec --maj)')
    elif REF.read_text() == emp:
        print('empreinte : identique à la référence (le jeu se comporte comme avant)')
    else:
        print('empreinte : DIFFÉRENTE de la référence — normal après un changement de règle (--maj), anormal après un nettoyage')
        bon = bon and '--regle' in sys.argv
    return 0 if bon else 1


if __name__ == '__main__':
    sys.exit(main())
