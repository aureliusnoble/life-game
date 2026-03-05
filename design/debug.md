# Life Game - Debug & QA Tooling System

**Version**: 1.0
**Scope**: Server-side instrumentation, client-side debug panel, production monitoring, testing utilities
**Auth**: Admin-gated — all debug features require `role = 'admin'` JWT claim

> **Cross-references**: For system architecture and message protocol, see [`architecture.md`](./architecture.md). For server implementation details, see [`components/back-end.md`](./components/back-end.md). For client component tree and stores, see [`components/front-end.md`](./components/front-end.md). For simulation formulas and gameplay systems, see [`core-gameplay-systems.md`](./core-gameplay-systems.md).

---

## Table of Contents

A. [Server-Side Debug Infrastructure](#a-server-side-debug-infrastructure)
B. [Client-Side Debug Panel](#b-client-side-debug-panel)
C. [Production Monitoring Dashboard](#c-production-monitoring-dashboard)
D. [Debug WebSocket Protocol](#d-debug-websocket-protocol)
E. [Debug REST API](#e-debug-rest-api)
F. [Testing Utilities](#f-testing-utilities)
G. [Implementation Notes](#g-implementation-notes)

---

## A. Server-Side Debug Infrastructure

### A.1 Debug Configuration

```typescript
interface DebugConfig {
  // Per-system toggles
  tickProfiler: boolean;       // Per-system tick timing
  energyAudit: boolean;        // Energy transfer logging + conservation checks
  brainTrace: boolean;         // Per-node activation recording for traced entities
  spatialStats: boolean;       // Cell occupancy histograms, query/collision counts
  reproductionLog: boolean;    // Birth/death/egg/extinction events
  combatLog: boolean;          // Attack resolution details
  physicsDebug: boolean;       // Force/velocity/collision debug data

  // Global settings
  historyDepth: number;        // Ring buffer size in ticks (default: 200 = 5s at 40 TPS)
  maxTracedEntities: number;   // Max entities with per-tick brain/energy traces (default: 10)
  samplingRate: number;        // 0.0-1.0, fraction of ticks to record spatial stats (default: 1.0)
}
```

**Environment variables** (loaded at startup):

| Env Var | Default | Description |
|---------|---------|-------------|
| `DEBUG_ENABLED` | `true` | Master toggle — when `false`, `DebugCollector` is a no-op stub |
| `DEBUG_ENERGY_AUDIT` | `true` | Enable energy transfer logging |
| `DEBUG_BRAIN_TRACE` | `true` | Enable brain activation recording |
| `DEBUG_SPATIAL_STATS` | `true` | Enable spatial hash statistics |
| `DEBUG_HISTORY_DEPTH` | `200` | Ring buffer depth (ticks) |
| `DEBUG_MAX_TRACED` | `10` | Max concurrently traced entities |
| `DEBUG_SAMPLING_RATE` | `1.0` | Spatial stats sampling fraction |

**Design decision**: Debug collection is always on in production (negligible overhead — see §G). The admin gate controls who can *read* the data, not whether it's collected. This ensures debug data is available the moment an admin needs it, without requiring a restart.

### A.2 Debug Data Collector

`DebugCollector` is the central server-side class that replaces and supersedes the existing `TickProfiler` (see `back-end.md` §2.4). It stores all debug data in fixed-size ring buffers.

```typescript
class DebugCollector {
  // ── Ring Buffers ────────────────────────────────────────────────────
  private tickProfiles: RingBuffer<TickProfile>;       // Per-system timing per tick
  private energySnapshots: RingBuffer<EnergySnapshot>; // 7-field energy distribution per tick
  private energyTransfers: RingBuffer<EnergyTransferLog>; // Every transfer() call
  private spatialSnapshots: RingBuffer<SpatialStats>;  // Cell occupancy histograms
  private reproductionEvents: RingBuffer<ReproEvent>;  // Births, eggs, hatches, deaths, extinctions
  private combatEvents: RingBuffer<CombatEvent>;       // Attack resolutions

  // ── Per-Entity Traced Data ──────────────────────────────────────────
  private brainTraces: Map<number, RingBuffer<BrainTrace>>;  // entityId → activation history
  private entityLedgers: Map<number, RingBuffer<EnergyLedgerEntry>>; // entityId → energy in/out

  // ── Entity Tracing ─────────────────────────────────────────────────
  private tracedEntities: Set<number>;  // Currently traced entity IDs (max: maxTracedEntities)

  // ── Methods ────────────────────────────────────────────────────────
  profileAndRun(systemName: string, fn: () => void): void;  // Wraps system execution with timing
  recordEnergyTransfer(log: EnergyTransferLog): void;
  recordEnergySnapshot(snapshot: EnergySnapshot): void;
  recordBrainTrace(entityId: number, trace: BrainTrace): void;
  recordSpatialStats(stats: SpatialStats): void;
  recordReproEvent(event: ReproEvent): void;
  recordCombatEvent(event: CombatEvent): void;
  recordEntityLedger(entityId: number, entry: EnergyLedgerEntry): void;

  traceEntity(entityId: number): boolean;    // Returns false if at max
  untraceEntity(entityId: number): void;
  isTraced(entityId: number): boolean;

  // ── Queries ─────────────────────────────────────────────────────────
  getTickProfiles(count?: number): TickProfile[];
  getEnergySnapshots(count?: number): EnergySnapshot[];
  getEnergyTransfers(count?: number): EnergyTransferLog[];
  getSpatialStats(): SpatialStats | null;  // Latest
  getReproEvents(count?: number): ReproEvent[];
  getCombatEvents(count?: number): CombatEvent[];
  getBrainTrace(entityId: number): BrainTrace | null;  // Latest
  getEntityLedger(entityId: number, count?: number): EnergyLedgerEntry[];
}
```

**Key data structures**:

```typescript
interface TickProfile {
  tick: number;
  systems: { name: string; durationMs: number }[];  // 12 systems
  totalMs: number;
  entityCount: number;
  plantCount: number;
}

interface EnergySnapshot {
  tick: number;
  totalEnergy: number;        // Sum of all 5 accounts
  freeEnergy: number;         // Ambient pool
  plantEnergy: number;        // Energy stored in plants
  meatEnergy: number;         // Energy stored in meat pellets
  organismEnergy: number;     // Energy stored in living organisms
  eggEnergy: number;          // Energy stored in eggs
  conservationDrift: number;  // totalEnergy - expectedTotal (should be ~0)
}

interface EnergyTransferLog {
  tick: number;
  fromAccount: 'free' | 'plant' | 'meat' | 'organism' | 'egg';
  toAccount: 'free' | 'plant' | 'meat' | 'organism' | 'egg';
  amount: number;
  reason: string;             // e.g., 'photosynthesis', 'eating', 'death_decay', 'metabolism'
  entityId?: number;          // Organism involved, if applicable
}

interface BrainTrace {
  tick: number;
  entityId: number;
  inputValues: number[];      // Raw input node values (14 inputs)
  hiddenValues: number[];     // Hidden node activations
  outputValues: number[];     // Output node values (7 outputs)
  significantFlows: {         // Top N synapse flows by |weight * value|
    fromNode: number;
    toNode: number;
    weight: number;
    value: number;
    flow: number;             // weight * value
  }[];
}

interface SpatialStats {
  tick: number;
  cellOccupancy: Uint16Array; // 400 cells (20x20 grid), count per cell
  totalQueries: number;       // Spatial hash queries this tick
  totalCollisions: number;    // Collision checks this tick
  avgEntitiesPerQuery: number;
}

interface ReproEvent {
  tick: number;
  type: 'birth' | 'egg_laid' | 'egg_hatched' | 'death' | 'extinction';
  entityId?: number;
  speciesId?: number;
  speciesName?: string;
  parentId?: number;
  cause?: string;             // Death cause: 'starvation', 'eaten', 'old_age', 'combat'
  position?: { x: number; y: number };
  populationAfter?: number;   // Species population after this event
}

interface CombatEvent {
  tick: number;
  attackerId: number;
  defenderId: number;
  attackerSpeciesId: number;
  defenderSpeciesId: number;
  damage: number;
  venomApplied: boolean;
  defenderKilled: boolean;
  attackerStrength: number;
  defenderDefense: number;
}

interface EnergyLedgerEntry {
  tick: number;
  entityId: number;
  energyIn: number;           // Total energy gained this tick
  energyOut: number;          // Total energy spent this tick
  sources: { reason: string; amount: number }[];  // Breakdown of gains
  sinks: { reason: string; amount: number }[];    // Breakdown of losses
  balanceAfter: number;       // Entity energy after this tick
}
```

**Memory budget**: With `historyDepth = 200` and 10 traced entities:
- `tickProfiles[]` — 200 × ~300B = ~60 KB
- `energySnapshots[]` — 200 × 32B = ~6.4 KB
- `energyTransfers[]` — 200 × ~2000 transfers × 80B = ~320 KB (capped ring buffer of 2000 entries)
- `spatialSnapshots[]` — 200 × 820B = ~164 KB
- `reproductionEvents[]` — 2000 entries × 120B = ~240 KB
- `combatEvents[]` — 2000 entries × 60B = ~120 KB
- `brainTraces` — 10 entities × 200 × 300B = ~600 KB
- `entityLedgers` — 10 entities × 200 × 200B = ~400 KB
- **Total: ~1.9 MB** (negligible vs ~3 MB entity data for a full world)

### A.3 Instrumentation Integration

The primary integration point is `World.tick()`, which executes the 12-system pipeline. Each system call is wrapped with `DebugCollector.profileAndRun()`:

```typescript
// server/src/simulation/world.ts — tick() method

tick(): void {
  // Each system wrapped for timing + debug hooks
  this.debugCollector.profileAndRun('SenseSystem', () => {
    this.senseSystem.update(this.organisms, this.pellets, this.spatialHash, this.pheromoneGrid);
  });

  this.debugCollector.profileAndRun('BrainSystem', () => {
    this.brainSystem.update(this.organisms);
  });

  // After BrainSystem: record brain traces for traced entities
  for (const entityId of this.debugCollector.tracedEntities) {
    const org = this.organisms.get(entityId);
    if (org) {
      this.debugCollector.recordBrainTrace(entityId, {
        tick: this.currentTick,
        entityId,
        inputValues: [...org.brain.inputValues],
        hiddenValues: [...org.brain.hiddenValues],
        outputValues: [...org.brain.outputValues],
        significantFlows: this.brainSystem.getSignificantFlows(org.brain, 10),
      });
    }
  }

  this.debugCollector.profileAndRun('DecisionSystem', () => {
    this.decisionSystem.update(this.organisms);
  });

  // ... remaining 9 systems wrapped similarly ...

  // Energy snapshot after all systems
  this.debugCollector.recordEnergySnapshot({
    tick: this.currentTick,
    totalEnergy: this.energySystem.getTotalEnergy(),
    freeEnergy: this.energySystem.getFreeEnergy(),
    plantEnergy: this.energySystem.getPlantEnergy(),
    meatEnergy: this.energySystem.getMeatEnergy(),
    organismEnergy: this.energySystem.getOrganismEnergy(),
    eggEnergy: this.energySystem.getEggEnergy(),
    conservationDrift: this.energySystem.getConservationDrift(),
  });

  this.currentTick++;
}
```

**Energy audit hook** — one-line addition to `EnergySystem.transfer()`:

```typescript
// server/src/simulation/systems/energy-system.ts

transfer(from: EnergyAccount, to: EnergyAccount, amount: number, reason: string, entityId?: number): void {
  // ... existing transfer logic ...

  // Debug hook (one line)
  this.debugCollector?.recordEnergyTransfer({ tick: this.currentTick, fromAccount: from, toAccount: to, amount, reason, entityId });
}
```

**Overhead**: ~0.1 ms per tick. `profileAndRun()` uses `performance.now()` for each of the 12 systems (12 × ~0.005 ms = 0.06 ms). Energy/brain/spatial recording is simple array pushes into pre-allocated ring buffers.

### A.4 Simulation Manipulation Commands

`DebugCommands` provides direct manipulation of the simulation state. All commands validate inputs and operate through the normal simulation APIs where possible (e.g., `killEntity` uses the death path that creates meat pellets, not raw deletion).

```typescript
interface DebugCommands {
  // ── Entity Manipulation ────────────────────────────────────────────
  spawnOrganism(worldId: string, opts: {
    x: number;
    y: number;
    speciesId?: number;       // Clone existing species, or use default
    genes?: Partial<OrganismGenes>;
    brain?: BrainConfig;
    energy?: number;          // Default: species normal starting energy
  }): number;                 // Returns new entity ID

  killEntity(worldId: string, entityId: number): void;
  // Uses normal death path: body → meat pellet, energy conserved

  teleportEntity(worldId: string, entityId: number, x: number, y: number): void;
  // Updates position + spatial hash. Wraps toroidal coordinates.

  injectEnergy(worldId: string, entityId: number, amount: number): void;
  // Bypasses conservation — adds energy from nowhere. Logged in energy audit.

  editGenes(worldId: string, entityId: number, genes: Partial<OrganismGenes>): void;
  // Overwrites gene values, triggers stat recalculation (speed, strength, etc.)

  forceMutation(worldId: string, entityId: number, gene?: string): void;
  // Applies mutation as if natural — uses mutation system's randomization.
  // If gene specified, mutates only that gene.

  pauseEntity(worldId: string, entityId: number): void;
  // Entity skipped in tick pipeline. Frozen in place. Still visible/collidable.

  resumeEntity(worldId: string, entityId: number): void;

  forceReproduce(worldId: string, entityId: number): void;
  // Bypasses energy/maturity checks. Creates egg immediately.

  // ── World Manipulation ─────────────────────────────────────────────
  triggerEvent(worldId: string, eventType: string, opts?: {
    x?: number;
    y?: number;
    radius?: number;
    duration?: number;        // Ticks
  }): void;
  // Force ecological event (drought, bloom, plague, etc.)

  spawnPlants(worldId: string, x: number, y: number, count: number, radius: number): void;
  // Scatter plants randomly within radius of (x, y)

  clearArea(worldId: string, x: number, y: number, radius: number, entityType?: 'organism' | 'plant' | 'meat' | 'egg'): void;
  // Remove all entities of type within radius. Energy returned to free pool.

  setSeason(worldId: string, season: 'spring' | 'summer' | 'autumn' | 'winter', progress?: number): void;
  // Immediate season change. Progress 0.0-1.0 within the season.

  stepTicks(worldId: string, count: number): void;
  // Pause world, advance exactly N ticks, remain paused.
  // Useful for frame-by-frame debugging.
}
```

### A.5 Structured Debug Logging

```typescript
enum DebugLogLevel {
  TRACE = 0,    // Per-tick details (brain activations, spatial queries)
  DEBUG = 1,    // System events (entity spawned, energy transfer)
  INFO  = 2,    // Lifecycle events (species created, season change)
  WARN  = 3,    // Anomalies (energy drift > 0.1, tick overrun)
  ERROR = 4,    // Failures (NaN energy, entity not found)
}

enum DebugLogDomain {
  BRAIN    = 'BRAIN',
  ENERGY   = 'ENERGY',
  PHYSICS  = 'PHYSICS',
  COMBAT   = 'COMBAT',
  REPRO    = 'REPRO',
  GENETICS = 'GENETICS',
  ECOLOGY  = 'ECOLOGY',
  NETWORK  = 'NETWORK',
  PERSIST  = 'PERSIST',
}

interface DebugLogEntry {
  tick: number;
  timestamp: number;          // Date.now()
  level: DebugLogLevel;
  domain: DebugLogDomain;
  message: string;
  data?: Record<string, unknown>;  // Structured context
  entityId?: number;
}
```

`DebugLogger` maintains a ring buffer of 2,000 log entries (~400 KB). Entries are queryable via REST (`GET /api/debug/worlds/:worldId/logs`) and streamable via WebSocket (DEBUG_LOG_ENTRY messages). Production monitoring shows only WARN+ level entries.

---

## B. Client-Side Debug Panel

### B.1 Overlay Architecture

The debug panel is a conditional overlay rendered as a direct child of `<AppShell>`:

```
AppShell
  PhoneLayout / TabletLayout
    ...existing layout...
  <DebugOverlay />   ← conditional: authStore.isAdmin && debugStore.isOpen
```

**Activation**:
- Keyboard shortcut: `Ctrl+Shift+D` (toggles panel open/closed)
- Gear icon in `TopBar` (visible to admin users only)
- "Debug Console" button in `AdminWorldDetailScreen` → `DevToolsTab`

**Layout**:
- **Tablet (≥768px)**: Resizable side panel, right edge. Default 400px wide, draggable resize handle. Max 50% viewport width.
- **Phone (<768px)**: Bottom sheet, draggable. Snap points at 30%, 60%, 90% of viewport height.

**Loading**: Lazy-loaded via `React.lazy()`. The `debugStore`, all debug components, and debug Pixi layers are in a separate chunk (~50 KB gzipped). Zero cost for non-admin users.

### B.2 Debug Zustand Store

```typescript
// stores/debugStore.ts — lazy-loaded, admin only

interface DebugStore {
  // ── Panel State ────────────────────────────────────────────────────
  isOpen: boolean;
  activeTab: DebugTab;
  isConnected: boolean;        // Debug WS subscription active

  // ── WS Subscriptions ──────────────────────────────────────────────
  activeStreams: Set<DebugStreamType>;
  // DebugStreamType: 'tick_profile' | 'energy_snapshot' | 'entity_trace' |
  //   'spatial_stats' | 'lifecycle' | 'combat' | 'logs'

  // ── Cached Stream Data ─────────────────────────────────────────────
  tickProfiles: TickProfile[];          // Rolling window (200)
  energySnapshots: EnergySnapshot[];    // Rolling window (200)
  spatialStats: SpatialStats | null;    // Latest
  reproEvents: ReproEvent[];            // Rolling window (500)
  combatEvents: CombatEvent[];          // Rolling window (500)
  logEntries: DebugLogEntry[];          // Rolling window (500)

  // ── Entity Inspector ───────────────────────────────────────────────
  inspectedEntityId: number | null;
  inspectedEntity: FullEntityDetail | null;
  brainTrace: BrainTrace | null;        // Latest for inspected entity
  energyLedger: EnergyLedgerEntry[];    // Recent for inspected entity

  // ── World Overlay Toggles ──────────────────────────────────────────
  showSpatialGrid: boolean;
  showVisionCones: boolean;
  showVelocityVectors: boolean;
  showCollisionBoxes: boolean;
  showPheromoneOverlay: boolean;
  showEnergyHeatmap: boolean;
  showForceVectors: boolean;

  // ── Actions ────────────────────────────────────────────────────────
  toggle: () => void;
  setTab: (tab: DebugTab) => void;
  subscribe: (stream: DebugStreamType) => void;
  unsubscribe: (stream: DebugStreamType) => void;
  inspectEntity: (entityId: number) => void;
  clearInspection: () => void;
  traceEntity: (entityId: number) => void;
  untraceEntity: (entityId: number) => void;
  toggleOverlay: (overlay: string) => void;

  // ── Manipulation Actions (call REST endpoints) ─────────────────────
  spawnOrganism: (opts: SpawnOpts) => Promise<number>;
  killEntity: (entityId: number) => Promise<void>;
  teleportEntity: (entityId: number, x: number, y: number) => Promise<void>;
  injectEnergy: (entityId: number, amount: number) => Promise<void>;
  editGenes: (entityId: number, genes: Partial<OrganismGenes>) => Promise<void>;
  forceMutation: (entityId: number, gene?: string) => Promise<void>;
  pauseEntity: (entityId: number) => Promise<void>;
  resumeEntity: (entityId: number) => Promise<void>;
  forceReproduce: (entityId: number) => Promise<void>;
  triggerEvent: (eventType: string, opts?: EventOpts) => Promise<void>;
  spawnPlants: (x: number, y: number, count: number, radius: number) => Promise<void>;
  clearArea: (x: number, y: number, radius: number, entityType?: string) => Promise<void>;
  setSeason: (season: string, progress?: number) => Promise<void>;
  stepTicks: (count: number) => Promise<void>;
}

type DebugTab = 'performance' | 'energy' | 'brain' | 'spatial' | 'ecology' |
  'reproduction' | 'entities' | 'controls' | 'logs';
```

### B.3 Debug Panel Tabs

The debug panel has 9 tabs, each focused on a specific subsystem:

#### Performance Tab

| Element | Data Source | Update Rate |
|---------|------------|-------------|
| FPS counter | `requestAnimationFrame` timing | Every frame |
| TPS counter | `DEBUG_TICK_PROFILE` stream | Every tick |
| Per-system tick time bar chart | `DEBUG_TICK_PROFILE` stream | Every tick |
| Rolling tick time line chart | `tickProfiles[]` (200 ticks) | Every tick |
| Memory usage | `performance.memory` (Chrome) | Every 2s |
| Bandwidth in/out | Socket byte counters | Every 2s |
| Entity count breakdown | `DEBUG_TICK_PROFILE` → entityCount, plantCount | Every tick |
| Client render stats | Pixi.js renderer stats | Every frame |

#### Energy Tab

| Element | Data Source | Update Rate |
|---------|------------|-------------|
| Sankey flow diagram | `DEBUG_ENERGY_SNAPSHOT` (5 accounts + flows) | Every tick |
| Conservation drift indicator | `energySnapshot.conservationDrift` | Every tick |
| Drift status color | Green (drift < 0.1), Yellow (< 1.0), Red (≥ 1.0) | Every tick |
| Per-tick transfer log table | `energyTransfers[]` via REST query | On demand |
| Inspected entity energy ledger | `entityLedger[]` for inspected entity | Every tick (if traced) |
| Aggregate stats | Computed from snapshot history | Every 5s |

#### Brain Tab

| Element | Data Source | Update Rate |
|---------|------------|-------------|
| Live node graph (read-only) | `DEBUG_BRAIN_TRACE` stream | Every tick |
| Node color intensity | Activation values (0=dark, 1=bright) | Every tick |
| Synapse flow lines | Line thickness = `|weight × value|` | Every tick |
| Decision trace table | Output values with labels | Every tick |
| Activation sparklines | Last 50 ticks of each output node | Every tick |
| Input verification table | Input node labels + current values | Every tick |

The node graph uses the same layout as the Brain Editor (see `front-end.md` §6) but is read-only with activation visualization instead of editing controls.

#### Spatial Tab

| Element | Data Source | Update Rate |
|---------|------------|-------------|
| Cell occupancy heatmap | `DEBUG_SPATIAL_STATS` (400 cells) | Every 4th tick |
| Inspected entity vision cone | Entity position + vision params on canvas | Every tick |
| Collision check count | `spatialStats.totalCollisions` | Every 4th tick |
| Spatial query count | `spatialStats.totalQueries` | Every 4th tick |
| Avg entities per query | `spatialStats.avgEntitiesPerQuery` | Every 4th tick |
| Entity detection visualization | Highlighted entities in vision range | Every tick |

#### Ecology Tab

| Element | Data Source | Update Rate |
|---------|------------|-------------|
| Biome map overlay | Biome data from world state | Static (on load) |
| Season state + progress bar | World state | Every tick |
| 3-channel pheromone heatmaps | Pheromone grid data | Every 10th tick |
| Fungi patch overlay | Fungi positions | Every 10th tick |
| Active ecological events | Event list from world state | On event change |
| Plant density heatmap | Spatial query | Every 10th tick |
| Meat density heatmap | Spatial query | Every 10th tick |

#### Reproduction Tab

| Element | Data Source | Update Rate |
|---------|------------|-------------|
| Live birth/death/egg/extinction feed | `DEBUG_LIFECYCLE_EVENT` stream | On event |
| Feed filters | By species, event type | Client-side filter |
| Mutation log | `DEBUG_LIFECYCLE_EVENT` (type='mutation') | On event |
| Species population line chart | Population history (200 ticks) | Every tick |
| Lineage tree (10 generations) | REST query for entity lineage | On demand |
| Egg map overlay | Egg positions on world canvas | Every 10th tick |

#### Entities Tab

| Element | Description |
|---------|-------------|
| Searchable entity list | Columns: ID, type, species, position, energy, health, age |
| Sort controls | Click column headers to sort |
| Filter controls | By type (organism/plant/meat/egg), species, energy range, position |
| Click-to-inspect | Click row → `inspectEntity(id)` → opens Entity Inspector |
| Bulk operations | Select multiple → kill / teleport / inject energy |
| Pagination | 50 entities per page, server-side |

#### Controls Tab

| Section | Controls |
|---------|----------|
| **Simulation** | Pause / Resume / Step N ticks / TPS slider (1-200) |
| **Spawn Organism** | Species selector, position (click-on-map or x,y), gene sliders, energy input, spawn button |
| **Spawn Plants** | Position (click-on-map), count, radius, spawn button |
| **Manipulate** | Kill / Teleport / Inject Energy / Force Reproduce / Force Mutation / Pause/Resume (for inspected entity) |
| **Edit Genes** | Gene sliders for inspected entity (diet, speed, size, strength, defense, perception, brain, reproduction) |
| **Events** | Trigger buttons for each ecological event type, with x/y/radius/duration inputs |
| **Environment** | Season selector, time-of-day override, clear area tool |
| **Snapshots** | Force snapshot, list snapshots, restore snapshot |

#### Logs Tab

| Element | Description |
|---------|-------------|
| Log stream | Scrolling list of `DebugLogEntry` messages |
| Domain filter | Checkboxes for each `DebugLogDomain` (BRAIN, ENERGY, PHYSICS, etc.) |
| Level filter | Minimum level selector (TRACE / DEBUG / INFO / WARN / ERROR) |
| Auto-scroll | Toggle — when on, newest entries stay visible |
| Search | Text search across message + data fields |
| Pause stream | Freeze log display for reading (buffer continues) |

### B.4 Entity Inspector

When the debug panel is open, clicking any entity on the world canvas triggers entity inspection. The server returns a `FullEntityDetail` payload:

```typescript
interface FullEntityDetail {
  // ── Identity ───────────────────────────────────────────────────────
  entityId: number;
  entityType: 'organism' | 'plant' | 'meat' | 'egg';
  speciesId: number;
  speciesName: string;
  playerId?: string;

  // ── Spatial ────────────────────────────────────────────────────────
  x: number;
  y: number;
  angle: number;
  velocity: { x: number; y: number };

  // ── Organism Stats ─────────────────────────────────────────────────
  energy: number;
  maxEnergy: number;
  health: number;
  maxHealth: number;
  age: number;                 // Ticks alive
  maxAge: number;              // Lifespan in ticks

  // ── Genes ──────────────────────────────────────────────────────────
  genes: OrganismGenes;        // All gene values
  derivedStats: {              // Computed from genes
    moveSpeed: number;
    attackDamage: number;
    defense: number;
    visionRange: number;
    visionAngle: number;
    metabolismRate: number;
    reproductionCost: number;
    mouthType: 'filter' | 'circle' | 'chomper';
  };

  // ── Brain ──────────────────────────────────────────────────────────
  brainConfig: BrainConfig;    // Node/connection layout
  currentInputs: number[];     // Current brain input values
  currentOutputs: number[];    // Current brain output values

  // ── Lineage ────────────────────────────────────────────────────────
  parentId: number | null;
  generation: number;
  mutationCount: number;       // Accumulated mutations from original design

  // ── Energy Ledger (recent) ─────────────────────────────────────────
  recentLedger: EnergyLedgerEntry[];  // Last 10 ticks

  // ── State ──────────────────────────────────────────────────────────
  isPaused: boolean;           // Debug-paused
  currentAction: string;       // Current decision system output
  traits: string[];            // Active trait names
}
```

The Entity Inspector renders as a compact side panel (within the debug panel) with collapsible sections: Identity, Position/Movement, Stats, Genes, Brain, Lineage, Energy, State.

### B.5 Debug World Overlays

Seven new Pixi.js layers inserted into the rendering stack at layers 15-20, below the UIOverlayLayer (layer 21). Each is toggled independently via `debugStore` overlay booleans. All use low-alpha rendering to avoid obscuring the main world view.

| Layer | Name | Content | Alpha |
|-------|------|---------|-------|
| 15 | DebugSpatialGridLayer | 20×20 grid lines + cell occupancy heatmap (blue=empty → red=crowded) | 0.3 |
| 16 | DebugVisionConeLayer | All organism vision cones (faint). Inspected entity's cone rendered bright. | 0.15 / 0.6 |
| 17 | DebugVelocityLayer | Velocity arrows on each organism (length = speed) | 0.5 |
| 18 | DebugForceLayer | Force arrows: movement forces (green), collision (red), knockback (orange) | 0.4 |
| 19 | DebugCollisionLayer | Bounding radius circles around each entity | 0.25 |
| 20 | DebugPheromoneLayer | 3-channel pheromone heatmap overlay (R/G/B for each channel) | 0.3 |

Additionally, the DebugEnergyHeatmapLayer renders at layer 15 (mutually exclusive with SpatialGridLayer via toggle):
- Per-cell energy density heatmap (green=low → red=high)
- Sums organism + plant + meat energy per spatial cell

**Component tree** (within DebugOverlay):

```
DebugOverlay
  DebugPanel
    DebugTabBar
    PerformanceTab
    EnergyTab
    BrainTab
    SpatialTab
    EcologyTab
    ReproductionTab
    EntitiesTab
    ControlsTab
    LogsTab
  EntityInspector (conditional: inspectedEntityId !== null)
    IdentitySection
    PositionSection
    StatsSection
    GenesSection
    BrainSection
    LineageSection
    EnergySection
    StateSection
  DebugSpatialGridLayer (Pixi)
  DebugVisionConeLayer (Pixi)
  DebugVelocityLayer (Pixi)
  DebugForceLayer (Pixi)
  DebugCollisionLayer (Pixi)
  DebugPheromoneLayer (Pixi)
  DebugEnergyHeatmapLayer (Pixi)
```

---

## C. Production Monitoring Dashboard

### C.1 Production vs Dev Feature Matrix

| Feature | Production (Admin) | Dev (Full Debug) |
|---------|-------------------|------------------|
| Tick time charts | Yes | Yes |
| FPS / TPS counters | Yes | Yes |
| Entity counts | Yes | Yes |
| Energy conservation check | Yes | Yes |
| Energy distribution (5 accounts) | Yes | Yes |
| Species population chart | Yes | Yes |
| Memory / bandwidth stats | Yes | Yes |
| Server logs (WARN+ only) | Yes | Yes (all levels) |
| Entity inspector (read-only) | Yes (no brain trace) | Yes (with brain trace) |
| Mutation summary | Yes | Yes |
| TPS slider | Yes | Yes |
| Snapshots | Yes | Yes |
| Spatial/vision/velocity overlays | No | Yes |
| Brain trace (per-node activations) | No | Yes |
| Per-entity energy ledger | No | Yes |
| Spawn / Kill / Teleport entities | No | Yes |
| Inject energy | No | Yes |
| Edit genes | No | Yes |
| Force mutation / reproduction | No | Yes |
| Trigger ecological events | No | Yes |
| Pause / Resume entities | No | Yes |
| Step ticks | No | Yes |
| Clear area | No | Yes |

**Gating**: The `DebugConfig` includes a `productionMode` boolean (derived from `NODE_ENV`). When `productionMode === true`, manipulation endpoints return `403 Forbidden` and overlay layers are not registered. The debug panel shows only monitoring tabs (Performance, Energy, Reproduction, Entities read-only, Logs WARN+).

### C.2 Health Indicator Bar

Displayed in admin screens (`AdminDashboardScreen`, `AdminWorldDetailScreen`):

```
Health: [OK]  TPS: 40.0/40  Tick: 2.1ms/25ms  Drift: 0.003  Mem: 340MB
Orgs: 847  Plants: 5,231  Uptime: 14h 22m  Clients: 12
```

**Alert thresholds**:

| Metric | Green | Yellow | Red |
|--------|-------|--------|-----|
| TPS | ≥ 38 | ≥ 30 | < 30 |
| Tick time | < 10 ms | < 20 ms | ≥ 20 ms |
| Conservation drift | < 0.1 | < 1.0 | ≥ 1.0 |
| Memory | < 400 MB | < 600 MB | ≥ 600 MB |

**Integration points**:
- `GET /admin/worlds/:id/metrics` — gains production debug metrics (tick profiles, energy snapshot, entity counts)
- `AdminDashboardScreen` — gains health bar component at the top
- `AdminWorldDetailScreen` → `DevToolsTab` — gains "Debug Console" button that opens the full debug panel

---

## D. Debug WebSocket Protocol

Debug messages use the 0xD0-0xDF range in the existing binary WebSocket protocol (see `architecture.md` §4 MessageType enum).

### D.1 Message Types

| Code | Direction | Name | Payload |
|------|-----------|------|---------|
| `0xD0` | C→S | `DEBUG_SUBSCRIBE` | `streamBitmask:u16` |
| `0xD1` | C→S | `DEBUG_UNSUBSCRIBE` | `streamBitmask:u16` |
| `0xD2` | C→S | `DEBUG_INSPECT_ENTITY` | `entityId:u16` |
| `0xD3` | C→S | `DEBUG_TRACE_ENTITY` | `entityId:u16, enable:u8` |
| `0xD4` | C→S | `DEBUG_QUERY` | `queryType:u8, params...` |
| `0xD8` | S→C | `DEBUG_TICK_PROFILE` | `tick:u32, systemCount:u8, [{systemId:u8, ms:f32}...]` |
| `0xD9` | S→C | `DEBUG_ENERGY_SNAPSHOT` | `tick:u32, 7×f32` (total/free/plant/meat/org/egg/drift) |
| `0xDA` | S→C | `DEBUG_ENTITY_DETAIL` | JSON `FullEntityDetail` |
| `0xDB` | S→C | `DEBUG_BRAIN_TRACE` | `tick:u32, entityId:u16, nodeCount:u16, activations:f32[], flows` |
| `0xDC` | S→C | `DEBUG_SPATIAL_STATS` | `tick:u32, 400×u16 cell counts, stats` |
| `0xDD` | S→C | `DEBUG_LIFECYCLE_EVENT` | JSON `ReproEvent` |
| `0xDE` | S→C | `DEBUG_COMBAT_EVENT` | `tick:u32, attacker:u16, defender:u16, damage:f32, flags:u8` |
| `0xDF` | S→C | `DEBUG_LOG_ENTRY` | JSON `DebugLogEntry` |

### D.2 Stream Bitmask

The subscribe/unsubscribe messages use a 16-bit bitmask to select which debug streams the client wants:

| Bit | Stream | Corresponding S→C Message |
|-----|--------|--------------------------|
| `0x0001` | `TICK_PROFILE` | `DEBUG_TICK_PROFILE` (0xD8) |
| `0x0002` | `ENERGY` | `DEBUG_ENERGY_SNAPSHOT` (0xD9) |
| `0x0004` | `ENTITY_TRACE` | `DEBUG_BRAIN_TRACE` (0xDB) |
| `0x0008` | `SPATIAL` | `DEBUG_SPATIAL_STATS` (0xDC) |
| `0x0010` | `LIFECYCLE` | `DEBUG_LIFECYCLE_EVENT` (0xDD) |
| `0x0020` | `COMBAT` | `DEBUG_COMBAT_EVENT` (0xDE) |
| `0x0040` | `LOGS` | `DEBUG_LOG_ENTRY` (0xDF) |

### D.3 Message Encoding Details

**DEBUG_TICK_PROFILE** (0xD8) — 69 bytes typical:
```
[0xD8] [tick:u32] [systemCount:u8]
  For each system: [systemId:u8] [durationMs:f32]
```
With 12 systems: 1 + 4 + 1 + (12 × 5) = 66 bytes. Plus 3 bytes for entity/plant counts: 69 bytes.

**DEBUG_ENERGY_SNAPSHOT** (0xD9) — 32 bytes:
```
[0xD9] [tick:u32] [total:f32] [free:f32] [plant:f32] [meat:f32] [org:f32] [egg:f32] [drift:f32]
```
1 + 4 + (7 × 4) = 33 bytes.

**DEBUG_BRAIN_TRACE** (0xDB) — 130-200 bytes typical:
```
[0xD8] [tick:u32] [entityId:u16] [inputCount:u8] [hiddenCount:u8] [outputCount:u8]
  [inputValues: inputCount × f32]
  [hiddenValues: hiddenCount × f32]
  [outputValues: outputCount × f32]
  [flowCount:u8] For each flow: [from:u8] [to:u8] [flow:f32]
```
With 14 inputs + 8 hidden + 7 outputs + 10 flows: 1 + 4 + 2 + 3 + (29 × 4) + 1 + (10 × 6) = 187 bytes.

**DEBUG_SPATIAL_STATS** (0xDC) — ~820 bytes, sent every 4th tick:
```
[0xDC] [tick:u32] [cellCounts: 400 × u16] [totalQueries:u32] [totalCollisions:u32] [avgPerQuery:f32]
```
1 + 4 + 800 + 4 + 4 + 4 = 817 bytes.

**DEBUG_COMBAT_EVENT** (0xDE) — 15 bytes:
```
[0xDE] [tick:u32] [attacker:u16] [defender:u16] [damage:f32] [flags:u8]
```
Flags: bit 0 = venom applied, bit 1 = defender killed.

### D.4 Bandwidth Budget

| Stream | Per-tick bytes | At 40 TPS | At 10 Hz (every 4th tick) |
|--------|---------------|-----------|--------------------------|
| TICK_PROFILE | 69 B | 2,760 B/s | — |
| ENERGY_SNAPSHOT | 33 B | 1,320 B/s | — |
| BRAIN_TRACE (1 entity) | 187 B | 7,480 B/s | — |
| SPATIAL_STATS | — | — | 2,043 B/s (817 × 2.5/s) |
| LIFECYCLE_EVENT | ~100 B avg | ~500 B/s (5 events/s avg) | — |
| COMBAT_EVENT | 15 B | ~600 B/s (40 events/s peak) | — |
| LOG_ENTRY | ~200 B avg | ~3,000 B/s (15 logs/s avg) | — |

**Worst case (all streams, 1 traced entity)**: ~17.7 KB/s.
**Typical (performance + energy + 1 trace)**: ~11.6 KB/s.

**Limits**:
- Max 3 concurrent debug subscribers per world (additional connections get `403`)
- Non-admin `DEBUG_SUBSCRIBE` messages are silently ignored
- Debug broadcast loop runs alongside existing 20 Hz entity broadcast, not inside it

---

## E. Debug REST API

All endpoints under `/api/debug/` require admin JWT authentication. The `DebugRouter` is registered alongside `AdminRouter` in the WebSocket server setup.

### E.1 Entity Inspection

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/debug/worlds/:worldId/entities` | List entities (filterable by type, species, position, energy range). Returns paginated list. Query params: `type`, `speciesId`, `minEnergy`, `maxEnergy`, `x`, `y`, `radius`, `page`, `limit` |
| `GET` | `/api/debug/worlds/:worldId/entities/:entityId` | Full `FullEntityDetail` for one entity |
| `GET` | `/api/debug/worlds/:worldId/entities/:entityId/brain` | Brain config + current activations + recent brain traces |
| `GET` | `/api/debug/worlds/:worldId/entities/:entityId/ledger` | Energy ledger (last N ticks). Query param: `ticks` (default 50) |
| `GET` | `/api/debug/worlds/:worldId/entities/:entityId/lineage` | Parent chain up to 10 generations |

### E.2 Entity Manipulation

| Method | Path | Body | Description |
|--------|------|------|-------------|
| `POST` | `.../spawn` | `{ x, y, speciesId?, genes?, brain?, energy? }` | Spawn organism. Returns `{ entityId }` |
| `POST` | `.../entities/:id/kill` | — | Kill entity (normal death path → meat) |
| `POST` | `.../entities/:id/teleport` | `{ x, y }` | Teleport entity |
| `POST` | `.../entities/:id/inject-energy` | `{ amount }` | Inject energy (bypasses conservation) |
| `PUT` | `.../entities/:id/genes` | `{ genes: Partial<OrganismGenes> }` | Edit genes, triggers stat recalc |
| `POST` | `.../entities/:id/force-mutation` | `{ gene? }` | Force natural-style mutation |
| `POST` | `.../entities/:id/pause` | — | Pause entity (skip in tick pipeline) |
| `POST` | `.../entities/:id/resume` | — | Resume paused entity |
| `POST` | `.../entities/:id/force-reproduce` | — | Force reproduction (bypass energy/maturity) |

### E.3 World Manipulation

| Method | Path | Body | Description |
|--------|------|------|-------------|
| `POST` | `.../trigger-event` | `{ eventType, x?, y?, radius?, duration? }` | Force ecological event |
| `POST` | `.../spawn-plants` | `{ x, y, count, radius }` | Scatter plants in area |
| `POST` | `.../clear-area` | `{ x, y, radius, entityType? }` | Remove entities in radius |
| `PUT` | `.../season` | `{ season, progress? }` | Immediate season change |
| `POST` | `.../step` | `{ count }` | Pause, advance N ticks, remain paused |

### E.4 Queries

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `.../energy` | Current energy snapshot (all 5 accounts + drift) |
| `GET` | `.../energy/history?ticks=200` | Energy snapshot history for charts |
| `GET` | `.../spatial` | Current spatial hash statistics |
| `GET` | `.../tick-profile` | Latest tick timing breakdown |
| `GET` | `.../events` | Recent lifecycle events (births, deaths, etc.) |
| `GET` | `.../species` | Species population statistics |
| `GET` | `.../logs?domain=&level=&limit=` | Filtered server logs. Defaults: all domains, INFO+, limit 100 |

### E.5 Configuration

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/debug/config` | Current `DebugConfig` |
| `PUT` | `/api/debug/config` | Update debug configuration at runtime (toggle systems, change history depth, etc.) |

All `.../` paths above are shorthand for `/api/debug/worlds/:worldId/`.

---

## F. Testing Utilities

### F.1 Deterministic Replay

All simulation randomness is routed through a seeded PRNG to enable deterministic replay:

```typescript
// Seeded PRNG using xorshift32 — fast, deterministic, good distribution
class DeterministicRng {
  private state: number;

  constructor(seed: number) {
    this.state = seed || 1;
  }

  next(): number {
    this.state ^= this.state << 13;
    this.state ^= this.state >> 17;
    this.state ^= this.state << 5;
    return (this.state >>> 0) / 0xFFFFFFFF;  // [0, 1)
  }

  nextInt(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  nextFloat(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
}
```

**Replay recording**:

```typescript
interface ReplayFrame {
  tick: number;
  rngState: number;           // PRNG state at start of tick
  externalInputs: ExternalInput[];  // Player commands received this tick
}

interface ExternalInput {
  type: 'deploy' | 'viewport' | 'join' | 'leave' | 'retire';
  playerId: string;
  data: unknown;
}

class ReplayRecorder {
  private frames: ReplayFrame[] = [];
  private maxFrames: number = 10_000;  // ~4 minutes at 40 TPS

  recordFrame(tick: number, rngState: number, inputs: ExternalInput[]): void;
  getReplay(): ReplayFrame[];
  clear(): void;
}
```

**Replay playback**:

```typescript
class ReplayPlayer {
  async replay(
    worldConfig: WorldConfig,
    frames: ReplayFrame[],
    onDivergence?: (tick: number, field: string, expected: unknown, actual: unknown) => void,
  ): Promise<ReplayResult>;
}

interface ReplayResult {
  success: boolean;
  ticksPlayed: number;
  divergences: { tick: number; field: string; expected: unknown; actual: unknown }[];
}
```

**REST endpoint**: `POST /api/debug/worlds/:worldId/replay` — starts replay of the last N recorded ticks. Returns divergence report.

### F.2 Automated Balance Scenarios

```typescript
interface TestScenario {
  name: string;
  description: string;
  setup: (world: World) => void;           // Configure initial state
  runForTicks: number;                       // How many ticks to simulate
  assertions: (world: World) => TestResult; // Verify outcomes
}

interface TestResult {
  passed: boolean;
  message: string;
  metrics?: Record<string, number>;         // Measured values for reporting
}
```

**Predefined scenarios**:

| Scenario | Setup | Ticks | Assertion |
|----------|-------|-------|-----------|
| `energy_conservation_stress` | 500 organisms (mixed species), normal plants | 2,000 | `conservationDrift < 1.0` |
| `herbivore_vs_carnivore_balance` | 50 herbivores + 20 carnivores, normal biome | 5,000 | Both species have population > 0 (coexistence) |
| `brain_regression_basic_herbivore` | 1 template herbivore + 1 nearby plant | 100 | Herbivore moves toward and eats plant |
| `spatial_hash_wraparound` | 1 organism at (499, 499), 1 plant at (1, 1) | 10 | Organism detects plant via toroidal wrapping; spatial hash returns correct results |
| `starvation_cascade` | 200 organisms, 0 plants | 500 | All organisms die; total energy unchanged (conservation) |
| `reproduction_chain` | 1 organism with max energy, abundant plants | 2,000 | Population increases; all offspring have valid genes |

**REST endpoints**:
- `POST /api/debug/test/run` — `{ scenarioName }` → runs scenario, returns `TestResult`
- `GET /api/debug/test/scenarios` — list available scenario names + descriptions

### F.3 Energy Conservation Validator

Runs automatically every 100 ticks when `energyAudit` is enabled:

```typescript
function auditEnergy(world: World): EnergyAuditResult {
  const accounts = {
    free: world.energySystem.getFreeEnergy(),
    plant: sumEnergy(world.plants),
    meat: sumEnergy(world.meatPellets),
    organism: sumEnergy(world.organisms),
    egg: sumEnergy(world.eggs),
  };

  const actualTotal = Object.values(accounts).reduce((a, b) => a + b, 0);
  const expectedTotal = world.energySystem.getExpectedTotal();
  const drift = Math.abs(actualTotal - expectedTotal);

  const anomalies: EnergyAnomaly[] = [];

  // Check for negative energy
  for (const [account, value] of Object.entries(accounts)) {
    if (value < 0) anomalies.push({ type: 'negative_energy', account, value });
  }

  // Check for NaN
  for (const [account, value] of Object.entries(accounts)) {
    if (Number.isNaN(value)) anomalies.push({ type: 'nan_energy', account, value: 0 });
  }

  // Check individual entities for anomalies
  for (const org of world.organisms.values()) {
    if (org.energy < 0) anomalies.push({ type: 'negative_entity_energy', entityId: org.id, value: org.energy });
    if (Number.isNaN(org.energy)) anomalies.push({ type: 'nan_entity_energy', entityId: org.id, value: 0 });
    if (org.energy > org.maxEnergy * 2) anomalies.push({ type: 'excessive_entity_energy', entityId: org.id, value: org.energy });
  }

  // Check for excessive drift
  if (drift > 1.0) anomalies.push({ type: 'excessive_drift', account: 'total', value: drift });

  return { actualTotal, expectedTotal, drift, accounts, anomalies, tick: world.currentTick };
}

interface EnergyAuditResult {
  tick: number;
  actualTotal: number;
  expectedTotal: number;
  drift: number;
  accounts: Record<string, number>;
  anomalies: EnergyAnomaly[];
}

interface EnergyAnomaly {
  type: 'negative_energy' | 'nan_energy' | 'negative_entity_energy' | 'nan_entity_energy' |
        'excessive_entity_energy' | 'excessive_drift' | 'orphaned_energy';
  account?: string;
  entityId?: number;
  value: number;
}
```

**REST endpoint**: `GET /api/debug/worlds/:worldId/energy` — returns full `EnergyAuditResult`.

### F.4 Brain Regression Tests

Verify that standard brain configurations produce expected behaviors:

```typescript
interface BrainTestCase {
  name: string;
  brainConfig: BrainConfig;          // Brain to test
  inputs: Record<string, number>;    // Named input values
  expectedOutputRanges: {            // Output node → [min, max] expected range
    [outputName: string]: [number, number];
  };
}
```

**Predefined tests**:

| Test | Brain | Input Setup | Expected Output |
|------|-------|-------------|-----------------|
| `herbivore_turns_toward_plant` | Template herbivore brain | plantAngle=0.3, plantDist=0.5 | turnOutput ∈ [0.2, 0.8] (toward plant) |
| `carnivore_attacks_smaller` | Template carnivore brain | preyAngle=0.1, preyDist=0.3, preyRelSize=0.6 | attackOutput ∈ [0.5, 1.0] |
| `prey_flees_larger` | Template herbivore brain | predatorAngle=0.2, predatorDist=0.3, predatorRelSize=1.5 | speedOutput ∈ [0.7, 1.0], turnOutput away from predator |
| `idle_no_stimulus` | Template herbivore brain | All inputs = 0 | speedOutput ∈ [0.0, 0.3], attackOutput ∈ [0.0, 0.1] |

**REST endpoint**: `GET /api/debug/test/brain-regression` — runs all brain tests, returns pass/fail for each with actual output values.

---

## G. Implementation Notes

### G.1 Performance Overhead

| Component | Overhead per tick | Notes |
|-----------|-------------------|-------|
| `profileAndRun()` (12 systems) | ~0.06 ms | 12 × `performance.now()` calls |
| Energy transfer logging | ~0.02 ms | Array push per transfer (~50/tick avg) |
| Brain trace (per entity) | ~0.01 ms | Copy 29 floats + top-10 flow sort |
| Spatial stats | ~0.02 ms | Iterate 400 cells |
| Energy snapshot | ~0.01 ms | 7 float reads |
| Ring buffer management | ~0.005 ms | Pointer arithmetic |
| **Total** | **~0.1 ms** | **< 1% of 25 ms tick budget** |

All debug data structures use pre-allocated typed arrays or fixed-size ring buffers. No heap allocation during hot path recording. The `DebugCollector` is designed to be always-on with negligible impact.

### G.2 Security Considerations

- All debug REST endpoints require admin JWT (`role = 'admin'` claim)
- Debug WS messages from non-admin sessions are silently dropped (no error response to avoid information leakage)
- Max 3 concurrent debug WS subscribers per world (prevents DoS via debug streams)
- Manipulation commands (`spawnOrganism`, `killEntity`, `injectEnergy`, etc.) are disabled in production mode (`NODE_ENV=production`)
- `injectEnergy` is explicitly logged as a conservation violation in the energy audit trail
- Gene editing and forced mutations are logged with admin user ID for audit

### G.3 File Organization

```
server/src/
  debug/
    debug-collector.ts        — DebugCollector class (ring buffers, recording methods)
    debug-config.ts           — DebugConfig interface, env var loading
    debug-commands.ts         — DebugCommands implementation
    debug-logger.ts           — DebugLogger (structured logging)
    debug-router.ts           — REST API route handlers
    debug-ws-handler.ts       — WebSocket debug message handler
    replay/
      deterministic-rng.ts    — DeterministicRng class
      replay-recorder.ts      — ReplayRecorder
      replay-player.ts        — ReplayPlayer
    testing/
      test-runner.ts          — TestScenario executor
      scenarios/              — Predefined test scenarios
      brain-regression.ts     — BrainTestCase definitions + runner
      energy-validator.ts     — auditEnergy() function

client/src/
  features/debug/             — Lazy-loaded debug chunk
    stores/
      debugStore.ts           — Debug Zustand store
    components/
      DebugOverlay.tsx         — Root debug overlay
      DebugPanel.tsx           — Tab container
      EntityInspector.tsx      — Entity detail panel
      tabs/
        PerformanceTab.tsx
        EnergyTab.tsx
        BrainTab.tsx
        SpatialTab.tsx
        EcologyTab.tsx
        ReproductionTab.tsx
        EntitiesTab.tsx
        ControlsTab.tsx
        LogsTab.tsx
    layers/                    — Pixi.js debug overlay layers
      DebugSpatialGridLayer.ts
      DebugVisionConeLayer.ts
      DebugVelocityLayer.ts
      DebugForceLayer.ts
      DebugCollisionLayer.ts
      DebugPheromoneLayer.ts
      DebugEnergyHeatmapLayer.ts
    protocol/
      debug-messages.ts        — Encode/decode debug WS messages
```
