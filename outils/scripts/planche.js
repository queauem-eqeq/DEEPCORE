/* Planche de cartes : douze cartes côte à côte, une par cas, avec leurs mesures.
   Se lance par outils/planche_cartes.py, qui pose window.PL = {taille, cas:[[nom, {réglages GEN…, amb:'clé'}], …]}.
   Un cas peut porter « amb » (ambiance de sa recette) et « niv » (niveau de la descente : pas de vaisseau au-delà de 1).
   Renvoie une ligne de mesures par carte. */
(() => {
  const PL=window.PL,S=PL.s||4,cols=PL.cols||4,pw=1280/cols|0,ph=PL.ph||262;
  let c=document.getElementById('plCv');if(!c){c=document.createElement('canvas');c.id='plCv';document.body.appendChild(c);}
  c.width=1280;c.height=800;c.style.cssText='position:fixed;left:0;top:0;z-index:99999;background:#0b0f10';
  const x=c.getContext('2d');x.fillStyle='#0b0f10';x.fillRect(0,0,1280,800);x.font='12px monospace';const out=[];
  PL.cas.forEach(([nom,r],n)=>{
    const sauve=JSON.parse(JSON.stringify(GEN));
    GEN.taille=PL.taille||3;if(r.recette){recRange();recPrend(r.recette);}
    if(r.amb&&typeof ambiance==='function')ambiance(r.amb,r.recette||GEN.recette);
    if(r.ambM&&typeof ambMonde==='function')ambMonde(r.ambM);   // archétype monde (22 novembre 2026)
    if(r.hasard){hasardReglages();GEN.taille=PL.taille||3;nom=ambDouble()||nom;}   // comme les boutons Lab → Niv : un archétype monde et un bâti tirés
    for(const k in r)if(k!=='amb'&&k!=='ambM'&&k!=='niv'&&k!=='recette')GEN[k]=r[k];
    SANS_VAISSEAU=(r.niv||1)>1;NIV_GEN=r.niv||1;const t0=performance.now();niveau();G.niv=r.niv||1;SANS_VAISSEAU=false;const ms=performance.now()-t0;
    const ox=10+(n%cols)*pw,oy=34+((n/cols)|0)*ph,N=W*H,cnt={};
    for(let i=0;i<N;i++){const v=G.t[i];let col='#2c3a2e',k='sol';
      if(G.epI&&G.epI[i]!=null&&(v===SHIP||v===TERMINAL)){col=v===TERMINAL?'#ffffff':'#d98a5a';k='épave';}   // Astroport (07h)
      else if(G.fosI&&G.fosI[i]!=null&&!blocks(v)){col=G.epI&&G.epI[i]!=null?'#7a5a48':'#4a4436';k='fosse';}
      else if(G.tun&&G.tun[i]){col='#f2c230';k='tunnel';}else if(v===DOOR||v===LOCK){col='#ff4d4d';k='porte';}else if(v===WALL||v===SECRET||v===PILLAR){col='#e8eef0';k='mur';}else if(v===FLOOR){col='#7fb7c9';k='bati';}
      else if(v===SHIP||v===DECK){col='#ff9ad5';k='vaisseau';}else if(isWater(v)){col='#2f6fb0';k='eau';}else if(v===GRASS||v===FLAT){col='#4f8a4a';k='herbe';}
      else if(v===CHASM){col='#000';k='gouffre';}else if(v===BRIDGE){col='#a87a3c';k='pont';}else if(v===MACHINE||v===ANTENNA||v===TERMINAL){col='#ff8c1a';k='machine';}
      else if(typeof machTuile==='function'&&machTuile(v)){col=typeof machCouleur==='function'?machCouleur(v):'#ff8c1a';k='piege';}
      else if(blocks(v)){col=ZONE&&ZONE[i]?'#4a4f55':'#6a7077';k=ZONE&&ZONE[i]?'massif':'relief';}
      cnt[k]=(cnt[k]||0)+1;x.fillStyle=col;x.fillRect(ox+(i%W)*S,oy+((i/W)|0)*S,S,S);}
    for(const k in G.soc||{}){x.fillStyle='#ffe14d';x.fillRect(ox+(+k%W)*S+1,oy+((+k/W)|0)*S+1,S-2,S-2);}
    for(const k in G.lz||{}){x.fillStyle='#7a1010';x.fillRect(ox+(+k%W)*S+1,oy+((+k/W)|0)*S+1,S-2,S-2);}
    if(PL.betes)for(const b of G.beasts||[]){x.fillStyle=b.g!=null?['#ff5a5a','#ffb000','#c77dff','#5ad1ff','#9dff5a','#ff7ad1'][b.g%6]:'#ff5a5a';x.fillRect(ox+b.x*S,oy+b.y*S,S,S);}
    x.fillStyle='#ff9ad5';x.fillRect(ox+G.px*S-2,oy+G.py*S-2,S+4,S+4);
    for(const s of G.sites){x.fillStyle='#fff';x.fillRect(ox+s.x*S-2,oy+s.y*S-2,S+4,S+4);x.fillStyle='#d0f';x.fillRect(ox+s.x*S,oy+s.y*S,S,S);}
    // accessibilité du site (clés et portes dérobées comptées comme franchissables) et longueur du trajet
    const ok=v=>!blocks(v)||v===LOCK||v===SECRET||(typeof machPassable==='function'&&machPassable(v)),d=new Int32Array(N).fill(-1),q=[idx(G.px,G.py)];d[q[0]]=0;
    for(let a=0;a<q.length;a++){const cc=q[a],cx=cc%W,cy=(cc/W)|0;for(const [dx,dy] of D4){const j=idx(cx+dx,cy+dy);if(d[j]<0&&ok(G.t[j])){d[j]=d[cc]+1;q.push(j);}}}
    const ds=typeof accesSite==='function'?accesSite():(G.sites[0]?d[idx(G.sites[0].x,G.sites[0].y)]:-1),p=k=>Math.round((cnt[k]||0)*100/N);
    const pieces=(G.batis||[]).reduce((a,b)=>a+(b.pieces||0),0);
    x.fillStyle='#e8eef0';x.fillText(nom,ox,oy-18);x.fillStyle=ds<0?'#ff5a5a':'#9aa';
    const lig=`ouv ${p('sol')+p('herbe')} eau ${p('eau')} bâti ${p('bati')} tun ${cnt.tunnel||0} · ${(G.batis||[]).length}b ${pieces}p · site ${ds<0?'INACCESSIBLE':ds}`;
    x.fillText(lig,ox,oy-5,pw-18);out.push(`${nom} | ${lig} | gouffre ${p('gouffre')}% massif ${p('massif')}% décor ${cnt.machine||0} pièges ${JSON.stringify(G.machN||{})} bêtes ${(G.beasts||[]).length} | ${ms|0} ms`);
    genRemet(sauve);});
  return out.join('\n');
})()
