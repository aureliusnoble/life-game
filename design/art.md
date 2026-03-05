# Life Game — Art Direction Brief

## Creative Direction: Microscopic Primordial Soup

The game world is a **primordial soup** viewed through a microscope. Organisms are microorganisms — amoebas, paramecia, tardigrades, plankton — floating in warm, tinted liquid. The world isn't a top-down map of terrain; it's a petri dish of life. Biomes are regions of differently-colored liquid (mineral-rich green, volcanic amber, deep-ocean blue).

**Reference games**: Spore cell stage, The Bibites, flOw, Eufloria, Osmos, Agar.io

**Tone**: Cute but alive. Organisms should feel squishy, organic, and endearing — not clinical or scary. Players should want to poke them.

---

## Style Pillars

1. **Cute & Rounded** — No sharp angles on bodies. Soft curves, big expressive eyes, blobby forms. Even carnivores look adorable (like a chubby piranha larva).

2. **Organic & Fluid** — Everything wobbles. Membranes ripple, cilia wave, organelles drift inside translucent bodies. Nothing is rigid or mechanical.

3. **Vector-Clean** — Crisp outlines, flat fills with subtle gradients, no pixel noise or photorealism. Scales beautifully from tiny to zoomed-in.

4. **Readable at a Glance** — A player should instantly tell diet (green→red hue), size, speed (body shape), and danger level (mouth/spikes) from the silhouette alone.

5. **Alive Even When Still** — Idle organisms still pulse, breathe, and shift. The world should feel like a living culture.

---

## Stat-to-Visual Mapping

How each organism stat drives its procedural appearance:

| Stat | Visual Effect | Implementation Notes |
|------|--------------|---------------------|
| **Size Ratio** (0.3–3.0) | Body scale. 4 base shape variants: Tiny (<0.6) is a simple circle, Normal (0.6–1.4) is an ellipse with nubs, Large (1.4–2.2) has visible organelles, Huge (>2.2) has complex internal structures | Scale transform on root element. Switch base SVG template at thresholds |
| **Speed Ratio** (0.2–2.5) | Body elongation and streamlining. Fast = tapered/teardrop. Slow = round/stubby. Fast organisms have longer flagella/cilia, thinner limbs | Adjust body ellipse aspect ratio. Appendage count and length scale with speed |
| **Strength** (0.1–5.0) | Mouth/jaw prominence. Low STR = tiny dot mouth. High STR = visible mandibles, spikes near mouth, wider jaw | Mouth SVG element scales up. Add mandible paths above STR 2.0. Jaw width = f(STR) |
| **Defense** (0.0–4.0) | Membrane/shell thickness. DEF 0 = thin wiggly membrane. DEF 1–2 = thicker solid outline. DEF 3+ = segmented shell plates. DEF 4 = heavy chitin armor | Stroke width increases. Add shell segment paths above DEF 2. Opacity increases |
| **Diet** (0.0–1.0) | Body hue on a green→yellow→orange→red gradient. 0.0 = leafy green (herbivore). 0.5 = warm yellow (omnivore). 1.0 = hot red (carnivore) | HSL hue: `120 - (diet * 120)`. Saturation from metabolism |
| **View Angle** (15°–360°) | Eye placement around head. Narrow (<90°) = two forward-facing predator eyes. Medium (90–180°) = eyes slightly apart. Wide (>180°) = eyes on sides. 360° = ring of eyespots | Position eye elements along arc. Count increases for wide angles |
| **View Radius** (1.0–10.0) | Eye size. Bigger eyes = farther sight. At very high values, eyes become the dominant visual feature | Eye radius = f(ViewRadius). Pupil detail increases with radius |
| **Metabolism** (0.5–3.0) | Internal glow intensity and pulse rate. Low = dim, slow pulse. High = bright, fast pulse. Also drives pattern saturation | Animation speed = metabolism. Fill opacity/glow filter intensity |
| **Stomach Mult** (0.3–2.0) | Body roundness/volume. Large stomach = rounder, more circular body. Small = lean and elongated | Body ellipse ry approaches rx as stomach increases. Belly bulge |
| **Armor Plating** | Visible plate segments on front or back. Light = subtle ridges. Heavy = distinct overlapping plates | Add plate path elements. Count and opacity scale with tier |
| **Venom Glands** | Small bulges near mouth with green-yellow tint. Faint drip effect | Add gland circles near mouth. Green overlay on jaw area |
| **Camouflage** | Mottled/dappled body pattern. Slight transparency. Complex coloring | Add noise pattern overlay. Reduce body opacity slightly |
| **Burrowing** | Broader, shovel-like front appendages. Reinforced front profile | Widen front limb paths. Add wedge shape to front |
| **Fat Reserves** | Dynamic body expansion. Well-fed = plump. Starving = gaunt | Animate body scale based on current energy. Stretch belly |
| **Player Color** | RGB primary hue applied as tint over diet-derived base color. Secondary auto-derived (complementary shift) | HSL tint layer blended with diet hue. Offspring get slight hue mutation |

---

## Color Palette

### Organism Colors (Diet-Driven)
```
Herbivore (diet 0.0):  #4CAF50 → #66BB6A  (leafy greens)
Mixed (diet 0.25):     #8BC34A → #9CCC65  (yellow-greens)
Omnivore (diet 0.5):   #FFC107 → #FFD54F  (warm ambers)
Mixed (diet 0.75):     #FF9800 → #FFB74D  (oranges)
Carnivore (diet 1.0):  #F44336 → #EF5350  (vivid reds)
```

### Biome Liquid Colors (Background)
```
Grassland:  #1a3a2a → #2d5a3a  (mineral green, clear water)
Forest:     #1a2a1a → #1d3320  (dark green, murky, dense particles)
Desert:     #3a2a1a → #5a4020  (warm amber, volcanic mineral tint)
Wetland:    #1a2a3a → #204050  (deep blue-green, rich sediment)
Rocky:      #2a2a2a → #3a3535  (dark grey, cool, still)
```

### Seasonal Tints (Applied to Biome Base Colors)
Each season shifts the hue, saturation, and brightness of all biome liquid colors. These tints are defined in the shared `SEASON_MODIFIERS` table (see [`back-end.md` §9.3](./components/back-end.md)) and applied client-side.
```
Spring:   Hue +8°,  Saturation ×1.15, Brightness ×1.05  (lush, vivid)
Summer:   Hue +5°,  Saturation ×1.0,  Brightness ×1.1   (warm, bright)
Autumn:   Hue -15°, Saturation ×0.85, Brightness ×0.95  (amber, muted)
Winter:   Hue +10°, Saturation ×0.6,  Brightness ×0.8   (blue, dim)
```

### Day/Night
```
Night overlay: deep blue-purple (#1a1a3a) at 55% max opacity, MULTIPLY blend.
Sinusoidal transition — no hard day/night boundary.
Organism eyes gain subtle glow at night. Bioluminescent fungi become prominent.
```

### Ambient Particles (Primordial Soup)
Always present. Tiny drifting specks, bubbles, and sediment. Biome-colored, low opacity. These give the world its "living petri dish" feel.
```
Forest:    Dense particles (150 specks, 20 bubbles, 40 sediment)
Wetland:   Many bubbles (120 specks, 30 bubbles, 35 sediment)
Grassland: Moderate (100 specks, 15 bubbles, 20 sediment)
Desert:    Sparse, no bubbles (60 specks, 0 bubbles, 10 sediment)
Rocky:     Still, minimal (50 specks, 5 bubbles, 15 sediment)
```

### Weather Particles (Seasonal)
```
Spring:  Floating spores (translucent green-white, slow upward drift)
Summer:  Clear (no weather particles)
Autumn:  Drifting detritus (amber/brown, slow downward tumble)
Winter:  Ice crystals (white-blue, gentle downward fall)
Max 300 particles on screen (200 ambient + 100 weather).
```

### UI Colors
```
Background:     #0a0f1a  (deep space dark)
Panel:          #141e2e  (dark blue-grey)
Panel border:   #2a3a50  (muted blue)
Text primary:   #e0e8f0  (soft white)
Text secondary: #8090a0  (muted grey-blue)
Accent:         #4fc3f7  (bioluminescent blue)
Warning:        #ffb74d  (amber)
Danger:         #ef5350  (red)
Success:        #66bb6a  (green)
```

---

## Rendering Approach

**Organisms**: Canvas 2D procedural rendering (production path via Pixi.js, which is Canvas/WebGL). Every stat value drives bezier curves, gradients, glow, and translucency in real-time. This gives infinite variation, smooth animation, and the richest visual effects.

**World**: Canvas rendering for the biome background, ambient particles, pellets, pheromone trails, and debug overlays. All drawn in the same render pass as organisms.

---

## UI Approach

**Hybrid** — Lucide icons + CSS for structure, Canvas for organism previews and interactive visualizations:

- **Layout & controls**: Standard HTML/CSS with Tailwind. Dark panels, sliders, buttons.
- **Icons**: [Lucide](https://lucide.dev) (MIT license). Clean, modern, tree-shakeable SVG icon set. Used for stat icons (eye, shield, zap, heart, utensils), navigation, and UI chrome. Matches the vector-clean style pillar.
- **Organism previews**: Canvas elements embedded in the UI — species portraits, brain editor node graph, vision cone diagrams.

---

## Mockups

Interactive mockups live in `design/mockups/`. These are rough prototypes for exploring visual ideas — **where the design documents contradict these mockups, the design documents should be taken as the source of truth.**

| File | Purpose |
|------|---------|
| `preview.html` | Canvas 2D organism designer. Stat sliders drive a live procedural renderer showing body shape, eyes, mouth, tails, shell, internals (brain, stomach, organelles), animation states, biome backgrounds, pellets, and an explore mode. Includes a parts gallery. This is the most developed mockup. |
| `ui-preview.html` | UI approach comparison showing four tabs (Asset Pack, Lucide+CSS, Custom Canvas, Hybrid). Tab D (Hybrid) is the chosen direction. Kept as reference for the decided UI style. |

---

## Animation Principles

1. **Idle**: Slow membrane wobble (sine wave on body outline), gentle organelle drift, subtle size pulse (breathing)
2. **Moving**: Cilia/flagella animate at speed proportional to velocity. Body tilts in movement direction. Trail of tiny bubbles
3. **Eating**: Mouth opens wide, food particle gets pulled in, brief size increase, satisfaction pulse
4. **Attacking**: Body lunges forward, jaw snaps, red flash on target
5. **Damaged**: Red flash, body contracts briefly, particle burst
6. **Reproducing**: Golden glow builds, body elongates, splits into two with particle burst
7. **Death**: Pop animation — body bursts into meat pellet particles that drift outward
8. **Egg**: Smaller version of parent wrapped in translucent shell. Subtle pulse until hatching

---

## LOD Visual Tiers

The unified camera uses level-of-detail rendering based on zoom level. Each tier has a distinct visual character:

**Dot Tier** (viewport > 50 world units):
- Organisms rendered as colored circles matching diet hue (green→yellow→red for herbivore→omnivore→carnivore)
- Player's own species: brighter, slightly larger dots (4px vs 3px screen-space)
- AI species: subtle badge icon overlay on dot
- Other players' species: muted opacity (50%)
- Pellets not visible. Biome colors and heat map overlays provide context.

**Sprite Tier** (viewport 15–50 world units):
- Full procedural organism rendering as described throughout this doc: body blob, eyes, mouth, tails, shell, cilia
- Idle animations active (membrane wobble, breathing pulse, eye tracking)
- Pellets fully rendered. Eggs visible with translucent shell overlay.
- When following: vision cone + entity highlight rings visible

**Detail Tier** (viewport < 15 world units):
- Same as Sprite + enhanced visual effects:
  - Internal glow/pulse visible through body membrane (subtle organelle shimmer)
  - Cilia and flagella animate with full fidelity (individual strand movement)
  - Enhanced idle animations: visible peristaltic stomach movement, brain ganglion flicker
  - Energy glow on pellets (faint radiance proportional to energy content)
- When following: all overlays available including floating labels, pheromone arrows, X-ray mode

---

## Follow Mode Overlays

Vision cone: semi-transparent white-to-clear gradient, spreading from organism to view radius.
Edge fades to transparent. Width matches organism's View Angle stat.

Entity highlight rings: 2px colored outlines around detected entities:
- Green: food (plants, fungi)
- Red: threat (larger organisms, toxic zones)
- Yellow: prey (smaller organisms for carnivores)
- Blue: ally (same species)
- Purple: potential mate (opposite sex, same species)

Floating labels: small text near detected entities showing active input name
(e.g., "NearestPlant", "Threat"). Fade at distance. Only shown for the 3 strongest inputs.

Pheromone arrows: gradient arrows pointing in sensed pheromone direction.
Arrow color matches pheromone channel (red/green/blue). Opacity = intensity.

Echolocation ping ring: thin dashed circle at echo radius (white, 30% opacity).
Pulses outward from organism at echo frequency — ring expands from body edge to max radius, fading as it goes. Like a sonar sweep.

Echolocation silhouettes: entities detected by echo but outside vision cone render as **grey-white blobs** (no color, no species detail). High precision echoes produce correctly-sized silhouettes; low precision produces generic dots. Slight glow effect, like a radar blip.

Sound wave arcs: directional arcs at the edge of the organism's awareness. Incoming sound shown as concentric arc segments pointing toward the source. Arc thickness = intensity, color tint = frequency (warm red → cool blue gradient across the 0-1 frequency range). Animate as expanding wavefronts.

Sound emission ripples: organisms emitting sound show expanding concentric rings centered on the emitter. Ring color = emission frequency tint. Ring radius expands to effective sound range over ~0.5s, then fades. The followed organism's own emission ripples are more prominent.

---

## Perception Mode

Toggled alongside X-Ray when following an organism. Renders the world from the organism's subjective sensory perspective.

**Fog of war**: Semi-transparent dark overlay (80% opacity black) covers the entire viewport. "Holes" are cut in the fog for each active sensory zone:
- **Vision cone**: Sharp-edged cutout matching the organism's FOV arc. Full color and detail visible within.
- **Echolocation circle**: Softer-edged cutout (radial gradient from 50% to 0% opacity). Terrain faintly visible, entities are grey silhouettes.
- **Encounter range**: Tiny bright halo around the organism (1.5× body radius). Always visible even without other senses.

**Transition effects**:
- Day→night: Vision cone cutout smoothly shrinks by 40% over the dusk transition. Echolocation cutout unchanged. The fog creeps in.
- Entering forest biome: Vision cone shrinks to 0.7×.
- Burrowing: All cutouts collapse to zero except echolocation (at 50% radius). Screen goes nearly black. Claustrophobic.
- Camouflaged entities in vision cone: Rendered at reduced opacity (1 - camoStrength × stillness²). A perfectly still, highly camouflaged organism is a near-invisible ghost even within the cone.

**Pheromone gradients in fog**: Colored clouds bleed through the fog as translucent overlays. Gradient arrows are more prominent and saturated in perception mode — they're the organism's primary way to "see" beyond its direct senses.

**Sound arcs in fog**: Pulse from the fog boundary inward, giving a sense of direction without revealing what made the sound.

---

## X-Ray Mode

Activated by tapping own-species organism while following at Detail tier. Organism body becomes 60% transparent.

Organ overlays (rendered inside the organism body shape):
- **Stomach**: Amber chamber. Food particles inside colored by type (green=plant, red=meat, brown=fungi). Size reflects fullness. Yellow acid-level tint overlay.
- **Brain**: Cyan neural ganglion (matches preview.html mockup). Active synapse pulses as white flashes along dendrite lines. Size scales with brain BP investment.
- **Egg organ**: Translucent orb, grows from 0→full as EggStored progresses. Pulses gently when ready.
- **Fat reserves**: Yellowish layer between body wall and organs. Grows/shrinks with fatStored. Darker yellow when full.
- **Venom glands**: Two green dots near mouth. Pulse bright green when venom is being produced. Dim when depleted (recently used).

---

## Fungi Patches

All fungi are circular patches on the world map, larger than food pellets, semi-transparent.

| Type | Color | Particle Effect |
|------|-------|-----------------|
| Decomposer | Brown (#8B6914) | Tiny floating spore particles drifting upward |
| Toxic Mold | Sickly green (#7FCC2A) | Pulsing danger aura (expanding/contracting ring) |
| Nutrient Network | Gold (#DAA520) | Golden thread lines connecting to nearby organisms |
| Parasitic Bloom | Dark purple (#6A0DAD) | Thin tendrils reaching toward nearby organisms |
| Bioluminescent | Cyan (#00FFFF, 60% opacity) | Soft glow halo, shimmer effect mimicking food |

Fungi patches fade in on spawn (0.5s) and dissolve on decay (1s fade-out).

---

## Ecological Event Visuals

Events affect the entire world or large regions. 30-second warning toast before onset.

| Event | Visual Effect |
|-------|--------------|
| Bloom | Green particle burst from ground. World tint shifts greener. Plants visibly denser. |
| Drought | Cracked brown overlay on affected biomes. Subtle heat shimmer (wavy distortion). Plants sparse. |
| Plague | Sickly yellow-green fog patches that drift slowly. Infected organisms get a brief green flash. |
| Migration | NPC herd trail — faint particle trail following migration path. Herd organisms have unique gray tint. |
| Fungi Outbreak | Fungi patches visibly spreading outward from wetland/forest centers. Spore particle clouds. |
| Meteor Impact | Bright flash (0.5s white screen overlay). Dark crater circle scar persists for 24h. Debris particles. |

Event indicator icon appears in FloatingInfoBar during active events.

---

## Species Farewell Card

1080x1920 vertical card (story format) for social sharing on extinction/retirement.

Layout (top to bottom):
- **Banner**: Game logo + subtle gradient header (organism's diet-color hue)
- **Portrait**: Large organism rendering (procedural, centered) on blurred biome background
- **Species Name**: Stylized text, large (organism's color)
- **Stats Grid** (2x3): Duration, Generations, Peak Population, Total Offspring, Territory %, Final Rank
- **Mini-Achievements**: Row of small icons (up to 3) with labels (e.g., "Apex Predator", "Dynasty")
- **Cause of End**: "Retired by player" or "Extinction: starvation" — italic text
- **Footer**: Game name + date

Background: subtle gradient using organism's diet-derived hue (green→yellow→red).

---

## Burrowing Visual

**Entering burrow**: Organism fades to 20% opacity over the surfacing time (gene: 1.0-2.5s).
Body appears to sink slightly (scale Y to 95%).

**While burrowed**: Barely visible shimmer at organism location — heat-wave distortion effect.
No organism sprite visible at normal zoom. At close zoom: faint outline.

**Follow cam while burrowed**: View dims to 40% brightness. "BURROWED" text overlay (centered,
semi-transparent). All entity rings and labels hidden (inputs are zero).

**Surfacing**: Reverse fade — 20% → 100% opacity over surfacing time. Organism is visible
and vulnerable during this transition (can be attacked while fading in).

---

## Spore Animation

**Launch**: Parent organism plays subtle "release" pulse (body contracts slightly).
Small translucent orb (organism's diet color, 60% opacity) launches upward.

**Flight**: Parabolic arc over 0.5 seconds. Trailing particle ribbon in organism color.
Arc height = 1/3 of total distance. Orb rotates slowly during flight.

**Landing**: Small puff of particles on contact. If germination succeeds (30%):
spore becomes a small egg with slight spore-cap texture (ridged top). If germination fails:
spore fades out over 1 second with dissolving particles.
