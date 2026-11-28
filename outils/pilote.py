#!/usr/bin/env python3
"""Pilote automatique : joue des parties entières (niveaux 1 à 3, descentes comprises) avec le vrai moteur, sans dessin.

    python3 outils/pilote.py [prudent|fonceur|tout] [parties] [processus] [--graine N] [--json SORTIE.json] [--plafond B] [--immortel]
                             [--regles '{"MENACE_NB":[.6,.5,.6]}']

--regles : remplace des valeurs de REGLES (00-base.js) dans la page avant de jouer, sans toucher à src/ (essais d'équilibrage).

--immortel : la vie ne descend jamais sous 1 (les pertes restent comptées en entier, et l'endroit où la foreuse aurait été
détruite est noté) ; sert à mesurer la durée d'un niveau entier quand presque toutes les parties meurent avant le noyau.

Chaque partie a sa graine (graine de départ + numéro de la partie) : la même commande rejoue les mêmes parties, au plus près
(quelques tirages du jeu échappent encore au hasard semé, comme pour l'empreinte de verifier.py). Le script de la page est
outils/scripts/pilote.js : il décrit les deux profils et les points d'accroche des règles à venir (repos, fuel, tir).

Sortie : un tableau par profil (moyennes, médianes, déciles) et, avec --json, tout le détail partie par partie.
Une partie qui dépasse le plafond de battements sur un niveau (8000 par défaut) est coupée et comptée « bloquée ».
Par défaut : 20 parties par profil, 4 processus (un navigateur chacun).
"""
import asyncio
import json
import multiprocessing as mp
import pathlib
import statistics as stx
import sys

from playwright.async_api import async_playwright

RACINE = pathlib.Path(__file__).resolve().parent.parent
JEU = 'file://' + str(RACINE / 'src' / 'index.html')
SCRIPT = (RACINE / 'outils' / 'scripts' / 'pilote.js').read_text(encoding='utf-8')


async def _lot(taches):
    """une page neuve par partie (contexte de navigateur vide) : rien ne passe d'une partie à l'autre, la graine suffit à la rejouer"""
    out = []
    async with async_playwright() as p:
        nav = await p.chromium.launch()
        for profil, graine, plafond, immortel, regles in taches:
            ctx = await nav.new_context(viewport={'width': 1280, 'height': 800})
            await ctx.add_init_script("try{localStorage.setItem('np-intro','vu')}catch(e){}")   # pas de cinématique d'arrivée
            page = await ctx.new_page()
            erreurs = []
            page.on('pageerror', lambda e: erreurs.append(str(e)[:300]))
            await page.goto(JEU)
            await page.wait_for_function('typeof G !== "undefined" && G && G.st', timeout=60000)
            if regles:
                await page.evaluate(f'Object.assign(REGLES, {regles})')
            await page.evaluate(SCRIPT)
            try:
                r = json.loads(await page.evaluate(f'pilotePartie({json.dumps({"profil": profil, "graine": graine, "plafond": plafond, "immortel": immortel})})'))
            except Exception as e:
                r = {'profil': profil, 'graine': graine, 'statut': 'erreur', 'erreur': str(e)[:400], 'niveaux': []}
            r['erreurs_page'] = erreurs[:]
            out.append(r)
            print(f"  {profil} #{graine} : {r['statut']} niv {r.get('niveau')} "
                  + ' '.join(f"N{n['niv']}={n['bat']}b" for n in r['niveaux']) + f" ({r.get('ms', 0)} ms)", flush=True)
            await ctx.close()
        await nav.close()
    return out


def lot(taches):
    return asyncio.run(_lot(taches))


def q(l, p):
    """quantile simple (p entre 0 et 1) d'une liste non vide"""
    l = sorted(l)
    if not l:
        return None
    k = (len(l) - 1) * p
    a, b = int(k), min(int(k) + 1, len(l) - 1)
    return round(l[a] + (l[b] - l[a]) * (k - a), 1)


def moy(l):
    return round(sum(l) / len(l), 1) if l else None


def resume(parties):
    """chiffres agrégés d'un profil"""
    n = len(parties)
    st = {s: sum(1 for p in parties if p['statut'] == s) for s in ('noyau', 'mort', 'bloquée', 'erreur')}
    morts = {}
    for p in parties:
        if p['statut'] == 'mort':
            k = f"niv {p['niveau']} · {p.get('tuePar') or '?'}"
            morts[k] = morts.get(k, 0) + 1
    niv = {}
    for k in (1, 2, 3):
        L = [l for p in parties for l in p['niveaux'] if l['niv'] == k]
        finis = [l for p in parties for l in p['niveaux'] if l['niv'] == k and (l.get('descente') is not None or (k == 3 and p['statut'] == 'noyau'))]
        if not L:
            continue
        perdu = [sum(l['perdu'].values()) for l in L]
        rendu_src = {}
        for l in L:
            for s, v in l['rendu'].items():
                rendu_src[s] = rendu_src.get(s, 0) + v
        perdu_src = {}
        for l in L:
            for s, v in l['perdu'].items():
                perdu_src[s] = perdu_src.get(s, 0) + v
        vg = [v for l in L for v in l.get('vieParGroupe', [])]
        niv[k] = {
            'parties': len(L), 'finis': len(finis),
            'battements (finis) médiane': q([l['bat'] for l in finis], .5), 'D1': q([l['bat'] for l in finis], .1),
            'D9': q([l['bat'] for l in finis], .9),
            'vie au départ (moy)': moy([l['vieDebut'] for l in L]),
            'vie perdue (moy)': moy(perdu), 'vie perdue (méd)': q(perdu, .5), 'vie rendue (moy)': moy([sum(l['rendu'].values()) for l in L]),
            'rendue par source (moy/partie)': {s: round(v / len(L), 1) for s, v in sorted(rendu_src.items(), key=lambda x: -x[1])},
            'perdue par source (moy/partie)': {s: round(v / len(L), 1) for s, v in sorted(perdu_src.items(), key=lambda x: -x[1])[:8]},
            'vie à la fin du niveau (finis, moy)': moy([l['vieFin'] for l in finis]),
            'descente : vie perdue (moy)': moy([l['descente']['perdu'] for l in finis if l.get('descente')]),
            'groupes sur la carte (moy)': moy([l['groupesNiveau'] for l in L]),
            'groupes vus (moy)': moy([l['grVus'] for l in L]), 'groupes affrontés (moy)': moy([l['grAff'] for l in L]),
            'vie perdue par groupe affronté (moy)': moy(vg), 'par groupe affronté (méd)': q(vg, .5),
            'par groupe affronté D9': q(vg, .9), 'groupes affrontés à plus de 70 (%)': round(100 * sum(1 for v in vg if v > 70) / len(vg)) if vg else None,
            'battements à énergie 0 (moy)': moy([l['e0'] for l in L]),
            # arme de tir (bloc D, 28 novembre 2026)
            'tirs (moy)': moy([l.get('tirs', 0) for l in L]), 'énergie dépensée au tir (moy)': moy([l.get('tirE', 0) for l in L]),
            'dégâts infligés au tir (moy)': moy([l.get('tirDeg', 0) for l in L]),
            # fuel et repos (bloc B, 28 novembre 2026) ; absents des parties d'avant le fuel
            'fuel au départ (moy)': moy([l['fuelDebut'] for l in L if l.get('fuelDebut', -1) >= 0]),
            'fuel à la descente (finis, moy)': moy([l['fuelFin'] for l in finis if (l.get('fuelFin') if l.get('fuelFin') is not None else -1) >= 0]),
            'fuel à la descente D1': q([l['fuelFin'] for l in finis if (l.get('fuelFin') if l.get('fuelFin') is not None else -1) >= 0], .1),
            'fuel gagné par source (moy/partie)': {k: round(sum(l.get('fuelGagne', {}).get(k, 0) for l in L) / len(L), 1)
                                                  for k in sorted({k for l in L for k in l.get('fuelGagne', {})})},
            'fuel consommé (moy)': moy([l.get('fuelConso', 0) for l in L]),
            'battements à sec (moy)': moy([l.get('sec', 0) for l in L]),
            'parties passées à sec (niveau)': sum(1 for l in L if l.get('sec', 0) > 0),
            'battements au repos (moy)': moy([l.get('repos', 0) for l in L]),
            'gisements de métal minés (moy)': moy([l.get('gisementsMines', 0) for l in L]),
            'Matière gagnée (moy)': moy([l['matiere'] for l in L]),
            'objets utilisés (moy)': moy([sum(l['objets'].values()) for l in L]),
            'terminaux (moy)': moy([l['term'] for l in L]), 'hacks pris (moy)': moy([l['hacks'] for l in L]),
            'plans pris (moy)': moy([l['plans'] for l in L]), 'FABLAB (moy)': moy([l['fablab'] for l in L]),
            'cases explorées % (moy)': moy([l['explore'] for l in L]),
            'aurait été détruite ici (parties)': sum(1 for l in L if l.get('mortIci')),
            'battement de la destruction (médiane)': q([l['mortBat'] for l in L if l.get('mortBat') is not None], .5),
        }
    return {'parties': n, 'statuts': st, 'morts': dict(sorted(morts.items(), key=lambda x: -x[1])), 'niveaux': niv,
            'durée totale (battements, noyau) médiane': q([sum(l['bat'] for l in p['niveaux']) for p in parties if p['statut'] == 'noyau'], .5)}


def tableau(profil, R):
    s = R['statuts']
    print(f"\n=== {profil} : {R['parties']} parties — noyau {s['noyau']}, morts {s['mort']}, bloquées {s['bloquée']}, erreurs {s['erreur']}")
    if R['morts']:
        print('   morts :', ', '.join(f'{k} ×{v}' for k, v in R['morts'].items()))
    print('   durée totale d’une partie gagnée (médiane) :', R['durée totale (battements, noyau) médiane'], 'battements')
    cles = []
    for N in R['niveaux'].values():
        for k in N:
            if k not in cles:
                cles.append(k)
    ns = sorted(R['niveaux'])
    print(f"   {'':42}" + ''.join(f'{"niveau " + str(k):>16}' for k in ns))
    for k in cles:
        vals = [R['niveaux'][n].get(k) for n in ns]
        if any(isinstance(v, dict) for v in vals):
            print(f'   {k}')
            for n in ns:
                print(f"      niv {n} : " + ', '.join(f'{a} {b}' for a, b in (R['niveaux'][n].get(k) or {}).items()))
            continue
        print(f'   {k:42}' + ''.join(f'{("—" if v is None else v):>16}' for v in vals))


def main():
    args = [a for a in sys.argv[1:]]
    opt = {}
    immortel = '--immortel' in args
    if immortel:
        args.remove('--immortel')
    for o in ('--graine', '--json', '--plafond', '--regles'):
        if o in args:
            i = args.index(o)
            opt[o] = args[i + 1]
            del args[i:i + 2]
    profils = {'tout': ['prudent', 'fonceur'], 'prudent': ['prudent'], 'fonceur': ['fonceur']}.get(args[0] if args else 'tout')
    if not profils:
        print(__doc__)
        sys.exit(2)
    n = int(args[1]) if len(args) > 1 else 20
    proc = int(args[2]) if len(args) > 2 else 4
    g0 = int(opt.get('--graine', 1000))
    plafond = int(opt.get('--plafond', 8000))
    regles = opt.get('--regles')
    if regles:
        json.loads(regles)   # refuse un texte mal formé avant de lancer les navigateurs
    taches = [(p, g0 + k, plafond, immortel, regles) for p in profils for k in range(n)]
    lots = [taches[i::proc] for i in range(proc)]
    with mp.Pool(proc) as pool:
        res = [r for l in pool.map(lot, [l for l in lots if l]) for r in l]
    sortie = {}
    for p in profils:
        parties = sorted([r for r in res if r['profil'] == p], key=lambda r: r['graine'])
        R = resume(parties)
        tableau(p + (' (immortel)' if immortel else ''), R)
        sortie[p] = {'resume': R, 'parties': parties}
    err = [e for r in res for e in r.get('erreurs_page', [])] + [e for r in res for l in r['niveaux'] for e in l.get('erreurs', [])]
    print('\nerreurs (page et pilote) :', len(err), *(['\n   ' + e for e in err[:5]]))
    if '--json' in opt:
        pathlib.Path(opt['--json']).write_text(json.dumps(sortie, ensure_ascii=False, indent=1))
        print('détail :', opt['--json'])


if __name__ == '__main__':
    main()
