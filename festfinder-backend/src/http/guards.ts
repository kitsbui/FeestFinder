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

export function optionalUserId(req: FastifyRequest): string | null {
  return req.session?.user?.id ?? null;
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

/** Door endpoints accept the organiser team or a scanner invited to that event. */
export async function requireDoorAccess(ctx: Ctx, req: FastifyRequest, eventId: string): Promise<{ staffId: string | null; lead: boolean; gate: string | null }> {
  const s = req.session;
  if (!s) throw unauthorized();
  if (s.kind === 'staff' && s.staff) {
    if (s.staff.eventId !== eventId) throw forbidden('wrong_event', L('This scanner is set up for a different event', 'Máy soát vé này thuộc sự kiện khác'));
    return { staffId: s.staff.id, lead: s.staff.role === 'lead', gate: s.staff.gate };
  }
  const org = await requireOrganizer(ctx, req);
  await requireOwnEvent(ctx, org, eventId);
  return { staffId: null, lead: true, gate: null };
}
