-- The suggested publications of the news feed (services/news-starter.ts), switched on in every
-- database once (owner, 2026-10-23: "do all of it"), as the Console's "Thêm nguồn gợi ý" would:
-- the press's headlines reach /blog?category=news without anyone signing in first. A publication
-- the team already added is left as it is; one the team later switches off or deletes stays so,
-- since a migration runs once. The tests and the local preview read no feed: their setup removes
-- these rows (test/helpers.ts, test/fixtures/reset.ts), and a test checks this list matches the
-- service's.

insert into news_sources (name, site_url, feed_url, lang, region, interval_minutes)
values
  ('Mixmag Asia', 'https://mixmag.asia/', 'https://mixmag.asia/rss.xml', 'en', 'asia', 60),
  ('Mixmag', 'https://mixmag.net/', 'https://mixmag.net/rss.xml', 'en', 'global', 60),
  ('DJ Mag', 'https://djmag.com/', 'https://djmag.com/rss.xml', 'en', 'global', 60),
  ('EDM Identity', 'https://edmidentity.com/', 'https://edmidentity.com/feed/', 'en', 'global', 60),
  ('EDMTunes', 'https://www.edmtunes.com/', 'https://www.edmtunes.com/feed/', 'en', 'global', 60),
  ('Magnetic Magazine', 'https://magneticmag.com/', 'https://magneticmag.com/feed/', 'en', 'global', 60),
  ('Billboard Dance', 'https://www.billboard.com/t/dance/', 'https://www.billboard.com/t/dance/feed/', 'en', 'global', 60),
  ('Dancing Astronaut', 'https://dancingastronaut.com/', 'https://dancingastronaut.com/feed/', 'en', 'global', 60),
  ('EDM Maniac', 'https://edmmaniac.com/', 'https://edmmaniac.com/feed/', 'en', 'global', 60),
  ('Electronic Groove', 'https://electronicgroove.com/', 'https://electronicgroove.com/feed/', 'en', 'global', 60),
  ('UKF', 'https://ukf.com/', 'https://ukf.com/feed/', 'en', 'global', 60),
  ('Trance Attack', 'https://tranceattack.net/', 'https://tranceattack.net/feed/', 'en', 'global', 60),
  ('Data Transmission', 'https://datatransmission.co/', 'https://datatransmission.co/feed/', 'en', 'global', 60),
  ('Attack Magazine', 'https://www.attackmagazine.com/', 'https://www.attackmagazine.com/feed/', 'en', 'global', 60),
  ('DJ TechTools', 'https://djtechtools.com/', 'https://djtechtools.com/feed/', 'en', 'global', 60),
  ('Saigoneer', 'https://saigoneer.com/', 'https://saigoneer.com/?format=feed&type=rss', 'en', 'vietnam', 60)
on conflict (feed_url) do nothing;
