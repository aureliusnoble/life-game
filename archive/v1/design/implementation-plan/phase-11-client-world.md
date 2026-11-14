# Phase 11 — World View

The world observation screen: live world rendering, camera controls, entity selection, follow mode, overlays, and minimap.

> **Before you start this phase**, read the general guidance in [`README.md`](./README.md).

### Phase 11 Guidance

**Read these design docs first:**
- `components/front-end.md` Section 2 (WorldScreen component tree, HUD layout)
- `art.md` Sections 3 and 7-8 (World visual style, follow mode overlays, overlay layers)
- `core-gameplay-systems.md` Section 7 (Spectating, follow mode, observable data)
- `components/front-end.md` Section 4 (WorldStore — viewport, selectedEntity, followMode)
- `components/game-components.md` Section 11 (EventDetector) — world event types and data format for event toast display
- `components/game-components.md` Section 12 (OrganismRenderer) — LOD tiers, overlay rendering, echolocation/sound visualization interfaces

**Prerequisites:**
- Phase 8 must be complete (React app, stores, WebSocket client).
- Phase 9 must be complete (Pixi.js renderer, organism rendering).
- Phase 6 must be complete (server sends viewport-culled entity data).

**No manager action needed for this phase.** Pure client-side UI and rendering code.

**QA handoff for this phase:**
When done, tell the manager: "Run `pnpm --filter client dev` with the server running, open `/world`. Verify: (1) Drag to pan the camera — it should feel smooth, not laggy, (2) Scroll wheel zooms in/out, (3) WASD keys pan the camera, (4) Click an organism — an inspector panel appears with its stats (energy, health, age, diet), (5) Click 'Follow' — the camera locks onto that organism and tracks it as it moves, (6) Press Escape or click 'Exit Follow' — returns to free camera, (7) Minimap in the corner shows organism dots and a viewport rectangle, (8) Click on the minimap — camera jumps to that location, (9) On mobile: pinch-to-zoom works."

---

## Step 11.1 — World Screen Layout

### What You're Implementing

The main World screen that hosts the Pixi.js canvas with HUD overlays: population counter, time/season display, species list sidebar, and minimap. This is the primary observation interface.

### Design References

- `components/front-end.md` Section 2 — WorldScreen component tree, layout wireframe.
- `art.md` Section 3 — World visual style, biome rendering.
- `components/front-end.md` Section 3 — Responsive breakpoints: phone (full-screen canvas, bottom sheet panels) vs tablet (side panels).

### Implementation Details

```typescript
// client/src/screens/WorldScreen.tsx
function WorldScreen() {
  return (
    <div className="relative w-full h-full">
      {/* Pixi.js canvas (fills entire screen) */}
      <PixiWorldCanvas />

      {/* HUD overlays (fixed position, transparent bg) */}
      <WorldHUD>
        <TopBar>
          <WorldPill />           {/* current world name, tap to switch */}
          <SeasonIndicator />     {/* spring/summer/autumn/winter icon */}
          <PopulationCounter />   {/* total organisms count */}
        </TopBar>

        <Minimap />               {/* bottom-left corner */}

        <SpeciesListPanel />      {/* right side on tablet, bottom sheet on phone */}

        {/* Conditionally shown panels */}
        {selectedEntity && <EntityInspector entityId={selectedEntity} />}
        {followMode && <FollowModeHUD targetId={followTarget} />}
      </WorldHUD>
    </div>
  );
}
```

#### HUD Components

- **Event Warning Banner**: Renders 30-second countdown warnings from `EVENT_WARNING` (0x24) messages (received in Phase 8.6 message handler). Shows a prominent banner at the top of the screen with the warning text and a countdown timer. Auto-dismisses after the event occurs.
- **World Event Toast**: Renders world event notifications from `WORLD_EVENT` (0x40) messages. Uses the uiStore toast system to briefly display extinction, milestone, and season change events.

- **RetireWarningModal**: Shown when player taps a different world in WorldPill/WorldPickerModal while they have an active species. Warns that switching will retire the current species (irreversible). Component structure: `WarningTitle ("Retire Species?")` → `WarningBody (species name, world names, irreversible note)` → `CancelButton` / `RetireAndSwitchButton`. For password-protected worlds, a password sub-modal appears before the retire warning (skipped if player has existing access grant). See `components/front-end.md` Section 8.17 for full wireframe.

- **TopBar**: World name pill, season icon with day count, total organism count, time display.
- **PopulationCounter**: Shows total organisms and breakdown by player species (colored dots).
- **SeasonIndicator**: Animated icon (leaf/sun/falling leaf/snowflake) with day number.
- **SpeciesListPanel**: List of active species with color swatch, name, population count. Tap to filter view.

### Unit Tests

- WorldScreen renders without errors.
- HUD components display correct data from WorldStore.
- Responsive: on narrow viewport, side panel becomes bottom sheet.

### QA Checklist

- [ ] Canvas fills entire viewport behind HUD
- [ ] HUD elements are readable over the world view
- [ ] Season indicator updates with world season
- [ ] Population counter shows accurate total
- [ ] Species list shows all active species
- [ ] RetireWarningModal appears when switching worlds with active species
- [ ] RetireWarningModal Cancel button returns to current world
- [ ] RetireWarningModal Retire & Switch button retires species and joins new world

---

## Step 11.2 — Camera Controls

### What You're Implementing

Full camera control: drag-to-pan, WASD keyboard pan, scroll/pinch-to-zoom, smooth interpolation, and viewport bounds synced to server for entity culling.

### Design References

- `components/front-end.md` Section 1 — `@use-gesture/react` for gestures.
- `architecture.md` Section 4 — Client sends viewport rectangle, server culls entities.
- Phase 9 Step 9.1 — Camera class implementation.

### Implementation Details

```typescript
// Gesture bindings for the world canvas
useGesture({
  onDrag: ({ delta: [dx, dy] }) => {
    camera.pan(-dx, -dy);
    worldStore.setViewport(camera.getViewport());
  },
  onPinch: ({ offset: [scale] }) => {
    camera.zoomTo(scale);
    worldStore.setViewport(camera.getViewport());
  },
  onWheel: ({ delta: [, dy] }) => {
    camera.zoomTo(camera.zoom * (1 - dy * 0.001));
    worldStore.setViewport(camera.getViewport());
  },
});

// Keyboard controls
useEffect(() => {
  const keys = new Set<string>();
  const onKeyDown = (e: KeyboardEvent) => keys.add(e.key);
  const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  const loop = setInterval(() => {
    const speed = 5 / camera.zoom;
    if (keys.has('w') || keys.has('ArrowUp')) camera.pan(0, -speed);
    if (keys.has('s') || keys.has('ArrowDown')) camera.pan(0, speed);
    if (keys.has('a') || keys.has('ArrowLeft')) camera.pan(-speed, 0);
    if (keys.has('d') || keys.has('ArrowRight')) camera.pan(speed, 0);
  }, 16);

  return () => { clearInterval(loop); /* cleanup listeners */ };
}, []);
```

#### Double-Tap to Find Organism

- `components/front-end.md` Section 10 — Key Interaction Patterns: double-tap empty space.

When the user double-taps empty world canvas (no entity under tap), locate and follow the nearest own-species organism, auto-zooming to Sprite tier:

```typescript
function onDoubleTap(worldX: number, worldY: number) {
  // Only trigger if tap didn't hit an entity
  if (worldStore.getEntityAtPosition(worldX, worldY)) return;

  const myOrganisms = worldStore.getMyOrganismIds();
  if (myOrganisms.length === 0) return;

  // Find nearest own organism to tap position
  let nearest = myOrganisms[0];
  let nearestDist = Infinity;
  for (const id of myOrganisms) {
    const entity = worldStore.entities.get(id);
    if (!entity) continue;
    const dist = Math.hypot(entity.x - worldX, entity.y - worldY);
    if (dist < nearestDist) { nearest = id; nearestDist = dist; }
  }

  worldStore.followEntity(nearest);
  camera.zoomTo(SPRITE_TIER_ZOOM); // auto-zoom to Sprite tier
}
```

#### Viewport Sync (debounced)

```typescript
const sendViewport = useDebouncedCallback((viewport: Viewport) => {
  socketStore.sendViewport(viewport);
}, 100);  // max 10 Hz
```

### Unit Tests

- Drag gesture moves camera by correct world-space amount.
- Zoom gesture changes zoom level within bounds [0.1, 10].
- WASD moves camera at speed inversely proportional to zoom.
- Viewport sync fires at most 10 Hz.

### QA Checklist

- [ ] Drag panning feels smooth and responsive
- [ ] Pinch zoom works on mobile
- [ ] Scroll zoom works on desktop
- [ ] WASD + arrow keys work for panning
- [ ] Camera doesn't pan outside world bounds (or wraps for toroidal)
- [ ] Viewport updates reach server (entities appear/disappear at edges)
- [ ] Double-tap empty space follows nearest own organism and zooms to Sprite tier
- [ ] Double-tap on an entity does NOT trigger find-nearest (normal selection takes priority)

---

## Step 11.3 — Entity Selection & Inspector

### What You're Implementing

Click/tap to select an organism. Show an info panel with species name, stats, energy, age, generation. Highlight the selected organism with a colored ring.

### Design References

- `components/front-end.md` Section 2 — Entity Inspector panel.
- `core-gameplay-systems.md` Section 7 (Spectating) — Observable organism data.
- `art.md` Section 7 — Selection highlight ring.

### Implementation Details

```typescript
// Click handler on world canvas
function onEntityClick(entityId: number) {
  worldStore.selectEntity(entityId);
}

// EntityInspector component
function EntityInspector({ entityId }: { entityId: number }) {
  const entity = worldStore.entities.get(entityId);
  if (!entity) return null;

  return (
    <Panel position="right">
      <h3>{entity.speciesName}</h3>
      <StatRow label="Energy" value={entity.energy} max={entity.maxEnergy} />
      <StatRow label="Health" value={entity.health} max={entity.maxHealth} />
      <StatRow label="Age" value={formatAge(entity.age)} />
      <StatRow label="Generation" value={entity.generation} />
      <StatRow label="Size" value={entity.sizeRatio.toFixed(1)} />
      <StatRow label="Speed" value={entity.speedRatio.toFixed(1)} />
      <StatRow label="Diet" value={dietLabel(entity.diet)} />
      <StatRow label="Stomach" value={`${(entity.fullness * 100).toFixed(0)}%`} />
      <Button onClick={() => worldStore.followEntity(entityId)}>Follow</Button>
    </Panel>
  );
}
```

#### Selection Highlight

Draw a pulsing ring around the selected organism (rendered in the world container, moves with entity):
```typescript
function renderSelectionRing(graphics: Graphics, entity: EntityState) {
  const pulse = 0.8 + Math.sin(Date.now() / 200) * 0.2;
  graphics.circle(entity.x, entity.y, entity.radius * 1.5 * pulse);
  graphics.stroke({ color: 0xFFFFFF, width: 2, alpha: 0.8 });
}
```

### Unit Tests

- Clicking entity sets `selectedEntityId` in store.
- EntityInspector renders correct stats for entity.
- Selection ring pulses (radius oscillates).
- Clicking empty space deselects.

### QA Checklist

- [ ] Tapping organism shows inspector panel
- [ ] Inspector shows correct, live-updating stats
- [ ] Selected organism has visible highlight ring
- [ ] "Follow" button enters follow mode
- [ ] Tapping elsewhere deselects

---

## Step 11.4 — Follow Mode

### What You're Implementing

Lock camera to selected organism with smooth tracking. Show follow-mode-specific HUD: brain activity visualization (input/output bars), perception cone overlay, energy bar, and organism detail view.

### Design References

- `core-gameplay-systems.md` Section 7 (Follow Mode) — Follow mode features: camera lock, brain visualization, perception display.
- `art.md` Section 7 (Follow Mode Overlays) — Vision cone, brain activity bars, perception mode.
- `components/front-end.md` Section 4 — WorldStore: `followEntity()`, `detachCamera()`.

### Implementation Details

#### Camera Lock

```typescript
function followModeUpdate() {
  const target = worldStore.entities.get(worldStore.followTargetId);
  if (!target) { worldStore.detachCamera(); return; }

  camera.targetX = target.x;
  camera.targetY = target.y;
  camera.targetZoom = Math.max(2.0, camera.targetZoom); // auto-zoom to detail level
}
```

#### Follow Mode HUD

```typescript
function FollowModeHUD({ targetId }: { targetId: number }) {
  const entity = worldStore.entities.get(targetId);
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4">
      {/* Energy bar */}
      <ProgressBar value={entity.energy} max={entity.maxEnergy} color="yellow" />
      {/* Health bar */}
      <ProgressBar value={entity.health} max={entity.maxHealth} color="red" />

      {/* Brain activity: top 5 active input/output nodes */}
      <BrainActivityDisplay inputs={entity.brainInputs} outputs={entity.brainOutputs} />

      {/* Exit follow button */}
      <Button onClick={() => worldStore.detachCamera()}>Exit Follow</Button>
    </div>
  );
}
```

#### Vision Cone Overlay

Render translucent arc showing the followed organism's view angle and radius:
```typescript
function renderVisionCone(graphics: Graphics, entity: EntityState) {
  const { viewAngle, viewRadius, heading, x, y } = entity;
  graphics.beginFill(0xFFFF00, 0.1);
  graphics.moveTo(x, y);
  graphics.arc(x, y, viewRadius, heading - viewAngle/2, heading + viewAngle/2);
  graphics.lineTo(x, y);
  graphics.endFill();
}
```

#### Perception Mode

Optional toggle: show the world from the organism's perspective. Fog-of-war outside vision cone, entities colored by what the organism "sees" (food=green, threats=red, allies=blue).

- `core-gameplay-systems.md` Section 7.1 (Perception Mode) — Full spec: fog of war outside sensory ranges, vision cone renders full color, echolocation zone renders grey silhouettes, sound as directional arcs from fog, pheromone gradients more prominent, day/night shrinks vision cone, burrowed = near-total fog, camouflaged entities at reduced opacity, forest biome shrinks cone to 0.7×.

#### Echolocation Visualization (Sprite tier+, organisms with Echolocation trait)

Rendered when following an organism that has the Echolocation trait.

- `core-gameplay-systems.md` Section 7.1 (Echolocation Visualization) — Full spec.

```typescript
function renderEcholocationOverlay(graphics: Graphics, entity: EntityState, tick: number) {
  const { echoRadius, echoDutyCycle, x, y } = entity;

  // 1. Ping ring: pulses outward from body to echo radius, fading
  const phase = (tick % echoDutyCycle) / echoDutyCycle; // 0→1
  const ringRadius = entity.radius + phase * (echoRadius - entity.radius);
  const ringAlpha = 0.4 * (1 - phase); // fades as it expands
  graphics.circle(x, y, ringRadius);
  graphics.stroke({ color: 0x88CCFF, width: 2, alpha: ringAlpha });

  // 2. Echo zone boundary: subtle dashed circle at full echo radius
  drawDashedCircle(graphics, x, y, echoRadius, { color: 0x88CCFF, alpha: 0.2, dashLength: 8 });

  // 3. Entities detected by echo but OUTSIDE vision cone → grey silhouettes
  for (const detected of entity.echoDetectedEntities) {
    if (!isInVisionCone(entity, detected)) {
      if (entity.echoPrecision === 'high') {
        // Silhouette matches actual size (no color, no type)
        renderGreySilhouette(graphics, detected.x, detected.y, detected.radius);
      } else {
        // Generic dot/blip (no size info)
        renderEchoBlip(graphics, detected.x, detected.y);
      }
    }
    // Entities in BOTH vision + echo range render normally (vision takes priority)
  }
}
```

#### Sound Visualization (Sprite tier+, when following)

- `core-gameplay-systems.md` Section 7.1 (Sound Visualization) — Full spec.

```typescript
function renderSoundOverlay(graphics: Graphics, entity: EntityState) {
  // 1. Incoming sounds: directional wave arcs at perception edge
  for (const sound of entity.detectedSounds) {
    const arcAngle = Math.atan2(sound.dy, sound.dx);
    const arcSize = sound.intensity * 30; // arc width scales with intensity
    // Color by frequency: low=warm/red, high=cool/blue
    const color = frequencyToColor(sound.frequency); // 0→red, 0.5→white, 1→blue
    const alpha = sound.isLoudest ? 0.6 : 0.15; // loudest is prominent, others faint
    drawDirectionalArc(graphics, entity.x, entity.y, entity.viewRadius * 0.9,
      arcAngle, arcSize, color, alpha);
  }

  // 2. Outgoing sound: if followed organism is emitting (EmitSound > 0.5)
  if (entity.emittingSound && entity.soundIntensity > 0.5) {
    const emitColor = frequencyToColor(entity.soundFrequency);
    renderRadiatingRipples(graphics, entity.x, entity.y,
      entity.soundRange, emitColor, entity.soundIntensity);
  }

  // 3. Other visible emitters: subtle ripple rings
  for (const emitter of entity.visibleSoundEmitters) {
    const emitColor = frequencyToColor(emitter.soundFrequency);
    renderRadiatingRipples(graphics, emitter.x, emitter.y,
      emitter.soundRange * 0.3, emitColor, 0.2); // smaller, less prominent
  }
}
```

#### Pheromone Arrow Overlay (Sprite tier+, when following) — `art.md` §10.4

Gradient arrows pointing in the direction of sensed pheromone gradients. Each of the 3 pheromone channels (red/green/blue) gets its own arrow if the followed organism senses a gradient above threshold.

```typescript
function renderPheromoneArrows(graphics: Graphics, entity: EntityState) {
  for (const channel of ['red', 'green', 'blue'] as const) {
    const gradient = entity.pheromoneGradients?.[channel];
    if (!gradient || gradient.intensity < 0.05) continue;

    const arrowAngle = Math.atan2(gradient.dy, gradient.dx);
    const arrowLength = 20 + gradient.intensity * 40;  // Scale with intensity
    const color = PHEROMONE_COLORS[channel]; // red=0xFF0000, green=0x00FF00, blue=0x0000FF
    const alpha = Math.min(0.8, gradient.intensity);

    // Draw gradient arrow from organism toward source
    const startX = entity.x + Math.cos(arrowAngle) * entity.radius * 1.5;
    const startY = entity.y + Math.sin(arrowAngle) * entity.radius * 1.5;
    drawGradientArrow(graphics, startX, startY, arrowAngle, arrowLength, color, alpha);
  }
}
```

#### Entity Highlight Rings (Sprite tier+, when following) — `art.md` §10.2

Colored outline rings around entities detected by the followed organism's sensors. Color indicates relationship type. Only shown in follow mode.

```typescript
const ENTITY_RING_COLORS: Record<string, number> = {
  food:   0x66BB6A, // Green — plants, edible fungi
  threat: 0xEF5350, // Red — larger organisms, toxic zones
  prey:   0xFFD54F, // Yellow — smaller organisms (for carnivores)
  ally:   0x4FC3F7, // Blue — same species
  mate:   0xBA68C8, // Purple — potential mate (same species, opposite sex)
};

function renderEntityHighlightRings(graphics: Graphics, entity: EntityState) {
  for (const detected of entity.detectedEntities) {
    const color = ENTITY_RING_COLORS[detected.relationship];
    if (!color) continue;
    graphics.circle(detected.x, detected.y, detected.radius + 2);
    graphics.stroke({ color, width: 2, alpha: 0.7 });
  }
}
```

#### Floating Entity Labels (Detail tier, when following) — `art.md` §10.3

Small text labels near detected entities showing the active sensor input name (e.g., "NearestPlant", "Threat"). Only the 3 strongest signals shown to avoid clutter. Labels fade at distance.

```typescript
function renderEntityLabels(labelContainer: Container, entity: EntityState) {
  // Clear previous labels
  labelContainer.removeChildren();

  // Sort by signal strength, take top 3
  const topSignals = entity.detectedEntities
    .sort((a, b) => b.signalStrength - a.signalStrength)
    .slice(0, 3);

  for (const detected of topSignals) {
    const label = new BitmapText({
      text: detected.sensorInputName, // e.g., "NearestPlant", "LargestThreat"
      style: { fontFamily: 'GameFont', fontSize: 10, fill: 0xE0E8F0 },
    });
    label.x = detected.x;
    label.y = detected.y - detected.radius - 12;
    label.anchor.set(0.5, 1);
    // Fade with distance from followed organism
    const dist = Math.hypot(detected.x - entity.x, detected.y - entity.y);
    label.alpha = Math.max(0.2, 1 - dist / entity.viewRadius);
    labelContainer.addChild(label);
  }
}
```

#### Follow Mode Navigation

- `core-gameplay-systems.md` Section 7.1 (Follow Mode Navigation) — Swipe left/right to cycle through your organisms, "Random" button, tap enemy to follow (see stats but not brain). Prev/Next/Random/Detach overlay buttons.

```typescript
function FollowNavigation({ currentId }: { currentId: number }) {
  const myOrganisms = worldStore.getMyOrganismIds();
  const currentIndex = myOrganisms.indexOf(currentId);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 flex gap-2">
      <Button onClick={() => followPrev(myOrganisms, currentIndex)}>Prev</Button>
      <Button onClick={() => followRandom(myOrganisms)}>Random</Button>
      <Button onClick={() => followNext(myOrganisms, currentIndex)}>Next</Button>
      <Button onClick={() => worldStore.detachCamera()}>Detach</Button>
    </div>
  );
}
```

### Unit Tests

- Follow mode: camera tracks entity position each frame.
- Auto-zoom to detail level (zoom >= 2.0).
- Detach: camera stops tracking, returns to free mode.
- Vision cone rendered at correct angle and radius.
- Echolocation ping ring expands from body to echo radius and fades.
- Echo-detected entities outside vision cone render as grey silhouettes (high precision) or blips (low precision).
- Sound wave arcs point toward sound sources with correct frequency-based coloring.
- Outgoing sound ripples render when EmitSound > 0.5.
- Follow navigation: Prev/Next cycle through own organisms in order.
- Pheromone arrows: gradient arrow points toward channel source, opacity scales with intensity.
- Pheromone arrows: channels below threshold (intensity < 0.05) produce no arrow.
- Entity highlight rings: food entities get green ring, threats get red ring, allies get blue.
- Entity highlight rings: ring radius = entity radius + 2px.
- Entity labels: only top 3 strongest signals shown.
- Entity labels: labels fade with distance from followed organism.

### QA Checklist

- [ ] Camera smoothly follows selected organism
- [ ] Auto-zooms to detail level
- [ ] Brain activity bars show live input/output values
- [ ] Vision cone overlay shows view angle/radius
- [ ] "Exit Follow" returns to free camera mode
- [ ] Follow mode persists through organism movement
- [ ] If followed organism dies, follow mode exits gracefully
- [ ] Echolocation ping ring pulses at correct frequency for organisms with the trait
- [ ] Echo-detected entities outside vision cone appear as grey silhouettes
- [ ] Incoming sound arcs point toward sources with frequency-based color
- [ ] Outgoing sound ripples emanate when organism emits sound
- [ ] Pheromone gradient arrows point toward sources with correct channel color (`art.md` §10.4)
- [ ] Entity highlight rings: food=green, threat=red, prey=yellow, ally=blue, mate=purple (`art.md` §10.2)
- [ ] Floating labels show top 3 sensor input names near detected entities (`art.md` §10.3)
- [ ] Labels fade at distance, not visible beyond view radius
- [ ] Prev/Next/Random buttons cycle through own organisms correctly
- [ ] Perception mode fog-of-war hides areas outside all sensory ranges

---

## Step 11.5 — World Overlays

### What You're Implementing

Toggleable overlay layers rendered on top of the world: energy heatmap, population density, species territories, pheromone visualization, food distribution, and spatial hash grid (debug).

### Design References

- `art.md` Section 8 (Overlays) — Overlay types and visual descriptions.
- `debug.md` Section B — Debug overlays: spatial grid, vision cones, velocity vectors, collision boxes, pheromone overlay, energy heatmap, force vectors.
- `components/front-end.md` Section 4 — WorldStore: `overlayMode`.

### Implementation Details

```typescript
enum OverlayMode {
  None,
  EnergyHeatmap,
  PopulationDensity,
  SpeciesTerritories,
  PheromoneTrails,
  FoodDistribution,
}

function renderOverlay(graphics: Graphics, mode: OverlayMode, world: WorldState) {
  switch (mode) {
    case OverlayMode.EnergyHeatmap:
      renderEnergyHeatmap(graphics, world);
      break;
    case OverlayMode.PopulationDensity:
      renderDensityOverlay(graphics, world);
      break;
    // ... etc
  }
}
```

#### Energy Heatmap

Color each grid cell by total organism energy in that cell. Blue (low) → Red (high).

#### Population Density

Color each grid cell by organism count. Transparent (empty) → Bright (crowded).

#### Species Territories

Color regions by the dominant species in each cell. Use species primary color with low alpha.

#### Pheromone Visualization

Show pheromone grid channels as colored overlays: Red/Green/Blue channels with intensity mapped to alpha.

### Unit Tests

- Each overlay mode renders without errors.
- Energy heatmap: high-energy cells are red, low are blue.
- Population density: empty cells are transparent.
- Pheromone: intensity maps to alpha correctly.

### QA Checklist

- [ ] Overlay toggle buttons work (one active at a time)
- [ ] Energy heatmap accurately reflects entity distribution
- [ ] Population density helps identify crowded areas
- [ ] Pheromone visualization shows emission and diffusion
- [ ] Overlays don't obscure entities at normal alpha
- [ ] Performance: overlays don't drop below 60fps

---

## Step 11.6 — Minimap

### What You're Implementing

A minimap in the corner showing the entire 500x500 world: organisms as colored dots (by species), viewport indicator rectangle, and click-to-navigate functionality.

### Design References

- `components/front-end.md` Section 2 — Minimap component.
- `art.md` Section 3 — Minimap visual style.

### Implementation Details

```typescript
function Minimap({ size = 150 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const entities = worldStore.entities;
  const viewport = worldStore.viewport;

  useEffect(() => {
    const ctx = canvasRef.current!.getContext('2d')!;
    const scale = size / 500;

    // Clear
    ctx.fillStyle = '#0a1628';
    ctx.fillRect(0, 0, size, size);

    // Draw biome background (pre-rendered, scaled down)
    ctx.drawImage(biomeTexture, 0, 0, size, size);

    // Draw organism dots
    for (const [id, entity] of entities) {
      ctx.fillStyle = getSpeciesColor(entity.speciesId);
      ctx.fillRect(entity.x * scale, entity.y * scale, 2, 2);
    }

    // Draw viewport rectangle
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      viewport.x * scale, viewport.y * scale,
      viewport.w * scale, viewport.h * scale,
    );
  }, [entities, viewport]);

  // Click to navigate
  function onClick(e: React.MouseEvent) {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / size) * 500;
    const y = ((e.clientY - rect.top) / size) * 500;
    camera.targetX = x;
    camera.targetY = y;
  }

  return <canvas ref={canvasRef} width={size} height={size} onClick={onClick} />;
}
```

### Unit Tests

- Minimap renders organism dots at correct scaled positions.
- Viewport rectangle size matches camera viewport.
- Click at (75, 75) on 150px minimap → camera targets (250, 250) in world.

### QA Checklist

- [ ] Minimap shows all organisms as colored dots
- [ ] Viewport rectangle matches actual camera view
- [ ] Click on minimap navigates camera to that position
- [ ] Minimap updates in real-time as entities move
- [ ] Biome regions are visible on minimap
- [ ] Performance: minimap rendering doesn't impact main canvas fps

---

## Step 11.7 — Detail Bottom Sheet

### What You're Implementing

A swipe-up panel available at Sprite tier or closer when following an organism. Four tabs provide detailed numerical data about the followed organism: Brain, Body, Stomach, and Eggs.

### Design References

- `core-gameplay-systems.md` Section 7.1 (Detail Bottom Sheet) — Full spec for all four tabs and their contents.
- `components/front-end.md` Section 3 — Mobile: bottom sheet; tablet: side panel.
- `core-gameplay-systems.md` Section 9 (Digestion System) — Stomach tab data model.

### Implementation Details

```typescript
function DetailBottomSheet({ entityId }: { entityId: number }) {
  const [activeTab, setActiveTab] = useState<'brain' | 'body' | 'stomach' | 'eggs'>('brain');
  const entity = worldStore.entities.get(entityId);
  const detail = worldStore.entityDetails.get(entityId);
  if (!entity || !detail) return null;

  return (
    <SwipeUpPanel>
      <TabBar
        tabs={['Brain', 'Body', 'Stomach', 'Eggs']}
        active={activeTab}
        onChange={setActiveTab}
      />
      {activeTab === 'brain' && <BrainTab entity={entity} detail={detail} />}
      {activeTab === 'body' && <BodyTab entity={entity} detail={detail} />}
      {activeTab === 'stomach' && <StomachTab entity={entity} detail={detail} />}
      {activeTab === 'eggs' && <EggsTab entity={entity} detail={detail} />}
    </SwipeUpPanel>
  );
}
```

#### Brain Tab

Live read-only brain node graph. Input values as color-intensity bars on the left, hidden nodes show activation values, output values on the right with threshold indicators (green glow when > 0.5). Synapses animate with pulse particles proportional to signal magnitude. Green = positive signal, red = negative signal.

```typescript
function BrainTab({ entity, detail }: DetailTabProps) {
  return (
    <div>
      <BrainNodeGraph
        inputs={detail.brainInputs}       // { name, value }[]
        hiddenNodes={detail.hiddenNodes}   // { type, activation }[]
        outputs={detail.brainOutputs}      // { name, value, threshold: 0.5 }[]
        synapses={detail.synapses}         // { from, to, weight, signal }[]
      />
    </div>
  );
}
```

#### Body Tab

Real-time vital statistics:

```typescript
function BodyTab({ entity, detail }: DetailTabProps) {
  return (
    <div className="space-y-2">
      <StatBar label="HP" value={entity.health} max={entity.maxHealth} color="red" />
      <StatBar label="Energy" value={entity.energy} max={entity.maxEnergy} color="yellow" />
      <StatBar label="Speed" value={entity.currentSpeed} max={entity.maxSpeed} color="blue" />
      <StatRow label="Metabolism" value={`${detail.effectiveMetabolism.toFixed(2)} (base × entropy × ageing)`} />
      <StatRow label="Age" value={formatAge(entity.age)} />
      <StatRow label="Ageing Factor" value={detail.ageingFactor.toFixed(2)} />
      <StatRow label="Entropy Multiplier" value={detail.entropyMultiplier.toFixed(2)} />
      <StatRow label="Biome" value={detail.currentBiome} />
      <StatRow label="Active Traits" value={detail.activeTraits.join(', ')} />
      <StatRow label="Size / STR / DEF" value={`${entity.sizeRatio.toFixed(1)} / ${entity.strength.toFixed(1)} / ${entity.defense.toFixed(1)}`} />

      <Section title="Detected Entities">
        {detail.nearestDetections.map(d => (
          <StatRow key={d.type} label={`Nearest ${d.type}`} value={`${d.distance.toFixed(1)} units`} />
        ))}
      </Section>
    </div>
  );
}
```

#### Stomach Tab

Animated stomach visualization with digestion metrics:

```typescript
function StomachTab({ entity, detail }: DetailTabProps) {
  return (
    <div>
      <StatBar label="Stomach" value={detail.stomachFill} max={detail.stomachCapacity} color="amber" />
      <StackedBar
        label="Contents"
        segments={[
          { value: detail.plantContents, color: 'green', label: `Plant: ${detail.plantContents.toFixed(1)} u²` },
          { value: detail.meatContents, color: 'red', label: `Meat: ${detail.meatContents.toFixed(1)} u²` },
        ]}
        max={detail.stomachCapacity}
      />
      <Gauge label="Acid Level" value={detail.acidLevel} max={1.0} color="yellow" />
      <StatRow label="Digestion Rate" value={`${detail.digestionRate.toFixed(2)} u²/s`} />
      <StatRow label="Energy Extraction" value={`${detail.energyExtractionRate.toFixed(2)} E/s`} />
      <StatRow label="Plant Efficiency" value={`${(detail.plantEfficiency * 100).toFixed(0)}%`} />
      <StatRow label="Meat Efficiency" value={`${(detail.meatEfficiency * 100).toFixed(0)}%`} />
      <StatRow label="StomachPlantRatio" value={detail.stomachPlantRatio.toFixed(2)} />
    </div>
  );
}
```

#### Eggs Tab

Reproduction status and history:

```typescript
function EggsTab({ entity, detail }: DetailTabProps) {
  return (
    <div>
      <StatBar label="Egg Progress" value={detail.eggStored} max={detail.eggCost} color="pink" />
      <Section title="Egg Cost Breakdown">
        <StatRow label="Growth" value={detail.eggCostGrowth.toFixed(1)} />
        <StatRow label="Traits" value={detail.eggCostTraits.toFixed(1)} />
        <StatRow label="Brain" value={detail.eggCostBrain.toFixed(1)} />
        <StatRow label="Base" value={detail.eggCostBase.toFixed(1)} />
      </Section>
      <StatRow label="Time to Completion" value={detail.eggTimeEstimate || 'N/A'} />

      {detail.isSexual && (
        <Section title="Sexual Reproduction">
          <StatRow label="Sex" value={detail.sex} />
          <StatRow label="Mating Cooldown" value={detail.matingCooldown > 0 ? `${detail.matingCooldown.toFixed(0)}s` : 'Ready'} />
          <StatRow label="Nearest Mate" value={detail.nearestMateDistance ? `${detail.nearestMateDistance.toFixed(1)} units` : 'None'} />
        </Section>
      )}

      <Section title="Nearby Eggs">
        <StatRow label="Count" value={detail.nearbyEggCount} />
        <StatRow label="Nest Bonus" value={`${(detail.nestBonus * 100).toFixed(0)}% (${detail.tendingOrganisms} tending)`} />
      </Section>

      <Section title="Recent Reproductions">
        {detail.recentEggs.map((egg, i) => (
          <StatRow key={i} label={`Egg #${i + 1}`} value={egg.hatched ? 'Hatched' : 'Incubating'} />
        ))}
      </Section>
    </div>
  );
}
```

### Unit Tests

- Brain tab renders input/output bars with correct values and threshold indicators.
- Body tab displays all vital stats matching entity state.
- Stomach tab shows correct fill levels, acid gauge, and efficiency percentages.
- Eggs tab shows progress bar, cost breakdown, and sexual reproduction fields when applicable.
- Tab switching works correctly.
- Bottom sheet swipe-up gesture opens panel.

### QA Checklist

- [ ] Bottom sheet opens on swipe-up when following an organism
- [ ] Brain tab shows live node graph with animated synapses
- [ ] Body tab shows all vital statistics updating in real-time
- [ ] Stomach tab shows contents, acid level, and digestion rates
- [ ] Eggs tab shows reproduction progress and cost breakdown
- [ ] Sexual reproduction fields only appear for sexual species
- [ ] Nest bonus and nearby eggs display correct counts
- [ ] Panel is scrollable for long content
- [ ] Mobile: bottom sheet; tablet: side panel
