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
};

/** One opening of an order: the moment the message reached someone, and where. */
export type OrderOpen = { at: Date; place: Place };

export type OrderStore = {
  insert(row: Order & { code: string; senderPlace: Place }): Promise<void>;
  findByCode(code: string): Promise<StoredOrder | null>;
  revoke(code: string): Promise<void>;
  /** Logs an opening. Resolves true when one was written. */
  recordOpen(code: string, place: Place): Promise<boolean>;
  /** Every opening of an order, oldest first. */
  opensOf(code: string): Promise<OrderOpen[]>;
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

// A ceiling on how many openings one order will log. Nothing a recipient does
// comes close — the delivery has to play through before an open is recorded —
// but the action that writes these is reachable by anyone holding the code,
// and an unbounded log behind a public endpoint is an invitation. Past this
// many, the record already tells the story.
export const MAX_OPENS_PER_ORDER = 500;

// The place columns are `not null default ''`, but a row may predate the
// default being applied, so both sides coalesce rather than trust the schema.
const readPlace = (label: unknown, timeZone: unknown): Place =>
  sanitizePlace({ label: (label as string) ?? '', timeZone: (timeZone as string) ?? '' });

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
             created_at, sender_location, sender_timezone
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
      createdAt: row.created_at ? new Date(row.created_at as string) : new Date(0),
      senderPlace: readPlace(row.sender_location, row.sender_timezone),
    };
  },

  async revoke(code) {
    await sql()`update orders set revoked_at = now() where code = ${code}`;
  },

  // insert-select rather than a plain insert: the row only exists if the order
  // does, so an unknown code writes nothing without a round trip to check
  // first, and the foreign key can never be the thing that fails. Revoked
  // orders are excluded — a revoked link should not be readable at all, and
  // logging an open on one would be recording a delivery that did not happen.
  //
  // The count guard is the ceiling. It is in the same statement so there is no
  // window between checking and writing.
  async recordOpen(code, place) {
    const rows = (await sql()`
      insert into order_opens (code, location, timezone)
      select ${code}::text, ${place.label}::text, ${place.timeZone}::text
        from orders
       where code = ${code}
         and revoked_at is null
         and (select count(*) from order_opens where code = ${code}) < ${MAX_OPENS_PER_ORDER}
      returning id
    `) as Array<unknown>;

    return rows.length > 0;
  },

  async opensOf(code) {
    const rows = (await sql()`
      select opened_at, location, timezone
        from order_opens
       where code = ${code}
       order by opened_at, id
    `) as Array<Record<string, unknown>>;

    return rows.map((row) => ({
      at: new Date(row.opened_at as string),
      place: readPlace(row.location, row.timezone),
    }));
  },
};
