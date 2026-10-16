'use client';
/**
 * "Khoảnh khắc" on a profile: up to nine photos. The owner adds one by pasting a link to it
 * (only an event's own media is uploaded; the API checks the link) and removes them; anyone
 * else signed in can report one. Nobody's photos and not the owner: no section.
 */
import { useState, type FormEvent } from 'react';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang } from './copy';
import { cx } from './cx';
import { PhoneSheet } from './phone';
import { useKd } from './runtime';
import { Button } from './ui/actions';
import { FieldLabel, Input } from './ui/forms';
import { ImageLinkField } from './ui/image-link';
import { MOMENTS_MAX, MomentsGrid, type Moment } from './ui/moments';
import { Sheet } from './ui/sheet';

export type MomentOwner = 'user' | 'artist' | 'organizer';

const COPY = {
  title: { en: 'Moments', vi: 'Khoảnh khắc' },
  count: { en: '{n} / {m}', vi: '{n} / {m}' },
  add: { en: 'Add', vi: 'Thêm' },
  adding: { en: 'Adding…', vi: 'Đang thêm…' },
  addTitle: { en: 'Add a moment', vi: 'Thêm khoảnh khắc' },
  photo: { en: 'Photo', vi: 'Ảnh' },
  photoHint: { en: 'Image link · from 400 px on the short side', vi: 'Link ảnh · cạnh ngắn từ 400 px' },
  caption: { en: 'Caption', vi: 'Chú thích' },
  save: { en: 'Add', vi: 'Thêm' },
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
  const [sheet, setSheet] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [phoneFor, setPhoneFor] = useState<{ url: string; caption: string } | null>(null);
  // A newer answer from the page (the owner's view in the browser) replaces the server's copy.
  const [seen, setSeen] = useState(initial);
  if (initial !== seen) { setSeen(initial); setItems(initial); }
  if (!items.length && !owner) return null;

  const add = async (picked: { url: string; caption: string }) => {
    setBusy(true);
    try {
      const m = await FF.post('/me/moments', { as, url: picked.url, caption: picked.caption.trim() || null, ...(as === 'organizer' && organizerId ? { organizerId } : {}) });
      setItems((xs) => [...xs, m]);
      setSheet(false); setLink(null); setCaption('');
      onChange?.();
    } catch (e) {
      // A public profile needs a confirmed phone to publish: confirm it, then the same photo goes up.
      if ((e as { code?: string }).code === 'phone_unverified') setPhoneFor(picked);
      else kd.toast(FF.errorText(e, lang));
    }
    setBusy(false);
  };
  const submit = (e: FormEvent) => { e.preventDefault(); if (link && !busy) void add({ url: link, caption }); };
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
        onAdd={() => { if (!busy) setSheet(true); }}
        onRemove={remove}
        onReport={report}
        reasons={[{ key: 'not_mine', label: T.rNotMine }, { key: 'offensive', label: T.rOffensive }, { key: 'unsafe', label: T.rUnsafe }, { key: 'spam', label: T.rSpam }]}
        labels={{ add: busy ? T.adding : T.add, open: T.open, close: T.close, prev: T.prev, next: T.next, remove: T.remove, report: T.report }}
      />
      {phoneFor ? <PhoneSheet lang={lang} onClose={() => setPhoneFor(null)} onDone={() => { const f = phoneFor; setPhoneFor(null); void add(f); }} /> : null}
      {owner && sheet ? (
        <Sheet onClose={() => setSheet(false)} title={T.addTitle} closeLabel={T.close}>
          <form className="flex flex-col gap-4 pt-2" onSubmit={submit}>
            <ImageLinkField lang={lang} purpose="moment" label={T.photo} hint={T.photoHint} value={link} onChange={setLink} />
            <div className="flex flex-col gap-2">
              <FieldLabel htmlFor="moment-caption" hint={`${caption.length}/140`}>{T.caption}</FieldLabel>
              <Input id="moment-caption" maxLength={140} value={caption} onChange={(e) => setCaption(e.target.value)} />
            </div>
            <Button type="submit" tone="acc" disabled={!link || busy}>{busy ? T.adding : T.save}</Button>
          </form>
        </Sheet>
      ) : null}
    </section>
  );
}
