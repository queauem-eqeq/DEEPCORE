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
    art:["  ▄▄▄          ","  ███▄▄▄▄▄▄▄▄  ","  ███▒▒▒▒▒▒▒▒▀ ","  ███▀▀▀▀▀▀▀▀  ","  ▀▀▀          "],
    col:["..111..........","..11122222222..","..111wwwwwwww2.","..11122222222..","..111.........."]},
  trepan:{n:'Trépan lourd',slot:'arme',req:12,de:{n:2,f:6,p:4},mod:{coup:25},
    d:'Une tête de forage massive : chaque coup compte double, mais il faut le temps de l’armer.',
    art:["  ▄▄▄▄▄▄       ","  ██████▄▄▄▄   ","  ██████████▄▄ ","  ██████████▀▀ ","  ██████▀▀▀▀   ","  ▀▀▀▀▀▀       "],
    col:["..111111.......","..1111112222...","..111111222222.","..111111222222.","..1111112222...","..111111......."]},
  carene:{n:'Carène légère',f:1,slot:'armure',req:9,mod:{def:5,vitesse:1,dis:-1},
    d:'Une coque allégée : moins de protection, mais la foreuse va plus vite et s’entend de moins loin.',
    art:['     ▄▄▄▄▄     ','   ▄▀░░░░░▀▄   ','   █░░░░░░░█   ','   ▀▄░░░░░▄▀   ','     ▀▀▀▀▀     '],
    col:['.....ddddd.....','...dd33333dd...','...d3333333d...','...dd33333dd...','.....ddddd.....']},
  blindage:{n:'Blindage composite',slot:'armure',req:12,mod:{def:18,vitesse:-1},
    d:'Des plaques épaisses : la foreuse encaisse bien mieux, et se traîne un peu.',
    art:['   ▄▄▄▄▄▄▄▄▄   ',' ▄▀▓▓▓▓▓▓▓▓▓▀▄ ',' █▓▓▒▒▒▒▒▒▒▓▓█ ',' █▓▓▒▒▒▒▒▒▒▓▓█ ',' ▀▄▓▓▓▓▓▓▓▓▓▄▀ ','   ▀▀▀▀▀▀▀▀▀   '],
    col:['...wwwwwwwww...','.ww333333333ww.','.w33111111133w.','.w33111111133w.','.ww333333333ww.','...wwwwwwwww...']}});
const FAB_PRIX={repar:18,batterie:14,fumigene:16,charge:26,cle:22,accu:40,optique:40,servo:45,stabil:45,viseur:50,gyro:50,conden:55,carene:60,vrille:70,trepan:85,blindage:85};
const FAB_DUREE=300;
let FAB_CASE=-1,FAB_SEL=0;
// ce que propose ce fabricateur : tous les consommables, et quatre équipements à lui
function fabListe(i){G.fab=G.fab||{};
  if(!G.fab[i]){const eq=Object.keys(FAB_PRIX).filter(k=>ITEMS[k]&&!ITEMS[k].conso).sort(()=>Math.random()-.5).slice(0,4).sort((a,b)=>FAB_PRIX[a]-FAB_PRIX[b]);
    G.fab[i]=Object.keys(FAB_PRIX).filter(k=>ITEMS[k]&&ITEMS[k].conso).concat(eq);}
  return G.fab[i];}
const fabEffet=k=>{const d=ITEMS[k];if(d.conso)return d.eff||'';const l=[];if(d.de)l.push('dégâts '+deTxt(d.de));
  for(const m in d.mod||{}){const v=d.mod[m],M=MODS[m];if(M)l.push(`${M[0]} ${v>0?'+':'−'}${Math.abs(v)}${M[2]||''}`);}
  return SLOTS[d.slot].nom+(l.length?' · '+l.join(' · '):'');};
function fabBuild(){const l=fabListe(FAB_CASE),m=G.st.matiere||0;FAB_SEL=Math.max(0,Math.min(l.length-1,FAB_SEL));
  $('fabMat').textContent=`Matière en réserve : ${m}`;
  $('fabList').innerHTML=l.map((k,n)=>{const p=FAB_PRIX[k],ok=m>=p;
    return `<button class="fabl${n===FAB_SEL?' sel':''}${ok?'':' cher'}" data-n="${n}" aria-disabled="${ok?'false':'true'}"><b>${ITEMS[k].n}</b><span>${fabEffet(k)}</span><i>${p}</i></button>`;}).join('');
  const b=$('fabList').querySelector('.sel');if(b)b.scrollIntoView({block:'nearest'});}
function fabOpen(i){if(TRAV)stopTravel();if(EXPL)stopExplore();FAB_CASE=i;FAB_SEL=0;$('fabMsg').textContent='Choisissez un objet : Entrée ou clic pour le fabriquer.';fabBuild();$('fabric').hidden=false;$('fabric').querySelector('.mcard').focus();SFX.spot();}
function fabClose(){$('fabric').hidden=true;FAB_CASE=-1;render();}
function fabFais(n){const l=fabListe(FAB_CASE),k=l[n];if(!k||G.over)return;FAB_SEL=n;const p=FAB_PRIX[k],m=G.st.matiere||0;
  if(m<p){$('fabMsg').textContent=`Matière insuffisante : ${ITEMS[k].n} en demande ${p}, la réserve est de ${m}.`;SFX.blocked();fabBuild();return;}
  G.st.matiere=m-p;const c=idx(G.px,G.py);G.items=G.items||{};(G.items[c]=G.items[c]||[]).push(k);
  G.turn++;G.msg=null;SFX.serrure();say(`Fabricateur : ${ITEMS[k].n} (−${p} Matière, réserve ${G.st.matiere}).`,'good');invPickup(true);
  sacFix();SAC_H='';INV_H='';pass(FAB_DUREE);computeFOV();
  $('fabMsg').textContent=`${ITEMS[k].n} fabriqué${ITEMS[k].f?'e':''}${ITEMS[k].pl?'s':''}.`+((G.items[c]||[]).includes(k)?' Inventaire plein : l’objet est au sol, sous la foreuse.':'');
  if(G.over&&G.over.dead){fabClose();dead();return;}
  fabBuild();render();}
function fabKey(ev){const l=fabListe(FAB_CASE);
  if(ev.key==='Escape'){ev.preventDefault();fabClose();}
  else if(ev.key==='ArrowDown'||ev.key==='s'){ev.preventDefault();FAB_SEL=(FAB_SEL+1)%l.length;fabBuild();}
  else if(ev.key==='ArrowUp'||ev.key==='z'||ev.key==='w'){ev.preventDefault();FAB_SEL=(FAB_SEL+l.length-1)%l.length;fabBuild();}
  else if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();fabFais(FAB_SEL);}}
$('fabClose').onclick=fabClose;$('fabric').addEventListener('pointerdown',ev=>{if(ev.target===$('fabric'))fabClose();});
$('fabList').addEventListener('click',e=>{const b=e.target.closest('button[data-n]');if(b)fabFais(+b.dataset.n);});
