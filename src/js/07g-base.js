/* ---------- Niveau 3 : la grande base (21 novembre 2026) ----------
   Recette « base » : le moteur du niveau 2 (secteurs, cavernes, bâtiments enchâssés, boyaux de porte à caverne), réglé autrement —
   beaucoup de bâti (les ailes de la base), une ou deux petites poches de terrain naturel (les « extérieurs »), et un réseau de
   tunnels qui relie les ailes entre elles. baseFinir() ajoute ce que le niveau 2 n'a pas :
     1. des tunnels en plus, comme au niveau 1 : culs-de-sac et petites salles creusés dans la roche à partir du réseau ;
     2. l'arrivée DANS la base : la foreuse débouche dans une pièce d'une aile, loin du site, et jamais derrière une porte
        verrouillée ou dérobée (on vérifie qu'elle rejoint l'ancien point d'arrivée sans clé).
   Les machines (07f) sont posées juste après, autour du nouveau point d'arrivée. */
function baseFinir(){if(!BATI_DER||!G.batis.length)return;const {B,strs}=BATI_DER,t=G.t,N=W*H;
  // 1. tunnels en plus
  {const pres=new Uint8Array(N);for(let i=0;i<N;i++){if(t[i]<WALL&&ZONE[i])continue;const x=i%W,y=(i/W)|0,r=t[i]>=WALL?2:1;   // ni contre un bâtiment (2 cases) ni contre une poche (1 case)
      for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const a=x+dx,b=y+dy;if(a>=0&&b>=0&&a<W&&b<H)pres[idx(a,b)]=1;}}
    const ok=j=>{const x=j%W,y=(j/W)|0;return x>=2&&y>=2&&x<W-2&&y<H-2&&t[j]===MOUNT&&!pres[j];};
    const all=Object.keys(G.tun||{}).map(Number);if(!all.length)for(const S of strs)for(const e of S.entrees)all.push(e.o);
    const ech=Math.min(1,N/6144),cible=Math.round(Math.max(0,autour('bsTunnels',.3))*ech);let fait=0,salles=Math.max(0,Math.round((GEN.bsSalles||0)+rnd(-1,1)*.5));
    const ouvre=j=>{if(t[j]===MOUNT){t[j]=GROUND;G.tun[j]=1;all.push(j);fait++;}};
    const voisinsOuverts=(j,sauf)=>{let n=0;const x=j%W,y=(j/W)|0;for(const [dx,dy] of D4){const k=idx(x+dx,y+dy);if(k!==sauf&&!blocks(t[k]))n++;}return n;};
    for(let e=0;e<400&&fait<cible&&all.length;e++){let c=all[rnd(0,all.length-1)],d=rnd(0,3),lg=rnd(5,14),chemin=[];
      for(let k=0;k<lg;k++){if(Math.random()<.25)d=(d+(Math.random()<.5?1:3))%4;const [dx,dy]=D4[d],j=idx(c%W+dx,((c/W)|0)+dy);
        if(!ok(j)||voisinsOuverts(j,c)>0||chemin.includes(j))break;chemin.push(j);c=j;}
      if(chemin.length<4)continue;for(const j of chemin){t[j]=GROUND;G.tun[j]=1;all.push(j);fait++;}
      if(salles>0&&Math.random()<.6){salles--;const f=chemin[chemin.length-1],fx=f%W,fy=(f/W)|0,cells=caBlob(rnd(7,11),rnd(5,8),.62,4);let mx=0,my=0;for(const [x,y] of cells){mx+=x;my+=y;}
        mx=Math.round(mx/Math.max(1,cells.length));my=Math.round(my/Math.max(1,cells.length));
        for(const [x,y] of cells){const cx=fx+x-mx,cy=fy+y-my;if(cx<2||cy<2||cx>=W-2||cy>=H-2)continue;const j=idx(cx,cy);if(ok(j))ouvre(j);}}}
    G.tunN=Object.keys(G.tun).length;}
  // 2. l'arrivée dans la base
  {const s=G.sites[0],anc=idx(G.px,G.py),bfs=(de,cle)=>{const d=new Int32Array(N).fill(-1),q=[de];d[de]=0;
      for(let a=0;a<q.length;a++){const c=q[a],x=c%W,y=(c/W)|0;for(const [dx,dy] of D4){const j=idx(x+dx,y+dy),v=t[j];if(d[j]<0&&(!blocks(v)||(cle&&(v===LOCK||v===SECRET)))){d[j]=d[c]+1;q.push(j);}}}return d;};
    const libreDe=bfs(anc,false),dS=s?bfs(idx(s.x,s.y),true):libreDe,cand=[];
    for(const S of strs)for(const p of S.pieces){if(p.g==='couloir'||p.c.length<12)continue;const P=new Set(p.c);
      for(const i of p.c){if(t[i]!==FLOOR||libreDe[i]<0||dS[i]<0||(G.art&&G.art[i]!=null)||G.cles[i])continue;const x=i%W,y=(i/W)|0;let bon=true;
        for(let dy=-1;dy<=1&&bon;dy++)for(let dx=-1;dx<=1;dx++){const j=idx(x+dx,y+dy);if(!P.has(j)||t[j]!==FLOOR||B.porte[j]||(G.art&&G.art[j]!=null)){bon=false;break;}}
        if(bon)cand.push([dS[i],i]);}}
    if(cand.length){cand.sort((a,b)=>b[0]-a[0]);const [,i]=cand[rnd(0,Math.max(0,Math.ceil(cand.length*.25)-1))];G.px=i%W;G.py=(i/W)|0;G.arrivee='base';}}
}
