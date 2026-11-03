-- Run only in the Supabase SQL Editor as an authorized operator.
-- Inspect reports first. No destructive command is enabled by default.
select id,target_public_id,reason,name_at_report,score_at_report,created_at,status
from public.cosmii_reports where status='open' order by created_at;

-- Example: replace REPORT_UUID after reviewing the report, then uncomment.
-- begin;
-- update public.cosmii_player_bests set hidden=true
-- where user_id=(select target_id from public.cosmii_reports where id='REPORT_UUID'::uuid);
-- insert into public.cosmii_player_restrictions(user_id,blocked,note)
-- select target_id,true,'Reviewed report' from public.cosmii_reports where id='REPORT_UUID'::uuid
-- on conflict(user_id) do update set blocked=true,note=excluded.note,updated_at=now();
-- update public.cosmii_reports set status='actioned',resolved_at=now(),operator_note='Reviewed and restricted'
-- where id='REPORT_UUID'::uuid;
-- commit;

-- Dictionary update (affects stored names on the next read as well as future writes):
-- insert into public.cosmii_name_rules(term) values(public.cosmii_normalize_name('追加する語句'))
-- on conflict(term) do update set enabled=true;

-- Old clients do not have Auth identities. Hide an individual legacy row:
-- update public.cosmii_scores set hidden=true where event_id='EVENT_ID' and run_id='RUN_UUID'::uuid;
