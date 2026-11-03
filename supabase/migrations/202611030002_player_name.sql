-- Apply after 202611030001_player_best_ranking.sql. Does not reset rankings.
begin;
create or replace function public.cosmii_player_rename(p_event_id text,p_name text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); clean_name text:=btrim(p_name); changed integer;
begin
 if uid is null then raise exception 'AUTH_REQUIRED'; end if;
 if p_event_id is distinct from 'cosmii-rescue-v1' then raise exception 'INVALID_EVENT'; end if;
 if clean_name is null or char_length(clean_name) not between 1 and 12
 or clean_name ~ '[[:cntrl:]]' or clean_name ~ U&'[\202A-\202E\2066-\2069]' then raise exception 'INVALID_NAME'; end if;
 update public.cosmii_player_bests set player_name=clean_name where event_id=p_event_id and user_id=uid;
 get diagnostics changed = row_count;
 return jsonb_build_object('updated',changed>0);
end; $$;
revoke all on function public.cosmii_player_rename(text,text) from public,anon;
grant execute on function public.cosmii_player_rename(text,text) to authenticated;

-- A delayed score submission must not undo a newer explicit name change.
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
 score=excluded.score,seconds=excluded.seconds,run_id=excluded.run_id,achieved_at=clock_timestamp()
 where excluded.score>cosmii_player_bests.score;
 select * into entry from public.cosmii_player_bests s where s.event_id=p_event_id and s.user_id=uid;
 select count(*)+1 into place from public.cosmii_player_bests s where s.event_id=p_event_id and s.score>entry.score;
 return jsonb_build_object('rank',place,'score',entry.score);
end; $$;
revoke all on function public.cosmii_player_submit_score(text,uuid,text,integer,integer,integer) from public,anon;
grant execute on function public.cosmii_player_submit_score(text,uuid,text,integer,integer,integer) to authenticated;
commit;
