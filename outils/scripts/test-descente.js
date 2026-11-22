/* La descente entière, K fois (window.TD = {k}) : niveau 1, forage, niveau 2, mini-jeu des mines, niveau 3, noyau.
   Les deux scènes de forage sont jouées en accéléré, sans dessin. À chaque niveau : recette, ambiance, site accessible, machines,
   créatures ; et, d'un niveau à l'autre, la foreuse doit garder sa vie, sa Matière et son inventaire. */
(() => {
  const K=(window.TD||{}).k||5,out=[],raf=window.requestAnimationFrame,sauve=JSON.parse(JSON.stringify(GEN));window.requestAnimationFrame=()=>0;let ok=0;
  for(let k=0;k<K;k++){const l=[];let bon=true;
    recRange();recPrend('atterrissage');GEN.taille=3;GEN.hasard=true;hasardReglages();newGame();G.st.matiere=37;const inv0=G.inv.length;
    for(let e=0;e<3;e++){const s=G.sites[0],acc=accesSite(),vie0=G.st.vie;
      l.push(`niv ${G.niv} ${G.recette} « ${G.amb||'—'} » accès ${acc} · ${Object.entries(G.machN||{}).map(([a,b])=>a+' '+b).join(' ')||'aucune machine'} · ${G.beasts.length+G.animals.length} créatures`);
      if(acc<0||G.niv!==e+1||G.recette!==['atterrissage','cavernes','base'][e])bon=false;
      G.px=s.x;G.py=s.y;end(s);
      if(e<2){if(!FORAGE){bon=false;l.push('pas de scène de forage');break;}const F=FORAGE;F.sansRendu=1;let now=F.t0,n=0;
        while(FORAGE&&n++<1500){now+=33;if(F.jeu){F.kl=F.kr=0;for(const m of F.mines)if(m.ok&&m.y>F.d&&m.y<F.d+F.R*.6&&Math.abs(m.x-F.cx)<8){if(m.x>=F.cx)F.kl=1;else F.kr=1;break;}}forageFrame(now);}
        if(G.over){l.push('foreuse détruite pendant la descente (vie '+vie0+')');break;}
        if(G.st.matiere<37||G.st.matiere>37+FG_AMAS_PRES*FG_AMAS_MAT||G.inv.length!==inv0)bon=false;   // la première descente peut rapporter jusqu'à 60 de Matière (trois amas à portée)
        l.push(`   descente ${F.jeu?'mini-jeu : '+F.touche+' mine(s), −'+F.perdu+' vie':'cinématique'} → vie ${Math.round(G.st.vie)}`);}
      else{if(!(G.over&&G.over.win))bon=false;l.push('   noyau atteint : '+(G.over&&G.over.win?'oui':'NON'));}}
    if(bon)ok++;out.push(`— partie ${k+1} ${bon?'ok':'ÉCHEC'}\n`+l.join('\n'));$('overlay').hidden=true;}
  window.requestAnimationFrame=raf;genRemet(sauve);GEN.hasard=sauve.hasard;return `descentes complètes : ${ok}/${K}\n`+out.join('\n');
})()
