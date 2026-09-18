import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { json, many, one } from '../../db/index.ts';
import { badRequest, conflict, notFound } from '../../lib/errors.ts';
import { fill, L } from '../../lib/i18n.ts';
import { toCsv } from '../../lib/csv.ts';
import { addDays, vnDate } from '../../lib/time.ts';
import { localized, parse, uuid } from '../../lib/validate.ts';
import { requireOrganizer, requireOwnEvent } from '../../http/guards.ts';
import { PAYOUT_POLICY, payoutLedger, revenueTotals } from '../../services/payouts.ts';

export default async function organizerMoneyRoutes(app: FastifyInstance) {
  const ctx = app.ctx;

  // ---- promo codes ------------------------------------------------------------

  const presentPromo = (c: any) => ({
    id: c.id, code: c.code, pct: c.pct, note: c.note, used: c.used, cap: c.cap,
    usedPct: Math.min(100, Math.round((c.used / c.cap) * 100)), nearlyUsedUp: c.used / c.cap > 0.85,
    active: c.active, value: c.pct === 100 ? L('Free', 'Miễn phí') : L(`−${c.pct}%`, `−${c.pct}%`),
  });

  app.get<{ Params: { id: string } }>('/organizer/events/:id/promos', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const ev = await requireOwnEvent(ctx, org, req.params.id);
    const codes = await many<any>(ctx.db, 'select * from promo_codes where event_id = $1 order by created_at', [ev.id]);
    const stats = await one<any>(ctx.db,
      `select coalesce(sum(qty) filter (where promo_code_id is not null), 0)::int as tickets_with_code,
              coalesce(sum(discount), 0)::bigint as discount
         from orders where event_id = $1 and status = 'paid'`, [ev.id]);
    return {
      items: codes.map(presentPromo),
      stats: { redemptions: codes.reduce((n, c) => n + c.used, 0), ticketsWithCode: stats.tickets_with_code, discountGiven: stats.discount },
      tip: L('Cap the 100%-off crew code. A shared crew code is the most common way tickets leak.', 'Mã giảm 100% dành cho crew nên đặt giới hạn số lượt — mã bị chia sẻ là lý do thất thoát vé phổ biến nhất.'),
    };
  });

  app.post<{ Params: { id: string } }>('/organizer/events/:id/promos', async (req, reply) => {
    const org = await requireOrganizer(ctx, req);
    const ev = await requireOwnEvent(ctx, org, req.params.id);
    const body = parse(z.object({
      code: z.string().max(24), pct: z.number().int(), cap: z.number().int().min(1).max(100_000).default(500), note: localized.optional(),
    }), req.body);
    const code = body.code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length < 3) throw badRequest('code_required', L('Enter a code', 'Nhập tên mã'));
    if (body.pct < 1 || body.pct > 100) throw badRequest('pct_range', L('Enter 1–100%', 'Nhập % từ 1 đến 100'));
    const row = await one<any>(ctx.db,
      `insert into promo_codes (event_id, code, pct, cap, note) values ($1,$2,$3,$4,$5) on conflict (event_id, code) do nothing returning *`,
      [ev.id, code, body.pct, body.cap, json(body.note ?? L('Created just now', 'Vừa tạo'))]);
    if (!row) throw conflict('code_exists', L('That code already exists for this event', 'Mã này đã có cho sự kiện'));
    return reply.code(201).send({ ...presentPromo(row), message: L(`${code} is live`, `${code} đang chạy`) });
  });

  app.patch<{ Params: { id: string; promoId: string } }>('/organizer/events/:id/promos/:promoId', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const ev = await requireOwnEvent(ctx, org, req.params.id);
    const body = parse(z.object({ active: z.boolean().optional(), cap: z.number().int().min(1).max(100_000).optional(), note: localized.optional() }), req.body);
    const row = await one<any>(ctx.db,
      `update promo_codes set active = coalesce($3, active), cap = greatest(coalesce($4, cap), used), note = coalesce($5, note)
        where id = $1 and event_id = $2 returning *`,
      [parse(uuid, req.params.promoId), ev.id, body.active ?? null, body.cap ?? null, body.note ? json(body.note) : null]);
    if (!row) throw notFound();
    const message = body.active === undefined ? null : body.active ? L(`${row.code} is live`, `Đã bật ${row.code}`) : L(`Paused ${row.code}`, `Đã tắt ${row.code}`);
    return { ...presentPromo(row), message };
  });

  // ---- guest list ---------------------------------------------------------------

  const presentGuest = (g: any) => ({ id: g.id, name: g.name, note: g.note, seats: g.seats, checkedIn: g.checked_in, checkedInAt: g.checked_in_at });

  app.get<{ Params: { id: string } }>('/organizer/events/:id/guests', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const ev = await requireOwnEvent(ctx, org, req.params.id);
    const rows = await many<any>(ctx.db, 'select * from guest_list where event_id = $1 order by created_at', [ev.id]);
    const seats = rows.reduce((n, g) => n + g.seats, 0);
    return { items: rows.map(presentGuest), seats, guests: rows.length, countLine: L(`${seats} seats · ${rows.length} guests`, `${seats} chỗ · ${rows.length} khách`) };
  });

  app.post<{ Params: { id: string } }>('/organizer/events/:id/guests', async (req, reply) => {
    const org = await requireOrganizer(ctx, req);
    const ev = await requireOwnEvent(ctx, org, req.params.id);
    const body = parse(z.object({ name: z.string().max(80), note: localized.optional(), seats: z.number().int().min(1).max(20).default(1) }), req.body);
    if (!body.name.trim()) throw badRequest('name_required', L('Enter a guest name', 'Nhập tên khách mời'));
    const row = await one<any>(ctx.db, 'insert into guest_list (event_id, name, note, seats) values ($1,$2,$3,$4) returning *',
      [ev.id, body.name.trim(), json(body.note ?? L('Added just now', 'Vừa thêm')), body.seats]);
    return reply.code(201).send({ ...presentGuest(row), message: L(`${row.name} added`, `Đã thêm ${row.name}`) });
  });

  app.patch<{ Params: { id: string; guestId: string } }>('/organizer/events/:id/guests/:guestId', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const ev = await requireOwnEvent(ctx, org, req.params.id);
    const body = parse(z.object({ checkedIn: z.boolean().optional(), seats: z.number().int().min(1).max(20).optional(), note: localized.optional() }), req.body);
    const row = await one<any>(ctx.db,
      `update guest_list set checked_in = coalesce($3, checked_in),
              checked_in_at = case when $3 is true then coalesce(checked_in_at, $6::timestamptz) when $3 is false then null else checked_in_at end,
              seats = coalesce($4, seats), note = coalesce($5, note)
        where id = $1 and event_id = $2 returning *`,
      [parse(uuid, req.params.guestId), ev.id, body.checkedIn ?? null, body.seats ?? null, body.note ? json(body.note) : null, ctx.clock.now()]);
    if (!row) throw notFound();
    return presentGuest(row);
  });

  app.delete<{ Params: { id: string; guestId: string } }>('/organizer/events/:id/guests/:guestId', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const ev = await requireOwnEvent(ctx, org, req.params.id);
    const row = await one(ctx.db, 'delete from guest_list where id = $1 and event_id = $2 returning 1', [parse(uuid, req.params.guestId), ev.id]);
    if (!row) throw notFound();
    return { ok: true };
  });

  // ---- revenue & payouts ------------------------------------------------------------

  app.get<{ Params: { id: string } }>('/organizer/events/:id/revenue', async (req) => {
    const org = await requireOrganizer(ctx, req);
    const ev = await requireOwnEvent(ctx, org, req.params.id);
    const now = ctx.clock.now();
    const today = vnDate(now);
    const [t, daily, tiers, guests, bank] = await Promise.all([
      revenueTotals(ctx.db, ev.id),
      many<any>(ctx.db,
        `select to_char(paid_at at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD') as day,
                coalesce(sum(qty) filter (where promo_code_id is null), 0)::int as full_price,
                coalesce(sum(qty) filter (where promo_code_id is not null), 0)::int as with_code
           from orders where event_id = $1 and status = 'paid' and paid_at >= $2 group by 1`,
        [ev.id, new Date(`${addDays(today, -13)}T00:00:00+07:00`)]),
      many<any>(ctx.db,
        `select tt.id, tt.name, tt.price, tt.sold, coalesce(sum(o.subtotal - o.discount) filter (where o.status = 'paid'), 0)::bigint as gross
           from ticket_tiers tt left join orders o on o.tier_id = tt.id where tt.event_id = $1 group by tt.id order by tt.sort, tt.price`, [ev.id]),
      one<any>(ctx.db, 'select coalesce(sum(seats), 0)::int as seats from guest_list where event_id = $1', [ev.id]),
      one<any>(ctx.db, 'select bank_name, bank_account_no, bank_account_name, bank_verified from organizers where id = $1', [org.organizerId]),
    ]);
    const P = PAYOUT_POLICY;
    const platformFee = Math.round((t.gross * P.platformFeePct) / 100);
    const paymentFee = Math.round((t.gross * P.paymentFeePct) / 100);
    const net = t.gross - platformFee - paymentFee;
    const byDay = new Map(daily.map((d) => [d.day, d]));
    const maxSold = Math.max(1, ...tiers.map((x) => x.sold), guests.seats);
    const ledger = await payoutLedger(ctx.db, ev, now);
    return {
      kpis: {
        gross: t.gross, net, ticketsSold: t.tickets,
        avgTicket: t.tickets ? Math.round(t.gross / t.tickets) : 0,
        refunds: { tickets: t.refunded_tickets, amount: t.refunded, pct: t.tickets + t.refunded_tickets ? Math.round((t.refunded_tickets / (t.tickets + t.refunded_tickets)) * 1000) / 10 : 0 },
      },
      daily: Array.from({ length: 14 }, (_, i) => {
        const day = addDays(today, i - 13);
        return { day, fullPrice: byDay.get(day)?.full_price ?? 0, withCode: byDay.get(day)?.with_code ?? 0 };
      }),
      tiers: [
        ...tiers.map((x) => ({ id: x.id, name: x.name, price: x.price, sold: x.sold, barPct: Math.round((x.sold / maxSold) * 100), gross: x.gross })),
        { id: null, name: L('Crew & guest', 'Crew & khách mời'), price: 0, sold: guests.seats, barPct: Math.round((guests.seats / maxSold) * 100), gross: null },
      ],
      payouts: ledger,
      account: bank.bank_account_no ? {
        bankName: bank.bank_name, accountMasked: `•••• •••• ${bank.bank_account_no.slice(-4)}`, accountName: bank.bank_account_name, verified: bank.bank_verified,
        note: L('Funds land after the event, less any refunds held back.', 'Tiền về sau sự kiện, trừ phần giữ lại cho hoàn tiền.'),
      } : null,
      fees: [
        { key: 'platform', label: L(`Platform fee ${P.platformFeePct}%`, `Phí nền tảng ${P.platformFeePct}%`), amount: -platformFee },
        { key: 'payment', label: L(`Payment fee ${P.paymentFeePct}%`, `Phí thanh toán ${String(P.paymentFeePct).replace('.', ',')}%`), amount: -paymentFee },
        { key: 'refunds', label: L(`Refunds (${t.refunded_tickets} tickets)`, `Hoàn tiền (${t.refunded_tickets} vé)`), amount: -t.refunded },
      ],
    };
  });

  const payoutRow = async (req: any) => {
    const org = await requireOrganizer(ctx, req);
    const ev = await requireOwnEvent(ctx, org, req.params.id);
    const kind = parse(z.enum(['advance', 'post_event', 'refund_hold']), req.params.kind);
    const row = (await payoutLedger(ctx.db, ev, ctx.clock.now())).find((r) => r.kind === kind)!;
    const o = await one<any>(ctx.db, 'select * from organizers where id = $1', [org.organizerId]);
    return { ev, row, o };
  };

  app.get<{ Params: { id: string; kind: string } }>('/organizer/events/:id/payouts/:kind/statement.csv', async (req, reply) => {
    const { ev, row } = await payoutRow(req);
    const lang = req.lang;
    const csv = toCsv(['line', 'description', 'amount_vnd'], [
      ...row.lines.map((l) => [l.key, l.label[lang], l.amount]),
      ['net', lang === 'vi' ? 'Thực nhận' : 'Net to you', row.net],
    ]);
    return reply.type('text/csv; charset=utf-8').header('content-disposition', `attachment; filename="${ev.slug}-${row.kind}-statement.csv"`).send(csv);
  });

  /**
   * Invoice data for the platform and payment fees on one payout. Rendering to PDF (and issuing
   * the Vietnamese e-invoice through the tax authority's provider) happens downstream of this.
   */
  app.get<{ Params: { id: string; kind: string } }>('/organizer/events/:id/payouts/:kind/invoice', async (req) => {
    const { ev, row, o } = await payoutRow(req);
    const items = row.lines.filter((l) => l.key === 'platform_fee' || l.key === 'payment_fee').map((l) => ({ description: l.label, amount: Math.abs(l.amount) }));
    const subtotal = items.reduce((n, i) => n + i.amount, 0);
    const vat = Math.round(subtotal * 0.1);
    return {
      number: `FF-${ev.slug.slice(0, 6).toUpperCase()}-${row.kind === 'advance' ? 'A' : row.kind === 'post_event' ? 'P' : 'R'}`,
      issuedOn: vnDate(ctx.clock.now()),
      seller: { name: 'Công ty TNHH FestFinder', address: '48 Lê Lợi, Bến Nghé, Quận 1, TP.HCM' },
      buyer: { name: o.legal_name ?? o.name, taxCode: o.tax_code, address: o.address },
      event: { title: ev.title, startsOn: ev.starts_on },
      items, subtotal, vatPct: 10, vat, total: subtotal + vat,
    };
  });
}
