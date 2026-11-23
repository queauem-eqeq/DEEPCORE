/* Empreinte du jeu : avec un hasard fixé, génère les trois recettes, joue 250 battements d'actions tirées au sort
   et résume l'état en une ligne par niveau. Deux versions du code qui se comportent pareil donnent les mêmes lignes :
   c'est le contrôle à passer avant et après un nettoyage qui ne doit rien changer au jeu (23 novembre 2026). */
(() => {
  const vrai=Math.random,raf=window.requestAnimationFrame,sauve=JSON.parse(JSON.stringify(GEN));window.requestAnimationFrame=()=>0;
  const graine=s=>{let a=s>>>0;Math.random=()=>{a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296;};};
  const h=s=>{let x=2166136261;for(let i=0;i<s.length;i++){x^=s.charCodeAt(i);x=Math.imul(x,16777619);}return (x>>>0).toString(16);};
  const out=[];
  for(const [rec,g] of [['atterrissage',11],['cavernes',22],['base',33],['classique',44]]){
    graine(g);recRange();recPrend(rec);GEN.taille=3;GEN.hasard=true;hasardReglages();newGame();
    const carte=h(Array.from(G.t).join(','));const faune=h(JSON.stringify(G.beasts.map(b=>[b.k||b.key||b.sp,b.x,b.y,b.pv]))+JSON.stringify(G.animals.map(b=>[b.x,b.y])));
    const objets=h(JSON.stringify(G.objs||G.items||G.sol||0));
    G.st.vie=G.st.vieMax=100000;let n=0;
    for(let i=0;i<250&&!G.over;i++){const r=rnd(0,9);if(r<2)waitTurn();else{const d=DIRS[rnd(0,7)];tryMove(d[0],d[1]);}n++;}
    const fin=h(JSON.stringify([G.px,G.py,Math.round(G.st.vie),Math.round(G.st.energie),G.beasts.map(b=>[b.x,b.y,b.pv,b.mode||b.etat||0])]));
    out.push(`${rec} · ${G.amb||''} · carte ${carte} · faune ${faune} (${G.beasts.length}+${G.animals.length}) · objets ${objets} · après ${n} actions ${fin} vie ${Math.round(G.st.vie)}`);
    $('overlay').hidden=true;}
  Math.random=vrai;window.requestAnimationFrame=raf;genRemet(sauve);GEN.hasard=sauve.hasard;return out.join('\n');
})()
