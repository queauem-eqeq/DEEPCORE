/* ---------- Arme de tir (28 novembre 2026, chantier « Survie », bloc D) ----------
   Voir docs/arbitrage-survie.md (section 4) et docs/conception-joueur.md (« Arme de tir »).
   - La foreuse porte une arme secondaire à projectiles, dans l'emplacement « tir » (14-inventaire) : le canon de base dès le départ,
     remplacé par le lance-flammes, le canon à glu, le shotgun ou le laser quand on les équipe (objets de 14c, fabriqués au FABLAB).
   - Un tir = un coup (DUR.coup), coûte de l'énergie (ITEM_VAL[arme].tcout, × hacks ÉCONOMIE / SURCHARGE), fait le bruit du forage
     (lastAct 'tir', tirMult), provoque les ferrailleuses comme une attaque. Critique et coup par surprise comme au contact.
   - Dégâts : un jet du coup de forage (robotDeg : dés de l'arme de forage, DEG, POW, FORCE) × tdeg % × hacks Tir.
   - Portée : la vue (tport 0) ou tport cases. Murs, portes fermées, roches, machines arrêtent le projectile ; la première créature ou
     balise sur la ligne le prend (sauf le laser, qui traverse tout ce qui vit jusqu'au mur).
   - Visée : touche G, bouton TIR, clic. Cible par défaut : l'ennemi en vue le plus proche ; Tab pour changer, flèches pour déplacer ;
     Entrée, G ou clic pour tirer ; sur tablette, toucher la case puis la toucher de nouveau. Case impossible : viseur rouge barré.
   - Chaque arme a son projectile (fxCouche, 10-rendu : dessin opaque au pixel de tuile, sans alpha) et son son.
   Les créatures portent deux états : o.brule (battements de brûlure, o.bruleDm par battement) et o.glu (battements englués : pas et
   coups × TIR_GLU_X, 08-faune), décomptés par tirTick à chaque battement. */
const TIR_ARMES=['canon','lanceflamme','canonglu','shotgun','laser'];
const tirArme=()=>{const o=(G&&G.inv||[]).find(o=>o.eq&&ITEMS[o.k]&&ITEMS[o.k].slot==='tir');return o?o.k:'canon';};
const tirVal=k=>ITEM_VAL[k||tirArme()]||ITEM_VAL.canon;
const tirPortee=k=>{const v=tirVal(k);return v.tport>0?v.tport:Math.max(1,(G&&G.st&&G.st.capteur)||10);};
const tirEnergie=k=>Math.max(1,Math.round(tirVal(k).tcout*(1+((G.st.tirCout)||0)/100)));
const tirFact=k=>tirVal(k).tdeg/100*Math.max(0,1+((G.st.tirDeg)||0)/100);
// fourchette affichée (à 1-2 cases pour le shotgun) ; loin : à 3 cases
function tirDegs(k,loin){const [a,b]=robotDegs(G.st);let f=tirFact(k);if(loin)f*=(tirVal(k).tloin||100)/100;
  return [Math.max(1,Math.round(a*f)),Math.max(1,Math.round(b*f))];}
const tirPrecision=k=>robotPre()-(tirVal(k).tpre||0)+((G.st.tirPre)||0);
const tirCritCh=()=>(G.st.crit??5)+critBonus()+((G.st.tirCrit)||0);
// bruit d'un tir : celui du forage de base (DIG_MULT, sans SOURDINE), × tbruit (shotgun 150 %), × SILENCE.TIR (jamais sous × 1),
// puis ÷ SIL_DIV avec l'accessoire « Tir silencieux »
function tirMult(k){const v=tirVal(k);let m=Math.max(1,DIG_MULT*(v.tbruit||100)/100*(1+((G&&G.st&&G.st.tirBruit)||0)/100));
  if(G&&G.st&&G.st.silTir>0)m/=SIL_DIV;return m;}

/* ----- Fiche : chiffres lisibles, pas de formule (l'utilisateur trouve les calculs illisibles) ----- */
function tirLignes(d){const k=Object.keys(ITEMS).find(c=>ITEMS[c]===d)||'canon',v=ITEM_VAL[k]||{};if(!G||!G.st)return [];
  const [a,b]=tirDegs(k),L=[`DÉGÂTS : ${a}–${b}`,`ÉNERGIE : ${tirEnergie(k)}`,`PORTÉE : ${v.tport>0?v.tport+' CASES':'VUE'}`];
  if(v.tpre)L.push(`PRÉCISION : −${v.tpre}`);
  if(k==='lanceflamme')L.push(`BRÛLURE : ${v.tbrule} PAR BATTEMENT PENDANT ${v.tbruleBat} BATTEMENTS`);
  if(k==='canonglu')L.push(`ENGLUÉ : ${v.tglu} BATTEMENTS, CADENCE ÷ ${TIR_GLU_X}`);
  if(k==='shotgun'){const [c,e]=tirDegs(k,1);L.push(`À 3 CASES : ${c}–${e}`,'ZONE : LA CIBLE ET LES CASES VOISINES',`BRUIT × ${String(v.tbruit/100).replace('.',',')}`);}
  if(k==='laser')L.push('TRAVERSE LES MOBILES ALIGNÉS');
  return L;}
const tirFicheTxt=d=>tirLignes(d).join(' · ');
const tirFicheHTML=d=>`<span style="color:var(--c1)">${tirLignes(d).join(' · ')}</span>`;

/* ----- Géométrie ----- */
const tirCheb=(x,y)=>Math.max(Math.abs(x-G.px),Math.abs(y-G.py));
const tirDansPortee=(x,y,k)=>{const r=tirPortee(k),dx=x-G.px,dy=y-G.py;return dx*dx+dy*dy<=r*r+r;};
// ce qui arrête un projectile : tout obstacle (sauf le gouffre, qu'il survole), une porte fermée
const tirMur=(x,y)=>{const v=G.t[idx(x,y)];return (blocks(v)&&v!==CHASM)||(v===DOOR&&!porteOuverte(x,y));};
// cases parcourues depuis la foreuse (exclue) jusqu'à la cible, ou au-delà jusqu'à la portée pour le laser ; mur : la case qui l'arrête
function tirTrajet(tx,ty,k){k=k||tirArme();const lz=k==='laser';let L=line(G.px,G.py,tx,ty).slice(1);
  if(lz&&(tx!==G.px||ty!==G.py)){const r=tirPortee(k),dx=tx-G.px,dy=ty-G.py,m=Math.max(Math.abs(dx),Math.abs(dy)),f=(r+2)/m;
    L=L.concat(line(tx,ty,G.px+Math.round(dx*f),G.py+Math.round(dy*f)).slice(1));}
  const out=[];
  for(const [x,y] of L){if(x<0||y<0||x>=W||y>=H||!tirDansPortee(x,y,k))break;
    if(tirMur(x,y))return {cases:out,mur:[x,y]};out.push([x,y]);if(!lz&&x===tx&&y===ty)break;}
  return {cases:out,mur:null};}
// pourquoi on ne peut pas tirer sur cette case (null : on peut). L'énergie se vérifie au moment du tir.
function tirRefus(x,y,k){k=k||tirArme();if(!G||G.over)return 'Impossible de tirer.';
  if(x<0||y<0||x>=W||y>=H)return 'Hors de la carte.';
  if(x===G.px&&y===G.py)return 'Cible : l’unité elle-même. Tir refusé.';
  if(!vis[idx(x,y)])return 'Cible hors de vue : tir impossible.';
  if(!tirDansPortee(x,y,k))return `Cible hors de portée (${k==='canon'||!(tirVal(k).tport>0)?'portée de vue':tirVal(k).tport+' cases'}).`;
  const T=tirTrajet(x,y,k);if(!T.cases.some(([a,b])=>a===x&&b===y))return 'Ligne de tir obstruée.';
  return null;}

/* ----- Visée ----- */
// ennemis (et puces) en vue, du plus proche au plus loin ; ceux qu'on peut toucher d'abord
function tirCibles(){const l=[];for(const b of G.beasts||[])if(vis[idx(b.x,b.y)]&&!beastCache(b))l.push(b);
  for(const a of G.animals||[])if(vis[idx(a.x,a.y)])l.push(a);
  return l.map(o=>({x:o.x,y:o.y,ok:!tirRefus(o.x,o.y),d:Math.hypot(o.x-G.px,o.y-G.py)})).sort((a,b)=>(b.ok-a.ok)||a.d-b.d);}
function tirStart(){if(!G||G.over||PHASE||VISEE||drilling||!$('overlay').hidden)return;
  const k=tirArme(),c=tirEnergie(k);
  if(TRAV)stopTravel('Trajet interrompu.');if(REST)stopRest('Repos interrompu.');if(EXPL)stopExplore('Exploration interrompue.');
  if(G.st.energie<c){say(`Énergie insuffisante pour tirer (${Math.floor(G.st.energie)}/${c}).`,'warn');SFX.blocked();render();return;}
  const l=tirCibles(),[dx,dy]=DEVANT[G.face||'u'],t=l[0]||{x:Math.max(1,Math.min(W-2,G.px+dx)),y:Math.max(1,Math.min(H-2,G.py+dy))};
  TIR={x:t.x,y:t.y};HOV=null;say(`${ITEMS[k].n} : choisissez la cible.`,'warn');render();}
function tirVers(x,y){if(!TIR)return;x=Math.max(0,Math.min(W-1,x));y=Math.max(0,Math.min(H-1,y));if(x!==TIR.x||y!==TIR.y){TIR.x=x;TIR.y=y;render();}}
function tirCycle(d){if(!TIR)return;const l=tirCibles();if(!l.length)return;let i=l.findIndex(c=>c.x===TIR.x&&c.y===TIR.y);
  i=i<0?(d>0?0:l.length-1):(i+d+l.length)%l.length;tirVers(l[i].x,l[i].y);}
function tirStop(m){TIR=null;if(m)say(m);render();}
// valider : refus de géométrie → la visée reste ouverte ; sinon le tir part (ou échoue faute d'énergie) et la visée se ferme
function tirOk(){if(!TIR)return;const {x,y}=TIR,r=tirRefus(x,y);if(r){say(r,'warn');SFX.blocked();render();return;}tirFeu(x,y);}

/* ----- Le tir ----- */
const TIR_NOM={canon:'Canon',lanceflamme:'Lance-flammes',canonglu:'Canon à glu',shotgun:'Shotgun',laser:'Laser'};
const TIR_SON={canon:'tirCanon',lanceflamme:'tirFlamme',canonglu:'tirGlu',shotgun:'tirShot',laser:'tirLaser'};
// un chiffre de dégâts qui apparaît quand le projectile arrive (del ms plus tard)
function tirNum(x,y,txt,col,del,dur){const f={kind:'num',x,y,txt,col,dur:dur||750};addFx(f);f.t0+=del||0;}
// blesse une créature ; true si elle est détruite (butin, journal de bord, RECYCLAGE, mine qui explose)
function tirBlesse(o,dm,cr,del){const isB=(G.beasts||[]).includes(o),sp=isB?BEASTS[o.sp]:SPECIES[o.sp];
  o.hp=(o.hp??pvDe(sp))-dm;if(vis[idx(o.x,o.y)])tirNum(o.x,o.y,'-'+dm+(cr?'!':''),cr?PAL['1']:PAL['3'],del,cr?1000:750);
  if(o.hp>0)return false;
  if(isB){const i=G.beasts.indexOf(o);if(i>=0)G.beasts.splice(i,1);bleed(o.x,o.y);butinMort(o);minePartie(o);}
  else{const i=G.animals.indexOf(o);if(i>=0)G.animals.splice(i,1);bleed(o.x,o.y);if(typeof jnDetruit==='function')jnDetruit(o,0);}
  return true;}
const tirAlerte=(o,isB)=>{if(isB){if(!o.hunt)alerte(o);o.hunt=1;spot(o);}else{if(!o.aware)alerte(o);o.aware=1;o.enraged=true;spot(o);}};
function tirFeu(tx,ty){if(!G||G.over||PHASE)return false;const k=tirArme(),V=tirVal(k),why=tirRefus(tx,ty,k);
  if(why){TIR=null;say(why,'warn');SFX.blocked();render();return false;}
  const cout=tirEnergie(k);
  if(G.st.energie<cout){TIR=null;say(`Énergie insuffisante pour tirer (${Math.floor(G.st.energie)}/${cout}).`,'warn');SFX.blocked();render();return false;}
  TIR=null;HOV=null;G.st.energie-=cout;G.turn++;G.msg=null;engage();camoCasse();lastAct='tir';lastRun=false;
  {const dx=tx-G.px,dy=ty-G.py;G.face=Math.abs(dx)>=Math.abs(dy)?(dx>0?'r':'l'):(dy>0?'d':'u');}
  const T=tirTrajet(tx,ty,k),C=T.cases,occ=(x,y)=>{const b=beastAt(x,y);return (b&&!beastCache(b)?b:null)||animalAt(x,y)||baliseAt(x,y)||null;};
  // qui est touché, et où s'arrête le projectile
  let vict=[],fin=C.length?C[C.length-1]:[tx,ty];
  if(k==='laser'){for(const [x,y] of C){const o=occ(x,y);if(o)vict.push(o);}fin=T.mur||fin;}
  else{let hit=null;for(const [x,y] of C){const o=occ(x,y);if(o){hit=o;fin=[x,y];break;}}
    if(k==='shotgun'){const [fx,fy]=fin;for(const o of [...(G.beasts||[]).filter(b=>!beastCache(b)),...(G.animals||[]),...(G.balises||[])])
        if(Math.max(Math.abs(o.x-fx),Math.abs(o.y-fy))<=1&&!(o.x===G.px&&o.y===G.py)&&vis[idx(o.x,o.y)])vict.push(o);}
    else if(hit)vict.push(hit);}
  const L=Math.max(1,Math.hypot(fin[0]-G.px,fin[1]-G.py)),vol=k==='laser'?0:Math.round(Math.min(320,60+L*28));   // durée du vol (ms)
  const msgs=[];let abat=0;
  for(const o of vict){const d=tirCheb(o.x,o.y),f=tirFact(k)*(k==='shotgun'&&d>=3?(V.tloin||100)/100:1),
      del=k==='laser'?0:Math.round(vol*Math.min(1,Math.hypot(o.x-G.px,o.y-G.py)/L));
    if((G.balises||[]).includes(o)){baliseCoup(o,Math.max(1,Math.round(robotDeg()*f)));continue;}
    const isB=(G.beasts||[]).includes(o),sp=isB?BEASTS[o.sp]:SPECIES[o.sp],sur=isB?!(o.hunt>0)&&!ouvrAlerte(o):!o.aware;
    ouvrAttaque(o);if(isB)o.leurre=0;
    const ch=hitChance(tirPrecision(k),sp.def+terrModDe(sp,o.x,o.y));
    if(!sur&&!roll(ch)){tirAlerte(o,isB);if(vis[idx(o.x,o.y)])tirNum(o.x,o.y,'0','#8aa9a2',del);msgs.push(`${leNom(sp)} esquive (${ch} %)`);continue;}
    const cr=sur||roll(tirCritCh()),dm=Math.max(1,Math.round(robotDeg()*f))*(cr?CRIT_X:1),tag=sur?'par surprise ':cr?'critique ':'';
    if(tirBlesse(o,dm,cr,del)){abat++;msgs.push(`${leNom(sp)} abattu${sp.fem?'e':''} (${tag}−${dm})`);continue;}
    tirAlerte(o,isB);
    if(k==='lanceflamme'&&V.tbruleBat>0){o.brule=Math.max(o.brule||0,V.tbruleBat);o.bruleDm=V.tbrule||3;}
    if(k==='canonglu'&&V.tglu>0)o.glu=Math.max(o.glu||0,V.tglu);
    msgs.push(`${leNom(sp)} ${tag}−${dm} PV (${o.hp}/${pvDe(sp)})${k==='lanceflamme'?', en feu':k==='canonglu'?', englué'+(sp.fem?'e':''):''}`);}
  if(vict.length)addFx({kind:'shake',amp:3,dur:140});
  addFx({kind:'tir',arme:k,ax:G.px,ay:G.py,bx:fin[0],by:fin[1],mur:!!T.mur,cases:k==='laser'?C.slice():null,
    dur:k==='laser'?380:k==='lanceflamme'?480:vol+260,vol,g:Math.random()*1000});
  (SFX[TIR_SON[k]]||SFX.coup)();
  say(`${TIR_NOM[k]} : ${msgs.length?msgs.join(' ; '):T.mur&&!vict.length?'le tir s’écrase sur l’obstacle':'aucune cible touchée'}.`,abat?'good':msgs.length?'warn':'');
  if(window.TIR_STATS){TIR_STATS.tirs++;TIR_STATS.energie+=cout;}
  pass(DUR.coup);computeFOV();render();if(G.over&&G.over.dead)dead();return true;}
// à chaque battement : la brûlure ronge, la glu sèche (appelée par battement, 09)
function tirTick(){if(!G||G.over)return;
  for(const l of [G.beasts,G.animals])for(const o of [...(l||[])]){if(o.glu>0)o.glu--;
    if(o.brule>0){o.brule--;const vu=vis[idx(o.x,o.y)],sp=(G.beasts||[]).includes(o)?BEASTS[o.sp]:SPECIES[o.sp];
      if(vu)addFx({kind:'braise',x:o.x,y:o.y,dur:600,g:Math.random()*100});
      if(tirBlesse(o,o.bruleDm||3,false,0)&&vu)sayMore(`${LeNom(sp)} se consume.`,'good');}}}
// fiche de survol d'une créature : chance de toucher au tir et états (12-souris)
function tirChanceTxt(o,sp,x,y){if(!G||!G.st)return '';const k=tirArme(),ch=hitChance(tirPrecision(k),sp.def+terrModDe(sp,x,y)),r=tirRefus(x,y,k);
  const et=[o.brule>0?`<span style="color:var(--life)">En feu ${o.brule}</span>`:'',o.glu>0?`<span style="color:var(--c2)">Englué ${o.glu}</span>`:''].filter(Boolean);
  return `<p>Tir (${TIR_NOM[k].toLowerCase()}) <b style="color:${r?'var(--dim)':chanceCol(ch)}">${r?'hors d’atteinte':ch+' %'}</b>${et.length?' · '+et.join(' · '):''}</p>`;}

/* ----- Dessin ----- */
let TIR_CUR=null,TIR_CUR_K='';
// viseur : le viseur habituel couleur accent ; case impossible : le viseur rouge barré du phaseur. Pointillé du trajet, opaque.
function tirDessin(){if(!TIR||!G)return;const r=rowsOf('cursor'),cle=r.join('')+PAL['1'];
  if(!TIR_CUR||TIR_CUR_K!==cle){TIR_CUR=phaseCurseur(r,PAL['1'],0);TIR_CUR_K=cle;}
  const ok=!tirRefus(TIR.x,TIR.y);ctx.globalAlpha=1;
  if(ok){const T=tirTrajet(TIR.x,TIR.y);for(const [x,y] of T.cases)if(!(x===TIR.x&&y===TIR.y))ctx.drawImage(PATH_DOT,(x-camX)*S,(y-camY)*S,S,S);}
  ctx.drawImage(ok?TIR_CUR:CURT_PHX,(TIR.x-camX)*S,(TIR.y-camY)*S,S,S);}
// projectiles (appelé par fxCouche, 10-rendu) : u = un pixel de tuile ; tout est opaque et calé sur la grille
function tirFx(u){for(const f of FX){if(f.kind==='braise'){const p=fxP(f),bx=Math.round((f.x-camX)*16),by=Math.round((f.y-camY)*16);
      for(let n=0;n<4;n++){const h=Math.abs(Math.sin(f.g+n*7.1)),x=bx+3+Math.floor(h*10),y=by+12-Math.floor(p*10)-n%2*2;
        ctx.fillStyle=n%2?PAL['1']:PAL['4'];ctx.fillRect(x*u,y*u,u,u);ctx.fillRect(x*u,(y+1)*u,u,u);}continue;}
    if(f.kind!=='tir')continue;
    const p=fxP(f),ms=p*f.dur,ax=(f.ax+.5-camX)*16,ay=(f.ay+.5-camY)*16,bx=(f.bx+.5-camX)*16,by=(f.by+.5-camY)*16,
      dx=bx-ax,dy=by-ay,L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L,q=f.vol?Math.min(1,ms/f.vol):1,
      px=(x,y,c,w,h)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x)*u,Math.round(y)*u,(w||1)*u,(h||1)*u);},
      hh=n=>{const v=Math.sin(n*12.9898+f.g*78.233)*43758.5453;return v-Math.floor(v);},ph=reduced?0:Math.floor(ms/40);
    if(f.arme==='canon'){   // obus : un carré blanc de 2 pixels, une traînée accent de 3 pixels ; à l'impact, quatre éclats qui s'écartent
      if(q<1){const hx=ax+dx*q,hy=ay+dy*q;for(let t=2;t<=7;t++)px(hx-ux*t,hy-uy*t,t<5?PAL['1']:PAL['4']);px(hx-1,hy-1,'#ffffff',3,3);px(hx,hy,PAL['1']);}
      else{const e=Math.min(1,(ms-f.vol)/260),r=1+Math.round(e*4);for(const [sx,sy] of [[1,1],[1,-1],[-1,1],[-1,-1]])px(bx+sx*r,by+sy*r,e<.5?'#ffffff':PAL['1']);
        if(e<.4)px(bx-1,by-1,'#ffffff',2,2);}}
    else if(f.arme==='lanceflamme'){   // langue de feu : le cône s'étend jusqu'à la cible puis se retire depuis la buse ; pixels qui crépitent
      const t1=Math.min(1,p/.45),t0=p<.6?0:(p-.6)/.4;
      for(let s=t0*L;s<=t1*L;s+=1.5){const k=s/L,w=1+k*3,o=(hh(Math.floor(s)+ph*13)-.5)*2*w;
        px(ax+ux*s-uy*o,ay+uy*s+ux*o,k<.25?'#ffffff':k<.6?PAL['1']:PAL['4']);
        if(hh(s*3+ph)<.5)px(ax+ux*s+uy*o*.5,ay+uy*s-ux*o*.5,PAL['4']);}}
    else if(f.arme==='canonglu'){   // boule de polymère bio (5 pixels en croix, reflet blanc) en cloche ; à l'arrivée, huit gouttes projetées
      if(q<1){const hx=ax+dx*q,hy=ay+dy*q-Math.sin(q*Math.PI)*Math.min(8,L/4);
        for(let b=-2;b<=2;b++)for(let a=-2;a<=2;a++)if(Math.abs(a)+Math.abs(b)<=3)px(hx+a,hy+b,PAL['2']);px(hx-1,hy-1,'#ffffff');px(hx,hy+3,PAL['2']);}
      else{const e=Math.min(1,(ms-f.vol)/260);for(let n=0;n<8;n++){const a=n/8*Math.PI*2,r=1+e*(3+hh(n)*3);px(bx+Math.cos(a)*r,by+Math.sin(a)*r+e*2,PAL['2']);}
        if(e<.6)px(bx-1,by-1,PAL['2'],3,3);}}
    else if(f.arme==='shotgun'){   // gerbe : cinq plombs qui s'écartent, puis cinq bouffées grises qui retombent
      for(let n=0;n<5;n++){const a=Math.atan2(dy,dx)+(n-2)*.13,R=Math.min(q,1)*L*(.9+hh(n)*.2),hx=ax+Math.cos(a)*R,hy=ay+Math.sin(a)*R;
        if(q<1){px(hx,hy,'#ffffff',2,2);px(hx-Math.cos(a)*2,hy-Math.sin(a)*2,PAL['1']);px(hx-Math.cos(a)*3,hy-Math.sin(a)*3,PAL['1']);}
        else{const e=Math.min(1,(ms-f.vol)/260);if(e<.8)px(hx+(hh(n+9)-.5)*4,hy-e*3,e<.4?'#ffffff':'#8aa9a2',e<.4?2:1,e<.4?2:1);}}}
    else if(f.arme==='laser'){   // faisceau d'un seul tenant : cœur blanc, deux liserés couleur monde qui s'éteignent, puis le cœur seul
      const ex=f.mur?bx-ux*8:bx,ey=f.mur?by-uy*8:by,M=Math.hypot(ex-ax,ey-ay),nx=-uy,ny=ux;
      if(p<.85)for(let s=5;s<=M;s+=.7){const x=ax+ux*s,y=ay+uy*s;px(x,y,'#ffffff');
        if(p<.5){px(x+nx,y+ny,PAL['3']);px(x-nx,y-ny,PAL['3']);}}
      if(p<.6){px(ex-1,ey,'#ffffff',3,1);px(ex,ey-1,'#ffffff',1,3);}}}}
// colonne : ligne de l'arme de tir sous les boutons, bouton TIR allumé pendant la visée
function tirSide(){const el=$('tirInfo');if(!el||!G||!G.st||!G.inv)return;const k=tirArme(),v=tirVal(k),[a,b]=tirDegs(k),c=tirEnergie(k);
  const t=`${ITEMS[k].n.toUpperCase()} · DÉG ${a}–${b} · ÉNER ${c} · ${v.tport>0?'PORTÉE '+v.tport:'PORTÉE VUE'}`;
  if(el.textContent!==t)el.textContent=t;el.classList.toggle('bas',G.st.energie<c);
  const bt=$('tirBtn');if(bt)bt.classList.toggle('on',!!TIR);}
{const s0=side;side=function(){s0();tirSide();};}
if($('tirBtn'))$('tirBtn').onclick=()=>{$('tirBtn').blur();if(!$('overlay').hidden)return;if(TIR)tirOk();else tirStart();};

/* ----- Sons : un par arme, jamais partagés ----- */
Object.assign(SFX,{
  tirCanon(){tone(110,.14,'square',.12,42);noiz(.09,.28,2600,'bandpass',0,500);noiz(.05,.12,6000,'highpass',.01);},
  tirFlamme(){souffle(.5,.16,500,2600,.06);noiz(.45,.1,900,'lowpass',0,260);tone(70,.4,'sawtooth',.03,55);},
  tirGlu(){tone(320,.16,'sine',.09,85);noiz(.14,.14,700,'lowpass',0,180);tone(160,.08,'square',.04,60,.16);},
  tirShot(){noiz(.3,.42,1800,'lowpass',0,220);tone(62,.22,'square',.13,34);noiz(.07,.22,5200,'highpass');},
  tirLaser(){tone(1900,.28,'sine',.07,2500);tone(950,.28,'triangle',.045,1250);noiz(.2,.04,7000,'highpass',.02);}});

/* ----- Tuiles au sol (16 × 16 ; éditables dans le Tile editor, groupe « Objets au sol ») ----- */
Object.assign(PAT,{
  o_canon:["................","................","................","................","....00000.......","...0333330......","..0333333300000.","..03111111355550","..03222222355550","..0333333300000.","...0333330......","....03030.......",".....0.0........","................","................","................"],
  o_lanceflamme:["................","................","................","................","...000..........","..03330000000.r.","..032223333330r1","..032223111113r1","..032223333330r.","..03330000000...","...030..........","....0...........","................","................","................","................"],
  o_canonglu:["................","................","................","................","...0000000......","..033333330.....","..032222230000..","..032111233330.2","..032222230000222","..033333330...2.","...0300000......","....0...........","................","................","................","................"].map(l=>l.slice(0,16)),
  o_shotgun:["................","................","................","................","................",".00000000000....","0333333333330.w.","03111111111w0..1","03222222223330w.",".000330000000...","...0330.........","....00..........","................","................","................","................"],
  o_laser:["................","................","................","....00000.......","...0333330......","..033111330.....","0003322223000000","55532wwww13wwwww","0003322223000000","..033111330.....","...0333330......","....00000.......","................","................","................","................"],
  o_silforage:["................","................","...000000000....","...033333330....","...032222230....","...032000230....","...032111230....","...032010230....","...032222230....","...033333330....","...000333000....",".....03030......","......0.0.......","................","................","................"],
  o_siltir:["................","................","................","................","................","..00000000000...","..03333333330...","550322222223055.","..03333333330...","..00000000000...","...0.0.0.0.0....","................","................","................","................","................"]});
{const g=TILE_LIST.find(e=>e[0]==='Objets au sol');if(g)g[1].push(['o_canon','Canon'],['o_lanceflamme','Lance-flammes'],['o_canonglu','Canon à glu'],
  ['o_shotgun','Shotgun'],['o_laser','Laser'],['o_silforage','Forage silencieux'],['o_siltir','Tir silencieux']);}
