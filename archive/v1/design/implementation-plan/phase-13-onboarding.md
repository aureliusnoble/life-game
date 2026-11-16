# Phase 13: Onboarding & Player Education System

**Goal**: Implement the complete 4-layer player education framework -- Quick Start wizard, 17 system introductions, 40-page reference guide, and unlock-triggered education modals -- woven contextually into the game rather than as a separate tutorial mode. After this phase, new players go from first login to deployed organism in under 5 minutes, and every game system has associated teaching content.

**Estimated Steps**: 11

> **Before you start this phase**, read the general guidance in [`README.md`](./README.md).

### Phase 13 Guidance

**Read these design docs first:**
- `onboarding.md` — **Read the entire document.** This defines all 4 layers of the education system: Quick Start wizard, 17 system introductions, 40-page reference guide, and unlock-triggered education.
- `core-gameplay-systems.md` Section 8 (Progression) — EP system and tier unlock thresholds that trigger education content
- `components/front-end.md` Section 2 (Onboarding components, modal system)

**Prerequisites:**
- Phases 8-12 should be substantially complete. The onboarding system wraps around existing screens (designer, world view, dashboard) and triggers contextually. You need those screens to exist before you can hook education content into them.

**No manager action needed for this phase.** Pure client-side content and UI code.

**Important implementation note:**
This phase is content-heavy. The 40-page reference guide and 17 system introductions are primarily text and illustrations. Focus on the framework/infrastructure first (modal system, trigger conditions, content rendering) and then fill in the content. If writing all 40 reference pages feels too large for one pass, implement the framework with 5-10 representative pages first, then fill the rest.

**QA handoff for this phase:**
When done, tell the manager: "Run `pnpm --filter client dev`. Verify: (1) First-time login triggers the Quick Start wizard — it should guide you through designing and deploying your first species in under 5 minutes, (2) Open the reference guide from the help menu — verify at least the first 10 pages render with correct content and images, (3) Navigate to the designer for the first time — a system introduction tooltip/modal should appear explaining the body tab, (4) If you have a fresh account, go through the first-time flow end to end: signup → Quick Start → design → deploy → watch. Time it — target is under 5 minutes to deployed organism."

---

## Step 13.1: Onboarding Store (Zustand + localStorage + Supabase Sync)

### What You're Implementing
The `onboardingStore` Zustand store that tracks all onboarding progress: Quick Start wizard state, 17 introduction card seen/completed flags, tier unlock modal history, and visit counters. Persistence uses localStorage as the fast path with debounced Supabase sync via a new `onboarding_state` JSONB column on the `players` table.

### Design References
- `onboarding.md` SS7.1 (OnboardingStore interface -- all fields, actions, queries)
- `onboarding.md` SS7.2 (Persistence -- `onboarding_state` JSONB column, localStorage fallback, sync strategy)
- `onboarding.md` SS7.3 (Trigger evaluation -- `shouldShowIntro()` usage pattern)
- `architecture.md` SS9 (players table schema -- adding JSONB column)
- `architecture.md` SS5 (State management -- Zustand stores, Supabase SDK)

### Implementation Details

**Database migration** -- add column to `players` table:

```sql
ALTER TABLE players
ADD COLUMN onboarding_state JSONB NOT NULL DEFAULT '{
  "quickStartCompleted": false,
  "quickStartStep": 0,
  "introductions": {},
  "tierUnlocksSeen": []
}'::jsonb;
```

**Zustand store** at `client/src/stores/onboardingStore.ts`:

```typescript
interface OnboardingStore {
  // Quick Start wizard
  quickStartCompleted: boolean;
  quickStartStep: 0 | 1 | 2 | 3 | 4;

  // Layer 2: System introductions (17 cards)
  introductions: Record<string, {
    seen: boolean;
    completed: boolean;
    seenAt: string;       // ISO timestamp
  }>;

  // Layer 4: Tier unlock education modals
  tierUnlocksSeen: Set<number>;  // 2, 3, 4

  // Visit counters (local only, not synced)
  visitCounts: Record<string, number>;  // 'bodyTab', 'brainTab', etc.

  // Actions
  advanceQuickStart: () => void;
  completeQuickStart: () => void;
  markIntroSeen: (id: string) => void;
  markIntroCompleted: (id: string) => void;
  markTierUnlockSeen: (tier: number) => void;
  incrementVisit: (screen: string) => void;
  resetOnboarding: () => void;

  // Queries
  shouldShowIntro: (id: string) => boolean;
  shouldShowTierUnlock: (tier: number) => boolean;
  getVisitCount: (screen: string) => number;
}
```

**Persistence layer** -- dual-write with merge-on-login:

1. Every state change writes immediately to `localStorage` key `life_game_onboarding`.
2. A debounced function (500ms) calls `supabase.from('players').update({ onboarding_state: serialized })`.
3. On login, fetch Supabase state, merge with localStorage (keep whichever has more progress per field -- e.g., if `quickStartCompleted` is true in either source, keep true).
4. On logout, clear localStorage.

**Merge logic**: For introductions, union the two maps and for each introduction keep the entry where `completed === true` over `seen === true` over absent. For `tierUnlocksSeen`, union the two sets.

**Visit counters**: Stored in `localStorage` only (not synced to Supabase). Incremented by `useEffect` in screen components (BodyTab, BrainTab, etc.). These drive trigger conditions like "2nd visit to BodyTab."

### Test Cases
- Store initializes with default state (quickStartStep 0, empty introductions, empty tier unlocks)
- `advanceQuickStart` increments step from 0 to 1, 1 to 2, etc.
- `completeQuickStart` sets `quickStartCompleted = true` and step to 4
- `markIntroSeen('follow_mode')` creates entry with `seen: true, completed: false, seenAt: <now>`
- `markIntroCompleted('follow_mode')` sets `completed: true` on existing entry
- `shouldShowIntro('follow_mode')` returns true only when entry is absent or `seen === false`
- `shouldShowTierUnlock(2)` returns true when 2 is not in `tierUnlocksSeen`
- `resetOnboarding` clears all state back to defaults
- Merge logic: localStorage has `follow_mode: seen`, Supabase has `follow_mode: completed` -- merged result is `completed`
- Merge logic: localStorage has `quickStartCompleted: true`, Supabase has `false` -- merged result is `true`
- Debounced Supabase write fires 500ms after last state change, not on every change

### QA Checklist
- [ ] Supabase migration applies cleanly to existing players table
- [ ] Store loads from localStorage on app init before auth completes (offline-first)
- [ ] Merge-on-login handles all combinations: both empty, one empty, both populated, conflicting values
- [ ] Debounced write coalesces rapid state changes into a single Supabase call
- [ ] `resetOnboarding` clears both localStorage and Supabase
- [ ] Visit counters survive page refresh (stored in localStorage)
- [ ] Store serialization handles `Set<number>` for `tierUnlocksSeen` (JSON uses array form)

---

## Step 13.2: Quick Start Wizard -- Steps 1-2

### What You're Implementing
The first two steps of the Quick Start wizard at `/onboarding`: the Welcome Splash (Step 1) with live organism renderer animation, and the Simplified Body Designer (Step 2) with archetype cards and 3 visible sliders. The wizard is a 4-step flow that runs once on first login.

### Design References
- `onboarding.md` SS2.1 (Step 1 -- Welcome Splash: live canvas rendering, copy text, controls)
- `onboarding.md` SS2.2 (Step 2 -- Simplified Body Designer: layout, archetype cards, 3 sliders, collapsed accordion, BP bar, behavior, controls)
- `onboarding.md` SS8.4 (QuickStartOverlay -- spotlight cutouts, instruction text, skip escape)
- `components/front-end.md` SS6 (Designer screen components -- BodyTab, organism preview)
- `architecture.md` SS2 (Data Flow A -- organism design structure)

### Implementation Details

**Route**: `/onboarding` -- guarded by `onboardingStore.quickStartCompleted === false`. If true, redirect to `/home`. On first login (no `onboarding_state` in Supabase), redirect from `/home` to `/onboarding`.

**Step 1 -- Welcome Splash**:
- Full-bleed canvas using the real organism renderer (same Pixi.js-based renderer as the designer preview).
- Render 3-4 animated organisms: a green herbivore grazing (diet=0, idle animation), a red carnivore chasing (diet=1, moving), a small organism hatching from an egg (scale-up animation). Add particle trails behind moving organisms, subtle glow around the egg.
- Copy text: "Design an organism. Give it a brain. Watch it live." with subtext.
- Step indicators: 4 dots, first filled.
- Single button: "Let's Build" -- calls `advanceQuickStart()`, navigates to Step 2.
- No back button or escape needed.

**Step 2 -- Simplified Body Designer**:
- **Top 40%**: Live organism preview (same renderer, animating idle), updating as sliders change.
- **Middle**: 4 archetype cards in horizontal scroll -- Herbivore (pre-selected, green border glow), Carnivore (red), Omnivore (yellow), Scavenger (grey). Each card: icon (rendered organism thumbnail), name, 1-line description.
- **Below archetypes**: 3 sliders only: Size (0.3-3.0), Speed (0.2-2.5), Diet (0.0-1.0). Each with a short label line.
- **Collapsed accordion**: "Fine-Tune (6 more stats)" -- expands to show STR, DEF, View Angle, View Radius, Metabolism, Stomach, Growth Speed. Collapsed by default.
- **BP bar at bottom**: Simplified display `[bar] 76/100 BP` with no breakdown.
- **Instruction copy**: "Choose a body type, then tweak it. The Herbivore is a great first pick."
- Selecting an archetype pre-fills all 9 sliders + brain BP allocation.
- Adjusting any slider updates the preview in real-time.
- Primary button: "Next: Wire Brain" -- advances to Step 3.
- Escape: "Skip to Deploy" small text link -- uses archetype defaults for everything, jumps to Step 4.

**Archetype defaults** (from design docs):
- Herbivore: size=1.0, speed=1.0, diet=0.0, STR=0.5, DEF=0.5, viewAngle=120, viewRadius=5.0, metabolism=1.0, stomach=1.0, brain=Simple Grazer (7 synapses, 3.5 BP)
- Carnivore: size=1.2, speed=1.3, diet=1.0, STR=2.0, DEF=0.5, viewAngle=90, viewRadius=6.0, metabolism=1.2, stomach=0.8, brain=Hunter (9 synapses + 1 ReLU, 6.5 BP)
- Omnivore: size=1.0, speed=1.0, diet=0.5, STR=1.0, DEF=0.5, viewAngle=120, viewRadius=5.0, metabolism=1.0, stomach=1.2, brain=Balanced (10 synapses, 5 BP)
- Scavenger: size=0.8, speed=1.2, diet=0.7, STR=0.3, DEF=0.3, viewAngle=150, viewRadius=5.0, metabolism=0.9, stomach=1.0, brain=Scavenger (7 synapses, 3.5 BP)

**State management**: Store the in-progress design in local component state (not persisted). The archetype selection populates all fields. Slider changes modify only the changed field. The design is passed forward through wizard steps via React context or URL state.

#### QuickStartOverlay Component (`onboarding.md` §8.4)

Reusable semi-transparent overlay used across Steps 2-4 to spotlight key UI elements and provide contextual instruction:

```typescript
// client/src/components/onboarding/QuickStartOverlay.tsx

interface QuickStartOverlayProps {
  step: 1 | 2 | 3 | 4;
  highlightElements: string[];    // CSS selectors for spotlight cutouts
  instructionText: string;        // Floating instruction card content
  onSkip: () => void;             // "Skip to Deploy →" handler
}

function QuickStartOverlay({ step, highlightElements, instructionText, onSkip }: QuickStartOverlayProps) {
  // 1. Full-viewport dark overlay (rgba(0,0,0,0.6))
  // 2. Spotlight cutouts: for each CSS selector, compute bounding rect,
  //    punch a rounded-rect hole in the overlay with 8px padding
  // 3. Instruction card: floating white card positioned near the primary
  //    spotlight element (auto-positioned above/below to avoid clipping)
  // 4. "Skip to Deploy →" small text link at bottom-right
  // 5. Step indicators (● ○ ○ ○) at top
}
```

**Spotlight cutout rendering**: Use CSS `clip-path` with `polygon()` or a `<canvas>` overlay with `globalCompositeOperation: 'destination-out'` to punch holes. Cutouts have 2px bright border (accent cyan) to draw attention.

**Instruction card**: White background, 12px rounded corners, max-width 280px, 14px text, arrow pointing toward primary highlight. Auto-dismiss not needed — user advances via the wizard's primary action buttons.

The overlay is used by Steps 2, 3, and 4 of the Quick Start wizard. Step 1 (Welcome Splash) does not use it since there's no existing UI to spotlight.

### Test Cases
- Welcome splash renders 3+ animated organisms without errors
- "Let's Build" advances to Step 2 and updates step indicators
- All 4 archetype cards render with correct colors and descriptions
- Selecting Carnivore changes preview to red-tinted, larger organism with higher speed
- Size slider updates organism preview size in real-time
- Diet slider shifts organism color from green through yellow to red
- BP bar updates as sliders change
- "Fine-Tune" accordion expands/collapses
- "Skip to Deploy" jumps to Step 4 with Herbivore defaults applied
- Step indicators show checkmark for completed step 1

### QA Checklist
- [ ] Welcome splash canvas performs at 60fps on mid-range mobile device
- [ ] Organism animations in splash use the same renderer as the designer (visual consistency)
- [ ] Archetype card selection visually highlights the selected card and deselects others
- [ ] Slider changes immediately reflected in preview (no perceptible delay)
- [ ] BP budget correctly computed for all archetype defaults (none exceed 100)
- [ ] "Skip to Deploy" preserves the currently selected archetype, not always Herbivore
- [ ] Step 2 layout is responsive: stacks vertically on phone, side-by-side on tablet
- [ ] Horizontal scroll on archetype cards works with touch and mouse
- [ ] QuickStartOverlay spotlight cutouts correctly highlight target elements (`onboarding.md` §8.4)
- [ ] QuickStartOverlay instruction card positions near spotlight without clipping viewport

---

## Step 13.3: Quick Start Wizard -- Steps 3-4

### What You're Implementing
Steps 3 (Simplified Brain Editor) and 4 (Simplified Deploy) of the Quick Start wizard. Step 3 shows the archetype's pre-wired brain template with a guided drag exercise. Step 4 presents a streamlined biome selector and deploy button.

### Design References
- `onboarding.md` SS2.3 (Step 3 -- Simplified Brain Editor: layout, guided drag highlight, copy text, "Use Template" button, controls)
- `onboarding.md` SS2.4 (Step 4 -- Simplified Deploy: auto-generated name, 5 biome buttons, hidden founder count, deploy button)
- `components/front-end.md` SS6 (Brain Editor components -- BrainTab, node graph, synapse rendering)
- `architecture.md` SS2 (Data Flow A -- deploy sequence, design validation)

### Implementation Details

**Step 3 -- Simplified Brain Editor**:
- Brain canvas showing the archetype's pre-applied template. For Herbivore: Simple Grazer with 7 synapses visible (PlantAngle->Rotate, PlantDist->Accelerate, etc.).
- Input nodes on left edge, output nodes on right edge, existing synapses drawn as colored lines with thickness proportional to weight.
- **Guided drag highlight**: One connection is NOT pre-wired. For Herbivore: `PlantAngle -> Rotate` is highlighted with a pulsing glow outline on both nodes and a dotted arrow showing the drag path. For Carnivore: `NearestOrganismAngle -> Rotate`.
- Hidden node palette is NOT shown during onboarding.
- Floating instruction card: "Drag from an input to an output to create a connection. Try it! Connect PlantAngle to Rotate so your organism steers toward food."
- After successful connection, show success card: "Nice! That connection means: turn toward the nearest plant."
- "Use Template" button: always visible, keeps archetype brain as-is. This is a first-class option, not an escape hatch.
- Primary: "Next: Deploy" -- advances to Step 4.
- Step indicators: checkmarks on steps 1-2, filled dot on step 3.

**Guided drag implementation**:
1. Detect that the specific synapse is missing from the pre-wired template.
2. Render pulsing glow (CSS animation, 1.5s cycle) on the source and target nodes.
3. Render a dotted curved arrow between the two nodes as a visual hint.
4. On successful drag-and-drop creating any synapse to the correct target, show the success card.
5. If the player creates a different synapse, still accept it (no wrong answers), but don't show the specific success message.

**Step 4 -- Simplified Deploy**:
- Auto-generated species name (e.g., "Green Drifters", "Swift Grazers") with edit icon. Name generator uses diet color + random movement adjective + random collective noun.
- 5 biome buttons in a row: Grassland (pre-selected, highlighted border), Forest, Desert, Wetland, Rocky. Each shows name only -- no crowding cost during onboarding.
- Founder count hidden (defaults to 3).
- Copy: "Choose where to release your organisms. Grassland has plenty of food -- perfect for your first species."
- Primary: "Release Into The World" (large, green, prominent). On tap:
  1. Validate BP budget client-side.
  2. Save design to Supabase (`species_designs` table).
  3. Send DEPLOY command via WebSocket with design ID.
  4. On DEPLOY_ACK success, call `completeQuickStart()` on onboardingStore.
  5. Navigate to `/world`.
- No "Back" button. Only the deploy button and biome selector.

**Name generation** -- combinatorial:
```typescript
const prefixes = ['Green', 'Swift', 'Tiny', 'Bold', 'Quiet', 'Bright', 'Shadow', 'Dawn'];
const suffixes = ['Drifters', 'Grazers', 'Wanderers', 'Runners', 'Seekers', 'Crawlers'];
// Select based on archetype + random
```

### Test Cases
- Brain canvas renders the archetype's template with correct nodes and synapses
- Guided drag highlight pulses on the correct two nodes for each archetype
- Dragging from PlantAngle to Rotate creates a synapse and triggers success card
- "Use Template" button proceeds with the full template brain (including the guided connection)
- Deploy screen generates a valid species name
- Species name is editable (tap edit icon, type, confirm)
- Selecting a non-Grassland biome updates the highlight
- "Release Into The World" triggers the full deploy flow
- Deploy success navigates to `/world` and marks quickStartCompleted
- Deploy failure (e.g., WebSocket not connected) shows an error toast with retry option

### QA Checklist
- [ ] Brain canvas touch interactions work on mobile (drag gesture, not just click)
- [ ] Guided drag hint is visually obvious but not blocking (player can still interact with other nodes)
- [ ] Success card appears immediately after valid connection (no perceptible delay)
- [ ] "Use Template" creates the synapse that was left out (so the template is complete)
- [ ] Deploy validates BP budget and rejects designs over 100 BP with a clear error
- [ ] Species name generation avoids offensive combinations (curated word lists)
- [ ] Biome buttons are large enough for touch targets (min 44x44px)
- [ ] Full deploy flow handles WebSocket disconnection gracefully (retry or fallback)
- [ ] `quickStartCompleted` is set AFTER successful deploy, not before

---

## Step 13.4: Post-Deploy "Aha Moment" Sequence

### What You're Implementing
The scripted camera and floating card sequence that plays immediately after the player deploys their first species. Camera auto-follows one organism, vision cone overlay activates, and timed floating cards explain what the player is seeing. This is the critical "aha moment" where the player sees their organism act autonomously.

### Design References
- `onboarding.md` SS2.5 (Post-Deploy sequence -- camera behavior, floating card sequence with timing, edge cases)
- `components/front-end.md` SS7 (WorldScreen -- camera system, follow mode, vision cone overlay)
- `architecture.md` SS2 (Data Flow B -- WebSocket streaming, entity updates)

### Implementation Details

**Camera auto-follow**:
- On navigation to `/world` after first deploy, automatically enter follow mode on one of the 3 deployed founder organisms. Select the organism closest to a plant cluster for best "aha moment" potential.
- Zoom level: Sprite tier (close enough to see organism details and behavior).
- Vision cone overlay ON for first 30 seconds.
- Camera smoothly tracks as organism moves (same follow-mode camera logic used in normal play).

**Floating card sequence** -- implemented as a state machine:

```typescript
interface AhaMomentState {
  stage: 'alive' | 'vision' | 'eating' | 'persistence' | 'controls' | 'done';
  startTime: number;
  hasEaten: boolean;
  followedEntity: number;    // entity ID being followed
  organismDied: boolean;
}
```

Timed card sequence:
1. **T+0s** (stage: 'alive'): "Your [species name] is alive! Watch it explore." -- anchored bottom-center, auto-advance after 5s.
2. **T+5s** (stage: 'vision'): "See the cone? That's what it can see. It uses vision to find food and avoid threats." -- anchored near vision cone, auto-advance after 5s.
3. **T+10s or on eat event** (stage: 'eating'): "It found food! Your brain wiring told it to steer toward plants and eat." -- near organism, auto-advance after 4s. If no eat event by T+20s, skip this card entirely.
4. **T+30s** (stage: 'persistence'): Vision cone fades off. "Your organisms will live, eat, and reproduce on their own. Come back anytime." -- 5s.
5. **T+40s** (stage: 'controls'): "Tap any organism to follow it. Tap the background to explore freely." -- 5s, then fades. Transition to 'done'.

**Edge cases**:
- **Organism dies before sequence completes**: Show "Your organism died -- that happens! The others are still out there." Switch follow target to another living founder. Skip to stage 'persistence'.
- **All founders die**: Show death card, skip to 'controls' stage immediately.
- **Player taps background during sequence**: Pause sequence, show remaining cards when they re-follow.
- **Player taps different organism**: Update followedEntity, continue sequence.

**Floating card component** (`AhaMomentCard`):
- Semi-transparent background, rounded corners, max 2 lines of text.
- Slide-up animation on appear, fade-out on dismiss.
- Each card is dismissable by tap (skips to next card).
- Cards do NOT block world interaction (no overlay backdrop).

**WebSocket event listener**: Listen for `egg_laid` and `organism_died` events during the sequence to trigger eating detection and death handling.

### Test Cases
- Camera auto-follows a founder organism after first deploy
- Vision cone overlay is visible for the first 30 seconds
- Card 1 appears immediately with correct species name
- Card 2 appears at ~T+5s near the vision cone
- Card 3 appears when organism eats (eat event detected)
- If no eat event by T+20s, card 3 is skipped
- Card 4 appears at T+30s and vision cone fades
- Card 5 appears at T+40s and the sequence completes
- Tapping a card dismisses it and advances to the next card
- If followed organism dies, death card appears and follow switches to another founder
- After sequence completes, player is in normal world mode with no further interruptions
- Sequence does not replay on subsequent visits to `/world`

### QA Checklist
- [ ] Camera follow is smooth (no jitter or snapping)
- [ ] Vision cone overlay renders correctly at Sprite tier zoom
- [ ] Cards do not cover the followed organism (positioned to the side or below)
- [ ] Card timing is approximate, not frame-exact (tolerance of +/-0.5s is fine)
- [ ] Eating detection works via WebSocket events for the player's species
- [ ] Death edge case handles gracefully even if all 3 founders die within seconds
- [ ] Sequence state survives a brief WebSocket reconnection
- [ ] Sequence only plays once per player lifetime (guarded by `quickStartCompleted` + a separate `ahaMomentCompleted` flag)

---

## Step 13.5: InlineTeachCard Component

### What You're Implementing
The `InlineTeachCard` reusable UI component used across the entire onboarding system for Layer 2 system introductions. An anchored dismissable card that appears near a relevant UI element, explains a concept in 1-3 lines, and optionally links to a reference guide page.

### Design References
- `onboarding.md` SS8.1 (InlineTeachCard -- props interface, behavior, visual style)
- `onboarding.md` SS8.7 (Component hierarchy -- InlineTeachCard subcomponents)
- `onboarding.md` SS3.2 (Introduction content -- all 17 introductions, 12 use InlineTeachCard)

### Implementation Details

**Component** at `client/src/components/onboarding/InlineTeachCard.tsx`:

```typescript
interface InlineTeachCardProps {
  id: string;                    // Introduction ID matching onboardingStore key
  title: string;                 // Bold header text
  body: string;                  // 1-3 lines of explanation
  learnMoreGuide?: string;       // Guide page ID for "Learn More" link
  anchorPosition: 'above' | 'below' | 'left' | 'right';
  anchorRef: React.RefObject<HTMLElement>;  // Element to anchor near
  onDismiss: () => void;
}
```

**Layout and positioning**:
- Card is absolutely positioned relative to the anchor element using a portal rendered at the AppShell level.
- Compute position based on `anchorPosition` and anchor element's bounding rect.
- Small arrow (CSS triangle) pointing toward the anchor element, matching the anchor direction.
- If the card would overflow the viewport, flip to the opposite side or reposition to fit.

**Visual style**:
- White card (`bg-white`) with subtle shadow (`shadow-md`).
- Colored left border (4px) matching system category: green (#22c55e) for body, blue (#3b82f6) for brain, orange (#f97316) for world, purple (#a855f7) for lifecycle.
- Border radius 8px.
- Max width 320px on phone, 360px on tablet.
- Padding 12px 16px.

**Behavior**:
- Slide-in animation (150ms ease-out) from the anchor direction.
- Semi-transparent backdrop (`rgba(0,0,0,0.15)`) dims the rest of the screen. Tapping the backdrop dismisses the card.
- "Got It" button at bottom-right dismisses and calls `onDismiss()` which should call `onboardingStore.markIntroCompleted(id)`.
- "Learn More" link (if `learnMoreGuide` provided) opens `GlobalHelpModal` to the specified guide page before dismissal.
- Max 3 lines of body text enforced by CSS line-clamp.

**Category color mapping**:
```typescript
const CATEGORY_COLORS: Record<string, string> = {
  body: '#22c55e',       // bp_budget_deep, hidden_sliders
  brain: '#3b82f6',      // hidden_nodes, synapse_weights, node_bias
  world: '#f97316',      // follow_mode, biome_diff, spectating
  lifecycle: '#a855f7',  // while_away, daily_mutation, leaderboard, entropy, extinction
};
```

### Test Cases
- Card renders with correct title, body, and colored border
- Card positions correctly above/below/left/right of the anchor element
- Arrow points toward the anchor element
- "Got It" dismisses the card and calls `onDismiss`
- "Learn More" opens GlobalHelpModal with the correct guide page
- Tapping the backdrop dismisses the card
- Card flips position if it would overflow the viewport edge
- Slide-in animation plays on mount
- Card does not exceed 3 lines of body text (truncated with ellipsis if longer)

### QA Checklist
- [ ] Card is readable on both light and dark themes
- [ ] Touch target for "Got It" is at least 44x44px
- [ ] Backdrop does not interfere with scroll or other interactions beyond dimming
- [ ] Card repositioning works at all four viewport edges
- [ ] Arrow direction matches the actual card position (e.g., if card flipped, arrow flips too)
- [ ] Component unmounts cleanly (no memory leaks from portal or event listeners)
- [ ] Multiple InlineTeachCards are never shown simultaneously (sequential display)
- [ ] Keyboard escape key also dismisses the card (accessibility)

---

## Step 13.6: EventTeachToast Component

### What You're Implementing
The `EventTeachToast` component for auto-dismissing notification toasts used by Layer 2 event-triggered introductions (reproduction, death, combat, seasons). Appears at the top of the screen with a progress bar showing time until auto-dismiss, and supports a toast queue for handling simultaneous events.

### Design References
- `onboarding.md` SS8.2 (EventTeachToast -- props interface, behavior, visual style, queueing)
- `onboarding.md` SS8.7 (Component hierarchy -- EventTeachToast subcomponents)
- `onboarding.md` SS3.2 (Introduction content -- 5 introductions use EventTeachToast: reproduction, death_energy, seasons, combat, plus potentially others)

### Implementation Details

**Component** at `client/src/components/onboarding/EventTeachToast.tsx`:

```typescript
interface EventTeachToastProps {
  id: string;
  title: string;
  body: string;
  learnMoreGuide?: string;
  duration?: number;          // Auto-dismiss ms (default: 8000)
}
```

**Toast manager** at `client/src/components/onboarding/ToastManager.tsx`:

```typescript
interface ToastManager {
  queue: EventTeachToastProps[];
  activeToast: EventTeachToastProps | null;

  enqueue: (toast: EventTeachToastProps) => void;
  dismiss: () => void;
}
```

- Only one toast displayed at a time. New toasts are queued.
- When the active toast dismisses (auto or manual), the next queued toast appears after a 300ms gap.
- Toast manager is a singleton rendered at the AppShell level, above all screen content.

**Visual style**:
- Floating card at top of screen, centered horizontally, 16px from top.
- Rounded corners (12px), white background, subtle shadow.
- Max width: 400px on tablet, 90vw on phone.
- Padding: 12px 16px.

**Animation**:
- Slide down from off-screen (translateY -100% to 0) on appear (200ms ease-out).
- Slide up on dismiss (150ms ease-in).
- Progress bar at bottom of card: thin line (3px) that shrinks from 100% to 0% width over the duration, colored accent blue.

**Behavior**:
- Auto-dismisses after `duration` ms (default 8000).
- Swipe up gesture dismisses early (touch: detect upward swipe > 50px).
- "Learn More" link opens guide before dismissal.
- On dismiss (manual or auto), calls `onboardingStore.markIntroCompleted(id)`.
- Progress bar pauses while the user is touching/hovering the toast (re-read: the design doc says auto-dismiss, so pause on hover is a UX enhancement).

**Integration with WebSocket events**:

```typescript
// In world event handler
function handleWorldEvent(event: WorldEvent) {
  if (event.type === 'egg_laid' && isPlayerSpecies(event.speciesId)) {
    const store = useOnboardingStore.getState();
    if (store.shouldShowIntro('reproduction')) {
      store.markIntroSeen('reproduction');
      toastManager.enqueue({
        id: 'reproduction',
        title: 'Your organism laid an egg!',
        body: 'Mature, healthy organisms reproduce automatically. Offspring inherit your brain with small mutations.',
        learnMoreGuide: 'lc_repro',
      });
    }
  }
}
```

### Test Cases
- Toast slides down from top when enqueued
- Auto-dismisses after 8 seconds (default duration)
- Progress bar animates from full to empty over the duration
- Swipe up dismisses the toast early
- "Learn More" opens the correct guide page
- Dismiss marks the introduction as completed in onboardingStore
- Queue: enqueue 3 toasts, verify they display sequentially with 300ms gap
- Queue: dismiss active toast early, next toast appears after gap
- Custom duration (e.g., 5000ms) is respected
- Toast does not appear if `shouldShowIntro` returns false

### QA Checklist
- [ ] Toast does not cover critical UI elements (positioned above the TopBar or with enough offset)
- [ ] Swipe gesture works on touch devices and does not conflict with scroll
- [ ] Progress bar animation is smooth (CSS transition, not JS frame loop)
- [ ] Toast is accessible: screen readers announce the title, dismiss button is focusable
- [ ] Toast renders correctly in both portrait and landscape orientations
- [ ] Queue handles rapid-fire events (e.g., organism lays egg and dies in same tick)
- [ ] Toast manager cleans up timers on unmount (no stale timeouts)
- [ ] Toast text is large enough to read on mobile (min 14px body, 16px title)

---

## Step 13.7: System Introductions -- All 17 Triggers

### What You're Implementing
The trigger logic and content for all 17 Layer 2 system introductions. Each introduction fires once per player lifetime when a specific condition is met, displaying either an InlineTeachCard or EventTeachToast with the defined content. This step wires the triggers into the relevant screen components and WebSocket handlers.

### Design References
- `onboarding.md` SS3.1 (Introduction catalog -- all 17 entries with IDs, triggers, locations, formats)
- `onboarding.md` SS3.2 (Introduction content -- full text for each of the 17 introductions)
- `onboarding.md` SS7.3 (Trigger evaluation -- useEffect pattern for screen-based triggers, WebSocket handler pattern for event-based triggers)

### Implementation Details

**Introduction data file** at `client/src/data/introductions.ts`:

```typescript
interface IntroductionDef {
  id: string;
  title: string;
  body: string;
  learnMoreGuide?: string;
  format: 'inline' | 'toast';
  category: 'body' | 'brain' | 'world' | 'lifecycle';
  // Trigger is implemented in the host component, not here
}

export const INTRODUCTIONS: Record<string, IntroductionDef> = {
  while_away: {
    id: 'while_away',
    title: 'While you were away...',
    body: 'Your organisms kept living! This summary shows what happened since your last visit.',
    learnMoreGuide: 'gs_world',
    format: 'inline',
    category: 'lifecycle',
  },
  follow_mode: { ... },
  // ... all 17 entries
};
```

**Screen-based triggers** (12 InlineTeachCards):

| # | ID | Host Component | Trigger Logic |
|---|-----|----------------|--------------|
| 1 | `while_away` | DashboardScreen | `quickStartCompleted && !introductions.while_away` on mount |
| 2 | `follow_mode` | WorldScreen | First organism tap handler |
| 3 | `bp_budget_deep` | BodyTab | `visitCount('bodyTab') === 2` on mount |
| 4 | `hidden_sliders` | BodyTab | After #3 is dismissed (sequential) |
| 5 | `daily_mutation` | DashboardScreen | When mutation badge first appears |
| 8 | `hidden_nodes` | BrainTab | `visitCount('brainTab') === 2` on mount |
| 9 | `synapse_weights` | BrainTab | First synapse tap handler |
| 10 | `node_bias` | BrainTab | First hidden/output node tap handler |
| 11 | `biome_diff` | WorldScreen | Camera position enters non-Grassland biome |
| 14 | `spectating` | WorldScreen | Cumulative follow-mode time reaches 60s |
| 15 | `leaderboard` | DashboardScreen | Player's species appears on leaderboard |
| 16 | `entropy` | DashboardScreen | Player's entropy multiplier exceeds 2.0x |
| 17 | `extinction` | ExtinctionNotificationModal | Inside the existing extinction modal |

**Event-based triggers** (5 EventTeachToasts):

| # | ID | WS Event | Handler Location |
|---|-----|----------|-----------------|
| 5 | `reproduction` | `egg_laid` for player's species | WorldScreen WS handler |
| 6 | `death_energy` | `organism_died` for player's species | WorldScreen WS handler |
| 12 | `seasons` | `season_changed` | WorldScreen or Dashboard WS handler |
| 13 | `combat` | `attack` or `attacked` involving player's species | WorldScreen WS handler |

**Combat toast has two variants**:
- Player's organism attacked: "Your organism attacked! Damage = Strength x Size minus target's Defense."
- Player's organism was attacked: "Your organism was attacked! Defense reduces incoming damage."

**`while_away` has contextual teaching lines** appended based on `player_summaries` data:
- Population increased: append reproduction explanation.
- Population decreased: append food access suggestion.
- Rank improved: append dominance score explanation.
- Species went extinct: append AI placeholder explanation.

**Sequential introduction handling** (#3 and #4 on BodyTab): After `bp_budget_deep` is dismissed, check `shouldShowIntro('hidden_sliders')` and if true, show it with a 500ms delay.

**Follow-mode time tracker**: A ref-based timer in WorldScreen that accumulates milliseconds while in follow mode. When it reaches 60,000ms, trigger the `spectating` introduction.

### Test Cases
- Each of the 17 introductions fires exactly once per player
- `while_away` fires on 2nd login with correct contextual line based on population change
- `follow_mode` fires on first organism tap in world view
- `bp_budget_deep` fires on 2nd visit to BodyTab (not 1st, not 3rd)
- `hidden_sliders` fires after `bp_budget_deep` is dismissed (sequential)
- `reproduction` fires on first `egg_laid` event for player's species
- `death_energy` fires on first `organism_died` event for player's species
- `combat` fires with correct variant based on attack direction
- `seasons` fires on first season change event
- `biome_diff` fires when camera enters a non-Grassland biome
- `spectating` fires after 60s cumulative follow-mode time
- `leaderboard` fires when player's species first appears on board
- `entropy` fires when player's entropy > 2.0x
- `extinction` fires inside the extinction modal
- No introduction fires if `shouldShowIntro` returns false
- No introduction fires during the Quick Start wizard

### QA Checklist
- [ ] All 17 trigger conditions match the specification exactly
- [ ] InlineTeachCard anchor positions are correct for each introduction (near the relevant UI element)
- [ ] EventTeachToast content matches the specification text
- [ ] "Learn More" links point to the correct guide page IDs
- [ ] Sequential introductions (#3 then #4) work correctly with proper delay
- [ ] Combat toast shows the correct variant (attacked vs was-attacked)
- [ ] `while_away` contextual line is correct based on actual `player_summaries` data
- [ ] Introductions do not fire during Quick Start (guarded by `quickStartCompleted`)
- [ ] Follow-mode time accumulator resets correctly on page navigation
- [ ] All 17 introduction IDs match between `introductions.ts` data and `onboardingStore` keys

---

## Step 13.8: Reference Guide -- GuideIndex & GuidePage Components

### What You're Implementing
The `GuideIndex` and `GuidePage` components that power the in-game reference guide inside the `GlobalHelpModal`. GuideIndex shows an accordion-style category list with search. GuidePage renders individual guide content with consistent formatting: Summary, How It Works, Key Numbers, Strategy Tips, Examples, and Related Links.

### Design References
- `onboarding.md` SS4 (Layer 3 -- Reference Guide overview, data storage in `src/data/guides.ts`)
- `onboarding.md` SS4.1 (Guide Index -- 40 guide pages across 9 categories)
- `onboarding.md` SS8.5 (GuideIndex component -- props, accordion, search)
- `onboarding.md` SS8.6 (GuidePage component -- props, content rendering, Try It links, Related links)
- `onboarding.md` SS8.6 (Updated GlobalHelpModal -- tab bar with Quick Help and Reference Guide)

### Implementation Details

**Guide data structure** at `client/src/data/guides.ts`:

```typescript
interface GuidePageData {
  id: string;
  title: string;
  category: string;
  tryItLabel: string;         // e.g., "Open Body Designer"
  tryItRoute: string;         // e.g., "/designer"
  summary: string;
  howItWorks: string[];       // Bullet points
  keyNumbers?: {              // Optional table
    headers: string[];
    rows: string[][];
  };
  strategyTips: string[];
  examples?: string[];        // Optional
  related: string[];          // Guide IDs
  interactiveComponent?: string;  // Component key for embedded interactives
}

export const GUIDE_CATEGORIES: { id: string; label: string; guideIds: string[] }[] = [
  { id: 'getting_started', label: 'Getting Started', guideIds: ['gs_what', 'gs_world', 'gs_redesign'] },
  { id: 'body_design', label: 'Body Design', guideIds: ['bd_bp', 'bd_stats', 'bd_diet', 'bd_traits', 'bd_founders'] },
  // ... 9 categories total
];

export const GUIDES: Record<string, GuidePageData> = { ... };  // All 40 guides
```

**GuideIndex** at `client/src/components/onboarding/GuideIndex.tsx`:

```typescript
interface GuideIndexProps {
  onSelectGuide: (guideId: string) => void;
  searchQuery?: string;
}
```

- 9 collapsible category accordions, each showing its guide entries.
- Search bar at top: filters by title and summary text. Matching categories auto-expand.
- Each guide entry row shows: title and 1-line summary (truncated).
- Tapping a guide entry calls `onSelectGuide(guideId)`.

**GuidePage** at `client/src/components/onboarding/GuidePage.tsx`:

```typescript
interface GuidePageProps {
  guideId: string;
  onBack: () => void;
  onNavigate: (route: string) => void;
}
```

- Renders from `GUIDES[guideId]` data.
- Sections in order: Category badge + title, "Try It" link button, Summary paragraph, "How It Works" bulleted list, "Key Numbers" table (if present), "Strategy Tips" bulleted list, "Examples" (if present), "Related" links at bottom.
- "Try It" button navigates to the relevant screen (closes modal first).
- "Related" links navigate to other guide pages within the modal (push onto a navigation stack).
- Back button returns to GuideIndex or previous guide page (breadcrumb navigation).
- Scrollable content within the modal body.
- Interactive elements (activation function curves, diet graph) rendered as small embedded React components keyed by `interactiveComponent`.

**Updated GlobalHelpModal**:
- Add a tab bar at the top: "Quick Help" (existing content) | "Reference Guide" (new).
- "Reference Guide" tab shows GuideIndex. Selecting a guide replaces index with GuidePage.
- Deep-linking: `GlobalHelpModal` accepts an optional `initialGuideId` prop for "Learn More" links from InlineTeachCard/EventTeachToast.

### Test Cases
- GuideIndex renders 9 categories with correct guide entries
- Tapping a category accordion expands/collapses it
- Search "BP" highlights and shows "BP Budget" and "All Stats Explained"
- Search with no results shows "No guides found" message
- Tapping a guide entry navigates to GuidePage
- GuidePage renders all sections from guide data
- "Try It" navigates to the correct route and closes the modal
- "Related" links navigate to other guide pages within the modal
- Back button returns to the previous view (GuideIndex or previous guide)
- Deep-linking: opening GlobalHelpModal with `initialGuideId='bd_bp'` goes directly to that guide
- Tab bar switches between Quick Help and Reference Guide tabs

### QA Checklist
- [ ] All 9 categories render with correct labels and guide counts
- [ ] Search is fast (filters client-side, no network call)
- [ ] Guide content matches the design doc text exactly (cross-reference all 40 guides in step 13.9)
- [ ] "Try It" links navigate to the correct routes
- [ ] Related links form correct cross-references (no broken links)
- [ ] Navigation stack handles deep chains (Guide A -> Guide B -> Guide C -> back -> back -> Index)
- [ ] Modal scrolls correctly on long guide pages
- [ ] Tab bar state persists when switching between tabs (search query preserved)
- [ ] Keyboard navigation works for accordion and guide selection (accessibility)
- [ ] Interactive components load without blocking the guide page render

---

## Step 13.9: Reference Guide -- All 40 Guide Pages Content

### What You're Implementing
The complete content data file (`src/data/guides.ts`) containing all 40 reference guide pages organized into 9 categories. Each guide has full implementable text covering Summary, How It Works, Key Numbers, Strategy Tips, Examples, and Related Links. This is a data-only step -- no new components.

### Design References
- `onboarding.md` SS4.2 (Guide Page Content -- full text for all 40 guides)
- `onboarding.md` SS4.1 (Guide Index -- IDs, categories, page titles)
- `core-gameplay-systems.md` (authoritative source for all game mechanic numbers)

### Implementation Details

Create the complete `GUIDES` data object in `client/src/data/guides.ts`. All 40 guides:

**Getting Started (3)**:
- `gs_what`: "What Is Life Game?" -- game overview, design-deploy-watch-iterate loop, key numbers (100 BP, 5 biomes, 30 species/world)
- `gs_world`: "How the World Works" -- persistent sim, closed energy, biomes, seasons, 500x500 toroidal
- `gs_redesign`: "Your First Redesign" -- retire-and-redesign flow, common first issues (wander, starve, killed, no growth)

**Body Design (5)**:
- `bd_bp`: "BP Budget" -- shared 100 pool, cost formulas table, founder cost, biome cost
- `bd_stats`: "All Stats Explained" -- all 9 sliders with mechanical effects and cost formulas
- `bd_diet`: "Diet & Digestion" -- enzyme match, stomach mechanics, efficiency curves (interactive diet graph)
- `bd_traits`: "Unlockable Traits Guide" -- all 11 traits by tier with BP costs
- `bd_founders`: "Founder Strategy" -- effective BP table (1-10 founders), tradeoffs

**Brain Design (7)**:
- `br_basics`: "Basics" -- inputs, outputs, synapses, weights, bias, hidden nodes
- `br_activation`: "Activation Functions" -- all 12 functions with descriptions (interactive slider)
- `br_hidden`: "Hidden Nodes" -- tier table, common patterns (size gate, AND, latch, differential)
- `br_processing`: "Processing Order" -- per-tick pipeline, topological order, energy cost
- `br_templates`: "Template Walkthroughs" -- 4 templates with full synapse listings
- `br_drives`: "Emergent Drives" -- curiosity, aggression, territory, hunger-risk patterns
- `br_complex`: "Complex Wiring Examples" -- nesting, food courier, seasonal breeding circuits

**The World (4)**:
- `tw_biomes`: "Biomes & Seasons" -- 5 biomes table, 4 seasons table, interactions
- `tw_energy`: "Energy Cycle" -- 5 energy forms, conservation, plant spawn formula
- `tw_daynight`: "Day/Night Cycle" -- visibility reduction, echolocation
- `tw_fungi`: "Fungi & Environmental Modifiers" -- fungi types, wetland frequency

**Lifecycle (5)**:
- `lc_repro`: "Reproduction (Asexual)" -- maturity requirement, egg mechanics, energy cost
- `lc_sexual`: "Sexual Reproduction" -- sexes, mating, recombination, new inputs
- `lc_genetics`: "Genetics & Mutation" -- birth mutations, daily mutations, crossover
- `lc_ageing`: "Ageing, Entropy & Death" -- lifespan, death causes, entropy multiplier
- `lc_nesting`: "Nesting & Eggs" -- nest affinity, egg inputs, guard circuits

**Combat & Survival (5)**:
- `cs_attack`: "Attack Resolution" -- damage formula, DEF diminishing returns
- `cs_venom`: "Venom" -- DoT, armor bypass, immune counter
- `cs_armor`: "Armor & Burrowing" -- stacking DEF, underground state
- `cs_camo`: "Camouflage" -- speed-based visibility, echolocation counter
- `cs_flee`: "Flee & Sprint" -- sprint mode, energy cost, flee wiring

**Communication (4)**:
- `cm_phero`: "Pheromones" -- 3 channels, emission, gradient following, alarm example
- `cm_sound`: "Sound Signals" -- broadcast, frequency, range, energy cost
- `cm_encounter`: "Encounter Info Sharing" -- ally state inputs, cooperative foraging example
- `cm_herding`: "Herding & Flocking" -- separation/alignment/cohesion, gene weights

**Ecosystem (4)**:
- `ec_dominance`: "Dominance Scoring" -- population + territory + food chain
- `ec_foodchain`: "Food Chain & Balance" -- predator-prey dynamics, scavenger niche
- `ec_keystone`: "Keystone Species" -- niche bonus, leaderboard interaction
- `ec_events`: "Ecological Events" -- droughts, blooms, surges, fat reserves

**Spectating & Progression (3)**:
- `sp_worldview`: "World View Controls" -- zoom, pan, 3 LOD tiers, perception mode
- `sp_follow`: "Follow Mode Tools" -- vision cone, brain overlay, stats panel
- `sp_progression`: "EP, Unlocks & Achievements" -- EP sources, 4 tier table, 17 achievements

**Interactive component keys**: `'activation_function_slider'` for `br_activation`, `'diet_efficiency_graph'` for `bd_diet`. These are small embedded React components that render interactive visualizations within the guide page.

### Test Cases
- All 40 guide IDs exist in the `GUIDES` object
- Every guide has all required fields (id, title, category, summary, howItWorks, strategyTips, related)
- All `related` links reference valid guide IDs (no broken cross-references)
- All `tryItRoute` values are valid application routes
- Category lists in `GUIDE_CATEGORIES` contain exactly the guide IDs that belong to them
- Total guide count per category matches: Getting Started(3), Body Design(5), Brain Design(7), The World(4), Lifecycle(5), Combat(5), Communication(4), Ecosystem(4), Spectating(3) = 40
- Key numbers in guides match the values in `core-gameplay-systems.md`
- No guide text exceeds reasonable length (each guide fits in ~1 screenful of scrollable content)

### QA Checklist
- [ ] All 40 guides have content matching `onboarding.md` SS4.2 specification
- [ ] Numeric values (BP costs, damage formulas, stat ranges) cross-referenced against design docs
- [ ] All cross-reference links are bidirectional (if A links to B, B links to A)
- [ ] Guide text is clear and concise (no jargon without explanation)
- [ ] Template walkthroughs match the actual synapse definitions in the brain templates
- [ ] Interactive components (`activation_function_slider`, `diet_efficiency_graph`) have stubs or implementations
- [ ] Guide data file is tree-shakeable (no unused exports)
- [ ] TypeScript types enforce completeness (missing fields cause compile errors)

---

## Step 13.10: Unlock Education Modals (Tier 2/3/4)

### What You're Implementing
The three `UnlockEducationModal` full-screen celebratory modals triggered by EP tier transitions (50 EP, 200 EP, 500 EP). Each modal announces newly unlocked capabilities (brain nodes, inputs, outputs, traits), shows a suggested first experiment with an annotated wiring diagram, and provides navigation to the designer and reference guide.

### Design References
- `onboarding.md` SS5.1 (Tier 2 Unlock -- celebration, 8 new inputs, 4 new outputs, 2 new hidden nodes, 3 new traits, suggested experiment, wiring diagram)
- `onboarding.md` SS5.2 (Tier 3 Unlock -- 15 new inputs, 6 new outputs, 3 new hidden nodes, 6 new traits, suggested experiment)
- `onboarding.md` SS5.3 (Tier 4 Unlock -- 17 new inputs, 5 new outputs, 3 new hidden nodes, 1 new trait, suggested experiment)
- `onboarding.md` SS5.4 (Modal behavior -- trigger timing, dismiss rules, navigation buttons, sequential display)
- `onboarding.md` SS8.3 (UnlockEducationModal component -- props, behavior, visual style)

### Implementation Details

**Component** at `client/src/components/onboarding/UnlockEducationModal.tsx`:

```typescript
interface UnlockEducationModalProps {
  tier: 2 | 3 | 4;
  onDismiss: () => void;
}
```

**Unlock data** at `client/src/data/unlockContent.ts`:

```typescript
interface TierUnlockContent {
  tier: number;
  celebrationText: string;    // "Tier 2 Unlocked!"
  newInputs: { name: string; description: string }[];
  newOutputs: { name: string; description: string }[];
  newHiddenNodes: { name: string; description: string }[];
  newTraits: { name: string; description: string }[];
  suggestedExperiment: {
    text: string;             // "Try this: ..." paragraph
    advancedText: string;     // "Advanced: ..." paragraph
  };
  wiringDiagram: {
    nodes: { id: string; label: string; type: 'input' | 'hidden' | 'output'; x: number; y: number }[];
    synapses: { from: string; to: string; weight: number; label: string }[];
  };
  guideSection: string;       // Guide category to link to
}
```

**Modal layout**:
- Full-screen overlay with dark semi-transparent backdrop (`rgba(0,0,0,0.7)`).
- Centered card: max-width 480px, max-height 85vh, scrollable content area.
- **Header**: Tier-colored banner (Tier 2 = blue, Tier 3 = purple, Tier 4 = gold). Large text "Tier N Unlocked!" with confetti animation for 2 seconds.
- **Feature lists**: Four collapsible sections: "New Brain Inputs (N)", "New Brain Outputs (N)", "New Processing Nodes (N)", "New Traits (N)". Each item shows name and 1-line description.
- **Suggested experiment**: Boxed section with "Try this:" and "Advanced:" paragraphs.
- **Wiring diagram**: Small canvas rendering the suggested wiring as a node graph (same visual style as BrainTab, but read-only and simplified). Annotated with labels on each synapse.
- **Action buttons**: "Got It" (primary, dismisses), "Explore in Designer" (navigates to `/designer` BrainTab), "Open Guide" (opens guide section).

**Confetti animation**: Simple particle system -- 50-100 colored squares/circles falling from the top of the modal for 2 seconds. Colors match the tier color. Use CSS animations or a lightweight canvas animation.

**Trigger integration**:
- The existing `checkUnlocks()` function (in progression system) is extended to also call `onboardingStore.shouldShowTierUnlock(tier)`.
- If the player unlocks a tier while offline, the modal appears on next login (after the "While You Were Away" introduction).
- If multiple tiers are unlocked simultaneously (rare), show them sequentially (Tier 2 first, then 3, then 4).
- Modal cannot be dismissed by tapping outside (must use explicit "Got It" button).

**Tier 2 content** (50 EP):
- 8 new inputs: Speed, Maturity, NearestAllyAngle, NearestAllyDist, NOrganisms, NFood, IsGrabbing, AttackedDamage
- 4 new outputs: Want2Grow, Digestion, Grab, Want2Heal
- 2 new hidden: Latch (memory), Multiply (AND-gate)
- 3 new traits: Armor Plating, Venom Glands, Echolocation
- Experiment: `EnergyRatio -> Want2Grow` and `AttackedDamage -> Want2Heal`
- Advanced: Multiply node for conditional attack logic

**Tier 3 content** (200 EP):
- 15 new inputs: Tic, TimeAlive, EggStored, BiomeType, SeasonPhase, NearestOrganismColor, NearestAllyCount, StomachPlantRatio, NearestMateAngle, NearestMateDist, Sex, MatingCooldown, NearbyEggCount, NearestEggAngle, NearestEggDist
- 6 new outputs: Want2Reproduce, Herding, ClockReset, Burrow, Want2Mate, StoreFat
- 3 new hidden: Gaussian, Differential, Absolute
- 6 new traits: Burrowing, Camouflage, Fat Reserves, Spore Dispersal, Herd Coordination, Sexual Reproduction
- Experiment: `EggStored -> Want2Reproduce` with seasonal suppression

**Tier 4 content** (500 EP):
- 17 new inputs: Pheromone1/2/3Strength, Pheromone1/2/3Angle, SoundDirection, SoundIntensity, SoundFrequency, IsBurrowed, AllyEnergyRatio, AllyHealthRatio, AllyHeading, AllyLastFoodAngle, AllyLastThreatAngle, AllyWant2Mate, AllyReproductiveState
- 5 new outputs: EmitPheromone1/2/3, EmitSound, SoundFrequency
- 3 new hidden: Sine, Integrator, Inhibitory
- 1 new trait: Encounter Info Sharing
- Experiment: Alarm pheromone emitter + receiver circuit

### Test Cases
- Tier 2 modal shows correct count of new inputs (8), outputs (4), hidden nodes (2), traits (3)
- Tier 3 modal shows correct counts (15, 6, 3, 6)
- Tier 4 modal shows correct counts (17, 5, 3, 1)
- Confetti animation plays for ~2 seconds on modal open
- "Got It" dismisses the modal and marks the tier as seen in onboardingStore
- "Explore in Designer" navigates to `/designer` BrainTab and closes the modal
- "Open Guide" opens GlobalHelpModal to the correct category
- Modal cannot be dismissed by tapping outside
- Wiring diagram renders the suggested experiment correctly
- Sequential display: if tiers 2 and 3 are both pending, tier 2 shows first
- Modal appears on login if tier was unlocked while offline

### QA Checklist
- [ ] All new inputs/outputs/hidden/traits for each tier match the design doc lists exactly
- [ ] Confetti animation does not cause frame drops on mobile
- [ ] Modal content scrolls correctly on small screens
- [ ] Wiring diagram is readable at modal width (node labels not truncated)
- [ ] Feature list sections are collapsible to manage content length
- [ ] "Got It" button is always visible (sticky at bottom or scrolled into view)
- [ ] Tier colors are visually distinct (blue, purple, gold)
- [ ] Modal z-index is above all other content including the debug overlay
- [ ] Suggested experiment text matches the wiring diagram exactly

---

## Step 13.11: Reset Tutorial Tips (ProfileSettings Integration)

### What You're Implementing
A "Reset Tutorial Tips" option in the Profile Settings screen that allows players to re-experience all onboarding content. Tapping "Reset" shows a confirmation dialog, and on confirm resets all onboarding state (Quick Start, introductions, tier unlock modals) while preserving EP, unlocks, and achievements.

### Design References
- `onboarding.md` SS8.8 (Reset Tutorial Tips -- settings row, confirmation dialog, reset behavior, navigation to `/onboarding`)
- `onboarding.md` SS1.6 (Escape Hatches Everywhere -- onboarding can be reset from Profile Settings)
- `onboarding.md` SS7.1 (`resetOnboarding` action on onboardingStore)
- `components/front-end.md` (ProfileSettingsScreen layout)

### Implementation Details

**Settings row addition** in `ProfileSettingsScreen`:

```
--- Settings ---
Notifications  [ON / off]
Sound          [on / OFF]
Theme          [Light / Dark]
Reset Tutorial Tips  [Reset]    <-- NEW ROW
```

- "Reset" button styled as a secondary/destructive action (not red, but distinct from toggles).
- Tapping "Reset" opens a confirmation dialog:

**Confirmation dialog**:
- Title: "Reset Tutorial Tips?"
- Body: "This will re-show all tutorial tips, introductions, and the quick start wizard. Your EP and unlocks are not affected."
- Buttons: "Cancel" (secondary), "Reset" (primary/destructive)

**On confirm**:
1. Call `onboardingStore.resetOnboarding()`:
   - Sets `quickStartCompleted = false`, `quickStartStep = 0`
   - Clears `introductions` to empty object
   - Clears `tierUnlocksSeen` to empty set
   - Clears `visitCounts` to empty object
2. Persist reset state to both localStorage and Supabase (immediate, not debounced).
3. Navigate to `/onboarding` (Quick Start wizard Step 1).
4. Show a brief success toast: "Tutorial tips reset. Starting over!"

**Edge cases**:
- If the player has an active species deployed, do NOT retire it. The Quick Start will skip deploy (Step 4) if a species already exists, or re-run normally.
- Visit counters reset, so "2nd visit to BodyTab" triggers will fire again on the 2nd visit post-reset.
- Tier unlock modals will re-show on the next EP check (since the seen flags are cleared). If the player is already at Tier 4, all three modals will show sequentially on next `checkUnlocks()`.

### Test Cases
- "Reset Tutorial Tips" row appears in ProfileSettings
- Tapping "Reset" shows the confirmation dialog with correct text
- "Cancel" dismisses the dialog without any changes
- "Reset" clears all onboarding state in the store
- After reset, `quickStartCompleted` is false and `quickStartStep` is 0
- After reset, all 17 introductions are cleared (all return `shouldShowIntro = true`)
- After reset, `tierUnlocksSeen` is empty (all three tier modals will re-show)
- After reset, navigates to `/onboarding`
- EP, unlocks, and achievements are NOT affected by reset
- If player has an active species, it remains active after reset
- Supabase `onboarding_state` column is updated to reflect the reset
- Visit counters in localStorage are cleared

### QA Checklist
- [ ] Confirmation dialog clearly states that EP/unlocks are preserved
- [ ] Reset + navigate is atomic (no intermediate state visible to user)
- [ ] Quick Start wizard works correctly after reset (same as first login flow)
- [ ] All 17 introductions fire again with correct triggers after reset
- [ ] Tier unlock modals fire again after reset (in order, if multiple tiers already unlocked)
- [ ] Reset does not cause any WebSocket disconnection or world state loss
- [ ] "Reset Tutorial Tips" is only visible to the authenticated user (not visible to guests)
- [ ] Success toast confirms the action was completed
- [ ] Multiple rapid taps on "Reset" do not cause duplicate resets or navigation issues
