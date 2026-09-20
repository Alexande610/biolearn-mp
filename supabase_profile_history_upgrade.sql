begin;

create or replace function public.get_my_profile_performance()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  with me as (
    select auth.uid() as user_id
  ),
  pvp as (
    select
      count(m.id) filter (where m.status is distinct from 'playing')::integer as total,
      count(m.id) filter (
        where (m.winner_id = me.user_id
           or (m.winner_id is null and m.quitter_id is not null and m.quitter_id <> me.user_id))
          and m.status is distinct from 'playing'
      )::integer as wins,
      count(m.id) filter (
        where ((m.winner_id is not null and m.winner_id <> me.user_id)
           or (m.winner_id is null and m.quitter_id = me.user_id))
          and m.status is distinct from 'playing'
      )::integer as losses,
      count(m.id) filter (
        where m.winner_id is null
          and m.quitter_id is null
          and m.status is distinct from 'playing'
      )::integer as draws,
      coalesce(round(avg(case when m.player1_id = me.user_id then m.player1_score else m.player2_score end)), 0)::integer as average_score
    from me
    left join public.pvp_matches m
      on (m.player1_id = me.user_id or m.player2_id = me.user_id)
  ),
  quiz as (
    select
      count(*) filter (where a.status = 'completed')::integer as completed,
      coalesce(round(avg(a.score) filter (where a.status = 'completed')), 0)::integer as average_score,
      coalesce(max(a.score) filter (where a.status = 'completed'), 0)::integer as best_score,
      coalesce(sum(a.correct_count) filter (where a.status = 'completed'), 0)::integer as correct_answers
    from me
    left join public.quiz_attempts a on a.student_id = me.user_id
  ),
  quiz_answers as (
    select
      count(*)::integer as answered,
      coalesce(round(avg(qa.response_ms)), 0)::integer as average_response_ms
    from me
    join public.quiz_answers qa on qa.student_id = me.user_id
    join public.quiz_attempts a on a.id = qa.attempt_id and a.status = 'completed'
  )
  select jsonb_build_object(
    'pvp_total', coalesce(pvp.total, 0),
    'pvp_wins', coalesce(pvp.wins, 0),
    'pvp_losses', coalesce(pvp.losses, 0),
    'pvp_draws', greatest(coalesce(pvp.draws, 0), coalesce(pvp.total, 0) - coalesce(pvp.wins, 0) - coalesce(pvp.losses, 0)),
    'pvp_win_rate', case when coalesce(pvp.total, 0) > 0 then round(pvp.wins * 100.0 / pvp.total, 1) else 0 end,
    'pvp_average_score', coalesce(pvp.average_score, 0),
    'quiz_completed', coalesce(quiz.completed, 0),
    'quiz_average_score', coalesce(quiz.average_score, 0),
    'quiz_best_score', coalesce(quiz.best_score, 0),
    'quiz_correct_answers', coalesce(quiz.correct_answers, 0),
    'quiz_answered', coalesce(quiz_answers.answered, 0),
    'quiz_accuracy', case when coalesce(quiz_answers.answered, 0) > 0 then round(quiz.correct_answers * 100.0 / quiz_answers.answered, 1) else 0 end,
    'quiz_average_response_ms', coalesce(quiz_answers.average_response_ms, 0)
  )
  from pvp cross join quiz cross join quiz_answers;
$$;

create or replace function public.get_my_pvp_history(p_limit integer default 12, p_offset integer default 0)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(jsonb_agg(to_jsonb(history_row) order by history_row.played_at desc), '[]'::jsonb)
  from (
    select
      m.id,
      m.room_id,
      m.class_id,
      m.status,
      coalesce(m.questions_played, 0) as questions_played,
      coalesce(m.finished_at, m.created_at) as played_at,
      case when m.player1_id = auth.uid() then coalesce(m.player1_score, 0) else coalesce(m.player2_score, 0) end as my_score,
      case when m.player1_id = auth.uid() then coalesce(m.player2_score, 0) else coalesce(m.player1_score, 0) end as opponent_score,
      case when m.player1_id = auth.uid() then m.player2_id else m.player1_id end as opponent_id,
      coalesce(opponent.display_name, 'Đối thủ') as opponent_name,
      opponent.avatar_url as opponent_avatar,
      case
        when m.winner_id = auth.uid() or (m.winner_id is null and m.quitter_id is not null and m.quitter_id <> auth.uid()) then 'win'
        when m.winner_id is null and m.quitter_id = auth.uid() then 'loss'
        when m.winner_id is null then 'draw'
        else 'loss'
      end as result,
      m.quitter_id = auth.uid() as did_quit,
      m.quitter_id is not null and m.quitter_id <> auth.uid() as opponent_quit
    from public.pvp_matches m
    left join public.profiles opponent
      on opponent.id = case when m.player1_id = auth.uid() then m.player2_id else m.player1_id end
    where auth.uid() is not null
      and (m.player1_id = auth.uid() or m.player2_id = auth.uid())
      and m.status is distinct from 'playing'
    order by coalesce(m.finished_at, m.created_at) desc
    limit least(greatest(coalesce(p_limit, 12), 1), 50)
    offset greatest(coalesce(p_offset, 0), 0)
  ) history_row;
$$;

create or replace function public.get_my_quiz_history(p_limit integer default 12, p_offset integer default 0)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(jsonb_agg(to_jsonb(history_row) order by history_row.started_at desc), '[]'::jsonb)
  from (
    select
      a.id,
      a.room_id,
      a.status,
      a.score,
      a.correct_count,
      a.started_at,
      a.completed_at,
      coalesce(r.title, 'Bài Quiz Sinh học') as title,
      coalesce(r.room_type, 'live') as room_type,
      coalesce(teacher.display_name, 'Giáo viên') as teacher_name,
      count(qa.id)::integer as answered_count,
      coalesce(round(avg(qa.response_ms)), 0)::integer as average_response_ms
    from public.quiz_attempts a
    left join public.quiz_rooms r on r.id = a.room_id
    left join public.profiles teacher on teacher.id = r.teacher_id
    left join public.quiz_answers qa on qa.attempt_id = a.id
    where auth.uid() is not null and a.student_id = auth.uid()
    group by a.id, r.title, r.room_type, teacher.display_name
    order by a.started_at desc
    limit least(greatest(coalesce(p_limit, 12), 1), 50)
    offset greatest(coalesce(p_offset, 0), 0)
  ) history_row;
$$;

revoke all on function public.get_my_profile_performance() from public;
revoke all on function public.get_my_pvp_history(integer, integer) from public;
revoke all on function public.get_my_quiz_history(integer, integer) from public;
grant execute on function public.get_my_profile_performance() to authenticated;
grant execute on function public.get_my_pvp_history(integer, integer) to authenticated;
grant execute on function public.get_my_quiz_history(integer, integer) to authenticated;

commit;
