// Anonymous Supabase sessions identify a player without collecting an email/password.
export class RankingAuth {
 constructor(config,fetcher=(...args)=>fetch(...args),storage){this.config=config;this.fetcher=fetcher;this.storage=storage;this.key='cosmii-ranking-auth:'+config.url;}
 async token(){
  if(this.loading)return this.loading;
  const work=()=>this.session();
  this.loading=(globalThis.navigator?.locks?globalThis.navigator.locks.request(this.key,work):work()).finally(()=>{this.loading=null;});
  return this.loading;
 }
 async session(){
  let saved;
  try{this.storage??=globalThis.localStorage;saved=JSON.parse(this.storage.getItem(this.key)||'null');this.storage.setItem(this.key,JSON.stringify(saved));}
  catch{throw Error('端末に保存できません。空き容量・ブラウザ設定を確認してください。');}
  if(saved&&(!saved.refresh_token||!saved.user?.id))throw Error('ランキングの認証情報を確認できません。');
  if(saved?.access_token&&saved.expires_at>Date.now()/1000+60)return saved.access_token;
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
  try{
   const response=await this.fetcher(this.config.url+'/auth/v1/'+(saved?'token?grant_type=refresh_token':'signup'),{
    method:'POST',headers:{apikey:this.config.publishableKey,'Content-Type':'application/json'},
    body:JSON.stringify(saved?{refresh_token:saved.refresh_token}:{data:{}}),signal:controller.signal,
   });
   const data=await response.json().catch(()=>({}));
   if(!response.ok){
    if(data.error_code==='anonymous_provider_disabled'||data.code==='anonymous_provider_disabled')throw Error('ランキングは準備中です。');
    // Never silently create a different user after a failed/expired refresh.
    throw Error(saved?'認証を更新できません。接続を確認して再試行してください。':'ランキングに接続できません。後で再試行します。');
   }
   if(!data.access_token||!data.refresh_token||!data.user?.id||(saved&&data.user.id!==saved.user.id))throw Error('認証結果を確認できません。');
   const session={access_token:data.access_token,refresh_token:data.refresh_token,user:{id:data.user.id},expires_at:data.expires_at||Date.now()/1000+data.expires_in};
   this.storage.setItem(this.key,JSON.stringify(session));return session.access_token;
  }catch(error){if(error.name==='AbortError'||error instanceof TypeError)throw Error('通信できません。後で再試行します。');throw error;}finally{clearTimeout(timer);}
 }
}
