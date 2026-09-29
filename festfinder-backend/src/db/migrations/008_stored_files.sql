-- Uploaded images kept in the database when no object storage is configured, so an upload
-- lands in Supabase whatever the deployment: a serverless instance's disk is gone with the
-- instance. Keys are content hashes (see routes/uploads.ts), so a row never changes.
create table stored_files (
  key        text primary key,
  mime       text not null,
  bytes      int not null,
  data       bytea not null,
  created_at timestamptz not null default now()
);

-- On Supabase, like every other table (see 007): no rows for the Data API's roles.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    alter table public.stored_files enable row level security;
    revoke all on public.stored_files from anon, authenticated;
  end if;
end $$;
