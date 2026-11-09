/* ---------- Vision ---------- */
const opaque=(x,y)=>{const v=G.t[idx(x,y)];return v===MOUNT||v===GRASS;};
function line(x0,y0,x1,y1){const p=[];let dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1,e=dx+dy;
  for(;;){p.push([x0,y0]);if(x0===x1&&y0===y1)break;const e2=2*e;if(e2>=dy){e+=dy;x0+=sx;}if(e2<=dx){e+=dx;y0+=sy;}}return p;}
function los(x0,y0,x1,y1){const p=line(x0,y0,x1,y1);for(let i=1;i<p.length-1;i++)if(opaque(p[i][0],p[i][1]))return false;return true;}
// Capteur de la foreuse (elle seule) : la case juste derrière un obstacle à la vue (montagne, herbes hautes) est aperçue
// en mode souvenir — terrain affiché assombri, sans les créatures. Les ennemis, eux, ne voient pas à travers.
function peekBehind(x0,y0,x1,y1){const p=line(x0,y0,x1,y1),n=p.length;if(n<3)return false;
  for(let i=1;i<n-2;i++)if(opaque(p[i][0],p[i][1]))return false;return opaque(p[n-2][0],p[n-2][1]);}
function computeFOV(){vis=new Uint8Array(W*H);const r=G.st.capteur,px=G.px,py=G.py;
  for(let y=py-r;y<=py+r;y++)for(let x=px-r;x<=px+r;x++){if(x<0||y<0||x>=W||y>=H)continue;if((x-px)**2+(y-py)**2>r*r+r)continue;
    if(los(px,py,x,y)){vis[idx(x,y)]=1;G.seen[idx(x,y)]=1;}else if(peekBehind(px,py,x,y))G.seen[idx(x,y)]=1;}
  if(G.animals)for(const a of G.animals)if(vis[idx(a.x,a.y)]&&!G.fauna.includes(a.sp)){G.fauna.push(a.sp);const sp=SPECIES[a.sp];
    sayMore(`Nouvelle espèce observée : ${sp.n} (vitesse ${sp.v}, détection ${sp.d}).`,'info');SFX.chirp();}
  if(G.beasts){if(typeof G.beastSeen!=='object'||!G.beastSeen)G.beastSeen={};for(const b of G.beasts){if(G.beastSeen[b.sp]||!vis[idx(b.x,b.y)])continue;G.beastSeen[b.sp]=true;const sp=BEASTS[b.sp];
    sayMore(`Ennemi repéré : ${sp.n} (vitesse ${sp.v}, détection ${sp.d}, ${sp.pv} PV).`,'warn');SFX.roar();}}
  for(const s of G.sites)if(vis[idx(s.x,s.y)]&&!s.seen){s.seen=true;SFX.spot();say(`Site ${s.id} repéré.`,'info');}
}

/* ---------- Déplacement ---------- */
const siteAt=(x,y)=>G.sites.find(s=>s.x===x&&s.y===y);
function drift(){
  if(G.t[idx(G.px,G.py)]!==DEEP)return;
  const k=rnd(0,7),[dx,dy]=DIRS[k],nx=G.px+dx,ny=G.py+dy,v=G.t[idx(nx,ny)];
  if(v===ROCK||v===MOUNT||v===CHASM||beastAt(nx,ny)||animalAt(nx,ny)){SFX.thud();sayMore(`Le courant plaque le robot contre un obstacle (${DIRN[k]}).`,'warn');return;}
  G.px=nx;G.py=ny;G.lastDir=null;if(v===GRASS)G.t[idx(nx,ny)]=FLAT;
  SFX.drift();sayMore(`Eau profonde : le courant entraîne le robot vers ${['l’est','l’ouest','le sud','le nord','le sud-est','le nord-est','le sud-ouest','le nord-ouest'][k]}.`,'warn');
}
function tryMove(dx,dy){
  if(G.over||drilling)return;const nx=G.px+dx,ny=G.py+dy;if(nx<0||ny<0||nx>=W||ny>=H)return;
  const v=G.t[idx(nx,ny)];
  G.face=dx>0?'r':dx<0?'l':dy>0?'d':'u';
  const bz=beastAt(nx,ny);
  if(bz){if(!spend())return;const sp=BEASTS[bz.sp];G.turn++;G.msg=null;
    {const ch=hitChance(G.st.pre,sp.esq+terrMod(nx,ny));if(!roll(ch)){bz.hunt=8;addFx({kind:'lunge',robot:true,dx,dy,dur:180});addFx({kind:'num',x:nx,y:ny,txt:'raté',col:'#8aa9a2',dur:750});
      say(`La foreuse rate le ${sp.n.toLowerCase()} (${ch} %).`);SFX.whoosh();drift();animalsAct();beastsAct();regen();computeFOV();render();if(G.over&&G.over.dead)dead();return;}}
    const dm=G.st.degats;bz.hp-=dm;bz.hunt=8;addFx({kind:'num',x:nx,y:ny,txt:'-'+dm,col:PAL['3'],dur:750});
    addFx({kind:'lunge',robot:true,dx,dy,dur:180});addFx({kind:'flash',beast:bz,dur:180});if(bz.hp<=0)addFx({kind:'shake',amp:4,dur:200});
    if(bz.hp<=0){G.beasts.splice(G.beasts.indexOf(bz),1);bleed(bz.x,bz.y);say(`La foreuse abat le ${sp.n.toLowerCase()}.`,'good');SFX.break();}
    else{say(`La foreuse percute le ${sp.n.toLowerCase()} : −${dm} PV (${bz.hp}/${sp.pv}).`,'warn');SFX.crack();}
    drift();animalsAct();beastsAct();regen();computeFOV();render();if(G.over&&G.over.dead)dead();return;}
  const an=animalAt(nx,ny);
  if(an){if(!spend())return;const sp=SPECIES[an.sp];G.turn++;G.msg=null;
    {const ch=hitChance(G.st.pre,sp.esq+terrMod(nx,ny));if(!roll(ch)){an.aware=10;addFx({kind:'lunge',robot:true,dx,dy,dur:180});addFx({kind:'num',x:nx,y:ny,txt:'raté',col:'#8aa9a2',dur:750});
      say(`La foreuse rate l’${sp.n.toLowerCase()} (${ch} %).`);SFX.whoosh();drift();animalsAct();beastsAct();regen();computeFOV();render();if(G.over&&G.over.dead)dead();return;}}
    an.hp=(an.hp??sp.pv)-G.st.degats;addFx({kind:'num',x:nx,y:ny,txt:'-'+G.st.degats,col:PAL['3'],dur:750});addFx({kind:'lunge',robot:true,dx,dy,dur:180});
    if(an.hp<=0){G.animals.splice(G.animals.indexOf(an),1);bleed(an.x,an.y);say(`La foreuse écrase l’${sp.n.toLowerCase()}.`,'warn');SFX.squish();}
    else{an.aware=10;say(`La foreuse heurte l’${sp.n.toLowerCase()}.`);SFX.crack();}
   drift();animalsAct();beastsAct();regen();computeFOV();render();if(G.over&&G.over.dead)dead();return;}
  if(v===CHASM){say('Gouffre : passage impossible.');SFX.blocked();render();return;}
  if(v===SHIP){say('Coque du vaisseau : indestructible.');SFX.blocked();render();return;}
  if(v===ROCK||v===MOUNT){
    if(nx===0||ny===0||nx===W-1||ny===H-1){say('Bord de la carte : roche impossible à briser.');SFX.blocked();render();return;}
    if(!spend())return;
    const i=idx(nx,ny),hp=2;G.dmg=G.dmg||{};const hits=(G.dmg[i]||0)+1;G.turn++;G.msg=null;
    {const brk=hits>=hp;addFx({kind:'lunge',robot:true,dx,dy,dur:180});}
    if(hits>=hp){delete G.dmg[i];G.t[i]=RUBBLE;SFX.break();say(v===ROCK?'Rocher brisé : il ne reste que des gravats.':'La paroi cède : passage ouvert.','good');
      if(G.gems&&G.gems[i]==='cache'){G.gems[i]='visible';sayMore('Un joyau brille dans les gravats !','info');SFX.spot();}
      if(G.ore&&G.ore[i]==='roche'){G.ore[i]='sol';sayMore('Des éclats de métal tombent au sol.','info');}}
    else{G.dmg[i]=hits;SFX.crack();say(v===ROCK?'La foreuse frappe le rocher : il se fissure.':`La foreuse attaque la montagne : fissure ${hits}/${hp-1}.`,'warn');}
    drift();animalsAct();beastsAct();regen();computeFOV();render();if(G.over&&G.over.dead)dead();return;}
  {const oi=idx(G.px,G.py),ov=G.t[oi],dk=DIRS.findIndex(d=>d[0]===dx&&d[1]===dy);
    if(ov!==LIQ&&ov!==DEEP&&ov!==BRIDGE&&ov!==DECK){G.tracks=G.tracks||{};G.tracks[oi]={t:G.turn+1,i:G.lastDir??dk,o:dk};}G.lastDir=dk;}
  const doorway=(G.t[idx(G.px,G.py)]===DECK)!==(v===DECK);   // passage de la porte du vaisseau
  G.px=nx;G.py=ny;G.turn++;G.dist++;G.msg=null;
  if(v===GRASS){G.t[idx(nx,ny)]=FLAT;SFX.grass();}else if(v===LOW)SFX.grass();
  if(v===LIQ)SFX.water();else if(v===DEEP)SFX.deep();else SFX.step();
  if(doorway){SFX.door();say(v===DECK?'La porte du vaisseau s’ouvre : la foreuse rentre dans la soute.':'La porte du vaisseau s’ouvre : la foreuse sort.','info');}
  drift();animalsAct();beastsAct();regen();
  {const oi=idx(G.px,G.py);if(G.ore&&G.ore[oi]==='sol'){delete G.ore[oi];const av=G.st.vie;G.st.vie=Math.min(G.st.vieMax,G.st.vie+ORE_PV);
    sayMore(`Éclats de métal récupérés : +${G.st.vie-av} PV.`,'good');SFX.spot();}}
  {const gi=idx(G.px,G.py);if(G.gems&&G.gems[gi]==='visible'){delete G.gems[gi];computeFOV();render();SFX.analyse();chooseUpgrade();return;}}
  const s=siteAt(G.px,G.py);
  if(s){if(!s.known)SFX.analyse();s.known=true;say(`Site ${s.id} : profondeur ${s.depth} niveau${s.depth>1?'x':''}. [F] pour forer.`,'good');}
  computeFOV();render();if(G.over&&G.over.dead)dead();
}

/* ---------- Forage ---------- */
function waitTurn(){
  if(G.over||drilling||!$('overlay').hidden)return;G.turn++;G.msg=null;say('Le robot attend.');
  drift();animalsAct();beastsAct();regen();computeFOV();render();if(G.over&&G.over.dead)dead();
}
function askDrill(){
  if(G.over||drilling||!$('overlay').hidden)return;const s=siteAt(G.px,G.py);if(!s)return;
  const known=G.sites.filter(x=>x.known).length;
  $('card').innerHTML=`<div class="tag">Confirmation de forage</div><h2>SITE ${s.id}</h2>
    <p>Profondeur estimée : <b style="color:var(--c3)">${s.depth} niveau${s.depth>1?'x':''}</b>. Une fois le forage lancé, le robot descend et ne peut plus revenir à la surface.</p>
    <p class="stats"><span>${known} site${known>1?'s':''} analysé${known>1?'s':''} sur ${NSITES}</span></p>
    <div class="row"><button class="go" id="yes">Lancer le forage</button><button id="no">Continuer l’exploration</button></div>`;
  $('overlay').hidden=false;$('yes').onclick=()=>drill(s);$('no').onclick=()=>{$('overlay').hidden=true;};$('yes').focus();
}
function drill(s){drilling=true;let k=0;const n=12;
  const step=()=>{$('card').innerHTML=`<div class="tag">Forage en cours · site ${s.id}</div><h2>DESCENTE</h2><p class="prog">${'▮'.repeat(k)}${'·'.repeat(n-k)}</p>`;
    if(k<n){SFX.drill(k);k++;setTimeout(step,reduced?0:110);}else{SFX.done();end(s);}};step();}
function dead(){
  $('card').innerHTML=`<div class="tag">Signal perdu</div><h2>FOREUSE<br>DÉTRUITE</h2>
    <div class="stats"><span>${G.turn} tours · ${G.dist} cases parcourues</span></div>
    <p>Les prédateurs ont eu raison de la foreuse. Une nouvelle planète vous attend.</p>
    <button class="go" id="again">Nouvelle planète</button>`;
  $('overlay').hidden=false;$('again').onclick=()=>{unlock();SFX.start();newGame();$('overlay').hidden=true;render();};$('again').focus();
}
function end(s){
  drilling=false;G.over={site:s.id};const known=G.sites.filter(x=>x.known).length;
  $('card').innerHTML=`<div class="tag">Niveau 1 terminé</div><h2>ENTRÉE<br>NIVEAU 2</h2>
    <div class="stats"><span>Site foré : ${s.id} · profondeur ${s.depth} niveau${s.depth>1?'x':''}</span><span>Sites analysés : ${known}/${NSITES}</span><span>${G.turn} tours · ${G.dist} cases parcourues</span></div>
    <p>Le niveau 2 (sous-sol) reste à concevoir. En attendant, vous pouvez explorer une nouvelle planète.</p>
    <button class="go" id="again">Nouvelle planète</button>`;
  $('overlay').hidden=false;$('again').onclick=()=>{newGame();$('overlay').hidden=true;render();};$('again').focus();
}

