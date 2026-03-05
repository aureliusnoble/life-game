# Phase 3 — Simulation Systems

Server-side simulation modules that drive organism behavior each tick: brain evaluation, sensory input population, action translation, physics, digestion, and combat.

> **Before you start this phase**, read the general guidance in [`README.md`](./README.md).

### Phase 3 Guidance

**Read these design docs first:**
- `core-gameplay-systems.md` Sections 3-6 (Brain architecture, 51 inputs, 20 outputs, hidden node types, sensory system, action mapping, combat formulas)
- `components/game-components.md` Sections 6-11 (BrainEngine, SenseSystem, ActionSystem, PhysicsEngine, DigestiveSystem, CombatSystem)
- `design/mockups/preview.html` — reference implementation of organism rendering; useful for understanding the body stats that feed into these systems

**Prerequisites:**
- Phase 2 must be complete. The brain, sense, action, physics, digestion, and combat systems all depend on the entity types, spatial hash, and energy system from Phase 2.

**No manager action needed for this phase.** Pure simulation code, all local.

**QA handoff for this phase:**
When done, tell the manager: "Run `pnpm --filter server test` — all Phase 3 tests should pass. Key verifications: (1) Brain engine produces deterministic outputs for the same inputs and weights, (2) SenseSystem correctly identifies nearest food/threats within view cone, (3) PhysicsEngine applies forces and respects world bounds/toroidal wrapping, (4) CombatSystem resolves attacks using the `STR×size×speed vs DEF×size` formula, (5) DigestiveSystem converts stomach contents to energy at the correct rate."

---

## Step 3.1 — Brain Engine

### What You're Implementing

The `BrainEngine` module: a feed-forward neural network evaluator that compiles player-designed brain graphs into cache-efficient typed arrays, executes a topological-order forward pass every tick for every organism, and exposes output node activations for downstream systems.

### Design References

- `core-gameplay-systems.md` Section 1.2 — Brain architecture, synapse mechanics, accumulation modes, all 12 activation function formulas, processing order description, energy cost formula (`0.1 * numHiddenNodes * metabolism`).
- `core-gameplay-systems.md` Section 1.2 Tier 1-4 Hidden Nodes — Exact activation function formulas for Sigmoid, Linear, TanH, ReLU, Sine, Gaussian, Latch, Differential, Absolute, Multiply, Integrator, Inhibitory.
- `components/game-components.md` Section 1 (BrainEngine) — Full `CompiledBrain` interface, `BrainDesign` / `BrainNodeDef` / `SynapseDef` interfaces, `ActivationFunction` enum, `InputNodeType` enum (51 nodes), `OutputNodeType` enum (18 nodes), Kahn's algorithm for compilation, tick processing pseudocode, performance characteristics (~2 microseconds per brain).
- `components/back-end.md` Section 2.1-2.3 — System execution order (BrainSystem is step 2), `World.tick()` method showing `brainSystem.update(organisms, dt)`.

### Implementation Details

#### Key Data Structures

```typescript
interface CompiledBrain {
  activations: Float64Array;       // [inputs | hidden | outputs]
  prevActivations: Float64Array;   // prior tick (for DIF, INH, INT)
  prevInputs: Float64Array;        // previous raw inputs (for DIF, INH)
  biases: Float64Array;            // one per node
  metadata: Int32Array;            // 4 ints per node: [activationFn, firstSynapseIdx, synapseCount, accumMode]
  synapseWeights: Float64Array;    // packed synapse weights
  synapseSrcIndices: Int32Array;   // source node index per synapse
  topoOrder: Int32Array;           // topological processing order
  numInputs: number;
  numHidden: number;
  numOutputs: number;
  numSynapses: number;
  nodeCount: number;
}
```

#### Compilation Algorithm (Kahn's Topological Sort)

1. Build adjacency list from enabled synapses only.
2. Compute in-degree for every node.
3. Seed queue with all zero-in-degree nodes (input nodes).
4. While queue non-empty: dequeue node, append to `topoOrder`, decrement successors' in-degrees. Enqueue successors reaching zero.
5. If `topoOrder.length < nodeCount`, graph has a cycle — reject design.
6. Pack node data into `metadata`, `biases`, `activations`. Pack synapses into `synapseWeights` and `synapseSrcIndices` grouped by destination node so each node's incoming synapses are contiguous in memory.

#### Tick Forward Pass

```
for each nodeIndex in topoOrder (skip pure inputs):
    accumulator = bias[nodeIndex]
    startSyn = metadata[nodeIndex * 4 + 1]
    synCount = metadata[nodeIndex * 4 + 2]
    accumMode = metadata[nodeIndex * 4 + 3]

    if accumMode == 0 (sum):
        for s in [startSyn .. startSyn + synCount):
            accumulator += activations[synapseSrcIndices[s]] * synapseWeights[s]
    else (product, for Multiply nodes):
        accumulator = 1.0
        for s in [startSyn .. startSyn + synCount):
            accumulator *= activations[synapseSrcIndices[s]] * synapseWeights[s]

    activations[nodeIndex] = applyActivation(metadata[nodeIndex * 4 + 0], accumulator, ...)
```

#### All 12 Activation Functions

| Index | Name | Formula | Range |
|-------|------|---------|-------|
| 0 | Sigmoid | `1 / (1 + e^(-x))` | [0, 1] |
| 1 | Linear | `clamp(x, -100, 100)` | [-100, 100] |
| 2 | TanH | `(e^x - e^(-x)) / (e^x + e^(-x))` | [-1, 1] |
| 3 | ReLU | `clamp(max(0, x), 0, 100)` | [0, 100] |
| 4 | Sine | `sin(x)` | [-1, 1] |
| 5 | Gaussian | `1 / (1 + x^2)` | [0, 1] |
| 6 | Latch | stateful: `x>=1 -> s=1; x<=0 -> s=0; else prev` | {0, 1} |
| 7 | Differential | `clamp((x - prevInput) / dt, -100, 100)` | [-100, 100] |
| 8 | Absolute | `clamp(abs(x), 0, 100)` | [0, 100] |
| 9 | Multiply | `clamp(product_of_inputs, -100, 100)` | [-100, 100] |
| 10 | Integrator | `clamp(prevY + x * dt, -100, 100)` | [-100, 100] |
| 11 | Inhibitory | `clamp((x - prevX) + prevY * e^(-bias * dt), -100, 100)` | [-100, 100] |

Stateful nodes (Latch, Differential, Integrator, Inhibitory) require `prevActivations` and `prevInputs` arrays. After each tick, copy `activations` to `prevActivations` and raw inputs to `prevInputs`.

#### Energy Cost

```
brainEnergyCost = 0.1 * numHiddenNodes * metabolism
```

Deducted per tick by the EnergySystem (step 7 in tick pipeline).

### Unit Tests

- **Compilation**: Verify Kahn's sort on a known DAG produces correct topological order.
- **Cycle detection**: Provide a cyclic graph; assert compilation throws an error.
- **Activation functions**: For each of the 12 functions, provide several input values and assert output matches formula (e.g., Sigmoid(0) = 0.5, TanH(0) = 0, ReLU(-1) = 0, Gaussian(0) = 1.0).
- **Forward pass (sum mode)**: Build a 2-input, 1-hidden, 1-output brain. Set known weights and biases. Assert output matches hand-calculation.
- **Forward pass (product mode)**: Build a Multiply node with 2 inputs. Assert product accumulation.
- **Latch memory**: Tick a Latch node above 1.0, then below 1.0 but above 0.0. Assert it retains state.
- **Differential rate-of-change**: Feed a changing input across two ticks. Assert output equals `(x_new - x_old) / dt`.
- **Integrator accumulation**: Feed constant input over several ticks. Assert output accumulates correctly.
- **Inhibitory habituation**: Feed constant input. Assert output decays over ticks.
- **Energy cost**: Build a brain with 5 hidden nodes, metabolism = 2.0. Assert cost = `0.1 * 5 * 2.0 = 1.0`.
- **Clone**: Clone a brain, modify the clone, assert original is unchanged.
- **Empty brain**: Compile a brain with only input and output nodes (no hidden, no synapses). Assert it runs without error and outputs defaults.
- **Output clamp ranges**: Assert Sigmoid output always in [0,1], TanH in [-1,1], Linear clamped to [-100,100].

### Integration Tests

- **Full tick pipeline**: Create a world with 10 organisms, each with template brains. Run 100 ticks. Assert no NaN values in any activation array.
- **Brain-to-physics flow**: Wire `Constant -> Accelerate` with weight +1.0. Run 10 ticks. Assert organism velocity > 0.
- **Brain-to-combat flow**: Wire `Constant -> Want2Attack` with weight +3.0 and bias 0. Place two adjacent organisms. Assert attack occurs.
- **SenseSystem -> BrainSystem flow**: Place a plant in an organism's vision cone. Assert `NearestPlantDist` input is populated before brain tick runs.

### QA Checklist

- [ ] All 12 activation functions produce correct output for edge cases (x = 0, x = very large, x = very negative)
- [ ] Kahn's algorithm rejects cyclic graphs with a clear error message
- [ ] Float64Array layout matches the documented memory format: `[inputs | hidden | outputs]`
- [ ] Synapse weights are packed contiguously per destination node for cache efficiency
- [ ] `prevActivations` and `prevInputs` are correctly swapped each tick
- [ ] Multiply nodes use product accumulation, all others use summation
- [ ] Brain clone produces a deep copy (no shared typed array references)
- [ ] Maximum 3 Latch nodes per brain is enforced at compilation
- [ ] Performance: single brain tick < 5 microseconds for a 30-node, 50-synapse brain
- [ ] `tickAll()` iterates organisms array and calls `tick()` for each

---

## Step 3.2 — Sense System

### What You're Implementing

The `SenseSystem` module: populates all brain input node values for every organism each tick. Queries the `SpatialHashGrid` for vision cone contents, nearest entities, pheromone readings, encounter-range allies, and reads organism internal state (energy, health, fullness, etc.).

### Design References

- `core-gameplay-systems.md` Section 1.2 Input Nodes — All 51 input nodes across 4 tiers with exact ranges and semantics.
- `components/game-components.md` Section 1 (BrainEngine) — `InputNodeType` enum (51 entries), `BrainInputs` type.
- `components/game-components.md` Section 3 (SpatialHashGrid) — `queryVisionCone()`, `queryNearest()`, `queryEncounterRange()`, `queryNearbyEggs()`, `countNearbyMatching()` interfaces, toroidal distance formula, vision cone query algorithm.
- `components/game-components.md` Section 9 (EnvironmentEngine) — `readPheromones()`, `getPheromoneGradient()`, `getBiome()`, `getSeason()`, `getDayNightState()`.
- `core-gameplay-systems.md` Section 6.2 (Day/Night) — View radius formula: `effectiveViewRadius = ViewRadius * (0.6 + 0.4 * ambientLight)`.
- `core-gameplay-systems.md` Section 1.1 (Camouflage) — Detection reduction formula: `detectionReduction = camoStrength * (1 - currentSpeed/maxSpeed)^2`.

### Implementation Details

#### Input Population Pipeline (per organism)

1. **Internal state inputs** (O(1) each):
   - `Constant` = 1.0
   - `EnergyRatio` = `energy / maxEnergy`
   - `HealthRatio` = `health / maxHealth`
   - `Fullness` = `(plantMatter + meatMatter) / stomachCapacity`
   - `Speed` = `|velocity| / maxSpeed`
   - `Maturity` = organism maturity [0, 1]
   - `IsGrabbing` = 0 or 1
   - `AttackedDamage` = `damageReceivedThisTick / maxHealth`
   - `Tic` = internal clock oscillator (cycles 0 to 1 over `InternalClockPeriod`)
   - `TimeAlive` = `age / expectedLifespan`
   - `EggStored` = `eggOrgan.storedEnergy / eggOrgan.requiredEnergy`
   - `StomachPlantRatio` = `plantMatter / (plantMatter + meatMatter)` (or 0.5 if empty)
   - `Sex`, `MatingCooldown`, `IsBurrowed`

2. **Environment inputs** (O(1) each):
   - `BiomeType` = biome at organism position encoded as 0.2/0.4/0.6/0.8/1.0
   - `SeasonPhase` = season phase [0, 1]

3. **Vision cone query** (O(cells * entities_per_cell)):
   - Compute `effectiveViewRadius = ViewRadius * (0.6 + 0.4 * ambientLight) * biome.visibilityMod`
   - Call `grid.queryVisionCone(pos, heading, viewAngle/2, effectiveViewRadius)`
   - Apply camouflage reduction: skip entities where `distance > normalRange * (1 - detectionReduction)` and distance > 15% of normal range
   - From results, extract nearest plant, nearest meat, nearest organism, nearest ally, nearest mate, nearest egg
   - Populate angle inputs: `angle = atan2(dy, dx)` relative to heading, normalized to [-1, 1]
   - Populate distance inputs: normalized to [0, 1] by dividing by `effectiveViewRadius`
   - `NearestOrganismSize` = `targetSize / (targetSize + selfSize)` mapped to [0, 1]
   - `NearestOrganismColor` = target hue [0, 1]
   - `NOrganisms` = `visibleOrganismCount / 4` clamped to [0, 1]
   - `NFood` = `visibleFoodCount / 4` clamped to [0, 1]
   - `NearestAllyCount` = `visibleAllyCount / 4` clamped to [0, 1]
   - `NearbyEggCount` = same-species eggs in view / 4 clamped to [0, 1]

4. **Pheromone inputs** (O(1) via grid lookup):
   - `Pheromone1/2/3Strength` = pheromone intensity at position
   - `Pheromone1/2/3Angle` = gradient direction from `getPheromoneGradient()`

5. **Sound inputs** (O(nearby_emitters)):
   - `SoundIntensity` = loudest sound intensity within range
   - `SoundDirection` = direction to loudest source
   - `SoundFrequency` = frequency of loudest source

6. **Encounter inputs** (O(1) spatial query):
   - Query nearest same-species ally within `1.5 * (selfRadius + allyRadius)`
   - Populate `AllyEnergyRatio`, `AllyHealthRatio`, `AllyHeading`, `AllyLastFoodAngle`, `AllyLastThreatAngle`, `AllyWant2Mate`, `AllyReproductiveState`

#### Toroidal Distance Calculation

```
dx = target.x - origin.x
dy = target.y - origin.y
if dx > worldSize/2:  dx -= worldSize
if dx < -worldSize/2: dx += worldSize
if dy > worldSize/2:  dy -= worldSize
if dy < -worldSize/2: dy += worldSize
dist = sqrt(dx*dx + dy*dy)
angle = atan2(dy, dx)
```

### Unit Tests

- **Toroidal distance**: Place two entities near opposite edges (e.g., x=5 and x=495 in a 500-unit world). Assert distance is 10, not 490.
- **Angle normalization**: Place food at various angles relative to heading. Assert NearestPlantAngle is in [-1, 1] and correctly maps left/right.
- **Vision cone filtering**: Place 3 entities, one inside cone, one outside angle, one outside radius. Assert only the in-cone entity is detected.
- **Camouflage reduction**: Place a camouflaged stationary entity. Assert its effective detection range is reduced by `camoStrength`.
- **Fullness calculation**: Set stomach to 50% plant, 50% meat. Assert `Fullness = 1.0` and `StomachPlantRatio = 0.5`.
- **EggStored**: Set stored energy to 60% of required. Assert `EggStored = 0.6`.
- **Biome encoding**: Assert grassland = 0.2, forest = 0.4, wetland = 0.6, desert = 0.8, rocky = 1.0.
- **Night vision reduction**: Set ambientLight = 0.0. Assert effective view radius = 60% of base.
- **NearestOrganismSize**: Self size = 1.0, target size = 2.0. Assert output = `2.0 / (2.0 + 1.0) = 0.667`.
- **Default values**: When no entity is visible, assert angle = 0, distance = 1.0.
- **Encounter range**: Place an ally at exactly `1.5 * (r1 + r2)` distance. Assert it is detected. Place it at `1.6 * (r1 + r2)`. Assert not detected.
- **Pheromone gradient**: Deposit pheromone to the right of an organism. Assert gradient angle points right.

### Integration Tests

- **SenseSystem -> BrainSystem**: Populate inputs for 100 organisms. Run BrainSystem. Assert no NaN outputs.
- **Vision with movement**: Move an organism into and out of another's vision cone over multiple ticks. Assert inputs change correctly.

### QA Checklist

- [ ] All 51 input nodes are populated each tick (no uninitialized values)
- [ ] Toroidal wrapping works correctly for vision cones near world edges
- [ ] Camouflage detection reduction is applied and 15% minimum range is enforced
- [ ] Night vision reduction uses the formula `0.6 + 0.4 * ambientLight`
- [ ] Forest biome vision reduction (0.7x) is applied
- [ ] Encounter inputs return 0 when no ally is in range or trait is not purchased
- [ ] Sexual reproduction inputs return 0 for asexual species
- [ ] Tier gating: higher-tier inputs are only populated if the player has unlocked that tier
- [ ] Performance: ~0.8ms for 900 organisms including all spatial queries

---

## Step 3.3 — Action / Decision System

### What You're Implementing

The `ActionSystem` module: translates brain output node activations into concrete organism intent flags and force values that downstream systems (Physics, Combat, Digestion, Reproduction) consume.

### Design References

- `core-gameplay-systems.md` Section 1.2 Output Nodes — All 18 output nodes across 4 tiers with activation types, ranges, threshold vs continuous behavior, and effect descriptions.
- `components/back-end.md` Section 2.1-2.2 — ActionSystem is step 3 in tick pipeline. Reads from brain outputs, writes to action intents.

### Implementation Details

#### Output Node Processing

The ActionSystem reads each output node from the compiled brain and writes structured intents:

**Continuous behaviors** (output value directly scales effect):
- `Accelerate` (TanH, [-1, 1]) -> `intent.moveForce = output`
- `Rotate` (TanH, [-1, 1]) -> `intent.turnTorque = output`
- `Digestion` (Sigmoid, [0, 1]) -> `intent.acidLevel = output`
- `Herding` (Sigmoid, [0, 1]) -> `intent.herdInfluence = output`
- `EmitPheromone1/2/3` (Sigmoid, [0, 1]) -> `intent.pheromoneEmission[0/1/2] = output`
- `EmitSound` (Sigmoid, [0, 1]) -> `intent.soundIntensity = output`
- `SoundFrequency` (Sigmoid, [0, 1]) -> `intent.soundFreq = output`

**Threshold behaviors** (trigger when output > 0.5):
- `Want2Eat` -> `intent.wantsToEat = output > 0.5; intent.eatIntensity = output`
- `Want2Attack` -> `intent.wantsToAttack = output > 0.5; intent.attackIntensity = output`
- `Want2Flee` -> `intent.isSprinting = output > 0.5`
- `Want2Grow` -> `intent.wantsToGrow = output > 0.5`
- `Want2Heal` -> `intent.wantsToHeal = output > 0.5; intent.healRate = output * metabolism * 0.5`
- `Grab` -> `intent.wantsToGrab = output > 0.5`
- `Want2Reproduce` -> `intent.wantsToReproduce = output > 0.5`
- `Want2Mate` -> `intent.wantsToMate = output > 0.5`
- `ClockReset` -> if `output > 0.5`, reset `Tic` internal clock to 0
- `Burrow` -> `intent.wantsToBurrow = output > 0.5`
- `StoreFat` -> `intent.wantsToStoreFat = output > 0.5`

#### Trait Gating

Outputs for unowned traits are ignored:
- `Burrow`: requires Burrowing trait
- `Want2Mate`: requires Sexual Reproduction trait
- `StoreFat`: requires Fat Reserves trait
- `EmitPheromone1/2/3`, `EmitSound`, `SoundFrequency`: Tier 4 unlock required

#### Intent Structure

```typescript
interface OrganismIntent {
  moveForce: number;           // [-1, 1]
  turnTorque: number;          // [-1, 1]
  isSprinting: boolean;
  wantsToEat: boolean;
  eatIntensity: number;
  wantsToAttack: boolean;
  attackIntensity: number;
  wantsToGrow: boolean;
  wantsToHeal: boolean;
  healRate: number;
  wantsToGrab: boolean;
  acidLevel: number;           // [0, 1]
  wantsToReproduce: boolean;
  wantsToMate: boolean;
  wantsToBurrow: boolean;
  wantsToStoreFat: boolean;
  herdInfluence: number;       // [0, 1]
  pheromoneEmission: [number, number, number];
  soundIntensity: number;
  soundFreq: number;
}
```

### Unit Tests

- **Threshold behavior**: Set `Want2Eat` output to 0.49. Assert `wantsToEat = false`. Set to 0.51. Assert `wantsToEat = true`.
- **Continuous behavior**: Set `Accelerate` output to 0.7. Assert `moveForce = 0.7`.
- **Sprint activation**: Set `Want2Flee` to 0.6. Assert `isSprinting = true`.
- **Trait gating**: Set `Burrow` output to 1.0 for an organism without Burrowing trait. Assert `wantsToBurrow = false`.
- **Pheromone emission**: Set all 3 pheromone outputs. Assert `pheromoneEmission` array matches.
- **Clock reset**: Set `ClockReset` to 0.8. Assert the internal clock resets to 0.
- **Heal rate**: Set `Want2Heal` output = 0.8, metabolism = 2.0. Assert `healRate = 0.8 * 2.0 * 0.5 = 0.8`.

### QA Checklist

- [ ] All 18 output nodes are read and translated each tick
- [ ] Threshold is exactly 0.5 (strictly greater triggers action)
- [ ] Trait gating prevents action for unowned traits
- [ ] Tier gating prevents action for unlocked tiers
- [ ] Intent struct is written per-organism and read by downstream systems
- [ ] No allocation per tick (intent can be pre-allocated on organism struct)

---

## Step 3.4 — Physics System

### What You're Implementing

The `PhysicsEngine` module: applies 2D Newtonian mechanics to all organisms each tick. Reads action intents for movement forces, computes velocities with linear drag, resolves elastic collisions via the SpatialHashGrid, wraps positions on the toroidal world boundary, and computes movement energy costs.

### Design References

- `core-gameplay-systems.md` Section 2.4 — Force application formulas, velocity update with drag, position update, mass calculation, sprint mechanics, collision description.
- `components/game-components.md` Section 2 (PhysicsEngine) — Full `PhysicsEngine` interface, `PhysicsConfig`, force calculation algorithm, velocity update, toroidal wrapping, elastic collision resolution pseudocode, energy cost formulas, performance characteristics (~0.5ms for 900 organisms).
- `components/back-end.md` Section 2.2 — PhysicsSystem is step 4 in tick pipeline. Fixed `dt = 1/20`.

### Implementation Details

#### Force Calculation

```
accelOutput = intent.moveForce                    // [-1, 1] from brain
rotateOutput = intent.turnTorque                  // [-1, 1]
sprinting = intent.isSprinting
speedMult = sprinting ? 1.5 : 1.0

moveForce = accelOutput * baseForce * sqrt(Size1D * SpeedRatio) * ageStrengthFactor * speedMult
turnTorque = rotateOutput * (baseForce / 2) * SpeedRatio * Size1D^3 * ageStrengthFactor
```

#### Velocity Update

```
velocity += (moveForce / mass) * headingVector * dt
velocity *= (1 - dragCoefficient * dt)

angularVelocity += (turnTorque / momentOfInertia) * dt
angularVelocity *= (1 - angularDrag * dt)
```

#### Position Update and Wrapping

```
position += velocity * dt
heading += angularVelocity * dt

position.x = ((position.x % worldSize) + worldSize) % worldSize
position.y = ((position.y % worldSize) + worldSize) % worldSize
```

#### Mass Calculation

```
Size1D = sizeRatio * sqrt(maturity) * baseSize
Size2D = PI * Size1D^2
mass = Size2D * bodyMassDensity + (stomachPlant + stomachMeat) * materialMassDensity
```

#### Elastic Collision Resolution

```
For each overlapping pair (A, B) from SpatialHashGrid:
    overlap = (radiusA + radiusB) - dist(A, B)
    if overlap <= 0: skip

    // Separation (push apart)
    normal = normalize(A.pos - B.pos)
    A.pos += normal * (overlap / 2) * (B.mass / (A.mass + B.mass))
    B.pos -= normal * (overlap / 2) * (A.mass / (A.mass + B.mass))

    // Velocity exchange (elastic)
    relativeVel = A.vel - B.vel
    normalComponent = dot(relativeVel, normal)
    impulse = (2 * normalComponent) / (A.mass + B.mass)
    A.vel -= impulse * B.mass * normal
    B.vel += impulse * A.mass * normal
```

#### Energy Costs

```
moveEnergyCost = baseMoveCost * SpeedRatio * Size1D * |accelOutput| * metabolism * dt
turnEnergyCost = baseTurnCost * SpeedRatio * Size1D * |rotateOutput| * metabolism * dt
totalCost = (moveEnergyCost + turnEnergyCost) * (sprinting ? 3.0 : 1.0)
```

### Unit Tests

- **Force calculation**: Set accelOutput = 1.0, SpeedRatio = 1.0, Size1D = 1.0, ageStrengthFactor = 1.0. Assert moveForce = baseForce.
- **Sprint multiplier**: Assert moveForce with sprint is 1.5x normal, energy cost is 3x.
- **Drag convergence**: Apply a force for 1 tick, then no force for 100 ticks. Assert velocity converges toward 0.
- **Toroidal wrapping**: Move organism to x = 501 in a 500-unit world. Assert wrapped x = 1.
- **Negative wrapping**: Move organism to x = -1. Assert wrapped x = 499.
- **Mass calculation**: sizeRatio = 1.0, maturity = 1.0, baseSize = 1.0, no stomach contents. Assert mass = `PI * bodyMassDensity`.
- **Mass with stomach**: Add 10 u^2 of plant matter. Assert mass increases by `10 * 0.5`.
- **Elastic collision**: Two equal-mass organisms approaching head-on. After resolution, assert velocities are exchanged.
- **Unequal collision**: Small organism hits large one. Assert small gets more velocity change.
- **Zero velocity**: Organism with no forces applied stays stationary (within floating-point tolerance).
- **Energy cost**: Sprint at full throttle. Assert cost = `baseMoveCost * SpeedRatio * Size1D * 1.0 * metabolism * dt * 3.0`.

### Integration Tests

- **Physics-BrainEngine**: Wire `Constant -> Accelerate` with high weight. Run 50 ticks. Assert organism position changes and wraps correctly.
- **Collision cascade**: Place 5 organisms in a small area. Run physics. Assert no overlapping positions after resolution.

### QA Checklist

- [ ] `dt` is a fixed simulation constant (1/20), not derived from wall clock
- [ ] Toroidal wrapping is applied after every position update
- [ ] Drag coefficient is applied per tick, converging velocity toward zero
- [ ] Elastic collision preserves total momentum
- [ ] Collision separation scales inversely by mass (heavier objects move less)
- [ ] Sprint multiplier is 1.5x speed, 3x energy cost
- [ ] Defense speed penalty: `-2% max speed per DEF point` is applied
- [ ] Collision broadphase uses SpatialHashGrid, not O(n^2) pairwise checks
- [ ] Performance: ~0.5ms for 900 organisms

---

## Step 3.5 — Eating & Digestion System

### What You're Implementing

The `DigestiveSystem` module: models each organism's two-slot stomach (plant + meat), brain-controlled acid level, diet-dependent efficiency curves, and the 8-step digestion algorithm that converts stomach contents into usable energy each tick.

### Design References

- `core-gameplay-systems.md` Section 9 — Stomach capacity formula, eating mechanics, 8-step digestion algorithm, diet efficiency curves (concave power curves: `plantEff = 0.55 * (1 - diet)^0.7`, `meatEff = 0.80 * diet^0.7`), acid/fullness tradeoff, brain-digestion interaction.
- `core-gameplay-systems.md` Section 2.3 — Material properties table (energy density, mass density, hardness, reactivity for plant and meat).
- `components/game-components.md` Section 5 (DigestiveSystem) — Full interface, `StomachState`, `DigestResult`, `EatResult`, `MaterialProperties` constants, the complete 8-step algorithm with pseudocode, fungi efficiency (60% of plant), performance characteristics.
- `components/game-components.md` Section 4 (EnergySystem) — `EnergyTransferReason` enum, `transfer()` for accounting digestion energy gains and waste.

### Implementation Details

#### Material Constants

| Material | Energy Density | Mass Density | Hardness | Reactivity | Max Eff |
|----------|---------------|-------------|----------|-----------|---------|
| Plant    | 1.0 E/u^2     | 0.5 g/u^2  | 0.5      | 1.0       | 55%     |
| Meat     | 3.0 E/u^2     | 1.5 g/u^2  | 1.5      | 2.0       | 80%     |

#### Stomach Capacity

```
Size1D = sizeRatio * sqrt(maturity) * baseSize
Size2D = PI * Size1D^2
capacity = (Size2D / 2) * StomachMultiplier
```

#### Eating Algorithm

```
remainingCapacity = capacity - (plantMatter + meatMatter)
maxBiteSize = STR * mouthStrengthMult * Size1D

if pellet.hardness > STR * 3: cannot bite
consumed = min(pellet.size, remainingCapacity, maxBiteSize)
stomach[pellet.type] += consumed
pellet.size -= consumed
```

#### 8-Step Digestion Algorithm (Per Tick)

1. **Fullness & Acid**: `fullness = total / capacity`, `acidLevel = Digestion output`
2. **Digestion Potential**: if `acidLevel <= fullness`: `potential = Size2D * metabolism * (acidLevel / fullness)`, else: `potential = Size2D * metabolism * (1.0 + (acidLevel - fullness) * 0.1)`
3. **Split potential**: proportional to plant/meat ratio in stomach
4. **Digestion rate**: `rate_m = potential_m * reactivity_m`; `digested_m = min(rate_m * dt, matter_m)`
5. **Diet efficiency**: `plantEff = 0.55 * (1 - diet)^0.7`, `meatEff = 0.80 * diet^0.7`
6. **Over-digestion malus**: if `acidLevel > fullness`: `malus = (acidLevel - fullness) / 2`, reduce efficiency by `(1 - malus)`
7. **Energy extraction**: `energy_m = digested_m * energyDensity_m * efficiency_m`; waste = remainder returned to free biomass
8. **Remove digested**: subtract from stomach slots

### Unit Tests

- **Stomach capacity**: sizeRatio = 1.0, maturity = 1.0, StomachMult = 1.0. Assert capacity matches expected ~21 u^2.
- **Eating: full stomach**: Set stomach to capacity. Try to eat. Assert consumed = 0.
- **Eating: hardness check**: STR = 0.1, pellet hardness = 1.5. Assert cannot bite (hardness > STR * 3 = 0.3).
- **Eating: bite size**: Large pellet, small stomach space. Assert consumed = remaining capacity.
- **Diet efficiency pure herbivore**: diet = 0.0. Assert plantEff = 0.55, meatEff = 0.0.
- **Diet efficiency pure carnivore**: diet = 1.0. Assert plantEff = 0.0, meatEff = 0.80.
- **Diet efficiency omnivore**: diet = 0.5. Assert plantEff ~= 0.30, meatEff ~= 0.43.
- **Acid/fullness balance**: Set acidLevel = 0.5, fullness = 0.5 (balanced). Assert no over-digestion malus.
- **Over-digestion penalty**: Set acidLevel = 0.8, fullness = 0.4. Assert malus = 0.2, efficiency reduced by 20%.
- **Energy conservation**: Assert total energy extracted + waste = total energy in digested material (within floating-point tolerance).
- **Meat digests faster**: With equal stomach contents, assert meat digestion rate is 2x plant due to reactivity.
- **Empty stomach**: Assert digestion potential is 0 when stomach is empty (avoid divide by zero).
- **Fungi efficiency**: Assert fungi energy = plantEfficiency * 0.6.

### Integration Tests

- **Eat-digest cycle**: Organism eats a plant pellet. Run 50 ticks of digestion. Assert energy increases and stomach empties.
- **Energy conservation end-to-end**: Track total energy before eating. After full digestion, assert organism energy gain + waste = pellet energy.
- **Brain control**: Wire `Fullness -> Digestion`. Assert acid level correlates with stomach fullness.

### QA Checklist

- [ ] Two-slot stomach (plant + meat) tracked independently
- [ ] Acid level is read from brain's Digestion output each tick
- [ ] Diet efficiency uses concave power curves with exponent 0.7
- [ ] Over-digestion malus only applies when acidLevel > fullness
- [ ] Energy extraction uses `EnergySystem.transfer()` for accounting
- [ ] Waste energy is returned to free biomass via `EnergySystem.transfer()`
- [ ] No divide-by-zero when stomach is empty (guard fullness = 0)
- [ ] Material mass density affects organism mass (via PhysicsEngine)
- [ ] Fungi digestion uses 60% of plant efficiency
- [ ] Performance: ~0.45ms for 900 organisms

---

## Step 3.6 — Combat System

### What You're Implementing

The `CombatSystem` module: resolves melee attacks between organisms each tick. Computes attack force, checks defense penetration, applies diminishing-returns damage reduction, handles venom DoT application, computes knockback forces, generates meat from damage, and deducts attacker energy costs.

### Design References

- `core-gameplay-systems.md` Section 10 — Attack resolution formula, defense penetration check, damage reduction formula (`damageReduction = 1 - 1/(1 + DEF/10)`), venom mechanics, meat from combat, knockback, energy costs.
- `core-gameplay-systems.md` Section 1.1 (Venom Glands) — Venom DPS scaling, duration, immune system reduction, non-stacking behavior, energy cost per application.
- `core-gameplay-systems.md` Section 1.1 (Armor Plating) — Directional armor covering front or back 180 degrees.
- `components/game-components.md` Section 6 (CombatSystem) — Full interface, `AttackResult`, `VenomState`, `CombatConfig`, attack resolution algorithm, venom application algorithm, knockback formula, meat generation algorithm, directional armor blocking, camouflage attack break, immune system.

### Implementation Details

#### Attack Resolution

```
attackForce = Want2Attack_output * STR * Size1D * ageStrengthFactor

if attackForce <= target.DEF * defensePenetrationThreshold:
    finalDamage = 0   // cannot penetrate

baseDamage = attackForce - target.DEF
damageReduction = 1 - 1 / (1 + target.DEF / 10)
finalDamage = baseDamage * (1 - damageReduction) * biteDamageSetting
```

**Defense reduction examples**:
| DEF | Reduction |
|-----|-----------|
| 0.0 | 0% |
| 1.0 | 9.1% |
| 5.0 | 33.3% |
| 10.0 | 50% |
| 20.0 | 66.7% |

#### Directional Armor

Check angle between attacker approach vector and defender heading. Front armor covers forward 180 degrees (+/-90 from heading). Back armor covers rear 180 degrees. Only the chosen direction provides the armor bonus.

```
approachAngle = atan2(attacker.y - target.y, attacker.x - target.x)
relativeAngle = normalizeAngle(approachAngle - target.heading)

if target.armorDirection == 'front':
    armorActive = abs(relativeAngle) <= PI/2
else:
    armorActive = abs(relativeAngle) > PI/2

if armorActive:
    effectiveDEF = target.DEF + armorBonus   // +3/+6/+10 for light/medium/heavy
else:
    effectiveDEF = target.DEF
```

#### Venom Application

```
if attacker.hasVenom AND penetrated:
    venomDPS = baseVenomDamage * (attacker.Size1D / target.Size1D)
    venomDuration = baseVenomDuration * (1 - target.immuneStrength * 0.5)

    if target.venom.active:
        target.venom.remainingDuration = venomDuration
        target.venom.dps = max(target.venom.dps, venomDPS)   // no stacking
    else:
        target.venom = { active: true, dps: venomDPS, remainingDuration: venomDuration }

    attacker.energy -= venomEnergyCost   // 8 energy per application
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

if Want2Eat > 0.5:
    deposit into attacker stomach (up to remaining capacity)
    excess drops as meat pellet
else:
    drop meat pellet at target position
```

#### Attacker Energy Cost

```
attackEnergyCost = baseAttackCost * STR * Size1D * Want2Attack_output * metabolism
// Paid regardless of hit or miss
```

#### Venom Tick (every tick for poisoned organisms)

```
for each organism with active venom:
    damage = venom.dps * dt
    organism.health -= damage
    venom.remainingDuration -= dt
    if remainingDuration <= 0: venom.active = false
```

#### Camouflage Attack Break

Attacking while camouflaged sets `camoBreakTimer = 5.0`. No detection reduction while timer > 0.

### Unit Tests

- **Basic damage**: STR = 2.0, Size1D = 1.0, DEF = 0.0. Assert damage = `2.0 * biteDamageSetting`.
- **Defense penetration fail**: attackForce = 0.5, DEF = 1.0, threshold = 1.0. Assert damage = 0.
- **Diminishing defense**: DEF = 10.0. Assert `damageReduction = 0.5` (50%).
- **Venom DPS scaling**: attacker Size1D = 2.0, target Size1D = 1.0. Assert venomDPS = `baseVenomDamage * 2.0`.
- **Venom non-stacking**: Apply venom twice. Assert DPS = max of both, duration refreshed.
- **Venom immune reduction**: immuneStrength = 1.0. Assert venomDuration = `baseVenomDuration * 0.5`.
- **Knockback proportional to damage**: Double the damage, assert knockback doubles.
- **Knockback inversely proportional to mass**: Double the mass, assert knockback halves.
- **Meat to stomach**: Want2Eat > 0.5, stomach has room. Assert meat goes to stomach.
- **Meat overflow**: Stomach full. Assert excess drops as pellet.
- **Meat to ground**: Want2Eat < 0.5. Assert all meat drops as pellet.
- **Attack energy cost**: Assert attacker energy decreases even on a miss.
- **Directional armor front**: Attack from front with front armor. Assert increased DEF.
- **Directional armor bypass**: Attack from behind with front armor. Assert base DEF only.
- **Camouflage break**: Attack while camouflaged. Assert camoBreakTimer = 5.0.
- **Venom tick**: Apply venom with DPS = 1.0. After 5 ticks at dt = 0.05, assert health decreased by 0.25.

### Integration Tests

- **Kill flow**: Create attacker with high STR, target with low DEF and HP. Run combat until target.health <= 0. Assert death event and meat pellet spawned.
- **Combat energy accounting**: Track total energy before and after combat. Assert energy is conserved (damage -> meat + waste).
- **Venom-to-death**: Apply venom and let it tick down. Assert target eventually dies from poison if DPS is high enough.

### QA Checklist

- [ ] Attack only resolves when `Want2Attack > 0.5` AND target is adjacent
- [ ] Defense penetration threshold check prevents weak attacks from dealing damage
- [ ] `damageReduction = 1 - 1/(1 + DEF/10)` formula produces diminishing returns (never reaches 100%)
- [ ] Venom does NOT stack (DPS = max of current and new, duration refreshes)
- [ ] Venom energy cost (8 energy) is deducted from attacker
- [ ] Knockback uses PhysicsEngine.applyImpulse()
- [ ] Meat generation respects Want2Eat: to stomach if eating, to ground otherwise
- [ ] Attacker pays energy cost even on a miss
- [ ] Directional armor only applies when attack comes from the covered hemisphere
- [ ] Camouflage breaks for 5 seconds after attacking
- [ ] Immune system reduces venom duration by up to 50%, toxic fungi damage by 30%, plague chance by 40%
- [ ] All energy transfers use EnergySystem.transfer() for conservation tracking
- [ ] Kill events are emitted to EventDetector when target health reaches 0
- [ ] Performance: ~0.1ms per tick (most organisms are not attacking)
