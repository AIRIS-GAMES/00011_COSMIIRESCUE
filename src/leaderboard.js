import {RankingAuth} from './ranking-auth.js';
import {checkNameRules} from './name-rules.js';
import {t as _t} from './i18n.js';
export function newRunId(){
  const bytes=globalThis.crypto.getRandomValues(new Uint8Array(16));
  bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
  const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
export function playerName(value){
  const name=String(value).normalize('NFC').trim();
  if(!name||Array.from(name).length>12||/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u.test(name))throw Error(_t('名前は1〜12文字で入力してください。'));
  checkNameRules(name);
  return name;
}
export class Leaderboard {
  constructor(config,fetcher=(...args)=>globalThis.fetch(...args),auth=null){this.config=config;this.fetcher=fetcher;this.auth=auth||(config.playerBests?new RankingAuth(config,fetcher):null);}
  get configured(){return /^https:\/\/[^/]+$/u.test(this.config.url)&&this.config.publishableKey.startsWith('sb_publishable_')&&!!this.config.eventId;}
  async rpc(name,params,token=null){
    if(!this.configured)throw Error(_t('ランキングは準備中です。'));
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
    try{
      const response=await this.fetcher(`${this.config.url}/rest/v1/rpc/${name}`,{
        method:'POST',headers:{apikey:this.config.publishableKey,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},
        body:JSON.stringify(params),signal:controller.signal,
      });
      if(!response.ok){
        const body=await response.json().catch(()=>({}));
        const messages={NAME_NOT_ALLOWED:_t('この名前は使用できません。別の名前に変更してください。'),PLAYER_BLOCKED:_t('ランキングの利用が制限されています。お問い合わせをご利用ください。'),DELETION_PENDING:_t('データの削除処理中です。設定から削除を再試行してください。'),ACCOUNT_DELETED:_t('このランキングアカウントは削除されています。'),REPORT_LIMIT:_t('通報は1日5件までです。時間をおいてお試しください。'),SELF_REPORT:_t('自分の記録は通報できません。'),TARGET_NOT_FOUND:_t('この記録はすでに削除されています。')};
        if(messages[body.message]){const error=Error(messages[body.message]);error.code=body.message;error.permanent=true;throw error;}
        if(body.code==='PGRST202'||body.message==='RESCUE_RANKING_NOT_READY')throw Error(_t('救出数ランキングは準備中です。'));
        if(body.message==='EVENT_CLOSED')throw Error(_t('このランキングの受付は終了しました。'));
        throw Error(_t('ランキングに接続できません。時間をおいて再試行してください。'));
      }
      return await response.json();
    }catch(error){
      if(error.name==='AbortError'||error instanceof TypeError)throw Error(_t('通信できません。接続を確認して再試行してください。'));
      throw error;
    }finally{clearTimeout(timer);}
  }
  async top(hidden=[]){
    const rows=await this.rpc(this.config.playerBests?'cosmii_player_top_scores_v2':'cosmii_rescue_top_scores',{p_event_id:this.config.eventId,...(this.config.playerBests?{p_hidden_ids:hidden}:{})});
    if(!Array.isArray(rows))throw Error(_t('ランキングを取得できませんでした。'));
    return rows;
  }
  async report(target,reason){
    if(!['name','score','other'].includes(reason))throw Error(_t('通報理由を選んでください。'));
    const result=await this.rpc('cosmii_report_player',{p_target_id:target,p_reason:reason},await this.auth.token());
    if(result?.accepted!==true)throw Error(_t('通報結果を確認できません。'));return result;
  }
  async deleteAccount(requestId){
    const invoke=async()=>{
      const response=await this.fetcher(this.config.url+'/functions/v1/delete-ranking-account',{method:'POST',headers:{apikey:this.config.publishableKey,'Content-Type':'application/json'},body:JSON.stringify({request_id:requestId}),signal:AbortSignal.timeout(20000)});
      const result=await response.json().catch(()=>({}));
      if(response.status===404&&result.error==='REQUEST_NOT_FOUND')return null;
      if(!response.ok||result.deleted!==true)throw Error(_t('削除できませんでした。接続を確認して再試行してください。'));
      return result;
    };
    const previous=await invoke();if(previous)return previous;
    if(!this.auth.hasSession())return {deleted:true};
    const result=await this.rpc('cosmii_request_account_deletion',{p_request_id:requestId},await this.auth.token());
    if(result?.accepted!==true)throw Error(_t('削除を開始できませんでした。'));
    const deleted=await invoke();if(!deleted)throw Error(_t('削除を開始できませんでした。'));return deleted;
  }
  async rename(name){
    const clean=playerName(name),token=await this.auth.token();
    const result=await this.rpc('cosmii_player_rename',{p_event_id:this.config.eventId,p_name:clean},token);
    if(!result||typeof result.updated!=='boolean')throw Error(_t('名前の更新結果を確認できません。'));
    return result;
  }
  async submit(run,name){
    if(run.mode!=='normal')throw Error(_t('イベントランキングはノーマル専用です。'));
    if(!Number.isSafeInteger(run.score)||run.score<0||!Number.isSafeInteger(run.rescued)||run.rescued<0||run.score!==run.rescued)throw Error(_t('スコアを確認できませんでした。'));
    const nameValue=playerName(name);
    if(!Number.isFinite(run.seconds)||run.seconds<0)throw Error(_t('プレイ時間を確認できません。'));
    const token=this.auth?await this.auth.token():null;
    const result=await this.rpc(this.config.playerBests?'cosmii_player_submit_score':'cosmii_rescue_submit_score',{
      p_event_id:this.config.eventId,p_run_id:run.id,p_name:nameValue,
      p_score:run.score,p_rescued:run.rescued,p_seconds:Math.floor(run.seconds),
    },token);
    if(!result||!Number.isSafeInteger(Number(result.rank))||Number(result.rank)<1||!Number.isSafeInteger(Number(result.score))||Number(result.score)<run.score)throw Error(_t('登録結果を確認できません。もう一度登録してください。'));
    return result;
  }
}
