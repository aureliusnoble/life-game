/** Tick profile (server performance per tick) */
export interface TickProfile {
  tick: number;
  totalMs: number;
  systems: SystemProfile[];
  entityCount: number;
  organismCount: number;
}

/** Per-system timing within a tick */
export interface SystemProfile {
  name: string;
  totalMs: number;
  callCount: number;
  avgMs: number;
  maxMs: number;
  lastMs: number;
}

/** Energy snapshot (conservation check) */
export interface EnergySnapshot {
  tick: number;
  totalEnergy: number;
  inPlants: number;
  inOrganisms: number;
  inMeat: number;
  inEggs: number;
  inFungus: number;
  drift: number;
}

/** Brain trace (single organism brain evaluation) */
export interface BrainTrace {
  entityId: number;
  tick: number;
  inputs: Record<string, number>;
  hiddenActivations: Record<string, number>;
  outputs: Record<string, number>;
  synapseActivations: Array<{
    from: string;
    to: string;
    weight: number;
    signal: number;
  }>;
}

/** Full entity detail (debug inspect) */
export interface FullEntityDetail {
  entityId: number;
  entityType: number;
  position: { x: number; y: number };
  heading: number;
  velocity: { x: number; y: number };
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  maturity: number;
  age: number;
  speciesId: number;
  playerId: string;
  generation: number;
  genes: Record<string, number>;
  stomachPlant: number;
  stomachMeat: number;
  fatStored: number;
  isBurrowed: boolean;
  isEating: boolean;
  isAttacking: boolean;
  isFleeing: boolean;
}

/** Spatial stats (debug spatial grid view) */
export interface SpatialStats {
  gridSize: number;
  cellSize: number;
  cellCounts: number[];
  totalEntities: number;
  maxCellCount: number;
  avgCellCount: number;
}

/** Combat event (debug) */
export interface CombatEvent {
  tick: number;
  attackerId: number;
  defenderId: number;
  damage: number;
  attackForce: number;
  defenseValue: number;
  venomApplied: boolean;
}

/** Reproduction event (debug) */
export interface ReproEvent {
  tick: number;
  parentId: number;
  eggId: number;
  speciesId: number;
  generation: number;
  isSexual: boolean;
  mateId: number | null;
  eggEnergy: number;
}

/** Debug log entry */
export interface DebugLogEntry {
  tick: number;
  level: 'info' | 'warn' | 'error';
  system: string;
  message: string;
  data?: Record<string, unknown>;
}

/** Energy ledger entry (per-entity energy audit) */
export interface EnergyLedgerEntry {
  tick: number;
  source: string;
  amount: number;
  balance: number;
}
