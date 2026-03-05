import type { ActivationFunction, InputType, OutputType, HiddenNodeType } from '../enums.js';

/** Player-facing brain node definition (design time, JSON-serializable) */
export interface BrainNode {
  id: string;
  type: 'input' | 'hidden' | 'output';
  subtype: InputType | HiddenNodeType | OutputType;
  activation: ActivationFunction;
  tier: 1 | 2 | 3 | 4;
  bias: number; // -5.0 to +5.0
  x: number; // UI position (for editor)
  y: number;
}

/** Player-facing synapse definition (design time, JSON-serializable) */
export interface Synapse {
  id: string;
  from: string; // source node ID
  to: string; // target node ID
  weight: number; // -5.0 to +5.0
  enabled: boolean;
}

/** Brain configuration (nodes + synapses) — design-time */
export interface BrainConfig {
  nodes: BrainNode[];
  synapses: Synapse[];
}

/**
 * Runtime compiled brain packed into typed arrays for cache efficiency.
 * Created by BrainEngine.compile(). Server-side only.
 */
export interface CompiledBrain {
  activations: Float64Array;
  prevActivations: Float64Array;
  prevInputs: Float64Array;
  biases: Float64Array;
  metadata: Int32Array; // 4 ints per node
  synapseWeights: Float64Array;
  synapseSrcIndices: Int32Array;
  topoOrder: Int32Array;
  numInputs: number;
  numHidden: number;
  numOutputs: number;
  numSynapses: number;
  nodeCount: number;

  // Stateful node memory
  latchStates: Float64Array;
  integratorStates: Float64Array;

  // Input/Output mapping
  inputMapping: Uint8Array;
  outputMapping: Uint8Array;
}

/** Brain inputs: values to write before each tick */
export interface BrainInputs {
  [inputType: number]: number;
}

/** Brain outputs: values read after each tick */
export interface BrainOutputs {
  [outputType: number]: number;
}
