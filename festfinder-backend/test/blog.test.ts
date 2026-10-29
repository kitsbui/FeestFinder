import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';
import { emailUser } from './people.ts';

describe('blog: posts about styles, news, playlists, DJ skills and venues, reviewed before they are public', () => {
  let env: TestEnv;
  let admin: string;
  let writer: string;
  let other: string;
  let id: string;
  let slug: string;
  before(async () => {
    env = await setup();
    admin = await env.admin();
    writer = await emailUser(env, 'writer@example.com');
    other = await emailUser(env, 'reader@example.com');
  });
  after(async () => { await env.close(); });

  const BODY = 'Melodic techno grew out of the long breakdowns of the 2010s: a slow build, a melody that carries the room, then a drop that feels earned rather than loud. '.repeat(3);

  it('starts as a draft anyone signed in can write, and says what is missing before review', async () => {
    assert.equal((await env.as().post('/me/posts', { title: { vi: 'Bất kỳ', en: 'Anything' }, category: 'news' })).status, 401);
    const made = await env.as(writer).post('/me/posts', { title: { vi: 'Melodic techno ở Sài Gòn', en: 'Melodic techno in Saigon' }, category: 'styles', styles: ['melodic-techno'], city: 'ho-chi-minh' });
    assert.equal(made.status, 201, JSON.stringify(made.body));
    ({ id, slug } = made.body);
    assert.deepEqual([made.body.status, made.body.mine, made.body.missing.length, made.body.category.key], ['draft', true, 1, 'styles']);
    assert.equal((await env.as(writer).post(`/me/posts/${id}/submit`)).body.error.code, 'incomplete');
    // Nobody else sees a draft, not even by its id.
    assert.equal((await env.as(other).get(`/posts/${slug}`)).status, 404);
    assert.equal((await env.as(other).get(`/me/posts/${id}`)).status, 404);
    assert.equal((await env.as(other).patch(`/me/posts/${id}`, { title: { vi: 'Của tôi', en: 'Mine now' } })).status, 404);
  });

  it('takes tracks from a link or a pasted embed code, and never keeps the HTML', async () => {
    const link = await env.as(writer).post(`/me/posts/${id}/tracks`, { source: 'https://soundcloud.com/some-dj/melodic-night?si=abc' });
    assert.equal(link.status, 201, JSON.stringify(link.body));
    const t1 = link.body.tracks[0];
    assert.equal(t1.provider, 'soundcloud');
    assert.match(t1.playSrc, /^https:\/\/w\.soundcloud\.com\/player\/\?url=https%3A%2F%2Fapi\.soundcloud\.com%2Ftracks%2F\d+/);
    // A YouTube link plays through YouTube's privacy-enhanced player.
    const yt = await env.as(writer).post(`/me/posts/${id}/tracks`, { source: 'https://youtu.be/IPYTxAHeR_o?si=abc', year: 2013, note: { vi: 'Drop tối giản', en: 'A minimal drop' } });
    assert.equal(yt.status, 201, JSON.stringify(yt.body));
    const ty = yt.body.tracks.find((t: { provider: string }) => t.provider === 'youtube');
    assert.deepEqual([ty.url, ty.playSrc, ty.height, ty.year, ty.note.en], ['https://www.youtube.com/watch?v=IPYTxAHeR_o', 'https://www.youtube-nocookie.com/embed/IPYTxAHeR_o?rel=0&autoplay=1', null, 2013, 'A minimal drop']);
    assert.equal((await env.as(writer).post(`/me/posts/${id}/tracks`, { source: 'https://www.youtube.com/watch?v=missingvid1' })).body.error.code, 'track_unavailable');
    await env.as(writer).delete(`/me/posts/${id}/tracks/${ty.id}`);
    const code = '<iframe style="border-radius:12px" src="https://open.spotify.com/embed/playlist/37i9dQZF1DX6J5NfMJS675?utm_source=generator&theme=0" width="100%" height="352" allow="autoplay" onload="alert(1)"></iframe>';
    const embed = await env.as(writer).post(`/me/posts/${id}/tracks`, { source: code, title: 'Melodic sunrise' });
    assert.equal(embed.status, 201, JSON.stringify(embed.body));
    const t2 = embed.body.tracks[1];
    assert.deepEqual([t2.provider, t2.kind, t2.title, t2.url, t2.playSrc], ['spotify', 'playlist', 'Melodic sunrise', 'https://open.spotify.com/playlist/37i9dQZF1DX6J5NfMJS675', 'https://open.spotify.com/embed/playlist/37i9dQZF1DX6J5NfMJS675?theme=0']);
    const kept = await env.ctx.db.query<{ embed_src: string }>('select embed_src from blog_tracks where post_id = $1', [id]);
    assert.ok(kept.rows.every((r) => !/iframe|onload|utm_source/.test(r.embed_src)));
    // A player from anywhere else is refused, and the same track twice once.
    assert.equal((await env.as(writer).post(`/me/posts/${id}/tracks`, { source: '<iframe src="https://evil.example.com/embed/x"></iframe>' })).body.error.code, 'invalid_track');
    assert.equal((await env.as(writer).post(`/me/posts/${id}/tracks`, { source: code })).body.error.code, 'track_exists');
    const removed = await env.as(writer).delete(`/me/posts/${id}/tracks/${t1.id}`);
    assert.equal(removed.body.tracks.length, 1);
  });

  it('goes to the team, who send it back with a reason, then approve it; the list counts it under its category', async () => {
    await env.as(writer).patch(`/me/posts/${id}`, { body: { vi: '', en: BODY }, excerpt: { vi: '', en: 'Why melodic techno fills Saigon rooftops.' } });
    const sent = await env.as(writer).post(`/me/posts/${id}/submit`);
    assert.equal(sent.body.status, 'in_review', JSON.stringify(sent.body));
    const told = await env.ctx.db.query<{ n: number }>(`select count(*)::int as n from notifications where kind = 'blog_review'`);
    assert.ok(told.rows[0].n >= 1);
    assert.equal((await env.as(writer).get('/admin/posts')).status, 403);
    assert.deepEqual((await env.as(admin).get('/admin/posts')).body.items.map((p: { slug: string }) => p.slug), [slug]);
    assert.equal((await env.as(admin).post(`/admin/posts/${id}/decision`, { action: 'reject' })).body.error.code, 'note_required');
    await env.as(admin).post(`/admin/posts/${id}/decision`, { action: 'reject', note: 'Name a club or two' });
    assert.deepEqual((await env.as(writer).get(`/me/posts/${id}`)).body.decisionNote, 'Name a club or two');
    await env.as(writer).patch(`/me/posts/${id}`, { body: { vi: '', en: BODY + ' Try The Observatory and Lush on a Saturday.' } });
    await env.as(writer).post(`/me/posts/${id}/submit`);
    assert.equal((await env.as(admin).post(`/admin/posts/${id}/decision`, { action: 'approve' })).body.status, 'published');

    const list = (await env.as().get('/posts')).body;
    assert.deepEqual([list.total, list.items[0].slug, list.categories.styles, list.categories.news], [1, slug, 1, 0]);
    // The list gives what a card draws, never the post's body, facts, questions or sources (/blog's HTML carries it).
    assert.deepEqual(Object.keys(list.items[0]).sort(), ['author', 'category', 'coverUrl', 'excerpt', 'id', 'lang', 'minutes', 'publishedAt', 'slug', 'title', 'trackCount']);
    assert.equal((await env.as().get('/posts?category=news')).body.total, 0);
    const page = (await env.as(other).get(`/posts/${slug}`)).body;
    assert.equal(page.mine, undefined);
    assert.equal(page.tracks.length, 1);
    assert.match(page.body.en, /Observatory/);
  });

  it('speaks to search engines and AI: one address per post, BlogPosting data, the sitemap and llms.txt', async () => {
    // Written in English only: one address, the English one, whatever the frame.
    const seo = (await env.as().get(`/seo/blog/${slug}`)).body;
    assert.equal(seo.canonical.endsWith(`/blog/${slug}?lang=en`), true);
    const post = seo.jsonLd['@graph'].find((n: { '@type': string }) => n['@type'] === 'BlogPosting');
    assert.deepEqual([post.headline, post.inLanguage, post.articleSection], ['Melodic techno in Saigon', 'en', 'Dòng nhạc']);
    assert.match((await env.app.inject({ method: 'GET', url: `/blog/${slug}.md` })).body, /^# Melodic techno in Saigon/);
    assert.match((await env.app.inject({ method: 'GET', url: '/sitemap.xml' })).body, new RegExp(`/blog/${slug}<`));
    assert.match((await env.app.inject({ method: 'GET', url: '/llms.txt' })).body, /## Blog/);
  });

  it('takes an author’s change to a public post back to review; the team’s own posts are public when sent', async () => {
    const changed = await env.as(writer).patch(`/me/posts/${id}`, { title: { vi: 'Melodic techno ở Sài Gòn, 2026', en: 'Melodic techno in Saigon, 2026' } });
    assert.equal(changed.body.status, 'in_review');
    assert.equal((await env.as().get(`/posts/${slug}`)).status, 404);
    await env.as(admin).post(`/admin/posts/${id}/decision`, { action: 'approve' });
    const team = await env.as(admin).post('/me/posts', { title: { vi: 'Beatmatch bằng tai', en: 'How to beatmatch by ear' }, category: 'dj', body: { vi: BODY, en: BODY } });
    const live = await env.as(admin).post(`/me/posts/${team.body.id}/submit`);
    assert.equal(live.body.status, 'published');
    // The team can take a post down and bring it back.
    assert.equal((await env.as(admin).post(`/admin/posts/${id}/decision`, { action: 'hide' })).body.status, 'hidden');
    assert.equal((await env.as().get(`/posts/${slug}`)).status, 404);
    assert.equal((await env.as(admin).post(`/admin/posts/${id}/decision`, { action: 'restore' })).body.status, 'published');
  });
});
