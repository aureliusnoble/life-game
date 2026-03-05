export type {
  BodyGenes,
  DerivedStats,
  OrganismGenes,
  OrganismState,
  OrganismEntity,
  OrganismStateFlags,
  OrganismTraitFlags,
  PelletEntity,
  PelletState,
  EggEntity,
  EggState,
  FungusEntity,
  SporeEntity,
  Entity,
} from './organism.js';
export { isOrganism, isPlantPellet, isMeatPellet, isPellet, isEgg, isFungus, isSpore } from './organism.js';

export type {
  BrainNode,
  Synapse,
  BrainConfig,
  CompiledBrain,
  BrainInputs,
  BrainOutputs,
} from './brain.js';

export type {
  TraitConfig,
  DeploymentConfig,
  SpeciesDesign,
  ActiveSpecies,
  LifetimeStats,
} from './species.js';
export { TRAIT_UNLOCK_TIERS } from './species.js';

export type {
  WorldConfig,
  WorldSummary,
  SeasonState,
  DayNightState,
  EnvironmentHeader,
  BiomeMap,
  Viewport,
  EnergyBudget,
} from './world.js';

export type {
  PheromoneGrid,
  FungiPatch,
  EcologicalEvent,
  EcologicalEventPayload,
  BloomPayload,
  DroughtPayload,
  PlaguePayload,
  MigrationPayload,
  FungiOutbreakPayload,
  MeteorPayload,
  NonePayload,
} from './environment.js';

export type {
  AuthMessage,
  ViewportMessage,
  JoinWorldMessage,
  DeployMessage,
  AuthOkMessage,
  AuthFailMessage,
  WorldListMessage,
  JoinOkMessage,
  JoinFailMessage,
  KickedMessage,
  FullStateMessage,
  DeltaMessage,
  BiomeMapMessage,
  DeployAckMessage,
  EventWarningMessage,
  PongMessage,
  WorldEventMessage,
  ServerShutdownMessage,
} from './messages.js';

export type {
  PlayerProfile,
  Achievement,
  OnboardingState,
} from './player.js';
export { ACHIEVEMENT_DEFINITIONS } from './player.js';

export type {
  LeaderboardEntry,
  DominanceBreakdown,
} from './leaderboard.js';

export type {
  GameEvent,
  GameEventPayload,
  BirthEventPayload,
  DeathEventPayload,
  DeployEventPayload,
  ExtinctionEventPayload,
  CombatEventPayload,
  ReproductionEventPayload,
  MutationEventPayload,
  EcologicalEventPayload as EcologicalGameEventPayload,
  AchievementEventPayload,
  GenericEventPayload,
  MutationOption,
  PlayerSummary,
  DailyMutationRecord,
  MutationHistoryEntry,
} from './events.js';

export type {
  TickProfile,
  SystemProfile,
  EnergySnapshot,
  BrainTrace,
  FullEntityDetail,
  SpatialStats,
  CombatEvent,
  ReproEvent,
  DebugLogEntry,
  EnergyLedgerEntry,
} from './debug.js';

export type {
  WorldSnapshot,
  SnapshotData,
  SnapshotMetadata,
  SnapshotOrganism,
  SnapshotPellet,
  SnapshotEgg,
  SnapshotFungus,
  SnapshotSpore,
  SnapshotPheromoneGrid,
  SnapshotActiveSpecies,
} from './snapshot.js';
