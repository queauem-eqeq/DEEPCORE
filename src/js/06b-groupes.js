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
   le bâti (sol des bâtiments) et les tunnels. Le budget de menace est partagé entre eux à proportion de leur surface praticable,
   puis multiplié par la densité du lieu (GROUPES.dens, en %) : on peut donc vider les tunnels ou charger les bâtiments. Chaque
   groupe déclare les lieux où il peut apparaître (g.lieux ; vide : partout). Le budget monte de GROUPES.pente % par niveau de la
   descente. */
const LIEUX=[['ext','Extérieur'],['bati','Bâti'],['tunnel','Tunnels']];
const DENS_DEF=()=>({ext:80,bati:130,tunnel:40});
// Dix groupes du joueur (lus dans la base de l'artefact le 20 novembre 2026), neuf groupes nouveaux bâtis sur les cinq espèces du
// 21 novembre. VALEURS MESURÉES le 21 novembre au banc de combat (voir docs/mesures.md) : vie perdue par la foreuse de série face au
// groupe en assaut, moyenne de l'effectif minimal et de l'effectif maximal, divisée par 4.
const GROUPES_DEF=()=>({budget:80,v:2,pente:20,dens:DENS_DEF(),liste:[
  {"cout":7,"f":1,"m":[{"k":"paralyzor","max":1,"min":1},{"k":"crabos","max":1,"min":1},{"k":"cafar","max":1,"min":1},{"k":"mine","max":1,"min":1},{"k":"insectoide","max":1,"min":1}],"n":"Family","on":1,"pats":["affut","territoire"],"lieux":["ext"]},
  {"cout":8,"f":1,"m":[{"k":"insectoide","max":5,"min":3},{"k":"paralyzor","max":1,"min":1}],"n":"3-5 puces + sentinelles","on":1,"pats":[],"lieux":["ext"]},
  {"cout":3,"f":1,"m":[{"k":"mine","max":2,"min":1}],"n":"1-2 Mines","on":1,"pats":["affut","errance"],"lieux":["tunnel","bati"]},
  {"cout":5,"f":1,"m":[{"k":"mine","max":2,"min":2},{"k":"paralyzor","max":1,"min":1}],"n":"Mines & Sentinelles","on":0,"pats":["affut","territoire"],"lieux":["bati"]},
  {"cout":5,"f":1,"m":[{"k":"cafar","max":4,"min":2}],"n":"Bande de relais","on":1,"pats":["voyage","errance","ronde"],"lieux":["ext","tunnel"]},
  {"cout":3,"f":1,"m":[{"k":"paralyzor","max":3,"min":2}],"n":"2-3 sentinelles","on":1,"pats":["territoire","ronde"],"lieux":["bati"]},
  {"cout":3,"f":1,"m":[{"k":"crabos","max":2,"min":1}],"n":"Crabots","on":1,"pats":["ronde","errance","voyage","territoire","sentinelle","affut"],"lieux":[]},
  {"cout":3,"f":1,"m":[{"k":"brochon","max":2,"min":1}],"n":"Banc de torpilles","on":1,"pats":["ronde","errance"],"lieux":["ext"]},
  {"cout":11,"f":1,"m":[{"k":"mastok","max":1,"min":1}],"n":"Broyeur solitaire","on":0,"pats":["territoire","errance"],"lieux":["ext","bati"]},
  {"cout":16,"f":1,"m":[{"k":"insectoide","max":8,"min":6},{"k":"mine","max":1,"min":0}],"n":"Puces en groupes","on":1,"pats":["voyage"],"lieux":["ext"]},
  {"cout":10,"f":1,"m":[{"k":"gardien","max":1,"min":1},{"k":"paralyzor","max":2,"min":1}],"n":"Poste de garde","on":1,"pats":["garde"],"lieux":["bati"]},
  {"cout":13,"f":1,"m":[{"k":"artilleur","max":2,"min":2},{"k":"gardien","max":1,"min":0}],"n":"Batterie","on":1,"pats":["garde","sentinelle"],"lieux":["bati"]},
  {"cout":3,"f":0,"m":[{"k":"drone","max":5,"min":3}],"n":"Essaim de drones","on":1,"pats":["voyage","navette"],"lieux":["ext","bati"]},
  {"cout":6,"f":1,"m":[{"k":"crabos","max":2,"min":2},{"k":"soudeur","max":1,"min":1}],"n":"Escouade de réparation","on":1,"pats":["ronde","navette"],"lieux":[]},
  {"cout":4,"f":1,"m":[{"k":"englueur","max":2,"min":1},{"k":"mine","max":2,"min":1}],"n":"Embuscade gluante","on":1,"pats":["affut"],"lieux":["tunnel","bati"]},
  {"cout":6,"f":1,"m":[{"k":"englueur","max":1,"min":1},{"k":"cafar","max":3,"min":2}],"n":"Chasse à courre","on":1,"pats":["voyage","navette"],"lieux":["ext"]},
  {"cout":11,"f":1,"m":[{"k":"gardien","max":1,"min":1},{"k":"soudeur","max":1,"min":1},{"k":"drone","max":2,"min":2}],"n":"Convoi","on":1,"pats":["navette"],"lieux":["bati"]},
  {"cout":5,"f":1,"m":[{"k":"artilleur","max":2,"min":1}],"n":"Tireurs embusqués","on":1,"pats":["affut","sentinelle"],"lieux":["ext"]},
  {"cout":2,"f":0,"m":[{"k":"drone","max":2,"min":2},{"k":"paralyzor","max":1,"min":1}],"n":"Ronde de drones","on":1,"pats":["ronde"],"lieux":["bati"]}]});
/* Passage à la version 2 : des groupes enregistrés avant le 21 novembre 2026 (navigateur ou base de l'artefact) n'ont ni lieux, ni
   densités, ni les neuf groupes nouveaux. Une seule fois : un groupe qui porte le nom d'un groupe de départ reçoit ses lieux et sa
   valeur mesurée (son état actif et sa fréquence sont gardés), les groupes nouveaux sont ajoutés à la suite, les autres ne bougent pas. */
function groupesV2(g){if(!g||g.v>=2)return g;const D=GROUPES_DEF();
  for(const x of g.liste){const d=D.liste.find(y=>y.n===x.n);if(d){x.lieux=d.lieux.slice();x.cout=d.cout;}else if(!x.lieux)x.lieux=[];}
  for(const d of D.liste)if(!g.liste.some(x=>x.n===d.n)&&g.liste.length<40)g.liste.push(d);
  g.budget=Math.round(g.budget*80/110);   // les valeurs mesurées sont plus basses que les anciennes : le budget suit, pour garder la même densité
  g.dens=D.dens;g.pente=D.pente;g.v=2;return g;}
// remet d'aplomb des groupes lus dans le navigateur ou dans la base : bornes, espèces inconnues écartées.
// L'effectif minimal peut être 0 : l'espèce est alors parfois absente du groupe.
function groupesSains(d){const ks=ESPECES().map(e=>e[0]),n=(v,mn,mx,df)=>Number.isFinite(+v)&&v!==''&&v!=null?Math.max(mn,Math.min(mx,Math.round(+v))):df;
  if(!d||!Array.isArray(d.liste))return null;
  const dn=DENS_DEF();if(d.dens&&typeof d.dens==='object')for(const [k] of LIEUX)dn[k]=n(d.dens[k],0,400,dn[k]);
  return {budget:n(d.budget,0,2000,80),v:d.v>=2?2:1,pente:n(d.pente,0,200,20),dens:dn,liste:d.liste.slice(0,40).map(g=>({n:String(g.n||'Groupe').slice(0,30),lieux:[...new Set(Array.isArray(g.lieux)?g.lieux:[])].filter(v=>LIEUX.some(l=>l[0]===v)),cout:n(g.cout,1,500,1),on:g.on?1:0,f:[0,1,2].includes(+g.f)?+g.f:1,
    pats:[...new Set(Array.isArray(g.pats)?g.pats:[g.pat||'errance'])].filter(v=>PATS.some(p=>p[0]===v)),   // liste vide permise : le style est alors tiré parmi tous
    m:(Array.isArray(g.m)?g.m:[]).filter(m=>m&&ks.includes(m.k)).slice(0,6).map(m=>{const a=n(m.min,0,20,1),b=n(m.max,1,20,Math.max(1,a));return {k:m.k,min:Math.min(a,b),max:Math.max(a,b)};})}))};}
let GROUPES=GROUPES_DEF();
try{const g=groupesSains(JSON.parse(localStorage.getItem('np-groupes')||'null'));if(g)GROUPES=groupesV2(g);}catch(e){}
function saveGroupes(){try{localStorage.setItem('np-groupes',JSON.stringify(GROUPES));}catch(e){}touchLocal();}
// effectifs par espèce : ne servent plus qu'au banc de combat et aux mesures (spawnAnimals, spawnBeasts)
let LIFE={insectoide:0};BEASTS.forEach(b=>{LIFE[b.key]=0;});

const grEsc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const grEffectif=g=>{let a=0,b=0;for(const m of g.m){a+=m.min;b+=m.max;}return a===b?''+a:a+' à '+b;};
const grCompo=g=>{const E=ESPECES();return g.m.map(m=>(m.min===m.max?m.min:m.min+'-'+m.max)+' '+((E.find(e=>e[0]===m.k)||[,'?'])[1])).join(' + ')||'vide';};
const grBudgetCarte=()=>Math.round(GROUPES.budget*W*H/(96*64));
function grInfo(){const m=G&&G.menace,p=m&&m.pose?Object.keys(m.pose).map(k=>m.pose[k]+' × '+k).join(', '):'';
  $('grInfo').textContent=`Sur une carte ${W} × ${H} : ${grBudgetCarte()}.`+(m?` Carte en cours : ${m.total-m.reste} dépensés sur ${m.total}${p?' ('+p+')':''}.`:'');}
/* Fenêtre Groupes (refaite le 19 novembre 2026) : à gauche la fiche du groupe choisi, à droite la liste en colonne.
   Dans la liste, un clic choisit le groupe, la case l'active, et on le déplace à la souris (glisser) ou par ↑ ↓. */
let GR_SEL=0;
function buildGroupes(){const E=ESPECES(),ic=k=>ICON[k==='insectoide'?'an0r':'bz'+BEASTS.findIndex(b=>b.key===k)+'r']||'',L=GROUPES.liste;
  GR_SEL=Math.max(0,Math.min(L.length-1,GR_SEL));$('grBudget').value=GROUPES.budget;grInfo();
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
function buildLife(){
  $('life').innerHTML=`<div class="g2"><label for="lfBudget">Budget de menace</label><input type="number" id="lfBudget" min="0" max="2000" step="5" value="${GROUPES.budget}"></div>`
    +`<div class="sub">Densité par lieu (% du budget rapporté à la surface)</div>`+LIEUX.map(([k,l])=>`<div class="g2"><label for="lfD-${k}">${l}</label><input type="number" id="lfD-${k}" data-d="${k}" min="0" max="400" step="10" value="${GROUPES.dens[k]}"></div>`).join('')
    +`<div class="g2"><label for="lfPente">Menace en plus par niveau (%)</label><input type="number" id="lfPente" min="0" max="200" step="5" value="${GROUPES.pente}"></div>`
    +(G&&G.menace&&G.menace.lieux?`<div class="sum">Carte en cours : ${LIEUX.map(([k,l])=>l.toLowerCase()+' '+(G.menace.lieux[k]?G.menace.lieux[k].dep+' / '+G.menace.lieux[k].b:'0')).join(' · ')}.</div>`:'')
    +`<div class="sub">Groupes actifs</div>`
    +GROUPES.liste.map((g,i)=>`<label class="lfg"><input type="checkbox" data-g="${i}"${g.on?' checked':''}><b>${grEsc(g.n)}</b><span>valeur ${g.cout} · ${grEsc(grCompo(g))}</span></label>`).join('')
    +`<div class="sum">Le budget vaut pour une carte de 96 × 64 ; il suit la surface de la carte (ici ${grBudgetCarte()}). Il achète au hasard des groupes cochés, jusqu’à épuisement. Créer ou régler un groupe : Lab → Groupes.</div>`;}
$('life').addEventListener('change',e=>{const t=e.target;
  if(t.dataset.d){GROUPES.dens[t.dataset.d]=Math.max(0,Math.min(400,Math.round(+t.value||0)));saveGroupes();return;}
  if(t.id==='lfPente'){GROUPES.pente=Math.max(0,Math.min(200,Math.round(+t.value||0)));saveGroupes();return;}
  if(t.id==='lfBudget'){GROUPES.budget=Math.max(0,Math.min(2000,Math.round(+t.value||0)));saveGroupes();buildLife();return;}
  const g=GROUPES.liste[+t.dataset.g];if(g){g.on=t.checked?1:0;saveGroupes();}});
function openGroupes(){if(TRAV)stopTravel();if(REST)stopRest();if(EXPL)stopExplore();buildGroupes();$('groupes').hidden=false;$('groupes').querySelector('.mcard').focus();}
function closeGroupes(){$('groupes').hidden=true;$('grBtn').focus();render();}
$('grBtn').onclick=openGroupes;$('grClose').onclick=closeGroupes;
$('groupes').addEventListener('pointerdown',ev=>{if(ev.target===$('groupes'))closeGroupes();});
$('grBudget').addEventListener('change',e=>{GROUPES.budget=Math.max(0,Math.min(2000,Math.round(+e.target.value||0)));e.target.value=GROUPES.budget;saveGroupes();grInfo();});
$('grEdit').addEventListener('change',e=>{const t=e.target,g=GROUPES.liste[GR_SEL],f=t.dataset.f,r=t.closest('.gm');if(!g||!f)return;
  const nb=(mn,mx)=>Math.max(mn,Math.min(mx,Math.round(+t.value||mn)));
  if(r){const m=g.m[+r.dataset.m];if(!m)return;
    if(f==='k')m.k=t.value;else if(f==='min'){m.min=Math.max(0,Math.min(20,Math.round(+t.value||0)));if(m.max<m.min)m.max=m.min;}else if(f==='max'){m.max=nb(1,20);if(m.min>m.max)m.min=m.max;}}
  else if(f==='n')g.n=t.value.trim().slice(0,30)||'Groupe';else if(f==='cout')g.cout=nb(1,500);else if(f==='addp'){if(t.value&&!g.pats.includes(t.value))g.pats.push(t.value);}else if(f==='on')g.on=t.checked?1:0;
  else if(f==='lieu'){g.lieux=(g.lieux||[]).filter(v=>v!==t.dataset.v);if(t.checked)g.lieux.push(t.dataset.v);}
  saveGroupes();buildGroupes();});
$('grEdit').addEventListener('click',e=>{const q=e.target.closest('button[data-fq]');if(q&&GROUPES.liste[GR_SEL]){GROUPES.liste[GR_SEL].f=+q.dataset.fq;saveGroupes();buildGroupes();const n=$('grEdit').querySelector(`button[data-fq="${q.dataset.fq}"]`);if(n)n.focus();return;}
  const t=e.target.closest('button[data-a]');if(!t)return;const L=GROUPES.liste,g=L[GR_SEL],a=t.dataset.a;if(!g)return;
  if(a==='delg')L.splice(GR_SEL,1);
  else if(a==='dup'&&L.length<40){const c=JSON.parse(JSON.stringify(g));c.n=(c.n+' 2').slice(0,30);L.splice(GR_SEL+1,0,c);GR_SEL++;}
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
$('grAdd').onclick=()=>{if(GROUPES.liste.length>=40)return;GROUPES.liste.push({n:'Nouveau groupe',cout:1,on:1,pats:['errance'],lieux:[],m:[{k:'crabos',min:1,max:1}]});GR_SEL=GROUPES.liste.length-1;saveGroupes();buildGroupes();
  const n=$('grEdit').querySelector('.gnom');if(n){n.focus();n.select();}};
// « Groupes par défaut » efface les groupes créés : il faut cliquer deux fois
{let arme=0;$('grReset').onclick=()=>{const b=$('grReset');if(!arme){arme=1;b.textContent='Tout remplacer ? Cliquer encore';setTimeout(()=>{arme=0;b.textContent='Groupes par défaut';},3000);return;}
  arme=0;b.textContent='Groupes par défaut';GROUPES=GROUPES_DEF();GR_SEL=0;saveGroupes();buildGroupes();};}
