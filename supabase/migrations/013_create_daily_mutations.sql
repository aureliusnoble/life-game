-- ═══════════════════════════════════════════════════════════
-- Table: daily_mutations
-- Server-generated mutation options and player selections.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE daily_mutations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id        UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  species_id      UUID NOT NULL REFERENCES active_species(id) ON DELETE CASCADE,
  options         JSONB NOT NULL,
    -- Array of 3 MutationOption objects
  selected_option INTEGER CHECK (selected_option BETWEEN 0 AND 2),
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'applied', 'expired', 'skipped')),
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mutations_player_pending ON daily_mutations (player_id, status)
  WHERE status = 'pending';
CREATE INDEX idx_mutations_player_date ON daily_mutations (player_id, created_at DESC);
CREATE INDEX idx_mutations_expires ON daily_mutations (expires_at)
  WHERE status = 'pending';
