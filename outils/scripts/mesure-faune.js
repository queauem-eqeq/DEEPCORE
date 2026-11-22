/* Peuplement : K cartes par recette (window.MF = {k, taille}), ambiances tirées au hasard comme en jeu.
   Pour chaque recette : groupes et créatures par carte, répartition par lieu (créatures et budget), espèces, groupes les plus posés. */
(() => {
  const MF=window.MF||{},K=MF.k||20,out=[],NIV={atterrissage:1,cavernes:2,base:3},sauve=JSON.parse(JSON.stringify(GEN));
  for(const rec of ['atterrissage','cavernes','base']){let gr=0,be=0,dep=0,tot=0;const L={ext:0,bati:0,tunnel:0},S={ext:0,bati:0,tunnel:0},B={ext:0,bati:0,tunnel:0},esp={},grp={};
    for(let k=0;k<K;k++){recRange();recPrend(rec);GEN.taille=MF.taille||3;const a=Object.keys(AMBIANCES[rec]);ambiance(a[k%a.length],rec);SANS_VAISSEAU=NIV[rec]>1;NIV_GEN=NIV[rec];niveau();SANS_VAISSEAU=false;
      const m=G.menace;dep+=m.total-m.reste;tot+=m.total;for(const n in m.pose){gr+=m.pose[n];grp[n]=(grp[n]||0)+m.pose[n];}
      for(const o of G.beasts){be++;L[lieuDe(idx(o.x,o.y))]++;esp[BEASTS[o.sp].n]=(esp[BEASTS[o.sp].n]||0)+1;}for(const o of G.animals){be++;L[lieuDe(idx(o.x,o.y))]++;esp.Puce=(esp.Puce||0)+1;}
      for(let i=0;i<W*H;i++)if(canWalk(G.t[i],true))S[lieuDe(i)]++;for(const l in m.lieux)B[l]+=m.lieux[l].dep;genRemet(sauve);}
    const f=v=>(v/K).toFixed(1);
    out.push(`== ${rec} (niveau ${NIV[rec]}) : budget ${f(tot)}, dépensé ${f(dep)} · ${f(gr)} groupes · ${f(be)} créatures par carte`);
    out.push('   par lieu : '+Object.keys(L).map(l=>`${l} ${f(L[l])} créatures sur ${f(S[l])} cases (${S[l]?(L[l]*100/S[l]).toFixed(1):'0'} pour 100 cases, budget ${f(B[l])})`).join(' · '));
    out.push('   espèces : '+Object.entries(esp).sort((a,b)=>b[1]-a[1]).map(([n,v])=>n+' '+f(v)).join(' · '));
    out.push('   groupes : '+Object.entries(grp).sort((a,b)=>b[1]-a[1]).map(([n,v])=>n+' '+f(v)).join(' · '));}
  return out.join('\n');
})()
