# Life Game - Back-End Server Infrastructure

**Version**: 1.0
**Runtime**: Node.js 20 (TypeScript), single process
**Transport**: uWebSockets.js (binary WebSocket), Supabase REST (service_role)
**Deployment**: Docker container on Hetzner CX33 (4 vCPU, 8GB RAM, ~$7/mo)
**Scale**: 1 server, N worlds (default 1), 30 players per world, ~6,400 entities per world, 40 TPS constant per world (configurable via SIM_TPS)

> **Cross-references**: This document details the server-side implementation. For the overall system topology, database schema, and deployment architecture, see [`architecture.md`](../architecture.md). For gameplay rules, brain/body design, and simulation formulas, see [`core-gameplay-systems.md`](../core-gameplay-systems.md). For debug instrumentation, manipulation commands, WS protocol, REST API, and testing utilities, see [`debug.md`](../debug.md).

---

## Table of Contents

1. [Server Process Architecture](#1-server-process-architecture)
2. [Simulation Engine Pipeline](#2-simulation-engine-pipeline)
3. [Entity-Component Data Layout](#3-entity-component-data-layout)
4. [Spatial Hash Grid](#4-spatial-hash-grid)
5. [Neural Network Engine](#5-neural-network-engine)
6. [WebSocket Server](#6-websocket-server)
7. [Supabase Integration](#7-supabase-integration)
8. [AI Ecosystem Manager](#8-ai-ecosystem-manager)
9. [World Lifecycle](#9-world-lifecycle)
10. [API Endpoints](#10-api-endpoints)

---

## 1. Server Process Architecture

### 1.1 Why a Single Process

The entire simulation server runs as a **single Node.js process**. There is no clustering, no worker threads for simulation logic, and no inter-process communication layer. This is a deliberate choice for this scale:

| Factor | Single Process | Multi-Process |
|--------|---------------|---------------|
| **Entity count** | ~6,400 entities -- trivially fits in one core | Would require shared-memory or message passing |
| **Tick time** | ~3 ms target, well within 25 ms budget (at 40 TPS) | Adds serialization overhead that exceeds the tick itself |
| **State coherence** | All entities in one memory space, zero-copy reads | Partitioning a 500x500 toroidal world creates boundary sync issues |
| **WebSocket fan-out** | uWebSockets.js handles 30 clients on one thread easily | Worker threads add latency to viewport-culled encoding |
| **Debugging** | Single call stack, deterministic tick ordering | Race conditions, non-deterministic bugs |
| **Complexity** | ~2,000 lines of simulation code | +1,000 lines of IPC/sync plumbing |

The Hetzner CX33 instance provides 4 vCPUs. The single Node.js process uses one core for the simulation loop and event loop. The remaining cores handle OS tasks, Caddy reverse proxy, and Docker overhead — more than sufficient.

**When to reconsider**: If the project scales beyond ~20,000 entities or 100+ concurrent WebSocket clients, worker threads for WebSocket encoding become worthwhile. That threshold is far beyond the 30-player, single-world design target.

### 1.2 Server Startup Sequence

```
+------------------------------------------------------------------+
|                     SERVER STARTUP SEQUENCE                       |
+------------------------------------------------------------------+
|                                                                   |
|  1. Process init                                                  |
|     +-- Load environment variables (PORT, SUPABASE_URL, etc.)    |
|     +-- Initialize logger                                        |
|     +-- Register signal handlers (SIGTERM, SIGINT)               |
|                                                                   |
|  2. Supabase client init                                         |
|     +-- Create service_role client                               |
|     +-- Verify connectivity (SELECT 1)                           |
|                                                                   |
|  3. WorldManager init                                            |
|     +-- Fetch all worlds with status = 'running' from Supabase   |
|     |   SELECT * FROM worlds WHERE status = 'running'            |
|     +-- For each world:                                          |
|     |   +-- Fetch latest world_snapshot                          |
|     |   |   SELECT * FROM world_snapshots                        |
|     |   |   WHERE world_id = $worldId                            |
|     |   |   ORDER BY tick DESC LIMIT 1                           |
|     |   +-- If snapshot found:                                   |
|     |   |   +-- Deserialize organisms, pellets, pheromone grid   |
|     |   |   +-- Rebuild spatial hash from entity positions       |
|     |   |   +-- Restore active species metadata + mutation pools |
|     |   |   +-- Resume simulation from snapshot tick             |
|     |   |   +-- Log: "Restored world '{name}' at tick {N}"     |
|     |   +-- If no snapshot:                                      |
|     |       +-- Create fresh WorldRoom (generate biome, seed     |
|     |       |   plants, deploy AI species)                       |
|     |       +-- Start game loop for this room                    |
|     +-- If no worlds exist in database:                          |
|         +-- Create default world (name from DEFAULT_WORLD_NAME)  |
|         +-- Insert into worlds table                             |
|         +-- Generate biome map, seed plants, deploy AI species   |
|         +-- Log: "Created default world"                         |
|                                                                   |
|  4. WebSocket server init                                        |
|     +-- Create uWebSockets.js App (TLS terminated by Caddy)     |
|     +-- Register /ws upgrade handler                             |
|     +-- Register /health HTTP handler                            |
|     +-- Register /api/admin/* HTTP handlers (admin REST API)     |
|     +-- Listen on PORT (default 9000)                            |
|                                                                   |
|  5. Game loops start (per WorldRoom)                             |
|     +-- Each WorldRoom starts its own game loop timer (see 1.3)  |
|     +-- Each WorldRoom starts its own persistence timers:        |
|     |   +-- Leaderboard: every 60 seconds                       |
|     |   +-- Snapshot: every 5 minutes                            |
|     |   +-- Player summaries: every 1 hour                      |
|     |   +-- Mutation poll: every 60 seconds                     |
|     +-- Log: "{N} world(s) running"                              |
|                                                                   |
|  6. Ready                                                        |
|     +-- Log: "Server ready on port {PORT}"                      |
|                                                                   |
+------------------------------------------------------------------+
```

```typescript
// server/src/main.ts -- Entry point

import { App } from 'uWebSockets.js';
import { loadConfig } from './config';
import { createSupabaseClient } from './persistence/supabase-client';
import { WorldManager } from './simulation/world-manager';
import { WebSocketServer } from './network/ws-server';
import { AdminRouter } from './api/admin-router';

async function main(): Promise<void> {
  const config = loadConfig();

  // Step 2: Supabase init
  const supabase = createSupabaseClient(
    config.supabaseUrl,
    config.supabaseServiceRoleKey,
  );

  // Step 3: WorldManager init (loads all running worlds)
  const worldManager = new WorldManager(supabase, config);
  await worldManager.init();
  console.log(`WorldManager loaded ${worldManager.listRooms().length} world(s)`);

  // Step 3.5: DebugCollector init (supersedes TickProfiler — see debug.md §A.2)
  const debugCollector = new DebugCollector(config.debugConfig);
  // Attach to each WorldRoom for tick instrumentation
  for (const room of worldManager.listRooms()) {
    room.world.setDebugCollector(debugCollector);
  }

  // Step 4: WebSocket + HTTP server
  const app = App();
  const wsServer = new WebSocketServer(app, worldManager, supabase, config);
  const adminRouter = new AdminRouter(app, worldManager, supabase, config);
  const debugRouter = new DebugRouter(app, debugCollector, worldManager, supabase, config);

  app.listen(config.port, (listenSocket) => {
    if (listenSocket) {
      console.log(`Server listening on port ${config.port}`);
    } else {
      console.error(`Failed to listen on port ${config.port}`);
      process.exit(1);
    }
  });

  // Step 5: Game loops already started per WorldRoom in init()

  // Graceful shutdown
  setupShutdownHandlers(worldManager, wsServer, supabase);
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
```

### 1.3 Constant-Speed Game Loop

> **Multi-world note**: The game loop logic described here runs **per WorldRoom**. Each room has its own `SIM_TPS` (mutable via admin API), its own tick timer, and its own broadcast timer. `WorldManager.setTPS()` stops the old timer and starts a new one at the new rate.

The simulation runs at a **constant configurable TPS** regardless of connected clients. There is no dual-mode acceleration — the tick rate is the same whether zero or thirty players are watching.

> **TPS-agnostic design**: `SIM_TPS` is the single tuning knob for simulation speed. All persistence intervals derive from `SIM_TPS`. Season and day/night timing is wall-clock-based and completely unaffected by TPS. To change simulation speed, edit `SIM_TPS` only — no other constant needs updating.

> **Reference**: See [`architecture.md` Section 10](../architecture.md) for performance budgets at 40 TPS, and [`core-gameplay-systems.md` Section 3](../core-gameplay-systems.md) for organism lifespan of ~2,000-4,000 ticks (~50-100 real seconds at 40 TPS).

```typescript
// server/src/simulation/game-loop.ts

import { World } from './world';
import { WebSocketServer } from '../network/ws-server';
import { SupabaseClient } from '../persistence/supabase-client';
import { ServerConfig } from '../config';

// ── TPS-AGNOSTIC CONFIGURATION ──────────────────────────────────────────
// SIM_TPS is the ONE constant that controls simulation speed.
// Change it to 20, 40, 60, 100, etc. — all other timing derives from it
// or uses wall-clock time. Nothing else needs updating.
const SIM_TPS = 40;                                        // Configurable. 40 = 2x real-time viewing speed.
const TICK_INTERVAL_MS = 1000 / SIM_TPS;                   // 25 ms at 40 TPS
const BROADCAST_INTERVAL_MS = 50;                           // 20 Hz to clients, independent of SIM_TPS
const PERSISTENCE_SNAPSHOT_INTERVAL = 5 * 60 * SIM_TPS;    // 5 min wall-clock = 12,000 ticks at 40 TPS
const PERSISTENCE_LEADERBOARD_INTERVAL = 60 * SIM_TPS;     // 60 sec wall-clock = 2,400 ticks
const PERSISTENCE_SUMMARY_INTERVAL = 3600 * SIM_TPS;       // 1 hour wall-clock = 144,000 ticks
const MUTATION_POLL_INTERVAL = 60 * SIM_TPS;               // 60 sec wall-clock = 2,400 ticks

export interface TickTiming {
  tickDurationMs: number;
  avgTickMs: number;
  maxTickMs: number;
}

export function startGameLoop(
  world: World,
  wsServer: WebSocketServer,
  supabase: SupabaseClient,
  config: ServerConfig,
): void {
  let lastTickTime = process.hrtime.bigint();
  let accumulator = 0;                    // Accumulated real time (ns)
  let tickCount = 0;
  let tickTimeSum = 0;
  let tickTimeMax = 0;
  const tickTimingWindow = 100;            // Rolling average window

  const timing: TickTiming = {
    tickDurationMs: 0,
    avgTickMs: 0,
    maxTickMs: 0,
  };

  // ── TICK LOOP: constant SIM_TPS, independent of client count ──
  function loop(): void {
    const now = process.hrtime.bigint();
    const deltaNs = Number(now - lastTickTime);
    lastTickTime = now;

    accumulator += deltaNs;
    const tickIntervalNs = TICK_INTERVAL_MS * 1_000_000;

    // Process at most 3 ticks per frame to prevent spiral-of-death
    let ticksThisFrame = 0;
    while (accumulator >= tickIntervalNs && ticksThisFrame < 3) {
      const tickStart = process.hrtime.bigint();

      world.tick();
      ticksThisFrame++;

      // Record timing
      const tickEnd = process.hrtime.bigint();
      timing.tickDurationMs = Number(tickEnd - tickStart) / 1_000_000;
      tickTimeSum += timing.tickDurationMs;
      tickTimeMax = Math.max(tickTimeMax, timing.tickDurationMs);
      tickCount++;

      if (tickCount % tickTimingWindow === 0) {
        timing.avgTickMs = tickTimeSum / tickTimingWindow;
        timing.maxTickMs = tickTimeMax;
        tickTimeSum = 0;
        tickTimeMax = 0;
      }

      accumulator -= tickIntervalNs;
    }

    // Clamp accumulator to prevent catch-up burst after long pause
    if (accumulator > tickIntervalNs * 5) {
      accumulator = tickIntervalNs;
    }

    // ── PERSISTENCE CHECKS ──
    const currentTick = world.currentTick;

    if (currentTick % PERSISTENCE_LEADERBOARD_INTERVAL === 0) {
      writeLeaderboard(world, supabase).catch(logPersistenceError);
      updateSpeciesPeakStats(world, supabase).catch(logPersistenceError);
    }
    if (currentTick % PERSISTENCE_SNAPSHOT_INTERVAL === 0) {
      writeSnapshot(world, supabase).catch(logPersistenceError);
    }
    if (currentTick % PERSISTENCE_SUMMARY_INTERVAL === 0) {
      writePlayerSummaries(world, supabase).catch(logPersistenceError);
    }
    if (currentTick % MUTATION_POLL_INTERVAL === 0) {
      pollMutationSelections(world, supabase).catch(logPersistenceError);
    }

    // Schedule next check
    setTimeout(
      loop,
      Math.max(1, TICK_INTERVAL_MS - timing.tickDurationMs),
    );
  }

  // ── BROADCAST LOOP: 20 Hz, decoupled from tick rate ──
  // Samples current world state at a fixed 20 Hz regardless of SIM_TPS.
  // At 40 TPS this shows every ~2nd tick; at 60 TPS every ~3rd tick.
  // Clients always receive 20 updates/sec for smooth interpolation.
  setInterval(() => {
    if (wsServer.connectedClientCount > 0) {
      wsServer.broadcastDelta(world);
    }
  }, BROADCAST_INTERVAL_MS);

  // Kick off the tick loop
  setImmediate(loop);

  // Expose timing for /health endpoint
  world.timing = timing;
}

function logPersistenceError(err: Error): void {
  console.error('[Persistence] Write failed:', err.message);
}
```

**Key design decisions in the loop**:

1. **`process.hrtime.bigint()`** for nanosecond-precision timing. `Date.now()` has only millisecond resolution, insufficient for detecting sub-millisecond tick budget overruns.

2. **Fixed timestep with accumulator**. The simulation always advances by exactly one tick-worth of time, regardless of wall-clock jitter. This keeps physics deterministic.

3. **Spiral-of-death guard**: If ticks fall behind (e.g., a GC pause), the loop processes at most 3 ticks per frame and then clamps the accumulator. Clients see a brief pause rather than a burst of fast-forwarded state.

4. **Constant TPS ensures predictable evolution rate** regardless of viewer count. At 40 TPS with ~2,000-4,000 tick lifespans, this produces ~800-2,000 generations per real day — consistently, whether players are watching or not.

5. **Decoupled broadcast timer**: The 20 Hz `setInterval` broadcast is independent of the tick loop. It samples current world state at a fixed rate, so clients always see smooth 20 Hz updates even if `SIM_TPS` is not a multiple of 20. At 40 TPS the broadcast shows approximately every 2nd tick; at 60 TPS every 3rd tick.

6. **`SIM_TPS` is the single tuning knob** for simulation speed. All persistence intervals derive from it. Season/day-night timing uses wall-clock time and is unaffected. Changing `SIM_TPS` from 40 to 60 requires editing one constant — nothing else breaks.

### 1.4 WorldManager

The `WorldManager` is the central coordinator for all simulation rooms. It manages the lifecycle of each `WorldRoom` — creation, restoration, pausing, resuming, stopping, and resource cleanup.

```typescript
// server/src/simulation/world-manager.ts

class WorldManager {
  private rooms: Map<string, WorldRoom>;    // worldId → room

  async init(supabase): Promise<void>;      // Load all running worlds on startup
  createRoom(config: WorldConfig): WorldRoom;
  getRoom(worldId: string): WorldRoom | undefined;
  pauseRoom(worldId: string): void;         // Stop tick loop, keep state in memory
  resumeRoom(worldId: string): void;        // Restart tick loop
  stopRoom(worldId: string): void;          // Snapshot + remove from memory
  restartRoom(worldId: string): void;       // Stop + restore from latest snapshot
  resetRoom(worldId: string): void;         // Wipe state, re-seed fresh world
  setTPS(worldId: string, tps: number): void; // Stop old timer, start new one
  forceSnapshot(worldId: string): void;
  restoreSnapshot(worldId: string, snapshotId: string): void;
  listRooms(): WorldSummary[];
}

class WorldRoom {
  id: string;
  world: World;
  config: WorldConfig;
  clients: Set<ClientSession>;
  gameLoop: NodeJS.Timeout | null;
  broadcastLoop: NodeJS.Timeout | null;
  status: 'running' | 'paused' | 'stopped';
  simTps: number;                           // Per-world, mutable by admin

  start(): void;
  pause(): void;
  resume(): void;
  stop(): Promise<void>;
  addClient(session: ClientSession): void;
  removeClient(session: ClientSession): void;
  kickClient(playerId: string, reason: string): void;
}

interface WorldConfig {
  id: string;
  name: string;
  createdBy: string;
  accessType: 'public' | 'password' | 'invite';
  passwordHash: string | null;
  maxPlayers: number;          // default 30
  worldSize: number;           // default 500
  simTps: number;              // default 40
  description: string;
}

interface WorldSummary {
  id: string;
  name: string;
  status: 'running' | 'paused' | 'stopped';
  accessType: 'public' | 'password' | 'invite';
  playerCount: number;
  maxPlayers: number;
  tick: number;
  entityCount: number;
}
```

**WorldManager lifecycle operations**:

| Operation | Behavior |
|-----------|----------|
| `createRoom(config)` | Insert into `worlds` table, instantiate WorldRoom, generate biome, seed plants, deploy AI species, start game loop |
| `pauseRoom(id)` | Stop tick & broadcast timers, keep state in memory, keep clients connected. Status → `paused`. |
| `resumeRoom(id)` | Restart tick & broadcast timers from current state. Status → `running`. |
| `stopRoom(id)` | Force snapshot to Supabase, stop timers, disconnect all clients from this room, remove from memory. Status → `stopped`. |
| `restartRoom(id)` | `stopRoom()` then restore from latest snapshot and `start()`. |
| `resetRoom(id)` | `stopRoom()` then create fresh world (new biome, plants, AI species). Old snapshots remain for auditing. |
| `setTPS(id, tps)` | Validate tps in [10, 200]. Stop old game loop timer, start new one at `1000/tps` ms interval. |
| `forceSnapshot(id)` | Trigger immediate snapshot outside the 5-min cycle (counts toward retention limit of 3 per world). |
| `restoreSnapshot(id, snapshotId)` | Pause room → load snapshot → replace world state → resume. Connected clients receive new FULL_STATE. |

### 1.5 Graceful Shutdown

```typescript
// server/src/main.ts (continued)

function setupShutdownHandlers(
  worldManager: WorldManager,
  wsServer: WebSocketServer,
  supabase: SupabaseClient,
): void {
  let shuttingDown = false;

  async function shutdown(signal: string): Promise<void> {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`Received ${signal}, starting graceful shutdown...`);

    // 1. Notify all connected clients
    wsServer.broadcastServerShutdown(60); // "restarting in ~60 seconds"

    // 2. Stop accepting new connections
    wsServer.stopListening();

    // 3. Stop all world rooms (writes final snapshot per room)
    console.log('Stopping all world rooms...');
    for (const room of worldManager.listRooms()) {
      try {
        await worldManager.stopRoom(room.id);
        console.log(`World '${room.name}' stopped, snapshot written.`);
      } catch (err) {
        console.error(`Failed to stop world '${room.name}':`, err);
      }
    }

    // 5. Close all WebSocket connections
    wsServer.closeAllConnections();

    // 6. Exit
    console.log('Shutdown complete.');
    process.exit(0);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Safety net: force exit after 10 seconds if graceful shutdown hangs
  process.on('SIGTERM', () => {
    setTimeout(() => {
      console.error('Graceful shutdown timed out, forcing exit.');
      process.exit(1);
    }, 10_000).unref();
  });
}
```

The shutdown sequence prioritizes **data preservation** (snapshot) over **client experience** (notification). The `SERVER_SHUTDOWN` message (`0xFF`) tells clients the approximate restart time so they can display "Server restarting, please wait..." instead of a generic disconnect error.

---

## 2. Simulation Engine Pipeline

### 2.1 System Execution Order

Every simulation tick processes 12 systems in a strict dependency order. The order is not arbitrary -- each system depends on the outputs of the systems before it.

```
+-------------------------------------------------------------------------+
|                          SIMULATION TICK PIPELINE                        |
|                                                                          |
|  Tick N                                                                  |
|  -----------------------------------------------------------------------+
|                                                                          |
|  1. SenseSystem          Read spatial hash -> populate brain inputs      |
|       |                  "What can each organism see/sense?              |
|       |                   Includes mate/egg detection + encounter reads" |
|       v                                                                  |
|  2. BrainSystem          Forward-pass neural networks                    |
|       |                  "Given these inputs, what does the brain        |
|       |                   decide?"                                       |
|       v                                                                  |
|  3. ActionSystem         Translate brain outputs to intended actions     |
|       |                  "Organism wants to: move, eat, attack..."       |
|       v                                                                  |
|  4. PhysicsSystem        Apply forces, resolve collisions, wrap coords  |
|       |                  "Where does the organism actually end up?"      |
|       v                                                                  |
|  5. DigestiveSystem      Process stomach contents, extract energy        |
|       |                  "How much energy does the organism gain         |
|       |                   from food in its stomach?"                     |
|       v                                                                  |
|  6. CombatSystem         Resolve attacks, apply damage, spawn meat      |
|       |                  "Who gets hurt? What meat drops?"               |
|       v                                                                  |
|  7. EnergySystem         Deduct metabolism, movement, brain costs        |
|       |                  "How much energy does each action cost?"        |
|       v                                                                  |
|  8. ReproductionSystem   Egg production, mating, hatching, nest bonus   |
|       |                  "Who reproduces? Sexual fertilization?          |
|       |                   Nest bonus for tended eggs?"                   |
|       v                                                                  |
|  9. GeneticsSystem       Mutations or crossover+mutations for newborns  |
|       |                  "Asexual: mutate. Sexual: crossover + mutate"   |
|       v                                                                  |
|  10. EnvironmentSystem   Plant spawn, meat decay, pheromone diffusion,  |
|       |                  season advancement, fungi lifecycle             |
|       |                  "How does the world change this tick?"          |
|       v                                                                  |
|  11. DeathSystem         Check death conditions, convert bodies to meat |
|       |                  "Who dies? Energy -> meat pellets"              |
|       v                                                                  |
|  12. PersistenceSystem   Update spatial hash, log events, queue writes  |
|                          "Record what happened for clients and DB"       |
|                                                                          |
|  -----------------------------------------------------------------------+
|  Tick N complete -> advance world.currentTick -> start Tick N+1         |
+-------------------------------------------------------------------------+
```

### 2.2 System Dependencies

Each system's ordering is justified by data dependencies:

| System | Reads From | Writes To | Why This Position |
|--------|-----------|-----------|-------------------|
| **SenseSystem** | Spatial hash, entity positions, pheromone grid | Brain input buffers | Must run first: inputs are stale from last tick |
| **BrainSystem** | Brain input buffers | Brain output buffers, node activations | Needs fresh sense data; outputs drive all actions |
| **ActionSystem** | Brain output buffers | Action intents (move force, eat flag, attack flag) | Translates continuous neural outputs to discrete intents |
| **PhysicsSystem** | Action intents (forces), entity positions | Entity positions, velocities | Must resolve movement before checking combat adjacency |
| **DigestiveSystem** | Stomach contents, digestion output, diet gene | Organism energy, stomach contents | Energy gain before energy costs (prevents false starvation) |
| **CombatSystem** | Attack intents, entity positions (post-physics) | Health, meat pellets, knockback forces | Needs post-movement positions for adjacency checks |
| **EnergySystem** | Action intents, metabolism, movement amounts | Organism energy, free biomass | Deduct costs after gains to allow net-energy calculation |
| **ReproductionSystem** | Energy, maturity, brain output (Want2Reproduce) | Eggs, new organisms | Needs current energy to check if reproduction is affordable |
| **GeneticsSystem** | Parent genes, mutation parameters | Offspring genes, mutation pool | Runs immediately after reproduction spawns offspring |
| **EnvironmentSystem** | Free biomass, biome map, season state | Plant pellets, pheromone grid, season | Independent of organism actions; world-level changes |
| **DeathSystem** | Health, energy, age | Dead organism removal, meat pellets | Must run after combat damage and energy deduction |
| **PersistenceSystem** | All entity state changes this tick | Spatial hash updates, event queue, delta buffer | Final bookkeeping; spatial hash must be current for next tick's SenseSystem |

### 2.3 Main Tick Function

```typescript
// server/src/simulation/world.ts

export class World {
  currentTick: number = 0;
  readonly dt: number = 1 / 20;  // Fixed timestep: 1/20th of a sim second per tick

  // Entity storage
  organisms: Organism[] = [];
  pellets: Pellet[] = [];
  eggs: Egg[] = [];

  // Subsystems
  spatialHash: SpatialHashGrid;
  pheromoneGrid: PheromoneGrid;
  biomeMap: BiomeMap;
  seasonState: SeasonState;

  // Systems (initialized in constructor)
  private senseSystem: SenseSystem;
  private brainSystem: BrainSystem;
  private actionSystem: ActionSystem;
  private physicsSystem: PhysicsSystem;
  private digestiveSystem: DigestiveSystem;
  private combatSystem: CombatSystem;
  private energySystem: EnergySystem;
  private reproductionSystem: ReproductionSystem;
  private geneticsSystem: GeneticsSystem;
  private environmentSystem: EnvironmentSystem;
  private deathSystem: DeathSystem;
  private persistenceSystem: PersistenceSystem;

  // Metrics
  timing: TickTiming | null = null;
  freeBiomass: number = 0;
  totalEnergy: number = 0;

  tick(): void {
    // NOTE: Each system call below is wrapped with debugCollector.profileAndRun()
    // for per-system timing instrumentation. See debug.md §A.3 for details.
    // Example: debugCollector.profileAndRun('SenseSystem', () => { ... });

    // 1. Sense: populate brain inputs from environment
    this.senseSystem.update(
      this.organisms, this.spatialHash, this.pheromoneGrid, this.dt,
    );

    // 2. Brain: forward-pass all neural networks
    this.brainSystem.update(this.organisms, this.dt);

    // 3. Action: translate brain outputs to intents
    this.actionSystem.update(this.organisms, this.dt);

    // 4. Physics: apply forces, collisions, toroidal wrapping
    this.physicsSystem.update(this.organisms, this.pellets, this.dt);

    // 5. Digestion: process stomachs, extract energy
    this.digestiveSystem.update(this.organisms, this.dt);

    // 6. Combat: resolve attacks, apply damage, spawn meat
    const combatResults = this.combatSystem.update(
      this.organisms, this.pellets, this.spatialHash, this.dt,
    );

    // 7. Energy: deduct metabolism, movement, brain costs
    this.energySystem.update(this.organisms, this.dt);

    // 8. Reproduction: egg production, hatching, offspring spawn
    const newOrganisms = this.reproductionSystem.update(
      this.organisms, this.eggs, this.dt,
    );

    // 9. Genetics: mutate newborns, track mutation pool
    this.geneticsSystem.update(newOrganisms, this.dt);

    // 10. Environment: plants, decay, pheromones, seasons, fungi
    this.environmentSystem.update(
      this.pellets, this.pheromoneGrid, this.biomeMap,
      this.seasonState, this.freeBiomass, this.dt,
    );

    // 11. Death: check death conditions, convert to meat
    const deadOrganisms = this.deathSystem.update(this.organisms, this.dt);
    for (const dead of deadOrganisms) {
      const meatEnergy = dead.bodyEnergy
        + dead.energy
        + dead.fatStored * 0.765;
      this.spawnMeatPellet(dead.x, dead.y, meatEnergy);
      this.removeOrganism(dead);
    }

    // 12. Persistence: update spatial hash, queue events
    this.persistenceSystem.update(
      this.organisms, this.pellets, this.spatialHash,
      combatResults, newOrganisms, deadOrganisms, this.dt,
    );

    // Advance tick counter
    this.currentTick++;
  }

  get entityCount(): number {
    return this.organisms.length + this.pellets.length + this.eggs.length;
  }
}
```

### 2.4 Tick Profiling Hooks

> **Note**: `TickProfiler` is **subsumed by `DebugCollector`** (see [`debug.md`](../debug.md) §A.2). `DebugCollector.profileAndRun()` replaces `TickProfiler.wrap()` and additionally records per-tick ring buffer history, energy snapshots, brain traces, and spatial stats. The `TickProfiler` code below is retained for reference but should not be used directly — use `DebugCollector` instead.

For performance monitoring, each system can be wrapped with timing instrumentation:

```typescript
// server/src/simulation/profiler.ts

interface SystemProfile {
  name: string;
  totalMs: number;
  callCount: number;
  avgMs: number;
  maxMs: number;
  lastMs: number;
}

export class TickProfiler {
  private profiles: Map<string, SystemProfile> = new Map();
  private enabled: boolean = false;

  enable(): void { this.enabled = true; }
  disable(): void { this.enabled = false; }

  wrap<T>(systemName: string, fn: () => T): T {
    if (!this.enabled) return fn();

    const start = process.hrtime.bigint();
    const result = fn();
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;

    let profile = this.profiles.get(systemName);
    if (!profile) {
      profile = {
        name: systemName, totalMs: 0,
        callCount: 0, avgMs: 0, maxMs: 0, lastMs: 0,
      };
      this.profiles.set(systemName, profile);
    }

    profile.totalMs += durationMs;
    profile.callCount++;
    profile.avgMs = profile.totalMs / profile.callCount;
    profile.maxMs = Math.max(profile.maxMs, durationMs);
    profile.lastMs = durationMs;

    return result;
  }

  /** Returns breakdown for /health endpoint */
  getReport(): Record<string, { avgMs: number; maxMs: number; lastMs: number }> {
    const report: Record<
      string, { avgMs: number; maxMs: number; lastMs: number }
    > = {};
    for (const [name, p] of this.profiles) {
      report[name] = {
        avgMs: +p.avgMs.toFixed(3),
        maxMs: +p.maxMs.toFixed(3),
        lastMs: +p.lastMs.toFixed(3),
      };
    }
    return report;
  }

  reset(): void {
    this.profiles.clear();
  }
}
```

**Expected tick time breakdown** (target ~3 ms total on ARM):

| System | Expected Time | Notes |
|--------|--------------|-------|
| SenseSystem | ~0.8 ms | Spatial hash queries for ~900 organisms |
| BrainSystem | ~0.6 ms | ~900 forward passes, ~15 nodes avg |
| PhysicsSystem | ~0.3 ms | Force integration + collision |
| EnvironmentSystem | ~0.3 ms | Pheromone diffusion (grid-based, O(cells)) |
| All others combined | ~0.5 ms | Simple arithmetic per organism |
| **Total** | **~2.5 ms** | Leaves ~22 ms headroom per 25 ms tick (at default 40 TPS) |

---

## 3. Entity-Component Data Layout

### 3.1 Design Philosophy

Entities are stored as **flat structs** (TypeScript interfaces backed by typed arrays where performance matters). The game uses a simplified entity-component approach: each entity type has a fixed set of components, not a general-purpose ECS. This avoids the overhead of component lookup tables while keeping data organized.

### 3.2 Entity ID System

Every entity in the simulation has a compact numeric ID (u16). The 16-bit range supports 65,535 entities, which is an order of magnitude above the ~6,400 target entity count.

```typescript
// server/src/simulation/entity-ids.ts

export class EntityIdPool {
  private nextId: number = 1;             // 0 is reserved as "no entity"
  private recycledIds: number[] = [];     // Stack of released IDs
  private maxId: number = 65535;          // u16 max

  /** Allocate a new entity ID. Reuses recycled IDs first. */
  allocate(): number {
    if (this.recycledIds.length > 0) {
      return this.recycledIds.pop()!;
    }
    if (this.nextId > this.maxId) {
      throw new Error('Entity ID pool exhausted');
    }
    return this.nextId++;
  }

  /** Release an entity ID for future reuse. */
  release(id: number): void {
    this.recycledIds.push(id);
  }

  /** Number of IDs currently in use. */
  get activeCount(): number {
    return (this.nextId - 1) - this.recycledIds.length;
  }
}
```

**Why ID recycling matters**: Organisms are born and die continuously (target lifespan ~2,000-4,000 ticks). Without recycling, the ID space would exhaust in ~18 real-time hours at 40 TPS. With recycling, IDs are reused as organisms die, and the active count stays near the current entity count.

**ID stability for clients**: Entity IDs are stable for the lifetime of an entity. When a client receives a DELTA update, it can use the entity ID to match updates to its local entity map. Recycled IDs are not reused within the same tick, preventing ambiguity.

### 3.3 Organism Interface

The `Organism` is the most complex entity. It carries body stats, brain state, biological state, and per-tick action intents.

```typescript
// server/src/simulation/organism.ts

export interface Organism {
  // -- Identity --
  id: number;                        // u16 entity ID
  speciesId: number;                 // u16 species slot
  playerId: string;                  // UUID of owning player (or 'AI')
  generation: number;                // Generational depth from founder

  // -- Spatial --
  x: number;                         // World position [0, 500)
  y: number;
  heading: number;                   // Radians [0, 2*PI)
  vx: number;                        // Velocity components
  vy: number;
  angularVelocity: number;

  // -- Body stats (from design, modified by genes) --
  sizeRatio: number;                 // 0.3 - 3.0
  speedRatio: number;                // 0.2 - 2.5
  strength: number;                  // 0.1 - 5.0
  defense: number;                   // 0.0 - 4.0
  diet: number;                      // 0.0 - 1.0
  viewAngle: number;                 // Radians (converted from degrees)
  viewRadius: number;                // 1.0 - 10.0 units
  metabolism: number;                // 0.5 - 3.0
  stomachMultiplier: number;         // 0.3 - 2.0

  // -- Appearance --
  colorR: number;                    // 0.0 - 1.0
  colorG: number;
  colorB: number;

  // -- Derived (cached, recomputed on stat change) --
  size1D: number;                    // sizeRatio * sqrt(maturity) * baseSize
  size2D: number;                    // PI * size1D^2
  mass: number;                      // size2D * bodyMassDensity + stomachMass
  stomachCapacity: number;           // (size2D / 2) * stomachMultiplier
  maxHealth: number;                 // 100 * maturity * sizeRatio^2
  maxEnergy: number;                 // baseCellEnergy * size2D

  // -- Biological state --
  health: number;
  energy: number;
  maturity: number;                  // 0.0 - 1.0 (1.0 = adult)
  age: number;                       // Simulation-seconds alive
  stomachPlant: number;              // u^2 of plant material in stomach
  stomachMeat: number;               // u^2 of meat material in stomach
  fatStored: number;                 // Energy in fat reserves
  eggProgress: number;               // 0.0 - 1.0 (egg readiness)
  bodyEnergy: number;                // Energy invested in body growth

  // -- Status flags --
  isEating: boolean;
  isAttacking: boolean;
  isFleeing: boolean;
  isBurrowed: boolean;
  isReproducing: boolean;
  isDead: boolean;
  isGrabbing: boolean;

  // -- Traits --
  hasArmorPlating: boolean;
  armorTier: number;                 // 0-3
  armorDirection: 'front' | 'back' | null;
  hasVenom: boolean;
  hasEcholocation: boolean;
  hasBurrowing: boolean;
  hasCamouflage: boolean;
  fatReservesTier: number;           // 0-4
  hasSporeDispersal: boolean;
  hasHerdCoordination: boolean;
  hasSexualReproduction: boolean;  // Sexual Reproduction trait (Tier 3, 10 BP)
  hasEncounterInfoSharing: boolean; // Encounter Info Sharing trait (Tier 4, 8 BP)

  // -- Sexual reproduction state --
  sex: number;                     // 0.0=female, 1.0=male (immutable, only for sexual species)
  matingCooldown: number;          // Seconds remaining until can mate again (0 = ready)

  // -- Venom state --
  venomDPS: number;                  // Incoming venom damage per second
  venomTimeRemaining: number;        // Seconds of venom remaining

  // -- Immune system --
  immuneStrength: number;            // From BaseImmuneActivation gene

  // -- Fat reserves --
  maxFatCapacity: number;            // fatTier × 50
  fatDepositRate: number;            // Computed from digestion

  // -- Burrowing state --
  burrowCooldown: number;            // Seconds until can re-burrow
  burrowSurfaceTimer: number;        // Seconds remaining in surfacing
  burrowSpeed: number;               // From BurrowSpeed gene (1.0-2.5s)
  burrowEfficiency: number;          // From BurrowEfficiency gene (1.5-2.5x)

  // -- Camouflage state --
  camoBreakTimer: number;            // Seconds until camo restores
  camoStrength: number;              // From design slider (0.3-0.8)

  // -- Echolocation state --
  echoRange: number;                 // From design slider (0.3-0.8)
  echoPrecision: boolean;            // From design slider
  echoFrequency: number;             // Duty cycle (0.25-1.0)

  // -- Sound state --
  soundEmitIntensity: number;
  soundEmitFrequency: number;        // Base frequency from design, mutable gene

  // -- Encounter state --
  encounterMemoryDuration: number;   // From gene (5-30s)
  encounterFoodMemory: number;       // Timer for AllyLastFoodAngle
  encounterThreatMemory: number;     // Timer for AllyLastThreatAngle

  // -- Nest --
  nestAffinity: number;              // From design slider (0-1)

  // -- Growth --
  growthSpeed: number;               // From design slider (0.5-2.0)

  // -- Brain (reference to pre-compiled brain struct) --
  brain: CompiledBrain;

  // -- Action intents (set by ActionSystem, consumed by other systems) --
  moveForce: number;                 // Applied forward/backward force
  turnTorque: number;                // Applied turning torque
  wantToEat: number;                 // 0-1 eating desire
  wantToAttack: number;              // 0-1 attack desire
  wantToFlee: number;                // 0-1 flee desire
  wantToGrow: number;                // 0-1 growth desire
  digestionLevel: number;            // 0-1 stomach acid level
  wantToReproduce: number;           // 0-1 reproduction desire
  wantToHeal: number;                // 0-1 healing desire
  herdingIntensity: number;          // 0-1 herding desire
  burrowDesire: number;              // 0-1 burrowing desire
  wantToMate: number;                // 0-1 mating desire (requires Sexual Reproduction)
  pheromoneEmit: [number, number, number]; // RGB emission intensities
  soundEmit: number;                 // 0-1 sound emission intensity

  // -- Genes (mutable per-organism, inherited + mutated) --
  genes: OrganismGenes;

  // -- Ageing --
  ageingFactor: number;              // Accumulated ageing penalty
  entropyMultiplier: number;         // Species-level entropy cost
}

export interface OrganismGenes {
  // Body genes
  sizeRatio: number;
  speedRatio: number;
  strength: number;
  defense: number;
  diet: number;
  viewAngle: number;
  viewRadius: number;
  metabolism: number;
  stomachMultiplier: number;
  redColor: number;
  greenColor: number;
  blueColor: number;

  // Reproduction genes
  layTime: number;
  broodTime: number;
  hatchTime: number;
  sex: number;                       // 0.0=female, 1.0=male (immutable, sexual species only)

  // Biology genes
  growthScale: number;
  growthMaturityFactor: number;
  growthMaturityExponent: number;
  internalClockPeriod: number;
  baseImmuneActivation: number;
  fatStorageThreshold: number;
  fatStorageDeadband: number;
  encounterMemoryDuration: number;  // Range 5-30s, controls encounter memory persistence
  burrowSpeed: number;              // Range 1.0-2.5s, controls surfacing time
  burrowEfficiency: number;         // Range 1.5-2.5x, controls underground metabolism multiplier
  soundFrequency: number;           // Range 0-1, base sound emission frequency (mutable)

  // Social genes
  herdSeparationWeight: number;
  herdAlignmentWeight: number;
  herdCohesionWeight: number;
  herdVelocityWeight: number;
  herdSeparationDistance: number;

  // Meta-mutation genes
  geneMutationChance: number;        // Poisson lambda (~2.0 default)
  geneMutationVariance: number;      // Gaussian sigma (~0.15 default)
  brainMutationChance: number;       // Poisson lambda (~1.5 default)

  // Brain genes (synapse weights and node biases)
  synapseWeights: number[];          // Indexed by synapse order
  nodeBiases: number[];              // Indexed by node order
}
```

### 3.4 Pellet Interface

Pellets are simpler: a position, type, size, and energy value.

```typescript
// server/src/simulation/pellet.ts

export interface Pellet {
  id: number;                         // u16 entity ID
  type: PelletType;                   // Plant or Meat
  x: number;
  y: number;
  size: number;                       // Area in u^2
  energy: number;                     // Remaining energy content
  initialEnergy: number;              // Energy at spawn (for decay ratio)
  colorR: number;
  colorG: number;
  colorB: number;
  age: number;                        // Simulation-seconds since spawn
  biome: BiomeType;                   // Biome where it was spawned
}

export enum PelletType {
  Plant = 0x02,
  Meat  = 0x03,
}
```

### 3.5 Egg Interface

```typescript
// server/src/simulation/egg.ts

export interface Egg {
  id: number;                         // u16 entity ID
  x: number;
  y: number;
  parentId: number;                   // u16 parent organism ID
  speciesId: number;
  playerId: string;
  energy: number;                     // Energy invested in egg
  hatchTimeRemaining: number;         // Simulation-seconds until hatch
  genes: OrganismGenes;               // Inherited (already mutated) gene set
  brain: BrainConfig;                 // Brain blueprint for offspring
  generation: number;                 // Parent generation + 1
}
```

### 3.6 Pheromone Grid

Pheromones are not tracked as individual entities. They use a separate grid-based diffusion model (see [Section 9.5](#95-pheromone-diffusion)).

```typescript
// server/src/simulation/pheromone.ts

/** Grid-based pheromone state. Uses its own spatial grid. */
export interface PheromoneGrid {
  resolution: number;                 // Grid cells per axis (e.g., 50)
  cellSize: number;                   // World units per cell (e.g., 10)
  red: Float32Array;                  // Flat array [resolution * resolution]
  green: Float32Array;
  blue: Float32Array;
}
```

### 3.7 Memory Layout Considerations

At ~6,400 entities, memory is not a bottleneck. However, the layout choices affect cache performance during the tight inner loops of the tick pipeline:

1. **Organisms are stored in a flat array** (`World.organisms: Organism[]`). Systems iterate this array linearly. The SenseSystem and BrainSystem -- the two most expensive systems -- iterate all organisms every tick. Array-of-structs layout means each organism's data is contiguous, which is acceptable for the ~900 organism count.

2. **Brain data uses typed arrays** (`Float64Array`) for neuron activations and synapse weights. This avoids V8 object overhead and enables tight numeric loops without boxing. See [Section 5](#5-neural-network-engine) for details.

3. **Pellets use a separate flat array**. The spatial hash grid stores entity IDs (not references), so lookups go through the array index. Separate arrays for pellets and organisms avoid type checking during iteration.

4. **Entity removal** uses swap-and-pop: the last element replaces the removed element, avoiding array shift costs. Entity array indices are NOT stable -- only entity IDs are stable.

```typescript
/** O(1) removal from unordered array. Swaps target with last element. */
function swapRemove<T extends { id: number }>(arr: T[], index: number): void {
  const last = arr.length - 1;
  if (index !== last) {
    arr[index] = arr[last];
  }
  arr.pop();
}
```

**Estimated memory per entity type**:

| Entity | Fields | Approx. Size | Count | Total |
|--------|--------|-------------|-------|-------|
| Organism | ~80 numeric fields + brain ref + genes | ~2 KB | 900 | ~1.8 MB |
| Pellet | ~15 fields | ~200 B | 5,500 | ~1.1 MB |
| Egg | ~20 fields + genes + brain config | ~1 KB | ~50 | ~50 KB |
| Pheromone grid | 3 channels x 50x50 floats | ~30 KB | 1 | ~30 KB |
| Spatial hash | 400 cells x ID lists | ~50 KB | 1 | ~50 KB |
| **Total entity data** | | | | **~3 MB** |

Combined with Node.js runtime overhead (~100-200 MB), mutation pool tracking (~10 MB), and WebSocket buffers (~50 KB per client), total server memory stays well under 500 MB.

---

## 4. Spatial Hash Grid

### 4.1 Grid Parameters

The spatial hash grid partitions the 500x500 toroidal world into fixed-size cells. Every entity is assigned to the cell covering its position, enabling O(nearby) proximity queries instead of O(total) brute-force scans.

> **Reference**: See [`architecture.md` Section 2.5](../architecture.md) -- "Spatial partitioning: World divided into a grid of cells (25x25 = 625 cells, each 20x20 units)." Note: this document uses a 20x20 grid of 25-unit cells (400 cells total for a 500x500 world), which is equivalent.

```
World: 500 x 500 units (toroidal wrapping)

Cell size:   25 x 25 units
Grid size:   20 x 20 cells  (500 / 25 = 20)
Total cells: 400

+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+
| 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |10 |11 |12 |13 |14 |15 |16 |17 |18 |19 |
+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+
|20 |21 |                 ... 500 x 500 world ...                           |39 |
+---+---+               20 x 20 grid of 25-unit cells                      +---+
|40 |41 |               Each cell holds a list of entity IDs                |59 |
+---+---+                                                                   +---+
   ...                                                                       ...
+---+---+                                                                   +---+
|380|381|                                                                   |399|
+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+---+

Average entities per cell:
  ~900 organisms / 400 cells  = ~2.25 organisms/cell
  ~5,500 pellets / 400 cells  = ~13.75 pellets/cell
  Total: ~16 entities/cell average

Cell size rationale:
  Max organism view radius = 10.0 units
  Cell size = 25 units > 2 * max view radius
  A vision cone query touches at most 3x3 = 9 cells
  (the organism's cell + all 8 neighbors)
```

### 4.2 Data Structure

```typescript
// server/src/simulation/spatial-hash.ts

export class SpatialHash {
  readonly cellSize = 25;
  readonly gridWidth = 20;
  readonly gridHeight = 20;
  readonly worldWidth = 500;
  readonly worldHeight = 500;

  // Per-cell entity ID lists (fixed-capacity typed arrays)
  organismCells: Uint16Array[];
  pelletCells: Uint16Array[];
  organismCounts: Uint16Array;        // Used count per cell
  pelletCounts: Uint16Array;

  // Reverse lookup: entityId -> cellIndex (for fast remove/update)
  private organismCellMap: Uint16Array;
  private pelletCellMap: Uint16Array;

  private static readonly MAX_ORGANISMS_PER_CELL = 32;
  private static readonly MAX_PELLETS_PER_CELL = 64;

  constructor() {
    const totalCells = this.gridWidth * this.gridHeight; // 400

    this.organismCells = new Array(totalCells);
    this.pelletCells = new Array(totalCells);
    this.organismCounts = new Uint16Array(totalCells);
    this.pelletCounts = new Uint16Array(totalCells);

    for (let i = 0; i < totalCells; i++) {
      this.organismCells[i] =
        new Uint16Array(SpatialHash.MAX_ORGANISMS_PER_CELL);
      this.pelletCells[i] =
        new Uint16Array(SpatialHash.MAX_PELLETS_PER_CELL);
    }

    this.organismCellMap = new Uint16Array(65536);
    this.pelletCellMap = new Uint16Array(65536);
  }

  /** Convert world position to cell index with toroidal wrapping. */
  cellIndex(x: number, y: number): number {
    const wx = ((x % this.worldWidth) + this.worldWidth) % this.worldWidth;
    const wy = ((y % this.worldHeight) + this.worldHeight) % this.worldHeight;
    const cx = (wx / this.cellSize) | 0;
    const cy = (wy / this.cellSize) | 0;
    return cy * this.gridWidth + cx;
  }

  // ---- INSERT ----

  insertOrganism(id: number, x: number, y: number): void {
    const cell = this.cellIndex(x, y);
    const count = this.organismCounts[cell];
    if (count < SpatialHash.MAX_ORGANISMS_PER_CELL) {
      this.organismCells[cell][count] = id;
      this.organismCounts[cell] = count + 1;
      this.organismCellMap[id] = cell;
    }
  }

  insertPellet(id: number, x: number, y: number): void {
    const cell = this.cellIndex(x, y);
    const count = this.pelletCounts[cell];
    if (count < SpatialHash.MAX_PELLETS_PER_CELL) {
      this.pelletCells[cell][count] = id;
      this.pelletCounts[cell] = count + 1;
      this.pelletCellMap[id] = cell;
    }
  }

  // ---- REMOVE ----

  removeOrganism(id: number): void {
    const cell = this.organismCellMap[id];
    const count = this.organismCounts[cell];
    const arr = this.organismCells[cell];
    for (let i = 0; i < count; i++) {
      if (arr[i] === id) {
        arr[i] = arr[count - 1]; // Swap with last
        this.organismCounts[cell] = count - 1;
        return;
      }
    }
  }

  removePellet(id: number): void {
    const cell = this.pelletCellMap[id];
    const count = this.pelletCounts[cell];
    const arr = this.pelletCells[cell];
    for (let i = 0; i < count; i++) {
      if (arr[i] === id) {
        arr[i] = arr[count - 1];
        this.pelletCounts[cell] = count - 1;
        return;
      }
    }
  }

  // ---- UPDATE (move between cells) ----

  updateOrganism(id: number, newX: number, newY: number): void {
    const oldCell = this.organismCellMap[id];
    const newCell = this.cellIndex(newX, newY);
    if (oldCell !== newCell) {
      this.removeOrganism(id);
      this.insertOrganism(id, newX, newY);
    }
  }

  // ---- QUERIES ----

  /** Returns organism IDs in the 3x3 neighborhood around a cell. */
  queryOrganismsNear(
    cellX: number, cellY: number,
  ): { ids: Uint16Array; count: number }[] {
    const results: { ids: Uint16Array; count: number }[] = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = ((cellX + dx) % this.gridWidth
          + this.gridWidth) % this.gridWidth;
        const ny = ((cellY + dy) % this.gridHeight
          + this.gridHeight) % this.gridHeight;
        const idx = ny * this.gridWidth + nx;
        results.push({
          ids: this.organismCells[idx],
          count: this.organismCounts[idx],
        });
      }
    }
    return results;
  }

  /** Returns pellet IDs in the 3x3 neighborhood around a cell. */
  queryPelletsNear(
    cellX: number, cellY: number,
  ): { ids: Uint16Array; count: number }[] {
    const results: { ids: Uint16Array; count: number }[] = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = ((cellX + dx) % this.gridWidth
          + this.gridWidth) % this.gridWidth;
        const ny = ((cellY + dy) % this.gridHeight
          + this.gridHeight) % this.gridHeight;
        const idx = ny * this.gridWidth + nx;
        results.push({
          ids: this.pelletCells[idx],
          count: this.pelletCounts[idx],
        });
      }
    }
    return results;
  }

  /** Full rebuild from entity arrays. Called on snapshot restore. */
  rebuild(organisms: Organism[], pellets: Pellet[]): void {
    this.organismCounts.fill(0);
    this.pelletCounts.fill(0);
    for (const org of organisms) {
      this.insertOrganism(org.id, org.x, org.y);
    }
    for (const pel of pellets) {
      this.insertPellet(pel.id, pel.x, pel.y);
    }
  }
}
```

### 4.3 Vision Cone Query Algorithm

The SenseSystem uses the spatial hash to find entities within each organism's field of vision. The vision cone is defined by the organism's position, heading, view angle, and view radius.

> **Reference**: See [`core-gameplay-systems.md` Section 1.2](../core-gameplay-systems.md) for the brain input nodes that depend on vision queries: `NearestPlantAngle`, `NearestPlantDist`, `NearestOrganismAngle`, `NearestOrganismDist`, `NearestOrganismSize`, etc.

```
Vision Cone Query for one organism:

                        viewRadius
                    <------------->

                          /  \
                         /    \
                        / cone \
                       / half   \
                      /  angle   \
     heading ->  [ORG]============\
                      \          /
                       \        /
                        \      /
                         \    /
                          \  /

  Algorithm:
  1. Compute organism's grid cell (cx, cy)
  2. Gather all entity IDs from the 3x3 neighborhood cells
  3. For each candidate entity:
     a. Compute toroidal distance (dx, dy, distSq)
     b. Skip if distSq > viewRadius^2
     c. Compute angle = atan2(dy, dx)
     d. Compute angleDiff = normalize(angle - heading)
     e. Skip if |angleDiff| > viewAngle / 2
     f. Track nearest by category
```

```typescript
// server/src/simulation/sense-system.ts (vision query)

interface VisionResult {
  nearestPlant: { angle: number; dist: number } | null;
  nearestMeat: { angle: number; dist: number } | null;
  nearestOrganism: {
    angle: number; dist: number;
    relativeSize: number; color: number;
  } | null;
  nearestAlly: { angle: number; dist: number } | null;
  visibleOrganismCount: number;
  visibleFoodCount: number;
  nearestAllyCount: number;
}

function queryVisionCone(
  org: Organism,
  spatialHash: SpatialHash,
  organisms: Organism[],
  pellets: Pellet[],
  worldW: number,
  worldH: number,
): VisionResult {
  const result: VisionResult = {
    nearestPlant: null, nearestMeat: null,
    nearestOrganism: null, nearestAlly: null,
    visibleOrganismCount: 0, visibleFoodCount: 0,
    nearestAllyCount: 0,
  };

  const halfAngle = org.viewAngle / 2;
  const viewRadSq = org.viewRadius * org.viewRadius;
  const orgCellX = (((org.x / 25) | 0) % 20 + 20) % 20;
  const orgCellY = (((org.y / 25) | 0) % 20 + 20) % 20;

  let nearestPlantDistSq = Infinity;
  let nearestMeatDistSq = Infinity;
  let nearestOrgDistSq = Infinity;
  let nearestAllyDistSq = Infinity;

  // --- Query nearby organisms ---
  const orgCells = spatialHash.queryOrganismsNear(orgCellX, orgCellY);
  for (const cell of orgCells) {
    for (let i = 0; i < cell.count; i++) {
      const targetId = cell.ids[i];
      if (targetId === org.id) continue;

      const target = findById(organisms, targetId);
      if (!target || target.isDead) continue;
      if (target.isBurrowed && !org.hasEcholocation) continue;

      // Camouflage reduces effective view radius
      let effViewRadSq = viewRadSq;
      if (target.hasCamouflage) {
        const spd = Math.sqrt(target.vx ** 2 + target.vy ** 2);
        const maxSpd = target.speedRatio * 2;
        const ratio = Math.min(1, spd / maxSpd);
        const reduction = 0.6 * (1 - ratio) ** 2;
        const effRadius = Math.max(
          org.viewRadius * 0.15,
          org.viewRadius * (1 - reduction),
        );
        effViewRadSq = effRadius * effRadius;
      }

      const { dx, dy, distSq } = toroidalDistSq(
        org.x, org.y, target.x, target.y, worldW, worldH,
      );
      if (distSq > effViewRadSq) continue;

      // Vision cone check (skip for 360-degree vision)
      if (org.viewAngle < Math.PI * 2 - 0.01) {
        const angle = Math.atan2(dy, dx);
        const diff = normalizeAngle(angle - org.heading);
        if (Math.abs(diff) > halfAngle) continue;
      }

      result.visibleOrganismCount++;
      const angle = Math.atan2(dy, dx);
      const relAngle = normalizeAngle(angle - org.heading);

      if (target.speciesId === org.speciesId) {
        result.nearestAllyCount++;
        if (distSq < nearestAllyDistSq) {
          nearestAllyDistSq = distSq;
          result.nearestAlly = {
            angle: relAngle, dist: Math.sqrt(distSq),
          };
        }
      }
      if (distSq < nearestOrgDistSq) {
        nearestOrgDistSq = distSq;
        result.nearestOrganism = {
          angle: relAngle,
          dist: Math.sqrt(distSq),
          relativeSize: target.size1D / (target.size1D + org.size1D),
          color: target.colorR,
        };
      }
    }
  }

  // --- Query nearby pellets ---
  const pelCells = spatialHash.queryPelletsNear(orgCellX, orgCellY);
  for (const cell of pelCells) {
    for (let i = 0; i < cell.count; i++) {
      const pellet = findById(pellets, cell.ids[i]);
      if (!pellet) continue;

      const { dx, dy, distSq } = toroidalDistSq(
        org.x, org.y, pellet.x, pellet.y, worldW, worldH,
      );
      if (distSq > viewRadSq) continue;

      if (org.viewAngle < Math.PI * 2 - 0.01) {
        const angle = Math.atan2(dy, dx);
        const diff = normalizeAngle(angle - org.heading);
        if (Math.abs(diff) > halfAngle) continue;
      }

      result.visibleFoodCount++;
      const angle = Math.atan2(dy, dx);
      const relAngle = normalizeAngle(angle - org.heading);

      if (pellet.type === PelletType.Plant
          && distSq < nearestPlantDistSq) {
        nearestPlantDistSq = distSq;
        result.nearestPlant = {
          angle: relAngle, dist: Math.sqrt(distSq),
        };
      } else if (pellet.type === PelletType.Meat
          && distSq < nearestMeatDistSq) {
        nearestMeatDistSq = distSq;
        result.nearestMeat = {
          angle: relAngle, dist: Math.sqrt(distSq),
        };
      }
    }
  }

  return result;
}

/** Toroidal distance squared between two points. */
function toroidalDistSq(
  x1: number, y1: number, x2: number, y2: number,
  w: number, h: number,
): { dx: number; dy: number; distSq: number } {
  let dx = x2 - x1;
  let dy = y2 - y1;
  if (dx > w / 2) dx -= w;
  else if (dx < -w / 2) dx += w;
  if (dy > h / 2) dy -= h;
  else if (dy < -h / 2) dy += h;
  return { dx, dy, distSq: dx * dx + dy * dy };
}

function normalizeAngle(a: number): number {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
}
```

**Performance**: With ~16 entities per cell and a 3x3 neighborhood, each vision cone checks ~144 candidates. With ~900 organisms, the SenseSystem performs ~130,000 distance+angle checks per tick (~10 ops each = ~1.3M operations), well within the ~0.8 ms budget.

---

## 5. Neural Network Engine

### 5.1 Brain Compilation

When an organism is spawned, its `BrainConfig` (the visual node graph) is compiled into a `CompiledBrain` -- a flat-array representation optimized for fast forward passes.

> **Reference**: See [`core-gameplay-systems.md` Section 1.2](../core-gameplay-systems.md) for the full list of input nodes (36 across Tier 1-4), output nodes (17 across Tier 1-4), hidden node types (12 activation functions), and synapse mechanics.

```typescript
// server/src/simulation/brain.ts

/**
 * CompiledBrain: flat-array representation of a neural network.
 * Compiled once at organism creation. The forward pass iterates
 * arrays in topological order with no object allocation.
 */
export interface CompiledBrain {
  // Node data (parallel arrays, indexed by nodeIndex)
  nodeCount: number;
  activations: Float64Array;          // Current activation values
  biases: Float64Array;               // Bias per node
  activationTypes: Uint8Array;        // Activation function enum
  nodeCategories: Uint8Array;         // 0=input, 1=hidden, 2=output

  // Topology (execution order from topological sort)
  executionOrder: Uint16Array;
  inputNodeCount: number;
  outputNodeCount: number;
  hiddenNodeCount: number;

  // Synapse data (parallel arrays, indexed by synapseIndex)
  synapseCount: number;
  synapseSources: Uint16Array;
  synapseTargets: Uint16Array;
  synapseWeights: Float64Array;

  // Synapse grouping by target for fast accumulation
  targetSynapseStart: Uint16Array;    // First synapse idx for this target
  targetSynapseEnd: Uint16Array;      // One past last synapse idx

  // Stateful node memory (Latch, Differential, Integrator, Inhibitory)
  latchStates: Float64Array;
  prevInputs: Float64Array;
  integratorStates: Float64Array;

  // Input/Output mapping to sensor/output enums
  inputMapping: Uint8Array;
  outputMapping: Uint8Array;
}
```

### 5.2 Topological Sort at Creation

The compilation performs a topological sort (Kahn's algorithm) so that when a node is evaluated, all upstream inputs have already been computed this tick.

```typescript
// server/src/simulation/brain-compiler.ts

export function compileBrain(config: BrainConfig): CompiledBrain {
  const { nodes, synapses } = config;

  // Step 1: Build adjacency list from enabled synapses
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();
  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adjacency.set(node.id, []);
  }
  for (const syn of synapses) {
    if (!syn.enabled) continue;
    inDegree.set(
      syn.targetNodeId,
      (inDegree.get(syn.targetNodeId) || 0) + 1,
    );
    adjacency.get(syn.sourceNodeId)!.push(syn.targetNodeId);
  }

  // Step 2: Kahn's algorithm
  const queue: string[] = [];
  for (const [nodeId, degree] of inDegree) {
    if (degree === 0) queue.push(nodeId);
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);
    for (const neighbor of adjacency.get(current) || []) {
      const newDeg = inDegree.get(neighbor)! - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  // Handle cycles: remaining nodes use previous-tick values
  if (sorted.length < nodes.length) {
    for (const node of nodes) {
      if (!sorted.includes(node.id)) sorted.push(node.id);
    }
  }

  // Step 3: Assign compact indices
  const nodeIndexMap = new Map<string, number>();
  for (let i = 0; i < sorted.length; i++) {
    nodeIndexMap.set(sorted[i], i);
  }

  // Step 4: Build flat arrays ...
  const nodeCount = sorted.length;
  const nodeById = new Map(nodes.map(n => [n.id, n]));

  const activations = new Float64Array(nodeCount);
  const biases = new Float64Array(nodeCount);
  const activationTypes = new Uint8Array(nodeCount);
  const nodeCategories = new Uint8Array(nodeCount);

  for (let i = 0; i < nodeCount; i++) {
    const node = nodeById.get(sorted[i])!;
    biases[i] = node.bias;
    activationTypes[i] = activationTypeToEnum(node.activation);
    nodeCategories[i] =
      node.type === 'input' ? 0 : node.type === 'hidden' ? 1 : 2;
  }

  // Step 5: Build synapse arrays sorted by target
  const enabled = synapses.filter(s => s.enabled);
  enabled.sort((a, b) =>
    nodeIndexMap.get(a.targetNodeId)! - nodeIndexMap.get(b.targetNodeId)!,
  );

  const synapseCount = enabled.length;
  const synapseSources = new Uint16Array(synapseCount);
  const synapseTargets = new Uint16Array(synapseCount);
  const synapseWeights = new Float64Array(synapseCount);
  const targetSynapseStart = new Uint16Array(nodeCount);
  const targetSynapseEnd = new Uint16Array(nodeCount);

  for (let i = 0; i < synapseCount; i++) {
    synapseSources[i] = nodeIndexMap.get(enabled[i].sourceNodeId)!;
    synapseTargets[i] = nodeIndexMap.get(enabled[i].targetNodeId)!;
    synapseWeights[i] = enabled[i].weight;
  }

  // Compute per-target synapse ranges
  let curTarget = -1;
  for (let i = 0; i < synapseCount; i++) {
    const t = synapseTargets[i];
    if (t !== curTarget) {
      if (curTarget >= 0) targetSynapseEnd[curTarget] = i;
      targetSynapseStart[t] = i;
      curTarget = t;
    }
  }
  if (curTarget >= 0) targetSynapseEnd[curTarget] = synapseCount;

  return {
    nodeCount, activations, biases, activationTypes,
    nodeCategories,
    executionOrder: new Uint16Array(sorted.map((_, i) => i)),
    inputNodeCount: nodes.filter(n => n.type === 'input').length,
    outputNodeCount: nodes.filter(n => n.type === 'output').length,
    hiddenNodeCount: nodes.filter(n => n.type === 'hidden').length,
    synapseCount, synapseSources, synapseTargets, synapseWeights,
    targetSynapseStart, targetSynapseEnd,
    latchStates: new Float64Array(nodeCount),
    prevInputs: new Float64Array(nodeCount),
    integratorStates: new Float64Array(nodeCount),
    inputMapping: buildInputMapping(nodes, nodeIndexMap),
    outputMapping: buildOutputMapping(nodes, nodeIndexMap),
  };
}
```

### 5.3 Activation Functions

All 12 activation functions from the gameplay design:

```typescript
// server/src/simulation/activations.ts

export const enum ActivationType {
  Sigmoid = 0, Linear = 1, ReLU = 2, TanH = 3,
  Latch = 4, Multiply = 5, Gaussian = 6, Differential = 7,
  Absolute = 8, Sine = 9, Integrator = 10, Inhibitory = 11,
}

export function activate(
  type: ActivationType, x: number,
  brain: CompiledBrain, nodeIdx: number, dt: number,
): number {
  switch (type) {
    case ActivationType.Sigmoid:
      return 1.0 / (1.0 + Math.exp(-x));           // [0, 1]

    case ActivationType.Linear:
      return Math.max(-100, Math.min(100, x));       // [-100, 100]

    case ActivationType.ReLU:
      return Math.min(100, Math.max(0, x));           // [0, 100]

    case ActivationType.TanH:
      return Math.tanh(x);                            // [-1, 1]

    case ActivationType.Latch: {
      // Binary with hysteresis: set at 1.0, reset at 0.0
      if (x >= 1.0) { brain.latchStates[nodeIdx] = 1; return 1; }
      if (x <= 0.0) { brain.latchStates[nodeIdx] = 0; return 0; }
      return brain.latchStates[nodeIdx];               // Hold
    }

    case ActivationType.Multiply:
      return Math.max(-100, Math.min(100, x));        // Product already computed

    case ActivationType.Gaussian:
      return 1.0 / (1.0 + x * x);                    // [0, 1], peak at 0

    case ActivationType.Differential: {
      const prev = brain.prevInputs[nodeIdx];
      brain.prevInputs[nodeIdx] = x;
      return Math.max(-100, Math.min(100, (x - prev) / dt));
    }

    case ActivationType.Absolute:
      return Math.min(100, Math.abs(x));               // [0, 100]

    case ActivationType.Sine:
      return Math.sin(x);                              // [-1, 1]

    case ActivationType.Integrator: {
      const val = brain.integratorStates[nodeIdx] + x * dt;
      brain.integratorStates[nodeIdx] = Math.max(-100, Math.min(100, val));
      return brain.integratorStates[nodeIdx];
    }

    case ActivationType.Inhibitory: {
      const prevIn = brain.prevInputs[nodeIdx];
      const novelty = x - prevIn;
      const decay = Math.exp(-Math.abs(brain.biases[nodeIdx]) * dt);
      const val = novelty + brain.integratorStates[nodeIdx] * decay;
      brain.prevInputs[nodeIdx] = x;
      brain.integratorStates[nodeIdx] = val;
      return Math.max(-100, Math.min(100, val));
    }

    default: return 0;
  }
}
```

### 5.4 Forward Pass

The core per-organism computation, called once per organism per tick:

```typescript
// server/src/simulation/brain-system.ts

export function forwardPass(brain: CompiledBrain, dt: number): void {
  const {
    nodeCount, activations, biases, activationTypes,
    nodeCategories, executionOrder,
    synapseSources, synapseWeights,
    targetSynapseStart, targetSynapseEnd,
  } = brain;

  for (let orderIdx = 0; orderIdx < nodeCount; orderIdx++) {
    const nodeIdx = executionOrder[orderIdx];

    // Skip input nodes (values set by SenseSystem)
    if (nodeCategories[nodeIdx] === 0) continue;

    const synStart = targetSynapseStart[nodeIdx];
    const synEnd = targetSynapseEnd[nodeIdx];
    const isMult = activationTypes[nodeIdx] === ActivationType.Multiply;

    // Accumulate incoming signals
    let accumulated: number;
    if (isMult) {
      accumulated = 1.0;
      let hasInput = false;
      for (let si = synStart; si < synEnd; si++) {
        accumulated *= activations[synapseSources[si]] * synapseWeights[si];
        hasInput = true;
      }
      if (!hasInput) accumulated = 0;
    } else {
      accumulated = 0;
      for (let si = synStart; si < synEnd; si++) {
        accumulated += activations[synapseSources[si]] * synapseWeights[si];
      }
    }

    accumulated += biases[nodeIdx];

    activations[nodeIdx] = activate(
      activationTypes[nodeIdx] as ActivationType,
      accumulated, brain, nodeIdx, dt,
    );
  }
}
```

### 5.5 Input Mapping (Sensors)

The SenseSystem populates brain input nodes before the forward pass:

```typescript
// server/src/simulation/sense-system.ts

export const enum SensorType {
  // Tier 1 (11 nodes)
  Constant = 0, EnergyRatio = 1, HealthRatio = 2, Fullness = 3,
  NearestPlantAngle = 4, NearestPlantDist = 5,
  NearestMeatAngle = 6, NearestMeatDist = 7,
  NearestOrganismAngle = 8, NearestOrganismDist = 9,
  NearestOrganismSize = 10,
  // Tier 2 (8 nodes)
  Speed = 11, Maturity = 12,
  NearestAllyAngle = 13, NearestAllyDist = 14,
  NOrganisms = 15, NFood = 16, IsGrabbing = 17, AttackedDamage = 18,
  // Tier 3 (12 nodes)
  Tic = 19, TimeAlive = 20, EggStored = 21, BiomeType = 22,
  SeasonPhase = 23, NearestOrganismColor = 24,
  NearestAllyCount = 25, StomachPlantRatio = 26,
  NearestMateAngle = 27, NearestMateDist = 28,
  Sex = 29, MatingCooldown = 30,
  // Tier 4 (10 nodes)
  Pheromone1Strength = 31, Pheromone2Strength = 32,
  Pheromone3Strength = 33, Pheromone1Angle = 34,
  Pheromone2Angle = 35, Pheromone3Angle = 36,
  SoundDirection = 37, SoundIntensity = 38, IsBurrowed = 39,
  SoundFrequency = 40,
}

function setInputs(org: Organism, vision: VisionResult, ...): void {
  const acts = org.brain.activations;
  const map = org.brain.inputMapping;
  for (let i = 0; i < org.brain.inputNodeCount; i++) {
    acts[i] = readSensor(map[i], org, vision, ...);
  }
}

function readSensor(s: SensorType, org: Organism, v: VisionResult, ...): number {
  switch (s) {
    case SensorType.Constant:         return 1.0;
    case SensorType.EnergyRatio:      return org.energy / org.maxEnergy;
    case SensorType.HealthRatio:      return org.health / org.maxHealth;
    case SensorType.Fullness:
      return (org.stomachPlant + org.stomachMeat) / org.stomachCapacity;
    case SensorType.NearestPlantAngle:
      return v.nearestPlant ? v.nearestPlant.angle / Math.PI : 0;
    case SensorType.NearestPlantDist:
      return v.nearestPlant ? v.nearestPlant.dist / org.viewRadius : 1;
    // ... (all 36 sensors follow the same pattern)
    default: return 0;
  }
}
```

### 5.6 Output Mapping

After the forward pass, the ActionSystem reads output node activations:

```typescript
// server/src/simulation/action-system.ts

export const enum OutputType {
  Accelerate = 0, Rotate = 1, Want2Eat = 2,
  Want2Attack = 3, Want2Flee = 4,           // Tier 1
  Want2Grow = 5, Digestion = 6,
  Grab = 7, Want2Heal = 8,                  // Tier 2
  Want2Reproduce = 9, Herding = 10,
  ClockReset = 11, Burrow = 12,
  Want2Mate = 13, StoreFat = 14,            // Tier 3
  EmitPheromone1 = 15, EmitPheromone2 = 16,
  EmitPheromone3 = 17, EmitSound = 18,
  SoundFrequency = 19,                      // Tier 4
}

function readOutputs(org: Organism): void {
  const brain = org.brain;
  const acts = brain.activations;
  const outStart = brain.inputNodeCount + brain.hiddenNodeCount;

  for (let i = 0; i < brain.outputNodeCount; i++) {
    const value = acts[outStart + i];
    switch (brain.outputMapping[i]) {
      case OutputType.Accelerate:     org.moveForce = value; break;
      case OutputType.Rotate:         org.turnTorque = value; break;
      case OutputType.Want2Eat:       org.wantToEat = value; break;
      case OutputType.Want2Attack:    org.wantToAttack = value; break;
      case OutputType.Want2Flee:      org.wantToFlee = value; break;
      case OutputType.Want2Grow:      org.wantToGrow = value; break;
      case OutputType.Digestion:      org.digestionLevel = value; break;
      case OutputType.Grab:           org.isGrabbing = value > 0.5; break;
      case OutputType.Want2Heal:      org.wantToHeal = value; break;
      case OutputType.Want2Reproduce: org.wantToReproduce = value; break;
      case OutputType.Herding:        org.herdingIntensity = value; break;
      case OutputType.Burrow:         org.burrowDesire = value; break;
      case OutputType.EmitPheromone1: org.pheromoneEmit[0] = value; break;
      case OutputType.EmitPheromone2: org.pheromoneEmit[1] = value; break;
      case OutputType.EmitPheromone3: org.pheromoneEmit[2] = value; break;
      case OutputType.EmitSound:      org.soundEmit = value; break;
      case OutputType.Want2Mate:      org.wantToMate = value; break;
      case OutputType.StoreFat:       org.fatDepositRate = value; break;
      case OutputType.SoundFrequency: org.soundEmitFrequency = value; break;
    }
  }
}
```

### 5.7 Performance Characteristics

| Metric | Value | Notes |
|--------|-------|-------|
| Typical nodes per brain | 15-25 | 11 inputs + 5 outputs + 0-9 hidden |
| Typical synapses per brain | 10-20 | 0.5 BP each, budget ~10-15 BP for brain |
| Forward pass per organism | ~0.5-1.0 us | Flat array iteration, no allocation |
| Total brain time per tick | ~0.5-0.9 ms | 900 organisms * ~0.7 us average |
| Memory per brain | ~500 B | Float64Array buffers, no object overhead |

The flat-array design means V8 can JIT-compile the forward pass into tight machine code with no GC pressure. `Float64Array` buffers are allocated once at organism creation and reused for the organism's entire lifetime.

---

## 6. WebSocket Server

### 6.1 uWebSockets.js Setup

The server uses [uWebSockets.js](https://github.com/uNetworking/uWebSockets.js) for WebSocket handling — a C++ backed library that outperforms `ws` by 10-100x and handles thousands of connections on a single thread. It runs on the same event loop as the simulation.

```typescript
// server/src/network/ws-server.ts

import uWS from 'uWebSockets.js';
import { verifyJWT } from './auth';
import { ClientSession, MessageType } from './protocol';

const MAX_CONNECTIONS = 35;  // 30 players + 5 reconnect overlap
const VIEWPORT_THROTTLE_MS = 250;  // Max 4 viewport updates/sec per client

interface ServerConfig {
  port: number;
  supabaseJwksUrl: string;
  certFile?: string;  // TLS handled by Caddy, but optional direct TLS
  keyFile?: string;
}

export function createWebSocketServer(
  config: ServerConfig,
  worldManager: WorldManager,
): uWS.TemplatedApp {
  const app = uWS.App();  // No TLS — Caddy terminates SSL upstream

  const sessions = new Map<uWS.WebSocket<ClientData>, ClientSession>();

  app.ws<ClientData>('/*', {
    // Per-socket options
    maxPayloadLength: 1024,       // Max incoming message size (designs sent via Supabase, not WS)
    idleTimeout: 120,             // Close after 2 min of no messages (client should PING every 30s)
    maxBackpressure: 64 * 1024,   // 64 KB send buffer before dropping slow client

    // Connection opened — no auth yet, client must send AUTH first
    open(ws) {
      if (sessions.size >= MAX_CONNECTIONS) {
        ws.close(1013, 'Server full');
        return;
      }
      const session: ClientSession = {
        ws,
        playerId: null,
        authenticated: false,
        currentWorldId: null,
        isAdmin: false,
        viewport: null,
        lastViewportUpdate: 0,
        previousEntityBytes: new Map(),
        assignedSpeciesId: null,
        connectedAt: Date.now(),
      };
      sessions.set(ws, session);
    },

    // Binary message received
    message(ws, message, isBinary) {
      if (!isBinary) { ws.close(1003, 'Text not supported'); return; }
      const session = sessions.get(ws);
      if (!session) return;

      const buf = Buffer.from(message);
      if (buf.length < 3) return;  // Minimum: 3-byte header

      const msgType: MessageType = buf[0];
      const payloadLen = buf.readUInt16LE(1);
      const payload = buf.subarray(3, 3 + payloadLen);

      handleMessage(session, msgType, payload, worldManager);
    },

    close(ws, code, message) {
      const session = sessions.get(ws);
      if (session) {
        onDisconnect(session, worldManager);
        sessions.delete(ws);
      }
    },
  });

  // Debug REST endpoints (admin-only, see debug.md §E)
  // DebugRouter registers /api/debug/* routes alongside AdminRouter
  // Handles entity inspection, manipulation commands, queries, test scenarios
  const debugRouter = new DebugRouter(app, debugCollector, worldManager);

  // Health check endpoint (multi-world format)
  app.get('/health', (res, req) => {
    res.writeHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(worldManager.getHealthStatus()));
  });

  app.listen(config.port, (listenSocket) => {
    if (listenSocket) {
      console.log(`WS server listening on port ${config.port}`);
    }
  });

  // Expose sessions for the broadcast system
  (app as any).__sessions = sessions;
  return app;
}
```

### 6.2 Per-Client Session State

Each connected client has a `ClientSession` that tracks authentication, viewport, and delta compression state:

```typescript
// server/src/network/protocol.ts

export interface ClientSession {
  ws: uWS.WebSocket<ClientData>;
  playerId: string | null;         // Supabase UUID, set after AUTH
  authenticated: boolean;
  currentWorldId: string | null;   // Which WorldRoom they're in (null = lobby)
  isAdmin: boolean;                // Cached from players.role on AUTH
  viewport: Viewport | null;       // { x, y, width, height } in world units
  lastViewportUpdate: number;      // Timestamp for throttling
  previousEntityBytes: Map<number, Uint8Array>;  // entityId -> last sent bytes (for delta)
  assignedSpeciesId: string | null;
  connectedAt: number;
}

export interface Viewport {
  x: number;       // Top-left x in world coords
  y: number;       // Top-left y in world coords
  width: number;   // Viewport width in world units
  height: number;  // Viewport height in world units
}

export interface ClientData {
  // Attached to uWS.WebSocket user data
  sessionId: string;
}
```

### 6.3 JWT Authentication

On first message, the client must send an AUTH frame containing a Supabase JWT. The server verifies it using Supabase's JWKS endpoint:

```typescript
// server/src/network/auth.ts

import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const client = jwksClient({
  jwksUri: `${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`,
  cache: true,
  cacheMaxAge: 600_000,  // 10 min cache
});

function getSigningKey(header: jwt.JwtHeader): Promise<string> {
  return new Promise((resolve, reject) => {
    client.getSigningKey(header.kid, (err, key) => {
      if (err) reject(err);
      else resolve(key!.getPublicKey());
    });
  });
}

export async function verifySupabaseJWT(token: string): Promise<{
  sub: string;        // Player UUID
  email: string;
  exp: number;
}> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      (header, callback) => {
        getSigningKey(header)
          .then(key => callback(null, key))
          .catch(err => callback(err));
      },
      {
        algorithms: ['RS256'],
        issuer: `${process.env.SUPABASE_URL}/auth/v1`,
        audience: 'authenticated',
      },
      (err, decoded) => {
        if (err) reject(err);
        else resolve(decoded as any);
      },
    );
  });
}
```

### 6.4 Message Handling

```typescript
// server/src/network/handler.ts

async function handleMessage(
  session: ClientSession,
  msgType: MessageType,
  payload: Buffer,
  worldManager: WorldManager,
): Promise<void> {
  // ── Phase 1: Must authenticate first ──
  if (!session.authenticated) {
    if (msgType !== MessageType.AUTH) {
      session.ws.close(4001, 'Auth required');
      return;
    }
    try {
      const token = payload.toString('utf8');
      const claims = await verifySupabaseJWT(token);
      session.playerId = claims.sub;
      session.authenticated = true;

      // Check player exists in Supabase and fetch role
      const { data: player } = await supabase
        .from('players')
        .select('id, role')
        .eq('id', claims.sub)
        .single();

      if (!player) {
        sendAuthFail(session.ws, AuthFailReason.INVALID_TOKEN);
        session.ws.close(4003, 'Player not found');
        return;
      }

      session.isAdmin = player.role === 'admin';

      // Send AUTH_OK (no world assigned yet — client reads current_world_id from profile and auto-joins if set)
      sendAuthOk(session.ws, 0, 0);

      // Send WORLD_LIST so client can display world picker
      sendWorldList(session.ws, worldManager.listRooms());
    } catch (err) {
      sendAuthFail(session.ws, AuthFailReason.INVALID_TOKEN);
      session.ws.close(4002, 'Invalid token');
    }
    return;
  }

  // ── Phase 2: Must join a world before game commands ──
  // JOIN_WORLD and LEAVE_WORLD are allowed without being in a world.
  // Single-world rule: if player has active species in old world,
  // client should have sent RETIRE_SPECIES before LEAVE_WORLD.

  switch (msgType) {
    case MessageType.JOIN_WORLD: {
      // Parse: [worldId:16B uuid][pwdLen:u8][pwd:utf8]
      const worldIdHex = payload.toString('hex', 0, 16);
      const worldId = formatUUID(worldIdHex);
      const pwdLen = payload[16] || 0;
      const password = pwdLen > 0 ? payload.toString('utf8', 17, 17 + pwdLen) : undefined;

      // Leave current world if in one
      if (session.currentWorldId) {
        const oldRoom = worldManager.getRoom(session.currentWorldId);
        if (oldRoom) oldRoom.removeClient(session);
        session.currentWorldId = null;
        session.viewport = null;
        session.previousEntityBytes.clear();
      }

      // Validate access (see architecture.md Section 7.6)
      // On successful password validation for 'password' worlds,
      // creates a world_access_grant so subsequent joins skip the password.
      const result = await validateJoinWorld(session, worldId, password, worldManager);
      if (result.error) {
        sendJoinFail(session.ws, result.reason);
        break;
      }

      // Join the room
      const room = worldManager.getRoom(worldId)!;
      room.addClient(session);
      session.currentWorldId = worldId;

      const internalId = room.world.getOrAssignPlayerId(session.playerId!);
      sendJoinOk(session.ws, worldId, room.clients.size, room.world.currentTick);

      // Send biome grid so client can render biome backgrounds (2501 bytes, once per join)
      sendBiomeMap(session.ws, room.world.biomeMap);
      break;
    }

    case MessageType.LEAVE_WORLD: {
      if (session.currentWorldId) {
        const room = worldManager.getRoom(session.currentWorldId);
        if (room) room.removeClient(session);
        session.currentWorldId = null;
        session.viewport = null;
        session.previousEntityBytes.clear();
        session.assignedSpeciesId = null;
      }
      // Client stays connected, can JOIN_WORLD again
      sendWorldList(session.ws, worldManager.listRooms());
      break;
    }

    // ── Phase 3+: Must be in a world for game commands ──

    case MessageType.VIEWPORT: {
      if (!session.currentWorldId) break;
      const room = worldManager.getRoom(session.currentWorldId);
      if (!room) break;

      const now = Date.now();
      if (now - session.lastViewportUpdate < VIEWPORT_THROTTLE_MS) return;
      session.lastViewportUpdate = now;

      const x = payload.readFloatLE(0);
      const y = payload.readFloatLE(4);
      const w = payload.readFloatLE(8);
      const h = payload.readFloatLE(12);

      const prevViewport = session.viewport;
      session.viewport = { x, y, width: w, height: h };

      // If viewport changed significantly, send FULL_STATE instead of delta
      if (!prevViewport || viewportChangedSignificantly(prevViewport, session.viewport)) {
        session.previousEntityBytes.clear();
        sendFullState(session, room.world);
      }
      break;
    }

    case MessageType.DEPLOY: {
      if (!session.currentWorldId) break;
      const room = worldManager.getRoom(session.currentWorldId);
      if (!room) break;

      const designId = payload.toString('hex', 0, 16);  // UUID as hex
      const uuid = formatUUID(designId);
      await handleDeploy(session, uuid, room.world);
      break;
    }

    case MessageType.RETIRE_SPECIES: {
      if (!session.currentWorldId) break;
      const room = worldManager.getRoom(session.currentWorldId);
      if (!room) break;

      if (session.assignedSpeciesId) {
        room.world.retireSpecies(session.assignedSpeciesId, session.playerId!);
        session.assignedSpeciesId = null;
      }
      break;
    }

    case MessageType.PING: {
      const room = session.currentWorldId
        ? worldManager.getRoom(session.currentWorldId)
        : null;
      sendPong(session.ws, room?.world.currentTick ?? 0);
      break;
    }

    // Debug messages (0xD0-0xD4) — admin-only, silently ignored for non-admins
    // See debug.md §D for full protocol specification
    case MessageType.DEBUG_SUBSCRIBE:
    case MessageType.DEBUG_UNSUBSCRIBE:
    case MessageType.DEBUG_INSPECT_ENTITY:
    case MessageType.DEBUG_TRACE_ENTITY:
    case MessageType.DEBUG_QUERY: {
      if (!session.isAdmin) break;  // Silently drop non-admin debug messages
      handleDebugMessage(session, messageType, payload, debugCollector, worldManager);
      break;
    }
  }
}
```

### 6.5 Binary Encoding: DELTA Messages

The most frequently sent message. Broadcast at 20 Hz (every 50 ms) to each connected client, decoupled from the simulation tick rate.

```
DELTA message layout:
┌──────────┬──────────────┬──────────────┬──────────────┬──────────────┬──────────────┬─────────────┐
│ header   │ tick         │ updateCount  │ enterCount   │ exitCount    │ entities...  │ exitIds...  │
│ 3 bytes  │ u32 (4B)     │ u16 (2B)     │ u16 (2B)     │ u16 (2B)     │ variable     │ variable    │
└──────────┴──────────────┴──────────────┴──────────────┴──────────────┴──────────────┴─────────────┘
```

- **Updated entities**: Entities that were in the previous frame AND changed. Packed as either 28-byte organisms or 12-byte pellets.
- **Entered entities**: Entities newly visible (entered viewport or just spawned). Same encoding.
- **Exited entity IDs**: u16 IDs of entities that left the viewport or died.

#### Organism Binary Encoding (28 bytes)

See `architecture.md` for the authoritative 28-byte organism entity format. Summary:

```
Offset  Size   Field            Encoding
──────  ────   ─────            ────────
0       2      entityId         u16
2       1      entityType       u8, 0x01 = organism
3       2      x                u16, fixed-point (pos / 500 * 65535)
5       2      y                u16, fixed-point
7       1      rotation         u8, (angle / 2π * 255)
8       1      size             u8, (sizeRatio / 3.0 * 255)
9       1      health           u8, (healthRatio * 255)
10      1      energy           u8, (energyRatio * 255)
11      1      state            u8, bitfield (eating, attacking, fleeing, burrowed, reproducing, dead, emitting_sound, camouflaged)
12      2      speciesId        u16
14      1      red              u8
15      1      green            u8
16      1      blue             u8
17      1      maturity         u8, (maturity * 255)
18      1      speed            u8, (currentSpeed / maxSpeed * 255)
19      1      mouthState       u8, (diet * 255)
20      1      traits           u8, bitfield (sex, echolocation_active, venomed, ai_species, fat_reserves, herd_bonus, sprouting, reserved)
21      1      fatFill          u8, (fatStored / maxFatCapacity * 255)
22      1      venomTimer       u8, (venomTimeRemaining / maxVenomDuration * 255)
23      1      matingCooldown   u8, (cooldownRemaining / maxCooldown * 255)
24      1      herdSize         u8, count of nearby allies (capped at 255)
25      1      eggProgress      u8, (eggStored * 255)
26      2      reserved         u16, 0x0000
                                Total: 28 bytes
```

#### Pellet Binary Encoding (12 bytes)

```
Offset  Size   Field            Encoding
──────  ────   ─────            ────────
0       2      entityId         u16
2       2      x                u16, fixed-point
4       2      y                u16, fixed-point
6       1      type             u8, 0x02 = plant, 0x03 = meat
7       1      energy           u8, (energy / maxPelletEnergy * 255)
8       1      red              u8
9       1      green            u8
10      1      blue             u8
11      1      decay            u8, meat freshness (255 = fresh, 0 = decayed)
                                Total: 12 bytes
```

### 6.6 Viewport Culling and Delta Compression

Each tick, the broadcast system determines what to send to each client:

```typescript
// server/src/network/broadcast.ts

const VIEWPORT_MARGIN = 5;  // Extra units beyond viewport to prefetch

export function broadcastTick(
  sessions: Map<uWS.WebSocket<ClientData>, ClientSession>,
  world: WorldState,
): void {
  for (const [ws, session] of sessions) {
    if (!session.authenticated || !session.viewport) continue;

    const vp = session.viewport;
    const margin = VIEWPORT_MARGIN;

    // Expand viewport by margin for smooth scrolling
    const queryRect = {
      x: vp.x - margin,
      y: vp.y - margin,
      width: vp.width + margin * 2,
      height: vp.height + margin * 2,
    };

    // Query spatial hash for entities in viewport (handles toroidal wrapping)
    const visibleIds = world.spatialHash.queryRect(queryRect);

    const updates: Uint8Array[] = [];
    const enters: Uint8Array[] = [];
    const exits: number[] = [];

    const currentVisible = new Set<number>();

    for (const entityId of visibleIds) {
      currentVisible.add(entityId);
      const packed = world.packEntity(entityId);  // Returns 28-byte (organism), 14-byte (egg), 12-byte (pellet/fungus), or 16-byte (spore) Uint8Array

      const prev = session.previousEntityBytes.get(entityId);
      if (!prev) {
        // New to viewport — enter
        enters.push(packed);
      } else if (!bytesEqual(prev, packed)) {
        // Changed since last send — update
        updates.push(packed);
      }
      // else: unchanged, skip (delta compression savings)

      session.previousEntityBytes.set(entityId, packed);
    }

    // Find entities that left the viewport
    for (const [prevId] of session.previousEntityBytes) {
      if (!currentVisible.has(prevId)) {
        exits.push(prevId);
        session.previousEntityBytes.delete(prevId);
      }
    }

    // Skip sending if nothing changed
    if (updates.length === 0 && enters.length === 0 && exits.length === 0) continue;

    // Build DELTA message (includes 8-byte environment header)
    const envHeader = packEnvironmentHeader(world);
    const msg = buildDeltaMessage(world.currentTick, envHeader, updates, enters, exits);
    ws.send(msg, true);  // true = binary
  }
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Pack the 8-byte environment header included in every FULL_STATE and DELTA message.
 * Gives the client season, day/night, and event state for rendering.
 */
function packEnvironmentHeader(world: WorldState): Uint8Array {
  const buf = new Uint8Array(8);
  const s = world.seasonState;
  const dn = getDayNightModifiers(s.dayPhase);
  buf[0] = s.season;                            // 0-3
  buf[1] = Math.round(s.progress * 255);        // season progress within current season
  buf[2] = Math.round(dn.ambientLight * 255);   // sinusoidal light: 0=midnight, 255=noon
  buf[3] = world.activeEvent?.type ?? 0;        // active world event (0=none)
  // bytes 4-7 reserved (future: weather, wind)
  return buf;
}

function buildDeltaMessage(
  tick: number,
  envHeader: Uint8Array,
  updates: Uint8Array[],
  enters: Uint8Array[],
  exits: number[],
): ArrayBuffer {
  // Calculate total size
  let entityBytesSize = 0;
  for (const u of updates) entityBytesSize += u.length;
  for (const e of enters) entityBytesSize += e.length;

  const totalSize = 3 + 4 + 8 + 2 + 2 + 2 + entityBytesSize + exits.length * 2;
  //                hdr  tick env  upd  ent  ext  entities         exitIds

  const buf = Buffer.alloc(totalSize);
  let offset = 0;

  // Header
  buf[offset++] = MessageType.DELTA;
  buf.writeUInt16LE(totalSize - 3, offset); offset += 2;

  // Tick
  buf.writeUInt32LE(tick, offset); offset += 4;

  // Environment header (8 bytes: season, progress, light, event, reserved)
  buf.set(envHeader, offset); offset += 8;

  // Counts
  buf.writeUInt16LE(updates.length, offset); offset += 2;
  buf.writeUInt16LE(enters.length, offset); offset += 2;
  buf.writeUInt16LE(exits.length, offset); offset += 2;

  // Updated entities
  for (const u of updates) {
    buf.set(u, offset); offset += u.length;
  }

  // Entered entities
  for (const e of enters) {
    buf.set(e, offset); offset += e.length;
  }

  // Exited entity IDs
  for (const id of exits) {
    buf.writeUInt16LE(id, offset); offset += 2;
  }

  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

/**
 * Send the biome grid to a client. Called once after JOIN_OK, and re-sent
 * when seasonal biome boundary shifts cause the grid to change.
 * Message type: BIOME_MAP (0x12)
 * Payload: [gridRes:u8][biomeGrid:gridRes² bytes, row-major, BiomeType enum values]
 * Total: ~2501 bytes.
 */
function sendBiomeMap(ws: uWS.WebSocket<ClientData>, biomeMap: BiomeMap): void {
  const gridRes = biomeMap.resolution;  // 50
  const buf = Buffer.alloc(3 + 1 + gridRes * gridRes);
  let offset = 0;
  buf[offset++] = MessageType.BIOME_MAP;
  buf.writeUInt16LE(1 + gridRes * gridRes, offset); offset += 2;
  buf[offset++] = gridRes;
  buf.set(biomeMap.grid, offset);  // Uint8Array of BiomeType values
  ws.send(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), true);
}
```

### 6.7 Bandwidth Analysis

| Scenario | Updates/broadcast | Enters | Exits | Bytes/broadcast | At 20 Hz |
|----------|-------------------|--------|-------|-----------------|----------|
| Stationary view | ~20 orgs + ~5 pellets | 0 | 0 | ~460 B | ~9.2 KB/s |
| Slow pan | ~25 orgs + ~10 pellets | ~5 | ~5 | ~640 B | ~12.8 KB/s |
| Fast pan | ~30 orgs + ~20 pellets | ~15 | ~15 | ~990 B | ~19.8 KB/s |
| Follow cam | ~15 orgs + ~10 pellets | ~3 | ~3 | ~450 B | ~9.0 KB/s |
| **Typical average** | | | | **~350 B** | **~7 KB/s** |

Broadcasts are at 20 Hz (from 40 TPS simulation, showing approximately every 2nd tick). Bandwidth estimates are unchanged from the previous 20 TPS design since clients still receive 20 updates/sec.

With delta compression, unchanged entities are skipped entirely. In a typical viewport, ~60% of organisms change position/angle each tick, and ~90% of pellets remain unchanged. This reduces actual bytes sent by 40-50% compared to naive full-state broadcasting.

**Total server bandwidth**: 30 clients × 7 KB/s = ~210 KB/s, well within VPS limits.

---

## 7. Supabase Integration

### 7.1 Server-Side Client

The simulation server uses a **service_role** Supabase client that bypasses Row-Level Security. This client is ONLY used server-side and the key is never exposed to clients.

```typescript
// server/src/db/supabase.ts

import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { persistSession: false },
    db: { schema: 'public' },
  },
);
```

### 7.2 Write Patterns

All writes from the server are fire-and-forget async operations that do NOT block the tick loop.

#### World Snapshots (every 5 minutes)

```typescript
// server/src/persistence/snapshot-writer.ts

const SNAPSHOT_INTERVAL_MS = 5 * 60 * 1000;  // 5 minutes

export interface WorldSnapshot {
  worldId: string;
  tick: number;
  timestamp: string;
  organisms: SerializedOrganism[];
  pellets: SerializedPellet[];
  eggs: SerializedEgg[];
  pheromoneGrid: number[][][];      // [channel][row][col]
  activeSpecies: SerializedSpecies[];
  mutationPools: Record<string, SerializedMutationPool>;
  seasonState: { season: number; progress: number; dayPhase: number };
  energyBudget: { total: number; inOrganisms: number; inPellets: number; inEggs: number };
  rng: { seed: number; state: number };  // For deterministic replay
}

let lastSnapshotTime = 0;

export async function maybeWriteSnapshot(world: WorldState): Promise<void> {
  const now = Date.now();
  if (now - lastSnapshotTime < SNAPSHOT_INTERVAL_MS) return;
  lastSnapshotTime = now;

  const snapshot = serializeWorld(world);

  try {
    await supabase
      .from('world_snapshots')
      .insert({
        world_id: world.worldId,
        tick: world.currentTick,
        snapshot,
      });
  } catch (err) {
    console.error('Snapshot write failed:', err);
    // Non-fatal — will retry next interval. World continues in memory.
  }
}
```

#### Leaderboard (every 60 seconds)

```typescript
// server/src/persistence/leaderboard-writer.ts

const LEADERBOARD_INTERVAL_MS = 60_000;

export async function updateLeaderboard(world: WorldState): Promise<void> {
  const entries = world.computeLeaderboard();

  // Upsert all active species scores
  const rows = entries.map(e => ({
    species_id: e.speciesId,
    player_id: e.playerId,
    species_name: e.speciesName,
    is_ai: e.isAI,
    dominance_score: e.dominanceScore,
    biomass_share: e.biomassShare,
    population_share: e.populationShare,
    territory_coverage: e.territoryCoverage,
    lineage_depth: e.lineageDepth,
    keystone_bonus: e.keystoneBonus,
  }));

  try {
    await supabase
      .from('leaderboard_scores')
      .upsert(rows, { onConflict: 'species_id' });
  } catch (err) {
    console.error('Leaderboard write failed:', err);
  }
}
```

#### Species Peak Stats & Lifetime Totals (every 60 seconds, alongside leaderboard)

```typescript
// server/src/persistence/species-stats-writer.ts

export async function updateSpeciesPeakStats(world: WorldState): Promise<void> {
  const entries = world.computeLeaderboard();

  for (const e of entries) {
    const species = world.getSpecies(e.speciesId);
    if (!species || species.isAI) continue;  // Only track human species

    // Update high-water marks (only if current > stored peak)
    await supabase.rpc('update_species_peaks', {
      p_species_id: e.speciesId,
      p_population: species.populationCount,
      p_dominance: e.dominanceScore,
      p_rank: e.rank,
      p_territory: e.territoryCoverage,
      p_biomass: e.biomassShare,
      p_lifetime_stats: species.getLifetimeStats(),
      // { totalBorn, totalDeaths, killsDealt, killsReceived,
      //   energyConsumed, mutationsApplied, wintersSurvived,
      //   biomesOccupied, deathBreakdown }
    });
  }
}

// Database function (Supabase RPC):
// update_species_peaks updates peak_population, peak_dominance, etc.
// using GREATEST(current, new) to ensure only high-water marks are stored.
// Also merges lifetime_stats JSONB (additive for counters).
```

#### Extinction Finalization

When a species goes extinct or is retired, the server finalizes its `active_species` row:

```typescript
// Called by SpeciesManager.handleExtinction() or retireSpecies()
export async function finalizeSpeciesRecord(
  speciesId: string,
  endReason: 'extinct' | 'retired',
  lifetimeStats: LifetimeStats,
): Promise<void> {
  await supabase
    .from('active_species')
    .update({
      retired_at: new Date().toISOString(),
      end_reason: endReason,
      lifetime_stats: lifetimeStats,
    })
    .eq('id', speciesId);

  // The client reads this row to generate the farewell card.
  // Peak stats are already up-to-date from periodic updates.
}
```

#### Event Log (batched every 15 seconds)

```typescript
// server/src/persistence/event-writer.ts

const EVENT_BATCH_INTERVAL_MS = 15_000;
const eventBuffer: EventLogEntry[] = [];

export function queueEvent(event: EventLogEntry): void {
  eventBuffer.push(event);
}

export async function flushEvents(): Promise<void> {
  if (eventBuffer.length === 0) return;
  const batch = eventBuffer.splice(0);  // Take all, clear buffer

  try {
    await supabase.from('event_log').insert(batch);
  } catch (err) {
    console.error('Event batch write failed:', err);
    // Re-queue failed events (drop if buffer exceeds 1000 to prevent memory leak)
    if (eventBuffer.length < 1000) {
      eventBuffer.unshift(...batch);
    }
  }
}
```

#### Daily Mutations (once per 24h cycle per species)

```typescript
// server/src/persistence/mutation-writer.ts

export async function generateDailyMutations(
  speciesId: string,
  playerId: string,
  mutationPool: MutationPool,
): Promise<void> {
  // Filter pool for successful mutations
  const successful = mutationPool.records.filter(
    r => r.offspringLifespan > mutationPool.medianLifespan || r.offspringReproduced,
  );

  if (successful.length < 3) {
    // Not enough data yet — skip this cycle
    return;
  }

  // Rank by fitness score
  const ranked = successful
    .map(r => ({
      ...r,
      fitnessScore:
        (r.offspringLifespan / mutationPool.medianLifespan) +
        (r.offspringReproduced ? 1.5 : 0) +
        (r.descendantCount * 0.2),
    }))
    .sort((a, b) => b.fitnessScore - a.fitnessScore);

  // Pick 3 diverse options:
  // a) Best body gene mutation
  // b) Best brain mutation
  // c) Most common successful mutation (convergent evolution signal)
  const bodyBest = ranked.find(r => r.category === 'body');
  const brainBest = ranked.find(r => r.category === 'brain');
  const convergent = findMostConvergent(successful);

  const options = [bodyBest, brainBest, convergent]
    .filter(Boolean)
    .slice(0, 3)
    .map(r => ({
      category: r!.category,
      geneId: r!.geneId,
      oldValue: r!.oldValue,
      newValue: r!.newValue,
      changePercent: ((r!.newValue - r!.oldValue) / Math.abs(r!.oldValue || 1)) * 100,
      fitnessScore: r!.fitnessScore,
      description: describeMutation(r!),
      frequency: countOccurrences(successful, r!.geneId, r!.newValue),
      sourceGeneration: r!.generation,
    }));

  // Pad to 3 if we don't have all categories
  while (options.length < 3) {
    const next = ranked.find(r => !options.some(o => o.geneId === r.geneId));
    if (!next) break;
    options.push({
      category: next.category,
      geneId: next.geneId,
      oldValue: next.oldValue,
      newValue: next.newValue,
      changePercent: ((next.newValue - next.oldValue) / Math.abs(next.oldValue || 1)) * 100,
      fitnessScore: next.fitnessScore,
      description: describeMutation(next),
      frequency: countOccurrences(successful, next.geneId, next.newValue),
      sourceGeneration: next.generation,
    });
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  await supabase.from('daily_mutations').insert({
    player_id: playerId,
    species_id: speciesId,
    options,
    status: 'pending',
    expires_at: expiresAt,
  });
}
```

#### Player Summaries (every hour per active player)

```typescript
// server/src/persistence/summary-writer.ts

export async function writePlayerSummary(
  playerId: string,
  world: WorldState,
  periodStart: Date,
): Promise<void> {
  const species = world.getActiveSpeciesByPlayer(playerId);
  if (!species) return;

  const summary = {
    hoursElapsed: (Date.now() - periodStart.getTime()) / 3_600_000,
    generationsElapsed: species.generationsThisPeriod,
    peakPopulation: species.peakPopulationThisPeriod,
    currentPopulation: species.currentPopulation,
    extinctionEvents: species.extinctionEventsThisPeriod,
    topMutations: species.topMutationsThisPeriod.slice(0, 5),
    dominanceChange: species.dominanceScore - species.dominanceAtPeriodStart,
    notableEvents: world.getRecentEventsForPlayer(playerId, 10),
    seasonTransitions: world.seasonTransitionsThisPeriod,
    totalEnergyHarvested: species.energyHarvestedThisPeriod,
    totalOffspringProduced: species.offspringThisPeriod,
  };

  await supabase.from('player_summaries').insert({
    player_id: playerId,
    summary,
    period_start: periodStart.toISOString(),
    period_end: new Date().toISOString(),
  });
}
```

### 7.3 Read Patterns

#### Species Design on DEPLOY

When a player sends a DEPLOY command via WebSocket, the server fetches the full design from Supabase:

```typescript
// server/src/network/deploy-handler.ts

async function handleDeploy(
  session: ClientSession,
  designId: string,
  world: WorldState,
): Promise<void> {
  // 1. Fetch design from Supabase
  const { data: design, error } = await supabase
    .from('species_designs')
    .select('*')
    .eq('id', designId)
    .eq('player_id', session.playerId)
    .eq('is_active', true)
    .single();

  if (error || !design) {
    sendDeployStatus(session.ws, 0, DeployStatus.DESIGN_NOT_FOUND);
    return;
  }

  // 2. Validate design server-side (authoritative)
  const validation = validateDesign(design);
  if (!validation.valid) {
    sendDeployStatus(session.ws, 0, DeployStatus.VALIDATION_FAILED);
    return;
  }

  // 3. Retire existing species if player already has one
  const existing = world.getActiveSpeciesByPlayer(session.playerId!);
  if (existing) {
    world.retireSpecies(existing.id, session.playerId!);
  }

  // 4. If at species cap, retire lowest AI species
  if (world.activeSpeciesCount >= 30) {
    const weakestAI = world.getWeakestAISpecies();
    if (weakestAI) {
      world.retireSpecies(weakestAI.id, null);
    } else {
      sendDeployStatus(session.ws, 0, DeployStatus.WORLD_FULL);
      return;
    }
  }

  // 5. Deploy into world
  const speciesId = world.deploySpecies(design, session.playerId!);
  session.assignedSpeciesId = speciesId;
  sendDeployStatus(session.ws, world.speciesIdToU16(speciesId), DeployStatus.SUCCESS);

  // 6. Record event
  queueEvent({
    event_type: 'species_deployed',
    event_scope: 'world',
    player_id: session.playerId,
    species_id: speciesId,
    payload: { speciesName: design.species_name },
    tick: world.currentTick,
  });

  // 7. Write active_species record
  await supabase.from('active_species').insert({
    id: speciesId,
    design_id: designId,
    player_id: session.playerId,
    is_ai: false,
    species_name: design.species_name,
    template_genes: { body: design.body, traits: design.traits, brain: design.brain },
  });
}
```

### 7.4 Snapshot Recovery

On server startup, if a snapshot exists, the world is restored from it rather than being created fresh:

```typescript
// server/src/persistence/snapshot-loader.ts

export async function loadLatestSnapshot(worldId: string): Promise<WorldSnapshot | null> {
  const { data, error } = await supabase
    .from('world_snapshots')
    .select('snapshot, tick, created_at')
    .eq('world_id', worldId)
    .order('tick', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    console.log('No snapshot found, starting fresh world');
    return null;
  }

  const age = Date.now() - new Date(data.created_at).getTime();
  console.log(`Restoring from snapshot at tick ${data.tick} (${Math.round(age / 60000)} min old)`);

  return data.snapshot as WorldSnapshot;
}
```

### 7.5 Error Handling and Retry

All Supabase writes use a simple retry wrapper for transient failures:

```typescript
// server/src/db/retry.ts

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export async function withRetry<T>(
  operation: () => Promise<T>,
  label: string,
): Promise<T | null> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await operation();
    } catch (err) {
      console.warn(`${label} attempt ${attempt}/${MAX_RETRIES} failed:`, err);
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS * attempt));
      }
    }
  }
  console.error(`${label} failed after ${MAX_RETRIES} attempts`);
  return null;
}
```

If Supabase is completely down, the simulation continues running in memory. Snapshots, events, and leaderboard updates queue in memory (bounded buffers) until connectivity returns. No data is lost from the simulation — only persistence is delayed. See [`architecture.md` Section 8](../architecture.md) for detailed failure mode analysis.

---

## 8. AI Ecosystem Manager

### 8.1 Overview

The AI ecosystem manager maintains a target of **~30 active species** in the world at all times. When human players have fewer than 30 species deployed, AI species fill the remaining slots.

> **Reference**: See [`core-gameplay-systems.md` Section 12](../core-gameplay-systems.md) for the full AI species library, competence caps, cycling schedule, and replacement rules.

```typescript
// server/src/ai/ecosystem-manager.ts

const TARGET_SPECIES_COUNT = 30;
const CHECK_INTERVAL_TICKS = SIM_TPS * 60 * 5;   // Every 5 minutes wall-clock
const AI_CYCLE_HOURS = 48;
const AI_REPLACE_DELAY_TICKS = SIM_TPS * 60 * 5;  // 5 min wall-clock after extinction

export class AIEcosystemManager {
  private aiSpeciesLibrary: AISpeciesDesign[];
  private deployedAI: Map<string, DeployedAISpecies>;  // speciesId -> info
  private lastCheckTick: number = 0;

  constructor() {
    this.aiSpeciesLibrary = loadAISpeciesLibrary();
    this.deployedAI = new Map();
  }

  /** Called every tick from the main simulation loop. */
  tick(world: WorldState, currentTick: number): void {
    if (currentTick - this.lastCheckTick < CHECK_INTERVAL_TICKS) return;
    this.lastCheckTick = currentTick;

    this.checkAndFillSlots(world, currentTick);
    this.cycleStaleSpecies(world, currentTick);
    this.handleExtinctions(world, currentTick);
  }

  /** Fill empty slots with AI species. */
  private checkAndFillSlots(world: WorldState, currentTick: number): void {
    const humanCount = world.getHumanSpeciesCount();
    const aiCount = this.deployedAI.size;
    const total = humanCount + aiCount;

    if (total >= TARGET_SPECIES_COUNT) return;

    const slotsToFill = TARGET_SPECIES_COUNT - total;
    const underrepresented = this.findUnderrepresentedNiches(world);

    for (let i = 0; i < slotsToFill; i++) {
      const niche = underrepresented[i % underrepresented.length];
      const design = this.pickDesignForNiche(niche);
      if (!design) continue;

      const speciesId = world.deploySpecies(design.toSpeciesDesign(), null);
      this.deployedAI.set(speciesId, {
        designId: design.id,
        deployedAt: currentTick,
        niche: design.category,
      });

      // Write to Supabase
      supabase.from('active_species').insert({
        id: speciesId,
        design_id: null,
        player_id: null,
        is_ai: true,
        species_name: design.speciesName,
        template_genes: design.genes,
      }).then(() => {});
    }
  }

  /** Every 48h, retire the worst-performing AI species and replace it. */
  private cycleStaleSpecies(world: WorldState, currentTick: number): void {
    const cycleThresholdTicks = AI_CYCLE_HOURS * 60 * 60 * 20;  // hours -> ticks

    let worstScore = Infinity;
    let worstId: string | null = null;

    for (const [speciesId, info] of this.deployedAI) {
      const age = currentTick - info.deployedAt;
      if (age < cycleThresholdTicks) continue;

      const score = world.getDominanceScore(speciesId);
      if (score < worstScore) {
        worstScore = score;
        worstId = speciesId;
      }
    }

    if (worstId) {
      world.retireSpecies(worstId, null);
      this.deployedAI.delete(worstId);
      // Slot will be filled on next checkAndFillSlots call
    }
  }

  /** Replace extinct AI species within 5 minutes. */
  private handleExtinctions(world: WorldState, currentTick: number): void {
    for (const [speciesId, info] of this.deployedAI) {
      const population = world.getSpeciesPopulation(speciesId);
      if (population === 0) {
        this.deployedAI.delete(speciesId);
        // Will be replaced on next checkAndFillSlots call
      }
    }
  }

  /** When a human deploys, make room by retiring weakest AI. */
  retireWeakestForHuman(world: WorldState): void {
    if (this.deployedAI.size === 0) return;

    let worstScore = Infinity;
    let worstId: string | null = null;

    for (const [speciesId] of this.deployedAI) {
      const score = world.getDominanceScore(speciesId);
      if (score < worstScore) {
        worstScore = score;
        worstId = speciesId;
      }
    }

    if (worstId) {
      // Accelerated retirement: 10x ageing
      world.applyAcceleratedAgeing(worstId, 10);
      this.deployedAI.delete(worstId);
    }
  }

  /** Analyze which ecological niches are under-represented. */
  private findUnderrepresentedNiches(world: WorldState): string[] {
    const nichePopulations: Record<string, number> = {
      'small_herbivore': 0, 'large_herbivore': 0,
      'ambush_predator': 0, 'chase_predator': 0,
      'omnivore': 0, 'scavenger': 0,
      'herd': 0, 'venomous': 0,
    };

    for (const species of world.getAllActiveSpecies()) {
      const niche = classifySpeciesNiche(species);
      nichePopulations[niche] = (nichePopulations[niche] || 0) + species.population;
    }

    // Sort by population ascending — least represented first
    return Object.entries(nichePopulations)
      .sort((a, b) => a[1] - b[1])
      .map(([niche]) => niche);
  }

  /** Pick an AI design for a given niche, avoiding recently used ones. */
  private pickDesignForNiche(niche: string): AISpeciesDesign | null {
    const candidates = this.aiSpeciesLibrary.filter(d =>
      d.category === niche &&
      !Array.from(this.deployedAI.values()).some(ai => ai.designId === d.id),
    );

    if (candidates.length === 0) {
      // Fallback: pick any unused design
      return this.aiSpeciesLibrary.find(d =>
        !Array.from(this.deployedAI.values()).some(ai => ai.designId === d.id),
      ) || null;
    }

    // Random selection from candidates
    return candidates[Math.floor(Math.random() * candidates.length)];
  }
}
```

### 8.2 AI Species Design Format

```typescript
// server/src/ai/species-library.ts

export interface AISpeciesDesign {
  id: string;
  speciesName: string;
  category: 'small_herbivore' | 'large_herbivore' | 'ambush_predator' |
            'chase_predator' | 'omnivore' | 'scavenger' | 'herd' | 'venomous';
  description: string;
  genes: {
    body: BodyGenes;     // ~75 effective BP (below player max of 100)
    traits: TraitConfig;
    brain: BrainConfig;  // 8-12 synapses max (below player potential)
  };
  founderCount: number;  // Typically 3-5
  spawnBiome: string;    // Preferred biome
  biomeBPCost: number;   // 0 for AI species (exempt from crowding cost)
}

/** Load curated AI species from JSON config file. */
export function loadAISpeciesLibrary(): AISpeciesDesign[] {
  // In production, loaded from server/data/ai-species.json
  // At least 15 designs across all 8 categories
  return require('../data/ai-species.json');
}
```

### 8.3 Competence Caps

AI species are intentionally weaker than well-designed player species:

| Constraint | AI Species | Human Species |
|-----------|------------|---------------|
| Effective BP | ~75 | Up to 100 |
| Brain synapses | 8-12 | Unlimited (within BP) |
| Hidden nodes | 2-4 | Unlimited (within BP) |
| Daily mutations | None (natural only) | Player-selected |
| Activation functions | Simple (sigmoid, tanh, relu) | All 12 available |

This ensures AI species create a functional ecosystem backdrop but don't crowd out player creativity. A moderately skilled player should outcompete AI species within a few generations.

---

## 9. World Lifecycle

### 9.1 World Initialization

When the server starts fresh (no snapshot to restore), a new world is created:

```typescript
// server/src/world/world-init.ts

const WORLD_WIDTH = 500;
const WORLD_HEIGHT = 500;
const INITIAL_PLANT_COUNT = 5500;
const TOTAL_ENERGY_BUDGET = 500_000;  // Total energy in the closed system

export function initializeWorld(): WorldState {
  const world = new WorldState(WORLD_WIDTH, WORLD_HEIGHT);

  // 1. Generate biome map
  world.biomeMap = generateBiomes(WORLD_WIDTH, WORLD_HEIGHT);

  // 2. Seed initial plant pellets
  seedPlants(world, INITIAL_PLANT_COUNT);

  // 3. Initialize pheromone grid (3 channels, 50x50 resolution)
  world.pheromoneGrid = new PheromoneGrid(3, 50, 50, WORLD_WIDTH, WORLD_HEIGHT);

  // 4. Initialize season state (wall-clock-based, TPS-independent)
  world.seasonState = {
    season: 0,       // 0=Spring, 1=Summer, 2=Autumn, 3=Winter
    progress: 0,     // [0, 1) within current season
    dayPhase: 0,     // [0, 1) within day/night cycle
    seasonCycleRealSeconds: 7 * 24 * 3600,   // 7 real-time days per season
    dayNightCycleRealSeconds: 6 * 3600,       // 6 real-time hours per day/night cycle
    lastWallTimeMs: Date.now(),               // wall-clock anchor for delta computation
  };

  // 5. Set energy budget
  world.energyBudget = {
    total: TOTAL_ENERGY_BUDGET,
    inPlants: 0,    // Will be computed after seeding
    inOrganisms: 0,
    inMeat: 0,
    inEggs: 0,
  };
  world.recomputeEnergyBudget();

  // 6. Deploy initial AI species
  // (Handled by AIEcosystemManager on first tick)

  return world;
}
```

### 9.2 Biome Generation

The 500x500 world has 5 biomes arranged to create diverse ecosystems:

```typescript
// server/src/world/biomes.ts

export const enum BiomeType {
  Grasslands  = 0,   // Default, moderate plant growth
  Wetlands    = 1,   // High plant density, slow movement
  Desert      = 2,   // Low plants, high visibility, speed bonus
  Forest      = 3,   // Dense plants, low visibility
  Rocky       = 4,   // Sparse, dark grey, high metabolism cost
}

export interface BiomeConfig {
  type: BiomeType;
  plantGrowthRate: number;    // Multiplier vs. base
  movementModifier: number;   // 1.0 = normal, 0.7 = slow, 1.2 = fast
  visibilityModifier: number; // Multiplier on viewRadius
  metabolismModifier: number; // Multiplier on metabolism cost
  color: { r: number; g: number; b: number };
}

export const BIOME_CONFIGS: Record<BiomeType, BiomeConfig> = {
  [BiomeType.Grasslands]: {
    type: BiomeType.Grasslands,
    plantGrowthRate: 1.0,
    movementModifier: 1.0,
    visibilityModifier: 1.0,
    metabolismModifier: 1.0,
    color: { r: 120, g: 180, b: 80 },
  },
  [BiomeType.Wetlands]: {
    type: BiomeType.Wetlands,
    plantGrowthRate: 1.5,
    movementModifier: 0.7,
    visibilityModifier: 0.8,
    metabolismModifier: 0.9,
    color: { r: 60, g: 140, b: 120 },
  },
  [BiomeType.Desert]: {
    type: BiomeType.Desert,
    plantGrowthRate: 0.4,
    movementModifier: 1.2,
    visibilityModifier: 1.3,
    metabolismModifier: 1.3,
    color: { r: 220, g: 190, b: 120 },
  },
  [BiomeType.Forest]: {
    type: BiomeType.Forest,
    plantGrowthRate: 1.3,
    movementModifier: 0.9,
    visibilityModifier: 0.6,
    metabolismModifier: 1.0,
    color: { r: 40, g: 100, b: 40 },
  },
  [BiomeType.Rocky]: {
    type: BiomeType.Rocky,
    plantGrowthRate: 0.3,
    movementModifier: 0.95,
    visibilityModifier: 1.2,
    metabolismModifier: 1.5,
    color: { r: 180, g: 200, b: 220 },
  },
};

/**
 * Generate biome map using Voronoi-like regions with noise.
 * Each biome is a contiguous region centered on a seed point.
 */
export function generateBiomes(width: number, height: number): BiomeMap {
  // 5 seed points, one per biome, spread across the map
  const seeds: Array<{ x: number; y: number; biome: BiomeType }> = [
    { x: 250, y: 250, biome: BiomeType.Grasslands },  // Center
    { x: 80,  y: 100, biome: BiomeType.Wetlands },     // NW
    { x: 420, y: 80,  biome: BiomeType.Desert },        // NE
    { x: 100, y: 400, biome: BiomeType.Forest },        // SW
    { x: 400, y: 420, biome: BiomeType.Rocky },         // SE
  ];

  // Create low-res grid (50x50) with biome assignments
  const gridRes = 50;
  const cellSize = width / gridRes;
  const grid = new Uint8Array(gridRes * gridRes);

  for (let gy = 0; gy < gridRes; gy++) {
    for (let gx = 0; gx < gridRes; gx++) {
      const wx = (gx + 0.5) * cellSize;
      const wy = (gy + 0.5) * cellSize;

      // Find nearest seed (toroidal distance)
      let minDist = Infinity;
      let nearest = BiomeType.Grasslands;
      for (const seed of seeds) {
        const dist = toroidalDist(wx, wy, seed.x, seed.y, width, height);
        if (dist < minDist) {
          minDist = dist;
          nearest = seed.biome;
        }
      }
      grid[gy * gridRes + gx] = nearest;
    }
  }

  return new BiomeMap(grid, gridRes, width, height);
}
```

### 9.3 Season Progression

Four seasons cycle over 28 real-time days (7 days per season). Each season modifies plant growth, metabolism, and organism behavior:

```typescript
// server/src/world/seasons.ts

export interface SeasonModifiers {
  plantGrowthMultiplier: number;
  metabolismMultiplier: number;
  reproductionMultiplier: number;
  description: string;
  // Visual modifiers (applied client-side to biome base colors for seasonal rendering)
  hueTint: number;          // Hue shift in degrees applied to biome base colors
  saturationScale: number;  // Multiplier on biome saturation (0.5-1.2)
  brightnessScale: number;  // Multiplier on biome brightness (0.7-1.1)
}

export const SEASON_MODIFIERS: SeasonModifiers[] = [
  { plantGrowthMultiplier: 1.2, metabolismMultiplier: 0.9,  reproductionMultiplier: 1.1, description: 'Spring - Abundance',  hueTint: +8,  saturationScale: 1.15, brightnessScale: 1.05 },
  { plantGrowthMultiplier: 1.0, metabolismMultiplier: 1.0,  reproductionMultiplier: 1.0, description: 'Summer - Balance',    hueTint: +5,  saturationScale: 1.0,  brightnessScale: 1.1  },
  { plantGrowthMultiplier: 0.7, metabolismMultiplier: 1.1,  reproductionMultiplier: 0.9, description: 'Autumn - Decline',    hueTint: -15, saturationScale: 0.85, brightnessScale: 0.95 },
  { plantGrowthMultiplier: 0.4, metabolismMultiplier: 1.3,  reproductionMultiplier: 0.7, description: 'Winter - Scarcity',   hueTint: +10, saturationScale: 0.6,  brightnessScale: 0.8  },
];

/**
 * Advance season state using wall-clock time.
 * Season and day/night timing are independent of SIM_TPS.
 * wallClockDeltaSec = real-time seconds since last tick (passed from game loop).
 */
export function advanceSeason(state: SeasonState, wallClockDeltaSec: number): void {
  state.progress += wallClockDeltaSec / state.seasonCycleRealSeconds;
  if (state.progress >= 1.0) {
    state.progress -= 1.0;
    state.season = (state.season + 1) % 4;
  }

  // Day/night cycle (wall-clock-based)
  state.dayPhase += wallClockDeltaSec / state.dayNightCycleRealSeconds;
  if (state.dayPhase >= 1.0) {
    state.dayPhase -= 1.0;
  }
}

/**
 * Get blended modifiers for current season position.
 * Uses cosine interpolation for smooth transitions.
 */
export function getSeasonModifiers(state: SeasonState): SeasonModifiers {
  const current = SEASON_MODIFIERS[state.season];
  const next = SEASON_MODIFIERS[(state.season + 1) % 4];

  // Cosine blend in the last 20% of each season
  const blendStart = 0.8;
  if (state.progress < blendStart) return current;

  const t = (state.progress - blendStart) / (1.0 - blendStart);
  const blend = (1 - Math.cos(t * Math.PI)) / 2;  // Smooth S-curve

  return {
    plantGrowthMultiplier: lerp(current.plantGrowthMultiplier, next.plantGrowthMultiplier, blend),
    metabolismMultiplier: lerp(current.metabolismMultiplier, next.metabolismMultiplier, blend),
    reproductionMultiplier: lerp(current.reproductionMultiplier, next.reproductionMultiplier, blend),
    description: blend > 0.5 ? next.description : current.description,
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
```

### 9.4 Day/Night Cycle

A full day/night cycle takes 6 real-time hours. Night reduces visibility and alters organism behavior:

```typescript
// server/src/world/daynight.ts

/**
 * Day/night affects:
 * - View radius: Reduced by 40% at night (midnight), full at noon
 * - Plant growth: 70% rate at night, 100% during day
 * - Organism colors: Dimmed at night (client-side rendering only)
 */
export function getDayNightModifiers(dayPhase: number): {
  viewRadiusMultiplier: number;
  plantGrowthMultiplier: number;
  ambientLight: number;  // 0.0 = darkest night, 1.0 = brightest day
} {
  // Sinusoidal light curve: 0.0 = midnight, 0.5 = noon
  const light = (Math.sin((dayPhase - 0.25) * 2 * Math.PI) + 1) / 2;

  return {
    viewRadiusMultiplier: 0.6 + 0.4 * light,      // [0.6, 1.0]
    plantGrowthMultiplier: 0.7 + 0.3 * light,      // [0.7, 1.0]
    ambientLight: light,
  };
}
```

### 9.5 Fungi System

Five types of fungi spawn based on ecosystem conditions and create localized environmental modifiers:

> **Reference**: See [`core-gameplay-systems.md` Section 6.4](../core-gameplay-systems.md) for detailed fungi types and spawn conditions.

```typescript
// server/src/world/fungi.ts

export const enum FungiType {
  DecomposerMold    = 0,  // Spawns near meat, accelerates decay + nutrient recycling
  ToxicSpores       = 1,  // Spawns in dense populations, DOT in area
  EnergizingMoss    = 2,  // Spawns in low-energy areas, small energy bonus
  SlowSludge        = 3,  // Spawns in wetlands, movement slow zone
  SporeBurst        = 4,  // Spawns after mass death, launches spore clouds
}

export interface FungiPatch {
  id: number;
  type: FungiType;
  x: number;
  y: number;
  radius: number;       // Effect radius in world units
  intensity: number;    // [0, 1] strength of effect
  lifetime: number;     // Ticks remaining
  maxLifetime: number;
}

export function tickFungi(
  patches: FungiPatch[],
  world: WorldState,
  dt: number,
): void {
  // Decay existing patches
  for (let i = patches.length - 1; i >= 0; i--) {
    patches[i].lifetime -= dt;
    if (patches[i].lifetime <= 0) {
      patches.splice(i, 1);
    }
  }

  // Check spawn conditions (every 100 ticks to save perf)
  if (world.currentTick % 100 !== 0) return;

  // Decomposer mold: near meat pellet clusters
  const meatClusters = world.spatialHash.findMeatClusters(3, 10);
  for (const cluster of meatClusters) {
    if (patches.some(p => p.type === FungiType.DecomposerMold &&
        distSq(p.x, p.y, cluster.x, cluster.y) < 100)) continue;

    patches.push({
      id: world.nextEntityId(),
      type: FungiType.DecomposerMold,
      x: cluster.x, y: cluster.y,
      radius: 8,
      intensity: Math.min(1, cluster.meatCount / 10),
      lifetime: SIM_TPS * 60 * 5,   // 5 minutes wall-clock
      maxLifetime: SIM_TPS * 60 * 5,
    });
  }

  // Toxic spores: in areas with >15 organisms within 20 units
  const denseCells = world.spatialHash.findDenseCells(15);
  for (const cell of denseCells) {
    if (patches.some(p => p.type === FungiType.ToxicSpores &&
        distSq(p.x, p.y, cell.centerX, cell.centerY) < 400)) continue;

    patches.push({
      id: world.nextEntityId(),
      type: FungiType.ToxicSpores,
      x: cell.centerX, y: cell.centerY,
      radius: 12,
      intensity: Math.min(1, cell.organismCount / 25),
      lifetime: SIM_TPS * 60 * 3,   // 3 minutes wall-clock
      maxLifetime: SIM_TPS * 60 * 3,
    });
  }
}
```

### 9.6 Pheromone Grid

A 3-channel grid (50x50 resolution over the 500x500 world) tracks pheromone concentrations. Each channel is independently emitted and sensed by organisms:

```typescript
// server/src/world/pheromone-grid.ts

export class PheromoneGrid {
  private channels: Float32Array[];  // 3 channels, each 50x50
  private gridRes: number;
  private cellSize: number;

  constructor(
    channelCount: number,
    gridRes: number,
    worldWidth: number,
    worldHeight: number,
  ) {
    this.gridRes = gridRes;
    this.cellSize = worldWidth / gridRes;
    this.channels = Array.from(
      { length: channelCount },
      () => new Float32Array(gridRes * gridRes),
    );
  }

  /** Emit pheromone at a world position. */
  emit(channel: number, worldX: number, worldY: number, intensity: number): void {
    const gx = Math.floor(worldX / this.cellSize) % this.gridRes;
    const gy = Math.floor(worldY / this.cellSize) % this.gridRes;
    this.channels[channel][gy * this.gridRes + gx] += intensity;
  }

  /** Read pheromone strength at a world position. */
  read(channel: number, worldX: number, worldY: number): number {
    const gx = Math.floor(worldX / this.cellSize) % this.gridRes;
    const gy = Math.floor(worldY / this.cellSize) % this.gridRes;
    return this.channels[channel][gy * this.gridRes + gx];
  }

  /** Find angle toward strongest pheromone source near a position. */
  gradient(channel: number, worldX: number, worldY: number): { angle: number; strength: number } {
    const gx = Math.floor(worldX / this.cellSize);
    const gy = Math.floor(worldY / this.cellSize);

    // Sample 8 neighbors (toroidal wrapping)
    let sumDx = 0, sumDy = 0, maxStrength = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = ((gx + dx) % this.gridRes + this.gridRes) % this.gridRes;
        const ny = ((gy + dy) % this.gridRes + this.gridRes) % this.gridRes;
        const val = this.channels[channel][ny * this.gridRes + nx];
        sumDx += dx * val;
        sumDy += dy * val;
        maxStrength = Math.max(maxStrength, val);
      }
    }

    return {
      angle: Math.atan2(sumDy, sumDx),
      strength: maxStrength,
    };
  }

  /** Diffuse and decay all channels. Called once per tick. */
  diffuseAndDecay(diffusionRate: number, decayRate: number): void {
    for (const channel of this.channels) {
      const temp = new Float32Array(channel.length);
      const res = this.gridRes;

      for (let y = 0; y < res; y++) {
        for (let x = 0; x < res; x++) {
          const idx = y * res + x;
          const current = channel[idx];

          // Average with 4 neighbors (toroidal)
          const up    = channel[((y - 1 + res) % res) * res + x];
          const down  = channel[((y + 1) % res) * res + x];
          const left  = channel[y * res + ((x - 1 + res) % res)];
          const right = channel[y * res + ((x + 1) % res)];

          const neighborAvg = (up + down + left + right) / 4;
          const diffused = current + diffusionRate * (neighborAvg - current);
          temp[idx] = diffused * decayRate;
        }
      }

      channel.set(temp);
    }
  }
}
```

---

## 10. API Endpoints

### 10.1 Health Check

Used by monitoring, Docker health checks, and Caddy load balancer. Returns per-world breakdown:

```
GET /health

Response 200:
{
  "status": "ok",
  "uptime": 86400,
  "worlds": {
    "a1b2c3d4-...": {
      "name": "Life World",
      "status": "running",
      "tick": 1284320,
      "organisms": 892,
      "pellets": 5431,
      "eggs": 67,
      "species": { "human": 12, "ai": 18 },
      "clients": 8,
      "performance": {
        "avgTickMs": 3.2,
        "maxTickMs": 8.1,
        "simTps": 40,
        "broadcastHz": 20
      },
      "lastSnapshot": {
        "tick": 1280000,
        "ageSeconds": 216
      }
    },
    "e5f6a7b8-...": {
      "name": "Test Arena",
      "status": "paused",
      "tick": 567,
      ...
    }
  },
  "aggregate": {
    "totalWorlds": 2,
    "runningWorlds": 1,
    "totalClients": 15,
    "totalOrganisms": 1400,
    "totalPellets": 10500
  }
}
```

### 10.2 Server-Exposed Endpoints Summary

Player-facing data flows go through **Supabase** (designs, auth, leaderboard, events, mutations, summaries) or **WebSocket** (real-time simulation). The VPS also exposes an admin REST API for world management:

| Endpoint | Method | Purpose | Consumer |
|----------|--------|---------|----------|
| `/health` | GET | Server status + per-world metrics | Docker, Caddy, monitoring |
| `/ws` | WebSocket | Simulation stream + world join/leave | Client SPA |
| `/api/admin/*` | REST | Admin world management, dev tools, player management | Admin panel in client SPA |

### 10.3 Admin REST API

All endpoints require `Authorization: Bearer <jwt>` header. Server verifies JWT and checks `role = 'admin'` from the `players` table. Returns 403 for non-admins.

**World CRUD**:

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/api/admin/worlds` | `{ name, accessType, password?, maxPlayers?, worldSize?, simTps?, description? }` | Create world |
| GET | `/api/admin/worlds` | — | List all worlds with stats |
| GET | `/api/admin/worlds/:id` | — | World details + connected players |
| PUT | `/api/admin/worlds/:id` | `{ name?, accessType?, password?, maxPlayers?, description? }` | Update config |
| DELETE | `/api/admin/worlds/:id` | — | Stop and delete world (requires `?confirm=true`) |

**World Lifecycle**:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/admin/worlds/:id/start` | Start a stopped world |
| POST | `/api/admin/worlds/:id/pause` | Pause simulation (keep connections) |
| POST | `/api/admin/worlds/:id/resume` | Resume paused simulation |
| POST | `/api/admin/worlds/:id/restart` | Stop + restore from latest snapshot |
| POST | `/api/admin/worlds/:id/reset` | Wipe + re-seed from scratch |

**Dev Tools**:

| Method | Path | Body | Description |
|--------|------|------|-------------|
| PUT | `/api/admin/worlds/:id/tps` | `{ tps: number }` | Change SIM_TPS live (10-200 range) |
| POST | `/api/admin/worlds/:id/snapshot` | — | Force immediate snapshot |
| GET | `/api/admin/worlds/:id/snapshots` | — | List available snapshots (last 3 per world) |
| POST | `/api/admin/worlds/:id/restore` | `{ snapshotId }` | Restore from specific snapshot |

**Player Management**:

| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/api/admin/worlds/:id/players` | — | List connected players |
| POST | `/api/admin/worlds/:id/kick/:playerId` | `{ reason? }` | Kick + 10x age species |
| POST | `/api/admin/worlds/:id/ban/:playerId` | `{ reason?, expiresAt? }` | Ban from world |
| DELETE | `/api/admin/worlds/:id/ban/:playerId` | — | Unban |
| GET | `/api/admin/worlds/:id/bans` | — | List bans |

**Admin Role Management**:

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/api/admin/players/:playerId/role` | `{ role: 'admin' \| 'player' }` | Promote or demote player |

Notes:
- Cannot demote yourself (prevents last-admin lockout).
- Updates `players.role` column.
- If target is connected via WebSocket, refreshes their `session.isAdmin` flag.

**Invite & Access Grant Management** (all world types):

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/api/admin/worlds/:id/invites` | `{ playerId }` | Invite player (invite-only: creates world_invite; password: creates world_access_grant; public: no-op notification) |
| DELETE | `/api/admin/worlds/:id/invites/:playerId` | — | Revoke invite (invite-only: revokes world_invite; also deletes world_access_grant if exists) |
| GET | `/api/admin/worlds/:id/invites` | — | List invites |
| POST | `/api/admin/worlds/:id/grants` | `{ playerId }` | Directly grant world access (creates world_access_grant, bypasses password for any world type) |
| DELETE | `/api/admin/worlds/:id/grants/:playerId` | — | Revoke access grant |
| GET | `/api/admin/worlds/:id/grants` | — | List access grants |

**Metrics**:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/metrics` | Aggregate metrics for all worlds |
| GET | `/api/admin/metrics/:worldId` | Per-world: TPS, tick time, entities, energy, species, memory |

**Debug Endpoints** (admin-only, see [`debug.md`](../debug.md) §E for full specification):

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/debug/worlds/:worldId/entities` | List entities (filterable by type, species, position, energy) |
| GET | `/api/debug/worlds/:worldId/entities/:entityId` | Full entity detail (FullEntityDetail) |
| GET | `/api/debug/worlds/:worldId/entities/:entityId/brain` | Brain config + activations + traces |
| GET | `/api/debug/worlds/:worldId/entities/:entityId/ledger` | Energy ledger (last N ticks) |
| GET | `/api/debug/worlds/:worldId/entities/:entityId/lineage` | Parent chain (up to 10 generations) |
| POST | `/api/debug/worlds/:worldId/spawn` | Spawn organism |
| POST | `/api/debug/worlds/:worldId/entities/:id/kill` | Kill entity (normal death path) |
| POST | `/api/debug/worlds/:worldId/entities/:id/teleport` | Teleport entity |
| POST | `/api/debug/worlds/:worldId/entities/:id/inject-energy` | Inject energy (bypasses conservation) |
| PUT | `/api/debug/worlds/:worldId/entities/:id/genes` | Edit genes |
| POST | `/api/debug/worlds/:worldId/entities/:id/force-mutation` | Force mutation |
| POST | `/api/debug/worlds/:worldId/entities/:id/pause` | Pause entity |
| POST | `/api/debug/worlds/:worldId/entities/:id/resume` | Resume entity |
| POST | `/api/debug/worlds/:worldId/entities/:id/force-reproduce` | Force reproduction |
| POST | `/api/debug/worlds/:worldId/trigger-event` | Trigger ecological event |
| POST | `/api/debug/worlds/:worldId/spawn-plants` | Spawn plants in area |
| POST | `/api/debug/worlds/:worldId/clear-area` | Clear entities in radius |
| PUT | `/api/debug/worlds/:worldId/season` | Set season immediately |
| POST | `/api/debug/worlds/:worldId/step` | Step N ticks (pause + advance) |
| GET | `/api/debug/worlds/:worldId/energy` | Energy audit result |
| GET | `/api/debug/worlds/:worldId/energy/history` | Energy snapshot history |
| GET | `/api/debug/worlds/:worldId/spatial` | Spatial hash stats |
| GET | `/api/debug/worlds/:worldId/tick-profile` | Tick timing breakdown |
| GET | `/api/debug/worlds/:worldId/events` | Recent lifecycle events |
| GET | `/api/debug/worlds/:worldId/species` | Species population stats |
| GET | `/api/debug/worlds/:worldId/logs` | Filtered server logs |
| GET | `/api/debug/config` | Current debug configuration |
| PUT | `/api/debug/config` | Update debug configuration at runtime |
| POST | `/api/debug/test/run` | Run test scenario |
| GET | `/api/debug/test/scenarios` | List available test scenarios |
| GET | `/api/debug/test/brain-regression` | Run brain regression tests |
| POST | `/api/debug/worlds/:worldId/replay` | Start deterministic replay |

**Kick/Ban Implementation**:

- **Kick**: Server finds ClientSession for that player in the WorldRoom, sends KICKED message with reason, applies 10x accelerated aging to player's species (existing retirement mechanism), removes client from WorldRoom (they stay WebSocket-connected but world-less).
- **Ban**: Insert record into `world_bans`, DELETE matching `world_access_grants` entry (revoke access on ban), then kick if currently connected. Future JOIN_WORLD attempts check ban table and reject with JOIN_FAIL(BANNED).
- **Unban**: DELETE from `world_bans`. Player must re-enter password or receive new invite to regain access (grant was revoked on ban).

### 10.4 Supabase-Side Functions (RPC)

While most operations use standard Supabase REST (insert/select/update), a few operations benefit from server-side Postgres functions:

```sql
-- Expire stale pending mutations
CREATE OR REPLACE FUNCTION expire_stale_mutations()
RETURNS INTEGER AS $$
DECLARE
  affected INTEGER;
BEGIN
  UPDATE daily_mutations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < now();
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$ LANGUAGE plpgsql;

-- Get player's complete status for return-after-absence flow
CREATE OR REPLACE FUNCTION get_player_status(p_player_id UUID)
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'has_active_species', EXISTS(
      SELECT 1 FROM active_species
      WHERE player_id = p_player_id AND retired_at IS NULL
    ),
    'pending_mutations', (
      SELECT count(*) FROM daily_mutations
      WHERE player_id = p_player_id AND status = 'pending'
    ),
    'latest_summary', (
      SELECT summary FROM player_summaries
      WHERE player_id = p_player_id
      ORDER BY period_end DESC
      LIMIT 1
    ),
    'leaderboard_rank', (
      SELECT rank FROM (
        SELECT player_id, RANK() OVER (ORDER BY dominance_score DESC) as rank
        FROM leaderboard_scores
        WHERE player_id IS NOT NULL
      ) ranked
      WHERE player_id = p_player_id
    )
  );
END;
$$ LANGUAGE plpgsql STABLE;
```

These are called from the client via `supabase.rpc('get_player_status', { p_player_id: userId })`.

### 10.4.1 Edge Function: delete-own-account

Supabase Edge Function (Deno runtime), NOT a Postgres function. Required because deleting an auth user needs the `service_role` key which cannot be exposed to clients.

```
POST /functions/v1/delete-own-account
Authorization: Bearer <user_jwt>
Body: { "confirm": "DELETE" }

1. Verify JWT from Authorization header
2. Check body.confirm === "DELETE"
3. Call supabaseAdmin.auth.admin.deleteUser(jwt.sub)
4. CASCADE deletes: players → species_designs, active_species, world_access_grants, world_invites
5. Return 200 OK
```

### 10.5 Scheduled Jobs (pg_cron)

Supabase supports `pg_cron` for periodic maintenance:

```sql
-- Every hour: expire stale mutations
SELECT cron.schedule('expire-mutations', '0 * * * *', $$
  SELECT expire_stale_mutations();
$$);

-- Every 6 hours: prune old snapshots (keep last 3 per world)
SELECT cron.schedule('prune-snapshots', '0 */6 * * *', $$
  DELETE FROM world_snapshots
  WHERE id NOT IN (
    SELECT id FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY world_id ORDER BY created_at DESC) rn
      FROM world_snapshots
    ) t WHERE rn <= 3
  );
$$);

-- Daily: prune old events (>30 days for player/species scope, >90 for world)
SELECT cron.schedule('prune-events', '0 3 * * *', $$
  DELETE FROM event_log WHERE created_at < now() - interval '30 days' AND event_scope != 'world';
  DELETE FROM event_log WHERE created_at < now() - interval '90 days';
$$);

-- Daily: prune old summaries (keep 7 per player)
SELECT cron.schedule('prune-summaries', '0 4 * * *', $$
  DELETE FROM player_summaries
  WHERE id NOT IN (
    SELECT id FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY player_id ORDER BY period_end DESC) rn
      FROM player_summaries
    ) t WHERE rn <= 7
  );
$$);
```

---

## 11. Additional System Implementations

### 11.1 Combat System — Additional Mechanics

#### Armor Directional Blocking
```typescript
// In attack resolution:
if (target.armorTier > 0 && target.armorDirection) {
  const attackAngle = Math.atan2(attacker.y - target.y, attacker.x - target.x);
  const relativeAngle = normalizeAngle(attackAngle - target.heading);
  const isFrontal = Math.abs(relativeAngle) < Math.PI / 2; // Within ±90° of heading
  const armorApplies = (target.armorDirection === 'front' && isFrontal)
                    || (target.armorDirection === 'back' && !isFrontal);
  if (armorApplies) {
    const armorBonus = [0, 3, 6, 10][target.armorTier]; // Light/Medium/Heavy
    effectiveDefense += armorBonus;
  }
}
```

#### Venom Immunity (Universal DoT Resistance)
```typescript
// When applying venom:
const immuneStrength = target.immuneStrength; // From BaseImmuneActivation gene
const venomDuration = BASE_VENOM_DURATION * (1 - immuneStrength * 0.5);
target.venomTimeRemaining = venomDuration;
target.venomDPS = baseVenomDamage * (attacker.size / target.size);

// When applying toxic fungi damage:
const fungiDamage = baseFungiDamage * (1 - immuneStrength * 0.3);

// When checking plague infection:
const infectionChance = basePlagueChance * (1 - immuneStrength * 0.4);
```

#### Camouflage Attack Break
```typescript
// After successful attack by camouflaged organism:
if (attacker.hasCamouflage && attacker.camoBreakTimer <= 0) {
  attacker.camoBreakTimer = 5.0; // 5 seconds of broken camo
}
// In detection reduction calculation:
if (org.camoBreakTimer > 0) {
  detectionReduction = 0; // No camo while broken
  org.camoBreakTimer -= dt;
}
```

### 11.2 Energy System — Additional Mechanics

#### Fat Reserves (Brain-Controlled)
```typescript
// In EnergySystem per-tick:
if (org.fatReservesTier > 0) {
  const maxFat = org.fatReservesTier * 50;

  // Deposit: when StoreFat output > 0.5 AND energy > 50%
  if (org.outputs[StoreFat] > 0.5 && org.energy > org.maxEnergy * 0.5) {
    const depositAmount = org.lastDigestionOutput * 0.20; // 20% of digestion
    const afterTax = depositAmount * 0.85; // 15% storage tax
    org.fatStored = Math.min(org.fatStored + afterTax, maxFat);
  }

  // Withdrawal: auto when energy hits 0
  if (org.energy <= 0 && org.fatStored > 0) {
    const withdrawAmount = Math.min(org.fatStored, org.maxEnergy * 0.25);
    const afterTax = withdrawAmount * 0.90; // 10% withdrawal tax
    org.energy += afterTax;
    org.fatStored -= withdrawAmount;
  }

  // Speed penalty: -1% per BP invested × fill ratio
  const fatBP = [0, 5, 10, 15, 20][org.fatReservesTier];
  const fillRatio = org.fatStored / maxFat;
  org.effectiveMaxSpeed *= (1 - 0.01 * fatBP * fillRatio);
}
```

#### Species Entropy (Admin-Configurable Half-Life)
```typescript
const hoursAlive = (world.tick - species.deployTick) / (40 * 3600);
const halfLife = world.config.entropyHalfLife; // From worlds table, default 72
const entropyMultiplier = 1.0 + Math.pow(hoursAlive / halfLife, 2);
const effectiveMetabCost = baseMetabCost * org.metabolism * org.size2D * entropyMultiplier;
```

#### Plant Density-Dependent Regrowth
```typescript
for (const cell of spatialHash.cells) {
  const herbivoreCount = cell.organisms.filter(o => o.diet < 0.5).length;
  const effectiveRate = cell.biome.spawnRate / (1 + herbivoreCount / 50);
  // Spawn plants at effectiveRate
  // If cell plantDensity < threshold: mark cell as barren (brown tint in env data)
}
```

#### Diet Efficiency Curves
```typescript
// Applied during digestion:
const plantEfficiency = 0.55 * Math.pow(1 - org.diet, 0.7);
const meatEfficiency = 0.80 * Math.pow(org.diet, 0.7);
// Omnivore (diet=0.5): plant=0.34, meat=0.49 — both suboptimal
// Herbivore (diet=0.0): plant=0.55, meat=0.00
// Carnivore (diet=1.0): plant=0.00, meat=0.80
// Exponent 0.7 is a hardcoded constant
// Fungi efficiency: plantEfficiency × 0.6 (60% of plant pathway)
```

### 11.3 Reproduction System — Spore Dispersal

```typescript
// When organism wants to reproduce via spores:
if (org.hasSporeDispersal && org.outputs[SporeDispersal] > 0.5) {
  const maxRange = org.sporeRange; // From design slider (3-30)
  const actualRange = randomInRange(maxRange * 0.25, maxRange);
  const direction = Math.random() * 2 * Math.PI;
  const destX = wrapToroid(org.x + Math.cos(direction) * actualRange, 500);
  const destY = wrapToroid(org.y + Math.sin(direction) * actualRange, 500);
  const sporeCost = org.eggCost * 1.3;

  if (org.energy >= sporeCost) {
    org.energy -= sporeCost;
    world.spores.push({
      id: nextEntityId(),
      originX: org.x, originY: org.y,
      destX, destY,
      speciesId: org.speciesId,
      color: org.color,
      flightProgress: 0,
      genes: mutateGenes(org.genes, 2.0),
      brain: mutateBrain(org.brain, 2.0),
      generation: org.generation + 1,
      willGerminate: Math.random() < 0.30,
      birthSize: 0.6,
    });
  }
}
```

### 11.4 Reproduction System — Nest Bonus

```typescript
// When egg is laid, check for nest affinity:
if (org.nestAffinity > 0) {
  const nearbyEmitters = spatialHash.queryRadius(egg.x, egg.y, egg.radius * 2)
    .filter(e => e.speciesId === org.speciesId && e.outputs?.[EmitPheromone] > 0.3)
    .length;
  const hatchBonus = Math.min(org.nestAffinity * 0.5, nearbyEmitters * 0.1);
  const energyBonus = Math.min(org.nestAffinity * 0.15, nearbyEmitters * 0.03);
  egg.hatchTimeRemaining *= (1 - hatchBonus);
  egg.startingEnergy *= (1 + energyBonus);
  egg.nestBonus = hatchBonus;
}
```

### 11.5 Burrowing System — State Machine

```typescript
if (org.hasBurrowing) {
  const burrowDesire = org.outputs[Burrow];

  if (!org.isBurrowed && burrowDesire > 0.5 && org.burrowCooldown <= 0) {
    org.isBurrowed = true;
    org.burrowSurfaceTimer = 0;
  }

  if (org.isBurrowed && burrowDesire < 0.3) {
    org.burrowSurfaceTimer = org.burrowSpeed; // Gene: 1.0-2.5s
  }

  if (org.burrowSurfaceTimer > 0) {
    org.burrowSurfaceTimer -= dt;
    if (org.burrowSurfaceTimer <= 0) {
      org.isBurrowed = false;
      org.burrowCooldown = 3.0;
    }
  }

  if (org.isBurrowed) {
    org.effectiveMaxSpeed *= 0.25;
    org.metabolismMultiplier *= org.burrowEfficiency; // Gene: 1.5-2.5×
    for (const input of allInputNodes) inputs[input] = 0;
    org.canEat = false;
    org.canReproduce = false;
  }

  org.burrowCooldown = Math.max(0, org.burrowCooldown - dt);
}
```

### 11.6 Herd System — Flocking + Passive Defense

```typescript
if (org.hasHerdCoordination) {
  const allies = spatialHash.queryRadius(org.x, org.y, org.viewRadius)
    .filter(e => e.speciesId === org.speciesId && e.id !== org.id);
  const herdSize = allies.length;

  // Passive defense bonus: +5% per ally, cap at 20% (4 allies)
  org.herdDefenseBonus = Math.min(0.20, herdSize * 0.05);

  // Boids flocking (when Herding output > 0):
  const herdingIntensity = org.outputs[Herding];
  if (herdingIntensity > 0 && herdSize > 0) {
    const separation = computeSeparation(org, allies, org.genes.herdSeparationDist);
    const alignment = computeAlignment(org, allies);
    const cohesion = computeCohesion(org, allies);

    org.forceX += herdingIntensity * (
      separation.x * org.genes.herdSeparationWeight +
      alignment.x * org.genes.herdAlignmentWeight +
      cohesion.x * org.genes.herdCohesionWeight
    );
    org.forceY += herdingIntensity * (
      separation.y * org.genes.herdSeparationWeight +
      alignment.y * org.genes.herdAlignmentWeight +
      cohesion.y * org.genes.herdCohesionWeight
    );
  }
}
```

### 11.7 Sensor Implementations — Detailed Queries

#### Mate Detection (Filtered Spatial Query)
```typescript
if (org.hasSexualReproduction) {
  const mate = spatialHash.findNearest(org.x, org.y, org.viewRadius, (target) =>
    target.speciesId === org.speciesId &&
    target.sex !== org.sex &&
    target.maturity >= 1.0
  );
  inputs[NearestMateAngle] = mate ? normalizeAngle(angleTo(org, mate)) : 0;
  inputs[NearestMateDist] = mate ? dist(org, mate) / org.viewRadius : 1.0;
  inputs[Sex] = org.sex;
  inputs[MatingCooldown] = org.matingCooldown / MAX_MATING_COOLDOWN;
}
```

#### Encounter Info Sharing (Ally State Read)
```typescript
if (org.hasEncounterInfoSharing) {
  const encounterRange = 1.5 * (org.radius + allyRadius);
  const ally = spatialHash.findNearest(org.x, org.y, encounterRange, (target) =>
    target.speciesId === org.speciesId && target.id !== org.id
  );
  if (ally) {
    inputs[AllyEnergyRatio] = ally.energy;
    inputs[AllyHealthRatio] = ally.health;
    inputs[AllyHeading] = ally.heading / (2 * Math.PI);
    inputs[AllyLastFoodAngle] = (ally.encounterFoodMemory > 0) ? ally.lastFoodAngle : 0;
    inputs[AllyLastThreatAngle] = (ally.encounterThreatMemory > 0) ? ally.lastThreatAngle : 0;
    inputs[AllyWant2Mate] = ally.outputs?.[Want2Mate] ?? 0;
    inputs[AllyReproductiveState] = (ally.sex === 0)
      ? ally.eggProgress
      : -(ally.energy);
    org.energy -= 0.05 * org.metabolism * dt;
  }
}
```

#### Echolocation (360° Detection with Slider-Based Parameters)
```typescript
if (org.hasEcholocation && (tick % Math.round(1 / org.echoFrequency) === 0)) {
  const echoRadius = org.viewRadius * org.echoRange;
  const echoTargets = spatialHash.queryRadius(org.x, org.y, echoRadius);
  const nearest = echoTargets[0];
  if (nearest) {
    inputs[EchoAngle] = normalizeAngle(angleTo(org, nearest));
    inputs[EchoDist] = dist(org, nearest) / echoRadius;
    inputs[EchoSize] = org.echoPrecision ? (nearest.size / org.size) : 0;
  }
  org.echoSignature = echoRadius * 2;
  org.energy -= 0.3 * org.echoRange * org.echoFrequency * org.baseMetabCost * dt;
}
```

#### Sound (Point-Source Spatial Query with Frequency)
```typescript
const soundRange = org.viewRadius * 3;
const soundSources = spatialHash.queryRadius(org.x, org.y, soundRange)
  .filter(e => e.soundEmitIntensity > 0);
if (soundSources.length > 0) {
  const loudest = soundSources.reduce((a, b) => {
    const aLoudness = a.soundEmitIntensity / (dist(org, a) + 1);
    const bLoudness = b.soundEmitIntensity / (dist(org, b) + 1);
    return aLoudness > bLoudness ? a : b;
  });
  inputs[SoundDirection] = normalizeAngle(angleTo(org, loudest));
  inputs[SoundIntensity] = loudest.soundEmitIntensity / (dist(org, loudest) / soundRange);
  inputs[SoundFrequency] = loudest.soundEmitFrequency;
}
if (org.soundEmitIntensity > 0) {
  org.energy -= 0.2 * org.soundEmitIntensity * org.soundEmitIntensity * org.metabolism * dt;
}
```

#### Day/Night View Radius Modifier
```typescript
const ambientLight = world.seasonState.ambientLight; // 0-1 sinusoidal
const effectiveViewRadius = org.viewRadius * (0.6 + 0.4 * ambientLight);
// Echolocation is NOT affected by light (echoRange stays constant)
```

### 11.8 Fungi System — Interaction and Nutrition

Organisms can eat fungi patches (treat as pellet with 60% plant energy value). Eating fungi increments the player's `fungi_consumed` counter toward the Spore Dispersal unlock (500 patches required).

Fungi types and per-tick effects on organisms within patch radius:
- **Decomposer**: Accelerates meat decay (3× decay rate in patch). Duration: 48h
- **Toxic Mold**: DoT damage to organisms in patch (reduced by immuneStrength). Duration: 24h
- **Nutrient Network**: Redistributes energy between organisms in patch. Duration: persistent until eaten
- **Parasitic Bloom**: Drains 5% energy/sec from organisms in patch. Duration: 72h
- **Bioluminescent**: Acts as false food signal (NearestPlantAngle points to it). Duration: 96h. Also provides light at night (negates day/night view reduction in patch)

Spawn rules:
1. Death-triggered: when 5+ deaths in a spatial hash cell within 1 hour → spawn Decomposer
2. Seasonal: Spring/Autumn → 2× base spawn rate for all types
3. Biome-dependent: Wetland 3× fungi, Forest 2×, others 1×

### 11.9 Ecological Event System

```typescript
// Event checking (once per in-game season, ~every 15 min real-time):
function checkForEvents(world: World) {
  const season = world.seasonState.season;
  const biomass = world.energyBudget.inPellets / world.energyBudget.total;
  const density = world.organisms.length / (500 * 500);

  if (season === 0 && Math.random() < 0.80 + (biomass < 0.30 ? 0.20 : 0)) triggerEvent('bloom');
  if (season === 1 && Math.random() < 0.60 + (biomass > 0.70 ? 0.20 : 0)) triggerEvent('drought');
  if (season === 3 && Math.random() < 0.30 + (density > DENSITY_THRESHOLD ? 0.30 : 0)) triggerEvent('plague');
  if (Math.random() < 0.50) triggerEvent('migration');
  if ((season === 0 || season === 2) && Math.random() < 0.70) triggerEvent('fungi_outbreak');
  if (Math.random() < 0.10) triggerEvent('meteor');

  if (pendingEvent) {
    broadcast(EVENT_WARNING, { type: pendingEvent.type, area: pendingEvent.area });
    setTimeout(() => activateEvent(pendingEvent), 30000 / TPS);
  }
}
```

### 11.10 Growth System — Growth Speed Application

```typescript
const growthRate = org.genes.growthScale / (1 + org.genes.growthMaturityFactor * Math.pow(org.maturity, org.genes.growthMaturityExponent));
const effectiveGrowth = growthRate * org.growthSpeed * org.outputs[Want2Grow] * dt;
const growthEnergyCost = BASE_GROWTH_COST * org.growthSpeed * effectiveGrowth;
org.energy -= growthEnergyCost;
org.maturity = Math.min(1.0, org.maturity + effectiveGrowth);
```

### 11.11 Dominance Scoring — Full Formula

```typescript
// In leaderboard computation (every 60s):
for (const species of activeSpecies) {
  const biomassShare = species.totalBiomass / world.energyBudget.total;
  const popShare = species.population / world.organisms.length;
  const territoryShare = species.occupiedCells.size / spatialHash.totalCells;
  const lineageDepth = species.maxGeneration / MAX_EXPECTED_GENERATION;
  const keystoneBonus = computeKeystoneBonus(species, world);

  species.dominanceScore =
    0.35 * biomassShare +
    0.20 * popShare +
    0.20 * territoryShare +
    0.15 * lineageDepth +
    0.10 * keystoneBonus;
}
```

### 11.12 AI Species Management

```typescript
// On world tick (every 5 minutes check):
const humanSpeciesCount = activeSpecies.filter(s => !s.isAI).length;
const targetAI = Math.max(0, 30 - humanSpeciesCount);
const currentAI = activeSpecies.filter(s => s.isAI).length;

if (currentAI < targetAI) {
  const niche = findUnderRepresentedNiche(world);
  const design = AI_LIBRARY.find(d => d.niche === niche && !d.isActive);
  deployAISpecies(world, design);
}

// 48h cycling: retire lowest-performing AI
if (lowestAI.ageHours > 48) {
  retireAISpecies(lowestAI); // 10× ageing acceleration
  deployAISpecies(world, nextFromLibrary());
}

// When human deploys: retire weakest AI to make room
// When human goes extinct: fill slot with AI within 5 minutes
```

### 11.13 Mutation Pool — Rolling Window + Convergence

```typescript
// Median lifespan: rolling window of last 200 deaths
const recentDeaths = species.deathLog.slice(-200);
const medianLifespan = median(recentDeaths.map(d => d.lifespan));

// Successful mutation filter:
const successful = mutationRecords.filter(m =>
  m.offspringLifespan > medianLifespan * 0.8 || m.offspringReproduced
);

// Convergent evolution detection (per-gene):
for (const gene of geneList) {
  const geneMutations = successful.filter(m => m.geneId === gene);
  const increases = geneMutations.filter(m => m.newValue > m.oldValue).length;
  const total = geneMutations.length;
  if (total >= 5 && increases / total > 0.6) {
    convergentMutations.push({ gene, direction: 'increase', ratio: increases / total });
  }
}
```

### 11.14 DELTA/FULL_STATE Encoding Updates

Organism binary entries are now **28 bytes** (was 20). Entity type at offset 2 determines packet length:
- `0x01` (Organism) → 28 bytes
- `0x02` / `0x03` (Plant/Meat Pellet) → 12 bytes
- `0x04` (Egg) → 14 bytes
- `0x05` (Fungus) → 12 bytes
- `0x06` (Spore) → 16 bytes

New entity types (eggs, fungi, spores) are included in the entity stream alongside organisms and pellets. Updated bandwidth estimate: ~10 KB/s per client (was ~7 KB/s).
