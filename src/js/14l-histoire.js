/* ---------- Le niveau 1 raconté (28 novembre 2026) ----------
   Voir docs/histoire.md et docs/histoire-niveau-1.md (ton, cinq canaux, textes de référence), docs/conception-joueur.md (« Numéro
   d'unité et registre du port ») et docs/conception-descente.md (« Rapport de mission »). Les textes sont dans TEXTES_N1 (14j).
   – Numéro d'unité : F467 à la première partie, +1 à chaque destruction de la foreuse (uniteMort, appelée par dead), jamais à une
     partie recommencée. np-unite (navigateur) et JN.u (journal de bord, donc aussi dans la base de l'artefact). uniteApplique, au
     début de chaque partie, met à jour NOM_FOREUSE / EPV_UNITE et réécrit les textes construits au chargement (uniteTextes).
   – Registre du port : np-registre (et JN.reg) = [{u : numéro d'unité, f : numéro de sa fosse}], une entrée par unité, notée au
     début de chaque partie au niveau 1. registreLignes() : les 6 dernières unités précédentes (LIBÉRÉE), complétées au besoin par
     les épaves aux plus grands numéros de la carte (deux lignes au moins avant la nôtre), puis la partie en cours. Le premier DATA
     d'un terminal du dépôt (G.regTerm, le plus proche du sas) est toujours le registre ; la page du journal de bord garde le
     registre tel qu'il était à la dernière lecture.
   – Journal de la foreuse (canal 1) : n1Debut (atterrissage), n1Vue (appelée par computeFOV : premier contact, épaves vues 1re / 5e /
     14e, état de chaque sorte d'épave à la première rencontre, fosse vide, FABLAB, terminal, antenne, entrée au dépôt). Une ligne
     par battement au plus (file G.h1.q), le contact passe tout de suite.
   – Fin de niveau : à l'entrée au dépôt, un groupe de ferrailleuses à l'ouvrage (non provoqué) prend NOTRE vaisseau pour épave
     (n1Fin) ; une ligne au journal si la foreuse les voit autour.
   – Rapport de mission (canal 2) : rapportMission() (avant la descente du niveau 1), affiché par fgRapport (14b), rangé au journal
     de bord (page rapport_1), rapportEnvoye() écrit la ligne de transmission au journal du jeu à l'arrivée. */
const UNITE_CLE='np-unite',REG_CLE='np-registre',REG_N=6,UNITE_RX=/\bF\d{3,5}\b/g;
const n1Ap=s=>String(s).replace(/'/g,'’');   // apostrophe typographique, comme le reste du jeu
// un texte du journal de la foreuse (TEXTES_N1.journal[cle]), variante i (au hasard si absente), jetons remplacés, sur une ligne
function n1Texte(cle,i,v){const T=(TEXTES_N1.journal||{})[cle];if(T==null)return '';const l=Array.isArray(T)?T:[T];
  let s=l[i==null?Math.floor(Math.random()*l.length):Math.min(i,l.length-1)];v=Object.assign({UNITE:NOM_FOREUSE},v||{});
  s=s.replace(/\{(\w+)\}/g,(m,k)=>k in v?v[k]:m);return n1Ap(s.split('\n').join(' '));}

/* ----- Numéro d'unité ----- */
const uniteLue=()=>{try{const v=parseInt(localStorage.getItem(UNITE_CLE)||'',10);return v>=467&&v<100000?v:0;}catch(e){return 0;}};
function uniteEcrit(n){try{localStorage.setItem(UNITE_CLE,String(n));}catch(e){}if(JN.u!==n&&n>JN.u){JN.u=n;jnSauve();}}
// les textes construits au chargement qui portent le nom de l'unité (« F467 ») : on y remet le nom en cours
function uniteParcourt(o,vu){if(!o||typeof o!=='object'||vu.has(o)||ArrayBuffer.isView(o))return;vu.add(o);
  for(const k of Object.keys(o)){const d=Object.getOwnPropertyDescriptor(o,k);if(!d||!('value' in d))continue;const v=d.value;
    if(typeof v==='string'){if(d.writable&&/\bF\d{3}/.test(v)){const r=v.replace(UNITE_RX,NOM_FOREUSE);if(r!==v)o[k]=r;}}
    else if(v&&typeof v==='object')uniteParcourt(v,vu);}}
function uniteTextes(){const vu=new Set();
  for(const r of [typeof BEASTS!=='undefined'&&BEASTS,typeof SPECIES!=='undefined'&&SPECIES,typeof ITEMS!=='undefined'&&ITEMS,
    typeof ST_DEF!=='undefined'&&ST_DEF,typeof RECETTES!=='undefined'&&RECETTES,typeof TERM_TXT!=='undefined'&&TERM_TXT,
    typeof ART_LISTE!=='undefined'&&ART_LISTE])if(r)uniteParcourt(r,vu);}
// au début d'une partie : le numéro rangé (navigateur, journal de bord) devient celui de l'unité en service
function uniteApplique(){const n=Math.max(467,uniteLue(),JN.u||0);UNITE_NUM=n;NOM_FOREUSE='F'+n;EPV_UNITE=n;uniteEcrit(n);uniteTextes();}
// destruction de la foreuse : l'unité suivante portera le numéro suivant (une fois par partie)
function uniteMort(){if(typeof G==='undefined'||!G||G.uniteMorte)return;G.uniteMorte=1;uniteEcrit(Math.max(UNITE_NUM,uniteLue(),JN.u||0)+1);}
// la base de l'artefact a répondu (14k) : un numéro plus grand y était rangé (navigateur revenu vide), on le reprend
function uniteBase(){const r=jnRegFusion(regLu(),JN.reg);regEcrit(r);const n=Math.max(uniteLue(),JN.u||0);
  if(n>UNITE_NUM&&(typeof G==='undefined'||!G||!G.uniteMorte)){const av=G&&G.regU;uniteApplique();
    if(G&&av!=null&&av!==UNITE_NUM&&G.fosses){regEcrit(regLu().filter(x=>x.u!==av));regNote();}}}

/* ----- Registre du port ----- */
const regLu=()=>{try{return jnRegSain(JSON.parse(localStorage.getItem(REG_CLE)||'[]'));}catch(e){return [];}};
function regEcrit(r){r=jnRegFusion(r,[]);try{localStorage.setItem(REG_CLE,JSON.stringify(r));}catch(e){}
  if(JSON.stringify(JN.reg)!==JSON.stringify(r)){JN.reg=r;jnSauve();}}
const n1Fosse=()=>G&&G.fosses?G.fosses.find(F=>F.notre)||null:null;
// la partie commence au niveau 1 : son unité et sa fosse entrent au registre (une partie recommencée remplace la fosse)
function regNote(){const F=n1Fosse();if(!F)return;G.regU=UNITE_NUM;regEcrit(regLu().filter(x=>x.u!==UNITE_NUM).concat([{u:UNITE_NUM,f:F.num}]));}
function registreLignes(){const T=TEXTES_N1.registre,F=n1Fosse(),cur=UNITE_NUM,fz=v=>s=>s.replace(/\{(\w+)\}/g,(m,k)=>k in v?v[k]:m);
  let prev=jnRegFusion(regLu(),JN.reg).filter(x=>x.u<cur).slice(-REG_N);
  if(prev.length<2&&G.epaves){const pris=new Set(prev.map(x=>x.u));
    const ep=G.epaves.filter(e=>!e.notre&&e.num<cur&&!pris.has(e.num)).sort((a,b)=>b.num-a.num).slice(0,2-prev.length)
      .map(e=>({u:e.num,f:(G.fosses[e.fosse]||{}).num||0}));prev=ep.concat(prev).sort((a,b)=>a.u-b.u);}
  const L=prev.map(x=>fz({NUM:num4(x.u),FOSSE:num2(x.f)})(T.ligne_arrivee)+T.suffixe_liberee);
  const nf=num2(F?F.num:0);L.push(fz({NUM:num4(cur),FOSSE:nf})(T.ligne_arrivee),T.depart,fz({FOSSE:nf})(T.derniere));
  return {titre:T.entete,lignes:L.map(n1Ap),analyse:T.analyse?n1Ap(T.analyse).split('\n'):[]};}
// le terminal complet du dépôt qui porte le registre : le plus proche de l'entrée (G.sas)
function regTermChoisit(){G.regTerm=-1;if(!G.fosses||!G.term)return;const T=Object.values(G.term).filter(m=>m.s==='terminal');if(!T.length)return;
  const a=G.sas!=null?G.sas:idx(G.px,G.py);T.sort((x,y)=>termD2(a,x.i)-termD2(a,y.i));G.regTerm=T[0].i;}
{const f=terminauxFin;terminauxFin=function(){const r=f.apply(this,arguments);regTermChoisit();return r;};}
// DATA : le registre sur le terminal du dépôt ; la page du journal de bord garde le registre tel qu'il était à cette lecture
function registreData(){const R=registreLignes();JN.pg.registre_port={t:R.titre,l:R.lignes,a:R.analyse.join('\n'),o:'doc',d:Date.now()};
  delete JN.ouv['p:registre_port'];jnSauve();return {type:'document',id:'registre_port',titre:R.titre,lignes:R.lignes,analyse:R.analyse,page:1};}
{const f=dataTirer;dataTirer=function(m){if(m&&m.s==='terminal'&&G.fosses&&G.regTerm===m.i)return registreData();return f(m);};}

/* ----- Journal de la foreuse au niveau 1 ----- */
const n1Actif=()=>typeof G!=='undefined'&&G&&G.niv===1&&!!G.fosses&&!G.over;
function n1Dit(m,tout){if(!m)return;const H=G.h1;if(tout||!H){sayMore(m,'info');return;}H.q.push(m);}
// début de partie au niveau 1 de l'Astroport : l'atterrissage, en jargon (à la place de « Atterrissage confirmé… »)
function n1Debut(){G.h1={q:[],ep:{},nEp:0,et:{},vu:{},qt:-1};regNote();
  say(n1Texte('atterrissage',0),'info');sayMore(n1Texte('soute'),'info');}
const N1_ETAT={s:'epave_scellee',e:'epave_eventree',q:'epave_squelette',v:'fosse_vide'};
const n1EpVue=e=>{for(let y=e.y;y<e.y+e.h;y++)for(let x=e.x;x<e.x+e.w;x++)if(vis[idx(x,y)])return true;return false;};
function n1Vue(){if(!n1Actif())return;const Q=G.h1||(G.h1={q:[],ep:{},nEp:0,et:{},vu:{},qt:-1});
  // premier contact : tous les mobiles en vue, une fois
  if(!Q.contact){const b=(G.beasts||[]).filter(o=>!BEASTS[o.sp].mine&&vis[idx(o.x,o.y)]&&!(typeof beastCache==='function'&&beastCache(o)));
    if(b.length){Q.contact=1;n1Dit(b.length>1?n1Texte('premier_contact',0,{N:b.length}):n1Texte('premier_contact',1),1);}}
  // épaves : la 1re, la 5e et la 14e vues ; chaque état, la première fois
  (G.epaves||[]).forEach((e,k)=>{if(e.notre||Q.ep[k]||!n1EpVue(e))return;Q.ep[k]=1;
    if(e.etat!=='v'){const n=++Q.nEp;if(n===1)n1Dit(n1Texte('epave_vue',0));
      else if(n===5||n===14)n1Dit(n1Texte('epave_vue',1,{N:n}));
      if(n===14)n1Dit(n1Texte('analyse_epaves',0,{N:G.epaves.filter(x=>!x.notre&&x.etat!=='v').length}));}
    if(!Q.et[e.etat]&&N1_ETAT[e.etat]){Q.et[e.etat]=1;n1Dit(n1Texte(N1_ETAT[e.etat],0));}});
  // FABLAB, terminal, antenne : la première fois
  if(!(Q.vu.fab&&Q.vu.term&&Q.vu.ant)){const r=(G.st.capteur||10)+1,t=G.t;
    for(let y=Math.max(0,G.py-r);y<=Math.min(H-1,G.py+r);y++)for(let x=Math.max(0,G.px-r);x<=Math.min(W-1,G.px+r);x++){const i=idx(x,y);
      if(!vis[i])continue;const v=t[i];
      if(v===FABRIC&&!Q.vu.fab){Q.vu.fab=1;n1Dit(n1Texte('fablab_vu',0));}
      else if(v===ANTENNA&&!Q.vu.ant){Q.vu.ant=1;n1Dit(n1Texte('antenne_vue',0));}
      else if(v===TERMINAL&&!Q.vu.term&&termSorte(i)==='terminal'){Q.vu.term=1;n1Dit(n1Texte('terminal_vu',0));}}}
  // entrée au dépôt (le sol bâti du complexe) : une ligne, et la fin de niveau se met en route
  if(!Q.depot&&G.t[idx(G.px,G.py)]===FLOOR){Q.depot=1;n1Dit(n1Texte('depot_entree',0));n1Fin();}
  n1FinVue();
  if(Q.q.length&&Q.qt!==G.turn){Q.qt=G.turn;sayMore(Q.q.shift(),'info');}}

/* ----- Fin de niveau : notre vaisseau, pris pour une épave -----
   Notre cargo devient une « épave » de plus (entrée notre : true au bout de G.epaves, ses plaques de coque marquées dans G.epI)
   seulement à ce moment-là : avant, rien ne tourne autour et l'atterrissage n'est pas un piège. Le groupe de ferrailleuses à
   l'ouvrage (non provoqué, ni alerté) le plus proche du vaisseau y change d'épave : il s'y rend, découpe, fait la navette avec le sas. */
function n1Fin(){if(!G.ship||!G.epaves||G.epaves.some(e=>e.notre))return -1;
  const k=G.epaves.length,e={type:'notre',nom:'CARGO',etat:'n',num:UNITE_NUM,x:G.ship.x,y:G.ship.y,w:SGW,h:SGH,
    fosse:G.fosses.findIndex(F=>F.notre),boite:-1,groupes:[],notre:true};G.epaves.push(e);
  for(let y=0;y<SGH;y++)for(let x=0;x<SGW;x++){const i=idx(G.ship.x+x,G.ship.y+y);if(G.t[i]===SHIP)G.epI[i]=k;}
  const cx=G.ship.x+SGW/2,cy=G.ship.y+SGH/2,mb={};
  for(const o of [...(G.beasts||[]),...(G.animals||[])])if(o.role==='ferraille'&&o.gi!=null&&G.patr&&G.patr[o.gi])(mb[o.gi]=mb[o.gi]||[]).push(o);
  let best=null,bd=1e9;for(const id in mb){const P=G.patr[id];if(P.ouv)continue;
    const d=Math.min(...mb[id].map(o=>Math.hypot(o.x-cx,o.y-cy)));if(d<bd){bd=d;best=id;}}
  if(best==null)return -1;const P=G.patr[best];
  // le point de la navette côté épave : une case praticable au pied de la coque (la plus proche du groupe)
  let pt=null,pd=1e9;const o0=mb[best][0];
  for(let y=e.y-1;y<=e.y+e.h;y++)for(let x=e.x-1;x<=e.x+e.w;x++){if(x<1||y<1||x>=W-1||y>=H-1||!canWalk(G.t[idx(x,y)],true)||!ouvrCoque(k,x,y))continue;
    const d=Math.hypot(x-o0.x,y-o0.y);if(d<pd){pd=d;pt=[x,y];}}
  if(!pt)return -1;
  const av=ouvrEpave(P);if(av)av.groupes=av.groupes.filter(g=>g!==+best);
  P.epave=k;e.groupes.push(+best);for(const o of mb[best])o.epave=k;
  {const q=ouvrQuai(pt[0],pt[1],P.eau);P.pts=q?[pt,q]:[pt];}P.k=0;P.pause=0;P.age=0;P.bh=null;P.bl=0;P.postes=null;P.pat='navette';
  G.h1.fin=+best;return +best;}
// la foreuse les voit autour de notre vaisseau : une ligne, une fois
function n1FinVue(){const H=G.h1;if(H.fin==null||H.finVu)return;const e=G.epaves.find(x=>x.notre);if(!e)return;
  if((G.beasts||[]).concat(G.animals||[]).some(o=>o.gi===H.fin&&o.role==='ferraille'&&vis[idx(o.x,o.y)]&&ouvrDist(e,o.x,o.y)<=2)){
    H.finVu=1;n1Dit(n1Texte('ferrailleuses_sur_notre_vaisseau',0),1);}}

/* ----- Rapport de mission (à la descente du niveau 1) ----- */
const n1Epaves=()=>(G.epaves||[]).filter(e=>!e.notre&&e.etat!=='v').length;
function rapportMission(){if(typeof G==='undefined'||!G||!G.st||(G.niv||1)!==1||!G.fosses)return null;const st=G.st,n=G.neutra||0;
  const v={NUM_RAPPORT:'001',UNITE:NOM_FOREUSE,ETAT:Math.max(0,Math.min(100,Math.round(100*st.vie/(st.vieMax||100)))),MENACES:n,EPAVES:n1Epaves()},
    f=s=>n1Ap(s.replace(/\{(\w+)\}/g,(m,k)=>k in v?v[k]:m)).replace(n<=1?/NEUTRALISÉES/:/$^/,'NEUTRALISÉE');
  const r=(TEXTES_N1.rapport||[]).map(f),a=(TEXTES_N1.accuse||[]).map(f);
  JN.pg.rapport_1={t:r[0],l:r.slice(1).concat(['',...a]),a:'',o:'jou',d:Date.now()};delete JN.ouv['p:rapport_1'];jnSauve();if(typeof jnBouton==='function')jnBouton();
  return {r,a,v};}
function rapportEnvoye(R){if(G&&R)sayMore(n1Texte('rapport_envoye',0,{NUM_RAPPORT:R.v.NUM_RAPPORT}),'info');}
// menaces neutralisées au niveau en cours : chaque destruction comptée par le journal de bord (robots et puces)
{const f=jnDetruit;jnDetruit=function(o,b){if(o&&!o.jn&&typeof G!=='undefined'&&G)G.neutra=(G.neutra||0)+1;return f.apply(this,arguments);};}

/* ----- Libellés du terminal tirés des textes (terminal_ui) ----- */
{const U=TEXTES_N1.terminal_ui||{},a=n1Ap;
  if(U.data_sous_titre)TERM_UI.data[1]=a(U.data_sous_titre);if(U.connexion_sous_titre)TERM_UI.connexion[1]=a(U.connexion_sous_titre);
  if(U.encodage_sous_titre)TERM_UI.encodage[1]=a(U.encodage_sous_titre);if(U.rien_a_lire)TERM_UI.rien=a(U.rien_a_lire);
  if(U.aucun_reseau)TERM_UI.aucun=a(U.aucun_reseau);if(U.encodage_deja)TERM_UI.deja=a(U.encodage_deja);
  if(U.porte_deverrouillee)TERM_ACT.porte[1]=a(U.porte_deverrouillee);if(U.lasers_hors_tension)TERM_ACT.lasers[1]=a(U.lasers_hors_tension);
  if(U.cloison_ouverte)TERM_ACT.cloison[1]=a(U.cloison_ouverte);}

/* ----- Au chargement : navigateur et journal de bord accordés ----- */
{const n=Math.max(UNITE_NUM,JN.u||0);if(n!==UNITE_NUM){UNITE_NUM=n;NOM_FOREUSE='F'+n;EPV_UNITE=n;}uniteEcrit(UNITE_NUM);
  regEcrit(jnRegFusion(regLu(),JN.reg));uniteTextes();}
