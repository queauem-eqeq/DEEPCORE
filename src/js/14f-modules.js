/* ---------- Éditeur de modules (Lab → Modules, 24 novembre 2026) ----------
   Un module est un morceau de carte dessiné à la main (salle, couloir, agencement de murs ou de montagne), de 3 × 3 à
   16 × 16 cases. Il est fait de deux couches :
   – « t », le terrain, une lettre par case (MDL_TERR ; V = mur vitré, B = sol de pont, C = gouffre) ; « ? » = case libre, laissée au choix de la génération ;
   – « m », les emplacements (MDL_MARQ) : entrée (raccord au reste de la carte), machine, butin, ennemi. Le jeu remplira
     ces cases lui-même ; un emplacement ne tient que sur une case praticable (MDL_PRAT).
   Chaque module dit dans quelles recettes il peut être tiré (« rec ») ; MODULES_NB donne, par recette, combien en poser
   par carte. Posé, un module pourra être tourné et retourné : mdlVariantes en donne jusqu'à huit.
   Ce fichier fait l'éditeur et la banque (np-modules dans le navigateur, champ « modules » de reglages/courant dans la base
   de l'artefact). La pose est dans 07b-batiments.js (mdlTirage, mdlPrepare, accretion) : NIVEAU 1 SEULEMENT pour l'instant. */
const MDL_TERR=[['?','Libre',''],['.','Sol','ground0'],['R','Rocher','rock'],['M','Montagne','mtBody'],['H','Roche dure','hardBody'],
  ['E','Eau','liq0'],['P','Eau profonde','deep0'],['G','Herbes hautes','grass0'],['F','Herbes basses','flat0'],['X','Mur','wall'],['V','Mur vitré','vitre'],
  ['S','Sol bâti','floor'],['B','Sol (pont)','solPont'],['C','Gouffre',''],['D','Porte','door'],['O','Pilier','pillar'],
  ['K','Coque d’épave','coque'],['U','Gravats','rubble'],['A','Antenne','antenne']];   // K, U, A : Astroport, 28 novembre 2026
const MDL_MARQ=[['x','Entrée','1','E'],['m','Machine','5','M'],['b','Butin','2','B'],['e','Ennemi','4','!']];
const MDL_PRAT='.GFSDBU',MDL_MIN=3,MDL_MAX=16,MDL_NB_MAX=6,MDL_C=32;
let MODULES=[],MODULES_NB={},MDL_ED={i:0,couche:'t',code:'X',suppr:false,nbRec:''};
const mdlRecs=()=>Object.keys(RECETTES).map(k=>[k,String(RECETTES[k].n||k).split(' :')[0]]);
const mdlLigne=(n,c)=>c.repeat(n);
function mdlNeuf(){const w=9,h=7,t=[],m=[];for(let y=0;y<h;y++){t.push(mdlLigne(w,y===0||y===h-1?'X':'S').replace(/^.|.$/g,'X'));
    m.push(mdlLigne(w,'.'));}
  const o={id:'m'+Date.now().toString(36)+Math.floor(performance.now()%1000),nom:'Module '+(MODULES.length+1),w,h,t,m,rec:{}};
  // une porte et son entrée au milieu du mur du bas, pour montrer le principe
  o.t[h-1]=o.t[h-1].slice(0,4)+'D'+o.t[h-1].slice(5);o.m[h-1]=o.m[h-1].slice(0,4)+'x'+o.m[h-1].slice(5);return o;}
// ne garde d'un module lu (navigateur, base) que ce qui est valide ; renvoie null s'il est inutilisable
function mdlValide(o){if(!o||typeof o!=='object')return null;const w=o.w|0,h=o.h|0;
  if(w<MDL_MIN||h<MDL_MIN||w>MDL_MAX||h>MDL_MAX||!Array.isArray(o.t)||!Array.isArray(o.m)||o.t.length!==h||o.m.length!==h)return null;
  const tc=MDL_TERR.map(a=>a[0]).join(''),mc='.'+MDL_MARQ.map(a=>a[0]).join(''),t=[],m=[];
  for(let y=0;y<h;y++){const a=String(o.t[y]),b=String(o.m[y]);if(a.length!==w||b.length!==w)return null;let la='',lb='';
    for(let x=0;x<w;x++){const ca=tc.includes(a[x])?a[x]:'?';la+=ca;lb+=mc.includes(b[x])&&MDL_PRAT.includes(ca)?b[x]:'.';}
    t.push(la);m.push(lb);}
  const rec={};for(const [k] of mdlRecs())if(o.rec&&o.rec[k])rec[k]=true;
  const r={id:String(o.id||'m'+Math.random().toString(36).slice(2,9)).slice(0,24),nom:String(o.nom||'Module').slice(0,30),w,h,t,m,rec};
  if(o.ext)r.ext=1;   // module d'extérieur : posé dans une fosse de l'Astroport (07h), pas dans les bâtiments
  return r;}
function modulesEtat(){return {liste:JSON.parse(JSON.stringify(MODULES)),nb:Object.assign({},MODULES_NB),astro:1};}
function modulesApplique(o){if(!o||typeof o!=='object')return;
  if(Array.isArray(o.liste))MODULES=o.liste.map(mdlValide).filter(Boolean).slice(0,200);
  MODULES_NB={};for(const [k] of mdlRecs()){const v=o.nb?+o.nb[k]:0;
    MODULES_NB[k]=isFinite(v)?Math.max(0,Math.min(MDL_NB_MAX,Math.round(v))):0;}
  /* Passage à l'Astroport (28 novembre 2026), une fois (marqueur astro dans la banque enregistrée) : la banque du joueur passe avant
     le code, mais reçoit les modules du thème qui lui manquent (par identifiant ; un module du même identifiant est gardé tel
     quel), et le niveau 1 pose au moins MDL_ASTRO_NB modules de bâtiment, pour que le dépôt ait les siens. Rejouée : rien de plus. */
  if(!(o.astro>=1)){for(const d of MODULES_ASTRO)if(!MODULES.some(x=>x.id===d.id)&&MODULES.length<200){const v=mdlValide(d);if(v)MODULES.push(v);}
    const r=RECETTE_NIV(1);MODULES_NB[r]=Math.max(MODULES_NB[r]||0,MDL_ASTRO_NB);}}
function saveModules(){try{localStorage.setItem('np-modules',JSON.stringify(modulesEtat()));}catch(e){}touchLocal();}
/* Banque de modules de départ : celle du joueur, relue dans la base de l'artefact le 28 novembre 2026 à 2 h 10 (avant : le 25 novembre à 22 h 05). Elle sert tant que le
   navigateur n'a pas sa propre banque (np-modules) : sur GitHub Pages et dans la copie du disque, le jeu part donc de ces modules. */
const MODULES_DEF={nb:{"atterrissage": 1, "base": 2, "cavernes": 2, "classique": 0},liste:[
  {"h": 10, "id": "mmwuevwdt810", "m": [".......x..", "..........", "..........", "...b......", "..........", "..........", "......e..x", "x.........", "..........", "....x....."], "nom": "jardin interieur", "rec": {}, "t": ["XVVVXXXDXX", "V...EFFFFX", "V.G.EFMFFX", "V...EMMMFX", "XEEEEEMFFX", "XFFMEEEEEX", "XFMMME...D", "DFFMFE.G.X", "XFFFFE...V", "XXXXDXVVVX"], "w": 10},
  {"h": 5, "id": "mmwuwe8fl729", "m": [".....x.....", "..memem.m..", "x..mbmem..x", "..memem.m..", ".....x....."], "nom": "Salle des machines", "rec": {}, "t": ["XXVVXDXVVXX", "XSSSSSSSSSX", "DSSSSSSSSSD", "XSSSSSSSSSX", "XXVVXDXVVXX"], "w": 11},
  {"h": 7, "id": "mmwuf3p9n836", "m": [".x...x...", "...m.bm..", ".........", "....e....", ".........", "..m.....x", "........."], "nom": "Couloir de service", "rec": {"atterrissage": true}, "t": ["XDXXXDVVP", "..V....VP", "..XX.XVVP", "...F.XPPP", "VVFX.XXXX", "PVSX.G..D", "PXXXXXXXX"], "w": 9},
  {"h": 4, "id": "mmwuf9l2t342", "m": ["......x.....", ".mmmme.mmb.x", "x...........", "............"], "nom": "Couloir de service 2", "rec": {"atterrissage": true}, "t": ["XXXXXVDXXXXX", "VSSSSSSSSSSD", "DSSSSSSSSSSV", "XXXXXXXXXVXX"], "w": 12},
  {"h": 16, "id": "mmwuig16i397", "m": ["...x.x.x.x.x....", "...e.e.e.e.e....", "................", ".m...........bb.", ".m...........ee.", ".m..............", ".m...mm.........", ".m...mm.........", "................", "................", "................", "................", "................", "................", "..e.e.e.e.e.....", "..x.x.x.x.x....."], "nom": "culs de sacs", "rec": {}, "t": ["??XDXDXDXDXDX???", "??XSVSVSVSVSX???", "XXXSXSXSXSXSXXXX", "VSSSXSXSXSXSXSSX", "VSSSSSSSSSSSXSSX", "VSSSSSSSSSSSXSSX", "VSSSSSSSSSSSSSSX", "VSSSSSSSSSSSSSSX", "XXSSSSSSSSSXXXXX", "?XSSSSSSSSSX????", "?XSXSXSXSXSX????", "?XSXSXSXSXSX????", "?XSXSXSXSXSX????", "?XSXSXSXSXSX????", "?XSVSVSVSVSX????", "?XDXDXDXDXDX????"], "w": 16},
  {"h": 10, "id": "mmwuqsiir17", "m": ["....x.....", ".mmm.mmmm.", ".me....em.", "x.......m.", ".m..mm..m.", ".m..mm.bm.", ".m.......x", ".me....em.", ".mm.mmmmm.", "...x......"], "nom": "Salle vitrée", "rec": {"atterrissage": true}, "t": ["XVVVDVVVVV", "VSSSSSSSSV", "VSSSSSSSSV", "DSSSSSSSSV", "VSSSSSSSSV", "VSSSSSSSSV", "VSSSSSSSSD", "VSSSSSSSSV", "VSSSSSSSSV", "XVVDVVVVVV"], "w": 10},
  {"h": 7, "id": "mmwurql4o165", "m": [".......x.......", "...............", "...............", "x.............x", "...............", "...............", ".......x......."], "nom": "HUB GOUFFRE", "rec": {}, "t": ["VXXVXXXDXXXXXXX", "VCCCCCBBBCCCCCX", "VCCCCBBCBBCCCCX", "DBBBBBCCCBBBBBD", "VCCCCBBCBBCCCCX", "VCCCCCBBBCCCCCX", "VXXXXXXDXXXXXVX"], "w": 15},
  {"h": 16, "id": "mmwurzsnd262", "m": ["..............x.", "x...............", "................", "................", "................", "........m.......", "................", "......ebe.......", "................", "x...............", ".....m.........x", "................", "................", "................", "...............x", "...x...x........"], "nom": "Labyrinthe", "rec": {}, "t": ["XXXXXXVXXXXXXXDX", "DSSEEXSSSSSSSXSX", "XXXXEVSXXXXXSXSX", "VSSSSXSSSSSXSXSX", "XSXXSXSXXXSVSXSX", "XSXSSSSESXSXEESV", "XSXSXXXXXXSXXXSX", "XSXEXSSSSSSESXSX", "XSXEXSXXXXSXSXSX", "DSSSSSVESSSXSXSX", "XXXXXSXEXXXXSXSD", "XEESXXXSSSXXVXXX", "XEXSSSXSXSXEESSX", "XEXXXSXSXSXEXXSX", "XSSSXSSSXEEEXSSD", "XXXDXXXDXXXXXXXX"], "w": 16},
  {"h": 7, "id": "mmwwsigj9592", "m": [".....x..........", "................", "................", "x..............x", "................", "................", "...........x...."], "nom": "Gouffre HUB2", "rec": {}, "t": ["VCCCCBBBBCCBBBCV", "VCCCCBCXBCCBXBCV", "VVCCCBCXBBBBXBVV", ".BBBCBCXBCCBCBB.", "VVCBCBBBBCCBCCVV", "VCCBCBCCBXCBX..V", "VCCBBBCCBBBBX..V"], "w": 16},
  {"h": 5, "id": "mmwv7hq0z45", "m": ["..x..", ".....", "x...x", ".....", "..x.."], "nom": "Jardin zen", "rec": {"atterrissage": true, "base": true, "cavernes": true}, "t": ["VVDVV", "VEEEV", "DERED", "VEEEV", "VVDVV"], "w": 5},
  {"h": 6, "id": "mmwwkj3xc891", "m": ["......x....", "...........", "x..........", "..........x", "...........", "....x......"], "nom": "Water HUB", "rec": {"atterrissage": true, "base": true, "cavernes": true}, "t": ["XXXXXXDXXXX", "XEEEEEEEEEX", "DEEEEEEEEEX", "XEEEEEEEEED", "XEEEEEEEEEX", "XXXXDXXXXXX"], "w": 11},
  {"h": 16, "id": "mmwwv9y1l489", "m": [".....x......x...", ".mm.....mm...mm.", ".m............m.", "x....e.....ee...", ".m.eeeeeeeeee..x", ".m.eeeeeeeeee...", ".m..eeeeeeee..m.", ".m...eeeeeee..m.", ".mm.eeeeeeee....", ".mm.eeeeeeeeee..", ".m.eeeeeeeeeee.x", "...eeeeeeeeee...", "x...ee..e.ee....", "..............m.", ".mm...mmm....mm.", "....x......x...."], "nom": "Arene BIG", "rec": {}, "t": ["XXXXXSXXXXXXSXXX", "X..SSSSS..SSS..X", "X.SSSSSSSSSSSS.X", "SSSSSSSSSSSSSSSX", "X.SSSSSSSSSSSSSS", "X.SSSSSSSSSSSSSX", "X.SSSSSSSSSSSS.X", "X.SSSSSSSSSSSS.X", "X..SSSSSSSSSSSSX", "X..SSSSSSSSSSSSX", "X.SSSSSSSSSSSSSS", "XSSSSSSSSSSSSSSX", "SSSSSSSSSSSSSSSX", "XSSSSSSSSSSSSS.X", "X..SSS...SSSS..X", "XXXXSXXXXXXSXXXX"], "w": 16},
  {"h": 7, "id": "mmwx9hd1s31", "m": ["..x......", ".m.mmmmm.", "x.eeeeem.", ".meeeeem.", ".meeeeem.", ".mmm.mmm.", "....x...."], "nom": "Arene SMALL", "rec": {"atterrissage": true}, "t": ["XXDXXXXXX", "XSSSSSSSX", "DSSSSSSSX", "XSSSSSSSX", "XSSSSSSSX", "XSSSSSSSX", "XXXXDXXXX"], "w": 9}]};
/* Modules de l'Astroport (28 novembre 2026). Extérieur (ext) : posés dans les fosses, environ une sur quatre, quel que soit le nombre
   réglé pour la recette. Bâtiment : sas, magasin de pièces, quai de tri, tirés pour le dépôt avec ceux du joueur. */
const MDL_ASTRO_NB=4;
const MODULES_ASTRO=[
  {id:'astro-fosse-vide',nom:'Fosse vide',ext:1,rec:{atterrissage:true},w:7,h:5,
    t:['?..U..?','.......','U.....U','.......','?..U..?'],m:['.......','.......','.......','.......','.......']},
  {id:'astro-epave-capsule',nom:'Épave éventrée (capsule)',ext:1,rec:{atterrissage:true},w:5,h:5,
    t:['?KKK?','KK.KK','K...K','KK.UU','?U.U?'],m:['.....','..b..','.....','.....','.....']},
  {id:'astro-epave-porteur',nom:'Épave scellée (porteur)',ext:1,rec:{atterrissage:true},w:6,h:6,
    t:['?KKKK?','KKKKKK','KKKKKK','KKKKKK','?KKKK?','?K??K?'],m:['......','......','......','......','......','......']},
  {id:'astro-grand-porteur',nom:'Grand porteur dépecé',ext:1,rec:{atterrissage:true},w:9,h:11,
    t:['???KKK???','??KU.UK??','?K.....K?','KU..U..UK','K.......K','KU..b..UK','K.......K','KU..U..UK','?K.....K?','??KU.UK??','??K???K??'],
    m:['.........','.........','.........','.........','.........','....b....','.........','.........','.........','.........','.........']},
  {id:'astro-rangee-coques',nom:'Rangée de coques',ext:1,rec:{atterrissage:true},w:14,h:6,
    t:['KKK.KKKK.KKK..','KKK.KKKK.KKKU.','..............','..............','.UKKK.KKKK.KKK','..KKK.KKKK.KKK'],
    m:['..............','..............','......b.......','..............','..............','..............']},
  {id:'astro-tas-ferraille',nom:'Tas de ferraille',ext:1,rec:{atterrissage:true},w:7,h:6,
    t:['?UUU.??','UUKUUU?','UKK.KUU','.UU.UU.','?UUKUU?','??U.U??'],m:['.......','.......','...m...','.......','.....b.','.......']},
  {id:'astro-mat-balise',nom:'Mât-balise',ext:1,rec:{atterrissage:true},w:5,h:5,
    t:['?U.U?','U...U','..A..','U...U','?U.U?'],m:['.....','.....','.....','.....','.....']},
  {id:'astro-sas-depot',nom:'Sas du dépôt',rec:{atterrissage:true},w:7,h:5,
    t:['XXXDXXX','XSSSSSX','XOSSSOX','XSSSSSX','XXXDXXX'],m:['...x...','.......','.......','..e....','...x...']},
  {id:'astro-magasin',nom:'Magasin de pièces',rec:{atterrissage:true},w:9,h:7,
    t:['XXXXXXXXX','XSSSSSSSX','XSOSOSOSX','XSSSSSSSX','XSOSOSOSX','XSSSSSSSX','XXXXDXXXX'],
    m:['.........','.b.....b.','.........','...m.m...','.........','.........','....x....']},
  {id:'astro-quai-tri',nom:'Quai de tri',rec:{atterrissage:true},w:11,h:6,
    t:['XXXXXXXXXXX','DSSSSSSSSSD','XSSSSSSSSSX','XSSSSSSSSSX','XSSSSSSSSSX','XXXXXVXXXXX'],
    m:['...........','x.........x','..mmm.mmm..','...........','..b.....b..','...........']}];
try{modulesApplique(JSON.parse(localStorage.getItem('np-modules')||'null')||MODULES_DEF);}catch(e){modulesApplique(MODULES_DEF);}

// la k-ième variante d'un module : k%4 quarts de tour, puis un miroir gauche-droite si k ≥ 4
function mdlVariante(o,k){let w=o.w,h=o.h,t=o.t,m=o.m;
  const tourne=g=>{const r=[];for(let y=0;y<w;y++){let l='';for(let x=0;x<h;x++)l+=g[h-1-x][y];r.push(l);}return r;};
  for(let n=0;n<k%4;n++){t=tourne(t);m=tourne(m);[w,h]=[h,w];}
  if(k>=4){t=t.map(l=>[...l].reverse().join(''));m=m.map(l=>[...l].reverse().join(''));}
  return {w,h,t,m};}
// les variantes réellement différentes (un module symétrique en a moins de huit)
function mdlVariantes(o){const vu=new Set(),r=[];for(let k=0;k<8;k++){const v=mdlVariante(o,k),c=v.t.join('/')+'|'+v.m.join('/');
    if(!vu.has(c)){vu.add(c);r.push(v);}}return r;}
// ce qui empêcherait un module de servir, dit en clair
function mdlAvis(o){const a=[],plein=o.t.some(l=>/[^?]/.test(l));if(!plein)return ['Module vide : toutes les cases sont libres.'];
  let entrees=0,dedans=0;
  for(let y=0;y<o.h;y++)for(let x=0;x<o.w;x++){if(o.m[y][x]!=='x')continue;entrees++;
    const bord=x===0||y===0||x===o.w-1||y===o.h-1||[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>o.t[y+dy][x+dx]==='?');
    if(!bord)dedans++;}
  if(!entrees&&!o.ext)a.push('Aucune entrée : ce module ne sera pas posé, le jeu ne saurait pas par où le raccorder.');
  if(dedans)a.push(`${dedans} entrée${dedans>1?'s':''} à l’intérieur : une entrée doit toucher le bord du module ou une case libre.`);
  if(!Object.keys(o.rec).length)a.push('Aucune recette cochée : ce module ne sera jamais tiré.');
  return a;}

/* Dessin : c = côté d'une case en pixels. Avec les tuiles du jeu quand elles sont prêtes, sinon en aplats. */
function mdlDessine(cv,o,c,grille){cv.width=o.w*c;cv.height=o.h*c;const g=cv.getContext('2d');g.imageSmoothingEnabled=false;
  g.fillStyle='#000';g.fillRect(0,0,cv.width,cv.height);
  const tl=typeof TL!=='undefined'?TL:{};
  for(let y=0;y<o.h;y++)for(let x=0;x<o.w;x++){const ch=o.t[y][x],X=x*c,Y=y*c;
    if(ch==='?'){g.fillStyle='#0b1714';g.fillRect(X,Y,c,c);g.fillStyle='#22332f';
      for(let k=0;k<c;k+=Math.max(2,c>>2))g.fillRect(X+k,Y+k,Math.max(1,c>>3),Math.max(1,c>>3));}
    else{const cle=(MDL_TERR.find(a=>a[0]===ch)||[])[2];
      if(!'SXVBC'.includes(ch)&&tl.ground0)g.drawImage(tl.ground0,0,0,16,16,X,Y,c,c);
      // gouffre : un trou noir cerné ; il n'a pas de tuile, le jeu le dessine d'après ses voisins
      if(ch==='C'){const d=Math.max(1,c>>3);g.fillStyle='#3a2a1c';g.fillRect(X,Y,c,c);g.fillStyle='#000';g.fillRect(X+d,Y+d,c-2*d,c-2*d);}
      if((ch==='D'||ch==='V')&&tl.floor)g.drawImage(tl.floor,0,0,16,16,X,Y,c,c);
      if(tl[cle])g.drawImage(tl[cle],0,0,16,16,X,Y,c,c);}
    const mq=MDL_MARQ.find(a=>a[0]===o.m[y][x]);
    if(mq){const col=(typeof PAL!=='undefined'&&PAL[mq[2]])||'#fff',d=Math.max(1,Math.round(c*.18));
      g.fillStyle='#000';g.fillRect(X+d,Y+d,c-2*d,c-2*d);g.strokeStyle=col;g.lineWidth=Math.max(1,c>>4);
      g.strokeRect(X+d+.5,Y+d+.5,c-2*d-1,c-2*d-1);
      if(c>=16){g.fillStyle=col;g.font=`bold ${Math.round(c*.5)}px monospace`;g.textAlign='center';g.textBaseline='middle';
        g.fillText(mq[3],X+c/2,Y+c/2+1);}
      else{g.fillStyle=col;g.fillRect(X+d,Y+d,c-2*d,c-2*d);}}}
  if(grille){g.strokeStyle='rgba(255,255,255,.14)';g.lineWidth=1;g.beginPath();
    for(let x=0;x<=o.w;x++){g.moveTo(x*c+.5,0);g.lineTo(x*c+.5,cv.height);}
    for(let y=0;y<=o.h;y++){g.moveTo(0,y*c+.5);g.lineTo(cv.width,y*c+.5);}g.stroke();}}
function mdlImage(o,c){const cv=document.createElement('canvas');mdlDessine(cv,o,c,false);try{return cv.toDataURL();}catch(e){return '';}}

/* ---------- La fenêtre ---------- */
const mdlCourant=()=>MODULES[MDL_ED.i]||null;
const mdlEsc=s=>String(s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
function mdlListe(){const L=$('mdlList');
  L.innerHTML=MODULES.length?MODULES.map((o,i)=>`<button class="mdlit" draggable="true" data-i="${i}" aria-pressed="${i===MDL_ED.i}">`+
    `<img src="${mdlImage(o,4)}" alt="" width="40" height="40" draggable="false"><span><b>${mdlEsc(o.nom)}</b><small>${o.w} × ${o.h}</small></span></button>`).join('')
    :'<p class="mnote">La banque est vide. « Nouveau » crée un premier module.</p>';
  mdlNombre();}
// « Modules posés par carte » : un niveau à la fois, choisi dans le sélecteur
function mdlNombre(){const S=$('mdlNbRec'),recs=mdlRecs();if(!recs.some(([k])=>k===MDL_ED.nbRec))MDL_ED.nbRec=recs[0][0];
  S.innerHTML=recs.map(([k,n])=>`<option value="${k}"${k===MDL_ED.nbRec?' selected':''}>${mdlEsc(n)}</option>`).join('');
  const k=MDL_ED.nbRec,d=MODULES.filter(o=>o.rec[k]).length;$('mdlNbVal').value=MODULES_NB[k]||0;
  $('mdlNbDispo').textContent=`${d} module${d>1?'s':''} pour ce niveau`;}
function mdlPinceaux(){const b=(couche,code,nom,ic)=>`<button class="mdlpn" data-couche="${couche}" data-code="${code}" title="${mdlEsc(nom)}" `+
    `aria-label="${mdlEsc(nom)}" aria-pressed="${MDL_ED.couche===couche&&MDL_ED.code===code}">${ic}</button>`;
  const tuile=cle=>{const o={w:1,h:1,t:[cle],m:['.']};return `<img src="${mdlImage(o,24)}" alt="" width="24" height="24">`;};
  $('mdlTerr').innerHTML=MDL_TERR.map(a=>b('t',a[0],a[1],tuile(a[0]))).join('');
  $('mdlMarq').innerHTML=MDL_MARQ.map(a=>b('m',a[0],a[1],`<img src="${mdlImage({w:1,h:1,t:['S'],m:[a[0]]},24)}" alt="" width="24" height="24">`)).join('')+
    b('m','.','Effacer','<i class="mdlgomme"></i>');}
function mdlFiche(){const o=mdlCourant(),F=$('mdlFiche');$('mdlEd').hidden=!o;F.hidden=!o;$('mdlVide').hidden=!!o;
  if(!o){$('mdlAvis').innerHTML='';return;}
  mdlDessine($('mdlCv'),o,MDL_C,true);$('mdlNom').value=o.nom;$('mdlW').value=o.w;$('mdlH').value=o.h;
  $('mdlRec').innerHTML=mdlRecs().map(([k,n])=>`<label><input type="checkbox" data-rec="${k}"${o.rec[k]?' checked':''}> ${mdlEsc(n)}</label>`).join('')
    +`<label title="Posé dans une fosse de l’Astroport (niveau 1), pas dans un bâtiment"><input type="checkbox" data-rec="@ext"${o.ext?' checked':''}> Extérieur (fosse)</label>`;
  const av=mdlAvis(o);
    $('mdlAvis').innerHTML=av.length?av.map(t=>`<li>${mdlEsc(t)}</li>`).join(''):'<li class="ok">Module prêt à servir.</li>';
  MDL_ED.suppr=false;$('mdlSuppr').textContent='Supprimer';}
function mdlTout(){mdlListe();mdlPinceaux();mdlFiche();}
function mdlChange(msg){saveModules();mdlListe();mdlFiche();$('mdlMsg').className='saved';
  $('mdlMsg').textContent=msg||'Modifié (gardé dans ce navigateur). « Enregistrer » l’envoie dans la base de l’artefact.';}
// pose le pinceau en cours sur la case (x, y) ; renvoie vrai si quelque chose a changé
function mdlPose(x,y){const o=mdlCourant();if(!o||x<0||y<0||x>=o.w||y>=o.h)return false;
  const mets=(g,ch)=>{g[y]=g[y].slice(0,x)+ch+g[y].slice(x+1);};const at=o.t[y][x],am=o.m[y][x];
  if(MDL_ED.couche==='t'){if(at===MDL_ED.code)return false;mets(o.t,MDL_ED.code);if(!MDL_PRAT.includes(MDL_ED.code)&&am!=='.')mets(o.m,'.');}
  else{if(am===MDL_ED.code)return false;
    // un emplacement ne tient que sur une case praticable : la case devient du sol si elle ne l'est pas
    if(MDL_ED.code!=='.'&&!MDL_PRAT.includes(at))mets(o.t,'.');mets(o.m,MDL_ED.code);}
  return true;}
// déplace le module de la place « de » pour qu'il se retrouve devant celui qui occupait la place « vers » ; la sélection suit son module
function mdlDeplace(de,vers){if(de<0||de>=MODULES.length||vers===de||vers===de+1)return;const sel=mdlCourant(),o=MODULES.splice(de,1)[0];
  MODULES.splice(vers>de?vers-1:vers,0,o);MDL_ED.i=Math.max(0,MODULES.indexOf(sel));mdlChange('Ordre des modules modifié.');}
function mdlTaille(w,h){const o=mdlCourant();if(!o)return;w=Math.max(MDL_MIN,Math.min(MDL_MAX,w|0||o.w));
  h=Math.max(MDL_MIN,Math.min(MDL_MAX,h|0||o.h));
  const t=[],m=[];for(let y=0;y<h;y++){t.push(((o.t[y]||'')+mdlLigne(w,'?')).slice(0,w));m.push(((o.m[y]||'')+mdlLigne(w,'.')).slice(0,w));}
  o.w=w;o.h=h;o.t=t;o.m=m;mdlChange();}
function openModules(){if(TRAV)stopTravel();if(REST)stopRest();if(EXPL)stopExplore();if(MDL_ED.i>=MODULES.length)MDL_ED.i=0;
  $('mdlMsg').textContent='';mdlTout();$('modules').hidden=false;$('modules').querySelector('.mcard').focus();}
function closeModules(){$('modules').hidden=true;$('mdlBtn').focus();render();}
if(typeof document!=='undefined'&&$('mdlBtn')){
  $('mdlBtn').onclick=openModules;$('mdlClose').onclick=closeModules;
  $('modules').addEventListener('pointerdown',ev=>{if(ev.target===$('modules'))closeModules();});
  $('modules').addEventListener('keydown',ev=>{if(ev.key==='Escape'){ev.preventDefault();closeModules();}ev.stopPropagation();});
  $('mdlNew').onclick=()=>{MODULES.push(mdlNeuf());MDL_ED.i=MODULES.length-1;mdlChange('Nouveau module créé.');};
  $('mdlDup').onclick=()=>{const o=mdlCourant();if(!o)return;const c=JSON.parse(JSON.stringify(o));
    c.id='m'+Date.now().toString(36);c.nom=(o.nom+' bis').slice(0,30);MODULES.splice(MDL_ED.i+1,0,c);MDL_ED.i++;mdlChange('Module dupliqué.');};
  // suppression en deux clics, sans boîte de dialogue
  $('mdlSuppr').onclick=()=>{const o=mdlCourant();if(!o)return;
    if(!MDL_ED.suppr){MDL_ED.suppr=true;$('mdlSuppr').textContent='Confirmer ?';return;}
    MODULES.splice(MDL_ED.i,1);MDL_ED.i=Math.max(0,Math.min(MDL_ED.i,MODULES.length-1));mdlChange('Module supprimé.');};
  $('mdlList').addEventListener('click',ev=>{const b=ev.target.closest('.mdlit');if(!b)return;MDL_ED.i=+b.dataset.i;mdlListe();mdlFiche();});
  $('mdlNbRec').addEventListener('change',()=>{MDL_ED.nbRec=$('mdlNbRec').value;mdlNombre();});
  $('mdlNbVal').addEventListener('change',()=>{
    MODULES_NB[MDL_ED.nbRec]=Math.max(0,Math.min(MDL_NB_MAX,Math.round(+$('mdlNbVal').value||0)));mdlChange();});
  for(const id of ['mdlTerr','mdlMarq'])$(id).addEventListener('click',ev=>{const b=ev.target.closest('.mdlpn');if(!b)return;
    MDL_ED.couche=b.dataset.couche;MDL_ED.code=b.dataset.code;mdlPinceaux();});
  // ranger la banque : on glisse un module et on le lâche au-dessus ou au-dessous d'un autre (un filet montre où il ira)
  {const L=$('mdlList');let de=-1;const net=()=>L.querySelectorAll('.dessus,.dessous').forEach(e=>e.classList.remove('dessus','dessous'));
    const cible=ev=>{const b=ev.target.closest('.mdlit');if(!b||de<0)return null;const r=b.getBoundingClientRect();
      return {b,i:+b.dataset.i,bas:ev.clientY>r.top+r.height/2};};
    L.addEventListener('dragstart',ev=>{const b=ev.target.closest('.mdlit');if(!b)return;de=+b.dataset.i;
      try{ev.dataTransfer.effectAllowed='move';ev.dataTransfer.setData('text/plain',String(de));}catch(e){}});
    L.addEventListener('dragover',ev=>{const c=cible(ev);if(!c)return;ev.preventDefault();net();c.b.classList.add(c.bas?'dessous':'dessus');});
    L.addEventListener('dragleave',ev=>{if(!L.contains(ev.relatedTarget))net();});
    L.addEventListener('dragend',()=>{de=-1;net();});
    L.addEventListener('drop',ev=>{const c=cible(ev);if(!c)return;ev.preventDefault();mdlDeplace(de,c.i+(c.bas?1:0));de=-1;});}
  $('mdlNom').addEventListener('change',()=>{const o=mdlCourant();if(!o)return;o.nom=$('mdlNom').value.trim().slice(0,30)||'Module';mdlChange();});
  $('mdlW').addEventListener('change',()=>mdlTaille(+$('mdlW').value,0));
    $('mdlH').addEventListener('change',()=>mdlTaille(0,+$('mdlH').value));
  $('mdlRec').addEventListener('change',ev=>{const o=mdlCourant(),k=ev.target.dataset.rec;if(!o||!k)return;
    if(k==='@ext'){if(ev.target.checked)o.ext=1;else delete o.ext;}else if(ev.target.checked)o.rec[k]=true;else delete o.rec[k];mdlChange();});
  $('mdlFill').onclick=()=>{const o=mdlCourant();if(!o||MDL_ED.couche!=='t')return;
    for(let y=0;y<o.h;y++)for(let x=0;x<o.w;x++)mdlPose(x,y);mdlChange();};
  // dessin : on peint tant que le bouton est tenu ; la banque n'est enregistrée qu'au relâcher
  let peint=false,touche=false;const cv=$('mdlCv');
  const caseDe=ev=>{const r=cv.getBoundingClientRect(),o=mdlCourant();
    return [Math.floor((ev.clientX-r.left)/r.width*o.w),Math.floor((ev.clientY-r.top)/r.height*o.h)];};
  const trait=ev=>{const o=mdlCourant();if(!o)return;const [x,y]=caseDe(ev);if(mdlPose(x,y)){touche=true;mdlDessine(cv,o,MDL_C,true);}};
  cv.addEventListener('pointerdown',ev=>{ev.preventDefault();peint=true;touche=false;try{cv.setPointerCapture(ev.pointerId);}catch(e){}trait(ev);});
  cv.addEventListener('pointermove',ev=>{if(peint)trait(ev);});
  const fin=()=>{if(!peint)return;peint=false;if(touche)mdlChange();};
  cv.addEventListener('pointerup',fin);cv.addEventListener('pointercancel',fin);
  $('mdlSave').onclick=()=>{saveModules();
    if(typeof saveSettings==='function'&&DB)saveSettings($('mdlSave'),$('mdlMsg'));
    else{$('mdlMsg').className='saved ok';$('mdlMsg').textContent='Gardé dans ce navigateur (pas de base sur cette page).';}};
}
