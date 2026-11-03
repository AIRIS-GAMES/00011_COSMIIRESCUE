-- Separate rescue ranking; preserve legacy event rows and RPC behavior.
-- Apply after 202609300001_event_leaderboard.sql.
begin;
insert into public.cosmii_events(id) values ('cosmii-rescue-v1') on conflict do nothing;
do $$ begin
 if not exists(select 1 from pg_constraint where conname='cosmii_rescue_score_matches' and conrelid='public.cosmii_scores'::regclass) then
  alter table public.cosmii_scores add constraint cosmii_rescue_score_matches
   check(event_id <> 'cosmii-rescue-v1' or score=rescued);
 end if;
end $$;

create or replace function public.cosmii_rescue_top_scores(p_event_id text)
returns table(rank bigint,player_name text,score integer,rescued integer)
language plpgsql stable security definer set search_path = '' as $$
begin
 if p_event_id is distinct from 'cosmii-rescue-v1' then raise exception 'INVALID_EVENT'; end if;
 return query
  select rank() over(order by s.score desc),s.player_name,s.score,s.rescued
  from public.cosmii_scores s where s.event_id=p_event_id
  order by s.score desc,s.created_at,s.run_id limit 20;
end;
$$;

create or replace function public.cosmii_rescue_submit_score(
 p_event_id text,p_run_id uuid,p_name text,p_score integer,p_rescued integer,p_seconds integer
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare place bigint;
begin
 if p_event_id is distinct from 'cosmii-rescue-v1' then raise exception 'INVALID_EVENT'; end if;
 if p_score is null or p_rescued is null or p_score<>p_rescued then raise exception 'INVALID_SCORE'; end if;
 -- Retain validation, event closure lock, and idempotent network retry semantics.
 perform public.cosmii_submit_score(p_event_id,p_run_id,p_name,p_score,p_rescued,p_seconds);
 select count(*)+1 into place from public.cosmii_scores s
  where s.event_id=p_event_id and s.score>p_score;
 return jsonb_build_object('rank',place,'score',p_score);
end;
$$;
revoke all on function public.cosmii_rescue_top_scores(text) from public;
revoke all on function public.cosmii_rescue_submit_score(text,uuid,text,integer,integer,integer) from public;
grant execute on function public.cosmii_rescue_top_scores(text) to anon,authenticated;
grant execute on function public.cosmii_rescue_submit_score(text,uuid,text,integer,integer,integer) to anon,authenticated;
commit;
