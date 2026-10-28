-- Charts from YouTube Music (owner, 2026-10-28: "pick the YouTube Music playlists and styles for
-- me"): a third provider, `youtube` (services/charts.ts, YouTube Data API v3 with YOUTUBE_API_KEY),
-- and a playlist for sixteen styles, each checked through YouTube's oEmbed and on its public page
-- on 2026-10-28. YouTube Music has no genre chart of its own in its API, so these are the lists the
-- style's labels keep (Drumcode, Toolroom, Spinnin' Records, Anjunabeats, Black Hole, UKF,
-- Scantraxx, Monstercat…): most put the newest release first, UKF's DnB Top 50 and Spinnin's
-- YouTube Top 50 are ranked. YouTube Music's own editorial lists (RDCLAK5uy_…) are added switched
-- off: oEmbed does not answer for them, so the team switches one on in /console/news once a read
-- with the key works. Nothing is read without the key. The tests and the preview delete these rows
-- after migrating (test/helpers.ts, test/fixtures/reset.ts): they read no chart.

alter table chart_sources drop constraint if exists chart_sources_provider_check;
alter table chart_sources add constraint chart_sources_provider_check check (provider in ('beatport', 'spotify', 'youtube'));

insert into chart_sources (name, style, external_id, url, enabled, provider, interval_minutes)
select name, style, external_id, url, enabled, 'youtube', 1440 from (values
  ('Drumcode Releases (Drumcode)', 'techno', 'PLhkZrfli9PCoSk-8w4ANUS3WgNG2gQ4aB', 'https://music.youtube.com/playlist?list=PLhkZrfli9PCoSk-8w4ANUS3WgNG2gQ4aB', true),
  ('Deep & Melodic House (Monstercat Silk)', 'melodic-techno', 'PLpvWJ6XFE9_-ZXM3-vsE2trddSKTIdrdF', 'https://music.youtube.com/playlist?list=PLpvWJ6XFE9_-ZXM3-vsE2trddSKTIdrdF', true),
  ('Toolroom Trax (Toolroom Records)', 'house', 'PLGdqhGdToks1CslquLlNQ4mofBwqnyrjW', 'https://music.youtube.com/playlist?list=PLGdqhGdToks1CslquLlNQ4mofBwqnyrjW', true),
  ('Tech House 2026 (Toolroom Records)', 'tech-house', 'PLGdqhGdToks0NrIk7EVwAgpAe7XiB6Vhh', 'https://music.youtube.com/playlist?list=PLGdqhGdToks0NrIk7EVwAgpAe7XiB6Vhh', true),
  ('Spinnin'' Deep (Spinnin'' Records)', 'deep-house', 'PLx_tr69QV8CAkYNLqKyVFmt8d1ocCRA50', 'https://music.youtube.com/playlist?list=PLx_tr69QV8CAkYNLqKyVFmt8d1ocCRA50', true),
  ('Afro House (Spinnin'' Records)', 'afro-house', 'PLx_tr69QV8CBdjQOX0q2G8A3tveUiM4ys', 'https://music.youtube.com/playlist?list=PLx_tr69QV8CBdjQOX0q2G8A3tveUiM4ys', true),
  ('Trance & Progressive 2026 (Anjunabeats)', 'progressive-house', 'PLDKkQBH8I6JC29YwyQk_qODOA11tF5J6Q', 'https://music.youtube.com/playlist?list=PLDKkQBH8I6JC29YwyQk_qODOA11tF5J6Q', true),
  ('Vocal Trance Hits 2026 (Black Hole Recordings)', 'trance', 'PLkfkqDodBEm0h-T7iYEROFmAjO1_9ZR5M', 'https://music.youtube.com/playlist?list=PLkfkqDodBEm0h-T7iYEROFmAjO1_9ZR5M', true),
  ('Progressive Psy Trance Picks (Spin Twist Records)', 'psytrance', 'PL9xs6wwsQPr5d7Dw50J0rCrRWmssLbpUA', 'https://music.youtube.com/playlist?list=PL9xs6wwsQPr5d7Dw50J0rCrRWmssLbpUA', true),
  ('Hardstyle Hits 2026 (Scantraxx)', 'hardstyle', 'PLuoriEIb_dmng5NxUDb6jpeZkx8Fag_ju', 'https://music.youtube.com/playlist?list=PLuoriEIb_dmng5NxUDb6jpeZkx8Fag_ju', true),
  ('DnB Top 50 (UKF Drum & Bass)', 'drum-and-bass', 'PLAEfXHuNOsEaRu0IaaAuBOR-CNAPpE1jW', 'https://music.youtube.com/playlist?list=PLAEfXHuNOsEaRu0IaaAuBOR-CNAPpE1jW', true),
  ('UKF Dubstep 2026 (UKF Dubstep)', 'dubstep', 'PL_GIjsCumTTnKkmnYeFUbmZwxDnoYWkig', 'https://music.youtube.com/playlist?list=PL_GIjsCumTTnKkmnYeFUbmZwxDnoYWkig', true),
  ('Bass House (Spinnin'' Records)', 'bass-house', 'PLx_tr69QV8CDB-nn-pc5YZbDsdgjIQSII', 'https://music.youtube.com/playlist?list=PLx_tr69QV8CDB-nn-pc5YZbDsdgjIQSII', true),
  ('Big Room (Spinnin'' Records)', 'mainstage', 'PLx_tr69QV8CDEZplKQ3kJGeLQX9CUtKPt', 'https://music.youtube.com/playlist?list=PLx_tr69QV8CDEZplKQ3kJGeLQX9CUtKPt', true),
  ('YouTube Top 50 (Spinnin'' Records)', 'edm', 'PLx_tr69QV8CA7-2-EBwiXSWARRKaVQB2T', 'https://music.youtube.com/playlist?list=PLx_tr69QV8CA7-2-EBwiXSWARRKaVQB2T', true),
  ('Bassline & UK Garage (UKF)', 'uk-garage', 'PLnk-kvXqq0FzoglY3hzeVXsVeWV3tYHeI', 'https://music.youtube.com/playlist?list=PLnk-kvXqq0FzoglY3hzeVXsVeWV3tYHeI', true),
  ('Techno Room (YouTube Music)', 'techno', 'RDCLAK5uy_khFJzdpmtk0_MaUuWNgqYbNamuGV623kk', 'https://music.youtube.com/playlist?list=RDCLAK5uy_khFJzdpmtk0_MaUuWNgqYbNamuGV623kk', false),
  ('Tech House 2026 (YouTube Music)', 'tech-house', 'RDCLAK5uy_lGiQTUU4XxGV7l9L5YJ3sV0zomDirmZTM', 'https://music.youtube.com/playlist?list=RDCLAK5uy_lGiQTUU4XxGV7l9L5YJ3sV0zomDirmZTM', false),
  ('Deep House Pure (YouTube Music)', 'deep-house', 'RDCLAK5uy_mVvnZOzJPD1C1SqIu44Hwl9AT00fafKNs', 'https://music.youtube.com/playlist?list=RDCLAK5uy_mVvnZOzJPD1C1SqIu44Hwl9AT00fafKNs', false),
  ('Trance Deep Dive (YouTube Music)', 'trance', 'RDCLAK5uy_ly_AXtK47X3yXEDDeUjaIZ-uPyrTQ9vRE', 'https://music.youtube.com/playlist?list=RDCLAK5uy_ly_AXtK47X3yXEDDeUjaIZ-uPyrTQ9vRE', false),
  ('Drum & Bass Anthems (YouTube Music)', 'drum-and-bass', 'RDCLAK5uy_n24VQSq-J5UBG0hJUFTThmNJZEdWApSUw', 'https://music.youtube.com/playlist?list=RDCLAK5uy_n24VQSq-J5UBG0hJUFTThmNJZEdWApSUw', false),
  ('Chroma: Today''s Dance Hits (YouTube Music)', 'edm', 'RDCLAK5uy_kLWIr9gv1XLlPbaDS965-Db4TrBoUTxQ8', 'https://music.youtube.com/playlist?list=RDCLAK5uy_kLWIr9gv1XLlPbaDS965-Db4TrBoUTxQ8', false)
) as v(name, style, external_id, url, enabled)
on conflict (provider, external_id) do nothing;
