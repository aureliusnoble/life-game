-- ═══════════════════════════════════════════════════════════
-- Table: world_access_grants
-- Persistent access grants for worlds. Once granted (via
-- correct password entry or admin invite), a player can
-- rejoin without re-entering the password. Revoked on ban.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE world_access_grants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id        UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  granted_by      UUID REFERENCES players(id),
    -- NULL = self-granted via correct password entry
    -- UUID = admin who invited/granted access
  granted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(world_id, player_id)
);

CREATE INDEX idx_world_access_grants_world ON world_access_grants (world_id);
CREATE INDEX idx_world_access_grants_player ON world_access_grants (player_id);
