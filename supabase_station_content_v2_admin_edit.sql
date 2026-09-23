-- Apply once after supabase_station_content_v2.sql. Admin edits are atomic and
-- move the release to review, preventing a draft import from overwriting them.
begin;

create or replace function public.admin_update_station_content_item(
  p_release_id uuid,
  p_item_id uuid,
  p_expected_updated_at timestamptz,
  p_content jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_release public.station_content_releases%rowtype;
  v_item public.station_content_items%rowtype;
begin
  if not public.is_app_admin() then
    raise exception 'admin_required' using errcode = '42501';
  end if;
  select * into v_release from public.station_content_releases
  where id = p_release_id for update;
  if not found then raise exception 'release_not_found'; end if;
  if v_release.status not in ('draft', 'review') then
    raise exception 'release_is_not_editable';
  end if;
  if jsonb_typeof(p_content) <> 'object'
     or nullif(trim(p_content->>'title'), '') is null
     or nullif(trim(p_content->>'learning_objective'), '') is null
     or jsonb_typeof(p_content->'public_content') <> 'object'
     or jsonb_typeof(p_content->'answer_key') <> 'object'
     or jsonb_typeof(p_content->'source_refs') <> 'array'
     or jsonb_array_length(p_content->'source_refs') = 0 then
    raise exception 'invalid_station_item_content';
  end if;
  update public.station_content_items
  set title = p_content->>'title',
      learning_objective = p_content->>'learning_objective',
      public_content = p_content->'public_content',
      answer_key = p_content->'answer_key',
      source_refs = p_content->'source_refs',
      updated_at = clock_timestamp()
  where id = p_item_id and release_id = p_release_id
    and updated_at = p_expected_updated_at
  returning * into v_item;
  if not found then raise exception 'station_item_changed_reload_required'; end if;
  update public.station_content_releases
  set status = 'review', updated_at = clock_timestamp()
  where id = p_release_id;
  return jsonb_build_object('id', v_item.id, 'updated_at', v_item.updated_at,
                            'release_status', 'review');
end;
$$;

revoke all on function public.admin_update_station_content_item(uuid, uuid, timestamptz, jsonb)
from public, anon;
grant execute on function public.admin_update_station_content_item(uuid, uuid, timestamptz, jsonb)
to authenticated;

commit;
