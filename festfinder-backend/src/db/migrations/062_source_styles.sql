-- A club whose every night is electronic names its styles in its source's config (`styles`, read by
-- services/ingest/run.ts): a night it lists that names no style takes them and reaches the review
-- queue instead of falling under the fit floor. Ciné Saigon (techno and house) is the first; its
-- source was added from the starter list before the key existed, so the row is set here.
-- Idempotent: a source that already names its styles keeps them.
update ingest_sources
   set config = config || '{"styles": ["techno", "house"]}'::jsonb
 where url = 'https://cinesaigon.vn/'
   and not (config ? 'styles');
