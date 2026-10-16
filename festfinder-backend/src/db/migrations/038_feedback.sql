-- Feedback and bug reports sent from any page of the site (the widget in the corner), so testers
-- and visitors do not leave for a form elsewhere. Each report gets a ticket (FF-FB-YYYYMMDD-XXXX),
-- carries what the page knew when it was sent (the path without its query, the browser, the
-- screen, the last errors), and waits in the Console for the team. A guest leaves an email to be
-- answered; a signed-in person is known by their account.
--
-- Screenshots are kept here, readable by the team only (never under the public /files), and are
-- deleted after 90 days: a screen can show a ticket's QR code or someone's email.
create table feedback (
  id             uuid primary key default gen_random_uuid(),
  ticket_id      text not null unique check (ticket_id ~ '^FF-FB-\d{8}-[A-Z2-9]{4}$'),
  type           text not null check (type in ('bug', 'ui_ux', 'feature', 'support')),
  severity       text check (severity in ('low', 'medium', 'high', 'critical')),
  title          text not null check (length(title) between 1 and 120),
  description    text not null check (length(description) between 1 and 4000),
  steps          text check (length(steps) <= 2000),
  csat           int check (csat between 1 and 5),
  user_id        uuid references users on delete set null,
  guest_name     text,
  guest_email    text,
  telemetry      jsonb not null default '{}',
  status         text not null default 'new' check (status in ('new', 'triaged', 'in_progress', 'done', 'wont_fix')),
  github_issue_url text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- Someone to answer: an account, or an email.
  check (user_id is not null or guest_email is not null),
  -- Only bugs have a severity.
  check (severity is null or type = 'bug')
);
create index feedback_open on feedback (created_at desc) where status in ('new', 'triaged', 'in_progress');
create index feedback_user on feedback (user_id, created_at desc) where user_id is not null;

create table feedback_attachments (
  feedback_id uuid not null references feedback on delete cascade,
  n           int not null check (n between 1 and 2),
  mime        text not null check (mime in ('image/png', 'image/jpeg', 'image/webp')),
  width       int not null,
  height      int not null,
  bytes       int not null check (bytes > 0 and bytes <= 2097152),
  data        bytea not null,
  created_at  timestamptz not null default now(),
  primary key (feedback_id, n)
);
create index feedback_attachments_age on feedback_attachments (created_at);

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
