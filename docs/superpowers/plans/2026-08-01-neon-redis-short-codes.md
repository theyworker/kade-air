# Neon + Redis + Short Share Codes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move Kade Air's orders out of the URL and into Neon Postgres, addressed by a short opaque share code, with Upstash Redis as a read-through cache warmed at creation time.

**Architecture:** A single service module (`lib/orders.ts`) is the only door to an order. It composes a Postgres store and a Redis cache behind injectable interfaces, so every read path works — more slowly — with Redis absent, and so the cache logic is fully testable without a network. Order creation moves to a Server Action guarded by a rate limiter.

**Tech Stack:** Next.js 15 (App Router, Server Actions), React 19, `@neondatabase/serverless`, `@upstash/redis`, `@upstash/ratelimit`, `node:test` + `tsx`.

**Spec:** `docs/superpowers/specs/2026-08-01-neon-redis-short-codes-design.md`

## Global Constraints

1. **`npm test` stays network-free.** No test may require a live Neon or Redis instance. A test that needs either belongs in the manual smoke check, not the suite.
2. **Redis is never a dependency.** Every read path must return correct results with Redis unreachable. A cache failure is logged and swallowed, never surfaced.
3. **`getOrder` returns `null` for "no such order" and throws for infrastructure failure.** These map to different screens (`BrokenLink` vs `ErrorScreen`) and must never be conflated.
4. Runner is `node:test` through `tsx`; assertions via `node:assert/strict`. Test files live in `test/`, named `<module>.test.ts`, importing by relative path (`../lib/orders`), never the `@/` alias.
5. New runtime dependencies are limited to exactly: `@neondatabase/serverless`, `@upstash/redis`, `@upstash/ratelimit`. No ORM, no migration framework, no validation library.
6. `npm run build` must pass after every task.
7. Test names state behaviour ("returns null for a revoked order"), not function names.
8. Code alphabet is exactly `23456789ABCDEFGHJKMNPQRSTVWXYZ` — 30 characters: digits 2-9 (8) plus A-Z less I, L, O, U (22). Code length is exactly 8.
9. Randomness comes from `crypto.getRandomValues`. `Math.random` is forbidden in code generation.
10. Existing app copy and voice are unchanged. Error text uses the app's established register ("Ayyo.", "machan").

---

## File Structure

**Create:**

| Path | Responsibility |
|---|---|
| `lib/code.ts` | Generate a random 8-char share code. Pure, no I/O. |
| `lib/env.ts` | Read and validate required environment variables. Fails loudly. |
| `lib/db.ts` | Neon client + SQL. The only file containing SQL. |
| `lib/cache.ts` | Redis client + key naming + TTL. |
| `lib/orders.ts` | `createOrder` / `getOrder`. The only door the app uses. |
| `lib/ratelimit.ts` | Upstash rate limiters for creation and reads. |
| `app/actions.ts` | The `createOrderAction` Server Action. |
| `db/schema.sql` | Table definition. |
| `scripts/migrate.ts` | Applies `db/schema.sql` through the Neon driver. |
| `test/code.test.ts` | Tests for `lib/code.ts`. |
| `test/orders.test.ts` | Tests for `lib/orders.ts` against fakes. |

**Modify:**

| Path | Change |
|---|---|
| `lib/order.ts` | Delete the codec; export `sanitizeOrder` and `clean`. |
| `test/order.test.ts` | Drop codec tests; retarget survivors at `sanitizeOrder`. |
| `app/d/[token]/` → `app/d/[code]/` | Rename route segment; both files read from `getOrder`. |
| `components/CreateFlow.tsx` | Link comes from the action, not `useMemo`. |
| `components/screens/Personalise.tsx` | Pending + error state on submit. |
| `components/desktop/PersonaliseD.tsx` | Same, desktop variant. |
| `package.json` | Dependencies, `db:migrate` script, test file list. |

**Note on `package.json`'s test script:** it lists test files explicitly (`tsx --test test/dishes.test.ts test/flight.test.ts test/order.test.ts test/ua.test.ts`) because a glob exits 0 when it matches nothing. **Every task that adds a test file must add it to that list**, or the new tests silently never run.

---

## Task 1: Dependencies, environment, schema, and migration

**Files:**
- Modify: `package.json`
- Create: `lib/env.ts`, `db/schema.sql`, `scripts/migrate.ts`
- Create: `.env.example`

**Interfaces:**
- Consumes: nothing
- Produces: `requireEnv(name: string): string`, `DATABASE_URL: string`, `REDIS_URL: string`, `REDIS_TOKEN: string` from `lib/env.ts`

- [ ] **Step 1: Install dependencies**

```bash
npm install @neondatabase/serverless @upstash/redis @upstash/ratelimit
```

- [ ] **Step 2: Create `lib/env.ts`**

```ts
// Required configuration, read once at module load. A missing value is a
// deployment mistake, and it should fail immediately and by name rather than
// surface later as a confusing runtime error.
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. ` +
        `Set it in .env.local for development, or in the Vercel project settings.`,
    );
  }
  return value;
}

export const DATABASE_URL = requireEnv('DATABASE_URL');
export const REDIS_URL = requireEnv('UPSTASH_REDIS_REST_URL');
export const REDIS_TOKEN = requireEnv('UPSTASH_REDIS_REST_TOKEN');
```

- [ ] **Step 3: Create `db/schema.sql`**

```sql
create table if not exists orders (
  code       text primary key,
  dish_id    text        not null,
  sender     text        not null default '',
  recipient  text        not null default '',
  message    text        not null default '',
  chain      integer     not null default 1,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);
```

- [ ] **Step 4: Create `scripts/migrate.ts`**

```ts
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
```

- [ ] **Step 5: Create `.env.example`**

```
DATABASE_URL=postgres://user:pass@host/db?sslmode=require
UPSTASH_REDIS_REST_URL=https://example.upstash.io
UPSTASH_REDIS_REST_TOKEN=replace-me
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- [ ] **Step 6: Add the migrate script to `package.json`**

Add to `"scripts"`, keeping the existing `test` entry untouched:

```json
"db:migrate": "tsx scripts/migrate.ts"
```

- [ ] **Step 7: Verify the build still passes**

Run: `npm run build`
Expected: PASS. (`lib/env.ts` is not yet imported by anything, so no env vars are needed to build.)

- [ ] **Step 8: Verify the existing suite still passes**

Run: `npm test`
Expected: 235 tests, 235 pass.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json lib/env.ts db/schema.sql scripts/migrate.ts .env.example
git commit -m "Add Neon and Redis dependencies, schema, and env validation"
```

---

## Task 2: Short code generation

**Files:**
- Create: `lib/code.ts`
- Create: `test/code.test.ts`
- Modify: `package.json` (add `test/code.test.ts` to the test script)

**Interfaces:**
- Consumes: nothing
- Produces: `CODE_ALPHABET: string`, `CODE_LENGTH: number`, `generateCode(): string` from `lib/code.ts`

- [ ] **Step 1: Write the failing tests**

Create `test/code.test.ts`:

```ts
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { CODE_ALPHABET, CODE_LENGTH, generateCode } from '../lib/code';

describe('code alphabet', () => {
  test('contains exactly 30 characters', () => {
    assert.equal(CODE_ALPHABET.length, 30);
  });

  test('has no repeated characters', () => {
    assert.equal(new Set(CODE_ALPHABET).size, CODE_ALPHABET.length);
  });

  test('excludes the visually ambiguous glyphs 0, 1, I, L, O and U', () => {
    for (const c of ['0', '1', 'I', 'L', 'O', 'U']) {
      assert.equal(CODE_ALPHABET.includes(c), false, `alphabet must not contain ${c}`);
    }
  });

  test('is uppercase and alphanumeric only', () => {
    assert.match(CODE_ALPHABET, /^[A-Z2-9]+$/);
  });
});

describe('generateCode', () => {
  test('returns a code of exactly CODE_LENGTH characters', () => {
    assert.equal(generateCode().length, CODE_LENGTH);
  });

  test('returns codes drawn only from the alphabet', () => {
    for (let i = 0; i < 200; i++) {
      for (const ch of generateCode()) {
        assert.ok(CODE_ALPHABET.includes(ch), `unexpected character ${ch}`);
      }
    }
  });

  test('produces no duplicates across 10000 draws', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 10000; i++) seen.add(generateCode());
    assert.equal(seen.size, 10000);
  });

  test('uses every alphabet character across a large sample, showing no positional bias', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 5000; i++) for (const ch of generateCode()) seen.add(ch);
    assert.equal(seen.size, CODE_ALPHABET.length);
  });
});
```

- [ ] **Step 2: Add the new test file to the test script**

In `package.json`, extend the `test` script's file list with `test/code.test.ts`:

```json
"test": "tsx --test test/code.test.ts test/dishes.test.ts test/flight.test.ts test/order.test.ts test/ua.test.ts"
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module '../lib/code'`.

- [ ] **Step 4: Write the implementation**

Create `lib/code.ts`:

```ts
// Share codes appear in links people paste into chat and occasionally read
// aloud, so the alphabet drops the glyph pairs that get misread: 0/O, 1/I/L.
// U is dropped as well, on Crockford's reasoning that it keeps accidental
// obscenities out of generated codes.
//
// 30 characters over 8 positions is ~6.6e11 possibilities (~39.3 bits).
// Codes are unguessable in practice but not unbounded, which is why the read
// path is rate limited too.
export const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';
export const CODE_LENGTH = 8;

export function generateCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  let out = '';
  for (const b of bytes) out += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return out;
}
```

The literal above is exactly 30 characters and is correct as written — do not add to it. Verified: `'23456789ABCDEFGHJKMNPQRSTVWXYZ'.length === 30`, all distinct, none of `0 1 I L O U` present.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test`
Expected: all pass, total 235 + 8 = 243.

- [ ] **Step 6: Verify the build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/code.ts test/code.test.ts package.json
git commit -m "Add short share code generation"
```

---

## Task 3: Retire the codec from `lib/order.ts`

**Files:**
- Modify: `lib/order.ts`
- Modify: `test/order.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `Order` (unchanged), `MAX_NAME`, `MAX_MESSAGE`, `clean(s: string, max: number): string`, `sanitizeOrder(input: Order): Order`, and the three display helpers, all from `lib/order.ts`. `encodeOrder` and `decodeOrder` no longer exist.

**Context:** `clean()` is currently module-private and is exercised only *through* `encodeOrder`/`decodeOrder`. Removing the codec would leave it untestable, so this task exports it and adds `sanitizeOrder`, which applies the same cleaning and clamping the codec used to do on the way in.

- [ ] **Step 1: Rewrite `lib/order.ts`**

Replace the whole file with:

```ts
// An order is a row in Postgres, addressed by a short share code. This module
// owns the shape of an order and the rules for cleaning one — it deliberately
// knows nothing about storage.

import { DEFAULT_MESSAGE } from './messages';

export type Order = {
  dishId: string;
  sender: string;
  recipient: string;
  message: string;
  chain: number; // sender's position in the food chain (1 = started it)
};

export const MAX_NAME = 24;
export const MAX_MESSAGE = 140;

export const clean = (s: string, max: number) =>
  s.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

const clampChain = (n: number) => Math.min(9999, Math.max(1, Math.round(n) || 1));

// The validation gate on everything entering the database. Applied on write,
// and again on read, because a row written by an older version of this code is
// input we did not validate under today's rules.
export function sanitizeOrder(input: Order): Order {
  return {
    dishId: input.dishId,
    sender: clean(input.sender ?? '', MAX_NAME),
    recipient: clean(input.recipient ?? '', MAX_NAME),
    message: clean(input.message ?? '', MAX_MESSAGE),
    chain: clampChain(Number(input.chain)),
  };
}

export const senderDisplay = (o: Pick<Order, 'sender'>) => o.sender.trim() || 'a secret machan';
export const recipientDisplay = (o: Pick<Order, 'recipient'>) => o.recipient.trim() || 'your machan';
export const messageDisplay = (o: Pick<Order, 'message'>) => o.message.trim() || DEFAULT_MESSAGE;
```

- [ ] **Step 2: Rewrite `test/order.test.ts`**

Delete these describe blocks entirely — they pin a mechanism that no longer exists:
`encodeOrder / decodeOrder round-trip`, `decodeOrder defensive parsing (returns null, never throws)`, `defensive decode of hand-crafted, out-of-spec tokens`, `base64url alphabet`. Also delete the local `encodeRawPayload` helper.

Retarget the survivors at `sanitizeOrder`. Replace the imports and the surviving blocks with:

```ts
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_MESSAGE,
  MAX_NAME,
  messageDisplay,
  recipientDisplay,
  sanitizeOrder,
  senderDisplay,
} from '../lib/order';
import { DEFAULT_MESSAGE } from '../lib/messages';

const base = { dishId: 'kottu', sender: '', recipient: '', message: '', chain: 1 };
const withSender = (sender: string) => sanitizeOrder({ ...base, sender }).sender;
const withMessage = (message: string) => sanitizeOrder({ ...base, message }).message;
const withChain = (chain: number) => sanitizeOrder({ ...base, chain }).chain;

describe('sanitizeOrder cleaning', () => {
  test('replaces control characters with a space and collapses resulting whitespace', () => {
    assert.equal(withSender('A\x00B'), 'A B');
  });

  test('replaces the DEL control character (\\x7f) with a space, not just \\x00', () => {
    assert.equal(withSender('A\x7fB'), 'A B');
  });

  test('collapses runs of internal whitespace to a single space', () => {
    assert.equal(withSender('A    B'), 'A B');
  });

  test('trims leading and trailing whitespace', () => {
    assert.equal(withSender('   Devaka   '), 'Devaka');
  });

  test('leaves non-ASCII Sinhala content intact', () => {
    assert.equal(withMessage('කපන් හුලන්'), 'කපන් හුලන්');
  });

  test('leaves emoji intact', () => {
    assert.equal(withMessage('Enjoy! ❤️'), 'Enjoy! ❤️');
  });
});

describe('sanitizeOrder truncation', () => {
  test('truncates a sender longer than MAX_NAME to exactly MAX_NAME characters', () => {
    assert.equal(withSender('A'.repeat(MAX_NAME + 10)), 'A'.repeat(MAX_NAME));
  });

  test('truncates a message longer than MAX_MESSAGE to exactly MAX_MESSAGE characters', () => {
    assert.equal(withMessage('B'.repeat(MAX_MESSAGE + 50)), 'B'.repeat(MAX_MESSAGE));
  });

  test('truncation can split a surrogate pair mid-emoji, leaving a lone surrogate (documented, not endorsed)', () => {
    const result = withMessage('A'.repeat(MAX_MESSAGE - 1) + '😌' + 'tail');
    assert.equal(result.length, MAX_MESSAGE);
    assert.equal(result.charCodeAt(MAX_MESSAGE - 1), 0xd83d);
  });
});

describe('sanitizeOrder chain clamping', () => {
  test('clamps zero up to 1', () => assert.equal(withChain(0), 1));
  test('clamps negative values up to 1', () => assert.equal(withChain(-5), 1));
  test('clamps values above 9999 down to 9999', () => assert.equal(withChain(10000), 9999));
  test('rounds a fractional value to the nearest integer', () => assert.equal(withChain(2.7), 3));
  test('rounds 2.4 down to 2, distinguishing rounding from ceiling', () => assert.equal(withChain(2.4), 2));
  test('falls back to 1 for NaN', () => assert.equal(withChain(NaN), 1));
});

describe('Unicode edge cases — documented, not endorsed', () => {
  test('currently lets bidi override characters through unstripped (documented, not endorsed)', () => {
    assert.equal(withSender('A‮B'), 'A‮B');
  });

  test('currently lets zero-width characters through unstripped (documented, not endorsed)', () => {
    assert.equal(withSender('A​B'), 'A​B');
  });
});
```

Keep the existing `display helpers` describe block exactly as it is — it does not reference the codec.

- [ ] **Step 3: Run the tests**

Run: `npm test`
Expected: PASS. `test/order.test.ts` drops from 36 to roughly 21 tests; total lands near 228. Record the exact number in the task report.

- [ ] **Step 4: Verify nothing still imports the codec**

Run: `grep -rn "encodeOrder\|decodeOrder" --include="*.ts" --include="*.tsx" app components lib test`
Expected: matches only in `app/d/[token]/page.tsx`, `app/d/[token]/opengraph-image.tsx`, and `components/CreateFlow.tsx` — all of which are rewritten in Tasks 7 and 8. The build will fail until then; that is expected and is handled in Step 5.

- [ ] **Step 5: Confirm the build failure is limited to the known call sites**

Run: `npm run build`
Expected: FAIL, with errors **only** in `app/d/[token]/page.tsx`, `app/d/[token]/opengraph-image.tsx`, and `components/CreateFlow.tsx`. Any other file erroring means something was missed — report it rather than working around it.

This is the one task in the plan that intentionally leaves the build red. It is committed anyway so the codec removal is one reviewable change; Task 7 and Task 8 restore it.

- [ ] **Step 6: Commit**

```bash
git add lib/order.ts test/order.test.ts
git commit -m "Replace the order codec with sanitizeOrder"
```

---

## Task 4: Postgres store and Redis cache

**Files:**
- Create: `lib/db.ts`, `lib/cache.ts`

**Interfaces:**
- Consumes: `DATABASE_URL`, `REDIS_URL`, `REDIS_TOKEN` from `lib/env.ts`; `Order` from `lib/order.ts`
- Produces:
  - `type StoredOrder = Order & { code: string; revokedAt: Date | null }`
  - `type OrderStore = { insert(row: Order & { code: string }): Promise<void>; findByCode(code: string): Promise<StoredOrder | null> }`
  - `neonStore: OrderStore`, `DuplicateCodeError` from `lib/db.ts`
  - `type OrderCache = { get(code: string): Promise<Order | null>; set(code: string, order: Order): Promise<void> }`
  - `redisCache: OrderCache`, `CACHE_TTL_SECONDS: number` from `lib/cache.ts`

**Context:** These two files are thin adapters over network clients, so they carry no unit tests of their own — Global Constraint 1 forbids tests that need live services. Their contract is verified by the type checker, and the interfaces they export are what Task 5 tests against using fakes. Real behaviour is covered by the manual smoke check in Task 9.

- [ ] **Step 1: Create `lib/db.ts`**

```ts
import { neon } from '@neondatabase/serverless';
import { DATABASE_URL } from './env';
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

const sql = neon(DATABASE_URL);

// Postgres unique-violation SQLSTATE.
const UNIQUE_VIOLATION = '23505';

export const neonStore: OrderStore = {
  async insert(row) {
    try {
      await sql`
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
    const rows = (await sql`
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
```

- [ ] **Step 2: Create `lib/cache.ts`**

```ts
import { Redis } from '@upstash/redis';
import { REDIS_TOKEN, REDIS_URL } from './env';
import type { Order } from './order';

export type OrderCache = {
  get(code: string): Promise<Order | null>;
  set(code: string, order: Order): Promise<void>;
};

// Two days. Neon is the source of truth, so this only decides how long a hot
// link stays hot — an expired entry costs one slower request, never a failure.
export const CACHE_TTL_SECONDS = 60 * 60 * 24 * 2;

const redis = new Redis({ url: REDIS_URL, token: REDIS_TOKEN });

const key = (code: string) => `order:${code}`;

export const redisCache: OrderCache = {
  async get(code) {
    return (await redis.get<Order>(key(code))) ?? null;
  },

  async set(code, order) {
    await redis.set(key(code), order, { ex: CACHE_TTL_SECONDS });
  },
};
```

- [ ] **Step 3: Verify the types compile**

Run: `npx tsc --noEmit`
Expected: errors **only** in `app/d/[token]/*` and `components/CreateFlow.tsx` (the known Task 3 fallout). No errors in `lib/db.ts` or `lib/cache.ts`.

- [ ] **Step 4: Run the tests**

Run: `npm test`
Expected: unchanged from Task 3 — these files add no tests and are imported by nothing yet.

- [ ] **Step 5: Commit**

```bash
git add lib/db.ts lib/cache.ts
git commit -m "Add the Neon order store and Redis order cache"
```

---

## Task 5: The order service

**Files:**
- Create: `lib/orders.ts`, `test/orders.test.ts`
- Modify: `package.json` (add `test/orders.test.ts` to the test script)

**Interfaces:**
- Consumes: `OrderStore`, `StoredOrder`, `DuplicateCodeError`, `neonStore` from `lib/db.ts`; `OrderCache`, `redisCache` from `lib/cache.ts`; `generateCode` from `lib/code.ts`; `Order`, `sanitizeOrder` from `lib/order.ts`
- Produces:
  - `type Deps = { store: OrderStore; cache: OrderCache; newCode?: () => string }`
  - `createOrder(input: Order, deps?: Deps): Promise<string>` — returns the code
  - `getOrder(code: string, deps?: Deps): Promise<Order | null>`

**Context:** This is the heart of the change and the only new logic worth testing thoroughly. `deps` is injectable with real defaults so the tests exercise the genuine cache logic against fakes, satisfying Global Constraint 1.

- [ ] **Step 1: Write the failing tests**

Create `test/orders.test.ts`:

```ts
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createOrder, getOrder } from '../lib/orders';
import { DuplicateCodeError, type OrderStore, type StoredOrder } from '../lib/db';
import type { OrderCache } from '../lib/cache';
import type { Order } from '../lib/order';

const anOrder: Order = {
  dishId: 'kottu',
  sender: 'Devaka',
  recipient: 'Amma',
  message: 'Enjoy!',
  chain: 1,
};

const stored = (code: string, over: Partial<StoredOrder> = {}): StoredOrder => ({
  code,
  ...anOrder,
  revokedAt: null,
  ...over,
});

function fakeStore(over: Partial<OrderStore> = {}) {
  const rows = new Map<string, StoredOrder>();
  const calls = { insert: 0, find: 0 };
  const store: OrderStore = {
    async insert(row) {
      calls.insert++;
      if (rows.has(row.code)) throw new DuplicateCodeError(row.code);
      rows.set(row.code, { ...row, revokedAt: null });
    },
    async findByCode(code) {
      calls.find++;
      return rows.get(code) ?? null;
    },
    ...over,
  };
  return { store, rows, calls };
}

function fakeCache(over: Partial<OrderCache> = {}) {
  const entries = new Map<string, Order>();
  const calls = { get: 0, set: 0 };
  const cache: OrderCache = {
    async get(code) {
      calls.get++;
      return entries.get(code) ?? null;
    },
    async set(code, order) {
      calls.set++;
      entries.set(code, order);
    },
    ...over,
  };
  return { cache, entries, calls };
}

describe('createOrder', () => {
  test('writes the order to the store and returns its code', async () => {
    const { store, rows } = fakeStore();
    const { cache } = fakeCache();
    const code = await createOrder(anOrder, { store, cache, newCode: () => 'AAAAAAAA' });
    assert.equal(code, 'AAAAAAAA');
    assert.equal(rows.get('AAAAAAAA')?.sender, 'Devaka');
  });

  test('warms the cache so the preview that follows is a hit', async () => {
    const { store } = fakeStore();
    const { cache, entries } = fakeCache();
    await createOrder(anOrder, { store, cache, newCode: () => 'BBBBBBBB' });
    assert.deepEqual(entries.get('BBBBBBBB'), anOrder);
  });

  test('sanitizes input before storing it', async () => {
    const { store, rows } = fakeStore();
    const { cache } = fakeCache();
    const dirty = { ...anOrder, sender: '  Dev\x00aka  ', chain: 99999 };
    await createOrder(dirty, { store, cache, newCode: () => 'CCCCCCCC' });
    assert.equal(rows.get('CCCCCCCC')?.sender, 'Dev aka');
    assert.equal(rows.get('CCCCCCCC')?.chain, 9999);
  });

  test('retries with a fresh code when the first one collides', async () => {
    const { store, rows } = fakeStore();
    const { cache } = fakeCache();
    rows.set('TAKEN123', stored('TAKEN123'));
    const codes = ['TAKEN123', 'FREE9999'];
    let i = 0;
    const code = await createOrder(anOrder, { store, cache, newCode: () => codes[i++] });
    assert.equal(code, 'FREE9999');
  });

  test('gives up after repeated collisions rather than looping forever', async () => {
    const { store, rows } = fakeStore();
    const { cache } = fakeCache();
    rows.set('SAMECODE', stored('SAMECODE'));
    await assert.rejects(
      () => createOrder(anOrder, { store, cache, newCode: () => 'SAMECODE' }),
      /could not generate/i,
    );
  });

  test('still returns the code when warming the cache fails', async () => {
    const { store } = fakeStore();
    const { cache } = fakeCache({
      async set() {
        throw new Error('redis down');
      },
    });
    const code = await createOrder(anOrder, { store, cache, newCode: () => 'DDDDDDDD' });
    assert.equal(code, 'DDDDDDDD');
  });

  test('propagates a store failure, because the order was not saved', async () => {
    const { cache } = fakeCache();
    const store: OrderStore = {
      async insert() {
        throw new Error('neon down');
      },
      async findByCode() {
        return null;
      },
    };
    await assert.rejects(() => createOrder(anOrder, { store, cache }), /neon down/);
  });
});

describe('getOrder', () => {
  test('returns the cached order without touching the store', async () => {
    const { store, calls } = fakeStore();
    const { cache, entries } = fakeCache();
    entries.set('HIT00000', anOrder);
    const found = await getOrder('HIT00000', { store, cache });
    assert.deepEqual(found, anOrder);
    assert.equal(calls.find, 0);
  });

  test('falls back to the store on a cache miss', async () => {
    const { store, rows } = fakeStore();
    const { cache } = fakeCache();
    rows.set('MISS0000', stored('MISS0000'));
    const found = await getOrder('MISS0000', { store, cache });
    assert.equal(found?.sender, 'Devaka');
  });

  test('warms the cache after a miss so the next read is a hit', async () => {
    const { store, rows } = fakeStore();
    const { cache, entries } = fakeCache();
    rows.set('WARM0000', stored('WARM0000'));
    await getOrder('WARM0000', { store, cache });
    assert.deepEqual(entries.get('WARM0000'), anOrder);
  });

  test('serves from the store when the cache read throws', async () => {
    const { store, rows } = fakeStore();
    rows.set('CACHEBAD', stored('CACHEBAD'));
    const { cache } = fakeCache({
      async get() {
        throw new Error('redis down');
      },
    });
    const found = await getOrder('CACHEBAD', { store, cache });
    assert.equal(found?.sender, 'Devaka');
  });

  test('serves the order when warming the cache after a miss throws', async () => {
    const { store, rows } = fakeStore();
    rows.set('WARMFAIL', stored('WARMFAIL'));
    const { cache } = fakeCache({
      async set() {
        throw new Error('redis down');
      },
    });
    const found = await getOrder('WARMFAIL', { store, cache });
    assert.equal(found?.sender, 'Devaka');
  });

  test('returns null for a code that does not exist', async () => {
    const { store } = fakeStore();
    const { cache } = fakeCache();
    assert.equal(await getOrder('NOSUCH00', { store, cache }), null);
  });

  test('returns null for a revoked order', async () => {
    const { store, rows } = fakeStore();
    const { cache } = fakeCache();
    rows.set('REVOKED0', stored('REVOKED0', { revokedAt: new Date() }));
    assert.equal(await getOrder('REVOKED0', { store, cache }), null);
  });

  test('does not cache a revoked order', async () => {
    const { store, rows } = fakeStore();
    const { cache, entries } = fakeCache();
    rows.set('REVOKED1', stored('REVOKED1', { revokedAt: new Date() }));
    await getOrder('REVOKED1', { store, cache });
    assert.equal(entries.has('REVOKED1'), false);
  });

  test('throws when the store fails, so a real outage is not reported as a dead link', async () => {
    const { cache } = fakeCache();
    const store: OrderStore = {
      async insert() {},
      async findByCode() {
        throw new Error('neon down');
      },
    };
    await assert.rejects(() => getOrder('ANYCODE0', { store, cache }), /neon down/);
  });

  test('sanitizes rows on the way out, since stored data is still untrusted input', async () => {
    const { store, rows } = fakeStore();
    const { cache } = fakeCache();
    rows.set('DIRTY000', stored('DIRTY000', { sender: '  Dev\x00aka  ' }));
    const found = await getOrder('DIRTY000', { store, cache });
    assert.equal(found?.sender, 'Dev aka');
  });
});
```

- [ ] **Step 2: Add the new test file to the test script**

In `package.json`, extend the `test` script's file list with `test/orders.test.ts`.

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module '../lib/orders'`.

- [ ] **Step 4: Write the implementation**

Create `lib/orders.ts`:

```ts
import { generateCode } from './code';
import { DuplicateCodeError, neonStore, type OrderStore } from './db';
import { redisCache, type OrderCache } from './cache';
import { sanitizeOrder, type Order } from './order';

export type Deps = {
  store: OrderStore;
  cache: OrderCache;
  newCode?: () => string;
};

// Defaults are the real clients; tests pass fakes. This is what keeps the
// cache logic below testable without a live Neon or Redis.
const defaults = (): Deps => ({ store: neonStore, cache: redisCache, newCode: generateCode });

const MAX_CODE_ATTEMPTS = 5;

export async function createOrder(input: Order, deps: Deps = defaults()): Promise<string> {
  const newCode = deps.newCode ?? generateCode;
  const order = sanitizeOrder(input);

  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    const code = newCode();
    try {
      await deps.store.insert({ code, ...order });
    } catch (err) {
      if (err instanceof DuplicateCodeError) continue;
      throw err;
    }

    // The row is committed, so the order exists no matter what happens next.
    // A cold cache costs one slower read; failing here would cost the user
    // their link.
    try {
      await deps.cache.set(code, order);
    } catch (err) {
      console.error('[kade-air] cache warm failed', code, err);
    }

    return code;
  }

  throw new Error(`could not generate an unused share code in ${MAX_CODE_ATTEMPTS} attempts`);
}

/**
 * Resolves a share code to an order.
 *
 * Returns `null` when there is no such order — unknown code, or revoked.
 * Throws when the store itself is unreachable. Callers must keep these apart:
 * the first is a dead link, the second is an outage, and they show different
 * screens.
 */
export async function getOrder(code: string, deps: Deps = defaults()): Promise<Order | null> {
  try {
    const cached = await deps.cache.get(code);
    if (cached) return cached;
  } catch (err) {
    console.error('[kade-air] cache read failed', code, err);
  }

  const row = await deps.store.findByCode(code);
  if (!row || row.revokedAt) return null;

  const order = sanitizeOrder(row);

  try {
    await deps.cache.set(code, order);
  } catch (err) {
    console.error('[kade-air] cache warm failed', code, err);
  }

  return order;
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test`
Expected: all pass, 20 new tests from `test/orders.test.ts`.

- [ ] **Step 6: Commit**

```bash
git add lib/orders.ts test/orders.test.ts package.json
git commit -m "Add the order service with its read-through cache"
```

---

## Task 6: Rate limiting and the Server Action

**Files:**
- Create: `lib/ratelimit.ts`, `app/actions.ts`

**Interfaces:**
- Consumes: `createOrder` from `lib/orders.ts`; `Order` from `lib/order.ts`
- Produces:
  - `createLimiter`, `readLimiter`, `clientIp(headers: Headers): string` from `lib/ratelimit.ts`
  - `createOrderAction(input: Order): Promise<{ ok: true; code: string } | { ok: false; reason: 'rate_limited' | 'failed' }>` from `app/actions.ts`

- [ ] **Step 1: Create `lib/ratelimit.ts`**

```ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { REDIS_TOKEN, REDIS_URL } from './env';

const redis = new Redis({ url: REDIS_URL, token: REDIS_TOKEN });

// Creation writes a permanent row, so it is the expensive one to leave open.
export const createLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  prefix: 'rl:create',
  analytics: false,
});

// Reads are cheap individually, but an open read path is what makes an
// 8-character code enumerable. This ceiling is well above any real reader.
export const readLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(120, '1 m'),
  prefix: 'rl:read',
  analytics: false,
});

// Vercel populates x-forwarded-for. The first entry is the client; the rest are
// proxies. Falls back to a constant so a missing header degrades to one shared
// bucket rather than silently disabling the limiter.
export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || 'unknown';
}
```

- [ ] **Step 2: Create `app/actions.ts`**

```ts
'use server';

import { headers } from 'next/headers';
import { createOrder } from '@/lib/orders';
import { clientIp, createLimiter } from '@/lib/ratelimit';
import type { Order } from '@/lib/order';

export type CreateOrderResult =
  | { ok: true; code: string }
  | { ok: false; reason: 'rate_limited' | 'failed' };

export async function createOrderAction(input: Order): Promise<CreateOrderResult> {
  const h = await headers();

  try {
    const { success } = await createLimiter.limit(clientIp(h));
    if (!success) return { ok: false, reason: 'rate_limited' };
  } catch (err) {
    // A limiter outage must not take ordering down with it.
    console.error('[kade-air] rate limiter unavailable, allowing request', err);
  }

  try {
    const code = await createOrder(input);
    return { ok: true, code };
  } catch (err) {
    console.error('[kade-air] order creation failed', err);
    return { ok: false, reason: 'failed' };
  }
}
```

- [ ] **Step 3: Verify the types compile**

Run: `npx tsc --noEmit`
Expected: errors still limited to `app/d/[token]/*` and `components/CreateFlow.tsx`.

- [ ] **Step 4: Run the tests**

Run: `npm test`
Expected: unchanged from Task 5. These files add no tests — the action is a thin composition, and its parts are already covered.

- [ ] **Step 5: Commit**

```bash
git add lib/ratelimit.ts app/actions.ts
git commit -m "Add rate limiting and the order creation action"
```

---

## Task 7: The read path — route rename, page, and OG image

**Files:**
- Delete: `app/d/[token]/page.tsx`, `app/d/[token]/opengraph-image.tsx`
- Create: `app/d/[code]/page.tsx`, `app/d/[code]/opengraph-image.tsx`

**Interfaces:**
- Consumes: `getOrder` from `lib/orders.ts`; `readLimiter`, `clientIp` from `lib/ratelimit.ts`
- Produces: nothing consumed by later tasks

**Context:** Three behaviours from the spec land here and are easy to lose.

1. `getOrder` is wrapped in React's `cache()` so `generateMetadata` and the page component share one lookup per render.
2. The OG image's fallback card must send `no-store`, or a Neon outage poisons the CDN with a generic card against that URL essentially forever.
3. **The read path must be rate limited.** The spec's accepted-risk argument for an 8-character code depends on this explicitly — without it, the enumeration ceiling the spec claims does not exist. Both the page and the OG image route check `readLimiter()` before doing any work, so a client grinding through codes stops costing Neon reads and Satori renders. At 120/minute a real recipient (1-3 requests) never comes near it.

**Rate-limiting rules for this task, both routes:**

- The limiter call **fails open**. If Redis is unreachable, log and serve the request. A limiter outage must never take the delivery page down — same rule as everywhere else in this plan.
- Over-quota returns the **same `BrokenLink` screen a genuinely dead code returns**. Do not invent a new screen and do not tell the client they were limited; there is nothing to gain by confirming it, and it keeps the response shape uniform.
- The check happens **before** `loadOrder`, so an over-quota request costs no database read.

- [ ] **Step 1: Move the route directory**

```bash
git mv app/d/\[token\] app/d/\[code\]
```

- [ ] **Step 2: Rewrite `app/d/[code]/page.tsx`**

```tsx
import { cache } from 'react';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { preload } from 'react-dom';
import RecipientView from '@/components/RecipientView';
import BrokenLink from '@/components/BrokenLink';
import { findDish } from '@/lib/dishes';
import { getOrder } from '@/lib/orders';
import { senderDisplay, type Order } from '@/lib/order';
import { clientIp, readLimiter } from '@/lib/ratelimit';
import { isDesktopUA } from '@/lib/ua';

type Props = { params: Promise<{ code: string }> };

/**
 * True when this client may proceed.
 *
 * Short codes are only as safe as the ceiling on guessing them, so the read
 * path is limited as well as creation. Fails OPEN: if Redis is unreachable we
 * serve the delivery rather than punish a recipient for our outage.
 */
async function mayRead(ip: string): Promise<boolean> {
  try {
    const { success } = await readLimiter().limit(ip);
    return success;
  } catch (err) {
    console.error('[kade-air] read limiter unavailable, allowing request', err);
    return true;
  }
}

/**
 * The one door to an order for this request.
 *
 * The limiter check lives inside the cached loader rather than in the page
 * component, because generateMetadata also loads the order and runs in the
 * same pass — a check in only one of them would let the other pay for the
 * database read anyway. cache() means one limiter call and one lookup per
 * render, shared by both.
 *
 * Over-quota returns null, which is deliberately the same answer a dead code
 * gives: the recipient sees BrokenLink, a crawler sees the stale-link title,
 * and a guesser learns nothing about whether the code was real.
 */
const loadOrder = cache(async (code: string): Promise<Order | null> => {
  const h = await headers();
  if (!(await mayRead(clientIp(h)))) return null;
  return getOrder(code);
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const order = await loadOrder(code).catch(() => null);

  if (!order) {
    return { title: 'Kade Air — this link went stale', robots: { index: false, follow: false } };
  }

  const dish = findDish(order.dishId);
  const title = `${dish.emoji} ${senderDisplay(order)} sent you ${dish.name}!`;
  const description = 'Your delivery is on the way. Tap to watch the drone fly it over Colombo.';

  return {
    title,
    description,
    // Titles carry real names ("Devaka sent you Kottu!"). Never index these —
    // robots.txt intentionally permits the fetch so previews still render.
    robots: { index: false, follow: false },
    openGraph: { title, description, type: 'website', url: `/d/${code}`, siteName: 'Kade Air' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function DeliveryPage({ params }: Props) {
  const [{ code }, h] = await Promise.all([params, headers()]);

  // No limiter call here — loadOrder already made it, once, for this render.
  // Checking again would charge the limiter twice per page view and halve the
  // effective quota for legitimate readers.
  //
  // A missing order and an unreachable database are different problems and get
  // different screens: BrokenLink says "this link is dead", which would be a lie
  // during an outage. Let a thrown error reach app/error.tsx instead.
  const order = await loadOrder(code);
  if (!order) return <BrokenLink />;

  const dish = findDish(order.dishId);
  preload(dish.low, { as: 'image', fetchPriority: 'high' });
  preload(dish.high, { as: 'image', fetchPriority: 'low' });

  return <RecipientView order={order} initialDesktop={isDesktopUA(h.get('user-agent'))} />;
}
```

- [ ] **Step 3: Rewrite `app/d/[code]/opengraph-image.tsx`**

Keep the entire JSX card exactly as it is today. Change only the data source, the transcode memoization, and the fallback cache header. The top of the file becomes:

```tsx
import path from 'node:path';
import { ImageResponse } from 'next/og';
import { headers } from 'next/headers';
import sharp from 'sharp';
import { findDish } from '@/lib/dishes';
import { getOrder } from '@/lib/orders';
import { senderDisplay } from '@/lib/order';
import { clientIp, readLimiter } from '@/lib/ratelimit';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'AirKade — a friend sent you food by drone';

// Satori won't fetch by URL and can't decode WebP, so site artwork is
// transcoded to PNG and inlined. The result for a given file is identical on
// every request, so it is computed once per warm instance rather than per
// request — this used to be the single most expensive thing in the route.
const transcodes = new Map<string, Promise<string>>();

function pngUri(publicPath: string): Promise<string> {
  let cached = transcodes.get(publicPath);
  if (!cached) {
    cached = sharp(path.join(process.cwd(), 'public', publicPath))
      .png()
      .toBuffer()
      .then((png) => `data:image/png;base64,${png.toString('base64')}`);
    transcodes.set(publicPath, cached);
  }
  return cached;
}

export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const [{ code }, h] = await Promise.all([params, headers()]);

  // This route is the expensive one — a Satori render per uncached request —
  // so it is limited too, before any lookup or render work. Fails open: a
  // limiter outage must not strip the preview card off every shared link.
  let allowed = true;
  try {
    allowed = (await readLimiter().limit(clientIp(h))).success;
  } catch (err) {
    console.error('[kade-air] read limiter unavailable, allowing request', err);
  }

  const order = allowed ? await getOrder(code).catch(() => null) : null;

  const dish = findDish(order?.dishId ?? 'kottu');
  const sender = order ? senderDisplay(order) : 'Someone';
  const [logo, art] = await Promise.all([
    pngUri('brand/airkade-logo.webp'),
    pngUri(dish.low.replace(/^\//, '')),
  ]);

  // A resolved card is immutable and can be cached hard. The fallback card is
  // a guess made during an outage or for a dead link — caching it would pin the
  // wrong preview to this URL long after the cause is fixed.
  //
  // Named responseHeaders, not headers: `headers` is already the imported
  // next/headers function in this module, and shadowing it here is a TDZ
  // ReferenceError, not merely a style problem.
  const responseHeaders: Record<string, string> = order
    ? { 'Cache-Control': 'public, max-age=31536000, immutable' }
    : { 'Cache-Control': 'no-store' };

  return new ImageResponse(
    (
      // ... the existing card JSX, entirely unchanged ...
    ),
    { ...size, emoji: 'twemoji', headers: responseHeaders },
  );
}
```

Copy the existing card JSX verbatim from the old file into the position marked above. Do not restyle it.

- [ ] **Step 4: Verify the build passes**

Run: `npm run build`
Expected: PASS for the first time since Task 3 — unless `components/CreateFlow.tsx` still imports `encodeOrder`, which Task 8 fixes. If that is the only remaining error, it is expected.

- [ ] **Step 5: Verify no stale route references remain**

Run: `grep -rn "\[token\]" --include="*.ts" --include="*.tsx" app components lib`
Expected: no matches. (`app/robots.ts` refers to `/d/*/opengraph-image`, which is a URL pattern and stays correct.)

- [ ] **Step 6: Verify the read limiter is actually wired**

Run: `grep -rn "readLimiter" --include="*.tsx" app/d`
Expected: a match in **both** `app/d/[code]/page.tsx` and `app/d/[code]/opengraph-image.tsx`.

This step exists because an earlier revision of this plan declared `readLimiter` in Task 7's Consumes list and then never called it, which would have left the spec's accepted-risk argument for 8-character codes unimplemented while appearing complete. Confirm by reading, not just by grep, that each call site happens **before** any `getOrder` call and that each one fails open.

- [ ] **Step 7: Run the tests**

Run: `npm test`
Expected: unchanged from Task 5.

- [ ] **Step 8: Commit**

```bash
git add app/d
git commit -m "Read deliveries by share code, and stop re-transcoding OG art"
```

---

## Task 8: The create path — CreateFlow and the pending state

**Files:**
- Modify: `components/CreateFlow.tsx`
- Modify: `components/screens/Personalise.tsx`
- Modify: `components/desktop/PersonaliseD.tsx`

**Interfaces:**
- Consumes: `createOrderAction`, `CreateOrderResult` from `app/actions.ts`
- Produces: nothing consumed by later tasks

**Context:** "Release the drone" gains real latency for the first time. Both Personalise variants take two new optional props, and both render the submit control as a `<div onClick>` today — keep that markup style, since converting to semantic buttons is separate, already-catalogued work and is not this plan's scope.

- [ ] **Step 1: Update `components/CreateFlow.tsx`**

Replace the `encodeOrder` import with the action, and swap the derived-link block. Remove:

```tsx
import { encodeOrder, messageDisplay, recipientDisplay, senderDisplay } from '@/lib/order';
```

for:

```tsx
import { messageDisplay, recipientDisplay, senderDisplay } from '@/lib/order';
import { createOrderAction } from '@/app/actions';
```

Delete the `useMemo` token line and the `link` const. In their place, add state and a submit handler:

```tsx
const [code, setCode] = useState('');
const [submitting, setSubmitting] = useState(false);
const [submitError, setSubmitError] = useState<'rate_limited' | 'failed' | null>(null);

const link = code ? `${origin || 'https://kade.air'}/d/${code}` : '';

const submitOrder = async () => {
  if (submitting) return;
  setSubmitting(true);
  setSubmitError(null);

  const result = await createOrderAction(order);

  setSubmitting(false);
  if (result.ok) {
    setCode(result.code);
    setScreen('share');
    return;
  }
  setSubmitError(result.reason);
};
```

Pass the new props to both Personalise variants in the `personalise` case, replacing `onSubmit={() => setScreen('share')}`:

```tsx
onSubmit={submitOrder}
submitting={submitting}
submitError={submitError}
```

- [ ] **Step 2: Update `components/screens/Personalise.tsx`**

Extend the `Props` type:

```tsx
  onSubmit: () => void;
  submitting?: boolean;
  submitError?: 'rate_limited' | 'failed' | null;
```

Add them to the destructured parameter list, then replace the submit block at the bottom of the component:

```tsx
      <div style={{ flex: 'none', padding: '12px 22px 26px', background: '#fdf6ea' }}>
        {submitError && (
          <div style={{ fontSize: 13, fontWeight: 700, color: '#c2410c', marginBottom: 10, textAlign: 'center' }}>
            {submitError === 'rate_limited'
              ? 'Ayyo. Kade uncle needs a break — try again in a bit.'
              : 'Ayyo. The drone never took off. Give it another go.'}
          </div>
        )}
        <div
          onClick={submitting ? undefined : onSubmit}
          className="press cta"
          style={{
            background: submitting ? '#8ab5b1' : '#17a398',
            fontSize: 21,
            padding: 17,
            cursor: submitting ? 'default' : 'pointer',
          }}
        >
          {submitting ? 'Warming up the drone…' : 'Release the drone'}
        </div>
      </div>
```

- [ ] **Step 3: Update `components/desktop/PersonaliseD.tsx`**

Extend `Props` and the destructured list identically to Step 2. Replace the sticky submit block:

```tsx
            {submitError && (
              <div style={{ fontSize: 14, fontWeight: 700, color: '#c2410c', marginTop: 8 }}>
                {submitError === 'rate_limited'
                  ? 'Ayyo. Kade uncle needs a break — try again in a bit.'
                  : 'Ayyo. The drone never took off. Give it another go.'}
              </div>
            )}
            <div
              onClick={submitting ? undefined : onSubmit}
              className="press cta"
              style={{
                position: 'sticky',
                bottom: 24,
                marginTop: 8,
                flex: 'none',
                background: submitting ? '#8ab5b1' : '#17a398',
                fontSize: 22,
                padding: 18,
                cursor: submitting ? 'default' : 'pointer',
              }}
            >
              {submitting ? 'Warming up the drone…' : 'Release the drone'}
            </div>
```

- [ ] **Step 4: Verify the build passes cleanly**

Run: `npm run build`
Expected: PASS with no errors anywhere.

- [ ] **Step 5: Verify the codec is fully gone**

Run: `grep -rn "encodeOrder\|decodeOrder\|toBase64Url\|fromBase64Url" --include="*.ts" --include="*.tsx" app components lib test`
Expected: no matches.

- [ ] **Step 6: Run the full suite**

Run: `npm test`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add components/CreateFlow.tsx components/screens/Personalise.tsx components/desktop/PersonaliseD.tsx
git commit -m "Create orders through the server action instead of the URL"
```

---

## Task 9: Manual smoke check against real services

**Files:**
- Create: `docs/superpowers/plans/2026-08-01-smoke-check.md` (the recorded result)

**Interfaces:**
- Consumes: everything above
- Produces: nothing

**Context:** Global Constraint 1 keeps live services out of `npm test`, so this is where the real Neon and Redis integration actually gets exercised. It is a checklist run by a human against a Vercel preview deployment, and its recorded output is the task's deliverable.

- [ ] **Step 1: Provision and configure**

Create a Neon project and an Upstash Redis database, both through the Vercel marketplace so the environment variables are injected automatically. Confirm all four variables from `.env.example` are set on the preview environment.

- [ ] **Step 2: Apply the schema**

Run: `npm run db:migrate` with `DATABASE_URL` set to the Neon connection string.
Expected: `Schema applied.`

- [ ] **Step 3: Walk the happy path on the preview deployment**

Create an order through the UI. Confirm: the Share screen shows an 8-character code, the link matches `/d/XXXXXXXX`, and the row is present in Neon (`select * from orders`).

- [ ] **Step 4: Confirm the cache was warmed at creation**

Check that the Redis key `order:XXXXXXXX` exists and carries a TTL near 172800 seconds.

- [ ] **Step 5: Confirm the preview card renders**

Paste the link into WhatsApp (or run it through a card validator). Confirm the title reads `<sender> sent you <dish>!` and the image renders the real dish, not the Kottu fallback.

- [ ] **Step 6: Confirm Redis is genuinely optional**

Delete the `order:XXXXXXXX` key, then reload the delivery page. Expected: the page renders normally, and the key reappears afterwards.

- [ ] **Step 7: Confirm revocation works**

Run `update orders set revoked_at = now() where code = 'XXXXXXXX';`, delete the Redis key so the cache does not mask it, then reload. Expected: the `BrokenLink` screen.

- [ ] **Step 8: Confirm the rate limiter fires**

Create more than 10 orders within an hour from one IP. Expected: the "Kade uncle needs a break" message, and no further rows in Neon.

- [ ] **Step 9: Record the results and commit**

Write each step's observed outcome into `docs/superpowers/plans/2026-08-01-smoke-check.md`.

```bash
git add docs/superpowers/plans/2026-08-01-smoke-check.md
git commit -m "Record the smoke check against real Neon and Redis"
```

---

## Self-Review Notes

**Spec coverage.** Every section of the spec maps to a task: data model and migrations → Task 1; short codes and their accepted risk → Task 2; `lib/order.ts` changes → Task 3; drivers and module structure → Tasks 4-5; rate limiting → Task 6; route rename, `React.cache()`, OG memoization, and the `no-store` fallback → Task 7; component changes → Task 8; the failure-handling table → Tasks 5, 7, and 8, verified in Task 9. Revocation appears as the schema column (Task 1), the read check (Task 5), and the smoke check (Task 7 step 7 of Task 9).

**Known deviation from the spec.** The spec states a 32-character alphabet giving ~1.1 × 10¹² possibilities (~40 bits). Excluding `0`, `1`, `I`, `L`, `O`, and `U` from an alphanumeric uppercase set actually yields **30** characters, so the real figure is 30⁸ ≈ 6.56 × 10¹¹ (~39.26 bits) — verified by computation, not estimated. The security argument is unchanged (an attacker with 10,000 stored orders still needs ~66 million requests to hit one valid link, against a rate-limited read path), but the spec's numbers are wrong and should be corrected to match this plan rather than the reverse: the unambiguous alphabet is the deliberate choice, and "32" was an unchecked round number. There is no clean 32nd character available without either reintroducing an ambiguous glyph or mixing in lowercase, which would hurt codes read aloud.

**Deliberately left red.** Task 3 commits with a failing build, because removing the codec breaks three call sites that Tasks 7 and 8 rewrite. Each task states the exact expected failure so a reviewer can tell an expected break from a real one.
