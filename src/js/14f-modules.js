/* ---------- Éditeur de modules (Lab → Modules, 24 novembre 2026) ----------
   Un module est un morceau de carte dessiné à la main (salle, couloir, agencement de murs ou de montagne), de 3 × 3 à
   16 × 16 cases. Il est fait de deux couches :
   – « t », le terrain, une lettre par case (MDL_TERR) ; « ? » = case libre, laissée au choix de la génération ;
   – « m », les emplacements (MDL_MARQ) : entrée (raccord au reste de la carte), machine, butin, ennemi. Le jeu remplira
     ces cases lui-même ; un emplacement ne tient que sur une case praticable (MDL_PRAT).
   Chaque module dit dans quelles recettes il peut être tiré (« rec ») ; MODULES_NB donne, par recette, combien en poser
   par carte. Posé, un module pourra être tourné et retourné : mdlVariantes en donne jusqu'à huit.
   Ce fichier fait l'éditeur et la banque (np-modules dans le navigateur, champ « modules » de reglages/courant dans la base
   de l'artefact). La pose est dans 07b-batiments.js (mdlTirage, mdlPrepare, accretion) : NIVEAU 1 SEULEMENT pour l'instant. */
const MDL_TERR=[['?','Libre',''],['.','Sol','ground0'],['R','Rocher','rock'],['M','Montagne','mtBody'],['H','Roche dure','hardBody'],
  ['E','Eau','liq0'],['P','Eau profonde','deep0'],['G','Herbes hautes','grass0'],['F','Herbes basses','flat0'],['X','Mur','wall'],
  ['S','Sol bâti','floor'],['D','Porte','door'],['O','Pilier','pillar']];
const MDL_MARQ=[['x','Entrée','1','E'],['m','Machine','5','M'],['b','Butin','2','B'],['e','Ennemi','4','!']];
const MDL_PRAT='.GFSD',MDL_MIN=3,MDL_MAX=16,MDL_NB_MAX=6,MDL_C=32;
let MODULES=[],MODULES_NB={},MDL_ED={i:0,couche:'t',code:'X',suppr:false};
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
  return {id:String(o.id||'m'+Math.random().toString(36).slice(2,9)).slice(0,24),nom:String(o.nom||'Module').slice(0,30),w,h,t,m,rec};}
function modulesEtat(){return {liste:JSON.parse(JSON.stringify(MODULES)),nb:Object.assign({},MODULES_NB)};}
function modulesApplique(o){if(!o||typeof o!=='object')return;
  if(Array.isArray(o.liste))MODULES=o.liste.map(mdlValide).filter(Boolean).slice(0,200);
  MODULES_NB={};for(const [k] of mdlRecs()){const v=o.nb?+o.nb[k]:0;
    MODULES_NB[k]=isFinite(v)?Math.max(0,Math.min(MDL_NB_MAX,Math.round(v))):0;}}
function saveModules(){try{localStorage.setItem('np-modules',JSON.stringify(modulesEtat()));}catch(e){}touchLocal();}
try{modulesApplique(JSON.parse(localStorage.getItem('np-modules')||'null')||{});}catch(e){modulesApplique({});}

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
  if(!entrees)a.push('Aucune entrée : ce module ne sera pas posé, le jeu ne saurait pas par où le raccorder.');
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
      if(ch!=='S'&&ch!=='X'&&tl.ground0)g.drawImage(tl.ground0,0,0,16,16,X,Y,c,c);
      if(ch==='D'&&tl.floor)g.drawImage(tl.floor,0,0,16,16,X,Y,c,c);
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
  L.innerHTML=MODULES.length?MODULES.map((o,i)=>`<button class="mdlit" data-i="${i}" aria-pressed="${i===MDL_ED.i}">`+
    `<img src="${mdlImage(o,4)}" alt="" width="${o.w*4}" height="${o.h*4}"><span><b>${mdlEsc(o.nom)}</b><small>${o.w} × ${o.h}</small></span></button>`).join('')
    :'<p class="mnote">La banque est vide. « Nouveau » crée un premier module.</p>';
  $('mdlNb').innerHTML=mdlRecs().map(([k,n])=>`<label>${mdlEsc(n)} <input type="number" min="0" max="${MDL_NB_MAX}" step="1" data-nb="${k}" `+
    `value="${MODULES_NB[k]||0}"><small>${MODULES.filter(o=>o.rec[k]).length} dispo.</small></label>`).join('');}
function mdlPinceaux(){const b=(couche,code,nom,ic)=>`<button class="mdlpn" data-couche="${couche}" data-code="${code}" title="${mdlEsc(nom)}" `+
    `aria-pressed="${MDL_ED.couche===couche&&MDL_ED.code===code}">${ic}<span>${mdlEsc(nom)}</span></button>`;
  const tuile=cle=>{const o={w:1,h:1,t:[cle],m:['.']};return `<img src="${mdlImage(o,24)}" alt="" width="24" height="24">`;};
  $('mdlTerr').innerHTML=MDL_TERR.map(a=>b('t',a[0],a[1],tuile(a[0]))).join('');
  $('mdlMarq').innerHTML=MDL_MARQ.map(a=>b('m',a[0],a[1],`<img src="${mdlImage({w:1,h:1,t:['S'],m:[a[0]]},24)}" alt="" width="24" height="24">`)).join('')+
    b('m','.','Effacer','<i class="mdlgomme"></i>');}
function mdlFiche(){const o=mdlCourant(),F=$('mdlFiche');$('mdlEd').hidden=!o;F.hidden=!o;$('mdlVide').hidden=!!o;if(!o)return;
  mdlDessine($('mdlCv'),o,MDL_C,true);$('mdlNom').value=o.nom;$('mdlW').value=o.w;$('mdlH').value=o.h;
  $('mdlRec').innerHTML=mdlRecs().map(([k,n])=>`<label><input type="checkbox" data-rec="${k}"${o.rec[k]?' checked':''}> ${mdlEsc(n)}</label>`).join('');
  const vs=mdlVariantes(o);
  $('mdlVar').innerHTML=`<small>${vs.length} variante${vs.length>1?'s':''} après rotations et miroirs</small><div>`+
    vs.map(v=>`<img src="${mdlImage(v,4)}" alt="" width="${v.w*4}" height="${v.h*4}">`).join('')+'</div>';
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
  $('mdlNb').addEventListener('change',ev=>{const k=ev.target.dataset.nb;if(!k)return;
    MODULES_NB[k]=Math.max(0,Math.min(MDL_NB_MAX,Math.round(+ev.target.value||0)));mdlChange();});
  for(const id of ['mdlTerr','mdlMarq'])$(id).addEventListener('click',ev=>{const b=ev.target.closest('.mdlpn');if(!b)return;
    MDL_ED.couche=b.dataset.couche;MDL_ED.code=b.dataset.code;mdlPinceaux();});
  $('mdlNom').addEventListener('change',()=>{const o=mdlCourant();if(!o)return;o.nom=$('mdlNom').value.trim().slice(0,30)||'Module';mdlChange();});
  $('mdlW').addEventListener('change',()=>mdlTaille(+$('mdlW').value,0));
    $('mdlH').addEventListener('change',()=>mdlTaille(0,+$('mdlH').value));
  $('mdlRec').addEventListener('change',ev=>{const o=mdlCourant(),k=ev.target.dataset.rec;if(!o||!k)return;
    if(ev.target.checked)o.rec[k]=true;else delete o.rec[k];mdlChange();});
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
