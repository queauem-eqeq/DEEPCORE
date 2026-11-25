/* ---------- Banc de combat (15 novembre 2026) ----------
   Page à part, assemblée par outils/banc.py : la page du jeu, plus ce fichier. Le VRAI moteur tourne (génération, détection, combat) :
   on choisit une carte de taille 1, des ennemis, un équipement et un pilote automatique, et l'on rejoue le combat des dizaines de fois
   sans affichage pour en tirer des moyennes, ou une seule fois à l'écran pour le regarder.
   window.BANC expose serie(cfg, n) et essai(cfg) pour les lancer aussi depuis un script (outils/banc_series.py). */
(() => {
const $b=id=>document.getElementById(id),esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const vrai={render,addFx,say,sayMore};
dead=()=>{if(G.over)G.over.boom=true;};                        // pas d'explosion ni d'écran de fin sur le banc
function muet(on){if(on){render=()=>{};addFx=()=>{};say=(m,c)=>{G.msg={m,c:c||''};};sayMore=say;}else{render=vrai.render;addFx=vrai.addFx;say=vrai.say;sayMore=vrai.sayMore;}}
const ESP=()=>[{key:'puce',n:SPECIES[0].n,ic:'an0r'},...BEASTS.map((b,i)=>({key:b.key,n:b.n,ic:'bz'+i+'r'}))];
/* Reliefs d'essai du banc : les six reliefs des anciens biomes du jeu, gardés ici le 16 novembre 2026 quand la descente a été
   retirée, pour que les mesures déjà archivées restent comparables. Ce sont des terrains de mesure, pas du contenu de jeu. */
const RELIEFS={
  plateau:{n:'Plateau',gen:{eau:8,montagne:10,gouffre:3,herbe:14,methode:'automate'}},
  marecage:{n:'Marécage',gen:{eau:30,montagne:6,gouffre:1,herbe:28,methode:'automate'}},
  herbes:{n:'Hautes herbes',gen:{eau:6,montagne:6,gouffre:2,herbe:55,methode:'automate'}},
  galeries:{n:'Galeries',gen:{eau:2,montagne:46,gouffre:3,herbe:4,methode:'bruit'}},
  pierrier:{n:'Pierrier',gen:{eau:1,montagne:14,gouffre:6,herbe:2,methode:'bruit'}},
  failles:{n:'Failles',gen:{eau:4,montagne:22,gouffre:18,herbe:6,methode:'automate'}}
};
const CARTES=()=>[['arene','Arène dégagée'],...Object.entries(RELIEFS).map(([k,b])=>[k,b.n])];
const OBJ=s=>Object.entries(ITEMS).filter(([,d])=>d.slot===s).map(([k,d])=>[k,d.n]);
const PILOTES=[['chasse','Chasse : attaque tout ce qui vit'],['traversee','Traversée : va au site, se défend seulement']];

/* --- une carte de taille 1 prête à jouer --- */
function carte(cfg){const g0=GEN,gen=cfg.carte==='arene'?{eau:0,montagne:0,gouffre:0,herbe:0}:(RELIEFS[cfg.carte]||RELIEFS.plateau).gen;
  GEN=Object.assign({},g0,gen,{taille:1});SANS_VAISSEAU=true;try{genPlanet();}finally{GEN=g0;SANS_VAISSEAU=false;}
  if(cfg.carte==='arene')for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++)G.t[idx(x,y)]=GROUND;
  Object.assign(G,{w:W,h:H,eff:{},ore:{},items:{},tracks:{},lastDir:null,beasts:[],amb:[],blood:{},fv:2,inv:invTest(),log:[],sonar:2,over:null,time:0,debt:0,sprint:false});
  G.st.matiere=0;clePuce(cfg.ennemis);for(const k in LIFE)LIFE[k]=Math.max(0,Math.round(+(cfg.ennemis||{})[k]||0));
  spawnAnimals();spawnBeasts();
  itemsApplique(JSON.parse(JSON.stringify(ITEMS_DEF)));if(cfg.items)itemsApplique(cfg.items);   // variantes d'objets à l'essai (mêmes champs que Lab → Items)
  if(cfg.pow>0)G.st.power=Math.round(cfg.pow);   // POW d'essai (modules de puissance), avant d'équiper
  // 22 novembre 2026 : le sac est vide au départ ; le banc y met le kit demandé, puis les consommables (cfg.conso = {repar:2, charge:1…}), tous identifiés
  for(const k of [cfg.arme,cfg.armure,...(cfg.acc||[])])if(k&&k!=='foreuse'&&ITEMS[k]){let i=G.inv.findIndex(o=>o.k===k);if(i<0){G.inv.push({k,eq:0});i=G.inv.length-1;}if(!G.inv[i].eq)invEquip(i);}
  G.st.savoir={plans:{},ident:{},codes:{}};for(const k in CONSO)savoir().ident[k]=1;CONS_N=0;
  for(const k in cfg.conso||{})if(CONSO[k]&&cfg.conso[k]>0)G.inv.push({k,eq:0,n:Math.round(cfg.conso[k])});
  if(cfg.alerte){for(const b of G.beasts){b.hunt=1;spot(b);}for(const a of G.animals){a.aware=1;spot(a);}}   // assaut : tout le monde sait où est la foreuse et vient
  if(cfg.vie>0)G.st.vieMax=Math.round(cfg.vie);   // vie d'essai (voir l'interface)
  G.st.vie=G.st.vieMax;G.st.energie=G.st.energieMax;lastAct='move';if(typeof robotTiles==='function')robotTiles();turnStealth();computeFOV();}
const vivants=()=>[...(G.beasts||[]),...(G.animals||[])];

/* --- le pilote : un geste par appel ; renvoie false quand il n'a plus rien à faire --- */
function versCase(tx,ty){const dt=distFrom(tx,ty,true),c=dt[idx(G.px,G.py)];if(c<0)return false;let best=null,bv=c;
  for(const[dx,dy]of DIRS){const nx=G.px+dx,ny=G.py+dy;if(nx<1||ny<1||nx>=W-1||ny>=H-1||!diagOk(G.px,G.py,dx,dy))continue;const v=dt[idx(nx,ny)];
    if(v>=0&&v<bv){bv=v;best=[dx,dy];}}
  if(!best)return false;const t0=G.time,tr=G.turn;tryMove(best[0],best[1]);if(G.time===t0&&G.turn===tr)waitTurn();return true;}
function frappe(e){tryMove(Math.sign(e.x-G.px),Math.sign(e.y-G.py));}
/* Pilote avec consommables (22 novembre 2026) : réparobots sous la moitié de la vie ; charge sismique sur deux ennemis groupés
   (ou un gros) à portée ; batterie sur le Bloqueur qui tient la foreuse, sinon sur le plus dangereux au contact quand ils sont
   plusieurs ; surrégime au contact d'un ennemi solide. Un seul objet par geste. */
let CONS_N=0;
function consoPilote(){const a=k=>G.inv.findIndex(o=>o.k===k),V=vivants(),pv=e=>e.hp??pvDe((G.beasts.includes(e)?BEASTS:SPECIES)[e.sp]);
  const use=(k,x,y)=>{const i=a(k);if(i<0)return false;if(k==='charge'){VISEE={i,x,y};viseeOk();}else consoCible(i,x,y);CONS_N++;return true;};
  if(a('repar')>=0&&G.st.vie<=G.st.vieMax/2&&G.st.vie<=G.st.vieMax-ITEM_VAL.repar.soin)return use('repar',G.px,G.py);
  const adj=V.filter(e=>cheb(e,G.px,G.py)<=1);
  if(a('batterie')>=0){const t=adj.find(e=>e.tient&&!(e.stun>0))||(adj.length>=2?adj.filter(e=>!(e.stun>0)).sort((x,y)=>pv(y)-pv(x))[0]:null);if(t)return use('batterie',t.x,t.y);}
  if(a('charge')>=0){let best=null,bn=0;for(let y=G.py-VISEE_R;y<=G.py+VISEE_R;y++)for(let x=G.px-VISEE_R;x<=G.px+VISEE_R;x++){if(x<1||y<1||x>=W-1||y>=H-1||cheb({x,y},G.px,G.py)<=1)continue;
      const l=V.filter(e=>Math.abs(e.x-x)<=1&&Math.abs(e.y-y)<=1),n=l.length+(l.some(e=>pv(e)>=25)?1:0);if(n>bn){bn=n;best=[x,y];}}
    if(bn>=2)return use('charge',best[0],best[1]);}
  if(a('berserk')>=0&&!(G.eff.berserk>0)&&adj.some(e=>pv(e)>=18))return use('berserk',G.px,G.py);
  return false;}
function pas(cfg){if(G.over)return false;
  if(cfg.conso&&consoPilote())return !G.over;
  const adj=vivants().filter(e=>cheb(e,G.px,G.py)<=1&&diagOk(G.px,G.py,Math.sign(e.x-G.px),Math.sign(e.y-G.py)));
  if(cfg.pilote==='traversee'){const s=G.sites[0];if(!s||(s.x===G.px&&s.y===G.py))return false;
    const host=adj.filter(e=>e.hunt>0||e.mode==='attack'||e.aware);
    if(host.length){frappe(host.reduce((a,b)=>(a.hp??99)<=(b.hp??99)?a:b));return true;}
    if(!versCase(s.x,s.y)){if(adj.length){frappe(adj[0]);return true;}return false;}return true;}
  if(adj.length){frappe(adj.reduce((a,b)=>(a.hp??99)<=(b.hp??99)?a:b));return true;}
  const dr=distFrom(G.px,G.py,true);let cib=null,bd=1e9;
  for(const e of [...vivants(),]){const d=dr[idx(e.x,e.y)];if(d>=0&&d<bd){bd=d;cib=e;}}
  if(!cib)return false;
  if(bd<=1){tryMove(Math.sign(cib.x-G.px),Math.sign(cib.y-G.py));return true;}             // embusqué au contact, mal placé : on bute dessus
  return versCase(cib.x,cib.y);}

/* --- un essai, une série --- */
const LIMITE=900;
function fin(cfg,n0,v0){const reste=vivants().length,mort=!!(G.over&&G.over.dead),E=G.eff||{};
  const vie=mort?0:Math.max(0,G.st.vie-(E.poison>0?E.poison*(E.pdmg||0):0));
  const ok=cfg.pilote==='traversee'?!!(G.sites[0]&&G.sites[0].x===G.px&&G.sites[0].y===G.py):!reste;
  return {issue:mort?'mort':ok?'victoire':'incomplet',vie,v0,tues:n0-reste,n0,bat:(G.time||0)/100,cons:CONS_N};}
function essai(cfg){muet(true);const son=SND.on;SND.on=false;try{carte(cfg);const n0=vivants().length,v0=G.st.vie;let n=0;while(n++<LIMITE&&pas(cfg)){}return fin(cfg,n0,v0);}finally{SND.on=son;muet(false);}}
function bilan(cfg,l){const N=l.length,v=l.filter(r=>r.issue==='victoire'),m=l.filter(r=>r.issue==='mort'),som=(a,f)=>a.reduce((t,r)=>t+f(r),0);
  const perte=som(l,r=>r.v0-r.vie),tues=som(l,r=>r.tues);
  return {n:N,vic:Math.round(100*v.length/N),mort:Math.round(100*m.length/N),inc:Math.round(100*(N-v.length-m.length)/N),
    vie:v.length?Math.round(som(v,r=>r.vie)/v.length):null,v0:l[0].v0,perte:+(perte/N).toFixed(1),ennemis:+(som(l,r=>r.n0)/N).toFixed(1),tues:+(tues/N).toFixed(1),
    parMonstre:tues?+(perte/tues).toFixed(1):null,cons:+(som(l,r=>r.cons||0)/N).toFixed(2),bat:Math.round(som(l,r=>r.bat)/N)};}
function serie(cfg,n){const l=[];for(let i=0;i<n;i++)l.push(essai(cfg));return bilan(cfg,l);}

/* --- description d'une configuration --- */
const nomObj=k=>(ITEMS[k]||{n:k+' (retiré)'}).n;   // un résultat gardé peut citer un objet retiré depuis
function titre(cfg){const e=ESP().filter(s=>(cfg.ennemis||{})[s.key]>0).map(s=>cfg.ennemis[s.key]+' '+s.n).join(' + ')||'aucun ennemi';
  const k=[cfg.arme&&cfg.arme!=='foreuse'?nomObj(cfg.arme):null,cfg.armure?nomObj(cfg.armure):null,...(cfg.acc||[]).map(nomObj)].filter(Boolean);
  return {e,carte:(CARTES().find(c=>c[0]===cfg.carte)||['','?'])[1],kit:(k.length?k.join(', '):'foreuse nue')+(cfg.vie>0?` · vie d’essai ${cfg.vie}`:''),pilote:(cfg.pilote==='traversee'?'traversée':'chasse')+(cfg.alerte?', ennemis en alerte':'')};}

/* ---------- Interface ---------- */
let SESSION=[];try{SESSION=JSON.parse(localStorage.getItem('banc-session')||'[]')||[];}catch(e){}
const garde=()=>{try{localStorage.setItem('banc-session',JSON.stringify(SESSION.slice(-200)));}catch(e){}};
let COURS=null;                                                     // série ou combat en cours
function lire(){const ennemis={};ESP().forEach(s=>{const v=+$b('bq-'+s.key).value||0;if(v>0)ennemis[s.key]=Math.min(60,Math.round(v));});
  return {carte:$b('bcarte').value,ennemis,arme:$b('barme').value,armure:$b('barmure').value,acc:[...document.querySelectorAll('.bacc:checked')].map(c=>c.value).slice(0,3),pilote:$b('bpilote').value,vie:+$b('bvie').value||0,alerte:$b('balerte').checked};}
function poser(cfg){$b('bcarte').value=cfg.carte||'arene';ESP().forEach(s=>{$b('bq-'+s.key).value=(cfg.ennemis||{})[s.key]||0;});$b('barme').value=cfg.arme||'foreuse';$b('barmure').value=cfg.armure||'';
  document.querySelectorAll('.bacc').forEach(c=>{c.checked=(cfg.acc||[]).includes(c.value);});$b('bpilote').value=cfg.pilote||'chasse';$b('bvie').value=cfg.vie||0;$b('balerte').checked=!!cfg.alerte;onglet('essai');}
function ligne(cfg,r,i,src){const t=titre(cfg),cl=r.mort>=50?'bad':r.vic>=90?'ok':'';
  return `<tr class="${cl}" data-src="${src}" data-i="${i}" title="Cliquer pour reprendre cette configuration"><td><b>${esc(t.e)}</b><br><span>${esc(t.carte)} · ${esc(t.kit)} · ${t.pilote} · ${r.n} essais</span></td>
    <td>${r.vic} %${r.inc?`<br><span>${r.inc} % inachevés</span>`:''}</td><td>${r.vie==null?'—':r.vie}<span>/${r.v0}</span></td><td>${r.perte}</td><td><b>${r.parMonstre==null?'—':r.parMonstre}</b></td><td>${r.bat}</td></tr>`;}
const ENTETE='<thead><tr><th>Configuration</th><th>Victoires</th><th>Vie restante</th><th>PV perdus</th><th>PV perdus par ennemi tué</th><th>Battements</th></tr></thead>';
function tables(){
  $b('bres').innerHTML=SESSION.length?`<table class="btab">${ENTETE}<tbody>${SESSION.map((s,i)=>ligne(s.cfg,s.res,i,'s')).reverse().join('')}</tbody></table>`:'<p class="bnote">Aucun essai pour l’instant : lancez une série depuis l’onglet Essai.</p>';
  $b('bn').textContent=SESSION.length?` (${SESSION.length})`:'';}
function onglet(o){for(const k of ['essai','res']){$b('bt-'+k).setAttribute('aria-selected',k===o);$b('bp-'+k).hidden=k!==o;}}
function etat(t,c){const e=$b('betat');e.textContent=t;e.className='betat '+(c||'');}
function carteRes(cfg,r){const t=titre(cfg);$b('bdernier').innerHTML=`<div class="bcarte"><b>${esc(t.e)}</b><span>${esc(t.carte)} · ${esc(t.kit)} · ${t.pilote} · ${r.n} essai${r.n>1?'s':''}</span>
  <div class="bchif"><div><i>Victoires</i>${r.vic} %</div><div><i>Vie restante</i>${r.vie==null?'—':r.vie}<small>/${r.v0}</small></div><div><i>PV perdus</i>${r.perte}</div><div><i>Par ennemi tué</i>${r.parMonstre==null?'—':r.parMonstre}</div><div><i>Battements</i>${r.bat}</div></div>
  ${r.mort?`<p>${r.mort} % de morts${r.inc?`, ${r.inc} % inachevés (ennemis hors d’atteinte ou trop longs à rattraper)`:''}.</p>`:r.inc?`<p>${r.inc} % inachevés (ennemis hors d’atteinte ou trop longs à rattraper).</p>`:''}</div>`;}
function stop(){if(!COURS)return;clearTimeout(COURS.tm);COURS=null;muet(false);$b('bgo').disabled=false;$b('bvoir').disabled=false;$b('bstop').disabled=true;}
const finJeu=()=>{if(document.body.classList.contains('joue')){document.body.classList.remove('joue');resize();}};   // retour au banc seul
function lancer(){if(COURS)return;finJeu();const cfg=lire(),N=Math.max(1,Math.min(2000,Math.round(+$b('bn-essais').value||100))),l=[];
  if(!Object.keys(cfg.ennemis).length&&cfg.pilote==='chasse'){etat('Choisissez au moins un ennemi.','bad');return;}
  COURS={tm:0};$b('bgo').disabled=true;$b('bvoir').disabled=true;$b('bstop').disabled=false;
  const tranche=()=>{if(!COURS)return;const t0=performance.now();while(l.length<N&&performance.now()-t0<45)l.push(essai(cfg));
    etat(`Série en cours : ${l.length} / ${N} essais`);$b('bbarre').style.width=(100*l.length/N)+'%';
    if(l.length<N){COURS.tm=setTimeout(tranche,0);return;}
    const r=bilan(cfg,l);SESSION.push({cfg,res:r});garde();tables();carteRes(cfg,r);etat('Série terminée.','ok');stop();carte(cfg);vrai.render();};
  tranche();}
function voir(){if(COURS)return;finJeu();const cfg=lire();if(!Object.keys(cfg.ennemis).length&&cfg.pilote==='chasse'){etat('Choisissez au moins un ennemi.','bad');return;}
  muet(true);carte(cfg);muet(false);fog=$b('bfog').checked;computeFOV();vrai.render();
  const n0=vivants().length,v0=G.st.vie;let n=0;COURS={tm:0};$b('bgo').disabled=true;$b('bvoir').disabled=true;$b('bstop').disabled=false;etat('Combat en cours…');
  const tic=()=>{if(!COURS)return;const suite=n++<LIMITE&&pas(cfg);
    if(suite){COURS.tm=setTimeout(tic,+$b('bvit').value);return;}
    const r=bilan(cfg,[fin(cfg,n0,v0)]);carteRes(cfg,r);etat(r.vic?'Victoire.':r.mort?'Foreuse détruite.':'Combat inachevé.',r.vic?'ok':'bad');stop();vrai.render();};
  tic();}

/* Générer (22 novembre 2026) : la même arène que « Voir un combat », mais c'est vous qui jouez, au clavier et à la souris comme
   dans le jeu. Inventaire plein au départ : 2 exemplaires de chaque consommable, tous identifiés (18 places sur 20), en plus de
   l'équipement choisi. Une foreuse détruite propose d'en générer une autre, sur la même configuration. */
const GEN_CONSO=2;
function generer(){if(COURS)stop();const cfg=Object.assign(lire(),{conso:{}});for(const k in CONSO)cfg.conso[k]=GEN_CONSO;
  muet(true);carte(cfg);muet(false);fog=$b('bfog').checked;started=true;$('overlay').hidden=true;
  document.body.classList.add('joue');$('fd-sac').open=true;resize();   // la colonne du jeu revient, inventaire ouvert
  try{SAC_H='';INV_H=null;sacFix();}catch(e){}computeFOV();vrai.render();
  if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();   // les touches vont au jeu, pas au panneau
  etat('À vous de jouer : déplacements au clavier ou à la souris, I inventaire, T équipement.','ok');}
deployerForeuse=()=>{$('overlay').hidden=true;generer();};   // sur le banc, « Déployer une nouvelle foreuse » relance l'arène

function monter(){
  const p=document.createElement('aside');p.className='banc';p.id='banc';
  p.innerHTML=`<h1>Banc de combat</h1>
  <div class="btabs" role="tablist"><button role="tab" id="bt-essai" aria-selected="true">Essai</button><button role="tab" id="bt-res" aria-selected="false">Mes résultats<span id="bn"></span></button></div>
  <section id="bp-essai">
    <p class="bnote">Le vrai moteur du jeu, sur une carte de taille 1 (32 × 22). Une série rejoue le combat sans affichage et donne des moyennes ; « Voir un combat » en joue un seul à l’écran.</p>
    <div class="brow"><label for="bcarte">Carte</label><select id="bcarte">${CARTES().map(([k,l])=>`<option value="${k}">${esc(l)}</option>`).join('')}</select></div>
    <h4>Ennemis <button id="bzero" class="bmini">Tout à zéro</button></h4>
    <div class="besp">${ESP().map(s=>`<label for="bq-${s.key}"><img src="${ICON[s.ic]||''}" alt=""><span>${esc(s.n)}</span><input type="number" id="bq-${s.key}" min="0" max="60" step="1" value="0"></label>`).join('')}</div>
    <h4>Foreuse</h4>
    <div class="brow"><label for="barme">Arme</label><select id="barme">${OBJ('arme').map(([k,l])=>`<option value="${k}">${esc(l)}</option>`).join('')}</select></div>
    <div class="brow"><label for="barmure">Armure</label><select id="barmure"><option value="">Coque d’usine (départ)</option>${OBJ('armure').map(([k,l])=>`<option value="${k}">${esc(l)}</option>`).join('')}</select></div>
    <div class="bacs">${OBJ('acc').map(([k,l])=>`<label><input type="checkbox" class="bacc" value="${k}">${esc(l)}</label>`).join('')}</div>
    <div class="brow"><label for="bvie" title="0 : la vie normale de la foreuse. Une grande valeur (1000) sert à mesurer les dégâts encaissés sans que la mort n’arrête le combat.">Vie d’essai (0 = normale)</label><input type="number" id="bvie" min="0" max="9999" step="100" value="0"></div>
    <h4>Pilote automatique</h4>
    <div class="brow"><label for="bpilote">Consigne</label><select id="bpilote">${PILOTES.map(([k,l])=>`<option value="${k}">${esc(l)}</option>`).join('')}</select></div>
    <label class="bcheck"><input type="checkbox" id="balerte">Ennemis en alerte : ils savent où est la foreuse et viennent tous</label>
    <div class="brow"><label for="bn-essais">Essais par série</label><input type="number" id="bn-essais" min="1" max="2000" step="10" value="100"></div>
    <div class="bbtns"><button class="go" id="bgo">Lancer la série</button><button id="bvoir">Voir un combat</button><button id="bgen" title="Pose l’arène et ses ennemis, puis vous jouez vous-même, inventaire plein">Générer</button><button id="bstop" disabled>Arrêter</button></div>
    <div class="brow"><label for="bvit">Vitesse du combat à l’écran</label><select id="bvit"><option value="260">Lente</option><option value="110" selected>Normale</option><option value="35">Rapide</option></select></div>
    <label class="bcheck"><input type="checkbox" id="bfog">Brouillard de guerre pendant le combat à l’écran</label>
    <div class="bprog"><i id="bbarre"></i></div><div class="betat" id="betat" role="status"></div>
    <div id="bdernier"></div>
  </section>
  <section id="bp-res" hidden><div class="bbtns"><button id="bcopie">Copier le tableau</button><button id="bvide">Vider</button></div><div id="bres"></div></section>
`;
  document.querySelector('.game').appendChild(p);document.body.classList.add('surbanc');
  p.addEventListener('keydown',e=>e.stopPropagation());p.addEventListener('keyup',e=>e.stopPropagation());
  for(const k of ['essai','res'])$b('bt-'+k).onclick=()=>onglet(k);
  $b('bgo').onclick=lancer;$b('bvoir').onclick=voir;$b('bgen').onclick=generer;$b('bstop').onclick=()=>{stop();etat('Arrêté.');vrai.render();};
  $b('bzero').onclick=()=>ESP().forEach(s=>{$b('bq-'+s.key).value=0;});
  p.addEventListener('change',e=>{if(e.target.classList.contains('bacc')&&document.querySelectorAll('.bacc:checked').length>3){e.target.checked=false;etat('Trois accessoires au plus.','bad');}});
  $b('bvide').onclick=()=>{SESSION=[];garde();tables();};
  $b('bcopie').onclick=()=>{const t=['Configuration\tCarte\tÉquipement\tPilote\tEssais\tVictoires %\tVie restante\tPV perdus\tPV par ennemi tué\tBattements',
    ...SESSION.map(s=>{const t=titre(s.cfg),r=s.res;return [t.e,t.carte,t.kit,t.pilote,r.n,r.vic,r.vie??'',r.perte,r.parMonstre??'',r.bat].join('\t');})].join('\n');
    (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>{$b('bcopie').textContent='Copié';},()=>{$b('bcopie').textContent='Copie impossible ici';});setTimeout(()=>{$b('bcopie').textContent='Copier le tableau';},1800);};
  p.addEventListener('click',e=>{const tr=e.target.closest('tr[data-src]');if(!tr)return;
    if(tr.dataset.src==='s')poser(SESSION[+tr.dataset.i].cfg);});
  $b('bq-crabos').value=2;tables();resize();carte(lire());fog=false;computeFOV();vrai.render();}
// le jeu démarre seul (15-intro) ; on attend qu'il soit prêt, on coupe l'intro et le son, puis on monte le banc
const attente=setInterval(()=>{if(typeof G==='undefined'||!G||!G.t||typeof ICON==='undefined'||!ICON.an0r)return;clearInterval(attente);
  const sansIntro=()=>{try{if(INTRO)skipIntro();}catch(e){}$('introCv').hidden=true;$('introSkip').hidden=true;};
  sansIntro();started=true;SND.on=false;$('overlay').hidden=true;monter();let k=0;const t=setInterval(()=>{sansIntro();if(++k>40)clearInterval(t);},100);},60);
window.BANC={serie,essai,carte,pas,titre,ESP,generer};
})();
