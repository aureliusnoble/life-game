import type { PlayerRole } from '../enums.js';

/** Player profile (persisted in players table) */
export interface PlayerProfile {
  id: string; // UUID, FK to auth.users
  displayName: string; // 2-24 chars
  role: PlayerRole;
  evolutionPoints: number;
  unlockedTier: 1 | 2 | 3 | 4;
  achievements: Achievement[];
  mutationTime: string; // HH:MM:SS UTC
  totalGenerations: number;
  totalDeployments: number;
  totalKills: number;
  currentWorldId: string | null;
  onboardingState: OnboardingState | null;
  lastSeen: string; // ISO timestamp
  createdAt: string;
  updatedAt: string;
}

/** Achievement definition */
export interface Achievement {
  id: string;
  name: string;
  condition: string;
  epReward: number;
  unlockedAt: string | null; // ISO timestamp, null if locked
}

/** Onboarding state (persisted in players.onboarding_state JSONB) */
export interface OnboardingState {
  quickStartCompleted: boolean;
  quickStartStep: 0 | 1 | 2 | 3 | 4;
  introductions: Record<
    string,
    {
      seen: boolean;
      completed: boolean;
      seenAt: string;
    }
  >;
  tierUnlocksSeen: number[]; // tier numbers that have been seen
}

/** Achievement definitions (all 18 achievements) */
export const ACHIEVEMENT_DEFINITIONS: ReadonlyArray<{
  id: string;
  name: string;
  condition: string;
  epReward: number;
}> = [
  { id: 'first_steps', name: 'First Steps', condition: 'Deploy first organism', epReward: 10 },
  { id: 'survivor', name: 'Survivor', condition: 'Any organism survives 24h', epReward: 10 },
  { id: 'first_blood', name: 'First Blood', condition: "Kill another player's organism", epReward: 15 },
  { id: 'generational', name: 'Generational', condition: 'Reach generation 10', epReward: 20 },
  { id: 'the_long_game', name: 'The Long Game', condition: 'Reach generation 50', epReward: 50 },
  { id: 'pack_leader', name: 'Pack Leader', condition: '30+ organisms alive', epReward: 20 },
  { id: 'diverse', name: 'Diverse', condition: 'Organisms in 3+ biomes', epReward: 25 },
  { id: 'winter_is_coming', name: 'Winter is Coming', condition: 'Survive full Winter', epReward: 30 },
  { id: 'apex_predator', name: 'Apex Predator', condition: '#1 leaderboard for 1 hour', epReward: 50 },
  { id: 'ecosystem_engineer', name: 'Ecosystem Engineer', condition: '#1 with >15 synapses', epReward: 50 },
  { id: 'comeback', name: 'Comeback', condition: '<5 to >25 without redesign', epReward: 30 },
  { id: 'silent_hunter', name: 'Silent Hunter', condition: 'Kill 10 with camo active', epReward: 25 },
  { id: 'spore_cloud', name: 'Spore Cloud', condition: 'Offspring in 4+ biomes via spore', epReward: 25 },
  { id: 'alarm_system', name: 'Alarm System', condition: '10+ organisms using pheromones', epReward: 20 },
  { id: 'it_takes_two', name: 'It Takes Two', condition: 'Gen 30 with 15+ organisms', epReward: 30 },
  { id: 'social_network', name: 'Social Network', condition: '20+ using pheromones', epReward: 25 },
  { id: 'nest_builder', name: 'Nest Builder', condition: '5+ eggs with 30%+ nest bonus', epReward: 20 },
  { id: 'power_couple', name: 'Power Couple', condition: "Sexual pair's offspring reaches gen 10", epReward: 35 },
] as const;
