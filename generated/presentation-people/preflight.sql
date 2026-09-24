-- Read-only. Run before the schema and seed on the intended Supabase project.
select
  current_database() as database_name,
  to_regclass('public.profiles') is not null as profiles_ready,
  to_regprocedure('public.current_biolearn_week()') is not null as weekly_function_ready,
  to_regclass('public.presentation_people') is not null as presentation_table_ready,
  (select count(*) from public.profiles) as real_profile_count;

select public.current_biolearn_week() as current_week_start;
