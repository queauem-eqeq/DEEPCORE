/* Coût du calcul de jeu seul (26 novembre 2026), sans le dessin : 1000 pas par recette, hasard fixé, foreuse rendue
   invincible ; donne moyenne, p95, p99, pire cas et ce qui coûte dans les pas les plus lents.
   Usage : python3 outils/jeu.py DOSSIER outils/scripts/mesure-logique.js */
(() => {
  const NOMS=['creatureJoue','beastsAct','animalsAct','chaseStep','robotDistAvoid','distFrom','patBfs','etend','los','computeFOV','battement','prochaineCreature','antDetecte','machTick'];
  let cur=null;const pile=[];
  for(const n of NOMS){if(typeof window[n]!=='function')continue;const f=window[n];
    window[n]=function(){const a=performance.now();pile.push(n);try{return f.apply(this,arguments);}finally{pile.pop();if(cur&&!pile.includes(n)){cur[n]=(cur[n]||0)+performance.now()-a;cur['n_'+n]=(cur['n_'+n]||0)+1;}}};}
  let a=11;Math.random=()=>{a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296;};
  window.requestAnimationFrame=()=>0;window.render=()=>{};window.side=()=>{};
  const out=[];
  for(const rec of ['classique','cavernes','atterrissage']){
    recRange();recPrend(rec);GEN.taille=3;GEN.hasard=true;hasardReglages();newGame();fog=false;G.over=false;
    const T=[];const D=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]];
    for(let i=0;i<1000&&!G.over;i++){
      
      let d=D[Math.floor(Math.random()*8)];
      cur={};const t0=performance.now();try{tryMove(d[0],d[1]);}catch(e){cur.err=String(e).slice(0,60);}
      cur.total=performance.now()-t0;cur.ennemis=G.beasts.length;T.push(cur);cur=null;FX.length=0;G.vie=G.st.vieMax;if(G.st)G.st.vie=G.st.vieMax;}
    const f=x=>x.toFixed(1),tot=T.reduce((s,t)=>s+t.total,0),srt=[...T].sort((x,y)=>y.total-x.total);
    const p=q=>srt[Math.floor((1-q)*srt.length)].total;
    out.push(`${rec} : ${T.length} actions · moy ${f(tot/T.length)} ms · p95 ${f(p(.95))} · p99 ${f(p(.99))} · max ${f(srt[0].total)} · ennemis ${G.beasts.length} · fin ${G.over?'partie perdue':'ok'}`);
    for(const t of srt.slice(0,3))out.push(`   ${f(t.total)} ms : `+Object.entries(t).filter(([k])=>NOMS.includes(k)).sort((x,y)=>y[1]-x[1]).slice(0,4).map(([k,x])=>`${k} ${f(x)} (×${t['n_'+k]})`).join(' · ')+(t.err?' ERR '+t.err:''));
  }
  return '\n'+out.join('\n');
})()
