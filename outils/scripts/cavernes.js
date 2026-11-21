(() => {
  // Six cartes de la recette cavernes. window.CAS (facultatif) : [[nom, réglages ou {amb:'clé'}], …] ; sinon la planche de départ.
  const base={recette:'cavernes',taille:4};for(const l of recLignes('cavernes'))base[l[1]]=recDef(l);
  const cas=window.CAS||[['Départ',{}],['Départ',{}],['Petites cavernes (50 cases)',{cvTaille:50}],['Grandes cavernes (600 cases)',{cvTaille:600,cvPart:40}],['Cité au centre, 4 bâtiments',{cvDispo:'cite',cvBati:4,cvSurf:24}],['Un côté chacun',{cvDispo:'cote',cvBati:3,cvSurf:20}]];
  const S=4,c=document.createElement('canvas');c.width=1280;c.height=800;c.style.cssText='position:fixed;left:0;top:0;z-index:99999;background:#0b0f10';document.body.appendChild(c);
  const x=c.getContext('2d');x.font='12px monospace';const res=[];
  cas.forEach(([nom,r],n)=>{Object.assign(GEN,base,r);if(r.amb)ambiance(r.amb,'cavernes');if(r.hasard)hasardReglages();newGame();
    const ox=20+(n%3)*420,oy=40+((n/3)|0)*385;
    for(let i=0;i<W*H;i++){const v=G.t[i];let col='#2c3a2e';
      if(G.tun[i])col='#f2c230';else if(v===DOOR)col='#ff4d4d';else if(v===WALL)col='#e8eef0';else if(v===FLOOR)col='#7fb7c9';
      else if(isWater(v))col='#2f6fb0';else if(v===GRASS)col='#4f8a4a';else if(blocks(v))col=ZONE&&ZONE[i]?(SECT&&SECT[i]===1?'#55504a':SECT&&SECT[i]===0?'#454d52':'#3d4146'):'#6a7077';
      x.fillStyle=col;x.fillRect(ox+(i%W)*S,oy+((i/W)|0)*S,S,S);}
    x.fillStyle='#ff9ad5';x.fillRect(ox+G.px*S-3,oy+G.py*S-3,10,10);const o=G.obt,r0=Math.round;
    x.fillStyle='#e8eef0';x.fillText(nom,ox,oy-22);x.fillStyle='#9aa';x.fillText(`cavernes ${r0(o.cav)} % (visé ${r0(o.vise.cav)}), ${o.nb} · bâti ${r0(o.surf)} % (${r0(o.vise.surf)}), ${o.bat} bât.`,ox,oy-7);res.push(o.nb+'/'+o.bat);});
  x.fillStyle='#9aa';x.fillText('vert sombre : cavernes et boyaux · jaune : boyaux de porte · bleu clair : bâtiments · rouge : portes · rose : arrivée · roche : secteur cavernes (gris bleu), bâti (gris brun), roche pleine (sombre)',20,790);
  return res.join(',');
})()
