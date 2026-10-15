-- A copy of every table, taken just before 031_edm_only.sql empties the catalogue. The name
-- sorts before 031, so a database that has not run 031 yet (production) runs this first, in
-- the same deployment. Where 031 already ran (staging, laptops) the copy is taken afterwards
-- and holds nothing worth restoring.
--
-- The copy lives in its own schema, which the Supabase API does not expose. Restoring a table:
--   insert into public.events select * from backup_before_031.events;
-- Once nothing more is needed from it:
--   drop schema backup_before_031 cascade;

create schema if not exists backup_before_031;

do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' and tablename <> 'schema_migrations' order by tablename loop
    execute format('create table if not exists backup_before_031.%I as table public.%I', t.tablename, t.tablename);
  end loop;
end $$;
