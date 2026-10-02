-- Search engines and AI assistants now read each event page, not the city landing pages.

-- The landing pages' hand-written questions go with them.
drop table if exists seo_faqs;

-- When an event page's public content last changed. Counters (hype, saves) do not count:
-- this is the date the sitemap gives and what tells IndexNow a page is worth fetching again.
create or replace function events_touch() returns trigger language plpgsql as $$
begin
  if (new.title, new.description, new.genre, new.city, new.venue_name, new.address, new.area, new.lat, new.lng,
      new.starts_at, new.ends_at, new.start_time, new.end_time, new.entry_mode, new.price_from, new.age, new.capacity,
      new.lineup, new.cover_url, new.ticket_url, new.event_url, new.status, new.sold_out, new.organizer_id)
     is distinct from
     (old.title, old.description, old.genre, old.city, old.venue_name, old.address, old.area, old.lat, old.lng,
      old.starts_at, old.ends_at, old.start_time, old.end_time, old.entry_mode, old.price_from, old.age, old.capacity,
      old.lineup, old.cover_url, old.ticket_url, old.event_url, old.status, old.sold_out, old.organizer_id) then
    new.updated_at := now();
  end if;
  return new;
end $$;
create trigger events_touch before update on events for each row execute function events_touch();

-- The last time each page was announced to IndexNow, so a page goes out again only once it changes.
create table indexnow_sent (
  url     text primary key,
  sent_at timestamptz not null
);

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
