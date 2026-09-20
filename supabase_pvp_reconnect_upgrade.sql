begin;

alter table public.pvp_queues add column if not exists match_room_id text;
alter table public.pvp_queues add column if not exists match_opponent_id uuid;
alter table public.pvp_queues add column if not exists joined_at timestamptz default now();
alter table public.pvp_queues add column if not exists created_at timestamptz default now();
update public.pvp_queues
set joined_at = coalesce(joined_at, created_at, now()),
    created_at = coalesce(created_at, joined_at, now());
delete from public.pvp_queues older
using public.pvp_queues newer
where older.user_id = newer.user_id
  and older.ctid < newer.ctid;
create unique index if not exists pvp_queues_user_id_unique on public.pvp_queues(user_id);

-- Authoritative, resumable state for a live PvP room. Match history and rewards
-- remain in pvp_matches; this table is only for a match that is in progress.
create table if not exists public.pvp_live_matches (
  room_id text primary key,
  host_id uuid not null references public.profiles(id) on delete cascade,
  guest_id uuid not null references public.profiles(id) on delete cascade,
  class_id integer not null check (class_id between 6 and 12),
  status text not null default 'waiting' check (status in ('waiting', 'starting', 'playing', 'finished', 'abandoned')),
  phase text not null default 'waiting' check (phase in ('waiting', 'countdown', 'question', 'result', 'finished')),
  questions jsonb not null default '[]'::jsonb,
  current_question_index integer not null default 0,
  round_id text,
  current_question jsonb,
  current_result jsonb,
  scores jsonb not null default '{}'::jsonb,
  answers jsonb not null default '{}'::jsonb,
  revision bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (host_id <> guest_id)
);

create index if not exists pvp_live_matches_host_idx on public.pvp_live_matches(host_id);
create index if not exists pvp_live_matches_guest_idx on public.pvp_live_matches(guest_id);

alter table public.pvp_live_matches enable row level security;
revoke all on public.pvp_live_matches from anon;
grant select, update on public.pvp_live_matches to authenticated;

drop policy if exists "pvp_live_participants_read" on public.pvp_live_matches;
create policy "pvp_live_participants_read"
on public.pvp_live_matches for select
using (auth.uid() in (host_id, guest_id));

drop policy if exists "pvp_live_host_update" on public.pvp_live_matches;
create policy "pvp_live_host_update"
on public.pvp_live_matches for update
using (auth.uid() = host_id)
with check (auth.uid() = host_id);

-- Matchmaking is serialized per class. This prevents two browser clients from
-- claiming the same waiting player while still allowing different classes to
-- be matched independently.
create or replace function public.claim_pvp_match(
  p_class_id integer,
  p_display_name text,
  p_avatar_url text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_current public.pvp_queues%rowtype;
  v_opponent public.pvp_queues%rowtype;
  v_live public.pvp_live_matches%rowtype;
  v_room_id text;
  v_host_id uuid;
  v_guest_id uuid;
  v_claimed_count integer;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_class_id not between 6 and 12 then raise exception 'Invalid class'; end if;

  perform pg_advisory_xact_lock(74001, p_class_id);

  insert into public.pvp_queues(user_id, class_id, display_name, avatar_url, joined_at, created_at, match_room_id, match_opponent_id)
  values (v_user_id, p_class_id, nullif(trim(p_display_name), ''), p_avatar_url, now(), now(), null, null)
  on conflict (user_id) do update
  set class_id = excluded.class_id,
      display_name = excluded.display_name,
      avatar_url = excluded.avatar_url,
      joined_at = case when public.pvp_queues.class_id <> excluded.class_id then now() else public.pvp_queues.joined_at end,
      match_room_id = case when public.pvp_queues.class_id <> excluded.class_id then null else public.pvp_queues.match_room_id end,
      match_opponent_id = case when public.pvp_queues.class_id <> excluded.class_id then null else public.pvp_queues.match_opponent_id end;

  select * into v_current from public.pvp_queues where user_id = v_user_id for update;
  if v_current.match_room_id is not null then
    select * into v_live from public.pvp_live_matches where room_id = v_current.match_room_id;
    select * into v_opponent from public.pvp_queues where user_id = v_current.match_opponent_id;
    if v_live.room_id is not null then
      return jsonb_build_object(
        'status', 'matched', 'room_id', v_live.room_id,
        'host_id', v_live.host_id, 'guest_id', v_live.guest_id,
        'opponent_id', v_current.match_opponent_id,
        'opponent_name', v_opponent.display_name,
        'opponent_avatar', v_opponent.avatar_url
      );
    end if;
  end if;

  select * into v_opponent
  from public.pvp_queues
  where class_id = p_class_id
    and user_id <> v_user_id
    and match_room_id is null
  order by coalesce(joined_at, created_at), user_id
  for update skip locked
  limit 1;

  if v_opponent.user_id is null then
    return jsonb_build_object('status', 'waiting');
  end if;

  if v_user_id::text < v_opponent.user_id::text then
    v_host_id := v_user_id; v_guest_id := v_opponent.user_id;
  else
    v_host_id := v_opponent.user_id; v_guest_id := v_user_id;
  end if;

  v_room_id := 'pvp_' || substr(replace(v_host_id::text, '-', ''), 1, 8)
    || '_' || substr(replace(v_guest_id::text, '-', ''), 1, 8)
    || '_' || floor(extract(epoch from clock_timestamp()) * 1000)::bigint::text;

  update public.pvp_queues
  set match_room_id = v_room_id,
      match_opponent_id = case when user_id = v_user_id then v_opponent.user_id else v_user_id end
  where user_id in (v_user_id, v_opponent.user_id) and match_room_id is null;

  get diagnostics v_claimed_count = row_count;
  if v_claimed_count <> 2 then raise exception 'PvP pair claim was not atomic'; end if;

  insert into public.pvp_live_matches(room_id, host_id, guest_id, class_id)
  values (v_room_id, v_host_id, v_guest_id, p_class_id)
  on conflict (room_id) do nothing;

  return jsonb_build_object(
    'status', 'matched', 'room_id', v_room_id,
    'host_id', v_host_id, 'guest_id', v_guest_id,
    'opponent_id', v_opponent.user_id,
    'opponent_name', v_opponent.display_name,
    'opponent_avatar', v_opponent.avatar_url
  );
end;
$$;

revoke all on function public.claim_pvp_match(integer, text, text) from public;
grant execute on function public.claim_pvp_match(integer, text, text) to authenticated;

create or replace function public.cancel_pvp_live_match(p_room_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.pvp_live_matches
  set status = 'abandoned', phase = 'finished', revision = revision + 1, updated_at = now()
  where room_id = p_room_id
    and auth.uid() in (host_id, guest_id)
    and status not in ('finished', 'abandoned');
  return found;
end;
$$;

revoke all on function public.cancel_pvp_live_match(text) from public;
grant execute on function public.cancel_pvp_live_match(text) to authenticated;

do $$
begin
  begin
    alter publication supabase_realtime add table public.pvp_live_matches;
  exception when duplicate_object then null;
  end;
end $$;

commit;
