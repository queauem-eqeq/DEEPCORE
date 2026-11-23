/* ---------- Groupes d'ennemis (19 novembre 2026) ----------
   La carte n'est plus peuplée espèce par espèce (les intensités du menu Life) mais par GROUPES : un groupe réunit une ou
   plusieurs espèces, chacune avec un effectif minimal et maximal, et porte une VALEUR de menace réglée à la main.
   À chaque nouvelle carte, un budget achète des groupes actifs tirés au hasard jusqu'à épuisement (spawnGroupes, 08-faune).
   Le budget est donné pour la carte de référence (96 × 64) et rapporté à la surface de la carte jouée.
   Les groupes se créent et se règlent dans Lab → Groupes ; la fenêtre LIFE garde le budget et les cases « actif ».
   Chaque groupe porte un ou plusieurs styles de patrouille (errance, voyage, ronde, territoire, sentinelle, affût : voir
   08-faune) ; quand il y en a plusieurs, chaque groupe posé sur la carte en tire un au hasard — et parmi tous les
   styles quand aucun n'est choisi.
   Tout est mémorisé dans le navigateur sous np-groupes. */
const PATS=[['errance','Errance'],['voyage','Voyage en bande'],['ronde','Ronde'],['territoire','Territoire'],['sentinelle','Sentinelle'],['affut','Affût'],['navette','Navette'],['garde','Garde']];
const ESPECES=()=>[['insectoide',SPECIES[0].n],...BEASTS.map(b=>[b.key,b.n])];
/* Lieux et densité (21 novembre 2026). La carte a trois sortes de lieux : l'extérieur (terrain naturel, poches et cavernes comprises),
   le bâti (sol des bâtiments) et les tunnels. Le budget de menace de chaque niveau est réparti directement entre eux
   (GROUPES.niv[n].part, en % du budget, ramenés à 100 ; un lieu absent de la carte rend sa part aux autres, et un lieu ne reçoit
   jamais plus de PART_PLAFOND fois sa part de surface : voir spawnGroupes). Chaque
   groupe déclare les lieux où il peut apparaître (g.lieux ; vide : partout). Le budget monte de GROUPES.pente % par niveau de la
   descente. */
const LIEUX=[['ext','Extérieur'],['bati','Bâti'],['tunnel','Tunnels']];
/* Par niveau de profondeur (21 novembre 2026, fenêtre LIFE) : GROUPES.niv[n] = {budget, gr:[noms des groupes permis à ce niveau]}.
   Le budget de chaque niveau se règle à part (avant : un budget et une pente en % par niveau). Un groupe n'est posé que s'il est
   actif (Lab → Groupes) ET dans la liste du niveau. Départ : les groupes arrivent peu à peu, les plus durs au niveau 3.
   Un groupe créé par le joueur est permis partout tant qu'il ne l'a pas retiré d'un niveau. */
const GR_NIVS=NIVS,GR_NIV_DEF={"Large crabot groupe":[2,3],"Family":[2,3],"3-5 puces + sentinelles":[2,3],"Mines & Sentinelles":[2,3],"2-3 sentinelles":[2,3],"Broyeur solitaire":[2,3],"Poste de garde":[3],"Batterie":[2,3],"Essaim de drones":[2,3],"Escouade de réparation":[3],"Embuscade gluante":[3],"Chasse à courre":[3],"Convoi":[3],"Tireurs embusqués":[2,3],"Ronde de drones":[2,3]};
function nivSains(d,liste,budget,pente){const o={};
  for(const n of GR_NIVS){const s=d&&d[n],b=s&&isFinite(+s.budget)?Math.max(0,Math.min(2000,Math.round(+s.budget))):Math.round(budget*(1+pente/100*(n-1)));
    o[n]={budget:b,part:partSaine(s&&s.part,n),gr:s&&Array.isArray(s.gr)?liste.map(g=>g.n).filter(x=>s.gr.includes(x)):liste.map(g=>g.n).filter(x=>(GR_NIV_DEF[x]||GR_NIVS).includes(n))};}
  return o;}
const nivDe=n=>GROUPES.niv[nivBorne(n)];
// Répartition de départ, par niveau : celle que donnaient les anciennes densités (mesurée le 21 novembre 2026 sur 12 cartes par niveau).
const PART_DEF=n=>Object.assign({},NIVEAUX[n].part),PART_PLAFOND=3;
function partSaine(p,n){const o=PART_DEF(n);if(p&&typeof p==='object')for(const [k] of LIEUX)if(isFinite(+p[k])&&p[k]!==''&&p[k]!=null)o[k]=Math.max(0,Math.min(100,Math.round(+p[k])));return o;}
// RÉFÉRENCE DU JOUEUR : groupes, ordre, valeurs, patrouilles, lieux et niveaux relus dans la base de l'artefact le 21 novembre 2026
// à 23 h 39 (reglages/courant). Avant : dix groupes du joueur (lus dans la base de l'artefact le 20 novembre 2026), neuf groupes nouveaux bâtis sur les cinq espèces du
// 21 novembre. VALEURS MESURÉES le 21 novembre au banc de combat (voir docs/mesures.md) : vie perdue par la foreuse de série face au
// groupe en assaut, moyenne de l'effectif minimal et de l'effectif maximal, divisée par 4.
const GROUPES_DEF=()=>groupesSains({budget:80,v:2,pente:20,liste:[
  {"cout":3,"f":2,"m":[{"k":"crabos","max":2,"min":1}],"n":"Crabots","on":1,"pats":["voyage","ronde","navette","sentinelle"],"lieux":[]},
  {"cout":7,"f":2,"m":[{"k":"crabos","max":6,"min":4}],"n":"Large crabot groupe","on":1,"pats":["voyage","navette","ronde"],"lieux":[]},
  {"cout":5,"f":2,"m":[{"k":"cafar","max":4,"min":3}],"n":"Bande de relais","on":1,"pats":["voyage","errance","ronde"],"lieux":[]},
  {"cout":7,"f":0,"m":[{"k":"paralyzor","max":1,"min":1},{"k":"crabos","max":1,"min":1},{"k":"cafar","max":1,"min":1},{"k":"mine","max":1,"min":1},{"k":"insectoide","max":1,"min":1}],"n":"Family","on":1,"pats":["territoire","ronde"],"lieux":[]},
  {"cout":8,"f":0,"m":[{"k":"insectoide","max":5,"min":3},{"k":"paralyzor","max":1,"min":1}],"n":"3-5 puces + sentinelles","on":1,"pats":["voyage"],"lieux":[]},
  {"cout":3,"f":1,"m":[{"k":"mine","max":2,"min":1}],"n":"1-2 Mines","on":1,"pats":["errance"],"lieux":[]},
  {"cout":6,"f":1,"m":[{"k":"mine","max":3,"min":3},{"k":"paralyzor","max":2,"min":2}],"n":"Mines & Sentinelles","on":1,"pats":["navette","ronde"],"lieux":[]},
  {"cout":3,"f":1,"m":[{"k":"paralyzor","max":3,"min":2}],"n":"2-3 sentinelles","on":1,"pats":["territoire","ronde","navette"],"lieux":[]},
  {"cout":3,"f":0,"m":[{"k":"brochon","max":2,"min":1}],"n":"Banc de torpilles","on":1,"pats":["errance"],"lieux":["ext"]},
  {"cout":11,"f":1,"m":[{"k":"mastok","max":1,"min":1}],"n":"Broyeur solitaire","on":1,"pats":["territoire","garde","sentinelle"],"lieux":[]},
  {"cout":10,"f":0,"m":[{"k":"insectoide","max":8,"min":6},{"k":"mine","max":1,"min":0}],"n":"Puces en groupes","on":1,"pats":["voyage"],"lieux":[]},
  {"cout":10,"f":1,"m":[{"k":"gardien","max":1,"min":1},{"k":"paralyzor","max":2,"min":1}],"n":"Poste de garde","on":1,"pats":["garde"],"lieux":[]},
  {"cout":13,"f":1,"m":[{"k":"artilleur","max":2,"min":2},{"k":"gardien","max":1,"min":0}],"n":"Batterie","on":1,"pats":["garde","sentinelle"],"lieux":[]},
  {"cout":3,"f":1,"m":[{"k":"drone","max":5,"min":3}],"n":"Essaim de drones","on":1,"pats":["voyage","navette","ronde"],"lieux":["bati","ext"]},
  {"cout":6,"f":1,"m":[{"k":"crabos","max":2,"min":2},{"k":"soudeur","max":1,"min":1}],"n":"Escouade de réparation","on":1,"pats":["ronde","navette"],"lieux":[]},
  {"cout":4,"f":1,"m":[{"k":"englueur","max":2,"min":1},{"k":"mine","max":2,"min":1}],"n":"Embuscade gluante","on":1,"pats":["affut"],"lieux":[]},
  {"cout":7,"f":1,"m":[{"k":"englueur","max":1,"min":1},{"k":"cafar","max":4,"min":3}],"n":"Chasse à courre","on":1,"pats":["voyage","navette"],"lieux":["ext"]},
  {"cout":11,"f":1,"m":[{"k":"gardien","max":1,"min":1},{"k":"soudeur","max":1,"min":1},{"k":"drone","max":2,"min":2}],"n":"Convoi","on":1,"pats":["navette"],"lieux":[]},
  {"cout":5,"f":1,"m":[{"k":"artilleur","max":2,"min":1}],"n":"Tireurs embusqués","on":1,"pats":["affut","sentinelle"],"lieux":[]},
  {"cout":2,"f":1,"m":[{"k":"drone","max":2,"min":2},{"k":"paralyzor","max":1,"min":1}],"n":"Ronde de drones","on":1,"pats":["ronde"],"lieux":[]}]});
/* Passage à la version 2 : des groupes enregistrés avant le 21 novembre 2026 (navigateur ou base de l'artefact) n'ont ni lieux, ni
   densités, ni les neuf groupes nouveaux. Une seule fois : un groupe qui porte le nom d'un groupe de départ reçoit ses lieux et sa
   valeur mesurée (son état actif et sa fréquence sont gardés), les groupes nouveaux sont ajoutés à la suite, les autres ne bougent pas. */
function groupesV2(g){if(!g||g.v>=2)return g;const D=GROUPES_DEF();
  for(const x of g.liste){const d=D.liste.find(y=>y.n===x.n);if(d){x.lieux=d.lieux.slice();x.cout=d.cout;}else if(!x.lieux)x.lieux=[];}
  for(const d of D.liste)if(!g.liste.some(x=>x.n===d.n)&&g.liste.length<40)g.liste.push(d);
  g.budget=Math.round(g.budget*80/110);   // les valeurs mesurées sont plus basses que les anciennes : le budget suit, pour garder la même densité
  g.pente=D.pente;g.v=2;g.niv=nivSains(null,g.liste,g.budget,g.pente);return g;}
// remet d'aplomb des groupes lus dans le navigateur ou dans la base : bornes, espèces inconnues écartées.
// L'effectif minimal peut être 0 : l'espèce est alors parfois absente du groupe.
function groupesSains(d){const ks=ESPECES().map(e=>e[0]),n=(v,mn,mx,df)=>Number.isFinite(+v)&&v!==''&&v!=null?Math.max(mn,Math.min(mx,Math.round(+v))):df;
  if(!d||!Array.isArray(d.liste))return null;
  const liste=d.liste.slice(0,40).map(g=>({n:String(g.n||'Groupe').slice(0,30),lieux:[...new Set(Array.isArray(g.lieux)?g.lieux:[])].filter(v=>LIEUX.some(l=>l[0]===v)),cout:n(g.cout,1,500,1),on:g.on?1:0,f:[0,1,2].includes(+g.f)?+g.f:1,
    pats:[...new Set(Array.isArray(g.pats)?g.pats:[g.pat||'errance'])].filter(v=>PATS.some(p=>p[0]===v)),   // liste vide permise : le style est alors tiré parmi tous
    m:(Array.isArray(g.m)?g.m:[]).filter(m=>m&&ks.includes(m.k)).slice(0,6).map(m=>{const a=n(m.min,0,20,1),b=n(m.max,1,20,Math.max(1,a));return {k:m.k,min:Math.min(a,b),max:Math.max(a,b)};})}));
  const bud=n(d.budget,0,2000,80),pen=n(d.pente,0,200,20),niv=nivSains(d.niv,liste,bud,pen);
  return {budget:niv[1].budget,v:d.v>=2?2:1,pente:pen,niv,liste};}
let GROUPES=GROUPES_DEF();
try{const g=groupesSains(JSON.parse(localStorage.getItem('np-groupes')||'null'));if(g)GROUPES=groupesV2(g);}catch(e){}
function saveGroupes(){for(const n of GR_NIVS)GROUPES.niv[n].gr=GROUPES.niv[n].gr.filter(x=>GROUPES.liste.some(g=>g.n===x));GROUPES.budget=GROUPES.niv[1].budget;   // un groupe supprimé quitte les listes des niveaux
  try{localStorage.setItem('np-groupes',JSON.stringify(GROUPES));}catch(e){}touchLocal();}
// effectifs par espèce : ne servent plus qu'au banc de combat et aux mesures (spawnAnimals, spawnBeasts)
let LIFE={insectoide:0};BEASTS.forEach(b=>{LIFE[b.key]=0;});

const grEsc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const grEffectif=g=>{let a=0,b=0;for(const m of g.m){a+=m.min;b+=m.max;}return a===b?''+a:a+' à '+b;};
const grCompo=g=>{const E=ESPECES();return g.m.map(m=>(m.min===m.max?m.min:m.min+'-'+m.max)+' '+((E.find(e=>e[0]===m.k)||[,'?'])[1])).join(' + ')||'vide';};
/* Fenêtre Groupes (refaite le 19 novembre 2026) : à gauche la fiche du groupe choisi, à droite la liste en colonne.
   Dans la liste, un clic choisit le groupe, la case l'active, et on le déplace à la souris (glisser) ou par ↑ ↓. */
let GR_SEL=0;
function buildGroupes(){const E=ESPECES(),ic=k=>ICON[k==='insectoide'?'an0r':'bz'+BEASTS.findIndex(b=>b.key===k)+'r']||'',L=GROUPES.liste;
  GR_SEL=Math.max(0,Math.min(L.length-1,GR_SEL));
  $('grList').innerHTML=L.map((g,i)=>`<div class="grl${i===GR_SEL?' sel':''}${g.on?'':' inactif'}" data-g="${i}" draggable="true">
      <span class="grip" aria-hidden="true">⠿</span><input type="checkbox" data-f="on"${g.on?' checked':''} aria-label="Activer le groupe ${grEsc(g.n)}" title="Actif">
      <button class="grnom" data-a="sel" aria-pressed="${i===GR_SEL}"><b>${grEsc(g.n)}</b><span>${['− ','','+ '][g.f??1]}valeur ${g.cout} · ${grEsc(grCompo(g))}</span></button>
      <button class="gx" data-a="up"${i?'':' disabled'} aria-label="Monter le groupe ${grEsc(g.n)}" title="Monter">↑</button><button class="gx" data-a="down"${i<L.length-1?'':' disabled'} aria-label="Descendre le groupe ${grEsc(g.n)}" title="Descendre">↓</button></div>`).join('')
    ||'<p class="mnote">Aucun groupe : la carte sera vide.</p>';
  const g=L[GR_SEL];
  $('grEdit').innerHTML=!g?'<p class="mnote">Créez un groupe avec « + Nouveau groupe ».</p>':`
    <label class="gl">Nom<input type="text" class="gnom" data-f="n" maxlength="30" value="${grEsc(g.n)}"></label>
    <div class="grow"><span class="gfq">Fréquence ${freqHtml(g.f??1,grEsc(g.n))}</span><label>Valeur<input type="number" data-f="cout" min="1" max="500" step="1" value="${g.cout}"></label>
      <label class="gon"><input type="checkbox" data-f="on"${g.on?' checked':''}>Actif</label></div>
    <h3>Patrouilles <span>${g.pats.length>1?'une au hasard par groupe posé':g.pats.length?'toujours la même':'aucune choisie : une au hasard parmi toutes'}</span></h3>
    <div class="gpats">${g.pats.map(v=>`<span class="gpat">${(PATS.find(p=>p[0]===v)||[,v])[1]}<button class="gx" data-a="delp" data-v="${v}" aria-label="Retirer la patrouille ${(PATS.find(p=>p[0]===v)||[,v])[1]}" title="Retirer">×</button></span>`).join('')}
      ${g.pats.length<PATS.length?`<select data-f="addp" aria-label="Ajouter une patrouille"><option value="">+ Ajouter…</option>${PATS.filter(([v])=>!g.pats.includes(v)).map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select>`:''}</div>
    <h3>Lieux <span>${(g.lieux||[]).length?'seulement là':'partout'}</span></h3>
    <div class="grow">${LIEUX.map(([v,l])=>`<label class="gon"><input type="checkbox" data-f="lieu" data-v="${v}"${(g.lieux||[]).includes(v)?' checked':''}>${l}</label>`).join('')}</div>
    <h3>Composition <span>effectif : ${grEffectif(g)}</span></h3>
    <div class="gmb">${g.m.map((m,j)=>`<div class="gm" data-m="${j}"><img src="${ic(m.k)}" alt=""><select data-f="k" aria-label="Espèce">${E.map(([k,l])=>`<option value="${k}"${k===m.k?' selected':''}>${grEsc(l)}</option>`).join('')}</select>
      <input type="number" data-f="min" min="0" max="20" step="1" value="${m.min}" aria-label="Effectif minimal"><span>à</span><input type="number" data-f="max" min="1" max="20" step="1" value="${m.max}" aria-label="Effectif maximal"><button class="gx" data-a="delm" aria-label="Retirer cette espèce du groupe" title="Retirer cette espèce">×</button></div>`).join('')||'<p class="mnote">Groupe vide : il ne sera pas posé.</p>'}</div>
    <div class="gbas"><button data-a="addm"${g.m.length>=6?' disabled':''}>+ Espèce</button><button data-a="dup"${L.length>=40?' disabled':''}>Dupliquer</button><button data-a="delg" class="gdel">Supprimer le groupe</button></div>`;}
/* Fenêtre LIFE (refaite le 21 novembre 2026, à la demande de l'utilisateur) : un sélecteur de niveau, puis, pour ce niveau, le budget
   de menace, les groupes qui peuvent y apparaître et les artefacts (machines comprises) qui peuvent y apparaître. Les deux listes
   se règlent comme les patrouilles d'un groupe : des étiquettes qu'on retire, un menu déroulant pour en ajouter. */
let LIFE_NIV=1;
function buildLife(){const LS=document.querySelector('#life .lfscroll'),haut=LS?LS.scrollTop:0,N=LIFE_NIV,L=nivDe(N),puce=(a,v,l,t)=>`<span class="gpat${t?' inactif':''}">${grEsc(l)}<button class="gx" data-a="${a}" data-v="${grEsc(v)}" aria-label="Retirer ${grEsc(l)} du niveau ${N}" title="Retirer">×</button></span>`;
  const grHors=GROUPES.liste.filter(g=>!L.gr.includes(g.n)),arts=ART_LISTE.filter(([k])=>(ARTEFACTS[k].niv||ART_NIVS).includes(N)),artHors=ART_LISTE.filter(([k])=>!(ARTEFACTS[k].niv||ART_NIVS).includes(N));
  $('life').innerHTML=`<div class="lfniv" role="group" aria-label="Niveau de profondeur"><span>Niveau</span>${GR_NIVS.map(n=>`<button data-niv="${n}" aria-pressed="${n===N}"${n===N?' class="on"':''}>${n}</button>`).join('')}</div>`
    +`<div class="g2"><label for="lfBudget">Budget de menace du niveau ${N}</label><input type="number" id="lfBudget" min="0" max="2000" step="5" value="${L.budget}"></div>`
    +`<div class="lfscroll"><div class="sub">Groupes possibles au niveau ${N} <span>${L.gr.length} sur ${GROUPES.liste.length}</span></div>`
    +`<div class="gpats">${L.gr.map(x=>{const g=GROUPES.liste.find(g=>g.n===x);return puce('delgn',x,x+(g&&!g.on?' (inactif)':''),g&&!g.on);}).join('')||'<span class="mnote">Aucun : ce niveau sera vide.</span>'}
      ${grHors.length?`<select data-f="addgn" aria-label="Ajouter un groupe au niveau ${N}"><option value="">+ Ajouter…</option>${grHors.map(g=>`<option value="${grEsc(g.n)}">${grEsc(g.n)} (valeur ${g.cout})</option>`).join('')}</select>`:''}</div>`
    +`<div class="sub">Artefacts et machines possibles au niveau ${N} <span>${arts.length} sur ${ART_LISTE.length}</span></div>`
    +`<div class="gpats">${arts.map(([k,l])=>puce('delan',k,l+(ARTEFACTS[k].on?'':' (inactif)'),!ARTEFACTS[k].on)).join('')||'<span class="mnote">Aucun.</span>'}
      ${artHors.length?`<select data-f="addan" aria-label="Ajouter un artefact au niveau ${N}"><option value="">+ Ajouter…</option>${artHors.map(([k,l])=>`<option value="${k}">${l}</option>`).join('')}</select>`:''}</div>`
    +`<div class="sub">Répartition des ennemis au niveau ${N} <span>% du budget</span></div>`+LIEUX.map(([k,l])=>`<div class="g2"><label for="lfD-${k}">${l}</label><input type="number" id="lfD-${k}" data-d="${k}" min="0" max="100" step="5" value="${L.part[k]}"></div>`).join('')
    +(()=>{const s=LIEUX.reduce((a,[k])=>a+L.part[k],0);return s===100?'':`<div class="mnote">Total ${s} % : ${s?'les trois parts sont ramenées à 100 ('+LIEUX.map(([k,l])=>l.toLowerCase()+' '+Math.round(L.part[k]*100/s)).join(', ')+').':'aucun ennemi à ce niveau.'}</div>`;})()
    +(G&&G.menace&&G.menace.lieux?`<div class="sum">Carte en cours (niveau ${G.niv||1}) : ${LIEUX.map(([k,l])=>l.toLowerCase()+' '+(G.menace.lieux[k]?G.menace.lieux[k].dep+' / '+G.menace.lieux[k].b:'0')).join(' · ')}.</div>`:'')
    +`<div class="sum">Le budget vaut pour une carte de 96 × 64 et suit la surface de la carte (ici ${Math.round(L.budget*W*H/(96*64))}).</div></div>`;   // sous le budget, tout défile (22 novembre 2026) : la fenêtre ne dépasse plus l'écran
  {const s=document.querySelector('#life .lfscroll');if(s)s.scrollTop=haut;}}
$('life').addEventListener('change',e=>{const t=e.target,L=nivDe(LIFE_NIV);
  if(t.dataset.d){L.part[t.dataset.d]=Math.max(0,Math.min(100,Math.round(+t.value||0)));saveGroupes();buildLife();return;}
  if(t.id==='lfBudget'){L.budget=Math.max(0,Math.min(2000,Math.round(+t.value||0)));saveGroupes();buildLife();return;}
  if(t.dataset.f==='addgn'&&t.value){if(!L.gr.includes(t.value))L.gr.push(t.value);saveGroupes();buildLife();return;}
  if(t.dataset.f==='addan'&&t.value){const a=ARTEFACTS[t.value];if(a){a.niv=ART_NIVS.filter(n=>n===LIFE_NIV||(a.niv||ART_NIVS).includes(n));saveArtefacts();buildLife();}}});
$('life').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.niv){LIFE_NIV=+b.dataset.niv;buildLife();const n=$('life').querySelector('button.on');if(n)n.focus();return;}
  if(b.dataset.a==='delgn'){const L=nivDe(LIFE_NIV);L.gr=L.gr.filter(x=>x!==b.dataset.v);saveGroupes();buildLife();}
  else if(b.dataset.a==='delan'){const a=ARTEFACTS[b.dataset.v];if(a){a.niv=(a.niv||ART_NIVS).filter(n=>n!==LIFE_NIV);saveArtefacts();buildLife();}}});
function openGroupes(){if(TRAV)stopTravel();if(REST)stopRest();if(EXPL)stopExplore();buildGroupes();$('groupes').hidden=false;$('groupes').querySelector('.mcard').focus();}
function closeGroupes(){$('groupes').hidden=true;$('grBtn').focus();render();}
$('grBtn').onclick=openGroupes;$('grClose').onclick=closeGroupes;
$('groupes').addEventListener('pointerdown',ev=>{if(ev.target===$('groupes'))closeGroupes();});
$('grEdit').addEventListener('change',e=>{const t=e.target,g=GROUPES.liste[GR_SEL],f=t.dataset.f,r=t.closest('.gm');if(!g||!f)return;
  const nb=(mn,mx)=>Math.max(mn,Math.min(mx,Math.round(+t.value||mn)));
  if(r){const m=g.m[+r.dataset.m];if(!m)return;
    if(f==='k')m.k=t.value;else if(f==='min'){m.min=Math.max(0,Math.min(20,Math.round(+t.value||0)));if(m.max<m.min)m.max=m.min;}else if(f==='max'){m.max=nb(1,20);if(m.min>m.max)m.min=m.max;}}
  else if(f==='n'){const av=g.n;g.n=t.value.trim().slice(0,30)||'Groupe';for(const n of GR_NIVS)GROUPES.niv[n].gr=GROUPES.niv[n].gr.map(x=>x===av?g.n:x);}   // renommé : les listes des niveaux suivent
  else if(f==='cout')g.cout=nb(1,500);else if(f==='addp'){if(t.value&&!g.pats.includes(t.value))g.pats.push(t.value);}else if(f==='on')g.on=t.checked?1:0;
  else if(f==='lieu'){g.lieux=(g.lieux||[]).filter(v=>v!==t.dataset.v);if(t.checked)g.lieux.push(t.dataset.v);}
  saveGroupes();buildGroupes();});
$('grEdit').addEventListener('click',e=>{const q=e.target.closest('button[data-fq]');if(q&&GROUPES.liste[GR_SEL]){GROUPES.liste[GR_SEL].f=+q.dataset.fq;saveGroupes();buildGroupes();const n=$('grEdit').querySelector(`button[data-fq="${q.dataset.fq}"]`);if(n)n.focus();return;}
  const t=e.target.closest('button[data-a]');if(!t)return;const L=GROUPES.liste,g=L[GR_SEL],a=t.dataset.a;if(!g)return;
  if(a==='delg')L.splice(GR_SEL,1);
  else if(a==='dup'&&L.length<40){const c=JSON.parse(JSON.stringify(g));c.n=(c.n+' 2').slice(0,30);L.splice(GR_SEL+1,0,c);GR_SEL++;for(const n of GR_NIVS)if(GROUPES.niv[n].gr.includes(g.n)&&!GROUPES.niv[n].gr.includes(c.n))GROUPES.niv[n].gr.push(c.n);}
  else if(a==='addm'&&g.m.length<6)g.m.push({k:'crabos',min:1,max:1});
  else if(a==='delm')g.m.splice(+t.closest('.gm').dataset.m,1);
  else if(a==='delp')g.pats=g.pats.filter(v=>v!==t.dataset.v);
  saveGroupes();buildGroupes();});
// liste : choisir, activer, déplacer
const grBouge=(de,vers)=>{const L=GROUPES.liste;if(de===vers||de<0||vers<0||de>=L.length||vers>=L.length)return;const cur=L[GR_SEL],[g]=L.splice(de,1);L.splice(vers,0,g);GR_SEL=L.indexOf(cur);saveGroupes();buildGroupes();};
$('grList').addEventListener('change',e=>{const r=e.target.closest('.grl');if(!r||e.target.dataset.f!=='on')return;GROUPES.liste[+r.dataset.g].on=e.target.checked?1:0;saveGroupes();buildGroupes();});
$('grList').addEventListener('click',e=>{const t=e.target.closest('button[data-a]');if(!t)return;const i=+t.closest('.grl').dataset.g,a=t.dataset.a;
  if(a==='sel'){GR_SEL=i;buildGroupes();const b=$('grList').querySelector('.grl.sel .grnom');if(b)b.focus();}
  else{grBouge(i,a==='up'?i-1:i+1);const b=$('grList').querySelector(`.grl[data-g="${a==='up'?i-1:i+1}"] [data-a="${a}"]`);if(b&&!b.disabled)b.focus();}});
{let de=-1;const L=$('grList'),raz=()=>L.querySelectorAll('.cible').forEach(n=>n.classList.remove('cible'));
  L.addEventListener('dragstart',e=>{const r=e.target.closest('.grl');if(!r)return;de=+r.dataset.g;try{e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',String(de));}catch(x){}});
  L.addEventListener('dragover',e=>{const r=e.target.closest('.grl');if(de<0||!r)return;e.preventDefault();raz();r.classList.add('cible');});
  L.addEventListener('drop',e=>{const r=e.target.closest('.grl');e.preventDefault();raz();if(de>=0&&r)grBouge(de,+r.dataset.g);de=-1;});
  L.addEventListener('dragend',()=>{raz();de=-1;});}
$('grAdd').onclick=()=>{if(GROUPES.liste.length>=40)return;GROUPES.liste.push({n:'Nouveau groupe',cout:1,on:1,pats:['errance'],lieux:[],m:[{k:'crabos',min:1,max:1}]});{const nv=GROUPES.liste[GROUPES.liste.length-1].n;for(const n of GR_NIVS)if(!GROUPES.niv[n].gr.includes(nv))GROUPES.niv[n].gr.push(nv);}GR_SEL=GROUPES.liste.length-1;saveGroupes();buildGroupes();
  const n=$('grEdit').querySelector('.gnom');if(n){n.focus();n.select();}};
// « Groupes par défaut » efface les groupes créés : il faut cliquer deux fois
{let arme=0;$('grReset').onclick=()=>{const b=$('grReset');if(!arme){arme=1;b.textContent='Tout remplacer ? Cliquer encore';setTimeout(()=>{arme=0;b.textContent='Groupes par défaut';},3000);return;}
  arme=0;b.textContent='Groupes par défaut';GROUPES=GROUPES_DEF();GR_SEL=0;saveGroupes();buildGroupes();};}
