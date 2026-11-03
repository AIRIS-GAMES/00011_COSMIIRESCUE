// Only a small, fixed advertising funnel is forwarded; GameAnalytics retains detail.
const colors=['green','pink','blue','red','purple'];
export function attributionEvent(id,value=1){
 const p=id.split(':'),numeric=Number.isFinite(value)?Math.max(0,value):0;
 if(p[0]==='PSF'&&p[1]==='v2'){
  if(p[2]==='practice_complete')return {name:'af_tutorial_completion',values:{af_success:true,source:p[3]==='onboarding'?'onboarding':'optional'}};
  if(p[2]==='first_return')return {name:'cosmii_first_return',values:{seconds:numeric}};
  if(p[2]==='normal_attempt')return {name:'cosmii_play',values:{mode:'normal',attempt:['first','retry','legacy'].includes(p[3])?p[3]:'legacy'}};
  if(p[2]==='retry'&&['normal','hard'].includes(p[3]))return {name:'cosmii_retry',values:{mode:p[3]}};
 }
 if(id==='Interest:play:hard')return {name:'cosmii_play',values:{mode:'hard'}};
 if(p[0]==='Engagement'&&p[1]==='v1'){
  if(p[2]==='room_open')return {name:'cosmii_room_open',values:{visit:p[4]==='revisit'?'revisit':'first'}};
  if(p[2]==='focus_start'&&colors.includes(p[4]))return {name:'cosmii_first_interaction',values:{color:p[4]}};
  if(p[2]==='trust_gain'&&colors.includes(p[4]))return {name:'cosmii_trust_gain',values:{color:p[4],amount:Math.min(10,numeric)}};
 }
 return null;
}

export class Attribution {
 constructor(){this.queue=[];this.state='idle';this.plugin=null;}
 track(id,value){
  const event=attributionEvent(id,value);if(!event||this.state==='disabled'||this.state==='failed')return;
  if(this.state==='ready')this.send(event);else if(this.queue.length<64)this.queue.push(event);
 }
 send(event){try{Promise.resolve(this.plugin.track(event)).catch(()=>{});}catch{} }
 initialize({native=false,disabled=false,load}={}){
  if(this.loading)return this.loading;
  if(!native||disabled){this.state='disabled';this.queue=[];return Promise.resolve();}
  this.state='loading';
  this.loading=(async()=>{try{
   const loaded=await load();this.plugin=loaded.plugin;const result=await this.plugin.initialize();
   if(!result.enabled){this.state='disabled';this.queue=[];return;}
   this.state='ready';const queued=this.queue;this.queue=[];for(const event of queued)this.send(event);
  }catch{this.state='failed';this.queue=[];}})();
  return this.loading;
 }
}
export const attribution=new Attribution();
export function initializeAttribution(){
 const native=globalThis.Capacitor?.getPlatform?.()==='ios';
 const disabled=!!globalThis.navigator?.webdriver||new URLSearchParams(globalThis.location?.search).get('analytics')==='off';
 return attribution.initialize({native,disabled,load:async()=>{
  const {registerPlugin}=await import('./vendor/capacitor-core-7.6.9.js');
  // A Capacitor proxy has a synthetic `then`; never return it directly from a promise.
  return {plugin:registerPlugin('CosmiiAttribution')};
 }});
}
