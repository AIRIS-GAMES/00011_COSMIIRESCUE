-- Apply after 202611030002_player_name.sql. Existing RPC signatures remain available.
begin;
create table if not exists public.cosmii_name_rules (
 term text primary key, enabled boolean not null default true
);
create or replace function public.cosmii_normalize_name(value text) returns text
language sql immutable set search_path='' as $$
 select regexp_replace(translate(lower(normalize(coalesce(value,''),NFKC)),
 'ァアィイゥウェエォオカガキギクグケゲコゴサザシジスズセゼソゾタダチヂッツヅテデトドナニヌネノハバパヒビピフブプヘベペホボポマミムメモャヤュユョヨラリルレロヮワヰヱヲンヴ',
 'ぁあぃいぅうぇえぉおかがきぎくぐけげこごさざしじすずせぜそぞただちぢっつづてでとどなにぬねのはばぱひびぴふぶぷへべぺほぼぽまみむめもゃやゅゆょよらりるれろゎわゐゑをんゔ'),
 '[^[:alnum:]]','','g');
$$;
insert into public.cosmii_name_rules(term)
select public.cosmii_normalize_name(t) from unnest(array[
 '死ね','しね','殺す','ころす','自殺しろ','消えろ','きえろ','fuck','shit','bitch','nigger','faggot',
 'ちんこ','ちんぽ','まんこ','せっくす','レイプ','強姦','児童ポルノ','運営公式','公式運営'
]) t on conflict do nothing;
create or replace function public.cosmii_name_allowed(value text) returns boolean
language sql stable security definer set search_path='' as $$
 select value is not null and char_length(btrim(value)) between 1 and 12
 and value !~ '[[:cntrl:]]' and value !~ U&'[\202A-\202E\2066-\2069]'
 and length(public.cosmii_normalize_name(value))>0
 and not exists(select 1 from public.cosmii_name_rules r where r.enabled
 and position(r.term in public.cosmii_normalize_name(value))>0);
$$;
alter table public.cosmii_player_bests add column if not exists public_id uuid not null default gen_random_uuid();
create unique index if not exists cosmii_player_public_id on public.cosmii_player_bests(public_id);
alter table public.cosmii_player_bests add column if not exists hidden boolean not null default false;
alter table public.cosmii_scores add column if not exists hidden boolean not null default false;
create table if not exists public.cosmii_player_restrictions (
 user_id uuid primary key references auth.users(id) on delete cascade,
 blocked boolean not null default true, note text not null default '',
 updated_at timestamptz not null default now()
);
create table if not exists public.cosmii_reports (
 id uuid primary key default gen_random_uuid(),
 reporter_id uuid not null references auth.users(id) on delete cascade,
 target_id uuid not null references auth.users(id) on delete cascade,
 target_public_id uuid not null,
 reason text not null check(reason in ('name','score','other')),
 name_at_report text not null, score_at_report integer not null,
 status text not null default 'open' check(status in ('open','reviewed','actioned','dismissed')),
 created_at timestamptz not null default now(), resolved_at timestamptz,
 operator_note text not null default ''
);
create index if not exists cosmii_reports_rate on public.cosmii_reports(reporter_id,created_at);
create table if not exists public.cosmii_deletion_requests (
 request_id uuid primary key,
 user_id uuid references auth.users(id) on delete set null,
 completed boolean not null default false,
 created_at timestamptz not null default now()
);
create index if not exists cosmii_deletion_user on public.cosmii_deletion_requests(user_id);
alter table public.cosmii_name_rules enable row level security;
alter table public.cosmii_player_restrictions enable row level security;
alter table public.cosmii_reports enable row level security;
alter table public.cosmii_deletion_requests enable row level security;
revoke all on public.cosmii_name_rules,public.cosmii_player_restrictions,public.cosmii_reports,public.cosmii_deletion_requests from public,anon,authenticated;
grant select,update on public.cosmii_deletion_requests to service_role;

-- Checks actual account existence: a JWT can outlive an Auth account deletion.
create or replace function public.cosmii_assert_player(uid uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 if uid is null then raise exception 'AUTH_REQUIRED'; end if;
 perform 1 from auth.users where id=uid for key share;
 if not found then raise exception 'ACCOUNT_DELETED'; end if;
 if exists(select 1 from public.cosmii_deletion_requests where user_id=uid) then raise exception 'DELETION_PENDING'; end if;
 if exists(select 1 from public.cosmii_player_restrictions where user_id=uid and blocked) then raise exception 'PLAYER_BLOCKED'; end if;
end; $$;
create or replace function public.cosmii_moderate_write() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if not public.cosmii_name_allowed(new.player_name) then raise exception 'NAME_NOT_ALLOWED'; end if;
 if tg_table_name='cosmii_player_bests' then
  perform public.cosmii_assert_player(new.user_id);
 end if;
 return new;
end; $$;
drop trigger if exists cosmii_moderate_player on public.cosmii_player_bests;
create trigger cosmii_moderate_player before insert or update of player_name,score on public.cosmii_player_bests for each row execute function public.cosmii_moderate_write();
drop trigger if exists cosmii_moderate_legacy on public.cosmii_scores;
create trigger cosmii_moderate_legacy before insert or update of player_name,score on public.cosmii_scores for each row execute function public.cosmii_moderate_write();

create or replace function public.cosmii_player_rename(p_event_id text,p_name text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); changed integer;
begin
 perform public.cosmii_assert_player(uid);
 if p_event_id is distinct from 'cosmii-rescue-v1' then raise exception 'INVALID_EVENT'; end if;
 if not public.cosmii_name_allowed(p_name) then raise exception 'NAME_NOT_ALLOWED'; end if;
 update public.cosmii_player_bests set player_name=btrim(p_name) where event_id=p_event_id and user_id=uid;
 get diagnostics changed=row_count;
 return jsonb_build_object('updated',changed>0);
end; $$;

create or replace function public.cosmii_public_players(p_event_id text)
returns table(rank bigint,player_name text,score integer,rescued integer,public_id uuid,achieved_at timestamptz)
language sql stable security definer set search_path='' as $$
 select rank() over(order by s.score desc),s.player_name,s.score,s.score,s.public_id,s.achieved_at
 from public.cosmii_player_bests s where s.event_id=p_event_id and not s.hidden
 and public.cosmii_name_allowed(s.player_name)
 and not exists(select 1 from public.cosmii_player_restrictions r where r.user_id=s.user_id and r.blocked)
 and not exists(select 1 from public.cosmii_deletion_requests d where d.user_id=s.user_id);
$$;
-- New clients get a public row identifier, never Auth user IDs.
create or replace function public.cosmii_player_top_scores_v2(p_event_id text,p_hidden_ids uuid[] default '{}')
returns table(rank bigint,player_name text,score integer,rescued integer,public_id uuid)
language plpgsql stable security definer set search_path='' as $$
begin
 if p_event_id is distinct from 'cosmii-rescue-v1' then raise exception 'INVALID_EVENT'; end if;
 if cardinality(p_hidden_ids)>100 then raise exception 'INVALID_REQUEST'; end if;
 return query select s.rank,s.player_name,s.score,s.rescued,s.public_id
 from public.cosmii_public_players(p_event_id) s
 where not(s.public_id=any(coalesce(p_hidden_ids,'{}')))
 order by s.score desc,s.achieved_at,s.public_id limit 20;
end; $$;
-- Preserve old signatures, but no old endpoint exposes filtered/hidden names.
create or replace function public.cosmii_player_top_scores(p_event_id text)
returns table(rank bigint,player_name text,score integer,rescued integer)
language sql stable security definer set search_path='' as $$
 select s.rank,s.player_name,s.score,s.rescued from public.cosmii_player_top_scores_v2(p_event_id) s;
$$;
create or replace function public.cosmii_top_scores(p_event_id text)
returns table(rank bigint,player_name text,score integer,rescued integer)
language sql stable security definer set search_path='' as $$
 select row_number() over(order by s.score desc,s.created_at,s.run_id),s.player_name,s.score,s.rescued
 from public.cosmii_scores s where s.event_id=p_event_id and not s.hidden and public.cosmii_name_allowed(s.player_name)
 order by s.score desc,s.created_at,s.run_id limit 20;
$$;
create or replace function public.cosmii_rescue_top_scores(p_event_id text)
returns table(rank bigint,player_name text,score integer,rescued integer)
language plpgsql stable security definer set search_path='' as $$
begin
 if p_event_id is distinct from 'cosmii-rescue-v1' then raise exception 'INVALID_EVENT'; end if;
 return query select rank() over(order by s.score desc),s.player_name,s.score,s.rescued
 from public.cosmii_scores s where s.event_id=p_event_id and not s.hidden and public.cosmii_name_allowed(s.player_name)
 order by s.score desc,s.created_at,s.run_id limit 20;
end; $$;

create or replace function public.cosmii_report_player(p_target_id uuid,p_reason text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); target public.cosmii_player_bests%rowtype;
begin
 perform public.cosmii_assert_player(uid);
 -- Serialize a reporter's concurrent requests so the rate cap cannot be raced.
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 if p_reason is null or p_reason not in ('name','score','other') then raise exception 'INVALID_REQUEST'; end if;
 select * into target from public.cosmii_player_bests where public_id=p_target_id;
 if not found then raise exception 'TARGET_NOT_FOUND'; end if;
 if target.user_id=uid then raise exception 'SELF_REPORT'; end if;
 if exists(select 1 from public.cosmii_reports where reporter_id=uid and target_id=target.user_id and created_at>now()-interval '24 hours') then
  return jsonb_build_object('accepted',true,'duplicate',true);
 end if;
 if (select count(*) from public.cosmii_reports where reporter_id=uid and created_at>now()-interval '24 hours')>=5 then raise exception 'REPORT_LIMIT'; end if;
 insert into public.cosmii_reports(reporter_id,target_id,target_public_id,reason,name_at_report,score_at_report)
 values(uid,target.user_id,target.public_id,p_reason,target.player_name,target.score);
 return jsonb_build_object('accepted',true,'duplicate',false);
end; $$;

-- The random request ID is a deletion capability, retained locally only until completion.
-- Authenticated consent is required to create it; only the Edge Function can read it.
create or replace function public.cosmii_request_account_deletion(p_request_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); owner uuid;
begin
 if uid is null then raise exception 'AUTH_REQUIRED'; end if;
 if p_request_id is null then raise exception 'INVALID_REQUEST'; end if;
 perform 1 from auth.users where id=uid for update;
 if not found then raise exception 'ACCOUNT_DELETED'; end if;
 insert into public.cosmii_deletion_requests(request_id,user_id) values(p_request_id,uid) on conflict do nothing;
 select user_id into owner from public.cosmii_deletion_requests where request_id=p_request_id;
 if owner is distinct from uid then raise exception 'INVALID_REQUEST'; end if;
 return jsonb_build_object('accepted',true);
end; $$;

revoke all on function public.cosmii_normalize_name(text),public.cosmii_name_allowed(text),public.cosmii_assert_player(uuid),public.cosmii_moderate_write(),public.cosmii_public_players(text) from public,anon,authenticated;
revoke all on function public.cosmii_player_top_scores_v2(text,uuid[]) from public;
grant execute on function public.cosmii_player_top_scores_v2(text,uuid[]) to anon,authenticated;
revoke all on function public.cosmii_report_player(uuid,text),public.cosmii_request_account_deletion(uuid) from public,anon;
grant execute on function public.cosmii_report_player(uuid,text),public.cosmii_request_account_deletion(uuid) to authenticated;
create or replace function public.cosmii_player_submit_score(
 p_event_id text,p_run_id uuid,p_name text,p_score integer,p_rescued integer,p_seconds integer
) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); clean_name text:=btrim(p_name); entry public.cosmii_player_bests%rowtype; place bigint;
begin
 perform public.cosmii_assert_player(uid);
 if exists(select 1 from public.cosmii_player_bests where event_id=p_event_id and user_id=uid and hidden) then raise exception 'PLAYER_BLOCKED'; end if;
 if not public.cosmii_name_allowed(p_name) then raise exception 'NAME_NOT_ALLOWED'; end if;
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
 score=excluded.score,seconds=excluded.seconds,run_id=excluded.run_id,achieved_at=clock_timestamp()
 where excluded.score>cosmii_player_bests.score;
 select * into entry from public.cosmii_player_bests s where s.event_id=p_event_id and s.user_id=uid;
 select count(*)+1 into place from public.cosmii_public_players(p_event_id) s where s.score>entry.score;
 return jsonb_build_object('rank',place,'score',entry.score);
end; $$;

commit;
