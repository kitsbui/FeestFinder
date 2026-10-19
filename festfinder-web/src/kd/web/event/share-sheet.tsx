'use client';
/**
 * The event page's share sheet (design v2 phase 14: loaded when it opens, never at boot): the
 * channels, the story image and the clip, the collections.
 */
import { useEffect, useState, type FormEvent } from 'react';
import { CheckIcon, FacebookLogoIcon, FilmStripIcon, ImageIcon, LinkIcon, MessengerLogoIcon, PaperPlaneTiltIcon, PlusIcon, XLogoIcon, ThreadsLogoIcon, ChatCircleIcon, DotsThreeIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang, tx } from '../../copy';
import { cx } from '../../cx';
import { useKd } from '../../runtime';
import { Button } from '../../ui/actions';
import { Input } from '../../ui/forms';
import { Sheet } from '../../ui/sheet';
import { count, moneyShort, whenShort } from '../../format';
import { WEB } from '../copy';
import { useEvent } from './context';

const T = (lang: Lang) => pick(WEB, lang);

type Channel = 'copy' | 'native' | 'zalo' | 'messenger' | 'facebook' | 'threads' | 'x' | 'telegram' | 'instagram' | 'tiktok';

export function ShareSheet({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  const { ev, personal } = useEvent();
  const kd = useKd();
  const t = T(lang);
  const [video, setVideo] = useState<{ making: boolean; file?: File } | null>(null);
  const when = whenShort(ev, lang);
  const text = ev.title + ' · ' + when;
  const story = {
    genre: ev.genre ?? undefined,
    kicker: (ev.genre ?? '') + (ev.hype?.count ? ' · ' + count(ev.hype.count, lang) + ' hype' : ''),
    title: ev.title,
    lines: [when, [ev.venue.name, ev.venue.area].filter(Boolean).join(' · '), ev.isFree ? t.free : ev.priceUnknown ? null : fill(t.fromPrice, { p: moneyShort(ev.priceFrom, ev.currency, lang) })].filter((l): l is string => !!l),
    url: location.host + '/e/' + ev.slug,
  };
  const link = async (channel: Channel) => {
    try { return (await FF.post('/events/' + ev.id + '/shares', { channel })).url as string; } catch { return location.origin + '/e/' + ev.slug; }
  };
  const go = async (channel: Channel) => {
    if (channel === 'instagram') {
      FF.fire(FF.post('/events/' + ev.id + '/shares', { channel }));
      FF.track('share', { kind: 'story', slug: ev.slug });
      const how = await FF.shareStory(story, ev.slug).catch((e: unknown) => { kd.toast(FF.errorText(e, lang)); return null; });
      if (how === 'saved') kd.toast(t.storySaved);
      return;
    }
    if (channel === 'tiktok') {
      FF.fire(FF.post('/events/' + ev.id + '/shares', { channel }));
      setVideo({ making: true });
      let blob: Blob | null = null;
      try { blob = await FF.storyVideo(story); } catch { blob = null; }
      if (!blob) {
        setVideo(null);
        kd.toast(t.videoNone);
        const how = await FF.shareStory(story, ev.slug).catch(() => null);
        if (how === 'saved') kd.toast(t.storySaved);
        return;
      }
      const file = new File([blob], ev.slug + (blob.type === 'video/mp4' ? '.mp4' : '.webm'), { type: blob.type });
      if (FF.canShareFile(file)) { setVideo({ making: false, file }); return; }
      setVideo(null);
      await FF.shareFile(file, ev.title);
      kd.toast(t.videoSaved);
      return;
    }
    const url = await link(channel);
    FF.track('share', { kind: channel, slug: ev.slug });
    const u = encodeURIComponent(url), tx = encodeURIComponent(text);
    const open = (href: string) => window.open(href, '_blank', 'noopener');
    const copy = (msg: string) => {
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => kd.toast(msg), () => kd.toast(url));
      else kd.toast(url);
    };
    if (channel === 'facebook') return open('https://www.facebook.com/sharer/sharer.php?u=' + u);
    if (channel === 'threads') return open('https://www.threads.net/intent/post?text=' + encodeURIComponent(text + ' ' + url));
    if (channel === 'x') return open('https://x.com/intent/post?text=' + tx + '&url=' + u);
    if (channel === 'telegram') return open('https://t.me/share/url?url=' + u + '&text=' + tx);
    if (channel === 'messenger' && FF.isPhone()) { location.href = 'fb-messenger://share/?link=' + u; return; }
    if ((channel === 'native' || channel === 'zalo') && navigator.share) { navigator.share({ title: ev.title, text, url }).catch(() => {}); return; }
    copy(channel === 'zalo' ? t.shareCopiedZalo : channel === 'messenger' ? t.shareCopiedMessenger : t.shareCopied);
  };
  const brought = personal?.mine?.broughtVisits ?? 0;
  const tile = (channel: Channel, label: string, icon: React.ReactNode) => (
    <button key={channel} type="button" className="kd-btn kd-btn-ghost h-auto flex-col gap-2 py-3" onClick={() => go(channel)}>
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 shadow-[inset_0_0_0_1px_var(--color-line-1)]">{icon}</span>
      <span className="kd-s text-fg-2">{label}</span>
    </button>
  );
  return (
    <Sheet title={t.share} closeLabel={t.close} onClose={onClose}>
      <div className="flex flex-col gap-4 pt-2">
        <div className="grid grid-cols-4 gap-1">
          {tile('copy', t.shareCopy, <LinkIcon size={20} aria-hidden="true" />)}
          {tile('zalo', 'Zalo', <ChatCircleIcon size={20} aria-hidden="true" />)}
          {tile('messenger', 'Messenger', <MessengerLogoIcon size={20} aria-hidden="true" />)}
          {tile('facebook', 'Facebook', <FacebookLogoIcon size={20} aria-hidden="true" />)}
          {tile('instagram', t.shareStory, <ImageIcon size={20} aria-hidden="true" />)}
          {tile('tiktok', t.shareVideo, <FilmStripIcon size={20} aria-hidden="true" />)}
          {tile('threads', 'Threads', <ThreadsLogoIcon size={20} aria-hidden="true" />)}
          {tile('x', 'X', <XLogoIcon size={20} aria-hidden="true" />)}
          {tile('telegram', 'Telegram', <PaperPlaneTiltIcon size={20} aria-hidden="true" />)}
          {typeof navigator !== 'undefined' && 'share' in navigator ? tile('native', t.shareMore, <DotsThreeIcon size={20} aria-hidden="true" />) : null}
        </div>
        {video ? (
          video.making ? (
            <p className="kd-s" role="status">{t.videoMaking}</p>
          ) : video.file ? (
            <Button tone="acc" block onClick={async () => { await FF.shareFile(video.file!, ev.title); setVideo(null); }}>{t.videoReady}</Button>
          ) : null
        ) : null}
        {brought ? <p className="kd-s">{fill(pick({ b: { en: 'Your links brought {n} people here', vi: 'Link của bạn đã mang về {n} người' } }, lang).b, { n: brought })}</p> : null}
        <CollectRow lang={lang} />
      </div>
    </Sheet>
  );
}

// ---- collections ---------------------------------------------------------------------

interface Col { id: string; name: string; count: number; has?: boolean }

/** Inside the share sheet: which of my collections hold this event, and a new one. */
function CollectRow({ lang }: { lang: Lang }) {
  const { ev } = useEvent();
  const kd = useKd();
  const t = T(lang);
  const [items, setItems] = useState<Col[] | null>(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const load = () => FF.maybe(FF.get('/me/collections?event=' + ev.id), null).then((r: any) => r && setItems(r.items));
  useEffect(() => { if (kd.user) load();   }, [kd.user]);
  if (!kd.user) {
    return (
      <button type="button" className="kd-btn kd-btn-block" onClick={() => kd.requireSignIn({ kind: 'save', id: ev.id }, t.gateCollect)}>
        <PlusIcon size={16} aria-hidden="true" />{t.collect}
      </button>
    );
  }
  const toggle = async (c: Col) => {
    if (busy) return;
    const on = !c.has;
    setBusy(true);
    setItems((xs) => xs && xs.map((x) => (x.id === c.id ? { ...x, has: on, count: x.count + (on ? 1 : -1) } : x)));
    try {
      await (on ? FF.put : FF.del)('/me/collections/' + c.id + '/events/' + ev.id);
      kd.toast(fill(on ? t.colAdded : t.colRemoved, { n: c.name }));
    } catch (e) {
      kd.toast(FF.errorText(e, lang));
      load();
    }
    setBusy(false);
  };
  const create = async (e: FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n || busy) return;
    setBusy(true);
    try {
      const c = await FF.post('/me/collections', { name: n, eventId: ev.id });
      setName('');
      kd.toast(fill(t.colAdded, { n: c.name }));
      await load();
    } catch (x) { kd.toast(FF.errorText(x, lang)); }
    setBusy(false);
  };
  return (
    <div className="flex flex-col gap-2 border-t border-line-1 pt-4">
      <span className="kd-m">{t.collect}</span>
      {items?.map((c) => (
        <button key={c.id} type="button" role="checkbox" aria-checked={!!c.has} className="kd-lrow w-full border-x-0 border-t-0 bg-transparent text-left" onClick={() => toggle(c)}>
          <span className={cx('flex h-5 w-5 items-center justify-center rounded-tag shadow-[inset_0_0_0_1px_var(--color-line-2)]', c.has && 'bg-info text-on-accent shadow-none')}>
            {c.has ? <CheckIcon size={14} weight="bold" aria-hidden="true" /> : null}
          </span>
          <span className="kd-hs min-w-0 flex-1 kd-ell">{c.name}</span>
          <span className="kd-m kd-num">{c.count}</span>
        </button>
      ))}
      <form onSubmit={create} className="flex gap-2">
        <Input boxClass="flex-1" placeholder={t.colNewPh} aria-label={t.colNewPh} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
        <Button type="submit" disabled={!name.trim() || busy}>{t.colCreate}</Button>
      </form>
    </div>
  );
}

// ---- venue ------------------------------------------------------------------------------

