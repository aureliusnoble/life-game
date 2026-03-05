import type { BiomeType, Season, WorldAccessType, WorldStatus } from '../enums.js';

/** World configuration (persisted in worlds table) */
export interface WorldConfig {
  id: string;
  name: string; // 2-48 chars, unique
  createdBy: string; // player UUID
  status: WorldStatus;
  accessType: WorldAccessType;
  passwordHash: string | null;
  maxPlayers: number; // 1-100, default 30
  worldSize: number; // 100-2000, default 500
  simTps: number; // 10-200, default 40
  description: string; // max 500 chars
  entropyHalfLife: number; // 24-168 hours, default 72
  createdAt: string;
  updatedAt: string;
}

/** World summary for world list (client-side) */
export interface WorldSummary {
  id: string;
  name: string;
  status: WorldStatus;
  accessType: WorldAccessType;
  playerCount: number;
  maxPlayers: number;
  season: Season;
  description: string;
  tick: number;
  entityCount: number;
  mySpeciesName?: string;
  mySpeciesPopulation?: number;
}

/** Season state (server-side, for simulation) */
export interface SeasonState {
  season: Season;
  progress: number; // [0, 1) within current season
  dayPhase: number; // [0, 1) within day/night cycle
  seasonCycleRealSeconds: number;
  dayNightCycleRealSeconds: number;
  lastWallTimeMs: number;
}

/** Day/night state */
export interface DayNightState {
  phase: number; // [0, 1) cycle phase
  light: number; // [0, 1] computed light level
  viewRadiusMultiplier: number; // [0.6, 1.0]
  plantGrowthMultiplier: number; // [0.7, 1.0]
}

/** Environment header (8 bytes in binary broadcast) */
export interface EnvironmentHeader {
  season: Season;
  seasonProgress: number; // 0-1
  ambientLight: number; // 0-1
  activeEvent: number; // 0-6
}

/** Biome map grid */
export interface BiomeMap {
  resolution: number;
  data: BiomeType[]; // flat array, resolution^2
}

/** Viewport rectangle sent by client */
export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Energy budget tracking (server-side) */
export interface EnergyBudget {
  total: number;
  inPlants: number;
  inOrganisms: number;
  inMeat: number;
  inEggs: number;
}
