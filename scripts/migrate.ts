import { readFileSync } from 'node:fs';
import path from 'node:path';
import { neon } from '@neondatabase/serverless';
import { env } from '../lib/env';

/**
 * Splits schema.sql into the statements the driver will accept one at a time.
 *
 * The split is on `;` and nothing cleverer, which is why db/schema.sql is
 * written to contain none inside a literal. Chunks that are only comments —
 * the trailing text after the last statement's semicolon — are dropped;
 * comments attached above a statement travel with it, which Postgres accepts.
 */
export function statements(schema: string): string[] {
  return schema
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.replace(/--[^\n]*/g, '').trim().length > 0);
}

// One table does not justify a migration framework. This applies schema.sql,
// which is written to be idempotent — `create table if not exists` for the
// table, `add column if not exists` for everything added since.
async function main() {
  const sql = neon(env.DATABASE_URL);
  const schema = readFileSync(path.join(process.cwd(), 'db', 'schema.sql'), 'utf8');

  // Sequential, not a transaction: each statement is idempotent on its own, so
  // a run that dies halfway is fixed by running it again.
  const pending = statements(schema);
  for (const statement of pending) {
    await sql.query(statement);
  }

  console.log(`Schema applied (${pending.length} statements).`);
}

// Importing this module for its `statements` export must not run a migration.
if (process.argv[1] && import.meta.url === `file://${path.resolve(process.argv[1])}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
