/* ---------- Mode carte : la vue défile sans déplacer le robot ---------- */
let freeCam=false,camCX=0,camCY=0;
function setFreeCam(on){freeCam=on;if(on){camCX=G.px;camCY=G.py;}$('camTag').hidden=!on;render();}
function panCam(dx,dy){camCX=Math.max(0,Math.min(W-1,camCX+dx));camCY=Math.max(0,Math.min(H-1,camCY+dy));render();}
// Mini-carte : un clic recentre la vue ; bouton maintenu + glisser = défilement en temps réel.
// Saisi à l'intérieur, le cadre suit le pointeur sans sauter ; saisi à l'extérieur, il se centre d'abord sous le pointeur.
let miniDrag=null;
const miniCell=ev=>{const r=mv.getBoundingClientRect();return [(ev.clientX-r.left)/r.width*W,(ev.clientY-r.top)/r.height*H];};
function miniMove(ev){const [x,y]=miniCell(ev);camCX=Math.max(0,Math.min(W-1,Math.round(x-miniDrag.ox)));camCY=Math.max(0,Math.min(H-1,Math.round(y-miniDrag.oy)));render();}
mv.addEventListener('pointerdown',ev=>{if(!G||!$('overlay').hidden||ev.button>0)return;ev.preventDefault();
  if(TRAV)stopTravel('Trajet interrompu.');if(INSPECT){INSPECT=false;$('inspTag').hidden=true;}
  if(!freeCam)setFreeCam(true);
  const vc=vw/S,vr=vh/S,[x,y]=miniCell(ev);camCX=camX+Math.floor(vc/2);camCY=camY+Math.floor(vr/2);
  const inside=x>=camX&&x<camX+vc&&y>=camY&&y<camY+vr;
  miniDrag={ox:inside?x-camCX:0,oy:inside?y-camCY:0};try{mv.setPointerCapture(ev.pointerId);}catch(e){}
  mv.style.cursor='grabbing';miniMove(ev);});
mv.addEventListener('pointermove',ev=>{if(miniDrag)miniMove(ev);});
const miniEnd=()=>{if(!miniDrag)return;miniDrag=null;mv.style.cursor='';};
mv.addEventListener('pointerup',miniEnd);mv.addEventListener('pointercancel',miniEnd);
function mini(){
  // la mini-carte occupe toute la largeur de la colonne ; chaque case est calée sur des pixels entiers
  const dpr=devicePixelRatio||1,cw=Math.max(60,mv.clientWidth||mv.parentElement.clientWidth),pw=Math.round(cw*dpr),ph=Math.round(pw*H/W);
  if(mv.width!==pw||mv.height!==ph){mv.width=pw;mv.height=ph;mv.style.height=Math.round(cw*H/W)+'px';}
  const k=pw/W,X=x=>Math.floor(x*k),Y=y=>Math.floor(y*k),cell=(x,y,w,h)=>mctx.fillRect(X(x),Y(y),X(x+(w||1))-X(x),Y(y+(h||1))-Y(y));
  mctx.setTransform(1,0,0,1,0,0);mctx.globalAlpha=1;mctx.fillStyle='#020605';mctx.fillRect(0,0,pw,ph);
  const C=[[PAL['3'],.14],[PAL['3'],.55],[PAL['3'],.85],[PAL['2'],.6],[PAL['1'],.55],[PAL['1'],.22],[PAL['2'],.22],['#000',1],[PAL['3'],.3],[PAL['3'],.3],[PAL['1'],.35],[PAL['1'],.9],[PAL['2'],.35]];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=idx(x,y);if(fog&&!G.seen[i])continue;const [c,a]=C[G.t[i]]||C[0];mctx.globalAlpha=a;mctx.fillStyle=c;cell(x,y);}
  mctx.globalAlpha=1;
  if(G.gems){mctx.fillStyle=PAL['2'];for(const k in G.gems){const i=+k;if(fog&&!G.seen[i])continue;cell(i%W,(i/W)|0);}}
  for(const s of G.sites){if(fog&&!s.seen)continue;mctx.fillStyle=s.known?PAL['3']:PAL['2'];cell(s.x-1,s.y-1,3,3);}
  // ennemis : points rouges (dans le champ de vision, ou partout sans brouillard)
  {const d=Math.max(2,Math.round(k*1.2));mctx.fillStyle='#ff3b3b';
   for(const e of [...(G.beasts||[]),...(G.animals||[])]){if(fog&&!vis[idx(e.x,e.y)])continue;mctx.fillRect(Math.round((e.x+.5)*k-d/2),Math.round((e.y+.5)*k-d/2),d,d);}}
  mctx.strokeStyle=PAL['1'];mctx.globalAlpha=.5;mctx.lineWidth=Math.max(1,Math.round(dpr));
  mctx.strokeRect(X(camX)+.5,Y(camY)+.5,X(camX+Math.min(W,Math.ceil(vw/S)))-X(camX)-1,Y(camY+Math.min(H,Math.ceil(vh/S)))-Y(camY)-1);
  mctx.globalAlpha=1;mctx.fillStyle='#ffffff';const pr=Math.max(2,Math.round(k*1.5));mctx.fillRect(Math.round((G.px+.5)*k-pr/2),Math.round((G.py+.5)*k-pr/2),pr,pr);
}
/* ---------- Panneau « En vue » : chaque élément visible, sans répétition ---------- */
let ICON={};
// Barre ASCII : █ pour la part restante, ░ (même couleur, plus sombre) pour la part perdue
const ABAR_N=20,EBAR_N=10;
function asciiBar(v,max,n){const f=Math.max(0,Math.min(n,Math.round(v/max*n)));return `<span class="af">${'█'.repeat(f)}</span><span class="ae">${'░'.repeat(n-f)}</span>`;}
function seenHTML(){
  const ter=new Map(),out=[];
  for(let i=0;i<W*H;i++)if(vis[i]){const v=G.t[i];ter.set(v,(ter.get(v)||0)+1);}
  const near=(a,b)=>Math.hypot(a.x-G.px,a.y-G.py)-Math.hypot(b.x-G.px,b.y-G.py);
  const ans=[...(G.beasts||[]).filter(b=>vis[idx(b.x,b.y)]).map(b=>({o:b,sp:BEASTS[b.sp],ic:'bz'+b.sp+'r',hp:b.hp,st:b.hunt>0?'en chasse':'',agg:true})),
             ...(G.animals||[]).filter(a=>vis[idx(a.x,a.y)]).map(a=>({o:a,sp:SPECIES[a.sp],ic:'an'+a.sp+'r',hp:a.hp??SPECIES[a.sp].pv,st:{attack:'attaque',flee:'recule',follow:'suit',hold:'observe'}[a.mode]||'',agg:a.mode==='attack'}))]
    .sort((p,q)=>near(p.o,q.o));
  if(ans.length){const max=6;
    const calc=e=>{const tmA=terrMod(e.o.x,e.o.y),tmR=terrMod(G.px,G.py),me=hitChance(G.st.pre,e.sp.esq+tmA),them=e.agg?hitChance(e.sp.pre,robotEsq()):null;return {tmA,tmR,me,them};};
    const head='<div class="hd"><span></span><span>Vie</span><span title="Votre chance de le toucher">Toucher</span><span title="Sa chance de vous toucher">Subir</span></div>';
    out.push('<div class="grp">'+head+ans.slice(0,max).map(e=>{const pv=e.sp.pv,d=Math.max(Math.abs(e.o.x-G.px),Math.abs(e.o.y-G.py)),c=calc(e);
      return `<div class="an${e.agg&&e.st?' hunt':''}" title="${e.sp.n}${e.st?' · '+e.st:''} · ${d} case${d>1?'s':''} · ${Math.max(0,e.hp)}/${pv} PV"><img src="${ICON[e.ic]||''}" alt="${e.sp.n}"><span class="hp">${asciiBar(Math.max(0,e.hp),pv,EBAR_N)}</span><span class="n" style="color:${chanceCol(c.me)}">${c.me} %</span><span class="n" style="color:${c.them==null?'var(--dim)':chanceCol(100-c.them)}">${c.them==null?'—':c.them+' %'}</span></div>`;}).join('')
    +(ans.length>max?`<div class="none">+ ${ans.length-max} autre${ans.length-max>1?'s':''}</div>`:'')+'</div>');
  }
  {let ng=0,nr=0;if(G.gems)for(const k in G.gems){if(!vis[+k])continue;if(G.gems[k]==='visible')ng++;else nr++;}
   const L=[];if(ng)L.push(`<div class="site k">Joyau${ng>1?' ×'+ng:''} · à ramasser</div>`);if(nr)L.push(`<div class="site">Roche à joyau${nr>1?' ×'+nr:''} · à briser</div>`);if(L.length)out.push(`<div class="grp">${L.join('')}</div>`);}
  const sites=G.sites.filter(s=>vis[idx(s.x,s.y)]);
  if(sites.length)out.push('<div class="grp">'+sites.map(s=>`<div class="site${s.known?' k':''}">Site ${s.id} · ${s.known?'profondeur '+s.depth:'non analysé'}</div>`).join('')+'</div>');
  const ins=HOV&&!busy()?inspectHTML():'';
  return ins+(out.join('')||'<div class="none">Rien en vue.</div>');
}
function segs(el,v,max,n){n=n||max;const on=Math.ceil(v/max*n-1e-9);el.innerHTML=Array.from({length:n},(_,i)=>`<i class="${i<on?'on':''}"></i>`).join('');}
function side(){
  const st=G.st;

  for(const [t,v,mx] of [['lifeT',st.vie,st.vieMax],['enT',st.energie,st.energieMax]]){$(t).innerHTML=asciiBar(v,mx,ABAR_N);$(t).setAttribute('aria-valuenow',Math.floor(v));$(t).setAttribute('aria-valuemax',mx);}
  const tm=terrMod(G.px,G.py),ev=st.esq+tm;
  const sv={vitesse:st.vitesse,degats:st.degats,capteur:st.capteur,pre:st.pre,
    esq:tm?`<span style="color:${tm>0?'var(--c1)':'var(--life)'}">${ev}</span>`:ev,
    power:`${st.power}/t`};
  $('stats').innerHTML=STATS.map(([k,l,t])=>`<div class="r" title="${t}"><span>${l}</span><span>${sv[k]}</span></div>`).join('');
  $('msg').innerHTML=seenHTML();
  const lg=(G.log||[]).slice(-5);
  $('log').innerHTML=lg.map(e=>`<li class="${e.c||''}${e.t===G.turn&&!e.c?' new':''}"><span class="t">T${String(e.t).padStart(3,'0')}</span>${e.m}${e.n>1?`<span class="x">×${e.n}</span>`:''}</li>`).join('');
}


/* ---------- Commandes ---------- */
const KEYS={arrowup:[0,-1],arrowdown:[0,1],arrowleft:[-1,0],arrowright:[1,0],z:[0,-1],s:[0,1],q:[-1,0],d:[1,0],
  a:[-1,-1],e:[1,-1],w:[-1,1],c:[1,1],'8':[0,-1],'2':[0,1],'4':[-1,0],'6':[1,0],'7':[-1,-1],'9':[1,-1],'1':[-1,1],'3':[1,1]};
addEventListener('keydown',ev=>{
  if(INTRO){ev.preventDefault();if(ev.key==='Escape'||ev.key===' '||ev.key==='Enter')skipIntro();return;}
  if(!$('bestiary').hidden){if(ev.key==='Escape'){ev.preventDefault();closeBest();}return;}
  if(!$('viseurs').hidden){if(ev.key==='Escape'){ev.preventDefault();closeCur();}return;}
  if(!$('overlay').hidden||ev.ctrlKey||ev.metaKey||ev.altKey||ev.target.tagName==='INPUT')return;const k=ev.key.toLowerCase();
  if(TRAV){if(!['shift','control','alt','meta'].includes(k)){ev.preventDefault();stopTravel('Trajet interrompu.');}return;}
  if(INSPECT){ev.preventDefault();
    if(KEYS[k]){const st=ev.shiftKey?5:1;moveInspect(KEYS[k][0]*st,KEYS[k][1]*st);}
    else if(k==='enter'||k===' '){const t=HOV;setInspect(false);HOV=t;goTo(t.x,t.y);}
    else if(k==='x'||k==='escape')setInspect(false);
    else if(k==='b')toggleFog();
    return;}
  if(k==='x'){ev.preventDefault();setInspect(true);return;}
  // reprise du pilotage au clavier : le viseur disparaît jusqu'au prochain mouvement de souris
  if(HOV&&!['shift','control','alt','meta'].includes(k)){HOV=null;render();}
  if(k==='m'){ev.preventDefault();setFreeCam(!freeCam);return;}
  if(ev.key==='!'){ev.preventDefault();toggleSound();return;}
  if(freeCam){if(KEYS[k]){ev.preventDefault();const st=ev.shiftKey?5:2;panCam(KEYS[k][0]*st,KEYS[k][1]*st);}else if(k==='escape'){ev.preventDefault();setFreeCam(false);}else if(k==='b'){ev.preventDefault();toggleFog();}return;}
  if(KEYS[k]){ev.preventDefault();tryMove(...KEYS[k]);}else if(k==='f'){ev.preventDefault();askDrill();}else if(k==='b'){ev.preventDefault();toggleFog();}else if(k===' '||k==='5'||k==='.'||ev.code==='Numpad5'){ev.preventDefault();waitTurn();}
});
$('pad').addEventListener('click',ev=>{const b=ev.target.closest('button[data-d]');if(!b||!$('overlay').hidden)return;const [dx,dy]=b.dataset.d.split(',').map(Number);if(freeCam)panCam(dx*2,dy*2);else tryMove(dx,dy);});
$('waitPad').onclick=waitTurn;
$('bestBtn').onclick=openBest;
/* ---------- Enregistrement des réglages (base de l'artefact, lisible par Claude) ---------- */
let DB=null;
// À l'ouverture, les réglages enregistrés en base sont rechargés (même d'un autre appareil)
function applySaved(d){
  const num=v=>typeof v==='number'&&isFinite(v);
  if(d.bestiaire)BEST_LIST().forEach(e=>{const b=d.bestiaire[e.key];if(b)BFIELDS.forEach(([f])=>{if(num(b[f]))e.o[f]=b[f];});});saveBest();
  if(d.life)LIFE_LBL.forEach(([k])=>{if(num(d.life[k]))setLife(k,d.life[k]);});
  if(d.generation){const g=d.generation;GEN_LBL.forEach(([k])=>{if(num(g[k]))GEN[k]=0;});GEN_LBL.forEach(([k])=>{if(num(g[k]))setGen(k,g[k]);});
    if(METHODS.some(m=>m[0]===g.methode)){GEN.methode=g.methode;$('gm').value=g.methode;}
    if(num(g.remplissage))setCA('remplissage',g.remplissage,35,70);if(num(g.iterations))setCA('iterations',g.iterations,1,10);caState();saveGen();}
  if(d.palette&&Array.isArray(d.palette.palettes)){d.palette.palettes.forEach(pp=>{const t=PRESETS.find(x=>x.n===pp.nom);if(t&&Array.isArray(pp.couleurs)&&pp.couleurs.length===3)t.c=pp.couleurs.slice();});
    const ai=PRESETS.findIndex(x=>x.n===d.palette.active);usePreset(ai>=0?ai:PRESET_ACTIVE);}
  if(d.tuiles&&typeof d.tuiles==='object'){TILE_OV={};for(const k in d.tuiles)if(PAT_ORIG[k]&&validTile(d.tuiles[k],k))TILE_OV[k]=d.tuiles[k].slice();saveTiles();commitTileBase();buildTiles();}
}
(window.claude&&window.claude.use?window.claude.use('db'):Promise.resolve(null)).then(async d=>{DB=d;
  if(!DB)return;
  try{const snap=await DB.doc('reglages/courant').get();if(snap.exists){const data=snap.data(),dbT=Date.parse(data.enregistreLe)||0;let localT=0;try{localT=+localStorage.getItem('np-maj')||0;}catch(e){}
    if(dbT>=localT){APPLYING=true;try{applySaved(data);}finally{APPLYING=false;}try{localStorage.setItem('np-maj',String(dbT));}catch(e){}}
    render();}}
  catch(e){}}).catch(()=>{});
// Bouton « Enregistrer » retiré pour l'instant : les réglages restent dans le navigateur. La fonction est gardée pour plus tard.
async function saveSettings(){
  if(!DB||!$('saveBtn'))return;const b=$('saveBtn'),m=$('saveMsg');b.disabled=true;b.textContent='Enregistrement…';m.className='saved';m.textContent='';
  const best={};BEST_LIST().forEach(e=>{best[e.key]={nom:e.o.n};BFIELDS.forEach(([f])=>best[e.key][f]=e.o[f]);});
  const data={enregistreLe:new Date().toISOString(),bestiaire:best,life:Object.assign({},LIFE),generation:Object.assign({},GEN),
    planete:{largeur:W,hauteur:H,joyaux:GEM_COUNT},robot:G&&G.st?Object.assign({},G.st):null,
    palette:{active:PRESETS[PRESET_ACTIVE].n,palettes:PRESETS.map(p=>({nom:p.n,couleurs:p.c.slice()}))},
    tuiles:Object.assign({},TILE_OV)};
  try{await DB.doc('reglages/courant').set(data);commitTileBase();try{localStorage.setItem('np-maj',String(Date.parse(data.enregistreLe)));}catch(e){}if(!$('viseurs').hidden)drawCurEd();const t=new Date();m.className='saved ok';m.textContent=`Réglages enregistrés à ${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}.`;}
  catch(e){m.className='saved err';m.textContent=e&&e.code==='invalid_argument'?'Vous n’avez pas le droit d’enregistrer sur cette page.':'Échec de l’enregistrement. Réessayez dans un instant.';}
  b.disabled=false;b.textContent='Enregistrer';}
$('bestClose').onclick=closeBest;
$('bestiary').addEventListener('click',e=>{if(e.target===$('bestiary'))closeBest();});
$('bestList').addEventListener('change',e=>{const t=e.target;if(!t.dataset||!t.dataset.f)return;const ent=BEST_LIST().find(x=>x.key===t.dataset.k),fd=BFIELDS.find(x=>x[0]===t.dataset.f);
  const v=Math.max(fd[2],Math.min(fd[3],Math.round(+t.value||0)));t.value=v;ent.o[t.dataset.f]=v;
  if(t.dataset.f==='pv'){for(const a of [...(G.animals||[]),...(G.beasts||[])])if(a.hp>v)a.hp=v;}
  saveBest();});
$('bestReset').onclick=()=>{BEST_LIST().forEach(e=>Object.assign(e.o,BEST_DEF[e.key]));saveBest();buildBest();};
const saveSnd=()=>{try{localStorage.setItem('np-son',JSON.stringify(SND));}catch(e){}};
function toggleSound(){SND.on=!SND.on;saveSnd();say(SND.on?'Son activé.':'Son coupé.','info');if(SND.on){unlock();SFX.spot();}render();}
function toggleFog(){fog=!fog;try{localStorage.setItem('np-fog',fog?'on':'off');}catch(e){}say(fog?'Brouillard de guerre activé.':'Brouillard de guerre désactivé.','info');render();}
['fd-stats','fd-gen','fd-life','fd-pal','fd-lab'].forEach(id=>{const d=$(id);try{d.open=localStorage.getItem('np-'+id)==='open';}catch(e){}
  d.addEventListener('toggle',()=>{try{localStorage.setItem('np-'+id,d.open?'open':'closed');}catch(e){}});});
$('restart').onclick=e=>{e.preventDefault();e.stopPropagation();unlock();SFX.start();newGame();started=true;$('overlay').hidden=true;render();};
