-- Release prerequisite. Preserve normal/skip reward implementation; block old boss reward codes.
-- Does NOT enable live Boss V2 and does NOT change profile privileges.
begin;
do $$ begin
  if to_regprocedure('public.boss_v2_claim_map_reward_legacy(text,integer,text)') is null then
    if to_regprocedure('public.claim_map_reward(text,integer,text)') is null then
      raise exception 'claim_map_reward_missing';
    end if;
    alter function public.claim_map_reward(text,integer,text) rename to boss_v2_claim_map_reward_legacy;
  end if;
end $$;

revoke all on function public.boss_v2_claim_map_reward_legacy(text,integer,text) from public,anon,authenticated;

create or replace function public.claim_map_reward(p_event_key text,p_class_id integer,p_reward_code text)
returns jsonb language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_reward_code is null or p_reward_code not in ('normal','skip') then
    raise exception 'legacy_boss_reward_disabled';
  end if;
  return public.boss_v2_claim_map_reward_legacy(p_event_key,p_class_id,p_reward_code);
end $$;
revoke all on function public.claim_map_reward(text,integer,text) from public,anon;
grant execute on function public.claim_map_reward(text,integer,text) to authenticated;
commit;
