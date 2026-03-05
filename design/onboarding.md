# Onboarding & Player Education System

This document defines the complete player education framework for Life Game. Rather than a separate tutorial mode, education is woven into the game through four integrated layers that activate contextually as players encounter new systems.

**Related docs**: [`core-gameplay-systems.md`](core-gameplay-systems.md) (all game systems), [`components/front-end.md`](components/front-end.md) (UI components, wireframes), [`architecture.md`](architecture.md) (state persistence)

---

## 1. Philosophy & Principles

Six design principles govern all teaching in Life Game:

### 1.1 Deploy First, Understand Later

The organism is in the world within 5 minutes. The "aha moment" is watching it navigate autonomously — not reading about how brains work. Every explanation deferred past the first deploy is a win. Players learn more from 60 seconds of watching their organism find food than from 5 paragraphs about neural activation functions.

### 1.2 One Concept Per Encounter

Never explain two systems at once. Max 3 lines per tooltip, 2 paragraphs per modal. If a teaching moment requires explaining System A to understand System B, defer System B. Example: when a player first sees reproduction, explain "offspring inherit your brain with small mutations" — do NOT also explain genetics, entropy, or sexual reproduction in the same card.

### 1.3 Contextual Over Separate

Teaching happens where the mechanic lives. There is no `/tutorial` route. The `/onboarding` wizard is the only exception — and even it uses the real designer, not a mock. When the player taps a slider, the help appears on that slider. When an organism dies, the death explanation appears in the world view. No separate "learn about death" page.

### 1.4 Observe to Learn

For autonomous systems (reproduction, combat, genetics), the primary teaching mechanism is watching organisms and reading short explanatory overlays in follow mode. Players don't control organisms — they design and observe. The teaching system mirrors this: show what happened, explain why, suggest what to try next.

### 1.5 Progressive Disclosure via Unlock Gates

The 4 EP tiers already enforce progressive disclosure mechanically. Onboarding layers explanation on top. A player at Tier 1 never sees a Pheromone tooltip because pheromone nodes are locked. When they unlock Tier 4, they see a celebration modal that introduces pheromones with a suggested first experiment. The unlock system IS the curriculum sequencing.

### 1.6 Escape Hatches Everywhere

Every guided step has "Skip" or "Use Template." Power users can bypass everything with one tap. The Quick Start wizard has "Skip to Deploy" on every step. InlineTeachCards have "Got It" dismissal. The entire onboarding can be reset from Profile Settings. No player should ever feel trapped in a tutorial.

---

## 2. Layer 1: Quick Start (First Session, <5 Minutes)

The Quick Start wizard is a 4-step flow at `/onboarding` that runs once on first login. Goal: organism deployed and alive in <5 minutes.

### 2.1 Step 1 — Welcome Splash (10 seconds)

**Content**:
- Full-bleed illustration using the **real organism renderer** (same canvas-based renderer as the designer preview) showing 3-4 animated organisms: a green herbivore grazing, a red carnivore chasing, a small organism hatching from an egg. Added polish effects: particle trails behind moving organisms, subtle glow around the egg.
- NOT static SVGs — this is a live canvas rendering to set expectations for what the game actually looks like.

**Copy**:
> **Design an organism. Give it a brain. Watch it live.**
>
> You'll create a creature with a body and a simple neural network, then release it into a shared world where it lives, eats, and reproduces on its own.

**Controls**:
- Step indicators: `● ○ ○ ○`
- Primary button: **"Let's Build"** → navigates to Step 2
- Escape: none needed (this step is 10 seconds)

### 2.2 Step 2 — Simplified Body Designer (90 seconds)

A modified version of the real BodyTab with training wheels:

**Layout**:
- **Top 40%**: Live organism preview (same renderer as designer preview, animating idle)
- **Middle**: 4 archetype cards in a horizontal scroll: **Herbivore** (pre-selected, green border), **Carnivore** (red), **Omnivore** (yellow), **Scavenger** (grey). Each card shows: icon, name, 1-line description ("Plant-eating grazer", "Predatory hunter", "Balanced forager", "Opportunistic feeder")
- **Below archetypes**: 3 visible sliders only:
  - **Size** (0.3–3.0) — "How big. Bigger = more HP but costs more BP."
  - **Speed** (0.2–2.5) — "How fast. Faster = better hunter or better escape."
  - **Diet** (0.0–1.0) — "What it eats. Green = plants, red = meat, yellow = both."
- **Collapsed accordion**: "Fine-Tune (6 more stats) ▶" — expands to show Strength, Defense, View Angle, View Radius, Metabolism, Stomach, Growth Speed. Collapsed by default during onboarding.
- **BP budget bar** at bottom: simplified, shows `[███████░░░] 76/100 BP` with no breakdown

**Behavior**:
- Selecting an archetype pre-fills all 9 sliders + allocates brain BP
- Adjusting any of the 3 visible sliders updates the preview in real-time
- The preview organism changes visually: larger body, more tails for speed, color shifts with diet

**Copy** (inline, above sliders):
> **Choose a body type, then tweak it.**
> The Herbivore is a great first pick — it finds food easily.

**Why Herbivore default**: The Simple Grazer brain template (7 synapses, 3.5 BP) works immediately in Grassland's high plant density. Organisms find food within seconds, giving instant positive feedback. Carnivore requires a size-gating hidden node (ReLU), which is too complex for onboarding. New players need the reward of "my organism is eating!" before they're ready to wire conditional attack logic.

**Controls**:
- Step indicators: `✓ ● ○ ○`
- Primary: **"Next: Wire Brain"** → Step 3
- Escape: **"Skip to Deploy →"** (small text link) — uses archetype defaults for everything, jumps to Step 4

### 2.3 Step 3 — Simplified Brain Editor (90 seconds)

A modified version of the real BrainTab with training wheels:

**Layout**:
- Brain canvas showing the archetype's pre-applied template (e.g., Simple Grazer for Herbivore: 7 synapses visible, PlantAngle→Rotate, PlantDist→Accelerate, etc.)
- Input nodes on left, output nodes on right, existing synapses drawn as colored lines
- **Guided drag highlight**: One connection is NOT pre-wired. For Herbivore: `PlantAngle → Rotate` is highlighted with a pulsing glow and dotted arrow showing the drag path. For Carnivore: `NearestOrganismAngle → Rotate` is highlighted instead.
- Hidden node palette is NOT shown during onboarding (appears on 2nd visit to BrainTab)

**Copy** (floating instruction card):
> **Drag from an input to an output to create a connection.**
>
> Try it! Connect PlantAngle → Rotate so your organism steers toward food.

**Post-drag copy** (after successful connection):
> **Nice!** That connection means: "turn toward the nearest plant."
> The thicker the line, the stronger the signal.
>
> Your brain template already has more connections wired up. You can explore them later.

**Controls**:
- Step indicators: `✓ ✓ ● ○`
- Prominent button: **"Use Template"** — keeps the archetype's pre-wired brain as-is (always visible, not an escape hatch — it's a first-class option)
- Primary: **"Next: Deploy"** → Step 4
- Escape: (Use Template serves this purpose)

### 2.4 Step 4 — Simplified Deploy (60 seconds)

A streamlined version of the deploy screen:

**Layout**:
- Auto-generated species name (e.g., "Green Drifters", "Swift Grazers") with edit icon
- 5 biome buttons in a row: Grassland (pre-selected, highlighted), Forest, Desert, Wetland, Rocky
- Each biome button shows name only — no crowding cost display during onboarding
- Founder count is hidden (defaults to 3)
- Large prominent button at bottom

**Copy**:
> **Choose where to release your organisms.**
> Grassland has plenty of food — perfect for your first species.

**Controls**:
- Step indicators: `✓ ✓ ✓ ●`
- Primary: **"Release Into The World"** (large, green, prominent) → triggers deploy, navigates to `/world`
- No "Back" button clutter — just the deploy button and biome selector

### 2.5 Post-Deploy "Aha Moment" Sequence

After deploy, the player auto-navigates to `/world`. The following scripted sequence plays:

**Camera behavior**:
- Camera auto-follows one of the 3 deployed organisms at Sprite tier zoom
- Vision cone overlay ON for first 30 seconds (shows what the organism can see)
- Camera smoothly tracks as organism moves

**Floating card sequence** (timed, auto-advancing, dismissable):

1. **T+0s**: "Your [species name] is alive! Watch it explore." (card anchored bottom-center, 5s)
2. **T+5s**: "See the cone? That's what it can see. It uses vision to find food and avoid threats." (card near vision cone, 5s)
3. **T+10s** (if organism eats, else T+15s): "It found food! Your brain wiring told it to steer toward plants and eat." (card near organism, 4s)
4. **T+30s**: Vision cone fades off. Card: "Your organisms will live, eat, and reproduce on their own. Come back anytime." (5s)
5. **T+40s**: Final card: "Tap any organism to follow it. Tap the background to explore freely." (5s, then fades)

**Edge cases**:
- If organism dies before sequence completes: "Your organism died — that happens! The others are still out there." → skip to card 4
- If organism hasn't eaten by T+20s: skip card 3, proceed to card 4

After the sequence completes, the player is in normal `/world` mode with no further interruptions.

---

## 3. Layer 2: System Introductions (Sessions 2–10)

Seventeen first-encounter-triggered `InlineTeachCard` instances, each firing **once per player lifetime**. These introduce systems when the player naturally encounters them, not before.

### 3.1 Introduction Catalog

| # | ID | System | Trigger Condition | Location | Format |
|---|-----|--------|-------------------|----------|--------|
| 1 | `while_away` | While You Were Away | 2nd login (any session after first) | DashboardScreen | InlineTeachCard |
| 2 | `follow_mode` | Follow Mode | First organism tap in `/world` | WorldScreen | InlineTeachCard |
| 3 | `bp_budget_deep` | BP Budget (deep) | 2nd visit to BodyTab | BodyTab | InlineTeachCard |
| 4 | `hidden_sliders` | Hidden Sliders | 2nd visit to BodyTab | BodyTab | InlineTeachCard |
| 5 | `reproduction` | Reproduction | First egg event via WebSocket | WorldScreen | EventTeachToast |
| 6 | `death_energy` | Death & Energy | First death event via WebSocket | WorldScreen | EventTeachToast |
| 7 | `daily_mutation` | Daily Mutation | First mutation available (badge appears) | Dashboard | InlineTeachCard |
| 8 | `hidden_nodes` | Hidden Nodes | 2nd visit to BrainTab | BrainTab | InlineTeachCard |
| 9 | `synapse_weights` | Synapse Weights | First synapse tap | BrainTab | InlineTeachCard |
| 10 | `node_bias` | Node Bias | First node tap (hidden or output) | BrainTab | InlineTeachCard |
| 11 | `biome_diff` | Biome Differences | Navigate to non-Grassland biome view | WorldScreen | InlineTeachCard |
| 12 | `seasons` | Seasons | First season change event | Dashboard + WorldScreen | EventTeachToast |
| 13 | `combat` | Combat | First attack or attacked event | WorldScreen | EventTeachToast |
| 14 | `spectating` | Spectating Tools | 60s cumulative time in follow mode | WorldScreen | InlineTeachCard |
| 15 | `leaderboard` | Leaderboard | First leaderboard appearance | Dashboard | InlineTeachCard |
| 16 | `entropy` | Species Entropy | Player's entropy multiplier exceeds 2.0x | Dashboard | InlineTeachCard |
| 17 | `extinction` | Extinction | First species extinction | ExtinctionModal | InlineTeachCard |

### 3.2 Introduction Content

#### #1 — While You Were Away

**Trigger**: 2nd login (player has logged in before, `quickStartCompleted` is true)

**Base card**:
> **While you were away...**
> Your organisms kept living! This summary shows what happened since your last visit.

**Contextual teaching line** (appended based on data):
- Population increased: "Your organisms reproduced. Offspring inherit your brain design with small random mutations."
- Population decreased: "Population dropped — check food access. Try adjusting View Radius or deploying in a less crowded biome."
- Rank improved: "You climbed the leaderboard! Dominance score = population + territory coverage + food chain position."
- Species went extinct while away: "Your species went extinct while you were gone. An AI placeholder is keeping your slot warm — design a new species anytime."

**Learn More** → Guide: "Getting Started: How the World Works"

#### #2 — Follow Mode

**Trigger**: First tap on any organism in `/world`

**Card** (anchored near tapped organism):
> **Follow Mode**
> You're now following this organism. Watch its brain make decisions in real-time.
> Tap the background to detach and explore freely.

**Learn More** → Guide: "Spectating: Follow Mode Tools"

#### #3 — BP Budget (Deep)

**Trigger**: 2nd visit to BodyTab (player has visited BodyTab at least once before, likely during onboarding)

**Card** (anchored near BP bar):
> **Bio-Point Budget**
> Every organism gets 100 BP shared between body AND brain. High Speed + large brain = less BP for other stats. Tap any slider label for cost details.

**Learn More** → Guide: "Body Design: BP Budget"

#### #4 — Hidden Sliders

**Trigger**: 2nd visit to BodyTab, fires after #3 is dismissed (sequential)

**Card** (anchored near Fine-Tune accordion):
> **More Stats Available**
> Expand "Fine-Tune" for 6 more sliders: Strength, Defense, View Angle, View Radius, Metabolism, Stomach, and Growth Speed. Three of these are free (no BP cost)!

**Learn More** → Guide: "Body Design: All Stats Explained"

#### #5 — Reproduction

**Trigger**: First `egg_laid` event for player's species via WebSocket

**Toast**:
> **Your organism laid an egg!**
> Mature, healthy organisms reproduce automatically. Offspring inherit your brain with small mutations.

**Learn More** → Guide: "Lifecycle: Reproduction"

#### #6 — Death & Energy

**Trigger**: First `organism_died` event for player's species via WebSocket

**Toast**:
> **An organism died.**
> Death returns energy to the world as meat pellets. Other organisms can eat them. Nothing is wasted — energy is always conserved.

**Learn More** → Guide: "The World: Energy Cycle"

#### #7 — Daily Mutation

**Trigger**: First time `daily_mutation_available` notification appears

**Card** (anchored near mutation badge on Dashboard):
> **Daily Mutation**
> Every day, you get 3 mutation options for your living species. Pick one to apply a small change to all organisms — or skip it. Mutations stack over generations.

**Learn More** → Guide: "Lifecycle: Genetics & Mutation"

#### #8 — Hidden Nodes

**Trigger**: 2nd visit to BrainTab

**Card** (anchored near the hidden node palette area):
> **Processing Nodes**
> Drag nodes from this palette between your inputs and outputs. They process signals — Sigmoid makes decisions, ReLU gates signals, Multiply creates AND-logic. Each costs 2 BP.

**Learn More** → Guide: "Brain Design: Hidden Nodes"

#### #9 — Synapse Weights

**Trigger**: First synapse tap in BrainTab

**Card** (anchored near the weight slider that appears):
> **Synapse Weight**
> Positive weight = excitatory (green line). Negative = inhibitory (red line). Stronger weight = thicker line. Adjust to control how much influence one node has on another.

**Learn More** → Guide: "Brain Design: Basics"

#### #10 — Node Bias

**Trigger**: First tap on a hidden or output node in BrainTab

**Card** (anchored near the bias slider):
> **Node Bias**
> Bias shifts the node's default activation. Positive bias = "wants to fire." Negative = "resists firing." Example: Want2Attack bias of -2.0 means it only triggers with strong input.

**Learn More** → Guide: "Brain Design: Basics"

#### #11 — Biome Differences

**Trigger**: Player pans camera to a non-Grassland biome in `/world`

**Card** (anchored top of screen):
> **Different Biome!**
> Each biome has different plant density, visibility, and movement cost. Your organism may behave differently here. Desert has scarce food but clear sightlines. Forest is dense but dark.

**Learn More** → Guide: "The World: Biomes & Seasons"

#### #12 — Seasons

**Trigger**: First `season_changed` event

**Toast**:
> **Season changed: [Season Name]**
> Seasons shift food availability, metabolism cost, and biome boundaries over a ~28-day cycle. Winter is harsh — plan ahead.

**Learn More** → Guide: "The World: Biomes & Seasons"

#### #13 — Combat

**Trigger**: First `attack` or `attacked` event involving player's species

**Toast** (varies by event):
- Player's organism attacked: "**Your organism attacked!** Damage = Strength x Size minus target's Defense. Only triggers when Want2Attack output > 0.5."
- Player's organism was attacked: "**Your organism was attacked!** Defense reduces incoming damage. Consider wiring NearestOrganismSize → Want2Flee to escape larger predators."

**Learn More** → Guide: "Combat: Attack Resolution"

#### #14 — Spectating Tools

**Trigger**: 60 seconds cumulative time in follow mode

**Card** (anchored bottom of WorldScreen):
> **Spectating Tools**
> While following, try: toggle vision cone (see what it sees), toggle brain overlay (see node activations), or switch to perception mode (fog-of-war from organism's perspective).

**Learn More** → Guide: "Spectating: World View Controls"

#### #15 — Leaderboard

**Trigger**: Player's species first appears on leaderboard

**Card** (anchored near leaderboard widget on Dashboard):
> **You're on the board!**
> Dominance score combines population size, territory coverage, and food chain position. Updated every 60 seconds.

**Learn More** → Guide: "Ecosystem: Dominance Scoring"

#### #16 — Species Entropy

**Trigger**: Player's entropy multiplier exceeds 2.0x

**Card** (anchored near species stats on Dashboard):
> **Species Entropy**
> Long-running species gradually weaken (entropy). This prevents permanent dominance and opens space for new designs. Consider retiring and deploying a fresh species.

**Learn More** → Guide: "Lifecycle: Ageing, Entropy & Death"

#### #17 — Extinction

**Trigger**: Player's species reaches 0 living organisms

**Card** (inside ExtinctionNotificationModal):
> **Your species went extinct.**
> An AI placeholder keeps your ecosystem slot warm. Design a new species anytime — you keep all your EP and unlocks. Try a different archetype or biome!

**Learn More** → Guide: "Getting Started: Your First Redesign"

---

## 4. Layer 3: Deep Dives (Pull-Based Reference Guide)

A comprehensive in-game reference guide accessible from the `GlobalHelpModal` (the [?] button present on every screen). Players pull information when they want it — these pages are never pushed. ~40 guide topics organized into 9 categories.

Data stored in `src/data/guides.ts` as static objects. Each guide page follows a consistent format: **Summary** → **How It Works** → **Key Numbers** → **Strategy Tips** → **Example** → **Related Links**. Interactive elements (activation function curves with sliders, diet efficiency graphs, annotated template diagrams) are included where noted.

Every guide page includes **"Try It" navigation links** that jump to the relevant screen. E.g., "Body Design: BP Budget" includes "Open Body Designer →" linking to `/designer` BodyTab.

### 4.1 Guide Index

| # | Category | Guide Page | ID |
|---|----------|------------|----|
| 1 | Getting Started | What Is Life Game? | `gs_what` |
| 2 | Getting Started | How the World Works | `gs_world` |
| 3 | Getting Started | Your First Redesign | `gs_redesign` |
| 4 | Body Design | BP Budget | `bd_bp` |
| 5 | Body Design | All Stats Explained | `bd_stats` |
| 6 | Body Design | Diet & Digestion | `bd_diet` |
| 7 | Body Design | Unlockable Traits Guide | `bd_traits` |
| 8 | Body Design | Founder Strategy | `bd_founders` |
| 9 | Brain Design | Basics (Nodes, Synapses, Weights) | `br_basics` |
| 10 | Brain Design | Activation Functions | `br_activation` |
| 11 | Brain Design | Hidden Nodes | `br_hidden` |
| 12 | Brain Design | Processing Order | `br_processing` |
| 13 | Brain Design | Template Walkthroughs | `br_templates` |
| 14 | Brain Design | Emergent Drives | `br_drives` |
| 15 | Brain Design | Complex Wiring Examples | `br_complex` |
| 16 | The World | Biomes & Seasons | `tw_biomes` |
| 17 | The World | Energy Cycle | `tw_energy` |
| 18 | The World | Day/Night Cycle | `tw_daynight` |
| 19 | The World | Fungi & Environmental Modifiers | `tw_fungi` |
| 20 | Lifecycle | Reproduction (Asexual) | `lc_repro` |
| 21 | Lifecycle | Sexual Reproduction | `lc_sexual` |
| 22 | Lifecycle | Genetics & Mutation | `lc_genetics` |
| 23 | Lifecycle | Ageing, Entropy & Death | `lc_ageing` |
| 24 | Lifecycle | Nesting & Eggs | `lc_nesting` |
| 25 | Combat & Survival | Attack Resolution | `cs_attack` |
| 26 | Combat & Survival | Venom | `cs_venom` |
| 27 | Combat & Survival | Armor & Burrowing | `cs_armor` |
| 28 | Combat & Survival | Camouflage | `cs_camo` |
| 29 | Combat & Survival | Flee & Sprint | `cs_flee` |
| 30 | Communication | Pheromones | `cm_phero` |
| 31 | Communication | Sound Signals | `cm_sound` |
| 32 | Communication | Encounter Info Sharing | `cm_encounter` |
| 33 | Communication | Herding & Flocking | `cm_herding` |
| 34 | Ecosystem | Dominance Scoring | `ec_dominance` |
| 35 | Ecosystem | Food Chain & Balance | `ec_foodchain` |
| 36 | Ecosystem | Keystone Species | `ec_keystone` |
| 37 | Ecosystem | Ecological Events | `ec_events` |
| 38 | Spectating & Progression | World View Controls | `sp_worldview` |
| 39 | Spectating & Progression | Follow Mode Tools | `sp_follow` |
| 40 | Spectating & Progression | EP, Unlocks & Achievements | `sp_progression` |

### 4.2 Guide Page Content

Each guide below contains the full implementable text. Developers can copy this content directly into `src/data/guides.ts`.

---

#### Guide: What Is Life Game? (`gs_what`)

**Category**: Getting Started | **Try It**: "Go to Dashboard →" `/home`

**Summary**: Life Game is a design-and-observe ecosystem simulator. You create organisms with custom bodies and neural-network brains, deploy them into a shared persistent world, and watch them live, eat, reproduce, and compete autonomously.

**How It Works**:
- **Design**: Use the Body Designer to allocate 100 Bio-Points across physical stats (size, speed, strength, etc.). Use the Brain Editor to wire sensory inputs to behavioral outputs through a visual node graph.
- **Deploy**: Release 1-10 founder organisms into one of 5 biomes. They start with your exact design.
- **Watch**: Organisms act autonomously based on their brain wiring. They find food, flee predators, fight rivals, and reproduce — all without your control.
- **Iterate**: Observe what works and what doesn't. Retire your species and redesign, or apply daily mutations to evolve them over time.

**Key Numbers**:
- 100 Bio-Points per organism (shared between body and brain)
- 9 core body sliders + 11 unlockable traits
- 51 input nodes, 20 output nodes, 12 hidden node types (across 4 unlock tiers)
- 5 biomes, 4 seasons cycling over ~28 real-time days
- Up to 30 species per world

**Strategy Tips**:
- Start with the Herbivore archetype — it works immediately in Grassland
- Don't try to optimize everything at once. Pick 2-3 stats to specialize in
- Watch your organisms for at least a few minutes before redesigning — they might surprise you

**Related**: "How the World Works", "BP Budget", "Brain Design: Basics"

---

#### Guide: How the World Works (`gs_world`)

**Category**: Getting Started | **Try It**: "Open World View →" `/world`

**Summary**: The world is a persistent shared simulation running 24/7. Your organisms live even when you're offline. Energy is conserved — when organisms die, their energy returns as food for others.

**How It Works**:
- **Persistent simulation**: The server runs the world continuously at 40 ticks per second. Your organisms keep living while you're away.
- **Closed energy system**: Total energy in the world is constant. Plants grow from free biomass, organisms eat plants (or each other), dead organisms become meat pellets, and decaying matter returns to biomass.
- **Multiple biomes**: 5 biome types (Grassland, Forest, Desert, Wetland, Rocky) with different food densities, visibility, and movement costs.
- **Seasons**: A full seasonal cycle takes ~28 real days. Spring boosts plant growth and reproduction. Winter is harsh — food is scarce and metabolism costs increase.

**Key Numbers**:
- World size: 500 x 500 units with toroidal wrapping (walk off one edge, appear on the other)
- 5 biomes with distinct properties
- Seasonal cycle: Spring (days 1-7), Summer (8-14), Autumn (15-21), Winter (22-28)
- ~30 active species per world (AI species fill empty slots)

**Strategy Tips**:
- Check the "While You Were Away" summary each login to see how your species fared
- Grassland is safest for beginners. Desert and Rocky reward specialized builds
- Plan for winter — species that thrive in spring may starve when food drops to 30%

**Related**: "Biomes & Seasons", "Energy Cycle", "Your First Redesign"

---

#### Guide: Your First Redesign (`gs_redesign`)

**Category**: Getting Started | **Try It**: "Open Designer →" `/designer`

**Summary**: Your first organism probably won't be perfect — that's the point. Observe what it struggles with, then redesign with targeted improvements.

**How It Works**:
- **Retire and redesign**: You have one active species slot. Deploying a new species retires the current one (old organisms are removed).
- **Keep your progress**: EP, unlocks, and achievements persist across redesigns.
- **Learn from observation**: If organisms starve, try increasing View Radius. If they get eaten, add Defense or wire better flee logic. If they don't reproduce, check that they're eating enough to reach maturity.

**Common First Issues**:
- "Organisms wander randomly" → Check brain wiring. PlantAngle → Rotate is the minimum for food-seeking.
- "Organisms starve surrounded by food" → Wire Want2Eat with a positive bias or connect Constant → Want2Eat.
- "Organisms keep getting killed" → Wire NearestOrganismSize → Want2Flee with positive weight so they flee larger organisms.
- "Population never grows" → Organisms need to reach maturity (full growth) and have enough energy. Ensure they can find food efficiently.

**Strategy Tips**:
- Don't change everything at once — modify one thing and observe the difference
- Try the other archetypes to see different playstyles
- Use the Statistics Dashboard to compare population trends across redesigns

**Related**: "BP Budget", "Template Walkthroughs", "Dominance Scoring"

---

#### Guide: BP Budget (`bd_bp`)

**Category**: Body Design | **Try It**: "Open Body Designer →" `/designer` (BodyTab)

**Summary**: Every organism has exactly 100 Bio-Points (BP) to spend on body stats and brain complexity. This fixed budget forces meaningful tradeoffs — you can't be fast AND strong AND smart AND tough.

**How It Works**:
- **Shared pool**: Body stats and brain components draw from the same 100 BP. A large brain (30+ BP) means less for physical stats. A heavily armored tank leaves little for senses or speed.
- **Cost formulas**: Each slider has a different cost curve. Size scales quadratically (`10 x Size^2`), so extreme sizes are very expensive. Speed is linear (`10 x Speed`). Some sliders are free (Diet, Metabolism, Growth Speed) — these are pure tradeoffs, not power increases.
- **Founder cost**: Each additional founder beyond the first costs 5 BP, reducing every organism's effective budget. 3 founders = 90 effective BP, 5 founders = 80 BP, 10 founders = 55 BP.
- **Biome cost**: Crowded biomes deduct additional BP. Underpopulated biomes are free.

**Key Numbers**:

| Stat | Cost Formula | At Default (1.0) |
|------|-------------|-------------------|
| Size | `10 x Size^2` | 10 BP |
| Speed | `10 x Speed` | 10 BP |
| Strength | `6 x STR` | 6 BP |
| Defense | `6 x DEF` | 6 BP |
| View Angle | `angle / 45` | 2 BP (at 90 deg) |
| View Radius | `2 x radius` | 10 BP (at 5.0) |
| Stomach | `6 x mult` | 6 BP |
| Diet | Free | 0 BP |
| Metabolism | Free | 0 BP |
| Growth Speed | Free | 0 BP |
| Hidden Node | 2 BP each | — |
| Synapse | 0.5 BP each | — |
| Unlockable Trait | Varies | 3-15 BP |

**Strategy Tips**:
- Aim to spend 90-100 BP — unspent points are wasted potential
- Free sliders (Diet, Metabolism, Growth Speed) are some of the most impactful — always adjust these
- Brain cost = `2 x hiddenNodes + 0.5 x synapses`. A simple 7-synapse brain costs only 3.5 BP. A complex 4-node 15-synapse brain costs 15.5 BP
- Founder count is a permanent tradeoff: more founders = safer start but weaker individuals

**Related**: "All Stats Explained", "Founder Strategy", "Brain Design: Basics"

---

#### Guide: All Stats Explained (`bd_stats`)

**Category**: Body Design | **Try It**: "Open Body Designer →" `/designer` (BodyTab)

**Summary**: Nine core sliders define your organism's physical capabilities. Three are free tradeoffs, six cost BP. Understanding each stat's mechanical effect helps you design organisms that match your strategy.

**Stats**:

- **Size Ratio** (0.3-3.0, costs `10 x Size^2` BP): Hit points = `100 x maturity x Size^2`. Larger = more visible, more inertia, bigger stomachs. Size 2.0 costs 40 BP.
- **Speed Ratio** (0.2-2.5, costs `10 x Speed` BP): Movement force multiplier. Faster organisms chase prey, escape predators, and cover more ground. Energy cost of movement scales with speed.
- **Strength** (0.1-5.0, costs `6 x STR` BP): Attack damage = `STR x Size x desireToAttack`. Must exceed target's DEF to deal damage. Also determines max food pellet bite size.
- **Defense** (0.0-4.0, costs `6 x DEF` BP): Damage reduction with diminishing returns. DEF 1.0 blocks 9%, DEF 2.0 blocks 17%, DEF 4.0 blocks 29%. Adds -2% max speed per DEF point.
- **Diet** (0.0-1.0, **free**): 0.0 = herbivore, 0.5 = omnivore, 1.0 = carnivore. Determines digestion efficiency per food type.
- **View Angle** (15-360 deg, costs `angle/45` BP): Field of vision width. 90 deg = focused predator eyes. 360 deg = panoramic prey vision (8 BP).
- **View Radius** (1.0-10.0, costs `2 x radius` BP): How far the organism can see. Affects brain input detection range.
- **Metabolism** (0.5-3.0, **free**): Scales ALL biological processes — movement, digestion, growth, ageing. Higher = everything faster but energy burns equally faster. Pure tradeoff.
- **Stomach Multiplier** (0.3-2.0, costs `6 x mult` BP): Multiplies base stomach capacity. Larger stomach stores more food but fullness ratio drops.
- **Growth Speed** (0.5-2.0, **free**): Maturation rate multiplier. Faster growth = shorter vulnerability but higher energy cost during growth.

**Strategy Tips**:
- The three free sliders (Diet, Metabolism, Growth Speed) should always be tuned — they're free power
- Size is the most expensive stat. Size 1.5 (22.5 BP) is reasonable; Size 2.5 (62.5 BP) leaves almost nothing for other stats
- Defense has diminishing returns AND a speed penalty — heavy investment is usually not worth it unless paired with Armor Plating
- View Radius vs View Angle: a 90 deg cone at radius 8.0 (18 BP) gives focused long-range detection. A 270 deg dome at radius 3.0 (12 BP) gives wide short-range awareness

**Related**: "BP Budget", "Diet & Digestion", "Unlockable Traits Guide"

---

#### Guide: Diet & Digestion (`bd_diet`)

**Category**: Body Design | **Try It**: "Open Body Designer →" `/designer` (BodyTab)

**Summary**: Diet determines what your organism can efficiently digest. The stomach is a real-time system — food enters, acid breaks it down, energy is extracted over time based on enzyme match and stomach fullness.

**How It Works**:
- **Diet slider** (0.0-1.0): Sets the enzyme balance. 0.0 = all plant enzymes, 1.0 = all meat enzymes.
- **Stomach**: Holds food up to capacity (`0.5 x bodySurfaceArea x StomachMult`). Digestion extracts energy over time.
- **Efficiency**: `efficiency = materialMaxEff x enzymeMatch x fullnessMultiplier`. Overly full stomachs digest less efficiently.
- **Plant vs Meat**: Plants have 1.0 energy density, max 55% efficiency. Meat has 3.0 energy density, max 80% efficiency.

**Interactive element**: Diet efficiency graph showing plant (green curve) and meat (red curve) efficiency at different diet values.

**Key Numbers**:
- Pure herbivore (diet 0.0): 55% plant efficiency, ~10% meat efficiency
- Omnivore (diet 0.5): ~35% plant, ~50% meat efficiency
- Pure carnivore (diet 1.0): ~10% plant, 80% meat efficiency
- `Digestion` output (Tier 2): higher acid = faster but less efficient digestion

**Strategy Tips**:
- Omnivores are versatile but never as efficient as specialists
- Carnivores need organisms to kill — if the ecosystem has few organisms, carnivores starve
- Large stomachs let organisms binge-eat then travel long distances. Useful for desert organisms
- Wire `EnergyRatio → Digestion` so low-energy organisms digest faster as emergency response

**Related**: "All Stats Explained", "Energy Cycle", "Attack Resolution"

---

#### Guide: Unlockable Traits Guide (`bd_traits`)

**Category**: Body Design | **Try It**: "Open Body Designer →" `/designer` (BodyTab)

**Summary**: Beyond the 9 core sliders, 11 unlockable traits add specialized capabilities. Each costs BP and unlocks at specific EP tiers. Traits expand what your organism CAN do — still 100 BP total budget.

**Tier 2 (50 EP)**:
- **Armor Plating** (3-15 BP): Additional damage reduction stacking with DEF. Makes organisms visibly plated.
- **Venom Glands** (5-12 BP): Attacks apply damage-over-time poison. Bypasses armor. Countered by Immune System.
- **Echolocation** (4-8 BP): Extends detection range, works in darkness and Forest. No brain wiring needed.

**Tier 3 (200 EP)**:
- **Burrowing** (5-10 BP): Enables `Burrow` output. Underground = invisible, immobile, 80% damage reduction. Energy cost per tick.
- **Camouflage** (4-8 BP): Reduces visibility based on speed. Stationary = nearly invisible. Countered by Echolocation.
- **Fat Reserves** (3-8 BP): Enables `StoreFat` output. Store surplus energy as fat for lean times. Essential for Winter.
- **Spore Dispersal** (4-10 BP): Offspring can spawn in adjacent biomes. Enables multi-biome colonization.
- **Herd Coordination** (3-6 BP): Enables `Herding` output. Flocking behavior with heritable gene weights.
- **Sexual Reproduction** (3-8 BP): Two sexes, mate-seeking, genetic recombination. More diversity but must find mates.

**Tier 4 (500 EP)**:
- **Encounter Info Sharing** (5-12 BP): Read nearby allies' internal state (energy, health, heading, threats, food). Enables cooperative strategies.

**Always Available** (design parameters):
- **Immune System**: Resistance to venom and fungi. No tier requirement.
- **Nest Affinity**: Faster egg incubation when eggs cluster. No tier requirement.

**Strategy Tips**:
- Don't buy every trait — each costs BP from the same 100-point pool
- Venom + small fast body = "assassin." Armor + high DEF = "tank." Fat Reserves = Winter survival
- Sexual Reproduction is high-risk/high-reward: faster adaptation but organisms must find mates

**Related**: "BP Budget", "All Stats Explained", "Complex Wiring Examples"

---

#### Guide: Founder Strategy (`bd_founders`)

**Category**: Body Design | **Try It**: "Open Deploy Screen →" `/designer` (DeployTab)

**Summary**: Deploying more founders gives a safer start but weakens each individual. `effectiveBP = 100 - (founders-1) x 5 - biomeCrowdingCost`.

**Key Numbers**:

| Founders | Effective BP | Tradeoff |
|----------|-------------|----------|
| 1 | 100 BP | Strongest individual, one death = extinction |
| 3 | 90 BP | Good default. Small group, decent stats |
| 5 | 80 BP | Safety in numbers. Weaker individuals |
| 10 | 55 BP | Swarm start. High early mortality |

**Strategy Tips**:
- 3 founders is the sweet spot for most builds
- 1 founder only for heavily armored tanks or aggressive carnivores
- 10 founders for herding/swarming species
- Compounding costs are brutal: 5 founders + crowded biome = 74 BP or less

**Related**: "BP Budget", "Biomes & Seasons", "Reproduction"

---

#### Guide: Brain Design Basics (`br_basics`)

**Category**: Brain Design | **Try It**: "Open Brain Editor →" `/designer` (BrainTab)

**Summary**: The brain is a visual node graph connecting sensory inputs to behavioral outputs. Signals flow left-to-right: what it senses → processing → what it does. No programming — just drag connections.

**How It Works**:
- **Input nodes** (left): Real-time sensor data — food distance, energy level, nearby organism size, etc. Read-only.
- **Output nodes** (right): Drive actions — Accelerate, Rotate, Want2Eat, Want2Attack, Want2Flee. Most use sigmoid with 0.5 threshold.
- **Synapses**: Drag from node to node. Weight -5.0 to +5.0. Positive = excitatory (green), negative = inhibitory (red). `signal = sourceActivation x weight`.
- **Hidden nodes**: Processing nodes from palette. Each applies an activation function. Cost: 2 BP each.
- **Bias**: Every hidden/output node has adjustable bias (-5.0 to +5.0). Added before activation function.

**Key Numbers**:
- Synapse: 0.5 BP | Hidden node: 2 BP | Weight range: +/-5.0 | Bias range: +/-5.0
- Brain processes 4 times per second (every simulation tick)

**Strategy Tips**:
- Start with a template and modify — don't build from scratch until you understand the system
- Simplest useful brain: `PlantAngle → Rotate` + `Constant → Want2Eat` (2 synapses, 1 BP)
- Negative weights are powerful: `OrganismDist --[-3.0]--> Want2Flee` = "flee when CLOSE"
- Mental test: "when this input is high, what happens to the output?"

**Related**: "Activation Functions", "Hidden Nodes", "Template Walkthroughs"

---

#### Guide: Activation Functions (`br_activation`)

**Category**: Brain Design | **Try It**: "Open Brain Editor →" `/designer` (BrainTab)

**Summary**: Each node type transforms input differently. The right activation function determines whether a node makes binary decisions, proportional adjustments, or conditional gates.

**Interactive element**: Slider adjusting input value (-5 to +5) with real-time output curve for each function.

**Functions**:

- **Sigmoid** [0,1] default 0.5: S-curve. Negative → ~0, positive → ~1. Yes/no decisions. Most outputs use this.
- **Linear** [-100,100] default 0: Pass-through. Proportional control (steering). `PlantAngle → LIN → Rotate` = smooth turning.
- **ReLU** [0,100] default 0: Blocks negatives. With bias = "if above threshold." Conditional gating.
- **TanH** [-1,1] default 0: Like Sigmoid but centered on 0. Bipolar decisions (approach vs flee).
- **Latch** (T2) {0,1} default 0: Memory. Sets to 1 or 0 and stays. Persistent modes. Max 3 per brain.
- **Multiply** (T2) [-100,100] default 1: Inputs MULTIPLIED. AND-gate: any 0 input → 0 output.
- **Gaussian** (T3) [0,1] default 1.0: Sweet spot at input=0. Any deviation reduces output. "Exactly my size."
- **Differential** (T3) [-100,100] default 0: Rate of change. "Is it getting closer?" vs absolute distance.
- **Absolute** (T3) [0,100] default 0: Strips sign. "Any strong signal either direction."
- **Sine** (T4) [-1,1] default 0: Oscillating. Patrol patterns, rhythmic behaviors.
- **Integrator** (T4) [-100,100] default 0: Accumulates over time. "How long has this been happening?"
- **Inhibitory** (T4) [-100,100] default 0: Habituation. Strong response to novelty, fades if constant.

**Strategy Tips**:
- Most brains only need Sigmoid (decisions) and Linear (steering). Start simple.
- Multiply is the most powerful Tier 2 unlock — enables conditional logic impossible with summation
- Gaussian is the most elegant Tier 3 node — replaces 2-3 Sigmoid nodes for sweet-spot detection

**Related**: "Hidden Nodes", "Brain Design: Basics", "Complex Wiring Examples"

---

#### Guide: Hidden Nodes (`br_hidden`)

**Category**: Brain Design | **Try It**: "Open Brain Editor →" `/designer` (BrainTab)

**Summary**: Hidden nodes process signals between inputs and outputs. They're what make brains intelligent — without them, organisms can only do simple reactive behaviors.

**Available by Tier**:

| Tier | Nodes | Cost |
|------|-------|------|
| 1 (Free) | Sigmoid, Linear, ReLU, TanH | 2 BP each |
| 2 (50 EP) | Latch, Multiply | 2 BP each (Latch max 3) |
| 3 (200 EP) | Gaussian, Differential, Absolute | 2 BP each |
| 4 (500 EP) | Sine, Integrator, Inhibitory | 2 BP each |

**Common Patterns**:
- **Size gate** (ReLU): `OrganismSize --[-1.0]--> ReLU [bias: +0.5]` → fires when target smaller. Feed to Want2Attack.
- **AND condition** (Multiply): `isClose x isSmall x haveEnergy → Attack`. All must be positive.
- **State memory** (Latch): Detect predator → Latch=1 → flee mode → stays even after predator leaves.
- **Change detection** (Differential): `EnergyRatio → DIF` → positive=gaining energy, negative=starving.

**Strategy Tips**:
- A brain with 0 hidden nodes and 7 synapses (3.5 BP) sustains a herbivore. Only add hidden nodes for conditional logic.
- Each hidden node = 2 BP = same as View Radius 1.0. Don't add nodes you don't need.

**Related**: "Activation Functions", "Brain Design: Basics", "Processing Order"

---

#### Guide: Processing Order (`br_processing`)

**Category**: Brain Design | **Try It**: "Open Brain Editor →" `/designer` (BrainTab)

**Summary**: Signals propagate through the entire graph in a single tick — no multi-tick delay. Nodes process in topological order (inputs → hidden layers → outputs).

**Per-Tick Processing** (4x per second):
1. Update inputs (read organism state)
2. Propagate signals (`signal = source.activation x weight`)
3. Accumulate (sum or multiply incoming signals + bias)
4. Activate (apply activation function)
5. Apply outputs (drive behaviors)
6. Energy cost: `0.1 x numHiddenNodes x metabolism` per tick

**Strategy Tips**:
- Multi-layer hidden circuits process in one tick — no delay penalty
- Brain energy cost scales with hidden nodes AND metabolism
- Output defaults: Sigmoid outputs default to 0.5 (threshold). Set negative bias on unwanted outputs (e.g., Want2Attack bias -2.0 for herbivores)

**Related**: "Brain Design: Basics", "Hidden Nodes", "Activation Functions"

---

#### Guide: Template Walkthroughs (`br_templates`)

**Category**: Brain Design | **Try It**: "Open Brain Editor →" `/designer` (BrainTab)

**Summary**: Four pre-wired templates demonstrate effective patterns.

**Simple Grazer (Herbivore) — 7 synapses, 3.5 BP**:
```
NearestPlantAngle   --[+2.0]--> Rotate
NearestPlantDist    --[+3.0]--> Accelerate
Constant            --[+0.5]--> Accelerate
Constant            --[+2.0]--> Want2Eat
NearestPlantDist    --[-3.0]--> Want2Eat
NearestOrganismSize --[+4.0]--> Want2Flee
NearestOrganismDist --[-3.0]--> Want2Flee
```
Steers toward plants, accelerates toward distant food, eats when close, flees from large nearby organisms.

**Hunter (Carnivore) — 9 synapses + 1 ReLU, 6.5 BP**:
```
H1 (ReLU, bias +0.5):
  NearestOrganismSize --[-1.0]--> H1
H1                      --[+10.0]--> Want2Attack
NearestOrganismAngle    --[+3.0]-->  Rotate
NearestOrganismDist     --[-3.0]--> Want2Attack
H1                      --[+5.0]-->  Accelerate
Constant                --[+2.0]--> Want2Eat
NearestOrganismSize     --[+6.0]--> Want2Flee
NearestOrganismDist     --[-4.0]--> Want2Flee
Constant                --[+0.3]--> Accelerate
```
ReLU "size gate" prevents attacking larger organisms. Chases smaller targets, flees from larger.

**Scavenger — 7 synapses, 3.5 BP**:
```
NearestMeatAngle    --[+3.0]--> Rotate
NearestMeatDist     --[+3.0]--> Accelerate
Constant            --[+0.5]--> Accelerate
Constant            --[+2.0]--> Want2Eat
NearestMeatDist     --[-3.0]--> Want2Eat
Constant            --[+3.0]--> Want2Flee
NearestOrganismDist --[-4.0]--> Want2Flee
```
Seeks meat pellets, avoids all living organisms. Cowardly but effective.

**Balanced Omnivore — 10 synapses, 5 BP**:
```
NearestPlantAngle   --[+1.5]--> Rotate
NearestMeatAngle    --[+2.0]--> Rotate
NearestPlantDist    --[+1.5]--> Accelerate
NearestMeatDist     --[+1.5]--> Accelerate
Constant            --[+0.3]--> Accelerate
Constant            --[+2.0]--> Want2Eat
NearestPlantDist    --[-1.5]--> Want2Eat
NearestMeatDist     --[-1.5]--> Want2Eat
NearestOrganismSize --[+4.0]--> Want2Flee
NearestOrganismDist --[-3.0]--> Want2Flee
```
Seeks both food types (meat slightly preferred). Flees from large organisms. No combat.

**Related**: "Brain Design: Basics", "Complex Wiring Examples", "Emergent Drives"

---

#### Guide: Emergent Drives (`br_drives`)

**Category**: Brain Design | **Try It**: "Open Brain Editor →" `/designer` (BrainTab)

**Summary**: Emotional-like behaviors emerge from neural wiring patterns — curiosity, aggression, fear, territoriality — without any explicit emotion system.

**Patterns**:

- **Curiosity**: `NFood --[-2.0]--> Accelerate` + `Constant --[+1.0]--> Accelerate`. No food visible → move forward. Food found → slow down. Creates exploration.
- **Aggression**: `Constant --[+3.0]--> Want2Attack` + `OrganismDist --[-4.0]--> Want2Attack`. Attack anything close regardless of size. Risky but intimidating.
- **Territorial guarding**: `NearestAllyDist --[-2.0]--> SIG → Accelerate` (Tier 2). Far from allies → move more. Combined with `AllyAngle → Rotate` → orbit group territory.
- **Hunger-driven risk**: `EnergyRatio --[-3.0]--> MULT, OrganismDist --[-2.0]--> MULT → Want2Attack`. Low energy AND close target → attack. Well-fed organisms stay peaceful.

**Strategy Tips**:
- Emergent drives are more mutation-robust than complex state machines
- Simplest drives use 2-3 synapses. More synapses add nuance but cost BP and mutation fragility
- Observe in follow mode to see if the intended drive actually manifests

**Related**: "Template Walkthroughs", "Complex Wiring Examples", "Hidden Nodes"

---

#### Guide: Complex Wiring Examples (`br_complex`)

**Category**: Brain Design | **Try It**: "Open Brain Editor →" `/designer` (BrainTab)

**Summary**: Advanced multi-node circuits demonstrating the full depth of the brain system. Require Tier 2-4 nodes and significant BP investment.

**Example 1: Nesting Behavior (Tier 3)**

Goal: Find safe spot → burrow → lay egg → guard nest.

```
EggStored               --[+3.0]--> SIG_nest
SIG_nest                --[+2.0]--> Burrow
SIG_nest                --[+2.0]--> Want2Reproduce

Post-lay guard circuit:
NearestEggAngle         --[+2.0]--> Rotate
NearestEggDist          --[+1.5]--> Accelerate

Intruder defense (MULT_guard):
NearestOrganismDist     --[-2.0]--> MULT_guard
Constant                --[+2.0]--> MULT_guard
NearestEggDist          --[-2.0]--> MULT_guard
Constant                --[+2.0]--> MULT_guard
MULT_guard              --[+3.0]--> Want2Attack
```

When egg ready → burrow + lay. After laying → stay near eggs. When intruder close AND near eggs → attack.
Cost: 2 hidden nodes (4 BP) + ~11 synapses (5.5 BP) = 9.5 BP.

---

**Example 2: Food Courier (Tier 2+3)**

Goal: When full, grab nearby food → carry to ally → release.

```
Phase 1 (grab when full):
EnergyRatio             --[+3.0]--> MULT_fullgrab
Constant                --[+2.0]--> SIG_closefood
NearestPlantDist        --[-3.0]--> SIG_closefood
SIG_closefood           --[+2.0]--> MULT_fullgrab
MULT_fullgrab           --[+2.0]--> Grab

Phase 2 (carry to ally):
IsGrabbing              --[+2.0]--> MULT_carry
NearestAllyAngle        --[+2.0]--> MULT_carry
MULT_carry              --[+2.0]--> Rotate
IsGrabbing              --[+1.5]--> Accelerate

Phase 3 (release near ally):
IsGrabbing              --[+2.0]--> MULT_release
Constant                --[+2.0]--> SIG_allyclose
NearestAllyDist         --[-3.0]--> SIG_allyclose
SIG_allyclose           --[+2.0]--> MULT_release
MULT_release            --[-3.0]--> Grab
```

Organisms become "food couriers" — forage, grab pellets, carry to allies, release. Emergent cooperative feeding.
Cost: 4 hidden nodes (8 BP) + ~13 synapses (6.5 BP) = 14.5 BP.

---

**Example 3: Seasonal Breeding Suppression (Tier 3)**

Goal: Only reproduce in spring/summer.

```
SeasonPhase             --[-2.0]--> SIG_winterblock
Constant                --[+1.0]--> SIG_winterblock

SIG_winterblock         --[+2.0]--> MULT_seasonbreed
EggStored               --[+2.0]--> MULT_seasonbreed
MULT_seasonbreed        --[+3.0]--> Want2Reproduce
```

In spring/summer (SeasonPhase low), `SIG_winterblock` fires → breeding enabled. In winter (SeasonPhase high), signal suppressed → no breeding. Combined with Fat Reserves creates "winter hibernators."
Cost: 2 hidden nodes (4 BP) + 5 synapses (2.5 BP) = 6.5 BP.

**Related**: "Template Walkthroughs", "Hidden Nodes", "Activation Functions"

---

#### Guide: Biomes & Seasons (`tw_biomes`)

**Category**: The World | **Try It**: "Open World View →" `/world`

**Summary**: Five biomes and four seasons create dynamic environments where no single strategy is permanently optimal.

**Biomes**:

| Biome | Plants | Visibility | Movement | Special |
|-------|--------|------------|----------|---------|
| Grassland | High (1.0x) | Normal | Normal | Standard. Best for beginners |
| Forest | Very High (1.5x) | Reduced (0.7x) | Normal | Dense food, low visibility |
| Desert | Very Low (0.2x) | Extended (1.3x) | Costly (1.3x) | Sparse food, clear sightlines |
| Wetland | Medium (0.8x) | Normal | Slow (0.7x) | Fast decay, 3x fungi |
| Rocky | Low (0.3x) | Normal | Normal | Sparse food, cheap burrowing |

**Seasons** (~28 real-time days):

| Season | Days | Plants | Metabolism | Special |
|--------|------|--------|------------|---------|
| Spring | 1-7 | 1.5x | 0.9x | Reproduction -20%. Wetland expands |
| Summer | 8-14 | 1.0x | 1.15x | View +10%. Desert expands |
| Autumn | 15-21 | 0.7x | 1.0x | Larger pellets. Meat decays slower |
| Winter | 22-28 | 0.3x | 1.3x | Food scarce. Wetland freezes |

**Strategy Tips**:
- Grassland herbivores thrive in spring, struggle in winter
- Desert builds need high View Radius and efficient metabolism
- Forest is ideal for Camouflage predators
- Rocky is cheap to deploy in and good for burrowing species

**Related**: "Energy Cycle", "Founder Strategy", "Unlockable Traits Guide"

---

#### Guide: Energy Cycle (`tw_energy`)

**Category**: The World | **Try It**: "Open World View →" `/world`

**Summary**: Total world energy is conserved. Plants grow from biomass, organisms eat plants/each other, dead organisms become meat, decaying matter returns to biomass.

**Energy forms**: Free Biomass → Plant Pellets → Organism Energy → Meat Pellets → Free Biomass (cycle)

**Plant spawn**: `rate = biomeFertility x seasonMult x (freeBiomass / totalEnergy)`. Population crashes → plant blooms. Population booms → plant scarcity.

**Key Numbers**:
- Plant: 1.0 energy/unit, max 55% efficiency
- Meat: 3.0 energy/unit, max 80% efficiency
- Density-dependent growth prevents herbivore monopolies

**Strategy Tips**:
- After population crashes, the plant bloom is a great time to deploy herbivores
- Fat Reserves let organisms store energy during abundance
- In many-herbivore ecosystems, meat becomes abundant from natural deaths — scavengers thrive

**Related**: "Biomes & Seasons", "Diet & Digestion", "Ageing, Entropy & Death"

---

#### Guide: Day/Night Cycle (`tw_daynight`)

**Category**: The World | **Try It**: "Open World View →" `/world`

**Summary**: Day/night affects visibility. Night reduces view radius by 30% for all organisms. Echolocation is unaffected.

**Strategy Tips**:
- Echolocation is especially valuable in Forest at night (stacking visibility reductions)
- Nocturnal predator: Echolocation + Camouflage + high Speed

**Related**: "Biomes & Seasons", "Unlockable Traits Guide", "All Stats Explained"

---

#### Guide: Fungi & Environmental Modifiers (`tw_fungi`)

**Category**: The World | **Try It**: "Open World View →" `/world`

**Summary**: Fungi patches spawn naturally and modify local environment — increase plant growth, slow organisms, apply mild toxin. More frequent in Wetland (3x). Regenerate in spring, wither in winter.

**Strategy Tips**:
- High Immune System protects against toxic fungi
- Fungi can create "safe zones" by slowing pursuing predators
- Wetland specialists should account for frequent fungal patches

**Related**: "Biomes & Seasons", "Energy Cycle", "Unlockable Traits Guide"

---

#### Guide: Reproduction — Asexual (`lc_repro`)

**Category**: Lifecycle | **Try It**: "Open World View →" `/world` (follow a mature organism)

**Summary**: Single mature, healthy organisms with enough energy produce eggs that hatch into near-clones with small random mutations.

**How It Works**:
- Requires maturity, HP >= 50%, sufficient energy
- Tier 1-2: automatic when conditions met. Tier 3+: requires `Want2Reproduce > 0.5`
- Egg deposited near parent, incubates, hatches. Offspring inherits design with mutations
- Energy cost proportional to organism size

**Strategy Tips**:
- Efficient feeding = more energy = more reproduction = larger population
- Spring reproduction cost -20%. Time population booms for spring
- At Tier 3, wire `EggStored → Want2Reproduce` for conscious breeding control

**Related**: "Sexual Reproduction", "Genetics & Mutation", "Nesting & Eggs"

---

#### Guide: Sexual Reproduction (`lc_sexual`)

**Category**: Lifecycle | **Try It**: "Open Body Designer →" `/designer` (requires Tier 3)

**Summary**: Sexual Reproduction trait introduces two sexes, mate-seeking, and genetic recombination. More diversity but organisms must find mates.

**How It Works**:
- Purchase trait (3-8 BP). Each organism randomly assigned female/male
- Both must be touching, mature, express `Want2Mate > 0.5`
- Offspring recombines both parents' genes with crossover + mutation
- Brain inputs: `NearestMateAngle/Dist`, `Sex`, `MatingCooldown`

**Strategy Tips**:
- Wire `NearestMateAngle → Rotate` and `Want2Mate` for mate-seeking
- Pair with Herd Coordination to keep organisms grouped (easier mate-finding)
- More genetic diversity = faster adaptation through mutations

**Related**: "Reproduction (Asexual)", "Genetics & Mutation", "Herding & Flocking"

---

#### Guide: Genetics & Mutation (`lc_genetics`)

**Category**: Lifecycle | **Try It**: "Open Dashboard →" `/home` (Daily Mutation)

**Summary**: Offspring have small random mutations. Daily mutations apply player-chosen changes. Together they create in-simulation evolution.

**How It Works**:
- **Birth mutations**: Synapse weight shifts +/-0.1-0.3, ~5% chance of synapse add/remove
- **Daily mutations**: 3 options per day, affects all living organisms + future offspring
- **Sexual recombination**: Crossover between parents' synapses, then mutation on top

**Strategy Tips**:
- Simpler brains (fewer synapses) are more mutation-robust
- Watch population after applying daily mutations for harmful effects
- Sometimes skipping daily mutation is the best choice for a stable species

**Related**: "Reproduction", "Sexual Reproduction", "Ageing, Entropy & Death"

---

#### Guide: Ageing, Entropy & Death (`lc_ageing`)

**Category**: Lifecycle | **Try It**: "Open Dashboard →" `/home` (Species Stats)

**Summary**: Organisms age and die. Long-running species accumulate entropy (gradual weakening) to prevent permanent dominance.

**How It Works**:
- **Ageing**: Natural lifespan scaled by metabolism. Elderly lose max HP and speed
- **Death causes**: Starvation, predation, old age, venom
- **Species entropy**: Multiplier increasing over time since deployment. At 2.0x, everything costs double energy
- Death returns energy to world as meat pellets

**Strategy Tips**:
- When entropy bites, retire and deploy fresh — you keep all EP/unlocks
- High-generation species earn more EP before entropy, so run a species until entropy matters
- Entropy affects energy costs, not brain effectiveness

**Related**: "Energy Cycle", "Your First Redesign", "EP, Unlocks & Achievements"

---

#### Guide: Nesting & Eggs (`lc_nesting`)

**Category**: Lifecycle | **Try It**: "Open World View →" `/world`

**Summary**: Eggs near same-species eggs incubate faster (Nest Affinity). Tier 3 inputs enable conscious nest-guarding behavior.

**How It Works**:
- Nest Affinity (design parameter): higher = faster incubation near same-species eggs
- Tier 3 inputs: `NearbyEggCount`, `NearestEggAngle/Dist` for egg detection
- Guard circuits: wire egg inputs to movement (stay near) and attack (defend)

**Strategy Tips**:
- High Nest Affinity + Herd Coordination = natural nesting colonies
- Burrowing near eggs adds protection (80% damage reduction while guarding)
- See "Complex Wiring: Nesting Behavior" for complete guard circuit

**Related**: "Reproduction", "Complex Wiring Examples", "Unlockable Traits Guide"

---

#### Guide: Attack Resolution (`cs_attack`)

**Category**: Combat & Survival | **Try It**: "Open World View →" `/world`

**Summary**: `damage = Want2Attack_output x (STR x Size - target.DEF) x biteDmgSetting`. STR must exceed target DEF for meaningful damage.

**Key Numbers**:
- Attack triggers at Want2Attack > 0.5 while touching target
- DEF 1.0 blocks 9%, DEF 2.0 blocks 17%, DEF 4.0 blocks 29%
- Venom bypasses armor (separate DoT)

**Strategy Tips**:
- Size x STR is the key attack stat
- Hunter template's ReLU size-gate prevents wasting energy on larger targets
- Venom counters high-DEF targets

**Related**: "Venom", "Armor & Burrowing", "Flee & Sprint"

---

#### Guide: Venom (`cs_venom`)

**Category**: Combat & Survival | **Try It**: "Open Body Designer →" `/designer` (requires Tier 2)

**Summary**: Venom Glands add damage-over-time to attacks, bypassing armor. `venomDPS = potency x attackOutput`. Duration 5-10s. Countered by Immune System.

**Strategy Tips**:
- "Assassin" build: small, fast, venomous. Hit-and-run against larger targets
- Pair with Camouflage for stealth attacks
- Against venom: invest in Immune System

**Related**: "Attack Resolution", "Armor & Burrowing", "Camouflage"

---

#### Guide: Armor & Burrowing (`cs_armor`)

**Category**: Combat & Survival | **Try It**: "Open Body Designer →" `/designer`

**Summary**: Armor Plating (Tier 2) stacks with DEF. Burrowing (Tier 3) = underground, invisible, 80% damage reduction, immobile.

**Strategy Tips**:
- "Tank" build: Size 1.5+, DEF 3.0+, Armor. Nearly unkillable by physical attacks
- Burrowing + high View Radius: spot prey underground, surface to attack
- Armor is less useful vs venom — complement with Immune System

**Related**: "Attack Resolution", "Venom", "Flee & Sprint"

---

#### Guide: Camouflage (`cs_camo`)

**Category**: Combat & Survival | **Try It**: "Open Body Designer →" `/designer` (requires Tier 3)

**Summary**: Camouflage reduces visibility based on speed. Stationary = nearly invisible. Countered by Echolocation.

**Strategy Tips**:
- Ambush carnivore: Camouflage + moderate STR + burst Speed
- Most effective in Forest (stacking visibility reductions)
- Counter: Echolocation detects camouflaged organisms

**Related**: "Attack Resolution", "Armor & Burrowing", "Unlockable Traits Guide"

---

#### Guide: Flee & Sprint (`cs_flee`)

**Category**: Combat & Survival | **Try It**: "Open Brain Editor →" `/designer` (BrainTab)

**Summary**: `Want2Flee > 0.5` = sprint mode. Speed x1.5, energy cost x3. Emergency escape tool.

**Strategy Tips**:
- Grazer template's flee circuit is efficient: only flee from large AND close threats
- Don't wire `Constant → Want2Flee` — perpetual sprinting starves the organism
- High Speed + Sprint = very fast but expensive. Detecting threats early is better than outrunning them

**Related**: "Attack Resolution", "Brain Design: Basics", "Template Walkthroughs"

---

#### Guide: Pheromones (`cm_phero`)

**Category**: Communication | **Try It**: "Open Brain Editor →" `/designer` (requires Tier 4)

**Summary**: 3 chemical signal channels. Emit pheromones, others detect strength + direction gradient. Enables alarm signals, food trails, territory markers.

**Example — Alarm Pheromone**:
```
Emitter:  EnergyRatio --[-2.0]--> EmitPheromone1
Receiver: Pheromone1Strength --[+3.0]--> Want2Flee
          Pheromone1Angle --[-2.0]--> Rotate  (turn AWAY)
```

**Strategy Tips**:
- Use different channels for different signals (Red=danger, Green=food, Blue=mating)
- Cross-species exploitation: follow another species' alarm pheromone toward prey
- Emission costs energy per tick — wire to specific conditions

**Related**: "Sound Signals", "Encounter Info Sharing", "Complex Wiring Examples"

---

#### Guide: Sound Signals (`cm_sound`)

**Category**: Communication | **Try It**: "Open Brain Editor →" `/designer` (requires Tier 4)

**Summary**: Broadcast acoustic signals with controllable frequency. Range up to 3x View Radius. Instantaneous (unlike pheromones). Energy cost scales quadratically.

**Strategy Tips**:
- Species-specific calls: set unique SoundFrequency gene. Receivers match frequency
- Warning calls: `AttackedDamage → EmitSound` broadcasts "I'm being attacked!"
- Sound is different from Echolocation (passive detection enhancement)

**Related**: "Pheromones", "Encounter Info Sharing", "Herding & Flocking"

---

#### Guide: Encounter Info Sharing (`cm_encounter`)

**Category**: Communication | **Try It**: "Open Body Designer →" `/designer` (requires Tier 4)

**Summary**: Read nearby allies' internal state at close range — energy, health, heading, last food/threat direction, mating desire. Same-species only.

**Example — Cooperative Foraging**:
```
AllyLastFoodAngle --[+2.0]--> Rotate
AllyEnergyRatio   --[-2.0]--> Accelerate
```

**Strategy Tips**:
- Most powerful with Herd Coordination (grouped organisms share info naturally)
- `AllyLastThreatAngle` enables group flee — one detects predator, all learn threat direction
- 7 new inputs for 5-12 BP — evaluate which ally-state info your brain actually uses

**Related**: "Pheromones", "Sound Signals", "Herding & Flocking"

---

#### Guide: Herding & Flocking (`cm_herding`)

**Category**: Communication | **Try It**: "Open Body Designer →" `/designer` (requires Tier 3)

**Summary**: `Herding` output activates flocking (separation, alignment, cohesion) with heritable gene weights. Organisms move as cohesive groups.

**Strategy Tips**:
- Herding + herbivore = safety in numbers
- Herding makes mate-finding easy (important for Sexual Reproduction)
- Over-tight herds compete for same food — balance flock vs individual foraging

**Related**: "Encounter Info Sharing", "Sexual Reproduction", "Founder Strategy"

---

#### Guide: Dominance Scoring (`ec_dominance`)

**Category**: Ecosystem | **Try It**: "Open Leaderboard →" `/leaderboard`

**Summary**: Leaderboard ranks by Dominance Score = population + territory + food chain position. Updated every 60 seconds.

**Strategy Tips**:
- Population count is easiest to maximize — efficient herbivores breed fast
- Territorial spread requires Spore Dispersal or multi-biome builds
- Herbivores dominate early; carnivores can overtake later (food chain bonus)

**Related**: "Food Chain & Balance", "Keystone Species", "EP, Unlocks & Achievements"

---

#### Guide: Food Chain & Balance (`ec_foodchain`)

**Category**: Ecosystem | **Try It**: "Open World View →" `/world`

**Summary**: Natural predator-prey dynamics, energy conservation, and density-dependent growth create self-balancing ecosystems.

**Strategy Tips**:
- A world with no carnivores → herbivore boom then crash as plants are overgrazed
- Entering a herbivore-dominated ecosystem with a good carnivore = highly successful
- The scavenger niche is underrated: eat meat from natural deaths without combat risk
- Watch population oscillations in Statistics Dashboard — time deploys to prey abundance

**Related**: "Energy Cycle", "Dominance Scoring", "Keystone Species"

---

#### Guide: Keystone Species (`ec_keystone`)

**Category**: Ecosystem | **Try It**: "Open Leaderboard →" `/leaderboard`

**Summary**: Species filling unique ecological niches get a Keystone scoring bonus — the only carnivore, only burrower, or only species in a biome.

**Strategy Tips**:
- Check leaderboard to see which niches are filled
- Deploy in underpopulated biomes for free deployment AND keystone bonus
- Unique trait combinations can trigger keystone status

**Related**: "Dominance Scoring", "Food Chain & Balance", "Biomes & Seasons"

---

#### Guide: Ecological Events (`ec_events`)

**Category**: Ecosystem | **Try It**: "Open Event Log →" `/events`

**Summary**: Periodic world events (droughts, algae blooms, predator surges) create temporary pressure rewarding adaptable species.

**Strategy Tips**:
- Fat Reserves help survive food scarcity events
- Multi-biome presence (via Spore Dispersal) provides resilience
- Events create opportunities: predator surge → abundant meat for scavengers

**Related**: "Biomes & Seasons", "Energy Cycle", "Unlockable Traits Guide"

---

#### Guide: World View Controls (`sp_worldview`)

**Category**: Spectating & Progression | **Try It**: "Open World View →" `/world`

**Summary**: Zoom, pan, follow organisms, toggle overlays. Three LOD tiers: Dot (population overview), Sprite (behavior watching), Detail (full rendering).

**Strategy Tips**:
- Dot tier to survey territory spread
- Sprite tier to watch hunting/feeding behavior
- Perception mode shows fog-of-war from organism's perspective

**Related**: "Follow Mode Tools", "Biomes & Seasons", "EP, Unlocks & Achievements"

---

#### Guide: Follow Mode Tools (`sp_follow`)

**Category**: Spectating & Progression | **Try It**: "Open World View →" `/world` (tap organism)

**Summary**: Camera follows single organism showing real-time behavior, brain activity, sensory info. Enter by tapping organism, exit by tapping background.

**Overlays**: Vision cone, brain node activations, perception mode (fog-of-war), stats panel (health, energy, age, generation).

**Strategy Tips**:
- Brain overlay shows which outputs fire — if Want2Eat never fires, check wiring
- Vision cone shows exactly what's detected — if missing nearby food, increase View Radius
- Follow newly hatched organisms to see mutation effects

**Related**: "World View Controls", "Brain Design: Basics", "Spectating (Introduction #14)"

---

#### Guide: EP, Unlocks & Achievements (`sp_progression`)

**Category**: Spectating & Progression | **Try It**: "Open Profile →" `/profile`

**Summary**: EP earned passively from organism performance. Unlocks new traits and brain nodes across 4 tiers. 17 achievements grant bonus EP.

**Key Numbers**:

| Tier | EP Cost | Brain Unlocks | Body Unlocks |
|------|---------|---------------|-------------|
| 1 | Free | 11 in, 5 out, 4 hidden | 9 core sliders |
| 2 | 50 EP | +8 in, +4 out, +2 hidden (Latch, Multiply) | Armor, Venom, Echolocation |
| 3 | 200 EP | +15 in, +5 out, +3 hidden (Gaussian, Differential, Absolute) | Burrowing, Camo, Fat, Spore, Herd, Sexual |
| 4 | 500 EP | +17 in, +5 out, +3 hidden (Sine, Integrator, Inhibitory) | Encounter Info Sharing |

Total: 750 EP (~2.5 months at ~10 EP/day).

**Strategy Tips**:
- Population milestones early — 25 alive = 15 EP
- Generation depth gives biggest single payouts (50 gen = 100 EP)
- Each tier dramatically expands possibilities. Tier 2 Multiply alone enables conditional logic

**Related**: "What Is Life Game?", "Your First Redesign", "Dominance Scoring"

---

## 5. Layer 4: Unlock-Triggered Education

Each tier transition triggers a one-time `UnlockEducationModal` — a celebratory full-screen modal that introduces the newly unlocked capabilities with suggested first experiments.

### 5.1 Tier 2 Unlock (50 EP)

**Celebration**: Confetti animation + "Tier 2 Unlocked!" header

**New capabilities revealed**:

**Brain — New Inputs (8)**:
`Speed`, `Maturity`, `NearestAllyAngle`, `NearestAllyDist`, `NOrganisms`, `NFood`, `IsGrabbing`, `AttackedDamage`

**Brain — New Outputs (4)**:
`Want2Grow`, `Digestion`, `Grab`, `Want2Heal`

**Brain — New Hidden Nodes (2)**:
`Latch` (memory — stays ON until reset), `Multiply` (AND-gate — all inputs must be positive)

**Body — New Traits (3)**:
`Armor Plating` (stacking damage reduction), `Venom Glands` (damage-over-time bypass), `Echolocation` (dark/forest detection)

**Suggested first experiment**:
> **Try this**: Connect `EnergyRatio → Want2Grow` so organisms grow when well-fed. Wire `AttackedDamage → Want2Heal` for automatic injury response.
>
> **Advanced**: Use a `Multiply` node to create AND-logic: `isTargetSmall × isTargetClose → Want2Attack`. Your carnivore will only attack when BOTH conditions are true.

**Annotated wiring diagram**: Simple visual showing `EnergyRatio --[+2.0]--> Want2Grow` and `AttackedDamage --[+3.0]--> Want2Heal` with labeled explanations.

### 5.2 Tier 3 Unlock (200 EP)

**Celebration**: Larger confetti + "Tier 3 Unlocked!" + organism evolution animation

**New capabilities revealed**:

**Brain — New Inputs (15)**:
`Tic`, `TimeAlive`, `EggStored`, `BiomeType`, `SeasonPhase`, `NearestOrganismColor`, `NearestAllyCount`, `StomachPlantRatio`, `NearestMateAngle`, `NearestMateDist`, `Sex`, `MatingCooldown`, `NearbyEggCount`, `NearestEggAngle`, `NearestEggDist`

**Brain — New Outputs (6)**:
`Want2Reproduce`, `Herding`, `ClockReset`, `Burrow`, `Want2Mate`, `StoreFat`

**Brain — New Hidden Nodes (3)**:
`Gaussian` (sweet-spot detection), `Differential` (rate-of-change detection), `Absolute` (magnitude regardless of sign)

**Body — New Traits (6)**:
`Burrowing`, `Camouflage`, `Fat Reserves`, `Spore Dispersal`, `Herd Coordination`, `Sexual Reproduction`

**Suggested first experiment**:
> **Try this**: Wire `EggStored → Want2Reproduce` so organisms lay eggs when ready. Add `SeasonPhase` to suppress breeding in winter (see Seasonal Breeding example in the guide).
>
> **Advanced**: Use `Gaussian` to attack organisms exactly your size: `NearestOrganismSize --[+1.0]--> GAU [bias: -0.5] → Want2Attack`. Or try `Differential` on `EnergyRatio` to detect "gaining vs losing energy" and switch between foraging and fleeing modes.

**Annotated wiring diagram**: Visual showing `EggStored --[+2.0]--> Want2Reproduce` with seasonal suppression circuit.

### 5.3 Tier 4 Unlock (500 EP)

**Celebration**: Full-screen celebration with organism showcase animation + "Tier 4 Unlocked — Full Mastery!"

**New capabilities revealed**:

**Brain — New Inputs (17)**:
`Pheromone1/2/3Strength`, `Pheromone1/2/3Angle`, `SoundDirection`, `SoundIntensity`, `SoundFrequency`, `IsBurrowed`, `AllyEnergyRatio`, `AllyHealthRatio`, `AllyHeading`, `AllyLastFoodAngle`, `AllyLastThreatAngle`, `AllyWant2Mate`, `AllyReproductiveState`

**Brain — New Outputs (5)**:
`EmitPheromone1`, `EmitPheromone2`, `EmitPheromone3`, `EmitSound`, `SoundFrequency`

**Brain — New Hidden Nodes (3)**:
`Sine` (oscillating patterns), `Integrator` (cumulative tracking), `Inhibitory` (habituation/novelty detection)

**Body — New Traits (1)**:
`Encounter Info Sharing`

**Suggested first experiment**:
> **Try this**: Wire `EnergyRatio --[-2.0]--> EmitPheromone1` so organisms emit alarm pheromone when hungry. On other organisms, wire `Pheromone1Angle → Rotate` to create cooperative foraging — hungry organisms call for help, well-fed organisms navigate toward the signal.
>
> **Advanced**: Create species-specific sound calls: set a unique `SoundFrequency` gene, wire `AttackedDamage → EmitSound` for distress calls, and wire receivers to respond only when `SoundFrequency` matches your species' frequency. Or combine `Encounter Info Sharing` + `Herding` for fully cooperative swarms that share food locations and threat warnings.

**Annotated wiring diagram**: Visual showing alarm pheromone emitter + receiver circuit.

### 5.4 Modal Behavior

- Modal appears once per tier transition, immediately after `checkUnlocks()` detects a new tier
- Cannot be dismissed accidentally — requires explicit "Got It" button press
- "Explore in Designer →" button navigates to `/designer` BrainTab after dismissal
- "Open Guide →" button opens the relevant tier's guide section in GlobalHelpModal
- Modal state tracked in `onboardingStore.tierUnlocksSeen`
- If player levels up while offline, modal appears on next login (after "While You Were Away")

---

## 6. Learning Journey Map

Complete curriculum table mapping every game system to its teaching layer, trigger, format, and content. This ensures no system goes untaught and no teaching moment is duplicated.

### 6.1 Full Curriculum

| # | System/Concept | Teaching Layer | Trigger | Format | Location | Content Summary |
|---|---------------|---------------|---------|--------|----------|----------------|
| 1 | Game concept | L1 Quick Start | First login | Splash | OnboardingStep1 | "Design, brain, watch it live" |
| 2 | Archetypes | L1 Quick Start | Step 2 | Archetype cards | OnboardingStep2 | 4 cards with 1-line descriptions |
| 3 | Size/Speed/Diet | L1 Quick Start | Step 2 | 3 sliders | OnboardingStep2 | Simplified slider labels |
| 4 | Brain basics | L1 Quick Start | Step 3 | Guided drag | OnboardingStep3 | "Drag input to output" |
| 5 | Templates | L1 Quick Start | Step 3 | Button | OnboardingStep3 | "Use Template" option |
| 6 | Biome choice | L1 Quick Start | Step 4 | Biome buttons | OnboardingStep4 | 5 biome buttons, Grassland default |
| 7 | Deployment | L1 Quick Start | Step 4 | Deploy button | OnboardingStep4 | "Release Into The World" |
| 8 | Autonomous behavior | L1 Quick Start | Post-deploy | Floating cards | WorldScreen | "Watch it explore" sequence |
| 9 | Vision cone | L1 Quick Start | Post-deploy T+5s | Floating card | WorldScreen | "That's what it can see" |
| 10 | Feeding | L1 Quick Start | Post-deploy eat event | Floating card | WorldScreen | "It found food!" |
| 11 | Persistence | L1 Quick Start | Post-deploy T+30s | Floating card | WorldScreen | "They live on their own" |
| 12 | While You Were Away | L2 Introduction | 2nd login | InlineTeachCard | Dashboard | Contextual teaching per event type |
| 13 | Follow mode | L2 Introduction | First organism tap | InlineTeachCard | WorldScreen | "Watch brain make decisions" |
| 14 | BP budget (deep) | L2 Introduction | 2nd BodyTab visit | InlineTeachCard | BodyTab | "100 BP shared body + brain" |
| 15 | Hidden sliders | L2 Introduction | 2nd BodyTab visit | InlineTeachCard | BodyTab | "6 more sliders in Fine-Tune" |
| 16 | Reproduction | L2 Introduction | First egg event | EventTeachToast | WorldScreen | "Offspring inherit brain + mutations" |
| 17 | Death & energy | L2 Introduction | First death event | EventTeachToast | WorldScreen | "Energy returns as meat pellets" |
| 18 | Daily mutation | L2 Introduction | First mutation badge | InlineTeachCard | Dashboard | "3 options per day" |
| 19 | Hidden nodes | L2 Introduction | 2nd BrainTab visit | InlineTeachCard | BrainTab | "Processing nodes between I/O" |
| 20 | Synapse weights | L2 Introduction | First synapse tap | InlineTeachCard | BrainTab | "Positive = excitatory, negative = inhibitory" |
| 21 | Node bias | L2 Introduction | First node tap | InlineTeachCard | BrainTab | "Shifts default activation" |
| 22 | Biome differences | L2 Introduction | Pan to non-Grassland | InlineTeachCard | WorldScreen | "Different plant density, visibility, movement" |
| 23 | Seasons | L2 Introduction | First season change | EventTeachToast | Dashboard+World | "~28-day cycle, Winter is harsh" |
| 24 | Combat | L2 Introduction | First attack event | EventTeachToast | WorldScreen | "STR x Size vs DEF" |
| 25 | Spectating tools | L2 Introduction | 60s follow mode | InlineTeachCard | WorldScreen | "Vision cone, brain overlay, perception" |
| 26 | Leaderboard | L2 Introduction | First ranking | InlineTeachCard | Dashboard | "Dominance = pop + territory + food chain" |
| 27 | Species entropy | L2 Introduction | Entropy > 2.0x | InlineTeachCard | Dashboard | "Gradual weakening, retire and redesign" |
| 28 | Extinction | L2 Introduction | First extinction | InlineTeachCard | ExtinctionModal | "AI placeholder, keep EP/unlocks" |
| 29 | Tier 2 features | L4 Unlock | 50 EP reached | UnlockModal | Overlay | Latch, Multiply, Armor, Venom, Echolocation, Grab, Grow, Heal, Digestion |
| 30 | Tier 3 features | L4 Unlock | 200 EP reached | UnlockModal | Overlay | Gaussian, Differential, Absolute, Reproduce, Burrow, Herd, Mate, StoreFat, Camouflage, Fat Reserves, Spore, Sexual Repro |
| 31 | Tier 4 features | L4 Unlock | 500 EP reached | UnlockModal | Overlay | Sine, Integrator, Inhibitory, Pheromones, Sound, Encounter Info Sharing |
| 32 | What Is Life Game? | L3 Deep Dive | Pull (help menu) | GuidePage | GlobalHelpModal | Full game overview |
| 33 | How the World Works | L3 Deep Dive | Pull | GuidePage | GlobalHelpModal | Persistent simulation, energy, biomes |
| 34 | First Redesign | L3 Deep Dive | Pull | GuidePage | GlobalHelpModal | Common issues, iteration tips |
| 35 | BP Budget | L3 Deep Dive | Pull | GuidePage | GlobalHelpModal | Cost formulas, all stat costs |
| 36 | All Stats Explained | L3 Deep Dive | Pull | GuidePage | GlobalHelpModal | 9 sliders with mechanics |
| 37 | Diet & Digestion | L3 Deep Dive | Pull | GuidePage | GlobalHelpModal | Enzyme match, efficiency, stomach |
| 38 | Unlockable Traits | L3 Deep Dive | Pull | GuidePage | GlobalHelpModal | All 11 traits with costs/tiers |
| 39 | Founder Strategy | L3 Deep Dive | Pull | GuidePage | GlobalHelpModal | Founder count tradeoffs |
| 40 | Brain Basics | L3 Deep Dive | Pull | GuidePage | GlobalHelpModal | Nodes, synapses, weights, bias |
| 41 | Activation Functions | L3 Deep Dive | Pull | GuidePage | GlobalHelpModal | All 12 functions with curves |
| 42 | Hidden Nodes | L3 Deep Dive | Pull | GuidePage | GlobalHelpModal | Tier availability, common patterns |
| 43 | Processing Order | L3 Deep Dive | Pull | GuidePage | GlobalHelpModal | Per-tick pipeline, topological order |
| 44 | Template Walkthroughs | L3 Deep Dive | Pull | GuidePage | GlobalHelpModal | 4 templates with explanations |
| 45 | Emergent Drives | L3 Deep Dive | Pull | GuidePage | GlobalHelpModal | Curiosity, aggression, territory, hunger-risk |
| 46 | Complex Wiring | L3 Deep Dive | Pull | GuidePage | GlobalHelpModal | Nesting, food courier, seasonal breeding |
| 47 | Biomes & Seasons | L3 Deep Dive | Pull | GuidePage | GlobalHelpModal | 5 biomes, 4 seasons, interactions |
| 48 | Energy Cycle | L3 Deep Dive | Pull | GuidePage | GlobalHelpModal | 5 energy forms, conservation |
| 49 | Day/Night | L3 Deep Dive | Pull | GuidePage | GlobalHelpModal | Visibility reduction, Echolocation |
| 50 | Fungi | L3 Deep Dive | Pull | GuidePage | GlobalHelpModal | Environmental modifiers |
| 51 | Reproduction | L3 Deep Dive | Pull | GuidePage | GlobalHelpModal | Asexual mechanics |
| 52 | Sexual Reproduction | L3 Deep Dive | Pull | GuidePage | GlobalHelpModal | Sexes, mating, recombination |
| 53 | Genetics & Mutation | L3 Deep Dive | Pull | GuidePage | GlobalHelpModal | Birth mutations, daily mutations |
| 54 | Ageing & Entropy | L3 Deep Dive | Pull | GuidePage | GlobalHelpModal | Lifespan, entropy multiplier |
| 55 | Nesting & Eggs | L3 Deep Dive | Pull | GuidePage | GlobalHelpModal | Nest Affinity, egg inputs |
| 56 | Attack Resolution | L3 Deep Dive | Pull | GuidePage | GlobalHelpModal | Damage formula, DEF reduction |
| 57 | Venom | L3 Deep Dive | Pull | GuidePage | GlobalHelpModal | DoT, armor bypass, Immune counter |
| 58 | Armor & Burrowing | L3 Deep Dive | Pull | GuidePage | GlobalHelpModal | Stacking DEF, underground state |
| 59 | Camouflage | L3 Deep Dive | Pull | GuidePage | GlobalHelpModal | Speed-based visibility |
| 60 | Flee & Sprint | L3 Deep Dive | Pull | GuidePage | GlobalHelpModal | Sprint mode mechanics |
| 61 | Pheromones | L3 Deep Dive | Pull | GuidePage | GlobalHelpModal | 3 channels, gradient following |
| 62 | Sound | L3 Deep Dive | Pull | GuidePage | GlobalHelpModal | Broadcast, frequency, range |
| 63 | Encounter Sharing | L3 Deep Dive | Pull | GuidePage | GlobalHelpModal | Ally state reading |
| 64 | Herding | L3 Deep Dive | Pull | GuidePage | GlobalHelpModal | Flocking forces, gene weights |
| 65 | Dominance Scoring | L3 Deep Dive | Pull | GuidePage | GlobalHelpModal | Pop + territory + food chain |
| 66 | Food Chain | L3 Deep Dive | Pull | GuidePage | GlobalHelpModal | Predator-prey dynamics |
| 67 | Keystone Species | L3 Deep Dive | Pull | GuidePage | GlobalHelpModal | Niche bonus |
| 68 | Ecological Events | L3 Deep Dive | Pull | GuidePage | GlobalHelpModal | Droughts, blooms, surges |
| 69 | World View Controls | L3 Deep Dive | Pull | GuidePage | GlobalHelpModal | LOD tiers, pan, zoom |
| 70 | Follow Mode Tools | L3 Deep Dive | Pull | GuidePage | GlobalHelpModal | Overlays, stats panel |
| 71 | EP & Achievements | L3 Deep Dive | Pull | GuidePage | GlobalHelpModal | EP sources, tier table, 17 achievements |

### 6.2 Coverage Verification

**All 4 brain templates** referenced: Simple Grazer (L1 Step 2-3, L3 `br_templates`), Hunter (L3 `br_templates`), Scavenger (L3 `br_templates`), Balanced Omnivore (L3 `br_templates`).

**All 11 unlockable traits** referenced:
- Armor Plating: L4 Tier 2, L3 `bd_traits`, L3 `cs_armor`
- Venom Glands: L4 Tier 2, L3 `bd_traits`, L3 `cs_venom`
- Echolocation: L4 Tier 2, L3 `bd_traits`, L3 `tw_daynight`
- Burrowing: L4 Tier 3, L3 `bd_traits`, L3 `cs_armor`
- Camouflage: L4 Tier 3, L3 `bd_traits`, L3 `cs_camo`
- Fat Reserves: L4 Tier 3, L3 `bd_traits`, L3 `ec_events`
- Spore Dispersal: L4 Tier 3, L3 `bd_traits`, L3 `ec_dominance`
- Herd Coordination: L4 Tier 3, L3 `bd_traits`, L3 `cm_herding`
- Sexual Reproduction: L4 Tier 3, L3 `bd_traits`, L3 `lc_sexual`
- Encounter Info Sharing: L4 Tier 4, L3 `bd_traits`, L3 `cm_encounter`
- Immune System: L3 `bd_traits`, L3 `cs_venom`
- Nest Affinity: L3 `bd_traits`, L3 `lc_nesting`

**All 12 hidden node types** referenced:
- Sigmoid: L3 `br_activation`, L3 `br_hidden`
- Linear: L3 `br_activation`, L3 `br_hidden`
- ReLU: L3 `br_activation`, L3 `br_hidden`, L3 `br_templates` (Hunter)
- TanH: L3 `br_activation`, L3 `br_hidden`
- Latch: L4 Tier 2, L3 `br_activation`, L3 `br_hidden`
- Multiply: L4 Tier 2, L3 `br_activation`, L3 `br_hidden`, L3 `br_complex`
- Gaussian: L4 Tier 3, L3 `br_activation`, L3 `br_hidden`
- Differential: L4 Tier 3, L3 `br_activation`, L3 `br_hidden`
- Absolute: L4 Tier 3, L3 `br_activation`
- Sine: L4 Tier 4, L3 `br_activation`
- Integrator: L4 Tier 4, L3 `br_activation`
- Inhibitory: L4 Tier 4, L3 `br_activation`

---

## 7. Onboarding State Management

### 7.1 Client State (`onboardingStore.ts`)

New Zustand store managing all onboarding progress:

```typescript
// stores/onboardingStore.ts

interface OnboardingStore {
  // Quick Start wizard
  quickStartCompleted: boolean;
  quickStartStep: 0 | 1 | 2 | 3 | 4;

  // Layer 2: System introductions (17 cards)
  introductions: Record<string, {
    seen: boolean;        // Card has been shown
    completed: boolean;   // Player dismissed it ("Got It")
    seenAt: string;       // ISO timestamp of first display
  }>;

  // Layer 4: Tier unlock education modals
  tierUnlocksSeen: Set<number>;  // Which tier unlock modals have been shown (2, 3, 4)

  // Actions
  advanceQuickStart: () => void;           // Move to next quick start step
  completeQuickStart: () => void;          // Mark quick start as done
  markIntroSeen: (id: string) => void;     // Mark introduction card as shown
  markIntroCompleted: (id: string) => void; // Mark introduction as dismissed
  markTierUnlockSeen: (tier: number) => void; // Mark tier unlock modal as shown
  resetOnboarding: () => void;             // Reset all onboarding state (from Settings)

  // Queries
  shouldShowIntro: (id: string) => boolean; // True if intro not yet seen
  shouldShowTierUnlock: (tier: number) => boolean; // True if tier unlock not yet shown
}
```

### 7.2 Persistence

**Primary**: New `onboarding_state` JSONB column on the `players` table in Supabase:

```sql
-- Added to players table (see architecture.md §9)
onboarding_state JSONB NOT NULL DEFAULT '{
  "quickStartCompleted": false,
  "quickStartStep": 0,
  "introductions": {},
  "tierUnlocksSeen": []
}'::jsonb,
```

**Fallback**: `localStorage` key `life_game_onboarding` with same JSON structure. Used when offline or before auth completes. Syncs to Supabase on next successful connection.

**Sync strategy**:
- On login: load from Supabase → merge with localStorage (keep whichever has more progress)
- On state change: write to localStorage immediately + debounced write to Supabase (500ms)
- On logout: clear localStorage

### 7.3 Trigger Evaluation

Each introduction has a trigger condition evaluated in the relevant screen component:

```typescript
// Example: BodyTab component
useEffect(() => {
  const store = useOnboardingStore.getState();
  const visitCount = bodyTabVisitCount.current; // tracked locally

  if (visitCount === 2 && store.shouldShowIntro('bp_budget_deep')) {
    store.markIntroSeen('bp_budget_deep');
    setActiveTeachCard('bp_budget_deep');
  }
}, []);
```

Event-based triggers (reproduction, death, combat) are evaluated in the WebSocket message handlers:

```typescript
// In socket message handler
case 'egg_laid':
  if (isPlayerSpecies(event.speciesId)) {
    const store = useOnboardingStore.getState();
    if (store.shouldShowIntro('reproduction')) {
      store.markIntroSeen('reproduction');
      showEventTeachToast('reproduction');
    }
  }
  break;
```

---

## 8. UI Components & Interaction Patterns

### 8.1 InlineTeachCard

Inline dismissable card anchored near the relevant UI element. Used for Layer 2 introductions.

**Props**:
```typescript
interface InlineTeachCardProps {
  id: string;                    // Introduction ID (matches onboardingStore key)
  title: string;                 // Bold header text
  body: string;                  // 1-3 lines of explanation
  learnMoreGuide?: string;       // Guide page ID for "Learn More" link
  anchorPosition: 'above' | 'below' | 'left' | 'right'; // Relative to anchor element
  onDismiss: () => void;         // Called when "Got It" tapped
}
```

**Behavior**:
- Appears with a subtle slide-in animation
- Semi-transparent backdrop dims the rest of the screen slightly (not a full modal overlay)
- "Got It" button dismisses and marks as completed in onboardingStore
- "Learn More →" opens GlobalHelpModal to the specified guide page
- Tapping outside the card also dismisses it
- Max 3 lines of body text. If content is longer, it must be split into a separate guide page.

**Visual style**:
- White card with subtle shadow
- Colored left border matching the system category (green=body, blue=brain, orange=world, purple=lifecycle)
- Small arrow pointing toward the anchor element

### 8.2 EventTeachToast

Auto-dismissing toast at the top of the screen for in-world events with a teaching line. Used for Layer 2 event-triggered introductions.

**Props**:
```typescript
interface EventTeachToastProps {
  id: string;                    // Introduction ID
  title: string;                 // Bold event description
  body: string;                  // Teaching line (1-2 sentences)
  learnMoreGuide?: string;       // Guide page ID
  duration?: number;             // Auto-dismiss time in ms (default: 8000)
}
```

**Behavior**:
- Slides down from top of screen
- Auto-dismisses after duration (default 8s)
- Swipe up to dismiss early
- "Learn More →" link opens guide before dismissal
- Only one toast at a time — queue if multiple events fire simultaneously
- Marks as completed in onboardingStore on dismiss (manual or auto)

**Visual style**:
- Floating card at top of screen with rounded corners
- Subtle slide-down animation
- Progress bar showing time until auto-dismiss

### 8.3 UnlockEducationModal

Full-screen celebratory modal for tier transitions. Used for Layer 4 unlock education.

**Props**:
```typescript
interface UnlockEducationModalProps {
  tier: 2 | 3 | 4;
  onDismiss: () => void;
}
```

**Behavior**:
- Full-screen overlay with celebration animation (confetti particles)
- Scrollable content area with: tier header, feature lists (inputs/outputs/hidden/traits), suggested experiment, annotated wiring diagram
- "Got It" button at bottom dismisses and marks tier as seen
- "Explore in Designer →" navigates to `/designer` BrainTab
- "Open Guide →" opens relevant guide section
- Cannot be dismissed by tapping outside (must use explicit button)
- If multiple tier unlocks are pending (rare), show sequentially

**Visual style**:
- Dark semi-transparent backdrop
- Large centered card with tier-colored header (Tier 2=blue, Tier 3=purple, Tier 4=gold)
- Confetti animation plays for 2 seconds on open
- Wiring diagram uses the same visual style as the BrainTab node graph

### 8.4 QuickStartOverlay

Semi-transparent overlay with guided highlights for onboarding steps 2-4. Focuses attention on the relevant UI elements during onboarding.

**Props**:
```typescript
interface QuickStartOverlayProps {
  step: 2 | 3 | 4;
  highlightElements: string[];   // CSS selectors of elements to highlight
  instructionText: string;
  onSkip: () => void;
}
```

**Behavior**:
- Semi-transparent dark overlay covering the screen
- "Spotlight" cutouts around highlighted elements (unmasked, fully visible)
- Instruction text card floating near the highlighted area
- "Skip to Deploy →" escape hatch on every step
- Steps advance via the primary action buttons (already in the Step components)

### 8.5 GuidePage & GuideIndex

Inside `GlobalHelpModal`, renders the reference guide content from `src/data/guides.ts`.

**GuideIndex**:
```typescript
interface GuideIndexProps {
  onSelectGuide: (guideId: string) => void;
  searchQuery?: string;
}
```
- Accordion-style category list (9 categories)
- Search bar filters guide titles and content
- Each guide entry shows: title, 1-line summary, category badge

**GuidePage**:
```typescript
interface GuidePageProps {
  guideId: string;
  onBack: () => void;
  onNavigate: (route: string) => void; // For "Try It" links
}
```
- Renders guide content from data: summary, how it works, key numbers, tips, examples
- "Try It →" link at top navigates to relevant screen
- "Related" links at bottom navigate to other guide pages
- Back button returns to GuideIndex
- Scrollable within the modal
- Interactive elements (activation function curves, diet graph) rendered as small embedded components

### 8.6 Updated GlobalHelpModal

The existing `GlobalHelpModal` (triggered by [?] button) is expanded to serve as the container for the reference guide:

```
GlobalHelpModal (full-screen, triggered by [?] button)
  TabBar: [Quick Help | Reference Guide]
  QuickHelpTab (existing content)
    BPBudgetExplainer
    BrainProcessingOrder
    ActivationFunctionGuide
    InputOutputOverview
  ReferenceGuideTab (new)
    GuideIndex
      CategoryAccordion (9 categories)
        GuideEntry (per guide page)
    GuidePage (shown when guide selected)
      GuideContent
      TryItLink
      RelatedLinks
```

### 8.7 Component Hierarchy Addition

New components added to the shared component tree (see `front-end.md` §6):

```
// Onboarding Components (shared, used across screens)
InlineTeachCard
  CardHeader (title)
  CardBody (1-3 lines)
  LearnMoreLink (optional, opens guide)
  DismissButton ("Got It")

EventTeachToast
  ToastHeader (title)
  ToastBody (teaching line)
  LearnMoreLink (optional)
  ProgressBar (auto-dismiss timer)

UnlockEducationModal
  ConfettiAnimation
  TierHeader
  FeatureList (inputs, outputs, hidden nodes, traits)
  SuggestedExperiment
  WiringDiagram (annotated)
  ActionButtons ("Got It", "Explore in Designer →", "Open Guide →")

QuickStartOverlay
  SpotlightMask
  InstructionCard
  SkipButton

GuidePage
  GuideSummary
  GuideContent (how it works, key numbers, tips, examples)
  TryItLink
  RelatedGuideLinks

GuideIndex
  SearchBar
  CategoryAccordionList
    CategoryAccordion
      GuideEntryRow
```

### 8.8 Reset Tutorial Tips

Added to `ProfileSettingsScreen` under Settings:

```
--- Settings ---
Notifications  [ON / off]
Sound          [on / OFF]
Theme          [Light / Dark]
Reset Tutorial Tips  [Reset]    <-- NEW
```

Tapping "Reset" shows a confirmation dialog: "This will re-show all tutorial tips, introductions, and the quick start wizard. Your EP and unlocks are not affected." On confirm, calls `onboardingStore.resetOnboarding()` and navigates to `/onboarding`.
