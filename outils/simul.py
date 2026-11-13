#!/usr/bin/env python3
"""Mesure la détection et la fuite en rejouant des situations dans le vrai moteur du jeu.

    python3 outils/simul.py [detection|fuite|tout]

Les simulations tournent dans la page, sur une carte entièrement dégagée (ou avec l'obstacle voulu),
en appelant directement animalsAct() et beastsAct(). Elles ne touchent ni aux fichiers ni à l'artefact.
À relancer après chaque changement d'équilibrage de la discrétion pour comparer aux chiffres de
docs/mesures.md, qui donne les valeurs de référence et la date de leur mesure.

Attention : toujours dégager **toute** la carte avant une mesure à longue distance. Un relief laissé
au hasard coupe la ligne de vue et fausse le résultat sans prévenir.
"""
import asyncio
import pathlib
import sys

from playwright.async_api import async_playwright

RACINE = pathlib.Path(__file__).resolve().parent.parent
JEU = 'file://' + str(RACINE / 'src' / 'index.html')

COMMUN = """
const degager = () => { for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) G.t[idx(x, y)] = GROUND; };
const crabos = (x, y, chasse) => ({ sp: 0, x, y, hp: 25, mp: 0, hunt: chasse ? 1 : 0, dir: 1,
                                    mem: chasse ? [G.px, G.py] : null, search: 0, lost: 0 });
"""

DETECTION = COMMUN + """
(() => {
const out = {}, N = 300;
degager(); G.px = 48; G.py = 32; G.animals = []; lastAct = 'move'; turnStealth();
out['portée en terrain dégagé'] = G.stealth;

// combien de tours avant qu'une bête calme vous remarque, à distance fixe et en vue
const remarquer = (d) => {
  const r = [];
  for (let i = 0; i < N; i++) {
    G.beasts = [crabos(G.px + d, G.py, false)];
    let n = 0;
    while (!G.beasts[0].hunt && n < 200) { G.beasts[0].x = G.px + d; G.beasts[0].mp = 0; lastAct = 'move'; beastsAct(); n++; }
    r.push(G.beasts[0].hunt ? n : 0);
  }
  const ok = r.filter(v => v > 0);
  return ok.length === 0 ? 'jamais' : Math.round(ok.length / N * 100) + ' % en ' + (ok.reduce((a, b) => a + b, 0) / ok.length).toFixed(1) + ' tours';
};
for (const d of [3, 8, 10, 11]) out['vous remarque à ' + d + ' cases'] = remarquer(d);

// combien de tours avant qu'une bête en chasse perde votre trace, à distance fixe et en vue
const perdre = (d) => {
  const r = [];
  for (let i = 0; i < N; i++) {
    G.beasts = [crabos(G.px + d, G.py, true)];
    let n = 0;
    while (!G.beasts[0].lost && G.beasts[0].hunt && n < 400) { G.beasts[0].x = G.px + d; G.beasts[0].mp = 0; lastAct = 'move'; beastsAct(); n++; }
    r.push(G.beasts[0].lost ? n : 0);
  }
  const ok = r.filter(v => v > 0);
  return ok.length === 0 ? 'jamais' : Math.round(ok.length / N * 100) + ' % en ' + Math.round(ok.reduce((a, b) => a + b, 0) / ok.length) + ' tours';
};
for (const d of [5, 10, 13, 19]) out['perd votre trace à ' + d + ' cases'] = perdre(d);

G.beasts = [crabos(G.px + 25, G.py, true)]; G.beasts[0].mem = [G.px - 9, G.py];
lastAct = 'move'; beastsAct();
out['au-delà du double rayon (25 cases)'] = (G.beasts[0].mem && G.beasts[0].mem[0] === G.px) ? 'garde le contact' : 'contact rompu aussitôt';
return JSON.stringify(out, null, 1);
})()
"""

FUITE = COMMUN + """
(() => {
const N = 40, MAXT = 55, X0 = 30, Y0 = 32, out = {};
const pas = (dx, dy) => { const nx = G.px + dx, ny = G.py + dy;
  if (nx > 0 && ny > 0 && nx < W - 1 && ny < H - 1 && !blocks(G.t[idx(nx, ny)]) && diagOk(G.px, G.py, dx, dy)) {
    G.px = nx; G.py = ny; if (G.t[idx(nx, ny)] === GRASS) G.t[idx(nx, ny)] = FLAT; return true; }
  return false; };
function essai(prepare, avancer, dist) {
  degager(); G.px = X0; G.py = Y0; G.animals = []; prepare(); lastAct = 'move'; turnStealth();
  G.beasts = [crabos(X0 - dist, Y0, true)];
  for (let n = 1; n <= MAXT; n++) { avancer(n); lastAct = 'move'; G.turn++; animalsAct(); beastsAct();
    if (!G.beasts[0].hunt) return n; }
  return 0;
}
function mesure(nom, prepare, avancer, dist) {
  const r = []; for (let i = 0; i < N; i++) r.push(essai(prepare, avancer, dist));
  const ok = r.filter(v => v > 0);
  out[nom] = ok.length === 0 ? 'jamais semée'
    : Math.round(ok.length / N * 100) + ' % semée, en ' + Math.round(ok.reduce((a, b) => a + b, 0) / ok.length) + ' tours';
}
const rien = () => {}, droit = () => pas(1, 0);
// contrôle : la bête est enfermée, elle doit abandonner tout de suite
const enfermee = () => { for (let y = Y0 - 3; y <= Y0 + 3; y++) for (let x = X0 - 8; x <= X0 - 2; x++)
  if (y === Y0 - 3 || y === Y0 + 3 || x === X0 - 8 || x === X0 - 2) G.t[idx(x, y)] = MOUNT; };
mesure('CONTRÔLE : bête enfermée', enfermee, droit, 5);
mesure('terrain dégagé, 4 cases d’avance', rien, droit, 4);
mesure('terrain dégagé, 12 cases d’avance', rien, droit, 12);
mesure('terrain dégagé, 21 cases d’avance', rien, droit, 21);
const herbes = () => { for (let y = 4; y < H - 4; y++) for (let x = X0 - 6; x < W - 2; x++) G.t[idx(x, y)] = GRASS; };
mesure('herbes hautes, ligne droite', herbes, droit, 4);
mesure('herbes hautes, en zigzag', herbes, (n) => { const d = (Math.floor((n - 1) / 4) % 2 === 0) ? -1 : 1; if (!pas(1, d)) pas(1, 0); }, 4);
const mur = () => { for (let y = 4; y < H - 4; y++) G.t[idx(X0 + 6, y)] = MOUNT; G.t[idx(X0 + 6, Y0)] = GROUND; };
const franchir = () => { if (G.px <= X0 + 6) pas(1, 0); else if (!pas(0, -1)) pas(1, 0); };
mesure('ouverture dans un mur puis obliquer', mur, franchir, 4);
mesure('la même avec 12 cases d’avance', mur, franchir, 12);
const rochers = () => { for (let y = 4; y < H - 4; y++) for (let x = X0 + 3; x < W - 2; x++) if ((x * 7 + y * 13) % 11 < 4) G.t[idx(x, y)] = MOUNT; };
mesure('zone de rochers épars', rochers, (n) => { const d = (Math.floor((n - 1) / 3) % 2 === 0) ? -1 : 1; if (!pas(1, d)) if (!pas(1, 0)) pas(0, d); }, 4);
return JSON.stringify(out, null, 1);
})()
"""


async def principal(quoi: str) -> int:
    async with async_playwright() as p:
        nav = await p.chromium.launch()
        page = await nav.new_page(viewport={'width': 1280, 'height': 800})
        erreurs: list[str] = []
        page.on('pageerror', lambda e: erreurs.append(str(e)))
        await page.goto(JEU)
        for _ in range(60):
            await page.wait_for_timeout(500)
            if not await page.locator('#introCv').is_visible():
                break

        for nom, code in (('DÉTECTION', DETECTION), ('FUITE', FUITE)):
            if quoi in ('tout', nom.lower().replace('é', 'e')):
                print('\n===', nom, '===')
                print(await page.evaluate(code))
        print('\nerreurs de la page :', erreurs if erreurs else 'aucune')
        await nav.close()
        return 1 if erreurs else 0


if __name__ == '__main__':
    choix = sys.argv[1] if len(sys.argv) > 1 else 'tout'
    if choix not in ('detection', 'fuite', 'tout'):
        print(__doc__)
        sys.exit(2)
    sys.exit(asyncio.run(principal(choix)))
