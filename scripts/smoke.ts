/**
 * Smoke check against REAL Neon and Upstash.
 *
 * `npm test` is deliberately network-free, so nothing in the unit suite ever
 * touches a live service. This script covers the gap: it exercises the paths
 * that only fail against real infrastructure — SQL that never ran, a driver
 * error code assumed from a .d.ts, a TTL nobody watched expire, and the
 * Redis-is-down behaviour that Global Constraint 2 rests on.
 *
 *   npm run smoke
 *
 * Requires DATABASE_URL, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN.
 * Writes rows prefixed SMOKE and deletes them again, even on failure.
 */
import { neon } from '@neondatabase/serverless';
import { Redis } from '@upstash/redis';
import { createOrder, getOrder, openingsOf, recordOpen, revokeOrder } from '../lib/orders';
import { neonStore, DuplicateCodeError, type OrderStore } from '../lib/db';
import { redisCache, CACHE_TTL_SECONDS, type OrderCache } from '../lib/cache';
import { createLimiter, clientIp } from '../lib/ratelimit';
import { placeFromHeaders, type Place } from '../lib/place';
import type { Order } from '../lib/order';

// Checked before anything is constructed, so a missing variable produces one
// readable line rather than a driver stack trace from inside node_modules.
const REQUIRED = ['DATABASE_URL', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'];
const absent = REQUIRED.filter((name) => !process.env[name]);
if (absent.length) {
  console.error(`Cannot run the smoke check — these are not set:\n  ${absent.join('\n  ')}\n`);
  console.error('Set them in .env.local, or inline:');
  console.error('  DATABASE_URL=... UPSTASH_REDIS_REST_URL=... UPSTASH_REDIS_REST_TOKEN=... npm run smoke');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL as string);
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL as string,
  token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
});

const deps = { store: neonStore, cache: redisCache };
const written: string[] = [];

let passed = 0;
let failed = 0;

function ok(label: string, detail = '') {
  passed++;
  console.log(`  PASS  ${label}${detail ? ` — ${detail}` : ''}`);
}

function bad(label: string, detail: string) {
  failed++;
  console.log(`  FAIL  ${label} — ${detail}`);
}

async function step(name: string, fn: () => Promise<void>) {
  console.log(`\n${name}`);
  try {
    await fn();
  } catch (err) {
    bad(name, err instanceof Error ? err.message : String(err));
  }
}

const sample = (): Order => ({
  dishId: 'kottu',
  sender: 'SmokeTest',
  recipient: 'Machan',
  message: 'If you are reading this in production, something leaked.',
  chain: 1,
});

// What the edge would have attached to a request from Colombo. Real headers,
// parsed by the real parser, so this exercises the path a live request takes.
const senderPlace: Place = placeFromHeaders(
  new Headers({
    'x-vercel-ip-city': 'Colombo',
    'x-vercel-ip-country-region': 'WP',
    'x-vercel-ip-country': 'LK',
    'x-vercel-ip-timezone': 'Asia/Colombo',
  }),
);

const openedPlace: Place = placeFromHeaders(
  new Headers({ 'cf-ipcity': 'Kandy', 'cf-ipcountry': 'LK', 'cf-timezone': 'Asia/Colombo' }),
);

async function main() {
  console.log('Smoke check against real Neon + Upstash\n' + '='.repeat(46));

  // ---- 1. Schema is present and shaped as expected -------------------------
  await step('1. Schema', async () => {
    const cols = (await sql`
      select column_name from information_schema.columns
      where table_name = 'orders'
    `) as Array<{ column_name: string }>;
    const names = cols.map((c) => c.column_name).sort();
    const want = [
      'chain', 'code', 'created_at', 'dish_id', 'message', 'recipient', 'revoked_at', 'sender',
      'sender_location', 'sender_timezone',
    ];
    if (names.length === 0) return bad('orders table exists', 'not found — run npm run db:migrate first');
    const missing = want.filter((w) => !names.includes(w));
    missing.length
      ? bad('all columns present', `missing: ${missing.join(', ')} — run npm run db:migrate`)
      : ok(`orders table has all ${want.length} columns`);

    // The single-open columns the log replaced. Left behind, they would be a
    // second place an open could live.
    const stale = ['opened_at', 'opened_location', 'opened_timezone'].filter((c) => names.includes(c));
    stale.length
      ? bad('the replaced open columns are gone', `still present: ${stale.join(', ')} — run npm run db:migrate`)
      : ok('the replaced single-open columns are gone from orders');

    const openCols = (await sql`
      select column_name from information_schema.columns
      where table_name = 'order_opens'
    `) as Array<{ column_name: string }>;
    const openNames = openCols.map((c) => c.column_name).sort();
    const wantOpens = ['code', 'id', 'location', 'opened_at', 'timezone'];
    const missingOpens = wantOpens.filter((w) => !openNames.includes(w));
    openNames.length === 0
      ? bad('order_opens table exists', 'not found — run npm run db:migrate first')
      : missingOpens.length
        ? bad('order_opens has all columns', `missing: ${missingOpens.join(', ')}`)
        : ok('order_opens table has all 5 columns');
  });

  // ---- 2. Create writes a row and warms the cache with the right TTL -------
  let code = '';
  await step('2. createOrder writes Neon and warms Redis', async () => {
    code = await createOrder({ ...sample(), senderPlace }, deps);
    written.push(code);
    ok('code minted', code);

    if (!/^[23456789ABCDEFGHJKMNPQRSTVWXYZ]{8}$/.test(code)) {
      bad('code matches the alphabet and length', code);
    } else {
      ok('code matches the 30-char alphabet, length 8');
    }

    const rows = (await sql`select sender, chain from orders where code = ${code}`) as Array<{
      sender: string;
      chain: number;
    }>;
    rows[0]?.sender === 'SmokeTest'
      ? ok('row present in Neon')
      : bad('row present in Neon', `got ${JSON.stringify(rows[0])}`);

    const ttl = await redis.ttl(`order:${code}`);
    // Allow a little slack for round-trip time.
    ttl > CACHE_TTL_SECONDS - 60 && ttl <= CACHE_TTL_SECONDS
      ? ok('cache warmed with a ~2 day TTL', `${ttl}s`)
      : bad('cache warmed with a ~2 day TTL', `ttl=${ttl}, expected ~${CACHE_TTL_SECONDS}`);
  });

  // ---- 3. Redis is an optimisation, not a dependency -----------------------
  await step('3. Redis is optional (Global Constraint 2)', async () => {
    await redis.del(`order:${code}`);
    const cold = await getOrder(code, deps);
    cold?.sender === 'SmokeTest'
      ? ok('cold read still serves from Neon')
      : bad('cold read still serves from Neon', JSON.stringify(cold));

    const rewarmed = await redis.ttl(`order:${code}`);
    rewarmed > 0
      ? ok('cache re-warmed after the miss', `${rewarmed}s`)
      : bad('cache re-warmed after the miss', `ttl=${rewarmed}`);

    // The real thing Constraint 2 promises: an unreachable Redis must not
    // break a read. Point a throwaway cache at a dead host and try again.
    const deadCache: OrderCache = {
      async get() {
        throw new Error('simulated Redis outage');
      },
      async set() {
        throw new Error('simulated Redis outage');
      },
      async del() {
        throw new Error('simulated Redis outage');
      },
    };
    const served = await getOrder(code, { store: neonStore, cache: deadCache });
    served?.sender === 'SmokeTest'
      ? ok('read survives a completely unreachable Redis')
      : bad('read survives a completely unreachable Redis', JSON.stringify(served));
  });

  // ---- 4. Duplicate code detection uses the real driver's error ------------
  await step('4. Duplicate code raises DuplicateCodeError (real driver)', async () => {
    try {
      await neonStore.insert({ code, ...sample(), senderPlace });
      bad('second insert rejects', 'it succeeded — the primary key is not enforcing');
    } catch (err) {
      err instanceof DuplicateCodeError
        ? ok('SQLSTATE 23505 mapped to DuplicateCodeError')
        : bad(
            'SQLSTATE 23505 mapped to DuplicateCodeError',
            `got ${(err as Error).name}: ${(err as Error).message} — the error code is not where lib/db.ts looks`,
          );
    }
  });

  // ---- 5. Sender capture and the openings log ------------------------------
  await step('5. Sender place stored, every opening logged', async () => {
    const before = await neonStore.findByCode(code);
    if (!before) return bad('row readable', 'findByCode returned null');

    before.senderPlace.label === senderPlace.label &&
    before.senderPlace.timeZone === senderPlace.timeZone
      ? ok('sender place round-trips through Postgres', before.senderPlace.label)
      : bad('sender place round-trips through Postgres', JSON.stringify(before.senderPlace));

    // created_at is the sender's timestamp. A row minted seconds ago that
    // reads as hours old means the column is not what this code thinks it is.
    const age = Date.now() - before.createdAt.getTime();
    age >= 0 && age < 5 * 60_000
      ? ok('created_at is the sender timestamp', before.createdAt.toISOString())
      : bad('created_at is the sender timestamp', `${Math.round(age / 1000)}s off`);

    const none = await openingsOf(code, deps);
    none.length === 0
      ? ok('no openings before anyone opens it')
      : bad('no openings before anyone opens it', `${none.length} already logged`);

    const first = await recordOpen(code, openedPlace, deps);
    first ? ok('opening recorded') : bad('opening recorded', 'insert matched no row');

    // The whole point of a log: a second viewing is a second row, not an
    // overwrite of the first.
    const second = await recordOpen(code, senderPlace, deps);
    second ? ok('a second opening recorded too') : bad('a second opening recorded too', 'insert matched no row');

    const logged = await openingsOf(code, deps);
    logged.length === 2
      ? ok('both openings kept', `${logged.length} rows`)
      : bad('both openings kept', `${logged.length} rows, expected 2`);

    logged[0]?.place.label === openedPlace.label && logged[1]?.place.label === senderPlace.label
      ? ok('openings come back oldest first, each with its own place')
      : bad(
          'openings come back oldest first, each with its own place',
          JSON.stringify(logged.map((o) => o.place.label)),
        );

    logged[0] && logged[0].at.getTime() <= (logged[1]?.at.getTime() ?? 0)
      ? ok('timestamps are ordered', logged[0].at.toISOString())
      : bad('timestamps are ordered', JSON.stringify(logged.map((o) => o.at)));

    const unknown = await recordOpen('NOSUCH00', openedPlace, deps);
    unknown === false
      ? ok('an unknown code logs nothing, and the foreign key never fires')
      : bad('an unknown code logs nothing', 'it wrote a row');

    // The cached order must not have grown a field the recipient never sees.
    const cached = (await redis.get(`order:${code}`)) as Record<string, unknown> | null;
    cached && !('senderPlace' in cached) && !('openedAt' in cached)
      ? ok('cache holds only what a recipient sees')
      : bad('cache holds only what a recipient sees', JSON.stringify(cached));
  });

  // ---- 6. Revocation, including the cache-hit path -------------------------
  await step('6. Revocation evicts the cache, not just the row', async () => {
    const live = await getOrder(code, deps);
    if (!live) return bad('order readable before revoke', 'already null');
    const warm = await redis.get(`order:${code}`);
    if (!warm) return bad('cache warm before revoke', 'no entry to evict — test is not meaningful');
    ok('order readable and cache warm before revoke');

    await revokeOrder(code, deps);

    const evicted = await redis.get(`order:${code}`);
    evicted === null
      ? ok('cache entry evicted')
      : bad('cache entry evicted', 'entry survived — a revoked link would keep serving until TTL');

    const after = await getOrder(code, deps);
    after === null
      ? ok('getOrder returns null after revoke')
      : bad('getOrder returns null after revoke', JSON.stringify(after));

    // A revoked link is not readable, so an opening on one would be recording
    // a delivery that did not happen.
    const openedAfterRevoke = await recordOpen(code, openedPlace, deps);
    openedAfterRevoke === false
      ? ok('a revoked order logs no further openings')
      : bad('a revoked order logs no further openings', 'it wrote a row');
  });

  // ---- 7. The create limiter actually trips --------------------------------
  await step('7. Create rate limiter trips', async () => {
    const ip = `smoke-${Date.now()}`;
    const limiter = createLimiter();
    let allowed = 0;
    let blocked = 0;
    for (let i = 0; i < 60; i++) {
      const { success } = await limiter.limit(ip);
      success ? allowed++ : blocked++;
      if (blocked > 0) break;
    }
    blocked > 0
      ? ok('limiter blocks after the ceiling', `${allowed} allowed, then blocked`)
      : bad('limiter blocks after the ceiling', `60 requests all allowed — limiter not enforcing`);

    clientIp(new Headers({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' })) === '1.2.3.4'
      ? ok('clientIp takes the first forwarded entry')
      : bad('clientIp takes the first forwarded entry', 'parsing is wrong');
  });

  // ---- Cleanup -------------------------------------------------------------
  console.log('\nCleanup');
  for (const c of written) {
    try {
      // No delete of order_opens here on purpose: the foreign key cascades,
      // and a leftover row would mean it does not.
      await sql`delete from orders where code = ${c}`;
      const orphans = (await sql`select id from order_opens where code = ${c}`) as Array<unknown>;
      if (orphans.length) console.log(`  WARNING ${c} left ${orphans.length} order_opens rows behind`);
      await redis.del(`order:${c}`);
      console.log(`  removed ${c}`);
    } catch (err) {
      console.log(`  COULD NOT REMOVE ${c} — delete it by hand: ${(err as Error).message}`);
    }
  }

  console.log('\n' + '='.repeat(46));
  console.log(`${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log('\nSomething real is wrong. Do not deploy until it is understood.');
    process.exit(1);
  }
  console.log('\nData layer verified against real services.');
  console.log('Still to check by hand on a deployment (needs HTTP):');
  console.log('  curl -sI https://<domain>/d/<code>/opengraph-image     # expect max-age=31536000, immutable');
  console.log('  curl -sI https://<domain>/d/NOSUCH00/opengraph-image   # expect no-store');
  console.log('  curl -s  https://<domain>/d/<code> | grep og:image     # expect your apex domain, not *.vercel.app');
}

main().catch((err) => {
  console.error('\nSmoke check crashed:', err);
  process.exit(1);
});
