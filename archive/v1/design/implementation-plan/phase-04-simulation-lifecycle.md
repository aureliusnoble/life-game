# Phase 4 — Simulation Lifecycle

Reproduction, death, genetics, mutations, species entropy, and environment systems that drive the organism lifecycle loop.

> **Before you start this phase**, read the general guidance in [`README.md`](./README.md).

### Phase 4 Guidance

**Read these design docs first:**
- `core-gameplay-systems.md` Sections 7-11 (Reproduction, Death/Farewell, Genetics/Mutations, Ageing/Species Entropy, Environment/Seasons)
- `components/game-components.md` Sections 12-14 (ReproductionSystem, GeneticsEngine, EnvironmentEngine)
- `architecture.md` Section 5 (Closed Energy Model) — reproduction and death are major energy flow events; understand the 5-account system

**Prerequisites:**
- Phases 2-3 must be complete. Reproduction depends on the energy system, entity types, and brain outputs. The environment engine depends on the spatial hash for plant spawning.

**No manager action needed for this phase.** Pure simulation code, all local.

**Important implementation note:**
The genetics engine is the most mathematically sensitive system in the game. Pay close attention to the mutation magnitude formulas and crossover logic in the design doc. Off-by-one errors or wrong distributions here will produce species that either never evolve or diverge wildly. Write thorough tests with seeded RNG to verify deterministic mutation outputs.

**QA handoff for this phase:**
When done, tell the manager: "Run `pnpm --filter server test` — all Phase 4 tests should pass. Key verifications: (1) Organisms accumulate egg energy and produce offspring when threshold is met, (2) Death drops correct amount of meat energy, (3) Mutations produce values within expected ranges for a given seed, (4) Species entropy multiplier increases metabolism over time using `1.0 + (age/halfLife)²`, (5) Plant spawning respects biome density limits and seasonal modifiers, (6) Energy conservation holds across reproduction and death events."

---

## Step 4.1 — Reproduction System

### What You're Implementing

The `ReproductionSystem` module: manages egg energy accumulation, egg laying, incubation timers, hatching, sexual fertilization, and nest bonuses. The brain's `Want2Reproduce` output drives egg production; `Want2Mate` drives sexual fertilization. Biological preconditions (maturity, health, energy) gate all reproduction.

### Design References

- `core-gameplay-systems.md` Section 3.3 — Full reproduction mechanics: asexual (§3.3.1), sexual (§3.3.2), nest sites (§3.3.3). Egg cost formula, hatching maturity formula `(HatchTime/BroodTime)²`, mating cooldown (60 sim-seconds), founder population costs, all fertilization conditions.
- `components/game-components.md` Section 7 (ReproductionSystem) — Full `ReproductionSystem` interface, `EggOrgan`, `Egg`, `NestBonus`, `ReproductionEvents` data structures, egg accumulation algorithm, laying algorithm, hatching algorithm, sexual fertilization algorithm, nest bonus calculation with `countNearbyMatching`.
- `components/back-end.md` Section 2.1 — System execution order: ReproductionSystem is step 8 (after EnergySystem, before GeneticsSystem).
- `core-gameplay-systems.md` Section 1.1 — Sexual Reproduction trait (10 BP), sex determination, mate-finding brain nodes.

### Implementation Details

#### Key Data Structures

```typescript
interface EggOrgan {
  storedEnergy: number;       // energy accumulated toward egg
  requiredEnergy: number;     // total cost to complete
  isReady: boolean;           // storedEnergy >= requiredEnergy
}

interface Egg {
  id: number;
  position: Vec2;
  energy: number;
  parentId: number;
  fatherId: number | null;
  speciesId: string;
  genome: GeneSet;
  brain: CompiledBrain;
  incubationTimer: number;    // seconds remaining
  hatchTime: number;
  broodTime: number;
  nestBonus: number;
  isSexual: boolean;
}

interface ReproductionEvents {
  eggsLaid: EggLaidEvent[];
  eggsHatched: EggHatchedEvent[];
  fertilizations: FertilizationEvent[];
}
```

#### Egg Energy Accumulation (per tick)

```
investRate = metabolism * baseInvestRate * dt
if organism.energy > organism.maxEnergy * 0.3:
    invest = min(investRate, organism.energy * 0.1, required - stored)
    EnergySystem.transfer(OrganismReserve, Egg, invest, EggInvest)
    eggOrgan.storedEnergy += invest
eggOrgan.isReady = (storedEnergy >= requiredEnergy)
```

#### Egg Cost Formula

```
eggCost = growthEnergyToReachBirthSize
        + physicalTraitCosts * bodyEnergyRatio
        + brainComplexityCost * (numHiddenNodes * 2 + numSynapses * 0.5)
        + baseEggEnergy
```

#### Asexual Egg Laying Conditions (all in same tick)

1. `Want2Reproduce > 0.5`
2. `maturity >= 1.0`
3. `health >= maxHealth * 0.5`
4. `eggOrgan.isReady == true`

#### Hatching

```
egg.incubationTimer -= dt * (1.0 / nestBonus.hatchTimeMultiplier)
if egg.incubationTimer <= 0:
    juvenileMaturity = (egg.hatchTime / egg.broodTime)²
    newOrganism = createOrganism({
        genome: egg.genome, brain: egg.brain,
        position: egg.position,
        maturity: juvenileMaturity,
        energy: egg.energy - growthCostForMaturity(juvenileMaturity),
    })
    EnergySystem.transfer(Egg, OrganismReserve, egg.energy, EggHatch)
```

#### Sexual Fertilization

Check all 7 conditions from `canMate()`: same species, opposite sex, both `Want2Mate > 0.5`, both mature, both healthy, female egg ready, male has 30% egg cost energy, within touch range, no cooldown. Then crossover genomes via GeneticsEngine, assign random sex, apply mutations, lay egg, set 60-second cooldown on both parents.

#### Nest Bonus Calculation

```
nearbyEmitters = grid.countNearbyMatching(egg.position, egg.radius * 2, egg.speciesId,
    (org) => org.emitPheromone1 > 0.3 || org.emitPheromone2 > 0.3 || org.emitPheromone3 > 0.3)
bonus = min(0.5, nearbyEmitters * 0.1)
hatchTimeMultiplier = 1.0 - bonus * 0.4     // up to 20% faster
startingEnergyMultiplier = 1.0 + bonus * 0.3 // up to 15% more energy
```

### Unit Tests

- **Egg accumulation**: Organism with surplus energy increases `storedEnergy` each tick; organism below 30% energy does not invest.
- **Egg cost**: Verify formula output for known stat combinations matches expected values.
- **Asexual laying**: Organism meeting all 4 conditions lays egg; organism missing any condition does not.
- **Hatching**: Egg with timer=0 hatches into organism with correct maturity `(HatchTime/BroodTime)²`.
- **Sexual fertilization**: Two organisms meeting all 7 conditions produce crossed-over egg; both enter cooldown. Fail cases: same sex, different species, cooldown active, female egg not ready, male insufficient energy.
- **Nest bonus**: 0 emitters → 0 bonus. 3 emitters → 0.3 bonus → hatch 12% faster. 5+ emitters → 0.5 cap.
- **Energy conservation**: Total energy in (egg) equals energy out (newborn + growth costs).

### Integration Tests

- Run 100-tick simulation with reproducing organisms: verify population grows, eggs appear and hatch.
- Sexual species pair: verify mate-finding, fertilization event, offspring has mixed genome.
- Nest site: organisms emitting pheromone near eggs → verify faster hatch times.

### QA Checklist

- [ ] Egg readiness progresses visibly via `EggStored` input node (0→1)
- [ ] Asexual organisms lay eggs when conditions are met, eggs hatch after incubation
- [ ] Sexual organisms require mate-finding; solo organisms cannot reproduce
- [ ] Mating cooldown prevents rapid sequential fertilization (60 sim-seconds)
- [ ] Nest bonus correctly accelerates hatching and increases starting energy
- [ ] Energy is conserved through the full cycle: parent → egg → offspring
- [ ] Spore dispersal produces spores with parabolic flight and correct germination rate

#### Spore Dispersal Mechanics

- `components/game-components.md` Section 7 (ReproductionSystem — Spore Dispersal Branch) — Full spec for spore flight, cost, and germination.

When an organism has the Spore Dispersal trait and `SporeDispersal` output > 0.5:

```typescript
function attemptSporeDispersal(organism: Organism, dt: number): Spore | null {
  if (organism.brainOutputs.SporeDispersal <= 0.5) return null;
  if (!organism.traits.sporeDispersal) return null;
  if (organism.eggOrgan.storedEnergy < organism.eggOrgan.requiredEnergy * 1.3) return null; // 1.3× egg cost

  // Create spore with parabolic flight
  const direction = Math.random() * Math.PI * 2;
  const range = organism.traits.sporeRange; // 3-30 units from designer slider
  const flightDuration = 0.5; // 0.5 seconds parabolic arc

  const spore: Spore = {
    id: nextId(),
    originX: organism.position.x,
    originY: organism.position.y,
    destX: organism.position.x + Math.cos(direction) * range,
    destY: organism.position.y + Math.sin(direction) * range,
    flightTimer: flightDuration,
    genome: GeneticsEngine.mutate(organism.genome, { varianceMult: 2.0 }), // 2× mutation variance
    brain: GeneticsEngine.mutateBrain(organism.brain, organism.genome),
    parentSpeciesId: organism.speciesId,
    energy: organism.eggOrgan.storedEnergy,
  };

  // Deduct energy (1.3× normal egg cost)
  EnergySystem.transfer(OrganismReserve, Egg, organism.eggOrgan.storedEnergy, EggInvest);
  organism.eggOrgan.storedEnergy = 0;

  return spore;
}

// On landing (flightTimer reaches 0):
function landSpore(spore: Spore): Organism | null {
  // 30% germination rate — 70% of spores fail
  if (Math.random() > 0.30) {
    EnergySystem.transfer(Egg, FreeBiomass, spore.energy, SporeFailure);
    return null;
  }

  // Successful germination: spawn organism at 60% birth size
  return createOrganism({
    genome: spore.genome,
    brain: spore.brain,
    position: { x: spore.destX, y: spore.destY },
    maturity: 0.0, // starts as juvenile
    sizeScale: 0.6, // 60% of normal birth size
    energy: spore.energy * 0.8, // some energy lost in transit
  });
}
```

Key parameters: 1.3× egg cost, 2× mutation variance, 0.5s parabolic flight, 30% germination rate, 60% birth size. Failed spores return energy to freeBiomass.

---

## Step 4.2 — Death System

### What You're Implementing

The `DeathSystem` module: checks death conditions each tick, converts dead organisms to meat pellets, handles entity cleanup, and emits death events. Runs as the 11th system in the tick pipeline (after environment, before persistence).

### Design References

- `core-gameplay-systems.md` Section 3.4 — Death conditions (health=0), body-to-meat conversion formula: `meatEnergy = bodyPointEnergy + remainingEnergy + fatEnergy * 0.765`.
- `core-gameplay-systems.md` Section 3.4 — Early retirement mechanic: 10x ageingFactor multiplier.
- `components/back-end.md` Section 2.1 — DeathSystem is step 11 in tick pipeline.
- `components/game-components.md` Section 4 (EnergySystem) — `OrganismDeath` transfer reason.

### Implementation Details

```typescript
interface DeathSystem {
  tick(organisms: Organism[], dt: number): DeathEvent[];
  checkDeathCondition(organism: Organism): boolean;
  convertToMeat(organism: Organism): MeatPellet[];
}

interface DeathEvent {
  organismId: number;
  speciesId: string;
  cause: 'starvation' | 'combat' | 'age' | 'venom' | 'environmental';
  position: Vec2;
  age: number;
  meatDropped: number;
}
```

#### Death Check (per organism per tick)

```
if organism.health <= 0:
    die(organism, determineCause(organism))
```

Health reaches 0 from: combat damage, venom DoT, starvation (energy depleted → health drains), or age-related decline.

#### Body-to-Meat Conversion

```
meatEnergy = organism.bodyEnergy + organism.reserves + organism.fatEnergy * 0.765
// Split into 1-3 meat pellets at organism position
pelletCount = max(1, ceil(meatEnergy / maxPelletEnergy))
for each pellet:
    EnergySystem.transfer(OrganismReserve, MeatPellet, pelletEnergy, OrganismDeath)
```

#### Cleanup

- Remove organism from spatial hash grid
- Remove from organisms array
- Update species population count in SpeciesManager
- Emit DeathEvent for EventDetector

### Unit Tests

- Organism with health=0 is removed and meat pellets spawn.
- Meat energy equals organism's body + reserves + fat*0.765.
- Early retirement: organism receives 10x ageing multiplier → accelerated decline.
- Starvation: organism with energy=0 loses health each tick → eventually dies.
- Death events contain correct cause classification.

### Integration Tests

- Run simulation with combat: verify killed organisms drop meat, killer can eat it.
- Run simulation long enough for ageing: verify organisms die of old age, population turns over.

### QA Checklist

- [ ] Dead organisms are fully removed (not just hidden)
- [ ] Meat pellets appear at death position with correct energy
- [ ] Energy conservation holds across death events
- [ ] Death events are emitted for EventDetector consumption

---

## Step 4.3 — Genetics Engine

### What You're Implementing

The `GeneticsEngine` module: handles gene inheritance, mutation (Poisson-distributed count, Gaussian-distributed magnitude), brain mutations (weight/bias shifts, synapse add/remove), sexual crossover (40/40/20 gene blend, mother-base brain topology), and mutation pool tracking.

### Design References

- `core-gameplay-systems.md` Section 3.5 — Full genetics system: gene list (body, reproduction, biology, social, meta-mutation, brain genes), mutation mechanics (Poisson count, Gaussian relative+absolute shift), brain mutation types (weight shift, bias shift, new synapse 10%, remove synapse 5%), sexual crossover algorithm (40/40/20 for genes, mother-base brain topology for brains), mutation pool tracking.
- `components/game-components.md` Section 8 (GeneticsEngine) — `GeneticsEngine` interface, `GeneSet`, `MutationRecord`, crossover and mutation algorithms.
- `components/back-end.md` Section 2.1 — GeneticsSystem is step 9 in tick pipeline (immediately after ReproductionSystem).

### Implementation Details

```typescript
interface GeneticsEngine {
  mutate(genome: GeneSet): { genome: GeneSet; mutations: MutationRecord[] };
  mutateBrain(brain: CompiledBrain, genome: GeneSet): { brain: CompiledBrain; mutations: MutationRecord[] };
  crossover(mother: GeneSet, father: GeneSet): GeneSet;
  crossoverBrain(motherBrain: CompiledBrain, fatherBrain: CompiledBrain): CompiledBrain;
}

interface MutationRecord {
  geneId: string;
  oldValue: number;
  newValue: number;
  parentId: number;
  offspringId: number;
  offspringLifespan: number;  // updated on death
  offspringReproduced: boolean;
  timestamp: number;
}
```

#### Gene Mutation Algorithm

```
// Step 1: How many mutations?
numGeneMutations = Poisson(λ = parent.GeneMutationChance)  // default ~2.0
numBrainMutations = Poisson(λ = parent.BrainMutationChance)  // default ~1.5

// Step 2: Which genes mutate?
for i in 0..numGeneMutations:
    gene = randomGene(allBodyAndBioGenes)
    // Step 3: How much?
    u = Gaussian(0, 1)
    v = (1 + MutationVariance)^u
    newValue = v * gene.value
    // Absolute component (prevents stuck at 0)
    u_abs = Gaussian(0, 0.01 + MutationVariance/20)
    newValue += u_abs
    gene.value = clamp(newValue, gene.min, gene.max)
```

#### Brain Mutation Types

- **Weight shift** (~85%): Random synapse weight mutated by same relative+absolute formula.
- **Bias shift**: Random node bias mutated.
- **New synapse** (~10%): Add random connection with small weight.
- **Remove synapse** (~5%): Disable a random synapse.

#### Sexual Crossover (40/40/20)

```
for each gene (excluding Sex and brain genes):
    roll = random()
    if roll < 0.40: offspring.gene = mother.gene
    elif roll < 0.80: offspring.gene = father.gene
    else:
        blend = random(0.3, 0.7)
        offspring.gene = mother.gene * blend + father.gene * (1 - blend)
// Sex gene: random 50/50 assignment, not crossed over
```

#### Brain Crossover

- Start with mother's brain topology
- Shared synapses: 40/40/20 weight crossover
- Mother-only synapses: keep 70%, drop 30%
- Father-only synapses: add 30%, skip 70%
- Node biases: same 40/40/20 for shared nodes

#### Meta-Mutation

`GeneMutationChance`, `GeneMutationVariance`, and `BrainMutationChance` are themselves genes subject to mutation. This allows mutation rates to evolve.

### Unit Tests

- **Poisson distribution**: Generate 10,000 samples with λ=2.0, verify mean ≈ 2.0 ± 0.1.
- **Gene mutation**: Verify relative+absolute formula produces values within expected range; genes clamped to valid bounds.
- **Brain mutations**: Weight shift changes exactly one synapse; new synapse adds one connection; remove synapse disables one.
- **Sexual crossover**: Run 1,000 crossovers, verify ~40% mother, ~40% father, ~20% blend ratio.
- **Brain crossover**: Mother-only synapses retained ~70%, father-only added ~30%.
- **Meta-mutation**: `GeneMutationChance` itself can mutate, producing offspring with different mutation rates.
- **Immutable Sex gene**: Verify Sex gene is never mutated (randomly assigned, not inherited).

### Integration Tests

- Reproduce asexually 100 times: verify offspring have small variations from parent.
- Reproduce sexually 50 times: verify offspring genes come from both parents.
- Run multi-generational simulation: verify genetic drift occurs (population stats change over time).

### QA Checklist

- [ ] Mutation records are stored in mutation pool with correct `geneId`, `oldValue`, `newValue`
- [ ] Default mutation rate produces ~1-3 gene changes per offspring
- [ ] Brain mutations can add/remove synapses (topology changes)
- [ ] Sexual crossover produces offspring with traits from both parents
- [ ] Gene values stay within defined ranges after mutation
- [ ] Meta-mutation genes evolve over many generations
- [ ] Convergence detection correctly identifies converging genes
- [ ] Additional evolvable genes (EncounterMemoryDuration, BurrowSpeed, BurrowEfficiency) mutate correctly

#### Convergence Detection

- `components/game-components.md` Section 8 (GeneticsEngine — Convergence Detection) — Per-gene tracking of mutation direction convergence.

Track mutation direction per gene within a species to detect convergent evolution (many organisms mutating the same gene in the same direction). Convergent genes are offered with higher priority in daily mutation options.

```typescript
interface GeneConvergenceTracker {
  geneId: string;
  upCount: number;    // mutations that increased this gene
  downCount: number;  // mutations that decreased this gene
  sampleCount: number;
  isConverging: boolean; // true when 60%+ mutations in same direction across 5+ samples
}

function updateConvergence(tracker: GeneConvergenceTracker, oldValue: number, newValue: number): void {
  tracker.sampleCount++;
  if (newValue > oldValue) tracker.upCount++;
  else if (newValue < oldValue) tracker.downCount++;

  // Convergence threshold: 60%+ of mutations in same direction, minimum 5 samples
  if (tracker.sampleCount >= 5) {
    const maxRatio = Math.max(tracker.upCount, tracker.downCount) / tracker.sampleCount;
    tracker.isConverging = maxRatio >= 0.60;
  }
}

// In generateDailyOptions(): converging genes get priority slot as "convergent" category
function generateDailyOptions(speciesId: string): DailyMutationOptions {
  const pool = getMutationPool(speciesId);
  const convergence = getConvergenceTrackers(speciesId);

  // 3 diverse options: best body mutation, best brain mutation, most common convergent
  const bodyOption = selectBestBodyMutation(pool);
  const brainOption = selectBestBrainMutation(pool);
  const convergentOption = selectConvergentMutation(pool, convergence);

  return { options: [bodyOption, brainOption, convergentOption], poolSize: pool.length };
}
```

Convergence data is reset every 24 hours (aligned with daily mutation cycle).

#### Additional Evolvable Genes

- `components/game-components.md` Section 8 (GeneticsEngine — Additional Evolvable Genes) — Genes beyond the core body stats.

The following genes are included in the `GeneSet` and subject to standard mutation mechanics:

```typescript
// Add to GeneSet interface
interface GeneSet {
  // ... existing body, reproduction, biology, social, meta-mutation genes ...

  // Additional evolvable genes
  EncounterMemoryDuration: number; // 5-30 seconds — how long an organism remembers encountered entities
  BurrowSpeed: number;             // 1.0-2.5 seconds — time to enter/exit burrow
  BurrowEfficiency: number;        // 1.5-2.5× — metabolism reduction while burrowed
  SoundFrequency: number;          // 0-1 — frequency of emitted sound (already in brain outputs)
}
```

- **EncounterMemoryDuration** (5-30s): Controls how long the encounter sharing memory lasts. Longer memory = better information but stale data risk.
- **BurrowSpeed** (1.0-2.5s): Time to complete burrowing animation. Lower = faster escape but higher energy cost.
- **BurrowEfficiency** (1.5-2.5×): Metabolism reduction multiplier while burrowed. Higher = more efficient hiding.

These genes are tier-gated: EncounterMemoryDuration requires the Encounter Sharing trait (Tier 3), BurrowSpeed/BurrowEfficiency require the Burrowing trait (Tier 3).

---

## Step 4.4 — Individual Ageing & Species Entropy

### What You're Implementing

Two separate ageing systems: (1) individual organism ageing with strength decay and metabolism increase, and (2) species-level entropy that escalates metabolism cost over real-time hours since deployment. Both systems guarantee generational turnover and ecosystem churn.

### Design References

- `core-gameplay-systems.md` Section 3.4 — Individual ageing: `ageingThreshold = ageingSetting / metabolism`, exponential strength penalty `baseStrength * (1 - strengthPenalty)^ageingFactor`, linear metabolism penalty `baseMetabolism * (1 + ageingFactor * metabolismPenalty)`.
- `core-gameplay-systems.md` Section 3.4 — Species entropy: `entropyMultiplier = 1.0 + (speciesAge / entropyHalfLife)²`, default halfLife=72h. Applied to all organisms of the species. Early retirement: 10x ageingFactor multiplier.
- `components/game-components.md` Section 10 (SpeciesManager) — Species metadata tracks `deployedAt` timestamp for entropy calculation.

### Implementation Details

#### Individual Ageing (per organism per tick)

```typescript
function applyAgeing(organism: Organism, dt: number): void {
  organism.age += dt * organism.metabolism;
  const threshold = AGEING_SETTING / organism.baseMetabolism;
  const ageingFactor = Math.max(0, organism.age - threshold);

  // Exponential strength decay
  organism.effectiveStrength = organism.baseStrength
    * Math.pow(1 - STRENGTH_PENALTY, ageingFactor);

  // Linear metabolism increase
  organism.effectiveMetabolism = organism.baseMetabolism
    * (1 + ageingFactor * METABOLISM_PENALTY);
}
```

#### Species Entropy

```typescript
function computeEntropyMultiplier(species: SpeciesMetadata): number {
  const hoursDeployed = (Date.now() - species.deployedAt) / 3_600_000;
  return 1.0 + Math.pow(hoursDeployed / species.entropyHalfLife, 2);
}

// Applied during EnergySystem cost calculation:
// effectiveMetabolismCost = baseMetabolismCost * metabolism * Size2D * entropyMultiplier
```

#### Entropy Timeline (default 72h halfLife)

| Hours Deployed | Entropy Multiplier | Effect |
|---|---|---|
| 0 | 1.0x | No penalty |
| 24 | 1.11x | 11% more expensive |
| 72 | 2.0x | Double metabolism |
| 120 | 5.84x | Struggling |
| 168 | 10.4x | Near unsustainable |

#### Early Retirement

When player retires species: all organisms receive `10x ageingFactor multiplier` → rapid decline over ~1 hour. Player can immediately design a new species with entropy reset to 1.0.

### Unit Tests

- **Ageing threshold**: Organism below threshold has ageingFactor=0, no penalties.
- **Strength decay**: At ageingFactor=5, effective strength is significantly reduced.
- **Metabolism increase**: At ageingFactor=5, metabolism cost is notably higher.
- **Combined effect**: Old organism cannot sustain energy balance → guaranteed death.
- **Species entropy**: At 0h → 1.0x, at 72h → 2.0x, at 144h → 5.0x.
- **Early retirement**: 10x multiplier causes rapid decline within ~100 ticks.

### Integration Tests

- Run 2000-tick simulation: verify organisms die of old age, new generations emerge.
- Deploy species, advance clock 72h: verify all organisms burn energy at 2x rate.

### QA Checklist

- [ ] Ageing factor accumulates only after threshold (young organisms unaffected)
- [ ] Old organisms visibly weaken (lower attack damage, higher energy consumption)
- [ ] Species entropy multiplier is displayed in species dashboard
- [ ] Entropy resets to 1.0 on new species deployment
- [ ] Early retirement triggers accelerated ageing for all organisms in species

---

## Step 4.5 — Environment Engine

### What You're Implementing

The `EnvironmentEngine` module: manages biome map generation, plant spawning (density-dependent, biome/season-modified), meat pellet decay, pheromone grid diffusion/decay, day/night cycle, seasonal transitions, and biome-season interactions.

### Design References

- `core-gameplay-systems.md` Section 2.2 — Biome system: 5 biome types (Grassland, Forest, Desert, Wetland, Rocky) with plant density, pellet size, meat decay rate, visibility, movement modifiers. Seasonal system: 28-day cycle, Spring/Summer/Autumn/Winter with plant growth multipliers, metabolism cost multipliers.
- `core-gameplay-systems.md` Section 2.3 — Plant spawning: `spawnRate = fertility * seasonMult * (freeBiomass/totalEnergy)`, density-dependent: `effectiveSpawnRate = spawnRate / (1 + localHerbivoreCount/50)`. Meat decay: `decayRate = biomeDecayMult * pelletSize * 0.01`.
- `components/game-components.md` Section 9 (EnvironmentEngine) — Full `EnvironmentEngine` interface, `BiomeMap`, `BiomeCell`, `SeasonState`, `PheromoneGrid` data structures, biome generation algorithm, pheromone diffusion, seasonal transition logic.
- `components/back-end.md` Section 2.1 — EnvironmentSystem is step 10 in tick pipeline.

### Implementation Details

#### Key Data Structures

```typescript
interface EnvironmentEngine {
  tick(world: WorldState, dt: number): void;
  generateBiomeMap(seed: number): BiomeMap;
  getBiomeAt(pos: Vec2): BiomeType;
  getSeasonState(): SeasonState;
}

interface BiomeMap {
  cells: BiomeCell[];         // 625 cells (25x25)
  cellSize: number;           // 20 units
}

interface BiomeCell {
  biome: BiomeType;
  fertility: number;          // base plant growth rate
  plantDensity: number;       // current plants in cell
}

enum BiomeType { Grassland, Forest, Desert, Wetland, Rocky }

interface SeasonState {
  current: Season;
  phase: number;              // [0, 1] progress through current season
  dayOfCycle: number;         // 1-28
  plantGrowthMult: number;
  metabolismCostMult: number;
}

interface PheromoneGrid {
  channels: Float32Array[];   // 3 channels (R, G, B), each 625 cells
  diffuse(dt: number): void;
  emit(pos: Vec2, channel: number, intensity: number): void;
  sample(pos: Vec2, channel: number): { strength: number; gradient: Vec2 };
}
```

#### Biome Generation

Use Perlin/simplex noise to create organic biome regions. Map noise values to biome types with soft gradient boundaries. Seed-deterministic for reproducibility.

#### Plant Spawning (per cell per tick)

```
fertility = cell.baseFertility * seasonState.plantGrowthMult
freeBiomassRatio = freeBiomass / totalEnergy
localHerbivoreCount = grid.getCellDensity(cellCenter)
effectiveRate = fertility * freeBiomassRatio / (1 + localHerbivoreCount / 50)

if random() < effectiveRate * dt:
    pelletSize = biome.basePelletSize * (0.5 + random())
    pelletEnergy = pelletSize * PLANT_ENERGY_DENSITY  // 1.0 E/u²
    if freeBiomass >= pelletEnergy:
        EnergySystem.transfer(FreeBiomass, PlantPellet, pelletEnergy, PlantSpawn)
        create plant at random position within cell
```

#### Meat Decay (per pellet per tick)

```
decayRate = biome.meatDecayMult * pellet.size * 0.01
decayAmount = decayRate * dt
energyDecayed = decayAmount * MEAT_ENERGY_DENSITY  // 3.0 E/u²
pellet.energy -= energyDecayed
pellet.size -= decayAmount
EnergySystem.transfer(MeatPellet, FreeBiomass, energyDecayed, MeatDecay)
if pellet.size <= 0.01: destroy pellet
```

#### Pheromone Diffusion

Each tick, for each cell in each channel: diffuse pheromone to neighbors (fraction per tick), decay overall intensity. Pheromone gradient computed from cell differences for `PheromoneAngle` input nodes.

#### Seasonal Cycle

Wall-clock based, 28-day cycle. Smooth transitions over 2-3 days between seasons. Season affects: plant growth multiplier, metabolism cost multiplier, biome boundaries (wetland expands in spring, desert expands in summer, etc.).

### Unit Tests

- **Biome generation**: Same seed produces identical biome map. All 5 biome types present.
- **Plant spawning**: Higher fertility → more plants. Zero freeBiomass → no spawning. High herbivore density → reduced spawning.
- **Meat decay**: Pellet loses size each tick at expected rate. Pellet destroyed when size < 0.01.
- **Pheromone**: Emit at position → sample at same position returns high intensity. Intensity decays over time. Gradient points toward source.
- **Seasonal cycle**: Day 1-7 = Spring, 8-14 = Summer, 15-21 = Autumn, 22-28 = Winter.
- **Season effects**: Spring plantGrowthMult = 1.5x, Winter = 0.3x.

#### Day/Night Cycle

Sinusoidal `ambientLight` value (0.0 at midnight, 1.0 at noon), cycling every 24 simulation-hours (~6 real-time hours). Broadcast in every tick's environment header.

```
ambientLight = 0.5 + 0.5 * sin(2π * simulationTime / dayNightPeriod)
effectiveViewRadius = ViewRadius * (0.6 + 0.4 * ambientLight)
```

Night reduces vision for all organisms. Echolocation range is unaffected by light level.

#### Fungi System

Fungi are environmental modifiers that spawn naturally based on ecosystem conditions. They are NOT player organisms.

```typescript
interface FungusEntity {
  id: number;
  type: FungusType;        // Decomposer, ToxicMold, NutrientNetwork, ParasiticBloom, Bioluminescent
  position: Vec2;
  size: number;            // cells covered (1-8)
  age: number;
  maxAge: number;          // lifetime in ticks
}
```

**Spawning conditions** (checked every 60 seconds per cell):
- **Decomposer**: 5+ deaths in area within last hour → spawns in that cell. Lasts until local meat supply exhausted.
- **Toxic Mold**: Wetland biome during spring/autumn → chance spawn. 3x3 cells. Deals 0.5 HP/s to organisms in area. Lasts 48h.
- **Nutrient Network**: Forest biome with dense plant clusters → slow spawn. 8x8 sparse network. Redistributes plant energy (overfull cells donate to underfull). Persistent until forest shrinks.
- **Parasitic Bloom**: High organism traffic (50+ transits/hour through cell) → fast spawn. 2x2 cells. Drains 0.3 E/s from passing organisms (energy goes to FreeBiomass). Lasts 24h.
- **Bioluminescent**: Rocky biome during winter → slow spawn. 1x1 cell. Emits false "food" signal detectable by vision inputs (lures organisms with simple approach-food brains). Permanent until biome shifts.

**Fungi nutrition**: Organisms can eat fungi. Energy = 60% of equivalent-sized plant pellet. Uses plant digestion pathway (diet-dependent, favors herbivores).

**Per-tick effects**: Each active fungus applies its effect to organisms within its cell range. ToxicMold deals damage (reduced by immune system). ParasiticBloom drains energy. NutrientNetwork redistributes plant pellet energy across cells.

#### Ecological Events System

World events that prevent ecosystem stasis. The EnvironmentEngine checks trigger conditions and manages active events.

```typescript
interface EcologicalEvent {
  type: EcologicalEventType;
  startTick: number;
  duration: number;         // ticks
  targetBiome?: BiomeType;  // for biome-specific events
  targetSpecies?: string;   // for Plague
  intensity: number;
}

enum EcologicalEventType {
  Bloom,           // Plant spawn 2x in one biome, 48h
  Drought,         // Desert expands, plant spawn 50% globally, 72h
  Plague,          // DoT on dominant species (>30% pop), 24h
  Migration,       // NPC organism herd passes through, 24h
  FungiOutbreak,   // Large fungi patches in wetland/forest, 96h
  MeteorImpact,    // Random area cleared, instant
}
```

**Trigger conditions** (checked every 60 seconds):
- **Bloom**: 80% base chance in Spring, +20% if plant biomass < 30% capacity
- **Drought**: 60% base in Summer, +20% if total biomass > 70%
- **Plague**: 30% base at Winter/Spring transition, +30% if any species > 30% population
- **Migration**: 50% any season (bi-weekly check)
- **Fungi Outbreak**: 70% Spring/Autumn, +20% if high death count in wetland/forest
- **Meteor Impact**: 10% any season (~1 per season)

**Event resolution**: Active events modify environment parameters during their duration. Bloom increases spawn rate in target biome. Drought reduces global spawn rate and expands desert cells. Plague applies health DoT to target species organisms (spreads by proximity). Migration spawns temporary NPC organisms. Meteor clears all entities in a random radius.

**Warning**: 30-second notification broadcast before event onset.

#### Population Pressure Valve

If total organism count exceeds 2,000, free biomass → plant conversion accelerates (soft self-correcting mechanism, NOT a hard kill switch). This prevents runaway populations while maintaining the "no hard caps" design principle.

```
if totalOrganisms > 2000:
    plantSpawnBoost = 1.0 + (totalOrganisms - 2000) / 1000
    // At 3000 organisms: 2x plant spawn → more food → more competition → natural equilibrium
```

### Unit Tests

- **Fungi spawning**: Decomposer spawns after 5 deaths in area. Toxic Mold spawns in wetland during spring.
- **Fungi effects**: Toxic Mold deals 0.5 HP/s to organisms in range (reduced by immune strength). Parasitic Bloom drains energy.
- **Fungi nutrition**: Eating fungi yields 60% of equivalent plant energy.
- **Ecological events**: Bloom doubles plant spawn in target biome. Drought reduces global spawn 50%. Plague targets dominant species.
- **Event triggers**: Events fire based on season and ecosystem conditions. No more than 2 active events simultaneously.
- **Day/night**: ambientLight cycles sinusoidally. View radius reduced 40% at midnight.
- **Population valve**: Plant spawn accelerates when organism count exceeds 2000.

### Integration Tests

- Run 1000-tick simulation: verify plant count reaches equilibrium, meat decays, energy is conserved.
- Advance through full seasonal cycle: verify biome modifier changes, plant growth varies.
- Emit pheromone, verify organisms with pheromone input nodes detect it.
- Spawn fungi, run 100 ticks: verify effects apply and fungi expire at maxAge.
- Trigger ecological event, verify environment parameters change during event duration.

### QA Checklist

- [ ] Biome map looks organic (no grid artifacts) with soft boundaries
- [ ] Plant density varies by biome (Forest = high, Desert = low)
- [ ] Seasonal changes are visible (plant growth rate shifts)
- [ ] Pheromone diffuses and decays over time
- [ ] Pheromone gradient correctly points toward emission source
- [ ] Energy conservation holds: freeBiomass + plants + meat is constant (excluding organism portion)
