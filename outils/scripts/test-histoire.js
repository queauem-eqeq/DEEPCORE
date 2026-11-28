/* Le niveau 1 raconté (28 novembre 2026, 14l-histoire.js). Une ligne par essai : « ok » ou « ÉCHEC ».
   Numéro d'unité (+1 à la mort, pas à une partie recommencée), nom vivant (journal, fiches, textes construits au chargement),
   registre du port (première partie, trois parties précédentes, DATA du terminal du dépôt, onglet Documents), rapport de mission
   avec les vrais chiffres, liaison tirée de TEXTES_N1, journal de la foreuse, mots interdits, ferrailleuses sur notre vaisseau,
   anciens formats relus sans erreur. Le navigateur et le journal de bord sont remis comme avant à la fin. */
(() => {
  const out=[],ok=(b,t)=>out.push(`${b?'ok':'ÉCHEC'} : ${t}`),sauve=JSON.parse(JSON.stringify(GEN)),raf=window.requestAnimationFrame;
  window.requestAnimationFrame=()=>0;
  const LS=k=>localStorage.getItem(k),av={u:LS('np-unite'),r:LS('np-registre'),j:JSON.stringify(JN),n:UNITE_NUM};
  const put=(k,v)=>{if(v==null)localStorage.removeItem(k);else localStorage.setItem(k,v);};
  const carte=()=>{recRange();recPrend('atterrissage');hasardReglages();enJeu(newGame,1);};
  const logs=()=>(G.log||[]).map(l=>l.m).join(' | ');
  try{
  // départ propre : première partie
  put('np-unite',null);put('np-registre',null);JN=jnVide();jnSauve();UNITE_NUM=467;
  carte();
  ok(NOM_FOREUSE==='F467'&&EPV_UNITE===467,`première partie : unité ${NOM_FOREUSE}`);
  ok(/ATTERRISSAGE CONFORME\. SITE : ASTROPORT\. UNITÉ F467 EN SERVICE\./.test(logs()),'atterrissage en jargon machine au journal');
  ok(G.epaves.every(e=>e.num<UNITE_NUM),'toutes les épaves ont un numéro plus petit que l’unité');
  // registre, première partie : deux épaves aux plus grands numéros, puis la nôtre
  {const R=registreLignes(),F=G.fosses.find(f=>f.notre),top=G.epaves.map(e=>e.num).sort((a,b)=>b-a).slice(0,2).sort((a,b)=>a-b);
    ok(R.lignes.length===5&&R.lignes[0].includes(num4(top[0]))&&R.lignes[1].includes(num4(top[1]))&&/\(LIBÉRÉE\)/.test(R.lignes[1])
      &&R.lignes[2]===`ARRIVÉE 0467   FOSSE ${num2(F.num)}`&&R.lignes[4]===`FOSSE ${num2(F.num)} : LIBÉRATION PRÉVUE.`,
      'registre de la première partie : '+R.lignes.join(' / '));}
  // recommencer sans mort : même numéro
  carte();ok(NOM_FOREUSE==='F467'&&LS('np-unite')==='467','partie recommencée sans destruction : toujours F467');
  ok(jnRegFusion(regLu(),[]).filter(x=>x.u===467).length===1,'une seule entrée au registre par unité');
  // destruction : +1
  G.st.vie=0;mortForeuse();dead();const apres=LS('np-unite');dead();
  ok(apres==='468'&&LS('np-unite')==='468'&&JN.u===468,`destruction : np-unite ${apres} (une seule fois), rangé aussi dans le journal de bord (base)`);
  deployerForeuse();
  ok(NOM_FOREUSE==='F468'&&EPV_UNITE===468,'unité suivante : F468');
  ok(/UNITÉ F468 EN SERVICE/.test(logs()),'nom vivant dans le journal du jeu');
  {const role=BEASTS.map(b=>b.role||'').join(' '),it=Object.values(ITEMS).map(o=>o.d||'').join(' ');
    ok(/F468/.test(role)&&!/F467/.test(role)&&/F468/.test(it)&&!/F467/.test(it)&&/F468/.test(ST_DEF.vieMax[1]),'textes construits au chargement (rôles, objets, stats) : F468');
    ok(jnLignes({titre:'{UNITE}',lignes:[]}).titre==='F468','fiches du journal de bord : {UNITE} → F468');}
  // registre avec trois parties précédentes
  {regEcrit([{u:465,f:7},{u:466,f:12},{u:467,f:3},{u:468,f:G.fosses.find(f=>f.notre).num}]);const R=registreLignes(),nf=num2(G.fosses.find(f=>f.notre).num);
    ok(R.lignes.join('/')===`ARRIVÉE 0465   FOSSE 07 (LIBÉRÉE)/ARRIVÉE 0466   FOSSE 12 (LIBÉRÉE)/ARRIVÉE 0467   FOSSE 03 (LIBÉRÉE)/ARRIVÉE 0468   FOSSE ${nf}/DÉPART  —/FOSSE ${nf} : LIBÉRATION PRÉVUE.`,
      'registre avec trois parties précédentes : '+R.lignes.join(' / '));
    regEcrit([400,401,402,403,404,405,406,407].map(u=>({u,f:1})).concat([{u:468,f:2}]));
    ok(registreLignes().lignes.filter(l=>/LIBÉRÉE/.test(l)).length===6,'registre : les 6 dernières parties seulement');}
  // DATA du terminal du dépôt : le registre ; page dans l'onglet Documents
  {const m=G.term[G.regTerm];ok(!!m&&m.s==='terminal','terminal du registre choisi : '+G.regTerm);
    if(m){termOuvre(m.i);$('termMenu').querySelector('.tl[data-a="data"]').click();
      ok(m.lu&&m.lu.id==='registre_port'&&/REGISTRE/.test($('termOut').textContent)&&/ANALYSE/.test($('termOut').textContent),'premier DATA du terminal du dépôt : le registre, avec son analyse');closeTerminal();
      const E=jnEntrees('doc').find(e=>e.k==='registre_port');ok(E&&E.connu&&jnTexte('registre_port').lignes.length>=4,'registre rangé dans l’onglet Documents');
      jnOuvre();jnOnglet('doc');jnChoix(jnEntrees('doc').findIndex(e=>e.k==='registre_port'));ok(/ARRIVÉE 0468/.test($('jdbFiche').textContent),'fiche du registre affichée');jnFerme();}}
  // journal de la foreuse : tout en vue
  {const v0=vis,c0=G.st.capteur;vis=new Uint8Array(W*H).fill(1);G.st.capteur=Math.max(W,H);for(let k=0;k<40;k++){G.turn++;n1Vue();}const L=logs();vis=v0;G.st.capteur=c0;
    ok(/CONTACT : (\d+ MOBILES|MOBILE)\. SIGNATURE : MÉTAL/.test(L),'premier contact');
    ok(/STRUCTURE : VAISSEAU\. HORS SERVICE\. NON RÉPERTORIÉ\./.test(L)&&/OCCURRENCE : 5\./.test(L),'épaves vues : 1re et 5e');
    ok((L.match(/OCCURRENCE/g)||[]).length<=2+(/OCCURRENCE : 14/.test(L)?1:0)&&!/OCCURRENCE : [2346789]\b/.test(L),'épaves : pas d’inondation');
    ok(/FABLAB/.test(L)&&/TERMINAL/.test(L),'FABLAB et terminal vus');}
  // fin de niveau : notre vaisseau pris pour une épave
  {ok(!G.epaves.some(e=>e.notre),'avant le dépôt : notre vaisseau n’est pas une épave');
    let f=-1;for(let n=0;n<6&&f<0;n++){if(n)carte();f=n1Fin();}
    const k=G.epaves.findIndex(e=>e.notre),P=G.patr[f],mb=G.beasts.concat(G.animals).filter(o=>o.gi===f);
    ok(f>=0&&k>=0&&P.epave===k&&mb.every(o=>o.epave===k)&&ouvrEpave(P)===G.epaves[k]&&!P.ouv,'ferrailleuses redirigées vers notre vaisseau, toujours à l’ouvrage');
    let c=0;for(const i in G.epI)if(G.epI[i]===k)c++;ok(c>0&&!epaveA(idx(G.ship.x+2,G.ship.y+2)),`coque de notre vaisseau : ${c} plaques à découper, fiche du vaisseau intacte`);
    ok(G.epaves.filter(e=>!e.notre&&e.etat!=='v').length===n1Epaves(),'épaves sur site : notre vaisseau non compté');}
  // rapport de mission
  {carte();G.st.vie=Math.round(G.st.vieMax*.84);const sp=BEASTS.findIndex(b=>b.key==='crabos');for(let n=0;n<3;n++)jnDetruit({sp,x:1,y:1},1);
    const R=rapportMission(),ep=G.epaves.filter(e=>e.etat!=='v').length;
    ok(R&&R.r[0]===`RAPPORT 001 — ${NOM_FOREUSE} → ORIGINE`&&R.r.includes('ÉTAT UNITÉ .... 84 %')&&R.r.includes('MENACES ....... 3 NEUTRALISÉES')
      &&R.r.includes(`OBSERVATIONS .. ÉPAVES SUR SITE : ${ep}.`)&&R.a.includes('NOYAU D’ORIGINE : 61 %'),'rapport rempli : '+R.r.slice(2,6).join(' / '));
    ok(JN.pg.rapport_1&&JN.pg.rapport_1.l.length>8&&jnEntrees('jou').some(e=>e.k==='rapport_1'&&e.connu),'rapport rangé au journal de bord (Journaux)');
    G.niv=2;ok(rapportMission()===null,'pas de rapport hors du niveau 1');G.niv=1;}
  // liaison
  {const V=TEXTES_N1.connexion,l=liaisonTexte(1,2);ok(V.length===5&&l.join('|')===V[1].map(s=>s.replace('{N}','002')).join('|'),'liaison : variante de TEXTES_N1 ('+l[5]+')');}
  // mots interdits
  {const tx=[];const f=o=>{if(typeof o==='string')tx.push(o);else if(o&&typeof o==='object')Object.values(o).forEach(f);};f(TEXTES_N1);
    for(const h of Object.values(HACKS))tx.push(h.n,h.d);
    const mal=tx.filter(s=>/\bTerre\b|TERRE\b|mkIV|F\.467|(^|[^\wÀ-ÿ])(je|j['’]|moi|JE|J['’]|MOI)(?![\wÀ-ÿ])/.test(s));
    ok(!mal.length,`textes du niveau 1 et des hacks : aucun « Terre », « mkIV », « je », « moi » (${tx.length} textes)${mal.length?' — '+mal.slice(0,3).join(' ‖ '):''}`);}
  // anciens formats
  {let err=null;try{const d=jnSain({v:1,pg:{jf_398:{n:3},registre_port:{l:'x'}},rob:{}});const d2=jnSain({u:'abc',reg:[{u:'x'},null,{u:470,f:'2'}]});
      ok(!d.u&&d.reg.length===0&&d.pg.jf_398.n===3&&!d.pg.registre_port.l&&d2.reg.length===1&&d2.reg[0].f===2,'journal ancien ou abîmé relu sans erreur');
      put('np-registre','{pas du json');put('np-unite','abc');ok(regLu().length===0&&uniteLue()===0,'np-registre et np-unite abîmés : ignorés');
      carte();ok(NOM_FOREUSE==='F'+Math.max(467,JN.u),'partie relancée après des clés abîmées : '+NOM_FOREUSE);}catch(e){err=e;}
    ok(!err,'ancienne partie / anciens réglages : aucune erreur'+(err?' — '+err:''));}
  // fusion avec la base : le plus grand numéro gagne, registre uni
  {const f=jnFusion({u:470,reg:[{u:469,f:1}]},{u:472,reg:[{u:471,f:5}],raz:3});ok(f.u===472&&f.reg.length===2,'fusion navigateur + base : numéro maximal, registres unis');}
  }catch(e){ok(false,'exception : '+e+' '+(e.stack||'').split('\n')[1]);}
  window.requestAnimationFrame=raf;genRemet(sauve);put('np-unite',av.u);put('np-registre',av.r);JN=jnSain(JSON.parse(av.j));jnSauve();
  UNITE_NUM=av.n;NOM_FOREUSE='F'+av.n;EPV_UNITE=av.n;uniteTextes();
  return out.join('\n');
})()
