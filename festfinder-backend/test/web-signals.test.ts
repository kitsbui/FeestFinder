import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';
import { ratingOf, webHealth, webNumbers } from '../src/services/web-signals.ts';
import { INSIGHTS, type InsightDefinition } from '../src/lib/posthog-insights.ts';

const PHONE = { 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' };

describe('web signals (design v2 phase 19)', () => {
  let env: TestEnv;
  let admin: string;
  before(async () => { env = await setup(); admin = await env.admin(); });
  after(() => env.close());

  const vital = (kind: string, value: number, path = '/') =>
    env.as().post('/analytics/collect', { name: 'web_vital', anonId: 'a'.repeat(20), props: { path, kind, value, rating: kind === 'TTFB' ? 'good' : ratingOf(kind as 'LCP', value) } }, { headers: PHONE });
  const error = (path = '/e/ravo') => env.as().post('/client-errors', { kind: 'error', message: 'boom' }, { headers: { ...PHONE, referer: `https://feestfinder.com${path}?code=secret` } });

  it('keeps every page’s vitals and errors without a PostHog or Sentry key, paths only', async () => {
    for (const v of [1800, 2100, 2400, 3000]) assert.equal((await vital('LCP', v)).status, 204);
    assert.equal((await vital('CLS', 0.02)).status, 204);
    assert.equal((await vital('INP', 150)).status, 204);
    // Not a vital: dropped, still 204.
    assert.equal((await vital('TTFB', 300)).status, 204);
    assert.equal((await env.as().post('/analytics/collect', { name: 'web_vital', anonId: 'a'.repeat(20), props: { kind: 'LCP', value: 'fast' } }, { headers: PHONE })).status, 204);
    // A robot's report is ignored.
    assert.equal((await env.as().post('/analytics/collect', { name: 'web_vital', anonId: 'a'.repeat(20), props: { kind: 'LCP', value: 100 } }, { headers: { 'user-agent': 'Googlebot/2.1' } })).status, 204);
    assert.equal((await error()).status, 204);
    const rows = await env.ctx.db.query<{ kind: string; name: string; value: number | null; rating: string | null; path: string | null }>('select kind, name, value, rating, path from web_signals order by id');
    assert.equal(rows.rows.length, 7);
    assert.deepEqual(rows.rows[0], { kind: 'vital', name: 'LCP', value: 1800, rating: 'good', path: '/' });
    assert.deepEqual(rows.rows[6], { kind: 'error', name: 'error', value: null, rating: null, path: '/e/ravo' });
  });

  it('shows the Console the p75 of each vital with its rating, and errors per measured page', async () => {
    const n = await webNumbers(env.ctx.db, env.clock.now());
    assert.deepEqual(n.vitals.LCP, { p75: 2550, rating: 'needs-improvement', n: 4 });
    assert.deepEqual(n.vitals.CLS, { p75: 0.02, rating: 'good', n: 1 });
    assert.deepEqual(n.vitals.INP, { p75: 150, rating: 'good', n: 1 });
    assert.deepEqual(n.errors, { n: 1, pages: 4, pct: 25 });
    const res = await env.as(admin).get('/admin/insights');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.web.vitals.LCP, { p75: 2550, rating: 'needs-improvement', n: 4 });
    assert.equal(res.body.web.errors.pct, 25);
  });

  it('tells the admins once an hour when errors pass 0.1 % of a hundred pages or more, and forgets after 30 days', async () => {
    // Four pages with one error is 25 %, but too few pages to say anything.
    let out = await webHealth(env.ctx.db, env.clock.now());
    assert.deepEqual([out.errors, out.pages, out.alerted], [1, 4, false]);
    for (let i = 0; i < 100; i++) await vital('LCP', 1500, '/a');
    out = await webHealth(env.ctx.db, env.clock.now());
    assert.deepEqual([out.pages, out.pct, out.alerted], [104, 0.96, true]);
    const notes = await env.as(admin).get('/me/notifications');
    const alert = notes.body.items.find((x: { kind: string }) => x.kind === 'web_errors');
    assert.ok(alert, JSON.stringify(notes.body.items.map((x: { kind: string }) => x.kind)));
    assert.match(alert.body.vi, /1 lỗi trên 104 trang/);
    // The same hour again: no second notice.
    out = await webHealth(env.ctx.db, env.clock.now());
    assert.equal(out.alerted, false);
    // 31 days on: everything of today is gone.
    env.clock.advance(31 * 86400_000);
    out = await webHealth(env.ctx.db, env.clock.now());
    assert.equal(out.purged, 107);
    assert.deepEqual((await webNumbers(env.ctx.db, env.clock.now())).errors, { n: 0, pages: 0, pct: null });
  });

  it('defines the four PostHog insights by name, with only listed events and properties', () => {
    assert.deepEqual(INSIGHTS.map((i: InsightDefinition) => i.name), ['Phễu: danh sách → sự kiện → vé', 'Web Vitals p75 theo kind', 'nav_click theo kind', 'wizard_step theo kind và role']);
    for (const i of INSIGHTS) {
      assert.ok(i.query.kind === 'FunnelsQuery' || i.query.kind === 'TrendsQuery');
      for (const s of i.query.series) assert.ok(['card_open', 'event_view', 'ticket_click', 'web_vital', 'nav_click', 'wizard_step'].includes(s.event), s.event);
    }
  });
});
