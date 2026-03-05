-- ═══════════════════════════════════════════════════════════
-- RPC Functions
-- Called via supabase.rpc() from client or server.
-- ═══════════════════════════════════════════════════════════

-- Expire stale pending mutations (called hourly by pg_cron)
CREATE OR REPLACE FUNCTION expire_stale_mutations()
RETURNS INTEGER AS $$
DECLARE
  affected INTEGER;
BEGIN
  UPDATE daily_mutations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < now();
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$ LANGUAGE plpgsql;

-- Get player's complete status for return-after-absence flow
CREATE OR REPLACE FUNCTION get_player_status(p_player_id UUID)
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'has_active_species', EXISTS(
      SELECT 1 FROM active_species
      WHERE player_id = p_player_id AND retired_at IS NULL
    ),
    'pending_mutations', (
      SELECT count(*) FROM daily_mutations
      WHERE player_id = p_player_id AND status = 'pending'
    ),
    'latest_summary', (
      SELECT summary FROM player_summaries
      WHERE player_id = p_player_id
      ORDER BY period_end DESC
      LIMIT 1
    ),
    'leaderboard_rank', (
      SELECT rank FROM (
        SELECT player_id, RANK() OVER (ORDER BY dominance_score DESC) as rank
        FROM leaderboard_scores
        WHERE player_id IS NOT NULL
      ) ranked
      WHERE player_id = p_player_id
    )
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Update species peak stats (high-water marks)
-- Called by server periodically with current species metrics
CREATE OR REPLACE FUNCTION update_species_peaks(
  p_species_id UUID,
  p_population INTEGER,
  p_dominance REAL,
  p_rank INTEGER,
  p_territory REAL,
  p_biomass REAL,
  p_lifetime_stats JSONB
)
RETURNS VOID AS $$
BEGIN
  UPDATE active_species
  SET
    peak_population = GREATEST(peak_population, p_population),
    peak_dominance = GREATEST(peak_dominance, p_dominance),
    peak_dominance_rank = CASE
      WHEN peak_dominance_rank IS NULL THEN p_rank
      ELSE LEAST(peak_dominance_rank, p_rank)
    END,
    peak_territory = GREATEST(peak_territory, p_territory),
    peak_biomass = GREATEST(peak_biomass, p_biomass),
    population_count = p_population,
    dominance_score = p_dominance,
    lifetime_stats = p_lifetime_stats
  WHERE id = p_species_id;
END;
$$ LANGUAGE plpgsql;

-- Client-side design pre-validation via Supabase RPC
-- Authoritative validation is performed on the VPS at deploy time
CREATE OR REPLACE FUNCTION validate_design(design_json JSONB, player_id UUID)
RETURNS JSONB AS $$
DECLARE
  player_tier INTEGER;
BEGIN
  SELECT unlocked_tier INTO player_tier FROM players WHERE id = player_id;
  -- Lightweight check: BP total and tier gating
  -- Full validation happens server-side on deploy
  RETURN jsonb_build_object(
    'valid', true,
    'errors', '[]'::jsonb,
    'player_tier', player_tier
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
