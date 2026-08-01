# Design: Move orders from the URL into Neon, with a Redis cache and short share codes

**Date:** 2026-08-01
**Status:** Approved, ready for implementation planning

## Problem

Today an entire order — dish, sender name, recipient name, and personal message — is
base64url-encoded into the share link itself (`lib/order.ts`). There is no database.
That design has real virtues: links are self-describing, generation needs no network,
and previews work for a link created seconds ago.

It also has three costs that matter now that the app is being deployed publicly on
Vercel:

1. **PII travels in the URL.** Base64 is encoding, not encryption. Names and messages
   are readable by anyone holding the link, and they land in server logs, CDN logs,
   browser history, and every third-party crawler that fetches the preview.
2. **Links are permanent and irrevocable.** There is no way to kill an abusive or
   regretted link.
3. **Tokens are attacker-generated and unbounded.** Every unique token is a guaranteed
   cache miss on the OG image route, which does real CPU work per request — an
   amplification vector with no rate limit in front of it.

## Solution overview

Orders move into Neon Postgres. The share link carries only a short opaque code. Redis
sits in front as a read-through cache, warmed at creation time so the WhatsApp preview
that follows a few seconds later is already a hit.

```
                    ┌──────────────────────────────┐
  Release the drone │  Server Action               │
  ─────────────────▶│    rate limit → validate     │
                    │    → generate code           │
                    │    → INSERT Neon             │
                    │    → warm Redis (TTL 2d)     │
                    └──────────┬───────────────────┘
                               │ { code }
                               ▼
                    kade.air/d/K7bQ2xMv

  generateMetadata ─┐
  delivery page    ─┼─▶ getOrder(code) ─▶ Redis hit? ─ yes ─▶ order
  OG image route   ─┘                          │
                                               no ─▶ Neon ─▶ warm ─▶ order
```

Neon is the source of truth. Redis is only ever an optimisation — every read path must
work correctly, if more slowly, with Redis entirely absent.

## Decisions taken

| Decision | Choice | Why |
|---|---|---|
| PII location | Neon row, not the URL | Removes PII from logs, history, and crawler fetches |
| Link lifetime | Permanent | Rows never expire; a link in a WhatsApp group keeps working |
| Redis TTL | 2 days | Cache eviction only — a miss re-reads Neon and re-warms |
| Write timing | On "Release the drone" | A screen transition users already expect to take a beat |
| Read path | Cache order data only, not rendered PNGs | Vercel's CDN already caches the image response by URL |
| Code length | 8 chars, 32-char alphabet | ~40 bits; short enough to read aloud, with rate limiting behind it |

## Data model

```sql
create table orders (
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

`code` is the primary key because every read is a lookup by it.

`chain` stays a plain integer, exactly as it behaves today. It is deliberately **not**
promoted into a parent/child graph — that would change the product, and it was not
asked for.

`revoked_at` is nullable and checked on read. No admin UI in this scope; revoking is a
manual `UPDATE` for now.

### Schema management

A checked-in `.sql` file plus a small `npm run db:migrate` script that executes it
through the Neon driver. One table does not justify Drizzle or Prisma, and neither
justifies its dependency tree here.

## Short codes

- **Alphabet:** 32 characters, with ambiguous glyphs removed (`0`/`O`, `1`/`l`/`I`).
- **Length:** 8 characters → ~1.1 × 10¹² possibilities (~40 bits).
- **Source:** `crypto.getRandomValues`. Never `Math.random`.
- **Collision handling:** rely on the primary-key constraint. On a unique violation,
  generate a new code and retry (bounded attempts). No pre-check `SELECT`, so there is
  no read-then-write race.

### Accepted risk

An 8-character code is enumerable in a way the old ~200-character token was not, and
there is now PII behind it. With 10,000 orders stored, an attacker needs roughly 110
million requests to hit one valid link — slow, and extremely visible in logs.

This is acceptable because the rate limiter covers the **read** path as well as
creation, and `/d/` already emits `noindex, nofollow`. If more headroom is ever wanted,
10 characters buys 50 bits for two more characters of link length.

## Module structure

```
lib/code.ts        generateCode()             alphabet + crypto random
lib/db.ts          insertOrder, findByCode    Neon; SQL lives only here
lib/cache.ts       getCached, setCached       Redis; key naming + TTL
lib/ratelimit.ts   creation + read limiters   Upstash
lib/orders.ts      createOrder, getOrder      the only door the app uses
```

`lib/orders.ts` is the seam that matters: every caller goes through it, and no caller
knows Redis or Neon exist. That is what makes the read path testable without either
service running.

`getOrder` is wrapped in React's `cache()` so that `generateMetadata` and the page
component — which both run in a single render pass — share one lookup instead of
issuing two.

### Drivers

`@neondatabase/serverless` and `@upstash/redis`, both over HTTP. Serverless functions
cannot hold a TCP connection pool across invocations; both drivers sidestep the problem
rather than needing a pooler in front.

### What happens to `lib/order.ts`

Removed: `encodeOrder`, `decodeOrder`, `toBase64Url`, `fromBase64Url`.

Retained: the `Order` type, `MAX_NAME`, `MAX_MESSAGE`, `clean()`, and the three display
helpers (`senderDisplay`, `recipientDisplay`, `messageDisplay`). `clean()` becomes more
important, not less — it is now the validation gate on what enters the database.

### Route and component changes

- `app/d/[token]/` → `app/d/[code]/`
- `CreateFlow` replaces its `useMemo` link derivation with state set by the Server Action
- `Personalise` gains a pending state on submit — "Release the drone" has real latency
  for the first time
- `RecipientView`, `Share`, and `ShareD` are unchanged; they already accept an `order`
  object and a `link` string

## Failure handling

The guiding rule: **a cache is an optimisation, never a dependency.**

| What fails | Behaviour |
|---|---|
| Redis unreachable on read | Fall through to Neon and serve normally. Logged; invisible to the user. |
| Redis unreachable on warm | Swallow it. The Neon write already succeeded, so the order exists and the user gets their link. |
| Neon write fails on create | Error state on the Personalise screen with a retry, in the app's voice. The only failure a user sees directly. |
| Rate limit hit on create | A friendly "kade's a bit busy" message, not a crash. |
| Code not found, or revoked | The existing `BrokenLink` screen, which was built for exactly this case. |
| Neon unreachable on read | `ErrorScreen`, **not** `BrokenLink`. A real link that is temporarily broken must not tell the recipient their link is dead. |

### CDN poisoning on the OG fallback

When the OG image route cannot load an order it falls back to a generic card
("Someone" + Kottu). That is the right behaviour — a generic card beats a broken image.

But Next sets a long `max-age` on metadata image responses. If that fallback renders
during a Neon outage, the CDN caches the wrong card against that URL essentially
forever.

**The fallback path must send `no-store`.** Only a real, resolved card gets the long
cache header. Cheap to do deliberately; genuinely nasty to discover in production.

## Environment

- `DATABASE_URL`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `NEXT_PUBLIC_SITE_URL`

`NEXT_PUBLIC_SITE_URL` currently falls back to `http://localhost:3000` when unset
outside Vercel, which silently points every OG preview at localhost. Missing values
should fail loudly at startup rather than degrade quietly.

## Scope additions

Three findings from the prior audit are in scope, because Neon and Redis make them
nearly free:

1. **Rate limiting** on order creation *and* on the read path, riding the Redis being
   added anyway. Without it, order creation is an open endpoint writing unbounded rows.
2. **Memoized OG transcodes.** The logo is currently re-transcoded by `sharp` on every
   preview request despite being byte-identical every time; the 30 dish icons can be
   precomputed once at module scope.
3. **Revocation** — the `revoked_at` column above, checked on read. Column and check
   only; no admin UI.

Short codes additionally close the audit's cache-amplification finding for free, since
codes are now server-minted and finite rather than attacker-generated and unbounded.

## Testing

**Hard constraint: `npm test` stays network-free.** No test may require a live Neon or
Redis instance, or the suite stops being run.

This shapes one design choice: `lib/orders.ts` takes its db and cache clients as
injectable parameters defaulting to the real ones. The tests then exercise the actual
cache logic against fakes:

- cache hit
- cache miss → Neon read → warm
- warm failure is survivable
- Neon read failure surfaces as an error, not as "not found"
- revoked row → not found
- unknown code → not found

`lib/code.ts` gets real tests: correct alphabet, no ambiguous glyphs, correct length, no
duplicates across a large sample, sourced from `crypto`.

The surviving `lib/order.ts` tests (sanitisation, truncation, clamping, display
helpers) carry over and become more valuable, since they now guard what lands in
Postgres. The round-trip and malformed-token tests are deleted along with the codec
they pinned — the correct outcome, not a loss.

`test/flight.test.ts`, `test/dishes.test.ts`, and `test/ua.test.ts` (199 of the current
235 tests) are untouched. The remaining 36 live in `test/order.test.ts`, and roughly
half of those go with the codec.

Anything requiring real Neon and Redis is a manual smoke check against a preview
deployment, not part of `npm test`.

## Out of scope

- Migrating existing links. The app is not yet deployed, so there are no live links in
  the old format, and `/d/[token]` support is dropped rather than maintained.
- An admin UI for revocation or moderation.
- Turning `chain` into a parent/child graph.
- Component, hook, and DOM test coverage (a separate, previously deferred decision).
- CI wiring for the test suite (still an open recommendation from the audit).
