/* ---------- L'Astroport (niveau 1, 28 novembre 2026) ----------
   Le niveau 1 est un cimetière spatial : la zone dégagée autour de notre vaisseau est une FOSSE d'atterrissage parmi des
   dizaines d'autres, et chaque fosse garde une ÉPAVE (ou ce qu'il en reste). Voir docs/histoire-niveau-1.md.
   – astroport() : creuse les fosses dans la zone extérieure, y pose les épaves (modèles de 04-vaisseau, EPV_MODELES) et
     des modules d'extérieur (14f, champ ext), numérote tout. Appelé par niveau() juste après les bâtiments.
   – astroportFin() : butin des épaves éventrées, enregistreurs (« boîtes noires ») des épaves scellées. Après le butin ordinaire.
   Ce qui reste sur la carte, pour les étapes suivantes (ferrailleuses à l'ouvrage, terminaux, registre du port) :
     G.fosses  = [{num, cx, cy, rx, ry, notre, epave (indice dans G.epaves, -1 : aucune), mod (nom du module posé, ou null)}]
     G.epaves  = [{type (clé de EPV_MODELES, ou 'module'), nom, etat ('s' scellée, 'e' éventrée, 'q' squelette, 'v' fosse vide),
                   num, x, y, w, h (emprise), fosse (indice dans G.fosses), boite (case de l'enregistreur, ou -1), groupes:[]}]
     G.epI[case] = indice de l'épave ; G.fosI[case] = indice de la fosse ; G.epT[case] = clé de la tuile d'épave à dessiner ;
     G.epMod[n] = grille d'une coque de module (dessin tiré à la volée). G.sas (case devant la porte du dépôt) et G.debouches
     (débouchés des tunnels) viennent de 07d-tunnels.
   Plus une fosse est proche de l'entrée du complexe (les débouchés), plus son épave est ancienne (petit numéro, vieux
   modèle) et dépecée. Notre unité est la 467 : tous les numéros sont plus petits. */
const EPV_ETATS={s:'SCELLÉE',e:'ÉVENTRÉE',q:'SQUELETTE',v:'FOSSE VIDE'},EPV_UNITE=467;
const num4=n=>String(n).padStart(4,'0'),num2=n=>String(n).padStart(2,'0');
const epvMk=n=>n<150?'mkI':n<300?'mkII':n<430?'mkIII':'mkIV';
const epvHash=(x,y)=>{let h=(x*73856093)^(y*19349663);h=Math.imul(h^(h>>>13),1274126177);return (h^(h>>>16))>>>0;};
// le niveau en cours de génération est-il l'Astroport ? (recette du niveau 1, avec le vaisseau)
const astroRec=()=>GEN.recette===RECETTE_NIV(1)&&!SANS_VAISSEAU;
// cases d'une grille de modèle : [gx, gy, lettre]
const epvCases=g=>{const l=[];g.forEach((r,y)=>[...r].forEach((c,x)=>{if(c!=='.')l.push([x,y,c]);}));return l;};
// brèches d'une épave éventrée (toujours les mêmes pour un modèle, pour que dessin et terrain concordent) : la trappe, plus une
// ou deux plaques de coque au contact de l'intérieur (la sonde, sans intérieur : sa plaque centrale)
const EPV_BRECHE={},EPV_GARDE={};
function epvBreche(m){if(EPV_BRECHE[m])return EPV_BRECHE[m];const g=EPV_MODELES[m].g,c=epvCases(g),at=(x,y)=>(g[y]||'')[x]||'.';
  let cand=c.filter(([x,y,t])=>t==='H'&&[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>'ID'.includes(at(x+dx,y+dy))));
  if(!cand.length)cand=c.filter(([x,y,t])=>t==='H'&&[[1,0],[-1,0],[0,1],[0,-1]].filter(([dx,dy])=>at(x+dx,y+dy)==='H').length>=2);
  cand.sort((a,b)=>epvHash(a[0]+11,a[1]+3)-epvHash(b[0]+11,b[1]+3));
  const s=new Set(c.filter(([, ,t])=>t==='D').map(([x,y])=>x+','+y));
  for(const [x,y] of cand.slice(0,Math.min(2,Math.max(1,Math.ceil(cand.length/3)))))s.add(x+','+y);
  return EPV_BRECHE[m]=s;}
// ce qui tient encore debout d'un squelette : les réacteurs et une plaque sur trois
function epvGarde(m){if(EPV_GARDE[m])return EPV_GARDE[m];const c=epvCases(EPV_MODELES[m].g),s=new Set();
  for(const [x,y,t] of c)if(t==='E'||(t==='H'&&epvHash(x+5,y+17)%3===0))s.add(x+','+y);
  if(!s.size&&c.length)s.add(c[0][0]+','+c[0][1]);return EPV_GARDE[m]=s;}
/* Dessins des quatre états, tirés pixel par pixel du dessin du modèle (retouches comprises). Gardés en cache tant que les
   tuiles ne sont pas refaites (buildTiles remplace TL : le cache suit). */
let EPV_IMG={},EPV_TL=null;
function epvOublie(){EPV_IMG={};for(const k in TL)if(/^ep[vm]_/.test(k)&&!TILE_GRANDES[k])delete TL[k];}
function epvImage(m,st){if(EPV_TL!==TL){EPV_IMG={};EPV_TL=TL;}const cle=m+'|'+st;if(EPV_IMG[cle])return EPV_IMG[cle];
  const [w,h]=TILE_GRANDES['epv_'+m],f=TF('epv_'+m),B=[];for(let y=0;y<h;y++){let l='';for(let x=0;x<w;x++)l+=f(x,y)||'.';B.push(l);}
  const b=(x,y)=>x<0||y<0||x>=w||y>=h?'.':B[y][x],bord=(x,y)=>b(x,y)!=='.'&&[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>b(x+dx,y+dy)==='.');
  const br=epvBreche(m),ga=epvGarde(m),out=[];
  for(let y=0;y<h;y++){let l='';for(let x=0;x<w;x++){const c=b(x,y),cx=(x/16)|0,cy=(y/16)|0,lx=x%16,ly=y%16,k=cx+','+cy,hs=epvHash(x,y);let r=c;
    if(st==='e'){if(br.has(k)){const d=Math.hypot(lx-7.5,ly-7.5);r=d<5.2+(hs%3)-1?'.':c!=='.'&&d<7.2?'5':c;}
      else if(c==='0'&&hs%23===0)r='5';}
    else if(st==='q'){if(ga.has(k))r=c!=='.'&&!bord(x,y)&&hs%5===0?'.':c;
      else r=c!=='.'&&(lx===7||lx===8||ly===2||ly===13)?'5':'.';}
    else if(st==='v')r=bord(x,y)&&(x+y)%3===0?'5':'.';
    l+=r;}out.push(l);}
  return EPV_IMG[cle]=out;}
// coque d'un module d'extérieur : un dessin d'engin tiré de la grille des cases « K » posées, une fois par carte
let EPM_IMG={},EPM_G=null;
function epmImage(n){if(EPM_G!==G||EPV_TL!==TL){EPM_IMG={};EPM_G=G;}if(EPM_IMG[n])return EPM_IMG[n];
  const g=G.epMod&&G.epMod[n];return EPM_IMG[n]=g?epvPixels(g):[];}
// la tuile d'une case d'épave, faite à la demande (epv_<modèle>_<état>_<cx>_<cy>, epm_<n>_<cx>_<cy>)
function epTuile(k){let c=TL[k];if(c)return c;const p=k.split('_');
  if(p[0]==='epv'){const im=epvImage(p[1],p[2]),cx=+p[3],cy=+p[4];c=tileCanvas((x,y)=>(im[cy*16+y]||'')[cx*16+x]||'.');}
  else if(p[0]==='epm'){const im=epmImage(+p[1]),cx=+p[2],cy=+p[3];c=tileCanvas((x,y)=>(im[cy*16+y]||'')[cx*16+x]||'.');}
  else return null;
  return TL[k]=c;}

/* ---------- Génération ---------- */
// les modules d'extérieur du niveau 1 (Lab → Modules, case « Extérieur »)
const mdlExt=()=>typeof MODULES==='undefined'?[]:MODULES.filter(o=>o.ext&&o.rec&&o.rec[RECETTE_NIV(1)]);
const MDL_SOL_EXT=()=>Object.assign({},MDL_SOL,{K:SHIP,U:RUBBLE,A:ANTENNA});
function astroport(){const t=G.t,N=W*H;G.fosses=[];G.epaves=[];G.epI={};G.fosI={};G.epT={};G.epMod={};
  if(!G.ship)return;
  const occ=new Uint8Array(N),site=G.sites&&G.sites[0];
  // repères de l'entrée du complexe : les débouchés des tunnels ; à défaut, le sas, ou le milieu de la lisière du massif
  let ent=(G.debouches||[]).map(i=>[i%W,(i/W)|0]);
  if(!ent.length&&G.sas!=null)ent=[[G.sas%W,(G.sas/W)|0]];
  if(!ent.length&&ZONE){for(let i=0;i<N;i++)if(ZONE[i]){ent=[[i%W,(i/W)|0]];break;}}
  if(!ent.length)ent=[[W>>1,H>>1]];
  const dEnt=(x,y)=>Math.min(...ent.map(([a,b])=>Math.hypot(x-a,y-b))),dMax=Math.hypot(W,H)*.75;
  const marque=(cx,cy,rx,ry,fi,m)=>{const l=[];for(let y=Math.floor(cy-ry-m);y<=Math.ceil(cy+ry+m);y++)for(let x=Math.floor(cx-rx-m);x<=Math.ceil(cx+rx+m);x++){
      if(x<0||y<0||x>=W||y>=H)continue;const dx=(x-cx)/(rx+m),dy=(y-cy)/(ry+m);if(dx*dx+dy*dy>1)continue;const i=idx(x,y);occ[i]=1;
      if(fi!=null){const ex=(x-cx)/rx,ey=(y-cy)/ry;if(ex*ex+ey*ey<=1){G.fosI[i]=fi;l.push(i);}}}return l;};
  // notre fosse : l'ovale dégagé autour du vaisseau (07-generation, SHIP_OVALE)
  {const cx=G.ship.x+(SGW-1)/2,cy=G.ship.y+(SGH-1)/2,rx=SGW/2+2.4,ry=SGH/2+2.4;
    G.fosses.push({num:0,cx,cy,rx,ry,notre:true,epave:-1,mod:null});marque(cx,cy,rx,ry,0,2);}
  // une case peut-elle entrer dans une fosse ? (extérieur, hors bâti, tunnels, vaisseau et site)
  const dur=v=>v===MOUNT||v===HARD||v===DEEP||v===CHASM;
  const permis=(x,y)=>{if(x<2||y<2||x>=W-2||y>=H-2)return false;const i=idx(x,y),v=t[i];
    return !occ[i]&&!(ZONE&&ZONE[i])&&!(G.tun&&G.tun[i])&&v!==SHIP&&v!==DECK&&!(v>=WALL)&&!(site&&Math.abs(site.x-x)<=2&&Math.abs(site.y-y)<=2);};
  let libres=0;for(let i=0;i<N;i++)if(!(ZONE&&ZONE[i])&&canWalk(t[i],true))libres++;
  const cible=Math.max(10,Math.min(32,Math.round(libres/110))),pool=mdlExt().map(o=>mdlVariantes(o).map(v=>Object.assign(v,{nom:o.nom}))),SOL=MDL_SOL_EXT();
  let nMod=0;const modMax=Math.max(2,Math.round(cible/4));
  for(let k=0;k<cible*80&&G.fosses.length<cible+1;k++){
    const cx0=rnd(3,W-4),cy0=rnd(3,H-4),f=Math.min(1,dEnt(cx0,cy0)/dMax);
    // le contenu d'abord (sa taille fait celle de la fosse) : un module d'extérieur une fois sur quatre, sinon un modèle d'engin,
    // d'autant plus ancien qu'on est près de l'entrée
    let mod=null,m=null,w,h;
    if(pool.length&&nMod<modMax&&Math.random()<.25){const vs=pool[rnd(0,pool.length-1)];mod=vs[rnd(0,vs.length-1)];w=mod.w;h=mod.h;}
    else{const pds=EPV_CLES.map(c=>{const M=EPV_MODELES[c],g=M.gen;return M.p*(g===1?1.6-1.2*f:g===3?.3+1.3*f:1);});
      let r=Math.random()*pds.reduce((a,b)=>a+b,0),j=0;while(j<pds.length-1&&(r-=pds[j])>0)j++;
      m=EPV_CLES[j];const g=EPV_MODELES[m].g;w=Math.max(...g.map(l=>l.length));h=g.length;}
    const rx=w/2+(mod?1.4:1.7),ry=h/2+(mod?1.4:1.7),cx=cx0+(w%2?0:.5),cy=cy0+(h%2?0:.5);
    if(ent.some(([a,b])=>Math.hypot(cx-a,cy-b)<Math.max(rx,ry)+3))continue;   // l'entrée reste dégagée
    let n=0,mauvais=0,ok=true;
    for(let y=Math.floor(cy-ry);y<=Math.ceil(cy+ry)&&ok;y++)for(let x=Math.floor(cx-rx);x<=Math.ceil(cx+rx);x++){
      const dx=(x-cx)/rx,dy=(y-cy)/ry;if(dx*dx+dy*dy>1)continue;if(!permis(x,y)){ok=false;break;}n++;if(dur(t[idx(x,y)]))mauvais++;}
    if(!ok||mauvais>n*(k<cible*30?.15:.35))continue;
    const fi=G.fosses.length,cel=marque(cx,cy,rx,ry,fi,0);marque(cx,cy,rx,ry,null,1);
    for(const i of cel)t[i]=GROUND;   // la fosse est dégagée, comme celle du vaisseau
    const F={num:0,cx,cy,rx,ry,notre:false,epave:-1,mod:mod?mod.nom:null,f};G.fosses.push(F);
    const ox=Math.round(cx-(w-1)/2),oy=Math.round(cy-(h-1)/2);
    if(mod){nMod++;F.ox=ox;F.oy=oy;astroModule(mod,ox,oy,fi,SOL);}
    else{const e={type:m,nom:EPV_MODELES[m].n,etat:'s',num:0,x:ox,y:oy,w,h,fosse:fi,boite:-1,f,groupes:[]};F.epave=G.epaves.length;G.epaves.push(e);}}
  // fosses numérotées depuis l'entrée du dépôt (FOSSE 01 la plus proche) ; la nôtre a son numéro parmi les autres
  {const o=G.fosses.map((F,i)=>[i,dEnt(F.cx,F.cy)]).sort((a,b)=>a[1]-b[1]);o.forEach(([i],r)=>{G.fosses[i].num=r+1;});}
  // âge et état : rang de l'épave en partant de l'entrée (un peu brouillé), numéros tirés sous le nôtre, croissants avec le rang
  {const E=G.epaves,ordre=E.map((e,i)=>[i,e.f+Math.random()*.12]).sort((a,b)=>a[1]-b[1]).map(a=>a[0]),nums=new Set();
    while(nums.size<E.length)nums.add(rnd(1,EPV_UNITE-1));const L=[...nums].sort((a,b)=>a-b);
    ordre.forEach((i,r)=>{const e=E[i],q=E.length>1?r/(E.length-1):1;e.num=L[r];
      if(e.type==='module'){e.etat='q';return;}
      const p=q<.25?{v:.4,q:.35,e:.15}:q<.55?{v:.15,q:.35,e:.3}:{v:.04,q:.14,e:.4},x=Math.random();
      e.etat=x<p.v?'v':x<p.v+p.q?'q':x<p.v+p.q+p.e?'e':'s';});}
  // les épaves des modèles, posées dans leur fosse selon leur état
  G.epaves.forEach((e,k)=>{if(e.type!=='module')astroEpave(e,k);});}
// une épave dans sa fosse : terrain et tuiles selon l'état
function astroEpave(e,k){const t=G.t,m=e.type,br=epvBreche(m),ga=epvGarde(m);
  for(const [gx,gy,c] of epvCases(EPV_MODELES[m].g)){const x=e.x+gx,y=e.y+gy,i=idx(x,y),cle=gx+','+gy;
    G.epI[i]=k;G.epT[i]=`epv_${m}_${e.etat}_${gx}_${gy}`;
    if(e.etat==='s')t[i]=SHIP;
    else if(e.etat==='e')t[i]=br.has(cle)?(c==='D'?GROUND:RUBBLE):(c==='I'||c==='D')?GROUND:SHIP;
    else if(e.etat==='q')t[i]=ga.has(cle)?SHIP:Math.random()<.6?RUBBLE:GROUND;
    else if(Math.random()<.15)t[i]=RUBBLE;}}   // fosse vide : l'empreinte, quelques débris
// un module d'extérieur dans sa fosse ; ses coques (« K ») forment une épave sans modèle, numérotée avec les autres
function astroModule(P,ox,oy,fi,SOL){const t=G.t,n=Object.keys(G.epMod).length,kE=G.epaves.length,grille=[],marq=[];let coque=0;
  for(let y=0;y<P.h;y++){let l='';for(let x=0;x<P.w;x++){const ch=P.t[y][x],mk=P.m[y][x],i=idx(ox+x,oy+y);l+=ch==='K'?'H':'.';
    if(ch==='?')continue;const v=ch==='X'?WALL:ch==='V'?VITRE:SOL[ch];if(v==null)continue;
    t[i]=v;
    if(ch==='K'){coque++;G.epI[i]=kE;G.epT[i]=`epm_${n}_${x}_${y}`;}
    if(ch==='A')G.art[i]=0;
    if(mk==='m'&&canWalk(t[i],true)){t[i]=MACHINE;G.art[i]=rnd(0,9);}
    else if(mk==='b'||mk==='e')marq.push([i,mk]);}
    grille.push(l);}
  if(coque){G.epMod[n]=grille;G.fosses[fi].epave=kE;
    G.epaves.push({type:'module',nom:'ÉPAVE',etat:'q',num:0,x:ox,y:oy,w:P.w,h:P.h,fosse:fi,boite:-1,f:G.fosses[fi].f||0,mod:P.nom,groupes:[]});}
  if(marq.length){G.mods=G.mods||[];G.mods.push({nom:P.nom,marq,salle:null});}}
// butin et enregistreurs, une fois le butin ordinaire posé (niveau() remet G.items à zéro entre les deux)
function astroportFin(){if(!G.epaves||!G.epaves.length)return;const t=G.t;let boites=0;
  const scel=G.epaves.filter(e=>e.etat==='s'&&EPV_MODELES[e.type]);
  G.epaves.forEach((e,k)=>{if(!EPV_MODELES[e.type])return;const c=epvCases(EPV_MODELES[e.type].g).map(([gx,gy,ch])=>[idx(e.x+gx,e.y+gy),ch]);
    // éventrée : un abri, et quelque chose dedans
    if(e.etat==='e'){const sol=c.filter(([i])=>canWalk(t[i],true)&&!(G.items[i]&&G.items[i].length));
      if(sol.length&&Math.random()<.8){const i=sol[rnd(0,sol.length-1)][0];(G.items[i]=G.items[i]||[]).push(Math.random()<.6?consoTire():'matiere');}}
    else if(e.etat==='q'&&Math.random()<.25){const sol=c.filter(([i])=>canWalk(t[i],true));
      if(sol.length){const i=sol[rnd(0,sol.length-1)][0];(G.items[i]=G.items[i]||[]).push('matiere');}}
    // scellée : l'enregistreur de bord, dans la trappe (une sur deux, au moins une par carte) ; lisible au contact
    else if(e.etat==='s'){const d=c.find(([,ch])=>ch==='D');
      if(d&&(Math.random()<.5||(!boites&&e===scel[scel.length-1]))){t[d[0]]=TERMINAL;G.art[d[0]]={boite:k};e.boite=d[0];boites++;}}});}

/* ---------- Lecture ---------- */
const epaveA=i=>G&&G.epI&&G.epI[i]!=null?G.epaves[G.epI[i]]:null;
const fosseA=i=>G&&G.fosI&&G.fosI[i]!=null?G.fosses[G.fosI[i]]:null;
const epNom=e=>e.nom+' '+num4(e.num);
// la fiche d'inspection d'une case d'épave ou de fosse : [titre, texte], en relevé de la foreuse
function epaveFiche(i){const e=epaveA(i),F=e?G.fosses[e.fosse]:fosseA(i);
  if(e){const l=[e.etat==='v'?'EMPREINTE AU SOL. ENGIN ABSENT.':'STRUCTURE : VAISSEAU. HORS SERVICE. NON RÉPERTORIÉ.',
      `ÉTAT : ${EPV_ETATS[e.etat]}.${F?' FOSSE '+num2(F.num)+'.':''}`,
      {s:'COQUE INTACTE. ACCÈS SCELLÉ.',e:'COQUE OUVERTE. INTÉRIEUR ACCESSIBLE.',q:'STRUCTURE DÉPOUILLÉE. TRACES DE DÉCOUPE.',v:'TRACES DE TRAIN. DÉBRIS.'}[e.etat]];
    if(e.boite===i)l.push('ENREGISTREUR DE BORD. ALIMENTÉ. LECTURE AU CONTACT.');
    return [epNom(e),l.join(' ')];}
  if(F){const o=F.notre?`CARGO ${num4(EPV_UNITE)}. UNITÉ ${NOM_FOREUSE} EN SERVICE.`:F.epave>=0?epNom(G.epaves[F.epave])+'.':'AUCUN ENGIN.';
    return ['FOSSE '+num2(F.num),`AIRE D’ATTERRISSAGE. OCCUPATION : ${o}`];}
  return null;}
// texte d'un enregistreur d'épave scellée (l'étape des terminaux le réécrira)
function epaveBoite(k){const e=G.epaves[k];if(!e)return ['ENREGISTREUR','DONNÉES ILLISIBLES.'];const n=rnd(800,12000);
  return [epNom(e)+' — ENREGISTREUR',[`LARGAGE UNITÉ F.${num4(e.num)} ${epvMk(e.num)} : CONFORME.`,'ATTENTE RETOUR UNITÉ.','ATTENTE RETOUR UNITÉ.',
    `[${n.toLocaleString('fr-FR')} ENTRÉES IDENTIQUES]`,'DÉCOUPE DÉTECTÉE SUR COQUE. ATTENTE RETOUR UNITÉ.'].join('\n')];}
