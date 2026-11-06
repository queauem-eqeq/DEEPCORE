#!/usr/bin/env python3
"""Assemble le jeu en un seul fichier HTML : dist/noyau-profond.html (c'est ce fichier qui est publié sur l'artefact).
src/index.html contient deux repères : /*@@CSS@@*/ (remplacé par src/style.css) et /*@@JS@@*/ (remplacé par
src/js/*.js, concaténés dans l'ordre de leur numéro). Les scripts partagent la même portée : pas de modules."""
import pathlib
R=pathlib.Path(__file__).parent
html=(R/'src/index.html').read_text(encoding='utf8')
css=(R/'src/style.css').read_text(encoding='utf8')
js=''.join(p.read_text(encoding='utf8') for p in sorted((R/'src/js').glob('*.js')))
out=html.replace('/*@@CSS@@*/\n',css,1).replace('/*@@JS@@*/\n',js,1)
(R/'dist').mkdir(exist_ok=True)
(R/'dist/noyau-profond.html').write_text(out,encoding='utf8')
print('dist/noyau-profond.html',len(out.encode('utf8')),'octets')
