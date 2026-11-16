import type { Season } from '../enums.js';

/** World snapshot (persisted in world_snapshots table) */
export interface WorldSnapshot {
  id: string;
  worldId: string;
  tick: number;
  createdAt: string;
  snapshot: SnapshotData;
}

/** Inner snapshot data (the JSONB payload) */
export interface SnapshotData {
  metadata: SnapshotMetadata;
  organisms: SnapshotOrganism[];
  pellets: SnapshotPellet[];
  eggs: SnapshotEgg[];
  fungi: SnapshotFungus[];
  spores: SnapshotSpore[];
  pheromoneGrid: SnapshotPheromoneGrid;
  activeSpecies: SnapshotActiveSpecies[];
}

export interface SnapshotMetadata {
  tick: number;
  realTimeMs: number;
  season: Season;
  seasonProgress: number;
  totalEnergy: number;
  freeBiomass: number;
}

export interface SnapshotOrganism {
  id: number;
  speciesId: number;
  playerId: string;
  position: { x: number; y: number };
  heading: number;
  velocity: { x: number; y: number };
  health: number;
  energy: number;
  maturity: number;
  age: number;
  genes: Record<string, number>;
  brainState: number[];
  stomachContents: number;
  fatStored: number;
  eggProgress: number;
  isBurrowed: boolean;
  sex: 0 | 1;
  matingCooldown: number;
  venomTimeRemaining: number;
  venomDPS: number;
  camoBreakTimer: number;
  burrowCooldown: number;
  burrowSurfaceTimer: number;
  soundEmitIntensity: number;
  soundEmitFrequency: number;
  immuneStrength: number;
  encounterMemoryFood: number;
  encounterMemoryThreat: number;
}

export interface SnapshotPellet {
  id: number;
  type: 'plant' | 'meat';
  position: { x: number; y: number };
  size: number;
  energy: number;
}

export interface SnapshotEgg {
  id: number;
  speciesId: number;
  position: { x: number; y: number };
  hatchProgress: number;
  nestBonus: number;
  color: { r: number; g: number; b: number };
}

export interface SnapshotFungus {
  id: number;
  type: string;
  position: { x: number; y: number };
  radius: number;
  energy: number;
}

export interface SnapshotSpore {
  id: number;
  speciesId: number;
  origin: { x: number; y: number };
  destination: { x: number; y: number };
  flightProgress: number;
  color: { r: number; g: number; b: number };
}

export interface SnapshotPheromoneGrid {
  resolution: number;
  channels: {
    red: number[];
    green: number[];
    blue: number[];
  };
}

export interface SnapshotActiveSpecies {
  speciesId: number;
  playerId: string;
  isAi: boolean;
  deployedAt: string;
  populationCount: number;
  generationMax: number;
  entropyMultiplier: number;
  templateGenes: Record<string, number>;
  mutationPool: Array<{
    geneId: string;
    oldValue: number;
    newValue: number;
    fitnessScore: number;
  }>;
}
