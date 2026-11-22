/* ---------- Fabricateur (21 novembre 2026) ----------
   Une machine des bâtiments (terrain FABRIC, posé par 07f-machines) : la foreuse avance dessus, une liste s'ouvre, et la Matière
   en réserve se change en objets. C'est le premier usage de la Matière, qui ne servait encore à rien.
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
  trepan:{n:'Trépan lourd',slot:'arme',req:12,de:{n:2,f:6,p:6},mod:{coup:25},   // 2d6+6 depuis le 22 novembre 2026 (2d6+4 : à peine mieux que la foreuse de série, voir docs/mesures.md)
    
    d:'Une tête de forage massive : chaque coup compte double, mais il faut le temps de l’armer.',
    art:["  ▄▄▄▄▄▄▄▄▄▄▄  ", "  █▓▓▓▓▓▓▓▓▓█  ", " ▐▒▒▒▒▒▒▒▒▒▒▒▌ ", " ▐▒▒▒▒▒▒▒▒▒▒▒▌ ", "  ▀▒▒▒▒▒▒▒▒▒▀  ", "    ▀▀▀▀▀▀▀    "],
    col:["..33333333333..", "..31111111113..", ".2111111111112.", ".2111111111112.", "..21111111112..", "....2222222...."]},
  carene:{n:'Carène légère',f:1,slot:'armure',req:9,mod:{def:5,vitesse:1,dis:-1},
    d:'Une coque allégée : moins de protection, mais la foreuse va plus vite et s’entend de moins loin.',
    art:["   ▄       ▄   ", "   █▀▀▀▀▀▀▀█   ", "   █░░░█░░░█   ", "    ▀▄░░░▄▀    ", "      ▀▀▀      "],
    col:["...3.......3...", "...333333333...", "...322232223...", "....3322233....", "......333......"]},
  blindage:{n:'Blindage composite',slot:'armure',req:12,mod:{def:25,vitesse:-1},   // DEF +25 depuis le 22 novembre 2026 (+18 : aucun gain mesuré)
    
    d:'Des plaques épaisses : la foreuse encaisse bien mieux, et se traîne un peu.',
    art:[" ▄▄         ▄▄ ", " █▓█▀▀▀▀▀▀▀█▓█ ", " █▓▒▒▒▐█▌▒▒▒▓█ ", " █▓▒▒▒▒▒▒▒▒▒▓█ ", "  ▀▄▓▓▓▓▓▓▓▄▀  ", "    ▀▀▀▀▀▀▀    "],
    col:[".ww.........ww.", ".w3wwwwwwwww3w.", ".w31113331113w.", ".w31111111113w.", "..ww3333333ww..", "....wwwwwww...."]}});
const FAB_PRIX={repar:18,batterie:14,fumigene:16,charge:34,cle:22,accu:40,optique:40,servo:45,stabil:45,viseur:50,gyro:50,conden:55,carene:60,vrille:70,trepan:85,blindage:85};
const FAB_DUREE=300;
let FAB_CASE=-1,FAB_SEL=0;
// ce que propose ce fabricateur : tous les consommables, et quatre équipements à lui
// 22 novembre 2026 : seulement les objets dont la foreuse a trouvé le plan (au sol, sur les robots, dans les dépôts)
function fabListe(i){const p=savoir().plans;return Object.keys(FAB_PRIX).filter(k=>ITEMS[k]&&p[k]).sort((a,b)=>(ITEMS[a].conso?0:1)-(ITEMS[b].conso?0:1)||FAB_PRIX[a]-FAB_PRIX[b]);}
const fabEffet=k=>{const d=ITEMS[k];if(d.conso)return d.eff||'';const l=[];if(d.de)l.push('dégâts '+deTxt(d.de));
  for(const m in d.mod||{}){const v=d.mod[m],M=MODS[m];if(M)l.push(`${M[0]} ${v>0?'+':'−'}${Math.abs(v)}${M[2]||''}`);}
  return SLOTS[d.slot].nom+(l.length?' · '+l.join(' · '):'');};
// famille d'un objet, pour la couleur de son nom (22 novembre 2026) : consommable, accessoire, arme ou armure
const fabFam=k=>{const d=ITEMS[k];return d.conso?'conso':d.slot==='acc'?'acc':'eq';};
function fabBuild(){const l=fabListe(FAB_CASE),m=G.st.matiere||0;FAB_SEL=Math.max(0,Math.min(l.length-1,FAB_SEL));
  $('fabMat').textContent=`Matière en réserve : ${m}`;
  $('fabList').innerHTML=l.map((k,n)=>{const p=FAB_PRIX[k],ok=m>=p;
    return `<button class="fabl f-${fabFam(k)}${n===FAB_SEL?' sel':''}${ok?'':' cher'}" data-n="${n}" aria-disabled="${ok?'false':'true'}"><b><u>${n+1}</u>${ITEMS[k].n}</b><span>${fabEffet(k)}</span><i>${p}</i></button>`;}).join('');
  const b=$('fabList').querySelector('.sel');if(b)b.scrollIntoView({block:'nearest'});fabVue();}
// à droite : l'illustration ASCII de l'objet sélectionné (la même que dans l'inventaire), son nom et sa description
function fabVue(){const k=fabListe(FAB_CASE)[FAB_SEL],d=k&&ITEMS[k];if(!d){$('fabVue').innerHTML='';return;}
  $('fabVue').className='f-'+fabFam(k);   // hauteur fixe (style.css) : la fenêtre ne bouge pas d'un objet à l'autre
  $('fabVue').innerHTML=`<div class="iart" aria-hidden="true">${d.art?artHTML(d):''}</div><b>${d.n}</b><p>${fabEffet(k)}</p><p>${d.d||''}</p>`;}
function fabSel(n){if(n===FAB_SEL)return;FAB_SEL=n;for(const b of $('fabList').children)b.classList.toggle('sel',+b.dataset.n===n);fabVue();}
function fabOpen(i){if(TRAV)stopTravel();if(EXPL)stopExplore();FAB_CASE=i;FAB_SEL=0;$('fabMsg').textContent=fabListe(i).length?'Choisissez un objet : Entrée ou clic pour le fabriquer.':'Aucun plan connu : le fabricateur ne sait rien produire. Les plans se trouvent au sol, dans les dépôts et sur les robots abattus.';fabBuild();$('fabric').hidden=false;$('fabric').querySelector('.mcard').focus();SFX.spot();}
function fabClose(){$('fabric').hidden=true;FAB_CASE=-1;render();}
function fabFais(n){const l=fabListe(FAB_CASE),k=l[n];if(!k||G.over)return;FAB_SEL=n;const p=FAB_PRIX[k],m=G.st.matiere||0;
  if(m<p){$('fabMsg').textContent=`Matière insuffisante : ${ITEMS[k].n} en demande ${p}, la réserve est de ${m}.`;SFX.blocked();fabBuild();return;}
  // l'objet sort sous la foreuse et va au sac ; sac plein, il reste au sol — sur une case libre, jamais sur un autre objet (22 novembre 2026)
  G.st.matiere=m-p;const ici=idx(G.px,G.py),place=!ITEMS[k].conso||sacPlaces()<SAC_MAX,c=place?ici:caseSol(G.px,G.py,true);G.items=G.items||{};
  G.turn++;G.msg=null;SFX.serrure();say(`Fabricateur : ${ITEMS[k].n} (−${p} Matière, réserve ${G.st.matiere}).`,'good');
  if(place){const avant=G.items[ici];G.items[ici]=[k];invPickup(true);if(avant&&avant.length)G.items[ici]=avant;}   // seul l'objet fabriqué est ramassé
  else (G.items[c]=G.items[c]||[]).push(k);
  sacFix();SAC_H='';INV_H='';pass(FAB_DUREE);computeFOV();
  $('fabMsg').textContent=`${ITEMS[k].n} fabriqué${ITEMS[k].f?'e':''}${ITEMS[k].pl?'s':''}.`+(place?'':` Inventaire plein : l’objet est au sol${c===ici?', sous la foreuse':', à côté'}.`);
  if(G.over&&G.over.dead){fabClose();dead();return;}
  fabBuild();render();}
/* Clavier : flèches, Z/S, ou le pavé numérique (8 et 2 montent et descendent, 5 ou Entrée fabrique, 22 novembre 2026).
   Les chiffres du haut du clavier (1 à 9) choisissent directement l'objet de ce numéro. */
function fabKey(ev){const l=fabListe(FAB_CASE),c=ev.code||'',np=c.startsWith('Numpad');
  if(ev.key==='Escape'){ev.preventDefault();fabClose();}
  else if(ev.key==='ArrowDown'||ev.key==='s'||c==='Numpad2'){ev.preventDefault();FAB_SEL=(FAB_SEL+1)%l.length;fabBuild();}
  else if(ev.key==='ArrowUp'||ev.key==='z'||ev.key==='w'||c==='Numpad8'){ev.preventDefault();FAB_SEL=(FAB_SEL+l.length-1)%l.length;fabBuild();}
  else if(ev.key==='Enter'||ev.key===' '||c==='Numpad5'){ev.preventDefault();fabFais(FAB_SEL);}
  else if(!np&&/^[1-9]$/.test(ev.key)&&+ev.key<=l.length){ev.preventDefault();FAB_SEL=+ev.key-1;fabBuild();}}
$('fabClose').onclick=fabClose;$('fabric').addEventListener('pointerdown',ev=>{if(ev.target===$('fabric'))fabClose();});
$('fabList').addEventListener('pointerover',e=>{const b=e.target.closest('button[data-n]');if(b)fabSel(+b.dataset.n);});   // survol ou focus : l'illustration suit
$('fabList').addEventListener('focusin',e=>{const b=e.target.closest('button[data-n]');if(b)fabSel(+b.dataset.n);});
$('fabList').addEventListener('click',e=>{const b=e.target.closest('button[data-n]');if(b)fabFais(+b.dataset.n);});
