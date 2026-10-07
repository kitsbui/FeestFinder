'use client';
/**
 * Sharing one of my collections once its link is public: the same channels as an event's share
 * sheet (link, Zalo, Messenger, Facebook, a story image, a short clip, Threads, X, Telegram, the
 * phone's own sheet). A collection's link is its page itself: no share tracking.
 */
import { useState, type ReactNode } from 'react';
import {
  ChatCircleIcon, DotsThreeIcon, FacebookLogoIcon, FilmStripIcon, ImageIcon, LinkIcon, MessengerLogoIcon,
  PaperPlaneTiltIcon, ThreadsLogoIcon, XLogoIcon,
} from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang } from '../../copy';
import { whenShort } from '../../format';
import { useKd } from '../../runtime';
import { Button } from '../../ui/actions';
import { Sheet } from '../../ui/sheet';
import type { Card } from '../../types';
import { WEB } from '../copy';
import { SAVED } from './copy';

type Channel = 'copy' | 'native' | 'zalo' | 'messenger' | 'facebook' | 'threads' | 'x' | 'telegram' | 'instagram' | 'tiktok';

export function ShareSheet({ lang, name, url, events, onClose }: {
  lang: Lang; name: string; url: string; events: Card[]; onClose: () => void;
}) {
  const kd = useKd();
  const t = pick(WEB, lang);
  const T = pick(SAVED, lang);
  const [video, setVideo] = useState<{ making: boolean; file?: File } | null>(null);
  const file = 'feestfinder-' + (url.split('/c/')[1] || 'collection');
  const kicker = T.kicker + ' · ' + fill(T.nEvents, { n: events.length });
  // The story picture: the first event's genre, "Bộ sưu tập · n sự kiện", the name, three events.
  const story = {
    genre: events[0]?.genre ?? undefined,
    kicker,
    title: name,
    lines: events.slice(0, 3).map((e) => e.title + ' · ' + whenShort(e, lang)),
    url: url.replace(/^https?:\/\//, ''),
  };
  const text = name + ' · ' + fill(T.nEvents, { n: events.length });

  const go = async (channel: Channel) => {
    FF.track('share', { kind: channel, source: 'collection' });
    if (channel === 'instagram') {
      const how = await FF.shareStory(story, file).catch((e: unknown) => { kd.toast(FF.errorText(e, lang)); return null; });
      if (how === 'saved') kd.toast(t.storySaved);
      return;
    }
    if (channel === 'tiktok') {
      if (video?.making) return;
      setVideo({ making: true });
      let blob: Blob | null = null;
      try { blob = await FF.storyVideo(story); } catch { blob = null; }
      if (!blob) {
        setVideo(null);
        kd.toast(t.videoNone);
        const how = await FF.shareStory(story, file).catch(() => null);
        if (how === 'saved') kd.toast(t.storySaved);
        return;
      }
      const clip = new File([blob], file + (blob.type === 'video/mp4' ? '.mp4' : '.webm'), { type: blob.type });
      if (FF.canShareFile(clip)) { setVideo({ making: false, file: clip }); return; }
      setVideo(null);
      await FF.shareFile(clip, name);
      kd.toast(t.videoSaved);
      return;
    }
    const u = encodeURIComponent(url), tx = encodeURIComponent(text);
    const out = (href: string) => window.open(href, '_blank', 'noopener');
    const copy = (msg: string) => {
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => kd.toast(msg), () => kd.toast(url));
      else kd.toast(url);
    };
    if (channel === 'facebook') return out('https://www.facebook.com/sharer/sharer.php?u=' + u);
    if (channel === 'threads') return out('https://www.threads.net/intent/post?text=' + encodeURIComponent(text + ' ' + url));
    if (channel === 'x') return out('https://x.com/intent/post?text=' + tx + '&url=' + u);
    if (channel === 'telegram') return out('https://t.me/share/url?url=' + u + '&text=' + tx);
    // Messenger and Zalo open their apps from a phone; on a computer the link is copied to paste in.
    if (channel === 'messenger' && FF.isPhone()) { location.href = 'fb-messenger://share/?link=' + u; return; }
    if ((channel === 'native' || channel === 'zalo') && navigator.share) { navigator.share({ title: name, text, url }).catch(() => {}); return; }
    copy(channel === 'zalo' ? t.shareCopiedZalo : channel === 'messenger' ? t.shareCopiedMessenger : t.shareCopied);
  };

  const tile = (channel: Channel, label: string, icon: ReactNode) => (
    <button key={channel} type="button" className="kd-btn kd-btn-ghost h-auto flex-col gap-2 py-3" onClick={() => go(channel)}>
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 shadow-[inset_0_0_0_1px_var(--color-line)]">{icon}</span>
      <span className="kd-s text-mist">{label}</span>
    </button>
  );
  return (
    <Sheet title={t.share} closeLabel={t.close} onClose={onClose}>
      <div className="flex flex-col gap-4 pt-2">
        <span className="kd-m kd-ell normal-case">{url.replace(/^https?:\/\//, '')}</span>
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
          {'share' in navigator ? tile('native', t.shareMore, <DotsThreeIcon size={20} aria-hidden="true" />) : null}
        </div>
        {video?.making ? <p className="kd-s" role="status">{t.videoMaking}</p> : null}
        {video?.file ? (
          <Button tone="light" block onClick={async () => { const how = await FF.shareFile(video.file!, name); if (how === 'saved') kd.toast(t.videoSaved); setVideo(null); }}>
            {t.videoReady}
          </Button>
        ) : null}
      </div>
    </Sheet>
  );
}
