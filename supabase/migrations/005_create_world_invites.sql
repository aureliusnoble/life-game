-- ═══════════════════════════════════════════════════════════
-- Table: world_invites
-- Invite-only world access. Invited players can join.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE world_invites (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id        UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  player_id       UUID NOT NULL REFERENCES players(id),
  invited_by      UUID NOT NULL REFERENCES players(id),
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(world_id, player_id)
);

CREATE INDEX idx_world_invites_world ON world_invites (world_id, status);
CREATE INDEX idx_world_invites_player ON world_invites (player_id, status);
