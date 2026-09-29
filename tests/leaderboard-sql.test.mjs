import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {newRunId} from '../src/leaderboard.js';

test('Supabase migration enforces private tables, ranking order, event isolation and idempotent submissions',async()=>{
  const db=await PGlite.create();
  try{
    await db.exec('create role anon; create role authenticated;');
    const migration=await readFile(new URL('../supabase/migrations/202609300001_event_leaderboard.sql',import.meta.url),'utf8');
    await db.exec(migration);await db.exec(migration);
    await db.exec("insert into public.cosmii_events(id) values ('second-event'); set role anon;");
    const submit=async(id,name,score,event='cosmii-event-01')=>(await db.query('select public.cosmii_submit_score($1,$2,$3,$4,$5,$6) as result',[event,id,name,score,5,60])).rows[0].result;
    const first=newRunId();assert.equal((await submit(first,'コスミー',5000)).rank,1);
    assert.equal((await submit(first,'コスミー',5000)).rank,1);
    await assert.rejects(()=>submit(first,'変更',6000),/RUN_ALREADY_REGISTERED/);
    assert.equal((await submit(newRunId(),'SAME',5000)).rank,2);
    assert.equal((await submit(newRunId(),'TOP',6000)).rank,1);
    await submit(newRunId(),'OTHER',9000,'second-event');
    let rows=(await db.query("select * from public.cosmii_top_scores('cosmii-event-01')")).rows;
    assert.deepEqual(rows.map(row=>row.player_name),['TOP','コスミー','SAME']);
    assert.deepEqual(rows.map(row=>Number(row.rank)),[1,2,3]);
    assert.equal('run_id' in rows[0],false);
    await assert.rejects(()=>db.query('select * from public.cosmii_scores'),/permission denied/);
    await assert.rejects(()=>db.query('delete from public.cosmii_scores'),/permission denied/);
    await assert.rejects(()=>submit(newRunId(),'A',-1),/INVALID_SCORE/);
    await assert.rejects(()=>submit(newRunId(),'A'.repeat(13),1),/INVALID_SCORE/);
    await assert.rejects(()=>submit(newRunId(),'A\u202eB',1),/INVALID_SCORE/);
    await assert.rejects(()=>submit(newRunId(),'A',1,'missing-event'),/EVENT_CLOSED/);
    for(let i=0;i<22;i++)await submit(newRunId(),`P${i}`,i);
    rows=(await db.query("select * from public.cosmii_top_scores('cosmii-event-01')")).rows;
    assert.equal(rows.length,20);assert.equal(rows[0].score,6000);
    await db.exec("reset role;update public.cosmii_events set accepting_scores=false where id='cosmii-event-01';set role anon;");
    await assert.rejects(()=>submit(newRunId(),'LATE',10),/EVENT_CLOSED/);
    assert.equal((await submit(first,'コスミー',5000)).rank,2);
  }finally{await db.close();}
});
