# Mesure du temps de calcul et des intervalles entre images pendant l'intro (écran 1600×1000, densité 2). Usage : python3 outils/perf.py
import asyncio,sys
from playwright.async_api import async_playwright
INIT="""
window.__T=[];const _raf=window.requestAnimationFrame.bind(window);
window.requestAnimationFrame=cb=>_raf(ts=>{const a=performance.now();cb(ts);window.__T.push([a,performance.now()-a]);});
"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch()
    pg=await b.new_page(viewport={'width':1600,'height':1000},device_scale_factor=2)
    await pg.add_init_script(INIT)
    await pg.goto(__import__('pathlib').Path(__file__).resolve().parent.parent.joinpath('dist/noyau-profond.html').as_uri())
    await pg.wait_for_timeout(10500)
    T=await pg.evaluate("window.__T")
    t0=T[0][0]
    for s in range(0,11):
      xs=[d for a,d in T if s<=(a-t0)/1000<s+1]
      if xs: iv=[T[i][0]-T[i-1][0] for i in range(1,len(T)) if s<=(T[i][0]-t0)/1000<s+1];print(s,'interval max %.0f'%max(iv) if iv else '',len(xs),'frames  avg %.1f ms  max %.1f'%(sum(xs)/len(xs),max(xs)))
    await b.close()
asyncio.run(main())
