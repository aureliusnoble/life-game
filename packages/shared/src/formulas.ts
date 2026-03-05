import { STAT_RANGES, TOTAL_BP, FOUNDER_BP_COST, BRAIN_HIDDEN_NODE_BP, BRAIN_SYNAPSE_BP } from './constants.js';
import type { BiomeType } from './enums.js';

// ── BP Cost Formulas ──

/** Compute BP cost for a single body stat */
export function computeStatBPCost(stat: string, value: number): number {
  switch (stat) {
    case 'sizeRatio':
      return 10 * value * value;
    case 'speedRatio':
      return 10 * value;
    case 'strength':
      return 6 * value;
    case 'defense':
      return 6 * value;
    case 'viewAngle':
      return value / 45;
    case 'viewRadius':
      return 2 * value;
    case 'stomachMultiplier':
      return 6 * value;
    // Free stats: diet, metabolism, growthSpeed
    case 'diet':
    case 'metabolism':
    case 'growthSpeed':
      return 0;
    default:
      return 0;
  }
}

/** Body genes interface for BP calculation */
export interface BodyGenesForBP {
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
}

/** Compute total body BP cost */
export function computeBodyBPCost(body: BodyGenesForBP): number {
  let total = 0;
  for (const [stat, value] of Object.entries(body)) {
    if (stat in STAT_RANGES) {
      total += computeStatBPCost(stat, value);
    }
  }
  return total;
}

/** Brain config for BP calculation */
export interface BrainConfigForBP {
  hiddenNodeCount: number;
  synapseCount: number;
}

/** Compute brain BP cost */
export function computeBrainBPCost(brain: BrainConfigForBP): number {
  return brain.hiddenNodeCount * BRAIN_HIDDEN_NODE_BP + brain.synapseCount * BRAIN_SYNAPSE_BP;
}

/** Compute founder BP cost */
export function computeFounderBPCost(founderCount: number): number {
  return Math.max(0, (founderCount - 1)) * FOUNDER_BP_COST;
}

/**
 * Compute biome crowding BP cost.
 * biomeShare = organismsInTargetBiome / totalOrganismsInWorld
 * biomeBPCost = floor(max(0, (biomeShare - 0.15) * 40))
 * Random biome or world < 50 organisms: always 0
 */
export function computeBiomeBPCost(
  biome: BiomeType | null,
  worldState?: { biomePopulations: Record<number, number>; totalPopulation: number },
): number {
  if (biome === null || !worldState || worldState.totalPopulation < 50) {
    return 0;
  }
  const biomePopulation = worldState.biomePopulations[biome] ?? 0;
  const biomeShare = biomePopulation / worldState.totalPopulation;
  return Math.floor(Math.max(0, (biomeShare - 0.15) * 40));
}

/** Full design interface for total BP calculation */
export interface DesignForBP {
  body: BodyGenesForBP;
  brain: BrainConfigForBP;
  founderCount: number;
  targetBiome: BiomeType | null;
  traitBPCost: number; // pre-computed sum of unlockable trait costs
}

/** Compute total BP and breakdown */
export interface BPBreakdown {
  body: number;
  brain: number;
  traits: number;
  founders: number;
  biome: number;
  total: number;
  remaining: number;
}

export function computeTotalBP(
  design: DesignForBP,
  worldState?: { biomePopulations: Record<number, number>; totalPopulation: number },
): BPBreakdown {
  const body = computeBodyBPCost(design.body);
  const brain = computeBrainBPCost(design.brain);
  const founders = computeFounderBPCost(design.founderCount);
  const biome = computeBiomeBPCost(design.targetBiome, worldState);
  const traits = design.traitBPCost;
  const total = body + brain + traits + founders + biome;

  return {
    body,
    brain,
    traits,
    founders,
    biome,
    total,
    remaining: TOTAL_BP - total,
  };
}

// ── Color Formulas ──

export interface HSLColor {
  h: number;
  s: number;
  l: number;
}

/**
 * Compute organism body color from diet and metabolism.
 * hue = 120 - diet * 120 (green → yellow → red)
 * saturation = 55 + metabolism * 10
 */
export function dietColor(diet: number, metabolism: number = 1.0): HSLColor {
  return {
    h: 120 - diet * 120,
    s: 55 + metabolism * 10,
    l: 50,
  };
}

// ── Physics Formulas ──

/** Defense damage reduction (diminishing returns, never 100%) */
export function defenseDamageReduction(defense: number): number {
  return 1 - 1 / (1 + defense / 10);
}

/** Defense speed penalty: -2% per DEF point */
export function defenseSpeedPenalty(defense: number): number {
  return defense * 0.02;
}

// ── Day/Night ──

/** Compute light level from day phase (0-1). Returns 0 (midnight) to 1 (noon). */
export function computeLight(dayPhase: number): number {
  return (Math.sin((dayPhase - 0.25) * 2 * Math.PI) + 1) / 2;
}

/** View radius multiplier from light level */
export function viewRadiusFromLight(light: number): number {
  return 0.6 + 0.4 * light;
}

/** Plant growth multiplier from light level */
export function plantGrowthFromLight(light: number): number {
  return 0.7 + 0.3 * light;
}

// ── Entropy ──

/** Species entropy multiplier based on hours since deployment */
export function computeEntropyMultiplier(hoursActive: number, halfLife: number): number {
  return 1.0 + (hoursActive / halfLife) ** 2;
}

// ── Stat Validation ──

/** Clamp a stat value to its valid range */
export function clampStat(stat: string, value: number): number {
  const range = STAT_RANGES[stat as keyof typeof STAT_RANGES];
  if (!range) return value;
  return Math.max(range.min, Math.min(range.max, value));
}

/** Check if a stat value is within range */
export function isStatInRange(stat: string, value: number): boolean {
  const range = STAT_RANGES[stat as keyof typeof STAT_RANGES];
  if (!range) return false;
  return value >= range.min && value <= range.max;
}
