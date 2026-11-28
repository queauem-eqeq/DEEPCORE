/* Ferrailleuses « à l'ouvrage » (28 novembre 2026). Dans le vrai moteur, sur une carte dégagée : une épave posée à la main, un
   groupe de rôle 'ferraille' qui la retient. Une ligne par essai : « ok » ou « ÉCHEC ».
   – foreuse en vue à 6 cases, hors du périmètre, 30 battements : jamais de chasse (et un groupe sans rôle, lui, la repère) ;
   – entrée dans le périmètre : alertées trois battements, puis chasse ; ressortie à temps : reprise de l'ouvrage ; seconde intrusion
     dans les 20 battements : chasse directe ;
   – coup de la foreuse : coup par surprise, tout le groupe chasse ;
   – trace perdue : retour à l'ouvrage, indifférentes de nouveau ;
   – découpe : halte à l'épave, contre la coque ;
   – exploration, repos, trajet : pas interrompus par une ferrailleuse à l'ouvrage ; ils le sont par une ferrailleuse provoquée ;
   – balise et vacarme ne les distraient pas ; les gardes chassent normalement ; le rôle « aucun » se garde dans les réglages ;
   (soir du 28 novembre 2026) – pas de propagation d'un groupe à l'autre ; part du temps contre la coque ; ouvrières au contact, sur des
     postes distincts ; contour du périmètre seulement près d'une épave occupée (rouge en alerte) ; « En vue » : menaces, puis « À L'OUVRAGE » ;
     fiche ; niveau 1 avec les groupes enregistrés du joueur : aucun groupe hostile d'espèces de chantier dehors, banque du joueur intacte. */
(() => {
  const out=[],v=(nom,ok,det)=>out.push((ok?'ok    ':'ÉCHEC ')+nom+(det!=null?' — '+det:'')),sauve=JSON.parse(JSON.stringify(GEN)),
    E=k=>BEASTS.findIndex(b=>b.key===k),bat=n=>{for(let k=0;k<n&&!G.over;k++)pass(100);};
  const arene=()=>{GEN.taille=3;recRange();recPrend('classique');GEN.structure=0;NIV_GEN=2;newGame();
    for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++)G.t[idx(x,y)]=GROUND;G.beasts=[];G.animals=[];G.patr={};G.epaves=[];G.epI={};G.sas=null;
    G.px=30;G.py=24;G.st.vie=G.st.vieMax=1000;G.eff={};G.over=null;G.las=[];G.lz={};G.balises=[];G.ouvrVu=0;G.msg=null;fog=false;computeFOV();};
  // une épave de 3 × 3 (roche à la place de la coque, marquée dans G.epI)
  const epave=(x,y)=>{for(let j=0;j<3;j++)for(let i=0;i<3;i++){G.t[idx(x+i,y+j)]=ROCK;G.epI[idx(x+i,y+j)]=G.epaves.length;}
    G.epaves.push({type:'sonde',nom:'SONDE',etat:'s',num:12,x,y,w:3,h:3,fosse:-1,boite:-1,groupes:[]});return G.epaves.length-1;};
  // un groupe posé à la main ; role : 'ferraille' (retient l'épave epv), 'garde', ou '' (sans rôle)
  const groupe=(id,k,pos,role,epv)=>{const mb=pos.map(([x,y])=>{const b=newBeast(E(k),x,y,-1,0);b.gi=id;G.beasts.push(b);return b;});
    patInit({pat:role==='garde'?'garde':'navette'},id,mb);if(role)patRole({role},id,mb,epv);return mb;};
  const chasse=m=>m.filter(b=>G.beasts.includes(b)&&b.hunt>0).length;

  // 1. à 6 cases, en vue, hors du périmètre : jamais de chasse
  arene();{const ep=epave(40,23),m=groupe(0,'crabos',[[36,24],[37,25]],'ferraille',ep);let max=0,hos=false;
    // jamais dans le périmètre (28 novembre 2026 : une ferrailleuse passée à l'est de l'épave y attirait la foreuse, 1 fois sur 5)
    for(let k=0;k<30;k++){G.px=Math.min(Math.min(...m.map(b=>b.x))-6,40-OUVR_R-2);G.py=m[0].y;computeFOV();pass(100);max=Math.max(max,chasse(m));if(G.patr[0].ouv==='hostile')hos=true;}
    v('à l’ouvrage : foreuse en vue à 6 cases pendant 30 battements, aucune chasse',max===0&&!hos,`${max} en chasse au plus`);
    v('journal : « MOBILE IGNORE L’UNITÉ » la première fois',(G.log||[]).some(l=>/MOBILE IGNORE L’UNITÉ/.test(l.m||l)));}
  // témoin : le même groupe sans rôle la repère
  arene();{epave(40,23);const m=groupe(0,'crabos',[[36,24],[37,25]],'',-1);let max=0;
    for(let k=0;k<30;k++){if(!chasse(m)){G.px=Math.min(...m.map(b=>b.x))-6;G.py=m[0].y;}computeFOV();pass(100);max=Math.max(max,chasse(m));}
    v('témoin : sans rôle, le même groupe la repère',max>0,`${max} en chasse`);}

  // 2. entrée dans le périmètre : OUVR_ALERTE (3) battements d'avertissement, puis chasse
  const logs=()=>(G.log||[]).map(l=>l.m||l).join('\n');
  arene();{const ep=epave(40,23),m=groupe(0,'crabos',[[44,24],[44,25]],'ferraille',ep),P=G.patr[0];
    G.px=37;G.py=24;computeFOV();pass(100);const a1=P.ouv,c1=chasse(m);
    v('périmètre : alertées au premier battement, pas encore en chasse',a1==='alerte'&&c1===0,`état ${a1}, ${c1} en chasse`);
    v('alertées : elles s’arrêtent et regardent la foreuse',m.every(b=>b.dir===Math.sign(G.px-b.x)||G.px===b.x),m.map(b=>b.dir).join(','));
    v('journal : « PÉRIMÈTRE DE DÉCOUPE. MOBILES EN ALERTE. RECULER. »',/PÉRIMÈTRE DE DÉCOUPE\. MOBILES EN ALERTE\. RECULER\./.test(logs()));
    const et=[];for(let k=0;k<OUVR_ALERTE;k++){pass(100);et.push(P.ouv+':'+chasse(m));}
    v(`avertissement : ${OUVR_ALERTE} battements pour ressortir, puis tout le groupe chasse`,OUVR_ALERTE===3&&et.slice(0,-1).every(x=>x==='alerte:0')&&P.ouv==='hostile'&&chasse(m)===m.length,et.join(' '));
    v('journal : provocation annoncée',/DÉCOUPE INTERROMPUE/.test(logs()));
    v('journal : l’alerte dite une seule fois',(logs().match(/MOBILES EN ALERTE/g)||[]).length===1);}
  arene();{const ep=epave(40,23),m=groupe(0,'crabos',[[44,24],[44,25]],'ferraille',ep),P=G.patr[0];
    G.px=37;G.py=24;computeFOV();pass(100);pass(100);pass(100);G.px=30;computeFOV();pass(100);
    v('périmètre : ressortie au 3e battement, retour immédiat au travail',P.ouv===''&&chasse(m)===0,`état « ${P.ouv} », ${chasse(m)} en chasse`);
    bat(5);G.px=37;computeFOV();pass(100);
    v(`seconde intrusion moins de ${OUVR_RECIDIVE} battements après : chasse directe`,P.ouv==='hostile'&&chasse(m)===m.length,`état ${P.ouv}, ${chasse(m)} en chasse`);}
  arene();{const ep=epave(40,23),m=groupe(0,'crabos',[[44,24],[44,25]],'ferraille',ep),P=G.patr[0];
    G.px=37;G.py=24;computeFOV();pass(100);G.px=30;computeFOV();bat(OUVR_RECIDIVE+5);G.px=37;computeFOV();pass(100);
    v('intrusion longtemps après : avertissement de nouveau',P.ouv==='alerte'&&chasse(m)===0,`état ${P.ouv}`);}

  // 3. coup de la foreuse : coup par surprise, tout le groupe chasse
  arene();{const ep=epave(60,10),m=groupe(0,'crabos',[[31,24],[34,26],[35,22]],'ferraille',ep);m.forEach(b=>b.hp=999);
    G.msg=null;tryMove(1,0);const msg=G.msg?G.msg.m:'';
    v('attaque : coup par surprise sur une ferrailleuse à l’ouvrage',/par surprise/.test(msg),msg);
    v('attaque : tout le groupe passe en chasse',chasse(m)===m.length&&G.patr[0].ouv==='hostile',`${chasse(m)}/${m.length}`);
    // 4. trace perdue (fumigène) : chasse, fouille, oubli, puis retour à l'ouvrage et indifférence
    G.eff.fum=999;G.px=5;G.py=5;computeFOV();let n=0;while(n<200&&G.patr[0].ouv==='hostile'){pass(100);n++;}
    v('trace perdue : retour à l’ouvrage après la fouille',G.patr[0].ouv===''&&chasse(m)===0,`${n} battements`);
    v('journal : « MOBILES : RETOUR À LA DÉCOUPE. » (la première fois)',!G.ouvrRet||/RETOUR À LA DÉCOUPE/.test(logs()));
    G.eff.fum=0;let max=0;for(let k=0;k<30;k++){const b=m.find(b=>G.beasts.includes(b));G.px=b.x-6;G.py=b.y;computeFOV();pass(100);max=Math.max(max,chasse(m));}
    v('trace perdue : de nouveau indifférentes (30 battements en vue)',max===0,`${max} en chasse`);}

  // 5. capsule nuisible (batterie lancée) : provocation ; laser ou vacarme : rien
  arene();{const ep=epave(60,10),m=groupe(0,'crabos',[[36,24],[37,25]],'ferraille',ep);
    let n=0;for(const b of G.beasts)if(!b.hunt&&Math.hypot(b.x-G.px,b.y-G.py)<=12&&!BEASTS[b.sp].mine&&!aOuvrage(b))n++;   // le vacarme d'une station
    const q={id:1,x:34,y:24,hp:40,t:25};G.balises=[q];const pris=baliseAppel(q);G.balises=[];
    m[0].hunt=1;m[0].mem=[G.px,G.py];pass(100);   // mis en chasse par autre chose qu'un coup de la foreuse (laser, mine) : effacé
    v('vacarme, balise, coup perdu : elles restent à l’ouvrage',n===0&&pris===0&&chasse(m)===0&&G.patr[0].ouv!=='hostile',`station ${n}, balise ${pris}, chasse ${chasse(m)}`);
    G.inv=[{k:'batterie',n:1}];consoCible(0,m[0].x,m[0].y);
    v('capsule nuisible lancée par la foreuse : le groupe chasse',G.patr[0].ouv==='hostile',`état ${G.patr[0].ouv}`);}

  // 6. découpe : halte à l'épave, contre la coque
  arene();{const ep=epave(40,23),m=groupe(0,'crabos',[[44,22],[45,27]],'ferraille',ep),P=G.patr[0];G.px=10;G.py=10;computeFOV();
    let vu=false,contre=0;for(let k=0;k<80&&!vu;k++){pass(100);if(P.k===0&&P.pause>0){if(m.every(b=>ouvrCoque(ep,b.x,b.y))){vu=true;contre=P.pause;}}}
    v('découpe : halte à l’épave, les ferrailleuses contre la coque',vu,`halte ${contre} battements restants`);}

  // 7. exploration, repos et trajet
  arene();{const ep=epave(60,10),m=groupe(0,'crabos',[[36,24],[37,25]],'ferraille',ep);computeFOV();
    const E={vie:G.st.vie,sites:G.sites.filter(s=>s.seen).length,vu:new Set()};EXPL_VUS.delete&&m.forEach(b=>EXPL_VUS.delete(b));G.msg=null;
    const e1=exploreEvent(E),r1=restEvent({seen:new Set(),vie:G.st.vie}),t1=travelEvent({seen:new Set(),vie:G.st.vie,sites:G.sites.filter(s=>s.seen).length,i:0,path:[]});
    v('exploration, repos, trajet : pas interrompus par une ferrailleuse à l’ouvrage',!e1&&!r1&&!t1,`${e1}|${r1}|${t1}`);
    ouvrAttaque(m[0]);const e2=exploreEvent(E),r2=restEvent({seen:new Set(),vie:G.st.vie});
    v('exploration, repos : interrompus par une ferrailleuse provoquée',!!e2&&!!r2,`${e2}|${r2}`);
    const html=(()=>{G.patr[0].ouv='';m.forEach(b=>{b.hunt=0;forget(b);});return seenHTML();})();
    v('fenêtre « En vue » : « À L’OUVRAGE »',/À L’OUVRAGE/.test(html));}

  // 8. les gardes chassent normalement
  arene();{const m=groupe(0,'paralyzor',[[36,24],[36,26]],'garde',-1);let max=0;
    for(let k=0;k<30&&!max;k++){G.px=30;G.py=24;computeFOV();pass(100);max=Math.max(max,chasse(m));}
    v('gardes : ennemis ordinaires, ils repèrent la foreuse',max>0,`${max} en chasse`);}

  // 9. réglages : le rôle « aucun » est gardé, un groupe de l'Astroport sans rôle reprend le sien
  {const d=groupesSains({liste:[{n:'Ferrailleuses',role:'aucun',m:[{k:'crabos',min:1,max:2}]},{n:'Équipe de découpe',m:[{k:'crabos',min:1,max:2}]},{n:'Mien',role:'ferraille',m:[{k:'drone',min:1,max:1}]}],niv:{}});
    v('réglages : rôle « aucun » gardé, rôle par défaut sinon, rôle du joueur gardé',d.liste[0].role==='aucun'&&d.liste[1].role==='ferraille'&&d.liste[2].role==='ferraille',d.liste.map(g=>g.role).join(','));}


  // 10. pas de propagation : on frappe une ferrailleuse du groupe A, on entre dans le périmètre de A, un groupe hostile sans rôle
  //     se bat à côté : le groupe B (autre épave, en vue) continue son travail
  arene();{const ea=epave(40,23),eb=epave(52,23),A=groupe(0,'crabos',[[33,24],[44,26]],'ferraille',ea),B=groupe(1,'crabos',[[56,24],[51,27]],'ferraille',eb),
      X=groupe(2,'crabos',[[36,28]],'',-1);A.concat(B).forEach(b=>b.hp=999);
    G.px=32;G.py=24;computeFOV();tryMove(1,0);const pa=G.patr[0].ouv;let maxB=0,etB='';
    for(let k=0;k<8;k++){G.px=38;G.py=24;computeFOV();pass(100);maxB=Math.max(maxB,chasse(B));etB+=(G.patr[1].ouv||'-')+' ';}
    v('pas de propagation : A frappé et envahi chasse, B (autre épave, en vue) reste à l’ouvrage',pa==='hostile'&&chasse(A)>0&&chasse(X)>0&&maxB===0&&!/hostile|alerte/.test(etB),
      `A ${pa}, X ${chasse(X)} en chasse, B ${etB.trim()}`);}

  // 11. cycle : OUVR_PART du temps contre la coque, en halte ; l'aller-retour vers le quai, le groupe ensemble
  arene();{const ep=epave(20,20);G.sas=idx(70,44);const m=groupe(0,'crabos',[[17,21],[17,23],[24,22]],'ferraille',ep),P=G.patr[0];
    G.px=88;G.py=6;computeFOV();let contre=0,tot=0,ecart=0,postes=null,cyc=0,k0=P.k;
    for(let k=0;k<1500;k++){pass(100,true);
      for(const b of m){tot++;if(P.k===0&&P.pause>0&&ouvrCoque(ep,b.x,b.y))contre++;}
      if(P.k!==k0){if(P.k===0)cyc++;k0=P.k;}
      if(P.k===1&&!(P.pause>0)){const d=patD(P),h=m.map(b=>d[idx(b.x,b.y)]).filter(x=>x>=0);ecart=Math.max(ecart,Math.max(...h)-Math.min(...h));}
      if(!postes&&P.k===0&&P.pause>0&&P.pause<P.decoupe*.5&&m.every(b=>b.poste>=0&&idx(b.x,b.y)===b.poste))
        postes=m.map(b=>[b.x,b.y,ouvrCoque(ep,b.x,b.y)]);}
    const part=contre/tot;
    v(`cycle : ${Math.round(OUVR_PART*100)} % visés, part du temps contre la coque entre 50 et 70 %`,part>=.5&&part<=.7,
      `${(part*100).toFixed(1)} %, trajet ${P.trajet}, découpe ${P.decoupe}${P.arm?', aller-retour mesuré '+P.arm:''}, ${cyc} retours`);
    v('navette : le groupe va ensemble (écart en file ≤ 5 pas)',cyc>=2&&ecart<=5,`écart max ${ecart}`);
    const cases=postes?new Set(postes.map(p=>p[0]+','+p[1])).size:0,cotes=postes?new Set(postes.map(p=>p[2].join(','))).size:0;
    v('découpe : chaque ouvrière au contact d’une plaque, sur des postes distincts, sur au moins deux faces',!!postes&&postes.every(p=>p[2])&&cases===m.length&&cotes>=2,
      JSON.stringify(postes));}
  // une épave à 4 cases du quai : la découpe garde son plancher
  arene();{const ep=epave(40,23);G.sas=idx(46,24);const m=groupe(0,'crabos',[[38,24]],'ferraille',ep),P=G.patr[0];
    G.px=10;G.py=10;computeFOV();bat(3);v('épave proche du quai : découpe au plancher',P.decoupe>=OUVR_DECOUPE_MIN,`découpe ${P.decoupe}, trajet ${P.trajet}`);}

  // 12. contour du périmètre : seulement à 6 cases ou moins d'une épave occupée ; rouge en alerte
  arene();{const ep=epave(40,23),vide=epave(40,8),m=groupe(0,'crabos',[[44,24],[44,25]],'ferraille',ep);fog=true;
    const pose=(x,y)=>{G.px=x;G.py=y;computeFOV();render();return ouvrContour();};
    const loin=pose(40-OUVR_CONTOUR-2,24),pres=pose(40-OUVR_CONTOUR,24),pv=pose(40,6);
    v('contour : tracé à 6 cases d’une épave occupée, pas à 8, jamais autour d’une épave sans ouvriers',
      !loin.length&&pres.length===1&&pres[0].k===ep&&pres[0].n>0&&!pres[0].rouge&&!pv.some(c=>c.k===vide),
      `à 8 : ${loin.length}, à 6 : ${JSON.stringify(pres)}, épave vide : ${JSON.stringify(pv)}`);
    G.px=38;G.py=24;computeFOV();pass(100);const al=pose(38,24);
    v('contour : rouge danger quand le groupe est en alerte',G.patr[0].ouv==='alerte'&&al.length===1&&al[0].rouge,JSON.stringify(al));}

  // 13. « En vue » : menaces d'abord, puis l'intertitre « À L'OUVRAGE » et les ouvrières en couleur neutre ; 14. fiche
  arene();{const ep=epave(40,23),m=groupe(0,'crabos',[[44,24],[44,25]],'ferraille',ep),X=groupe(1,'crabos',[[37,27]],'',-1);
    G.px=35;G.py=24;X[0].hunt=1;X[0].sees=true;computeFOV();const h=seenHTML(),i1=h.indexOf('class="an hunt"'),i2=h.indexOf('À L’OUVRAGE</div>'),
      i3=h.indexOf('class="an ouvr');
    v('« En vue » : la menace, puis « À L’OUVRAGE », puis les ouvrières (neutres)',i1>=0&&i2>i1&&i3>i2&&(h.match(/class="an ouvr/g)||[]).length===2,`${i1} < ${i2} < ${i3}`);
    const f=inspectHTML({x:m[0].x,y:m[0].y});
    v('fiche : première ligne « INDIFFÉRENT TANT QUE : PAS D’ATTAQUE, PAS D’INTRUSION DANS SON PÉRIMÈTRE »',/INDIFFÉRENT TANT QUE : PAS D’ATTAQUE, PAS D’INTRUSION DANS SON PÉRIMÈTRE/.test(f));}

  // 15. niveau 1 avec les groupes ENREGISTRÉS du joueur (base de l'artefact, reglages/courant, 28 novembre 2026) : « Crabots » et
  //     « Bande de relais » posés dehors deviennent des ferrailleuses ; plus aucun groupe hostile d'espèces de chantier dehors
  {const REG={"budget":80,"liste":[{"cout":3,"f":2,"lieux":[],"m":[{"k":"crabos","max":2,"min":1}],"n":"Crabots","on":1,"pats":["voyage","ronde","navette","sentinelle"]},{"cout":7,"f":2,"lieux":[],"m":[{"k":"crabos","max":6,"min":4}],"n":"Large crabot groupe","on":1,"pats":["voyage","navette","ronde"]},{"cout":5,"f":2,"lieux":[],"m":[{"k":"cafar","max":4,"min":3}],"n":"Bande de relais","on":1,"pats":["voyage","errance","ronde"]},{"cout":7,"f":0,"lieux":[],"m":[{"k":"paralyzor","max":1,"min":1},{"k":"crabos","max":1,"min":1},{"k":"cafar","max":1,"min":1},{"k":"mine","max":1,"min":1},{"k":"puce","max":1,"min":1}],"n":"Family","on":1,"pats":["territoire","ronde"]},{"cout":8,"f":0,"lieux":[],"m":[{"k":"puce","max":5,"min":3},{"k":"paralyzor","max":1,"min":1}],"n":"3-5 puces + sentinelles","on":1,"pats":["voyage"]},{"cout":3,"f":1,"lieux":[],"m":[{"k":"mine","max":2,"min":1}],"n":"1-2 Mines","on":1,"pats":["errance"]},{"cout":6,"f":1,"lieux":[],"m":[{"k":"mine","max":3,"min":3},{"k":"paralyzor","max":2,"min":2}],"n":"Mines & Sentinelles","on":1,"pats":["navette","ronde"]},{"cout":3,"f":1,"lieux":[],"m":[{"k":"paralyzor","max":3,"min":2}],"n":"2-3 sentinelles","on":1,"pats":["territoire","ronde","navette"]},{"cout":3,"f":0,"lieux":["ext"],"m":[{"k":"brochon","max":2,"min":1}],"n":"Banc de torpilles","on":1,"pats":["errance"]},{"cout":11,"f":1,"lieux":[],"m":[{"k":"mastok","max":1,"min":1}],"n":"Broyeur solitaire","on":1,"pats":["territoire","garde","sentinelle"]},{"cout":10,"f":0,"lieux":[],"m":[{"k":"puce","max":8,"min":6},{"k":"mine","max":1,"min":0}],"n":"Puces en groupes","on":1,"pats":["voyage"]},{"cout":10,"f":1,"lieux":[],"m":[{"k":"gardien","max":1,"min":1},{"k":"paralyzor","max":2,"min":1}],"n":"Poste de garde","on":1,"pats":["garde"]},{"cout":13,"f":1,"lieux":[],"m":[{"k":"artilleur","max":2,"min":2},{"k":"gardien","max":1,"min":0}],"n":"Batterie","on":1,"pats":["garde","sentinelle"]},{"cout":3,"f":1,"lieux":["bati","ext"],"m":[{"k":"drone","max":5,"min":3}],"n":"Essaim de drones","on":1,"pats":["voyage","navette","ronde"]},{"cout":6,"f":1,"lieux":[],"m":[{"k":"crabos","max":2,"min":2},{"k":"soudeur","max":1,"min":1}],"n":"Escouade de réparation","on":1,"pats":["ronde","navette"]},{"cout":4,"f":1,"lieux":[],"m":[{"k":"englueur","max":2,"min":1},{"k":"mine","max":2,"min":1}],"n":"Embuscade gluante","on":1,"pats":["affut"]},{"cout":7,"f":1,"lieux":["ext"],"m":[{"k":"englueur","max":1,"min":1},{"k":"cafar","max":4,"min":3}],"n":"Chasse à courre","on":1,"pats":["voyage","navette"]},{"cout":11,"f":1,"lieux":[],"m":[{"k":"gardien","max":1,"min":1},{"k":"soudeur","max":1,"min":1},{"k":"drone","max":2,"min":2}],"n":"Convoi","on":1,"pats":["navette"]},{"cout":5,"f":1,"lieux":[],"m":[{"k":"artilleur","max":2,"min":1}],"n":"Tireurs embusqués","on":1,"pats":["affut","sentinelle"]},{"cout":2,"f":1,"lieux":[],"m":[{"k":"drone","max":2,"min":2},{"k":"paralyzor","max":1,"min":1}],"n":"Ronde de drones","on":1,"pats":["ronde"]}],"niv":{"1":{"budget":80,"gr":["Crabots","Bande de relais","1-2 Mines","Banc de torpilles","Puces en groupes"],"part":{"bati":20,"ext":75,"tunnel":5}},"2":{"budget":96,"gr":["Crabots","Large crabot groupe","Bande de relais","Family","3-5 puces + sentinelles","1-2 Mines","Mines & Sentinelles","2-3 sentinelles","Banc de torpilles","Broyeur solitaire","Puces en groupes","Batterie","Essaim de drones","Tireurs embusqués","Ronde de drones"],"part":{"bati":18,"ext":80,"tunnel":2}},"3":{"budget":112,"gr":["Crabots","Large crabot groupe","Bande de relais","Family","3-5 puces + sentinelles","1-2 Mines","Mines & Sentinelles","2-3 sentinelles","Banc de torpilles","Broyeur solitaire","Puces en groupes","Poste de garde","Batterie","Essaim de drones","Escouade de réparation","Embuscade gluante","Chasse à courre","Convoi","Tireurs embusqués","Ronde de drones"],"part":{"bati":60,"ext":35,"tunnel":5}}},"pente":20,"v":2};APPLYING=true;try{applySaved({enregistreLe:new Date(0).toISOString(),groupes:JSON.parse(JSON.stringify(REG))});}finally{APPLYING=false;}
    const avant=REG.liste.map(g=>g.n+':'+(g.role||'')).join('|'),apres=GROUPES.liste.filter(g=>REG.liste.some(x=>x.n===g.n)).map(g=>g.n+':'+(g.role||'')).join('|');
    v('réglages du joueur : sa banque de groupes n’est pas touchée (rôles compris)',avant===apres);
    let hostiles=0,conv=0,fer=0;const det=[];
    for(let k=0;k<4;k++){recRange();recPrend('atterrissage');hasardReglages();enJeu(newGame,1);
      const gr={};for(const o of G.beasts.concat(G.animals))if(o.gi!=null)(gr[o.gi]=gr[o.gi]||[]).push(o);
      for(const id in gr){const l=gr[id],g=GROUPES.liste[l[0].gr]||{},chantier=l.every(o=>OUVR_CHANTIER.includes(G.beasts.includes(o)?BEASTS[o.sp].key:'puce')),
          dehors=l.filter(o=>lieuDe(idx(o.x,o.y))==='ext').length*2>l.length;
        if(l[0].role==='ferraille'){fer++;if(!g.role)conv++;}
        else if(chantier&&dehors&&!l[0].role){hostiles++;det.push(g.n);}}}
    v('niveau 1, groupes du joueur : aucun groupe hostile d’espèces de chantier dehors ; ses Crabots et relais deviennent ferrailleuses',
      hostiles===0&&conv>0,`${fer} groupes de ferrailleuses dont ${conv} convertis, ${hostiles} hostiles ${det.join(',')}`);
    niveauSuivant(true);let n2=0;for(const o of G.beasts)if(o.role==='ferraille')n2++;
    v('niveau 2 : la règle de pose du niveau 1 ne s’applique pas',n2===0,`${n2} ferrailleuses`);}

  Object.assign(GEN,sauve);
  return out.join('\n');
})()
