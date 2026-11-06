#!/usr/bin/env python3
"""Vérification visuelle de l'intro : capture l'écran à des instants donnés (en secondes), puis contrôle que l'intro
se termine, ne se rejoue pas après rechargement, et qu'aucune erreur JavaScript n'apparaît.
Usage : python3 outils/captures.py DOSSIER_SORTIE [t1 t2 ...]   (le jeu doit être assemblé : python3 build.py)"""
import asyncio,sys,time,pathlib
from playwright.async_api import async_playwright
OUT=pathlib.Path(sys.argv[1]);OUT.mkdir(parents=True,exist_ok=True)
TIMES=[float(a) for a in sys.argv[2:]] or [2.0,4.0,6.0,7.5,9.0]
GAME=(pathlib.Path(__file__).resolve().parent.parent/'dist/noyau-profond.html').as_uri()
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch()
    pg=await b.new_page(viewport={'width':1280,'height':800})
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto(GAME);t0=time.time()
    for k,ts in enumerate(TIMES):
      d=ts-(time.time()-t0)
      if d>0: await pg.wait_for_timeout(int(d*1000))
      await pg.screenshot(path=str(OUT/f'i{k}.png'))
    await pg.wait_for_timeout(4000);await pg.screenshot(path=str(OUT/'i_fin.png'))
    print('intro terminée :',not await pg.locator('#introCv').is_visible())
    await pg.reload();await pg.wait_for_timeout(600)
    print('rejouée après rechargement :',await pg.locator('#introCv').is_visible())
    print('erreurs :',errs)
    await b.close()
asyncio.run(main())
