(() => {
  const d={recette:'cavernes',cvPart:36,cvNb:6,cvBoyaux:2,cvBati:2,cvSurf:14};
  const cas=[['départ, taille 4',{taille:4}],['taille 3',{taille:3}],['taille 2',{taille:2}],['peu de grandes',{taille:4,cvNb:2,cvPart:42}],['beaucoup de petites',{taille:4,cvNb:11,cvPart:30}],['4 bâtiments',{taille:4,cvBati:4,cvSurf:24}],['1 petit bâtiment',{taille:4,cvBati:1,cvSurf:8}],['grande carte 5',{taille:5}]];
  const out=[];
  for(const [nom,r] of cas){Object.assign(GEN,d,{taille:4},r);let cav=0,bat=0,tun=0,emp=0,conn=0,tot=0,t0=performance.now();const nb=[0,0,0,0,0];
    for(let k=0;k<40;k++){newGame();tot++;let n=0;for(let i=0;i<W*H;i++)if(ZONE&&!ZONE[i])n++;cav+=100*n/(W*H);bat+=G.batis.length;nb[G.batis.length]++;tun+=G.tunN||0;emp+=G.batis.reduce((a,b)=>a+b.cases,0)*100/(W*H);{const ok=v=>!blocks(v)||v===LOCK||v===SECRET,vu=new Uint8Array(W*H),q=[idx(G.px,G.py)];vu[q[0]]=1;for(let a=0;a<q.length;a++){const c=q[a],x=c%W,y=(c/W)|0;for(const [dx,dy] of D4){const j=idx(x+dx,y+dy);if(!vu[j]&&ok(G.t[j])){vu[j]=1;q.push(j);}}}let tt=0;for(let i=0;i<W*H;i++)if(ok(G.t[i]))tt++;if(q.length===tt&&vu[idx(G.sites[0].x,G.sites[0].y)])conn++;}}
    out.push(`${nom} : cavernes ${(cav/tot).toFixed(0)} % · bâtiments ${(bat/tot).toFixed(1)} [0:${nb[0]} 1:${nb[1]} 2:${nb[2]} 3:${nb[3]} 4:${nb[4]}] · surface bâtie ${(emp/tot).toFixed(0)} % · boyaux de porte ${(tun/tot).toFixed(0)} · tout relié (verrous et secrets franchis, site atteint) ${conn}/${tot} · ${((performance.now()-t0)/tot).toFixed(0)} ms/carte`);}
  return out.join('\n');
})()
