import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';
import { emailUser } from './people.ts';
import { many, one } from '../src/db/index.ts';
import { embedFrom, parseAt, parseMixUrl } from '../src/lib/mixes.ts';

const code = (fn: () => unknown) => {
  try { fn(); return null; } catch (e) { return (e as { code?: string }).code ?? 'thrown'; }
};

const SC = 'https://soundcloud.com/may-dem/warehouse-set-2026';
const MC = 'https://www.mixcloud.com/maydem/live-at-the-observatory/';
const SP = 'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC?si=abc';

describe('mix links, pure', () => {
  it('knows each service’s links and drops tracking', () => {
    assert.deepEqual(parseMixUrl('https://m.soundcloud.com/may-dem/warehouse-set-2026?utm_source=x'), { provider: 'soundcloud', url: SC, kind: 'track' });
    assert.deepEqual(parseMixUrl('https://soundcloud.com/may-dem/sets/bangkok'), { provider: 'soundcloud', url: 'https://soundcloud.com/may-dem/sets/bangkok', kind: 'playlist' });
    assert.deepEqual(parseMixUrl('https://mixcloud.com/maydem/live-at-the-observatory'), { provider: 'mixcloud', url: MC, kind: 'show' });
    assert.deepEqual(parseMixUrl(SP), { provider: 'spotify', url: 'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC', kind: 'track' });
    assert.equal(parseMixUrl('https://open.spotify.com/intl-vi/album/4uLU6hMCjMI75M1A2tKUQC').kind, 'album');
    assert.equal(parseMixUrl('https://on.soundcloud.com/AbC123').kind, null, 'a short link is resolved by oEmbed');
    for (const bad of ['https://soundcloud.com/discover', 'https://soundcloud.com/may-dem/likes', 'https://www.mixcloud.com/maydem/', 'https://youtube.com/watch?v=1', 'javascript:alert(1)', 'https://open.spotify.com/track/short']) {
      assert.equal(code(() => parseMixUrl(bad)), 'invalid_mix_link', bad);
    }
  });

  it('rebuilds the player address, and refuses one on any other host', () => {
    const sc = embedFrom('soundcloud', { html: '<iframe src="https://w.soundcloud.com/player/?visual=true&amp;url=https%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F293&amp;show_artwork=true"></iframe>' });
    assert.equal(sc.kind, 'track');
    assert.match(sc.src, /^https:\/\/w\.soundcloud\.com\/player\/\?url=https%3A%2F%2Fapi\.soundcloud\.com%2Ftracks%2F293&/);
    assert.match(sc.src, /auto_play=\{autoplay\}/);
    assert.doesNotMatch(sc.src, /visual=true|show_artwork/);
    const mc = embedFrom('mixcloud', { html: '<iframe src="https://player-widget.mixcloud.com/widget/iframe/?hide_cover=1&feed=%2Fmaydem%2Flive%2F"></iframe>' });
    assert.equal(mc.src, 'https://player-widget.mixcloud.com/widget/iframe/?hide_cover=1&light=0&feed=%2Fmaydem%2Flive%2F&autoplay={autoplay}');
    // What Mixcloud's oEmbed actually answers: www.mixcloud.com's widget, the show's full address as the feed.
    const real = embedFrom('mixcloud', { html: '<iframe src="https://www.mixcloud.com/widget/iframe/?feed=https%3A%2F%2Fwww.mixcloud.com%2Fspartacus%2Fparty-time%2F&amp;hide_cover=1"></iframe>' });
    assert.equal(real.src, 'https://www.mixcloud.com/widget/iframe/?hide_cover=1&light=0&feed=https%3A%2F%2Fwww.mixcloud.com%2Fspartacus%2Fparty-time%2F&autoplay={autoplay}');
    assert.equal(code(() => embedFrom('mixcloud', { html: '<iframe src="https://www.mixcloud.com/widget/iframe/?feed=https%3A%2F%2Fevil.example%2Fa%2Fb%2F"></iframe>' })), 'invalid_mix_link');
    assert.equal(embedFrom('spotify', { iframe_url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M?utm_source=oembed' }).src,
      'https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M?theme=0');
    for (const html of ['<iframe src="https://evil.example/player/?url=https%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F1"></iframe>', '<iframe src="javascript:alert(1)"></iframe>',
      '<iframe src="https://w.soundcloud.com/player/?url=https%3A%2F%2Fevil.example%2Ftracks%2F1"></iframe>', '<script>alert(1)</script>']) {
      assert.equal(code(() => embedFrom('soundcloud', { html })), 'invalid_mix_link', html);
    }
    assert.equal(code(() => embedFrom('spotify', { iframe_url: 'https://open.spotify.com.evil.example/embed/track/4uLU6hMCjMI75M1A2tKUQC' })), 'invalid_mix_link');
  });

  it('reads a moment in a set', () => {
    assert.equal(parseAt('45:30'), 2730);
    assert.equal(parseAt('1:02:05'), 3725);
    assert.equal(parseAt('99'), null);
    assert.equal(parseAt('12:75'), null);
  });
});

describe('mixes on an artist page', () => {
  let env: TestEnv;
  let owner: string;
  let fan: string;
  let admin: string;
  let other: string;
  const verify = (email: string) => env.ctx.db.query(`update users set phone = coalesce(phone, '+8490' || floor(random() * 10000000)::text), phone_verified_at = now() where email = $1`, [email]);
  before(async () => {
    env = await setup();
    owner = await emailUser(env, 'mix.owner@example.com');
    await env.as(owner).post('/me/roles/artist', { stageName: 'Mây Đêm', roles: ['dj'], basedCity: 'bangkok', styles: ['hard-techno'] });
    fan = await env.attendee();
    other = await emailUser(env, 'mix.other@example.com');
    admin = await env.admin();
  });
  after(async () => { await env.close(); });

  it('the artist adds sets from three services; publishing needs a confirmed phone', async () => {
    assert.equal((await env.as(owner).post('/me/artist/mixes', { url: SC })).body.error.code, 'phone_unverified');
    await verify('mix.owner@example.com');
    const preview = await env.as(owner).post('/me/artist/mixes/preview', { url: SC });
    assert.equal(preview.status, 200, JSON.stringify(preview.body));
    assert.equal(preview.body.provider, 'soundcloud');
    const sc = await env.as(owner).post('/me/artist/mixes', { url: SC });
    assert.equal(sc.status, 201, JSON.stringify(sc.body));
    assert.equal(sc.body.url, SC);
    assert.match(sc.body.embedSrc, /auto_play=false/);
    assert.match(sc.body.playSrc, /auto_play=true/);
    assert.equal(sc.body.height, 166);
    assert.equal((await env.as(owner).post('/me/artist/mixes', { url: MC })).status, 201);
    const sp = await env.as(owner).post('/me/artist/mixes', { url: SP });
    assert.equal(sp.body.embedSrc, 'https://open.spotify.com/embed/track/4uLU6hMCjMI75M1A2tKUQC?theme=0');
    assert.equal((await env.as(owner).post('/me/artist/mixes', { url: SC + '?si=again' })).body.error.code, 'mix_exists');
    assert.equal((await env.as(owner).post('/me/artist/mixes', { url: 'https://soundcloud.com/may-dem/missing-set' })).body.error.code, 'mix_unavailable');
    assert.equal((await env.as(fan).post('/me/artist/mixes', { url: SC })).body.error.code, 'not_found', 'a fan has no artist profile');

    // Pinned first on the page, everyone sees them.
    await env.as(owner).patch(`/me/artist/mixes/${sp.body.id}`, { pinned: true });
    await env.as(owner).patch(`/me/artist/mixes/${sc.body.id}`, { pinned: true });
    const page = await env.as().get('/artists/may-dem');
    assert.equal(page.body.mixes.length, 3);
    assert.equal(page.body.mixes[0].id, sc.body.id, 'one pinned mix: the last one pinned');
    assert.equal(page.body.mixes.filter((m: any) => m.pinned).length, 1);
  });

  it('keeps to twelve mixes', async () => {
    for (let i = 0; i < 9; i++) assert.equal((await env.as(owner).post('/me/artist/mixes', { url: `https://soundcloud.com/may-dem/set-${i}` })).status, 201);
    const full = await env.as(owner).post('/me/artist/mixes', { url: 'https://soundcloud.com/may-dem/set-13' });
    assert.equal(full.body.error.code, 'mixes_full');
    const mine = await env.as(owner).get('/me/artist/mixes');
    assert.equal(mine.body.items.length, 12);
    for (const m of mine.body.items.slice(3)) assert.equal((await env.as(owner).delete(`/me/artist/mixes/${m.id}`)).status, 200);
    assert.equal((await env.as().get('/artists/may-dem')).body.mixes.length, 3);
  });

  it('likes count once per person, and only signed in', async () => {
    const id = (await env.as().get('/artists/may-dem')).body.mixes[0].id;
    assert.equal((await env.as().put(`/mixes/${id}/like`)).status, 401);
    assert.equal((await env.as(fan).put(`/mixes/${id}/like`)).body.likeCount, 1);
    assert.equal((await env.as(fan).put(`/mixes/${id}/like`)).body.likeCount, 1, 'idempotent');
    assert.equal((await env.as(other).put(`/mixes/${id}/like`)).body.likeCount, 2);
    assert.deepEqual((await env.as(fan).get('/artists/may-dem/mixes/me')).body.liked, [id]);
    assert.equal((await env.as(other).delete(`/mixes/${id}/like`)).body.likeCount, 1);
    assert.equal((await env.as().get('/artists/may-dem')).body.mixes[0].likeCount, 1);
  });

  it('comments: a confirmed phone, a moment in the set, replies tell their thread, the artist hears of new ones', async () => {
    const id = (await env.as().get('/artists/may-dem')).body.mixes[0].id;
    assert.equal((await env.as(other).post(`/mixes/${id}/comments`, { body: 'Track ID?' })).body.error.code, 'phone_unverified');
    const c = await env.as(fan).post(`/mixes/${id}/comments`, { body: 'Track ID ở đoạn này?', at: '45:30' });
    assert.equal(c.status, 201, JSON.stringify(c.body));
    assert.equal(c.body.comment.atS, 2730);
    assert.equal((await env.as(fan).post(`/mixes/${id}/comments`, { body: 'Link nè https://x.com' })).body.error.code, 'post_has_link');
    assert.equal((await env.as(fan).post(`/mixes/${id}/comments`, { body: 'Đoạn nào?', at: '7 phút' })).body.error.code, 'invalid_time');
    const reply = await env.as(owner).post(`/mixes/${id}/comments`, { body: 'ID sắp ra trên label nhé', parentId: c.body.comment.id });
    assert.equal(reply.status, 201);
    assert.equal((await env.as(fan).post(`/mixes/${id}/comments`, { body: 'Một tầng nữa', parentId: reply.body.comment.id })).body.error.code, 'reply_depth');

    const list = await env.as().get(`/mixes/${id}/comments`);
    assert.equal(list.body.items.length, 1);
    assert.equal(list.body.items[0].replies.length, 1);
    assert.equal(list.body.total, 2);
    const ownerId = (await one<{ id: string }>(env.ctx.db, `select id from users where email = 'mix.owner@example.com'`))!.id;
    const fanId = (await one<{ id: string }>(env.ctx.db, `select id from users where email = 'minh@example.com'`))!.id;
    const toArtist = await many<any>(env.ctx.db, `select kind, link from notifications where user_id = $1 and kind = 'mix_comment'`, [ownerId]);
    assert.equal(toArtist.length, 1);
    assert.equal(toArtist[0].link.url, `/a/may-dem?mix=${id}`);
    assert.equal((await many(env.ctx.db, `select 1 from notifications where user_id = $1 and kind = 'mix_reply'`, [fanId])).length, 1);

    // The artist takes a comment down on their own mix; others cannot.
    const spam = await env.as(fan).post(`/mixes/${id}/comments`, { body: 'Bình luận để gỡ' });
    assert.equal((await env.as(other).delete(`/mix-comments/${spam.body.comment.id}`)).status, 403);
    assert.equal((await env.as(owner).delete(`/mix-comments/${spam.body.comment.id}`)).status, 200);
    assert.equal((await env.as().get(`/mixes/${id}/comments`)).body.total, 2);
  });

  it('three reports hide a comment; a moderator removes or keeps it, audited', async () => {
    const id = (await env.as().get('/artists/may-dem')).body.mixes[0].id;
    const bad = await env.as(fan).post(`/mixes/${id}/comments`, { body: 'Một bình luận gây tranh cãi' });
    const cid = bad.body.comment.id;
    assert.equal((await env.as(fan).post(`/mix-comments/${cid}/reports`, { reason: 'spam' })).body.error.code, 'own_comment');
    for (const [i, t] of [owner, other, admin].entries()) {
      assert.equal((await env.as(t).post(`/mix-comments/${cid}/reports`, { reason: 'abuse' })).status, 201, `report ${i}`);
    }
    assert.equal((await env.as(other).post(`/mix-comments/${cid}/reports`, { reason: 'abuse' })).status, 200, 'once per person');
    const shown = await env.as().get(`/mixes/${id}/comments`);
    assert.equal(shown.body.items.some((c: any) => c.id === cid), false, 'hidden from everyone');
    assert.equal((await env.as(fan).get(`/mixes/${id}/comments`)).body.items.find((c: any) => c.id === cid).hidden, true, 'its author still sees it');

    assert.equal((await env.as(fan).get('/admin/mix-comments/reported')).status, 403);
    const queue = await env.as(admin).get('/admin/mix-comments/reported');
    const item = queue.body.items.find((c: any) => c.id === cid);
    assert.equal(item.reports, 3);
    assert.equal(item.mix.href, `/a/may-dem?mix=${id}`);
    assert.equal((await env.as(admin).post(`/admin/mix-comments/${cid}/keep`, {})).status, 200);
    assert.equal((await env.as().get(`/mixes/${id}/comments`)).body.items.some((c: any) => c.id === cid), true, 'kept: shown again');
    const audit = await one<{ action: string }>(env.ctx.db, `select action from audit_log where target_id = $1 order by seq desc limit 1`, [cid]);
    assert.equal(audit!.action, 'mix_comment.kept');
  });

  it('search engines and AI assistants read the mixes', async () => {
    const seo = await env.as().get('/seo/artists/may-dem');
    const artist = seo.body.jsonLd['@graph'].find((n: any) => n['@type'] === 'MusicGroup');
    assert.equal(artist.track.length, 3);
    assert.ok(artist.track.every((t: any) => /^https:\/\/(w\.soundcloud\.com|player-widget\.mixcloud\.com|www\.mixcloud\.com|open\.spotify\.com)\//.test(t.audio.embedUrl)));
    assert.ok(artist.track[0].interactionStatistic.some((s: any) => s.interactionType === 'https://schema.org/LikeAction'));
    const md = await env.app.inject({ method: 'GET', url: '/a/may-dem.md' });
    assert.match(md.body, /## Nghe/);
    assert.match(md.body, /soundcloud\.com\/may-dem\/warehouse-set-2026/);
  });

  it('the team adds a mix to a profile nobody runs, audited', async () => {
    const a = await one<{ id: string }>(env.ctx.db, `select id from artists where owner_user_id is null limit 1`);
    const r = await env.as(admin).post(`/admin/artists/${a!.id}/mixes`, { url: 'https://www.mixcloud.com/someone/radar-find/' });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    const audit = await one<{ action: string }>(env.ctx.db, `select action from audit_log where target_id = $1 order by seq desc limit 1`, [a!.id]);
    assert.equal(audit!.action, 'artist.mix_added');
    assert.equal((await env.as(fan).post(`/admin/artists/${a!.id}/mixes`, { url: MC })).status, 403);
  });
});
