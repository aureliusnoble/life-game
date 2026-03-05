-- ═══════════════════════════════════════════════════════════
-- Table: world_bans
-- Per-world player bans with optional expiration.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE world_bans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id        UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  player_id       UUID NOT NULL REFERENCES players(id),
  banned_by       UUID NOT NULL REFERENCES players(id),
  reason          TEXT DEFAULT '',
  expires_at      TIMESTAMPTZ,  -- NULL = permanent
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(world_id, player_id)
);

CREATE INDEX idx_world_bans_world ON world_bans (world_id);
CREATE INDEX idx_world_bans_player ON world_bans (player_id);
