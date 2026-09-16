export const COLLABORATION_IMAGES=Array.from({length:7},(_,i)=>`./Asset/collaborations/ohsun/characters/ohsun_${String(i+7).padStart(2,'0')}.png`);

function timestamp(value,fallback){
  if(value===null||value===undefined)return fallback;
  // Fail closed on ambiguous or malformed scheduling, including missing timezone.
  if(typeof value!=='string'||!/(Z|[+-]\d{2}:\d{2})$/.test(value))return NaN;
  return Date.parse(value);
}
export function collaborationAvailable(config,now=Date.now()){
  const start=timestamp(config?.startsAt,-Infinity),end=timestamp(config?.endsAt,Infinity);
  return !!config?.enabled&&Number.isFinite(now)&&start<end&&now>=start&&now<end;
}
// Future campaigns need their assets in the build; expired/disabled ones do not.
export function collaborationAssetsNeeded(config,now=Date.now()){
  return !!config?.enabled&&timestamp(config.startsAt,-Infinity)<timestamp(config.endsAt,Infinity)&&now<timestamp(config.endsAt,Infinity);
}

export class CollaborationMode {
  constructor(config,now=Date.now){
    this.config=config;this.now=now;this.enabled=collaborationAvailable(config,now());
    this.target=Math.max(1,Math.floor(config?.target||5));this.seconds=Math.max(1,config?.feverSeconds||10);
    this.delivered=0;this.progress=0;this.left=0;this.elapsed=0;this.activations=0;this.spawnWait=0;
  }
  get active(){return this.enabled&&this.left>0;}
  refresh(){this.enabled=collaborationAvailable(this.config,this.now());if(!this.enabled)this.left=0;}
  assign(game,source){
    if(!this.enabled)return null;
    // Preserve identity after a collision; explicit null is a normal friend.
    if(Object.hasOwn(source,'collaborationKind'))return source.collaborationKind;
    const rate=this.active?this.config.feverSpawnRate:this.config.spawnRate;
    return game.random()<(rate??.3)?Math.floor(game.random()*COLLABORATION_IMAGES.length):null;
  }
  returnGroup(game,friends){
    if(!this.enabled)return;
    const count=friends.filter(f=>Number.isInteger(f.collaborationKind)).length;
    this.delivered+=count;this.progress+=count;
    if(this.progress<this.target)return;
    this.activations+=Math.floor(this.progress/this.target);this.progress%=this.target;
    // A large group or another delivery restarts at ten seconds; no unlimited stack.
    this.left=this.seconds;this.elapsed=0;this.spawnWait=0;game.stun=0;game.cooldown=0;
    for(const key of Object.keys(game.effects))game.effects[key]=0;
    game.emit('collaborationStart',{x:game.player.x,y:game.player.y});
  }
  update(game,dt){
    if(!this.active)return;
    this.left=Math.max(0,this.left-dt);this.elapsed+=dt;
    if(!this.active){game.cooldown=Math.max(game.cooldown,.8);game.emit('collaborationEnd');return;}
    this.spawnWait-=dt;
    // Make the higher appearance rate visible even in already generated chunks.
    if(this.spawnWait<=0){
      this.spawnWait=.8;
      if(game.friends.filter(f=>f.feverSpawn).length>=8)return;
      const p=game.player,forward=game.direction<-.15?-1:1;
      game.spawnFriend({x:Math.max(60,p.x+forward*(160+game.random()*100)),y:Math.max(80,p.y+(game.random()-.5)*180),feverSpawn:true});
    }
  }
}
