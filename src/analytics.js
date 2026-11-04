import {otherGames} from './other-games.js';
import {analyticsConfig} from './analytics-config.js';
import {roomProps} from './room-data.js';
import {attribution,initializeAttribution} from './attribution.js';

// Analytics never blocks gameplay. Fixed event names avoid unbounded cardinality.
export class RescueAnalytics {
  constructor(send=null,observe=null){this.send=send;this.observe=observe;this.queue=[];this.active=false;this.pendingReturn=null;this.failed=false;}
  call(...args){try{this.observe?.(...args);}catch{}try{if(this.send)this.send(...args);else if(!this.failed&&this.queue.length<128)this.queue.push(args);}catch{/* Gameplay must survive a blocked SDK. */}}
  async initialize(environment='production',loader=()=>import('./vendor/GameAnalytics-5.0.0.js'),wait=ms=>new Promise(resolve=>setTimeout(resolve,ms))){
    if(this.loading)return this.loading;
    this.loading=(async()=>{try{
      const sdk=await loader();const send=(...args)=>{if(args[0]==='addProgressionEvent'&&sdk.gameanalytics)args[1]=sdk.gameanalytics.EGAProgressionStatus[args[1]];sdk.default(...args);};
      send('setEnabledInfoLog',false);send('setEnabledVerboseLog',false);
      send('configureBuild',analyticsConfig.build);
      send('configureAvailableCustomDimensions01',['normal','hard']);
      send('configureAvailableCustomDimensions02',['development','production']);
      send('setCustomDimension02',environment);
      send('initialize',analyticsConfig.gameKey,analyticsConfig.secretKey);
      // The SDK drops events before its asynchronous init response starts a session.
      // Keep our bounded queue until that response has been processed.
      if(sdk.gameanalytics){let attempts=0;while(!sdk.gameanalytics.GameAnalytics.isRemoteConfigsReady()){await wait(attempts++<100?200:5000);}}
      this.send=send;
      this.call('addDesignEvent','App:Open');
      for(const args of this.queue){try{this.send(...args);}catch{}}this.queue=[];
    }catch{this.failed=true;this.queue=[];}})();return this.loading;
  }
  start(game){
    if(this.active)this.end(game,'retry');
    this.mode=game.mode==='hard'?'hard':'normal';this.active=true;this.pendingReturn=null;this.checkpoints=0;
    this.call('setCustomDimension01',this.mode);
    this.call('addProgressionEvent','Start','Endless',this.mode);
    this.design('Run:Start');
  }
  design(name,value){this.call('addDesignEvent',`${name}:${this.mode||'normal'}`,value);}
  engagement(name,data={}){
    if(!['room_open','room_select','focus_start','focus_end','focus_abandon','focus_touches','focus_seconds','trust_gain','decor_open','decor_change','returns_open','snack_given'].includes(name))return;
    const source=['title','result','home','room'].includes(data.source)?data.source:'title';
    const color=['green','pink','blue','red','purple'].includes(data.characterType)?data.characterType:'group';
    let suffix=color;
    if(name==='room_open')suffix=data.revisit?'revisit':'first';
    if(name==='decor_change')suffix=roomProps.some(p=>p.id===data.prop)?data.prop:'none';
    if(name==='snack_given'){if(!['apple','cherry','cake'].includes(data.snack))return;suffix=color+':'+data.snack;}
    const value=data.value??1;
    if(!Number.isFinite(value)||value<0)return;
    this.call('addDesignEvent',`Engagement:v1:${name}:${source}:${suffix}`,value);
  }
  community(name,data={}){
    // Daily missions: open (title/notification), each claim by mission id, and the all-clear bonus.
    if(name==='missions_open'){this.call('addDesignEvent',`Missions:v1:open:${data.source==='notification'?'notification':'title'}`,1);return;}
    if(name==='mission_claim'){if(/^[a-z0-9-]+$/.test(data.mission||''))this.call('addDesignEvent',`Missions:v1:claim:${data.mission}`,1);return;}
    if(name==='mission_bonus'){this.call('addDesignEvent',`Missions:v1:bonus:${data.reward==='furniture'?'furniture':'treat'}`,Number(data.streak)||1);return;}
    if(name==='games_open'){this.call('addDesignEvent','CrossPromo:v1:open:title',1);return;}
    if(name==='game_store_click'){if(otherGames.some(game=>game.id===data.gameId))this.call('addDesignEvent',`CrossPromo:v1:store_click:${data.gameId}`,1);return;}

    if(['character_initial','character_select','profile_display','goal_display','profile_unlock','goal_complete','result_detail'].includes(name)){this.interest(name,data);return;}
    if(!['play','encyclopedia_open','social_open','external_click','social_popup_view','social_popup_close'].includes(name))return;
    const source=['title','result','home','encyclopedia','result_popup'].includes(data.source)?data.source:'title';
    const type=['green','pink','blue','red','purple'].includes(data.characterType)?data.characterType:'group';
    const destination=['x','tiktok','instagram','line'].includes(data.destination)?data.destination:'none';
    const mode=['normal','hard'].includes(data.mode)?data.mode:'normal';
    const suffix=name==='play'?mode:name==='external_click'?`${source}:${destination}:${type}`:source;
    this.call('addDesignEvent',`Interest:${name}:${suffix}`,1);
  }
  interest(name,data={}){
    if(!['character_initial','character_select','profile_display','goal_display','profile_unlock','goal_complete','result_detail'].includes(name))return;
    const source=['title','result','home','encyclopedia','return'].includes(data.source)?data.source:'title';
    const kind=['green','pink','blue','red','purple'].includes(data.characterType)?data.characterType:'group';
    const status=['preview','basic','achieved'].includes(data.status)?data.status:'preview';
    this.call('addDesignEvent',`InterestV2:${name}:${source}:${kind}:${status}`,1);
  }
  notification(name,kind){
    if(name==='opened'&&['d1','d7'].includes(kind)){this.call('addDesignEvent',`Reminder:v1:opened:${kind}`,1);return;}
    if(['permission_request','permission_granted','permission_denied','disabled'].includes(name))this.call('addDesignEvent',`Reminder:v1:${name}`,1);
  }
  presentation(name,data={}){
    if(name==='variant'){this.call('addDesignEvent',`Presentation:variant:opening_${data.opening?'on':'off'}:reactions_${data.reactions?'on':'off'}`,1);return;}
    if(!['story_open','story_complete','story_skip'].includes(name))return;
    this.call('addDesignEvent',`Presentation:${name}:${['first','startup'].includes(data.source)?data.source:'replay'}`,1);
  }
  event(e,game){
    if(!this.active)return;
    if(e.type==='skillStart'&&!game.isTraining&&Number.isInteger(e.kind)&&e.kind>=0&&e.kind<4)this.design('Skill:Activate:'+['pink','blue','red','purple'][e.kind],1);
    if(e.type==='rescue')this.design('Rescue:Success',1);
    if(e.type==='return'){this.checkpoints++;this.design('Checkpoint:Count',1);this.design('Checkpoint:Rescued',e.count);this.design('Checkpoint:Points',e.total);this.design('Checkpoint:TotalScore',game.score);}
    if(e.type==='area'&&!game.isTraining)this.design('Area:Reached:'+e.id,game.returnSequence||0);
    if(e.type==='rainbowStart')this.design('Rainbow:Start',1);
    if(e.type==='break'&&e.rainbow&&e.cause!=='redSkill')this.design('Rainbow:Destroyed',1);
    if(e.type==='lost')this.design('Damage:FriendsLost',e.count||1);
    if(e.type==='hit')this.design('Damage:LifeLost',1);
    if(e.type==='finish')this.end(game,e.reason==='hit'?'death':e.reason==='quit'?'quit':'finish');
  }
  pageHide(game,persisted){if(!persisted)this.end(game,'leave');}
  end(game,reason='quit'){
    if(!this.active)return;this.active=false;
    if(reason==='death'||reason==='finish')this.call('addProgressionEvent',reason==='death'?'Fail':'Complete','Endless',this.mode,'',Math.floor(game.score));
    this.design(`Run:End:${reason}`);
    for(const [name,value] of Object.entries({Score:game.score,Rescued:game.rescued,MaxCarry:game.maxCarry,BestReturn:game.bestReturn,Seconds:game.time,Distance:game.travel,Checkpoints:this.checkpoints}))this.design(`Run:${name}`,Math.max(0,Math.floor(value||0)));
    this.pendingReturn=null;
  }
}

export const analytics=new RescueAnalytics(null,(method,id,value)=>{if(method==='addDesignEvent')attribution.track(id,value);});
export function initializeAnalytics(){
  initializeAttribution();
  // Automated gameplay verification must not pollute real player statistics.
  if(globalThis.navigator?.webdriver||new URLSearchParams(globalThis.location?.search).get('analytics')==='off'){analytics.failed=true;return;}
  const host=globalThis.location?.hostname||'';
  const native=globalThis.Capacitor?.isNativePlatform?.()||globalThis.location?.protocol==='capacitor:';
  const development=!native&&(host==='localhost'||host==='127.0.0.1'||host==='[::1]'||/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host));
  return analytics.initialize(development?'development':'production');
}
