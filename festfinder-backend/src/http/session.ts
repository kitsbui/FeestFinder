import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Ctx } from '../context.ts';
import type { Queryable } from '../db/index.ts';
import { one } from '../db/index.ts';
import { randomToken, sha256 } from '../lib/crypto.ts';

export const SESSION_COOKIE = 'ff_session';
const USER_TTL_DAYS = 60;
const STAFF_TTL_DAYS = 3;

export interface SessionInfo {
  tokenHash: string;
  kind: 'user' | 'staff';
  readOnly: boolean;
  impersonatorId: string | null;
  user: { id: string; name: string; email: string | null; phone: string | null; role: 'user' | 'admin'; locale: 'en' | 'vi' } | null;
  staff: { id: string; eventId: string; name: string; gate: string; role: 'scanner' | 'lead' } | null;
}

export async function createSession(
  q: Queryable, now: Date,
  opts: { kind: 'user'; userId: string; readOnly?: boolean; impersonatorId?: string; ttlMs?: number } | { kind: 'staff'; staffId: string },
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomToken();
  const ttl = opts.kind === 'staff' ? STAFF_TTL_DAYS * 86400_000 : (opts.ttlMs ?? USER_TTL_DAYS * 86400_000);
  const expiresAt = new Date(now.getTime() + ttl);
  await q.query(
    `insert into sessions (token_hash, kind, user_id, staff_id, read_only, impersonator_id, created_at, expires_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [sha256(token), opts.kind,
      opts.kind === 'user' ? opts.userId : null,
      opts.kind === 'staff' ? opts.staffId : null,
      opts.kind === 'user' ? !!opts.readOnly : false,
      opts.kind === 'user' ? opts.impersonatorId ?? null : null,
      now, expiresAt]);
  return { token, expiresAt };
}

function tokenFrom(req: FastifyRequest): string | null {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) return auth.slice(7).trim() || null;
  return req.cookies?.[SESSION_COOKIE] ?? null;
}

export async function resolveSession(ctx: Ctx, req: FastifyRequest): Promise<SessionInfo | null> {
  const token = tokenFrom(req);
  if (!token) return null;
  const row = await one<any>(ctx.db,
    `select s.token_hash, s.kind, s.read_only, s.impersonator_id, s.expires_at,
            u.id as u_id, u.name as u_name, u.email as u_email, u.phone as u_phone, u.role as u_role, u.locale as u_locale,
            st.id as st_id, st.event_id as st_event, st.name as st_name, st.gate as st_gate, st.role as st_role, st.active as st_active
       from sessions s
       left join users u on u.id = s.user_id
       left join event_staff st on st.id = s.staff_id
      where s.token_hash = $1`, [sha256(token)]);
  if (!row || new Date(row.expires_at) <= ctx.clock.now()) return null;
  if (row.kind === 'staff' && !row.st_active) return null;
  return {
    tokenHash: row.token_hash,
    kind: row.kind,
    readOnly: row.read_only,
    impersonatorId: row.impersonator_id,
    user: row.u_id ? { id: row.u_id, name: row.u_name, email: row.u_email, phone: row.u_phone, role: row.u_role, locale: row.u_locale } : null,
    staff: row.st_id ? { id: row.st_id, eventId: row.st_event, name: row.st_name, gate: row.st_gate, role: row.st_role } : null,
  };
}

/** Web clients get an httpOnly cookie; apps read `token` from the body and send it as a Bearer header. */
export function setSessionCookie(ctx: Ctx, reply: FastifyReply, token: string, expiresAt: Date) {
  reply.setCookie(SESSION_COOKIE, token, {
    httpOnly: true, sameSite: 'lax', secure: ctx.config.cookieSecure, path: '/', expires: expiresAt,
  });
}
