-- NextGen post-migration compatibility fixes
-- Run this after supabase_unified_migration.sql if the database already existed.

alter table public.profiles add column if not exists energy_last_update timestamptz default now();
alter table public.profiles add column if not exists last_mini_game_claim timestamptz;
alter table public.profiles add column if not exists unlocked_chapters jsonb default '[]'::jsonb;
alter table public.profiles add column if not exists last_active_at timestamptz;
alter table public.profiles alter column last_active_at type timestamptz using last_active_at::timestamptz;

alter table public.pvp_queues add column if not exists match_room_id text;
alter table public.pvp_queues add column if not exists match_opponent_id uuid;
alter table public.pvp_queues add column if not exists display_name text;
alter table public.pvp_queues add column if not exists avatar_url text;
alter table public.pvp_queues add column if not exists joined_at timestamptz default now();
alter table public.pvp_queues add column if not exists created_at timestamptz default now();

update public.pvp_queues
set joined_at = coalesce(joined_at, created_at, now()),
    created_at = coalesce(created_at, joined_at, now());
