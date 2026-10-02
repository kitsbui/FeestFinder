import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { Ctx } from '../context.ts';
import { many, one } from '../db/index.ts';
import { AppError, badRequest, conflict, notFound } from '../lib/errors.ts';
import { fill, L } from '../lib/i18n.ts';
import { initialsOf, normalizeVnPhone } from '../lib/contact.ts';
import { vnd } from '../lib/format.ts';
import { parse, uuid } from '../lib/validate.ts';
import { buildVietQr, BANKS } from '../lib/vietqr.ts';
import { isUuid } from '../http/sql.ts';
import { requireAdmin, requireUser, requireWriter } from '../http/guards.ts';
import { appendAudit } from '../services/audit.ts';
import { notifyUser } from '../services/notify.ts';
import { nameOf, phaseOf } from '../services/community.ts';
import {
  alertWatchers, assertMovable, checkResalePrice, closeListingFor, fulfilResale, loadTicket, moveTicket, resaleCode, RESALE_FEE_PCT, RESALE_HOLD_MINUTES,
} from '../services/resale.ts';

const firstName = (name: string) => nameOf(name).split(/\s+/).slice(-1)[0];

async function presentResaleOrder(ctx: Ctx, id: string) {
  const o = await one<any>(ctx.db,
    `select r.*, e.slug, e.title, e.art, e.starts_on, e.start_time, e.end_time, e.venue_name, tt.name as tier_name
       from resale_orders r join events e on e.id = r.event_id join tickets t on t.id = r.ticket_id left join ticket_tiers tt on tt.id = t.tier_id
      where r.id = $1`, [id]);
  return {
    id: o.id, code: o.code, status: o.status, price: o.price, fee: o.fee, total: o.total,
    paymentMethod: o.payment_method, createdAt: o.created_at, paidAt: o.paid_at, expiresAt: o.status === 'pending' ? o.expires_at : null,
    event: { id: o.event_id, slug: o.slug, title: o.title, art: o.art, startsOn: o.starts_on, startTime: o.start_time, endTime: o.end_time, venueName: o.venue_name },
    tier: o.tier_name,
  };
}

export default async function resaleRoutes(app: FastifyInstance) {
  const ctx = app.ctx;

  const eventOf = async (idOrSlug: string) => {
    const ev = await one<any>(ctx.db,
      `select id, slug, title, status, held_for_reports, entry_mode, resale_enabled, starts_at, ends_at, sold_out from events where ${isUuid(idOrSlug) ? 'id' : 'slug'} = $1`, [idOrSlug]);
    if (!ev || ev.status !== 'live' || ev.held_for_reports) throw notFound(L('Event not found', 'Không tìm thấy sự kiện'));
    return ev;
  };

  // ---- the event page's resale section ------------------------------------------------

  /** Tickets attendees are passing on, cheapest first, never above what they paid. */
  app.get<{ Params: { idOrSlug: string } }>('/events/:idOrSlug/resale', async (req) => {
    const ev = await eventOf(req.params.idOrSlug);
    const now = ctx.clock.now();
    const me = req.session?.user?.id ?? null;
    const [rows, watching] = await Promise.all([
      many<any>(ctx.db,
        `select l.id, l.price, l.face_value, l.created_at, l.seller_id, u.name as seller_name, tt.name as tier_name
           from ticket_listings l join tickets t on t.id = l.ticket_id join users u on u.id = l.seller_id left join ticket_tiers tt on tt.id = t.tier_id
          where l.event_id = $1 and l.status = 'active' and t.status = 'valid'
          order by l.price, l.created_at limit 50`, [ev.id]),
      me ? one(ctx.db, 'select 1 from resale_watchers where user_id = $1 and event_id = $2', [me, ev.id]) : null,
    ]);
    const phase = phaseOf(ev, now);
    return {
      enabled: ev.entry_mode === 'paid' && ev.resale_enabled && phase !== 'after',
      phase,
      soldOut: ev.sold_out,
      count: rows.length,
      fromPrice: rows.length ? rows[0].price : null,
      watching: !!watching,
      feePct: RESALE_FEE_PCT,
      items: rows.map((r) => ({
        id: r.id, price: r.price, faceValue: r.face_value, tier: r.tier_name, listedAt: r.created_at,
        seller: { name: firstName(r.seller_name), initials: initialsOf(nameOf(r.seller_name)) },
        mine: r.seller_id === me,
      })),
      rules: L('Never above face value. The seller’s QR stops working the moment you pay, and yours works at the door straight away.',
        'Không quá giá gốc. QR của người bán hết hiệu lực ngay khi bạn thanh toán, QR của bạn dùng được ngay ở cửa.'),
    };
  });

  for (const method of ['put', 'delete'] as const) {
    app[method]<{ Params: { id: string } }>('/events/:id/resale/watch', async (req) => {
      const s = requireUser(req);
      const ev = await eventOf(parse(uuid, req.params.id));
      if (method === 'put') {
        await ctx.db.query('insert into resale_watchers (user_id, event_id, created_at) values ($1,$2,$3) on conflict (user_id, event_id) do update set notified_at = null', [s.user.id, ev.id, ctx.clock.now()]);
      } else {
        await ctx.db.query('delete from resale_watchers where user_id = $1 and event_id = $2', [s.user.id, ev.id]);
      }
      return {
        watching: method === 'put',
        message: method === 'put' ? L('We will tell you the moment a ticket comes up', 'Chúng tôi sẽ báo ngay khi có vé pass') : L('Alert off', 'Đã tắt báo'),
      };
    });
  }

  // ---- the holder's side -----------------------------------------------------------------

  /** Put a ticket up for resale. The price is capped at what was paid for it. */
  app.post<{ Params: { id: string } }>('/me/tickets/:id/listing', async (req, reply) => {
    const s = requireWriter(req);
    const id = parse(uuid, req.params.id);
    const body = parse(z.object({
      price: z.number().int(),
      payee: z.object({ bankBin: z.string().regex(/^\d{6}$/), accountNo: z.string().regex(/^[0-9A-Za-z]{4,19}$/), accountName: z.string().trim().min(2).max(60) }).optional(),
    }), req.body);
    const now = ctx.clock.now();
    const listing = await ctx.db.tx(async (q) => {
      const t = await loadTicket(q, id, true);
      assertMovable(t, s.user.id, now);
      const face = Number(t.face_value ?? 0);
      checkResalePrice(body.price, face);
      if (body.payee) {
        await q.query('update users set payee_bank_bin = $2, payee_bank_name = $3, payee_account_no = $4, payee_account_name = $5 where id = $1',
          [s.user.id, body.payee.bankBin, BANKS[body.payee.bankBin] ?? null, body.payee.accountNo, body.payee.accountName.toUpperCase()]);
      }
      const payee = await one<any>(q, 'select payee_account_no from users where id = $1', [s.user.id]);
      if (!payee?.payee_account_no) {
        throw conflict('payee_missing', L('Add the bank account the money should go to', 'Thêm tài khoản ngân hàng để nhận tiền'));
      }
      const open = await one(q, `select 1 from ticket_listings where ticket_id = $1 and status in ('active', 'reserved')`, [t.id]);
      if (open) throw conflict('already_listed', L('This ticket is already up for resale', 'Vé này đang được pass'));
      const row = await one<any>(q,
        `insert into ticket_listings (ticket_id, event_id, seller_id, price, face_value, created_at) values ($1,$2,$3,$4,$5,$6) returning *`,
        [t.id, t.event_id, s.user.id, body.price, face, now]);
      await alertWatchers(q, t.event_id, s.user.id, body.price, now);
      return row;
    });
    return reply.code(201).send({
      listing: { id: listing.id, price: listing.price, faceValue: listing.face_value, status: listing.status },
      message: L(`Listed at ${vnd(listing.price, 'en')} · you are paid after the event`, `Đã đăng pass ${vnd(listing.price, 'vi')} · tiền về sau sự kiện`),
    });
  });

  app.delete<{ Params: { id: string } }>('/me/tickets/:id/listing', async (req) => {
    const s = requireUser(req);
    const id = parse(uuid, req.params.id);
    await ctx.db.tx(async (q) => {
      const t = await one<any>(q, 'select user_id from tickets where id = $1', [id]);
      if (!t || t.user_id !== s.user.id) throw notFound();
      await closeListingFor(q, id, ctx.clock.now());
    });
    return { ok: true, message: L('Taken off resale', 'Đã gỡ khỏi Pass vé') };
  });

  /** Give a ticket to someone with a FeestFinder account, by their phone number. */
  app.post<{ Params: { id: string } }>('/me/tickets/:id/transfer', async (req) => {
    const s = requireUser(req);
    const id = parse(uuid, req.params.id);
    const { phone } = parse(z.object({ phone: z.string().min(8).max(30) }), req.body);
    const e164 = normalizeVnPhone(phone);
    if (!e164) throw badRequest('invalid_phone', L('Enter a valid Vietnamese phone number', 'Nhập số điện thoại Việt Nam hợp lệ'));
    const now = ctx.clock.now();
    const out = await ctx.db.tx(async (q) => {
      const to = await one<any>(q, 'select id, name from users where phone = $1 order by phone_verified_at is null limit 1', [e164]);
      if (!to) throw notFound(L('No FeestFinder account uses that number yet — ask them to sign up first', 'Số này chưa có tài khoản FeestFinder — nhờ họ đăng ký trước'));
      if (to.id === s.user.id) throw badRequest('own_ticket', L('That is your own number', 'Đây là số của bạn'));
      const t = await loadTicket(q, id, true);
      assertMovable(t, s.user.id, now);
      await closeListingFor(q, t.id, now);
      await moveTicket(q, t, to.id, now, { kind: 'gift' });
      await notifyUser(q, now, {
        userId: to.id, topic: null, kind: 'ticket_received', urgent: true,
        title: fill(L('{n} sent you a ticket', '{n} đã gửi bạn một vé'), { n: nameOf(s.user.name) }),
        body: { en: `${t.title} · it is in My tickets`, vi: `${t.title} · vé đã vào mục Vé của tôi` },
        link: { screen: 'tickets' },
      });
      return { to, title: t.title };
    });
    return { ok: true, message: fill(L('Sent to {n} · your QR no longer works', 'Đã chuyển cho {n} · QR của bạn đã hết hiệu lực'), { n: nameOf(out.to.name) }) };
  });

  // ---- the buyer's side --------------------------------------------------------------------

  const priceOf = (price: number) => {
    const fee = Math.round((price * RESALE_FEE_PCT) / 100);
    return { price, fee, total: price + fee };
  };

  app.post<{ Params: { listingId: string } }>('/resale/:listingId/quote', async (req) => {
    requireUser(req);
    const l = await one<any>(ctx.db,
      `select l.*, e.title, tt.name as tier_name from ticket_listings l join events e on e.id = l.event_id join tickets t on t.id = l.ticket_id left join ticket_tiers tt on tt.id = t.tier_id
        where l.id = $1`, [parse(uuid, req.params.listingId)]);
    if (!l || l.status !== 'active') throw conflict('listing_gone', L('Someone else got this one — pick another', 'Vé này đã có người lấy — chọn vé khác'));
    const p = priceOf(l.price);
    return {
      ...p, faceValue: l.face_value, tier: l.tier_name, event: { id: l.event_id, title: l.title },
      lines: [
        { label: L(`Resale ticket · ${l.tier_name?.en ?? 'GA'}`, `Vé pass · ${l.tier_name?.vi ?? 'GA'}`), amount: p.price },
        { label: L(`Service fee ${RESALE_FEE_PCT}%`, `Phí dịch vụ ${RESALE_FEE_PCT}%`), amount: p.fee },
      ],
      holdMinutes: RESALE_HOLD_MINUTES,
    };
  });

  /** Holds the ticket for ten minutes and starts payment; it changes hands when the money lands. */
  app.post<{ Params: { listingId: string } }>('/resale/:listingId/orders', async (req, reply) => {
    const s = requireUser(req);
    const listingId = parse(uuid, req.params.listingId);
    const { paymentMethod } = parse(z.object({ paymentMethod: z.enum(['card', 'momo', 'zalopay', 'vietqr']) }), req.body);
    const provider = ctx.config.paymentProvider;
    if (provider === 'vietqr' && paymentMethod !== 'vietqr') {
      throw new AppError(422, 'payment_method_unavailable', L('Pay by bank transfer (VietQR) for now', 'Hiện chỉ hỗ trợ chuyển khoản VietQR'));
    }
    const now = ctx.clock.now();
    const orderId = await ctx.db.tx(async (q) => {
      const l = await one<any>(q, 'select * from ticket_listings where id = $1 for update', [listingId]);
      if (!l || l.status !== 'active') throw conflict('listing_gone', L('Someone else got this one — pick another', 'Vé này đã có người lấy — chọn vé khác'));
      if (l.seller_id === s.user.id) throw badRequest('own_listing', L('This is your own ticket', 'Đây là vé của bạn'));
      const t = await loadTicket(q, l.ticket_id, true);
      assertMovable(t, l.seller_id, now);
      const p = priceOf(l.price);
      await q.query(`update ticket_listings set status = 'reserved' where id = $1`, [l.id]);
      const o = await one<any>(q,
        `insert into resale_orders (code, listing_id, ticket_id, event_id, buyer_id, seller_id, price, fee, total, payment_method, created_at, expires_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) returning id`,
        [resaleCode(), l.id, l.ticket_id, l.event_id, s.user.id, l.seller_id, p.price, p.fee, p.total,
          provider === 'mock' ? 'mock' : paymentMethod, now, new Date(now.getTime() + RESALE_HOLD_MINUTES * 60_000)]);
      if (provider === 'mock') await fulfilResale(q, o.id, now);
      return o.id as string;
    });
    const order = await presentResaleOrder(ctx, orderId);
    if (order.status === 'paid') {
      return reply.code(201).send({ order, payment: { status: 'paid' }, message: L('Your ticket is in My tickets', 'Vé đã vào mục Vé của tôi') });
    }
    const bank = ctx.config.platformBank;
    return reply.code(201).send({
      order,
      payment: {
        status: 'awaiting_transfer',
        qrPayload: buildVietQr({ bankBin: bank.bin, accountNo: bank.accountNo, amount: order.total, purpose: order.code }),
        bank: { bin: bank.bin, name: BANKS[bank.bin] ?? bank.bin, accountNo: bank.accountNo, accountName: bank.accountName },
        amount: order.total, reference: order.code, expiresAt: order.expiresAt,
        note: L(`Transfer exactly ${vnd(order.total, 'en')} with the note ${order.code} within ${RESALE_HOLD_MINUTES} minutes.`,
          `Chuyển đúng ${vnd(order.total, 'vi')} với nội dung ${order.code} trong ${RESALE_HOLD_MINUTES} phút.`),
      },
    });
  });

  app.get<{ Params: { id: string } }>('/resale/orders/:id', async (req) => {
    const s = requireUser(req);
    const id = parse(uuid, req.params.id);
    const own = await one(ctx.db, 'select 1 from resale_orders where id = $1 and buyer_id = $2', [id, s.user.id]);
    if (!own) throw notFound();
    return presentResaleOrder(ctx, id);
  });

  app.post<{ Params: { id: string } }>('/resale/orders/:id/cancel', async (req) => {
    const s = requireUser(req);
    const id = parse(uuid, req.params.id);
    await ctx.db.tx(async (q) => {
      const o = await one<any>(q, `update resale_orders set status = 'cancelled' where id = $1 and buyer_id = $2 and status = 'pending' returning listing_id`, [id, s.user.id]);
      if (!o) throw conflict('not_pending', L('Only unpaid orders can be cancelled', 'Chỉ huỷ được đơn chưa thanh toán'));
      await q.query(`update ticket_listings set status = 'active' where id = $1 and status = 'reserved'`, [o.listing_id]);
    });
    return presentResaleOrder(ctx, id);
  });

  // ---- FeestFinder: paying sellers, refunding buyers ------------------------------------------

  app.get('/admin/resale', async (req) => {
    requireAdmin(req);
    const { state } = parse(z.object({ state: z.enum(['due', 'upcoming', 'paid_out', 'failed']).default('due') }), req.query);
    const now = ctx.clock.now();
    const where = {
      due: `r.status = 'paid' and r.paid_out_at is null and r.payout_due_at <= $1`,
      upcoming: `r.status = 'paid' and r.paid_out_at is null and r.payout_due_at > $1`,
      paid_out: `r.status = 'paid' and r.paid_out_at is not null and $1::timestamptz is not null`,
      failed: `r.status = 'failed' and $1::timestamptz is not null`,
    }[state];
    const rows = await many<any>(ctx.db,
      `select r.*, e.title, e.status as event_status, s.name as seller_name, s.payee_bank_name, s.payee_bank_bin, s.payee_account_no, s.payee_account_name,
              b.name as buyer_name
         from resale_orders r join events e on e.id = r.event_id join users s on s.id = r.seller_id join users b on b.id = r.buyer_id
        where ${where} order by coalesce(r.payout_due_at, r.paid_at) limit 200`, [now]);
    return {
      state,
      items: rows.map((r) => ({
        id: r.id, code: r.code, price: r.price, fee: r.fee, total: r.total, paidAt: r.paid_at, payoutDueAt: r.payout_due_at, paidOutAt: r.paid_out_at, payoutRef: r.payout_ref,
        event: { id: r.event_id, title: r.title, cancelled: r.event_status === 'cancelled' },
        seller: { name: nameOf(r.seller_name), bank: r.payee_account_no ? { name: r.payee_bank_name, bin: r.payee_bank_bin, accountNo: r.payee_account_no, accountName: r.payee_account_name } : null },
        buyer: { name: nameOf(r.buyer_name) },
      })),
    };
  });

  app.post<{ Params: { id: string } }>('/admin/resale/:id/payout', async (req) => {
    const s = requireAdmin(req);
    const id = parse(uuid, req.params.id);
    const { reference } = parse(z.object({ reference: z.string().trim().min(3).max(60) }), req.body);
    const now = ctx.clock.now();
    const out = await ctx.db.tx(async (q) => {
      const r = await one<any>(q,
        `update resale_orders r set paid_out_at = $2, payout_ref = $3 from events e
          where r.id = $1 and e.id = r.event_id and r.status = 'paid' and r.paid_out_at is null and e.status <> 'cancelled'
          returning r.code, r.price, r.seller_id, e.title`, [id, now, reference]);
      if (!r) throw conflict('not_payable', L('This sale is not waiting for a payout', 'Giao dịch này không chờ chi trả'));
      await appendAudit(q, { at: now, actorType: 'admin', actorId: s.user.id, actorLabel: s.user.name || 'FeestFinder Admin', action: 'resale.paid_out',
        targetType: 'resale_order', targetId: id, targetLabel: `${r.code} · ${r.title}`, diff: [{ f: 'paid_out', a: '—', b: `${r.price} · ${reference}` }] });
      await notifyUser(q, now, {
        userId: r.seller_id, topic: 'tickets', kind: 'resale_payout',
        title: L('Your resale money is on its way', 'Tiền pass vé đang về tài khoản của bạn'),
        body: L(`${vnd(r.price, 'en')} · ${r.title}`, `${vnd(r.price, 'vi')} · ${r.title}`), link: { screen: 'tickets' },
      });
      return r;
    });
    return { ok: true, message: L(`Marked paid · ${out.code}`, `Đã ghi nhận chi trả · ${out.code}`) };
  });

  /** Money back to a buyer: the payment landed too late, or the event was cancelled after the sale. */
  app.post<{ Params: { id: string } }>('/admin/resale/:id/refund', async (req) => {
    const s = requireAdmin(req);
    const id = parse(uuid, req.params.id);
    const now = ctx.clock.now();
    const out = await ctx.db.tx(async (q) => {
      const r = await one<any>(q,
        `select r.*, e.title, e.status as event_status from resale_orders r join events e on e.id = r.event_id where r.id = $1 for update of r`, [id]);
      if (!r || !(r.status === 'failed' || (r.status === 'paid' && !r.paid_out_at && r.event_status === 'cancelled'))) {
        throw conflict('not_refundable', L('Only failed sales, or sales for a cancelled event not yet paid out, are refunded here', 'Chỉ hoàn giao dịch lỗi, hoặc giao dịch của sự kiện đã huỷ chưa chi trả'));
      }
      await q.query(`update resale_orders set status = 'refunded' where id = $1`, [id]);
      await appendAudit(q, { at: now, actorType: 'admin', actorId: s.user.id, actorLabel: s.user.name || 'FeestFinder Admin', action: 'resale.refunded',
        targetType: 'resale_order', targetId: id, targetLabel: `${r.code} · ${r.title}`, diff: [{ f: 'status', a: r.status, b: 'refunded' }, { f: 'amount', a: '—', b: String(r.total) }] });
      await notifyUser(q, now, {
        userId: r.buyer_id, topic: 'tickets', kind: 'refund', urgent: true,
        title: L('Your resale payment was refunded', 'Tiền mua vé pass đã được hoàn'), body: L(`${vnd(r.total, 'en')} · ${r.title}`, `${vnd(r.total, 'vi')} · ${r.title}`),
        link: { screen: 'tickets' },
      });
      return r;
    });
    return { ok: true, message: L(`Refunded · ${out.code}`, `Đã hoàn tiền · ${out.code}`) };
  });
}
