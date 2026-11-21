#!/usr/bin/env python3
"""GIF animé de la génération d'un niveau « atterrissage » (niveau 1) ou « classique », tiré du vrai moteur.

    python3 outils/animation_niveau.py atterrissage|classique SORTIE.gif [essais]

`essais` : nombre de cartes tirées (défaut 8) ; on garde celle qui a le plus de bâtiments, puis le plus d'étapes.
Pour les cavernes : `outils/animation_cavernes.py`.

Le moteur est instrumenté dans la page, sans toucher à `src/` : les fonctions de `07-generation.js`, `07b` et `07d`
(roughBorder, massif, rankFill, placeBlobs, placeLakes, separateWater, placeShip, batiments, tunnels) sont enveloppées
pour prendre une image de la carte à la fin de chaque étape. Écrit aussi SORTIE.png (dernière image).
Nécessite playwright et Pillow.
"""
import asyncio
import pathlib
import sys

from PIL import Image, ImageDraw, ImageFont
from playwright.async_api import async_playwright

RACINE = pathlib.Path(__file__).resolve().parent.parent
JEU = 'file://' + str(RACINE / 'src' / 'index.html')

JS = r"""
(recette => {
  window.__S = []; window.__phase = false;
  window.SNAP = (nom, t, tun) => {
    if (nom === 'depart') __S.length = 0;
    if (nom === 'complexe') while (__S.length && ['complexe', 'tunnels'].includes(__S[__S.length - 1].nom)) __S.pop();   // essai de tunnels recommencé
    const last = __S[__S.length - 1];
    if (last && last.nom === nom) __S.pop();               // plusieurs appels de la même étape : on garde le dernier
    const a = new Array(W * H);
    for (let i = 0; i < W * H; i++) a[i] = (tun && G.tun && G.tun[i] && t[i] !== MOUNT) ? 99 : t[i];
    const sites = (['site', 'complexe', 'tunnels', 'batiments', 'final'].includes(nom)) && G && G.sites ? G.sites.map(s => [s.x, s.y]) : null;
    __S.push({ nom, c: a, sites });
  };
  const o = window.__orig = window.__orig || { roughBorder, massif, rankFill, placeBlobs, placeLakes, separateWater, placeShip, batiments, tunnels };
  const NOMS = { [MOUNT]: 'montagne', [CHASM]: 'gouffre', [GRASS]: 'herbe' };
  window.roughBorder = t => { __phase = true; o.roughBorder(t); SNAP('depart', t); };
  window.massif = (...a) => { const r = o.massif(...a); SNAP('massif', a[0]); return r; };
  window.rankFill = (t, s, n, val) => { const r = o.rankFill(t, s, n, val); if (__phase && NOMS[val]) SNAP(NOMS[val], t); return r; };
  window.placeBlobs = (t, tg, val, ...q) => { const r = o.placeBlobs(t, tg, val, ...q); if (__phase && NOMS[val]) SNAP(NOMS[val], t); return r; };
  window.placeLakes = (t, n) => { const r = o.placeLakes(t, n); SNAP('eau', t); return r; };
  window.separateWater = t => { o.separateWater(t); SNAP('finitions', t); };
  window.placeShip = (t, ou) => { const r = o.placeShip(t, ou); SNAP('vaisseau', t); __phase = false; return r; };
  window.batiments = () => {
    SNAP('site', G.t);
    o.batiments();
    SNAP(G.batis && G.batis.length && recette === 'classique' ? 'batiments' : 'final', G.t, true);
    if (recette === 'classique') SNAP('final', G.t, true);
  };
  window.tunnels = (t, B, strs, dE) => { SNAP('complexe', t); const r = o.tunnels(t, B, strs, dE); SNAP('tunnels', t, true); return r; };
  Object.assign(GEN, { recette, taille: 4 });
  newGame();
  return { W, H, S: __S, nb: (G.batis || []).length };
})
"""

# code de tuile → couleur (00-base.js) ; 99 : boyau de tunnel
COUL = {0: (62, 56, 48), 1: (128, 116, 98), 2: (110, 116, 124), 3: (60, 130, 190), 4: (70, 130, 70), 5: (125, 175, 95), 6: (30, 70, 130),
        7: (6, 6, 8), 8: (170, 125, 70), 9: (92, 86, 78), 10: (62, 56, 48), 11: (255, 154, 213), 12: (222, 122, 182), 13: (80, 84, 90),
        14: (232, 238, 240), 15: (127, 183, 201), 16: (255, 77, 77), 17: (200, 205, 208), 18: (255, 140, 0), 19: (232, 238, 240),
        20: (60, 200, 190), 21: (60, 200, 190), 22: (60, 200, 190), 99: (242, 194, 48)}
LEGENDE = [[((62, 56, 48), 'sol'), ((110, 116, 124), 'montagne'), ((70, 130, 70), 'herbe haute'), ((125, 175, 95), 'herbe basse'),
            ((60, 130, 190), 'eau'), ((6, 6, 8), 'gouffre'), ((128, 116, 98), 'rocher')],
           [((255, 154, 213), 'vaisseau'), ((232, 238, 240), 'murs'), ((127, 183, 201), 'sol des bâtiments'), ((255, 77, 77), 'portes'),
            ((242, 194, 48), 'tunnels'), ((255, 150, 0), 'site de forage (cercle)')]]
TITRES = {
    'depart': ('Départ', 'Du sol partout, avec un bord de carte irrégulier en roche.'),
    'massif': ('Le massif', "La roche prend un côté ou un coin de la carte : le reste est l'extérieur."),
    'montagne': ('Les montagnes', 'Des amas de roche posés sur le sol (bruit et automate cellulaire).'),
    'gouffre': ('Les gouffres', 'Des failles creusées dans le sol.'),
    'eau': ('Les lacs', "Un cœur d'eau profonde entouré d'eau peu profonde, à distance des gouffres."),
    'herbe': ("L'herbe", "Des plaques d'herbe."),
    'finitions': ('Les finitions', 'Herbes hautes et basses, rochers isolés, poches fermées comblées, eau écartée des gouffres.'),
    'vaisseau': ('Le vaisseau', 'Il se pose sur un sol dégagé.'),
    'site': ('Le site de forage', "Un point loin de l'arrivée : il faut traverser la carte pour l'atteindre."),
    'complexe': ('Le complexe enfoui', 'Des bâtiments enchâssés dans le massif, loin de la lisière.'),
    'tunnels': ('Les tunnels', "Un réseau creusé dans la roche relie l'extérieur aux portes du complexe."),
    'batiments': ('Les bâtiments', 'Posés sur le terrain : murs, portes, pièces.'),
    'final': ('Niveau prêt', 'Le site de forage est déplacé dans la pièce la plus profonde.'),
}
DUREE = {'depart': 1600, 'massif': 1800, 'montagne': 1400, 'gouffre': 1400, 'eau': 1400, 'herbe': 1400, 'finitions': 1800, 'vaisseau': 1600,
         'site': 1800, 'complexe': 2000, 'tunnels': 2000, 'batiments': 2200, 'final': 4500}
POLICES = ['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf']


async def tirages(recette, n):
    async with async_playwright() as p:
        nav = await p.chromium.launch()
        page = await nav.new_page(viewport={'width': 1280, 'height': 800})
        erreurs = []
        page.on('pageerror', lambda e: erreurs.append(str(e)))
        await page.goto(JEU)
        for _ in range(60):                      # l'intro dure une douzaine de secondes
            await page.wait_for_timeout(500)
            if not await page.locator('#introCv').is_visible():
                break
        res = [await page.evaluate(JS, recette) for _ in range(n)]
        if erreurs:
            print('erreurs de la page :', erreurs)
        await nav.close()
    return res


def eclaircit(c):
    return tuple(int(v + (255 - v) * .5) for v in c)


def carte(r, s, prev, sc):
    W, H = r['W'], r['H']
    im = Image.new('RGB', (W * sc, H * sc))
    d = ImageDraw.Draw(im)
    for i, v in enumerate(s['c']):
        x, y = i % W, i // W
        col = COUL.get(v, COUL[0])
        if prev is not None and v != prev['c'][i]:
            col = eclaircit(col)                         # ce qui vient de changer à cette étape
        d.rectangle([x * sc, y * sc, x * sc + sc - 1, y * sc + sc - 1], fill=col)
    for x, y in (s['sites'] or []):
        d.ellipse([x * sc - sc, y * sc - sc, x * sc + 2 * sc, y * sc + 2 * sc], outline=(255, 150, 0), width=max(2, sc // 3))
    return im


def gif(r, sortie):
    S, sc = r['S'], 8
    W, H = r['W'] * sc, r['H'] * sc
    ordre = [s['nom'] for s in S]
    ft, fs, fl = ImageFont.truetype(POLICES[1], 22), ImageFont.truetype(POLICES[0], 15), ImageFont.truetype(POLICES[0], 14)
    HAUT, BAS = 78, 80
    images, durees = [], []

    def cadre(k, nom, im):
        t, sous = TITRES[nom]
        f = Image.new('RGB', (W, HAUT + H + BAS), (11, 15, 16))
        d = ImageDraw.Draw(f)
        d.text((16, 10), f'{k + 1} / {len(ordre)}  ·  {t}', font=ft, fill=(240, 240, 240))
        d.text((16, 44), sous, font=fs, fill=(170, 190, 195))
        d.rectangle([0, HAUT - 6, W, HAUT - 3], fill=(30, 38, 40))
        d.rectangle([0, HAUT - 6, int(W * (k + 1) / len(ordre)), HAUT - 3], fill=(242, 194, 48))
        f.paste(im, (0, HAUT))
        for row, ligne in enumerate(LEGENDE):
            x, y = 16, HAUT + H + 8 + row * 22
            for col, txt in ligne:
                d.rectangle([x, y, x + 12, y + 12], fill=col, outline=(90, 100, 100))
                d.text((x + 18, y - 1), txt, font=fl, fill=(190, 200, 205))
                x += 18 + int(d.textlength(txt, font=fl)) + 20
        d.text((16, HAUT + H + 52), 'Les cases éclaircies sont celles qui viennent de changer à cette étape.', font=fl, fill=(130, 145, 150))
        return f

    prev = None
    for k, s in enumerate(S):
        images.append(cadre(k, s['nom'], carte(r, s, prev if s['nom'] != 'final' else None, sc)))
        durees.append(DUREE[s['nom']])
        prev = s
    mos = Image.new('RGB', (images[0].width, images[0].height * 3))
    for i, f in enumerate([images[0], images[len(images) // 2], images[-1]]):
        mos.paste(f, (0, i * images[0].height))
    pal = mos.quantize(96, dither=Image.Dither.NONE)      # une palette commune : pas de scintillement entre les images
    q = [f.quantize(palette=pal, dither=Image.Dither.NONE) for f in images]
    q[0].save(sortie, save_all=True, append_images=q[1:], duration=durees, loop=0, optimize=False, disposal=1)
    images[-1].save(pathlib.Path(sortie).with_suffix('.png'))
    return len(images), sum(durees) / 1000


if __name__ == '__main__':
    if len(sys.argv) < 3 or sys.argv[1] not in ('atterrissage', 'classique'):
        print(__doc__)
        sys.exit(2)
    n = int(sys.argv[3]) if len(sys.argv) > 3 else 8
    cartes = asyncio.run(tirages(sys.argv[1], n))
    best = max(cartes, key=lambda r: (r['nb'], len(r['S'])))
    k, s = gif(best, sys.argv[2])
    print(f"{n} cartes tirées, retenue : {best['nb']} bâtiments ; noms {[x['nom'] for x in best['S']]} ; {k} images, {s:.1f} s -> {sys.argv[2]}")
