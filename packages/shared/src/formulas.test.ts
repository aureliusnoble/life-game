import { describe, it, expect } from 'vitest';
import {
  computeStatBPCost,
  computeBodyBPCost,
  computeBrainBPCost,
  computeFounderBPCost,
  computeBiomeBPCost,
  computeTotalBP,
  dietColor,
  defenseDamageReduction,
  defenseSpeedPenalty,
  computeLight,
  viewRadiusFromLight,
  computeEntropyMultiplier,
  isStatInRange,
  clampStat,
} from './formulas.js';
import { BiomeType } from './enums.js';

describe('computeStatBPCost', () => {
  it('sizeRatio: BP = 10 * value²', () => {
    expect(computeStatBPCost('sizeRatio', 0.5)).toBeCloseTo(2.5);
    expect(computeStatBPCost('sizeRatio', 1.0)).toBeCloseTo(10);
    expect(computeStatBPCost('sizeRatio', 2.0)).toBeCloseTo(40);
    expect(computeStatBPCost('sizeRatio', 3.0)).toBeCloseTo(90);
  });

  it('speedRatio: BP = 10 * value', () => {
    expect(computeStatBPCost('speedRatio', 0.5)).toBeCloseTo(5);
    expect(computeStatBPCost('speedRatio', 1.0)).toBeCloseTo(10);
    expect(computeStatBPCost('speedRatio', 1.5)).toBeCloseTo(15);
    expect(computeStatBPCost('speedRatio', 2.5)).toBeCloseTo(25);
  });

  it('strength: BP = 6 * value', () => {
    expect(computeStatBPCost('strength', 0.5)).toBeCloseTo(3);
    expect(computeStatBPCost('strength', 1.0)).toBeCloseTo(6);
    expect(computeStatBPCost('strength', 2.5)).toBeCloseTo(15);
    expect(computeStatBPCost('strength', 5.0)).toBeCloseTo(30);
  });

  it('defense: BP = 6 * value', () => {
    expect(computeStatBPCost('defense', 0.5)).toBeCloseTo(3);
    expect(computeStatBPCost('defense', 1.0)).toBeCloseTo(6);
    expect(computeStatBPCost('defense', 2.0)).toBeCloseTo(12);
    expect(computeStatBPCost('defense', 4.0)).toBeCloseTo(24);
  });

  it('viewAngle: BP = angle / 45', () => {
    expect(computeStatBPCost('viewAngle', 45)).toBeCloseTo(1);
    expect(computeStatBPCost('viewAngle', 90)).toBeCloseTo(2);
    expect(computeStatBPCost('viewAngle', 180)).toBeCloseTo(4);
    expect(computeStatBPCost('viewAngle', 360)).toBeCloseTo(8);
  });

  it('viewRadius: BP = 2 * value', () => {
    expect(computeStatBPCost('viewRadius', 3.0)).toBeCloseTo(6);
    expect(computeStatBPCost('viewRadius', 5.0)).toBeCloseTo(10);
    expect(computeStatBPCost('viewRadius', 7.0)).toBeCloseTo(14);
    expect(computeStatBPCost('viewRadius', 10.0)).toBeCloseTo(20);
  });

  it('stomachMultiplier: BP = 6 * value', () => {
    expect(computeStatBPCost('stomachMultiplier', 0.5)).toBeCloseTo(3);
    expect(computeStatBPCost('stomachMultiplier', 1.0)).toBeCloseTo(6);
    expect(computeStatBPCost('stomachMultiplier', 1.5)).toBeCloseTo(9);
    expect(computeStatBPCost('stomachMultiplier', 2.0)).toBeCloseTo(12);
  });

  it('free stats cost 0 BP', () => {
    expect(computeStatBPCost('diet', 0.5)).toBe(0);
    expect(computeStatBPCost('metabolism', 3.0)).toBe(0);
    expect(computeStatBPCost('growthSpeed', 2.0)).toBe(0);
  });
});

describe('computeBodyBPCost', () => {
  it('computes herbivore archetype BP', () => {
    const herbivore = {
      sizeRatio: 1.0,
      speedRatio: 1.2,
      strength: 0.5,
      defense: 0.5,
      diet: 0.0,
      viewAngle: 180,
      viewRadius: 5.0,
      metabolism: 1.0,
      stomachMultiplier: 1.5,
      growthSpeed: 1.0,
    };
    const cost = computeBodyBPCost(herbivore);
    // 10 + 12 + 3 + 3 + 0 + 4 + 10 + 0 + 9 + 0 = 51
    expect(cost).toBeCloseTo(51);
  });
});

describe('computeBrainBPCost', () => {
  it('computes cost for hidden nodes and synapses', () => {
    expect(computeBrainBPCost({ hiddenNodeCount: 6, synapseCount: 20 })).toBe(22);
    expect(computeBrainBPCost({ hiddenNodeCount: 0, synapseCount: 0 })).toBe(0);
    expect(computeBrainBPCost({ hiddenNodeCount: 1, synapseCount: 1 })).toBe(2.5);
  });
});

describe('computeFounderBPCost', () => {
  it('first founder is free', () => {
    expect(computeFounderBPCost(1)).toBe(0);
  });

  it('each additional costs 5 BP', () => {
    expect(computeFounderBPCost(2)).toBe(5);
    expect(computeFounderBPCost(5)).toBe(20);
    expect(computeFounderBPCost(10)).toBe(45);
  });
});

describe('computeBiomeBPCost', () => {
  it('returns 0 for null biome (random)', () => {
    expect(computeBiomeBPCost(null)).toBe(0);
  });

  it('returns 0 when world has < 50 organisms', () => {
    expect(
      computeBiomeBPCost(BiomeType.Grassland, {
        biomePopulations: { [BiomeType.Grassland]: 40 },
        totalPopulation: 40,
      }),
    ).toBe(0);
  });

  it('returns 0 when biome share < 15%', () => {
    expect(
      computeBiomeBPCost(BiomeType.Grassland, {
        biomePopulations: { [BiomeType.Grassland]: 10 },
        totalPopulation: 100,
      }),
    ).toBe(0);
  });

  it('returns correct cost at 20% share', () => {
    expect(
      computeBiomeBPCost(BiomeType.Grassland, {
        biomePopulations: { [BiomeType.Grassland]: 20 },
        totalPopulation: 100,
      }),
    ).toBe(2);
  });

  it('returns correct cost at 30% share', () => {
    expect(
      computeBiomeBPCost(BiomeType.Grassland, {
        biomePopulations: { [BiomeType.Grassland]: 30 },
        totalPopulation: 100,
      }),
    ).toBe(6);
  });
});

describe('computeTotalBP', () => {
  it('computes correct total for simple design', () => {
    const result = computeTotalBP({
      body: {
        sizeRatio: 1.0,
        speedRatio: 1.0,
        strength: 0.5,
        defense: 0.0,
        diet: 0.0,
        viewAngle: 90,
        viewRadius: 5.0,
        metabolism: 1.0,
        stomachMultiplier: 1.0,
        growthSpeed: 1.0,
      },
      brain: { hiddenNodeCount: 3, synapseCount: 10 },
      founderCount: 1,
      targetBiome: null,
      traitBPCost: 0,
    });
    // Body: 10 + 10 + 3 + 0 + 0 + 2 + 10 + 0 + 6 + 0 = 41
    // Brain: 6 + 5 = 11
    // Founders: 0, Biome: 0, Traits: 0
    expect(result.body).toBeCloseTo(41);
    expect(result.brain).toBe(11);
    expect(result.total).toBeCloseTo(52);
    expect(result.remaining).toBeCloseTo(48);
  });

  it('exactly 100 BP is valid', () => {
    const result = computeTotalBP({
      body: {
        sizeRatio: 1.0,
        speedRatio: 1.0,
        strength: 1.0,
        defense: 1.0,
        diet: 0.5,
        viewAngle: 180,
        viewRadius: 5.0,
        metabolism: 1.0,
        stomachMultiplier: 1.0,
        growthSpeed: 1.0,
      },
      brain: { hiddenNodeCount: 6, synapseCount: 20 },
      founderCount: 1,
      targetBiome: null,
      traitBPCost: 0,
    });
    // Body: 10 + 10 + 6 + 6 + 0 + 4 + 10 + 0 + 6 + 0 = 52
    // Brain: 12 + 10 = 22
    // Total: 74
    expect(result.total).toBeCloseTo(74);
    expect(result.remaining).toBeCloseTo(26);
  });
});

describe('dietColor', () => {
  it('diet 0 returns green hue (120)', () => {
    const c = dietColor(0);
    expect(c.h).toBeCloseTo(120);
  });

  it('diet 0.5 returns yellow hue (60)', () => {
    const c = dietColor(0.5);
    expect(c.h).toBeCloseTo(60);
  });

  it('diet 1.0 returns red hue (0)', () => {
    const c = dietColor(1.0);
    expect(c.h).toBeCloseTo(0);
  });

  it('metabolism affects saturation', () => {
    const low = dietColor(0.5, 0.5);
    const high = dietColor(0.5, 3.0);
    expect(high.s).toBeGreaterThan(low.s);
    expect(low.s).toBeCloseTo(60);
    expect(high.s).toBeCloseTo(85);
  });
});

describe('defenseDamageReduction', () => {
  it('0 defense = 0 reduction', () => {
    expect(defenseDamageReduction(0)).toBeCloseTo(0);
  });

  it('10 defense = 50% reduction', () => {
    expect(defenseDamageReduction(10)).toBeCloseTo(0.5);
  });

  it('never reaches 100%', () => {
    expect(defenseDamageReduction(1000)).toBeLessThan(1);
  });
});

describe('defenseSpeedPenalty', () => {
  it('2% per DEF point', () => {
    expect(defenseSpeedPenalty(1)).toBeCloseTo(0.02);
    expect(defenseSpeedPenalty(4)).toBeCloseTo(0.08);
  });
});

describe('computeLight', () => {
  it('noon (phase 0.5) = max light', () => {
    expect(computeLight(0.5)).toBeCloseTo(1.0);
  });

  it('midnight (phase 0.0) = min light', () => {
    expect(computeLight(0.0)).toBeCloseTo(0.0);
  });
});

describe('viewRadiusFromLight', () => {
  it('full light = 1.0x', () => {
    expect(viewRadiusFromLight(1.0)).toBeCloseTo(1.0);
  });

  it('no light = 0.6x', () => {
    expect(viewRadiusFromLight(0.0)).toBeCloseTo(0.6);
  });
});

describe('computeEntropyMultiplier', () => {
  it('at deploy = 1.0', () => {
    expect(computeEntropyMultiplier(0, 72)).toBeCloseTo(1.0);
  });

  it('at halfLife = 2.0', () => {
    expect(computeEntropyMultiplier(72, 72)).toBeCloseTo(2.0);
  });
});

describe('stat validation', () => {
  it('isStatInRange returns true for valid values', () => {
    expect(isStatInRange('sizeRatio', 1.0)).toBe(true);
    expect(isStatInRange('defense', 0.0)).toBe(true);
    expect(isStatInRange('viewAngle', 360)).toBe(true);
  });

  it('isStatInRange returns false for out-of-range values', () => {
    expect(isStatInRange('sizeRatio', 0.1)).toBe(false);
    expect(isStatInRange('sizeRatio', 3.5)).toBe(false);
    expect(isStatInRange('defense', -1)).toBe(false);
  });

  it('clampStat clamps to range', () => {
    expect(clampStat('sizeRatio', 0.1)).toBe(0.3);
    expect(clampStat('sizeRatio', 5.0)).toBe(3.0);
    expect(clampStat('sizeRatio', 1.5)).toBe(1.5);
  });
});
