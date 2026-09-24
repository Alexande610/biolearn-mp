-- Read-only security check after all 21 V2 stations are published.
-- After cutover, all four legacy privileges below should be false.
select
  has_function_privilege('authenticated',
    'public.claim_station_reward(text, integer, integer)', 'EXECUTE')
    as authenticated_can_claim_legacy_reward,
  has_function_privilege('anon',
    'public.claim_station_reward(text, integer, integer)', 'EXECUTE')
    as anon_can_claim_legacy_reward,
  has_table_privilege('authenticated', 'public.station_questions', 'SELECT')
    as authenticated_can_read_legacy_questions,
  has_table_privilege('anon', 'public.station_questions', 'SELECT')
    as anon_can_read_legacy_questions,
  has_function_privilege('authenticated',
    'public.start_station_attempt(integer, text, integer)', 'EXECUTE')
    as authenticated_can_start_v2_attempt,
  has_function_privilege('authenticated',
    'public.submit_station_answer(uuid, uuid, jsonb)', 'EXECUTE')
    as authenticated_can_submit_v2_answer,
  (select relrowsecurity from pg_class
   where oid = 'public.station_content_items'::regclass)
    as station_items_rls_enabled;
