import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {newRunId} from '../src/leaderboard.js';
test('rescue leaderboard isolates legacy records, ties ranks, and protects retries and invariants',async()=>{
 const db=await PGlite.create();
 try{
  await db.exec('create role anon;create role authenticated;');
  for(const file of ['202609300001_event_leaderboard.sql','202611020001_rescue_leaderboard.sql'])await db.exec(await readFile(new URL('../supabase/migrations/'+file,import.meta.url),'utf8'));
  await db.exec(await readFile(new URL('../supabase/migrations/202611020001_rescue_leaderboard.sql',import.meta.url),'utf8'));
  await db.exec('set role anon');
  await db.query('select public.cosmii_submit_score($1,$2,$3,$4,$5,$6)',['cosmii-event-01',newRunId(),'OLD',9000,4,60]);
  const submit=async(id,name,score,rescued=score,event='cosmii-rescue-v1')=>(await db.query('select public.cosmii_rescue_submit_score($1,$2,$3,$4,$5,$6) as result',[event,id,name,score,rescued,60])).rows[0].result;
  const first=newRunId();assert.equal((await submit(first,'A',20)).rank,1);assert.equal((await submit(newRunId(),'B',20)).rank,1);
  assert.equal((await submit(newRunId(),'C',10)).rank,3);assert.equal((await submit(first,'A',20)).rank,1);
  await assert.rejects(()=>submit(first,'A',21),/RUN_ALREADY_REGISTERED/);
  await assert.rejects(()=>submit(newRunId(),'D',9000,4),/INVALID_SCORE/);
  await assert.rejects(()=>submit(newRunId(),'D',4,4,'cosmii-event-01'),/INVALID_EVENT/);
  await assert.rejects(()=>db.query('select public.cosmii_submit_score($1,$2,$3,$4,$5,$6)',['cosmii-rescue-v1',newRunId(),'BAD',9000,4,60]),/cosmii_rescue_score_matches/);
  const rows=(await db.query("select * from public.cosmii_rescue_top_scores('cosmii-rescue-v1')")).rows;
  assert.deepEqual(rows.map(r=>Number(r.rank)),[1,1,3]);assert.deepEqual(rows.map(r=>r.score),[20,20,10]);
  assert.equal((await db.query("select * from public.cosmii_top_scores('cosmii-event-01')")).rows[0].score,9000);
  await assert.rejects(()=>db.query('select * from public.cosmii_scores'),/permission denied/);
  await db.exec("reset role;update public.cosmii_events set accepting_scores=false where id='cosmii-rescue-v1';set role anon;");
  await assert.rejects(()=>submit(newRunId(),'LATE',1),/EVENT_CLOSED/);assert.equal((await submit(first,'A',20)).rank,1);
 }finally{await db.close()}
});
