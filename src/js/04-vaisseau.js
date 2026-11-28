/* ---------- Vaisseau Cargo (modèle A) ---------- */
// Cases : H coque, I soute (praticable), D porte arrière (praticable), E réacteur (coque), . vide. Nez vers le haut.
// Seules 3 cases sont praticables (2 de soute + la porte), toutes entourées de coque : aucun passage en diagonale possible.
const SHIP_GRID=['..H..','.HHH.','HHIHH','HHIHH','.HDH.','.E.E.'],SGW=5,SGH=6;
const SHIP_KEYS=[];for(let cy=0;cy<SGH;cy++)for(let cx=0;cx<SGW;cx++)if(SHIP_GRID[cy][cx]!=='.')SHIP_KEYS.push('ship_'+cx+'_'+cy);
function shipPixels(g){
  const SH=new Set(['H','I','D','E','P']),cw=g[0].length,ch=g.length,W2=cw*16,H2=ch*16,cell=(cx,cy)=>(g[cy]||'')[cx]||'.',
    isS=(cx,cy)=>SH.has(cell(cx,cy));
  const mask=Array.from({length:H2},()=>new Uint8Array(W2));
  for(let cy=0;cy<ch;cy++)for(let cx=0;cx<cw;cx++){const t=cell(cx,cy);if(!SH.has(t))continue;
    for(let j=0;j<16;j++)for(let i=0;i<16;i++){let on=true;
      if(t==='E')on=j<10?(i>=3&&i<=12):(i>=5&&i<=10)&&j<=13;
      else{const cut=(ox,oy,ax,ay)=>!isS(cx+ox,cy)&&!isS(cx,cy+oy)&&!isS(cx+ox,cy+oy)&&(ax+ay)<5;
        if(cut(-1,-1,i,j)||cut(1,-1,15-i,j)||cut(-1,1,i,15-j)||cut(1,1,15-i,15-j))on=false;}
      if(on)mask[cy*16+j][cx*16+i]=1;}}
  const px=Array.from({length:H2},()=>Array(W2).fill('.')),inM=(x,y)=>x>=0&&y>=0&&x<W2&&y<H2&&mask[y][x];
  const floor=Array.from({length:H2},()=>new Uint8Array(W2));
  for(let cy=0;cy<ch;cy++)for(let cx=0;cx<cw;cx++){const t=cell(cx,cy);if(t!=='I'&&t!=='D')continue;const up=cell(cx,cy-1),dn=cell(cx,cy+1);
    for(let j=0;j<16;j++)for(let i=3;i<=12;i++){if(j<3&&up!=='I'&&up!=='D')continue;if(t==='D'&&j>12)continue;
      if(t==='I'&&j>12&&dn!=='I'&&dn!=='D')continue;floor[cy*16+j][cx*16+i]=1;}}
  for(let y=0;y<H2;y++)for(let x=0;x<W2;x++){if(!mask[y][x])continue;
    const cx=(x/16)|0,cy=(y/16)|0,lx=x%16,ly=y%16,t=cell(cx,cy);
    if(!inM(x-1,y)||!inM(x+1,y)||!inM(x,y-1)||!inM(x,y+1)){px[y][x]='1';continue;}
    if(floor[y][x]){px[y][x]=(lx%4===1&&ly%4===1)?'2':'0';continue;}
    if([[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>floor[y+dy]&&floor[y+dy][x+dx])){px[y][x]='1';continue;}
    if((lx===0&&isS(cx-1,cy)||ly===0&&isS(cx,cy-1))&&(x+y)%2===0){px[y][x]='2';continue;}
    if(t==='H'&&(lx===3||lx===12)&&(ly===3||ly===12)){px[y][x]='2';continue;}
    px[y][x]='0';}
  for(let cy=0;cy<ch;cy++)for(let cx=0;cx<cw;cx++){const t=cell(cx,cy);
    if(t==='D')for(let j=13;j<=15;j++)for(let i=4;i<=11;i++)px[cy*16+j][cx*16+i]=(j===14||i%3===0)?'3':'0';
    if(t==='E')for(let j=10;j<=13;j++)for(let i=6;i<=9;i++)px[cy*16+j][cx*16+i]=j===13?'1':(i===6||i===9)?'2':'0';}
  // verrière dans la première case de la colonne du couloir (le nez), même si le haut du couloir est de la coque
  const top=g.findIndex(r=>r.includes('I')),tx=g[top].indexOf('I'),ny=g.findIndex(r=>r[tx]!=='.');
  if(ny>=0){const narrow=cell(tx-1,ny)!=='H';
    for(let j=narrow?8:7;j<=13;j++)for(let i=5;i<=10;i++){const k=narrow?(j-8):(j-7);
      if(Math.abs(i-7.5)<=k*0.6+1.2)px[ny*16+j][tx*16+i]=(i===6&&j===(narrow?10:9))?'w':'2';}}
  return px.map(r=>r.join(''));}


/* ---------- Épaves de l'Astroport (28 novembre 2026) ----------
   Les engins arrivés avant nous, de plusieurs générations. Chaque modèle est une grille comme celle du cargo (H coque, I intérieur,
   D trappe, E réacteur) ; son dessin d'ensemble (« epv_<modèle> ») est tiré de la grille par epvPixels, dans les couleurs ternies
   de la palette (contour monde, rivets et trappe en bâti), et se retouche dans le Tile editor comme le cargo. Les quatre états
   (scellée, éventrée, squelette, fosse vide) sont dérivés de ce dessin, pixel par pixel (07h-astroport) : une retouche les suit.
   gen : génération de l'engin (1 la plus ancienne) ; p : poids au tirage. */
const EPV_MODELES={
  sonde:{n:'SONDE',g:['.H.','HHH','.E.'],gen:1,p:3},
  capsule:{n:'CAPSULE',g:['.H.','HIH','HDH','E.E'],gen:1,p:3},
  porteur:{n:'PORTEUR',g:['.HH.','HHHH','HIIH','HHDH','E..E'],gen:2,p:3},
  cargo:{n:'CARGO',g:['..H..','.HHH.','HHIHH','HHIHH','.HDH.','.E.E.'],gen:3,p:2},
  grand:{n:'GRAND PORTEUR',g:['..HH..','.HHHH.','HHIIHH','HHIIHH','HHIIHH','HHHDHH','.E..E.'],gen:2,p:1}};
const EPV_CLES=Object.keys(EPV_MODELES);
// le dessin d'une grille d'engin, à la manière de shipPixels (le cargo), dans d'autres encres ; sans intérieur, pas de verrière
function epvPixels(g,o){o=Object.assign({bord:'3',rivet:'5',sol:'5',porte:'5',verre:'3'},o||{});
  const SH=new Set(['H','I','D','E']),cw=Math.max(...g.map(r=>r.length)),ch=g.length,W2=cw*16,H2=ch*16,cell=(cx,cy)=>(g[cy]||'')[cx]||'.',
    isS=(cx,cy)=>SH.has(cell(cx,cy));
  const mask=Array.from({length:H2},()=>new Uint8Array(W2));
  for(let cy=0;cy<ch;cy++)for(let cx=0;cx<cw;cx++){const t=cell(cx,cy);if(!SH.has(t))continue;
    for(let j=0;j<16;j++)for(let i=0;i<16;i++){let on=true;
      if(t==='E')on=j<10?(i>=3&&i<=12):(i>=5&&i<=10)&&j<=13;
      else{const cut=(ox,oy,ax,ay)=>!isS(cx+ox,cy)&&!isS(cx,cy+oy)&&!isS(cx+ox,cy+oy)&&(ax+ay)<5;
        if(cut(-1,-1,i,j)||cut(1,-1,15-i,j)||cut(-1,1,i,15-j)||cut(1,1,15-i,15-j))on=false;}
      if(on)mask[cy*16+j][cx*16+i]=1;}}
  const px=Array.from({length:H2},()=>Array(W2).fill('.')),inM=(x,y)=>x>=0&&y>=0&&x<W2&&y<H2&&mask[y][x];
  const floor=Array.from({length:H2},()=>new Uint8Array(W2));
  for(let cy=0;cy<ch;cy++)for(let cx=0;cx<cw;cx++){const t=cell(cx,cy);if(t!=='I'&&t!=='D')continue;const up=cell(cx,cy-1),dn=cell(cx,cy+1);
    for(let j=0;j<16;j++)for(let i=3;i<=12;i++){if(j<3&&up!=='I'&&up!=='D')continue;if(t==='D'&&j>12)continue;
      if(t==='I'&&j>12&&dn!=='I'&&dn!=='D')continue;floor[cy*16+j][cx*16+i]=1;}}
  for(let y=0;y<H2;y++)for(let x=0;x<W2;x++){if(!mask[y][x])continue;
    const cx=(x/16)|0,cy=(y/16)|0,lx=x%16,ly=y%16,t=cell(cx,cy);
    if(!inM(x-1,y)||!inM(x+1,y)||!inM(x,y-1)||!inM(x,y+1)){px[y][x]=o.bord;continue;}
    if(floor[y][x]){px[y][x]=(lx%4===1&&ly%4===1)?o.sol:'0';continue;}
    if([[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>floor[y+dy]&&floor[y+dy][x+dx])){px[y][x]=o.bord;continue;}
    if((lx===0&&isS(cx-1,cy)||ly===0&&isS(cx,cy-1))&&(x+y)%2===0){px[y][x]=o.rivet;continue;}
    if(t==='H'&&(lx===3||lx===12)&&(ly===3||ly===12)){px[y][x]=o.rivet;continue;}
    px[y][x]='0';}
  for(let cy=0;cy<ch;cy++)for(let cx=0;cx<cw;cx++){const t=cell(cx,cy);
    if(t==='D')for(let j=13;j<=15;j++)for(let i=4;i<=11;i++)px[cy*16+j][cx*16+i]=(j===14||i%3===0)?o.porte:'0';
    if(t==='E')for(let j=10;j<=13;j++)for(let i=6;i<=9;i++)px[cy*16+j][cx*16+i]=j===13?o.bord:(i===6||i===9)?o.rivet:'0';}
  const top=g.findIndex(r=>r.includes('I'));
  if(top>=0){const tx=g[top].indexOf('I'),ny=g.findIndex(r=>r[tx]!=='.'&&r[tx]!=null);
    if(ny>=0){const narrow=cell(tx-1,ny)!=='H';
      for(let j=narrow?8:7;j<=13;j++)for(let i=5;i<=10;i++){const k=narrow?(j-8):(j-7);
        if(Math.abs(i-7.5)<=k*0.6+1.2)px[ny*16+j][tx*16+i]=o.verre;}}}
  else{const c=Math.floor(cw/2);for(let j=5;j<=10;j++)for(let i=5;i<=10;i++)   // sonde : une coupole de capteurs au centre
    if(Math.hypot(i-7.5,j-7.5)<=2.6)px[Math.floor(ch/2)*16+j][c*16+i]=Math.hypot(i-7.5,j-7.5)<=1.2?o.rivet:o.verre;}
  return px.map(r=>r.join(''));}
// Plaque de coque (modules « K ») et marquages des fosses d'atterrissage : tuiles 16 × 16 ordinaires, retouchables
PAT.coque=['3333333333333333','3000000000000003','3050000000000503','3000000000000003','3000000000000003','3000555555550003',
  '3000000000000003','3000000000000003','3000000000000003','3000000000000003','3000555555550003','3000000000000003',
  '3000000000000003','3050000000000503','3000000000000003','3333333333333333'];
PAT.fosseSol=['................','................','................','.......5........','................','................',
  '................','................','................','................','................','...............5',
  '................','................','................','................'];
PAT.fosseBord=['................','..5.........5...','................','................','................','................',
  '................','.......5........','................','................','................','................',
  '................','..5.........5...','................','................'];
