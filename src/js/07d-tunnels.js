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
  const ouvre=j=>{if(all.length>=400)return;if(t[j]===MOUNT)t[j]=GROUND;if(!tun[j]&&ZONE[j]){tun[j]=1;all.push(j);}};
  // creuse le chemin, et l'élargit par endroits d'une case
  const creuse=p=>{for(const c of p){ouvre(c);
    if(Math.random()<.4){const [dx,dy]=D4[rnd(0,3)],j=idx(c%W+dx,((c/W)|0)+dy);if(libre(j)&&dE[j]>=3)ouvre(j);}}};
  // Le boyau principal : la sortie est choisie LOIN de la porte (20 novembre 2026, demande de l'utilisateur : le complexe ne doit pas
  // être facile d'accès). On tire une case de la lisière à 30 cases au moins de la porte (puis 24, 18, 12 si le massif est petit),
  // et le boyau reste à 3 cases au moins de l'extérieur jusqu'à ses dernières cases : il ne peut pas déboucher plus tôt.
  const lis=[];for(let i=0;i<N;i++){if(!dehors(i))continue;const x=i%W,y=(i/W)|0;if(D4.some(([dx,dy])=>{const j=idx(x+dx,y+dy);return ZONE[j]&&libre(j);}))lis.push(i);}
  const vers=(a,m)=>chemin(a,j=>j===m,j=>libre(j)&&(dE[j]>=3||ecart(j,m)<=3));
  let principal=null;
  for(const S of strs)for(const e of S.entrees){let p=null;
    if(!principal){for(const R of [30,24,18,12].map(v=>Math.max(6,Math.round(v*F)))){const c=lis.filter(i=>ecart(i,e.o)>=R);
      for(let k=0;k<6&&c.length&&!p;k++){const q=vers(e.o,c[rnd(0,c.length-1)]);if(q&&q.length>=R*1.2)p=q;}
      if(p)break;}
      if(!p)p=chemin(e.o,dehors,libre);}   // à défaut : la sortie la plus proche
    else p=chemin(e.o,j=>tun[j]===1,j=>libre(j)&&dE[j]>=3);   // une porte de plus rejoint le réseau, jamais l'extérieur directement
    if(!p)continue;
    creuse(p);if(!principal)principal=p;}
  if(!principal){G.tun={};return false;}
  // embranchement : une seconde sortie, loin de la première et prise dans la moitié du boyau la plus éloignée de la porte
  if(principal.length>=14){const a=principal[Math.floor(principal.length*(.55+Math.random()*.3))],m=principal[principal.length-1],d0=principal[0],pr=proche(2);
    const c=lis.filter(i=>ecart(i,m)>=12&&ecart(i,d0)>=20);
    for(let k=0;k<6&&c.length;k++){const m2=c[rnd(0,c.length-1)],p=chemin(a,j=>j===m2,j=>libre(j)&&(dE[j]>=3||ecart(j,m2)<=3)&&(!pr[j]||ecart(j,a)<=3));
      if(p&&p.length<=principal.length*2+16){creuse(p);break;}}}
  // Le réseau grandit jusqu'à une taille tirée entre 160 et 330 cases (jamais plus de 400). D'abord 3 à 5 salles irrégulières
  // (automate cellulaire), chacune au bout d'un boyau, là où le massif est assez épais ; puis des boyaux de 6 à 16 cases qui
  // finissent en cul-de-sac sur une petite poche. Un boyau ne longe jamais un autre tunnel à moins de 3 cases.
  const aire=Math.min(1,N/6144),cible=Math.round(rnd(160,330)*aire),nSalles=Math.max(1,Math.round(rnd(3,5)*aire));   // tailles données pour une carte de 96 × 64, réduites en proportion sur les plus petites
  const pousse=(dmin,dmax,prof,sep)=>{const a=all[rnd(0,all.length-1)];if(pres[a]||dE[a]<4)return -1;const pr=proche(2),ps=proche(sep);
    const p=chemin(a,j=>libre(j)&&dE[j]>=prof&&!ps[j]&&ecart(j,a)>=dmin&&ecart(j,a)<=dmax,j=>libre(j)&&dE[j]>=3&&(!pr[j]||ecart(j,a)<=2.5));
    if(!p||p.length>dmax*1.6+8)return -1;creuse(p);return p[p.length-1];};
  for(let k=0,fait=0;k<70&&fait<nSalles&&all.length<cible;k++){const f=pousse(7,60,k<30?9:5,5);if(f<0)continue;   // d'abord au cœur du massif, puis là où il reste de la place
    const fx=f%W,fy=(f/W)|0,w=rnd(10,16),h=rnd(7,11),cells=caBlob(w,h,.62,4);let mx=0,my=0;for(const [x,y] of cells){mx+=x;my+=y;}
    mx=Math.round(mx/Math.max(1,cells.length));my=Math.round(my/Math.max(1,cells.length));   // la salle est centrée sur le bout du boyau
    for(const [x,y] of cells){const cx=fx+x-mx,cy=fy+y-my;if(cx<2||cy<2||cx>=W-2||cy>=H-2)continue;const j=idx(cx,cy);if(libre(j)&&dE[j]>=3&&all.length<395)ouvre(j);}
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const j=idx(fx+dx,fy+dy);if(libre(j)&&dE[j]>=3)ouvre(j);}   // le boyau débouche toujours dans la salle
    fait++;}
  for(let k=0;k<120&&all.length<cible;k++){const f=pousse(6,16,4,4);if(f<0)continue;const fx=f%W,fy=(f/W)|0;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const j=idx(fx+dx,fy+dy);if(libre(j)&&dE[j]>=3&&Math.random()<.75)ouvre(j);}}
  // une salle creusée à part du boyau ne doit pas rester isolée : tout ce qui n'est pas relié à la porte par les tunnels est rebouché
  {const vu=new Uint8Array(N),q=[principal[0]];vu[q[0]]=1;
    for(let k=0;k<q.length;k++){const c=q[k],x=c%W,y=(c/W)|0;for(const [dx,dy] of D4){const j=idx(x+dx,y+dy);if(!vu[j]&&(tun[j]||j===principal[0])){vu[j]=1;q.push(j);}}}
    for(let k=all.length-1;k>=0;k--){const i=all[k];if(!vu[i]){t[i]=MOUNT;tun[i]=0;all.splice(k,1);}}}
  G.tun={};for(const i of all)G.tun[i]=1;   // les cases de tunnel, pour la faune par lieu (étape suivante)
  G.tunN=all.length;return all.length>=100*aire;}   // moins de 100 cases : le massif était trop étroit, on recommence
