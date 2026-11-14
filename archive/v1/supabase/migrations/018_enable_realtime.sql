-- ═══════════════════════════════════════════════════════════
-- Enable Supabase Realtime on tables that push updates to clients.
-- See architecture.md §6.4 step 3.
-- ═══════════════════════════════════════════════════════════

ALTER PUBLICATION supabase_realtime ADD TABLE leaderboard_scores;
ALTER PUBLICATION supabase_realtime ADD TABLE daily_mutations;
ALTER PUBLICATION supabase_realtime ADD TABLE event_log;
