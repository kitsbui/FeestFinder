import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { json, many, one } from '../db/index.ts';
import { AppError, badRequest, conflict, forbidden, notFound, tooMany } from '../lib/errors.ts';
import { CITY_SLUGS, GENRES, L, REJECT_REASONS, type Localized } from '../lib/i18n.ts';
import { searchNormalize, slugify } from '../lib/contact.ts';
import { randomCode, sha256 } from '../lib/crypto.ts';
import { dateStr, imageUrl, parse, timeStr, uuid } from '../lib/validate.ts';
import { requireAdmin, requireOrganizer, requireOwnEvent, requireUser, requireWriter } from '../http/guards.ts';
import { appendAudit } from '../services/audit.ts';
import { refreshDerived } from '../services/events.ts';
import { assessRisk } from '../services/risk.ts';
import { communityOrganizerId, nameOf, refCodeFor, SHARE_CHANNELS } from '../services/community.ts';
import { imageInfo } from '../lib/image.ts';
import { vnDate } from '../lib/time.ts';
import { notifyOrganizer, notifyUser } from '../services/notify.ts';
import { PageUnavailable } from '../services/fetchpage.ts';
import { pageText, prefillFromJsonLd, PrefillUnavailable } from '../services/prefill.ts';
import { STATUS_LABEL } from './organizer/events.ts';

const SUBMISSIONS_PER_DAY = 5;

/** What anyone can send in about an event they found. The source link is how a moderator checks it. */
const SubmissionInput = z.object({
  title: z.string().trim().min(6).max(120),
  genre: z.enum(GENRES),
  description: z.string().trim().max(4000).default(''),
  startsOn: dateStr,
  endsOn: dateStr.optional(),
  startTime: timeStr,
  endTime: timeStr,
  venueId: uuid.optional(),
  venueName: z.string().trim().min(2).max(160),
  address: z.string().trim().max(240).default(''),
  area: z.string().trim().max(60).default(''),
  city: z.enum(CITY_SLUGS).default('ho-chi-minh'),
  entryMode: z.enum(['free', 'paid']),
  priceFrom: z.number().int().min(0).max(100_000_000).default(0),
  ticketUrl: z.string().url().max(500).optional(),
  sourceUrl: z.string().url().max(500),
  lineup: z.array(z.string().trim().min(1).max(100)).max(40).default([]),
  coverUrl: imageUrl.optional(),
});

export default async function communityRoutes(app: FastifyInstance) {
  const ctx = app.ctx;

  // ---- events the community sends in ---------------------------------------------------

  /**
   * Anyone with a proven phone number can send in an event. It joins the same review queue
   * as organisers' listings and goes live only when a moderator approves it.
   */
  app.post('/community/events', async (req, reply) => {
    const s = requireWriter(req);
    const b = parse(SubmissionInput, req.body);
    const now = ctx.clock.now();
    if (b.endsOn && b.endsOn < b.startsOn) throw badRequest('dates_order', L('The end date is before the start date', 'Ngày kết thúc trước ngày bắt đầu'));
    if (b.entryMode === 'paid' && !b.priceFrom) throw badRequest('price_required', L('Add the lowest ticket price', 'Thêm giá vé thấp nhất'));
    const today = await one<{ n: number }>(ctx.db,
      `select count(*)::int as n from events where submitted_by = $1 and created_at > $2`, [s.user.id, new Date(now.getTime() - 86400_000)]);
    if (today!.n >= SUBMISSIONS_PER_DAY) {
      throw tooMany('too_many_submissions', L(`Up to ${SUBMISSIONS_PER_DAY} events a day — thank you for all of them`, `Tối đa ${SUBMISSIONS_PER_DAY} sự kiện mỗi ngày — cảm ơn bạn rất nhiều`));
    }
    const id = await ctx.db.tx(async (q) => {
      const organizerId = await communityOrganizerId(q);
      const slug = `${slugify(b.title) || 'event'}-${randomCode(4).toLowerCase()}`;
      let venue: any = null;
      if (b.venueId) {
        venue = await one<any>(q, 'select * from venues where id = $1', [b.venueId]);
        if (!venue) throw badRequest('venue_unknown', L('Pick a venue from the list', 'Chọn địa điểm trong danh sách'));
      }
      const ev = await one<any>(q,
        `insert into events (slug, organizer_id, submitted_by, title, genre, description, venue_id, venue_name, address, area, lat, lng,
                             starts_on, ends_on, start_time, end_time, entry_mode, price_from, ticket_url, event_url, lineup, artists, cover_url,
                             art, status, submitted_at, created_at, city)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$21,$22,$23,'in_review',$24,$24,$25) returning id`,
        [slug, organizerId, s.user.id, b.title, b.genre, json({ en: b.description, vi: b.description }),
          venue?.id ?? null, venue?.name ?? b.venueName, venue?.address ?? (b.address || null), venue?.area ?? (b.area || null), venue?.lat ?? null, venue?.lng ?? null,
          b.startsOn, b.endsOn ?? b.startsOn, b.startTime, b.endTime, b.entryMode, b.entryMode === 'free' ? 0 : b.priceFrom,
          b.ticketUrl ?? null, b.sourceUrl, b.lineup, b.coverUrl ?? null, 'linear-gradient(135deg,#0AE448,#ABFF84)', now, b.city]);
      await q.query(`update events set ticket_link_status = case when ticket_url is null then null else 'unchecked' end where id = $1`, [ev.id]);
      await refreshDerived(q, ev.id);
      const risk = await assessRisk(q, ev.id, now);
      // Something with the same name on the same day is probably already listed.
      const dup = await one<any>(q,
        `select id, title from events where id <> $1 and status in ('live', 'in_review') and starts_on = $2 and search_text like '%' || $3 || '%' limit 1`,
        [ev.id, b.startsOn, searchNormalize(b.title).split(' ').slice(0, 3).join(' ')]);
      const signals = [...risk.signals, ...(dup ? [{ ok: false, label: L(`Maybe a duplicate of “${dup.title}”`, `Có thể trùng “${dup.title}”`) }] : [])];
      await q.query('update events set risk_score = $2, risk_factors = $3, signals = $4, flag = $5 where id = $1',
        [ev.id, risk.score, json(risk.factors), json(signals.slice(0, 3)), dup ? 'duplicate' : risk.flag]);
      await appendAudit(q, {
        at: now, actorType: 'system', actorId: s.user.id, actorLabel: `Community · ${s.user.name || s.user.phone || s.user.id}`, action: 'listing.submitted',
        targetType: 'event', targetId: ev.id, targetLabel: b.title, diff: [{ f: 'status', a: '—', b: 'in_review' }, { f: 'source', a: '—', b: b.sourceUrl }],
      });
      return ev.id as string;
    });
    const ev = await one<any>(ctx.db, 'select id, slug, status, title from events where id = $1', [id]);
    return reply.code(201).send({
      id: ev.id, slug: ev.slug, status: ev.status, statusLabel: STATUS_LABEL[ev.status],
      message: L('Sent for review · you will hear when it is live', 'Đã gửi kiểm duyệt · bạn sẽ được báo khi sự kiện lên sóng'),
    });
  });

  // ---- "let AI fill it in" --------------------------------------------------------------

  /** Calls to the model per person per hour; reading a page's own structured data is free. */
  const AI_PER_HOUR = 10;
  const PAGES_PER_HOUR = 30;
  const aiBudget = async (userId: string, purpose: string, max: number) => {
    const now = ctx.clock.now();
    const used = await one<{ n: number }>(ctx.db, 'select count(*)::int as n from ai_calls where user_id = $1 and purpose = $2 and created_at > $3',
      [userId, purpose, new Date(now.getTime() - 3600_000)]);
    if (used!.n >= max) throw tooMany('prefill_limit', L('That is a lot of events in an hour — fill this one in by hand', 'Bạn đã dùng nhiều lần trong giờ qua — hãy tự điền sự kiện này'));
    await ctx.db.query('insert into ai_calls (user_id, purpose, created_at) values ($1,$2,$3)', [userId, purpose, now]);
  };
  const unavailable = (e: unknown): never => {
    if (e instanceof PrefillUnavailable) {
      throw new AppError(503, 'prefill_unavailable', e.reason === 'disabled'
        ? L('Filling in from a poster is not switched on here yet', 'Tính năng điền từ poster chưa bật ở đây')
        : L('Could not read that one — fill the form in by hand', 'Chưa đọc được — hãy tự điền form'));
    }
    throw e;
  };

  /**
   * The page where someone saw the event. A page that declares schema.org Event data (ticket
   * sites do) is read directly; any other page's text goes to the model.
   */
  app.post('/community/prefill', async (req) => {
    const s = requireWriter(req);
    const { url } = parse(z.object({ url: z.string().url().max(500) }), req.body);
    await aiBudget(s.user.id, 'prefill_page', PAGES_PER_HOUR);
    let page;
    try {
      page = await ctx.fetchPage(url);
    } catch (e) {
      if (e instanceof PageUnavailable && e.reason === 'private_address') throw badRequest('bad_url', L('Paste the link of a public page', 'Dán link của một trang công khai'));
      throw badRequest('page_unreachable', L('Could not open that page — try the poster instead', 'Không mở được trang này — thử tải poster lên'));
    }
    const structured = prefillFromJsonLd(page.html, page.url);
    if (structured?.title && structured.startsOn) return { fields: structured, source: 'structured', sourceUrl: page.url };
    await aiBudget(s.user.id, 'prefill_ai', AI_PER_HOUR);
    const fields = await ctx.prefill.extract({ today: vnDate(ctx.clock.now()), sourceUrl: page.url, text: pageText(page.html) }).catch(unavailable);
    // What the page declared, the model does not override.
    const merged = structured ? Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, (structured as any)[k] ?? v])) : fields;
    return { fields: merged, source: 'ai', sourceUrl: page.url };
  });

  /** A photo of the poster, read by the model. Nothing is kept. */
  app.post('/community/prefill/poster', async (req) => {
    const s = requireWriter(req);
    if (!req.isMultipart()) throw badRequest('multipart_required', L('Send the image as multipart/form-data', 'Gửi ảnh dạng multipart/form-data'));
    const file = await req.file();
    if (!file) throw badRequest('file_required', L('Choose an image', 'Chọn một ảnh'));
    const buf = await file.toBuffer();
    const info = imageInfo(buf);
    if (!info) throw badRequest('unsupported_image', L('Use a PNG, JPEG or WebP image', 'Dùng ảnh PNG, JPEG hoặc WebP'));
    if (buf.length > 5 * 1024 * 1024) throw new AppError(413, 'file_too_large', L('Posters can be up to 5 MB', 'Poster tối đa 5 MB'));
    await aiBudget(s.user.id, 'prefill_ai', AI_PER_HOUR);
    const fields = await ctx.prefill.extract({ today: vnDate(ctx.clock.now()), image: { data: buf, mime: info.mime } }).catch(unavailable);
    return { fields, source: 'ai' };
  });

  // ---- organisers taking over what the community sent in -------------------------------

  /** An organiser asks to run a community event; a moderator checks and moves it to them. */
  app.post<{ Params: { id: string } }>('/events/:id/claims', async (req, reply) => {
    const org = await requireOrganizer(ctx, req);
    const body = parse(z.object({ note: z.string().trim().min(10).max(1000), proofUrl: z.string().url().max(500).optional() }), req.body);
    const ev = await one<any>(ctx.db,
      `select e.id, e.title, e.status, o.is_community from events e join organizers o on o.id = e.organizer_id where e.id = $1`, [parse(uuid, req.params.id)]);
    if (!ev || !['live', 'in_review'].includes(ev.status)) throw notFound(L('Event not found', 'Không tìm thấy sự kiện'));
    if (!ev.is_community) throw conflict('not_claimable', L('This event already has its organiser', 'Sự kiện này đã có nhà tổ chức quản lý'));
    const open = await one(ctx.db, `select 1 from event_claims where event_id = $1 and organizer_id = $2 and status = 'pending'`, [ev.id, org.organizerId]);
    if (open) throw conflict('claim_pending', L('Your request is already with the moderators', 'Yêu cầu của bạn đang chờ kiểm duyệt'));
    const row = await one<any>(ctx.db,
      `insert into event_claims (event_id, organizer_id, user_id, note, proof_url, created_at) values ($1,$2,$3,$4,$5,$6) returning id`,
      [ev.id, org.organizerId, org.userId, body.note, body.proofUrl ?? null, ctx.clock.now()]);
    return reply.code(201).send({ id: row.id, status: 'pending', message: L('Sent · we will check and move the event to your account', 'Đã gửi · chúng tôi sẽ kiểm tra và chuyển sự kiện sang tài khoản của bạn') });
  });

  app.get('/admin/claims', async (req) => {
    requireAdmin(req);
    const { status } = parse(z.object({ status: z.enum(['pending', 'approved', 'rejected']).default('pending') }), req.query);
    const rows = await many<any>(ctx.db,
      `select c.*, e.title, e.slug, e.starts_on, o.name as org_name, o.slug as org_slug, o.verification_state, o.website, o.email as org_email,
              u.name as user_name, u.email as user_email, s.name as submitter_name
         from event_claims c join events e on e.id = c.event_id join organizers o on o.id = c.organizer_id
         left join users u on u.id = c.user_id left join users s on s.id = e.submitted_by
        where c.status = $1 order by c.created_at desc limit 100`, [status]);
    return {
      items: rows.map((r) => ({
        id: r.id, status: r.status, note: r.note, proofUrl: r.proof_url, createdAt: r.created_at, decidedAt: r.decided_at, decisionNote: r.decision_note,
        event: { id: r.event_id, title: r.title, slug: r.slug, startsOn: r.starts_on, submittedBy: r.submitter_name ? nameOf(r.submitter_name) : null },
        organizer: { id: r.organizer_id, name: r.org_name, slug: r.org_slug, verified: r.verification_state === 'verified', website: r.website, email: r.org_email },
        requestedBy: { name: nameOf(r.user_name), email: r.user_email },
      })),
    };
  });

  for (const decision of ['approve', 'reject'] as const) {
    app.post<{ Params: { id: string } }>(`/admin/claims/:id/${decision}`, async (req) => {
      const s = requireAdmin(req);
      const { note } = parse(z.object({ note: z.string().trim().max(500).optional() }), req.body ?? {});
      const now = ctx.clock.now();
      const out = await ctx.db.tx(async (q) => {
        const c = await one<any>(q,
          `select c.*, e.title, e.submitted_by, e.slug, o.name as org_name from event_claims c join events e on e.id = c.event_id join organizers o on o.id = c.organizer_id
            where c.id = $1 for update of c`, [parse(uuid, req.params.id)]);
        if (!c || c.status !== 'pending') throw conflict('not_pending', L('This request was already decided', 'Yêu cầu này đã được xử lý'));
        await q.query(`update event_claims set status = $2, decided_at = $3, decided_by = $4, decision_note = $5 where id = $1`,
          [c.id, decision === 'approve' ? 'approved' : 'rejected', now, s.user.id, note ?? null]);
        if (decision === 'approve') {
          await q.query('update events set organizer_id = $2, updated_at = $3 where id = $1', [c.event_id, c.organizer_id, now]);
          await q.query(`update event_claims set status = 'rejected', decided_at = $2, decided_by = $3, decision_note = 'claimed by another organiser' where event_id = $1 and status = 'pending'`,
            [c.event_id, now, s.user.id]);
          if (c.submitted_by) {
            await notifyUser(q, now, {
              userId: c.submitted_by, topic: null, kind: 'submission_claimed', dedupeKey: `claimed:${c.event_id}`,
              title: L(`${c.org_name} now runs ${c.title}`, `${c.org_name} đã nhận quản lý ${c.title}`),
              body: L('Thanks for sending it in — the event page keeps your credit.', 'Cảm ơn bạn đã gửi — trang sự kiện vẫn ghi công bạn.'),
              link: { screen: 'event', eventId: c.event_id },
            });
          }
        }
        await notifyOrganizer(q, now, {
          organizerId: c.organizer_id, topic: 'moderation', kind: decision === 'approve' ? 'live' : 'reject',
          title: decision === 'approve' ? L(`${c.title} is now yours`, `${c.title} đã chuyển về tài khoản của bạn`) : L(`Request for ${c.title} declined`, `Yêu cầu nhận ${c.title} chưa được duyệt`),
          body: decision === 'approve' ? L('Edit it, add tickets and answer questions from your dashboard.', 'Chỉnh sửa, thêm vé và trả lời câu hỏi từ trang quản lý.')
            : { en: note || 'We could not confirm you organise it. Reply with proof to try again.', vi: note || 'Chúng tôi chưa xác nhận được bạn là BTC. Gửi thêm bằng chứng để thử lại.' },
          link: { screen: 'dash', eventId: c.event_id },
        });
        await appendAudit(q, { at: now, actorType: 'admin', actorId: s.user.id, actorLabel: s.user.name || 'FeestFinder Admin',
          action: decision === 'approve' ? 'listing.claimed' : 'listing.claim_rejected', targetType: 'event', targetId: c.event_id, targetLabel: c.title,
          diff: [{ f: 'organizer', a: 'Cộng đồng FeestFinder', b: decision === 'approve' ? c.org_name : '—' }] });
        return c;
      });
      return { ok: true, message: decision === 'approve' ? L(`Moved to ${out.org_name}`, `Đã chuyển cho ${out.org_name}`) : L('Declined', 'Đã từ chối') };
    });
  }

  /** What I sent in, and what happened to each. */
  app.get('/me/submissions', async (req) => {
    const s = requireUser(req);
    const rows = await many<any>(ctx.db,
      `select e.id, e.slug, e.title, e.status, e.starts_on, e.start_time, e.venue_name, e.created_at, e.published_at,
              (select d.reason_code from moderation_decisions d where d.event_id = e.id order by d.decided_at desc limit 1) as reason_code,
              (select d.message from moderation_decisions d where d.event_id = e.id order by d.decided_at desc limit 1) as decision_message,
              (e.organizer_id <> (select id from organizers where is_community limit 1)) as claimed
         from events e where e.submitted_by = $1 order by e.created_at desc limit 50`, [s.user.id]);
    return {
      items: rows.map((r) => ({
        id: r.id, slug: r.slug, title: r.title, status: r.status, statusLabel: STATUS_LABEL[r.status],
        startsOn: r.starts_on, startTime: r.start_time, venueName: r.venue_name, createdAt: r.created_at, publishedAt: r.published_at,
        reason: r.status === 'rejected' && r.reason_code ? REJECT_REASONS[r.reason_code]?.label ?? null : null,
        message: r.status === 'rejected' ? r.decision_message : null,
        claimed: !!r.claimed,
      })),
    };
  });

  // ---- sharing ----------------------------------------------------------------------------

  /**
   * The link to share, tagged with who shared it and where, so the organiser sees which
   * channels work and the sharer sees how many people they brought.
   */
  app.post<{ Params: { id: string } }>('/events/:id/shares', async (req) => {
    const { channel } = parse(z.object({ channel: z.enum(SHARE_CHANNELS) }), req.body);
    const ev = await one<any>(ctx.db, `select id, slug, title, status from events where id = $1`, [parse(uuid, req.params.id)]);
    if (!ev || ev.status !== 'live') throw notFound(L('Event not found', 'Không tìm thấy sự kiện'));
    const userId = req.session?.user?.id ?? null;
    const ref = userId ? await refCodeFor(ctx.db, userId) : null;
    await ctx.db.query('insert into event_shares (event_id, user_id, channel, created_at) values ($1,$2,$3,$4)', [ev.id, userId, channel, ctx.clock.now()]);
    const base = ctx.config.publicBaseUrl.replace(/\/$/, '');
    const qs = new URLSearchParams({ ...(ref ? { ref } : {}), ch: channel });
    return { url: `${base}/e/${ev.slug}?${qs}`, ref, title: ev.title };
  });

  // ---- hype goals ---------------------------------------------------------------------------

  const GoalsInput = z.object({
    goals: z.array(z.object({
      threshold: z.number().int().min(10).max(10_000_000),
      reward: z.object({ en: z.string().trim().max(140), vi: z.string().trim().min(3).max(140) }),
    })).max(5),
  });

  const presentGoals = async (eventId: string) => {
    const rows = await many<any>(ctx.db, 'select threshold, reward, reached_at from hype_goals where event_id = $1 order by threshold', [eventId]);
    return rows.map((g) => ({ threshold: g.threshold, reward: g.reward as Localized, reached: !!g.reached_at, reachedAt: g.reached_at }));
  };

  app.get<{ Params: { id: string } }>('/organizer/events/:id/hype-goals', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const ev = await requireOwnEvent(ctx, org, req.params.id);
    return { hypeCount: ev.hype_count, goals: await presentGoals(ev.id) };
  });

  /**
   * Milestones the organiser promises something for: "500 hype → another early-bird batch".
   * Up to five. A goal already reached keeps its date when the list is saved again.
   */
  app.put<{ Params: { id: string } }>('/organizer/events/:id/hype-goals', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const ev = await requireOwnEvent(ctx, org, req.params.id);
    const { goals } = parse(GoalsInput, req.body);
    const thresholds = goals.map((g) => g.threshold);
    if (new Set(thresholds).size !== thresholds.length) throw badRequest('duplicate_goal', L('Each goal needs its own number', 'Mỗi mốc cần một con số riêng'));
    const now = ctx.clock.now();
    await ctx.db.tx(async (q) => {
      await q.query('delete from hype_goals where event_id = $1 and not (threshold = any($2::int[]))', [ev.id, thresholds.length ? thresholds : [0]]);
      for (const g of goals) {
        await q.query(
          `insert into hype_goals (event_id, threshold, reward, created_at) values ($1,$2,$3,$4)
           on conflict (event_id, threshold) do update set reward = excluded.reward`,
          [ev.id, g.threshold, json({ en: g.reward.en || g.reward.vi, vi: g.reward.vi }), now]);
      }
      await q.query(`update hype_goals set reached_at = $2 where event_id = $1 and reached_at is null and threshold <= (select hype_count from events where id = $1)`, [ev.id, now]);
    });
    return { goals: await presentGoals(ev.id), message: L('Hype goals saved', 'Đã lưu mốc hype') };
  });
}

/** Who brought a visitor, from the share link they arrived on. Used by POST /events/:id/track. */
export async function recordShareVisit(app: FastifyInstance, eventId: string, ref: string, channel: string, visitor: string) {
  const ctx = app.ctx;
  const sharer = await one<{ id: string }>(ctx.db, 'select id from users where ref_code = $1', [ref]);
  if (!sharer) return false;
  const ins = await one(ctx.db,
    `insert into share_visits (event_id, ref_user, visitor, channel, created_at) values ($1,$2,$3,$4,$5) on conflict do nothing returning 1`,
    [eventId, sharer.id, sha256(visitor).slice(0, 32), channel, ctx.clock.now()]);
  return !!ins;
}

