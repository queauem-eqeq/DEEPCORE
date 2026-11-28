/* Ferrailleuses « à l'ouvrage » (28 novembre 2026). Dans le vrai moteur, sur une carte dégagée : une épave posée à la main, un
   groupe de rôle 'ferraille' qui la retient. Une ligne par essai : « ok » ou « ÉCHEC ».
   – foreuse en vue à 6 cases, hors du périmètre, 30 battements : jamais de chasse (et un groupe sans rôle, lui, la repère) ;
   – entrée dans le périmètre : alertées un battement, puis chasse ; ressortie aussitôt : reprise de l'ouvrage ;
   – coup de la foreuse : coup par surprise, tout le groupe chasse ;
   – trace perdue : retour à l'ouvrage, indifférentes de nouveau ;
   – découpe : halte à l'épave, contre la coque ;
   – exploration, repos, trajet : pas interrompus par une ferrailleuse à l'ouvrage ; ils le sont par une ferrailleuse provoquée ;
   – balise et vacarme ne les distraient pas ; les gardes chassent normalement ; le rôle « aucun » se garde dans les réglages. */
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

  // 2. entrée dans le périmètre : alertées, puis chasse
  arene();{const ep=epave(40,23),m=groupe(0,'crabos',[[44,24],[44,25]],'ferraille',ep),P=G.patr[0];
    G.px=37;G.py=24;computeFOV();pass(100);const a1=P.ouv,c1=chasse(m),arret=m.map(b=>[b.x,b.y]);
    v('périmètre : alertées au premier battement, pas encore en chasse',a1==='alerte'&&c1===0,`état ${a1}, ${c1} en chasse`);
    v('alertées : elles s’arrêtent et regardent la foreuse',m.every(b=>b.dir===Math.sign(G.px-b.x)||G.px===b.x),m.map(b=>b.dir).join(','));
    pass(100);v('périmètre : la foreuse reste, tout le groupe chasse',P.ouv==='hostile'&&chasse(m)===m.length,`état ${P.ouv}, ${chasse(m)}/${m.length}`);
    v('journal : provocation annoncée',(G.log||[]).some(l=>/DÉCOUPE INTERROMPUE/.test(l.m||l)));}
  arene();{const ep=epave(40,23),m=groupe(0,'crabos',[[44,24],[44,25]],'ferraille',ep),P=G.patr[0];
    G.px=37;G.py=24;computeFOV();pass(100);G.px=30;computeFOV();bat(5);
    v('périmètre : ressortie aussitôt, elles reprennent l’ouvrage',P.ouv===''&&chasse(m)===0,`état « ${P.ouv} », ${chasse(m)} en chasse`);}

  // 3. coup de la foreuse : coup par surprise, tout le groupe chasse
  arene();{const ep=epave(60,10),m=groupe(0,'crabos',[[31,24],[34,26],[35,22]],'ferraille',ep);m.forEach(b=>b.hp=999);
    G.msg=null;tryMove(1,0);const msg=G.msg?G.msg.m:'';
    v('attaque : coup par surprise sur une ferrailleuse à l’ouvrage',/par surprise/.test(msg),msg);
    v('attaque : tout le groupe passe en chasse',chasse(m)===m.length&&G.patr[0].ouv==='hostile',`${chasse(m)}/${m.length}`);
    // 4. trace perdue (fumigène) : chasse, fouille, oubli, puis retour à l'ouvrage et indifférence
    G.eff.fum=999;G.px=5;G.py=5;computeFOV();let n=0;while(n<200&&G.patr[0].ouv==='hostile'){pass(100);n++;}
    v('trace perdue : retour à l’ouvrage après la fouille',G.patr[0].ouv===''&&chasse(m)===0,`${n} battements`);
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

  Object.assign(GEN,sauve);
  return out.join('\n');
})()
