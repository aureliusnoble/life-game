# Phase 6: Server -- WebSocket Server, Binary Protocol, Auth, Broadcasting

**Goal**: Implement the real-time networking layer: uWebSockets.js server setup, binary message encoding/decoding, JWT authentication against Supabase, per-client viewport tracking, delta-compressed broadcasts at 20 Hz, and the admin REST API. After this phase, clients can authenticate, join worlds, receive live entity streams, deploy species, and admins can manage worlds via REST.

**Estimated Steps**: 8

> **Before you start this phase**, read the general guidance in [`README.md`](./README.md).

### Phase 6 Guidance

**Read these design docs first:**
- `architecture.md` Section 4 (Communication Protocols) — the full binary WebSocket protocol, message types, encoding formats
- `architecture.md` Section 7 (Security) — JWT validation, admin role checking, rate limiting
- `components/back-end.md` Section 6 (WebSocket Server) — connection lifecycle, viewport tracking, broadcast pipeline
- `components/game-components.md` Section 14 (Binary Encoder/Decoder) — 28-byte organism, 12-byte pellet, 14-byte egg formats

**Prerequisites:**
- Phase 5 must be complete (the running simulation you're now exposing over the network).
- The shared binary protocol types from Phase 1 (`packages/shared`) are used here.

**Ask the manager before starting Step 6.3 (Auth):**
- [ ] Confirm the Supabase project is set up with Auth enabled (from Phase 1)
- [ ] Provide a test user account (email/password) for integration testing JWT validation
- [ ] Confirm whether anonymous (spectator) access should work without auth, or if all connections require a JWT

**QA handoff for this phase:**
When done, tell the manager: "Start the server with `pnpm --filter server dev`. Then open a WebSocket connection to `ws://localhost:9000/ws` (use a tool like `websocat` or the browser console). Verify: (1) Connection succeeds with a valid JWT in the auth handshake, (2) Sending a VIEWPORT_UPDATE message results in ENTITY_DELTA messages streaming back at ~20 Hz, (3) Entity data decodes correctly (organism positions are in 0-500 range, not garbage), (4) Non-admin users get 403 on admin REST endpoints."

---

## Step 6.1: uWebSockets.js Server Setup

### What You're Implementing
The core WebSocket and HTTP server using uWebSockets.js. This includes the TCP listener on port 9000, the WebSocket upgrade handler at `/ws`, a `/health` HTTP endpoint, connection lifecycle management (open/close), and a per-connection session data structure. No authentication or message handling yet -- just the transport layer.

### Design References
- `components/back-end.md` Section 6.1 (uWebSockets.js setup, `createWebSocketServer`, `App()` creation, per-socket options)
- `components/back-end.md` Section 1.2 (Server startup sequence, step 4: WebSocket + HTTP server init)
- `components/back-end.md` Section 6.2 (`ClientSession` interface, `Viewport` interface, `ClientData` interface)
- `architecture.md` Section 6.3 (VPS deployment: Caddy terminates TLS, server listens on 9000)
- `architecture.md` Section 10 (Performance budget: 30 clients, 35 max connections)

### Implementation Details

Create `packages/server/src/network/ws-server.ts`:

```typescript
import uWS from 'uWebSockets.js';

const MAX_CONNECTIONS = 35;       // 30 players + 5 reconnect overlap
const MAX_PAYLOAD = 1024;         // Max incoming message size (bytes)
const IDLE_TIMEOUT = 120;         // Close after 2 min of no messages
const MAX_BACKPRESSURE = 64 * 1024; // 64 KB send buffer before dropping slow client

export class WebSocketServer {
  private app: uWS.TemplatedApp;
  private sessions: Map<uWS.WebSocket<ClientData>, ClientSession>;
  private listenSocket: uWS.us_listen_socket | null = null;

  constructor(worldManager: WorldManager, config: ServerConfig) {
    this.sessions = new Map();
    this.app = uWS.App(); // No TLS -- Caddy terminates SSL upstream

    this.setupWebSocket();
    this.setupHealthEndpoint();
  }

  get connectedClientCount(): number { return this.sessions.size; }
  getApp(): uWS.TemplatedApp { return this.app; }
  getSessions(): Map<uWS.WebSocket<ClientData>, ClientSession> { return this.sessions; }

  listen(port: number): void { ... }
  stopListening(): void { ... }
  closeAllConnections(): void { ... }
}
```

Create `packages/server/src/network/types.ts`:

```typescript
export interface ClientSession {
  ws: uWS.WebSocket<ClientData>;
  playerId: string | null;
  authenticated: boolean;
  currentWorldId: string | null;
  isAdmin: boolean;
  viewport: Viewport | null;
  lastViewportUpdate: number;
  previousEntityBytes: Map<number, Uint8Array>;
  assignedSpeciesId: string | null;
  connectedAt: number;
}

export interface Viewport {
  x: number; y: number; width: number; height: number;
}

export interface ClientData {
  sessionId: string;
}
```

The `/health` endpoint returns the multi-world health JSON as specified in `back-end.md` Section 10.1:
- Per-world: name, status, tick, organisms, pellets, eggs, species counts, client count, performance (avgTickMs, maxTickMs, simTps, broadcastHz), lastSnapshot age
- Aggregate: totalWorlds, runningWorlds, totalClients, totalOrganisms, totalPellets

**Key design decisions**:
- `uWS.App()` without TLS: Caddy reverse proxy handles SSL termination
- `maxPayloadLength: 1024`: designs are sent via Supabase REST, not WS -- the largest client message is AUTH (~2 KB JWT), but 1024 is enough for the token body after stripping the header
- `idleTimeout: 120`: client must PING every 30s; 2 min timeout catches dead connections
- `maxBackpressure: 64 * 1024`: drop slow clients before they exhaust server memory
- Session map keyed by the raw WebSocket object for O(1) lookup in message handler

### Unit Tests
- Server starts and listens on configured port
- WebSocket connection succeeds, `sessions.size` increments to 1
- WebSocket disconnect removes the session from the map
- Connection rejected when `sessions.size >= MAX_CONNECTIONS` (close code 1013)
- `/health` returns 200 with valid JSON containing `status: "ok"`
- Text WebSocket messages are rejected (close code 1003)
- Messages smaller than 3 bytes (minimum header) are silently dropped

### Integration Tests
- Multiple clients connect simultaneously (up to 35), then 36th is rejected
- Client connects, sends no messages for 120 seconds, gets disconnected by idle timeout
- Health endpoint reflects current connection count accurately

### QA Checklist
- [ ] Server binds to `PORT` from environment/config
- [ ] No TLS setup in the server itself (Caddy handles it)
- [ ] Session cleanup on all disconnect paths (clean close, error, idle timeout)
- [ ] Health endpoint accessible without authentication
- [ ] `closeAllConnections()` works for graceful shutdown
- [ ] Memory leak check: connect/disconnect 1000 times, verify session map stays empty

---

## Step 6.2: Binary Message Protocol

### What You're Implementing
The binary message encoder and decoder for all message types. Every WebSocket message uses a 3-byte header: `[msgType:u8][payloadLen:u16 LE]` followed by `payloadLen` bytes of payload. This step implements the `MessageType` enum, header parsing, and per-type payload encoding/decoding functions for both client-to-server and server-to-client messages.

### Design References
- `architecture.md` Section 4.1 (Binary message format: 3-byte header, all message types)
- `architecture.md` Section 4.1 (MessageType enum: AUTH=0x01 through SERVER_SHUTDOWN=0xFF)
- `architecture.md` Section 4.1 (JoinFailReason, AuthFailReason, DeployStatus enums)
- `architecture.md` Section 4.1 (WORLD_LIST per-entry format)
- `architecture.md` Section 4.1 (Environment header: 8 bytes)
- `components/back-end.md` Section 6.5 (DELTA message layout: header + tick + env + counts + entities + exitIds)

### Implementation Details

Create `packages/shared/src/protocol.ts` (shared between client and server):

```typescript
export const enum MessageType {
  // Client -> Server
  AUTH              = 0x01,
  VIEWPORT          = 0x03,
  JOIN_WORLD        = 0x05,
  LEAVE_WORLD       = 0x06,
  DEPLOY            = 0x20,
  RETIRE_SPECIES    = 0x22,
  PING              = 0x30,

  // Server -> Client
  AUTH_OK           = 0x02,
  AUTH_FAIL         = 0x04,
  WORLD_LIST        = 0x05,  // Same code as JOIN_WORLD but direction differs
  JOIN_OK           = 0x06,
  JOIN_FAIL         = 0x07,
  KICKED            = 0x08,
  FULL_STATE        = 0x10,
  DELTA             = 0x11,
  BIOME_MAP         = 0x12,
  DEPLOY_ACK        = 0x21,
  WORLD_EVENT       = 0x40,
  EVENT_WARNING     = 0x24,
  PONG              = 0x31,
  SERVER_SHUTDOWN   = 0xFF,
}

export const HEADER_SIZE = 3;
```

Create `packages/server/src/network/message-encoder.ts`:

Functions for encoding all server-to-client messages:
- `encodeAuthOk(playerId: number, serverTick: number): Buffer` -- [0x02][len][playerId:u16][serverTick:u32]
- `encodeAuthFail(reason: AuthFailReason): Buffer` -- [0x04][len][reason:u8]
- `encodeWorldList(worlds: WorldSummary[]): Buffer` -- per-world entry format from architecture.md
- `encodeJoinOk(worldId: string, playerCount: number, tick: number): Buffer` -- [0x06][len][worldId:16B][playerCount:u16][tick:u32]
- `encodeJoinFail(reason: JoinFailReason): Buffer`
- `encodeFullState(tick: number, envHeader: Uint8Array, entities: Uint8Array[]): Buffer`
- `encodeDelta(tick: number, envHeader: Uint8Array, updates: Uint8Array[], enters: Uint8Array[], exits: number[]): Buffer`
- `encodeBiomeMap(gridRes: number, grid: Uint8Array): Buffer`
- `encodeDeployAck(speciesId: number, status: DeployStatus): Buffer`
- `encodePong(serverTick: number): Buffer`
- `encodeServerShutdown(reason: number, restartInSec: number): Buffer`
- `encodeKicked(reason: number, message: string): Buffer`
- `encodeWorldEvent(eventType: number, payload: Buffer): Buffer`
- `encodeEventWarning(eventType: number, areaX: number, areaY: number, radius: number): Buffer`
- `packEnvironmentHeader(world: WorldState): Uint8Array` -- 8 bytes: season, progress, ambientLight, activeEvent, 4 reserved

Create `packages/server/src/network/message-decoder.ts`:

Functions for decoding client-to-server messages:
- `decodeHeader(buf: Buffer): { msgType: MessageType, payloadLen: number }`
- `decodeAuth(payload: Buffer): { token: string }`
- `decodeViewport(payload: Buffer): Viewport` -- reads 4 x f32 LE
- `decodeJoinWorld(payload: Buffer): { worldId: string, password?: string }` -- 16B UUID + optional pwd
- `decodeDeploy(payload: Buffer): { designId: string }` -- 16B UUID
- `formatUUID(hexBytes: string): string` -- convert 32 hex chars to UUID format with dashes

**Key implementation details**:
- All multi-byte numbers are little-endian (LE) per the protocol spec
- UUIDs are transmitted as raw 16 bytes, converted to/from string format at the boundary
- The DELTA message body layout is: `[tick:u32][env:8B][numUpdated:u16][numEntered:u16][numExited:u16][updated...][entered...][exitIds...]`
- Entity type byte at offset 2 of each entity determines its size: 0x01=28, 0x02/0x03=12, 0x04=14, 0x05=12, 0x06=16
- WORLD_LIST per-entry format: `[worldId:16B][nameLen:u8][name:utf8][accessType:u8][status:u8][playerCount:u16][maxPlayers:u16][season:u8][descLen:u16][desc:utf8]`

### Unit Tests
- Encode then decode AUTH_OK round-trips correctly
- Encode then decode JOIN_OK with a known UUID round-trips correctly
- `formatUUID` correctly converts 32 hex chars to `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- Header parser rejects buffers shorter than 3 bytes
- Viewport decoder reads 4 float32 LE values correctly
- DELTA message encoding with 0 updates/enters/exits produces correct header + empty body
- DELTA message with mixed entity types (28-byte organism + 12-byte pellet) packs correctly
- Environment header packs season=2, progress=128, light=200, event=3 into exact expected bytes
- WORLD_LIST with 3 worlds encodes/decodes correctly including UTF-8 names and descriptions

### Integration Tests
- Full encode-decode cycle for every message type
- Large DELTA message (200 entities) stays under uWebSockets.js send buffer limits

### QA Checklist
- [ ] All encoders produce a 3-byte header with correct msgType and payload length
- [ ] Little-endian byte order used consistently for all u16, u32, f32 fields
- [ ] UUID string <-> 16-byte conversion is bijective
- [ ] No Buffer allocations in the hot path (pre-allocate where possible)
- [ ] FULL_STATE and DELTA messages include the 8-byte environment header after tick

---

## Step 6.3: JWT Authentication

### What You're Implementing
The authentication flow for WebSocket connections. When a client connects and sends an AUTH message, the server verifies the JWT against Supabase's JWKS endpoint, extracts the player UUID, checks the player exists in the `players` table, caches admin status, and sends AUTH_OK or AUTH_FAIL.

### Design References
- `components/back-end.md` Section 6.3 (JWT verification code: `verifySupabaseJWT`, JWKS client setup, RS256)
- `components/back-end.md` Section 6.4 (handleMessage Phase 1: AUTH flow, player lookup, AUTH_OK/AUTH_FAIL)
- `architecture.md` Section 7.2 (WebSocket JWT authentication flow: JWKS fetch, kid extraction, claim validation)
- `architecture.md` Section 4.1 (AUTH message: [0x01][len][jwt_bytes], AUTH_OK: [0x02][playerId:u16][serverTick:u32])
- `architecture.md` Section 7.4 (Rate limiting: 5 AUTH attempts per IP per minute)

### Implementation Details

Create `packages/server/src/network/auth.ts`:

```typescript
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const client = jwksClient({
  jwksUri: `${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`,
  cache: true,
  cacheMaxAge: 600_000,  // 10 min JWKS cache
});

export async function verifySupabaseJWT(token: string): Promise<{
  sub: string;     // Player UUID
  email: string;
  exp: number;
}>;
```

The verification checks:
1. Decode JWT header, extract `kid` (key ID)
2. Fetch matching public key from Supabase JWKS endpoint (cached 10 min)
3. Verify RS256 signature
4. Check `exp` claim (reject if expired)
5. Check `iss` claim matches `${SUPABASE_URL}/auth/v1`
6. Check `aud` claim equals `'authenticated'`
7. Extract `sub` claim as player UUID

After JWT verification, the handler:
1. Queries `players` table for the player record (id, role)
2. If player not found, sends AUTH_FAIL(INVALID_TOKEN) and closes
3. Sets `session.playerId`, `session.authenticated = true`, `session.isAdmin = (role === 'admin')`
4. Sends AUTH_OK with playerId (u16 internal mapping) and serverTick (u32)
5. Sends WORLD_LIST so client can display the world picker

**Rate limiting for auth attempts**:
- Track auth attempts per IP address using a Map with timestamps
- Allow max 5 attempts per minute per IP
- On exceeded: close connection immediately, temp-ban IP for 5 minutes
- Clean up stale entries every 60 seconds

**Mid-session re-AUTH (token refresh)** — `architecture.md` §7.2:
- If a client sends an AUTH message on an already-authenticated session, the server treats it as a token refresh: re-verify the new JWT, update the session's `playerId` mapping if needed, and send AUTH_OK. The connection is NOT dropped.
- This handles the case where the client's Supabase token expires (default 1 hour) while the WebSocket is still connected. The client sends a new AUTH with the refreshed token.

```typescript
// In handleAuthMessage():
if (session.authenticated) {
  // Re-AUTH: verify new token, update session, send AUTH_OK
  const claims = await verifySupabaseJWT(newToken);
  session.jwtExpiry = claims.exp;
  send(ws, encodeAuthOk(session.internalPlayerId, world.currentTick));
  return;
}
```

**Pre-auth enforcement**:
- If a session has not authenticated, only AUTH messages are accepted
- Any other message type results in close code 4001 ("Auth required")

### Unit Tests
- Valid JWT is accepted, session becomes authenticated
- Expired JWT returns AUTH_FAIL with EXPIRED_TOKEN reason
- Malformed JWT returns AUTH_FAIL with INVALID_TOKEN reason
- Player not found in database returns AUTH_FAIL and connection closes
- Admin player gets `session.isAdmin = true`
- Non-admin player gets `session.isAdmin = false`
- Non-AUTH message before authentication closes connection with code 4001
- WORLD_LIST is sent immediately after AUTH_OK

### Integration Tests
- Full auth flow: connect, send AUTH, receive AUTH_OK, verify session state
- Auth with invalid token: connect, send bad AUTH, receive AUTH_FAIL, connection closes
- Rate limiting: 6 rapid AUTH attempts from same IP, 6th is rejected
- Re-auth on same connection (token refresh): send new AUTH after authenticated, session updates

### QA Checklist
- [ ] JWKS keys are cached for 10 minutes (not fetched on every auth)
- [ ] RS256 algorithm enforced (no algorithm confusion attacks)
- [ ] Issuer and audience claims validated
- [ ] Rate limiter map cleaned periodically to prevent memory leak
- [ ] Auth failure always results in AUTH_FAIL message before connection close
- [ ] Player role is fetched from Supabase `players` table, not from JWT claims
- [ ] Mid-session re-AUTH: sending new AUTH on authenticated session refreshes token without disconnect

---

## Step 6.4: Message Handler

### What You're Implementing
The central message dispatch function that routes incoming binary messages to their respective handlers based on message type. This covers all client-to-server message types: JOIN_WORLD, LEAVE_WORLD, VIEWPORT, DEPLOY, RETIRE_SPECIES, and PING. Each handler validates preconditions (authenticated, in a world) and performs the appropriate action.

### Design References
- `components/back-end.md` Section 6.4 (Full `handleMessage` function: auth phase, world phase, game command phase)
- `architecture.md` Section 4.1 (Connection lifecycle: Phase 1 Auth, Phase 2 Join World, Phase 3 Viewport, Phase 4 Streaming)
- `architecture.md` Section 2 Flow D (World switching: RETIRE_SPECIES -> LEAVE_WORLD -> JOIN_WORLD)
- `architecture.md` Section 7.4 (Rate limits: VIEWPORT 4/sec, DEPLOY 1/min)

### Implementation Details

Create `packages/server/src/network/handler.ts`:

```typescript
export async function handleMessage(
  session: ClientSession,
  msgType: MessageType,
  payload: Buffer,
  worldManager: WorldManager,
  supabase: SupabaseClient,
): Promise<void>;
```

**JOIN_WORLD handler**:
1. Parse payload: `[worldId:16B uuid][pwdLen:u8][pwd:utf8]`
2. If session is already in a world, leave it first (remove from old room, clear viewport, clear previousEntityBytes)
3. Validate access via `validateJoinWorld()`:
   - World exists and status is `'running'`
   - Room not full (`clients.size < maxPlayers`)
   - Player not banned (check `world_bans` table)
   - For `'password'` worlds: verify password or check existing `world_access_grant`
   - For `'invite'` worlds: check `world_invites` table
   - On successful password validation, create a `world_access_grant` so subsequent joins skip the password
4. On success: add client to WorldRoom, set `session.currentWorldId`, send JOIN_OK + BIOME_MAP
5. On failure: send JOIN_FAIL with appropriate reason code (NOT_FOUND, FULL, WRONG_PASSWORD, NOT_INVITED, BANNED, PAUSED_OR_STOPPED)

**LEAVE_WORLD handler**:
1. Remove client from current WorldRoom
2. Clear viewport, previousEntityBytes, assignedSpeciesId
3. Send updated WORLD_LIST (client stays connected, can re-join)

**VIEWPORT handler**:
1. Require `session.currentWorldId` to be set
2. Throttle: skip if `Date.now() - session.lastViewportUpdate < 250ms` (max 4/sec)
3. Parse 4 float32 LE values: x, y, width, height
4. If viewport changed significantly from previous, clear previousEntityBytes and send FULL_STATE
5. Otherwise, delta updates will catch up on next broadcast cycle

**DEPLOY handler**:
1. Require `session.currentWorldId`
2. Parse designId (16 bytes UUID)
3. Delegate to `handleDeploy()` (detailed in step 7.8)

**RETIRE_SPECIES handler**:
1. Require `session.currentWorldId` and `session.assignedSpeciesId`
2. Call `world.retireSpecies(speciesId, playerId)` -- applies 10x accelerated ageing
3. Clear `session.assignedSpeciesId`

**PING handler**:
1. Send PONG with current server tick (or 0 if not in a world)

**Viewport significance check**:
```typescript
function viewportChangedSignificantly(prev: Viewport, next: Viewport): boolean {
  // Significant = any edge moved by more than 20% of the viewport dimension
  const dx = Math.abs(prev.x - next.x);
  const dy = Math.abs(prev.y - next.y);
  const dw = Math.abs(prev.width - next.width);
  const dh = Math.abs(prev.height - next.height);
  return dx > prev.width * 0.2 || dy > prev.height * 0.2
      || dw > prev.width * 0.2 || dh > prev.height * 0.2;
}
```

### Unit Tests
- JOIN_WORLD with valid world ID adds session to room and returns JOIN_OK
- JOIN_WORLD with non-existent world ID returns JOIN_FAIL(NOT_FOUND)
- JOIN_WORLD when room is full returns JOIN_FAIL(FULL)
- JOIN_WORLD to password world without password returns JOIN_FAIL(WRONG_PASSWORD)
- JOIN_WORLD to password world with correct password creates access grant and returns JOIN_OK
- LEAVE_WORLD removes session from room, clears state, sends WORLD_LIST
- VIEWPORT updates session.viewport and triggers FULL_STATE on significant change
- VIEWPORT within throttle window is silently dropped
- DEPLOY without being in a world is silently ignored
- RETIRE_SPECIES clears assignedSpeciesId
- PING returns PONG with current tick
- Switching worlds: JOIN_WORLD while in a world auto-leaves old world first

### Integration Tests
- Full world join flow: AUTH -> JOIN_WORLD -> VIEWPORT -> receive FULL_STATE
- World switch flow: JOIN_WORLD(A) -> RETIRE_SPECIES -> JOIN_WORLD(B) -> verify in world B
- VIEWPORT updates at 4/sec are all processed; updates at 10/sec are throttled to ~4/sec
- DEPLOY triggers the full deploy pipeline (stubbed world for this test)

### QA Checklist
- [ ] Every handler checks authentication and world membership preconditions
- [ ] JOIN_WORLD performs all 6 access checks (exists, running, not full, not banned, password, invite)
- [ ] LEAVE_WORLD properly cleans up all session state (viewport, previousEntityBytes, speciesId)
- [ ] VIEWPORT throttle uses wall-clock time, not tick count
- [ ] Access grants are persisted so re-joining password worlds does not re-prompt
- [ ] BIOME_MAP sent immediately after JOIN_OK (2501 bytes)

---

## Step 6.5: Entity Binary Encoding

### What You're Implementing
Functions to pack each entity type (organism, pellet, egg, fungus, spore) into their compact binary representations for network transmission. These are used by both FULL_STATE and DELTA messages.

### Design References
- `architecture.md` Section 2 Flow B (Organism 28 bytes, Pellet 12 bytes, Egg 14 bytes, Fungus 12 bytes, Spore 16 bytes)
- `architecture.md` Section 4.1 (Entity type IDs: 0x01-0x06, exact byte layouts)
- `components/back-end.md` Section 6.5 (Organism 28-byte encoding, Pellet 12-byte encoding, field-by-field breakdown)

### Implementation Details

Create `packages/server/src/network/binary-encoder.ts`:

**Organism encoding (28 bytes)**:
```
Offset  Size  Field           Encoding
0       2     entityId        u16
2       1     entityType      u8, 0x01
3       2     x               u16, fixed-point (pos / 500 * 65535)
5       2     y               u16, fixed-point
7       1     rotation        u8, (angle / 2pi * 255)
8       1     size            u8, (sizeRatio / 3.0 * 255)
9       1     health          u8, (healthRatio * 255)
10      1     energy          u8, (energyRatio * 255)
11      1     state           u8, bitfield (eating, attacking, fleeing, burrowed, reproducing, dead, emitting_sound, camouflaged)
12      2     speciesId       u16
14      1     red             u8
15      1     green           u8
16      1     blue            u8
17      1     maturity        u8, (maturity * 255)
18      1     speed           u8, (currentSpeed / maxSpeed * 255)
19      1     mouthState      u8, (diet * 255)
20      1     traits          u8, bitfield (sex, echolocation_active, venomed, ai_species, fat_reserves, herd_bonus, sprouting, reserved)
21      1     fatFill         u8, (fatStored / maxFatCapacity * 255)
22      1     venomTimer      u8, (venomTimeRemaining / maxVenomDuration * 255)
23      1     matingCooldown  u8, (cooldownRemaining / maxCooldown * 255)
24      1     herdSize        u8, capped at 255
25      1     eggProgress     u8, (eggStored * 255)
26      2     reserved        u16, 0x0000
```

```typescript
export function packOrganism(org: Organism, buf: Uint8Array, offset: number): void;
export function packPellet(pellet: Pellet, buf: Uint8Array, offset: number): void;
export function packEgg(egg: Egg, buf: Uint8Array, offset: number): void;
export function packFungus(fungus: FungiPatch, buf: Uint8Array, offset: number): void;
export function packSpore(spore: Spore, buf: Uint8Array, offset: number): void;

// Convenience: determine entity size from type byte
export function entitySizeByType(typeByte: number): number {
  switch (typeByte) {
    case 0x01: return 28; // Organism
    case 0x02:
    case 0x03: return 12; // Plant/Meat Pellet
    case 0x04: return 14; // Egg
    case 0x05: return 12; // Fungus
    case 0x06: return 16; // Spore
    default:   return 0;
  }
}
```

**Pellet encoding (12 bytes)**:
- entityId(u16), entityType(u8: 0x02 plant/0x03 meat), x(u16), y(u16), size(u8), red(u8), green(u8), blue(u8), decay(u8)

**Egg encoding (14 bytes)**:
- entityId(u16), entityType(u8: 0x04), x(u16), y(u16), red(u8), green(u8), blue(u8), hatchProgress(u8), nestBonus(u8), speciesId(u16)

**Fungus encoding (12 bytes)**:
- entityId(u16), entityType(u8: 0x05), x(u16), y(u16), fungiType(u8), size(u8), energy(u8), reserved(u16)

**Spore encoding (16 bytes)**:
- entityId(u16), entityType(u8: 0x06), originX(u16), originY(u16), destX(u16), destY(u16), red(u8), green(u8), blue(u8), flightProgress(u8), speciesId_lo(u8)

**Fixed-point position encoding**: `Math.round(pos / 500 * 65535)` maps [0, 500) to [0, 65535]. Resolution: 500/65535 = ~0.0076 world units per step, which is sub-pixel precision.

**State bitfield encoding** (organism byte 11):
```typescript
let state = 0;
if (org.isEating)       state |= 0x01;
if (org.isAttacking)    state |= 0x02;
if (org.isFleeing)      state |= 0x04;
if (org.isBurrowed)     state |= 0x08;
if (org.isReproducing)  state |= 0x10;
if (org.isDead)         state |= 0x20;
if (org.soundEmitIntensity > 0) state |= 0x40;
if (org.hasCamouflage && org.camoBreakTimer <= 0) state |= 0x80;
```

### Unit Tests
- `packOrganism` produces exactly 28 bytes with correct entityType at offset 2
- `packPellet` for a plant produces entityType 0x02, for meat produces 0x03
- `packEgg` produces exactly 14 bytes
- `packFungus` produces exactly 12 bytes
- `packSpore` produces exactly 16 bytes
- Position encoding: (0, 0) -> (0, 0), (250, 250) -> (32767, 32767), (499.99, 499.99) -> (65534, 65534)
- Rotation encoding: 0 rad -> 0, pi -> 128, 2pi-epsilon -> 255
- State bitfield: all 8 flags set -> 0xFF, no flags -> 0x00
- Traits bitfield: sex=1, echolocation=1 -> 0x03
- `entitySizeByType` returns correct size for all type codes, 0 for unknown types
- Round-trip: pack then read back, all values match within quantization tolerance

### Integration Tests
- Pack 100 organisms + 500 pellets + 20 eggs into a FULL_STATE message, verify total byte count matches expected
- Parse the FULL_STATE message back, verify entity count and type distribution

### QA Checklist
- [ ] All pack functions write directly into pre-allocated buffers (no intermediate allocations)
- [ ] Fixed-point position encoding handles values at world boundaries (0 and 499.99)
- [ ] Clamping applied to all ratio values before encoding (e.g., healthRatio clamped to [0, 1])
- [ ] Reserved bytes set to 0x00
- [ ] Entity type byte is always at offset 2 for all entity types
- [ ] Quantization error is documented: positions ~0.008 units, ratios ~0.4%

---

## Step 6.6: Viewport Culling & Delta Compression

### What You're Implementing
The per-client system that determines which entities to send in each broadcast. For each client, the system: (1) queries the spatial hash for entities within the client's viewport (plus margin), (2) compares packed bytes against the client's `previousEntityBytes` map, and (3) classifies entities as updated, entered (new to viewport), or exited (left viewport). This produces the three lists that go into the DELTA message.

### Design References
- `components/back-end.md` Section 6.6 (Full `broadcastTick` function, viewport culling, delta compression)
- `components/back-end.md` Section 6.6 (`bytesEqual`, `packEnvironmentHeader`, `buildDeltaMessage` functions)
- `components/back-end.md` Section 6.7 (Bandwidth analysis: typical 7 KB/s per client)
- `architecture.md` Section 4.1 (FULL_STATE and DELTA message body layouts)

### Implementation Details

Create `packages/server/src/network/viewport-culler.ts`:

```typescript
const VIEWPORT_MARGIN = 5; // Extra units beyond viewport for smooth scrolling prefetch

export interface CullResult {
  updates: Uint8Array[];  // Entities in viewport that changed bytes
  enters: Uint8Array[];   // Entities newly visible
  exits: number[];        // Entity IDs that left viewport
}

export function cullAndDiff(
  session: ClientSession,
  world: WorldState,
): CullResult;
```

The algorithm:
1. Expand viewport by `VIEWPORT_MARGIN` on all sides
2. Query spatial hash with `queryRect(expandedViewport)` -- handles toroidal wrapping
3. For each visible entity ID:
   a. Pack entity into bytes using the binary encoder from step 6.5
   b. Check `session.previousEntityBytes.get(entityId)`:
      - If not present: entity just entered viewport -> add to `enters`
      - If present but bytes differ: entity changed -> add to `updates`
      - If present and bytes identical: skip (delta compression savings)
   c. Update `session.previousEntityBytes.set(entityId, packed)`
4. For each entry in `previousEntityBytes` not in current visible set: entity exited -> add to `exits`, delete from map
5. Return the three lists

**Spatial hash `queryRect`** (new method needed on the spatial hash):
```typescript
// Returns all entity IDs in cells overlapping the given rectangle
// Handles toroidal wrapping (rectangle can span world edges)
queryRect(rect: { x: number, y: number, width: number, height: number }): number[];
```

**Performance considerations**:
- Pre-allocate a reusable `Set<number>` for the current visible set to avoid creating a new one each broadcast
- `bytesEqual` is a simple loop comparison -- fast for 12-28 byte arrays
- Typical viewport: ~60 organisms + ~200 pellets + ~20 eggs/fungi/spores = ~280 entities
- Delta compression typically skips ~40-50% of entities (unchanged pellets especially)

Create `packages/server/src/network/delta-builder.ts`:

```typescript
export function buildFullStateMessage(
  tick: number,
  envHeader: Uint8Array,
  entities: Uint8Array[],
): ArrayBuffer;

export function buildDeltaMessage(
  tick: number,
  envHeader: Uint8Array,
  updates: Uint8Array[],
  enters: Uint8Array[],
  exits: number[],
): ArrayBuffer;
```

FULL_STATE layout: `[header:3B][tick:u32][env:8B][entityCount:u16][entities...]`
DELTA layout: `[header:3B][tick:u32][env:8B][numUpdated:u16][numEntered:u16][numExited:u16][updated...][entered...][exitIds...]`

### Unit Tests
- Entity inside viewport appears in `enters` on first cull
- Same entity, same bytes on second cull: not in updates or enters
- Entity changes position: appears in `updates`
- Entity leaves viewport: appears in `exits`, removed from previousEntityBytes
- Entity at viewport edge (within margin): included
- Entity just outside margin: excluded
- Toroidal wrapping: viewport at (490, 490) with width 30 includes entities at (5, 5)
- Empty viewport: no updates, enters, or exits
- `bytesEqual` returns true for identical arrays, false for differing single byte

### Integration Tests
- Simulate 3 broadcast cycles with moving organisms: verify correct enter/update/exit classification
- Client connects, sets viewport, receives FULL_STATE, then receives DELTA on next cycle
- Viewport change: old entities exit, new entities enter, overlapping entities update

### QA Checklist
- [ ] Viewport margin (5 units) prevents pop-in at viewport edges during smooth scrolling
- [ ] `previousEntityBytes` is cleared when viewport changes significantly (triggers FULL_STATE)
- [ ] `previousEntityBytes` is cleared on LEAVE_WORLD
- [ ] Toroidal wrapping handled correctly in spatial hash rect query
- [ ] No DELTA message sent if nothing changed (all three lists empty)
- [ ] Memory: `previousEntityBytes` map does not grow unbounded (entities leaving viewport are deleted)

---

## Step 6.7: Broadcast System

### What You're Implementing
The 20 Hz broadcast loop that sends DELTA messages to all connected clients, decoupled from the 40 TPS simulation tick rate. On viewport changes, it sends FULL_STATE instead. This is the main data pipeline from simulation to clients.

### Design References
- `components/back-end.md` Section 1.3 (Broadcast loop: `setInterval` at 50ms, decoupled from tick loop)
- `components/back-end.md` Section 6.6 (broadcastTick iterates sessions, sends per-client culled delta)
- `components/back-end.md` Section 6.7 (Bandwidth analysis: 20 Hz, ~7 KB/s typical per client)
- `architecture.md` Section 4.1 (FULL_STATE: sent on viewport change; DELTA: sent every 50ms)
- `architecture.md` Section 2 Flow B (20 Hz broadcast loop diagram)

### Implementation Details

The broadcast system runs as a `setInterval` at 50ms (20 Hz), independent of the simulation tick timer:

```typescript
// In WorldRoom or WebSocketServer
const BROADCAST_INTERVAL_MS = 50; // 20 Hz

setInterval(() => {
  if (connectedClientCount === 0) return; // Skip if nobody is watching
  broadcastTick(sessions, world);
}, BROADCAST_INTERVAL_MS);
```

`broadcastTick` iterates over all authenticated sessions that have a viewport and are in a world:

```typescript
export function broadcastTick(
  sessions: Map<uWS.WebSocket<ClientData>, ClientSession>,
  world: WorldState,
): void {
  const envHeader = packEnvironmentHeader(world);

  for (const [ws, session] of sessions) {
    if (!session.authenticated || !session.viewport || !session.currentWorldId) continue;

    const { updates, enters, exits } = cullAndDiff(session, world);

    // Skip if nothing to send
    if (updates.length === 0 && enters.length === 0 && exits.length === 0) continue;

    const msg = buildDeltaMessage(world.currentTick, envHeader, updates, enters, exits);
    ws.send(msg, true); // true = binary
  }
}
```

**FULL_STATE sending** (triggered by VIEWPORT handler when viewport changes significantly):

```typescript
export function sendFullState(session: ClientSession, world: WorldState): void {
  session.previousEntityBytes.clear();

  const envHeader = packEnvironmentHeader(world);
  const visibleIds = world.spatialHash.queryRect(expandViewport(session.viewport!, VIEWPORT_MARGIN));

  const entities: Uint8Array[] = [];
  for (const entityId of visibleIds) {
    const packed = world.packEntity(entityId);
    entities.push(packed);
    session.previousEntityBytes.set(entityId, packed);
  }

  const msg = buildFullStateMessage(world.currentTick, envHeader, entities);
  session.ws.send(msg, true);
}
```

**Environment header** is computed once per broadcast cycle (shared across all clients):
```
Byte 0: season (0-3)
Byte 1: seasonProgress (0-255)
Byte 2: ambientLight (0-255, sinusoidal day/night)
Byte 3: activeEvent (0=none, 1=Bloom, 2=Drought, 3=Plague, 4=Migration, 5=Fungi Outbreak, 6=Meteor)
Bytes 4-7: reserved (0x0000)
```

**Bandwidth budget per client** (from design spec):
- Stationary view: ~460 B/broadcast = ~9.2 KB/s
- Slow pan: ~640 B/broadcast = ~12.8 KB/s
- Fast pan: ~990 B/broadcast = ~19.8 KB/s
- Typical average: ~350 B/broadcast = ~7 KB/s
- Total server: 30 clients x 7 KB/s = ~210 KB/s

**Backpressure handling**:
- uWebSockets.js `maxBackpressure: 64 * 1024` means if a client's send buffer exceeds 64 KB (client is too slow to receive), the connection is dropped
- Monitor `ws.getBufferedAmount()` before send; if approaching limit, skip this broadcast for that client rather than disconnecting

**SERVER_SHUTDOWN broadcast**:
```typescript
broadcastServerShutdown(restartInSec: number): void {
  const msg = encodeServerShutdown(0, restartInSec);
  for (const [ws, session] of sessions) {
    ws.send(msg, true);
  }
}
```

### Unit Tests
- Broadcast with 0 connected clients does nothing (no crash)
- Broadcast with 1 client: client receives DELTA message with correct tick
- Broadcast with client that has no viewport: skipped
- Broadcast with client not authenticated: skipped
- FULL_STATE: entity count in message matches spatial hash query result
- Environment header has correct byte values for known season/light state
- SERVER_SHUTDOWN message sent to all connected clients

### Integration Tests
- Connect 5 clients with overlapping viewports, verify each receives their own culled DELTA
- Client A and B have different viewports: verify they receive different entity sets
- Measure actual broadcast rate: should be 20 Hz (+/- 1 Hz) over a 10-second window
- Simulate backpressure: slow client gets dropped, fast clients unaffected
- Full lifecycle: connect -> auth -> join -> viewport -> receive FULL_STATE -> receive 10 DELTAs -> leave -> verify no more broadcasts

### QA Checklist
- [ ] Broadcast loop is `setInterval(50ms)`, not tied to the simulation tick timer
- [ ] Environment header computed once per broadcast, reused for all clients
- [ ] `packEnvironmentHeader` returns exactly 8 bytes
- [ ] Empty DELTA (nothing changed) is not sent (bandwidth savings)
- [ ] Backpressure checked before send to avoid disconnecting slow clients unnecessarily
- [ ] Broadcast skips worlds that are paused or have no clients
- [ ] SERVER_SHUTDOWN message includes restart time estimate

---

## Step 6.8: Admin REST API Router

### What You're Implementing
HTTP REST endpoints under `/api/admin/*` for world management, player management, dev tools, and server metrics. All endpoints require a valid JWT with admin role. The router mounts on the same uWebSockets.js app alongside the WebSocket handler.

### Design References
- `components/back-end.md` Section 10.3 (Complete admin REST API: World CRUD, Lifecycle, Dev Tools, Player Management, Invite Management, Metrics, Debug endpoints)
- `components/back-end.md` Section 10.1 (Health endpoint format)
- `architecture.md` Section 4.4 (Admin REST API overview)
- `architecture.md` Section 7.4 (Rate limiting: 30 admin API requests per minute per admin)
- `architecture.md` Section 7.5 (Admin authorization: role column on players table)

### Implementation Details

Create `packages/server/src/api/admin-router.ts`:

```typescript
export class AdminRouter {
  constructor(
    app: uWS.TemplatedApp,
    worldManager: WorldManager,
    supabase: SupabaseClient,
    config: ServerConfig,
  ) {
    this.registerWorldCrudRoutes(app);
    this.registerWorldLifecycleRoutes(app);
    this.registerDevToolRoutes(app);
    this.registerPlayerManagementRoutes(app);
    this.registerInviteRoutes(app);
    this.registerMetricsRoutes(app);
  }
}
```

**Authentication middleware** (applied to all `/api/admin/*` routes):
1. Extract `Authorization: Bearer <jwt>` header
2. Verify JWT using same `verifySupabaseJWT` from step 6.3
3. Look up player in Supabase, check `role = 'admin'`
4. If not admin, return 403 Forbidden
5. Rate limit: 30 requests per minute per admin (429 Too Many Requests)

**World CRUD**:
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/admin/worlds` | Create world (name, accessType, password, maxPlayers, worldSize, simTps, description) |
| GET | `/api/admin/worlds` | List all worlds with stats |
| GET | `/api/admin/worlds/:id` | World details + connected players |
| PUT | `/api/admin/worlds/:id` | Update world config |
| DELETE | `/api/admin/worlds/:id` | Stop and delete world (requires `?confirm=true`) |

**World Lifecycle**:
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/admin/worlds/:id/start` | Start a stopped world |
| POST | `/api/admin/worlds/:id/pause` | Pause simulation (keep connections) |
| POST | `/api/admin/worlds/:id/resume` | Resume paused simulation |
| POST | `/api/admin/worlds/:id/restart` | Stop + restore from latest snapshot |
| POST | `/api/admin/worlds/:id/reset` | Wipe + re-seed from scratch |

**Dev Tools**:
| Method | Path | Description |
|--------|------|-------------|
| PUT | `/api/admin/worlds/:id/tps` | Change SIM_TPS live (10-200 range) |
| POST | `/api/admin/worlds/:id/snapshot` | Force immediate snapshot |
| GET | `/api/admin/worlds/:id/snapshots` | List available snapshots (last 3 per world) |
| POST | `/api/admin/worlds/:id/restore` | Restore from specific snapshot |

**Player Management**:
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/worlds/:id/players` | List connected players |
| POST | `/api/admin/worlds/:id/kick/:playerId` | Kick + 10x age species |
| POST | `/api/admin/worlds/:id/ban/:playerId` | Ban from world |
| DELETE | `/api/admin/worlds/:id/ban/:playerId` | Unban |
| GET | `/api/admin/worlds/:id/bans` | List bans |
| POST | `/api/admin/players/:playerId/role` | Promote/demote player (cannot demote self) |

**Invite & Access Grant Management**:
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/admin/worlds/:id/invites` | Invite player |
| DELETE | `/api/admin/worlds/:id/invites/:playerId` | Revoke invite |
| GET | `/api/admin/worlds/:id/invites` | List invites |
| POST | `/api/admin/worlds/:id/grants` | Direct grant world access |
| DELETE | `/api/admin/worlds/:id/grants/:playerId` | Revoke access grant |
| GET | `/api/admin/worlds/:id/grants` | List access grants |

**Metrics**:
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/metrics` | Aggregate metrics for all worlds |
| GET | `/api/admin/metrics/:worldId` | Per-world TPS, tick time, entities, energy, species, memory |

**Kick implementation**:
1. Find ClientSession for the player in the WorldRoom
2. Send KICKED message with reason string
3. Apply 10x accelerated ageing to player's species
4. Remove client from WorldRoom (stays WebSocket-connected but world-less)

**Ban implementation**:
1. Insert record into `world_bans` table
2. Delete matching `world_access_grants` entry (revoke access on ban)
3. If player is currently connected, kick them
4. Future JOIN_WORLD attempts check ban table and reject with JOIN_FAIL(BANNED)

**Unban implementation**:
1. Delete from `world_bans`
2. Player must re-enter password or receive new invite to regain access (grant was revoked on ban)

**JSON body parsing with uWebSockets.js**: uWS requires reading the body in chunks via `res.onData()`. Implement a helper:
```typescript
function readJsonBody(res: uWS.HttpResponse): Promise<any> {
  return new Promise((resolve, reject) => {
    let buffer = Buffer.allocUnsafe(0);
    res.onData((chunk, isLast) => {
      buffer = Buffer.concat([buffer, Buffer.from(chunk)]);
      if (isLast) {
        try { resolve(JSON.parse(buffer.toString())); }
        catch (e) { reject(e); }
      }
    });
    res.onAborted(() => reject(new Error('Request aborted')));
  });
}
```

### Unit Tests
- Non-admin JWT returns 403 on all admin endpoints
- Missing Authorization header returns 401
- POST `/api/admin/worlds` creates a world and returns 201 with world details
- GET `/api/admin/worlds` returns list of all worlds with stats
- DELETE `/api/admin/worlds/:id` without `?confirm=true` returns 400
- PUT `/api/admin/worlds/:id/tps` with `tps: 60` updates the world's TPS
- PUT `/api/admin/worlds/:id/tps` with `tps: 500` returns 400 (out of range 10-200)
- POST `.../kick/:playerId` sends KICKED message and removes player from room
- POST `.../ban/:playerId` inserts ban record and kicks if connected
- POST `.../players/:playerId/role` with self-ID returns 400 (cannot demote self)
- Rate limiter: 31st request within 60 seconds returns 429

### Integration Tests
- Create world via API -> verify it appears in WORLD_LIST for connected clients
- Pause world -> verify clients stop receiving DELTA broadcasts but stay connected
- Resume world -> verify DELTA broadcasts resume
- Ban player -> verify they cannot JOIN_WORLD (receive JOIN_FAIL(BANNED))
- Unban player -> verify they can JOIN_WORLD again (after re-entering password)
- Force snapshot -> verify snapshot appears in Supabase
- Restore snapshot -> verify world state rolls back

### QA Checklist
- [ ] All endpoints require admin JWT authentication
- [ ] Rate limiting applied per-admin (30/min), not globally
- [ ] JSON body parsing handles aborted requests gracefully
- [ ] World DELETE requires explicit `?confirm=true` query parameter
- [ ] TPS change range validated: [10, 200]
- [ ] Kick sends KICKED message before removing from room
- [ ] Ban revokes access grants and kicks if online
- [ ] Cannot demote yourself (prevents last-admin lockout)
- [ ] All mutation endpoints return proper HTTP status codes (201, 200, 400, 403, 404, 429)
- [ ] CORS headers set for admin panel access from client SPA origin
