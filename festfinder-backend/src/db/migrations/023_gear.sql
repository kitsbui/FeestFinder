-- The gear and software artists play and produce with. The catalogue is curated: an artist
-- may name something new, which stays off public pages until the team approves it. An item
-- can carry an affiliate link (affiliate_links), shown as "where to get it".

create table gear_items (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique check (slug ~ '^[a-z0-9-]{2,80}$'),
  name               text not null,
  brand              text not null default '',
  category           text not null check (category in ('daw', 'plugin', 'controller', 'mixer', 'cdj', 'turntable', 'synth',
                                                      'drum_machine', 'sampler', 'interface', 'headphones', 'monitors', 'microphone', 'other')),
  normalized_name    text not null,
  website            text check (website ~ '^https://'),
  affiliate_link_id  uuid references affiliate_links on delete set null,
  approved           boolean not null default false,
  suggested_by       uuid references users on delete set null,
  created_at         timestamptz not null default now()
);
create unique index gear_items_name on gear_items (normalized_name);
create index gear_items_category on gear_items (category) where approved;

create table artist_gear (
  artist_id   uuid not null references artists on delete cascade,
  gear_id     uuid not null references gear_items on delete cascade,
  -- Where they use it.
  used_for    text not null default 'both' check (used_for in ('studio', 'live', 'both')),
  position    int not null default 0,
  primary key (artist_id, gear_id)
);
create index artist_gear_gear on artist_gear (gear_id);

-- A starting catalogue: the tools most DJs and producers in the region name first.
insert into gear_items (slug, name, brand, category, normalized_name, approved) values
  ('ableton-live', 'Ableton Live', 'Ableton', 'daw', 'ableton live', true),
  ('fl-studio', 'FL Studio', 'Image-Line', 'daw', 'fl studio', true),
  ('logic-pro', 'Logic Pro', 'Apple', 'daw', 'logic pro', true),
  ('bitwig-studio', 'Bitwig Studio', 'Bitwig', 'daw', 'bitwig studio', true),
  ('rekordbox', 'rekordbox', 'AlphaTheta', 'other', 'rekordbox', true),
  ('serato-dj', 'Serato DJ', 'Serato', 'other', 'serato dj', true),
  ('traktor-pro', 'Traktor Pro', 'Native Instruments', 'other', 'traktor pro', true),
  ('cdj-3000', 'CDJ-3000', 'Pioneer DJ', 'cdj', 'cdj 3000', true),
  ('djm-v10', 'DJM-V10', 'Pioneer DJ', 'mixer', 'djm v10', true),
  ('djm-900nxs2', 'DJM-900NXS2', 'Pioneer DJ', 'mixer', 'djm 900nxs2', true),
  ('ddj-flx10', 'DDJ-FLX10', 'Pioneer DJ', 'controller', 'ddj flx10', true),
  ('technics-sl-1200', 'SL-1200', 'Technics', 'turntable', 'sl 1200', true),
  ('roland-tr-8s', 'TR-8S', 'Roland', 'drum_machine', 'tr 8s', true),
  ('elektron-digitakt', 'Digitakt', 'Elektron', 'sampler', 'digitakt', true),
  ('serum', 'Serum', 'Xfer Records', 'plugin', 'serum', true),
  ('push-3', 'Push 3', 'Ableton', 'controller', 'push 3', true);

do $$
declare
  t record;
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    for t in select tablename from pg_tables where schemaname = 'public' loop
      execute format('alter table public.%I enable row level security', t.tablename);
    end loop;
    revoke all on all tables in schema public from anon, authenticated;
    revoke all on all sequences in schema public from anon, authenticated;
  end if;
end $$;
