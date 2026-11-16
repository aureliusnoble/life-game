import type { FungusType, EcologicalEventType, BiomeType } from '../enums.js';

/** Pheromone grid state (3 channels, each a flat Float32Array) */
export interface PheromoneGrid {
  resolution: number; // 50x50
  red: Float32Array;
  green: Float32Array;
  blue: Float32Array;
}

/** Server-side fungi patch */
export interface FungiPatch {
  id: number;
  type: FungusType;
  x: number;
  y: number;
  radius: number;
  intensity: number; // [0, 1]
  lifetime: number; // ticks remaining
  maxLifetime: number;
}

/** Ecological event state */
export interface EcologicalEvent {
  type: EcologicalEventType;
  startTick: number;
  endTick: number;
  affectedBiome: BiomeType | null;
  payload: EcologicalEventPayload;
}

/** Event-specific payload */
export type EcologicalEventPayload =
  | BloomPayload
  | DroughtPayload
  | PlaguePayload
  | MigrationPayload
  | FungiOutbreakPayload
  | MeteorPayload
  | NonePayload;

export interface NonePayload {
  type: 'none';
}

export interface BloomPayload {
  type: 'bloom';
  biome: BiomeType;
  plantSpawnMultiplier: number; // 2.0
}

export interface DroughtPayload {
  type: 'drought';
  plantSpawnMultiplier: number; // 0.5
}

export interface PlaguePayload {
  type: 'plague';
  targetSpeciesId: number;
  healthDPS: number;
  spreadRadius: number;
}

export interface MigrationPayload {
  type: 'migration';
  entityIds: number[];
}

export interface FungiOutbreakPayload {
  type: 'fungiOutbreak';
  biome: BiomeType;
  patchCount: number;
}

export interface MeteorPayload {
  type: 'meteor';
  impactX: number;
  impactY: number;
  radius: number;
}
