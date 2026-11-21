(() => {
  const base={recette:'cavernes',taille:4};for(const l of recLignes('cavernes'))base[l[1]]=recDef(l);
  const cas=[['départ',{}],['taille 3',{taille:3}],['taille 2',{taille:2}],['taille 5',{taille:5}],['cav 50 cases',{cvTaille:50}],['cav 400',{cvTaille:400}],['cav 800 part 45',{cvTaille:800,cvPart:45}],['part 15',{cvPart:15}],['part 55',{cvPart:55}],['6 bât 30 %',{cvBati:6,cvSurf:30}],['1 bât 6 %',{cvBati:1,cvSurf:6}],['3 bât 10 pièces',{cvBati:3,cvSurf:20,cvPieces:10}],['2 bât 4 pièces',{cvBati:2,cvSurf:14,cvPieces:4}]]
    .concat(Object.keys(AMBIANCES.cavernes).map(a=>['amb '+AMBIANCES.cavernes[a].n,{amb:a}]));
  const out=[];
  for(const [nom,r] of cas){Object.assign(GEN,base,r);if(r.amb)ambiance(r.amb,'cavernes');const K=25;let c=0,vc=0,nb=0,vn=0,b=0,vb=0,s=0,vs=0,pc=0,np=0,conn=0,t0=performance.now(),big=0;
    for(let k=0;k<K;k++){newGame();const o=G.obt;c+=o.cav;vc+=o.vise.cav;nb+=o.nb;vn+=o.vise.nb;b+=o.bat;vb+=o.vise.bat;s+=o.surf;vs+=o.vise.surf;for(const x of G.batis){pc+=x.pieces;np++;}
      const ok=v=>!blocks(v)||v===LOCK||v===SECRET,vu=new Uint8Array(W*H),q=[idx(G.px,G.py)];vu[q[0]]=1;for(let a=0;a<q.length;a++){const cc=q[a],x=cc%W,y=(cc/W)|0;for(const [dx,dy] of D4){const j=idx(x+dx,y+dy);if(!vu[j]&&ok(G.t[j])){vu[j]=1;q.push(j);}}}let tt=0;for(let i=0;i<W*H;i++)if(ok(G.t[i]))tt++;if(q.length===tt&&vu[idx(G.sites[0].x,G.sites[0].y)])conn++;}
    const f=(a)=>(a/K).toFixed(1);
    out.push(`${nom} : cavernes ${f(c)} % (visé ${f(vc)}) · nb ${f(nb)} (${f(vn)}) · bât ${f(b)} (${f(vb)}) · bâti ${f(s)} % (${f(vs)}) · pièces/bât ${(pc/Math.max(1,np)).toFixed(1)} · relié ${conn}/${K} · ${((performance.now()-t0)/K).toFixed(0)} ms`);}
  return out.join('\n');
})()
