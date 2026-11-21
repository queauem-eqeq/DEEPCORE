/* Mesure des ambiances : K cartes par ambiance (window.MA = {recettes:[…], k, taille}), en taille 3 par défaut.
   Pour chaque ambiance : site accessible, part de sol ouvert, d'eau, de gouffre, de bâti, pièces, cases de tunnel, temps moyen. */
(() => {
  const MA=window.MA||{},K=MA.k||15,out=[],NIV={atterrissage:1,classique:1,cavernes:2,base:3};
  for(const rec of MA.recettes||Object.keys(AMBIANCES)){out.push('== '+rec);
    for(const a of Object.keys(AMBIANCES[rec])){const sauve=JSON.parse(JSON.stringify(GEN));let acc=0,ouv=0,eau=0,gou=0,bat=0,pie=0,tun=0,ms=0,dist=0,sansB=0,mach=0;
      for(let k=0;k<K;k++){recRange();recPrend(rec);ambiance(a,rec);GEN.taille=MA.taille||3;SANS_VAISSEAU=NIV[rec]>1;const t0=performance.now();niveau();G.niv=NIV[rec];SANS_VAISSEAU=false;ms+=performance.now()-t0;
        const N=W*H,ok=v=>!blocks(v)||v===LOCK||v===SECRET||(typeof machPassable==='function'&&machPassable(v)),d=new Int32Array(N).fill(-1),q=[idx(G.px,G.py)];d[q[0]]=0;
        for(let i=0;i<q.length;i++){const c=q[i],x=c%W,y=(c/W)|0;for(const [dx,dy] of D4){const j=idx(x+dx,y+dy);if(d[j]<0&&ok(G.t[j])){d[j]=d[c]+1;q.push(j);}}}
        const ds=typeof accesSite==='function'?accesSite():(G.sites[0]?d[idx(G.sites[0].x,G.sites[0].y)]:-1);if(ds>=0){acc++;dist+=ds;}
        for(let i=0;i<N;i++){const v=G.t[i];if(v===GROUND||v===GRASS||v===FLAT||v===RUBBLE)ouv++;else if(isWater(v))eau++;else if(v===CHASM)gou++;else if(v===FLOOR)bat++;else if(v>=MACHINE)mach++;}
        if(!(G.batis||[]).length)sansB++;pie+=(G.batis||[]).reduce((s,b)=>s+(b.pieces||0),0);tun+=G.tunN||0;genRemet(sauve);}
      const N=SIZES[MA.taille||3][0]*SIZES[MA.taille||3][1],f=v=>(v*100/K/N).toFixed(0).padStart(2);
      out.push(`${AMBIANCES[rec][a].n.padEnd(28)} accès ${acc}/${K} · ouvert ${f(ouv)} % · eau ${f(eau)} % · gouffre ${f(gou)} % · bâti ${f(bat)} % · ${(pie/K).toFixed(1)} pièces · tunnels ${(tun/K).toFixed(0)} · machines ${(mach/K).toFixed(0)} · trajet ${(dist/Math.max(1,acc)).toFixed(0)} · sans bâtiment ${sansB} · ${(ms/K).toFixed(0)} ms`);}}
  return out.join('\n');
})()
