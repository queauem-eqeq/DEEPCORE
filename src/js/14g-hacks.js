/* ---------- Hacks (28 novembre 2026) ----------
   Voir docs/terminaux-journal.md (« Hacks : les trois familles ») et docs/conception-joueur.md (« Hacks »).
   Un hack est un programme, GRATUIT, écrit dans la foreuse par un terminal (ENCODAGE → HACK : un choix parmi 3).
   C'est un objet : clé `hk_<sorte>_<rang>` (Base, Tir) ou `hk_<sorte>` (Noyau, sans rang), dans G.inv comme le reste ;
   équipé, il occupe un des emplacements de hack (à part des 5 emplacements d'objets) ; retiré, il prend une place dans
   l'inventaire ; on peut le jeter. Jamais dans le butin ni au FABLAB.
   Ses effets passent par les modificateurs de l'équipement (mod, ajoutés à G.st par invApply, 14-inventaire) :
     crit, pre, def, capteur        stats existantes ;
     degPct                         dégâts du coup en % (degFact, 08-faune) ;
     regen                          recharge d'énergie en % (regen, 08-faune) ;
     bruitDig                       bruit du forage en % (stealthRange, 09) ;
     detect                         chance d'être remarqué en % (noticeCh, 08-faune) ;
     recyc                          énergie rendue par ennemi détruit (butinMort → hackDetruit) ;
     traque                         rayon où les ennemis en chasse se voient à travers les murs (10-rendu) ;
     symb, sursis, herit            Noyau (voir plus bas) ;
     tirDeg, tirCout, tirBruit, tirCrit, tirPre   Tir : définis, sans effet tant que l'arme de tir n'existe pas.
   Rang = niveau où le hack est obtenu (1 à 10), valeur tirée de l'échelle HACK_E.
   Emplacements : 2, puis +1 aux niveaux 3, 6 et 9 (le plus profond atteint, G.st.nivMax). Un seul exemplaire équipé de
   chaque sorte, un seul hack Noyau équipé. */
const TIR_DISPO=false;                       // pas d'arme de tir : les hacks Tir ne sont jamais proposés, leur part va à Base
const HACK_E=[1,2,3,5,6,8,10,12,13,15];      // échelle par rang (CRIT : +1 % au rang 1, +5 % au 4, +10 % au 7, +15 % au 10)
// chances des familles, par tranche de niveaux (chaque proposition tirée à part)
const HACK_CHANCES=[[3,{base:85,tir:15,noyau:0}],[6,{base:50,tir:40,noyau:10}],[10,{base:25,tir:35,noyau:40}]];
const HACK_PALIERS=[3,6,9];                  // un emplacement de plus en arrivant à ces niveaux
const SYMB_VIE=4,SYMB_COUT=1.25;              // SYMBIOSE : +1 vie tous les 4 battements ; dépenses d'énergie × 1,25
const HACK_FAM={base:{n:'BASE',c:'1',v:'var(--c1)'},tir:{n:'TIR',c:'3',v:'var(--c3)'},noyau:{n:'NOYAU',c:'r',v:'var(--life)'}};
const pc=v=>String(Math.round(v*10)/10).replace('.',',');
// sorte : famille, nom, code de la puce, ligne d'ambiance (relevé de l'unité, jargon machine sans « je » : 28 novembre 2026),
// modificateurs au rang r (E = HACK_E[r-1]), effet chiffré
const HACKS={
  crit:{f:'base',n:'CRIT.SYS',g:'CRT',d:'LIGNES DE RUPTURE : CALCULÉES AVANT IMPACT.',mod:E=>({crit:E}),eff:E=>`CRIT +${E} %`},
  force:{f:'base',n:'FORCE',g:'FRC',d:'LIMITEURS DE COUPLE : LEVÉS. PÉNÉTRATION DU FORET : ACCRUE.',mod:E=>({degPct:2*E}),eff:E=>`DÉGÂTS +${2*E} %`},
  visee:{f:'base',n:'VISÉE',g:'VIS',d:'BOUCLE DE VISÉE : CADENCE SUPÉRIEURE À L’ESQUIVE DES CIBLES.',mod:E=>({pre:E}),eff:E=>`PRE +${E}`},
  blindage:{f:'base',n:'BLINDAGE.RT',g:'BLD',d:'PLAQUES DE COQUE : RAIDISSEMENT AVANT IMPACT.',mod:E=>({def:E}),eff:E=>`DEF +${E}`},
  regen:{f:'base',n:'RÉGÉN.CELL',g:'RGN',d:'CELLULES : ABSORPTION DU COURANT ACCÉLÉRÉE.',mod:E=>({regen:5*E}),eff:E=>`RECHARGE D’ÉNERGIE +${5*E} %`},
  echo:{f:'base',n:'ÉCHO.SCAN',g:'ECH',d:'ÉCHO DES CAPTEURS : RETRAITÉ. ZONE NON VISIBLE : RÉDUITE.',mod:(E,r)=>({capteur:r<=3?1:r<=6?2:3}),
    eff:(E,r)=>`VUE +${r<=3?1:r<=6?2:3}`},
  sourdine:{f:'base',n:'SOURDINE',g:'SRD',d:'FORET : FRÉQUENCE ABAISSÉE. ÉMISSION SONORE : RÉDUITE.',mod:E=>({bruitDig:-3*E}),eff:E=>`BRUIT DU FORAGE −${3*E} %`},
  signature:{f:'base',n:'SIGNATURE',g:'SIG',d:'SIGNATURE DE L’UNITÉ : RETIRÉE DES REGISTRES DES MOBILES.',mod:E=>({detect:-2.5*E}),eff:E=>`DÉTECTION PAR LES ENNEMIS −${pc(2.5*E)} %`},
  recyclage:{f:'base',n:'RECYCLAGE',g:'RCY',d:'RÉSIDUS DES MOBILES DÉTRUITS : CONVERTIS EN ÉNERGIE.',mod:E=>({recyc:Math.max(1,E)}),eff:E=>`+${Math.max(1,E)} ÉNERGIE PAR ENNEMI DÉTRUIT`},
  traque:{f:'base',n:'TRAQUE',g:'TRQ',d:'MOBILES EN CHASSE : TRACE THERMIQUE DANS LA ROCHE. SUIVIE.',mod:E=>({traque:2+Math.round(E/2)}),
    eff:E=>`ENNEMIS EN CHASSE VUS À TRAVERS LES MURS : ${2+Math.round(E/2)} CASES`},
  surcharge:{f:'tir',n:'SURCHARGE',g:'SUR',d:'CANON : AU-DELÀ DE LA PLAGE NOMINALE.',mod:E=>({tirDeg:3*E,tirCout:2*E}),eff:E=>`DÉGÂTS DU TIR +${3*E} % · COÛT +${2*E} %`},
  silence:{f:'tir',n:'SILENCE.TIR',g:'SIL',d:'TIR : ÉMISSION RÉDUITE À UN SOUFFLE.',mod:E=>({tirBruit:-3*E,tirDeg:-E}),eff:E=>`BRUIT DU TIR −${3*E} % · DÉGÂTS −${E} %`},
  economie:{f:'tir',n:'ÉCONOMIE',g:'ECO',d:'CHARGES : COMPTÉES UNE À UNE.',mod:E=>({tirCout:-2*E,tirDeg:-E}),eff:E=>`COÛT DU TIR −${2*E} % · DÉGÂTS −${E} %`},
  perforant:{f:'tir',n:'PERFORANT',g:'PRF',d:'CIBLE : SOUDURE. TÔLE : IGNORÉE.',mod:E=>({tirCrit:E,tirPre:-Math.round(E/2)}),
    eff:E=>`CRIT DU TIR +${E} % · PRÉCISION −${Math.round(E/2)}`},
  symbiose:{f:'noyau',n:'SYMBIOSE',g:'SYM',d:'COQUE : RÉPARÉE PAR SOURCE EXTERNE. ORIGINE : PROFONDEUR. COÛT : RÉSERVES DE L’UNITÉ.',mod:()=>({symb:1}),
    eff:()=>`VIE +1 TOUS LES ${SYMB_VIE} BATTEMENTS · DÉPENSES D’ÉNERGIE +${Math.round((SYMB_COUT-1)*100)} %`},
  sursis:{f:'noyau',n:'SURSIS',g:'SRS',d:'COPIE DE L’UNITÉ EN ATTENTE SOUS LA SURFACE. USAGE : 1.',mod:()=>({sursis:1}),
    eff:()=>'À 0 DE VIE : SURVIT À 1 PV, UNE FOIS · LE HACK SE DÉTRUIT'},
  heritage:{f:'noyau',n:'HÉRITAGE',g:'HRT',d:'CHARGE DE L’UNITÉ : TRANSMISE À L’UNITÉ SUIVANTE.',mod:()=>({herit:1}),
    eff:()=>'À LA DESTRUCTION : CE HACK ET LE MEILLEUR AUTRE PASSENT À L’UNITÉ SUIVANTE'}};
Object.assign(MODS,{degPct:['Dégâts',1,' %'],regen:['Recharge',1,' %'],bruitDig:['Bruit du forage',-1,' %'],detect:['Détection',-1,' %'],
  recyc:['Énergie par destruction',1,''],traque:['Traque',1,' cases'],tirDeg:['Dégâts du tir',1,' %'],tirCout:['Coût du tir',-1,' %'],
  tirBruit:['Bruit du tir',-1,' %'],tirCrit:['CRIT du tir',1,' %'],tirPre:['PRE du tir',1,''],symb:['Symbiose',1,''],sursis:['Sursis',1,''],
  herit:['Héritage',1,'']});
SLOTS.hack={nom:'Hack',g:'¤',get n(){return hackPlaces();}};
// illustration : une puce, du code de la sorte au milieu, de la couleur de sa famille
function hackArt(h){const H=HACKS[h],c=HACK_FAM[H.f].c,F=s=>s.replace(/F/g,c);
  return {art:['    ╷ ╷ ╷ ╷    ','  ┌─┴─┴─┴─┴─┐  ','──┤▒▒ '+H.g+' ▒▒├──','  └─┬─┬─┬─┬─┘  ','    ╵ ╵ ╵ ╵    '],
    col:['....d.d.d.d....',F('..FFFFFFFFFFF..'),F('ddFFF.www.FFFdd'),F('..FFFFFFFFFFF..'),'....d.d.d.d....']};}
const hackCle=(h,r)=>HACKS[h].f==='noyau'?'hk_'+h:'hk_'+h+'_'+r;
// les objets : 10 rangs par hack Base ou Tir, un seul pour un hack Noyau
for(const h in HACKS){const H=HACKS[h],A=hackArt(h);
  for(let r=1;r<=(H.f==='noyau'?1:HACK_E.length);r++){const E=HACK_E[r-1];
    ITEMS[hackCle(h,r)]={n:H.n+(H.f==='noyau'?'':' · R'+r),slot:'hack',hack:1,hk:h,fam:H.f,rang:H.f==='noyau'?0:r,mod:H.mod(E,r),
      eff:H.eff(E,r),d:H.d,art:A.art,col:A.col};}}
const estHack=k=>!!(ITEMS[k]&&ITEMS[k].hack);

/* ----- Emplacements ----- */
const hackNivMax=()=>Math.max((G&&G.niv)||1,(G&&G.st&&G.st.nivMax)||1);
const hackPlaces=n=>{n=n||hackNivMax();return 2+HACK_PALIERS.filter(p=>n>=p).length;};
const hacksPortes=()=>(G.inv||[]).filter(o=>o.eq&&estHack(o.k));
// pourquoi ce hack ne peut pas être équipé maintenant (null : il peut)
function hackRefus(o){const d=ITEMS[o.k],P=hacksPortes().filter(p=>p!==o);
  if(P.some(p=>ITEMS[p.k].hk===d.hk))return `${HACKS[d.hk].n} est déjà actif : un seul exemplaire de chaque hack.`;
  if(d.fam==='noyau'){const n=P.find(p=>ITEMS[p.k].fam==='noyau');if(n)return `Un seul hack Noyau à la fois : ${ITEMS[n.k].n} est actif.`;}
  if(P.length>=hackPlaces())return `Les ${hackPlaces()} emplacements de hack sont pris : retirez-en un d’abord.`;
  return null;}
// arrivée à un niveau : le plus profond atteint est gardé avec la foreuse ; aux niveaux 3, 6 et 9, une ligne au journal
function hacksArrivee(){if(!G||!G.st)return;const a=G.st.nivMax||1,n=G.niv||1;if(n<=a)return;G.st.nivMax=n;
  if(HACK_PALIERS.some(p=>p>a&&p<=n))sayMore(`PROFONDEUR ${n} : BUS D’ENCODAGE ÉLARGI. EMPLACEMENTS DE HACK : ${hackPlaces()}.`,'good');}

/* ----- Tirage ----- */
const hackChances=n=>(HACK_CHANCES.find(([m])=>n<=m)||HACK_CHANCES[HACK_CHANCES.length-1])[1];
// n propositions distinctes au niveau niv ; un hack Noyau déjà porté (équipé ou dans le sac) n'est pas reproposé
function hackTirage(niv,n){niv=Math.max(1,Math.min(HACK_E.length,niv|0||1));const C=hackChances(niv),pris=[],
  deja=new Set((G&&G.inv||[]).filter(o=>estHack(o.k)&&ITEMS[o.k].fam==='noyau').map(o=>ITEMS[o.k].hk));
  const sortes=f=>Object.keys(HACKS).filter(h=>HACKS[h].f===f&&!pris.includes(h)&&!deja.has(h));
  for(let k=0;k<n;k++){const p={base:C.base+(TIR_DISPO?0:C.tir),tir:TIR_DISPO?C.tir:0,noyau:C.noyau},t=p.base+p.tir+p.noyau;
    let r=Math.random()*t,f='base';for(const g of ['base','tir','noyau']){if((r-=p[g])<0){f=g;break;}}
    let l=sortes(f);if(!l.length)l=sortes('base');if(!l.length)break;pris.push(l[Math.floor(Math.random()*l.length)]);}
  return pris.map(h=>hackCle(h,niv));}

/* ----- Effets ----- */
const noticeCh=()=>NOTICE*Math.max(0,1+((G&&G.st&&G.st.detect)||0)/100);
const digMult=()=>Math.max(1,DIG_MULT*(1+((G&&G.st&&G.st.bruitDig)||0)/100));
// RECYCLAGE : un ennemi détruit, par n'importe quel moyen, rend de l'énergie (une fois par ennemi)
function hackDetruit(b){if(!b||b.recy||!G||!G.st||!(G.st.recyc>0))return;b.recy=1;const a=G.st.energie;
  G.st.energie=Math.min(G.st.energieMax,G.st.energie+G.st.recyc);const g=Math.round(G.st.energie-a);
  if(g>0&&typeof addFx==='function')addFx({kind:'num',x:G.px,y:G.py-1,txt:'+'+g,col:PAL['1'],dur:700});}
// TRAQUE : un ennemi en chasse, assez près, se montre par un point (même rendu que l'antenne)
const traqueVoit=b=>!!(G.st&&G.st.traque>0&&b.hunt>0&&Math.max(Math.abs(b.x-G.px),Math.abs(b.y-G.py))<=G.st.traque);
// SYMBIOSE : la vie remonte d'un point tous les SYMB_VIE battements
function symbTick(){if(!(G.st.symb>0)||G.st.vie>=G.st.vieMax||G.st.vie<=0){G.st.symbN=0;return;}
  G.st.symbN=(G.st.symbN||0)+1;if(G.st.symbN>=SYMB_VIE){G.st.symbN=0;G.st.vie=Math.min(G.st.vieMax,G.st.vie+1);}}
// SURSIS : appelé là où la mort est décidée (mortForeuse, 08-faune ; la descente, 14b). true : la foreuse est sauvée.
function sursisSauve(){if(!G||!G.inv||!G.st||G.st.vie>0)return false;const o=G.inv.find(o=>o.eq&&estHack(o.k)&&ITEMS[o.k].mod.sursis);if(!o)return false;
  invApply(o,-1);G.inv.splice(G.inv.indexOf(o),1);G.st.vie=1;
  sayMore('SURSIS : INTÉGRITÉ 0 %. COPIE DE SECOURS CHARGÉE. VIE : 1. HACK SURSIS EFFACÉ.','good');
  if(typeof addFx==='function'){addFx({kind:'onde',x:G.px,y:G.py,r:3.5,dur:700});addFx({kind:'num',x:G.px,y:G.py,txt:'SURSIS',col:PAL['1'],dur:1200});}
  if(typeof SFX!=='undefined'&&SFX.liaison)SFX.liaison();INV_H=null;return true;}
// HÉRITAGE : à la destruction, ce hack et le meilleur autre hack équipé sont gardés pour l'unité suivante (clé np-heritage)
function heritageMort(){try{const P=hacksPortes();if(!P.some(o=>ITEMS[o.k].mod.herit))return;
  const h=P.find(o=>ITEMS[o.k].mod.herit),autre=P.filter(o=>o!==h).sort((a,b)=>ITEMS[b.k].rang-ITEMS[a.k].rang)[0];
  const l=[h.k].concat(autre?[autre.k]:[]);localStorage.setItem('np-heritage',JSON.stringify(l));
  say(`HÉRITAGE : ${l.map(k=>ITEMS[k].n).join(' + ')} TRANSMIS À L’UNITÉ SUIVANTE.`,'good');}catch(e){}}
// nouvelle partie : les hacks hérités arrivent équipés (dans l'inventaire s'ils ne peuvent pas l'être), puis la clé est vidée
function heritageRecoit(){let l=null;try{l=JSON.parse(localStorage.getItem('np-heritage')||'null');localStorage.removeItem('np-heritage');}catch(e){}
  if(!Array.isArray(l)||!G||!G.inv)return;const recus=[];
  for(const k of l){if(!estHack(k))continue;const o={k,eq:0};G.inv.push(o);if(!hackRefus(o)){o.eq=1;invApply(o,1);}recus.push(ITEMS[k].n);}
  if(recus.length)sayMore(`HÉRITAGE REÇU DE L’UNITÉ PRÉCÉDENTE : ${recus.join(' + ')}.`,'good');INV_H=null;}

/* ----- Au terminal : ENCODAGE → HACK, un choix parmi 3 (appelé par termEncode, 07i) ----- */
// les trois propositions sont gardées dans la machine (m.hkChoix) : renoncer puis revenir montre les mêmes
function encodageHack(m,el){if(!m.hkChoix||!m.hkChoix.every(estHack))m.hkChoix=hackTirage(G.niv||1,3);
  hackCartes(m,el);if(TERM)TERM.vise='.hkc';SFX.analyse();return true;}
function hackCarteHTML(k){const d=ITEMS[k],F=HACK_FAM[d.fam];
  return `<button class="tl hkc" data-k="${k}" style="--hk:${F.v}"><pre class="iart hkart" aria-hidden="true">${artHTML(d)}</pre>`+
    `<b>${HACKS[d.hk].n}</b><i>${F.n}${d.rang?' · RANG '+d.rang:''}</i><span>${termEsc(d.eff)}</span><small>${termEsc(d.d)}</small></button>`;}
function hackCartes(m,el){const libres=hackPlaces()-hacksPortes().length;
  el.innerHTML=`<h3>ENCODAGE — HACK</h3><p>RANG ${G.niv||1} · 3 PROGRAMMES COMPATIBLES · EMPLACEMENTS LIBRES : ${libres}/${hackPlaces()}</p>`+
    `<div class="hkcartes">${m.hkChoix.map(hackCarteHTML).join('')}</div><button class="tl hkr">RENONCER</button>`;
  el.scrollTop=0;
  for(const b of el.querySelectorAll('.hkc'))b.onclick=()=>hackPrend(m,b.dataset.k);
  el.querySelector('.hkr').onclick=()=>{termSortie(TERM_UI.encodage[0]+' — '+TERM_UI.hack,['ÉCRITURE ANNULÉE.','LES 3 PROGRAMMES RESTENT EN MÉMOIRE.']);
    if(m.lab)return;termMenu();termSel(Math.max(0,termBoutons().findIndex(x=>x.dataset.a==='hack')));};}
// le choix : équipé s'il le peut, sinon rangé dans l'inventaire ; tout plein : écraser un hack actif
function hackPrend(m,k){if(m.hack||!G||G.over)return;const d=ITEMS[k],o={k,eq:0},r=hackRefus(o);let ou;
  if(!r){G.inv.push(o);o.eq=1;invApply(o,1);ou=`ACTIF · EMPLACEMENT ${hacksPortes().length}/${hackPlaces()}.`;}
  else if(sacPlaces()<SAC_MAX){G.inv.push(o);ou='STOCKÉ DANS L’INVENTAIRE (NON ACTIF).';}
  else return hackEcraser(m,k);
  hackFin(m,k,ou);}
function hackFin(m,k,ou){const d=ITEMS[k];SFX.done();
  const L=[`PROGRAMME : ${HACKS[d.hk].n}${d.rang?' — RANG '+d.rang:''}`,`FAMILLE : ${HACK_FAM[d.fam].n}`,`EFFET : ${d.eff}`,'ÉCRITURE ...... TERMINÉE',ou];
  say(`HACK ${d.n} ÉCRIT : ${ou.replace(/\.$/,'')}.`,'good');INV_H=null;SAC_H='';
  if(m.lab){m.hack=1;termSortie(TERM_UI.encodage[0]+' — '+TERM_UI.hack,L);invChanged();return;}
  termEncodeFait(m,'hack',L);invChanged();}
function hackEcraser(m,k){const d=ITEMS[k],el=$('termOut'),
  P=hacksPortes().filter(p=>{const x=ITEMS[p.k];return d.fam!=='noyau'||x.fam==='noyau'||!hacksPortes().some(q=>ITEMS[q.k].fam==='noyau');})
    .filter(p=>{const s=hacksPortes().find(q=>ITEMS[q.k].hk===d.hk);return !s||s===p;});
  el.innerHTML=`<h3>ENCODAGE — HACK</h3><p>EMPLACEMENTS PLEINS · INVENTAIRE PLEIN (${SAC_MAX}/${SAC_MAX}).</p><p>ÉCRASER UN PROGRAMME ACTIF PAR ${termEsc(d.n)} ?</p>`+
    P.map(p=>`<button class="tl hke" data-k="${p.k}">ÉCRASER ${termEsc(ITEMS[p.k].n)}</button>`).join('')+'<button class="tl hkr">RENONCER</button>';
  for(const b of el.querySelectorAll('.hke'))b.onclick=()=>{const v=hacksPortes().find(p=>p.k===b.dataset.k);if(!v)return;
    invApply(v,-1);G.inv.splice(G.inv.indexOf(v),1);const o={k,eq:1};G.inv.push(o);invApply(o,1);
    hackFin(m,k,`ACTIF · ${ITEMS[v.k].n} ÉCRASÉ.`);};
  el.querySelector('.hkr').onclick=()=>hackCartes(m,el);
  const b=termBoutons(),n=b.findIndex(x=>x.classList.contains('hke'));if(n>=0)termSel(n);}

/* ----- Lab : un choix parmi 3 au rang du niveau, sans terminal ; et la famille « Hacks » de Lab → Items ----- */
function hackLab(){if(!G||G.over)return;if(TRAV)stopTravel();if(EXPL)stopExplore();if(REST)stopRest();
  const m={i:-1,s:'terminal',lab:1,act:[],data:1,liaison:0,hack:0,bp:1};TERM={m,sel:0,apres:[],cout:0};
  $('termTitre').textContent='LAB — HACKS';
  $('termMenu').innerHTML=`<section class="tsec"><h3>LAB</h3><small>TIRAGE D’ESSAI AU RANG ${G.niv||1}</small><button class="tl hkn">NOUVEAU TIRAGE</button></section>`;
  $('termMenu').querySelector('.hkn').onclick=()=>{m.hack=0;m.hkChoix=null;encodageHack(m,$('termOut'));hackVise();};
  encodageHack(m,$('termOut'));$('terminal').hidden=false;$('terminal').querySelector('.mcard').focus();hackVise();}
function hackVise(){if(!TERM)return;TERM.vise=null;const n=termBoutons().findIndex(x=>x.classList.contains('hkc'));termSel(Math.max(0,n));}
const HACK_LAB_RANGS=[1,2,3,4,7,10];   // colonnes du tableau (les rangs intermédiaires suivent HACK_E)
function hacksLabHTML(){let h=`<h3>Hacks (lecture)</h3><p class="mnote">Programmes gratuits, choisis parmi 3 au terminal (ENCODAGE → HACK). Rang = niveau où ils sont obtenus. `+
  `Emplacements : 2, puis 3, 4, 5 aux niveaux ${HACK_PALIERS.join(', ')}. Un seul hack Noyau équipé. Tir : jamais proposés tant que l’arme de tir n’existe pas.</p>`;
  h+='<div class="hkwrap"><table class="hktab"><tr><th>Niveaux</th><th>Base</th><th>Tir</th><th>Noyau</th></tr>'+HACK_CHANCES.map(([m,c],n)=>
    `<tr><td>${n?HACK_CHANCES[n-1][0]+1:1} à ${m}</td><td>${c.base} %</td><td>${c.tir} %</td><td>${c.noyau} %</td></tr>`).join('')+'</table></div>';
  h+='<div class="hkwrap"><table class="hktab"><tr><th>Hack</th><th>Famille</th>'+HACK_LAB_RANGS.map(r=>`<th>R${r}</th>`).join('')+'</tr>';
  for(const k in HACKS){const H=HACKS[k],F=HACK_FAM[H.f];
    const v=r=>{const md=H.mod(HACK_E[r-1],r);return Object.entries(md).map(([a,b])=>signe(Math.round(b*10)/10).replace('.',',')+(MODS[a][2]===' %'?' %':'')).join(' / ');};
    h+=`<tr><td title="${esc(H.d)}"><b>${H.n}</b></td><td style="color:${F.v}">${F.n}</td>`+(H.f==='noyau'?`<td colspan="${HACK_LAB_RANGS.length}">${H.eff()}</td>`
      :HACK_LAB_RANGS.map(r=>`<td>${v(r)}</td>`).join(''))+'</tr>';}
  return h+'</table></div>';}
if(typeof document!=='undefined'&&$('hkBtn'))$('hkBtn').onclick=()=>{$('hkBtn').blur();hackLab();};
