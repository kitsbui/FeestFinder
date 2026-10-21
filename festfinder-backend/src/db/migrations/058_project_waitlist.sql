-- Projects ask for a waitlist instead of an amount to raise (owner, 2026-10-20): the owner sets how
-- many people they want waiting for the night (`waitlist_target`), signed-in people join, and the
-- page counts the real ones (one row per account). `raise_amount` is no longer read or written; it
-- stays so nothing an owner typed is lost. `waitlist_reached_at` tells the owner once, the first
-- time the target is met. The budget's currency is now the owner's choice (VND or USD).

alter table projects add column waitlist_target int check (waitlist_target > 0 and waitlist_target <= 1000000);
alter table projects add column waitlist_reached_at timestamptz;

create table project_waitlist (
  project_id  uuid not null references projects on delete cascade,
  user_id     uuid not null references users on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (project_id, user_id)
);
create index project_waitlist_user on project_waitlist (user_id, created_at desc);

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
