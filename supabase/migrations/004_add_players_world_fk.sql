-- ═══════════════════════════════════════════════════════════
-- Resolve circular dependency: players.current_world_id → worlds(id)
-- Players table was created in 002 without this FK because
-- worlds references players(id) via created_by.
-- ═══════════════════════════════════════════════════════════

ALTER TABLE players
  ADD CONSTRAINT fk_players_current_world
  FOREIGN KEY (current_world_id) REFERENCES worlds(id) ON DELETE SET NULL;
