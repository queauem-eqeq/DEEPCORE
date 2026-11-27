#!/usr/bin/env python3
"""Profileur : où passe le temps de calcul en partie.

    python3 outils/profil.py [N]

Passe l'intro, puis enregistre le profil CPU de Chromium pendant N rendus et N pas de la foreuse
(200 par défaut), et affiche les fonctions qui coûtent le plus (temps propre, hors fonctions appelées).
"""
import asyncio
import collections
import pathlib
import sys

from playwright.async_api import async_playwright

JEU = 'file://' + str(pathlib.Path(__file__).resolve().parent.parent / 'src' / 'index.html')
SCENE = """(n => { const D=[[1,0],[-1,0],[0,1],[0,-1]];
  for (let i = 0; i < n; i++) render();
  for (let i = 0; i < n; i++) { const d = D[(i * 7 + (i >> 2)) %% 4]; tryMove(d[0], d[1]); } })(%d)"""


async def principal(n: int) -> None:
    async with async_playwright() as p:
        nav = await p.chromium.launch()
        page = await nav.new_page(viewport={'width': 1280, 'height': 800})
        await page.goto(JEU)
        for _ in range(60):
            await page.wait_for_timeout(500)
            if not await page.locator('#introCv').is_visible():
                break
        cdp = await page.context.new_cdp_session(page)
        await cdp.send('Profiler.enable')
        await cdp.send('Profiler.setSamplingInterval', {'interval': 100})
        await cdp.send('Profiler.start')
        await page.evaluate(SCENE % n)
        prof = (await cdp.send('Profiler.stop'))['profile']
        await nav.close()

    noeuds = {x['id']: x for x in prof['nodes']}
    pas = collections.Counter(prof['samples'])
    total = sum(pas.values())
    propre = collections.Counter()
    for i, k in pas.items():
        f = noeuds[i]['callFrame']
        nom = f['functionName'] or '(anonyme)'
        fich = f['url'].rsplit('/', 1)[-1]
        propre[f'{nom}  {fich}:{f["lineNumber"] + 1}' if fich else nom] += k
    print(f'{total} échantillons — temps propre par fonction :')
    for nom, k in propre.most_common(25):
        print(f'{100 * k / total:5.1f} %  {nom}')


if __name__ == '__main__':
    asyncio.run(principal(int(sys.argv[1]) if len(sys.argv) > 1 else 200))
