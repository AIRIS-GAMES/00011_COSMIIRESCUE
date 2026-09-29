-- NORMAL-only event leaderboard. Tables are private; only these two RPCs are public.
begin;
create table if not exists public.cosmii_events (
  id text primary key check (char_length(id) between 1 and 80),
  accepting_scores boolean not null default true
);
create table if not exists public.cosmii_scores (
  event_id text not null references public.cosmii_events(id),
  run_id uuid not null,
  player_name text not null check (char_length(player_name) between 1 and 12 and player_name !~ '[[:cntrl:]]'),
  score integer not null check (score >= 0),
  rescued integer not null check (rescued >= 0),
  seconds integer not null check (seconds >= 0),
  created_at timestamptz not null default clock_timestamp(),
  primary key (event_id,run_id)
);
create index if not exists cosmii_scores_ranking on public.cosmii_scores(event_id,score desc,created_at,run_id);
alter table public.cosmii_events enable row level security;
alter table public.cosmii_scores enable row level security;
revoke all on public.cosmii_events,public.cosmii_scores from public,anon,authenticated;

insert into public.cosmii_events(id) values ('cosmii-event-01') on conflict do nothing;

create or replace function public.cosmii_top_scores(p_event_id text)
returns table(rank bigint,player_name text,score integer,rescued integer)
language sql stable security definer set search_path = '' as $$
  select row_number() over (order by s.score desc,s.created_at,s.run_id),s.player_name,s.score,s.rescued
  from public.cosmii_scores s where s.event_id=p_event_id
  order by s.score desc,s.created_at,s.run_id limit 20;
$$;

create or replace function public.cosmii_submit_score(
  p_event_id text,p_run_id uuid,p_name text,p_score integer,p_rescued integer,p_seconds integer
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  entry public.cosmii_scores%rowtype;
  place bigint;
  clean_name text := btrim(p_name);
begin
  if p_run_id is null or clean_name is null or char_length(clean_name) not between 1 and 12
    or clean_name ~ '[[:cntrl:]]' or clean_name ~ U&'[\202A-\202E\2066-\2069]'
    or p_score is null or p_score<0 or p_rescued is null or p_rescued<0 or p_seconds is null or p_seconds<0 then
    raise exception 'INVALID_SCORE';
  end if;
  select * into entry from public.cosmii_scores s where s.event_id=p_event_id and s.run_id=p_run_id;
  if not found then
    -- Lock the event while accepting a submission so event closure is atomic.
    perform 1 from public.cosmii_events e where e.id=p_event_id and e.accepting_scores for share;
    if not found then raise exception 'EVENT_CLOSED'; end if;
    insert into public.cosmii_scores(event_id,run_id,player_name,score,rescued,seconds)
    values(p_event_id,p_run_id,clean_name,p_score,p_rescued,p_seconds)
    on conflict (event_id,run_id) do nothing;
    select * into entry from public.cosmii_scores s where s.event_id=p_event_id and s.run_id=p_run_id;
  end if;
  -- Network retries return the original registration, never overwrite a score/name.
  if (entry.player_name,entry.score,entry.rescued,entry.seconds) is distinct from (clean_name,p_score,p_rescued,p_seconds) then
    raise exception 'RUN_ALREADY_REGISTERED';
  end if;
  select count(*)+1 into place from public.cosmii_scores s where s.event_id=p_event_id
    and (s.score>entry.score or (s.score=entry.score and (s.created_at,s.run_id)<(entry.created_at,entry.run_id)));
  return jsonb_build_object('rank',place,'score',entry.score);
end;
$$;
revoke all on function public.cosmii_top_scores(text) from public;
revoke all on function public.cosmii_submit_score(text,uuid,text,integer,integer,integer) from public;
grant execute on function public.cosmii_top_scores(text) to anon,authenticated;
grant execute on function public.cosmii_submit_score(text,uuid,text,integer,integer,integer) to anon,authenticated;
commit;
