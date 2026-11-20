/* Mesure de la génération, recette par recette : 40 cartes par ligne.
   python3 outils/jeu.py DOSSIER outils/scripts/mesure-recettes.js
   Chaque ligne donne : complexes trouvés, cases de tunnel (moyenne et minimum), sorties du réseau, part d'extérieur,
   vaisseau posé hors du massif et loin de lui, nombre de cartes retirées avant d'en garder une, erreurs. */
(() => {
  const out={},d={recette:'atterrissage',zExt:60,zComplexe:45,zTunnels:245,zSalles:4,zSorties:2,zPorte:30,zForme:''};
  const serie=(nom,regl,tailles)=>{for(const ta of tailles){Object.assign(GEN,d,regl);GEN.taille=ta;
    let cx=0,tn=0,tmin=1e9,so=0,ext=0,dehors=0,loin=0,retir=0,err=0;const n=40;
    for(let k=0;k<n;k++){try{newGame();}catch(e){err++;continue;}
      const N=W*H;let e=0;for(let i=0;i<N;i++)if(ZONE&&!ZONE[i])e++;
      if(G.batis.length)cx++;const t=G.tunN||0;tn+=t;tmin=Math.min(tmin,t);so+=G.tunS||0;ext+=e/N;retir+=ZESSAI;
      const p=idx(G.px,G.py);if(!ZONE||!ZONE[p])dehors++;
      if(!ZINFO||ZINFO.f(G.px,G.py)>ZINFO.cut+(1-ZINFO.cut)*.3)loin++;}
    out[nom+' t'+ta]=`complexes ${cx}/${n} · tunnels ${Math.round(tn/n)} (min ${tmin}) · sorties ${(so/n).toFixed(1)} · ext ${Math.round(ext/n*100)}% · vaisseau dehors ${dehors}/${n}, loin ${loin}/${n} · retirées ${(retir/n).toFixed(1)} · err ${err}`;}};
  serie('défaut',{},[2,3,4]);
  serie('mini',{zExt:80,zComplexe:10,zTunnels:100,zSalles:0,zSorties:1,zPorte:10},[2,4]);
  serie('maxi',{zExt:35,zComplexe:70,zTunnels:400,zSalles:8,zSorties:3,zPorte:45},[2,4]);
  serie('un côté',{zForme:'cote'},[2,3,4]);
  serie('un coin',{zForme:'coin'},[2,3,4]);
  recRange();recPrend('classique');ZONE=null;ZINFO=null;G.tunN=0;G.tunS=0;
  serie('classique',{recette:'classique'},[2,4]);
  return JSON.stringify(out,null,1);
})()
