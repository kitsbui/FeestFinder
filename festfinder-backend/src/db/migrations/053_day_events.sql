-- A daytime party (coffee rave, sunset session, day party) is a kind of event: 'day'.
-- The checks were written inline in 016 and 034; their names are read, never guessed.
do $$
declare c record;
begin
  for c in
    select t.relname as tbl, k.conname as name
    from pg_constraint k join pg_class t on t.oid = k.conrelid join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = current_schema() and t.relname in ('events', 'projects') and k.contype = 'c'
      and pg_get_constraintdef(k.oid) like '%event_type%'
  loop
    execute format('alter table %I drop constraint %I', c.tbl, c.name);
  end loop;
end $$;

alter table events add constraint events_event_type_check
  check (event_type in ('club', 'festival', 'concert', 'rave', 'party', 'show', 'day', 'other'));
alter table projects add constraint projects_event_type_check
  check (event_type in ('club', 'festival', 'concert', 'rave', 'party', 'show', 'day', 'other'));
