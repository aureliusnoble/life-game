import type { AuthFailReason, JoinFailReason, DeployStatus } from '../enums.js';
import type { EnvironmentHeader, Viewport, WorldSummary } from './world.js';

// ── Client → Server Message Payloads ──

export interface AuthMessage {
  jwt: Uint8Array;
}

export interface ViewportMessage {
  viewport: Viewport;
}

export interface JoinWorldMessage {
  worldId: string; // UUID (16 bytes)
  password?: string;
}

export interface DeployMessage {
  designId: string; // UUID (16 bytes)
}

// ── Server → Client Message Payloads ──

export interface AuthOkMessage {
  playerId: number; // u16
  serverTick: number; // u32
}

export interface AuthFailMessage {
  reason: AuthFailReason;
}

export interface WorldListMessage {
  worlds: WorldSummary[];
}

export interface JoinOkMessage {
  worldId: string;
  playerCount: number;
  tick: number;
}

export interface JoinFailMessage {
  reason: JoinFailReason;
}

export interface KickedMessage {
  reason: number;
  message: string;
}

export interface FullStateMessage {
  tick: number;
  environment: EnvironmentHeader;
  entityCount: number;
  entityData: ArrayBuffer;
}

export interface DeltaMessage {
  tick: number;
  environment: EnvironmentHeader;
  updates: number;
  enters: number;
  exits: number;
  data: ArrayBuffer;
}

export interface BiomeMapMessage {
  gridResolution: number;
  data: Uint8Array; // gridRes^2 biome bytes
}

export interface DeployAckMessage {
  speciesId: number;
  status: DeployStatus;
}

export interface EventWarningMessage {
  eventType: number;
  secondsUntil: number;
}

export interface PongMessage {
  serverTick: number;
}

export interface WorldEventMessage {
  eventType: number;
  payload: ArrayBuffer;
}

export interface ServerShutdownMessage {
  reason: number;
  restartInSeconds: number;
}
