# Life Game - System Architecture Overview

**Version**: 1.0
**Tech Stack**: JS/TS/React frontend (GitHub Pages), Supabase (Postgres + Auth), Node.js simulation server on VPS
**Scale**: 1 server, N worlds (default 1), 30 players per world, ~900 organisms + ~5,500 pellets (~6,400 entities) per world (500x500 units)
**Cost Target**: ~$7/month total

---

## Table of Contents

1. [System Architecture Diagram](#1-system-architecture-diagram)
2. [Data Flow Diagrams](#2-data-flow-diagrams)
3. [Component Boundaries](#3-component-boundaries)
4. [Communication Protocols](#4-communication-protocols)
5. [State Management](#5-state-management)
6. [Deployment Architecture](#6-deployment-architecture)
7. [Security Model](#7-security-model)
8. [Failure Modes & Recovery](#8-failure-modes--recovery)
9. [Database Schema](#9-database-schema)
10. [Performance Budget](#10-performance-budget)
11. [Debug & QA Tooling](#11-debug--qa-tooling)

---

## 1. System Architecture Diagram

```
                        PLAYERS (Mobile Browsers)
                        ========================

    ┌──────────────────────────────────────────────────────────────────┐
    │                  GitHub Pages (React SPA)                        │
    │                                                                  │
    │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
    │  │ Canvas/WebGL  │  │ Brain Editor │  │  Species Designer     │ │
    │  │ Renderer      │  │ (Node Graph) │  │  (Archetype+Sliders)  │ │
    │  └──────┬───────┘  └──────────────┘  └────────────────────────┘ │
    │         │                                                        │
    │  ┌──────┴──────────────────────┐  ┌────────────────────────────┐ │
    │  │ WebSocket Client            │  │ Supabase Client SDK        │ │
    │  │ (binary frames, viewport)   │  │ (REST + Realtime)          │ │
    │  └──────────┬──────────────────┘  └──────────────┬─────────────┘ │
    └─────────────┼────────────────────────────────────┼───────────────┘
                  │                                    │
                  │ WebSocket (binary)                 │ HTTPS (REST + WS)
                  │ ~7 KB/s per client                 │ Supabase Client SDK
                  │ 20 Hz delta broadcasts             │ Auth, designs, history,
                  │ viewport-culled entities            │ leaderboard, mutations
                  │                                    │
    ┌─────────────┼────────────┐      ┌────────────────┼───────────────┐
    │  VPS Simulation Server   │      │  Supabase                      │
    │  (Hetzner CX33 ~$7/mo)  │      │  (Managed Postgres + Auth)     │
    │                          │      │                                │
    │                          │      │  ┌──────────────────────────┐  │
    │  ┌────────────────────┐  │      │  │ Auth (GoTrue)            │  │
    │  │ WorldManager       │  │      │  │ - JWT tokens             │  │
    │  │ (N rooms)          │  │      │  │ - OAuth providers        │  │
    │  │                    │  │      │  └──────────────────────────┘  │
    │  │ ┌──── Room 1 ────┐│  │      │                                │
    │  │ │ Sim Loop 40TPS ││  │      │  ┌──────────────────────────┐  │
    │  │ │ Spatial hash    ││  │      │  │ Postgres                 │  │
    │  │ │ Neural nets     ││  │      │  │ - players (+ role)       │  │
    │  │ │ Physics/Biology ││  │      │  │ - species_designs        │  │
    │  │ │ AI organisms    ││  │      │  │ - active_species         │  │
    │  │ └────────────────┘│  │      │  │ - world_snapshots        │  │
    │  │ ┌──── Room N ────┐│  │      │  │ - leaderboard_scores     │  │
    │  │ │ (same per room) ││  │      │  │ - event_log              │  │
    │  │ └────────────────┘│  │      │  │ - daily_mutations        │  │
    │  └────────────────────┘  │      │  │ - player_summaries       │  │
    │                          │      │  │ - mutation_history        │  │
    │  ┌────────────────────┐  │      │  │ - worlds                 │  │
    │  │ WebSocket Server   │  │      │  │ - world_invites          │  │
    │  │ (uWebSockets.js)   │  │      │  │ - world_bans             │  │
    │  │ - JWT auth         │  │      │  └──────────────────────────┘  │
    │  │ - world join/leave │  │      │                                │
    │  │ - viewport mgmt    │  │      │  ┌──────────────────────────┐  │
    │  │ - binary encoding  │  │      │  │ Realtime                 │  │
    │  │ - delta compress   │  │      │  │ - Leaderboard changes    │  │
    │  └────────────────────┘  │      │  │ - Mutation notifications │  │
    │                          │      │  │ - World events           │  │
    │  ┌────────────────────┐  │      │  └──────────────────────────┘  │
    │  │ Admin REST API     │  │      │                                │
    │  │ - /api/admin/*     │  │      │  ┌──────────────────────────┐  │
    │  │ - JWT role check   │  │      │  │ Storage                   │  │
    │  │ - world CRUD       │  │      │  │ - Species thumbnails      │  │
    │  │ - kick/ban/invite  │  │      │  │ - Share cards (public)    │  │
    │  │ - dev tools (TPS,  │  │      │  └──────────────────────────┘  │
    │  │   snapshots, etc)  │  │      │                                │
    │  │ - /api/debug/*     │  │      │                                │
    │  └────────────────────┘  │      └────────────────────────────────┘
    │                          │
    │  ┌────────────────────┐  │
    │  │ Supabase Client    │  │
    │  │ (server-side,      │  │
    │  │  service_role key)  │  │
    │  │                    │  │
    │  │ - Write snapshots  │  │
    │  │ - Write events     │  │
    │  │ - Write leaderboard│  │
    │  │ - Read designs     │  │
    │  │ - Write mutations  │  │
    │  └────────────────────┘  │
    │                          │
    └──────────────────────────┘

    Communication Summary:
    ──────────────────────
    Client  ←─ WebSocket (binary) ─→  VPS        Real-time sim data (viewport entities)
    Client  ←─ Supabase SDK (REST) ─→  Supabase   Auth, designs, history, mutations
    Client  ←─ Supabase Realtime   ─→  Supabase   Leaderboard, events, mutation notifs
    VPS     ←─ Supabase Client     ─→  Supabase   Snapshots, events, leaderboard writes
```

**Three independent communication paths ensure separation of concerns:**

| Path | Transport | Direction | Frequency | Data |
|------|-----------|-----------|-----------|------|
| Client <-> VPS | WebSocket (binary) | Bidirectional | 20 Hz server->client broadcasts (from 40 TPS sim), on-demand client->server | World join/leave, entity positions, states, viewport changes |
| Client <-> VPS | HTTP REST (JSON) | Bidirectional | On-demand (admin only) | Admin world CRUD, kick/ban, dev tools, metrics |
| Client <-> Supabase | REST + Realtime WS | Bidirectional | On-demand reads/writes + push subscriptions | Auth, designs, leaderboard, mutations, events |
| VPS <-> Supabase | REST (service role) | Mostly VPS->Supabase writes | Every 15s metrics, every 5min snapshots | Snapshots, leaderboard, events, design reads |

---

## 2. Data Flow Diagrams

### Flow A: Player Designs and Deploys an Organism

```
 Player                   Client (React SPA)              Supabase                VPS Simulation Server
   │                           │                              │                           │
   │  1. Open designer         │                              │                           │
   │─────────────────────────>│                              │                           │
   │                           │                              │                           │
   │  2. Select archetype,     │                              │                           │
   │     adjust sliders,       │                              │                           │
   │     wire brain nodes      │                              │                           │
   │─────────────────────────>│                              │                           │
   │                           │                              │                           │
   │  3. Tap "Deploy"          │                              │                           │
   │─────────────────────────>│                              │                           │
   │                           │  4. Validate BP budget       │                           │
   │                           │     client-side (fast UX)    │                           │
   │                           │                              │                           │
   │                           │  5. INSERT species_designs   │                           │
   │                           │──────────────────────────────>│                           │
   │                           │                              │                           │
   │                           │  6. UPDATE species_designs   │                           │
   │                           │     SET is_active = false     │                           │
   │                           │     WHERE player_id = me      │                           │
   │                           │     AND is_active = true      │                           │
   │                           │──────────────────────────────>│                           │
   │                           │                              │                           │
   │                           │  7. Return design_id         │                           │
   │                           │<──────────────────────────────│                           │
   │                           │                              │                           │
   │                           │  8. Send DEPLOY cmd via WS   │                           │
   │                           │──────────────────────────────────────────────────────────>│
   │                           │                              │                           │
   │                           │                              │  9. Fetch design from     │
   │                           │                              │<──────────────────────────│
   │                           │                              │     Supabase by design_id │
   │                           │                              │                           │
   │                           │                              │  10. Server-side validate:│
   │                           │                              │      - BP total <= 100    │
   │                           │                              │      - Brain node limits  │
   │                           │                              │      - Trait unlocks owned│
   │                           │                              │      - Founders cost      │
   │                           │                              │                           │
   │                           │                              │  11. Retire old species:  │
   │                           │                              │      - Apply 10x ageing   │
   │                           │                              │      - Remove AI placeholder
   │                           │                              │                           │
   │                           │                              │  12. INSERT active_species│
   │                           │                              │──────────────────────────>│
   │                           │                              │                           │
   │                           │                              │  13. Spawn N founders     │
   │                           │                              │      in chosen biome at   │
   │                           │                              │      random positions     │
   │                           │                              │                           │
   │  14. See organisms appear │                              │                           │
   │     in world view          │<─────────────────────────────────────────────────────────│
   │                           │     (via WS entity updates)  │                           │
```

#### OrganismDesign TypeScript Interface

```typescript
interface OrganismDesign {
  id: string;                // UUID, assigned by Supabase
  playerId: string;          // FK to players.id
  speciesName: string;       // player-chosen name, 2-24 chars
  version: number;           // auto-incremented per player

  body: BodyGenes;
  traits: TraitConfig;
  brain: BrainConfig;
  deployment: DeploymentConfig;

  bpTotal: number;           // calculated, must be <= 100
  isActive: boolean;
  createdAt: string;         // ISO timestamp
}

interface BodyGenes {
  sizeRatio: number;         // 0.3 - 3.0
  speedRatio: number;        // 0.2 - 2.5
  strength: number;          // 0.1 - 5.0
  defense: number;           // 0.0 - 4.0
  diet: number;              // 0.0 (herbivore) - 1.0 (carnivore)
  viewAngle: number;         // 15 - 360 degrees
  viewRadius: number;        // 1.0 - 10.0 units
  metabolism: number;        // 0.5 - 3.0
  stomachMultiplier: number; // 0.3 - 2.0
  redColor: number;          // 0.0 - 1.0
  greenColor: number;        // 0.0 - 1.0
  blueColor: number;         // 0.0 - 1.0
}

interface TraitConfig {
  armorPlating?: {
    tier: 1 | 2 | 3;          // light / medium / heavy
    direction: 'front' | 'back';
  };
  venomGlands?: boolean;       // 8 BP
  echolocation?: boolean;      // 10 BP
  burrowing?: boolean;         // 12 BP
  camouflage?: boolean;        // 10 BP
  fatReserves?: {
    tier: 1 | 2 | 3 | 4;      // 5 / 10 / 15 / 20 BP
  };
  sporeDispersal?: boolean;    // 8 BP
  herdCoordination?: boolean;  // 7 BP
}

interface BrainConfig {
  nodes: BrainNode[];
  synapses: Synapse[];
}

interface BrainNode {
  id: string;                  // unique within this brain
  type: 'input' | 'hidden' | 'output';
  activation: 'sigmoid' | 'tanh' | 'relu' | 'linear' | 'latch'
            | 'multiply' | 'gaussian' | 'differential'
            | 'absolute' | 'sine' | 'integrator' | 'inhibitory';
  name: string;                // e.g., "NearestPlantAngle", "H1", "Accelerate"
  bias: number;                // -5.0 to +5.0
  position: { x: number; y: number }; // canvas position for UI
}

interface Synapse {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  weight: number;              // -5.0 to +5.0
  enabled: boolean;
}

interface DeploymentConfig {
  biome: 'grassland' | 'forest' | 'desert' | 'wetland' | 'rocky' | 'random';
  founderCount: number;        // 1 - 10, each beyond first costs 5 BP
  biomeBPCost: number;         // 0-14+ BP, computed at deploy time from biome crowding
  // biomeBPCost = floor(max(0, (biomeShare - 0.15) * 40))
  // where biomeShare = organismsInBiome / totalOrganisms
  // Random biome = always 0. World < 50 organisms = always 0.
}
```

---

### Flow B: Player Spectates the World

```
 Player             Client (React SPA)                     VPS Simulation Server
   │                      │                                        │
   │  1. Open world       │                                        │
   │     view             │                                        │
   │─────────────────────>│                                        │
   │                      │                                        │
   │                      │  2. Open WebSocket to wss://sim.lifegame.example
   │                      │────────────────────────────────────────>│
   │                      │                                        │
   │                      │  3. Send AUTH message                  │
   │                      │  [0x01][len][jwt_token_bytes]           │
   │                      │────────────────────────────────────────>│
   │                      │                                        │
   │                      │                  4. VPS verifies JWT   │
   │                      │                     (Supabase public   │
   │                      │                      key / JWKS)       │
   │                      │                                        │
   │                      │  5. AUTH_OK [0x02][player_id:u16]      │
   │                      │<────────────────────────────────────────│
   │                      │                                        │
   │                      │  5b. Request world list (WORLD_LIST)   │
   │                      │      or select from world picker       │
   │                      │                                        │
   │                      │  5c. JOIN_WORLD [0x05][worldId][pwd?]  │
   │                      │────────────────────────────────────────>│
   │                      │                                        │
   │                      │  5d. Server validates access:          │
   │                      │      - world exists & running          │
   │                      │      - not full, not banned            │
   │                      │      - password/invite check           │
   │                      │                                        │
   │                      │  5e. JOIN_OK [0x06][worldId][count]    │
   │                      │<────────────────────────────────────────│
   │                      │                                        │
   │                      │  6. Send VIEWPORT message              │
   │                      │  [0x03][x:f32][y:f32][w:f32][h:f32]    │
   │                      │────────────────────────────────────────>│
   │                      │                                        │
   │                      │  7. FULL_STATE: all entities in vp     │
   │                      │  [0x10][tick:u32][entityCount:u16]      │
   │                      │  [entity1][entity2]...[entityN]        │
   │                      │<────────────────────────────────────────│
   │                      │                                        │
   │  8. Render world     │                                        │
   │<─────────────────────│                                        │
   │                      │                                        │
   │                      │     ┌──── 20 Hz broadcast loop ─────┐  │
   │                      │     │ (decoupled from 40 TPS sim)    │  │
   │                      │  9. │ DELTA update (every 50ms)      │  │
   │                      │     │ [0x11][tick:u32][updates:u16]  │  │
   │                      │     │ [enters:u16][exits:u16]        │  │
   │                      │     │ [updated entities...]          │  │
   │                      │     │ [entered entities...]          │  │
   │                      │     │ [exited entity IDs...]         │  │
   │                      │<────┤                                │──│
   │                      │     │                                │  │
   │  10. Interpolate &   │     │                                │  │
   │      render at 60fps │     │                                │  │
   │<─────────────────────│     │                                │  │
   │                      │     └────────────────────────────────┘  │
   │                      │                                        │
   │  11. Pan/zoom        │  12. Send updated VIEWPORT             │
   │─────────────────────>│  [0x03][x:f32][y:f32][w:f32][h:f32]    │
   │                      │────────────────────────────────────────>│
   │                      │                                        │
   │                      │  13. FULL_STATE for new viewport       │
   │                      │<────────────────────────────────────────│
   │                      │                                        │
   │  14. Leave world     │  15. WebSocket disconnect              │
   │      view            │
   │─────────────────────>│────────────────────────────────────────>│
   │                      │                                        │
   │                      │      16. VPS removes client from       │
   │                      │          viewport tracking. Sim        │
   │                      │          continues at constant TPS.    │
```

#### Binary Entity Update Format

**Organism Entity (28 bytes):**
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
11      1      state            u8, bitfield:
                                  bit 0: is_eating
                                  bit 1: is_attacking
                                  bit 2: is_fleeing
                                  bit 3: is_burrowed
                                  bit 4: is_reproducing
                                  bit 5: is_dead
                                  bit 6: is_emitting_sound
                                  bit 7: is_camouflaged
12      2      speciesId        u16
14      1      red              u8
15      1      green            u8
16      1      blue             u8
17      1      maturity         u8, (maturity * 255)
18      1      speed            u8, (currentSpeed / maxSpeed * 255)
19      1      mouthState       u8, (diet * 255)
--- NEW BYTES (20-27) ---
20      1      traits           u8, bitfield:
                                  bit 0: sex (0=female, 1=male)
                                  bit 1: has_echolocation_active
                                  bit 2: is_venomed (currently poisoned)
                                  bit 3: is_ai_species
                                  bit 4: has_fat_reserves
                                  bit 5: has_herd_bonus_active
                                  bit 6: is_sprouting (spore launch anim)
                                  bit 7: reserved
21      1      fatFill          u8, (fatStored / maxFatCapacity * 255)
22      1      venomTimer       u8, (venomTimeRemaining / maxVenomDuration * 255)
23      1      matingCooldown   u8, (cooldownRemaining / maxCooldown * 255)
24      1      herdSize         u8, count of nearby allies (capped at 255)
25      1      eggProgress      u8, (eggStored * 255)
26      2      reserved         u16, 0x0000 (future expansion)
                                Total: 28 bytes
```

**Pellet entity (12 bytes):**
```
Offset  Size   Field            Encoding
──────  ────   ─────            ────────
0       2      entityId         u16
2       1      entityType       u8, 0x02 = plant, 0x03 = meat
3       2      x                u16, fixed-point
5       2      y                u16, fixed-point
7       1      size             u8, (pelletSize / maxPelletSize * 255)
8       1      red              u8
9       1      green            u8
10      1      blue             u8
11      1      decay            u8, (remainingEnergy / initialEnergy * 255)
                                Total: 12 bytes
```

Entity Type IDs:
0x01 = Organism (28 bytes)
0x02 = Plant Pellet (12 bytes)
0x03 = Meat Pellet (12 bytes)
0x04 = Egg (14 bytes)
0x05 = Fungus (12 bytes)
0x06 = Spore (16 bytes)

**Egg Entity (14 bytes):**
```
Offset  Size   Field            Encoding
──────  ────   ─────            ────────
0       2      entityId         u16
2       1      entityType       u8, 0x04
3       2      x                u16, fixed-point
5       2      y                u16, fixed-point
7       1      red              u8, species color R
8       1      green            u8, species color G
9       1      blue             u8, species color B
10      1      hatchProgress    u8, (1 - hatchTimeRemaining/totalHatchTime) * 255
11      1      nestBonus        u8, (nestBonusMultiplier * 255), 0 if no nest
12      2      speciesId        u16
```

**Fungus Entity (12 bytes):**
```
Offset  Size   Field            Encoding
──────  ────   ─────            ────────
0       2      entityId         u16
2       1      entityType       u8, 0x05
3       2      x                u16, fixed-point
5       2      y                u16, fixed-point
7       1      fungiType        u8 (0=Decomposer, 1=ToxicMold, 2=NutrientNet, 3=Parasitic, 4=Bioluminescent)
8       1      size             u8, (patchRadius / maxRadius * 255)
9       1      energy           u8, (remaining energy * 255)
10      2      reserved         u16
```

**Spore Entity (16 bytes):**
```
Offset  Size   Field            Encoding
──────  ────   ─────            ────────
0       2      entityId         u16
2       1      entityType       u8, 0x06
3       2      originX          u16, launch position
5       2      originY          u16, launch position
7       2      destX            u16, landing position
9       2      destY            u16, landing position
11      1      red              u8, species color R
12      1      green            u8, species color G
13      1      blue             u8, species color B
14      1      flightProgress   u8, (elapsed / 0.5s * 255), 255 = landed
15      1      speciesId_lo     u8, low byte of speciesId
```

**Bandwidth estimate per client:**
- Typical viewport: ~60 organisms (28B each) + ~200 pellets (12B each) + ~20 eggs/fungi/spores (~13B avg) = 4,340 B for full state
- Delta per tick: ~30 organism updates + ~10 pellet updates + ~5 egg/fungi/spore updates = 1,045 B + 8 B env header = 1,053 B
- At 20 Hz broadcasts: 1,053 * 20 = ~21,060 B/s raw, ~10,500 B/s with delta compression
- **~10 KB/s per connected client**

---

### Flow C: Daily Mutation Selection

```
 VPS Simulation Server              Supabase                Client (React SPA)       Player
        │                              │                          │                     │
        │  (continuously, each tick)   │                          │                     │
   1. Track all mutations in          │                          │                     │
      in-memory mutation pool:        │                          │                     │
      {geneId, oldVal, newVal,        │                          │                     │
       parentId, offspringId,         │                          │                     │
       offspringLifespan,             │                          │                     │
       offspringReproduced}           │                          │                     │
        │                              │                          │                     │
        │  2. At player's mutation     │                          │                     │
        │     time (daily cron):       │                          │                     │
        │     Filter pool for          │                          │                     │
        │     successful mutations     │                          │                     │
        │     (survived > median       │                          │                     │
        │      OR reproduced)          │                          │                     │
        │                              │                          │                     │
        │  3. Rank by fitness:         │                          │                     │
        │     score = lifespan/median  │                          │                     │
        │           + repro bonus      │                          │                     │
        │           + descendants      │                          │                     │
        │                              │                          │                     │
        │  4. Pick 3 diverse options:  │                          │                     │
        │     a) Best body gene mut    │                          │                     │
        │     b) Best brain mutation   │                          │                     │
        │     c) Most common success   │                          │                     │
        │                              │                          │                     │
        │  5. INSERT daily_mutations   │                          │                     │
        │     (options JSONB, status   │                          │                     │
        │      = 'pending')            │                          │                     │
        │──────────────────────────────>│                          │                     │
        │                              │                          │                     │
        │                              │  6. Realtime push to     │                     │
        │                              │     subscribed client    │                     │
        │                              │─────────────────────────>│  7. Show mutation   │
        │                              │                          │     selection UI    │
        │                              │                          │────────────────────>│
        │                              │                          │                     │
        │                              │                          │  8. Player picks    │
        │                              │                          │     option (0 or 1) │
        │                              │                          │<────────────────────│
        │                              │                          │                     │
        │                              │  9. UPDATE daily_mutations│                     │
        │                              │     SET selected_option,  │                     │
        │                              │     status = 'applied'    │                     │
        │                              │<─────────────────────────│                     │
        │                              │                          │                     │
        │ 10. Poll or subscribe for    │                          │                     │
        │     mutation selection        │                          │                     │
        │<──────────────────────────────│                          │                     │
        │                              │                          │                     │
        │ 11. Apply selected mutation  │                          │                     │
        │     to species template:     │                          │                     │
        │     Update template_genes    │                          │                     │
        │     in active_species.       │                          │                     │
        │     All future offspring     │                          │                     │
        │     inherit new base value.  │                          │                     │
        │                              │                          │                     │
        │ 12. INSERT mutation_history  │                          │                     │
        │──────────────────────────────>│                          │                     │
        │                              │                          │                     │
```

---

### Flow D: Player Switches Worlds

```
 Player             Client (React SPA)                Supabase         VPS Simulation Server
   │                      │                              │                       │
   │  1. Tap world pill   │                              │                       │
   │     in TopBar        │                              │                       │
   │─────────────────────>│                              │                       │
   │                      │                              │                       │
   │  2. World Picker     │  (WORLD_LIST already cached  │                       │
   │     modal opens      │   from auth or prior request)│                       │
   │<─────────────────────│                              │                       │
   │                      │                              │                       │
   │  3. Tap a different  │                              │                       │
   │     world            │                              │                       │
   │     (enter password  │                              │                       │
   │      if lock icon)   │                              │                       │
   │─────────────────────>│                              │                       │
   │                      │                              │                       │
   │  4. If active species│                              │                       │
   │     exists in current│                              │                       │
   │     world: Retire    │                              │                       │
   │     Warning modal    │                              │                       │
   │<─────────────────────│                              │                       │
   │                      │                              │                       │
   │  5. Player confirms  │                              │                       │
   │     (or no species)  │                              │                       │
   │─────────────────────>│                              │                       │
   │                      │                              │                       │
   │                      │  6. RETIRE_SPECIES [0x22]    │                       │
   │                      │     (if species existed)     │                       │
   │                      │──────────────────────────────────────────────────────>│
   │                      │                              │                       │
   │                      │  7. LEAVE_WORLD [0x06]       │                       │
   │                      │──────────────────────────────────────────────────────>│
   │                      │                              │                       │
   │                      │  8. JOIN_WORLD [0x05]        │                       │
   │                      │     [worldId:16B uuid]       │                       │
   │                      │     [pwdLen:u8][pwd:utf8]    │                       │
   │                      │──────────────────────────────────────────────────────>│
   │                      │                              │                       │
   │                      │     9. Server validates:     │                       │
   │                      │        - world exists &      │                       │
   │                      │          running             │                       │
   │                      │        - not full            │                       │
   │                      │        - not banned          │                       │
   │                      │        - password / invite   │                       │
   │                      │          check               │                       │
   │                      │                              │                       │
   │                      │ 10a. JOIN_OK [0x06]          │                       │
   │                      │      [worldId:16B]           │                       │
   │                      │      [playerCount:u16]       │                       │
   │                      │      [tick:u32]              │                       │
   │                      │<────────────────────────────────────────────────────── │
   │                      │   OR                         │                       │
   │                      │ 10b. JOIN_FAIL [0x07]        │                       │
   │                      │      [reason:u8]             │                       │
   │                      │      0=not found, 1=full,    │                       │
   │                      │      2=wrong password,       │                       │
   │                      │      3=not invited,          │                       │
   │                      │      4=banned,               │                       │
   │                      │      5=paused/stopped        │                       │
   │                      │<────────────────────────────────────────────────────── │
   │                      │                              │                       │
   │                      │ 11. On JOIN_OK: PATCH        │                       │
   │                      │     players.current_world_id │                       │
   │                      │─────────────────────────────>│                       │
   │                      │                              │                       │
   │                      │ 12. Send VIEWPORT →          │                       │
   │                      │     receive FULL_STATE       │                       │
   │                      │     → world renders          │                       │
   │                      │──────────────────────────────────────────────────────>│
   │                      │                              │                       │
   │ 13. Navigate to      │                              │                       │
   │     /world           │                              │                       │
   │<─────────────────────│                              │                       │
```

---

### Flow E: Admin Creates a World

```
 Admin              Client (React SPA)           VPS Admin REST API         VPS WorldManager
   │                      │                            │                          │
   │  1. Open admin panel │                            │                          │
   │     (/admin/worlds/  │                            │                          │
   │      create)         │                            │                          │
   │─────────────────────>│                            │                          │
   │                      │                            │                          │
   │  2. Fill form:       │                            │                          │
   │     name, access     │                            │                          │
   │     type, password,  │                            │                          │
   │     max players,     │                            │                          │
   │     world size, TPS, │                            │                          │
   │     description      │                            │                          │
   │─────────────────────>│                            │                          │
   │                      │                            │                          │
   │                      │  3. POST /api/admin/worlds │                          │
   │                      │     Authorization: Bearer  │                          │
   │                      │     <jwt>                  │                          │
   │                      │     { name, accessType,    │                          │
   │                      │       password?, ...}      │                          │
   │                      │───────────────────────────>│                          │
   │                      │                            │                          │
   │                      │     4. Verify JWT, check   │                          │
   │                      │        role = 'admin'      │                          │
   │                      │        from players table  │                          │
   │                      │                            │                          │
   │                      │     5. INSERT into worlds  │                          │
   │                      │        table in Supabase   │                          │
   │                      │                            │                          │
   │                      │                            │  6. WorldManager         │
   │                      │                            │     .createRoom(config)  │
   │                      │                            │─────────────────────────>│
   │                      │                            │                          │
   │                      │                            │  7. WorldRoom created,   │
   │                      │                            │     game loop starts     │
   │                      │                            │<─────────────────────────│
   │                      │                            │                          │
   │                      │  8. 201 Created            │                          │
   │                      │     { id, name, status:    │                          │
   │                      │       'running', ... }     │                          │
   │                      │<───────────────────────────│                          │
   │                      │                            │                          │
   │  9. World appears in │                            │                          │
   │     admin list &     │                            │                          │
   │     world picker     │                            │                          │
   │<─────────────────────│                            │                          │
```

---

### Flow F: Return After Absence

```
 Player              Client (React SPA)                Supabase                 VPS
   │                       │                              │                       │
   │  1. Open app after    │                              │                       │
   │     hours/days away   │                              │                       │
   │──────────────────────>│                              │                       │
   │                       │                              │                       │
   │                       │  2. Supabase auth refresh    │                       │
   │                       │     (session token)          │                       │
   │                       │─────────────────────────────>│                       │
   │                       │                              │                       │
   │                       │  3. Auth OK + user profile   │                       │
   │                       │     (includes current_world_id)                      │
   │                       │<─────────────────────────────│                       │
   │                       │                              │                       │
   │                       │  3b. If current_world_id is  │                       │
   │                       │      non-null: connect WS,   │                       │
   │                       │      auto-send JOIN_WORLD    │                       │
   │                       │      (skip world picker,     │                       │
   │                       │       resume in last world)  │                       │
   │                       │──────────────────────────────────────────────────────>│
   │                       │                              │                       │
   │                       │  4. SELECT player_summaries  │                       │
   │                       │     WHERE player_id = me     │                       │
   │                       │     ORDER BY period_end DESC │                       │
   │                       │     LIMIT 1                  │                       │
   │                       │─────────────────────────────>│                       │
   │                       │                              │                       │
   │                       │  5. Return summary JSON:     │                       │
   │                       │     {                        │                       │
   │                       │       hoursElapsed: 18,      │                       │
   │                       │       generationsElapsed: 620│                       │
   │                       │       peakPopulation: 42,    │                       │
   │                       │       currentPopulation: 28, │                       │
   │                       │       extinctionEvents: 0,   │                       │
   │                       │       topMutations: [...],   │                       │
   │                       │       dominanceChange: +0.12,│                       │
   │                       │       notableEvents: [...]   │                       │
   │                       │     }                        │                       │
   │                       │<─────────────────────────────│                       │
   │                       │                              │                       │
   │  6. Display "Welcome  │                              │                       │
   │     back!" summary    │                              │                       │
   │     with stats and    │                              │                       │
   │     highlights        │                              │                       │
   │<──────────────────────│                              │                       │
   │                       │                              │                       │
   │                       │  7. Fetch pending mutations  │                       │
   │                       │     SELECT daily_mutations   │                       │
   │                       │     WHERE status = 'pending' │                       │
   │                       │─────────────────────────────>│                       │
   │                       │                              │                       │
   │                       │  8. Return any pending       │                       │
   │                       │     mutation choices         │                       │
   │                       │<─────────────────────────────│                       │
   │                       │                              │                       │
   │  9. Show mutation     │                              │                       │
   │     selection if      │                              │                       │
   │     pending           │                              │                       │
   │<──────────────────────│                              │                       │
   │                       │                              │                       │
   │ 10. Tap "Spectate"    │                              │                       │
   │──────────────────────>│                              │                       │
   │                       │  11. Connect WebSocket       │                       │
   │                       │      (Flow B continues)      │                       │
   │                       │──────────────────────────────────────────────────────>│
   │                       │                              │                       │
   │                       │  12. Fetch leaderboard       │                       │
   │                       │─────────────────────────────>│                       │
   │                       │                              │                       │
   │                       │  13. Subscribe to realtime   │                       │
   │                       │      channels                │                       │
   │                       │─────────────────────────────>│                       │
```

---

## 3. Component Boundaries

| Client-Only | Server-Only | Supabase | Shared Types |
|---|---|---|---|
| Canvas/WebGL renderer | Simulation loop (40 TPS constant) | Auth (GoTrue, JWT) | `OrganismDesign` |
| Brain editor UI (node graph) | Neural network execution | `players` table | `BodyGenes` |
| Species designer (sliders) | Physics engine (forces, collision) | `species_designs` table | `BrainConfig` |
| Viewport management | Spatial hash (25x25 grid) | `active_species` table | `BrainNode` |
| Entity interpolation (60fps) | Biology (digestion, ageing, growth) | `world_snapshots` table | `Synapse` |
| Touch/gesture input | Ecology (plants, decay, seasons) | `leaderboard_scores` table | `TraitConfig` |
| Offline summary display | AI organism management | `event_log` table | `DeploymentConfig` |
| Mutation selection UI | Mutation pool tracking | `daily_mutations` table | `MessageType` enum |
| Leaderboard display | Mutation option generation | `player_summaries` table | `EntityType` enum |
| Event log timeline | Design validation (authoritative) | `mutation_history` table | `BiomeType` enum |
| Local settings (prefs) | WebSocket server (uWebSockets.js) | Row-Level Security policies | `SeasonType` enum |
| PWA manifest + SW | Delta compression encoder | Realtime broadcast | Binary protocol spec |
| Client-side BP calculator | Viewport culling per client | Database functions | `WorldEvent` type |
| Supabase SDK wrapper | Snapshot serialization | Indexes + constraints | `MutationOption` type |
| Species thumbnail gen | Leaderboard computation | Scheduled cleanup (pg_cron) | `LeaderboardEntry` type |
| Reconnection logic | Energy conservation checks | | `PlayerSummary` type |
| Sound effects | Species entropy calculation | | |
| Animation state machine | Pheromone grid diffusion | | |

---

## 4. Communication Protocols

### 4.1 WebSocket Protocol (Client <-> VPS)

#### Connection Lifecycle

```
Client                                                    VPS Server
  │                                                          │
  │  TCP + TLS handshake                                     │
  │─────────────────────────────────────────────────────────>│
  │                                                          │
  │  HTTP Upgrade: WebSocket                                 │
  │  wss://sim.lifegame.example/ws                           │
  │─────────────────────────────────────────────────────────>│
  │                                                          │
  │  101 Switching Protocols                                 │
  │<─────────────────────────────────────────────────────────│
  │                                                          │
  │  ═══════════ PHASE 1: AUTHENTICATION ═══════════         │
  │                                                          │
  │  AUTH [0x01][len:u16][jwt...]                             │
  │─────────────────────────────────────────────────────────>│
  │                                                          │
  │                           Verify JWT (Supabase JWKS)     │
  │                           Extract player_id, check expiry│
  │                                                          │
  │  AUTH_OK [0x02][playerId:u16][serverTick:u32]            │
  │<─────────────────────────────────────────────────────────│
  │    OR                                                    │
  │  AUTH_FAIL [0x03][reason:u8]                             │
  │<─────────────────────────────────────────────────────────│
  │  (server closes connection)                              │
  │                                                          │
  │  ═══════════ PHASE 2: JOIN WORLD ═══════════             │
  │                                                          │
  │  JOIN_WORLD [0x05][worldId:16B][pwdLen:u8][pwd:utf8]    │
  │─────────────────────────────────────────────────────────>│
  │                                                          │
  │                           Validate: world exists,        │
  │                           running, not full, not banned,  │
  │                           password/invite check          │
  │                                                          │
  │  JOIN_OK [0x06][worldId:16B][playerCount:u16][tick:u32] │
  │<─────────────────────────────────────────────────────────│
  │    OR                                                    │
  │  JOIN_FAIL [0x07][reason:u8]                             │
  │<─────────────────────────────────────────────────────────│
  │                                                          │
  │  (client can send LEAVE_WORLD [0x06] then JOIN_WORLD     │
  │   for a new world. Single-world rule: client must        │
  │   retire species in old world first if one exists —      │
  │   enforced client-side with confirmation, verified       │
  │   server-side.)                                          │
  │                                                          │
  │  ═══════════ PHASE 3: VIEWPORT SETUP ═══════════         │
  │                                                          │
  │  VIEWPORT [0x03][x:f32][y:f32][w:f32][h:f32]            │
  │─────────────────────────────────────────────────────────>│
  │                                                          │
  │                           Register viewport, compute     │
  │                           visible entities               │
  │                                                          │
  │  FULL_STATE [0x10][tick:u32][count:u16][entities...]     │
  │<─────────────────────────────────────────────────────────│
  │                                                          │
  │  ═══════════ PHASE 4: STREAMING ═══════════              │
  │                                                          │
  │                    ┌── 20 Hz broadcast ─┐                 │
  │  DELTA [0x11]...   │  (from 40 TPS sim) │                 │
  │<───────────────────┤  every 50ms        │─────────────────│
  │                    └────────────────────┘                 │
  │                                                          │
  │  VIEWPORT (on pan/zoom, throttled to 4/sec max)         │
  │─────────────────────────────────────────────────────────>│
  │                                                          │
  │  FULL_STATE (after large viewport change)               │
  │<─────────────────────────────────────────────────────────│
  │                                                          │
  │  DEPLOY [0x20][designId:uuid]                            │
  │─────────────────────────────────────────────────────────>│
  │                                                          │
  │  DEPLOY_ACK [0x21][speciesId:u16][status:u8]            │
  │<─────────────────────────────────────────────────────────│
  │                                                          │
  │  ═══════════ PHASE 5: DISCONNECT ═══════════             │
  │                                                          │
  │  WebSocket close frame                                   │
  │─────────────────────────────────────────────────────────>│
  │                                                          │
  │                           Remove from viewport tracking  │
  │                           Sim continues at constant TPS  │
```

#### Binary Message Format

All WebSocket messages use binary frames. Header:

```
Byte 0      Byte 1-2
┌──────────┬───────────────┐
│ msgType  │ payloadLen    │
│ u8       │ u16 (LE)      │
└──────────┴───────────────┘
  1 byte     2 bytes         = 3 byte header, followed by payloadLen bytes
```

#### Message Types Enum

```typescript
enum MessageType {
  // Client -> Server
  AUTH              = 0x01,  // [jwt_bytes...]
  VIEWPORT          = 0x03,  // [x:f32][y:f32][w:f32][h:f32]
  JOIN_WORLD        = 0x05,  // [worldId:16B uuid][pwdLen:u8][pwd:utf8]
  LEAVE_WORLD       = 0x06,  // [] (leave current world, stay connected)
  DEPLOY            = 0x20,  // [designId:16 bytes UUID]
  PING              = 0x30,  // [] (empty, keepalive)
  RETIRE_SPECIES    = 0x22,  // []

  // Server -> Client
  AUTH_OK           = 0x02,  // [playerId:u16][serverTick:u32]
  AUTH_FAIL         = 0x04,  // [reason:u8]
  WORLD_LIST        = 0x05,  // [count:u16][worlds...] (see world list format below)
  JOIN_OK           = 0x06,  // [worldId:16B][playerCount:u16][tick:u32]
  JOIN_FAIL         = 0x07,  // [reason:u8] (see JoinFailReason below)
  KICKED            = 0x08,  // [reason:u8][msgLen:u16][msg:utf8]
  FULL_STATE        = 0x10,  // [tick:u32][env:8B][entityCount:u16][entities...]
  DELTA             = 0x11,  // [tick:u32][env:8B][updates:u16][enters:u16][exits:u16]
                             //   [updated...][entered...][exitedIds...]
  BIOME_MAP         = 0x12,  // [gridRes:u8][data:gridRes² bytes] (sent once on JOIN_OK)
  DEPLOY_ACK        = 0x21,  // [speciesId:u16][status:u8]
  WORLD_EVENT       = 0x40,  // [eventType:u8][payload...]
  EVENT_WARNING     = 0x24,  // 30s warning before ecological event onset
  PONG              = 0x31,  // [serverTick:u32]

  // Debug (admin-only, see debug.md §D for full protocol)
  DEBUG_SUBSCRIBE       = 0xD0,  // C→S [streamBitmask:u16]
  DEBUG_UNSUBSCRIBE     = 0xD1,  // C→S [streamBitmask:u16]
  DEBUG_INSPECT_ENTITY  = 0xD2,  // C→S [entityId:u16]
  DEBUG_TRACE_ENTITY    = 0xD3,  // C→S [entityId:u16, enable:u8]
  DEBUG_QUERY           = 0xD4,  // C→S [queryType:u8, params...]
  DEBUG_TICK_PROFILE    = 0xD8,  // S→C [tick:u32, systemCount:u8, [{systemId:u8, ms:f32}...]]
  DEBUG_ENERGY_SNAPSHOT = 0xD9,  // S→C [tick:u32, 7×f32]
  DEBUG_ENTITY_DETAIL   = 0xDA,  // S→C [JSON FullEntityDetail]
  DEBUG_BRAIN_TRACE     = 0xDB,  // S→C [tick:u32, entityId:u16, nodeCount:u16, activations...]
  DEBUG_SPATIAL_STATS   = 0xDC,  // S→C [tick:u32, 400×u16, stats] (every 4th tick)
  DEBUG_LIFECYCLE_EVENT = 0xDD,  // S→C [JSON ReproEvent]
  DEBUG_COMBAT_EVENT    = 0xDE,  // S→C [tick:u32, attacker:u16, defender:u16, damage:f32, flags:u8]
  DEBUG_LOG_ENTRY       = 0xDF,  // S→C [JSON DebugLogEntry]

  SERVER_SHUTDOWN   = 0xFF,  // [reason:u8][restartInSec:u16]
}

enum JoinFailReason {
  NOT_FOUND         = 0x00,
  FULL              = 0x01,
  WRONG_PASSWORD    = 0x02,
  NOT_INVITED       = 0x03,
  BANNED            = 0x04,
  PAUSED_OR_STOPPED = 0x05,
}

enum AuthFailReason {
  INVALID_TOKEN  = 0x01,
  EXPIRED_TOKEN  = 0x02,
  SERVER_FULL    = 0x03,
  BANNED         = 0x04,
}

enum DeployStatus {
  SUCCESS           = 0x00,
  INVALID_DESIGN    = 0x01,
  BP_EXCEEDED       = 0x02,
  MISSING_UNLOCK    = 0x03,
  RATE_LIMITED      = 0x04,
}
```

#### WORLD_LIST Message Format (World Picker)

Sent by server after AUTH_OK and on client request. Contains all joinable worlds.

```
Per world entry:
[worldId: 16B uuid]
[nameLen: u8][name: utf8]
[accessType: u8]           // 0=public, 1=password, 2=invite
[status: u8]               // 0=running, 1=paused, 2=stopped
[playerCount: u16]
[maxPlayers: u16]
[season: u8]               // 0-3
[descLen: u16][desc: utf8]
```

#### Environment Header (8 bytes)

Included in every FULL_STATE and DELTA message, immediately after the tick field. Gives the client all environment state needed for rendering biome tints, day/night overlay, and seasonal effects.

```
Offset  Size  Field           Encoding
──────  ────  ─────           ────────
0       1     season          u8, 0=Spring 1=Summer 2=Autumn 3=Winter
1       1     seasonProgress  u8, (progress * 255), position within current season
2       1     ambientLight    u8, (light * 255), 0=midnight 255=noon (sinusoidal)
3       1     activeEvent     u8, event type enum (0=none)
4       2     reserved        u16, 0x0000 (future: weather, wind direction)
6       2     reserved        u16, 0x0000
                              Total: 8 bytes
```

Overhead: 8 bytes × 20 Hz = 160 B/s per client (negligible).

activeEvent values:
0 = None
1 = Bloom (2× plant spawn)
2 = Drought (50% plant spawn)
3 = Plague (health DoT, proximity spread)
4 = Migration (NPC herd passing through)
5 = Fungi Outbreak (mass fungi spawn in wetland/forest)
6 = Meteor Impact (area cleared, crater)

30 seconds before event onset, server sends EVENT_WARNING message [0x24] with event type + affected area coordinates.

#### BIOME_MAP Message (0x12)

Sent by server immediately after JOIN_OK. Contains the biome grid so the client can render biome backgrounds. Re-sent when seasonal biome boundary shifts occur.

```
[gridRes: u8]                       1 byte (= 50)
[biomeGrid: gridRes² bytes]         2500 bytes, row-major, each byte = BiomeType enum
                                    Total: 2501 bytes (sent once per world join + on boundary shifts)
```

#### Entity Update Formats

Organism (28 bytes), Pellet (12 bytes), Egg (14 bytes), Fungus (12 bytes), and Spore (16 bytes) formats are specified in Flow B above.

**FULL_STATE message body layout:**
```
[tick:u32]                          4 bytes
[env:8B]                            8 bytes (environment header, see above)
[entityCount:u16]                   2 bytes
[entities...]                       entityCount * (28, 14, 12, or 16) bytes depending on entity type
```

**DELTA message body layout:**
```
[tick:u32]                          4 bytes
[env:8B]                            8 bytes (environment header, see above)
[numUpdated:u16]                    2 bytes
[numEntered:u16]                    2 bytes
[numExited:u16]                     2 bytes
[updated entity entries]            numUpdated * (28, 14, 12, or 16) bytes depending on entity type
[entered entity entries]            numEntered * (28, 14, 12, or 16) bytes depending on entity type
[exited entity IDs]                 numExited * 2 bytes (u16 each)
```

Entity type at offset 2 determines packet length: 0x01→28, 0x02/0x03→12, 0x04→14, 0x05→12, 0x06→16

#### Reconnection Strategy

```
On WebSocket disconnect:
  1. Attempt reconnect immediately (0ms delay)
  2. If fail: wait 500ms, retry
  3. If fail: wait 1000ms, retry
  4. If fail: wait 2000ms, retry
  5. If fail: wait 4000ms, retry
  6. Continue doubling up to max 30000ms (30 seconds)
  7. After 5 minutes total: show "Server unreachable" UI, stop retrying

On successful reconnect:
  1. Re-send AUTH with current JWT (refresh token if expired)
  2. Re-send VIEWPORT with last known viewport
  3. Server sends FULL_STATE (not DELTA, since client state is stale)
  4. Resume DELTA streaming

Jitter: Add random 0-25% to each backoff interval to prevent thundering herd.
```

---

### 4.2 Supabase Client (Client <-> Supabase)

#### REST Operations

| Operation | Method | Table / RPC | Frequency | Auth | Notes |
|-----------|--------|-------------|-----------|------|-------|
| Read own profile | GET | `players` | On app open | JWT (own row) | Display name, EP, unlocks, `current_world_id` |
| Update display name | PATCH | `players` | Rare | JWT (own row) | Validated server-side |
| Update current world | PATCH | `players` | On world switch (~rare) | JWT (own row) | Sets `current_world_id`. Called after successful JOIN_OK |
| Read own designs | GET | `species_designs` | On open designer | JWT (own rows) | History of all designs |
| Save new design | POST | `species_designs` | On deploy (~1/day) | JWT (own row) | Validated client+server |
| Deactivate old design | PATCH | `species_designs` | On deploy | JWT (own rows) | `is_active = false` |
| Read leaderboard | GET | `leaderboard_scores` | On open leaderboard | JWT (any row, read-only) | Top 30 species |
| Read event log | GET | `event_log` | On open history | JWT (filtered) | World events + own events |
| Read pending mutations | GET | `daily_mutations` | On app open | JWT (own rows) | Check for pending choices |
| Submit mutation choice | PATCH | `daily_mutations` | 1/day max | JWT (own row) | `selected_option`, `status` |
| Read absence summary | GET | `player_summaries` | On app open | JWT (own rows) | Latest summary for player |
| Read mutation history | GET | `mutation_history` | On open pool viewer | JWT (own rows) | Gene change history |
| Read species history | GET | `active_species` | On open directory | JWT (any row, read-only) | All species (retired_at IS NOT NULL for history) |
| Read species design (retired) | GET | `species_designs` | On view detail in directory | JWT (any row via RLS) | Fetched via `design_id` FK; includes brain wiring JSONB. RLS allows read for retired species only |
| Upload share card | POST | Storage: `share-cards` | On share (~rare) | JWT | PNG upload, public read |
| Validate design unlock | POST | RPC: `validate_design` | On deploy | JWT | Server checks unlocked_tier vs design's node/trait tiers. Rejects if player uses locked features |

#### Storage Buckets

| Bucket | Access | Retention | Notes |
|--------|--------|-----------|-------|
| `share-cards` | Public read, authenticated write | 90 days | Species farewell card PNGs. Path: `{speciesId}.png`. Max 500 KB per file. Old cards auto-pruned. |

#### Realtime Subscriptions

```typescript
// Leaderboard changes (all players see updates)
supabase
  .channel('leaderboard')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'leaderboard_scores',
  }, (payload) => updateLeaderboard(payload))
  .subscribe();

// Mutation notifications (player-specific)
supabase
  .channel(`mutations:${playerId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'daily_mutations',
    filter: `player_id=eq.${playerId}`,
  }, (payload) => showMutationNotification(payload))
  .subscribe();

// World events (broadcast to all)
supabase
  .channel('world_events')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'event_log',
    filter: `event_scope=eq.world`,
  }, (payload) => displayWorldEvent(payload))
  .subscribe();
```

---

### 4.3 Server <-> Supabase

The VPS uses the Supabase client with the `service_role` key (bypasses RLS).

#### Write Patterns

| Write | Table | Frequency | Avg Data Size | Notes |
|-------|-------|-----------|---------------|-------|
| Leaderboard update | `leaderboard_scores` | Every 15 sec | ~30 rows x 200B = 6 KB | UPSERT all active species scores |
| Key metrics snapshot | `world_snapshots` | Every 5 min | ~500 KB - 1 MB | Full world state as JSONB |
| Event log | `event_log` | On event (~10/min) | ~200 B per event | Extinction, season change, etc. |
| Daily mutations | `daily_mutations` | 1/player/day | ~2 KB per row | 3 mutation options as JSONB |
| Mutation history | `mutation_history` | On mutation applied | ~150 B per row | Track applied mutations |
| Player summary | `player_summaries` | Every 1 hour | ~1 KB per player | Absence summary refresh |
| Active species | `active_species` | On deploy/retire | ~500 B per row | Species lifecycle tracking |
| Player EP update | `players` | On EP gain events | ~50 B | Increment evolution_points |

#### Read Patterns

| Read | Table | Frequency | Notes |
|------|-------|-----------|-------|
| Fetch design on deploy | `species_designs` | On player deploy | Read single design by ID |
| Check mutation selection | `daily_mutations` | Every 60 sec poll | Check if player selected mutation |
| Load latest snapshot | `world_snapshots` | On server startup | Recovery from crash |

#### WorldSnapshot Interface

```typescript
interface WorldSnapshot {
  id: string;                    // UUID
  worldId: string;               // world identifier (for future multi-world)
  tick: number;                  // simulation tick at snapshot time
  createdAt: string;             // ISO timestamp

  snapshot: {
    metadata: {
      tick: number;
      realTimeMs: number;        // wall clock time since world start
      season: 'spring' | 'summer' | 'autumn' | 'winter';
      seasonProgress: number;    // 0.0 - 1.0 within current season
      totalEnergy: number;       // conservation check value
      freeBiomass: number;
    };

    organisms: Array<{
      id: number;
      speciesId: number;
      playerId: string;
      position: { x: number; y: number };
      heading: number;
      velocity: { x: number; y: number };
      health: number;
      energy: number;
      maturity: number;
      age: number;
      genes: Record<string, number>;  // all gene values
      brainState: number[];           // node activations
      stomachContents: number;
      fatStored: number;
      eggProgress: number;
      isBurrowed: boolean;
      sex: 0 | 1;                      // 0=female, 1=male (0 for asexual species)
      matingCooldown: number;           // Seconds remaining
      venomTimeRemaining: number;       // Seconds of venom DoT remaining
      venomDPS: number;                 // Current venom damage per second
      camoBreakTimer: number;           // Seconds until camouflage restores after attack
      burrowCooldown: number;           // Seconds until can re-burrow
      burrowSurfaceTimer: number;       // Seconds remaining in surfacing transition
      soundEmitIntensity: number;       // Current sound emission [0, 1]
      soundEmitFrequency: number;       // Current sound frequency [0, 1]
      immuneStrength: number;           // Current immune activation [0, 1]
      encounterMemoryFood: number;      // Seconds remaining for food memory
      encounterMemoryThreat: number;    // Seconds remaining for threat memory
    }>;

    pellets: Array<{
      id: number;
      type: 'plant' | 'meat';
      position: { x: number; y: number };
      size: number;
      energy: number;
    }>;

    eggs: Array<{
      id: number;
      speciesId: number;
      position: { x: number; y: number };
      hatchProgress: number;
      nestBonus: number;
      color: { r: number; g: number; b: number };
    }>;

    fungi: Array<{
      id: number;
      type: 'decomposer' | 'toxic' | 'nutrient' | 'parasitic' | 'bioluminescent';
      position: { x: number; y: number };
      radius: number;
      energy: number;
    }>;

    spores: Array<{
      id: number;
      speciesId: number;
      origin: { x: number; y: number };
      destination: { x: number; y: number };
      flightProgress: number;
      color: { r: number; g: number; b: number };
    }>;

    pheromoneGrid: {
      resolution: number;         // grid cells per axis
      channels: {
        red: Float32Array;        // serialized as base64
        green: Float32Array;
        blue: Float32Array;
      };
    };

    activeSpecies: Array<{
      speciesId: number;
      playerId: string;
      isAi: boolean;
      deployedAt: string;
      populationCount: number;
      generationMax: number;
      entropyMultiplier: number;
      templateGenes: Record<string, number>;
      mutationPool: Array<{
        geneId: string;
        oldValue: number;
        newValue: number;
        fitnessScore: number;
      }>;
    }>;
  };
}
```

### 4.4 Admin REST API (Client <-> VPS)

All admin endpoints require `Authorization: Bearer <jwt>` header. The server verifies the JWT and checks `role = 'admin'` from the `players` table. Returns 403 for non-admins.

Detailed endpoint specifications are in [`back-end.md` Section 10.3](#). Summary of endpoint groups:

| Group | Prefix | Description |
|-------|--------|-------------|
| World CRUD | `/api/admin/worlds` | Create, list, get, update, delete worlds |
| World Lifecycle | `/api/admin/worlds/:id/{start,pause,resume,restart,reset}` | Control world state |
| Dev Tools | `/api/admin/worlds/:id/{tps,snapshot,snapshots,restore}` | Live TPS control, snapshot management |
| Player Management | `/api/admin/worlds/:id/{players,kick,ban}` | Kick, ban, unban |
| Invite Management | `/api/admin/worlds/:id/invites` | Invite/revoke for invite-only worlds |
| Metrics | `/api/admin/metrics` | Aggregate and per-world server metrics |
| Debug | `/api/debug/*` | Admin-gated debug instrumentation, entity inspection, simulation manipulation, testing. See [`debug.md`](./debug.md) §E |

---

## 5. State Management

| Data | Authoritative Source | Persistence Strategy | Staleness Tolerance |
|------|---------------------|---------------------|---------------------|
| Entity positions (x, y, heading) | VPS (in-memory) | Snapshot to Supabase every 5 min | 0 ms (real-time via WS) |
| Entity health/energy | VPS (in-memory) | Snapshot every 5 min | 25 ms (1 tick at 40 TPS) |
| Brain node activations | VPS (in-memory) | Snapshot every 5 min | Not sent to client |
| Synapse weights (live) | VPS (in-memory) | Snapshot every 5 min | Not sent to client |
| Pheromone grid (3 channels) | VPS (in-memory) | Snapshot every 5 min | Not sent to client |
| Mutation pool (rolling 24h) | VPS (in-memory) | Written to Supabase on daily mutation gen | 1 hour |
| Organism design (template) | Supabase (`species_designs`) | Immediately persisted | Minutes (cached on VPS) |
| Active species metadata | VPS + Supabase (`active_species`) | Updated on deploy, retire, every 15s stats | 15 seconds |
| Player profiles | Supabase (`players`) | Immediately persisted | Minutes |
| Evolution points | Supabase (`players`) | Updated on EP-granting events | Minutes |
| Unlocked tiers/traits | Supabase (`players`) | Updated on unlock events | Minutes |
| Leaderboard scores | VPS computes, Supabase stores | Recomputed + written every 15s | 15 seconds |
| World events | VPS generates, Supabase stores | Written on occurrence | Seconds (Realtime push) |
| Daily mutation options | VPS generates, Supabase stores | Written once per player per day | N/A (event-driven) |
| Player mutation selection | Supabase (`daily_mutations`) | Immediately persisted, VPS polls | 60 seconds |
| Absence summary | VPS generates, Supabase stores | Updated every 1 hour | 1 hour |
| Biome map | VPS (in-memory, static) | Part of world snapshot | N/A (static per world) |
| Season state | VPS (in-memory) | Part of world snapshot | 25 ms (1 tick at 40 TPS) |
| Client viewport | Client (local state) | Not persisted | N/A |
| Client interpolation buffer | Client (local state) | Not persisted | N/A |
| Player's current world | Supabase (`players.current_world_id`) | Updated on world switch, read on session restore | Minutes |
| Client preferences | Client (localStorage) | Browser localStorage | N/A |
| Onboarding state | Supabase (`players.onboarding_state`) | JSONB column + localStorage fallback | Minutes (synced on login) |
| World access grants | Supabase (`world_access_grants`) | Immediately persisted on password entry or admin invite | Minutes |
| Fungi patches | VPS (in-memory) | Part of world snapshot | 25 ms (real-time via WS) |
| Egg entities | VPS (in-memory) | Part of world snapshot | 25 ms (real-time via WS) |
| Active ecological event | VPS (in-memory) | Part of world snapshot | Seconds |
| Species entropy multiplier | VPS (computed) | Derived from deploy time + worlds.entropy_half_life | 15 seconds |
| AI species roster | VPS + Supabase | Checked on player deploy/extinction | Minutes |
| Organism fat reserves | VPS (in-memory) | Part of world snapshot | 25 ms |
| Organism venom/DoT state | VPS (in-memory) | Part of world snapshot | 25 ms |

---

## 6. Deployment Architecture

### 6.1 Repository Structure

```
life-game/
├── client/                          # React SPA (Vite + TypeScript)
│   ├── public/
│   │   ├── index.html
│   │   └── manifest.json           # PWA manifest
│   ├── src/
│   │   ├── main.tsx                # Entry point
│   │   ├── App.tsx                 # Root component + routing
│   │   ├── components/
│   │   │   ├── world/              # World view — unified camera with LOD (Canvas/WebGL)
│   │   │   │   ├── WorldScreen.tsx
│   │   │   │   ├── WorldRenderer.ts
│   │   │   │   ├── EntityRenderer.ts
│   │   │   │   ├── LODRenderer.ts
│   │   │   │   └── ViewportManager.ts
│   │   │   ├── designer/           # Organism designer
│   │   │   │   ├── DesignerView.tsx
│   │   │   │   ├── BodyEditor.tsx
│   │   │   │   ├── BrainEditor.tsx
│   │   │   │   └── TraitPicker.tsx
│   │   │   ├── dashboard/          # Stats, leaderboard, history
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── Leaderboard.tsx
│   │   │   │   ├── EventTimeline.tsx
│   │   │   │   └── AbsenceSummary.tsx
│   │   │   └── mutations/          # Daily mutation selection
│   │   │       ├── MutationPicker.tsx
│   │   │       └── MutationPoolView.tsx
│   │   ├── lib/
│   │   │   ├── ws-client.ts        # WebSocket connection manager
│   │   │   ├── binary-protocol.ts  # Encode/decode binary messages
│   │   │   ├── supabase.ts         # Supabase client init
│   │   │   ├── interpolation.ts    # Entity position interpolation
│   │   │   ├── bp-calculator.ts    # Bio-point budget validation
│   │   │   └── share-card.ts       # ShareCardRenderer (farewell card generation + sharing)
│   │   ├── stores/                 # State management (Zustand or similar)
│   │   │   ├── auth-store.ts
│   │   │   ├── world-store.ts
│   │   │   ├── design-store.ts
│   │   │   └── ui-store.ts
│   │   └── types/                  # -> imports from shared/
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── server/                          # Node.js simulation server
│   ├── src/
│   │   ├── main.ts                 # Entry point, server startup
│   │   ├── simulation/
│   │   │   ├── world.ts            # World state, tick loop
│   │   │   ├── organism.ts         # Organism entity
│   │   │   ├── pellet.ts           # Plant/meat pellet entity
│   │   │   ├── spatial-hash.ts     # Spatial partitioning (25x25 grid)
│   │   │   ├── physics.ts          # Movement, collisions
│   │   │   ├── brain.ts            # Neural network execution
│   │   │   ├── biology.ts          # Digestion, growth, ageing, death
│   │   │   ├── ecology.ts          # Plant spawning, decay, seasons
│   │   │   ├── pheromones.ts       # Pheromone grid diffusion
│   │   │   ├── genetics.ts         # Mutation engine, pool tracking
│   │   │   ├── species.ts          # Species management, entropy
│   │   │   └── ai-manager.ts       # AI species lifecycle
│   │   ├── network/
│   │   │   ├── ws-server.ts        # uWebSockets.js server
│   │   │   ├── binary-encoder.ts   # Encode entity updates
│   │   │   ├── viewport-manager.ts # Per-client viewport tracking
│   │   │   ├── delta-compressor.ts # Delta state computation
│   │   │   └── auth.ts             # JWT verification
│   │   ├── persistence/
│   │   │   ├── supabase-client.ts  # Server-side Supabase (service_role)
│   │   │   ├── snapshot.ts         # World snapshot serialization
│   │   │   ├── leaderboard.ts      # Score computation + write
│   │   │   ├── events.ts           # Event log writer
│   │   │   ├── mutations.ts        # Daily mutation generation
│   │   │   └── summaries.ts        # Player absence summary
│   │   └── config.ts               # Server configuration
│   ├── Dockerfile
│   ├── tsconfig.json
│   └── package.json
│
├── shared/                          # Shared TypeScript types
│   ├── src/
│   │   ├── types.ts                # OrganismDesign, BodyGenes, BrainConfig, etc.
│   │   ├── protocol.ts             # MessageType enum, binary format constants
│   │   ├── constants.ts            # BP costs, gene ranges, world dimensions
│   │   ├── validation.ts           # Design validation (BP budget, trait limits)
│   │   └── enums.ts                # BiomeType, SeasonType, EntityType, etc.
│   ├── tsconfig.json
│   └── package.json
│
├── supabase/                        # Supabase project config
│   ├── migrations/
│   │   ├── 001_create_tables.sql   # All table definitions
│   │   ├── 002_create_indexes.sql  # Performance indexes
│   │   ├── 003_create_rls.sql      # Row-Level Security policies
│   │   └── 004_create_functions.sql # Database functions
│   ├── seed.sql                    # Initial data (AI species templates, etc.)
│   └── config.toml                 # Supabase project config
│
├── .github/
│   └── workflows/
│       ├── deploy-client.yml       # Build + deploy to GitHub Pages
│       └── deploy-server.yml       # Build + push Docker image (optional)
│
└── README.md
```

### 6.2 Client Deployment (GitHub Pages)

```
 Developer               GitHub                  GitHub Pages CDN
    │                       │                          │
    │  git push main        │                          │
    │──────────────────────>│                          │
    │                       │                          │
    │                  GitHub Actions triggers:        │
    │                  1. npm ci (client/)             │
    │                  2. npm ci (shared/)             │
    │                  3. vite build                   │
    │                     -> dist/ (~500KB gzipped)    │
    │                  4. Deploy dist/ to gh-pages     │
    │                       │                          │
    │                       │  Upload static assets    │
    │                       │─────────────────────────>│
    │                       │                          │
    │                       │         lifegame.example │
    │                       │         served via CDN   │
```

**GitHub Actions workflow** (`deploy-client.yml`):
```yaml
name: Deploy Client
on:
  push:
    branches: [main]
    paths: ['client/**', 'shared/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd shared && npm ci && npm run build
      - run: cd client && npm ci && npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          VITE_WS_URL: ${{ secrets.WS_URL }}
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./client/dist
```

#### Share Page (OG Meta Tags for Link Previews)

Share links (`/share/{speciesId}`) need Open Graph meta tags for rich previews on WhatsApp, Twitter, Discord, etc. Since GitHub Pages serves a static SPA, OG tags can't be dynamically generated per species.

**Solution**: Use a Supabase Edge Function as a lightweight proxy for share URLs:

```
GET https://yourproject.supabase.co/functions/v1/share-card/{speciesId}
→ Returns minimal HTML with dynamic OG tags:
  <meta property="og:title" content="{speciesName} — Species Farewell" />
  <meta property="og:image" content="https://yourproject.supabase.co/storage/v1/object/public/share-cards/{speciesId}.png" />
  <meta property="og:description" content="Lasted {duration} days. Peak pop: {peakPop}. Gen: {gen}." />
  <meta http-equiv="refresh" content="0;url=https://lifegame.example/#/species/{speciesId}" />
```

The edge function reads species data from `active_species`, constructs OG tags, and redirects browsers to the SPA species detail page. Crawlers (WhatsApp, Twitter) get the meta tags they need without executing JavaScript. Cost: negligible (edge function invoked only when share links are opened, ~milliseconds per call).

### 6.3 VPS Deployment

```
┌──────────────────────────────────────────────────┐
│  VPS (Hetzner CX33 ~$7/mo)                       │
│  Ubuntu 22.04, 4 vCPU, 8GB RAM                   │
│                                                   │
│                                                   │
│  ┌────────────────────────────────────────────┐   │
│  │  Caddy (reverse proxy + auto-SSL)          │   │
│  │  :443 → proxy to localhost:9000            │   │
│  │  sim.lifegame.example                      │   │
│  └────────────────────┬───────────────────────┘   │
│                       │                           │
│  ┌────────────────────▼───────────────────────┐   │
│  │  Docker: life-game-server                  │   │
│  │  Node.js 20 (Alpine)                       │   │
│  │  Port 9000 (WebSocket + HTTP health)       │   │
│  │                                            │   │
│  │  Environment:                              │   │
│  │    SUPABASE_URL=...                        │   │
│  │    SUPABASE_SERVICE_ROLE_KEY=...           │   │
│  │    JWT_SECRET=...                          │   │
│  │    PORT=9000                               │   │
│  │    DEFAULT_WORLD_NAME=Life World            │   │
│  │    DEBUG_ENABLED=true                       │   │
│  │    DEBUG_HISTORY_DEPTH=200                  │   │
│  └────────────────────────────────────────────┘   │
│                                                   │
│  Process management: Docker restart policy        │
│  docker run --restart=unless-stopped              │
│                                                   │
└──────────────────────────────────────────────────┘
```

**Dockerfile** (server):
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY shared/ ./shared/
COPY server/ ./server/
RUN cd shared && npm ci && npm run build
RUN cd server && npm ci && npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/server/dist ./dist
COPY --from=build /app/server/node_modules ./node_modules
COPY --from=build /app/shared/dist ./shared-dist
EXPOSE 9000
CMD ["node", "dist/main.js"]
```

**Caddy config** (`/etc/caddy/Caddyfile`):
```
sim.lifegame.example {
    reverse_proxy localhost:9000
}
```

Caddy automatically provisions and renews TLS certificates via Let's Encrypt.

### 6.4 Supabase Project Setup

1. Create project on supabase.com (free tier: 500 MB database, 2 GB bandwidth, 50K monthly active users).
2. Run migrations via Supabase CLI: `supabase db push`.
3. Enable Realtime on tables: `leaderboard_scores`, `daily_mutations`, `event_log`.
4. Configure Auth providers (email/password minimum, optional Google/Discord OAuth).
5. Set environment variables in VPS and GitHub Actions secrets.

### 6.5 Domain and SSL

| Subdomain | Points To | SSL |
|-----------|-----------|-----|
| `lifegame.example` | GitHub Pages CNAME | GitHub-managed |
| `sim.lifegame.example` | VPS IP (A/AAAA record) | Caddy auto-TLS (Let's Encrypt) |

No custom domain needed for Supabase (uses `<project-ref>.supabase.co`).

### 6.6 Monitoring

**Health endpoint** (server exposes HTTP GET `/health` on port 9000):

```typescript
// Response from GET /health
{
  "status": "ok",
  "tick": 1847293,
  "uptime": 86400,
  "connectedClients": 12,
  "entityCount": 6231,
  "tickTimeMs": 3.2,
  "memoryMB": 312,
  "lastSnapshotAge": 142,  // seconds since last Supabase snapshot
  "energyDelta": 0.001     // should be ~0 (conservation check)
}
```

**Docker logs**: `docker logs -f life-game-server` for real-time output.

**Alerting** (simple approach):
- Cron job every 5 minutes: `curl -sf https://sim.lifegame.example/health || alert`
- Alert via email, Discord webhook, or similar.
- Check `tickTimeMs < 10`, `lastSnapshotAge < 600`, `|energyDelta| < 0.1`.

---

## 7. Security Model

### 7.1 Supabase Row-Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE worlds ENABLE ROW LEVEL SECURITY;
ALTER TABLE world_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE world_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE world_access_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE species_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_species ENABLE ROW LEVEL SECURITY;
ALTER TABLE world_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_mutations ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE mutation_history ENABLE ROW LEVEL SECURITY;

-- ═══════════ worlds ═══════════

-- All authenticated users can read worlds (for world picker)
CREATE POLICY "worlds_select_all" ON worlds
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can create worlds
CREATE POLICY "worlds_admin_insert" ON worlds
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND role = 'admin')
  );

-- Only admins can update worlds
CREATE POLICY "worlds_admin_update" ON worlds
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND role = 'admin')
  );

-- Only admins can delete worlds
CREATE POLICY "worlds_admin_delete" ON worlds
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND role = 'admin')
  );

-- ═══════════ world_invites ═══════════

-- Invited player can read their own invites; admins can read all
CREATE POLICY "invites_select_own" ON world_invites
  FOR SELECT USING (
    player_id = auth.uid()
    OR EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND role = 'admin')
  );

-- INSERT/UPDATE/DELETE: server-only via service_role (admin API handles these)

-- ═══════════ world_bans ═══════════

-- Server-only via service_role. Bans are checked server-side on JOIN_WORLD.
-- No client-facing RLS needed.

-- ═══════════ world_access_grants ═══════════

-- Players can read own grants; server writes via service_role
ALTER TABLE world_access_grants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_grants" ON world_access_grants
  FOR SELECT USING (player_id = auth.uid());
-- INSERT/UPDATE/DELETE: server-side only (service_role key)

-- ═══════════ players ═══════════

-- Players can read their own profile
CREATE POLICY "players_select_own" ON players
  FOR SELECT USING (auth.uid() = id);

-- Players can update their own profile (display_name, mutation_time, current_world_id)
CREATE POLICY "players_update_own" ON players
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Profile row created by trigger on auth.users insert (not by client directly)
-- No INSERT policy for clients — server creates via service_role

-- ═══════════ species_designs ═══════════

-- Players can read their own designs (history)
CREATE POLICY "designs_select_own" ON species_designs
  FOR SELECT USING (auth.uid() = player_id);

-- Any authenticated user can read designs for retired/extinct species
-- (Species Directory shows full details including brain wiring)
CREATE POLICY "designs_select_retired" ON species_designs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM active_species
      WHERE active_species.design_id = species_designs.id
        AND active_species.retired_at IS NOT NULL
    )
  );

-- Players can insert their own designs
CREATE POLICY "designs_insert_own" ON species_designs
  FOR INSERT WITH CHECK (auth.uid() = player_id);

-- Players can deactivate their own designs (set is_active = false)
CREATE POLICY "designs_update_own" ON species_designs
  FOR UPDATE USING (auth.uid() = player_id)
  WITH CHECK (auth.uid() = player_id);

-- Players cannot delete designs (historical record)
-- No DELETE policy

-- ═══════════ active_species ═══════════

-- All authenticated users can read active species (for leaderboard context)
CREATE POLICY "active_species_select_all" ON active_species
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only server writes (service_role). No client INSERT/UPDATE/DELETE policies.

-- ═══════════ world_snapshots ═══════════

-- No client access. Server-only via service_role.
-- (No SELECT/INSERT/UPDATE/DELETE policies for authenticated users)

-- ═══════════ leaderboard_scores ═══════════

-- All authenticated users can read leaderboard
CREATE POLICY "leaderboard_select_all" ON leaderboard_scores
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only server writes. No client INSERT/UPDATE/DELETE policies.

-- ═══════════ event_log ═══════════

-- Players can read world-scope events and their own events
CREATE POLICY "events_select_visible" ON event_log
  FOR SELECT USING (
    event_scope = 'world'
    OR player_id = auth.uid()
  );

-- Only server writes. No client INSERT/UPDATE/DELETE policies.

-- ═══════════ daily_mutations ═══════════

-- Players can read their own mutation options
CREATE POLICY "mutations_select_own" ON daily_mutations
  FOR SELECT USING (auth.uid() = player_id);

-- Players can update their own pending mutations (submit selection)
CREATE POLICY "mutations_update_own" ON daily_mutations
  FOR UPDATE USING (
    auth.uid() = player_id
    AND status = 'pending'
  )
  WITH CHECK (
    auth.uid() = player_id
    AND status = 'applied'
    AND selected_option IS NOT NULL
  );

-- Only server inserts. No client INSERT policy.

-- ═══════════ player_summaries ═══════════

-- Players can read their own summaries
CREATE POLICY "summaries_select_own" ON player_summaries
  FOR SELECT USING (auth.uid() = player_id);

-- Only server writes. No client INSERT/UPDATE/DELETE policies.

-- ═══════════ mutation_history ═══════════

-- Players can read their own mutation history
CREATE POLICY "mutation_history_select_own" ON mutation_history
  FOR SELECT USING (auth.uid() = player_id);

-- Only server writes. No client INSERT/UPDATE/DELETE policies.
```

### 7.2 WebSocket JWT Authentication Flow

```
1. Client obtains JWT from Supabase Auth (login/signup via Supabase SDK).
2. Client opens WebSocket to VPS and sends AUTH message with JWT.
3. VPS verifies JWT:
   a. Decode JWT header, extract kid (key ID).
   b. Fetch Supabase JWKS from https://<project>.supabase.co/auth/v1/.well-known/jwks.json
      (cached for 1 hour).
   c. Verify signature using RS256 with the matching public key.
   d. Check exp claim (reject if expired).
   e. Check iss claim matches Supabase project URL.
   f. Extract sub claim as player_id (UUID).
4. On success: map player_id to internal u16 playerId for efficient binary encoding.
5. On failure: send AUTH_FAIL and close connection.

JWT refresh:
- Supabase tokens expire in 1 hour by default.
- Client refreshes tokens via Supabase SDK (uses refresh_token).
- If WS is connected and token expires, client sends a new AUTH message
  with the refreshed token. Server re-verifies without dropping the connection.
```

### 7.3 Server-Side Design Validation

When a player deploys a design (DEPLOY message), the VPS fetches the design from Supabase and validates:

```typescript
function validateDesign(design: OrganismDesign, player: Player): ValidationResult {
  const errors: string[] = [];

  // 1. BP budget check
  const bpUsed = calculateBPCost(design.body, design.traits, design.brain, design.deployment);
  if (bpUsed > 100) {
    errors.push(`BP budget exceeded: ${bpUsed}/100`);
  }

  // 2. Trait unlock checks
  if (design.traits.armorPlating && player.unlockedTier < 2) {
    errors.push('Armor Plating requires Tier 2 unlock');
  }
  if (design.traits.venomGlands && player.unlockedTier < 2) {
    errors.push('Venom Glands requires Tier 2 unlock');
  }
  // ... (all trait unlock checks)

  // 3. Brain node limits
  const latchCount = design.brain.nodes.filter(n => n.activation === 'latch').length;
  if (latchCount > 3) {
    errors.push(`Max 3 Latch nodes allowed, found ${latchCount}`);
  }

  // 4. Brain tier checks (node types match player's unlocked tier)
  // ... (input/output/hidden node tier validation)

  // 5. Value range checks
  if (design.body.sizeRatio < 0.3 || design.body.sizeRatio > 3.0) {
    errors.push('SizeRatio out of range [0.3, 3.0]');
  }
  // ... (all gene range validations)

  // 6. Founder count check
  if (design.deployment.founderCount < 1 || design.deployment.founderCount > 10) {
    errors.push('Founder count must be 1-10');
  }

  // 7. Species name validation
  if (design.speciesName.length < 2 || design.speciesName.length > 24) {
    errors.push('Species name must be 2-24 characters');
  }

  return { valid: errors.length === 0, errors };
}
```

**Unlock Tier Validation** (server-side, on DEPLOY_SPECIES):
1. Read player's `unlocked_tier` from `players` table
2. For each brain node in the design: check nodeTier <= unlocked_tier
3. For each body trait in the design: check traitTier <= unlocked_tier
4. If any check fails: reject deployment with error "Locked feature used: [feature name]"

### 7.4 Rate Limiting

| Resource | Limit | Window | Enforcement |
|----------|-------|--------|-------------|
| WebSocket connections per IP | 3 | Concurrent | VPS (uWebSockets.js) |
| WebSocket connections per player | 1 | Concurrent | VPS (close oldest on new) |
| VIEWPORT messages | 4/sec | Per connection | VPS (drop excess, no ban) |
| DEPLOY messages | 1/min | Per player | VPS (reject with RATE_LIMITED) |
| AUTH attempts | 5/min | Per IP | VPS (temp IP ban 5 min) |
| Supabase design writes | 10/hour | Per player | Supabase (RLS + pg function) |
| Supabase mutation updates | 1/day | Per player | Supabase (RLS check on status) |
| Total WebSocket connections | 35 | Global | VPS (reject with SERVER_FULL) |
| Admin API requests | 30/min | Per admin | VPS (429 Too Many Requests) |

### 7.5 Admin Authorization

Admin access is controlled by the `role` column on the `players` table. Only players with `role = 'admin'` can access admin endpoints and features.

```
Admin authorization flow:

1. Admin logs in normally via Supabase Auth (same as any player).
2. JWT contains standard Supabase claims (sub, exp, iss). No custom role claim.
3. On admin API requests, server:
   a. Verifies JWT signature and expiry (same as WebSocket auth).
   b. Queries players table: SELECT role FROM players WHERE id = <jwt.sub>.
   c. If role != 'admin' → 403 Forbidden.
   d. Result is cached in-memory for 5 minutes (invalidated on role change).

4. On WebSocket connect, server also caches isAdmin on the ClientSession
   (used for sending WORLD_LIST with admin-only info).

Admin assignment:
- First admin is set manually via Supabase dashboard SQL:
  UPDATE players SET role = 'admin' WHERE id = '<your-uuid>';
- Admins can promote/demote other players via admin API:
  POST /api/admin/players/:playerId/role  { role: 'admin' | 'player' }
  See back-end.md §10.3 for endpoint specification.
```

### 7.6 World Access Control

Each world has an `access_type` that determines who can join:

```
Access validation on JOIN_WORLD:

function validateJoinWorld(session, worldId, password?):
  world = WorldManager.getRoom(worldId)
  if (!world) → JOIN_FAIL(NOT_FOUND)
  if (world.status !== 'running') → JOIN_FAIL(PAUSED_OR_STOPPED)
  if (world.clients.size >= world.config.maxPlayers) → JOIN_FAIL(FULL)

  // Check ban (query world_bans table, cached per world)
  if (isBanned(worldId, session.playerId)) → JOIN_FAIL(BANNED)

  // Check existing access grant (covers prior password entry AND admin invites)
  if (hasAccessGrant(worldId, session.playerId)) → JOIN_OK

  // Access type check (only reached if no prior grant)
  switch (world.config.accessType):
    case 'public':
      → pass (no additional check)

    case 'password':
      if (!password || !bcrypt.compare(password, world.config.passwordHash))
        → JOIN_FAIL(WRONG_PASSWORD)
      // Password correct — create persistent access grant
      INSERT INTO world_access_grants (world_id, player_id, granted_by)
        VALUES (worldId, session.playerId, NULL)
        ON CONFLICT DO NOTHING;

    case 'invite':
      if (!hasAcceptedInvite(worldId, session.playerId))
        → JOIN_FAIL(NOT_INVITED)
      // Admins bypass invite requirement

  → JOIN_OK
```

| Access Type | Icon | Join Behavior |
|-------------|------|---------------|
| `public` | (none) | Anyone can join freely |
| `password` | Lock icon | Prompt for password on first join; subsequent joins use stored access grant |
| `invite` | Envelope icon | Only invited players can join (admins bypass). Admin invites also create access grants for password worlds |

### 7.7 Account Management

**Signup**: Supabase Auth `signUp({ email, password, options: { data: { display_name } } })`. The existing `handle_new_user()` trigger (§9) auto-creates the player row using `display_name` from metadata. No email verification required before play (v1) — players can start immediately. Supabase sends a verification email in the background; unverified accounts work normally but can't use password reset.

**Email Verification**: Handled by Supabase Auth's built-in email confirmation flow. Not blocking — players can play with unverified email. Client shows a dismissible banner "Verify your email to enable password reset" on DashboardScreen if `user.email_confirmed_at` is null. Verification link in email calls Supabase's `/auth/v1/verify` endpoint (built-in).

**OAuth (Google)**: Configured in Supabase dashboard. Client calls `supabase.auth.signInWithOAuth({ provider: 'google' })`. Supabase handles redirect flow. On return, `handle_new_user()` trigger creates player row. If OAuth email matches existing email/password account, Supabase auto-links them (configurable in dashboard).

**Password Change**: Authenticated user calls `supabase.auth.updateUser({ password: newPassword })`. Requires current session (already logged in). Client presents a modal in Profile Settings: current password field (for verification UX, not required by Supabase API), new password, confirm password.

**Password Reset (Forgot Password)**: `supabase.auth.resetPasswordForEmail(email)` sends a reset link. Player clicks link → redirected to app with recovery token → app shows "Set New Password" form → `supabase.auth.updateUser({ password })`. Only works for verified emails.

**Account Deletion**: Player triggers from Profile Settings. Flow:
1. Confirmation modal with text input: type "DELETE" to confirm.
2. Client calls Supabase Edge Function `delete-own-account` (RPC) which:
   - Verifies caller is the authenticated user
   - Calls `auth.admin.deleteUser(userId)` with service_role key
   - CASCADE: `players` row deleted (ON DELETE CASCADE), which cascades to `species_designs`, `active_species`, `world_access_grants`, etc.
3. Client clears session and redirects to `/login`.
Note: Cannot use client-side SDK to delete auth user — requires service_role key, hence the Edge Function.

**Admin Promotion**: Only existing admins can promote/demote other players. First admin still set via manual SQL. See back-end.md §10.3 for the admin promotion endpoint specification.

---

## 8. Failure Modes & Recovery

### 8.1 VPS Crash / Restart

```
Scenario: VPS process crashes or server reboots.
Data at risk: In-memory simulation state (positions, brain states, pheromones).
Recovery:

1. Docker restart policy ("unless-stopped") auto-restarts the container.
2. On startup, WorldManager loads all worlds with status = 'running' from
   the worlds table in Supabase.
3. For each world, loads most recent world_snapshot:
     SELECT * FROM world_snapshots
     WHERE world_id = <world.id>
     ORDER BY tick DESC
     LIMIT 1;
4. Deserialize snapshot → restore all organisms, pellets, pheromone grid,
   species metadata, mutation pools per world room.
5. Resume simulation from the snapshot tick for each world.
6. If no worlds exist in the database, create a default world.
7. Maximum data loss: up to 5 minutes per world (snapshot interval).

Mitigation: Snapshots every 5 minutes per world. Critical events (extinction,
deployment) trigger an immediate snapshot.
```

### 8.2 WebSocket Disconnect

```
Scenario: Client loses connection (network change, sleep, server restart).
Impact: Player cannot see live world updates.
Recovery:

1. Client detects disconnect (WebSocket onclose/onerror).
2. Exponential backoff reconnection (see Section 4.1).
3. On reconnect: re-AUTH, re-JOIN_WORLD (same world), re-VIEWPORT, receive FULL_STATE.
4. If server was restarting, clients wait up to 30 seconds.
5. After 5 minutes of failed reconnects: show offline UI,
   switch to Supabase-only mode (can still browse history,
   leaderboard, mutation selections).

Player experience: "Connection lost. Reconnecting..." banner.
Simulation continues server-side regardless of client state.
```

### 8.3 Supabase Outage

```
Scenario: Supabase is unreachable from VPS or client.
Impact on VPS:
  - Cannot write snapshots, leaderboard, events.
  - Cannot read new designs or mutation selections.
  - Simulation CONTINUES running in-memory (no data loss for sim state).

Recovery:
  1. VPS queues all pending Supabase writes in-memory (bounded buffer, 1000 items max).
  2. VPS retries Supabase connection every 30 seconds.
  3. On reconnect: flush write queue in order, write a fresh snapshot.
  4. If queue fills: drop oldest events (low priority), keep snapshots (high priority).

Impact on Client:
  - Cannot log in (Auth unavailable) — show "maintenance" screen.
  - Already-connected WebSocket clients continue receiving live data from VPS.
  - Leaderboard/history/mutations unavailable until Supabase recovers.
  - Realtime subscriptions auto-reconnect when Supabase returns.

Mitigation: Supabase free tier has 99.9% uptime SLA. Outages are rare and
typically < 5 minutes.
```

### 8.4 Data Corruption / Energy Conservation Violation

```
Scenario: Bug causes total energy to drift from the conserved constant.
Detection:

Every `SIM_TPS * 15` ticks (~15 seconds wall-clock), the server runs an energy audit:
  computedTotal = freeBiomass
                + sum(pellet.energy for all pellets)
                + sum(organism.energy + organism.bodyEnergy + organism.fatStored
                      + organism.eggEnergy for all organisms)
  expectedTotal = world.totalEnergy (set at world creation)
  delta = abs(computedTotal - expectedTotal)

If delta > 0.1% of expectedTotal:
  1. Log WARNING with full breakdown of energy by category.
  2. Report in /health endpoint (energyDelta field).
  3. If delta > 1%: apply correction by adjusting freeBiomass to compensate.
     Log ERROR with stack trace for debugging.
  4. If delta > 5%: CRITICAL — trigger immediate snapshot, alert admin.
     Consider pausing simulation for manual inspection.

Prevention:
  - Every energy transfer operation must be balanced (subtract from source,
    add to destination, verify sum).
  - Unit tests for every energy pathway.
  - Metabolism/movement costs always return energy to freeBiomass.
```

---

## 9. Database Schema

```sql
-- ═══════════════════════════════════════════════════════════
-- Table: worlds
-- Multi-world rooms managed by WorldManager. Each world is
-- an independent simulation with its own game loop, entities,
-- and access control.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE worlds (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL UNIQUE CHECK (char_length(name) BETWEEN 2 AND 48),
  created_by      UUID NOT NULL REFERENCES players(id),
  status          TEXT NOT NULL DEFAULT 'stopped' CHECK (status IN ('running', 'paused', 'stopped')),
  access_type     TEXT NOT NULL DEFAULT 'public' CHECK (access_type IN ('public', 'password', 'invite')),
  password_hash   TEXT,                           -- bcrypt, NULL unless access_type = 'password'
  max_players     INTEGER NOT NULL DEFAULT 30 CHECK (max_players BETWEEN 1 AND 100),
  world_size      INTEGER NOT NULL DEFAULT 500 CHECK (world_size BETWEEN 100 AND 2000),
  sim_tps         INTEGER NOT NULL DEFAULT 40 CHECK (sim_tps BETWEEN 10 AND 200),
  description     TEXT NOT NULL DEFAULT '' CHECK (char_length(description) <= 500),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  entropy_half_life INTEGER NOT NULL DEFAULT 72,
                                      -- Hours. Admin-configurable per world. Range: 24-168.
                                      -- Controls species entropy escalation rate.
);

CREATE INDEX idx_worlds_status ON worlds (status);

CREATE TRIGGER worlds_updated_at
  BEFORE UPDATE ON worlds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ═══════════════════════════════════════════════════════════
-- Table: world_invites
-- Invite-only world access. Invited players can join.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE world_invites (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id        UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  player_id       UUID NOT NULL REFERENCES players(id),
  invited_by      UUID NOT NULL REFERENCES players(id),
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(world_id, player_id)
);

CREATE INDEX idx_world_invites_world ON world_invites (world_id, status);
CREATE INDEX idx_world_invites_player ON world_invites (player_id, status);


-- ═══════════════════════════════════════════════════════════
-- Table: world_bans
-- Per-world player bans with optional expiration.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE world_bans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id        UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  player_id       UUID NOT NULL REFERENCES players(id),
  banned_by       UUID NOT NULL REFERENCES players(id),
  reason          TEXT DEFAULT '',
  expires_at      TIMESTAMPTZ,                    -- NULL = permanent
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(world_id, player_id)
);

CREATE INDEX idx_world_bans_world ON world_bans (world_id);
CREATE INDEX idx_world_bans_player ON world_bans (player_id);

-- ═══════════════════════════════════════════════════════════
-- Table: world_access_grants
-- Persistent access grants for worlds. Once granted (via
-- correct password entry or admin invite), a player can
-- rejoin without re-entering the password. Revoked on ban.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE world_access_grants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id        UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  granted_by      UUID REFERENCES players(id),
    -- NULL = self-granted via correct password entry
    -- UUID = admin who invited/granted access
  granted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(world_id, player_id)
);

CREATE INDEX idx_world_access_grants_world ON world_access_grants (world_id);
CREATE INDEX idx_world_access_grants_player ON world_access_grants (player_id);

-- ═══════════════════════════════════════════════════════════
-- Table: players
-- Core player account data. Created by trigger on auth signup.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE players (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT NOT NULL DEFAULT 'Player'
                  CHECK (char_length(display_name) BETWEEN 2 AND 24),
  role          TEXT NOT NULL DEFAULT 'player'
                  CHECK (role IN ('player', 'admin')),
  evolution_points INTEGER NOT NULL DEFAULT 0
                  CHECK (evolution_points >= 0),
  unlocked_tier INTEGER NOT NULL DEFAULT 1
                  CHECK (unlocked_tier BETWEEN 1 AND 4),
  achievements  JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Array of { id: string, unlockedAt: string }
  mutation_time TIME NOT NULL DEFAULT '12:00:00',
    -- Player's chosen daily mutation time (UTC)
  total_generations INTEGER NOT NULL DEFAULT 0,
  total_deployments INTEGER NOT NULL DEFAULT 0,
  total_kills   INTEGER NOT NULL DEFAULT 0,
  current_world_id UUID REFERENCES worlds(id) ON DELETE SET NULL,
    -- The world the player is currently active in. NULL if not in any world.
    -- Updated by client on world switch. Persists across sessions.
  onboarding_state JSONB NOT NULL DEFAULT '{"quickStartCompleted":false,"quickStartStep":0,"introductions":{},"tierUnlocksSeen":[]}'::jsonb,
    -- Tracks onboarding progress: quick start wizard, system introductions (17 contextual cards),
    -- and tier unlock education modals. See design/onboarding.md §7 for full specification.
    -- Client syncs from localStorage on login with "keep most progress" merge strategy.
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_players_display_name ON players (display_name);
CREATE INDEX idx_players_current_world ON players (current_world_id)
  WHERE current_world_id IS NOT NULL;

-- Auto-create player row on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.players (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', 'Player'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ═══════════════════════════════════════════════════════════
-- Edge Function: delete-own-account
-- Called by authenticated user to delete their own account.
-- Requires service_role key to call auth.admin.deleteUser().
-- Deployed as Supabase Edge Function (Deno), NOT a pg function.
--
-- POST /functions/v1/delete-own-account
-- Authorization: Bearer <user_jwt>
-- Body: { "confirm": "DELETE" }
--
-- 1. Verify JWT, extract user_id
-- 2. Verify body.confirm === "DELETE"
-- 3. Call supabaseAdmin.auth.admin.deleteUser(user_id)
-- 4. Return 200 OK
-- CASCADE handles all data cleanup (players, designs, species, grants, etc.)
-- ═══════════════════════════════════════════════════════════

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ═══════════════════════════════════════════════════════════
-- Table: species_designs
-- Player-created organism blueprints. Immutable once deployed
-- (new version created for changes).
-- ═══════════════════════════════════════════════════════════

CREATE TABLE species_designs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id     UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  species_name  TEXT NOT NULL
                  CHECK (char_length(species_name) BETWEEN 2 AND 24),
  body          JSONB NOT NULL,
    -- BodyGenes: { sizeRatio, speedRatio, strength, defense, diet,
    --              viewAngle, viewRadius, metabolism, stomachMultiplier,
    --              redColor, greenColor, blueColor }
  reproduction_mode TEXT NOT NULL DEFAULT 'asexual'
                  CHECK (reproduction_mode IN ('asexual', 'sexual')),
  founder_sex_ratio NUMERIC(3,2) NOT NULL DEFAULT 0.50
                  CHECK (founder_sex_ratio BETWEEN 0.10 AND 0.90),
    -- Sex ratio for sexual species (0.50 = 50/50 female/male). Ignored for asexual.
  traits        JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- TraitConfig: { armorPlating?: {tier, direction}, venomGlands?: bool,
    --               sexualReproduction?: bool, encounterInfoSharing?: bool, ... }
  brain         JSONB NOT NULL,
    -- BrainConfig: { nodes: BrainNode[], synapses: Synapse[] }
  deployment    JSONB NOT NULL DEFAULT '{"biome":"random","founderCount":1,"biomeBPCost":0}'::jsonb,
    -- DeploymentConfig: { biome, founderCount, biomeBPCost }
  bp_total      INTEGER NOT NULL
                  CHECK (bp_total BETWEEN 1 AND 100),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  version       INTEGER NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_designs_player_id ON species_designs (player_id);
CREATE INDEX idx_designs_player_active ON species_designs (player_id, is_active)
  WHERE is_active = true;
CREATE INDEX idx_designs_created_at ON species_designs (created_at DESC);


-- ═══════════════════════════════════════════════════════════
-- Table: active_species
-- Currently live species in the simulation. One per player
-- (plus AI species).
-- ═══════════════════════════════════════════════════════════

CREATE TABLE active_species (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id         UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  design_id        UUID REFERENCES species_designs(id) ON DELETE SET NULL,
  player_id        UUID REFERENCES players(id) ON DELETE CASCADE,
    -- NULL for AI species
  is_ai            BOOLEAN NOT NULL DEFAULT false,
  deployed_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  retired_at       TIMESTAMPTZ,
  end_reason       TEXT CHECK (end_reason IN ('extinct', 'retired')),
    -- Set when retired_at is set. NULL while species is active.
  population_count INTEGER NOT NULL DEFAULT 0,
  generation_max   INTEGER NOT NULL DEFAULT 0,
  dominance_score  REAL NOT NULL DEFAULT 0.0,
  entropy_multiplier REAL NOT NULL DEFAULT 1.0,
  template_genes   JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Current species template genes (updated when mutations applied)
  species_name     TEXT NOT NULL DEFAULT 'Unknown',

  -- Peak stats (updated periodically by server, high-water marks)
  peak_population  INTEGER NOT NULL DEFAULT 0,
  peak_dominance   REAL NOT NULL DEFAULT 0.0,
  peak_dominance_rank INTEGER,
    -- Best leaderboard rank achieved (1 = #1)
  peak_territory   REAL NOT NULL DEFAULT 0.0,
    -- Max fraction of spatial hash cells occupied
  peak_biomass     REAL NOT NULL DEFAULT 0.0,
    -- Max fraction of total ecosystem biomass

  -- Lifetime totals (accumulated by server)
  lifetime_stats   JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- { totalBorn, totalDeaths, killsDealt, killsReceived,
    --   energyConsumed, mutationsApplied, wintersSurvived,
    --   biomesOccupied, deathBreakdown: { starvation, predation,
    --   ageing, venom, environmental } }

  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_active_species_player ON active_species (player_id)
  WHERE retired_at IS NULL;
CREATE INDEX idx_active_species_live ON active_species (retired_at)
  WHERE retired_at IS NULL;
CREATE INDEX idx_active_species_dominance ON active_species (dominance_score DESC)
  WHERE retired_at IS NULL;
CREATE INDEX idx_active_species_world ON active_species (world_id);

CREATE TRIGGER active_species_updated_at
  BEFORE UPDATE ON active_species
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ═══════════════════════════════════════════════════════════
-- Table: world_snapshots
-- Periodic full world state snapshots for crash recovery.
-- Stored as JSONB. Old snapshots pruned by scheduled job.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE world_snapshots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id    UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  tick        BIGINT NOT NULL,
  snapshot    JSONB NOT NULL,
    -- WorldSnapshot.snapshot (see Section 4.3 for full schema)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_snapshots_world_tick ON world_snapshots (world_id, tick DESC);

-- Keep only the last 3 snapshots per world (~15 minutes at 5-min intervals).
-- Sufficient for recovery while keeping storage manageable across N worlds.
-- Run via pg_cron or Supabase scheduled function, per world:
-- DELETE FROM world_snapshots
-- WHERE world_id = $1
-- AND id NOT IN (
--   SELECT id FROM world_snapshots
--   WHERE world_id = $1
--   ORDER BY created_at DESC
--   LIMIT 3
-- );


-- ═══════════════════════════════════════════════════════════
-- Table: leaderboard_scores
-- Current leaderboard state. Upserted by server every 15 sec.
-- One row per active species.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE leaderboard_scores (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id          UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  species_id        UUID NOT NULL REFERENCES active_species(id) ON DELETE CASCADE,
  player_id         UUID REFERENCES players(id) ON DELETE CASCADE,
  species_name      TEXT NOT NULL,
  is_ai             BOOLEAN NOT NULL DEFAULT false,
  dominance_score   REAL NOT NULL DEFAULT 0.0,
    -- Composite score: weighted sum of below metrics
  biomass_share     REAL NOT NULL DEFAULT 0.0,
    -- Fraction of total organism energy held by this species
  population_share  REAL NOT NULL DEFAULT 0.0,
    -- Fraction of total organism count
  territory_coverage REAL NOT NULL DEFAULT 0.0,
    -- Fraction of spatial hash cells occupied
  lineage_depth     INTEGER NOT NULL DEFAULT 0,
    -- Max generation reached
  keystone_bonus    REAL NOT NULL DEFAULT 0.0,
    -- Bonus for filling unique ecological niche
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_species_leaderboard UNIQUE (species_id)
);

CREATE INDEX idx_leaderboard_dominance ON leaderboard_scores (dominance_score DESC);
CREATE INDEX idx_leaderboard_player ON leaderboard_scores (player_id);
CREATE INDEX idx_leaderboard_world ON leaderboard_scores (world_id);

CREATE TRIGGER leaderboard_updated_at
  BEFORE UPDATE ON leaderboard_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ═══════════════════════════════════════════════════════════
-- Table: event_log
-- World and player events for history/timeline view.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE event_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id    UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL,
    -- 'species_deployed', 'species_extinct', 'season_change',
    -- 'population_milestone', 'mutation_applied', 'world_record',
    -- 'predation_event', 'mass_extinction', etc.
  event_scope TEXT NOT NULL DEFAULT 'world'
    CHECK (event_scope IN ('world', 'player', 'species')),
  player_id   UUID REFERENCES players(id) ON DELETE SET NULL,
  species_id  UUID REFERENCES active_species(id) ON DELETE SET NULL,
  payload     JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Event-specific data (flexible schema)
  tick        BIGINT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_scope ON event_log (event_scope, created_at DESC);
CREATE INDEX idx_events_player ON event_log (player_id, created_at DESC)
  WHERE player_id IS NOT NULL;
CREATE INDEX idx_events_species ON event_log (species_id, created_at DESC)
  WHERE species_id IS NOT NULL;
CREATE INDEX idx_events_type ON event_log (event_type, created_at DESC);
CREATE INDEX idx_events_created_at ON event_log (created_at DESC);
CREATE INDEX idx_event_log_world ON event_log (world_id);

-- Prune events older than 30 days (keep world-scope longer)
-- Scheduled via pg_cron:
-- DELETE FROM event_log WHERE created_at < now() - interval '30 days'
--   AND event_scope != 'world';
-- DELETE FROM event_log WHERE created_at < now() - interval '90 days';


-- ═══════════════════════════════════════════════════════════
-- Table: daily_mutations
-- Server-generated mutation options and player selections.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE daily_mutations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id        UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  species_id      UUID NOT NULL REFERENCES active_species(id) ON DELETE CASCADE,
  options         JSONB NOT NULL,
    -- Array of 3 MutationOption objects:
    -- [{
    --   category: 'body' | 'brain' | 'convergent',
    --   geneId: string,
    --   oldValue: number,
    --   newValue: number,
    --   changePercent: number,
    --   fitnessScore: number,
    --   description: string,       -- human-readable
    --   frequency: number,          -- how many times seen
    --   sourceGeneration: number
    -- }]
  selected_option INTEGER CHECK (selected_option BETWEEN 0 AND 2),
    -- NULL if not yet selected; 0, 1, or 2 index into options array
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'applied', 'expired', 'skipped')),
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mutations_player_pending ON daily_mutations (player_id, status)
  WHERE status = 'pending';
CREATE INDEX idx_mutations_player_date ON daily_mutations (player_id, created_at DESC);
CREATE INDEX idx_mutations_expires ON daily_mutations (expires_at)
  WHERE status = 'pending';


-- ═══════════════════════════════════════════════════════════
-- Table: player_summaries
-- Periodic summaries for the "return after absence" flow.
-- Generated by server every hour per player with active species.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE player_summaries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id      UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  player_id     UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  summary       JSONB NOT NULL,
    -- {
    --   hoursElapsed: number,
    --   generationsElapsed: number,
    --   peakPopulation: number,
    --   currentPopulation: number,
    --   extinctionEvents: number,
    --   topMutations: Array<{ geneId, change, impact }>,
    --   dominanceChange: number,
    --   notableEvents: Array<{ type, description, tick }>,
    --   seasonTransitions: number,
    --   totalEnergyHarvested: number,
    --   totalOffspringProduced: number
    -- }
  period_start  TIMESTAMPTZ NOT NULL,
  period_end    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_summaries_player_date ON player_summaries (player_id, period_end DESC);

-- Keep only the 7 most recent summaries per player
-- Scheduled cleanup:
-- DELETE FROM player_summaries
-- WHERE id NOT IN (
--   SELECT id FROM (
--     SELECT id, ROW_NUMBER() OVER (PARTITION BY player_id ORDER BY period_end DESC) rn
--     FROM player_summaries
--   ) t WHERE rn <= 7
-- );


-- ═══════════════════════════════════════════════════════════
-- Table: mutation_history
-- Record of all mutations applied to species templates via
-- daily selection. For analytics and mutation pool viewer.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE mutation_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  species_id      UUID NOT NULL REFERENCES active_species(id) ON DELETE CASCADE,
  mutation_type   TEXT NOT NULL
    CHECK (mutation_type IN ('body', 'brain', 'convergent')),
  gene_id         TEXT NOT NULL,
    -- e.g., 'sizeRatio', 'synapse_3_weight', 'node_h1_bias'
  old_value       REAL NOT NULL,
  new_value       REAL NOT NULL,
  fitness_score   REAL NOT NULL DEFAULT 0.0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mut_history_player ON mutation_history (player_id, created_at DESC);
CREATE INDEX idx_mut_history_species ON mutation_history (species_id, created_at DESC);
CREATE INDEX idx_mut_history_gene ON mutation_history (gene_id, created_at DESC);
```

---

## 10. Performance Budget

| Metric | Budget | Rationale |
|--------|--------|-----------|
| **Tick time** | < 10 ms (target ~3 ms) | At 40 TPS (default), each tick has a 25 ms window. 10 ms leaves 60% headroom for WebSocket I/O, GC pauses, and snapshot writes. Target ~3 ms based on ~100K operations across ~6,400 entities on ARM cores. |
| **Entity count** | ~6,400 total (~900 organisms + ~5,500 pellets) | 30 species x ~30 organisms = ~900 organisms. Plant/meat pellets fill remainder. Spatial hash (625 cells) keeps per-entity query cost O(nearby) not O(total). |
| **Bandwidth per client** | < 12 KB/s (target ~10 KB/s) | Mobile-friendly. Viewport culling reduces ~6,400 entities to ~80 visible. Delta compression sends only changes. Binary encoding: 28B/organism, 12B/pellet, 14B/egg, 12B/fungus, 16B/spore. ~45 updates/broadcast × 20 Hz = ~10 KB/s. Broadcast rate (20 Hz) is independent of SIM_TPS. |
| **Total server bandwidth** | < 360 KB/s (30 clients x 12 KB/s) | Well within VPS limits (Hetzner CX33: 20 TB/mo). |
| **Snapshot size** | < 1 MB (JSONB, uncompressed) | ~900 organisms x ~500 B each + ~5,500 pellets x ~50 B each + pheromone grid + metadata. Compresses to ~200-400 KB in transit. |
| **Supabase writes** | < 100/min | Leaderboard UPSERT (30 rows/15s = 120/min worst case). Events (~10/min). Snapshots (1/5min). Well within free tier. |
| **Client render FPS** | 60 fps | Entity interpolation between 20 Hz server broadcasts (from 40 TPS simulation). Canvas/WebGL renders at requestAnimationFrame rate. ~80 entities in viewport is trivial for modern mobile GPUs. |
| **Multi-world overhead** | N × ~3 ms tick = N × 12% CPU at 40 TPS | Each WorldRoom runs its own independent game loop. Worlds are sequential within the event loop but each tick is lightweight. 3-4 worlds fit comfortably on a single VPS. |
| **WebSocket connections** | 30 per world (hard cap: 35 per world) | Per-world player cap. uWebSockets.js handles thousands easily; limit is design choice not server capacity. |
| **Server memory** | N × ~5 MB per world + ~200 MB base | Per world: ~6,400 entities x ~500 B = ~3.2 MB entity data + spatial hash ~50 KB + pheromone grid ~30 KB + brain buffers ~1 MB + mutation pool ~10 MB ≈ ~15 MB. Node.js overhead ~100-200 MB shared. Hetzner CX33 has 8 GB. |
| **Snapshot write time** | < 500 ms | Serialize ~1 MB JSON + single Supabase INSERT. Non-blocking async I/O. Does not block tick loop. |
| **Client initial load** | < 500 KB (gzipped) | React SPA with Canvas renderer. No heavy 3D libraries. Vite tree-shaking + code splitting. Target < 200 KB JS + ~100 KB assets. |
| **Time to first render** | < 2 seconds | Auth check (cached) + WebSocket connect + first FULL_STATE. Dominated by network latency, not computation. |
| **Design validation** | < 5 ms | Simple arithmetic checks on BP budget and gene ranges. Runs on both client (instant feedback) and server (authoritative). |
| **Simulation tick rate** | 40 TPS constant (configurable via `SIM_TPS`) | Constant rate regardless of connected clients. Produces ~800-2,000 generations per real day. Broadcast at 20 Hz (decoupled from tick loop). No acceleration mode — evolution rate is predictable and never stalls when players view. |
| **Debug instrumentation** | ~0.1 ms/tick overhead | `DebugCollector` wraps each of the 12 pipeline systems with `performance.now()` timing. Ring buffer recording is zero-alloc. Always on (admin gating controls read access, not collection). See [`debug.md`](./debug.md) §G.1. |
| **Debug WS bandwidth** | ~18 KB/s worst case | All 7 debug streams active with 1 traced entity. Max 3 debug subscribers per world. Negligible vs entity broadcast bandwidth. See [`debug.md`](./debug.md) §D.4. |

---

## 11. Debug & QA Tooling

The debug and QA tooling system is documented in a dedicated design document: [`debug.md`](./debug.md).

Key architectural integration points:

- **Server**: `DebugCollector` initializes after `WorldManager` in the startup sequence. Wraps each of the 12 simulation pipeline systems with `profileAndRun()` for timing. Supersedes the simpler `TickProfiler` (see `back-end.md` §2.4). `DebugRouter` registers alongside `AdminRouter` for REST endpoints under `/api/debug/*`.
- **WebSocket**: Debug messages use the `0xD0-0xDF` range (see §4 MessageType enum above). Admin-gated — non-admin debug messages are silently dropped. Max 3 debug subscribers per world. Debug broadcast loop runs alongside the existing 20 Hz entity broadcast.
- **Client**: `debugStore.ts` (lazy-loaded, admin only) manages panel state, WS subscriptions, cached stream data, and overlay toggles. `<DebugOverlay />` renders as a conditional child of `<AppShell>`. Seven Pixi.js debug layers (15-20) insert below the UIOverlayLayer.
- **Production monitoring**: Admin dashboard gains a health indicator bar (TPS, tick time, drift, memory) with green/yellow/red alert thresholds. `AdminWorldDetailScreen` → `DevToolsTab` gains a "Debug Console" button for the full debug panel.
- **Testing**: Deterministic replay via seeded PRNG, automated balance scenarios, energy conservation validator, brain regression tests. All accessible via REST endpoints under `/api/debug/test/`.
