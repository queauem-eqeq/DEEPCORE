/* ---------- Inventaire et équipement (13 novembre 2026) ----------
   G.inv   : objets portés, [{k:'foret',eq:0|1}, …]. Un objet équipé reste dans la liste, affiché d'une autre couleur.
   G.items : objets posés au sol, {case:[k, …]} ; la foreuse qui passe dessus les ramasse.
   Équiper un objet AJOUTE ses modificateurs (mod) aux stats de G.st, le retirer les ENLÈVE : le reste du jeu lit G.st
   sans rien savoir de l'équipement, et les joyaux (qui modifient aussi G.st) s'additionnent sans conflit.
   Champs de mod : degats, pre, crit, esq, vitesse, capteur, power, vieMax,
                   dis (portée de discrétion, en cases), coup (durée d'un coup de foreuse, en unités de temps).
   Consommables (conso) : usage unique, empilés (n exemplaires sur une ligne).
   Dessins : art = lignes de caractères ; col = même grille, une couleur par caractère
             (w blanc · 1 accent · 2 bio · 3 monde · e énergie · r rouge · d gris · . couleur du texte). */
const SLOTS={arme:{n:1,nom:'Arme',g:'/'},armure:{n:1,nom:'Armure',g:'['},acc:{n:3,nom:'Accessoire',g:'='}};
// libellé, sens favorable (+1 : plus c'est haut mieux c'est ; −1 : l'inverse), unité
const MODS={degats:['DEG',1,''],pre:['PRE',1,''],crit:['CRIT',1,' %'],esq:['ESQ',1,''],vitesse:['VIT',1,''],capteur:['EYE',1,''],
  power:['POW',1,''],vieMax:['Vie max',1,''],energieMax:['Énergie max',1,''],dis:['DIS',-1,''],coup:['Coup',-1,''],isol:['Isolation',1,'']};
const ITEMS={
  foreuse:{n:'Foreuse',f:1,slot:'arme',mod:{},base:1,
    d:'L’outil d’origine de la foreuse, équilibré : c’est l’arme de référence.',
    art:["  ▄▄▄▄         ", "  ████▄▄▄      ", "  ███████▄▄▄   ", "  ██████████▀▀ ", "  ███████▀▀▀   ", "  ████▀▀▀      "],
    col:["..1111.........", "..1111222......", "..1111222222...", "..111122222222.", "..1111222222...", "..1111222......"]},
  foret:{n:'Foret diamant',slot:'arme',mod:{degats:-2,pre:15,coup:-40},
    d:'Pointe fine et précise : des coups rapides qui touchent presque toujours, mais moins appuyés.',
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
  pilon:{n:'Marteau-pilon',slot:'arme',mod:{degats:15,pre:-10,coup:50},
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
         '.......w.......']},
  scie:{n:'Scie circulaire',f:1,slot:'arme',mod:{degats:3,crit:15},
    d:'Disque denté : entaille profond, coups critiques fréquents.',
    art:["     ▄▄███▄▄   ", "   ▄█▀▀   ▀▀█▄ ", "═══█   ███   █ ", "   ▀█▄▄   ▄▄█▀ ", "     ▀▀███▀▀   "],
    col:[".....wwwwwww...", "...wwww...wwww.", "dddw...333...w.", "...wwww...wwww.", ".....wwwwwww..."]},
  lance:{n:'Lance thermique',f:1,slot:'arme',mod:{degats:7,esq:-10},
    d:'Jet de plasma : gros dégâts, mais encombrante, on esquive moins bien.',
    art:[" ┌──┐          ", " │▓▓├──────┐░  ", " │▓▓│═══════▒░░", " │▓▓├──────┘░  ", " └──┘          "],
    col:[".dddd..........", ".d33dddddddd3..", ".d33dwwwwwwwr33", ".d33dddddddd3..", ".dddd.........."]},
  leger:{n:'Châssis allégé',slot:'armure',mod:{vitesse:1,esq:10,vieMax:-15},
    d:'Structure ajourée : plus vive et plus mobile, mais plus fragile.',
    art:["    ┌──┬──┐    ", "  ┌─┤  │  ├─┐  ", "  │ │  ▓  │ │  ", "  └─┤  │  ├─┘  ", "    └──┴──┘    "],
    col:["....ddddddd....", "..ddd..d..ddd..", "..d.d..1..d.d..", "..ddd..d..ddd..", "....ddddddd...."]},
  isolante:{n:'Coque isolante',f:1,slot:'armure',mod:{isol:1,vieMax:10},
    d:'Joints étanches : poison et glu durent deux fois moins longtemps.',
    art:["   ▄▄▄▄▄▄▄▄▄   ", "  █▒▒▒▒▒▒▒▒▒█  ", "  █▒ ▄▄▄▄▄ ▒█  ", "  █▒ ▀▀▀▀▀ ▒█  ", "  █▒▒▒▒▒▒▒▒▒█  ", "   ▀▀▀▀▀▀▀▀▀   "],
    col:["...wwwwwwwww...", "..w222222222w..", "..w2.11111.2w..", "..w2.11111.2w..", "..w222222222w..", "...wwwwwwwww..."]},
  stabil:{n:'Stabilisateur',slot:'acc',mod:{pre:10},
    d:'Compense les secousses : la foreuse touche plus souvent.',
    art:["  ┌─────────┐  ", "  │ ·  │  · │  ", "  ├────┼────┤  ", "  │ ·  │  · │  ", "  └─────────┘  "],
    col:["..ddddddddddd..", "..d.3..1..3.d..", "..d111111111d..", "..d.3..1..3.d..", "..ddddddddddd.."]},
  accu:{n:'Accumulateur',slot:'acc',mod:{energieMax:40},
    d:'Cellules supplémentaires : la réserve d’énergie est plus grande.',
    art:["   ▄▄  ▄▄  ▄▄  ", "  ┌██┐┌██┐┌██┐ ", "  │██││██││▒▒│ ", "  │██││▒▒││░░│ ", "  └──┘└──┘└──┘ "],
    col:["...ww..ww..ww..", "..deeddeeddeed.", "..deeddeeddeed.", "..deeddeeddeed.", "..dddddddddddd."]},
  // Consommables : conso = usage unique ; plein(st) = inutile dans cet état ; use(st) applique l'effet et renvoie ce qu'il a rendu
  repar:{n:'Réparobots',pl:1,conso:1,eff:'Vie +50',
    d:'Essaim de micro-robots réparateurs : rend 50 points de vie.',
    plein:st=>st.vie>=st.vieMax,non:'Vie déjà au maximum : réparobots inutiles.',
    use:st=>{const a=st.vie;st.vie=Math.min(st.vieMax,st.vie+50);return `+${Math.round(st.vie-a)} PV`;},
    art:['    ┌─────┐    ',
         '  ┌─┴─────┴─┐  ',
         '  │   ▐█▌   │  ',
         '  │ ▐█████▌ │  ',
         '  │   ▐█▌   │  ',
         '  └─────────┘  '],
    col:['....ddddddd....',
         '..ddddddddddd..',
         '..w...222...w..',
         '..w.2222222.w..',
         '..w...222...w..',
         '..wwwwwwwwwww..']},
  batterie:{n:'Batterie',f:1,conso:1,eff:'Énergie +50',
    d:'Cellule de secours : rend 50 points d’énergie.',
    plein:st=>st.energie>=st.energieMax,non:'Énergie déjà au maximum : batterie inutile.',
    use:st=>{const a=st.energie;st.energie=Math.min(st.energieMax,st.energie+50);return `+${Math.round(st.energie-a)} énergie`;},
    art:['  ┌─────────┐  ',
         '  │███▓▓▒▒░░├┐ ',
         '  │███▓▓▒▒░░││ ',
         '  │███▓▓▒▒░░├┘ ',
         '  └─────────┘  '],
    col:['..ddddddddddd..',
         '..deeeeeeeeeww.',
         '..deeeeeeeeeww.',
         '..deeeeeeeeeww.',
         '..ddddddddddd..']},
  purge:{n:'Purge',f:1,conso:1,eff:'Élimine poison et glu',
    d:'Solvant injecté dans les circuits : chasse le poison et dissout la glu.',
    plein:st=>!(G.eff&&(G.eff.poison>0||G.eff.glu>0)),non:'Ni poison ni glu : purge inutile.',
    use:st=>{G.eff.poison=0;G.eff.glu=0;return 'poison et glu éliminés';},
    art:["     ┌───┐     ", "     └┬─┬┘     ", "     ┌┘ └┐     ", "     │▒▒▒│     ", "     │███│     ", "     └───┘     "],
    col:[".....ddddd.....", ".....ddddd.....", ".....dd.dd.....", ".....d222d.....", ".....d222d.....", ".....ddddd....."]},
  fumigene:{n:'Fumigène',conso:1,eff:'Invisible 5 battements',
    d:'Nuage opaque : les ennemis perdent votre trace et ne vous voient plus pendant 5 battements.',
    plein:st=>false,non:'',
    use:st=>{G.eff.fum=5;for(const b of G.beasts||[])if(b.hunt){b.hunt=0;forget(b);}for(const a of G.animals||[]){a.aware=0;a.enraged=false;forget(a);}return 'les ennemis perdent votre trace';},
    art:["   ░░ ▒▒░  ░   ", "  ░▒▒▓▒▒▒░░    ", "    ░▒┌─┐▒░    ", "      │█│      ", "      │█│      ", "      └─┘      "],
    col:["...dd.ddd..d...", "..dwwwwwwdd....", "....dwdddwd....", "......d3d......", "......d3d......", "......ddd......"]},
  charge:{n:'Charge sismique',f:1,conso:1,eff:'20 dégâts à 2 cases',
    d:'Onde de choc : 20 dégâts à tous les ennemis à 2 cases ou moins. Très bruyante.',
    plein:st=>!invCibles(2).length,non:'Aucun ennemi à 2 cases ou moins : charge inutile.',
    use:st=>invBoum(2,20),
    art:["      ┌─┐   *  ", "    ▄▄┴─┴▄▄ │  ", "   █████████┘  ", "   ████▒████   ", "   █████████   ", "    ▀▀▀▀▀▀▀    "],
    col:["......ddd...r..", "....33ddd33.d..", "...333333333d..", "...3333r3333...", "...333333333...", "....3333333...."]}
};
// Objets donnés au départ, non équipés (phase d'essai : plus tard ils se trouveront au sol ou sur les ennemis).
// Le second terme est le nombre d'exemplaires d'un consommable : ils s'empilent sur une seule ligne (« ×2 »).
const INV_TEST=[['foreuse'],['foret'],['pilon'],['scie'],['lance'],['chassis'],['furtif'],['leger'],['isolante'],['servo'],['optique'],['viseur'],['conden'],['gyro'],['stabil'],['accu'],
  ['repar',2],['batterie',2],['purge',2],['fumigene',2],['charge',2]];
// la foreuse est l'arme de départ, déjà équipée (ses modificateurs sont nuls : ce sont les stats de base)
const invTest=()=>INV_TEST.map(([k,n])=>n?{k,eq:0,n}:{k,eq:k==='foreuse'?1:0});
// partie commencée avant un ajout d'objets : on complète le sac, et il y a toujours une arme en main
function invMigre(){for(const [k,n] of INV_TEST)if(!G.inv.some(o=>o.k===k))G.inv.push(n?{k,eq:0,n}:{k,eq:0});
  G.inv=G.inv.filter(o=>ITEMS[o.k]);G.inv.sort((a,b)=>INV_TEST.findIndex(t=>t[0]===a.k)-INV_TEST.findIndex(t=>t[0]===b.k));
  if(!G.inv.some(o=>o.eq&&ITEMS[o.k].slot==='arme'))G.inv.find(o=>o.k==='foreuse').eq=1;}
const ACOL={w:'#fff','1':'var(--c1)','2':'var(--c2)','3':'var(--c3)',e:'var(--energy)',r:'var(--life)',d:'var(--dim)'};
const escH=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
// dessin ASCII coloré : regroupe les caractères voisins de même couleur
function artHTML(d){return d.art.map((l,y)=>{let h='',x=0;const m=d.col[y]||'';
  while(x<l.length){const c=m[x]||'.';let x2=x;while(x2<l.length&&(m[x2]||'.')===c)x2++;
    const s=escH(l.slice(x,x2));h+=ACOL[c]?`<span style="color:${ACOL[c]}">${s}</span>`:s;x=x2;}
  return h;}).join('\n');}
const signe=v=>(v>0?'+':'−')+Math.abs(v);
// « DEG +4 » ; la durée du coup se lit mieux en clair : « coup rapide (75) », 100 étant le coup ordinaire
const modLib=(k,v)=>k==='isol'?'effets durables ÷ 2':k==='coup'?`coup ${v<0?'rapide':'lent'} (${DUR.coup+v})`:`${MODS[k][0]} ${signe(v)}${MODS[k][2]}`;
function modHTML(d){if(d.base)return 'Arme de référence : pas de modificateur';if(d.conso)return `<span style="color:var(--c1)">${d.eff}</span> · usage unique`;
  return Object.entries(d.mod||{}).map(([k,v])=>`<span style="color:${v*MODS[k][1]>0?'var(--c1)':'var(--life)'}">${modLib(k,v)}</span>`).join(' · ');}
const modTxt=d=>Object.entries(d.mod||{}).map(([k,v])=>modLib(k,v)).join(', ');
const typeNom=d=>d.conso?'Consommable':SLOTS[d.slot].nom;
const accord=d=>(d.f?'e':'')+(d.pl?'s':'');   // « équipée », « utilisés »
// total apporté par l'équipement porté sur une stat (sert à colorer le panneau Statistiques)
function invBonus(k){let s=0;for(const o of (G&&G.inv)||[])if(o.eq)s+=(ITEMS[o.k].mod||{})[k]||0;return s;}
function invApply(o,sg){const m=ITEMS[o.k].mod||{},st=G.st,v0=st.vieMax,e0=st.energieMax;for(const k in m)st[k]=(st[k]||0)+sg*m[k];
  // quand un maximum change, la jauge garde sa proportion : s'équiper ne soigne pas et ne blesse pas (et on ne gagne rien à retirer puis remettre)
  if(st.vieMax!==v0&&st.vie>0)st.vie=Math.max(1,Math.round(st.vie*st.vieMax/v0));if(st.energieMax!==e0)st.energie=Math.round(st.energie*st.energieMax/e0);
  st.vie=Math.min(st.vieMax,st.vie);st.energie=Math.min(st.energieMax,st.energie);}
const invCount=s=>G.inv.filter(o=>o.eq&&ITEMS[o.k].slot===s).length;

let INV_SEL=0,INV_H=null,INV_MSG=null;   // INV_MSG : dernier message, répété dans la fenêtre (le journal est caché derrière)
function invSay(m,c){say(m,c);INV_MSG={m,c:c||''};}
function invChanged(){robotTiles();computeFOV();turnStealth();render();}
const ARME_FIXE='Il faut toujours une arme en main : équipez-en une autre pour la remplacer.';
// consommables offensifs : ennemis à r cases ou moins, et onde de choc
const invCibles=r=>[...(G.beasts||[]),...(G.animals||[])].filter(o=>Math.max(Math.abs(o.x-G.px),Math.abs(o.y-G.py))<=r);
function invBoum(r,dm){let n=0,k=0;lastAct='dig';
  for(const o of invCibles(r)){n++;const isB=G.beasts.includes(o),sp=isB?BEASTS[o.sp]:SPECIES[o.sp];o.hp=(o.hp??pvDe(sp))-dm;
    addFx({kind:'num',x:o.x,y:o.y,txt:'-'+dm,col:PAL['3'],dur:900});
    if(o.hp<=0){k++;(isB?G.beasts:G.animals).splice((isB?G.beasts:G.animals).indexOf(o),1);bleed(o.x,o.y);}
    else if(isB){o.hunt=1;spot(o);}else{o.aware=1;spot(o);}}
  addFx({kind:'shake',amp:8,dur:300});SFX.explode();return `${n} ennemi${n>1?'s':''} touché${n>1?'s':''}${k?`, ${k} abattu${k>1?'s':''}`:''}`;}
/* Visuel de la foreuse selon l'équipement : l'arme dessine la moitié avant (lignes 0 à 7, pointe en haut), l'armure la moitié arrière
   (lignes 8 à 15). Sans arme spéciale (la foreuse) ni armure, c'est la tuile « Foreuse » du Tile editor, retouches comprises. */
const ARME_PIX={"foret": [".......ww.......", ".......ww.......", ".......22.......", "......2222......", "......2222......", "......2222......", ".....222222.....", ".....222222....."], "pilon": ["...2222222222...", "...2222222222...", "...2233333322...", "...2222222222...", "......2222......", "......2222......", "......2222......", ".....222222....."], "scie": ["......2w2w......", "....2w2222w2....", "...22222222w....", "...w22w22w22w...", "...w22w22w22w...", "....w22222222...", "....2w2222w2....", "......w2w2......"], "lance": [".......rr.......", "......r33r......", ".......33.......", ".......22.......", ".......22.......", "......2222......", "......2222......", ".....222222....."]};
const CORPS_PIX={"chassis": ["..wwwwwwwwwwww..", ".ww1222222221ww.", ".w12.2.22.2.21w.", ".w12.2.22.2.21w.", ".ww1222222221ww.", "..wwwwwwwwwwww..", "...22......22...", "...22......22..."], "furtif": ["....11111111....", "...1333333331...", "..133333333331..", "..133333333331..", "...1333333331...", "....11111111....", "................", "....3......3...."], "leger": ["....11111111....", "....1.2222.1....", "....1.2..2.1....", "....1.2..2.1....", "....1.2222.1....", "....11111111....", ".....2....2.....", "................"], "isolante": ["...1111111111...", "..1w22222222w1..", "..12w222222w21..", "..12w222222w21..", "..1w22222222w1..", "...1111111111...", "....2......2....", "....2......2...."]};
function robotTiles(){if(!TL.robot_u||!G||!G.inv)return;const porte=s=>{const o=G.inv.find(o=>o.eq&&ITEMS[o.k].slot===s);return o?o.k:null;};
  const a=ARME_PIX[porte('arme')],c=CORPS_PIX[porte('armure')],base=TF('robot_u'),f=(x,y)=>y<8?(a?a[y][x]:base(x,y)):(c?c[y-8][x]:base(x,y));
  TL.robot_u=tileCanvas(f);TL.robot_r=tileCanvas((x,y)=>f(y,15-x));TL.robot_d=tileCanvas((x,y)=>f(15-x,15-y));TL.robot_l=tileCanvas((x,y)=>f(15-y,x));
  try{ICON.robot_r=TL.robot_r.toDataURL();}catch(e){}}
// retire un exemplaire de la ligne i (toute la ligne s'il n'en reste plus)
function invTake(i){const o=G.inv[i];if((o.n||1)>1)o.n--;else{G.inv.splice(i,1);INV_SEL=Math.max(0,Math.min(INV_SEL,G.inv.length-1));}}
// Entrée ou bouton principal : utiliser un consommable, équiper ou retirer un équipement
function invEquip(i){const o=G.inv[i];if(!o||G.over)return;const d=ITEMS[o.k],e=accord(d);
  if(d.conso){
    if(d.plein(G.st)){invSay(d.non,'warn');SFX.blocked();render();return;}
    const r=d.use(G.st);invTake(i);invSay(`${d.n} utilisé${e} : ${r}.`,'good');SFX.spot();invChanged();return;}
  if(o.eq){if(d.slot==='arme'){invSay(ARME_FIXE,'warn');SFX.blocked();render();return;}
    invApply(o,-1);o.eq=0;invSay(`${d.n} retiré${e}.`);SFX.door();invChanged();return;}
  const sl=SLOTS[d.slot];let rem='';
  if(invCount(d.slot)>=sl.n){
    if(sl.n>1){invSay(`Les ${sl.n} emplacements d’accessoire sont pris : retirez-en un d’abord.`,'warn');SFX.blocked();render();return;}
    const old=G.inv.find(p=>p.eq&&ITEMS[p.k].slot===d.slot);invApply(old,-1);old.eq=0;rem=` à la place de : ${ITEMS[old.k].n}`;}
  o.eq=1;invApply(o,1);invSay(`${d.n} équipé${e}${rem} (${modTxt(d)}).`,'good');SFX.done();invChanged();}
function invDrop(i){const o=G.inv[i];if(!o||G.over)return;const d=ITEMS[o.k];
  if(o.eq&&d.slot==='arme'){invSay(ARME_FIXE,'warn');SFX.blocked();render();return;}
  if(o.eq){invApply(o,-1);o.eq=0;}
  invTake(i);
  const c=idx(G.px,G.py);G.items=G.items||{};(G.items[c]=G.items[c]||[]).push(o.k);
  invSay(`${d.n} jeté${accord(d)} au sol.`);SFX.thud();invChanged();}
// ramasse tout ce qui est posé sous la foreuse ; more : à la suite d'un déplacement (complète le message du pas)
function invPickup(more){const c=idx(G.px,G.py),l=G.items&&G.items[c];if(!l||!l.length)return false;
  for(const k of l){const pile=ITEMS[k].conso&&G.inv.find(o=>o.k===k);if(pile)pile.n=(pile.n||1)+1;else G.inv.push(ITEMS[k].conso?{k,eq:0,n:1}:{k,eq:0});}
  delete G.items[c];
  (more?sayMore:invSay)(`${l.length>1?'Objets ramassés':'Objet ramassé'} : ${l.map(k=>ITEMS[k].n).join(', ')}.`,'good');SFX.spot();return true;}

// Stats dans la fenêtre : valeur actuelle, puis « → nouvelle valeur » en couleur si Entrée sur l'objet choisi la changeait
const INV_STATS=[['vieMax','VIE'],['energieMax','ÉNER'],['vitesse','VIT'],['capteur','EYE'],['degats','DEG'],['pre','PRE'],['esq','ESQ'],['crit','CRIT'],['power','POW'],['dis','DIS'],['coup','COUP']];
function invDelta(o){const d=ITEMS[o.k],m={};if(d.conso)return m;const add=(mm,sg)=>{for(const k in mm||{})m[k]=(m[k]||0)+sg*mm[k];};
  if(o.eq){if(d.slot!=='arme')add(d.mod,-1);return m;}
  const sl=SLOTS[d.slot];if(invCount(d.slot)>=sl.n){if(sl.n>1)return m;add(ITEMS[G.inv.find(p=>p.eq&&ITEMS[p.k].slot===d.slot).k].mod,-1);}
  add(d.mod,1);return m;}
function statsHTML(o){const st=G.st,m=o?invDelta(o):{},val=k=>k==='dis'?STEALTH_BASE+(st.dis||0):k==='coup'?DUR.coup+(st.coup||0):k==='crit'?(st.crit??5):st[k];
  const chg=Object.keys(m).some(k=>m[k]&&k!=='isol');
  return `<div class="isth">Statistiques${chg?` · <span>→ ${o.eq?'si vous le retirez':'si vous l’équipez'}</span>`:''}</div><div class="istats">${INV_STATS.map(([k,l])=>{const v=val(k),dv=m[k]||0,u=k==='crit'?' %':'';
    return `<span><i>${l}</i> ${v}${u}${dv?` <b style="color:${dv*MODS[k][1]>0?'var(--c1)':'var(--life)'}">→ ${v+dv}${u}</b>`:''}</span>`;}).join('')}</div>`;}
/* Fenêtre plein écran (comme le Tile editor) : la liste à gauche, la fiche de l'objet choisi à droite. */
function invHTML(){const inv=G.inv||[];INV_SEL=Math.max(0,Math.min(INV_SEL,inv.length-1));
  const cnt=s=>`${SLOTS[s].nom} <b>${invCount(s)}/${SLOTS[s].n}</b>`;
  let h=`<div class="iwrap"><div class="ileft"><div class="islots"><span>${cnt('arme')}</span><span>${cnt('armure')}</span><span>${cnt('acc')}</span></div>`;
  h+=inv.length?`<div class="ilist" role="listbox" aria-label="Objets portés">${inv.map((o,i)=>{const d=ITEMS[o.k];
    return `<button class="it${o.eq?' eq':''}${i===INV_SEL?' sel':''}" data-i="${i}" role="option" aria-selected="${i===INV_SEL}"><i>${d.conso?'!':SLOTS[d.slot].g}</i><span>${d.n}${(o.n||1)>1?' ×'+o.n:''}</span><em>${typeNom(d)}</em><em class="st">${o.eq?'équipé':''}</em></button>`;}).join('')}</div>`
    :'<p class="inone">Le sac est vide.</p>';
  const sol=G.items&&G.items[idx(G.px,G.py)];
  if(sol&&sol.length)h+=`<div class="isol"><span>Au sol ici : ${sol.map(k=>ITEMS[k].n).join(', ')}</span><button class="pace" data-a="pick">Ramasser</button></div>`;
  h+='</div>';
  const o=inv[INV_SEL];h+='<div class="iright">';
  if(o){const d=ITEMS[o.k];
    h+=`<div class="idet"><pre class="iart" aria-hidden="true">${artHTML(d)}</pre>
      <div class="inm"><b>${d.n}${(o.n||1)>1?' ×'+o.n:''}</b><span>${typeNom(d)}${o.eq?' · équipé':''}</span></div>
      <p>${d.d}</p><p class="imods">${modHTML(d)}</p>
      <div class="ibtns"><button class="pace on" data-a="eq">${d.conso?'Utiliser':o.eq?'Retirer':'Équiper'}</button><button class="pace" data-a="drop">Jeter</button></div></div>`;}
  else h+='<div class="idet"><p>Aucun objet à afficher.</p></div>';
  h+=statsHTML(o)+'</div>';
  h+=`</div><p class="imsg ${INV_MSG?INV_MSG.c:''}" role="status">${INV_MSG?INV_MSG.m:'&nbsp;'}</p>`;
  return h;}
// redessine seulement si quelque chose a changé : le rendu tourne en continu, et reconstruire les boutons ferait rater des clics
function invDraw(){const el=$('inv');if(!el||!G||!G.inv)return;const h=invHTML();if(h===INV_H)return;el.innerHTML=h;INV_H=h;
  const s=el.querySelector('.it.sel');if(s)s.scrollIntoView({block:'nearest'});}
function invOpen(on){const m=$('inventaire');
  if(on){if(TRAV||REST){stopTravel('Trajet interrompu.');stopRest('Repos interrompu.');}
    INV_MSG=null;invDraw();m.hidden=false;m.querySelector('.mcard').focus();}
  else{m.hidden=true;render();}}
const invToggle=()=>invOpen($('inventaire').hidden);
// touches de la fenêtre : appelée par le gestionnaire de clavier (11-interface) tant qu'elle est ouverte
function invKey(ev){if(ev.ctrlKey||ev.metaKey||ev.altKey)return;const k=ev.key.toLowerCase(),n=G.inv.length,d=KEYS[k];
  if(k==='escape'||k==='i'){ev.preventDefault();invOpen(false);return;}
  if(d&&d[0]===0&&n){ev.preventDefault();INV_SEL=(INV_SEL+d[1]+n)%n;INV_MSG=null;invDraw();return;}
  if((k==='enter'||k===' ')&&ev.target.tagName==='BUTTON')return;        // un bouton a le focus : le laisser faire son clic
  if(k==='enter'||k===' '){ev.preventDefault();invEquip(INV_SEL);}
  else if(k==='j'||k==='delete'||k==='backspace'){ev.preventDefault();invDrop(INV_SEL);}
  else if(k==='g'){ev.preventDefault();if(invPickup())render();}}
$('invBtn').onclick=()=>{$('invBtn').blur();invOpen(true);};
$('invClose').onclick=()=>invOpen(false);
$('inventaire').addEventListener('pointerdown',ev=>{if(ev.target===$('inventaire'))invOpen(false);});   // clic hors de la fenêtre
$('inv').addEventListener('click',ev=>{
  const a=ev.target.closest('[data-a]');
  if(a){if(a.dataset.a==='eq')invEquip(INV_SEL);else if(a.dataset.a==='drop')invDrop(INV_SEL);else if(invPickup())render();return;}
  const r=ev.target.closest('[data-i]');if(r){INV_SEL=+r.dataset.i;INV_MSG=null;invDraw();}});
$('inv').addEventListener('dblclick',ev=>{const r=ev.target.closest('[data-i]');if(r){INV_SEL=+r.dataset.i;invEquip(INV_SEL);}});
