/* ---------- Blueprints (28 novembre 2026, étape 5) ----------
   Les plans de fabrication ne se trouvent plus nulle part (ni au sol, ni dans les dépôts, vitrines, salles piégées, pièces secrètes,
   ni sur les robots abattus) : ils s'obtiennent au terminal, ENCODAGE → BLUEPRINT (07i appelle encodageBlueprint).
   1. Trois plans distincts, encore inconnus, de rang ≤ niveau + 1 (PLAN_RANG, 14d) ; on en choisit un : appris tout de suite
      (savoir().plans), la capsule correspondante est identifiée, le FABLAB sait le produire.
   2. Moins de trois disponibles : on montre ce qu'il y a ; aucun : BP_MATIERE de Matière {µ} à la place.
   3. Les propositions restent dans la machine (m.bpChoix) : renoncer puis revenir montre les mêmes.
   Il existe un plan de tout ce qui se fabrique (FAB_PRIX) : capsules, accessoires (Sonar compris), armes, armures ; jamais des
   objets de départ, de la clé, du Module de puissance, de la Matière ni des hacks.
   Lab → Blueprints : le même choix sans terminal, au rang du niveau (essai rapide du FABLAB). */
const BP_MATIERE=30;
const BP_FAM={conso:['CAPSULE','var(--c2)'],acc:['ACCESSOIRE','var(--c3)'],eq:['ÉQUIPEMENT','var(--c5)']};
// ce qui a un plan : tout ce que le FABLAB sait produire
const bpTout=()=>Object.keys(FAB_PRIX).filter(k=>ITEMS[k]&&!ITEMS[k].plan&&!ITEMS[k].hack&&!ITEMS[k].base&&!ITEMS[k].mat&&k!=='cle'&&k!=='puissance');
// les plans encore à apprendre à ce niveau
function bpLibres(niv){const s=savoir();return bpTout().filter(k=>!s.plans[k]&&PLAN_RANG(k)<=niv+1);}
function bpTirage(niv,n){return bpLibres(niv).sort(()=>Math.random()-.5).slice(0,n);}
const bpVrai=k=>ITEMS[k].vrai||ITEMS[k];   // une capsule inconnue : sur le plan, son vrai nom (le plan l'identifie)
const bpType=k=>{const d=ITEMS[k];return d.conso?'CAPSULE':SLOTS[d.slot].nom.toUpperCase();};
function bpCarteHTML(k){const v=bpVrai(k),F=BP_FAM[fabFam(k)],eff=ITEMS[k].conso?v.eff:fabEffet(k).replace(/^[^·]*·\s*/,'');   // le type est déjà écrit au-dessus
  return `<button class="tl hkc bpc" data-k="${k}" style="--hk:${F[1]}"><pre class="iart hkart" aria-hidden="true">${artHTML(v)}</pre>`+
    `<b>${termEsc(v.n.toUpperCase())}</b><i>${bpType(k)} · ${FAB_PRIX[k]} MATIÈRE</i><span>${termEsc(eff||'')}</span><small>${termEsc(v.d||'')}</small></button>`;}
function encodageBlueprint(m,el){if(!G)return false;const niv=nivCarte();
  if(!m.bpChoix||!m.bpChoix.every(k=>ITEMS[k]&&FAB_PRIX[k]!=null&&!savoir().plans[k]))m.bpChoix=bpTirage(niv,3);
  if(!m.bpChoix.length){G.st.matiere=(G.st.matiere||0)+BP_MATIERE;SFX.spot();
    say(`BLUEPRINT : AUCUN PLAN NOUVEAU. MATIÈRE {µ} +${BP_MATIERE}.`,'info');
    const L=['BANQUE DE PLANS ...... LUE','PLANS INCONNUS ....... AUCUN',`MATIÈRE {µ} VERSÉE ... +${BP_MATIERE} (RÉSERVE ${G.st.matiere})`];
    if(m.lab){m.bp=1;termSortie(TERM_UI.encodage[0]+' — '+TERM_UI.bp,L);}else termEncodeFait(m,'bp',L);
    return true;}
  bpCartes(m,el);if(TERM)TERM.vise='.bpc';SFX.analyse();return true;}
function bpCartes(m,el){const n=m.bpChoix.length;
  el.innerHTML=`<h3>ENCODAGE — BLUEPRINT</h3><p>RANG ${nivCarte()} · ${n} PLAN${n>1?'S':''} COMPATIBLE${n>1?'S':''} · DESTINATION : FABLAB</p>`+
    `<div class="hkcartes">${m.bpChoix.map(bpCarteHTML).join('')}</div><button class="tl hkr">RENONCER</button>`;
  el.scrollTop=0;
  for(const b of el.querySelectorAll('.bpc'))b.onclick=()=>bpPrend(m,b.dataset.k);
  el.querySelector('.hkr').onclick=()=>{termSortie(TERM_UI.encodage[0]+' — '+TERM_UI.bp,['ÉCRITURE ANNULÉE.',`LES ${n} PLANS RESTENT EN MÉMOIRE.`]);
    if(m.lab)return;termMenu();termSel(Math.max(0,termBoutons().findIndex(x=>x.dataset.a==='bp')));};}
// le choix : le plan est appris, la capsule identifiée
function bpPrend(m,k){if(m.bp||!G||G.over||!ITEMS[k])return;const s=savoir();s.plans[k]=1;identifier(k);SFX.done();
  const v=bpVrai(k),L=[`PLAN : ${v.n.toUpperCase()}`,`TYPE : ${bpType(k)} · COÛT : ${FAB_PRIX[k]} MATIÈRE {µ}`,'ÉCRITURE ...... TERMINÉE',
    'LE FABLAB SAIT MAINTENANT LE PRODUIRE.'];
  say(`BLUEPRINT ${v.n.toUpperCase()} APPRIS : LE FABLAB SAIT LE PRODUIRE.`,'good');INV_H=null;SAC_H='';
  if(m.lab){m.bp=1;termSortie(TERM_UI.encodage[0]+' — '+TERM_UI.bp,L);invChanged();return;}
  termEncodeFait(m,'bp',L);invChanged();}

/* ----- Lab : le choix parmi 3 au rang du niveau, sans terminal (sur le modèle de Lab → Hacks, 14g) ----- */
function bpLab(){if(!G||G.over)return;if(TRAV)stopTravel();if(EXPL)stopExplore();if(REST)stopRest();
  const m={i:-1,s:'terminal',lab:1,act:[],data:1,liaison:0,hack:1,bp:0};TERM={m,sel:0,apres:[],cout:0};
  $('termTitre').textContent='LAB — BLUEPRINTS';
  const conn=()=>{const s=savoir();return bpTout().filter(k=>s.plans[k]).length;};
  const menu=()=>{$('termMenu').innerHTML=`<section class="tsec"><h3>LAB</h3><small>TIRAGE D’ESSAI AU RANG ${nivCarte()} · PLANS CONNUS ${conn()}/${bpTout().length}</small>`+
    `<button class="tl bpn">NOUVEAU TIRAGE</button><button class="tl bpm">MATIÈRE {µ} +100</button></section>`;
    $('termMenu').querySelector('.bpn').onclick=()=>{m.bp=0;m.bpChoix=null;encodageBlueprint(m,$('termOut'));menu();bpVise();};
    $('termMenu').querySelector('.bpm').onclick=()=>{G.st.matiere=(G.st.matiere||0)+100;SFX.spot();
      say(`LAB : MATIÈRE {µ} +100 (RÉSERVE ${G.st.matiere}).`,'info');render();};};
  menu();encodageBlueprint(m,$('termOut'));$('terminal').hidden=false;$('terminal').querySelector('.mcard').focus();bpVise();}
function bpVise(){if(!TERM)return;TERM.vise=null;const n=termBoutons().findIndex(x=>x.classList.contains('bpc'));termSel(Math.max(0,n));}
if(typeof document!=='undefined'&&$('bpBtn'))$('bpBtn').onclick=()=>{$('bpBtn').blur();bpLab();};
