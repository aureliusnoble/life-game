# Life Game -- Simulation Engine Modules

Technical specification for all 12 simulation engine modules that compose the server-side game loop and client-side rendering pipeline. Each module is documented with its public API surface, key data structures, algorithms, performance characteristics, and inter-module dependencies.

**Runtime context**: Node.js simulation server, constant 40 TPS (configurable via `SIM_TPS`), 500x500 toroidal world, ~900 organisms + ~5,000 plant pellets + ~500 meat pellets at equilibrium per world. Broadcasts to clients at 20 Hz (decoupled from tick rate).

> **Multi-world note**: Each `WorldRoom` (managed by `WorldManager`, see [`back-end.md` Section 1.4](./back-end.md#14-worldmanager)) has its own independent set of all simulation modules listed below. Module interfaces operate on a single `World` instance and are unaware of other rooms. No cross-world interactions exist.

---

## Table of Contents

1. [BrainEngine](#1-brainengine)
2. [PhysicsEngine](#2-physicsengine)
3. [SpatialHashGrid](#3-spatialhashgrid)
4. [EnergySystem](#4-energysystem)
5. [DigestiveSystem](#5-digestivesystem)
6. [CombatSystem](#6-combatsystem)
7. [ReproductionSystem](#7-reproductionsystem)
8. [GeneticsEngine](#8-geneticsengine)
9. [EnvironmentEngine](#9-environmentengine)
10. [SpeciesManager](#10-speciesmanager)
11. [EventDetector](#11-eventdetector)
12. [OrganismRenderer](#12-organismrenderer-client-side)
13. [ShareCardRenderer](#13-sharecardrenderer-client-side)

---

## 1. BrainEngine

### Description

The BrainEngine evaluates feed-forward neural networks for every living organism each tick. Brains are compiled from a player's `BrainDesign` (nodes + synapses) into a flat `Float64Array` layout optimized for cache-line traversal. Each tick, external systems write sensory inputs into the input region, the engine propagates signals in topological order, and output node activations are read back to drive organism behavior.

### Public Interface

```typescript
interface BrainEngine {
  /**
   * Compile a player BrainDesign into a runtime CompiledBrain.
   * Performs topological sort (Kahn's algorithm), validates acyclicity,
   * and packs all node/synapse data into typed arrays.
   */
  compile(design: BrainDesign): CompiledBrain;

  /**
   * Process one tick for a single brain.
   * 1. Writes input values into the input node region.
   * 2. Propagates signals in topological order through hidden nodes.
   * 3. Applies activation functions to each node.
   * 4. Returns nothing -- outputs are read via getOutput().
   */
  tick(brain: CompiledBrain, inputs: BrainInputs, dt: number): void;

  /**
   * Batch-tick all brains for all living organisms in the world.
   * Iterates the organism array and calls tick() for each.
   */
  tickAll(organisms: Organism[], dt: number): void;

  /**
   * Read a single output node value from a compiled brain.
   */
  getOutput(brain: CompiledBrain, output: OutputNodeType): number;

  /**
   * Read all output node values at once.
   */
  getAllOutputs(brain: CompiledBrain): BrainOutputs;

  /**
   * Clone a compiled brain (used during reproduction before mutation).
   */
  clone(brain: CompiledBrain): CompiledBrain;

  /**
   * Return the energy cost of running this brain for one tick.
   * cost = 0.1 * numHiddenNodes * metabolism
   */
  getTickEnergyCost(brain: CompiledBrain, metabolism: number): number;
}
```

### Key Data Structures

```typescript
/** The player-facing design representation (JSON-serializable). */
interface BrainDesign {
  nodes: BrainNodeDef[];
  synapses: SynapseDef[];
}

interface BrainNodeDef {
  id: string;
  type: 'input' | 'hidden' | 'output';
  activationFn: ActivationFunction;
  bias: number;                        // -5.0 to +5.0
  inputType?: InputNodeType;           // set when type === 'input'
  outputType?: OutputNodeType;         // set when type === 'output'
}

interface SynapseDef {
  from: string;   // source node id
  to: string;     // destination node id
  weight: number; // -5.0 to +5.0
  enabled: boolean;
}

/**
 * Runtime compiled brain packed into typed arrays for cache efficiency.
 *
 * Memory layout of `activations` (Float64Array):
 *   [0..numInputs-1]                input node activations
 *   [numInputs..numInputs+numHidden-1]  hidden node activations
 *   [numInputs+numHidden..total-1]  output node activations
 *
 * `prevActivations` mirrors the same layout and stores the prior tick's
 * values (needed by Differential, Integrator, Inhibitory nodes).
 *
 * `metadata` (Int32Array) per node:
 *   [i*4+0] = activationFn enum index
 *   [i*4+1] = first synapse index into synapseWeights
 *   [i*4+2] = synapse count for this node
 *   [i*4+3] = accumulation mode (0 = sum, 1 = product)
 */
interface CompiledBrain {
  activations: Float64Array;
  prevActivations: Float64Array;
  prevInputs: Float64Array;         // previous tick raw inputs (for DIF, INH)
  biases: Float64Array;             // one per node
  metadata: Int32Array;             // 4 ints per node
  synapseWeights: Float64Array;     // packed synapse weights
  synapseSrcIndices: Int32Array;    // source node index per synapse
  topoOrder: Int32Array;            // topological processing order (node indices)
  numInputs: number;
  numHidden: number;
  numOutputs: number;
  numSynapses: number;
  nodeCount: number;
}

/** All 12 activation functions. */
enum ActivationFunction {
  Sigmoid      = 0,
  Linear       = 1,
  TanH         = 2,
  ReLU         = 3,
  Sine         = 4,
  Gaussian     = 5,
  Latch        = 6,
  Differential = 7,
  Absolute     = 8,
  Multiply     = 9,
  Integrator   = 10,
  Inhibitory   = 11,
}

/** Input node types -- organism senses. */
enum InputNodeType {
  // Tier 1 (11 nodes, available immediately)
  Constant              = 0,   // always 1.0
  EnergyRatio           = 1,   // [0, 1] current energy / max energy
  HealthRatio           = 2,   // [0, 1] current HP / max HP
  Fullness              = 3,   // [0, 1] stomach contents / capacity
  NearestPlantAngle     = 4,   // [-1, 1] direction to nearest plant
  NearestPlantDist      = 5,   // [0, 1] distance to nearest plant (0=touch, 1=maxView)
  NearestMeatAngle      = 6,   // [-1, 1] direction to nearest meat pellet
  NearestMeatDist       = 7,   // [0, 1] distance to nearest meat pellet
  NearestOrganismAngle  = 8,   // [-1, 1] direction to nearest organism
  NearestOrganismDist   = 9,   // [0, 1] distance to nearest organism
  NearestOrganismSize   = 10,  // [0, 1] relative size (0.5 = same size)

  // Tier 2 (8 nodes, unlock: 50 EP)
  Speed                 = 11,  // [0, 1] current speed / max speed
  Maturity              = 12,  // [0, 1] growth level (1.0 = adult)
  NearestAllyAngle      = 13,  // [-1, 1] direction to nearest same-species organism
  NearestAllyDist       = 14,  // [0, 1] distance to nearest ally
  NOrganisms            = 15,  // [0, 1] visible organisms / 4
  NFood                 = 16,  // [0, 1] visible food items / 4
  IsGrabbing            = 17,  // 0 or 1
  AttackedDamage        = 18,  // [0, 1] damage received this tick / max HP

  // Tier 3 (15 nodes, unlock: 200 EP)
  Tic                   = 19,  // [0, 1] internal clock oscillator
  TimeAlive             = 20,  // [0, 1] age / max expected lifespan
  EggStored             = 21,  // [0, 1] egg readiness
  BiomeType             = 22,  // grassland=0.2, forest=0.4, wetland=0.6, desert=0.8, rocky=1.0
  SeasonPhase           = 23,  // spring=0-0.25, summer=0.25-0.5, autumn=0.5-0.75, winter=0.75-1.0
  NearestOrganismColor  = 24,  // [0, 1] hue of nearest visible organism
  NearestAllyCount      = 25,  // [0, 1] allies in view / 4
  StomachPlantRatio     = 26,  // [0, 1] plant fraction of stomach contents
  NearestMateAngle      = 27,  // [-1, 1] direction to nearest opposite-sex same-species (requires Sexual Reproduction)
  NearestMateDist       = 28,  // [0, 1] distance to nearest mate (requires Sexual Reproduction)
  Sex                   = 29,  // {0, 1} organism sex: 0=female, 1=male (requires Sexual Reproduction)
  MatingCooldown        = 30,  // [0, 1] remaining cooldown fraction (requires Sexual Reproduction)
  NearbyEggCount        = 31,  // [0, 1] same-species eggs in view / 4
  NearestEggAngle       = 32,  // [-1, 1] direction to nearest same-species egg
  NearestEggDist        = 33,  // [0, 1] distance to nearest same-species egg

  // Tier 4 (16 nodes, unlock: 500 EP)
  Pheromone1Strength    = 34,  // [0, 1] red pheromone intensity
  Pheromone2Strength    = 35,  // [0, 1] green pheromone intensity
  Pheromone3Strength    = 36,  // [0, 1] blue pheromone intensity
  Pheromone1Angle       = 37,  // [-1, 1] red pheromone gradient direction
  Pheromone2Angle       = 38,  // [-1, 1] green pheromone gradient direction
  Pheromone3Angle       = 39,  // [-1, 1] blue pheromone gradient direction
  SoundDirection        = 40,  // [-1, 1] direction of loudest sound
  SoundIntensity        = 41,  // [0, 1] volume of loudest sound
  IsBurrowed            = 42,  // 0 or 1
  AllyEnergyRatio       = 43,  // [0, 1] nearest encounter-range ally's energy ratio (requires Encounter Info Sharing)
  AllyHealthRatio       = 44,  // [0, 1] nearest encounter-range ally's health ratio (requires Encounter Info Sharing)
  AllyHeading           = 45,  // [-1, 1] nearest encounter-range ally's relative heading (requires Encounter Info Sharing)
  AllyLastFoodAngle     = 46,  // [-1, 1] direction to ally's last food, resets after 10s (requires Encounter Info Sharing)
  AllyLastThreatAngle   = 47,  // [-1, 1] direction of ally's last damage, resets after 15s (requires Encounter Info Sharing)
  AllyWant2Mate         = 48,  // [0, 1] ally's Want2Mate output (requires Encounter Info Sharing)
  AllyReproductiveState = 49,  // [-1, 1] ally's sex+readiness: female +EggStored, male -energyRatio (requires Encounter Info Sharing)
}

/** Output node types -- organism behaviors. */
enum OutputNodeType {
  // Tier 1 (5 nodes, available immediately)
  Accelerate     = 0,   // TanH [-1, 1] forward/backward movement
  Rotate         = 1,   // TanH [-1, 1] turning torque
  Want2Eat       = 2,   // Sigmoid [0, 1] threshold: > 0.5
  Want2Attack    = 3,   // Sigmoid [0, 1] threshold: > 0.5
  Want2Flee      = 4,   // Sigmoid [0, 1] threshold: > 0.5 triggers sprint

  // Tier 2 (4 nodes, unlock: 50 EP)
  Want2Grow      = 5,   // Sigmoid [0, 1] threshold: > 0.5
  Digestion      = 6,   // Sigmoid [0, 1] continuous stomach acid level
  Grab           = 7,   // Sigmoid [0, 1] threshold: > 0.5
  Want2Heal      = 8,   // Sigmoid [0, 1] threshold: > 0.5

  // Tier 3 (5 nodes, unlock: 200 EP)
  Want2Reproduce = 9,   // Sigmoid [0, 1] threshold: > 0.5 (egg production; for sexual species also see Want2Mate)
  Herding        = 10,  // Sigmoid [0, 1] continuous flock influence
  ClockReset     = 11,  // Sigmoid [0, 1] threshold: > 0.5
  Burrow         = 12,  // Sigmoid [0, 1] threshold: > 0.5
  Want2Mate      = 13,  // Sigmoid [0, 1] threshold: > 0.5 triggers fertilization (requires Sexual Reproduction)

  // Tier 4 (4 nodes, unlock: 500 EP)
  EmitPheromone1 = 14,  // Sigmoid [0, 1] red pheromone emission
  EmitPheromone2 = 15,  // Sigmoid [0, 1] green pheromone emission
  EmitPheromone3 = 16,  // Sigmoid [0, 1] blue pheromone emission
  EmitSound      = 17,  // Sigmoid [0, 1] acoustic emission intensity
}

type BrainInputs = Record<InputNodeType, number>;
type BrainOutputs = Record<OutputNodeType, number>;
```

### Algorithm

#### Compilation (Kahn's Algorithm for Topological Sort)

1. Build an adjacency list from enabled synapses.
2. Compute in-degree for every node.
3. Seed a queue with all nodes having in-degree 0 (input nodes).
4. While queue is non-empty: dequeue node, append to `topoOrder`, decrement in-degree of all successors. Enqueue successors reaching in-degree 0.
5. If `topoOrder.length < nodeCount`, the graph has a cycle -- reject the design.
6. Pack node data into `metadata`, `biases`, `activations`. Pack synapse data into `synapseWeights` and `synapseSrcIndices` grouped by destination node so each node's incoming synapses are contiguous in memory.

#### Tick Processing

```
for each nodeIndex in topoOrder (skipping pure input nodes):
    accumulator = bias[nodeIndex]
    startSyn = metadata[nodeIndex * 4 + 1]
    synCount = metadata[nodeIndex * 4 + 2]
    accumMode = metadata[nodeIndex * 4 + 3]

    if accumMode == 0 (summation):
        for s in [startSyn .. startSyn + synCount):
            accumulator += activations[synapseSrcIndices[s]] * synapseWeights[s]
    else (product, for Multiply nodes):
        accumulator = 1.0   // ignore bias for product accumulation
        for s in [startSyn .. startSyn + synCount):
            accumulator *= activations[synapseSrcIndices[s]] * synapseWeights[s]

    activations[nodeIndex] = applyActivation(metadata[nodeIndex * 4 + 0], accumulator, ...)
```

#### Activation Functions (Exact Formulas)

| Index | Name | Formula | Output Range | Default |
|-------|------|---------|-------------|---------|
| 0 | **Sigmoid** | `1 / (1 + e^(-x))` | [0, 1] | 0.5 |
| 1 | **Linear** | `clamp(x, -100, 100)` | [-100, 100] | 0 |
| 2 | **TanH** | `(e^x - e^(-x)) / (e^x + e^(-x))` | [-1, 1] | 0 |
| 3 | **ReLU** | `clamp(max(0, x), 0, 100)` | [0, 100] | 0 |
| 4 | **Sine** | `sin(x)` | [-1, 1] | 0 |
| 5 | **Gaussian** | `1 / (1 + x^2)` | [0, 1] | 1.0 |
| 6 | **Latch** | `if x >= 1: s = 1; if x <= 0: s = 0; else s = prev_s` (stateful binary) | {0, 1} | 0 |
| 7 | **Differential** | `clamp((x - prevInput) / dt, -100, 100)` (rate of change) | [-100, 100] | 0 |
| 8 | **Absolute** | `clamp(abs(x), 0, 100)` | [0, 100] | 0 |
| 9 | **Multiply** | `clamp(product_of_inputs, -100, 100)` (product accumulation, not sum) | [-100, 100] | 1 |
| 10 | **Integrator** | `clamp(prevY + x * dt, -100, 100)` (running sum over time) | [-100, 100] | 0 |
| 11 | **Inhibitory** | `clamp((x - prevX) + prevY * e^(-bias * dt), -100, 100)` (habituating response) | [-100, 100] | 0 |

Where `prevX` = input from the previous frame, `prevY` = output from the previous frame, `dt` = seconds elapsed since the previous frame, `bias` = the node's bias value (used as the decay constant for Inhibitory nodes).

### Performance Characteristics

- **Single brain tick**: ~2 microseconds for a typical brain (30 nodes, 50 synapses).
- **Full world tick (900 organisms)**: ~1.8ms.
- The flat typed-array layout ensures sequential memory access during propagation. Each node's incoming synapses are contiguous, so the inner loop benefits from L1/L2 cache prefetching.
- `Float64Array` chosen over `Float32Array` because JavaScript numbers are IEEE 754 doubles; using `Float64Array` avoids implicit conversion overhead.

### Dependencies

- **SpatialHashGrid**: BrainEngine does not query the grid directly, but the tick orchestrator must call SpatialHashGrid queries first to populate `BrainInputs` (vision cone results, nearest entity data).
- **EnvironmentEngine**: Provides biome type, season phase, pheromone readings, and day/night data for input nodes.

---

## 2. PhysicsEngine

### Description

The PhysicsEngine applies 2D Newtonian mechanics to all organisms each tick. It reads brain outputs (Accelerate, Rotate, Want2Flee), computes forces, updates velocities with drag, resolves elastic collisions via the SpatialHashGrid, and wraps positions on the toroidal world boundary.

> **`dt` is independent of `SIM_TPS`**. The physics timestep `dt = 1/20` is a simulation-time constant (how much sim-time each tick advances), not a real-time value. Changing `SIM_TPS` changes how fast sim-time maps to real-time, but each tick's physics step is identical. At 40 TPS, the simulation runs at 2x real-time speed (40 ticks/sec × 1/20 sec/tick = 2 sim-seconds per real-second).

### Public Interface

```typescript
interface PhysicsEngine {
  /**
   * Update all organism positions and velocities for one tick.
   * Reads brain outputs, applies forces, drag, collisions, and wrapping.
   */
  tick(organisms: Organism[], grid: SpatialHashGrid, dt: number): void;

  /**
   * Compute the mass of an organism given its current state.
   */
  computeMass(organism: Organism): number;

  /**
   * Apply an external impulse to an organism (used by CombatSystem for knockback).
   */
  applyImpulse(organism: Organism, force: Vec2): void;

  /**
   * Resolve collision between two overlapping organisms.
   * Applies elastic separation and velocity exchange.
   */
  resolveCollision(a: Organism, b: Organism): void;

  /**
   * Wrap a position into the toroidal world bounds [0, worldSize).
   */
  wrapPosition(pos: Vec2): Vec2;

  /**
   * Return the movement energy cost for this tick.
   */
  getMovementEnergyCost(organism: Organism, dt: number): number;
}
```

### Key Data Structures

```typescript
interface Vec2 {
  x: number;
  y: number;
}

interface PhysicsState {
  position: Vec2;          // world-space position [0, 500)
  velocity: Vec2;          // units/second
  heading: number;         // radians, 0 = east, PI/2 = north
  angularVelocity: number; // radians/second
  mass: number;            // grams, computed each tick
}

interface PhysicsConfig {
  worldSize: number;       // 500
  baseForce: number;       // base movement force constant
  dragCoefficient: number; // linear drag per second (e.g., 3.0)
  angularDrag: number;     // angular drag per second (e.g., 5.0)
  bodyMassDensity: number; // grams per unit^2 of body surface
  materialMassDensity: number; // grams per unit^2 of stomach contents
  sprintSpeedMult: number; // 1.5
  sprintEnergyCostMult: number; // 3.0
  sprintThreshold: number; // 0.5 (Want2Flee output threshold)
}
```

### Algorithm

#### Force Calculation

```
accelOutput = brain.getOutput(Accelerate)    // [-1, 1]
rotateOutput = brain.getOutput(Rotate)       // [-1, 1]
fleeOutput = brain.getOutput(Want2Flee)      // [0, 1]

sprinting = fleeOutput > sprintThreshold
speedMult = sprinting ? sprintSpeedMult : 1.0

// Movement force
moveForce = accelOutput * baseForce * sqrt(Size1D * SpeedRatio) * ageStrengthFactor * speedMult

// Turn torque
turnTorque = rotateOutput * (baseForce / 2) * SpeedRatio * Size1D^3 * ageStrengthFactor
```

#### Velocity Update (with drag)

```
velocity += (moveForce / mass) * headingVector * dt
velocity *= (1 - dragCoefficient * dt)

angularVelocity += (turnTorque / momentOfInertia) * dt
angularVelocity *= (1 - angularDrag * dt)
```

#### Position Update and Toroidal Wrapping

```
position += velocity * dt
heading += angularVelocity * dt

// Toroidal wrap
position.x = ((position.x % worldSize) + worldSize) % worldSize
position.y = ((position.y % worldSize) + worldSize) % worldSize
```

#### Mass Calculation

```
mass = Size2D * bodyMassDensity + stomachContents * materialMassDensity

where:
  Size1D = sizeRatio * sqrt(maturity) * baseSize
  Size2D = PI * Size1D^2
```

#### Sprint Mechanics

When `Want2Flee > 0.5`:
- Speed multiplier: 1.5x applied to the `moveForce`.
- Energy cost: 3x normal movement cost.
- Sprint does not affect turning.

#### Elastic Collision Resolution

1. Query the SpatialHashGrid for all organism pairs within collision distance.
2. For each overlapping pair `(A, B)`:
   - Compute overlap = `(radiusA + radiusB) - dist(A, B)`.
   - Separation vector = normalized direction from B to A, scaled by `overlap / 2`.
   - Push each organism apart by separation vector (scaled inversely by mass).
   - Exchange velocity components along the collision normal, preserving momentum:
     ```
     relativeVel = A.vel - B.vel
     normalComponent = dot(relativeVel, collisionNormal)
     impulse = (2 * normalComponent) / (A.mass + B.mass)
     A.vel -= impulse * B.mass * collisionNormal
     B.vel += impulse * A.mass * collisionNormal
     ```

#### Energy Cost

```
moveEnergyCost = baseMoveCost * SpeedRatio * Size1D * |accelOutput| * metabolism * dt
turnEnergyCost = baseTurnCost * SpeedRatio * Size1D * |rotateOutput| * metabolism * dt
totalCost = (moveEnergyCost + turnEnergyCost) * (sprinting ? sprintEnergyCostMult : 1.0)
```

### Performance Characteristics

- **Force/velocity/position update**: ~0.3 microseconds per organism (simple arithmetic).
- **Collision detection**: Delegated to SpatialHashGrid broadphase. Narrowphase overlap test is ~10ns per pair.
- **Full tick (900 organisms)**: ~0.5ms including collision resolution.
- Collision pair count is bounded by the spatial hash -- typically ~200-400 pairs checked per tick.

### Dependencies

- **BrainEngine**: Reads `Accelerate`, `Rotate`, `Want2Flee` outputs.
- **SpatialHashGrid**: Broadphase collision queries.
- **EnergySystem**: Deducts movement energy costs.
- **CombatSystem**: Calls `applyImpulse()` for knockback.

---

## 3. SpatialHashGrid

### Description

A uniform grid spatial partitioning structure that divides the 500x500 toroidal world into 25x25 cells (each 20x20 units, 625 cells total). Provides efficient broadphase queries for collision detection, vision cone sensing, nearest-entity lookups, and density calculations. All queries handle toroidal wrapping transparently.

### Public Interface

```typescript
interface SpatialHashGrid {
  /**
   * Insert an entity into the grid at its current position.
   */
  insert(entity: SpatialEntity): void;

  /**
   * Remove an entity from the grid.
   */
  remove(entity: SpatialEntity): void;

  /**
   * Update an entity's cell assignment after it has moved.
   * Performs remove + insert only if the cell changed.
   */
  update(entity: SpatialEntity, oldPos: Vec2, newPos: Vec2): void;

  /**
   * Find all entities within `radius` of `center`.
   * Handles toroidal wrapping: queries near world edges wrap around.
   * Returns entities sorted by distance (nearest first).
   */
  queryRadius(center: Vec2, radius: number, filter?: EntityFilter): SpatialEntity[];

  /**
   * Find all entities within a vision cone defined by origin, heading, angle, and radius.
   * Used for organism sensory input population.
   */
  queryVisionCone(
    origin: Vec2,
    heading: number,         // radians
    halfAngle: number,       // radians (half of ViewAngle)
    radius: number,
    filter?: EntityFilter
  ): SpatialEntity[];

  /**
   * Find the single nearest entity to `center` within `maxRadius`.
   * Faster than queryRadius when only the closest result is needed.
   */
  queryNearest(
    center: Vec2,
    maxRadius: number,
    filter?: EntityFilter
  ): SpatialEntity | null;

  /**
   * Find all entities within an axis-aligned rectangle.
   * Handles toroidal wrapping.
   */
  queryRect(min: Vec2, max: Vec2, filter?: EntityFilter): SpatialEntity[];

  /**
   * Find same-species organisms within encounter range (1.5x sum of radii).
   * Used for Encounter Info Sharing trait. Returns nearest qualifying ally.
   */
  queryEncounterRange(
    organism: SpatialEntity,
    speciesId: string
  ): SpatialEntity | null;

  /**
   * Find same-species eggs within view range of an organism.
   * Returns eggs sorted by distance. Used for NearbyEggCount/NearestEggAngle/Dist inputs.
   */
  queryNearbyEggs(
    center: Vec2,
    viewRadius: number,
    speciesId: string,
    eggs: SpatialEntity[]
  ): SpatialEntity[];

  /**
   * Count same-species organisms within a radius that match a predicate.
   * Used for nest bonus calculation (count organisms emitting pheromone near eggs).
   */
  countNearbyMatching(
    center: Vec2,
    radius: number,
    speciesId: string,
    predicate: (entity: SpatialEntity) => boolean
  ): number;

  /**
   * Return the number of entities in the cell containing the given position.
   * Used for density-dependent mechanics.
   */
  getCellDensity(pos: Vec2): number;

  /**
   * Clear all entities from the grid. Called during world reset.
   */
  clear(): void;

  /**
   * Rebuild the entire grid from an entity array. Used on server restart / snapshot load.
   */
  rebuild(entities: SpatialEntity[]): void;
}

type EntityFilter = (entity: SpatialEntity) => boolean;
```

### Key Data Structures

```typescript
interface SpatialEntity {
  id: number;
  position: Vec2;
  radius: number;             // collision/interaction radius
  entityType: EntityType;     // 'organism' | 'plant' | 'meat' | 'egg' | 'fungus'
  cellIndex: number;          // cached: current cell index (row * 25 + col)
}

enum EntityType {
  Organism = 0,
  Plant    = 1,
  Meat     = 2,
  Egg      = 3,
  Fungus   = 4,
}

interface GridConfig {
  worldSize: number;     // 500
  cellsPerAxis: number;  // 25
  cellSize: number;      // 20 (= worldSize / cellsPerAxis)
}

/**
 * Internal cell storage. Each cell maintains a doubly-linked list of entities
 * for O(1) insert/remove without array reallocation.
 */
interface GridCell {
  head: SpatialEntity | null;
  count: number;
}
```

### Algorithm

#### Cell Mapping

```
cellX = floor(position.x / cellSize) % cellsPerAxis
cellY = floor(position.y / cellSize) % cellsPerAxis
cellIndex = cellY * cellsPerAxis + cellX
```

#### Vision Cone Query

1. Compute the bounding box of the cone (origin +/- radius in both axes).
2. Map the bounding box to a range of grid cells.
3. For each candidate cell (including toroidal-wrapped cells):
   a. For each entity in the cell:
      - Compute the toroidal distance vector from origin to entity.
      - Check `dist <= radius` (distance filter).
      - Compute the angle between the heading vector and the direction-to-entity vector.
      - Check `|angle| <= halfAngle` (angle filter).
      - If both pass, include the entity in results.
4. Sort results by distance.

#### Toroidal Distance

```
dx = target.x - origin.x
dy = target.y - origin.y

// Wrap to shortest path across torus
if (dx > worldSize / 2) dx -= worldSize
if (dx < -worldSize / 2) dx += worldSize
if (dy > worldSize / 2) dy -= worldSize
if (dy < -worldSize / 2) dy += worldSize

dist = sqrt(dx * dx + dy * dy)
angle = atan2(dy, dx)
```

#### Toroidal Cell Iteration for Queries

When a query radius extends beyond a world edge, the cell iteration wraps:
```
for cy = startCellY to endCellY:
    wrappedCY = ((cy % cellsPerAxis) + cellsPerAxis) % cellsPerAxis
    for cx = startCellX to endCellX:
        wrappedCX = ((cx % cellsPerAxis) + cellsPerAxis) % cellsPerAxis
        iterate entities in grid[wrappedCY * cellsPerAxis + wrappedCX]
```

### Performance Characteristics

- **Insert/Remove/Update**: O(1) per entity (hash lookup + linked list manipulation).
- **queryRadius**: O(C * E) where C = number of cells in bounding box, E = average entities per cell. Typical: 4-9 cells checked, ~2-8 entities per cell.
- **queryVisionCone**: Same complexity as queryRadius plus trigonometric checks. The bounding box prune eliminates most cells before any trig is computed.
- **Per-tick total**: ~900 organisms x 3 queries each (nearest plant, nearest meat, nearest organism) = ~2,700 queries. Average ~65 distance comparisons per query = ~175,000 comparisons/tick. Cost: ~0.5ms.
- **Memory**: 625 cells x 8 bytes (head pointer + count) = ~5 KB for the grid structure. Entity cell indices are stored on the entities themselves.

### Dependencies

- None. SpatialHashGrid is a standalone data structure. It is used by PhysicsEngine, BrainEngine (via the tick orchestrator for populating inputs), CombatSystem, and ReproductionSystem.

---

## 4. EnergySystem

### Description

The EnergySystem enforces the closed-system energy conservation law: total energy in the world is constant from the moment it is created. Energy exists in five forms -- free biomass, plant pellets, meat pellets, organism energy (reserves + body mass + health), and egg energy. Every transfer between forms is accounted for. The system also handles plant pellet spawning (converting free biomass to plants) and meat pellet decay (returning energy to free biomass), and performs periodic floating-point drift correction.

### Public Interface

```typescript
interface EnergySystem {
  /**
   * Initialize the energy system with a fixed total energy budget.
   * totalEnergy = biomassDensity * worldSize^2
   */
  initialize(config: EnergyConfig): void;

  /**
   * Run one tick of plant spawning and meat decay.
   */
  tick(world: WorldState, dt: number): void;

  /**
   * Transfer energy between two accounts. All energy movements go through this.
   * Returns the actual amount transferred (may be less if source is depleted).
   */
  transfer(
    from: EnergyAccount,
    to: EnergyAccount,
    amount: number,
    reason: EnergyTransferReason
  ): number;

  /**
   * Spawn a plant pellet by converting free biomass. Returns null if
   * insufficient free biomass or if density limit is exceeded.
   */
  spawnPlant(position: Vec2, biome: BiomeType, season: Season): PlantPellet | null;

  /**
   * Process meat pellet decay for all meat pellets.
   */
  decayMeat(pellets: MeatPellet[], dt: number): void;

  /**
   * Return the current energy distribution snapshot (for analytics/debugging).
   */
  getEnergySnapshot(): EnergySnapshot;

  /**
   * Perform floating-point drift correction.
   * Compares sum of all accounts to totalEnergy and adjusts freeBiomass.
   * Called every 100 ticks.
   */
  correctDrift(): void;
}
```

### Key Data Structures

```typescript
interface EnergyConfig {
  totalEnergy: number;            // fixed at world creation
  biomassDensity: number;         // energy per unit^2
  worldSize: number;              // 500
  plantSpawnBaseRate: number;     // pellets per second per cell at fertility 1.0
  meatDecayBaseRate: number;      // fraction per second
}

interface EnergySnapshot {
  totalEnergy: number;
  freeBiomass: number;
  plantEnergy: number;            // sum of all plant pellets
  meatEnergy: number;             // sum of all meat pellets
  organismEnergy: number;         // sum of all organism energy (body + reserves)
  eggEnergy: number;              // sum of all egg energy
  drift: number;                  // computed - expected discrepancy (should be ~0)
}

enum EnergyAccount {
  FreeBiomass,
  PlantPellet,
  MeatPellet,
  OrganismReserve,
  OrganismBody,
  Egg,
}

enum EnergyTransferReason {
  PlantSpawn,           // freeBiomass -> plant
  PlantEaten,           // plant -> organism stomach
  MeatEaten,            // meat -> organism stomach
  Digestion,            // stomach material -> organism energy
  DigestionWaste,       // inefficiency loss -> freeBiomass
  MetabolismBurn,       // organism energy -> freeBiomass
  MovementBurn,         // organism energy -> freeBiomass
  BrainBurn,            // organism energy -> freeBiomass
  GrowthInvest,         // organism energy -> organism body mass
  HealInvest,           // organism energy -> organism health
  EggInvest,            // organism energy -> egg
  EggHatch,             // egg -> organism (newborn)
  OrganismDeath,        // organism body + reserves -> meat pellets
  MeatDecay,            // meat pellet -> freeBiomass
  CombatMeatDrop,       // damage dealt -> meat pellet or organism stomach
  VenomDamage,          // organism health -> freeBiomass (lost to heat)
  FungiDrain,           // organism energy -> freeBiomass
}

interface PlantPellet {
  id: number;
  position: Vec2;
  energy: number;         // energy content in E
  size: number;           // in unit^2 = energy / plantEnergyDensity
  biome: BiomeType;
}

interface MeatPellet {
  id: number;
  position: Vec2;
  energy: number;
  size: number;           // in unit^2 = energy / meatEnergyDensity
  decayTimer: number;     // seconds since creation
  biome: BiomeType;
}
```

### Algorithm

#### Conservation Invariant

At all times:
```
totalEnergy = freeBiomass
            + sum(plantPellet.energy for all plants)
            + sum(meatPellet.energy for all meat)
            + sum(organism.bodyEnergy + organism.reserves + organism.stomachEnergy for all organisms)
            + sum(egg.energy for all eggs)
```

Every `transfer()` call simultaneously decrements the source account and increments the destination account by the same amount, preserving the invariant.

#### Plant Spawning

Per tick, for each biome cell:
```
fertility = biome.baseFertility
seasonMult = season.plantGrowthMultiplier
freeBiomassRatio = freeBiomass / totalEnergy
localHerbivoreCount = grid.getCellDensity(cellCenter)  // filtered to herbivores

spawnRate = fertility * seasonMult * freeBiomassRatio
effectiveSpawnRate = spawnRate / (1 + localHerbivoreCount / 50)

if random() < effectiveSpawnRate * dt:
    pelletSize = biome.basePelletSize * (0.5 + random() * 1.0)
    pelletEnergy = pelletSize * plantEnergyDensity    // 1.0 E/u^2
    if freeBiomass >= pelletEnergy:
        transfer(FreeBiomass, PlantPellet, pelletEnergy, PlantSpawn)
        create plant pellet at random position within cell
```

The `freeBiomassRatio` term creates the fundamental negative feedback: as organisms consume plants and lock energy in biomass, fewer plants spawn. When organisms die and meat decays, energy returns to biomass and plant spawning accelerates.

#### Meat Decay

Per tick, for each meat pellet:
```
biomeDecayMult = pellet.biome.meatDecayMultiplier
decayRate = biomeDecayMult * pellet.size * 0.01    // u^2/second

decayAmount = decayRate * dt
energyDecayed = decayAmount * meatEnergyDensity    // 3.0 E/u^2

pellet.size -= decayAmount
pellet.energy -= energyDecayed
transfer(MeatPellet, FreeBiomass, energyDecayed, MeatDecay)

if pellet.size <= 0.01:
    transfer remaining pellet.energy to FreeBiomass
    destroy pellet
```

#### Floating-Point Drift Correction

Every 100 ticks:
```
measured = freeBiomass + sum(plants) + sum(meat) + sum(organisms) + sum(eggs)
drift = totalEnergy - measured
freeBiomass += drift    // absorb rounding errors into the ambient pool
```

This keeps cumulative floating-point error from growing unboundedly. The drift magnitude is typically < 0.001 E per correction.

### Performance Characteristics

- **Plant spawn check**: O(numCells) per tick = 625 cells. Each check is a single random draw + arithmetic. ~0.1ms.
- **Meat decay**: O(numMeatPellets) per tick. ~500 pellets x simple arithmetic = ~0.05ms.
- **Drift correction**: O(numEntities) every 100 ticks. Negligible amortized cost.
- **transfer()**: O(1) per call, ~5ns (two additions).

### Dependencies

- **SpatialHashGrid**: For `getCellDensity()` used in density-dependent plant spawning.
- **EnvironmentEngine**: Provides biome fertility values and season multipliers.
- **All other systems**: Call `transfer()` whenever energy changes form. EnergySystem is the central accounting ledger.

---

## 5. DigestiveSystem

### Description

The DigestiveSystem models each organism's stomach as a two-slot container (plant material and meat material) with acid-controlled digestion. The brain's `Digestion` output node controls stomach acid level, creating a tradeoff between digestion speed and efficiency. Diet genes determine how efficiently each material type is converted to usable energy.

### Public Interface

```typescript
interface DigestiveSystem {
  /**
   * Process one tick of digestion for a single organism.
   * Converts stomach contents to energy based on acid level, fullness, and diet.
   */
  tick(organism: Organism, dt: number): DigestResult;

  /**
   * Attempt to eat a pellet. Adds material to the appropriate stomach slot.
   * Returns the actual amount consumed (limited by remaining capacity and bite size).
   */
  eat(organism: Organism, pellet: Pellet): EatResult;

  /**
   * Get the current fullness ratio of an organism's stomach.
   */
  getFullness(organism: Organism): number;

  /**
   * Get the plant/meat ratio of stomach contents.
   */
  getPlantRatio(organism: Organism): number;

  /**
   * Compute the stomach capacity for an organism.
   */
  getCapacity(organism: Organism): number;
}
```

### Key Data Structures

```typescript
interface StomachState {
  plantMatter: number;    // u^2 of plant material in stomach
  meatMatter: number;     // u^2 of meat material in stomach
  capacity: number;       // max u^2 = (Size2D / 2) * StomachMultiplier
}

interface DigestResult {
  energyGained: number;       // total energy extracted this tick
  plantDigested: number;      // u^2 of plant consumed this tick
  meatDigested: number;       // u^2 of meat consumed this tick
  wasteEnergy: number;        // energy lost to inefficiency (returned to biomass)
}

interface EatResult {
  consumed: number;           // u^2 of material eaten
  materialType: 'plant' | 'meat';
  remainingPelletSize: number;
}

interface MaterialProperties {
  energyDensity: number;      // E per u^2
  massDensity: number;        // g per u^2
  hardness: number;           // minimum STR to bite
  reactivity: number;         // u^2/s digestion rate factor
  maxConversionEff: number;   // peak efficiency for fully adapted diet
}

/** Material constants. */
const MATERIALS: Record<string, MaterialProperties> = {
  plant: {
    energyDensity: 1.0,
    massDensity: 0.5,
    hardness: 0.5,
    reactivity: 1.0,
    maxConversionEff: 0.55,
  },
  meat: {
    energyDensity: 3.0,
    massDensity: 1.5,
    hardness: 1.5,
    reactivity: 2.0,
    maxConversionEff: 0.80,
  },
};
```

### Algorithm

#### Stomach Capacity

```
Size1D = sizeRatio * sqrt(maturity) * baseSize
Size2D = PI * Size1D^2
capacity = (Size2D / 2) * StomachMultiplier
```

A default organism (sizeRatio=1.0, maturity=1.0) has Size2D ~ 3.14 * 1^2 * baseSize^2. With standard baseSize yielding Size2D ~ 42 u^2, capacity ~ 21 u^2.

#### Eating

```
remainingCapacity = capacity - (plantMatter + meatMatter)
maxBiteSize = STR * mouthStrengthMult * Size1D

if pellet.hardness > STR * 3:
    return { consumed: 0 }   // too hard to bite

consumed = min(pellet.size, remainingCapacity, maxBiteSize)
stomach[pellet.type] += consumed
pellet.size -= consumed
```

#### Digestion (Per Tick)

**Step 1 -- Fullness and Acid Level:**
```
totalContents = plantMatter + meatMatter
fullness = totalContents / capacity       // [0, 1]
acidLevel = brain.getOutput(Digestion)    // [0, 1], from Sigmoid
```

**Step 2 -- Digestion Potential:**
```
if acidLevel <= fullness:
    digestionPotential = Size2D * metabolism * (acidLevel / fullness)
else:
    // Over-digesting: soft cap with diminishing returns
    digestionPotential = Size2D * metabolism * (1.0 + (acidLevel - fullness) * 0.1)
```

**Step 3 -- Split Potential Across Materials:**
```
plantShare = plantMatter / totalContents
meatShare  = meatMatter / totalContents

plantPotential = digestionPotential * plantShare
meatPotential  = digestionPotential * meatShare
```

**Step 4 -- Digestion Rate:**
```
plantDigestionRate = plantPotential * plant.reactivity     // * 1.0
meatDigestionRate  = meatPotential  * meat.reactivity      // * 2.0

plantDigested = min(plantDigestionRate * dt, plantMatter)
meatDigested  = min(meatDigestionRate  * dt, meatMatter)
```

**Step 5 -- Diet Efficiency (Concave Power Curves):**
```
plantEfficiency = 0.55 * (1 - dietGene)^0.7
meatEfficiency  = 0.80 * dietGene^0.7
```

| Diet Gene | Plant Eff | Meat Eff |
|-----------|----------|---------|
| 0.0 | 55% | 0% |
| 0.3 | 40% | 32% |
| 0.5 | 30% | 43% |
| 0.7 | 17% | 55% |
| 1.0 | 0% | 80% |

**Step 6 -- Over-Digestion Efficiency Malus:**
```
if acidLevel > fullness:
    malus = (acidLevel - fullness) / 2
    plantEfficiency *= (1 - malus)
    meatEfficiency  *= (1 - malus)
```

**Step 7 -- Energy Extraction:**
```
plantEnergy = plantDigested * plant.energyDensity * plantEfficiency    // u^2 * E/u^2 * fraction
meatEnergy  = meatDigested  * meat.energyDensity  * meatEfficiency

totalGained = plantEnergy + meatEnergy

// Waste = digested material energy minus extracted energy
plantWaste = plantDigested * plant.energyDensity * (1 - plantEfficiency)
meatWaste  = meatDigested  * meat.energyDensity  * (1 - meatEfficiency)
totalWaste = plantWaste + meatWaste

// Accounting via EnergySystem
EnergySystem.transfer(OrganismReserve, organism, totalGained, Digestion)
EnergySystem.transfer(FreeBiomass, null, totalWaste, DigestionWaste)
```

**Step 8 -- Remove Digested Material:**
```
stomach.plantMatter -= plantDigested
stomach.meatMatter  -= meatDigested
```

### Performance Characteristics

- **Per organism**: ~0.5 microseconds (arithmetic only, no allocations).
- **Full tick (900 organisms)**: ~0.45ms.
- Stomach state is stored inline on the organism struct; no heap allocation per tick.

#### Diet Efficiency Curves

```
Plant efficiency: 0.55 × (1 - diet)^0.7
Meat efficiency: 0.80 × diet^0.7
Fungi efficiency: plantEfficiency × 0.6 (60% of plant efficiency for fungi)
Exponent 0.7 is a hardcoded constant (creates omnivore penalty).
```

### Dependencies

- **BrainEngine**: Reads `Digestion` and `Want2Eat` outputs.
- **EnergySystem**: All energy transfers go through `EnergySystem.transfer()`.
- **PhysicsEngine**: Stomach contents affect organism mass.

---

## 6. CombatSystem

### Description

The CombatSystem resolves melee attacks between organisms, including damage calculation, defense penetration, venom application, knockback forces, and meat generation from combat. It processes attack intentions from the brain and checks spatial adjacency before resolving.

### Public Interface

```typescript
interface CombatSystem {
  /**
   * Process all attack intentions for one tick.
   * For each organism with Want2Attack > 0.5 and an adjacent target:
   *   - Compute damage, apply defense, venom, knockback.
   *   - Generate meat (to stomach if eating, dropped otherwise).
   */
  tick(organisms: Organism[], grid: SpatialHashGrid, dt: number): CombatEvent[];

  /**
   * Resolve a single attack between attacker and target.
   */
  resolveAttack(attacker: Organism, target: Organism, dt: number): AttackResult;

  /**
   * Process ongoing venom effects on all poisoned organisms.
   */
  tickVenom(organisms: Organism[], dt: number): void;

  /**
   * Compute attack force for an organism.
   */
  getAttackForce(organism: Organism): number;
}
```

### Key Data Structures

```typescript
interface AttackResult {
  damage: number;              // final HP damage dealt
  penetrated: boolean;         // whether attack exceeded defense threshold
  meatGenerated: number;       // energy equivalent of meat produced
  meatDestination: 'stomach' | 'ground';
  venomApplied: boolean;
  knockbackForce: Vec2;
}

interface VenomState {
  active: boolean;
  dps: number;                 // damage per second
  remainingDuration: number;   // seconds
  sourceId: number;            // attacker organism ID
}

interface CombatConfig {
  biteDamageSetting: number;        // global damage multiplier
  defensePenetrationThreshold: number; // multiplier for DEF check (default 1.0)
  knockbackMultiplier: number;      // force multiplier for pushback
  baseVenomDamage: number;          // base venom DPS before size scaling
  baseVenomDuration: number;        // 10 seconds default
  venomEnergyCost: number;          // 8 energy per application
  baseAttackCost: number;           // energy cost multiplier per attack
}
```

### Algorithm

#### Attack Resolution

```
// Preconditions
if brain.getOutput(Want2Attack) <= 0.5: skip
target = grid.queryNearest(organism.position, attackRange, isOrganism)
if target == null: skip (still pay energy cost for attempted attack)

// Attack force
attackForce = Want2Attack_output * STR * Size1D * ageStrengthFactor

// Defense check
if attackForce <= target.DEF * defensePenetrationThreshold:
    damage = 0    // cannot penetrate
else:
    baseDamage = attackForce - target.DEF

    // Diminishing defense returns
    damageReduction = 1 - 1 / (1 + target.DEF / 10)

    finalDamage = baseDamage * (1 - damageReduction) * biteDamageSetting
```

Defense reduction examples:
| Target DEF | damageReduction |
|-----------|----------------|
| 0.0 | 0% |
| 1.0 | 9.1% |
| 2.0 | 16.7% |
| 5.0 | 33.3% |
| 10.0 | 50.0% |
| 20.0 | 66.7% |

#### Venom Application

```
if attacker.hasVenomGlands && penetrated:
    // Size-scaled venom DPS
    venomDPS = baseVenomDamage * (attacker.Size1D / target.Size1D)

    // Duration reduced by target immunity
    venomDuration = baseVenomDuration * (1 - target.baseImmuneActivation * 0.5)

    // Venom does NOT stack -- refresh duration but do not increase DPS
    if target.venom.active:
        target.venom.remainingDuration = venomDuration
        // DPS stays at the HIGHER of current and new (no accumulation)
        target.venom.dps = max(target.venom.dps, venomDPS)
    else:
        target.venom = { active: true, dps: venomDPS, remainingDuration: venomDuration }

    // Venom production costs attacker energy
    EnergySystem.transfer(attacker.reserves, FreeBiomass, venomEnergyCost, VenomDamage)
```

#### Knockback

```
knockbackForce = finalDamage * knockbackMultiplier / target.mass
direction = normalize(target.position - attacker.position)
PhysicsEngine.applyImpulse(target, direction * knockbackForce)
```

#### Meat Generation

```
meatEnergy = finalDamage * bodyEnergyToMeatRatio

if brain.getOutput(Want2Eat) > 0.5:
    // Feed directly into attacker's stomach
    remainingCapacity = DigestiveSystem.getCapacity(attacker) - stomachContents
    toStomach = min(meatEnergy / meat.energyDensity, remainingCapacity)
    attacker.stomach.meatMatter += toStomach
    excessEnergy = meatEnergy - (toStomach * meat.energyDensity)
    if excessEnergy > 0:
        spawn meat pellet at target position with excessEnergy
else:
    // Drop meat pellet at attack site
    spawn meat pellet at target.position with meatEnergy
```

#### Energy Cost (Attacker Always Pays)

```
attackEnergyCost = baseAttackCost * STR * Size1D * Want2Attack_output * metabolism
EnergySystem.transfer(attacker.reserves, FreeBiomass, attackEnergyCost, MovementBurn)
```

### Performance Characteristics

- **Per attack resolution**: ~1 microsecond (arithmetic + one grid query for adjacency already computed during sensing).
- **Venom tick**: O(numPoisonedOrganisms), typically < 50. ~0.01ms.
- **Full tick**: ~0.1ms. Most organisms are not attacking on any given tick.

#### Additional Combat Mechanics

**Armor directional blocking**: Combat checks angle between attacker approach vector and defender heading. Front armor covers forward 180° (±90° from heading). Back armor covers rear 180°. Only the chosen direction (design-time radio button) provides the armor bonus.

**Venom immunity**: Universal DoT resistance via `immuneStrength` gene:
- Venom duration reduced by up to 50%: `duration × (1 - immuneStrength × 0.5)`
- Toxic fungi damage reduced by up to 30%: `damage × (1 - immuneStrength × 0.3)`
- Plague infection chance reduced by up to 40%: `chance × (1 - immuneStrength × 0.4)`

**Camouflage attack break**: Attacking while camouflaged breaks camo for 5 seconds. `camoBreakTimer = 5.0` on successful attack. No detection reduction while timer > 0.

### Dependencies

- **BrainEngine**: Reads `Want2Attack`, `Want2Eat` outputs.
- **SpatialHashGrid**: Adjacency check for valid targets.
- **PhysicsEngine**: Applies knockback impulses.
- **DigestiveSystem**: Deposits meat into stomach when eating.
- **EnergySystem**: Energy transfer accounting for damage, venom, costs.
- **EventDetector**: Emits kill events when target health reaches 0.

---

## 7. ReproductionSystem

### Description

The ReproductionSystem manages the organism lifecycle from egg energy accumulation through laying, incubation, and hatching. Supports both asexual (default) and sexual reproduction modes. The brain controls intent (`Want2Reproduce` for egg production, `Want2Mate` for sexual fertilization), but biological preconditions must also be met. Offspring inherit the parent's genome — with mutations for asexual, or crossover + mutations for sexual reproduction — applied by the GeneticsEngine.

### Public Interface

```typescript
interface ReproductionSystem {
  /**
   * Process one tick of reproduction for all organisms.
   * Handles: egg energy accumulation, laying, incubation timers, hatching.
   */
  tick(organisms: Organism[], eggs: Egg[], dt: number): ReproductionEvents;

  /**
   * Compute the total energy cost to produce an egg for a given organism.
   */
  computeEggCost(organism: Organism): number;

  /**
   * Check whether an organism meets all reproduction preconditions.
   */
  canReproduce(organism: Organism): boolean;

  /**
   * Get the egg readiness ratio [0, 1] for the EggStored input node.
   */
  getEggReadiness(organism: Organism): number;

  /**
   * Check whether two organisms can sexually reproduce (all fertilization conditions).
   * Returns false if either organism is not a sexual species.
   */
  canMate(female: Organism, male: Organism): boolean;

  /**
   * Execute sexual fertilization between two organisms.
   * Female's egg + male's energy contribution → crossover offspring egg.
   * Both parents enter mating cooldown. Returns the fertilized egg.
   */
  fertilize(female: Organism, male: Organism): Egg;

  /**
   * Compute the nest bonus for an egg based on nearby same-species pheromone emitters.
   * Returns { hatchTimeMultiplier, startingEnergyMultiplier }.
   */
  computeNestBonus(egg: Egg, grid: SpatialHashGrid): NestBonus;
}
```

### Key Data Structures

```typescript
interface EggOrgan {
  storedEnergy: number;       // energy accumulated so far toward the egg
  requiredEnergy: number;     // total cost to complete the egg (computed once)
  isReady: boolean;           // storedEnergy >= requiredEnergy
}

interface Egg {
  id: number;
  position: Vec2;
  energy: number;             // total energy invested
  parentId: number;           // mother for sexual, sole parent for asexual
  fatherId: number | null;    // father for sexual reproduction, null for asexual
  speciesId: string;
  genome: GeneSet;            // mutated/crossover child genome (from GeneticsEngine)
  brain: CompiledBrain;       // mutated/crossover child brain
  incubationTimer: number;    // seconds remaining until hatch (affected by nest bonus)
  hatchTime: number;          // total incubation duration (from HatchTime gene)
  broodTime: number;          // from BroodTime gene
  nestBonus: number;          // [0, 0.5] current nest bonus (recalculated each tick)
  isSexual: boolean;          // whether this egg was produced via sexual reproduction
}

interface NestBonus {
  bonus: number;                     // [0, 0.5] raw nest bonus value
  hatchTimeMultiplier: number;       // 1.0 - nestBonus * 0.4 (down to 0.8 = 20% faster)
  startingEnergyMultiplier: number;  // 1.0 + nestBonus * 0.3 (up to 1.15 = 15% more)
  nearbyEmitters: number;            // count of same-species organisms emitting pheromone near egg
}

interface ReproductionEvents {
  eggsLaid: EggLaidEvent[];
  eggsHatched: EggHatchedEvent[];
  fertilizations: FertilizationEvent[];
}

interface EggLaidEvent {
  parentId: number;
  eggId: number;
  position: Vec2;
  eggCost: number;
}

interface EggHatchedEvent {
  eggId: number;
  offspringId: number;
  position: Vec2;
  maturity: number;
  mutations: MutationRecord[];
  nestBonus: number;           // nest bonus at time of hatching
}

interface FertilizationEvent {
  motherId: number;
  fatherId: number;
  eggId: number;
  position: Vec2;
  maleEnergyCost: number;      // 30% of egg cost paid by male
}
```

### Algorithm

#### Egg Energy Accumulation (Gradual)

Each tick, if the organism has spare energy:
```
investRate = metabolism * baseInvestRate * dt
// Organism only invests when it has surplus energy above a threshold
if organism.energy > organism.maxEnergy * 0.3:
    invest = min(investRate, organism.energy * 0.1, eggOrgan.requiredEnergy - eggOrgan.storedEnergy)
    EnergySystem.transfer(OrganismReserve, Egg, invest, EggInvest)
    eggOrgan.storedEnergy += invest

eggOrgan.isReady = (eggOrgan.storedEnergy >= eggOrgan.requiredEnergy)
```

The `EggStored` input node reads: `eggOrgan.storedEnergy / eggOrgan.requiredEnergy`.

#### Egg Cost Formula

```
eggCost = growthEnergyToReachBirthSize
        + physicalTraitCosts * bodyEnergyRatio
        + brainComplexityCost * (numHiddenNodes * 2 + numSynapses * 0.5)
        + baseEggEnergy
```

Where:
- `growthEnergyToReachBirthSize` = energy needed to grow the offspring to its initial maturity level.
- `physicalTraitCosts` = total BP-equivalent energy investment (STR, DEF, ViewRadius, etc.).
- `brainComplexityCost` = energy scaling for brain maintenance overhead.
- `baseEggEnergy` = simulation setting guaranteeing a minimum viable offspring.

#### Reproduction Conditions (All Must Be True in Same Tick)

1. `brain.getOutput(Want2Reproduce) > 0.5`
2. `organism.maturity >= 1.0` (fully grown adult)
3. `organism.health >= organism.maxHealth * 0.5` (at least 50% HP)
4. `eggOrgan.isReady == true` (egg energy fully accumulated)

#### Egg Laying

```
genome = GeneticsEngine.mutate(organism.genome)
brain = GeneticsEngine.mutateBrain(organism.brain)

egg = {
    position: organism.position,
    energy: eggOrgan.storedEnergy,
    genome, brain,
    incubationTimer: genome.HatchTime / organism.metabolism,
    hatchTime: genome.HatchTime,
    broodTime: genome.BroodTime,
}

eggOrgan.storedEnergy = 0
eggOrgan.requiredEnergy = computeEggCost(organism)  // recompute for next egg
eggOrgan.isReady = false
```

#### Hatching

Each tick, for each egg:
```
egg.incubationTimer -= dt

if egg.incubationTimer <= 0:
    juvenileMaturity = (egg.hatchTime / egg.broodTime)^2

    newOrganism = createOrganism({
        genome: egg.genome,
        brain: egg.brain,
        position: egg.position,
        maturity: juvenileMaturity,
        energy: egg.energy - growthCostForMaturity(juvenileMaturity),
        health: maxHealthForMaturity(juvenileMaturity),
    })

    EnergySystem.transfer(Egg, OrganismReserve, egg.energy, EggHatch)
    destroy egg
    emit EggHatchedEvent
```

The `(HatchTime / BroodTime)^2` formula means:
- HatchTime = BroodTime: born at maturity 1.0 (full adult, but expensive egg).
- HatchTime = BroodTime * 0.5: born at maturity 0.25 (small juvenile).
- HatchTime = BroodTime * 0.1: born at maturity 0.01 (tiny hatchling).

#### Sexual Fertilization (Sexual Reproduction Trait Only)

When both organisms have the Sexual Reproduction trait, egg laying is replaced by a two-step process:

**Step 1 — Egg production (female only):** Same as asexual egg accumulation. Female's `Want2Reproduce > 0.5` drives egg production. `EggStored` reports progress.

**Step 2 — Fertilization (both organisms):**
```
// All conditions checked in canMate():
if female.species == male.species
   && female.genome.Sex == 0 && male.genome.Sex == 1
   && female.brain.getOutput(Want2Mate) > 0.5
   && male.brain.getOutput(Want2Mate) > 0.5
   && female.maturity >= 1.0 && male.maturity >= 1.0
   && female.health >= female.maxHealth * 0.5
   && male.health >= male.maxHealth * 0.5
   && female.eggOrgan.isReady
   && male.energy >= computeEggCost(female) * 0.3
   && distance(female, male) < female.radius + male.radius
   && female.matingCooldown <= 0 && male.matingCooldown <= 0:

    // Male pays 30% of egg cost
    maleContribution = computeEggCost(female) * 0.3
    male.energy -= maleContribution

    // Crossover genome (see GeneticsEngine.crossover)
    genome = GeneticsEngine.crossover(female.genome, male.genome)
    brain = GeneticsEngine.crossoverBrain(female.brain, male.brain)

    // Assign random sex to offspring
    genome.Sex = random() < 0.5 ? 0.0 : 1.0

    // Standard mutation pass on crossover result
    genome = GeneticsEngine.mutate(genome)
    brain = GeneticsEngine.mutateBrain(brain, genome)

    egg = {
        position: female.position,
        energy: female.eggOrgan.storedEnergy + maleContribution,
        parentId: female.id,
        fatherId: male.id,
        genome, brain,
        incubationTimer: genome.HatchTime / female.metabolism,
        hatchTime: genome.HatchTime,
        broodTime: genome.BroodTime,
        nestBonus: 0,
        isSexual: true,
    }

    // Reset female egg organ, apply cooldown to both
    female.eggOrgan.storedEnergy = 0
    female.eggOrgan.isReady = false
    female.matingCooldown = 60  // simulation-seconds
    male.matingCooldown = 60

    emit FertilizationEvent
```

#### Nest Bonus Calculation

Each tick, for each incubating egg, the nest bonus is recalculated:
```
function computeNestBonus(egg: Egg, grid: SpatialHashGrid): NestBonus {
    nearbyEmitters = grid.countNearbyMatching(
        egg.position,
        egg.radius * 2,               // 2x egg radius search range
        egg.speciesId,
        (org) => org.brain.getOutput(EmitPheromone1) > 0.3
              || org.brain.getOutput(EmitPheromone2) > 0.3
              || org.brain.getOutput(EmitPheromone3) > 0.3
    )

    bonus = min(0.5, nearbyEmitters * 0.1)
    // 1 emitter = 10%, 3 = 30%, 5+ = 50% (cap)

    return {
        bonus,
        hatchTimeMultiplier: 1.0 - bonus * 0.4,       // min 0.8 (20% faster)
        startingEnergyMultiplier: 1.0 + bonus * 0.3,   // max 1.15 (15% more energy)
        nearbyEmitters,
    }
}
```

The nest bonus affects hatching:
```
// Modified hatching with nest bonus:
egg.incubationTimer -= dt * (1.0 / egg.nestBonusResult.hatchTimeMultiplier)
// Effectively: faster timer when hatchTimeMultiplier < 1.0

// On hatch, offspring gets bonus starting energy:
startingEnergy = (egg.energy - growthCost) * egg.nestBonusResult.startingEnergyMultiplier
```

### Performance Characteristics

- **Egg accumulation**: ~0.2 microseconds per organism (one conditional + arithmetic).
- **Egg laying**: ~5 microseconds (genome clone + mutation + brain clone + mutation).
- **Sexual fertilization**: ~10 microseconds (crossover + mutation + condition checks).
- **Nest bonus**: ~1 microsecond per egg (spatial query + count).
- **Hatching**: ~3 microseconds per egg (organism creation).
- **Full tick**: ~0.4ms (900 organisms x accumulation + ~10-30 layings/hatchings + nest bonus per tick).

### Dependencies

- **BrainEngine**: Reads `Want2Reproduce` and `Want2Mate` outputs; provides `EggStored`, `Sex`, `MatingCooldown`, `NearbyEggCount`, `NearestEggAngle`, `NearestEggDist` inputs.
- **GeneticsEngine**: Mutates genome and brain for asexual offspring; crossover + mutate for sexual offspring.
- **SpatialHashGrid**: Encounter range queries for mate detection; nearby egg queries; nest bonus emitter counting.
- **EnergySystem**: Energy transfers for egg investment, male fertilization contribution, and hatching.
- **EventDetector**: Emits birth and fertilization events.

#### Spore Dispersal Branch
When organism has Spore Dispersal trait and `SporeDispersal output > 0.5`:
- Calculate random direction and distance within `[maxRange×0.25, maxRange]`
- Create Spore entity (0x06) with 0.5s parabolic flight
- Spore cost: 1.3× normal egg cost, 2× mutation variance
- Germination rate: 30% (70% fail and dissolve)
- Offspring: 60% normal birth size

#### Nest Bonus Calculation
When egg is laid and parent has `nestAffinity > 0`:
- Count nearby same-species organisms emitting pheromone within 2× egg radius
- Hatch speed bonus: `min(nestAffinity × 0.5, nearbyEmitters × 0.1)` — up to 50% faster
- Starting energy bonus: `min(nestAffinity × 0.15, nearbyEmitters × 0.03)` — up to 15% more

#### Sexual Mate Detection
Mate detection uses a dedicated filtered spatial query (separate from NearestOrganism) that returns nearest same-species, opposite-sex, mature organism within view radius.

---

## 8. GeneticsEngine

### Description

The GeneticsEngine handles genome representation, mutation mechanics during reproduction, mutation tracking, and the daily mutation selection system. It implements the Poisson-distributed mutation count, Gaussian relative+absolute value changes, brain structural mutations, fitness-scored mutation records, and the daily curation algorithm that presents 3 diverse options to the player.

### Public Interface

```typescript
interface GeneticsEngine {
  /**
   * Produce a mutated copy of a parent's gene set.
   * Number of mutations drawn from Poisson(geneMutationChance).
   * Each mutation applies relative + absolute Gaussian perturbation.
   */
  mutate(parentGenes: GeneSet): MutateResult;

  /**
   * Produce a mutated copy of a parent's compiled brain.
   * Number of mutations drawn from Poisson(brainMutationChance).
   * Mutation types: 80% weight shift, 5% bias shift, 10% add synapse, 5% remove synapse.
   */
  mutateBrain(brain: CompiledBrain, genes: GeneSet): BrainMutateResult;

  /**
   * Produce a crossover gene set from two parents (sexual reproduction).
   * Per-gene: 40% mother, 40% father, 20% blended (weight 0.3-0.7).
   * Sex gene is randomly assigned, not crossed over.
   */
  crossover(motherGenes: GeneSet, fatherGenes: GeneSet): GeneSet;

  /**
   * Produce a crossover brain from two parents (sexual reproduction).
   * Mother's topology as base. Shared synapses: weight crossover.
   * Mother-only synapses: keep 70%, drop 30%.
   * Father-only synapses: add 30%, skip 70%.
   */
  crossoverBrain(motherBrain: CompiledBrain, fatherBrain: CompiledBrain): CompiledBrain;

  /**
   * Record a mutation event for pool tracking.
   */
  recordMutation(record: MutationRecord): void;

  /**
   * Update a mutation record when the offspring dies (finalizes lifespan/reproduction data).
   */
  finalizeMutationRecord(offspringId: number, lifespan: number, reproduced: boolean, descendants: number): void;

  /**
   * Generate the daily mutation selection options for a species.
   * Filters successful mutations, ranks by fitness, picks 3 diverse options.
   */
  generateDailyOptions(speciesId: string): DailyMutationOptions;

  /**
   * Apply a selected daily mutation to the species template.
   */
  applyDailyMutation(speciesId: string, option: MutationOption): void;

  /**
   * Get mutation pool statistics for the transparency UI.
   */
  getMutationPoolStats(speciesId: string): MutationPoolStats;
}
```

### Key Data Structures

```typescript
/** Complete gene set carried by every organism. */
interface GeneSet {
  // Body genes
  SizeRatio: number;             // 0.3 - 3.0
  SpeedRatio: number;            // 0.2 - 2.5
  Strength: number;              // 0.1 - 5.0
  Defense: number;               // 0.0 - 4.0
  Diet: number;                  // 0.0 - 1.0
  ViewAngle: number;             // 15 - 360 degrees
  ViewRadius: number;            // 1.0 - 10.0
  Metabolism: number;            // 0.5 - 3.0
  StomachMultiplier: number;     // 0.3 - 2.0

  // Color genes
  RedColor: number;              // 0.0 - 1.0
  GreenColor: number;            // 0.0 - 1.0
  BlueColor: number;             // 0.0 - 1.0

  // Reproduction genes
  LayTime: number;               // seconds to produce an egg
  BroodTime: number;             // total parental investment period
  HatchTime: number;             // incubation time after laying
  Sex: number;                   // 0.0=female, 1.0=male (immutable, randomly assigned at birth, only for sexual species)

  // Biology genes
  GrowthScale: number;           // growth rate multiplier
  GrowthMaturityFactor: number;  // diminishing growth factor
  GrowthMaturityExponent: number; // growth curve exponent
  InternalClockPeriod: number;   // seconds per Tic cycle
  BaseImmuneActivation: number;  // 0.0 - 1.0 disease/venom resistance
  FatStorageThreshold: number;   // energy ratio to begin fat deposit
  FatStorageDeadband: number;    // hysteresis band for fat system

  // Social genes (affect herding behavior)
  HerdSeparationWeight: number;
  HerdAlignmentWeight: number;
  HerdCohesionWeight: number;
  HerdVelocityWeight: number;
  HerdSeparationDistance: number;

  // Meta-mutation genes (control mutation rates themselves)
  GeneMutationChance: number;    // lambda for Poisson (typical: ~2.0)
  GeneMutationVariance: number;  // magnitude (typical: ~0.15)
  BrainMutationChance: number;   // lambda for Poisson (typical: ~1.5)
}

interface MutationRecord {
  id: string;
  speciesId: string;
  geneId: string;                // which gene or "brain:synapse:3" / "brain:bias:7"
  oldValue: number;
  newValue: number;
  parentId: number;
  offspringId: number;
  offspringLifespan: number;     // updated on death
  offspringReproduced: boolean;  // updated on death
  offspringDescendants: number;  // updated over time
  timestamp: number;             // tick number
  fitnessScore: number;          // computed when finalized
}

interface MutateResult {
  genes: GeneSet;
  mutations: MutationRecord[];
}

interface BrainMutateResult {
  brain: CompiledBrain;
  mutations: MutationRecord[];
}

interface MutationOption {
  id: string;
  category: 'body' | 'brain' | 'convergent';
  geneId: string;
  oldValue: number;
  newValue: number;
  fitnessScore: number;
  description: string;           // human-readable, e.g., "SpeedRatio: 1.2 -> 1.35 (+12.5%)"
  sourceGeneration: number;
  frequency: number;             // how many times similar mutation appeared in pool
  sourceSummary: string;         // e.g., "Offspring survived 2.3x longer than average"
}

interface DailyMutationOptions {
  options: MutationOption[];     // exactly 3 (or fewer if pool is sparse)
  poolSize: number;              // total mutations in rolling window
  successRate: number;           // fraction of mutations deemed successful
}

interface MutationPoolStats {
  totalMutations24h: number;
  totalBirths24h: number;
  beneficialCount: number;
  neutralCount: number;
  harmfulCount: number;
  geneHeatmap: Record<string, number>;   // gene -> mutation count
  trendArrows: Record<string, 'up' | 'down' | 'stable'>; // gene -> direction
  averageFitnessScore: number;
}
```

### Algorithm

#### Gene Mutation (Per Reproduction)

**Step 1 -- Mutation Count:**
```
numMutations = PoissonSample(lambda = parent.GeneMutationChance)
// With GeneMutationChance ~ 2.0, typical outcomes: 0(13.5%), 1(27%), 2(27%), 3(18%), 4+(14.5%)
```

**Step 2 -- For Each Mutation Event:**
```
gene = uniformRandomSelect(allGeneNames)
oldValue = parent.genes[gene]

// Relative mutation (preserves proportional scale)
u = GaussianSample(mean = 0, sigma = 1)
v = (1 + parent.GeneMutationVariance) ^ u
intermediate = v * oldValue

// Absolute mutation (prevents stuck-at-zero)
u_abs = GaussianSample(mean = 0, sigma = 0.01 + parent.GeneMutationVariance / 20)
newValue = intermediate + u_abs

// Clamp to gene's valid range
newValue = clamp(newValue, gene.minValue, gene.maxValue)

child.genes[gene] = newValue
record mutation: { geneId: gene, oldValue, newValue, ... }
```

The relative component `(1 + MutationVariance)^u` with `u ~ N(0,1)` has key properties:
- `u = 0` -> `v = 1` -> no change (most likely single outcome).
- `u = +1` -> `v = 1 + MV` -> increase by MutationVariance (~15%).
- `u = -1` -> `v = 1 / (1 + MV)` -> decrease by ~13%.
- The log-normal distribution ensures equal probability of doubling vs halving, preventing directional bias.

With default `MutationVariance = 0.15`, typical mutations shift a gene by 5-20% of its current value.

#### Brain Mutation (Per Reproduction)

**Step 1 -- Count:**
```
numBrainMutations = PoissonSample(lambda = parent.BrainMutationChance)
```

**Step 2 -- For Each Mutation, Roll Type:**

| Roll (0-1) | Type | Probability | Description |
|-----------|------|-------------|-------------|
| [0, 0.80) | Weight Shift | 80% | Random synapse weight changes by relative+absolute formula |
| [0.80, 0.85) | Bias Shift | 5% | Random node bias changes by relative+absolute formula |
| [0.85, 0.95) | Add Synapse | 10% | New random connection with small initial weight N(0, 0.5) |
| [0.95, 1.0) | Remove Synapse | 5% | Random existing synapse is disabled |

Weight and bias shifts use the same `(1+MV)^u * old + u_abs` formula as gene mutations.

New synapses connect any non-input node to any non-input, non-same node (no self-loops). The topological sort is re-executed after structural mutations.

#### Gene Crossover (Sexual Reproduction)

For sexual species, crossover precedes mutation. The offspring genome is a blend of both parents:

```
function crossover(mother: GeneSet, father: GeneSet): GeneSet {
    child = {}
    for gene in allGeneNames:
        if gene == 'Sex':
            child.Sex = random() < 0.5 ? 0.0 : 1.0  // Random, not crossed over
            continue

        roll = random()
        if roll < 0.40:
            child[gene] = mother[gene]                // 40%: mother's value
        elif roll < 0.80:
            child[gene] = father[gene]                // 40%: father's value
        else:
            w = random(0.3, 0.7)                      // 20%: blended
            child[gene] = mother[gene] * w + father[gene] * (1 - w)

    return child
}
```

#### Brain Crossover (Sexual Reproduction)

Mother's brain topology is the structural base. Synapses are merged probabilistically:

```
function crossoverBrain(mother: CompiledBrain, father: CompiledBrain): CompiledBrain {
    child = clone(mother)

    // Shared synapses: crossover weights
    for synapse in child.synapses:
        fatherMatch = father.findSynapse(synapse.source, synapse.dest)
        if fatherMatch:
            synapse.weight = crossoverGene(synapse.weight, fatherMatch.weight)
            // Same 40/40/20 rule as gene crossover

    // Mother-only synapses: keep 70%, drop 30%
    for synapse in child.synapses:
        if !father.hasSynapse(synapse.source, synapse.dest):
            if random() < 0.30:
                child.removeSynapse(synapse)

    // Father-only synapses: add 30%, skip 70%
    for synapse in father.synapses:
        if !mother.hasSynapse(synapse.source, synapse.dest):
            if random() < 0.30:
                child.addSynapse(synapse)

    // Node biases: crossover for shared nodes, keep mother's, add 30% of father's unique nodes
    // Same logic as synapses

    // Re-run topological sort after structural changes
    child.recomputeTopologicalOrder()

    return child
}
```

After crossover, the standard mutation pass (gene mutation + brain mutation) is applied to the crossover result. This means sexual offspring get diversity from both crossover AND mutation.

#### Mutation Record Finalization

When an offspring dies:
```
record.offspringLifespan = ageAtDeath
record.offspringReproduced = (numOffspringLaid > 0)
record.offspringDescendants = countDescendants(offspringId)

medianLifespan = species.getMedianLifespan()
record.fitnessScore = (record.offspringLifespan / medianLifespan)
                    + (record.offspringReproduced ? 2.0 : 0)
                    + (record.offspringDescendants * 0.5)
```

#### Daily Selection Algorithm

**Step 1 -- Filter Successful Mutations (last 24h rolling window):**
```
pool = mutationRecords.filter(r =>
    r.timestamp > now - 24h
    && r.speciesId == speciesId
    && (r.offspringLifespan > medianLifespan * 0.8 || r.offspringReproduced)
)
```

**Step 2 -- Rank by fitnessScore.**

**Step 3 -- Pick 3 Diverse Options:**
1. **Best body gene mutation**: Highest `fitnessScore` among records where `geneId` is a body/color/reproduction/biology/social/meta gene.
2. **Best brain mutation**: Highest `fitnessScore` among records where `geneId` starts with `brain:`.
3. **Most common successful mutation**: The `(geneId, direction)` pair that appears most frequently among successful mutations -- indicating convergent evolutionary pressure.

If any category has zero candidates, fall back to the next-best from another category.

**Step 4 -- Present to Player:** Each option includes human-readable description, source organism info, fitness score, and frequency.

### Performance Characteristics

- **Gene mutation (per birth)**: ~5 microseconds (2-3 Poisson draws, 2-3 Gaussian draws, hash lookups).
- **Brain mutation (per birth)**: ~8 microseconds (includes possible topological re-sort for structural mutations).
- **Mutation recording**: O(1) per record (append to ring buffer).
- **Daily selection**: O(P) where P = pool size (~500-2000 records). Runs once per day. ~1ms.
- **Memory**: MutationRecord is ~120 bytes. 2000 records in rolling window = ~240 KB per species.

### Dependencies

- **BrainEngine**: Provides `CompiledBrain` for brain mutation; re-compiles after structural changes.
- **ReproductionSystem**: Calls `mutate()` and `mutateBrain()` during egg laying.
- **EventDetector**: Finalizes records on organism death.
- **SpeciesManager**: Provides species template for daily mutation application.

#### Mutation Pool — Rolling Window & Convergence

**Median lifespan**: Rolling window of last 200 deaths per species. Used to define "successful" mutations (offspring lifespan > 80% of median OR offspring reproduced).

**Convergent evolution detection** (per-gene tracking):
- For each gene, track direction of successful mutations
- If 60%+ mutations in same direction (increase or decrease) across 5+ samples → gene is converging
- Convergent genes are offered as daily mutation options with higher priority

**New evolvable genes**:
- `EncounterMemoryDuration`: Range 5-30s. Controls how long encounter memory persists.
- `BurrowSpeed`: Range 1.0-2.5s. Controls surfacing transition time.
- `BurrowEfficiency`: Range 1.5-2.5×. Controls underground metabolism multiplier.
- `SoundFrequency`: Range 0-1. Base sound emission frequency.

---

## 9. EnvironmentEngine

### Description

The EnvironmentEngine manages the living world around the organisms: biome distribution, seasonal cycles, day/night transitions, fungi growth and effects, and the pheromone diffusion grid. It updates environmental state each tick and provides query methods for other systems to read biome properties, season modifiers, lighting conditions, pheromone concentrations, and fungi effects at any world position.

### Public Interface

```typescript
interface EnvironmentEngine {
  /**
   * Initialize the environment from a world seed or saved state.
   */
  initialize(config: EnvironmentConfig): void;

  /**
   * Advance all environment systems by one tick.
   * Updates: season phase, day/night, pheromone diffusion/decay,
   * fungi growth/effects, biome boundary shifts.
   */
  tick(dt: number): EnvironmentEvents;

  /**
   * Get the biome type at a world position.
   */
  getBiome(pos: Vec2): BiomeType;

  /**
   * Get all biome modifiers for a position (includes seasonal adjustments).
   */
  getBiomeModifiers(pos: Vec2): BiomeModifiers;

  /**
   * Get the current season and progress within it.
   */
  getSeason(): SeasonState;

  /**
   * Get the current day/night state.
   */
  getDayNightState(): DayNightState;

  /**
   * Read pheromone values at a position (all 3 channels).
   */
  readPheromones(pos: Vec2): PheromoneReading;

  /**
   * Deposit pheromone at a position (called by organism emission).
   */
  depositPheromone(pos: Vec2, channel: 0 | 1 | 2, intensity: number, dt: number): void;

  /**
   * Get pheromone gradient direction at a position (for input nodes).
   */
  getPheromoneGradient(pos: Vec2, channel: 0 | 1 | 2): number;

  /**
   * Get all active fungi in a region.
   */
  queryFungi(pos: Vec2, radius: number): FungusInstance[];

  /**
   * Get the fungi effect at a specific position (aggregate of overlapping fungi).
   */
  getFungiEffect(pos: Vec2): FungiEffect;
}
```

### Key Data Structures

```typescript
enum BiomeType {
  Grassland = 0,
  Forest    = 1,
  Desert    = 2,
  Wetland   = 3,
  Rocky     = 4,
}

interface BiomeModifiers {
  plantDensity: number;        // multiplier on spawn rate
  plantPelletSize: number;     // multiplier on pellet size
  meatDecayRate: number;       // multiplier on decay speed
  visibilityMod: number;       // multiplier on view radius
  movementMod: number;         // multiplier on movement speed (or energy cost)
  movementEnergyCostMod: number; // multiplier on movement energy cost
}

/** Biome base modifier table (before seasonal adjustments). */
const BIOME_MODIFIERS: Record<BiomeType, BiomeModifiers> = {
  [BiomeType.Grassland]: { plantDensity: 1.0, plantPelletSize: 1.0, meatDecayRate: 1.0, visibilityMod: 1.0, movementMod: 1.0, movementEnergyCostMod: 1.0 },
  [BiomeType.Forest]:    { plantDensity: 1.5, plantPelletSize: 1.5, meatDecayRate: 0.7, visibilityMod: 0.7, movementMod: 1.0, movementEnergyCostMod: 1.0 },
  [BiomeType.Desert]:    { plantDensity: 0.2, plantPelletSize: 0.5, meatDecayRate: 0.3, visibilityMod: 1.3, movementMod: 1.0, movementEnergyCostMod: 1.3 },
  [BiomeType.Wetland]:   { plantDensity: 0.8, plantPelletSize: 1.0, meatDecayRate: 2.0, visibilityMod: 1.0, movementMod: 0.7, movementEnergyCostMod: 1.0 },
  [BiomeType.Rocky]:     { plantDensity: 0.3, plantPelletSize: 0.7, meatDecayRate: 0.5, visibilityMod: 1.0, movementMod: 1.0, movementEnergyCostMod: 1.0 },
};

enum Season {
  Spring = 0,   // days 1-7
  Summer = 1,   // days 8-14
  Autumn = 2,   // days 15-21
  Winter = 3,   // days 22-28
}

interface SeasonState {
  current: Season;
  progress: number;            // [0, 1] within current season
  phase: number;               // [0, 1] within full year (0=start of spring, 1=end of winter)
  plantGrowthMult: number;     // spring=1.5, summer=1.0, autumn=0.7, winter=0.3
  metabolismCostMult: number;  // spring=0.9, summer=1.15, autumn=1.0, winter=1.3
  reproductionCostMult: number; // spring=0.8, else=1.0
  dayLengthMult: number;       // summer=extended day, winter=extended night
}

/** Seasonal modifiers applied on top of biome base values. */
const SEASON_MODIFIERS: Record<Season, Partial<SeasonState>> = {
  [Season.Spring]: { plantGrowthMult: 1.5, metabolismCostMult: 0.9, reproductionCostMult: 0.8 },
  [Season.Summer]: { plantGrowthMult: 1.0, metabolismCostMult: 1.15 },
  [Season.Autumn]: { plantGrowthMult: 0.7, metabolismCostMult: 1.0 },
  [Season.Winter]: { plantGrowthMult: 0.3, metabolismCostMult: 1.3 },
};

interface DayNightState {
  isNight: boolean;
  cycleProgress: number;       // [0, 1] through the full day/night cycle
  viewRadiusMult: number;      // 1.0 during day, 0.6 during night
}

/**
 * Pheromone grid: 3 independent channels on a 25x25 grid (same as spatial hash).
 * Each cell stores a float intensity for each channel.
 */
interface PheromoneGrid {
  channels: [Float64Array, Float64Array, Float64Array]; // each 625 elements (25x25)
  decayRate: number;           // fraction lost per second
  diffusionRate: number;       // fraction exchanged with neighbors per second
}

interface PheromoneReading {
  red: number;                 // channel 0 intensity at position
  green: number;               // channel 1
  blue: number;                // channel 2
}

enum FungusType {
  Decomposer       = 0,  // 3x meat decay, 2x plant regrowth in adjacent cells
  ToxicMold         = 1,  // 0.5 HP/s damage in area
  NutrientNetwork   = 2,  // redistributes plant energy evenly across network
  ParasiticBloom    = 3,  // 0.3 E/s drain on passing organisms
  Bioluminescent    = 4,  // emits false food signal
}

interface FungusInstance {
  id: number;
  type: FungusType;
  position: Vec2;
  radius: number;              // effect radius in cells
  age: number;                 // seconds since spawn
  maxAge: number;              // duration before natural decay
  strength: number;            // effect intensity (grows over time)
}

interface FungiEffect {
  meatDecayMult: number;       // 1.0 = no effect, 3.0 = decomposer
  plantRegrowthMult: number;
  hpDamagePerSec: number;      // from toxic mold
  energyDrainPerSec: number;   // from parasitic bloom
  falseFoodSignal: boolean;    // from bioluminescent
}

interface EnvironmentConfig {
  worldSeed: number;
  seasonCycleDays: number;     // 28 real-time days for full cycle
  dayNightCycleHours: number;  // 6 real-time hours per full day/night cycle
  pheromoneDecayRate: number;
  pheromoneDiffusionRate: number;
}

type EnvironmentEvents = {
  seasonChanged?: { from: Season; to: Season };
  fungiSpawned?: FungusInstance[];
  fungiExpired?: number[];     // fungus IDs
  biomeShifts?: BiomeShiftEvent[];
};
```

### Algorithm

#### Season Cycle

> **Wall-clock-based**: Season advancement uses wall-clock delta, not `dt` or tick counts. This makes season timing independent of `SIM_TPS` — seasons always take exactly 28 real days regardless of simulation speed.

```
// 28 real-time days per full cycle, 4 seasons of 7 days each
totalCycleSeconds = seasonCycleDays * 24 * 3600         // = 28 * 86400 = 2,419,200 seconds

// Wall-clock delta (passed from game loop, in seconds)
wallClockDeltaSec = (currentWallTimeMs - lastWallTimeMs) / 1000
seasonPhase += wallClockDeltaSec / totalCycleSeconds

currentSeason = floor(seasonPhase * 4) % 4
seasonProgress = (seasonPhase * 4) % 1.0

// Smooth transition: blend modifiers over a 2-3 day window at season boundaries
if seasonProgress < transitionWindow:
    blend = seasonProgress / transitionWindow
    modifiers = lerp(prevSeasonModifiers, currentSeasonModifiers, blend)
```

#### Biome-Season Interactions

- **Spring**: Wetland expands into adjacent grassland cells. Forest becomes denser (+10% plantDensity).
- **Summer**: Desert expands into adjacent grassland edges. Day period extends (+10% view radius bonus).
- **Autumn**: Forest shrinks at edges. Grassland fertility increases (leaf litter).
- **Winter**: Wetland freezes (temporarily becomes Rocky). Rocky expands. Forest at minimum.

Biome boundary shifts are performed by adjusting the biome type of edge cells, applying a smooth gradient via a blend weight.

#### Day/Night Cycle

> **Wall-clock-based**: Like seasons, day/night uses wall-clock delta. Day/night always cycles in 6 real-time hours regardless of `SIM_TPS`.

```
// 6 real-time hours per full cycle
dayNightCycleSeconds = dayNightCycleHours * 3600        // = 6 * 3600 = 21,600 seconds

// Wall-clock delta (same value passed to season cycle)
cycleProgress += wallClockDeltaSec / dayNightCycleSeconds
cycleProgress %= 1.0

// Day = first 2/3 of cycle (4 hours), Night = last 1/3 (2 hours)
isNight = cycleProgress > 0.667
viewRadiusMult = isNight ? 0.6 : 1.0
```

During night, all organisms have their effective view radius multiplied by 0.6 (40% reduction). Echolocation and sound detection are unaffected.

#### Pheromone Diffusion and Decay

Per tick, for each channel, for each cell:
```
// Decay
pheromoneGrid.channels[ch][cellIndex] *= (1 - decayRate * dt)

// Diffusion (4-neighbor average, toroidal)
neighbors = [up, down, left, right]  // with toroidal wrapping
neighborAvg = sum(pheromoneGrid.channels[ch][n] for n in neighbors) / 4
pheromoneGrid.channels[ch][cellIndex] += (neighborAvg - currentValue) * diffusionRate * dt
```

Pheromones persist for ~30 simulation-seconds and diffuse across 5-10 cells depending on emission intensity.

#### Fungi System

**Spawn Conditions:**
- Decomposer: 5+ deaths in an area within 1 hour.
- Toxic Mold: Wetland biome, spring or autumn season.
- Nutrient Network: Forest biome, dense plant clusters (>3x average).
- Parasitic Bloom: 50+ organism transits through a cell per hour.
- Bioluminescent: Rocky biome, winter season.

**Growth:** Fungi have a `strength` that ramps from 0 to 1.0 over their growth period. Effects scale with strength.

**Expiry:** Each fungus type has a `maxAge`. Decomposer expires when local meat supply is exhausted. Others expire after their fixed duration.

### Performance Characteristics

- **Season/day-night update**: O(1) per tick (global state increment). Negligible.
- **Pheromone diffusion**: O(3 * 625) = 1,875 cell updates per tick. ~0.15ms.
- **Fungi updates**: O(numActiveFungi), typically < 20. ~0.01ms.
- **Biome queries**: O(1) per query (grid cell lookup).
- **Total per tick**: ~0.2ms.

### Dependencies

- **SpatialHashGrid**: Pheromone grid uses same cell dimensions; fungi queries use spatial lookup.
- **EnergySystem**: Fungi effects (parasitic bloom drain, toxic mold damage) trigger energy transfers.
- **BrainEngine**: Provides pheromone/biome/season/day-night values to input nodes.

#### Fungi Lifecycle
- **5 types**: Decomposer, Toxic Mold, Nutrient Network, Parasitic Bloom, Bioluminescent
- **Spawn rules**: Death-triggered (5+ deaths in cell → Decomposer), seasonal (Spring/Autumn 2×), biome-dependent (Wetland 3×, Forest 2×, others 1×)
- **Interactions**: Organisms can eat fungi (60% plant energy value). Counts toward Spore Dispersal unlock.

#### Ecological Event System
Hybrid triggering: base random chance per season + ecosystem condition modifiers + admin manual trigger.
- 6 event types: Bloom, Drought, Plague, Migration, Fungi Outbreak, Meteor
- 30-second warning toast before onset

| Event | Base Season | Base Chance | Condition Modifier |
|-------|------------|-------------|-------------------|
| Bloom | Spring | 80% | +20% if plant biomass < 30% |
| Drought | Summer | 60% | +20% if total biomass > 70% |
| Plague | Winter→Spring | 30% | +30% if density > 2× normal |
| Migration | Any | 50% | Bi-weekly check |
| Fungi Outbreak | Spring/Autumn | 70% | +20% if high death count |
| Meteor | Any | 10% | 1/season average |

#### Day/Night View Radius Modifier
```
effectiveViewRadius = ViewRadius × (0.6 + 0.4 × ambientLight)
```
- Noon (ambientLight=1.0): full view radius
- Midnight (ambientLight=0.0): 60% of view radius (-40%)
- Echolocation unaffected by light
- Bioluminescent fungi negate view reduction in their patch

---

## 10. SpeciesManager

### Description

The SpeciesManager controls the lifecycle of species in the world: deploying player species, managing AI placeholder species, enforcing the species entropy mechanic, cycling underperforming AI species, and handling slot allocation when players join, leave, or go extinct. The target is always ~30 active species.

### Public Interface

```typescript
interface SpeciesManager {
  /**
   * Deploy a new player species into the world.
   * Retires the player's current species (if any) and fills slot.
   */
  deploySpecies(playerId: string, design: SpeciesDesign): DeployResult;

  /**
   * Retire a player's species early (10x ageing factor applied).
   */
  retireSpecies(playerId: string): void;

  /**
   * Handle player extinction (0 living organisms).
   * Fills the slot with an AI species.
   */
  handleExtinction(speciesId: string): void;

  /**
   * Tick all species management systems:
   *   - Update entropy multipliers.
   *   - Check for AI species cycling (every 48 hours).
   *   - Rebalance AI count when human slots change.
   */
  tick(dt: number): SpeciesManagerEvents;

  /**
   * Get the current entropy multiplier for a species.
   */
  getEntropyMultiplier(speciesId: string): number;

  /**
   * Get the effective metabolism cost for an organism including species entropy.
   */
  getEffectiveMetabolismCost(organism: Organism): number;

  /**
   * Get the current species roster.
   */
  getRoster(): SpeciesRosterEntry[];

  /**
   * Get AI species count and configuration.
   */
  getAIStatus(): AIStatus;
}
```

### Key Data Structures

```typescript
interface SpeciesDesign {
  name: string;
  description: string;         // max 100 chars
  genes: GeneSet;
  brain: BrainDesign;
  spawnBiome: BiomeType | 'random';
  founderCount: number;        // 1-10
  biomeBPCost: number;         // 0-14+ BP, computed from biome crowding at deploy time
  bpPerOrganism: number;       // 100 - (founderCount - 1) * 5 - biomeBPCost
}

/**
 * Compute the BP cost for spawning in a biome based on current crowding.
 * biomeShare = organismsInBiome / totalOrganisms
 * cost = floor(max(0, (biomeShare - 0.15) * 40))
 * Random biome = 0. World population < 50 = 0.
 */
function computeBiomeBPCost(
  biome: BiomeType | 'random',
  worldState: { biomePopulations: Record<BiomeType, number>; totalPopulation: number }
): number {
  if (biome === 'random') return 0;
  if (worldState.totalPopulation < 50) return 0;
  const biomeShare = worldState.biomePopulations[biome] / worldState.totalPopulation;
  return Math.floor(Math.max(0, (biomeShare - 0.15) * 40));
}

interface SpeciesState {
  id: string;
  playerId: string | null;     // null for AI species
  name: string;
  status: 'deploying' | 'active' | 'retiring' | 'extinct';
  deployedAt: number;          // timestamp
  speciesAge: number;          // real-time seconds since deployment
  entropyMultiplier: number;   // computed from speciesAge
  templateGenes: GeneSet;      // current species template (updated by daily mutations)
  templateBrain: BrainDesign;
  populationCount: number;
  totalBirths: number;
  totalDeaths: number;
  maxGeneration: number;
  aiDesignId?: string;         // reference to AI library design if AI species
}

interface SpeciesRosterEntry {
  id: string;
  name: string;
  playerName: string | null;
  isAI: boolean;
  population: number;
  generation: number;
  entropyMultiplier: number;
  status: string;
  dominanceScore: number;
}

interface AIStatus {
  targetTotal: number;         // 30
  humanCount: number;
  aiCount: number;
  aiSpecies: AISpeciesInfo[];
}

interface AISpeciesInfo {
  speciesId: string;
  designId: string;            // from curated library
  role: string;                // ecological role description
  deployedAt: number;
  performance: number;         // relative fitness score
}

interface DeployResult {
  speciesId: string;
  foundersSpawned: number;
  spawnPositions: Vec2[];
}

type SpeciesManagerEvents = {
  speciesDeployed?: DeployResult;
  speciesRetired?: { speciesId: string };
  speciesExtinct?: { speciesId: string; playerId: string };
  aiCycled?: { removed: string; added: string; reason: string };
};
```

### Algorithm

#### Species Entropy

```
speciesAge = (currentTime - deployedAt) / 3600    // in hours
entropyHalfLife = 72                               // hours (3 days)

entropyMultiplier = 1.0 + (speciesAge / entropyHalfLife)^2
```

| Species Age | Entropy Multiplier | Effect |
|------------|-------------------|--------|
| 0 hours (deploy) | 1.00 | No penalty |
| 24 hours (1 day) | 1.11 | 11% higher metabolism |
| 72 hours (3 days) | 2.00 | Double metabolism |
| 120 hours (5 days) | 5.84 | Nearly 6x metabolism |
| 168 hours (7 days) | 10.4 | Extreme pressure |
| 240 hours (10 days) | 20.4 | Nearly unsustainable |

#### Effective Metabolism Cost

```
effectiveMetabolismCost = baseMetabCost * metabolism * Size2D * entropyMultiplier

where:
  baseMetabCost = simulation setting (energy per second per unit of metabolism * Size2D)
  metabolism = organism's Metabolism gene
  Size2D = organism's 2D body area
  entropyMultiplier = species entropy from above
```

This cost is deducted from the organism's energy reserve every tick. When it exceeds the organism's energy income from digestion, the organism starves.

#### AI Species Management

**Target count:**
```
aiCount = max(0, 30 - activeHumanSpeciesCount)
```

**Curated library:** A library of 15+ hand-designed AI species covering ecological niches:
- Small herbivores (grazers, browsers)
- Large herbivores (megafauna, territorial grazers)
- Small predators (pack hunters, ambush predators)
- Large predators (apex predators, scavenger-predators)
- Omnivores (generalist foragers)
- Specialists (burrowers, camouflage users, venom users, herding species)
- Scavengers (pure meat seekers)

**48-Hour Performance Cycling:**
```
every 48 hours:
    rankedAI = aiSpecies.sortBy(species => species.performanceScore, ascending)
    worstPerformer = rankedAI[0]

    // Replace with a different design from the library that fills a missing niche
    missingNiches = identifyUnderrepresentedNiches(worldState)
    newDesign = aiLibrary.selectForNiche(missingNiches[0], excluding: activeAIDesigns)

    retireSpecies(worstPerformer.speciesId)
    deployAISpecies(newDesign)
```

**Slot Management on Human Join/Leave:**
```
onHumanDeploy(playerId):
    if aiCount > 0:
        // Remove worst-performing AI to make room
        removeWorstAI()
    deployPlayerSpecies(playerId)

onHumanExtinct(playerId):
    // Temporarily fill with AI
    deployAISpecies(selectAppropriateDesign())

onHumanLeave(playerId):
    // Species continues autonomously, entropy still applies
    // If species goes extinct, slot becomes AI
```

### Performance Characteristics

- **Entropy calculation**: O(1) per species per tick (one exponent). ~0.001ms.
- **Effective metabolism**: O(1) per organism per tick. ~0.001ms.
- **AI cycling check**: O(numAISpecies) every 48 hours. Negligible amortized cost.
- **Total per tick**: ~0.01ms (mostly just entropy multiplier lookups).

### Dependencies

- **EnergySystem**: Deducts metabolism costs using `getEffectiveMetabolismCost()`.
- **GeneticsEngine**: Applies daily mutations to species templates.
- **EventDetector**: Receives extinction events to trigger slot management.
- **BrainEngine**: Compiles AI species brains at deployment.

#### Dominance Scoring Formula
Recomputed every 15s:
```
dominanceScore = 0.35 × biomassShare + 0.20 × populationShare + 0.20 × territoryShare + 0.15 × lineageDepth + 0.10 × keystoneBonus
```
- Territory = unique spatial hash cells occupied / total cells
- Weights are fixed constants, not admin-configurable

#### Species Entropy — Admin-Configurable Half-Life
```
entropyMultiplier = 1.0 + (hoursAlive / entropyHalfLife)²
```
- `entropyHalfLife` stored in `worlds` table, range 24-168h, default 72h
- No reset on daily mutation — purely time-based

#### Extinction → AI Placeholder Flow
1. Player species goes extinct
2. AI placeholder deploys immediately (simple herbivore in same biome)
3. Player receives ExtinctionNotificationModal with farewell stats
4. When player redeploys, AI placeholder retires automatically
5. No cooldown on redeployment

---

## 11. EventDetector

### Description

The EventDetector monitors the simulation for significant occurrences and produces structured events that are (a) broadcast in real-time to connected WebSocket clients for the spectating UI and event timeline, and (b) batch-written to the Supabase `event_log` table every 15 seconds for persistence and analytics.

### Public Interface

```typescript
interface EventDetector {
  /**
   * Check all event detection rules against the current world state.
   * Called once per tick after all other systems have processed.
   * Returns newly detected events.
   */
  tick(world: WorldState, dt: number): GameEvent[];

  /**
   * Register a birth event (called by ReproductionSystem).
   */
  recordBirth(event: BirthEventData): void;

  /**
   * Register a death event (called by the death-check phase).
   */
  recordDeath(event: DeathEventData): void;

  /**
   * Register a kill event (called by CombatSystem when target HP reaches 0).
   */
  recordKill(event: KillEventData): void;

  /**
   * Flush pending events to Supabase. Called every 15 seconds.
   */
  flush(): Promise<void>;

  /**
   * Broadcast pending events to all connected WebSocket clients.
   * Called every tick (events are batched per client viewport).
   */
  broadcast(clients: WebSocketClient[]): void;

  /**
   * Subscribe to a specific event type (for internal module listeners).
   */
  on(type: GameEventType, handler: (event: GameEvent) => void): void;

  /**
   * Get recent events for a species (for the event timeline UI).
   */
  getRecentEvents(speciesId: string, limit: number): GameEvent[];
}
```

### Key Data Structures

```typescript
enum GameEventType {
  Birth                = 'birth',
  Death                = 'death',
  Kill                 = 'kill',
  GenerationMilestone  = 'generation_milestone',
  PopulationMilestone  = 'population_milestone',
  WorldEvent           = 'world_event',
  Achievement          = 'achievement',
  SeasonChange         = 'season_change',
  Extinction           = 'extinction',
}

interface GameEvent {
  id: string;                    // unique event ID
  type: GameEventType;
  timestamp: number;             // server tick number
  realTime: number;              // wall-clock timestamp (ISO)
  speciesId?: string;            // relevant species (if applicable)
  playerId?: string;             // relevant player (if applicable)
  position?: Vec2;               // world position (if applicable)
  payload: EventPayload;
}

type EventPayload =
  | BirthEventData
  | DeathEventData
  | KillEventData
  | GenerationMilestoneData
  | PopulationMilestoneData
  | WorldEventData
  | AchievementData
  | SeasonChangeData
  | ExtinctionData;

interface BirthEventData {
  type: 'birth';
  parentId: number;
  offspringId: number;
  generation: number;
  mutations: { geneId: string; oldValue: number; newValue: number }[];
}

interface DeathEventData {
  type: 'death';
  organismId: number;
  speciesId: string;
  cause: DeathCause;
  age: number;                   // ticks alive
  generation: number;
  killerSpeciesId?: string;      // if cause is 'combat'
}

enum DeathCause {
  Starvation   = 'starvation',   // energy reached 0
  Combat       = 'combat',       // killed by another organism
  Venom        = 'venom',        // killed by poison DoT
  Ageing       = 'ageing',       // old age (health decayed to 0)
  Environment  = 'environment',  // fungi damage, meteor, etc.
}

interface KillEventData {
  type: 'kill';
  killerId: number;
  killerSpeciesId: string;
  victimId: number;
  victimSpeciesId: string;
  damageDealt: number;
  usedVenom: boolean;
}

interface GenerationMilestoneData {
  type: 'generation_milestone';
  speciesId: string;
  generation: number;            // 5, 10, 20, 50, 100, ...
}

interface PopulationMilestoneData {
  type: 'population_milestone';
  speciesId: string;
  count: number;                 // 10, 25, 50, 100, ...
  direction: 'up' | 'down';     // reaching or falling below
}

interface WorldEventData {
  type: 'world_event';
  eventName: string;             // 'bloom', 'drought', 'plague', 'migration', 'fungi_outbreak', 'meteor'
  biome?: BiomeType;
  duration: number;              // seconds
  description: string;
}

interface AchievementData {
  type: 'achievement';
  playerId: string;
  achievementId: string;
  name: string;
  epReward: number;
}

interface SeasonChangeData {
  type: 'season_change';
  from: Season;
  to: Season;
}

interface ExtinctionData {
  type: 'extinction';
  speciesId: string;
  playerId: string;
  totalLifespan: number;         // seconds species was active
  maxPopulation: number;
  maxGeneration: number;
  totalOrganismsBorn: number;
}
```

### Algorithm

#### Detection Rules

Events are detected by checking conditions each tick:

**Birth**: Triggered directly by ReproductionSystem via `recordBirth()`.

**Death**: Triggered during the death-check phase. Cause is determined by the system that depleted HP:
- `energy <= 0` at metabolism deduction: Starvation.
- `health <= 0` from CombatSystem damage: Combat.
- `health <= 0` from VenomState tick: Venom.
- `health <= 0` from ageing strength/metabolism spiral: Ageing.
- `health <= 0` from fungi or world event: Environment.

**Kill**: Triggered when CombatSystem damage causes `target.health <= 0`. Both a Death and Kill event are emitted.

**Generation Milestone**: After each birth, check if `newOrganism.generation` crosses a milestone threshold (5, 10, 20, 50, 100, 200, 500).

**Population Milestone**: After each birth or death, check if species population crosses thresholds (10, 25, 50, 100) in either direction.

**Extinction**: After each death, check if `species.populationCount == 0`.

**Season Change**: Detected by EnvironmentEngine, forwarded to EventDetector.

**World Event**: Scheduled by EnvironmentEngine (1-2 per week). Announced 24 hours in advance with a preliminary event, then a start event.

**Achievement**: Checked against player-specific counters. E.g., "First Blood" checks the player's kill count crossing 1.

#### WebSocket Broadcast

Each tick:
```
for each connectedClient:
    relevantEvents = pendingEvents.filter(e =>
        e.speciesId == client.speciesId           // player's own species events
        || (e.position && isInViewport(e.position, client.viewport))  // in viewport
        || e.type in ['world_event', 'season_change']  // global events
    )
    if relevantEvents.length > 0:
        client.send(serializeBinary(relevantEvents))
```

#### Supabase Batch Write

Every 15 seconds (600 ticks at 40 TPS, scales with `SIM_TPS`):
```
batch = eventBuffer.drain()
if batch.length > 0:
    await supabase.from('event_log').insert(batch.map(serializeForDB))
```

Events are buffered in a ring buffer. If the database write fails, events are retained and retried on the next flush cycle.

### Performance Characteristics

- **Detection checks per tick**: O(B + D) where B = births, D = deaths this tick. Milestone checks are O(1) each (threshold comparison). Typically ~10-30 events per tick during active play. ~0.05ms.
- **WebSocket broadcast**: O(E * C) where E = events, C = connected clients. With 30 clients and ~20 events/tick, ~600 filter checks. ~0.1ms.
- **Supabase flush**: Asynchronous, non-blocking. ~50-500 events per batch. Network latency hidden by async.
- **Memory**: Event buffer sized for 15 seconds = ~6,000 events max. At ~100 bytes/event = ~600 KB.

### Dependencies

- **ReproductionSystem**: Calls `recordBirth()`.
- **CombatSystem**: Calls `recordKill()`.
- **EnvironmentEngine**: Provides season change and world event triggers.
- **SpeciesManager**: Receives extinction notifications; triggers AI slot fill.
- **GeneticsEngine**: `recordDeath()` finalizes mutation records via `finalizeMutationRecord()`.
- **Supabase client**: For persistent event storage.

#### Ecological Event Detection
- Checks once per in-game season (~every 15 min real-time)
- Uses hybrid probability: base seasonal chance + ecosystem condition modifiers
- Admin manual trigger available via dev tools
- 30-second EVENT_WARNING broadcast before activation
- Achievement triggers: event survival, species recovery after event, etc.

---

## 12. OrganismRenderer (Client-Side)

### Description

The OrganismRenderer runs entirely on the client (browser). It procedurally generates vector art for each organism based on its physical stats, animates organisms in real-time, and renders the world viewport using Pixi.js (WebGL-backed 2D renderer with Canvas fallback). Organisms are visually distinct -- you can tell an organism's capabilities by looking at it.

### Public Interface

```typescript
interface OrganismRenderer {
  /**
   * Initialize the renderer with a Pixi.js Application and viewport config.
   */
  initialize(app: PIXI.Application, config: RendererConfig): void;

  /**
   * Generate or update the sprite for an organism based on its current stats.
   * Called on first sight and when stats change significantly (growth, damage, etc.).
   */
  generateSprite(organism: RenderableOrganism): PIXI.Container;

  /**
   * Generate an egg sprite (translucent shell overlay on mini parent).
   */
  generateEggSprite(egg: RenderableEgg): PIXI.Container;

  /**
   * Update all visible organism positions, rotations, and animations.
   * Called every render frame (60 fps target).
   */
  updateFrame(visibleEntities: RenderableEntity[], camera: Camera, deltaMs: number): void;

  /**
   * Trigger a specific animation on an organism.
   */
  playAnimation(organismId: number, anim: AnimationType): void;

  /**
   * Remove a sprite from the scene (organism left viewport or died).
   */
  removeSprite(entityId: number): void;

  /**
   * Get the base sprite variant for a given size.
   */
  getSpriteVariant(sizeRatio: number): SpriteVariant;

  /**
   * Render a static organism portrait to an offscreen canvas (no animation).
   * Used by ShareCardRenderer for farewell card organism portraits.
   */
  renderStatic(stats: OrganismStats, size: number): HTMLCanvasElement;

  /**
   * Render the vision cone overlay for the followed organism.
   */
  renderVisionCone(organism: RenderableOrganism, camera: Camera): void;

  /**
   * Render pheromone cloud overlay on the world view.
   */
  renderPheromoneOverlay(grid: PheromoneReading[][], camera: Camera): void;

  /**
   * Determine LOD tier from current viewport width in world units.
   */
  getLODTier(viewportWidth: number): 'dot' | 'sprite' | 'detail';

  /**
   * Render an organism as a simple colored dot (Dot tier).
   * Returns a small PIXI.Graphics circle, 3-4px screen-space.
   */
  renderDot(organism: RenderableOrganism, isOwnSpecies: boolean): PIXI.Graphics;

  /**
   * Render the echolocation ping ring and detected silhouettes for the followed organism.
   * Ring pulses outward at echo frequency. Entities outside vision cone shown as grey blips.
   */
  renderEcholocationOverlay(organism: RenderableOrganism, echoDetections: EchoDetection[], camera: Camera): void;

  /**
   * Render sound wave visualizations: incoming directional arcs and outgoing emission ripples.
   */
  renderSoundOverlay(organism: RenderableOrganism, soundSources: SoundSource[], camera: Camera): void;

  /**
   * Render the perception fog-of-war overlay. Darkens areas outside all sensory ranges.
   * Cuts holes for vision cone, echolocation circle, and encounter range.
   */
  renderPerceptionFog(organism: RenderableOrganism, camera: Camera): void;
}
```

### Key Data Structures

```typescript
interface RendererConfig {
  worldSize: number;            // 500
  maxViewportWidth: number;     // in world units
  maxViewportHeight: number;
  spritePoolSize: number;       // pre-allocated sprite count for recycling
  enableAnimations: boolean;
  qualityLevel: 'low' | 'medium' | 'high';
}

interface RenderableOrganism {
  id: number;
  position: Vec2;
  heading: number;
  velocity: Vec2;

  // Stats that drive appearance
  sizeRatio: number;
  diet: number;                 // 0.0 - 1.0
  strength: number;
  defense: number;
  speedRatio: number;
  viewAngle: number;            // degrees
  viewRadius: number;
  metabolism: number;
  stomachMultiplier: number;
  maturity: number;

  // Color
  red: number;                  // 0.0 - 1.0
  green: number;
  blue: number;

  // State for animation
  isEating: boolean;
  isSprinting: boolean;
  isAttacking: boolean;
  isDamaged: boolean;
  isGrowing: boolean;
  isBurrowed: boolean;
  health: number;               // [0, 1]
  energy: number;               // [0, 1]
  fullness: number;             // [0, 1]

  // Unlockable trait flags
  hasVenom: boolean;
  hasArmor: boolean;
  armorDirection: 'front' | 'back';
  hasCamouflage: boolean;
  hasBurrowing: boolean;
  hasFatReserves: boolean;
  fatLevel: number;             // [0, 1] current fat fill
}

enum SpriteVariant {
  Tiny   = 0,   // sizeRatio < 0.6
  Normal = 1,   // sizeRatio 0.6 - 1.4
  Large  = 2,   // sizeRatio 1.4 - 2.2
  Huge   = 3,   // sizeRatio > 2.2
}

enum AnimationType {
  MovementWobble  = 'movement_wobble',   // oscillating body distortion while moving
  EatingMouthOpen = 'eating_mouth_open', // mouth opens when Want2Eat fires
  DamageFlash     = 'damage_flash',      // red flash overlay on hit
  GrowthPulse     = 'growth_pulse',      // size pulse when growing
  DeathPop        = 'death_pop',         // burst into meat pellet particles
  SprintStretch   = 'sprint_stretch',    // elongation during sprint
  ReproGlow       = 'repro_glow',        // soft glow when producing egg
}

interface RenderableEgg {
  id: number;
  position: Vec2;
  parentAppearance: RenderableOrganism; // mini version of parent
  incubationProgress: number;           // [0, 1]
  shellOpacity: number;                 // translucent overlay
}

interface EchoDetection {
  position: Vec2;
  size: number | null;                  // null if low precision (no size info)
  isInVisionCone: boolean;              // if true, rendered normally (not as silhouette)
}

interface SoundSource {
  direction: number;                    // angle relative to organism heading
  intensity: number;                    // [0, 1] — attenuated by distance
  frequency: number;                    // [0, 1] — tints the wave color
  sourcePosition: Vec2 | null;          // null if source not visible (only direction known)
  isOwnEmission: boolean;              // true if this is the followed organism's own sound
}

interface Camera {
  center: Vec2;
  zoom: number;
  viewportWidth: number;
  viewportHeight: number;
}
```

### Algorithm

#### LOD Tier Rendering

The renderer selects a rendering path based on viewport width in world units:

```
getLODTier(viewportWidth):
  if viewportWidth > 50: return 'dot'
  if viewportWidth > 15: return 'sprite'
  return 'detail'
```

| Tier | Viewport Width | Rendering | Pellets | Overlays |
|------|---------------|-----------|---------|----------|
| **Dot** | > 50 units | Colored circle, 3-4px screen-space. Own species bright, others muted. | Not visible | Heat map overlays only |
| **Sprite** | 15–50 units | Full procedural organism (body, eyes, mouth, tails, shell). Idle animations. | Full pellet rendering | Vision cone, entity rings, echolocation ring, sound waves, perception mode |
| **Detail** | < 15 units | Full rendering + internal glow/pulse. Cilia/flagella animate. Enhanced idle animations. | Full + energy glow | All Sprite overlays + floating labels, X-ray |

**Dot tier rendering:**
```
renderDot(organism, isOwnSpecies):
  color = dietColor(organism.diet, organism.metabolism)
  radius = isOwnSpecies ? 4 : 3                    // screen-space pixels
  alpha = isOwnSpecies ? 1.0 : 0.5
  circle = new PIXI.Graphics()
  circle.circle(0, 0, radius)
  circle.fill(color, alpha)
  return circle
```

**Sprite and Detail tiers** use the full procedural generation pipeline below. Detail tier additionally enables enhanced animations (cilia/flagella, internal glow, visible organelle pulse).

**Performance**: LOD saves significant GPU at zoomed-out views. At Dot tier, a world with 1000 organisms renders as 1000 simple circles (~0.01ms each) instead of 1000 full procedural sprites (~0.5ms each). This is critical for mobile performance when viewing the full 500×500 world.

#### Procedural Sprite Generation Pipeline

Each organism's visual appearance is generated from its stats in a multi-step pipeline. The generated sprite is a `PIXI.Container` composed of layered graphics primitives. Used at Sprite and Detail LOD tiers.

**Step 1 -- Base Body Shape:**
```
variant = getSpriteVariant(sizeRatio)
// Tiny:   compact circle, minimal features
// Normal: standard ellipse with limbs
// Large:  elongated ellipse, thicker limbs
// Huge:   massive body, heavy limbs, visible bulk

bodyWidth = baseSpriteWidth * sizeRatio * maturity
bodyHeight = bodyWidth * elongationFactor

// Speed-based elongation: faster = more streamlined
elongationFactor = 1.0 - (speedRatio - 1.0) * 0.15   // range ~0.85 (fast) to ~1.15 (slow)

// Stomach-based roundness: larger stomach = rounder body
roundnessFactor = 1.0 + (stomachMultiplier - 1.0) * 0.2
bodyHeight *= roundnessFactor

// Fat reserves expand the body
if hasFatReserves:
    bodyWidth *= (1.0 + fatLevel * 0.15)
    bodyHeight *= (1.0 + fatLevel * 0.1)
```

**Step 2 -- Color:**
```
primaryColor = rgb(red * 255, green * 255, blue * 255)

// Secondary color: auto-derived complementary
secondaryHue = (primaryHue + 180) % 360
secondaryColor = hsl(secondaryHue, primarySaturation * 0.7, primaryLightness * 1.2)

// Metabolism affects pattern intensity
patternAlpha = 0.2 + metabolism * 0.25   // low metabolism = muted, high = vivid
```

**Step 3 -- Mouth (Diet-Driven):**
```
if diet < 0.3:
    // Herbivore: filter tentacles / rounded opening
    drawFilterMouth(width = strength * 0.5)
else if diet < 0.7:
    // Omnivore: rounded opening
    drawRoundMouth(width = strength * 0.7)
else:
    // Carnivore: sharp pincers with teeth
    drawPincerMouth(width = strength * 1.0, jawSize = strength * 0.3)
```

**Step 4 -- Eyes (View-Driven):**
```
eyeSize = baseEyeSize * (viewRadius / 5.0)   // larger eyes = farther sight

if viewAngle < 90:
    // Forward-facing predator eyes
    eyePositions = [front-left, front-right]
    eyeSpacing = narrow
else if viewAngle < 180:
    // Moderate side placement
    eyePositions = [side-front-left, side-front-right]
else if viewAngle < 300:
    // Wide-set prey eyes
    eyePositions = [side-left, side-right]
else:
    // 360: eyes wrap around head
    eyePositions = [front, side-left, side-right, back]
    eyeSize *= 0.7   // smaller individual eyes

// Pupils track nearest stimulus
pupilOffset = directionToNearestStimulus * pupilMaxOffset
```

**Step 5 -- Defense (Shell/Armor):**
```
if defense > 0.5:
    numPlates = floor(defense * 2)
    plateThickness = defense * 0.1
    drawShellPlates(numPlates, plateThickness, direction = armorDirection)

if hasArmor:
    drawHeavyArmorOverlay(direction = armorDirection)
```

**Step 6 -- Appendages:**
```
// 2 limbs + tail, procedurally placed
limbLength = baseLimbLength * sizeRatio * (1.0 + speedRatio * 0.2)
limbThickness = baseLimbThickness * sizeRatio * (1.0 - speedRatio * 0.1)  // fast = thin limbs

if hasBurrowing:
    // Front appendages become broader/shovel-like
    limbWidth *= 1.5
    drawShovelShape(frontLimbs)
```

**Step 7 -- Trait Overlays:**
```
if hasVenom:
    drawVenomGlands(position = nearMouth, tint = greenish)

if hasCamouflage:
    drawMottledPattern(complexity = 3, alpha = patternAlpha * 0.8)

if hasFatReserves:
    // Body already expanded in Step 1; add subtle belly shading
    drawBellyShading(fatLevel)
```

**Step 8 -- Metabolism Pattern:**
```
// Pattern intensity scales with metabolism
drawBodyPattern(
    type = variant.patternType,   // stripes, spots, etc. based on variant
    intensity = metabolism / 3.0,
    color = secondaryColor,
    alpha = patternAlpha
)
```

#### Animation System

Animations are applied as per-frame modifiers to the generated sprite:

**Movement Wobble:**
```
if speed > 0.1:
    wobblePhase += speed * wobbleFrequency * deltaMs
    bodyScaleX = 1.0 + sin(wobblePhase) * wobbleAmplitude
    bodyScaleY = 1.0 - sin(wobblePhase) * wobbleAmplitude * 0.5
    // Limbs oscillate in counter-phase
    limb[0].rotation = sin(wobblePhase) * limbSwingAngle
    limb[1].rotation = sin(wobblePhase + PI) * limbSwingAngle
```

**Eating Mouth Open:**
```
if isEating:
    mouthOpenProgress = lerp(mouthOpenProgress, 1.0, 0.2)
else:
    mouthOpenProgress = lerp(mouthOpenProgress, 0.0, 0.1)
mouthSprite.scale.y = 1.0 + mouthOpenProgress * 0.5
```

**Damage Flash:**
```
if isDamaged:
    flashTimer = 0.15   // seconds
    sprite.tint = 0xFF4444
if flashTimer > 0:
    flashTimer -= deltaMs / 1000
    sprite.tint = lerpColor(0xFF4444, originalTint, 1 - flashTimer / 0.15)
```

**Growth Pulse:**
```
if isGrowing:
    pulsePhase += deltaMs * 0.005
    pulseMult = 1.0 + sin(pulsePhase) * 0.05
    sprite.scale.set(baseScale * pulseMult)
```

**Death Pop:**
```
// On death event:
// 1. Scale up briefly (0.1s)
// 2. Burst into 5-8 small particles that scatter outward
// 3. Particles are small circles tinted to meat color
// 4. Particles fade over 0.5s
// 5. Remove organism sprite
```

#### Egg Rendering

```
// Mini version of parent at 30% scale
miniParent = generateSprite(parentAppearance, scale = 0.3)

// Translucent shell overlay
shell = drawEllipse(miniParent.bounds, color = 0xFFFFDD, alpha = 0.4 + incubationProgress * 0.2)

// As incubation progresses, shell becomes more opaque and mini organism becomes more visible
miniParent.alpha = 0.3 + incubationProgress * 0.7
```

#### Eye Tracking

```
// Each frame, compute direction to nearest stimulus
nearestStimulus = getNearestVisibleEntity(organism)
if nearestStimulus:
    angleToStimulus = atan2(stimulus.y - organism.y, stimulus.x - organism.x) - organism.heading
    pupilOffsetX = cos(angleToStimulus) * maxPupilOffset
    pupilOffsetY = sin(angleToStimulus) * maxPupilOffset
else:
    // Slowly drift pupils back to center
    pupilOffset = lerp(pupilOffset, 0, 0.05)
```

### Performance Characteristics

- **Sprite generation**: ~0.5ms per organism (one-time cost on first sight or significant stat change). Cached and reused across frames.
- **Per-frame update (60 fps)**: O(V) where V = visible organisms in viewport (typically 50-80). Position/rotation update + animation = ~0.01ms per organism. Total: ~0.5-1.0ms per frame.
- **Sprite pooling**: Pre-allocated pool of PIXI.Containers recycled when organisms enter/leave viewport. Avoids GC pressure.
- **WebGL batching**: Pixi.js batches draw calls for sprites sharing the same texture. With procedural graphics, each organism is a unique texture, but the particle system and pellet sprites batch efficiently.
- **Memory**: Each organism sprite is ~2-5 KB in GPU texture memory. 80 visible organisms = ~200-400 KB VRAM. Well within mobile GPU limits.

### Dependencies

- **Pixi.js**: WebGL/Canvas 2D rendering engine.
- **WebSocket client**: Receives entity position updates and state changes from the server.

#### Additional Entity Renderings

**Eggs**: Small oval with parent species color, translucent shell overlay, hatch progress indicator (fill bar or opacity change). Nest bonus shown as subtle glow when > 0.

**Fungi patches**: Circular semi-transparent patches, larger than food pellets. Color-coded by type (brown=Decomposer, green=Toxic, gold=Nutrient, purple=Parasitic, cyan=Bioluminescent). Particle effects per type. Fade-in on spawn (0.5s), fade-out on decay (1s).

**Spores**: Arcing translucent orb (diet color, 60% opacity) with trailing particle ribbon. 0.5s parabolic flight animation. Landing puff particle effect. Failed germination: spore fades and dissolves over 1s.

**Barren patches**: Spatial hash cells with very low plant density show subtle brown tint overlay.

**AI species badge**: Subtle icon overlay on AI-controlled organisms. Also shown in leaderboard and world map.
- **Camera system**: Determines which entities are visible and at what zoom level.
- **No server-side dependencies**: The renderer is entirely client-side. It receives pre-computed data from the server and performs all visual generation locally.

---

## 13. ShareCardRenderer (Client-Side)

### Description

The ShareCardRenderer generates shareable Species Farewell Card images entirely on the client. It reuses the `OrganismRenderer` for the organism portrait, then composites stats, mini-achievements, and branding onto an offscreen canvas. The output is a PNG blob suitable for Web Share API, download, or upload to Supabase Storage for link sharing.

### Public Interface

```typescript
interface ShareCardRenderer {
  /**
   * Generate a farewell card for a species.
   * Returns an offscreen canvas (1080x1920 pixels, story format).
   */
  generateCard(
    species: SpeciesHistoryEntry,
    organismRenderer: OrganismRenderer,
  ): Promise<HTMLCanvasElement>;

  /**
   * Export canvas to PNG blob.
   */
  exportPNG(canvas: HTMLCanvasElement): Promise<Blob>;

  /**
   * Share via Web Share API (native OS share sheet).
   * Falls back to download if Web Share is unavailable.
   */
  shareNative(png: Blob, species: SpeciesHistoryEntry): Promise<void>;

  /**
   * Upload PNG to Supabase Storage and return public share URL.
   */
  uploadShareCard(png: Blob, speciesId: string): Promise<string>;

  /**
   * Detect which mini-achievements apply to a species.
   * Returns sorted by impressiveness (most notable first), max 3.
   */
  detectMiniAchievements(species: SpeciesHistoryEntry): MiniAchievement[];
}
```

### Key Data Structures

```typescript
interface SpeciesHistoryEntry {
  speciesId: string;
  speciesName: string;
  designerName: string;
  isOwnSpecies: boolean;

  // Design snapshot
  bodyStats: OrganismStats;
  traitLoadout: string[];            // e.g. ["Venom", "Camouflage"]
  reproductionMode: 'asexual' | 'sexual';
  archetypeLabel: string;            // e.g. "Carnivore / Tank"
  brainSynapseCount: number;
  brainHiddenCount: number;

  // Lifetime
  deployedAt: Date;
  endedAt: Date;
  durationDays: number;
  endReason: 'extinct' | 'retired';

  // Peak performance
  peakPopulation: number;
  peakDominanceScore: number;
  peakDominanceRank: number;         // e.g. 2 for "#2"
  deepestGeneration: number;
  maxTerritoryCoverage: number;      // 0.0 - 1.0
  peakBiomassShare: number;

  // Lifetime totals
  totalBorn: number;
  totalDeaths: number;
  totalKillsDealt: number;
  totalKillsReceived: number;
  totalEnergyConsumed: number;
  dailyMutationsApplied: number;

  // Cause of end (if extinct)
  deathBreakdown?: {
    starvation: number;              // 0.0 - 1.0
    predation: number;
    ageing: number;
    venom: number;
    environmental: number;
  };

  // Deployment context
  homeBiome: string;                 // primary biome
  founderCount: number;
  wintersSurvived: number;
  biomesOccupied: number;
  hadActiveNests: boolean;
  avgNestBonus: number;
  usedEncounterSharing: boolean;
  avgPopulation: number;
}

interface MiniAchievement {
  id: string;                        // e.g. "apex_predator"
  icon: string;                      // emoji or icon key
  label: string;                     // e.g. "Apex Predator"
  description: string;               // e.g. "Ruled the leaderboard for 12h"
  priority: number;                  // higher = more impressive
}

enum MiniAchievementType {
  ApexPredator       = 'apex_predator',       // Held #1 for 1h+
  Dynasty            = 'dynasty',             // Gen 100+
  SwarmLord          = 'swarm_lord',          // Peak pop 100+
  Survivor           = 'survivor',            // Lasted 7+ days
  SerialKiller       = 'serial_killer',       // 500+ kills
  Pacifist           = 'pacifist',            // 0 kills, lasted 24h+
  Underdog           = 'underdog',            // 1 founder → 50+ peak
  Colonizer          = 'colonizer',           // 40%+ territory
  FlashInThePan      = 'flash_in_the_pan',    // 50+ peak, <12h
  WinterSurvivor     = 'winter_survivor',     // 3+ winters
  GeneticPioneer     = 'genetic_pioneer',     // Sexual + gen 50+
  SocialSpecies      = 'social_species',      // Encounter sharing + 20+ avg pop
  NestBuilder        = 'nest_builder',        // Active nests with 30%+ bonus
  BiomeSpecialist    = 'biome_specialist',    // 80%+ in one biome
  Nomad              = 'nomad',               // 4+ biomes
}
```

### Algorithm

#### Mini-Achievement Detection

```
function detectMiniAchievements(species: SpeciesHistoryEntry): MiniAchievement[] {
  candidates = []

  // Check each mini-achievement condition (priority: higher = rarer)
  if species.peakDominanceRank == 1:
    candidates.push({ id: 'apex_predator', priority: 100,
      description: `Ruled the leaderboard for ${leaderboardHours}h` })

  if species.deepestGeneration >= 100:
    candidates.push({ id: 'dynasty', priority: 90,
      description: `Lineage survived ${species.deepestGeneration} generations` })

  if species.peakPopulation >= 100:
    candidates.push({ id: 'swarm_lord', priority: 85,
      description: `Peaked at ${species.peakPopulation} organisms` })

  if species.durationDays >= 7:
    candidates.push({ id: 'survivor', priority: 80,
      description: `Endured for ${species.durationDays.toFixed(1)} days` })

  if species.totalKillsDealt >= 500:
    candidates.push({ id: 'serial_killer', priority: 75,
      description: `Took down ${species.totalKillsDealt} prey` })

  if species.totalKillsDealt == 0 && species.durationDays >= 1:
    candidates.push({ id: 'pacifist', priority: 70,
      description: 'Never harmed another organism' })

  if species.founderCount == 1 && species.peakPopulation >= 50:
    candidates.push({ id: 'underdog', priority: 65,
      description: `From 1 founder to a population of ${species.peakPopulation}` })

  if species.maxTerritoryCoverage >= 0.4:
    candidates.push({ id: 'colonizer', priority: 60,
      description: `Spread across ${(species.maxTerritoryCoverage * 100).toFixed(0)}% of the world` })

  if species.peakPopulation >= 50 && species.durationDays < 0.5:
    candidates.push({ id: 'flash_in_the_pan', priority: 55,
      description: 'Burned bright but brief' })

  if species.wintersSurvived >= 3:
    candidates.push({ id: 'winter_survivor', priority: 50,
      description: `Weathered ${species.wintersSurvived} winters` })

  if species.reproductionMode == 'sexual' && species.deepestGeneration >= 50:
    candidates.push({ id: 'genetic_pioneer', priority: 45,
      description: `Evolved through ${species.deepestGeneration} generations of crossover` })

  if species.usedEncounterSharing && species.avgPopulation >= 20:
    candidates.push({ id: 'social_species', priority: 40,
      description: 'Thrived through cooperation' })

  if species.hadActiveNests && species.avgNestBonus >= 0.3:
    candidates.push({ id: 'nest_builder', priority: 35,
      description: 'Built thriving nurseries' })

  if species.biomesOccupied >= 4:
    candidates.push({ id: 'nomad', priority: 30,
      description: 'Roamed every corner of the world' })

  // Sort by priority descending, return top 3
  candidates.sort((a, b) => b.priority - a.priority)
  return candidates.slice(0, 3)
}
```

#### Card Rendering Pipeline

```
function generateCard(species, organismRenderer):
  // 1. Create offscreen canvas (1080x1920, story format)
  canvas = new OffscreenCanvas(1080, 1920)
  ctx = canvas.getContext('2d')

  // 2. Background — biome-themed gradient
  gradient = biomeGradient(species.homeBiome)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 1080, 1920)

  // 3. Header — game logo + banner
  drawGameLogo(ctx, x: 540, y: 80)
  if species.endReason == 'extinct':
    drawBanner(ctx, "~ In Memoriam ~", y: 140)
  else:
    drawBanner(ctx, "~ Retired ~", y: 140)

  // 4. Organism portrait — reuse OrganismRenderer
  //    Render organism facing right on a circular vignette
  organismCanvas = organismRenderer.renderStatic(species.bodyStats, size: 400)
  if species.endReason == 'extinct':
    applyGreyscaleTint(organismCanvas, opacity: 0.3)  // faded memorial look
  ctx.drawImage(organismCanvas, 340, 200, 400, 400)

  // 5. Species identity
  drawText(ctx, species.speciesName, x: 540, y: 660, font: '48px bold', align: 'center')
  drawText(ctx, `by ${species.designerName} — ${species.archetypeLabel}`,
           x: 540, y: 710, font: '24px', align: 'center', color: '#ccc')

  // 6. Lifetime bar
  drawLifetimeBar(ctx, species.deployedAt, species.endedAt, species.durationDays, y: 770)

  // 7. Key stats grid (2x3)
  drawStatGrid(ctx, y: 850, stats: [
    { label: 'Peak Pop',    value: species.peakPopulation },
    { label: 'Gen Depth',   value: species.deepestGeneration },
    { label: 'Rank',        value: `#${species.peakDominanceRank}` },
    { label: 'Born',        value: species.totalBorn },
    { label: 'Kills Dealt', value: species.totalKillsDealt },
    { label: 'Duration',    value: `${species.durationDays.toFixed(1)}d` },
  ])

  // 8. Mini-achievements (1-3)
  achievements = detectMiniAchievements(species)
  drawMiniAchievements(ctx, achievements, y: 1150)

  // 9. Cause of end
  if species.endReason == 'extinct' && species.deathBreakdown:
    topCause = getTopDeathCause(species.deathBreakdown)
    drawText(ctx, `Went Extinct — ${topCause.label} (${topCause.pct}%)`,
             x: 540, y: 1550, font: '22px', align: 'center')
  else:
    drawText(ctx, `Retired after ${species.durationDays.toFixed(1)} days`,
             x: 540, y: 1550, font: '22px', align: 'center')

  // 10. Footer
  drawText(ctx, `Life Game — ${worldName} — ${formatDate(species.endedAt)}`,
           x: 540, y: 1860, font: '18px', align: 'center', color: '#999')

  return canvas
```

#### Share Flow

```
async function shareFarewellCard(species):
  // 1. Generate card
  canvas = await generateCard(species, organismRenderer)
  png = await exportPNG(canvas)

  // 2. Try native share (Web Share API)
  if navigator.canShare && navigator.canShare({ files: [pngFile] }):
    file = new File([png], `${species.speciesName}-farewell.png`, type: 'image/png')
    await navigator.share({
      title: `${species.speciesName} — Species Farewell`,
      text: `My species ${species.speciesName} ${species.endReason == 'extinct' ? 'went extinct' : 'was retired'} after ${species.durationDays.toFixed(1)} days. Peak pop: ${species.peakPopulation}. Gen: ${species.deepestGeneration}.`,
      files: [file]
    })

  // 3. Fallback: download
  else:
    downloadBlob(png, `${species.speciesName}-farewell.png`)

async function copyShareLink(species):
  // Upload to Supabase Storage if not already uploaded
  url = await uploadShareCard(png, species.speciesId)
  // url = https://yourapp.com/share/{speciesId}
  await navigator.clipboard.writeText(url)
```

### Performance

- **Card generation**: ~50-100ms total. Organism portrait reuses cached sprite generation (~0.5ms). Canvas compositing for text, shapes, gradients = ~20ms. PNG export = ~30-50ms.
- **Upload**: PNG at 1080x1920 ~200-400 KB. Upload to Supabase Storage < 1s on typical mobile connection.
- **Caching**: Once generated for a species, the PNG blob is cached in memory for the session. Re-opening the share modal reuses the cached blob.

### Dependencies

- **OrganismRenderer**: Reuses `renderStatic()` for the organism portrait (renders organism at given stats without animation).
- **Supabase Storage client**: For uploading share card PNGs to the `share-cards` public bucket.
- **Web Share API**: For native sharing. Feature-detected at runtime; falls back to download.
- **SpeciesHistoryEntry**: Data fetched from Supabase `active_species` + `event_log` aggregation.

---

## 14. ProgressionSystem

### Description
Tracks Evolution Point (EP) earning, unlock tier progression, and achievement detection.
Runs server-side on milestone events (not per-tick). Client mirrors state for UI feedback.

### Public Interface
```typescript
interface ProgressionSystem {
  checkMilestones(species: Species, world: World): EPEvent[];
  checkAchievements(player: Player, species: Species, world: World): Achievement[];
  validateDesignUnlocks(design: OrganismDesign, playerTier: number): ValidationResult;
}
```

### Key Data Structures

EP earning milestones:
| Milestone | EP Reward |
|-----------|-----------|
| Population reaches 10 | 5 EP |
| Population reaches 25 | 15 EP |
| Population reaches 50 | 30 EP |
| Generation depth 5 | 10 EP |
| Generation depth 10 | 25 EP |
| Generation depth 20 | 50 EP |
| Generation depth 50 | 100 EP |
| Per organism-hour | 1 EP |
| Achievement bonus | 10-50 EP (varies) |

Tier thresholds: Tier 1 = 0 EP, Tier 2 = 50 EP, Tier 3 = 200 EP, Tier 4 = 500 EP

### Algorithm
1. On species stats update (every 15s): check population and generation milestones
2. On organism death: update organism-time counter
3. On milestone cross: INSERT into EP log, update `players.evolution_points`
4. On EP change: check if new tier threshold crossed → update `players.unlocked_tier`
5. Achievement detection: event-driven (on kill → check First Blood, on extinction → check Comeback, etc.)

### Performance
- Milestone checks: ~0.1ms (simple comparisons)
- Achievement checks: ~0.5ms (some require aggregation)
- Frequency: every 15s (not per-tick)

### Dependencies
- SpeciesManager (species stats)
- EventDetector (event triggers)
- Supabase (players table, daily_mutations table)

---

## 15. AIDesigner

### Description
Manages AI species lifecycle: deployment from curated library, cycling, retirement,
and slot management. Ensures ~30 active species in each world.

### Public Interface
```typescript
interface AIDesigner {
  getAISlotCount(world: World): number;
  deployAISpecies(world: World, niche: string): Species;
  cycleAISpecies(world: World): void;
  retireAIForHuman(world: World): void;
  fillExtinctionSlot(world: World, biome: string): void;
}
```

### Key Data Structures

AI Species Library (15+ entries):
| ID | Name | Niche | Diet | Size | Speed | Brain Synapses | ~BP Used |
|----|------|-------|------|------|-------|---------------|----------|
| 1 | Moss Nibblers | Small Herbivore | 0.0 | 0.5 | 1.5 | 7 | 70 |
| 2 | Blade Runners | Fast Herbivore | 0.0 | 0.6 | 1.8 | 8 | 75 |
| 3 | Marsh Grazers | Wetland Herbivore | 0.1 | 1.0 | 0.8 | 6 | 65 |
| 4 | Stone Crawlers | Rocky Herbivore | 0.0 | 0.8 | 0.6 | 5 | 60 |
| 5 | Sand Skimmers | Desert Scavenger | 0.3 | 0.5 | 2.0 | 8 | 72 |
| 6 | Leaf Drifters | Forest Herbivore | 0.0 | 1.2 | 0.5 | 7 | 68 |
| 7 | Ambush Snapper | Small Carnivore | 1.0 | 0.8 | 1.2 | 10 | 78 |
| 8 | Pack Stalkers | Mid Carnivore | 0.9 | 1.0 | 1.4 | 12 | 80 |
| 9 | Reef Lurkers | Large Carnivore | 1.0 | 1.8 | 0.8 | 9 | 82 |
| 10 | Muck Feeders | Omnivore | 0.5 | 0.9 | 1.0 | 7 | 70 |
| 11 | Spore Drifters | Fungi Specialist | 0.2 | 0.4 | 1.6 | 8 | 74 |
| 12 | Shell Backs | Tank Herbivore | 0.0 | 1.5 | 0.4 | 6 | 75 |
| 13 | Swift Hunters | Fast Carnivore | 0.8 | 0.7 | 2.2 | 11 | 78 |
| 14 | Deep Burrowers | Burrowing Omnivore | 0.4 | 0.6 | 0.8 | 8 | 72 |
| 15 | Herd Grazers | Social Herbivore | 0.0 | 1.0 | 1.0 | 9 | 76 |

### Algorithm
1. On world tick (every 5 min): check `aiSlotCount` vs current AI count
2. If deficit: `findUnderRepresentedNiche()` using keystone analysis, deploy matching design
3. Every 48h: retire lowest-dominance AI, replace with fresh design from library
4. On human deploy: immediately retire weakest AI (10x ageing acceleration)
5. On human extinction: wait 5 min, then fill slot with AI herbivore in same biome

AI species use real BrainEngine (same neural network) with pre-designed brains.
Marked with `isAI=true`, subtle badge in rendering. No daily mutations applied.
~75 effective BP, 8-12 synapses (functional but not dominant).

### Performance
- Slot checks: ~0.1ms (every 5 min)
- Niche analysis: ~1ms (keystone computation)

### Dependencies
- SpeciesManager
- BrainEngine
- EnvironmentEngine (biome info for niche analysis)

---

## Module Dependency Graph

```
                    ┌──────────────┐
                    │ SpatialHash  │
                    │    Grid      │
                    └──────┬───────┘
                           │ used by
              ┌────────────┼──────────────────┐
              │            │                  │
     ┌────────▼───┐  ┌────▼──────┐   ┌───────▼───────┐
     │  Physics   │  │  Combat   │   │    Energy     │
     │  Engine    │  │  System   │   │    System     │
     └────┬───────┘  └────┬──────┘   └───────┬───────┘
          │               │                   │
          │         ┌─────┴──────┐            │  used by all
          │         │            │            │  biological systems
          │    ┌────▼────┐  ┌───▼──────┐     │
          │    │Digestive│  │ Event    │     │
          │    │ System  │  │ Detector │     │
          │    └─────────┘  └──────────┘     │
          │                                   │
     ┌────▼──────────┐                       │
     │  BrainEngine  │◄──────────────────────┘
     └────┬──────────┘      reads outputs
          │
          │ drives behavior
          ▼
    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
    │ Reproduction │───►│  Genetics    │    │ Environment  │
    │   System     │    │  Engine      │    │   Engine     │
    └──────────────┘    └──────────────┘    └──────────────┘
                                                   │
    ┌──────────────┐                               │
    │   Species    │◄──────────────────────────────┘
    │   Manager    │         biome/season data
    └──────────────┘

    ┌──────────────────┐
    │  Organism        │  (client-side only, receives state via WebSocket)
    │  Renderer        │
    └──────────────────┘

    ┌──────────────────┐
    │  Progression     │──→ SpeciesManager, EventDetector, Supabase
    │   System         │
    └──────────────────┘

    ┌──────────────────┐
    │  AIDesigner      │──→ SpeciesManager, BrainEngine, EnvironmentEngine
    └──────────────────┘
```

## Tick Processing Order

Each server tick executes the modules in this order:

1. **Sense** -- SpatialHashGrid queries populate BrainInputs for all organisms.
2. **Think** -- BrainEngine.tickAll() propagates all neural networks.
3. **Act** -- Read brain outputs and apply behavioral intents.
4. **Physics** -- PhysicsEngine.tick() applies forces, drag, collisions, wrapping.
5. **Combat** -- CombatSystem.tick() resolves attacks, venom, knockback.
6. **Digestion** -- DigestiveSystem.tick() processes stomach contents.
7. **Biology** -- Metabolism costs, growth, healing, ageing (uses EnergySystem and SpeciesManager).
8. **Reproduction** -- ReproductionSystem.tick() accumulates egg energy, lays eggs, hatches.
9. **Genetics** -- Mutations applied to newborns (called within ReproductionSystem).
10. **Environment** -- EnvironmentEngine.tick(wallClockDeltaSec) updates seasons and day/night using wall-clock delta, then updates pheromones and fungi using simulation `dt`.
11. **Energy** -- EnergySystem.tick() spawns plants, decays meat, corrects drift.
12. **Death** -- Check death conditions (HP <= 0, energy <= 0). Spawn meat. Emit events.
13. **Species** -- SpeciesManager.tick() updates entropy, checks AI cycling.
14. **Events** -- EventDetector.tick() detects milestones, broadcasts to clients.
15. **Persist** -- Every `SIM_TPS * 15` ticks (~15 sec wall-clock): flush events to Supabase. Every `5 * 60 * SIM_TPS` ticks (~5 min wall-clock): full world snapshot.
16. **FungiSystem** -- Spawn/decay fungi, apply effects to organisms in patches.
17. **EventSystem** -- Check/trigger ecological events, apply effects.

Note: ProgressionSystem and AIDesigner run on slower schedules (15s and 5 min respectively), not per-tick.

**Total estimated tick time (900 organisms):**

| Module | Estimated Time |
|--------|---------------|
| Sense (spatial queries) | 0.50 ms |
| Think (brain propagation) | 1.80 ms |
| Physics | 0.50 ms |
| Combat | 0.10 ms |
| Digestion | 0.45 ms |
| Biology (metabolism, growth, ageing) | 0.30 ms |
| Reproduction | 0.30 ms |
| Environment (pheromones, fungi) | 0.20 ms |
| Energy (plant spawn, meat decay) | 0.15 ms |
| Death checks | 0.05 ms |
| Species management | 0.01 ms |
| Events | 0.15 ms |
| FungiSystem | 0.20 ms |
| EventSystem | 0.10 ms |
| **Total** | **~4.8 ms** |

At 40 TPS (25 ms budget per tick), this leaves ~81% CPU headroom for WebSocket serving, Supabase writes, and the decoupled 20 Hz broadcast timer.
