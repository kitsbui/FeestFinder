-- Which languages of an event's description a machine wrote (design v2 phase 15): Feest Radar's
-- finds arrive in English and are translated into Vietnamese by the translate job; the page says so
-- and keeps the original. An organiser's own text in a language is never overwritten.
alter table events add column if not exists auto_translated text[] not null default '{}';
