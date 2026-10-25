import {analyticsConfig} from './analytics-config.js';

// Analytics never blocks gameplay. Fixed event names avoid unbounded cardinality.
export class RescueAnalytics {
  constructor(send=null){this.send=send;this.queue=[];this.active=false;this.pendingReturn=null;this.failed=false;}
  call(...args){try{if(this.send)this.send(...args);else if(!this.failed&&this.queue.length<128)this.queue.push(args);}catch{/* Gameplay must survive a blocked SDK. */}}
  async initialize(environment='production',loader=()=>import('./vendor/GameAnalytics-5.0.0.js')){
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
      if(sdk.gameanalytics){let attempts=0;while(!sdk.gameanalytics.GameAnalytics.isRemoteConfigsReady()){if(++attempts>100)throw Error('Analytics init timeout');await new Promise(resolve=>setTimeout(resolve,200));}}
      this.send=send;
      this.call('addDesignEvent','App:Open');
      for(const args of this.queue)this.call(...args);this.queue=[];
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
  community(name,data={}){
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
  presentation(name,data={}){
    if(name==='variant'){this.call('addDesignEvent',`Presentation:variant:opening_${data.opening?'on':'off'}:reactions_${data.reactions?'on':'off'}`,1);return;}
    if(!['story_open','story_complete','story_skip'].includes(name))return;
    this.call('addDesignEvent',`Presentation:${name}:${['first','startup'].includes(data.source)?data.source:'replay'}`,1);
  }
  event(e,game){
    if(!this.active)return;
    if(e.type==='rescue')this.design('Rescue:Success',1);
    if(e.type==='return'){this.checkpoints++;this.design('Checkpoint:Count',1);this.design('Checkpoint:Rescued',e.count);this.design('Checkpoint:Points',e.total);this.design('Checkpoint:TotalScore',game.score);}
    if(e.type==='rainbowStart')this.design('Rainbow:Start',1);
    if(e.type==='break'&&e.rainbow)this.design('Rainbow:Destroyed',1);
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

export const analytics=new RescueAnalytics();
export function initializeAnalytics(){
  // Automated gameplay verification must not pollute real player statistics.
  if(globalThis.navigator?.webdriver||new URLSearchParams(globalThis.location?.search).get('analytics')==='off'){analytics.failed=true;return;}
  const host=globalThis.location?.hostname||'';
  const development=host==='localhost'||host==='127.0.0.1'||host==='[::1]'||/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host);
  return analytics.initialize(development?'development':'production');
}
