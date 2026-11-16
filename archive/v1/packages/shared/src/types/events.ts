import type { DeathCause, EventScope } from '../enums.js';

/** Game event (persisted in event_log table) */
export interface GameEvent {
  id: string;
  worldId: string;
  eventType: string;
  eventScope: EventScope;
  playerId: string | null;
  speciesId: string | null;
  payload: GameEventPayload;
  tick: number;
  createdAt: string;
}

/** Union of event payloads */
export type GameEventPayload =
  | BirthEventPayload
  | DeathEventPayload
  | DeployEventPayload
  | ExtinctionEventPayload
  | CombatEventPayload
  | ReproductionEventPayload
  | MutationEventPayload
  | EcologicalEventPayload
  | AchievementEventPayload
  | GenericEventPayload;

export interface BirthEventPayload {
  type: 'birth';
  organismId: number;
  parentId: number | null;
  speciesId: number;
  generation: number;
  biome: number;
}

export interface DeathEventPayload {
  type: 'death';
  organismId: number;
  cause: DeathCause;
  speciesId: number;
  age: number;
  generation: number;
  killerId?: number;
}

export interface DeployEventPayload {
  type: 'deploy';
  speciesName: string;
  founderCount: number;
  biome: number;
  bpTotal: number;
}

export interface ExtinctionEventPayload {
  type: 'extinction';
  speciesName: string;
  totalLived: number;
  maxGeneration: number;
  peakPopulation: number;
  lastOrganismAge: number;
}

export interface CombatEventPayload {
  type: 'combat';
  attackerId: number;
  defenderId: number;
  damage: number;
  venomApplied: boolean;
  attackerSpeciesId: number;
  defenderSpeciesId: number;
}

export interface ReproductionEventPayload {
  type: 'reproduction';
  parentId: number;
  eggId: number;
  speciesId: number;
  generation: number;
  isSexual: boolean;
  mateId?: number;
}

export interface MutationEventPayload {
  type: 'mutation';
  speciesId: string;
  geneId: string;
  oldValue: number;
  newValue: number;
  mutationType: 'body' | 'brain' | 'convergent';
}

export interface EcologicalEventPayload {
  type: 'ecological';
  eventType: string;
  affectedBiome: number | null;
  description: string;
}

export interface AchievementEventPayload {
  type: 'achievement';
  achievementId: string;
  achievementName: string;
  epReward: number;
}

export interface GenericEventPayload {
  type: 'generic';
  description: string;
  data?: Record<string, unknown>;
}

/** Mutation option (from daily_mutations.options JSONB) */
export interface MutationOption {
  category: 'body' | 'brain' | 'convergent';
  geneId: string;
  oldValue: number;
  newValue: number;
  changePercent: number;
  fitnessScore: number;
  description: string;
  frequency: number;
  sourceGeneration: number;
}

/** Player summary (from player_summaries.summary JSONB) */
export interface PlayerSummary {
  hoursElapsed: number;
  generationsElapsed: number;
  peakPopulation: number;
  currentPopulation: number;
  extinctionEvents: number;
  topMutations: Array<{ geneId: string; change: number; impact: number }>;
  dominanceChange: number;
  notableEvents: Array<{ type: string; description: string; tick: number }>;
  seasonTransitions: number;
  totalEnergyHarvested: number;
  totalOffspringProduced: number;
}

/** Daily mutations record (from daily_mutations table) */
export interface DailyMutationRecord {
  id: string;
  worldId: string;
  playerId: string;
  speciesId: string;
  options: MutationOption[];
  selectedOption: number | null; // 0-2
  status: 'pending' | 'applied' | 'expired' | 'skipped';
  offeredAt: string;
  expiresAt: string;
}

/** Mutation history record */
export interface MutationHistoryEntry {
  id: string;
  playerId: string;
  speciesId: string;
  mutationType: 'body' | 'brain' | 'convergent';
  geneId: string;
  oldValue: number;
  newValue: number;
  fitnessScore: number;
  createdAt: string;
}
