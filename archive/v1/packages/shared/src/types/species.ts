import type { BiomeType, ReproductionMode } from '../enums.js';
import { TraitId } from '../enums.js';
import type { BodyGenes } from './organism.js';
import type { BrainConfig } from './brain.js';

/** Trait configuration for a species design */
export interface TraitConfig {
  armorPlating?: {
    tier: 1 | 2 | 3; // light / medium / heavy
    direction: 'front' | 'back';
  };
  venomGlands?: boolean;
  immuneSystem?: {
    strength: number; // 0.0 - 1.0
  };
  echolocation?: {
    range: number; // 0.3 - 0.8
    precision: 'low' | 'high';
    frequency: number; // 0.25 - 1.0
  };
  burrowing?: boolean;
  camouflage?: {
    strength: number; // 0.3 - 0.8
  };
  fatReserves?: {
    tier: 1 | 2 | 3 | 4; // 50/100/150/200 energy
  };
  sporeDispersal?: {
    maxRange: number; // 3 - 30 units
  };
  herdCoordination?: boolean;
  sexualReproduction?: {
    founderSexRatio: number; // 0.10 - 0.90
  };
  encounterInfoSharing?: boolean;
  nestAffinity?: {
    strength: number; // 0.0 - 1.0
  };
}

/** Deployment configuration for a species design */
export interface DeploymentConfig {
  biome: BiomeType | null; // null = random
  founderCount: number; // 1 - 10
}

/** Complete species design (persisted in species_designs table) */
export interface SpeciesDesign {
  id: string; // UUID
  playerId: string; // FK to players.id
  speciesName: string; // 2-24 chars
  version: number; // auto-incremented

  body: BodyGenes;
  traits: TraitConfig;
  brain: BrainConfig;
  deployment: DeploymentConfig;
  reproductionMode: ReproductionMode;

  bpTotal: number; // must be <= 100
  isActive: boolean;
  createdAt: string; // ISO timestamp
  updatedAt: string;
}

/** Active species state (persisted in active_species table) */
export interface ActiveSpecies {
  id: string; // UUID
  worldId: string;
  designId: string | null; // null for AI
  playerId: string | null; // null for AI
  isAi: boolean;
  speciesName: string;
  deployedAt: string;
  retiredAt: string | null;
  endReason: 'extinct' | 'retired' | null;
  populationCount: number;
  generationMax: number;
  dominanceScore: number;
  entropyMultiplier: number;
  templateGenes: Record<string, number>;

  // Peaks
  peakPopulation: number;
  peakDominance: number;
  peakDominanceRank: number | null;
  peakTerritory: number;
  peakBiomass: number;
  lifetimeStats: LifetimeStats | null;
}

/** Lifetime statistics for an active species */
export interface LifetimeStats {
  totalBorn: number;
  totalDied: number;
  totalKills: number;
  totalFoodEaten: number;
  totalEnergyHarvested: number;
  avgLifespan: number;
  maxLifespan: number;
  maxGeneration: number;
}

/** Trait ID to unlock tier mapping */
export const TRAIT_UNLOCK_TIERS: Record<TraitId, number> = {
  [TraitId.ArmorPlating]: 2,
  [TraitId.VenomGlands]: 2,
  [TraitId.ImmuneSystem]: 1, // no tier requirement
  [TraitId.Echolocation]: 2,
  [TraitId.Burrowing]: 3,
  [TraitId.Camouflage]: 3,
  [TraitId.FatReserves]: 3,
  [TraitId.SporeDispersal]: 3,
  [TraitId.HerdCoordination]: 3,
  [TraitId.SexualReproduction]: 3,
  [TraitId.EncounterInfoSharing]: 4,
};
