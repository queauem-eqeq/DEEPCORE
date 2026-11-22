#!/usr/bin/env python3
"""Planche de cartes : jusqu'à douze cartes générées côte à côte, avec leurs mesures.

    python3 outils/planche_cartes.py SORTIE.png CAS.json [taille]
    python3 outils/planche_cartes.py SORTIE.png amb:RECETTE [taille]      les ambiances de la recette, une carte chacune
    python3 outils/planche_cartes.py SORTIE.png amb:RECETTE:CLE [taille]  douze cartes de la même ambiance
    python3 outils/planche_cartes.py SORTIE.png monde:RECETTE[:BATI] [taille]  les archétypes monde (douze premiers)

CAS.json : une liste de [nom, {réglages}] ; un réglage « amb » choisit une ambiance, « recette » la recette,
« niv » le niveau (au-delà de 1 : arrivée par un puits). Le jeu est lu dans src/, rien n'y est modifié.
"""
import asyncio
import json
import pathlib
import sys

from playwright.async_api import async_playwright

RACINE = pathlib.Path(__file__).resolve().parent.parent
JEU = 'file://' + str(RACINE / 'src' / 'index.html')
NIV = {'atterrissage': 1, 'classique': 1, 'cavernes': 2, 'base': 3}


async def principal(sortie: pathlib.Path, quoi: str, taille: int, extra: dict) -> int:
    script = (RACINE / 'outils' / 'scripts' / 'planche.js').read_text(encoding='utf-8')
    async with async_playwright() as p:
        nav = await p.chromium.launch()
        page = await nav.new_page(viewport={'width': 1280, 'height': 800})
        erreurs: list[str] = []
        page.on('pageerror', lambda e: erreurs.append(str(e)))
        await page.add_init_script("try{localStorage.setItem('np-intro','vu')}catch(e){}")
        await page.goto(JEU)
        await page.wait_for_timeout(800)
        await page.evaluate("typeof skipIntro==='function'&&skipIntro()")
        if quoi.startswith('amb:'):
            m = quoi.split(':')
            rec = m[1]
            cles = await page.evaluate(f"Object.keys((AMBIANCES['{rec}'])||{{}})")
            noms = await page.evaluate(f"Object.values((AMBIANCES['{rec}'])||{{}}).map(a=>a.n)")
            if len(m) > 2:
                cas = [[f'{noms[cles.index(m[2])]} {i + 1}', {'recette': rec, 'amb': m[2], 'niv': NIV.get(rec, 1)}] for i in range(12)]
            else:
                cas = [[n, {'recette': rec, 'amb': c, 'niv': NIV.get(rec, 1)}] for c, n in zip(cles, noms)][:12]
        elif quoi.startswith('monde:'):   # les archétypes monde, sur la recette donnée et son archétype bâti (facultatif) : monde:RECETTE[:BATI]
            m = quoi.split(':')
            rec = m[1]
            cles = await page.evaluate("Object.keys(AMB_MONDE)")
            noms = await page.evaluate("Object.values(AMB_MONDE).map(a=>a.n)")
            cas = [[n, dict({'recette': rec, 'ambM': c, 'niv': NIV.get(rec, 1)}, **({'amb': m[2]} if len(m) > 2 else {}))] for c, n in zip(cles, noms)]
            if 'debut' in extra:
                cas = cas[extra.pop('debut'):]
            cas = cas[:12]
        else:
            cas = json.loads(pathlib.Path(quoi).read_text(encoding='utf-8'))
        pl = {'taille': taille, 'cas': cas}
        pl.update(extra)
        await page.evaluate('window.PL=' + json.dumps(pl))
        try:
            print(await page.evaluate(script))
        except Exception as e:
            print('le script a échoué :', str(e)[:800])
        await page.wait_for_timeout(200)
        sortie.parent.mkdir(parents=True, exist_ok=True)
        await page.screenshot(path=str(sortie))
        print('image :', sortie)
        print('erreurs de la page :', erreurs if erreurs else 'aucune')
        await nav.close()
    return 1 if erreurs else 0


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(2)
    ex = {}
    for a in sys.argv[4:]:
        k, v = a.split('=')
        ex[k] = json.loads(v)
    sys.exit(asyncio.run(principal(pathlib.Path(sys.argv[1]), sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 3, ex)))
