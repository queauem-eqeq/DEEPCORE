#!/usr/bin/env python3
"""Assemble le banc de combat : la page du jeu, plus banc/banc.js, banc/banc.css et banc/resultats.js.

    python3 outils/banc.py [DOSSIER]        (par défaut : banc/site)

Le dossier produit se publie tel quel comme artefact à part (index.html, style.css, js/…, banc.js, banc.css, resultats.js).
Rien n'est copié à la main : le jeu vient de src/, et la page du banc est celle du jeu avec trois balises en plus.
"""
import pathlib, shutil, sys
R = pathlib.Path(__file__).resolve().parent.parent
dest = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else R / 'banc' / 'site'
if dest.exists():
    shutil.rmtree(dest)
(dest / 'js').mkdir(parents=True)
page = (R / 'src' / 'index.html').read_text(encoding='utf-8')
assert '<title>Noyau Profond</title>' in page and '<link rel="stylesheet" href="style.css">' in page
page = page.replace('<title>Noyau Profond</title>', '<title>Banc de combat</title>')
page = page.replace('<link rel="stylesheet" href="style.css">', '<link rel="stylesheet" href="style.css">\n<link rel="stylesheet" href="banc.css">')
# l'intro du jeu ne doit pas se lancer sur le banc : on la marque « déjà vue » avant que le jeu ne démarre
assert '<script src="js/00-base.js"></script>' in page
page = page.replace('<script src="js/00-base.js"></script>', "<script>try{localStorage.setItem('np-intro','vu');}catch(e){}</script>\n<script src=\"js/00-base.js\"></script>")
page = page.rstrip() + '\n<script src="resultats.js"></script>\n<script src="banc.js"></script>\n'
(dest / 'index.html').write_text(page, encoding='utf-8')
shutil.copy(R / 'src' / 'style.css', dest / 'style.css')
for f in sorted((R / 'src' / 'js').glob('*.js')):
    shutil.copy(f, dest / 'js' / f.name)
for f in ('banc.js', 'banc.css', 'resultats.js'):
    shutil.copy(R / 'banc' / f, dest / f)
print(f'banc assemblé dans {dest} ({len(list(dest.rglob("*.*")))} fichiers)')
