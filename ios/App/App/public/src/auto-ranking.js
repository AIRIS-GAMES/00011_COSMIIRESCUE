import {playerName} from './leaderboard.js';
// Persist the highest unsent run before sending; retrying can never lower a server score.
export class AutoRanking {
 constructor(api,storage,locks=globalThis.navigator?.locks){this.locks=locks;this.api=api;this.storage=storage;this.key='cosmii-auto-ranking:'+api.config.eventId;}
 getStorage(){try{return this.storage??=globalThis.localStorage;}catch{throw Error('端末に保存できません。ブラウザ設定を確認してください。');}}
 read(){const data=JSON.parse(this.getStorage().getItem(this.key)||'{}');return data;}
 write(data){this.getStorage().setItem(this.key,JSON.stringify(data));}
 join(name,run){const data=this.read();data.name=playerName(name);this.write(data);this.offer(run);}
 rename(name){const data=this.read(),clean=playerName(name);data.nickname=clean;if(data.name&&data.name!==clean){data.name=clean;data.pendingName=true;}this.write(data);}
 offer(run){
  if(!run||run.mode!=='normal')return;
  const data=this.read();if(!data.name)return;
  if(run.score>(data.best??-1)&&(!data.pending||run.score>data.pending.score)){data.pending={...run};this.write(data);}
 }
 async flush(){
  if(this.loading)return this.loading;
  const work=()=>this.drain();
  this.loading=(this.locks?this.locks.request(this.key+':send',work):work()).finally(()=>{this.loading=null;});return this.loading;
 }
 async drain(){
  let result=null;
  for(;;){
   const data=this.read(),run=data.pending;if(!data.name)return result;
   if(data.pendingName){
    await this.api.rename(data.name);
    // Another tab may have completed a newer rename while this request was in flight.
    // Reassert the latest name even if that tab already cleared its pending flag.
    const latest=this.read();if(latest.name===data.name)delete latest.pendingName;else latest.pendingName=true;this.write(latest);continue;
   }
   if(!run)return result;
   result=await this.api.submit(run,data.name);
   const latest=this.read();latest.best=Math.max(latest.best??-1,Number(result.score));
   if(latest.name!==data.name)latest.pendingName=true;
   if(latest.pending?.score<=latest.best)delete latest.pending;
   this.write(latest);
  }
 }
}
