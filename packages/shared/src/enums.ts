// ── Biomes & Seasons ──

export enum BiomeType {
  Grassland = 0,
  Forest = 1,
  Wetland = 2,
  Desert = 3,
  Rocky = 4,
}

export enum Season {
  Spring = 0,
  Summer = 1,
  Autumn = 2,
  Winter = 3,
}

// ── Entity Types ──

export enum EntityType {
  Organism = 0x01,
  PlantPellet = 0x02,
  MeatPellet = 0x03,
  Egg = 0x04,
  Fungus = 0x05,
  Spore = 0x06,
}

export enum FungusType {
  Decomposer = 0,
  ToxicMold = 1,
  NutrientNet = 2,
  Parasitic = 3,
  Bioluminescent = 4,
}

// ── Death & Lifecycle ──

export enum DeathCause {
  Starvation = 0,
  Combat = 1,
  OldAge = 2,
  Venom = 3,
  Plague = 4,
  ToxicFungi = 5,
  Retirement = 6,
}

// ── Brain: Input Nodes ──

export enum InputType {
  // Tier 1 (11 nodes)
  Constant = 0,
  EnergyRatio = 1,
  HealthRatio = 2,
  Fullness = 3,
  NearestPlantAngle = 4,
  NearestPlantDist = 5,
  NearestMeatAngle = 6,
  NearestMeatDist = 7,
  NearestOrganismAngle = 8,
  NearestOrganismDist = 9,
  NearestOrganismSize = 10,

  // Tier 2 (8 nodes)
  Speed = 11,
  Maturity = 12,
  NearestAllyAngle = 13,
  NearestAllyDist = 14,
  NOrganisms = 15,
  NFood = 16,
  IsGrabbing = 17,
  AttackedDamage = 18,

  // Tier 3 (15 nodes)
  Tic = 19,
  TimeAlive = 20,
  EggStored = 21,
  BiomeTypeInput = 22,
  SeasonPhase = 23,
  NearestOrganismColor = 24,
  NearestAllyCount = 25,
  StomachPlantRatio = 26,
  NearestMateAngle = 27,
  NearestMateDist = 28,
  Sex = 29,
  MatingCooldown = 30,
  NearbyEggCount = 31,
  NearestEggAngle = 32,
  NearestEggDist = 33,

  // Tier 4 (17 nodes)
  Pheromone1Strength = 34,
  Pheromone2Strength = 35,
  Pheromone3Strength = 36,
  Pheromone1Angle = 37,
  Pheromone2Angle = 38,
  Pheromone3Angle = 39,
  SoundDirection = 40,
  SoundIntensity = 41,
  SoundFrequency = 42,
  IsBurrowed = 43,
  AllyEnergyRatio = 44,
  AllyHealthRatio = 45,
  AllyHeading = 46,
  AllyLastFoodAngle = 47,
  AllyLastThreatAngle = 48,
  AllyWant2Mate = 49,
  AllyReproductiveState = 50,
}

// ── Brain: Output Nodes ──

export enum OutputType {
  // Tier 1 (5 nodes)
  Accelerate = 0,
  Rotate = 1,
  Want2Eat = 2,
  Want2Attack = 3,
  Want2Flee = 4,

  // Tier 2 (4 nodes)
  Want2Grow = 5,
  Digestion = 6,
  Grab = 7,
  Want2Heal = 8,

  // Tier 3 (6 nodes)
  Want2Reproduce = 9,
  Herding = 10,
  ClockReset = 11,
  Burrow = 12,
  Want2Mate = 13,
  StoreFat = 14,

  // Tier 4 (5 nodes)
  EmitPheromone1 = 15,
  EmitPheromone2 = 16,
  EmitPheromone3 = 17,
  EmitSound = 18,
  SoundFrequencyOut = 19,
}

// ── Brain: Hidden Node Types ──

export enum HiddenNodeType {
  // Tier 1 (4 types)
  Sigmoid = 0,
  Linear = 1,
  ReLU = 2,
  TanH = 3,

  // Tier 2 (2 types)
  Latch = 4,
  Multiply = 5,

  // Tier 3 (3 types)
  Gaussian = 6,
  Differential = 7,
  Absolute = 8,

  // Tier 4 (3 types)
  Sine = 9,
  Integrator = 10,
  Inhibitory = 11,
}

// ── Brain: Activation Functions ──

export enum ActivationFunction {
  Sigmoid = 0,
  Linear = 1,
  TanH = 2,
  ReLU = 3,
  Sine = 4,
  Gaussian = 5,
  Latch = 6,
  Multiply = 7,
  Differential = 8,
  Absolute = 9,
  Integrator = 10,
  Inhibitory = 11,
}

// ── WebSocket Message Types ──
// Split by direction because some codes overlap (0x05, 0x06)

export enum ClientMessageType {
  AUTH = 0x01,
  VIEWPORT = 0x03,
  JOIN_WORLD = 0x05,
  LEAVE_WORLD = 0x06,
  DEPLOY = 0x20,
  RETIRE_SPECIES = 0x22,
  PING = 0x30,

  // Debug (client -> server)
  DEBUG_SUBSCRIBE = 0xd0,
  DEBUG_UNSUBSCRIBE = 0xd1,
  DEBUG_INSPECT_ENTITY = 0xd2,
  DEBUG_TRACE_ENTITY = 0xd3,
  DEBUG_QUERY = 0xd4,
}

export enum ServerMessageType {
  AUTH_OK = 0x02,
  AUTH_FAIL = 0x04,
  WORLD_LIST = 0x05,
  JOIN_OK = 0x06,
  JOIN_FAIL = 0x07,
  KICKED = 0x08,
  FULL_STATE = 0x10,
  DELTA = 0x11,
  BIOME_MAP = 0x12,
  DEPLOY_ACK = 0x21,
  EVENT_WARNING = 0x24,
  PONG = 0x31,
  WORLD_EVENT = 0x40,
  SERVER_SHUTDOWN = 0xff,

  // Debug (server -> client)
  DEBUG_TICK_PROFILE = 0xd8,
  DEBUG_ENERGY_SNAPSHOT = 0xd9,
  DEBUG_ENTITY_DETAIL = 0xda,
  DEBUG_BRAIN_TRACE = 0xdb,
  DEBUG_SPATIAL_STATS = 0xdc,
  DEBUG_LIFECYCLE_EVENT = 0xdd,
  DEBUG_COMBAT_EVENT = 0xde,
  DEBUG_LOG_ENTRY = 0xdf,
}

// ── Auth/Join/Deploy Result Codes ──

export enum AuthFailReason {
  InvalidToken = 0x01,
  ExpiredToken = 0x02,
  ServerFull = 0x03,
  Banned = 0x04,
}

export enum JoinFailReason {
  NotFound = 0x00,
  Full = 0x01,
  WrongPassword = 0x02,
  NotInvited = 0x03,
  Banned = 0x04,
  PausedOrStopped = 0x05,
}

export enum DeployStatus {
  Success = 0x00,
  InvalidDesign = 0x01,
  BPExceeded = 0x02,
  MissingUnlock = 0x03,
  RateLimited = 0x04,
}

// ── World Access & Status ──

export enum WorldAccessType {
  Public = 0,
  Password = 1,
  Invite = 2,
}

export enum WorldStatus {
  Running = 0,
  Paused = 1,
  Stopped = 2,
}

// ── Ecological Events ──

export enum EcologicalEventType {
  None = 0,
  Bloom = 1,
  Drought = 2,
  Plague = 3,
  Migration = 4,
  FungiOutbreak = 5,
  MeteorImpact = 6,
}

// ── Unlockable Traits ──

export enum TraitId {
  ArmorPlating = 0,
  VenomGlands = 1,
  ImmuneSystem = 2,
  Echolocation = 3,
  Burrowing = 4,
  Camouflage = 5,
  FatReserves = 6,
  SporeDispersal = 7,
  HerdCoordination = 8,
  SexualReproduction = 9,
  EncounterInfoSharing = 10,
}

// ── Reproduction Mode ──

export enum ReproductionMode {
  Asexual = 'asexual',
  Sexual = 'sexual',
}

// ── Player Role ──

export enum PlayerRole {
  Player = 'player',
  Admin = 'admin',
}

// ── Mutation Status ──

export enum MutationStatus {
  Pending = 'pending',
  Applied = 'applied',
  Expired = 'expired',
  Skipped = 'skipped',
}

// ── Event Scope ──

export enum EventScope {
  World = 'world',
  Player = 'player',
  Species = 'species',
}

// ── Tier Tables ──

/** Which tier each input node belongs to */
export const INPUT_TIERS: Record<InputType, 1 | 2 | 3 | 4> = {
  [InputType.Constant]: 1,
  [InputType.EnergyRatio]: 1,
  [InputType.HealthRatio]: 1,
  [InputType.Fullness]: 1,
  [InputType.NearestPlantAngle]: 1,
  [InputType.NearestPlantDist]: 1,
  [InputType.NearestMeatAngle]: 1,
  [InputType.NearestMeatDist]: 1,
  [InputType.NearestOrganismAngle]: 1,
  [InputType.NearestOrganismDist]: 1,
  [InputType.NearestOrganismSize]: 1,

  [InputType.Speed]: 2,
  [InputType.Maturity]: 2,
  [InputType.NearestAllyAngle]: 2,
  [InputType.NearestAllyDist]: 2,
  [InputType.NOrganisms]: 2,
  [InputType.NFood]: 2,
  [InputType.IsGrabbing]: 2,
  [InputType.AttackedDamage]: 2,

  [InputType.Tic]: 3,
  [InputType.TimeAlive]: 3,
  [InputType.EggStored]: 3,
  [InputType.BiomeTypeInput]: 3,
  [InputType.SeasonPhase]: 3,
  [InputType.NearestOrganismColor]: 3,
  [InputType.NearestAllyCount]: 3,
  [InputType.StomachPlantRatio]: 3,
  [InputType.NearestMateAngle]: 3,
  [InputType.NearestMateDist]: 3,
  [InputType.Sex]: 3,
  [InputType.MatingCooldown]: 3,
  [InputType.NearbyEggCount]: 3,
  [InputType.NearestEggAngle]: 3,
  [InputType.NearestEggDist]: 3,

  [InputType.Pheromone1Strength]: 4,
  [InputType.Pheromone2Strength]: 4,
  [InputType.Pheromone3Strength]: 4,
  [InputType.Pheromone1Angle]: 4,
  [InputType.Pheromone2Angle]: 4,
  [InputType.Pheromone3Angle]: 4,
  [InputType.SoundDirection]: 4,
  [InputType.SoundIntensity]: 4,
  [InputType.SoundFrequency]: 4,
  [InputType.IsBurrowed]: 4,
  [InputType.AllyEnergyRatio]: 4,
  [InputType.AllyHealthRatio]: 4,
  [InputType.AllyHeading]: 4,
  [InputType.AllyLastFoodAngle]: 4,
  [InputType.AllyLastThreatAngle]: 4,
  [InputType.AllyWant2Mate]: 4,
  [InputType.AllyReproductiveState]: 4,
};

/** Which tier each output node belongs to */
export const OUTPUT_TIERS: Record<OutputType, 1 | 2 | 3 | 4> = {
  [OutputType.Accelerate]: 1,
  [OutputType.Rotate]: 1,
  [OutputType.Want2Eat]: 1,
  [OutputType.Want2Attack]: 1,
  [OutputType.Want2Flee]: 1,

  [OutputType.Want2Grow]: 2,
  [OutputType.Digestion]: 2,
  [OutputType.Grab]: 2,
  [OutputType.Want2Heal]: 2,

  [OutputType.Want2Reproduce]: 3,
  [OutputType.Herding]: 3,
  [OutputType.ClockReset]: 3,
  [OutputType.Burrow]: 3,
  [OutputType.Want2Mate]: 3,
  [OutputType.StoreFat]: 3,

  [OutputType.EmitPheromone1]: 4,
  [OutputType.EmitPheromone2]: 4,
  [OutputType.EmitPheromone3]: 4,
  [OutputType.EmitSound]: 4,
  [OutputType.SoundFrequencyOut]: 4,
};

/** Which tier each hidden node type belongs to */
export const HIDDEN_NODE_TIERS: Record<HiddenNodeType, 1 | 2 | 3 | 4> = {
  [HiddenNodeType.Sigmoid]: 1,
  [HiddenNodeType.Linear]: 1,
  [HiddenNodeType.ReLU]: 1,
  [HiddenNodeType.TanH]: 1,

  [HiddenNodeType.Latch]: 2,
  [HiddenNodeType.Multiply]: 2,

  [HiddenNodeType.Gaussian]: 3,
  [HiddenNodeType.Differential]: 3,
  [HiddenNodeType.Absolute]: 3,

  [HiddenNodeType.Sine]: 4,
  [HiddenNodeType.Integrator]: 4,
  [HiddenNodeType.Inhibitory]: 4,
};
