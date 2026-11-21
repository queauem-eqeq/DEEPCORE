#!/usr/bin/env python3
"""Mesure la valeur de menace de chaque groupe de départ (GROUPES_DEF, 06b-groupes.js) au banc de combat.

    python3 outils/banc.py && python3 outils/valeur_groupes.py [essais]

Pour chaque groupe : la foreuse de série (foreuse et coque d'usine, vie d'essai 1000 pour ne jamais mourir) affronte le groupe
en assaut sur l'arène dégagée (le marécage pour les torpilles), à l'effectif minimal puis maximal. La valeur proposée est la
vie perdue en moyenne, divisée par 4 (repère : 1 à 2 crabots coûtent 13 points de vie et valent 3). Rien n'est écrit dans src/.
"""
import asyncio, json, pathlib, sys
from playwright.async_api import async_playwright
R = pathlib.Path(__file__).resolve().parent.parent
PAGE = (R / 'banc' / 'site' / 'index.html').as_uri()

async def principal(essais):
    async with async_playwright() as p:
        nav = await p.chromium.launch()
        page = await nav.new_page()
        await page.goto(PAGE)
        await page.wait_for_function("window.BANC && document.getElementById('banc')")
        groupes = await page.evaluate("GROUPES_DEF().liste")
        print(f"{'groupe':28} {'min':>6} {'max':>6} {'moy.':>6} {'valeur':>6} {'actuelle':>8}")
        for g in groupes:
            pertes = []
            for borne in ('min', 'max'):
                ennemis = {}
                for m in g['m']:
                    if m[borne] > 0:
                        ennemis[m['k']] = ennemis.get(m['k'], 0) + m[borne]
                carte = 'marecage' if 'brochon' in ennemis else 'arene'
                cfg = {'carte': carte, 'ennemis': ennemis, 'arme': 'foreuse', 'armure': 'usine', 'acc': [], 'pilote': 'chasse', 'vie': 1000, 'alerte': True}
                res = await page.evaluate("([c,n])=>BANC.serie(c,n)", [cfg, essais])
                pertes.append(res['perte'])
            moy = sum(pertes) / 2
            print(f"{g['n']:28} {pertes[0]:6.1f} {pertes[1]:6.1f} {moy:6.1f} {max(1, round(moy / 4)):6d} {g['cout']:8d}")
        await nav.close()

if __name__ == '__main__':
    asyncio.run(principal(int(sys.argv[1]) if len(sys.argv) > 1 else 40))
