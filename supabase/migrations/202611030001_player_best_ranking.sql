-- Requires 202609300001_event_leaderboard.sql. Old tables/RPCs remain intact.
begin;
insert into public.cosmii_events(id) values ('cosmii-rescue-v1') on conflict do nothing;
create table if not exists public.cosmii_player_bests (
 event_id text not null references public.cosmii_events(id),
 user_id uuid not null references auth.users(id) on delete cascade,
 player_name text not null check(char_length(player_name) between 1 and 12),
 score integer not null check(score>=0),
 seconds integer not null check(seconds>=0),
 run_id uuid not null,
 achieved_at timestamptz not null default clock_timestamp(),
 primary key(event_id,user_id)
);
create index if not exists cosmii_player_bests_order on public.cosmii_player_bests(event_id,score desc,achieved_at,user_id);
alter table public.cosmii_player_bests enable row level security;
revoke all on public.cosmii_player_bests from public,anon,authenticated;

create or replace function public.cosmii_player_top_scores(p_event_id text)
returns table(rank bigint,player_name text,score integer,rescued integer)
language plpgsql stable security definer set search_path='' as $$
begin
 if p_event_id is distinct from 'cosmii-rescue-v1' then raise exception 'INVALID_EVENT'; end if;
 return query select rank() over(order by s.score desc),s.player_name,s.score,s.score
 from public.cosmii_player_bests s where s.event_id=p_event_id
 order by s.score desc,s.achieved_at,s.user_id limit 20;
end; $$;

create or replace function public.cosmii_player_submit_score(
 p_event_id text,p_run_id uuid,p_name text,p_score integer,p_rescued integer,p_seconds integer
) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); clean_name text:=btrim(p_name); entry public.cosmii_player_bests%rowtype; place bigint;
begin
 if uid is null then raise exception 'AUTH_REQUIRED'; end if;
 if p_event_id is distinct from 'cosmii-rescue-v1' then raise exception 'INVALID_EVENT'; end if;
 if p_run_id is null or clean_name is null or char_length(clean_name) not between 1 and 12
 or clean_name ~ '[[:cntrl:]]' or clean_name ~ U&'[\202A-\202E\2066-\2069]'
 or p_score is null or p_score<0 or p_rescued is null or p_score<>p_rescued
 or p_seconds is null or p_seconds<0 then raise exception 'INVALID_SCORE'; end if;
 perform 1 from public.cosmii_events e where e.id=p_event_id and e.accepting_scores for share;
 if not found then raise exception 'EVENT_CLOSED'; end if;
 insert into public.cosmii_player_bests(event_id,user_id,player_name,score,seconds,run_id)
 values(p_event_id,uid,clean_name,p_score,p_seconds,p_run_id)
 on conflict(event_id,user_id) do update set
 player_name=excluded.player_name,score=excluded.score,seconds=excluded.seconds,
 run_id=excluded.run_id,achieved_at=clock_timestamp()
 where excluded.score>cosmii_player_bests.score;
 select * into entry from public.cosmii_player_bests s where s.event_id=p_event_id and s.user_id=uid;
 select count(*)+1 into place from public.cosmii_player_bests s where s.event_id=p_event_id and s.score>entry.score;
 return jsonb_build_object('rank',place,'score',entry.score);
end; $$;
revoke all on function public.cosmii_player_top_scores(text) from public;
revoke all on function public.cosmii_player_submit_score(text,uuid,text,integer,integer,integer) from public,anon;
grant execute on function public.cosmii_player_top_scores(text) to anon,authenticated;
grant execute on function public.cosmii_player_submit_score(text,uuid,text,integer,integer,integer) to authenticated;
commit;
