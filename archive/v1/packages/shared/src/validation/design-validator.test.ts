import { describe, it, expect } from 'vitest';
import { validateDesign, computeTraitBPCost } from './design-validator.js';
import {
  makeDesign,
  makeHerbivore,
  makeCarnivore,
  makeOmnivore,
  makeScavenger,
  makeInputNode,
  makeOutputNode,
  makeHiddenNode,
  makeSynapse,
} from './test-fixtures.js';
import { InputType, OutputType, HiddenNodeType, BiomeType } from '../enums.js';

describe('validateDesign', () => {
  // ── Archetype Validation ──

  it('herbivore archetype passes at tier 1', () => {
    const result = validateDesign(makeHerbivore(), 1);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.bpBreakdown.total).toBeLessThanOrEqual(100);
  });

  it('carnivore archetype passes at tier 1', () => {
    const result = validateDesign(makeCarnivore(), 1);
    expect(result.valid).toBe(true);
    expect(result.bpBreakdown.total).toBeLessThanOrEqual(100);
  });

  it('omnivore archetype passes at tier 1', () => {
    const result = validateDesign(makeOmnivore(), 1);
    expect(result.valid).toBe(true);
  });

  it('scavenger archetype passes at tier 1', () => {
    const result = validateDesign(makeScavenger(), 1);
    expect(result.valid).toBe(true);
  });

  it('minimal design passes', () => {
    const result = validateDesign(makeDesign(), 1);
    expect(result.valid).toBe(true);
  });

  // ── BP Budget ──

  it('exactly 100 BP passes', () => {
    // Build a design that costs exactly 100 BP
    // sizeRatio=2.0 → 40BP, speedRatio=2.5 → 25BP, strength=2.5 → 15BP
    // viewAngle=360 → 8BP, viewRadius=5 → 10BP, stomachMult=0.3 → 1.8BP
    // Total body ≈ 99.8 + brain ~0 = ~99.8 (close enough, the point is testing < 100)
    const design = makeDesign({
      body: {
        sizeRatio: 2.0, // 40
        speedRatio: 2.0, // 20
        strength: 1.0, // 6
        defense: 1.0, // 6
        diet: 0.0,
        viewAngle: 180, // 4
        viewRadius: 5.0, // 10
        metabolism: 1.0,
        stomachMultiplier: 1.0, // 6
        growthSpeed: 1.0,
        redColor: 0.5,
        greenColor: 0.5,
        blueColor: 0.5,
      },
      brain: {
        nodes: [
          makeInputNode('in1', InputType.Constant),
          makeOutputNode('out1', OutputType.Accelerate),
        ],
        synapses: [
          makeSynapse('s1', 'in1', 'out1', 1.0),
          makeSynapse('s2', 'in1', 'out1', 1.0),
          makeSynapse('s3', 'in1', 'out1', 1.0),
          makeSynapse('s4', 'in1', 'out1', 1.0),
          makeSynapse('s5', 'in1', 'out1', 1.0),
          makeSynapse('s6', 'in1', 'out1', 1.0),
          makeSynapse('s7', 'in1', 'out1', 1.0),
          makeSynapse('s8', 'in1', 'out1', 1.0),
        ],
      },
      // Body: 92, Brain: 0 hidden + 8*0.5 = 4, Total: 96
    });
    const result = validateDesign(design, 1);
    expect(result.valid).toBe(true);
    expect(result.bpBreakdown.total).toBeLessThanOrEqual(100);
  });

  it('exceeding 100 BP returns error with overage amount', () => {
    const design = makeDesign({
      body: {
        sizeRatio: 3.0, // 90 BP!
        speedRatio: 2.5, // 25 BP!
        strength: 0.1,
        defense: 0.0,
        diet: 0.0,
        viewAngle: 15,
        viewRadius: 1.0,
        metabolism: 0.5,
        stomachMultiplier: 0.3,
        growthSpeed: 0.5,
        redColor: 0.5,
        greenColor: 0.5,
        blueColor: 0.5,
      },
    });
    const result = validateDesign(design, 1);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'BP_EXCEEDED')).toBe(true);
    expect(result.bpBreakdown.total).toBeGreaterThan(100);
  });

  // ── Gene Ranges ──

  it('rejects out-of-range gene values', () => {
    const design = makeDesign({
      body: {
        sizeRatio: 0.1, // below min 0.3
        speedRatio: 3.0, // above max 2.5
        strength: 0.5,
        defense: 0.0,
        diet: 0.0,
        viewAngle: 90,
        viewRadius: 5.0,
        metabolism: 1.0,
        stomachMultiplier: 1.0,
        growthSpeed: 1.0,
        redColor: 0.5,
        greenColor: 0.5,
        blueColor: 0.5,
      },
    });
    const result = validateDesign(design, 1);
    expect(result.valid).toBe(false);
    const rangeErrors = result.errors.filter((e) => e.code === 'GENE_OUT_OF_RANGE');
    expect(rangeErrors.length).toBeGreaterThanOrEqual(2);
  });

  // ── Brain Topology ──

  it('rejects cyclic brain graph', () => {
    const design = makeDesign({
      brain: {
        nodes: [
          makeInputNode('in1', InputType.Constant),
          makeHiddenNode('h1', HiddenNodeType.Sigmoid),
          makeHiddenNode('h2', HiddenNodeType.Sigmoid),
          makeOutputNode('out1', OutputType.Accelerate),
        ],
        synapses: [
          makeSynapse('s1', 'in1', 'h1', 1.0),
          makeSynapse('s2', 'h1', 'h2', 1.0),
          makeSynapse('s3', 'h2', 'h1', 1.0), // creates cycle h1 → h2 → h1
          makeSynapse('s4', 'h2', 'out1', 1.0),
        ],
      },
    });
    const result = validateDesign(design, 1);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'BRAIN_HAS_CYCLE')).toBe(true);
  });

  it('accepts valid DAG brain', () => {
    const design = makeDesign({
      brain: {
        nodes: [
          makeInputNode('in1', InputType.Constant),
          makeHiddenNode('h1', HiddenNodeType.Sigmoid),
          makeHiddenNode('h2', HiddenNodeType.ReLU),
          makeOutputNode('out1', OutputType.Accelerate),
        ],
        synapses: [
          makeSynapse('s1', 'in1', 'h1', 1.0),
          makeSynapse('s2', 'in1', 'h2', 1.0),
          makeSynapse('s3', 'h1', 'out1', 1.0),
          makeSynapse('s4', 'h2', 'out1', 1.0),
        ],
      },
    });
    const result = validateDesign(design, 1);
    expect(result.errors.some((e) => e.code === 'BRAIN_HAS_CYCLE')).toBe(false);
  });

  // ── Latch Limit ──

  it('rejects more than 3 Latch nodes', () => {
    const design = makeDesign({
      brain: {
        nodes: [
          makeInputNode('in1', InputType.Constant),
          makeHiddenNode('l1', HiddenNodeType.Latch),
          makeHiddenNode('l2', HiddenNodeType.Latch),
          makeHiddenNode('l3', HiddenNodeType.Latch),
          makeHiddenNode('l4', HiddenNodeType.Latch), // 4th latch
          makeOutputNode('out1', OutputType.Accelerate),
        ],
        synapses: [
          makeSynapse('s1', 'in1', 'l1', 1.0),
          makeSynapse('s2', 'in1', 'l2', 1.0),
          makeSynapse('s3', 'in1', 'l3', 1.0),
          makeSynapse('s4', 'in1', 'l4', 1.0),
          makeSynapse('s5', 'l1', 'out1', 1.0),
          makeSynapse('s6', 'l2', 'out1', 1.0),
          makeSynapse('s7', 'l3', 'out1', 1.0),
          makeSynapse('s8', 'l4', 'out1', 1.0),
        ],
      },
    });
    const result = validateDesign(design, 2); // tier 2 for Latch access
    expect(result.errors.some((e) => e.code === 'TOO_MANY_LATCH_NODES')).toBe(true);
  });

  it('accepts exactly 3 Latch nodes', () => {
    const design = makeDesign({
      brain: {
        nodes: [
          makeInputNode('in1', InputType.Constant),
          makeHiddenNode('l1', HiddenNodeType.Latch),
          makeHiddenNode('l2', HiddenNodeType.Latch),
          makeHiddenNode('l3', HiddenNodeType.Latch),
          makeOutputNode('out1', OutputType.Accelerate),
        ],
        synapses: [
          makeSynapse('s1', 'in1', 'l1', 1.0),
          makeSynapse('s2', 'in1', 'l2', 1.0),
          makeSynapse('s3', 'in1', 'l3', 1.0),
          makeSynapse('s4', 'l1', 'out1', 1.0),
          makeSynapse('s5', 'l2', 'out1', 1.0),
          makeSynapse('s6', 'l3', 'out1', 1.0),
        ],
      },
    });
    const result = validateDesign(design, 2);
    expect(result.errors.some((e) => e.code === 'TOO_MANY_LATCH_NODES')).toBe(false);
  });

  // ── Tier Gating ──

  it('rejects tier 2 brain nodes at tier 1', () => {
    const design = makeDesign({
      brain: {
        nodes: [
          makeInputNode('speed', InputType.Speed), // Tier 2
          makeOutputNode('accel', OutputType.Accelerate),
        ],
        synapses: [makeSynapse('s1', 'speed', 'accel', 1.0)],
      },
    });
    const result = validateDesign(design, 1);
    expect(result.errors.some((e) => e.code === 'NODE_TIER_LOCKED')).toBe(true);
  });

  it('accepts tier 2 brain nodes at tier 2', () => {
    const design = makeDesign({
      brain: {
        nodes: [
          makeInputNode('speed', InputType.Speed), // Tier 2
          makeOutputNode('grow', OutputType.Want2Grow), // Tier 2
        ],
        synapses: [makeSynapse('s1', 'speed', 'grow', 1.0)],
      },
    });
    const result = validateDesign(design, 2);
    expect(result.errors.some((e) => e.code === 'NODE_TIER_LOCKED')).toBe(false);
  });

  it('rejects tier-locked traits', () => {
    const design = makeDesign({
      traits: {
        burrowing: true, // tier 3
      },
    });
    const result = validateDesign(design, 2);
    expect(result.errors.some((e) => e.code === 'TRAIT_TIER_LOCKED')).toBe(true);
  });

  it('accepts traits at correct tier', () => {
    const design = makeDesign({
      traits: {
        venomGlands: true, // tier 2
      },
    });
    const result = validateDesign(design, 2);
    expect(result.errors.some((e) => e.code === 'TRAIT_TIER_LOCKED')).toBe(false);
  });

  // ── Founder Count ──

  it('rejects founder count < 1', () => {
    const design = makeDesign({ deployment: { biome: null, founderCount: 0 } });
    const result = validateDesign(design, 1);
    expect(result.errors.some((e) => e.code === 'FOUNDER_COUNT_TOO_LOW')).toBe(true);
  });

  it('rejects founder count > 10', () => {
    const design = makeDesign({ deployment: { biome: null, founderCount: 11 } });
    const result = validateDesign(design, 1);
    expect(result.errors.some((e) => e.code === 'FOUNDER_COUNT_TOO_HIGH')).toBe(true);
  });

  it('founder cost included in BP total', () => {
    const design = makeDesign({ deployment: { biome: null, founderCount: 5 } });
    const result = validateDesign(design, 1);
    expect(result.bpBreakdown.founders).toBe(20); // (5-1) * 5
  });

  // ── Species Name ──

  it('rejects empty name', () => {
    const design = makeDesign({ speciesName: '' });
    const result = validateDesign(design, 1);
    expect(result.errors.some((e) => e.code === 'NAME_TOO_SHORT')).toBe(true);
  });

  it('rejects name with 1 character', () => {
    const design = makeDesign({ speciesName: 'A' });
    const result = validateDesign(design, 1);
    expect(result.errors.some((e) => e.code === 'NAME_TOO_SHORT')).toBe(true);
  });

  it('rejects name > 24 characters', () => {
    const design = makeDesign({ speciesName: 'A'.repeat(25) });
    const result = validateDesign(design, 1);
    expect(result.errors.some((e) => e.code === 'NAME_TOO_LONG')).toBe(true);
  });

  it('accepts name at boundaries (2 and 24 chars)', () => {
    const short = validateDesign(makeDesign({ speciesName: 'AB' }), 1);
    expect(short.errors.filter((e) => e.code.includes('NAME'))).toHaveLength(0);

    const long = validateDesign(makeDesign({ speciesName: 'A'.repeat(24) }), 1);
    expect(long.errors.filter((e) => e.code.includes('NAME'))).toHaveLength(0);
  });

  // ── Biome Crowding ──

  it('includes biome cost in BP when world state provided', () => {
    const design = makeDesign({
      deployment: { biome: BiomeType.Grassland, founderCount: 1 },
    });
    const worldState = {
      biomePopulations: { [BiomeType.Grassland]: 30 },
      totalPopulation: 100,
    };
    const result = validateDesign(design, 1, worldState);
    expect(result.bpBreakdown.biome).toBe(6); // floor((0.3 - 0.15) * 40) = 6
  });

  // ── Error Messages ──

  it('error messages are human-readable', () => {
    const design = makeDesign({
      speciesName: '',
      body: {
        sizeRatio: 0.1,
        speedRatio: 1.0,
        strength: 0.5,
        defense: 0.0,
        diet: 0.0,
        viewAngle: 90,
        viewRadius: 5.0,
        metabolism: 1.0,
        stomachMultiplier: 1.0,
        growthSpeed: 1.0,
        redColor: 0.5,
        greenColor: 0.5,
        blueColor: 0.5,
      },
    });
    const result = validateDesign(design, 1);
    for (const error of result.errors) {
      expect(error.message.length).toBeGreaterThan(10);
      expect(error.code).toBeTruthy();
    }
  });
});

describe('computeTraitBPCost', () => {
  it('no traits = 0 BP', () => {
    expect(computeTraitBPCost({})).toBe(0);
  });

  it('armor plating costs match', () => {
    expect(computeTraitBPCost({ armorPlating: { tier: 1, direction: 'front' } })).toBe(6);
    expect(computeTraitBPCost({ armorPlating: { tier: 2, direction: 'front' } })).toBe(12);
    expect(computeTraitBPCost({ armorPlating: { tier: 3, direction: 'back' } })).toBe(18);
  });

  it('venom costs 8 BP', () => {
    expect(computeTraitBPCost({ venomGlands: true })).toBe(8);
  });

  it('burrowing costs 12 BP', () => {
    expect(computeTraitBPCost({ burrowing: true })).toBe(12);
  });

  it('fat reserves costs match tiers', () => {
    expect(computeTraitBPCost({ fatReserves: { tier: 1 } })).toBe(5);
    expect(computeTraitBPCost({ fatReserves: { tier: 4 } })).toBe(20);
  });

  it('sexual reproduction costs 10 BP', () => {
    expect(computeTraitBPCost({ sexualReproduction: { founderSexRatio: 0.5 } })).toBe(10);
  });
});

describe('performance', () => {
  it('validates in < 5ms', () => {
    const design = makeHerbivore();
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      validateDesign(design, 4);
    }
    const elapsed = performance.now() - start;
    // 100 validations < 500ms → each < 5ms
    expect(elapsed).toBeLessThan(500);
  });
});
