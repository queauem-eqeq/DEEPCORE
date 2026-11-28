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
    lance('bp');ok(m.bp===0&&/INDISPONIBLE/.test($('termOut').textContent),'ENCODAGE → BLUEPRINT : module indisponible (étape suivante)');
    k('Escape');ok($('terminal').hidden,'Échap ferme la fenêtre');
    termOuvre(m.i);ok(lignes()[0]==='DATA:-undefined','rouvert : la DATA reste lue');ferme();}
  // boîte noire
  {let bx=null;for(let k=0;k<6&&!bx;k++){carte('atterrissage');bx=Object.values(G.term).find(m=>m.s==='boite_noire');}
    if(bx){termOuvre(bx.i);const L=lignes();ok(L.length===2&&L[1]==='CONNEXION:liaison'&&/ENREGISTREUR/.test($('termTitre').textContent),`boîte noire : ${L.join(' | ')} — ${$('termTitre').textContent}`);
      lance('data');ok(bx.lu&&bx.lu.type==='boite_noire'&&/ATTENTE RETOUR/.test($('termOut').textContent),'boîte noire : DATA = l’enregistreur de l’épave');ferme();}
    else ok(false,'boîte noire : aucune en 6 cartes');}
  // 4. antenne : posée à la main dans une pièce
  {carte('atterrissage');const p=pieces().find(p=>p.c.some(i=>G.t[i]===FLOOR)),i=p.c.find(i=>G.t[i]===FLOOR&&!G.items[i]);
    G.t[i]=ANTENNA;G.art[i]=0;delete G.term[i];termOuvre(i);const L=lignes();
    ok(L.length===2&&L[1]==='CONNEXION:reseau,liaison',`antenne : ${L.join(' | ')} (pas d’ENCODAGE)`);
    const t0=G.turn;lance('reseau');ferme();
    ok(G.art[i]===1&&G.antFin[i]===t0+1+ANT_TOURS&&G.turn===t0+1,`antenne : RÉSEAU DU SITE l’allume (${ANT_TOURS} tours de brouillard levé), un battement compté à la fermeture`);
    termOuvre(i);ok(/EN SERVICE/.test($('termMenu').textContent)&&!lance('reseau'),'antenne : une seule fois');lance('data');
    ok(G.term[i].lu&&G.term[i].lu.type==='releve','antenne : DATA = relevé du site');ferme();
    // ancienne partie : antenne déjà allumée, terminal déjà là, pas de G.term
    G.art[i]=2;delete G.term;let err=null;try{termOuvre(i);ferme();termOuvre(Object.keys(G.art).map(Number).find(j=>G.t[j]===TERMINAL));ferme();termOuvre(i);}catch(e){err=e;}
    ferme();ok(!err&&G.term&&G.term[i].s==='antenne'&&/EN SERVICE/.test($('termMenu').textContent),`ancienne partie relue sans erreur${err?' : '+err:''}`);}
  // 3. actions CONNEXION
  // grille : rare (une porte à clé passe avant) ; sans carte qui la propose, on la confie à la main au terminal le plus proche
  if(!vu.grille)for(let k=0;k<10&&!vu.grille;k++){carte(k%2?'cavernes':'base');const n=(G.circ||[]).findIndex(c=>c.k==='socle'&&c.cib.some(q=>q.t==='grille'&&q.c.some(j=>G.t[j]===GRILLE)));
    const T=terms();if(n<0||!T.length)continue;const c=G.circ[n].c,m=T.sort((a,b)=>termD2(a.i,c)-termD2(b.i,c))[0];m.act.push({t:'grille',k:n,fait:0});
    vu.grille=[GEN.recette,G,BATI_DER];out.push('(grille confiée à la main à un terminal : aucune carte ne l’a proposée seule)');}
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
