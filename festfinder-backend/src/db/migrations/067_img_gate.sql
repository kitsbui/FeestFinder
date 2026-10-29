-- GET /img (routes/images.ts) resizes only a picture a row stores: its gate, knownImage in
-- services/remote-images.ts, asks every picture column whether it holds the link, without its
-- #ff= framing, for anyone who sends a well-formed key. Until now nothing indexed
-- split_part(<column>, '#', 1), so each question read every table. The indexes below match the
-- gate's query expression for expression, partial where the gate only counts what a page shows
-- (PICTURE_COLUMNS: an artist the team hid, a removed moment, a hidden comment or post, a hidden
-- news item); the lists of links (an ad's images, a recap's photos) and the pictures in a blog
-- post's body are GIN indexes over two immutable helpers that give a row's links as an array.
--
-- When a row stops showing a picture (replaced, cleared, hidden, removed, deleted), the CDN keeps
-- its resized copies for a year: the takedown triggers queue the link in img_purges, and the
-- imageCdn job asks Vercel to delete the copies by their cache tag once no other row shows it.
-- When an event goes public or changes its cover, img_warms queues the cover, and the same job
-- has its common sizes made through the public origin, so the first visitor is not the one who
-- waits for the resize.

-- A row's picture links, without their framing.
create or replace function ff_link_bases(links text[]) returns text[] language sql immutable parallel safe as $$
  select coalesce(array(select split_part(x, '#', 1) from unnest(links) as x), '{}')
$$;

-- The pictures a blog post's body names, ![alt](https://…) or ![alt](https://… "caption"), in
-- either language: the same pattern the gate used to read with regexp_matches (a plain
-- [text](link) is a link, never a picture).
create or replace function ff_body_pictures(body jsonb) returns text[] language sql immutable parallel safe as $$
  select coalesce(array(
    select (m.found)[1]
      from jsonb_each_text(case when jsonb_typeof(body) = 'object' then body else '{}' end) as b(lang, text),
           regexp_matches(b.text, '!\[[^\]]*\]\((https://[^[:space:])#]+)', 'g') as m(found)
  ), '{}')
$$;

create index if not exists img_events_cover on events ((split_part(cover_url, '#', 1)));
create index if not exists img_events_logo on events ((split_part(logo_url, '#', 1)));
create index if not exists img_artists_image on artists ((split_part(image_url, '#', 1))) where hidden_at is null;
create index if not exists img_artists_cover on artists ((split_part(cover_url, '#', 1))) where hidden_at is null;
create index if not exists img_organizers_logo on organizers ((split_part(logo_url, '#', 1)));
create index if not exists img_organizers_cover on organizers ((split_part(cover_url, '#', 1)));
create index if not exists img_users_photo on users ((split_part(photo_url, '#', 1)));
create index if not exists img_projects_cover on projects ((split_part(cover_url, '#', 1)));
create index if not exists img_moments_url on moments ((split_part(url, '#', 1))) where removed_at is null;
create index if not exists img_event_posts_photo on event_posts ((split_part(photo_url, '#', 1))) where status = 'visible';
create index if not exists img_artist_mixes_thumbnail on artist_mixes ((split_part(thumbnail_url, '#', 1)));
create index if not exists img_blog_tracks_thumbnail on blog_tracks ((split_part(thumbnail_url, '#', 1)));
create index if not exists img_blog_posts_cover on blog_posts ((split_part(cover_url, '#', 1))) where status <> 'hidden';
create index if not exists img_blog_posts_body on blog_posts using gin ((ff_body_pictures(body))) where status <> 'hidden';
create index if not exists img_ad_campaigns_logo on ad_campaigns ((split_part(logo_url, '#', 1)));
create index if not exists img_ad_campaigns_images on ad_campaigns using gin ((ff_link_bases(images)));
create index if not exists img_recaps_photos on recaps using gin ((ff_link_bases(photo_urls)));
create index if not exists img_news_items_image on news_items ((split_part(image_url, '#', 1))) where hidden_at is null;

-- The links whose resized copies the CDN should drop, and the covers whose copies it should make.
create table if not exists img_purges (
  link text primary key,
  at   timestamptz not null default now()
);
create table if not exists img_warms (
  link text primary key,
  at   timestamptz not null default now()
);

-- The links a row shows, as stored without the framing; none while the row is not shown.
-- `shown` names the rule of PICTURE_COLUMNS (services/remote-images.ts SHOWN).
create or replace function ff_img_row_links(r jsonb, scalars text, lists text, shown text, body boolean) returns text[] language plpgsql immutable as $$
declare
  out text[] := '{}';
  c text;
begin
  if r is null then return out; end if;
  if shown = 'hidden_at' and r->>'hidden_at' is not null then return out; end if;
  if shown = 'removed_at' and r->>'removed_at' is not null then return out; end if;
  if shown = 'visible' and coalesce(r->>'status' = 'visible', false) = false then return out; end if;
  if shown = 'not_hidden' and coalesce(r->>'status' <> 'hidden', false) = false then return out; end if;
  foreach c in array coalesce(string_to_array(nullif(scalars, ''), ','), '{}') loop
    if coalesce(r->>c, '') <> '' then out := out || split_part(r->>c, '#', 1); end if;
  end loop;
  foreach c in array coalesce(string_to_array(nullif(lists, ''), ','), '{}') loop
    if jsonb_typeof(r->c) = 'array' then
      out := out || array(select split_part(x, '#', 1) from jsonb_array_elements_text(r->c) as x);
    end if;
  end loop;
  if body then out := out || ff_body_pictures(r->'body'); end if;
  return out;
end $$;

-- After an update or a delete: what the row showed before and no longer shows waits to be purged.
-- Arguments: the link columns, the list columns, the rule of what is shown, 'body' for a post's body.
create or replace function ff_img_takedown() returns trigger language plpgsql as $$
declare
  with_body boolean := tg_argv[3] = 'body';
  gone text[] := ff_img_row_links(to_jsonb(old), tg_argv[0], tg_argv[1], tg_argv[2], with_body);
  kept text[] := '{}';
begin
  if tg_op = 'UPDATE' then kept := ff_img_row_links(to_jsonb(new), tg_argv[0], tg_argv[1], tg_argv[2], with_body); end if;
  insert into img_purges (link)
    select distinct l from unnest(gone) as l where l <> '' and l <> all(kept)
    on conflict (link) do update set at = excluded.at;
  return null;
end $$;

drop trigger if exists img_takedown on events;
create trigger img_takedown after update of cover_url, logo_url or delete on events
  for each row execute function ff_img_takedown('cover_url,logo_url', '', '', '');
drop trigger if exists img_takedown on artists;
create trigger img_takedown after update of image_url, cover_url, hidden_at or delete on artists
  for each row execute function ff_img_takedown('image_url,cover_url', '', 'hidden_at', '');
drop trigger if exists img_takedown on organizers;
create trigger img_takedown after update of logo_url, cover_url or delete on organizers
  for each row execute function ff_img_takedown('logo_url,cover_url', '', '', '');
drop trigger if exists img_takedown on users;
create trigger img_takedown after update of photo_url or delete on users
  for each row execute function ff_img_takedown('photo_url', '', '', '');
drop trigger if exists img_takedown on projects;
create trigger img_takedown after update of cover_url or delete on projects
  for each row execute function ff_img_takedown('cover_url', '', '', '');
drop trigger if exists img_takedown on moments;
create trigger img_takedown after update of url, removed_at or delete on moments
  for each row execute function ff_img_takedown('url', '', 'removed_at', '');
drop trigger if exists img_takedown on event_posts;
create trigger img_takedown after update of photo_url, status or delete on event_posts
  for each row execute function ff_img_takedown('photo_url', '', 'visible', '');
drop trigger if exists img_takedown on artist_mixes;
create trigger img_takedown after update of thumbnail_url or delete on artist_mixes
  for each row execute function ff_img_takedown('thumbnail_url', '', '', '');
drop trigger if exists img_takedown on blog_tracks;
create trigger img_takedown after update of thumbnail_url or delete on blog_tracks
  for each row execute function ff_img_takedown('thumbnail_url', '', '', '');
drop trigger if exists img_takedown on blog_posts;
create trigger img_takedown after update of cover_url, body, status or delete on blog_posts
  for each row execute function ff_img_takedown('cover_url', '', 'not_hidden', 'body');
drop trigger if exists img_takedown on ad_campaigns;
create trigger img_takedown after update of logo_url, images or delete on ad_campaigns
  for each row execute function ff_img_takedown('logo_url', 'images', '', '');
drop trigger if exists img_takedown on recaps;
create trigger img_takedown after update of photo_urls or delete on recaps
  for each row execute function ff_img_takedown('', 'photo_urls', '', '');
drop trigger if exists img_takedown on news_items;
create trigger img_takedown after update of image_url, hidden_at or delete on news_items
  for each row execute function ff_img_takedown('image_url', '', 'hidden_at', '');

-- An event whose cover a visitor can now see (services/seo/shared.ts PUBLIC_EVENT): it went
-- public, or its cover changed while public.
create or replace function ff_img_warm_event() returns trigger language plpgsql as $$
declare
  pic text := split_part(coalesce(new.cover_url, ''), '#', 1);
begin
  if pic = '' or not (new.status in ('live', 'cancelled') and not new.held_for_reports and new.published_at is not null) then return null; end if;
  if tg_op = 'UPDATE' and old.status in ('live', 'cancelled') and not old.held_for_reports and old.published_at is not null
     and split_part(coalesce(old.cover_url, ''), '#', 1) = pic then return null; end if;
  insert into img_warms (link) values (pic) on conflict (link) do update set at = excluded.at;
  return null;
end $$;

drop trigger if exists img_warm on events;
create trigger img_warm after insert or update of cover_url, status, published_at, held_for_reports on events
  for each row execute function ff_img_warm_event();

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
