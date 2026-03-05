# Phase 7 — Persistence

Supabase integration for species designs, world snapshots, leaderboards, event logs, user profiles, and progression tracking.

> **Before you start this phase**, read the general guidance in [`README.md`](./README.md).

### Phase 7 Guidance

**Read these design docs first:**
- `architecture.md` Section 9 (Database Schema) — all table definitions, column types, indexes, RLS policies
- `architecture.md` Section 7 (Security) — Row Level Security policies, service role vs anon key usage
- `components/back-end.md` Section 7 (Persistence Layer) — snapshot strategy, write intervals, retry logic

**Prerequisites:**
- Phase 1 must be complete (database schema deployed to Supabase).
- Phases 2-5 must be complete (the simulation produces the data you're now persisting).

**Ask the manager before starting this phase:**
- [ ] Confirm the Supabase project has all tables from Phase 1's SQL migration applied
- [ ] Confirm RLS policies are enabled on all tables
- [ ] Provide the `SUPABASE_SERVICE_ROLE_KEY` for server-side writes (this key bypasses RLS — handle it carefully, never commit it to git)
- [ ] Confirm the Supabase Storage bucket exists for world snapshots (if using Storage for large snapshots)

**Important: This phase uses the service role key.** The server uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS for admin operations (writing snapshots, updating leaderboards). The client uses `SUPABASE_ANON_KEY` which respects RLS. Never mix these up. Never expose the service role key to the client.

**QA handoff for this phase:**
When done, tell the manager: "Run `pnpm --filter server test` — all persistence tests should pass (these run against the real Supabase project, so credentials must be in `.env`). Then verify in the Supabase dashboard: (1) `species_designs` table has test entries, (2) `world_snapshots` table has at least one snapshot, (3) `leaderboard_scores` table has entries sorted correctly, (4) RLS test: log in as Player A in the dashboard SQL editor and confirm you cannot SELECT Player B's designs."

---

## Step 7.1 — Supabase Client Setup

### What You're Implementing

Server-side Supabase client initialization with `service_role` key, environment configuration, connection verification, and error handling wrapper. This is the persistence foundation used by all subsequent steps.

### Design References

- `architecture.md` Section 6 (Deployment Architecture) — Supabase managed Postgres + Auth, service_role key for server writes.
- `components/back-end.md` Section 7 (Supabase Integration) — `createSupabaseClient()`, service_role setup, connectivity check.
- `components/back-end.md` Section 1.2 — Server startup sequence step 2: Supabase init with `SELECT 1` verification.

### Implementation Details

```typescript
// server/src/persistence/supabase-client.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function createSupabaseClient(url: string, serviceRoleKey: string): SupabaseClient {
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function verifyConnection(client: SupabaseClient): Promise<void> {
  const { error } = await client.from('worlds').select('id').limit(1);
  if (error) throw new Error(`Supabase connection failed: ${error.message}`);
}
```

Environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

#### Supabase Outage Resilience (Bounded Write Queue)

- `architecture.md` Section 8.3 (Failure Modes — Supabase Outage) — full recovery spec.

When Supabase is unreachable, the server must continue simulating and queue writes for later:

```typescript
class ResilientSupabaseWriter {
  private queue: PendingWrite[] = [];
  private readonly MAX_QUEUE_SIZE = 1000;
  private isConnected = true;
  private retryTimer: NodeJS.Timer | null = null;

  async write(table: string, data: unknown, priority: 'high' | 'low'): Promise<void> {
    if (this.isConnected) {
      try {
        await this.client.from(table).upsert(data);
        return;
      } catch (err) {
        this.isConnected = false;
        this.startRetryLoop();
      }
    }
    // Queue the write
    if (this.queue.length >= this.MAX_QUEUE_SIZE) {
      // Drop oldest LOW priority items first
      const lowIdx = this.queue.findIndex(w => w.priority === 'low');
      if (lowIdx >= 0) this.queue.splice(lowIdx, 1);
      else this.queue.shift(); // all high priority, drop oldest
    }
    this.queue.push({ table, data, priority, timestamp: Date.now() });
  }

  private startRetryLoop(): void {
    if (this.retryTimer) return;
    this.retryTimer = setInterval(async () => {
      try {
        await this.client.from('worlds').select('id').limit(1);
        this.isConnected = true;
        clearInterval(this.retryTimer!);
        this.retryTimer = null;
        await this.flushQueue();
      } catch { /* still down */ }
    }, 30_000); // retry every 30 seconds
  }

  private async flushQueue(): Promise<void> {
    // Flush in order, write a fresh snapshot after flush
    while (this.queue.length > 0) {
      const item = this.queue.shift()!;
      await this.client.from(item.table).upsert(item.data);
    }
  }
}
```

Priority levels: snapshots = `high`, events/leaderboard = `low`.

### Unit Tests

- Client creation succeeds with valid URL and key.
- `verifyConnection` succeeds against a running Supabase instance (integration).
- Error handling: invalid URL throws descriptive error.
- Write queue: when Supabase is down, writes are queued (up to 1000 items).
- Queue overflow: low-priority items are dropped first when queue is full.
- Reconnect: after Supabase returns, queue flushes in order.
- Retry loop: connection is retried every 30 seconds.

### QA Checklist

- [ ] Server starts and logs "Supabase connected" on success
- [ ] Server fails fast with clear error message if Supabase is unreachable
- [ ] Service role key is never logged or exposed
- [ ] Supabase outage: simulation continues, writes queue in memory (max 1000)
- [ ] Supabase reconnect: queued writes flush in order, fresh snapshot written
- [ ] Low-priority items (events) are dropped before high-priority (snapshots) when queue is full

---

## Step 7.2 — Species Persistence

### What You're Implementing

Save and load species designs to the `species_designs` table. Store the full blueprint as JSON, track version history, and handle the active/retired lifecycle.

### Design References

- `architecture.md` Section 9 — Database schema: `species_designs` table (id, player_id, species_name, version, body_genes, traits, brain_config, deployment_config, is_active, created_at).
- `architecture.md` Section 2 (Data Flow A) — Design→Deploy flow: client saves to Supabase, server reads by design_id.
- `components/back-end.md` Section 7 — Species design fetch on deploy.

### Implementation Details

```typescript
interface SpeciesPersistence {
  saveDesign(playerId: string, design: OrganismDesign): Promise<string>;
  getDesign(designId: string): Promise<OrganismDesign | null>;
  getActiveDesign(playerId: string): Promise<OrganismDesign | null>;
  retireDesign(designId: string): Promise<void>;
  getDesignHistory(playerId: string, limit?: number): Promise<OrganismDesign[]>;
}
```

#### Save Design

```sql
INSERT INTO species_designs (player_id, species_name, version, body_genes, traits, brain_config, deployment_config, is_active)
VALUES ($1, $2, $3, $4, $5, $6, $7, true);

-- Deactivate previous active design
UPDATE species_designs SET is_active = false
WHERE player_id = $1 AND is_active = true AND id != $new_id;
```

Blueprint stored as JSONB columns for body_genes, traits, brain_config, deployment_config. Server validates BP budget and trait unlocks before accepting.

### Unit Tests

- Save design → retrieve by ID → matches original.
- Save new design → previous design becomes is_active=false.
- Get design history returns designs in reverse chronological order.
- Invalid design (BP > 100) is rejected.

### Integration Tests

- Full deploy flow: save design → send deploy command → server fetches → spawns organisms.

### QA Checklist

- [ ] Designs are persisted and survive server restart
- [ ] Only one active design per player at a time
- [ ] Design history is accessible for stats/analytics
- [ ] Blueprint JSON is valid and complete

---

## Step 7.3 — World Snapshots

### What You're Implementing

Periodic world state serialization to the `world_snapshots` table. Snapshots include all entity positions, states, species metadata, pheromone grid, and season state. Used for server restart recovery.

### Design References

- `architecture.md` Section 9 — `world_snapshots` table (id, world_id, tick, data, created_at). Retention: 3 per world.
- `components/back-end.md` Section 1.2 — Server startup: restore from latest snapshot.
- `components/back-end.md` Section 1.3 — Snapshot interval: every `5 * 60 * SIM_TPS` ticks.
- `components/back-end.md` Section 1.5 — Graceful shutdown writes final snapshot.

### Implementation Details

```typescript
interface SnapshotPersistence {
  writeSnapshot(worldId: string, world: World): Promise<void>;
  getLatestSnapshot(worldId: string): Promise<WorldSnapshot | null>;
  restoreFromSnapshot(snapshot: WorldSnapshot): World;
  pruneOldSnapshots(worldId: string, keep: number): Promise<void>;
}

interface WorldSnapshot {
  worldId: string;
  tick: number;
  organisms: SerializedOrganism[];
  pellets: SerializedPellet[];
  eggs: SerializedEgg[];
  speciesMetadata: SpeciesMetadata[];
  pheromoneGrid: Float32Array[];    // 3 channels
  seasonState: SeasonState;
  freeBiomass: number;
  totalEnergy: number;
  biomeMap: number[];               // biome type per cell
}
```

#### Serialization

All entity data is serialized to a compact JSON format. Typed arrays (pheromone grid) are base64-encoded. Brain compiled arrays are serialized as base64-encoded Float64Array/Int32Array buffers.

#### Snapshot Schedule

```
if (world.currentTick % SNAPSHOT_INTERVAL === 0) {
  await writeSnapshot(world.id, world);
  await pruneOldSnapshots(world.id, 3);  // keep last 3
}
```

#### Restore

On server startup, for each running world: fetch latest snapshot, deserialize entities, rebuild spatial hash, resume from snapshot tick.

### Unit Tests

- Serialize world → deserialize → all entity states match.
- Pheromone grid roundtrips correctly through base64 encoding.
- Brain data (Float64Array) roundtrips correctly.
- Prune keeps only latest N snapshots.

### Integration Tests

- Write snapshot → restart server → verify world resumes from correct tick.
- Verify organisms retain their brain state, positions, energy after restore.

### QA Checklist

- [ ] Snapshots are written every 5 minutes
- [ ] Server restores from latest snapshot on restart
- [ ] Snapshot data is complete (no missing entity fields)
- [ ] Old snapshots are pruned (max 3 per world)
- [ ] Graceful shutdown writes final snapshot
- [ ] pg_cron snapshot pruning runs as safety net (supplements app-code pruning)

#### pg_cron Snapshot Pruning (Safety Net)

- `architecture.md` Section 8 (Failure Modes) — App-code pruning in `pruneOldSnapshots()` is the primary mechanism. A pg_cron job provides a safety net in case the application fails to prune (e.g., after a crash):

```sql
-- Run every 6 hours
SELECT cron.schedule('prune-old-snapshots', '0 */6 * * *', $$
  DELETE FROM world_snapshots
  WHERE id NOT IN (
    SELECT id FROM world_snapshots ws2
    WHERE ws2.world_id = world_snapshots.world_id
    ORDER BY created_at DESC
    LIMIT 3
  );
$$);
```

This is a supplement — not a replacement — for the application-level `pruneOldSnapshots(worldId, 3)` call in Step 7.3.

---

## Step 7.4 — Leaderboard System

### What You're Implementing

Track and persist species performance metrics: population peaks, survival time, total kills, energy harvested. Serve leaderboard queries with sorting and filtering.

### Design References

- `architecture.md` Section 9 — `leaderboard_scores` table (species_id, world_id, peak_population, survival_hours, total_kills, total_energy, score, updated_at).
- `core-gameplay-systems.md` Section 7 (Analytics) — Leaderboard scoring formula, categories.
- `components/back-end.md` Section 1.3 — Leaderboard write interval: every `60 * SIM_TPS` ticks.

### Implementation Details

```typescript
interface LeaderboardPersistence {
  updateScores(worldId: string, speciesManager: SpeciesManager): Promise<void>;
  getLeaderboard(worldId: string, sortBy: LeaderboardSort, limit?: number): Promise<LeaderboardEntry[]>;
  getSpeciesRank(speciesId: string): Promise<number>;
}

interface LeaderboardEntry {
  speciesId: string;
  speciesName: string;
  playerName: string;
  isAI: boolean;
  peakPopulation: number;
  survivalHours: number;
  totalKills: number;
  totalEnergy: number;
  score: number;
}

type LeaderboardSort = 'score' | 'population' | 'survival' | 'kills' | 'energy';
type LeaderboardPeriod = 'current' | 'seasonal' | 'allTime';
```

#### Leaderboard Tiers

- **Current**: Active species in the running world (real-time, rolling average over 6 hours).
- **Seasonal**: Cumulative score across a full 28-day season cycle. Crown the "Seasonal Champion" at each season's end.
- **All-Time (Hall of Fame)**: Best all-time scores, best single-week runs, persisted indefinitely.

Seasonal leaderboard resets at the start of each new season cycle. Hall of Fame entries are never deleted.

```typescript
interface SeasonalLeaderboard {
  getSeasonalLeaderboard(worldId: string, season: number): Promise<LeaderboardEntry[]>;
  archiveSeason(worldId: string, season: number): Promise<void>;  // copies top entries to hall of fame
}

interface HallOfFame {
  getHallOfFame(worldId: string, limit?: number): Promise<HallOfFameEntry[]>;
}

interface HallOfFameEntry extends LeaderboardEntry {
  seasonNumber: number;
  achievedAt: Date;
  weeklyBest?: boolean;  // was this the best single-week run?
}
```

#### Scoring Formula

```
score = peakPopulation * 10
      + survivalHours * 5
      + totalKills * 2
      + totalEnergyHarvested / 1000
```

#### Update Schedule

Every 60 seconds (wall-clock), upsert leaderboard scores for all active species.

### Unit Tests

- Score calculation matches expected formula.
- Leaderboard query returns entries sorted by requested field.
- Upsert correctly updates existing entries (doesn't create duplicates).

### QA Checklist

- [ ] Leaderboard updates every 60 seconds
- [ ] Scores persist across server restarts
- [ ] AI species appear on leaderboard (marked as AI)
- [ ] Sorting works for all 5 categories
- [ ] Seasonal leaderboard resets at season boundary
- [ ] Hall of Fame preserves best all-time scores permanently

---

## Step 7.5 — Event Log Persistence

### What You're Implementing

Persist notable world events (from EventDetector) to the `event_log` table for historical queries and "while you were away" reports.

### Design References

- `architecture.md` Section 9 — `event_log` table (id, world_id, type, data, species_id, player_id, tick, created_at).
- `components/game-components.md` Section 11 (EventDetector) — Event types and data format.
- `core-gameplay-systems.md` Section 7 — Events feed for world view.

### Implementation Details

```typescript
interface EventPersistence {
  persistEvents(events: WorldEvent[]): Promise<void>;
  getRecentEvents(worldId: string, limit?: number): Promise<WorldEvent[]>;
  getEventsSince(worldId: string, since: Date): Promise<WorldEvent[]>;
  getWhileYouWereAway(playerId: string, lastSeen: Date): Promise<AwayReport>;
}

interface AwayReport {
  extinctions: WorldEvent[];
  milestones: WorldEvent[];
  yourSpeciesEvents: WorldEvent[];
  topPredator: { speciesName: string; kills: number };
  populationChange: { species: string; delta: number }[];
}
```

Events are batched and written periodically (every 15 seconds or when buffer reaches 100 events).

#### Event Batching Implementation (`back-end.md` §7.2)

```typescript
// server/src/persistence/event-writer.ts
const eventBuffer: EventLogEntry[] = [];

export function queueEvent(event: EventLogEntry): void {
  eventBuffer.push(event);
}

export async function flushEvents(): Promise<void> {
  if (eventBuffer.length === 0) return;
  const batch = eventBuffer.splice(0);  // Take all, clear buffer

  try {
    await supabase.from('event_log').insert(batch);
  } catch (err) {
    console.error('Event batch write failed:', err);
    // Re-queue failed events (drop if buffer exceeds 1000 to prevent memory leak)
    if (eventBuffer.length < 1000) {
      eventBuffer.unshift(...batch);
    }
  }
}
```

Key behaviors:
- **Buffer cap**: If re-queued events push buffer past 1,000, excess events are dropped (prevents memory leak during Supabase outage).
- **Flush trigger**: Called every 15 seconds from the game loop's persistence tick, OR when buffer reaches 100 events.
- **Failure recovery**: Failed batches are re-queued at the front of the buffer for next flush attempt.

#### Event Log Retention & Scheduled Cleanup

- `architecture.md` Section 9 (event_log) — Retention: 30 days for detailed event rows, 90 days for aggregated daily summaries.

Retention is enforced by a pg_cron job that runs daily:

```sql
-- Run daily at 03:00 UTC
SELECT cron.schedule('cleanup-event-log', '0 3 * * *', $$
  -- Delete detailed events older than 30 days
  DELETE FROM event_log WHERE created_at < NOW() - INTERVAL '30 days';
  -- Delete player_summaries older than 90 days
  DELETE FROM player_summaries WHERE period_end < NOW() - INTERVAL '90 days';
$$);
```

The application code writes events at full detail. The cron job handles lifecycle — no application-side deletion needed.

### Unit Tests

- Events are persisted with correct type, data, and timestamps.
- `getEventsSince` returns only events after the given date.
- `getWhileYouWereAway` correctly filters for relevant events.
- Batch writing doesn't lose events on failure (retry logic).
- `flushEvents` re-queues failed batch at front of buffer.
- Buffer exceeding 1,000 events drops oldest re-queued events (memory safety).
- `queueEvent` → `flushEvents` → Supabase `insert` receives correct batch.

### QA Checklist

- [ ] Events persist and are queryable by type, species, and time range
- [ ] "While you were away" report shows meaningful summary
- [ ] Event buffer cap at 1,000 prevents memory leak during Supabase outage (`back-end.md` §7.2)
- [ ] Failed event batches are re-queued for next flush attempt
- [ ] Event log doesn't grow unboundedly (retention policy: 30 days detail, 90 days aggregated — see `architecture.md` Section 9)
- [ ] pg_cron job runs daily to purge events older than retention threshold
- [ ] pg_cron job prunes `player_summaries` snapshots older than 90 days

---

## Step 7.6 — User Profile & Progression

### What You're Implementing

Track user statistics (total species deployed, best scores, achievements), species deployment history, progression state (experience points, unlocked tiers/traits), and daily mutation selection state.

### Design References

- `architecture.md` Section 9 — `players` table (id, display_name, role, experience_points, unlocked_tiers, current_world_id, created_at, last_seen). `player_summaries` table for periodic stats snapshots.
- `core-gameplay-systems.md` Section 8 (Progression) — Experience points formula, tier unlocks, achievement definitions.
- `core-gameplay-systems.md` Section 3.6 — Daily mutation selection: 3 options, player picks 0 or 1.

### Implementation Details

```typescript
interface UserPersistence {
  getProfile(playerId: string): Promise<UserProfile>;
  updateExperience(playerId: string, delta: number): Promise<void>;
  getUnlockedTiers(playerId: string): Promise<number>;
  unlockTier(playerId: string, tier: number): Promise<void>;
  getSpeciesHistory(playerId: string): Promise<SpeciesHistoryEntry[]>;
  saveDailyMutationChoice(playerId: string, choice: MutationChoice | null): Promise<void>;
  getDailyMutationOptions(playerId: string): Promise<MutationOption[]>;
  updateLastSeen(playerId: string): Promise<void>;
}

interface UserProfile {
  id: string;
  displayName: string;
  role: 'player' | 'admin';
  experiencePoints: number;
  unlockedTiers: number;        // 1-4
  totalSpeciesDeployed: number;
  bestScore: number;
  currentWorldId: string | null;
  lastSeen: Date;
}
```

#### Supabase RPC Functions (defined in Phase 01 migrations, called here)

Two Postgres RPC functions from `back-end.md` §10.3 are used in the user/mutation flow:

- **`expire_stale_mutations()`** — Called hourly by pg_cron. Expires `daily_mutations` rows with `status = 'pending'` older than 24h. Returns count of affected rows.
- **`get_player_status(p_player_id)`** — Called from client on reconnect / return-after-absence. Returns JSON with `has_active_species`, `current_world`, `pending_mutations` count, and `last_seen` timestamp. Used by the onboarding flow to route returning players.

Both are defined in `012_create_functions.sql` (Phase 01 Step 1.5) and tested in integration tests below.

#### Experience Points

Earned from species performance: +1 EP per organism-minute survived, +5 EP per reproduction event, +2 EP per kill. Calculated during periodic summary writes (every hour).

#### Tier Unlocks

| Tier | EP Required | Unlocks |
|------|------------|---------|
| 1 | 0 | Base 11 inputs, 5 outputs, 4 hidden node types |
| 2 | 50 | +8 inputs, +4 outputs, +2 hidden node types |
| 3 | 200 | +15 inputs, +6 outputs, +4 hidden node types |
| 4 | 500 | +17 inputs, +5 outputs, +2 hidden node types |

### Unit Tests

- Experience delta correctly updates total.
- Tier unlock at correct EP thresholds.
- Species history returns all previous deployments with stats.
- Daily mutation: save choice, retrieve shows selected mutation.

### Integration Tests

- New user starts at Tier 1, 0 EP. Deploy species, run simulation, verify EP accumulates.
- Reach 50 EP, verify Tier 2 unlocks.
- `get_player_status` RPC returns correct JSON for player with active species.
- `get_player_status` RPC returns correct JSON for player with no active species.
- `expire_stale_mutations` RPC: insert mutation with `offered_at` > 24h ago → call function → status is `'expired'`.
- `expire_stale_mutations` RPC: recent mutations (< 24h) are NOT expired.

### QA Checklist

- [ ] User profile loads correctly on login
- [ ] Experience points accumulate from species performance
- [ ] Tier unlocks are persisted and gate designer options
- [ ] Species history shows all past deployments with performance data
- [ ] Daily mutation selection is stored and retrievable
- [ ] Last seen timestamp updates on each session
- [ ] `get_player_status` RPC returns correct status for returning players (`back-end.md` §10.3)
- [ ] `expire_stale_mutations` RPC correctly expires stale pending mutations (`back-end.md` §10.3)
