-- 1. Ensure necessary columns exist safely
DO $$ 
BEGIN
    -- Core Stats
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'pvp_score') THEN
        ALTER TABLE public.profiles ADD COLUMN pvp_score INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'weekly_score') THEN
        ALTER TABLE public.profiles ADD COLUMN weekly_score INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'total_score') THEN
        ALTER TABLE public.profiles ADD COLUMN total_score INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'daily_missions') THEN
        ALTER TABLE public.profiles ADD COLUMN daily_missions JSONB DEFAULT '{}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'last_class_id') THEN
        ALTER TABLE public.profiles ADD COLUMN last_class_id TEXT;
    END IF;
    
    -- Streak & Activity Stats
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'login_streak') THEN
        ALTER TABLE public.profiles ADD COLUMN login_streak INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'last_streak_date') THEN
        ALTER TABLE public.profiles ADD COLUMN last_streak_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'last_active_at') THEN
        ALTER TABLE public.profiles ADD COLUMN last_active_at DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'levels_completed') THEN
        ALTER TABLE public.profiles ADD COLUMN levels_completed INTEGER DEFAULT 0;
    END IF;
END $$;

-- 2. Drop old functions to avoid conflicts
DROP FUNCTION IF EXISTS public.reward_user(UUID, INTEGER, INTEGER, TEXT);
DROP FUNCTION IF EXISTS public.reward_user(UUID, INTEGER, INTEGER, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.update_mission_progress(UUID, INTEGER, INTEGER, BOOLEAN);
DROP FUNCTION IF EXISTS public.internal_update_mission_and_streak(UUID, INTEGER, INTEGER, BOOLEAN);

-- 3. Core Mission & Streak Logic Function (Helper)
CREATE OR REPLACE FUNCTION public.internal_update_mission_and_streak(
  p_user_id UUID,
  p_mission_id INTEGER,
  p_progress_gain INTEGER,
  p_is_absolute BOOLEAN DEFAULT FALSE
)
RETURNS JSONB AS $$
DECLARE
  _res_missions JSONB;
  _res_last_active DATE;
  _res_last_streak DATE;
  _res_streak INTEGER;
  _res_new_missions JSONB;
  _res_prog_key TEXT;
  _res_comp_key TEXT;
  _res_current_prog INTEGER;
  _res_target INTEGER;
  _res_is_new_day BOOLEAN;
BEGIN
  -- Load current data using direct assignment to ensure no table-name confusion
  _res_missions := (SELECT daily_missions FROM public.profiles WHERE id = p_user_id);
  _res_last_active := (SELECT last_active_at FROM public.profiles WHERE id = p_user_id);
  _res_last_streak := (SELECT last_streak_date FROM public.profiles WHERE id = p_user_id);
  _res_streak := (SELECT login_streak FROM public.profiles WHERE id = p_user_id);

  _res_missions := COALESCE(_res_missions, '{}'::jsonb);
  _res_streak := COALESCE(_res_streak, 0);
  _res_is_new_day := (_res_last_active IS NULL OR _res_last_active < CURRENT_DATE);

  -- Handle Daily Reset (00:00)
  IF _res_is_new_day THEN
    -- If they didn't complete all missions yesterday, reset streak to 0
    IF _res_last_streak IS NULL OR _res_last_streak < CURRENT_DATE - 1 THEN
      _res_streak := 0;
    END IF;
    -- Clear missions for the new day
    _res_missions := '{}'::jsonb;
  END IF;

  -- Update Progress for specific mission
  _res_prog_key := 'mission' || p_mission_id || 'Progress';
  _res_comp_key := 'mission' || p_mission_id || 'Completed';
  _res_target := (CASE WHEN p_mission_id = 1 THEN 1 WHEN p_mission_id = 2 THEN 5 WHEN p_mission_id = 3 THEN 20 ELSE 0 END);

  IF p_is_absolute THEN
    _res_current_prog := p_progress_gain;
  ELSE
    _res_current_prog := COALESCE((_res_missions->>_res_prog_key)::INTEGER, 0) + p_progress_gain;
  END IF;

  _res_current_prog := LEAST(_res_current_prog, _res_target);
  
  _res_new_missions := _res_missions || jsonb_build_object(
    _res_prog_key, _res_current_prog,
    _res_comp_key, (_res_current_prog >= _res_target)
  );

  -- Check Entire Streak Completion (Strict Rule)
  -- Increment only if 1, 2, and 3 are all true AND not already earned today
  IF (_res_new_missions->>'mission1Completed')::BOOLEAN = TRUE 
     AND (_res_new_missions->>'mission2Completed')::BOOLEAN = TRUE 
     AND (_res_new_missions->>'mission3Completed')::BOOLEAN = TRUE
     AND (_res_last_streak IS NULL OR _res_last_streak < CURRENT_DATE) 
  THEN
    IF _res_last_streak = CURRENT_DATE - 1 THEN
      _res_streak := _res_streak + 1;
    ELSE
      _res_streak := 1;
    END IF;
    _res_last_streak := CURRENT_DATE;
  END IF;

  -- Update Profile
  UPDATE public.profiles
  SET 
    daily_missions = _res_new_missions,
    login_streak = _res_streak,
    last_streak_date = _res_last_streak,
    last_active_at = CURRENT_DATE,
    updated_at = NOW()
  WHERE id = p_user_id;

  RETURN _res_new_missions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Public RPC: Update Mission Progress (For timer/manual updates)
CREATE OR REPLACE FUNCTION public.update_mission_progress(
  p_user_id UUID,
  p_mission_id INTEGER,
  p_progress_gain INTEGER,
  p_is_absolute BOOLEAN DEFAULT FALSE
)
RETURNS JSONB AS $$
BEGIN
  RETURN public.internal_update_mission_and_streak(p_user_id, p_mission_id, p_progress_gain, p_is_absolute);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Public RPC: Reward User (For map/pvp completions)
CREATE OR REPLACE FUNCTION public.reward_user(
  p_user_id UUID,
  p_xp_gain INTEGER,
  p_coin_gain INTEGER,
  p_reward_type TEXT, -- 'map' or 'pvp'
  p_class_id TEXT DEFAULT NULL
) 
RETURNS JSONB AS $$
DECLARE
  v_final_missions JSONB;
BEGIN
  -- First update mission progress (Mission 1 and 2 logic)
  IF p_reward_type = 'map' OR p_reward_type = 'pvp' THEN
    -- Mission 1: Complete 1 game
    PERFORM public.internal_update_mission_and_streak(p_user_id, 1, 1, FALSE);
    -- Mission 2: Complete 5 levels (shared progress)
    v_final_missions := public.internal_update_mission_and_streak(p_user_id, 2, 1, FALSE);
  ELSE
    v_final_missions := (SELECT daily_missions FROM public.profiles WHERE id = p_user_id);
  END IF;

  -- Then update core stats
  UPDATE public.profiles
  SET 
    xp = COALESCE(xp, 0) + p_xp_gain,
    coins = COALESCE(coins, 0) + p_coin_gain,
    weekly_score = COALESCE(weekly_score, 0) + (CASE WHEN p_reward_type = 'map' THEN p_xp_gain ELSE 0 END),
    pvp_score = COALESCE(pvp_score, 0) + (CASE WHEN p_reward_type = 'pvp' THEN p_xp_gain ELSE 0 END),
    total_score = COALESCE(total_score, 0) + p_xp_gain,
    levels_completed = COALESCE(levels_completed, 0) + (CASE WHEN p_reward_type = 'map' THEN 1 ELSE 0 END),
    last_class_id = COALESCE(p_class_id, last_class_id),
    updated_at = NOW()
  WHERE id = p_user_id;

  RETURN v_final_missions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
