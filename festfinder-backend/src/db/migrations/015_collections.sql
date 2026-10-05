-- Collections: a person's own lists of events ("Tết 2027", "Hẹn hò"), private until they
-- turn on a public link. The slug is made the first time a collection goes public and kept,
-- so a shared link survives a rename.
create table collections (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users on delete cascade,
  name        text not null check (char_length(name) between 1 and 60),
  slug        text unique,
  is_public   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index collections_user on collections (user_id, updated_at desc);

create table collection_items (
  collection_id uuid not null references collections on delete cascade,
  event_id      uuid not null references events on delete cascade,
  added_at      timestamptz not null default now(),
  primary key (collection_id, event_id)
);
create index collection_items_event on collection_items (event_id);

-- Instagram and TikTok are share channels of their own now.
alter table event_shares drop constraint if exists event_shares_channel_check;
alter table event_shares add constraint event_shares_channel_check
  check (channel in ('zalo', 'facebook', 'messenger', 'threads', 'x', 'telegram', 'copy', 'native', 'story', 'instagram', 'tiktok'));
