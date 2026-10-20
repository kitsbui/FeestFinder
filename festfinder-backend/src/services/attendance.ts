/**
 * Who went to a night, now that FeestFinder sells no tickets and scans no doors (owner,
 * 2026-10-20; decision D13 of docs/HANDOFF_2026-10-19_growth-plan.md): someone checked in on
 * the site (`presence`, live mode), or said they were going (`going`) and the night is over.
 * Badges, the passport, Wrapped and what friends see all read this one definition.
 */

/**
 * The events a user attended, as SQL: one `event_id` column. `user` and `now` are the
 * positional parameters (`$1`, `$2`…) the caller binds to the user's id and the clock.
 */
export function attendedEvents(user: string, now: string): string {
  return `(select p.event_id from presence p where p.user_id = ${user}
           union select g.event_id from going g join events ge on ge.id = g.event_id where g.user_id = ${user} and ge.ends_at < ${now})`;
}

/** Whether `userCol` attended any of the events in `eventsParam` (a uuid[] parameter), as a SQL condition. */
export function attendedAny(userCol: string, eventsParam: string, now: string): string {
  return `(exists (select 1 from presence p where p.user_id = ${userCol} and p.event_id = any(${eventsParam}))
           or exists (select 1 from going g join events ge on ge.id = g.event_id where g.user_id = ${userCol} and g.event_id = any(${eventsParam}) and ge.ends_at < ${now}))`;
}
