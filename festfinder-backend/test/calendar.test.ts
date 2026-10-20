import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { setup, type TestEnv } from './helpers.ts';
import { PageUnavailable } from '../src/services/fetchpage.ts';
import { parseIcs } from '../src/services/ingest/adapters/ics.ts';
import { adapterFor } from '../src/routes/organizer/calendar.ts';
import type { IngestIO } from '../src/services/ingest/types.ts';

/* An organiser's own calendar as a source, and their calendar on their own website (growth plan card 1). */

const ICS = readFileSync(new URL('./fixtures/ingest/organizer-hcmc.ics', import.meta.url), 'utf8');
const pages: Record<string, string> = { 'https://ravolution.example/calendar.ics': ICS, 'https://ravolution.example/empty.ics': 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR\r\n' };

describe('organiser calendars and the embed', () => {
  let env: TestEnv;
  let org: string;
  let slug = '';
  before(async () => {
    env = await setup({
      ingestIO: () => ({
        now: env.clock.now(), secrets: {},
        fetchText: async (url: string) => {
          if (url.startsWith('https://blocked.example/')) throw new PageUnavailable('upstream', 'robots.txt disallows /calendar');
          if (!(url in pages)) throw new PageUnavailable('upstream', 'status 404');
          return { status: 200, url, text: pages[url], etag: null, lastModified: null };
        },
        fetchPage: async (url: string) => { throw new PageUnavailable('upstream', `status 404 ${url}`); },
      } as IngestIO),
    });
    org = await env.organizer();
    slug = (await env.ctx.db.query<{ slug: string }>('select slug from organizers where id = $1', [env.ids.org.ravoent])).rows[0].slug;
  });
  after(async () => { await env.close(); });

  it('tells an ICS address from a page', () => {
    assert.equal(adapterFor('https://calendar.google.com/calendar/ical/x%40group/public/basic.ics'), 'ics');
    assert.equal(adapterFor('https://club.example/feed?format=ics'), 'ics');
    assert.equal(adapterFor('https://club.example/events'), 'website');
  });

  it('serves an organiser’s live upcoming nights to any site, with labels, and as a calendar', async () => {
    const r = await env.as().get(`/embed/organizers/${slug}?limit=3`);
    assert.equal(r.status, 200);
    assert.equal(r.headers['access-control-allow-origin'], '*');
    assert.ok(r.body.events.length >= 1 && r.body.events.length <= 3);
    const ravo = r.body.events.find((e: { slug: string }) => e.slug === 'ravo');
    assert.ok(ravo, JSON.stringify(r.body.events.map((e: { slug: string }) => e.slug)));
    assert.equal(ravo.dateLabel, 'T7 19/09');
    assert.equal(ravo.timeLabel, '16:00');
    assert.equal(ravo.price, 'từ 1.200.000₫');
    assert.match(ravo.url, /\/e\/ravo\?src=widget$/);
    assert.equal(r.body.all.label, 'Xem tất cả trên FeestFinder');
    assert.equal(JSON.stringify(r.body).includes('@'), false, 'nothing of anyone');
    assert.equal((await env.as().get('/embed/organizers/nobody-here')).status, 404);
    const cal = await env.as().get(`/embed/organizers/${slug}.ics`);
    assert.match(String(cal.headers['content-type']), /^text\/calendar/);
    const back = parseIcs(String(cal.body));
    assert.ok(back.some((e) => /Ravolution Music Festival/.test(e.summary ?? '')));
    assert.match(String(cal.body), /DTSTART;TZID=Asia\/Ho_Chi_Minh:20260919T160000/);
  });

  it('connects a calendar: its nights come in as the organiser’s, posted, waiting for review', async () => {
    assert.equal((await env.as(org).post('/organizer/calendar', { url: 'http://ravolution.example/calendar.ics' })).body.error.code, 'https_only');
    assert.equal((await env.as(org).post('/organizer/calendar', { url: 'https://ravolution.example/empty.ics' })).body.error.code, 'no_events');
    assert.equal((await env.as(org).post('/organizer/calendar', { url: 'https://blocked.example/calendar.ics' })).body.error.code, 'robots');
    assert.equal((await env.as(org).get('/organizer/calendar')).body.calendar, null, 'a failed connect leaves nothing behind');
    const r = await env.as(org).post('/organizer/calendar', { url: 'webcal://ravolution.example/calendar.ics' });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    assert.equal(r.body.created, 3);
    assert.equal(r.body.calendar.inReview, 3);
    const rows = (await env.ctx.db.query<{ title: string; organizer_id: string; status: string; origin: string; event_type: string | null }>(
      `select e.title, e.organizer_id, e.status, e.origin, e.event_type from events e join event_sources s on s.event_id = e.id
        join ingest_sources i on i.id = s.ingest_source_id where i.organizer_id = $1 order by e.starts_on`, [env.ids.org.ravoent])).rows;
    assert.equal(rows.length, 3);
    assert.ok(rows.every((e) => e.organizer_id === env.ids.org.ravoent && e.status === 'in_review' && e.origin === 'posted'));
    assert.equal(rows[2].event_type, 'day', 'a coffee rave is a daytime party');
    // Every admin is told once.
    const notes = (await env.ctx.db.query<{ n: number }>(`select count(*)::int as n from notifications where kind = 'review_needed' and title->>'en' like '3 from %'`)).rows[0].n;
    assert.ok(notes >= 1);
    const queue = (await env.as(await env.admin()).get('/admin/queue')).body.items as { title: string; fromCalendar: boolean }[];
    assert.equal(queue.find((i) => i.title === 'Coffee Rave Saigon')?.fromCalendar, true, 'the queue says "Từ lịch"');
    assert.equal((await env.as(org).post('/organizer/calendar', { url: 'https://ravolution.example/calendar.ics' })).body.error.code, 'calendar_connected');
    // Read again: nothing new.
    const src = (await env.ctx.db.query<{ id: string }>('select id from ingest_sources where organizer_id = $1', [env.ids.org.ravoent])).rows[0].id;
    const { runSource } = await import('../src/services/ingest/run.ts');
    const again = await runSource(env.ctx, src, { trigger: 'manual' });
    assert.equal(again.created, 0);
    assert.equal((await env.as(org).delete('/organizer/calendar')).status, 200);
    assert.equal((await env.as(org).get('/organizer/calendar')).body.calendar, null);
    assert.equal((await env.ctx.db.query<{ n: number }>(`select count(*)::int as n from events where title = 'Coffee Rave Saigon'`)).rows[0].n, 1, 'its events stay');
  });

  it('is for organisers only', async () => {
    const fan = await env.attendee();
    assert.equal((await env.as(fan).post('/organizer/calendar', { url: 'https://ravolution.example/calendar.ics' })).status, 403);
    assert.equal((await env.as().get('/organizer/calendar')).status, 401);
  });
});
