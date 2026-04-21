-- Update reward_pvp to include total_score and wins
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wins INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pvp_wins INTEGER DEFAULT 0;

CREATE OR REPLACE FUNCTION public.reward_pvp(
  target_user_id UUID,
  add_xp INTEGER,
  add_coins INTEGER,
  add_rank INTEGER
) 
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET 
    xp = COALESCE(xp, 0) + add_xp,
    coins = COALESCE(coins, 0) + add_coins,
    total_score = COALESCE(total_score, 0) + add_xp, -- Assuming total_score follows XP gain
    pvp_wins = COALESCE(pvp_wins, 0) + (CASE WHEN add_xp >= 100 THEN 1 ELSE 0 END), -- Winner gets 100xp
    wins = COALESCE(wins, 0) + (CASE WHEN add_xp >= 100 THEN 1 ELSE 0 END),
    updated_at = NOW()
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
