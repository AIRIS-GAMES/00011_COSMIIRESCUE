export const BGM_SRC='./Asset/audio/bgm/Hypnoticcuping in the Wind.mp3';
export const RAINBOW_BGM_SRC='./Asset/audio/bgm/rainbow-24s.mp3';
export const SFX_SOURCES=Object.fromEntries([
  'rainbowStart','rainbowEnd','rescue','bank','return','lost','bump','turn',
  'flap','coin','pass','near','break','hit','best',
].map(name=>[name,`./Asset/audio/sfx-mp3/${name}.mp3`]));
// WAV files are offline masters only; iPhone playback uses MP3 throughout.
export const SFX_WAV_SOURCES=Object.fromEntries(Object.keys(SFX_SOURCES).map(name=>[name,`./Asset/audio/sfx/${name}.wav`]));
export const SFX_VOLUMES={rainbowStart:.5,rainbowEnd:.4,rescue:.6,bank:.45,return:.5,lost:.5,bump:.4,turn:.3,flap:.6,coin:.35,pass:.4,near:.5,break:.55,hit:.6,best:.5};
const MAX_SFX=4;
const POP_GROUP_MS=150;

export class GameAudio {
  constructor(now=()=>performance.now()){
    this.now=now;this.lastPop=-Infinity;
    this._enabled=true;this.unlocked=false;this.suspended=false;
    this.pending=null;this.blocked=false;this.active=false;this.generation=0;
    // One music element prevents overlapping normal/rainbow tracks.
    this.bgm=new Audio(BGM_SRC);this.bgm.loop=true;this.bgm.preload='auto';this.bgm.volume=.20;
    this.sfx=Object.fromEntries(Object.entries(SFX_SOURCES).map(([name,src])=>{
      const audio=new Audio(src);audio.preload='auto';audio.volume=SFX_VOLUMES[name];return [name,audio];
    }));
    this.voices=new Map();
    this.initializedMedia=new WeakSet();this.lastError=null;
  }
  get enabled(){return this._enabled;}
  // The existing sound switch currently controls BGM only for device diagnosis.
  set enabled(value){this._enabled=!!value;if(!this._enabled)this.stopMusic();}
  unlock(){
    this.unlocked=true;this.blocked=false;
    // Safari requires load()/play() ON EACH element inside a user gesture.
    // load() unlocks the media without playing all effects or disturbing the BGM.
    for(const audio of [this.bgm,...Object.values(this.sfx)]){
      if(this.initializedMedia.has(audio))continue;
      try{audio.load();this.initializedMedia.add(audio);}catch(error){this.mediaError(error,audio);}
    }
  }
  mediaError(error,audio){
    if(error?.name==='AbortError')return;
    this.lastError={name:error?.name||'Error',message:error?.message||String(error),src:audio.currentSrc||audio.src};
    // A subsequent real tap retries initialization after an interruption/rejection.
    this.initializedMedia.delete(audio);
  }
  suspend(){this.suspended=true;this.active=false;this.stopMusic();this.stopEffects();}
  resume(){this.suspended=false;this.unlock();}
  stopMusic(){this.generation++;this.pending=null;this.bgm.pause();}
  stopEffects(){for(const audio of Object.values(this.sfx)){audio.pause();audio.currentTime=0;}this.voices.clear();this.lastPop=-Infinity;}
  setRainbow(enabled){
    if(this.rainbow===enabled)return;
    if(enabled){this.normalTime=this.bgm.currentTime;this.stopEffects();}
    this.rainbow=enabled;this.stopMusic();this.bgm.src=enabled?RAINBOW_BGM_SRC:BGM_SRC;
    this.bgm.currentTime=enabled?0:(this.normalTime||0);this.blocked=false;
  }
  restart(){this.stopEffects();this.setRainbow(false);this.normalTime=0;this.stopMusic();this.bgm.currentTime=0;this.music(true);}
  effect(type){
    if(!this.unlocked||this.suspended||this.rainbow||globalThis.document?.hidden)return;
    const audio=this.sfx[type==='rim'?'bump':type];if(!audio)return;
    // Group nearby POPs across animation frames without delaying the first one.
    if(type==='rescue'&&this.now()-this.lastPop<POP_GROUP_MS)return;
    for(const [voice,state] of this.voices)if(!state.pending&&(voice.paused||voice.ended))this.voices.delete(voice);
    // Rescue wins over tapping, including while its play() is still pending.
    if(type==='flap'&&this.voices.has(this.sfx.rescue))return;
    if(type==='rescue'&&this.voices.has(this.sfx.flap)){
      this.sfx.flap.pause();this.sfx.flap.currentTime=0;this.voices.delete(this.sfx.flap);
    }
    // Do not abort and restart a decoder that is still preparing the same sound.
    if(this.voices.get(audio)?.pending)return;
    if(type==='rescue')this.lastPop=this.now();
    this.voices.delete(audio);
    if(this.voices.size>=MAX_SFX){const oldest=this.voices.keys().next().value;oldest.pause();oldest.currentTime=0;this.voices.delete(oldest);}
    // Restart the same element on rapid repeats, as in CosmiiCannon's playSfx.
    audio.pause();audio.currentTime=0;
    const state={pending:true};this.voices.set(audio,state);
    try{Promise.resolve(audio.play()).catch(error=>{if(this.voices.get(audio)===state){if(type==='rescue')this.lastPop=-Infinity;this.mediaError(error,audio);}}).finally(()=>{
      if(this.voices.get(audio)!==state)return;
      state.pending=false;
      if(this.suspended||globalThis.document?.hidden){audio.pause();this.voices.delete(audio);}
    });}catch(error){if(type==='rescue')this.lastPop=-Infinity;this.mediaError(error,audio);this.voices.delete(audio);}
  }
  music(active){
    const wasActive=this.active;this.active=active;
    if(!active||!this.enabled||this.suspended||globalThis.document?.hidden){
      if(wasActive||!this.bgm.paused||this.pending)this.stopMusic();
      return;
    }
    if(!this.unlocked||!this.bgm.paused||this.pending||this.blocked)return;
    const token=++this.generation;this.pending=token;
    try{Promise.resolve(this.bgm.play()).catch(error=>{
      if(token===this.generation&&error.name!=='AbortError'){this.blocked=true;this.mediaError(error,this.bgm);}
    }).finally(()=>{
      if(token!==this.generation)return;
      this.pending=null;
      if(!this.active||!this.enabled||this.suspended||globalThis.document?.hidden)this.stopMusic();
    });}catch(error){this.pending=null;this.blocked=true;this.mediaError(error,this.bgm);}
  }
}
