import { waitUntil } from '@vercel/functions';

/**
 * Work that carries on after the response is sent: delivering a sign-in code, checking a
 * ticket link. A long-lived server just keeps running it. On Vercel an instance can be
 * frozen as soon as its response is out, which would leave a code unsent until the next
 * request happened to wake it, so the platform is asked to wait for the work to finish.
 */
export function inBackground(work: Promise<unknown>, onError: (e: unknown) => void = () => {}): void {
  waitUntil(work.catch(onError));
}
