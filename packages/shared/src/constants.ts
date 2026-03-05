import { BiomeType, Season, FungusType } from './enums.js';

// ── Simulation Timing ──

export const SIM_TPS = 40;
export const TICK_INTERVAL_MS = 1000 / SIM_TPS; // 25ms
export const BROADCAST_HZ = 20;
export const BROADCAST_INTERVAL_MS = 1000 / BROADCAST_HZ; // 50ms

// ── World ──

export const WORLD_SIZE = 500;
export const SPATIAL_GRID_CELLS = 25; // 25x25 grid
export const SPATIAL_CELL_SIZE = WORLD_SIZE / SPATIAL_GRID_CELLS; // 20 units
export const MAX_PLAYERS_PER_WORLD = 30;
export const MAX_PLAYERS_HARD_CAP = 100;
export const TARGET_SPECIES_COUNT = 30;
export const TARGET_ORGANISM_COUNT = 900;
export const TARGET_PELLET_COUNT = 5500;
export const TARGET_ENTITY_COUNT = 6400;

// ── BP Budget ──

export const TOTAL_BP = 100;
export const FOUNDER_BP_COST = 5; // per founder beyond first

// ── Stat Ranges ──

export interface StatRange {
  readonly min: number;
  readonly max: number;
  readonly default: number;
  readonly bpCostFormula: 'size' | 'speed' | 'strength' | 'defense' | 'viewAngle' | 'viewRadius' | 'stomachMult' | 'free';
}

export const STAT_RANGES = {
  sizeRatio: { min: 0.3, max: 3.0, default: 1.0, bpCostFormula: 'size' },
  speedRatio: { min: 0.2, max: 2.5, default: 1.0, bpCostFormula: 'speed' },
  strength: { min: 0.1, max: 5.0, default: 0.5, bpCostFormula: 'strength' },
  defense: { min: 0.0, max: 4.0, default: 0.0, bpCostFormula: 'defense' },
  diet: { min: 0.0, max: 1.0, default: 0.0, bpCostFormula: 'free' },
  viewAngle: { min: 15, max: 360, default: 90, bpCostFormula: 'viewAngle' },
  viewRadius: { min: 1.0, max: 10.0, default: 5.0, bpCostFormula: 'viewRadius' },
  metabolism: { min: 0.5, max: 3.0, default: 1.0, bpCostFormula: 'free' },
  stomachMultiplier: { min: 0.3, max: 2.0, default: 1.0, bpCostFormula: 'stomachMult' },
  growthSpeed: { min: 0.5, max: 2.0, default: 1.0, bpCostFormula: 'free' },
} as const satisfies Record<string, StatRange>;

export type StatName = keyof typeof STAT_RANGES;

// ── Brain ──

export const BRAIN_HIDDEN_NODE_BP = 2;
export const BRAIN_SYNAPSE_BP = 0.5;
export const SYNAPSE_WEIGHT_RANGE = { min: -5, max: 5 } as const;
export const BIAS_RANGE = { min: -5, max: 5 } as const;
export const MAX_LATCH_NODES = 3;
export const BRAIN_TICK_ENERGY_COST_PER_HIDDEN = 0.1; // * metabolism

// ── Founders ──

export const FOUNDER_COUNT_MIN = 1;
export const FOUNDER_COUNT_MAX = 10;

// ── Species Name ──

export const SPECIES_NAME_MIN_LENGTH = 2;
export const SPECIES_NAME_MAX_LENGTH = 24;

// ── Display Name ──

export const DISPLAY_NAME_MIN_LENGTH = 2;
export const DISPLAY_NAME_MAX_LENGTH = 24;

// ── Progression / Tiers ──

export const TIER_EP_COSTS = [0, 0, 50, 200, 500] as const; // index = tier, cost to unlock

// ── Persistence Intervals (in ticks) ──

export const PERSISTENCE_SNAPSHOT_INTERVAL = 5 * 60 * SIM_TPS; // 12,000 ticks = 5 min
export const PERSISTENCE_LEADERBOARD_INTERVAL = 60 * SIM_TPS; // 2,400 ticks = 60 sec
export const PERSISTENCE_SUMMARY_INTERVAL = 3600 * SIM_TPS; // 144,000 ticks = 1 hour
export const MUTATION_POLL_INTERVAL = 60 * SIM_TPS; // 2,400 ticks = 60 sec

// ── Tick Loop Safety ──

export const MAX_TICKS_PER_FRAME = 3;

// ── WebSocket ──

export const WS_PORT_DEFAULT = 9001;
export const WS_MAX_CONNECTIONS = 35; // hard cap (30 players + headroom)

// ── Day/Night Cycle ──

export const DAY_NIGHT_CYCLE_HOURS = 6;
export const DAY_DURATION_HOURS = 4;
export const NIGHT_DURATION_HOURS = 2;
export const NIGHT_VIEW_RADIUS_MIN = 0.6;
export const NIGHT_PLANT_GROWTH_MIN = 0.7;

// ── Season Cycle ──

export const SEASON_CYCLE_DAYS = 28;
export const DAYS_PER_SEASON = 7;
export const SEASON_TRANSITION_RATIO = 0.2; // last 20% of each season is transition

// ── Dominance Score Weights ──

export const DOMINANCE_WEIGHTS = {
  biomassShare: 0.35,
  populationShare: 0.20,
  territoryCoverage: 0.20,
  lineageDepth: 0.15,
  keystoneBonus: 0.10,
} as const;

// ── Species Entropy ──

export const ENTROPY_HALF_LIFE_DEFAULT = 72; // hours
export const ENTROPY_HALF_LIFE_MIN = 24;
export const ENTROPY_HALF_LIFE_MAX = 168;
export const EARLY_RETIREMENT_AGEING_MULTIPLIER = 10;

// ── Combat ──

export const SPRINT_SPEED_MULTIPLIER = 1.5;
export const SPRINT_ENERGY_COST_MULTIPLIER = 3;
export const VENOM_DURATION_BASE = 10; // seconds
export const VENOM_ENERGY_COST = 8;

// ── Digestion ──

export const MATERIAL_PROPERTIES = {
  plant: { energyDensity: 1.0, massDensity: 0.5, hardness: 0.5, reactivity: 1.0, maxEfficiency: 0.55 },
  meat: { energyDensity: 3.0, massDensity: 1.5, hardness: 1.5, reactivity: 2.0, maxEfficiency: 0.80 },
} as const;

// ── Pheromones ──

export const PHEROMONE_CHANNELS = 3;
export const PHEROMONE_GRID_RESOLUTION = 50;
export const PHEROMONE_PERSISTENCE_SECONDS = 30;

// ── Sound ──

export const SOUND_RANGE_MULTIPLIER = 3; // * ViewRadius * intensity

// ── AI Ecosystem ──

export const AI_EFFECTIVE_BP = 75;
export const AI_MAX_SYNAPSES = 12;
export const AI_CYCLE_HOURS = 48;
export const AI_FILL_DELAY_MINUTES = 5;
export const AI_LIBRARY_MIN_DESIGNS = 15;
export const PLAYER_INACTIVE_THRESHOLD_DAYS = 7;

// ── Reconnection Backoff ──

export const RECONNECT_DELAYS_MS = [0, 500, 1000, 2000, 4000] as const;
export const RECONNECT_MAX_DELAY_MS = 30000;
export const RECONNECT_TOTAL_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
export const RECONNECT_JITTER_RATIO = 0.25;

// ── LOD Thresholds (viewport width in world units) ──

export const LOD_DOT_THRESHOLD = 50;
export const LOD_SPRITE_THRESHOLD = 15;

// ── Biome Modifiers ──

export interface BiomeModifiers {
  readonly plantDensity: number;
  readonly pelletSize: number;
  readonly meatDecay: number;
  readonly visibility: number;
  readonly movementCost: number;
  readonly special: string;
}

export const BIOME_MODIFIERS: Record<BiomeType, BiomeModifiers> = {
  [BiomeType.Grassland]: { plantDensity: 1.0, pelletSize: 1.0, meatDecay: 1.0, visibility: 1.0, movementCost: 1.0, special: 'Standard' },
  [BiomeType.Forest]: { plantDensity: 1.5, pelletSize: 1.5, meatDecay: 0.7, visibility: 0.7, movementCost: 1.0, special: 'Dense food, reduced vision' },
  [BiomeType.Desert]: { plantDensity: 0.2, pelletSize: 0.5, meatDecay: 0.3, visibility: 1.3, movementCost: 1.3, special: 'Sparse, clear sight, costly move' },
  [BiomeType.Wetland]: { plantDensity: 0.8, pelletSize: 1.0, meatDecay: 2.0, visibility: 1.0, movementCost: 0.7, special: 'Fungi 3x, fast decomposition' },
  [BiomeType.Rocky]: { plantDensity: 0.3, pelletSize: 0.7, meatDecay: 0.5, visibility: 1.0, movementCost: 1.0, special: 'Burrowing 50% cheaper, 1.5x pellet hardness' },
};

// ── Biome Brain Input Encoding ──

export const BIOME_INPUT_VALUES: Record<BiomeType, number> = {
  [BiomeType.Grassland]: 0.2,
  [BiomeType.Forest]: 0.4,
  [BiomeType.Wetland]: 0.6,
  [BiomeType.Desert]: 0.8,
  [BiomeType.Rocky]: 1.0,
};

// ── Season Modifiers ──

export interface SeasonModifiers {
  readonly plantGrowthMult: number;
  readonly metabolismMult: number;
  readonly reproductionMult: number;
  readonly hueTint: number;
  readonly saturationScale: number;
  readonly brightnessScale: number;
}

export const SEASON_MODIFIERS: Record<Season, SeasonModifiers> = {
  [Season.Spring]: { plantGrowthMult: 1.2, metabolismMult: 0.9, reproductionMult: 1.1, hueTint: 8, saturationScale: 1.15, brightnessScale: 1.05 },
  [Season.Summer]: { plantGrowthMult: 1.0, metabolismMult: 1.0, reproductionMult: 1.0, hueTint: 5, saturationScale: 1.0, brightnessScale: 1.1 },
  [Season.Autumn]: { plantGrowthMult: 0.7, metabolismMult: 1.1, reproductionMult: 0.9, hueTint: -15, saturationScale: 0.85, brightnessScale: 0.95 },
  [Season.Winter]: { plantGrowthMult: 0.4, metabolismMult: 1.3, reproductionMult: 0.7, hueTint: 10, saturationScale: 0.6, brightnessScale: 0.8 },
};

// ── Fungus Constants ──

export interface FungusConfig {
  readonly maxSize: number;
  readonly durationTicks: number;
}

export const FUNGUS_CONFIGS: Record<FungusType, FungusConfig> = {
  [FungusType.Decomposer]: { maxSize: 5, durationTicks: SIM_TPS * 60 * 5 },
  [FungusType.ToxicMold]: { maxSize: 3, durationTicks: SIM_TPS * 60 * 3 },
  [FungusType.NutrientNet]: { maxSize: 8, durationTicks: Infinity },
  [FungusType.Parasitic]: { maxSize: 2, durationTicks: SIM_TPS * 60 * 60 * 24 },
  [FungusType.Bioluminescent]: { maxSize: 1, durationTicks: Infinity },
};

// ── Ecological Events ──

export const EVENT_WARNING_SECONDS = 30;

// ── Mutation Defaults ──

export const DEFAULT_GENE_MUTATION_LAMBDA = 2.0;
export const DEFAULT_BRAIN_MUTATION_LAMBDA = 1.5;
export const DEFAULT_MUTATION_VARIANCE = 0.15;

// ── Sexual Reproduction ──

export const MATING_COOLDOWN_SECONDS = 60;
export const EGG_COST_FEMALE_RATIO = 0.7;
export const EGG_COST_MALE_RATIO = 0.3;

// ── Population Control ──

export const DENSITY_DEPENDENT_THRESHOLD = 2000;

// ── Art / Colors ──

export const BIOME_LIQUID_COLORS: Record<BiomeType, { dark: string; light: string }> = {
  [BiomeType.Grassland]: { dark: '#1a3a2a', light: '#2d5a3a' },
  [BiomeType.Forest]: { dark: '#1a2a1a', light: '#1d3320' },
  [BiomeType.Desert]: { dark: '#3a2a1a', light: '#5a4020' },
  [BiomeType.Wetland]: { dark: '#1a2a3a', light: '#204050' },
  [BiomeType.Rocky]: { dark: '#2a2a2a', light: '#3a3535' },
};

export const FUNGUS_COLORS: Record<FungusType, string> = {
  [FungusType.Decomposer]: '#8B6914',
  [FungusType.ToxicMold]: '#7FCC2A',
  [FungusType.NutrientNet]: '#DAA520',
  [FungusType.Parasitic]: '#6A0DAD',
  [FungusType.Bioluminescent]: '#00FFFF',
};

export const UI_COLORS = {
  background: '#0a0f1a',
  panel: '#141e2e',
  panelBorder: '#2a3a50',
  textPrimary: '#e0e8f0',
  textSecondary: '#8090a0',
  accent: '#4fc3f7',
  warning: '#ffb74d',
  danger: '#ef5350',
  success: '#66bb6a',
} as const;

// ── Ambient Particles (per biome) ──

export const BIOME_PARTICLES: Record<BiomeType, { specks: number; bubbles: number; sediment: number }> = {
  [BiomeType.Forest]: { specks: 150, bubbles: 20, sediment: 40 },
  [BiomeType.Wetland]: { specks: 120, bubbles: 30, sediment: 35 },
  [BiomeType.Grassland]: { specks: 100, bubbles: 15, sediment: 20 },
  [BiomeType.Desert]: { specks: 60, bubbles: 0, sediment: 10 },
  [BiomeType.Rocky]: { specks: 50, bubbles: 5, sediment: 15 },
};

// ── Size Tier Thresholds (art.md authoritative) ──

export const SIZE_TIERS = {
  tiny: 0.6,
  normal: 1.4,
  large: 2.2,
} as const;

// ── Performance Budget ──

export const PERF_TICK_BUDGET_MS = 10;
export const PERF_TICK_TARGET_MS = 3;
export const PERF_BANDWIDTH_PER_CLIENT_KB = 12;
export const PERF_CLIENT_FPS = 60;
export const PERF_DESIGN_VALIDATION_MS = 5;
export const PERF_SNAPSHOT_WRITE_MS = 500;
export const PERF_CLIENT_INITIAL_LOAD_KB = 500;
