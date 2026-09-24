-- Removes only presentation records from this batch. Real profiles and scores are untouched.
begin;
delete from public.presentation_people where batch_id = 'thesis-presentation-2026-09';
commit;
select count(*) as remaining from public.presentation_people where batch_id = 'thesis-presentation-2026-09';
