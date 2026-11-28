/* Terminaux et antennes (28 novembre 2026) : le menu DATA / CONNEXION / ENCODAGE. window.TT = {k} : cartes par recette.
   1. Génération : au moins 2 terminaux complets par carte, dans chaque recette ; au niveau 1, un terminal au moins a une action locale.
   2. Menu : terminal (trois entrées), boîte noire (DATA + liaison), antenne (pas d'ENCODAGE) ; fenêtre jamais plus haute que l'écran.
   3. Chaque action CONNEXION agit vraiment sur la carte (porte, lasers, grille, porte dérobée, cloison), une seule fois.
   4. Antenne : RÉSEAU DU SITE allume l'antenne comme avant ; ancienne partie (antenne allumée, sans G.term) relue sans erreur.
   5. Clavier, encodage indisponible, liaison numérotée, exploration automatique jamais bloquée par un terminal.
   Une ligne par essai : « ok » ou « ÉCHEC ». */
(() => {
  const K=(window.TT||{}).k||6,out=[],sauve=JSON.parse(JSON.stringify(GEN)),raf=window.requestAnimationFrame;window.requestAnimationFrame=()=>0;
  const ok=(b,t)=>out.push(`${b?'ok':'ÉCHEC'} : ${t}`);
  const carte=rec=>{recRange();recPrend(rec);hasardReglages();enJeu(newGame,NIV_RECETTE(rec));};
  const terms=()=>Object.values(G.term||{}).filter(m=>m.s==='terminal');
  const pieces=()=>BATI_DER?BATI_DER.strs.flatMap(S=>S.pieces).filter(p=>p.g!=='couloir'&&p.c.length>=9):[];
  const vu={};   // une carte où chaque sorte d'action existe, gardée pour la suite : [recette, G, BATI_DER]
  // 1. génération
  for(const rec of ['atterrissage','cavernes','base','classique']){let min=99,loc=0,tot=0,nact={};
    for(let k=0;k<K;k++){carte(rec);const T=terms();min=Math.min(min,T.length);tot+=T.length;if(T.some(m=>m.act.length))loc++;
      for(const m of T)for(const a of m.act){nact[a.t]=(nact[a.t]||0)+1;if(!vu[a.t])vu[a.t]=[rec,G,BATI_DER];}
      if(G.t.some((v,i)=>v===TERMINAL&&!termEtat(i)))min=-1;}
    ok(min>=2,`${rec} : ${(tot/K).toFixed(1)} terminaux complets par carte, ${min} au moins ; actions ${JSON.stringify(nact)}`);
    if(rec==='atterrissage')ok(loc===K,`niveau 1 : un terminal avec une action locale sur ${loc}/${K} cartes`);}
  // repli de la génération : toutes les salles encombrées d'objets, plus aucun terminal → la génération en pose quand même deux
  {carte('atterrissage');for(const k in G.art){const i=+k;if(G.t[i]===TERMINAL&&termSorte(i)==='terminal'){G.t[i]=FLOOR;delete G.art[k];}}
    for(const p of BATI_DER.strs.flatMap(S=>S.pieces))for(const i of p.c)if(G.t[i]===FLOOR&&!(G.items[i]&&G.items[i].length))G.items[i]=['matiere'];
    const n0=Object.values(G.items).flat().length;terminauxFin();const T=terms(),red=T.flatMap(m=>m.act.filter(a=>a.t==='cloison').flatMap(a=>a.sol)),
      n1=Object.values(G.items).flat().length-red.reduce((s,j)=>s+((G.items[j]||[]).length),0);   // le butin d'un réduit creusé à l'occasion ne compte pas
    ok(T.length>=2&&n1===n0&&T.some(m=>m.act.length),`repli : salles encombrées, ${T.length} terminaux posés quand même, objets déplacés (${n0} → ${n1}), action locale ${T.some(m=>m.act.length)?'oui':'non'}`);}
  // dernier repli (bloc E, 28 novembre 2026) : la graine 164 donnait une salle close de toutes parts, sans réduit ni porte dérobée ;
  // termNiche creuse alors le réduit depuis n'importe quelle case praticable proche. Contrôle : action locale, réduit clos, butin dedans.
  {const vrai=Math.random;let a=164;Math.random=()=>{a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296;};
    carte('atterrissage');Math.random=vrai;const T=terms();ok(T.some(m=>m.act.length),`graine 164 (salle close) : action locale ${T.some(m=>m.act.length)?'oui':'non'}`);
    const m=T[0];m.act=[];const r=termNiche(m,BATI_DER&&BATI_DER.B,TERM_R),a2=m.act[0];
    const clos=a2&&a2.t==='cloison'&&a2.sol.every(j=>D4.every(([dx,dy])=>{const q=idx(j%W+dx,((j/W)|0)+dy);return a2.sol.includes(q)||q===a2.c||!canWalk(G.t[q],true);}));
    ok(r&&clos&&termDispo(a2)&&a2.sol.some(j=>(G.items[j]||[]).length),`dernier repli : réduit ${a2?a2.sol.length:0} cases creusé, clos ${clos?'oui':'non'}, butin dedans`);}
  const reprend=t=>{const v=vu[t];if(!v)return false;G=v[1];BATI_DER=v[2];W=G.w;H=G.h;computeFOV();render();return true;};
  const ferme=()=>{if(!$('terminal').hidden)closeTerminal();};
  const lignes=()=>[...$('termMenu').querySelectorAll('.tsec')].map(s=>s.querySelector('h3').textContent+':'+[...s.querySelectorAll('.tl')].map(b=>(b.disabled?'-':'')+b.dataset.a).join(','));
  const lance=id=>{const b=$('termMenu').querySelector(`.tl[data-a="${id}"]`);if(!b)return false;b.click();return true;};
  // 2. menu du terminal
  {carte('atterrissage');const m=terms()[0];termOuvre(m.i);const r=$('terminal').querySelector('.mcard').getBoundingClientRect(),L=lignes();
    ok(!$('terminal').hidden&&r.height>100&&r.height<=innerHeight,`terminal : fenêtre ouverte, ${Math.round(r.height)} px de haut (écran ${innerHeight})`);
    ok(L.length===3&&/^DATA/.test(L[0])&&/^CONNEXION/.test(L[1])&&/^ENCODAGE:hack,bp$/.test(L[2])&&L[1].includes('liaison'),`terminal : ${L.join(' | ')}`);
    // clavier : flèche bas, puis Entrée lance la ligne choisie ; Échap ferme
    const k=key=>dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true}));
    const b0=$('terminal').querySelector('.tl.sel');k('ArrowDown');const b1=$('terminal').querySelector('.tl.sel');
    ok(b0&&b1&&b0!==b1,'clavier : la flèche déplace la sélection');
    k('ArrowUp');k('Enter');ok(m.data===1&&m.lu&&m.lu.titre&&$('termOut').textContent.includes(m.lu.titre),`DATA : « ${m.lu&&m.lu.titre} » lue, {type:${m.lu&&m.lu.type}}`);
    ok(!lance('data')&&/RIEN À LIRE/.test($('termMenu').textContent),'DATA : une seule fois, puis « RIEN À LIRE »');
    const n0=G.st.liaisons||0;lance('liaison');
    ok(m.liaison===n0+1&&G.st.liaisons===n0+1&&/TENTATIVE/.test($('termOut').textContent)&&!lance('liaison'),`liaison : tentative ${m.liaison}, une seule par machine`);
    lance('hack');ok(m.hack===0&&$('termOut').querySelectorAll('.hkc').length===3,'ENCODAGE → HACK : trois cartes (étape 4, détail dans test-hacks.js)');
    lance('bp');ok(m.bp===0&&$('termOut').querySelectorAll('.bpc').length===3,'ENCODAGE → BLUEPRINT : trois cartes (étape 5, détail dans test-blueprints.js)');
    k('Escape');ok($('terminal').hidden,'Échap ferme la fenêtre');
    termOuvre(m.i);ok(lignes()[0]==='DATA:-undefined','rouvert : la DATA reste lue');ferme();}
  // boîte noire
  {let bx=null;for(let k=0;k<6&&!bx;k++){carte('atterrissage');bx=Object.values(G.term).find(m=>m.s==='boite_noire');}
    if(bx){termOuvre(bx.i);const L=lignes();ok(L.length===2&&L[1]==='CONNEXION:liaison'&&/ENREGISTREUR/.test($('termTitre').textContent),`boîte noire : ${L.join(' | ')} — ${$('termTitre').textContent}`);
      lance('data');ok(bx.lu&&bx.lu.type==='boite_noire'&&/ENREGISTREUR/.test($('termOut').textContent),'boîte noire : DATA = un texte d’enregistreur (détail dans test-journal.js)');ferme();}
    else ok(false,'boîte noire : aucune en 6 cartes');}
  // 4. antenne : posée à la main dans une pièce
  {carte('atterrissage');const p=pieces().find(p=>p.c.some(i=>G.t[i]===FLOOR)),i=p.c.find(i=>G.t[i]===FLOOR&&!G.items[i]);
    G.t[i]=ANTENNA;G.art[i]=0;delete G.term[i];termOuvre(i);const L=lignes();
    ok(L.length===2&&L[1]==='CONNEXION:reseau,liaison',`antenne : ${L.join(' | ')} (pas d’ENCODAGE)`);
    const t0=G.turn;lance('reseau');ferme();
    ok(G.art[i]===1&&G.antFin[i]===t0+1+ANT_TOURS&&G.turn===t0+1,`antenne : RÉSEAU DU SITE l’allume (${ANT_TOURS} tours de brouillard levé), un battement compté à la fermeture`);
    termOuvre(i);ok(/EN SERVICE/.test($('termMenu').textContent)&&!lance('reseau'),'antenne : une seule fois');lance('data');
    ok(G.term[i].lu&&['releve','robot'].includes(G.term[i].lu.type),`antenne : DATA = relevé du site ou palier de robot (${G.term[i].lu&&G.term[i].lu.type})`);ferme();
    // ancienne partie : antenne déjà allumée, terminal déjà là, pas de G.term
    G.art[i]=2;delete G.term;let err=null;try{termOuvre(i);ferme();termOuvre(Object.keys(G.art).map(Number).find(j=>G.t[j]===TERMINAL));ferme();termOuvre(i);}catch(e){err=e;}
    ferme();ok(!err&&G.term&&G.term[i].s==='antenne'&&/EN SERVICE/.test($('termMenu').textContent),`ancienne partie relue sans erreur${err?' : '+err:''}`);}
  // 3. actions CONNEXION
  // grille : rare sur les cartes tirées (une porte à clé passe avant) ; cas construit à la main, toujours le même : une grille et
  // son socle dans la salle d'un terminal, confiés à ce terminal (28 novembre 2026 : l'essai dépendait du hasard)
  {carte('atterrissage');const m=terms()[0],p=pieces().find(p=>p.c.includes(m.i)),l=p.c.filter(i=>G.t[i]===FLOOR&&i!==m.i&&!(G.items[i]&&G.items[i].length));
    const j=l[0],s0=l[l.length-1],n=(G.circ=G.circ||[]).length;G.soc=G.soc||{};G.t[j]=GRILLE;G.soc[s0]=n;
    G.circ.push({k:'socle',c:s0,on:0,perm:0,cib:[{t:'grille',c:[j],sous:[FLOOR]}]});m.act.push({t:'grille',k:n,fait:0});
    vu.grille=['atterrissage',G,BATI_DER];}
  const action=(t,verifie)=>{if(!reprend(t)){ok(false,`${t} : aucune carte ne l’a proposée`);return;}
    const m=terms().find(m=>m.act.some(a=>a.t===t&&!a.fait&&termDispo(a)));if(!m){ok(false,`${t} : déjà utilisée`);return;}
    const n=m.act.findIndex(a=>a.t===t),a=m.act[n],avant=verifie(a,true);termOuvre(m.i);
    const r=lance('act'+n),apres=verifie(a,false);ferme();termOuvre(m.i);const encore=lance('act'+n);ferme();
    ok(r&&avant&&apres&&a.fait&&!encore,`CONNEXION → ${TERM_ACT[t][0]} : ${TERM_ACT[t][1]} sur la carte, une seule fois`);};
  action('porte',(a,av)=>G.t[a.c]===(av?LOCK:DOOR));
  action('secret',(a,av)=>G.t[a.c]===(av?SECRET:DOOR));
  action('lasers',(a,av)=>{const l=G.las.filter(l=>l.g===a.g);if(av)return l.some(l=>!l.cut);
    return l.every(l=>l.cut)&&!l.some(l=>machTire(l));});
  action('grille',(a,av)=>{const c=G.circ[a.k],gc=c.cib.flatMap(k=>k.t==='grille'?k.c:[]);if(av)return gc.some(j=>G.t[j]===GRILLE);
    socMaj();return gc.every(j=>G.t[j]!==GRILLE)&&c.term===1;});
  // la cloison : creusée exprès derrière le mur de la salle d'un terminal
  {let fait=false;for(let k=0;k<6&&!fait;k++){carte('atterrissage');const m=terms().find(m=>termCloison(m,BATI_DER.B,pieces()));if(!m)continue;fait=true;
    const n=m.act.findIndex(a=>a.t==='cloison'),a=m.act[n],it=a.sol.some(j=>G.items[j]&&G.items[j].length),clos=G.t[a.c]===WALL;
    termOuvre(m.i);lance('act'+n);ferme();
    ok(clos&&it&&G.t[a.c]===RUBBLE&&canWalk(G.t[a.c],true)&&a.sol.every(j=>G.t[j]===FLOOR)&&a.fait,`cloison : réduit de ${a.sol.length} cases, butin dedans, la cloison tombe (gravats praticables)`);}
    if(!fait)ok(false,'cloison : aucun réduit creusé en 6 cartes');}
  // 5. exploration automatique : un terminal ne l'arrête jamais en ouvrant le menu
  {carte('atterrissage');fog=true;let ouvert=false,pas=0;startExplore();
    for(let k=0;k<400&&EXPL;k++){clearTimeout(EXPL.tm);exploreStep();pas++;if(!$('terminal').hidden)ouvert=true;
      if(!EXPL&&!G.over){startExplore();if(!EXPL)break;}}
    stopExplore();ok(!ouvert&&pas>=10,`exploration automatique : ${pas} pas, menu jamais ouvert`);
    const m=terms()[0];termOuvre(m.i);ferme();startExplore();const a=!!EXPL||G.turn>0;stopExplore();ok(a,'exploration relancée après le menu');}
  window.requestAnimationFrame=raf;genRemet(sauve);
  return out.join('\n');
})()
