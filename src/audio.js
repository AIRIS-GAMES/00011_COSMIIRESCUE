// Supplied music stays separate from the synthesized gameplay effects.
export const BGM_SRC='./Asset/Hypnoticcuping in the Wind.mp3';
export const RAINBOW_BGM_SRC='./Asset/audio/rainbow-24s.mp3';
export class GameAudio {
  constructor(){this.enabled=true;this.ctx=null;this.bgm=new Audio(BGM_SRC);this.bgm.loop=true;this.bgm.preload='auto';this.bgm.volume=.45;this.pending=false;this.blocked=false;this.active=false;}
  unlock(){this.blocked=false;if(!this.ctx){const Audio=window.AudioContext||window.webkitAudioContext;if(Audio)this.ctx=new Audio();}if(this.ctx?.state==='suspended')this.ctx.resume().catch(()=>{});}
  suspend(){this.suspended=true;this.active=false;this.bgm.pause();this.ctx?.suspend().catch(()=>{});}
  resume(){this.suspended=false;this.unlock();}
  setRainbow(enabled){if(this.rainbow===enabled)return;if(enabled)this.normalTime=this.bgm.currentTime;this.rainbow=enabled;this.bgm.pause();this.bgm.src=enabled?RAINBOW_BGM_SRC:BGM_SRC;this.bgm.currentTime=enabled?0:(this.normalTime||0);this.blocked=false;}
  restart(){this.setRainbow(false);this.normalTime=0;this.bgm.currentTime=0;this.music(true);}
  tone(freq,duration=.09,type='sine',gain=.06,delay=0,end=null){
    if(!this.enabled||this.suspended||globalThis.document?.hidden||!this.ctx||this.ctx.state!=='running')return;
    const t=this.ctx.currentTime+delay,osc=this.ctx.createOscillator(),amp=this.ctx.createGain();osc.type=type;osc.frequency.setValueAtTime(freq,t);if(end)osc.frequency.exponentialRampToValueAtTime(end,t+duration);amp.gain.setValueAtTime(0,t);amp.gain.linearRampToValueAtTime(gain,t+.008);amp.gain.exponentialRampToValueAtTime(.0001,t+duration);osc.connect(amp);amp.connect(this.ctx.destination);osc.start(t);osc.stop(t+duration+.02);
  }
  effect(type){
    if(type==='rainbowStart')[523,784,1047,1568].forEach((f,i)=>this.tone(f,.28,'triangle',.05,i*.06));
    if(type==='rainbowEnd')this.tone(784,.25,'sine',.04,0,392);
    if(type==='rescue'){this.tone(760,.1,'sine',.06,0,1350);this.tone(1520,.16,'triangle',.03,.05);}
    if(type==='bank'){this.tone(1047,.17,'triangle',.055);this.tone(1568,.2,'sine',.025,.06);}
    if(type==='return'){[523,659,784,1047].forEach((f,i)=>this.tone(f,.24,'triangle',.06,i*.09));}
    if(type==='lost')this.tone(490,.22,'triangle',.05,0,220);
    if(type==='bump'||type==='rim')this.tone(280,.12,'sine',.045,0,430);
    if(type==='turn')this.tone(420,.11,'sine',.025,0,640);
    if(type==='flap')this.tone(440,.085,'sine',.045,0,790);
    if(type==='coin')this.tone(1320,.07,'sine',.035);
    if(type==='pass')this.tone(660,.13,'triangle',.04);
    if(type==='near'){[880,1109,1320].forEach((f,i)=>this.tone(f,.14,'triangle',.055,i*.05));}
    if(type==='break'){this.tone(130,.18,'sawtooth',.075,0,35);this.tone(720,.11,'square',.025);}
    if(type==='hit')this.tone(180,.3,'sawtooth',.08,0,40);
    if(type==='best')[659,784,1047,1319].forEach((f,i)=>this.tone(f,.35,'triangle',.065,i*.13));
  }
  music(active){
    this.active=active;
    if(!active||!this.enabled||this.suspended||globalThis.document?.hidden){this.bgm.pause();return;}
    if(!this.bgm.paused||this.pending||this.blocked)return;
    this.pending=true;
    this.bgm.play().catch(error=>{if(error.name!=='AbortError')this.blocked=true;}).finally(()=>{this.pending=false;if(!this.active||!this.enabled||this.suspended||globalThis.document?.hidden)this.bgm.pause();});
  }
}
