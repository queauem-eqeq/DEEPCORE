/* Économie d'un niveau : K cartes par recette (window.ME = {k}). Ce que la carte coûte (groupes, créatures, vie perdue attendue si
   l'on affronte tout : coût de menace × 4, la règle de valeur du banc) contre ce qu'elle rend (éclats de métal, capsules au sol). */
(() => {
  const ME=window.ME||{},K=ME.k||20,out=[],sauve=JSON.parse(JSON.stringify(GEN));
  for(const n of NIVS){const rec=RECETTE_NIV(n);let gr=0,be=0,dep=0,metal=0,pv=0,libre=0;const it={};
    for(let k=0;k<K;k++){recRange();recPrend(rec);GEN.taille=3;GEN.hasard=true;hasardReglages();SANS_VAISSEAU=n>1;NIV_GEN=n;niveau();SANS_VAISSEAU=false;
      const m=G.menace;dep+=m.total-m.reste;for(const g in m.pose)gr+=m.pose[g];be+=G.beasts.length+G.animals.length;
      for(const i in G.ore){const v=G.ore[i];if(!oreMat(v)){metal++;pv+=ORE_PV[oreLv(v)];}}
      for(const i in G.items)for(const o of G.items[i])it[o]=(it[o]||0)+1;
      for(let i=0;i<W*H;i++)if(canWalk(G.t[i],true))libre++;genRemet(sauve);}
    const f=v=>(v/K).toFixed(1);
    out.push(`niveau ${n} (${rec}) : ${f(gr)} groupes · ${f(be)} créatures · menace dépensée ${f(dep)} → vie perdue attendue si tout est affronté ≈ ${Math.round(dep/K*4)} · ${f(libre)} cases libres (${(be*100/libre).toFixed(1)} créatures pour 100 cases)`);
    out.push(`   soins : ${f(metal)} gisements de métal = ${f(pv)} PV · objets au sol : `+Object.entries(it).sort((a,b)=>b[1]-a[1]).map(([a,b])=>a+' '+f(b)).join(' · '));}
  GEN.hasard=sauve.hasard;return out.join('\n');
})()
