# Phase 15 — End-to-End Integration & Deployment

Full system integration, end-to-end testing, performance optimization, and production deployment.

> **Before you start this phase**, read the general guidance in [`README.md`](./README.md).

### Phase 15 Guidance

**Read these design docs first:**
- `architecture.md` Section 6 (Deployment Architecture) — Hetzner VPS, Docker, Caddy, GitHub Pages
- `architecture.md` Section 10 (Performance Budget) — all performance targets you'll be benchmarking
- `architecture.md` Section 8 (Failure Modes & Recovery) — error handling and recovery strategies

**Prerequisites:**
- **All previous phases (1-14) must be complete.** This phase integrates everything.

**Ask the manager before starting this phase — significant infrastructure needed:**
- [ ] **Hetzner VPS**: Provision a CX33 instance (4 vCPU, 8GB RAM) — or equivalent. Provide SSH access.
- [ ] **Domain name**: Register or assign a domain (e.g., `lifegame.example.com`). Set up DNS: `A` record for `api.lifegame.example.com` pointing to VPS IP.
- [ ] **GitHub Pages**: Enable GitHub Pages on the repo (Settings → Pages → Deploy from branch `gh-pages`).
- [ ] **Secrets**: Add repository secrets for GitHub Actions: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and any others needed for the client build.
- [ ] **Docker**: Install Docker and Docker Compose on the VPS.
- [ ] **Environment file**: Create `.env` on the VPS with: `PORT`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DEBUG_ENABLED`.

**Steps 15.1-15.4 can be done locally** (integration tests, performance benchmarks, error handling). **Step 15.5 (Production Deployment) requires the infrastructure above.**

**Important: Do NOT start Step 15.5 until the manager confirms all infrastructure is ready.** Write the Dockerfile, docker-compose.yml, Caddyfile, and GitHub Actions workflow, but stop before deploying. Flag the manager with the complete launch checklist and wait for confirmation.

**QA handoff for this phase:**
When done, tell the manager: "The full system is deployed. To verify: (1) Open `https://lifegame.example.com` in a browser — the client should load from GitHub Pages, (2) Sign up for a new account, (3) Complete the Quick Start wizard, (4) Design a species and deploy it, (5) Switch to World view — your organisms should appear within 1 second, (6) Watch for 2 minutes — organisms should move, eat, and reproduce, (7) Check the leaderboard — your species should appear, (8) Open DevTools Network tab — WebSocket messages should be flowing, bandwidth should be under 10 KB/s, (9) SSH into the VPS and run `docker logs life-game-server` — tick times should be under 3ms average. Full launch checklist is in Step 15.5."

---

## Step 15.1 — Client-Server Integration

### What You're Implementing

Wire the full client-server pipeline: WebSocket connection from React app to simulation server, binary protocol encoding/decoding, viewport-culled entity streaming, species deployment from designer to server, and real-time world observation.

### Design References

- `architecture.md` Section 4 (Communication Protocols) — WebSocket binary protocol, viewport culling, delta compression.
- `architecture.md` Section 2 (Data Flow Diagrams) — Flow A (design→deploy), Flow B (world observation), Flow C (daily mutation).
- `components/front-end.md` Section 4 — SocketStore, WorldStore.
- `components/back-end.md` Section 6 (WebSocket Server) — Connection handling, message routing.

### Implementation Details

#### End-to-End Flow: Design → Deploy → Watch

1. **Client**: User completes design in designer (Phase 10)
2. **Client**: Saves design to Supabase (Phase 7)
3. **Client**: Sends `DEPLOY_SPECIES` [0x20] via WebSocket with designId
4. **Server**: Fetches design from Supabase, validates BP/unlocks
5. **Server**: Creates species via SpeciesManager, spawns founders
6. **Server**: Begins including new organisms in viewport broadcasts
7. **Client**: WorldStore receives entity deltas, renders organisms (Phase 9)

#### End-to-End Flow: World Observation

1. **Client**: Opens /world, WebSocket sends `VIEWPORT_UPDATE` [0x03]
2. **Server**: Registers viewport, begins culling entities for this client
3. **Server**: Every 50ms, broadcasts delta: new/moved/removed entities in viewport
4. **Client**: `applyDelta()` updates entity map, renderer interpolates positions
5. **Client**: User selects organism → server sends detailed entity data

#### Integration Test Harness

```typescript
describe('End-to-End Integration', () => {
  let server: TestServer;
  let client: TestClient;

  beforeAll(async () => {
    server = await startTestServer({ port: 0 });
    client = new TestClient(server.wsUrl);
    await client.connect();
  });

  it('deploys species and receives organisms in viewport', async () => {
    // Save design to Supabase
    const designId = await client.saveDesign(HERBIVORE_DESIGN);

    // Deploy via WebSocket
    client.sendDeploy(designId, { biome: 'grassland', founders: 5 });

    // Wait for response
    const response = await client.waitForMessage('DEPLOY_OK');
    expect(response.speciesId).toBeTruthy();

    // Set viewport to cover spawn area
    client.sendViewport({ x: 0, y: 0, w: 500, h: 500 });

    // Wait for entity broadcast
    const delta = await client.waitForMessage('ENTITY_DELTA');
    expect(delta.organisms.length).toBeGreaterThanOrEqual(5);
  });

  it('follows organism and receives detailed brain data', async () => {
    const orgId = client.getVisibleOrganisms()[0].id;
    client.sendFollow(orgId);

    const detail = await client.waitForMessage('ENTITY_DETAIL');
    expect(detail.brainInputs).toBeDefined();
    expect(detail.brainOutputs).toBeDefined();
  });
});
```

### Unit Tests

- Binary encoder/decoder roundtrip: encode organism → decode → matches original.
- Viewport culling: entities outside viewport are not included in broadcast.
- Delta compression: unchanged entities are not re-sent.

### Integration Tests

- Full deploy flow: design → save → deploy → receive organisms → verify alive.
- Viewport: move viewport → receive new entities entering view, old entities removed.
- Follow mode: select organism → receive brain trace data.
- Disconnect/reconnect: client reconnects → receives full state.

### QA Checklist

- [ ] Organisms appear in world within 1 second of deployment
- [ ] Entity positions update smoothly at 20 Hz
- [ ] Viewport culling reduces bandwidth to ~7 KB/s per client
- [ ] Species deployment validates correctly (BP, unlocks)
- [ ] Reconnection works after brief disconnect

---

## Step 15.2 — Supabase Integration Testing

### What You're Implementing

Verify all Supabase interactions work end-to-end: auth flow (signup → login → JWT), species design persistence, world snapshots, leaderboard queries, event log, and daily mutations.

### Design References

- `architecture.md` Section 9 — Complete database schema.
- `architecture.md` Section 7 (Security) — Auth model, RLS policies, JWT claims.
- All Phase 7 persistence references.

### Implementation Details

```typescript
describe('Supabase Integration', () => {
  let supabase: SupabaseClient;

  it('auth: signup → login → get JWT with player role', async () => {
    const { data } = await supabase.auth.signUp({
      email: 'test@example.com', password: 'testpass123',
    });
    expect(data.user).toBeTruthy();

    const { data: session } = await supabase.auth.signInWithPassword({
      email: 'test@example.com', password: 'testpass123',
    });
    expect(session.session?.access_token).toBeTruthy();
  });

  it('species design: save and retrieve', async () => {
    const designId = await speciesPersistence.saveDesign(playerId, testDesign);
    const retrieved = await speciesPersistence.getDesign(designId);
    expect(retrieved.body.sizeRatio).toBe(testDesign.body.sizeRatio);
  });

  it('snapshot: write and restore', async () => {
    await snapshotPersistence.writeSnapshot(worldId, world);
    const snapshot = await snapshotPersistence.getLatestSnapshot(worldId);
    expect(snapshot.tick).toBe(world.currentTick);
    expect(snapshot.organisms.length).toBe(world.organisms.length);
  });

  it('leaderboard: update and query', async () => {
    await leaderboardPersistence.updateScores(worldId, speciesManager);
    const entries = await leaderboardPersistence.getLeaderboard(worldId, 'score', 10);
    expect(entries.length).toBeGreaterThan(0);
    expect(entries[0].score).toBeGreaterThanOrEqual(entries[1]?.score ?? 0);
  });

  it('RLS: player cannot read other player designs', async () => {
    // Login as player B
    // Attempt to read player A's design
    // Expect empty result (not error, due to RLS)
  });
});
```

### QA Checklist

- [ ] Auth flow works: signup, email verify, login, JWT
- [ ] Species designs persist and are retrievable
- [ ] Snapshots write and restore correctly
- [ ] Leaderboard data is accurate and sorted
- [ ] Event logs persist and are queryable
- [ ] RLS policies enforce data isolation between players

---

## Step 15.3 — Performance Testing & Optimization

### What You're Implementing

Benchmark the full system under target load: 30 concurrent clients, 900 organisms, 5000 pellets, 40 TPS. Identify and fix performance bottlenecks.

### Design References

- `architecture.md` Section 10 (Performance Budget) — Targets: tick < 3ms avg / 25ms max, broadcast < 2ms, client render 60fps, bandwidth < 10 KB/s per client.
- `components/back-end.md` Section 1 — Server resource budget: single core for simulation.

### Implementation Details

#### Server Performance Test

```typescript
describe('Server Performance', () => {
  it('maintains tick time under 3ms with 900 organisms', () => {
    const world = createTestWorld();
    // Deploy 30 species x 30 organisms = 900
    for (let i = 0; i < 30; i++) {
      deploySpecies(world, randomTemplate(), 30);
    }

    const times: number[] = [];
    for (let i = 0; i < 1000; i++) {
      const start = process.hrtime.bigint();
      world.tick();
      times.push(Number(process.hrtime.bigint() - start) / 1_000_000);
    }

    const avg = times.reduce((a, b) => a + b) / times.length;
    const max = Math.max(...times);

    expect(avg).toBeLessThan(3);   // 3ms average
    expect(max).toBeLessThan(25);  // 25ms worst case
  });

  it('broadcast encoding under 2ms for 30 clients', () => {
    // Create 30 mock client viewports
    // Measure time to encode viewport-culled delta for each
  });
});
```

#### Client Performance Test

```typescript
describe('Client Rendering Performance', () => {
  it('renders 200 organisms at 60fps', () => {
    const renderer = new WorldRenderer();
    // Populate with 200 entities at various LOD tiers
    // Measure frame time over 60 frames
    const avgFrameTime = measureFrameTime(60);
    expect(avgFrameTime).toBeLessThan(16.67); // 60fps
  });
});
```

#### Optimization Targets

- **Brain tick**: Pre-allocate Float64Array per brain, avoid allocations in hot loop.
- **Spatial hash**: Use integer arithmetic for cell lookup, avoid Map overhead.
- **Serialization**: Use DataView for binary encoding, avoid intermediate objects.
- **Rendering**: Use ParticleContainer for dots, texture atlases for sprites.
- **Memory**: Object pooling for frequently created/destroyed entities.

### QA Checklist

- [ ] Server tick: < 3ms average with 900 organisms
- [ ] Server tick: < 25ms worst case
- [ ] Broadcast: < 2ms per cycle with 30 clients
- [ ] Client render: 60fps with 200 organisms in viewport
- [ ] Bandwidth: < 10 KB/s per client
- [ ] Memory: no leaks over 10,000 ticks (server) or 10 minutes (client)

---

## Step 15.4 — Error Handling & Edge Cases

### What You're Implementing

Comprehensive error handling for: WebSocket disconnects (client reconnection), server crash recovery (snapshot restore), Supabase outages (graceful degradation), invalid species designs (rejection with clear errors), and simulation edge cases (zero-energy world, mass extinction).

### Design References

- `architecture.md` Section 8 (Failure Modes & Recovery) — Failure scenarios and recovery strategies.
- `components/back-end.md` Section 1.5 — Graceful shutdown.
- `components/front-end.md` Section 4 — SocketStore reconnection logic.

### Implementation Details

#### Client Reconnection

```typescript
class WebSocketManager {
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000; // ms, doubles each attempt

  onClose(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
    } else {
      uiStore.showError('Connection lost. Please refresh.');
    }
  }

  onOpen(): void {
    this.reconnectAttempts = 0;
    // Re-send viewport, re-join world
    this.sendJoinWorld(worldStore.currentWorldId);
    this.sendViewport(worldStore.viewport);
  }
}
```

#### Server Crash Recovery

```
1. Process restarts (via Docker restart policy or systemd)
2. WorldManager.init() loads running worlds from Supabase
3. For each world: load latest snapshot → restore state → resume tick loop
4. Connected clients receive FULL_STATE on reconnection
5. Maximum data loss: 5 minutes (snapshot interval)
```

#### Supabase Outage

Server continues simulating. Persistence writes fail silently (logged). Retry queue for failed writes. Client shows "Offline mode — stats not saving" banner.

#### Simulation Edge Cases

- **Zero free biomass**: No plants spawn. Organisms starve. Eventually all die → meat decays → freeBiomass returns → plants resume.
- **Mass extinction**: All species extinct → AI manager injects fresh species.
- **Single organism**: Can reproduce asexually, repopulate. Sexual species goes extinct.
- **Overflow protection**: All energy/position values clamped. NaN checks in physics.

### Unit Tests

- Reconnection: simulate disconnect → verify reconnect attempt with exponential backoff.
- Snapshot restore: corrupt snapshot → verify graceful fallback (create fresh world).
- NaN protection: organism with NaN position → corrected to valid position.
- Zero energy: world with zero freeBiomass → no plant spawning (no crash).

### QA Checklist

- [ ] Client reconnects automatically after brief disconnection
- [ ] Server recovers from crash within 30 seconds
- [ ] Supabase outage doesn't crash the simulation
- [ ] Invalid species designs show clear error messages
- [ ] Mass extinction triggers AI species injection
- [ ] No NaN/Infinity in any entity state after 10,000 ticks

---

## Step 15.5 — Production Deployment

### What You're Implementing

Docker containerization, Caddy reverse proxy with TLS, Hetzner VPS setup, GitHub Pages deployment for client, environment configuration, monitoring, and launch checklist.

### Design References

- `architecture.md` Section 6 (Deployment Architecture) — Hetzner CX33, Docker, Caddy, GitHub Pages.
- `architecture.md` Section 10 (Performance Budget) — Target: $7/month total.

### Implementation Details

#### Docker Setup

```dockerfile
# server/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY packages/shared ./packages/shared
COPY packages/server ./packages/server
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile --filter server --filter shared
RUN pnpm --filter shared build && pnpm --filter server build
CMD ["node", "packages/server/dist/index.js"]
```

#### Docker Compose

```yaml
# docker-compose.yml
services:
  server:
    build: .
    ports:
      - "9000:9000"
    environment:
      - PORT=9000
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
    restart: unless-stopped

  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
    depends_on:
      - server

volumes:
  caddy_data:
```

#### Caddyfile

```
api.lifegame.example.com {
  reverse_proxy server:9000
}
```

#### Client Deployment (GitHub Pages)

```yaml
# .github/workflows/deploy-client.yml
name: Deploy Client
on:
  push:
    branches: [main]
    paths: ['packages/client/**', 'packages/shared/**']
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm --filter shared build
      - run: pnpm --filter client build
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          VITE_WS_URL: wss://api.lifegame.example.com/ws
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: packages/client/dist
```

#### Environment Variables

| Variable | Location | Description |
|----------|----------|-------------|
| `PORT` | Server | WebSocket listen port (default 9000) |
| `SUPABASE_URL` | Server | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Service role key (server-side only) |
| `VITE_SUPABASE_URL` | Client build | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Client build | Supabase anon key |
| `VITE_WS_URL` | Client build | WebSocket server URL |
| `DEBUG_ENABLED` | Server | Enable debug collector (default true) |

#### Automated Monitoring & Alerting

- `architecture.md` Section 11 (Debug & QA Tooling) — Monitoring and alerting for production.

A lightweight cron-based alerting system checks server health every 5 minutes and sends notifications when thresholds are breached:

```bash
#!/bin/bash
# monitoring/health-check.sh — runs via cron every 5 minutes
# 0 */5 * * * /opt/life-game/monitoring/health-check.sh

HEALTH_URL="https://api.lifegame.example.com/health"
WEBHOOK_URL="${DISCORD_WEBHOOK_URL}"  # or email via sendmail

response=$(curl -s -w "%{http_code}" -o /tmp/health.json "$HEALTH_URL" --max-time 10)

if [ "$response" != "200" ]; then
  curl -X POST "$WEBHOOK_URL" -H "Content-Type: application/json" \
    -d "{\"content\": \"🚨 Life Game server unreachable (HTTP $response)\"}"
  exit 1
fi

# Parse health response and check thresholds
avg_tick=$(jq -r '.avgTickMs' /tmp/health.json)
client_count=$(jq -r '.clientCount' /tmp/health.json)
memory_mb=$(jq -r '.memoryMB' /tmp/health.json)

if (( $(echo "$avg_tick > 10" | bc -l) )); then
  curl -X POST "$WEBHOOK_URL" -H "Content-Type: application/json" \
    -d "{\"content\": \"⚠️ High tick time: ${avg_tick}ms (threshold: 10ms)\"}"
fi

if (( $(echo "$memory_mb > 6000" | bc -l) )); then
  curl -X POST "$WEBHOOK_URL" -H "Content-Type: application/json" \
    -d "{\"content\": \"⚠️ High memory usage: ${memory_mb}MB (threshold: 6000MB)\"}"
fi
```

Alerting channels: Discord webhook (primary), email (backup). Add cron entry during VPS setup.

Thresholds:
| Metric | Warning | Critical |
|--------|---------|----------|
| Tick time | > 10ms avg | > 20ms avg |
| Memory | > 6 GB | > 7 GB |
| Client count | > 50 | > 80 |
| Health endpoint | timeout > 10s | 3 consecutive failures |

#### Launch Checklist

- [ ] Supabase project created with correct schema (Phase 1 SQL)
- [ ] RLS policies applied to all tables
- [ ] Hetzner VPS provisioned (CX33, 4 vCPU, 8GB RAM)
- [ ] Docker installed on VPS
- [ ] Domain DNS pointing to VPS IP
- [ ] TLS certificate auto-provisioned by Caddy
- [ ] `.env` file configured with all secrets
- [ ] `docker-compose up -d` starts server + Caddy
- [ ] Health check: `curl https://api.lifegame.example.com/health` returns 200
- [ ] Client deployed to GitHub Pages
- [ ] Client connects to WebSocket server
- [ ] Admin account created, admin role set in Supabase
- [ ] AI species library populated (15+ templates)
- [ ] Default world created and running
- [ ] Smoke test: login → design → deploy → watch → verify organisms alive

### QA Checklist

- [ ] Server starts from Docker and serves WebSocket connections
- [ ] TLS works (wss:// connection succeeds)
- [ ] Client loads from GitHub Pages
- [ ] Full user flow works: signup → design → deploy → watch
- [ ] Server survives restart (snapshots restore correctly)
- [ ] Cost: VPS + Supabase free tier = ~$7/month
- [ ] Performance: 30 clients, 900 organisms, < 3ms tick, 60fps client
- [ ] Health check cron runs every 5 minutes and alerts on threshold breach
- [ ] Discord webhook receives alerts for high tick time and memory usage
- [ ] Health endpoint responds within 10 seconds under load
