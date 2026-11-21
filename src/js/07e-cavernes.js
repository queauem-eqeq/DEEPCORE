/* ---------- Réseau de cavernes (21 novembre 2026, refait le même jour) ----------
   Recette « cavernes » : tout est sous roche. La carte est d'abord découpée en SECTEURS (cavernes, bâti, roche pleine) ; les
   cavernes (automate cellulaire) sont creusées dans leurs secteurs, sans jamais se chevaucher et avec un écart de roche
   entre elles, puis grossies par leurs bords jusqu'à la surface demandée. Des boyaux sinueux les relient (arbre couvrant,
   boucles, culs-de-sac). ZONE vaut 0 dans les cavernes et les boyaux (l'« extérieur » de cette recette) et 1 dans la roche :
   distExt() donne donc la distance à la caverne la plus proche. Les bâtiments sont ensuite enchâssés dans les secteurs bâtis
   (07b, mode `cav`) avec une porte qui regarde vers une caverne, reliée à elle par un petit boyau (reliePortes).
   Avant ce jour : les cavernes étaient posées n'importe où et se fondaient en une seule masse ; le curseur « nombre de
   cavernes » n'avait presque aucun effet et les bâtiments restaient au bord de la carte. */
let SECT=null,CVT=null;   // SECT : rôle de chaque case (0 cavernes, 1 bâti, 2 roche pleine) ; CVT : ce que ce tirage visait (part, nombre, bâtiments, surface)
const CV_DISPO=['mel','cote','cite','cav'];
// Découpe la carte en secteurs aux bords irréguliers et donne à chacun un rôle. sC, sB : part de la carte à réserver aux
// cavernes et au bâti ; le reste est de la roche pleine. La disposition dit où vont les uns et les autres.
function secteurs(sC,sB){
  const N=W*H,nS=Math.max(6,Math.min(18,Math.round(N/400))),gr=[];
  for(let n=0;n<nS;n++){let best=null,bd=-1;   // germes bien étalés : le meilleur de douze tirages
    for(let k=0;k<12;k++){const p=[rnd(4,W-5),rnd(4,H-5)];let d=1e9;for(const g of gr)d=Math.min(d,Math.hypot(g[0]-p[0],g[1]-p[1]));if(d>bd){bd=d;best=p;}}
    gr.push(best);}
  const n1=noise(SZ(9,4)),n2=noise(SZ(9,4)),de=new Uint8Array(N),aire=new Array(nS).fill(0),amp=SZ(12,4);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const a=x+(n1(x,y)-.5)*amp,b=y+(n2(x,y)-.5)*amp;let s=0,bd=1e9;   // la case est déplacée par un bruit avant de chercher son germe : frontières sinueuses
    for(let k=0;k<nS;k++){const d=Math.hypot(gr[k][0]-a,gr[k][1]-b);if(d<bd){bd=d;s=k;}}
    de[idx(x,y)]=s;aire[s]++;}
  const dispo=CV_DISPO.includes(GEN.cvDispo)?GEN.cvDispo:CV_DISPO[rnd(0,3)],mx=(W-1)/2,my=(H-1)/2,
    ang=(Math.random()<.75?0:1.571)+(Math.random()<.5?3.1416:0)+(Math.random()-.5)*.5,
    cle=g=>dispo==='cote'?(g[0]-mx)*Math.cos(ang)+(g[1]-my)*Math.sin(ang):dispo==='mel'?Math.random():Math.hypot((g[0]-mx)/W,(g[1]-my)/H),
    ord=gr.map((g,i)=>[cle(g),i]).sort((a,b)=>a[0]-b[0]).map(v=>v[1]),role=new Uint8Array(nS).fill(2);
  // « cité au centre » : le bâti prend les secteurs du milieu, les cavernes l'anneau suivant ; les autres dispositions servent
  // d'abord les cavernes. « un côté chacun » : le bâti est pris par l'autre bout de la liste.
  const un=dispo==='cite'?1:0,deux=1-un,besoin=[sC*N,sB*N];let k=0,a=0;
  while(k<nS-1&&(a<besoin[un]||!k)){role[ord[k]]=un;a+=aire[ord[k]];k++;}
  if(dispo==='cote'){let j=nS-1;a=0;while(j>=k&&(a<besoin[deux]||j===nS-1)){role[ord[j]]=deux;a+=aire[ord[j]];j--;}}
  else{const k0=k;a=0;while(k<nS&&(a<besoin[deux]||k===k0)){role[ord[k]]=deux;a+=aire[ord[k]];k++;}}
  SECT=new Uint8Array(N);for(let i=0;i<N;i++)SECT[i]=role[de[i]];
  return dispo;}
// Une forme de caverne d'environ `a` cases : un disque déformé par un bruit (lobes et échancrures), puis lissé par un automate
// cellulaire. f = 0 : ronde ; f = 1 : déchiquetée. Le cadre est ajusté jusqu'à ce que la surface obtenue soit proche de celle demandée.
function caForme(a,f,nz){
  const asp=1+Math.random()*(.3+f*.7),ox=rnd(0,W),oy=rnd(0,H),amp=.35+f*1.25,pas=.55+Math.random()*.9;let boite=a/.42,cells=[],w=0,h=0;
  for(let essai=0;essai<4;essai++){
    w=Math.max(5,Math.min(W-6,Math.round(Math.sqrt(boite*asp))));h=Math.max(4,Math.min(H-6,Math.round(boite/w)));
    let g=new Uint8Array(w*h);const cx=(w-1)/2,cy=(h-1)/2;
    for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const r=Math.hypot((x-cx)/(w/2),(y-cy)/(h/2));
      g[y*w+x]=r<.66+(nz((x*pas+ox)%W,(y*pas+oy)%H)-.5)*amp+(Math.random()-.5)*(.1+f*.3)?1:0;}
    for(let it=0,ni=f>.75?1:2;it<ni;it++){const n=new Uint8Array(w*h);
      for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){let c=0;for(const [dx,dy] of DIRS)c+=g[(y+dy)*w+x+dx];n[y*w+x]=g[y*w+x]?(c>=4?1:0):(c>=5?1:0);}
      g=n;}
    const vu=new Uint8Array(w*h);cells=[];   // le plus gros morceau
    for(let i=0;i<w*h;i++){if(!g[i]||vu[i])continue;const q=[i];vu[i]=1;
      for(let k=0;k<q.length;k++){const c=q[k],x=c%w,y=(c/w)|0;for(const [dx,dy] of D4){const p=x+dx,r=y+dy;if(p<0||r<0||p>=w||r>=h)continue;const j=r*w+p;if(g[j]&&!vu[j]){vu[j]=1;q.push(j);}}}
      if(q.length>cells.length)cells=q;}
    if(cells.length>=a*.8&&cells.length<=a*1.2)break;
    boite*=Math.max(.4,Math.min(2.5,a/Math.max(1,cells.length)));}
  return {w,h,cells:cells.map(c=>[c%w,(c/w)|0])};}
function cavernes(t){
  const N=W*H,z=new Uint8Array(N).fill(1);t.fill(MOUNT);
  const borne=(v,a,b)=>Math.max(a,Math.min(b,v)),ech=Math.max(.3,Math.min(1,N/6144)),   // les tailles du menu sont en cases ; sur une carte plus petite que la taille 4 elles sont réduites en proportion
    part=borne(autour('cvPart',.08)/100,.08,.62),cible=N*part,ec=borne(Math.round(GEN.cvEcart||3),1,8),f=borne((GEN.cvForme??50)/100,0,1),
    taille=Math.max(16,autour('cvTaille',.15)*ech),nb=borne(Math.round(cible/taille),1,30),surf=borne(autour('cvSurf',.1)/100,.03,.45);
  // place à réserver : une caverne et son écart de roche ne remplissent pas tout leur secteur, un bâtiment non plus
  {const r=Math.sqrt(cible/nb/3.1416),dC=borne(Math.pow(r/(r+ec/2),2)*.8,.25,.62);let sC=part/dC*1.3,sB=surf/.38;const s=sC+sB;if(s>.95){sC*=.95/s;sB*=.95/s;}
    CVT={part:100*part,nb,surf:100*surf,bati:0,dispo:secteurs(sC,sB)};}
  const haut=(x,y)=>x>=2&&y>=2&&x<W-2&&y<H-2,ouvre=(x,y)=>{if(haut(x,y)){const i=idx(x,y);t[i]=GROUND;z[i]=0;}};
  const lab=new Uint8Array(N),occ=new Uint8Array(N),cen=[],cav=[];   // lab : numéro de caverne (à partir de 1) ; occ : à moins de `ec` cases d'une caverne posée
  const v=borne((GEN.cvVar??40)/100,0,1),poids=Array.from({length:nb},()=>Math.exp((Math.random()*2-1)*1.3*v)).sort((a,b)=>b-a),ps=poids.reduce((a,b)=>a+b,0);
  let tot=0;const nf=noise(SZ(6,3)),ng=noise(SZ(4,2));
  for(let n=0;n<nb;n++){   // les plus grandes d'abord ; une caverne qui ne tient nulle part est réduite, le complément rattrapera la surface
    let a=cible*.88*poids[n]/ps,pose=false;
    for(let essai=0;essai<5&&!pose&&a>=10;essai++,a*=.72){
      const {w,h,cells}=caForme(a,f,nf);if(cells.length<8)continue;
      let best=null,bd=-1;
      for(let k=0;k<140;k++){const x0=rnd(2,Math.max(2,W-w-2)),y0=rnd(2,Math.max(2,H-h-2));let ok=true;
        for(const [x,y] of cells){const X=x0+x,Y=y0+y;if(!haut(X,Y)){ok=false;break;}const i=idx(X,Y);if(SECT[i]||occ[i]){ok=false;break;}}
        if(!ok)continue;const cx=x0+w/2,cy=y0+h/2;let d=1e9;for(const c of cen)d=Math.min(d,Math.hypot(c[0]-cx,c[1]-cy));d+=Math.random()*6;if(d>bd){bd=d;best=[x0,y0];}}
      if(!best)continue;pose=true;
      const [x0,y0]=best,id=cen.length+1,liste=[];let sx=0,sy=0;
      for(const [x,y] of cells){const X=x0+x,Y=y0+y,i=idx(X,Y);ouvre(X,Y);lab[i]=id;liste.push(i);sx+=X;sy+=Y;
        for(let dy=-ec;dy<=ec;dy++)for(let dx=-ec;dx<=ec;dx++){const p=X+dx,q=Y+dy;if(p>=0&&q>=0&&p<W&&q<H)occ[idx(p,q)]=1;}}
      const mx=sx/cells.length,my=sy/cells.length;let c0=liste[0],cd=1e9;   // la case de la caverne la plus proche de son centre
      for(const i of liste){const d=Math.hypot(i%W-mx,((i/W)|0)-my);if(d<cd){cd=d;c0=i;}}
      cen.push([c0%W,(c0/W)|0]);cav.push(liste);tot+=liste.length;}}
  if(!cen.length){const x=W>>1,y=H>>1;const liste=[];for(let dy=-3;dy<=3;dy++)for(let dx=-4;dx<=4;dx++){ouvre(x+dx,y+dy);lab[idx(x+dx,y+dy)]=1;liste.push(idx(x+dx,y+dy));}cen.push([x,y]);cav.push(liste);tot=liste.length;}
  // complément : les cavernes grossissent par leurs bords, dans leurs secteurs et sans s'approcher d'une autre, jusqu'à la surface demandée
  {const loin=(x,y,id)=>{for(let dy=-ec;dy<=ec;dy++)for(let dx=-ec;dx<=ec;dx++){const p=x+dx,q=y+dy;if(p<0||q<0||p>=W||q>=H)continue;const l=lab[idx(p,q)];if(l&&l!==id)return false;}return true;};
    for(let passe=0,vide=0;passe<160&&tot<cible&&vide<3;passe++){const plus=[];
      for(let y=2;y<H-2;y++)for(let x=2;x<W-2;x++){const i=idx(x,y);if(!z[i]||SECT[i])continue;let id=0,n8=0;
        for(const [dx,dy] of D4){const l=lab[idx(x+dx,y+dy)];if(l){id=l;break;}}
        if(!id)continue;for(const [dx,dy] of DIRS)if(lab[idx(x+dx,y+dy)]===id)n8++;
        if(n8>=(vide?1:f<.5?3:2)&&Math.random()<(vide?.5:.06+.8*Math.pow(ng(x,y),2))&&loin(x,y,id))plus.push([i,id]);}   // le bruit fait pousser des lobes plutôt qu'un bord régulier
      if(!plus.length){vide++;continue;}vide=0;plus.sort(()=>Math.random()-.5);
      for(const [i,id] of plus){if(tot>=cible)break;t[i]=GROUND;z[i]=0;lab[i]=id;cav[id-1].push(i);tot++;}}}
  CVT.nbPose=cen.length;
  // boyau : chemin le moins cher dans un bruit, du bord de la caverne `ka` jusqu'à la première case qui vérifie `but` ; la
  // sinuosité règle le poids du bruit ; traverser un secteur bâti coûte cher (la place est pour les bâtiments)
  const sinu=borne((GEN.cvSinu??50)/100,0,1),nz=noise(SZ(5,2)),bruit=new Float32Array(N);
  for(let i=0;i<N;i++)bruit[i]=(1+sinu*(nz(i%W,(i/W)|0)*7+Math.random()*2))*(SECT[i]===1?5:1);
  const boyau=(ka,but,larg)=>{const d=new Float64Array(N).fill(1e9),from=new Int32Array(N).fill(-1),h=heap();let fin=-1;
    for(const i of cav[ka]){d[i]=0;h.push(i,0);}
    while(h.size){const [c0,c]=h.pop();if(c0>d[c])continue;if(but(c)){fin=c;break;}const x=c%W,y=(c/W)|0;
      for(const [dx,dy] of D4){if(!haut(x+dx,y+dy))continue;const j=idx(x+dx,y+dy),nd=c0+(z[j]?bruit[j]:.4);if(nd<d[j]){d[j]=nd;from[j]=c;h.push(j,nd);}}}
    for(let c=fin,k=0;c>=0;c=from[c],k++){if(!z[c])continue;const x=c%W,y=(c/W)|0;ouvre(x,y);
      if(larg>1&&Math.random()<.55){const [dx,dy]=D4[rnd(0,3)];ouvre(x+dx,y+dy);if(larg>2&&Math.random()<.6)ouvre(x-dx,y-dy);}}
    return fin>=0;};
  const largeur=()=>{const l=borne(Math.round(GEN.cvLarg||1),1,3);return Math.max(1,l-(Math.random()<.4?1:0));};
  // arbre couvrant (Prim) entre les centres, puis quelques boucles
  const dans=[0],reste=cen.map((_,i)=>i).slice(1),arcs=[];
  while(reste.length){let bi=-1,bj=-1,bd=1e9;for(const i of dans)for(const j of reste){const d=Math.hypot(cen[i][0]-cen[j][0],cen[i][1]-cen[j][1]);if(d<bd){bd=d;bi=i;bj=j;}}
    arcs.push([bi,bj]);dans.push(bj);reste.splice(reste.indexOf(bj),1);}
  for(const [i,j] of arcs){boyau(i,c=>lab[c]===j+1,largeur());}
  const nbBoucles=Math.round(autour('cvBoyaux',.2));
  for(let k=0;k<nbBoucles&&cen.length>2;k++){const i=rnd(0,cen.length-1);let bj=-1,bd=1e9;
    for(let j=0;j<cen.length;j++){if(j===i||arcs.some(a=>(a[0]===i&&a[1]===j)||(a[0]===j&&a[1]===i)))continue;const d=Math.hypot(cen[i][0]-cen[j][0],cen[i][1]-cen[j][1]);if(d<bd){bd=d;bj=j;}}
    if(bj>=0){arcs.push([i,bj]);boyau(i,c=>lab[c]===bj+1,largeur());}}
  // culs-de-sac : un boyau parti d'une caverne vers un point de roche pleine, à 8 à 18 cases
  for(let k=0,n=Math.round(autour('cvCuls',.25));k<n;k++){const ka=rnd(0,cen.length-1);
    for(let e=0;e<25;e++){const c=cav[ka][rnd(0,cav[ka].length-1)],a=Math.random()*6.283,L=SZ(rnd(8,18),5),
        x=Math.round(c%W+Math.cos(a)*L),y=Math.round(((c/W)|0)+Math.sin(a)*L);
      if(x<3||y<3||x>=W-3||y>=H-3)continue;const b=idx(x,y);if(!z[b]||occ[b]||SECT[b]===1)continue;
      boyau(ka,c=>c===b,1);break;}}
  ZINFO={f:()=>0,cut:0,forme:'cavernes'};
  return z;}
// Ce que la carte a donné, à comparer à ce qui était visé : part de cavernes, nombre de cavernes, bâtiments, surface bâtie.
// Renvoie l'écart (0 = conforme) : niveau() garde la meilleure de quelques cartes.
function cvBilan(){
  const N=W*H;let n=0;for(let i=0;i<N;i++)if(!ZONE[i])n++;
  const o=G.obt={cav:100*n/N,nb:CVT.nbPose,bat:G.batis.length,surf:G.batis.reduce((a,b)=>a+b.cases,0)*100/N,vise:{cav:CVT.part,nb:CVT.nb,bat:CVT.bati,surf:CVT.surf},dispo:CVT.dispo};
  return Math.abs(o.cav-CVT.part)/2.5+Math.abs(o.nb-CVT.nb)/Math.max(2,CVT.nb/4)+Math.abs(o.bat-CVT.bati)*1.5+Math.abs(o.surf-CVT.surf)/2.5+(o.bat?0:10);}
// Relie chaque porte à la caverne la plus proche par un boyau étroit et sinueux, creusé dans la roche (chemin le moins cher dans un
// bruit, loin des autres bâtiments). Renvoie faux si une porte ne trouve pas de caverne.
function reliePortes(t,B,strs){
  const N=W*H,pied=B.pied,bruit=new Float64Array(N);for(let i=0;i<N;i++)bruit[i]=Math.random()*1.6;
  const cave=j=>!ZONE[j]&&!blocks(t[j])&&!isWater(t[j])&&!B.own[j]&&!pied[j],tun={};let n=0;
  for(const S of strs)for(const e of S.entrees){
    const d=new Float64Array(N).fill(1e9),from=new Int32Array(N).fill(-1),h=heap();d[e.o]=0;h.push(e.o,0);let fin=-1;
    while(h.size){const [c0,c]=h.pop();if(c0>d[c])continue;if(cave(c)&&c!==e.o){fin=c;break;}
      const x=c%W,y=(c/W)|0;
      for(const [dx,dy] of D4){const a=x+dx,b=y+dy;if(a<2||b<2||a>=W-2||b>=H-2)continue;const j=idx(a,b);
        if(pied[j]||B.own[j]||t[j]===WALL||t[j]===DOOR)continue;const v=t[j];if(v!==MOUNT&&!cave(j)&&!(v===GROUND||v===GRASS||v===FLAT))continue;
        const nd=c0+1+(v===MOUNT?bruit[j]:0);if(nd<d[j]){d[j]=nd;from[j]=c;h.push(j,nd);}}}
    if(fin<0)return false;
    for(let c=fin;c>=0&&c!==e.o;c=from[c]){if(t[c]===MOUNT){t[c]=GROUND;tun[c]=1;n++;}}
    if(blocks(t[e.o])||t[e.o]===MOUNT){t[e.o]=GROUND;tun[e.o]=1;n++;}}
  G.tun=tun;G.tunN=n;G.tunS=0;return true;}
