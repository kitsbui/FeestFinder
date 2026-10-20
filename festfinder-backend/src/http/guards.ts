import type { FastifyRequest } from 'fastify';
import type { Ctx } from '../context.ts';
import { one } from '../db/index.ts';
import { forbidden, notFound, unauthorized } from '../lib/errors.ts';
import { L } from '../lib/i18n.ts';
import type { SessionInfo } from './session.ts';

export type UserSession = SessionInfo & { user: NonNullable<SessionInfo['user']> };

export function requireUser(req: FastifyRequest): UserSession {
  const s = req.session;
  if (!s || !s.user) throw unauthorized();
  return s as UserSession;
}

/**
 * Writing what other people read (a comment, a submitted event, a project, a mix). Signing in is
 * enough (owner, 2026-10-20). With REQUIRE_PHONE_TO_POST (config.requirePhoneToPost) it also needs a
 * Vietnamese number proven with a one-time code, as Decree 147/2024 asks of networks where people
 * publish; the screens answer `phone_unverified` by opening that step.
 */
export function requireWriter(req: FastifyRequest): UserSession {
  const s = requireUser(req);
  if (req.server.ctx.config.requirePhoneToPost && !s.user.phoneVerified) {
    throw forbidden('phone_unverified', L('Confirm your phone number with a code before posting', 'Xác thực số điện thoại bằng mã trước khi đăng'));
  }
  return s;
}

/**
 * The session when it is the team's (an admin from the ADMIN_EMAIL allowlist, not viewing as
 * someone else), else null: what the team posts needs no review.
 */
export function teamSession(req: FastifyRequest): UserSession | null {
  const s = req.session;
  return s?.user && s.user.role === 'admin' && !s.impersonatorId ? s as UserSession : null;
}

export function requireAdmin(req: FastifyRequest): UserSession {
  const s = requireUser(req);
  if (s.user.role !== 'admin' || s.impersonatorId) throw forbidden('admin_only', L('Admin account only', 'Chỉ tài khoản admin'));
  return s;
}

export interface OrgAccess { organizerId: string; role: 'owner' | 'manager'; userId: string }

/**
 * Resolves which organiser a back-office request acts for: `x-organizer-id` when the
 * user belongs to several, otherwise their only membership.
 */
export async function requireOrganizer(ctx: Ctx, req: FastifyRequest): Promise<OrgAccess> {
  const s = requireUser(req);
  const wanted = req.headers['x-organizer-id'];
  const row = await one<any>(ctx.db,
    `select organizer_id, role from organizer_members where user_id = $1 ${typeof wanted === 'string' ? 'and organizer_id::text = $2' : ''}
     order by role = 'owner' desc limit 1`,
    typeof wanted === 'string' ? [s.user.id, wanted] : [s.user.id]);
  if (!row) throw forbidden('not_an_organizer', L('This account is not part of an organiser team', 'Tài khoản này chưa thuộc nhà tổ chức nào'));
  return { organizerId: row.organizer_id, role: row.role, userId: s.user.id };
}

/** Loads an event and checks it belongs to the organiser making the request. */
export async function requireOwnEvent(ctx: Ctx, org: OrgAccess, eventId: string): Promise<any> {
  const ev = /^[0-9a-f-]{36}$/i.test(eventId)
    ? await one<any>(ctx.db, 'select * from events where id = $1', [eventId])
    : null;
  if (!ev || ev.organizer_id !== org.organizerId) throw notFound(L('Event not found', 'Không tìm thấy sự kiện'));
  return ev;
}

