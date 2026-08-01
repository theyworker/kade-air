import { readFileSync } from 'node:fs';
import path from 'node:path';
import { neon } from '@neondatabase/serverless';
import { DATABASE_URL } from '../lib/env';

// One table does not justify a migration framework. This applies schema.sql,
// which is written to be idempotent (`create table if not exists`).
async function main() {
  const sql = neon(DATABASE_URL);
  const schema = readFileSync(path.join(process.cwd(), 'db', 'schema.sql'), 'utf8');
  await sql.query(schema);
  console.log('Schema applied.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
