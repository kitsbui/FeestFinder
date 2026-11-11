-- The dress code an organiser asks for (persona review, 2026-11-11): one line of text, 120 characters
-- at most, shown on the event page beside the age. Empty (null) means none is asked. It is not one of
-- the facts review needs, so it is not in missingForSubmit.
alter table events add column if not exists dress_code text constraint events_dress_code_len check (char_length(dress_code) <= 120);
