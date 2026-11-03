import {RankingAuth} from './ranking-auth.js';
export function newRunId(){
  const bytes=globalThis.crypto.getRandomValues(new Uint8Array(16));
  bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
  const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
export function playerName(value){
  const name=String(value).normalize('NFC').trim();
  if(!name||Array.from(name).length>12||/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u.test(name))throw Error('名前は1〜12文字で入力してください。');
  return name;
}
export class Leaderboard {
  constructor(config,fetcher=(...args)=>globalThis.fetch(...args),auth=null){this.config=config;this.fetcher=fetcher;this.auth=auth||(config.playerBests?new RankingAuth(config,fetcher):null);}
  get configured(){return /^https:\/\/[^/]+$/u.test(this.config.url)&&this.config.publishableKey.startsWith('sb_publishable_')&&!!this.config.eventId;}
  async rpc(name,params,token=null){
    if(!this.configured)throw Error('ランキングは準備中です。');
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
    try{
      const response=await this.fetcher(`${this.config.url}/rest/v1/rpc/${name}`,{
        method:'POST',headers:{apikey:this.config.publishableKey,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},
        body:JSON.stringify(params),signal:controller.signal,
      });
      if(!response.ok){
        const body=await response.json().catch(()=>({}));
        if(body.code==='PGRST202'||body.message==='RESCUE_RANKING_NOT_READY')throw Error('救出数ランキングは準備中です。');
        if(body.message==='EVENT_CLOSED')throw Error('このランキングの受付は終了しました。');
        throw Error('ランキングに接続できません。時間をおいて再試行してください。');
      }
      return await response.json();
    }catch(error){
      if(error.name==='AbortError'||error instanceof TypeError)throw Error('通信できません。接続を確認して再試行してください。');
      throw error;
    }finally{clearTimeout(timer);}
  }
  async top(){
    const rows=await this.rpc(this.config.playerBests?'cosmii_player_top_scores':'cosmii_rescue_top_scores',{p_event_id:this.config.eventId});
    if(!Array.isArray(rows))throw Error('ランキングを取得できませんでした。');
    return rows;
  }
  async rename(name){
    const clean=playerName(name),token=await this.auth.token();
    const result=await this.rpc('cosmii_player_rename',{p_event_id:this.config.eventId,p_name:clean},token);
    if(!result||typeof result.updated!=='boolean')throw Error('名前の更新結果を確認できません。');
    return result;
  }
  async submit(run,name){
    if(run.mode!=='normal')throw Error('イベントランキングはNORMAL専用です。');
    if(!Number.isSafeInteger(run.score)||run.score<0||!Number.isSafeInteger(run.rescued)||run.rescued<0||run.score!==run.rescued)throw Error('スコアを確認できませんでした。');
    const nameValue=playerName(name);
    if(!Number.isFinite(run.seconds)||run.seconds<0)throw Error('プレイ時間を確認できません。');
    const token=this.auth?await this.auth.token():null;
    const result=await this.rpc(this.config.playerBests?'cosmii_player_submit_score':'cosmii_rescue_submit_score',{
      p_event_id:this.config.eventId,p_run_id:run.id,p_name:nameValue,
      p_score:run.score,p_rescued:run.rescued,p_seconds:Math.floor(run.seconds),
    },token);
    if(!result||!Number.isSafeInteger(Number(result.rank))||Number(result.rank)<1||!Number.isSafeInteger(Number(result.score))||Number(result.score)<run.score)throw Error('登録結果を確認できません。もう一度登録してください。');
    return result;
  }
}
