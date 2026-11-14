import type { BiomeType } from '../enums.js';
import type { CompiledBrain } from './brain.js';

/** Player-facing body genes (design time). Persisted in species_designs.body */
export interface BodyGenes {
  sizeRatio: number; // 0.3 - 3.0
  speedRatio: number; // 0.2 - 2.5
  strength: number; // 0.1 - 5.0
  defense: number; // 0.0 - 4.0
  diet: number; // 0.0 (herbivore) - 1.0 (carnivore)
  viewAngle: number; // 15 - 360 degrees
  viewRadius: number; // 1.0 - 10.0 units
  metabolism: number; // 0.5 - 3.0
  stomachMultiplier: number; // 0.3 - 2.0
  growthSpeed: number; // 0.5 - 2.0
  redColor: number; // 0.0 - 1.0
  greenColor: number; // 0.0 - 1.0
  blueColor: number; // 0.0 - 1.0
}

/** Cached derived values, recomputed when stats change */
export interface DerivedStats {
  size1D: number;
  size2D: number;
  mass: number;
  stomachCapacity: number;
  maxHealth: number;
  maxEnergy: number;
}

/** Full organism genes (includes mutable evolution genes beyond design) */
export interface OrganismGenes {
  // Body genes (from design, mutated)
  sizeRatio: number;
  speedRatio: number;
  strength: number;
  defense: number;
  diet: number;
  viewAngle: number;
  viewRadius: number;
  metabolism: number;
  stomachMultiplier: number;
  growthSpeed: number;
  redColor: number;
  greenColor: number;
  blueColor: number;

  // Reproduction genes
  layTime: number;
  broodTime: number;
  hatchTime: number;
  sex: number; // 0.0=female, 1.0=male (immutable)

  // Biology genes
  growthScale: number;
  growthMaturityFactor: number;
  growthMaturityExponent: number;
  internalClockPeriod: number;
  baseImmuneActivation: number;
  fatStorageThreshold: number;
  fatStorageDeadband: number;
  encounterMemoryDuration: number; // 5-30s
  burrowSpeed: number; // 1.0-2.5s
  burrowEfficiency: number; // 1.5-2.5x
  soundFrequency: number; // 0-1

  // Social genes (herd boid weights)
  herdSeparationWeight: number;
  herdAlignmentWeight: number;
  herdCohesionWeight: number;
  herdVelocityWeight: number;
  herdSeparationDistance: number;

  // Meta-mutation genes
  geneMutationChance: number; // Poisson lambda (~2.0)
  geneMutationVariance: number; // Gaussian sigma (~0.15)
  brainMutationChance: number; // Poisson lambda (~1.5)

  // Brain genes (synapse weights and node biases — mutable)
  synapseWeights: number[];
  nodeBiases: number[];
}

/** Server-side organism state (full simulation entity) */
export interface OrganismState {
  // Identity
  id: number; // u16 entity ID
  speciesId: number; // u16 species slot
  playerId: string; // UUID of owning player (or 'AI')
  generation: number; // generational depth from founder

  // Spatial
  x: number;
  y: number;
  heading: number; // radians [0, 2*PI)
  vx: number;
  vy: number;
  angularVelocity: number;

  // Body stats (from genes)
  sizeRatio: number;
  speedRatio: number;
  strength: number;
  defense: number;
  diet: number;
  viewAngle: number;
  viewRadius: number;
  metabolism: number;
  stomachMultiplier: number;

  // Appearance
  colorR: number;
  colorG: number;
  colorB: number;

  // Derived (cached)
  derived: DerivedStats;

  // Biological state
  health: number;
  energy: number;
  maturity: number; // 0.0 - 1.0
  age: number; // simulation-seconds alive
  stomachPlant: number;
  stomachMeat: number;
  fatStored: number;
  eggProgress: number; // 0.0 - 1.0
  bodyEnergy: number;

  // Status flags
  isEating: boolean;
  isAttacking: boolean;
  isFleeing: boolean;
  isBurrowed: boolean;
  isReproducing: boolean;
  isDead: boolean;
  isGrabbing: boolean;

  // Trait flags
  hasArmorPlating: boolean;
  armorTier: number;
  armorDirection: 'front' | 'back' | null;
  hasVenom: boolean;
  hasEcholocation: boolean;
  hasBurrowing: boolean;
  hasCamouflage: boolean;
  fatReservesTier: number;
  hasSporeDispersal: boolean;
  hasHerdCoordination: boolean;
  hasSexualReproduction: boolean;
  hasEncounterInfoSharing: boolean;

  // Sexual reproduction state
  sex: number;
  matingCooldown: number;

  // Venom state
  venomDPS: number;
  venomTimeRemaining: number;

  // Immune
  immuneStrength: number;

  // Fat reserves
  maxFatCapacity: number;

  // Burrowing state
  burrowCooldown: number;
  burrowSurfaceTimer: number;
  burrowSpeed: number;
  burrowEfficiency: number;

  // Camouflage
  camoBreakTimer: number;
  camoStrength: number;

  // Echolocation
  echoRange: number;
  echoPrecision: boolean;
  echoFrequency: number;

  // Sound
  soundEmitIntensity: number;
  soundEmitFrequency: number;

  // Encounter
  encounterMemoryDuration: number;
  encounterFoodMemory: number;
  encounterThreatMemory: number;

  // Nest
  nestAffinity: number;

  // Growth
  growthSpeed: number;

  // Brain
  brain: CompiledBrain;

  // Genes
  genes: OrganismGenes;

  // Ageing
  ageingFactor: number;
  entropyMultiplier: number;
}

/** Client-side compact entity state (from binary WS) */
export interface OrganismEntity {
  entityId: number;
  entityType: 0x01;
  x: number;
  y: number;
  rotation: number;
  size: number;
  health: number;
  energy: number;
  state: OrganismStateFlags;
  speciesId: number;
  red: number;
  green: number;
  blue: number;
  maturity: number;
  speed: number;
  mouthState: number;
  traits: OrganismTraitFlags;
  fatFill: number;
  venomTimer: number;
  matingCooldown: number;
  herdSize: number;
  eggProgress: number;
}

/** Bitfield: organism state flags (byte 11 in binary protocol) */
export interface OrganismStateFlags {
  eating: boolean;
  attacking: boolean;
  fleeing: boolean;
  burrowed: boolean;
  reproducing: boolean;
  dead: boolean;
  emittingSound: boolean;
  camouflaged: boolean;
}

/** Bitfield: organism trait flags (byte 20 in binary protocol) */
export interface OrganismTraitFlags {
  sex: boolean; // 1=male
  echolocationActive: boolean;
  venomed: boolean;
  aiSpecies: boolean;
  fatReserves: boolean;
  herdBonus: boolean;
  sprouting: boolean;
}

/** Pellet entity (plant or meat) */
export interface PelletEntity {
  entityId: number;
  entityType: 0x02 | 0x03;
  x: number;
  y: number;
  size: number;
  red: number;
  green: number;
  blue: number;
  decay: number;
}

/** Server-side pellet */
export interface PelletState {
  id: number;
  type: 'plant' | 'meat';
  x: number;
  y: number;
  size: number;
  energy: number;
  initialEnergy: number;
  colorR: number;
  colorG: number;
  colorB: number;
  age: number;
  biome: BiomeType;
}

/** Egg entity */
export interface EggEntity {
  entityId: number;
  entityType: 0x04;
  x: number;
  y: number;
  red: number;
  green: number;
  blue: number;
  hatchProgress: number;
  nestBonus: number;
  speciesId: number;
}

/** Server-side egg */
export interface EggState {
  id: number;
  x: number;
  y: number;
  parentId: number;
  speciesId: number;
  playerId: string;
  energy: number;
  hatchTimeRemaining: number;
  genes: OrganismGenes;
  generation: number;
}

/** Fungus entity */
export interface FungusEntity {
  entityId: number;
  entityType: 0x05;
  x: number;
  y: number;
  fungiType: number;
  size: number;
  energy: number;
}

/** Spore entity */
export interface SporeEntity {
  entityId: number;
  entityType: 0x06;
  originX: number;
  originY: number;
  destX: number;
  destY: number;
  red: number;
  green: number;
  blue: number;
  flightProgress: number;
  speciesId: number;
}

/** Union of all client-side entities */
export type Entity =
  | OrganismEntity
  | PelletEntity
  | EggEntity
  | FungusEntity
  | SporeEntity;

/** Type guard helpers */
export function isOrganism(e: Entity): e is OrganismEntity {
  return e.entityType === 0x01;
}

export function isPlantPellet(e: Entity): e is PelletEntity {
  return e.entityType === 0x02;
}

export function isMeatPellet(e: Entity): e is PelletEntity {
  return e.entityType === 0x03;
}

export function isPellet(e: Entity): e is PelletEntity {
  return e.entityType === 0x02 || e.entityType === 0x03;
}

export function isEgg(e: Entity): e is EggEntity {
  return e.entityType === 0x04;
}

export function isFungus(e: Entity): e is FungusEntity {
  return e.entityType === 0x05;
}

export function isSpore(e: Entity): e is SporeEntity {
  return e.entityType === 0x06;
}
