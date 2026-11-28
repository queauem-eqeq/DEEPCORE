/* ---------- Journal de bord (28 novembre 2026) ----------
   Voir docs/fiches-robots.md, docs/terminaux-journal.md et docs/conception-interface.md (« Journal de bord »).
   À ne pas confondre avec le journal des messages, en bas de l'écran (logPush) : celui-ci est une fenêtre, « JOURNAL DE BORD ».
   Six onglets : Robots, Objets, Journaux, Documents, Hacks, Tutoriel. Tout ce qui y entre est gardé d'une partie à l'autre.
   - Robots : une fiche par espèce (ESPECES), à quatre paliers : 0 Contact (vu une fois), 1 Stats (10 destructions cumulées, ou une
     DATA), 2 Comportement (une DATA), 3 Origine (une DATA lue à un niveau au moins égal à l'éveil requis). Les stats affichées sont
     celles du jeu en cours (BEASTS / SPECIES, bestiaire du joueur compris), lues à l'ouverture.
   - Objets : complets dès qu'ils sont connus (identifiés, ramassés, fabriqués, plan appris, ou DATA, qui identifie la capsule).
   - Journaux, Documents, Tutoriel : les pages de TEXTES_N1 (14j-textes.js) lues aux terminaux ; trois pages de tutoriel d'office.
   - Hacks : les sortes déjà proposées ou portées, avec le plus haut rang vu.
   Stockage : localStorage np-journal (JSON, champ v = version du format) ; dans l'artefact claude.ai, aussi dans la base, document
   journal/courant (distinct de reglages/courant), fusionné à l'arrivée : un journal ne fait que grandir, sauf effacement (Lab).
   Format : {v, raz (date du dernier effacement), maj, rob:{clé:{vu,det,s,c,o}}, obj:{clé:1}, hk:{sorte:rang}, pg:{id:{n}}, ouv:{entrée:1}}
   Entrées (pastille « nouveau » tant qu'elles ne sont pas dans ouv) : 'r:crabos', 'o:repar', 'h:crit', 'p:jf_398'.
   Pour l'étape suivante : jnPage(id, n) ajoute une page (journal, document ou tutoriel) ; jnMonte(clé) monte une fiche d'un palier ;
   jnObjet(k) ; jnHack(sorte, rang) ; jnTexte(id) retrouve un texte ; JN_TEXTES[niveau] = les textes d'un niveau. */
const JN_VER=1,JN_CLE='np-journal',JN_DOC='journal/courant',JN_STATS=10;
// clé de BEASTS / ESPECES → clé de la fiche dans TEXTES_N1.fiches_robots (vérifiée une à une le 28 novembre 2026 ;
// le Gardien des textes n'a pas d'espèce en jeu : l'ancien Gardien est devenu le Bloqueur, clé « gardien »)
const JN_FICHE={puce:'puce',crabos:'crabot',cafar:'relais',mastok:'broyeur',brochon:'torpille',mine:'mine',paralyzor:'sentinelle',
  gardien:'bloqueur',artilleur:'artilleur',drone:'drone',soudeur:'soudeur',englueur:'englueur'};
const JN_TX=typeof TEXTES_N1!=='undefined'?TEXTES_N1:{};
const JN_TEXTES={1:JN_TX};   // les textes de chaque niveau (seul le niveau 1 existe)
const JN_TUTO_DEPART=3;      // pages de tutoriel acquises d'office
const JN_ONGLETS=[['rob','Robots'],['obj','Objets'],['jou','Journaux'],['doc','Documents'],['hk','Hacks'],['tut','Tutoriel']];
const JN_MANQUE='[DONNÉES MANQUANTES]';
const jnVide=()=>({v:JN_VER,raz:0,maj:0,rob:{},obj:{},hk:{},pg:{},ouv:{}});
// relecture tolérante : champs inconnus ignorés, types remis d'aplomb (un format plus récent ou plus ancien se lit sans erreur)
function jnSain(d){const o=jnVide();if(!d||typeof d!=='object')return o;const n=v=>Number.isFinite(+v)?Math.max(0,Math.round(+v)):0,
    obj=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
  o.raz=n(d.raz);o.maj=n(d.maj);
  for(const [k,r] of Object.entries(obj(d.rob)))if(r&&typeof r==='object')o.rob[k]={vu:r.vu?1:0,det:n(r.det),s:r.s?1:0,c:r.c?1:0,o:r.o?1:0};
  for(const [k,v] of Object.entries(obj(d.obj)))if(v)o.obj[k]=1;
  for(const [k,v] of Object.entries(obj(d.hk)))o.hk[k]=Math.max(1,Math.min(10,n(v)||1));
  for(const [k,v] of Object.entries(obj(d.pg)))o.pg[k]=v&&typeof v==='object'&&v.n!=null?{n:n(v.n)}:{};
  for(const [k,v] of Object.entries(obj(d.ouv)))if(v)o.ouv[k]=1;
  return o;}
// fusion de deux journaux : le plus récemment effacé l'emporte ; sinon, union (rien ne se perd)
function jnFusion(a,b){a=jnSain(a);b=jnSain(b);if(a.raz!==b.raz)return a.raz>b.raz?a:b;const o=a;o.maj=Math.max(a.maj,b.maj);
  for(const k in b.rob){const x=o.rob[k]||(o.rob[k]={vu:0,det:0,s:0,c:0,o:0}),y=b.rob[k];
    x.vu|=y.vu;x.det=Math.max(x.det,y.det);x.s|=y.s;x.c|=y.c;x.o|=y.o;}
  for(const k in b.obj)o.obj[k]=1;for(const k in b.hk)o.hk[k]=Math.max(o.hk[k]||0,b.hk[k]);
  for(const k in b.pg)if(!o.pg[k])o.pg[k]=b.pg[k];for(const k in b.ouv)o.ouv[k]=1;return o;}
let JN=jnVide(),JN_DB=null,JN_DBT=0;
function jnCharge(){let d=null;try{d=JSON.parse(localStorage.getItem(JN_CLE)||'null');}catch(e){}JN=jnSain(d);return JN;}
function jnSauve(){JN.maj=Date.now();try{localStorage.setItem(JN_CLE,JSON.stringify(JN));}catch(e){}
  if(JN_DB){clearTimeout(JN_DBT);JN_DBT=setTimeout(jnBaseEcrit,2500);}}
function jnBaseEcrit(){if(!JN_DB)return;try{JN_DB.doc(JN_DOC).set({enregistreLe:new Date().toISOString(),v:JN_VER,json:JSON.stringify(JN)})
  .catch(()=>{});}catch(e){}}
jnCharge();
// base de l'artefact (claude.ai) : son propre document, lu puis fusionné ; reglages/courant n'est pas touché
(window.claude&&window.claude.use?window.claude.use('db'):Promise.resolve(null)).then(async d=>{if(!d)return;JN_DB=d;
  try{const s=await d.doc(JN_DOC).get();if(s.exists){let r=null;try{r=JSON.parse(s.data().json||'null');}catch(e){}
      const av=JSON.stringify(JN);JN=jnFusion(JN,r);if(JSON.stringify(JN)!==av){try{localStorage.setItem(JN_CLE,JSON.stringify(JN));}catch(e){}}
      if(JSON.stringify(jnSain(r))!==JSON.stringify(JN))jnBaseEcrit();}
    else jnBaseEcrit();}catch(e){}
  if(!$('jdb').hidden)jnRendu();}).catch(()=>{});

/* ----- Ce qui existe ----- */
const jnEspece=k=>k==='puce'?SPECIES[0]:BEASTS.find(b=>b.key===k);
const jnFicheTx=k=>((JN_TX.fiches_robots||{})[JN_FICHE[k]])||null;
const jnNomR=k=>{const s=jnEspece(k);return s?s.n.toUpperCase():k.toUpperCase();};
const jnRob=k=>JN.rob[k]||(JN.rob[k]={vu:0,det:0,s:0,c:0,o:0});
const jnStats=r=>!!(r&&(r.s||r.det>=JN_STATS));
const jnConnuR=r=>!!(r&&(r.vu||r.s||r.c||r.o||r.det>0));
const jnObjets=()=>Object.keys(ITEMS).filter(k=>!estHack(k)&&!/^plan_/.test(k)&&k!=='matiere');
const jnHacks=()=>Object.keys(HACKS).filter(h=>TIR_DISPO||HACKS[h].f!=='tir');
const jnTous=()=>[...(JN_TX.terminaux||[]),...(JN_TX.documents||[]),...(JN_TX.tutoriel||[])];
const jnTexte=id=>jnTous().find(t=>t.id===id)||null;
const jnTuto=()=>JN_TX.tutoriel||[];
const jnTutoLu=id=>!!JN.pg[id]||jnTuto().findIndex(t=>t.id===id)<JN_TUTO_DEPART;
const jnUnite=s=>String(s).split('{UNITE}').join(typeof NOM_FOREUSE!=='undefined'?NOM_FOREUSE:'F467');
// texte d'une page, jetons remplacés ({NUM} : numéro de l'épave, sur 4 chiffres)
function jnLignes(t,n){const N=n!=null?String(n).padStart(4,'0'):'????',f=s=>jnUnite(String(s).split('{NUM}').join(N));
  return {titre:f(t.titre),lignes:(t.lignes||[]).map(f),analyse:t.analyse?f(t.analyse).split('\n'):[]};}

/* ----- Ce qui entre dans le journal ----- */
function jnLog(m){if(typeof G!=='undefined'&&G&&typeof sayMore==='function')sayMore(m,'info');}
const JN_PAL_NOM={s:'STATS',c:'COMPORTEMENT',o:'ORIGINE'};
// première fois qu'une espèce entre dans le champ de vision (09-vision)
function jnVu(k){if(!k)return;const r=jnRob(k);if(r.vu)return;r.vu=1;delete JN.ouv['r:'+k];jnSauve();}
// une destruction, comptée comme pour RECYCLAGE : tout robot abattu, quel que soit le moyen ; pas une mine qui saute d'elle-même
function jnDetruit(o,estBete){if(!o||o.jn)return;o.jn=1;const k=estBete?(BEASTS[o.sp]||{}).key:'puce';if(!k)return;const r=jnRob(k),avant=jnStats(r);
  r.det++;r.vu=1;if(!avant&&jnStats(r)){delete JN.ouv['r:'+k];jnLog(`FICHE MISE À JOUR : ${jnNomR(k)} — STATS.`);}jnSauve();}
// palier suivant d'une fiche, s'il peut s'ouvrir au niveau d'éveil donné (l'origine attend l'éveil requis)
function jnSuivant(k,niv){const r=JN.rob[k],T=jnFicheTx(k);if(!jnStats(r))return 's';if(!T)return null;if(!r.c)return 'c';
  if(!r.o&&(niv||1)>=(+T.eveil||99))return 'o';return null;}
function jnMonte(k,niv){const p=jnSuivant(k,niv??((typeof G!=='undefined'&&G&&G.niv)||1));if(!p)return null;const r=jnRob(k);r[p]=1;r.vu=1;
  delete JN.ouv['r:'+k];jnSauve();jnLog(`FICHE MISE À JOUR : ${jnNomR(k)} — ${JN_PAL_NOM[p]}.`);return p;}
function jnObjet(k){if(!ITEMS[k]||JN.obj[k])return false;JN.obj[k]=1;delete JN.ouv['o:'+k];jnSauve();return true;}
function jnHack(h,r){if(!HACKS[h])return false;r=Math.max(1,r|0||1);if((JN.hk[h]||0)>=r)return false;const neuf=!JN.hk[h];JN.hk[h]=r;
  if(neuf)delete JN.ouv['h:'+h];jnSauve();return true;}
function jnPage(id,n){if(JN.pg[id])return false;JN.pg[id]=n!=null?{n}:{};delete JN.ouv['p:'+id];jnSauve();return true;}
// ce que la foreuse porte ou a vu en partie : objets connus, hacks proposés ou portés (appelé à chaque battement et à l'ouverture)
let JN_SYNC=-1;
// Ne tire jamais au hasard : le savoir est lu tel quel (savoir() tirerait les noms de code des capsules, et changerait la suite du jeu)
function jnSync(force){if(typeof G==='undefined'||!G||!G.st)return;if(!force&&G.turn===JN_SYNC)return;JN_SYNC=G.turn;let ch=false;
  const S=G.st.savoir||SAV_GARDE||{ident:{},plans:{}};
  const vu=k=>{if(ITEMS[k]&&!estHack(k)&&!JN.obj[k]&&(!CONSO[k]||TOUT_CONNU||S.ident[k])){JN.obj[k]=1;delete JN.ouv['o:'+k];ch=true;}};
  for(const o of G.inv||[]){if(estHack(o.k)){const d=ITEMS[o.k];if((JN.hk[d.hk]||0)<(d.rang||1)){if(!JN.hk[d.hk])delete JN.ouv['h:'+d.hk];
      JN.hk[d.hk]=d.rang||1;ch=true;}}else vu(o.k);}
  for(const k in S.ident||{})if(S.ident[k])vu(k);for(const k in S.plans||{})if(S.plans[k])vu(k.replace(/^plan_/,''));
  for(const m of Object.values(G.term||{}))for(const k of m.hkChoix||[])if(estHack(k)){const d=ITEMS[k];
    if((JN.hk[d.hk]||0)<(d.rang||1)){if(!JN.hk[d.hk])delete JN.ouv['h:'+d.hk];JN.hk[d.hk]=d.rang||1;ch=true;}}
  if(ch)jnSauve();}
// une capsule identifiée en partie entre au journal (premier usage, F9, DATA)
{const id0=identifier;identifier=function(k){const r=id0(k);if(CONSO[k])jnObjet(k);return r;};}

/* ----- DATA d'un terminal (remplace la version provisoire de 07i) -----
   Tirée sans choix, parmi ce qui concerne le niveau en cours : palier d'un robot présent (poids 4), fiche d'une capsule non
   identifiée du niveau, qui l'identifie (2), journal non lu (3), document non lu (2), page de tutoriel non lue (1).
   Boîte noire : toujours un texte d'enregistreur, au numéro de l'épave. Antenne : un palier de robot, ou le relevé du site.
   Tout est lu : un journal déjà lu, au hasard. Renvoie {type, id, titre, lignes, analyse?, page?, maj?}. */
const jnHasard=l=>l[Math.floor(Math.random()*l.length)];
// les espèces du niveau en cours : groupes permis à ce niveau (réglages du joueur compris), et ce qui vit sur la carte
function jnEspecesNiv(){const s=new Set(),ks=ESPECES().map(e=>e[0]);
  try{const NV=nivDe((typeof G!=='undefined'&&G&&G.niv)||1);for(const g of GROUPES.liste)if(g.on&&NV.gr.includes(g.n))for(const m of g.m)s.add(m.k);}catch(e){}
  if(typeof G!=='undefined'&&G){for(const b of G.beasts||[])if(BEASTS[b.sp])s.add(BEASTS[b.sp].key);if((G.animals||[]).length)s.add('puce');}
  return ks.filter(k=>s.has(k));}
function jnReleve(m){const b=(G.beasts||[]).filter(o=>!BEASTS[o.sp].mine),gr=new Set(b.map(o=>o.gi).filter(g=>g!=null)),s=G.sites&&G.sites[0];
  const l=[`SIGNATURES MOBILES : ${b.length}.`,`FORMATIONS : ${gr.size}.`];
  if(G.epaves&&G.epaves.length)l.push(`ÉPAVES SUR SITE : ${G.epaves.filter(e=>e.etat!=='v').length}.`);
  if(s)l.push(`SITE DE FORAGE : ${termCap(m.i,idx(s.x,s.y))}.`);
  return {type:'releve',id:'releve-'+(G.niv||1),titre:'RELEVÉ DU SITE',lignes:l};}
function jnRobotData(k){const niv=G.niv||1,p=jnMonte(k,niv);if(!p)return null;const sp=jnEspece(k),T=jnFicheTx(k)||{};
  const l=p==='s'?jnStatsLignes(sp):p==='c'?[T.role||'',...(T.comportement||[])]:[...(T.origine||[])];
  return {type:'robot',id:'r:'+k,titre:'FICHE : '+jnNomR(k),lignes:l.filter(Boolean),maj:JN_PAL_NOM[p],page:1};}
function jnStatsLignes(sp){return [`VIE : ${pvDe(sp)}.`,`DÉGÂTS : ${sp.dmin}–${sp.dmax}.`,`PRÉCISION : ${sp.pre}.`,`DÉFENSE : ${sp.def||0}.`,
  `DURÉE DU PAS : ${sp.dpas}.`,`DURÉE DU COUP : ${sp.dcoup}.`];}
function jnPageData(t,n){const L=jnLignes(t,n);jnPage(t.id,n);
  return {type:t.source||(jnTuto().includes(t)?'tutoriel':'document'),id:t.id,titre:L.titre,lignes:L.lignes,analyse:L.analyse,page:1};}
// boîte noire : un texte d'enregistreur, du modèle de l'épave si possible, au numéro de l'épave
function jnBoite(m){const k=G.art[m.i]&&G.art[m.i].boite,e=G.epaves&&G.epaves[k],bn=(JN_TX.terminaux||[]).filter(t=>t.source==='boite_noire');
  if(!e||!bn.length){const [ti,x]=epaveBoite(k);return {type:'boite_noire',id:'epave-'+k,titre:ti,lignes:x.split('\n')};}
  const mot=t=>t.titre.split(' ')[0],du=bn.filter(t=>e.nom.split(' ').includes(mot(t))),pool=du.length?du:bn,neufs=pool.filter(t=>!JN.pg[t.id]),
    t=jnHasard(neufs.length?neufs:pool),L=jnPageData(t,e.num);
  // le titre porte le nom et le numéro de l'épave ; le texte écrit pour PORTEUR 0211 suit le numéro de celle-ci
  L.titre=epNom(e)+' — ENREGISTREUR';L.lignes=L.lignes.map(s=>s.replace(/F\.211 mkII/g,`F.${num4(e.num)} ${epvMk(e.num)}`).replace(/\b0211\b/g,num4(e.num)));
  L.type='boite_noire';return L;}
function dataTirer(m){jnSync(true);
  if(m.s==='boite_noire')return jnBoite(m);
  const R=jnEspecesNiv().filter(k=>jnSuivant(k,G.niv||1));
  if(m.s==='antenne')return (R.length&&Math.random()<.5&&jnRobotData(jnHasard(R)))||jnReleve(m);
  const TX=JN_TEXTES[G.niv||1]||{},nl=l=>(l||[]).filter(t=>!JN.pg[t.id]),
    J=nl((TX.terminaux||[]).filter(t=>t.source!=='boite_noire')),D=nl(TX.documents),T=jnTuto().filter(t=>!jnTutoLu(t.id)),
    sur=new Set([...Object.values(G.items||{}).flat(),...(G.inv||[]).map(o=>o.k)]),
    Ok=Object.keys(CONSO).filter(k=>ITEMS[k]&&!identifie(k)),O=Ok.filter(k=>sur.has(k)).length?Ok.filter(k=>sur.has(k)):Ok;
  const C=[[R,4,k=>jnRobotData(k)],[O,2,k=>jnObjetData(k)],[J,3,t=>jnPageData(t)],[D,2,t=>jnPageData(t)],[T,1,t=>jnPageData(t)]].filter(c=>c[0].length);
  if(C.length){let x=Math.random()*C.reduce((a,c)=>a+c[1],0),i=0;while(i<C.length-1&&(x-=C[i][1])>0)i++;const r=C[i][2](jnHasard(C[i][0]));if(r)return r;}
  // tout est lu : un journal déjà lu, au hasard
  const lus=(JN_TX.terminaux||[]).filter(t=>t.source!=='boite_noire'&&JN.pg[t.id]);
  if(lus.length){const t=jnHasard(lus),L=jnLignes(t);return {type:t.source,id:t.id,titre:L.titre,lignes:L.lignes,analyse:L.analyse,relu:1};}
  return {type:'vide',id:'vide',titre:'MÉMOIRE LOCALE',lignes:['AUCUNE DONNÉE NOUVELLE.']};}
function jnObjetData(k){identifier(k);jnObjet(k);const d=ITEMS[k],v=d.vrai||d;
  return {type:'objet',id:'o:'+k,titre:'FICHE : '+v.n.toUpperCase(),lignes:[jnTC(()=>fabEffet(k)),...jnChiffres(k),v.d||''].filter(Boolean),page:1};}
// le terminal : texte lu à droite, « PAGE AJOUTÉE AU JOURNAL DE BORD » et, pour un texte, sa ligne d'analyse (aussi au journal du jeu)
function termData(m){if(m.data)return false;const d=dataTirer(m);m.data=1;m.lu={type:d.type,id:d.id,titre:d.titre,lignes:d.lignes};SFX.analyse();
  termSortie(d.titre,d.lignes);const el=$('termOut'),p=(t,c)=>{const e=document.createElement('p');e.className=c;e.textContent=t;el.appendChild(e);};
  if(d.maj)p(`FICHE MISE À JOUR — ${d.maj}.`,'jnajout');
  if(d.page)p('PAGE AJOUTÉE AU JOURNAL DE BORD.','jnajout');
  for(const a of d.analyse||[])p(a,'jnana');
  sayMore(`DATA : ${d.titre}.`,'info');if(d.analyse&&d.analyse.length)sayMore(d.analyse.join(' '),'info');
  if(d.page)jnBouton();return true;}

/* ----- La fenêtre ----- */
let JN_TAB='rob',JN_SEL={},JN_CONF=0;
const jnE=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
// les vrais noms et effets des capsules, le temps d'un dessin (sans rien identifier en partie)
function jnTC(f){const a=TOUT_CONNU;TOUT_CONNU=true;try{return f();}finally{TOUT_CONNU=a;}}
function jnChiffres(k){const V=ITEM_VAL[k]||{};return Object.keys(V).map(c=>`${(ITEM_VAL_LIB[c]||c).toUpperCase()} : ${V[c]}`);}
// les entrées d'un onglet : [{cle, nom, connu}]
function jnEntrees(t){
  if(t==='rob')return ESPECES().map(([k])=>({cle:'r:'+k,k,nom:jnNomR(k),connu:jnConnuR(JN.rob[k])}));
  if(t==='obj')return jnObjets().map(k=>({cle:'o:'+k,k,nom:jnTC(()=>ITEMS[k].n).toUpperCase(),connu:!!JN.obj[k]}));
  if(t==='hk')return jnHacks().map(h=>({cle:'h:'+h,k:h,nom:HACKS[h].n,connu:!!JN.hk[h]}));
  const l=t==='jou'?JN_TX.terminaux:t==='doc'?JN_TX.documents:JN_TX.tutoriel;
  return (l||[]).map(x=>{const pg=JN.pg[x.id],n=pg&&pg.n!=null?pg.n:null;
    return {cle:'p:'+x.id,k:x.id,nom:jnLignes(x,n).titre,connu:t==='tut'?jnTutoLu(x.id):!!pg};});}
const jnNeuf=e=>e.connu&&!JN.ouv[e.cle]&&!(e.cle.startsWith('p:tuto')&&!JN.pg[e.k]);   // les pages données d'office ne sont pas « nouvelles »
function jnOngletsHTML(){return JN_ONGLETS.map(([t,n])=>{const E=jnEntrees(t),c=E.filter(e=>e.connu).length,nv=E.some(jnNeuf);
  return `<button class="jtab${t===JN_TAB?' sel':''}" role="tab" aria-selected="${t===JN_TAB}" data-t="${t}">${n.toUpperCase()} <i>${c}/${E.length}</i>${nv?'<b class="jnew" title="Nouveau"></b>':''}</button>`;}).join('');}
function jnListeHTML(E){return E.map((e,n)=>e.connu
  ?`<button class="jli${n===JN_SEL[JN_TAB]?' sel':''}" role="option" aria-selected="${n===JN_SEL[JN_TAB]}" data-n="${n}">${e.cle.startsWith('r:')?`<img src="${ICON[jnIcone(e.k)]||''}" alt="">`:''}<span>${jnE(e.nom)}</span>${jnNeuf(e)?'<b class="jnew" title="Nouveau"></b>':''}</button>`
  :`<button class="jli inc" disabled data-n="${n}"><span>— ${jnInc(e)} —</span></button>`).join('');}
const jnInc=e=>e.cle.startsWith('p:')?'PAGE NON LUE':'INCONNU';
const jnIcone=k=>k==='puce'?'an0r':'bz'+BEASTS.findIndex(b=>b.key===k)+'r';
// fiche d'un robot : sa tuile agrandie, puis les quatre paliers l'un sous l'autre
function jnFicheRobot(k){const r=JN.rob[k]||{},sp=jnEspece(k),T=jnFicheTx(k),st=jnStats(r),man=`<p class="jman">${JN_MANQUE}</p>`,
    sec=(n,t,ok,h)=>`<section class="jpal${ok?'':' manque'}"><h4>${n} · ${t}</h4>${ok?h:man}</section>`;
  const tab=[['VIE',pvDe(sp)],['DÉGÂTS',`${sp.dmin}–${sp.dmax}`],['PRÉCISION',sp.pre],['DÉFENSE',sp.def||0],['PAS',sp.dpas],['COUP',sp.dcoup]];
  return `<div class="jfhead"><img class="jsil" src="${ICON[jnIcone(k)]||''}" alt="Silhouette : ${jnE(sp.n)}"><div><h3>${jnE(jnNomR(k))}</h3>`+
    `<p>CLASSEMENT : <b class="jmen">MENACE</b></p><p class="jdim">DESTRUCTIONS : ${r.det||0}</p></div></div>`+
    sec(0,'CONTACT',true,`<p>SIGNATURE : MÉTAL. MOBILE.</p>`)+
    sec(1,'STATS',st,`<table class="jstat">${tab.map(([a,b])=>`<tr><th>${a}</th><td>${b}</td></tr>`).join('')}</table>`)+
      (st?'':`<p class="jdim">DESTRUCTIONS : ${Math.min(r.det||0,JN_STATS)}/${JN_STATS}</p>`)+
    sec(2,'COMPORTEMENT',!!(r.c&&T),T?`<p class="jrole">${jnE(T.role||'')}</p>${(T.comportement||[]).map(l=>`<p>${jnE(l)}</p>`).join('')}`+
      `<p class="jdim">BUTIN : ${DROPS[k]||0} % DE CHANCE D’UN OBJET.</p>`:'')+
    sec(3,'ORIGINE',!!(r.o&&T),T?(T.origine||[]).map(l=>`<p>${jnE(l)}</p>`).join(''):'');}
function jnFicheObjet(k){return jnTC(()=>{const d=ITEMS[k];
  return `<div class="jfobj"><pre class="iart" aria-hidden="true">${d.art?artHTML(d):''}</pre><h3>${jnE(d.n.toUpperCase())}</h3>`+
    `<p class="jrole">${jnE(fabEffet(k))}</p>${jnChiffres(k).map(l=>`<p>${jnE(l)}</p>`).join('')}`+
    (FAB_PRIX&&FAB_PRIX[k]?`<p class="jdim">FABLAB : ${FAB_PRIX[k]} MATIÈRE.</p>`:'')+`<p class="jdesc">${jnE(d.d||'')}</p></div>`;});}
function jnFicheHack(h){const H=HACKS[h],F=HACK_FAM[H.f],r=JN.hk[h]||1,a=hackArt(h);
  const rangs=H.f==='noyau'?`<p class="jrole">${jnE(H.eff())}</p>`
    :`<table class="jstat">${HACK_E.map((E,i)=>`<tr class="${i+1<=r?'':'jdim'}"><th>RANG ${i+1}</th><td>${jnE(H.eff(E,i+1))}</td></tr>`).join('')}</table>`;
  return `<div class="jfobj"><pre class="iart" aria-hidden="true">${artHTML(a)}</pre><h3>${jnE(H.n)}</h3>`+
    `<p style="color:${F.v}">FAMILLE ${F.n}${H.f==='noyau'?'':` · RANG VU : ${r}`}</p>${rangs}<p class="jdesc">${jnE(H.d)}</p></div>`;}
function jnFichePage(id){const t=jnTexte(id),pg=JN.pg[id],L=jnLignes(t,pg&&pg.n!=null?pg.n:null);
  return `<div class="jpage"><h3>${jnE(L.titre)}</h3>${L.lignes.map(l=>`<p>${jnE(l)}</p>`).join('')}${L.analyse.map(l=>`<p class="jnana">${jnE(l)}</p>`).join('')}</div>`;}
function jnRendu(){jnSync(true);const E=jnEntrees(JN_TAB);let n=JN_SEL[JN_TAB];
  if(n==null||!E[n]||!E[n].connu){n=E.findIndex(e=>e.connu);JN_SEL[JN_TAB]=n<0?null:n;}
  const e=n!=null&&n>=0?E[n]:null;
  if(e&&!JN.ouv[e.cle]){JN.ouv[e.cle]=1;jnSauve();}
  $('jdbTabs').innerHTML=jnOngletsHTML();$('jdbListe').innerHTML=jnListeHTML(E);
  $('jdbFiche').innerHTML=!e?`<p class="jman">AUCUNE ENTRÉE.</p>`:e.cle.startsWith('r:')?jnFicheRobot(e.k):e.cle.startsWith('o:')?jnFicheObjet(e.k)
    :e.cle.startsWith('h:')?jnFicheHack(e.k):jnFichePage(e.k);
  $('jdbFiche').scrollTop=0;const b=$('jdbListe').querySelector('.sel');if(b)b.scrollIntoView({block:'nearest'});jnBouton();}
function jnOuvre(){if(typeof G==='undefined'||!G)return;if(typeof TRAV!=='undefined'&&TRAV)stopTravel();if(typeof EXPL!=='undefined'&&EXPL)stopExplore();
  if(typeof REST!=='undefined'&&REST)stopRest();$('jdb').hidden=false;jnRendu();$('jdb').querySelector('.mcard').focus();SFX.spot();}
function jnFerme(){if($('jdb').hidden)return;$('jdb').hidden=true;render();}
function jnOnglet(t){if(!JN_ONGLETS.some(o=>o[0]===t))return;JN_TAB=t;jnRendu();const b=$('jdbTabs').querySelector('.sel');if(b)b.focus();}
function jnChoix(n){JN_SEL[JN_TAB]=n;jnRendu();}
function jnKey(ev){const k=ev.key;
  if(k==='Escape'||k.toLowerCase()==='j'){ev.preventDefault();jnFerme();return;}
  if(k==='ArrowLeft'||k==='ArrowRight'){ev.preventDefault();const i=JN_ONGLETS.findIndex(o=>o[0]===JN_TAB),d=k==='ArrowLeft'?-1:1;
    jnOnglet(JN_ONGLETS[(i+d+JN_ONGLETS.length)%JN_ONGLETS.length][0]);return;}
  if(k==='ArrowUp'||k==='ArrowDown'){ev.preventDefault();const E=jnEntrees(JN_TAB),d=k==='ArrowUp'?-1:1;let n=JN_SEL[JN_TAB]??-1;
    for(let i=0;i<E.length;i++){n=(n+d+E.length)%E.length;if(E[n].connu)break;}if(E[n]&&E[n].connu)jnChoix(n);}}
// le bouton JOURNAL porte une pastille tant qu'une entrée n'a pas été ouverte
function jnBouton(){const b=$('jdbBtn');if(!b)return;b.classList.toggle('neuf',JN_ONGLETS.some(([t])=>jnEntrees(t).some(jnNeuf)));}
$('jdbBtn').onclick=()=>{$('jdbBtn').blur();if($('overlay').hidden)jnOuvre();};
$('jdbClose').onclick=jnFerme;
$('jdb').addEventListener('pointerdown',ev=>{if(ev.target===$('jdb'))jnFerme();});
$('jdbTabs').addEventListener('click',ev=>{const b=ev.target.closest('.jtab');if(b)jnOnglet(b.dataset.t);});
$('jdbListe').addEventListener('click',ev=>{const b=ev.target.closest('.jli');if(b&&!b.disabled)jnChoix(+b.dataset.n);});

/* ----- Lab : tout débloquer, effacer (confirmation dans la page : le bouton demande un second clic) ----- */
function jnToutDebloquer(){for(const [k] of ESPECES()){const r=jnRob(k);r.vu=1;r.s=1;r.c=1;r.o=1;r.det=Math.max(r.det,JN_STATS);}
  for(const k of jnObjets())JN.obj[k]=1;for(const h of jnHacks())JN.hk[h]=HACKS[h].f==='noyau'?1:10;
  for(const t of jnTous())if(!JN.pg[t.id])JN.pg[t.id]=/\{NUM\}/.test(t.titre)?{n:0}:{};jnSauve();jnBouton();}
function jnEfface(){const raz=Date.now();JN=jnVide();JN.raz=raz;JN_SEL={};jnSauve();jnBaseEcrit();jnBouton();}
$('jnLabTout').onclick=()=>{jnToutDebloquer();$('jnLabTout').textContent='Journal : tout débloqué';
  setTimeout(()=>{$('jnLabTout').textContent='Journal : tout débloquer';},2000);};
$('jnLabEff').onclick=()=>{const b=$('jnLabEff');
  if(!JN_CONF){JN_CONF=setTimeout(()=>{JN_CONF=0;b.textContent='Journal : effacer';b.classList.remove('conf');},4000);
    b.textContent='Confirmer l’effacement ?';b.classList.add('conf');return;}
  clearTimeout(JN_CONF);JN_CONF=0;jnEfface();b.textContent='Journal effacé';b.classList.remove('conf');
  setTimeout(()=>{b.textContent='Journal : effacer';},2000);};
jnBouton();
