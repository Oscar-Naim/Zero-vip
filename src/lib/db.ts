import { Pool } from 'pg';
import { AccessKey, TokenAuditLog, TokenStatus, TokenTier, MetricSummary } from '@/types';
import { generateLyaxisToken } from './crypto';

// Singleton Pool connection for Vercel Serverless / Node runtime
let pgPool: Pool | null = null;

function getPostgresUrl(): string | null {
  return (
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL ||
    null
  );
}

export function isPostgresConfigured(): boolean {
  return Boolean(getPostgresUrl());
}

function getPool(): Pool | null {
  const url = getPostgresUrl();
  if (!url) return null;

  if (!pgPool) {
    pgPool = new Pool({
      connectionString: url,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pgPool;
}

// In-Memory Fallback Store (Used when running locally before linking Vercel Postgres)
class InMemoryStore {
  private keys: Map<string, AccessKey> = new Map();
  private auditLogs: TokenAuditLog[] = [];

  constructor() {
    this.seedDefaults();
  }

  private seedDefaults() {
    // Seed initial inaugural key for testing if empty
    const inauguralToken = 'LYX-VIP-001';
    const id = '00000000-0000-0000-0000-000000000001';
    this.keys.set(inauguralToken, {
      id,
      token: inauguralToken,
      tier: 'zero_vip_30',
      status: 'active',
      max_uses: 1,
      current_uses: 0,
      assigned_to_name: 'Oscar Naim Ambrocio Aguirre',
      assigned_to_email: 'founder@lyaxis.labs',
      notes: 'Llave inaugural de prueba del Fundador',
      created_at: new Date().toISOString(),
      claimed_at: null,
      expires_at: null,
      created_by: 'Oscar Naim (Founder)',
    });
  }

  async getAllKeys(filters?: {
    search?: string;
    tier?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ keys: AccessKey[]; total: number }> {
    let list = Array.from(this.keys.values());

    if (filters?.tier && filters.tier !== 'all') {
      list = list.filter((k) => k.tier === filters.tier);
    }
    if (filters?.status && filters.status !== 'all') {
      list = list.filter((k) => k.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (k) =>
          k.token.toLowerCase().includes(q) ||
          k.assigned_to_name?.toLowerCase().includes(q) ||
          k.assigned_to_email?.toLowerCase().includes(q) ||
          k.notes?.toLowerCase().includes(q)
      );
    }

    list.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const total = list.length;
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const start = (page - 1) * limit;
    const paginated = list.slice(start, start + limit);

    return { keys: paginated, total };
  }

  async getKeyByToken(token: string): Promise<AccessKey | null> {
    return this.keys.get(token) || null;
  }

  async getKeyById(id: string): Promise<AccessKey | null> {
    for (const key of this.keys.values()) {
      if (key.id === id) return key;
    }
    return null;
  }

  async insertKey(key: AccessKey): Promise<AccessKey> {
    this.keys.set(key.token, key);
    return key;
  }

  async updateKey(id: string, updates: Partial<AccessKey>): Promise<AccessKey | null> {
    const existing = await this.getKeyById(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    this.keys.set(updated.token, updated);
    return updated;
  }

  async deleteKey(id: string): Promise<boolean> {
    const existing = await this.getKeyById(id);
    if (!existing) return false;
    this.keys.delete(existing.token);
    return true;
  }

  async getMetrics(): Promise<MetricSummary> {
    const all = Array.from(this.keys.values());
    let active = 0;
    let claimed = 0;
    let revoked = 0;
    let expired = 0;
    let zeroVip = 0;
    let totalUses = 0;

    for (const k of all) {
      if (k.status === 'active') active++;
      if (k.status === 'claimed') claimed++;
      if (k.status === 'revoked') revoked++;
      if (k.status === 'expired') expired++;
      if (k.tier === 'zero_vip_30') zeroVip++;
      totalUses += k.current_uses;
    }

    return {
      total_keys: all.length,
      active_keys: active,
      claimed_keys: claimed,
      revoked_keys: revoked,
      expired_keys: expired,
      zero_vip_count: zeroVip,
      zero_vip_max: 30,
      total_uses: totalUses,
    };
  }

  async addAuditLog(log: Omit<TokenAuditLog, 'id' | 'created_at'>): Promise<TokenAuditLog> {
    const entry: TokenAuditLog = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      ...log,
    };
    this.auditLogs.unshift(entry);
    return entry;
  }

  async getAuditLogs(limit: number = 50, tokenId?: string): Promise<TokenAuditLog[]> {
    if (tokenId) {
      return this.auditLogs.filter((l) => l.token_id === tokenId).slice(0, limit);
    }
    return this.auditLogs.slice(0, limit);
  }
}

// Global in-memory singleton
const memStore = new InMemoryStore();

/**
 * Migration script that ensures Postgres tables and indexes exist.
 */
export async function ensureDatabaseSchema(): Promise<{ success: boolean; message: string }> {
  const pool = getPool();
  if (!pool) {
    return {
      success: true,
      message: 'Running in safe local emulation mode. Connect Vercel Postgres to activate cloud DB.',
    };
  }

  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS access_keys (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        token VARCHAR(11) UNIQUE NOT NULL,
        tier VARCHAR(50) NOT NULL DEFAULT 'early_access',
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        max_uses INT NOT NULL DEFAULT 1,
        current_uses INT NOT NULL DEFAULT 0,
        assigned_to_name VARCHAR(150),
        assigned_to_email VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        claimed_at TIMESTAMP WITH TIME ZONE,
        expires_at TIMESTAMP WITH TIME ZONE,
        created_by VARCHAR(100) DEFAULT 'Oscar Naim (Founder)'
      );

      CREATE TABLE IF NOT EXISTS token_audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        token_id UUID REFERENCES access_keys(id) ON DELETE CASCADE,
        token_text VARCHAR(11) NOT NULL,
        ip_hash VARCHAR(64) NOT NULL,
        action VARCHAR(50) NOT NULL,
        success BOOLEAN NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_token_lookup ON access_keys(token);
      CREATE INDEX IF NOT EXISTS idx_token_status ON access_keys(status);
      CREATE INDEX IF NOT EXISTS idx_token_tier ON access_keys(tier);
      CREATE INDEX IF NOT EXISTS idx_audit_created ON token_audit_logs(created_at DESC);
    `);
    return { success: true, message: 'Vercel Postgres schema verified and operational.' };
  } catch (err: any) {
    console.error('Error running migrations on Vercel Postgres:', err);
    return { success: false, message: err.message };
  } finally {
    client.release();
  }
}

/**
 * Get all keys with search, tier, status filtering, and pagination.
 */
export async function getAccessKeys(filters?: {
  search?: string;
  tier?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ keys: AccessKey[]; total: number }> {
  const pool = getPool();
  if (!pool) {
    return memStore.getAllKeys(filters);
  }

  const conditions: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (filters?.tier && filters.tier !== 'all') {
    conditions.push(`tier = $${paramIndex++}`);
    values.push(filters.tier);
  }

  if (filters?.status && filters.status !== 'all') {
    conditions.push(`status = $${paramIndex++}`);
    values.push(filters.status);
  }

  if (filters?.search) {
    const q = `%${filters.search}%`;
    conditions.push(
      `(token ILIKE $${paramIndex} OR assigned_to_name ILIKE $${paramIndex} OR assigned_to_email ILIKE $${paramIndex} OR notes ILIKE $${paramIndex})`
    );
    values.push(q);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countQuery = `SELECT COUNT(*) AS total FROM access_keys ${whereClause}`;
  const countRes = await pool.query(countQuery, values);
  const total = parseInt(countRes.rows[0]?.total || '0', 10);

  const page = Math.max(1, filters?.page || 1);
  const limit = Math.max(1, filters?.limit || 50);
  const offset = (page - 1) * limit;

  const dataQuery = `
    SELECT id, token, tier, status, max_uses, current_uses, 
           assigned_to_name, assigned_to_email, notes,
           created_at, claimed_at, expires_at, created_by
    FROM access_keys
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;
  values.push(limit, offset);

  const res = await pool.query(dataQuery, values);
  return { keys: res.rows, total };
}

/**
 * Get Key by token string
 */
export async function getKeyByToken(token: string): Promise<AccessKey | null> {
  const pool = getPool();
  if (!pool) {
    return memStore.getKeyByToken(token);
  }
  const res = await pool.query('SELECT * FROM access_keys WHERE token = $1', [token]);
  return res.rows[0] || null;
}

/**
 * Get Key by UUID
 */
export async function getKeyById(id: string): Promise<AccessKey | null> {
  const pool = getPool();
  if (!pool) {
    return memStore.getKeyById(id);
  }
  const res = await pool.query('SELECT * FROM access_keys WHERE id = $1', [id]);
  return res.rows[0] || null;
}

/**
 * Insert a new access key
 */
export async function createAccessKey(data: {
  token: string;
  tier: TokenTier;
  max_uses?: number;
  assigned_to_name?: string | null;
  assigned_to_email?: string | null;
  notes?: string | null;
  expires_at?: string | null;
  created_by?: string;
}): Promise<AccessKey> {
  const pool = getPool();
  if (!pool) {
    const newKey: AccessKey = {
      id: crypto.randomUUID(),
      token: data.token,
      tier: data.tier,
      status: 'active',
      max_uses: data.max_uses ?? 1,
      current_uses: 0,
      assigned_to_name: data.assigned_to_name || null,
      assigned_to_email: data.assigned_to_email || null,
      notes: data.notes || null,
      created_at: new Date().toISOString(),
      claimed_at: null,
      expires_at: data.expires_at || null,
      created_by: data.created_by || 'Oscar Naim (Founder)',
    };
    return memStore.insertKey(newKey);
  }

  const query = `
    INSERT INTO access_keys (
      token, tier, max_uses, assigned_to_name, assigned_to_email, notes, expires_at, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  const values = [
    data.token,
    data.tier,
    data.max_uses ?? 1,
    data.assigned_to_name || null,
    data.assigned_to_email || null,
    data.notes || null,
    data.expires_at || null,
    data.created_by || 'Oscar Naim (Founder)',
  ];

  const res = await pool.query(query, values);
  return res.rows[0];
}

/**
 * Generate a unique, collision-guaranteed token and persist it
 */
export async function generateUniqueKey(data: {
  tier: TokenTier;
  max_uses?: number;
  assigned_to_name?: string | null;
  assigned_to_email?: string | null;
  notes?: string | null;
  expires_at?: string | null;
  created_by?: string;
}): Promise<AccessKey> {
  let attempts = 0;
  while (attempts < 10) {
    const token = generateLyaxisToken();
    const existing = await getKeyByToken(token);
    if (!existing) {
      return await createAccessKey({ ...data, token });
    }
    attempts++;
  }
  throw new Error('Collision resolution exceeded maximum attempts for token generation.');
}

/**
 * Update key status, notes, or reset current_uses
 */
export async function updateAccessKey(
  id: string,
  updates: Partial<AccessKey>
): Promise<AccessKey | null> {
  const pool = getPool();
  if (!pool) {
    return memStore.updateKey(id, updates);
  }

  const fields: string[] = [];
  const values: any[] = [];
  let index = 1;

  if (updates.status !== undefined) {
    fields.push(`status = $${index++}`);
    values.push(updates.status);
  }
  if (updates.current_uses !== undefined) {
    fields.push(`current_uses = $${index++}`);
    values.push(updates.current_uses);
  }
  if (updates.notes !== undefined) {
    fields.push(`notes = $${index++}`);
    values.push(updates.notes);
  }
  if (updates.assigned_to_name !== undefined) {
    fields.push(`assigned_to_name = $${index++}`);
    values.push(updates.assigned_to_name);
  }
  if (updates.assigned_to_email !== undefined) {
    fields.push(`assigned_to_email = $${index++}`);
    values.push(updates.assigned_to_email);
  }
  if (updates.claimed_at !== undefined) {
    fields.push(`claimed_at = $${index++}`);
    values.push(updates.claimed_at);
  }

  if (fields.length === 0) return null;

  values.push(id);
  const query = `
    UPDATE access_keys
    SET ${fields.join(', ')}
    WHERE id = $${index}
    RETURNING *
  `;

  const res = await pool.query(query, values);
  return res.rows[0] || null;
}

/**
 * Delete key
 */
export async function deleteAccessKey(id: string): Promise<boolean> {
  const pool = getPool();
  if (!pool) {
    return memStore.deleteKey(id);
  }
  const res = await pool.query('DELETE FROM access_keys WHERE id = $1', [id]);
  return (res.rowCount || 0) > 0;
}

/**
 * Fetch metrics summary
 */
export async function getMetricsSummary(): Promise<MetricSummary> {
  const pool = getPool();
  if (!pool) {
    return memStore.getMetrics();
  }

  const query = `
    SELECT
      COUNT(*) AS total_keys,
      COUNT(CASE WHEN status = 'active' THEN 1 END) AS active_keys,
      COUNT(CASE WHEN status = 'claimed' THEN 1 END) AS claimed_keys,
      COUNT(CASE WHEN status = 'revoked' THEN 1 END) AS revoked_keys,
      COUNT(CASE WHEN status = 'expired' THEN 1 END) AS expired_keys,
      COUNT(CASE WHEN tier = 'zero_vip_30' THEN 1 END) AS zero_vip_count,
      COALESCE(SUM(current_uses), 0) AS total_uses
    FROM access_keys
  `;

  const res = await pool.query(query);
  const row = res.rows[0] || {};

  return {
    total_keys: parseInt(row.total_keys || '0', 10),
    active_keys: parseInt(row.active_keys || '0', 10),
    claimed_keys: parseInt(row.claimed_keys || '0', 10),
    revoked_keys: parseInt(row.revoked_keys || '0', 10),
    expired_keys: parseInt(row.expired_keys || '0', 10),
    zero_vip_count: parseInt(row.zero_vip_count || '0', 10),
    zero_vip_max: 30,
    total_uses: parseInt(row.total_uses || '0', 10),
  };
}

/**
 * Log an audit action into token_audit_logs
 */
export async function logAudit(data: {
  tokenId?: string | null;
  tokenText: string;
  ipHash: string;
  action: 'VERIFIED' | 'CLAIMED' | 'REVOKED' | 'RESET' | 'FAILED';
  success: boolean;
  metadata?: Record<string, any> | null;
}): Promise<TokenAuditLog> {
  const pool = getPool();
  if (!pool) {
    return memStore.addAuditLog({
      token_id: data.tokenId || null,
      token_text: data.tokenText,
      ip_hash: data.ipHash,
      action: data.action,
      success: data.success,
      metadata: data.metadata || null,
    });
  }

  const query = `
    INSERT INTO token_audit_logs (token_id, token_text, ip_hash, action, success, metadata)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const values = [
    data.tokenId || null,
    data.tokenText,
    data.ipHash,
    data.action,
    data.success,
    data.metadata ? JSON.stringify(data.metadata) : null,
  ];

  const res = await pool.query(query, values);
  return res.rows[0];
}

/**
 * Retrieve recent forensic audit logs
 */
export async function getAuditLogs(limit: number = 50, tokenId?: string): Promise<TokenAuditLog[]> {
  const pool = getPool();
  if (!pool) {
    return memStore.getAuditLogs(limit, tokenId);
  }

  if (tokenId) {
    const res = await pool.query(
      `SELECT * FROM token_audit_logs WHERE token_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [tokenId, limit]
    );
    return res.rows;
  }

  const res = await pool.query(
    `SELECT * FROM token_audit_logs ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
  return res.rows;
}

/**
 * ATOMIC VERIFY & CLAIM (Postgres Transaction with FOR UPDATE lock)
 * Requirement 5: POST /api/v1/keys/verify
 * Atomic SQL action: Checks validity, increments current_uses, sets to 'claimed' if max_uses reached,
 * and records in token_audit_logs.
 */
export async function atomicVerifyAndClaim(
  token: string,
  ipHash: string,
  metadata?: Record<string, any>
): Promise<
  | { success: true; key: AccessKey }
  | { success: false; reason: string; key?: AccessKey | null }
> {
  const pool = getPool();

  if (!pool) {
    // In-memory atomic emulation
    const key = await memStore.getKeyByToken(token);
    if (!key) {
      await memStore.addAuditLog({
        token_id: null,
        token_text: token,
        ip_hash: ipHash,
        action: 'FAILED',
        success: false,
        metadata: { reason: 'TOKEN_INVALID_OR_NOT_FOUND', ...metadata },
      });
      return { success: false, reason: 'TOKEN_INVALID_OR_NOT_FOUND' };
    }

    if (key.status === 'revoked') {
      await memStore.addAuditLog({
        token_id: key.id,
        token_text: token,
        ip_hash: ipHash,
        action: 'FAILED',
        success: false,
        metadata: { reason: 'TOKEN_REVOKED', ...metadata },
      });
      return { success: false, reason: 'TOKEN_REVOKED', key };
    }

    if (key.expires_at && new Date(key.expires_at) < new Date()) {
      await memStore.updateKey(key.id, { status: 'expired' });
      await memStore.addAuditLog({
        token_id: key.id,
        token_text: token,
        ip_hash: ipHash,
        action: 'FAILED',
        success: false,
        metadata: { reason: 'TOKEN_EXPIRED', ...metadata },
      });
      return { success: false, reason: 'TOKEN_EXPIRED', key };
    }

    if (key.current_uses >= key.max_uses || key.status === 'claimed') {
      await memStore.addAuditLog({
        token_id: key.id,
        token_text: token,
        ip_hash: ipHash,
        action: 'FAILED',
        success: false,
        metadata: { reason: 'TOKEN_EXHAUSTED', ...metadata },
      });
      return { success: false, reason: 'TOKEN_EXHAUSTED', key };
    }

    // Atomic increment
    const newUses = key.current_uses + 1;
    const isNowClaimed = newUses >= key.max_uses;
    const updatedKey = await memStore.updateKey(key.id, {
      current_uses: newUses,
      status: isNowClaimed ? 'claimed' : 'active',
      claimed_at: isNowClaimed ? new Date().toISOString() : key.claimed_at,
    });

    const action = isNowClaimed ? 'CLAIMED' : 'VERIFIED';
    await memStore.addAuditLog({
      token_id: key.id,
      token_text: token,
      ip_hash: ipHash,
      action,
      success: true,
      metadata: { new_uses: newUses, max_uses: key.max_uses, ...metadata },
    });

    return { success: true, key: updatedKey! };
  }

  // Postgres Atomic Transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Row-level lock (FOR UPDATE)
    const selectRes = await client.query(
      `SELECT * FROM access_keys WHERE token = $1 FOR UPDATE`,
      [token]
    );

    if (selectRes.rows.length === 0) {
      await client.query(
        `INSERT INTO token_audit_logs (token_text, ip_hash, action, success, metadata)
         VALUES ($1, $2, 'FAILED', false, $3)`,
        [token, ipHash, JSON.stringify({ reason: 'TOKEN_INVALID_OR_NOT_FOUND', ...metadata })]
      );
      await client.query('COMMIT');
      return { success: false, reason: 'TOKEN_INVALID_OR_NOT_FOUND' };
    }

    const key: AccessKey = selectRes.rows[0];

    if (key.status === 'revoked') {
      await client.query(
        `INSERT INTO token_audit_logs (token_id, token_text, ip_hash, action, success, metadata)
         VALUES ($1, $2, 'FAILED', false, $3)`,
        [key.id, token, JSON.stringify({ reason: 'TOKEN_REVOKED', ...metadata })]
      );
      await client.query('COMMIT');
      return { success: false, reason: 'TOKEN_REVOKED', key };
    }

    if (key.expires_at && new Date(key.expires_at) < new Date()) {
      await client.query(
        `UPDATE access_keys SET status = 'expired' WHERE id = $1`,
        [key.id]
      );
      await client.query(
        `INSERT INTO token_audit_logs (token_id, token_text, ip_hash, action, success, metadata)
         VALUES ($1, $2, 'FAILED', false, $3)`,
        [key.id, token, JSON.stringify({ reason: 'TOKEN_EXPIRED', ...metadata })]
      );
      await client.query('COMMIT');
      return { success: false, reason: 'TOKEN_EXPIRED', key };
    }

    if (key.current_uses >= key.max_uses || key.status === 'claimed') {
      await client.query(
        `INSERT INTO token_audit_logs (token_id, token_text, ip_hash, action, success, metadata)
         VALUES ($1, $2, 'FAILED', false, $3)`,
        [key.id, token, JSON.stringify({ reason: 'TOKEN_EXHAUSTED', ...metadata })]
      );
      await client.query('COMMIT');
      return { success: false, reason: 'TOKEN_EXHAUSTED', key };
    }

    // Atomic increment
    const newUses = key.current_uses + 1;
    const isNowClaimed = newUses >= key.max_uses;
    const newStatus = isNowClaimed ? 'claimed' : 'active';
    const claimedAtClause = isNowClaimed ? ', claimed_at = CURRENT_TIMESTAMP' : '';

    const updateRes = await client.query(
      `UPDATE access_keys
       SET current_uses = $1, status = $2 ${claimedAtClause}
       WHERE id = $3
       RETURNING *`,
      [newUses, newStatus, key.id]
    );

    const action = isNowClaimed ? 'CLAIMED' : 'VERIFIED';
    await client.query(
      `INSERT INTO token_audit_logs (token_id, token_text, ip_hash, action, success, metadata)
       VALUES ($1, $2, $3, true, $4)`,
      [
        key.id,
        token,
        action,
        JSON.stringify({ new_uses: newUses, max_uses: key.max_uses, ...metadata }),
      ]
    );

    await client.query('COMMIT');
    return { success: true, key: updateRes.rows[0] };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error during atomic verify and claim:', err);
    throw err;
  } finally {
    client.release();
  }
}
