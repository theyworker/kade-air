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
