/* ---------- Niveau 4 : la station noyée (recette « inonde », 23 novembre 2026) ----------
   Même carte que les cavernes (07e), puis l'eau monte : le sol des cavernes devient hauts-fonds près des parois et eau profonde
   au large ; il ne reste au sec que des îlots, les abords des portes, le site de forage et les bâtiments.
   Signature : dans l'eau la foreuse est lente (× 1,5, × 2 au large où le courant l'emporte) alors que torpilles et crabots y nagent ;
   on avance d'îlot en îlot, par les berges et par les bâtiments. Les herbes hautes des berges restent (roseaux : un abri).
   Réglages : GEN.inIles (% des cavernes gardé au sec) et GEN.inProf (largeur des hauts-fonds avant l'eau profonde). */
function inondeFinir(){const t=G.t,N=W*H,sol=v=>v===GROUND||v===GRASS||v===FLAT||v===LIQ||v===DEEP,d=new Int16Array(N).fill(-1),q=[];
  // distance de chaque case de sol à la première case qui n'en est pas (paroi, mur, rocher…)
  for(let i=0;i<N;i++)if(!sol(t[i])){d[i]=0;q.push(i);}
  for(let k=0;k<q.length;k++){const c=q[k],x=c%W,y=(c/W)|0;for(let n=0;n<4;n++){const a=x+DIRS[n][0],b=y+DIRS[n][1];if(a<0||b<0||a>=W||b>=H)continue;const j=idx(a,b);if(d[j]<0){d[j]=d[c]+1;q.push(j);}}}
  // cases gardées au sec : autour de la foreuse, du site, des portes, des machines et des artefacts ; puis les îlots
  const sec=new Uint8Array(N),garde=(x,y,r)=>{for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const a=x+dx,b=y+dy;if(a>0&&b>0&&a<W-1&&b<H-1&&Math.hypot(dx,dy)<=r+.3)sec[idx(a,b)]=1;}};
  garde(G.px,G.py,3);for(const s of G.sites||[])garde(s.x,s.y,2);
  for(let i=0;i<N;i++){const v=t[i];if(v===DOOR||v===LOCK||v===SECRET||(G.art&&G.art[i]!=null)||(G.cles&&G.cles[i]))garde(i%W,(i/W)|0,1);}
  const libres=[];for(let i=0;i<N;i++)if(sol(t[i]))libres.push(i);
  const part=Math.max(.03,Math.min(.7,autour('inIles',.2)/100)),prof=Math.max(1,Math.round(GEN.inProf||3));let reste=Math.round(libres.length*part),garde0=0;
  while(reste>0&&garde0++<400&&libres.length){const c=libres[rnd(0,libres.length-1)],r=rnd(1,3)+(Math.random()<.25?1:0);let n=0;
    for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const a=c%W+dx,b=((c/W)|0)+dy;if(a<1||b<1||a>=W-1||b>=H-1)continue;const j=idx(a,b);
      if(sol(t[j])&&!sec[j]&&Math.hypot(dx,dy)<=r+(Math.random()-.5)){sec[j]=1;n++;}}
    reste-=n;}
  let eau=0,fond=0,ile=0;
  for(let i=0;i<N;i++){if(!sol(t[i]))continue;
    if(sec[i]){if(t[i]===LIQ||t[i]===DEEP)t[i]=GROUND;ile++;continue;}
    if(t[i]===GRASS&&d[i]<=1)continue;   // roseaux des berges
    if(d[i]>prof){t[i]=DEEP;fond++;}else{t[i]=LIQ;eau++;}}
  G.inonde={eau,fond,ile};}
