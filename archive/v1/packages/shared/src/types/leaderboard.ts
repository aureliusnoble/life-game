/** Leaderboard entry (persisted in leaderboard_scores table) */
export interface LeaderboardEntry {
  id: string; // UUID
  worldId: string;
  speciesId: string;
  playerId: string | null; // null for AI
  speciesName: string;
  isAi: boolean;
  dominanceScore: number;
  biomassShare: number;
  populationShare: number;
  territoryCoverage: number;
  lineageDepth: number;
  keystoneBonus: number;
  updatedAt: string;
}

/** Dominance score breakdown */
export interface DominanceBreakdown {
  biomassShare: number;
  populationShare: number;
  territoryCoverage: number;
  lineageDepth: number;
  keystoneBonus: number;
  total: number;
}
