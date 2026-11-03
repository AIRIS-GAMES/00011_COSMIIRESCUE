import test from 'node:test';
import assert from 'node:assert/strict';
import {AutoRanking} from '../src/auto-ranking.js';
import {RankingSafety} from '../src/ranking-safety.js';
import {createDeletionHandler} from '../supabase/functions/delete-ranking-account/handler.js';
import {newRunId} from '../src/leaderboard.js';
const config={eventId:'cosmii-rescue-v1'};
const storage=()=>{const map=new Map();return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};};
test('non-display uses a stable ID, and deletion failure persists a retry without affecting local game data',async()=>{
 const store=storage();store.setItem('cosmii-room','kept');let failed=true,cleared=0;
 const api={config,auth:{clear:()=>cleared++},deleteAccount:async()=>{if(failed)throw Error('offline');return {deleted:true};}};
 const auto=new AutoRanking(api,store,null),safety=new RankingSafety(api,auto,store);
 safety.hide({public_id:'a',player_name:'Old'});safety.hide({public_id:'a',player_name:'New'});assert.equal(safety.hidden().length,1);
 safety.unhide('a');assert.deepEqual(safety.hidden(),[]);
 auto.write({name:'A',pending:{score:20},pendingName:true});await assert.rejects(()=>safety.removeAccount());
 assert.equal(auto.read().deleting,true);assert.equal(auto.read().pending,undefined);const id=auto.read().deletionRequest;
 auto.offer({mode:'normal',score:100});await auto.flush();assert.equal(auto.read().pending,undefined);assert.equal(auto.read().deletionRequest,id);
 failed=false;await safety.removeAccount();assert.deepEqual(auto.read(),{deleted:true});assert.equal(cleared,1);assert.equal(store.getItem('cosmii-room'),'kept');
});
test('in-flight score response cannot restore a deletion tombstone',async()=>{
 const store=storage();let release;
 const api={config,submit:async()=>{await new Promise(r=>release=r);return {score:50,rank:1};}};
 const auto=new AutoRanking(api,store,null);auto.join('A',{mode:'normal',score:50});const request=auto.flush();
 auto.write({deleting:true,deletionRequest:newRunId()});release();await request;
 assert.equal(auto.read().deleting,true);assert.equal(auto.read().name,undefined);assert.equal(auto.read().best,undefined);
});
test('permanent name rejection stops retries until an explicit name correction',async()=>{
 const store=storage();let calls=0;
 const api={config,submit:async r=>{calls++;if(calls===1)throw Object.assign(Error('name rejected'),{permanent:true});return {score:r.score,rank:1};},rename:async()=>({updated:true})};
 const auto=new AutoRanking(api,store,null);auto.join('Bad',{mode:'normal',score:20});await assert.rejects(()=>auto.flush());await assert.rejects(()=>auto.flush());assert.equal(calls,1);
 auto.rename('Good');await auto.flush();assert.equal(calls,2);assert.equal(auto.read().best,20);
});
test('deletion function requires a previously authorized capability and is retryable after Auth deletion',async()=>{
 const id=newRunId(),uid=newRunId(),requests=[];let row=null,deleted=0,patchFail=true;
 const handler=createDeletionHandler({url:'https://example.supabase.co',key:'server-only-key',fetcher:async(url,options)=>{
  requests.push({url,options});assert.equal(options.headers.Authorization,'Bearer server-only-key');
  if(options.method==='DELETE'){assert.ok(url.endsWith('/'+uid));deleted++;row.user_id=null;return new Response('{}');}
  if(options.method==='PATCH'){if(patchFail)return new Response('{}',{status:503});row.completed=true;return new Response(null,{status:204});}
  return new Response(JSON.stringify(row?[row]:[]));
 }});
 const call=body=>handler(new Request('https://local/function',{method:'POST',body:JSON.stringify(body)}));
 assert.equal((await call({user_id:uid})).status,400);assert.equal((await call({request_id:id})).status,404);assert.equal(deleted,0);
 row={user_id:uid,completed:false};assert.equal((await call({request_id:id})).status,503);assert.equal(deleted,1);
 patchFail=false;assert.equal((await call({request_id:id})).status,200);assert.equal(deleted,1);
 assert.equal((await call({request_id:id})).status,200);assert.equal(deleted,1);
});
