-- Supabase. Everywhere else (plain Postgres, PGlite) the roles and schemas below do not
-- exist, and this migration does nothing.
--
-- 1. Supabase's Data API (PostgREST) serves the public schema to anyone holding the
--    project's anon key, which is public by design. This API reaches Postgres directly and
--    never uses the Data API, so nothing in public is for the anon or authenticated roles:
--    their grants go, now and for tables made later, and row level security with no
--    policies denies them every row should a grant ever come back. The API's own role owns
--    the tables, so it is not affected.
--
-- 2. Uploads go to Supabase Storage over its S3 protocol, into a public bucket named
--    `uploads`: images only, up to 8 MB, the same limits the upload route enforces.
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
    revoke all on all functions in schema public from anon, authenticated;
    alter default privileges in schema public revoke all on tables from anon, authenticated;
    alter default privileges in schema public revoke all on sequences from anon, authenticated;
    alter default privileges in schema public revoke all on functions from anon, authenticated;
  end if;

  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('uploads', 'uploads', true, 8388608, array['image/png', 'image/jpeg', 'image/webp'])
    on conflict (id) do nothing;
  end if;
end $$;
