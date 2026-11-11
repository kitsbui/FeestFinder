import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';
import { many } from '../src/db/index.ts';

describe('organizer back office (Ravolution)', () => {
  let env: TestEnv;
  let token: string;
  let ravo: string;
  before(async () => {
    env = await setup();
    token = await env.organizer();
    ravo = env.ids.event.ravo;
  });
  after(async () => { await env.close(); });

  it('keeps attendees out of the back office', async () => {
    const attendee = await env.attendee();
    const r = await env.as(attendee).get('/organizer/events');
    assert.equal(r.status, 403);
    assert.equal(r.body.error.code, 'not_an_organizer');
    const other = await env.as(token).get(`/organizer/events/${env.ids.event.hozo}/attendees`);
    assert.equal(other.status, 404, "another organiser's event is invisible");
  });

  it('lists events with status and meta, and reads the dashboard', async () => {
    const list = await env.as(token).get('/organizer/events');
    const bySlug = Object.fromEntries(list.body.items.map((e: any) => [e.slug, e]));
    assert.equal(bySlug.ravo.statusLabel.en, 'Live');
    assert.equal(bySlug['ravo-after-hours'].meta.en, 'Venue awaiting verification');
    assert.equal(bySlug['ravo-bus'].meta.en, 'No ticket price yet');
    assert.equal(bySlug['ravo-bus'].views, null);
    assert.equal(bySlug.ravo.hasPerformance, true);

    const dash = await env.as(token).get('/organizer/dashboard?range=30d');
    const kpi = Object.fromEntries(dash.body.kpis.map((k: any) => [k.key, k]));
    assert.ok(kpi.views.value > 0);
    assert.equal(kpi.inReview.value, 1);
    assert.equal(kpi.inReview.delta.en, 'Submitted 2h ago');
    assert.ok(dash.body.todo.some((t: any) => t.kind === 'image'), 'After Hours has no cover');
    const audience = await env.as(token).get('/organizer/audience');
    assert.ok(audience.body.total > 0);
  });

  it('says what Google and AI assistants read from each listing, and what to add, weakest first', async () => {
    const one = (await env.as(token).get(`/organizer/events/${ravo}/search`)).body;
    assert.equal(one.checks.length, 10);
    assert.equal(one.checks.reduce((n: number, c: any) => n + c.points, 0), 100);
    assert.ok(one.checks.every((c: any) => c.label.vi && c.why.vi && c.field));
    const before = one.score;
    // Nothing in English yet: adding it is worth its points.
    const en = one.checks.find((c: any) => c.key === 'about_en');
    if (!en.ok) {
      await env.ctx.db.query(`update events set description = jsonb_set(description, '{en}', to_jsonb($2::text)) where id = $1`,
        [ravo, 'Ravolution Music Festival brings two days of techno, house and trance to SECC in District 7, with an international lineup, two stages and a late closing.']);
      assert.equal((await env.as(token).get(`/organizer/events/${ravo}/search`)).body.score, before + en.points);
    }
    const all = (await env.as(token).get('/organizer/search')).body;
    assert.ok(all.items.length >= 2);
    assert.ok(all.items.every((x: any, i: number, a: any[]) => i === 0 || a[i - 1].score <= x.score), 'weakest first');
    assert.equal(typeof all.average, 'number');
    assert.equal((await env.as(await env.attendee()).get('/organizer/search')).status, 403);
  });

  it('opens the performance drawer', async () => {
    const r = await env.as(token).get(`/organizer/events/${ravo}/performance`);
    assert.equal(r.status, 200);
    assert.equal(r.body.daysLeft, 5);
    assert.equal(r.body.trend.length, 14);
    assert.equal(r.body.funnel.map((f: any) => f.key).join(','), 'views,saves,ticketClicks');
    assert.equal(r.body.trend.reduce((n: number, d: any) => n + d.clicks, 0) >= 0, true);
    assert.equal(r.body.sources[0].key, 'feed');
    assert.equal(r.body.vsPrevious.rows.length, 4);
    assert.equal(r.body.sold, undefined, 'FeestFinder sells no tickets');
    // Where "Mua vé" sent people, by seller: one more click through /go shows under its host.
    await env.call('GET', '/go/ravo?src=detail', { headers: { 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile/15E148' } });
    const after = await env.as(token).get(`/organizer/events/${ravo}/performance`);
    assert.ok(after.body.sellers.some((x: { host: string; clicks: number }) => x.host === 'ticketbox.vn' && x.clicks >= 1), JSON.stringify(after.body.sellers));
    assert.equal(typeof after.body.referredClicks, 'number');
  });

  it('gives the studio its views, saves and ticket clicks day by day over a range', async () => {
    const r = await env.as(token).get(`/organizer/events/${ravo}/performance?range=7d`);
    assert.equal(r.body.range, '7d');
    assert.equal(r.body.daily.length, 7);
    assert.deepEqual(Object.keys(r.body.daily[0]).sort(), ['clicks', 'day', 'saves', 'views']);
    assert.equal(r.body.daily[6].day, '2026-09-14', 'ends today, by the pinned clock');
    assert.equal(r.body.period.views, r.body.daily.reduce((n: number, d: any) => n + d.views, 0));
    assert.equal(typeof r.body.period.viewsBefore, 'number');
    assert.equal(r.body.boost, null);
    assert.equal((await env.as(token).get(`/organizer/events/${ravo}/performance?range=30d`)).body.daily.length, 30);
    assert.equal((await env.as(token).get(`/organizer/events/${ravo}/performance?range=99d`)).status, 400);
  });

  it('asks the team to feature a live listing, once, and hears the answer', async () => {
    const asked = await env.as(token).post(`/organizer/events/${ravo}/boost`);
    assert.equal(asked.status, 201);
    assert.equal(asked.body.message.en, 'Boost request sent to FeestFinder');
    assert.equal((await env.as(token).post(`/organizer/events/${ravo}/boost`)).status, 200, 'asking again keeps the one open request');
    assert.equal((await env.as(token).get(`/organizer/events/${ravo}/performance`)).body.boost.status, 'open');
    const draft = (await env.as(token).get('/organizer/events')).body.items.find((e: any) => e.status === 'draft');
    assert.equal((await env.as(token).post(`/organizer/events/${draft.id}/boost`)).body.error.code, 'not_live');

    assert.equal((await env.as(token).get('/admin/boosts')).status, 403, 'organisers do not see the queue');
    const admin = await env.admin();
    const list = await env.as(admin).get('/admin/boosts');
    const mine = list.body.items.find((b: any) => b.event.id === ravo && b.status === 'open');
    assert.equal(mine.organizer, 'Ravolution Entertainment');
    const done = await env.as(admin).post(`/admin/boosts/${mine.id}`, { status: 'done' });
    assert.equal(done.body.status, 'done');
    assert.equal((await env.as(admin).post(`/admin/boosts/${mine.id}`, { status: 'declined' })).body.error.code, 'already_answered');
    assert.equal((await env.as(token).get(`/organizer/events/${ravo}/performance`)).body.boost.status, 'done');
    const notes = await env.as(token).get('/organizer/notifications');
    const note = notes.body.items.find((n: any) => n.kind === 'boost');
    assert.ok(note && note.unread);
    await env.as(token).post(`/organizer/notifications/${note.id}/read`);
    const audit = await env.as(admin).get('/admin/audit?limit=5');
    assert.ok(audit.body.items.some((a: any) => a.action === 'boost.done'));
  });

  it('estimates reach, sends one announcement a day, and schedules', async () => {
    const est = await env.as(token).get(`/organizer/events/${ravo}/announcements/estimate?audience=saved&channels=push,zalo`);
    assert.ok(est.body.audienceSize > 0);
    assert.ok(est.body.reach <= est.body.audienceSize);
    const push = est.body.channels.find((c: any) => c.channel === 'push').reachable;
    const zalo = est.body.channels.find((c: any) => c.channel === 'zalo').reachable;
    assert.ok(est.body.reach >= Math.max(push, zalo) && est.body.reach <= push + zalo, 'union, nobody counted twice');

    const tooLong = await env.as(token).post(`/organizer/events/${ravo}/announcements`, { audience: 'saved', channels: ['push'], subject: 'x', body: 'y'.repeat(321) });
    assert.equal(tooLong.body.error.code, 'message_too_long');
    const noChannel = await env.as(token).post(`/organizer/events/${ravo}/announcements`, { audience: 'saved', channels: [], subject: 'x', body: 'y' });
    assert.equal(noChannel.body.error.code, 'channel_required');

    // Seeded: sent 13 Sep 18:00, 16 hours before "now", so a send today falls inside its 24h window.
    const clash = await env.as(token).post(`/organizer/events/${ravo}/announcements`, { audience: 'going', channels: ['push'], subject: 'Doors', body: 'Doors at 16:00' });
    assert.equal(clash.status, 409);
    assert.equal(clash.body.error.code, 'announcement_cooldown');

    const later = await env.as(token).post(`/organizer/events/${ravo}/announcements`, {
      audience: 'going', channels: ['push', 'zalo'], subject: 'Gates and shuttles', body: 'Main gate opens 16:00.', sendAt: '2026-09-16T09:00:00+07:00',
    });
    assert.equal(later.status, 201);
    assert.equal(later.body.status, 'scheduled');
    const list = await env.as(token).get(`/organizer/events/${ravo}/announcements`);
    assert.ok(list.body.items.some((a: any) => a.id === later.body.id));
    const cancel = await env.as(token).delete(`/organizer/announcements/${later.body.id}`);
    assert.equal(cancel.body.message.en, 'Schedule cancelled');
  });

  it('walks the wizard: draft, quality score, submit, review', async () => {
    const draft = await env.as(token).post('/organizer/events', { title: 'Ravo', genre: 'EDM' });
    assert.equal(draft.status, 201);
    assert.equal(draft.body.status, 'draft');
    assert.ok(draft.body.quality.score < 60);
    assert.equal(draft.body.quality.checks.find((c: any) => c.key === 'name').ok, false);

    const notReady = await env.as(token).post(`/organizer/events/${draft.body.id}/submit`);
    assert.equal(notReady.body.error.code, 'not_ready');
    assert.ok(notReady.body.error.details.missing.includes('logo'));

    const venues = await env.as(token).get('/venues?q=secc');
    const filled = await env.as(token).patch(`/organizer/events/${draft.body.id}`, {
      title: 'Ravolution Closing Party 2026', startsOn: '2026-10-10', startTime: '20:00', endTime: '02:00', venueId: venues.body.items[0].id,
      description: { en: 'A closing party for the season with both stages open late and the full production crew back at SECC.', vi: '' },
      entryMode: 'paid', priceFrom: 600000, ticketUrl: 'https://ticketbox.vn/ravo-closing', eventUrl: 'https://ravolution.vn/closing',
      logoUrl: 'https://assets.feestfinder.com/logos/ravoent.png', lineup: ['Hoaprox', 'DJ Mie', 'Wukong'], age: '18+',
    });
    assert.equal(filled.status, 200);
    assert.equal(filled.body.venue.resolved, true);
    assert.equal(filled.body.quality.score, 80, 'everything but the cover');
    assert.equal(filled.body.quality.band, 'passable');
    // A cover is asked for before sending (design v2 phase 8).
    const noCover = await env.as(token).post(`/organizer/events/${draft.body.id}/submit`);
    assert.deepEqual(noCover.body.error.details.missing, ['cover']);
    await env.as(token).patch(`/organizer/events/${draft.body.id}`, { coverUrl: 'https://assets.feestfinder.com/covers/ravo-closing.jpg' });

    // FeestFinder sells no tickets: there is no tier to add, and the old route is gone.
    assert.equal((await env.as(token).put(`/organizer/events/${draft.body.id}/tiers`, { tiers: [] })).status, 404);
    const timetable = await env.as(token).put(`/organizer/events/${draft.body.id}/timetable`, { stages: [
      { name: { en: 'Arena', vi: 'Arena' }, sets: [{ day: '2026-10-10', artist: 'Hoaprox', start: '23:30', end: '01:00' }, { day: '2026-10-10', artist: 'Closing b2b', start: '01:00', end: '02:00' }] },
    ] });
    assert.equal(timetable.status, 200);
    const sets = await many<any>(env.ctx.db, `select artist, starts_at from sets where event_id = $1 order by starts_at`, [draft.body.id]);
    assert.equal(new Date(sets[1].starts_at).toISOString(), '2026-10-10T18:00:00.000Z', '01:00 is the next morning');

    const submitted = await env.as(token).post(`/organizer/events/${draft.body.id}/submit`);
    assert.equal(submitted.status, 200);
    assert.equal(submitted.body.status, 'in_review');
    assert.equal(submitted.body.message.en, 'Submitted for review · usually live within 2 hours');
    const admin = await env.admin();
    const queue = await env.as(admin).get('/admin/queue');
    assert.ok(queue.body.items.some((i: any) => i.id === draft.body.id));
  });

  it('keeps a dress code of 120 characters at most, and clears it when blank', async () => {
    const draft = await env.as(token).post('/organizer/events', { title: 'Dress', genre: 'EDM' });
    const set = await env.as(token).patch(`/organizer/events/${draft.body.id}`, { dressCode: 'Smart casual, no sportswear' });
    assert.equal(set.status, 200);
    assert.equal(set.body.dressCode, 'Smart casual, no sportswear');
    const long = await env.as(token).patch(`/organizer/events/${draft.body.id}`, { dressCode: 'x'.repeat(121) });
    assert.equal(long.body.error.code, 'invalid_input');
    const blank = await env.as(token).patch(`/organizer/events/${draft.body.id}`, { dressCode: '  ' });
    assert.equal(blank.body.dressCode, null);
  });

  it('reads the inbox, replies, and gets an acknowledgement', async () => {
    const inbox = await env.as(token).get('/organizer/inbox');
    assert.equal(inbox.body.unread, 1);
    const thread = inbox.body.items.find((t: any) => t.topic === 'moderation');
    const open = await env.as(token).get(`/organizer/inbox/${thread.id}`);
    assert.equal(open.body.messages.length, 2);
    await env.as(token).post(`/organizer/inbox/${thread.id}/messages`, { body: 'We have just uploaded a 1600×900 landscape image — please take another look.' });
    const after = await env.as(token).get(`/organizer/inbox/${thread.id}`);
    assert.equal(after.body.messages.at(-1).body.en, 'Got it — we will review and come back within two working hours.');
    assert.equal((await env.as(token).get('/organizer/inbox')).body.unread, 0);
  });

  it('keeps the notification bell and its preferences', async () => {
    const bell = await env.as(token).get('/organizer/notifications');
    assert.equal(bell.body.unread, 2);
    await env.as(token).put('/organizer/notification-preferences', { moderation: false });
    assert.equal((await env.as(token).post('/organizer/notifications/test')).body.sent, false, 'listing alerts switched off');
    await env.as(token).put('/organizer/notification-preferences', { moderation: true });
    assert.equal((await env.as(token).post('/organizer/notifications/test')).body.sent, true);
    const prefs = await env.as(token).get('/organizer/notification-preferences');
    assert.deepEqual(prefs.body.topics.map((t: any) => t.key), ['moderation', 'tickets', 'bookings'], 'no payouts or gate crew');
    await env.as(token).post('/organizer/notifications/read-all');
    assert.equal((await env.as(token).get('/organizer/notifications')).body.unread, 0);
  });

  it('saves the business profile with validation', async () => {
    const bad = await env.as(token).patch('/organizer/profile', { taxCode: '12-34' });
    assert.equal(bad.body.error.code, 'invalid_tax_code');
    const ok = await env.as(token).patch('/organizer/profile', { hotline: '1900 6868', bio: { en: 'EDM since 2016.', vi: 'EDM từ 2016.' } });
    assert.equal(ok.body.message.en, 'Business profile saved');
    const profile = await env.as(token).get('/organizer/profile');
    assert.equal(profile.body.bank.accountMasked, '•••• 4471');
  });
});
