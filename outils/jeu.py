#!/usr/bin/env python3
"""Lance le jeu, passe l'intro, et capture une image de la partie.

    python3 outils/jeu.py DOSSIER [script.js]

Sans script, la capture montre le début de partie. Avec un script, son contenu est évalué dans la
page avant la capture : c'est là qu'on prépare la scène (dégager le terrain, poser des bêtes, avancer
la foreuse…) et qu'on renvoie ce qu'on veut lire. Le résultat est affiché, puis l'image est écrite
dans DOSSIER/jeu.png. Les erreurs de la page sont rapportées à la fin.

Exemple de script : une clairière d'herbes, la foreuse au milieu, brouillard levé.

    (() => {
      for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) G.t[idx(x, y)] = GROUND;
      for (let y = 26; y <= 40; y++) for (let x = 34; x <= 56; x++) G.t[idx(x, y)] = GRASS;
      G.px = 40; G.py = 32; fog = false; computeFOV(); render(); side();
      return G.stealth;
    })()

Rappel : les noms du jeu (G, idx, W, H, GROUND, GRASS, FLAT, MOUNT, render, computeFOV, turnStealth,
animalsAct, beastsAct, tryMove…) sont tous globaux, donc directement accessibles dans le script.
"""
import asyncio
import pathlib
import sys

from playwright.async_api import async_playwright

RACINE = pathlib.Path(__file__).resolve().parent.parent
JEU = 'file://' + str(RACINE / 'src' / 'index.html')


async def principal(dossier: pathlib.Path, script: str | None) -> int:
    dossier.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as p:
        nav = await p.chromium.launch()
        page = await nav.new_page(viewport={'width': 1280, 'height': 800})
        erreurs: list[str] = []
        page.on('pageerror', lambda e: erreurs.append(str(e)))
        await page.goto(JEU)

        for _ in range(60):                      # l'intro dure une douzaine de secondes
            await page.wait_for_timeout(500)
            if not await page.locator('#introCv').is_visible():
                break
        if await page.locator('#introCv').is_visible():
            print('intro toujours à l’écran après 30 s : capture quand même')

        if script:
            try:
                print('résultat :', await page.evaluate(script))
            except Exception as e:                # erreur dans le script fourni, pas dans le jeu
                print('le script a échoué :', str(e)[:500])
            await page.wait_for_timeout(400)

        image = dossier / 'jeu.png'
        await page.screenshot(path=str(image))
        print('image :', image)
        print('erreurs de la page :', erreurs if erreurs else 'aucune')
        await nav.close()
        return 1 if erreurs else 0


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)
    code = sys.argv[2] and pathlib.Path(sys.argv[2]).read_text(encoding='utf-8') if len(sys.argv) > 2 else None
    sys.exit(asyncio.run(principal(pathlib.Path(sys.argv[1]), code)))
