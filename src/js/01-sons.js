/* ---------- Sons (synthèse Web Audio) ---------- */
/* SON_DECAL (28 novembre 2026) : retard, en secondes, ajouté aux sons joués pendant le coup d'une créature,
   pour qu'ils tombent avec l'animation étalée du coup (voir FX_RETARD, 10-rendu). */
let SON_DECAL=0;
/* SON_GROUPE (28 novembre 2026) : les coups d'un même groupe (attaque combinée, voir pass) ne jouent qu'un bruit de morsure et
   un bruit de coup raté, au lieu d'un par créature qui s'empilaient. */
let SON_GROUPE='';const SON_DEJA={};
const sonGroupe=nom=>{if(!SON_GROUPE)return true;if(SON_DEJA[nom]===SON_GROUPE)return false;SON_DEJA[nom]=SON_GROUPE;return true;};
let AC=null,MASTER=null,SND={on:true,vol:60},unlocked=false;
try{const v=JSON.parse(localStorage.getItem('np-son')||'null');if(v&&typeof v.vol==='number')SND=v;}catch(e){}
function audio(){
  if(!unlocked||!SND.on)return null;
  if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();MASTER=AC.createGain();
    // limiteur en sortie : quand plusieurs sons forts se superposent (tonnerres, rentrée), le total ne sature plus
    const lim=AC.createDynamicsCompressor();lim.threshold.value=-10;lim.knee.value=6;lim.ratio.value=12;lim.attack.value=.003;
      lim.release.value=.25;
    MASTER.connect(lim);lim.connect(AC.destination);}catch(e){return null;}}
  if(AC.state==='suspended')AC.resume();MASTER.gain.value=SND.vol/100*.8;return AC;}
function tone(f,dur,type,g,f2,delay){const a=audio();if(!a)return;const t=a.currentTime+(delay||0)+SON_DECAL,o=a.createOscillator(),v=a.createGain();
  o.type=type||'square';o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);
  v.gain.setValueAtTime(0.0001,t);v.gain.exponentialRampToValueAtTime(g,t+.008);v.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.connect(v);v.connect(MASTER);o.start(t);o.stop(t+dur+.02);}
let NB=null;
function noiz(dur,g,freq,ftype,delay,f2){const a=audio();if(!a)return;const t=a.currentTime+(delay||0)+SON_DECAL;
  if(!NB){NB=a.createBuffer(1,a.sampleRate,a.sampleRate);const d=NB.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}
  const src=a.createBufferSource(),fl=a.createBiquadFilter(),v=a.createGain();src.buffer=NB;
  fl.type=ftype||'lowpass';fl.frequency.setValueAtTime(freq,t);if(f2)fl.frequency.exponentialRampToValueAtTime(f2,t+dur);
  // attaque de 6 ms : pas de clic au démarrage
  v.gain.setValueAtTime(0.0001,t);v.gain.exponentialRampToValueAtTime(g,t+Math.min(.006,dur/4));
    v.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  src.connect(fl);fl.connect(v);v.connect(MASTER);src.start(t,Math.random()*.5);src.stop(t+dur+.02);}
// Souffle : bruit en bande large, montée et descente lentes et linéaires (aucun transitoire, donc aucun crépitement)
function souffle(dur,g,f1,f2,att,delay){const a=audio();if(!a)return;const t=a.currentTime+(delay||0)+SON_DECAL;if(!NB)noiz(.01,.0001,1000);
  const src=a.createBufferSource(),fl=a.createBiquadFilter(),bas=a.createBiquadFilter(),v=a.createGain();src.buffer=NB;
  fl.type='bandpass';fl.Q.value=.7;fl.frequency.setValueAtTime(f1,t);fl.frequency.linearRampToValueAtTime(f2,t+dur);
  bas.type='lowpass';bas.frequency.value=5000;
  v.gain.setValueAtTime(0,t);v.gain.linearRampToValueAtTime(g,t+att);v.gain.linearRampToValueAtTime(0,t+dur);
  src.connect(fl);fl.connect(bas);bas.connect(v);v.connect(MASTER);src.start(t,Math.random()*.5);src.stop(t+dur+.02);}
// hasard propre aux variations de sons : il ne consomme pas celui du jeu (une partie rejouée reste identique)
let SGRAINE=(Date.now()^0x9e3779b9)>>>0;
function sAlea(){SGRAINE=(SGRAINE*1664525+1013904223)>>>0;return SGRAINE/4294967296;}
const SFX={
  step(){noiz(.06,.12,700);tone(62,.05,'square',.035);},
  // Herbe : froufrou — trois coups de brosse décalés, filtrés en bande montante, légèrement tirés au hasard
  // 25 novembre 2026 : les trois coups secs (attaque de 6 ms, passe-haut) crépitaient ; un seul souffle long et fondu à la place (un seul son, demandé le même jour),
  // montée douce de 50 ms, bande passante large qui glisse vers l'aigu, rien au-dessus de 5 kHz
  grass(){const r=()=>.82+Math.random()*.36;
    souffle(.22*r(),.06,1800*r(),4200,.05,0);},
  // Moteur électrique de la course : bourdon court et sifflement d'engrenage, un par pas couru
  motor(){const r=.94+Math.random()*.12;tone(188*r,.1,'sawtooth',.04,214*r);tone(1240*r,.07,'square',.016,1460*r);
    noiz(.05,.02,2800,'bandpass',.01,1800);},
  motorOn(){tone(120,.26,'sawtooth',.05,330);tone(900,.22,'square',.02,1500,.03);},
  motorOff(){tone(320,.3,'sawtooth',.045,110);tone(1450,.2,'square',.018,820,.02);},
  water(){noiz(.22,.16,1800,'bandpass',0,600);},
  deep(){noiz(.3,.14,900,'bandpass',0,300);tone(180,.3,'sine',.06,110);},
  drift(){noiz(.45,.12,500,'lowpass',0,1400);tone(260,.4,'sine',.05,130);},
  thud(){tone(70,.12,'square',.09,45);noiz(.08,.1,400);},
  whoosh(){if(!sonGroupe('whoosh'))return;noiz(.16,.12,1200,'bandpass',0,3000);},
  blocked(){tone(110,.07,'square',.06,90);},
  crack(){noiz(.07,.3,3000,'highpass');tone(140,.1,'square',.1,60);noiz(.12,.12,900,'lowpass',.04);},
  /* Coups de combat variés (24 novembre 2026) : chaque bruit de coup existe en plusieurs versions, tirées au hasard sans
     jamais rejouer deux fois de suite la même, et chaque coup est en plus légèrement désaccordé (hauteur ±8 %, force ±10 %).
     coup : la foreuse frappe une créature (4 versions) · bite : une créature frappe (4) · crit : coup critique (3).
     crack reste le bruit du coup sur la roche. */
  varie(nom,n){let i;do{i=Math.floor(sAlea()*n);}while(n>1&&i===SFX.dernier[nom]);SFX.dernier[nom]=i;return i;},
  dernier:{},
  coup(){const r=.92+sAlea()*.16,k=.9+sAlea()*.2;
    switch(SFX.varie('coup',4)){
      // sec : le claquement d'origine
      case 0:noiz(.07,.3*k,3000*r,'highpass');tone(140*r,.1,'square',.1*k,60*r);noiz(.12,.12*k,900*r,'lowpass',.04);break;
      // lourd : plus sourd, plus long
      case 1:noiz(.05,.26*k,1800*r,'bandpass');tone(105*r,.14,'square',.11*k,48*r);noiz(.15,.13*k,600*r,'lowpass',.03);break;
      // métallique : attaque aiguë et tintement bref
      case 2:noiz(.05,.3*k,4200*r,'highpass');tone(190*r,.08,'sawtooth',.09*k,75*r);tone(820*r,.04,'square',.03*k,400*r);
        noiz(.1,.1*k,1200*r,'lowpass',.035);break;
      // doublé : deux chocs rapprochés
      default:noiz(.04,.24*k,2600*r,'highpass');tone(125*r,.09,'square',.1*k,55*r);noiz(.06,.17*k,2000*r,'bandpass',.055);
        tone(95*r,.1,'square',.07*k,45*r,.055);}},
  crit(){const r=.94+sAlea()*.12,k=.92+sAlea()*.16;
    switch(SFX.varie('crit',3)){
      case 0:noiz(.05,.35*k,5000*r,'highpass');tone(1400*r,.06,'square',.06*k,700*r);tone(180*r,.18,'sawtooth',.12*k,60*r,.02);break;
      // plus grave, avec une retombée
      case 1:noiz(.06,.34*k,3800*r,'highpass');tone(1100*r,.07,'square',.055*k,480*r);tone(150*r,.22,'sawtooth',.13*k,48*r,.02);
        noiz(.12,.1*k,700*r,'lowpass',.06);break;
      // plus tranchant : deux éclats aigus
      default:noiz(.04,.33*k,6200*r,'highpass');tone(1750*r,.05,'square',.055*k,900*r);tone(1300*r,.05,'square',.04*k,620*r,.045);
        tone(205*r,.17,'sawtooth',.115*k,70*r,.02);}},
  explode(){noiz(1.1,.5,900,'lowpass',0,120);tone(70,.9,'sawtooth',.16,28);noiz(.35,.3,4000,'highpass',.02);
    noiz(.6,.18,600,'bandpass',.25,200);},
  break(){noiz(.45,.35,1500,'lowpass',0,200);tone(95,.35,'sawtooth',.12,35);noiz(.2,.15,3500,'highpass',.05);},
  spot(){tone(880,.07,'square',.05);tone(1320,.09,'square',.05,null,.08);},
  // sonar : « blip blip » répété pendant toute la durée du balayage (s, en secondes)
  sonar(s){const n=Math.max(3,Math.ceil(s/.62));for(let i=0;i<n;i++){tone(1480,.13,'sine',.09,1380,i*.62);
    tone(1480,.11,'sine',.045,1380,i*.62+.17);}},
  analyse(){[660,880,1100,1320].forEach((f,i)=>tone(f,.08,'triangle',.07,null,i*.07));},
  start(){tone(110,.6,'sawtooth',.06,440);tone(220,.6,'square',.03,880,.05);},
  drill(k){tone(48+k*6,.12,'sawtooth',.09);noiz(.1,.12,600+k*120);},
  roar(){tone(140,.45,'sawtooth',.1,55);noiz(.35,.12,500,'lowpass',.05);},
  bite(){if(!sonGroupe('bite'))return;const r=.92+sAlea()*.16,k=.9+sAlea()*.2;
    switch(SFX.varie('bite',4)){
      // la morsure d'origine
      case 0:tone(90*r,.15,'square',.14*k,40*r);noiz(.12,.2*k,2500*r,'highpass');tone(600*r,.08,'square',.05*k,200*r,.05);break;
      // coup de griffe : raclement aigu qui descend
      case 1:noiz(.13,.2*k,4200*r,'bandpass',0,1500*r);tone(110*r,.12,'square',.12*k,50*r,.02);
        tone(480*r,.07,'square',.04*k,170*r,.06);break;
      // coup de boutoir : sourd et lourd
      case 2:tone(72*r,.19,'square',.15*k,34*r);noiz(.1,.17*k,1300*r,'lowpass');noiz(.06,.1*k,3200*r,'highpass',.03);break;
      // claquement de mâchoires : deux temps
      default:tone(100*r,.1,'square',.13*k,46*r);noiz(.06,.19*k,3000*r,'highpass');noiz(.07,.16*k,2200*r,'highpass',.07);
        tone(700*r,.06,'square',.045*k,240*r,.07);}},
  // Consommables (16 novembre 2026) : réparobots (petits servos et soudure), batterie (décharge qui monte), purge (vidange sous pression)
  repair(){tone(520,.1,'triangle',.05,780);tone(780,.12,'triangle',.05,1040,.09);
    noiz(.3,.05,2800,'bandpass',0,1400);tone(1180,.22,'sine',.045,1560,.2);},
  battery(){tone(180,.3,'sawtooth',.05,900);tone(360,.3,'square',.025,1800,.02);
    noiz(.1,.07,3600,'highpass',.26);tone(1760,.12,'sine',.05,2640,.28);},
  // Fumigène (16 novembre 2026) : le bidon qui tombe, l'amorce qui claque, puis le jet sous pression qui s'épuise en nappe sourde
  smoke(){tone(150,.07,'square',.09,70);
    noiz(.12,.18,5200,'highpass',.03);
    noiz(1.7,.17,2600,'bandpass',.05,700);
    noiz(1.9,.07,900,'lowpass',.06,260);
    tone(430,1.3,'sine',.018,120,.07);},
  /* Consommables, suite (26 novembre 2026) : chaque objet a maintenant son bruit, aucun n'est partagé avec un autre.
     Avant, le module de puissance empruntait celui de l'analyse, le surrégime celui des coups critiques, le camouflage
     celui du fumigène et le court-circuit celui des lasers : on ne les distinguait pas à l'oreille. */
  // Module de puissance : trois paliers qui montent et se verrouillent, puis une basse qui s'installe
  boost(){[392,523,659].forEach((f,i)=>tone(f,.12,'square',.05,null,i*.1));
    tone(1046,.3,'triangle',.05,1318,.3);tone(98,.5,'sawtooth',.05,65,.3);},
  // Surrégime : un rugissement bref et un cliquetis rapide qui s'emballe
  fury(){tone(120,.35,'sawtooth',.1,210);noiz(.3,.1,420,'lowpass',0,1500);
    for(let i=0;i<7;i++)tone(2200+i*160,.04,'square',.03,null,.1+i*.045);},
  // Camouflage optique : un balayage qui descend et s'efface, sans attaque — le contraire du fumigène, qui claque
  veil(){souffle(.9,.09,3800,260,.25);tone(880,.7,'sine',.035,110);tone(1320,.5,'sine',.018,180,.12);},
  // Court-circuit : l'arc électrique, quatre craquements secs et une plainte qui tombe
  zap(){for(let i=0;i<4;i++)noiz(.05,.16,5600,'highpass',i*.06);
    tone(1900,.18,'square',.05,140);tone(640,.3,'sawtooth',.04,70,.1);},
  /* Phaseur (26 novembre 2026) : deux temps dans un seul bruit — la foreuse qui se démonte (plainte qui monte, souffle qui
     s'ouvre) puis la reprise de forme à l'arrivée (claquement sourd et harmonique qui se referme). */
  phase(){tone(220,.4,'sine',.055,1760);souffle(.45,.1,400,4200,.2);
    tone(1760,.12,'square',.03,2640,.3);
    noiz(.1,.14,2400,'bandpass',.5,600);tone(1320,.3,'triangle',.05,330,.52);tone(110,.4,'square',.06,74,.52);},
  squish(){noiz(.18,.25,900,'lowpass',0,250);tone(160,.12,'square',.07,60);},
  screech(){tone(2600,.09,'sawtooth',.06,3800);tone(3400,.12,'square',.04,2200,.08);noiz(.15,.08,5000,'highpass',.02);},
  // alarme de la balise (22 novembre 2026) : sirène à deux tons, six alternances en un peu moins d'une seconde et demie
  alarme(){for(let i=0;i<6;i++){const f=i%2?740:988;tone(f,.22,'square',.05,null,i*.24);tone(f*2,.2,'sawtooth',.014,null,i*.24);}},
  chirp(){tone(1900,.05,'square',.035,2700);tone(2300,.05,'square',.03,1600,.07);},
  // porte de bâtiment (19 novembre 2026) : loquet qui claque, panneau lourd qui glisse en grinçant, butée sourde
  // toutes les portes font le bruit de celle du vaisseau (19 novembre 2026) ; k : volume (0,6 pour une créature)
  porte(k=1){SFX.door(k);},
  // serrure : la clé tourne (deux crans), le pêne recule, puis la porte s'ouvre
  // une planche de pont qui se verrouille en place (26 novembre 2026) : le déploiement en joue une par case
  pont(n){const r=1+(n%4)*.04;tone(420*r,.05,'square',.035,300);noiz(.05,.07,1500,'bandpass',0,900);},
  serrure(){tone(1500,.03,'square',.04,1100);tone(1300,.03,'square',.04,950,.09);noiz(.04,.12,900,'bandpass',.2);
    tone(110,.07,'square',.07,70,.22);},
  /* Porte automatique, forte et métallique : souffle pneumatique, servo, grincement de rail (deux partiels aigus non
     harmoniques). Le choc de fin de course a été retiré le 19 novembre 2026 : il ne reste que cette première partie,
     et c'est le bruit de toutes les portes — vaisseau, bâtiments, créatures (à volume réduit). */
  // tir de la sentinelle : un « piou » de laser — deux balayages qui chutent très vite de l'aigu au grave, sur un filet de souffle
  laser(){tone(2300,.2,'sawtooth',.075,170);tone(3100,.13,'square',.035,420);noiz(.1,.05,5200,'bandpass',0,1400);},
  door(k=1){noiz(.38,.26*k,2600,'bandpass',0,700);tone(180,.22,'square',.06*k,420);tone(1240,.3,'square',.03*k,1175);
    tone(1873,.24,'square',.02*k,1790);},
  hyper(){tone(700,1,'sawtooth',.05,55);noiz(1.1,.13,3200,'bandpass',0,180);},
  hum(){tone(55,2.2,'sine',.06);tone(110,2.2,'sine',.02);},
  approach(){tone(70,3,'sawtooth',.035,150);noiz(3,.05,300,'lowpass',0,900);},
  reentry(dur,pk){const a=audio();if(!a)return;if(!NB)noiz(.01,.0001,100);const t=a.currentTime;
    const src=a.createBufferSource(),fl=a.createBiquadFilter(),v=a.createGain();src.buffer=NB;src.loop=true;fl.type='lowpass';
    fl.frequency.setValueAtTime(180,t);fl.frequency.exponentialRampToValueAtTime(1500,t+pk);
      fl.frequency.exponentialRampToValueAtTime(220,t+dur);
    v.gain.setValueAtTime(.0001,t);v.gain.exponentialRampToValueAtTime(.38,t+pk);v.gain.exponentialRampToValueAtTime(.0001,t+dur);
    src.connect(fl);fl.connect(v);v.connect(MASTER);src.start(t);src.stop(t+dur+.05);
    const o=a.createOscillator(),g=a.createGain();o.type='sawtooth';o.frequency.setValueAtTime(36,t);
      o.frequency.linearRampToValueAtTime(64,t+pk);o.frequency.linearRampToValueAtTime(40,t+dur);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.07,t+pk);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
      o.connect(g);g.connect(MASTER);o.start(t);o.stop(t+dur+.05);},
  // tonnerre : claquement, puis long grondement qui roule (bouffées irrégulières de bruit grave)
  // un tonnerre qui suit de près le précédent ne rejoue que son claquement (sinon les grondements s'empilent et saturent)
  thunder(){const a=audio();if(!a)return;const now=a.currentTime;
    if(SFX.lastThunder&&now-SFX.lastThunder<1.6){noiz(.2,.22,1400,'bandpass',0,500);return;}SFX.lastThunder=now;noiz(.12,.3,3000,'lowpass');
    noiz(.25,.35,1400,'bandpass',.02,500);
    const t=a.currentTime+.05,dur=3.4+Math.random()*.8,src=a.createBufferSource(),fl=a.createBiquadFilter(),v=a.createGain();
    src.buffer=NB;src.loop=true;fl.type='lowpass';fl.Q.value=.7;fl.frequency.setValueAtTime(420,t);
      fl.frequency.exponentialRampToValueAtTime(70,t+dur);
    v.gain.setValueAtTime(0.0001,t);v.gain.exponentialRampToValueAtTime(.55,t+.12);let u=t+.12;
    // roulements
    while(u<t+dur-.4){u+=.25+Math.random()*.45;v.gain.linearRampToValueAtTime(Math.max(.05,.5*(1-(u-t)/dur))*(.45+Math.random()*.7),u);}
    v.gain.exponentialRampToValueAtTime(0.0001,t+dur);src.connect(fl);fl.connect(v);v.connect(MASTER);src.start(t,Math.random()*.5);
      src.stop(t+dur+.05);
    tone(48,1.6,'sine',.22,30,.04);},
  thrust(){noiz(4,.12,900,'lowpass',0,160);tone(62,4,'square',.03,38);},
  touchdown(){tone(72,.35,'square',.13,38);noiz(.6,.22,700,'lowpass',0,90);noiz(.3,.08,3000,'highpass',.05);},
  done(){[440,554,659,880].forEach((f,i)=>tone(f,.35,'triangle',.06,null,i*.06));}
};
function unlock(){unlocked=true;audio();}
addEventListener('pointerdown',unlock);addEventListener('keydown',unlock);

