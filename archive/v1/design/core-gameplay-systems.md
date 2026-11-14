# Life Game - Core Gameplay Systems Design Document

## Context

A mobile game where players design organisms (body + brain) and deploy them into a shared persistent world. Organisms compete for ecosystem dominance against other players' creations. The game blends accessible design tools (visual node-graph brain programming, archetype + slider body building) with deep simulation systems that produce emergent behavior. Cute vector-based art auto-generates from organism stats.

**Tech stack**: JS/TS/React frontend (GitHub Pages), Supabase (Postgres + Auth), Node.js simulation server (Hetzner CX33 ~$7/mo).
**Target**: Fun project for friends, free, all gameplay unlockable through play.
**World size**: 30 players max per world, N worlds per server (default 1, admin-created).

---

## 1. Organism Design System

The player's primary interactive system. Three sub-systems: Body, Brain, and Appearance.

#### Designer Help System

Every element in the Body and Brain editors has a **tap-to-explain** help system accessible on mobile:

- **Body sliders**: Tapping the label of any slider (e.g., "Speed Ratio") opens an inline info card showing: what the stat does, how it affects the organism mechanically, the BP cost formula, and a one-line strategic tip. The card collapses on tap-away.
- **Unlockable traits**: Each locked/unlocked trait has a (i) info icon that shows: full description, BP cost, mechanical effects, balance counters, and unlock requirements.
- **Brain nodes**: Tapping any input, output, or hidden node in the node graph opens an info card showing: what it does, its value range, why it's useful, and 1-2 example wirings. Locked nodes show what they do and how to unlock them.
- **Synapses**: Tapping a synapse shows: its weight, direction, which nodes it connects, and what the connection means (e.g., "NearestPlantAngle → Rotate: steers toward nearest plant").
- **Global help [?]**: A help button in the header opens a general guide covering the core concepts (BP budget, brain processing order, activation functions, how inputs/outputs work). The help modal also contains a full **Reference Guide** with ~40 searchable guide pages organized into 9 categories.

The help system integrates with the broader **onboarding and player education system**. See [`design/onboarding.md`](onboarding.md) for the full teaching framework, including the 4-step Quick Start wizard, 17 contextual system introductions, the pull-based reference guide, and unlock-triggered education modals.

### 1.1 Body System (Archetype + Sliders + Bio-Point Budget)

#### Bio-Point Budget
Every organism has a **fixed pool of 100 bio-points (BP)**. Every physical trait and brain component costs bio-points. Unlocking new traits doesn't increase the budget - it expands the design space while keeping power constant. This forces meaningful tradeoffs: a heavily armored organism can't also be fast with keen senses.

**Brain costs from the BP pool:**
- Each hidden node: 2 BP
- Each synapse: 0.5 BP
- This means a brain with 6 hidden nodes and 20 synapses costs 22 BP, leaving 78 for body stats.

#### Base Archetypes (Templates, Not Restrictions)
Four starting templates that pre-allocate bio-points as a learning scaffold. Players can freely modify all values after selecting:

| Archetype | Description | BP Allocation Example |
|-----------|-------------|----------------------|
| **Herbivore** | Plant-focused grazer | Size 1.0 (10BP), Speed 1.2 (12BP), STR 0.5 (3BP), DEF 0.5 (3BP), View Angle 180° (8BP), View Radius 5.0 (10BP), Stomach 1.5 (8BP), Brain ~24BP |
| **Carnivore** | Predatory hunter | Size 1.2 (15BP), Speed 1.5 (15BP), STR 2.5 (15BP), DEF 0.3 (2BP), View Angle 90° (4BP), View Radius 7.0 (14BP), Stomach 0.8 (5BP), Brain ~30BP |
| **Omnivore** | Balanced generalist | Size 1.0 (10BP), Speed 1.0 (10BP), STR 1.0 (6BP), DEF 1.0 (6BP), View Angle 120° (5BP), View Radius 5.0 (10BP), Stomach 1.2 (7BP), Brain ~24BP |
| **Scavenger** | Opportunistic feeder | Size 0.7 (5BP), Speed 0.8 (8BP), STR 0.3 (2BP), DEF 1.5 (9BP), View Angle 270° (12BP), View Radius 8.0 (16BP), Stomach 1.0 (6BP), Brain ~20BP |

#### Core Physical Trait Sliders (Always Available)

Each slider is continuous. BP cost curves are designed so that extremes are expensive and moderate values are cheap, encouraging specialization in 2-3 areas rather than being mediocre at everything.

| Trait | Range | Effect | BP Cost Formula | Example Costs |
|-------|-------|--------|----------------|---------------|
| **Size Ratio** | 0.3 - 3.0 | Body size. HP = 100 * maturity * SizeRatio². Stomach capacity = half surface area. Larger = more visible, more inertia | `BP = 10 * SizeRatio²` | 0.5→2.5, 1.0→10, 2.0→40, 3.0→90 |
| **Speed Ratio** | 0.2 - 2.5 | Movement force multiplier. `muscleMoveForce = baseForce * sqrt(Size1D * SpeedRatio)` | `BP = 10 * SpeedRatio` | 0.5→5, 1.0→10, 1.5→15, 2.5→25 |
| **Strength** | 0.1 - 5.0 | Bite force, attack damage. `attackForce = STR * Size1D * desireToAttack`. Must exceed target DEF to deal damage. Also determines what size food pellets can be bitten | `BP = 6 * STR` | 0.5→3, 1.0→6, 2.5→15, 5.0→30 |
| **Defense** | 0.0 - 4.0 | Damage reduction. `damageReduction = 1 - 1/(1 + DEF/10)`. Adds weight: `-2% max speed per DEF point`. Never reaches 100% reduction (diminishing returns) | `BP = 6 * DEF` | 0.5→3, 1.0→6, 2.0→12, 4.0→24 |
| **Diet** | 0.0 - 1.0 | 0=herbivore, 0.5=omnivore, 1.0=carnivore. Determines digestion efficiency (see Section 9) | **Free** (tradeoff, not power) | 0 BP always |
| **View Angle** | 15° - 360° | Field of vision width. Narrow = focused forward sight (predator eyes). Wide = panoramic awareness (prey eyes) | `BP = angle/45` | 45°→1, 90°→2, 180°→4, 360°→8 |
| **View Radius** | 1.0 - 10.0 | How far the organism can see in units. Affects which food/organisms are detected | `BP = 2 * ViewRadius` | 3.0→6, 5.0→10, 7.0→14, 10.0→20 |
| **Metabolism** | 0.5 - 3.0 | Master speed scaler for ALL biological processes: movement, digestion, growth, ageing. Higher = everything faster but energy cost scales equally. `metabolismCost = baseMetabCost * Metabolism * Size2D` | **Free** (tradeoff, not power) | 0 BP always |
| **Stomach Multiplier** | 0.3 - 2.0 | Multiplier on stomach capacity. Base capacity = half body surface area. Larger stomach = can store more food, but fullness ratio drops (affecting digestion efficiency) | `BP = 6 * StomachMult` | 0.5→3, 1.0→6, 1.5→9, 2.0→12 |
| **Growth Speed** | 0.5 - 2.0 | Multiplier on maturation rate. Faster growth = shorter vulnerability window but higher energy cost during growth phase. `growthEnergyCost = baseGrowthCost × GrowthSpeed`. `growthRate = baseGrowthRate × GrowthSpeed × Want2Grow` | **Free** (tradeoff, not power) | 0 BP always |

**Why Diet and Metabolism are free:** These are pure tradeoffs, not power increases. A metabolism of 3.0 doesn't make you "stronger" - you move 3x faster but burn 3x energy and age 3x faster. Diet 0.0 vs 1.0 doesn't give more total food - it determines WHICH food you can extract energy from efficiently. Free sliders expand the design space without breaking the budget balance.

#### Unlockable Body Traits

Each unlockable trait occupies BP from the same 100-point pool. Every trait has specific mechanical counters that prevent it from being dominant.

##### Armor Plating (Tier 2, Unlock: Survive 50 total generations)

**Cost**: 6 / 12 / 18 BP for Light / Medium / Heavy

**Mechanics**: Adds a flat defense bonus ON TOP of the base Defense stat, but only in one direction (front OR back, chosen at design time).
- Light: +3 directional DEF
- Medium: +6 directional DEF
- Heavy: +10 directional DEF

**Balance Counters**:
- Speed penalty: -2% max speed per BP invested. Heavy armor (18 BP) = 36% slower organism
- Metabolism increase: +15% base metabolism upkeep for heavy armor (body is heavier to maintain)
- Directional only: flanking attacks bypass armor entirely
- Venom bypasses armor (poison damage is not physical)
- High BP cost: 18 BP for heavy armor means 18% of total budget gone

**Strategic Niche**: Territorial defender. Slow but durable. Countered by fast flankers, venom users, and starvation (slow organisms find food slower).

##### Venom Glands (Tier 2, Unlock: Kill 100 organisms total)

**Cost**: 8 BP

**Mechanics**: Successful attacks apply a poison damage-over-time (DoT) effect on the target.
```
venomDPS = baseVenomDamage * (attackerSize / victimSize)
venomDuration = 10 seconds (reduced by target's immune system)
venomEnergyCost = 8 energy per application
```

**Balance Counters**:
- Scales inversely with victim size: small venomous creature vs large target deals proportionally less venom damage. Prevents "tiny assassin" exploits.
- Each envenomation costs 8 energy to the attacker (venom production isn't free)
- Requires a successful attack first: if target's DEF > attacker's STR, the bite fails and no venom is applied
- Venom does NOT stack. Reapplying refreshes duration but doesn't increase DPS
- Immune System gene (Base Immune Activation) reduces venom duration by up to 50%
- 8 BP cost means significant sacrifice elsewhere

**Strategic Niche**: Force multiplier for mid-size predators. Hit-and-run tactics. Creates a triangle: venom beats armor, armor beats raw attack, raw attack beats venom (faster kill before poison matters).

##### Immune System (Design Parameter, no tier requirement)

**Cost**: 4 × immuneStrength BP

**Design Parameter** (1 slider):
| Slider | Range | Effect | BP Cost |
|--------|-------|--------|---------|
| Immune Strength | 0.0-1.0 | Resistance to damage-over-time effects | 4 × immuneStrength (0-4 BP) |

**Mechanics**: Reduces duration/intensity of all DoT effects:
- Venom: duration × (1 - immuneStrength × 0.5) — up to 50% reduction
- Toxic Fungi: damage × (1 - immuneStrength × 0.3) — up to 30% reduction
- Plague: infection chance × (1 - immuneStrength × 0.4) — up to 40% reduction

`BaseImmuneActivation` gene starts at the designed immuneStrength value and mutates over generations.
Populations under DoT pressure naturally evolve higher resistance.

##### Echolocation (Tier 2, Unlock: Reach Tier 3 brain nodes)

**Cost**: Variable (10-22 BP depending on configuration)

**Design Parameters** (3 sliders in body designer):
| Slider | Range | Effect | BP Cost |
|--------|-------|--------|---------|
| Echo Range | 0.3-0.8× ViewRadius | Detection radius for 360° echo sense | 6 + 4 × echoRange → (7.2-9.2 BP) |
| Echo Precision | Low / High | Low: angle+distance only. High: +size info | 0 / 4 BP |
| Echo Frequency | 25%-100% | Duty cycle — % of ticks echolocation is active | 4 × frequency → (1-4 BP) |

**Energy cost**: 0.3 × echoRange × echoFrequency × baseMetabolismCost per second

**Mechanics**: Grants 360-degree detection regardless of View Angle, but at reduced range.
```
echoRange = ViewRadius * echoRangeSlider  // 0.3-0.8× ViewRadius
echoDetection = direction + distance + (size if echoPrecision=High, no color, no food type)
echoCost = 0.3 * echoRange * echoFrequency * baseMetabolismCost per second (active sense)
```

**Balance Counters**:
- Only 30-80% of normal view radius depending on slider (shorter range than direct vision)
- Cannot distinguish food types: returns "nearest entity" (angle, distance, size) but NOT whether it's plant, meat, or organism. Must use normal vision for food identification.
- Energy cost scales with range and frequency settings (higher settings = more drain)
- Reveals your position to other echolocators at 2x normal range (echolocation pulses are detectable)
- Does NOT replace vision; supplements it. Normal View Angle/Radius still apply for detailed sensing.

**Strategic Niche**: Anti-ambush defense and rear-threat awareness for prey species. Nocturnal hunting supplement. NOT a strict upgrade to vision - it's a different, complementary sense.

##### Burrowing (Tier 3, Unlock: Reach generation 20 in single run)

**Cost**: 12 BP

**Mechanics**: Organism can enter a burrowed state, becoming undetectable to normal vision.
```
burrowingMetabolismCost = burrowEfficiency * baseMetabolismCost (gene: 1.5×-2.5× upkeep while burrowed)
surfaceTransition = burrowSpeed seconds (gene: 1.0-2.5s, vulnerable during transition)
burrowCooldown = 3.0 seconds after surfacing before can re-burrow
movementWhileBurrowed = 25% of normal speed
```

**Evolvable parameters** (genes, not design sliders):
- `BurrowSpeed` gene: Controls surfacing transition time. Range 1.0-2.5s. Faster surfacing = less vulnerability.
- `BurrowEfficiency` gene: Controls underground metabolism multiplier. Range 1.5×-2.5×. Lower = cheaper hiding.
Both start at mid-values and mutate over generations.

**All inputs return 0 while burrowed**: vision, pheromone, sound, encounter — completely blind underground.

**Balance Counters**:
- **Cannot eat while burrowed** (no access to surface food). This is the critical counter - burrowing is an energy drain with no income. Permanent hiding = starvation.
- **Cannot reproduce while burrowed**
- **All vision inputs return 0** while burrowed (completely blind underground)
- **2x metabolism cost** while burrowed (digging and maintaining a tunnel is work)
- **Movement speed reduced to 25%** (slow underground movement)
- **1.5-second surfacing animation** during which organism is vulnerable and visible
- **3-second cooldown** before can burrow again after surfacing
- Echolocation CAN detect burrowed organisms at 50% range (vibrations travel through ground)
- 12 BP cost is significant

**Strategic Niche**: Emergency escape tool and ambush predator setup. Burrow when predator approaches, surface when it passes. NOT a lifestyle - energy economics force surfacing. Creates tense cat-and-mouse dynamics.

##### Camouflage (Tier 3, Unlock: Evade 200 predator encounters)

**Cost**: 6 BP base + exponential slider cost

**Design Parameters** (1 slider):
| Slider | Range | Effect | BP Cost |
|--------|-------|--------|---------|
| Camo Strength | 0.3-0.8 | Max detection reduction when stationary | 6 + 6 × camoLevel² (e.g., 0.3→6.5, 0.5→7.5, 0.6→8.2, 0.8→9.8 BP total) |

**Mechanics**: Reduces the distance at which other organisms can detect this organism visually.
```
detectionReduction = camoStrength * (1 - currentSpeed/maxSpeed)²
effectiveDetectionRange = normalRange * (1 - detectionReduction)
```

**Balance Counters**:
- **Speed-dependent**: At full speed, minimal reduction. Must be nearly stationary for full reduction (30-80% depending on slider). This creates tension: move to find food (visible) vs stay still to hide (safe but starving).
- **Minimum detection range**: Any organism within 15% of normal detection range sees through camouflage entirely (can't become invisible at point-blank)
- **Attacking breaks camouflage** for 5 seconds (can't attack while hidden and immediately re-hide)
- **Cannot stack with burrowing** (one or the other, not both simultaneously)
- Costs 0.5x base metabolism while active (pigment maintenance)
- 6.5-9.8 BP total cost (exponential scaling makes high-end expensive)

**Strategic Niche**: Ambush predator enabler. Wait motionless near food sources, strike when prey approaches. Also: cautious forager that feeds while hard to detect. Countered by echolocation, pheromone sensing, and organisms that patrol/search actively.

##### Fat Reserves (Tier 3, Unlock: Survive 3 seasonal transitions)

**Cost**: 5 / 10 / 15 / 20 BP across 4 capacity tiers

**Mechanics**: Dedicated energy storage organ. Converts surplus energy into fat (slow deposit) and back to energy (fast withdrawal) when energy reserves deplete.
```
maxFatStorage = fatTier * 50 energy
depositRate = 20% of digestion rate (slow filling)
withdrawalRate = on-demand when energy hits 0
storageTax = 15% on deposit (energy lost converting to fat)
withdrawalTax = 10% on withdrawal (energy lost converting back)
netEfficiency = 76.5% (significant but worthwhile for survival)
```

**New brain node**: Unlocks `StoreFat` output (Tier 3). When StoreFat > 0.5 AND energy > 50%,
organism deposits energy into fat at 20% of digestion rate. When energy hits 0, fat
auto-withdraws regardless of StoreFat value (survival override).

**Designer preview**: Shows max fat storage, round-trip efficiency (76.5%), and max speed penalty at full fat.

**Balance Counters**:
- **Speed penalty when full**: -1% max speed per BP invested, scaling with fill level. Full fat reserves at 20 BP = 20% slower. Creates a weight-gain visible tradeoff.
- **Slow fill rate**: Can only deposit 20% of digestion output. Takes time to fill up - can't gorge instantly.
- **76.5% round-trip efficiency**: Losing ~24% of stored energy to conversion taxes means fat is for emergencies, not primary energy management.
- **Does NOT prevent ageing**: Metabolism penalties from age still apply. Fat just delays starvation.
- **Fat organisms drop more meat on death**: `meatDropped = baseBodyEnergy + fatStored * 0.765`. Fat organisms are high-value targets for predators.
- Death by predation recycles more energy into the ecosystem (balancing effect)

**Strategic Niche**: Seasonal survival specialist. Build up fat during spring/summer abundance, survive winter scarcity. Thrives in feast-famine cycles. Countered by predators (fat = slow + valuable target) and sustained abundance environments (where leaner, faster organisms outcompete).

##### Spore Dispersal (Tier 3, Unlock: Consume 500 fungi patches)

**Cost**: Variable (8-14 BP depending on range slider)

**Mechanics**: Alternative reproduction method. Instead of laying an egg at current location, launches a spore in a random direction to land at distance.
```
sporeRange = random in [maxRange×0.25, maxRange] (slider-controlled maximum)
sporeDirection = random 360°
germinationRate = 30% (only 30% of spores survive to hatch)
sporeCostMultiplier = 1.3x normal egg cost (spores need protective coating)
offspringStartSize = 60% of normal birth size (spores produce smaller young)
offspringMutationVariance = 2.0x normal (higher genetic drift)
```

**Design Parameters** (1 slider):
| Slider | Range | Effect | BP Cost |
|--------|-------|--------|---------|
| Spore Range | 3-30 units | Max dispersal distance. Actual = random in [range×0.25, range] | 8 base + 2 × maxRange/10 (e.g., 10u→10BP, 20u→12BP, 30u→14BP) |

**Balance Counters**:
- **Only 30% germination rate** vs ~90% for normal eggs. Effective cost per surviving offspring is ~3.3x a normal egg.
- **Random direction and distance**: No targeting. Spores may land in hostile biomes or on top of predators.
- **Smaller offspring**: 60% birth size means more vulnerable to predation and starvation.
- **Higher mutation variance**: 2x normal means more lethal mutations alongside beneficial ones. Genetic instability.
- **1.3x energy cost per spore**: More expensive than eggs even before the 70% failure rate.
- Normal egg reproduction still available (spores supplement, not replace)

**Strategic Niche**: Geographic colonization tool. Spread to new biomes, escape local extinction events. NOT a replacement for egg reproduction (too expensive and unreliable). Best used by established populations with energy surplus.

##### Herd Coordination (Tier 3, Unlock: 50+ simultaneous organisms)

**Cost**: 7 BP per organism (each member pays individually)

**Mechanics**: Enhances the Herding output node with coordinated defense and foraging bonuses.
```
herdDefenseBonus = min(0.20, herdSize * 0.05)  // caps at +20% for 4+ members
herdForagingRadius = baseViewRadius * (1 + herdSize * 0.1)  // shared food detection
herdSeparation, herdAlignment, herdCohesion: controlled by genes
```

**Balance Counters**:
- **Food competition**: Herd members compete for the same local food. 5 organisms need 5x food in one area. Large herds deplete local resources fast, forcing constant migration.
- **Defense bonus caps at +20%**: 4 additional members max benefit. No advantage to herds larger than 5.
- **Disease vulnerability**: Virus transmission rate multiplied by `herdSize * 1.5`. Herds are epidemic hotspots. A plague event devastates herds far more than solo organisms.
- **Each member pays 7 BP**: Not shared. Every organism in the herd sacrifices 7 BP that could go to personal stats.
- **Visibility**: Large groups are easier for predators to spot from distance.
- **Pack hunting counter**: Multiple predators get +10% damage per additional attacker when targeting a herd member. Coordinated predators counter coordinated prey.

**Strategic Niche**: Defensive herbivore strategy. Safety in numbers. Naturally limited to 4-6 members by food competition. Creates interesting predator-prey arms race: herds vs pack hunters.

##### Nest Affinity (Design Parameter, no tier requirement)

**Cost**: 5 × nestAffinity BP

**Design Parameter** (1 slider):
| Slider | Range | Effect | BP Cost |
|--------|-------|--------|---------|
| Nest Affinity | 0.0-1.0 | Bonus strength for eggs near pheromone-emitting allies | 5 × nestAffinity (0-5 BP) |

**Mechanics**: When eggs are laid near same-species organisms emitting pheromone (within 2× egg radius),
hatching speed and offspring starting energy receive a bonus:
- Hatch speed bonus: min(nestAffinity × 0.5, nearbyAllyEmitters × 0.1) — up to 50% faster hatching
- Starting energy bonus: min(nestAffinity × 0.15, nearbyAllyEmitters × 0.03) — up to 15% more starting energy

Species with nestAffinity = 0 get no nest bonuses (default). This is not a tiered unlock — any species
can invest BP into nest affinity from Tier 1.

##### Sexual Reproduction (Tier 3, Unlock: Reach generation 30 with 15+ simultaneous organisms)

**Cost**: 10 BP

**Mechanics**: Replaces default asexual reproduction with sexual reproduction for the entire species. Decision is made at design time and is **irreversible per deployment**. Two same-species organisms of opposite sex must physically meet with both having `Want2Mate > 0.5` and all biological preconditions met. Offspring genome = crossover of both parents + standard mutation pass.

```
sexDetermination = binary Sex gene (0.0=female, 1.0=male), randomly assigned at birth 50/50
eggCostFemale = 70% of total egg energy cost (female carries the egg)
eggCostMale = 30% of total egg energy cost (male contributes at fertilization)
matingCooldown = 60 simulation-seconds after successful fertilization (both organisms)
```

**Fertilization conditions** (ALL must be true in the same tick for both organisms):
1. Same species, both have Sexual Reproduction trait
2. Opposite sex, both `Want2Mate > 0.5`
3. Both `maturity >= 1.0`, both `health >= 50%`
4. Female `EggStored == 1.0`, male has >= 30% egg-cost energy available
5. Within touch range (`distance < sum of radii`)

**Crossover genetics**: See Section 3.5 for the full gene and brain crossover algorithms.

**New brain nodes**: Unlocks 4 input nodes (`NearestMateAngle`, `NearestMateDist`, `Sex`, `MatingCooldown`) and 1 output node (`Want2Mate`) — all Tier 3, no additional BP cost beyond the 10 BP trait fee (synapse wiring to these nodes costs 0.5 BP each as normal).

**Balance Counters**:
- **10 BP entry fee**: Significant sacrifice from the 100 BP pool
- **Mate-finding overhead**: Must locate and physically reach an opposite-sex partner. Sparse populations struggle to find mates.
- **Population extinction spiral**: Below ~5-8 organisms, mate-finding becomes unreliable → fewer births → fewer organisms → extinction. Asexual species don't have this minimum viable population problem.
- **Male energy cost**: Males pay 30% of egg energy at fertilization — they can't just wander freely, they need energy reserves.
- **Mating cooldown**: 60-second cooldown prevents rapid sequential mating.
- **Brain wiring complexity**: Effective sexual reproduction requires wiring `NearestMateAngle/Dist → Rotate/Accelerate` for mate-seeking AND `Sex/EggStored/MatingCooldown → Want2Mate` for mating decisions. This consumes hidden nodes and synapses (BP).
- **Asymmetric investment**: Females invest heavily in eggs and are vulnerable during production. Males must compete for access.

**Strategic Niche**: Faster genetic diversity through crossover — beneficial mutations from two lineages combine in offspring. Creates emergent behaviors: lekking (males display at fixed locations), mate guarding, seasonal breeding, size-assortative mating. Best when population is large enough (15+) to ensure mate availability. Countered by population crashes, sparse environments, and the simplicity advantage of asexual reproduction.

##### Encounter Info Sharing (Tier 4, Unlock: 20+ organisms using pheromones simultaneously)

**Cost**: 8 BP (flat — unlocks all 7 encounter input nodes)

**Mechanics**: When a same-species ally is within close proximity (`1.5 × sum of both organisms' radii`), 7 new input nodes expose the ally's internal state. Reads the nearest qualifying ally per tick (one-way: you read them, they read you independently if they also have the trait). Passive energy cost while any ally is in range.

```
encounterRange = 1.5 * (selfRadius + allyRadius)
encounterEnergyCost = 0.05 * metabolism per tick (while any ally in range)
encounterTarget = nearest same-species organism within encounterRange
```

**Evolvable parameter**:
- `EncounterMemoryDuration` gene: Range 5s-30s (mutable). Controls how long AllyLastFoodAngle
  and AllyLastThreatAngle values persist after the encounter ends. Longer memory = better
  information retention but potentially staler data. Starts at 10s (food) / 15s (threat) and evolves.

**New brain nodes**: Unlocks 7 Tier 4 input nodes (`AllyEnergyRatio`, `AllyHealthRatio`, `AllyHeading`, `AllyLastFoodAngle`, `AllyLastThreatAngle`, `AllyWant2Mate`, `AllyReproductiveState`). No additional BP cost beyond the 8 BP trait fee (synapse wiring costs 0.5 BP each as normal).

**Balance Counters**:
- **8 BP cost**: Same as Spore Dispersal. Significant sacrifice from the 100 BP pool.
- **Close proximity required**: ~2 unit range. Organisms must physically approach allies — no long-range information.
- **Same-species only**: Cannot read enemy organisms' state.
- **Passive energy drain**: 0.05 × metabolism per tick while any ally is nearby. Social species pay a constant tax.
- **Predator exploitation**: Grouped organisms are easier targets. Coordinated packs attract pack hunters.
- **Population-dependent**: Value scales with population density. Low population = fewer encounters = trait is wasted BP.
- **Late-game unlock**: Tier 4 requirement (500 EP) ensures players have mastered simpler systems first.

**vs. Pheromones** (complementary, not competitive):
- Pheromones: long range (~50-100 units), low info (1 scalar per channel), persistent (~30s), free (no BP cost for emission)
- Encounters: short range (~2 units), high info (7 values), instant, costs 8 BP

**Strategic Niche**: Enables sophisticated cooperative behavior — scout-and-report (one organism finds food, others read its `AllyLastFoodAngle`), sentinel behavior (one detects threat, nearby allies read `AllyLastThreatAngle`), injury-response convoy (healthy organisms protect allies with low `AllyHealthRatio`), and mate confirmation (read `AllyWant2Mate` + `AllyReproductiveState` before committing to mating approach). Best combined with Herd Coordination for dense social groups. Countered by predators that target clusters and by environments that force dispersal.

---

### 1.2 Brain System (Visual Node Graph)

The core interactive depth system. Players wire sensory inputs to behavioral outputs through processing nodes on a touch-friendly visual canvas.

#### Architecture

```
[SENSORY LAYER]  -->  [PROCESSING LAYER]  -->  [BEHAVIOR LAYER]
(Input Nodes)         (Hidden Nodes)            (Output Nodes)
Fixed, read-only      Player-designed            Fixed, write-only
Unlock over time      Nodes + synapses           Unlock over time
                      Each node has a BIAS value
                      (adjustable, added before activation function)
```

#### Synapses (Connections)

Synapses connect any node to any downstream node. Each synapse has:

- **Strength (weight)**: -5.0 to +5.0. Positive = excitatory, negative = inhibitory. The signal transmitted = source node's activation * synapse strength.
- **Enabled/Disabled**: Can be toggled. Disabled synapses exist in the design but don't transmit.
- **Direction**: Synapses are one-directional. Signal flows from source to destination only.

**Stimulation accumulation**: For most nodes, incoming signals are SUMMED. For Multiply nodes, incoming signals are MULTIPLIED.

Example: If a node receives three connections with stimulations of -1.2, 2.5, and 0.6:
- Summative (most nodes): total stimulus = 1.9
- Multiplicative (MULT node): total stimulus = -1.8

**Cost**: Each synapse costs 0.5 BP. Each hidden node costs 2 BP.

**UI**: Players create synapses by **dragging from one node to another** on the canvas. Tap a synapse to adjust its weight with a slider. Long-press to delete. Synapse thickness reflects weight magnitude. Color reflects sign (green = positive, red = negative).

#### Node Biases

Every hidden node and output node has an adjustable **bias value** (-5.0 to +5.0). The bias is added to the total incoming stimulation BEFORE the activation function is applied. This allows nodes to have a baseline activation without any input, or to shift the threshold at which they activate.

Example: A Sigmoid node with bias +2.0 and no incoming connections outputs `sigmoid(2.0) = 0.88` instead of the default 0.5. This means the behavior "wants to happen" by default and must be inhibited.

#### Input Nodes (Senses)

Input nodes provide real-time data. Their values are set by the simulation each tick and flow outward through synapses. Input nodes cannot receive incoming connections.

##### Tier 1 Inputs (Available Immediately) - 11 Nodes

Designed so that ALL four archetypes (herbivore, carnivore, omnivore, scavenger) can build functional brains from day one.

| Node | Range | Description | Why Tier 1 |
|------|-------|-------------|-----------|
| `Constant` | 1.0 | Always-on signal. Used as bias source or offset | Essential for baseline behaviors |
| `EnergyRatio` | [0, 1] | Current energy / max energy | Core survival awareness |
| `HealthRatio` | [0, 1] | Current HP / max HP | Core survival awareness |
| `Fullness` | [0, 1] | Stomach contents / stomach capacity | Eating decisions |
| `NearestPlantAngle` | [-1, 1] | Direction to nearest plant pellet. -1=left, 0=ahead, +1=right | Herbivore food-seeking |
| `NearestPlantDist` | [0, 1] | Distance to nearest plant. 0=touching, 1=at max view range | Herbivore food-seeking |
| `NearestMeatAngle` | [-1, 1] | Direction to nearest meat pellet | Scavenger/carnivore food |
| `NearestMeatDist` | [0, 1] | Distance to nearest meat pellet | Scavenger/carnivore food |
| `NearestOrganismAngle` | [-1, 1] | Direction to nearest other organism (any species) | Predator targeting AND prey fleeing |
| `NearestOrganismDist` | [0, 1] | Distance to nearest organism | Predator targeting AND prey fleeing |
| `NearestOrganismSize` | [0, 1] | Relative size of nearest organism. 0=much smaller, 0.5=same size, 1.0=much larger | Fight-or-flight decision |

**Design rationale**: Splitting food detection into Plant and Meat channels (instead of generic "NearestFood") is essential. A carnivore needs to sense organisms to hunt them AND sense meat pellets to scavenge. A herbivore needs to sense plants AND sense organisms to flee from them. The `NearestOrganismSize` node is the critical fight-or-flight enabler: carnivores chase smaller organisms, prey flees from larger ones.

##### Tier 2 Inputs (Unlock: 50 EP) - 8 Nodes

| Node | Range | Description |
|------|-------|-------------|
| `Speed` | [0, 1] | Current movement speed / max speed |
| `Maturity` | [0, 1] | Growth level. 1.0 = adult, can reproduce |
| `NearestAllyAngle` | [-1, 1] | Direction to nearest organism of same species |
| `NearestAllyDist` | [0, 1] | Distance to nearest ally |
| `NOrganisms` | [0, 1] | Number of visible organisms / 4 (normalized) |
| `NFood` | [0, 1] | Number of visible food items / 4 (normalized) |
| `IsGrabbing` | 0 or 1 | Whether currently holding something |
| `AttackedDamage` | [0, 1] | Damage received this tick (normalized to max HP) |

##### Tier 3 Inputs (Unlock: 200 EP) - 15 Nodes

| Node | Range | Description |
|------|-------|-------------|
| `Tic` | [0, 1] | Internal clock oscillator. Cycles from 0→1 over the Internal Clock Period gene |
| `TimeAlive` | [0, 1] | Age / max expected lifespan |
| `EggStored` | [0, 1] | Egg readiness (0 = no egg, 1 = ready to lay) |
| `BiomeType` | [0, 1] | Current biome encoded: Grassland=0.2, Forest=0.4, Wetland=0.6, Desert=0.8, Rocky=1.0 |
| `SeasonPhase` | [0, 1] | Season progress: Spring=0-0.25, Summer=0.25-0.5, Autumn=0.5-0.75, Winter=0.75-1.0 |
| `NearestOrganismColor` | [0, 1] | Hue of nearest visible organism (enables species recognition) |
| `NearestAllyCount` | [0, 1] | How many allies are within view range / 4 |
| `StomachPlantRatio` | [0, 1] | What fraction of stomach contents is plant material (vs meat) |
| `NearestMateAngle` | [-1, 1] | Direction to nearest opposite-sex same-species organism. Returns 0 if none visible or if species is asexual. *Requires Sexual Reproduction trait* |
| `NearestMateDist` | [0, 1] | Distance to nearest mate (1.0 if none visible). *Requires Sexual Reproduction trait* |
| `Sex` | {0, 1} | This organism's sex (0=female, 1=male). Always 0 for asexual species. *Requires Sexual Reproduction trait* |
| `MatingCooldown` | [0, 1] | Remaining cooldown fraction (0=ready, 1=just mated). *Requires Sexual Reproduction trait* |
| `NearbyEggCount` | [0, 1] | Same-species eggs in view range. Normalized: 0.25 per egg, caps at 1.0 for 4+ eggs |
| `NearestEggAngle` | [-1, 1] | Direction to nearest same-species egg. Returns 0 if no eggs visible |
| `NearestEggDist` | [0, 1] | Distance to nearest same-species egg (1.0 if none visible) |

**Mate detection note**: `NearestMateAngle` and `NearestMateDist` use a dedicated filtered spatial query (separate from NearestOrganism) that filters by same-species + opposite-sex + mature organisms.

##### Tier 4 Inputs (Unlock: 500 EP) - 17 Nodes

| Node | Range | Description |
|------|-------|-------------|
| `Pheromone1Strength` | [0, 1] | Red pheromone intensity at current position |
| `Pheromone2Strength` | [0, 1] | Green pheromone intensity |
| `Pheromone3Strength` | [0, 1] | Blue pheromone intensity |
| `Pheromone1Angle` | [-1, 1] | Direction of strongest red pheromone gradient |
| `Pheromone2Angle` | [-1, 1] | Direction of strongest green pheromone gradient |
| `Pheromone3Angle` | [-1, 1] | Direction of strongest blue pheromone gradient |
| `SoundDirection` | [-1, 1] | Direction of loudest nearby sound |
| `SoundIntensity` | [0, 1] | Volume of loudest nearby sound (0 = silence) |
| `SoundFrequency` | [0, 1] | Frequency of the loudest nearby sound. Enables species-specific call recognition |
| `IsBurrowed` | 0 or 1 | Whether currently underground (for burrowing organisms) |
| `AllyEnergyRatio` | [0, 1] | Nearest encounter-range ally's current energy / max energy. Returns 0 if no ally in range. *Requires Encounter Info Sharing trait* |
| `AllyHealthRatio` | [0, 1] | Nearest encounter-range ally's current HP / max HP. *Requires Encounter Info Sharing trait* |
| `AllyHeading` | [-1, 1] | Nearest encounter-range ally's heading relative to self (-1=facing away left, 0=same direction, +1=facing away right). *Requires Encounter Info Sharing trait* |
| `AllyLastFoodAngle` | [-1, 1] | Direction to the last food source the nearest encounter-range ally consumed. Resets to 0 after 10 simulation-seconds. *Requires Encounter Info Sharing trait* |
| `AllyLastThreatAngle` | [-1, 1] | Direction of last damage received by nearest encounter-range ally. Resets to 0 after 15 simulation-seconds. *Requires Encounter Info Sharing trait* |
| `AllyWant2Mate` | [0, 1] | Nearest encounter-range ally's Want2Mate output value. Returns 0 if ally has no Sexual Reproduction or no encounter ally in range. *Requires Encounter Info Sharing trait* |
| `AllyReproductiveState` | [-1, 1] | Nearest encounter-range ally's reproductive readiness. Females: +EggStored (0 to +1). Males: -energyRatio (0 to -1). Encodes both sex and readiness in one signal. *Requires Encounter Info Sharing trait* |

#### Output Nodes (Behaviors)

Output nodes translate brain signals into organism actions. Most use **sigmoid activation** with adjustable bias, meaning they have a default output of ~0.5 when not stimulated. Actions trigger when output exceeds 0.5 (threshold behaviors) or scale proportionally (continuous behaviors).

##### Tier 1 Outputs (Available Immediately) - 5 Nodes

| Node | Activation | Range | Effect | Type |
|------|-----------|-------|--------|------|
| `Accelerate` | TanH | [-1, 1] | Forward/backward movement force. Energy cost = `baseMoveCost * SpeedRatio * Size1D * \|output\|` | Continuous |
| `Rotate` | TanH | [-1, 1] | Turning torque. -1 = hard left, +1 = hard right. Energy cost = `baseTurnCost * SpeedRatio * Size1D * \|output\|` | Continuous |
| `Want2Eat` | Sigmoid | [0, 1] | When > 0.5 and touching food: consume food into stomach. Intensity affects bite speed | Threshold |
| `Want2Attack` | Sigmoid | [0, 1] | When > 0.5 and adjacent to organism: bite attack. `damage = output * (STR * Size1D - target.DEF) * biteDmgSetting` | Threshold |
| `Want2Flee` | Sigmoid | [0, 1] | When > 0.5: sprint mode. Speed × 1.5 but energy cost × 3. Burns energy fast for emergency escape | Threshold |

**Why Want2Attack is Tier 1**: Without it, carnivores cannot function. Every playstyle must be viable from the start. A herbivore simply never wires anything to Want2Attack (default sigmoid output of 0.5 is right at the threshold - set bias to -2.0 to ensure it stays at ~0.12 and never fires).

##### Tier 2 Outputs (Unlock: 50 EP) - 4 Nodes

| Node | Activation | Range | Effect | Type |
|------|-----------|-------|--------|------|
| `Want2Grow` | Sigmoid | [0, 1] | When > 0.5: convert energy → body points (increases size/maturity). `growthRate = GrowthScale / (1 + GrowthFactor * maturity^GrowthExponent) * output` | Threshold |
| `Digestion` | Sigmoid | [0, 1] | Controls stomach acid level (0-100%). Affects digestion speed vs efficiency tradeoff (see Section 9) | Continuous |
| `Grab` | Sigmoid | [0, 1] | When > 0.5: grab nearest pellet or small organism. Grabbed items move with the organism | Threshold |
| `Want2Heal` | Sigmoid | [0, 1] | When > 0.5: convert energy → health. `healRate = output * metabolism * 0.5 HP/s`. Costs 2x the energy-to-HP ratio | Threshold |

##### Tier 3 Outputs (Unlock: 200 EP) - 6 Nodes

| Node | Activation | Range | Effect | Type |
|------|-----------|-------|--------|------|
| `Want2Reproduce` | Sigmoid | [0, 1] | When > 0.5, mature, healthy (≥50%), and egg ready: lay egg. Offspring inherits design with possible mutations. For sexual species, this controls egg production only (see `Want2Mate` for fertilization) | Threshold |
| `Herding` | Sigmoid | [0, 1] | Activates flocking behavior weighted by herd genes (separation, alignment, cohesion, velocity weights). Intensity scales flock influence on movement | Continuous |
| `ClockReset` | Sigmoid | [0, 1] | When > 0.5: reset Tic input to 0. Enables controllable rhythmic behaviors | Threshold |
| `Burrow` | Sigmoid | [0, 1] | When > 0.5: enter/stay burrowed. When < 0.5: surface. Only functional if Burrowing trait is purchased | Threshold |
| `Want2Mate` | Sigmoid | [0, 1] | When > 0.5 and all fertilization conditions met (see Section 3.3): fertilize with touching mate. Only functional if Sexual Reproduction trait is purchased. *Requires Sexual Reproduction trait* | Threshold |
| `StoreFat` | Sigmoid | [0, 1] | When > 0.5 and energy > 50%: deposit surplus energy into fat reserves at 20% of digestion rate. 0 BP cost (node free, Fat Reserves trait costs BP). *Requires Fat Reserves trait* | Threshold |

##### Tier 4 Outputs (Unlock: 500 EP) - 5 Nodes

| Node | Activation | Range | Effect | Type |
|------|-----------|-------|--------|------|
| `EmitPheromone1` | Sigmoid | [0, 1] | Emits red pheromone. Intensity = emission strength. Energy cost: `0.1 * output * metabolism` per tick | Continuous |
| `EmitPheromone2` | Sigmoid | [0, 1] | Emits green pheromone | Continuous |
| `EmitPheromone3` | Sigmoid | [0, 1] | Emits blue pheromone | Continuous |
| `EmitSound` | Sigmoid | [0, 1] | Emits acoustic signal. Range = `output * ViewRadius * 3`. Energy cost: `0.2 * output² * metabolism` per tick. Detectable by all organisms with sound inputs | Continuous |
| `SoundFrequency` | Sigmoid | [0, 1] | Sets emitted sound frequency. Base value set at design time as a gene, mutable. Enables species-specific calls. Receivers get `SoundFrequency` input to differentiate calls | Continuous |

#### Hidden Nodes (Processing Layer)

Hidden nodes process signals between inputs and outputs. Each has an activation function, a bias, and costs 2 BP.

**Why each node type exists and when you'd use it over alternatives:**

##### Tier 1 Hidden Nodes (Available Immediately)

**Sigmoid (SIG)** - Output: [0, 1], Default: 0.5
```
SIG(x) = 1 / (1 + e^(-x))
```
**Use for**: Binary decisions ("should I do this?"). Squashes any input range to [0,1]. The S-curve means small inputs near 0 produce ~0.5, while strong positive inputs → 1.0 and strong negative → 0.0. Best for feeding into threshold outputs.
**NOT good for**: Proportional control (steering). Flattens the extremes, so "slightly left" and "far left" both map near 0 or 1.

**Linear (LIN)** - Output: [-100, 100], Default: 0
```
LIN(x) = x  (capped at ±100)
```
**Use for**: Proportional control, signal combining, and bias offsets. Preserves the exact magnitude of input signals. Wire `NearestPlantAngle → Linear → Rotate` for smooth proportional steering (the organism turns proportionally to how far off-center the food is). Also excellent as a signal aggregator: sum multiple inputs before feeding them to a downstream Sigmoid for a combined threshold.
**NOT good for**: Decision-making (output has no natural threshold).

**ReLU** - Output: [0, 100], Default: 0
```
ReLU(x) = max(0, x)
```
**Use for**: Conditional gating ("only when positive"). Combined with bias, creates "if above threshold" logic. Example: `NearestOrganismDist --(-2.0)--> ReLU [bias: +1.0]` fires only when organism is closer than 0.5 distance. Blocks all negative signals, passing only positive ones.
**NOT good for**: Bipolar outputs (can't produce negative values).

**TanH** - Output: [-1, 1], Default: 0
```
TanH(x) = (e^x - e^(-x)) / (e^x + e^(-x))
```
**Use for**: Bipolar decisions (approach vs flee, turn left vs right). Like Sigmoid but centered on 0 with negative outputs. Wire threat assessment through TanH: positive input → approach (prey), negative input → flee (predator).
**NOT good for**: One-sided signals (use ReLU or Sigmoid instead).

##### Tier 2 Hidden Nodes (Unlock: 50 EP)

**Latch (LAT)** - Output: 0 or 1, Default: 0
```
LAT(x) = s, where:
  if x >= 1.0: set s = 1
  if x <= 0.0: set s = 0
  otherwise: s = previous value (memory!)
```
**Use for**: Memory and state. "I detected a predator" → Latch sets to 1 → organism enters flee mode → stays in flee mode even after predator leaves detection range → only resets when specific condition met (e.g., timer expires, energy is high again). Enables state machines, mode-switching, and persistent behavioral changes.
**Balance**: Limited to max 3 Latch nodes per brain. Complex state machines (requiring 4+ states) demand excessive BP in nodes + synapses, making them self-balancing through cost. Single mutation to a synapse weight can break an entire state machine, making simpler reactive brains more mutation-robust (important for the autonomous evolution during deployment).
**NOT good for**: Proportional responses (it's binary).

**Multiply (MULT)** - Output: [-100, 100], Default: 1
```
MULT(a, b, c...) = a × b × c × ...
(inputs are individual synapse outputs, MULTIPLIED not summed)
```
**Use for**: AND-gate logic. "Attack ONLY when (target is smaller) AND (I have high energy) AND (target is close)". If ANY input is 0, output is 0. Also used for signal modulation: multiply a desire by a condition. Example: `Want2Hunt = huntDrive * isTargetSmaller * isTargetClose`.
**Critical emergent depth**: Combined with Gaussian node, can approximate division (see Tier 3). This is the key node for complex conditional behaviors.
**NOT good for**: Simple additive signal combination (use Linear).

##### Tier 3 Hidden Nodes (Unlock: 200 EP)

**Gaussian (GAU)** - Output: [0, 1], Default: 1.0
```
GAU(x) = 1 / (1 + x²)
```
**Use for**: "Sweet spot" detection. Maximum output when input equals 0 (or equals the bias, if bias shifts the center). ANY deviation from the sweet spot reduces output. Example: `NearestOrganismSize --[+1.0]--> GAU [bias: -0.5]` fires maximally when target is exactly the same size (NearestOrganismSize = 0.5), and decreases for both smaller and larger targets. Achieves "attack organisms my own size" in ONE node, which would require 2+ Sigmoid nodes and extra wiring otherwise.
**Advanced use**: Combined with Multiply, approximates division: `input → ×100 → GAU → ×100 → MULT` alongside `input → ×100 → MULT` makes MULT output ≈ 1/input. Enables ratio-based decision making.
**NOT good for**: Monotonic thresholds (use Sigmoid).

**Differential (DIF)** - Output: [-100, 100], Default: 0
```
DIF(x) = dx/dt  (rate of change, normalized across time speeds)
```
**Use for**: Detecting change. Wire `EnergyRatio → DIF`: positive output = gaining energy, negative = losing energy. Wire `NearestOrganismDist → DIF`: negative output = organism approaching (getting closer), positive = moving away. Enables "react to approaching threats" without needing to track absolute distance. Critical for detecting ambushes (sudden appearance of threat = large negative spike).
**NOT good for**: Steady-state information (outputs 0 when nothing is changing).

**Absolute (ABS)** - Output: [0, 100], Default: 0
```
ABS(x) = |x|
```
**Use for**: "Any strong signal regardless of direction." Wire `Rotate → ABS`: fires when turning hard in either direction (useful for detecting erratic behavior in nearby organisms). Wire `SoundDirection → ABS`: detects any sound regardless of direction.
**NOT good for**: Direction-sensitive responses.

##### Tier 4 Hidden Nodes (Unlock: 500 EP)

**Sine (SIN)** - Output: [-1, 1], Default: 0
```
SIN(x) = sin(x)
```
**Use for**: Creating periodic/oscillating behaviors. Strong stimulation [0 to 10+] creates cyclical output. Enables patrol patterns (oscillate between left and right turning), rhythmic feeding, and search spirals. Combined with Integrator, creates complex temporal patterns.
**NOT good for**: Simple threshold decisions.

**Integrator (INT)** - Output: [-100, 100], Default: 0
```
INT(x) = y_prev + x * dt
```
**Use for**: Accumulation over time. "How long has this been happening?" Wire `AttackedDamage → INT`: tracks cumulative damage taken (when total exceeds threshold, switch to flee mode). Wire `NFood → INT`: tracks food abundance over time (enables seasonal awareness without the SeasonPhase input). Opposite of Differential.
**NOT good for**: Instantaneous reactions (it's inherently slow to respond).

**Inhibitory (INH)** - Output: [-100, 100], Default: 0
```
INH(x) = (x - x_prev) + y_prev * e^(-bias * dt)
```
**Use for**: Habituation. Responds strongly to NEW stimuli, then fades if stimulus is constant. "New threat!" produces strong output → organism reacts → if threat stays constant, output decays → organism habituates and returns to normal behavior. Bias controls decay rate (higher bias = faster habituation). Enables "cry wolf" resistance and focus on novelty.
**NOT good for**: Persistent responses to ongoing conditions.

#### Starting Brain Templates

Pre-wired brains that demonstrate effective patterns. Players can modify these or start from scratch.

##### Simple Grazer Template (Herbivore, 7 synapses = 3.5 BP)
```
NearestPlantAngle   --[+2.0]--> Rotate          // turn toward nearest plant
NearestPlantDist    --[+3.0]--> Accelerate       // speed up when plant is far
Constant            --[+0.5]--> Accelerate       // always drift forward
Constant            --[+2.0]--> Want2Eat         // baseline desire to eat
NearestPlantDist    --[-3.0]--> Want2Eat         // eat more eagerly when close (sigmoid: dist=0 → 2.0-3.0*0=-1.0 → sig=0.27... wait)
NearestOrganismSize --[+4.0]--> Want2Flee        // flee from large organisms
NearestOrganismDist --[-3.0]--> Want2Flee        // only flee when close
```
**Behavior**: Wanders forward, steers toward plants, eats when close, flees from large nearby organisms. Simple but functional.

##### Hunter Template (Carnivore, 9 synapses + 1 hidden = 6.5 BP)
```
Hidden H1 (ReLU, bias: +0.5): "Is target smaller than me?"
  NearestOrganismSize --[-1.0]--> H1  // fires when size<0.5 (target smaller)

H1                      --[+10.0]--> Want2Attack   // attack only smaller targets
NearestOrganismAngle    --[+3.0]-->  Rotate         // steer toward organism
NearestOrganismDist     --[-3.0]--> Want2Attack     // only attack when close
H1                      --[+5.0]-->  Accelerate     // chase only when viable
Constant                --[+2.0]--> Want2Eat        // always consume kills
NearestOrganismSize     --[+6.0]--> Want2Flee       // flee from larger organisms
NearestOrganismDist     --[-4.0]--> Want2Flee       // only flee when large+close
Constant                --[+0.3]--> Accelerate      // drift forward when idle
```
**Behavior**: Steers toward organisms. If target is smaller, chases and attacks. If target is larger, flees. Eats kills. Uses one ReLU node as a size-gate to prevent suicidal attacks on larger organisms.

##### Scavenger Template (Scavenger, 7 synapses = 3.5 BP)
```
NearestMeatAngle    --[+3.0]--> Rotate           // steer toward meat
NearestMeatDist     --[+3.0]--> Accelerate       // speed up toward distant meat
Constant            --[+0.5]--> Accelerate       // drift forward
Constant            --[+2.0]--> Want2Eat         // always eat meat
NearestMeatDist     --[-3.0]--> Want2Eat         // eat when close to meat
Constant            --[+3.0]--> Want2Flee        // always somewhat afraid
NearestOrganismDist --[-4.0]--> Want2Flee        // especially flee from close organisms
```
**Behavior**: Seeks meat pellets (from dead organisms). Avoids all living organisms. Cowardly but effective if there's enough death happening in the ecosystem.

##### Balanced Omnivore Template (Omnivore, 10 synapses = 5 BP)
```
NearestPlantAngle   --[+1.5]--> Rotate           // steer toward plants
NearestMeatAngle    --[+2.0]--> Rotate           // steer toward meat (slightly preferred)
NearestPlantDist    --[+1.5]--> Accelerate       // approach food
NearestMeatDist     --[+1.5]--> Accelerate
Constant            --[+0.3]--> Accelerate       // drift
Constant            --[+2.0]--> Want2Eat         // always eat
NearestPlantDist    --[-1.5]--> Want2Eat         // eat when close to either
NearestMeatDist     --[-1.5]--> Want2Eat
NearestOrganismSize --[+4.0]--> Want2Flee        // flee from large organisms
NearestOrganismDist --[-3.0]--> Want2Flee        // only when close
```
**Behavior**: Seeks both plants and meat. Slightly prefers meat (higher weight on MeatAngle). Flees from large organisms. No combat capability - this omnivore is a forager, not a fighter.

#### Brain Processing (Per Simulation Tick)

Executed for every organism, every tick (4 times per second):

1. **Update inputs**: Read organism's state and environment → set all input node values
2. **Propagate signals**: For each synapse: `signal = source.activation * synapse.strength`
3. **Accumulate**: Each hidden/output node sums (or multiplies for MULT) all incoming signals + bias
4. **Activate**: Pass accumulated stimulus through the node's activation function → new activation value
5. **Apply outputs**: Each output node's activation drives its corresponding behavior
6. **Energy cost**: Brain processing costs `0.1 * numHiddenNodes * metabolism` energy per tick

**Processing order**: Nodes are processed in topological order (inputs first, then hidden layers in dependency order, then outputs). This means within a single tick, signals can propagate through multiple hidden layers.

---

### 1.3 Appearance System (Auto-Generated Vector Art)

Organism appearance is **procedurally generated from physical stats**. What you see tells you what the organism is.

#### Visual Mapping

| Stat | Visual Effect |
|------|--------------|
| **Size Ratio** | Overall body size (continuous scaling). 4 base sprite variants: Tiny (<0.6), Normal (0.6-1.4), Large (1.4-2.2), Huge (>2.2) |
| **Diet** | Mouth shape morphs continuously: 0.0 = filter tentacles (herbivore), 0.5 = rounded opening (omnivore), 1.0 = sharp pincers with teeth (carnivore) |
| **Strength** | Jaw prominence and mouth size scale with STR. High STR = visible mandibles/spikes on mouth |
| **Defense** | Shell/armor plates appear and thicken. DEF 0 = smooth body, DEF 2+ = visible plating, DEF 4 = heavy shell segments |
| **Speed Ratio** | Body elongation. Faster = more streamlined/tapered. Limbs become longer/thinner. Slow = rounder/stubbier |
| **View Angle** | Eye placement: narrow (<90°) = forward-facing predator eyes. Wide (>180°) = side-mounted prey eyes. 360° = eyes wrap around head |
| **View Radius** | Eye size proportional to view distance. Big eyes = far-sighted |
| **Metabolism** | Body pattern intensity. Low metabolism = muted patterns. High = vivid, saturated markings |
| **Stomach** | Body roundness/girth. Large stomach = rounder body. Small = lean |
| **Armor Plating** | Visible armor segments on front or back depending on direction choice |
| **Venom** | Small gland bulges near mouth, faint green tint on jaw |
| **Camouflage** | Body pattern becomes more complex/mottled. Slight transparency effect |
| **Burrowing** | Front appendages become broader/shovel-like |
| **Fat Reserves** | Body expands/contracts based on current fat level (visible weight gain) |
| **Player Color** | R, G, B sliders for primary hue. Secondary color auto-derived (complementary). Offspring may have slight hue mutations |

#### Art Style Details
- **Cute, vector-based**: Clean SVG-like outlines, smooth bezier curves, rounded shapes
- **Body**: Elliptical base with procedural appendages (2 limbs + tail). Limbs animate with simple oscillation while moving
- **Eyes**: Large, expressive, with visible pupils that track nearest stimulus
- **Mouth**: Continuously morphs based on diet gene
- **Animation**: Procedural - wobble while moving (frequency scales with speed), mouth opens when eating, flash red when damaged, glow when reproducing, size pulse when growing
- **Eggs**: Small versions of the parent with a translucent shell overlay
- **Death**: Pop animation dispersing into meat pellet particles

---

## 2. World Simulation System

### 2.1 World Structure

- **Multi-world rooms**: Each world is an independent simulation room within one Node.js process, managed by `WorldManager` (see [`back-end.md` Section 1.4](./components/back-end.md)). Each world supports up to 30 players (configurable per world, max 100). Admins create worlds; a default world is auto-created on first startup. Smaller worlds create tighter ecosystems where players' species interact meaningfully.
- **World size**: 500 × 500 units. Toroidal wrapping (walk off right edge, appear on left). Scaled for ~30 species.
- **Coordinate system**: Continuous 2D. Organisms have position (x, y) and heading (angle in radians)
- **Spatial partitioning**: World divided into a grid of cells (25×25 = 625 cells, each 20×20 units). Used for efficient collision detection and organism proximity queries
- **Target species count**: Always ~30 active species in the world. When fewer than 30 human players have active species, AI species fill the remaining slots (see Section 13: AI Ecosystem Management).

### 2.2 Biome System

The world contains 5 biome types arranged in organic regions. Biome boundaries are soft gradients, not hard lines.

| Biome | Plant Density | Plant Pellet Size | Meat Decay Rate | Visibility Modifier | Movement Modifier | Special |
|-------|-------------|-------------------|----------------|--------------------|--------------------|---------|
| **Grassland** | High (1.0x) | Medium (1.0x) | Fast (1.0x) | Normal (1.0x) | Normal (1.0x) | Standard biome, no special effects |
| **Forest** | Very High (1.5x) | Large (1.5x) | Medium (0.7x) | Reduced (0.7x view radius) | Normal (1.0x) | Dense vegetation reduces vision but food is plentiful and large |
| **Desert** | Very Low (0.2x) | Small (0.5x) | Very Slow (0.3x) | Extended (1.3x view radius) | Costly (1.3x move energy) | Sparse food but meat persists. Clear sightlines. Movement costs more (sand/heat) |
| **Wetland** | Medium (0.8x) | Medium (1.0x) | Very Fast (2.0x) | Normal (1.0x) | Slow (0.7x speed) | Fast decomposition cycles energy quickly. Fungi spawn 3x more often. Slippery terrain |
| **Rocky** | Low (0.3x) | Small (0.7x) | Slow (0.5x) | Normal (1.0x) | Normal (1.0x) | Sparse food, hiding spots (burrowing 50% cheaper), pellets harder to bite (1.5x hardness) |

**Visual rendering**: Biome regions are rendered as soft-gradient colored backgrounds on the client canvas. Each biome has a base liquid color (see [`art.md`](../art.md) — Biome Liquid Colors), blurred at boundaries to create organic transitions. Seasonal tints shift the hue, saturation, and brightness of all biomes — spring is greener and more saturated, winter is blue-shifted and muted. Ambient particles (microbe specks, bubbles, sediment) vary by biome density and type, reinforcing the "primordial soup viewed through a microscope" aesthetic. See [`front-end.md` §7](./components/front-end.md) for the full rendering specification.

#### Seasonal System
Seasons cycle over ~28 days real-time (one full month), with smooth transitions over 2-3 days between each. Season timing is wall-clock-based and independent of simulation TPS.

| Season | Days | Plant Growth Mult | Meat Availability | Metabolism Cost Mult | Special Effects | Visual Effects |
|--------|------|-------------------|-------------------|---------------------|-----------------|----------------|
| **Spring** | 1-7 | 1.5x | Normal | 0.9x | Reproduction cost -20%. Fungi patches regenerate. Biome boundaries expand (wetland grows) | Greener tint, rising bubble particles, wetland edge shimmer |
| **Summer** | 8-14 | 1.0x | Normal | 1.15x | Heat increases metabolism. Extended "day" (view radius +10%). Desert expands | Warmer tint, heat shimmer particles, desert haze |
| **Autumn** | 15-21 | 0.7x | 1.25x (more death = more meat) | 1.0x | Pellets are larger (plants stockpile). Meat decays slower. Forest shrinks | Amber/desaturated tint, settling debris particles, forest leaf bursts |
| **Winter** | 22-28 | 0.3x | 0.8x | 1.3x | Survival pressure. Plant scarcity. High metabolism cost. Wetland freezes (becomes rocky). Rocky expands | Blue/muted tint, crystalline drift particles, wetland frozen sheen |

**Biome-Season Interaction Examples**:
- Spring: Wetland expands into adjacent grassland (rains). Forest becomes denser.
- Summer: Desert expands. Grassland dries at edges.
- Autumn: Forest thins. Grassland becomes more fertile (falling leaves → nutrient recycling).
- Winter: Wetland freezes → becomes rocky. Forest coverage minimal. Desert unchanged.

This ensures **no single biome/season combination is permanently optimal**. A grassland herbivore thrives in spring but struggles in winter. A desert carnivore-scavenger peaks in summer but lacks prey in spring.

### 2.3 Energy Cycle (Closed System)

Total energy in the world is CONSERVED. Set at world creation:
```
totalEnergy = biomassDensity * worldSize²
```

Energy exists in 5 forms at any moment:
1. **Free Biomass**: Ambient energy in the environment. Source for plant growth.
2. **Plant Pellets**: Solid plant matter. Created from biomass.
3. **Meat Pellets**: Dead organism matter. Created from organism death.
4. **Organism Energy**: Energy stored in living organisms (reserves + body points).
5. **Egg Energy**: Energy invested in unhatched eggs.

```
totalEnergy = freeBiomass + Σ(plantPellets) + Σ(meatPellets) + Σ(organismEnergy) + Σ(eggEnergy)
```

This is ALWAYS constant. When an organism burns energy for movement, that energy returns to free biomass. When a plant pellet is eaten, it moves from plant → organism. When an organism dies, body energy → meat pellets. When meat decays, it returns to biomass.

#### Plant Pellet Spawning
```
spawnRate = biomeBaseFertility * seasonMultiplier * (freeBiomass / totalEnergy)
```
Plants spawn faster when there's more free biomass (energy not locked in organisms/pellets). This creates a natural feedback: when populations crash, plants bloom; when populations boom, plants become scarce.

**Density-dependent growth** (prevents herbivore monoculture):
```
effectiveSpawnRate = spawnRate / (1 + localHerbivoreCount / 50)
```
Areas with many herbivores have slower plant regrowth, forcing dispersal.
Cells with very low plant density display a subtle brown tint (barren patch indicator).

#### Meat Pellet Decay
```
decayRate = biomeDecayMultiplier * pelletSize * 0.01  // units² per second
```
Meat slowly loses mass over time, returning energy to free biomass. Decay is faster in wet biomes, slower in dry/cold.

#### Material Properties

| Material | Energy Density (E/u²) | Mass Density (g/u²) | Hardness | Reactivity (u²/s) | Max Conversion Eff. |
|----------|----------------------|---------------------|----------|-------------------|-------------------|
| **Plant** | 1.0 | 0.5 | 0.5 | 1.0 | 55% |
| **Meat** | 3.0 | 1.5 | 1.5 | 2.0 | 80% |

### 2.4 Physics & Movement

Simple 2D Newtonian physics:

```
// Force application
moveForce = Accelerate_output * baseForce * sqrt(Size1D * SpeedRatio) * ageStrengthFactor
turnTorque = Rotate_output * baseForce/2 * SpeedRatio * Size1D³ * ageStrengthFactor

// Velocity update (with drag)
velocity += (moveForce / mass) * dt
velocity *= (1 - dragCoefficient * dt)
angularVelocity += (turnTorque / momentOfInertia) * dt
angularVelocity *= (1 - angularDrag * dt)

// Position update
position += velocity * heading * dt
heading += angularVelocity * dt

// Mass calculation
mass = Size2D * bodyMassDensity + stomachContents * materialMassDensity

// Energy costs
moveEnergyCost = baseMoveCost * SpeedRatio * Size1D * |Accelerate_output| * metabolism * dt
turnEnergyCost = baseTurnCost * SpeedRatio * Size1D * |Rotate_output| * metabolism * dt
```

**Collision**: Elastic collision between organisms. Larger organisms push smaller ones. Collision with pellets triggers eating check. Organisms cannot overlap (separation force applied).

**Sprint (Want2Flee)**: When active, speed multiplier = 1.5x, energy cost = 3x normal movement. Burns energy fast but enables escape.

### 2.5 Simulation Tick & Performance Architecture

#### Architecture
```
┌─────────────────────────┐
│  GitHub Pages (React SPA)│  ← Static hosting, free
│  - Canvas/WebGL render   │
│  - Brain editor UI       │
└───────────┬──────────────┘
            │ WebSocket (viewport data, ~5-8 KB/s)
            │ REST (auth, history, mutations via Supabase)
┌───────────┼──────────────────────────┐
│           │                          │
│  ┌────────▼────────┐  ┌─────────────▼──────┐
│  │ VPS (sim server) │  │  Supabase          │
│  │ Hetzner CX33     │  │  Postgres + Auth   │
│  │ ~$7/mo           │  │                    │
│  │                  │  │  - World snapshots  │
│  │ - Sim loop 20/s  │  │    (every 5 min)   │
│  │ - WebSocket srv   │  │  - Player accounts │
│  │ - Spatial hash    │  │  - Mutation history │
│  │ - Neural nets     │  │  - Leaderboards    │
│  │ - AI organisms    │  │  - Event logs      │
│  └──────────────────┘  └────────────────────┘
```

**Cost: ~$7/month total**. Hetzner CX33 (4 vCPU, 8GB RAM, ~$7/mo). Supabase free tier handles 30 players easily.

#### Tick Rate & Simulation Speed

Server runs at a **constant 40 ticks per second** (`SIM_TPS = 40`, configurable). With 30 players × ~30 organisms = ~900 organisms + ~5,000 plant pellets + ~500 meat pellets ≈ 6,400 entities. Per-tick computation is ~100K simple operations = **~0.5ms per tick** on a single core. This leaves ~80% CPU idle for WebSocket serving and state persistence.

**Constant simulation speed**: The simulation runs at the same TPS regardless of connected clients. There is no dual-mode acceleration. When spectating, clients receive updates at 20 Hz (decoupled broadcast timer, showing approximately every 2nd tick). Organisms appear ~2x faster than a 1:1 real-time view — noticeable but comfortably followable.

**Target organism lifespan**: ~2,000-4,000 ticks (~50-100 real seconds at 40 TPS). This gives:
- ~800-2,000 generations per real day (constant, never stalls when players view)
- Organisms live long enough to watch behaviors unfold when spectating
- Meaningful evolution between daily check-ins

#### Client Data Transfer (Mobile-Optimized)

1. **Viewport culling**: Client sends its viewport rectangle to the server. Server only sends entities within viewport + 10% margin. With 6,400 entities in a 500×500 world, a typical viewport contains ~50-80 entities.
2. **Delta compression**: First frame sends full state. Subsequent frames only send entities that moved/changed, entered, or left the viewport.
3. **Binary protocol**: Packed binary format instead of JSON. Entity update = `[id:u16][x:f32][y:f32][rot:u8][state:u8]` = 12 bytes. ~30 updates/broadcast × 12 bytes = ~360 bytes/broadcast × 20 Hz = **~7 KB/sec**.
4. **Distance-based throttling**: Entities far from camera center update at reduced rates (every 3rd-5th tick).

#### Per-Tick Processing Order
1. **Sense**: Spatial hash queries for each organism's inputs
2. **Think**: Propagate all neural networks
3. **Act**: Apply output behaviors
4. **Physics**: Movement, collisions, wrapping
5. **Biology**: Digestion, metabolism, growth, ageing, species entropy
6. **Genetics**: Apply mutations to newborn organisms, track mutation pool
7. **Reproduction**: Hatch eggs, process egg production
8. **Environment**: Spawn plants, decay meat, update pheromones, update fungi
9. **Death**: Check death conditions, spawn meat pellets
10. **Record**: Log significant events, broadcast to connected clients
11. **Persist**: Every `SIM_TPS * 15` ticks (~15 sec wall-clock), snapshot key metrics to Supabase. Full world snapshot every 5 min.

#### Population Control (No Hard Caps)

There is **no per-player organism cap**. Population is controlled entirely through simulation mechanics:
- **Biomass conservation**: Fixed total energy. More organisms = less food per organism = starvation pressure
- **Density-dependent reproduction**: `reproCost = baseCost * (1 + localDensity / densityThreshold)`. Crowded areas make reproduction 2-3x more expensive
- **Ageing**: Guaranteed mortality with exponential strength decay + metabolism increase
- **Species entropy**: Escalating cost for long-running species (see Section 3.4)
- **Ecosystem pressure valve**: If total organism count exceeds 2,000, free biomass conversion to plants accelerates (more food, but also means more competition → natural equilibrium). This is a soft self-correcting system, not a hard kill switch.

### 2.6 World Access & World Picker

Players discover and join worlds through the **World Picker modal**, opened by tapping the world selector pill in the top bar (visible on every screen). A player can only be active in **one world at a time**. The player's current world is persisted server-side in `players.current_world_id`.

#### World Picker (All Players)

The world picker displays all worlds the player can see:

| Column | Source | Description |
|--------|--------|-------------|
| World name | `worlds.name` | Admin-chosen name (2-48 chars) |
| Players | WORLD_LIST message | `playerCount / maxPlayers` (e.g., "8/30") |
| Access icon | `worlds.access_type` | No icon (public), lock (password), envelope (invite) |
| Status badge | `worlds.status` | Green dot (running), yellow pause (paused), gray (stopped) |
| Season | WORLD_LIST message | Current season indicator (spring/summer/autumn/winter) |
| Your species | `active_species` | If the player has an active species in this world, show species name and current population |
| Current indicator | `players.current_world_id` | Checkmark next to the player's current world |

The player's current world is listed first with a checkmark. Worlds where the player has an active species are visually distinguished.

#### Access Types

| Type | Player Experience |
|------|-------------------|
| **Public** | Tap world name → join immediately. No barrier. |
| **Password** | Tap world name → modal asks for password → submit → join or "wrong password" error. |
| **Invite** | Only shows in world picker if player has a pending/accepted invite. Otherwise hidden. Admins bypass invite requirement. |

#### Joining / Switching Flow

1. Player taps world pill in TopBar → World Picker modal opens
2. Player taps a different world
3. If password-protected: password sub-modal appears first
4. **If player has active species in current world**: retire warning modal appears — "Switching to [New World] will retire [SpeciesName] in [Current World]. This cannot be undone. [Cancel] [Retire & Switch]"
5. On confirm (or if no active species): client sends `RETIRE_SPECIES` [0x22] (if needed) → `LEAVE_WORLD` [0x06] → `JOIN_WORLD` [0x05] with new worldId
6. Server validates access (see [`architecture.md` Section 7.6](./architecture.md))
7. On `JOIN_OK`: client PATCHes `players.current_world_id` via Supabase REST → navigates to /world
8. On failure: error toast ("World is full", "Wrong password", "You are banned", etc.), stay in current world

Players can switch worlds without disconnecting. However, switching worlds retires the player's current species (if any) in the old world. This is irreversible.

#### Single-World Rule

> A player can only be active in one world at a time. There is no spectating of other worlds without committing. Selecting a new world makes it the player's current world immediately. If the player has a species in the old world, they must confirm retirement first.

---

## 3. Organism Lifecycle System

### 3.1 Deployment

Player completes organism design in editor (body + brain + name), then configures deployment:

#### Spawn Biome Choice

Player chooses which biome to spawn in. The BP cost depends on how crowded the target biome is at deployment time — **more organisms already there = higher cost**. This incentivizes geographic diversity and discourages everyone from piling into the easiest biome.

**Biome crowding cost formula**:
```
biomeShare = organismsInTargetBiome / totalOrganismsInWorld
// Fair distribution = 0.20 per biome (5 biomes)

biomeBPCost = floor(max(0, (biomeShare - 0.15) * 40))
// Below 15% share: FREE (encourages filling underpopulated biomes)
// At 15% share: 0 BP
// At 20% share: 2 BP (fair distribution, small cost)
// At 30% share: 6 BP (crowded)
// At 40% share: 10 BP (very crowded, significant sacrifice)
// At 50%+ share: 14+ BP (dominant biome, expensive)
```

**Biome cost examples** (assuming 600 total organisms in world):

| Biome Population | Share | BP Cost | Interpretation |
|-----------------|-------|---------|----------------|
| 30 (5%) | 0.05 | 0 BP | Underpopulated — free, come here! |
| 90 (15%) | 0.15 | 0 BP | Threshold — still free |
| 120 (20%) | 0.20 | 2 BP | Fair share — small cost |
| 180 (30%) | 0.30 | 6 BP | Crowded — noticeable sacrifice |
| 240 (40%) | 0.40 | 10 BP | Very crowded — 10% of budget gone |
| 300 (50%) | 0.50 | 14 BP | Dominant — expensive |

**Special cases**:
- **Random**: Always **0 BP**. Organisms scatter across all biomes — you can't game the system by choosing, so no cost.
- **Empty world** (total organisms < 50): All biomes cost **0 BP**. Prevents punishing early adopters when the world is just starting.
- **BP cost is deducted from organism design budget**: Same pool as founder cost. A crowded biome + many founders can significantly reduce effective BP.

**Strategic implications**:
- **Grassland is free early**, but once many players pick it, cost rises. Late-joining players are incentivized to try Desert or Rocky.
- **Niche biomes** (Desert, Rocky) tend to stay cheap because fewer players build for them. This naturally distributes players.
- **Biome cost is visible** in the deployment UI with a live preview. Players see "Grassland: 6 BP" vs "Rocky: 0 BP" and factor it into their strategy.
- **Combos with Keystone bonus**: Players in underpopulated biomes also tend to fill under-represented niches, stacking the Keystone scoring bonus (Section 5.4) with free biome deployment.

#### Founding Population Size (1-10 organisms)
Players can deploy between 1 and 10 starting organisms. **Each additional founder beyond the first costs 5 BP from the organism's design budget**, reducing the stats available for the organism itself:

| Founders | Effective BP per organism (before biome cost) | Strategic tradeoff |
|----------|-------------------------|--------------------|
| 1 | 100 BP | Strongest individual. Must survive alone to reproduce. High risk, high power. |
| 3 | 90 BP | Moderate. Small starting group with decent stats. |
| 5 | 80 BP | Safety in numbers. Each individual is weaker. Good for herding species. |
| 10 | 55 BP | Swarm start. Individually weak but instant population. High early mortality expected. |

**Combined cost**: `effectiveBP = 100 - (founderCount - 1) * 5 - biomeBPCost`. A player choosing 5 founders in a 30%-crowded biome has `100 - 20 - 6 = 74 BP` per organism.

All founders spawn in the chosen biome at randomized positions within that region. Each starts with 100% energy and health at full maturity.

#### Species Slot & Extinction Recovery
- Each player has **one active species slot**. Deploying a new species retires the current one.
- If a player's species reaches **0 living organisms** (total extinction), their slot is temporarily filled by an **AI placeholder species** (see Section 13). The player receives a notification: "Your species went extinct! Design a new one or we'll keep the ecosystem warm for you."
- The player can deploy a new species at any time, which removes the AI placeholder.

**Extinction Recovery**: When a player's species goes extinct:
1. AI placeholder deploys immediately (simple herbivore in same biome, keeps slot warm)
2. Player receives ExtinctionNotificationModal with farewell stats
3. Modal includes "Design New Species" button → navigates to designer
4. When player deploys new species, AI placeholder retires automatically
5. No cooldown on redeployment

### 3.2 Autonomous Behavior
The brain runs every tick. Player CANNOT directly control organisms. This is the core "design then watch" loop.

What the brain can control (through output nodes):
- Where to move and how fast
- When to eat (and what, based on proximity)
- When to attack (and what, based on proximity)
- When to flee (sprint mode)
- When to grow (spend energy on body points)
- How to digest (acid level optimization)
- When to reproduce (egg laying)
- When to heal (spend energy on health)
- Whether to herd (flock with allies)
- Whether to burrow (if trait purchased)
- When to mate (if Sexual Reproduction trait purchased)
- What pheromones to emit
- What sounds to make

What the brain CANNOT control:
- Which specific organism to target (always acts on nearest matching stimulus)
- Body stats (fixed at design time)
- Gene values (fixed at design, with mutation on offspring)
- Which biome to be in (must physically navigate there)

### 3.3 Reproduction

#### 3.3.1 Asexual Reproduction (Default)

**Asexual, autonomous**. When all conditions met in a single tick:
1. `Want2Reproduce` output > 0.5
2. Maturity >= 1.0 (fully grown adult)
3. Health >= 50%
4. Egg energy fully accumulated

**Egg energy cost**:
```
eggCost = growthEnergyToReachBirthSize
        + physicalTraitCosts * bodyEnergyRatio
        + brainComplexityCost * (numHiddenNodes * 2 + numSynapses * 0.5)
        + baseEggEnergy (setting, ensures minimum viable offspring)
```

**Egg production**: Energy is invested into the egg organ **gradually over time** (not instantaneously). Rate depends on metabolism and how much energy the organism can spare. The `EggStored` input node (Tier 3) reports progress.

**Hatching**: After egg is laid, it incubates for `HatchTime` gene duration (affected by metabolism). During incubation, the egg is a static object in the world (cannot be eaten yet - future feature). After hatching, a juvenile organism appears with:
- Inherited parent brain (identical wiring)
- Inherited parent body stats
- Possible mutations (see 3.5)
- Maturity = `(HatchTime / BroodTime)²`
- Energy = egg energy minus growth costs

**Birth maturity determines starting size**: Organisms with longer hatch times relative to brood time are born larger and more mature, but the egg costs more energy to produce.

#### 3.3.2 Sexual Reproduction (Optional Trait)

Species with the **Sexual Reproduction** trait (Tier 3, 10 BP) use a two-parent reproduction system instead of asexual cloning. The choice between asexual and sexual is made at design time and is **irreversible per deployment**.

**Sex determination**: Each organism carries a binary `Sex` gene (0.0=female, 1.0=male), randomly assigned at birth with a 50/50 ratio. The `Sex` gene is NOT mutable — it is fixed at birth and cannot drift through evolution. Players can configure the sex ratio of the initial founder batch (default 50/50) at deployment.

**Egg production (female only)**: Only female organisms produce eggs. The egg production process is identical to asexual reproduction — `Want2Reproduce > 0.5` starts egg production, `EggStored` reports progress. However, a fully stored egg (`EggStored == 1.0`) is NOT automatically laid. Instead, it waits for fertilization.

**Fertilization**: When all of the following conditions are true in the same tick for both organisms:
1. Same species, both have Sexual Reproduction trait
2. Opposite sex — one female, one male
3. Both `Want2Mate > 0.5`
4. Both `maturity >= 1.0`, both `health >= 50%`
5. Female `EggStored == 1.0`
6. Male has at least 30% of the total egg energy cost available
7. Within touch range (`distance < sum of radii`)

...then fertilization occurs:
```
// Female pays 70% of egg cost (already invested during egg production)
femaleEnergyCost = 0  // Already paid via egg production
// Male pays 30% of egg cost at fertilization
maleEnergyCost = eggCost * 0.30
male.energy -= maleEnergyCost

// Egg is laid at the female's position
// Offspring genome = crossover(mother, father) + mutation pass (see Section 3.5)

// Both organisms enter mating cooldown
mother.matingCooldown = 60 simulation-seconds
father.matingCooldown = 60 simulation-seconds
```

**Mate-finding**: Organisms locate potential mates using the `NearestMateAngle` and `NearestMateDist` input nodes (Tier 3). These detect the nearest opposite-sex same-species organism within view range. Typical brain wiring for mate-seeking:
```
NearestMateDist --[-3.0]--> Rotate         // Turn toward mate (closer = stronger signal)
NearestMateAngle --[+2.0]--> Rotate        // Steer toward mate direction
NearestMateDist --[-2.0]--> Accelerate     // Move toward mate
EggStored --[+3.0]--> Want2Mate            // Ready to mate when egg is ready (female)
Sex --[-5.0]--> Want2Mate [bias: +3.0]     // Males always want to mate (Sex=1 → inhibit less)
MatingCooldown --[-5.0]--> Want2Mate       // Don't mate during cooldown
```

**Mating cooldown**: After successful fertilization, both parents enter a 60 simulation-second cooldown period. The `MatingCooldown` input node reports the remaining fraction (1.0 immediately after mating → 0.0 when ready). During cooldown, `Want2Mate` has no effect even if above 0.5.

#### 3.3.3 Nest Sites (Emergent Mechanic)

Nest sites are NOT a discrete game entity — they emerge naturally from brain wiring and pheromone mechanics. When eggs incubate near same-species organisms that are actively emitting pheromone, the eggs receive hatching bonuses.

**Nest bonus formula**:
```
nearbyAllyEmitters = count of same-species organisms within 2x egg radius
                     that have any EmitPheromone output > 0.3
nestBonus = min(0.5, nearbyAllyEmitters * 0.1)
// 1 emitter = 10% bonus, 3 emitters = 30%, 5+ emitters = 50% (cap)

effectiveHatchTime = baseHatchTime * (1 - nestBonus * 0.4)    // Up to 20% faster hatching
startingEnergy = baseStartEnergy * (1 + nestBonus * 0.3)      // Up to 15% more starting energy
```

**Why this works**:
- Bonus requires **living same-species organisms actively tending** — not just pheromone residue. Organisms must be present AND emitting pheromone (output > 0.3).
- **Species-specific**: Only same-species organisms count. A predator emitting pheromone near another species' eggs provides no bonus.
- **Abandoned nests lose bonus**: If tending organisms leave or die, the bonus drops immediately (it's recalculated each tick based on nearby emitters, not accumulated).

**Nest establishment wiring** (how organisms create nests):
```
// Step 1: Organism finds food-rich area, stays there
NearestPlantDist --[-2.0]--> Accelerate    // Slow down near food

// Step 2: Emit pheromone while near eggs or when ready to lay
EggStored --[+2.0]--> EmitPheromone2       // Female emits green pheromone when egg is ready
NearbyEggCount --[+3.0]--> EmitPheromone2  // All organisms emit pheromone near eggs (tending)

// Step 3: Others follow pheromone gradient to nest location
Pheromone2Angle --[+2.0]--> Rotate         // Navigate toward green pheromone
Pheromone2Strength --[+1.0]--> Accelerate  // Move toward pheromone source
```

**Nest navigation**: Organisms return to nests by following their own species' pheromone gradient. The `PheromoneAngle → Rotate` wiring (already available) enables this. The reinforcement loop: organism finds good spot → emits pheromone → lays egg → others follow gradient → more emitters → stronger gradient → more organisms arrive.

**Nest defense wiring**:
```
NearbyEggCount --[+3.0]--> Want2Attack     // Attack intruders near eggs
NearbyEggCount --[-2.0]--> Accelerate      // Stay near eggs (reduce movement)
NearestOrganismColor --[±weight]--> Want2Attack  // Attack non-matching colors near nest
```

**Predator counterplay**: Pheromone is species-agnostic — predators CAN follow prey nest pheromone to find concentrated prey populations. This creates an arms race: stronger nests (more pheromone, more organisms) are more effective but more visible. Players choose pheromone channels strategically; predators evolve to follow popular channels.

**Noise discrimination wiring** (distinguishing own nest pheromone from enemy pheromone):
```
Pheromone1Strength --[+1.0]--> MULT
NearestAllyCount   --[+1.0]--> MULT    // Pheromone + allies present = likely own nest
MULT --[+3.0]--> Rotate                 // Only follow pheromone when allies confirm it
                                         // Pheromone + no allies = possible enemy trap
```

**Emergent nest behaviors**: Colonial nesting (multiple females laying at one site), nest relocation under predator pressure (abandon pheromone trail, establish new one elsewhere), decoy nests (emit pheromone at empty sites to draw predators away from real nest), seasonal nest migration (establish nests in biomes with current seasonal advantage).

### 3.4 Ageing, Species Entropy & Death

Two separate aging systems: **individual ageing** (each organism ages and dies) and **species entropy** (the longer a species has been deployed, the more expensive it becomes to maintain).

#### Individual Organism Ageing

Each organism ages independently based on simulation time alive.

**Ageing threshold**: `ageingThreshold = ageingSetting / metabolism`

After age exceeds the threshold, an ageing factor accumulates:
```
ageingFactor = max(0, age - ageingThreshold)
```

**Strength penalty** (exponential decay):
```
effectiveStrength = baseStrength * (1 - strengthPenalty)^ageingFactor
```

**Metabolism penalty** (linear increase):
```
effectiveMetabolism = baseMetabolism * (1 + ageingFactor * metabolismPenalty)
```

Combined effect: declining strength + increasing metabolism = guaranteed individual death. Old organisms can't gather enough food to sustain their increasing energy needs. This creates generational turnover.

#### Species Entropy (Escalating Cost Over Time)

Instead of a hard lifecycle cap, each species accumulates **entropy** — an escalating metabolism cost that increases the longer the species has been deployed. There is **no hard expiry**. A well-adapted species with good mutations can theoretically persist indefinitely, but the increasing cost eventually makes retirement and redesign the better strategic choice.

```
speciesAge = real-time hours since deployment
entropyMultiplier = 1.0 + (speciesAge / entropyHalfLife)²
// entropyHalfLife ≈ 72 hours (3 days)
// At deploy:   entropyMultiplier = 1.0  (no penalty)
// After 1 day: entropyMultiplier = 1.11 (11% higher metabolism for all organisms)
// After 3 days: entropyMultiplier = 2.0  (double metabolism — significant pressure)
// After 5 days: entropyMultiplier = 5.84 (very expensive — species struggling)
// After 7 days: entropyMultiplier = 10.4 (nearly unsustainable)
// After 10 days: entropyMultiplier = 20.4 (extreme — only the most efficient survive)
```

**How it works**: The entropyMultiplier is applied to the base metabolism cost for ALL organisms of that species:
```
effectiveMetabolismCost = baseMetabolismCost * metabolism * Size2D * entropyMultiplier
```

**Why this works better than a hard cap**:
- **Gradual pressure**: The species doesn't suddenly die — it becomes progressively harder to sustain. This gives the player time to observe the decline and decide when to redesign.
- **Skill-dependent longevity**: A brilliantly designed species with optimized brain wiring and good daily mutations can push past 7 days. This rewards mastery.
- **Natural ecosystem dynamics**: As entropy increases, the species shrinks naturally, opening ecological space for other species.
- **No "countdown clock" anxiety**: Players don't feel forced to redesign on a timer. They redesign when they see performance declining or when they have a new idea.

**Entropy is visible**: The species dashboard shows the current entropy multiplier, projected cost curve, and a suggestion like "Your species has been running for 4.2 days. Metabolism cost is 3.4x base. Consider redesigning to reset entropy."

`entropyHalfLife` is configurable per world by admins (stored in `worlds` table).
Range: 24h (aggressive turnover) to 168h (leisurely).
Default: 72h. No reset on daily mutation selection — purely time-based.

#### Death Conditions
- Health reaches 0 (from starvation, attack damage, ageing, or environmental damage)
- On death: body converts to meat pellets. `meatEnergy = bodyPointEnergy + remainingEnergy + fatEnergy * 0.765`

#### Early Retirement
Player can retire current design at any time. All organisms receive a `10x ageingFactor multiplier` → rapid decline over ~1 hour. Player can immediately start designing a new organism. Previous run's stats are preserved for analytics. Entropy resets to 1.0 for the new species.

### 3.5 Genetics & In-Simulation Evolution

Organisms evolve automatically through random mutation during reproduction. The player does NOT control this directly — it happens in the background as a natural process. The player's interaction point is the **daily mutation selection** (Section 3.6), which draws from this real mutation pool.

#### Gene List

Every organism carries a set of genes that influence its behavior and physiology. These are inherited from the parent with possible mutations:

**Body Genes** (affect physical stats):
- `SizeRatio`, `SpeedRatio`, `Strength`, `Defense`, `Diet`, `ViewAngle`, `ViewRadius`, `Metabolism`, `StomachMultiplier`
- `RedColor`, `GreenColor`, `BlueColor` (appearance)

**Reproduction Genes**:
- `LayTime` (how long to produce an egg)
- `BroodTime` (total parental investment period)
- `HatchTime` (incubation time after laying)
- `Sex` (0.0=female, 1.0=male — **immutable**, randomly assigned at birth 50/50. Only present in sexual species)

**Biology Genes**:
- `GrowthScale`, `GrowthMaturityFactor`, `GrowthMaturityExponent` (growth curve shape)
- `InternalClockPeriod` (Tic oscillation rate)
- `BaseImmuneActivation` (disease/venom resistance)
- `FatStorageThreshold`, `FatStorageDeadband` (fat deposit/withdrawal triggers)

**Social Genes** (only matter if Herd Coordination purchased):
- `HerdSeparationWeight`, `HerdAlignmentWeight`, `HerdCohesionWeight`, `HerdVelocityWeight`, `HerdSeparationDistance`

**Meta-Mutation Genes** (control how much offspring mutate):
- `GeneMutationChance` (average number of gene mutations per generation)
- `GeneMutationVariance` (magnitude of gene mutations)
- `BrainMutationChance` (average number of brain mutations per generation)

**Brain Genes** (synapse weights, node biases — each is independently mutable):
- Every synapse weight is a gene
- Every node bias is a gene

#### Mutation Mechanics (Per Reproduction Event)

When an organism reproduces, the offspring inherits all parent genes with random mutations:

**Step 1: How many mutations?**
```
numGeneMutations = Poisson(λ = parent.GeneMutationChance)
numBrainMutations = Poisson(λ = parent.BrainMutationChance)
// Default GeneMutationChance ≈ 2.0 → typically 1-3 gene mutations per offspring
// Default BrainMutationChance ≈ 1.5 → typically 0-3 brain mutations per offspring
```

**Step 2: Which genes mutate?**
For each mutation event, a random gene is selected (uniform probability across all genes of that type).

**Step 3: How much does it change?**
Relative mutation (preserves proportional scale):
```
u = Gaussian(mean=0, σ=1)
v = (1 + MutationVariance)^u
NewGeneValue = v * PreviousGeneValue
```

Plus a small absolute component (prevents genes from getting stuck at 0):
```
u_abs = Gaussian(mean=0, σ=0.01 + MutationVariance/20)
NewGeneValue = NewGeneValue + u_abs
```

**Default MutationVariance ≈ 0.15** means typical mutations shift a gene by ~5-20% of its current value. Occasionally larger jumps occur (tail of Gaussian).

**Step 4: Brain mutations**
Brain mutations can be:
- **Weight shift**: Random synapse's weight changes by the same relative+absolute formula
- **Bias shift**: Random node's bias changes
- **New synapse**: Small chance (~10% of brain mutations) to add a new random connection with a small weight
- **Remove synapse**: Small chance (~5% of brain mutations) to disable a random synapse

**Meta-mutation**: Because `GeneMutationChance` and `GeneMutationVariance` are themselves genes, they can mutate too. This means mutation rates themselves evolve — populations under selection pressure may evolve higher mutation rates to explore more solutions, while stable populations may evolve lower rates to preserve successful designs.

#### Sexual Crossover Algorithm (Sexual Reproduction Only)

When a sexual species reproduces, the offspring's genome is created by **crossover** of both parents' genes, followed by the standard mutation pass described above. Asexual species skip this section entirely.

**Step 1: Gene crossover**

For each gene in the genome (excluding `Sex` and brain genes):
```
roll = random(0, 1)
if roll < 0.40:
    offspringGene = mother.gene                    // 40% chance: take mother's value
elif roll < 0.80:
    offspringGene = father.gene                    // 40% chance: take father's value
else:
    blendWeight = random(0.3, 0.7)                 // 20% chance: blend
    offspringGene = mother.gene * blendWeight + father.gene * (1 - blendWeight)
```

The `Sex` gene is NOT crossed over — it is randomly assigned 50/50 at birth regardless of parents' sex genes.

**Step 2: Brain crossover**

The mother's brain topology serves as the structural base. Synapses are then merged:

```
// Start with mother's brain topology (nodes + connections)
offspringBrain = clone(mother.brain)

// For each synapse in mother's brain:
for synapse in mother.brain.synapses:
    if father has matching synapse (same source→destination):
        // Shared synapse: crossover weights using same 40/40/20 rule
        offspringSynapse.weight = crossoverGene(mother.weight, father.weight)
    else:
        // Mother-only synapse: keep 70%, drop 30%
        if random() < 0.30:
            offspringBrain.removeSynapse(synapse)

// For each synapse in father's brain NOT in mother's brain:
for synapse in father.brain.synapses - mother.brain.synapses:
    // Father-only synapse: add 30%, skip 70%
    if random() < 0.30:
        offspringBrain.addSynapse(synapse)

// Node biases: same 40/40/20 crossover for shared nodes
// Mother-only nodes: keep (part of base topology)
// Father-only nodes: add 30%, skip 70% (same as synapses)
```

**Step 3: Standard mutation pass**

After crossover, the standard Poisson/Gaussian mutation (Steps 1-4 above) is applied to the crossed-over genome. This means sexual offspring get genetic diversity from BOTH crossover AND mutation.

**Why crossover matters**: Crossover allows beneficial mutations from two independent lineages to combine in a single offspring. An asexual species must wait for the same organism to independently evolve both trait A and trait B. A sexual species can combine parent A's trait A with parent B's trait B in one generation. This accelerates adaptation but requires maintaining a viable mating population.

#### Mutation Pool Tracking

The server tracks ALL mutations that occur across the population in a rolling window:

```
mutationPool = {
  geneId: string,           // which gene mutated
  oldValue: number,
  newValue: number,
  parentId: string,         // which organism's offspring
  offspringId: string,
  offspringLifespan: number, // how long the offspring survived (updated on death)
  offspringReproduced: bool, // did the offspring reproduce?
  timestamp: number
}
```

This pool is the raw data from which daily mutation options are drawn (see Section 3.6).

#### What the Player Controls vs What Evolves

| Aspect | Set at Design Time | Evolves Automatically |
|--------|-------------------|----------------------|
| Brain wiring topology | Player designs it | New synapses can appear/disappear via brain mutations |
| Synapse weights | Player sets initial values | Drift via brain mutations each generation |
| Node biases | Player sets initial values | Drift via brain mutations each generation |
| Body stat sliders | Player sets initial values | Drift via gene mutations each generation |
| Diet gene | Player sets initial value | Drifts via mutation |
| Color genes | Player sets initial values | Drift (species color slowly shifts) |
| Reproduction timing | Inherited from archetype defaults | Evolves (LayTime, BroodTime, HatchTime) |
| Growth curve | Inherited from defaults | Evolves (GrowthScale, etc.) |
| Mutation rate itself | Inherited default | Evolves (meta-mutation) |
| Reproduction mode | Player chooses asexual/sexual | Fixed (does not evolve) |
| Sex | Randomly assigned at birth | Fixed (does not evolve) |

**Key insight**: The player designs the starting blueprint. Evolution refines (or breaks) it over hundreds of generations. The daily mutation selection (Section 3.6) is the player's way to steer this natural process. For sexual species, crossover between parents accelerates adaptation by combining beneficial mutations from independent lineages.

### 3.6 Daily Mutation Selection

Once per day (real-time, at a consistent time chosen by the player), the system presents **3 mutation options** drawn from the actual in-simulation mutation pool.

#### How Options Are Generated

**Step 1: Filter the mutation pool**
From the last 24 hours of tracked mutations, filter for "successful" mutations:
```
successfulMutations = mutationPool.filter(m =>
  m.offspringLifespan > medianLifespan * 0.8  // offspring survived reasonably long
  OR m.offspringReproduced == true              // offspring successfully reproduced
)
```

**Step 2: Rank by fitness impact**
Each successful mutation is scored:
```
fitnessScore = (offspringLifespan / medianLifespan)
             + (offspringReproduced ? 2.0 : 0)
             + (offspringDescendants * 0.5)  // if offspring had many children
```

**Step 3: Select 3 diverse options**
Pick the top mutation from 3 different categories to ensure variety:
1. **Best body gene mutation** (highest fitnessScore among SizeRatio, Speed, STR, DEF, etc.)
2. **Best brain mutation** (highest fitnessScore among synapse weight or bias changes)
3. **Most common successful mutation** (the gene+direction that appeared most frequently among successful offspring — indicating convergent evolution pressure)

If a category has no successful mutations, it falls back to the next-best from another category.

**Step 4: Present to player**
Each mutation card shows:
- **What changed**: "SpeedRatio: 1.2 → 1.35 (+12.5%)" or "NearestOrganismDist→Want2Flee synapse: 2.1 → 2.8 (+33%)"
- **Source**: "This mutation appeared in generation 47. The offspring survived 2.3x longer than average and produced 4 descendants."
- **Plain-English description**: "Your organisms will be faster but burn more energy"
- **Frequency**: "Similar mutations appeared 12 times in the last 24 hours, suggesting evolutionary pressure toward higher speed"

#### Player Choice
- Pick **0 or 1** mutation. Cannot pick multiple.
- **Applying a mutation**: The selected gene change is applied to the **species template**. ALL future offspring will use the new value as their base (before their own random mutations). Existing organisms are unaffected.
- **Skipping**: Picking 0 is valid — the natural evolution continues unguided.

#### Transparency
The mutation selection screen includes a "View Mutation Pool" button that shows:
- Total mutations in last 24 hours (e.g., "847 mutations across 312 births")
- Distribution: how many were beneficial vs neutral vs harmful (based on offspring survival)
- Gene heatmap: which genes are mutating most frequently
- Trend arrows: which stats are drifting up vs down across the population

This makes the evolutionary process visible and educational — players can see natural selection in action.

#### Daily Mutations & Sexual Species

For sexual species, the daily mutation selection works identically — it modifies the **species template**. When applied, the mutation updates the template genome. All future offspring inherit the template as their base before crossover and random mutation. Since sexual offspring are crossovers of two parents (who may have diverged from the template through accumulated mutations), the template change affects the "center of gravity" of the gene pool rather than directly setting every offspring's value. This means daily mutations take slightly longer to propagate through a sexual population compared to an asexual one.

### 3.7 Early Termination
Player can retire current design at any time. All organisms receive `10x ageingFactor multiplier` → rapid decline over ~1 hour. Player can immediately start designing a new organism. Previous run's stats are preserved for analytics.

---

## 4. Communication System

Three independent communication channels, all controlled through brain nodes.

### 4.1 Pheromone System (Chemical Signals)

Three channels: Red, Green, Blue. Each independently emitted and detected.

**Emission**: Output nodes `EmitPheromone1/2/3` (Tier 4). Intensity 0-1 determines emission strength.
**Detection**: Input nodes `Pheromone1/2/3Strength` and `Pheromone1/2/3Angle` (Tier 4).

**Diffusion model**:
```
// Pheromone is deposited on a 2D grid (same grid as spatial partitioning)
pheromoneGrid[cell] += emissionIntensity * metabolism * dt

// Each tick, pheromones diffuse and decay:
pheromoneGrid[cell] = pheromoneGrid[cell] * (1 - decayRate * dt)
                    + neighborAverage * diffusionRate * dt
```

- **Persistence**: ~30 simulation-seconds before fully dissipating
- **Range**: Diffuses across ~5-10 grid cells depending on emission intensity
- **Energy cost**: `0.1 * emissionIntensity * metabolism` per tick

**Emergent behaviors enabled**:
- **Trail marking**: Emit pheromone while moving → others follow the trail to food
- **Danger zones**: Emit red pheromone when attacked → allies avoid the area
- **Food beacons**: Emit green pheromone near abundant food → attract allies
- **Territory marking**: Constantly emit blue pheromone → establish claimed areas
- **Deceptive signaling**: Emit false food pheromones to lure prey
- **Autocrine signaling**: Detect your own pheromone as a self-feedback loop

### 4.2 Visual Signals

Organisms passively broadcast visual information through their appearance:
- **Color** (hue): Detectable via `NearestOrganismColor` (Tier 3). Enables species recognition and targeting/avoidance based on color.
- **Size**: Detectable via `NearestOrganismSize` (Tier 1). Enables fight-or-flight decisions.
- **Movement**: Detectable via position changes in the `NearestOrganismDist` over time (using Differential node). Enables predicting approach trajectories.

No active visual display output - you can't "change color" intentionally. Visual signaling is passive and honest (you can't fake being bigger than you are).

### 4.3 Acoustic Signals (Sound)

**Emission**: `EmitSound` output (Tier 4). Intensity 0-1.
**Detection**: `SoundDirection` and `SoundIntensity` inputs (Tier 4).

**Properties**:
- **Range**: `emissionIntensity * ViewRadius * 3` (much farther than vision)
- **Speed**: Instant within range (sound propagates in one tick)
- **Persistence**: None. Sound exists only during the tick it's emitted.
- **Energy cost**: `0.2 * intensity² * metabolism` per tick (quadratic - loud sounds are expensive)
- **Omnidirectional**: Sound broadcast reaches all organisms within range regardless of their facing

**Emergent behaviors**:
- **Alarm calls**: Emit sound when threat detected → allies within range flee (if wired to do so)
- **Pack rallying**: Emit sound to attract pack members for coordinated hunting
- **Echolocation feedback**: Emit sound, detect own echo (requires Echolocation trait)
- **Intimidation**: Loud sounds from large organisms could cause smaller organisms to flee (if they wire SoundIntensity → Want2Flee)
- **Counter-exploitation**: Predators could evolve to approach sounds (lured by alarm calls that indicate prey)

**Sound Frequency**: Each species has a base `SoundFrequency` value (0-1) set at design time.
This value is a gene and can mutate. The `EmitSound` output controls volume (intensity),
while `SoundFrequency` output controls the emitted frequency.

Receivers get three inputs:
- `SoundIntensity`: Loudest sound intensity within range
- `SoundDirection`: Direction to loudest sound source
- `SoundFrequency`: Frequency of the loudest sound (0-1)

Species can develop unique call frequencies. Organisms can wire SoundFrequency input to
differentiate ally calls (matching frequency) from predator sounds (different frequency).

### 4.4 Encounter-Based Info Sharing (Direct Contact)

A fourth communication channel that requires the **Encounter Info Sharing** trait (Tier 4, 8 BP). Unlike pheromones and sound which broadcast information at range, encounter sharing requires physical proximity — organisms must be within `1.5 × sum of radii` to read each other's state.

**Detection**: 7 input nodes (all Tier 4) expose the nearest encounter-range ally's internal state:

| Node | Range | What It Reveals | Emergent Use |
|------|-------|-----------------|-------------|
| `AllyEnergyRatio` | [0, 1] | Ally's energy level | Lead starving allies to food; share food by proximity |
| `AllyHealthRatio` | [0, 1] | Ally's health level | Shield injured allies; retreat with wounded |
| `AllyHeading` | [-1, 1] | Ally's facing direction relative to self | Detect fleeing ally (heading away = threat behind them) |
| `AllyLastFoodAngle` | [-1, 1] | Direction to ally's last meal (resets after 10s) | Scout-and-report: follow ally's food direction |
| `AllyLastThreatAngle` | [-1, 1] | Direction of ally's last damage (resets after 15s) | Cooperative defense: learn where threats are |
| `AllyWant2Mate` | [0, 1] | Ally's mating desire | Confirm mate receptivity before approaching |
| `AllyReproductiveState` | [-1, 1] | Ally's sex + egg/energy readiness | Know ally's sex and reproductive state |

**Properties**:
- **Range**: `1.5 × (selfRadius + allyRadius)` — approximately 2 units for default-sized organisms
- **Target**: Nearest same-species organism within range. One-way per tick — you read them.
- **Energy cost**: `0.05 * metabolism` per tick while any ally is in encounter range
- **Species-restricted**: Cannot read enemy organisms. Only same-species allies.

**vs. other communication channels**:

| Property | Pheromones | Sound | Visual | Encounters |
|----------|-----------|-------|--------|-----------|
| Range | ~50-100 units | ViewRadius × 3 | ViewRadius | ~2 units |
| Info density | 1 scalar/channel | 2 values | 3 values | 7 values |
| Persistence | ~30 seconds | Instant (1 tick) | Continuous | Instant |
| BP cost | 0 (free) | 0 (free) | 0 (free) | 8 BP |
| Species filter | None (all detect) | None | None | Same-species only |
| Active cost | 0.1/tick/channel | 0.2 × I²/tick | None | 0.05/tick |

**Emergent behaviors**:

**Scout-and-report**: A fast organism explores ahead, finds food, eats. When a slower ally approaches within encounter range, the ally reads `AllyLastFoodAngle` and navigates toward the food source. Brain wiring:
```
AllyLastFoodAngle --[+3.0]--> Rotate       // Turn toward ally's last food direction
AllyLastFoodAngle --[ABS]--> Accelerate    // Speed up when signal is non-zero (food exists)
```

**Sentinel behavior**: One organism stands guard near a nest. When it detects a threat (takes damage), its `AllyLastThreatAngle` broadcasts to all nearby allies. Relay chain: organism A detects threat → organism B reads A's threat angle → B adjusts behavior → organism C reads B's heading change → information cascades through the group.

**Injury-response convoy**: Organisms detect `AllyHealthRatio < 0.5` and move to shield the injured ally, positioning themselves between the ally and threats:
```
AllyHealthRatio --[-3.0]--> Accelerate [bias: +0.5]   // Move toward injured ally (closer = stronger signal)
AllyHeading --[+2.0]--> Rotate                         // Face same direction as ally
```

**Mate confirmation** (combines with Sexual Reproduction): Before committing energy to approach a potential mate, read `AllyWant2Mate` and `AllyReproductiveState` to confirm the ally is receptive and of the opposite sex:
```
AllyReproductiveState --[+3.0]--> MULT     // Positive = female with egg
AllyWant2Mate --[+2.0]--> MULT             // Receptive ally
MULT --[+4.0]--> Want2Mate                  // Only activate mating when both confirmed
```

---

## 5. Competition & Ecosystem System

### 5.1 Ecosystem Dominance Scoring

**Dominance Score** = weighted composite, updated every 5 minutes:

| Metric | Weight | Formula | Strategic Implication |
|--------|--------|---------|---------------------|
| **Biomass Share** | 35% | Σ(your organism energy) / Σ(all organism energy) | Favors large, well-fed populations |
| **Population Share** | 20% | your organism count / total count | Favors reproductive success |
| **Territory Coverage** | 20% | unique cells visited in last 2 hours / total cells | Favors dispersed, mobile populations |
| **Lineage Depth** | 15% | max generation reached | Favors evolutionary longevity |
| **Keystone Bonus** | 10% | Bonus for filling under-represented ecological niches | Favors ecosystem diversity (see 5.4) |

**Territory metric**: Unique spatial hash cells currently occupied by at least 1 organism
of the species / total cells. Recomputed every 15s alongside leaderboard refresh.
**Dominance weights**: Fixed constants (35% biomass, 20% population, 20% territory, 15% lineage, 10% keystone), not admin-configurable.

### 5.2 Diet System & Food Chain Balance

**Revised diet efficiency curves** (concave power curves ensuring all strategies are viable):

```
PlantEfficiency(diet) = 0.55 * (1 - diet)^0.7
MeatEfficiency(diet)  = 0.80 * diet^0.7
```

| Diet Gene | Plant Efficiency | Meat Efficiency | Strategy |
|-----------|-----------------|-----------------|----------|
| 0.0 | 55% | 0% | Pure herbivore: reliable, plant-dependent |
| 0.1 | 50% | 16% | Mostly herbivore with scavenging |
| 0.2 | 46% | 25% | Herbivore-leaning omnivore |
| 0.3 | 40% | 32% | Omnivore (plant-preferred) |
| 0.5 | 30% | 43% | True omnivore: moderate at both |
| 0.7 | 17% | 55% | Carnivore-leaning omnivore |
| 0.8 | 10% | 62% | Mostly carnivore |
| 1.0 | 0% | 80% | Pure carnivore: high reward per kill |

**Key properties**:
- **No negative efficiencies**: Eating the wrong food wastes time (0% gain, stomach still processes it) but doesn't DRAIN energy. More intuitive, less punitive.
- **Omnivore viable**: At diet=0.5, 30% plant + 43% meat. In mixed environments, total caloric throughput is competitive with specialists.
- **Meat peak (80%) exceeds plant peak (55%)**: Compensates for meat being rarer and requiring combat investment.
- **Concave curves** (exponent 0.7 < 1): The omnivore range (0.3-0.7) maintains meaningful efficiency on both foods.

**Why each strategy is viable**:
- **Herbivore (0.0-0.15)**: Most reliable energy source (plants always grow). Lowest risk. But: winter plant crashes (30% spawn rate) cause mass starvation. Vulnerable to population pressure from other herbivores.
- **Carnivore (0.85-1.0)**: Highest per-meal energy (80% of meat's 3.0 E/u² = 2.4 E/u² vs herbivore's 55% of plant's 1.0 E/u² = 0.55 E/u²). But: requires BP investment in STR/Speed for hunting. Prey population crashes cause famines. High risk, high reward.
- **Omnivore (0.3-0.7)**: Never the best at anything, but never foodless. Most resilient across seasonal shifts. The "safe middle" that adapts to whatever's available.
- **Scavenger (any diet with carnivore lean)**: Doesn't need STR/Speed investment. Eats meat from natural deaths. Works when there's enough death in the ecosystem (winter, high population).

### 5.3 Ecosystem Balance Mechanisms

**Preventing herbivore monoculture** (everyone goes herbivore because it's safest):
1. Density-dependent plant regrowth: `effectiveSpawnRate = base / (1 + herbivoreCount/50)`. 80 herbivores → 38% growth rate. Self-correcting.
2. Winter plant crashes: 30% plant availability forces herbivore population collapses
3. Keystone bonus: +25% scoring bonus for filling under-represented ecological roles. The 50th herbivore gets no bonus; the 1st predator gets +25%.
4. Grazing depletion: Overlapping foraging zones reduce local plant density, forcing dispersal and competition.

**Preventing carnivore dominance** (one predator eats everyone):
1. Lotka-Volterra dynamics: Successful predators destroy their own food supply. More kills → less prey → less food → predator starvation.
2. Energy pyramid tax: Only `40% of prey body energy becomes meat * 80% carnivore efficiency = 32%` of prey energy reaches predator. Ecosystems naturally support ~3-5x more prey than predators.
3. Prey counter-evolution: Surviving prey lineages evolve armor, speed, camouflage through natural mutation and daily mutation selections.
4. Multi-predator competition: If carnivore strategy is strong, more players build carnivores, fragmenting the limited prey population among more hunters.

**Preventing population explosions**:
1. Biomass conservation: Fixed total energy. More organisms = less available food per organism
2. Density-dependent reproduction: Crowded areas increase reproduction cost 2-3x
3. Ageing: Guaranteed mortality with exponential decline
4. Species entropy: Escalating metabolism cost for long-running species
5. Ecosystem pressure valve: Soft self-correcting system if total count exceeds ceiling (see Section 2.5)

**Preventing dominant strategy lock-in**:
1. Rock-Paper-Scissors dynamics: Armor beats attack, venom beats armor, speed beats venom, echolocation beats camouflage, herding beats solo predators, pack hunting beats herding.
2. Biome diversity: Forest favors camouflage, grassland favors speed/herding, desert favors fat/scavenging, wetland favors immunity/omnivory, rocky favors burrowing.
3. Seasonal rotation: No static build is optimal across all seasons.
4. Keystone scoring: Rewards filling empty niches, not copying the current leader.

### 5.4 Keystone Species Bonus

The ecosystem tracks the distribution of organism types across several axes:
- Diet type (herbivore / omnivore / carnivore)
- Size class (tiny / small / medium / large)
- Primary biome

If any category is under-represented (<10% of population), organisms in that category receive a scoring multiplier:
```
keystoneMultiplier = 1.0 + (0.25 * max(0, 1.0 - categoryShare / 0.10))
```
This caps at +25% for completely unique niches. It incentivizes diversity: being the only carnivore in a world of herbivores is rewarded.

### 5.5 Ecological Events (World Events)

Periodic events that prevent stasis. 1-2 events per week, announced 24 hours in advance.

| Event | Frequency | Duration | Effect |
|-------|-----------|----------|--------|
| **Bloom** | Monthly | 48 hours | Plant spawn rate 2x in one random biome. Herbivore bonanza |
| **Drought** | Seasonally (summer) | 72 hours | Desert expands, plant spawn 50% globally. Stress test |
| **Plague** | When one species >30% pop | 24 hours | Virus targets the dominant species (health DoT, spreads by proximity). Natural comeback mechanic |
| **Migration** | Bi-weekly | 24 hours | NPC organism herd passes through the world. Food for carnivores, competition for herbivores |
| **Fungi Outbreak** | Spring/Autumn | 96 hours | Large fungi patches spawn in wetland/forest. Environmental hazard and opportunity |
| **Meteor Impact** | Rare (1/season) | Instant | Random area cleared of organisms and pellets. Creates a barren zone that slowly refills. Reshuffles local ecology |

**Event Triggering**: Hybrid system — base random chance per season, modified by ecosystem conditions:
- Bloom: 80% Spring base, +20% if plant biomass < 30% capacity
- Drought: 60% Summer base, +20% if total biomass > 70%
- Plague: 30% Winter/Spring transition, +30% if avg organism density > 2× normal
- Migration: 50% any season (bi-weekly check)
- Fungi Outbreak: 70% Spring/Autumn, +20% if death count high in wetland/forest
- Meteor: 10% any season (1/season average)

**Warning**: 30-second toast notification before event onset ("A drought approaches...").
**Admin control**: Admins can trigger any event manually via dev tools.

### 5.6 Leaderboard

- **Main Board**: Dominance Score (real-time, rolling average over 6 hours)
- **Category Boards**: Highest population, deepest lineage, most territory, most kills, highest biomass
- **Seasonal Board**: Cumulative score across a full month-long season. Crown the "Seasonal Champion"
- **Hall of Fame**: Best all-time scores, best single-week runs
- **Species Directory**: All retired/extinct human-deployed species with full design details (including brain wiring), peak performance stats, and lifetime totals. See Section 7.6.

---

## 6. Environmental System

### 6.1 Fungi as Environmental Modifiers

Fungi are NOT player organisms. They spawn naturally and alter local conditions.

| Fungus | Spawn Trigger | Growth Rate | Max Size | Effect | Duration |
|--------|--------------|-------------|----------|--------|----------|
| **Decomposer** | 5+ deaths in area within 1 hour | Slow | 5×5 cells | Meat decay 3x faster, plant regrowth 2x in adjacent cells | Until meat supply exhausted |
| **Toxic Mold** | Wetland biome, spring/autumn | Medium | 3×3 cells | 0.5 HP/s damage to organisms in area. Creates no-go zones | 48 hours then decays |
| **Nutrient Network** | Forest biome, dense plant clusters | Slow | 8×8 cells (sparse network) | Redistributes plant energy: overfull cells donate to underfull cells within network. Creates "even spread" zones | Persistent until forest shrinks |
| **Parasitic Bloom** | High organism traffic (50+ transits/hour through cell) | Fast | 2×2 cells | 0.3 E/s drain on organisms passing through. Energy goes to biomass | 24 hours, respawns if traffic continues |
| **Bioluminescent** | Rocky/cave biome, winter | Slow | 1×1 cell | Emits false "food" signal detectable by vision inputs. Organisms with simple "approach food" brains are lured in. No actual food. Trap mechanic | Permanent until biome shifts |

**Fungi Nutrition**: Organisms can eat fungi patches. Fungi provide less nutrition than both
plants and meat — they are a supplementary food source, not a primary one.
- Fungi energy content: 60% of equivalent-sized plant pellet
- Digestion efficiency: Uses plant digestion pathway (diet-dependent, favors herbivores)
- Eating fungi counts toward the "Consume 500 fungi patches" unlock for Spore Dispersal

### 6.2 Day/Night Cycle

Cycles every 24 simulation-hours (= ~6 real-time hours for a full day/night).

- **Day** (4 real-hours): Normal vision, standard movement
- **Night** (2 real-hours): View radius reduced 40% for all organisms. Echolocation and sound detection unaffected. Creates window for nocturnal strategies. Organisms with echolocation have advantage.

**Visual**: Day/night is rendered as a viewport-wide overlay that transitions smoothly between full brightness (noon) and a deep blue-purple darkness (midnight) at ~55% opacity. The sinusoidal `ambientLight` value (computed server-side, broadcast in every tick's environment header) drives the overlay. Dawn and dusk create warm transitional tones. At night, organism eyes gain subtle glow effects and bioluminescent fungi become visually prominent. See [`front-end.md` §7.3](./components/front-end.md) for the full rendering spec.

**Gameplay Effects**:
- View radius reduction: `effectiveViewRadius = ViewRadius × (0.6 + 0.4 × ambientLight)`
  - Noon (ambientLight=1.0): full view radius
  - Midnight (ambientLight=0.0): 60% of view radius (-40%)
  - Transition: sinusoidal (gradual dawn/dusk)
- No metabolism effect (night is a visibility challenge, not an energy one)
- Echolocation is unaffected by light (echo range stays constant day/night)
- Bioluminescent fungi create safe-visibility zones at night

---

## 7. Spectating & Analytics System

### 7.1 World View (Unified Camera)

A single continuous canvas covers both world overview and organism-level detail. Zoom level drives level-of-detail rendering; follow mode is just auto-tracking on the same canvas.

#### Camera Behavior
- **One canvas**, one continuous zoom range (0.1x to 8x)
- **Free pan/zoom always available** — one-finger drag to pan, pinch to zoom
- **Follow mode**: Tap any organism → camera auto-tracks it, follow UI overlays appear. If currently at Dot tier, camera smooth-zooms in to Sprite tier.
- **Detach**: Drag/pan while following → camera detaches, follow overlays fade, organism still highlighted with a subtle pulse ring so you can find it again
- **Re-attach**: Tap same organism again (or tap "Return" button) → re-follows. Tap a different organism → follows that one instead.
- **Double-tap empty space** → finds and follows the nearest organism of your species. Camera zooms in to Sprite tier and locks on.
- **Heat map overlay toggles** (available at all zoom levels): Territory (where your organisms have been), Population density, Pheromone clouds, Fungi patches, Food density

#### LOD Tiers (based on viewport width in world units)

| Tier | Viewport Width | Organism Rendering | Pellets | Overlays |
|------|---------------|-------------------|---------|----------|
| **Dot** | > 50 units | Colored circle, 3-4px. Yours bright, others muted. | Not visible | Heat map overlays only |
| **Sprite** | 15–50 units | Full procedural organism (body, eyes, mouth, tails, shell). Idle animations. | Full pellet rendering | Vision cone, entity rings, echolocation ring, sound waves, perception mode |
| **Detail** | < 15 units | Full rendering + internal glow/pulse. Cilia/flagella animate. | Full + energy glow | All Sprite overlays + floating labels, X-ray |

#### Follow Mode

Follow mode is a camera state, not a separate screen. Tapping any organism enters follow mode; the camera auto-tracks that organism. This is the primary tool for understanding what your organisms are doing and why.

**Navigation** (available at Sprite tier and closer):
- Swipe left/right to cycle through your organisms
- Tap "Random" to follow a random organism of yours
- Tap an enemy organism to follow it instead (see its stats but not its brain)
- Prev/Next/Random/Detach buttons appear as navigation overlay

**Status Bar** (visible when following at Sprite tier or closer):
- Health bar, energy bar, fullness bar, age indicator, generation depth
- Current biome, season, entropy multiplier

**At Dot tier**, following just keeps the camera centered on the organism with a highlight ring — the full follow UI is hidden because you can't see the organism detail anyway.

#### Vision Visualization ("What It Sees")

Rendered at Sprite tier and closer when following an organism:
- The organism's **field of vision cone** is projected onto the world, shaded semi-transparently
- Entities **within the cone** are highlighted with colored rings:
  - Green rings: food pellets the organism can detect (plants or meat, depending on diet)
  - Red rings: organisms detected as threats (larger than self)
  - Yellow rings: organisms detected as prey (smaller than self)
  - Blue rings: same-species allies
  - Purple rings: potential mates (sexual species, opposite sex)
- Entities **outside the cone** are dimmed
- **Active input indicators** (Detail tier only): Small floating labels on highlighted entities showing which brain input they're feeding. E.g., a green-ringed plant shows "PlantDist: 0.4" next to it, so the player can see how the organism perceives it.
- **Pheromone overlay**: If pheromone inputs are active, pheromone clouds are rendered in the vision area with gradient arrows showing which direction the organism detects

#### Echolocation Visualization (Sprite tier and closer, when following an organism with Echolocation)

- A **ping ring** pulses outward from the organism at its echo frequency (duty cycle), expanding from the body to the echo radius and fading
- The echo zone is a **360° circle** (unlike the directional vision cone)
- Entities detected by echolocation but **outside the vision cone** are rendered as **grey silhouettes** — no color, no type distinction, because the organism only knows "something is there":
  - **High precision**: Silhouette matches the entity's actual size
  - **Low precision**: Generic dot/blip (no size info)
- Entities in **both** vision cone and echo range render normally (vision takes priority)
- The echo ring boundary is shown as a subtle dashed circle

#### Sound Visualization (Sprite tier and closer, when following)

- **Incoming sounds**: Directional wave arcs appear at the edge of the organism's perception, pointing toward sound sources. Arc size scales with intensity, color tints with frequency (low frequency = warm/red, high frequency = cool/blue). Only the loudest sound's direction indicator is prominent; others are faint.
- **Outgoing sounds**: If the followed organism is emitting sound (EmitSound output > 0.5), radiating ripple rings emanate from it, colored by emission frequency. Ripple radius reflects the sound's effective range.
- **Other emitters**: Visible organisms that are emitting sound show subtle ripple rings (smaller, less prominent than the followed organism's).

#### Perception Mode (toggle, Sprite tier and closer when following)

A toggle button alongside X-Ray. Switches from the default **omniscient spectator** view to a **subjective organism's-eye** view. When active, the world renders as the organism perceives it:

- **Fog of war**: Areas outside ALL of the organism's sensory ranges are **darkened** with a semi-transparent fog overlay. Only the regions covered by vision cone, echolocation radius, or encounter range are illuminated.
- **Vision cone zone**: Entities render with full color and detail (the organism "knows" what it sees). Colored entity rings shown as normal.
- **Echolocation zone** (outside vision): Entities appear as grey silhouettes at detected positions (see Echolocation Visualization above). The world terrain is faintly visible (echo "paints" the environment) but organisms have no color identity.
- **Sound**: Directional wave arcs pulse from the fog boundary, indicating the direction of detected sounds. The organism can't see the source — just sense the direction.
- **Pheromone gradients**: More prominent in perception mode. Colored clouds with gradient arrows are the primary navigation cues through fogged areas.
- **Day/night effect**: At night, the vision cone shrinks 40% — in perception mode you literally watch the organism's illuminated world contract at dusk and expand at dawn. Echolocation zone is unaffected.
- **Burrowed state**: Screen goes nearly black. Only echolocation blips visible (if equipped). All other senses return 0 — the fog is total.
- **Camouflaged entities**: In vision cone, shown with reduced opacity proportional to their camouflage effectiveness. Highly camouflaged + slow entities may be nearly invisible even within the cone.
- **Forest biome**: Vision cone shrinks to 0.7× — visible as the fog closing in tighter around the organism.

When Perception Mode is **OFF** (default): Everything is visible. Vision cone is an informational overlay, entities outside the cone are dimmed but still rendered. Echolocation and sound indicators are still shown as additive overlays, but no fog hides the world.

#### X-Ray Overlay (Detail tier only, own species only)
Tapping a followed organism of **your own species** at Detail tier toggles an X-ray mode where the body becomes semi-transparent, revealing internal systems rendered directly on the creature. X-Ray is **not available** when following enemy organisms — their internals remain hidden, preserving strategic mystery.

- **Stomach**: Visible as a chamber inside the body. Contents colored by material type (green = plant, red = meat). Fill level corresponds to fullness. Acid level shown as a yellow-tinted overlay — more acid = more yellow. Contents visibly shrink as digestion extracts energy (animated particles flowing from stomach to body).
- **Brain**: The neural ganglion glows with activity (cyan-blue as per visual design). Active synapses pulse with flowing particles along connection lines. Brighter pulses = stronger signal. Node activation shown as glow intensity.
- **Egg organ**: Visible as a growing translucent orb. Size and opacity indicate `EggStored` progress (0% = barely visible, 100% = full glowing orb ready to lay). For sexual species, shows a mating-ready indicator when egg is complete.
- **Fat reserves** (if Fat Reserves trait): Visible as a yellowish layer that grows/shrinks with fat fill level.
- **Venom glands** (if Venom trait): Glow green when venom is being produced.

#### Detail Bottom Sheet (swipe up, available at Sprite tier or closer when following)
A swipe-up panel with four tabs providing detailed numerical data:

**[Brain] tab**: Live version of the brain node graph (read-only). All input values shown as color-intensity bars on the left. Hidden nodes show current activation values. Output values shown on the right with threshold indicators (green glow when > 0.5 for threshold behaviors). Synapses animate with pulse particles proportional to signal magnitude. Color: green = positive signal, red = negative signal.

**[Body] tab**: Vital statistics in real-time:
- HP / max HP, energy / max energy, current speed / max speed
- Effective metabolism (base × entropy × ageing factors)
- Age, ageing factor, entropy multiplier
- Current biome, active traits
- Size, strength, defense (with ageing penalties shown)
- What the organism currently detects: list of nearest plant, meat, organism, ally, mate, egg with distances

**[Stomach] tab**: Animated stomach visualization:
- Stomach capacity bar (current fill / max)
- Contents breakdown: plant u² and meat u² (stacked bar, colored)
- Acid level gauge (0-100%)
- Digestion rate: u²/s being processed
- Energy extraction rate: E/s being gained
- Efficiency display: current plant efficiency % and meat efficiency % (based on diet gene + acid level)
- `StomachPlantRatio` value (what the brain sees)

**[Eggs] tab**: Reproduction status:
- Egg progress bar (storedEnergy / requiredEnergy)
- Egg energy cost breakdown (growth + traits + brain + base)
- Time estimate to completion at current investment rate
- For sexual species: sex indicator, mating cooldown timer, nearest mate distance
- Nearby eggs: count and nest bonus status (shows bonus % and number of tending organisms)
- Recent reproduction events (last 3 eggs laid, their hatch status)

### 7.2 Event Timeline (Log)
Scrollable chronological feed. Each event has: timestamp, icon, description, tap-to-locate.

Event categories:
- **Population**: births, deaths (with cause), generation milestones
- **Combat**: attacks dealt/received, kills, organism-on-organism encounters
- **Environment**: season changes, biome shifts, fungi spawns, world events
- **Evolution**: daily mutations applied, significant trait drift in population
- **Achievement**: unlocks, milestones, leaderboard position changes
- **While You Were Away**: Summary card shown on login with key stats since last visit

### 7.3 Statistics Dashboard

**Population Tab**:
- Live organism count (line graph over time)
- Birth/death rate (dual line graph)
- Generation histogram (how many organisms at each generation depth)
- Population by biome (stacked area chart)

**Ecosystem Tab**:
- Your biomass share vs world average (line graph)
- Dominance score over time (line graph)
- Diet distribution in the world (pie chart: herbivore / omnivore / carnivore populations)
- Top 5 species by population (bar chart)

**Organism Performance Tab**:
- Average lifespan of your organisms (with cause-of-death breakdown)
- Energy efficiency: energy consumed vs energy spent (ratio over time)
- Reproduction success rate: eggs laid vs surviving offspring
- Most common brain pathways (which input→output connections are most active)

**Brain Analysis Tab**:
- Brain activity heatmap: which nodes fire most frequently, which synapses carry most signal
- Behavior distribution: % of time spent eating, moving, fleeing, attacking, idle
- Decision analysis: when organisms encounter food, what % eat vs ignore? When they encounter threats, what % flee vs attack?

### 7.4 Species Naming & Identity
- Name your species at design time (e.g., "Thornback Grazers")
- Name appears: on leaderboard, in other players' event logs, on world map tooltips, in the Species Directory
- Short description field (optional, 100 chars): "Armored herbivores that travel in herds"
- Species icon: auto-generated from the organism's vector art appearance (mini portrait)

### 7.5 Species History (All-Time Archive)

Every human-deployed species in the world is permanently recorded in the species history (AI placeholder species are excluded). This covers **all players' species**, not just your own — providing a competitive archive and letting players study what worked for others.

**Species Directory** shows all past human-deployed species from all players in the current world.

**Each historical species entry shows**:
- **Species name**, designer name, and auto-generated icon (preserved from design time)
- **Design snapshot**: Full design details are visible for all species, including body stats, trait loadout, BP allocation, reproduction mode, and **brain wiring** (node graph, synapse connections, and weights).
- **Lifetime**: Deployed date → retired/extinct date, total real-time duration
- **Peak performance stats**:
  - Peak population (highest simultaneous organism count)
  - Peak dominance score (highest score achieved)
  - Deepest generation reached
  - Max territory coverage (% of world cells visited)
  - Peak biomass share
- **Lifetime totals**:
  - Total organisms born, total deaths
  - Total kills dealt, total kills received
  - Total energy consumed, total food eaten
  - Number of daily mutations applied
- **Cause of end**: Retired by player / natural extinction
  - If extinct: cause-of-death breakdown (% starvation, % predation, % ageing, % venom, % environmental)
- **Tap to expand**: Full statistics page with time-series graphs of population, dominance score, and generation depth over the species' lifetime

**Filtering and sorting**: The history tab supports filtering by designer (your species / all players), sort by peak population / peak score / duration / recency, and search by species name.

**Strategic value**: Players can study the ecosystem's history. "PlayerA's carnivore hit #1 for 3 days before a herbivore swarm countered it." "My Tank species peaked at 80 organisms but only lasted 2 days. My Scout peaked at 40 but ran for 6 days." This historical data helps inform future designs and creates a shared narrative of the world's evolutionary history.

### 7.6 Species Farewell Card (Shareable)

When a species goes extinct or is retired, the game generates a **Species Farewell Card** — a shareable image summarizing that species' life and accomplishments. The card is designed for sharing on WhatsApp, iMessage, social media, etc.

#### Card Content

The farewell card is a vertical image (~1080x1920 pixels, story format) containing:

1. **Header**: Game logo (small) + "In Memoriam" / "Retired" banner
2. **Organism portrait**: Large rendering of the organism at its peak appearance (full body, facing right, on a biome-colored background matching its home biome). Uses the same procedural renderer as the game, captured as a static snapshot.
3. **Species identity**: Species name (large), designer name (smaller), and archetype label (e.g., "Carnivore / Tank")
4. **Lifetime bar**: Visual timeline showing deployed date → extinct/retired date, total duration
5. **Key stats** (4-6 numbers in a clean grid):
   - Peak population
   - Deepest generation
   - Peak dominance rank (e.g., "#2")
   - Total organisms born
   - Total kills dealt (if > 0)
   - Duration alive
6. **Mini-achievements** (1-3 notable traits, see below): Each shows an icon + short label + description
7. **Cause of end**: "Went extinct" with top cause (e.g., "Starved out — 62% died of hunger") or "Retired by designer"
8. **Footer**: Game name + world name + date

#### Mini-Achievements

Mini-achievements are automatically detected notable traits about the species' run. They highlight what made this species unique and interesting. The system scans species stats and selects the top 1-3 that apply (highest-priority first):

| Mini-Achievement | Condition | Display Text |
|-----------------|-----------|--------------|
| **Apex Predator** | Held #1 leaderboard for 1+ hours | "Ruled the leaderboard for {X}h" |
| **Dynasty** | Reached generation 100+ | "Lineage survived {X} generations" |
| **Swarm Lord** | Peak population 100+ | "Peaked at {X} organisms" |
| **Survivor** | Lasted 7+ real-time days | "Endured for {X} days" |
| **Serial Killer** | 500+ total kills | "Took down {X} prey" |
| **Pacifist** | 0 kills, lasted 24h+ | "Never harmed another organism" |
| **Underdog** | Started with 1 founder, peaked at 50+ pop | "From 1 founder to a population of {X}" |
| **Colonizer** | Max territory coverage 40%+ | "Spread across {X}% of the world" |
| **Flash in the Pan** | Peaked at 50+ pop but lasted under 12h | "Burned bright but brief" |
| **Winter Survivor** | Survived 3+ winter seasons | "Weathered {X} winters" |
| **Genetic Pioneer** | Sexual reproduction + gen 50+ | "Evolved through {X} generations of crossover" |
| **Social Species** | Used encounter sharing + 20+ avg pop | "Thrived through cooperation" |
| **Nest Builder** | Had active nests with 30%+ bonus | "Built thriving nurseries" |
| **Biome Specialist** | 80%+ organisms stayed in one biome | "Mastered the {biome}" |
| **Nomad** | Organisms spread across 4+ biomes | "Roamed every corner of the world" |

Selection priority: rarer/more impressive achievements rank higher. If many apply, show the top 3 most impressive.

#### Sharing Mechanics

- **Trigger**: When species goes extinct, the notification includes a **[Share]** button alongside the "Design a new species" prompt. The card is also accessible from the Species History detail view (persistent **[Share]** button on every historical entry).
- **Generation**: The card is rendered client-side on a hidden canvas using the existing `OrganismRenderer` for the organism portrait, plus standard canvas text/shape drawing for stats and layout. Exported as PNG.
- **Share flow**:
  1. Tap **[Share]** → card preview appears (full-screen modal)
  2. Tap **[Share to...]** → uses Web Share API (`navigator.share({ files: [pngBlob] })`) for native OS share sheet (WhatsApp, iMessage, Instagram Stories, etc.)
  3. Tap **[Save Image]** → downloads PNG to device
  4. Tap **[Copy Link]** → copies a public share URL (see below)
- **Link sharing**: For platforms that don't support file sharing, the card PNG is uploaded to Supabase Storage (`share-cards` bucket, public). A share URL (`/share/{speciesId}`) loads a lightweight page with Open Graph meta tags (`og:image`, `og:title`, `og:description`) so the card displays as a rich preview when pasted into WhatsApp, Twitter, Discord, etc.
- **Privacy**: Only public stats are included on the card (no brain wiring details). Other players can view the card but cannot reverse-engineer the species' brain design from it.

---

## 8. Progression System

All content unlockable through play. Progression expands the design space without increasing power (same 100 BP budget).

### 8.1 Evolution Points (EP)

Earned passively from organism performance:
- Surviving organisms: 1 EP per hour of total organism-time
- Population milestones: 10/25/50 organisms alive → 5/15/30 EP bonus
- Generation depth: 5/10/20/50 generations → 10/25/50/100 EP bonus
- First-time achievements: variable EP (see 8.3)

### 8.2 Unlock Tracks

| Tier | EP Cost | Brain Unlocks | Body Unlocks |
|------|---------|--------------|-------------|
| **1** | Free | 11 inputs, 5 outputs, 4 hidden types | 9 core stat sliders |
| **2** | 50 EP | +8 inputs, +4 outputs, +2 hidden types (Latch, Multiply) | Armor Plating, Venom Glands, Echolocation |
| **3** | 200 EP | +15 inputs, +5 outputs, +3 hidden types (Gaussian, Differential, Absolute) | Burrowing, Camouflage, Fat Reserves, Spore Dispersal, Herd Coordination, Sexual Reproduction |
| **4** | 500 EP | +16 inputs, +4 outputs, +3 hidden types (Sine, Integrator, Inhibitory) | Encounter Info Sharing (+ future: Swimming, Flight, Symbiosis) |

Total EP to unlock everything: 750 EP. At ~10 EP/day for an active player, full unlock in ~2.5 months. This paces discovery without being grindy.

### 8.3 Achievements

| Achievement | Condition | Reward |
|-------------|-----------|--------|
| First Steps | Deploy first organism | 10 EP + Herbivore template |
| Survivor | Any organism survives 24 hours | 10 EP + Scavenger template |
| First Blood | Kill another player's organism | 15 EP + Hunter template |
| Generational | Reach generation 10 | 20 EP |
| The Long Game | Reach generation 50 | 50 EP |
| Pack Leader | Have 30+ organisms alive simultaneously | 20 EP + Omnivore template |
| Diverse | Have organisms in 3+ biomes simultaneously | 25 EP |
| Winter is Coming | Survive a full Winter season | 30 EP |
| Apex Predator | Be #1 on leaderboard for 1 hour | 50 EP |
| Ecosystem Engineer | Reach #1 with a non-default brain (>15 synapses) | 50 EP |
| Comeback | Go from <5 organisms to >25 without redesigning | 30 EP |
| Silent Hunter | Kill 10 organisms with camouflage active | 25 EP |
| Spore Cloud | Have offspring in 4+ biomes via spore dispersal | 25 EP |
| Alarm System | Have 10+ organisms using pheromones simultaneously | 20 EP |
| It Takes Two | Reach generation 30 with 15+ simultaneous organisms (unlocks Sexual Reproduction) | 30 EP |
| Social Network | Have 20+ organisms using pheromones simultaneously (unlocks Encounter Info Sharing) | 25 EP |
| Nest Builder | Have 5+ eggs incubating with nest bonus > 30% simultaneously | 20 EP |
| Power Couple | Have a sexual species where a single pair's offspring reaches generation 10 | 35 EP |

### 8.4 Unlock Education

Each tier transition triggers a one-time `UnlockEducationModal` — a celebratory full-screen modal introducing all newly unlocked capabilities with suggested first experiments and annotated wiring diagrams.

- **Tier 2 (50 EP)**: Introduces Latch, Multiply, Armor Plating, Venom Glands, Echolocation, Want2Grow, Digestion, Grab, Want2Heal. Suggested experiment: `EnergyRatio → Want2Grow` + `AttackedDamage → Want2Heal`.
- **Tier 3 (200 EP)**: Introduces Gaussian, Differential, Absolute, Want2Reproduce, Herding, Burrow, Want2Mate, StoreFat, Burrowing, Camouflage, Fat Reserves, Spore Dispersal, Herd Coordination, Sexual Reproduction. Suggested experiment: `EggStored → Want2Reproduce` with seasonal suppression.
- **Tier 4 (500 EP)**: Introduces Sine, Integrator, Inhibitory, Pheromones (3 channels), Sound, Encounter Info Sharing. Suggested experiment: alarm pheromone circuit (`EnergyRatio → EmitPheromone1`, receivers follow gradient).

See [`design/onboarding.md` §5](onboarding.md) for complete modal content, wiring diagrams, and UI specification.

---

## 9. Stomach & Digestion System (Deep Mechanics)

### 9.1 Stomach Capacity
```
stomachCapacity = (Size2D / 2) * StomachMultiplier
// where Size2D = π * (Size1D)² and Size1D = sizeRatio * sqrt(maturity) * baseSize
```
A default organism (size 1.0, maturity 1.0) has ~21 u² stomach capacity.

### 9.2 Eating
When `Want2Eat > 0.5` and organism is touching a pellet:
- If pellet fits in remaining stomach space: swallow whole
- If pellet is too big for stomach: bite off a chunk sized to fill stomach
- If pellet hardness > organism STR * 3: cannot bite (too hard)
- Swallowed material enters stomach, adding to fullness

### 9.3 Digestion
Each tick, the stomach processes its contents:

**Step 1: Digestion Potential**
```
if acidLevel <= fullness:
    digestionPotential = Size2D * metabolism * acidLevel / fullness
else:
    digestionPotential = Size2D * metabolism * (1.0 + (acidLevel - fullness) * 0.1)
    // Soft cap: over-digesting gives diminishing returns
```

**Step 2: Split potential across materials**
If stomach contains 10u² plant and 5u² meat:
- Plant gets 2/3 of potential
- Meat gets 1/3 of potential

**Step 3: Digestion rate per material**
```
digestionRate_m = digestionPotential_m * reactivity_m
```
Plant reactivity = 1.0, Meat reactivity = 2.0. So meat digests 2x faster per unit of potential.

**Step 4: Efficiency and energy extraction**
```
efficiency_m = maxEfficiency_m * diet_affinity_m
// Using our concave curves:
plantAffinity = (1 - dietGene)^0.7
meatAffinity = dietGene^0.7
plantEfficiency = 0.55 * plantAffinity
meatEfficiency = 0.80 * meatAffinity
```

If acidLevel > fullness (over-digesting), apply efficiency malus:
```
efficiencyMalus = (acidLevel - fullness) / 2
effectiveEfficiency = efficiency * (1 - efficiencyMalus)
```

**Step 5: Energy gain**
```
energyGain_m = digestionRate_m * energyDensity_m * effectiveEfficiency_m * dt
```

### 9.4 Brain-Digestion Interaction

The `Digestion` output node controls acid level. This creates a rich optimization problem:

- **Hungry with full stomach**: Crank acid to max → fast digestion, some efficiency loss → net positive (getting energy fast when you need it)
- **Full stomach, energy reserves high**: Low acid → slow but efficient digestion → maximize total energy extraction
- **Nearly empty stomach**: Turn acid very low → avoid over-digesting penalty → wait for more food
- **Optimal play**: Wire `Fullness → Digestion` with appropriate weight so acid scales with stomach contents

Default (no wiring): Sigmoid default = 50% acid always. Functional but suboptimal. Players who wire digestion control gain ~15-20% more energy from the same food. This is the kind of "deep but clean" system that rewards understanding without being necessary.

---

## 10. Combat System (Deep Mechanics)

### 10.1 Attack Resolution
When `Want2Attack > 0.5` and organism is adjacent to target:

```
attackForce = Want2Attack_output * STR * Size1D * ageStrengthFactor

// Check if attack can penetrate defense
if attackForce > target.DEF * defensePenetrationThreshold:
    baseDamage = attackForce - target.DEF
    // Diminishing defense returns:
    damageReduction = 1 - 1/(1 + target.DEF/10)
    // Apply reduction
    finalDamage = baseDamage * (1 - damageReduction) * biteDamageSetting
else:
    finalDamage = 0  // Can't penetrate defense
```

If venom glands active:
```
venomDPS = baseVenomDamage * (attackerSize / victimSize)
venomDuration = baseVenomDuration * (1 - target.immuneSystem * 0.5)
// Apply venom DoT to target (doesn't stack, refreshes)
```

### 10.2 Meat from Combat
If `Want2Eat > 0.5` during attack:
- Damage dealt converts to meat equivalent
- Meat pellet placed directly in attacker's stomach (if space available)
- If stomach full, excess meat drops at attack site

If `Want2Eat <= 0.5`:
- Meat pellet spawns at the attack location
- Other organisms (scavengers) can eat it

### 10.3 Knockback
```
knockbackForce = finalDamage * knockbackMultiplier / target.mass
// Target is pushed away from attacker
target.velocity += knockbackDirection * knockbackForce
```

### 10.4 Combat Energy Costs
Attacking costs energy:
```
attackEnergyCost = baseAttackCost * STR * Size1D * Want2Attack_output * metabolism
```
Missing (target dodges or is out of range) still costs energy. This prevents "always attack" brains from being viable - there's a real cost to combat.

### 10.5 Emergent Combat Strategies (Brain Wiring Examples)

**Ambush Predator** (Latch + Camouflage):
```
NearestOrganismDist --[-5.0]--> Latch [bias: +0.8]    // Set latch when prey very close
Latch --[+5.0]--> Want2Attack                            // Attack once triggered
Latch --[+3.0]--> Accelerate                             // Burst forward
NearestOrganismAngle --[+3.0]--> Rotate                  // Steer toward prey
EnergyRatio --[-1.0]--> Latch                            // Reset latch when energy low (give up)
```
Behavior: Stays still (camouflage effective). When prey enters close range, Latch flips to 1 → burst attack. Continues chasing until energy depletes or kill succeeds.

**Kiter** (Differential node):
```
HealthRatio --[+1.0]--> DIF                              // Detect health changes
DIF --[-5.0]--> Want2Flee                                 // Flee when taking damage (health dropping)
DIF --[+0.0]--> Wait                                     // (implicit: stop fleeing when health stable)
NearestOrganismDist --[-3.0]--> Want2Attack              // Attack when close
NearestOrganismAngle --[+2.0]--> Rotate                  // Steer toward target
```
Behavior: Approaches and attacks. When hit (health drops, DIF goes negative), switches to flee. When health stabilizes, resumes approach. Hit-and-run pattern.

**Pack Hunter** (Pheromone + Herding):
```
NearestOrganismDist --[-2.0]--> EmitPheromone1           // Emit red pheromone near prey
Pheromone1Angle --[+3.0]--> Rotate                       // Navigate toward red pheromone
Pheromone1Strength --[+2.0]--> Accelerate                // Speed up toward strong pheromone
Constant --[+1.0]--> Herding                             // Always flock
NearestOrganismDist --[-4.0]--> Want2Attack              // Attack when close
```
Behavior: When one organism spots prey, it emits red pheromone. Nearby allies detect the pheromone and converge. Multiple organisms attack simultaneously.

---

## 11. Summary: Interactive vs Background Systems

### Player-Interactive Systems (the "game")
| System | When | Session Length | Depth Source |
|--------|------|---------------|--------------|
| **Brain Wiring** | Design phase | 10-30 min | Emergent behaviors from simple connections. Huge design space (51+ node types, unlimited wiring) |
| **Body Design** | Design phase | 5-15 min | 100 BP tradeoffs force strategy. 9+ core traits, 10+ unlockable traits |
| **Daily Mutation Selection** | Once/day | 2-5 min | Choose from real mutations that occurred in your population. View mutation pool transparency |
| **Spectating** | Any time | 1-30 min | Watch organisms with X-ray internals, vision visualization, real-time brain/stomach/egg detail. Species history archive |
| **Species Farewell Card** | On extinction/retire | 1-2 min | Shareable image with organism portrait, key stats, mini-achievements. Social sharing via WhatsApp, etc. |
| **Species Naming** | Design phase | 1 min | Creative expression, community identity |

### Background Simulation Systems (the "simulation")
| System | Emergent Property | Balance Mechanism |
|--------|-------------------|-------------------|
| **Energy Cycle** | Carrying capacity, boom-bust | Closed system, density-dependent regrowth |
| **Digestion** | Diet specialization depth | Acid/fullness tradeoff, material efficiency |
| **Reproduction** | Population dynamics, sexual selection | Energy cost, maturity requirement, density cost, mate-finding overhead |
| **Genetics & Evolution** | Natural selection, micro-evolution, crossover | Poisson mutation count, Gaussian magnitude, meta-mutation, crossover blending |
| **AI Ecosystem** | Maintains ~30 species diversity | Curated library, competence-capped, 48h cycling |
| **Ageing** | Generational turnover | Exponential strength decay + metabolism increase |
| **Seasons/Biomes** | Forces adaptation | Rotating conditions, no static optimum |
| **Fungi** | Dynamic environmental hazards | Self-spawning based on ecosystem conditions |
| **Pheromones** | Emergent social behavior, nest sites | Energy cost, diffusion decay |
| **Encounter Sharing** | Cooperative intelligence, scout-report | 8 BP cost, close range, same-species only |
| **Nest Sites** | Colonial breeding, egg protection | Predator visibility, requires active tending |
| **Combat** | Food chains, predator-prey | STR vs DEF, energy costs, knockback |
| **Ecosystem Scoring** | Multi-axis competition | Keystone bonus, weighted composite |

### Core Design Principle
The player designs the **blueprint** (brain + body). The **simulation** runs that blueprint against reality. The **gap between intention and outcome** is where the game lives. A brain that looks perfect on the canvas may fail against the unpredictable ecosystem. That's the fun - and the reason to iterate, observe, and redesign.

---

## 11.5 Emergent Drives: Emotional Behaviors from Existing Nodes

The brain system does not have explicit "emotion" or "drive" nodes. However, by combining existing input nodes with processing nodes (particularly Integrator, Inhibitory, Differential, and Multiply), players can create circuits that are **functionally equivalent** to fear, curiosity, fatigue, and other drive states. This section documents four example wirings to illustrate the design space. **No new mechanics are required** — these emerge entirely from existing systems.

### Fear (Integrator Accumulation)

**Concept**: Threat builds up over time and lingers after the threat leaves. The organism becomes increasingly cautious when predators are nearby and remains fearful for a period after the danger passes.

**BP Cost**: ~7.5 BP (1 Integrator node + 1 Sigmoid node + 3 synapses = 2 + 2 + 1.5)

```
NearestOrganismSize --[+3.0]--> SIG [bias: -1.0]    // Fires when nearby organism is large (threat)
SIG --[+2.0]--> INTEG [bias: -0.1]                   // Accumulate fear. Slow constant decay (bias -0.1)
                                                       // drains fear when no threat present.
INTEG --[+4.0]--> Want2Flee                           // High fear → flee
INTEG --[-2.0]--> Want2Attack                         // High fear → suppress aggression
INTEG --[+1.0]--> EmitSound                           // High fear → alarm call
```

**Behavior**: When a large organism is nearby, fear accumulates in the Integrator. The Sigmoid acts as a threat filter — only organisms significantly larger than self trigger fear buildup. The Integrator's negative bias (-0.1) provides slow natural decay: fear lingers for ~10-15 seconds after the threat leaves, then gradually fades. During high fear, the organism flees and suppresses attack impulses. If wired to EmitSound, it also alerts nearby allies.

**Why this is "fear" and not just "flee from big things"**: The key difference is **temporal persistence**. A simple `NearestOrganismSize → Want2Flee` wiring makes the organism flee only while the threat is visible. The Integrator adds memory — fear builds up over repeated exposures and persists after the stimulus is gone. An organism that has been chased by multiple predators will have higher accumulated fear than one that saw a predator briefly.

### Curiosity (Inhibitory Habituation)

**Concept**: Novelty drives exploration. When an organism encounters something new, it approaches. As the stimulus becomes familiar (repeated exposure), interest fades. A Sine node adds an exploration spiral to prevent getting stuck.

**BP Cost**: ~10 BP (1 Inhibitory node + 1 Sine node + 1 Linear node + 4 synapses = 2 + 2 + 2 + 2)

```
NearestPlantDist --[+2.0]--> INHIB                   // Plants at medium distance trigger curiosity
INHIB --[+3.0]--> Rotate                              // Turn toward novel stimuli
INHIB --[+2.0]--> Accelerate                          // Approach novel stimuli

Tic --[+1.0]--> SINE                                  // Clock drives sine wave
SINE --[+0.5]--> Rotate                               // Gentle exploration spiral when not curious
SINE --[+0.3]--> Accelerate                           // Keep moving during exploration
```

**Behavior**: The Inhibitory node habituates to repeated stimuli — when `NearestPlantDist` holds a steady value (organism is following the same food source), the Inhibitory node's output decays toward 0. The organism loses interest and drifts away. When a NEW stimulus appears (different distance = different input value), the Inhibitory node fires strongly again → approach the new thing. The Sine node creates a gentle spiraling exploration pattern during periods of low curiosity, preventing the organism from sitting still.

**Why this works**: The Inhibitory node's built-in habituation mechanism (output decreases with repeated constant input, resets on input change) is the perfect substrate for curiosity. No explicit "novelty detection" system is needed — the node's activation dynamics naturally create novelty-seeking behavior.

### Fatigue (Differential + Integrator)

**Concept**: Sustained energy expenditure builds fatigue that slows the organism and drives rest-seeking behavior. Fatigue accumulates when energy is dropping and dissipates slowly during rest.

**BP Cost**: ~7.5 BP (1 Differential node + 1 Integrator node + 3 synapses = 2 + 2 + 1.5)

```
EnergyRatio --[+1.0]--> DIF                           // Detect energy trend
DIF --[-2.0]--> INTEG [bias: -0.05]                   // Negative energy trend (energy dropping)
                                                       // accumulates fatigue. Very slow natural decay.
INTEG --[-2.0]--> Accelerate                           // Fatigue → slow down
INTEG --[+2.0]--> Want2Eat [bias: +0.3]               // Fatigue → increase eating desire
INTEG --[+1.5]--> Burrow                               // High fatigue → burrow (rest, if trait purchased)
```

**Behavior**: The Differential node outputs the rate of change of energy. When energy is dropping (active movement, combat, metabolism), DIF outputs a negative value. The negative synapse weight (-2.0) inverts this, feeding a positive signal into the Integrator — fatigue accumulates. When energy is stable or rising (eating, resting), DIF outputs ~0 or positive, and the Integrator's negative bias slowly drains accumulated fatigue.

High fatigue reduces movement speed (inhibits Accelerate), increases eating motivation (stimulates Want2Eat), and if the organism has Burrowing, triggers burrowing to rest. The organism effectively "gets tired" from sustained activity and "rests" to recover.

### Hunger-Driven Aggression (ReLU Threshold + Multiply AND-Gate)

**Concept**: A normally peaceful herbivore that only attacks smaller organisms when critically low on energy. Creates a "desperate predator" behavior pattern.

**BP Cost**: ~10 BP (1 ReLU node + 1 Multiply node + 1 Linear node + 4 synapses = 2 + 2 + 2 + 2)

```
EnergyRatio --[-1.0]--> ReLU [bias: +0.2]             // Fires only when energy < 20%
                                                       // (-1.0 * 0.2 + 0.2 = 0, -1.0 * 0.1 + 0.2 = 0.1 → fires)

NearestOrganismSize --[-1.0]--> LIN [bias: +0.4]      // Positive when target is smaller than 40% of self

ReLU --[+1.0]--> MULT                                 // Hunger gate
LIN --[+1.0]--> MULT                                  // Size gate
MULT --[+5.0]--> Want2Attack                           // Attack ONLY when hungry AND target is small
MULT --[+3.0]--> Accelerate                            // Chase the target
NearestOrganismAngle --[+2.0]--> Rotate                // Steer toward target
```

**Behavior**: The ReLU node acts as a hunger threshold — it outputs 0 until energy drops below 20%, then outputs a signal proportional to how hungry the organism is. The Linear node acts as a size filter — positive output only when the nearest organism is significantly smaller. The Multiply node acts as an AND-gate: attack output is non-zero ONLY when BOTH conditions are true (hungry AND target is small). A well-fed organism never attacks. A hungry organism only attacks easy targets.

**Emergent result**: A herbivore species that peacefully grazes most of the time but becomes an opportunistic predator during starvation events (winter, population crashes). This creates fascinating ecosystem dynamics — herbivores that are "mostly harmless" but turn dangerous when desperate.

### Design Implications

These four examples demonstrate that the existing brain node system supports rich emotional and motivational behaviors without any dedicated "emotion" mechanic. The key building blocks are:

- **Integrator**: Temporal accumulation with decay → persistent states (fear, fatigue)
- **Inhibitory**: Habituation → novelty detection (curiosity)
- **Differential**: Rate-of-change detection → trend awareness (fatigue from activity)
- **Multiply**: AND-gate logic → conditional behaviors (hungry AND small target)
- **ReLU**: Threshold detection → activation triggers (energy below critical level)

Players can combine these in countless ways. The examples above use ~7.5-10 BP each — a meaningful investment that creates qualitatively different behavior from simple reactive wiring, but not so expensive that it dominates the 100 BP budget.

---

## 12. AI Ecosystem Management

### 12.1 Target: ~30 Active Species

The world should always have approximately **30 active species** to maintain a rich, competitive ecosystem. When fewer than 30 human players have active species, AI species fill the remaining slots.

```
aiSpeciesCount = max(0, 30 - activeHumanSpeciesCount)
```

### 12.2 AI Species Design

AI species are NOT randomly generated — they're drawn from a **curated library** of pre-designed organisms with varying ecological roles. Each AI species has a hand-tuned brain and body designed to fill a specific niche.

**AI Species Library** (minimum 15 designs, cycled in rotation):

| Category | Example Species | Ecological Role |
|----------|----------------|-----------------|
| **Small Herbivore** (3 variants) | "Moss Nibblers", "Blade Runners", "Root Grazers" | Fast-breeding prey base. Sustains carnivore food chain |
| **Large Herbivore** (2 variants) | "Thornbacks", "Shell Lumberers" | Slow, armored grazers. Territory holders |
| **Ambush Predator** (2 variants) | "Lurk Fangs", "Pit Strikers" | Camouflage/burrowing hunters. Controls herbivore population |
| **Chase Predator** (2 variants) | "Swift Claws", "Dune Stalkers" | High-speed hunters. Biome-specialized |
| **Omnivore** (2 variants) | "Mud Foragers", "Canopy Wanderers" | Flexible feeders. Ecosystem generalists |
| **Scavenger** (2 variants) | "Bone Pickers", "Rot Seekers" | Clean up dead matter. Fast decomposition cycle |
| **Herd Species** (1 variant) | "Flocking Sprites" | Demonstrates herding behavior to players |
| **Venomous** (1 variant) | "Stingtails" | Small but dangerous. Demonstrates venom mechanics |

### 12.3 AI Species Behavior

**Competence level**: AI species are designed to be **functional but not dominant**. They fill ecological niches but shouldn't crowd out human players. Achieved through:
- Brain complexity capped at ~8-12 synapses (simpler than what skilled players build)
- Body stats use ~75 effective BP (slightly below the 100 BP available to human players)
- No daily mutation selections applied (they evolve only through natural random mutation)

**Cycling schedule**: Every 48 hours, the least-performing AI species (lowest dominance score) is retired and replaced with a different design from the library. This ensures:
- Fresh diversity in the ecosystem
- No AI species becomes entrenched
- Players encounter different AI opponents regularly

### 12.4 AI Species Replacement Rules

**When a human player deploys**: If there are AI species in the world, the AI species with the lowest dominance score is immediately retired (organisms receive 10x ageing) to make room. The new human species spawns normally.

**When a human species goes extinct**: The empty slot is filled within 5 minutes by an AI species chosen to fill the most under-represented ecological niche (using the same keystone analysis from Section 5.4).

**When a human player goes inactive** (no login for 7+ days): Their species continues normally but receives no daily mutations. If it naturally goes extinct, the slot becomes an AI slot.

### 12.5 AI Species Visibility

- AI species are clearly marked with a small icon on the world map and leaderboard
- They appear in the Species Directory with designer listed as "Ecosystem AI"
- They CAN appear on leaderboards but are visually distinguished (players compete against players; AI is backdrop)
- Event logs involving AI species use their species names normally ("Your organism was attacked by a Lurk Fang")

---

## 13. Verification / Build Order

1. **Prototype the brain editor UI** (React): Visual node graph with drag-and-drop. This is the core player experience.
2. **Prototype the simulation loop** (server-side): 2D world, plant spawning, organism movement, eating, energy cycle. Validate conservation.
3. **Connect brain to simulation**: Wire input/output nodes. Test that template brains survive.
4. **Add reproduction + genetics**: Gene inheritance, Poisson mutation count, Gaussian mutation magnitude. Verify population dynamics and generational turnover. Track mutation pool.
5. **Add combat + diet system**: Test predator-prey equilibrium with the concave diet curves.
6. **Build spectating views**: Map, follow-cam, event log, stats dashboard.
7. **Add multiplayer**: Supabase backend, organism deployment to shared world.
8. **Daily mutation selection**: Surface real mutations from the mutation pool. Present 3 options with source transparency.
9. **AI ecosystem management**: Curated AI species library. Slot filling, cycling, replacement logic.
10. **Progression system**: EP, unlock tiers, achievements.
11. **Seasonal/biome system**: Dynamic environment, biome-season interactions.
12. **Communication**: Pheromones, sound emission/detection.
13. **Advanced traits**: Burrowing, camouflage, venom, armor, fat, spores, herding.
14. **Sexual reproduction**: Optional trait, mate-finding, fertilization, gene crossover, brain crossover.
15. **Nest sites**: Egg proximity detection, pheromone-based nest bonus, nest defense wiring.
16. **Encounter info sharing**: Ally state reading, encounter range queries, 7 encounter input nodes.
17. **Fungi system**: Environmental modifiers.
18. **Species farewell cards**: Share card renderer, mini-achievement detection, Supabase Storage upload, share URL page.
19. **Polish**: Vector art generation, procedural animation, UI refinement.
20. **Events**: Ecological world events (bloom, drought, plague, etc.).
