/**
 * Who referred this visitor to an event (growth plan card D): the `?ref=` of a share link, kept
 * on the phone for 30 days (REF_DAYS in lib/affiliate.ts), last click wins. "Mua vé" carries it to
 * /go, which credits the sharer only if their link was opened here. Browser storage only.
 */
const DAYS = 30;
const RE = /^[2-9A-HJ-NP-Z]{6}$/;
const key = (eventId: string) => 'ff:ref:' + eventId;

export function rememberRef(eventId: string, ref: string | null): void {
  const code = (ref ?? '').toUpperCase();
  if (!RE.test(code)) return;
  try { localStorage.setItem(key(eventId), JSON.stringify({ ref: code, at: Date.now() })); } catch { /* storage blocked */ }
}

export function refFor(eventId: string): string | null {
  try {
    const raw = localStorage.getItem(key(eventId));
    if (!raw) return null;
    const v = JSON.parse(raw) as { ref?: string; at?: number };
    if (!v.ref || !RE.test(v.ref) || !v.at || Date.now() - v.at > DAYS * 86_400_000) { localStorage.removeItem(key(eventId)); return null; }
    return v.ref;
  } catch { return null; }
}
