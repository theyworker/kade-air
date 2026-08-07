import { neon } from '@neondatabase/serverless';
import { env } from './env';
import type { Order } from './order';
import { sanitizePlace, type Place } from './place';

export type StoredOrder = Order & {
  code: string;
  revokedAt: Date | null;
  /** When the sender placed it, and where they appeared to be at the time. */
  createdAt: Date;
  senderPlace: Place;
  /** Null until the recipient opens the link — the first open is what is kept. */
  openedAt: Date | null;
  openedPlace: Place;
};

export type OrderStore = {
  insert(row: Order & { code: string; senderPlace: Place }): Promise<void>;
  findByCode(code: string): Promise<StoredOrder | null>;
  revoke(code: string): Promise<void>;
  /** Stamps the first open. Resolves true when this call was that open. */
  markOpened(code: string, place: Place): Promise<boolean>;
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
      // created_at defaults to now(), so the sender's timestamp is the row's
      // own — there is nothing to pass for it here.
      await sql()`
        insert into orders (code, dish_id, sender, recipient, message, chain, sender_location, sender_timezone)
        values (${row.code}, ${row.dishId}, ${row.sender}, ${row.recipient}, ${row.message}, ${row.chain},
                ${row.senderPlace.label}, ${row.senderPlace.timeZone})
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
      select code, dish_id, sender, recipient, message, chain, revoked_at,
             created_at, sender_location, sender_timezone,
             opened_at, opened_location, opened_timezone
      from orders
      where code = ${code}
      limit 1
    `) as Array<Record<string, unknown>>;

    const row = rows[0];
    if (!row) return null;

    // The place columns are `not null default ''`, but a row read here may
    // predate that default being backfilled by a partial migration, so both
    // sides coalesce rather than trusting the schema.
    const place = (label: unknown, timeZone: unknown): Place =>
      sanitizePlace({ label: (label as string) ?? '', timeZone: (timeZone as string) ?? '' });

    return {
      code: row.code as string,
      dishId: row.dish_id as string,
      sender: row.sender as string,
      recipient: row.recipient as string,
      message: row.message as string,
      chain: row.chain as number,
      revokedAt: row.revoked_at ? new Date(row.revoked_at as string) : null,
      createdAt: row.created_at ? new Date(row.created_at as string) : new Date(0),
      senderPlace: place(row.sender_location, row.sender_timezone),
      openedAt: row.opened_at ? new Date(row.opened_at as string) : null,
      openedPlace: place(row.opened_location, row.opened_timezone),
    };
  },

  async revoke(code) {
    await sql()`update orders set revoked_at = now() where code = ${code}`;
  },

  // `opened_at is null` in the predicate is what makes the first open the one
  // that is kept: every later open matches nothing and writes nothing, so the
  // stored moment stays the moment the recipient actually found out. It is
  // also what makes this safe to call on every render — the second call from
  // a reload is a no-op, not an overwrite.
  //
  // Revoked rows are excluded. A revoked link should not be readable at all,
  // and a stamp on one would be recording a delivery that did not happen.
  async markOpened(code, place) {
    const rows = (await sql()`
      update orders
         set opened_at = now(),
             opened_location = ${place.label},
             opened_timezone = ${place.timeZone}
       where code = ${code}
         and opened_at is null
         and revoked_at is null
      returning code
    `) as Array<unknown>;

    return rows.length > 0;
  },
};
