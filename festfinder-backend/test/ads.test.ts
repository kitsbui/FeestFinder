import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';
import { many, one } from '../src/db/index.ts';
import { formatMoney } from '../src/lib/money.ts';

/*
 * Advertising: an organiser asks to promote an event they posted (placements, budget, dates),
 * and a brand books an ad with its details; the team answers both in the Console.
 */

describe('advertising', () => {
  let env: TestEnv;
  let organizer: string;
  let minh: string;
  let admin: string;
  let adminId: string;
  let ravo: string;
  before(async () => {
    env = await setup();
    organizer = await env.organizer();
    minh = await env.attendee();
    admin = await env.admin();
    adminId = (await one<{ id: string }>(env.ctx.db, `select id from users where role = 'admin' limit 1`))!.id;
    ravo = (await one<{ id: string }>(env.ctx.db, `select id from events where slug = 'ravo'`))!.id;
  });
  after(async () => { await env.close(); });

  const ask = (body: Record<string, unknown>, token = organizer) =>
    env.as(token).post('/organizer/ads', { eventId: ravo, placements: ['featured', 'banner'], budget: 5_000_000, startsOn: '2026-09-15', endsOn: '2026-09-18', ...body });

  it('an organiser asks to promote a posted event: placements, budget and dates are checked', async () => {
    const form = await env.as(organizer).get('/organizer/ads');
    assert.equal(form.status, 200, JSON.stringify(form.body));
    assert.ok(form.body.events.some((e: any) => e.id === ravo), 'a live event can be promoted');
    assert.deepEqual(form.body.placements.map((p: any) => p.key), ['featured', 'banner', 'social']);
    assert.equal(form.body.currency, 'VND');

    assert.equal((await ask({ budget: 100_000 })).body.error.code, 'invalid_input', 'under the smallest budget');
    assert.equal((await ask({ placements: [] })).body.error.code, 'invalid_input');
    assert.equal((await ask({ startsOn: '2026-09-17', endsOn: '2026-09-16' })).body.error.code, 'dates_order');
    assert.equal((await ask({ startsOn: '2026-09-01' })).body.error.code, 'starts_in_past');
    assert.equal((await ask({ endsOn: '2026-10-30' })).body.error.code, 'after_event', 'not past the event’s last day');
    const draft = await env.as(organizer).post('/organizer/events', { title: 'Not posted yet' });
    assert.equal((await ask({ eventId: draft.body.id })).body.error.code, 'not_posted');
    assert.equal((await ask({}, minh)).body.error.code, 'not_an_organizer');

    const sent = await ask({ message: 'Muốn chạy tuần cuối trước show' });
    assert.equal(sent.status, 201, JSON.stringify(sent.body));
    assert.equal(sent.body.status, 'open');
    assert.equal(sent.body.budget, 5_000_000);
    assert.deepEqual(sent.body.placements.map((p: any) => p.key), ['featured', 'banner']);
    assert.equal((await ask({})).body.error.code, 'ad_request_open', 'one waiting request per event');
    const told = await many<{ title: any }>(env.ctx.db, `select title from notifications where user_id = $1 and kind = 'ad_request'`, [adminId]);
    assert.equal(told.length, 1);
    assert.equal(told[0].title.vi, 'Yêu cầu quảng cáo: Ravolution Music Festival');

    // Withdrawn, it can be asked again.
    assert.equal((await env.as(organizer).delete(`/organizer/ads/${sent.body.id}`)).status, 200);
    assert.equal((await ask({})).status, 201);
  });

  it('the team approves with a reply; the Explore banner runs from the event, within its dates', async () => {
    assert.equal((await env.as(organizer).get('/admin/boosts')).status, 403);
    const queue = await env.as(admin).get('/admin/boosts');
    const req = queue.body.items.find((x: any) => x.event.id === ravo && x.status === 'open');
    assert.equal(req.budget, 5_000_000);
    assert.equal(req.organizer, 'Ravolution Entertainment');

    const yes = await env.as(admin).post(`/admin/boosts/${req.id}`, { status: 'approved', reply: 'Banner chạy 15–18/9, kệ Nổi bật từ 16/9.' });
    assert.equal(yes.status, 200, JSON.stringify(yes.body));
    assert.ok(yes.body.campaignId);
    const c = await one<any>(env.ctx.db, 'select * from ad_campaigns where id = $1', [yes.body.campaignId]);
    assert.equal(c.category, 'Event');
    assert.equal(c.url, '/e/ravo');
    assert.equal(c.placement, 'banner');
    assert.equal(Number(c.budget_total), 5_000_000);
    assert.equal(String(c.starts_on).slice(0, 10) <= '2026-09-15', true);

    const mine = await env.as(organizer).get('/organizer/ads');
    const answered = mine.body.items.find((x: any) => x.id === req.id);
    assert.equal(answered.status, 'approved');
    assert.equal(answered.reply, 'Banner chạy 15–18/9, kệ Nổi bật từ 16/9.');

    // Inside its dates it shows on Explore; after them it does not.
    env.clock.set('2026-09-16T10:00:00+07:00');
    const shown = await env.as().get('/ads?placement=banner');
    assert.ok(shown.body.ad, 'an ad is shown');
    const event = await many<any>(env.ctx.db, `select id from ad_campaigns where event_id = $1`, [ravo]);
    assert.equal(event.length, 1);
    env.clock.set('2026-09-25T10:00:00+07:00');
    for (let i = 0; i < 5; i++) assert.notEqual((await env.as().get('/ads?placement=banner')).body.ad?.id, yes.body.campaignId, 'not after its last day');
    env.clock.set('2026-09-14T10:00:00+07:00');
  });

  // A brand's enquiry as the form sends it; the tests below change only what they need.
  const base = {
    brand: 'Mây Kombucha', category: 'F&B', logoUrl: 'https://cdn.zenkai.test/logo.png', website: 'https://zenkai.test',
    links: { instagram: 'https://instagram.com/zenkai' }, description: 'Nước tăng lực không đường cho người đi rave.',
    productImages: ['https://cdn.zenkai.test/can.jpg', 'https://cdn.zenkai.test/pack.jpg'],
    contactName: 'Lan Trần', email: 'lan@zenkai.test', phone: '0903 118 224', budgetAmount: 80_000_000,
    startsOn: '2026-10-01', endsOn: '2026-10-31', placements: ['banner', 'feed'], cities: ['ho-chi-minh', 'ha-noi'],
  };

  it('a brand books an ad with its details; pictures are checked links; admins are told', async () => {
    env.clock.set('2026-09-14T10:00:00+07:00');
    assert.equal((await env.as().post('/ad-inquiries', base)).status, 401);
    assert.equal((await env.as(minh).post('/ad-inquiries', { ...base, website: null, links: {} })).body.error.code, 'link_required');
    assert.equal((await env.as(minh).post('/ad-inquiries', { ...base, logoUrl: 'https://cdn.zenkai.test/broken.png' })).body.error.code, 'image_unreachable');
    assert.equal((await env.as(minh).post('/ad-inquiries', { ...base, category: 'Weapons' })).body.error.code, 'invalid_input');
    assert.equal((await env.as(minh).post('/ad-inquiries', { ...base, startsOn: '2026-11-02' })).body.error.code, 'dates_order');
    const sent = await env.as(minh).post('/ad-inquiries', base);
    assert.equal(sent.status, 201, JSON.stringify(sent.body));
    assert.match(sent.body.reference, /^FF-AD-[0-9A-F]{8}$/);
    assert.equal(sent.body.reference, `FF-AD-${sent.body.id.slice(0, 8).toUpperCase()}`);
    assert.equal(sent.body.dueOn, '2026-09-16', 'two working days after a Monday');
    const confirm = await many<any>(env.ctx.db, `select address, payload from outbox where template = 'ad_inquiry_received'`);
    assert.equal(confirm.length, 1, 'the contact gets one confirmation');
    assert.equal(confirm[0].address, 'lan@zenkai.test');
    assert.equal(confirm[0].payload.lang, 'vi');
    assert.ok(confirm[0].payload.body.en.includes(sent.body.reference), 'the English text names the reference');
    assert.ok(confirm[0].payload.body.vi.includes(sent.body.reference), 'the Vietnamese text names it too');
    assert.ok(confirm[0].payload.body.vi.includes(formatMoney(80_000_000, 'VND', 'vi')), 'the budget, formatted');
    const told = await many(env.ctx.db, `select 1 from notifications where user_id = $1 and kind = 'ad_inquiry'`, [adminId]);
    assert.equal(told.length, 1);

    const opts = await env.as().get('/ad-inquiries/options');
    assert.ok(opts.body.categories.some((c: any) => c.key === 'Healthcare'));
    const mine = await env.as(minh).get('/me/ad-inquiries');
    assert.equal(mine.body.items[0].status, 'new');
    assert.equal(mine.body.items[0].budgetAmount, 80_000_000);
  });

  it('approved, the brand’s details become the campaign, and the brand hears the team’s reply', async () => {
    const ads = await env.as(admin).get('/admin/ads');
    const inq = ads.body.inquiries.find((x: any) => x.brand === 'Mây Kombucha');
    assert.equal(inq.logoUrl, 'https://cdn.zenkai.test/logo.png');
    assert.equal(inq.productImages.length, 2);
    assert.equal(inq.contactName, 'Lan Trần');
    assert.deepEqual(inq.cities.map((c: any) => c.slug), ['ho-chi-minh', 'ha-noi']);

    const made = await env.as(admin).post(`/admin/ads/inquiries/${inq.id}/approve`, { reply: 'Hẹn gọi chị Lan thứ Hai để chốt banner.' });
    assert.equal(made.status, 201, JSON.stringify(made.body));
    assert.equal(made.body.logoUrl, 'https://cdn.zenkai.test/logo.png');
    assert.equal(made.body.images.length, 2);
    assert.equal(made.body.startsOn, '2026-10-01');
    assert.equal(made.body.budgetTotal, 80_000_000);
    assert.equal(made.body.dailyCap, 2_580_646, 'the budget spread over its 31 days, rounded up');
    assert.equal(made.body.remaining, 80_000_000);
    assert.deepEqual(made.body.cities, ['ho-chi-minh', 'ha-noi']);
    const c = await one<any>(env.ctx.db, 'select url, category from ad_campaigns where id = $1', [made.body.id]);
    assert.equal(c.url, 'https://zenkai.test');
    const back = await env.as(minh).get('/me/ad-inquiries');
    const item = back.body.items.find((x: any) => x.brand === 'Mây Kombucha');
    assert.equal(item.status, 'approved');
    assert.equal(item.reply, 'Hẹn gọi chị Lan thứ Hai để chốt banner.');
    assert.equal(item.campaign.budgetTotal, 80_000_000);
    assert.equal(item.campaign.remaining, 80_000_000);
    const mailed = await many<{ address: string }>(env.ctx.db, `select address from outbox where template = 'ad_inquiry' and channel = 'email'`);
    assert.ok(mailed.some((r) => r.address === 'minh@example.com'), 'the account hears it by email');
    assert.ok(mailed.some((r) => r.address === 'lan@zenkai.test'), 'and the contact address the form gave');

    // Not before its first day.
    assert.notEqual((await env.as().get('/ads?placement=banner')).body.ad?.id, made.body.id);
  });

  it('declined, the brand hears the team’s reply at the contact address', async () => {
    env.clock.set('2026-09-14T10:00:00+07:00');
    const sent = await env.as(minh).post('/ad-inquiries', { ...base, brand: 'Sóng Tết', contactName: 'Song Vy', email: 'pr@song.test' });
    assert.equal(sent.status, 201, JSON.stringify(sent.body));
    const no = await env.as(admin).post(`/admin/ads/inquiries/${sent.body.id}/decline`, { reply: 'Lịch banner tháng 10 đã kín.' });
    assert.equal(no.status, 200, JSON.stringify(no.body));
    const row = await one<any>(env.ctx.db, 'select status, reply from ad_inquiries where id = $1', [sent.body.id]);
    assert.equal(row.status, 'declined');
    assert.equal(row.reply, 'Lịch banner tháng 10 đã kín.');
    const mailed = await many<any>(env.ctx.db, `select 1 from outbox where template = 'ad_inquiry' and address = 'pr@song.test'`);
    assert.equal(mailed.length, 1);
    const back = await env.as(minh).get('/me/ad-inquiries');
    assert.equal(back.body.items.find((x: any) => x.id === sent.body.id).status, 'declined');
  });

  it('a campaign that has spent its budget is no longer counted or served', async () => {
    env.clock.set('2026-10-05T10:00:00+07:00');
    const camp = (await one<{ id: string; impressions: string }>(env.ctx.db,
      `select c.id, c.impressions from ad_campaigns c join ad_inquiries r on r.id = c.inquiry_id where r.brand = 'Mây Kombucha'`))!;
    const before = Number(camp.impressions);
    assert.equal((await env.as().post(`/ads/${camp.id}/impression`)).status, 202);
    assert.equal(Number((await one<any>(env.ctx.db, 'select impressions from ad_campaigns where id = $1', [camp.id])).impressions), before + 1);

    await env.ctx.db.query('update ad_campaigns set spend = budget_total where id = $1', [camp.id]);
    assert.equal((await env.as().post(`/ads/${camp.id}/impression`)).status, 202);
    assert.equal(Number((await one<any>(env.ctx.db, 'select impressions from ad_campaigns where id = $1', [camp.id])).impressions), before + 1, 'spent: no more impressions');
    for (let i = 0; i < 10; i++) assert.notEqual((await env.as().get('/ads?placement=banner')).body.ad?.id, camp.id, 'spent: not served');

    const back = await env.as(minh).get('/me/ad-inquiries');
    assert.equal(back.body.items.find((x: any) => x.brand === 'Mây Kombucha').campaign.remaining, 0);
    env.clock.set('2026-09-14T10:00:00+07:00');
  });
});
