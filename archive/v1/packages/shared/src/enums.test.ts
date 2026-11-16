import { describe, it, expect } from 'vitest';
import {
  InputType,
  OutputType,
  HiddenNodeType,
  ClientMessageType,
  ServerMessageType,
  EntityType,
  BiomeType,
  Season,
  FungusType,
  TraitId,
  INPUT_TIERS,
  OUTPUT_TIERS,
  HIDDEN_NODE_TIERS,
} from './enums.js';

describe('InputType enum', () => {
  it('has 51 input types', () => {
    const count = Object.keys(InputType).filter((k) => typeof InputType[k as keyof typeof InputType] === 'number').length;
    expect(count).toBe(51);
  });

  it('tier 1 has 11 nodes', () => {
    const tier1 = Object.values(INPUT_TIERS).filter((t) => t === 1);
    expect(tier1).toHaveLength(11);
  });

  it('tier 2 has 8 nodes', () => {
    const tier2 = Object.values(INPUT_TIERS).filter((t) => t === 2);
    expect(tier2).toHaveLength(8);
  });

  it('tier 3 has 15 nodes', () => {
    const tier3 = Object.values(INPUT_TIERS).filter((t) => t === 3);
    expect(tier3).toHaveLength(15);
  });

  it('tier 4 has 17 nodes', () => {
    const tier4 = Object.values(INPUT_TIERS).filter((t) => t === 4);
    expect(tier4).toHaveLength(17);
  });
});

describe('OutputType enum', () => {
  it('has 20 output types', () => {
    const count = Object.keys(OutputType).filter((k) => typeof OutputType[k as keyof typeof OutputType] === 'number').length;
    expect(count).toBe(20);
  });

  it('tier 1 has 5 nodes', () => {
    const tier1 = Object.values(OUTPUT_TIERS).filter((t) => t === 1);
    expect(tier1).toHaveLength(5);
  });

  it('tier 2 has 4 nodes', () => {
    const tier2 = Object.values(OUTPUT_TIERS).filter((t) => t === 2);
    expect(tier2).toHaveLength(4);
  });

  it('tier 3 has 6 nodes', () => {
    const tier3 = Object.values(OUTPUT_TIERS).filter((t) => t === 3);
    expect(tier3).toHaveLength(6);
  });

  it('tier 4 has 5 nodes', () => {
    const tier4 = Object.values(OUTPUT_TIERS).filter((t) => t === 4);
    expect(tier4).toHaveLength(5);
  });
});

describe('HiddenNodeType enum', () => {
  it('has 12 hidden node types', () => {
    const count = Object.keys(HiddenNodeType).filter(
      (k) => typeof HiddenNodeType[k as keyof typeof HiddenNodeType] === 'number',
    ).length;
    expect(count).toBe(12);
  });

  it('tier 1 has 4 types', () => {
    const tier1 = Object.values(HIDDEN_NODE_TIERS).filter((t) => t === 1);
    expect(tier1).toHaveLength(4);
  });

  it('tier 2 has 2 types', () => {
    const tier2 = Object.values(HIDDEN_NODE_TIERS).filter((t) => t === 2);
    expect(tier2).toHaveLength(2);
  });

  it('tier 3 has 3 types', () => {
    const tier3 = Object.values(HIDDEN_NODE_TIERS).filter((t) => t === 3);
    expect(tier3).toHaveLength(3);
  });

  it('tier 4 has 3 types', () => {
    const tier4 = Object.values(HIDDEN_NODE_TIERS).filter((t) => t === 4);
    expect(tier4).toHaveLength(3);
  });
});

describe('EntityType enum', () => {
  it('matches binary protocol codes', () => {
    expect(EntityType.Organism).toBe(0x01);
    expect(EntityType.PlantPellet).toBe(0x02);
    expect(EntityType.MeatPellet).toBe(0x03);
    expect(EntityType.Egg).toBe(0x04);
    expect(EntityType.Fungus).toBe(0x05);
    expect(EntityType.Spore).toBe(0x06);
  });
});

describe('ClientMessageType enum', () => {
  it('matches protocol codes', () => {
    expect(ClientMessageType.AUTH).toBe(0x01);
    expect(ClientMessageType.VIEWPORT).toBe(0x03);
    expect(ClientMessageType.JOIN_WORLD).toBe(0x05);
    expect(ClientMessageType.LEAVE_WORLD).toBe(0x06);
    expect(ClientMessageType.DEPLOY).toBe(0x20);
    expect(ClientMessageType.PING).toBe(0x30);
  });

  it('debug messages are in 0xD0+ range', () => {
    expect(ClientMessageType.DEBUG_SUBSCRIBE).toBe(0xd0);
    expect(ClientMessageType.DEBUG_QUERY).toBe(0xd4);
  });
});

describe('ServerMessageType enum', () => {
  it('matches protocol codes', () => {
    expect(ServerMessageType.AUTH_OK).toBe(0x02);
    expect(ServerMessageType.AUTH_FAIL).toBe(0x04);
    expect(ServerMessageType.WORLD_LIST).toBe(0x05);
    expect(ServerMessageType.JOIN_OK).toBe(0x06);
    expect(ServerMessageType.FULL_STATE).toBe(0x10);
    expect(ServerMessageType.DELTA).toBe(0x11);
    expect(ServerMessageType.PONG).toBe(0x31);
    expect(ServerMessageType.SERVER_SHUTDOWN).toBe(0xff);
  });

  it('debug messages are in 0xD8-0xDF range', () => {
    expect(ServerMessageType.DEBUG_TICK_PROFILE).toBe(0xd8);
    expect(ServerMessageType.DEBUG_LOG_ENTRY).toBe(0xdf);
  });
});

describe('BiomeType enum', () => {
  it('has 5 biome types', () => {
    expect(BiomeType.Grassland).toBe(0);
    expect(BiomeType.Forest).toBe(1);
    expect(BiomeType.Wetland).toBe(2);
    expect(BiomeType.Desert).toBe(3);
    expect(BiomeType.Rocky).toBe(4);
  });
});

describe('Season enum', () => {
  it('matches binary encoding', () => {
    expect(Season.Spring).toBe(0);
    expect(Season.Summer).toBe(1);
    expect(Season.Autumn).toBe(2);
    expect(Season.Winter).toBe(3);
  });
});

describe('FungusType enum', () => {
  it('has 5 types', () => {
    expect(FungusType.Decomposer).toBe(0);
    expect(FungusType.Bioluminescent).toBe(4);
  });
});

describe('TraitId enum', () => {
  it('has 11 traits', () => {
    const count = Object.keys(TraitId).filter(
      (k) => typeof TraitId[k as keyof typeof TraitId] === 'number',
    ).length;
    expect(count).toBe(11);
  });
});
