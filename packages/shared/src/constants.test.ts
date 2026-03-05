import { describe, it, expect } from 'vitest';
import {
  SIM_TPS,
  TICK_INTERVAL_MS,
  BROADCAST_HZ,
  WORLD_SIZE,
  TOTAL_BP,
  STAT_RANGES,
  BRAIN_HIDDEN_NODE_BP,
  BRAIN_SYNAPSE_BP,
  BIOME_MODIFIERS,
  SEASON_MODIFIERS,
  DOMINANCE_WEIGHTS,
  MATERIAL_PROPERTIES,
} from './constants.js';
import { BiomeType, Season } from './enums.js';

describe('simulation constants', () => {
  it('has correct tick timing', () => {
    expect(SIM_TPS).toBe(40);
    expect(TICK_INTERVAL_MS).toBeCloseTo(25);
    expect(BROADCAST_HZ).toBe(20);
  });

  it('has correct world size', () => {
    expect(WORLD_SIZE).toBe(500);
  });

  it('has correct BP budget', () => {
    expect(TOTAL_BP).toBe(100);
    expect(BRAIN_HIDDEN_NODE_BP).toBe(2);
    expect(BRAIN_SYNAPSE_BP).toBe(0.5);
  });
});

describe('stat ranges', () => {
  it('sizeRatio range is 0.3 to 3.0', () => {
    expect(STAT_RANGES.sizeRatio.min).toBe(0.3);
    expect(STAT_RANGES.sizeRatio.max).toBe(3.0);
    expect(STAT_RANGES.sizeRatio.default).toBe(1.0);
  });

  it('speedRatio range is 0.2 to 2.5', () => {
    expect(STAT_RANGES.speedRatio.min).toBe(0.2);
    expect(STAT_RANGES.speedRatio.max).toBe(2.5);
  });

  it('defense min is 0.0 (can be zero)', () => {
    expect(STAT_RANGES.defense.min).toBe(0.0);
  });

  it('diet, metabolism, growthSpeed are free', () => {
    expect(STAT_RANGES.diet.bpCostFormula).toBe('free');
    expect(STAT_RANGES.metabolism.bpCostFormula).toBe('free');
    expect(STAT_RANGES.growthSpeed.bpCostFormula).toBe('free');
  });

  it('all stat ranges have min < max', () => {
    for (const [_name, range] of Object.entries(STAT_RANGES)) {
      expect(range.min).toBeLessThan(range.max);
      expect(range.default).toBeGreaterThanOrEqual(range.min);
      expect(range.default).toBeLessThanOrEqual(range.max);
    }
  });
});

describe('biome modifiers', () => {
  it('has all 5 biomes', () => {
    expect(Object.keys(BIOME_MODIFIERS)).toHaveLength(5);
  });

  it('grassland is standard 1.0 multipliers', () => {
    const g = BIOME_MODIFIERS[BiomeType.Grassland];
    expect(g.plantDensity).toBe(1.0);
    expect(g.movementCost).toBe(1.0);
    expect(g.visibility).toBe(1.0);
  });

  it('forest has dense food and reduced vision', () => {
    const f = BIOME_MODIFIERS[BiomeType.Forest];
    expect(f.plantDensity).toBe(1.5);
    expect(f.visibility).toBe(0.7);
  });

  it('desert has sparse food and costly movement', () => {
    const d = BIOME_MODIFIERS[BiomeType.Desert];
    expect(d.plantDensity).toBe(0.2);
    expect(d.movementCost).toBe(1.3);
  });
});

describe('season modifiers', () => {
  it('has all 4 seasons', () => {
    expect(Object.keys(SEASON_MODIFIERS)).toHaveLength(4);
  });

  it('winter has lowest plant growth', () => {
    expect(SEASON_MODIFIERS[Season.Winter].plantGrowthMult).toBe(0.4);
    expect(SEASON_MODIFIERS[Season.Winter].metabolismMult).toBe(1.3);
  });

  it('spring has highest plant growth', () => {
    expect(SEASON_MODIFIERS[Season.Spring].plantGrowthMult).toBe(1.2);
  });
});

describe('dominance weights', () => {
  it('weights sum to 1.0', () => {
    const sum = Object.values(DOMINANCE_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0);
  });
});

describe('material properties', () => {
  it('meat has higher energy density than plant', () => {
    expect(MATERIAL_PROPERTIES.meat.energyDensity).toBeGreaterThan(
      MATERIAL_PROPERTIES.plant.energyDensity,
    );
  });

  it('meat max efficiency is 80%', () => {
    expect(MATERIAL_PROPERTIES.meat.maxEfficiency).toBe(0.8);
  });

  it('plant max efficiency is 55%', () => {
    expect(MATERIAL_PROPERTIES.plant.maxEfficiency).toBe(0.55);
  });
});
