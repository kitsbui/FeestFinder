-- Which environment this database serves. Production and staging are separate Supabase
-- projects; a deployment whose environment differs from the label refuses to start (see
-- src/db/environment.ts), so a laptop or a preview never writes real accounts
-- and production never serves test data. One row, set once. `if not exists`, because the
-- label may be put in by hand ahead of the first deployment that runs this.
create table if not exists database_environment (
  id     int primary key default 1 check (id = 1),
  name   text not null check (name in ('production', 'staging')),
  set_at timestamptz not null default now()
);

-- On Supabase, like every other table (see 007): no rows for the Data API's roles.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    alter table public.database_environment enable row level security;
    revoke all on public.database_environment from anon, authenticated;
  end if;
end $$;
