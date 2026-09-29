import test from 'node:test';
import assert from 'node:assert/strict';
import {Leaderboard,newRunId,playerName} from '../src/leaderboard.js';
const config={url:'https://example.supabase.co',publishableKey:'sb_publishable_test',eventId:'cosmii-event-01'};
const run={id:newRunId(),mode:'normal',score:5000,rescued:20,seconds:150.9};
test('ranking submission contains a stable run ID and public API key, never an auth bearer secret',async()=>{
  const calls=[],api=new Leaderboard(config,async(url,options)=>{calls.push({url,...options});return {ok:true,json:async()=>({rank:2,score:5000})};});
  await api.submit(run,' コスミー ');await api.submit(run,'コスミー');
  assert.equal(calls[0].headers.apikey,config.publishableKey);assert.equal(calls[0].headers.Authorization,undefined);
  assert.equal(calls[0].body,calls[1].body);
  assert.equal(JSON.parse(calls[0].body).p_name,'コスミー');assert.equal(JSON.parse(calls[0].body).p_seconds,150);
});
test('HARD, invalid names, negative scores and secret keys cannot submit',async()=>{
  const api=new Leaderboard(config,()=>{throw Error('must not send');});
  await assert.rejects(()=>api.submit({...run,mode:'hard'},'A'),/NORMAL/);
  await assert.rejects(()=>api.submit({...run,score:-1},'A'),/スコア/);
  for(const name of ['',' '.repeat(3),'a'.repeat(13),'A\nB','A\u202eB'])assert.throws(()=>playerName(name));
  assert.equal(playerName('🐱'.repeat(12)),'🐱'.repeat(12));
  assert.equal(new Leaderboard({...config,publishableKey:'sb_secret_x'}).configured,false);
  assert.equal(new Leaderboard({...config,url:''}).configured,false);
});
test('connection and event closure errors allow an explicit retry',async()=>{
  const offline=new Leaderboard(config,async()=>{throw new TypeError('Failed to fetch');});
  await assert.rejects(()=>offline.top(),/接続/);
  const closed=new Leaderboard(config,async()=>({ok:false,json:async()=>({message:'EVENT_CLOSED'})}));
  await assert.rejects(()=>closed.submit(run,'A'),/受付は終了/);
});
test('run IDs work with getRandomValues without secure-context randomUUID',()=>{
  const ids=Array.from({length:100},newRunId);assert.equal(new Set(ids).size,100);
  assert.ok(ids.every(id=>/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(id)));
});
