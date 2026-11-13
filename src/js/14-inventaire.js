/* ---------- Inventaire et équipement (13 novembre 2026) ----------
   G.inv   : objets portés, [{k:'foret',eq:0|1}, …]. Un objet équipé reste dans la liste, affiché d'une autre couleur.
   G.items : objets posés au sol, {case:[k, …]} ; la foreuse qui passe dessus les ramasse.
   Équiper un objet AJOUTE ses modificateurs (mod) aux stats de G.st, le retirer les ENLÈVE : le reste du jeu lit G.st
   sans rien savoir de l'équipement, et les joyaux (qui modifient aussi G.st) s'additionnent sans conflit.
   Champs de mod : degats, pre, crit, esq, vitesse, capteur, power, vieMax,
                   dis (portée de discrétion, en cases), coup (durée d'un coup de foreuse, en unités de temps).
   Dessins : art = lignes de caractères ; col = même grille, une couleur par caractère
             (w blanc · 1 accent · 2 bio · 3 monde · e énergie · r rouge · d gris · . couleur du texte). */
const SLOTS={arme:{n:1,nom:'Arme',g:'/'},armure:{n:1,nom:'Armure',g:'['},acc:{n:3,nom:'Accessoire',g:'='}};
// libellé, sens favorable (+1 : plus c'est haut mieux c'est ; −1 : l'inverse), unité
const MODS={degats:['DEG',1,''],pre:['PRE',1,''],crit:['CRIT',1,' %'],esq:['ESQ',1,''],vitesse:['VIT',1,''],capteur:['EYE',1,''],
  power:['POW',1,''],vieMax:['Vie max',1,''],dis:['DIS',-1,''],coup:['Coup',-1,'']};
const ITEMS={
  foret:{n:'Foret diamant',slot:'arme',mod:{degats:4,pre:10,coup:-25},
    d:'Pointe fine et précise. Frappe plus vite qu’un coup ordinaire.',
    art:[' ┌─┐▄▄▄        ',
         ' │█├████▄▄▄    ',
         ' │█├███████▀█> ',
         ' │█├████▀▀▀    ',
         ' └─┘▀▀▀        '],
    col:['.ddd333........',
         '.d3d3333www....',
         '.d3d3333www111.',
         '.d3d3333www....',
         '.ddd333........']},
  pilon:{n:'Marteau-pilon',slot:'arme',mod:{degats:10,pre:-10,coup:50},
    d:'Masse hydraulique. Frappe très fort, mais lentement et moins juste.',
    art:['    ╔═════╗    ',
         '    ║ ▒▒▒ ║    ',
         '    ╚═╦═╦═╝    ',
         '      ║█║      ',
         '   ▄▄▄███▄▄▄   ',
         '   █████████   '],
    col:['....ddddddd....',
         '....d.333.d....',
         '....ddddddd....',
         '......dwd......',
         '...333www333...',
         '...wwwwwwwww...']},
  chassis:{n:'Châssis renforcé',slot:'armure',mod:{vieMax:30,vitesse:-1},
    d:'Structure épaissie : encaisse davantage, mais alourdit la foreuse.',
    art:['  ▄█████████▄  ',
         '  ██▀▀▀█▀▀▀██  ',
         '  ██ ▓ █ ▓ ██  ',
         '  ▀█▄▄▄█▄▄▄█▀  ',
         '    ▀▀▀▀▀▀▀    '],
    col:['..wwwwwwwwwww..',
         '..wwdddwdddww..',
         '..ww.3.w.3.ww..',
         '..wwdddwdddww..',
         '....ddddddd....']},
  furtif:{n:'Coque furtive',f:1,slot:'armure',mod:{esq:5,dis:-2},
    d:'Revêtement mat à facettes : on vous remarque de moins loin.',
    art:['    ▄▄▄▄▄▄▄    ',
         '  ▄▀░░░░░░░▀▄  ',
         '  █░░▒▒▒▒▒░░█  ',
         '  ▀▄░░░░░░░▄▀  ',
         '    ▀▀▀▀▀▀▀    '],
    col:['....ddddddd....',
         '..dd2222222dd..',
         '..d221111122d..',
         '..dd2222222dd..',
         '....ddddddd....']},
  servo:{n:'Servomoteur',slot:'acc',mod:{vitesse:2},
    d:'Entraînement plus nerveux : la foreuse se déplace plus vite.',
    art:['   ┌───────┐   ',
         ' ══╡ ▓▓▓▓▓ ╞══ ',
         ' ══╡ ▓▒█▒▓ ╞══ ',
         ' ══╡ ▓▓▓▓▓ ╞══ ',
         '   └───────┘   '],
    col:['...ddddddddd...',
         '.wwd.33333.dww.',
         '.wwd.33133.dww.',
         '.wwd.33333.dww.',
         '...ddddddddd...']},
  optique:{n:'Téléobjectif',slot:'acc',mod:{capteur:3},
    d:'Capteur à grande focale : la foreuse voit plus loin.',
    art:['  ┌──┐         ',
         '  │▒▒├══════╗  ',
         '  │▒▒│░░░░░(█) ',
         '  │▒▒├══════╝  ',
         '  └──┘         '],
    col:['..dddd.........',
         '..d33dwwwwwww..',
         '..d33d22222w1w.',
         '..d33dwwwwwww..',
         '..dddd.........']},
  viseur:{n:'Viseur laser',slot:'acc',mod:{crit:10},
    d:'Désigne les points faibles : plus de coups critiques.',
    art:['       │       ',
         '    ┌──┼──┐    ',
         '  ──┼──█──┼──  ',
         '    └──┼──┘    ',
         '       │       '],
    col:['.......r.......',
         '....dddrddd....',
         '..rrrrrwrrrrr..',
         '....dddrddd....',
         '.......r.......']},
  conden:{n:'Condensateur',slot:'acc',mod:{power:1},
    d:'Réserve tampon : l’énergie se recharge plus vite.',
    art:['    ┬     ┬    ',
         '  ┌─┴─────┴─┐  ',
         '  │█▓▒░ ░▒▓█│  ',
         '  │█▓▒░ ░▒▓█│  ',
         '  └─────────┘  '],
    col:['....w.....w....',
         '..ddwdddddwdd..',
         '..deeee.eeeed..',
         '..deeee.eeeed..',
         '..ddddddddddd..']},
  gyro:{n:'Gyroscope',slot:'acc',mod:{esq:10},
    d:'Stabilise les esquives : la foreuse est plus dure à toucher.',
    art:['       ▄       ',
         '    ▄▀▀█▀▀▄    ',
         '  ══█══█══█══  ',
         '    ▀▄▄█▄▄▀    ',
         '       ▀       '],
    col:['.......w.......',
         '....333w333....',
         '..dd3dd1dd3dd..',
         '....333w333....',
         '.......w.......']}
};
// Objets donnés au départ, non équipés (phase d'essai : plus tard ils se trouveront au sol ou sur les ennemis)
const INV_TEST=['foret','pilon','chassis','furtif','servo','optique','viseur','conden','gyro'];
const invTest=()=>INV_TEST.map(k=>({k,eq:0}));
const ACOL={w:'#fff','1':'var(--c1)','2':'var(--c2)','3':'var(--c3)',e:'var(--energy)',r:'var(--life)',d:'var(--dim)'};
const escH=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
// dessin ASCII coloré : regroupe les caractères voisins de même couleur
function artHTML(d){return d.art.map((l,y)=>{let h='',x=0;const m=d.col[y]||'';
  while(x<l.length){const c=m[x]||'.';let x2=x;while(x2<l.length&&(m[x2]||'.')===c)x2++;
    const s=escH(l.slice(x,x2));h+=ACOL[c]?`<span style="color:${ACOL[c]}">${s}</span>`:s;x=x2;}
  return h;}).join('\n');}
const signe=v=>(v>0?'+':'−')+Math.abs(v);
// « DEG +4 » ; la durée du coup se lit mieux en clair : « coup rapide (75) », 100 étant le coup ordinaire
const modLib=(k,v)=>k==='coup'?`coup ${v<0?'rapide':'lent'} (${DUR.coup+v})`:`${MODS[k][0]} ${signe(v)}${MODS[k][2]}`;
function modHTML(d){return Object.entries(d.mod||{}).map(([k,v])=>
  `<span style="color:${v*MODS[k][1]>0?'var(--c1)':'var(--life)'}">${modLib(k,v)}</span>`).join(' · ');}
const modTxt=d=>Object.entries(d.mod||{}).map(([k,v])=>modLib(k,v)).join(', ');
// total apporté par l'équipement porté sur une stat (sert à colorer le panneau Statistiques)
function invBonus(k){let s=0;for(const o of (G&&G.inv)||[])if(o.eq)s+=(ITEMS[o.k].mod||{})[k]||0;return s;}
function invApply(o,sg){const m=ITEMS[o.k].mod||{},st=G.st;for(const k in m)st[k]=(st[k]||0)+sg*m[k];st.vie=Math.min(st.vieMax,st.vie);}
const invCount=s=>G.inv.filter(o=>o.eq&&ITEMS[o.k].slot===s).length;

let INV_SEL=-1,INV_H=null;
function invChanged(){computeFOV();turnStealth();render();}
function invEquip(i){const o=G.inv[i];if(!o||G.over)return;const d=ITEMS[o.k],e=d.f?'e':'';
  if(d.use){d.use(G.st);G.inv.splice(i,1);INV_SEL=Math.min(INV_SEL,G.inv.length-1);say(`${d.n} utilisé${e}.`,'good');SFX.done();invChanged();return;}
  if(o.eq){invApply(o,-1);o.eq=0;say(`${d.n} retiré${e}.`);SFX.door();invChanged();return;}
  const sl=SLOTS[d.slot];let rem='';
  if(invCount(d.slot)>=sl.n){
    if(sl.n>1){say(`Les ${sl.n} emplacements d’accessoire sont pris : retirez-en un d’abord.`,'warn');SFX.blocked();render();return;}
    const old=G.inv.find(p=>p.eq&&ITEMS[p.k].slot===d.slot);invApply(old,-1);old.eq=0;rem=` à la place de : ${ITEMS[old.k].n}`;}
  o.eq=1;invApply(o,1);say(`${d.n} équipé${e}${rem} (${modTxt(d)}).`,'good');SFX.done();invChanged();}
function invDrop(i){const o=G.inv[i];if(!o||G.over)return;const d=ITEMS[o.k];
  if(o.eq){invApply(o,-1);o.eq=0;}
  G.inv.splice(i,1);INV_SEL=Math.min(INV_SEL,G.inv.length-1);
  const c=idx(G.px,G.py);G.items=G.items||{};(G.items[c]=G.items[c]||[]).push(o.k);
  say(`${d.n} jeté${d.f?'e':''} au sol.`);SFX.thud();invChanged();}
// ramasse tout ce qui est posé sous la foreuse ; more : à la suite d'un déplacement (complète le message du pas)
function invPickup(more){const c=idx(G.px,G.py),l=G.items&&G.items[c];if(!l||!l.length)return false;
  for(const k of l)G.inv.push({k,eq:0});delete G.items[c];
  (more?sayMore:say)(`${l.length>1?'Objets ramassés':'Objet ramassé'} : ${l.map(k=>ITEMS[k].n).join(', ')}.`,'good');SFX.spot();return true;}

function invHTML(){const inv=G.inv||[];if(INV_SEL>=inv.length)INV_SEL=inv.length-1;
  const cnt=s=>`${SLOTS[s].nom} <b>${invCount(s)}/${SLOTS[s].n}</b>`;
  let h=`<div class="islots"><span>${cnt('arme')}</span><span>${cnt('armure')}</span><span>${cnt('acc')}</span></div>`;
  h+=inv.length?`<div class="ilist" role="listbox" aria-label="Objets portés">${inv.map((o,i)=>{const d=ITEMS[o.k];
    return `<button class="it${o.eq?' eq':''}${i===INV_SEL?' sel':''}" data-i="${i}" role="option" aria-selected="${i===INV_SEL}"><i>${SLOTS[d.slot]?SLOTS[d.slot].g:'!'}</i><span>${d.n}</span><em>${o.eq?'équipé':''}</em></button>`;}).join('')}</div>`
    :'<p class="inone">Aucun objet.</p>';
  const o=inv[INV_SEL];
  if(o){const d=ITEMS[o.k];
    h+=`<div class="idet"><pre class="iart" aria-hidden="true">${artHTML(d)}</pre>
      <div class="inm"><b>${d.n}</b><span>${d.slot?SLOTS[d.slot].nom:'Consommable'}${o.eq?' · équipé':''}</span></div>
      <p>${d.d}</p><p class="imods">${modHTML(d)}</p>
      <div class="ibtns"><button class="pace on" data-a="eq">${d.use?'Utiliser':o.eq?'Retirer':'Équiper'}</button><button class="pace" data-a="drop">Jeter</button></div></div>`;}
  else if(inv.length)h+='<p class="inone">Choisissez un objet pour le voir, l’équiper ou le jeter.</p>';
  const sol=G.items&&G.items[idx(G.px,G.py)];
  if(sol&&sol.length)h+=`<div class="isol"><span>Au sol ici : ${sol.map(k=>ITEMS[k].n).join(', ')}</span><button class="pace" data-a="pick">Ramasser</button></div>`;
  return h;}
// redessine seulement si quelque chose a changé : le rendu tourne en continu, et reconstruire les boutons ferait rater des clics
function invDraw(){const el=$('inv');if(!el||!G||!G.inv)return;const h=invHTML();if(h!==INV_H){el.innerHTML=h;INV_H=h;}}
function invOpen(on){const p=$('invPanel'),b=$('invBtn');p.hidden=!on;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on);
  try{localStorage.setItem('np-inv',on?'open':'closed');}catch(e){}
  if(on){invDraw();p.scrollIntoView({block:'nearest'});}}
const invToggle=()=>invOpen($('invPanel').hidden);
$('invBtn').onclick=()=>{invToggle();$('invBtn').blur();};
$('inv').addEventListener('click',ev=>{
  const a=ev.target.closest('[data-a]');
  if(a){if(TRAV||REST){stopTravel('Trajet interrompu.');stopRest('Repos interrompu.');}
    if(a.dataset.a==='eq')invEquip(INV_SEL);else if(a.dataset.a==='drop')invDrop(INV_SEL);else if(invPickup())render();return;}
  const r=ev.target.closest('[data-i]');if(r){const i=+r.dataset.i;INV_SEL=i===INV_SEL?-1:i;invDraw();}});
$('inv').addEventListener('dblclick',ev=>{const r=ev.target.closest('[data-i]');if(r){INV_SEL=+r.dataset.i;invEquip(INV_SEL);}});
try{invOpen(localStorage.getItem('np-inv')==='open');}catch(e){}
