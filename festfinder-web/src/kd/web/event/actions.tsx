'use client';
/**
 * The event page's small interactive parts: save, follow, share (with story image and
 * video), collections, copy address, report, claim, and the sticky section bar.
 */
import { useEffect, useState, type FormEvent } from 'react';
import {
  CheckIcon, CopyIcon, FacebookLogoIcon, FilmStripIcon, HeartIcon, ImageIcon, LinkIcon, MessengerLogoIcon,
  PaperPlaneTiltIcon, PlusIcon, ShareNetworkIcon, XLogoIcon, ThreadsLogoIcon, ChatCircleIcon, DotsThreeIcon,
} from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang } from '../../copy';
import { cx } from '../../cx';
import { useKd, useSaved } from '../../runtime';
import { Button, IconButton, buttonClass } from '../../ui/actions';
import { FieldError, FieldLabel, Input, TextArea } from '../../ui/forms';
import { Sheet } from '../../ui/sheet';
import { count, moneyShort, whenShort } from '../../format';
import { WEB } from '../copy';
import { useEvent } from './context';

const T = (lang: Lang) => pick(WEB, lang);

/** The heart, and the "n quan tâm" count beside it, which moves with it. */
export function SaveWithCount({ lang, size = 'md' }: { lang: Lang; size?: 'sm' | 'md' }) {
  const { ev, personal } = useEvent();
  const kd = useKd();
  const [on, toggle] = useSaved(ev.id);
  // The count the API gave already holds the viewer's own save, if they had one then.
  const was = personal?.viewer ? personal.viewer.saved : kd.user ? null : false;
  const delta = was === null ? 0 : (on ? 1 : 0) - (was ? 1 : 0);
  const t = T(lang);
  return (
    <>
      <IconButton label={on ? t.savedThis : t.saveThis} line pressed={on} onClick={toggle} size={size}>
        <HeartIcon size={20} weight={on ? 'fill' : 'regular'} aria-hidden="true" />
      </IconButton>
      <span className="kd-m kd-num ml-1.5">{fill(t.interested, { n: count(Math.max(0, ev.saveCount + delta), lang) })}</span>
    </>
  );
}

export function FollowOrg({ lang }: { lang: Lang }) {
  const { ev, personal } = useEvent();
  const kd = useKd();
  const org = ev.organizer;
  const initial = !!personal?.me?.followingOrganizer;
  const key = 'org:' + (org?.id ?? '');
  const on = kd.follows.has(key) ? !!kd.follows.get(key) : initial;
  if (!org) return null;
  const C = pick({ follow: { vi: 'Theo dõi', en: 'Follow' }, following: { vi: 'Đang theo dõi', en: 'Following' } }, lang);
  return (
    <button
      type="button"
      aria-pressed={on}
      className={buttonClass({ size: 'sm', pill: true, tone: on ? 'default' : 'light' })}
      onClick={() => kd.setFollow('org', org.id, !on)}
    >
      {on ? C.following : C.follow}
    </button>
  );
}

// ---- share ----------------------------------------------------------------------------

export function ShareButton({ lang }: { lang: Lang }) {
  const [open, setOpen] = useState(false);
  const t = T(lang);
  return (
    <>
      <IconButton label={t.share} line onClick={() => setOpen(true)}>
        <ShareNetworkIcon size={20} aria-hidden="true" />
      </IconButton>
      {open ? <ShareSheet lang={lang} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

type Channel = 'copy' | 'native' | 'zalo' | 'messenger' | 'facebook' | 'threads' | 'x' | 'telegram' | 'instagram' | 'tiktok';

function ShareSheet({ lang, onClose }: { lang: Lang; onClose: () => void }) {
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
    lines: [when, [ev.venue.name, ev.venue.area].filter(Boolean).join(' · '), ev.isFree ? t.free : fill(t.fromPrice, { p: moneyShort(ev.priceFrom, ev.currency, lang) })],
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
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 shadow-[inset_0_0_0_1px_var(--color-line)]">{icon}</span>
      <span className="kd-s text-mist">{label}</span>
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
            <Button tone="light" block onClick={async () => { await FF.shareFile(video.file!, ev.title); setVideo(null); }}>{t.videoReady}</Button>
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
  useEffect(() => { if (kd.user) load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [kd.user]);
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
    <div className="flex flex-col gap-2 border-t border-line pt-4">
      <span className="kd-m">{t.collect}</span>
      {items?.map((c) => (
        <button key={c.id} type="button" role="checkbox" aria-checked={!!c.has} className="kd-lrow w-full border-x-0 border-t-0 bg-transparent text-left" onClick={() => toggle(c)}>
          <span className={cx('flex h-5 w-5 items-center justify-center rounded-tag shadow-[inset_0_0_0_1px_var(--color-line2)]', c.has && 'bg-acc text-acc-ink shadow-none')}>
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

export function CopyAddress({ lang, text }: { lang: Lang; text: string }) {
  const [done, setDone] = useState(false);
  const t = T(lang);
  return (
    <button
      type="button"
      className={buttonClass({ tone: 'ghost' })}
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 2400); }, () => {});
      }}
    >
      {done ? <CheckIcon size={16} aria-hidden="true" /> : <CopyIcon size={16} aria-hidden="true" />}
      <span aria-live="polite">{done ? t.copied : t.copyAddress}</span>
    </button>
  );
}

// ---- report and claim --------------------------------------------------------------------

const REPORT_CODES: Record<string, { en: string; vi: string }> = {
  wrong: { en: 'Details are wrong', vi: 'Thông tin sai' },
  cancelled: { en: 'Event was cancelled', vi: 'Sự kiện đã huỷ' },
  scam: { en: 'Looks like a scam', vi: 'Có dấu hiệu lừa đảo' },
  duplicate: { en: 'Posted twice', vi: 'Đăng trùng hai lần' },
  offensive: { en: 'Offensive content', vi: 'Nội dung không phù hợp' },
  price: { en: 'Price is not what was listed', vi: 'Giá khác với tin đăng' },
  refund: { en: 'Refund claim', vi: 'Đòi hoàn tiền' },
  safety: { en: 'Safety concern', vi: 'An toàn' },
};

export function ReportLink({ lang }: { lang: Lang }) {
  const { ev, personal, reload } = useEvent();
  const kd = useKd();
  const t = T(lang);
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const done = !!personal?.me?.reported;
  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!code || busy) return;
    setBusy(true);
    try {
      await FF.post('/events/' + ev.id + '/reports', { code, note: note.trim() });
      setOpen(false);
      kd.toast(t.reportSent);
      reload();
    } catch (x) { kd.toast(FF.errorText(x, lang)); }
    setBusy(false);
  };
  return (
    <>
      <button
        type="button"
        className="kd-nl"
        disabled={done}
        onClick={() => { if (kd.requireSignIn(undefined, t.gateReport)) setOpen(true); }}
      >
        {done ? t.reported : t.report}
      </button>
      {open ? (
        <Sheet title={t.report} closeLabel={t.close} onClose={() => setOpen(false)}>
          <form onSubmit={send} className="flex flex-col gap-3 pt-2">
            <fieldset className="flex flex-col gap-1.5">
              <legend className="kd-flabel mb-2">{t.reportWhat}</legend>
              {Object.entries(REPORT_CODES).map(([k, l]) => (
                <label key={k} className="kd-lrow min-h-11 cursor-pointer">
                  <input type="radio" name="code" value={k} checked={code === k} onChange={() => setCode(k)} className="kd-check" />
                  <span className="kd-t text-paper">{l[lang]}</span>
                </label>
              ))}
            </fieldset>
            <FieldLabel htmlFor="kd-report-note">{t.reportMore}</FieldLabel>
            <TextArea id="kd-report-note" rows={2} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
            <Button type="submit" tone="acc" block disabled={!code || busy}>{t.reportSend}</Button>
          </form>
        </Sheet>
      ) : null}
    </>
  );
}

/** A community-sent event: who sent it, and "I organise this" for its real organiser. */
export function CommunityLine({ lang }: { lang: Lang }) {
  const { ev, personal, reload } = useEvent();
  const kd = useKd();
  const t = T(lang);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [proof, setProof] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const c = ev.community;
  if (!c) return null;
  const claim = personal?.mine?.claim;
  const line = c.submittedBy?.name ? fill(t.communityBy, { n: c.submittedBy.name }) : t.communityBySomeone;
  const start = () => {
    if (!kd.requireSignIn(undefined, t.gateClaim)) return;
    if (!claim?.organiser) { location.assign('/studio'); return; }
    setOpen(true);
  };
  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (note.trim().length < 10) return setErr(t.claimShort);
    setBusy(true);
    try {
      const p = proof.trim();
      const out = await FF.post('/events/' + ev.id + '/claims', { note: note.trim(), ...(p ? { proofUrl: /^https?:\/\//.test(p) ? p : 'https://' + p } : {}) });
      setOpen(false);
      kd.toast(FF.text(out.message, lang));
      reload();
    } catch (x) { setErr(FF.errorText(x, lang)); }
    setBusy(false);
  };
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="kd-s">{line}</span>
      {claim?.pending ? <span className="kd-st kd-warn">{t.claimPending}</span> : c.claimable ? (
        <button type="button" className="kd-more" onClick={start}>{t.claim}</button>
      ) : null}
      {open ? (
        <Sheet title={t.claimTitle} closeLabel={t.close} onClose={() => setOpen(false)}>
          <form onSubmit={send} className="flex flex-col gap-3 pt-2">
            <FieldLabel htmlFor="kd-claim-note">{t.claimNote}</FieldLabel>
            <TextArea id="kd-claim-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} invalid={!!err} />
            <FieldLabel htmlFor="kd-claim-proof">{t.claimProof}</FieldLabel>
            <Input id="kd-claim-proof" inputMode="url" value={proof} onChange={(e) => setProof(e.target.value)} />
            <FieldError>{err}</FieldError>
            <Button type="submit" tone="acc" block disabled={busy}>{t.claimSend}</Button>
          </form>
        </Sheet>
      ) : null}
    </div>
  );
}

// ---- the sticky section bar --------------------------------------------------------------

/** Anchor tabs that follow the scroll, plus a small "Mua vé" on wide screens. */
export function SectionBar({ lang, sections, buy }: { lang: Lang; sections: { id: string; label: string }[]; buy?: { href: string; label: string } | null }) {
  const t = T(lang);
  const [cur, setCur] = useState(sections[0]?.id ?? '');
  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const onScroll = () => {
      let at = els[0]?.id ?? '';
      // Below the nav and this bar: whichever section's top has passed 140px from the top. A
      // section in a sticky column (the ticket panel on wide screens) is always in view: skip it.
      for (const el of els) {
        const col = el.closest('[data-sticky-col]');
        if (col && getComputedStyle(col).position === 'sticky') continue;
        if (el.getBoundingClientRect().top <= 140) at = el.id;
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) at = els[els.length - 1]?.id ?? at;
      setCur(at);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [sections]);
  return (
    <div className="sticky top-16 z-20 mt-8 bg-void/90 backdrop-blur-md tab:mt-13">
      <div className="kd-wrap flex items-center gap-3 border-b border-line">
        <nav aria-label={t.sectionNav} className="kd-tabs min-w-0 flex-1 border-b-0">
          {sections.map((s) => (
            <a key={s.id} href={'#' + s.id} className="kd-tab" aria-current={cur === s.id ? 'true' : undefined} onClick={() => setCur(s.id)}>{s.label}</a>
          ))}
        </nav>
        {buy ? <a href={buy.href} className={buttonClass({ tone: 'acc', size: 'sm' }, 'hidden desk:inline-flex')}>{buy.label}</a> : null}
      </div>
    </div>
  );
}

// ---- the countdown on the cover --------------------------------------------------------

/**
 * "Còn 5 ngày" / "Ngày mai" / "Đang diễn ra", counted in the browser against the API's clock,
 * so a cached page never shows yesterday's count.
 */
export function Countdown({ lang }: { lang: Lang }) {
  const { ev } = useEvent();
  const { clockReady } = useKd();
  const t = T(lang);
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    if (!clockReady) return;
    const tick = () => {
      if (!ev.startsOn) return setText(null);
      const now = FF.now();
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: ev.timezone || 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
      const d = (a: string, b: string) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);
      const days = d(today, ev.startsOn), toEnd = ev.endsOn ? d(today, ev.endsOn) : days;
      const live = ev.startsAt && ev.endsAt && now.getTime() >= Date.parse(ev.startsAt) && now.getTime() < Date.parse(ev.endsAt);
      setText(ev.past ? null : live ? t.onNow : days > 1 ? fill(t.daysLeft, { n: days }) : days === 1 ? t.tomorrow : days <= 0 && toEnd >= 0 ? t.today : null);
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [ev, clockReady, t.onNow, t.daysLeft, t.tomorrow, t.today]);
  if (!text) return null;
  return <span className="kd-tag kd-tag-glass kd-num absolute bottom-3.5 left-3.5 z-[1] h-8 px-3 text-paper">{text}</span>;
}
