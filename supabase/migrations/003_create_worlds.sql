-- ═══════════════════════════════════════════════════════════
-- Table: worlds
-- Multi-world rooms managed by WorldManager. Each world is
-- an independent simulation with its own game loop, entities,
-- and access control.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE worlds (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL UNIQUE CHECK (char_length(name) BETWEEN 2 AND 48),
  created_by      UUID NOT NULL REFERENCES players(id),
  status          TEXT NOT NULL DEFAULT 'stopped' CHECK (status IN ('running', 'paused', 'stopped')),
  access_type     TEXT NOT NULL DEFAULT 'public' CHECK (access_type IN ('public', 'password', 'invite')),
  password_hash   TEXT,
  max_players     INTEGER NOT NULL DEFAULT 30 CHECK (max_players BETWEEN 1 AND 100),
  world_size      INTEGER NOT NULL DEFAULT 500 CHECK (world_size BETWEEN 100 AND 2000),
  sim_tps         INTEGER NOT NULL DEFAULT 40 CHECK (sim_tps BETWEEN 10 AND 200),
  description     TEXT NOT NULL DEFAULT '' CHECK (char_length(description) <= 500),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  entropy_half_life INTEGER NOT NULL DEFAULT 72
    CHECK (entropy_half_life BETWEEN 24 AND 168)
);

CREATE INDEX idx_worlds_status ON worlds (status);

CREATE TRIGGER worlds_updated_at
  BEFORE UPDATE ON worlds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
