-- ═══════════════════════════════════════════════════════════
-- Row-Level Security Policies
-- ═══════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE worlds ENABLE ROW LEVEL SECURITY;
ALTER TABLE world_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE world_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE world_access_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE species_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_species ENABLE ROW LEVEL SECURITY;
ALTER TABLE world_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_mutations ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE mutation_history ENABLE ROW LEVEL SECURITY;

-- ═══════════ worlds ═══════════

-- All authenticated users can read worlds (for world picker)
CREATE POLICY "worlds_select_all" ON worlds
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can create worlds
CREATE POLICY "worlds_admin_insert" ON worlds
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND role = 'admin')
  );

-- Only admins can update worlds
CREATE POLICY "worlds_admin_update" ON worlds
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND role = 'admin')
  );

-- Only admins can delete worlds
CREATE POLICY "worlds_admin_delete" ON worlds
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND role = 'admin')
  );

-- ═══════════ world_invites ═══════════

-- Invited player can read their own invites; admins can read all
CREATE POLICY "invites_select_own" ON world_invites
  FOR SELECT USING (
    player_id = auth.uid()
    OR EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND role = 'admin')
  );

-- INSERT/UPDATE/DELETE: server-only via service_role

-- ═══════════ world_bans ═══════════

-- Server-only via service_role. Bans checked server-side on JOIN_WORLD.
-- No client-facing policies needed.

-- ═══════════ world_access_grants ═══════════

-- Players can read own grants; server writes via service_role
CREATE POLICY "select_own_grants" ON world_access_grants
  FOR SELECT USING (player_id = auth.uid());

-- ═══════════ players ═══════════

-- Players can read their own profile
CREATE POLICY "players_select_own" ON players
  FOR SELECT USING (auth.uid() = id);

-- Players can update their own profile (display_name, mutation_time, current_world_id)
CREATE POLICY "players_update_own" ON players
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ═══════════ species_designs ═══════════

-- Players can read their own designs (history)
CREATE POLICY "designs_select_own" ON species_designs
  FOR SELECT USING (auth.uid() = player_id);

-- Any authenticated user can read designs for retired/extinct species
CREATE POLICY "designs_select_retired" ON species_designs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM active_species
      WHERE active_species.design_id = species_designs.id
        AND active_species.retired_at IS NOT NULL
    )
  );

-- Players can insert their own designs
CREATE POLICY "designs_insert_own" ON species_designs
  FOR INSERT WITH CHECK (auth.uid() = player_id);

-- Players can deactivate their own designs (set is_active = false)
CREATE POLICY "designs_update_own" ON species_designs
  FOR UPDATE USING (auth.uid() = player_id)
  WITH CHECK (auth.uid() = player_id);

-- ═══════════ active_species ═══════════

-- All authenticated users can read active species (for leaderboard context)
CREATE POLICY "active_species_select_all" ON active_species
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only server writes (service_role). No client INSERT/UPDATE/DELETE policies.

-- ═══════════ world_snapshots ═══════════

-- No client access. Server-only via service_role.

-- ═══════════ leaderboard_scores ═══════════

-- All authenticated users can read leaderboard
CREATE POLICY "leaderboard_select_all" ON leaderboard_scores
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only server writes. No client INSERT/UPDATE/DELETE policies.

-- ═══════════ event_log ═══════════

-- Players can read world-scope events and their own events
CREATE POLICY "events_select_visible" ON event_log
  FOR SELECT USING (
    event_scope = 'world'
    OR player_id = auth.uid()
  );

-- Only server writes. No client INSERT/UPDATE/DELETE policies.

-- ═══════════ daily_mutations ═══════════

-- Players can read their own mutation options
CREATE POLICY "mutations_select_own" ON daily_mutations
  FOR SELECT USING (auth.uid() = player_id);

-- Players can update their own pending mutations (submit selection)
CREATE POLICY "mutations_update_own" ON daily_mutations
  FOR UPDATE USING (
    auth.uid() = player_id
    AND status = 'pending'
  )
  WITH CHECK (
    auth.uid() = player_id
    AND status = 'applied'
    AND selected_option IS NOT NULL
  );

-- ═══════════ player_summaries ═══════════

-- Players can read their own summaries
CREATE POLICY "summaries_select_own" ON player_summaries
  FOR SELECT USING (auth.uid() = player_id);

-- ═══════════ mutation_history ═══════════

-- Players can read their own mutation history
CREATE POLICY "mutation_history_select_own" ON mutation_history
  FOR SELECT USING (auth.uid() = player_id);
