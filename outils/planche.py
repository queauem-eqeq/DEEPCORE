"""Photographie une planche de travail : un script dessine un canvas #planche sur la page du jeu.

    python3 outils/planche.py planches/NOM.js SORTIE.png

Le script reçoit la page du jeu intro passée (palette, tuiles et fonctions disponibles) et doit créer
un élément #planche ; c'est lui seul qui est photographié.
"""
import asyncio,sys,pathlib
from playwright.async_api import async_playwright
async def main(script,dest,w=1400,h=1000):
    async with async_playwright() as p:
        nav=await p.chromium.launch();page=await nav.new_page(viewport={'width':w,'height':h},device_scale_factor=2)
        err=[];page.on('pageerror',lambda e:err.append(str(e)))
        await page.add_init_script("try{localStorage.setItem('np-intro','vu')}catch(e){}")
        await page.goto('file:///home/claude/deepcore/src/index.html');await page.wait_for_timeout(1500)
        await page.evaluate("()=>{try{if(INTRO)skipIntro();}catch(e){}}");await page.wait_for_timeout(1000)
        print(await page.evaluate(pathlib.Path(script).read_text(encoding='utf-8')))
        await page.wait_for_timeout(400);await page.locator('#planche').screenshot(path=dest)
        print('erreurs',err);await nav.close()
asyncio.run(main(sys.argv[1],sys.argv[2]))
