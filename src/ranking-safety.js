import {newRunId} from './leaderboard.js';
import {t as _t} from './i18n.js';
export const support={email:'contact@airis-games.com',privacy:'https://airis-games.com/privacy-policy/'};
export const reportReasons={name:_t('不適切な名前'),score:_t('不正なスコア'),other:_t('その他')};
export class RankingSafety {
 constructor(api,auto,storage){this.api=api;this.auto=auto;this.storage=storage;this.key='cosmii-ranking-safety:'+api.config.eventId;}
 store(){return this.storage??=globalThis.localStorage;}
 read(){return JSON.parse(this.store().getItem(this.key)||'{"hidden":[]}');}
 write(data){this.store().setItem(this.key,JSON.stringify(data));}
 hidden(){return this.read().hidden||[];}
 hide(row){const data=this.read();data.hidden=data.hidden||[];if(data.hidden.some(r=>r.id===row.public_id))return;if(data.hidden.length>=100)throw Error(_t('非表示は100人までです。設定から解除してください。'));data.hidden.push({id:row.public_id,name:row.player_name});this.write(data);}
 unhide(id){const data=this.read();data.hidden=(data.hidden||[]).filter(r=>r.id!==id);this.write(data);}
 async removeAccount(){
  // Persist before any network work. Every tab's send loop checks this flag.
  let data=this.auto.read();
  if(!data.deletionRequest){data={deletionRequest:newRunId(),deleting:true};this.auto.write(data);}
  const requestId=data.deletionRequest;
  if(this.auto.loading)await this.auto.loading.catch(()=>{});
  const work=async()=>{
   const result=await this.api.deleteAccount(requestId);
   if(!result.deleted)throw Error(_t('削除結果を確認できません。再試行してください。'));
   // Keep a tombstone until explicit opt-in, so stale responses cannot restore consent.
   this.api.auth.clear();this.write({hidden:[]});
   this.auto.write({deleted:true});
  };
  return this.auto.locks?this.auto.locks.request(this.auto.key+':send',work):work();
 }
}
