-- This file must contain exactly one top-level statement: scripts/migrate.ts
-- runs it through Neon's HTTP driver via sql.query(), which allows only one
-- statement per call. Adding a second (an index, another table) requires
-- switching to sql.transaction([...]) or splitting this file on `;`.
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
