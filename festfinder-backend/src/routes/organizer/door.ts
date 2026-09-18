import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { Ctx } from '../../context.ts';
import type { Queryable } from '../../db/index.ts';
import { many, one } from '../../db/index.ts';
import { badRequest, conflict, forbidden, notFound } from '../../lib/errors.ts';
import { fill, L, type Localized } from '../../lib/i18n.ts';
import { formatVnPhone, normalizeVnPhone } from '../../lib/contact.ts';
import { vnTime } from '../../lib/time.ts';
import { parse, uuid } from '../../lib/validate.ts';
import { requireDoorAccess, requireOrganizer, requireOwnEvent } from '../../http/guards.ts';
import { createSession, setSessionCookie } from '../../http/session.ts';
import { enqueue } from '../../services/notify.ts';
import { deliverDue } from '../../services/messaging.ts';
import { eventScanKey, readQrToken, verifyQrSignature } from '../../services/tickets.ts';
import { checkOtp, startOtp } from '../auth.ts';

const GATE_LABEL: Record<string, Localized> = { main: L('main gate', 'cổng chính'), vip: L('VIP gate', 'cổng VIP'), side: L('side gate', 'cổng phụ') };

type ScanInput = { token: string; deviceId: string; clientScanId: string; scannedAt?: string; gate?: 'main' | 'vip' | 'side'; manual?: boolean };

interface ScanResult {
  clientScanId: string;
  result: 'valid' | 'duplicate' | 'invalid';
  reason: string | null;
  message: Localized;
  detail: Localized;
  holder: { name: string; tier: string | null } | null;
  time: string;
  queued: boolean;
}

function describe(result: ScanResult['result'], reason: string | null, extra: { tier?: string | null; at?: Date; gate?: string | null; queued: boolean }): { message: Localized; detail: Localized } {
  if (result === 'valid') {
    const tier = extra.tier ?? 'GA';
    return {
      message: L('Valid — let them in', 'Hợp lệ — mời vào'),
      detail: extra.queued ? L(`${tier} · saved offline, will sync`, `${tier} · lưu offline, chờ đồng bộ`) : L(`${tier} · e-ticket`, `${tier} · vé điện tử`),
    };
  }
  if (result === 'duplicate') {
    const gate = extra.gate ? GATE_LABEL[extra.gate] : L('the door', 'cửa');
    const time = extra.at ? vnTime(extra.at) : '—';
    return {
      message: L('Already used — call a gate lead', 'Vé đã dùng — gọi trưởng cửa'),
      detail: L(`Already scanned ${time} at the ${gate.en}`, `Đã quét lúc ${time} tại ${gate.vi}`),
    };
  }
  const detail = {
    refunded: L('Refunded ticket — do not admit', 'Vé đã hoàn tiền — không cho vào'),
    void: L('Cancelled ticket — do not admit', 'Vé đã huỷ — không cho vào'),
    wrong_event: L('Code not from this event', 'Mã không thuộc sự kiện này'),
    unknown: L('Code not from this event', 'Mã không thuộc sự kiện này'),
    bad_signature: L('QR code is not genuine', 'Mã QR không hợp lệ'),
  }[reason ?? 'unknown'] ?? L('Code not from this event', 'Mã không thuộc sự kiện này');
  return { message: L('Rejected', 'Từ chối'), detail };
}

/**
 * Validates one scan and records it. Idempotent per (device, clientScanId), so a scanner
 * that retries after a timeout, or re-sends its offline queue, never double-counts.
 */
async function processScan(ctx: Ctx, q: Queryable, ev: any, input: ScanInput, access: { staffId: string | null; lead: boolean; gate: string | null }, offline: boolean): Promise<ScanResult> {
  const existing = await one<any>(q,
    `select s.*, t.holder_name, tt.name as tier_name from scans s left join tickets t on t.id = s.ticket_id left join ticket_tiers tt on tt.id = t.tier_id
      where s.device_id = $1 and s.client_scan_id = $2`, [input.deviceId, input.clientScanId]);
  if (existing) {
    const d = describe(existing.result, existing.reason, { tier: existing.tier_name?.en, queued: existing.was_offline, gate: existing.gate });
    return { clientScanId: input.clientScanId, result: existing.result, reason: existing.reason, ...d,
      holder: existing.ticket_id ? { name: existing.holder_name, tier: existing.tier_name?.en ?? null } : null,
      time: vnTime(new Date(existing.scanned_at)), queued: existing.was_offline };
  }

  const now = ctx.clock.now();
  const scannedAt = input.scannedAt ? new Date(input.scannedAt) : now;
  const gate = input.gate ?? access.gate ?? 'main';
  const { code, sig } = readQrToken(input.token);
  await q.query('select pg_advisory_xact_lock(hashtext($1))', [code]);
  const ticket = await one<any>(q,
    `select t.*, tt.name as tier_name, tt.key as tier_key from tickets t left join ticket_tiers tt on tt.id = t.tier_id where t.code = $1 for update of t`, [code]);

  let result: ScanResult['result'] = 'valid';
  let reason: string | null = null;
  if (!sig && !(input.manual && access.lead)) { result = 'invalid'; reason = 'bad_signature'; }
  else if (sig && !verifyQrSignature(eventScanKey(ctx.config.ticketSigningSecret, ev.id), code, sig)) {
    result = 'invalid';
    reason = ticket && ticket.event_id !== ev.id ? 'wrong_event' : 'bad_signature';
  }
  else if (!ticket) { result = 'invalid'; reason = 'unknown'; }
  else if (ticket.event_id !== ev.id) { result = 'invalid'; reason = 'wrong_event'; }
  else if (ticket.status === 'refunded' || ticket.status === 'void') { result = 'invalid'; reason = ticket.status; }
  else if (ticket.status === 'used') { result = 'duplicate'; reason = offline ? 'conflict' : 'already_used'; }

  if (result === 'valid') {
    await q.query(`update tickets set status = 'used', checked_in_at = $2, checked_in_gate = $3, checked_in_by = $4 where id = $1`, [ticket.id, scannedAt, gate, access.staffId]);
  }
  await q.query(
    `insert into scans (event_id, ticket_id, code, staff_id, gate, device_id, client_scan_id, result, reason, scanned_at, received_at, was_offline)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [ev.id, ticket?.event_id === ev.id ? ticket.id : null, code, access.staffId, gate, input.deviceId, input.clientScanId, result, reason, scannedAt, now, offline]);
  if (access.staffId) await q.query('update event_staff set scan_count = scan_count + 1, last_seen_at = $2 where id = $1', [access.staffId, now]);

  const d = describe(result, reason, {
    tier: ticket?.tier_name?.en ?? (ticket?.kind === 'guest' ? 'Guest' : null),
    at: ticket?.checked_in_at ? new Date(ticket.checked_in_at) : undefined,
    gate: ticket?.checked_in_gate, queued: offline,
  });
  const showHolder = ticket && ticket.event_id === ev.id;
  return {
    clientScanId: input.clientScanId, result, reason, ...d,
    holder: showHolder ? { name: ticket.holder_name, tier: ticket.tier_name?.en ?? null } : null,
    time: vnTime(scannedAt), queued: offline,
  };
}

export default async function doorRoutes(app: FastifyInstance) {
  const ctx = app.ctx;

  const eventFor = async (id: string) => {
    const ev = await one<any>(ctx.db, 'select id, slug, title, organizer_id, starts_on, ends_on, start_time, end_time, venue_name, capacity from events where id = $1', [parse(uuid, id)]);
    if (!ev) throw notFound();
    return ev;
  };

  // ---- door staff roster (organiser) --------------------------------------------

  const presentStaff = (p: any, now: Date) => ({
    id: p.id, name: p.name, phone: formatVnPhone(p.phone), gate: p.gate, role: p.role,
    status: p.active ? 'scanning' : p.accepted_at ? 'paused' : 'invited',
    scanCount: p.scan_count,
    online: !!p.last_seen_at && now.getTime() - new Date(p.last_seen_at).getTime() < 10 * 60_000,
  });

  app.get<{ Params: { id: string } }>('/organizer/events/:id/staff', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const ev = await requireOwnEvent(ctx, org, req.params.id);
    const rows = await many<any>(ctx.db, 'select * from event_staff where event_id = $1 order by invited_at', [ev.id]);
    return {
      items: rows.map((p) => presentStaff(p, ctx.clock.now())),
      note: L('Invites go out by SMS. They sign in with that number — no separate account needed.', 'Lời mời gửi qua tin nhắn. Người nhận đăng nhập bằng số điện thoại đó, không cần tài khoản riêng.'),
    };
  });

  app.post<{ Params: { id: string } }>('/organizer/events/:id/staff', async (req, reply) => {
    const org = await requireOrganizer(ctx, req);
    const ev = await requireOwnEvent(ctx, org, req.params.id);
    const body = parse(z.object({ name: z.string().max(80), phone: z.string().max(30), gate: z.enum(['main', 'vip', 'side']).default('main'), role: z.enum(['scanner', 'lead']).default('scanner') }), req.body);
    if (body.name.trim().length < 2) throw badRequest('name_required', L('Enter the scanner’s name.', 'Nhập tên người soát vé.'));
    const phone = normalizeVnPhone(body.phone);
    if (!phone) throw badRequest('invalid_phone', L('That phone number does not look right.', 'Số điện thoại chưa hợp lệ.'));
    const dup = await one(ctx.db, 'select 1 from event_staff where event_id = $1 and phone = $2', [ev.id, phone]);
    if (dup) throw conflict('staff_exists', L('That number is already on the roster.', 'Số này đã có trong danh sách.'));
    const now = ctx.clock.now();
    const row = await ctx.db.tx(async (q) => {
      const p = await one<any>(q, 'insert into event_staff (event_id, name, phone, gate, role, invited_at) values ($1,$2,$3,$4,$5,$6) returning *',
        [ev.id, body.name.trim(), phone, body.gate, body.role, now]);
      await enqueue(q, null, 'sms', phone, 'staff_invite', {
        lang: 'vi',
        title: L(`You're on the door for ${ev.title}`, `Bạn soát vé cho ${ev.title}`),
        body: L(`Sign in to FestFinder Door with this number: ${ctx.config.publicBaseUrl}/door`, `Đăng nhập FestFinder Door bằng số này: ${ctx.config.publicBaseUrl}/door`),
      }, now);
      return p;
    });
    deliverDue(ctx.db, ctx.clock, ctx.transport).catch(() => {});
    return reply.code(201).send({ ...presentStaff(row, now), message: fill(L('Scanner invite sent to {n}', 'Đã gửi lời mời soát vé cho {n}'), { n: row.name }) });
  });

  app.patch<{ Params: { id: string; staffId: string } }>('/organizer/events/:id/staff/:staffId', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const ev = await requireOwnEvent(ctx, org, req.params.id);
    const body = parse(z.object({ active: z.boolean().optional(), gate: z.enum(['main', 'vip', 'side']).optional(), role: z.enum(['scanner', 'lead']).optional() }), req.body);
    const p = await one<any>(ctx.db,
      `update event_staff set active = coalesce($3, active), gate = coalesce($4, gate), role = coalesce($5, role)
        where id = $1 and event_id = $2 returning *`, [parse(uuid, req.params.staffId), ev.id, body.active ?? null, body.gate ?? null, body.role ?? null]);
    if (!p) throw notFound();
    const message = body.active === undefined ? null : body.active
      ? L(`${p.name} can scan now`, `${p.name} có thể soát vé`) : L(`${p.name} can no longer scan`, `${p.name} đã tạm ngưng soát vé`);
    return { ...presentStaff(p, ctx.clock.now()), message };
  });

  app.delete<{ Params: { id: string; staffId: string } }>('/organizer/events/:id/staff/:staffId', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const ev = await requireOwnEvent(ctx, org, req.params.id);
    const p = await one<any>(ctx.db, 'delete from event_staff where id = $1 and event_id = $2 returning name', [parse(uuid, req.params.staffId), ev.id]);
    if (!p) throw notFound();
    return { ok: true, message: fill(L('Removed {n}', 'Đã xoá {n}'), { n: p.name }) };
  });

  // ---- scanner sign-in ------------------------------------------------------------

  app.post('/door/auth/start', async (req) => {
    const { phone } = parse(z.object({ phone: z.string().max(30) }), req.body);
    const e164 = normalizeVnPhone(phone);
    if (!e164) throw badRequest('invalid_phone', L('Enter a valid Vietnamese phone number', 'Nhập số điện thoại Việt Nam hợp lệ'));
    const invited = await one(ctx.db,
      `select 1 from event_staff s join events e on e.id = s.event_id where s.phone = $1 and e.ends_at > $2`, [e164, ctx.clock.now()]);
    if (!invited) throw notFound(L('This number has not been invited to scan', 'Số này chưa được mời soát vé'));
    const out = await ctx.db.tx((q) => startOtp(ctx, q, { purpose: 'staff', channel: 'sms', identifier: e164 }));
    deliverDue(ctx.db, ctx.clock, ctx.transport).catch(() => {});
    return out;
  });

  app.post('/door/auth/verify', async (req, reply) => {
    const body = parse(z.object({ challengeId: uuid, code: z.string(), eventId: uuid.optional() }), req.body);
    const ch = await checkOtp(ctx, body.challengeId, body.code, 'staff');
    const now = ctx.clock.now();
    const rows = await many<any>(ctx.db,
      `select s.*, e.title, e.starts_on from event_staff s join events e on e.id = s.event_id
        where s.phone = $1 and e.ends_at > $2 order by e.starts_at`, [ch.identifier, now]);
    const choice = body.eventId ? rows.find((r) => r.event_id === body.eventId) : rows.length === 1 ? rows[0] : null;
    if (!choice) {
      return { next: 'pick_event', events: rows.map((r) => ({ eventId: r.event_id, title: r.title, startsOn: r.starts_on })) };
    }
    if (choice.accepted_at && !choice.active) throw forbidden('staff_paused', L('Your scanning access is paused. Ask the gate lead.', 'Quyền soát vé đang tạm ngưng. Hãy hỏi trưởng cửa.'));
    await ctx.db.query('update event_staff set accepted_at = coalesce(accepted_at, $2), active = true, last_seen_at = $2 where id = $1', [choice.id, now]);
    const { token, expiresAt } = await createSession(ctx.db, now, { kind: 'staff', staffId: choice.id });
    setSessionCookie(ctx, reply, token, expiresAt);
    return { token, expiresAt, staff: { id: choice.id, name: choice.name, gate: choice.gate, role: choice.role }, event: { id: choice.event_id, title: choice.title, startsOn: choice.starts_on } };
  });

  // ---- scanning --------------------------------------------------------------------

  /**
   * Everything a scanner needs to keep working with no signal: the event's scan key
   * (verifies QR signatures locally) and the status of every ticket code.
   */
  app.get<{ Params: { id: string } }>('/door/events/:id/manifest', async (req) => {
    const ev = await eventFor(req.params.id);
    const access = await requireDoorAccess(ctx, req, ev.id);
    const now = ctx.clock.now();
    if (access.staffId) await ctx.db.query('update event_staff set last_seen_at = $2 where id = $1', [access.staffId, now]);
    const tickets = await many<any>(ctx.db,
      `select t.code, t.status, t.holder_name, tt.key as tier from tickets t left join ticket_tiers tt on tt.id = t.tier_id where t.event_id = $1`, [ev.id]);
    return {
      event: { id: ev.id, title: ev.title, startsOn: ev.starts_on, startTime: ev.start_time, endTime: ev.end_time, venueName: ev.venue_name },
      scanKey: eventScanKey(ctx.config.ticketSigningSecret, ev.id),
      signature: 'HMAC-SHA256(scanKey, code), base64url, first 22 chars; QR = "<code>.<signature>"',
      generatedAt: now,
      tickets: tickets.map((t) => ({
        code: t.code, status: t.status, tier: t.tier,
        // Scanners only need a first name to greet someone; leads get the full name.
        name: access.lead ? t.holder_name : String(t.holder_name).split(' ').slice(-1)[0],
      })),
    };
  });

  app.post<{ Params: { id: string } }>('/door/events/:id/scans', async (req) => {
    const ev = await eventFor(req.params.id);
    const access = await requireDoorAccess(ctx, req, ev.id);
    const input = parse(z.object({
      token: z.string().min(4).max(200), deviceId: z.string().min(1).max(100), clientScanId: z.string().min(1).max(100),
      scannedAt: z.string().datetime({ offset: true }).optional(), gate: z.enum(['main', 'vip', 'side']).optional(), manual: z.boolean().optional(),
    }), req.body);
    return ctx.db.tx((q) => processScan(ctx, q, ev, input, access, false));
  });

  /** Upload scans taken with no signal. Processed in the order they happened. */
  app.post<{ Params: { id: string } }>('/door/events/:id/scans/sync', async (req) => {
    const ev = await eventFor(req.params.id);
    const access = await requireDoorAccess(ctx, req, ev.id);
    const body = parse(z.object({
      deviceId: z.string().min(1).max(100),
      scans: z.array(z.object({
        token: z.string().min(4).max(200), clientScanId: z.string().min(1).max(100),
        scannedAt: z.string().datetime({ offset: true }), gate: z.enum(['main', 'vip', 'side']).optional(),
      })).max(2000),
    }), req.body);
    const ordered = [...body.scans].sort((a, b) => a.scannedAt.localeCompare(b.scannedAt));
    const results: ScanResult[] = [];
    for (const s of ordered) {
      results.push(await ctx.db.tx((q) => processScan(ctx, q, ev, { ...s, deviceId: body.deviceId }, access, true)));
    }
    const count = (r: string) => results.filter((x) => x.result === r).length;
    return {
      synced: results.length,
      summary: { valid: count('valid'), duplicate: count('duplicate'), invalid: count('invalid') },
      results,
      message: fill(L('{n} scans synced', 'Đã đồng bộ {n} lượt quét'), { n: results.length }),
    };
  });

  app.get<{ Params: { id: string } }>('/door/events/:id/summary', async (req) => {
    const ev = await eventFor(req.params.id);
    await requireDoorAccess(ctx, req, ev.id);
    const now = ctx.clock.now();
    const [inside, cap, hour, recent, staff, sync] = await Promise.all([
      one<any>(ctx.db,
        `select (select count(*)::int from tickets where event_id = $1 and status = 'used')
              + (select coalesce(sum(seats), 0)::int from guest_list where event_id = $1 and checked_in) as n`, [ev.id]),
      one<any>(ctx.db, 'select coalesce(sum(capacity), 0)::int as n from ticket_tiers where event_id = $1', [ev.id]),
      one<any>(ctx.db, `select count(*)::int as n from scans where event_id = $1 and result = 'valid' and scanned_at > $2`, [ev.id, new Date(now.getTime() - 3600_000)]),
      many<any>(ctx.db,
        `select s.result, s.reason, s.scanned_at, s.was_offline, s.gate, t.holder_name, tt.name as tier_name, t.checked_in_at, t.checked_in_gate
           from scans s left join tickets t on t.id = s.ticket_id left join ticket_tiers tt on tt.id = t.tier_id
          where s.event_id = $1 order by s.received_at desc limit 6`, [ev.id]),
      many<any>(ctx.db, 'select * from event_staff where event_id = $1 order by invited_at', [ev.id]),
      one<any>(ctx.db, `select max(received_at) as at from scans where event_id = $1 and was_offline`, [ev.id]),
    ]);
    const capacity = ev.capacity ?? cap.n;
    const activeScanners = staff.filter((p) => p.active && p.last_seen_at && now.getTime() - new Date(p.last_seen_at).getTime() < 10 * 60_000).length;
    return {
      inside: inside.n, capacity, insidePct: capacity ? Math.round((inside.n / capacity) * 100) : 0,
      throughputPerHour: hour.n,
      recent: recent.map((r) => ({
        name: r.holder_name ?? '—', tier: r.tier_name ?? null, result: r.result, reason: r.reason, time: vnTime(new Date(r.scanned_at)), queued: r.was_offline,
        ...describe(r.result, r.reason, { tier: r.tier_name?.en, at: r.checked_in_at ? new Date(r.checked_in_at) : undefined, gate: r.checked_in_gate, queued: r.was_offline }),
      })),
      staff: staff.map((p) => presentStaff(p, now)),
      scannersActive: activeScanners,
      lastSyncedAt: sync.at,
      offlineNote: L('Scanning works offline. Scans sync automatically once the connection is back.', 'Quét được khi mất mạng. Dữ liệu tự đồng bộ khi có lại kết nối.'),
    };
  });
}
