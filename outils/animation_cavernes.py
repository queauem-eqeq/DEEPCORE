#!/usr/bin/env python3
"""GIF animé de la génération d'un niveau « cavernes » (roche, cavernes, boyaux, bâtiments, portes), tiré du vrai moteur.

    python3 outils/animation_cavernes.py SORTIE.gif [essais] [parametres]

`essais` : nombre de cartes tirées (défaut 8) ; la plus lisible est gardée (le plus de bâtiments, puis le plus d'étapes).
`parametres` : réglages du menu Monde, séparés par des virgules (défaut `cvPart=20,cvNb=6,cvBoyaux=2,cvBati=3,cvSurf=14`).
Avec une part de cavernes trop grande, les cavernes fusionnent et les étapes se distinguent mal.

Le moteur est instrumenté dans la page, sans toucher à `src/` : `cavernes()` et `reliePortes()` sont recopiées en
mémoire avec des points de capture (une image par caverne, par boyau, par boucle, par cul-de-sac). Si ces fonctions
changent de forme, un marqueur « absent » l'indique : mettre à jour la liste MARQUEURS.
Écrit aussi SORTIE.png (dernière image). Nécessite playwright et Pillow.
"""
import asyncio
import json
import pathlib
import sys

from PIL import Image, ImageDraw, ImageFont
from playwright.async_api import async_playwright

RACINE = pathlib.Path(__file__).resolve().parent.parent
JEU = 'file://' + str(RACINE / 'src' / 'index.html')
DEFAUT = 'cvPart=20,cvNb=6,cvBoyaux=2,cvBati=3,cvSurf=14'

# (texte à trouver dans cavernes(), remplacement) : chaque remplacement ajoute un point de capture SNAP(nom, t, centres)
MARQUEURS = [
    ('t.fill(MOUNT);', 't.fill(MOUNT);SNAP("roche",t);'),
    ('cen.push([x0+c0[0],y0+c0[1]]);}', 'cen.push([x0+c0[0],y0+c0[1]]);SNAP("caverne",t,cen);}'),
    ('for(const [i,j] of arcs)boyau(cen[i],cen[j],Math.random()<.35?2:1);',
     'SNAP("centres",t,cen);for(const [i,j] of arcs){boyau(cen[i],cen[j],Math.random()<.35?2:1);SNAP("boyau",t,cen);}'),
    ('if(bj>=0){arcs.push([i,bj]);boyau(cen[i],cen[bj],1);}}', 'if(bj>=0){arcs.push([i,bj]);boyau(cen[i],cen[bj],1);SNAP("boucle",t,cen);}}'),
    ('Math.round(c[1]+Math.sin(a)*L)))],1);}', 'Math.round(c[1]+Math.sin(a)*L)))],1);SNAP("impasse",t,cen);}'),
]

JS = r"""
(args => {
  const [reglages, marqueurs] = args;
  window.__S = [];
  // 0 roche · 1 caverne ou boyau · 2 mur · 3 sol de bâtiment · 4 porte · 5 boyau de porte
  const cls0 = v => v === MOUNT ? 0 : v === GROUND ? 1 : 2;
  const cls1 = (v, i, tun) => v === WALL ? 2 : v === DOOR ? 4 : (tun && G.tun && G.tun[i] && ZONE[i] !== 0 && v !== MOUNT) ? 5 : ZONE[i] === 0 ? 1 : v === MOUNT ? 0 : blocks(v) ? 0 : 3;
  window.SNAP = (nom, t, extra) => {
    if (nom === 'bâtiments') while (__S.length && ['bâtiments', 'portes'].includes(__S[__S.length - 1].nom)) __S.pop();
    if (nom === 'roche') __S.length = 0;
    const post = nom === 'bâtiments' || nom === 'portes', a = new Array(W * H);
    for (let i = 0; i < W * H; i++) a[i] = post ? cls1(t[i], i, nom === 'portes') : cls0(t[i]);
    __S.push({ nom, c: a, cen: extra ? extra.map(c => c.slice()) : null });
  };
  window.__cav0 = window.__cav0 || cavernes.toString();
  window.__rel0 = window.__rel0 || reliePortes;
  let src = window.__cav0;
  for (const [a, b] of marqueurs) { if (!src.includes(a)) throw new Error('marqueur absent : ' + a.slice(0, 50)); src = src.replace(a, b); }
  (0, eval)(src);
  window.reliePortes = function (t, B, strs) { SNAP('bâtiments', t); const r = __rel0(t, B, strs); if (r) SNAP('portes', t); return r; };
  Object.assign(GEN, { recette: 'cavernes', taille: 4 }, reglages);
  newGame();
  return { W, H, px: G.px, py: G.py, S: __S, nb: (G.batis || []).length };
})
"""

COUL = {0: (38, 43, 48), 1: (93, 127, 90), 2: (232, 238, 240), 3: (127, 183, 201), 4: (255, 77, 77), 5: (242, 194, 48)}
NEUF = (190, 235, 140)
TITRES = {
    'roche': ('Départ', 'Toute la carte est de la roche pleine.'),
    'caverne': ('Les cavernes', "Chaque forme est tirée par un automate cellulaire, loin des cavernes déjà posées."),
    'centres': ('Un centre par caverne', "C'est de là que partiront les boyaux."),
    'boyau': ('Les boyaux', 'Un arbre couvrant relie toutes les cavernes : tout est connecté.'),
    'boucle': ('Les boucles', 'Des liaisons en plus pour pouvoir tourner en rond.'),
    'impasse': ('Les culs-de-sac', 'Quelques boyaux qui ne mènent nulle part.'),
    'bâtiments': ('Les bâtiments', 'Enchâssés dans la roche, à distance les uns des autres, chacun avec ses portes.'),
    'portes': ('Les accès', 'Chaque porte est reliée à la caverne la plus proche par un petit boyau.'),
    'final': ('Niveau prêt', 'Le joueur arrive par un puits (rose), sans vaisseau.'),
}
ORDRE = list(TITRES)
DUREE = {'roche': 1600, 'caverne': 650, 'centres': 1500, 'boyau': 550, 'boucle': 550, 'impasse': 550, 'bâtiments': 2000, 'portes': 2200}
POLICES = ['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf']


async def tirages(n, reglages):
    marq = [list(m) for m in MARQUEURS]
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
        res = [await page.evaluate(JS, [reglages, marq]) for _ in range(n)]
        if erreurs:
            print('erreurs de la page :', erreurs)
        await nav.close()
    return res


def carte(r, s, prev, sc, centres=False, arrivee=False):
    W, H = r['W'], r['H']
    im = Image.new('RGB', (W * sc, H * sc))
    d = ImageDraw.Draw(im)
    for i, v in enumerate(s['c']):
        x, y = i % W, i // W
        col = NEUF if prev is not None and v == 1 and prev['c'][i] != 1 else COUL[v]
        d.rectangle([x * sc, y * sc, x * sc + sc - 1, y * sc + sc - 1], fill=col)
    if centres and s['cen']:
        for cx, cy in s['cen']:
            d.ellipse([cx * sc - sc, cy * sc - sc, cx * sc + 2 * sc, cy * sc + 2 * sc], outline=(255, 255, 255), width=max(1, sc // 4))
    if arrivee:
        px, py = r['px'], r['py']
        d.ellipse([px * sc - sc, py * sc - sc, px * sc + 2 * sc, py * sc + 2 * sc], fill=(255, 154, 213), outline=(255, 255, 255))
    return im


def gif(r, sortie):
    S, sc = r['S'], 8
    W, H = r['W'] * sc, r['H'] * sc
    ft, fs, fl = ImageFont.truetype(POLICES[1], 22), ImageFont.truetype(POLICES[0], 15), ImageFont.truetype(POLICES[0], 14)
    HAUT, BAS = 78, 34
    images, durees = [], []

    def cadre(nom, im):
        etape, (t, sous) = ORDRE.index(nom) + 1, TITRES[nom]
        f = Image.new('RGB', (W, HAUT + H + BAS), (11, 15, 16))
        d = ImageDraw.Draw(f)
        d.text((16, 10), f'{etape} / {len(ORDRE)}  ·  {t}', font=ft, fill=(240, 240, 240))
        d.text((16, 44), sous, font=fs, fill=(170, 190, 195))
        d.rectangle([0, HAUT - 6, W, HAUT - 3], fill=(30, 38, 40))
        d.rectangle([0, HAUT - 6, int(W * etape / len(ORDRE)), HAUT - 3], fill=(242, 194, 48))
        f.paste(im, (0, HAUT))
        x, y = 16, HAUT + H + 9
        for col, txt in [(COUL[0], 'roche'), (COUL[1], 'cavernes et boyaux'), (COUL[3], 'sol des bâtiments'), (COUL[2], 'murs'), (COUL[4], 'portes'), (COUL[5], 'boyaux de porte')]:
            d.rectangle([x, y, x + 12, y + 12], fill=col, outline=(90, 100, 100))
            d.text((x + 18, y - 1), txt, font=fl, fill=(190, 200, 205))
            x += 18 + int(d.textlength(txt, font=fl)) + 22
        return f

    prev = None
    for s in S:
        nom = s['nom']
        images.append(cadre(nom, carte(r, s, prev, sc, centres=nom in ('centres', 'boyau', 'boucle', 'impasse'))))
        durees.append(DUREE[nom])
        prev = s
    images.append(cadre('final', carte(r, S[-1], None, sc, arrivee=True)))
    durees.append(4500)
    mos = Image.new('RGB', (images[0].width, images[0].height * 3))
    for i, f in enumerate([images[0], images[len(images) // 2], images[-1]]):
        mos.paste(f, (0, i * images[0].height))
    pal = mos.quantize(64, dither=Image.Dither.NONE)      # une palette commune : pas de scintillement entre les images
    q = [f.quantize(palette=pal, dither=Image.Dither.NONE) for f in images]
    q[0].save(sortie, save_all=True, append_images=q[1:], duration=durees, loop=0, optimize=False, disposal=1)
    images[-1].save(pathlib.Path(sortie).with_suffix('.png'))
    return len(images), sum(durees) / 1000


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)
    n = int(sys.argv[2]) if len(sys.argv) > 2 else 8
    reg = {k: float(v) for k, v in (kv.split('=') for kv in (sys.argv[3] if len(sys.argv) > 3 else DEFAUT).split(','))}
    cartes = asyncio.run(tirages(n, reg))
    best = max(cartes, key=lambda r: (r['nb'], len(r['S'])))
    k, s = gif(best, sys.argv[1])
    print(f"{n} cartes tirées, retenue : {best['nb']} bâtiments ; {k} images, {s:.1f} s -> {sys.argv[1]}")
