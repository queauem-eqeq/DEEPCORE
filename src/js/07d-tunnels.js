/* ---------- Zones et tunnels (20 novembre 2026) ----------
   Refonte de la génération : la carte n'est plus « du terrain partout », mais un plan de zones. ZONE vaut 0 dans la zone
   extérieure (terrain naturel) et 1 dans le massif (roche pleine, où le complexe est creusé). ZONE est null pour la
   recette « classique ». Les tunnels sont le seul générateur entièrement nouveau : ils relient la porte du complexe enfoui
   à l'extérieur, avec un embranchement vers une seconde sortie et un ou deux culs-de-sac. */
// distance (en cases, sans obstacle) de chaque case à la zone extérieure
function distExt(){const N=W*H,d=new Int16Array(N).fill(-1),q=[];
  for(let i=0;i<N;i++)if(!ZONE[i]){d[i]=0;q.push(i);}
  for(let k=0;k<q.length;k++){const c=q[k],x=c%W,y=(c/W)|0;
    for(const [dx,dy] of D4){const a=x+dx,b=y+dy;if(a<0||b<0||a>=W||b>=H)continue;const j=idx(a,b);if(d[j]<0){d[j]=d[c]+1;q.push(j);}}}
  return d;}
function tunnels(t,B,strs,dE){
  const N=W*H,pied=B.pied,pres=new Uint8Array(N),tun=new Uint8Array(N),all=[];
  for(let i=0;i<N;i++){if(!pied[i])continue;const x=i%W,y=(i/W)|0;   // pres : l'emprise du complexe et une case autour, où l'on ne creuse pas
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const a=x+dx,b=y+dy;if(a>=0&&b>=0&&a<W&&b<H)pres[idx(a,b)]=1;}}
  const libre=j=>{const x=j%W,y=(j/W)|0;return x>=2&&y>=2&&x<W-2&&y<H-2&&t[j]===MOUNT&&!pres[j];};
  const dehors=j=>!ZONE[j]&&!blocks(t[j])&&!isWater(t[j])&&t[j]!==DECK;
  const ecart=(a,b)=>Math.hypot(a%W-b%W,((a/W)|0)-((b/W)|0));
  // cases à r cases ou moins d'un tunnel déjà creusé
  const proche=r=>{const p=new Uint8Array(N);for(const i of all){const x=i%W,y=(i/W)|0;
    for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const a=x+dx,b=y+dy;if(a>=0&&b>=0&&a<W&&b<H)p[idx(a,b)]=1;}}return p;};
  // chemin le moins cher de src jusqu'à une case « but » ; un bruit renchérit certaines cases, ce qui fait serpenter le boyau
  const chemin=(src,but,passe)=>{const n=noise(3),dist=new Float64Array(N).fill(Infinity),prev=new Int32Array(N).fill(-1),hp=heap();dist[src]=0;hp.push(src,0);
    while(hp.size){const [d,c]=hp.pop();if(d>dist[c])continue;
      if(c!==src&&but(c)){const p=[];for(let k=c;k>=0;k=prev[k])p.push(k);return p.reverse();}
      const x=c%W,y=(c/W)|0;
      for(const [dx,dy] of D4){const j=idx(x+dx,y+dy);if(!but(j)&&!passe(j))continue;const nd=d+1+n(x+dx,y+dy)*10+Math.random()*3;if(nd<dist[j]){dist[j]=nd;prev[j]=c;hp.push(j,nd);}}}
    return null;};
  const ouvre=j=>{if(t[j]===MOUNT)t[j]=GROUND;if(!tun[j]&&ZONE[j]){tun[j]=1;all.push(j);}};
  // creuse le chemin, et l'élargit par endroits d'une case
  const creuse=p=>{for(const c of p){ouvre(c);
    if(Math.random()<.4){const [dx,dy]=D4[rnd(0,3)],j=idx(c%W+dx,((c/W)|0)+dy);if(libre(j)&&dE[j]>=2)ouvre(j);}}};
  let principal=null;
  for(const S of strs)for(const e of S.entrees){
    const p=chemin(e.o,j=>dehors(j)||tun[j]===1,libre);if(!p)continue;
    creuse(p);if(!principal)principal=p;}
  if(!principal){G.tun={};return false;}
  // embranchement : une seconde sortie, loin de la première
  if(principal.length>=14){const a=principal[Math.floor(principal.length*(.35+Math.random()*.3))],m=principal[principal.length-1],pr=proche(2);
    const p=chemin(a,j=>dehors(j)&&ecart(j,m)>=12,j=>libre(j)&&(!pr[j]||ecart(j,a)<=3));
    if(p&&p.length<=principal.length*2+16)creuse(p);}
  // culs-de-sac : un boyau de 6 à 11 cases qui finit sur une petite poche
  let reste=1+(Math.random()<.6?1:0);
  for(let k=0;k<40&&reste>0;k++){const a=all[rnd(0,all.length-1)];if(pres[a]||dE[a]<4)continue;const pr=proche(1),pr3=proche(3);
    const p=chemin(a,j=>libre(j)&&dE[j]>=4&&!pr3[j]&&ecart(j,a)>=6&&ecart(j,a)<=11,j=>libre(j)&&dE[j]>=3&&(!pr[j]||ecart(j,a)<=1.5));
    if(!p||p.length>22)continue;
    creuse(p);const f=p[p.length-1],fx=f%W,fy=(f/W)|0;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const j=idx(fx+dx,fy+dy);if(libre(j)&&dE[j]>=3&&Math.random()<.75)ouvre(j);}
    reste--;}
  G.tun={};for(const i of all)G.tun[i]=1;   // les cases de tunnel, pour la faune par lieu (étape suivante)
  return true;}
