# Phase 8: Client — React App, Stores, WebSocket Client, Routing

**Goal**: Build the complete client-side application shell — a Vite + React 18 + TypeScript single-page application with Tailwind CSS styling, hash-based routing to all game screens, Zustand state management stores (auth, game world, species design, socket connection), a binary WebSocket client that speaks the server's protocol, and entity interpolation for smooth 60 fps rendering from 20 Hz server updates.

**Estimated Steps**: 7

> **Before you start this phase**, read the general guidance in [`README.md`](./README.md).

### Phase 8 Guidance

**Read these design docs first:**
- `components/front-end.md` Sections 1-4 (Tech stack, routing, component tree, all Zustand stores)
- `architecture.md` Section 4 (Communication Protocols) — the client-side binary decoder must match the server encoder from Phase 6
- `components/front-end.md` Section 3 (Responsive Design) — breakpoints, mobile vs desktop layout

**Prerequisites:**
- Phase 1 must be complete (shared types imported by the client).
- Phase 6 must be complete (the WebSocket server the client connects to).
- Phase 7 should be complete (Supabase auth — the client uses `SUPABASE_ANON_KEY` for login/signup).

**Ask the manager before starting:**
- [ ] Provide the `SUPABASE_URL` and `SUPABASE_ANON_KEY` for the client `.env` file
- [ ] Confirm the server from Phase 6 is running and accessible at a known URL (e.g., `ws://localhost:9000/ws`)

**No server infrastructure changes needed** — the client runs locally via `pnpm --filter client dev` (Vite dev server). It connects to the already-running simulation server.

**QA handoff for this phase:**
When done, tell the manager: "Run `pnpm --filter client dev` and open `http://localhost:5173`. Verify: (1) The app loads without console errors, (2) You can sign up / log in via the auth screen, (3) After login, the router shows the correct screen (dashboard or world), (4) Open browser DevTools Network tab — confirm the WebSocket connection to the server is established and binary messages are flowing, (5) Check that the Zustand stores are populated (use React DevTools or a quick `window.__stores` debug export)."

---

## Step 8.1: React App Scaffolding (Vite, React 18, TypeScript, Tailwind CSS, App Shell)

### What You're Implementing
The foundational project scaffold: a Vite-powered React 18 application with TypeScript strict mode, Tailwind CSS for utility-first styling, and the responsive `AppShell` component that adapts layout between phone and tablet breakpoints. This is the entry point for the entire client.

### Design References
- `front-end.md` §1 (Technology Stack: Vite, React 18, TypeScript, Tailwind CSS, Framer Motion)
- `front-end.md` §3 (Responsive Breakpoints: phone < 768px, tablet >= 768px)
- `front-end.md` §5 (Component Hierarchy: `<App>` wraps `<HashRouter>`, `<AuthProvider>`, `<SocketProvider>`, `<Routes>`)
- `front-end.md` §6 (AppShell: PhoneLayout vs TabletLayout, TopBar, BottomTabBar, SidebarNav)
- `art.md` §UI Colors (Background #0a0f1a, Panel #141e2e, borders, text, accent)

### Implementation Details

Create `packages/client/` with Vite scaffold:

**`vite.config.ts`**:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',  // relative paths for GitHub Pages
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 5173,
  },
});
```

**`tailwind.config.ts`**:
```typescript
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:          '#0a0f1a',  // deep space dark
        panel:       '#141e2e',  // dark blue-grey
        'panel-border': '#2a3a50',  // muted blue
        'text-primary':   '#e0e8f0',
        'text-secondary': '#8090a0',
        accent:      '#4fc3f7',  // bioluminescent blue
        warning:     '#ffb74d',
        danger:      '#ef5350',
        success:     '#66bb6a',
      },
      screens: {
        phone: { max: '767px' },
        tablet: '768px',
      },
    },
  },
  plugins: [],
};
```

**`src/App.tsx`**:
```typescript
import { HashRouter } from 'react-router-dom';
import { AuthProvider } from './providers/AuthProvider';
import { SocketProvider } from './providers/SocketProvider';
import { AppRoutes } from './routes/AppRoutes';

export function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
        </SocketProvider>
      </AuthProvider>
    </HashRouter>
  );
}
```

**`src/components/layout/AppShell.tsx`**:
```typescript
// Responsive shell that switches layout at 768px breakpoint
// Phone: TopBar + <Outlet /> + BottomTabBar
// Tablet: SidebarNav + ContentArea containing <Outlet />
// Uses useMediaQuery(768) to determine layout
// TopBar contains: screen title, WorldSelectorPill, notification bell
// BottomTabBar: Home, Design, World, Stats, Profile (5 items)
// SidebarNav: Home, Design, World, Stats, Leaderboard, Species, Events, Me, Admin*

export function AppShell() {
  const isTablet = useMediaQuery('(min-width: 768px)');
  return isTablet ? <TabletLayout /> : <PhoneLayout />;
}
```

**`src/components/layout/TopBar.tsx`**:
```typescript
// Fixed-height top bar (h-14) with:
// - Screen title (left)
// - WorldSelectorPill (center) — shows current world name, opens WorldPickerModal
// - Notification bell (right)
// Background: bg-panel, border-b border-panel-border
```

**`src/components/layout/BottomTabBar.tsx`**:
```typescript
// Fixed bottom bar (h-16) with 5 tab items
// Each tab: icon (Lucide) + label
// Active tab uses accent color, others use text-secondary
// Safe-area padding for mobile notch/home indicator
```

**`src/components/layout/SidebarNav.tsx`**:
```typescript
// Fixed left sidebar (w-64) for tablet
// All navigation items: Home, Design, World, Stats, Leaderboard, Species, Events, Me
// Admin link (conditional: authStore.user.role === 'admin')
// Active item highlight with accent-colored left border
```

**`src/hooks/useMediaQuery.ts`**:
```typescript
// Custom hook that wraps window.matchMedia for responsive breakpoint detection
// Returns boolean, updates on resize
export function useMediaQuery(query: string): boolean;
```

Install dependencies:
```bash
npm create vite@latest client -- --template react-ts
cd packages/client
npm install react-router-dom@6 tailwindcss @tailwindcss/vite
npm install zustand @supabase/supabase-js framer-motion @use-gesture/react
npm install lucide-react recharts
npm install -D @types/react @types/react-dom
```

### Unit Tests
- `AppShell` renders `PhoneLayout` when viewport < 768px
- `AppShell` renders `TabletLayout` when viewport >= 768px
- `TopBar` renders screen title, WorldSelectorPill, and notification bell
- `BottomTabBar` renders 5 tab items with correct icons and labels
- `BottomTabBar` highlights the active tab based on current route
- `SidebarNav` renders all navigation items for non-admin user
- `SidebarNav` renders Admin link only when `authStore.user.role === 'admin'`
- `useMediaQuery` returns `true` when query matches, `false` otherwise
- `useMediaQuery` updates when the window is resized across breakpoint

### QA Checklist
- [ ] `npm run dev` starts Vite dev server on port 5173 without errors
- [ ] `npm run build` produces a production build with no TypeScript errors
- [ ] Tailwind CSS classes apply correctly (custom colors visible in rendered output)
- [ ] Phone layout shows TopBar + content + BottomTabBar at 375px width
- [ ] Tablet layout shows SidebarNav + content at 1024px width
- [ ] All Lucide icons render at correct size (20x20 default)
- [ ] Dark theme colors from art.md §UI Colors are applied as default background
- [ ] No flash of unstyled content on initial load

---

## Step 8.2: Routing & Screen Structure (React Router, All Routes)

### What You're Implementing
The complete routing configuration using React Router v6 with HashRouter. All routes from the design document — `/login`, `/home`, `/design` (with nested body/brain/appearance tabs), `/world`, `/stats`, `/leaderboard`, `/mutation`, `/events`, `/species`, `/species/:id`, `/profile`, `/onboarding`, and admin routes. Route guards for authentication and admin access. Lazy-loading for admin routes.

### Design References
- `front-end.md` §2 (Routing Structure: complete route table)
- `front-end.md` §5 (Component Hierarchy: `<Routes>` block with all `<Route>` elements)
- `front-end.md` §6 (AdminGuard component, lazy-loaded admin routes)

### Implementation Details

**`src/routes/AppRoutes.tsx`**:
```typescript
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { AuthGuard } from '../components/guards/AuthGuard';
import { AdminGuard } from '../components/guards/AdminGuard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

// Eager-loaded screens (core user flow)
import { LoginScreen } from '../screens/LoginScreen';
import { SignupScreen } from '../screens/SignupScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../screens/ResetPasswordScreen';
import { EmailVerificationScreen } from '../screens/EmailVerificationScreen';
import { OnboardingFlow } from '../screens/onboarding/OnboardingFlow';
import { DashboardScreen } from '../screens/DashboardScreen';
import { DesignerScreen } from '../screens/designer/DesignerScreen';
import { WorldScreen } from '../screens/WorldScreen';

// Lazy-loaded screens (secondary flows)
const StatsDashboard = lazy(() => import('../screens/StatsDashboard'));
const LeaderboardScreen = lazy(() => import('../screens/LeaderboardScreen'));
const DailyMutationScreen = lazy(() => import('../screens/DailyMutationScreen'));
const EventLogScreen = lazy(() => import('../screens/EventLogScreen'));
const SpeciesDirectoryScreen = lazy(() => import('../screens/SpeciesDirectoryScreen'));
const SpeciesDetailScreen = lazy(() => import('../screens/SpeciesDetailScreen'));
const ProfileSettingsScreen = lazy(() => import('../screens/ProfileSettingsScreen'));

// Lazy-loaded admin screens (admin-only, gated)
const AdminDashboardScreen = lazy(() => import('../screens/admin/AdminDashboardScreen'));
const AdminWorldListScreen = lazy(() => import('../screens/admin/AdminWorldListScreen'));
const AdminCreateWorldScreen = lazy(() => import('../screens/admin/AdminCreateWorldScreen'));
const AdminWorldDetailScreen = lazy(() => import('../screens/admin/AdminWorldDetailScreen'));
const AdminPlayerManagementScreen = lazy(() => import('../screens/admin/AdminPlayerManagementScreen'));
const AdminMetricsScreen = lazy(() => import('../screens/admin/AdminMetricsScreen'));

export function AppRoutes() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/signup" element={<SignupScreen />} />
        <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
        <Route path="/reset-password" element={<ResetPasswordScreen />} />
        <Route path="/verify-email" element={<EmailVerificationScreen />} />

        <Route path="/onboarding" element={<AuthGuard><OnboardingFlow /></AuthGuard>}>
          <Route index element={<OnboardStep1_Concept />} />
          <Route path="body" element={<OnboardStep2_Body />} />
          <Route path="brain" element={<OnboardStep3_Brain />} />
          <Route path="deploy" element={<OnboardStep4_Deploy />} />
        </Route>

        <Route element={<AuthGuard><AppShell /></AuthGuard>}>
          <Route path="/home" element={<DashboardScreen />} />
          <Route path="/design" element={<DesignerScreen />}>
            <Route path="body" element={<BodyTab />} />
            <Route path="brain" element={<BrainTab />} />
            <Route path="appearance" element={<AppearanceTab />} />
          </Route>
          <Route path="/world" element={<WorldScreen />} />
          <Route path="/stats" element={<StatsDashboard />} />
          <Route path="/leaderboard" element={<LeaderboardScreen />} />
          <Route path="/mutation" element={<DailyMutationScreen />} />
          <Route path="/events" element={<EventLogScreen />} />
          <Route path="/species" element={<SpeciesDirectoryScreen />} />
          <Route path="/species/:id" element={<SpeciesDetailScreen />} />
          <Route path="/profile" element={<ProfileSettingsScreen />} />

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
    </Suspense>
  );
}
```

**`src/components/guards/AuthGuard.tsx`**:
```typescript
// Reads authStore.user
// If null and isLoading=false: redirect to /login
// If null and isLoading=true: show LoadingSpinner
// If not null: render children
export function AuthGuard({ children }: { children: React.ReactNode });
```

**`src/components/guards/AdminGuard.tsx`**:
```typescript
// Reads authStore.user.role
// If role !== 'admin': redirect to /home
// If admin: render <Outlet />
export function AdminGuard();
```

Create placeholder screen components — each screen is a minimal component that renders its name and a brief layout skeleton. These will be fleshed out in later phases. Every screen file exports both a named export and a default export (for lazy loading).

**`src/screens/LoginScreen.tsx`** (placeholder pattern):
```typescript
export function LoginScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg">
      <h1 className="text-2xl text-text-primary">Login</h1>
      {/* Placeholder — implemented in Phase 8.3 */}
    </div>
  );
}
export default LoginScreen;
```

### Unit Tests
- Unauthenticated user visiting `/home` is redirected to `/login`
- Authenticated user visiting `/login` is redirected to `/home`
- Non-admin user visiting `/admin` is redirected to `/home`
- Admin user visiting `/admin` renders `AdminDashboardScreen`
- Navigating to `/design/body` renders the BodyTab inside DesignerScreen
- Navigating to `/design/brain` renders the BrainTab inside DesignerScreen
- Unknown route `/nonexistent` redirects to `/home`
- Lazy-loaded screens render after Suspense resolves (mock dynamic import)
- `AuthGuard` shows `LoadingSpinner` while `authStore.isLoading` is true
- `/onboarding` route tree renders nested steps correctly

### QA Checklist
- [ ] All routes from front-end.md §2 are registered and reachable
- [ ] HashRouter produces URLs like `/#/home`, `/#/design/body`, etc.
- [ ] No full-page refresh when navigating between routes (SPA navigation)
- [ ] Admin routes are code-split into a separate chunk (verify with `npm run build`)
- [ ] Stats, Leaderboard, Mutation, Events, Species, Profile screens are lazy-loaded
- [ ] Back/forward browser buttons work correctly with hash routing
- [ ] AuthGuard and AdminGuard prevent unauthorized access without flashing protected content
- [ ] Loading spinner appears during lazy-loaded route resolution

---

## Step 8.3: Auth Store & Auth Screens (Supabase Auth, Login/Register, JWT Management)

### What You're Implementing
The Zustand auth store that wraps Supabase Auth — signup (email/password), login (email/password, magic link, Google OAuth), logout, password reset, account deletion, and email verification. JWT session management with automatic token refresh. The `AuthProvider` context that initializes the auth state on app load. The `LoginScreen`, `SignupScreen`, `ForgotPasswordScreen`, `ResetPasswordScreen`, and `EmailVerificationScreen` UI components.

### Design References
- `front-end.md` §4.1 (authStore interface: user, session, isLoading, signup, login, loginMagicLink, loginOAuth, logout, changePassword, resetPassword, deleteAccount, resendVerificationEmail)
- `front-end.md` §5 (LoginScreen, SignupScreen, ForgotPasswordScreen, ResetPasswordScreen, EmailVerificationScreen)
- `front-end.md` §6 (EmailVerificationBanner component)
- `architecture.md` §4.1 (JWT sent in AUTH message to WebSocket server)
- `architecture.md` §4.2 (Supabase Client SDK for auth)
- `architecture.md` §7 (Security Model: JWT-based auth)

### Implementation Details

**`src/lib/supabase.ts`**:
```typescript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,     // localStorage persistence
    autoRefreshToken: true,   // auto-refresh JWT before expiry
    detectSessionInUrl: true, // for OAuth redirect and email link callbacks
  },
});
```

**`src/stores/authStore.ts`**:
```typescript
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthStore {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isEmailVerified: boolean;

  // Initialize — called once by AuthProvider on mount
  initialize: () => Promise<void>;

  // Auth actions
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginMagicLink: (email: string) => Promise<void>;
  loginOAuth: (provider: 'google') => Promise<void>;
  logout: () => Promise<void>;

  // Account management
  changePassword: (newPassword: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  deleteAccount: (confirmation: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  isEmailVerified: false,

  initialize: async () => {
    // 1. Get current session from localStorage
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      set({
        user: session.user,
        session,
        isEmailVerified: !!session.user.email_confirmed_at,
        isLoading: false,
      });
    } else {
      set({ isLoading: false });
    }

    // 2. Subscribe to auth state changes (token refresh, sign-in/out)
    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        user: session?.user ?? null,
        session,
        isEmailVerified: !!session?.user.email_confirmed_at,
      });
    });
  },

  signup: async (email, password, displayName) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) throw error;
  },

  login: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  loginMagicLink: async (email) => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw error;
  },

  loginOAuth: async (provider) => {
    const { error } = await supabase.auth.signInWithOAuth({ provider });
    if (error) throw error;
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, isEmailVerified: false });
  },

  changePassword: async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },

  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },

  deleteAccount: async (confirmation) => {
    if (confirmation !== 'DELETE') throw new Error('Confirmation text must be "DELETE"');
    // Call Supabase Edge Function for account deletion
    const { error } = await supabase.functions.invoke('delete-account');
    if (error) throw error;
    await get().logout();
  },

  resendVerificationEmail: async () => {
    const user = get().user;
    if (!user?.email) throw new Error('No email to verify');
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
    });
    if (error) throw error;
  },
}));
```

**`src/providers/AuthProvider.tsx`**:
```typescript
// On mount, calls authStore.initialize()
// Renders children only after isLoading becomes false
// Provides no context — state lives in Zustand store (globally accessible via hook)
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((s) => s.initialize);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => { initialize(); }, [initialize]);

  if (isLoading) return <LoadingSpinner />;
  return <>{children}</>;
}
```

**`src/screens/LoginScreen.tsx`**:
```typescript
// Form fields: email, password
// Buttons: Sign In, Sign Up (link to /signup), Forgot Password (link)
// Google OAuth button
// Magic Link option
// Error display for invalid credentials
// On success: navigate to /home (or /onboarding if first login)
```

**`src/screens/SignupScreen.tsx`**:
```typescript
// Form fields: display name, email, password, confirm password
// Client-side validation: password min 8 chars, passwords match
// On success: show "Check your email for verification link" message
```

**`src/screens/ForgotPasswordScreen.tsx`**:
```typescript
// Form field: email
// Calls authStore.resetPassword(email)
// Shows confirmation message on success
```

**`src/screens/ResetPasswordScreen.tsx`**:
```typescript
// Reads recovery token from URL hash params
// Form fields: new password, confirm password
// Calls supabase.auth.updateUser({ password })
// Redirects to /login on success
```

**`src/screens/EmailVerificationScreen.tsx`**:
```typescript
// Reads verification token from URL
// Calls supabase.auth.verifyOtp() with token
// Shows success/failure message
// Redirects to /home on success
```

**`src/components/ui/EmailVerificationBanner.tsx`**:
```typescript
// Shown on DashboardScreen when !authStore.isEmailVerified
// Yellow/amber banner: "Verify your email to enable password reset"
// Resend button (calls resendVerificationEmail)
// Dismiss button (hides banner for current session)
```

### Unit Tests
- `authStore.initialize()` sets user and session from existing localStorage session
- `authStore.initialize()` sets isLoading=false when no session exists
- `authStore.signup()` calls `supabase.auth.signUp` with correct params
- `authStore.login()` calls `supabase.auth.signInWithPassword` and updates state
- `authStore.logout()` clears user, session, and isEmailVerified
- `authStore.deleteAccount()` throws if confirmation text is not "DELETE"
- `authStore.isEmailVerified` is derived from `user.email_confirmed_at`
- `LoginScreen` navigates to `/home` on successful login
- `LoginScreen` displays error message on failed login
- `SignupScreen` validates password match before calling signup
- `AuthProvider` shows LoadingSpinner while initializing, then renders children
- Auth state change listener updates store when token is refreshed

### QA Checklist
- [ ] Login with email/password works end-to-end with Supabase
- [ ] Google OAuth opens redirect flow and returns to app
- [ ] Magic link sends email and clicking link logs user in
- [ ] JWT auto-refreshes before expiry (no unexpected logouts)
- [ ] Session persists across browser refresh (localStorage)
- [ ] Logout clears all auth state and redirects to /login
- [ ] Password reset email flow works end-to-end
- [ ] Email verification banner shows for unverified users
- [ ] Resend verification button works (check rate limiting)
- [ ] Delete account flow requires "DELETE" confirmation text
- [ ] Auth errors display user-friendly messages (not raw Supabase errors)
- [ ] No JWT token leak in console logs or network tab (only sent via headers)

---

## Step 8.4: Game Store (World State, Entity Map, Camera, Viewport, Selection)

### What You're Implementing
The Zustand game store (referred to as `worldStore` in the design) that holds the real-time world state: the entity map (all visible organisms, pellets, eggs, fungi, spores), camera state (position, zoom level, follow mode), viewport dimensions, LOD tier computation, overlay mode toggles, follow-mode state, and world metadata. This store is the primary consumer of WebSocket delta updates and the primary data source for the Pixi.js renderer.

### Design References
- `front-end.md` §4.2 (worldStore interface: entities Map, viewport, cameraMode, followTargetId, lodTier, perceptionMode, overlayMode, worldMeta, setViewport, applyDelta, followEntity, detachCamera)
- `front-end.md` §4.2 (second worldStore: worlds list, currentWorldId, world picker state, switchWorld flow)
- `front-end.md` §6 (WorldScreen: WorldCanvas, FloatingInfoBar, OverlayToggles, CenterOnMeButton, FollowOverlay)
- `architecture.md` §2 Flow B (FULL_STATE and DELTA message handling, entity enter/update/exit)
- `architecture.md` §4.1 (Binary entity formats: Organism 28B, Pellet 12B, Egg 14B, Fungus 12B, Spore 16B)
- `architecture.md` §4.1 (Environment header: season, seasonProgress, ambientLight, activeEvent)
- `art.md` §LOD Visual Tiers (Dot > 50 units, Sprite 15-50 units, Detail < 15 units)

### Implementation Details

**`src/stores/gameStore.ts`**:
```typescript
import { create } from 'zustand';

// Entity state decoded from binary wire format
interface EntityState {
  id: number;
  entityType: number;       // 0x01=organism, 0x02=plant, 0x03=meat, 0x04=egg, 0x05=fungus, 0x06=spore
  x: number;                // world-space [0, 500)
  y: number;
  // Organism fields (populated when entityType === 0x01)
  rotation?: number;
  size?: number;
  health?: number;
  energy?: number;
  state?: number;           // bitfield: eating, attacking, fleeing, burrowed, reproducing, dead, emitting_sound, camouflaged
  speciesId?: number;
  red?: number;
  green?: number;
  blue?: number;
  maturity?: number;
  speed?: number;
  diet?: number;            // mouthState byte decoded
  traits?: number;          // bitfield: sex, echolocation, venomed, ai, fat, herd, sprouting
  fatFill?: number;
  venomTimer?: number;
  matingCooldown?: number;
  herdSize?: number;
  eggProgress?: number;
  // Pellet fields
  pelletSize?: number;
  decay?: number;
  // Egg fields
  hatchProgress?: number;
  nestBonus?: number;
  // Fungus fields
  fungiType?: number;
  // Spore fields
  originX?: number;
  originY?: number;
  destX?: number;
  destY?: number;
  flightProgress?: number;

  // Interpolation data (client-side, not from wire)
  prevX?: number;
  prevY?: number;
  prevRotation?: number;
  lastUpdateTick?: number;
}

interface EnvironmentState {
  season: number;           // 0=Spring, 1=Summer, 2=Autumn, 3=Winter
  seasonProgress: number;   // 0.0-1.0
  ambientLight: number;     // 0.0-1.0 (0=midnight, 1=noon)
  activeEvent: number;      // 0=none, 1-6 = event types
}

interface Viewport {
  x: number;                // center x in world units
  y: number;                // center y in world units
  width: number;            // width in world units
  height: number;           // height in world units
}

type OverlayMode = 'territory' | 'density' | 'pheromone' | 'food' | 'fungi';
type LODTier = 'dot' | 'sprite' | 'detail';

interface WorldMeta {
  worldId: string;
  worldName: string;
  playerCount: number;
  season: number;
  tick: number;
}

interface GameStore {
  // Entity state
  entities: Map<number, EntityState>;
  environment: EnvironmentState;

  // Camera & viewport
  viewport: Viewport;
  cameraMode: 'free' | 'following';
  followTargetId: number | null;
  lodTier: LODTier;
  perceptionMode: boolean;
  xrayMode: boolean;

  // Overlay toggles
  overlayMode: OverlayMode | null;

  // World metadata
  worldMeta: WorldMeta | null;

  // Biome grid (50x50, received once on join)
  biomeGrid: Uint8Array | null;

  // Actions
  setViewport: (v: Viewport) => void;
  applyFullState: (tick: number, env: EnvironmentState, entities: EntityState[]) => void;
  applyDelta: (tick: number, env: EnvironmentState, updated: EntityState[], entered: EntityState[], exitedIds: number[]) => void;
  setBiomeGrid: (grid: Uint8Array) => void;
  followEntity: (id: number) => void;
  detachCamera: () => void;
  setOverlay: (mode: OverlayMode | null) => void;
  togglePerceptionMode: () => void;
  toggleXrayMode: () => void;
  setWorldMeta: (meta: WorldMeta) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  entities: new Map(),
  environment: { season: 0, seasonProgress: 0, ambientLight: 1.0, activeEvent: 0 },
  viewport: { x: 250, y: 250, width: 100, height: 100 },
  cameraMode: 'free',
  followTargetId: null,
  lodTier: 'sprite',
  perceptionMode: false,
  xrayMode: false,
  overlayMode: null,
  worldMeta: null,
  biomeGrid: null,

  setViewport: (v) => {
    // Compute LOD tier from viewport width
    let lodTier: LODTier;
    if (v.width > 50) lodTier = 'dot';
    else if (v.width > 15) lodTier = 'sprite';
    else lodTier = 'detail';

    set({ viewport: v, lodTier });
  },

  applyFullState: (tick, env, entities) => {
    const map = new Map<number, EntityState>();
    for (const e of entities) {
      e.prevX = e.x;
      e.prevY = e.y;
      e.prevRotation = e.rotation;
      e.lastUpdateTick = tick;
      map.set(e.id, e);
    }
    set({
      entities: map,
      environment: env,
      worldMeta: get().worldMeta ? { ...get().worldMeta!, tick } : null,
    });
  },

  applyDelta: (tick, env, updated, entered, exitedIds) => {
    const entities = new Map(get().entities);

    // Apply updates — store previous position for interpolation
    for (const u of updated) {
      const existing = entities.get(u.id);
      if (existing) {
        u.prevX = existing.x;
        u.prevY = existing.y;
        u.prevRotation = existing.rotation;
      } else {
        u.prevX = u.x;
        u.prevY = u.y;
        u.prevRotation = u.rotation;
      }
      u.lastUpdateTick = tick;
      entities.set(u.id, u);
    }

    // Add entered entities
    for (const e of entered) {
      e.prevX = e.x;
      e.prevY = e.y;
      e.prevRotation = e.rotation;
      e.lastUpdateTick = tick;
      entities.set(e.id, e);
    }

    // Remove exited entities
    for (const id of exitedIds) {
      entities.delete(id);
    }

    set({ entities, environment: env });
  },

  setBiomeGrid: (grid) => set({ biomeGrid: grid }),

  followEntity: (id) => set({ cameraMode: 'following', followTargetId: id }),

  detachCamera: () => set({ cameraMode: 'free', followTargetId: null, perceptionMode: false, xrayMode: false }),

  setOverlay: (mode) => set({ overlayMode: mode }),

  togglePerceptionMode: () => set((s) => ({ perceptionMode: !s.perceptionMode })),

  toggleXrayMode: () => set((s) => ({ xrayMode: !s.xrayMode })),

  setWorldMeta: (meta) => set({ worldMeta: meta }),

  reset: () => set({
    entities: new Map(),
    environment: { season: 0, seasonProgress: 0, ambientLight: 1.0, activeEvent: 0 },
    viewport: { x: 250, y: 250, width: 100, height: 100 },
    cameraMode: 'free',
    followTargetId: null,
    lodTier: 'sprite',
    perceptionMode: false,
    xrayMode: false,
    overlayMode: null,
    worldMeta: null,
    biomeGrid: null,
  }),
}));
```

**`src/stores/worldListStore.ts`**:
```typescript
// Separate store for world list and world switching
// (front-end.md defines a second WorldStore for multi-world management)
interface WorldListStore {
  worlds: WorldSummary[];
  currentWorldId: string | null;
  connectionState: 'disconnected' | 'authenticated' | 'joined';
  isWorldPickerOpen: boolean;
  isRetireWarningOpen: boolean;
  pendingWorldId: string | null;

  setWorlds: (worlds: WorldSummary[]) => void;
  setCurrentWorldId: (id: string | null) => void;
  setConnectionState: (state: 'disconnected' | 'authenticated' | 'joined') => void;
  openWorldPicker: () => void;
  closeWorldPicker: () => void;
  requestSwitch: (worldId: string) => void;
  confirmRetireAndSwitch: () => void;
  cancelSwitch: () => void;
}
```

### Unit Tests
- `setViewport` computes LOD tier `'dot'` when width > 50
- `setViewport` computes LOD tier `'sprite'` when width is 25
- `setViewport` computes LOD tier `'detail'` when width is 10
- `applyFullState` replaces entire entity map and sets environment
- `applyDelta` updates existing entities while preserving previous positions
- `applyDelta` adds entered entities with correct prev values
- `applyDelta` removes exited entity IDs from the map
- `followEntity` sets cameraMode to 'following' and stores the target ID
- `detachCamera` resets cameraMode to 'free' and clears followTargetId, perceptionMode, xrayMode
- `reset` clears all state to defaults
- Entity prevX/prevY are set to current position on first entry (no stale data)
- `setBiomeGrid` stores the Uint8Array correctly

### QA Checklist
- [ ] Entity map handles 1000+ entities without visible performance degradation
- [ ] LOD tier transitions are correct at the exact boundary values (50 and 15 world units)
- [ ] Follow mode tracks the correct entity by ID
- [ ] Detach clears all follow-related state (perception, xray)
- [ ] Full state completely replaces the entity map (no stale entities from previous viewport)
- [ ] Delta correctly merges updated/entered/exited without data corruption
- [ ] Environment state updates on every tick (season, light, event)
- [ ] Biome grid stores all 2500 bytes (50x50)
- [ ] No memory leaks from entity map growing unboundedly (exited entities are removed)
- [ ] Supabase Realtime subscriptions active for leaderboard, mutations, and world events

#### Supabase Realtime Subscriptions

- `architecture.md` Section 4.2 (Supabase Realtime) — Three push channels for data that updates outside the WebSocket protocol.

The game store (or a dedicated `realtimeStore`) subscribes to three Supabase Realtime channels for data that the server doesn't push over the binary WebSocket:

```typescript
// src/lib/realtimeSubscriptions.ts
import { supabase } from './supabase';

export function initRealtimeSubscriptions() {
  // 1. Leaderboard scores — live updates when any species score changes
  supabase.channel('leaderboard-updates')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'leaderboard_scores',
    }, (payload) => {
      leaderboardStore.handleRealtimeUpdate(payload);
    })
    .subscribe();

  // 2. Daily mutations — notifies when new mutation options are available
  supabase.channel('daily-mutations')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'daily_mutations',
      filter: `player_id=eq.${authStore.user?.id}`,
    }, (payload) => {
      speciesStore.handleMutationAvailable(payload);
    })
    .subscribe();

  // 3. World events — broadcast channel for world-level notifications
  //    (supplements the binary WORLD_EVENT message for clients not connected to WebSocket)
  supabase.channel('world-events')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'event_log',
      filter: `type=in.(extinction,milestone,season_change)`,
    }, (payload) => {
      eventStore.handleRealtimeEvent(payload);
    })
    .subscribe();
}

export function teardownRealtimeSubscriptions() {
  supabase.removeAllChannels();
}
```

Initialize in `AuthProvider` after successful login, tear down on logout.

---

## Step 8.5: Species Store (Designs CRUD, Brain Config, Body Genes, Deployment)

### What You're Implementing
The Zustand species store that manages the player's organism designs — creating/editing body stat sliders, brain graph configuration, deployment configuration, and BP budget tracking. This store interfaces with Supabase for persistence (save/load designs) and with the WebSocket client for deployment. It also manages the species slot lifecycle (active/extinct/AI placeholder).

### Design References
- `front-end.md` §4.2 (speciesStore: activeSpecies, designDraft, updateBodyStat, setBrainGraph, deploy, retire, remainingBP)
- `front-end.md` §4.2 (deployStore: selectedBiome, founderCount, biomeCrowdingCost, effectiveBP, deploy)
- `front-end.md` §4.2 (speciesSlotStore: slotStatus, activeSpeciesId, aiPlaceholderId)
- `architecture.md` §2 Flow A (OrganismDesign interface: BodyGenes, TraitConfig, BrainConfig, DeploymentConfig)
- `architecture.md` §2 Flow A (Deploy flow: save to Supabase, send DEPLOY via WS)
- `architecture.md` §4.2 (REST operations: save design, read designs)

### Implementation Details

**`src/stores/speciesStore.ts`**:
```typescript
import { create } from 'zustand';
import { supabase } from '../lib/supabase';

// Matches architecture.md OrganismDesign
interface BodyGenes {
  sizeRatio: number;         // 0.3 - 3.0
  speedRatio: number;        // 0.2 - 2.5
  strength: number;          // 0.1 - 5.0
  defense: number;           // 0.0 - 4.0
  diet: number;              // 0.0 - 1.0
  viewAngle: number;         // 15 - 360
  viewRadius: number;        // 1.0 - 10.0
  metabolism: number;        // 0.5 - 3.0
  stomachMultiplier: number; // 0.3 - 2.0
  redColor: number;          // 0.0 - 1.0
  greenColor: number;        // 0.0 - 1.0
  blueColor: number;         // 0.0 - 1.0
}

interface TraitConfig {
  armorPlating?: { tier: 1 | 2 | 3; direction: 'front' | 'back' };
  venomGlands?: boolean;
  echolocation?: boolean;
  burrowing?: boolean;
  camouflage?: boolean;
  fatReserves?: { tier: 1 | 2 | 3 | 4 };
  sporeDispersal?: boolean;
  herdCoordination?: boolean;
}

interface BrainNode {
  id: string;
  type: 'input' | 'hidden' | 'output';
  activation: string;
  name: string;
  bias: number;
  position: { x: number; y: number };
}

interface Synapse {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  weight: number;
  enabled: boolean;
}

interface BrainConfig {
  nodes: BrainNode[];
  synapses: Synapse[];
}

interface DeploymentConfig {
  biome: 'grassland' | 'forest' | 'desert' | 'wetland' | 'rocky' | 'random';
  founderCount: number;
  biomeBPCost: number;
}

interface OrganismDesign {
  id?: string;
  speciesName: string;
  body: BodyGenes;
  traits: TraitConfig;
  brain: BrainConfig;
  deployment: DeploymentConfig;
  bpTotal: number;
}

// BP cost calculation matching architecture.md
function calculateBPTotal(design: OrganismDesign): number {
  let bp = 0;

  // Body genes: each point of each stat has a defined BP cost
  // (exact formulas from core-gameplay-systems.md, summarized here)
  bp += calculateBodyBP(design.body);

  // Traits
  if (design.traits.armorPlating) bp += [5, 10, 15][design.traits.armorPlating.tier - 1];
  if (design.traits.venomGlands) bp += 8;
  if (design.traits.echolocation) bp += 10;
  if (design.traits.burrowing) bp += 12;
  if (design.traits.camouflage) bp += 10;
  if (design.traits.fatReserves) bp += [5, 10, 15, 20][design.traits.fatReserves.tier - 1];
  if (design.traits.sporeDispersal) bp += 8;
  if (design.traits.herdCoordination) bp += 7;

  // Brain: hidden nodes cost BP (1 BP per hidden node)
  bp += design.brain.nodes.filter(n => n.type === 'hidden').length;

  // Deployment: founders cost
  bp += Math.max(0, design.deployment.founderCount - 1) * 5;
  bp += design.deployment.biomeBPCost;

  return bp;
}

interface SpeciesStore {
  // Current design being edited
  designDraft: OrganismDesign;
  // Active deployed species
  activeSpecies: { id: string; name: string; population: number } | null;
  // Saved design history
  savedDesigns: OrganismDesign[];

  // Computed
  remainingBP: number;  // 100 - bpTotal

  // Body gene actions
  updateBodyStat: (stat: keyof BodyGenes, value: number) => void;

  // Trait actions
  setTrait: (trait: keyof TraitConfig, value: any) => void;
  removeTrait: (trait: keyof TraitConfig) => void;

  // Brain actions
  setBrainGraph: (graph: BrainConfig) => void;
  addNode: (node: BrainNode) => void;
  removeNode: (nodeId: string) => void;
  addSynapse: (synapse: Synapse) => void;
  removeSynapse: (synapseId: string) => void;
  updateNodeBias: (nodeId: string, bias: number) => void;
  updateSynapseWeight: (synapseId: string, weight: number) => void;

  // Deployment
  setDeployBiome: (biome: DeploymentConfig['biome']) => void;
  setFounderCount: (count: number) => void;
  setBiomeCrowdingCost: (cost: number) => void;

  // Archetype presets
  applyArchetype: (archetype: string) => void;

  // Persistence (Supabase)
  saveDesign: () => Promise<string>;   // returns design ID
  loadDesigns: () => Promise<void>;
  loadDesign: (id: string) => Promise<void>;

  // Deploy (Supabase + WebSocket)
  deploy: () => Promise<void>;
  retire: () => Promise<void>;

  // Species name
  setSpeciesName: (name: string) => void;
}
```

Default design draft with archetype preset values:
```typescript
const DEFAULT_DESIGN: OrganismDesign = {
  speciesName: '',
  body: {
    sizeRatio: 1.0, speedRatio: 1.0, strength: 1.0, defense: 1.0,
    diet: 0.0, viewAngle: 120, viewRadius: 5.0, metabolism: 1.0,
    stomachMultiplier: 1.0, redColor: 0.3, greenColor: 0.7, blueColor: 0.2,
  },
  traits: {},
  brain: { nodes: [], synapses: [] },
  deployment: { biome: 'random', founderCount: 3, biomeBPCost: 0 },
  bpTotal: 0,
};
```

**Deploy flow** (matching architecture.md Flow A):
1. Client-side validate BP total <= 100
2. `INSERT` design into `species_designs` table via Supabase
3. `UPDATE` previous active design to `is_active = false`
4. Send `DEPLOY` message via WebSocket with the returned `design_id`
5. Await `DEPLOY_ACK` from server — status 0x00 = success, else show error

### Unit Tests
- `updateBodyStat('diet', 0.5)` updates the draft and recalculates bpTotal
- `remainingBP` returns `100 - bpTotal`
- `setTrait('venomGlands', true)` adds 8 BP to total
- `removeTrait('venomGlands')` reduces BP total by 8
- Adding a hidden brain node increases bpTotal by 1
- `setFounderCount(5)` adds `(5-1) * 5 = 20` BP to total
- `applyArchetype('Herbivore')` sets diet=0.0, size=1.0, speed=1.2, etc.
- `applyArchetype('Carnivore')` sets diet=1.0, strength=3.0, etc.
- `saveDesign()` calls Supabase insert and returns the design ID
- `deploy()` validates BP <= 100 before saving
- `deploy()` sends DEPLOY message via socket store after Supabase insert
- `deploy()` throws error if BP exceeds 100
- Design draft preserves state when navigating between designer tabs

### QA Checklist
- [ ] All body gene sliders have correct min/max ranges per architecture.md
- [ ] BP budget never exceeds 100 (client-side enforcement)
- [ ] BP display updates immediately on slider changes (no delay)
- [ ] Archetype presets populate all body genes, brain template, and traits
- [ ] Brain graph modifications (add/remove nodes, synapses) correctly update BP
- [ ] Species name validation: 2-24 characters
- [ ] Deploy flow saves to Supabase before sending WebSocket command
- [ ] Deploy error from server (DEPLOY_ACK status != 0) displays error message
- [ ] Design history loads correctly from Supabase
- [ ] Trait toggles correctly add/remove BP costs

---

## Step 8.6: WebSocket Client (Binary Message Encode/Decode, Connection Lifecycle, Auto-Reconnect)

### What You're Implementing
The WebSocket client that speaks the server's binary protocol. Handles the full connection lifecycle: connect, authenticate (send JWT), join world, stream viewport updates, and handle disconnection with exponential backoff reconnect. Encodes outbound messages (AUTH, VIEWPORT, JOIN_WORLD, LEAVE_WORLD, DEPLOY, PING, RETIRE_SPECIES) and decodes inbound messages (AUTH_OK, AUTH_FAIL, WORLD_LIST, JOIN_OK, JOIN_FAIL, FULL_STATE, DELTA, BIOME_MAP, DEPLOY_ACK, WORLD_EVENT, PONG, SERVER_SHUTDOWN, KICKED) from binary ArrayBuffers.

### Design References
- `architecture.md` §4.1 (WebSocket Protocol: connection lifecycle phases 1-5, binary message format, message type enum)
- `architecture.md` §4.1 (Binary entity formats: Organism 28B, Pellet 12B, Egg 14B, Fungus 12B, Spore 16B)
- `architecture.md` §4.1 (Environment header 8B format)
- `architecture.md` §4.1 (Reconnection strategy: exponential backoff 0/500/1000/2000/4000 up to 30s, 5min total timeout, 0-25% jitter)
- `architecture.md` §4.1 (FULL_STATE and DELTA message body layouts)
- `architecture.md` §4.1 (WORLD_LIST message format per-world entry)
- `front-end.md` §4.4 (socketStore: connectionState, connect, disconnect, sendViewport, followEntity)

### Implementation Details

**`src/lib/protocol.ts`** — Message type constants and binary codec:
```typescript
// Message type constants matching architecture.md
export const MessageType = {
  // Client -> Server
  AUTH:              0x01,
  VIEWPORT:          0x03,
  JOIN_WORLD:        0x05,
  LEAVE_WORLD:       0x06,
  DEPLOY:            0x20,
  RETIRE_SPECIES:    0x22,
  PING:              0x30,
  // Server -> Client
  AUTH_OK:           0x02,
  AUTH_FAIL:         0x04,
  WORLD_LIST:        0x05,
  JOIN_OK:           0x06,
  JOIN_FAIL:         0x07,
  KICKED:            0x08,
  FULL_STATE:        0x10,
  DELTA:             0x11,
  BIOME_MAP:         0x12,
  DEPLOY_ACK:        0x21,
  EVENT_WARNING:     0x24,
  WORLD_EVENT:       0x40,
  PONG:              0x31,
  SERVER_SHUTDOWN:   0xFF,
} as const;

// Entity type → byte size mapping
export const ENTITY_SIZES: Record<number, number> = {
  0x01: 28,  // Organism
  0x02: 12,  // Plant pellet
  0x03: 12,  // Meat pellet
  0x04: 14,  // Egg
  0x05: 12,  // Fungus
  0x06: 16,  // Spore
};
```

**`src/lib/encoder.ts`** — Outbound message encoding:
```typescript
// All messages: [msgType:u8][payloadLen:u16 LE][payload...]

export function encodeAuth(jwt: string): ArrayBuffer {
  const jwtBytes = new TextEncoder().encode(jwt);
  const buf = new ArrayBuffer(3 + jwtBytes.length);
  const view = new DataView(buf);
  view.setUint8(0, MessageType.AUTH);
  view.setUint16(1, jwtBytes.length, true);  // little-endian
  new Uint8Array(buf, 3).set(jwtBytes);
  return buf;
}

export function encodeViewport(x: number, y: number, w: number, h: number): ArrayBuffer {
  const buf = new ArrayBuffer(3 + 16);  // 4 x f32
  const view = new DataView(buf);
  view.setUint8(0, MessageType.VIEWPORT);
  view.setUint16(1, 16, true);
  view.setFloat32(3, x, true);
  view.setFloat32(7, y, true);
  view.setFloat32(11, w, true);
  view.setFloat32(15, h, true);
  return buf;
}

export function encodeJoinWorld(worldId: string, password?: string): ArrayBuffer {
  // worldId is 16-byte UUID, password is optional UTF-8
  const worldIdBytes = uuidToBytes(worldId);  // 16 bytes
  const pwdBytes = password ? new TextEncoder().encode(password) : new Uint8Array(0);
  const payloadLen = 16 + 1 + pwdBytes.length;
  const buf = new ArrayBuffer(3 + payloadLen);
  const view = new DataView(buf);
  view.setUint8(0, MessageType.JOIN_WORLD);
  view.setUint16(1, payloadLen, true);
  new Uint8Array(buf, 3, 16).set(worldIdBytes);
  view.setUint8(19, pwdBytes.length);
  if (pwdBytes.length > 0) new Uint8Array(buf, 20).set(pwdBytes);
  return buf;
}

export function encodeLeaveWorld(): ArrayBuffer;
export function encodeDeploy(designId: string): ArrayBuffer;
export function encodeRetireSpecies(): ArrayBuffer;
export function encodePing(): ArrayBuffer;
```

**`src/lib/decoder.ts`** — Inbound message decoding:
```typescript
export function decodeMessage(buffer: ArrayBuffer): DecodedMessage {
  const view = new DataView(buffer);
  const msgType = view.getUint8(0);
  const payloadLen = view.getUint16(1, true);
  const payload = new DataView(buffer, 3, payloadLen);

  switch (msgType) {
    case MessageType.AUTH_OK:
      return {
        type: 'AUTH_OK',
        playerId: payload.getUint16(0, true),
        serverTick: payload.getUint32(2, true),
      };

    case MessageType.FULL_STATE:
      return decodeFullState(payload);

    case MessageType.DELTA:
      return decodeDelta(payload);

    case MessageType.BIOME_MAP:
      return decodeBiomeMap(payload);

    // ... all other message types
  }
}

function decodeFullState(payload: DataView): FullStateMessage {
  const tick = payload.getUint32(0, true);
  const env = decodeEnvironment(payload, 4);  // 8 bytes at offset 4
  const entityCount = payload.getUint16(12, true);
  const entities: EntityState[] = [];
  let offset = 14;
  for (let i = 0; i < entityCount; i++) {
    const entityType = payload.getUint8(offset + 2);
    const entitySize = ENTITY_SIZES[entityType];
    entities.push(decodeEntity(payload, offset, entityType));
    offset += entitySize;
  }
  return { type: 'FULL_STATE', tick, env, entities };
}

function decodeEntity(view: DataView, offset: number, entityType: number): EntityState {
  const id = view.getUint16(offset, true);

  if (entityType === 0x01) {
    // Organism — 28 bytes
    return {
      id,
      entityType,
      x: (view.getUint16(offset + 3, true) / 65535) * 500,
      y: (view.getUint16(offset + 5, true) / 65535) * 500,
      rotation: (view.getUint8(offset + 7) / 255) * Math.PI * 2,
      size: (view.getUint8(offset + 8) / 255) * 3.0,
      health: view.getUint8(offset + 9) / 255,
      energy: view.getUint8(offset + 10) / 255,
      state: view.getUint8(offset + 11),
      speciesId: view.getUint16(offset + 12, true),
      red: view.getUint8(offset + 14),
      green: view.getUint8(offset + 15),
      blue: view.getUint8(offset + 16),
      maturity: view.getUint8(offset + 17) / 255,
      speed: view.getUint8(offset + 18) / 255,
      diet: view.getUint8(offset + 19) / 255,
      traits: view.getUint8(offset + 20),
      fatFill: view.getUint8(offset + 21) / 255,
      venomTimer: view.getUint8(offset + 22) / 255,
      matingCooldown: view.getUint8(offset + 23) / 255,
      herdSize: view.getUint8(offset + 24),
      eggProgress: view.getUint8(offset + 25) / 255,
    };
  }

  if (entityType === 0x02 || entityType === 0x03) {
    // Plant or Meat Pellet — 12 bytes
    return {
      id,
      entityType,
      x: (view.getUint16(offset + 3, true) / 65535) * 500,
      y: (view.getUint16(offset + 5, true) / 65535) * 500,
      pelletSize: view.getUint8(offset + 7) / 255,
      red: view.getUint8(offset + 8),
      green: view.getUint8(offset + 9),
      blue: view.getUint8(offset + 10),
      decay: view.getUint8(offset + 11) / 255,
    };
  }

  if (entityType === 0x04) {
    // Egg — 14 bytes
    return {
      id,
      entityType,
      x: (view.getUint16(offset + 3, true) / 65535) * 500,
      y: (view.getUint16(offset + 5, true) / 65535) * 500,
      red: view.getUint8(offset + 7),
      green: view.getUint8(offset + 8),
      blue: view.getUint8(offset + 9),
      hatchProgress: view.getUint8(offset + 10) / 255,
      nestBonus: view.getUint8(offset + 11) / 255,
      speciesId: view.getUint16(offset + 12, true),
    };
  }

  // ... fungus (12B) and spore (16B) decoders follow same pattern
}

function decodeEnvironment(view: DataView, offset: number): EnvironmentState {
  return {
    season: view.getUint8(offset),
    seasonProgress: view.getUint8(offset + 1) / 255,
    ambientLight: view.getUint8(offset + 2) / 255,
    activeEvent: view.getUint8(offset + 3),
  };
}
```

**`src/stores/socketStore.ts`**:
```typescript
import { create } from 'zustand';
import { encodeAuth, encodeViewport, encodeJoinWorld, encodePing } from '../lib/encoder';
import { decodeMessage } from '../lib/decoder';
import { useGameStore } from './gameStore';
import { useAuthStore } from './authStore';

interface SocketStore {
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'authenticated' | 'joined';
  ws: WebSocket | null;
  reconnectAttempts: number;
  reconnectTimer: number | null;
  latency: number;             // last measured round-trip in ms (from PING/PONG)

  connect: (url: string) => void;
  disconnect: () => void;
  sendViewport: (x: number, y: number, w: number, h: number) => void;
  sendJoinWorld: (worldId: string, password?: string) => void;
  sendLeaveWorld: () => void;
  sendDeploy: (designId: string) => void;
  sendRetireSpecies: () => void;
}

// Reconnection config from architecture.md §4.1
const RECONNECT_DELAYS = [0, 500, 1000, 2000, 4000, 8000, 16000, 30000];
const MAX_RECONNECT_TIME_MS = 5 * 60 * 1000;  // 5 minutes total

export const useSocketStore = create<SocketStore>((set, get) => ({
  connectionState: 'disconnected',
  ws: null,
  reconnectAttempts: 0,
  reconnectTimer: null,
  latency: 0,

  connect: (url) => {
    const ws = new WebSocket(url);
    ws.binaryType = 'arraybuffer';
    set({ ws, connectionState: 'connecting' });

    ws.onopen = () => {
      set({ connectionState: 'connected', reconnectAttempts: 0 });
      // Send AUTH immediately with JWT
      const session = useAuthStore.getState().session;
      if (session?.access_token) {
        ws.send(encodeAuth(session.access_token));
      }
    };

    ws.onmessage = (event: MessageEvent<ArrayBuffer>) => {
      const msg = decodeMessage(event.data);
      handleMessage(msg);
    };

    ws.onclose = () => {
      set({ connectionState: 'disconnected', ws: null });
      attemptReconnect(url);
    };

    ws.onerror = () => {
      // onclose will fire after onerror
    };
  },

  disconnect: () => {
    const { ws, reconnectTimer } = get();
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (ws) ws.close();
    set({ ws: null, connectionState: 'disconnected', reconnectAttempts: 0, reconnectTimer: null });
    useGameStore.getState().reset();
  },

  sendViewport: (x, y, w, h) => {
    const { ws } = get();
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(encodeViewport(x, y, w, h));
    }
  },

  // ... other send methods follow same pattern
}));

// Reconnection with exponential backoff + jitter
function attemptReconnect(url: string) {
  const { reconnectAttempts, reconnectTimer } = useSocketStore.getState();
  if (reconnectTimer) return;  // already scheduled

  const elapsed = reconnectAttempts * 2000;  // rough estimate
  if (elapsed > MAX_RECONNECT_TIME_MS) {
    // Show "Server unreachable" UI, stop retrying
    return;
  }

  const baseDelay = RECONNECT_DELAYS[Math.min(reconnectAttempts, RECONNECT_DELAYS.length - 1)];
  const jitter = baseDelay * Math.random() * 0.25;  // 0-25% jitter
  const delay = baseDelay + jitter;

  const timer = window.setTimeout(() => {
    useSocketStore.setState({
      reconnectAttempts: reconnectAttempts + 1,
      reconnectTimer: null,
    });
    useSocketStore.getState().connect(url);
  }, delay);

  useSocketStore.setState({ reconnectTimer: timer });
}

// Ping/keepalive: send PING every 15 seconds when connected
function startPingLoop() {
  setInterval(() => {
    const { ws, connectionState } = useSocketStore.getState();
    if (ws?.readyState === WebSocket.OPEN && connectionState === 'joined') {
      ws.send(encodePing());
    }
  }, 15000);
}

// Message handler — dispatches to stores
function handleMessage(msg: DecodedMessage) {
  const gameStore = useGameStore.getState();
  const worldListStore = useWorldListStore.getState();

  switch (msg.type) {
    case 'AUTH_OK':
      useSocketStore.setState({ connectionState: 'authenticated' });
      // Auto-rejoin: if player has a current_world_id, rejoin automatically
      autoRejoinWorld();
      break;
    case 'AUTH_FAIL':
      useSocketStore.getState().disconnect();
      break;
    case 'WORLD_LIST':
      worldListStore.setWorlds(msg.worlds);
      break;
    case 'JOIN_OK':
      useSocketStore.setState({ connectionState: 'joined' });
      worldListStore.setCurrentWorldId(msg.worldId);
      gameStore.setWorldMeta({ worldId: msg.worldId, worldName: '', playerCount: msg.playerCount, season: 0, tick: msg.tick });
      break;
    case 'FULL_STATE':
      gameStore.applyFullState(msg.tick, msg.env, msg.entities);
      break;
    case 'DELTA':
      gameStore.applyDelta(msg.tick, msg.env, msg.updated, msg.entered, msg.exitedIds);
      break;
    case 'BIOME_MAP':
      gameStore.setBiomeGrid(msg.grid);
      break;
    case 'DEPLOY_ACK':
      // Handle success/failure — notify speciesStore
      break;
    case 'WORLD_EVENT':
      // World-level event (extinction, milestone, season change, etc.)
      eventStore.addWorldEvent(msg.eventType, msg.data);
      // Show toast notification for significant events
      if (['extinction', 'milestone'].includes(msg.eventType)) {
        uiStore.showToast(formatWorldEvent(msg));
      }
      break;
    case 'EVENT_WARNING':
      // 30-second advance warning before a world event (e.g., meteor, drought)
      uiStore.showWarningToast(msg.warningText, 30_000);
      break;
    case 'SERVER_SHUTDOWN':
      // Show shutdown notification, clear state
      break;
    case 'PONG':
      // Compute latency from send timestamp
      break;
  }
}
```

#### Auto-Rejoin via `current_world_id`

- `architecture.md` Section 9 (`players` table) — `current_world_id` tracks the world the player was last in.

On AUTH_OK, the client checks the player's `current_world_id` from their profile and auto-joins that world:

```typescript
async function autoRejoinWorld() {
  const profile = await supabase
    .from('players')
    .select('current_world_id')
    .eq('id', useAuthStore.getState().user?.id)
    .single();

  if (profile.data?.current_world_id) {
    useSocketStore.getState().sendJoinWorld(profile.data.current_world_id);
  }
}
```

This enables seamless session continuity — when a player refreshes the page or reconnects, they automatically return to the world they were observing.

#### Client Maintenance Screen (Supabase Unreachable)

- `architecture.md` Section 8 (Failure Modes — Supabase Outage) — Client-side degradation.

When the Supabase client fails repeated health checks, show a maintenance banner:

```typescript
// src/lib/supabaseHealth.ts
export function startSupabaseHealthCheck() {
  setInterval(async () => {
    try {
      await supabase.from('worlds').select('id').limit(1).single();
      uiStore.setSupabaseStatus('connected');
    } catch {
      uiStore.setSupabaseStatus('unreachable');
    }
  }, 30_000); // check every 30 seconds
}

// In App.tsx or MaintenanceBanner component:
function MaintenanceBanner() {
  const status = uiStore.supabaseStatus;
  if (status === 'connected') return null;
  return (
    <div className="bg-warning/20 text-warning px-4 py-2 text-center text-sm">
      Offline mode — stats and leaderboards are not updating.
      The simulation continues normally.
    </div>
  );
}
```

The simulation (WebSocket) continues working independently of Supabase. Only persistence-dependent features (leaderboard, profile, design save) are degraded.

**`src/providers/SocketProvider.tsx`**:
```typescript
// On mount (when user is authenticated), connects to WS server
// On unmount, disconnects
// Reads WS URL from environment: VITE_WS_URL
export function SocketProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const connect = useSocketStore((s) => s.connect);
  const disconnect = useSocketStore((s) => s.disconnect);

  useEffect(() => {
    if (user) {
      connect(import.meta.env.VITE_WS_URL);
    }
    return () => disconnect();
  }, [user]);

  return <>{children}</>;
}
```

### Unit Tests
- `encodeAuth` produces correct binary: [0x01][len:u16 LE][jwt bytes]
- `encodeViewport` produces correct binary: [0x03][16:u16 LE][x:f32][y:f32][w:f32][h:f32]
- `encodeJoinWorld` correctly encodes UUID + optional password
- `decodeMessage` correctly parses AUTH_OK: playerId and serverTick
- `decodeMessage` correctly parses FULL_STATE with mixed entity types (organisms + pellets + eggs)
- `decodeEntity` for organism: x decodes from u16 fixed-point to 0-500 range
- `decodeEntity` for organism: rotation decodes from u8 to 0-2pi range
- `decodeEntity` for organism: state bitfield correctly identifies is_eating (bit 0)
- `decodeEntity` for pellet: all 12 bytes decode correctly
- `decodeEntity` for egg: all 14 bytes decode correctly including speciesId at offset 12
- `decodeEntity` for fungus: fungiType maps to correct enum value
- `decodeEntity` for spore: originX/Y and destX/Y decode from u16 fixed-point
- `decodeEnvironment` parses all 8 bytes of environment header
- `decodeDelta` correctly separates updated/entered/exited sections
- Reconnection attempts with exponential backoff (verify delay sequence: 0, 500, 1000, 2000, ...)
- Reconnection stops after 5 minutes total elapsed time
- Jitter adds 0-25% randomness to each delay
- `sendViewport` does nothing when WebSocket is not open
- `disconnect` clears reconnect timer and resets game store
- Auto-rejoin: on AUTH_OK, if `current_world_id` exists, JOIN_WORLD is sent automatically
- WORLD_EVENT handler dispatches to eventStore and shows toast for significant events
- EVENT_WARNING handler shows 30-second warning toast
- Maintenance banner shown when Supabase health check fails

### QA Checklist
- [ ] Binary encoding matches server expectation (verify with hex dump)
- [ ] Binary decoding handles all 6 entity types correctly
- [ ] Little-endian byte order used consistently (architecture.md specifies LE)
- [ ] Fixed-point position decoding: `u16 / 65535 * 500` gives correct world coordinates
- [ ] Rotation decoding: `u8 / 255 * 2pi` gives correct radians
- [ ] WebSocket connects with `binaryType = 'arraybuffer'`
- [ ] AUTH message sent immediately on connection open
- [ ] Reconnection backoff follows exact delay sequence from architecture.md
- [ ] FULL_STATE correctly handles variable-length entity list with mixed types
- [ ] DELTA correctly handles the three sections: updated, entered, exited IDs
- [ ] No ArrayBuffer out-of-bounds reads when processing messages
- [ ] BIOME_MAP 2501 bytes stored correctly (50x50 + 1 byte gridRes)
- [ ] Ping/keepalive prevents WebSocket timeout
- [ ] Server shutdown message triggers UI notification
- [ ] Auto-rejoin: player returns to previous world on reconnect without manual action
- [ ] WORLD_EVENT (0x40) shows toast notification for extinctions and milestones
- [ ] EVENT_WARNING (0x24) shows 30-second advance warning toast before world events
- [ ] Maintenance banner appears when Supabase is unreachable, hides when restored

---

## Step 8.7: Entity Interpolation (Lerp Between 20 Hz Server Updates at 60 fps Render)

### What You're Implementing
The entity interpolation system that provides smooth 60 fps visual updates from 20 Hz server position data. Each entity stores its previous and current server-reported positions. On each render frame, positions are linearly interpolated (lerped) between the two most recent server states based on how much time has elapsed since the last update. Rotation is interpolated using shortest-arc slerp to avoid spinning artifacts. This runs as a pre-render step in the Pixi.js render loop.

### Design References
- `front-end.md` §4.2 (interpolation: "lerp between 20 Hz server updates at 60 fps render")
- `architecture.md` §2 Flow B step 10 ("Interpolate & render at 60fps")
- `architecture.md` §4.1 (20 Hz broadcast loop, decoupled from 40 TPS sim — 50ms between updates)
- `architecture.md` §4.1 (Entity position encoding: u16 fixed-point, rotation: u8)
- `art.md` §Animation Principles (idle wobble, moving, eating — all require smooth motion)

### Implementation Details

**`src/lib/interpolation.ts`**:
```typescript
const SERVER_UPDATE_INTERVAL_MS = 50;  // 20 Hz = 50ms between updates
const WORLD_SIZE = 500;

export interface InterpolatedEntity {
  // Interpolated values for rendering (computed each frame)
  renderX: number;
  renderY: number;
  renderRotation: number;

  // Server-reported values (updated on each DELTA/FULL_STATE)
  serverX: number;
  serverY: number;
  serverRotation: number;
  prevServerX: number;
  prevServerY: number;
  prevServerRotation: number;

  // Timing
  lastUpdateTimeMs: number;   // performance.now() when last server update arrived
}

/**
 * Compute interpolated render position for a single entity.
 * Called once per entity per render frame.
 *
 * @param entity - Entity with server positions and timing
 * @param nowMs - Current time from performance.now()
 * @returns Interpolated x, y, rotation for this frame
 */
export function interpolateEntity(
  entity: InterpolatedEntity,
  nowMs: number
): { x: number; y: number; rotation: number } {
  // How far through the current update interval are we? [0.0, 1.0+]
  const elapsed = nowMs - entity.lastUpdateTimeMs;
  let t = elapsed / SERVER_UPDATE_INTERVAL_MS;

  // Clamp to [0, 1] — if t > 1, we haven't received a new update yet
  // so we hold at the latest position (no extrapolation to avoid jitter)
  t = Math.min(Math.max(t, 0), 1);

  // Toroidal-aware position interpolation
  let dx = entity.serverX - entity.prevServerX;
  let dy = entity.serverY - entity.prevServerY;

  // Wrap deltas for toroidal world
  if (dx > WORLD_SIZE / 2) dx -= WORLD_SIZE;
  if (dx < -WORLD_SIZE / 2) dx += WORLD_SIZE;
  if (dy > WORLD_SIZE / 2) dy -= WORLD_SIZE;
  if (dy < -WORLD_SIZE / 2) dy += WORLD_SIZE;

  let x = entity.prevServerX + dx * t;
  let y = entity.prevServerY + dy * t;

  // Wrap result into [0, WORLD_SIZE)
  x = ((x % WORLD_SIZE) + WORLD_SIZE) % WORLD_SIZE;
  y = ((y % WORLD_SIZE) + WORLD_SIZE) % WORLD_SIZE;

  // Rotation interpolation — shortest arc
  let dRot = entity.serverRotation - entity.prevServerRotation;
  // Normalize to [-PI, PI]
  while (dRot > Math.PI) dRot -= Math.PI * 2;
  while (dRot < -Math.PI) dRot += Math.PI * 2;
  const rotation = entity.prevServerRotation + dRot * t;

  return { x, y, rotation };
}

/**
 * Batch-interpolate all entities in the game store.
 * Called once per render frame in the Pixi.js ticker.
 *
 * Reads entities from gameStore, writes interpolated positions to a render
 * buffer that the renderer consumes.
 */
export class EntityInterpolator {
  private renderBuffer: Map<number, InterpolatedEntity> = new Map();

  /**
   * Called when a new server update arrives (FULL_STATE or DELTA).
   * Stamps the arrival time and shifts server -> prev positions.
   */
  onServerUpdate(entityId: number, x: number, y: number, rotation: number | undefined): void {
    const existing = this.renderBuffer.get(entityId);
    const now = performance.now();

    if (existing) {
      existing.prevServerX = existing.serverX;
      existing.prevServerY = existing.serverY;
      existing.prevServerRotation = existing.serverRotation;
      existing.serverX = x;
      existing.serverY = y;
      existing.serverRotation = rotation ?? existing.serverRotation;
      existing.lastUpdateTimeMs = now;
    } else {
      this.renderBuffer.set(entityId, {
        renderX: x,
        renderY: y,
        renderRotation: rotation ?? 0,
        serverX: x,
        serverY: y,
        serverRotation: rotation ?? 0,
        prevServerX: x,
        prevServerY: y,
        prevServerRotation: rotation ?? 0,
        lastUpdateTimeMs: now,
      });
    }
  }

  /**
   * Called when an entity exits the viewport.
   */
  onEntityRemoved(entityId: number): void {
    this.renderBuffer.delete(entityId);
  }

  /**
   * Called every render frame. Updates all interpolated positions.
   * Returns the render buffer for the renderer to consume.
   */
  tick(): Map<number, InterpolatedEntity> {
    const now = performance.now();

    for (const [id, entity] of this.renderBuffer) {
      const result = interpolateEntity(entity, now);
      entity.renderX = result.x;
      entity.renderY = result.y;
      entity.renderRotation = result.rotation;
    }

    return this.renderBuffer;
  }

  /**
   * Clear all interpolation state (on world switch or disconnect).
   */
  reset(): void {
    this.renderBuffer.clear();
  }

  /**
   * Get interpolated position for a specific entity (for follow camera).
   */
  getEntityPosition(entityId: number): { x: number; y: number; rotation: number } | null {
    const entity = this.renderBuffer.get(entityId);
    if (!entity) return null;
    return { x: entity.renderX, y: entity.renderY, rotation: entity.renderRotation };
  }
}
```

**Integration with game store**: The `EntityInterpolator` instance lives outside the Zustand store (as a plain class instance) because it maintains per-frame timing state that shouldn't trigger React re-renders. It subscribes to the game store's `applyFullState` and `applyDelta` actions to receive server updates:

```typescript
// src/lib/interpolatorBridge.ts
const interpolator = new EntityInterpolator();

// Hook into gameStore delta/fullState to feed the interpolator
useGameStore.subscribe((state, prevState) => {
  // When entities change, update the interpolator
  for (const [id, entity] of state.entities) {
    const prev = prevState.entities.get(id);
    if (!prev || prev.x !== entity.x || prev.y !== entity.y || prev.rotation !== entity.rotation) {
      interpolator.onServerUpdate(id, entity.x, entity.y, entity.rotation);
    }
  }
  // Remove entities that were deleted
  for (const id of prevState.entities.keys()) {
    if (!state.entities.has(id)) {
      interpolator.onEntityRemoved(id);
    }
  }
});

export { interpolator };
```

**Integration with Pixi.js render loop** (called in the Phase 9 renderer setup):
```typescript
app.ticker.add(() => {
  const renderPositions = interpolator.tick();
  // Pass renderPositions to Pixi.js sprite position updates
});
```

### Unit Tests
- `interpolateEntity` at t=0 returns prevServer position
- `interpolateEntity` at t=0.5 returns midpoint between prev and current
- `interpolateEntity` at t=1.0 returns current server position
- `interpolateEntity` at t=1.5 (no new update yet) clamps to t=1.0 (no extrapolation)
- Toroidal wrapping: entity moving from x=499 to x=1 interpolates across world edge (not backward through 498 units)
- Toroidal wrapping: entity at x=2, prevX=498, t=0.5 renders at x=0 (midpoint of 4-unit gap across edge)
- Rotation interpolation: 350 degrees to 10 degrees takes shortest arc (20-degree clockwise, not 340-degree counterclockwise)
- Rotation interpolation: 10 degrees to 350 degrees takes shortest arc (20-degree counterclockwise)
- `onServerUpdate` for new entity initializes prev and current to same values (no initial jump)
- `onServerUpdate` for existing entity shifts current to prev and writes new current
- `onEntityRemoved` deletes the entity from the render buffer
- `reset` clears all entities
- `getEntityPosition` returns null for nonexistent entity
- `tick` updates all entities in the render buffer

### QA Checklist
- [ ] No visible jitter when organisms move at constant velocity
- [ ] No teleporting when viewport changes cause FULL_STATE re-send
- [ ] Organisms crossing world edge (toroidal wrap) move smoothly, not snap backward
- [ ] Rotation changes are smooth (no 360-degree spins when crossing 0/2pi boundary)
- [ ] Interpolation holds position when a server update is late (no extrapolation jitter)
- [ ] New entities appear at their correct position on first frame (no flash at origin)
- [ ] Removed entities are cleaned up from the render buffer (no memory leak)
- [ ] Performance: interpolating 1000 entities per frame takes < 1ms
- [ ] Follow camera tracks interpolated position of the followed entity smoothly
- [ ] No floating-point drift accumulates over time (positions come from server, not accumulated deltas)
- [ ] Works correctly at variable frame rates (30fps, 60fps, 120fps)

---

## Step 8.8: PWA Manifest & Service Worker

### What You're Implementing

Progressive Web App support: a `manifest.json` for installability (Add to Home Screen on mobile), app icons, theme color, and a basic Service Worker that caches the app shell for offline loading.

### Design References

- `architecture.md` Section 6 (Deployment Architecture) — PWA manifest and service worker for mobile installability.

### Implementation Details

**`public/manifest.json`**:
```json
{
  "name": "Life Game",
  "short_name": "LifeGame",
  "description": "Design organisms, watch them evolve",
  "start_url": "./",
  "display": "standalone",
  "background_color": "#0a0f1a",
  "theme_color": "#4fc3f7",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**`src/sw.ts`** (Service Worker):
```typescript
const CACHE_NAME = 'life-game-v1';
const APP_SHELL = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
});

self.addEventListener('fetch', (event: FetchEvent) => {
  // Cache-first for app shell assets, network-first for API/WebSocket
  if (event.request.url.includes('/api/') || event.request.url.startsWith('ws')) {
    return; // let browser handle API and WebSocket requests
  }
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
```

**Registration** (in `src/main.tsx`):
```typescript
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}
```

**`index.html`** additions:
```html
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#4fc3f7">
<meta name="apple-mobile-web-app-capable" content="yes">
```

### Unit Tests

- Manifest JSON is valid and contains required fields (name, icons, start_url, display).
- Service Worker caches app shell assets on install.
- Service Worker serves cached assets when offline.

### QA Checklist

- [ ] "Add to Home Screen" prompt appears on mobile Chrome/Safari
- [ ] Installed PWA opens in standalone mode (no browser chrome)
- [ ] App shell loads when offline (shows cached UI, not browser error)
- [ ] Theme color matches app accent (#4fc3f7)
- [ ] Icons display correctly on home screen (192px and 512px)
