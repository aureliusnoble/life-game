-- ═══════════════════════════════════════════════════════════
-- Table: species_designs
-- Player-created organism blueprints. Immutable once deployed
-- (new version created for changes).
-- ═══════════════════════════════════════════════════════════

CREATE TABLE species_designs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id     UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  species_name  TEXT NOT NULL
                  CHECK (char_length(species_name) BETWEEN 2 AND 24),
  body          JSONB NOT NULL,
    -- BodyGenes: { sizeRatio, speedRatio, strength, defense, diet,
    --              viewAngle, viewRadius, metabolism, stomachMultiplier,
    --              growthSpeed, redColor, greenColor, blueColor }
  reproduction_mode TEXT NOT NULL DEFAULT 'asexual'
                  CHECK (reproduction_mode IN ('asexual', 'sexual')),
  founder_sex_ratio NUMERIC(3,2) NOT NULL DEFAULT 0.50
                  CHECK (founder_sex_ratio BETWEEN 0.10 AND 0.90),
  traits        JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- TraitConfig: { armorPlating?: {...}, venomGlands?: bool, ... }
  brain         JSONB NOT NULL,
    -- BrainConfig: { nodes: BrainNode[], synapses: Synapse[] }
  deployment    JSONB NOT NULL DEFAULT '{"biome":"random","founderCount":1,"biomeBPCost":0}'::jsonb,
    -- DeploymentConfig: { biome, founderCount, biomeBPCost }
  bp_total      INTEGER NOT NULL
                  CHECK (bp_total BETWEEN 1 AND 100),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  version       INTEGER NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_designs_player_id ON species_designs (player_id);
CREATE INDEX idx_designs_player_active ON species_designs (player_id, is_active)
  WHERE is_active = true;
CREATE INDEX idx_designs_created_at ON species_designs (created_at DESC);
