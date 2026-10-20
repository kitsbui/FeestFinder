'use client';
/**
 * A person's badges on their profile (growth plan card E), whatever their craft: up to six pinned
 * marks in a row with "{n}/{total}", and a sheet with every badge by group: earned ones with the
 * day and how many ravers have them, the rest faded with how far along. On one's own profile each
 * earned badge can be pinned ("Khoe", at most six) and shared as a story.
 */
import { useState } from 'react';
import { FF } from '@/runtime/ff';
import { INTL, fill, pick, type Lang, type Pair, tx } from '../copy';
import { useKd } from '../runtime';
import { Button } from './actions';
import { Sheet } from './sheet';
import { BadgeMark, type BadgeView } from './badges';

const COPY = {
  title: { en: 'Badges', vi: 'Huy hiệu' },
  count: { en: '{n}/{t}', vi: '{n}/{t}' },
  none: { en: 'No badges yet. See all {t}', vi: 'Chưa có huy hiệu. Xem {t} huy hiệu' },
  all: { en: 'See all badges', vi: 'Xem tất cả huy hiệu' },
  on: { en: 'Earned {d}', vi: 'Đạt {d}' },
  rare: { en: '{p}% of ravers have it', vi: '{p}% raver có' },
  pin: { en: 'Pin', vi: 'Khoe' },
  unpin: { en: 'Unpin', vi: 'Bỏ khoe' },
  share: { en: 'Share', vi: 'Chia sẻ' },
  full: { en: 'Six pinned already: unpin one first', vi: 'Đã khoe đủ 6: bỏ một cái trước' },
  close: { en: 'Close', vi: 'Đóng' },
  kicker: { en: 'Badge · FeestFinder', vi: 'Huy hiệu · FeestFinder' },
};

export const PIN_LIMIT = 6;
const date = (iso: string, lang: Lang) => new Date(iso).toLocaleDateString((lang === 'en' ? 'en-GB' : INTL[lang]), { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });

export function ProfileBadges({ lang, items, pins: initialPins, own, className }: { lang: Lang; items: BadgeView[] | null; pins: string[]; own?: boolean; className?: string }) {
  const T = pick(COPY, lang);
  const kd = useKd();
  const [open, setOpen] = useState(false);
  const [pins, setPins] = useState<string[]>(initialPins);
  const [busy, setBusy] = useState(false);
  if (!items) return <div className={'kd-skel h-24 ' + (className ?? '')} aria-hidden="true" />;
  const got = items.filter((b) => b.earned);
  if (!got.length && !own) return null;
  const pinned = pins.map((c) => got.find((b) => b.code === c)).filter((b): b is BadgeView => !!b);
  // Nothing pinned yet: the latest ones stand in.
  const row = (pinned.length ? pinned : got).slice(0, PIN_LIMIT);
  const nf = (n: number) => n.toLocaleString(INTL[lang]);

  const toggle = async (b: BadgeView) => {
    const next = pins.includes(b.code) ? pins.filter((c) => c !== b.code) : [...pins, b.code];
    if (next.length > PIN_LIMIT) { kd.toast(T.full); return; }
    setBusy(true);
    try {
      const r = await FF.put('/me/badges/pins', { codes: next }) as { pins: string[] };
      setPins(r.pins);
    } catch (e) { kd.toast(FF.errorText(e, lang)); } finally { setBusy(false); }
  };
  const share = async (b: BadgeView) => {
    FF.track('share', { kind: 'badge', value: b.code });
    const how = await FF.shareStory({
      kicker: T.kicker, title: tx(b.label, lang),
      lines: [tx(b.rule, lang), b.rarityPct != null ? fill(T.rare, { p: nf(b.rarityPct) }) : ''].filter(Boolean),
      url: 'feestfinder.com',
    }, 'badge-' + b.code).catch((e: unknown) => { kd.toast(FF.errorText(e, lang)); return null; });
    if (how === 'saved') kd.toast(lang === 'vi' ? 'Đã lưu ảnh story' : 'Story image saved');
  };

  const groups: { key: string; label: Pair; items: BadgeView[] }[] = [];
  for (const b of items) {
    const key = b.group ?? 'other';
    let gr = groups.find((x) => x.key === key);
    if (!gr) {
      gr = { key, label: b.groupLabel ?? COPY.title, items: [] };
      groups.push(gr);
    }
    gr.items.push(b);
  }

  return (
    <section id="badges" className={'flex scroll-mt-24 flex-col gap-3 ' + (className ?? '')} aria-labelledby="badges-h">
      <div className="kd-sec"><h2 id="badges-h" className="kd-d3">{T.title}</h2><span className="kd-m kd-num">{fill(T.count, { n: got.length, t: items.length })}</span></div>
      {row.length ? (
        <ul className="flex flex-wrap gap-3" aria-label={T.title}>
          {row.map((b) => (
            <li key={b.code}>
              <button type="button" className="kd-bm-btn" aria-label={tx(b.label, lang)} onClick={() => setOpen(true)}><BadgeMark b={b} size={44} /></button>
            </li>
          ))}
          <li><Button size="sm" tone="ghost" onClick={() => setOpen(true)}>{T.all}</Button></li>
        </ul>
      ) : (
        <Button size="sm" tone="ghost" className="self-start" onClick={() => setOpen(true)}>{fill(T.none, { t: items.length })}</Button>
      )}
      {open ? (
        <Sheet title={T.title} closeLabel={T.close} onClose={() => setOpen(false)} wide>
          <div className="flex flex-col gap-6 pb-4">
            {groups.map((gr) => (
              <section key={gr.key} className="flex flex-col gap-2" aria-label={tx(gr.label, lang)}>
                <h3 className="kd-m">{tx(gr.label, lang)}</h3>
                <ul className="flex flex-col">
                  {[...gr.items.filter((b) => b.earned), ...gr.items.filter((b) => !b.earned)].map((b) => (
                    <li key={b.code} className="flex min-h-16 items-center gap-3 border-b border-line-1 py-2.5 last:border-b-0">
                      <BadgeMark b={b} size={44} progress />
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="kd-hs">{tx(b.label, lang)}</span>
                        <span className="kd-s">{tx(b.rule, lang)}</span>
                        <span className="kd-m kd-num normal-case">
                          {b.earned
                            ? [b.earnedAt ? fill(T.on, { d: date(b.earnedAt, lang) }) : null, b.rarityPct != null ? fill(T.rare, { p: nf(b.rarityPct) }) : null].filter(Boolean).join(' · ')
                            : `${nf(b.value)}/${nf(b.threshold)}`}
                        </span>
                      </span>
                      {own && b.earned ? (
                        <span className="flex flex-col gap-1 tab:flex-row">
                          <Button size="sm" tone={pins.includes(b.code) ? 'default' : 'ghost'} aria-pressed={pins.includes(b.code)} disabled={busy}
                            aria-label={`${pins.includes(b.code) ? T.unpin : T.pin}: ${tx(b.label, lang)}`} onClick={() => toggle(b)}>
                            {pins.includes(b.code) ? T.unpin : T.pin}
                          </Button>
                          <Button size="sm" tone="ghost" aria-label={`${T.share}: ${tx(b.label, lang)}`} onClick={() => share(b)}>{T.share}</Button>
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </Sheet>
      ) : null}
    </section>
  );
}
