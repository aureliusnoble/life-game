# Phase 9 — Client Rendering

Pixi.js world renderer, procedural organism rendering, LOD system, animation, and particle effects.

> **Before you start this phase**, read the general guidance in [`README.md`](./README.md).

### Phase 9 Guidance

**Read these design docs first:**
- `art.md` — **Read the entire document.** This is the visual bible for the game. Every rendering decision should match this spec.
- `components/game-components.md` Section 13 (OrganismRenderer) — rendering pipeline, stat-to-visual mapping
- `design/mockups/preview.html` — **Critical reference.** This is a working Canvas 2D organism renderer. Study it closely for: eye positioning (0.93x body rim), mouth types (filter/circle/chomper), tail generation from speed stat, shell plates from defense, brain ganglion rendering, color system (`dietColor(diet, metabolism)`). Your Pixi.js renderer must produce visually equivalent results.
- `architecture.md` Section 10 (Performance Budget) — 60fps target with 200 organisms in viewport

**Prerequisites:**
- Phase 8 must be complete (the React app shell and Pixi.js application setup).
- Phase 6 must be complete (entity data streaming over WebSocket).

**No manager action needed for this phase.** Pure client-side rendering code.

**Important implementation note:**
The organism renderer is the most visually complex part of the game. Refer back to `preview.html` constantly — it contains hard-won fixes for eye placement, mouth positioning with strength bulge, and brain rendering. The color system is: `hue = 120 - diet*120`, `saturation = 55 + metabolism*10`. Brain is always cyan (hue=210), stomach is always amber (hue=35).

**QA handoff for this phase:**
When done, tell the manager: "Run `pnpm --filter client dev`, open `http://localhost:5173/world` (with the server running). Verify: (1) Organisms appear as colored blobs with eyes, mouth, and tails — NOT just circles or squares, (2) Zoom in close to an organism (scroll wheel) — at detail level you should see eyes with white sclera and colored iris, mouth matching diet type, tails animating, (3) Zoom out — organisms simplify to sprites then dots, (4) Pellets appear as small green/red dots, (5) Frame rate stays at 60fps with ~100 organisms visible (check with browser performance monitor), (6) Compare organism appearance to `design/mockups/preview.html` — they should look similar."

---

## Step 9.1 — Pixi.js Application & Camera System

### What You're Implementing

Initialize the Pixi.js Application with WebGL (Canvas2D fallback), create the render loop tied to `requestAnimationFrame`, and implement a viewport/camera system with smooth pan (drag/WASD), zoom (scroll/pinch), and viewport state synced to the server.

### Design References

- `components/front-end.md` Section 1 — Technology stack: Pixi.js v8 via `@pixi/react`, `@use-gesture/react` for touch gestures.
- `art.md` Section 3 (Rendering Approach) — Canvas 2D / Pixi.js hybrid, WebGL primary with Canvas fallback.
- `architecture.md` Section 4 — Communication: client sends viewport rectangle to server, server sends only entities within viewport + 10% margin.
- `components/front-end.md` Section 4 — WorldStore: viewport, cameraMode, followTargetId.

### Implementation Details

```typescript
// client/src/renderer/PixiApp.ts
import { Application, Container } from 'pixi.js';

class WorldRenderer {
  app: Application;
  worldContainer: Container;    // all world content
  uiContainer: Container;       // HUD overlays (fixed position)
  camera: Camera;

  async init(canvas: HTMLCanvasElement): Promise<void> {
    this.app = new Application();
    await this.app.init({
      canvas,
      width: window.innerWidth,
      height: window.innerHeight,
      antialias: true,
      backgroundColor: 0x0a1628,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });
    this.worldContainer = new Container();
    this.uiContainer = new Container();
    this.app.stage.addChild(this.worldContainer, this.uiContainer);
    this.camera = new Camera(this.worldContainer);
  }

  startRenderLoop(): void {
    this.app.ticker.add(() => {
      this.camera.update();
      this.renderEntities();
    });
  }
}
```

#### Camera System

```typescript
class Camera {
  x: number = 250;           // world center
  y: number = 250;
  zoom: number = 1.0;        // 1.0 = default, >1 = zoomed in
  targetX: number = 250;
  targetY: number = 250;
  targetZoom: number = 1.0;
  smoothing: number = 0.1;   // lerp factor

  update(): void {
    // Smooth interpolation
    this.x += (this.targetX - this.x) * this.smoothing;
    this.y += (this.targetY - this.y) * this.smoothing;
    this.zoom += (this.targetZoom - this.zoom) * this.smoothing;

    // Apply to container transform
    this.container.scale.set(this.zoom);
    this.container.position.set(
      -this.x * this.zoom + screenWidth / 2,
      -this.y * this.zoom + screenHeight / 2,
    );
  }

  getViewport(): Viewport {
    const halfW = screenWidth / this.zoom / 2;
    const halfH = screenHeight / this.zoom / 2;
    return { x: this.x - halfW, y: this.y - halfH, w: halfW * 2, h: halfH * 2 };
  }

  pan(dx: number, dy: number): void {
    this.targetX += dx / this.zoom;
    this.targetY += dy / this.zoom;
  }

  zoomTo(level: number): void {
    this.targetZoom = Math.max(0.1, Math.min(10, level));
  }
}
```

#### Render Layer Architecture

The Pixi.js stage uses a 21-layer stack. Set up all containers in `init()` with correct z-ordering:

- `components/front-end.md` Section 7.1 — Full 21-layer specification with space distribution.

```typescript
// Render layer stack (back to front) — set up in WorldRenderer.init()
// WORLD-SPACE layers (move with camera, children of worldContainer)
//  1. BiomeBackground        — Colored biome regions (texture)
//  2. AmbientParticles       — Drifting microbes, bubbles, sediment (ParticleContainer)
//  3. PheromoneLayer         — Pheromone gradient clouds
//  4. PelletLayer            — Plant/meat pellets
//  5. FungiLayer             — Fungi patches with glow effects
//  6. OrganismLayer          — All organisms (sprites)
//  7. VisionConeLayer        — Follow mode only (Sprite+ tier): selected organism's FOV
//  8. EcholocationLayer      — Follow mode only (Sprite+ tier): ping ring + grey silhouettes
//  9. SoundWaveLayer         — Follow mode only (Sprite+ tier): directional arcs + ripples
// 10. PerceptionFogLayer     — Follow mode + Perception Mode: fog-of-war darkness
// 11. EntityLabelLayer       — Follow mode only (Detail tier): brain input labels

// SCREEN-SPACE layers (fixed to viewport, children of screenContainer)
// 12. DayNightOverlay        — Full-viewport semi-transparent darkness (MULTIPLY blend)
// 13. WeatherParticles       — Season-driven particle effects (above darkness)

// DEBUG OVERLAY layers (world-space, admin only, toggled via debugStore)
// 14. DebugSpatialGridLayer  — 20×20 grid + cell occupancy heatmap
// 15. DebugVisionConeLayer   — Vision cones (all faint, inspected bright)
// 16. DebugVelocityLayer     — Velocity arrows on organisms
// 17. DebugForceLayer        — Movement/collision/knockback force arrows
// 18. DebugCollisionLayer    — Bounding radius circles
// 19. DebugPheromoneLayer    — 3-channel enhanced pheromone heatmaps
// 20. DebugEnergyHeatmapLayer — Per-cell energy density heatmap

// HTML OVERLAY (React, not Pixi)
// 21. UIOverlayLayer         — Info bar, HUD, modals (positioned over canvas via CSS)

async init(canvas: HTMLCanvasElement): Promise<void> {
  // ... app init as above ...

  this.worldContainer = new Container();      // layers 1-11
  this.screenContainer = new Container();     // layers 12-13
  this.debugContainer = new Container();      // layers 14-20
  this.app.stage.addChild(this.worldContainer, this.screenContainer, this.debugContainer);

  // Create named layer containers inside worldContainer (in order)
  const layerNames = [
    'biomeBackground', 'ambientParticles', 'pheromoneLayer',
    'pelletLayer', 'fungiLayer', 'organismLayer',
    'visionConeLayer', 'echolocationLayer', 'soundWaveLayer',
    'perceptionFogLayer', 'entityLabelLayer',
  ];
  for (const name of layerNames) {
    const layer = new Container();
    layer.label = name;
    this.worldContainer.addChild(layer);
  }
}
```

Debug layers (14-20) are all low-alpha, toggled independently via `debugStore`, and only visible to admin users. Layer 21 (UIOverlayLayer) is implemented as React HTML components positioned absolutely over the canvas element.

#### Gesture Integration

Use `@use-gesture/react` for:
- **Drag**: Pan camera (dx, dy → camera.pan)
- **Pinch**: Zoom camera (scale → camera.zoomTo)
- **Wheel**: Zoom camera (deltaY → adjust targetZoom)
- **WASD keys**: Pan camera at constant speed

#### Viewport Sync

Send viewport rectangle to server whenever camera moves significantly (debounced, max 10 Hz):
```typescript
const viewport = camera.getViewport();
socketStore.sendViewport(viewport);
```

### Unit Tests

- Camera pan: `pan(100, 0)` moves camera right by `100/zoom` world units.
- Camera zoom: `zoomTo(2)` doubles the zoom level; viewport halves in size.
- Smooth interpolation: after multiple `update()` calls, camera converges on target.
- Viewport calculation: at zoom=1, viewport covers screen dimensions in world units.
- Viewport sync: moving camera sends updated viewport to server.

### Integration Tests

- Render empty world, drag to pan, scroll to zoom. Verify smooth camera movement.
- Follow mode: set followTargetId, verify camera tracks entity position.

### QA Checklist

- [ ] Pixi.js initializes with WebGL (or falls back to Canvas2D)
- [ ] Pan works via drag, WASD, and touch
- [ ] Zoom works via scroll wheel and pinch gesture
- [ ] Camera movement is smooth (interpolated, not jerky)
- [ ] Viewport updates are sent to server (verify with network inspector)
- [ ] Resolution adapts to devicePixelRatio (sharp on retina displays)

---

## Step 9.2 — World Background & Pellet Rendering

### What You're Implementing

Render the world background (biome-colored grid cells with soft gradients), plant pellets (green dots/sprites), meat pellets (red dots/sprites), eggs (small orbs), and toroidal world boundary indicators.

### Design References

- `art.md` Section 3 — Biome liquid colors, soft gradient boundaries, ambient particles.
- `core-gameplay-systems.md` Section 2.2 — Biome types with visual descriptions.
- `art.md` Section 4 — LOD: pellets become invisible dots at far zoom.
- `architecture.md` Section 4 — Binary protocol: pellet encoding (12 bytes).

### Implementation Details

#### Biome Background

```typescript
// Pre-render biome map as a single large texture (625 cells, 25x25)
function renderBiomeBackground(biomeMap: number[]): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 500;
  const ctx = canvas.getContext('2d')!;

  for (let cy = 0; cy < 25; cy++) {
    for (let cx = 0; cx < 25; cx++) {
      const biome = biomeMap[cy * 25 + cx];
      ctx.fillStyle = BIOME_COLORS[biome];
      ctx.fillRect(cx * 20, cy * 20, 20, 20);
    }
  }

  // Apply Gaussian blur for soft boundaries
  ctx.filter = 'blur(8px)';
  ctx.drawImage(canvas, 0, 0);

  return Texture.from(canvas);
}
```

Biome colors (from art.md):
- Grassland: `#1a3d1a` (dark green)
- Forest: `#0d2b0d` (deep green)
- Desert: `#3d3520` (sandy)
- Wetland: `#1a2d3d` (blue-green)
- Rocky: `#2d2d2d` (gray)

#### Pellet Rendering

Plant pellets: green circles, size proportional to energy. Meat pellets: red circles, decaying alpha based on age. Eggs: white/cream orbs with translucent shell. All rendered as simple `Graphics` or pre-rendered circle `Sprites` for performance.

#### Fungi Patch Rendering (Layer 5: FungiLayer) — `art.md` §13

All fungi are circular patches, larger than pellets, semi-transparent. Each of the 5 types has a distinct color and particle effect:

| Type | Color | Particle Effect |
|------|-------|-----------------|
| **Decomposer** | Brown (#8B6914, 50% opacity) | Tiny floating spore particles drifting upward (2-3 per patch, amber, slow rise) |
| **Toxic Mold** | Sickly green (#7FCC2A, 50% opacity) | Pulsing danger aura — expanding/contracting ring (0.5Hz, 20% opacity green ring) |
| **Nutrient Network** | Gold (#DAA520, 40% opacity) | Golden thread lines connecting to nearby organisms within effect radius |
| **Parasitic Bloom** | Dark purple (#6A0DAD, 50% opacity) | Thin tendrils reaching toward nearby organisms (animated bezier curves) |
| **Bioluminescent** | Cyan (#00FFFF, 60% opacity) | Soft glow halo (additive blend, radius = patch size × 3), shimmer effect |

```typescript
function renderFungiPatch(graphics: Graphics, fungi: FungiState) {
  const config = FUNGI_VISUAL_CONFIG[fungi.type];
  // Base circle
  graphics.circle(fungi.x, fungi.y, fungi.radius);
  graphics.fill({ color: config.color, alpha: config.alpha });
  // Per-type particle/effect (see table above)
  config.renderEffect(graphics, fungi, particleSystem);
}
```

**Lifecycle animations**: Fade in on spawn (0→full alpha over 0.5s). Dissolve on decay (full→0 alpha over 1s fade-out).

#### Toroidal Indicators

At world edges, render faded mirror copies of nearby entities to show wrapping. Or: subtle grid line at world boundaries with a glow effect.

### Unit Tests

- Biome texture has correct colors at known cell positions.
- Pellet size scales with energy value.
- Meat pellet alpha decreases as decay timer increases.

### Integration Tests

- Render world with 5000 plants and 500 meat pellets. Verify 60fps.
- Zoom out fully: verify pellets become dots, not invisible.

### QA Checklist

- [ ] Biome regions are visually distinct with soft boundaries
- [ ] Plant pellets are green, meat pellets are red
- [ ] Pellet sizes reflect their energy content
- [ ] Eggs are visible and distinguishable from pellets
- [ ] Toroidal wrapping is indicated visually at world edges
- [ ] Fungi patches render with correct per-type colors and effects (`art.md` §13)
- [ ] Decomposer: brown with upward spore particles
- [ ] Toxic Mold: green with pulsing danger aura ring
- [ ] Nutrient Network: gold with thread lines to nearby organisms
- [ ] Parasitic Bloom: purple with tendrils reaching toward organisms
- [ ] Bioluminescent: cyan glow halo (additive blend, prominent at night)
- [ ] Fungi fade in on spawn (0.5s) and dissolve on decay (1s)
- [ ] Performance: 5000+ pellets + fungi patches render at 60fps

---

## Step 9.3 — Organism Renderer

### What You're Implementing

Port the procedural organism rendering from `preview.html` to Pixi.js: body blob with diet-based coloring, stat-driven shape (speed→tails, strength→front bulk, defense→shell plates), Spore-style eyes, mouth types (filter cilia, circle, chomper), and brain internals visualization.

### Design References

- `design/mockups/preview.html` — Full Canvas 2D rendering pipeline (2200+ lines). Rendering order: background → vision cone → sensor ring → tails → cilia → shell → body blob → internals → eyes → mouth → animation overlays.
- `art.md` Section 2 (Stat-to-Visual Mapping) — Complete mapping of every stat to visual element.
- `components/game-components.md` Section 12 (OrganismRenderer) — Rendering interface, stat-to-visual functions.
- `art.md` Section 1 (Color System) — `dietColor(diet, metabolism)`: hue = 120 - diet*120, saturation = 55 + metabolism*10. Brain hue = fixed 210 (cyan).

### Implementation Details

#### Rendering Pipeline (back to front)

1. **Vision cone** (optional, follow mode): translucent arc showing view angle/radius.
2. **Tails**: `count = max(1, floor(speed * 1.6))`. Animated sinusoidal wave.
3. **Shell plates** (if DEF >= 1.0): covering back-left hemisphere.
4. **Body blob**: Elliptical with diet-hue coloring. `hue = 120 - diet * 120`, saturation from metabolism.
5. **Brain** (if internals visible): cyan ganglion at back-center, dendrite tendrils.
6. **Stomach** (if internals visible): warm amber, adaptive position.
7. **Eyes**: Spore-style (white sclera, colored iris, dark pupil, highlights). Position: ~0.93x body rim radius.
8. **Mouth**: Filter cilia (diet<0.25), circle (0.25-0.65), chomper jaw (>=0.65). Position accounts for STR front bulge.

#### Pre-rendering to Texture

For the Sprite LOD tier, pre-render each unique organism appearance to an off-screen canvas, then convert to a Pixi Texture. Cache by a hash of relevant stats (diet, speed, strength, defense, size).

```typescript
function renderOrganismToTexture(stats: OrganismVisualStats): Texture {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const size = Math.ceil(stats.bodyRadius * 2 + 20);
  canvas.width = canvas.height = size;

  // Draw using the same pipeline as preview.html
  drawTails(ctx, stats);
  drawShell(ctx, stats);
  drawBody(ctx, stats);
  drawEyes(ctx, stats);
  drawMouth(ctx, stats);

  return Texture.from(canvas);
}
```

#### Color System

```typescript
function dietColor(diet: number, metabolism: number): string {
  const hue = 120 - diet * 120;          // 0=green, 0.5=yellow, 1=red
  const sat = 55 + metabolism * 10;       // higher metabolism = more vivid
  const light = 50;
  return `hsl(${hue}, ${sat}%, ${light}%)`;
}
```

### Unit Tests

- `dietColor(0, 1)` = green hue (120). `dietColor(1, 1)` = red hue (0).
- Tail count: speed=0.5 → 0 tails (min 1). speed=2.0 → 3 tails.
- Shell plates: DEF=0 → none. DEF=2.0 → visible plates.
- Eye position at ~0.93x body radius, within front hemisphere (≤75° from heading).
- Mouth type: diet 0.1 → filter cilia. diet 0.5 → circle. diet 0.9 → chomper.

### Integration Tests

- Render all 9 archetypes (Herbivore, Carnivore, Omnivore, Scavenger, Tank, Scout, Assassin, Big Brain, Tiny Brain). Verify each looks distinct.
- Render organism at multiple sizes. Verify scaling works correctly.

### QA Checklist

- [ ] Organisms look like the preview.html mockup
- [ ] Diet color gradient: green→yellow→red is smooth and correct
- [ ] Eyes are on the body rim (not inside or floating outside)
- [ ] Mouth position accounts for strength front bulge
- [ ] Shell plates cover back-left hemisphere for high-defense organisms
- [ ] Brain internals visible when toggled (cyan ganglion + tendrils)
- [ ] Texture caching works (same stats → reuse texture)

---

## Step 9.4 — LOD System (Level of Detail)

### What You're Implementing

Three-tier LOD system: **Dot** (>50 units from camera center, colored circle), **Sprite** (15-50 units, cached pre-rendered texture), **Detail** (<15 units, full procedural render). Smooth transitions between tiers, texture cache management.

### Design References

- `art.md` Section 4 (LOD Tiers) — Dot, Sprite, Detail tier distances, visual descriptions.
- `architecture.md` Section 10 (Performance Budget) — Rendering budget: 60fps target, viewport typically contains 50-80 entities.
- `components/game-components.md` Section 12 (OrganismRenderer) — LOD interface.

### Implementation Details

```typescript
enum LODTier { Dot, Sprite, Detail }

function getLODTier(distFromCamera: number): LODTier {
  if (distFromCamera > 50) return LODTier.Dot;
  if (distFromCamera > 15) return LODTier.Sprite;
  return LODTier.Detail;
}

class OrganismDisplayObject {
  dotGraphics: Graphics;          // simple colored circle (2-4px)
  spriteDisplay: Sprite;          // cached texture
  detailContainer: Container;     // full procedural render

  update(tier: LODTier): void {
    this.dotGraphics.visible = (tier === LODTier.Dot);
    this.spriteDisplay.visible = (tier === LODTier.Sprite);
    this.detailContainer.visible = (tier === LODTier.Detail);
  }
}
```

#### Texture Cache

```typescript
class TextureCache {
  private cache: Map<string, Texture> = new Map();

  getOrCreate(statsHash: string, renderFn: () => Texture): Texture {
    if (!this.cache.has(statsHash)) {
      this.cache.set(statsHash, renderFn());
    }
    return this.cache.get(statsHash)!;
  }

  // Evict textures not used in last 60 seconds
  prune(): void { ... }
}
```

Stats hash includes: diet, speed, strength, defense, size tier, metabolism (rounded to nearest 0.1 to avoid cache explosion).

#### Transition Smoothing

When an organism crosses a LOD boundary, fade between tiers over 0.2 seconds to avoid pop-in:
```
if (previousTier !== currentTier):
    fadeOut previous display over 200ms
    fadeIn new display over 200ms
```

### Unit Tests

- LOD tier calculation: dist=60 → Dot, dist=30 → Sprite, dist=5 → Detail.
- Texture cache: same stats hash returns same texture (no re-render).
- Cache prune: textures unused for 60s are evicted.
- Stats hash: organisms with identical relevant stats produce same hash.

### Integration Tests

- Render 100 organisms at varying distances. Verify correct LOD per organism.
- Zoom in/out smoothly. Verify LOD transitions don't cause visual glitches.
- Performance: 200+ organisms in viewport at Sprite tier maintains 60fps.

### QA Checklist

- [ ] Distant organisms render as colored dots (fast)
- [ ] Mid-range organisms use cached sprite textures
- [ ] Close organisms render with full procedural detail
- [ ] LOD transitions are smooth (no pop-in)
- [ ] Texture cache prevents redundant rendering
- [ ] Performance stays at 60fps with 100+ organisms in viewport

---

## Step 9.5 — Animation System

### What You're Implementing

Animate organisms: idle bobbing, eating animation, fleeing speed lines, pheromone pulse, burrowing, egg laying. Implement server-tick interpolation for smooth movement between 20 Hz updates.

### Design References

- `art.md` Section 5 (Animation) — 6 animation states: idle, eating, pheromone, fleeing, burrowing, laying_eggs. Animation principles: wobble while moving, mouth opens when eating, flash red when damaged, glow when reproducing.
- `design/mockups/preview.html` — Animation state machine implementation (6 states with transitions).
- `components/front-end.md` Section 4 — WorldStore: `applyDelta()` with interpolation.

### Implementation Details

#### Server Tick Interpolation

Server sends updates at 20 Hz. Client renders at 60fps. Interpolate entity positions between the last two server states:

```typescript
class EntityInterpolator {
  previousState: EntityState;
  currentState: EntityState;
  receivedAt: number;

  getInterpolatedPosition(now: number): Vec2 {
    const t = Math.min(1, (now - this.receivedAt) / BROADCAST_INTERVAL_MS);
    return {
      x: lerp(this.previousState.x, this.currentState.x, t),
      y: lerp(this.previousState.y, this.currentState.y, t),
    };
  }
}
```

#### Animation States

```typescript
// Full animation state enum — see art.md §8 for all 8 animation principles.
// States are prioritized: higher-priority states override lower ones.
enum AnimationState {
  Idle,           // Default: gentle bob, tail wave, breathing pulse
  Moving,         // Locomotion: body tilts, cilia beat, bubble trail
  Eating,         // Mouth opens, food drawn in, satisfaction pulse
  Fleeing,        // Speed lines, elongated body, fast tails
  Pheromone,      // Colored pulse ring from body
  Attacking,      // Body lunges, jaw snaps, red flash on target
  Damaged,        // Red flash, body contracts, particle burst
  Reproducing,    // Golden glow, body elongates, split animation
  Burrowing,      // Sinks, transparency, dust particles
  LayingEggs,     // Body contracts, glow, egg appears
  Dying,          // Pop: body bursts into meat-colored particles
}

function getAnimationState(entity: EntityState): AnimationState {
  if (entity.isDying) return AnimationState.Dying;
  if (entity.isBurrowed) return AnimationState.Burrowing;
  if (entity.isDamaged) return AnimationState.Damaged;
  if (entity.isAttacking) return AnimationState.Attacking;
  if (entity.isReproducing) return AnimationState.Reproducing;
  if (entity.isLayingEgg) return AnimationState.LayingEggs;
  if (entity.isEating) return AnimationState.Eating;
  if (entity.isFleeing) return AnimationState.Fleeing;
  if (entity.isEmittingPheromone) return AnimationState.Pheromone;
  if (entity.speed > 0.1) return AnimationState.Moving;
  return AnimationState.Idle;
}
```

#### Per-State Animations (`art.md` §8)

- **Idle**: Gentle body bob (sinusoidal Y offset, amplitude=1px, frequency=0.5Hz). Tail gentle wave. Membrane wobble (sine wave on body outline). Subtle size pulse (breathing). Organelles drift inside body.
- **Moving**: Body tilts in movement direction (lean angle = velocity × 0.1 rad). Cilia/flagella beat faster (frequency proportional to speed). Micro-bubble trail behind organism (1-2 particles/frame, drift backward, fade over 0.5s). Tails whip at speed-proportional rate.
- **Eating**: Mouth opens wider, food particles drawn toward mouth. Brief body size increase (satisfaction pulse). Body pulses slightly.
- **Fleeing**: Speed lines trailing behind. Body slightly elongated (scaleX × 1.1, scaleY × 0.9). Tails beat faster.
- **Pheromone**: Colored pulse ring expanding from body (matches pheromone channel color — red/green/blue).
- **Attacking** (`art.md` §8.4): Body lunges forward (translate 0.3× body radius toward target over 0.15s, snap back over 0.1s). Jaw/mouth opens wide during lunge. Red flash on target entity (0.2s red tint overlay). Knockback particle burst at contact point (5-8 red particles).
- **Damaged** (`art.md` §8.5): Red flash on body (0.15s red tint overlay, alpha=0.6). Body contracts briefly (scale to 0.9× over 0.1s, return to 1.0× over 0.15s). Small particle burst outward from hit point (3-5 white particles).
- **Reproducing** (`art.md` §8.6): Golden glow builds around body (additive yellow halo, alpha ramps 0→0.4 over 1s). Body elongates (scaleX × 1.3, scaleY × 0.8). Visual split — body pinches in center, two halves separate. Gold particle burst at split point (15-20 particles). Egg entity appears at separation point.
- **Burrowing** (`art.md` §16): Body sinks (Y offset increases), fade to 20% opacity over surfacing time (1.0-2.5s from gene). Dust particles at entry point. While burrowed: barely visible shimmer (heat-wave distortion). Surfacing: reverse fade 20%→100%.
- **Laying Eggs**: Body contracts, warm glow effect, egg appears below organism.
- **Dying** (`art.md` §8.7): Pop animation — body bursts outward into meat-colored particles (20-40 particles, drift outward). Body scale rapidly shrinks to 0 while particles expand. Meat pellet(s) appear at death location after particle burst settles.

### Unit Tests

- Interpolation: t=0 returns previous position, t=1 returns current, t=0.5 returns midpoint.
- Animation state derivation: entity with isFleeing=true → Fleeing state.
- Animation state priority: entity with isAttacking=true AND isEating=true → Attacking (higher priority).
- Idle bob: Y offset oscillates between -1 and +1 over time.
- Moving state: entity with speed > 0.1 and no other flags → Moving.
- Dying state: highest priority, overrides all other flags.

### Integration Tests

- Render moving organisms: verify smooth interpolated movement (no jitter at 60fps).
- Trigger each of the 11 animation states: verify visual is correct and transitions smoothly.
- Attacking lunge: body translates toward target then snaps back.
- Reproducing: golden glow → elongation → split → particles.
- Dying: body shrinks, meat-colored particles burst outward.

### QA Checklist

- [ ] Movement is smooth between server ticks (no teleporting)
- [ ] Idle organisms gently bob, breathe, wobble (not static) (`art.md` §8.1)
- [ ] Moving organisms tilt in movement direction with micro-bubble trail (`art.md` §8.2)
- [ ] Eating animation is visible (mouth opens, food drawn in) (`art.md` §8.3)
- [ ] Attacking animation: lunge + jaw snap + red flash on target (`art.md` §8.4)
- [ ] Damaged animation: red flash + body contraction + particle burst (`art.md` §8.5)
- [ ] Reproducing animation: golden glow → elongation → split (`art.md` §8.6)
- [ ] Death animation: pop burst into meat-colored particles (`art.md` §8.7)
- [ ] Fleeing organisms show speed lines
- [ ] Pheromone emission shows colored pulse
- [ ] Burrowing shows sinking + fade to 20% opacity (`art.md` §16)
- [ ] Laying eggs shows body contraction + glow

---

## Step 9.6 — Particle & Effects System

### What You're Implementing

Lightweight particle system for: death explosion (body disperses into meat-colored particles), reproduction sparkle, combat hit flash, pheromone trail particles, plant growth shimmer, and seasonal ambient particles.

### Design References

- `art.md` Section 6 (Effects) — Death particles, reproduction glow, combat flash, pheromone trails.
- `art.md` Section 3 — Ambient particles vary by biome (microbe specks, bubbles, sediment).
- `components/front-end.md` Section 2 — WorldRenderer effects layer.

### Implementation Details

```typescript
interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number;           // 0-1, decreases per frame
  color: number;
  size: number;
  alpha: number;
}

class ParticleSystem {
  particles: Particle[] = [];
  maxParticles: number = 2000;

  emit(config: ParticleConfig): void {
    const count = Math.min(config.count, this.maxParticles - this.particles.length);
    for (let i = 0; i < count; i++) {
      this.particles.push(createParticle(config));
    }
  }

  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt / p.maxLife;
      p.alpha = p.life;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(container: Container): void {
    // Batch render all particles using a single Graphics or ParticleContainer
  }
}
```

#### Effect Types

| Effect | Trigger | Particles | Color | Duration |
|--------|---------|-----------|-------|----------|
| Death | Organism dies | 20-40 | Red/meat color | 1.0s |
| Reproduction | Egg laid | 10-15 | White/gold sparkle | 0.5s |
| Combat hit | Attack lands | 5-10 | Red flash | 0.3s |
| Pheromone trail | Emitting pheromone | 1-3 per frame | Channel color (R/G/B) | 2.0s |
| Plant growth | Plant spawns | 3-5 | Green | 0.5s |
| Ambient | Always (per biome) | 5-20 per screen | Biome-tinted | 5-10s |

### Unit Tests

- Emit 10 particles: verify count increases by 10.
- Update: particles move by velocity*dt, life decreases.
- Dead particles (life<=0) are removed.
- Max particle cap: emitting beyond max is clamped.

### Integration Tests

- Kill organism: verify death particles appear and fade.
- Render ambient particles: verify biome-appropriate colors.
- Performance: 2000 particles render at 60fps.

### QA Checklist

- [ ] Death effect is visually satisfying (body disperses)
- [ ] Reproduction sparkle is visible and brief
- [ ] Combat flash indicates damage clearly
- [ ] Pheromone trails show emission channel color
- [ ] Ambient particles give biomes visual character
- [ ] Particle count stays within budget (no performance impact)

---

## Step 9.6b — Day/Night Overlay & Environment Rendering

### What You're Implementing

Screen-space environment layers: the DayNightOverlay (Layer 12) that darkens the world at night using MULTIPLY blend mode, the WeatherParticleRenderer (Layer 13) with season-driven particles, and per-season biome visual effects.

### Design References

- `components/front-end.md` Section 7.1 — 21-layer render stack: layers 12-13 are screen-space.
- `components/front-end.md` Section 7.3 — Day/Night rendering: MULTIPLY blend, tint formula, night effects on eyes/fungi/pellets.
- `components/front-end.md` Section 7.4 — Seasonal visual effects per biome.
- `components/front-end.md` Section 7.6 — Weather particle system: season-driven particles, counts, sizes, lifespans.
- `art.md` Section 3 — Day/night cycle visual style.

### Implementation Details

#### DayNightOverlay (Layer 12)

A Pixi.js Graphics rectangle covering the entire viewport (screen-space), updated every frame from the env header's `ambientLight` byte (0=midnight, 255=noon):

```typescript
class DayNightOverlay {
  private overlay: Graphics;

  constructor(screenContainer: Container) {
    this.overlay = new Graphics();
    this.overlay.blendMode = 'multiply'; // darkens underlying layers without washing out color
    screenContainer.addChild(this.overlay);
  }

  update(ambientLight: number, screenWidth: number, screenHeight: number): void {
    const light = ambientLight / 255;           // 0.0 = midnight, 1.0 = noon
    const nightStrength = 1.0 - light;

    this.overlay.clear();
    this.overlay.rect(0, 0, screenWidth, screenHeight);

    // Tint: lerp from white (day, multiply identity) to deep blue-purple (night)
    const tint = lerpColor(0xFFFFFF, 0x1a1a3a, nightStrength * 0.7);
    this.overlay.fill({ color: tint, alpha: nightStrength * 0.55 });
    // Max 70% tint strength, max 55% opacity at midnight
  }
}
```

**Visual progression:**
- **Noon** (light=1.0): Fully transparent — world at full brightness
- **Dusk** (light~0.5): Subtle warm-blue tint, ~28% opacity
- **Midnight** (light=0.0): Deep blue-purple overlay, 55% opacity
- **Dawn** (light~0.5): Same as dusk — sinusoidal, symmetric (smooth because server sends sinusoidal `ambientLight`)

**Additional night effects** (applied in organism renderer):
- Organism eyes: Additive glow sprite on eye highlights, opacity = `nightStrength * 0.3`
- Bioluminescent fungi: Additive circle glow, radius = fungi size × 3 (always rendered, only visible when overlay darkens surroundings)
- Plant pellets: `alpha *= (0.7 + 0.3 * light)` — slightly dim at night
- Meat pellets: Unaffected (faint natural glow)

#### Weather Particle System (Layer 13)

Season-driven particles rendered above the DayNightOverlay. Uses a dedicated ParticleContainer for GPU-batched rendering. Particles are screen-space (unaffected by camera pan):

```typescript
// Weather particle definitions per season
const WEATHER_PARTICLES: Record<Season, WeatherConfig | null> = {
  spring: { count: [30, 50], size: 2, color: 'green-white', drift: { x: 0, y: -0.3 }, lifespan: [3, 5] },
  summer: null, // no weather particles (clear skies)
  autumn: { count: [20, 40], size: [3, 4], color: 'amber-brown', drift: { x: 0, y: 0.5 }, lifespan: [4, 6], tumble: true },
  winter: { count: [30, 60], size: [2, 3], color: 'white-ice-blue', drift: { x: 0, y: 0.4 }, lifespan: [5, 8], sway: true },
};
```

Particles spawn at random positions along the top edge of the viewport and drift through. Performance budget: max 100 weather particles.

#### Seasonal Visual Effects

Per-season biome tint shifts and special effects applied to the BiomeBackground (Layer 1) and AmbientParticles (Layer 2):

- **Spring**: Greener/more saturated biome tint. Wetland biome edges shimmer (subtle sine-wave distortion, 2px amplitude, 0.5Hz).
- **Summer**: Warmer/brighter biome tint. Desert biome has visible heat haze (screen-space vertical sine distortion, 1px amplitude, applied as post-process on desert regions).
- **Autumn**: Warmer reds/ambers, desaturated biome tint. Forest biome gets scattered bright-colored particle bursts every ~5 seconds (falling leaves — 3-5 particles, warm palette, gentle spiral down).
- **Winter**: Blue-shifted/desaturated/darker biome tint. Wetland biome gets glass-like sheen overlay (20% opacity white rectangle over frozen cells, subtle refraction edge glow).

Performance budget: Max 200 ambient particles + 100 weather particles = 300 total. All simple 1-4px sprites via ParticleContainer for GPU-batched rendering.

### Unit Tests

- DayNightOverlay at light=255: fully transparent (alpha near 0).
- DayNightOverlay at light=0: deep blue-purple tint, alpha=0.55.
- DayNightOverlay at light=128 (dusk): intermediate tint, alpha ~0.28.
- Weather particles: spring spawns 30-50 upward-drifting particles.
- Weather particles: summer spawns no particles.
- Weather particles: particle count stays within 100 budget.
- Seasonal biome tint: spring applies greener tint, winter applies blue shift.

### QA Checklist

- [ ] Day/night cycle visually transitions from bright to dark smoothly
- [ ] Midnight has visible blue-purple tint (not pure black)
- [ ] Organism eyes glow faintly at night
- [ ] Bioluminescent fungi are visible as light sources at night
- [ ] Spring spores drift upward through viewport
- [ ] Autumn detritus tumbles downward
- [ ] Winter crystals fall with horizontal sway
- [ ] Seasonal biome tints shift visually (green spring → warm summer → amber autumn → blue winter)
- [ ] Forest "falling leaves" bursts appear in autumn
- [ ] Wetland shimmer visible in spring, frozen sheen in winter
- [ ] Total particle count stays within 300 budget at 60fps

---

## Step 9.6c — Ecological Event Visual Effects

### What You're Implementing

Client-side rendering of world-scale ecological events. When the server signals an active event via the environment header byte, the renderer applies event-specific visual effects: full-viewport overlays, biome tint shifts, particle systems, and persistent visual scars. A 30-second warning toast precedes each event onset.

### Design References

- `art.md` Section 14 (Ecological Event Visuals) — Per-event visual effects: bloom, drought, plague, migration, fungi outbreak, meteor impact.
- `core-gameplay-systems.md` Section 6 (Ecological Events) — Event triggers, durations, gameplay effects.
- `components/back-end.md` Section 11.9 (Ecological Event System) — Server-side event detection and resolution.

### Implementation Details

```typescript
// client/src/rendering/event-effects.ts

type ActiveEvent = 'none' | 'bloom' | 'drought' | 'plague' | 'migration' | 'fungiOutbreak' | 'meteor';

class EventEffectRenderer {
  private currentEvent: ActiveEvent = 'none';
  private eventProgress: number = 0;   // 0→1 over event duration
  private overlay: Graphics;
  private eventParticles: ParticleSystem;

  update(activeEvent: ActiveEvent, progress: number, dt: number): void {
    this.currentEvent = activeEvent;
    this.eventProgress = progress;
    this.renderEventEffect(dt);
  }

  private renderEventEffect(dt: number): void {
    switch (this.currentEvent) {
      case 'bloom':      this.renderBloom(); break;
      case 'drought':    this.renderDrought(); break;
      case 'plague':     this.renderPlague(dt); break;
      case 'migration':  this.renderMigration(dt); break;
      case 'fungiOutbreak': this.renderFungiOutbreak(dt); break;
      case 'meteor':     this.renderMeteor(); break;
    }
  }
}
```

#### Per-Event Visual Effects (`art.md` §14)

| Event | Visual Effect | Implementation |
|-------|--------------|----------------|
| **Bloom** | Green particle burst from ground, world tint shifts greener, plants visibly denser | BiomeBackground hue += 10° (green shift), saturation × 1.2. Green particles rise from random ground points (20-30 particles, slow upward drift, 3s lifespan). Plant pellet alpha × 1.3 (brighter). |
| **Drought** | Cracked brown overlay on affected biomes, subtle heat shimmer, plants sparse | Overlay: semi-transparent cracked-earth texture (brown, 30% opacity) on desert/grassland biomes. Screen-space sinusoidal vertical distortion (1px amplitude, 0.3Hz) on affected regions. Plant pellet alpha × 0.5 (dimmer). |
| **Plague** | Sickly yellow-green fog patches drifting slowly, infected organisms flash green | 5-8 translucent yellow-green (#7FCC2A, 20% opacity) ellipses drift across viewport (speed=0.5 world units/s). Infected organisms: brief green tint flash every 2s (0.2s duration, green overlay alpha=0.4). |
| **Migration** | NPC herd trail: faint particle trail along migration path, herd organisms grey-tinted | Particle ribbon along herd movement vector (10-15 white-grey particles, 2s lifespan, drift along path). Migration herd organisms rendered with grey desaturation overlay (saturation × 0.3). |
| **Fungi Outbreak** | Fungi patches visibly spreading outward, spore particle clouds | Existing fungi patches pulse (scale oscillates 1.0-1.15× at 0.5Hz). Spore cloud particles emanate from wetland/forest biome centers (amber-brown, slow random drift, 30-40 particles). |
| **Meteor Impact** | Bright flash (0.5s white screen overlay), dark crater circle scar persists 24h, debris particles | Frame 0: white flash (full-screen white overlay, alpha 1→0 over 0.5s). Impact point: dark circular scar (brown-black, 5 world-unit radius, alpha=0.6, persists for 24h game-time). Debris particles radiate outward from impact (30-50 particles, fast initial velocity, 1.5s lifespan). |

#### Event Warning Toast

30 seconds before event onset, show a warning banner in the FloatingInfoBar:
```typescript
function EventWarningToast({ event, secondsUntil }: { event: ActiveEvent; secondsUntil: number }) {
  return (
    <div className="bg-warning/20 border border-warning text-warning px-3 py-1 rounded text-sm animate-pulse">
      ⚠ {EVENT_NAMES[event]} approaching ({secondsUntil}s)
    </div>
  );
}
```

### Unit Tests

- Each event type renders without errors when active.
- Bloom: biome tint shifts greener (hue increases).
- Drought: distortion shader applies to affected biomes only.
- Plague: fog patches drift across viewport at correct speed.
- Meteor: white flash alpha decays from 1→0 over 0.5s.
- Meteor crater scar renders at correct world position and persists.
- No event effects render when `activeEvent` is `'none'`.

### QA Checklist

- [ ] Bloom visibly greens the world and spawns rising green particles (`art.md` §14)
- [ ] Drought shows cracked overlay and heat shimmer distortion (`art.md` §14)
- [ ] Plague fog patches drift and infected organisms flash green (`art.md` §14)
- [ ] Migration herd trail particles follow movement path (`art.md` §14)
- [ ] Fungi outbreak: existing patches pulse, spore clouds emanate (`art.md` §14)
- [ ] Meteor impact: white flash → crater scar → debris particles (`art.md` §14)
- [ ] 30-second warning toast appears before event onset
- [ ] Event indicator icon visible in FloatingInfoBar during active events
- [ ] Event visuals don't persist after event ends (except meteor crater)
- [ ] Performance: event particles stay within overall 300-particle budget

---

## Step 9.6d — Spore Flight Animation

### What You're Implementing

Client-side rendering of spore dispersal: the parabolic arc flight from parent organism to landing position, with trailing particle ribbon, rotation during flight, and landing effects (germination puff or dissolve).

### Design References

- `art.md` Section 17 (Spore Animation) — Launch pulse, parabolic arc, trailing ribbon, landing puff/dissolve.
- `core-gameplay-systems.md` Section 3.4 (Spore Dispersal) — Spore flight mechanics, 30% germination chance.

### Implementation Details

```typescript
// client/src/rendering/spore-animation.ts

interface ActiveSpore {
  startX: number; startY: number;
  endX: number;   endY: number;
  color: number;          // Diet-derived color of parent organism
  launchTime: number;     // Timestamp of launch
  duration: number;       // 0.5 seconds
  willGerminate: boolean; // Determines landing effect
}

function renderSpore(graphics: Graphics, spore: ActiveSpore, now: number): boolean {
  const t = (now - spore.launchTime) / spore.duration;  // 0→1
  if (t > 1) return false; // done

  // Parabolic arc: x = lerp, y = lerp + parabola offset
  const x = lerp(spore.startX, spore.endX, t);
  const baseY = lerp(spore.startY, spore.endY, t);
  const arcHeight = dist(spore.startX, spore.startY, spore.endX, spore.endY) / 3;
  const y = baseY - arcHeight * 4 * t * (1 - t);  // Parabola: peak at t=0.5

  // Draw spore orb (diet color, 60% opacity, slow rotation)
  const rotation = t * Math.PI * 2;
  drawSporeOrb(graphics, x, y, spore.color, 0.6, rotation);

  // Trailing particle ribbon (1-2 particles per frame along arc)
  if (Math.random() < 0.7) {
    particleSystem.emit({
      x, y, count: 1, color: spore.color,
      size: 1.5, life: 0.3, velocity: { x: 0, y: 0.2 }, alpha: 0.4,
    });
  }

  return true; // still active
}

function renderSporeLanding(spore: ActiveSpore): void {
  if (spore.willGerminate) {
    // Success: puff of particles + spore becomes small egg with ridged cap
    particleSystem.emit({
      x: spore.endX, y: spore.endY, count: 8,
      color: spore.color, size: 2, life: 0.5,
      velocity: { x: 'random(-1,1)', y: 'random(-1,1)' }, alpha: 0.6,
    });
  } else {
    // Failure: spore fades out with dissolving particles over 1 second
    particleSystem.emit({
      x: spore.endX, y: spore.endY, count: 5,
      color: spore.color, size: 1, life: 1.0,
      velocity: { x: 'random(-0.3,0.3)', y: -0.2 }, alpha: 0.3,
    });
  }
}
```

**Launch trigger**: When spore entity first appears in DELTA update, parent organism plays subtle "release" pulse (body contracts 5% for 0.1s).

### Unit Tests

- Spore arc position at t=0 is start position, t=1 is end position.
- Arc peak height at t=0.5 equals distance/3 above midpoint.
- Spore rotation completes one full turn over flight duration.
- Germination landing spawns 8 particles; failure spawns 5.
- Spore removed from active list after duration completes.

### QA Checklist

- [ ] Spore launch visible as translucent orb leaving parent (`art.md` §17.1)
- [ ] Parabolic arc smooth over 0.5s with correct height (`art.md` §17.2)
- [ ] Trailing particle ribbon follows spore path (`art.md` §17.2)
- [ ] Successful germination: landing puff + egg appears (`art.md` §17.3)
- [ ] Failed germination: spore fades with dissolving particles (`art.md` §17.3)
- [ ] Parent organism contracts slightly on spore launch

---

## Step 9.7 — X-Ray Overlay Rendering

### What You're Implementing

The X-Ray mode rendering: when following an own-species organism at Detail tier and X-Ray is toggled on, the body becomes semi-transparent and internal organs are rendered directly on the creature: stomach (with contents), brain ganglion (with activity), egg organ (with progress), fat reserves (if trait purchased), and venom glands (if trait purchased).

### Design References

- `core-gameplay-systems.md` Section 7.1 (X-Ray Overlay) — Stomach, brain, egg organ, fat reserves, venom glands visualization descriptions.
- `art.md` Section 5 (Internals Rendering) — Internal organ visual style, colors, animation.
- `design/mockups/preview.html` — Reference implementation of internals toggle (showInternals mode): brain ganglion (cyan, hue=210), stomach (amber, hue=35), organelles.

### Implementation Details

```typescript
function renderXRayOverlay(graphics: Graphics, entity: EntityState, detail: EntityDetail) {
  // 1. Make body semi-transparent (reduce body alpha to 0.3)

  // 2. Stomach
  //    - Chamber shape inside lower body, colored by contents
  //    - Fill level = entity.fullness
  //    - Contents colored: green particles = plant, red particles = meat
  //    - Acid level shown as yellow tint overlay (more acid = more yellow)
  //    - Animated: contents visibly shrink as digestion extracts energy
  const stomachPos = computeStomachPosition(entity);
  renderStomachOrgan(graphics, stomachPos, entity.fullness, entity.stomachPlantRatio, detail.acidLevel);

  // 3. Brain ganglion
  //    - Cyan-blue (hue=210) glowing node cluster at back-center
  //    - Size scales with brain complexity (15-45% of body radius)
  //    - Active synapses pulse with flowing particles
  //    - Node activation shown as glow intensity
  renderBrainGanglion(graphics, entity, detail.brainInputs, detail.brainOutputs);

  // 4. Egg organ
  //    - Translucent orb that grows with EggStored progress
  //    - 0% = barely visible, 100% = full glowing orb
  //    - For sexual species: mating-ready indicator when complete
  if (detail.eggStored > 0) {
    renderEggOrgan(graphics, entity, detail.eggStored, detail.isSexual);
  }

  // 5. Fat reserves (if Fat Reserves trait)
  //    - Yellowish layer that grows/shrinks with fat fill level
  if (detail.hasFatReserves) {
    renderFatLayer(graphics, entity, detail.fatFillLevel);
  }

  // 6. Venom glands (if Venom trait)
  //    - Small green-glowing bulges near mouth
  if (detail.hasVenom) {
    renderVenomGlands(graphics, entity, detail.venomReady);
  }
}
```

**Restriction**: X-Ray is only available for the player's own species. When following an enemy organism, the toggle is disabled and internals remain hidden (preserving strategic mystery).

### Unit Tests

- X-Ray renders stomach with correct fill level and plant/meat ratio.
- Brain ganglion size scales with hidden node count.
- Egg organ opacity matches EggStored progress (0 → invisible, 1 → full glow).
- Fat layer only renders when Fat Reserves trait is purchased.
- X-Ray disabled when following enemy species.

### QA Checklist

- [ ] X-Ray toggle appears only at Detail tier when following own species
- [ ] Body becomes semi-transparent, internal organs visible
- [ ] Stomach shows fill level and contents color (green/red)
- [ ] Brain ganglion glows with activity, synapses pulse
- [ ] Egg organ grows visibly as egg accumulates
- [ ] Fat reserves swell/shrink as fat fills/depletes
- [ ] Venom glands glow green when active
- [ ] Performance: X-Ray rendering doesn't drop below 60fps

---

## Step 9.8 — Sound Effects

### What You're Implementing

A lightweight audio system for game sound effects: eating sounds, combat sounds, ambient biome audio, and UI interaction sounds. Uses the Web Audio API for low-latency playback with volume scaling based on camera zoom and distance.

### Design References

- `architecture.md` Section 6 (Deployment) — Sound assets served alongside client.
- `art.md` Section 10 (Audio) — Sound effect list and trigger conditions.

### Implementation Details

```typescript
// client/src/lib/audio.ts

type SoundCategory = 'eating' | 'combat' | 'ambient' | 'ui' | 'reproduction' | 'death';

class AudioManager {
  private ctx: AudioContext;
  private buffers = new Map<string, AudioBuffer>();
  private masterVolume = 0.5;
  private categoryVolumes: Record<SoundCategory, number> = {
    eating: 0.4,
    combat: 0.6,
    ambient: 0.3,
    ui: 0.5,
    reproduction: 0.3,
    death: 0.5,
  };

  async loadSounds(): Promise<void> {
    const sounds = [
      'eat-plant', 'eat-meat', 'chomp',          // eating
      'hit', 'shell-deflect', 'venom-spit',      // combat
      'ambient-grassland', 'ambient-ocean',       // ambient (loopable)
      'egg-laid', 'egg-hatch', 'sparkle',         // reproduction
      'death-pop', 'extinction-chord',            // death
      'click', 'deploy-whoosh', 'notification',   // UI
    ];
    for (const name of sounds) {
      const response = await fetch(`/audio/${name}.webm`);
      const arrayBuffer = await response.arrayBuffer();
      this.buffers.set(name, await this.ctx.decodeAudioData(arrayBuffer));
    }
  }

  play(name: string, options?: { x?: number; y?: number; volume?: number }): void {
    const buffer = this.buffers.get(name);
    if (!buffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const gainNode = this.ctx.createGain();
    let volume = (options?.volume ?? 1) * this.masterVolume;

    // Distance-based attenuation (if world position provided)
    if (options?.x !== undefined && options?.y !== undefined) {
      const camera = worldStore.viewport;
      const dist = Math.hypot(options.x - camera.cx, options.y - camera.cy);
      const maxDist = Math.max(camera.w, camera.h);
      volume *= Math.max(0, 1 - dist / maxDist);
    }

    gainNode.gain.value = volume;
    source.connect(gainNode).connect(this.ctx.destination);
    source.start();
  }

  setMasterVolume(v: number): void { this.masterVolume = v; }
}

export const audio = new AudioManager();
```

#### Sound Triggers

Sounds are triggered from the renderer and game store event handlers:
- **Eating**: when entity state bitfield shows `is_eating` transition, play `eat-plant` or `eat-meat` based on diet
- **Combat**: on hit detection (health decrease between frames), play `hit`; on shell deflect, play `shell-deflect`
- **Reproduction**: on egg-laid event, play `egg-laid`; on hatch, play `egg-hatch`
- **Death**: on entity removal with death flag, play `death-pop`; on extinction event, play `extinction-chord`
- **Ambient**: biome-based loop when camera is over a biome region, crossfade between biomes
- **UI**: button clicks, deploy confirmation, notification toasts

All sounds are optional and respect a global mute toggle and per-category volume sliders in Settings.

### Unit Tests

- AudioManager loads all sound files without error.
- `play()` with world position applies correct distance attenuation.
- Sounds outside viewport are silent (volume = 0).
- Master volume scales all playback.
- Mute toggle prevents all playback.

### QA Checklist

- [ ] Eating sounds play when organisms consume food (plant vs meat sound differs)
- [ ] Combat sounds play on hit and shell deflect
- [ ] Ambient sounds loop for current biome, crossfade on camera movement
- [ ] UI click sounds provide feedback on button presses
- [ ] Distance attenuation: sounds from far-away entities are quieter
- [ ] Mute toggle silences all audio
- [ ] No audio glitches or crackling at high entity counts
- [ ] Sound files are small (.webm format, < 500KB total)
