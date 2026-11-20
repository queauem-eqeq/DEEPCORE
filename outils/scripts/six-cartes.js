(() => {
  const d={recette:'atterrissage',taille:4,zExt:60,zComplexe:45,zTunnels:245,zSalles:4,zSorties:2,zPorte:30};
  const cas=[['Un côté',{zForme:'cote'}],['Un côté',{zForme:'cote'}],['Un côté',{zForme:'cote'}],
    ['Un coin',{zForme:'coin'}],['Un coin',{zForme:'coin'}],['Un coin',{zForme:'coin'}]];
  const S=4,c=document.createElement('canvas');c.width=1280;c.height=800;c.style.cssText='position:fixed;left:0;top:0;z-index:99999;background:#0b0f10';document.body.appendChild(c);
  const x=c.getContext('2d');x.font='12px monospace';const res=[];
  cas.forEach(([nom,r],n)=>{Object.assign(GEN,d,r);if(r.hasard)hasardReglages();newGame();   // hasard:true dans un cas → les réglages sont tirés au hasard avant de générer, comme le fait la case du jeu
const ox=20+(n%3)*420,oy=40+((n/3)|0)*385;
    for(let i=0;i<W*H;i++){const v=G.t[i];let col='#2c3a2e';
      if(G.tun[i])col='#f2c230';else if(v===DOOR)col='#ff4d4d';else if(v===WALL)col='#e8eef0';else if(v===FLOOR)col='#7fb7c9';
      else if(v===SHIP||v===DECK)col='#ff9ad5';else if(isWater(v))col='#2f6fb0';else if(v===GRASS)col='#4f8a4a';else if(blocks(v))col=ZONE&&ZONE[i]?'#4a4f55':'#6a7077';
      x.fillStyle=col;x.fillRect(ox+(i%W)*S,oy+((i/W)|0)*S,S,S);}
    x.fillStyle='#ff9ad5';x.fillRect(ox+G.px*S-3,oy+G.py*S-3,10,10);
    x.fillStyle='#e8eef0';x.fillText(nom,ox,oy-22);x.fillStyle='#9aa';x.fillText('tunnels '+(G.tunN||0)+' cases, '+(G.tunS||0)+' sortie(s)',ox,oy-7);res.push(G.tunN);});
  x.fillStyle='#9aa';x.fillText('jaune : tunnels · bleu clair : sol du complexe · blanc : murs · rouge : portes · gris sombre : massif · rose : foreuse et vaisseau',20,790);
  return res.join(',');
})()
