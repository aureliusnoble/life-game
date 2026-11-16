# Phase 2: Server — Core Simulation Data Structures

**Goal**: Implement the foundational server-side data structures and utility systems that all simulation systems depend on: math utilities, spatial hashing, the energy system, and the organism/pellet entity representations.

**Estimated Steps**: 6

> **Before you start this phase**, read the general guidance in [`README.md`](./README.md).

### Phase 2 Guidance

**Read these design docs first:**
- `core-gameplay-systems.md` Sections 1-2 (Body Stats, Size/Speed/Strength/Defense formulas)
- `components/game-components.md` Sections 2-5 (SpatialHashGrid, EnergySystem, Entity interfaces)
- `architecture.md` Section 10 (Performance Budget) — the spatial hash and energy system are hot-path code

**Prerequisites:**
- Phase 1 must be complete and passing all tests. The shared types and constants from `packages/shared` are imported here.

**No manager action needed for this phase.** This is pure server-side simulation code with no infrastructure dependencies. All work is local.

**QA handoff for this phase:**
When done, tell the manager: "Run `pnpm --filter server test` — all unit tests for math utilities, spatial hash, energy system, and entity factories should pass. Key things to verify: spatial hash query returns correct neighbors, energy system maintains conservation invariant (total energy constant across transfers), and RingBuffer evicts oldest entries at capacity."

---

## Step 2.1: Math Utilities & Deterministic PRNG

### What You're Implementing
Vector math (Vec2), toroidal distance/wrapping functions, angle utilities, and a seeded deterministic PRNG (xorshift32) for reproducible simulation.

### Design References
- `core-gameplay-systems.md` §2.1 (World is 500x500 with toroidal wrapping)
- `components/back-end.md` §1 (Vec2 usage throughout physics, spatial hash)
- `debug.md` §F.1 (DeterministicRng — xorshift32 implementation, ReplayRecorder interface)
- `architecture.md` §10 (World size 500x500, toroidal wrapping)

### Implementation Details

Create `packages/server/src/math/`:

**`vec2.ts`**:
```typescript
export interface Vec2 { x: number; y: number; }
export function add(a: Vec2, b: Vec2): Vec2;
export function sub(a: Vec2, b: Vec2): Vec2;
export function scale(v: Vec2, s: number): Vec2;
export function length(v: Vec2): number;
export function normalize(v: Vec2): Vec2;
export function dot(a: Vec2, b: Vec2): number;
export function rotate(v: Vec2, angle: number): Vec2;
export function angleBetween(a: Vec2, b: Vec2): number;
export function toroidalDist(a: Vec2, b: Vec2, worldSize: number): number;
export function toroidalDelta(from: Vec2, to: Vec2, worldSize: number): Vec2;
export function wrapPosition(pos: Vec2, worldSize: number): Vec2;
```

**`rng.ts`**:
```typescript
// xorshift32 — fast, deterministic, good distribution
export class DeterministicRng {
  private state: number;
  constructor(seed: number);
  next(): number;           // [0, 1)
  nextInt(min: number, max: number): number;
  nextFloat(min: number, max: number): number;
  nextGaussian(mean: number, stddev: number): number;
  getState(): number;       // For replay serialization
  setState(state: number): void;
}
```

**`angle.ts`**:
```typescript
export function normalizeAngle(a: number): number;   // [0, 2π)
export function angleDiff(a: number, b: number): number;  // Shortest signed diff
export function isInArc(angle: number, center: number, halfWidth: number): boolean;
export function degToRad(deg: number): number;
export function radToDeg(rad: number): number;
```

### Unit Tests
- `toroidalDist((0, 0), (499, 0), 500)` = 1 (wrapping)
- `toroidalDist((250, 250), (250, 250), 500)` = 0
- `wrapPosition((-1, 501), 500)` = `(499, 1)`
- PRNG: same seed produces same sequence across 10,000 calls
- PRNG: different seeds produce different sequences
- `nextGaussian` mean/stddev converge over 100,000 samples (within 1% error)
- `angleDiff(350°, 10°)` = +20° (not -340°)
- `isInArc` correctly handles angles crossing 0°/360° boundary

### QA Checklist
- [ ] All vec2 operations handle zero vectors gracefully
- [ ] Toroidal wrapping works at all four world edges and corners
- [ ] PRNG state can be saved and restored for deterministic replay
- [ ] No floating-point precision issues in distance calculations at world boundaries

---

## Step 2.2: Ring Buffer Utility

### What You're Implementing
A fixed-size ring buffer data structure used throughout the simulation for debug data collection, mutation history, and various caches. Zero-allocation after initialization.

### Design References
- `debug.md` §A.2 (DebugCollector uses ring buffers for all debug data — tickProfiles, energySnapshots, etc.)
- `debug.md` §A.2 (Memory budget: ring buffers are pre-allocated, zero-alloc during hot path)
- `components/back-end.md` §8 (MutationRecord rolling window of 2000 entries)

### Implementation Details

Create `packages/server/src/utils/ring-buffer.ts`:

```typescript
export class RingBuffer<T> {
  private buffer: (T | null)[];
  private head: number = 0;
  private _size: number = 0;

  constructor(capacity: number);
  push(item: T): void;          // O(1), overwrites oldest if full
  get(index: number): T | null; // 0 = oldest, size-1 = newest
  latest(): T | null;           // Most recent item
  toArray(): T[];               // All items in order (oldest → newest)
  get size(): number;
  get capacity(): number;
  clear(): void;
}
```

### Unit Tests
- Push N items, verify FIFO order
- Push more than capacity, verify oldest items overwritten
- `latest()` always returns most recently pushed item
- `toArray()` returns items in insertion order
- `clear()` resets size to 0
- Zero-capacity buffer doesn't crash

### QA Checklist
- [ ] No heap allocation during `push()` (reuses pre-allocated slots)
- [ ] Thread-safe for single-writer (our use case)

---

## Step 2.3: Spatial Hash Grid

### What You're Implementing
The spatial hash grid for efficient entity lookups. Divides the 500x500 world into cells. Supports toroidal wrapping at world edges. Used by nearly every simulation system for proximity queries.

### Design References
- `components/back-end.md` §2 (SpatialHashGrid — full public interface, algorithm details, cell sizing)
- `core-gameplay-systems.md` §2 (World grid: 500x500, toroidal wrapping)
- `architecture.md` §10 (Entity count ~6,400, spatial hash 625 cells for 20x20 resolution, or 2500 cells for 50x50)
- `debug.md` §A.2 (SpatialStats — cell occupancy, query counts)

### Implementation Details

Create `packages/server/src/simulation/spatial-hash.ts`:

```typescript
export class SpatialHashGrid {
  private cellSize: number;
  private gridRes: number;        // cells per dimension (e.g., 25 for 500/20)
  private cells: Set<number>[];   // entityId sets per cell
  private entityCells: Map<number, number>; // entityId → cell index

  constructor(worldSize: number, cellSize: number);

  insert(entityId: number, pos: Vec2): void;
  remove(entityId: number): void;
  update(entityId: number, newPos: Vec2): void;  // Remove + re-insert if cell changed

  queryRadius(center: Vec2, radius: number): number[];  // All entity IDs within radius
  queryRect(rect: { x: number; y: number; width: number; height: number }): number[];
  queryCell(cellX: number, cellY: number): number[];

  getCellIndex(pos: Vec2): number;
  getCellCoords(pos: Vec2): { cx: number; cy: number };

  // Debug helpers
  getCellOccupancy(): Uint16Array;  // Count per cell (for heatmap)
  getTotalEntities(): number;
  clear(): void;
}
```

**Key algorithm details**:
- Cell coordinates computed via `floor(pos / cellSize) % gridRes`
- Toroidal wrapping: when query radius crosses world edge, wrap cell lookups
- `queryRadius`: determine which cells overlap the bounding box of the circle, then filter by actual distance
- Cell size should be >= typical entity view radius for optimal query performance

### Unit Tests
- Insert entity at (0, 0), query radius 10 at (0, 0) → found
- Insert at (499, 499), query at (1, 1) with radius 5 → found (toroidal wrap)
- Insert 1000 entities, query returns only entities within radius
- `update` correctly moves entity between cells
- `remove` makes entity unfindable
- `queryRect` handles viewport wrapping at world boundaries
- `getCellOccupancy` returns correct counts
- Empty grid queries return empty arrays

### Integration Tests
- Insert ~6,400 entities randomly, verify all queryRadius calls return correct sets
- Performance: 1000 radius queries complete in < 10ms for 6,400 entities

### QA Checklist
- [ ] Toroidal wrapping works for all four world edges
- [ ] Large query radius (> half world) handles wrapping correctly
- [ ] No memory leaks on repeated insert/remove cycles
- [ ] Cell occupancy matches expected distribution for uniform random placement

---

## Step 2.4: Energy System (Closed Conservation)

### What You're Implementing
The core energy accounting system that enforces closed conservation. All energy in the world belongs to exactly one of 5 accounts: Free, Plant, Meat, Organism, Egg. Every energy transfer goes through this system.

### Design References
- `components/back-end.md` §3 (EnergySystem — full interface, 5 accounts, transfer method, audit)
- `core-gameplay-systems.md` §2.4 (Energy cycle: free → plant → organism → meat → free)
- `core-gameplay-systems.md` §2.5 (World energy budget, total energy is constant)
- `architecture.md` §10 (Snapshot includes energy budget)
- `debug.md` §A.2 (EnergySnapshot, EnergyTransferLog — 7 fields)
- `debug.md` §F.3 (Energy conservation validator — auditEnergy() function)

### Implementation Details

Create `packages/server/src/simulation/energy-system.ts`:

```typescript
export type EnergyAccount = 'free' | 'plant' | 'meat' | 'organism' | 'egg';

export class EnergySystem {
  private accounts: Record<EnergyAccount, number>;
  private expectedTotal: number;  // Set at world init, never changes

  constructor(totalEnergy: number);

  transfer(from: EnergyAccount, to: EnergyAccount, amount: number, reason: string, entityId?: number): void;
  // Debits `from`, credits `to` by `amount`. Logs transfer.
  // Clamps to 0 if source has insufficient funds (logs warning).
  // NEVER creates or destroys energy — only moves it.

  getAccount(account: EnergyAccount): number;
  getTotalEnergy(): number;       // Sum of all 5 accounts
  getExpectedTotal(): number;     // Original total (should match getTotalEnergy)
  getConservationDrift(): number; // |actual - expected| — should be ~0

  getFreeEnergy(): number;
  getPlantEnergy(): number;
  getMeatEnergy(): number;
  getOrganismEnergy(): number;
  getEggEnergy(): number;

  // Serialization for snapshots
  serialize(): { accounts: Record<EnergyAccount, number>; expectedTotal: number };
  static deserialize(data: any): EnergySystem;

  // Debug hook (set by DebugCollector)
  onTransfer?: (log: EnergyTransferLog) => void;
}
```

**Critical invariant**: `getTotalEnergy()` must always equal `getExpectedTotal()` within floating-point epsilon (~0.01). Any drift indicates a conservation bug.

### Unit Tests
- Initialize with 10,000 energy in free account → total = 10,000
- `transfer('free', 'plant', 100)` → free = 9,900, plant = 100, total unchanged
- `transfer('plant', 'organism', 50)` → plant = 50, organism = 50, total unchanged
- Transfer more than source has → clamped, warning logged, no negative accounts
- Conservation drift stays < 0.001 after 10,000 random transfers
- Serialize → deserialize round-trip preserves all account values
- `transfer` with 0 amount is a no-op
- `transfer` with negative amount throws or is rejected

### QA Checklist
- [ ] No path through the system can create or destroy energy
- [ ] Conservation drift checked and logged every 100 ticks
- [ ] Float precision handled (use Math.round or fixed-point for critical paths)
- [ ] All 5 accounts always >= 0

---

## Step 2.5: Entity Data Structures

### What You're Implementing
The in-memory data structures for all simulation entities: organisms, plant pellets, meat pellets, eggs, fungi, and spores. Flat, cache-friendly structures optimized for the tick loop.

### Design References
- `components/back-end.md` §3 (Organism — full data structure with all fields, genes, brain state, spatial state, lifecycle state)
- `components/back-end.md` §3 (Plant pellet, Meat pellet, Egg data structures)
- `core-gameplay-systems.md` §1.1 (BodyGenes — all gene fields and derived stats)
- `core-gameplay-systems.md` §3 (Organism lifecycle: maturity, age, health, energy, reproduction state)
- `core-gameplay-systems.md` §6 (Fungi types and effects)
- `architecture.md` §4 (Binary encoding — 28 bytes organism, 12 bytes pellet, 14 bytes egg)

### Implementation Details

Create `packages/server/src/simulation/entities/`:

**`organism.ts`**:
```typescript
export interface Organism {
  // Identity
  id: number;                   // Unique entity ID (u16)
  speciesId: string;            // Species UUID
  playerId: string | null;      // null for AI
  generation: number;
  parentId: number | null;

  // Spatial
  x: number;
  y: number;
  angle: number;                // Facing direction (radians)
  vx: number;                   // Velocity x
  vy: number;                   // Velocity y

  // Genes (from design, mutated at birth)
  genes: BodyGenes;

  // Derived stats (computed from genes, cached)
  maxSpeed: number;
  maxHealth: number;
  maxEnergy: number;
  attackDamage: number;
  defenseReduction: number;
  bodyRadius: number;           // Collision radius
  stomachCapacity: number;

  // Brain
  brain: CompiledBrain;

  // State
  energy: number;
  health: number;
  age: number;                  // Ticks alive
  maturity: number;             // 0.0-1.0 growth progress
  isAlive: boolean;

  // Action outputs (set by brain each tick)
  moveForce: number;
  turnTorque: number;
  wantToEat: number;
  wantToAttack: number;
  wantToFlee: number;
  // ... all 20 output fields

  // Stomach/digestion state
  stomachContents: StomachContent[];
  stomachFullness: number;

  // Combat
  venomTimer: number;
  attackCooldown: number;

  // Reproduction
  eggStored: number;            // 0.0-1.0 progress toward laying
  matingCooldown: number;

  // Traits
  traits: TraitConfig;
  isBurrowed: boolean;
  isGrabbing: boolean;
  fatStored: number;
  camoStrength: number;

  // Display
  red: number;
  green: number;
  blue: number;
}
```

**`pellet.ts`**:
```typescript
export interface PlantPellet {
  id: number;
  x: number;
  y: number;
  energy: number;
  maxEnergy: number;
  biome: BiomeType;
}

export interface MeatPellet {
  id: number;
  x: number;
  y: number;
  energy: number;
  maxEnergy: number;
  freshness: number;          // 1.0 = fresh, decays over time
  sourceSpeciesId?: string;
}
```

**`egg.ts`**:
```typescript
export interface Egg {
  id: number;
  x: number;
  y: number;
  energy: number;
  parentId: number;
  speciesId: string;
  genes: BodyGenes;
  brain: BrainConfig;
  generation: number;
  incubationProgress: number; // 0.0-1.0
  nestAffinity: number;
}
```

**`entity-ids.ts`** (see `back-end.md` §3.2):
```typescript
/**
 * Compact u16 entity ID allocator with free-list recycling.
 * Without recycling, IDs exhaust in ~18h at 40 TPS with continuous births/deaths.
 * Recycled IDs are never reused within the same tick (client DELTA safety).
 */
export class EntityIdPool {
  private nextId: number = 1;           // 0 reserved as "no entity"
  private recycledIds: number[] = [];   // Stack of released IDs
  private maxId: number = 65535;        // u16 max

  allocate(): number;   // Pop from recycled stack, or increment nextId
  release(id: number): void;  // Push onto recycled stack
  get activeCount(): number;  // (nextId - 1) - recycledIds.length
}
```

**`swap-remove.ts`** (see `back-end.md` §3.7):
```typescript
/**
 * O(1) removal from unordered array. Swaps target with last element, then pops.
 * Entity array indices are NOT stable — only entity IDs are stable.
 * Used by EntityManager.removeEntity() for organisms, pellets, eggs.
 */
function swapRemove<T extends { id: number }>(arr: T[], index: number): void;
```

**`entity-manager.ts`**:
```typescript
export class EntityManager {
  private idPool: EntityIdPool;         // Allocates/recycles u16 entity IDs
  private organisms: Map<number, Organism>;
  private plants: Map<number, PlantPellet>;
  private meats: Map<number, MeatPellet>;
  private eggs: Map<number, Egg>;

  createOrganism(params: CreateOrganismParams): Organism;
  createPlant(x: number, y: number, energy: number, biome: BiomeType): PlantPellet;
  createMeat(x: number, y: number, energy: number, sourceSpeciesId?: string): MeatPellet;
  createEgg(params: CreateEggParams): Egg;

  removeEntity(id: number): void;
  getEntity(id: number): Organism | PlantPellet | MeatPellet | Egg | null;
  getOrganism(id: number): Organism | null;

  // Iteration
  forEachOrganism(fn: (org: Organism) => void): void;
  forEachPlant(fn: (pellet: PlantPellet) => void): void;
  forEachMeat(fn: (pellet: MeatPellet) => void): void;
  forEachEgg(fn: (egg: Egg) => void): void;

  // Stats
  organismCount(): number;
  plantCount(): number;
  meatCount(): number;
  eggCount(): number;
  totalEntityCount(): number;
}
```

### Unit Tests
- **EntityIdPool**: `allocate()` returns sequential IDs starting from 1
- **EntityIdPool**: `release()` → next `allocate()` reuses released ID (LIFO)
- **EntityIdPool**: exhaust all 65,535 IDs → throws on next `allocate()`
- **EntityIdPool**: `activeCount` tracks allocations minus releases
- **swapRemove**: removes middle element, array shrinks by 1, last element fills gap
- **swapRemove**: remove last element works (no swap needed)
- **swapRemove**: remove from single-element array → empty array
- Create organism with valid genes → all derived stats computed correctly
- Entity IDs are unique and allocated via EntityIdPool
- Remove entity → `swapRemove` used, entity no longer found by `getEntity`
- `forEachOrganism` iterates all living organisms
- `createOrganism` with default genes → maxSpeed, maxHealth, etc. match formulas in design doc
- Body radius scales with sizeRatio correctly

### QA Checklist
- [ ] Organism struct has ALL fields from `back-end.md` §3
- [ ] Derived stats computed using formulas from `core-gameplay-systems.md` §1.1
- [ ] EntityIdPool allocates and recycles u16 IDs (`back-end.md` §3.2)
- [ ] swapRemove used for O(1) entity removal (`back-end.md` §3.7)
- [ ] Entity count limits work (u16 max = 65,535 IDs)
- [ ] Memory usage matches architecture.md §10 estimates (~500B per organism)

---

## Step 2.6: Gene System & Derived Stat Computation

### What You're Implementing
Functions to compute derived organism stats from genes, apply gene constraints, and generate organisms from species designs.

### Design References
- `core-gameplay-systems.md` §1.1 (All gene → stat formulas: speed, HP, damage, defense reduction, body radius, etc.)
- `core-gameplay-systems.md` §3.5 (Growth/maturity system — stats scale with maturity)
- `core-gameplay-systems.md` §9 (Stomach capacity formula: `0.5 × bodySurfaceArea × stomachMult`)
- `core-gameplay-systems.md` §10 (Combat stat formulas: damage = STR × Size × desire, defense diminishing returns)
- `components/back-end.md` §3 (Derived stats section of Organism interface)

### Implementation Details

Create `packages/server/src/simulation/gene-system.ts`:

```typescript
export function computeDerivedStats(genes: BodyGenes, maturity: number): DerivedStats {
  const size2D = genes.sizeRatio * genes.sizeRatio;  // body area
  return {
    maxSpeed: genes.speedRatio * (1 - genes.defense * 0.02) * maturity,
    maxHealth: 100 * maturity * size2D,
    maxEnergy: 150 * size2D,
    attackDamage: genes.strength * genes.sizeRatio,
    defenseReduction: computeDefenseReduction(genes.defense),
    bodyRadius: genes.sizeRatio * 0.5,  // world units
    stomachCapacity: 0.5 * size2D * genes.stomachMultiplier,
    visionRange: genes.viewRadius,
    visionAngle: genes.viewAngle * Math.PI / 180,
    metabolismRate: genes.metabolism,
    mouthType: genes.diet < 0.25 ? 'filter' : genes.diet < 0.65 ? 'circle' : 'chomper',
  };
}

// Defense: diminishing returns formula from core-gameplay-systems.md §10
function computeDefenseReduction(defense: number): number {
  // DEF 1.0 → 9%, DEF 2.0 → 17%, DEF 4.0 → 29%
  return defense / (defense + 10);  // hyperbolic diminishing returns
}

export function createOrganismFromDesign(
  design: SpeciesDesign,
  entityId: number,
  position: Vec2,
  generation: number,
  parentId: number | null,
  rng: DeterministicRng,
): Organism;

export function applyMaturityScaling(org: Organism): void;
// Recompute derived stats based on current maturity
```

### Unit Tests
- Default genes (Size=1.0, Speed=1.0, etc.) produce expected derived stats
- Defense diminishing returns match design doc table: DEF 1→9%, 2→17%, 4→29%
- MaxHealth scales with Size² and maturity
- MaxSpeed decreases with Defense (-2% per point)
- Stomach capacity = 0.5 × Size² × StomachMult
- Mouth type thresholds: diet<0.25→filter, 0.25-0.65→circle, >=0.65→chomper
- Maturity=0.5 produces half-scaled stats, maturity=1.0 produces full stats
- `createOrganismFromDesign` produces valid organism with all fields initialized

### QA Checklist
- [ ] Every derived stat formula cross-referenced with design doc
- [ ] Edge cases: min and max gene values produce valid (not NaN/Infinity) derived stats
- [ ] Growth scaling is continuous (no sudden jumps at maturity thresholds)
