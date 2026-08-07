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

-- Where the sender appeared to be when they placed it. These arrived after the
-- table did, so they are alters rather than columns above: a database created
-- before this change gets them here, and a fresh one gets them here too. The
-- estimate is a coarse label derived from the request's IP at the edge (see
-- lib/place.ts) — the IP itself is never stored. created_at above is already
-- the sender's timestamp, so there is nothing more to add for them.
alter table orders add column if not exists sender_location text not null default '';
alter table orders add column if not exists sender_timezone text not null default '';

-- One row per opening. An order can be opened many times — a recipient who
-- watches it twice, or shows it to someone — and every one of those is worth
-- keeping, so this is a log rather than a column. Whether an order was ever
-- opened, and when it first was, are questions this answers by reading it.
--
-- A row is written when the message actually reaches the recipient, at the end
-- of the delivery, not when the page loads. See app/actions.ts.
create table if not exists order_opens (
  id        bigint generated always as identity primary key,
  code      text        not null references orders (code) on delete cascade,
  opened_at timestamptz not null default now(),
  location  text        not null default '',
  timezone  text        not null default ''
);

-- Every read of this table is "the opens of one order, oldest first".
create index if not exists order_opens_code_idx on order_opens (code, opened_at);

-- The first cut of this stored a single open per order, in columns on `orders`.
-- The log above replaces them outright. They are dropped rather than left
-- behind because a second place an open could live is a second answer to the
-- same question — and these never shipped past this branch, so there is no
-- history in them to keep.
alter table orders drop column if exists opened_at;
alter table orders drop column if exists opened_location;
alter table orders drop column if exists opened_timezone;
