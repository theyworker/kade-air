// Read-only reporting over the orders table, for the /admin control tower.
//
// Every query here is written with `sql.query(text, params)` rather than the
// tagged template the rest of the app uses. The reason is the timezone: these
// numbers are all "in Sri Lanka" and the literal 'Asia/Colombo' has to sit
// inside the SQL text, which a tagged template would turn into a bind
// parameter. Values that vary — page size, offset — are still parameters.

import { sql } from './db';

// Air Kade is a Colombo thing. "Today" means today there, not wherever the
// database happens to think it lives (Neon runs in UTC), and not wherever the
// admin's laptop is. Every bucket below is cut on this clock.
export const TZ = 'Asia/Colombo';

/** Local midnight today, as a timestamptz — the boundary "today" is counted from. */
const DAY_START = `date_trunc('day', now() at time zone '${TZ}') at time zone '${TZ}'`;
/** Local midnight on the Monday of the current week. */
const WEEK_START = `date_trunc('week', now() at time zone '${TZ}') at time zone '${TZ}'`;
/** The local calendar day an order belongs to. */
const LOCAL_DAY = `date_trunc('day', created_at at time zone '${TZ}')`;

async function rows<T>(text: string, params: unknown[] = []): Promise<T[]> {
  return (await sql().query(text, params)) as T[];
}

export type Totals = {
  /** every flight ever booked */
  total: number;
  /** flights since Monday, Colombo time */
  week: number;
  /** flights since midnight, Colombo time */
  today: number;
};

export async function getTotals(): Promise<Totals> {
  const [row] = await rows<Totals>(`
    select
      count(*)::int                                            as total,
      count(*) filter (where created_at >= ${WEEK_START})::int as week,
      count(*) filter (where created_at >= ${DAY_START})::int  as today
    from orders
  `);
  return row ?? { total: 0, week: 0, today: 0 };
}

/** One point on the trend line. `day` is a Colombo-local YYYY-MM-DD. */
export type DayPoint = { day: string; count: number };

/**
 * Orders per day for the last `days` days, ending today.
 *
 * The generated day series is the point: a day nobody ordered has no rows to
 * group, and a line chart that simply skips those days draws a busy week and a
 * dead week as the same shape. The left join puts the zeroes back.
 */
export async function getDailyOrders(days = 30): Promise<DayPoint[]> {
  return rows<DayPoint>(
    `
    with span as (
      select generate_series(
        date_trunc('day', now() at time zone '${TZ}') - make_interval(days => $1::int - 1),
        date_trunc('day', now() at time zone '${TZ}'),
        interval '1 day'
      ) as day
    )
    select to_char(span.day, 'YYYY-MM-DD') as day,
           count(o.code)::int              as count
    from span
    left join orders o on ${LOCAL_DAY} = span.day
    group by span.day
    order by span.day
  `,
    [days],
  );
}

export type DishCount = { dishId: string; count: number };

/** The most-ordered dishes, most popular first. Ties break by id so the order is stable. */
export async function getTopDishes(limit = 5): Promise<DishCount[]> {
  const found = await rows<{ dish_id: string; count: number }>(
    `
    select dish_id, count(*)::int as count
    from orders
    group by dish_id
    order by count(*) desc, dish_id asc
    limit $1::int
  `,
    [limit],
  );
  return found.map((r) => ({ dishId: r.dish_id, count: r.count }));
}

export type OrderRow = {
  code: string;
  dishId: string;
  sender: string;
  recipient: string;
  /**
   * How long the note is, not what it says. There is deliberately no field
   * here for the message itself — see getOrdersPage.
   */
  messageLength: number;
  chain: number;
  /** already formatted in Colombo time — see below */
  createdAt: string;
  revoked: boolean;
};

export type OrderPage = { rows: OrderRow[]; total: number; page: number; pages: number };

export const PAGE_SIZE = 10;

/**
 * A page of orders, newest first. `page` is 1-based and clamped into range.
 *
 * The note people wrote is NOT selected — only its length. Masking it in the
 * table would have been the easy version and the wrong one: the text would
 * still travel to the browser inside the RSC payload, one devtools pane away
 * from being read. A message written to one person is not ours, so it does not
 * leave Postgres for this page at all. Anything that needs the text (the
 * delivery page, the revoke script) reads the order by its code, as before.
 *
 * Timestamps come back pre-formatted as Colombo local time rather than as
 * Dates: the table is rendered on the server first and then re-rendered on the
 * client as pages turn, and a Date formatted with the browser's locale would
 * disagree with itself between those two passes.
 */
/**
 * Builds the row the dashboard gets from the row Postgres returned.
 *
 * Field by field, never by spread: a spread would carry anything the query
 * happened to select straight into the payload the browser receives, so the day
 * someone adds `message` back to that select list, it would ship silently.
 * Here it cannot — an unlisted column is dropped.
 */
export function toOrderRow(r: Record<string, unknown>): OrderRow {
  return {
    code: r.code as string,
    dishId: r.dish_id as string,
    sender: r.sender as string,
    recipient: r.recipient as string,
    messageLength: Number(r.message_length ?? 0),
    chain: r.chain as number,
    createdAt: r.created_at as string,
    revoked: r.revoked as boolean,
  };
}

export async function getOrdersPage(page = 1, pageSize = PAGE_SIZE): Promise<OrderPage> {
  const size = Math.min(100, Math.max(1, Math.floor(pageSize) || PAGE_SIZE));

  const [{ total }] = await rows<{ total: number }>('select count(*)::int as total from orders');
  const pages = Math.max(1, Math.ceil(total / size));
  const current = Math.min(pages, Math.max(1, Math.floor(page) || 1));

  const found = await rows<Record<string, unknown>>(
    `
    select code, dish_id, sender, recipient, chain,
           char_length(message)                                       as message_length,
           to_char(created_at at time zone '${TZ}', 'DD Mon YYYY, HH24:MI') as created_at,
           revoked_at is not null                                           as revoked
    from orders
    order by created_at desc
    limit $1::int offset $2::int
  `,
    [size, (current - 1) * size],
  );

  return {
    total,
    page: current,
    pages,
    rows: found.map(toOrderRow),
  };
}
