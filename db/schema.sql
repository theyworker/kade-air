-- Applied by scripts/migrate.ts, which splits this file on the statement
-- separator and runs each statement in its own call — Neon's HTTP driver
-- allows only one statement per call. Two rules follow from that, and both
-- matter:
--
--   1. Every statement must be idempotent. This file is the entire migration
--      story, re-applied in full, and a second run must be a no-op.
--   2. The separator must not appear inside a string literal or a function
--      body, because the split is naive and does not know it is inside one.
--      Anything that needs it has outgrown this file.
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

-- Who sent it, from where, and when they opened it. These arrived after the
-- table did, so they are alters rather than columns above: a database created
-- before this change gets them here, and a fresh one gets them here too. The
-- estimates are coarse labels derived from the request's IP at the edge (see
-- lib/place.ts) — the IP itself is never stored.
--
-- created_at above already answers "when was it sent", so the sender needs no
-- timestamp of their own. The recipient does: opened_at is null until someone
-- actually opens the link, and that null is the distinction the whole change
-- exists for.
alter table orders add column if not exists sender_location text not null default '';
alter table orders add column if not exists sender_timezone text not null default '';
alter table orders add column if not exists opened_at       timestamptz;
alter table orders add column if not exists opened_location text not null default '';
alter table orders add column if not exists opened_timezone text not null default '';
