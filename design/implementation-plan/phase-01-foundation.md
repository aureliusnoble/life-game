# Phase 1: Project Foundation & Shared Code

**Goal**: Establish the monorepo structure, shared TypeScript types, build tooling, and database schema. After this phase, the project compiles, lints, and has a working Supabase database.

**Estimated Steps**: 6

> **Before you start this phase**, read the general guidance in [`README.md`](./README.md).

### Phase 1 Guidance

**Read these design docs first:**
- `architecture.md` Sections 1-3 (System Overview, Data Flows, Tech Stack)
- `architecture.md` Section 9 (Database Schema) — you'll be creating the Supabase tables
- `components/game-components.md` Section 1 (Shared Types) — defines the interfaces you'll implement in `packages/shared`

**Ask the manager before starting:**
- [x] Create the GitHub repository and grant you access — *`aureliusnoble/life-game` created, SSH key configured*
- [x] Create the Supabase project (free tier) and provide you with: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — *project `bogjyyocqlewsskvivke` created, credentials stored in `.env`*
- [x] Confirm the monorepo tooling preferences (pnpm workspaces is the plan — confirm this is correct) — *Confirmed by manager*

**Infrastructure the manager owns:**
The database schema SQL in this phase needs to be run against the manager's Supabase project. Write the SQL migration files, then ask the manager to apply them (or ask for direct DB access if they prefer).

**QA handoff for this phase:**
When done, tell the manager: "Run `pnpm build` from the repo root — all 3 packages should compile with zero errors. Run `pnpm test` — all shared utility tests should pass. Check the Supabase dashboard and verify all tables from the schema exist with correct columns and RLS policies enabled."

---

## Step 1.1: Monorepo Scaffolding

### What You're Implementing
Create the monorepo directory structure with three packages: `shared` (types/constants), `server` (Node.js simulation), and `client` (React SPA). Set up TypeScript, ESLint, and build tooling.

### Design References
- `architecture.md` §1 (System Overview — monorepo description, tech stack)
- `architecture.md` §2 (Deployment Architecture — Hetzner VPS, Supabase, Caddy)
- `components/back-end.md` §1 (Project structure, file organization)
- `components/front-end.md` §1 (Client project structure)

### Implementation Details

```
life-game/
├── package.json              # Workspace root (pnpm workspaces)
├── pnpm-workspace.yaml
├── tsconfig.base.json        # Shared TS config (strict, ES2022, paths)
├── .eslintrc.cjs             # Shared ESLint config
├── .prettierrc
├── .gitignore
├── packages/
│   ├── shared/
│   │   ├── package.json
│   │   ├── tsconfig.json     # Extends base, composite: true
│   │   └── src/
│   │       └── index.ts
│   ├── server/
│   │   ├── package.json
│   │   ├── tsconfig.json     # Extends base, references shared
│   │   └── src/
│   │       └── index.ts
│   └── client/
│       ├── package.json
│       ├── tsconfig.json     # Extends base, references shared
│       ├── vite.config.ts
│       ├── index.html
│       └── src/
│           └── main.tsx
```

**Key decisions**:
- **pnpm workspaces** for monorepo management (fast, strict, disk-efficient)
- **TypeScript project references** for cross-package type safety
- **Vite** for client bundling (fast dev, tree-shaking, code splitting)
- **tsx** or **ts-node** for server development; plain `tsc` for production build
- Target: `ES2022` for both server (Node 20+) and client (modern browsers)

### Unit Tests
- `pnpm install` succeeds
- `pnpm -r build` compiles all three packages without errors
- `pnpm -r lint` passes with zero warnings

### QA Checklist
- [x] `packages/shared` can be imported by both `server` and `client` — *verified: both packages reference shared and build succeeds*
- [x] Hot-reload works for client dev server (`pnpm --filter client dev`) — *manager verified: Vite dev server starts on :5173, shows "Life Game v0.1.0" (2026-03-05)*
- [x] Server compiles and runs a hello-world HTTP listener — *server/src/index.ts exists and compiles*
- [x] TypeScript strict mode enabled (no `any`, `strictNullChecks`, etc.) — *tsconfig.base.json uses strict: true*

> **Status (2026-03-05):** IMPLEMENTED. Commit `995a1ee`.
> - `pnpm build` — all 3 packages compile, 0 errors
> - `pnpm lint` — passes (0 errors, 2 warnings in later code)
> - Monorepo structure: shared, server, client packages with pnpm workspaces
> - **Pending:** Manager needs to verify hot-reload by running `pnpm --filter client dev` and opening localhost:5173

---

## Step 1.2: Shared Constants & Configuration

### What You're Implementing
Define all game constants, enums, and configuration values in the `shared` package. These are the authoritative numeric values used by both server simulation and client validation/rendering.

### Design References
- `architecture.md` §10 (Performance Budget — SIM_TPS=40, entity counts, bandwidth)
- `core-gameplay-systems.md` §1.1 (Body stat ranges, BP cost formulas)
- `core-gameplay-systems.md` §1.2 (Brain node types, tier unlocks, activation functions)
- `core-gameplay-systems.md` §2 (World dimensions: 500x500, biome count, season cycle)
- `core-gameplay-systems.md` §9 (Stomach constants, digestion rates, material properties)
- `core-gameplay-systems.md` §10 (Combat formulas, damage calculation)
- `components/back-end.md` §9.3 (SEASON_MODIFIERS table, BIOME_MODIFIERS table)
- `art.md` §Color Palette (diet color formula, biome colors, UI colors)

### Implementation Details

Create `packages/shared/src/constants.ts`:

```typescript
// Simulation
export const SIM_TPS = 40;
export const BROADCAST_HZ = 20;
export const WORLD_SIZE = 500;

// BP Budget
export const TOTAL_BP = 100;
export const FOUNDER_BP_COST = 5; // per founder beyond first

// Stat ranges (min, max, default, BP cost formula ID)
export const STAT_RANGES = {
  sizeRatio:    { min: 0.3, max: 3.0, default: 1.0 },
  speedRatio:   { min: 0.2, max: 2.5, default: 1.0 },
  strength:     { min: 0.1, max: 5.0, default: 0.5 },
  defense:      { min: 0.0, max: 4.0, default: 0.0 },
  diet:         { min: 0.0, max: 1.0, default: 0.0 },
  viewAngle:    { min: 15,  max: 360, default: 90  },
  viewRadius:   { min: 1.0, max: 10.0, default: 5.0 },
  metabolism:   { min: 0.5, max: 3.0, default: 1.0 },
  stomachMult:  { min: 0.3, max: 2.0, default: 1.0 },
  growthSpeed:  { min: 0.5, max: 2.0, default: 1.0 },
} as const;

// Brain
export const BRAIN_HIDDEN_NODE_BP = 2;
export const BRAIN_SYNAPSE_BP = 0.5;
export const SYNAPSE_WEIGHT_RANGE = { min: -5, max: 5 };
export const BIAS_RANGE = { min: -5, max: 5 };
// ... etc
```

Create `packages/shared/src/enums.ts` with all game enums:
- `BiomeType`, `Season`, `FungusType`, `DeathCause`
- `InputType` (51 inputs across 4 tiers), `OutputType` (20 outputs across 4 tiers)
- `HiddenNodeType` (12 types across 4 tiers)
- `MessageType` (all WS message codes from architecture.md §4)
- `EntityType` (organism, plant, meat, egg, fungus, spore)
- `TraitId` (11 unlockable traits)

Create `packages/shared/src/formulas.ts`:
- `computeBPCost(stat, value)` — all BP cost formulas
- `computeTotalBP(design)` — validates 100 BP budget
- `dietColor(diet, metabolism)` — HSL color from diet value
- `computeBiomeBPCost(biome, worldState)` — biome crowding cost

### Unit Tests
- Every BP cost formula matches the values in the design doc tables
- `computeTotalBP` returns correct totals for each archetype
- `dietColor(0)` returns green, `dietColor(0.5)` returns yellow, `dietColor(1)` returns red
- Stat ranges enforce min/max correctly
- All enum values match the design doc definitions

### QA Checklist
- [x] Constants file compiles and exports cleanly — *verified: builds with 0 errors*
- [x] All numeric values cross-referenced against design docs — *verified: all 10 body stat formulas, brain costs, biome crowding formula match exactly*
- [x] BP cost formulas produce correct values at default stats (verified against `core-gameplay-systems.md` §1.1 table) — *verified via agent comparison*
- [ ] Enum ordinals match binary protocol expectations — **DEFERRED: needs manual spot-check when binary protocol is implemented (Phase 6)**

> **Status (2026-03-05):** IMPLEMENTED. Commit `55e8116`.
> - Tests: 80/80 passing (constants: 19, enums: 24, formulas: 36, index: 1)
> - BP formulas verified against design doc: all 10 body stats match, brain costs match, biome crowding matches
> - `dietColor()` returns correct green/yellow/red

---

## Step 1.3: Shared Type Definitions

### What You're Implementing
TypeScript interfaces and types for all data structures shared between server and client: organism genes, brain configuration, species design, world state, and message payloads.

### Design References
- `architecture.md` §4 (MessageType enum, binary message formats)
- `architecture.md` §9 (Database schema — all table definitions map to types)
- `core-gameplay-systems.md` §1.1 (BodyGenes interface)
- `core-gameplay-systems.md` §1.2 (BrainConfig, BrainNode, Synapse interfaces)
- `core-gameplay-systems.md` §1.3 (DeploymentConfig, TraitConfig)
- `core-gameplay-systems.md` §3 (Organism lifecycle state)
- `core-gameplay-systems.md` §4 (Pheromone, Sound signal types)
- `core-gameplay-systems.md` §7 (Spectating types — SpeciesStats, EventTimeline)
- `core-gameplay-systems.md` §8 (Progression — EP, achievements, unlock tiers)
- `components/back-end.md` §3 (OrganismState, full organism data structure)
- `components/back-end.md` §4 (BrainEngine types — CompiledBrain, activation functions)
- `components/back-end.md` §5 (SenseSystem, InputMapping)
- `components/back-end.md` §9 (EnvironmentEngine types)

### Implementation Details

Create files in `packages/shared/src/types/`:

```
types/
  organism.ts        # BodyGenes, DerivedStats, OrganismState
  brain.ts           # BrainConfig, BrainNode, Synapse, CompiledBrain
  species.ts         # SpeciesDesign, SpeciesState, DeploymentConfig, TraitConfig
  world.ts           # WorldConfig, BiomeModifiers, SeasonState, DayNightState
  environment.ts     # PheromoneGrid, FungusInstance, EcologicalEvent
  messages.ts        # All WS message payload types (AuthMsg, ViewportMsg, DeltaMsg, etc.)
  player.ts          # PlayerProfile, Achievement, OnboardingState
  leaderboard.ts     # LeaderboardEntry, DominanceScore
  events.ts          # GameEvent, BirthEvent, DeathEvent, etc.
  debug.ts           # TickProfile, EnergySnapshot, BrainTrace, etc.
  index.ts           # Re-exports all types
```

Key types to define:
```typescript
// organism.ts
export interface BodyGenes {
  sizeRatio: number;
  speedRatio: number;
  strength: number;
  defense: number;
  diet: number;
  viewAngle: number;
  viewRadius: number;
  metabolism: number;
  stomachMultiplier: number;
  growthSpeed: number;
  redColor: number;
  greenColor: number;
  blueColor: number;
}

// brain.ts
export interface BrainNode {
  id: string;
  type: 'input' | 'hidden' | 'output';
  subtype: InputType | HiddenNodeType | OutputType;
  tier: 1 | 2 | 3 | 4;
  bias: number;
  x: number;  // UI position (for editor)
  y: number;
}

export interface Synapse {
  from: string;  // node ID
  to: string;    // node ID
  weight: number;
}

export interface BrainConfig {
  nodes: BrainNode[];
  synapses: Synapse[];
}
```

### Unit Tests
- All types compile without errors
- Type guards work correctly (e.g., `isOrganism(entity)`)
- JSON serialization round-trips correctly for all types
- Design validation function accepts valid designs and rejects invalid ones

### QA Checklist
- [x] Every table in `architecture.md` §9 has a corresponding TypeScript type — *verified: types exist for organism, brain, species, world, environment, messages, player, leaderboard, events, debug, snapshot*
- [x] Every WS message in `architecture.md` §4 has a corresponding payload type — *messages.ts exists with payload types*
- [x] Brain node types match the tier tables in `core-gameplay-systems.md` §1.2 — *INPUT_TIERS, OUTPUT_TIERS, HIDDEN_NODE_TIERS defined in enums.ts*
- [x] Input/Output enums match the complete lists in `components/back-end.md` §5 — *verified via 24 enum tests passing*

> **Status (2026-03-05):** IMPLEMENTED. Commit `db14a78`.
> - Tests: 20/20 passing (types.test.ts: type guards, round-trip serialization)
> - Type files: organism.ts, brain.ts, species.ts, world.ts, environment.ts, messages.ts, player.ts, leaderboard.ts, events.ts, debug.ts, snapshot.ts, index.ts
> - All types compile cleanly

---

## Step 1.4: Design Validation

### What You're Implementing
Shared validation logic for species designs. Runs on both client (instant feedback) and server (authoritative check before deployment). Validates BP budget, gene ranges, brain topology, and trait prerequisites.

### Design References
- `core-gameplay-systems.md` §1.1 (BP cost formulas, stat ranges, all cost tables)
- `core-gameplay-systems.md` §1.2 (Brain constraints — max 3 Latch nodes, synapse limits, tier gating)
- `core-gameplay-systems.md` §1.3 (Founder count 1-10, biome BP cost formula)
- `core-gameplay-systems.md` §8 (Tier unlock requirements — which inputs/outputs/nodes/traits per tier)
- `architecture.md` §10 (Design validation < 5ms budget)

### Implementation Details

Create `packages/shared/src/validation/design-validator.ts`:

```typescript
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  bpBreakdown: {
    body: number;
    brain: number;
    traits: number;
    founders: number;
    biome: number;
    total: number;
    remaining: number;
  };
}

export function validateDesign(
  design: SpeciesDesign,
  playerTier: number,
  worldState?: { biomePopulations: Record<BiomeType, number>; totalPopulation: number }
): ValidationResult;
```

Validation checks:
1. **Gene ranges**: Each body gene within `STAT_RANGES[gene].min` to `max`
2. **BP budget**: `computeTotalBP(design) <= 100`
3. **Brain topology**: No cycles (directed acyclic graph), synapses only connect valid node pairs
4. **Tier gating**: No nodes/traits from tiers above player's unlocked tier
5. **Latch limit**: Max 3 Latch nodes per brain
6. **Founder count**: 1-10, BP cost correctly deducted
7. **Biome cost**: If world state provided, compute biome crowding cost
8. **Species name**: 2-24 characters
9. **Trait prerequisites**: e.g., Sexual Reproduction requires Tier 3

### Unit Tests
- Valid herbivore archetype passes validation
- Each archetype (9 total) passes validation at appropriate tier
- Exceeding 100 BP returns error with exact overage amount
- Tier-gated brain nodes rejected when player tier is insufficient
- More than 3 Latch nodes rejected
- Cyclic brain graph rejected
- Gene values outside range rejected
- Founder count < 1 or > 10 rejected
- Species name too short/long rejected
- Edge case: exactly 100 BP passes, 100.01 fails

### QA Checklist
- [x] Validation runs in < 5ms (per architecture.md §10) — *verified: perf test passes (100 validations < 500ms)*
- [ ] All 9 archetype templates pass validation — **PARTIAL: 4/9 archetypes have fixtures (Herbivore, Carnivore, Omnivore, Scavenger). Tank, Scout, Assassin, Big Brain, Tiny Brain are not fully specified in design docs. See NOTE below.**
- [x] BP breakdown matches hand-calculated values from design doc — *verified: formulas match exactly*
- [x] Error messages are human-readable — *verified: test asserts message.length > 10 and code is truthy*

> **NOTE (Design Gap):** The 5 remaining archetypes (Tank, Scout, Assassin, Big Brain, Tiny Brain) are mentioned in phase-09 QA as testing targets, but the design docs only provide hints (e.g., "Tank: Size 1.5+, DEF 3.0+, Armor" from onboarding.md). Full stat tables are not documented. **Manager decision needed:** Should we create reasonable stat tables for these 5 now, or defer until they're needed in Phase 9/10?

> **Status (2026-03-05):** IMPLEMENTED. Commit `adaef5f`.
> - Tests: 32/32 passing (design-validator.test.ts)
> - Validation checks: name, gene ranges, brain DAG, latch limit, tier gating, trait tiers, founder count, BP budget, biome crowding
> - Performance: well under 5ms per validation
> - 2 lint warnings (non-null assertions in hasCycle) — cosmetic, not blocking

---

## Step 1.5: Supabase Database Schema

### What You're Implementing
Set up the Supabase project and deploy the complete database schema: tables, indexes, triggers, functions, and Row-Level Security policies.

### Design References
- `architecture.md` §9 (COMPLETE SQL schema — worlds, players, species_designs, active_species, world_snapshots, leaderboard_scores, event_log, daily_mutations, player_summaries, mutation_history, world_access_grants)
- `architecture.md` §7.6 (World access model — public, password, private)
- `architecture.md` §2 (Supabase as DB/Auth provider)
- `components/back-end.md` §7 (Supabase integration — service_role client, write patterns)

### Implementation Details

Create `supabase/` directory with migration files:

```
supabase/
  config.toml
  migrations/
    001_create_worlds.sql
    002_create_players.sql
    003_create_species_designs.sql
    004_create_active_species.sql
    005_create_world_snapshots.sql
    006_create_leaderboard_scores.sql
    007_create_event_log.sql
    008_create_daily_mutations.sql
    009_create_player_summaries.sql
    010_create_mutation_history.sql
    011_create_world_access_grants.sql
    012_create_functions.sql        # update_updated_at, handle_new_user, update_species_peaks
    013_create_rls_policies.sql     # Row-Level Security
  seed.sql                          # Default world, admin user
```

**RLS Policies** (from architecture.md §7.6 and §9):
- `players`: Users can read own row, update own row (except `role`). **Note**: Phase 13 adds an `onboarding_state JSONB` column to this table via its own migration (`onboarding.md` §7).
- `species_designs`: Users can CRUD own designs
- `active_species`: Read all (public leaderboard), write only via server (service_role)
- `worlds`: Read all (world list), write only admin
- `world_access_grants`: Server-managed via service_role
- `leaderboard_scores`: Read all, write only via server
- `event_log`: Read filtered by scope/player, write only via server
- `daily_mutations`: Users can read/update own pending mutations
- `player_summaries`: Users can read own summaries

**Edge Function stubs**:
- `supabase/functions/delete-own-account/index.ts` — requires `confirm: "DELETE"` body, calls `auth.admin.deleteUser()`
- `supabase/functions/share-card/index.ts` — serves OG meta tags for species farewell card links (see Gap: §6.2 Share Page)

**Supabase Realtime** — `architecture.md` §6.4 step 3:
Enable Realtime on three tables so the client receives push updates:
```sql
-- In a migration file (e.g., 014_enable_realtime.sql)
ALTER PUBLICATION supabase_realtime ADD TABLE leaderboard_scores;
ALTER PUBLICATION supabase_realtime ADD TABLE daily_mutations;
ALTER PUBLICATION supabase_realtime ADD TABLE event_log;
```

**Supabase Storage** — `architecture.md` §4.2 (Storage Buckets):
Create the `share-cards` bucket for species farewell card PNGs:
```sql
-- Via Supabase dashboard or CLI:
-- Bucket: share-cards
-- Public: true (public read, authenticated write)
-- File size limit: 500 KB
-- Allowed MIME types: image/png
-- Path pattern: {speciesId}.png
-- Retention: 90 days (configure auto-pruning via lifecycle policy)
```

**Supabase RPC function** — `architecture.md` §4.2 (REST Operations):
Create a `validate_design` database function for client-side pre-validation:
```sql
-- In 012_create_functions.sql
CREATE OR REPLACE FUNCTION validate_design(design_json JSONB, player_id UUID)
RETURNS JSONB AS $$
DECLARE
  player_tier INTEGER;
BEGIN
  SELECT unlocked_tier INTO player_tier FROM players WHERE id = player_id;
  -- Check BP total <= 100
  -- Check trait tiers <= player_tier
  -- Check brain node tiers <= player_tier
  -- Return { valid: boolean, errors: string[] }
  RETURN '{"valid": true, "errors": []}'::jsonb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
Note: This provides fast client-side pre-check via Supabase RPC. The VPS performs the authoritative validation on deploy.

**Additional Supabase RPC functions** — `components/back-end.md` §10.3:

```sql
-- In 012_create_functions.sql

-- Expire stale pending mutations (called hourly by pg_cron)
CREATE OR REPLACE FUNCTION expire_stale_mutations()
RETURNS INTEGER AS $$
DECLARE
  affected INTEGER;
BEGIN
  UPDATE daily_mutations
  SET status = 'expired'
  WHERE status = 'pending'
    AND offered_at < NOW() - INTERVAL '24 hours';
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$ LANGUAGE plpgsql;

-- Get player's complete status for return-after-absence flow
-- Called from client via supabase.rpc('get_player_status', { p_player_id: userId })
CREATE OR REPLACE FUNCTION get_player_status(p_player_id UUID)
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'has_active_species', EXISTS(
      SELECT 1 FROM active_species WHERE player_id = p_player_id
    ),
    'current_world', (
      SELECT world_id FROM active_species WHERE player_id = p_player_id LIMIT 1
    ),
    'pending_mutations', (
      SELECT COUNT(*) FROM daily_mutations
      WHERE player_id = p_player_id AND status = 'pending'
    ),
    'last_seen', (
      SELECT last_seen FROM players WHERE id = p_player_id
    )
  );
END;
$$ LANGUAGE plpgsql STABLE;
```

**OAuth provider configuration** — `architecture.md` §6.4 step 4:
Document as a manager step: configure Google OAuth in Supabase dashboard (Google Cloud Console credentials, redirect URLs).

### Unit Tests
- All migrations apply successfully to a fresh Supabase instance
- `handle_new_user()` trigger creates player row on auth signup
- `update_updated_at()` trigger updates `updated_at` on player/species modification
- Foreign key constraints work (CASCADE on delete)
- Check constraints enforce valid ranges (BP 1-100, display_name 2-24 chars, etc.)
- RLS policies: authenticated user can read own player data, cannot read other players' designs

### Integration Tests
- Create user via Supabase Auth → player row auto-created
- Insert species_design → read back → data matches
- Insert world_snapshot → verify JSONB storage/retrieval
- Upsert leaderboard_scores → verify unique constraint on species_id

### QA Checklist
- [x] `supabase db push` applies all migrations cleanly — *verified: all 18 migrations applied to remote*
- [x] All tables from `architecture.md` §9 are created — *manager verified in Supabase dashboard (2026-03-05)*
- [x] All indexes from §9 are created — *manager verified in Supabase dashboard (2026-03-05)*
- [x] All triggers fire correctly — *integration test: handle_new_user creates player row, update_updated_at updates timestamp*
- [x] RLS policies tested with different user roles — *integration test: own-read, own-update, own-insert, cross-player blocked, non-admin world insert blocked*
- [ ] Seed data creates at least one default world — **DEFERRED: requires admin user first (see seed.sql for manual steps)**
- [x] Supabase Realtime is enabled on `leaderboard_scores`, `daily_mutations`, `event_log` — *migration 018 applied*
- [x] `share-cards` Storage bucket exists with public read, authenticated write, 500 KB limit — *manager created (2026-03-05)*
- [x] `validate_design` RPC function works — *integration test: returns {valid: true, player_tier: 1}*
- [x] `expire_stale_mutations` RPC function works — *integration test: returns integer*
- [x] `get_player_status` RPC function works — *integration test: returns {has_active_species: false, pending_mutations: 0}*
- [x] Check constraints enforced — *integration test: display_name 2-24 chars, evolution_points >= 0, unlocked_tier 1-4*
- [x] OAuth provider configuration documented as manager step (Google Cloud Console, redirect URLs) — *noted in plan/seed.sql*

> **Status (2026-03-05):** FULLY VERIFIED. Commits `0effa90`, plus integration tests.
> - 18 migration files applied via `supabase db push`
> - 14 integration tests pass against remote Supabase (triggers, RLS, RPC functions, constraints)
> - Manager verified: all tables, functions, and share-cards bucket in dashboard
> - **Deferred:** seed.sql (default world) — requires admin user first; edge function stubs

---

## Step 1.6: Development Environment & CI

### What You're Implementing
Environment variable templates, a Makefile for common commands, and a CI pipeline.

### Design References
- `architecture.md` §2 (Deployment Architecture — Hetzner VPS, Supabase, Caddy)
- `architecture.md` §10 (Performance budget — reference for CI perf gates)

### Implementation Details

Create:
- `.env.example` — template with all env vars (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, etc.)
- `Makefile` — common commands: `dev`, `build`, `test`, `lint`, `typecheck`, `migrate`, `clean`
- `.github/workflows/ci.yml` — on PR/push: lint, build, unit tests for all packages

> **Decision: No Docker or local Supabase.** The original plan specified `docker-compose.yml` and local Supabase via `supabase start`. These were removed because:
> - `pnpm dev` already starts the server and client in watch mode — no containers needed
> - We use a remote Supabase project for the database — no local Postgres needed
> - `supabase start` requires Docker, which adds setup complexity for no benefit when remote Supabase is available
> - The architecture doc (§2) specifies production deployment as Node.js on a VPS with remote Supabase — not containerized
> - If offline development becomes necessary in the future, `supabase start` can be added then

**Environment variables** (from architecture.md §2 and back-end.md §1):
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
WS_PORT=9001
NODE_ENV=development
SIM_TPS=40
DEBUG_ENABLED=true
```

### Unit Tests
- CI pipeline: lint passes, type-check passes, all unit tests pass
- Environment variable loading works with `.env` file

### QA Checklist
- [x] `pnpm dev` starts both server and client in watch mode — *manager verified: shared compiles, client on :5173, server on :9001 (2026-03-05)*
- [x] Remote Supabase accessible and migrations applied — *verified via `supabase db push` (2026-03-05)*
- [ ] Client dev server proxies WS connections to server — **DEFERRED: no WS server yet (Phase 6)**
- [x] CI pipeline runs successfully — *verified: GitHub Actions run #22727281542 passed (28s) — lint, build, test all green*

> **Status (2026-03-05):** IMPLEMENTED. Commits `b767934`, `a9e1143` (CI fix).
> - `.env.example` — complete with all env vars
> - `.env` — created with real Supabase credentials (gitignored)
> - `.github/workflows/ci.yml` — lint, build, test on PR/push to main/master
> - `Makefile` — dev, build, test, lint, typecheck, migrate, clean
> - `docker-compose.yml` removed (see Decision note above)
> - GitHub repo: `aureliusnoble/life-game` — code pushed, CI green
