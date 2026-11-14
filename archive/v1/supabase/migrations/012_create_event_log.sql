-- ═══════════════════════════════════════════════════════════
-- Table: event_log
-- World and player events for history/timeline view.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE event_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id    UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL,
  event_scope TEXT NOT NULL DEFAULT 'world'
    CHECK (event_scope IN ('world', 'player', 'species')),
  player_id   UUID REFERENCES players(id) ON DELETE SET NULL,
  species_id  UUID REFERENCES active_species(id) ON DELETE SET NULL,
  payload     JSONB NOT NULL DEFAULT '{}'::jsonb,
  tick        BIGINT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_scope ON event_log (event_scope, created_at DESC);
CREATE INDEX idx_events_player ON event_log (player_id, created_at DESC)
  WHERE player_id IS NOT NULL;
CREATE INDEX idx_events_species ON event_log (species_id, created_at DESC)
  WHERE species_id IS NOT NULL;
CREATE INDEX idx_events_type ON event_log (event_type, created_at DESC);
CREATE INDEX idx_events_created_at ON event_log (created_at DESC);
CREATE INDEX idx_event_log_world ON event_log (world_id);
