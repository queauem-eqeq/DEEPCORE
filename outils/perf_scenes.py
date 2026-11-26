#!/usr/bin/env python3
"""Fluidité des scènes plein écran (26 novembre 2026) : l'arrivée (intro), la première descente et la seconde (mines).

    python3 outils/perf_scenes.py [intro|niv1|niv2 ...] [--profil] [--l L --h H --densite D]

Pour chaque scène : nombre d'images par seconde obtenues, temps de calcul d'une image (moyenne, p95, pire), part de CPU,
et ce qui coûte (avec --profil : temps propre par fonction, profil CPU de Chromium).
"""
import asyncio, collections, pathlib, sys
from playwright.async_api import async_playwright

JEU = (pathlib.Path(__file__).resolve().parent.parent / 'src' / 'index.html').as_uri()
# chronomètre chaque rappel d'image (requestAnimationFrame) ; t = instant, d = durée du calcul
ESPION = """window.__T=[];const _raf=window.requestAnimationFrame.bind(window);
window.requestAnimationFrame=cb=>_raf(ts=>{const a=performance.now();cb(ts);const d=performance.now()-a;window.__T.push([a,d]);});"""
DUREE = {'intro': 14000, 'niv1': 12000, 'niv2': 14000}


def arg(nom, defaut):
    return type(defaut)(sys.argv[sys.argv.index(nom) + 1]) if nom in sys.argv else defaut


async def scene(nav, nom, profil):
    pg = await nav.new_page(viewport={'width': arg('--l', 1280), 'height': arg('--h', 800)}, device_scale_factor=arg('--densite', 1.0))
    err = []; pg.on('pageerror', lambda e: err.append(str(e)))
    if nom != 'intro':
        await pg.add_init_script("try{localStorage.setItem('np-intro','vu')}catch(e){}")
    await pg.add_init_script(ESPION)
    await pg.goto(JEU)
    if nom != 'intro':
        await pg.wait_for_timeout(800)
    cdp = None
    if profil:
        cdp = await pg.context.new_cdp_session(pg)
        await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', {'interval': 200}); await cdp.send('Profiler.start')
    await pg.evaluate("window.__T=[]")
    if nom != 'intro':
        await pg.evaluate("descendre(%d)" % (2 if nom == 'niv2' else 1))
    await pg.wait_for_timeout(DUREE[nom])
    T = await pg.evaluate("window.__T")
    prof = (await cdp.send('Profiler.stop'))['profile'] if cdp else None
    await pg.close()
    if not T:
        print(f'{nom} : aucune image'); return
    dur = (T[-1][0] - T[0][0]) / 1000 or 1; cpu = sum(x[1] for x in T)
    T = [x for x in T if x[1] > .3]   # les rappels sautés par raf20 (cadence de 20 images/s) ne dessinent rien
    if not T:
        print(f'{nom} : aucune image dessinée'); return
    d = sorted(x[1] for x in T)
    pires = sorted(range(len(T)), key=lambda i: -T[i][1])[:3]
    iv = sorted(T[i][0] - T[i - 1][0] for i in range(1, len(T)))
    print(f'{nom:5} : {len(T) / dur:4.1f} images/s · calcul par image moy {sum(d) / len(d):5.1f} ms, p95 {d[int(len(d) * .95)]:5.1f}, '
          f'pire {d[-1]:5.1f} · CPU {100 * cpu / 1000 / dur:4.1f} % · écart entre images p95 {iv[int(len(iv) * .95)]:.0f} ms'
          + f' · pires images n° {[(i, round(T[i][1])) for i in pires]} sur {len(T)}'
          + (f' · ERREURS {err}' if err else ''))
    if prof:
        noeuds = {x['id']: x for x in prof['nodes']}; pas = collections.Counter(prof['samples']); tot = sum(pas.values())
        c = collections.Counter()
        for i, k in pas.items():
            f = noeuds[i]['callFrame']; fich = f['url'].rsplit('/', 1)[-1]
            c[f"{f['functionName'] or '(anonyme)'} {fich}:{f['lineNumber'] + 1}" if fich else (f['functionName'] or '?')] += k
        for n, k in c.most_common(12):
            print(f'        {100 * k / tot:5.1f} %  {n}')


async def principal():
    noms = [a for a in sys.argv[1:] if a in DUREE] or list(DUREE)
    async with async_playwright() as p:
        nav = await p.chromium.launch()
        for n in noms:
            await scene(nav, n, '--profil' in sys.argv)
        await nav.close()

asyncio.run(principal())
