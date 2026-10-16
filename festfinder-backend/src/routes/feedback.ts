import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { many, one } from '../db/index.ts';
import { AppError, badRequest, notFound } from '../lib/errors.ts';
import { L } from '../lib/i18n.ts';
import { isEmail, normalizeEmail } from '../lib/contact.ts';
import { randomCode } from '../lib/crypto.ts';
import { imageInfo } from '../lib/image.ts';
import { vnDate } from '../lib/time.ts';
import { inBackground } from '../lib/background.ts';
import { limit, parse, uuid } from '../lib/validate.ts';
import { requireAdmin } from '../http/guards.ts';
import { decodeCursor, page } from '../http/sql.ts';
import { personId } from '../services/analytics.ts';
import { appendAudit } from '../services/audit.ts';

/*
 * Feedback and bug reports from the widget on every page (festfinder-web src/kd/feedback).
 *
 *   POST /feedback                         multipart: `payload` (JSON) and up to two screenshots
 *   GET  /admin/feedback                   the team's list (type, status, severity)
 *   GET  /admin/feedback/:id               one report, with its screenshots' addresses
 *   PATCH /admin/feedback/:id              its status (audited)
 *   GET  /admin/feedback/:id/attachments/:n  a screenshot, to the team only
 *   GET  /admin/feedback/:id/export        the report as the issue tools read it (snake_case FeedbackPayload)
 *   POST /admin/feedback/:id/github        files it as a GitHub issue, without who sent it (audited)
 *
 * The server stamps the ticket, the time and who sent it; the page's own account of itself is
 * kept to a fixed list, paths lose their query string (a sign-in return carries a code there).
 */

export const FEEDBACK_TYPES = ['bug', 'ui_ux', 'feature', 'support'] as const;
const SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;
const STATUSES = ['new', 'triaged', 'in_progress', 'done', 'wont_fix'] as const;
const MAX_ATTACHMENTS = 2;
const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;

/** A path on the site without its query string or fragment, as the report keeps it. */
const pathOnly = (v: unknown) => {
  const s = String(v ?? '').trim();
  if (!s.startsWith('/') || s.startsWith('//')) return '/';
  return s.split(/[?#]/)[0].slice(0, 300);
};
const short = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').slice(0, max) : undefined);

/** What the page says about itself, reduced to the fixed list: never cookies, storage or an address with a query. */
function cleanTelemetry(t: Record<string, unknown> | undefined) {
  const x = t ?? {};
  const api = x.lastApiError && typeof x.lastApiError === 'object' ? x.lastApiError as Record<string, unknown> : null;
  return {
    pagePath: pathOnly(x.pagePath),
    userAgent: short(x.userAgent, 400),
    screen: short(x.screen, 20),
    viewport: short(x.viewport, 20),
    dpr: typeof x.dpr === 'number' && Number.isFinite(x.dpr) ? Math.round(x.dpr * 100) / 100 : undefined,
    language: short(x.language, 20),
    lang: x.lang === 'en' || x.lang === 'vi' ? x.lang : undefined,
    displayMode: short(x.displayMode, 20),
    buildId: short(x.buildId, 60),
    errors: Array.isArray(x.errors) ? x.errors.slice(-5).map((e) => short(String(e).replace(/\?[^\s:)]*/g, ''), 500)).filter(Boolean) : [],
    lastApiError: api ? { method: short(api.method, 8), path: pathOnly(api.path), status: typeof api.status === 'number' ? api.status : undefined, code: short(api.code, 60) } : undefined,
  };
}

const Payload = z.object({
  type: z.enum(FEEDBACK_TYPES),
  severity: z.enum(SEVERITIES).nullable().optional(),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(4000),
  steps: z.string().trim().max(2000).nullable().optional(),
  csat: z.number().int().min(1).max(5).nullable().optional(),
  name: z.string().trim().max(80).nullable().optional(),
  email: z.string().trim().max(200).nullable().optional(),
  telemetry: z.record(z.string(), z.unknown()).optional(),
  // A field people never see: a bot that fills every field fills this one too.
  website: z.string().max(200).optional(),
});

/** FF-FB-20261015-K7QX: the day in Vietnam's calendar, then four letters nobody misreads. */
const ticketFor = (now: Date) => `FF-FB-${vnDate(now).replaceAll('-', '')}-${randomCode(4)}`;

const TYPE_LABEL = {
  bug: L('Bug report', 'Báo lỗi kỹ thuật'), ui_ux: L('Design and experience', 'Góp ý giao diện & trải nghiệm'),
  feature: L('Feature request', 'Đề xuất tính năng'), support: L('Question and support', 'Thắc mắc & hỗ trợ'),
};

export default async function feedbackRoutes(app: FastifyInstance) {
  const ctx = app.ctx;

  app.post('/feedback', { config: { rateLimit: { max: 5, timeWindow: '1 hour' } } }, async (req, reply) => {
    if (!req.isMultipart()) throw badRequest('multipart_required', L('Send the report as multipart/form-data', 'Gửi báo cáo dạng multipart/form-data'));
    let raw: unknown = null;
    const files: { mime: 'image/png' | 'image/jpeg' | 'image/webp'; width: number; height: number; data: Buffer }[] = [];
    for await (const part of req.parts({ limits: { files: MAX_ATTACHMENTS, fileSize: MAX_ATTACHMENT_BYTES, fields: 4, fieldSize: 64 * 1024 } })) {
      if (part.type === 'field') {
        if (part.fieldname === 'payload') { try { raw = JSON.parse(String(part.value)); } catch { raw = null; } }
        continue;
      }
      const buf = await part.toBuffer();
      if (part.file.truncated) throw new AppError(413, 'file_too_large', L('Screenshots can be up to 2 MB each', 'Mỗi ảnh chụp tối đa 2 MB'));
      const info = imageInfo(buf);
      if (!info) throw badRequest('unsupported_image', L('Use a PNG, JPEG or WebP image', 'Dùng ảnh PNG, JPEG hoặc WebP'));
      files.push({ ...info, data: buf });
    }
    const body = parse(Payload, raw);
    const now = ctx.clock.now();
    const userId = req.session?.user?.id ?? null;
    const email = body.email ? normalizeEmail(body.email) : null;
    if (!userId) {
      if (!email) throw badRequest('email_required', L('Add your email so we can answer', 'Nhập email để chúng tôi trả lời bạn'));
      if (!isEmail(email)) throw badRequest('invalid_email', L('That email address does not look right', 'Email chưa đúng định dạng'));
    }
    if (body.website) return reply.code(201).send({ ok: true, ticketId: ticketFor(now) });

    const severity = body.type === 'bug' ? body.severity ?? null : null;
    const telemetry = cleanTelemetry(body.telemetry);
    let row: { id: string; ticket_id: string } | undefined;
    for (let attempt = 0; attempt < 5 && !row; attempt++) {
      try {
        row = await ctx.db.tx(async (q) => {
          const r = await one<{ id: string; ticket_id: string }>(q,
            `insert into feedback (ticket_id, type, severity, title, description, steps, csat, user_id, guest_name, guest_email, telemetry, created_at, updated_at)
             values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12) returning id, ticket_id`,
            [ticketFor(now), body.type, severity, body.title, body.description, body.type === 'bug' ? body.steps || null : null, body.csat ?? null,
              userId, userId ? null : body.name || null, userId ? null : email, JSON.stringify(telemetry), now]);
          for (const [i, f] of files.entries()) {
            await q.query(`insert into feedback_attachments (feedback_id, n, mime, width, height, bytes, data, created_at) values ($1,$2,$3,$4,$5,$6,$7,$8)`,
              [r!.id, i + 1, f.mime, f.width, f.height, f.data.length, f.data, now]);
          }
          return r!;
        });
      } catch (e: any) {
        // Two reports drew the same four letters on the same day: draw again.
        if (e?.code === '23505' && String(e?.constraint ?? e?.detail ?? '').includes('ticket')) continue;
        throw e;
      }
    }
    if (!row) throw new AppError(503, 'try_again', L('Please send it again', 'Hãy gửi lại'));
    void ctx.analytics.capture('feedback_sent', userId ? personId(userId) : 'anon-feedback', { kind: body.type });
    const hook = ctx.config.feedback.webhookUrl;
    if (hook) {
      const base = ctx.config.publicBaseUrl.replace(/\/$/, '');
      const text = `${row.ticket_id} · ${TYPE_LABEL[body.type].en}${severity ? ` (${severity})` : ''}: ${body.title}\n${base}/console/feedback?id=${row.id}`;
      inBackground(fetch(hook, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text, content: text }), signal: AbortSignal.timeout(5000) }),
        (e) => ctx.log(`feedback webhook: ${e}`));
    }
    return reply.code(201).send({ ok: true, ticketId: row.ticket_id, message: L(`Thanks · ticket ${row.ticket_id}`, `Cảm ơn bạn · mã ${row.ticket_id}`) });
  });

  // ---- the team -------------------------------------------------------------------------------

  const present = (r: any, attachments: { n: number; width: number; height: number }[] = []) => ({
    id: r.id as string, ticketId: r.ticket_id as string, type: r.type as string, typeLabel: TYPE_LABEL[r.type as (typeof FEEDBACK_TYPES)[number]],
    severity: r.severity as string | null, title: r.title as string, description: r.description as string, steps: r.steps as string | null,
    csat: r.csat as number | null, status: r.status as string, createdAt: r.created_at as Date, githubIssueUrl: r.github_issue_url as string | null,
    from: r.user_id ? { kind: 'user', id: r.user_id as string, name: r.user_name as string | null, email: r.user_email as string | null } : { kind: 'guest', name: r.guest_name as string | null, email: r.guest_email as string | null },
    telemetry: r.telemetry,
    attachments: attachments.map((a) => ({ n: a.n, width: a.width, height: a.height, url: `/admin/feedback/${r.id}/attachments/${a.n}` })),
    attachmentCount: Number(r.attachment_count ?? attachments.length),
  });
  const FROM = `from feedback f left join users u on u.id = f.user_id`;
  const COLS = `f.*, u.name as user_name, u.email as user_email, (select count(*)::int from feedback_attachments a where a.feedback_id = f.id) as attachment_count`;
  const load = async (id: string) => {
    const r = await one<any>(ctx.db, `select ${COLS} ${FROM} where f.id = $1`, [parse(uuid, id)]);
    if (!r) throw notFound();
    const att = await many<any>(ctx.db, 'select n, width, height from feedback_attachments where feedback_id = $1 order by n', [r.id]);
    return { r, att };
  };

  app.get('/admin/feedback', async (req) => {
    requireAdmin(req);
    const f = parse(z.object({
      type: z.enum(FEEDBACK_TYPES).optional(), status: z.enum([...STATUSES, 'open'] as const).default('open'), severity: z.enum(SEVERITIES).optional(),
      cursor: z.string().optional(), limit: limit(100, 50),
    }), req.query);
    const offset = decodeCursor(f.cursor);
    const rows = await many<any>(ctx.db,
      `select ${COLS} ${FROM}
        where ($1::text is null or f.type = $1) and ($2::text is null or f.severity = $2)
          and (case when $3 = 'open' then f.status in ('new', 'triaged', 'in_progress') else f.status = $3 end)
        order by f.created_at desc limit $4 offset $5`,
      [f.type ?? null, f.severity ?? null, f.status, f.limit + 1, offset]);
    const counts = await one<any>(ctx.db, `select count(*) filter (where status = 'new')::int as new, count(*) filter (where status in ('new', 'triaged', 'in_progress'))::int as open from feedback`);
    const out = page(rows, offset, f.limit);
    return { items: out.items.map((r) => present(r)), nextCursor: out.nextCursor, counts };
  });

  app.get<{ Params: { id: string } }>('/admin/feedback/:id', async (req) => {
    requireAdmin(req);
    const { r, att } = await load(req.params.id);
    return present(r, att);
  });

  app.patch<{ Params: { id: string } }>('/admin/feedback/:id', async (req) => {
    const s = requireAdmin(req);
    const { status } = parse(z.object({ status: z.enum(STATUSES) }), req.body);
    const { r } = await load(req.params.id);
    if (r.status === status) return { ok: true };
    await ctx.db.tx(async (q) => {
      await q.query('update feedback set status = $2, updated_at = $3 where id = $1', [r.id, status, ctx.clock.now()]);
      await appendAudit(q, { at: ctx.clock.now(), actorType: 'admin', actorId: s.user.id, actorLabel: s.user.name || 'FeestFinder Admin', action: 'feedback.status',
        targetType: 'feedback', targetId: r.id, targetLabel: r.ticket_id, diff: [{ f: 'status', a: r.status, b: status }] });
    });
    return { ok: true, message: L('Saved', 'Đã lưu') };
  });

  app.get<{ Params: { id: string; n: string } }>('/admin/feedback/:id/attachments/:n', async (req, reply) => {
    requireAdmin(req);
    const n = Number(req.params.n);
    const a = await one<{ mime: string; data: Uint8Array }>(ctx.db, 'select mime, data from feedback_attachments where feedback_id = $1 and n = $2', [parse(uuid, req.params.id), Number.isInteger(n) ? n : 0]);
    if (!a) throw notFound();
    return reply.type(a.mime).header('cache-control', 'private, no-store').header('content-disposition', 'inline').send(Buffer.from(a.data));
  });

  /** The report in the shape the issue tools read (the widget's FeedbackPayload), snake_case. */
  const exported = (r: any, att: { n: number }[]) => {
    const base = ctx.config.publicBaseUrl.replace(/\/$/, '');
    const t = r.telemetry ?? {};
    return {
      ticket_id: r.ticket_id,
      created_at: new Date(r.created_at).toISOString(),
      feedback_type: r.type,
      ...(r.severity ? { severity: r.severity } : {}),
      title: r.title,
      description: r.description,
      ...(r.steps ? { steps_to_reproduce: r.steps } : {}),
      ...(r.csat ? { csat_rating: r.csat } : {}),
      ...(att.length ? { attachments: att.map((a) => `${base}/admin/feedback/${r.id}/attachments/${a.n}`) } : {}),
      user_info: r.user_id
        ? { is_authenticated: true, user_id: r.user_id, ...(r.user_email ? { email: r.user_email } : {}), ...(r.user_name ? { name: r.user_name } : {}) }
        : { is_authenticated: false, ...(r.guest_email ? { email: r.guest_email } : {}), ...(r.guest_name ? { name: r.guest_name } : {}) },
      telemetry: {
        page_url: `${base}${t.pagePath ?? '/'}`,
        route_path: t.pagePath ?? '/',
        user_agent: t.userAgent ?? '',
        screen_resolution: t.screen ?? '',
        viewport_size: t.viewport ?? '',
        device_pixel_ratio: t.dpr ?? 1,
        language: t.language ?? '',
        ...(t.errors?.length ? { last_console_error: t.errors[t.errors.length - 1] } : {}),
      },
    };
  };

  app.get<{ Params: { id: string } }>('/admin/feedback/:id/export', async (req, reply) => {
    requireAdmin(req);
    const { r, att } = await load(req.params.id);
    return reply.header('cache-control', 'private, no-store').send(exported(r, att));
  });

  app.post<{ Params: { id: string } }>('/admin/feedback/:id/github', async (req) => {
    const s = requireAdmin(req);
    const { githubRepo, githubToken } = ctx.config.feedback;
    if (!githubRepo || !githubToken) throw new AppError(503, 'github_not_configured', L('Set FEEDBACK_GITHUB_REPO and GITHUB_TOKEN to file issues', 'Cần FEEDBACK_GITHUB_REPO và GITHUB_TOKEN để tạo issue'));
    const { r, att } = await load(req.params.id);
    if (r.github_issue_url) return { ok: true, url: r.github_issue_url };
    // The issue never names who sent the report: the repository may be read by more people than the team.
    const { user_info: _who, attachments: _shots, ...rest } = exported(r, att);
    const body = [
      `**${TYPE_LABEL[r.type as (typeof FEEDBACK_TYPES)[number]].en}**${r.severity ? ` · severity ${r.severity}` : ''} · ${r.ticket_id}`, '',
      r.description, '', ...(r.steps ? ['**Steps to reproduce**', '', r.steps, ''] : []),
      '```json', JSON.stringify({ ...rest, attachments_in_console: att.length }, null, 2), '```',
    ].join('\n');
    const res = await fetch(`https://api.github.com/repos/${githubRepo}/issues`, {
      method: 'POST', signal: AbortSignal.timeout(10_000),
      headers: { authorization: `Bearer ${githubToken}`, accept: 'application/vnd.github+json', 'content-type': 'application/json', 'user-agent': 'FeestFinder' },
      body: JSON.stringify({ title: `[${r.ticket_id}] ${r.title}`, body, labels: ['feedback', r.type] }),
    }).catch(() => null);
    const out = res?.ok ? await res.json() as { html_url?: string } : null;
    const url = out?.html_url;
    if (!url) throw new AppError(502, 'github_failed', L('GitHub did not take the issue', 'GitHub chưa nhận issue'));
    await ctx.db.tx(async (q) => {
      await q.query('update feedback set github_issue_url = $2, status = case when status = $3 then $4 else status end, updated_at = $5 where id = $1', [r.id, url, 'new', 'triaged', ctx.clock.now()]);
      await appendAudit(q, { at: ctx.clock.now(), actorType: 'admin', actorId: s.user.id, actorLabel: s.user.name || 'FeestFinder Admin', action: 'feedback.github',
        targetType: 'feedback', targetId: r.id, targetLabel: r.ticket_id, diff: [{ f: 'github', a: '—', b: url.slice(0, 80) }] });
    });
    return { ok: true, url, message: L('Issue filed', 'Đã tạo issue') };
  });
}

/** Screenshots are kept 90 days: a screen can show a ticket's QR code or someone's email. */
export async function purgeFeedbackAttachments(ctx: { db: import('../db/index.ts').Queryable; clock: { now(): Date } }) {
  const rows = await many(ctx.db, `delete from feedback_attachments where created_at < $1 returning 1`, [new Date(ctx.clock.now().getTime() - 90 * 24 * 3600_000)]);
  return rows.length;
}
