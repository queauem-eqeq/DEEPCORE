/* Planche de propositions : texture du sol (16 novembre 2026).
 * Six variantes de grain et de nuances, rendues à l'échelle du jeu avec la palette en cours.
 * À rejouer :  python3 outils/planche.py planches/sol-grain.js DOSSIER/planche.png
 * Le script dessine un canvas #planche par-dessus la page, que l'outil photographie.
 */
(()=>{
  const S0=32,CW=15,CH=9,PW=CW*S0,PH=CH*S0,GAP=22,TOP=30,COLS=3,ROWS=2;
  const cv=document.createElement('canvas');cv.id='planche';
  cv.width=COLS*PW+(COLS+1)*GAP;cv.height=ROWS*(PH+TOP)+(ROWS+1)*GAP;
  Object.assign(cv.style,{position:'fixed',left:'0',top:'0',zIndex:9999,background:'#06100e'});
  document.body.appendChild(cv);const c=cv.getContext('2d');c.imageSmoothingEnabled=false;
  const h2=(x,y,k)=>{let n=((x*73856093)^(y*19349663)^(k*83492791))>>>0;n^=n<<13;n>>>=0;n^=n>>17;n^=n<<5;n>>>=0;return n/4294967296;};
  const lisse=(x,y,sc)=>{const X=x/sc,Y=y/sc,x0=Math.floor(X),y0=Math.floor(Y),tx=X-x0,ty=Y-y0,sx=tx*tx*(3-2*tx),sy=ty*ty*(3-2*ty),v=(i,j)=>h2(i,j,7);
    return (v(x0,y0)*(1-sx)+v(x0+1,y0)*sx)*(1-sy)+(v(x0,y0+1)*(1-sx)+v(x0+1,y0+1)*sx)*sy;};
  // une case de sol : voile de couleur monde à 8 %, puis le grain de la variante
  function caseSol(px,py,x,y,v){
    const n=v.nuance?v.nuance(x,y):null;
    c.globalAlpha=.08;c.fillStyle=n||PAL['3'];c.fillRect(px,py,S0,S0);
    if(!v.grain)return;const g=v.grain(x,y);const u=S0/16;
    for(const [gx,gy,a] of g){c.globalAlpha=a;c.fillStyle=n||PAL['3'];c.fillRect(px+gx*u,py+gy*u,u,u);}}
  const pts=(x,y,n,a,k)=>{const l=[];for(let i=0;i<n;i++)l.push([Math.floor(h2(x,y,k+i*3)*16),Math.floor(h2(x,y,k+i*3+1)*16),a]);return l;};
  const nuanceDouce=(x,y)=>teinter(PAL['3'],(lisse(x,y,14)-.5)*8,(lisse(x+99,y,12)-.5)*4,(lisse(x,y+99,16)-.5)*26);
  const nuanceForte=(x,y)=>teinter(PAL['3'],(lisse(x,y,10)-.5)*16,(lisse(x+99,y,9)-.5)*8,(lisse(x,y+99,12)-.5)*50);
  const VAR=[
    {n:'1 · Uni (actuel)'},
    {n:'2 · Grain fin',grain:(x,y)=>pts(x,y,3,.10,1)},
    {n:'3 · Grain fin + nuances douces',grain:(x,y)=>pts(x,y,3,.10,1),nuance:nuanceDouce},
    {n:'4 · Grain à deux niveaux',grain:(x,y)=>[...pts(x,y,2,.15,1),...pts(x,y,5,.055,9)],nuance:nuanceDouce},
    {n:'5 · Plaques rugueuses',nuance:nuanceDouce,grain:(x,y)=>pts(x,y,Math.round(lisse(x,y,5)*11),.085,5)},
    {n:'6 · Nuances marquées + grain',nuance:nuanceForte,grain:(x,y)=>pts(x,y,3,.10,1)},
  ];
  c.font='13px JetBrains Mono, monospace';
  VAR.forEach((v,i)=>{const cx=GAP+(i%COLS)*(PW+GAP),cy=GAP+Math.floor(i/COLS)*(PH+TOP+GAP);
    c.globalAlpha=1;c.fillStyle='#cfe3dd';c.fillText(v.n,cx,cy+16);
    c.fillStyle='#06100e';c.fillRect(cx,cy+TOP,PW,PH);
    for(let y=0;y<CH;y++)for(let x=0;x<CW;x++)caseSol(cx+x*S0,cy+TOP+y*S0,x+i*31,y+i*17,v);
    // un repère : rocher, herbes et la foreuse, pour juger du contraste
    c.globalAlpha=1;
    c.drawImage(TL.rock,cx+1*S0,cy+TOP+1*S0,S0,S0);
    c.drawImage(TL.mtTop,cx+2*S0,cy+TOP+1*S0,S0,S0);
    c.globalAlpha=.45;c.drawImage(TL.grass0,cx+4*S0,cy+TOP+4*S0,S0,S0);c.drawImage(TL.grass0,cx+5*S0,cy+TOP+4*S0,S0,S0);
    c.globalAlpha=.38;c.drawImage(TL.flat0,cx+6*S0,cy+TOP+4*S0,S0,S0);
    c.globalAlpha=1;c.drawImage(TL.robot_u,cx+10*S0,cy+TOP+2*S0,S0,S0);
    c.strokeStyle='#1e2b28';c.strokeRect(cx+.5,cy+TOP+.5,PW-1,PH-1);});
  return cv.width+'x'+cv.height;})()
