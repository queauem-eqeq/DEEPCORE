/* ---------- FABLAB (21 novembre 2026 ; « Fabricateur » jusqu'au 26 novembre 2026) ----------
   Une machine des bâtiments (terrain FABRIC, posé par 07f-machines) : la foreuse avance dessus, une liste s'ouvre, et la Matière
   en réserve se change en objets. C'est le premier usage de la Matière, qui ne servait encore à rien.
   Présentation du 26 novembre 2026 : les boutons ne portent plus que le numéro entre crochets, le nom et le prix — deux fois
   moins larges —, et se suivent sur la même ligne en revenant à la ligne quand la place manque. L'effet et la description
   complète restent sous l'illustration ASCII, à droite. L'en-tête montre la Matière en réserve puis les vingt places de
   l'inventaire, en quatre rangées de cinq carrés classés par type.
   Chaque fabricateur propose tous les consommables et quatre pièces d'équipement tirées au hasard, les siennes pour de bon
   (G.fab[case]) : deux fabricateurs ne vendent pas la même chose. Une fabrication prend 3 battements. L'objet tombe aux pieds de
   la foreuse et est ramassé aussitôt s'il y a de la place.
   Quatre pièces d'équipement nouvelles (choix de l'utilisateur : « consommables + équipement ») : deux armes, deux armures.
   Prix en Matière. Repère : une carte de taille 3 porte deux gisements de Matière de 30 à 50, soit 80 environ par niveau. */
Object.assign(ITEMS,{
  vrille:{n:'Vrille rapide',f:1,slot:'arme',req:9,de:{n:1,f:4,p:4},mod:{coup:-30,crit:5},
    d:'Une mèche fine qui tourne vite : coups moins lourds, mais plus rapprochés et plus souvent critiques.',
    art:["     █▓▓▓█     ", "     ▐▒▒▒▌     ", "      ▐▒▌      ", "      ▐▒▌      ", "      ▐▒▌      ", "       ▀       "],
    col:[".....31113.....", ".....21112.....", "......212......", "......212......", "......212......", ".......2......."]},
  // 2d6+6 depuis le 22 novembre 2026 (2d6+4 : à peine mieux que la foreuse de série, voir docs/mesures.md)
  trepan:{n:'Trépan lourd',slot:'arme',req:12,de:{n:2,f:6,p:6},mod:{coup:25},
    
    d:'Une tête de forage massive : chaque coup compte double, mais il faut le temps de l’armer.',
    art:["  ▄▄▄▄▄▄▄▄▄▄▄  ", "  █▓▓▓▓▓▓▓▓▓█  ", " ▐▒▒▒▒▒▒▒▒▒▒▒▌ ", " ▐▒▒▒▒▒▒▒▒▒▒▒▌ ", "  ▀▒▒▒▒▒▒▒▒▒▀  ", "    ▀▀▀▀▀▀▀    "],
    col:["..33333333333..", "..31111111113..", ".2111111111112.", ".2111111111112.", "..21111111112..", "....2222222...."]},
  carene:{n:'Carène légère',f:1,slot:'armure',req:9,mod:{def:5,pas:-10,dis:-1},
    d:'Une coque allégée : moins de protection, mais '+NOM_FOREUSE+' va plus vite et s’entend de moins loin.',
    art:["   ▄       ▄   ", "   █▀▀▀▀▀▀▀█   ", "   █░░░█░░░█   ", "    ▀▄░░░▄▀    ", "      ▀▀▀      "],
    col:["...3.......3...", "...333333333...", "...322232223...", "....3322233....", "......333......"]},
  // DEF +25 depuis le 22 novembre 2026 (+18 : aucun gain mesuré)
  blindage:{n:'Blindage composite',slot:'armure',req:12,mod:{def:25,pas:25},
    
    d:'Des plaques épaisses : '+NOM_FOREUSE+' encaisse bien mieux, et se traîne un peu.',
    art:[" ▄▄         ▄▄ ", " █▓█▀▀▀▀▀▀▀█▓█ ", " █▓▒▒▒▐█▌▒▒▒▓█ ", " █▓▒▒▒▒▒▒▒▒▒▓█ ", "  ▀▄▓▓▓▓▓▓▓▄▀  ", "    ▀▀▀▀▀▀▀    "],
    col:[".ww.........ww.", ".w3wwwwwwwww3w.", ".w31113331113w.", ".w31111111113w.", "..ww3333333ww..", "....wwwwwww...."]}});
/* Arme de tir (28 novembre 2026, chantier « Survie », bloc D ; logique dans 14m-tir.js). Emplacement « tir », à part de l'arme de forage.
   Le canon est l'arme de tir de base : donné au départ, jamais perdu (fixe : il ne prend pas de place dans l'inventaire, ne se jette pas,
   revient en main quand on retire une autre arme de tir). Les quatre autres le remplacent quand on les équipe. Leurs chiffres (dégâts,
   précision, énergie, portée, brûlure, glu…) sont dans ITEM_VAL (14d), réglables dans Lab → Items. Deux accessoires silencieux.
   Les armes de tir et les silencieux ne tombent jamais en butin : blueprint au terminal, puis FABLAB. */
Object.assign(ITEMS,{
  canon:{n:'Canon',slot:'tir',tir:1,base:1,fixe:1,mod:{},
    d:'CANON CINÉTIQUE DE SÉRIE. MONTÉ D’ORIGINE. PROJECTILE : MASSE DE TUNGSTÈNE. RECHARGE : SUR LA RÉSERVE D’ÉNERGIE.',
    art:["   ▄▄▄▄▄▄      ", "  █▓▓▓▓▓▓█════ ", "  █▒▒▒▒▒▒█════ ", "   ▀█▀▀▀▀▀     ", "    ▀          "],
    col:["...333333......", "..31111113dddd.", "..32222223dddd.", "...333333......", "....3.........."]},
  lanceflamme:{n:'Lance-flammes',slot:'tir',tir:1,mod:{},
    d:'BUSE À PLASMA FROID. PORTÉE COURTE. CIBLE : EN COMBUSTION APRÈS IMPACT.',
    art:["  ▄▄▄          ", " █▒▒▒█▄▄▄▄▄ ≈≈ ", " █▒▒▒█▓▓▓▓▓█≈≈≈", "  ▀█▀       ≈≈ ", "   ▀           "],
    col:["..333..........", ".32223333333.r1", ".32223111113r1r", "..333.......1r.", "...3..........."]},
  canonglu:{n:'Canon à glu',f:1,slot:'tir',tir:1,mod:{},
    d:'PROJECTEUR DE POLYMÈRE. LA CIBLE ENGLUÉE PERD LA MOITIÉ DE SA CADENCE.',
    art:["   ▄▄▄▄▄       ", "  █░░░░░█▄▄  o ", "  █░▒▒▒░███ oOo", "   ▀█▀▀▀▀▀   o ", "    ▀          "],
    col:["...33333.......", "..3222223333.2.", "..32111233322w2", "...333333...2..", "....3.........."]},
  shotgun:{n:'Shotgun',slot:'tir',tir:1,mod:{},
    d:'CANON À GRENAILLE. GERBE LARGE, PORTÉE COURTE. BRUYANT.',
    art:[" ▄▄▄▄▄▄▄▄▄  · ·", "█▓▓▓▓▓▓▓▓═ · ·:", "█▒▒▒▒▒▒▒▒═ · · ", " ▀▀█▀▀       · ", "   ▀           "],
    col:[".333333333..w.1", "3111111111.1.w1", "3222222223.w.1.", ".33333......w..", "...3..........."]},
  laser:{n:'Laser',slot:'tir',tir:1,mod:{},
    d:'ÉMETTEUR COHÉRENT. LE FAISCEAU TRAVERSE LES MOBILES ALIGNÉS. ARRÊT : PAROI.',
    art:["    ▄▄▄▄▄      ", "  ▐█▓▓▓▓▓█▌    ", "──┤▒▒▒▒▒▒▒├━━━━", "  ▐█▓▓▓▓▓█▌    ", "    ▀▀▀▀▀      "],
    col:["....33333......", "..3311111133...", "dd3222222213www", "..3311111133...", "....33333......"]},
  silforage:{n:'Forage silencieux',slot:'acc',sil:1,mod:{silDig:1},eff:'BRUIT DU FORAGE ÷ 2',
    d:'MANCHON AMORTISSEUR AUTOUR DU FORET. ONDE DE CHOC : ÉTOUFFÉE.',
    art:["   ┌───────┐   ", "   │░░░░░░░│   ", "   │░ ▼▼▼ ░│   ", "   │░░░░░░░│   ", "   └──┬─┬──┘   "],
    col:["...3333333.....", "...3222222.3...", "...32.111.23...", "...3222222.3...", "...33333333...."]},
  siltir:{n:'Tir silencieux',slot:'acc',sil:1,mod:{silTir:1},eff:'BRUIT DU TIR ÷ 2',
    d:'RÉDUCTEUR DE BOUCHE. DÉTONATION : RAMENÉE À UN CLAQUEMENT SEC.',
    art:["  ┌─────────┐  ", "══╡▒▒▒▒▒▒▒▒▒╞══", "  └─────────┘  ", "   ░ ░ ░ ░ ░   "],
    col:["..33333333333..", "dd32222222223dd", "..33333333333..", "...2.2.2.2.2..."]}});
const FAB_PRIX={repar:18,batterie:14,fumigene:16,charge:34,accu:40,optique:40,servo:45,stabil:45,viseur:50,gyro:50,conden:55,
  carene:60,vrille:70,trepan:85,blindage:85,lanceflamme:70,canonglu:65,shotgun:75,laser:90,silforage:45,siltir:45};
const FAB_DUREE=300;
let FAB_CASE=-1,FAB_SEL=0;
// ce que propose ce fabricateur : tous les consommables, et quatre équipements à lui
// 22 novembre 2026 : seulement les objets dont la foreuse a le plan (depuis le 28 novembre 2026 : appris aux terminaux)
function fabListe(i){const p=savoir().plans;
  return Object.keys(FAB_PRIX).filter(k=>ITEMS[k]&&p[k]).sort((a,b)=>(ITEMS[a].conso?0:1)-(ITEMS[b].conso?0:1)||FAB_PRIX[a]-FAB_PRIX[b]);}
const fabEffet=k=>{const d=ITEMS[k];if(d.conso)return d.eff||'';if(d.sonar||d.sil)return SLOTS[d.slot].nom+' · '+d.eff;
  if(d.slot==='tir'&&typeof tirFicheTxt==='function')return SLOTS.tir.nom+' · '+tirFicheTxt(d);const l=[];if(d.de)l.push('dégâts '+deTxt(d.de));
  for(const m in d.mod||{}){const v=d.mod[m],M=MODS[m];if(M)l.push(`${M[0]} ${v>0?'+':'−'}${Math.abs(v)}${M[2]||''}`);}
  return SLOTS[d.slot].nom+(l.length?' · '+l.join(' · '):'');};
// famille d'un objet, pour la couleur de son nom (22 novembre 2026) : consommable, accessoire, arme ou armure
const fabFam=k=>{const d=ITEMS[k];return d.conso?'conso':d.slot==='acc'?'acc':'eq';};
/* Les vingt places de l'inventaire (26 novembre 2026) : un carré par exemplaire transporté, classé par type — consommables en
   bio, accessoires en monde, armes et armures en bâti. Ce qui est PORTÉ ne prend pas de place et ne figure donc pas ici.
   Un carré vide est un contour blanc d'un pixel sur fond noir (style.css). */
const fabFamObj=o=>{const d=ITEMS[o.k];return d.conso?'conso':d.slot==='acc'?'acc':'eq';};
const FAB_FAM_ORD={conso:0,acc:1,eq:2};
function sacCases(){const l=G.inv.filter(o=>!o.eq&&!ITEMS[o.k].fixe).slice().sort((a,b)=>FAB_FAM_ORD[fabFamObj(a)]-FAB_FAM_ORD[fabFamObj(b)]),c=[];
  for(const o of l)for(let n=0;n<(o.n||1);n++)c.push(fabFamObj(o));
  return c.slice(0,SAC_MAX);}
function fabGrille(){const c=sacCases(),n=$('fabSacN');
  n.textContent=`Inventaire ${c.length}/${SAC_MAX}`;n.classList.toggle('full',c.length>=SAC_MAX);
  $('fabGrille').innerHTML=Array.from({length:SAC_MAX},(_,k)=>`<i class="${c[k]?'g-'+c[k]:''}"></i>`).join('');}
function fabBuild(){const l=fabListe(FAB_CASE),m=G.st.matiere||0;FAB_SEL=Math.max(0,Math.min(l.length-1,FAB_SEL));
  $('fabMat').textContent=`Matière {µ} en réserve : ${m}`;fabGrille();
  $('fabList').innerHTML=l.map((k,n)=>{const p=FAB_PRIX[k],ok=m>=p;
    return `<button class="fabl f-${fabFam(k)}${n===FAB_SEL?' sel':''}${ok?'':' cher'}" data-n="${n}" aria-disabled="${ok?'false':'true'}"><u>[${n+1}]</u><b>${ITEMS[k].n}</b><i>${p}</i></button>`;}).join('');
  const b=$('fabList').querySelector('.sel');if(b)b.scrollIntoView({block:'nearest'});fabVue();}
// à droite : l'illustration ASCII de l'objet sélectionné (la même que dans l'inventaire), son nom et sa description
function fabVue(){const k=fabListe(FAB_CASE)[FAB_SEL],d=k&&ITEMS[k];if(!d){$('fabVue').innerHTML='';return;}
  $('fabVue').className='f-'+fabFam(k);   // hauteur fixe (style.css) : la fenêtre ne bouge pas d'un objet à l'autre
  $('fabVue').innerHTML=`<div class="iart" aria-hidden="true">${d.art?artHTML(d):''}</div><b>${d.n}</b><p>${fabEffet(k)}</p><p>${d.d||''}</p>`;}
function fabSel(n){if(n===FAB_SEL)return;FAB_SEL=n;
  for(const b of $('fabList').children)b.classList.toggle('sel',+b.dataset.n===n);fabVue();}
function fabOpen(i){if(TRAV)stopTravel();if(EXPL)stopExplore();FAB_CASE=i;FAB_SEL=0;
  $('fabMsg').textContent=fabListe(i).length?'Choisissez un objet : Entrée ou clic pour le fabriquer.':'Aucun plan connu : le FABLAB ne sait rien produire. Les plans s’obtiennent aux terminaux : ENCODAGE → BLUEPRINT.';
  fabBuild();$('fabric').hidden=false;$('fabric').querySelector('.mcard').focus();SFX.spot();}
function fabClose(){$('fabric').hidden=true;FAB_CASE=-1;render();}
function fabFais(n){const l=fabListe(FAB_CASE),k=l[n];if(!k||G.over)return;FAB_SEL=n;const p=FAB_PRIX[k],m=G.st.matiere||0;
  if(m<p){$('fabMsg').textContent=`Matière {µ} insuffisante : ${ITEMS[k].n} en demande ${p}, la réserve est de ${m}.`;
    SFX.blocked();fabBuild();return;}
  // l'objet sort sous la foreuse et va au sac ; sac plein, il reste au sol — sur une case libre, jamais sur un autre objet (22 novembre 2026)
  G.st.matiere=m-p;const ici=idx(G.px,G.py),place=sacPlaces()<SAC_MAX,c=place?ici:caseSol(G.px,G.py,true);
    G.items=G.items||{};
  G.turn++;G.msg=null;SFX.serrure();say(`FABLAB : ${ITEMS[k].n} (−${p} Matière {µ}, réserve ${G.st.matiere}).`,'good');
  // seul l'objet fabriqué est ramassé
  if(place){const avant=G.items[ici];G.items[ici]=[k];invPickup(true);if(avant&&avant.length)G.items[ici]=avant;}
  else (G.items[c]=G.items[c]||[]).push(k);
  sacFix();SAC_H='';INV_H='';pass(FAB_DUREE);computeFOV();
  $('fabMsg').textContent=`${ITEMS[k].n} fabriqué${ITEMS[k].f?'e':''}${ITEMS[k].pl?'s':''}.`+(place?'':` Inventaire plein : l’objet est au sol${c===ici?', sous '+NOM_FOREUSE+'':', à côté'}.`);
  if(G.over&&G.over.dead){fabClose();dead();return;}
  fabBuild();render();}
/* Clavier : flèches, Z/S, ou le pavé numérique (8 et 2 montent et descendent, 5 ou Entrée fabrique, 22 novembre 2026).
   Les chiffres du haut du clavier (1 à 9) choisissent directement l'objet de ce numéro. */
function fabKey(ev){const l=fabListe(FAB_CASE),c=ev.code||'',np=c.startsWith('Numpad');
  if(ev.key==='Escape'){ev.preventDefault();fabClose();}
  // les boutons se suivent en ligne depuis le 26 novembre 2026 : droite et gauche avancent comme bas et haut
  else if(ev.key==='ArrowDown'||ev.key==='ArrowRight'||ev.key==='s'||ev.key==='d'||c==='Numpad2'||c==='Numpad6'){ev.preventDefault();
    FAB_SEL=(FAB_SEL+1)%l.length;fabBuild();}
  else if(ev.key==='ArrowUp'||ev.key==='ArrowLeft'||ev.key==='z'||ev.key==='w'||ev.key==='q'||ev.key==='a'||c==='Numpad8'||c==='Numpad4'){
    ev.preventDefault();FAB_SEL=(FAB_SEL+l.length-1)%l.length;fabBuild();}
  else if(ev.key==='Enter'||ev.key===' '||c==='Numpad5'){ev.preventDefault();fabFais(FAB_SEL);}
  else if(!np&&/^[1-9]$/.test(ev.key)&&+ev.key<=l.length){ev.preventDefault();FAB_SEL=+ev.key-1;fabBuild();}}
$('fabClose').onclick=fabClose;$('fabric').addEventListener('pointerdown',ev=>{if(ev.target===$('fabric'))fabClose();});
// survol ou focus : l'illustration suit
$('fabList').addEventListener('pointerover',e=>{const b=e.target.closest('button[data-n]');if(b)fabSel(+b.dataset.n);});
$('fabList').addEventListener('focusin',e=>{const b=e.target.closest('button[data-n]');if(b)fabSel(+b.dataset.n);});
$('fabList').addEventListener('click',e=>{const b=e.target.closest('button[data-n]');if(b)fabFais(+b.dataset.n);});
