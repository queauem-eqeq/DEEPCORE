#!/usr/bin/env python3
"""Lance l'intro (arrivée en ASCII) et y passe outils/scripts/test-arrivee-cache.js : tampon contre dessin direct.
Usage : python3 outils/arrivee_cache.py"""
import asyncio, pathlib
from playwright.async_api import async_playwright
RACINE = pathlib.Path(__file__).resolve().parent.parent
async def m():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 1280, 'height': 800})
        err = []; pg.on('pageerror', lambda e: err.append(str(e)))
        await pg.goto((RACINE / 'src' / 'index.html').as_uri()); await pg.wait_for_timeout(300)
        print(await pg.evaluate((RACINE / 'outils' / 'scripts' / 'test-arrivee-cache.js').read_text(encoding='utf-8')))
        print('erreurs de la page :', err or 'aucune'); await b.close()
asyncio.run(m())
