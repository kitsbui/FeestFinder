import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { Ctx } from '../../context.ts';
import type { Queryable } from '../../db/index.ts';
import { json, many, one } from '../../db/index.ts';
import { badRequest, conflict, notFound } from '../../lib/errors.ts';
import { L, REJECT_REASONS, REPORT_CATEGORY, type Localized } from '../../lib/i18n.ts';
import { initialsOf } from '../../lib/contact.ts';
import { parse, uuid } from '../../lib/validate.ts';
import { requireAdmin, type UserSession } from '../../http/guards.ts';
import { appendAudit, type DiffRow } from '../../services/audit.ts';
import { announceNewListing } from '../../services/listing.ts';
import { notifyOrganizer } from '../../services/notify.ts';
import { assessRisk, riskBand, SLA_HOURS } from '../../services/risk.ts';
import { moderationThread } from '../organizer/inbox.ts';

const hm = (min: number) => `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}m`;

function sla(minutes: number): { state: 'ok' | 'soon' | 'breach'; label: Localized } {
  if (minutes >= SLA_HOURS * 60) return { state: 'breach', label: L(`past SLA · ${hm(minutes)}`, `Quá hạn · ${hm(minutes)}`) };
  if (minutes >= (SLA_HOURS - 2) * 60) return { state: 'soon', label: L(`due soon · ${hm(minutes)}`, `Sắp quá hạn · ${hm(minutes)}`) };
  return { state: 'ok', label: L(`waiting ${hm(minutes)}`, `Chờ ${hm(minutes)}`) };
}

const QUEUE_SQL = `
  select e.id, e.slug, e.title, e.art, e.cover_url, e.starts_on, e.start_time, e.venue_name, e.flag, e.risk_score, e.signals, e.submitted_at,
         e.genre, e.area, e.entry_mode, e.price_from, e.quality_score, e.logo_url, (e.venue_id is not null or e.lat is not null) as venue_resolved,
         e.organizer_id, o.name as org_name, o.verification_state,
         not exists (select 1 from events e2 where e2.organizer_id = e.organizer_id and e2.published_at is not null and e2.id <> e.id) as new_org,
         (select count(*)::int from inbox_messages m join inbox_threads t on t.id = m.thread_id where t.event_id = e.id and t.topic = 'moderation') as thread_messages
    from events e join organizers o on o.id = e.organizer_id
   where e.status = 'in_review'`;

async function actor(q: Queryable, s: UserSession) {
  return { actorType: 'admin' as const, actorId: s.user.id, actorLabel: s.user.name || 'FeestFinder Admin' };
}

export async function approveListing(ctx: Ctx, q: Queryable, s: UserSession, eventId: string, action: 'listing.approved' | 'listing.approved_bulk' | 'appeal.overturned', extraDiff: DiffRow[] = []) {
  const now = ctx.clock.now();
  const ev = await one<any>(q, 'select * from events where id = $1 for update', [eventId]);
  if (!ev) throw notFound();
  const from = ev.status;
  await q.query(`update events set status = 'live', published_at = coalesce(published_at, $2), decided_at = $2 where id = $1`, [ev.id, now]);
  await q.query(`insert into moderation_decisions (event_id, decision, decided_by, decided_at) values ($1,$2,$3,$4)`,
    [ev.id, action === 'appeal.overturned' ? 'overturned' : 'approved', s.user.id, now]);
  const minutes = ev.submitted_at ? Math.round((now.getTime() - new Date(ev.submitted_at).getTime()) / 60000) : 0;
  await appendAudit(q, {
    at: now, ...(await actor(q, s)), action, targetType: 'event', targetId: ev.id, targetLabel: ev.title,
    diff: [{ f: 'status', a: from, b: 'live' }, ...(action === 'appeal.overturned' ? [] : [{ f: 'decision_time', a: '—', b: `${minutes}m` }]), { f: 'visible_in', a: '—', b: 'Explore · TP.HCM' }, ...extraDiff],
  });
  const hours = Math.max(1, Math.round(minutes / 60));
  await notifyOrganizer(q, now, {
    organizerId: ev.organizer_id, topic: 'moderation', kind: 'live',
    title: L(`${ev.title} is live`, `${ev.title} đã lên sóng`),
    body: L(`Approved ${hours} ${hours === 1 ? 'hour' : 'hours'} after review and now showing in Ho Chi Minh City.`, `Được duyệt sau ${hours} giờ và đang hiển thị tại TP.HCM.`),
    cta: L('View dashboard', 'Xem dashboard'), link: { screen: 'dash', eventId: ev.id },
  });
  if (!ev.published_at) await announceNewListing(q, ev.id, now);
  return ev;
}

export default async function adminModerationRoutes(app: FastifyInstance) {
  const ctx = app.ctx;

  app.get('/admin/queue', async (req) => {
    requireAdmin(req);
    const f = parse(z.object({ filter: z.enum(['all', 'breach', 'flagged', 'new', 'clean']).default('all'), sort: z.enum(['age', 'risk', 'new']).default('age') }), req.query);
    const now = ctx.clock.now();
    const rows = await many<any>(ctx.db, QUEUE_SQL, []);
    const items = rows.map((r) => {
      const waiting = Math.max(0, Math.round((now.getTime() - new Date(r.submitted_at).getTime()) / 60000));
      return {
        id: r.id, slug: r.slug, title: r.title, art: r.art, coverUrl: r.cover_url,
        organizer: { id: r.organizer_id, name: r.org_name, initials: initialsOf(r.org_name), verified: r.verification_state === 'verified', newOrganizer: r.new_org },
        startsOn: r.starts_on, startTime: r.start_time, venueName: r.venue_name,
        flagged: !!r.flag, flag: r.flag ? { code: r.flag, label: REJECT_REASONS[r.flag].label } : null,
        waitingMinutes: waiting, sla: sla(waiting),
        riskScore: r.risk_score ?? 0, riskBand: riskBand(r.risk_score ?? 0),
        signals: (r.signals ?? []).slice(0, 3), threadMessages: r.thread_messages,
        genre: r.genre, area: r.area, entryMode: r.entry_mode, priceFrom: r.price_from, qualityScore: r.quality_score,
        logoUrl: r.logo_url, venueResolved: r.venue_resolved,
      };
    });
    const keep = {
      all: () => true,
      breach: (i: any) => i.sla.state === 'breach',
      flagged: (i: any) => i.flagged,
      new: (i: any) => i.organizer.newOrganizer,
      clean: (i: any) => !i.flagged,
    };
    const sorted = items.filter(keep[f.filter]).sort((a, b) =>
      f.sort === 'age' ? b.waitingMinutes - a.waitingMinutes : f.sort === 'risk' ? b.riskScore - a.riskScore : a.waitingMinutes - b.waitingMinutes);
    const buckets = [60, 120, SLA_HOURS * 60, Infinity];
    let lo = 0;
    const ageBuckets = buckets.map((max, i) => {
      const n = items.filter((x) => x.waitingMinutes >= lo && x.waitingMinutes < max).length;
      lo = max;
      return { key: ['under_1h', '1_2h', '2_4h', 'past_sla'][i], count: n };
    });
    const oldest = items.reduce((m, x) => Math.max(m, x.waitingMinutes), 0);
    return {
      items: sorted,
      counts: Object.fromEntries(Object.entries(keep).map(([k, fn]) => [k, items.filter(fn).length])),
      ageBuckets,
      oldestMinutes: oldest,
      oldestLabel: items.length ? L(`Oldest ${hm(oldest)}`, `Cũ nhất ${hm(oldest)}`) : null,
      slaHours: SLA_HOURS,
      note: L('The promise is a decision within two working hours. Flagged listings always need a human; nothing auto-approves.',
        'Cam kết duyệt trong 2 giờ làm việc. Tin bị gắn cờ luôn cần người xem, không tự duyệt.'),
    };
  });

  /** Fresh risk signals for one listing (recomputed, since reports and link checks change them). */
  app.get<{ Params: { eventId: string } }>('/admin/listings/:eventId/risk', async (req) => {
    requireAdmin(req);
    const id = parse(uuid, req.params.eventId);
    const ev = await one<any>(ctx.db, 'select id, title from events where id = $1', [id]);
    if (!ev) throw notFound();
    const risk = await ctx.db.tx(async (q) => {
      const r = await assessRisk(q, id, ctx.clock.now());
      await q.query('update events set risk_score = $2, risk_factors = $3, signals = $4, flag = $5 where id = $1', [id, r.score, json(r.factors), json(r.signals), r.flag]);
      return r;
    });
    const band = riskBand(risk.score);
    return {
      eventId: id, title: ev.title, score: risk.score, band,
      bandLabel: { high: L('High', 'Cao'), medium: L('Medium', 'Trung bình'), low: L('Low', 'Thấp') }[band],
      factors: risk.factors.map((f) => ({ label: f.label, weight: f.bad ? f.weight : 0, bad: f.bad })),
      note: L('The score is advisory. Nothing is auto-rejected; a human still decides.', 'Điểm chỉ để tham khảo. Không có tin nào tự bị từ chối — người vẫn là người quyết định.'),
    };
  });

  app.post('/admin/listings/approve', async (req) => {
    const s = requireAdmin(req);
    const { ids } = parse(z.object({ ids: z.array(uuid).min(1).max(100) }), req.body);
    const approved: string[] = [];
    for (const id of ids) {
      await ctx.db.tx(async (q) => {
        const ev = await one<any>(q, 'select status from events where id = $1', [id]);
        if (ev?.status !== 'in_review') return;
        await approveListing(ctx, q, s, id, ids.length > 1 ? 'listing.approved_bulk' : 'listing.approved');
        approved.push(id);
      });
    }
    if (!approved.length) throw conflict('nothing_to_approve', L('Those listings are no longer waiting', 'Các tin này không còn chờ duyệt'));
    return { approved, message: approved.length > 1 ? L(`${approved.length} listings approved`, `Đã duyệt ${approved.length} tin`) : L('Approved', 'Đã duyệt') };
  });

  app.get('/admin/reject-reasons', async (req) => {
    requireAdmin(req);
    return { items: Object.entries(REJECT_REASONS).map(([code, r]) => ({ code, label: r.label, template: r.message, appealAllowed: r.appeal })) };
  });

  app.post('/admin/listings/reject', async (req) => {
    const s = requireAdmin(req);
    const body = parse(z.object({
      ids: z.array(uuid).min(1).max(100),
      code: z.enum(Object.keys(REJECT_REASONS) as [string, ...string[]]),
      message: z.string().trim().max(2000).optional(),
      allowAppeal: z.boolean().default(true),
    }), req.body);
    const reason = REJECT_REASONS[body.code];
    const allowAppeal = body.allowAppeal && reason.appeal;
    const message: Localized = body.message ? { en: body.message, vi: body.message } : reason.message;
    const now = ctx.clock.now();
    const rejected: string[] = [];
    for (const id of body.ids) {
      await ctx.db.tx(async (q) => {
        const ev = await one<any>(q, 'select * from events where id = $1 for update', [id]);
        if (ev?.status !== 'in_review') return;
        await q.query(`update events set status = 'rejected', decided_at = $2 where id = $1`, [id, now]);
        const d = await one<any>(q,
          `insert into moderation_decisions (event_id, decision, reason_code, message, allow_appeal, decided_by, decided_at) values ($1,'rejected',$2,$3,$4,$5,$6) returning id`,
          [id, body.code, message.en, allowAppeal, s.user.id, now]);
        if (allowAppeal) {
          await q.query(`insert into appeals (event_id, decision_id, reason_code, message, closes_at, created_at) values ($1,$2,$3,$4,$5,$6)`,
            [id, d.id, body.code, message.en, new Date(now.getTime() + 7 * 86400_000), now]);
        }
        const threadId = await moderationThread(q, ev, now);
        const appealLine = allowAppeal
          ? L('You can reply once within 7 days if you think this is wrong.', 'Anh/chị có thể phản hồi một lần trong 7 ngày nếu thấy chưa đúng.')
          : L('This reason code does not allow an appeal.', 'Mã lý do này không cho phép khiếu nại.');
        await q.query(`insert into inbox_messages (thread_id, sender, author_id, body, created_at) values ($1,'ff',$2,$3,$4)`, [threadId, s.user.id,
          json({ en: `${reason.label.en} (${body.code}). ${message.en}\n\n${appealLine.en}`, vi: `${reason.label.vi} (${body.code}). ${message.vi}\n\n${appealLine.vi}` }), now]);
        await q.query('update inbox_threads set organizer_unread = true, updated_at = $2 where id = $1', [threadId, now]);
        await notifyOrganizer(q, now, {
          organizerId: ev.organizer_id, topic: 'moderation', kind: 'reject',
          title: L('Listing sent back', 'Tin bị trả lại'),
          body: L(`${ev.title}: ${reason.label.en}.`, `${ev.title}: ${reason.label.vi}.`),
          cta: L('Open moderation thread', 'Mở thư kiểm duyệt'), link: { screen: 'inbox', threadId },
        });
        await appendAudit(q, {
          at: now, ...(await actor(q, s)), action: 'listing.rejected', targetType: 'event', targetId: id, targetLabel: ev.title,
          diff: [{ f: 'status', a: 'in_review', b: 'rejected' }, { f: 'reason_code', a: '—', b: body.code }, { f: 'appeal', a: '—', b: allowAppeal ? 'open 7 days' : 'none' }],
        });
        rejected.push(id);
      });
    }
    if (!rejected.length) throw conflict('nothing_to_reject', L('Those listings are no longer waiting', 'Các tin này không còn chờ duyệt'));
    return {
      rejected, appealAllowed: allowAppeal,
      message: rejected.length > 1 ? L(`${rejected.length} rejected · ${reason.label.en}`, `Đã từ chối ${rejected.length} tin · ${reason.label.vi}`) : L(`Rejected · ${reason.label.en}`, `Đã từ chối · ${reason.label.vi}`),
    };
  });

  // ---- messaging the organiser about a listing -------------------------------------

  app.get<{ Params: { eventId: string } }>('/admin/listings/:eventId/thread', async (req) => {
    requireAdmin(req);
    const ev = await one<any>(ctx.db, 'select id, title, organizer_id from events where id = $1', [parse(uuid, req.params.eventId)]);
    if (!ev) throw notFound();
    const thread = await one<any>(ctx.db, `select id from inbox_threads where event_id = $1 and topic = 'moderation' order by created_at desc limit 1`, [ev.id]);
    const msgs = thread ? await many<any>(ctx.db, 'select id, sender, body, created_at from inbox_messages where thread_id = $1 order by created_at, seq', [thread.id]) : [];
    if (thread) await ctx.db.query('update inbox_threads set admin_unread = false where id = $1', [thread.id]);
    return {
      threadId: thread?.id ?? null,
      messages: msgs.map((m) => ({ id: m.id, fromAdmin: m.sender === 'ff', body: m.body, createdAt: m.created_at })),
      quickAsks: [
        { key: 'ticket', label: L('Ticket link', 'Link vé'), text: L('The ticket link on this listing returns a 404. Please send a working link so we can approve it.', 'Link vé trên tin trả về lỗi 404. Anh/chị gửi lại link đặt vé còn hoạt động để chúng tôi duyệt nhé.') },
        { key: 'venue', label: L('Venue', 'Địa điểm'), text: L('We cannot place this address on the map. Please send the exact venue name and a nearby landmark.', 'Chúng tôi chưa đặt được địa chỉ này lên bản đồ. Anh/chị gửi tên địa điểm chính xác kèm một mốc gần đó giúp chúng tôi.') },
        { key: 'image', label: L('Original image', 'Ảnh gốc'), text: L('This image already appears in an earlier listing. Please upload an original photo of this event, 1600×900 landscape.', 'Ảnh này đã xuất hiện ở một tin trước. Vui lòng tải lên ảnh gốc của sự kiện, khổ ngang 1600×900.') },
        { key: 'permit', label: L('Permit', 'Giấy phép'), text: L('For a crowd this size we need the venue permit on file before the listing can go live.', 'Với quy mô sự kiện này, chúng tôi cần giấy phép địa điểm trước khi đăng tin.') },
      ],
      note: L('Every message is recorded in the audit log.', 'Mọi tin nhắn đều được ghi vào sổ hoạt động.'),
    };
  });

  app.post<{ Params: { eventId: string } }>('/admin/listings/:eventId/thread', async (req, reply) => {
    const s = requireAdmin(req);
    const { body } = parse(z.object({ body: z.string().trim().min(1).max(2000) }), req.body);
    const now = ctx.clock.now();
    const out = await ctx.db.tx(async (q) => {
      const ev = await one<any>(q, 'select e.id, e.title, e.organizer_id, o.name as org_name from events e join organizers o on o.id = e.organizer_id where e.id = $1', [parse(uuid, req.params.eventId)]);
      if (!ev) throw notFound();
      const threadId = await moderationThread(q, ev, now);
      const m = await one<any>(q, `insert into inbox_messages (thread_id, sender, author_id, body, created_at) values ($1,'ff',$2,$3,$4) returning id, created_at`,
        [threadId, s.user.id, json({ en: body, vi: body }), now]);
      await q.query('update inbox_threads set organizer_unread = true, updated_at = $2 where id = $1', [threadId, now]);
      await notifyOrganizer(q, now, {
        organizerId: ev.organizer_id, topic: 'moderation', kind: 'reject',
        title: L('Message from moderation', 'Tin nhắn từ kiểm duyệt'), body: { en: body.slice(0, 140), vi: body.slice(0, 140) },
        cta: L('Open moderation thread', 'Mở thư kiểm duyệt'), link: { screen: 'inbox', threadId },
      });
      await appendAudit(q, { at: now, ...(await actor(q, s)), action: 'organizer.messaged', targetType: 'event', targetId: ev.id, targetLabel: `${ev.org_name} · ${ev.title}`, diff: null });
      return { threadId, id: m.id, createdAt: m.created_at };
    });
    return reply.code(201).send({ ...out, fromAdmin: true, body: { en: body, vi: body } });
  });

  // ---- appeals ---------------------------------------------------------------------

  app.get('/admin/appeals', async (req) => {
    requireAdmin(req);
    const now = ctx.clock.now();
    const rows = await many<any>(ctx.db,
      `select a.*, e.title, e.art, e.cover_url, o.name as org_name from appeals a join events e on e.id = a.event_id join organizers o on o.id = e.organizer_id
        where a.state in ('open','replied') and a.closes_at > $1 order by (a.state = 'replied') desc, a.created_at`, [now]);
    return {
      items: rows.map((a) => ({
        id: a.id, eventId: a.event_id, title: a.title, art: a.art, coverUrl: a.cover_url, organizer: a.org_name,
        state: a.state, stateLabel: a.state === 'replied' ? L('Organizer replied', 'Đã phản hồi') : L('Awaiting reply', 'Chờ phản hồi'),
        reasonCode: a.reason_code, reason: REJECT_REASONS[a.reason_code]?.label, message: a.message, reply: a.reply,
        rejectedAt: a.created_at, repliedAt: a.replied_at,
        closesInDays: Math.max(0, Math.ceil((new Date(a.closes_at).getTime() - now.getTime()) / 86400_000)),
      })),
    };
  });

  const decideAppeal = (decision: 'overturn' | 'uphold') => async (req: any) => {
    const s = requireAdmin(req);
    const id = parse(uuid, req.params.id);
    const now = ctx.clock.now();
    const title = await ctx.db.tx(async (q) => {
      const a = await one<any>(q, 'select a.*, e.title from appeals a join events e on e.id = a.event_id where a.id = $1 for update of a', [id]);
      if (!a) throw notFound();
      if (!['open', 'replied'].includes(a.state)) throw conflict('appeal_closed', L('This appeal is already decided', 'Khiếu nại này đã có quyết định'));
      await q.query(`update appeals set state = $2, decided_by = $3, decided_at = $4 where id = $1`, [id, decision === 'overturn' ? 'overturned' : 'upheld', s.user.id, now]);
      if (decision === 'overturn') {
        await approveListing(ctx, q, s, a.event_id, 'appeal.overturned', [{ f: 'appeal', a: a.state, b: 'upheld_organizer' }]);
      } else {
        await q.query(`insert into moderation_decisions (event_id, decision, reason_code, decided_by, decided_at) values ($1,'upheld',$2,$3,$4)`, [a.event_id, a.reason_code, s.user.id, now]);
        await appendAudit(q, {
          at: now, ...(await actor(q, s)), action: 'appeal.upheld', targetType: 'event', targetId: a.event_id, targetLabel: a.title,
          diff: [{ f: 'appeal', a: a.state, b: 'closed_upheld' }, { f: 'reason_code', a: a.reason_code, b: a.reason_code }],
        });
      }
      return a.title;
    });
    return { ok: true, message: decision === 'overturn' ? L(`Overturned · ${title}`, `Đã lật lại · ${title}`) : L('Rejection upheld', 'Đã giữ quyết định') };
  };
  app.post<{ Params: { id: string } }>('/admin/appeals/:id/overturn', decideAppeal('overturn'));
  app.post<{ Params: { id: string } }>('/admin/appeals/:id/uphold', decideAppeal('uphold'));

  // ---- user reports ------------------------------------------------------------------

  const CATEGORY_LABEL: Record<string, Localized> = {
    refund: L('Refund claim', 'Đòi hoàn tiền'), wrong: L('Wrong details', 'Sai thông tin'),
    price: L('Price mismatch', 'Giá không đúng'), safety: L('Safety', 'An toàn'),
  };

  app.get('/admin/reports', async (req) => {
    requireAdmin(req);
    const now = ctx.clock.now();
    const rows = await many<any>(ctx.db,
      `select r.event_id, r.code, r.note, r.created_at, r.user_id, e.title, e.status, e.held_for_reports
         from listing_reports r join events e on e.id = r.event_id where r.resolved_at is null order by r.created_at`);
    const groups = new Map<string, any>();
    for (const r of rows) {
      const category = REPORT_CATEGORY[r.code];
      const key = `${r.event_id}:${category}`;
      const g = groups.get(key) ?? { id: key, eventId: r.event_id, category, subject: r.title, eventStatus: r.status, heldFromFeed: r.held_for_reports, reporters: new Set<string>(), oldest: r.created_at, quote: null };
      g.reporters.add(r.user_id);
      if (r.note) g.quote = r.note;
      groups.set(key, g);
    }
    const stats = await many<any>(ctx.db, `select code, count(*)::int as n from listing_reports where created_at > $1 group by code`, [new Date(now.getTime() - 30 * 86400_000)]);
    const byCat: Record<string, number> = { refund: 0, wrong: 0, price: 0, safety: 0 };
    for (const s of stats) byCat[REPORT_CATEGORY[s.code]] += s.n;
    return {
      items: [...groups.values()]
        .sort((a, b) => b.reporters.size - a.reporters.size)
        .map((g) => ({
          id: g.id, eventId: g.eventId, category: g.category, categoryLabel: CATEGORY_LABEL[g.category], subject: g.subject,
          eventStatus: g.eventStatus, heldFromFeed: g.heldFromFeed, count: g.reporters.size, quote: g.quote,
          ageMinutes: Math.round((now.getTime() - new Date(g.oldest).getTime()) / 60000),
        })),
      last30Days: Object.entries(byCat).map(([category, count]) => ({ category, label: CATEGORY_LABEL[category], count })),
    };
  });

  const resolveReports = async (q: Queryable, eventId: string, category: string | null, resolution: string, now: Date) => {
    const codes = category ? Object.entries(REPORT_CATEGORY).filter(([, c]) => c === category).map(([k]) => k) : Object.keys(REPORT_CATEGORY);
    const res = await many(q, `update listing_reports set resolved_at = $3, resolution = $4 where event_id = $1 and code = any($2::text[]) and resolved_at is null returning 1`, [eventId, codes, now, resolution]);
    const open = await one<any>(q, 'select count(*)::int as n from listing_reports where event_id = $1 and resolved_at is null', [eventId]);
    if (open.n === 0) await q.query('update events set held_for_reports = false where id = $1', [eventId]);
    return { resolved: res.length, stillOpen: open.n };
  };

  app.post<{ Params: { eventId: string } }>('/admin/reports/:eventId/take-down', async (req) => {
    const s = requireAdmin(req);
    const eventId = parse(uuid, req.params.eventId);
    const { code } = parse(z.object({ code: z.enum(Object.keys(REJECT_REASONS) as [string, ...string[]]).optional() }), req.body ?? {});
    const now = ctx.clock.now();
    const title = await ctx.db.tx(async (q) => {
      const ev = await one<any>(q, 'select * from events where id = $1 for update', [eventId]);
      if (!ev) throw notFound();
      if (ev.status === 'removed') throw conflict('already_removed', L('This listing is already down', 'Tin này đã bị hạ'));
      const open = await one<any>(q, 'select count(*)::int as n from listing_reports where event_id = $1 and resolved_at is null', [eventId]);
      await q.query(`update events set status = 'removed', decided_at = $2 where id = $1`, [eventId, now]);
      await resolveReports(q, eventId, null, 'taken_down', now);
      await q.query(`insert into moderation_decisions (event_id, decision, reason_code, decided_by, decided_at) values ($1,'taken_down',$2,$3,$4)`, [eventId, code ?? null, s.user.id, now]);
      await notifyOrganizer(q, now, {
        organizerId: ev.organizer_id, topic: 'moderation', kind: 'reject',
        title: L('Listing taken down', 'Tin đã bị hạ'), body: L(`${ev.title} was removed after user reports.`, `${ev.title} đã bị hạ sau báo cáo của người dùng.`),
        cta: L('Open moderation thread', 'Mở thư kiểm duyệt'), link: { screen: 'inbox' },
      });
      await appendAudit(q, {
        at: now, ...(await actor(q, s)), action: 'listing.taken_down', targetType: 'event', targetId: eventId, targetLabel: ev.title,
        diff: [{ f: 'status', a: ev.status, b: 'removed' }, ...(code ? [{ f: 'reason_code', a: '—', b: code }] : []), { f: 'reports_open', a: String(open.n), b: '0' }],
      });
      return ev.title;
    });
    return { ok: true, message: L(`Taken down · ${title}`, `Đã hạ · ${title}`) };
  });

  app.post<{ Params: { eventId: string } }>('/admin/reports/:eventId/warn', async (req) => {
    const s = requireAdmin(req);
    const eventId = parse(uuid, req.params.eventId);
    const { category } = parse(z.object({ category: z.enum(['refund', 'wrong', 'price', 'safety']).optional() }), req.body ?? {});
    const now = ctx.clock.now();
    const strikes = await ctx.db.tx(async (q) => {
      const ev = await one<any>(q, 'select e.*, o.name as org_name, o.strikes from events e join organizers o on o.id = e.organizer_id where e.id = $1', [eventId]);
      if (!ev) throw notFound();
      const next = ev.strikes + 1;
      await q.query(`update organizers set strikes = $2, suspended_at = case when $2 >= 3 then coalesce(suspended_at, $3::timestamptz) else suspended_at end where id = $1`, [ev.organizer_id, next, now]);
      await resolveReports(q, eventId, category ?? null, 'warned', now);
      await notifyOrganizer(q, now, {
        organizerId: ev.organizer_id, topic: 'moderation', kind: 'reject',
        title: L('Warning from FeestFinder', 'Cảnh báo từ FeestFinder'),
        body: L(`Users reported ${ev.title}. This is warning ${next} of 3; the account is suspended at 3.`, `Người dùng đã báo cáo ${ev.title}. Đây là cảnh báo ${next}/3; tài khoản bị tạm dừng ở lần thứ 3.`),
        link: { screen: 'inbox' },
      });
      await appendAudit(q, {
        at: now, ...(await actor(q, s)), action: 'organizer.warned', targetType: 'organizer', targetId: ev.organizer_id, targetLabel: ev.org_name,
        diff: [{ f: 'strikes', a: String(ev.strikes), b: String(next) }, { f: 'next_step', a: '—', b: next >= 3 ? 'suspended' : 'suspension at 3' }],
      });
      return next;
    });
    return { ok: true, strikes, message: L('Warning sent', 'Đã gửi cảnh báo') };
  });

  app.post<{ Params: { eventId: string } }>('/admin/reports/:eventId/dismiss', async (req) => {
    const s = requireAdmin(req);
    const eventId = parse(uuid, req.params.eventId);
    const { category } = parse(z.object({ category: z.enum(['refund', 'wrong', 'price', 'safety']).optional() }), req.body ?? {});
    const now = ctx.clock.now();
    const out = await ctx.db.tx(async (q) => {
      const ev = await one<any>(q, 'select id, title from events where id = $1', [eventId]);
      if (!ev) throw notFound();
      const r = await resolveReports(q, eventId, category ?? null, 'dismissed', now);
      if (!r.resolved) throw badRequest('no_open_reports', L('No open reports to dismiss', 'Không có báo cáo nào để bỏ qua'));
      await appendAudit(q, {
        at: now, ...(await actor(q, s)), action: 'report.dismissed', targetType: 'event', targetId: eventId, targetLabel: ev.title,
        diff: [{ f: 'reports_open', a: String(r.resolved + r.stillOpen), b: String(r.stillOpen) }],
      });
      return r;
    });
    return { ok: true, ...out, message: L('Dismissed', 'Đã bỏ qua') };
  });
}
