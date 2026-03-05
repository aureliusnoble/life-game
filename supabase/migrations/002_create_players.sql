-- ═══════════════════════════════════════════════════════════
-- Table: players
-- Core player account data. Created by trigger on auth signup.
-- Note: current_world_id FK added in 004 after worlds table exists.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE players (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT NOT NULL DEFAULT 'Player'
                  CHECK (char_length(display_name) BETWEEN 2 AND 24),
  role          TEXT NOT NULL DEFAULT 'player'
                  CHECK (role IN ('player', 'admin')),
  evolution_points INTEGER NOT NULL DEFAULT 0
                  CHECK (evolution_points >= 0),
  unlocked_tier INTEGER NOT NULL DEFAULT 1
                  CHECK (unlocked_tier BETWEEN 1 AND 4),
  achievements  JSONB NOT NULL DEFAULT '[]'::jsonb,
  mutation_time TIME NOT NULL DEFAULT '12:00:00',
  total_generations INTEGER NOT NULL DEFAULT 0,
  total_deployments INTEGER NOT NULL DEFAULT 0,
  total_kills   INTEGER NOT NULL DEFAULT 0,
  current_world_id UUID,  -- FK added in 004_add_players_world_fk.sql
  onboarding_state JSONB NOT NULL DEFAULT '{"quickStartCompleted":false,"quickStartStep":0,"introductions":{},"tierUnlocksSeen":[]}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_players_display_name ON players (display_name);
CREATE INDEX idx_players_current_world ON players (current_world_id)
  WHERE current_world_id IS NOT NULL;

CREATE TRIGGER players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create player row on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.players (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', 'Player'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
