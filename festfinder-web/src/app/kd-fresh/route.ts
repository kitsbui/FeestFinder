/**
 * POST /kd-fresh {kind, slug}: the public pages a save changed render again on their next visit
 * (kd/fresh.ts calls it after a save). A route handler, not a server function: a server function
 * refreshes the router, which drops a back office's filters kept in the address. Only signed-in
 * people save anything, so a request without a session cookie does nothing.
 */
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { pathsToFreshen } from '@/kd/fresh-paths';

export async function POST(req: Request): Promise<Response> {
  if (!(await cookies()).has('ff_session')) return new Response(null, { status: 204 });
  let body: unknown = null;
  try { body = await req.json(); } catch { /* an empty or broken body freshens nothing */ }
  const { kind, slug } = (body ?? {}) as { kind?: unknown; slug?: unknown };
  for (const path of pathsToFreshen(kind, slug)) revalidatePath(path);
  return new Response(null, { status: 204 });
}
