import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';
import { many, one } from '../src/db/index.ts';

/** The operations back office (/ops): the catalogue, venues, organiser onboarding, accounts and orders. */
describe('operations back office', () => {
  let env: TestEnv;
  let admin: string;
  let organizer: string;
  before(async () => {
    env = await setup();
    admin = await env.admin();
    organizer = await env.organizer();
  });
  after(async () => { await env.close(); });

  it('serves every dropdown list without signing in', async () => {
    const r = await env.as().get('/meta/form-options');
    assert.equal(r.status, 200);
    assert.deepEqual(r.body.genres.map((g: any) => g.value), ['EDM', 'Festival', 'Indie', 'Hip-Hop', 'Pop', 'Jazz', 'Food', 'Culture']);
    assert.ok(r.body.areaGroups.find((g: any) => g.key === 'central').areas.includes('Quận 1'));
    assert.ok(r.body.banks.some((b: any) => b.bin === '970436'));
    assert.deepEqual(r.body.statuses.map((s: any) => s.value), ['draft', 'in_review', 'live', 'rejected', 'removed', 'cancelled']);
  });

  it('keeps the team endpoints to admins', async () => {
    for (const path of ['/admin/overview', '/admin/events', '/admin/venues', '/admin/users', '/admin/orders']) {
      const r = await env.as(organizer).get(path);
      assert.equal(r.status, 403, path);
    }
  });

  it('summarises what needs a person on the overview', async () => {
    const r = await env.as(admin).get('/admin/overview');
    assert.equal(r.status, 200);
    assert.equal(r.body.queue.total, 5);
    assert.equal(r.body.queue.breach, 1);
    assert.equal(r.body.unresolvedVenues, 2, 'the two warehouse listings in review have no pin');
    assert.ok(r.body.activity.length > 0);
    assert.ok(r.body.activity[0].label.vi);
  });

  it('filters the catalogue by status, genre, district, date and text, with status counts', async () => {
    const review = await env.as(admin).get('/admin/events?status=in_review&limit=50');
    assert.equal(review.body.total, 5);
    assert.equal(review.body.facets.status.in_review, 5);
    const edm = await env.as(admin).get('/admin/events?status=in_review&genre=EDM&area=Qu%E1%BA%ADn%204');
    assert.deepEqual(edm.body.items.map((e: any) => e.title).sort(), ['Ravolution After Hours', 'Underground Techno — Warehouse 12']);
    assert.ok(edm.body.items.every((e: any) => e.genre === 'EDM' && e.area === 'Quận 4'));
    const text = await env.as(admin).get('/admin/events?q=thao%20dien&when=all');
    assert.ok(text.body.items.some((e: any) => e.title.startsWith('Acoustic Sunset')), 'diacritic-free search');
    const past = await env.as(admin).get('/admin/events?when=past&limit=100');
    assert.ok(past.body.items.every((e: any) => (e.endsOn ?? e.startsOn) < '2026-09-14'));
    const unpinned = await env.as(admin).get('/admin/events?unresolved=true&when=all');
    assert.ok(unpinned.body.items.every((e: any) => !e.venueResolved));
    const csv = await env.as(admin).get('/admin/events.csv?status=live');
    assert.equal(csv.status, 200);
    assert.match(String(csv.headers['content-type']), /text\/csv/);
  });

  it('creates a listing for an organiser and publishes it straight away', async () => {
    const venue = await one<any>(env.ctx.db, `select id from venues where name = 'Yoko Saigon'`);
    const incomplete = await env.as(admin).post('/admin/events', { organizerId: env.ids.org.yoko, title: 'Late jam', publish: true });
    assert.equal(incomplete.status, 400);
    assert.equal(incomplete.body.error.code, 'not_ready');
    const r = await env.as(admin).post('/admin/events', {
      organizerId: env.ids.org.yoko, publish: true, title: 'Yoko Late Jam Session', genre: 'Jazz', startsOn: '2026-09-25', startTime: '21:00', endTime: '23:30',
      venueId: venue.id, entryMode: 'free', description: { vi: 'Jam session mở cho mọi nhạc công.', en: '' }, lineup: ['House band'],
    });
    assert.equal(r.status, 201);
    assert.equal(r.body.status, 'live');
    assert.equal(r.body.venue.resolved, true);
    assert.equal(r.body.organizer.name, 'Yoko Saigon');
    const audit = await many<any>(env.ctx.db, `select action from audit_log where target_id = $1 order by seq`, [r.body.id]);
    assert.deepEqual(audit.map((a) => a.action), ['listing.created_by_team', 'listing.published_by_team']);
    const note = await one<any>(env.ctx.db, `select title from notifications where organizer_id = $1 order by created_at desc limit 1`, [env.ids.org.yoko]);
    assert.equal(note.title.en, 'Yoko Late Jam Session is live');
  });

  it('lets the team fix a listing in review without sending it back, and re-scores the risk', async () => {
    const id = env.ids.event['underground-techno-w12'];
    const before = await env.as(admin).get(`/admin/events/${id}`);
    assert.equal(before.body.venue.resolved, false);
    assert.equal(before.body.flag.code, 'venue');
    const v = await env.as(admin).post('/admin/venues', { name: 'Warehouse 12', address: '12 Tôn Thất Thuyết, P. 16', area: 'Quận 4', lat: 10.7545, lng: 106.6981 });
    assert.equal(v.status, 201);
    const dupe = await env.as(admin).post('/admin/venues', { name: 'warehouse 12', address: 'x street', area: 'Quận 4', lat: 10.75, lng: 106.69 });
    assert.equal(dupe.body.error.code, 'venue_exists');
    const fixed = await env.as(admin).patch(`/admin/events/${id}`, { venueId: v.body.id, badge: 'just_added' });
    assert.equal(fixed.status, 200);
    assert.equal(fixed.body.status, 'in_review', 'a team edit keeps it in the queue');
    assert.equal(fixed.body.venue.resolved, true);
    assert.equal(fixed.body.badge, 'just_added');
    assert.ok(fixed.body.risk.score < before.body.risk.score);
    assert.notEqual(fixed.body.flag?.code, 'venue');
    assert.equal(fixed.body.history[0].action, 'listing.edited_by_team');
    assert.ok(fixed.body.history[0].diff.some((d: any) => d.field === 'pin'));
    const venues = await env.as(admin).get('/admin/venues');
    assert.ok(!venues.body.unresolved.some((e: any) => e.id === id));
  });

  it('moves a venue’s upcoming listings with it when the venue is corrected', async () => {
    const venue = await one<any>(env.ctx.db, `select id from venues where name = 'Yoko Saigon'`);
    const r = await env.as(admin).patch(`/admin/venues/${venue.id}`, { address: '22A Nguyễn Thị Diệu, P. Võ Thị Sáu' });
    assert.equal(r.status, 200);
    const moved = await one<any>(env.ctx.db, `select address from events where venue_id = $1 and starts_on >= '2026-09-14' limit 1`, [venue.id]);
    assert.equal(moved.address, '22A Nguyễn Thị Diệu, P. Võ Thị Sáu');
  });

  it('takes a listing down, marks one cancelled and restores it', async () => {
    const id = env.ids.event['8wonder'];
    const down = await env.as(admin).post(`/admin/events/${id}/status`, { action: 'take_down', code: 'policy', message: 'Please call us.' });
    assert.equal(down.body.status, 'removed');
    const wrong = await env.as(admin).post(`/admin/events/${id}/status`, { action: 'take_down' });
    assert.equal(wrong.body.error.code, 'wrong_status');
    const back = await env.as(admin).post(`/admin/events/${id}/status`, { action: 'restore' });
    assert.equal(back.body.status, 'live');
    const cancelled = await env.as(admin).post(`/admin/events/${id}/status`, { action: 'cancel' });
    assert.equal(cancelled.body.status, 'cancelled');
    const thread = await one<any>(env.ctx.db, `select count(*)::int as n from inbox_messages m join inbox_threads t on t.id = m.thread_id where t.event_id = $1`, [id]);
    assert.equal(thread.n, 1, 'the take-down message reached the organiser');
  });

  it('onboards an organiser with an owner account that sets its own password', async () => {
    const r = await env.as(admin).post('/admin/organizers', { name: 'Soundwave Collective', type: 'promoter', ownerEmail: 'Hello@Soundwave.vn', ownerName: 'Lan' });
    assert.equal(r.status, 201);
    assert.equal(r.body.ownerCreated, true);
    const detail = await env.as(admin).get(`/admin/organizers/${r.body.id}`);
    assert.equal(detail.body.state, 'pending');
    assert.deepEqual(detail.body.members.map((m: any) => [m.email, m.role, m.hasPassword]), [['hello@soundwave.vn', 'owner', false]]);
    const reset = await env.as().post('/auth/password/reset', { email: 'hello@soundwave.vn' });
    assert.ok(reset.body.challengeId, 'the new owner can start "forgot password"');

    const bad = await env.as(admin).patch(`/admin/organizers/${r.body.id}/profile`, { taxCode: '12' });
    assert.equal(bad.body.error.code, 'invalid_tax_code');
    const ok = await env.as(admin).patch(`/admin/organizers/${r.body.id}/profile`, { legalName: 'Công ty TNHH Soundwave', taxCode: '0312 345 678' });
    assert.equal(ok.status, 200);
    const add = await env.as(admin).post(`/admin/organizers/${r.body.id}/members`, { email: 'crew@soundwave.vn', role: 'manager' });
    assert.equal(add.status, 201);
    const owner = detail.body.members[0].id;
    const last = await env.as(admin).delete(`/admin/organizers/${r.body.id}/members/${owner}`);
    assert.equal(last.body.error.code, 'last_owner');
    const list = await env.as(admin).get('/admin/organizers?q=soundwave');
    assert.deepEqual(list.body.items.map((o: any) => [o.name, o.members, o.taxCode]), [['Soundwave Collective', 2, '0312345678']]);
  });

  it('suspends an organiser, which stops them submitting until reinstated', async () => {
    const orgId = env.ids.org.ravoent;
    const s = await env.as(admin).post(`/admin/organizers/${orgId}/standing`, { suspended: true, note: 'Chargebacks' });
    assert.equal(s.body.suspended, true);
    const draft = await env.as(organizer).post('/organizer/events', { title: 'Ravolution Pool Party' });
    const blocked = await env.as(organizer).post(`/organizer/events/${draft.body.id}/submit`);
    assert.equal(blocked.body.error.code, 'organizer_suspended');
    await env.as(admin).post(`/admin/organizers/${orgId}/standing`, { suspended: false });
    const again = await env.as(organizer).post(`/organizer/events/${draft.body.id}/submit`);
    assert.equal(again.body.error.code, 'not_ready', 'back to the normal checks');
  });

  it('lists what an organiser still has to fill in, and duplicates a listing into a new draft', async () => {
    const list = await env.as(organizer).get('/organizer/events');
    const bus = list.body.items.find((e: any) => e.status === 'draft' && e.title.startsWith('Ravolution Bus'));
    assert.deepEqual(bus.missing, ['price', 'logo', 'eventUrl']);
    assert.equal(bus.genre, 'EDM');
    const ravo = list.body.items.find((e: any) => e.slug === 'ravolution-music-festival' || e.title === 'Ravolution Music Festival');
    const copy = await env.as(organizer).post(`/organizer/events/${ravo.id}/duplicate`);
    assert.equal(copy.status, 201);
    assert.equal(copy.body.status, 'draft');
    assert.equal(copy.body.startsOn, null, 'dates are left for the organiser');
    assert.equal(copy.body.venue.resolved, true);
    const tiers = await one<any>(env.ctx.db, 'select count(*)::int as n, coalesce(sum(sold), 0)::int as sold from ticket_tiers where event_id = $1', [copy.body.id]);
    assert.ok(tiers.n > 0);
    assert.equal(tiers.sold, 0);
  });

  it('finds accounts and changes roles, but never the admin’s own', async () => {
    const found = await env.as(admin).get('/admin/users?q=minh%40example.com');
    assert.equal(found.body.items[0].email, 'minh@example.com');
    const id = found.body.items[0].id;
    const detail = await env.as(admin).get(`/admin/users/${id}`);
    assert.ok(detail.body.counts.saves >= 0);
    const promote = await env.as(admin).patch(`/admin/users/${id}`, { role: 'admin' });
    assert.equal(promote.status, 200);
    const admins = await env.as(admin).get('/admin/users?kind=admin');
    assert.ok(admins.body.items.some((u: any) => u.id === id));
    await env.as(admin).patch(`/admin/users/${id}`, { role: 'user' });
    const me = await env.as(admin).get('/auth/session');
    const self = await env.as(admin).patch(`/admin/users/${me.body.user.id}`, { role: 'user' });
    assert.equal(self.body.error.code, 'own_role');
  });

  it('looks orders up and refunds one, with the reason in the audit log', async () => {
    const paid = await env.as(admin).get('/admin/orders?status=paid&limit=5');
    assert.ok(paid.body.total > 0);
    assert.ok(paid.body.summary.paid.count >= paid.body.items.length);
    const order = paid.body.items[0];
    const byCode = await env.as(admin).get(`/admin/orders?q=${order.code}`);
    assert.equal(byCode.body.items[0].id, order.id);
    const detail = await env.as(admin).get(`/admin/orders/${order.id}`);
    assert.equal(detail.body.refundable, true);
    const r = await env.as(admin).post(`/admin/orders/${order.id}/refund`, { reason: 'Bought the wrong date' });
    assert.equal(r.status, 200);
    const after = await env.as(admin).get(`/admin/orders/${order.id}`);
    assert.equal(after.body.status, 'refunded');
    assert.ok(after.body.tickets.every((t: any) => t.status === 'refunded'));
    const again = await env.as(admin).post(`/admin/orders/${order.id}/refund`);
    assert.equal(again.body.error.code, 'not_paid');
    const audit = await one<any>(env.ctx.db, `select diff from audit_log where action = 'order.refunded' and target_id = $1`, [order.id]);
    assert.ok(audit.diff.some((d: any) => d.f === 'reason' && d.b === 'Bought the wrong date'));
  });

  it('filters the audit log by area and text', async () => {
    const r = await env.as(admin).get('/admin/audit?area=organizer&q=Soundwave');
    assert.ok(r.body.items.length >= 2);
    assert.ok(r.body.items.every((a: any) => a.action.startsWith('organizer.')));
    const chain = await env.as(admin).get('/admin/audit/verify');
    assert.equal(chain.body.ok, true);
  });

  it('only offers verified venues in the public picker', async () => {
    const v = await one<any>(env.ctx.db, `select id from venues where name = 'Bside Cafe'`);
    await env.as(admin).patch(`/admin/venues/${v.id}`, { verified: false });
    const r = await env.as().get('/venues?q=bside');
    assert.equal(r.body.items.length, 0);
  });
});
