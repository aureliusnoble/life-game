# Front-End Design — Life Game

## 1. Technology Stack

| Concern | Library | Rationale |
|---------|---------|-----------|
| Rendering (World View) | **Pixi.js v8** via `@pixi/react` | GPU-accelerated 2D. Handles 500x500 world with thousands of sprites at 60fps. WebGL fallback to Canvas. LOD rendering from dot-level to full detail on single canvas. |
| Node Graph Editor (Brain Tab) | **Custom on Pixi.js canvas** | Touch-first node graph UX. Same Pixi canvas system as world map. Pinch-zoom/pan performance on mobile. |
| Charting (Stats Dashboard) | **Recharts** | React-native, composable. Line, Area, Bar, Pie all needed. Lightweight. |
| Gesture Handling | **@use-gesture/react** | Pinch-zoom, pan, drag. Works with touch and mouse. Integrates with Pixi. |
| State Management | **Zustand** | Minimal boilerplate. WebSocket-driven updates. Sliceable stores. |
| Routing | **React Router v6 (HashRouter)** | Hash-based for GitHub Pages compatibility. |
| Auth | **@supabase/supabase-js** | Direct Supabase Auth integration. |
| WebSocket | **Native WebSocket** + custom reconnect wrapper | No Socket.IO overhead. Binary protocol (ArrayBuffer). |
| CSS / Styling | **Tailwind CSS** | Utility-first for rapid mobile-responsive layout. |
| Animation | **Framer Motion** | Page transitions, card animations, bottom sheet spring physics. |
| Build | **Vite** | Fast dev server, optimized production builds. |

## 2. Routing Structure

```
/                              -> Redirect to /home or /login
/login                         -> LoginScreen
/home                          -> DashboardScreen
/design                        -> OrganismDesigner (tabs: body, brain, appearance)
/design/body                   -> BodyTab
/design/brain                  -> BrainTab
/design/appearance             -> AppearanceTab
/world                         -> WorldScreen (unified camera, LOD rendering, follow mode)
/stats                         -> StatsDashboard (tabs: population, ecosystem, performance, brain)
/leaderboard                   -> LeaderboardScreen
/mutation                      -> DailyMutationScreen
/events                        -> EventLogScreen
/species                       -> SpeciesDirectoryScreen
/species/:speciesId            -> SpeciesDetailScreen
/profile                       -> ProfileSettingsScreen
/onboarding                    -> OnboardingFlow (step wizard)
/signup                        -> SignupScreen
/forgot-password               -> ForgotPasswordScreen
/reset-password                -> ResetPasswordScreen (from email link, has recovery token)
/verify-email                  -> EmailVerificationScreen (from email link)

# Admin-only routes (gated by isAdmin check, lazy-loaded)
/admin                         -> AdminDashboardScreen
/admin/worlds                  -> AdminWorldListScreen
/admin/worlds/create           -> AdminCreateWorldScreen
/admin/worlds/:id              -> AdminWorldDetailScreen
/admin/worlds/:id/players      -> AdminPlayerManagementScreen
/admin/worlds/:id/metrics      -> AdminMetricsScreen
```

## 3. Responsive Breakpoints

| Breakpoint | Width | Layout |
|-----------|-------|--------|
| Phone | < 768px | Bottom tab bar, full-screen views, bottom sheets for panels |
| Tablet | >= 768px | Left sidebar nav, split panes, side panels |

Navigation:
- **Phone**: 5-item bottom tab bar (Home, Design, **World**, Stats, Me). The player's current world is shown by a persistent pill in the TopBar ("🌐 World Alpha ▾") — tapping it opens a modal World Picker for switching worlds. Admin link visible in Me screen (admins only).
- **Tablet**: Persistent left sidebar with all navigation items: Home, Design, World, Stats, Leaderboard, Species, Events, Me, Admin*. Content fills remaining width. World switching uses the TopBar pill, not a sidebar item.

## 4. State Management (Zustand Stores)

```typescript
// stores/authStore.ts
interface AuthStore {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isEmailVerified: boolean;                      // Derived from user.email_confirmed_at
  // Auth actions
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginMagicLink: (email: string) => Promise<void>;
  loginOAuth: (provider: 'google') => Promise<void>;
  logout: () => void;
  // Account management
  changePassword: (newPassword: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;       // Sends reset email
  deleteAccount: (confirmation: string) => Promise<void>; // Calls Edge Function
  resendVerificationEmail: () => Promise<void>;
}

// stores/speciesStore.ts
interface SpeciesStore {
  activeSpecies: SpeciesData | null;
  designDraft: OrganismDesign;
  updateBodyStat: (stat: string, value: number) => void;
  setBrainGraph: (graph: BrainGraph) => void;
  deploy: (config: DeployConfig) => Promise<void>;
  retire: () => Promise<void>;
  remainingBP: number;                      // computed
}

// stores/worldStore.ts
interface WorldStore {
  entities: Map<number, EntityState>;
  viewport: Viewport;
  cameraMode: 'free' | 'following';
  followTargetId: number | null;
  lodTier: 'dot' | 'sprite' | 'detail';  // derived from viewport width
  perceptionMode: boolean;                // organism's-eye fog-of-war view
  overlayMode: OverlayMode | null;
  worldMeta: WorldMeta;
  setViewport: (v: Viewport) => void;
  applyDelta: (delta: EntityDelta[]) => void;
  followEntity: (id: number) => void;     // enter follow mode, auto-zoom to Sprite tier
  detachCamera: () => void;               // exit follow mode, keep highlight ring
}

// stores/statsStore.ts
interface StatsStore {
  populationHistory: TimeSeriesData[];
  ecosystemData: EcosystemSnapshot;
  organismPerformance: PerformanceData;
  brainAnalysis: BrainAnalysisData;
  timeRange: TimeRange;
  fetchStats: (range: TimeRange) => Promise<void>;
}

// stores/eventStore.ts
interface EventStore {
  events: GameEvent[];
  filters: EventCategory[];
  whileYouWereAway: AwayReport | null;
  fetchEvents: (since: Date) => Promise<void>;
}

// stores/socketStore.ts
interface SocketStore {
  connectionState: 'connecting' | 'connected' | 'disconnected';
  connect: () => void;
  disconnect: () => void;
  sendViewport: (viewport: Viewport) => void;
  followEntity: (id: number | null) => void;
}

// stores/debugStore.ts
// Lazy-loaded, admin only. Manages debug panel state, WS subscriptions, and overlays.
// Full interface: see debug.md §B.2
interface DebugStore {
  isOpen: boolean;
  activeTab: DebugTab;
  isConnected: boolean;
  activeStreams: Set<DebugStreamType>;
  // Cached stream data (ring buffers)
  tickProfiles: TickProfile[];
  energySnapshots: EnergySnapshot[];
  spatialStats: SpatialStats | null;
  reproEvents: ReproEvent[];
  combatEvents: CombatEvent[];
  logEntries: DebugLogEntry[];
  // Entity inspector
  inspectedEntityId: number | null;
  inspectedEntity: FullEntityDetail | null;
  brainTrace: BrainTrace | null;
  energyLedger: EnergyLedgerEntry[];
  // World overlay toggles
  showSpatialGrid: boolean;
  showVisionCones: boolean;
  showVelocityVectors: boolean;
  showCollisionBoxes: boolean;
  showPheromoneOverlay: boolean;
  showEnergyHeatmap: boolean;
  showForceVectors: boolean;
  // Actions: toggle, setTab, subscribe/unsubscribe, inspectEntity, traceEntity, toggleOverlay
  // Manipulation: spawnOrganism, killEntity, teleportEntity, injectEnergy, editGenes, etc.
}

// stores/worldStore.ts
// Tracks world list, current world, world picker UI state, and retire-on-switch flow
interface WorldStore {
  worlds: WorldSummary[];               // From WORLD_LIST WebSocket message
  currentWorldId: string | null;        // Which world the player is currently in
  currentWorld: WorldDetail | null;     // Detailed state of current world
  connectionState: 'disconnected' | 'authenticated' | 'joined';
  isAdmin: boolean;                     // Cached from player profile
  isWorldPickerOpen: boolean;           // Whether the World Picker modal is showing
  isRetireWarningOpen: boolean;         // Whether the Retire Warning modal is showing
  pendingWorldId: string | null;        // World the player wants to switch to, pending confirmation
  fetchWorlds: () => void;              // Request WORLD_LIST via WebSocket
  switchWorld: (worldId: string, password?: string) => void; // Full retire→leave→join flow
  openWorldPicker: () => void;
  closeWorldPicker: () => void;
  confirmRetireAndSwitch: () => void;   // User confirmed retire — proceed with switch
  cancelSwitch: () => void;             // User cancelled — clear pending state
}

interface WorldSummary {
  id: string;
  name: string;
  accessType: 'public' | 'password' | 'invite';
  status: 'running' | 'paused' | 'stopped';
  playerCount: number;
  maxPlayers: number;
  season: number;
  description: string;
  mySpeciesName?: string;               // Player's active species name in this world (if any)
  mySpeciesPopulation?: number;         // Current population of player's species in this world
}

// stores/adminStore.ts
// Lazy-loaded, admin only. Communicates with /api/admin/* REST endpoints.
interface AdminStore {
  worlds: AdminWorldDetail[];
  metrics: WorldMetrics | null;
  isLoading: boolean;
  fetchWorlds: () => Promise<void>;                            // GET /api/admin/worlds
  createWorld: (config: CreateWorldInput) => Promise<void>;    // POST /api/admin/worlds
  updateWorld: (id: string, config: Partial<WorldConfig>) => Promise<void>;
  deleteWorld: (id: string) => Promise<void>;
  pauseWorld: (id: string) => Promise<void>;
  resumeWorld: (id: string) => Promise<void>;
  startWorld: (id: string) => Promise<void>;
  restartWorld: (id: string) => Promise<void>;
  resetWorld: (id: string) => Promise<void>;
  setTPS: (id: string, tps: number) => Promise<void>;
  forceSnapshot: (id: string) => Promise<void>;
  fetchSnapshots: (id: string) => Promise<SnapshotInfo[]>;
  restoreSnapshot: (id: string, snapshotId: string) => Promise<void>;
  kickPlayer: (worldId: string, playerId: string, reason?: string) => Promise<void>;
  banPlayer: (worldId: string, playerId: string, reason?: string, expiresAt?: string) => Promise<void>;
  unbanPlayer: (worldId: string, playerId: string) => Promise<void>;
  invitePlayer: (worldId: string, playerId: string) => Promise<void>;
  revokeInvite: (worldId: string, playerId: string) => Promise<void>;
  fetchMetrics: (worldId?: string) => Promise<void>;
}

// stores/progressStore.ts
// Tracks EP, unlock tiers, and achievement progress
interface ProgressStore {
  ep: number;                               // Current evolution points
  unlockedTier: 1 | 2 | 3 | 4;            // Current unlock tier
  achievements: Achievement[];              // All unlocked achievements
  pendingUnlocks: string[];                 // Features just unlocked (for notification)
  fetchProgress: () => Promise<void>;       // Load from Supabase on app open
  checkUnlocks: () => void;                 // Check if EP crosses tier threshold
  dismissUnlock: (id: string) => void;      // Clear pending unlock notification
}

interface Achievement {
  id: string;
  name: string;
  condition: string;
  epReward: number;
  unlockedAt: string;                       // ISO timestamp
}

// stores/mutationStore.ts
// Manages daily mutation selection and pool browsing
interface MutationStore {
  todayOptions: MutationOption[] | null;     // 3 options for today (null if not loaded)
  selectedOption: number | null;             // Index of selected option (0-2)
  hasSelected: boolean;                      // Whether player has made today's choice
  mutationPool: MutationPoolEntry[];         // Full pool for browsing
  poolFilters: {
    beneficial: boolean;
    neutral: boolean;
    harmful: boolean;
  };
  isLoading: boolean;
  fetchTodayOptions: () => Promise<void>;
  selectMutation: (index: number) => Promise<void>;
  skipMutation: () => Promise<void>;
  fetchMutationPool: () => Promise<void>;
  setPoolFilter: (filter: string, value: boolean) => void;
}

// stores/deployStore.ts
// Manages deployment configuration and execution
interface DeployStore {
  selectedBiome: 'grassland' | 'forest' | 'wetland' | 'desert' | 'rocky' | null;
  founderCount: number;                      // 1-10
  biomeCrowdingCost: number;                 // BP cost from biome crowding
  effectiveBP: number;                       // 100 - designBP - crowdingCost
  isDeploying: boolean;
  deployError: string | null;
  setSelectedBiome: (biome: string) => void;
  setFounderCount: (count: number) => void;
  calculateEffectiveBP: () => void;          // Recompute on biome/count change
  deploy: () => Promise<void>;               // Send DEPLOY_SPECIES via WebSocket
}

// stores/helpStore.ts
// Stack-based help panel management (supports nested help cards)
interface HelpStore {
  helpStack: Array<{ type: 'slider' | 'trait' | 'node' | 'synapse' | 'global'; id: string }>;
  isOpen: boolean;                           // Computed: helpStack.length > 0
  currentHelp: { type: string; id: string } | null;  // Top of stack
  pushHelp: (type: string, id: string) => void;
  popHelp: () => void;
  closeAll: () => void;
}

// stores/onboardingStore.ts
// Tracks all onboarding progress: quick start wizard, system introductions, tier unlock modals.
// Persisted to Supabase `players.onboarding_state` JSONB column with localStorage fallback.
// See design/onboarding.md for full specification.
interface OnboardingStore {
  quickStartCompleted: boolean;
  quickStartStep: 0 | 1 | 2 | 3 | 4;
  introductions: Record<string, {
    seen: boolean;
    completed: boolean;
    seenAt: string;                          // ISO timestamp
  }>;
  tierUnlocksSeen: Set<number>;              // Which tier unlock modals have been shown (2, 3, 4)
  // Actions
  advanceQuickStart: () => void;
  completeQuickStart: () => void;
  markIntroSeen: (id: string) => void;
  markIntroCompleted: (id: string) => void;
  markTierUnlockSeen: (tier: number) => void;
  resetOnboarding: () => void;               // Reset all state (from Profile Settings)
  // Queries
  shouldShowIntro: (id: string) => boolean;
  shouldShowTierUnlock: (tier: number) => boolean;
}

// stores/speciesSlotStore.ts
// Tracks player's active species slot lifecycle
interface SpeciesSlotStore {
  slotStatus: 'empty' | 'active' | 'ai_placeholder' | 'extinct_pending';
  activeSpeciesId: string | null;
  aiPlaceholderId: string | null;
  isExtinctionModalOpen: boolean;
  speciesSummary: {
    name: string;
    population: number;
    rank: number;
    entropyMultiplier: number;
  } | null;
  deployNewSpecies: () => void;              // Navigate to designer
  dismissExtinction: () => void;             // Close modal
  handleExtinctionEvent: (data: ExtinctionData) => void; // Called by WS handler
}

// utils/shareCardGenerator.ts
interface ShareCardGenerator {
  /** Render a farewell card for a species to an offscreen canvas. */
  generateCard: (species: SpeciesHistoryEntry) => Promise<HTMLCanvasElement>;
  /** Export canvas to PNG blob for sharing/download. */
  exportPNG: (canvas: HTMLCanvasElement) => Promise<Blob>;
  /** Share via Web Share API (native OS share sheet). */
  shareNative: (png: Blob, species: SpeciesHistoryEntry) => Promise<void>;
  /** Upload card to Supabase Storage and return public URL. */
  uploadAndGetLink: (png: Blob, speciesId: string) => Promise<string>;
  /** Detect applicable mini-achievements for a species. */
  detectMiniAchievements: (species: SpeciesHistoryEntry) => MiniAchievement[];
}
```

## 5. React Component Hierarchy

```
<App>
  <HashRouter>
    <AuthProvider>
      <SocketProvider>
        <Routes>
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/onboarding" element={<OnboardingFlow />}>
            <Route index element={<OnboardStep1_Concept />} />
            <Route path="body" element={<OnboardStep2_Body />} />
            <Route path="brain" element={<OnboardStep3_Brain />} />
            <Route path="deploy" element={<OnboardStep4_Deploy />} />
          </Route>
          <Route element={<AppShell />}>
            <Route path="/home" element={<DashboardScreen />} />
            <Route path="/design" element={<DesignerScreen />}>
              <Route path="body" element={<BodyTab />} />
              <Route path="brain" element={<BrainTab />} />
              <Route path="appearance" element={<AppearanceTab />} />
            </Route>
            {/* World switching handled by WorldPickerModal in TopBar */}
            <Route path="/world" element={<WorldScreen />} />
            <Route path="/stats" element={<StatsDashboard />} />
            <Route path="/leaderboard" element={<LeaderboardScreen />} />
            <Route path="/mutation" element={<DailyMutationScreen />} />
            <Route path="/events" element={<EventLogScreen />} />
            <Route path="/species" element={<SpeciesDirectoryScreen />} />
            <Route path="/species/:id" element={<SpeciesDetailScreen />} />
            <Route path="/profile" element={<ProfileSettingsScreen />} />
            {/* Admin routes — lazy-loaded, gated by isAdmin */}
            <Route path="/admin" element={<AdminGuard />}>
              <Route index element={<AdminDashboardScreen />} />
              <Route path="worlds" element={<AdminWorldListScreen />} />
              <Route path="worlds/create" element={<AdminCreateWorldScreen />} />
              <Route path="worlds/:id" element={<AdminWorldDetailScreen />} />
              <Route path="worlds/:id/players" element={<AdminPlayerManagementScreen />} />
              <Route path="worlds/:id/metrics" element={<AdminMetricsScreen />} />
            </Route>
          </Route>
        </Routes>
      </SocketProvider>
    </AuthProvider>
  </HashRouter>
</App>
```

**AppShell** adapts layout by breakpoint:
- Phone: `TopBar` + `<Outlet />` + `BottomTabBar`
- Tablet: `SidebarNav` + `ContentArea` containing `<Outlet />`

## 6. Component Tree Per Screen

```
AppShell
  PhoneLayout (< 768px)
    TopBar (screen title, WorldSelectorPill, notification bell)
    <Outlet />
    BottomTabBar
      TabItem (Home)
      TabItem (Design)
      TabItem (World)
      TabItem (Stats)
      TabItem (Profile)
  TabletLayout (>= 768px)
    SidebarNav
      NavItem (Home, Design, World, Stats, Leaderboard, Species, Events, Me, Admin*)
    ContentArea
      <Outlet />
  DebugOverlay (conditional: authStore.isAdmin && debugStore.isOpen, lazy-loaded)
    DebugPanel (see debug.md §B.3 for tab details)
    EntityInspector (conditional: inspectedEntityId !== null)

DashboardScreen
  WhileYouWereAwayCard (conditional)
  SpeciesStatusCard (name, pop, rank, entropy)
  QuickStatsGrid (biomass, territory, avg life, gen depth)
  QuickActions (View World, Daily Mutation, Design New)
  RecentEventsPreview (3 most recent)

DesignerScreen
  DesignerTabBar (Body | Brain | Appearance)
  BPBudgetBar (sticky)
  <DesignerTabOutlet />

BodyTab
  OrganismPreview (live-updating vector art)
  ArchetypeSelector (4 cards)
  StatSliderGroup (10 core sliders — includes Growth Speed)
  UnlockableTraitsSection (collapsible)
    TraitCard (per trait, with slider sub-controls for:
      Echolocation: 3 sliders (Range, Precision, Frequency)
      Camouflage: 1 slider (Camo Strength)
      Fat Reserves: tier selector + StoreFat output note
      Spore Dispersal: 1 slider (Spore Range)
      Nest Affinity: 1 slider (0-1.0)
      Immune Strength: 1 slider (0-1.0)
    )
  BPBudgetBar (sticky, shows remaining BP)

BrainTab
  BrainCanvas (Pixi.js, full-area)
    InputNodeColumn (left)
    OutputNodeColumn (right)
    HiddenNodes (draggable)
    Synapses (draggable weight handles)
  FloatingToolbar (add node, templates, undo/redo, BP cost)
  NodePaletteBottomSheet (phone) / Sidebar (tablet)
  NodePropertiesPanel (bias slider, activation selector, delete)
  SynapsePropertiesPopup (weight slider, enable toggle, delete)

AppearanceTab
  ColorPicker (RGB sliders)
  OrganismPreviewLarge
  DietEfficiencyGraph (next to Diet reference — two crossing lines: plant efficiency, meat efficiency)
  NameInput + DescriptionInput
  DeploySection (biome selector, founder count, effective BP, deploy button)
    BiomeCrowdingCostDisplay
    EffectiveBPDisplay

WorldScreen
  WorldCanvas (Pixi.js, LOD renderer — single canvas for all zoom levels)
  FloatingInfoBar (season, time, event) — always visible
  OverlayToggles (territory, density, pheromone, food, fungi) — always available
  CenterOnMeButton — always available
  FollowOverlay (conditional: visible when cameraMode === 'following' && lodTier >= 'sprite')
    StatusBars (HP, energy, fullness, age)
    NavigationControls (prev/next/random/detach)
    PerceptionToggle (Sprite+ tier — toggles organism's-eye fog-of-war view)
    XRayToggle (Detail tier only)
    DetailBottomSheet (swipeable, 4 tabs)
      BrainTab / BodyTab / StomachTab / EggsTab
  SidePanel (tablet: selected entity info, mini leaderboard)

StatsDashboard
  TabBar (Population | Ecosystem | Performance | Brain)
  TimeRangeSelector
  ChartCards (grid)

LeaderboardScreen
  TypeSelector + SeasonToggle
  LeaderboardList (rank, icon, name, designer, score)

DailyMutationScreen
  MutationCarousel (phone) / CardRow (tablet)
  MutationCard x3 (description, source, frequency, impact)
  SelectButton / SkipButton
  ViewMutationPoolSection (expandable)

EventLogScreen
  FilterBar (category toggles)
  EventList (virtualized)

SpeciesDirectoryScreen
  SearchBar + SortSelector
  SpeciesList

ExtinctionNotificationModal (overlay, triggered on extinction/retirement)
  OrganismPortrait (greyed/sunset tint)
  SummaryStats (duration, gen, peak pop)
  MiniAchievementList (1-3 auto-detected)
  ShareFarewellCardButton → opens FarewellCardModal
  ActionButtons (Design New, View History)

FarewellCardModal (full-screen preview)
  FarewellCardCanvas (offscreen render → displayed as image)
    GameLogo, OrganismPortrait, SpeciesName, LifetimeBar
    StatGrid, MiniAchievements, CauseOfEnd, Footer
  ShareActions (Share to..., Save Image, Copy Link)

ProfileSettingsScreen
  PlayerInfo + EP balance
  AchievementProgress
  UnlockTreeVisualization
  Settings (notifications, sound, theme, reset tutorial tips, logout)
  AccountSection (change password, delete account)
  ChangePasswordModal
  DeleteAccountModal

EmailVerificationBanner (shown on DashboardScreen when !isEmailVerified)
  BannerText ("Verify your email to enable password reset")
  ResendButton ("Resend")
  DismissButton ("×")

OnboardingFlow
  StepIndicator (4 steps, checkmarks for completed)
  Step1_Concept (welcome splash)
    OrganismShowcaseCanvas (real renderer: animated organisms eating/fleeing/hatching)
    WelcomeCopy ("Design an organism. Give it a brain. Watch it live.")
    LetsGoButton → Step 2
  Step2_Body (simplified body designer)
    OrganismPreview (live renderer, top 40%)
    ArchetypeSelector (horizontal scroll: Herbivore, Carnivore, Omnivore, Scavenger)
    SimplifiedSliderGroup (3 visible: Size, Speed, Diet)
    FineTuneAccordion (collapsed: STR, DEF, ViewAngle, ViewRadius, Metabolism, Stomach, GrowthSpeed)
    SimplifiedBPBar (no breakdown, just used/total)
    SkipToDeployLink → Step 4
  Step3_Brain (simplified brain editor)
    BrainCanvas (archetype template pre-applied)
    GuidedDragHighlight (pulsing arrow on missing connection)
    PostDragConfirmation (appears after successful first drag)
    UseTemplateButton (prominent, first-class option)
  Step4_Deploy (simplified deploy)
    AutoGeneratedNameField (editable)
    BiomeButtonRow (5 buttons, Grassland pre-selected, no crowding cost)
    ReleaseButton ("Release Into The World", large green)
  PostDeploySequence (auto-navigates to /world)
    CameraFollowController (auto-follow at Sprite tier)
    VisionConeOverlay (ON for 30s)
    FloatingCardSequence (5 timed cards, see onboarding.md §2.5)
    QuickStartOverlay (spotlight mask for guided highlights)

WorldSelectorPill (in TopBar, all screens)
  WorldIcon (globe)
  WorldName (truncated)
  DropdownChevron

WorldPickerModal (opened by WorldSelectorPill)
  ModalHeader ("Select World", close button)
  WorldList
    WorldPickerRow (per world)
      CurrentWorldCheckmark (conditional)
      WorldName
      PlayerCountBadge
      AccessIcon (🔒 locked / 🔓 unlocked if player has access grant)
      SeasonIndicator
      MySpeciesBadge (conditional: species name + pop)
  PasswordSubModal (conditional, skipped if player has existing access grant)
  AdminCreateWorldButton (conditional, admin only)

RetireWarningModal
  WarningTitle ("Retire Species?")
  WarningBody (species name, world names, irreversible note)
  CancelButton
  RetireAndSwitchButton

AdminGuard (redirects non-admins to /home)
  <Outlet />

AdminDashboardScreen (/admin)
  OverviewCards (total worlds, total players, system health)
  QuickActions (create world, view metrics)
  RecentActivityFeed

AdminWorldListScreen (/admin/worlds)
  WorldTable
    WorldRow (name, status, players, access, actions: start/pause/stop)
  CreateWorldButton

AdminCreateWorldScreen (/admin/worlds/create)
  WorldConfigForm
    NameInput
    DescriptionTextarea
    AccessTypeSelector (public / password / invite)
    PasswordInput (conditional)
    MaxPlayersSlider (1-100, default 30)
    WorldSizeSlider (100-2000, default 500)
    SimTPSSlider (10-200, default 40)
    CreateButton

AdminWorldDetailScreen (/admin/worlds/:id)
  TabBar (Config | Players | Invites | Dev Tools | Metrics)
  ConfigTab
    WorldConfigForm (edit mode)
    LifecycleButtons (start / pause / resume / restart / reset)
  PlayersTab (AdminPlayerManagementScreen)
    ConnectedPlayersList
      PlayerRow (name, species, joined time, kick button, ban button)
    BansList
      BanRow (player name, reason, expiry, unban button)
  InvitesTab (for invite-only worlds)
    InvitePlayerInput (search by name)
    InvitesList
      InviteRow (player name, status, revoke button)
  DevToolsTab
    TPSSlider (10-200, live update)
    SnapshotSection
      ForceSnapshotButton
      SnapshotList (tick, timestamp, entity counts, restore button)
    ResetWorldButton (with confirmation modal)
    DebugConsoleButton (opens DebugOverlay, see debug.md §B.1)
  MetricsTab (AdminMetricsScreen)
    RealTimeCharts
      TPSChart (line)
      TickTimeChart (line)
      EntityCountChart (stacked area)
      EnergyDistributionChart (pie)
      SpeciesBreakdownChart (bar)
      MemoryUsageChart (line)
```

### Help System Components

```
SliderHelpCard (inline, collapses on tap-away)
  StatLabel
  MechanicalEffect
  BPCostFormula
  StrategicTip

TraitInfoCard (inline, triggered by (i) icon)
  TraitDescription
  BPCost
  MechanicalEffects
  BalanceCounters
  UnlockRequirements

NodeInfoCard (inline, triggered by tapping brain node)
  NodeDescription
  ValueRange
  UsageExamples (1-2 example wirings)
  UnlockStatus

SynapseInfoCard (inline, triggered by tapping synapse)
  WeightDisplay
  DirectionIndicator
  ConnectedNodes
  ConnectionMeaning

GlobalHelpModal (full-screen, triggered by [?] button)
  TabBar: [Quick Help | Reference Guide]
  QuickHelpTab
    BPBudgetExplainer
    BrainProcessingOrder
    ActivationFunctionGuide
    InputOutputOverview
  ReferenceGuideTab
    GuideIndex
      SearchBar
      CategoryAccordionList (9 categories)
        CategoryAccordion
          GuideEntryRow (title, 1-line summary, category badge)
    GuidePage (shown when guide selected)
      GuideSummary
      GuideContent (how it works, key numbers, tips, examples)
      TryItLink (navigates to relevant screen)
      RelatedGuideLinks
```

### Onboarding Education Components

Components used across screens for contextual teaching. See [`onboarding.md`](../onboarding.md) for full specification.

```
InlineTeachCard (inline dismissable card, anchored near relevant UI element)
  CardHeader (bold title)
  CardBody (1-3 lines of explanation)
  LearnMoreLink (optional, opens GuidePage in GlobalHelpModal)
  DismissButton ("Got It")

EventTeachToast (auto-dismissing toast, top of screen)
  ToastHeader (bold event description)
  ToastBody (1-2 sentence teaching line)
  LearnMoreLink (optional)
  ProgressBar (auto-dismiss countdown)

UnlockEducationModal (full-screen celebratory modal for tier transitions)
  ConfettiAnimation
  TierHeader (tier number + "Unlocked!")
  FeatureList (new inputs, outputs, hidden nodes, traits)
  SuggestedExperiment (example wiring with explanation)
  WiringDiagram (annotated, uses BrainTab visual style)
  ActionButtons ("Got It", "Explore in Designer →", "Open Guide →")

QuickStartOverlay (semi-transparent overlay for onboarding steps)
  SpotlightMask (cutouts around highlighted elements)
  InstructionCard (floating near highlighted area)
  SkipButton ("Skip to Deploy →")
```

### Species Slot & Progression Components

```
SpeciesSlotStatus (in DashboardScreen, shows current slot state)
  ActiveSpeciesCard (when active)
  AIPlaceholderCard (when AI is filling slot)
  EmptySlotCard (when no species)
  DeployPromptButton

DietEfficiencyGraph (in AppearanceTab, next to Diet slider)
  PlantEfficiencyCurve (green line)
  MeatEfficiencyCurve (red line)
  CurrentDietMarker (vertical line at current diet value)

AchievementList (in ProfileSettingsScreen)
  AchievementCard (per achievement)
    AchievementIcon
    AchievementName
    Condition
    EPReward
    UnlockedTimestamp (or locked state)

DebugOverlay (lazy-loaded, admin only — see debug.md for full spec)
  DebugPanel
    DebugTabBar (Performance, Energy, Brain, Spatial, Ecology, Reproduction, Entities, Controls, Logs)
    PerformanceTab (FPS, TPS, per-system bar chart, rolling line chart, memory, bandwidth)
    EnergyTab (Sankey flow, conservation drift, transfer log, entity ledger)
    BrainTab (live node graph, synapse flow, decision trace, activation sparklines)
    SpatialTab (cell occupancy heatmap, vision cone, collision stats)
    EcologyTab (biome map, season, pheromone heatmaps, plant/meat density)
    ReproductionTab (birth/death feed, mutation log, population chart, lineage tree)
    EntitiesTab (searchable/sortable list, filters, bulk operations)
    ControlsTab (pause/step, spawn, manipulate, edit genes, trigger events, snapshots)
    LogsTab (log stream, domain/level filters, search, auto-scroll)
  EntityInspector (conditional: inspectedEntityId !== null)
    IdentitySection (ID, type, species, player)
    PositionSection (x, y, angle, velocity)
    StatsSection (energy, health, age)
    GenesSection (all gene values + derived stats)
    BrainSection (config, current inputs/outputs)
    LineageSection (parent chain, generation, mutations)
    EnergySection (recent ledger)
    StateSection (paused, current action, traits)
```

## 7. Environment Rendering

This section specifies how biomes, day/night, and seasons are rendered on the client. The server broadcasts environment state in an 8-byte header on every FULL_STATE/DELTA tick (see [`architecture.md` §4.1](../architecture.md)). The client uses this to drive all visual environment effects.

### 7.1 Render Layer Architecture

WorldCanvas uses a single Pixi.js layer stack for all zoom levels:

```
Layer stack (back to front):
─────────────────────────────────────────────────────────
 1. BiomeBackground        — Colored biome regions (texture)
 2. AmbientParticles       — Drifting microbes, bubbles, sediment
 3. PheromoneLayer         — Pheromone gradient clouds
 4. PelletLayer            — Plant/meat pellets
 5. FungiLayer             — Fungi patches with glow effects
 6. OrganismLayer          — All organisms (sprites)
 7. VisionConeLayer        — Follow mode only (Sprite+ tier): selected organism's FOV
 8. EcholocationLayer      — Follow mode only (Sprite+ tier): ping ring + grey silhouettes
 9. SoundWaveLayer         — Follow mode only (Sprite+ tier): directional arcs + ripples
10. PerceptionFogLayer     — Follow mode + Perception Mode: fog-of-war darkness
11. EntityLabelLayer       — Follow mode only (Detail tier): brain input labels
12. DayNightOverlay        — Full-viewport semi-transparent darkness
13. WeatherParticles       — Season-driven particle effects (above darkness)
14. DebugSpatialGridLayer  — 20×20 grid + cell occupancy heatmap (debug, admin only)
15. DebugVisionConeLayer   — Vision cones (all faint, inspected bright) (debug)
16. DebugVelocityLayer     — Velocity arrows on organisms (debug)
17. DebugForceLayer        — Movement/collision/knockback force arrows (debug)
18. DebugCollisionLayer    — Bounding radius circles (debug)
19. DebugPheromoneLayer    — 3-channel enhanced pheromone heatmaps (debug)
20. DebugEnergyHeatmapLayer — Per-cell energy density heatmap (debug)
21. UIOverlayLayer         — Info bar, overlays (HTML, not Pixi)
─────────────────────────────────────────────────────────
```

- Layers 1–11: **World-space** — move with camera (pan/zoom).
- Layers 12–13: **Screen-space** — fixed to viewport, cover entire view.
- Layers 14–20: **Debug overlays** — world-space, admin only, each toggled independently via `debugStore`. Low-alpha rendering. See [`debug.md`](../debug.md) §B.5.
- Layer 21: **HTML overlay** — React components positioned over the canvas.

Each layer is a Pixi.js `Container` child of the root `Stage`.

### 7.2 Biome Background Rendering

The server sends a `BIOME_MAP` message (2501 bytes) immediately after JOIN_OK, containing a 50×50 grid of `BiomeType` values. The client uses this to build the biome background texture.

```
BiomeBackgroundRenderer

Input:  biomeGrid (50×50 Uint8Array from server), current season/progress from env header
Output: Pixi.js Sprite with pre-rendered background texture

Algorithm:
  1. Receive BIOME_MAP: 50×50 grid, each cell = BiomeType enum (0-4)
  2. Build a 512×512 offscreen canvas (OffscreenCanvas or HTMLCanvasElement):
     a. For each grid cell (10.24px per cell at 512px), fill with biome base color
     b. Apply Gaussian blur (σ = 8px) to create soft gradient boundaries
     c. Apply seasonal tint: shift HSB per current season's visual modifiers
  3. Upload as Pixi.js Texture → create Sprite scaled to 500×500 world units
  4. On season transition (seasonProgress crosses threshold from env header):
     - Lerp biome colors from old season tint to new over ~30 seconds
     - Re-render texture at each lerp step (~1 re-render/sec during transition)

Biome base colors (RGB, from art.md):
  Grassland (0):  (45, 90, 50)     — mineral green, clear water
  Wetland   (1):  (32, 64, 80)     — deep blue-green, rich sediment
  Desert    (2):  (90, 64, 32)     — warm amber, volcanic mineral tint
  Forest    (3):  (29, 51, 32)     — dark green, murky, dense particles
  Rocky     (4):  (58, 53, 53)     — dark grey, cool, still

Seasonal tints applied to all biome colors (shared with server's SeasonModifiers):
  Spring:  Hue +8°,  Saturation ×1.15, Brightness ×1.05  (lush, vivid)
  Summer:  Hue +5°,  Saturation ×1.0,  Brightness ×1.1   (warm, bright)
  Autumn:  Hue -15°, Saturation ×0.85, Brightness ×0.95  (amber, muted)
  Winter:  Hue +10°, Saturation ×0.6,  Brightness ×0.8   (blue, dim)
```

**Biome boundary shifts**: When seasonal boundary shifts occur (e.g., wetland expands in spring), the server re-sends `BIOME_MAP` with the updated grid. Client re-runs the same rendering pipeline.

### 7.3 Day/Night Rendering

The `ambientLight` byte in the env header (0=midnight, 255=noon) drives a viewport-wide overlay.

```
DayNightOverlay

Implementation:
  - Pixi.js Graphics rectangle covering the entire viewport (screen-space, layer 9)
  - Blend mode: MULTIPLY (darkens underlying layers without washing out color)
  - Updated every frame from the latest env header's ambientLight value:

    const light = ambientLight / 255;          // 0.0 = midnight, 1.0 = noon
    const nightStrength = 1.0 - light;

    // Night tint: deep blue-purple, strongest at midnight
    overlay.tint = lerpColor(
      0xFFFFFF,                                // day: white (multiply identity)
      0x1a1a3a,                                // night: deep blue-purple
      nightStrength * 0.7                      // max 70% tint strength at midnight
    );
    overlay.alpha = nightStrength * 0.55;      // max 55% opacity at midnight

  Visual result:
    Noon (light=1.0):     Fully transparent — world at full brightness
    Dusk (light~0.5):     Subtle warm-blue tint, ~28% opacity
    Midnight (light=0.0): Deep blue-purple overlay, 55% opacity
    Dawn (light~0.5):     Same as dusk — sinusoidal, symmetric

  Transition is naturally smooth because ambientLight is sinusoidal from server.

Additional night effects:
  - Organism eyes: Additive glow sprite on eye highlights
    opacity = nightStrength * 0.3 (subtle at dusk, visible at midnight)
  - Bioluminescent fungi: Additive circle glow, radius = fungi size × 3
    Always rendered but only visible when DayNightOverlay darkens surroundings
  - Plant pellets: alpha *= (0.7 + 0.3 * light)  — slightly dim at night
  - Meat pellets: Unaffected (they glow faintly by nature)
```

### 7.4 Seasonal Visual Effects

Each season has distinct ambient and weather particle effects beyond the biome color tinting.

```
Spring:
  Biome tint: Greener, more saturated (see §7.2)
  Ambient particles: Rising bubbles (small, translucent green-white, slow upward drift)
  Weather particles: Gentle floating spores (sparse, very slow drift upward)
  Special: Wetland biome edges shimmer (subtle sine-wave distortion, 2px amplitude, 0.5Hz)

Summer:
  Biome tint: Warmer, slightly brighter
  Ambient particles: Heat shimmer specks (tiny, warm amber, faster random drift)
  Weather particles: None (clear, calm)
  Special: Desert biome has visible heat haze (screen-space vertical sine distortion,
           1px amplitude, applied as a post-process on the BiomeBackground in desert regions)

Autumn:
  Biome tint: Warmer reds/ambers, desaturated
  Ambient particles: Settling debris (amber/brown, slow downward drift)
  Weather particles: Sparse drifting detritus (larger 3-4px particles, slow tumbling fall)
  Special: Forest biome gets scattered bright-colored particle bursts every ~5 seconds
           ("falling leaves" metaphor — 3-5 particles, warm palette, gentle spiral down)

Winter:
  Biome tint: Blue-shifted, desaturated, darker
  Ambient particles: Slow crystalline drift (white-blue, 1-2px, very slow random motion)
  Weather particles: Sparse ice crystals (2-3px, bright white, gentle downward fall)
  Special: Wetland biome gets a glass-like sheen overlay (20% opacity white rectangle
           over frozen wetland cells, subtle refraction edge glow)
```

### 7.5 Ambient Particle System

Ambient particles give the world its "primordial soup viewed through a microscope" feel. Always present regardless of season.

```
AmbientParticleRenderer (Layer 2)

Uses Pixi.js ParticleContainer for batch rendering.

Base particle types (always present, world-space):
  ┌─────────────┬───────────┬──────────┬────────────────────────────────────────┐
  │ Type        │ Size      │ Alpha    │ Behavior                               │
  ├─────────────┼───────────┼──────────┼────────────────────────────────────────┤
  │ Microbe     │ 1-2px     │ 0.1-0.3  │ Slow Brownian drift (random walk).     │
  │ specks      │ circle    │          │ Biome-tinted at low saturation.        │
  ├─────────────┼───────────┼──────────┼────────────────────────────────────────┤
  │ Bubbles     │ 2-4px     │ 0.15-0.4 │ Slow upward drift + horizontal wobble. │
  │             │ circle    │          │ Bright edge highlight (rim light).     │
  ├─────────────┼───────────┼──────────┼────────────────────────────────────────┤
  │ Sediment    │ 1px       │ 0.2-0.5  │ Slow downward drift.                   │
  │             │ dot       │          │ Dark, biome-tinted.                    │
  └─────────────┴───────────┴──────────┴────────────────────────────────────────┘

Particle counts per biome (within viewport):
  ┌────────────┬─────────┬─────────┬──────────┐
  │ Biome      │ Specks  │ Bubbles │ Sediment │
  ├────────────┼─────────┼─────────┼──────────┤
  │ Grassland  │ 100     │ 15      │ 20       │
  │ Forest     │ 150     │ 20      │ 40       │
  │ Desert     │ 60      │ 0       │ 10       │
  │ Wetland    │ 120     │ 30      │ 35       │
  │ Rocky      │ 50      │ 5       │ 15       │
  └────────────┴─────────┴─────────┴──────────┘

Spawning strategy:
  - On viewport entry: seed full particle count immediately (random positions within viewport)
  - During pan: spawn new particles at leading edge, despawn at trailing edge
  - Biome-aware: particle type/color/count changes based on biome at each particle's position
    (uses the cached biome grid for fast lookup)

Performance budget:
  - Max 200 ambient particles + 100 weather particles = 300 total on screen
  - All particles are simple 1-4px sprites (no complex shaders)
  - ParticleContainer provides GPU-batched rendering
  - At 300 particles, draw call overhead is negligible vs. organism rendering
```

### 7.6 Weather Particle System

Weather particles are seasonal, rendered on Layer 10 (screen-space, above the DayNightOverlay so they're visible even at night).

```
WeatherParticleRenderer (Layer 10)

Particle definitions per season:
  Spring spores:   Count 30-50, size 2px, translucent green-white,
                   slow upward drift (0.3 px/frame), lifespan 3-5s
  Summer:          No weather particles (clear skies)
  Autumn detritus: Count 20-40, size 3-4px, amber/brown palette,
                   slow downward drift (0.5 px/frame) + tumble rotation, lifespan 4-6s
  Winter crystals: Count 30-60, size 2-3px, bright white/ice-blue,
                   gentle downward fall (0.4 px/frame) + slight horizontal sway, lifespan 5-8s

All weather particles spawn at random positions along the top (or sides for wind)
of the viewport and drift through. They are screen-space and unaffected by camera pan.
```

---

## 8. Screen Wireframes

### 8.1 Login

**Phone (~390x844)**
```
+------------------------------------------+
|                                          |
|            [  LIFE GAME LOGO  ]          |
|           ~ design. deploy. evolve ~     |
|                                          |
|  +--------------------------------------+|
|  |  Email                               ||
|  |  ____________________________________||
|  +--------------------------------------+|
|                                          |
|  +--------------------------------------+|
|  |  Password                            ||
|  |  ____________________________________||
|  +--------------------------------------+|
|                                          |
|  +--------------------------------------+|
|  |          [  LOG IN  ]                ||
|  +--------------------------------------+|
|                                          |
|  +--------------------------------------+|
|  |      [  Send Magic Link  ]          ||
|  +--------------------------------------+|
|                                          |
|       [ Forgot Password? ]              |
|                                          |
|  ─────────── or ───────────             |
|                                          |
|  +--------------------------------------+|
|  |  [G] Continue with Google            ||
|  +--------------------------------------+|
|                                          |
|        Don't have an account?            |
|           [ Sign Up ]                    |
|                                          |
+------------------------------------------+
```

**Tablet (~820x1180)** — same layout centered at 400px width, with Google OAuth button below divider.

### 8.2 Signup

**Phone (~390x844)**
```
+------------------------------------------+
|  [< Back]                                |
|                                          |
|            [  LIFE GAME LOGO  ]          |
|           ~ design. deploy. evolve ~     |
|                                          |
|  +--------------------------------------+|
|  |  Display Name                        ||
|  |  ____________________________________||
|  +--------------------------------------+|
|                                          |
|  +--------------------------------------+|
|  |  Email                               ||
|  |  ____________________________________||
|  +--------------------------------------+|
|                                          |
|  +--------------------------------------+|
|  |  Password                            ||
|  |  ____________________________________||
|  +--------------------------------------+|
|                                          |
|  +--------------------------------------+|
|  |  Confirm Password                    ||
|  |  ____________________________________||
|  +--------------------------------------+|
|                                          |
|  +--------------------------------------+|
|  |        [  CREATE ACCOUNT  ]          ||
|  +--------------------------------------+|
|                                          |
|  ─────────── or ───────────             |
|                                          |
|  +--------------------------------------+|
|  |  [G] Continue with Google            ||
|  +--------------------------------------+|
|                                          |
|      Already have an account?            |
|            [ Log In ]                    |
|                                          |
+------------------------------------------+
```

**Tablet** — same layout centered at 400px width.

### 8.3 Forgot Password

**Phone (~390x844)**
```
+------------------------------------------+
|  [< Back]                                |
|                                          |
|        Reset Your Password               |
|                                          |
|  Enter your email and we'll send you     |
|  a link to reset your password.          |
|                                          |
|  +--------------------------------------+|
|  |  Email                               ||
|  |  ____________________________________||
|  +--------------------------------------+|
|                                          |
|  +--------------------------------------+|
|  |      [  SEND RESET LINK  ]          ||
|  +--------------------------------------+|
|                                          |
|  (After send: "Check your email!        |
|   We sent a reset link to [email].")    |
|                                          |
+------------------------------------------+
```

### 8.4 Home / Dashboard

**Phone (~390x844)**
```
+------------------------------------------+
| Life Game  [🌐 World Alpha ▾]  [bell icon] |
|------------------------------------------|
| +--------------------------------------+ |
| | WHILE YOU WERE AWAY         [dismiss]| |
| | +12 births, -3 deaths               | |
| | Gen depth: 23 -> 31                 | |
| | Rank: #5 -> #3                      | |
| +--------------------------------------+ |
|                                          |
| +--------------------------------------+ |
| | [icon] Thornback Grazers             | |
| | Pop: 47  |  Rank: #3  |  Gen: 31    | |
| | Entropy: 1.4x  [========--] 3.2 days | |
| +--------------------------------------+ |
|                                          |
| +--------+ +--------+ +--------+        |
| |Biomass | |Territ. | |Avg Life|        |
| | 12.3%  | | 18.1%  | | 4.2min |        |
| +--------+ +--------+ +--------+        |
|                                          |
| +--------------------------------------+ |
| | [View World]  [Daily Mutation !]     | |
| | [Design New]                         | |
| +--------------------------------------+ |
|                                          |
| Recent Events:                           |
| > Organism #142 reached Gen 31          |
| > 3 organisms entered Forest biome     |
| > Season changed to Autumn             |
| [View All Events ->]                    |
|                                          |
|=====[ Home | Design | World | Stats | Me ]|
+------------------------------------------+
```

**Tablet (~820x1180)**
```
+--------------------------------------------------------------+
|        |                                                     |
| [Home] | Life Game Dashboard                    [bell icon]  |
| [Dsgn] |-----------------------------------------------------|
| [Wrld] | +-----------------------------------------------+   |
| [Stat] | | WHILE YOU WERE AWAY                 [dismiss] |   |
| [Lead] | | +12 births, -3 deaths | Gen: 23->31          |   |
| [Spec] | | Rank: #5 -> #3 | Biomass +4.2%               |   |
| [Evnt] | +-----------------------------------------------+   |
| [Prof] |                                                     |
|        | +-------------------------+ +---------------------+ |
|        | | [icon] Thornback Grazers| | Quick Stats         | |
|        | | Population: 47          | | Biomass:    12.3%   | |
|        | | Dominance Rank: #3      | | Territory:  18.1%   | |
|        | | Generation Depth: 31    | | Avg Life:   4.2 min | |
|        | | Entropy: 1.4x (3.2 day) | | Births/hr:  8.3     | |
|        | +-------------------------+ +---------------------+ |
|        |                                                     |
|        | +-------------------------+ +---------------------+ |
|        | | Quick Actions           | | Recent Events       | |
|        | | [View World]            | | > Gen 31 reached    | |
|        | | [Daily Mutation !]      | | > 3 entered Forest  | |
|        | | [Design New Organism]   | | > Season -> Autumn  | |
|        | +-------------------------+ | [View All ->]       | |
|        |                             +---------------------+ |
+--------------------------------------------------------------+
```

### 8.5 Body Designer

**Phone (~390x844)**
```
+------------------------------------------+
| < Design        Body Tab        [?] help |
|------------------------------------------|
| +--------------------------------------+ |
| |     [Live Organism Preview]          | |
| |     (vector art, 180px tall)         | |
| |     updates as sliders change        | |
| +--------------------------------------+ |
|                                          |
| BP: [=========---------] 67/100 remaining|
|                                          |
| Archetype:                               |
| [Herb.] [Carni.] [Omni.] [Scav.]       |
|  ^^^^                                    |
|                                          |
| --- Core Stats ---          BP Used: 33  |
|                                          |
| Size Ratio  (i) [====|====]  1.0  10 BP |
| Speed Ratio (i) [=====|===]  1.2  12 BP |
| Strength    (i) [==|======]  0.5   3 BP |
| Defense     (i) [==|======]  0.5   3 BP |
| Diet        (i) [|========]  0.0   free |
| View Angle  (i) [=====|===]  180   4 BP |
| View Radius (i) [=====|===]  5.0  10 BP |
| Metabolism  (i) [===|=====]  1.0   free |
| Stomach Mlt (i) [====|====]  1.0   6 BP |
|                                          |
| v Unlockable Traits (tap to expand)      |
| +--------------------------------------+ |
| | [locked] Armor Plating  (50 gen)     | |
| | [locked] Venom Glands   (100 kills)  | |
| | ...                                  | |
| | [unlock] Sexual Repro   10 BP       | |
| |   Reproduction: (Asexual) [Sexual]   | |
| |   Sex Ratio: [====|====] 50/50       | |
| |   (irreversible per deployment)      | |
| | [locked] Encounter Info  8 BP  T4    | |
| +--------------------------------------+ |
|                                          |
|=====[ Home | Design | World | Stats | Me ]|
+------------------------------------------+
```

**Tap (i) on any slider** → inline info card expands below:
```
+------------------------------------------+
| Speed Ratio                        [x]   |
|------------------------------------------|
| Controls movement force multiplier.       |
| Higher = faster but costs more energy.    |
|                                          |
| Formula: muscleMoveForce =              |
|   baseForce * sqrt(Size * SpeedRatio)   |
| BP cost: 10 * SpeedRatio                |
|                                          |
| Tip: Pair with low Size for an          |
| energy-efficient fast scout.             |
+------------------------------------------+
```
Tap [x] or tap away to collapse. Each slider, trait, and archetype has a similar info card. The [?] help button in the header opens a general guide covering BP budget, how stats interact, and common build strategies.

**Tablet (~820x1180)**
```
+--------------------------------------------------------------+
|        |  < Design    [Body] [Brain] [Appear.]    [?] help   |
|        |------------------------------------------------------|
| [Home] |  BP: [============---------] 67/100 remaining        |
| [Dsgn] |------------------------------------------------------|
| [Wrld] |                            |                         |
| [Stat] |  Archetype:                |  +-------------------+  |
| [Lead] |  [Herb] [Carn] [Omni]      |  |                   |  |
| [Spec] |  [Scav]                    |  |   LIVE ORGANISM    |  |
| [Evnt] |                            |  |    PREVIEW         |  |
| [Prof] |  --- Core Stats ---        |  |                   |  |
|        |                            |  |  (large vector     |  |
|        |  Size     [===|===] 1.0    |  |   art, rotatable)  |  |
|        |           10 BP            |  |                   |  |
|        |  Speed    [====|==] 1.2    |  |                   |  |
|        |           12 BP            |  |                   |  |
|        |  STR      [=|=====] 0.5    |  +-------------------+  |
|        |            3 BP            |                         |
|        |  DEF      [=|=====] 0.5    |  +-------------------+  |
|        |            3 BP            |  | Unlockable Traits  |  |
|        |  Diet     [|======] 0.0    |  | [lock] Armor  6BP  |  |
|        |           free             |  | [lock] Venom  8BP  |  |
|        |  ViewAng  [====|==] 180    |  | [lock] Echo  10BP  |  |
|        |            4 BP            |  | [  ] Sexual  10BP  |  |
|        |                            |  |  Ratio [==|==] 50% |  |
|        |                            |  | [lock] Encntr 8BP  |  |
|        |                            |  +-------------------+  |
|        |  ViewRad  [====|==] 5.0    |                         |
|        |           10 BP            |                         |
|        |  Metab    [==|====] 1.0    |                         |
|        |           free             |                         |
|        |  Stomach  [===|===] 1.0    |                         |
|        |            6 BP            |                         |
+--------------------------------------------------------------+
```

### 8.6 Brain Editor (Node Graph)

**Phone (~390x844)**
```
+------------------------------------------+
| < Design        Brain Tab               |
|------------------------------------------|
| BP: [=========---------] 67/100          |
|------------------------------------------|
|                                          |
| IN                              OUT      |
| +--+                           +--+      |
| |En| ----*                     |Ac|      |
| +--+     \   +--+         *---|ce|      |
| +--+      *->|H1|--*     /    +--+      |
| |Hl| ------->|SG|   \   /     +--+      |
| +--+         +--+    *-*----->|Ro|      |
| +--+                  |       +--+      |
| |Fl| --------*        |       +--+      |
| +--+          \       *---*-->|Ea|      |
| +--+           *----->|   |   +--+      |
| |PA| ----------------->   |   +--+      |
| +--+                      *-->|At|      |
| +--+                         +--+      |
| |PD|                         +--+      |
| +--+                         |Fl|      |
| +--+                         +--+      |
| |OA|                                    |
| +--+                                    |
| +--+                                    |
| |OD|                                    |
| +--+                                    |
| +--+                                    |
| |OS|                                    |
| +--+                                    |
|                                          |
|  +------+  +------+  +----+  +------+   |
|  |+Node |  |Templt|  |Undo|  |BP:3.5|   |
|  +------+  +------+  +----+  +------+   |
+------------------------------------------+
  ^^ floating toolbar; tapping +Node opens:
+------------------------------------------+
| Node Palette            [drag up/down]   |
|------------------------------------------|
| [SIG] Sigmoid    [LIN] Linear            |
| [TnH] TanH      [RLU] ReLU              |
| [LAT] Latch*    [MUL] Multiply*         |
| [GAU] Gaussian*  [DIF] Differential*    |
|                  * = locked (50 EP)      |
+------------------------------------------+
```

**Tablet (~820x1180)**
```
+--------------------------------------------------------------+
|        |  < Design    [Body] [Brain] [Appear.]               |
|        |------------------------------------------------------|
| [Home] |  BP: [=========---------] 67/100 remaining           |
| [Dsgn] |------------------------------------------------------|
| [Wrld] | +-------+                               +---------+  |
| [Stat] | | NODE  |                               |PROPERTIS|  |
| [Lead] | |PALETTE|  +--+                 +--+    |         |  |
| [Spec] | |       |  |En| ------*    *--->|Ac|   | Selected:|  |
| [Evnt] | | [SIG] |  +--+       \  /     +--+    | H1 (SIG) |  |
| [Prof] | |       |  +--+    +--+/       +--+    |          |  |
|        | | [LIN] |  |Hl| -->|H1|------->|Ro|   | Bias:    |  |
|        | |       |  +--+    |SG|  \     +--+    | [-==|==] |  |
|        | | [TnH] |  +--+    +--+   \   +--+    | +0.5     |  |
|        | |       |  |Fl| ---->|     *-->|Ea|   |          |  |
|        | | [RLU] |  +--+      \        +--+    | Activ.:  |  |
|        | |       |  +--+       *------->+--+    | [Sigmoid]|  |
|        | | [LAT] |  |PA| ------------->|At|   |          |  |
|        | |       |  +--+              +--+    | Inputs:3 |  |
|        | | [MUL] |  +--+              +--+    | Outputs:2|  |
|        | |       |  |PD|              |Fl|   |          |  |
|        | | [GAU] |  +--+              +--+    | [Delete] |  |
|        | |       |  +--+                      |         |  |
|        | | [DIF] |  |OA|                      +---------+  |
|        | |       |  +--+                                    |
|        | |-------|  +--+                                    |
|        | |TEMPLTS|  |OD|                                    |
|        | |[Grazr]|  +--+                                    |
|        | |[Huntr]|  +--+                                    |
|        | |[Scavg]|  |OS|                                    |
|        | |[Omniv]|  +--+   Brain: 1 hidden, 7 syn = 5.5 BP |
|        | +-------+                               [Undo][Redo]|
+--------------------------------------------------------------+
```

**Tap any node** (input, output, or hidden) → info card appears:
```
+------------------------------------------+
| NearestPlantAngle (Input, Tier 1)  [x]   |
|------------------------------------------|
| Range: [-1, 1]                           |
| Direction to nearest plant pellet.       |
| -1 = hard left, 0 = straight ahead,     |
| +1 = hard right.                         |
|                                          |
| Tip: Wire to Rotate with positive       |
| weight for smooth food-tracking.         |
| Example: PlantAngle --[+2.0]--> Rotate  |
+------------------------------------------+
```
Hidden nodes show their activation function formula and use cases. Locked nodes show what they do plus unlock requirements. **Tap any synapse** → shows weight, direction, and a plain-English description of what the connection does (e.g., "Energy → Sigmoid: activates when energy is high").

### 8.7 Appearance / Deploy

**Phone (~390x844)**
```
+------------------------------------------+
| < Design     Appearance Tab              |
|------------------------------------------|
| BP: [=========---------] 67/100          |
|------------------------------------------|
|                                          |
| +--------------------------------------+ |
| |                                      | |
| |     [Large Organism Preview]         | |
| |     (current stats + chosen color)   | |
| |     (rotates slowly)                 | |
| |                                      | |
| +--------------------------------------+ |
|                                          |
| Color:                                   |
| R [===============|===]  200             |
| G [========|==========]  120             |
| B [====|==============]   60             |
| Preview: [#C87840] ████████             |
|                                          |
| Species Name:                            |
| +--------------------------------------+ |
| | Thornback Grazers                    | |
| +--------------------------------------+ |
|                                          |
| Description (optional):                 |
| +--------------------------------------+ |
| | Armored herbivores that travel in    | |
| | herds                                | |
| +--------------------------------------+ |
|                                          |
| --- Deploy Configuration ---            |
|                                          |
| Spawn Biome: [Grassland      v]         |
|   Biome cost: 2 BP (20% occupied)       |
|   Grassland 2BP | Forest 0BP | Desert 0 |
|   Wetland  4BP  | Rocky  0BP | Random 0 |
|                                          |
| Founders: [==|========] 3               |
|   Effective BP: 88 per organism          |
|   (100 - 10 founders - 2 biome)         |
|                                          |
| +--------------------------------------+ |
| |        [  DEPLOY SPECIES  ]          | |
| +--------------------------------------+ |
|                                          |
|=====[ Home | Design | World | Stats | Me ]|
+------------------------------------------+
```

**Tablet (~820x1180)**
```
+--------------------------------------------------------------+
|        |  < Design    [Body] [Brain] [Appear.]               |
|        |------------------------------------------------------|
| [Home] |  BP: [=========---------] 67/100 remaining           |
| [Dsgn] |------------------------------------------------------|
| [Wrld] |  +-----------------------------+ +------------------+ |
| [Stat] |  |                             | | Color:           | |
| [Lead] |  |                             | | R [=======|==]   | |
| [Spec] |  |    LARGE ORGANISM           | | G [====|=====]   | |
| [Evnt] |  |     PREVIEW                 | | B [==|=======]   | |
| [Prof] |  |                             | | [#C87840] ████   | |
|        |  |  (vector art at full size)   | |                  | |
|        |  |  (slowly rotating)           | | Species Name:    | |
|        |  |                             | | [Thornback Graz.]| |
|        |  +-----------------------------+ |                  | |
|        |                                  | Description:     | |
|        |  +-----------------------------+ | [Armored herbivo]| |
|        |  | Deploy Configuration        | |                  | |
|        |  | Biome: [Grassland       v]  | | Biome cost: 2BP  | |
|        |  |  Grass 2 | Forest 0 | ...  | | (20% occupied)   | |
|        |  | Founders: [==|======] 3      | |                  | |
|        |  | Effective BP: 88/organism   | | Founders: 3      | |
|        |  |  (100 - 10 - 2 biome)      | | Eff. BP: 88      | |
|        |  | [       DEPLOY SPECIES      ]| |                  | |
|        |  +-----------------------------+ +------------------+ |
+--------------------------------------------------------------+
```

### 8.8 World View (Unified Camera)

The world view is a single screen with a continuous zoom range. Zoom level determines the LOD tier; follow mode is a camera state that adds overlay UI.

**Phone (~390x844) — Dot Tier (zoomed out, free-look)**
```
+------------------------------------------+
| Spring | Day | No Active Event           |
|==========================================|
|                                          |
|  g  g  g  f  f  f  f  d  d  d  d       |
|  g  g  f  f  f  f  d  d  d  d  d       |
|  g  g  f  *  f  .f  d  d  d  .d        |
|  g  g  g  f  f  f  d  d  d  d          |
|  g  g  g  g  f  f  f  r  r  r          |
|  w  w  g  g  .g  g  *f  r  r  r        |
|  w  w  w  g  g  g  r  r  r  r          |
|  w  w  w  w  .g  g  g  r  r  r         |
|  w  w  w  w  g  g  g  g  r  r          |
|  w  w  w  g  g  *g  g  g  .g  g        |
|                                          |
|  * = your organism (bright dot)          |
|  . = other organisms (muted dot)        |
|  g=grassland f=forest d=desert          |
|  w=wetland r=rocky                      |
|                                          |
|                            +---+         |
|                            |[T]| overlay |
| +---+                     |[D]| toggles  |
| |[C]| center              |[P]|         |
| +---+                     |[F]|         |
|                            |[G]|         |
|                            +---+         |
|=====[ Home | Design | World | Stats | Me ]|
+------------------------------------------+
```
- Tap any dot → enter follow mode, camera smooth-zooms in to Sprite tier
- Double-tap empty space → find and follow nearest own-species organism
- Overlay toggles available at all zoom levels

**Phone (~390x844) — Sprite Tier (following organism)**
```
+------------------------------------------+
| Spring | Day | Grassland    [Detach]     |
|==========================================|
| HP [============------] 82%              |
| En [==========---------] 64%             |
| Fl [=====-------------] 31%             |
| Age: 2.1 min  Gen: 31    [Perception]   |
|------------------------------------------|
|                                          |
|          .                               |
|        .   .    ...echo ring...          |
|       / [G] \    <- vision cone          |
|      /  *    \        [?] echo blip      |
|     / (You)   \     [G].food             |
|    /     ^     \                         |
|   /      |      \   ))) sound wave       |
|  /    heading    \   [B] ally            |
|          |                               |
|                                          |
|       [R].enemy                          |
|                                          |
|   < swipe L/R to cycle organisms >      |
|                            +---+         |
|                            |[T]| overlay |
| [< Prev] [Rnd] [Next>]    |[D]| toggles |
|                            +---+         |
|+----------------------------------------+|
|| Organism Detail       [drag up]        ||
|+----------------------------------------+|
+------------------------------------------+
```
- **[G]** = green ring (food), **[R]** = red ring (threat), **[B]** = blue ring (ally), **[?]** = echolocation blip (grey, outside vision cone)
- Vision cone + entity rings + echolocation ring + sound waves rendered at Sprite tier
- **[Perception]** toggles organism's-eye fog-of-war (fog darkens areas outside all senses)
- Drag/pan → camera detaches, follow overlays fade, pulse ring marks organism
- [Detach] button also exits follow mode

**Phone (~390x844) — Detail Tier (zoomed in close, following)**
```
+------------------------------------------+
| Spring | Day | Grassland    [Detach]     |
|==========================================|
| HP [============------] 82%              |
| En [==========---------] 64%             |
| Fl [=====-------------] 31%     [X-Ray] |
| Age: 2.1 min  Gen: 31    [Perception]   |
|------------------------------------------|
|                                          |
|          .                               |
|        .   .                             |
|       / [G] \    <- vision cone          |
|      /  *    \                           |
|     / (You)   \     [G].food             |
|    /     ^     \                         |
|   /      |      \                        |
|  /    heading    \   [B] ally            |
|          |                               |
|                                          |
|       [R].enemy                          |
|         "OrgDist:0.30"                   |
|                                          |
|   < swipe L/R to cycle organisms >      |
|                                          |
|+----------------------------------------+|
|| Organism Detail       [drag up]        ||
|+----------------------------------------+|
+------------------------------------------+
```
- Floating labels visible at Detail tier ("OrgDist:0.30")
- **[X-Ray]** button appears at Detail tier (own species only)
- Enhanced idle animations, cilia/flagella detail, internal glow

**Phone — X-Ray Mode** (Detail tier, tap [X-Ray] to toggle):
```
+------------------------------------------+
|                                          |
|         +------+                         |
|        /  BRAIN \   (cyan glow,          |
|       | (neurons |   synapses pulse)     |
|       |  pulse)  |                       |
|        \        /                        |
|    +----+------+----+                    |
|    |  STOMACH       |  <- green/red fill |
|    |  ████░░░░░░    |     (31% full)     |
|    |  acid: ████    |     (acid overlay) |
|    +---+--------+---+                    |
|        |  EGG   |      <- growing orb    |
|        | (62%)  |         (egg progress) |
|        +--------+                        |
|                                          |
+------------------------------------------+
```
Internals are rendered directly on the semi-transparent organism sprite. Stomach contents animate (shrinking as digested, energy particles flowing out). Brain synapses pulse with signal flow. Egg orb grows as `EggStored` increases.

**Phone — Detail Bottom Sheet** (swipe up, 4 tabs, available at Sprite+ tier):
```
+------------------------------------------+
| [Brain] [Body] [Stomach] [Eggs]          |
|==========================================|

  --- [Brain] tab ---
| INPUTS:           | OUTPUTS:             |
| Energy:    ██ 0.64| Accel:   ███ 0.72    |
| Health:   ███ 0.82| Rotate:    █-0.15    |
| Fullness:  █ 0.31 | Eat:       █ 0.23    |
| PlantAng: ██-0.40 | Attack:      0.08    |
| PlantDst: ██ 0.60 | Flee:        0.12    |
| OrgAng:  ███ 0.85 | Mate:        0.00    |
| OrgDst:   █ 0.30  |                      |
| OrgSize: ███ 0.70  |                      |
|                    |                      |
| [Show Full Graph]  <- opens scrollable   |
|  live node graph with synapse animations |
|------------------------------------------|

  --- [Body] tab ---
| HP:     82/100    Metabolism: 1.2x       |
| Energy: 64/100    Entropy:   1.4x        |
| Speed:  0.8/1.2   Ageing:   0.3         |
| Size:   1.0  STR: 0.5  DEF: 0.5         |
| Diet:   0.0 (herbivore)                  |
| Biome:  Grassland  Season: Spring        |
| Traits: [Herd Coordination]             |
|                                          |
| --- What It Detects ---                  |
| Nearest plant:  4.2u ahead-left          |
| Nearest meat:   none visible             |
| Nearest org:    2.1u right (larger)      |
| Nearest ally:   6.8u behind              |
| Nearest mate:   n/a (asexual)            |
|------------------------------------------|

  --- [Stomach] tab ---
| Capacity: [=====░░░░░░░░░] 31%          |
|   Plant: 4.2 u²  ████████░░             |
|   Meat:  0.0 u²                          |
|                                          |
| Acid Level:  [████████░░] 72%            |
| Digest Rate: 1.4 u²/s                   |
| Plant Eff:   55% | Meat Eff: 0%         |
| Energy Gain: +0.42 E/s                   |
|                                          |
| Stomach Ratio (brain sees): 1.0 (plant) |
|------------------------------------------|

  --- [Eggs] tab ---
| Egg Progress: [████████░░░] 62%          |
| Cost: 45E (growth:20 + traits:12 +      |
|             brain:8 + base:5)            |
| Est. time:   ~18s at current rate        |
|                                          |
| Reproduction: Asexual                    |
| Want2Reproduce output: 0.12 (below 0.5) |
|                                          |
| Nearby eggs: 2 (same species)            |
| Nest bonus: 20% (2 emitters)            |
+------------------------------------------+
```

**Tablet (~820x1180) — Dot Tier**
```
+--------------------------------------------------------------+
|        | Spring | Daytime | No Active Event                  |
|        |=========================================================|
| [Home] |                                   | World Info       |
| [Dsgn] |   g  g  g  f  f  f  d  d  d     | Season: Spring   |
| [Wrld] |   g  g  f  f  f  f  d  d  d     | Time: Day        |
| [Stat] |   g  g  f  *  f  f  d  d  d     | Event: None      |
| [Lead] |   g  g  g  f .f  f  d  d  d     |                  |
| [Spec] |   g  g  g  g  f  f  r  r  r     | Selected:        |
| [Evnt] |   w  w  g  g  g  g  r  r  r     | Organism #142    |
| [Prof] |   w  w  w  g  g  g  r  r  r     | Species: Thorns  |
|        |   w  w  w .g  g *g  r  r  r     | Pop: 47          |
|        |   w  w  w  g  g  g  g  r  r     | HP: 82%          |
|        |   w  w  g  g  g  g  g  g  g     | Energy: 64%      |
|        |                                   | Gen: 31          |
|        |                       +---+       |                  |
|        |                       |[T]|       | Mini Leaderboard |
|        |  +---+                |[D]|       | #1 SwiftClaw 23% |
|        |  |[C]|               |[P]|       | #2 MudForag  18% |
|        |  +---+                |[F]|       | #3 Thorns    12% |
|        |                       |[G]|       | #4 BonePickr  9% |
|        |                       +---+       | #5 FlockSpr   7% |
+--------------------------------------------------------------+
```

**Tablet (~820x1180) — Following at Sprite/Detail Tier**
```
+--------------------------------------------------------------+
|        | Spring | Day  #142  [Perception] [X-Ray] [Detach]  Grassland |
|        |=========================================================|
| [Home] | HP [==========----] 82%   | [Brain][Body][Stmch][Egg]|
| [Dsgn] | En [========------] 64%   |----------------------------
| [Wrld] | Fl [====----------] 31%   | INPUTS:     | OUTPUTS:   |
| [Stat] | Age: 2.1m  Gen: 31       | En   ██ .64 | Acc ███.72 |
| [Lead] |----------------------------| Hl  ███ .82 | Rot   █-.15|
| [Spec] |                           | Fl   █ .31  | Eat   █.23 |
| [Evnt] |       .                   | PA  ██-.40  | Atk    .08 |
| [Prof] |     .   .                 | PD  ██ .60  | Fle    .12 |
|        |    / *    \               | OA ███ .85  |            |
|        |   / (You)  \    [G]food  | OD   █ .30  |            |
|        |  /    ^     \            | OS ███ .70  |            |
|        | /     |      \           |             |            |
|        |/   heading    \          | [Show Full Graph]        |
|        |       |  [B]ally         |             |            |
|        |                          |----------------------------
|        |    [R]enemy              | What It Detects:          |
|        |      "OrgDist:0.30"     | Plant: 4.2u ahead-left   |
|        | [< Prev] [Random] [Next>]| Org:   2.1u right (lrg)  |
|        |                          | Ally:  6.8u behind       |
+--------------------------------------------------------------+
```
Tablet shows the detail panel always visible on the right side when following. Tab content fills the right column. X-ray mode overlays internals directly on the organism in the world view (left side). When not following, the right panel shows world info and mini leaderboard (Dot tier layout).

### 8.9 Statistics Dashboard

**Phone (~390x844)**
```
+------------------------------------------+
| Statistics  [🌐 World Alpha ▾]           |
|------------------------------------------|
| [Populatn] [Ecosystm] [Perform] [Brain] |
|                                          |
| Time: [1h] [6h] [24h] [7d] [All]       |
|                                          |
| +--------------------------------------+ |
| | Live Population                      | |
| |  50|     *  *                        | |
| |  40|   *  *  *  *                    | |
| |  30| *          *  *                 | |
| |  20|*              *                 | |
| |    +--+--+--+--+--+--+              | |
| +--------------------------------------+ |
|                                          |
| +--------------------------------------+ |
| | Birth / Death Rate                   | |
| |  births ---   deaths - - -          | |
| |  8|  ---     - - -                  | |
| |  4| ---  ---     - - -             | |
| |    +--+--+--+--+--+--+              | |
| +--------------------------------------+ |
|                                          |
| +--------------------------------------+ |
| | Generation Histogram                 | |
| |  ||||||||||||                        | |
| +--------------------------------------+ |
|                                          |
|=====[ Home | Design | World | Stats | Me ]|
+------------------------------------------+
```

**Tablet (~820x1180)**
```
+--------------------------------------------------------------+
|        | Statistics                                           |
|        |------------------------------------------------------|
| [Home] | [Population] [Ecosystem] [Performance] [Brain]      |
| [Dsgn] | Time: [1h] [6h] [24h] [7d] [All]                   |
| [Wrld] |------------------------------------------------------|
| [Stat] | +---------------------------+ +---------------------+ |
| [Lead] | | Live Population           | | Birth / Death Rate  | |
| [Spec] | |  50|     *  *             | |  births ---         | |
| [Evnt] | |  40|   *  *  *  *         | |  deaths - - -       | |
| [Prof] | |  30| *          *  *      | |  8|  ---     ---    | |
|        | |  20|*              *      | |  4| ---  ---    --- | |
|        | |    +--+--+--+--+--+--+    | |    +--+--+--+--+   | |
|        | +---------------------------+ +---------------------+ |
|        |                                                      |
|        | +---------------------------+ +---------------------+ |
|        | | Generation Histogram      | | Population by Biome | |
|        | |  ████████████             | | [stacked area chart]| |
|        | |  █████████                | |                     | |
|        | +---------------------------+ +---------------------+ |
+--------------------------------------------------------------+
```

### 8.10 Leaderboard

**Phone (~390x844)**
```
+------------------------------------------+
| Leaderboard                              |
|------------------------------------------|
| [Main Board v]        [Seasonal toggle]  |
|                                          |
| +--------------------------------------+ |
| |  #1  [icon] SwiftClaws     23.4%     | |
| |       by PlayerA                     | |
| +--------------------------------------+ |
| |  #2  [icon] MudForagers   18.1%     | |
| |       by PlayerB                     | |
| +--------------------------------------+ |
| |  #3  [icon] Thornbacks    12.3%     | |
| | >>>   by You              <<<       | |
| +--------------------------------------+ |
| |  #4  [icon] BonePickers    9.2%     | |
| |       by PlayerC (AI)               | |
| +--------------------------------------+ |
| |  #5  [icon] FlockSprites   7.8%     | |
| |       by PlayerD                     | |
| +--------------------------------------+ |
| |  #6  ...                             | |
|                                          |
|=====[ Home | Design | World | Stats | Me ]|
+------------------------------------------+
```

**Tablet (~820x1180)**
```
+--------------------------------------------------------------+
|        | Leaderboard                                         |
|        |------------------------------------------------------|
| [Home] | [Main] [Population] [Lineage] [Territory] [Kills]   |
| [Dsgn] |                                  [Seasonal toggle]  |
| [Wrld] |------------------------------------------------------|
| [Stat] | +-----------------------------------------------------+|
| [Lead] | |  #  | Species         | Designer  | Score | Pop   ||
| [Spec] | |-----|-----------------|-----------|-------|-------||
| [Evnt] | |  1  | SwiftClaws      | PlayerA   | 23.4% |  62   ||
| [Prof] | |  2  | MudForagers     | PlayerB   | 18.1% |  51   ||
|        | |  3  | Thornbacks      | You  <<<  | 12.3% |  47   ||
|        | |  4  | BonePickers     | AI        |  9.2% |  38   ||
|        | |  5  | FlockSprites    | PlayerD   |  7.8% |  44   ||
|        | | ... | ...             | ...       | ...   | ...   ||
|        | +-----------------------------------------------------+|
+--------------------------------------------------------------+
```

### 8.11 Daily Mutation

**Phone (~390x844)**
```
+------------------------------------------+
| Daily Mutation                           |
|------------------------------------------|
| Select one mutation (or skip):           |
|                                          |
| < swipe carousel >                       |
|                                          |
| +--------------------------------------+ |
| |  BODY GENE MUTATION                  | |
| |                                      | |
| |  SpeedRatio: 1.20 -> 1.35           | |
| |  (+12.5%)                            | |
| |                                      | |
| |  "Your organisms will be faster      | |
| |   but burn more energy"              | |
| |                                      | |
| |  Source: Gen 47 offspring survived   | |
| |  2.3x longer than average           | |
| |                                      | |
| |  Frequency: 12 similar in 24h       | |
| |  Trend: Speed increasing ^^^        | |
| |                                      | |
| |  [  SELECT THIS MUTATION  ]         | |
| +--------------------------------------+ |
|                                          |
|  o  (*)  o    <- carousel dots           |
|                                          |
| [  SKIP (keep natural evolution)  ]     |
|                                          |
| v View Mutation Pool                     |
| +--------------------------------------+ |
| | 847 mutations across 312 births      | |
| | Beneficial: 23%  Neutral: 61%       | |
| | Harmful: 16%                         | |
| | Most mutated: SpeedRatio (89x)       | |
| +--------------------------------------+ |
|                                          |
|=====[ Home | Design | World | Stats | Me ]|
+------------------------------------------+
```

**Tablet (~820x1180)**
```
+--------------------------------------------------------------+
|        | Daily Mutation                                      |
|        |------------------------------------------------------|
| [Home] | Select one mutation to apply (or skip):              |
| [Dsgn] |                                                      |
| [Wrld] | +------------------+ +----------------+ +----------+ |
| [Stat] | | BODY GENE        | | BRAIN          | | COMMON   | |
| [Lead] | |                  | |                | |          | |
| [Spec] | | SpeedRatio       | | OrgDist->Flee  | | DEF      | |
| [Evnt] | | 1.20 -> 1.35     | | 2.1 -> 2.8    | | 1.0->1.1 | |
| [Prof] | | (+12.5%)         | | (+33%)         | | (+10%)   | |
|        | |                  | |                | |          | |
|        | | "Faster but more | | "Flee response | | "Slight  | |
|        | |  energy burn"    | |  is stronger"  | |  armor   | |
|        | |                  | |                | |  boost"  | |
|        | | Gen 47, 2.3x avg | | Gen 52, reprod | | 31 times | |
|        | | 12 similar/24h   | | 8 similar/24h  | | in 24h   | |
|        | |                  | |                | |          | |
|        | | [SELECT]         | | [SELECT]       | | [SELECT] | |
|        | +------------------+ +----------------+ +----------+ |
|        |                                                      |
|        | [  SKIP (keep natural evolution)  ]                  |
|        |                                                      |
|        | v View Mutation Pool                                 |
|        | +--------------------------------------------------+ |
|        | | 847 mutations | 23% beneficial | Top: SpeedRatio | |
|        | +--------------------------------------------------+ |
+--------------------------------------------------------------+
```

### 8.12 Event Log

**Phone (~390x844)**
```
+------------------------------------------+
| Event Log                                |
|------------------------------------------|
| [Pop] [Combat] [Env] [Evo] [Achieve]    |
|  ^^^   ^^^^     ^^^   (active filters)   |
|------------------------------------------|
| 2m ago  [birth] 3 organisms hatched     |
|                  in Forest biome  [map]  |
|                                          |
| 8m ago  [combat] Org #142 killed Lurk   |
|                   Fang #891       [map]  |
|                                          |
| 15m ago [env] Season changed to Autumn  |
|                                          |
| 22m ago [evo] Daily mutation applied:   |
|               SpeedRatio +12.5%          |
|                                          |
| 35m ago [pop] Population milestone: 50  |
|               organisms!          [map]  |
|                                          |
| 1h ago  [combat] 5 organisms attacked   |
|                  by SwiftClaws    [map]  |
|                                          |
| 1h ago  [achieve] Achievement unlocked: |
|                   "Diverse" (3 biomes)   |
|                                          |
| (scroll for more...)                     |
|                                          |
|=====[ Home | Design | World | Stats | Me ]|
+------------------------------------------+
```

**Tablet (~820x1180)**
```
+--------------------------------------------------------------+
|        | Event Log                                           |
|        |------------------------------------------------------|
| [Home] | Filters: [Pop] [Combat] [Env] [Evo] [Achieve]      |
| [Dsgn] |------------------------------------------------------|
| [Wrld] | +----------------------------------------------------+|
| [Stat] | | Time   | Cat     | Event                    | Map ||
| [Lead] | |--------|---------|--------------------------|-----||
| [Spec] | | 2m     | Birth   | 3 organisms hatched      | [>] ||
| [Evnt] | | 8m     | Combat  | #142 killed LurkFang#891 | [>] ||
| [Prof] | | 15m    | Environ | Season -> Autumn         |     ||
|        | | 22m    | Evolve  | Mutation: Speed +12.5%   |     ||
|        | | 35m    | Pop     | Milestone: 50 organisms  | [>] ||
|        | | 1h     | Combat  | 5 attacked by SwiftClaws | [>] ||
|        | | 1h     | Achieve | "Diverse" unlocked       |     ||
|        | | ...    | ...     | ...                      | ... ||
|        | +----------------------------------------------------+|
+--------------------------------------------------------------+
```

### 8.13 Extinction / Retirement Notification

When a player's species goes extinct or is retired, a full-screen modal appears over the current view:

**Phone (~390x844)**
```
+------------------------------------------+
|                                          |
|          ~ Your species ~                |
|       RAZORSCALES                        |
|     has gone extinct.                    |
|                                          |
|     +------------------+                 |
|     |  [Organism Art]  |                 |
|     |  (faded, grey    |                 |
|     |   tint overlay)  |                 |
|     +------------------+                 |
|                                          |
|  Lasted 5.2 days | Gen 84 | Peak pop 71 |
|                                          |
|  Top cause: Starvation (62%)             |
|                                          |
|  [*] Serial Killer — 892 kills           |
|  [*] Dynasty — 84 generations            |
|                                          |
|  +------------------------------------+  |
|  |        [Share Farewell Card]       |  |
|  +------------------------------------+  |
|                                          |
|  [Design New Species]  [View History]   |
|                                          |
|  An AI species will keep your slot warm. |
+------------------------------------------+
```
- **[Share Farewell Card]**: Opens the farewell card preview modal (see Section 7.13 detail view). The card is pre-generated at the moment of extinction/retirement.
- **[Design New Species]**: Navigates to the Body Designer with a fresh design.
- **[View History]**: Navigates to the Species History tab with this species expanded.
- For retirement: title reads "You retired RAZORSCALES" and the grey tint is replaced with a warmer "sunset" overlay. No cause-of-death shown (replaced with "Retired after {duration}").

### 8.14 Species Directory

**Phone (~390x844)**
```
+------------------------------------------+
| Species Directory                        |
|------------------------------------------|
| [Search...               ] [Filter v]   |
| Filter: [All Players v]  Sort: [Recent] |
|------------------------------------------|
| +--------------------------------------+ |
| | [icon] RazorScales     EXTINCT       | |
| |  by PlayerC   Ran: 5.2 days         | |
| |  Peak pop: 71  Peak score: 28%      | |
| |  Gen: 84  Cause: Starvation (62%)   | |
| +--------------------------------------+ |
| | [icon] ThornGrazers    RETIRED       | |
| |  by You        Ran: 3.1 days        | |
| |  Peak pop: 45  Peak score: 15%      | |
| |  Gen: 52  Retired by player          | |
| +--------------------------------------+ |
| | [icon] NightStalkers   EXTINCT       | |
| |  by PlayerA    Ran: 1.8 days        | |
| |  Peak pop: 33  Peak score: 11%      | |
| |  Gen: 28  Cause: Predation (71%)    | |
| +--------------------------------------+ |
| | ...                                  | |
|                                          |
|=====[ Home | Design | World | Stats | Me ]|
+------------------------------------------+
```
Tap any species → expanded detail view:
```
+------------------------------------------+
| < Back          RazorScales              |
|------------------------------------------|
| by PlayerC        EXTINCT                |
| Deployed: Jan 14  Extinct: Jan 19       |
| Duration: 5.2 days                      |
|------------------------------------------|
| --- Peak Performance ---                |
| Peak Population:   71 organisms          |
| Peak Dominance:    28%                   |
| Deepest Generation: 84                   |
| Max Territory:     34% of world          |
| Peak Biomass:      22%                   |
|                                          |
| --- Lifetime Totals ---                 |
| Born: 1,247   Deaths: 1,247             |
| Kills dealt: 892  Kills received: 614   |
| Daily mutations applied: 4              |
|                                          |
| --- Cause of Extinction ---             |
| Starvation:  62%  |████████████░░░░░|   |
| Predation:   24%  |████░░░░░░░░░░░░░|   |
| Ageing:      11%  |██░░░░░░░░░░░░░░░|   |
| Other:        3%  |░░░░░░░░░░░░░░░░░|   |
|                                          |
| --- Design ---                          |
| Size: 1.4  Speed: 1.8  STR: 2.0        |
| DEF: 0.3   Diet: 0.85 (carnivore)      |
| Traits: Venom, Camouflage               |
| Reproduction: Sexual (10 BP)            |
| Brain: 14 synapses, 4 hidden  [View Brain]|
|                                          |
| [View Population Graph]  [Share Card]   |
+------------------------------------------+
```
Note: Tapping **[View Brain]** opens a read-only brain node graph viewer showing all nodes, synapses, connections, and weights.

**Tap [Share Card]** → farewell card preview modal:
```
+------------------------------------------+
| Species Farewell Card          [x close] |
|------------------------------------------|
| +--------------------------------------+ |
| |        [Game Logo]                   | |
| |        ~ In Memoriam ~               | |
| |                                      | |
| |     +------------------+             | |
| |     |                  |             | |
| |     |  [Organism Art]  |             | |
| |     |  (procedural     |             | |
| |     |   portrait)      |             | |
| |     +------------------+             | |
| |                                      | |
| |     R A Z O R S C A L E S           | |
| |     by PlayerC — Carnivore / Tank    | |
| |                                      | |
| |  Jan 14 ——[====5.2 days====]—— Jan 19|
| |                                      | |
| |  Peak Pop    Gen Depth   Rank        | |
| |    71          84         #2         | |
| |  Born      Kills Dealt   Duration    | |
| |   1,247       892        5.2 days    | |
| |                                      | |
| |  [*] Serial Killer                   | |
| |      Took down 892 prey              | |
| |  [*] Dynasty                         | |
| |      Lineage survived 84 generations | |
| |  [*] Biome Specialist                | |
| |      Mastered the Desert             | |
| |                                      | |
| |  Went Extinct — Starved Out (62%)    | |
| |                                      | |
| |  Life Game — World Alpha — Jan 2026  | |
| +--------------------------------------+ |
|                                          |
| [Share to...] [Save Image] [Copy Link]  |
+------------------------------------------+
```
- **[Share to...]**: Opens OS share sheet (Web Share API with PNG file). Works with WhatsApp, iMessage, Instagram Stories, etc.
- **[Save Image]**: Downloads the card as PNG to device.
- **[Copy Link]**: Copies a public share URL (`/share/{speciesId}`) with Open Graph meta tags for rich link previews.

**Tablet (~820x1180)**
```
+--------------------------------------------------------------+
|        | Species Directory                                   |
|        |------------------------------------------------------|
| [Home] | [Search...                    ] Sort: [Recent v]     |
| [Dsgn] | Filter: [All Players v]                              |
| [Wrld] |------------------------------------------------------|
| [Stat] | +----------------------------------------------------+|
| [Lead] | | Icon | Species      | Designer  | Duration | Peak ||
| [Spec] | |      |              |           |          | Pop  ||
| [Evnt] | |------|--------------|-----------|----------|------||
| [Prof] | | [ic] | RazorScales  | PlayerC   | 5.2 days |  71  ||
|        | | [ic] | ThornGrazers | You       | 3.1 days |  45  ||
|        | | [ic] | NightStalkers| PlayerA   | 1.8 days |  33  ||
|        | | ...  | ...          | ...       | ...      | ...  ||
|        | +----------------------------------------------------+|
+--------------------------------------------------------------+
```
Additional columns visible on wider tablets: Peak Score | Gen | Status.

### 8.15 Profile / Settings

**Phone (~390x844)**
```
+------------------------------------------+
| Profile                                  |
|------------------------------------------|
|                                          |
| [avatar]  PlayerName                     |
|           EP: 165 / 200 (Tier 3)         |
|           [=========-------]             |
|                                          |
| --- Achievements ---                     |
| [x] First Steps       10 EP             |
| [x] Survivor          10 EP             |
| [x] First Blood       15 EP             |
| [ ] The Long Game  12/50 gen  50 EP     |
| [ ] Apex Predator  0/1 hr    50 EP      |
| [ ] Pack Leader    47/30     20 EP      |
|                                          |
| --- Unlock Tree ---                      |
| T1 [=====complete=====]                 |
| T2 [=====complete=====]  50 EP          |
| T3 [=========---------] 165/200 EP      |
|    Brain: GAU DIF ABS                    |
|    Body: Burrow Camo Fat Spore Herd     |
| T4 [------------------] 500 EP          |
|    Brain: SIN INT INH                    |
|    Body: (future)                        |
|                                          |
| --- Settings ---                         |
| Notifications  [ON / off]               |
| Sound          [on / OFF]               |
| Theme          [Light / Dark]           |
| Reset Tutorial Tips       [Reset]       |
|                                          |
| --- Account ---                          |
| Change Password       [Change]          |
| Delete Account        [Delete]          |
|                                          |
| [  LOG OUT  ]                            |
|                                          |
|=====[ Home | Design | World | Stats | Me ]|
+------------------------------------------+
```

**Tablet (~820x1180)**
```
+--------------------------------------------------------------+
|        | Profile & Settings                                  |
|        |------------------------------------------------------|
| [Home] |                                                      |
| [Dsgn] | +-------------------------+ +---------------------+  |
| [Wrld] | | [avatar]  PlayerName    | | Unlock Tree         |  |
| [Stat] | | EP: 165 / 200 (Tier 3)  | | T1 [===complete===] |  |
| [Lead] | | [=========-------]      | | T2 [===complete===] |  |
| [Spec] | |                         | | T3 [======---] 165  |  |
| [Evnt] | | Achievements:           | |    GAU DIF ABS      |  |
| [Prof] | | [x] First Steps   10EP  | |    Burrow Camo Fat  |  |
|        | | [x] Survivor      10EP  | | T4 [--------] 500   |  |
|        | | [x] First Blood   15EP  | |    SIN INT INH      |  |
|        | | [ ] The Long Game 12/50 | |                     |  |
|        | | [ ] Apex Predator  0/1  | +---------------------+  |
|        | | [ ] Pack Leader   47/30 | | Settings             |  |
|        | +-------------------------+ | Notifs  [ON / off]   |  |
|        |                             | Sound   [on / OFF]   |  |
|        |                             | Theme   [Light/Dark] |  |
|        |                             | Reset Tips  [Reset]  |  |
|        |                             |                      |  |
|        |                             | Account              |  |
|        |                             | Password  [Change]   |  |
|        |                             | Delete    [Delete]   |  |
|        |                             | [  LOG OUT  ]       |  |
|        |                             +---------------------+  |
+--------------------------------------------------------------+
```

**ChangePasswordModal** (triggered by [Change] button):
```
+--------------------------------------+
|        Change Password               |
|--------------------------------------|
|  Current Password                    |
|  ____________________________________|
|                                      |
|  New Password                        |
|  ____________________________________|
|                                      |
|  Confirm New Password                |
|  ____________________________________|
|                                      |
|  [ Cancel ]        [ Save ]         |
+--------------------------------------+
```

**DeleteAccountModal** (triggered by [Delete] button):
```
+--------------------------------------+
|        Delete Account                |
|--------------------------------------|
|  This will permanently delete your   |
|  account, all species designs, and   |
|  remove your organisms from all      |
|  worlds. This cannot be undone.      |
|                                      |
|  Type "DELETE" to confirm:           |
|  ____________________________________|
|                                      |
|  [ Cancel ]  [ Delete Account ]     |
+--------------------------------------+
```

### 8.16 Onboarding Flow

Full onboarding specification in [`onboarding.md`](../onboarding.md). Wireframes below show the refined 4-step flow.

**Phone (~390x844) -- Step 1 of 4 (Welcome Splash)**
```
+------------------------------------------+
|                                          |
|  +--------------------------------------+|
|  |                                      ||
|  | [Live canvas: animated organisms     ||
|  |  eating, fleeing, hatching. Real     ||
|  |  renderer with particle trails]      ||
|  |                                      ||
|  +--------------------------------------+|
|                                          |
|  Design an organism.                     |
|  Give it a brain.                        |
|  Watch it live.                          |
|                                          |
|  *  o  o  o                              |
|                                          |
|  [          LET'S BUILD              ]   |
|                                          |
+------------------------------------------+
```

**Phone -- Step 2 of 4 (Simplified Body)**
```
+------------------------------------------+
|                                          |
|  +--------------------------------------+|
|  | [Live organism preview — top 40%]    ||
|  | [Updates in real-time as sliders     ||
|  |  change: size, tails, color]         ||
|  +--------------------------------------+|
|                                          |
|  Choose a body type, then tweak it.      |
|  [Herbivore] [Carnivore] [Omni] [Scav]  |
|   ^^^^^^^^ (pre-selected, green border)  |
|                                          |
|  Size  [====|=======] 1.0               |
|  Speed [====|=======] 1.2               |
|  Diet  [|============] 0.0 (plants)     |
|                                          |
|  Fine-Tune (6 more stats) >             |
|                                          |
|  [███████░░░] 76/100 BP                 |
|                                          |
|  *  *  o  o                              |
|                                          |
|  [       NEXT: Wire Brain            ]   |
|              Skip to Deploy ->           |
+------------------------------------------+
```

**Phone -- Step 3 of 4 (Simplified Brain)**
```
+------------------------------------------+
|                                          |
|  Wire Your Brain                         |
|                                          |
|  +--------------------------------------+|
|  | [Brain canvas with pre-wired         ||
|  |  template synapses visible]          ||
|  |                                      ||
|  | IN           OUT                     ||
|  | [PA]------>[Ro]  (existing)          ||
|  | [PD]------>[Ac]  (existing)          ||
|  | [Co]------>[Ea]  (existing)          ||
|  | [OS]---?-->[Fl]  (GUIDED: pulsing    ||
|  |             ^     arrow, dotted)     ||
|  +--------------------------------------+|
|                                          |
|  Drag from an input to an output.        |
|  Try: PlantAngle -> Rotate               |
|                                          |
|  [      USE TEMPLATE      ]             |
|  *  *  *  o                              |
|  [       NEXT: Deploy                ]   |
+------------------------------------------+
```

**Phone -- Step 4 of 4 (Simplified Deploy)**
```
+------------------------------------------+
|                                          |
|  Release Your Organisms                  |
|                                          |
|  Species Name:                           |
|  [ Green Drifters            ] [edit]    |
|                                          |
|  Choose a biome:                         |
|  [Grass] [Forest] [Desert] [Wet] [Rocky] |
|   ^^^^^^ (pre-selected, highlighted)     |
|                                          |
|  Grassland has plenty of food --         |
|  perfect for your first species.         |
|                                          |
|  *  *  *  *                              |
|                                          |
|  [   RELEASE INTO THE WORLD         ]   |
|  (large, green, prominent)               |
|                                          |
+------------------------------------------+
```

**Tablet (~820x1180) -- Step 2 of 4 (Simplified Body)**
```
+--------------------------------------------------------------+
| Step 2 of 4: Design Your Body                               |
|--------------------------------------------------------------|
|                                                              |
|  +---------------------------+ +---------------------------+ |
|  |                           | |                           | |
|  | [Live organism preview]   | | Choose a body type:       | |
|  | [Real renderer, animated] | |                           | |
|  |                           | | [Herbivore] [Carnivore]  | |
|  |                           | | [Omnivore]  [Scavenger]  | |
|  |                           | |                           | |
|  |                           | | Size  [====|===] 1.0     | |
|  |                           | | Speed [====|===] 1.2     | |
|  |                           | | Diet  [|========] 0.0    | |
|  |                           | |                           | |
|  |                           | | Fine-Tune (6 more) >     | |
|  |                           | |                           | |
|  |                           | | [██████░░] 76/100 BP     | |
|  +---------------------------+ +---------------------------+ |
|                                                              |
|  *  *  o  o                      Skip to Deploy ->           |
|                                                              |
|  [  BACK  ]                     [  NEXT: Wire Brain  ]       |
+--------------------------------------------------------------+
```

**Tablet (~820x1180) -- Step 3 of 4 (Simplified Brain)**
```
+--------------------------------------------------------------+
| Step 3 of 4: Wire Your Brain                                |
|--------------------------------------------------------------|
|                                                              |
|  +---------------------------+ +---------------------------+ |
|  |                           | |                           | |
|  | [Interactive brain canvas]| | Drag from an input to     | |
|  |                           | | an output to create a     | |
|  | IN           OUT          | | connection.                | |
|  | +--+        +--+         | |                           | |
|  | |PA| -----> |Ro|         | | Try: PlantAngle -> Rotate | |
|  | +--+  ^^^^  +--+         | | (steers toward food)      | |
|  | |PD|        |Ac|         | |                           | |
|  | +--+        +--+         | | Your template already has  | |
|  | |Co|        |Ea|         | | connections wired up.      | |
|  | +--+        +--+         | |                           | |
|  |                           | | [  USE TEMPLATE  ]        | |
|  +---------------------------+ +---------------------------+ |
|                                                              |
|  *  *  *  o                                                  |
|                                                              |
|  [  BACK  ]                              [  NEXT: Deploy  ]  |
+--------------------------------------------------------------+
```

### 8.17 World Picker & Retire Warning

**World Picker — Phone (bottom sheet)**
```
+==========================================+
| Select World                     [x]     |
|------------------------------------------|
|                                          |
| +--------------------------------------+ |
| | ● Life World               ● LIVE    | |
| |   🌱 Spring          12/30 players   | |
| |   >> Thornbacks (47 pop)             | |
| +--------------------------------------+ |
|                                          |
| +--------------------------------------+ |
| |   Test Arena          🔒   ● LIVE    | |
| |   ❄ Winter             3/10 players  | |
| +--------------------------------------+ |
|                                          |
| +--------------------------------------+ |
| |   Private League      ✉   ● LIVE    | |
| |   ☀ Summer             8/30 players  | |
| +--------------------------------------+ |
|                                          |
| +--------------------------------------+ |
| |   Sandbox                  ⏸ PAUSED  | |
| |   🍂 Autumn            0/50 players  | |
| +--------------------------------------+ |
|                                          |
|           (+ Create World)  <- admin only |
+==========================================+
```

- `●` checkmark next to current world
- `>> Thornbacks (47 pop)` only shown on worlds where the player has an active species
- Dimmed rows for paused/stopped worlds

**World Picker — Tablet (centered modal)**: Same content as phone, wider layout.

**Password Sub-Modal** (overlays the picker for password-protected worlds):
```
+------------------------------------------+
| Enter Password                    [x]    |
|------------------------------------------|
| World: Test Arena                        |
| [________________________]               |
|              [  JOIN  ]                  |
+------------------------------------------+
```

**Retire Warning Modal**:
```
+--------------------------------------+
|                                      |
|       Retire Species?                |
|                                      |
|  Switching to "Test Arena"           |
|  will retire your species            |
|  "Thornback Grazers" in             |
|  "Life World".                       |
|                                      |
|  This cannot be undone.              |
|                                      |
|  [       Cancel        ]            |
|  [ Retire & Switch     ]            |
|                                      |
+--------------------------------------+
```

- Tapping any world other than the current one triggers the switch flow
- If the player has an active species in their current world, the Retire Warning modal appears first
- Password sub-modal appears before the retire warning for password-protected worlds (skipped if player has an existing access grant)
- Admin "(+ Create World)" button at bottom navigates to `/admin/worlds/create`
- The WorldSelectorPill (`[🌐 World Alpha ▾]`) is present in the TopBar on all screens per the TopBar component definition (shown in Dashboard and Stats wireframes as representative examples)

### 8.18 Admin Dashboard

**Phone (~390x844)**
```
+------------------------------------------+
| Admin Panel                              |
|------------------------------------------|
|                                          |
| +------------------+ +----------------+ |
| | 🌐 Worlds: 3    | | 👥 Players: 23 | |
| |   2 running      | |   across all    | |
| |   1 paused       | |   worlds        | |
| +------------------+ +----------------+ |
|                                          |
| +--------------------------------------+ |
| | System Health                  ✅ OK | |
| | CPU: 24%  Memory: 312 MB           | |
| | Avg tick: 2.8ms                     | |
| +--------------------------------------+ |
|                                          |
| Quick Actions:                           |
| [Create World] [View Metrics] [Worlds]  |
|                                          |
|=====[ Home | Design | World | Stats | Me ]|
+------------------------------------------+
```

### 8.19 Admin World Detail

**Phone (~390x844) — Dev Tools Tab**
```
+------------------------------------------+
| ← Life World                             |
|------------------------------------------|
| [Config] [Players] [Invites] [Dev] [Met] |
|------------------------------------------|
|                                          |
| TPS: [========●===========] 40          |
|       10                  200            |
|                                          |
| Snapshots:                               |
| +--------------------------------------+ |
| | Tick 1,284,320   2 min ago    [Restore]|
| | 892 organisms, 5431 pellets           | |
| +--------------------------------------+ |
| | Tick 1,272,000   7 min ago    [Restore]|
| | 885 organisms, 5420 pellets           | |
| +--------------------------------------+ |
| | Tick 1,260,000  12 min ago    [Restore]|
| | 870 organisms, 5410 pellets           | |
| +--------------------------------------+ |
|                                          |
| [Force Snapshot]                         |
|                                          |
| ⚠️ Danger Zone                          |
| [Restart World] [Reset World]            |
|                                          |
+------------------------------------------+
```

## 9. WebSocket Client

```typescript
class SimWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectDelay = 30000;

  connect(url: string, jwt: string): void {
    this.ws = new WebSocket(url);
    this.ws.binaryType = 'arraybuffer';

    this.ws.onopen = () => {
      this.ws!.send(JSON.stringify({ type: 'auth', jwt }));
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        this.decodeBinaryFrame(event.data);
      } else {
        this.handleJsonMessage(JSON.parse(event.data));
      }
    };

    this.ws.onclose = () => {
      this.scheduleReconnect(url, jwt);
    };
  }

  private decodeBinaryFrame(buffer: ArrayBuffer): void {
    const view = new DataView(buffer);
    const msgType = view.getUint8(0);
    // Decode entity updates per binary protocol spec
    // Update worldStore via applyDelta()
  }

  private scheduleReconnect(url: string, jwt: string): void {
    const delay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );
    this.reconnectAttempts++;
    setTimeout(() => this.connect(url, jwt), delay);
  }

  sendViewport(viewport: Viewport): void {
    this.ws?.send(JSON.stringify({
      type: 'viewport',
      ...viewport
    }));
  }
}
```

**Reconnection strategy**: 1s, 2s, 4s, 8s, 16s, max 30s. On reconnect, re-send AUTH + JOIN_WORLD (same world) + VIEWPORT, receive FULL_STATE. Entities freeze during disconnect with "Reconnecting..." overlay.

## 10. Key Interaction Patterns

### Brain Editor Interactions
- **Create synapse**: Touch-drag from source node dot to target node dot. Green preview line while dragging.
- **Adjust weight**: Tap synapse -> popup slider [-5, +5]. Synapse thickness reflects |weight|. Color: green=positive, red=negative.
- **Adjust bias**: Tap node -> properties panel with bias slider [-5, +5].
- **Add hidden node**: Tap +Node -> bottom sheet/palette -> tap node type -> placed at center of canvas, draggable.
- **Delete**: Long-press node or synapse -> confirmation -> delete.
- **Canvas navigation**: Pinch-zoom (0.5x to 3x), two-finger pan. Double-tap to fit-all.

### World View Interactions
- **Pan**: One-finger drag (always available, even while following — panning detaches camera)
- **Zoom**: Pinch (0.1x to 8x continuous zoom). Zoom level drives LOD tier (Dot > 50u, Sprite 15-50u, Detail < 15u)
- **Follow organism**: Tap organism at any zoom level → camera locks on, smooth-zooms to Sprite tier if at Dot
- **Detach**: Pan/drag while following → camera detaches, follow overlays fade, pulse ring marks organism
- **Re-attach**: Tap same organism (or "Return" button) → re-follows. Tap different organism → follows that one.
- **Double-tap empty space**: Find and follow nearest own-species organism, zoom to Sprite tier
- **Center**: Tap center button → pan to population centroid
- **Overlays**: Toggle buttons cycle through heat map modes (available at all zoom levels)
- **Cycle organisms** (while following): Swipe left/right or prev/next buttons
- **Perception Mode** (while following at Sprite+ tier): Tap Perception toggle → fog-of-war darkens unsensed areas, echolocation blips show as grey silhouettes, sound arcs pulse at perception boundary. Toggle off to return to omniscient spectator view.
- **X-Ray** (while following own species at Detail tier): Tap X-Ray toggle → body becomes semi-transparent showing internals
- **Detail sheet** (while following at Sprite+ tier): Swipe up from collapsed bar → 4-tab detail panel
