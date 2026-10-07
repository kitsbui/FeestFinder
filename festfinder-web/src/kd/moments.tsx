'use client';
/**
 * "Khoảnh khắc" on a profile: up to nine photos. The owner adds one (uploaded to FeestFinder,
 * the only image host the CSP allows) and removes them; anyone else signed in can report one.
 * Nobody's photos and not the owner: no section.
 */
import { useRef, useState } from 'react';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang } from './copy';
import { cx } from './cx';
import { PhoneSheet } from './phone';
import { useKd } from './runtime';
import { MOMENTS_MAX, MomentsGrid, type Moment } from './ui/moments';

export type MomentOwner = 'user' | 'artist' | 'organizer';

const COPY = {
  title: { en: 'Moments', vi: 'Khoảnh khắc' },
  count: { en: '{n} / {m}', vi: '{n} / {m}' },
  add: { en: 'Add', vi: 'Thêm' },
  adding: { en: 'Uploading…', vi: 'Đang tải lên…' },
  open: { en: 'Open photo', vi: 'Mở ảnh' },
  close: { en: 'Close', vi: 'Đóng' },
  prev: { en: 'Previous', vi: 'Ảnh trước' },
  next: { en: 'Next', vi: 'Ảnh sau' },
  remove: { en: 'Remove photo', vi: 'Xoá ảnh' },
  report: { en: 'Report', vi: 'Báo cáo' },
  rNotMine: { en: 'Not theirs to post', vi: 'Không phải ảnh của họ' },
  rOffensive: { en: 'Offensive', vi: 'Phản cảm' },
  rUnsafe: { en: 'Unsafe or illegal', vi: 'Nguy hiểm hoặc trái phép' },
  rSpam: { en: 'Spam or advertising', vi: 'Spam hoặc quảng cáo' },
  signInToReport: { en: 'Log in to report a photo', vi: 'Đăng nhập để báo cáo ảnh' },
};

/**
 * `organizerId` names the organiser whose page this is (a person can be on several teams);
 * `onChange` runs after the owner adds or removes a photo.
 */
export function MomentsSection({ lang, as, items: initial, owner, organizerId, onChange, compact, className }: {
  lang: Lang; as: MomentOwner; items: Moment[]; owner: boolean; organizerId?: string; onChange?: () => void; compact?: boolean; className?: string;
}) {
  const T = pick(COPY, lang);
  const kd = useKd();
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [phoneFor, setPhoneFor] = useState<File | null>(null);
  const input = useRef<HTMLInputElement>(null);
  // A newer answer from the page (the owner's view in the browser) replaces the server's copy.
  const [seen, setSeen] = useState(initial);
  if (initial !== seen) { setSeen(initial); setItems(initial); }
  if (!items.length && !owner) return null;

  const add = async (file: File) => {
    setBusy(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const up = await FF.api('POST', '/uploads?purpose=moment', form);
      const m = await FF.post('/me/moments', { as, url: up.url, ...(as === 'organizer' && organizerId ? { organizerId } : {}) });
      setItems((xs) => [...xs, m]);
      onChange?.();
    } catch (e) {
      // A public profile needs a confirmed phone to publish: confirm it, then the same photo goes up.
      if ((e as { code?: string }).code === 'phone_unverified') setPhoneFor(file);
      else kd.toast(FF.errorText(e, lang));
    }
    setBusy(false);
  };
  const remove = async (m: Moment) => {
    try { await FF.del('/me/moments/' + m.id); setItems((xs) => xs.filter((x) => x.id !== m.id)); onChange?.(); } catch (e) { kd.toast(FF.errorText(e, lang)); }
  };
  const report = async (m: Moment, reason: string) => {
    if (!kd.user) { kd.openSignIn(T.signInToReport); return; }
    try { const out = await FF.post(`/moments/${m.id}/report`, { reason }); kd.toast(FF.text(out.message, lang)); } catch (e) { kd.toast(FF.errorText(e, lang)); }
  };
  return (
    <section className={cx('flex flex-col gap-3.5', className)} aria-label={T.title}>
      <div className="kd-sec"><h2 className={compact ? 'kd-h' : 'kd-d3'}>{T.title}</h2>{owner ? <span className="kd-m kd-num">{fill(T.count, { n: items.length, m: MOMENTS_MAX })}</span> : null}</div>
      <MomentsGrid
        items={items}
        owner={owner}
        onAdd={() => { if (!busy) input.current?.click(); }}
        onRemove={remove}
        onReport={report}
        reasons={[{ key: 'not_mine', label: T.rNotMine }, { key: 'offensive', label: T.rOffensive }, { key: 'unsafe', label: T.rUnsafe }, { key: 'spam', label: T.rSpam }]}
        labels={{ add: busy ? T.adding : T.add, open: T.open, close: T.close, prev: T.prev, next: T.next, remove: T.remove, report: T.report }}
      />
      {phoneFor ? <PhoneSheet lang={lang} onClose={() => setPhoneFor(null)} onDone={() => { const f = phoneFor; setPhoneFor(null); add(f); }} /> : null}
      {owner ? (
        <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => { const f = e.target.files?.[0]; if (f) add(f); e.target.value = ''; }} />
      ) : null}
    </section>
  );
}
