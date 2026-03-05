import type { SpeciesDesign } from '../types/species.js';
import { ActivationFunction, InputType, OutputType, HiddenNodeType, ReproductionMode } from '../enums.js';
import type { BrainNode, Synapse } from '../types/brain.js';

/** Helper to create a minimal valid design for testing */
export function makeDesign(overrides?: Partial<SpeciesDesign>): SpeciesDesign {
  return {
    id: 'test-id',
    playerId: 'test-player',
    speciesName: 'TestSpecies',
    version: 1,
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
      redColor: 0.3,
      greenColor: 0.7,
      blueColor: 0.3,
    },
    traits: {},
    brain: {
      nodes: [
        makeInputNode('in1', InputType.EnergyRatio),
        makeOutputNode('out1', OutputType.Accelerate),
      ],
      synapses: [
        makeSynapse('s1', 'in1', 'out1', 1.0),
      ],
    },
    deployment: {
      biome: null,
      founderCount: 1,
    },
    reproductionMode: ReproductionMode.Asexual,
    bpTotal: 0,
    isActive: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function makeInputNode(id: string, subtype: InputType): BrainNode {
  return {
    id,
    type: 'input',
    subtype,
    activation: ActivationFunction.Linear,
    tier: 1,
    bias: 0,
    x: 0,
    y: 0,
  };
}

export function makeOutputNode(id: string, subtype: OutputType): BrainNode {
  return {
    id,
    type: 'output',
    subtype,
    activation: ActivationFunction.Sigmoid,
    tier: 1,
    bias: 0,
    x: 100,
    y: 0,
  };
}

export function makeHiddenNode(id: string, subtype: HiddenNodeType): BrainNode {
  return {
    id,
    type: 'hidden',
    subtype,
    activation: ActivationFunction.Sigmoid,
    tier: 1,
    bias: 0,
    x: 50,
    y: 0,
  };
}

export function makeSynapse(id: string, from: string, to: string, weight: number): Synapse {
  return { id, from, to, weight, enabled: true };
}

// ── Archetype Templates ──

/** Herbivore archetype (Tier 1) */
export function makeHerbivore(): SpeciesDesign {
  return makeDesign({
    speciesName: 'Herbivore',
    body: {
      sizeRatio: 1.0, // 10 BP
      speedRatio: 1.2, // 12 BP
      strength: 0.5, // 3 BP
      defense: 0.5, // 3 BP
      diet: 0.0, // free
      viewAngle: 180, // 4 BP
      viewRadius: 5.0, // 10 BP
      metabolism: 1.0, // free
      stomachMultiplier: 1.5, // 9 BP
      growthSpeed: 1.0, // free
      redColor: 0.3,
      greenColor: 0.7,
      blueColor: 0.3,
    },
    // Body total: 51 BP → brain budget ~24 BP (12 hidden nodes or mix)
    brain: {
      nodes: [
        makeInputNode('constant', InputType.Constant),
        makeInputNode('energy', InputType.EnergyRatio),
        makeInputNode('plantAngle', InputType.NearestPlantAngle),
        makeInputNode('plantDist', InputType.NearestPlantDist),
        makeInputNode('orgAngle', InputType.NearestOrganismAngle),
        makeInputNode('orgDist', InputType.NearestOrganismDist),
        makeHiddenNode('h1', HiddenNodeType.Sigmoid),
        makeHiddenNode('h2', HiddenNodeType.Sigmoid),
        makeHiddenNode('h3', HiddenNodeType.TanH),
        makeOutputNode('accel', OutputType.Accelerate),
        makeOutputNode('rotate', OutputType.Rotate),
        makeOutputNode('eat', OutputType.Want2Eat),
        makeOutputNode('flee', OutputType.Want2Flee),
      ],
      synapses: [
        makeSynapse('s1', 'plantAngle', 'h1', 2.0),
        makeSynapse('s2', 'plantDist', 'h1', -1.0),
        makeSynapse('s3', 'h1', 'rotate', 1.5),
        makeSynapse('s4', 'energy', 'h2', -2.0),
        makeSynapse('s5', 'h2', 'eat', 3.0),
        makeSynapse('s6', 'orgDist', 'h3', -2.0),
        makeSynapse('s7', 'h3', 'flee', 2.0),
        makeSynapse('s8', 'constant', 'accel', 1.0),
      ],
    },
    // Brain: 3 hidden * 2 + 8 synapses * 0.5 = 10 BP
    // Total: 51 + 10 = 61 BP
  });
}

/** Carnivore archetype (Tier 1) */
export function makeCarnivore(): SpeciesDesign {
  return makeDesign({
    speciesName: 'Carnivore',
    body: {
      sizeRatio: 1.2, // 14.4 BP
      speedRatio: 1.5, // 15 BP
      strength: 2.5, // 15 BP
      defense: 0.3, // 1.8 BP
      diet: 1.0, // free
      viewAngle: 90, // 2 BP
      viewRadius: 7.0, // 14 BP
      metabolism: 1.0, // free
      stomachMultiplier: 0.8, // 4.8 BP
      growthSpeed: 1.0, // free
      redColor: 0.8,
      greenColor: 0.2,
      blueColor: 0.2,
    },
    brain: {
      nodes: [
        makeInputNode('energy', InputType.EnergyRatio),
        makeInputNode('orgAngle', InputType.NearestOrganismAngle),
        makeInputNode('orgDist', InputType.NearestOrganismDist),
        makeInputNode('orgSize', InputType.NearestOrganismSize),
        makeHiddenNode('h1', HiddenNodeType.Sigmoid),
        makeHiddenNode('h2', HiddenNodeType.TanH),
        makeOutputNode('accel', OutputType.Accelerate),
        makeOutputNode('rotate', OutputType.Rotate),
        makeOutputNode('attack', OutputType.Want2Attack),
        makeOutputNode('eat', OutputType.Want2Eat),
      ],
      synapses: [
        makeSynapse('s1', 'orgAngle', 'h1', 2.0),
        makeSynapse('s2', 'orgDist', 'h1', -1.5),
        makeSynapse('s3', 'h1', 'rotate', 1.5),
        makeSynapse('s4', 'h1', 'accel', 2.0),
        makeSynapse('s5', 'orgSize', 'h2', -1.0),
        makeSynapse('s6', 'h2', 'attack', 2.5),
        makeSynapse('s7', 'energy', 'eat', 3.0),
      ],
    },
    // Brain: 2 hidden * 2 + 7 synapses * 0.5 = 7.5 BP
    // Body: ~67 BP, total: ~74.5 BP
  });
}

/** Omnivore archetype (Tier 1) */
export function makeOmnivore(): SpeciesDesign {
  return makeDesign({
    speciesName: 'Omnivore',
    body: {
      sizeRatio: 1.0,
      speedRatio: 1.0,
      strength: 1.0,
      defense: 1.0,
      diet: 0.5,
      viewAngle: 120,
      viewRadius: 5.0,
      metabolism: 1.0,
      stomachMultiplier: 1.2,
      growthSpeed: 1.0,
      redColor: 0.6,
      greenColor: 0.6,
      blueColor: 0.2,
    },
    brain: {
      nodes: [
        makeInputNode('energy', InputType.EnergyRatio),
        makeInputNode('plantAngle', InputType.NearestPlantAngle),
        makeInputNode('meatAngle', InputType.NearestMeatAngle),
        makeHiddenNode('h1', HiddenNodeType.Sigmoid),
        makeOutputNode('accel', OutputType.Accelerate),
        makeOutputNode('rotate', OutputType.Rotate),
        makeOutputNode('eat', OutputType.Want2Eat),
      ],
      synapses: [
        makeSynapse('s1', 'plantAngle', 'h1', 1.0),
        makeSynapse('s2', 'meatAngle', 'h1', 1.0),
        makeSynapse('s3', 'h1', 'rotate', 1.5),
        makeSynapse('s4', 'energy', 'eat', 2.0),
        makeSynapse('s5', 'energy', 'accel', 1.0),
      ],
    },
  });
}

/** Scavenger archetype (Tier 1) */
export function makeScavenger(): SpeciesDesign {
  return makeDesign({
    speciesName: 'Scavenger',
    body: {
      sizeRatio: 0.7,
      speedRatio: 0.8,
      strength: 0.3,
      defense: 1.5,
      diet: 0.5,
      viewAngle: 270,
      viewRadius: 8.0,
      metabolism: 1.0,
      stomachMultiplier: 1.0,
      growthSpeed: 1.0,
      redColor: 0.5,
      greenColor: 0.4,
      blueColor: 0.3,
    },
    brain: {
      nodes: [
        makeInputNode('meatAngle', InputType.NearestMeatAngle),
        makeInputNode('meatDist', InputType.NearestMeatDist),
        makeOutputNode('accel', OutputType.Accelerate),
        makeOutputNode('rotate', OutputType.Rotate),
        makeOutputNode('eat', OutputType.Want2Eat),
      ],
      synapses: [
        makeSynapse('s1', 'meatAngle', 'rotate', 2.0),
        makeSynapse('s2', 'meatDist', 'accel', -1.5),
        makeSynapse('s3', 'meatDist', 'eat', -2.0),
      ],
    },
  });
}
