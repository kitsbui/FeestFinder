-- Row level security on the tables 027–029 added (boost_requests, badge_awards, moments,
-- moment_reports), as every earlier migration does: on Supabase the API never reaches public
-- tables through the anon or authenticated roles, should a grant ever come back.

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
