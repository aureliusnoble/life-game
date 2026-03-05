/**
 * Integration tests for Supabase schema: triggers, RLS policies, RPC functions.
 * Runs against the REMOTE Supabase instance using real credentials from .env.
 *
 * These tests create a temporary test user, verify database behavior, then clean up.
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL ?? '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? '';

// Skip all tests if credentials aren't configured
const hasCredentials = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && SUPABASE_ANON_KEY;

describe.skipIf(!hasCredentials)('Supabase Integration', () => {
  let adminClient: SupabaseClient; // service_role — bypasses RLS
  let testUserId: string;
  let testUserEmail: string;
  let testUserAccessToken: string;

  beforeAll(async () => {
    adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Create a temporary test user
    testUserEmail = `test-${Date.now()}@life-game-test.local`;
    const { data: authData, error: authError } =
      await adminClient.auth.admin.createUser({
        email: testUserEmail,
        password: 'test-password-12345',
        email_confirm: true,
      });

    if (authError) throw new Error(`Failed to create test user: ${authError.message}`);
    testUserId = authData.user.id;

    // Sign in as the test user to get an access token for RLS testing
    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: signInData, error: signInError } =
      await anonClient.auth.signInWithPassword({
        email: testUserEmail,
        password: 'test-password-12345',
      });
    if (signInError) throw new Error(`Failed to sign in test user: ${signInError.message}`);
    testUserAccessToken = signInData.session.access_token;
  });

  afterAll(async () => {
    if (!testUserId) return;
    // Clean up: delete player row (CASCADE should handle related data)
    // Then delete the auth user
    await adminClient.from('players').delete().eq('id', testUserId);
    await adminClient.auth.admin.deleteUser(testUserId);
  });

  // ── Trigger Tests ──

  describe('handle_new_user trigger', () => {
    it('auto-creates a player row when auth user is created', async () => {
      const { data, error } = await adminClient
        .from('players')
        .select('*')
        .eq('id', testUserId)
        .single();

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data!.id).toBe(testUserId);
      expect(data!.display_name).toBe('Player'); // default
      expect(data!.role).toBe('player');
      expect(data!.unlocked_tier).toBe(1);
      expect(data!.evolution_points).toBe(0);
    });
  });

  describe('update_updated_at trigger', () => {
    it('updates the updated_at timestamp on player modification', async () => {
      // Read current updated_at
      const { data: before } = await adminClient
        .from('players')
        .select('updated_at')
        .eq('id', testUserId)
        .single();

      // Small delay to ensure timestamp difference
      await new Promise((r) => setTimeout(r, 100));

      // Update a field
      await adminClient
        .from('players')
        .update({ display_name: 'TestPlayer' })
        .eq('id', testUserId);

      const { data: after } = await adminClient
        .from('players')
        .select('updated_at')
        .eq('id', testUserId)
        .single();

      expect(new Date(after!.updated_at).getTime()).toBeGreaterThan(
        new Date(before!.updated_at).getTime(),
      );
    });
  });

  // ── RLS Policy Tests ──

  describe('RLS policies', () => {
    let userClient: SupabaseClient; // authenticated as test user

    beforeAll(() => {
      userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: { Authorization: `Bearer ${testUserAccessToken}` } },
      });
    });

    it('player can read own profile', async () => {
      const { data, error } = await userClient
        .from('players')
        .select('id, display_name')
        .eq('id', testUserId)
        .single();

      expect(error).toBeNull();
      expect(data!.id).toBe(testUserId);
    });

    it('player cannot read other players', async () => {
      // Query all players — should only return own row
      const { data } = await userClient.from('players').select('id');
      expect(data).not.toBeNull();
      expect(data!.length).toBe(1);
      expect(data![0].id).toBe(testUserId);
    });

    it('player can update own display_name', async () => {
      const { error } = await userClient
        .from('players')
        .update({ display_name: 'NewName' })
        .eq('id', testUserId);

      expect(error).toBeNull();

      // Verify it changed
      const { data } = await userClient
        .from('players')
        .select('display_name')
        .eq('id', testUserId)
        .single();
      expect(data!.display_name).toBe('NewName');
    });

    it('player can insert own species design', async () => {
      const { data, error } = await userClient
        .from('species_designs')
        .insert({
          player_id: testUserId,
          species_name: 'TestSpecies',
          version: 1,
          body: { sizeRatio: 1.0, speedRatio: 1.0, strength: 0.5 },
          brain: { nodes: [], synapses: [] },
          traits: {},
          deployment: { biome: null, founderCount: 1 },
          bp_total: 20,
        })
        .select('id')
        .single();

      expect(error).toBeNull();
      expect(data).not.toBeNull();

      // Clean up
      if (data) {
        await adminClient.from('species_designs').delete().eq('id', data.id);
      }
    });

    it('player cannot insert species design for another player', async () => {
      const { error } = await userClient
        .from('species_designs')
        .insert({
          player_id: '00000000-0000-0000-0000-000000000000', // fake ID
          species_name: 'HackSpecies',
          version: 1,
          body: {},
          brain: { nodes: [], synapses: [] },
          traits: {},
          deployment: { biome: null, founderCount: 1 },
          bp_total: 20,
        });

      expect(error).not.toBeNull();
    });

    it('non-admin cannot insert worlds', async () => {
      const { error } = await userClient
        .from('worlds')
        .insert({
          name: 'HackWorld',
          created_by: testUserId,
        });

      expect(error).not.toBeNull();
    });
  });

  // ── RPC Function Tests ──

  describe('RPC functions', () => {
    it('get_player_status returns valid JSON for test user', async () => {
      const { data, error } = await adminClient.rpc('get_player_status', {
        p_player_id: testUserId,
      });

      expect(error).toBeNull();
      expect(data).toHaveProperty('has_active_species', false);
      expect(data).toHaveProperty('pending_mutations', 0);
    });

    it('validate_design returns valid result', async () => {
      const { data, error } = await adminClient.rpc('validate_design', {
        design_json: { body: { sizeRatio: 1.0 }, brain: { nodes: [], synapses: [] } },
        player_id: testUserId,
      });

      expect(error).toBeNull();
      expect(data).toHaveProperty('valid', true);
      expect(data).toHaveProperty('player_tier', 1);
    });

    it('expire_stale_mutations returns integer', async () => {
      const { data, error } = await adminClient.rpc('expire_stale_mutations');

      expect(error).toBeNull();
      expect(typeof data).toBe('number');
    });
  });

  // ── Foreign Key / Constraint Tests ──

  describe('constraints', () => {
    it('player display_name must be 2-24 chars', async () => {
      const { error: tooShort } = await adminClient
        .from('players')
        .update({ display_name: 'A' })
        .eq('id', testUserId);
      expect(tooShort).not.toBeNull();

      const { error: tooLong } = await adminClient
        .from('players')
        .update({ display_name: 'A'.repeat(25) })
        .eq('id', testUserId);
      expect(tooLong).not.toBeNull();

      // Valid boundary values
      const { error: minOk } = await adminClient
        .from('players')
        .update({ display_name: 'AB' })
        .eq('id', testUserId);
      expect(minOk).toBeNull();

      const { error: maxOk } = await adminClient
        .from('players')
        .update({ display_name: 'A'.repeat(24) })
        .eq('id', testUserId);
      expect(maxOk).toBeNull();
    });

    it('evolution_points cannot be negative', async () => {
      const { error } = await adminClient
        .from('players')
        .update({ evolution_points: -1 })
        .eq('id', testUserId);
      expect(error).not.toBeNull();
    });

    it('unlocked_tier must be 1-4', async () => {
      const { error: below } = await adminClient
        .from('players')
        .update({ unlocked_tier: 0 })
        .eq('id', testUserId);
      expect(below).not.toBeNull();

      const { error: above } = await adminClient
        .from('players')
        .update({ unlocked_tier: 5 })
        .eq('id', testUserId);
      expect(above).not.toBeNull();
    });
  });
});
