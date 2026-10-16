import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';
import { png } from './files.ts';
import { many, one } from '../src/db/index.ts';
import { purgeFeedbackAttachments } from '../src/routes/feedback.ts';

/** A report as the widget sends it: the JSON payload, and screenshots. */
function form(payload: unknown, shots: Buffer[] = []) {
  const b = 'ff-feedback-boundary';
  const parts: Buffer[] = [Buffer.from(`--${b}\r\nContent-Disposition: form-data; name="payload"\r\n\r\n${JSON.stringify(payload)}\r\n`)];
  shots.forEach((s, i) => parts.push(Buffer.from(`--${b}\r\nContent-Disposition: form-data; name="attachments"; filename="shot${i}.png"\r\nContent-Type: image/png\r\n\r\n`), s, Buffer.from('\r\n')));
  parts.push(Buffer.from(`--${b}--\r\n`));
  return { payload: Buffer.concat(parts), headers: { 'content-type': `multipart/form-data; boundary=${b}` } };
}

const TELEMETRY = {
  pagePath: '/e/ravo?auth=secret-code&via=google', userAgent: 'Mozilla/5.0 (iPhone)', screen: '1179x2556', viewport: '393x852', dpr: 3,
  language: 'vi-VN', lang: 'vi', errors: ['TypeError: x is undefined at https://feestfinder.com/_next/app.js?v=1:10:5'],
  lastApiError: { method: 'POST', path: '/go/ravo?src=detail', status: 500, code: 'http_500' }, cookie: 'ff_session=nope', localStorage: { a: 1 },
};

describe('feedback', () => {
  let env: TestEnv;
  let minh: string;
  let admin: string;
  before(async () => {
    env = await setup();
    minh = await env.attendee();
    admin = await env.admin();
  });
  after(async () => { await env.close(); });

  const send = (body: ReturnType<typeof form>, token?: string) =>
    env.app.inject({ method: 'POST', url: '/feedback', payload: body.payload, headers: { ...body.headers, ...(token ? { authorization: `Bearer ${token}` } : {}) } });

  it('a signed-in bug report: the server stamps the ticket and who sent it, keeps a fixed telemetry without queries, and two screenshots', async () => {
    const res = await send(form({
      type: 'bug', severity: 'high', title: 'Trang trắng khi bấm Đặt vé', description: 'Bấm Đặt vé thì trắng màn hình.', steps: '1. Vào trang\\n2. Bấm Đặt vé', csat: 2,
      telemetry: TELEMETRY, email: 'someone-else@example.com',
    }, [png(1179, 2556), png(800, 600)]), minh);
    assert.equal(res.statusCode, 201, res.body);
    const ticket = res.json().ticketId as string;
    assert.match(ticket, /^FF-FB-20260914-[A-Z2-9]{4}$/, 'the day in Vietnam, from the server');
    const row = await one<any>(env.ctx.db, 'select * from feedback where ticket_id = $1', [ticket]);
    assert.equal(row.guest_email, null, 'an account is who sent it, not a typed email');
    assert.ok(row.user_id);
    assert.equal(row.telemetry.pagePath, '/e/ravo');
    assert.equal(row.telemetry.lastApiError.path, '/go/ravo');
    assert.doesNotMatch(JSON.stringify(row.telemetry), /secret-code|ff_session|localStorage|\?v=1/);
    assert.equal((await many(env.ctx.db, 'select 1 from feedback_attachments where feedback_id = $1', [row.id])).length, 2);
  });

  it('a guest leaves an email; a bot filling the hidden field is thanked and forgotten', async () => {
    const noEmail = await send(form({ type: 'feature', title: 'Lọc theo BPM', description: 'Muốn lọc theo tempo.' }));
    assert.equal(noEmail.json().error.code, 'email_required');
    assert.equal((await send(form({ type: 'feature', title: 'x', description: 'y', email: 'not-an-email' }))).json().error.code, 'invalid_email');
    const ok = await send(form({ type: 'feature', severity: 'critical', title: 'Lọc theo BPM', description: 'Muốn lọc theo tempo.', name: 'Lan', email: 'Lan@Example.com', telemetry: { pagePath: '/list' } }));
    assert.equal(ok.statusCode, 201, ok.body);
    const row = await one<any>(env.ctx.db, 'select * from feedback where ticket_id = $1', [ok.json().ticketId]);
    assert.equal(row.guest_email, 'lan@example.com');
    assert.equal(row.severity, null, 'only bugs have a severity');
    const before = (await one<{ n: number }>(env.ctx.db, 'select count(*)::int as n from feedback'))!.n;
    const bot = await send(form({ type: 'support', title: 'Buy now', description: 'Cheap', email: 'bot@spam.example', website: 'https://spam.example' }));
    assert.equal(bot.statusCode, 201);
    assert.equal((await one<{ n: number }>(env.ctx.db, 'select count(*)::int as n from feedback'))!.n, before);
  });

  it('refuses what is not a report: missing fields, too long, not an image', async () => {
    assert.equal((await send(form({ type: 'bug', title: '', description: 'x' }), minh)).json().error.code, 'invalid_input');
    assert.equal((await send(form({ type: 'bug', title: 'x'.repeat(121), description: 'x' }), minh)).json().error.code, 'invalid_input');
    assert.equal((await send(form({ type: 'nope', title: 'x', description: 'x' }), minh)).json().error.code, 'invalid_input');
    assert.equal((await send(form({ type: 'bug', title: 'x', description: 'x' }, [Buffer.from('not an image at all')]), minh)).json().error.code, 'unsupported_image');
  });

  it('the team triages in the Console, sees screenshots only as the team, exports the issue shape, and every change is audited', async () => {
    assert.equal((await env.as(minh).get('/admin/feedback')).status, 403);
    const list = await env.as(admin).get('/admin/feedback');
    assert.equal(list.status, 200, JSON.stringify(list.body));
    assert.equal(list.body.counts.new, 2);
    const bug = list.body.items.find((x: any) => x.type === 'bug');
    const detail = await env.as(admin).get(`/admin/feedback/${bug.id}`);
    assert.equal(detail.body.attachments.length, 2);
    const shot = await env.app.inject({ method: 'GET', url: detail.body.attachments[0].url, headers: { authorization: `Bearer ${admin}` } });
    assert.equal(shot.statusCode, 200);
    assert.equal(shot.headers['content-type'], 'image/png');
    assert.equal(shot.headers['cache-control'], 'private, no-store');
    assert.equal((await env.app.inject({ method: 'GET', url: detail.body.attachments[0].url, headers: { authorization: `Bearer ${minh}` } })).statusCode, 403);

    const x = (await env.as(admin).get(`/admin/feedback/${bug.id}/export`)).body;
    assert.deepEqual(Object.keys(x).sort(), ['attachments', 'created_at', 'csat_rating', 'description', 'feedback_type', 'severity', 'steps_to_reproduce', 'telemetry', 'ticket_id', 'title', 'user_info'].sort());
    assert.equal(x.feedback_type, 'bug');
    assert.equal(x.user_info.is_authenticated, true);
    assert.deepEqual(Object.keys(x.telemetry).sort(), ['device_pixel_ratio', 'language', 'last_console_error', 'page_url', 'route_path', 'screen_resolution', 'user_agent', 'viewport_size'].sort());
    assert.match(x.telemetry.page_url, /\/e\/ravo$/);
    assert.equal(x.telemetry.viewport_size, '393x852');

    assert.equal((await env.as(admin).patch(`/admin/feedback/${bug.id}`, { status: 'triaged' })).status, 200);
    const audit = await one<{ action: string }>(env.ctx.db, `select action from audit_log where target_id = $1 order by seq desc limit 1`, [bug.id]);
    assert.equal(audit!.action, 'feedback.status');
    assert.equal((await env.as(admin).get('/admin/feedback')).body.counts.new, 1);
    // No repository configured: filing an issue says so.
    assert.equal((await env.as(admin).post(`/admin/feedback/${bug.id}/github`)).body.error.code, 'github_not_configured');
  });

  it('deletes screenshots after 90 days, keeping the report', async () => {
    assert.equal(await purgeFeedbackAttachments(env.ctx), 0);
    env.clock.set('2026-12-20T10:00:00+07:00');
    assert.equal(await purgeFeedbackAttachments(env.ctx), 2);
    assert.equal((await one<{ n: number }>(env.ctx.db, 'select count(*)::int as n from feedback'))!.n, 2, 'both reports stay');
  });
});
