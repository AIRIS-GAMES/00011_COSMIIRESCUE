import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {newRunId} from '../src/leaderboard.js';
test('moderation applies to all name writes, hides existing names, protects reports and deletion',async()=>{
 const db=await PGlite.create();
 try{
  await db.exec("create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;");
  const folder=new URL('../supabase/migrations/',import.meta.url);
  const files=(await readdir(folder)).filter(n=>n.endsWith('.sql')).sort();
  for(const file of files)await db.exec(await readFile(new URL(file,folder),'utf8'));
  await db.exec(await readFile(new URL(files.at(-1),folder),'utf8'));
  const a=newRunId(),b=newRunId();await db.query('insert into auth.users values($1),($2)',[a,b]);
  const login=async id=>{await db.exec('set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);};
  const submit=async name=>(await db.query("select public.cosmii_player_submit_score('cosmii-rescue-v1',$1,$2,20,20,60) as r",[newRunId(),name])).rows[0].r;
  const top=async hidden=>(await db.query("select * from public.cosmii_player_top_scores_v2('cosmii-rescue-v1',$1)",[hidden||[]])).rows;
  await login(a);await submit('コスミー');
  for(const name of ['ＦＵＣＫ','f.u c k','シネ','し\u200bね'])await assert.rejects(()=>submit(name),/NAME_NOT_ALLOWED/);
  await assert.rejects(()=>db.query("select public.cosmii_player_rename('cosmii-rescue-v1','死ね')"),/NAME_NOT_ALLOWED/);
  await login(b);await submit('青コスミー');let rows=await top();assert.equal(rows.length,2);const target=rows.find(r=>r.player_name==='コスミー').public_id;
  assert.ok(rows.every(r=>!('user_id' in r)));assert.equal((await top([target])).length,1);
  const report=async reason=>(await db.query('select public.cosmii_report_player($1,$2) as r',[target,reason])).rows[0].r;
  assert.equal((await report('name')).accepted,true);assert.equal((await report('score')).duplicate,true);
  const self=(await top()).find(r=>r.player_name==='青コスミー').public_id;
  await assert.rejects(()=>db.query("select public.cosmii_report_player($1,'name')",[self]),/SELF_REPORT/);
  // The sixth distinct target in 24 hours is rejected, not merely hidden in UI.
  for(let i=0;i<5;i++){
   const extra=newRunId();await db.exec('reset role');await db.query('insert into auth.users values($1)',[extra]);await login(extra);await submit('追加'+i);
   const other=(await top()).find(r=>r.player_name==='追加'+i).public_id;await login(b);
   const call=()=>db.query("select public.cosmii_report_player($1,'score')",[other]);
   if(i<4)await call();else await assert.rejects(call,/REPORT_LIMIT/);
  }
  await assert.rejects(()=>report('invalid'),/INVALID_REQUEST/);
  for(const table of ['cosmii_reports','cosmii_name_rules','cosmii_player_restrictions','cosmii_deletion_requests'])await assert.rejects(()=>db.exec('select * from public.'+table),/permission denied/);
  await db.exec('set role anon');await assert.rejects(()=>report('name'),/permission denied/);
  await assert.rejects(()=>db.query("select public.cosmii_submit_score('cosmii-event-01',$1,'ＦＵＣＫ',10,1,2)",[newRunId()]),/NAME_NOT_ALLOWED/);
  // Updating the dictionary also filters names saved before the new rule.
  await db.exec("reset role;insert into public.cosmii_name_rules values('こすみー',true)");
  assert.equal((await top()).filter(r=>r.player_name.includes('コスミー')).length,0);assert.equal((await db.query("select * from public.cosmii_player_top_scores('cosmii-rescue-v1')")).rows.filter(r=>r.player_name.includes('コスミー')).length,0);
  await db.exec("update public.cosmii_name_rules set enabled=false where term='こすみー'");
  await db.query('insert into public.cosmii_player_restrictions(user_id) values($1)',[a]);
  await login(a);await assert.rejects(()=>submit('別の名前'),/PLAYER_BLOCKED/);assert.equal((await top()).length,6);
  // Even blocked players can delete their accounts. The request immediately stops public exposure/writes.
  const requestId=newRunId();await db.query('select public.cosmii_request_account_deletion($1)',[requestId]);
  await assert.rejects(()=>submit('再送'),/DELETION_PENDING/);
  await login(b);await assert.rejects(()=>db.query('select public.cosmii_request_account_deletion($1)',[requestId]),/INVALID_REQUEST/);
  await db.exec('reset role');await db.query('delete from auth.users where id=$1',[a]);
  assert.equal((await db.query('select * from public.cosmii_reports where target_id=$1 or reporter_id=$1',[a])).rows.length,0);
  assert.equal((await db.query('select * from public.cosmii_deletion_requests where request_id=$1',[requestId])).rows[0].user_id,null);
  await login(a);await assert.rejects(()=>submit('復活'),/ACCOUNT_DELETED/);
 }finally{await db.close();}
});
