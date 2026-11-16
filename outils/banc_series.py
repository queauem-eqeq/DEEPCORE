#!/usr/bin/env python3
"""Lance des séries de combats sur le banc (banc/site, à assembler d'abord avec outils/banc.py) et rend les bilans.

    python3 outils/banc_series.py CONFIGS.json SORTIE.json [essais] [processus]

CONFIGS.json : liste de configurations du banc ({carte, ennemis, arme, armure, acc, pilote, vie}).
SORTIE.json  : la même liste, chaque entrée suivie de son bilan ({cfg, res}). Les séries sont réparties sur plusieurs navigateurs.
"""
import asyncio, json, pathlib, sys
from playwright.async_api import async_playwright
R = pathlib.Path(__file__).resolve().parent.parent
PAGE = (R / 'banc' / 'site' / 'index.html').as_uri()

async def ouvrier(nav, file, sortie, essais):
    page = await nav.new_page(viewport={'width': 900, 'height': 600})
    erreurs = []
    page.on('pageerror', lambda e: erreurs.append(str(e)))
    await page.goto(PAGE)
    await page.wait_for_function("window.BANC && document.getElementById('banc')")
    while file:
        i, cfg = file.pop(0)
        res = await page.evaluate("([c,n])=>BANC.serie(c,n)", [cfg, essais])
        sortie[i] = {'cfg': cfg, 'res': res}
    if erreurs:
        print('erreurs de page :', erreurs[:3], file=sys.stderr)

async def principal(configs, essais, procs):
    file = list(enumerate(configs))
    sortie = [None] * len(configs)
    async with async_playwright() as p:
        navs = [await p.chromium.launch() for _ in range(procs)]
        await asyncio.gather(*(ouvrier(n, file, sortie, essais) for n in navs))
        for n in navs:
            await n.close()
    return sortie

if __name__ == '__main__':
    configs = json.loads(pathlib.Path(sys.argv[1]).read_text(encoding='utf-8'))
    essais = int(sys.argv[3]) if len(sys.argv) > 3 else 200
    procs = int(sys.argv[4]) if len(sys.argv) > 4 else 4
    out = asyncio.run(principal(configs, essais, procs))
    pathlib.Path(sys.argv[2]).write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'{len(out)} séries de {essais} essais écrites dans {sys.argv[2]}')
