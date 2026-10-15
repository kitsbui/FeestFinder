import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';
import { emailUser, phoneUser } from './people.ts';
import { many, one } from '../src/db/index.ts';
import { buildEventSeo, pingIndexNow, queueIndexNow } from '../src/services/seo.ts';

describe('community event pages', () => {
  let env: TestEnv;
  let minh: string;
  let organizer: string;
  let admin: string;
  before(async () => {
    env = await setup();
    [minh, organizer, admin] = await Promise.all([env.attendee(), env.organizer(), env.admin()]);
  });
  after(async () => { await env.close(); });

  it('puts the hype meter, discussion, FAQ, resale and ambassadors on the event', async () => {
    const r = await env.as(minh).get('/events/ravo');
    assert.equal(r.body.phase, 'before');
    assert.equal(r.body.hype.count, 2140);
    assert.deepEqual(r.body.hype.goals.map((g: any) => [g.threshold, g.reached]), [[2000, true], [2500, false], [3000, false]]);
    assert.equal(r.body.hype.next.threshold, 2500);
    assert.equal(r.body.hype.next.left, 360);
    assert.deepEqual(r.body.discussion.kinds, ['qa', 'talk', 'crew']);
    assert.equal(r.body.discussion.qa, 3);
    assert.equal(r.body.faq.length, 2);
    assert.match(r.body.faq[0].answer, /Bãi xe B/);
    assert.equal(r.body.resale.count, 1);
    assert.equal(r.body.resale.fromPrice, 1_050_000);
    assert.deepEqual(r.body.ambassadors.map((a: any) => [a.name, a.visits]), [['Trần', 37], ['Anh', 12]]);
    assert.equal(r.body.mine.validTickets, 2);
    assert.equal(r.body.community, null);
  });

  it('lists a tab with answered questions first and the organiser’s answer on top', async () => {
    const r = await env.as().get('/events/ravo/discussion?kind=qa');
    assert.equal(r.status, 200);
    assert.equal(r.body.items.length, 3);
    assert.match(r.body.items[0].body, /gửi xe máy/);
    const answer = r.body.items[0].replies[0];
    assert.equal(answer.official, true);
    assert.deepEqual(answer.author.badges.map((b: any) => b.key), ['team']);
    assert.equal(r.body.me.canWrite, 'signin');
    assert.deepEqual(r.body.kinds.map((k: any) => k.kind), ['qa', 'talk', 'crew']);
    assert.ok(r.body.kinds.every((k: any) => k.open));
  });

  it('asks for a proven phone number before anyone posts', async () => {
    const ravo = env.ids.event.ravo;
    assert.equal((await env.as().post(`/events/${ravo}/posts`, { kind: 'talk', body: 'Hello' })).status, 401);
    const fresh = await emailUser(env, 'quiet.reader@example.com');
    const tab = await env.as(fresh).get('/events/ravo/discussion');
    assert.equal(tab.body.me.canWrite, 'verify_phone');
    const blocked = await env.as(fresh).post(`/events/${ravo}/posts`, { kind: 'talk', body: 'Ai đi chung không?' });
    assert.equal(blocked.status, 403);
    assert.equal(blocked.body.error.code, 'phone_unverified');

    // Typing a number into the profile proves nothing…
    await env.as(fresh).patch('/me', { zalo: '0912 000 111' });
    assert.equal((await env.as(fresh).get('/me')).body.user.phoneVerified, false);
    // …a code sent to it does.
    const start = await env.as(fresh).post('/me/connections/zalo/start', { phone: '0912 000 111' });
    const ok = await env.as(fresh).post('/me/connections/zalo/verify', { challengeId: start.body.challengeId, code: start.body.devCode });
    assert.equal(ok.body.phoneVerified, true);
    const posted = await env.as(fresh).post(`/events/${ravo}/posts`, { kind: 'talk', body: 'Ai đi chung không?' });
    assert.equal(posted.status, 201);
    assert.deepEqual(posted.body.post.author.badges, []);
  });

  it('never signs anyone in to an account through a number that was only typed in', async () => {
    const typer = await emailUser(env, 'typer@example.com');
    await env.as(typer).patch('/me', { zalo: '0912 777 888' });
    const owner = await phoneUser(env, '0912 777 888');
    const me = await env.as(owner).get('/me');
    assert.equal(me.body.user.signupMethod, 'zalo');
    assert.equal(me.body.user.phoneVerified, true);
    assert.equal((await env.as(typer).get('/me')).body.user.phone, null, 'the unproven claim is dropped');
  });

  it('keeps phone numbers, links and ticket deals out of posts', async () => {
    const ravo = env.ids.event.ravo;
    const phone = await env.as(minh).post(`/events/${ravo}/posts`, { kind: 'talk', body: 'Nhắn mình 0903 118 224 nhé' });
    assert.equal(phone.body.error.code, 'post_has_phone');
    const link = await env.as(minh).post(`/events/${ravo}/posts`, { kind: 'talk', body: 'Xem https://example.com' });
    assert.equal(link.body.error.code, 'post_has_link');
    const deal = await env.as(minh).post(`/events/${ravo}/posts`, { kind: 'talk', body: 'Mình cần pass vé GA tối nay' });
    assert.equal(deal.body.error.code, 'use_resale');
    const fine = await env.as(minh).post(`/events/${ravo}/posts`, { kind: 'talk', body: 'Cửa mở lúc 16:00, mình về sớm nha' });
    assert.equal(fine.status, 201);
    assert.deepEqual(fine.body.post.author.badges.map((b: any) => b.key), ['ticket']);
  });

  it('turns the organiser’s reply to a question into the official answer and the FAQ', async () => {
    const ravo = env.ids.event.ravo;
    const q = await env.as(minh).post(`/events/${ravo}/posts`, { kind: 'qa', body: 'Có được mang nước vào không ạ?' });
    assert.equal(q.status, 201);
    await new Promise((r) => setTimeout(r, 10));
    const orgBell = await env.as(organizer).get('/organizer/notifications');
    assert.ok(orgBell.body.items.some((n: any) => n.kind === 'question'), 'the organiser hears about new questions');
    const a = await env.as(organizer).post(`/events/${ravo}/posts`, { parentId: q.body.post.id, body: 'Được mang chai nhựa rỗng, có điểm lấy nước miễn phí bên trong. Link: https://ravolution.vn/faq' });
    assert.equal(a.status, 201, 'the organiser may post links');
    assert.equal(a.body.post.official, true);
    const minhBell = await env.as(minh).get('/me/notifications');
    assert.ok(minhBell.body.items.some((n: any) => n.kind === 'post_answered'));
    const detail = await env.as().get('/events/ravo');
    assert.ok(detail.body.faq.some((f: any) => f.question === 'Có được mang nước vào không ạ?'));

    const seo = await buildEventSeo(env.ctx, 'ravo');
    const graph = seo!.jsonLd['@graph'] as any[];
    assert.equal(graph.filter((n) => n['@type'] === 'MusicEvent').length, 1);
    const faq = graph.find((n) => n['@type'] === 'FAQPage');
    assert.ok(faq.mainEntity.some((q: any) => /Được mang chai nhựa rỗng/.test(q.acceptedAnswer.text)), 'the answer is in the structured data');
    assert.equal(seo!.canonical, 'http://test.local/e/ravo');
    assert.equal(seo!.headings.faq, 'Câu hỏi thường gặp');
  });

  it('counts helpful votes once per person, never on your own post', async () => {
    const tab = await env.as(minh).get('/events/ravo/discussion?kind=talk&sort=new');
    const mine = tab.body.items.find((p: any) => p.me.mine);
    assert.equal((await env.as(minh).put(`/posts/${mine.id}/helpful`)).body.error.code, 'own_post');
    const other = tab.body.items.find((p: any) => !p.me.mine);
    const first = await env.as(minh).put(`/posts/${other.id}/helpful`);
    const again = await env.as(minh).put(`/posts/${other.id}/helpful`);
    assert.equal(again.body.helpfulCount, first.body.helpfulCount);
    const undone = await env.as(minh).delete(`/posts/${other.id}/helpful`);
    assert.equal(undone.body.helpfulCount, first.body.helpfulCount - 1);
  });

  it('hides a post after three reports until the team looks at it', async () => {
    const ravo = env.ids.event.ravo;
    const author = await phoneUser(env, '0912 444 555');
    const p = await env.as(author).post(`/events/${ravo}/posts`, { kind: 'talk', body: 'Một bài viết bị nhiều người báo cáo' });
    const reporters = [minh, await phoneUser(env, '0912 444 556'), await phoneUser(env, '0912 444 557')];
    for (const r of reporters) assert.equal((await env.as(r).post(`/posts/${p.body.post.id}/reports`, { code: 'spam' })).status, 200);
    const publicView = await env.as().get('/events/ravo/discussion?kind=talk&sort=new');
    assert.ok(!publicView.body.items.some((x: any) => x.id === p.body.post.id), 'hidden from everyone else');
    const own = await env.as(author).get('/events/ravo/discussion?kind=talk&sort=new');
    assert.ok(own.body.items.find((x: any) => x.id === p.body.post.id).hidden, 'the author still sees it, marked hidden');
    const queue = await env.as(admin).get('/admin/posts/reported');
    assert.ok(queue.body.items.some((x: any) => x.id === p.body.post.id && x.reports === 3));
    assert.equal((await env.as(minh).patch(`/posts/${p.body.post.id}`, { hidden: false })).status, 403, 'only the team moderates');
    const restored = await env.as(organizer).patch(`/posts/${p.body.post.id}`, { hidden: false });
    assert.equal(restored.body.status, 'visible');
    const again = await env.as().get('/events/ravo/discussion?kind=talk&sort=new');
    assert.ok(again.body.items.some((x: any) => x.id === p.body.post.id));
  });

  it('opens track IDs once the music starts and closes the crew finder after the night', async () => {
    const ravo = env.ids.event.ravo;
    const before = await env.as(minh).post(`/events/${ravo}/posts`, { kind: 'trackid', body: 'Bài lúc 20:15 là gì vậy?' });
    assert.equal(before.body.error.code, 'thread_closed');
    env.clock.set('2026-09-19T20:30:00+07:00');
    try {
      const sets = (await env.as().get('/events/ravo')).body.timetable.days[0].stages[0].sets;
      const hoaprox = sets.find((s: any) => s.artist === 'Hoaprox');
      const id = await env.as(minh).post(`/events/${ravo}/posts`, { kind: 'trackid', body: 'ID? Bài drop lúc 20:15 trong set Hoaprox', setId: hoaprox.id, heardAt: '20:15' });
      assert.equal(id.status, 201);
      assert.equal(id.body.post.set.artist, 'Hoaprox');
      assert.equal((await env.as().get('/events/ravo/discussion')).body.phase, 'live');
      env.clock.set('2026-09-21T10:00:00+07:00');
      const crew = await env.as(minh).post(`/events/${ravo}/posts`, { kind: 'crew', body: 'Đi chung về không?' });
      assert.equal(crew.body.error.code, 'thread_closed');
      const memory = await env.as(minh).post(`/events/${ravo}/posts`, { kind: 'memory', body: 'Đêm qua quá đã, cảm ơn BTC!' });
      assert.equal(memory.status, 201);
      assert.deepEqual((await env.as().get('/events/ravo/discussion')).body.kinds[0].kind, 'memory');
    } finally {
      env.clock.set('2026-09-14T10:00:00+07:00');
    }
  });

  it('lets anyone send in an event, which goes live only after a moderator approves it', async () => {
    const unproven = await emailUser(env, 'scout@example.com');
    const body = {
      title: 'Saigon Techno Garden Vol. 4', genre: 'EDM', description: 'Open-air techno trong vườn, 4 DJ local.',
      startsOn: '2026-10-10', startTime: '20:00', endTime: '02:00', venueName: 'The Garden', address: '12 Nguyễn Đình Chiểu', area: 'Quận 1',
      entryMode: 'paid', priceFrom: 250_000, sourceUrl: 'https://instagram.com/p/techno-garden', lineup: ['Mya', 'Kanji'],
    };
    assert.equal((await env.as(unproven).post('/community/events', body)).body.error.code, 'phone_unverified');
    const scout = await phoneUser(env, '0912 222 333');
    const sent = await env.as(scout).post('/community/events', body);
    assert.equal(sent.status, 201);
    assert.equal(sent.body.status, 'in_review');
    assert.equal((await env.as().get(`/events/${sent.body.slug}`)).status, 404, 'not public before review');
    assert.equal((await env.as(scout).get(`/events/${sent.body.slug}`)).status, 200, 'the sender can preview it');

    const queue = await env.as(admin).get('/admin/queue');
    const item = queue.body.items.find((i: any) => i.id === sent.body.id);
    assert.equal(item.organizer.name, 'Cộng đồng FeestFinder');

    const approve = await env.as(admin).post('/admin/listings/approve', { ids: [sent.body.id] });
    assert.equal(approve.status, 200);
    const live = await env.as().get(`/events/${sent.body.slug}`);
    assert.equal(live.status, 200);
    assert.equal(live.body.community.submittedBy.name, null, 'no name yet: the screen says “a member”');
    const mine = await env.as(scout).get('/me/submissions');
    assert.equal(mine.body.items[0].status, 'live');
    const bell = await env.as(scout).get('/me/notifications');
    assert.ok(bell.body.items.some((n: any) => n.kind === 'submission_live'));

    const second = await env.as(scout).post('/community/events', { ...body, title: 'Saigon Techno Garden Vol. 5', startsOn: '2026-10-17' });
    const reject = await env.as(admin).post('/admin/listings/reject', { ids: [second.body.id], code: 'venue' });
    assert.equal(reject.status, 200);
    const after = await env.as(scout).get('/me/submissions');
    const rejected = after.body.items.find((i: any) => i.id === second.body.id);
    assert.equal(rejected.status, 'rejected');
    assert.ok(rejected.reason);
  });

  it('unlocks hype goals as the count passes them and tells the organiser', async () => {
    const ravo = env.ids.event.ravo;
    const set = await env.as(organizer).put(`/organizer/events/${ravo}/hype-goals`, { goals: [
      { threshold: 2000, reward: { en: '200 more early-bird tickets', vi: 'Mở thêm 200 vé early bird' } },
      { threshold: 2141, reward: { en: 'Reveal the secret closing act', vi: 'Công bố nghệ sĩ bí mật' } },
    ] });
    assert.deepEqual(set.body.goals.map((g: any) => [g.threshold, g.reached]), [[2000, true], [2141, false]]);
    const fan = await phoneUser(env, '0912 888 999');
    await env.as(fan).put(`/me/hypes/${ravo}`);
    const goals = await env.as(organizer).get(`/organizer/events/${ravo}/hype-goals`);
    assert.equal(goals.body.goals[1].reached, true);
    const bell = await env.as(organizer).get('/organizer/notifications');
    assert.ok(bell.body.items.some((n: any) => n.kind === 'hype'));
  });

  it('credits share links with the people they bring in', async () => {
    const ravo = env.ids.event.ravo;
    const share = await env.as(minh).post(`/events/${ravo}/shares`, { channel: 'zalo' });
    assert.match(share.body.url, /^http:\/\/test\.local\/e\/ravo\?ref=[2-9A-HJ-NP-Z]{6}&ch=zalo$/);
    const anon = await env.as().post(`/events/${ravo}/shares`, { channel: 'copy' });
    assert.equal(anon.body.ref, null);
    for (const ua of ['phone-a', 'phone-b', 'phone-a']) {
      await env.app.inject({ method: 'POST', url: `/events/${ravo}/track`, payload: { type: 'view', source: 'shared', channel: 'zalo', ref: share.body.ref }, headers: { 'user-agent': ua } });
    }
    const detail = await env.as(minh).get('/events/ravo');
    assert.equal(detail.body.mine.broughtVisits, 2, 'two people, one of them twice');
    const metrics = await one<any>(env.ctx.db, `select sources from event_metrics_daily where event_id = $1 and day = '2026-09-14'`, [ravo]);
    assert.ok(metrics.sources['shared:zalo'] >= 1);
  });

  it('serves robots.txt for AI search but not training, and a sitemap', async () => {
    const robots = await env.as().get('/robots.txt');
    assert.match(robots.body, /User-agent: \*\nAllow: \//);
    assert.match(robots.body, /User-agent: GPTBot[\s\S]*User-agent: ClaudeBot[\s\S]*Disallow: \/\n/);
    assert.doesNotMatch(robots.body, /OAI-SearchBot/);
    assert.match(robots.body, /Sitemap: http:\/\/test\.local\/sitemap\.xml/);
    const map = await env.as().get('/sitemap.xml');
    assert.match(map.body, /<loc>http:\/\/test\.local\/e\/ravo<\/loc>/);
  });

  it('announces event and organiser pages to IndexNow once, in both languages, and again only when they change', async () => {
    const keyed = await setup({ config: { indexNowKey: 'ff-indexnow-key-1' } });
    try {
      const sent: any[] = [];
      const send = (async (_url: string, init: any) => { sent.push(JSON.parse(init.body)); return new Response(null, { status: 202 }); }) as any;
      assert.ok(await pingIndexNow(keyed.ctx, send) > 1, 'every public page goes out the first time');
      assert.ok(sent[0].urlList.includes('http://test.local/e/ravo'));
      assert.equal(sent[0].keyLocation, 'http://test.local/ff-indexnow-key-1.txt');
      assert.equal(await pingIndexNow(keyed.ctx, send), 0, 'nothing changed since');
      await keyed.ctx.db.query(`update events set hype_count = hype_count + 1, save_count = save_count + 1 where slug = 'ravo'`);
      assert.equal(await pingIndexNow(keyed.ctx, send), 0, 'a counter is not a change to the page');
      await keyed.ctx.db.query(`update events set title = 'Ravolution Music Festival 2026' where slug = 'ravo'`);
      assert.equal(await pingIndexNow(keyed.ctx, send), 2, 'the event, and its organiser page that lists it');
      assert.deepEqual(sent.at(-1).urlList.sort(), ['http://test.local/e/ravo', 'http://test.local/e/ravo?lang=en', 'http://test.local/o/ravoent', 'http://test.local/o/ravoent?lang=en']);
      await queueIndexNow(keyed.ctx.db, keyed.ctx, 'hozo');
      assert.equal(await pingIndexNow(keyed.ctx, send), 1, 'a page queued by hand goes out too');
      assert.equal((await keyed.as().get('/ff-indexnow-key-1.txt')).body, 'ff-indexnow-key-1');
      assert.equal((await many(keyed.ctx.db, 'select * from indexnow_queue')).length, 0);
    } finally { await keyed.close(); }
  });
});
