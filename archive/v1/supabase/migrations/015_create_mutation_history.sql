-- ═══════════════════════════════════════════════════════════
-- Table: mutation_history
-- Record of all mutations applied to species templates via
-- daily selection. For analytics and mutation pool viewer.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE mutation_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  species_id      UUID NOT NULL REFERENCES active_species(id) ON DELETE CASCADE,
  mutation_type   TEXT NOT NULL
    CHECK (mutation_type IN ('body', 'brain', 'convergent')),
  gene_id         TEXT NOT NULL,
  old_value       REAL NOT NULL,
  new_value       REAL NOT NULL,
  fitness_score   REAL NOT NULL DEFAULT 0.0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mut_history_player ON mutation_history (player_id, created_at DESC);
CREATE INDEX idx_mut_history_species ON mutation_history (species_id, created_at DESC);
CREATE INDEX idx_mut_history_gene ON mutation_history (gene_id, created_at DESC);
