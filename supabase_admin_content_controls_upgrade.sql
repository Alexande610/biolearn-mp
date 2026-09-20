begin;

create or replace function public.xp_threshold_for_level(p_level integer)
returns integer language sql immutable strict
as $$
  select case
    when p_level <= 1 then 0
    when p_level >= 30 then 232000
    else 250 * (p_level - 1) * (p_level + 2)
  end;
$$;

create table if not exists public.content_controls (
  content_type text not null check (content_type in ('map_level', 'simulation_game', 'biology_model')),
  item_id text not null,
  title text not null,
  metadata jsonb not null default '{}'::jsonb,
  is_enabled boolean not null default true,
  maintenance_message text not null default 'Nội dung đang được bảo trì. Vui lòng quay lại sau.',
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (content_type, item_id)
);

alter table public.content_controls enable row level security;
revoke all on public.content_controls from anon;
grant select, insert, update on public.content_controls to authenticated;

drop policy if exists "content_controls_authenticated_read" on public.content_controls;
create policy "content_controls_authenticated_read"
on public.content_controls for select
using (auth.uid() is not null);

drop policy if exists "content_controls_admin_insert" on public.content_controls;
create policy "content_controls_admin_insert"
on public.content_controls for insert
with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "content_controls_admin_update" on public.content_controls;
create policy "content_controls_admin_update"
on public.content_controls for update
using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create or replace function public.admin_update_user_resources(
  p_user_id uuid,
  p_level integer,
  p_coins integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_xp integer;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Admin permission required';
  end if;
  if p_level not between 1 and 30 then raise exception 'Level must be between 1 and 30'; end if;
  if p_coins < 0 then raise exception 'Coins cannot be negative'; end if;
  if not exists (select 1 from public.profiles where id = p_user_id) then raise exception 'User not found'; end if;

  v_xp := public.xp_threshold_for_level(p_level);
  update public.profiles
  set level = p_level, xp = v_xp, coins = p_coins, updated_at = now()
  where id = p_user_id;

  return jsonb_build_object('user_id', p_user_id, 'level', p_level, 'xp', v_xp, 'coins', p_coins);
end;
$$;

revoke all on function public.admin_update_user_resources(uuid, integer, integer) from public;
grant execute on function public.admin_update_user_resources(uuid, integer, integer) to authenticated;

commit;
