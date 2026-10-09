'use client';
/**
 * Badges on a profile (the profile boards): the earned ones as tiles (emblem, name, when; "Mới"
 * on new ones), a tile opens its card (when it was earned, how rare, the rule), and "Đang làm"
 * folds the ones in progress with a bar each. Nothing earned on someone else's page: no section.
 */
import { useState } from 'react';
import { XIcon } from '@phosphor-icons/react/ssr';
import { fill, pick, type Lang, type Pair } from '../copy';
import { cx } from '../cx';
import type { Family } from '../genre';
import { Accordion, Card as Panel, Emblem } from './parts';

export interface BadgeView {
  code: string; family: Family; emblem: 'shape' | 'num'; ring: string | null; label: Pair; rule: Pair;
  threshold: number; value: number; earned: boolean; earnedAt: string | null; isNew: boolean; rarityPct: number | null;
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

// One zone for the server's HTML and the browser's, so the day never differs between them.
const date = (iso: string, lang: Lang) => new Date(iso).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });

export function Badges({ lang, items, who, own, compact, className }: { lang: Lang; items: BadgeView[] | null | undefined; who: Pair; own?: boolean; compact?: boolean; className?: string }) {
  const T = pick(COPY, lang);
  const [open, setOpen] = useState<string | null>(null);
  if (!items?.length) return null;
  const got = items.filter((b) => b.earned);
  const todo = items.filter((b) => !b.earned);
  if (!got.length && !own) return null;
  const cur = got.find((b) => b.code === open) ?? null;
  const nf = (n: number) => n.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US');
  return (
    <section className={cx('flex flex-col gap-3.5', className)} aria-label={T.title}>
      <div className="kd-sec"><h2 className={compact ? 'kd-h' : 'kd-d3'}>{T.title}</h2><span className="kd-m kd-num">{fill(T.earned, { n: got.length, t: items.length })}</span></div>
      {got.length ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(118px,1fr))] gap-2">
          {got.map((b) => (
            <button key={b.code} type="button" className="kd-bdg" aria-pressed={open === b.code} onClick={() => setOpen(open === b.code ? null : b.code)}>
              <Emblem family={b.family} n={b.emblem === 'num' ? b.ring : null} />
              <span className="kd-hs text-[13px] leading-tight">{b.label[lang]}</span>
              {b.earnedAt ? <span className="kd-m kd-num text-[10px]">{date(b.earnedAt, lang)}</span> : null}
              {own && b.isNew ? <span className="kd-tag kd-tag-acc absolute right-1.5 top-1.5 h-[18px] px-1.5 text-[10px]">{T.isNew}</span> : null}
            </button>
          ))}
        </div>
      ) : null}
      {cur ? (
        <Panel role="status" className="grid max-w-[640px] grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1 p-4">
          <span className="kd-h">{cur.label[lang]}</span>
          <button type="button" className="kd-ib kd-ib-sm -mr-2 -mt-2" aria-label={T.close} onClick={() => setOpen(null)}><XIcon size={16} aria-hidden="true" /></button>
          <span className="kd-m kd-num col-span-2">
            {[cur.earnedAt ? fill(T.on, { d: date(cur.earnedAt, lang) }) : null, cur.rarityPct != null ? fill(T.rare, { p: nf(cur.rarityPct), who: who[lang] }) : null].filter(Boolean).join(' · ')}
          </span>
          <p className="kd-t col-span-2 pt-1">{cur.rule[lang]}</p>
        </Panel>
      ) : null}
      {todo.length ? (
        <Accordion small className="border-t border-line" summary={T.inProgress} aside={todo.length}>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(240px,100%),1fr))] gap-5">
            {todo.map((b) => (
              <div key={b.code} className="grid grid-cols-[40px_minmax(0,1fr)] items-start gap-3">
                <Emblem family={b.family} n={b.emblem === 'num' ? b.ring : null} off small />
                <div className="flex min-w-0 flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-2"><span className="kd-hs text-sm">{b.label[lang]}</span><span className="kd-m kd-num">{nf(b.value)} / {nf(b.threshold)}</span></div>
                  <span className="kd-bar-track block h-1"><span className="kd-bar-fill block h-full" style={{ width: `${Math.round((b.value / b.threshold) * 100)}%` }} /></span>
                  <span className="kd-s text-xs">{b.rule[lang]}</span>
                </div>
              </div>
            ))}
          </div>
        </Accordion>
      ) : null}
    </section>
  );
}
