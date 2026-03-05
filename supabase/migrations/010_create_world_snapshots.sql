-- ═══════════════════════════════════════════════════════════
-- Table: world_snapshots
-- Periodic full world state snapshots for crash recovery.
-- Stored as JSONB. Old snapshots pruned by scheduled job.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE world_snapshots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id    UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  tick        BIGINT NOT NULL,
  snapshot    JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_snapshots_world_tick ON world_snapshots (world_id, tick DESC);
