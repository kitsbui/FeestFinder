-- Linked images. From now on only an event's own media is uploaded (its cover and logo, and the
-- photos fans take at it); a person's photo, an artist's photo and cover, an organiser's logo and
-- cover, a project's cover and the moments on a profile are links to images kept elsewhere.
--
-- Each link is checked before it is saved (services/remote-images.ts: it opens, it is an image,
-- it is big enough, it will not expire) and again every week. This table remembers what each
-- check found, so the same link is not fetched twice in a day, and a link that fails three
-- times in a row is marked broken and its owner told. The pictures uploaded before stay served.
create table remote_images (
  url         text primary key,          -- the image address saved on the profile
  page_url    text,                       -- the page it was read from (og:image), when the link was a page
  mime        text not null check (mime in ('image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif')),
  width       int not null check (width > 0),
  height      int not null check (height > 0),
  bytes       bigint,
  status      text not null default 'ok' check (status in ('ok', 'broken')),
  fail_count  int not null default 0 check (fail_count >= 0),
  checked_at  timestamptz not null default now(),
  created_at  timestamptz not null default now()
);
create index remote_images_due on remote_images (checked_at) where status = 'ok';
create index remote_images_page on remote_images (page_url) where page_url is not null;

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
