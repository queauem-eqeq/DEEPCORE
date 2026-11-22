/* ---------- Inventaire et équipement (13 novembre 2026) ----------
   G.inv   : objets portés, [{k:'foret',eq:0|1}, …]. Un objet équipé reste dans la liste, affiché d'une autre couleur.
   G.items : objets posés au sol, {case:[k, …]} ; la foreuse qui passe dessus les ramasse.
   Équiper un objet AJOUTE ses modificateurs (mod) aux stats de G.st, le retirer les ENLÈVE : le reste du jeu lit G.st
   sans rien savoir de l'équipement, et les autres sources de bonus s'additionnent sans conflit.
   de : dés de dégâts d'une arme, {n:dés, f:faces, p:bonus} (voir 08-faune) ; mod.degats est un bonus ajouté au jet.
   Champs de mod : degats, pre, crit, def, vitesse, capteur, power, vieMax,
   req : POW requis par une arme ou une armure (voir 08-faune : armeFact, armureDef).
                   dis (portée de discrétion, en cases), coup (durée d'un coup de foreuse, en unités de temps).
   Consommables (conso) : usage unique, empilés (n exemplaires sur une ligne).
   Dessins : art = lignes de caractères ; col = même grille, une couleur par caractère
             (w blanc · 1 accent · 2 bio · 3 monde · e énergie · r rouge · d gris · . couleur du texte). */
const SLOTS={arme:{n:1,nom:'Arme',g:'/'},armure:{n:1,nom:'Armure',g:'['},acc:{n:3,nom:'Accessoire',g:'='}};
// libellé, sens favorable (+1 : plus c'est haut mieux c'est ; −1 : l'inverse), unité
const MODS={degats:['DEG',1,''],pre:['PRE',1,''],crit:['CRIT',1,' %'],def:['DEF',1,''],vitesse:['VIT',1,''],capteur:['EYE',1,''],
  power:['POW',1,''],vieMax:['Vie max',1,''],energieMax:['Énergie max',1,''],dis:['DIS',-1,''],detec:['DET',1,''],coup:['Coup',-1,'']};
const ITEMS={
  foreuse:{n:'Foreuse',f:1,slot:'arme',req:10,de:{n:1,f:6,p:5},mod:{},base:1,
    d:'L’outil d’origine de la foreuse, équilibré : c’est l’arme de référence.',
    art:["    █▓▓▓▓▓█    ", "   ▐▒▒▒▒▒▒▒▌   ", "    ▀▒▒▒▒▒▀    ", "     ▀▒▒▒▀     ", "      ▀▒▀      ", "       ▀       "],
    col:["....3111113....", "...211111112...", "....2111112....", ".....21112.....", "......212......", ".......2......."]},
  usine:{n:'Coque d’usine',slot:'armure',req:10,mod:{def:10},
    d:'La coque de série, montée au départ. Sans elle, la foreuse n’a aucune défense.',
    art:["  ▄▄       ▄▄  ", "  █▓▀▀▀▀▀▀▀▓█  ", "  █▓▓▓▐█▌▓▓▓█  ", "   ▀▄▓▓▓▓▓▄▀   ", "     ▀▀▀▀▀     "],
    col:["..33.......33..", "..31333333313..", "..31113331113..", "...331111133...", ".....33333....."]},
  servo:{n:'Servomoteur',slot:'acc',mod:{vitesse:2},
    d:'Entraînement plus nerveux : la foreuse se déplace plus vite.',
    art:["       │       ", "    ·┌─┴─┐·    ", "  ───┤▓+▓├───  ", "    ·└─┬─┘·    ", "       │       "],
    col:[".......3.......", "....3333333....", "..33331d13333..", "....3333333....", ".......3......."]},
  optique:{n:'Téléobjectif',slot:'acc',mod:{capteur:3},
    d:'Capteur à grande focale : la foreuse voit plus loin.',
    art:["     ▄▄▄▄▄     ", "   ▄▀▒▒▒▒▒▀▄   ", "   █▒▒░░░▒▒█   ", "   ▀▄▒▒▒▒▒▄▀   ", "     ▀▀▀▀▀     "],
    col:[".....11111.....", "...113333311...", "...133222331...", "...113333311...", ".....11111....."]},
  viseur:{n:'Viseur laser',slot:'acc',mod:{crit:10},
    d:'Désigne les points faibles : plus de coups critiques.',
    art:["       │       ", "    ┌──┴──┐    ", "  ──┤  ┼  ├──  ", "    └──┬──┘    ", "       │       "],
    col:[".......1.......", "....3331333....", "..113..r..311..", "....3331333....", ".......1......."]},
  conden:{n:'Condensateur',slot:'acc',mod:{power:1},
    d:'Réserve tampon : l’énergie se recharge plus vite.',
    art:["    ┌─────┐    ", "    │▒▒▒▒▒│    ", "    │     │    ", "    │█████│    ", "    └┬───┬┘    ", "     │   │     "],
    col:["....3333333....", "....3212123....", "....3.....3....", "....3111113....", "....3333333....", ".....3...3....."]},
  gyro:{n:'Gyroscope',slot:'acc',mod:{def:12},
    d:'Stabilise les esquives : la foreuse est plus dure à toucher.',
    art:["     ▄▀▀▀▄     ", "    █ ▄▀▄ █    ", "  ═══════════  ", "    █ ▀▄▀ █    ", "     ▀▄▄▄▀     "],
    col:[".....33333.....", "....3.111.3....", "..ddddddddddd..", "....3.111.3....", ".....33333....."]},
  stabil:{n:'Stabilisateur',slot:'acc',mod:{pre:10},
    d:'Compense les secousses : la foreuse touche plus souvent.',
    art:["  ▄         ▄  ", " █│█  ─┐█  █│█ ", " █│█▄▄█│█▄▄█│█ ", " █├───┬┴────┤█ ", " █│█▀█│█▀▀▀█│█ ", " █│█ █└─   █│█ "],
    col:["..3.........3..", ".313..113..313.", ".3133331333313.", ".3111111111113.", ".3133313333313.", ".313.311...313."]},
  accu:{n:'Accumulateur',slot:'acc',mod:{energieMax:40},
    d:'Cellules supplémentaires : la réserve d’énergie est plus grande.',
    art:["   ▄▄  ▄▄  ▄▄  ", "  █▒▒██▒▒██▒▒█ ", "  █▒▒██▒▒██▒▒█ ", "  █▒▒██▒▒██▒▒█ ", "  ▀▀▀▀▀▀▀▀▀▀▀▀ "],
    col:["...33..33..33..", "..312331233123.", "..321332133213.", "..312331233123.", "..333333333333."]},
  // Consommables : conso = usage unique ; plein(st) = inutile dans cet état ; use(st) applique l'effet et renvoie ce qu'il a rendu
  repar:{n:'Réparobots',pl:1,conso:1,son:'repair',fx:'soin',eff:'Vie +50',
    d:'Essaim de micro-robots réparateurs : rend 50 points de vie.',
    plein:st=>st.vie>=st.vieMax,non:'Vie déjà au maximum : réparobots inutiles.',
    use:st=>{const a=st.vie;st.vie=Math.min(st.vieMax,st.vie+50);return `+${Math.round(st.vie-a)} PV`;},
    art:["     ▄▄▄▄▄     ", "   ▄▀▓▓█▓▓▀▄   ", "   █▓█████▓█   ", "   ▀▄▓▓█▓▓▄▀   ", "     ▀▀▀▀▀     "],
    col:[".....wwwww.....", "...wwrrwrrww...", "...wrwwwwwrw...", "...wwrrwrrww...", ".....wwwww....."]},
  batterie:{n:'Batterie',f:1,conso:1,son:'battery',fx:'ener',eff:'Énergie +50',
    d:'Cellule de secours : rend 50 points d’énergie.',
    plein:st=>st.energie>=st.energieMax,non:'Énergie déjà au maximum : batterie inutile.',
    use:st=>{const a=st.energie;st.energie=Math.min(st.energieMax,st.energie+50);return `+${Math.round(st.energie-a)} énergie`;},
    art:["       ▄       ", "    █▀▀▀▀▀█    ", "   ▄█ ▒▒▒ █▄   ", "    █▄▄▄▄▄█    ", "       ▀       "],
    col:[".......3.......", "....3333333....", "...33.222.33...", "....3333333....", ".......3......."]},
  fumigene:{n:'Fumigène',conso:1,son:'smoke',eff:'Nuage opaque de 7 cases',
    d:'Un nuage opaque autour de la foreuse : il cache la vue des deux côtés et les ennemis perdent votre trace.',
    plein:st=>false,non:'',
    use:st=>{fumPose();return 'le nuage se répand';},
    art:["       ▄       ", "     ┌───┐     ", "     │   │     ", "     │▒▒▒│     ", "     │▒▒▒│     ", "     └───┘     "],
    col:[".......w.......", ".....wwwww.....", ".....w...w.....", ".....w232w.....", ".....w323w.....", ".....wwwww....."]},
  charge:{n:'Charge sismique',f:1,conso:1,eff:'30 dégâts, roche brisée, 3 × 3',
    d:'Un carré de 3 × 3, jusqu’à 4 cases : 30 dégâts et roche brisée, même la roche dure. Très bruyante.',
    vise:1,plein:st=>false,non:'',
    use:st=>'',
    art:["          *    ", "        ┌─┘    ", "    ┌───┴──┐   ", "    │▓▓▓▓▓▓│   ", "    │▓▓ ▓▓▓│   ", "    └──────┘   "],
    col:["..........1....", "........www....", "....wwwwwwww...", "....wrrrrrrw...", "....wrrrrrrw...", "....wwwwwwww..."]},
  cle:{n:'Clé',f:1,conso:1,eff:'Ouvre une porte verrouillée',
    d:'Marchez contre une porte verrouillée : elle s’ouvre et la clé est consommée.',
    plein:st=>true,non:'Une clé s’utilise en marchant contre une porte verrouillée.',
    use:st=>'',
    art:["  ┌──┐         ", "  │  ├──────── ", "  └──┘   │ │   "],
    col:["..wwww.........", "..wwwwwwwwwwww.", "..wwww...w.w..."]}
};
// Objets donnés au départ, non équipés (phase d'essai : plus tard ils se trouveront au sol ou sur les ennemis).
// Le second terme est le nombre d'exemplaires d'un consommable : ils s'empilent sur une seule ligne (« ×2 »).
const INV_TEST=[['foreuse'],['usine'],['servo'],['optique'],['viseur'],['conden'],['gyro'],['stabil'],['accu'],
  ['repar',2],['batterie',2],['fumigene',2],['charge',2]];
// la foreuse est l'arme de départ, déjà équipée (ses modificateurs sont nuls : ce sont les stats de base) ;
// la Coque d'usine est l'armure de départ, déjà équipée elle aussi : sa DEF +10 est comprise dans le def:10 de départ (07-generation)
const invTest=()=>INV_TEST.map(([k,n])=>n?{k,eq:0,n}:{k,eq:k==='foreuse'||k==='usine'?1:0});
// partie commencée avant un ajout d'objets : on complète le sac, et il y a toujours une arme en main
// Les armes et armures retirées le 16 novembre 2026 n'ont plus aucune trace dans le code (19 novembre 2026) : ni dessin, ni modificateur.
const nbCles=()=>{const o=(G.inv||[]).find(o=>o.k==='cle');return o?(o.n||1):0;};   // les clés sont des objets du sac (21 novembre 2026), plus un compteur
const itemTile=k=>k==='cle'?TL.cle:(TL['o_'+k]||TL.objet);   // tuile d'un objet posé au sol
function invMigre(){if(G.st&&G.st.cles>0){const o=G.inv.find(o=>o.k==='cle');if(o)o.n=(o.n||1)+G.st.cles;else G.inv.push({k:'cle',eq:0,n:G.st.cles});}if(G.st)delete G.st.cles;   // ancien compteur de clés -> objet
  for(const [k,n] of INV_TEST)if(!G.inv.some(o=>o.k===k))G.inv.push(n?{k,eq:0,n}:{k,eq:0});
  G.inv=G.inv.filter(o=>ITEMS[o.k]);G.inv.sort((a,b)=>INV_TEST.findIndex(t=>t[0]===a.k)-INV_TEST.findIndex(t=>t[0]===b.k));
  if(!G.inv.some(o=>o.eq&&ITEMS[o.k].slot==='arme'))G.inv.find(o=>o.k==='foreuse').eq=1;
  // la Coque d'usine est portée d'origine : son DEF +10 est déjà compris dans les stats de départ, donc on la marque équipée sans appliquer son effet
  if(!G.inv.some(o=>o.eq&&ITEMS[o.k].slot==='armure'))G.inv.find(o=>o.k==='usine').eq=1;
  G.st.vie=Math.min(G.st.vieMax,G.st.vie);G.st.energie=Math.min(G.st.energieMax,G.st.energie);}
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
/* Deux endroits depuis le 15 novembre 2026 : la fenêtre Équipement (armes, armures, accessoires) et le sous-menu « Inventaire »
   de la colonne (consommables). Un seul sac derrière, G.inv ; INV_SEL est l'indice RÉEL dans G.inv de l'objet choisi dans la fenêtre. */
const SAC_MAX=10;   // places du sous-menu Inventaire : une SORTE de consommable par place, les exemplaires s'empilent
const invEquipables=()=>G.inv.map((o,i)=>i).filter(i=>!ITEMS[G.inv[i].k].conso);
const invConsos=()=>G.inv.map((o,i)=>i).filter(i=>ITEMS[G.inv[i].k].conso);
function invFix(){const l=invEquipables();if(!l.length){INV_SEL=-1;return;}if(!l.includes(INV_SEL))INV_SEL=l[0];}

let INV_SEL=0,INV_H=null,INV_MSG=null;   // INV_MSG : dernier message, répété dans la fenêtre (le journal est caché derrière)
function invSay(m,c){say(m,c);INV_MSG={m,c:c||''};}
function invChanged(){robotTiles();computeFOV();turnStealth();render();}
const ARME_FIXE='Il faut toujours une arme en main : équipez-en une autre pour la remplacer.';
// consommables offensifs : ennemis à r cases ou moins, et onde de choc
const invCibles=r=>[...(G.beasts||[]),...(G.animals||[])].filter(o=>Math.max(Math.abs(o.x-G.px),Math.abs(o.y-G.py))<=r);
/* Charge sismique : visée d'une zone de 3 × 3 (16 novembre 2026).
   Le carré s'ouvre une case devant la foreuse ; on le déplace à la souris ou aux touches de direction, dans un rayon de VISEE_R cases
   autour d'elle ; Entrée ou un clic valide, Échap annule (la charge n'est pas consommée). Le carré est dessiné en rouge avec la tuile
   « Bord croisé » (10-rendu.js). La validation frappe tout ce qui occupe une des neuf cases. */
// Tout consommable prend un battement : les ennemis jouent, les effets durables se décomptent, l'énergie remonte (16 novembre 2026)
// act : 'use' ne fait ni bruit ni discrétion ; la charge sismique passe 'dig', aussi bruyant qu'un coup de foreuse sur la roche
function consoTemps(act){G.turn++;lastAct=act||'use';lastRun=false;pass(DUR.attente);computeFOV();if(G.over&&G.over.dead){render();dead();return true;}return false;}
const VISEE_R=4,VISEE_DM=30;
const DEVANT={u:[0,-1],r:[1,0],d:[0,1],l:[-1,0]};
function viseeStart(i){const [dx,dy]=DEVANT[G.face||'u'];
  VISEE={i,x:Math.max(1,Math.min(W-2,G.px+dx)),y:Math.max(1,Math.min(H-2,G.py+dy))};
  invOpen(false);SAC_NAV=false;SAC_H='';
  say('Charge sismique : placez la zone (déplacement ou souris), Entrée ou clic pour tirer, Échap pour annuler.','warn');render();}
function viseeVers(x,y){if(!VISEE)return;
  const cx=Math.max(G.px-VISEE_R,Math.min(G.px+VISEE_R,Math.max(1,Math.min(W-2,x)))),
        cy=Math.max(G.py-VISEE_R,Math.min(G.py+VISEE_R,Math.max(1,Math.min(H-2,y))));
  if(cx!==VISEE.x||cy!==VISEE.y){VISEE.x=cx;VISEE.y=cy;render();}}
const viseeStop=m=>{VISEE=null;if(m)say(m);render();};
function viseeOk(){if(!VISEE||G.over)return;const {i,x,y}=VISEE,o=G.inv[i];
  if(!o||!ITEMS[o.k]||!ITEMS[o.k].vise){viseeStop();return;}
  VISEE=null;lastAct='dig';
  let n=0,k=0;
  for(const c of [...(G.beasts||[]),...(G.animals||[])]){if(Math.abs(c.x-x)>1||Math.abs(c.y-y)>1)continue;
    const isB=(G.beasts||[]).includes(c),sp=isB?BEASTS[c.sp]:SPECIES[c.sp];n++;
    c.hp=(c.hp??pvDe(sp))-VISEE_DM;addFx({kind:'num',x:c.x,y:c.y,txt:'-'+VISEE_DM,col:PAL['3'],dur:900});
    if(c.hp<=0){k++;(isB?G.beasts:G.animals).splice((isB?G.beasts:G.animals).indexOf(c),1);bleed(c.x,c.y);}
    else if(isB){c.hunt=1;spot(c);}else{c.aware=1;c.enraged=true;spot(c);}}
  // l'onde brise aussi la roche, la montagne et la roche dure (16 novembre 2026) : c'est le seul moyen d'entamer la roche dure
  let roches=0;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const zx=x+dx,zy=y+dy;
    if(zx<1||zy<1||zx>=W-1||zy>=H-1)continue;const j=idx(zx,zy),v=G.t[j];
    if(v!==ROCK&&v!==MOUNT&&v!==HARD&&v!==MACHINE&&!bati(v)&&!machCasse(v))continue;
    if(machCasse(v)&&G.art)delete G.art[j];
    G.t[j]=RUBBLE;if(G.dmg)delete G.dmg[j];roches++;
    if(G.ore&&G.ore[j]&&!oreSol(G.ore[j])){const l=oreLv(G.ore[j]),mt=oreMat(G.ore[j]);G.ore[j]=(mt?'m':'')+'sol'+l;
      sayMore(mt?'De la Matière tombe au sol.':'Des éclats de métal tombent au sol.','good');}}
  engage();invTake(i);sacFix();SAC_H='';
  addFx({kind:'boom',x,y,dur:420});addFx({kind:'shake',amp:8,dur:300});SFX.explode();
  say(`Charge sismique : ${n?`${n} ennemi${n>1?'s':''} touché${n>1?'s':''}${k?`, ${k} abattu${k>1?'s':''}`:''}`:'personne dans la zone'}${roches?`, ${roches} case${roches>1?'s':''} de roche pulvérisée${roches>1?'s':''}`:''}.`,n||roches?'good':'warn');
  if(consoTemps('dig'))return;
  render();}
function invBoum(r,dm){let n=0,k=0;lastAct='dig';
  for(const o of invCibles(r)){n++;const isB=G.beasts.includes(o),sp=isB?BEASTS[o.sp]:SPECIES[o.sp];o.hp=(o.hp??pvDe(sp))-dm;
    addFx({kind:'num',x:o.x,y:o.y,txt:'-'+dm,col:PAL['3'],dur:900});
    if(o.hp<=0){k++;(isB?G.beasts:G.animals).splice((isB?G.beasts:G.animals).indexOf(o),1);bleed(o.x,o.y);}
    else if(isB){o.hunt=1;spot(o);}else{o.aware=1;spot(o);}}
  if(n)engage();addFx({kind:'shake',amp:8,dur:300});SFX.explode();return `${n} ennemi${n>1?'s':''} touché${n>1?'s':''}${k?`, ${k} abattu${k>1?'s':''}`:''}`;}
/* Visuel de la foreuse selon l'équipement : l'arme dessine la moitié avant (lignes 0 à 7, pointe en haut), l'armure la moitié arrière
   (lignes 8 à 15). Sans arme spéciale (la foreuse) ni armure, c'est la tuile « Foreuse » du Tile editor, retouches comprises. */
function robotTiles(){if(!TL.robot_u||!G||!G.inv)return;const porte=s=>{const o=G.inv.find(o=>o.eq&&ITEMS[o.k].slot===s);return o?o.k:null;};
  const f=TF('robot_u');   // une seule arme et une seule armure : la foreuse garde toujours son dessin d'origine
  TL.robot_u=tileCanvas(f);TL.robot_r=tileCanvas((x,y)=>f(y,15-x));TL.robot_d=tileCanvas((x,y)=>f(15-x,15-y));TL.robot_l=tileCanvas((x,y)=>f(15-y,x));
  try{ICON.robot_r=TL.robot_r.toDataURL();}catch(e){}}
// retire un exemplaire de la ligne i (toute la ligne s'il n'en reste plus)
function invTake(i){const o=G.inv[i];if((o.n||1)>1)o.n--;else{G.inv.splice(i,1);if(INV_SEL>i)INV_SEL--;invFix();}}
// Entrée ou bouton principal : utiliser un consommable, équiper ou retirer un équipement
function invEquip(i){const o=G.inv[i];if(!o||G.over)return;const d=ITEMS[o.k],e=accord(d);
  if(d.vise){viseeStart(i);return;}   // objet qui se vise : on ouvre la visée au lieu de l'utiliser tout de suite
  if(d.conso){
    if(d.plein(G.st)){invSay(d.non,'warn');SFX.blocked();render();return;}
    const r=d.use(G.st);invTake(i);invSay(`${d.n} utilisé${e} : ${r}.`,'good');(d.son&&SFX[d.son]?SFX[d.son]:SFX.spot)();   // un objet peut avoir son propre bruit et son propre effet
    if(d.fx)addFx({kind:d.fx,x:G.px,y:G.py,dur:1000,gr:fxGrains(12)});
    consoTemps();invChanged();return;}   // un consommable coûte un battement (16 novembre 2026)
  if(o.eq){if(d.slot==='arme'){invSay(ARME_FIXE,'warn');SFX.blocked();render();return;}
    invApply(o,-1);o.eq=0;invSay(`${d.n} retiré${e}.`);SFX.door();invChanged();return;}
  const sl=SLOTS[d.slot];let rem='';
  if(invCount(d.slot)>=sl.n){
    if(sl.n>1){invSay(`Les ${sl.n} emplacements d’accessoire sont pris : retirez-en un d’abord.`,'warn');SFX.blocked();render();return;}
    const old=G.inv.find(p=>p.eq&&ITEMS[p.k].slot===d.slot);invApply(old,-1);old.eq=0;rem=` à la place de : ${ITEMS[old.k].n}`;}
  o.eq=1;invApply(o,1);invSay(`${d.n} équipé${e}${rem} (${modTxt(d)}).`,'good');SFX.done();invChanged();}
/* Où tombe un objet jeté (21 novembre 2026) : jamais sous la foreuse, mais sur la première case libre la plus proche — d'abord les huit
   cases adjacentes (les orthogonales avant les diagonales), puis de plus en plus loin, en suivant les cases praticables. Libre : ni obstacle,
   ni eau profonde, ni porte, ni créature, ni autre objet ou clé. Faute de place dans les environs, l'objet tombe quand même sous la foreuse. */
function caseJet(){const lib=(x,y)=>{const t=G.t[idx(x,y)],i=idx(x,y);return !blocks(t)&&t!==DEEP&&t!==DOOR&&t!==DECK&&!beastAt(x,y)&&!animalAt(x,y)&&!(G.items&&G.items[i]&&G.items[i].length)&&!(G.cles&&G.cles[i]);};
  const ORD=[[0,-1],[1,0],[0,1],[-1,0],[1,-1],[1,1],[-1,1],[-1,-1]],vu=new Set([idx(G.px,G.py)]),q=[[G.px,G.py]];
  for(let k=0;k<q.length&&k<600;k++){const [x,y]=q[k];
    for(const [dx,dy] of ORD){const a=x+dx,b=y+dy;if(a<1||b<1||a>=W-1||b>=H-1)continue;const j=idx(a,b);if(vu.has(j))continue;vu.add(j);
      if(blocks(G.t[j]))continue;if(lib(a,b))return j;q.push([a,b]);}}
  return idx(G.px,G.py);}
function invDrop(i){const o=G.inv[i];if(!o||G.over)return;const d=ITEMS[o.k];
  if(o.eq&&d.slot==='arme'){invSay(ARME_FIXE,'warn');SFX.blocked();render();return;}
  if(o.eq){invApply(o,-1);o.eq=0;}
  invTake(i);
  const c=caseJet();G.items=G.items||{};(G.items[c]=G.items[c]||[]).push(o.k);
  invSay(`${d.n} jeté${accord(d)} au sol.`);SFX.thud();invChanged();}
// ramasse tout ce qui est posé sous la foreuse ; more : à la suite d'un déplacement (complète le message du pas)
function invPickup(more){const c=idx(G.px,G.py),l=G.items&&G.items[c];if(!l||!l.length)return false;
  const pris=[],laisses=[];
  for(const k of l){const pile=ITEMS[k].conso&&G.inv.find(o=>o.k===k);
    if(pile){pile.n=(pile.n||1)+1;pris.push(k);continue;}
    if(ITEMS[k].conso&&invConsos().length>=SAC_MAX){laisses.push(k);continue;}   // inventaire plein : l'objet reste au sol
    G.inv.push(ITEMS[k].conso?{k,eq:0,n:1}:{k,eq:0});pris.push(k);}
  if(laisses.length)G.items[c]=laisses;else delete G.items[c];
  const dire=more?sayMore:invSay;
  if(pris.length)dire(`${pris.length>1?'Objets ramassés':'Objet ramassé'} : ${pris.map(k=>ITEMS[k].n).join(', ')}.`,'good');
  if(laisses.length)dire(`Inventaire plein (${SAC_MAX}/${SAC_MAX}) : ${laisses.map(k=>ITEMS[k].n).join(', ')} reste${laisses.length>1?'nt':''} au sol.`,'warn');
  if(pris.length)SFX.spot();else SFX.blocked();
  return true;}

// Stats dans la fenêtre : valeur actuelle, puis « → nouvelle valeur » en couleur si Entrée sur l'objet choisi la changeait
const INV_STATS=[['vieMax','VIE'],['energieMax','ÉNER'],['vitesse','VIT'],['capteur','EYE'],['degats','DEG'],['pre','PRE'],['def','DEF'],['crit','CRIT'],['power','POW'],['dis','DIS'],['coup','COUP'],['detec','DET']];
function invDelta(o){const d=ITEMS[o.k],m={};if(d.conso)return m;const add=(mm,sg)=>{for(const k in mm||{})m[k]=(m[k]||0)+sg*mm[k];};
  if(o.eq){if(d.slot!=='arme')add(d.mod,-1);return m;}
  const sl=SLOTS[d.slot];if(invCount(d.slot)>=sl.n){if(sl.n>1)return m;add(ITEMS[G.inv.find(p=>p.eq&&ITEMS[p.k].slot===d.slot).k].mod,-1);}
  add(d.mod,1);return m;}
// Dés de dégâts d'une arme, et la fourchette qu'ils donnent une fois le POW requis pris en compte
function deHTML(d){if(d.slot!=='arme'||!d.de)return '';const [a,b]=robotDegs(G.st,d);
  return `<p class="imods"><span>Dégâts ${deTxt(d.de)}${G.st.degats?` ${G.st.degats>0?'+':''}${G.st.degats} (DEG)`:''} → ${a===b?a:a+' à '+b}</span></p>`;}
// POW requis par une arme ou une armure, et ce que l'écart coûte ou rapporte avec le POW actuel
const fois=x=>'× '+x.toFixed(2).replace('.',',');
function reqHTML(d){if(!d.req)return '';const e=G.st.power-d.req,arme=d.slot==='arme';
  const eff=e===0?'':arme?` : précision et dégâts ${fois(armeFact(G.st,d))}`:` : défense ${signe(armureDef(G.st,d))}`;
  return `<p class="imods"><span style="color:${e<0?'var(--life)':e>0?'var(--c1)':'var(--dim)'}">POW requis ${d.req} (vous : ${G.st.power})${eff}</span></p>`;}
// ce que donnerait Entrée sur l'objet choisi : stats, arme et armure
function invHyp(o){const st=Object.assign({},G.st),m=o?invDelta(o):{};for(const k in m)st[k]=(st[k]||0)+m[k];
  let arme=eqDe('arme')||null,armure=eqDe('armure')||null;
  if(o){const d=ITEMS[o.k];if(!d.conso){if(d.slot==='arme'&&!o.eq)arme=d;if(d.slot==='armure')armure=o.eq?null:d;}}
  return {st,arme,armure,m};}
// PRE, DEG, DEF et DIS sont donnés tels qu'ils comptent ici et maintenant (POW requis et terrain compris)
function statVal(k,st,arme,armure,dDis){
  if(k==='dis')return [(G.stealth||STEALTH_BASE+(G.st.dis||0))+dDis];
  if(k==='def')return [robotDefNu(st,armure)+terrMod(G.px,G.py)];
  if(k==='pre')return [robotPre(st,arme)];
  if(k==='degats'){const [a,b]=robotDegs(st,arme);return [(a+b)/2,a===b?''+a:a+'-'+b];}
  if(k==='coup')return [DUR.coup+(st.coup||0)];
  if(k==='crit')return [st.crit??5];
  return [st[k]];}
function statsHTML(o){const H=invHyp(o),A=eqDe('arme')||null,B=eqDe('armure')||null;
  const L=INV_STATS.map(([k,l])=>{const c=statVal(k,G.st,A,B,0),n=statVal(k,H.st,H.arme,H.armure,H.m.dis||0),u=k==='crit'?' %':'';
    return {k,l,u,c,n,ct:c[1]??c[0],nt:n[1]??n[0]};});
  const chg=L.some(e=>e.ct!==e.nt);
  return `<div class="isth">Statistiques${chg?` · <span>→ ${o.eq?'si vous le retirez':'si vous l’équipez'}</span>`:''}</div><div class="istats">${L.map(e=>
    `<span><i>${e.l}</i> ${e.ct}${e.u}${e.ct!==e.nt?` <b style="color:${(e.n[0]-e.c[0])*MODS[e.k][1]>0?'var(--c1)':'var(--life)'}">→ ${e.nt}${e.u}</b>`:''}</span>`).join('')}</div>`;}
/* Fenêtre plein écran (comme le Tile editor) : la liste à gauche, la fiche de l'objet choisi à droite. */
function invHTML(){const inv=G.inv||[],liste=invEquipables();invFix();
  const cnt=s=>`${SLOTS[s].nom} <b>${invCount(s)}/${SLOTS[s].n}</b>`;
  let h=`<div class="iwrap"><div class="ileft"><div class="islots"><span>${cnt('arme')}</span><span>${cnt('armure')}</span><span>${cnt('acc')}</span></div>`;
  h+=liste.length?`<div class="ilist" role="listbox" aria-label="Équipement">${liste.map(i=>{const o=inv[i],d=ITEMS[o.k];
    return `<button class="it${o.eq?' eq':''}${i===INV_SEL?' sel':''}" data-i="${i}" role="option" aria-selected="${i===INV_SEL}"><i>${SLOTS[d.slot].g}</i><span>${d.n}</span><em>${typeNom(d)}</em><em class="st">${o.eq?'équipé':''}</em></button>`;}).join('')}</div>`
    :'<p class="inone">Aucun équipement.</p>';
  const sol=G.items&&G.items[idx(G.px,G.py)];
  if(sol&&sol.length)h+=`<div class="isol"><span>Au sol ici : ${sol.map(k=>ITEMS[k].n).join(', ')}</span><button class="pace" data-a="pick">Ramasser</button></div>`;
  h+='</div>';
  const o=INV_SEL>=0?inv[INV_SEL]:null;h+='<div class="iright">';
  if(o){const d=ITEMS[o.k];
    h+=`<div class="idet"><pre class="iart" aria-hidden="true">${artHTML(d)}</pre>
      <div class="inm"><b>${d.n}${(o.n||1)>1?' ×'+o.n:''}</b><span>${typeNom(d)}${o.eq?' · équipé':''}</span></div>
      <p>${d.d}</p><p class="imods">${modHTML(d)}</p>${deHTML(d)}${reqHTML(d)}
      <div class="ibtns"><button class="pace on" data-a="eq">${o.eq?'Retirer':'Équiper'}</button><button class="pace" data-a="drop">Jeter</button></div></div>`;}
  else h+='<div class="idet"><p>Aucun équipement à afficher. Les consommables sont dans le sous-menu Inventaire de la colonne.</p></div>';
  h+=statsHTML(o)+'</div>';
  h+=`</div><p class="imsg ${INV_MSG?INV_MSG.c:''}" role="status">${INV_MSG?INV_MSG.m:'&nbsp;'}</p>`;
  return h;}
// redessine seulement si quelque chose a changé : le rendu tourne en continu, et reconstruire les boutons ferait rater des clics
function invDraw(){const el=$('inv');if(!el||!G||!G.inv)return;const h=invHTML();if(h===INV_H)return;el.innerHTML=h;INV_H=h;
  const s=el.querySelector('.it.sel');if(s)s.scrollIntoView({block:'nearest'});}
/* Sous-menu « Inventaire » de la colonne (sous Statistiques) : les consommables, une ligne chacun, avec leur nombre et « Utiliser ».
   Redessiné à chaque render par side() ; comme la fenêtre, seulement si quelque chose a changé, sinon un clic se perdrait. */
let SAC_H='',SAC_SEL=-1,SAC_NAV=false;
const esc=t=>t.replace(/"/g,'&quot;');
function sacHTML(){const l=invConsos();
  if(!l.length)return '<p class="inone">Aucun consommable.</p>';
  return l.map(i=>{const o=G.inv[i],d=ITEMS[o.k];
    return `<div class="cr${SAC_NAV&&i===SAC_SEL?' sel':''}"><span title="${esc(d.d)}">${d.n}</span><em>×${o.n||1}</em>` +
      `<button class="pace" data-u="${i}" title="${esc(d.n+' : '+d.d)}">USE</button>` +
      `<button class="pace del" data-x="${i}" title="Jeter un exemplaire au sol${(o.n||1)>1?' (il en restera '+((o.n||1)-1)+')':''}">[X]</button></div>`;}).join('');}
function sacDraw(){const el=$('sac');if(!el||!G||!G.inv)return;
  const l=invConsos(),h=sacHTML();if(h!==SAC_H){el.innerHTML=h;SAC_H=h;}
  const n=$('sacN');if(n){const txt=`[${l.length}/${SAC_MAX}]`;if(n.textContent!==txt)n.textContent=txt;n.classList.toggle('full',l.length>=SAC_MAX);}}
// [X] : un exemplaire du consommable tombe au sol, sur une case libre voisine (caseJet) (21 novembre 2026 ; avant, [X] détruisait toute la pile)
function sacJeter(i){const o=G.inv[i];if(!o||G.over||!ITEMS[o.k].conso)return;const d=ITEMS[o.k],n=o.n||1;
  invTake(i);const c=caseJet();G.items=G.items||{};(G.items[c]=G.items[c]||[]).push(o.k);
  say(`${d.n} jeté${accord(d)} au sol${n>1?` (il en reste ${n-1})`:` : une place libérée (${invConsos().length}/${SAC_MAX})`}.`);SFX.thud();
  sacFix();SAC_H='';invChanged();}
/* Navigation au clavier (touche I) : ouvre le sous-menu s'il est replié et choisit le premier consommable.
   Ensuite ↑ ↓ pour parcourir, Entrée pour utiliser, X, Suppr ou J pour jeter un exemplaire au sol, Échap ou I pour sortir. */
function sacFix(){const l=invConsos();if(!l.length){SAC_SEL=-1;SAC_NAV=false;return;}if(!l.includes(SAC_SEL))SAC_SEL=l[0];}
function sacNav(on){const f=$('fd-sac');
  if(on&&SAC_NAV){SAC_NAV=false;SAC_H='';sacDraw();render();return;}                       // I une seconde fois : on ressort
  if(on){if(!invConsos().length){say('Aucun consommable dans l’inventaire.');render();return;}
    if(!f.open)f.open=true;SAC_NAV=true;sacFix();}
  else SAC_NAV=false;
  SAC_H='';sacDraw();render();}
function sacKey(ev){const k=ev.key.toLowerCase(),l=invConsos(),d=KEYS[k];
  if(!l.length){SAC_NAV=false;return false;}
  if(k==='escape'||k==='i'){ev.preventDefault();sacNav(false);return true;}
  if(d&&d[0]===0){ev.preventDefault();const p=l.indexOf(SAC_SEL);SAC_SEL=l[((p<0?0:p)+d[1]+l.length)%l.length];SAC_H='';sacDraw();return true;}
  if(k==='enter'||k===' '){ev.preventDefault();invEquip(SAC_SEL);sacFix();SAC_H='';render();return true;}
  if(k==='x'||k==='j'||k==='delete'||k==='backspace'){ev.preventDefault();sacJeter(SAC_SEL);return true;}
  if(['shift','control','alt','meta'].includes(k))return false;
  SAC_NAV=false;SAC_H='';sacDraw();return false;}   // toute autre touche sort de la navigation et repart au jeu
$('fd-sac').addEventListener('toggle',()=>{if(!$('fd-sac').open&&SAC_NAV){SAC_NAV=false;SAC_H='';sacDraw();render();}});
$('sac').addEventListener('click',ev=>{
  const x=ev.target.closest('[data-x]');if(x){x.blur();sacJeter(+x.dataset.x);return;}
  const b=ev.target.closest('[data-u]');if(!b||G.over)return;b.blur();SAC_SEL=+b.dataset.u;invEquip(SAC_SEL);sacFix();SAC_H='';render();});
function invOpen(on){const m=$('inventaire');
  if(on){if(TRAV||REST){stopTravel('Trajet interrompu.');stopRest('Repos interrompu.');}
    INV_MSG=null;invDraw();m.hidden=false;m.querySelector('.mcard').focus();}
  else{m.hidden=true;render();}}
const invToggle=()=>invOpen($('inventaire').hidden);
// touches de la fenêtre : appelée par le gestionnaire de clavier (11-interface) tant qu'elle est ouverte
function invKey(ev){if(ev.ctrlKey||ev.metaKey||ev.altKey)return;const k=ev.key.toLowerCase(),l=invEquipables(),d=KEYS[k];
  if(k==='escape'||k==='t'){ev.preventDefault();invOpen(false);return;}
  if(d&&d[0]===0&&l.length){ev.preventDefault();const p=l.indexOf(INV_SEL);INV_SEL=l[((p<0?0:p)+d[1]+l.length)%l.length];INV_MSG=null;invDraw();return;}
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
