-- Run only after all 21 active stations have a verified V2 publication and
-- the V2 client has been deployed. This removes the legacy answer/reward path.
begin;

do $cutover$
declare
  v_missing integer;
begin
  select count(*) into v_missing
  from public.station_catalog c
  where not c.is_future
    and not exists (
      select 1
      from public.station_content_publications p
      join public.station_content_releases r on r.id = p.release_id
      where p.grade = c.grade
        and p.station_id = c.station_id
        and r.status = 'published'
        and (select count(*) from public.station_content_items i where i.release_id = r.id) = 50
    );
  if v_missing > 0 then
    raise exception 'cutover_blocked_missing_complete_publications: %', v_missing;
  end if;
end;
$cutover$;

revoke execute on function public.claim_station_reward(text, integer, integer)
from public, anon, authenticated;

revoke all on table public.station_questions from anon, authenticated;

commit;
