import {ROOM_KEY,roomProps,roomResidents,validRoomState} from './room-data.js';
import {AREAS} from './areas.js';
import {t as _t} from './i18n.js';
// Daily missions: three small goals per local day (two in flight, one in the room).
// Rewards: star cookies (a special room treat), a trust bonus, and — for clearing all three — one furniture piece early.
export const MISSION_KEY='cosmii-missions-v1';
export const TREAT={id:'star-cookie',name:_t('ほしクッキー'),src:'./Asset/objects/star-cookie.png',trust:5};
export const TRUST_BONUS=5;
const colors=[['pink',_t('ピンク')],['blue',_t('水色')],['red',_t('赤')],['purple',_t('紫')]];
// Templates are pure data so tests and the UI read the same text and targets.
const flight=[
 ...colors.map(([id,name],kind)=>({id:'rescue-'+id,type:'rescue',kind,target:10,text:_t('{0}を10匹助ける',[name]),icon:`./Asset/cast/${id}.png`})),
 {id:'big-return',type:'bigReturn',target:8,text:_t('8匹まとめて帰還する'),icon:'./Asset/stage/checkpoint-cosmii.png'},
 {id:'total-return',type:'delivered',target:25,text:_t('HOMEへ合計25匹届ける'),icon:'./Asset/ui/menu/returns.png'},
 {id:'reach-sunset',type:'area',target:1,area:1,text:_t('エリア「{0}」まで行く',[AREAS[1].name]),icon:'./Asset/objects/bird.png'},
 {id:'reach-neon',type:'area',target:1,area:2,text:_t('エリア「{0}」まで行く',[AREAS[2].name]),icon:'./Asset/objects/lightning.png'},
 {id:'skills',type:'skill',target:3,text:_t('技を3回使う'),icon:'./Asset/cast/pink.png'},
 {id:'runs',type:'run',target:3,text:_t('3回あそぶ'),icon:'./Asset/ui/menu/practice.png'},
];
const room=[
 {id:'snack',type:'snack',target:1,text:_t('部屋でおやつをあげる'),icon:'./Asset/objects/apple.png'},
 {id:'snack-3',type:'snack',target:3,text:_t('部屋でおやつを3回あげる'),icon:'./Asset/objects/cake.png'},
 {id:'touch',type:'touch',target:1,text:_t('部屋でコスミーとふれあう'),icon:'./Asset/ui/menu/room.png'},
];
export const MISSION_TEMPLATES=Object.freeze([...flight,...room]);
const rewards=[{type:'treat',count:1,label:_t('ほしクッキー×1')},{type:'trust',label:_t('みんなの信頼度+')+TRUST_BONUS},{type:'treat',count:1,label:_t('ほしクッキー×1')}];
export const localDay=(date=new Date())=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
function seeded(text){let h=2166136261;for(const c of text)h=Math.imul(h^c.charCodeAt(0),16777619);return()=>{h=Math.imul(h^h>>>15,2246822507);h=Math.imul(h^h>>>13,3266489909);h^=h>>>16;return (h>>>0)/4294967296;};}
// Same day → same three missions on every device; two different flight types plus one room mission.
export function missionsFor(day){
 const random=seeded(day),pick=list=>list[Math.floor(random()*list.length)];
 const first=pick(flight);let second=pick(flight);for(let i=0;i<20&&(second.type===first.type);i++)second=pick(flight);
 return [first,second,pick(room)].map((m,i)=>({id:m.id,progress:0,claimed:false,reward:rewards[i]}));
}
export class DailyMissions {
 constructor({storage,now=()=>new Date()}={}){if(storage===undefined){try{storage=globalThis.localStorage;}catch{storage=null;}}this.storage=storage;this.now=now;this.listeners=new Set();this.load();}
 load(){
  let data=null;try{data=JSON.parse(this.storage?.getItem(MISSION_KEY));}catch{}
  const day=localDay(this.now());
  this.data={day,missions:missionsFor(day),treats:0,bonusProps:[],bonusClaimed:false,streak:0,lastCleared:null};
  if(data&&typeof data==='object'){
   this.data.treats=Number.isSafeInteger(data.treats)&&data.treats>0?data.treats:0;
   this.data.bonusProps=Array.isArray(data.bonusProps)?data.bonusProps.filter(id=>roomProps.some(p=>p.id===id)):[];
   this.data.streak=Number.isSafeInteger(data.streak)?data.streak:0;this.data.lastCleared=typeof data.lastCleared==='string'?data.lastCleared:null;
   if(data.day===day&&Array.isArray(data.missions))this.data.missions=this.data.missions.map((m,i)=>{const saved=data.missions[i];return saved?.id===m.id?{...m,progress:Math.max(0,Number(saved.progress)||0),claimed:saved.claimed===true}:m;});
   if(data.day===day)this.data.bonusClaimed=data.bonusClaimed===true;
  }
  return this;
 }
 save(){try{this.storage?.setItem(MISSION_KEY,JSON.stringify(this.data));}catch{}}
 // Re-read before every use: picks up another tab's progress and rolls over at local midnight.
 fresh(){return this.load();}
 template(m){return MISSION_TEMPLATES.find(t=>t.id===m.id);}
 list(){this.fresh();return this.data.missions.map(m=>{const t=this.template(m);return {...t,...m,done:m.progress>=t.target};});}
 // Feed gameplay/room events. Returns the missions completed by this event (for a toast).
 track(type,value=1,detail={}){
  this.fresh();const completed=[];
  for(const m of this.data.missions){
   const t=this.template(m);if(t.type!==type||m.progress>=t.target)continue;
   if(type==='rescue'&&detail.kind!==t.kind)continue;
   if(type==='area'&&value<t.area)continue;
   const next=type==='bigReturn'?Math.max(m.progress,value):type==='area'?1:m.progress+value;
   if(next===m.progress)continue;m.progress=Math.min(t.target,next);
   if(m.progress>=t.target)completed.push({...t,...m,done:true});
  }
  if(completed.length||this.dirty(type))this.save();
  if(completed.length)for(const listener of this.listeners)listener(completed);
  return completed;
 }
 dirty(type){return this.data.missions.some(m=>this.template(m).type===type);}
 get claimable(){return this.list().filter(m=>m.done&&!m.claimed).length+(this.bonusReady?1:0);}
 get allDone(){return this.list().every(m=>m.done);}
 get bonusReady(){return this.data.missions.every(m=>m.claimed)&&!this.data.bonusClaimed;}
 nextBonusProp(total=0){return roomProps.find(p=>p.required>total&&!this.data.bonusProps.includes(p.id))||null;}
 claim(index,{progress}={}){
  this.fresh();const m=this.data.missions[index];if(!m)return null;const t=this.template(m);
  if(m.claimed||m.progress<t.target)return null;
  m.claimed=true;const reward=m.reward;
  if(reward.type==='treat')this.data.treats+=reward.count;
  if(reward.type==='trust')reward.applied=addRoomTrust(TRUST_BONUS,progress,this.storage);
  this.save();return reward;
 }
 // Clearing all three: unlock the next locked furniture now (or two cookies once everything is open).
 claimBonus(total=0){
  this.fresh();if(!this.bonusReady)return null;const prop=this.nextBonusProp(total);
  this.data.bonusClaimed=true;const day=this.data.day,yesterday=localDay(new Date(this.now().getTime()-864e5));
  this.data.streak=this.data.lastCleared===yesterday?this.data.streak+1:1;this.data.lastCleared=day;
  let reward;if(prop){this.data.bonusProps.push(prop.id);reward={type:'furniture',prop};}else{this.data.treats+=2;reward={type:'treat',count:2};}
  this.save();return reward;
 }
 useTreat(){this.load();if(this.data.treats<=0)return false;this.data.treats--;this.save();return true;}
 subscribe(listener){this.listeners.add(listener);return()=>this.listeners.delete(listener);}
}
// Trust bonus lands on everyone currently living in the room (green + each rescued color).
export function addRoomTrust(amount,progress,storage=globalThis.localStorage){
 try{
  const total=progress?.totalReturned||0,ids=roomResidents(progress?.data?.counts).map(c=>c.id);
  const state=validRoomState(JSON.parse(storage.getItem(ROOM_KEY)||'null'),total,bonusPropsFrom(storage));
  for(const id of ids)state.trust[id]=Math.min(100,state.trust[id]+amount);
  storage.setItem(ROOM_KEY,JSON.stringify(state));return ids;
 }catch{return [];}
}
export function bonusPropsFrom(storage=globalThis.localStorage){try{const data=JSON.parse(storage.getItem(MISSION_KEY));return Array.isArray(data?.bonusProps)?data.bonusProps:[];}catch{return [];}}
