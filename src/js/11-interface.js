const HSTATS_ORDRE=['power','capteur','degats','pre','def','crit','pas','coup','dis','detec'];
let HSTATS_H='';   // dernier contenu écrit dans les statistiques de la colonne
/* ---------- Mode carte : la vue défile sans déplacer le robot ---------- */
let freeCam=false,camCX=0,camCY=0;
/* Mode carte (M) : la Carte de la colonne s'ouvre en y entrant et se referme en sortant, sauf si elle était déjà ouverte avant
   (22 novembre 2026). */
let CARTE_AVANT=null;
function setFreeCam(on){const f=$('fd-carte');if(on&&!freeCam){CARTE_AVANT=f.open;f.open=true;
  }else if(!on&&freeCam&&CARTE_AVANT===false){f.open=false;CARTE_AVANT=null;}
  freeCam=on;if(on){camCX=G.px;camCY=G.py;}$('camTag').hidden=!on;render();}
function panCam(dx,dy){camCX=Math.max(0,Math.min(W-1,camCX+dx));camCY=Math.max(0,Math.min(H-1,camCY+dy));render();}
// Mini-carte : un clic recentre la vue ; bouton maintenu + glisser = défilement en temps réel.
// Saisi à l'intérieur, le cadre suit le pointeur sans sauter ; saisi à l'extérieur, il se centre d'abord sous le pointeur.
let miniDrag=null;
const miniCell=ev=>{const r=mv.getBoundingClientRect();return [(ev.clientX-r.left)/r.width*W,(ev.clientY-r.top)/r.height*H];};
function miniMove(ev){const [x,y]=miniCell(ev);camCX=Math.max(0,Math.min(W-1,Math.round(x-miniDrag.ox)));
  camCY=Math.max(0,Math.min(H-1,Math.round(y-miniDrag.oy)));render();}
mv.addEventListener('pointerdown',ev=>{if(!G||!$('overlay').hidden||ev.button>0)return;ev.preventDefault();
  // visée longue du phaseur (26 novembre 2026) : la mini-carte sert à viser loin d'un seul geste, sans toucher au mode carte
  if(PHASE){const [x,y]=miniCell(ev);phasePtr=null;phaseVers(Math.round(x),Math.round(y));return;}
  if(TRAV)stopTravel('Trajet interrompu.');if(REST)stopRest('Repos interrompu.');if(EXPL)stopExplore('Exploration interrompue.');
    if(INSPECT){INSPECT=false;$('inspTag').hidden=true;}
  if(!freeCam)setFreeCam(true);
  const vc=vw/S,vr=vh/S,[x,y]=miniCell(ev);camCX=camX+Math.floor(vc/2);camCY=camY+Math.floor(vr/2);
  const inside=x>=camX&&x<camX+vc&&y>=camY&&y<camY+vr;
  miniDrag={ox:inside?x-camCX:0,oy:inside?y-camCY:0};try{mv.setPointerCapture(ev.pointerId);}catch(e){}
  mv.style.cursor='grabbing';miniMove(ev);});
mv.addEventListener('pointermove',ev=>{if(miniDrag)miniMove(ev);});
const miniEnd=()=>{if(!miniDrag)return;miniDrag=null;mv.style.cursor='';};
mv.addEventListener('pointerup',miniEnd);mv.addEventListener('pointercancel',miniEnd);
const MINI_FOND={cv:document.createElement('canvas'),sig:'',G:null,t:null,vu:null};
function mini(){
  // la mini-carte occupe toute la largeur de la colonne ; chaque case est calée sur des pixels entiers
  const VITRE_FIN=.45;
  const dpr=devicePixelRatio||1,cw=Math.max(60,mv.clientWidth||mv.parentElement.clientWidth),pw=Math.round(cw*dpr),ph=Math.round(pw*H/W);
  if(mv.width!==pw||mv.height!==ph){mv.width=pw;mv.height=ph;mv.style.height=Math.round(cw*H/W)+'px';}
  const k=pw/W,X=x=>Math.floor(x*k),Y=y=>Math.floor(y*k),cell=(x,y,w,h)=>mctx.fillRect(X(x),Y(y),X(x+(w||1))-X(x),Y(y+(h||1))-Y(y));
  mctx.setTransform(1,0,0,1,0,0);mctx.globalAlpha=1;mctx.fillStyle='#020605';mctx.fillRect(0,0,pw,ph);
  // 13 = roche dure : la plus marquée de la mini-carte ; 14 à 17 = mur, sol bâti, porte, pilier
  // part de la case occupée par un mur vitré sur la mini-carte (26 novembre 2026)
  const C=[[PAL['3'],.14],[PAL['3'],.55],[PAL['3'],.85],[PAL['2'],.6],[PAL['1'],.55],[PAL['1'],.22],[PAL['2'],.22],['#000',1],[PAL['3'],.3],
    [PAL['3'],.3],[PAL['1'],.35],[PAL['1'],.9],[PAL['2'],.35],[PAL['3'],1],[PAL['5'],.95],[PAL['5'],.05],[PAL['1'],1],[PAL['5'],.7],
    ['#ffffff',1],[PAL['5'],.95]];
  /* Mur vitré (26 novembre 2026) : sa valeur (31) est hors de la table C, il retombait donc sur la teinte la plus
     pâle et ne se lisait pas comme un mur. Il prend la couleur du mur, mais un **trait plus fin** — centré dans la
     case, VITRE_FIN de sa largeur, un pixel au moins : la ligne se voit, et on voit que c'est une vitre. */
  /* Fond de la mini-carte en cache (26 novembre 2026) : les 6 144 cases étaient redessinées à chaque rendu (chaque image
     d'effet, chaque battement des liquides) pour retrouver presque la même image. On garde le fond dans un canevas à part
     et on ne repeint que les cases dont le terrain ou l'état « vu » a changé ; tout est refait si la taille, le brouillard,
     les couleurs ou la carte changent. Les cases ne se chevauchent pas : repeindre une case seule donne la même image. */
  const sig=`${pw}|${ph}|${fog?1:0}|${C.map(c=>c[0]).join()}`,t=G.t,vu=G.seen,F=MINI_FOND;
  const tout=F.sig!==sig||F.G!==G||!F.t||F.t.length!==t.length;
  if(tout){F.sig=sig;F.G=G;F.cv.width=pw;F.cv.height=ph;F.t=new Int32Array(t.length).fill(-1);F.vu=new Uint8Array(t.length);}
  const g=F.cv.getContext('2d');
  if(tout){g.globalAlpha=1;g.fillStyle='#020605';g.fillRect(0,0,pw,ph);}
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=idx(x,y),v=t[i],s=vu[i]?1:0;
    if(!tout&&F.t[i]===v&&F.vu[i]===s)continue;
    const x0=X(x),y0=Y(y),w=X(x+1)-x0,h=Y(y+1)-y0;
    if(!tout){g.globalAlpha=1;g.fillStyle='#020605';g.fillRect(x0,y0,w,h);}
    F.t[i]=v;F.vu[i]=s;if(fog&&!s)continue;
    if(v===VITRE){const [c,a]=C[WALL],iw=Math.max(1,Math.round(w*VITRE_FIN)),ih=Math.max(1,Math.round(h*VITRE_FIN));
      g.globalAlpha=a;g.fillStyle=c;g.fillRect(x0+((w-iw)>>1),y0+((h-ih)>>1),iw,ih);continue;}
    const [c,a]=C[v]||C[0];g.globalAlpha=a;g.fillStyle=c;g.fillRect(x0,y0,w,h);}
  mctx.globalAlpha=1;mctx.drawImage(MINI_FOND.cv,0,0);
  for(const s of G.sites){if(fog&&!s.seen)continue;mctx.fillStyle=s.known?PAL['3']:PAL['2'];cell(s.x-1,s.y-1,3,3);}
  {const sr=sonarR();if(sr>0&&G.ore){const d=Math.max(3,Math.round(k*1.4));for(const o in G.ore){const i=+o;if(!sonarVu(i,sr))continue;
    mctx.fillStyle=oreMat(G.ore[o])?PAL['1']:PAL['2'];mctx.fillRect(Math.round((i%W+.5)*k-d/2),Math.round((((i/W)|0)+.5)*k-d/2),d,d);}}
   // l'onde elle-même, au pixel, sans transparence
   for(const f of FX)if(f.kind==='sonar'){const u=Math.max(1,Math.round(dpr)),R=fxP(f)*f.r*k/u,cx=Math.round((f.x+.5)*k/u),
     cy=Math.round((f.y+.5)*k/u),w=Math.ceil(pw/u),h=Math.ceil(ph/u),q=R*Math.SQRT1_2;mctx.fillStyle=PAL['1'];
     const dot=(px,py)=>{if(px>=0&&py>=0&&px<w&&py<h)mctx.fillRect(px*u,py*u,u,u);};
     // gisements détectés par le sonar
     for(let e=-Math.ceil(q);e<=Math.ceil(q);e++){const g=Math.round(Math.sqrt(Math.max(0,R*R-e*e)));dot(cx+e,cy-g);dot(cx+e,cy+g);
       dot(cx-g,cy+e);dot(cx+g,cy+e);}}}
  // ennemis : points rouges (dans le champ de vision, ou partout sans brouillard)
  {const d=Math.max(2,Math.round(k*1.2));mctx.fillStyle=PAL['4'];
   for(const e of [...(G.beasts||[]),...(G.animals||[])]){if(fog&&!vis[idx(e.x,e.y)]&&!(G.beasts.includes(e)&&antDetecte(e)))continue;
     mctx.fillRect(Math.round((e.x+.5)*k-d/2),Math.round((e.y+.5)*k-d/2),d,d);}}
  mctx.strokeStyle=PAL['1'];mctx.globalAlpha=.5;mctx.lineWidth=Math.max(1,Math.round(dpr));
  mctx.strokeRect(X(camX)+.5,Y(camY)+.5,X(camX+Math.min(W,Math.ceil(vw/S)))-X(camX)-1,Y(camY+Math.min(H,Math.ceil(vh/S)))-Y(camY)-1);
  mctx.globalAlpha=1;mctx.fillStyle='#ffffff';const pr=Math.max(2,Math.round(k*1.5));
    mctx.fillRect(Math.round((G.px+.5)*k-pr/2),Math.round((G.py+.5)*k-pr/2),pr,pr);
  // viseur du phaseur (28 novembre 2026) : un carré creux, bio ou danger comme à l'écran, pour viser hors de la vue
  if(PHASE){const ok=phaseConnu(PHASE.x,PHASE.y)&&phaseTient(PHASE.x,PHASE.y),q=Math.max(5,Math.round(k*3)),u=Math.max(1,Math.round(dpr)),
    x0=Math.round((PHASE.x+.5)*k-q/2),y0=Math.round((PHASE.y+.5)*k-q/2);mctx.fillStyle=ok?PAL['2']:PAL['4'];
    mctx.fillRect(x0,y0,q,u);mctx.fillRect(x0,y0+q-u,q,u);mctx.fillRect(x0,y0,u,q);mctx.fillRect(x0+q-u,y0,u,q);}
}
/* Journal en grand (28 novembre 2026) : le bouton + ouvre une copie FIGÉE du journal dans une grande fenêtre. Rien ne la refait
   toute seule (ni nouveau message, ni assombrissement par tour) : on peut lire et sélectionner sans que le texte se décale.
   Pas de bouton d'actualisation : on ferme et on rouvre. */
function logBigBuild(){const lg=G&&G.log||[],blocs=[];
  for(const e of lg){const b=blocs[blocs.length-1];if(b&&b.t===e.t)b.ev.push(e);else blocs.push({t:e.t,ev:[e]});}
  $('lbTxt').innerHTML=blocs.map(b=>`<div class="lgl"><span class="t">T${String(b.t).padStart(3,'0')}</span><span>`+
    b.ev.map((e,k)=>`<span class="ev ${e.c||''}">${e.m}${e.n>1?` ×${e.n}`:''}</span>`+(k<b.ev.length-1?'<span class="sep">║</span>':'')).join('')+'</span></div>').join('');}
function logBigOpen(){if(!G)return;if(TRAV)stopTravel();if(REST)stopRest();if(EXPL)stopExplore();
  logBigBuild();$('logBig').hidden=false;const t=$('lbTxt');t.scrollTop=t.scrollHeight;$('lbClose').focus();}
function logBigClose(){$('logBig').hidden=true;$('logPlus').focus();render();}
$('logPlus').addEventListener('click',logBigOpen);$('lbClose').addEventListener('click',logBigClose);
$('logBig').addEventListener('keydown',ev=>{if(ev.key==='Escape'){ev.preventDefault();logBigClose();}ev.stopPropagation();});
$('logBig').addEventListener('pointerdown',ev=>{if(ev.target===$('logBig'))logBigClose();});
/* ---------- Panneau « En vue » : chaque élément visible, sans répétition ---------- */
let ICON={};
/* Barre ASCII : ░ sur toute la largeur, recouvert d'un calque de █ découpé à la largeur exacte (16 novembre 2026).
   Avant, la barre était faite de 20 caractères et la colonne n'en montrait que 14 : le reste était rogné à droite, si
   bien que 70 % de vie remplissait presque toute la largeur visible. La longueur est maintenant un pourcentage, donc
   juste à toute largeur de colonne et à toute taille de police. Le nombre de caractères n'est plus qu'un remplissage :
   il en faut assez pour déborder, le trop-plein est masqué. */
const ABAR_CH=48;
function asciiBar(v,max){const p=max>0?Math.max(0,Math.min(100,v/max*100)):0;
  return `<span class="ae">${'░'.repeat(ABAR_CH)}</span><span class="af" style="width:${p.toFixed(2)}%">${'█'.repeat(ABAR_CH)}</span>`;}
/* Repère de cadence (25 novembre 2026) : d'un coup d'œil, la vitesse de ce que la créature est en train de faire —
   son coup si elle est au contact, son pas sinon. Trois chevrons pleins = une action toutes les 50 unités de temps,
   donc deux pendant une action normale de la foreuse ; le chevron creux = plus lente qu'elle. */
const CADGL=d=>d<=50?'▸▸▸':d<=75?'▸▸':d<=100?'▸':'▹';
function seenHTML(){
  const ter=new Map(),out=[];
  for(let i=0;i<W*H;i++)if(vis[i]){const v=G.t[i];ter.set(v,(ter.get(v)||0)+1);}
  const near=(a,b)=>Math.hypot(a.x-G.px,a.y-G.py)-Math.hypot(b.x-G.px,b.y-G.py);
  /* Ordre (25 novembre 2026) : d'abord celles qui sont en jeu, dans l'ordre où elles vont agir (leur horloge, o.pret),
     puis les autres par distance. Les calmes restent donc en bas sans sauter d'une ligne à l'autre à chaque action. */
  const ans=[...(G.beasts||[]).filter(b=>vis[idx(b.x,b.y)]&&!beastCache(b)).map(b=>({o:b,sp:BEASTS[b.sp],ic:'bz'+b.sp+'r',hp:b.hp,st:b.hunt>0?(b.sees?'en chasse':b.search>0?'fouille':'cherche'):'',agg:true,ch:b.hunt>0,
               ouv:aOuvrage(b)?(ouvrAlerte(b)?'ALERTÉE':'À L’OUVRAGE'):''})),
             ...(G.animals||[]).filter(a=>vis[idx(a.x,a.y)]).map(a=>({o:a,ouv:aOuvrage(a)?(ouvrAlerte(a)?'ALERTÉE':'À L’OUVRAGE'):'',sp:SPECIES[a.sp],ic:'an'+a.sp+'r',hp:a.hp??pvDe(SPECIES[a.sp]),st:{attack:'attaque',flee:'recule',follow:'suit',hold:'observe',seek:'cherche',search:'fouille'}[a.mode]||'',agg:a.mode==='attack',ch:!!a.mode}))]
    .sort((p,q)=>(p.ch?0:1)-(q.ch?0:1)||(p.ch?(p.o.pret||0)-(q.o.pret||0):near(p.o,q.o)));
  if(ans.length){const max=6;
    const calc=e=>{const tmA=terrModDe(e.sp,e.o.x,e.o.y),tmR=terrMod(G.px,G.py),me=hitChance(robotPre(),e.sp.def+tmA),
      them=e.agg?hitChance(e.sp.pre,robotDef()):null;return {tmA,tmR,me,them};};
    const head='<div class="hd"><span></span><span title="Sa cadence : le nombre d’actions qu’elle fait pendant une action normale de '+NOM_FOREUSE+'"></span><span>Vie</span><span title="Votre chance de le toucher">Toucher</span><span title="Sa chance de vous toucher">Subir</span></div>';
    out.push('<div class="grp">'+head+ans.slice(0,max).map(e=>{const pv=pvDe(e.sp),d=Math.max(Math.abs(e.o.x-G.px),Math.abs(e.o.y-G.py)),c=calc(e);
      const dp=Math.round(dpasDe(e.o,e.sp)),dc=dcoupDe(e.o,e.sp),cd=d<=1?dc:dp;
      return `<div class="an${e.agg&&e.st?' hunt':''}" title="${e.sp.n}${e.ouv?' · '+e.ouv.toLowerCase():e.st?' · '+e.st:''} · ${d} case${d>1?'s':''} · ${Math.max(0,e.hp)}/${pv} PV · pas ${dp} (${motDuree(dp)}), coup ${dc} (${motDuree(dc)})"><img src="${ICON[e.ic]||''}" alt="${e.sp.n}"><span class="cad${cd<=50?' vif':''}" title="${cd<=100?'Jusqu’à '+cadenceDe(cd).toFixed(cadenceDe(cd)%1?1:0)+' action':'Une action toutes les '+(1/cadenceDe(cd)).toFixed(1)}${cd<=100?'s par action de '+NOM_FOREUSE+'':' actions de '+NOM_FOREUSE+''}">${CADGL(cd)}</span><span class="hp">${asciiBar(Math.max(0,e.hp),pv)}</span><span class="n" style="color:${chanceCol(c.me)}">${c.me} %</span><span class="n" style="color:${c.them==null?'var(--dim)':chanceCol(100-c.them)}">${c.them==null?'—':c.them+' %'}</span>${e.ouv?`<span class="ouv${e.ouv==='ALERTÉE'?' al':''}">${e.ouv}</span>`:''}</div>`;}).join('')
    +(ans.length>max?`<div class="none">+ ${ans.length-max} autre${ans.length-max>1?'s':''}</div>`:'')+'</div>');
  }
  const ins=HOV&&!busy()&&!viseCible()?inspectHTML(HOV):'';   // en mode viseur, la fiche est dans la colonne
  return ins+(out.join('')||'<div class="none">Rien en vue.</div>');
}
let FICHE_H='';
function side(){
  const st=G.st;

  for(const [t,v,mx,nm] of [['lifeT',st.vie,st.vieMax,'lifeN'],['enT',st.energie,st.energieMax,'enN']]){$(t).innerHTML=asciiBar(v,mx);
    $(nm).textContent=Math.floor(v)+'/'+mx;$(t).setAttribute('aria-valuenow',Math.floor(v));$(t).setAttribute('aria-valuemax',mx);}
  {const b=$('sprintBtn');b.textContent=G.sprint?'COURSE':'MARCHE';b.classList.toggle('on',!!G.sprint);
    b.setAttribute('aria-pressed',!!G.sprint);}
  // Le sous-menu Statistiques a été retiré le 15 novembre 2026 : les stats sont dans la fenêtre Équipement.
  sacDraw();
  {const E=G.eff||{},l=[];if(E.poison>0)l.push(`<span style="color:var(--life)">Poison ${E.poison}</span>`);
    if(E.glu>0)l.push(`Englué ${E.glu}`);
    {const sl=SLOW[G.t[idx(G.px,G.py)]];if(sl)l.push(`Ralenti ×${sl}`);}   // dans l'eau (28 novembre 2026)
    if(E.berserk>0)l.push(`<span style="color:var(--life)">Surrégime ${E.berserk}</span>`);
    if(E.repar&&E.repar.t>0)l.push(`<span style="color:var(--c2)">Réparation ${E.repar.t}</span>`);
    if(E.recharge&&E.recharge.t>0)l.push(`<span style="color:var(--armor)">Recharge ${E.recharge.t}</span>`);if(E.camo>0)l.push(`<span style="color:var(--c3)">Camouflé ${E.camo}</span>`);
    {const bt=Math.max(0,...(G.balises||[]).map(q=>q.t));if(bt>0)l.push(`<span style="color:var(--life)">Balise ${bt}</span>`);
    }/* battements restants (22 novembre 2026) */{const f=G.fum&&G.fum[idx(G.px,G.py)];
    if(f)l.push(`<span style="color:var(--c1)">Dans la fumée ${f.v}</span>`);}$('effs').innerHTML=l.join(' · ');}
  // le niveau est revenu le 21 novembre 2026 ; la taille de la carte se règle dans le menu Monde
  // Carte (22 novembre 2026) : niveau, profondeur (raccord avec le compteur des descentes) et taille, puis l'archétype monde et
  // l'archétype bâti, sans étiquette. Remplace la ligne du niveau qui était en haut de la colonne.
  // G.amb n'est pas toujours un texte (banc de combat)
  {const n=G.niv||1,p=profNiv(n),[am,ab]=G.archM?[G.archM,G.archB]:typeof G.amb==='string'?G.amb.split(' · '):[];
    $('cProf').textContent=`Niveau ${n} · ${p?'−'+p:0} m · ${W}×${H}`;$('cMonde').textContent=am||'Personnalisé';
      $('cBati').textContent=ab||'Personnalisé';}
  $('matN').textContent=G.st.matiere||0;
  // statistiques de la foreuse dans le sous-menu « Stats » (25 novembre 2026) : les mêmes valeurs que la fenêtre Équipement, terrain compris
  if(typeof INV_STATS!=='undefined'&&G.inv){const A=eqDe('arme')||null,B=eqDe('armure')||null;
    // sans VIE ni ÉNER : les deux barres du haut les donnent déjà (retirées le 25 novembre 2026)
    // ordre demandé le 26 novembre 2026, indépendant de celui de la fenêtre Équipement
    const lib=Object.fromEntries(INV_STATS);
    const h=HSTATS_ORDRE.filter(k=>lib[k]).map(k=>{const l=lib[k],c=statVal(k,G.st,A,B,0);
      return `<span tabindex="0" data-k="${k}" aria-describedby="stip"><i>${l}</i> <b>${c[1]??c[0]}${k==='crit'?' %':''}</b></span>`;}).join('');
    // réécrit seulement s'il change : sinon l'encadré survolé serait remplacé à chaque battement et l'infobulle sauterait
    if(h!==HSTATS_H&&$('hstats')){HSTATS_H=h;$('hstats').innerHTML=h;}if(typeof stipMaj==='function')stipMaj();}   // avalée par le commentaire depuis le 16 novembre 2026 : la matière ne s'affichait plus
  if(!$('inventaire').hidden)invDraw();
  $('msg').innerHTML=seenHTML();
  // fiche de la case visée (28 novembre 2026) : inspection, phaseur, visée d'une capsule ; réécrite seulement si elle change
  {const vc=viseCible(),f=$('fiche');f.closest('.col').classList.toggle('vise',!!vc);f.hidden=!vc;
    const h=vc?inspectHTML(vc):'';if(h!==FICHE_H){FICHE_H=h;f.innerHTML=h;}}
  logDraw();
}
/* Journal du bas (22 novembre 2026) : il défile (molette, barre) pour relire les messages plus anciens. Il n'est refait que
   quand il change ; un nouveau message le ramène tout en bas, sinon on reste là où on lisait. */
let LOG_SIG='',LOG_LI=[];
const LOG_PAS=.13,LOG_SOMBRE=.4;   // un tour s'assombrit de LOG_PAS par tour d'âge, sans descendre sous LOG_SOMBRE
function logDraw(){const lg=G.log||[],L=lg[lg.length-1],nouveau=`${lg.length}|${L?L.m+L.n+L.t:''}`,sig=nouveau+'|'+G.turn;
  if(sig===LOG_SIG)return;
  const el=$('log'),bas=!LOG_SIG||LOG_SIG.slice(0,LOG_SIG.lastIndexOf('|'))!==nouveau,top=el.scrollTop;LOG_SIG=sig;
  /* Un bloc par tour (26 novembre 2026) : le numéro de tour écrit **une seule fois**, à gauche, et tous les
     événements de ce tour à sa droite, dans l'ordre où ils sont arrivés. Les tours passés s'assombrissent avec
     l'âge jusqu'à un plancher : le tour en cours reste franc, les anciens s'effacent sans disparaître. */
  const blocs=[];
  for(const e of lg){const b=blocs[blocs.length-1];if(b&&b.t===e.t)b.ev.push(e);else blocs.push({t:e.t,ev:[e]});}
  const S=blocs.map((b,i)=>{const op=Math.max(LOG_SOMBRE,1-(blocs.length-1-i)*LOG_PAS);
    return `<li class="tour${b.t===G.turn?' new':''}" style="opacity:${op.toFixed(2)}">`+
      `<span class="t">T${String(b.t).padStart(3,'0')}</span><span class="evs">`+
      /* Les messages d'un tour se suivent sur la MÊME ligne, séparés par ║ (26 novembre 2026). Chaque message est
         une boîte en ligne : il passe à la ligne suivante **en entier** s'il ne tient pas au bout de celle-ci, et il
         n'est coupé que s'il est à lui seul plus large que la colonne. Le séparateur est collé à la fin du message
         qu'il suit, pour ne jamais se retrouver seul en début de ligne. */
      b.ev.map((e,k)=>`<span class="ev ${e.c||''}">${e.m}${e.n>1?`<span class="x">×${e.n}</span>`:''}`+
        (k<b.ev.length-1?'<span class="sep">║</span>':'')+'</span>').join('')+
      '</span></li>';});
  /* Seuls les tours qui ont changé sont refaits (26 novembre 2026) : avant, les 200 messages étaient reconstruits à
     chaque tour, alors que seuls les derniers changent (nouveaux messages, assombrissement). Même texte, même page. */
  const O=LOG_LI,li=el.children;
  if(li.length!==O.length)el.innerHTML=S.join('');
  else{const n=Math.min(O.length,S.length);for(let i=0;i<n;i++)if(O[i]!==S[i])li[i].outerHTML=S[i];
    for(let i=O.length-1;i>=S.length;i--)li[i].remove();
    if(S.length>n)el.insertAdjacentHTML('beforeend',S.slice(n).join(''));}
  LOG_LI=S;
  el.scrollTop=bas?el.scrollHeight:top;}


/* ---------- Commandes ---------- */
const KEYS={arrowup:[0,-1],arrowdown:[0,1],arrowleft:[-1,0],arrowright:[1,0],z:[0,-1],s:[0,1],q:[-1,0],d:[1,0],
  a:[-1,-1],e:[1,-1],w:[-1,1],c:[1,1],   // ↗ est revenue sur E le 15 novembre 2026 au soir : c'est T qui ouvre l'équipement
  '8':[0,-1],'2':[0,1],'4':[-1,0],'6':[1,0],'7':[-1,-1],'9':[1,-1],'1':[-1,1],'3':[1,1]};
addEventListener('keydown',ev=>{
  if(SELCAM)selStop();   // le défilement du sélecteur à la souris cesse à la première touche
  if(INTRO){ev.preventDefault();if(ev.key==='Escape'||ev.key===' '||ev.key==='Enter')skipIntro();return;}
  // mini-jeu : seul Échap passe (cela coûte de la vie)
  if(FORAGE){ev.preventDefault();if(ev.key==='Escape'||(!FORAGE.jeu&&(ev.key===' '||ev.key==='Enter')))skipForage();return;}
  // F9 (23 novembre 2026 ; avant, la cinématique de forage, qu'on lance aussi par NIV2 et NIV3) : un exemplaire de chaque
  // consommable dans l'inventaire, déjà identifié, dans la limite des 20 places
  if(ev.key==='F9'){ev.preventDefault();if(G&&!G.over)f9Consos();return;}
  // F6 (24 novembre 2026) : enregistre tout dans l'artefact — bestiaire, tuiles, palettes, stats, LIFE, Monde, objets, artefacts
  if(ev.key==='F6'){ev.preventDefault();saveSettings($('palSave'),$('palMsg'),true);return;}
  if(!$('inventaire').hidden){invKey(ev);return;}
  // navigation au clavier dans le sous-menu Inventaire
  if(SAC_NAV&&$('overlay').hidden&&ev.target.tagName!=='INPUT'){if(sacKey(ev))return;}
  if(!$('monde').hidden){if(ev.key==='Escape'){ev.preventDefault();mondeClose();}return;}
  if(!$('faune').hidden){if(ev.key==='Escape'){ev.preventDefault();lifeClose();}return;}
  if(!$('fabric').hidden){fabKey(ev);return;}
  if(!$('terminal').hidden){termKey(ev);return;}
  if(!$('artefacts').hidden){if(ev.key==='Escape'){ev.preventDefault();closeArtefacts();}return;}
  if(!$('groupes').hidden){if(ev.key==='Escape'){ev.preventDefault();closeGroupes();}return;}
  if(!$('discretion').hidden){if(ev.key==='Escape'){ev.preventDefault();closeDisc();}return;}
  if(!$('bestiary').hidden){if(ev.key==='Escape'){ev.preventDefault();closeBest();}return;}
  if(!$('viseurs').hidden){if(ev.key==='Escape'){ev.preventDefault();closeCur();}return;}
  if(!$('overlay').hidden||ev.ctrlKey||ev.metaKey||ev.altKey||ev.target.tagName==='INPUT')return;const k=ev.key.toLowerCase();
  /* Visée longue du phaseur (26 novembre 2026) : la foreuse est démontée, le viseur traverse toute la carte et la vue le suit.
     Shift accélère de cinq cases, comme le mode carte. Rien d'autre ne répond tant qu'elle n'est pas reformée. */
  if(PHASE){ev.preventDefault();
    if(KEYS[k]){const st=ev.shiftKey?5:1;phaseVers(PHASE.x+KEYS[k][0]*st,PHASE.y+KEYS[k][1]*st);phaseDefile(1);}
    else if(k==='enter'||k===' ')phaseOk();
    else if(k==='escape')phaseRetour();
    return;}
  if(VISEE){ev.preventDefault();                                  // visée d'une charge sismique : rien d'autre ne répond
    if(KEYS[k])viseeVers(VISEE.x+KEYS[k][0],VISEE.y+KEYS[k][1]);
    else if(k==='enter'||k===' ')viseeOk();
    else if(k==='escape')viseeStop('Charge sismique annulée.');
    return;}
  if(TRAV||REST||EXPL){if(!['shift','control','alt','meta'].includes(k)){ev.preventDefault();stopTravel('Trajet interrompu.');
    stopRest('Repos interrompu.');stopExplore('Exploration interrompue.');}return;}
  if(k==='v'){ev.preventDefault();toggleVision();return;}
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
  // attendre reste possible en mode carte (22 novembre 2026, pour les essais) : la vue ne bouge pas
  if(freeCam&&(k===' '||ev.code==='Numpad5'||(k==='5'&&!ev.code.startsWith('Numpad'))||k==='.')){ev.preventDefault();waitTurn();return;}
  if(freeCam){if(KEYS[k]){ev.preventDefault();const st=ev.shiftKey?5:2;panCam(KEYS[k][0]*st,KEYS[k][1]*st);
    }else if(k==='escape'){ev.preventDefault();setFreeCam(false);}else if(k==='b'){ev.preventDefault();toggleFog();}return;}
  if(KEYS[k]){ev.preventDefault();tryMove(...KEYS[k]);}else if(k==='f'){ev.preventDefault();askDrill();
    }else if(k==='b'){ev.preventDefault();toggleFog();}else if(k==='r'){ev.preventDefault();toggleSprint();
    }else if(k==='p'){ev.preventDefault();startRest();}else if(k==='t'){ev.preventDefault();invToggle();
    }else if(k==='i'){ev.preventDefault();sacNav(true);}else if(k==='o'){ev.preventDefault();startExplore();
    }else if(k===' '||k==='5'||k==='.'||ev.code==='Numpad5'){ev.preventDefault();waitTurn();}
});
$('pad').addEventListener('click',ev=>{const b=ev.target.closest('button[data-d]');if(!b||!$('overlay').hidden)return;const [dx,dy]=b.dataset.d.split(',').map(Number);if(freeCam)panCam(dx*2,dy*2);else tryMove(dx,dy);});
$('waitPad').onclick=waitTurn;
$('restPad').onclick=()=>{if($('overlay').hidden)startRest();};
$('restBtn').onclick=()=>{$('restBtn').blur();if($('overlay').hidden)startRest();};
$('explBtn').onclick=()=>{$('explBtn').blur();if($('overlay').hidden)startExplore();};
$('sprintBtn').onclick=()=>{if($('overlay').hidden)toggleSprint();};
$('bestBtn').onclick=openBest;
$('discBtn').onclick=openDisc;
/* ---------- Enregistrement des réglages (base de l'artefact, lisible par Claude) ---------- */
let DB=null;
// À l'ouverture, les réglages enregistrés en base sont rechargés (même d'un autre appareil)
function applySaved(d){
  const num=v=>typeof v==='number'&&isFinite(v);
  clePuce(d.bestiaire);if(d.bestiaire&&(Date.parse(d.enregistreLe)||0)>=BEST_CODE_LE)BEST_LIST().forEach(e=>{const b=d.bestiaire[e.key];if(b)BFIELDS.forEach(([f])=>{if(num(b[f]))e.o[f]=b[f];});});
  coupBorne();saveBest();   // coup 100 au moins (07-generation)
  if(num(d.discretion))setStealthBase(d.discretion);
  if(d.artefacts){ARTEFACTS=artefactsSains(d.artefacts);saveArtefacts();}
  if(d.items&&typeof itemsApplique==='function'){itemsApplique(d.items);saveItems();}
  // les anciennes intensités par espèce (d.intensite) ne sont plus lues
  if(d.groupes){const g=groupesSains(d.groupes);if(g){GROUPES=groupesAstroport(groupesV2(g));saveGroupes();}}
  // les archétypes d'avant cette date ont été effacés
  if(d.mondes&&typeof d.mondes==='object'&&Date.parse(d.enregistreLe)>Date.parse('2026-11-21T05:00:00Z')){
    MONDES=Object.assign({},MONDES,d.mondes);saveMondes();}
  if(d.generation){const g=d.generation;GEN_LBL.forEach(([k])=>{if(num(g[k]))GEN[k]=0;});
    GEN_LBL.forEach(([k])=>{if(num(g[k]))setGen(k,g[k],true);});
    if(METHODS.some(m=>m[0]===g.methode)){GEN.methode=g.methode;$('gm').value=g.methode;}
    if(num(g.remplissage))setCA('remplissage',g.remplissage,35,70);if(num(g.iterations))setCA('iterations',g.iterations,1,10);
      caState();saveGen();}
  // par rang et non par nom : le nom d'une palette est modifiable depuis le 24 novembre 2026
  if(d.palette&&Array.isArray(d.palette.palettes)){d.palette.palettes.forEach((pp,k)=>{const t=PRESETS[k]||PRESETS.find(x=>x.n===pp.nom);if(!t)return;
      if(Array.isArray(pp.couleurs)&&pp.couleurs.length===PAL_N)t.c=pp.couleurs.slice();
      if(typeof pp.nom==='string'&&pp.nom.trim())t.n=pp.nom;});
    savePresets();usePreset(PRESET_ACTIVE);}   // la palette active enregistrée n'est pas reprise : départ sur Braise (28 novembre 2026)
  // banque de modules (Lab → Modules, 24 novembre 2026)
  if(d.modules&&typeof modulesApplique==='function'){modulesApplique(d.modules);saveModules();}
  if(d.tuiles&&typeof d.tuiles==='object'){TILE_OV={};
    for(const k in d.tuiles)if(PAT_ORIG[k]&&validTile(d.tuiles[k],k))TILE_OV[k]=d.tuiles[k].slice();saveTiles();
    commitTileBase();buildTiles();}
}
(window.claude&&window.claude.use?window.claude.use('db'):Promise.resolve(null)).then(async d=>{DB=d;
  if(!DB)return;
  try{const snap=await DB.doc('reglages/courant').get();if(snap.exists){const data=snap.data(),dbT=Date.parse(data.enregistreLe)||0;
    let localT=0;try{localT=+localStorage.getItem('np-maj')||0;}catch(e){}
    if(dbT>=localT){APPLYING=true;try{applySaved(data);}finally{APPLYING=false;}try{localStorage.setItem('np-maj',String(dbT));}catch(e){}}
    render();}}
  catch(e){}}).catch(()=>{});
// Bouton « Enregistrer » du Tile editor : envoie tuiles et réglages dans la base de l'artefact (Claude peut ensuite les lire et les adopter)
// b, m : bouton et zone de message (Tile editor par défaut, ou Bestiaire)
async function saveSettings(b,m,journal){b=b instanceof HTMLElement?b:$('saveBtn');m=m||$('saveMsg');
  if(!DB||!b)return;b.disabled=true;b.textContent='Enregistrement…';m.className='saved';m.textContent='';
  const best={};BEST_LIST().forEach(e=>{best[e.key]={nom:e.o.n};BFIELDS.forEach(([f])=>best[e.key][f]=e.o[f]);});
  const data={enregistreLe:new Date().toISOString(),bestiaire:best,discretion:STEALTH_BASE,groupes:JSON.parse(JSON.stringify(GROUPES)),
    artefacts:JSON.parse(JSON.stringify(ARTEFACTS)),items:itemsEtat(),generation:Object.assign({},GEN),
    mondes:JSON.parse(JSON.stringify(MONDES)),
    planete:{largeur:W,hauteur:H},robot:G&&G.st?Object.assign({},G.st):null,
    palette:{active:PRESETS[PRESET_ACTIVE].n,palettes:PRESETS.map(p=>({nom:p.n,couleurs:p.c.slice()}))},
    tuiles:Object.assign({},TILE_OV),modules:typeof modulesEtat==='function'?modulesEtat():null};
  try{await DB.doc('reglages/courant').set(data);commitTileBase();try{localStorage.setItem('np-maj',String(Date.parse(data.enregistreLe)));
    }catch(e){}if(!$('viseurs').hidden)drawCurEd();const t=new Date();m.className='saved ok';
    m.textContent=`Réglages enregistrés à ${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}.`;
    if(journal)try{sayMore(m.textContent,'good');render();}catch(e){}}
  catch(e){m.className='saved err';m.textContent=e&&e.code==='invalid_argument'?'Vous n’avez pas le droit d’enregistrer sur cette page.':'Échec de l’enregistrement. Réessayez dans un instant.';}
  if(journal&&/err/.test(m.className))try{sayMore(m.textContent,'warn');render();}catch(e){}
  b.disabled=false;b.textContent='Enregistrer';}
$('saveBtn').onclick=()=>saveSettings();
$('bestSave').onclick=()=>saveSettings($('bestSave'),$('bestMsg'));
$('grSave').onclick=()=>saveSettings($('grSave'),$('grMsg'));
$('lfSave').onclick=()=>saveSettings($('lfSave'),$('lfMsg'));   // même enregistrement, depuis la fenêtre LIFE (21 novembre 2026)
$('bestClose').onclick=closeBest;
$('discClose').onclick=closeDisc;
$('discretion').addEventListener('click',e=>{if(e.target===$('discretion'))closeDisc();});
$('discList').addEventListener('change',e=>{const t=e.target;
  if(t.id==='bf-stealth'){setStealthBase(+t.value||0);turnStealth();side();render();buildDisc();$('bf-stealth').focus();}});
$('discReset').onclick=()=>{setStealthBase(10);turnStealth();side();render();buildDisc();};
$('bestiary').addEventListener('click',e=>{if(e.target===$('bestiary'))closeBest();});
$('bestList').addEventListener('change',e=>{const t=e.target;
  if(!t.dataset||!t.dataset.f)return;const ent=BEST_LIST().find(x=>x.key===t.dataset.k),fd=BFIELDS.find(x=>x[0]===t.dataset.f);
  const v=Math.max(fd[2],Math.min(fd[3],Math.round(+t.value||0)));t.value=v;ent.o[t.dataset.f]=v;
  // PV baissés : seules les créatures de CETTE espèce sur la carte sont ramenées au nouveau maximum (22 novembre 2026 ; avant,
  // toutes les créatures l'étaient — baisser les PV du drone à 6 mettait les broyeurs à 6)
  if(t.dataset.f==='pv'&&G){for(const a of G.animals||[])if(SPECIES[a.sp]===ent.o&&a.hp>v)a.hp=v;
    for(const b of G.beasts||[])if(BEASTS[b.sp]===ent.o&&b.hp>v)b.hp=v;}
  saveBest();});
$('bestReset').onclick=()=>{BEST_LIST().forEach(e=>Object.assign(e.o,BEST_DEF[e.key]));saveBest();buildBest();};
const saveSnd=()=>{try{localStorage.setItem('np-son',JSON.stringify(SND));}catch(e){}};
function toggleSound(){SND.on=!SND.on;saveSnd();say(SND.on?'Son activé.':'Son coupé.','info');if(SND.on){unlock();SFX.spot();}render();}
function toggleVision(){SHOWVIS=!SHOWVIS;say(SHOWVIS?'Portée de discrétion affichée.':'Portée de discrétion masquée.','info');render();}
function toggleFog(){fog=!fog;try{localStorage.setItem('np-fog',fog?'on':'off');
  }catch(e){}say(fog?'Brouillard de guerre activé.':'Brouillard de guerre désactivé.','info');render();}
$('fd-carte').addEventListener('toggle',()=>{if(G)render();});   // la mini-carte se dessine à l'ouverture
// « Stats » (26 novembre 2026) s'ouvre de lui-même la première fois : ces valeurs étaient visibles sans repli avant
['fd-sac','fd-carte','fd-stats','fd-pal','fd-lab','fd-ctrl'].forEach(id=>{const d=$(id);
  try{const v=localStorage.getItem('np-'+id);d.open=v?v==='open':id==='fd-stats';}catch(e){}
  d.addEventListener('toggle',()=>{try{localStorage.setItem('np-'+id,d.open?'open':'closed');}catch(e){}});});
$('restart').onclick=e=>{e.preventDefault();e.stopPropagation();unlock();SFX.start();enJeu(newGame);started=true;
  $('overlay').hidden=true;render();};
/* Plein écran (26 novembre 2026) : le bouton met toute la page en plein écran, ou en sort. Dans l'artefact claude.ai, la page
   est dans un cadre : si le site hôte ne l'autorise pas, le navigateur refuse, et le journal le dit (ouvrir alors l'artefact
   dans un onglet à part, ou passer le navigateur en plein écran avec F11). Le jeu se redimensionne seul (resize). */
{const pb=$('pleinBtn'),dedans=()=>!!(document.fullscreenElement||document.webkitFullscreenElement);
  const maj=()=>{pb.textContent=dedans()?'QUITTER LE PLEIN ÉCRAN':'PLEIN ÉCRAN';};
  pb.addEventListener('click',e=>{e.currentTarget.blur();const d=document,el=d.documentElement;
    if(dedans()){(d.exitFullscreen||d.webkitExitFullscreen).call(d);return;}
    const f=el.requestFullscreen||el.webkitRequestFullscreen;
    const refus=()=>{if(G)say('Plein écran refusé par la page qui contient le jeu : ouvrez-le dans un onglet à part, ou appuyez sur F11.','info');};
    if(!f||!(d.fullscreenEnabled||d.webkitFullscreenEnabled)){refus();return;}
    try{const p=f.call(el);if(p&&p.catch)p.catch(refus);}catch(er){refus();}});
  for(const ev of ['fullscreenchange','webkitfullscreenchange'])document.addEventListener(ev,()=>{maj();setTimeout(()=>{resize();},60);});}

