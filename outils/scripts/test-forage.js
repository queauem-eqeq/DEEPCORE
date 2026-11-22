/* Essais du mini-jeu de la seconde descente (14b-forage) : la scène est jouée en accéléré, image par image, par trois pilotes —
   aucun (la foreuse descend sans être dirigée), « maladroit » (réagit tard, une fois sur deux) et « attentif » (s'écarte de
   chaque mine sur sa route). window.TF = {k} : descentes par pilote. Renvoie mines touchées, vie perdue, morts et durée. */
(() => {
  const K=(window.TF||{}).k||20,out=[],raf=window.requestAnimationFrame;window.requestAnimationFrame=()=>0;
  const attentif=(F,retard,p)=>{F.kl=F.kr=0;if(F.ph!==1)return;let pire=null;
    for(const m of F.mines){if(!m.ok||m.y<=F.d||m.y>F.d+F.R*retard)continue;const tps=(m.y-F.d)/Math.max(6,F.vy),dx=m.x-(F.cx+F.vx*tps*.5);if(Math.abs(dx)<FG_R+1.5&&(!pire||m.y<pire.m.y))pire={m,dx};}
    if(!pire||Math.random()>p)return;
    // de quel côté s'écarter : à l'opposé de la mine, sauf si une autre mine de la même rangée s'y trouve
    let cote=pire.dx>=0?-1:1;const autre=F.mines.find(m=>m.ok&&m!==pire.m&&Math.abs(m.y-pire.m.y)<=3&&Math.sign(m.x-pire.m.x)===cote&&Math.abs(m.x-pire.m.x)<14);if(autre)cote=-cote;
    if(cote<0)F.kl=1;else F.kr=1;};
  const pilotes=[['aucun pilote',null],['maladroit',F=>attentif(F,.3,.5)],['attentif',F=>attentif(F,.68,1)]];
  for(const [nom,bot] of pilotes){let touche=0,perdu=0,morts=0,duree=0,mines=0,fins=0;
    for(let k=0;k<K;k++){G.over=null;G.st.vie=G.st.vieMax=100;FORAGE=null;let fin=0;playForage(()=>{fin=1;},2);const F=FORAGE;F.sansRendu=1;let now=F.t0,n=0;
      while(FORAGE&&n++<1500){now+=33;if(bot)bot(F);forageFrame(now);}
      touche+=F.touche;perdu+=F.perdu;duree+=F.t;mines+=F.mines.length;if(F.mort)morts++;if(fin)fins++;$('overlay').hidden=true;}
    out.push(`${nom.padEnd(13)} : ${(mines/K).toFixed(1)} mines semées · ${(touche/K).toFixed(1)} touchées · −${(perdu/K).toFixed(0)} vie en moyenne · ${morts}/${K} foreuses détruites · ${fins}/${K} arrivées au niveau 3 · ${(duree/K).toFixed(1)} s`);}
  // la première descente : pas de mine, la vie ne bouge pas
  {G.over=null;G.st.vie=77;FORAGE=null;let fin=0;playForage(()=>{fin=1;},1);const F=FORAGE;F.sansRendu=1;let now=F.t0,n=0;while(FORAGE&&n++<1500){now+=33;forageFrame(now);}
    out.push(`première descente : ${F.mines.length} mine, vie ${G.st.vie}/100, arrivée ${fin?'oui':'NON'}, ${F.t.toFixed(1)} s`);}
  // l'amas de Matière de la première descente : sans pilote, puis avec un pilote qui va dessus dès qu'il le voit (kr pousse la foreuse à droite)
  for(const [nom,vise] of [['sans pilote',0],['pilote qui vise',1]]){let pris=0,vus=0;
    for(let k=0;k<K;k++){G.over=null;G.st.vie=100;G.st.matiere=0;FORAGE=null;playForage(()=>{},1);const F=FORAGE;F.sansRendu=1;let now=F.t0,n=0;
      while(FORAGE&&n++<1500){now+=33;F.kl=F.kr=0;if(vise&&F.ph===1&&F.amas&&F.amas.ok&&F.amas.y>F.d){const dx=F.amas.x-(F.cx+F.vx*.3);if(dx>1)F.kr=1;else if(dx<-1)F.kl=1;}forageFrame(now);}
      if(F.amas)vus++;if(G.st.matiere===FG_AMAS_MAT)pris++;$('overlay').hidden=true;}
    out.push(`première descente, amas de matière, ${nom} : ${vus}/${K} amas apparus, ${pris}/${K} récoltés (+${FG_AMAS_MAT})`);}
  // arriver blessée et ne pas diriger : la foreuse peut exploser, et alors il n'y a pas de niveau suivant
  {let morts=0,suites=0;for(let k=0;k<K;k++){G.over=null;G.st.vie=25;FORAGE=null;let fin=0;playForage(()=>{fin=1;},2);const F=FORAGE;F.sansRendu=1;let now=F.t0,n=0;while(FORAGE&&n++<1500){now+=33;forageFrame(now);}
      if(F.mort){morts++;if(fin)suites++;}$('overlay').hidden=true;if(typeof BOOM!=='undefined')BOOM=null;}
    out.push(`25 de vie, aucun pilote : ${morts}/${K} foreuses détruites, ${suites} passées quand même au niveau suivant (attendu : 0)`);}
  // passer le mini-jeu : −30 vie, jamais mortel
  {G.over=null;G.st.vie=12;FORAGE=null;let fin=0;playForage(()=>{fin=1;},2);const F=FORAGE;F.sansRendu=1;let now=F.t0;for(let n=0;n<40;n++){now+=33;forageFrame(now);}skipForage();let n=0;while(FORAGE&&n++<400){now+=33;forageFrame(now);}
    out.push(`passer avec 12 de vie : vie ${G.st.vie}, arrivée ${fin?'oui':'NON'}, mort ${G.over?'OUI':'non'}`);}
  window.requestAnimationFrame=raf;G.over=null;G.st.vie=100;$('overlay').hidden=true;return out.join('\n');
})()
