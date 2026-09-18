import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';
import { many, one } from '../src/db/index.ts';
import { qrToken } from '../src/services/tickets.ts';

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

  it('opens the performance drawer', async () => {
    const r = await env.as(token).get(`/organizer/events/${ravo}/performance`);
    assert.equal(r.status, 200);
    assert.equal(r.body.daysLeft, 5);
    assert.equal(r.body.trend.length, 14);
    assert.equal(r.body.funnel.map((f: any) => f.key).join(','), 'views,saves,ticketClicks,sold');
    assert.equal(r.body.funnel[3].value, r.body.sold);
    assert.equal(r.body.tiers.find((t: any) => t.soldOut).name.en, 'Early bird');
    assert.equal(r.body.sources[0].key, 'feed');
    assert.equal(r.body.vsPrevious.rows.length, 4);
    assert.ok(['on_pace', 'behind'].includes(r.body.verdict.key));
  });

  it('searches attendees by phone, filters, exports and resends', async () => {
    const all = await env.as(token).get(`/organizer/events/${ravo}/attendees?limit=100`);
    assert.equal(all.body.kpis.sold, all.body.filters.out + all.body.filters.in);
    assert.ok(all.body.kpis.refunded >= 1);
    const someone = all.body.items.find((a: any) => a.state === 'out' && a.phone);
    const localDigits = someone.phone.replace(/\D/g, '').slice(0, 7);
    const found = await env.as(token).get(`/organizer/events/${ravo}/attendees?q=${localDigits}`);
    assert.ok(found.body.items.some((a: any) => a.ticketId === someone.ticketId), 'search by the digits people type');
    assert.doesNotMatch(someone.phone, /•/, 'the owner sees full numbers');

    const refunded = await env.as(token).get(`/organizer/events/${ravo}/attendees?filter=refunded`);
    assert.ok(refunded.body.items.every((a: any) => a.state === 'refunded'));
    const refuse = await env.as(token).post(`/organizer/tickets/${refunded.body.items[0].ticketId}/resend`);
    assert.equal(refuse.body.error.code, 'ticket_refunded');
    const resend = await env.as(token).post(`/organizer/tickets/${someone.ticketId}/resend`);
    assert.equal(resend.body.state, 'resent');

    const csv = await env.as(token).get(`/organizer/events/${ravo}/attendees.csv`);
    assert.equal(csv.status, 200);
    assert.match(csv.headers['content-type'], /text\/csv/);
    assert.equal(csv.body.trim().split('\r\n').length, all.body.filters.all + 1);
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
    const clash = await env.as(token).post(`/organizer/events/${ravo}/announcements`, { audience: 'holders', channels: ['push'], subject: 'Doors', body: 'Doors at 16:00' });
    assert.equal(clash.status, 409);
    assert.equal(clash.body.error.code, 'announcement_cooldown');

    const later = await env.as(token).post(`/organizer/events/${ravo}/announcements`, {
      audience: 'holders', channels: ['push', 'zalo'], subject: 'Gates and shuttles', body: 'Main gate opens 16:00.', sendAt: '2026-09-16T09:00:00+07:00',
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
      logoUrl: 'https://assets.festfinder.vn/logos/ravoent.png', lineup: ['Hoaprox', 'DJ Mie', 'Wukong'], age: '18+',
    });
    assert.equal(filled.status, 200);
    assert.equal(filled.body.venue.resolved, true);
    assert.equal(filled.body.quality.score, 80, 'everything but the cover');
    assert.equal(filled.body.quality.band, 'passable');

    await env.as(token).put(`/organizer/events/${draft.body.id}/tiers`, { tiers: [
      { key: 'ga', name: { en: 'General admission', vi: 'Vé thường' }, price: 600000, capacity: 2000 },
      { key: 'vip', name: { en: 'VIP', vi: 'VIP' }, price: 1500000, capacity: 300 },
    ] });
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

  it('runs the door: invite a scanner, sign in by phone, scan, catch duplicates, sync offline', async () => {
    const add = await env.as(token).post(`/organizer/events/${ravo}/staff`, { name: 'Võ Minh Thư', phone: '0977 123 456', gate: 'side', role: 'scanner' });
    assert.equal(add.status, 201);
    assert.equal(add.body.status, 'invited');
    const dup = await env.as(token).post(`/organizer/events/${ravo}/staff`, { name: 'Someone', phone: '+84977123456' });
    assert.equal(dup.body.error.code, 'staff_exists');

    const start = await env.as().post('/door/auth/start', { phone: '0977123456' });
    const verify = await env.as().post('/door/auth/verify', { challengeId: start.body.challengeId, code: start.body.devCode });
    assert.equal(verify.status, 200);
    const scanner = verify.body.token;
    assert.equal(verify.body.event.id, ravo);
    assert.equal((await env.as(scanner).get('/organizer/events')).status, 401, 'a scanner session is not a user session');

    const manifest = await env.as(scanner).get(`/door/events/${ravo}/manifest`);
    assert.ok(manifest.body.tickets.length > 0);
    assert.ok(manifest.body.scanKey);

    const t = await one<any>(env.ctx.db, `select code from tickets where event_id = $1 and status = 'valid' limit 1`, [ravo]);
    const token1 = qrToken(env.ctx.config.ticketSigningSecret, ravo, t.code);
    const ok = await env.as(scanner).post(`/door/events/${ravo}/scans`, { token: token1, deviceId: 'phone-1', clientScanId: 'a1' });
    assert.equal(ok.body.result, 'valid');
    assert.equal(ok.body.message.en, 'Valid — let them in');
    const retry = await env.as(scanner).post(`/door/events/${ravo}/scans`, { token: token1, deviceId: 'phone-1', clientScanId: 'a1' });
    assert.equal(retry.body.result, 'valid', 'a retried request is idempotent');
    const again = await env.as(scanner).post(`/door/events/${ravo}/scans`, { token: token1, deviceId: 'phone-1', clientScanId: 'a2' });
    assert.equal(again.body.result, 'duplicate');
    assert.match(again.body.detail.en, /^Already scanned \d\d:\d\d at the side gate$/);

    const refunded = await one<any>(env.ctx.db, `select code from tickets where event_id = $1 and status = 'refunded' limit 1`, [ravo]);
    const bad = await env.as(scanner).post(`/door/events/${ravo}/scans`, { token: qrToken(env.ctx.config.ticketSigningSecret, ravo, refunded.code), deviceId: 'phone-1', clientScanId: 'a3' });
    assert.equal(bad.body.detail.en, 'Refunded ticket — do not admit');
    const other = await one<any>(env.ctx.db, `select code, event_id from tickets where event_id = $1 limit 1`, [env.ids.event['ravo-warmup']]);
    const wrong = await env.as(scanner).post(`/door/events/${ravo}/scans`, { token: qrToken(env.ctx.config.ticketSigningSecret, other.event_id, other.code), deviceId: 'phone-1', clientScanId: 'a4' });
    assert.equal(wrong.body.detail.en, 'Code not from this event');
    const forged = await env.as(scanner).post(`/door/events/${ravo}/scans`, { token: `${t.code}.AAAAAAAAAAAAAAAAAAAAAA`, deviceId: 'phone-1', clientScanId: 'a5' });
    assert.equal(forged.body.reason, 'bad_signature');

    const two = await many<any>(env.ctx.db, `select code from tickets where event_id = $1 and status = 'valid' limit 2`, [ravo]);
    const sync = await env.as(scanner).post(`/door/events/${ravo}/scans/sync`, { deviceId: 'phone-2', scans: [
      { token: qrToken(env.ctx.config.ticketSigningSecret, ravo, two[0].code), clientScanId: 'o1', scannedAt: '2026-09-19T19:40:00+07:00' },
      { token: qrToken(env.ctx.config.ticketSigningSecret, ravo, two[1].code), clientScanId: 'o2', scannedAt: '2026-09-19T19:41:00+07:00' },
      { token: qrToken(env.ctx.config.ticketSigningSecret, ravo, two[0].code), clientScanId: 'o3', scannedAt: '2026-09-19T19:42:00+07:00' },
    ] });
    assert.deepEqual(sync.body.summary, { valid: 2, duplicate: 1, invalid: 0 });
    assert.equal(sync.body.results[0].detail.en, 'GA · saved offline, will sync'.replace('GA', sync.body.results[0].holder.tier));
    const resync = await env.as(scanner).post(`/door/events/${ravo}/scans/sync`, { deviceId: 'phone-2', scans: [
      { token: qrToken(env.ctx.config.ticketSigningSecret, ravo, two[0].code), clientScanId: 'o1', scannedAt: '2026-09-19T19:40:00+07:00' },
    ] });
    assert.equal(resync.body.summary.valid, 1, 'resending the queue does not double count');

    const summary = await env.as(token).get(`/door/events/${ravo}/summary`);
    assert.equal(summary.body.inside, 3);
    assert.equal(summary.body.recent.length, 6);
    assert.ok(summary.body.lastSyncedAt);
    const staff = summary.body.staff.find((p: any) => p.name === 'Võ Minh Thư');
    assert.equal(staff.status, 'scanning');
    assert.equal(staff.scanCount, 8);

    const pause = await env.as(token).patch(`/organizer/events/${ravo}/staff/${staff.id}`, { active: false });
    assert.equal(pause.body.message.en, 'Võ Minh Thư can no longer scan');
    assert.equal((await env.as(scanner).get(`/door/events/${ravo}/manifest`)).status, 401, 'paused scanners are signed out');
  });

  it('manages promo codes and the guest list', async () => {
    const created = await env.as(token).post(`/organizer/events/${ravo}/promos`, { code: 'press-50', pct: 50, cap: 20 });
    assert.equal(created.body.code, 'PRESS50');
    assert.equal((await env.as(token).post(`/organizer/events/${ravo}/promos`, { code: 'PRESS50', pct: 10 })).body.error.code, 'code_exists');
    assert.equal((await env.as(token).post(`/organizer/events/${ravo}/promos`, { code: 'BIG', pct: 150 })).body.error.code, 'pct_range');
    const paused = await env.as(token).patch(`/organizer/events/${ravo}/promos/${created.body.id}`, { active: false });
    assert.equal(paused.body.message.en, 'Paused PRESS50');
    const guests = await env.as(token).get(`/organizer/events/${ravo}/guests`);
    assert.equal(guests.body.countLine.en, '13 seats · 4 guests');
    const g = await env.as(token).post(`/organizer/events/${ravo}/guests`, { name: 'Đỗ Hà', seats: 2 });
    const inside = await env.as(token).patch(`/organizer/events/${ravo}/guests/${g.body.id}`, { checkedIn: true });
    assert.equal(inside.body.checkedIn, true);
  });

  it('reports revenue and a payout ledger that adds up', async () => {
    const r = await env.as(token).get(`/organizer/events/${ravo}/revenue`);
    assert.equal(r.status, 200);
    assert.ok(r.body.kpis.gross > 0);
    assert.equal(r.body.daily.length, 14);
    for (const row of r.body.payouts) {
      if (row.kind === 'refund_hold') continue;
      const sum = row.lines.reduce((n: number, l: any) => n + l.amount, 0);
      assert.equal(row.net, sum, `${row.kind} net equals its lines`);
    }
    const [advance, post, hold] = r.body.payouts;
    assert.equal(advance.status, 'available', 'within 14 days of the event');
    assert.equal(post.settlesOn, '2026-09-23', 'three working days after Saturday');
    assert.equal(hold.settlesOn, '2026-09-26');
    assert.equal(advance.lines[0].amount + post.lines[0].amount, r.body.kpis.gross);

    const admin = await env.admin();
    const pay = await env.as(admin).post(`/admin/payouts/${ravo}/advance`, { reference: 'VCB-20260914-001' });
    assert.equal(pay.status, 201);
    assert.equal(pay.body.status, 'paid');
    const again = await env.as(admin).post(`/admin/payouts/${ravo}/advance`, { reference: 'VCB-20260914-002' });
    assert.equal(again.body.error.code, 'already_paid');

    const csv = await env.as(token).get(`/organizer/events/${ravo}/payouts/post_event/statement.csv`);
    assert.match(csv.body, /platform_fee/);
    const invoice = await env.as(token).get(`/organizer/events/${ravo}/payouts/advance/invoice`);
    assert.equal(invoice.body.buyer.taxCode, '0316548792');
    assert.equal(invoice.body.total, invoice.body.subtotal + invoice.body.vat);
  });

  it('refunds an order and puts the seats back', async () => {
    const order = await one<any>(env.ctx.db, `select o.id, o.tier_id from orders o where o.event_id = $1 and o.status = 'paid' and not exists (select 1 from tickets t where t.order_id = o.id and t.status = 'used') limit 1`, [ravo]);
    const before = await one<any>(env.ctx.db, 'select sold from ticket_tiers where id = $1', [order.tier_id]);
    const r = await env.as(token).post(`/organizer/orders/${order.id}/refund`);
    assert.equal(r.status, 200);
    const after = await one<any>(env.ctx.db, 'select sold from ticket_tiers where id = $1', [order.tier_id]);
    assert.equal(after.sold, before.sold - 1);
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
    const off = await env.as(token).post('/organizer/notifications/test');
    assert.equal(off.body.sent, false, 'crew alerts are off by default');
    await env.as(token).put('/organizer/notification-preferences', { crew: true });
    assert.equal((await env.as(token).post('/organizer/notifications/test')).body.sent, true);
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
