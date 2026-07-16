import 'server-only';

import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg';
import { runtimeDatabaseConfig } from './database-config.mjs';

declare global {
  var __yahnuPostgresPool: Pool | undefined;
}

export function getPool() {
  if (!globalThis.__yahnuPostgresPool) {
    const database = runtimeDatabaseConfig();
    globalThis.__yahnuPostgresPool = new Pool({
      connectionString: database.connectionString,
      // Always supply an explicit value to prevent node-postgres from applying
      // PGSSLMODE (including its insecure no-verify compatibility mode) behind us.
      ssl: database.ssl,
      max: database.max,
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
