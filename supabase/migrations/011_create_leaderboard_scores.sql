-- ═══════════════════════════════════════════════════════════
-- Table: leaderboard_scores
-- Current leaderboard state. Upserted by server every 15 sec.
-- One row per active species.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE leaderboard_scores (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id          UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  species_id        UUID NOT NULL REFERENCES active_species(id) ON DELETE CASCADE,
  player_id         UUID REFERENCES players(id) ON DELETE CASCADE,
  species_name      TEXT NOT NULL,
  is_ai             BOOLEAN NOT NULL DEFAULT false,
  dominance_score   REAL NOT NULL DEFAULT 0.0,
  biomass_share     REAL NOT NULL DEFAULT 0.0,
  population_share  REAL NOT NULL DEFAULT 0.0,
  territory_coverage REAL NOT NULL DEFAULT 0.0,
  lineage_depth     INTEGER NOT NULL DEFAULT 0,
  keystone_bonus    REAL NOT NULL DEFAULT 0.0,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_species_leaderboard UNIQUE (species_id)
);

CREATE INDEX idx_leaderboard_dominance ON leaderboard_scores (dominance_score DESC);
CREATE INDEX idx_leaderboard_player ON leaderboard_scores (player_id);
CREATE INDEX idx_leaderboard_world ON leaderboard_scores (world_id);

CREATE TRIGGER leaderboard_updated_at
  BEFORE UPDATE ON leaderboard_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
