/* ---------- Sons (synthèse Web Audio) ---------- */
let AC=null,MASTER=null,SND={on:true,vol:60},unlocked=false;
try{const v=JSON.parse(localStorage.getItem('np-son')||'null');if(v&&typeof v.vol==='number')SND=v;}catch(e){}
function audio(){
  if(!unlocked||!SND.on)return null;
  if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();MASTER=AC.createGain();
    // limiteur en sortie : quand plusieurs sons forts se superposent (tonnerres, rentrée), le total ne sature plus
    const lim=AC.createDynamicsCompressor();lim.threshold.value=-10;lim.knee.value=6;lim.ratio.value=12;lim.attack.value=.003;lim.release.value=.25;
    MASTER.connect(lim);lim.connect(AC.destination);}catch(e){return null;}}
  if(AC.state==='suspended')AC.resume();MASTER.gain.value=SND.vol/100*.8;return AC;}
function tone(f,dur,type,g,f2,delay){const a=audio();if(!a)return;const t=a.currentTime+(delay||0),o=a.createOscillator(),v=a.createGain();
  o.type=type||'square';o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);
  v.gain.setValueAtTime(0.0001,t);v.gain.exponentialRampToValueAtTime(g,t+.008);v.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.connect(v);v.connect(MASTER);o.start(t);o.stop(t+dur+.02);}
let NB=null;
function noiz(dur,g,freq,ftype,delay,f2){const a=audio();if(!a)return;const t=a.currentTime+(delay||0);
  if(!NB){NB=a.createBuffer(1,a.sampleRate,a.sampleRate);const d=NB.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}
  const src=a.createBufferSource(),fl=a.createBiquadFilter(),v=a.createGain();src.buffer=NB;
  fl.type=ftype||'lowpass';fl.frequency.setValueAtTime(freq,t);if(f2)fl.frequency.exponentialRampToValueAtTime(f2,t+dur);
  v.gain.setValueAtTime(0.0001,t);v.gain.exponentialRampToValueAtTime(g,t+Math.min(.006,dur/4));v.gain.exponentialRampToValueAtTime(0.0001,t+dur);   // attaque de 6 ms : pas de clic au démarrage
  src.connect(fl);fl.connect(v);v.connect(MASTER);src.start(t,Math.random()*.5);src.stop(t+dur+.02);}
const SFX={
  step(){noiz(.06,.12,700);tone(62,.05,'square',.035);},
  grass(){noiz(.1,.09,5000,'highpass');},
  water(){noiz(.22,.16,1800,'bandpass',0,600);},
  deep(){noiz(.3,.14,900,'bandpass',0,300);tone(180,.3,'sine',.06,110);},
  drift(){noiz(.45,.12,500,'lowpass',0,1400);tone(260,.4,'sine',.05,130);},
  thud(){tone(70,.12,'square',.09,45);noiz(.08,.1,400);},
  whoosh(){noiz(.16,.12,1200,'bandpass',0,3000);},
  blocked(){tone(110,.07,'square',.06,90);},
  crack(){noiz(.07,.3,3000,'highpass');tone(140,.1,'square',.1,60);noiz(.12,.12,900,'lowpass',.04);},
  explode(){noiz(1.1,.5,900,'lowpass',0,120);tone(70,.9,'sawtooth',.16,28);noiz(.35,.3,4000,'highpass',.02);noiz(.6,.18,600,'bandpass',.25,200);},
  break(){noiz(.45,.35,1500,'lowpass',0,200);tone(95,.35,'sawtooth',.12,35);noiz(.2,.15,3500,'highpass',.05);},
  spot(){tone(880,.07,'square',.05);tone(1320,.09,'square',.05,null,.08);},
  analyse(){[660,880,1100,1320].forEach((f,i)=>tone(f,.08,'triangle',.07,null,i*.07));},
  start(){tone(110,.6,'sawtooth',.06,440);tone(220,.6,'square',.03,880,.05);},
  drill(k){tone(48+k*6,.12,'sawtooth',.09);noiz(.1,.12,600+k*120);},
  roar(){tone(140,.45,'sawtooth',.1,55);noiz(.35,.12,500,'lowpass',.05);},
  bite(){tone(90,.15,'square',.14,40);noiz(.12,.2,2500,'highpass');tone(600,.08,'square',.05,200,.05);},
  squish(){noiz(.18,.25,900,'lowpass',0,250);tone(160,.12,'square',.07,60);},
  screech(){tone(2600,.09,'sawtooth',.06,3800);tone(3400,.12,'square',.04,2200,.08);noiz(.15,.08,5000,'highpass',.02);},
  chirp(){tone(1900,.05,'square',.035,2700);tone(2300,.05,'square',.03,1600,.07);},
  door(){noiz(.38,.16,2600,'bandpass',0,700);tone(180,.2,'square',.035,420);tone(95,.09,'square',.09,60,.3);noiz(.06,.12,500,'lowpass',.3);},   // porte automatique : souffle pneumatique, servo, choc de fin de course
  hyper(){tone(700,1,'sawtooth',.05,55);noiz(1.1,.13,3200,'bandpass',0,180);},
  hum(){tone(55,2.2,'sine',.06);tone(110,2.2,'sine',.02);},
  approach(){tone(70,3,'sawtooth',.035,150);noiz(3,.05,300,'lowpass',0,900);},
  reentry(dur,pk){const a=audio();if(!a)return;if(!NB)noiz(.01,.0001,100);const t=a.currentTime;
    const src=a.createBufferSource(),fl=a.createBiquadFilter(),v=a.createGain();src.buffer=NB;src.loop=true;fl.type='lowpass';
    fl.frequency.setValueAtTime(180,t);fl.frequency.exponentialRampToValueAtTime(1500,t+pk);fl.frequency.exponentialRampToValueAtTime(220,t+dur);
    v.gain.setValueAtTime(.0001,t);v.gain.exponentialRampToValueAtTime(.38,t+pk);v.gain.exponentialRampToValueAtTime(.0001,t+dur);
    src.connect(fl);fl.connect(v);v.connect(MASTER);src.start(t);src.stop(t+dur+.05);
    const o=a.createOscillator(),g=a.createGain();o.type='sawtooth';o.frequency.setValueAtTime(36,t);o.frequency.linearRampToValueAtTime(64,t+pk);o.frequency.linearRampToValueAtTime(40,t+dur);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.07,t+pk);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(MASTER);o.start(t);o.stop(t+dur+.05);},
  // tonnerre : claquement, puis long grondement qui roule (bouffées irrégulières de bruit grave)
  // un tonnerre qui suit de près le précédent ne rejoue que son claquement (sinon les grondements s'empilent et saturent)
  thunder(){const a=audio();if(!a)return;const now=a.currentTime;if(SFX.lastThunder&&now-SFX.lastThunder<1.6){noiz(.2,.22,1400,'bandpass',0,500);return;}SFX.lastThunder=now;noiz(.12,.3,3000,'lowpass');noiz(.25,.35,1400,'bandpass',.02,500);
    const t=a.currentTime+.05,dur=3.4+Math.random()*.8,src=a.createBufferSource(),fl=a.createBiquadFilter(),v=a.createGain();
    src.buffer=NB;src.loop=true;fl.type='lowpass';fl.Q.value=.7;fl.frequency.setValueAtTime(420,t);fl.frequency.exponentialRampToValueAtTime(70,t+dur);
    v.gain.setValueAtTime(0.0001,t);v.gain.exponentialRampToValueAtTime(.55,t+.12);let u=t+.12;
    while(u<t+dur-.4){u+=.25+Math.random()*.45;v.gain.linearRampToValueAtTime(Math.max(.05,.5*(1-(u-t)/dur))*(.45+Math.random()*.7),u);}   // roulements
    v.gain.exponentialRampToValueAtTime(0.0001,t+dur);src.connect(fl);fl.connect(v);v.connect(MASTER);src.start(t,Math.random()*.5);src.stop(t+dur+.05);
    tone(48,1.6,'sine',.22,30,.04);},
  thrust(){noiz(4,.12,900,'lowpass',0,160);tone(62,4,'square',.03,38);},
  touchdown(){tone(72,.35,'square',.13,38);noiz(.6,.22,700,'lowpass',0,90);noiz(.3,.08,3000,'highpass',.05);},
  done(){[440,554,659,880].forEach((f,i)=>tone(f,.35,'triangle',.06,null,i*.06));}
};
function unlock(){unlocked=true;audio();}
addEventListener('pointerdown',unlock);addEventListener('keydown',unlock);

