-- ═══════════════════════════════════════════════════════════
-- Table: active_species
-- Currently live species in the simulation. One per player
-- (plus AI species).
-- ═══════════════════════════════════════════════════════════

CREATE TABLE active_species (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id         UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  design_id        UUID REFERENCES species_designs(id) ON DELETE SET NULL,
  player_id        UUID REFERENCES players(id) ON DELETE CASCADE,
    -- NULL for AI species
  is_ai            BOOLEAN NOT NULL DEFAULT false,
  deployed_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  retired_at       TIMESTAMPTZ,
  end_reason       TEXT CHECK (end_reason IN ('extinct', 'retired')),
  population_count INTEGER NOT NULL DEFAULT 0,
  generation_max   INTEGER NOT NULL DEFAULT 0,
  dominance_score  REAL NOT NULL DEFAULT 0.0,
  entropy_multiplier REAL NOT NULL DEFAULT 1.0,
  template_genes   JSONB NOT NULL DEFAULT '{}'::jsonb,
  species_name     TEXT NOT NULL DEFAULT 'Unknown',

  -- Peak stats (high-water marks updated by server)
  peak_population  INTEGER NOT NULL DEFAULT 0,
  peak_dominance   REAL NOT NULL DEFAULT 0.0,
  peak_dominance_rank INTEGER,
  peak_territory   REAL NOT NULL DEFAULT 0.0,
  peak_biomass     REAL NOT NULL DEFAULT 0.0,

  -- Lifetime totals (accumulated by server)
  lifetime_stats   JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_active_species_player ON active_species (player_id)
  WHERE retired_at IS NULL;
CREATE INDEX idx_active_species_live ON active_species (retired_at)
  WHERE retired_at IS NULL;
CREATE INDEX idx_active_species_dominance ON active_species (dominance_score DESC)
  WHERE retired_at IS NULL;
CREATE INDEX idx_active_species_world ON active_species (world_id);

CREATE TRIGGER active_species_updated_at
  BEFORE UPDATE ON active_species
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
