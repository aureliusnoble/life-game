import {
  STAT_RANGES,
  TOTAL_BP,
  FOUNDER_COUNT_MIN,
  FOUNDER_COUNT_MAX,
  SPECIES_NAME_MIN_LENGTH,
  SPECIES_NAME_MAX_LENGTH,
  MAX_LATCH_NODES,
  BRAIN_HIDDEN_NODE_BP,
  BRAIN_SYNAPSE_BP,
  FOUNDER_BP_COST,
} from '../constants.js';
import {
  HiddenNodeType,
  TraitId,
  INPUT_TIERS,
  OUTPUT_TIERS,
  HIDDEN_NODE_TIERS,
} from '../enums.js';
import type { InputType, OutputType, BiomeType } from '../enums.js';
import { computeBodyBPCost, computeBiomeBPCost } from '../formulas.js';
import type { BodyGenes } from '../types/organism.js';
import type { SpeciesDesign } from '../types/species.js';
import { TRAIT_UNLOCK_TIERS } from '../types/species.js';
import type { BrainNode, Synapse } from '../types/brain.js';
import type { TraitConfig } from '../types/species.js';

// ── Result Types ──

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  bpBreakdown: {
    body: number;
    brain: number;
    traits: number;
    founders: number;
    biome: number;
    total: number;
    remaining: number;
  };
}

// ── Main Validator ──

export function validateDesign(
  design: SpeciesDesign,
  playerTier: number,
  worldState?: { biomePopulations: Record<number, number>; totalPopulation: number },
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // 1. Species name
  validateSpeciesName(design.speciesName, errors);

  // 2. Gene ranges
  validateGeneRanges(design.body, errors);

  // 3. Brain topology
  validateBrainTopology(design.brain.nodes, design.brain.synapses, errors);

  // 4. Latch node limit
  validateLatchLimit(design.brain.nodes, errors);

  // 5. Tier gating for brain nodes
  validateBrainNodeTiers(design.brain.nodes, playerTier, errors);

  // 6. Trait tier prerequisites
  validateTraitTiers(design.traits, playerTier, errors);

  // 7. Founder count
  validateFounderCount(design.deployment.founderCount, errors);

  // 8. Compute BP breakdown
  const bodyCost = computeBodyBPCost(design.body);
  const hiddenCount = design.brain.nodes.filter((n) => n.type === 'hidden').length;
  const synapseCount = design.brain.synapses.filter((s) => s.enabled).length;
  const brainCost = hiddenCount * BRAIN_HIDDEN_NODE_BP + synapseCount * BRAIN_SYNAPSE_BP;
  const traitsCost = computeTraitBPCost(design.traits);
  const foundersCost = Math.max(0, design.deployment.founderCount - 1) * FOUNDER_BP_COST;
  const biomeCost = computeBiomeBPCost(design.deployment.biome, worldState);

  const totalCost = bodyCost + brainCost + traitsCost + foundersCost + biomeCost;
  const remaining = TOTAL_BP - totalCost;

  // 9. BP budget check
  if (totalCost > TOTAL_BP) {
    errors.push({
      code: 'BP_EXCEEDED',
      message: `Total BP cost is ${totalCost.toFixed(1)}, exceeding budget of ${TOTAL_BP} by ${(totalCost - TOTAL_BP).toFixed(1)} BP`,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    bpBreakdown: {
      body: bodyCost,
      brain: brainCost,
      traits: traitsCost,
      founders: foundersCost,
      biome: biomeCost,
      total: totalCost,
      remaining,
    },
  };
}

// ── Validation Helpers ──

function validateSpeciesName(name: string, errors: ValidationError[]): void {
  if (name.length < SPECIES_NAME_MIN_LENGTH) {
    errors.push({
      code: 'NAME_TOO_SHORT',
      message: `Species name must be at least ${SPECIES_NAME_MIN_LENGTH} characters`,
      field: 'speciesName',
    });
  }
  if (name.length > SPECIES_NAME_MAX_LENGTH) {
    errors.push({
      code: 'NAME_TOO_LONG',
      message: `Species name must be at most ${SPECIES_NAME_MAX_LENGTH} characters`,
      field: 'speciesName',
    });
  }
}

function validateGeneRanges(
  body: BodyGenes,
  errors: ValidationError[],
): void {
  const bodyRecord = body as unknown as Record<string, number>;
  for (const [stat, range] of Object.entries(STAT_RANGES)) {
    const value = bodyRecord[stat];
    if (value === undefined) continue;
    if (value < range.min || value > range.max) {
      errors.push({
        code: 'GENE_OUT_OF_RANGE',
        message: `${stat} value ${value} is outside range [${range.min}, ${range.max}]`,
        field: `body.${stat}`,
      });
    }
  }
}

function validateBrainTopology(
  nodes: BrainNode[],
  synapses: Synapse[],
  errors: ValidationError[],
): void {
  const nodeIds = new Set(nodes.map((n) => n.id));

  // Validate synapse endpoints
  for (const syn of synapses) {
    if (!syn.enabled) continue;
    if (!nodeIds.has(syn.from)) {
      errors.push({
        code: 'INVALID_SYNAPSE_SOURCE',
        message: `Synapse references non-existent source node "${syn.from}"`,
        field: 'brain.synapses',
      });
    }
    if (!nodeIds.has(syn.to)) {
      errors.push({
        code: 'INVALID_SYNAPSE_TARGET',
        message: `Synapse references non-existent target node "${syn.to}"`,
        field: 'brain.synapses',
      });
    }
  }

  // Check for cycles using topological sort (Kahn's algorithm)
  if (hasCycle(nodes, synapses.filter((s) => s.enabled))) {
    errors.push({
      code: 'BRAIN_HAS_CYCLE',
      message: 'Brain graph contains a cycle. Brains must be directed acyclic graphs (DAGs).',
      field: 'brain',
    });
  }
}

function hasCycle(nodes: BrainNode[], synapses: Synapse[]): boolean {
  const nodeIds = nodes.map((n) => n.id);
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const id of nodeIds) {
    inDegree.set(id, 0);
    adjacency.set(id, []);
  }

  for (const syn of synapses) {
    if (!inDegree.has(syn.from) || !inDegree.has(syn.to)) continue;
    adjacency.get(syn.from)!.push(syn.to);
    inDegree.set(syn.to, (inDegree.get(syn.to) ?? 0) + 1);
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  let processed = 0;
  while (queue.length > 0) {
    const node = queue.shift()!;
    processed++;
    for (const neighbor of adjacency.get(node) ?? []) {
      const newDeg = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  return processed !== nodeIds.length;
}

function validateLatchLimit(nodes: BrainNode[], errors: ValidationError[]): void {
  const latchCount = nodes.filter(
    (n) => n.type === 'hidden' && n.subtype === HiddenNodeType.Latch,
  ).length;

  if (latchCount > MAX_LATCH_NODES) {
    errors.push({
      code: 'TOO_MANY_LATCH_NODES',
      message: `Brain has ${latchCount} Latch nodes, maximum is ${MAX_LATCH_NODES}`,
      field: 'brain.nodes',
    });
  }
}

function validateBrainNodeTiers(
  nodes: BrainNode[],
  playerTier: number,
  errors: ValidationError[],
): void {
  for (const node of nodes) {
    let requiredTier: number;

    if (node.type === 'input') {
      requiredTier = INPUT_TIERS[node.subtype as InputType] ?? 1;
    } else if (node.type === 'output') {
      requiredTier = OUTPUT_TIERS[node.subtype as OutputType] ?? 1;
    } else if (node.type === 'hidden') {
      requiredTier = HIDDEN_NODE_TIERS[node.subtype as HiddenNodeType] ?? 1;
    } else {
      continue;
    }

    if (requiredTier > playerTier) {
      errors.push({
        code: 'NODE_TIER_LOCKED',
        message: `Brain node "${node.id}" requires tier ${requiredTier}, but player has tier ${playerTier}`,
        field: 'brain.nodes',
      });
    }
  }
}

function validateTraitTiers(
  traits: TraitConfig,
  playerTier: number,
  errors: ValidationError[],
): void {
  const traitChecks: Array<[string, TraitId, unknown]> = [
    ['armorPlating', TraitId.ArmorPlating, traits.armorPlating],
    ['venomGlands', TraitId.VenomGlands, traits.venomGlands],
    ['immuneSystem', TraitId.ImmuneSystem, traits.immuneSystem],
    ['echolocation', TraitId.Echolocation, traits.echolocation],
    ['burrowing', TraitId.Burrowing, traits.burrowing],
    ['camouflage', TraitId.Camouflage, traits.camouflage],
    ['fatReserves', TraitId.FatReserves, traits.fatReserves],
    ['sporeDispersal', TraitId.SporeDispersal, traits.sporeDispersal],
    ['herdCoordination', TraitId.HerdCoordination, traits.herdCoordination],
    ['sexualReproduction', TraitId.SexualReproduction, traits.sexualReproduction],
    ['encounterInfoSharing', TraitId.EncounterInfoSharing, traits.encounterInfoSharing],
  ];

  for (const [name, traitId, value] of traitChecks) {
    if (!value) continue;
    const requiredTier = TRAIT_UNLOCK_TIERS[traitId];
    if (requiredTier > playerTier) {
      errors.push({
        code: 'TRAIT_TIER_LOCKED',
        message: `Trait "${name}" requires tier ${requiredTier}, but player has tier ${playerTier}`,
        field: `traits.${name}`,
      });
    }
  }
}

function validateFounderCount(count: number, errors: ValidationError[]): void {
  if (count < FOUNDER_COUNT_MIN) {
    errors.push({
      code: 'FOUNDER_COUNT_TOO_LOW',
      message: `Founder count must be at least ${FOUNDER_COUNT_MIN}`,
      field: 'deployment.founderCount',
    });
  }
  if (count > FOUNDER_COUNT_MAX) {
    errors.push({
      code: 'FOUNDER_COUNT_TOO_HIGH',
      message: `Founder count must be at most ${FOUNDER_COUNT_MAX}`,
      field: 'deployment.founderCount',
    });
  }
}

// ── Trait BP Cost Computation ──

export function computeTraitBPCost(traits: TraitConfig): number {
  let cost = 0;

  if (traits.armorPlating) {
    const armorCosts = { 1: 6, 2: 12, 3: 18 } as const;
    cost += armorCosts[traits.armorPlating.tier];
  }
  if (traits.venomGlands) cost += 8;
  if (traits.immuneSystem) cost += 4 * traits.immuneSystem.strength;
  if (traits.echolocation) {
    const echo = traits.echolocation;
    cost += 6 + 4 * echo.range;
    if (echo.precision === 'high') cost += 4;
    cost += 4 * echo.frequency;
  }
  if (traits.burrowing) cost += 12;
  if (traits.camouflage) {
    cost += 6 + 6 * traits.camouflage.strength ** 2;
  }
  if (traits.fatReserves) {
    const fatCosts = { 1: 5, 2: 10, 3: 15, 4: 20 } as const;
    cost += fatCosts[traits.fatReserves.tier];
  }
  if (traits.sporeDispersal) {
    cost += 8 + 2 * traits.sporeDispersal.maxRange / 10;
  }
  if (traits.herdCoordination) cost += 7;
  if (traits.sexualReproduction) cost += 10;
  if (traits.encounterInfoSharing) cost += 8;
  if (traits.nestAffinity) cost += 5 * traits.nestAffinity.strength;

  return cost;
}
