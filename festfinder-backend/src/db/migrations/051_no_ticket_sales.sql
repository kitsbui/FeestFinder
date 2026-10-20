-- FeestFinder sells no tickets and runs no door (owner, 2026-10-20): every ticket button goes
-- through /go to the seller. The commerce tables leave the public schema for archive_ticketing,
-- not the bin: whatever they hold stays readable, and `alter table archive_ticketing.<t> set
-- schema public` brings one back. Nothing in the API reads them any more.

create schema if not exists archive_ticketing;

do $$
declare
  t text;
begin
  foreach t in array array['scans', 'ticket_transfers', 'resale_orders', 'ticket_listings', 'resale_watchers',
                           'tickets', 'guest_list', 'orders', 'payout_transfers', 'promo_codes', 'tier_watchers', 'ticket_tiers', 'event_staff'] loop
    if exists (select 1 from pg_tables where schemaname = 'public' and tablename = t) then
      execute format('alter table public.%I set schema archive_ticketing', t);
    end if;
  end loop;
end $$;

-- Gate-crew sessions belonged to the door scanner: they end.
delete from sessions where kind = 'staff';

-- Announcements reach who saved the night, who is going, and who went to the organiser's nights before.
update announcements set audience = 'going' where audience in ('holders', 'vip');
alter table announcements drop constraint if exists announcements_audience_check;
alter table announcements add constraint announcements_audience_check check (audience in ('saved', 'going', 'past'));

-- Badges that only a scanned ticket or a sold-out tier could earn.
delete from badge_awards where code in ('doors', 'sold_out', 'sold_out_5');

-- Organiser notification topics that belonged to the sales: payouts and the gate crew.
delete from organizer_notification_prefs where topic in ('payouts', 'crew');

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
    revoke all on schema archive_ticketing from anon, authenticated;
    revoke all on all tables in schema archive_ticketing from anon, authenticated;
  end if;
end $$;
