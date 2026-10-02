import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';
import { phoneUser } from './people.ts';
import { multipart, png } from './files.ts';
import { cityFrom, EMPTY_PREFILL, prefillFromJsonLd, type Prefill, type PrefillGenerator, type PrefillInput } from '../src/services/prefill.ts';
import { fetchPublicPage, isPrivateAddress, PageUnavailable } from '../src/services/fetchpage.ts';

const TICKETBOX_PAGE = `<html><head><title>TicketBox | Saigon Techno Garden</title>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Event","name":"TicketBox | Saigon Techno Garden Vol. 5",
"startDate":"2026-10-24T13:00:00Z","endDate":"2026-10-24T19:00:00Z","location":{"@type":"Place","name":"The Garden",
"address":{"@type":"PostalAddress","streetAddress":"66 Tô Ngọc Vân, Phường Tây Hồ, Thành phố Hà Nội","addressLocality":"Ho Chi Minh"}},
"offers":[{"@type":"Offer","price":"350000","priceCurrency":"VND"},{"@type":"Offer","price":"250000","priceCurrency":"VND"}],
"performer":[{"@type":"Person","name":"Mya"},{"@type":"Person","name":"Kanji"}],"url":"/saigon-techno-garden-5"}</script></head><body>…</body></html>`;

class FakePrefill implements PrefillGenerator {
  readonly model = 'fake';
  calls: PrefillInput[] = [];
  async extract(input: PrefillInput): Promise<Prefill> {
    this.calls.push(input);
    return { ...EMPTY_PREFILL, title: input.image ? 'Poster Night' : 'Rooftop Sessions', genre: 'EDM', startsOn: '2026-10-31', startTime: '21:00', city: 'da-nang', lineup: ['Hibiya Line'] };
  }
}

describe('reading an event off a page or a poster', () => {
  it('reads schema.org Event data, in Vietnam time, trusting the street address over the city field', () => {
    const p = prefillFromJsonLd(TICKETBOX_PAGE, 'https://ticketbox.vn/saigon-techno-garden-5')!;
    assert.equal(p.title, 'Saigon Techno Garden Vol. 5');
    assert.deepEqual([p.startsOn, p.startTime, p.endTime], ['2026-10-24', '20:00', '02:00']);
    assert.equal(p.city, 'ha-noi');
    assert.deepEqual([p.entryMode, p.priceFrom], ['paid', 250_000]);
    assert.deepEqual(p.lineup, ['Mya', 'Kanji']);
    assert.equal(p.ticketUrl, 'https://ticketbox.vn/saigon-techno-garden-5');
    assert.equal(prefillFromJsonLd('<html><body>no data</body></html>'), null);
  });

  it('knows the four cities however they are written', () => {
    assert.equal(cityFrom('Quận 1, TP. Hồ Chí Minh'), 'ho-chi-minh');
    assert.equal(cityFrom('Phường Hội An, Đà Nẵng'), 'da-nang');
    assert.equal(cityFrom('Trần Phú, Nha Trang, Khánh Hòa'), 'nha-trang');
    assert.equal(cityFrom('Đà Lạt'), null);
  });

  it('never fetches a page on a private network', async () => {
    assert.ok(isPrivateAddress('127.0.0.1') && isPrivateAddress('10.1.2.3') && isPrivateAddress('192.168.1.1') && isPrivateAddress('169.254.169.254') && isPrivateAddress('::1'));
    assert.ok(!isPrivateAddress('104.18.1.1'));
    for (const url of ['http://127.0.0.1/admin', 'http://localhost:4000/', 'http://[::1]/', 'http://169.254.169.254/latest/meta-data']) {
      await assert.rejects(fetchPublicPage(url), (e: unknown) => e instanceof PageUnavailable && (e.reason === 'private_address' || e.reason === 'bad_url'), url);
    }
    await assert.rejects(fetchPublicPage('ftp://example.com/x'), (e: unknown) => e instanceof PageUnavailable && e.reason === 'bad_url');
  });
});

describe('sending events in and taking them over', () => {
  let env: TestEnv;
  let minh: string;
  let organizer: string;
  let admin: string;
  const prefill = new FakePrefill();
  const pages: Record<string, string> = {
    'https://ticketbox.vn/saigon-techno-garden-5': TICKETBOX_PAGE,
    'https://instagram.com/p/rooftop': '<html><head><meta property="og:description" content="Rooftop Sessions · 31/10 · 21:00 · Đà Nẵng"></head><body>Line-up: Hibiya Line</body></html>',
  };
  before(async () => {
    env = await setup({
      prefill,
      fetchPage: async (url) => { if (!pages[url]) throw new PageUnavailable('upstream'); return { url, html: pages[url] }; },
    });
    [minh, organizer, admin] = await Promise.all([env.attendee(), env.organizer(), env.admin()]);
  });
  after(async () => { await env.close(); });

  it('fills the submission form from a ticket page for free, and from other pages with AI', async () => {
    const structured = await env.as(minh).post('/community/prefill', { url: 'https://ticketbox.vn/saigon-techno-garden-5' });
    assert.equal(structured.status, 200);
    assert.equal(structured.body.source, 'structured');
    assert.equal(structured.body.fields.city, 'ha-noi');
    assert.equal(prefill.calls.length, 0, 'no model call for a page that says it all');

    const ai = await env.as(minh).post('/community/prefill', { url: 'https://instagram.com/p/rooftop' });
    assert.equal(ai.body.source, 'ai');
    assert.equal(ai.body.fields.title, 'Rooftop Sessions');
    assert.match(prefill.calls[0].text!, /Rooftop Sessions · 31\/10/);
    assert.equal(prefill.calls[0].today, '2026-09-14');

    const missing = await env.as(minh).post('/community/prefill', { url: 'https://example.com/gone' });
    assert.equal(missing.body.error.code, 'page_unreachable');
  });

  it('reads a poster photo, within an hourly allowance', async () => {
    const mp = multipart(png(1080, 1350));
    const res = await env.app.inject({ method: 'POST', url: '/community/prefill/poster', payload: mp.payload, headers: { 'content-type': mp.type, authorization: `Bearer ${minh}` } });
    assert.equal(res.statusCode, 200, res.body);
    assert.equal(res.json().fields.title, 'Poster Night');
    assert.equal(prefill.calls.at(-1)!.image!.mime, 'image/png');
    for (let i = 0; i < 8; i++) {
      await env.app.inject({ method: 'POST', url: '/community/prefill/poster', payload: mp.payload, headers: { 'content-type': mp.type, authorization: `Bearer ${minh}` } });
    }
    const over = await env.app.inject({ method: 'POST', url: '/community/prefill/poster', payload: mp.payload, headers: { 'content-type': mp.type, authorization: `Bearer ${minh}` } });
    assert.equal(over.statusCode, 429);
    assert.equal(over.json().error.code, 'prefill_limit');
  });

  it('moves a community event to the organiser who claims it, once a moderator agrees', async () => {
    const scout = await phoneUser(env, '0915 000 111');
    const sent = await env.as(scout).post('/community/events', {
      title: 'Saigon Techno Garden Vol. 4', genre: 'EDM', startsOn: '2026-10-10', startTime: '20:00', endTime: '02:00', venueName: 'The Garden', city: 'ho-chi-minh',
      entryMode: 'paid', priceFrom: 250_000, sourceUrl: 'https://instagram.com/p/techno-garden',
    });
    await env.as(admin).post('/admin/listings/approve', { ids: [sent.body.id] });
    const page = await env.as(organizer).get(`/events/${sent.body.slug}`);
    assert.deepEqual(page.body.mine.claim, { organiser: true, canClaim: true, pending: false });
    assert.equal(page.body.community.claimable, true);
    assert.equal((await env.as(minh).get(`/events/${sent.body.slug}`)).body.mine.claim.canClaim, false, 'not an organiser');
    assert.equal((await env.as(organizer).post(`/events/${env.ids.event.ravo}/claims`, { note: 'We organise this one, really.' })).body.error.code, 'not_claimable');

    const claim = await env.as(organizer).post(`/events/${sent.body.id}/claims`, { note: 'Ravolution Entertainment runs this series.', proofUrl: 'https://ravolution.vn/garden' });
    assert.equal(claim.status, 201);
    assert.equal((await env.as(organizer).get(`/events/${sent.body.slug}`)).body.mine.claim.pending, true);
    const queue = await env.as(admin).get('/admin/claims');
    assert.equal((await env.as(admin).get('/admin/counts')).body.claims, 1);
    assert.equal(queue.body.items[0].organizer.name, 'Ravolution Entertainment');
    const ok = await env.as(admin).post(`/admin/claims/${claim.body.id}/approve`);
    assert.equal(ok.status, 200);
    const now = await env.as().get(`/events/${sent.body.slug}`);
    assert.equal(now.body.organizer.name, 'Ravolution Entertainment');
    assert.equal(now.body.community.submittedBy.name, null, 'the sender keeps the credit');
    assert.equal(now.body.community.claimable, false);
    const scoutBell = await env.as(scout).get('/me/notifications');
    assert.ok(scoutBell.body.items.some((n: any) => n.kind === 'submission_claimed'));
    const mine = await env.as(organizer).get('/organizer/events');
    assert.ok(JSON.stringify(mine.body).includes('Saigon Techno Garden Vol. 4'), 'it is on the organiser’s list');
  });
});
