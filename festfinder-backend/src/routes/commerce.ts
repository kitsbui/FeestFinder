import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { Ctx } from '../context.ts';
import type { Queryable } from '../db/index.ts';
import { many, one } from '../db/index.ts';
import { AppError, badRequest, conflict, notFound, unauthorized } from '../lib/errors.ts';
import { fill, L } from '../lib/i18n.ts';
import { hmac, randomCode, safeEqual } from '../lib/crypto.ts';
import { vnd } from '../lib/format.ts';
import { parse, uuid } from '../lib/validate.ts';
import { buildVietQr, BANKS } from '../lib/vietqr.ts';
import { requireUser } from '../http/guards.ts';
import { REFUND_POLICY, tierState } from '../presenters/event.ts';
import { fulfilOrder, qrToken } from '../services/tickets.ts';
import { notifyUser } from '../services/notify.ts';

export const SERVICE_FEE_PCT = Number(process.env.SERVICE_FEE_PCT ?? 5);
const HOLD_MINUTES = 15;

const CheckoutInput = z.object({
  eventId: uuid,
  tierId: uuid,
  qty: z.number().int().min(1).max(6),
  promoCode: z.string().trim().toUpperCase().max(24).optional(),
});

/** Prices a basket. Throws the same errors checkout would, so the sheet can show them early. */
async function quote(ctx: Ctx, q: Queryable, input: z.infer<typeof CheckoutInput>) {
  const now = ctx.clock.now();
  const ev = await one<any>(q, `select id, slug, title, status, entry_mode, ends_at, starts_on, start_time, end_time, venue_name from events where id = $1`, [input.eventId]);
  if (!ev || ev.status !== 'live') throw notFound(L('Event not found', 'Không tìm thấy sự kiện'));
  if (new Date(ev.ends_at) < now) throw badRequest('event_ended', L('This event has ended', 'Sự kiện đã kết thúc'));
  if (ev.entry_mode !== 'paid') throw badRequest('no_tickets_needed', L('No ticket needed — entry is free', 'Không cần vé — vào cửa miễn phí'));
  const tier = await one<any>(q, 'select * from ticket_tiers where id = $1 and event_id = $2', [input.tierId, input.eventId]);
  if (!tier) throw notFound(L('Ticket tier not found', 'Không tìm thấy loại vé'));
  const state = tierState(tier, now);
  if (state === 'soldout') throw conflict('tier_sold_out', L('This tier is sold out', 'Loại vé này đã hết'));
  if (state === 'soon') throw conflict('tier_not_open', L('This tier is not on sale yet', 'Loại vé này chưa mở bán'));
  const held = await one<any>(q,
    `select coalesce(sum(qty), 0)::int as n from orders where tier_id = $1 and status = 'pending' and expires_at > $2`, [tier.id, now]);
  const left = tier.capacity - tier.sold - held.n;
  if (left < input.qty) {
    throw conflict('not_enough_tickets', fill(L('Only {n} left in this tier', 'Loại vé này chỉ còn {n}'), { n: Math.max(0, left) }), { left: Math.max(0, left) });
  }
  let promo: any = null;
  if (input.promoCode) {
    promo = await one<any>(q, 'select * from promo_codes where event_id = $1 and code = $2', [input.eventId, input.promoCode]);
    if (!promo || !promo.active) throw badRequest('promo_invalid', L('That code does not work for this event', 'Mã này không dùng được cho sự kiện này'));
    if (promo.used >= promo.cap) throw badRequest('promo_used_up', L('That code has been used up', 'Mã này đã hết lượt dùng'));
  }
  const subtotal = tier.price * input.qty;
  const discount = promo ? Math.round((subtotal * promo.pct) / 100) : 0;
  const fee = Math.round(((subtotal - discount) * SERVICE_FEE_PCT) / 100);
  const total = subtotal - discount + fee;
  return {
    ev, tier, promo,
    body: {
      event: { id: ev.id, slug: ev.slug, title: ev.title, startsOn: ev.starts_on, startTime: ev.start_time, endTime: ev.end_time, venueName: ev.venue_name },
      tier: { id: tier.id, key: tier.key, name: tier.name, price: tier.price, state, left },
      qty: input.qty,
      unitPrice: tier.price,
      subtotal,
      discount,
      promo: promo ? { code: promo.code, pct: promo.pct } : null,
      fee,
      feeLabel: L(`Service fee ${SERVICE_FEE_PCT}%`, `Phí dịch vụ ${SERVICE_FEE_PCT}%`),
      total,
      lines: [
        { label: L(`${input.qty} × ${tier.name.en}`, `${input.qty} × ${tier.name.vi}`), amount: subtotal },
        ...(discount ? [{ label: L(`Code ${promo.code} (−${promo.pct}%)`, `Mã ${promo.code} (−${promo.pct}%)`), amount: -discount }] : []),
        { label: L('Service fee', 'Phí dịch vụ'), amount: fee },
      ],
      refundPolicy: REFUND_POLICY,
    },
  };
}

async function presentOrder(ctx: Ctx, orderId: string) {
  const o = await one<any>(ctx.db,
    `select o.*, e.slug, e.title, e.art, e.starts_on, e.ends_on, e.start_time, e.end_time, e.venue_name, e.area, t.name as tier_name, t.key as tier_key
       from orders o join events e on e.id = o.event_id join ticket_tiers t on t.id = o.tier_id where o.id = $1`, [orderId]);
  const tickets = await many<any>(ctx.db, 'select id, code, status, checked_in_at, wallet_apple_at, wallet_google_at from tickets where order_id = $1 order by code', [orderId]);
  return {
    id: o.id, code: o.code, status: o.status, qty: o.qty, unitPrice: o.unit_price, subtotal: o.subtotal, discount: o.discount, fee: o.fee, total: o.total,
    paymentMethod: o.payment_method, createdAt: o.created_at, paidAt: o.paid_at, expiresAt: o.status === 'pending' ? o.expires_at : null,
    event: { id: o.event_id, slug: o.slug, title: o.title, art: o.art, startsOn: o.starts_on, endsOn: o.ends_on, startTime: o.start_time, endTime: o.end_time, venueName: o.venue_name, area: o.area },
    tier: { key: o.tier_key, name: o.tier_name },
    tickets: tickets.map((t) => ({
      id: t.id, code: t.code, status: t.status, checkedInAt: t.checked_in_at,
      qr: qrToken(ctx.config.ticketSigningSecret, o.event_id, t.code),
      wallet: { apple: !!t.wallet_apple_at, google: !!t.wallet_google_at },
    })),
  };
}

async function afterPaid(ctx: Ctx, q: Queryable, orderId: string) {
  const o = await one<any>(q, 'select o.user_id, o.qty, e.title, e.id as event_id from orders o join events e on e.id = o.event_id where o.id = $1', [orderId]);
  await notifyUser(q, ctx.clock.now(), {
    userId: o.user_id, topic: null, kind: 'tickets_issued',
    title: L('Tickets are in My tickets', 'Vé đã vào mục Vé của tôi'),
    body: { en: `${o.qty} × ${o.title}`, vi: `${o.qty} × ${o.title}` },
    link: { screen: 'tickets', orderId },
  });
}

export default async function commerceRoutes(app: FastifyInstance) {
  const ctx = app.ctx;

  app.post('/checkout/quote', async (req) => {
    requireUser(req);
    const input = parse(CheckoutInput, req.body);
    return (await quote(ctx, ctx.db, input)).body;
  });

  /**
   * Holds the seats for 15 minutes and starts payment. The mock provider (development)
   * confirms at once; VietQR returns a transfer QR and the bank webhook confirms it.
   */
  app.post('/orders', async (req, reply) => {
    const s = requireUser(req);
    const input = parse(CheckoutInput.extend({ paymentMethod: z.enum(['card', 'momo', 'zalopay', 'vietqr']) }), req.body);
    const provider = ctx.config.paymentProvider;
    if (provider === 'vietqr' && input.paymentMethod !== 'vietqr') {
      throw new AppError(422, 'payment_method_unavailable', L('Pay by bank transfer (VietQR) for now', 'Hiện chỉ hỗ trợ chuyển khoản VietQR'));
    }
    const now = ctx.clock.now();
    const orderId = await ctx.db.tx(async (q) => {
      await q.query('select pg_advisory_xact_lock(hashtext($1))', [input.tierId]);
      const { tier, promo, body } = await quote(ctx, q, input);
      const code = `FF${randomCode(6)}`;
      const o = await one<any>(q,
        `insert into orders (code, user_id, event_id, tier_id, qty, unit_price, subtotal, discount, fee, total, promo_code_id, payment_method, created_at, expires_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) returning id`,
        [code, s.user.id, input.eventId, tier.id, input.qty, tier.price, body.subtotal, body.discount, body.fee, body.total,
          promo?.id ?? null, provider === 'mock' ? 'mock' : input.paymentMethod, now, new Date(now.getTime() + HOLD_MINUTES * 60_000)]);
      if (provider === 'mock') {
        await fulfilOrder(q, o.id, now);
        await afterPaid(ctx, q, o.id);
      }
      return o.id as string;
    });
    const order = await presentOrder(ctx, orderId);
    if (order.status === 'paid') {
      return reply.code(201).send({ order, payment: { status: 'paid' }, message: L('Tickets are in My tickets', 'Vé đã vào mục Vé của tôi') });
    }
    const bank = ctx.config.platformBank;
    return reply.code(201).send({
      order,
      payment: {
        status: 'awaiting_transfer',
        qrPayload: buildVietQr({ bankBin: bank.bin, accountNo: bank.accountNo, amount: order.total, purpose: order.code }),
        bank: { bin: bank.bin, name: BANKS[bank.bin] ?? bank.bin, accountNo: bank.accountNo, accountName: bank.accountName },
        amount: order.total,
        reference: order.code,
        expiresAt: order.expiresAt,
        note: L(`Transfer exactly ${vnd(order.total, 'en')} with the note ${order.code}. Tickets arrive the moment it lands.`,
          `Chuyển đúng ${vnd(order.total, 'vi')} với nội dung ${order.code}. Vé tới ngay khi tiền về.`),
      },
    });
  });

  app.get<{ Params: { id: string } }>('/orders/:id', async (req) => {
    const s = requireUser(req);
    const id = parse(uuid, req.params.id);
    const own = await one(ctx.db, 'select 1 from orders where id = $1 and user_id = $2', [id, s.user.id]);
    if (!own) throw notFound();
    return presentOrder(ctx, id);
  });

  app.post<{ Params: { id: string } }>('/orders/:id/cancel', async (req) => {
    const s = requireUser(req);
    const id = parse(uuid, req.params.id);
    const res = await one(ctx.db, `update orders set status = 'cancelled' where id = $1 and user_id = $2 and status = 'pending' returning 1`, [id, s.user.id]);
    if (!res) throw conflict('not_pending', L('Only unpaid orders can be cancelled', 'Chỉ huỷ được đơn chưa thanh toán'));
    return presentOrder(ctx, id);
  });

  /**
   * Bank-transfer notifications (SePay/Casso style). The sender signs the raw body with
   * HMAC-SHA256 in `x-signature`. Matching is by order code inside the transfer note.
   */
  app.post('/payments/bank-transfer/webhook', async (req, reply) => {
    const sig = String(req.headers['x-signature'] ?? '');
    const expected = hmac(ctx.config.paymentWebhookSecret, req.rawBody ?? '');
    if (!sig || !safeEqual(sig, expected)) throw unauthorized(L('Bad signature', 'Chữ ký không hợp lệ'));
    const body = parse(z.object({ transactionId: z.string(), amount: z.number().int().positive(), description: z.string() }), req.body);
    const code = /FF[23456789A-HJ-NP-Z]{6}/.exec(body.description.toUpperCase())?.[0];
    if (!code) return reply.code(202).send({ matched: false });
    const order = await one<any>(ctx.db, 'select id, total, status from orders where code = $1', [code]);
    if (!order) return reply.code(202).send({ matched: false });
    if (order.status === 'paid') return { matched: true, alreadyPaid: true };
    if (body.amount < order.total) return reply.code(202).send({ matched: true, underpaid: true });
    await ctx.db.tx(async (q) => {
      await q.query(`update orders set provider_ref = $2 where id = $1`, [order.id, body.transactionId]);
      // A transfer that lands after the hold expired still counts if seats remain.
      await q.query(`update orders set status = 'pending' where id = $1 and status = 'expired'`, [order.id]);
      const { fulfilled } = await fulfilOrder(q, order.id, ctx.clock.now());
      if (fulfilled) await afterPaid(ctx, q, order.id);
    });
    return { matched: true };
  });

  /** My tickets, one card per order, with signed QR tokens that verify offline at the gate. */
  app.get('/me/tickets', async (req) => {
    const s = requireUser(req);
    const orders = await many<any>(ctx.db,
      `select o.id from orders o join events e on e.id = o.event_id
        where o.user_id = $1 and o.status in ('paid', 'refunded') order by e.starts_at`, [s.user.id]);
    const items = [];
    for (const o of orders) items.push(await presentOrder(ctx, o.id));
    return {
      items,
      offlineNote: L('Stored on this device · scans with no signal', 'Đã lưu trên máy · quét được khi không có sóng'),
    };
  });

  /**
   * Records the pass and returns the pass fields. Signing a .pkpass or a Google Wallet JWT
   * needs issuer credentials; wire those in `passUrl` when they exist.
   */
  app.post<{ Params: { id: string } }>('/me/tickets/:id/wallet', async (req) => {
    const s = requireUser(req);
    const id = parse(uuid, req.params.id);
    const { platform } = parse(z.object({ platform: z.enum(['apple', 'google']) }), req.body);
    const t = await one<any>(ctx.db,
      `select t.id, t.code, t.event_id, t.holder_name, e.title, e.starts_at, e.venue_name, e.lat, e.lng, tt.name as tier_name
         from tickets t join events e on e.id = t.event_id left join ticket_tiers tt on tt.id = t.tier_id
        where t.id = $1 and t.user_id = $2`, [id, s.user.id]);
    if (!t) throw notFound();
    await ctx.db.query(`update tickets set ${platform === 'apple' ? 'wallet_apple_at' : 'wallet_google_at'} = $2 where id = $1`, [id, ctx.clock.now()]);
    return {
      platform,
      passUrl: null,
      pass: {
        serial: t.code, title: t.title, startsAt: t.starts_at, venue: t.venue_name, tier: t.tier_name, holder: t.holder_name,
        barcode: { format: 'QR', message: qrToken(ctx.config.ticketSigningSecret, t.event_id, t.code) },
        location: t.lat !== null ? { lat: t.lat, lng: t.lng } : null,
      },
      message: L('Pass added · it opens from the lock screen at the gate', 'Đã thêm vé · mở ngay từ màn hình khoá khi tới cổng'),
    };
  });
}
