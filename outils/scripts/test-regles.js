/* Règles d'ensemble du 23 novembre 2026 : fuel, repos qui répare, éclats en fuel, dégâts des créatures, renforts. Une ligne par essai. */
(() => {
  const out=[],ok=(c,t,d)=>out.push((c?'ok    ':'ÉCHEC ')+t+(d?' — '+d:'')),sauve=JSON.parse(JSON.stringify(GEN)),raf=window.requestAnimationFrame;window.requestAnimationFrame=()=>0;
  recRange();recPrend('atterrissage');GEN.taille=3;GEN.hasard=true;hasardReglages();newGame();const st=G.st;
  const calme=()=>{G.beasts=[];G.animals=[];G.vague={bt:0,n:0,dans:1e9};};calme();
  ok(st.fuel===REGLES.fuelMax,'départ : réservoir plein',st.fuel+'/'+REGLES.fuelMax);
  // marcher : 1 de fuel par battement, pas de réparation
  st.vie=50;st.energie=st.energieMax;let f0=st.fuel;for(let i=0;i<10;i++)pass(100);
  ok(f0-st.fuel===10&&st.vie===50,'10 battements sans attendre : 10 de fuel, vie inchangée',`fuel −${f0-st.fuel}, vie ${st.vie}`);
  // attendre : répare
  f0=st.fuel;for(let i=0;i<10;i++)waitTurn();
  ok(st.vie===50+10*REGLES.reposVie&&f0-st.fuel===10*REGLES.fuelRepos,'10 battements d’attente : la vie remonte, le fuel brûle plus vite',`vie ${st.vie}, fuel −${f0-st.fuel}`);
  // vie pleine : attendre ne coûte que 1
  st.vie=st.vieMax;f0=st.fuel;for(let i=0;i<10;i++)waitTurn();ok(f0-st.fuel===10,'vie pleine : attendre ne brûle pas plus',`fuel −${f0-st.fuel}`);
  // à sec
  st.fuel=3;st.vie=50;st.energie=20;for(let i=0;i<10;i++)waitTurn();
  ok(st.fuel===0&&st.vie<=50+REGLES.reposVie&&st.energie<=20+2*WAIT_REGEN,'réservoir vide : ni réparation ni recharge',`vie ${st.vie}, énergie ${st.energie}`);
  // éclats de métal : fuel et énergie, pas de vie
  {st.fuel=100;st.vie=50;st.energie=10;let c=null;for(const [dx,dy] of DIRS){const x=G.px+dx,y=G.py+dy;if(canWalk(G.t[idx(x,y)],true)){c=[dx,dy];break;}}
   if(c){G.ore[idx(G.px+c[0],G.py+c[1])]='sol2';tryMove(c[0],c[1]);ok(st.fuel>=100+REGLES.fuelEclats[2]-2&&st.vie===50&&st.energie>10,'éclats de métal : du fuel et de l’énergie, pas de vie',`fuel ${st.fuel}, vie ${st.vie}, énergie ${Math.round(st.energie)}`);}
   else ok(false,'éclats : pas de case libre autour de la foreuse');}
  // dégâts des créatures
  {const sp=BEASTS.find(b=>b.key==='crabos');let mn=1e9,mx=0;for(let i=0;i<300;i++){const d=dmgDe(sp);mn=Math.min(mn,d);mx=Math.max(mx,d);}
   ok(mn===Math.round(sp.dmin*REGLES.ennemisDegats)&&mx===Math.round(sp.dmax*REGLES.ennemisDegats)&&dmgTxt(sp)===mn+'-'+mx,'crabot : dégâts multipliés, fiche à jour',dmgTxt(sp)+' (bestiaire '+sp.dmin+'-'+sp.dmax+')');}
  // renforts
  {calme();st.fuel=REGLES.fuelMax;st.vie=st.vieMax=1e6;G.vague.dans=REGLES.vagueDebut;const arr=[];let n=0;
   for(let i=1;i<=1500;i++){pass(100);const m=G.beasts.length+G.animals.length;if(m>n){arr.push(i);const neufs=[...G.beasts,...G.animals].slice(-(m-n));
     if(arr.length===1)ok(neufs.every(o=>!vis[idx(o.x,o.y)]&&Math.hypot(o.x-G.px,o.y-G.py)>=10),'premier renfort : hors de vue, loin de la foreuse',`${m-n} créature(s) à ${Math.round(Math.min(...neufs.map(o=>Math.hypot(o.x-G.px,o.y-G.py))))} cases au moins`);n=m;}}
   ok(arr.length>=3&&arr[0]>=REGLES.vagueDebut,'renforts : le premier après '+REGLES.vagueDebut+' battements, puis de plus en plus souvent','arrivées aux battements '+arr.join(', '));}
  // peuplement
  {let be=0,gr=0;const K=10;for(let k=0;k<K;k++){recRange();recPrend('atterrissage');GEN.taille=3;hasardReglages();newGame();be+=G.beasts.length+G.animals.length;for(const g in G.menace.pose)gr+=G.menace.pose[g];}
   ok(be/K<20,'niveau 1 : moitié moins de créatures',(gr/K).toFixed(1)+' groupes, '+(be/K).toFixed(1)+' créatures par carte');}
  window.requestAnimationFrame=raf;genRemet(sauve);GEN.hasard=sauve.hasard;$('overlay').hidden=true;return out.join('\n');
})()
