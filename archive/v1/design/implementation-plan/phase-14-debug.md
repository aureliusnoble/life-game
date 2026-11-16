# Phase 14 — Debug Infrastructure

Server-side DebugCollector, client-side debug panel, debug overlays, entity inspector, and testing utilities.

> **Before you start this phase**, read the general guidance in [`README.md`](./README.md).

### Phase 14 Guidance

**Read these design docs first:**
- `debug.md` — **Read the entire document.** This is the complete specification for the debug infrastructure: server-side DebugCollector, data structures, WebSocket debug protocol, REST API, client debug panel with 9 tabs, overlay layers, and testing utilities.
- `architecture.md` Section 7 (Security) — debug endpoints are admin-only
- `components/front-end.md` Section 4 (DebugStore)
- `components/game-components.md` §Tick Processing Order — 17-step tick sequence and per-module timing budget (use for profiling step names and performance targets)

**Prerequisites:**
- Phases 2-6 must be complete (server simulation and networking — the DebugCollector wraps the tick pipeline, and debug data is served over WebSocket/REST).
- Phase 8 must be complete (client app — the debug panel is a React component).
- Phase 9 should be complete (Pixi.js renderer — debug overlays are rendered on the world canvas).

**Ask the manager before starting:**
- [ ] Confirm an admin account exists in Supabase (all debug endpoints and the debug panel require admin role)

**Important implementation note:**
The DebugCollector must have near-zero overhead when enabled. Use ring buffers with pre-allocated capacity, not growing arrays. The memory budget is ~600 KB for 200-tick history. Profile `profileAndRun()` itself to ensure it adds < 0.1ms per tick.

**QA handoff for this phase:**
When done, tell the manager: "Log in as admin, open `/world`. Verify: (1) A debug panel toggle appears (only for admins), (2) Open the debug panel — it should show 9 tabs, (3) Performance tab: sparklines showing per-system tick timing that updates live, (4) Energy tab: line chart showing 5 energy accounts over time — the total should be flat (conservation), (5) Click an organism then open Brain Inspector tab — you should see live input/output bar values, (6) Overlays tab: toggle 'Spatial Grid' — a grid should appear over the world canvas, toggle 'Vision Cones' — translucent arcs should appear around organisms, (7) Commands tab: type `spawn herbivore 250 250` — an organism should appear at the center of the world."

---

## Step 14.1 — DebugCollector (Server-Side)

### What You're Implementing

The `DebugCollector` class: central server-side debug data collector using fixed-size ring buffers. Replaces `TickProfiler`. Collects: per-system tick timing, energy snapshots, energy transfer logs, spatial hash stats, reproduction events, combat events, per-entity brain traces, and per-entity energy ledgers.

### Design References

- `debug.md` Section A (Server-Side Debug Infrastructure) — `DebugConfig`, `DebugCollector` class with full interface, all data structures (`TickProfile`, `EnergySnapshot`, `EnergyTransferLog`, `BrainTrace`, `SpatialStats`, `ReproEvent`, `CombatEvent`, `EnergyLedgerEntry`).
- `debug.md` Section A.2 — Ring buffer storage, memory budget (~600 KB total for 200-tick history).
- `debug.md` Section A.1 — `DebugConfig` with per-system toggles and environment variables.

### Implementation Details

```typescript
class DebugCollector {
  private tickProfiles: RingBuffer<TickProfile>;
  private energySnapshots: RingBuffer<EnergySnapshot>;
  private energyTransfers: RingBuffer<EnergyTransferLog>;
  private spatialSnapshots: RingBuffer<SpatialStats>;
  private reproductionEvents: RingBuffer<ReproEvent>;
  private combatEvents: RingBuffer<CombatEvent>;
  private brainTraces: Map<number, RingBuffer<BrainTrace>>;
  private entityLedgers: Map<number, RingBuffer<EnergyLedgerEntry>>;
  private tracedEntities: Set<number>;

  constructor(config: DebugConfig) {
    this.tickProfiles = new RingBuffer(config.historyDepth);
    this.energySnapshots = new RingBuffer(config.historyDepth);
    this.energyTransfers = new RingBuffer(2000);  // cap at 2000 entries
    // ... initialize all buffers
  }

  profileAndRun(systemName: string, fn: () => void): void {
    if (!this.config.tickProfiler) { fn(); return; }
    const start = process.hrtime.bigint();
    fn();
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    this.currentTickProfile.systems.push({ name: systemName, durationMs });
  }

  recordEnergyTransfer(log: EnergyTransferLog): void { ... }
  recordBrainTrace(entityId: number, trace: BrainTrace): void { ... }
  traceEntity(entityId: number): boolean { ... }
  untraceEntity(entityId: number): void { ... }

  // Queries
  getTickProfiles(count?: number): TickProfile[] { ... }
  getEnergySnapshots(count?: number): EnergySnapshot[] { ... }
  getBrainTrace(entityId: number): BrainTrace | null { ... }
  getEntityLedger(entityId: number, count?: number): EnergyLedgerEntry[] { ... }
}
```

#### Integration with World.tick()

Wrap each system call with `debugCollector.profileAndRun()`:

```typescript
tick(): void {
  this.debugCollector.beginTick(this.currentTick);
  this.debugCollector.profileAndRun('SenseSystem', () => this.senseSystem.update(...));
  this.debugCollector.profileAndRun('BrainSystem', () => this.brainSystem.update(...));
  // ... all 12 systems
  this.debugCollector.endTick(this.currentTick, this.organisms.length, this.pellets.length);
}
```

#### Structured Debug Logging (`debug.md` §A.5)

`DebugLogger` provides domain-tagged, level-filtered structured logging via a ring buffer of 2,000 entries (~400 KB). Entries are queryable via REST (`GET .../logs`) and streamable via WebSocket (`DEBUG_LOG_ENTRY` 0xDF).

```typescript
enum DebugLogLevel {
  TRACE = 0,    // Per-tick details (brain activations, spatial queries)
  DEBUG = 1,    // System events (entity spawned, energy transfer)
  INFO  = 2,    // Lifecycle events (species created, season change)
  WARN  = 3,    // Anomalies (energy drift > 0.1, tick overrun)
  ERROR = 4,    // Failures (NaN energy, entity not found)
}

enum DebugLogDomain {
  BRAIN = 'BRAIN', ENERGY = 'ENERGY', PHYSICS = 'PHYSICS',
  COMBAT = 'COMBAT', REPRO = 'REPRO', GENETICS = 'GENETICS',
  ECOLOGY = 'ECOLOGY', NETWORK = 'NETWORK', PERSIST = 'PERSIST',
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

Place `DebugLogger` in `server/src/debug/debug-logger.ts`. Each simulation system calls `debugLogger.log(level, domain, message, data?)`. Production monitoring shows only WARN+ level entries.

### Unit Tests

- **RingBuffer**: Insert beyond capacity → oldest entries evicted. Query returns most recent N.
- **profileAndRun**: Records correct system name and duration > 0ms.
- **Energy snapshot**: Records all 7 fields (total, free, plant, meat, organism, egg, drift).
- **Entity tracing**: Max 10 traced entities. 11th `traceEntity()` returns false.
- **Brain trace**: Records input/output/hidden values for traced entity.
- **DebugLogger**: Log entry with level=WARN appears in ring buffer with correct domain and tick.
- **DebugLogger filtering**: Query with `domain=ENERGY, level=WARN` returns only matching entries.

### Integration Tests

- Run 100 ticks with DebugCollector enabled. Query tick profiles: verify 100 entries.
- Trace entity, run 10 ticks, query brain traces: verify 10 traces with correct values.
- Run 50 ticks, query logs with domain=ENERGY: verify energy-related log entries present.

### QA Checklist

- [ ] DebugCollector has negligible overhead when enabled (~0.1ms per tick)
- [ ] Ring buffers don't grow beyond configured depth
- [ ] All 12 systems appear in tick profile with correct timing
- [ ] Energy conservation drift is tracked (should be ~0)
- [ ] Entity tracing produces detailed brain/energy data
- [ ] DebugLogger entries appear in Logs tab with correct level and domain
- [ ] Log filtering by domain and level works correctly

---

## Step 14.2 — Debug WebSocket & REST API

### What You're Implementing

Debug communication: WebSocket protocol for streaming debug data (0xD0-0xDF message range), REST API endpoints for one-shot queries and entity manipulation commands.

### Design References

- `debug.md` Section D (Debug WebSocket Protocol) — Message types 0xD0-0xDF for debug streams (tick profiles, energy, spatial, brain trace, etc.).
- `debug.md` Section E (Debug REST API) — GET/POST endpoints for debug queries, entity manipulation (spawn, kill, teleport, inject energy, edit genes), world manipulation (set time, set season, adjust TPS).

### Implementation Details

#### Debug WebSocket Messages (`debug.md` §D.1-D.4)

**Client→Server (C→S)** — Subscribe, inspect, trace:

```typescript
// C→S message types (0xD0-0xD4)
enum DebugClientMsg {
  SUBSCRIBE        = 0xD0,  // streamBitmask:u16 — subscribe to debug streams
  UNSUBSCRIBE      = 0xD1,  // streamBitmask:u16 — unsubscribe from streams
  INSPECT_ENTITY   = 0xD2,  // entityId:u16 — request FullEntityDetail
  TRACE_ENTITY     = 0xD3,  // entityId:u16, enable:u8 — toggle brain/energy tracing
  QUERY            = 0xD4,  // queryType:u8, params... — one-shot data query
}

// Stream bitmask bits for SUBSCRIBE/UNSUBSCRIBE
const STREAM_TICK_PROFILE  = 0x0001;  // → DEBUG_TICK_PROFILE
const STREAM_ENERGY        = 0x0002;  // → DEBUG_ENERGY_SNAPSHOT
const STREAM_ENTITY_TRACE  = 0x0004;  // → DEBUG_BRAIN_TRACE
const STREAM_SPATIAL       = 0x0008;  // → DEBUG_SPATIAL_STATS
const STREAM_LIFECYCLE     = 0x0010;  // → DEBUG_LIFECYCLE_EVENT
const STREAM_COMBAT        = 0x0020;  // → DEBUG_COMBAT_EVENT
const STREAM_LOGS          = 0x0040;  // → DEBUG_LOG_ENTRY
```

**Server→Client (S→C)** — Streaming debug data:

```typescript
// S→C message types (0xD8-0xDF)
enum DebugServerMsg {
  TICK_PROFILE     = 0xD8,  // tick:u32, systemCount:u8, [{systemId:u8, ms:f32}...] — 69 bytes
  ENERGY_SNAPSHOT  = 0xD9,  // tick:u32, 7×f32 (total/free/plant/meat/org/egg/drift) — 33 bytes
  ENTITY_DETAIL    = 0xDA,  // JSON FullEntityDetail — response to INSPECT_ENTITY
  BRAIN_TRACE      = 0xDB,  // tick:u32, entityId:u16, activations:f32[], flows — ~187 bytes
  SPATIAL_STATS    = 0xDC,  // tick:u32, 400×u16 cell counts, stats — ~817 bytes, every 4th tick
  LIFECYCLE_EVENT  = 0xDD,  // JSON ReproEvent
  COMBAT_EVENT     = 0xDE,  // tick:u32, attacker:u16, defender:u16, damage:f32, flags:u8 — 15 bytes
  LOG_ENTRY        = 0xDF,  // JSON DebugLogEntry
}
```

**Bandwidth budget** (`debug.md` §D.4): ~17.7 KB/s worst case (all streams + 1 traced entity). Typical: ~11.6 KB/s. Max **3 concurrent debug subscribers** per world — additional connections get 403. Non-admin `DEBUG_SUBSCRIBE` messages silently ignored.

Debug broadcast loop runs alongside existing 20 Hz entity broadcast, not inside it.

#### Debug REST API (`debug.md` §E.1-E.5)

All endpoints under `/api/debug/worlds/:worldId/` require admin JWT. Non-admin requests receive 403. `DebugRouter` registered alongside `AdminRouter`.

**Entity Inspection (§E.1)**:
```
GET  .../entities                          # Paginated entity list. Params: type, speciesId, minEnergy, maxEnergy, x, y, radius, page, limit (50/page)
GET  .../entities/:id                      # Full FullEntityDetail for one entity
GET  .../entities/:id/brain                # Brain config + current activations + recent traces
GET  .../entities/:id/ledger?ticks=50      # Energy ledger (last N ticks)
GET  .../entities/:id/lineage              # Parent chain up to 10 generations
```

**Entity Manipulation (§E.2)** — disabled in production mode:
```
POST .../spawn                             { x, y, speciesId?, genes?, brain?, energy? }
POST .../entities/:id/kill                 # Normal death path → meat pellet
POST .../entities/:id/teleport             { x, y }
POST .../entities/:id/inject-energy        { amount }  # Bypasses conservation — logged in audit
PUT  .../entities/:id/genes                { genes: Partial<OrganismGenes> }
POST .../entities/:id/force-mutation       { gene? }   # Natural-style mutation
POST .../entities/:id/pause                # Skip in tick pipeline, frozen in place
POST .../entities/:id/resume               # Resume paused entity
POST .../entities/:id/force-reproduce      # Bypass energy/maturity, create egg immediately
```

**World Manipulation (§E.3)** — disabled in production mode:
```
POST .../trigger-event                     { eventType, x?, y?, radius?, duration? }
POST .../spawn-plants                      { x, y, count, radius }
POST .../clear-area                        { x, y, radius, entityType? }
PUT  .../season                            { season, progress? }
POST .../step                              { count }  # Pause, advance N ticks, remain paused
```

**Queries (§E.4)**:
```
GET  .../energy                            # Current energy snapshot (5 accounts + drift)
GET  .../energy/history?ticks=200          # Energy snapshot history for charts
GET  .../spatial                           # Current spatial hash statistics
GET  .../tick-profile                      # Latest tick timing breakdown
GET  .../events                            # Recent lifecycle events
GET  .../species                           # Species population statistics
GET  .../logs?domain=&level=&limit=        # Filtered server logs (default: INFO+, limit 100)
```

**Configuration (§E.5)**:
```
GET  /api/debug/config                     # Current DebugConfig
PUT  /api/debug/config                     # Update debug config at runtime (toggle systems, change history depth)
```

#### Production vs Dev Feature Matrix (`debug.md` §C.1)

The `DebugConfig` includes a `productionMode` boolean (derived from `NODE_ENV`). When `productionMode === true`:
- Entity/world manipulation endpoints return `403 Forbidden`
- Debug overlay layers are not registered
- The debug panel shows only monitoring tabs
- Entity inspector is read-only (no brain trace)
- Logs show WARN+ level only

| Feature | Production (Admin) | Dev (Full Debug) |
|---------|-------------------|------------------|
| Tick time charts, FPS/TPS counters | Yes | Yes |
| Energy distribution + conservation | Yes | Yes |
| Species population chart | Yes | Yes |
| Memory/bandwidth stats | Yes | Yes |
| Server logs (WARN+ only) | Yes | Yes (all levels) |
| Entity inspector (read-only) | Yes (no brain trace) | Yes (with brain trace) |
| TPS slider, Snapshots | Yes | Yes |
| Spatial/vision/velocity overlays | No | Yes |
| Brain trace, per-entity energy ledger | No | Yes |
| Spawn/Kill/Teleport/Edit entities | No | Yes |
| Trigger ecological events | No | Yes |
| Pause/Resume entities, Step ticks | No | Yes |

Implement the gating check as middleware on the `DebugRouter`: if `productionMode && isManipulationEndpoint(req)`, return 403.

### Unit Tests

- Admin JWT passes auth check. Non-admin receives 403.
- GET tick-profiles returns array of TickProfile objects.
- POST entity/spawn creates entity at specified position.
- POST entity/kill removes entity and drops meat.
- POST entity/teleport moves entity to new position.
- Production mode: POST spawn returns 403. GET tick-profile returns 200 (monitoring still works).
- Production mode: entity inspector omits brain trace data.
- Non-admin DEBUG_SUBSCRIBE WS message is silently ignored (no error response).

### QA Checklist

- [ ] All debug endpoints are admin-gated (403 for non-admins)
- [ ] WebSocket debug streams work (subscribe → receive updates)
- [ ] Entity manipulation commands take effect immediately
- [ ] REST responses include correct data structures
- [ ] Production mode: manipulation endpoints return 403
- [ ] Production mode: monitoring endpoints still work
- [ ] Production mode: debug overlays are not available
- [ ] Max 3 concurrent debug subscribers enforced (4th gets 403)

---

## Step 14.3 — Client Debug Panel

### What You're Implementing

The client-side debug panel: a collapsible panel (activated by admin users) with 9 tabs: Performance, Energy, Spatial, Reproduction, Combat, Brain Inspector, Entity Inspector, Overlays, and Commands.

### Design References

- `debug.md` Section B (Client-Side Debug Panel) — 9-tab layout, lazy-loaded, admin-only. Tab descriptions and UI components.
- `components/front-end.md` Section 4 — DebugStore with full interface.

### Implementation Details

```typescript
// Lazy-loaded debug panel (only loaded for admin users)
const DebugPanel = lazy(() => import('./debug/DebugPanel'));

function DebugPanel() {
  const debugStore = useDebugStore();

  return (
    <Resizable position="right" defaultWidth={400}>
      <TabBar tabs={DEBUG_TABS} activeTab={debugStore.activeTab} onSelect={debugStore.setTab} />

      {debugStore.activeTab === 'performance' && <PerformanceTab />}
      {debugStore.activeTab === 'energy' && <EnergyTab />}
      {debugStore.activeTab === 'spatial' && <SpatialTab />}
      {debugStore.activeTab === 'reproduction' && <ReproductionTab />}
      {debugStore.activeTab === 'combat' && <CombatTab />}
      {debugStore.activeTab === 'brain' && <BrainInspectorTab />}
      {debugStore.activeTab === 'entity' && <EntityInspectorTab />}
      {debugStore.activeTab === 'overlays' && <OverlaysTab />}
      {debugStore.activeTab === 'commands' && <CommandsTab />}
    </Resizable>
  );
}
```

#### Key Tabs

- **Performance**: Sparkline charts for each system's tick duration. Total tick time. Entity/pellet counts.
- **Energy**: Line chart of 5 energy accounts over time. Conservation drift indicator.
- **Brain Inspector**: Select entity → view all input/output node values as bars. Significant synapse flows highlighted. Time series of selected node.
- **Entity Inspector**: Select entity → view all properties: position, velocity, genes, brain stats, stomach contents, venom state, energy ledger.
- **Overlays**: Toggle buttons for 7 debug overlay layers (spatial grid, vision cones, velocity vectors, collision boxes, pheromone overlay, energy heatmap, force vectors).
- **Commands**: Text input for debug commands (spawn, kill, teleport, inject energy, set season, etc.).

See `debug.md` §B.3 for the full per-tab element tables including data sources and update rates. The 9 tabs are: Performance, Energy, Brain, Spatial, Ecology, Reproduction, Entities, Controls, Logs (`debug.md` §B.2 `DebugTab` type).

#### Phone Layout (`debug.md` §B.1)

- **Tablet (≥768px)**: Resizable side panel, right edge. Default 400px wide, draggable resize handle. Max 50% viewport width.
- **Phone (<768px)**: Bottom sheet, draggable. Snap points at 30%, 60%, 90% of viewport height. Use a `BottomSheet` component (e.g., `react-spring` gestures) with these three snap positions.

Detect layout via the same breakpoint used by the main app (`useBreakpoint(768)`). The debug panel component should render either `<ResizablePanel>` or `<BottomSheet>` based on the breakpoint.

### Unit Tests

- Debug panel renders all 9 tabs.
- Tab switching shows correct content.
- Performance sparklines update with tick profile data.
- Energy chart shows 5 lines (one per account).
- Phone layout: bottom sheet renders with 3 snap points.
- Tablet layout: resizable panel renders with drag handle.

### QA Checklist

- [ ] Debug panel only visible to admin users
- [ ] Panel is resizable and collapsible
- [ ] Performance tab shows per-system timing
- [ ] Energy tab shows conservation drift (should be ~0)
- [ ] Brain inspector shows live node activations for selected entity
- [ ] Overlays toggle correctly on the world canvas
- [ ] Commands execute and show feedback
- [ ] Phone (<768px): debug panel renders as bottom sheet with 3 snap points
- [ ] Tablet (≥768px): debug panel renders as resizable side panel

---

## Step 14.4 — Debug Overlay Layers

### What You're Implementing

7 Pixi.js overlay layers toggled from the debug panel: spatial hash grid lines, vision cones for all/selected organisms, velocity vectors, collision bounding circles, pheromone intensity heatmap, energy heatmap, and force vectors.

### Design References

- `debug.md` Section B.3 — 7 overlay layer descriptions with rendering specifications.
- `art.md` Section 8 (Overlays) — Overlay visual style.

### Implementation Details

```typescript
interface DebugOverlayLayer {
  name: string;
  enabled: boolean;
  render(graphics: Graphics, world: WorldState): void;
}

const overlayLayers: DebugOverlayLayer[] = [
  {
    name: 'Spatial Grid',
    render(g, world) {
      // Draw 25x25 grid lines (cell boundaries)
      for (let i = 0; i <= 25; i++) {
        g.moveTo(i * 20, 0); g.lineTo(i * 20, 500);
        g.moveTo(0, i * 20); g.lineTo(500, i * 20);
      }
      g.stroke({ color: 0x444444, width: 0.5, alpha: 0.3 });
      // Color cells by entity count (density heatmap)
    },
  },
  {
    name: 'Vision Cones',
    render(g, world) {
      for (const org of world.organisms) {
        const { viewAngle, viewRadius, heading, x, y } = org;
        g.beginFill(0xFFFF00, 0.05);
        g.arc(x, y, viewRadius, heading - viewAngle/2, heading + viewAngle/2);
        g.endFill();
      }
    },
  },
  {
    name: 'Velocity Vectors',
    render(g, world) {
      for (const org of world.organisms) {
        g.moveTo(org.x, org.y);
        g.lineTo(org.x + org.vx * 10, org.y + org.vy * 10);
        g.stroke({ color: 0x00FF00, width: 1 });
      }
    },
  },
  // ... collision boxes, pheromone overlay, energy heatmap, force vectors
];
```

### Unit Tests

- Each overlay renders without errors when enabled.
- Spatial grid draws 26 horizontal + 26 vertical lines.
- Vision cones have correct arc angle and radius.
- Velocity vectors point in movement direction.

### QA Checklist

- [ ] Each overlay toggles independently
- [ ] Spatial grid aligns with simulation grid (20-unit cells)
- [ ] Vision cones accurately show each organism's field of view
- [ ] Velocity vectors show movement direction and magnitude
- [ ] Overlays don't significantly impact render performance
- [ ] Pheromone overlay shows all 3 channels

---

## Step 14.5 — Testing Utilities

### What You're Implementing

Testing utilities for development: deterministic PRNG + replay system, pre-built test scenarios, entity factory functions, assertion helpers, automated balance scenarios, and brain regression tests.

### Design References

- `debug.md` Section F (Testing Utilities) — Deterministic replay (§F.1), balance scenarios (§F.2), energy conservation validator (§F.3), brain regression tests (§F.4).
- `debug.md` Section G.3 — File organization: `server/src/debug/replay/`, `server/src/debug/testing/`.
- `core-gameplay-systems.md` Section 13 — Verification & build order, recommended test sequence.

### Implementation Details

#### Deterministic Replay (`debug.md` §F.1)

All simulation randomness must be routed through a seeded PRNG to enable deterministic replay:

```typescript
// server/src/debug/replay/deterministic-rng.ts
class DeterministicRng {
  private state: number;
  constructor(seed: number) { this.state = seed || 1; }
  next(): number {                              // xorshift32: [0, 1)
    this.state ^= this.state << 13;
    this.state ^= this.state >> 17;
    this.state ^= this.state << 5;
    return (this.state >>> 0) / 0xFFFFFFFF;
  }
  nextInt(min: number, max: number): number;
  nextFloat(min: number, max: number): number;
}
```

**Replay recording** — captures PRNG state + external inputs per tick:

```typescript
// server/src/debug/replay/replay-recorder.ts
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

**Replay playback** — replays frames and detects divergence:

```typescript
// server/src/debug/replay/replay-player.ts
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

#### World Factory + Entity Factory

```typescript
// test/utils/world-factory.ts
function createTestWorld(options: TestWorldOptions = {}): World {
  const seed = options.seed ?? 42;
  const rng = new DeterministicRng(seed);
  const world = new World({
    worldSize: options.worldSize ?? 500,
    simTps: options.simTps ?? 40,
    rng,
  });
  world.environmentEngine.generateBiomeMap(seed);
  return world;
}

// test/utils/entity-factory.ts
function createTestOrganism(overrides: Partial<Organism> = {}): Organism {
  return {
    id: nextId(),
    position: { x: 250, y: 250 },
    velocity: { x: 0, y: 0 },
    heading: 0,
    speciesId: 'test-species',
    energy: 100,
    maxEnergy: 100,
    health: 100,
    maxHealth: 100,
    sizeRatio: 1.0,
    speedRatio: 1.0,
    strength: 1.0,
    defense: 0.5,
    diet: 0.0,
    metabolism: 1.0,
    maturity: 1.0,
    age: 0,
    ...overrides,
  };
}

function createHerbivoreTemplate(): SpeciesBlueprint { ... }
function createCarnivoreTemplate(): SpeciesBlueprint { ... }
function createScavengerTemplate(): SpeciesBlueprint { ... }

// test/utils/assertions.ts
function assertEnergyConservation(world: World, tolerance: number = 0.01): void {
  const snapshot = world.energySystem.getEnergySnapshot();
  const measured = snapshot.freeEnergy + snapshot.plantEnergy + snapshot.meatEnergy
                 + snapshot.organismEnergy + snapshot.eggEnergy;
  const drift = Math.abs(measured - world.totalEnergy);
  expect(drift).toBeLessThan(tolerance);
}

function assertNoInvalidState(world: World): void {
  for (const org of world.organisms) {
    expect(Number.isFinite(org.position.x)).toBe(true);
    expect(Number.isFinite(org.position.y)).toBe(true);
    expect(Number.isFinite(org.energy)).toBe(true);
    expect(org.energy).toBeGreaterThanOrEqual(0);
    expect(org.position.x).toBeGreaterThanOrEqual(0);
    expect(org.position.x).toBeLessThan(world.worldSize);
    expect(org.position.y).toBeGreaterThanOrEqual(0);
    expect(org.position.y).toBeLessThan(world.worldSize);
  }
}

function assertAllPositionsInBounds(world: World): void { ... }
```

#### Pre-Built Test Scenarios

```typescript
const TEST_SCENARIOS = {
  empty: () => createTestWorld(),
  singleHerbivore: () => {
    const world = createTestWorld();
    deploySpecies(world, createHerbivoreTemplate(), 1);
    return world;
  },
  predatorPrey: () => {
    const world = createTestWorld();
    deploySpecies(world, createHerbivoreTemplate(), 10);
    deploySpecies(world, createCarnivoreTemplate(), 5);
    return world;
  },
  crowded: () => {
    const world = createTestWorld();
    for (let i = 0; i < 10; i++) {
      deploySpecies(world, createHerbivoreTemplate(), 10);
    }
    return world;
  },
};
```

#### Automated Balance Scenarios (`debug.md` §F.2)

Longer-running scenarios that verify game balance holds over extended simulation:

```typescript
// server/src/debug/testing/test-runner.ts
interface TestScenario {
  name: string;
  description: string;
  setup: (world: World) => void;
  runForTicks: number;
  assertions: (world: World) => TestResult;
}

interface TestResult {
  passed: boolean;
  message: string;
  metrics?: Record<string, number>;
}
```

**Predefined scenarios** (in `server/src/debug/testing/scenarios/`):

| Scenario | Setup | Ticks | Assertion |
|----------|-------|-------|-----------|
| `energy_conservation_stress` | 500 organisms (mixed), normal plants | 2,000 | `conservationDrift < 1.0` |
| `herbivore_vs_carnivore_balance` | 50 herbivores + 20 carnivores, normal biome | 5,000 | Both species population > 0 (coexistence) |
| `brain_regression_basic_herbivore` | 1 template herbivore + 1 nearby plant | 100 | Herbivore moves toward and eats plant |
| `spatial_hash_wraparound` | 1 organism at (499,499), 1 plant at (1,1) | 10 | Organism detects plant via toroidal wrapping |
| `starvation_cascade` | 200 organisms, 0 plants | 500 | All die; total energy unchanged (conservation) |
| `reproduction_chain` | 1 organism max energy, abundant plants | 2,000 | Population increases; all offspring have valid genes |

**REST endpoints**:
- `POST /api/debug/test/run` — `{ scenarioName }` → runs scenario, returns `TestResult`
- `GET /api/debug/test/scenarios` — list available scenario names + descriptions

#### Energy Conservation Validator (`debug.md` §F.3)

Runs automatically every 100 ticks when `energyAudit` is enabled. Checks for negative energy, NaN, excessive drift, orphaned energy. See `debug.md` §F.3 for full `auditEnergy()` implementation and `EnergyAuditResult`/`EnergyAnomaly` interfaces.

**REST endpoint**: `GET /api/debug/worlds/:worldId/energy` returns full `EnergyAuditResult`.

#### Brain Regression Tests (`debug.md` §F.4)

Verify that standard brain configurations produce expected behaviors:

```typescript
// server/src/debug/testing/brain-regression.ts
interface BrainTestCase {
  name: string;
  brainConfig: BrainConfig;
  inputs: Record<string, number>;
  expectedOutputRanges: {
    [outputName: string]: [number, number];  // [min, max]
  };
}
```

**Predefined tests**:

| Test | Brain | Input Setup | Expected Output |
|------|-------|-------------|-----------------|
| `herbivore_turns_toward_plant` | Template herbivore | plantAngle=0.3, plantDist=0.5 | turnOutput in [0.2, 0.8] |
| `carnivore_attacks_smaller` | Template carnivore | preyAngle=0.1, preyDist=0.3, preyRelSize=0.6 | attackOutput in [0.5, 1.0] |
| `prey_flees_larger` | Template herbivore | predatorAngle=0.2, predatorDist=0.3, predatorRelSize=1.5 | speedOutput in [0.7, 1.0], turn away |
| `idle_no_stimulus` | Template herbivore | All inputs = 0 | speedOutput in [0.0, 0.3], attackOutput in [0.0, 0.1] |

**REST endpoint**: `GET /api/debug/test/brain-regression` — runs all brain tests, returns pass/fail with actual output values.

### Unit Tests

- `createTestWorld` with same seed produces identical worlds.
- `createTestOrganism` produces valid organism with all required fields.
- `assertEnergyConservation` passes for fresh world, fails when energy is removed.
- `assertNoInvalidState` fails when organism has NaN position.
- `DeterministicRng`: same seed → identical sequence of 1000 values.
- `ReplayRecorder`: records 100 frames, `getReplay()` returns all 100 in order.
- `ReplayRecorder`: exceeding `maxFrames` evicts oldest frames.
- `ReplayPlayer`: replay of 50-tick recording with same seed produces zero divergences.
- `ReplayPlayer`: replay with altered PRNG seed detects divergence on first tick.
- Balance scenario `energy_conservation_stress`: passes with drift < 1.0.
- Brain regression `herbivore_turns_toward_plant`: turnOutput in expected range.
- Brain regression `idle_no_stimulus`: speedOutput and attackOutput near 0.

### Integration Tests

- Run `predatorPrey` scenario for 5000 ticks: both species survive.
- Run `starvation_cascade` scenario: all organisms die, energy conserved.
- Replay 200-tick recording: verify zero divergences.

### QA Checklist

- [ ] Test utilities are importable from `test/utils/`
- [ ] Seeded worlds are deterministic (same seed → same biome, same plants)
- [ ] Entity factories produce valid objects that work with all systems
- [ ] Assertion helpers catch common bugs (NaN, out-of-bounds, energy leak)
- [ ] Test scenarios cover: empty, single organism, predator-prey, crowded
- [ ] DeterministicRng produces identical sequences for same seed
- [ ] ReplayRecorder captures PRNG state + external inputs per tick
- [ ] ReplayPlayer detects divergences when simulation is non-deterministic
- [ ] POST /api/debug/worlds/:worldId/replay returns divergence report
- [ ] All 6 balance scenarios pass on a fresh world
- [ ] All 4 brain regression tests pass with template brains
- [ ] POST /api/debug/test/run executes scenario and returns TestResult
- [ ] Energy conservation validator catches NaN, negative energy, excessive drift

---

## Step 14.6 — Health Indicator Bar

### What You're Implementing

A compact health status bar displayed in admin screens (`AdminDashboardScreen`, `AdminWorldDetailScreen`) showing key server metrics with color-coded alert thresholds.

### Design References

- `debug.md` Section C.2 — Health Indicator Bar layout, alert thresholds, integration points.

### Implementation Details

Display format:
```
Health: [OK]  TPS: 40.0/40  Tick: 2.1ms/25ms  Drift: 0.003  Mem: 340MB
Orgs: 847  Plants: 5,231  Uptime: 14h 22m  Clients: 12
```

**Alert thresholds** (color the metric label green/yellow/red):

| Metric | Green | Yellow | Red |
|--------|-------|--------|-----|
| TPS | >= 38 | >= 30 | < 30 |
| Tick time | < 10 ms | < 20 ms | >= 20 ms |
| Conservation drift | < 0.1 | < 1.0 | >= 1.0 |
| Memory | < 400 MB | < 600 MB | >= 600 MB |

The overall `[OK]` / `[WARN]` / `[CRITICAL]` badge reflects the worst status among all metrics.

**Data source**: Poll `GET /admin/worlds/:id/metrics` every 2 seconds (reuses tick profile + energy snapshot + entity count data already exposed by the debug REST API).

**Integration points**:
- `AdminDashboardScreen` — render `<HealthBar>` at the top of the page
- `AdminWorldDetailScreen` → `DevToolsTab` — render `<HealthBar>` + "Debug Console" button that opens the full debug panel

```typescript
interface HealthBarProps {
  worldId: string;
  pollIntervalMs?: number;  // Default: 2000
}

function HealthBar({ worldId, pollIntervalMs = 2000 }: HealthBarProps) {
  const metrics = usePolledMetrics(worldId, pollIntervalMs);
  const status = computeOverallStatus(metrics);
  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-gray-900 rounded text-sm font-mono">
      <StatusBadge status={status} />
      <MetricChip label="TPS" value={metrics.tps} threshold={TPS_THRESHOLDS} />
      <MetricChip label="Tick" value={`${metrics.tickMs.toFixed(1)}ms`} threshold={TICK_THRESHOLDS} />
      <MetricChip label="Drift" value={metrics.drift.toFixed(3)} threshold={DRIFT_THRESHOLDS} />
      <MetricChip label="Mem" value={`${metrics.memMb}MB`} threshold={MEM_THRESHOLDS} />
      <span>Orgs: {metrics.orgCount}</span>
      <span>Plants: {metrics.plantCount}</span>
      <span>Clients: {metrics.clientCount}</span>
    </div>
  );
}
```

### Unit Tests

- HealthBar renders all metric fields.
- Green/yellow/red thresholds apply correct CSS classes.
- Overall status = worst individual status.
- Polling fetches metrics at configured interval.

### QA Checklist

- [ ] HealthBar appears at top of AdminDashboardScreen
- [ ] HealthBar appears in AdminWorldDetailScreen DevToolsTab
- [ ] Metrics update every 2 seconds
- [ ] Color thresholds are correct (green/yellow/red)
- [ ] Overall status badge shows worst-case status
- [ ] "Debug Console" button opens the full debug panel
