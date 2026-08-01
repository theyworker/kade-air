import { neon } from '@neondatabase/serverless';
import { env } from './env';
import type { Order } from './order';

export type StoredOrder = Order & { code: string; revokedAt: Date | null };

export type OrderStore = {
  insert(row: Order & { code: string }): Promise<void>;
  findByCode(code: string): Promise<StoredOrder | null>;
};

// Thrown when the generated code collided with an existing primary key.
// The caller's move is to generate a new code and retry, not to give up.
export class DuplicateCodeError extends Error {
  constructor(code: string) {
    super(`Share code ${code} already exists`);
    this.name = 'DuplicateCodeError';
  }
}

let client: ReturnType<typeof neon> | null = null;
const sql = () => (client ??= neon(env.DATABASE_URL));

// Postgres unique-violation SQLSTATE.
const UNIQUE_VIOLATION = '23505';

export const neonStore: OrderStore = {
  async insert(row) {
    try {
      await sql()`
        insert into orders (code, dish_id, sender, recipient, message, chain)
        values (${row.code}, ${row.dishId}, ${row.sender}, ${row.recipient}, ${row.message}, ${row.chain})
      `;
    } catch (err) {
      if ((err as { code?: string })?.code === UNIQUE_VIOLATION) {
        throw new DuplicateCodeError(row.code);
      }
      throw err;
    }
  },

  async findByCode(code) {
    const rows = (await sql()`
      select code, dish_id, sender, recipient, message, chain, revoked_at
      from orders
      where code = ${code}
      limit 1
    `) as Array<Record<string, unknown>>;

    const row = rows[0];
    if (!row) return null;

    return {
      code: row.code as string,
      dishId: row.dish_id as string,
      sender: row.sender as string,
      recipient: row.recipient as string,
      message: row.message as string,
      chain: row.chain as number,
      revokedAt: row.revoked_at ? new Date(row.revoked_at as string) : null,
    };
  },
};
