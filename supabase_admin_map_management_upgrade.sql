-- Run after supabase_admin_content_controls_upgrade.sql.
-- Separates lesson, practice and skip-challenge content without changing existing rows.

begin;

alter table public.lesson_questions
  add column if not exists stage_type text not null default 'lesson',
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists updated_by uuid references public.profiles(id) on delete set null;

update public.lesson_questions
set stage_type = case when lesson_id = 99 then 'practice' else 'lesson' end
where stage_type is null or stage_type = 'lesson';

alter table public.lesson_questions
  drop constraint if exists lesson_questions_stage_type_check;
alter table public.lesson_questions
  add constraint lesson_questions_stage_type_check
  check (stage_type in ('lesson', 'practice', 'skip_challenge'));

alter table public.lesson_questions
  drop constraint if exists lesson_questions_class_id_chapter_id_lesson_id_level_key;

create unique index if not exists lesson_questions_stage_identity_uidx
  on public.lesson_questions(class_id, chapter_id, stage_type, lesson_id, level);

create or replace function public.touch_lesson_questions_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists lesson_questions_touch_updated_at on public.lesson_questions;
create trigger lesson_questions_touch_updated_at
before update on public.lesson_questions
for each row execute function public.touch_lesson_questions_updated_at();

alter table public.lesson_questions enable row level security;
revoke all on public.lesson_questions from anon;
grant select, insert, update, delete on public.lesson_questions to authenticated;

drop policy if exists "Public Access" on public.lesson_questions;
drop policy if exists "lesson_questions_read_all" on public.lesson_questions;
drop policy if exists "lesson_questions_admin_insert" on public.lesson_questions;
drop policy if exists "lesson_questions_admin_update" on public.lesson_questions;
drop policy if exists "lesson_questions_admin_delete" on public.lesson_questions;

create policy "lesson_questions_read_all"
on public.lesson_questions for select
using (true);

create policy "lesson_questions_admin_insert"
on public.lesson_questions for insert
with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  and class_id between 6 and 12
  and chapter_id > 0
  and level >= 0
  and (
    (stage_type = 'lesson' and lesson_id > 0 and lesson_id <> 99)
    or (stage_type = 'practice' and lesson_id = 99 and level between 0 and 1)
    or (stage_type = 'skip_challenge' and lesson_id = 0 and level = 0)
  )
);

create policy "lesson_questions_admin_update"
on public.lesson_questions for update
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  and class_id between 6 and 12
  and chapter_id > 0
  and level >= 0
  and (
    (stage_type = 'lesson' and lesson_id > 0 and lesson_id <> 99)
    or (stage_type = 'practice' and lesson_id = 99 and level between 0 and 1)
    or (stage_type = 'skip_challenge' and lesson_id = 0 and level = 0)
  )
);

create policy "lesson_questions_admin_delete"
on public.lesson_questions for delete
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

comment on column public.lesson_questions.stage_type is
  'lesson: normal stage, practice: lesson_id 99, skip_challenge: one independent stage per chapter (lesson_id 0, level 0).';

commit;
