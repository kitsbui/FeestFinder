import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { Queryable } from '../db/index.ts';
import { json, many, one } from '../db/index.ts';
import { badRequest, forbidden, notFound, tooMany } from '../lib/errors.ts';
import { fill, L, type Localized } from '../lib/i18n.ts';
import { initialsOf } from '../lib/contact.ts';
import { randomCode } from '../lib/crypto.ts';
import { vnd } from '../lib/format.ts';
import { fromMinutes, toMinutes } from '../lib/time.ts';
import { parse, uuid } from '../lib/validate.ts';
import { buildVietQr, BANKS } from '../lib/vietqr.ts';
import { requireUser } from '../http/guards.ts';
import { notifyUser } from '../services/notify.ts';

const METHODS: Record<'vietqr' | 'momo' | 'zalopay', string> = { vietqr: 'VietQR', momo: 'Momo', zalopay: 'ZaloPay' };

function meetSpots(ev: any): { id: 'gate' | 'cafe' | 'park'; name: Localized; time: string }[] {
  const start = ev.start_time ?? '19:00';
  const minus = (m: number) => fromMinutes(toMinutes(start) - m);
  return [
    { id: 'gate', name: L(`Main gate · ${ev.venue_name}`, `Cổng chính · ${ev.venue_name}`), time: start },
    { id: 'cafe', name: L(`Coffee in ${ev.area}`, `Cà phê ở ${ev.area}`), time: minus(60) },
    { id: 'park', name: L(`Parking at ${ev.venue_name}`, `Bãi xe ${ev.venue_name}`), time: minus(30) },
  ];
}

/**
 * The ticket price each person owes: the tier of the owner's main order (most seats, then
 * earliest) if they bought, else the listing's "from" price.
 */
async function pricePerHead(q: Queryable, plan: any): Promise<number> {
  const bought = await one<any>(q,
    `select unit_price from orders where user_id = $1 and event_id = $2 and status = 'paid' order by qty desc, paid_at asc limit 1`,
    [plan.owner_id, plan.event_id]);
  return bought?.unit_price ?? plan.price_from;
}

export default async function planRoutes(app: FastifyInstance) {
  const ctx = app.ctx;

  async function loadPlan(planId: string, userId: string) {
    const plan = await one<any>(ctx.db,
      `select gp.*, e.slug, e.title, e.starts_on, e.ends_on, e.start_time, e.venue_name, e.area, e.price_from, e.entry_mode
         from group_plans gp join events e on e.id = gp.event_id where gp.id = $1`, [planId]);
    if (!plan) throw notFound(L('Plan not found', 'Không tìm thấy kế hoạch'));
    const member = await one<any>(ctx.db, 'select status from group_plan_members where plan_id = $1 and user_id = $2', [planId, userId]);
    if (plan.owner_id !== userId && !member) throw notFound(L('Plan not found', 'Không tìm thấy kế hoạch'));
    return plan;
  }

  async function presentPlan(planId: string, userId: string) {
    const plan = await loadPlan(planId, userId);
    const [owner, members, messages] = await Promise.all([
      one<any>(ctx.db, 'select id, name, photo_url, payee_bank_bin, payee_account_no, payee_account_name from users where id = $1', [plan.owner_id]),
      many<any>(ctx.db,
        `select m.user_id, m.status, m.paid, u.name, u.photo_url from group_plan_members m join users u on u.id = m.user_id
          where m.plan_id = $1 order by m.invited_at`, [planId]),
      many<any>(ctx.db,
        `select pm.id, pm.user_id, pm.kind, pm.body, pm.payload, pm.created_at, u.name from group_plan_messages pm
          left join users u on u.id = pm.user_id where pm.plan_id = $1 order by pm.created_at, pm.seq`, [planId]),
    ]);
    const going = members.filter((m) => m.status === 'going');
    const heads = going.length + 1;
    const unit = await pricePerHead(ctx.db, plan);
    const paidCount = going.filter((m) => m.paid).length;
    const owed = going.length - paidCount;
    const spots = meetSpots(plan);
    const isOwner = plan.owner_id === userId;
    return {
      id: plan.id,
      isOwner,
      event: { id: plan.event_id, slug: plan.slug, title: plan.title, startsOn: plan.starts_on, endsOn: plan.ends_on },
      headsLine: fill(L('{n} people', '{n} người'), { n: heads }),
      members: [
        { userId: owner.id, name: owner.name, initials: initialsOf(owner.name || 'FF'), photoUrl: owner.photo_url, status: 'going', owner: true, paid: true },
        ...members.map((m) => ({ userId: m.user_id, name: m.name, initials: initialsOf(m.name || '?'), photoUrl: m.photo_url, status: m.status, owner: false, paid: m.paid })),
      ],
      meetSpots: spots,
      meetSpot: plan.meet_spot,
      split: plan.entry_mode === 'paid' && unit > 0 ? {
        perHead: unit,
        total: unit * heads,
        paidCount,
        goingCount: going.length,
        paidLine: fill(L('{a} of {b} paid', '{a}/{b} đã trả'), { a: paidCount, b: going.length }),
        owedCount: owed,
        owedAmount: unit * owed,
        owedLine: owed > 0 ? L(`${owed} still owe you ${vnd(unit * owed, 'en')}`, `${owed} người còn nợ bạn ${vnd(unit * owed, 'vi')}`) : null,
        payeeReady: !!owner.payee_account_no,
      } : null,
      messages: messages.map((m) => ({
        id: m.id, kind: m.kind, body: m.body, payload: m.payload, createdAt: m.created_at,
        fromMe: m.user_id === userId, author: m.user_id === userId ? null : m.name,
      })),
    };
  }

  /** "Go together": invite friends. Creates your plan for the event or adds people to it. */
  app.post<{ Params: { eventId: string } }>('/events/:eventId/invites', async (req) => {
    const s = requireUser(req);
    const eventId = parse(uuid, req.params.eventId);
    const { friendIds } = parse(z.object({ friendIds: z.array(uuid).min(1).max(20) }), req.body);
    const now = ctx.clock.now();
    const planId = await ctx.db.tx(async (q) => {
      const ev = await one<any>(q, `select id, title, starts_on from events where id = $1 and status = 'live'`, [eventId]);
      if (!ev) throw notFound(L('Event not found', 'Không tìm thấy sự kiện'));
      const friends = await many<any>(q, 'select friend_id from friendships where user_id = $1 and friend_id = any($2::uuid[])', [s.user.id, friendIds]);
      if (friends.length !== new Set(friendIds).size) throw forbidden('not_friends', L('You can only invite friends', 'Bạn chỉ mời được bạn bè'));
      const plan = await one<any>(q,
        `insert into group_plans (event_id, owner_id, created_at) values ($1,$2,$3)
         on conflict (event_id, owner_id) do update set event_id = excluded.event_id returning id`, [eventId, s.user.id, now]);
      const me = await one<any>(q, 'select name from users where id = $1', [s.user.id]);
      for (const f of friends) {
        const added = await one(q,
          `insert into group_plan_members (plan_id, user_id, invited_at) values ($1,$2,$3) on conflict do nothing returning 1`,
          [plan.id, f.friend_id, now]);
        if (!added) continue;
        await q.query(`insert into direct_messages (sender_id, recipient_id, kind, event_id, created_at) values ($1,$2,'invite',$3,$4)`,
          [s.user.id, f.friend_id, eventId, now]);
        await notifyUser(q, now, {
          userId: f.friend_id, topic: 'friends', kind: 'plan_invite',
          title: fill(L('{n} invited you', '{n} đã mời bạn'), { n: me.name || 'A friend' }),
          body: { en: ev.title, vi: ev.title },
          link: { screen: 'plan', planId: plan.id },
          dedupeKey: `plan-invite:${plan.id}:${f.friend_id}`,
        });
      }
      await q.query('insert into going (user_id, event_id) values ($1,$2) on conflict do nothing', [s.user.id, eventId]);
      return plan.id as string;
    });
    const out = await presentPlan(planId, s.user.id);
    return { ...out, message: fill(L('Plan created · {n} people', 'Đã tạo kế hoạch · {n} người'), { n: out.members.length }) };
  });

  app.get('/me/plans', async (req) => {
    const s = requireUser(req);
    const rows = await many<any>(ctx.db,
      `select gp.id, gp.event_id, e.title, e.slug, e.starts_on, gp.owner_id = $1 as is_owner,
              coalesce(m.status, 'going') as my_status
         from group_plans gp join events e on e.id = gp.event_id
         left join group_plan_members m on m.plan_id = gp.id and m.user_id = $1
        where gp.owner_id = $1 or m.user_id is not null
        order by e.starts_at`, [s.user.id]);
    return { items: rows.map((r) => ({ id: r.id, event: { id: r.event_id, slug: r.slug, title: r.title, startsOn: r.starts_on }, isOwner: r.is_owner, myStatus: r.my_status })) };
  });

  app.get<{ Params: { id: string } }>('/plans/:id', async (req) => presentPlan(parse(uuid, req.params.id), requireUser(req).user.id));

  app.post<{ Params: { id: string } }>('/plans/:id/respond', async (req) => {
    const s = requireUser(req);
    const planId = parse(uuid, req.params.id);
    const { status } = parse(z.object({ status: z.enum(['going', 'declined']) }), req.body);
    const plan = await loadPlan(planId, s.user.id);
    if (plan.owner_id === s.user.id) throw badRequest('owner_cannot_respond', L('You made this plan', 'Bạn là người tạo kế hoạch này'));
    const now = ctx.clock.now();
    await ctx.db.tx(async (q) => {
      await q.query('update group_plan_members set status = $3, responded_at = $4 where plan_id = $1 and user_id = $2', [planId, s.user.id, status, now]);
      if (status === 'going') {
        await q.query('insert into going (user_id, event_id) values ($1,$2) on conflict do nothing', [s.user.id, plan.event_id]);
        const me = await one<any>(q, 'select name from users where id = $1', [s.user.id]);
        await notifyUser(q, now, {
          userId: plan.owner_id, topic: 'friends', kind: 'plan_accepted',
          title: fill(L('{n} is in', '{n} đã tham gia'), { n: me.name }), body: { en: plan.title, vi: plan.title },
          link: { screen: 'plan', planId },
        });
      }
    });
    return presentPlan(planId, s.user.id);
  });

  app.patch<{ Params: { id: string } }>('/plans/:id', async (req) => {
    const s = requireUser(req);
    const planId = parse(uuid, req.params.id);
    const { meetSpot } = parse(z.object({ meetSpot: z.enum(['gate', 'cafe', 'park']) }), req.body);
    const plan = await loadPlan(planId, s.user.id);
    const spot = meetSpots(plan).find((x) => x.id === meetSpot)!;
    await ctx.db.tx(async (q) => {
      await q.query('update group_plans set meet_spot = $2 where id = $1', [planId, meetSpot]);
      await q.query(`insert into group_plan_messages (plan_id, user_id, kind, body, payload, created_at) values ($1,$2,'system',$3,$4,$5)`,
        [planId, s.user.id, `${spot.name.en} · ${spot.time}`, json({ meetSpot, time: spot.time }), ctx.clock.now()]);
    });
    const out = await presentPlan(planId, s.user.id);
    return { ...out, message: fill(L('Meet spot set · {n}', 'Đã chốt điểm hẹn · {n}'), { n: spot.time }) };
  });

  app.patch<{ Params: { id: string; userId: string } }>('/plans/:id/members/:userId', async (req) => {
    const s = requireUser(req);
    const planId = parse(uuid, req.params.id);
    const memberId = parse(uuid, req.params.userId);
    const { paid } = parse(z.object({ paid: z.boolean() }), req.body);
    const plan = await loadPlan(planId, s.user.id);
    if (plan.owner_id !== s.user.id) throw forbidden('owner_only', L('Only the person who made the plan can mark payments', 'Chỉ người tạo kế hoạch đánh dấu được thanh toán'));
    const res = await one(ctx.db,
      'update group_plan_members set paid = $3, paid_at = case when $3 then $4::timestamptz else null end where plan_id = $1 and user_id = $2 returning 1',
      [planId, memberId, paid, ctx.clock.now()]);
    if (!res) throw notFound();
    return presentPlan(planId, s.user.id);
  });

  app.post<{ Params: { id: string; userId: string } }>('/plans/:id/members/:userId/remind', async (req) => {
    const s = requireUser(req);
    const planId = parse(uuid, req.params.id);
    const memberId = parse(uuid, req.params.userId);
    const plan = await loadPlan(planId, s.user.id);
    if (plan.owner_id !== s.user.id) throw forbidden('owner_only', L('Only the person who made the plan can send reminders', 'Chỉ người tạo kế hoạch gửi được lời nhắc'));
    const now = ctx.clock.now();
    const m = await one<any>(ctx.db, 'select u.name, m.last_reminded_at from group_plan_members m join users u on u.id = m.user_id where m.plan_id = $1 and m.user_id = $2', [planId, memberId]);
    if (!m) throw notFound();
    if (m.last_reminded_at && now.getTime() - new Date(m.last_reminded_at).getTime() < 3600_000) {
      throw tooMany('reminded_recently', L('You reminded them less than an hour ago', 'Bạn vừa nhắc chưa tới một giờ trước'));
    }
    const unit = await pricePerHead(ctx.db, plan);
    await ctx.db.tx(async (q) => {
      await q.query('update group_plan_members set last_reminded_at = $3 where plan_id = $1 and user_id = $2', [planId, memberId, now]);
      await notifyUser(q, now, {
        userId: memberId, topic: 'friends', kind: 'plan_payment_reminder',
        title: L('Ticket money reminder', 'Nhắc tiền vé'),
        body: fill(L('{v} for {e}', '{v} cho {e}'), { v: vnd(unit, 'en'), e: plan.title }),
        link: { screen: 'plan', planId },
      });
    });
    return { ok: true, message: fill(L('Reminder sent to {n}', 'Đã nhắc {n}'), { n: m.name }) };
  });

  app.get<{ Params: { id: string } }>('/plans/:id/messages', async (req) => (await presentPlan(parse(uuid, req.params.id), requireUser(req).user.id)).messages);

  app.post<{ Params: { id: string } }>('/plans/:id/messages', async (req) => {
    const s = requireUser(req);
    const planId = parse(uuid, req.params.id);
    const { body } = parse(z.object({ body: z.string().trim().min(1).max(1000) }), req.body);
    const plan = await loadPlan(planId, s.user.id);
    const now = ctx.clock.now();
    const msg = await ctx.db.tx(async (q) => {
      const m = await one<any>(q,
        `insert into group_plan_messages (plan_id, user_id, kind, body, created_at) values ($1,$2,'text',$3,$4) returning id, created_at`,
        [planId, s.user.id, body, now]);
      const others = await many<any>(q,
        `select user_id from group_plan_members where plan_id = $1 and status <> 'declined' and user_id <> $2
         union select owner_id from group_plans where id = $1 and owner_id <> $2`, [planId, s.user.id]);
      for (const o of others) {
        await notifyUser(q, now, {
          userId: o.user_id, topic: null, kind: 'plan_message', inApp: false,
          title: { en: plan.title, vi: plan.title }, body: { en: body.slice(0, 120), vi: body.slice(0, 120) }, link: { screen: 'plan', planId },
        });
      }
      return m;
    });
    return { id: msg.id, kind: 'text', body, fromMe: true, createdAt: msg.created_at };
  });

  /**
   * One request for everyone who still owes. The QR carries the per-head amount and a
   * shared reference so the owner can match transfers. Momo and ZaloPay both scan VietQR.
   */
  app.post<{ Params: { id: string } }>('/plans/:id/payment-requests', async (req) => {
    const s = requireUser(req);
    const planId = parse(uuid, req.params.id);
    const { method, post } = parse(z.object({ method: z.enum(['vietqr', 'momo', 'zalopay']), post: z.boolean().default(false) }), req.body);
    const plan = await loadPlan(planId, s.user.id);
    if (plan.owner_id !== s.user.id) throw forbidden('owner_only', L('Only the person who made the plan can request money', 'Chỉ người tạo kế hoạch gửi được yêu cầu'));
    const owner = await one<any>(ctx.db, 'select name, payee_bank_bin, payee_account_no, payee_account_name from users where id = $1', [s.user.id]);
    if (!owner.payee_account_no) {
      throw badRequest('payee_missing', L('Add the bank account you want to be paid into first', 'Hãy thêm tài khoản ngân hàng nhận tiền trước'));
    }
    const unpaid = await many<any>(ctx.db, `select user_id from group_plan_members where plan_id = $1 and status = 'going' and not paid`, [planId]);
    if (!unpaid.length) throw badRequest('nobody_owes', L('Everyone has paid', 'Mọi người đã trả đủ'));
    const going = await one<any>(ctx.db, `select count(*)::int as n from group_plan_members where plan_id = $1 and status = 'going'`, [planId]);
    const unit = await pricePerHead(ctx.db, plan);
    const prefix = String(plan.slug).replace(/[^a-z0-9]/gi, '').slice(0, 4).toUpperCase();
    const reference = `FF-${prefix}-${going.n + 1}P-${randomCode(3)}`;
    const qrPayload = buildVietQr({ bankBin: owner.payee_bank_bin, accountNo: owner.payee_account_no, amount: unit, purpose: reference });
    const bankName = BANKS[owner.payee_bank_bin] ?? owner.payee_bank_bin;
    const payee = { name: owner.payee_account_name, bank: bankName, accountMasked: `•••• ${owner.payee_account_no.slice(-4)}` };
    const amountText = vnd(unit, 'vi');
    const chatLine = fill(L('Ticket money: {v} each. QR is in the chat, reference {r}.', 'Tiền vé: {v}/người. Mã QR ở trong chat, nội dung {r}.'), { v: amountText, r: reference });
    const now = ctx.clock.now();

    await ctx.db.tx(async (q) => {
      const r = await one<any>(q,
        `insert into payment_requests (plan_id, created_by, method, amount_per_head, reference, qr_payload, payee, recipient_ids, created_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id`,
        [planId, s.user.id, method, unit, reference, qrPayload, json(payee), unpaid.map((u) => u.user_id), now]);
      if (post) {
        await q.query(`insert into group_plan_messages (plan_id, user_id, kind, body, payload, created_at) values ($1,$2,'payment_request',$3,$4,$5)`,
          [planId, s.user.id, chatLine.vi, json({ requestId: r.id, method, amount: unit, reference, qrPayload, payee }), now]);
        for (const u of unpaid) {
          await notifyUser(q, now, {
            userId: u.user_id, topic: 'friends', kind: 'plan_payment_request',
            title: L('Ticket money request', 'Yêu cầu tiền vé'), body: chatLine, link: { screen: 'plan', planId },
          });
        }
      }
    });

    return {
      method,
      title: fill(L('Request by {m}', 'Yêu cầu qua {m}'), { m: METHODS[method] }),
      sub: fill(L('{n} people · {v} each', '{n} người · {v} mỗi người'), { n: unpaid.length, v: amountText }),
      amount: unit,
      reference,
      qrPayload,
      payee,
      payeeLine: `${payee.name} · ${payee.bank} ${payee.accountMasked}`,
      chatLine,
      transferDetails: { bank: bankName, accountNo: owner.payee_account_no, accountName: owner.payee_account_name, amount: unit, note: reference },
      note: L('The QR carries the amount and the reference. Nothing leaves this group.', 'Mã QR đã có số tiền và nội dung chuyển khoản. Không có gì ra khỏi nhóm này.'),
      posted: post,
    };
  });
}
