import 'server-only';

import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg';

declare global {
  var __yahnuPostgresPool: Pool | undefined;
}

function databaseUrl() {
  const value = process.env.DATABASE_POOL_URL ?? process.env.DATABASE_URL;
  if (!value) throw new Error('DATABASE_URL is not configured.');
  return value;
}

function sslConfig() {
  const sslMode = process.env.PGSSLMODE?.toLowerCase();
  if (sslMode === 'require' || sslMode === 'verify-ca' || sslMode === 'verify-full') {
    return { rejectUnauthorized: sslMode !== 'require' };
  }
  return undefined;
}

export function getPool() {
  if (!globalThis.__yahnuPostgresPool) {
    const ssl = sslConfig();
    globalThis.__yahnuPostgresPool = new Pool({
      connectionString: databaseUrl(),
      ...(ssl ? { ssl } : {}),
      max: Number.parseInt(process.env.DATABASE_POOL_MAX ?? '10', 10),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      maxUses: 7_500,
      application_name: 'yahnu-web',
    });

    globalThis.__yahnuPostgresPool.on('error', (error) => {
      console.error('Unexpected PostgreSQL pool error:', error.message);
    });
  }

  return globalThis.__yahnuPostgresPool;
}

export function query<T extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []): Promise<QueryResult<T>> {
  return getPool().query<T>(text, values);
}

export async function transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function checkDatabase(timeoutMs = 2_500) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Database health check timed out.')), timeoutMs);
    timer.unref?.();
  });
  try {
    await Promise.race([query('SELECT 1 FROM users LIMIT 1'), timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
