-- The team hides an artist profile the site should not show (a test, a joke, a duplicate). Nothing
-- is deleted: the profile leaves the directory, search, the sitemap and the lineups' links, its page
-- answers 404, and the team can show it again from the Console.
alter table artists add column if not exists hidden_at timestamptz;
