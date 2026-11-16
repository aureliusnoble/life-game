# Phase 10: Client -- Species Designer UI (Body, Brain, Deploy Tabs)

**Goal**: Build the full species designer screen with three tabs (Body, Brain, Deploy), live organism preview, BP budget tracking, archetype presets, the brain node graph editor, and the deployment configuration flow. After this phase, a player can design an organism from scratch (or from a template), wire its brain, and deploy it into the simulation.

**Estimated Steps**: 8

> **Before you start this phase**, read the general guidance in [`README.md`](./README.md).

### Phase 10 Guidance

**Read these design docs first:**
- `core-gameplay-systems.md` Sections 1-3 (Body Stats, BP budget, brain architecture) — defines what the designer lets the user configure
- `components/game-components.md` Section 8 (GeneticsEngine) — `GeneSet` with all gene names and valid ranges (needed for slider min/max values)
- `components/game-components.md` Section 12 (OrganismRenderer) — rendering pipeline and stat-to-visual mapping (the designer preview uses the same renderer from Phase 9)
- `components/front-end.md` Section 2 (DesignerScreen) — component tree, tab layout, validation rules
- `design/mockups/preview.html` — the organism preview canvas in the designer should use the same rendering logic from Phase 9. Study the slider-driven stat system in the mockup.
- `design/mockups/ui-preview.html` — UI layout reference for the designer screen

**Prerequisites:**
- Phase 8 must be complete (React app shell, routing, stores).
- Phase 9 must be complete (organism renderer — the designer needs a live preview canvas).
- Phase 7 should be complete (saving designs to Supabase).

**No manager action needed for this phase.** Pure client-side UI code.

**Important implementation note:**
The designer is the player's main creative tool. The BP (body point) budget system is critical — every stat point costs BP, and the total must not exceed 100. Brain points come from the same 100 BP pool. Make sure the validation is airtight: no negative stats, no exceeding BP budget, and the preview updates in real-time as sliders move.

**QA handoff for this phase:**
When done, tell the manager: "Run `pnpm --filter client dev`, navigate to `/design`. Verify: (1) Body tab: sliders for size, speed, strength, defense, diet all work and the organism preview updates live, (2) BP counter shows remaining points and turns red when over budget, (3) Brain tab: you can add hidden nodes and connect them — the node graph is interactive, (4) Deploy tab: selecting a biome and clicking Deploy sends the design to the server (check Network tab for the WebSocket message), (5) Archetype presets (Herbivore, Carnivore, etc.) load reasonable default values, (6) Try to deploy an over-budget design — it should show a validation error."

---

## Step 10.1: Designer Screen Shell

### What You're Implementing
The top-level `DesignerScreen` component with tab navigation (Body, Brain, Deploy), a sticky BP budget bar, and the live organism preview canvas that persists across tab switches. This is the container that all designer sub-tabs render inside.

### Design References
- `front-end.md` section 5 (React component hierarchy -- `DesignerScreen`, `DesignerTabBar`, `BPBudgetBar`, `DesignerTabOutlet`)
- `front-end.md` section 6 (component tree -- `DesignerScreen` with `DesignerTabBar (Body | Brain | Deploy)`, `BPBudgetBar (sticky)`, `<DesignerTabOutlet />`)
- `front-end.md` section 2 (routing -- `/design`, `/design/body`, `/design/brain`, `/design/deploy`)
- `front-end.md` section 4 (`speciesStore` -- `designDraft`, `remainingBP`)
- `front-end.md` section 4 (`deployStore` -- deployment configuration state)

### Implementation Details

**DesignerScreen component** (`packages/client/src/screens/DesignerScreen.tsx`):
- Renders `DesignerTabBar`, `BPBudgetBar`, and a React Router `<Outlet />` for the active tab
- On mount, loads the player's current draft from `speciesStore.designDraft` or initializes a blank design with Herbivore archetype defaults
- The tab bar has three items: Body, Brain, Deploy. Each navigates to the corresponding nested route (`/design/body`, `/design/brain`, `/design/deploy`)
- Default route `/design` redirects to `/design/body`

**DesignerTabBar** (`packages/client/src/components/designer/DesignerTabBar.tsx`):
- Three tabs rendered as horizontal pill buttons
- Active tab indicated with accent color underline (`#4fc3f7` bioluminescent blue)
- Uses `NavLink` from React Router for active state detection
- On phone: full-width row below `TopBar`. On tablet: tabs sit inside the content area header

**BPBudgetBar** (`packages/client/src/components/designer/BPBudgetBar.tsx`):
- Sticky bar showing BP usage as a segmented horizontal bar
- Segments color-coded: body stats (green), brain (cyan), traits (orange), founders (yellow), biome cost (red)
- Text display: `{usedBP} / 100 BP` with remaining shown prominently
- When remaining BP < 0, bar turns red and a warning appears
- Subscribes to `speciesStore.remainingBP` (computed value)
- BP calculation: `remainingBP = 100 - bodyBP - brainBP - traitBP - founderBP - biomeBPCost`
- Body BP: sum of all stat costs per their cost formulas (from `STAT_RANGES` in shared constants)
- Brain BP: `hiddenNodes * 2 + synapses * 0.5`
- Trait BP: sum of active trait costs
- Founder BP: `(founderCount - 1) * 5`
- Biome BP: from `deployStore.biomeCrowdingCost`

**BP calculation utility** (`packages/client/src/utils/bpCalculator.ts`):
```typescript
export function calculateBodyBP(body: BodyGenes): number {
  return (
    10 * body.sizeRatio ** 2 +         // Size
    10 * body.speedRatio +              // Speed
    6 * body.strength +                 // Strength
    6 * body.defense +                  // Defense
    body.viewAngle / 45 +              // View Angle
    2 * body.viewRadius +              // View Radius
    6 * body.stomachMultiplier          // Stomach
    // Diet, Metabolism, GrowthSpeed are FREE
  );
}

export function calculateBrainBP(brain: BrainConfig): number {
  const hiddenNodes = brain.nodes.filter(n => n.type === 'hidden').length;
  const synapses = brain.synapses.filter(s => s.enabled).length;
  return hiddenNodes * 2 + synapses * 0.5;
}

export function calculateTraitBP(traits: TraitConfig): number {
  let bp = 0;
  if (traits.armorPlating) bp += [6, 12, 18][traits.armorPlating.tier - 1];
  if (traits.venomGlands) bp += 8;
  if (traits.echolocation) bp += 10; // simplified; real cost is variable 10-22
  if (traits.burrowing) bp += 12;
  if (traits.camouflage) bp += 10;   // simplified; real cost is variable 6.5-9.8
  if (traits.fatReserves) bp += [5, 10, 15, 20][traits.fatReserves.tier - 1];
  if (traits.sporeDispersal) bp += 8;
  if (traits.herdCoordination) bp += 7;
  return bp;
}
```

**State initialization**: On first mount, populate `speciesStore.designDraft` with Herbivore archetype defaults (Size 1.0, Speed 1.2, STR 0.5, DEF 0.5, Diet 0.0, ViewAngle 180, ViewRadius 5.0, Metabolism 1.0, Stomach 1.5, GrowthSpeed 1.0).

### Unit Tests
- `calculateBodyBP` returns correct values for each archetype preset
- `calculateBrainBP` returns 0 for empty brain, correct value for template brains
- `calculateTraitBP` sums correctly for combinations of traits
- `remainingBP` is reactive and updates when any design property changes
- Tab navigation renders the correct sub-route component
- BPBudgetBar turns red when BP exceeds 100

### QA Checklist
- [ ] Tab bar renders with three tabs; clicking each navigates to the correct route
- [ ] BPBudgetBar is sticky and visible while scrolling within any tab
- [ ] BPBudgetBar segments animate smoothly when stat values change
- [ ] Switching between tabs preserves design state (no data loss)
- [ ] `/design` redirects to `/design/body`
- [ ] BP bar shows warning when total exceeds 100 BP
- [ ] Phone layout: tabs span full width; tablet layout: tabs inside content area
- [ ] BPBudgetBar color-coded segments match the expected categories

---

## Step 10.2: Body Tab (Stat Sliders, Preview, Archetypes)

### What You're Implementing
The Body tab containing the live organism preview canvas, archetype selector cards, 10 core stat sliders with real-time preview updates, and a fine-tune accordion for advanced sliders. This is the primary body design interface.

### Design References
- `front-end.md` section 6 (`BodyTab` -- `OrganismPreview`, `ArchetypeSelector`, `StatSliderGroup`, `UnlockableTraitsSection`)
- `core-gameplay-systems.md` section 1.1 (body system -- all stat ranges, BP cost formulas, archetype presets)
- `art.md` (stat-to-visual mapping table -- how each stat affects organism appearance)
- `front-end.md` section 4 (`speciesStore` -- `designDraft`, `updateBodyStat`)

### Implementation Details

**OrganismPreview** (`packages/client/src/components/designer/OrganismPreview.tsx`):
- A Pixi.js canvas (or HTML canvas) embedded at the top of the Body tab
- Renders the organism using the same `OrganismRenderer` module from phase 9
- Occupies top 40% of screen on phone, side panel on tablet
- Updates in real-time as slider values change (debounced to 16ms / 60fps)
- Shows the organism facing right (angle 0), with body blob, eyes, mouth, tails, shell
- Background matches a neutral biome color (grassland default)
- Render pipeline: background, vision cone preview, tails, cilia, shell, body blob, eyes, mouth

**ArchetypeSelector** (`packages/client/src/components/designer/ArchetypeSelector.tsx`):
- Four horizontally-scrollable cards: Herbivore, Carnivore, Omnivore, Scavenger
- Each card shows: archetype name, mini organism preview (static), 1-line description
- Tapping a card applies the archetype's default stat values to all sliders and resets the brain to the archetype's template (with confirmation if brain has custom wiring)
- Archetype presets loaded from shared constants:
  - Herbivore: Size 1.0, Speed 1.2, STR 0.5, DEF 0.5, Diet 0.0, ViewAngle 180, ViewRadius 5.0, Stomach 1.5, Metabolism 1.0, GrowthSpeed 1.0
  - Carnivore: Size 1.2, Speed 1.5, STR 2.5, DEF 0.3, Diet 1.0, ViewAngle 90, ViewRadius 7.0, Stomach 0.8, Metabolism 1.0, GrowthSpeed 1.0
  - Omnivore: Size 1.0, Speed 1.0, STR 1.0, DEF 1.0, Diet 0.5, ViewAngle 120, ViewRadius 5.0, Stomach 1.2, Metabolism 1.0, GrowthSpeed 1.0
  - Scavenger: Size 0.7, Speed 0.8, STR 0.3, DEF 1.5, Diet 0.75, ViewAngle 270, ViewRadius 8.0, Stomach 1.0, Metabolism 1.0, GrowthSpeed 1.0
- Active archetype highlighted with accent border

**StatSliderGroup** (`packages/client/src/components/designer/StatSliderGroup.tsx`):
- Renders sliders for the 10 core body stats
- Three "primary" sliders always visible: Size, Speed, Diet
- Seven "fine-tune" sliders inside a collapsible accordion: STR, DEF, ViewAngle, ViewRadius, Metabolism, Stomach Multiplier, Growth Speed
- Each slider shows: stat icon (Lucide), stat name (tappable for help card), current value, BP cost for this stat (or "Free" for Diet/Metabolism/GrowthSpeed), and a range indicator

**StatSlider** (`packages/client/src/components/designer/StatSlider.tsx`):
- Individual slider component with: label, value display, range min/max, step size, BP cost
- Continuous range input (HTML `<input type="range">` styled with Tailwind)
- On value change: calls `speciesStore.updateBodyStat(statName, value)` which triggers `OrganismPreview` re-render and `BPBudgetBar` recalculation
- Stat label is tappable: opens `SliderHelpCard` via `helpStore.pushHelp('slider', statId)`
- BP cost display updates live as slider moves (e.g., Size 1.0 shows "10 BP", drag to 2.0 shows "40 BP")
- For free stats (Diet, Metabolism, Growth Speed): shows "Free" instead of BP cost
- Step sizes: Size 0.1, Speed 0.1, STR 0.1, DEF 0.1, Diet 0.05, ViewAngle 5, ViewRadius 0.5, Metabolism 0.1, Stomach 0.1, GrowthSpeed 0.1

**SliderHelpCard** (`packages/client/src/components/help/SliderHelpCard.tsx`):
- Inline card that appears below the slider label when tapped
- Shows: what the stat does mechanically, BP cost formula, strategic tip
- Collapses on tap-away
- Content sourced from a static help content map keyed by stat ID

**Fine-tune accordion**:
- Default collapsed with a "Fine-tune" toggle button
- Expanding reveals STR, DEF, ViewAngle, ViewRadius, Metabolism, Stomach, GrowthSpeed sliders
- Smooth height animation via Framer Motion

### Unit Tests
- Archetype selector applies correct default values for each archetype
- Slider value changes update `speciesStore.designDraft.body` correctly
- BP cost display matches the cost formula for each stat at various values
- OrganismPreview re-renders when stat values change
- Free stats show "Free" instead of BP cost
- Accordion expand/collapse toggles slider visibility

### QA Checklist
- [ ] OrganismPreview updates in real-time as each slider moves (no lag)
- [ ] Archetype cards scroll horizontally on phone, show all four on tablet
- [ ] Selecting an archetype updates all sliders to preset values
- [ ] BP cost next to each slider matches the formula exactly
- [ ] Diet slider changes organism color (green to red gradient)
- [ ] Speed slider changes tail count and body elongation in preview
- [ ] Strength slider changes mouth/jaw size in preview
- [ ] Defense slider changes shell/armor appearance in preview
- [ ] View Angle slider changes eye placement in preview
- [ ] View Radius slider changes eye size in preview
- [ ] Tapping a stat label opens the help card; tapping away closes it
- [ ] Fine-tune accordion opens/closes smoothly
- [ ] Total BP in BPBudgetBar matches sum of all stat costs

---

## Step 10.3: Trait Selector (Unlockable Traits, BP Cost, Tier Gating)

### What You're Implementing
The unlockable traits section within the Body tab. Displays all available traits with their BP costs, lock/unlock status based on the player's progression tier, and trait-specific configuration sub-controls (sliders for Echolocation range/precision/frequency, Camouflage strength, Fat Reserves tier, etc.).

### Design References
- `core-gameplay-systems.md` section 1.1 (unlockable body traits -- Armor Plating, Venom Glands, Echolocation, Burrowing, Camouflage, Fat Reserves, Spore Dispersal, Herd Coordination, Nest Affinity, Immune System, Sexual Reproduction, Encounter Info Sharing)
- `front-end.md` section 6 (`UnlockableTraitsSection`, `TraitCard` with sub-controls)
- `front-end.md` section 4 (`progressStore` -- `unlockedTier`)
- `core-gameplay-systems.md` section 8.2 (unlock tiers -- which traits unlock at each EP threshold)

### Implementation Details

**UnlockableTraitsSection** (`packages/client/src/components/designer/UnlockableTraitsSection.tsx`):
- Collapsible section below the stat sliders, titled "Traits"
- Lists all traits grouped by unlock tier: Tier 1 (always available), Tier 2 (50 EP), Tier 3 (200 EP), Tier 4 (500 EP)
- Tier 1 traits (no unlock required): Immune System, Nest Affinity
- Tier 2 traits: Armor Plating, Venom Glands, Echolocation
- Tier 3 traits: Burrowing, Camouflage, Fat Reserves, Spore Dispersal, Herd Coordination, Sexual Reproduction
- Tier 4 traits: Encounter Info Sharing
- Locked traits show a lock icon, grayed out, with "Unlock at Tier X (Y EP)" text
- Unlocked traits show a toggle switch to enable/disable

**TraitCard** (`packages/client/src/components/designer/TraitCard.tsx`):
- Each trait rendered as an expandable card with: trait name, BP cost, toggle, info icon
- Info icon `(i)` opens `TraitInfoCard` via `helpStore.pushHelp('trait', traitId)`
- When toggled on, the trait's BP cost is added to the total and any sub-controls expand
- Sub-controls per trait:
  - **Armor Plating**: tier selector (Light 6BP / Medium 12BP / Heavy 18BP) + direction toggle (Front / Back)
  - **Echolocation**: 3 sliders -- Echo Range (0.3-0.8x ViewRadius, 7.2-9.2 BP), Echo Precision (Low/High toggle, 0/4 BP), Echo Frequency (25%-100%, 1-4 BP)
  - **Camouflage**: 1 slider -- Camo Strength (0.3-0.8, 6.5-9.8 BP total)
  - **Fat Reserves**: tier selector (Tier 1-4, 5/10/15/20 BP)
  - **Spore Dispersal**: 1 slider -- Spore Range (3-30 units, 8-14 BP)
  - **Nest Affinity**: 1 slider -- (0.0-1.0, 0-5 BP)
  - **Immune System**: 1 slider -- Immune Strength (0.0-1.0, 0-4 BP)
  - **Herd Coordination**: toggle only (7 BP flat)
  - **Venom Glands**: toggle only (8 BP flat)
  - **Burrowing**: toggle only (12 BP flat)
  - **Sexual Reproduction**: toggle only (10 BP flat), with warning that this is irreversible per deployment
  - **Encounter Info Sharing**: toggle only (8 BP flat)
- BP cost shown updates dynamically as sub-control values change

**TraitInfoCard** (`packages/client/src/components/help/TraitInfoCard.tsx`):
- Full description, BP cost, mechanical effects, balance counters, unlock requirements
- Content sourced from a static help content map

**Trait state management**: Toggling a trait updates `speciesStore.designDraft.traits`. The BP recalculation runs automatically via the computed `remainingBP`.

### Unit Tests
- Locked traits cannot be toggled when player tier is insufficient
- Toggling a trait updates `designDraft.traits` and recalculates BP
- Armor Plating sub-controls correctly set tier and direction
- Echolocation sub-controls correctly calculate variable BP (10-22 range)
- Camouflage slider BP follows the exponential formula `6 + 6 * camoLevel^2`
- Immune System and Nest Affinity are available at Tier 1
- Sexual Reproduction toggle shows irreversibility warning

### QA Checklist
- [ ] Traits are grouped by tier with clear tier labels
- [ ] Locked traits display lock icon and unlock requirement text
- [ ] Unlocked traits have working toggle switches
- [ ] Sub-controls appear/disappear when trait is toggled on/off
- [ ] BP cost for each trait matches the design spec exactly
- [ ] Variable-cost traits (Echolocation, Camouflage, Fat Reserves, Spore) update BP as sliders move
- [ ] Tapping info icon opens the trait help card
- [ ] Sexual Reproduction shows a warning dialog before enabling
- [ ] Organism preview updates when traits are toggled (e.g., shell plates for Armor, glands for Venom)
- [ ] BPBudgetBar reflects trait costs in the orange segment

---

## Step 10.4: Brain Tab -- Node Graph Editor

### What You're Implementing
The brain tab containing a full-screen Pixi.js canvas node graph editor. Input nodes on the left, output nodes on the right, draggable hidden nodes in the middle. Players create synapses by dragging from one node to another. The graph is touch-first with pinch-zoom and pan support.

### Design References
- `front-end.md` section 1 (technology -- custom Pixi.js canvas for brain editor, touch-first, pinch-zoom/pan)
- `front-end.md` section 6 (`BrainTab` -- `BrainCanvas`, `InputNodeColumn`, `OutputNodeColumn`, `HiddenNodes`, `Synapses`, `FloatingToolbar`, `NodePaletteBottomSheet`)
- `core-gameplay-systems.md` section 1.2 (brain architecture -- input/hidden/output nodes, tiers, synapses, activation functions)
- `front-end.md` section 4 (`speciesStore` -- `designDraft.brain`, `setBrainGraph`)

### Implementation Details

**BrainTab** (`packages/client/src/screens/designer/BrainTab.tsx`):
- Full-area Pixi.js canvas with a floating toolbar overlay
- The canvas occupies all available space below the tab bar and above the BP bar
- Uses `@use-gesture/react` for touch gestures: one-finger drag on canvas = pan, pinch = zoom, one-finger drag on a node = move node, drag from node port = create synapse

**BrainCanvas** (`packages/client/src/components/designer/brain/BrainCanvas.tsx`):
- Pixi.js `Application` instance created on mount, destroyed on unmount
- Canvas coordinate system: world coordinates with camera transform (pan offset + zoom scale)
- Three fixed columns layout: inputs (left, x=100), hidden (center, draggable), outputs (right, x=canvas.width - 100)
- Background: dark panel color (`#141e2e`) with subtle grid lines for spatial reference
- Camera: `@use-gesture/react` pinch-zoom (0.5x to 3.0x), pan with momentum

**InputNodeColumn** (rendered within `BrainCanvas`):
- Displays all available input nodes in a vertical list on the left
- Nodes grouped by tier with tier header labels
- Locked nodes (above player's tier): grayed out with lock icon, non-interactive
- Unlocked nodes: colored circles with short label text (e.g., "PlantAngle", "Energy")
- Each node has an output port (right side) for creating outgoing synapses
- Node colors: tier-based (Tier 1 white, Tier 2 light blue, Tier 3 purple, Tier 4 gold)
- Tapping a node opens `NodeInfoCard` via help system

**OutputNodeColumn** (rendered within `BrainCanvas`):
- Displays all available output nodes in a vertical list on the right
- Same tier grouping, locking, and coloring as input nodes
- Each node has an input port (left side) for receiving incoming synapses
- Locked outputs: grayed with lock icon

**HiddenNodes**:
- Draggable circular nodes positioned in the center area
- Each hidden node shows: activation function abbreviation (SIG, LIN, ReLU, TanH, LAT, MULT, GAU, DIF, ABS, SIN, INT, INH), current bias value
- Drag to reposition; position stored in `BrainNode.position`
- Input port on left, output port on right
- Visual size slightly larger than I/O nodes to indicate editability

**Synapse rendering**:
- Curved bezier lines connecting source output port to target input port
- Line thickness proportional to weight magnitude: `baseThickness + abs(weight) * 1.5`
- Line color: green for positive weight, red for negative weight, gray for disabled
- Arrow at the target end indicating flow direction
- Animated pulse particles flowing along the synapse to indicate signal direction (optional, can be toggled)

**Synapse creation gesture**:
1. User starts drag from any node's output port
2. A temporary line follows the finger/cursor
3. If released on another node's input port, a new synapse is created with default weight +1.0
4. If released on empty space, the temporary line disappears (no synapse created)
5. Validation: cannot connect input-to-input, output-to-output, or create duplicate synapses
6. Synapse cost: 0.5 BP (added to brain BP in BPBudgetBar)

**FloatingToolbar** (`packages/client/src/components/designer/brain/FloatingToolbar.tsx`):
- Floating overlay at the top or bottom of the brain canvas
- Buttons: Add Hidden Node (+), Templates (book icon), Undo, Redo, BP cost display
- "Add Hidden Node" opens the `NodePaletteBottomSheet` to select activation function type
- BP cost shows brain-specific cost: `{hiddenCount * 2 + synapseCount * 0.5} BP`

**NodePaletteBottomSheet** (`packages/client/src/components/designer/brain/NodePaletteBottomSheet.tsx`):
- Phone: bottom sheet that slides up. Tablet: sidebar panel
- Lists all available hidden node activation functions grouped by tier
- Each entry shows: abbreviation, full name, formula, brief description
- Locked node types (above player tier) shown grayed with "Unlock at Tier X"
- Tapping an unlocked node type creates a new hidden node at the center of the canvas viewport
- Max 3 Latch nodes enforced (button disabled when limit reached)

### Unit Tests
- Node graph renders with correct input/output node counts per tier
- Locked nodes are non-interactive and display lock icon
- Dragging from output port to input port creates a synapse in the brain config
- Invalid connections (input-to-input, duplicates) are rejected
- Hidden node drag updates `position` in brain config
- Brain BP calculation updates when nodes/synapses are added or removed
- Undo/redo stack works for add node, add synapse, move node, delete operations
- Latch node limit of 3 is enforced

### QA Checklist
- [ ] Canvas renders with correct input nodes on left and output nodes on right
- [ ] Pinch-zoom and pan work smoothly on touch devices
- [ ] Dragging from a node port draws a temporary line that follows the finger
- [ ] Releasing on a valid target port creates a synapse with green/red coloring
- [ ] Releasing on empty space cancels the synapse creation
- [ ] Hidden nodes can be dragged to new positions
- [ ] Synapse thickness reflects weight magnitude
- [ ] Synapse color reflects sign (green positive, red negative)
- [ ] FloatingToolbar "Add Node" opens the palette
- [ ] Node palette shows all activation functions grouped by tier
- [ ] Locked activation functions are grayed out with unlock requirements
- [ ] Tapping a node opens its info card
- [ ] BP cost in toolbar matches `hiddenNodes * 2 + synapses * 0.5`
- [ ] Canvas performance: smooth at 60fps with 20+ nodes and 30+ synapses

---

## Step 10.5: Brain Tab -- Synapse & Node Editing

### What You're Implementing
The property editing panels for synapses and hidden/output nodes. Tapping a synapse opens a weight slider and enable toggle. Tapping a hidden or output node opens bias slider, activation function display, and delete option.

### Design References
- `core-gameplay-systems.md` section 1.2 (synapses -- weight range -5.0 to +5.0, enabled/disabled toggle; node biases -- range -5.0 to +5.0, activation functions)
- `front-end.md` section 6 (`NodePropertiesPanel`, `SynapsePropertiesPopup`)
- `front-end.md` section 6 (help system -- `SynapseInfoCard`, `NodeInfoCard`)

### Implementation Details

**SynapsePropertiesPopup** (`packages/client/src/components/designer/brain/SynapsePropertiesPopup.tsx`):
- Appears as a floating popup near the tapped synapse
- Contains:
  - Source and target node names (e.g., "PlantAngle -> Rotate")
  - Weight slider: range -5.0 to +5.0, step 0.1, default +1.0
  - Weight value display with +/- sign
  - Enable/disable toggle switch
  - Delete button (trash icon) with confirmation
  - Help button that opens `SynapseInfoCard`
- Weight slider changes update `speciesStore.designDraft.brain.synapses[i].weight` in real-time
- Synapse visual (thickness + color) updates live as weight slider moves
- Popup closes when tapping away from it

**NodePropertiesPanel** (`packages/client/src/components/designer/brain/NodePropertiesPanel.tsx`):
- Appears as a floating panel near the tapped node
- For **hidden nodes**: shows activation function type (read-only display of formula), bias slider (-5.0 to +5.0, step 0.1), delete button
- For **output nodes**: shows activation function (fixed per output), bias slider (-5.0 to +5.0, step 0.1)
- For **input nodes**: read-only display (name, range, description). No editable properties.
- Bias slider: changes update `BrainNode.bias` in real-time
- Delete hidden node: confirms, then removes the node and all connected synapses. Updates brain BP.
- Help button opens `NodeInfoCard` via `helpStore.pushHelp('node', nodeId)`
- Panel closes when tapping away

**SynapseInfoCard** (`packages/client/src/components/help/SynapseInfoCard.tsx`):
- Shows: current weight, direction, connected node names, semantic meaning of the connection
- Example: "NearestPlantAngle -> Rotate: steers toward nearest plant"
- Meaning auto-generated from a lookup table of common input-output pairs

**NodeInfoCard** (`packages/client/src/components/help/NodeInfoCard.tsx`):
- Shows: what the node does, value range, usage examples (1-2 example wirings), unlock status
- For hidden nodes: activation function formula, default output, strategic use case
- For locked nodes: shows what it does and how to unlock it

**Activation function display**: Each hidden node shows its activation function as a mini formula:
- SIG: `1/(1+e^(-x))`, range [0,1]
- LIN: `x`, range [-100,100]
- ReLU: `max(0,x)`, range [0,100]
- TanH: `tanh(x)`, range [-1,1]
- LAT: `latch(x)`, range {0,1}
- MULT: `a*b*c...`, range [-100,100]
- GAU: `1/(1+x^2)`, range [0,1]
- DIF: `dx/dt`, range [-100,100]
- ABS: `|x|`, range [0,100]
- SIN: `sin(x)`, range [-1,1]
- INT: `integral(x)`, range [-100,100]
- INH: `habituation(x)`, range [-100,100]

### Unit Tests
- Tapping a synapse opens the properties popup with correct source/target names
- Weight slider updates synapse weight in the brain config
- Weight slider visual: synapse color changes from green (positive) to red (negative) at 0
- Enable toggle updates synapse `enabled` state; disabled synapses render gray
- Deleting a synapse removes it from brain config and updates BP
- Tapping a hidden node opens properties with correct activation function
- Bias slider updates node bias in the brain config
- Deleting a hidden node removes it and all connected synapses
- Input nodes are read-only (no editable properties)
- Output node bias is editable

### QA Checklist
- [ ] Synapse popup appears near the tapped synapse, not off-screen
- [ ] Weight slider range is -5.0 to +5.0 with 0.1 step
- [ ] Synapse thickness and color update in real-time as weight slider moves
- [ ] Disabled synapses render as gray dashed lines
- [ ] Delete synapse removes the visual line and updates BP immediately
- [ ] Node properties panel shows correct activation function formula
- [ ] Bias slider range is -5.0 to +5.0 with 0.1 step
- [ ] Deleting a hidden node cascades to remove all connected synapses
- [ ] Help cards open correctly for both synapses and nodes
- [ ] Tapping away from a popup/panel closes it
- [ ] Undo/redo works for weight changes, bias changes, and deletions

---

## Step 10.6: Brain Tab -- Template System

### What You're Implementing
The brain template system allowing players to apply one of four pre-wired brain templates (Simple Grazer, Hunter, Scavenger, Balanced Omnivore) to their brain graph. Templates can be applied to an empty brain or replace an existing one (with confirmation).

### Design References
- `core-gameplay-systems.md` section 1.2 (starting brain templates -- Simple Grazer 7 synapses/3.5 BP, Hunter 9 synapses + 1 hidden/6.5 BP, Scavenger 7 synapses/3.5 BP, Balanced Omnivore 10 synapses/5 BP)
- `front-end.md` section 6 (`FloatingToolbar` -- templates button)

### Implementation Details

**TemplateModal** (`packages/client/src/components/designer/brain/TemplateModal.tsx`):
- Opens when "Templates" button in FloatingToolbar is tapped
- Shows four template cards in a scrollable list:

**Simple Grazer template** (Herbivore, 7 synapses = 3.5 BP):
```
NearestPlantAngle   --[+2.0]--> Rotate
NearestPlantDist    --[+3.0]--> Accelerate
Constant            --[+0.5]--> Accelerate
Constant            --[+2.0]--> Want2Eat
NearestPlantDist    --[-3.0]--> Want2Eat
NearestOrganismSize --[+4.0]--> Want2Flee
NearestOrganismDist --[-3.0]--> Want2Flee
```

**Hunter template** (Carnivore, 9 synapses + 1 hidden = 6.5 BP):
```
Hidden H1 (ReLU, bias: +0.5): "Is target smaller than me?"
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

**Scavenger template** (7 synapses = 3.5 BP):
```
NearestMeatAngle    --[+3.0]--> Rotate
NearestMeatDist     --[+3.0]--> Accelerate
Constant            --[+0.5]--> Accelerate
Constant            --[+2.0]--> Want2Eat
NearestMeatDist     --[-3.0]--> Want2Eat
Constant            --[+3.0]--> Want2Flee
NearestOrganismDist --[-4.0]--> Want2Flee
```

**Balanced Omnivore template** (10 synapses = 5 BP):
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

Each template card shows:
- Template name and archetype label
- Synapse count and BP cost
- 1-line behavior description (e.g., "Wanders forward, steers toward plants, eats when close, flees from large nearby organisms")
- "Apply" button

**Applying a template**:
1. If current brain has any nodes/synapses: confirmation dialog "This will replace your current brain wiring. Continue?"
2. On confirm: clear all hidden nodes and synapses
3. Create the template's nodes with auto-layout positions (inputs at left column, hidden nodes centered, outputs at right column)
4. Create all template synapses with specified weights
5. Update `speciesStore.designDraft.brain` with the new config
6. Push to undo stack (so the entire template application is one undo action)

**Node auto-layout**:
- Input nodes positioned in the left column at their tier-sorted positions
- Output nodes positioned in the right column at their sorted positions
- Hidden nodes (if any) positioned at the horizontal center, vertically centered
- Synapse bezier curves compute automatically from node positions

### Unit Tests
- Each template produces the correct number of nodes and synapses
- Template BP cost matches the documented value (3.5, 6.5, 3.5, 5.0)
- Applying a template to an empty brain succeeds without confirmation dialog
- Applying a template to a non-empty brain shows confirmation dialog
- Canceling confirmation preserves existing brain
- Undo after template application restores previous brain state
- All synapse weights in applied template match the documented values

### QA Checklist
- [ ] Template modal opens from the toolbar Templates button
- [ ] Four template cards are displayed with correct names and descriptions
- [ ] Applying a template renders all nodes and synapses on the canvas
- [ ] Synapse colors and thickness match the template weights
- [ ] Confirmation dialog appears when replacing existing brain wiring
- [ ] After applying a template, BP cost in toolbar updates correctly
- [ ] Undo restores the previous brain state
- [ ] Template node layout is readable (no overlapping nodes)
- [ ] Tapping "Apply" on a template whose nodes are locked (above player tier) is prevented with an error message

---

## Step 10.7: Deploy Tab (Species Naming, Biome, Founders, Deploy)

### What You're Implementing
The Deploy tab (formerly part of an Appearance tab) where players name their species, choose a spawn biome, set founder count, see the effective BP after deployment costs, and tap the deploy button to send their design to the server.

### Design References
- `front-end.md` section 6 (`AppearanceTab` / `DeploySection` -- `BiomeCrowdingCostDisplay`, `EffectiveBPDisplay`, `ColorPicker`, `NameInput`, `DescriptionInput`)
- `front-end.md` section 4 (`deployStore` -- `selectedBiome`, `founderCount`, `biomeCrowdingCost`, `effectiveBP`, `deploy`)
- `core-gameplay-systems.md` section 3.1 (deployment -- biome crowding cost formula, founder count cost, effective BP calculation)
- `architecture.md` section 2, Flow A (deploy flow -- save design to Supabase, send DEPLOY via WS)
- `architecture.md` section 4.1 (`DEPLOY` message format `[0x20][designId:uuid]`, `DEPLOY_ACK` response)

### Implementation Details

**DeployTab** (`packages/client/src/screens/designer/DeployTab.tsx`):
- Top section: species naming and color
- Middle section: biome selector and founder count
- Bottom section: effective BP display and deploy button

**NameInput**:
- Text input for species name (2-24 characters, validated in real-time)
- Character count indicator ("12/24")
- Updates `speciesStore.designDraft.speciesName`
- Optional description textarea (100 chars max)

**ColorPicker** (`packages/client/src/components/designer/ColorPicker.tsx`):
- Three RGB sliders (0.0-1.0) for player color customization
- Updates `speciesStore.designDraft.body.redColor/greenColor/blueColor`
- Small organism preview showing the color applied over the diet-derived base hue
- Note: player color is a tint applied over the diet-derived color (diet hue = `120 - diet * 120`)

**BiomeSelector** (`packages/client/src/components/designer/BiomeSelector.tsx`):
- Six biome option buttons: Grassland, Forest, Wetland, Desert, Rocky, Random
- Each shows: biome name, biome color swatch, current BP cost
- BP cost sourced from `deployStore.biomeCrowdingCost` (fetched from server or computed from cached world state)
- Biome crowding cost formula: `floor(max(0, (biomeShare - 0.15) * 40))`
- Random biome always shows "0 BP"
- Empty world (< 50 total organisms): all biomes show "0 BP"
- Selected biome highlighted with accent border
- Tapping updates `deployStore.selectedBiome` and triggers `deployStore.calculateEffectiveBP()`

**FounderCountSelector** (`packages/client/src/components/designer/FounderCountSelector.tsx`):
- Slider or stepper control: range 1-10
- Shows BP cost: `(count - 1) * 5 BP` next to the slider
- Shows description: "1 founder = 100 BP, 10 founders = 55 BP each"
- Updates `deployStore.founderCount`

**EffectiveBPDisplay** (`packages/client/src/components/designer/EffectiveBPDisplay.tsx`):
- Summary card showing: `Effective BP = 100 - designBP - founderCost - biomeCost`
- Breakdown: "Design: 62 BP | Founders: -20 BP | Biome: -6 BP | Remaining: 12 BP"
- If effective BP < 0: red warning "Over budget by X BP -- reduce stats or founders"
- Displays `deployStore.effectiveBP`

**DeployButton** (`packages/client/src/components/designer/DeployButton.tsx`):
- Large green button: "Deploy Species"
- Disabled (grayed) when: species name is empty or invalid, BP exceeds 100, no biome selected, or brain has no synapses
- On tap:
  1. Client-side validation: BP total <= 100, name length 2-24, brain has at least 1 synapse
  2. Save design to Supabase: `INSERT INTO species_designs` with all body/brain/trait/deployment data
  3. Deactivate previous active design: `UPDATE species_designs SET is_active = false WHERE player_id = me AND is_active = true`
  4. Send `DEPLOY` WebSocket message with the new design ID: `[0x20][designId:16B uuid]`
  5. Wait for `DEPLOY_ACK` response: success (navigate to /world with auto-follow) or error (show error toast)
  6. Loading spinner while deploying
- Error handling for `DEPLOY_ACK` status codes: `INVALID_DESIGN`, `BP_EXCEEDED`, `MISSING_UNLOCK`, `RATE_LIMITED`

**DietEfficiencyGraph** (`packages/client/src/components/designer/DietEfficiencyGraph.tsx`):
- Small graph showing two crossing curves: plant efficiency and meat efficiency at the current diet value
- Plant efficiency: `0.55 * (1 - diet)^0.7`
- Meat efficiency: `0.80 * diet^0.7`
- Vertical marker at current diet position
- Rendered with Recharts or simple canvas drawing

### Unit Tests
- Species name validation: rejects < 2 chars, > 24 chars, accepts valid names
- Biome crowding cost calculation matches formula for various biome shares
- Founder cost: `(founderCount - 1) * 5` for each value 1-10
- Effective BP: `100 - bodyBP - brainBP - traitBP - founderCost - biomeCost`
- Deploy button disabled when BP > 100 or name empty
- Deploy flow: design saved to Supabase, DEPLOY message sent, ACK handled
- Error handling: each DEPLOY_ACK error code shows appropriate error message
- Diet efficiency graph curves match the formulas

### QA Checklist
- [ ] Species name input validates length in real-time
- [ ] Biome selector shows six options with correct BP costs
- [ ] Random biome always shows 0 BP
- [ ] Founder count slider updates BP cost live
- [ ] Effective BP display shows correct breakdown
- [ ] Red warning appears when over budget
- [ ] Deploy button is disabled when validation fails
- [ ] Deploy button shows loading spinner during deployment
- [ ] Successful deploy navigates to /world with the new organisms visible
- [ ] Failed deploy shows an appropriate error toast
- [ ] Color picker updates organism preview in real-time
- [ ] Diet efficiency graph shows correct curves at current diet value
- [ ] Changing biome selection updates the BP cost display immediately

---

## Step 10.8: Species List Panel (Saved Designs, Version History)

### What You're Implementing
A panel accessible from the designer screen showing the player's saved species designs, active design indicator, and version history. Allows loading a previous design as a starting point for a new iteration.

### Design References
- `front-end.md` section 5 (designer screen -- species list panel concept)
- `front-end.md` section 4 (`speciesStore` -- `activeSpecies`, `designDraft`)
- `architecture.md` section 9 (`species_designs` table -- `player_id`, `species_name`, `version`, `is_active`, `created_at`, `body`, `brain`, `traits`)
- `architecture.md` section 4.2 (Supabase REST -- read own designs)

### Implementation Details

**SpeciesListPanel** (`packages/client/src/components/designer/SpeciesListPanel.tsx`):
- Phone: accessible via a "My Designs" button in the designer header that opens a bottom sheet
- Tablet: collapsible sidebar panel on the left side of the designer
- Fetches all designs from Supabase: `SELECT * FROM species_designs WHERE player_id = me ORDER BY created_at DESC`
- Groups designs by species name, showing versions under each name

**DesignListItem** (`packages/client/src/components/designer/DesignListItem.tsx`):
- Each item shows: species name, version number, creation date, BP total, active indicator (green dot if `is_active`)
- Mini organism portrait (small canvas rendering using the design's body stats)
- Tap action: "Load into Editor" -- populates `designDraft` with this design's body/brain/traits
- If current editor has unsaved changes: confirmation dialog "Load this design? Current changes will be lost."

**Version history grouping**:
- Designs with the same `species_name` are grouped together
- Latest version shown prominently, older versions in a collapsible sub-list
- Active design (if any) shown at the top with a "Currently Deployed" badge

**Loading a saved design**:
1. Fetch full design data from Supabase (body, brain, traits, deployment config)
2. Populate `speciesStore.designDraft` with all values
3. Navigate to `/design/body` to show the loaded design
4. OrganismPreview and BPBudgetBar update immediately
5. Design is loaded as a new draft (not editing the original) -- changes won't affect the saved design

**Empty state**: When no designs exist, show "No saved designs yet. Create your first species!" with a prompt to pick an archetype.

### Unit Tests
- Design list fetches from Supabase and renders items sorted by creation date
- Active design shows "Currently Deployed" badge
- Loading a design populates `designDraft` with correct body/brain/trait values
- Confirmation dialog appears when loading over unsaved changes
- Version grouping correctly groups designs by species name
- Empty state renders when no designs exist

### QA Checklist
- [ ] "My Designs" button opens the panel (bottom sheet on phone, sidebar on tablet)
- [ ] Designs are listed with correct names, versions, dates, and BP totals
- [ ] Active design has a visible green dot and "Currently Deployed" badge
- [ ] Tapping a design loads it into the editor with correct stat values
- [ ] Organism preview updates after loading a saved design
- [ ] Confirmation dialog appears when overwriting unsaved editor changes
- [ ] Version history groups designs by name correctly
- [ ] Scrolling through many designs is smooth (virtualized list if > 20 items)
- [ ] Empty state message displays correctly for new players
- [ ] Species thumbnail renders correctly in design list items

#### Species Thumbnail Generation & Upload

- `architecture.md` Section 4.2 (Supabase Storage) — Species thumbnails stored in the `share-cards` bucket.

When a species design is saved, generate a small thumbnail image (128x128 PNG) of the organism and upload it to Supabase Storage. This thumbnail is used in:
- The species list panel (Step 10.8)
- Leaderboard rows (Phase 12)
- Share cards / farewell cards (Phase 12)
- "While you were away" reports

```typescript
// client/src/lib/speciesThumbnail.ts

async function generateSpeciesThumbnail(design: OrganismDesign): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Clear with transparent background
  ctx.clearRect(0, 0, 128, 128);

  // Render organism centered at (64, 64) using the same rendering
  // pipeline from Phase 9 (organism renderer), scaled to fit 128px
  renderOrganismToCanvas(ctx, design, { x: 64, y: 64, scale: 1.5 });

  return new Promise(resolve => canvas.toBlob(resolve!, 'image/png'));
}

async function uploadThumbnail(designId: string, blob: Blob): Promise<string> {
  const path = `thumbnails/${designId}.png`;
  const { error } = await supabase.storage
    .from('share-cards')
    .upload(path, blob, { contentType: 'image/png', upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from('share-cards').getPublicUrl(path);
  return data.publicUrl;
}

// Called during species save in speciesStore
async function saveDesignWithThumbnail(design: OrganismDesign): Promise<string> {
  const designId = await speciesPersistence.saveDesign(authStore.user!.id, design);
  const thumbnailBlob = await generateSpeciesThumbnail(design);
  const thumbnailUrl = await uploadThumbnail(designId, thumbnailBlob);
  await supabase.from('species_designs').update({ thumbnail_url: thumbnailUrl }).eq('id', designId);
  return designId;
}
```
