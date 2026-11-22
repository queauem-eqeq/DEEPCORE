/* ---------- Bâtiments ----------
   18 novembre 2026 : les tuiles (mur, sol, porte, pilier). 19 novembre 2026 : le générateur, par accrétion (idée de Brogue,
   code écrit ici) — on pose une pièce, puis on en colle d'autres contre ses murs, une porte à chaque jonction. Voir
   docs/conception.md, « Bâtiments ». Réglage : GEN.structure (menu MONDE), part de la carte occupée par les structures. */
// dessin d'une case bâtie ; put(tuile, opacité) vient du rendu de la partie ou de celui de l'intro
function batiTuile(t,x,y,put){
  if(t===LOCK){put(TL.floor,.5);put(TL.lock,1);return;}
  if(t===WALL||t===SECRET){const b=y<H-1?G.t[idx(x,y+1)]:WALL;put(b===WALL||b===SECRET?TL.wall:TL.wallFace,.95);{const nc=G.niche&&G.niche[idx(x,y)];if(nc)put(nc===2?TL.nicheOuverte:TL.niche,1);}return;}
  put(TL.floor,.5);
  if(t===PILLAR)put(TL.pillar,.95);
  else if(t===MACHINE)put(TL['mach'+((G.art&&G.art[idx(x,y)])||0)],1);
  else if(t===ANTENNA)put(G.art&&G.art[idx(x,y)]===1?TL.antenneOn:TL.antenne,1);
  else if(t===TERMINAL)put(TL.terminal,1);
  else if(t===FLOOR){if(G.soc&&G.soc[idx(x,y)]!=null)put(TL.socle,1);}
  else if(machTuile(t))machTuileRendu(t,x,y,put);
  else if(t===DOOR){const cote=y>0&&y<H-1&&G.t[idx(x,y-1)]===WALL&&G.t[idx(x,y+1)]===WALL;   // porte percée dans un mur vertical
    put(porteOuverte(x,y)?(cote?TL.doorOpenV:TL.doorOpen):TL.door,1);}
}
// 20 novembre 2026 : plus de pièce de moins de 3 cases de large (rectangles d'au moins 4 × 4, halls de 3 ou 4 de large,
// branches des L et des croix d'au moins 3) — l'utilisateur trouvait certaines pièces trop étroites. Les cavernes restent irrégulières.
const STYLES={
  avant:{n:'avant-poste',rw:[4,6],rh:[4,5],cor:.25,pil:.1,gou:.12,cav:0,bou:26},
  hangar:{n:'hangar',rw:[6,12],rh:[5,9],cor:.15,pil:.7,gou:.25,cav:0,bou:18},
  forage:{n:'complexe de forage',rw:[4,9],rh:[4,7],cor:.45,pil:.25,gou:.5,cav:.05,bou:12},
  ruine:{n:'ruine',rw:[4,10],rh:[4,8],cor:.2,pil:.15,gou:.35,cav:.6,bou:16}};
const D4=[[1,0],[-1,0],[0,1],[0,-1]];
// une forme de pièce : liste de cases [x,y] (origine quelconque) et son genre
function formePiece(st){
  const w=rnd(st.rw[0],st.rw[1]),h=rnd(st.rh[0],st.rh[1]),r=Math.random(),c=[];
  const rect=(x0,y0,a,b)=>{for(let y=y0;y<y0+b;y++)for(let x=x0;x<x0+a;x++)if(!c.some(q=>q[0]===x&&q[1]===y))c.push([x,y]);};
  if(r<st.cav&&w>=5&&h>=4){const b=caBlob(w+2,h+2,.58,4);if(b.length>=12)return {c:b,g:'caverne'};}
  if(r<st.cav+.14&&w>=6&&h>=6){const cw=rnd(2,w-3),ch=rnd(2,h-3),coin=rnd(0,3);rect(0,0,w,h);   // L : un rectangle amputé d'un coin
    return {c:c.filter(([x,y])=>!((coin&1?x>=w-cw:x<cw)&&(coin&2?y>=h-ch:y<ch))),g:'L'};}
  if(r<st.cav+.26&&w>=5&&h>=5){const a=rnd(1,Math.max(1,Math.floor((h-3)/2))),b=rnd(1,Math.max(1,Math.floor((w-3)/2)));rect(0,a,w,h-2*a);rect(b,0,w-2*b,h);return {c,g:'croix'};}
  if(r<st.cav+.38&&w>=5&&h>=5){const cx=(w-1)/2,cy=(h-1)/2;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(((x-cx)/(w/2))**2+((y-cy)/(h/2))**2<=1.05)c.push([x,y]);return {c,g:'ronde'};}
  if(r<st.cav+.48){const l=rnd(8,14),e=rnd(3,4);Math.random()<.5?rect(0,0,l,e):rect(0,0,e,l);return {c,g:'hall'};}
  rect(0,0,w,h);return {c,g:'rect'};
}
// Une structure dans le lot [lx0..lx1] × [ly0..ly1] ; écrit dans own (numéro de pièce + 1), porte, pied (emprise : sols et murs).
function accretion(B,lot,cible,st,dep){   // dep (cavernes) : cadre où tirer la première pièce, le lot étant toute la carte
  const {own,porte,pied,interdit}=B,[lx0,ly0,lx1,ly1]=lot,pieces=[],base=B.pieces.length;
  const dans=(x,y)=>x>=lx0&&y>=ly0&&x<=lx1&&y<=ly1,vide=(x,y)=>{const i=idx(x,y);return dans(x,y)&&!interdit[i]&&!own[i]&&!porte[i];};
  let emprise=0;
  const pose=(cells,g)=>{const id=base+pieces.length+1,p={id,g,c:[]};
    for(const [x,y] of cells){const i=idx(x,y);own[i]=id;p.c.push(i);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const j=idx(x+dx,y+dy);if(!pied[j]){pied[j]=1;emprise++;}}}
    pieces.push(p);B.pieces.push(p);return p;};
  const tient=(cells,sauf)=>cells.every(([x,y])=>{if(!vide(x,y))return false;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const a=x+dx,b=y+dy,j=idx(a,b);
      if(a<1||b<1||a>=W-1||b>=H-1||interdit[j]||own[j]||(porte[j]&&j!==sauf))return false;}return true;});
  // première pièce, vers le milieu du lot
  for(let k=0;k<200&&!pieces.length;k++){const f=formePiece(st),ox=dep?rnd(dep[0],dep[2]):rnd(lx0+1,Math.max(lx0+1,lx1-12)),oy=dep?rnd(dep[1],dep[3]):rnd(ly0+1,Math.max(ly0+1,ly1-9)),cells=f.c.map(([x,y])=>[x+ox,y+oy]);
    if(tient(cells,-1))pose(cells,f.g);}
  if(!pieces.length)return null;
  const maxP=st.np||(!st.libre&&GEN.sPieces>0?GEN.sPieces:1e9),plaf=st.np?cible*1.35:cible;let nP=1;   // st.np (cavernes) : nombre de pièces visé, la surface peut déborder d'un tiers pour l'atteindre
  for(let k=0,kmax=Math.max(800,cible*(st.np?16:8));k<kmax&&emprise<plaf&&nP<maxP;k++){
    const p=pieces[rnd(0,pieces.length-1)],fi=p.c[rnd(0,p.c.length-1)],fx=fi%W,fy=(fi/W)|0,[dx,dy]=D4[rnd(0,3)],cx=fx+dx,cy=fy+dy,ci=idx(cx,cy);
    if(!vide(cx,cy)||!vide(cx+dy,cy+dx)||!vide(cx-dy,cy-dx))continue;   // la porte veut un mur de chaque côté
    const f=formePiece(st),bord=f.c.filter(([x,y])=>!f.c.some(q=>q[0]===x-dx&&q[1]===y-dy)),[ex,ey]=bord[rnd(0,bord.length-1)];
    const L=p.g!=='couloir'&&Math.random()<st.cor?(Math.random()<.25?rnd(7,14):rnd(2,5)):0;
    const cou=[];for(let j=1;j<=L;j++)cou.push([cx+dx*j,cy+dy*j]);
    const ox=cx+dx*(L+1)-ex,oy=cy+dy*(L+1)-ey,cells=f.c.map(([x,y])=>[x+ox,y+oy]);
    if(!tient(cou.concat(cells),ci))continue;
    porte[ci]=1;if(!pied[ci]){pied[ci]=1;emprise++;}
    if(L)pose(cou,'couloir');
    pose(cells,f.g);nP++;}
  return {pieces,emprise,st};
}
// Distance de marche dans les structures (sols et portes), bornée ; Infinity au-delà
function distBati(B,a,b,max){const d=new Map([[a,0]]),q=[a];
  for(let k=0;k<q.length;k++){const c=q[k],dc=d.get(c);if(c===b)return dc;if(dc>=max)continue;const x=c%W,y=(c/W)|0;
    for(const [dx,dy] of D4){const j=idx(x+dx,y+dy);if((B.own[j]||B.porte[j])&&!d.has(j)){d.set(j,dc+1);q.push(j);}}}
  return Infinity;}
// Boucles et longs couloirs : depuis un sol, on tire tout droit à travers le mur ; si l'on retombe sur un autre sol et que le
// détour à pied est long, on perce (une porte si le mur fait une case, sinon un couloir avec une porte à chaque bout).
function boucles(B,S){const {own,porte,interdit,pied}=B,cand=[],miens=new Set(S.pieces.map(p=>p.id));   // miens : jamais de couloir vers l'autre structure
  const mur=(x,y)=>{const i=idx(x,y);return x>1&&y>1&&x<W-2&&y<H-2&&!own[i]&&!porte[i]&&!interdit[i];};
  for(const p of S.pieces)for(const fi of p.c){const fx=fi%W,fy=(fi/W)|0;
    for(const [dx,dy] of D4){let m=0;while(m<20&&mur(fx+dx*(m+1),fy+dy*(m+1)))m++;
      if(m<1||m===2||m>=20)continue;const g=idx(fx+dx*(m+1),fy+dy*(m+1));if(!own[g]||own[g]===own[fi]||!miens.has(own[g]))continue;cand.push([fi,dx,dy,m,g]);}}
  cand.sort(()=>Math.random()-.5);let longs=0;const maxLongs=1+Math.floor(S.pieces.length/7);
  for(const [fi,dx,dy,m,g] of cand){const fx=fi%W,fy=(fi/W)|0;let ok=true;
    if(m>1&&longs>=maxLongs)continue;
    for(let j=1;j<=m&&ok;j++){const x=fx+dx*j,y=fy+dy*j;if(!mur(x,y)||own[idx(x+dy,y+dx)]||own[idx(x-dy,y-dx)]||porte[idx(x+dy,y+dx)]||porte[idx(x-dy,y-dx)])ok=false;}
    if(!ok)continue;const seuil=Math.max(S.st.bou,3*m);if(distBati(B,fi,g,seuil)<=seuil)continue;
    if(m===1)porte[idx(fx+dx,fy+dy)]=1;
    else{const id=B.pieces.length+1,p={id,g:'couloir',c:[]};porte[idx(fx+dx,fy+dy)]=1;porte[idx(fx+dx*m,fy+dy*m)]=1;
      for(let j=2;j<m;j++){const i=idx(fx+dx*j,fy+dy*j);own[i]=id;p.c.push(i);}
      for(let j=1;j<=m;j++)for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)pied[idx(fx+dx*j+a,fy+dy*j+b)]=1;
      B.pieces.push(p);S.pieces.push(p);longs++;}}
}
// Gouffres intérieurs retirés « pour l'instant » le 20 novembre 2026, à la demande de l'utilisateur : le code reste, coupé par ce drapeau.
const GOUFFRES_INT=false;
// Gouffres et piliers d'une structure, écrits dans B.sol (FLOOR par défaut) ; chaque ajout est annulé s'il coupe la structure.
function amenager(B,S){const {own,porte,sol}=B;
  const relie=()=>{let s0=-1,tot=0;for(const p of S.pieces)for(const i of p.c)if(sol[i]!==CHASM&&sol[i]!==PILLAR){tot++;if(s0<0)s0=i;}
    const vu=new Set([s0]),q=[s0];let n=1;
    for(let k=0;k<q.length;k++){const c=q[k],x=c%W,y=(c/W)|0;for(const [dx,dy] of D4){const j=idx(x+dx,y+dy);if(vu.has(j))continue;
      if(porte[j]){vu.add(j);q.push(j);}else if(own[j]&&sol[j]!==CHASM&&sol[j]!==PILLAR){vu.add(j);q.push(j);n++;}}}
    return n===tot;};
  for(const p of S.pieces){if(p.g==='couloir'||p.c.length<16)continue;
    const de=new Set(p.c),xs=p.c.map(i=>i%W),ys=p.c.map(i=>(i/W)|0),x0=Math.min(...xs),y0=Math.min(...ys),x1=Math.max(...xs),y1=Math.max(...ys);
    const acces=p.c.filter(i=>D4.some(([dx,dy])=>porte[idx(i%W+dx,((i/W)|0)+dy)]));
    const dedans=set=>[...set].filter(i=>{const x=i%W,y=(i/W)|0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(!set.has(idx(x+dx,y+dy)))return false;return true;});
    const avant=p.c.map(i=>sol[i]),annule=()=>p.c.forEach((i,k)=>sol[i]=avant[k]);
    if(GOUFFRES_INT&&Math.random()<S.st.gou&&p.c.length>=20){
      if(Math.random()<.4){   // le gouffre prend toute la pièce : des chemins-ponts mènent des portes à un îlot central
        const mx=(x0+x1)>>1,my=(y0+y1)>>1,centre=p.c.reduce((a,i)=>Math.hypot(i%W-mx,((i/W)|0)-my)<Math.hypot(a%W-mx,((a/W)|0)-my)?i:a),garde=new Map();
        for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const j=idx(centre%W+dx,((centre/W)|0)+dy);if(de.has(j))garde.set(j,FLOOR);}
        const prev=new Map([[centre,-1]]),q=[centre];   // parcours depuis le centre, voisins tirés au hasard : chemins un peu tordus
        for(let k=0;k<q.length;k++){const c=q[k],x=c%W,y=(c/W)|0;for(const [dx,dy] of [...D4].sort(()=>Math.random()-.5)){const j=idx(x+dx,y+dy);if(de.has(j)&&!prev.has(j)){prev.set(j,c);q.push(j);}}}
        for(const a of acces){garde.set(a,FLOOR);for(let c=prev.get(a);c>=0&&c!=null;c=prev.get(c))if(!garde.has(c))garde.set(c,BRIDGE);}
        for(const i of p.c)sol[i]=garde.has(i)?garde.get(i):CHASM;p.gouffre='entier';
      }else{let trou=new Set(dedans(de));if(trou.size>=24&&Math.random()<.5)trou=new Set(dedans(trou));
        if(trou.size>=4){for(const i of trou)sol[i]=CHASM;p.gouffre='partiel';
          if(Math.random()<.55){const hz=Math.random()<.5,mx=(x0+x1)>>1,my=(y0+y1)>>1;for(const i of trou)if(hz?((i/W)|0)===my:i%W===mx)sol[i]=BRIDGE;}}}   // un pont le franchit : goulot
      if(!p.c.some(i=>sol[i]===CHASM)||!relie()){annule();p.gouffre=null;}
    }
    if(!p.gouffre&&(p.g==='rect'||p.g==='croix'||p.g==='ronde')&&x1-x0>=4&&y1-y0>=4&&Math.random()<S.st.pil){
      const pas=x1-x0>=8&&Math.random()<.6?3:2;let n=0;
      for(const i of dedans(de)){const x=i%W,y=(i/W)|0;if((x-x0)%pas===1&&(y-y0)%pas===1&&!acces.some(a=>Math.abs(a%W-x)<=1&&Math.abs(((a/W)|0)-y)<=1)){sol[i]=PILLAR;n++;}}
      if(n&&!relie())annule();else if(n)p.piliers=n;}
  }
}
// Portes d'entrée : peu nombreuses, éloignées les unes des autres, de préférence là où le dehors est déjà praticable.
function entrees(B,S,t,atteint,dE,proche){const {own,porte,pied,interdit}=B,cand=[];
  for(const p of S.pieces){if(p.g==='couloir')continue;for(const fi of p.c){if(B.sol[fi]!==FLOOR)continue;const fx=fi%W,fy=(fi/W)|0;
    for(const [dx,dy] of D4){const cx=fx+dx,cy=fy+dy,ox=cx+dx,oy=cy+dy;if(ox<2||oy<2||ox>=W-2||oy>=H-2)continue;const c=idx(cx,cy),o=idx(ox,oy);
      if(own[c]||porte[c]||interdit[c]||interdit[o]||pied[o]||!atteint[o]||own[idx(cx+dy,cy+dx)]||own[idx(cx-dy,cy-dx)]||porte[idx(cx+dy,cy+dx)]||porte[idx(cx-dy,cy-dx)])continue;
      cand.push({c,o,x:cx,y:cy,libre:!blocks(t[o])&&!isWater(t[o])});}}}
  if(!cand.length)return [];
  if(dE){const r=new Map(cand.map(e=>[e,proche?Math.random()*3+dE[e.o]:Math.random()*6-dE[e.o]]));cand.sort((a,b)=>r.get(a)-r.get(b));}   // proche (cavernes) : la porte regarde plutôt la caverne la plus proche   // complexe enfoui : la porte est plutôt du côté le plus enfoncé dans le massif, le tunnel contourne
  else cand.sort((a,b)=>(b.libre-a.libre)||Math.random()-.5);
  const n=dE?(proche?Math.max(1,Math.min(3,Math.round(GEN.cvPortes||1))):1):GEN.sEntrees>0?GEN.sEntrees:1+(S.pieces.length>=7?1:0)+(S.pieces.length>=16?1:0),pris=[],ecart=Math.max(GEN.sEntrees>0?4:8,Math.sqrt(S.emprise)*(GEN.sEntrees>0?.35:.7));
  for(const e of cand){if(pris.length>=n)break;if(pris.some(q=>Math.hypot(q.x-e.x,q.y-e.y)<ecart))continue;pris.push(e);}
  for(const e of pris){porte[e.c]=1;pied[e.c]=1;}
  return pris;}
// Pose les structures sur la carte déjà générée (relief, vaisseau, site). Elles peuvent recouvrir la montagne et l'eau ;
// si une entrée donne sur de la roche, un couloir est percé jusqu'à elle (connect).
// Cavernes : nombre de bâtiments (curseur, ± 1 au tirage) et part de la surface bâtie qui revient à chacun
function cibles_cav(total){
  let k=Math.max(1,Math.min(6,Math.round(autour('cvBati',.2))));k=Math.max(1,Math.min(k,Math.floor(total/50)));CVT.bati=k;
  const w=Array.from({length:k},()=>.65+Math.random()*.7),sw=w.reduce((a,b)=>a+b,0);
  return w.map(v=>Math.max(45,Math.round(total*v/sw)));}
function batiments(){BATI_DER=null;
  G.batis=[];G.cles={};G.pb={};G.art={};G.artN=null;G.tun={};const pct=ENFOUI()?100:GEN.structure||0,N=W*H;if(pct<=0)return;
  // complexe enfoui (recette à zones) : il ne tient que dans le massif, à plus de 5 cases de la lisière et du bord de carte (la place d'un tunnel), et n'en prend pas la moitié (le reste est pour les tunnels)
  const enf=!!(ZONE&&ENFOUI()),cav=enf&&!!(RECETTES[GEN.recette]||{}).cavernes,dE=enf?distExt():null,mg=cav?2:W>=72?5:W>=48?4:3,mE=cav?3:mg;let zb=null,mN=0;   // cav : recette cavernes, bâtiments enchâssés entre les cavernes (21 novembre 2026)
     // mg : marge à la lisière et au bord, plus mince sur les petites cartes
  // Où le complexe peut tenir : dans le massif, à plus de mg cases de la lisière et du bord de carte. Le massif peut être en
  // plusieurs morceaux (forme « deux côtés ») : on ne garde que le plus grand, sinon le cadre de pose enjamberait l'extérieur.
  if(enf&&!cav){const ok=new Uint8Array(N),vu=new Uint8Array(N);
    for(let i=0;i<N;i++){const x=i%W,y=(i/W)|0;if(dE[i]>mg&&x>=mg&&y>=mg&&x<=W-mg-1&&y<=H-mg-1)ok[i]=1;}
    for(let i=0;i<N;i++){if(!ok[i]||vu[i])continue;const q=[i];vu[i]=1;const b=[W,H,0,0];
      for(let k=0;k<q.length;k++){const c=q[k],x=c%W,y=(c/W)|0;
        b[0]=Math.min(b[0],x);b[1]=Math.min(b[1],y);b[2]=Math.max(b[2],x);b[3]=Math.max(b[3],y);
        for(const [dx,dy] of D4){const a=x+dx,e=y+dy;if(a<0||e<0||a>=W||e>=H)continue;const j=idx(a,e);if(ok[j]&&!vu[j]){vu[j]=1;q.push(j);}}}
      if(q.length>mN){mN=q.length;zb=b;}}
    if(!zb)return;}
  const total=cav?Math.max(50,Math.round(N*CVT.surf/100)):enf?Math.max(50,Math.round(mN*Math.min(.8,autour('zComplexe',.15)/100*(W>=72?1:4/3)))):Math.round(N*pct/100);   // complexe enfoui : part du massif, réglée par le curseur (un tiers de plus sur les petites cartes)if(total<45)return;
  const t0=G.t.slice();
  const nEssais=enf?12:6;   // complexe enfoui : plus d'essais, il n'est jamais posé en terrain ouvert (20 novembre 2026)
  for(let essai=0;essai<nEssais;essai++){
    const t=G.t,B={own:new Int16Array(N),porte:new Uint8Array(N),pied:new Uint8Array(N),interdit:new Uint8Array(N),sol:new Uint8Array(N).fill(FLOOR),pieces:[]};
    for(let i=0;i<N;i++){const x=i%W,y=(i/W)|0,v=t[i];
      if(x<2||y<2||x>=W-2||y>=H-2)B.interdit[i]=1;   // les gouffres naturels ne gênent plus : une pièce posée dessus les change en sol (19 novembre 2026)
      else if(enf&&(dE[i]<=mg||x<mE||y<mE||x>W-mE-1||y>H-mE-1||(cav&&SECT[i]!==1)))B.interdit[i]=1;   // cavernes : un bâtiment ne sort pas des secteurs bâtis
      else if(v===SHIP||v===DECK)for(let dy=-3;dy<=3;dy++)for(let dx=-2;dx<=2;dx++)B.interdit[idx(Math.max(0,Math.min(W-1,x+dx)),Math.max(0,Math.min(H-1,y+dy)))]=1;}
    for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)B.interdit[idx(Math.max(0,Math.min(W-1,G.px+dx)),Math.max(0,Math.min(H-1,G.py+dy)))]=1;
    const deux=enf?false:GEN.sNb===2?total>=90:GEN.sNb===1?false:total>=260&&Math.random()<.5,part=deux?.2+Math.random()*.6:1,cibles=cav?cibles_cav(total):deux?[Math.round(total*part),total-Math.round(total*part)]:[total];
    const cles=STYLES[GEN.sStyle]?[GEN.sStyle]:Object.keys(STYLES).sort(()=>Math.random()-.5),lots=[],strs=[];
    // deux structures : la carte est coupée en deux zones, à proportion de leurs tailles, pour qu'elles tiennent toujours toutes les deux
    const zones=cav?cibles.map(()=>[3,3,W-4,H-4]):[enf?zb:[3,3,W-4,H-4]];
    const ind0=B.interdit.slice(),sepa=new Uint8Array(N);   // cav : entre deux bâtiments, trois cases de roche (interdit seulement pendant la pose)
    if(deux){const vert=W>=H?Math.random()<.75:Math.random()<.25,inv=Math.random()<.5,pa=inv?1-part:part;
      if(vert){const c=Math.round(3+(W-6)*Math.max(.22,Math.min(.78,pa)));zones[0]=[3,3,c-3,H-4];zones[1]=[c+3,3,W-4,H-4];}
      else{const c=Math.round(3+(H-6)*Math.max(.25,Math.min(.75,pa)));zones[0]=[3,3,W-4,c-3];zones[1]=[3,c+3,W-4,H-4];}
      if(inv)zones.reverse();}
    const graines=[];   // cavernes : d'où part chaque bâtiment, dans un secteur bâti, loin des autres et là où il y a de la place
    for(let s=0;s<cibles.length;s++){if(cav)for(let i=0;i<N;i++)if(sepa[i])B.interdit[i]=1;
      const cible=cibles[s],aire=cible*1.7,asp=1+Math.random()*.9,[zx0,zy0,zx1,zy1]=zones[s],zw=zx1-zx0+1,zh=zy1-zy0+1;
      let lw=Math.min(zw,Math.round(Math.sqrt(aire*asp))),lh=Math.min(zh,Math.round(aire/lw));if(lw<10)lw=Math.min(zw,10);if(lh<8)lh=Math.min(zh,8);
      if(lw*lh<aire)lw=Math.min(zw,Math.ceil(aire/lh));   // zone étroite : on s'étale dans l'autre sens
      let best=null,bb=1e9;
      for(let k=0;k<60;k++){const x0=rnd(zx0,zx1-lw+1),y0=rnd(zy0,zy1-lh+1);
        let bad=0;for(let y=y0;y<y0+lh;y+=2)for(let x=x0;x<x0+lw;x+=2)if(B.interdit[idx(x,y)])bad++;if(bad<bb){bb=bad;best=[x0,y0,x0+lw-1,y0+lh-1];}}
      let dep=null,stS=STYLES[cles[s%cles.length]];
      if(cav){best=[zx0,zy0,zx1,zy1];   // cavernes : le lot est toute la carte, le bâtiment s'étale dans les secteurs bâtis à partir de sa graine
        let g=null,gs=-1;
        for(let k=0;k<60;k++){const x=rnd(6,W-7),y=rnd(5,H-6);if(B.interdit[idx(x,y)])continue;let lib=0;
          for(let dy=-4;dy<=4;dy+=2)for(let dx=-6;dx<=6;dx+=2)if(!B.interdit[idx(Math.max(0,Math.min(W-1,x+dx)),Math.max(0,Math.min(H-1,y+dy)))])lib++;
          let d=30;for(const q of graines)d=Math.min(d,Math.hypot(q[0]-x,q[1]-y));const sc=lib/35*(4+d)+Math.random()*2;if(sc>gs){gs=sc;g=[x,y];}}
        if(!g)continue;graines.push(g);dep=[Math.max(3,g[0]-6),Math.max(3,g[1]-4),g[0],g[1]];
        const np=Math.round(GEN.cvPieces||0);stS=Object.assign({},stS,{libre:1});   // « Pièces par bâtiment » : un nombre visé ; les pièces sont agrandies ou rétrécies pour tenir la surface
        if(np>=2){const a0=((stS.rw[0]+stS.rw[1])/2+1.6)*((stS.rh[0]+stS.rh[1])/2+1.6),k=Math.max(.55,Math.min(2,Math.sqrt(cible/np/a0/1.3)));
          stS.np=np;stS.rw=[Math.max(3,Math.round(stS.rw[0]*k)),Math.max(4,Math.round(stS.rw[1]*k))];stS.rh=[Math.max(3,Math.round(stS.rh[0]*k)),Math.max(4,Math.round(stS.rh[1]*k))];}}
      if(!best)continue;lots.push(best);
      const S=accretion(B,best,cible,stS,dep);if(!S||S.pieces.length<2)continue;
      boucles(B,S);amenager(B,S);S.cle=cles[s%cles.length];strs.push(S);
      if(cav)for(const p of S.pieces)for(const i of p.c){const x=i%W,y=(i/W)|0;for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++)sepa[idx(Math.max(0,Math.min(W-1,x+dx)),Math.max(0,Math.min(H-1,y+dy)))]=1;}}
    if(cav)B.interdit.set(ind0);
    if(cav&&strs.length<Math.min(cibles.length,2)&&essai<nEssais-3)continue;   // cavernes : au moins deux bâtiments quand on en demande deux ou plus (rien n'a encore été modifié sur la carte)
    if(strs.length){
      const garde=new Set();for(const S of strs)for(const p of S.pieces)for(const i of p.c)garde.add(i);
      for(let i=0;i<N;i++){if(B.own[i]&&garde.has(i))t[i]=FLOOR;}
      for(let i=0;i<N;i++){if(t[i]>=WALL||(B.own[i]&&garde.has(i)))continue;const x=i%W,y=(i/W)|0;
        if(B.porte[i]&&D4.some(([dx,dy])=>garde.has(idx(x+dx,y+dy)))){t[i]=Math.random()*100<(GEN.sOuvert||0)?FLOOR:DOOR;continue;}   // porte, ou simple ouverture
        let m=false;for(let dy=-1;dy<=1&&!m;dy++)for(let dx=-1;dx<=1;dx++){const a=x+dx,b=y+dy;if(a>=0&&b>=0&&a<W&&b<H&&garde.has(idx(a,b))){m=true;break;}}
        if(m)t[i]=WALL;}
      tidyChasms(t);   // ce qui reste d'un gouffre naturel entamé : pas de petit trou, pas de pont qui ne franchit plus rien
      for(let i=0;i<N;i++){if(B.own[i]&&garde.has(i))t[i]=B.sol[i];}   // puis les gouffres, ponts et piliers des pièces
      const atteint=boucher(t,garde);let ok=true;
      for(const S of strs){S.entrees=entrees(B,S,t,atteint,enf?dE:null,cav);if(!S.entrees.length)ok=false;
        for(const e of S.entrees){t[e.c]=DOOR;if(blocks(t[e.o]))t[e.o]=GROUND;}}   // la porte, et l'amorce du couloir d'entrée
      if(ok&&cav&&!reliePortes(t,B,strs)&&essai<nEssais-1)ok=false;   // cavernes : un petit boyau de chaque porte à la caverne la plus proche
      else if(ok&&enf&&!cav&&!tunnels(t,B,strs,dE)&&essai<nEssais-1)ok=false;   // le réseau de tunnels d'abord ; s'il n'a pas trouvé de passage, on recommence (au dernier essai, connect perce tout droit)
      if(ok)connect(t);
      if(ok&&connectedAll(t)){
        G.batis=strs.map(S=>({style:S.st.n,pieces:S.pieces.filter(p=>p.g!=='couloir').length,cases:S.emprise,entrees:S.entrees.map(e=>[e.x,e.y])}));
        G.pb={};for(const i of garde)if(t[i]===BRIDGE)G.pb[i]=1;   // les ponts des pièces, pour le rendu
        siteAuFond(B,strs);petites(B,strs);const sec=secrets(B,strs);verrous(B,strs,sec);artefacts(B,strs);BATI_DER={B,strs};return;}
    }
    for(let i=0;i<N;i++)G.t[i]=t0[i];
  }
}
// Tout ce qu'un couloir percé depuis le départ ne pourra jamais atteindre (terrain enfermé entre des murs) devient du mur plein.
// Renvoie les cases atteignables par le dehors : une porte d'entrée doit donner sur l'une d'elles.
function boucher(t,garde){const N=W*H,vu=new Uint8Array(N),q=[idx(G.px,G.py)];vu[q[0]]=1;
  for(let k=0;k<q.length;k++){const c=q[k],x=c%W,y=(c/W)|0;for(const [dx,dy] of D4){const a=x+dx,b=y+dy;if(a<1||b<1||a>=W-1||b>=H-1)continue;const j=idx(a,b),v=t[j];
    if(vu[j]||v===WALL||v===PILLAR||v===DOOR||garde.has(j)||(v===SHIP))continue;vu[j]=1;q.push(j);}}
  for(let i=0;i<N;i++){const x=i%W,y=(i/W)|0;if(x<1||y<1||x>=W-1||y>=H-1||vu[i]||garde.has(i)||t[i]>=WALL||t[i]===SHIP||t[i]===DECK)continue;t[i]=WALL;}
  return vu;}
// Le site de forage va dans la pièce la plus profonde de la plus grande structure : la traverser est l'objectif.
function siteAuFond(B,strs){const S=strs.reduce((a,b)=>b.emprise>a.emprise?b:a),t=G.t,d=new Map(),q=[];
  for(const e of S.entrees){d.set(e.c,0);q.push(e.c);}
  for(let k=0;k<q.length;k++){const c=q[k],x=c%W,y=(c/W)|0;for(const [dx,dy] of D4){const j=idx(x+dx,y+dy);if(d.has(j)||!(t[j]===FLOOR||t[j]===DOOR||t[j]===BRIDGE)||(!B.own[j]&&!B.porte[j]))continue;d.set(j,d.get(c)+1);q.push(j);}}
  let best=-1,bd=-1;
  for(const p of S.pieces){if(p.g==='couloir')continue;
    const ok=p.c.filter(i=>t[i]===FLOOR&&d.has(i)&&!D4.some(([dx,dy])=>t[idx(i%W+dx,((i/W)|0)+dy)]===DOOR));if(!ok.length)continue;
    const far=Math.min(...ok.map(i=>d.get(i)));if(far<=bd)continue;bd=far;
    const mx=ok.reduce((a,i)=>a+i%W,0)/ok.length,my=ok.reduce((a,i)=>a+((i/W)|0),0)/ok.length;
    best=ok.reduce((a,i)=>Math.hypot(i%W-mx,((i/W)|0)-my)<Math.hypot(a%W-mx,((a/W)|0)-my)?i:a);}
  if(best>=0&&G.sites[0]){G.sites[0].x=best%W;G.sites[0].y=(best/W)|0;G.siteProf=bd;}}
// Portes verrouillées et clés (19 novembre 2026). Une porte ne peut être verrouillée que si elle est le seul passage vers ce
// qu'il y a derrière ; on préfère celle qui enferme le site de forage. Les clés sont posées là où l'on arrive sans rien ouvrir :
// on peut donc toujours toutes les ramasser avant la première serrure, aucune impasse possible.
function verrous(B,strs,sec){const n=GEN.sVerrous||0,t=G.t,N=W*H;if(n<=0)return;
  const dehors=()=>{const vu=new Uint8Array(N),q=[idx(G.px,G.py)];vu[q[0]]=1;
    for(let k=0;k<q.length;k++){const c=q[k],x=c%W,y=(c/W)|0;for(const [dx,dy] of D4){const j=idx(x+dx,y+dy);if(!vu[j]&&!blocks(t[j])){vu[j]=1;q.push(j);}}}return vu;};
  const site=G.sites[0]?idx(G.sites[0].x,G.sites[0].y):-1,ent=new Set();for(const S of strs)for(const e of S.entrees)ent.add(e.c);
  let poses=0;
  for(let v=0;v<n;v++){const portes=[];for(let i=0;i<N;i++)if(t[i]===DOOR&&B.porte[i]&&!ent.has(i))portes.push(i);
    let best=null;const avant=dehors();
    for(const p of portes){t[p]=LOCK;const vu=dehors();t[p]=DOOR;let derriere=0,aSite=false;
      for(let i=0;i<N;i++)if(avant[i]&&!vu[i]&&i!==p){derriere++;if(i===site)aSite=true;}
      if(derriere<6)continue;const note=(aSite?1e6:0)-derriere+Math.random()*4;   // le site d'abord, puis la plus petite réserve
      if(!best||note>best.note)best={p,note};}
    if(!best)break;t[best.p]=LOCK;poses++;}
  if(!poses)return;
  // les clés : sur un sol bâti atteignable toutes serrures fermées, loin de l'entrée ; à défaut n'importe où dehors
  const vu=dehors(),d=new Int32Array(N).fill(-1),q=[idx(G.px,G.py)];d[q[0]]=0;
  for(let k=0;k<q.length;k++){const c=q[k],x=c%W,y=(c/W)|0;for(const [dx,dy] of D4){const j=idx(x+dx,y+dy);if(d[j]<0&&!blocks(t[j])){d[j]=d[c]+1;q.push(j);}}}
  let lieux=[];for(let i=0;i<N;i++)if(vu[i]&&t[i]===FLOOR&&B.own[i]&&i!==site&&!D4.some(([dx,dy])=>{const w=t[idx(i%W+dx,((i/W)|0)+dy)];return w===DOOR||w===LOCK;}))lieux.push(i);
  if(lieux.length<poses){lieux=[];for(let i=0;i<N;i++)if(vu[i]&&(t[i]===GROUND||t[i]===FLAT)&&d[i]>8)lieux.push(i);}
  lieux.sort((a,b)=>d[b]-d[a]);lieux=lieux.slice(0,Math.max(poses,Math.ceil(lieux.length/2)));   // la moitié la plus lointaine
  for(let k=0;k<poses&&lieux.length;k++){const i=lieux.splice(rnd(0,lieux.length-1),1)[0];G.cles[i]=1;}
  // jamais plus de clés que de serrures (19 novembre 2026) : les pièces secrètes ne reçoivent plus de clé en surplus
  G.verrous=poses;}
// Une petite pièce (moins de 8 cases) fermée par des portes en perd une : le passage reste ouvert (19 novembre 2026).
function petites(B,strs){const t=G.t,ent=new Set();for(const S of strs)for(const e of S.entrees)ent.add(e.c);
  for(const S of strs)for(const p of S.pieces){if(p.c.length>=8)continue;const pas=new Set();
    for(const i of p.c)for(const [dx,dy] of D4){const j=idx(i%W+dx,((i/W)|0)+dy);if(B.porte[j]&&(t[j]===DOOR||t[j]===FLOOR))pas.add(j);}
    const l=[...pas];if(!l.length||l.some(j=>t[j]===FLOOR))continue;const libres=l.filter(j=>!ent.has(j));if(libres.length)t[libres[rnd(0,libres.length-1)]]=FLOOR;}}
// Pièces secrètes (19 novembre 2026) : une pièce à un seul passage, dont la porte a l'air d'un mur. Au besoin on en creuse une
// dans un massif de mur plein. Renvoie, pour chacune, la liste de ses cases de sol (une clé peut y être posée).
function secrets(B,strs){const n=GEN.sSecrets||0,t=G.t,out=[];G.secrets=0;if(n<=0)return out;
  const site=G.sites[0]?idx(G.sites[0].x,G.sites[0].y):-1,ent=new Set();for(const S of strs)for(const e of S.entrees)ent.add(e.c);
  const cand=[];
  for(const S of strs)for(const p of S.pieces){if(p.g==='couloir'||p.c.includes(site))continue;const pas=new Set();
    for(const i of p.c)for(const [dx,dy] of D4){const j=idx(i%W+dx,((i/W)|0)+dy);if(B.porte[j]&&t[j]!==WALL)pas.add(j);}
    if(pas.size===1&&!ent.has([...pas][0]))cand.push([[...pas][0],p.c.filter(i=>t[i]===FLOOR)]);}
  cand.sort(()=>Math.random()-.5);
  for(const [porte,sol] of cand){if(out.length>=n)break;if(!sol.length)continue;t[porte]=SECRET;out.push(sol);}
  // pas assez de culs-de-sac : on creuse dans le mur plein, derrière le mur d'une pièce
  const plein=(x,y)=>x>2&&y>2&&x<W-3&&y<H-3&&t[idx(x,y)]===WALL;
  for(let k=0;k<4000&&out.length<n;k++){const fx=rnd(3,W-4),fy=rnd(3,H-4),fi=idx(fx,fy);if(t[fi]!==FLOOR||!B.own[fi])continue;
    const [dx,dy]=D4[rnd(0,3)],cx=fx+dx,cy=fy+dy;if(!plein(cx,cy)||!plein(cx+dy,cy+dx)||!plein(cx-dy,cy-dx))continue;
    const w=rnd(3,5),h=rnd(3,4),dec=rnd(0,(dx?h:w)-1),x0=dx>0?cx+1:dx<0?cx-w:cx-dec,y0=dy>0?cy+1:dy<0?cy-h:cy-dec;let ok=true;
    for(let y=y0-1;y<=y0+h&&ok;y++)for(let x=x0-1;x<=x0+w;x++)if(!plein(x,y)){ok=false;break;}
    if(!ok)continue;const sol=[];for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){t[idx(x,y)]=FLOOR;sol.push(idx(x,y));}
    t[idx(cx,cy)]=SECRET;out.push(sol);}
  G.secrets=out.length;return out;}
// Se reposer fait chercher : chaque porte dérobée à DET cases ou moins (5 de base, un objet peut le changer) a 25 % de chance
// par battement d'être découverte.
const SECRET_P=.25;
function chercheSecrets(){const r=G.st.detec||5;let n=0;
  for(let y=Math.max(0,G.py-r);y<=Math.min(H-1,G.py+r);y++)for(let x=Math.max(0,G.px-r);x<=Math.min(W-1,G.px+r);x++){const i=idx(x,y);
    if(G.t[i]!==SECRET||Math.hypot(x-G.px,y-G.py)>r||Math.random()>=SECRET_P)continue;G.t[i]=DOOR;G.seen[i]=1;n++;addFx({kind:'num',x,y,txt:'!',col:'#ffffff',dur:900});}
  if(n){SFX.spot();sayMore(n>1?'Des portes dérobées apparaissent dans le mur !':'Une porte dérobée apparaît dans le mur !','good');if(typeof stopRest==='function'&&REST)stopRest('Repos interrompu : une porte dérobée.');}}
