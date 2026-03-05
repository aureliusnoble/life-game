import { describe, it, expect } from 'vitest';
import {
  isOrganism,
  isPlantPellet,
  isMeatPellet,
  isPellet,
  isEgg,
  isFungus,
  isSpore,
  TRAIT_UNLOCK_TIERS,
  ACHIEVEMENT_DEFINITIONS,
} from './index.js';
import type {
  Entity,
  OrganismEntity,
  PelletEntity,
  EggEntity,
  FungusEntity,
  SporeEntity,
  BodyGenes,
  BrainConfig,
  SpeciesDesign,
  WorldConfig,
  PlayerProfile,
  LeaderboardEntry,
  GameEvent,
  TickProfile,
  WorldSnapshot,
  TraitConfig,
  DeploymentConfig,
  MutationOption,
} from './index.js';
import { TraitId, WorldStatus, WorldAccessType, PlayerRole, EventScope } from '../enums.js';

describe('type guards', () => {
  const organism: OrganismEntity = {
    entityId: 1,
    entityType: 0x01,
    x: 100,
    y: 200,
    rotation: 0,
    size: 1,
    health: 1,
    energy: 1,
    state: {
      eating: false,
      attacking: false,
      fleeing: false,
      burrowed: false,
      reproducing: false,
      dead: false,
      emittingSound: false,
      camouflaged: false,
    },
    speciesId: 1,
    red: 100,
    green: 200,
    blue: 50,
    maturity: 255,
    speed: 128,
    mouthState: 0,
    traits: {
      sex: false,
      echolocationActive: false,
      venomed: false,
      aiSpecies: false,
      fatReserves: false,
      herdBonus: false,
      sprouting: false,
    },
    fatFill: 0,
    venomTimer: 0,
    matingCooldown: 0,
    herdSize: 0,
    eggProgress: 0,
  };

  const plant: PelletEntity = {
    entityId: 2,
    entityType: 0x02,
    x: 50,
    y: 50,
    size: 10,
    red: 50,
    green: 200,
    blue: 50,
    decay: 0,
  };

  const meat: PelletEntity = {
    entityId: 3,
    entityType: 0x03,
    x: 60,
    y: 60,
    size: 15,
    red: 200,
    green: 50,
    blue: 50,
    decay: 10,
  };

  const egg: EggEntity = {
    entityId: 4,
    entityType: 0x04,
    x: 70,
    y: 70,
    red: 100,
    green: 100,
    blue: 100,
    hatchProgress: 128,
    nestBonus: 0,
    speciesId: 1,
  };

  const fungus: FungusEntity = {
    entityId: 5,
    entityType: 0x05,
    x: 80,
    y: 80,
    fungiType: 0,
    size: 20,
    energy: 50,
  };

  const spore: SporeEntity = {
    entityId: 6,
    entityType: 0x06,
    originX: 90,
    originY: 90,
    destX: 200,
    destY: 200,
    red: 100,
    green: 200,
    blue: 50,
    flightProgress: 128,
    speciesId: 1,
  };

  it('isOrganism identifies organisms', () => {
    expect(isOrganism(organism)).toBe(true);
    expect(isOrganism(plant)).toBe(false);
  });

  it('isPlantPellet identifies plant pellets', () => {
    expect(isPlantPellet(plant)).toBe(true);
    expect(isPlantPellet(meat)).toBe(false);
  });

  it('isMeatPellet identifies meat pellets', () => {
    expect(isMeatPellet(meat)).toBe(true);
    expect(isMeatPellet(plant)).toBe(false);
  });

  it('isPellet identifies both pellet types', () => {
    expect(isPellet(plant)).toBe(true);
    expect(isPellet(meat)).toBe(true);
    expect(isPellet(organism)).toBe(false);
  });

  it('isEgg identifies eggs', () => {
    expect(isEgg(egg)).toBe(true);
    expect(isEgg(organism)).toBe(false);
  });

  it('isFungus identifies fungi', () => {
    expect(isFungus(fungus)).toBe(true);
    expect(isFungus(organism)).toBe(false);
  });

  it('isSpore identifies spores', () => {
    expect(isSpore(spore)).toBe(true);
    expect(isSpore(organism)).toBe(false);
  });
});

describe('TRAIT_UNLOCK_TIERS', () => {
  it('has all 11 traits', () => {
    expect(Object.keys(TRAIT_UNLOCK_TIERS)).toHaveLength(11);
  });

  it('immune system is tier 1 (no restriction)', () => {
    expect(TRAIT_UNLOCK_TIERS[TraitId.ImmuneSystem]).toBe(1);
  });

  it('venom is tier 2', () => {
    expect(TRAIT_UNLOCK_TIERS[TraitId.VenomGlands]).toBe(2);
  });

  it('burrowing is tier 3', () => {
    expect(TRAIT_UNLOCK_TIERS[TraitId.Burrowing]).toBe(3);
  });

  it('encounter info sharing is tier 4', () => {
    expect(TRAIT_UNLOCK_TIERS[TraitId.EncounterInfoSharing]).toBe(4);
  });
});

describe('ACHIEVEMENT_DEFINITIONS', () => {
  it('has 18 achievements', () => {
    expect(ACHIEVEMENT_DEFINITIONS).toHaveLength(18);
  });

  it('all achievements have required fields', () => {
    for (const a of ACHIEVEMENT_DEFINITIONS) {
      expect(a.id).toBeTruthy();
      expect(a.name).toBeTruthy();
      expect(a.condition).toBeTruthy();
      expect(a.epReward).toBeGreaterThan(0);
    }
  });

  it('unique IDs', () => {
    const ids = ACHIEVEMENT_DEFINITIONS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('type shapes compile correctly', () => {
  it('BodyGenes has all required fields', () => {
    const body: BodyGenes = {
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
      redColor: 0.3,
      greenColor: 0.7,
      blueColor: 0.3,
    };
    expect(body.sizeRatio).toBe(1.0);
  });

  it('BrainConfig has nodes and synapses', () => {
    const brain: BrainConfig = {
      nodes: [],
      synapses: [],
    };
    expect(brain.nodes).toHaveLength(0);
  });

  it('TraitConfig allows partial traits', () => {
    const traits: TraitConfig = {
      venomGlands: true,
      immuneSystem: { strength: 0.5 },
    };
    expect(traits.venomGlands).toBe(true);
  });

  it('DeploymentConfig allows null biome (random)', () => {
    const deploy: DeploymentConfig = {
      biome: null,
      founderCount: 3,
    };
    expect(deploy.biome).toBeNull();
  });

  it('MutationOption has all fields', () => {
    const opt: MutationOption = {
      category: 'body',
      geneId: 'sizeRatio',
      oldValue: 1.0,
      newValue: 1.1,
      changePercent: 10,
      fitnessScore: 1.5,
      description: 'Size increased',
      frequency: 3,
      sourceGeneration: 5,
    };
    expect(opt.category).toBe('body');
  });
});
