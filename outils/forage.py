#!/usr/bin/env python3
"""Vérification visuelle de la cinématique de forage : la lance (intro déjà vue), capture l'écran à des instants donnés
(en secondes), contrôle qu'elle se termine et qu'aucune erreur JavaScript n'apparaît.
Usage : python3 outils/forage.py DOSSIER_SORTIE [t1 t2 ...]   (le jeu est lu directement dans src/)"""
import asyncio,sys,time,pathlib
from playwright.async_api import async_playwright
OUT=pathlib.Path(sys.argv[1]);OUT.mkdir(parents=True,exist_ok=True)
NIV=2 if 'niv2' in sys.argv else 1   # « niv2 » : la seconde descente, le mini-jeu des mines
ARGS=[a for a in sys.argv[2:] if a!='niv2']
TIMES=[float(a) for a in ARGS] or [1.0,2.6,4.0,6.0,8.0,10.0,12.4,13.0,13.6,14.4]
GAME=(pathlib.Path(__file__).resolve().parent.parent/'src/index.html').as_uri()
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch()
    pg=await b.new_page(viewport={'width':1280,'height':800})
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.add_init_script("try{localStorage.setItem('np-intro','vu')}catch(e){}")
    await pg.goto(GAME);await pg.wait_for_timeout(800)
    await pg.evaluate("window.__fin=false;playForage(()=>{window.__fin=true},%d)"%NIV);t0=time.time()
    for k,ts in enumerate(TIMES):
      d=ts-(time.time()-t0)
      if d>0: await pg.wait_for_timeout(int(d*1000))
      await pg.screenshot(path=str(OUT/f'f{k:02d}_{ts:04.1f}s.png'))
    await pg.wait_for_timeout(5000)
    print('terminée :',await pg.evaluate('window.__fin'),'· durée vue',round(time.time()-t0,1),'s')
    print('erreurs :',errs)
    await b.close()
asyncio.run(main())
