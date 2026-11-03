import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {newRunId,Leaderboard} from '../src/leaderboard.js';
import {RankingAuth} from '../src/ranking-auth.js';
import {AutoRanking} from '../src/auto-ranking.js';
const storage=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};};
const config={url:'https://example.supabase.co',publishableKey:'sb_publishable_test',eventId:'cosmii-rescue-v1',playerBests:true};
const run=score=>({id:newRunId(),mode:'normal',score,rescued:score,seconds:80});
test('authenticated ranking keeps one best per identity, cannot overwrite others, preserves ties and legacy',async()=>{
 const db=await PGlite.create();
 try{
  await db.exec("create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;");
  for(const file of ['202609300001_event_leaderboard.sql','202611020001_rescue_leaderboard.sql','202611030001_player_best_ranking.sql','202611030002_player_name.sql','202611030002_player_name.sql'])await db.exec(await readFile(new URL('../supabase/migrations/'+file,import.meta.url),'utf8'));
  const a=newRunId(),b=newRunId();await db.query('insert into auth.users values($1),($2)',[a,b]);
  const submit=async(uid,score,name='Same')=>{await db.query("select set_config('request.jwt.claim.sub',$1,false)",[uid]);return (await db.query('select public.cosmii_player_submit_score($1,$2,$3,$4,$4,$5) as result',[config.eventId,newRunId(),name,score,60])).rows[0].result;};
  await db.exec('set role anon');await assert.rejects(()=>submit(a,20),/permission denied/);
  await db.exec('set role authenticated');assert.equal((await submit(a,20)).score,20);assert.equal((await submit(a,10)).score,20);assert.equal((await submit(a,30)).score,30);
  assert.equal((await submit(b,30)).rank,1);assert.equal((await submit(a,30,'Changed')).score,30);
  const rows=(await db.query('select * from public.cosmii_player_top_scores($1)',[config.eventId])).rows;
  assert.equal(rows.length,2);assert.deepEqual(rows.map(r=>r.score),[30,30]);assert.ok(rows.every(r=>Number(r.rank)===1&&r.player_name==='Same'));
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[a]);
  await db.query('select public.cosmii_player_rename($1,$2)',[config.eventId,'Renamed']);
  let renamed=(await db.query('select * from public.cosmii_player_top_scores($1)',[config.eventId])).rows;
  assert.equal(renamed.filter(r=>r.player_name==='Renamed').length,1);
  assert.ok(renamed.every(r=>r.score===30));
  await submit(a,40,'StaleName');
  renamed=(await db.query('select * from public.cosmii_player_top_scores($1)',[config.eventId])).rows;
  assert.equal(renamed[0].player_name,'Renamed');assert.equal(renamed[1].player_name,'Same');
  await assert.rejects(()=>db.query('select public.cosmii_player_rename($1,$2)',[config.eventId,'']),/INVALID_NAME/);
  await db.exec('set role anon');
  await assert.rejects(()=>db.query('select public.cosmii_player_rename($1,$2)',[config.eventId,'Other']),/permission denied/);
  await db.exec('set role authenticated');
  await assert.rejects(()=>submit('',50),/AUTH_REQUIRED/);
  await assert.rejects(()=>db.exec('select * from public.cosmii_player_bests'),/permission denied/);
  await db.exec("reset role;update public.cosmii_events set accepting_scores=false where id='cosmii-rescue-v1';set role authenticated;");await assert.rejects(()=>submit(a,40),/EVENT_CLOSED/);
 }finally{await db.close();}
});
test('anonymous session survives reload, refreshes the same identity, and fails without replacing it',async()=>{
 const store=storage(),calls=[];let expired=false;
 const fetcher=async(url,options)=>{calls.push({url,...options});return {ok:!expired,json:async()=>expired?{}:{access_token:'access',refresh_token:'refresh',expires_in:3600,user:{id:'user-a'}}};};
 const auth=new RankingAuth(config,fetcher,store);await Promise.all([auth.token(),auth.token()]);assert.equal(calls.length,1);
 await new RankingAuth(config,fetcher,store).token();assert.equal(calls.length,1);
 let saved=JSON.parse(store.getItem(auth.key));saved.expires_at=0;store.setItem(auth.key,JSON.stringify(saved));await auth.token();assert.match(calls[1].url,/grant_type=refresh_token/);
 saved.expires_at=0;store.setItem(auth.key,JSON.stringify(saved));expired=true;await assert.rejects(()=>auth.token());assert.ok(store.getItem(auth.key).includes('user-a'));assert.equal(calls.filter(c=>c.url.endsWith('signup')).length,1);
 const sent=[];const api=new Leaderboard(config,async(url,options)=>{sent.push(options);return {ok:true,json:async()=>({rank:1,score:20})};},{token:async()=> 'user-jwt'});
 await api.submit(run(20),'A');assert.equal(sent[0].headers.Authorization,'Bearer user-jwt');assert.equal(JSON.parse(sent[0].body).user_id,undefined);
});
test('automatic best retries offline, survives reload, ignores lower/equal runs and drains a newer in-flight best',async()=>{
 const store=storage();let offline=true,release,calls=0;
 const api={config,submit:async r=>{calls++;if(offline)throw Error('offline');if(release===null)await new Promise(resolve=>release=resolve);return {rank:1,score:r.score};}};
 const a=new AutoRanking(api,store,null);a.offer(run(30));assert.equal(a.read().pending,undefined);
 a.join('A',run(20));await assert.rejects(()=>a.flush());assert.equal(a.read().pending.score,20);
 const b=new AutoRanking(api,store,null);offline=false;await b.flush();assert.equal(b.read().best,20);b.offer(run(20));b.offer(run(10));await b.flush();assert.equal(calls,2);
 b.offer(run(30));release=null;const pending=b.flush();await Promise.resolve();b.offer(run(40));release();await pending;assert.equal(b.read().best,40);assert.equal(b.read().pending,undefined);
 b.offer({...run(99),mode:'hard'});assert.equal(b.read().pending,undefined);
});

test('nickname does not opt in; public rename retries and preserves best',async()=>{
 const store=storage(),calls=[];let offline=true;
 const api={config,rename:async name=>{if(offline)throw Error('offline');calls.push(name);return {updated:true};},submit:async r=>({score:r.score,rank:1})};
 const auto=new AutoRanking(api,store,null);auto.rename('Local');await auto.flush();
 assert.equal(auto.read().name,undefined);assert.equal(auto.read().nickname,'Local');assert.equal(calls.length,0);
 auto.join('Local',run(20));await auto.flush();auto.rename('New');
 await assert.rejects(()=>auto.flush());assert.equal(auto.read().pendingName,true);
 offline=false;await new AutoRanking(api,store,null).flush();assert.deepEqual(calls,['New']);
 assert.equal(auto.read().best,20);assert.equal(auto.read().pendingName,undefined);
});

test('storage denial never throws during ranking construction or sends a signup',async()=>{
 const descriptor=Object.getOwnPropertyDescriptor(globalThis,'localStorage');let calls=0;
 Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw Error('denied');}});
 try{
  const auth=new RankingAuth(config,async()=>{calls++;throw Error('unexpected network');});
  const auto=new AutoRanking({config});
  assert.throws(()=>auto.read());await assert.rejects(()=>auth.token());assert.equal(calls,0);
 }finally{if(descriptor)Object.defineProperty(globalThis,'localStorage',descriptor);else delete globalThis.localStorage;}
});
test('out-of-order rename responses across tabs reassert the latest saved name without Web Locks',async()=>{
 const store=storage();let release,server='Original',count=0;
 const api={config,rename:async name=>{if(++count===1)await new Promise(r=>release=r);server=name;}};
 const a=new AutoRanking(api,store,null),b=new AutoRanking(api,store,null);
 a.write({name:'Original',best:20});a.rename('Older');const first=a.flush();
 b.rename('Newest');await b.flush();assert.equal(server,'Newest');
 release();await first;
 assert.equal(server,'Newest');assert.equal(a.read().name,'Newest');assert.equal(a.read().pendingName,undefined);
 assert.equal(a.read().best,20);assert.equal(count,3);
});
test('an initial score in flight cannot leave the first public name stale',async()=>{
 const store=storage();let release,server=null;
 const api={config,rename:async name=>{if(server)server=name;},submit:async(r,name)=>{
  await new Promise(resolve=>release=resolve);server=name;return {score:r.score,rank:1};
 }};
 const a=new AutoRanking(api,store,null),b=new AutoRanking(api,store,null);
 a.join('Older',run(20));const first=a.flush();
 b.rename('Newest');
 // Model the other tab completing rename before the first leaderboard row exists.
 await api.rename('Newest');const state=b.read();delete state.pendingName;b.write(state);
 release();await first;assert.equal(server,'Newest');assert.equal(a.read().best,20);
});

test('Web Locks serializes requests across ranking instances',async()=>{
 const store=storage();let tail=Promise.resolve(),active=0,maxActive=0;
 const locks={request:(_key,work)=>{const result=tail.then(work);tail=result.catch(()=>{});return result;}};
 const api={config,rename:async()=>{active++;maxActive=Math.max(maxActive,active);await new Promise(r=>setTimeout(r,5));active--;}};
 const a=new AutoRanking(api,store,locks),b=new AutoRanking(api,store,locks);
 a.write({name:'Original',best:20});a.rename('Latest');
 await Promise.all([a.flush(),b.flush()]);
 assert.equal(maxActive,1);assert.equal(a.read().pendingName,undefined);
});
