# Phase 12 — Client Screens

Dashboard, leaderboard, profile, admin panel, and share card system.

> **Before you start this phase**, read the general guidance in [`README.md`](./README.md).

### Phase 12 Guidance

**Read these design docs first:**
- `components/front-end.md` Sections 2, 5-7 (DashboardScreen, LeaderboardScreen, ProfileScreen, AdminRoutes)
- `core-gameplay-systems.md` Section 7 (Events feed, leaderboard categories, scoring)
- `core-gameplay-systems.md` Section 8 (EP progression system, tier unlocks)
- `art.md` Section 9 (Farewell Card) — layout and rendering spec for the extinction share card
- `architecture.md` Section 7 (Security) — admin role check for admin panel

**Prerequisites:**
- Phase 8 must be complete (React app, routing, auth store).
- Phase 7 must be complete (Supabase persistence — leaderboard, events, and profile data come from the database).
- Phase 9 should be complete (organism rendering for the farewell card).

**Ask the manager before starting Step 12.4 (Admin Panel):**
- [ ] Confirm at least one Supabase user account has been granted the `admin` role (this is done by updating the user's `role` field in the `players` table or via Supabase custom claims)
- [ ] Provide the admin test account credentials

**QA handoff for this phase:**
When done, tell the manager: "Run `pnpm --filter client dev` with the server and Supabase running. Verify: (1) Dashboard (`/`) shows world status card with live organism count, your species summary (or 'Design First Species' prompt if none), recent events, (2) Leaderboard (`/leaderboard`) shows species sorted by score — click column headers to re-sort, (3) Profile (`/profile`) shows your EP, tier, species history, (4) Log in as admin — you should see an Admin link in the nav; open it and verify pause/resume world, TPS slider, and force snapshot buttons work, (5) If possible, trigger a species extinction and verify the farewell card modal appears with a rendered organism image and download button."

---

## Step 12.1 — Dashboard Screen

### What You're Implementing

The landing page (Home) showing: current world status summary, recent events feed, user's active species summary with population chart, and quick action buttons (Design, Watch World, View Stats).

### Design References

- `components/front-end.md` Section 2 — DashboardScreen component.
- `core-gameplay-systems.md` Section 7 — Events feed, observable stats.
- `components/front-end.md` Section 4 — EventStore, StatsStore.

### Implementation Details

```typescript
function DashboardScreen() {
  const activeSpecies = speciesStore.activeSpecies;
  const events = eventStore.events.slice(0, 10);
  const worldMeta = worldStore.currentWorld;

  return (
    <ScrollView>
      {/* World Status Card */}
      <Card>
        <h2>{worldMeta?.name || 'No World'}</h2>
        <StatRow label="Species" value={worldMeta?.speciesCount} />
        <StatRow label="Organisms" value={worldMeta?.totalOrganisms} />
        <StatRow label="Season" value={worldMeta?.season} />
      </Card>

      {/* Your Species Card (or "Design First Species" prompt) */}
      {activeSpecies ? (
        <SpeciesSummaryCard species={activeSpecies} />
      ) : (
        <EmptyStateCard
          title="No Active Species"
          action="Design Your First Species"
          onAction={() => navigate('/design')}
        />
      )}

      {/* Recent Events Feed */}
      <Card title="Recent Events">
        {events.map(event => <EventRow key={event.id} event={event} />)}
      </Card>

      {/* Quick Actions */}
      <ActionButtonRow>
        <ActionButton icon="pencil" label="Design" to="/design" />
        <ActionButton icon="eye" label="Watch" to="/world" />
        <ActionButton icon="chart" label="Stats" to="/stats" />
      </ActionButtonRow>
    </ScrollView>
  );
}
```

#### Species Summary Card

Shows: species name, population count with mini sparkline, current entropy multiplier, time deployed, top stat (best performing metric), and "Watch in World" button.

### Unit Tests

- Dashboard renders with no active species (empty state).
- Dashboard renders with active species (summary card visible).
- Events feed shows most recent 10 events.

### QA Checklist

- [ ] Dashboard loads quickly on initial navigation
- [ ] Species summary card shows live population
- [ ] Events feed updates when new events arrive
- [ ] Quick action buttons navigate to correct screens
- [ ] Empty state guides new users to designer

---

## Step 12.2 — Leaderboard Screen

### What You're Implementing

Species leaderboard with sortable columns: score, population peak, survival time, kills, energy harvested. Tabs for current and all-time leaderboards. Filter by human/AI species.

### Design References

- `components/front-end.md` Section 5 — LeaderboardScreen.
- `architecture.md` Section 9 — `leaderboard_scores` table schema.
- `core-gameplay-systems.md` Section 7 — Leaderboard categories and scoring.

### Implementation Details

```typescript
function LeaderboardScreen() {
  const [sortBy, setSortBy] = useState<LeaderboardSort>('score');
  const [filter, setFilter] = useState<'all' | 'human' | 'ai'>('all');
  const entries = useLeaderboard(sortBy, filter);

  return (
    <div>
      <TabBar tabs={['Current', 'Seasonal', 'All Time', 'Hall of Fame']} />
      <FilterChips options={['All', 'Human', 'AI']} selected={filter} onChange={setFilter} />

      <Table>
        <TableHeader>
          <SortableColumn label="Rank" />
          <SortableColumn label="Species" />
          <SortableColumn label="Player" />
          <SortableColumn label="Score" sortKey="score" active={sortBy} onSort={setSortBy} />
          <SortableColumn label="Peak Pop." sortKey="population" active={sortBy} onSort={setSortBy} />
          <SortableColumn label="Survival" sortKey="survival" active={sortBy} onSort={setSortBy} />
          <SortableColumn label="Kills" sortKey="kills" active={sortBy} onSort={setSortBy} />
        </TableHeader>
        <TableBody>
          {entries.map((entry, i) => (
            <LeaderboardRow key={entry.speciesId} rank={i + 1} entry={entry} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

#### Seasonal Leaderboard Tab

- `core-gameplay-systems.md` Section 5.6 — Seasonal Board: cumulative score across a full month-long season cycle. Crown the "Seasonal Champion" at each season's end.

Shows cumulative dominance scores for the current season cycle. Displays season number, days remaining, and champion prediction based on current scores.

#### Hall of Fame Tab

- `core-gameplay-systems.md` Section 5.6 — Hall of Fame: best all-time scores, best single-week runs.

Shows best all-time entries that are never deleted. Each entry includes the season number and date achieved. Separate sub-tabs for "Best Season Score" and "Best Single-Week Run".

```typescript
function HallOfFameTab({ worldId }: { worldId: string }) {
  const [subTab, setSubTab] = useState<'season' | 'weekly'>('season');
  const entries = useHallOfFame(worldId, subTab);

  return (
    <div>
      <SegmentedControl options={['Best Season', 'Best Week']} selected={subTab} onChange={setSubTab} />
      <Table>
        {entries.map((entry, i) => (
          <HallOfFameRow key={entry.speciesId} rank={i + 1} entry={entry}
            seasonNumber={entry.seasonNumber} achievedAt={entry.achievedAt} />
        ))}
      </Table>
    </div>
  );
}
```

#### Category Boards

In addition to the main score board, provide category boards accessible via a dropdown or secondary tabs: Highest Population, Deepest Lineage, Most Territory, Most Kills, Highest Biomass.

- `core-gameplay-systems.md` Section 5.6 — Category Boards definition.

### Unit Tests

- Leaderboard renders entries sorted by selected column.
- Filter: "Human" hides AI species, "AI" hides human species.
- Sorting: clicking "Kills" re-sorts by kills descending.
- Seasonal tab shows correct season number and entries.
- Hall of Fame tab shows best all-time entries with season metadata.
- Category boards display entries sorted by the selected category.

### QA Checklist

- [ ] Leaderboard loads and displays all active species
- [ ] Sorting works for all 5 columns
- [ ] AI species are marked (icon or label)
- [ ] Current user's species is highlighted
- [ ] Leaderboard updates periodically (every 60s)
- [ ] Seasonal tab shows current season scores and "Seasonal Champion" label
- [ ] Hall of Fame shows all-time best entries that persist across seasons
- [ ] Category boards (population, lineage, territory, kills, biomass) sort correctly

---

## Step 12.3 — Profile Screen

### What You're Implementing

User profile page showing: display name, account stats (total species deployed, best score, experience points, tier), species deployment history, and account settings (change password, delete account).

### Design References

- `components/front-end.md` Section 6 — ProfileSettingsScreen.
- `core-gameplay-systems.md` Section 8 (Progression) — EP system, tier unlocks.
- `architecture.md` Section 9 — `players` table, `player_summaries` table.

### Implementation Details

```typescript
function ProfileScreen() {
  const user = authStore.user;
  const profile = useProfile(user?.id);

  return (
    <ScrollView>
      <ProfileHeader name={profile.displayName} tier={profile.unlockedTiers} />

      <StatsGrid>
        <StatCard label="Experience" value={profile.experiencePoints} />
        <StatCard label="Tier" value={`${profile.unlockedTiers}/4`} />
        <StatCard label="Species Deployed" value={profile.totalSpeciesDeployed} />
        <StatCard label="Best Score" value={profile.bestScore} />
      </StatsGrid>

      <Section title="Species History">
        {profile.speciesHistory.map(entry => (
          <SpeciesHistoryRow key={entry.id} entry={entry} />
        ))}
      </Section>

      <Section title="Account">
        <Button onClick={() => openChangePasswordModal()}>Change Password</Button>
        <Button variant="danger" onClick={() => openDeleteAccountModal()}>Delete Account</Button>
      </Section>
    </ScrollView>
  );
}
```

### Unit Tests

- Profile renders correct user stats.
- Species history shows all past deployments in reverse chronological order.
- Tier display shows correct unlock level.

### QA Checklist

- [ ] Profile shows accurate experience points and tier
- [ ] Species history lists all past deployments with key stats
- [ ] Change password flow works
- [ ] Delete account flow has confirmation and works

---

## Step 12.4 — Admin Panel

### What You're Implementing

Admin-only screens: server controls (pause/resume, TPS adjustment), world management (create/stop/reset), player management (kick/ban), entity manipulation (debug), and metrics dashboard.

### Design References

- `components/front-end.md` Section 7 — Admin routes (lazy-loaded, role-gated).
- `debug.md` Section E — Debug REST API endpoints.
- `components/back-end.md` Section 1.4 — WorldManager operations.
- `architecture.md` Section 7 (Security) — Admin JWT role check.

### Implementation Details

```typescript
// Lazy-loaded admin routes
const AdminDashboard = lazy(() => import('./screens/admin/AdminDashboard'));
const AdminWorldList = lazy(() => import('./screens/admin/AdminWorldList'));
const AdminWorldDetail = lazy(() => import('./screens/admin/AdminWorldDetail'));

function AdminDashboard() {
  return (
    <div>
      <h1>Admin Dashboard</h1>

      {/* Server Status */}
      <ServerStatusCard>
        <StatRow label="Uptime" value={serverStatus.uptime} />
        <StatRow label="Worlds" value={serverStatus.worldCount} />
        <StatRow label="Clients" value={serverStatus.clientCount} />
        <StatRow label="Avg Tick" value={`${serverStatus.avgTickMs.toFixed(1)}ms`} />
      </ServerStatusCard>

      {/* Quick Actions */}
      <Button onClick={() => api.pauseAll()}>Pause All Worlds</Button>
      <Button onClick={() => api.resumeAll()}>Resume All Worlds</Button>
    </div>
  );
}

function AdminWorldDetail({ worldId }: { worldId: string }) {
  return (
    <div>
      <WorldStatusCard worldId={worldId} />

      {/* World Controls */}
      <ControlPanel>
        <Button onClick={() => api.pauseWorld(worldId)}>Pause</Button>
        <Button onClick={() => api.resumeWorld(worldId)}>Resume</Button>
        <Slider label="TPS" min={10} max={200} onChange={tps => api.setTPS(worldId, tps)} />
        <Button onClick={() => api.forceSnapshot(worldId)}>Force Snapshot</Button>
        <Button variant="danger" onClick={() => api.resetWorld(worldId)}>Reset World</Button>
      </ControlPanel>

      {/* Player List */}
      <PlayerList worldId={worldId} onKick={api.kickPlayer} onBan={api.banPlayer} />
    </div>
  );
}
```

#### AdminStore (Zustand)

- `components/front-end.md` Section 4 — AdminStore: lazy-loaded, admin-only, communicates with `/api/admin/*` REST endpoints.

The AdminStore is a Zustand store that manages all admin panel state and API calls. It is lazy-loaded and only initialized when an admin user navigates to admin routes:

```typescript
// client/src/stores/adminStore.ts
interface AdminStore {
  worlds: AdminWorldDetail[];
  metrics: WorldMetrics | null;
  isLoading: boolean;

  // World CRUD
  fetchWorlds: () => Promise<void>;                                  // GET /api/admin/worlds
  createWorld: (config: CreateWorldInput) => Promise<void>;          // POST /api/admin/worlds
  updateWorld: (id: string, config: Partial<WorldConfig>) => Promise<void>;
  deleteWorld: (id: string) => Promise<void>;

  // World lifecycle
  pauseWorld: (id: string) => Promise<void>;
  resumeWorld: (id: string) => Promise<void>;
  startWorld: (id: string) => Promise<void>;
  restartWorld: (id: string) => Promise<void>;
  resetWorld: (id: string) => Promise<void>;
  setTPS: (id: string, tps: number) => Promise<void>;

  // Snapshots
  forceSnapshot: (id: string) => Promise<void>;
  fetchSnapshots: (id: string) => Promise<SnapshotInfo[]>;
  restoreSnapshot: (id: string, snapshotId: string) => Promise<void>;

  // Player management
  kickPlayer: (worldId: string, playerId: string, reason?: string) => Promise<void>;
  banPlayer: (worldId: string, playerId: string, reason?: string, expiresAt?: string) => Promise<void>;
  unbanPlayer: (worldId: string, playerId: string) => Promise<void>;
  invitePlayer: (worldId: string, playerId: string) => Promise<void>;
  revokeInvite: (worldId: string, playerId: string) => Promise<void>;

  // Metrics
  fetchMetrics: (worldId?: string) => Promise<void>;
}
```

All methods use the admin JWT token for authentication. The store handles loading states and error reporting via `uiStore.showToast()`.

#### Admin API Client

The AdminStore internally uses fetch calls to the REST API. Alternatively, you can extract a separate `AdminAPI` utility class:

```typescript
class AdminAPI {
  private baseUrl: string;
  private token: string;

  async pauseWorld(worldId: string): Promise<void> {
    await fetch(`${this.baseUrl}/api/admin/worlds/${worldId}/pause`, {
      method: 'POST', headers: { Authorization: `Bearer ${this.token}` },
    });
  }
  // ... similar for resume, setTPS, reset, kick, ban, etc.
}
```

### Unit Tests

- Admin routes are only accessible with admin role (redirect to home otherwise).
- World controls call correct API endpoints.
- TPS slider sends valid range [10, 200].

### QA Checklist

- [ ] Admin routes require admin role JWT
- [ ] Pause/resume world works
- [ ] TPS slider changes simulation speed in real-time
- [ ] Force snapshot triggers immediately
- [ ] Kick/ban player removes them from world
- [ ] World reset clears all entities and re-seeds

---

## Step 12.5 — Statistics Dashboard

### What You're Implementing

Four-tab statistics dashboard accessible from the Dashboard "Stats" button. Provides population graphs, ecosystem metrics, organism performance analysis, and brain activity visualization. Data sourced from StatsStore (populated by periodic server broadcasts and Supabase queries).

### Design References

- `core-gameplay-systems.md` Section 7.3 (Statistics Dashboard) — Full spec for all four tabs and their chart types.
- `components/front-end.md` Section 4 — StatsStore.

### Implementation Details

```typescript
function StatsScreen() {
  const [tab, setTab] = useState<'population' | 'ecosystem' | 'performance' | 'brain'>('population');

  return (
    <div>
      <TabBar tabs={['Population', 'Ecosystem', 'Performance', 'Brain']} active={tab} onChange={setTab} />
      {tab === 'population' && <PopulationTab />}
      {tab === 'ecosystem' && <EcosystemTab />}
      {tab === 'performance' && <PerformanceTab />}
      {tab === 'brain' && <BrainTab />}
    </div>
  );
}
```

#### Population Tab

```typescript
function PopulationTab() {
  const popHistory = statsStore.populationHistory;    // time series
  const birthDeathRate = statsStore.birthDeathRates;  // dual time series
  const genHistogram = statsStore.generationHistogram; // { gen: count }
  const popByBiome = statsStore.populationByBiome;    // stacked area data

  return (
    <div>
      <LineChart title="Organism Count" data={popHistory} />
      <DualLineChart title="Birth / Death Rate" data={birthDeathRate} />
      <Histogram title="Generation Distribution" data={genHistogram} />
      <StackedAreaChart title="Population by Biome" data={popByBiome} />
    </div>
  );
}
```

#### Ecosystem Tab

```typescript
function EcosystemTab() {
  return (
    <div>
      <LineChart title="Your Biomass Share vs World Average" data={statsStore.biomassShare} />
      <LineChart title="Dominance Score Over Time" data={statsStore.dominanceHistory} />
      <PieChart title="Diet Distribution" data={statsStore.dietDistribution} />
      <BarChart title="Top 5 Species by Population" data={statsStore.topSpecies} />
    </div>
  );
}
```

#### Performance Tab

```typescript
function PerformanceTab() {
  return (
    <div>
      <StatRow label="Average Lifespan" value={statsStore.avgLifespan} />
      <PieChart title="Cause of Death" data={statsStore.deathCauses} />
      <LineChart title="Energy Efficiency (consumed / spent)" data={statsStore.energyEfficiency} />
      <StatRow label="Reproduction Rate" value={`${statsStore.reproSuccessRate}% hatch rate`} />
      <BarChart title="Most Active Brain Pathways" data={statsStore.topBrainPathways} />
    </div>
  );
}
```

#### Brain Analysis Tab

```typescript
function BrainAnalysisTab() {
  return (
    <div>
      <Heatmap title="Node Activity Heatmap" data={statsStore.nodeActivityHeatmap} />
      <PieChart title="Behavior Distribution" data={statsStore.behaviorDistribution}
        labels={['Eating', 'Moving', 'Fleeing', 'Attacking', 'Idle']} />
      <Section title="Decision Analysis">
        <StatRow label="Food encounter → eat" value={`${statsStore.foodEatRate}%`} />
        <StatRow label="Food encounter → ignore" value={`${100 - statsStore.foodEatRate}%`} />
        <StatRow label="Threat → flee" value={`${statsStore.threatFleeRate}%`} />
        <StatRow label="Threat → attack" value={`${statsStore.threatAttackRate}%`} />
      </Section>
    </div>
  );
}
```

### Unit Tests

- Population tab renders line chart with correct data points.
- Ecosystem tab pie chart segments sum to 100%.
- Performance tab shows cause-of-death breakdown matching entity data.
- Brain analysis heatmap renders all nodes with correct intensity values.
- Behavior distribution percentages sum to 100%.
- All chart components handle empty data gracefully.

### QA Checklist

- [ ] All four tabs render and display data
- [ ] Population chart updates as new data arrives
- [ ] Ecosystem tab correctly shows your species vs world metrics
- [ ] Performance tab cause-of-death breakdown matches actual deaths
- [ ] Brain analysis heatmap highlights most-fired nodes
- [ ] Charts are responsive on mobile
- [ ] Time-series charts allow scrolling/zooming on long histories

---

## Step 12.6 — Farewell Card / Share System

### What You're Implementing

Generate a shareable species "farewell card" image when a species goes extinct: rendered on Canvas 2D with species stats, organism rendering, performance summary. Shareable via clipboard or download.

### Design References

- `art.md` Section 9 (Farewell Card) — Card layout: organism render, species name, key stats (peak population, generations, survival time, cause of death), player name.
- `components/game-components.md` Section 13 (ShareCardRenderer) — `ShareCardRenderer` interface, rendering pipeline. **Note**: both `art.md` §15 and `game-components.md` specify 1080×1920 (story/portrait format). This plan uses 1200×630 for Open Graph social previews (Twitter, Discord embed cards). A future enhancement could add a secondary 1080×1920 export for Instagram/TikTok stories matching the `art.md` spec.
- `core-gameplay-systems.md` Section 3 (Death & Farewell) — Extinction notification with farewell stats.

### Implementation Details

```typescript
interface ShareCardRenderer {
  renderFarewellCard(species: ExtinctSpeciesData): Promise<HTMLCanvasElement>;
  downloadCard(canvas: HTMLCanvasElement, filename: string): void;
  copyToClipboard(canvas: HTMLCanvasElement): Promise<void>;
}

async function renderFarewellCard(species: ExtinctSpeciesData): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d')!;

  // Background gradient
  ctx.fillStyle = createGradient(ctx, species.biome);
  ctx.fillRect(0, 0, 1200, 630);

  // Organism render (large, centered-left)
  renderOrganismToCanvas(ctx, species.blueprint, { x: 200, y: 315, scale: 3 });

  // Species name (large text)
  ctx.font = 'bold 48px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(species.name, 450, 80);

  // Stats
  const stats = [
    { label: 'Peak Population', value: species.peakPopulation },
    { label: 'Generations', value: species.totalGenerations },
    { label: 'Survival Time', value: formatDuration(species.survivalHours) },
    { label: 'Total Kills', value: species.totalKills },
    { label: 'Cause', value: species.extinctionCause },
  ];
  stats.forEach((stat, i) => {
    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText(stat.label, 450, 140 + i * 50);
    ctx.font = 'bold 28px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(String(stat.value), 450, 168 + i * 50);
  });

  // Mini-achievements (top 1-3 notable traits)
  const achievements = detectMiniAchievements(species);
  achievements.slice(0, 3).forEach((ach, i) => {
    const y = 440 + i * 40;
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#ffcc00';
    ctx.fillText(`🏆 ${ach.label}`, 450, y);
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText(ach.description, 450, y + 16);
  });

  // Player name and branding
  ctx.font = '16px sans-serif';
  ctx.fillStyle = '#666666';
  ctx.fillText(`Created by ${species.playerName} • Life Game`, 450, 590);

  return canvas;
}
```

#### Mini-Achievement Detection

- `core-gameplay-systems.md` Section 7.6 (Mini-Achievements) — 15 achievement conditions scanned from species stats.

```typescript
interface MiniAchievement {
  label: string;
  description: string;
  priority: number; // higher = rarer/more impressive, shown first
}

function detectMiniAchievements(species: ExtinctSpeciesData): MiniAchievement[] {
  const achievements: MiniAchievement[] = [];

  if (species.hoursAtRank1 >= 1)
    achievements.push({ label: 'Apex Organism', description: `Ruled the leaderboard for ${species.hoursAtRank1}h`, priority: 10 });
  if (species.maxGeneration >= 100)
    achievements.push({ label: 'Dynasty', description: `Lineage survived ${species.maxGeneration} generations`, priority: 9 });
  if (species.peakPopulation >= 100)
    achievements.push({ label: 'Swarm Lord', description: `Peaked at ${species.peakPopulation} organisms`, priority: 8 });
  if (species.survivalDays >= 7)
    achievements.push({ label: 'Survivor', description: `Endured for ${species.survivalDays} days`, priority: 8 });
  if (species.totalKills >= 500)
    achievements.push({ label: 'Serial Killer', description: `Took down ${species.totalKills} prey`, priority: 7 });
  if (species.totalKills === 0 && species.survivalHours >= 24)
    achievements.push({ label: 'Pacifist', description: 'Never harmed another organism', priority: 7 });
  if (species.founderCount === 1 && species.peakPopulation >= 50)
    achievements.push({ label: 'Underdog', description: `From 1 founder to a population of ${species.peakPopulation}`, priority: 7 });
  if (species.maxTerritoryCoverage >= 0.4)
    achievements.push({ label: 'Colonizer', description: `Spread across ${(species.maxTerritoryCoverage * 100).toFixed(0)}% of the world`, priority: 6 });
  if (species.peakPopulation >= 50 && species.survivalHours < 12)
    achievements.push({ label: 'Flash in the Pan', description: 'Burned bright but brief', priority: 5 });
  if (species.wintersSurvived >= 3)
    achievements.push({ label: 'Winter Survivor', description: `Weathered ${species.wintersSurvived} winters`, priority: 5 });
  if (species.isSexual && species.maxGeneration >= 50)
    achievements.push({ label: 'Genetic Pioneer', description: `Evolved through ${species.maxGeneration} generations of crossover`, priority: 6 });
  if (species.usedEncounterSharing && species.avgPopulation >= 20)
    achievements.push({ label: 'Social Species', description: 'Thrived through cooperation', priority: 5 });
  if (species.hadNestBonus30)
    achievements.push({ label: 'Nest Builder', description: 'Built thriving nurseries', priority: 4 });
  if (species.primaryBiomePct >= 0.8)
    achievements.push({ label: 'Biome Specialist', description: `Mastered the ${species.primaryBiome}`, priority: 4 });
  if (species.biomesOccupied >= 4)
    achievements.push({ label: 'Nomad', description: 'Roamed every corner of the world', priority: 4 });

  // Sort by priority descending, return top 3
  return achievements.sort((a, b) => b.priority - a.priority).slice(0, 3);
}
```

#### Share Card Upload to Supabase Storage

- `architecture.md` Section 4.2 (Supabase Storage) — Share cards uploaded to the `share-cards` bucket for public URL sharing.
- `architecture.md` Section 6 (Edge Functions) — OG meta tag generation for rich link previews.

After rendering the farewell card canvas, upload the PNG to Supabase Storage to enable sharing via URL:

```typescript
async function uploadShareCard(canvas: HTMLCanvasElement, speciesId: string): Promise<string> {
  const blob = await new Promise<Blob>(resolve => canvas.toBlob(resolve!, 'image/png'));
  const path = `farewell/${speciesId}-${Date.now()}.png`;

  const { error } = await supabase.storage
    .from('share-cards')
    .upload(path, blob, { contentType: 'image/png' });
  if (error) throw error;

  const { data } = supabase.storage.from('share-cards').getPublicUrl(path);
  return data.publicUrl;
}
```

The returned public URL can be shared directly or used as the `og:image` URL for rich link previews.

#### Share Page OG Meta Tags (Edge Function)

A Supabase Edge Function provides dynamic `<meta>` tags for shared card URLs, enabling rich previews on social media (Twitter, Discord, iMessage, etc.):

```typescript
// supabase/functions/share-card/index.ts
import { serve } from 'https://deno.land/std/http/server.ts';

serve(async (req) => {
  const url = new URL(req.url);
  const speciesId = url.searchParams.get('id');

  // Fetch species data from database
  const { data: species } = await supabase
    .from('species_designs')
    .select('species_name, thumbnail_url, player:players(display_name)')
    .eq('id', speciesId)
    .single();

  if (!species) return new Response('Not found', { status: 404 });

  const imageUrl = species.thumbnail_url || `${SUPABASE_URL}/storage/v1/object/public/share-cards/farewell/${speciesId}.png`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta property="og:title" content="${species.species_name} — Life Game" />
  <meta property="og:description" content="Created by ${species.player.display_name}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta http-equiv="refresh" content="0;url=${CLIENT_URL}/#/species/${speciesId}" />
</head>
<body>Redirecting...</body>
</html>`;

  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
});
```

The Edge Function URL format is: `https://<project>.supabase.co/functions/v1/share-card?id=<speciesId>`. This URL is used as the "Share Link" in the extinction modal and copied to clipboard.

#### Extinction Modal

When a species goes extinct, show an `ExtinctionNotificationModal` with the farewell card preview, stats summary, and action buttons:

```typescript
function ExtinctionModal({ species }: { species: ExtinctSpeciesData }) {
  const [card, setCard] = useState<HTMLCanvasElement | null>(null);

  useEffect(() => {
    renderFarewellCard(species).then(setCard);
  }, [species]);

  return (
    <Modal>
      <h2>Your species went extinct</h2>
      {card && <canvas ref={el => el?.getContext('2d')?.drawImage(card, 0, 0)} />}
      <ButtonRow>
        <Button onClick={() => downloadCard(card!, `${species.name}-farewell.png`)}>
          Download Card
        </Button>
        <Button onClick={() => copyToClipboard(card!)}>Copy to Clipboard</Button>
        <Button onClick={async () => {
          const url = await uploadShareCard(card!, species.id);
          const shareUrl = `${EDGE_FUNCTION_URL}/share-card?id=${species.id}`;
          await navigator.clipboard.writeText(shareUrl);
          uiStore.showToast('Share link copied!');
        }}>Share Link</Button>
        <Button primary onClick={() => navigate('/design')}>Design New Species</Button>
      </ButtonRow>
    </Modal>
  );
}
```

### Unit Tests

- Farewell card renders at correct dimensions (1200x630).
- Stats are positioned correctly and readable.
- Organism rendering matches expected appearance for blueprint.
- Download creates a PNG blob with correct MIME type.
- Copy to clipboard works (navigator.clipboard.write).
- Mini-achievement detection: species with 500+ kills → "Serial Killer" detected.
- Mini-achievement detection: species with 0 kills and 24h+ survival → "Pacifist" detected.
- Mini-achievement priority: "Apex Predator" (priority 10) ranks above "Nest Builder" (priority 4).
- At most 3 mini-achievements are shown on the card.
- Card renders correctly with 0, 1, 2, or 3 mini-achievements.

### Integration Tests

- Full flow: species goes extinct → modal appears → download card → verify PNG is valid image.
- Full flow: species with notable stats → farewell card shows correct mini-achievements.

### QA Checklist

- [ ] Farewell card is visually appealing with organism render
- [ ] All key stats are displayed (peak population, survival, kills)
- [ ] Mini-achievements display correctly (1-3 notable traits with icons)
- [ ] Mini-achievements are selected by rarity/impressiveness priority
- [ ] Download produces a shareable PNG image
- [ ] Copy to clipboard works on supported browsers
- [ ] Extinction modal appears immediately when species goes extinct
- [ ] "Design New Species" button navigates to designer
- [ ] Share card PNG uploads to Supabase Storage successfully
- [ ] Share Link button copies OG-tagged URL to clipboard
- [ ] Shared URL shows rich preview on Twitter/Discord/iMessage (OG meta tags)

---

## Step 12.7 — Daily Mutation Screen

### What You're Implementing

The daily mutation selection screen (`/mutation`): shows 3 mutation options curated from recent offspring data, allows the player to pick one (or skip), and provides a browseable mutation pool with category filters. Route registered in Phase 8 as `DailyMutationScreen`.

### Design References

- `components/front-end.md` Section 2 — DailyMutationScreen component tree: `MutationCarousel` (phone) / `CardRow` (tablet), `MutationCard` ×3, `SelectButton` / `SkipButton`, `ViewMutationPoolSection`.
- `components/front-end.md` Section 4 — MutationStore: Zustand store managing daily options, selection state, and pool browsing.
- `core-gameplay-systems.md` Section 6 (Daily Mutations) — Mutation curation algorithm, 3-option presentation, skip mechanics.

### Implementation Details

#### MutationStore (Zustand)

```typescript
// client/src/stores/mutationStore.ts
interface MutationStore {
  todayOptions: MutationOption[] | null;     // 3 options for today (null if not loaded)
  selectedOption: number | null;             // index of selected option (0-2)
  hasSelected: boolean;                      // whether player has made today's choice
  mutationPool: MutationPoolEntry[];         // full pool for browsing

  poolFilters: {
    beneficial: boolean;
    neutral: boolean;
    harmful: boolean;
  };

  isLoading: boolean;

  // Methods
  fetchTodayOptions: () => Promise<void>;
  selectMutation: (index: number) => Promise<void>;
  skipMutation: () => Promise<void>;
  fetchMutationPool: () => Promise<void>;
  setPoolFilter: (filter: string, value: boolean) => void;
}
```

#### DailyMutationScreen

```typescript
function DailyMutationScreen() {
  const { todayOptions, hasSelected, isLoading } = mutationStore();

  useEffect(() => { mutationStore.getState().fetchTodayOptions(); }, []);

  if (isLoading) return <LoadingSpinner />;
  if (hasSelected) return <AlreadySelectedView />;
  if (!todayOptions) return <NoMutationsView />;

  return (
    <ScrollView>
      <Header title="Daily Mutation" subtitle="Choose one mutation to apply to your species" />

      {/* Phone: swipeable carousel. Tablet: horizontal card row */}
      <ResponsiveLayout
        phone={<MutationCarousel options={todayOptions} />}
        tablet={<CardRow options={todayOptions} />}
      />

      <SkipButton onClick={() => mutationStore.getState().skipMutation()} />

      <ViewMutationPoolSection />
    </ScrollView>
  );
}
```

#### MutationCarousel (Phone)

Swipeable horizontal carousel showing one MutationCard at a time:

```typescript
function MutationCarousel({ options }: { options: MutationOption[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div>
      <SwipeContainer onSwipe={dir => setActiveIndex(i => clamp(i + dir, 0, 2))}>
        <MutationCard option={options[activeIndex]} index={activeIndex} />
      </SwipeContainer>
      <CarouselDots count={3} active={activeIndex} />
    </div>
  );
}
```

#### MutationCard

Each card displays the full mutation details:

```typescript
function MutationCard({ option, index }: { option: MutationOption; index: number }) {
  return (
    <Card>
      <CardHeader>{option.mutationType}</CardHeader>  {/* e.g. "BODY GENE MUTATION" */}
      <GeneChange>
        {option.geneName}: {option.oldValue.toFixed(2)} → {option.newValue.toFixed(2)}
        ({option.changePercent > 0 ? '+' : ''}{option.changePercent.toFixed(1)}%)
      </GeneChange>
      <Description>{option.description}</Description>
      <StatRow label="Source" value={option.source} />        {/* e.g. "Gen 47 offspring survived 2.3x longer" */}
      <StatRow label="Frequency" value={`${option.frequency} similar mutations in 24h`} />
      <SelectButton onClick={() => mutationStore.getState().selectMutation(index)}>
        Select This Mutation
      </SelectButton>
    </Card>
  );
}
```

#### ViewMutationPoolSection

Expandable section showing the full mutation pool with category filters:

```typescript
function ViewMutationPoolSection() {
  const [expanded, setExpanded] = useState(false);
  const { mutationPool, poolFilters } = mutationStore();

  if (!expanded) return <Button onClick={() => setExpanded(true)}>View Mutation Pool</Button>;

  return (
    <Section title="Mutation Pool">
      <FilterChips>
        <Chip active={poolFilters.beneficial} onClick={() => toggleFilter('beneficial')}>Beneficial</Chip>
        <Chip active={poolFilters.neutral} onClick={() => toggleFilter('neutral')}>Neutral</Chip>
        <Chip active={poolFilters.harmful} onClick={() => toggleFilter('harmful')}>Harmful</Chip>
      </FilterChips>
      <PoolSummary pool={mutationPool} />  {/* "847 mutations across 312 births" */}
      <VirtualizedList items={filteredPool} renderItem={MutationPoolRow} />
    </Section>
  );
}
```

### Unit Tests

- MutationStore `fetchTodayOptions` populates 3 options.
- `selectMutation(1)` sets `selectedOption=1` and `hasSelected=true`.
- `skipMutation()` sets `hasSelected=true` with `selectedOption=null`.
- Pool filter toggles correctly filter by beneficial/neutral/harmful.
- MutationCard renders gene change with correct old/new values and percentage.
- MutationCarousel swipe left/right cycles through 3 cards.

### QA Checklist

- [ ] Daily mutation screen shows 3 mutation options
- [ ] Phone layout uses swipeable carousel with dots indicator
- [ ] Tablet layout shows all 3 cards in a horizontal row
- [ ] Each card shows mutation type, gene change, description, source, and frequency
- [ ] "Select This Mutation" applies the mutation and shows confirmation
- [ ] "Skip" button skips without applying a mutation
- [ ] Already-selected state shows what was chosen
- [ ] Mutation pool section expands with category filters
- [ ] Pool shows summary stats (total mutations, births)

---

## Step 12.8 — Event Log Screen

### What You're Implementing

The event log screen (`/events`): a virtualized, filterable list of world events with timestamps, category badges, and optional map-link buttons. Route registered in Phase 8 as `EventLogScreen`.

### Design References

- `components/front-end.md` Section 2 — EventLogScreen component tree: `FilterBar` (category toggles), `EventList` (virtualized).
- `components/front-end.md` Section 4 — EventStore: event history, category filtering.
- `core-gameplay-systems.md` Section 7 — Event types, event data format.

### Implementation Details

#### EventLogScreen

```typescript
function EventLogScreen() {
  const events = eventStore.filteredEvents;
  const [filters, setFilters] = useState<EventCategory[]>(['pop', 'combat', 'env', 'evo', 'achieve']);

  return (
    <div className="flex flex-col h-full">
      <FilterBar categories={filters} onToggle={toggleCategory} />
      <EventList events={events} />
    </div>
  );
}
```

#### FilterBar

Category toggle buttons for filtering displayed events:

```typescript
function FilterBar({ categories, onToggle }: FilterBarProps) {
  const allCategories: EventCategory[] = ['pop', 'combat', 'env', 'evo', 'achieve'];

  return (
    <div className="flex gap-2 p-2 border-b">
      {allCategories.map(cat => (
        <ToggleChip
          key={cat}
          active={categories.includes(cat)}
          onClick={() => onToggle(cat)}
          icon={EVENT_CATEGORY_ICONS[cat]}
        >
          {EVENT_CATEGORY_LABELS[cat]}  {/* Pop, Combat, Env, Evo, Achieve */}
        </ToggleChip>
      ))}
    </div>
  );
}
```

#### EventList (Virtualized)

Uses React Window (or similar virtualizer) for performant rendering of potentially thousands of events. Continuous append of new events via WebSocket:

```typescript
function EventList({ events }: { events: WorldEvent[] }) {
  return (
    <VirtualizedList
      items={events}
      itemHeight={56}
      renderItem={(event) => (
        <EventRow key={event.id}>
          <Timestamp>{formatRelativeTime(event.timestamp)}</Timestamp>  {/* "2m ago" */}
          <CategoryBadge category={event.category} />                   {/* [birth], [combat], etc. */}
          <EventDescription>{event.description}</EventDescription>
          {event.location && (
            <MapButton onClick={() => navigateToWorldPosition(event.location)} />
          )}
        </EventRow>
      )}
    />
  );
}
```

**Phone layout**: Compact rows with timestamp, badge, and description stacked.
**Tablet layout**: Table format with columns: Time | Category | Event | Map.

Event examples:
```
2m ago   [birth]    3 organisms hatched in Forest biome          [map]
8m ago   [combat]   Org #142 killed LurkFang #891              [map]
15m ago  [env]      Season changed to Autumn
22m ago  [evo]      Daily mutation applied: SpeedRatio +12.5%
35m ago  [pop]      Population milestone: 50 organisms!         [map]
1h ago   [achieve]  Achievement unlocked: "Diverse" (3 biomes)
```

### Unit Tests

- FilterBar toggles categories on/off correctly.
- EventList renders events in reverse chronological order.
- Filtering by "combat" only shows combat events.
- Relative timestamps: event 2 minutes ago shows "2m ago".
- Map button only appears for events with location data.
- VirtualizedList only renders visible rows (not all events).

### QA Checklist

- [ ] Event log shows all recent world events
- [ ] Filter bar toggles work (turning off "combat" hides combat events)
- [ ] Events load in reverse chronological order (newest first)
- [ ] Relative timestamps update correctly ("2m ago", "1h ago")
- [ ] Category badges are visually distinct with icons
- [ ] [map] button navigates to event location in world view
- [ ] Virtualized scrolling is smooth with 1000+ events
- [ ] New events appear at top as they arrive via WebSocket
- [ ] Phone: compact row layout. Tablet: table layout
