'use client';
/**
 * Badges on a profile (the profile boards): the earned ones as tiles (emblem, name, when; "Mới"
 * on new ones), a tile opens its card (when it was earned, how rare, the rule), and "Đang làm"
 * folds the ones in progress with a bar each. Nothing earned on someone else's page: no section.
 */
import { useState } from 'react';
import { XIcon } from '@phosphor-icons/react/ssr';
import { INTL, fill, pick, type Lang, type Pair, tx } from '../copy';
import { cx } from '../cx';
import type { Family } from '../genre';
import { g } from '../genre';
import { Accordion, Card as Panel } from './parts';

export interface BadgeView {
  code: string; family: Family; emblem: 'shape' | 'num'; ring: string | null; label: Pair; rule: Pair;
  threshold: number; value: number; earned: boolean; earnedAt: string | null; isNew: boolean; rarityPct: number | null;
  /** Badges v2 (growth plan card E). */
  role?: 'user' | 'artist' | 'organizer'; group?: string; groupLabel?: Pair; tier?: 'common' | 'rare' | 'legendary'; icon?: string | null; pinned?: boolean;
}

const COPY = {
  title: { en: 'Badges', vi: 'Huy hiệu' },
  earned: { en: '{n} / {t} earned', vi: '{n} / {t} đã đạt' },
  inProgress: { en: 'In progress', vi: 'Đang làm' },
  isNew: { en: 'New', vi: 'Mới' },
  on: { en: 'Earned {d}', vi: 'Đạt {d}' },
  rare: { en: '{p}% of {who} have it', vi: '{p}% {who} có' },
  close: { en: 'Close', vi: 'Đóng' },
};

/**
 * A badge's mark (growth plan card E): a disc ringed by its tier (common, rare, legendary), its
 * sign from one sprite of Phosphor's Regular icons (public/kd/badges.svg, by icon name) or its
 * number, and its group's dot at the foot. Not earned: a dashed ring, a faded sign, and in the
 * sheet an arc of how far along. New: a dot at the top right until seen. Sizes 64, 44 and 28.
 */
export function BadgeMark({ b, size = 44, progress }: { b: BadgeView; size?: 64 | 44 | 28; progress?: boolean }) {
  const icon = b.icon ?? null;
  const pct = !b.earned && progress ? Math.min(1, b.value / Math.max(1, b.threshold)) : 0;
  return (
    <span className={cx('kd-bm', g(b.family), `kd-bm-${size}`, `kd-bm-${b.tier ?? 'common'}`, !b.earned && 'kd-bm-off')} aria-hidden="true">
      {pct > 0 ? (
        <svg className="kd-bm-arc" viewBox="0 0 36 36"><circle cx="18" cy="18" r="16.5" pathLength="100" strokeDasharray={`${Math.round(pct * 100)} 100`} /></svg>
      ) : null}
      {icon ? <svg className="kd-bm-i"><use href={'/kd/badges.svg#' + icon} /></svg> : <span className="kd-bm-n kd-num">{b.ring ?? b.threshold}</span>}
      <i className="kd-bm-dot" />
      {b.isNew ? <i className="kd-bm-new" /> : null}
    </span>
  );
}

// One zone for the server's HTML and the browser's, so the day never differs between them.
const date = (iso: string, lang: Lang) => new Date(iso).toLocaleDateString((lang === 'en' ? 'en-GB' : INTL[lang]), { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });

export function Badges({ lang, items, who, own, compact, className }: { lang: Lang; items: BadgeView[] | null | undefined; who: Pair; own?: boolean; compact?: boolean; className?: string }) {
  const T = pick(COPY, lang);
  const [open, setOpen] = useState<string | null>(null);
  if (!items?.length) return null;
  const got = items.filter((b) => b.earned);
  const todo = items.filter((b) => !b.earned);
  if (!got.length && !own) return null;
  const cur = got.find((b) => b.code === open) ?? null;
  const nf = (n: number) => n.toLocaleString(INTL[lang]);
  return (
    <section className={cx('flex flex-col gap-3.5', className)} aria-label={T.title}>
      <div className="kd-sec"><h2 className={compact ? 'kd-h' : 'kd-d3'}>{T.title}</h2><span className="kd-m kd-num">{fill(T.earned, { n: got.length, t: items.length })}</span></div>
      {got.length ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(118px,1fr))] gap-2">
          {got.map((b) => (
            <button key={b.code} type="button" className="kd-bdg" aria-pressed={open === b.code} onClick={() => setOpen(open === b.code ? null : b.code)}>
              <BadgeMark b={b} size={64} />
              <span className="kd-hs text-[13px] leading-tight">{tx(b.label, lang)}</span>
              {b.earnedAt ? <span className="kd-m kd-num text-[10px]">{date(b.earnedAt, lang)}</span> : null}
              {own && b.isNew ? <span className="kd-tag kd-tag-acc absolute right-1.5 top-1.5 h-[18px] px-1.5 text-[10px]">{T.isNew}</span> : null}
            </button>
          ))}
        </div>
      ) : null}
      {cur ? (
        <Panel role="status" className="grid max-w-[640px] grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1 p-4">
          <span className="kd-h">{tx(cur.label, lang)}</span>
          <button type="button" className="kd-ib kd-ib-sm -mr-2 -mt-2" aria-label={T.close} onClick={() => setOpen(null)}><XIcon size={16} aria-hidden="true" /></button>
          <span className="kd-m kd-num col-span-2">
            {[cur.earnedAt ? fill(T.on, { d: date(cur.earnedAt, lang) }) : null, cur.rarityPct != null ? fill(T.rare, { p: nf(cur.rarityPct), who: tx(who, lang) }) : null].filter(Boolean).join(' · ')}
          </span>
          <p className="kd-t col-span-2 pt-1">{tx(cur.rule, lang)}</p>
        </Panel>
      ) : null}
      {todo.length ? (
        <Accordion small className="border-t border-line-1" summary={T.inProgress} aside={todo.length}>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(240px,100%),1fr))] gap-5">
            {todo.map((b) => (
              <div key={b.code} className="grid grid-cols-[44px_minmax(0,1fr)] items-start gap-3">
                <BadgeMark b={b} size={44} progress />
                <div className="flex min-w-0 flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-2"><span className="kd-hs text-sm">{tx(b.label, lang)}</span><span className="kd-m kd-num">{nf(b.value)} / {nf(b.threshold)}</span></div>
                  <span className="kd-bar-track block h-1"><span className="kd-bar-fill block h-full" style={{ width: `${Math.round((b.value / b.threshold) * 100)}%` }} /></span>
                  <span className="kd-s text-xs">{tx(b.rule, lang)}</span>
                </div>
              </div>
            ))}
          </div>
        </Accordion>
      ) : null}
    </section>
  );
}
