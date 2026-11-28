#!/usr/bin/env python3
"""Coût d'un groupe affronté de face au banc, par niveau (chantier survie, bloc C, 28 novembre 2026).

    python3 outils/banc.py && python3 outils/cout_groupes.py ESSAIS DEGATS [NIVEAUX…]

DEGATS : 0 = dégâts de base (Bestiaire), 1 = ceux du niveau (REGLES.MENACE_DEG). Groupes hostiles permis au niveau, tirés selon leur
fréquence, effectif tiré ; foreuse de série, vie d'essai 1000 (on mesure la perte brute), assaut, arène (marécage pour les torpilles).
Sortie : moyenne, médiane, 9e décile par niveau, puis par groupe. Rien n'est écrit dans src/."""
import asyncio, json, pathlib, sys
from playwright.async_api import async_playwright
R = pathlib.Path(__file__).resolve().parent.parent
PAGE = (R / 'banc' / 'site' / 'index.html').as_uri()
JS = """([N,degNiv,niv])=>{const NV=nivDe(niv),L=GROUPES.liste.filter(g=>g.on&&NV.gr.includes(g.n)&&g.role!=='ferraille'&&g.m.length);
 const pds=L.map(g=>[.5,1,2][g.f??1]),tot=pds.reduce((a,b)=>a+b,0),out=[],par={};
 for(let i=0;i<N;i++){let t=Math.random()*tot,k=0;while(k<L.length-1&&(t-=pds[k])>0)k++;const g=L[k],en={};
  for(const m of g.m){const n=rnd(Math.min(m.min,m.max),Math.max(m.min,m.max));if(n>0)en[m.k]=(en[m.k]||0)+n;}
  if(!Object.keys(en).length)continue;
  const cfg={carte:en.brochon?'marecage':'arene',ennemis:en,arme:'foreuse',armure:'',acc:[],pilote:'chasse',vie:1000,alerte:true,niv:degNiv?niv:0};
  const r=BANC.essai(cfg);const p=r.v0-r.vie;out.push(p);(par[g.n]=par[g.n]||[]).push(p);}
 return {out,par};}"""
async def main():
    N=int(sys.argv[1]); deg=int(sys.argv[2]); nivs=[int(x) for x in sys.argv[3:]] or [1,2,3]
    async with async_playwright() as p:
        nav=await p.chromium.launch(); page=await nav.new_page(); await page.goto(PAGE)
        await page.wait_for_function("window.BANC && document.getElementById('banc')")
        for n in nivs:
            r=await page.evaluate(JS,[N,deg,n]); o=sorted(r['out'])
            q=lambda f:o[int((len(o)-1)*f)]
            print(f"niv {n} (dégâts {'niveau' if deg else 'base'}) : n={len(o)} moy={sum(o)/len(o):.1f} méd={q(.5)} D9={q(.9)} max={o[-1]} part>70={sum(1 for v in o if v>70)/len(o):.0%}")
            for g,l in sorted(r['par'].items(),key=lambda x:-sum(x[1])/len(x[1])):
                l=sorted(l);print(f"    {g:30} n={len(l):3} moy={sum(l)/len(l):5.1f} D9={l[int((len(l)-1)*.9)]}")
        await nav.close()
asyncio.run(main())
