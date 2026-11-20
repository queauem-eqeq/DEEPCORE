(() => {
  const out={};
  const serie=(nom,regl,tailles)=>{for(const ta of tailles){Object.assign(GEN,regl);GEN.taille=ta;let cx=0,tn=0,tmin=1e9,tmax=0,ext=0,bat=0,so=0,err=0;const n=40;
    for(let k=0;k<n;k++){try{newGame();}catch(e){err++;continue;}
      const N=W*H;let e=0,f=0;for(let i=0;i<N;i++){if(ZONE&&!ZONE[i])e++;if(G.t[i]===FLOOR)f++;}
      if(G.batis.length)cx++;const t=G.tunN||0;tn+=t;tmin=Math.min(tmin,t);tmax=Math.max(tmax,t);ext+=e/N;bat+=f;so+=G.tunS||0;}
    out[nom+' t'+ta]=`complexes ${cx}/${n} · tunnels ${Math.round(tn/n)} (${tmin}-${tmax}) · sorties ${(so/n).toFixed(1)} · ext ${Math.round(ext/n*100)}% · sol bâti ${Math.round(bat/n)} · err ${err}`;}};
  const d={recette:'atterrissage',zExt:60,zComplexe:45,zTunnels:245,zSalles:4,zSorties:2,zPorte:30};
  
  serie('défaut',d,[2,3,4]);
  serie('mini',{...d,zExt:80,zComplexe:10,zTunnels:100,zSalles:0,zSorties:1,zPorte:10},[2,4]);
  
  serie('maxi',{...d,zExt:35,zComplexe:70,zTunnels:400,zSalles:8,zSorties:3,zPorte:45},[2,4]);
  recRange();recPrend('classique');ZONE=null;G.tunN=0;G.tunS=0;
  
  serie('classique',{},[2,4]);
  return JSON.stringify(out,null,1);
})()
