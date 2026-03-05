# Phase 5 — Simulation Management

Species tracking, AI ecosystem management, event detection, and the master simulation loop that orchestrates all systems at 40 TPS.

> **Before you start this phase**, read the general guidance in [`README.md`](./README.md).

### Phase 5 Guidance

**Read these design docs first:**
- `components/back-end.md` Sections 1-5 (Server architecture, simulation pipeline, WorldManager, game loop, graceful shutdown)
- `core-gameplay-systems.md` Sections 7 and 12 (Observable events, AI ecosystem management, species lifecycle)
- `components/game-components.md` Section 15 (SpeciesManager interface)

**Prerequisites:**
- Phases 2-4 must be complete. The World orchestrator calls all 12 simulation systems in order, so every system must exist. The SpeciesManager depends on entity tracking from Phase 2.

**No manager action needed for this phase.** Pure simulation code, all local. The AI species templates are hardcoded data — no external service needed.

**This phase produces the first runnable simulation.** Step 5.5 is a full integration test: deploy 3 species, run 500 ticks, verify energy conservation and no invalid state. This is the first time you can watch the simulation run end-to-end. If something is wrong in Phases 2-4, this is where it surfaces.

**QA handoff for this phase:**
When done, tell the manager: "Run `pnpm --filter server test` — all tests including the integration test should pass. Then run the server standalone: `pnpm --filter server dev`. It should start the simulation loop at 40 TPS, log tick timing to console, and run without crashing for at least 5 minutes. Watch for: (1) tick time staying under 3ms average, (2) no NaN/Infinity warnings, (3) organism counts rising and falling naturally as species compete."

---

## Step 5.1 — Species Manager

### What You're Implementing

The `SpeciesManager` module: tracks all active species, maintains population counts, aggregates per-species statistics (population, average energy, generation count, mutation pool), handles species creation/retirement, and manages the 30-species target. This is the bookkeeping layer that other systems query for species-level data.

### Design References

- `components/game-components.md` Section 10 (SpeciesManager) — Full `SpeciesManager` interface, `SpeciesMetadata`, population tracking, stats aggregation, deployment/retirement logic.
- `core-gameplay-systems.md` Section 5 — Competition & Ecosystem Balance: 30-species target, species entropy tracking.
- `core-gameplay-systems.md` Section 3.1 — Deployment: species slot (one per player), founder population (1-10), biome choice, extinction recovery with AI placeholder.
- `components/back-end.md` Section 8 (AI Ecosystem Manager) — Interaction with SpeciesManager for AI species injection/retirement.

### Implementation Details

```typescript
interface SpeciesManager {
  register(species: SpeciesConfig): SpeciesMetadata;
  retire(speciesId: string): void;
  getMetadata(speciesId: string): SpeciesMetadata | undefined;
  getAllActive(): SpeciesMetadata[];
  getPopulationCount(speciesId: string): number;
  updateStats(organisms: Organism[]): void;
  getSpeciesForPlayer(playerId: string): SpeciesMetadata | undefined;
}

interface SpeciesMetadata {
  id: string;
  name: string;
  playerId: string | null;    // null = AI species
  isAI: boolean;
  deployedAt: number;         // timestamp
  blueprint: SpeciesBlueprint;
  population: number;
  peakPopulation: number;
  totalGeneration: number;
  averageEnergy: number;
  averageLifespan: number;
  totalKills: number;
  totalDeaths: number;
  entropyMultiplier: number;
  biome: BiomeType;
  status: 'active' | 'retiring' | 'extinct';
}

interface SpeciesConfig {
  name: string;
  playerId: string | null;
  blueprint: SpeciesBlueprint;
  founderCount: number;       // 1-10
  biome: BiomeType | 'random';
}
```

#### Stats Update (called each tick or every N ticks)

```
for each species in activeSpecies:
    organisms = allOrganisms.filter(o => o.speciesId === species.id)
    species.population = organisms.length
    species.peakPopulation = max(species.peakPopulation, species.population)
    species.averageEnergy = mean(organisms.map(o => o.energy))
    species.entropyMultiplier = computeEntropyMultiplier(species)

    if species.population === 0 && species.status === 'active':
        species.status = 'extinct'
        emit ExtinctionEvent
        if species.playerId: scheduleAIPlaceholder(species)
```

#### Dominance Scoring (every 5 minutes)

Compute the weighted dominance score for each active species using 5 metrics:

```typescript
function computeDominanceScore(species: SpeciesMetadata, world: WorldState): number {
  const totalEnergy = world.energySystem.getTotalOrganismEnergy();
  const totalOrganisms = world.organisms.length;
  const totalCells = 625;

  const biomassShare = species.totalEnergy / Math.max(1, totalEnergy);
  const populationShare = species.population / Math.max(1, totalOrganisms);
  const territoryShare = species.uniqueCellsOccupied / totalCells;
  const lineageScore = Math.min(1.0, species.totalGeneration / 100);
  const keystoneBonus = computeKeystoneBonus(species, world);

  return biomassShare * 0.35
       + populationShare * 0.20
       + territoryShare * 0.20
       + lineageScore * 0.15
       + keystoneBonus * 0.10;
}
```

Territory metric: count unique spatial hash cells currently occupied by at least 1 organism of the species.

#### Keystone Species Bonus

Tracks organism distribution across 3 axes: diet type (herbivore/omnivore/carnivore), size class (tiny/small/medium/large), and primary biome. Under-represented categories receive a scoring bonus:

```typescript
function computeKeystoneBonus(species: SpeciesMetadata, world: WorldState): number {
  const dietCategory = getDietCategory(species.blueprint.diet); // herb/omni/carn
  const sizeCategory = getSizeCategory(species.blueprint.sizeRatio); // tiny/small/med/large
  const biomeCategory = species.biome;

  // Check each axis — if this species fills an under-represented niche, bonus applies
  const dietShare = countOrganismsInDietCategory(dietCategory) / totalOrganisms;
  const sizeShare = countOrganismsInSizeCategory(sizeCategory) / totalOrganisms;
  const biomeShare = countOrganismsInBiome(biomeCategory) / totalOrganisms;

  // Bonus for each under-represented axis (< 10% of population)
  const bonusPerAxis = (share: number) =>
    share < 0.10 ? 0.25 * Math.max(0, 1.0 - share / 0.10) : 0;

  return Math.min(1.0, bonusPerAxis(dietShare) + bonusPerAxis(sizeShare) + bonusPerAxis(biomeShare));
}
```

Caps at +25% per axis for completely unique niches. Incentivizes diversity: being the only carnivore in a world of herbivores is rewarded.

#### Achievement Tracking

Track and award 17 achievements per player. Each achievement has a condition and EP reward.

```typescript
interface AchievementTracker {
  checkAchievements(playerId: string, species: SpeciesMetadata, world: WorldState): Achievement[];
}

const ACHIEVEMENTS: AchievementDefinition[] = [
  { id: 'first_steps',      condition: 'Deploy first organism',               reward: 10 },
  { id: 'survivor',         condition: 'Any organism survives 24 hours',       reward: 10 },
  { id: 'first_blood',      condition: 'Kill another player organism',         reward: 15 },
  { id: 'generational',     condition: 'Reach generation 10',                  reward: 20 },
  { id: 'the_long_game',    condition: 'Reach generation 50',                  reward: 50 },
  { id: 'pack_leader',      condition: '30+ organisms alive simultaneously',   reward: 20 },
  { id: 'diverse',          condition: 'Organisms in 3+ biomes simultaneously',reward: 25 },
  { id: 'winter_coming',    condition: 'Survive a full Winter season',         reward: 30 },
  { id: 'apex_predator',    condition: '#1 on leaderboard for 1 hour',         reward: 50 },
  { id: 'ecosystem_eng',    condition: '#1 with >15 synapses in brain',        reward: 50 },
  { id: 'comeback',         condition: '<5 organisms to >25 without redesign', reward: 30 },
  { id: 'silent_hunter',    condition: 'Kill 10 with camouflage active',       reward: 25 },
  { id: 'spore_cloud',      condition: 'Offspring in 4+ biomes via spores',    reward: 25 },
  { id: 'alarm_system',     condition: '10+ organisms using pheromones',       reward: 20 },
  { id: 'it_takes_two',     condition: 'Gen 30 with 15+ simultaneous orgs',   reward: 30 },
  { id: 'social_network',   condition: '20+ organisms using pheromones',       reward: 25 },
  { id: 'nest_builder',     condition: '5+ eggs with nest bonus >30%',         reward: 20 },
];
```

Check conditions during the hourly summary write. Award EP on first trigger. Persist awarded achievements in `player_achievements` table (playerId, achievementId, awardedAt).

#### Daily Mutation Generation (Server-Side)

The server generates 3 mutation options per player per day from the real in-simulation mutation pool.

```typescript
interface DailyMutationGenerator {
  generateOptions(speciesId: string, mutationPool: MutationRecord[]): MutationOption[];
  applySelection(speciesId: string, option: MutationOption): void;
}

function generateDailyMutationOptions(
  speciesId: string,
  mutationPool: MutationRecord[],
  medianLifespan: number
): MutationOption[] {
  // Step 1: Filter for "successful" mutations from last 24h
  const successful = mutationPool.filter(m =>
    m.offspringLifespan > medianLifespan * 0.8 || m.offspringReproduced
  );

  // Step 2: Score by fitness impact
  const scored = successful.map(m => ({
    ...m,
    fitnessScore: (m.offspringLifespan / medianLifespan)
                + (m.offspringReproduced ? 2.0 : 0)
                + (m.offspringDescendants * 0.5),
  }));

  // Step 3: Select 3 diverse options (one from each category)
  const bestBody = scored.filter(isBodyGene).sort(byFitness)[0];
  const bestBrain = scored.filter(isBrainGene).sort(byFitness)[0];
  const mostCommon = findMostCommonSuccessfulDirection(scored);

  return [bestBody, bestBrain, mostCommon].filter(Boolean).slice(0, 3);
}
```

**Applying selection**: When a player picks a mutation, update the species template. ALL future offspring use the new value as their base (before their own random mutations). Existing organisms are unaffected.

**For sexual species**: The template change affects the "center of gravity" of the gene pool; it takes slightly longer to propagate than for asexual species.

### Unit Tests

- **Register species**: Creates metadata with correct initial values, population=founderCount.
- **Retire species**: Status changes to 'retiring', organisms receive 10x ageing.
- **Population tracking**: Adding/removing organisms updates count correctly.
- **Extinction detection**: Population reaching 0 triggers extinction event.
- **Entropy calculation**: Correct multiplier based on deployment timestamp.
- **Player slot**: Each player has exactly one active species; deploying new retires old.
- **Dominance scoring**: Biomass 35%, population 20%, territory 20%, lineage 15%, keystone 10% weights applied correctly.
- **Keystone bonus**: Species in under-represented diet/size/biome categories receive bonus up to 25%.
- **Keystone bonus zero**: Species in well-represented categories receive 0 bonus.
- **Achievement trigger**: `first_steps` fires on first deployment, `generational` fires at generation 10 (not 9, not 11).
- **Achievement idempotency**: Same achievement cannot be awarded twice to same player.
- **Daily mutation generation**: Given a pool with body+brain mutations, returns 3 diverse options.
- **Daily mutation application**: Applying a mutation updates species template; future offspring use new base value.
- **Daily mutation skip**: Picking 0 mutations leaves template unchanged.

### Integration Tests

- Deploy 5 species, verify all tracked. Retire one, verify status changes.
- Run simulation until a species goes extinct, verify AI placeholder is scheduled.
- Run 1000 ticks with 3 species: verify dominance scores are computed and sorted.
- Deploy sole carnivore in world of herbivores: verify keystone bonus > 0.

### QA Checklist

- [ ] Species population counts are accurate each tick
- [ ] Peak population is tracked and never decreases
- [ ] Extinction is detected immediately when population reaches 0
- [ ] Player can only have one active species at a time
- [ ] Species metadata is accessible by other systems (entropy, EventDetector)
- [ ] Dominance scores computed every 5 minutes with correct 5-metric weights
- [ ] Keystone bonus rewards under-represented niches (diet, size, biome)
- [ ] All 17 achievements have trigger conditions and award correct EP
- [ ] Daily mutation options draw from real mutation pool with fitness scoring
- [ ] Applying daily mutation updates species template for future offspring

---

## Step 5.2 — AI Ecosystem Manager

### What You're Implementing

The `AIEcosystemManager` module: maintains a curated library of 15+ AI species designs, manages the 30-species target by injecting/retiring AI species, implements 48h cycling for AI species, handles population balancing, and fills slots when players disconnect or go extinct.

### Design References

- `components/back-end.md` Section 8 (AI Ecosystem Manager) — Full AI manager architecture: curated species library (15+ designs across 4 roles: herbivore, carnivore, scavenger, omnivore), injection logic, retirement logic, 48h cycling, population balancing, placeholder species for extinct players.
- `core-gameplay-systems.md` Section 12 (AI Management) — AI species diversity requirements, role distribution targets, naming conventions.
- `core-gameplay-systems.md` Section 3.1 — Extinction recovery: AI placeholder deploys immediately, replaced when player redeploys.

### Implementation Details

```typescript
interface AIEcosystemManager {
  tick(speciesManager: SpeciesManager): void;
  getLibrary(): AISpeciesTemplate[];
  injectSpecies(template: AISpeciesTemplate, biome?: BiomeType): SpeciesMetadata;
  retireOldest(): void;
  deployPlaceholder(playerId: string, biome: BiomeType): SpeciesMetadata;
}

interface AISpeciesTemplate {
  id: string;
  name: string;
  role: 'herbivore' | 'carnivore' | 'scavenger' | 'omnivore';
  blueprint: SpeciesBlueprint;
  preferredBiome: BiomeType;
  difficulty: 'easy' | 'medium' | 'hard';
}
```

#### Injection Logic (checked every 60 seconds)

```
activeCount = speciesManager.getAllActive().length
if activeCount < TARGET_SPECIES_COUNT (30):
    deficit = TARGET_SPECIES_COUNT - activeCount
    // Select templates that fill missing roles
    missingRoles = computeRoleDeficit(speciesManager)
    for i in 0..deficit:
        template = selectBestTemplate(missingRoles, currentBiomeDistribution)
        injectSpecies(template)
```

#### 48h Cycling

AI species deployed more than 48h ago are retired and replaced with a different template, ensuring ecosystem variety. Human player species are never auto-cycled.

#### AI Competence Capping

AI species are designed to be **functional but not dominant**. Enforce the following constraints on all AI templates:
- Brain complexity capped at 8-12 synapses (simpler than skilled players)
- Body stats use ~75 effective BP (below the 100 BP available to human players)
- No daily mutation selections applied (AI species evolve only through natural random mutation)
- Validate all library templates against these caps at load time

#### Population Balancing

If any AI species exceeds 150% of average population, reduce its founder count on next cycle. If any AI species is below 50% of average, it may be replaced with a stronger template.

### Unit Tests

- **Library**: At least 15 templates covering all 4 roles.
- **Competence cap**: All AI templates have 8-12 synapses and ≤75 effective BP.
- **Injection**: When below 30 species, AI species are injected to fill gaps.
- **Role distribution**: AI selection prefers under-represented roles.
- **48h cycling**: AI species older than 48h are retired and replaced.
- **Placeholder**: Extinct player slot gets AI placeholder; placeholder removed when player redeploys.

### Integration Tests

- Start with 10 human species: verify 20 AI species are injected to reach 30.
- Run for 48h simulated time: verify AI species cycle (old retired, new injected).

### QA Checklist

- [ ] World always has ~30 active species (±2)
- [ ] AI species cover herbivore, carnivore, scavenger, omnivore roles
- [ ] AI species are competence-capped (8-12 synapses, ~75 effective BP, no daily mutations)
- [ ] AI species cycle every 48h to maintain variety
- [ ] Player extinction → immediate AI placeholder in same biome
- [ ] Player redeployment → AI placeholder auto-retires
- [ ] AI species library contains all 15 named species with correct stats

#### AI Species Library (Named Designs)

- `components/game-components.md` Section 15 (AIDesigner) — Complete 15-entry species library with stats.

The curated library includes these 15 specific designs (loaded at server startup):

| # | Name | Niche | Diet | Size | Speed | Synapses | ~BP |
|---|------|-------|------|------|-------|----------|-----|
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

Each template includes a full brain wiring (pre-compiled `CompiledBrain`) and biome preference. The niche selection algorithm uses this table to fill under-represented ecological roles.

---

## Step 5.3 — Event Detector

### What You're Implementing

The `EventDetector` module: monitors the simulation for notable events (extinction, population milestones, first reproduction, predation events, record-breaking stats), stores events for client display, and triggers notifications.

### Design References

- `components/game-components.md` Section 11 (EventDetector) — Full `EventDetector` interface, event types, detection logic, notification triggers.
- `core-gameplay-systems.md` Section 7 (Spectating & Analytics) — Events feed for world view, notable event categories.
- `architecture.md` Section 4.1 — `events` table schema for persistence.

### Implementation Details

```typescript
interface EventDetector {
  tick(world: WorldState, speciesManager: SpeciesManager): WorldEvent[];
  getRecentEvents(count: number): WorldEvent[];
}

interface WorldEvent {
  id: number;
  type: WorldEventType;
  timestamp: number;
  tick: number;
  data: Record<string, unknown>;
  speciesId?: string;
  playerId?: string;
}

enum WorldEventType {
  SpeciesExtinction,
  PopulationMilestone,      // 10, 25, 50, 100 organisms
  FirstReproduction,
  FirstKill,
  PredationStreak,          // 5+ kills in 60 seconds
  PopulationRecord,         // new peak for any species
  EcosystemBalance,         // all 5 biomes have species
  MassExtinction,           // 3+ species extinct in 5 minutes
  SpeciesDeployed,
  SpeciesRetired,
}
```

#### Detection Logic (per tick)

- **Extinction**: SpeciesManager reports population=0.
- **Population milestones**: Compare current count against thresholds [10, 25, 50, 100].
- **First reproduction**: Track `hasReproduced` flag per species.
- **Predation streak**: Track kill counts per species in sliding window.
- **Mass extinction**: Count extinction events in 5-minute window.

Events are stored in a ring buffer (last 1000 events) for client queries and periodically persisted to database.

### Unit Tests

- Species going extinct emits `SpeciesExtinction` event.
- Population crossing 10 emits `PopulationMilestone` event (only once).
- 5 kills within 60 seconds emits `PredationStreak`.
- 3 extinctions within 5 minutes emits `MassExtinction`.
- Recent events query returns events in reverse chronological order.

### Integration Tests

- Run full simulation: verify events are detected and stored.
- Verify events persist to database via persistence system.

### QA Checklist

- [ ] All event types are detected correctly
- [ ] Events contain sufficient data for client display
- [ ] Ring buffer doesn't grow unboundedly
- [ ] Milestone events fire only once per threshold per species
- [ ] Events are available for WebSocket broadcast to connected clients

---

## Step 5.3b — Progression System

### What You're Implementing

The `ProgressionSystem` module: server-side EP (Evolution Points) milestone checking, achievement detection, and design unlock validation. Runs on a slower schedule (every 15 seconds) triggered by EventDetector events. Client mirrors state for UI display (Phase 7.6 handles persistence, Phase 12.3 handles display).

### Design References

- `components/game-components.md` Section 14 (ProgressionSystem) — `ProgressionSystem` interface: `checkMilestones()`, `checkAchievements()`, `validateDesignUnlocks()`.
- `core-gameplay-systems.md` Section 8 (Progression) — EP formula, tier thresholds, achievement definitions.

### Implementation Details

```typescript
interface ProgressionSystem {
  checkMilestones(species: SpeciesState, world: World): EPEvent[];
  checkAchievements(player: PlayerProfile, species: SpeciesState, world: World): Achievement[];
  validateDesignUnlocks(design: OrganismDesign, playerTier: number): ValidationResult;
}

interface EPEvent {
  playerId: string;
  speciesId: string;
  milestoneType: string;
  epReward: number;
}
```

#### EP Milestones (checked every 15 seconds)

| Milestone | EP Reward |
|-----------|-----------|
| Population 10 | 5 EP |
| Population 25 | 15 EP |
| Population 50 | 30 EP |
| Gen depth 5 | 10 EP |
| Gen depth 10 | 25 EP |
| Gen depth 20 | 50 EP |
| Gen depth 50 | 100 EP |
| Per organism-hour | 1 EP |
| Achievement bonus | 10-50 EP |

Milestones are one-shot per species deployment (tracked via `firedMilestones` set). On EP change, check tier threshold crossing (0→50→200→500 EP).

```typescript
function checkMilestones(species: SpeciesState, world: World): EPEvent[] {
  const events: EPEvent[] = [];
  const fired = species.firedMilestones;

  const popMilestones = [
    { threshold: 10, ep: 5 }, { threshold: 25, ep: 15 },
    { threshold: 50, ep: 30 },
  ];
  for (const m of popMilestones) {
    if (species.populationCount >= m.threshold && !fired.has(`pop_${m.threshold}`)) {
      fired.add(`pop_${m.threshold}`);
      events.push({ playerId: species.playerId, speciesId: species.id,
        milestoneType: `population_${m.threshold}`, epReward: m.ep });
    }
  }

  const genMilestones = [
    { threshold: 5, ep: 10 }, { threshold: 10, ep: 25 },
    { threshold: 20, ep: 50 }, { threshold: 50, ep: 100 },
  ];
  for (const m of genMilestones) {
    if (species.maxGeneration >= m.threshold && !fired.has(`gen_${m.threshold}`)) {
      fired.add(`gen_${m.threshold}`);
      events.push({ playerId: species.playerId, speciesId: species.id,
        milestoneType: `generation_${m.threshold}`, epReward: m.ep });
    }
  }

  return events;
}
```

#### Design Unlock Validation

```typescript
function validateDesignUnlocks(design: OrganismDesign, playerTier: number): ValidationResult {
  const errors: string[] = [];

  // Check input nodes against tier
  for (const node of design.brain.nodes.filter(n => n.type === 'input')) {
    const requiredTier = getInputNodeTier(node.inputType);
    if (requiredTier > playerTier) {
      errors.push(`Input node "${node.inputType}" requires Tier ${requiredTier}`);
    }
  }

  // Check output nodes against tier
  for (const node of design.brain.nodes.filter(n => n.type === 'output')) {
    const requiredTier = getOutputNodeTier(node.outputType);
    if (requiredTier > playerTier) {
      errors.push(`Output node "${node.outputType}" requires Tier ${requiredTier}`);
    }
  }

  // Check traits against tier
  for (const trait of design.traits) {
    const requiredTier = getTraitTier(trait);
    if (requiredTier > playerTier) {
      errors.push(`Trait "${trait}" requires Tier ${requiredTier}`);
    }
  }

  return { valid: errors.length === 0, errors };
}
```

### Unit Tests

- Population milestone at 10 yields 5 EP (fires once).
- Generation milestone at 50 yields 100 EP.
- Milestones don't re-fire for same species.
- `validateDesignUnlocks` rejects Tier 3 inputs for Tier 1 player.
- Tier upgrade: crossing 50 EP unlocks Tier 2 inputs/outputs.

### QA Checklist

- [ ] EP milestones fire at correct population/generation thresholds
- [ ] EP rewards accumulate correctly in player profile
- [ ] Tier transitions unlock new brain nodes and traits
- [ ] Design validation rejects locked features
- [ ] Milestones are one-shot per species deployment

---

## Step 5.4 — World Orchestrator & Simulation Loop

### What You're Implementing

The master simulation loop: `World.tick()` method that executes all 12 systems in strict dependency order at 40 TPS, the `startGameLoop` function with fixed-timestep accumulator, spiral-of-death guard (max 3 ticks per frame), decoupled 20 Hz broadcast timer, and persistence scheduling.

### Design References

- `components/back-end.md` Section 1.3 — Constant-speed game loop: `TICK_INTERVAL_MS = 1000/SIM_TPS`, accumulator pattern, spiral-of-death guard, `process.hrtime.bigint()` for timing, decoupled broadcast at 20 Hz.
- `components/back-end.md` Section 2.1-2.3 — System execution order (12 systems), data dependencies table, main `World.tick()` function with all system calls.
- `components/game-components.md` §Tick Processing Order — Expanded 17-step execution order with finer granularity (separates biology, death, fungi, event system into distinct steps). Use this for profiling step names.
- `architecture.md` Section 10 — Performance budget: 3ms target per tick, 25ms max.
- `components/back-end.md` Section 1.4 — `WorldManager` class: room lifecycle (create, pause, resume, stop, restart, reset, setTPS).

### Implementation Details

#### World.tick() — All 12 Systems in Order

```typescript
class World {
  currentTick: number = 0;
  readonly dt: number = 1 / 20;  // fixed timestep

  tick(): void {
    // 1. Sense: populate brain inputs from spatial hash
    this.senseSystem.update(this.organisms, this.spatialHash, this.pheromoneGrid, this.dt);
    // 2. Brain: forward-pass all neural networks
    this.brainSystem.update(this.organisms, this.dt);
    // 3. Action: translate brain outputs to intents
    this.actionSystem.update(this.organisms, this.dt);
    // 4. Physics: forces, collisions, toroidal wrapping
    this.physicsSystem.update(this.organisms, this.pellets, this.dt);
    // 5. Digestion: process stomachs, extract energy
    this.digestiveSystem.update(this.organisms, this.dt);
    // 6. Combat: resolve attacks, damage, meat generation
    this.combatSystem.update(this.organisms, this.spatialHash, this.dt);
    // 7. Energy: deduct metabolism, movement, brain costs
    this.energySystem.update(this.organisms, this.dt);
    // 8. Reproduction: egg production, mating, hatching
    this.reproductionSystem.update(this.organisms, this.eggs, this.dt);
    // 9. Genetics: mutations for newborns
    this.geneticsSystem.update(this.newborns, this.dt);
    // 10. Environment: plants, meat decay, pheromones, season
    this.environmentSystem.update(this, this.dt);
    // 11. Death: check conditions, convert to meat
    this.deathSystem.update(this.organisms, this.dt);
    // 12. Persistence: update spatial hash, log events, queue writes
    this.persistenceSystem.update(this, this.dt);

    this.currentTick++;
  }
}
```

#### Game Loop with Fixed Timestep

```typescript
function startGameLoop(world: World, config: ServerConfig): void {
  const SIM_TPS = config.simTps;  // default 40
  const TICK_INTERVAL_MS = 1000 / SIM_TPS;
  let lastTickTime = process.hrtime.bigint();
  let accumulator = 0;

  function loop(): void {
    const now = process.hrtime.bigint();
    accumulator += Number(now - lastTickTime);
    lastTickTime = now;

    const tickIntervalNs = TICK_INTERVAL_MS * 1_000_000;
    let ticksThisFrame = 0;

    // Max 3 ticks per frame (spiral-of-death guard)
    while (accumulator >= tickIntervalNs && ticksThisFrame < 3) {
      world.tick();
      ticksThisFrame++;
      accumulator -= tickIntervalNs;
    }

    // Clamp accumulator after long pause
    if (accumulator > tickIntervalNs * 5) {
      accumulator = tickIntervalNs;
    }

    // Persistence checks (every N ticks)
    checkPersistenceSchedule(world);

    setTimeout(loop, Math.max(1, TICK_INTERVAL_MS - world.timing.tickDurationMs));
  }

  setImmediate(loop);

  // Decoupled broadcast at 20 Hz
  setInterval(() => {
    if (wsServer.connectedClientCount > 0) {
      wsServer.broadcastDelta(world);
    }
  }, 50);
}
```

#### WorldManager

```typescript
class WorldManager {
  private rooms: Map<string, WorldRoom>;

  async init(supabase): Promise<void>;    // load running worlds from DB
  createRoom(config: WorldConfig): WorldRoom;
  pauseRoom(worldId: string): void;       // stop timers, keep state
  resumeRoom(worldId: string): void;      // restart timers
  stopRoom(worldId: string): void;        // snapshot + cleanup
  setTPS(worldId: string, tps: number): void;
  listRooms(): WorldSummary[];
}
```

#### Persistence Scheduling (derived from SIM_TPS)

```
LEADERBOARD_INTERVAL = 60 * SIM_TPS      // every 60 seconds
SNAPSHOT_INTERVAL = 5 * 60 * SIM_TPS      // every 5 minutes
SUMMARY_INTERVAL = 3600 * SIM_TPS         // every 1 hour
MUTATION_POLL_INTERVAL = 60 * SIM_TPS     // every 60 seconds
ENERGY_AUDIT_INTERVAL = 15 * SIM_TPS     // every 15 seconds
```

#### Per-Module Tick Budget (900 organisms)

- `components/game-components.md` §Tick Processing Order — Detailed per-module timing breakdown.

Reference budget for profiling. Total ~4.8ms leaves ~81% headroom within the 25ms tick budget at 40 TPS:

| Module | Budget |
|--------|--------|
| Sense (SpatialHash queries) | 0.50 ms |
| Think (BrainEngine.tickAll) | 1.80 ms |
| Physics | 0.50 ms |
| Combat | 0.10 ms |
| Digestion | 0.45 ms |
| Biology (metabolism, growth, ageing) | 0.30 ms |
| Reproduction | 0.30 ms |
| Environment (season, pheromones) | 0.20 ms |
| Energy (plants, meat decay) | 0.15 ms |
| Death | 0.05 ms |
| Species (entropy) | 0.01 ms |
| Events | 0.15 ms |
| Fungi | 0.20 ms |
| Ecological Events | 0.10 ms |
| **Total** | **~4.8 ms** |

If any module consistently exceeds its budget, profile with `DebugCollector.profileAndRun()` (Phase 14) and optimize.

#### Energy Conservation Tiered Response

- `architecture.md` Section 8.4 (Data Corruption / Energy Conservation Violation) — full tiered response spec.

Every `ENERGY_AUDIT_INTERVAL` ticks, the orchestrator runs an energy audit with tiered automated response:

```typescript
function runEnergyAudit(world: World): void {
  const computed = world.freeBiomass
    + sumAll(world.pellets, p => p.energy)
    + sumAll(world.organisms, o => o.energy + o.bodyEnergy + o.fatStored + o.eggEnergy);
  const expected = world.totalEnergy;
  const delta = Math.abs(computed - expected);
  const pct = delta / expected;

  if (pct > 0.05) {
    // CRITICAL: >5% drift — trigger immediate snapshot, alert admin, consider pausing
    logger.critical(`Energy drift ${(pct * 100).toFixed(2)}%`, { computed, expected });
    triggerImmediateSnapshot(world);
    alertAdmin('Energy conservation CRITICAL violation');
  } else if (pct > 0.01) {
    // ERROR: >1% drift — correct by adjusting freeBiomass
    logger.error(`Energy drift ${(pct * 100).toFixed(2)}%`, { computed, expected });
    world.freeBiomass += (expected - computed); // correction
  } else if (pct > 0.001) {
    // WARNING: >0.1% drift — log with full breakdown
    logger.warn(`Energy drift ${(pct * 100).toFixed(4)}%`, { computed, expected });
  }

  // Report in /health endpoint
  world.metrics.energyDelta = computed - expected;
}
```

#### Default World Creation on Empty Database

- `architecture.md` Section 8.1 step 6 — "If no worlds exist in the database, create a default world."

```typescript
// In WorldManager.init():
async init(supabase: SupabaseClient): Promise<void> {
  const { data: worlds } = await supabase.from('worlds').select('*').eq('status', 'running');
  if (!worlds || worlds.length === 0) {
    // No worlds exist (fresh DB or all deleted via admin) — create default
    await this.createDefaultWorld(supabase);
  }
  for (const world of worlds ?? []) {
    await this.restoreRoom(world);
  }
}
```

### Unit Tests

- **Tick order**: Verify all 12 systems are called in correct dependency order.
- **Fixed timestep**: World always advances by exactly `dt = 1/20` per tick.
- **Spiral-of-death**: After 100ms simulated pause, at most 3 ticks are processed.
- **Accumulator clamp**: After long pause (>5 tick intervals), accumulator is clamped.
- **TPS change**: `setTPS(60)` changes tick interval, all persistence intervals scale.
- **Energy audit tiers**: 0.05% drift logs WARNING, 1.2% drift corrects freeBiomass, 6% drift triggers snapshot + admin alert.
- **Default world**: WorldManager.init() with empty DB creates a default world.

### Integration Tests

- **Full simulation run**: Start world with 30 species (mix of AI and mock player), run for 1000 ticks, verify:
  - Energy conservation holds (total energy constant ±0.001)
  - Population changes (births, deaths, generation turnover)
  - No crashes, no infinite loops
  - Tick time stays under 25ms budget
- **Pause/resume**: Pause world, verify tick count stops. Resume, verify it continues.
- **Graceful shutdown**: Trigger SIGTERM, verify snapshot is written before exit.

### QA Checklist

- [ ] Simulation runs at target TPS (40 by default) without drift
- [ ] All 12 systems execute every tick in correct order
- [ ] Energy conservation invariant holds after 10,000 ticks
- [ ] Broadcast runs at 20 Hz independent of tick rate
- [ ] WorldManager can pause/resume/stop individual rooms
- [ ] Performance: tick time < 3ms average, < 25ms worst case
- [ ] Energy audit runs every 15 seconds with tiered response (warn/correct/critical)
- [ ] >1% energy drift auto-corrects freeBiomass and logs ERROR
- [ ] >5% energy drift triggers immediate snapshot and admin alert
- [ ] WorldManager creates default world when database has no running worlds
- [ ] Persistence writes happen at correct intervals

---

## Step 5.5 — Full Server Integration Test

### What You're Implementing

End-to-end integration test for the complete server simulation: wire all Phase 2-5 modules together, deploy multiple species (herbivore, carnivore, scavenger), run multi-hundred-tick simulation, and verify emergent ecosystem behavior.

### Design References

- All Phase 2-5 design references apply.
- `core-gameplay-systems.md` Section 13 — Verification & Build Order: recommended test sequence.
- `architecture.md` Section 10 — Performance budget targets.

### Implementation Details

Create a test harness that:

1. Initializes a World with all subsystems
2. Generates a biome map (seeded for reproducibility)
3. Deploys 3 species via SpeciesManager:
   - Simple Grazer (herbivore template brain)
   - Hunter (carnivore template brain)
   - Scavenger (scavenger template brain)
4. Each with 10 founders in Grassland biome
5. Runs 500 ticks
6. Asserts invariants at each tick:
   - Energy conservation (|drift| < 0.01)
   - No NaN/Infinity in any entity state
   - All positions within world bounds [0, 500)
   - Population > 0 for at least 2 species by tick 500

```typescript
describe('Full Simulation Integration', () => {
  it('runs 500 ticks with 3 species without errors', () => {
    const world = createTestWorld({ seed: 42 });
    deploySpecies(world, 'grazer', GRAZER_TEMPLATE, 10);
    deploySpecies(world, 'hunter', HUNTER_TEMPLATE, 10);
    deploySpecies(world, 'scavenger', SCAVENGER_TEMPLATE, 10);

    for (let i = 0; i < 500; i++) {
      world.tick();
      assertEnergyConservation(world, 0.01);
      assertNoInvalidState(world);
      assertAllPositionsInBounds(world);
    }

    // At least 2 species survived
    const alive = world.speciesManager.getAllActive()
      .filter(s => s.population > 0);
    expect(alive.length).toBeGreaterThanOrEqual(2);
  });

  it('maintains energy conservation across full lifecycle', () => {
    // ... verify births, deaths, eating all conserve energy
  });

  it('runs within performance budget', () => {
    // ... verify average tick < 3ms
  });
});
```

### Unit Tests

N/A — this step IS the integration test.

### Integration Tests

- **Energy conservation**: After 500 ticks, total energy unchanged (±0.01).
- **Predator-prey dynamics**: Herbivore population grows first, then carnivores grow, creating oscillation.
- **Generation turnover**: By tick 500, at least generation 5+ exists.
- **Performance**: Average tick time < 5ms (relaxed for test environment).
- **No invalid state**: No NaN, Infinity, or out-of-bounds positions at any tick.

### QA Checklist

- [ ] Test passes reliably with fixed seed
- [ ] Energy conservation holds through births, deaths, eating, combat
- [ ] Multiple species coexist (ecosystem doesn't collapse to monoculture)
- [ ] Organisms exhibit expected behaviors (herbivores eat plants, carnivores attack)
- [ ] No memory leaks over 500 ticks (entity count doesn't grow unboundedly)
