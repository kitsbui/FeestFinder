import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';
import { many, one } from '../src/db/index.ts';

describe('internal admin', () => {
  let env: TestEnv;
  let admin: string;
  before(async () => {
    env = await setup();
    admin = await env.admin();
  });
  after(async () => { await env.close(); });

  it('is admin-only', async () => {
    const organizer = await env.organizer();
    const r = await env.as(organizer).get('/admin/queue');
    assert.equal(r.status, 403);
    assert.equal(r.body.error.code, 'admin_only');
  });

  it('shows the moderation queue with SLA, risk, saved views and age buckets', async () => {
    const q = await env.as(admin).get('/admin/queue');
    assert.equal(q.body.items.length, 5);
    assert.deepEqual(q.body.items.map((i: any) => i.slug).slice(0, 2), ['edm-beach-bus', 'underground-techno-w12'], 'oldest first');
    const bus = q.body.items[0];
    assert.equal(bus.sla.state, 'breach');
    assert.equal(bus.sla.label.en, 'past SLA · 5h 18m');
    assert.equal(bus.flag.code, 'ticket');
    assert.equal(q.body.counts.breach, 1);
    assert.equal(q.body.counts.new, 1);
    assert.deepEqual(q.body.ageBuckets.map((b: any) => b.count), [0, 1, 3, 1]);
    assert.equal(q.body.oldestLabel.en, 'Oldest 5h 18m');

    // First listing (+30), no map pin (+26), payout account 2 days old (+14), no capacity (+6).
    const risky = await env.as(admin).get('/admin/queue?sort=risk');
    assert.deepEqual(risky.body.items.slice(0, 2).map((i: any) => [i.slug, i.riskScore]), [['underground-techno-w12', 76], ['edm-beach-bus', 70]]);
    const fresh = await env.as(admin).get('/admin/queue?filter=new');
    assert.deepEqual(fresh.body.items.map((i: any) => i.slug), ['underground-techno-w12']);

    const risk = await env.as(admin).get(`/admin/listings/${env.ids.event['underground-techno-w12']}/risk`);
    assert.equal(risk.body.band, 'high');
    assert.equal(risk.body.factors[0].label.en, 'First listing from this account');
    assert.equal(risk.body.factors[0].weight, 30);
  });

  it('rejects with a reason code; policy breaches never allow an appeal', async () => {
    const policy = await env.as(admin).post('/admin/listings/reject', { ids: [env.ids.event['neon-rooftop-session']], code: 'policy', allowAppeal: true });
    assert.equal(policy.status, 200);
    assert.equal(policy.body.appealAllowed, false);
    const appeals = await many<any>(env.ctx.db, 'select * from appeals where event_id = $1', [env.ids.event['neon-rooftop-session']]);
    assert.equal(appeals.length, 0);
    const again = await env.as(admin).post('/admin/listings/reject', { ids: [env.ids.event['neon-rooftop-session']], code: 'venue' });
    assert.equal(again.body.error.code, 'nothing_to_reject');
  });

  it('runs the full appeal loop: reject, organiser replies, admin overturns, followers hear about it', async () => {
    const organizer = await env.organizer();
    const eventId = env.ids.event['ravo-after-hours'];
    const reject = await env.as(admin).post('/admin/listings/reject', { ids: [eventId], code: 'venue' });
    assert.equal(reject.body.message.en, 'Rejected · Venue unverifiable');

    const inbox = await env.as(organizer).get('/organizer/inbox');
    const thread = inbox.body.items.find((t: any) => t.about?.eventId === eventId);
    const msgs = await env.as(organizer).get(`/organizer/inbox/${thread.id}`);
    assert.match(msgs.body.messages.at(-1).body.en, /^Venue unverifiable \(venue\)\. We could not place this address/);
    const bell = await env.as(organizer).get('/organizer/notifications');
    assert.equal(bell.body.items[0].title.en, 'Listing sent back');

    const draft = await env.as(organizer).get(`/organizer/events/${eventId}`);
    assert.equal(draft.body.moderation.decision, 'rejected');
    assert.equal(draft.body.moderation.appeal.state, 'open');
    const reply = await env.as(organizer).post(`/organizer/events/${eventId}/appeal`, { reply: 'The venue is the old Tân Thuận warehouse; landmark: opposite the Khánh Hội bridge.' });
    assert.equal(reply.status, 200);
    assert.equal((await env.as(organizer).post(`/organizer/events/${eventId}/appeal`, { reply: 'One more thing to add here.' })).body.error.code, 'appeal_not_open');

    const list = await env.as(admin).get('/admin/appeals');
    const appeal = list.body.items.find((a: any) => a.eventId === eventId);
    assert.equal(appeal.state, 'replied');
    assert.equal(appeal.closesInDays, 7);

    const attendee = await env.attendee();
    await env.as(attendee).put(`/me/follows/artists/${encodeURIComponent('Triple D')}`);
    const overturn = await env.as(admin).post(`/admin/appeals/${appeal.id}/overturn`);
    assert.equal(overturn.status, 200);
    const live = await env.as().get(`/events/${eventId}`);
    assert.equal(live.status, 200);
    const notes = await env.as(attendee).get('/me/notifications');
    assert.equal(notes.body.items[0].title.en, 'Triple D announced a show in Ho Chi Minh City', 'artist followers are told first');
    const orgNote = await one<any>(env.ctx.db, `select count(*)::int as n from notifications where kind = 'organizer_listing'`);
    assert.ok(orgNote.n === 0, 'someone already told about the artist is not told twice');
  });

  it('bulk-approves the selection', async () => {
    const ids = [env.ids.event['acoustic-sunset-bside'], env.ids.event['underground-techno-w12']];
    const r = await env.as(admin).post('/admin/listings/approve', { ids });
    assert.deepEqual(r.body.approved.sort(), ids.sort());
    assert.equal(r.body.message.en, '2 listings approved');
    const audit = await env.as(admin).get('/admin/audit?actor=admin&limit=5');
    assert.equal(audit.body.items[0].label.en, 'Approved listing (bulk)');
    assert.deepEqual(audit.body.items[0].diff[0], { field: 'status', before: 'in_review', after: 'live' });
  });

  it('messages an organiser from the queue, and it lands in their inbox', async () => {
    const eventId = env.ids.event['edm-beach-bus'];
    const thread = await env.as(admin).get(`/admin/listings/${eventId}/thread`);
    assert.equal(thread.body.quickAsks.length, 4);
    const sent = await env.as(admin).post(`/admin/listings/${eventId}/thread`, { body: thread.body.quickAsks[0].text.en });
    assert.equal(sent.status, 201);
    const row = await one<any>(env.ctx.db, 'select organizer_unread from inbox_threads where id = $1', [sent.body.threadId]);
    assert.equal(row.organizer_unread, true);
  });

  it('handles user reports: dismiss, warn and take down', async () => {
    const reports = await env.as(admin).get('/admin/reports');
    const bus = reports.body.items.find((r: any) => r.subject === 'EDM Beach Bus — Mũi Né');
    assert.equal(bus.category, 'refund');
    assert.ok(bus.count >= 2);
    assert.equal(bus.heldFromFeed, true);

    const rave = env.ids.event['warehouse-rave-q4'];
    const dismissed = await env.as(admin).post(`/admin/reports/${rave}/dismiss`, { category: 'wrong' });
    assert.equal(dismissed.body.stillOpen, 2, 'safety reports remain');
    const warned = await env.as(admin).post(`/admin/reports/${rave}/warn`, { category: 'safety' });
    assert.equal(warned.body.strikes, 1);
    const ev = await one<any>(env.ctx.db, 'select held_for_reports from events where id = $1', [rave]);
    assert.equal(ev.held_for_reports, false, 'back in the feed once nothing is open');

    const down = await env.as(admin).post(`/admin/reports/${env.ids.event['edm-beach-bus-mui-ne']}/take-down`, { code: 'policy' });
    assert.equal(down.status, 200);
    assert.equal((await env.as().get(`/events/${env.ids.event['edm-beach-bus-mui-ne']}`)).status, 404);
  });

  it('verifies organisers and needs an ID document first', async () => {
    const tripside = env.ids.org.tripside;
    const refused = await env.as(admin).patch(`/admin/organizers/${tripside}`, { state: 'verified' });
    assert.equal(refused.body.error.code, 'documents_missing');
    const ok = await env.as(admin).patch(`/admin/organizers/${tripside}`, { state: 'verified', docs: { id: true } });
    assert.equal(ok.body.message.en, 'Tripside Travel verified');
    const card = await env.as().get('/organizers/tripside');
    assert.equal(card.body.verified, true);
  });

  it('schedules featured shelves and previews them', async () => {
    const shelves = await env.as(admin).get('/admin/shelves');
    const quiet = shelves.body.items.find((s: any) => s.slug === 'quiet-nights');
    assert.equal(quiet.phaseLabel.en, 'Scheduled 01/10');
    const moved = await env.as(admin).patch(`/admin/shelves/${quiet.id}`, { startsOn: '2026-09-10', endsOn: '2026-09-22' });
    assert.equal(moved.body.phaseLabel.en, 'Live · ends 22/09');
    const pub = await env.as().get('/shelves');
    assert.ok(pub.body.items.some((s: any) => s.slug === 'quiet-nights'));
    const bad = await env.as(admin).patch(`/admin/shelves/${quiet.id}`, { startsOn: '2026-09-30', endsOn: '2026-09-01' });
    assert.equal(bad.body.error.code, 'window_order');
    const items = await env.as(admin).put(`/admin/shelves/${quiet.id}/items`, { eventIds: [env.ids.event.blues, env.ids.event['yoko-sinco']] });
    assert.deepEqual(items.body.items.map((i: any) => i.slug), ['blues', 'yoko-sinco']);
    const preview = await env.as(admin).get(`/admin/shelves/${quiet.id}/preview`);
    assert.equal(preview.body.items[0].tag.en, 'Featured');
    assert.equal(preview.body.window.en, 'Shows 10/09 → 22/09');
  });

  it('turns an advertiser enquiry into a campaign', async () => {
    const ads = await env.as(admin).get('/admin/ads');
    const medik = ads.body.inquiries.find((i: any) => i.brand === 'Medik Rapid Care');
    const created = await env.as(admin).post(`/admin/ads/inquiries/${medik.id}/approve`, { genres: ['EDM'], budgetTotal: 30_000_000 });
    assert.equal(created.status, 201);
    assert.equal(created.body.placement, 'live');
    const paused = await env.as(admin).patch(`/admin/ads/campaigns/${created.body.id}`, { active: false });
    assert.equal(paused.body.active, false);
    const rates = await env.as(admin).put('/admin/ads/rates', { feed: 200000, banner: 240000, live: 520000 });
    assert.equal(rates.body.rates.feed, 200000);
  });

  it('shows platform insights', async () => {
    const r = await env.as(admin).get('/admin/insights');
    assert.equal(r.body.health.length, 4);
    assert.ok(r.body.users.accounts > 100);
    assert.ok(r.body.organizers.some((o: any) => o.name === 'Ravolution Entertainment' && o.gmv > 0));
    const counts = await env.as(admin).get('/admin/counts');
    assert.ok(counts.body.queue >= 1);
  });

  it('impersonates read-only and blocks the admin’s own writes until it ends', async () => {
    const options = await env.as(admin).get('/admin/impersonation/options');
    const ravo = options.body.items.find((o: any) => o.name === 'Ravolution Entertainment');
    const start = await env.as(admin).post('/admin/impersonation', { targetType: 'organizer', targetId: ravo.id });
    assert.equal(start.status, 200);
    assert.equal(start.body.banner.label.en, 'Viewing as Ravolution Entertainment');

    const viewAs = start.body.token;
    const read = await env.as(viewAs).get('/organizer/events');
    assert.equal(read.status, 200);
    const write = await env.as(viewAs).post(`/organizer/events/${env.ids.event.ravo}/promos`, { code: 'SNEAKY', pct: 100 });
    assert.equal(write.status, 403);
    assert.equal(write.body.error.code, 'read_only_session');
    assert.equal((await env.as(viewAs).get('/admin/queue')).status, 403, 'an impersonated session is never admin');

    const blocked = await env.as(admin).post('/admin/listings/approve', { ids: [env.ids.event['edm-beach-bus']] });
    assert.equal(blocked.body.error.code, 'read_only_session');

    const end = await env.as(admin).delete('/admin/impersonation');
    assert.equal(end.status, 200);
    assert.equal((await env.as(viewAs).get('/organizer/events')).status, 401);
    const audit = await env.as(admin).get('/admin/audit?limit=2');
    assert.deepEqual(audit.body.items.map((a: any) => a.action), ['impersonation.ended', 'impersonation.started']);
  });

  it('keeps a tamper-evident audit log', async () => {
    const verify = await env.as(admin).get('/admin/audit/verify');
    assert.equal(verify.body.ok, true);
    assert.ok(verify.body.entries > 10);
    await assert.rejects(env.ctx.db.query(`update audit_log set target_label = 'edited' where seq = 1`), /append-only/);
    await assert.rejects(env.ctx.db.query(`delete from audit_log where seq = 1`), /append-only/);
    const system = await env.as(admin).get('/admin/audit?actor=system');
    assert.ok(system.body.items.every((a: any) => a.actorType === 'system'));
    const csv = await env.as(admin).get('/admin/audit.csv');
    assert.match(csv.body, /^﻿seq,at,actor_type/);
  });
});
