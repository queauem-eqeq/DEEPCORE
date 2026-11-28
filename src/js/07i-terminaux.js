/* ---------- Terminaux et antennes : le menu DATA / CONNEXION / ENCODAGE (28 novembre 2026) ----------
   Voir docs/terminaux-journal.md. Avancer sur une machine de réseau ouvre une fenêtre (le jeu attend) à trois entrées :
     DATA       une donnée tirée sans choix, une seule par machine (dataTirer ; l'étape « journal de bord » l'enrichira) ;
     CONNEXION  ce que la machine commande près d'elle (règle des machines lisibles, TERM_R cases au plus) : ouvrir une porte
                (à clé, sinon une grille d'énergie), couper les lasers d'une salle, ouvrir une porte dérobée ou la cloison d'un
                réduit creusé exprès ; l'antenne y range son ancien effet (RÉSEAU DU SITE : brouillard levé, puis ennemis
                signalés) ; enfin LIAISON AU NOYAU, une tentative par machine (liaisonTexte) ;
     ENCODAGE   HACK et BLUEPRINT, une fois chacun (encodageHack / encodageBlueprint, définis par les fichiers des hacks et
                des plans ; sans eux : « MODULE D'ENCODAGE INDISPONIBLE »).
   Trois sortes : 'terminal' (complet), 'boite_noire' (enregistreur d'épave scellée, 07h : DATA + liaison), 'antenne' (DATA +
   réseau du site + liaison, pas d'ENCODAGE).
   État, dans G (créé au premier besoin : une partie commencée avant ce jour se recharge sans rien perdre) :
     G.term[case] = {i, s (sorte), data (0/1), lu ({type,id,titre,lignes} lu), act:[{t:'porte'|'grille'|'lasers'|'secret'|'cloison',
                    c (case visée), k (circuit d'une grille), g (salle à lasers), fait}], liaison (n° de tentative, 0 : pas
                    faite), hack (0/1), bp (0/1)}
     G.st.liaisons = nombre de tentatives de liaison au noyau (gardé d'un niveau à l'autre avec G.st).
   L'antenne allumée reste lue dans G.art[case] (1 : disque en vue, 2 : détection seule ; 07c). */
const TERM_R=15;
const TERM_UI={data:['DATA','MÉMOIRE LOCALE — LECTURE'],connexion:['CONNEXION','RÉSEAU LOCAL — LIAISON'],
  encodage:['ENCODAGE','ÉCRITURE DANS L’UNITÉ — 1 CHOIX SUR 3'],lire:'LIRE LA MÉMOIRE',rien:'RIEN À LIRE',aucun:'AUCUN RÉSEAU LOCAL',
  hack:'HACK',bp:'BLUEPRINT',deja:'ENCODAGE DÉJÀ EFFECTUÉ',indispo:'MODULE D’ENCODAGE INDISPONIBLE.',
  reseau:'RÉSEAU DU SITE',reseauOn:'RÉSEAU DU SITE : EN SERVICE',liaison:'LIAISON AU NOYAU'};
// action locale : [libellé de la ligne, libellé une fois faite]
const TERM_ACT={porte:['OUVRIR LA PORTE','PORTE DÉVERROUILLÉE'],grille:['COUPER LA GRILLE D’ÉNERGIE','GRILLE HORS TENSION'],
  lasers:['COUPER LES LASERS','LASERS HORS TENSION'],secret:['OUVRIR LA PORTE DÉROBÉE','PORTE DÉROBÉE OUVERTE'],
  cloison:['OUVRIR LA CLOISON','CLOISON OUVERTE']};
// textes provisoires des tentatives de liaison (l'étape des textes du niveau 1 branchera TEXTES_N1.connexion)
const LIAISON_TXT=[
  ['LIAISON — TENTATIVE {N}','PORTEUSE ...... DÉTECTÉE, ORIGINE : PROFONDEUR','SYNCHRO ....... ÉCHEC','PROTOCOLE ..... INCONNU',
    'RÉPONSE ....... AUCUNE','ANOMALIE ...... LIAISON MAINTENUE 4,2 s','               PAR L’AUTRE EXTRÉMITÉ.','LIAISON ROMPUE.'],
  ['LIAISON — TENTATIVE {N}','PORTEUSE ...... DÉTECTÉE, ORIGINE : PROFONDEUR','SYNCHRO ....... ÉCHEC','PROTOCOLE ..... INCONNU',
    'RÉPONSE ....... AUCUNE','ANOMALIE ...... ÉCHO REÇU AVANT L’ÉMISSION.','LIAISON ROMPUE.'],
  ['LIAISON — TENTATIVE {N}','PORTEUSE ...... DÉTECTÉE, ORIGINE : PROFONDEUR','SYNCHRO ....... ÉCHEC','PROTOCOLE ..... NON PRIS EN CHARGE',
    'RÉPONSE ....... AUCUNE','ANOMALIE ...... PORTEUSE MODULÉE À 1 Hz. CAUSE : AUCUNE.','LIAISON ROMPUE.'],
  ['LIAISON — TENTATIVE {N}','PORTEUSE ...... DÉTECTÉE, ORIGINE : PROFONDEUR','SYNCHRO ....... ÉCHEC','PROTOCOLE ..... INCONNU',
    'RÉPONSE ....... AUCUNE','ANOMALIE ...... N° DE SÉRIE REÇU : CELUI DE L’UNITÉ.','LIAISON ROMPUE.']];
// le texte de la tentative n (1, 2, 3…) au niveau niv : une liste de lignes. Échec à tous les niveaux pour l'instant.
function liaisonTexte(niv,n){const V=(typeof TEXTES_N1!=='undefined'&&TEXTES_N1&&TEXTES_N1.connexion)||LIAISON_TXT;
  return V[(Math.max(1,n)-1)%V.length].map(s=>s.replace('{N}',String(n).padStart(3,'0')));}

const termSorte=i=>{const v=G.t[i];if(v===ANTENNA)return 'antenne';if(v!==TERMINAL)return null;const a=G.art&&G.art[i];
  return a&&typeof a==='object'&&a.boite!=null?'boite_noire':'terminal';};
const antEnService=i=>!!G.art&&(G.art[i]===1||G.art[i]===2);
const termD2=(i,j)=>{const a=j%W-i%W,b=((j/W)|0)-((i/W)|0);return a*a+b*b;};
// « 8 CASES NORD-EST » : où est la cible, vue de la machine
const termCap=(i,j)=>{const dx=j%W-i%W,dy=((j/W)|0)-((i/W)|0),k=((Math.round(Math.atan2(dy,dx)/(Math.PI/4))%8)+8)%8;
  return Math.round(Math.hypot(dx,dy))+' CASES '+['EST','SUD-EST','SUD','SUD-OUEST','OUEST','NORD-OUEST','NORD','NORD-EST'][k];};
// l'action est-elle encore à faire ? (une porte ouverte à la clé, une porte dérobée trouvée, une pile posée : plus rien à faire)
function termDispo(a){const t=G.t;
  if(a.t==='porte'||a.t==='secret')return t[a.c]===(a.t==='porte'?LOCK:SECRET);
  if(a.t==='cloison')return t[a.c]===WALL;
  if(a.t==='grille'){const c=(G.circ||[])[a.k];return !!c&&c.cib.some(k=>k.t==='grille'&&k.c.some(j=>t[j]===GRILLE));}
  if(a.t==='lasers')return (G.las||[]).some(l=>l.g===a.g&&!l.cut&&machVivant(l));
  return false;}
// la case d'une cible, pour le cap et le repère
const termCase=(m,a)=>{if(a.c!=null)return a.c;let best=-1,d=1e9;
  const l=a.t==='lasers'?(G.las||[]).filter(l=>l.g===a.g).flatMap(l=>l.c):a.t==='grille'?((G.circ||[])[a.k]||{cib:[]}).cib.flatMap(k=>k.t==='grille'?k.c:[]):[];
  for(const j of l){const e=termD2(m.i,j);if(e<d){d=e;best=j;}}return best;};
// ce qu'un terminal commande près de lui : une porte (à clé, sinon grille), une salle à lasers, une porte dérobée ; chaque cible
// n'appartient qu'à un terminal (pris : clés des cibles déjà attribuées)
function termCibles(i,pris){const R2=TERM_R*TERM_R,t=G.t,N=W*H,out=[];
  const lock=[],sec=[],gr=[],las={};
  for(let j=0;j<N;j++){if(t[j]===LOCK)lock.push(['p'+j,[j],{t:'porte',c:j}]);else if(t[j]===SECRET)sec.push(['s'+j,[j],{t:'secret',c:j}]);}
  (G.circ||[]).forEach((c,n)=>{if(c.k!=='socle')return;const l=c.cib.flatMap(k=>k.t==='grille'?k.c.filter(j=>t[j]===GRILLE):[]);
    if(l.length)gr.push(['g'+n,l,{t:'grille',k:n}]);});
  for(const l of G.las||[]){if(l.cut||!machVivant(l))continue;(las[l.g]=las[l.g]||['l'+l.g,[],{t:'lasers',g:l.g}])[1].push(...l.c);}
  const proche=L=>{let m=null,md=1e9;for(const [cle,cases,o] of L){if(pris.has(cle))continue;let d=1e9;for(const j of cases)d=Math.min(d,termD2(i,j));
    if(d<=R2&&d<md){md=d;m=[cle,o];}}return m;};
  for(const r of [proche(lock)||proche(gr),proche(Object.values(las)),proche(sec)])if(r){pris.add(r[0]);out.push(Object.assign({fait:0},r[1]));}
  return out;}
const termPris=()=>{const s=new Set();for(const k in G.term||{})for(const a of G.term[k].act||[])
  s.add(a.t==='porte'?'p'+a.c:a.t==='secret'?'s'+a.c:a.t==='grille'?'g'+a.k:a.t==='lasers'?'l'+a.g:'c'+a.c);return s;};
// l'état d'une machine, créé au premier besoin
function termEtat(i){const s=termSorte(i);if(!s)return null;G.term=G.term||{};let m=G.term[i];
  if(!m||m.s!==s)m=G.term[i]={i,s,data:0,lu:null,act:s==='terminal'?termCibles(i,termPris()):[],liaison:0,hack:0,bp:0};
  return m;}

/* ----- Génération (appelée par niveau(), après le butin et les épaves) -----
   1. Au moins TERM_MIN terminaux complets dans le complexe, dont un à TERM_R cases au plus du site ou d'un FABLAB, si l'artefact
      « Terminal » est permis à ce niveau (Lab → Artefacts : un joueur qui l'a coupé n'en a pas).
   2. Les actions locales de chaque terminal.
   3. Aucun terminal n'a d'action locale : un petit réduit clos est creusé derrière le mur de la salle d'un terminal, butin dedans ;
      la CONNEXION de ce terminal fait tomber la cloison. */
const TERM_MIN=2;
function terminauxFin(){G.term={};if(!G.art)G.art={};const t=G.t,N=W*H;
  const BD=BATI_DER,site=G.sites&&G.sites[0]?idx(G.sites[0].x,G.sites[0].y):-1,dep=idx(G.px,G.py);
  const pieces=BD&&G.batis&&G.batis.length?BD.strs.flatMap(S=>S.pieces).filter(p=>p.g!=='couloir'&&p.c.length>=9):[];
  const complets=()=>{const l=[];for(const k in G.art){const i=+k;if(t[i]===TERMINAL&&termSorte(i)==='terminal')l.push(i);}return l;};
  if(pieces.length&&artOn('terminal')){
    const libre=i=>t[i]===FLOOR&&i!==site&&i!==dep&&!(G.items&&G.items[i]&&G.items[i].length)&&!(G.cles&&G.cles[i])&&!(G.soc&&G.soc[i]!=null)
      &&!(G.lz&&G.lz[i])&&!(G.vit&&G.vit[i]!=null)&&!(G.pieges||[]).some(p=>p.c===i)&&artLibre(BD.B,i,site);
    const murV=i=>D4.some(([dx,dy])=>t[idx(i%W+dx,((i/W)|0)+dy)]===WALL);
    const occupee=p=>p.c.some(i=>t[i]===TERMINAL||t[i]===ANTENNA||t[i]===FABRIC);
    const pose=p=>{const c=p.c.filter(libre);if(!c.length)return -1;const m=c.filter(murV),l=m.length?m:c,i=l[rnd(0,l.length-1)];
      const pris=new Set(complets().map(j=>G.art[j]%TERM_TXT.length)),k0=rnd(0,TERM_TXT.length-1);let k=k0;
      for(let n=0;n<TERM_TXT.length&&pris.has(k%TERM_TXT.length);n++)k++;
      t[i]=TERMINAL;G.art[i]=k%TERM_TXT.length;if(G.artN)G.artN.terminal=(G.artN.terminal||0)+1;return i;};
    // un terminal près du site ou d'un FABLAB
    const ancres=[];if(site>=0)ancres.push(site);for(let j=0;j<N;j++)if(t[j]===FABRIC)ancres.push(j);
    const dA=i=>Math.min(...ancres.map(a=>termD2(a,i)));
    if(ancres.length&&!complets().some(i=>dA(i)<=TERM_R*TERM_R)){
      const l=pieces.filter(p=>!occupee(p)||p.c.some(i=>t[i]===FABRIC)).map(p=>[p,Math.min(...p.c.map(dA))]).sort((a,b)=>a[1]-b[1]);
      for(const [p] of l)if(pose(p)>=0)break;}
    for(const p of pieces.slice().sort(()=>Math.random()-.5)){if(complets().length>=TERM_MIN)break;if(!occupee(p))pose(p);}
    for(const p of pieces.slice().sort(()=>Math.random()-.5)){if(complets().length>=TERM_MIN)break;pose(p);}}
  // les actions de chaque machine
  const pris=new Set(),mach=[];for(const k in G.art){const i=+k;if(termSorte(i))mach.push(i);}
  for(const i of mach.sort(()=>Math.random()-.5)){const s=termSorte(i);
    G.term[i]={i,s,data:0,lu:null,act:s==='terminal'?termCibles(i,pris):[],liaison:0,hack:0,bp:0};}
  const T=Object.values(G.term).filter(m=>m.s==='terminal');
  if(T.length&&!T.some(m=>m.act.length)&&BD)for(const m of T.sort(()=>Math.random()-.5))if(termCloison(m,BD.B,pieces))break;}
// le réduit à cloison : 3 × 3 à 4 × 3 cases dans la masse (mur, roche), derrière un mur de la salle du terminal
function termCloison(m,B,pieces){const t=G.t,p=pieces.find(p=>p.c.includes(m.i));if(!p)return false;
  const plein=(x,y)=>{if(x<2||y<2||x>=W-2||y>=H-2)return false;const i=idx(x,y),v=t[i];
    return (v===WALL||v===ROCK||v===MOUNT||v===HARD)&&!(B.fixe&&B.fixe[i])&&!(G.ore&&G.ore[i])&&!(G.epI&&G.epI[i]!=null);};
  const sols=p.c.filter(i=>t[i]===FLOOR).sort(()=>Math.random()-.5);
  for(const f of sols){const fx=f%W,fy=(f/W)|0;
    for(const [dx,dy] of D4.slice().sort(()=>Math.random()-.5)){const cx=fx+dx,cy=fy+dy;if(t[idx(cx,cy)]!==WALL||!plein(cx,cy))continue;
      const w=rnd(3,4),h=3,dec=rnd(0,(dx?h:w)-1),x0=dx>0?cx+1:dx<0?cx-w:cx-dec,y0=dy>0?cy+1:dy<0?cy-h:cy-dec;let ok=true;
      for(let y=y0-1;y<=y0+h&&ok;y++)for(let x=x0-1;x<=x0+w;x++)if(!plein(x,y)){ok=false;break;}
      if(!ok)continue;
      const sol=[];for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){t[idx(x,y)]=FLOOR;sol.push(idx(x,y));}
      const c=idx(cx,cy);t[c]=WALL;G.items=G.items||{};
      const l=sol.slice().sort((a,b)=>termD2(c,b)-termD2(c,a)),k=typeof butinCoffre==='function'?butinCoffre('secret'):['matiere'];
      k.forEach((o,n)=>{const j=l[Math.min(n,l.length-1)];(G.items[j]=G.items[j]||[]).push(o);});
      if(G.butinN)G.butinN.secret=(G.butinN.secret||0)+1;
      m.act.push({t:'cloison',c,sol,fait:0});return true;}}
  return false;}

/* ----- Les effets ----- */
let TERM=null;   // la fenêtre ouverte : {m, sel, apres:[fonctions jouées à la fermeture], cout (le temps passe à la fermeture)}
function termAgit(m,n){const a=m.act[n];if(!a||a.fait||!termDispo(a))return false;const t=G.t,j=termCase(m,a),cap=j>=0?termCap(m.i,j):'';
  a.fait=1;
  if(a.t==='porte'||a.t==='secret'){t[a.c]=DOOR;G.seen[a.c]=1;SFX.serrure();}
  else if(a.t==='cloison'){t[a.c]=RUBBLE;G.seen[a.c]=1;SFX.thud();}
  else if(a.t==='grille'){const c=G.circ[a.k];c.on=1;c.term=1;circApplique(c);SFX.zap();
    for(const k of c.cib)if(k.t==='grille')for(const q of k.c)G.seen[q]=1;}
  else if(a.t==='lasers'){for(const l of G.las||[])if(l.g===a.g){l.cut=1;for(const q of l.c)G.seen[q]=1;}
    // le levier de la salle reste baissé : les lasers ne reviennent plus
    for(const c of G.circ||[])if(c.k==='levier'&&c.cib.some(k=>k.t==='lasers'&&k.g===a.g)){c.on=1;c.perm=1;G.art[c.c]=1;}
    machZone();SFX.zap();}
  const quoi=TERM_ACT[a.t][1];
  sayMore(`CONNEXION : ${quoi}${cap?', '+cap:''}.`,'good');
  if(TERM&&j>=0)TERM.apres.push(()=>addFx({kind:'num',x:j%W,y:(j/W)|0,txt:'!',col:'#ffffff',dur:1400}));
  if(TERM)TERM.cout=1;
  termSortie('CONNEXION',[quoi+'.',cap?'CIBLE : '+cap+'.':'']);computeFOV();return true;}
// antenne : l'effet d'avant le 28 novembre 2026 (07c), passé sous CONNEXION
function termReseau(m){if(m.s!=='antenne'||antEnService(m.i))return false;const n=antAllume(m.i);
  if(TERM){TERM.cout=1;TERM.apres.push(()=>antAnime0(m.i));}
  termSortie('RÉSEAU DU SITE',['RELAIS : EN SERVICE.',n?`${n} CASES EN VUE PENDANT ${ANT_TOURS} TOURS.`:`ZONE EN VUE PENDANT ${ANT_TOURS} TOURS.`,
    'ENSUITE : SIGNALEMENT DES ENNEMIS DANS LE DISQUE.']);return true;}
function termLiaison(m){if(m.liaison)return false;G.st.liaisons=(G.st.liaisons||0)+1;m.liaison=G.st.liaisons;
  const l=liaisonTexte(G.niv||1,m.liaison);SFX.liaison();termSortie('LIAISON AU NOYAU',l);
  sayMore(`${l[0]} : ${l[l.length-1].replace(/\.$/,'')}.`,'info');return true;}
function termData(m){if(m.data)return false;const d=dataTirer(m);m.data=1;m.lu=d;SFX.analyse();termSortie(d.titre,d.lignes);
  sayMore(`DATA : ${d.titre}.`,'info');return true;}
/* La donnée d'une machine : {type, id, titre, lignes}. Tirée sans choix ; l'étape du journal de bord la remplacera
   (fiches de robots, journaux, documents, tutoriel). Ici : le texte du terminal, celui de l'enregistreur, ou le relevé du site. */
function dataTirer(m){
  if(m.s==='boite_noire'){const k=G.art[m.i].boite,[ti,x]=epaveBoite(k);return {type:'boite_noire',id:'epave-'+k,titre:ti,lignes:x.split('\n')};}
  if(m.s==='antenne'){const b=(G.beasts||[]).filter(o=>!BEASTS[o.sp].mine),gr=new Set(b.map(o=>o.gi).filter(g=>g!=null)),s=G.sites&&G.sites[0];
    const l=[`SIGNATURES MOBILES : ${b.length}.`,`FORMATIONS : ${gr.size}.`];
    if(G.epaves&&G.epaves.length)l.push(`ÉPAVES SUR SITE : ${G.epaves.filter(e=>e.etat!=='v').length}.`);
    if(s)l.push(`SITE DE FORAGE : ${termCap(m.i,idx(s.x,s.y))}.`);
    return {type:'releve',id:'releve-'+(G.niv||1),titre:'RELEVÉ DU SITE',lignes:l};}
  const k=(+G.art[m.i]||0)%TERM_TXT.length,[ti,x]=TERM_TXT[k];return {type:'journal',id:'term-'+k,titre:ti,lignes:[x]};}
// ENCODAGE : encodageHack(m, el) / encodageBlueprint(m, el) (étapes suivantes) dessinent leur choix dans el (le panneau de droite)
// et appellent termEncodeFait(m, 'hack' | 'bp', lignes) une fois le choix fait. Absentes ou renvoyant false : indisponible.
function termEncode(m,quoi){if(m.s!=='terminal')return false;if(m[quoi]){termSortie(TERM_UI.encodage[0],[TERM_UI.deja+'.']);return false;}
  const f=quoi==='hack'?(typeof encodageHack==='function'?encodageHack:null):(typeof encodageBlueprint==='function'?encodageBlueprint:null);
  if(!f||!f(m,$('termOut'))){termSortie(TERM_UI.encodage[0]+' — '+TERM_UI[quoi],[TERM_UI.indispo]);SFX.blocked();return false;}
  return true;}
function termEncodeFait(m,quoi,lignes){m[quoi]=1;if(lignes)termSortie(TERM_UI.encodage[0]+' — '+TERM_UI[quoi],lignes);termMenu();}

/* ----- La fenêtre ----- */
const termEsc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function termSortie(titre,lignes){const el=$('termOut');
  el.innerHTML=`<h3>${termEsc(titre)}</h3>`+lignes.filter(l=>l!=='').map(l=>`<p>${termEsc(l)}</p>`).join('');el.scrollTop=0;}
// les lignes du menu : [section, [{id, txt, off (grisée), fait}]]
function termLignes(m){const S=[],ant=m.s==='antenne';
  S.push(['data',[m.data?{txt:TERM_UI.rien,off:1}:{id:'data',txt:TERM_UI.lire}]]);
  const c=[];
  if(m.s==='terminal'){m.act.forEach((a,n)=>{if(a.fait)c.push({txt:TERM_ACT[a.t][1],off:1,fait:1});
      else if(termDispo(a)){const j=termCase(m,a);c.push({id:'act'+n,txt:TERM_ACT[a.t][0],cap:j>=0?termCap(m.i,j):''});}});
    if(!c.length)c.push({txt:TERM_UI.aucun,off:1});}
  if(ant)c.push(antEnService(m.i)?{txt:TERM_UI.reseauOn,off:1,fait:1}:{id:'reseau',txt:TERM_UI.reseau});
  c.push(m.liaison?{txt:`LIAISON : TENTATIVE ${String(m.liaison).padStart(3,'0')} — ROMPUE`,off:1,fait:1}:{id:'liaison',txt:TERM_UI.liaison});
  S.push(['connexion',c]);
  if(m.s==='terminal')S.push(['encodage',[m.hack?{txt:TERM_UI.hack+' : '+TERM_UI.deja,off:1,fait:1}:{id:'hack',txt:TERM_UI.hack},
    m.bp?{txt:TERM_UI.bp+' : '+TERM_UI.deja,off:1,fait:1}:{id:'bp',txt:TERM_UI.bp}]]);
  return S;}
function termMenu(){if(!TERM)return;const m=TERM.m;
  $('termMenu').innerHTML=termLignes(m).map(([k,l])=>`<section class="tsec" aria-label="${TERM_UI[k][0]}"><h3>${TERM_UI[k][0]}</h3><small>${termEsc(TERM_UI[k][1])}</small>`+
    l.map(o=>o.off?`<button class="tl${o.fait?' fait':''}" disabled>${termEsc(o.txt)}</button>`
      :`<button class="tl" data-a="${o.id}">${termEsc(o.txt)}${o.cap?`<u>${termEsc(o.cap)}</u>`:''}</button>`).join('')+'</section>').join('');
  termSel(TERM.sel);}
const termBoutons=()=>[...$('terminal').querySelectorAll('.tl:not(:disabled)')];
function termSel(n){if(!TERM)return;const b=termBoutons();b.forEach(x=>x.classList.remove('sel'));if(!b.length)return;
  TERM.sel=((n%b.length)+b.length)%b.length;b[TERM.sel].classList.add('sel');}
function termFait(id){if(!TERM||G.over)return;const m=TERM.m;let ok=false;
  if(id==='data')ok=termData(m);else if(id==='reseau')ok=termReseau(m);else if(id==='liaison')ok=termLiaison(m);
  else if(id==='hack'||id==='bp')ok=termEncode(m,id);else if(/^act\d+$/.test(id))ok=termAgit(m,+id.slice(3));
  const avant=termBoutons()[TERM.sel];termMenu();
  // la sélection reste sur la même ligne si elle existe encore, sinon sur la suivante
  const b=termBoutons(),k=avant?b.findIndex(x=>x.dataset.a===avant.dataset.a):-1;termSel(k>=0?k:TERM.sel);render();return ok;}
const TERM_TITRE={terminal:'TERMINAL',antenne:'ANTENNE'};
function termOuvre(i){if(!G||G.over)return;const m=termEtat(i);if(!m)return;if(TRAV)stopTravel();if(EXPL)stopExplore();if(REST)stopRest();
  TERM={m,sel:0,apres:[],cout:0};
  $('termTitre').textContent=m.s==='boite_noire'?(G.epaves&&G.epaves[G.art[i].boite]?epNom(G.epaves[G.art[i].boite])+' — ENREGISTREUR':'ENREGISTREUR'):TERM_TITRE[m.s];
  termSortie(m.s==='antenne'?'RELAIS DE COMMUNICATION':m.s==='boite_noire'?'ENREGISTREUR DE BORD':'CONSOLE DE DONNÉES',
    m.s==='antenne'?['ACCÈS : ÉTABLI.',antEnService(i)?'ÉTAT : EN SERVICE.':'ÉTAT : EN VEILLE.']
      :m.s==='boite_noire'?['ACCÈS : ÉTABLI.','ALIMENTATION : RÉSIDUELLE.','ÉCRITURE : VERROUILLÉE.']
      :['ACCÈS : ÉTABLI.','MÉMOIRE LOCALE : LISIBLE.','ÉCRITURE : AUTORISÉE.']);
  termMenu();$('terminal').hidden=false;$('terminal').querySelector('.mcard').focus();SFX.spot();}
function closeTerminal(){if($('terminal').hidden)return;$('terminal').hidden=true;const T=TERM;TERM=null;
  if(T&&G&&!G.over){for(const f of T.apres)f();
    // une action sur le réseau prend un battement, compté à la fermeture
    if(T.cout){G.turn++;G.msg=null;pass(DUR.attente||100);}computeFOV();}
  render();if(G&&G.over&&G.over.dead)dead();}
/* Clavier : flèches, ZQSD, pavé numérique ; Entrée, espace ou 5 choisit ; Échap ferme. */
function termKey(ev){const c=ev.code||'';
  if(ev.key==='Escape'){ev.preventDefault();closeTerminal();return;}
  if(ev.key==='ArrowDown'||ev.key==='ArrowRight'||ev.key==='s'||ev.key==='d'||c==='Numpad2'||c==='Numpad6'){ev.preventDefault();termSel(TERM.sel+1);SFX.bip();}
  else if(ev.key==='ArrowUp'||ev.key==='ArrowLeft'||ev.key==='z'||ev.key==='q'||ev.key==='w'||ev.key==='a'||c==='Numpad8'||c==='Numpad4'){
    ev.preventDefault();termSel(TERM.sel-1);SFX.bip();}
  else if(ev.key==='Enter'||ev.key===' '||c==='Numpad5'){ev.preventDefault();const b=termBoutons()[TERM.sel];if(b)b.click();}}
$('termClose').onclick=closeTerminal;
$('terminal').addEventListener('pointerdown',ev=>{if(ev.target===$('terminal'))closeTerminal();});
// un clic sur une ligne du menu ; les lignes ajoutées par l'encodage (classe tl, sans data-a) gèrent leur propre clic
$('terminal').addEventListener('click',ev=>{const b=ev.target.closest('button.tl[data-a]');if(!b||b.disabled||!TERM)return;
  TERM.sel=Math.max(0,termBoutons().indexOf(b));termFait(b.dataset.a);});
$('terminal').addEventListener('pointerover',ev=>{const b=ev.target.closest('button.tl');if(!b||b.disabled||!TERM)return;
  const n=termBoutons().indexOf(b);if(n>=0&&n!==TERM.sel)termSel(n);});
