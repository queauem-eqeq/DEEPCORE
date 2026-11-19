/* ---------- Groupes d'ennemis (19 novembre 2026) ----------
   La carte n'est plus peuplée espèce par espèce (les intensités du menu Life) mais par GROUPES : un groupe réunit une ou
   plusieurs espèces, chacune avec un effectif minimal et maximal, et porte une VALEUR de menace réglée à la main.
   À chaque nouvelle carte, un budget achète des groupes actifs tirés au hasard jusqu'à épuisement (spawnGroupes, 08-faune).
   Le budget est donné pour la carte de référence (96 × 64) et rapporté à la surface de la carte jouée.
   Les groupes se créent et se règlent dans Lab → Groupes ; la fenêtre LIFE garde le budget et les cases « actif ».
   Chaque groupe porte un style de patrouille : errance (pas au hasard) ou voyage en bande (longs trajets avec pauses,
   comme les relais). Les autres styles viendront. Tout est mémorisé dans le navigateur sous np-groupes. */
const PATS=[['errance','Errance'],['voyage','Voyage en bande']];
const ESPECES=()=>[['insectoide',SPECIES[0].n],...BEASTS.map(b=>[b.key,b.n])];
const GROUPES_DEF=()=>({budget:110,liste:[
  {n:'Essaim de puces',cout:5,on:1,pat:'errance',m:[{k:'insectoide',min:4,max:6}]},
  {n:'Crabot solitaire',cout:3,on:1,pat:'errance',m:[{k:'crabos',min:1,max:1}]},
  {n:'Bande de relais',cout:6,on:1,pat:'voyage',m:[{k:'cafar',min:2,max:4}]},
  {n:'Banc de torpilles',cout:5,on:1,pat:'errance',m:[{k:'brochon',min:2,max:3}]},
  {n:'Broyeur solitaire',cout:10,on:1,pat:'errance',m:[{k:'mastok',min:1,max:1}]},
  {n:'Mines',cout:4,on:1,pat:'errance',m:[{k:'mine',min:1,max:2}]},
  {n:'Paralyzor',cout:4,on:1,pat:'errance',m:[{k:'paralyzor',min:1,max:1}]}]});
// remet d'aplomb des groupes lus dans le navigateur ou dans la base : bornes, espèces inconnues écartées
function groupesSains(d){const ks=ESPECES().map(e=>e[0]),n=(v,mn,mx,df)=>Number.isFinite(+v)&&v!==''&&v!=null?Math.max(mn,Math.min(mx,Math.round(+v))):df;
  if(!d||!Array.isArray(d.liste))return null;
  return {budget:n(d.budget,0,2000,110),liste:d.liste.slice(0,40).map(g=>({n:String(g.n||'Groupe').slice(0,30),cout:n(g.cout,1,500,1),on:g.on?1:0,
    pat:PATS.some(p=>p[0]===g.pat)?g.pat:'errance',
    m:(Array.isArray(g.m)?g.m:[]).filter(m=>m&&ks.includes(m.k)).slice(0,6).map(m=>{const a=n(m.min,1,20,1),b=n(m.max,1,20,a);return {k:m.k,min:Math.min(a,b),max:Math.max(a,b)};})}))};}
let GROUPES=GROUPES_DEF();
try{const g=groupesSains(JSON.parse(localStorage.getItem('np-groupes')||'null'));if(g)GROUPES=g;}catch(e){}
function saveGroupes(){try{localStorage.setItem('np-groupes',JSON.stringify(GROUPES));}catch(e){}touchLocal();}
// effectifs par espèce : ne servent plus qu'au banc de combat et aux mesures (spawnAnimals, spawnBeasts)
let LIFE={insectoide:0};BEASTS.forEach(b=>{LIFE[b.key]=0;});

const grEsc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const grEffectif=g=>{let a=0,b=0;for(const m of g.m){a+=m.min;b+=m.max;}return a===b?''+a:a+' à '+b;};
const grCompo=g=>{const E=ESPECES();return g.m.map(m=>(m.min===m.max?m.min:m.min+'-'+m.max)+' '+((E.find(e=>e[0]===m.k)||[,'?'])[1])).join(' + ')||'vide';};
const grBudgetCarte=()=>Math.round(GROUPES.budget*W*H/(96*64));
function grInfo(){const m=G&&G.menace,p=m&&m.pose?Object.keys(m.pose).map(k=>m.pose[k]+' × '+k).join(', '):'';
  $('grInfo').textContent=`Sur une carte ${W} × ${H} : ${grBudgetCarte()}.`+(m?` Carte en cours : ${m.total-m.reste} dépensés sur ${m.total}${p?' ('+p+')':''}.`:'');}
function buildGroupes(){const E=ESPECES(),ic=k=>ICON[k==='insectoide'?'an0r':'bz'+BEASTS.findIndex(b=>b.key===k)+'r']||'';
  $('grBudget').value=GROUPES.budget;grInfo();
  $('grList').innerHTML=GROUPES.liste.map((g,i)=>`<div class="gcard${g.on?'':' off'}" data-g="${i}">
    <div class="gtop"><input type="text" class="gnom" data-f="n" maxlength="30" value="${grEsc(g.n)}" aria-label="Nom du groupe"><button class="gx" data-a="delg" aria-label="Supprimer le groupe ${grEsc(g.n)}" title="Supprimer ce groupe">×</button></div>
    <div class="grow"><label>Valeur<input type="number" data-f="cout" min="1" max="500" step="1" value="${g.cout}"></label>
      <label>Patrouille<select data-f="pat">${PATS.map(([v,l])=>`<option value="${v}"${v===g.pat?' selected':''}>${l}</option>`).join('')}</select></label>
      <label class="gon"><input type="checkbox" data-f="on"${g.on?' checked':''}>Actif</label></div>
    <div class="gmb">${g.m.map((m,j)=>`<div class="gm" data-m="${j}"><img src="${ic(m.k)}" alt=""><select data-f="k" aria-label="Espèce">${E.map(([k,l])=>`<option value="${k}"${k===m.k?' selected':''}>${grEsc(l)}</option>`).join('')}</select>
      <input type="number" data-f="min" min="1" max="20" step="1" value="${m.min}" aria-label="Effectif minimal"><span>à</span><input type="number" data-f="max" min="1" max="20" step="1" value="${m.max}" aria-label="Effectif maximal"><button class="gx" data-a="delm" aria-label="Retirer cette espèce du groupe" title="Retirer cette espèce">×</button></div>`).join('')}
      <div class="gbas"><button data-a="addm"${g.m.length>=6?' disabled':''}>+ Espèce</button><span>Effectif : ${grEffectif(g)}</span></div></div></div>`).join('')
    ||'<p class="mnote">Aucun groupe : la carte sera vide. Créez-en un avec « + Nouveau groupe ».</p>';}
function buildLife(){
  $('life').innerHTML=`<div class="g2"><label for="lfBudget">Budget de menace</label><input type="number" id="lfBudget" min="0" max="2000" step="5" value="${GROUPES.budget}"></div>`
    +GROUPES.liste.map((g,i)=>`<label class="lfg"><input type="checkbox" data-g="${i}"${g.on?' checked':''}><b>${grEsc(g.n)}</b><span>valeur ${g.cout} · ${grEsc(grCompo(g))}</span></label>`).join('')
    +`<div class="sum">Le budget vaut pour une carte de 96 × 64 ; il suit la surface de la carte (ici ${grBudgetCarte()}). Il achète au hasard des groupes cochés, jusqu’à épuisement. Créer ou régler un groupe : Lab → Groupes.</div>`;}
$('life').addEventListener('change',e=>{const t=e.target;
  if(t.id==='lfBudget'){GROUPES.budget=Math.max(0,Math.min(2000,Math.round(+t.value||0)));saveGroupes();buildLife();return;}
  const g=GROUPES.liste[+t.dataset.g];if(g){g.on=t.checked?1:0;saveGroupes();}});
function openGroupes(){if(TRAV)stopTravel();if(REST)stopRest();if(EXPL)stopExplore();buildGroupes();$('groupes').hidden=false;$('groupes').querySelector('.mcard').focus();}
function closeGroupes(){$('groupes').hidden=true;$('grBtn').focus();render();}
$('grBtn').onclick=openGroupes;$('grClose').onclick=closeGroupes;
$('groupes').addEventListener('pointerdown',ev=>{if(ev.target===$('groupes'))closeGroupes();});
$('grBudget').addEventListener('change',e=>{GROUPES.budget=Math.max(0,Math.min(2000,Math.round(+e.target.value||0)));e.target.value=GROUPES.budget;saveGroupes();grInfo();});
$('grList').addEventListener('change',e=>{const t=e.target,c=t.closest('.gcard');if(!c)return;const g=GROUPES.liste[+c.dataset.g],f=t.dataset.f,r=t.closest('.gm');if(!g||!f)return;
  const nb=(mn,mx)=>Math.max(mn,Math.min(mx,Math.round(+t.value||mn)));
  if(r){const m=g.m[+r.dataset.m];if(!m)return;
    if(f==='k')m.k=t.value;else if(f==='min'){m.min=nb(1,20);if(m.max<m.min)m.max=m.min;}else if(f==='max'){m.max=nb(1,20);if(m.min>m.max)m.min=m.max;}}
  else if(f==='n')g.n=t.value.trim().slice(0,30)||'Groupe';else if(f==='cout')g.cout=nb(1,500);else if(f==='pat')g.pat=t.value;else if(f==='on')g.on=t.checked?1:0;
  saveGroupes();buildGroupes();});
$('grList').addEventListener('click',e=>{const t=e.target.closest('button[data-a]');if(!t)return;const i=+t.closest('.gcard').dataset.g,g=GROUPES.liste[i],a=t.dataset.a;
  if(a==='delg')GROUPES.liste.splice(i,1);
  else if(a==='addm'&&g.m.length<6)g.m.push({k:'crabos',min:1,max:1});
  else if(a==='delm')g.m.splice(+t.closest('.gm').dataset.m,1);
  saveGroupes();buildGroupes();});
$('grAdd').onclick=()=>{if(GROUPES.liste.length>=40)return;GROUPES.liste.push({n:'Nouveau groupe',cout:1,on:1,pat:'errance',m:[{k:'crabos',min:1,max:1}]});saveGroupes();buildGroupes();
  const c=$('grList').lastElementChild;if(c){c.scrollIntoView({block:'nearest'});const n=c.querySelector('.gnom');n.focus();n.select();}};
// « Groupes par défaut » efface les groupes créés : il faut cliquer deux fois
{let arme=0;$('grReset').onclick=()=>{const b=$('grReset');if(!arme){arme=1;b.textContent='Tout remplacer ? Cliquer encore';setTimeout(()=>{arme=0;b.textContent='Groupes par défaut';},3000);return;}
  arme=0;b.textContent='Groupes par défaut';GROUPES=GROUPES_DEF();saveGroupes();buildGroupes();};}
