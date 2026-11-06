/**
 * The language this device chose, kept on the device (the back offices read it; the site's proxy
 * reads the `ff_lang` cookie first, kd/lang-pref.ts). Storage can be blocked; a read then falls back
 * to nothing.
 */
import { LANGS, type Lang } from '@/kd/copy';

const KEY = 'ff_lang';

export const place = {
  /** The language this device chose: the cookie the site's proxy reads first (kd/lang-pref.ts), else the storage. */
  lang: (): Lang | null => {
    let v: string | null = null;
    try { v = document.cookie.match(/(?:^|;\s*)ff_lang=([a-z]{2})(?:;|$)/)?.[1] ?? null; } catch { /* no document */ }
    try { v ??= localStorage.getItem(KEY); } catch { /* storage blocked */ }
    return v && (LANGS as readonly string[]).includes(v) ? (v as Lang) : null;
  },
  setLang: (l: Lang) => { try { localStorage.setItem(KEY, l); } catch { /* storage blocked */ } },
};
