'use client';
/**
 * "Nghe" on an artist's page: their sets and tracks on SoundCloud, Mixcloud and Spotify. Each
 * starts as a plain row (artwork, title, the service): nothing from the service loads until
 * someone presses play, and only one player is on the page at a time. Likes and comments are
 * FeestFinder's own (festfinder-backend routes/mixes.ts); comments open in a sheet, and
 * /a/<slug>?mix=<id> (a notification's link) opens that mix's.
 */
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowBendUpLeftIcon, ArrowUpRightIcon, ChatCircleIcon, FlagIcon, HeartIcon, PlayIcon, TrashIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang } from '../../copy';
import { cx } from '../../cx';
import { count } from '../../format';
import { PhoneSheet } from '../../phone';
import { useKd } from '../../runtime';
import { Button, IconButton } from '../../ui/actions';
import { FieldError, Input, TextArea } from '../../ui/forms';
import { Art, Avatar } from '../../ui/parts';
import { Sheet } from '../../ui/sheet';
import { MIXES } from './copy';

export interface Mix {
  id: string; provider: 'soundcloud' | 'mixcloud' | 'spotify'; providerLabel: string; kind: string; url: string;
  embedSrc: string; playSrc: string; height: number; title: string; authorName: string | null; thumbnailUrl: string | null;
  durationS: number | null; event: { slug: string; title: string } | null; pinned: boolean; likeCount: number; commentCount: number;
}

interface Comment {
  id: string; parentId: string | null; body: string | null; atS: number | null; removed: boolean; hidden: boolean;
  author: { name: string | null; initials: string; photoUrl: string | null } | null; createdAt: string;
  me: { mine: boolean } | null; canModerate: boolean; replies?: Comment[];
}

/** 2730 → "45:30", 3725 → "1:02:05". */
export const clock = (s: number) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
  return (h ? `${h}:${String(m).padStart(2, '0')}` : String(m)) + ':' + String(x).padStart(2, '0');
};

export function ArtistMixes({ lang, slug, items, className }: { lang: Lang; slug: string; items: Mix[]; className?: string }) {
  const T = pick(MIXES, lang);
  const kd = useKd();
  const [playing, setPlaying] = useState<string | null>(null);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, number>>({});
  const [open, setOpen] = useState<Mix | null>(null);
  const root = useRef<HTMLElement>(null);

  // Which of these this person liked: asked in the browser, so the page itself stays cached.
  useEffect(() => {
    if (!kd.user || !items.length) { setLiked(new Set()); return; }
    FF.maybe(FF.get(`/artists/${encodeURIComponent(slug)}/mixes/me`), { liked: [] }).then((r: { liked: string[] }) => setLiked(new Set(r.liked)));
  }, [kd.user, slug, items.length]);
  // A notification's link: /a/<slug>?mix=<id> opens that mix's comments.
  useEffect(() => {
    const id = new URLSearchParams(location.search).get('mix');
    const m = id ? items.find((x) => x.id === id) : null;
    if (m) { setOpen(m); root.current?.scrollIntoView({ block: 'start' }); }
  }, [items]);

  if (!items.length) return null;

  const play = (m: Mix) => {
    setPlaying(m.id);
    FF.track('mix_play', { kind: m.provider, surface: 'artist' });
  };
  const toggleLike = async (m: Mix) => {
    if (!kd.requireSignIn(undefined, T.signInToLike)) return;
    const on = !liked.has(m.id);
    try {
      const out = await (on ? FF.put(`/mixes/${m.id}/like`) : FF.del(`/mixes/${m.id}/like`));
      setLiked((s) => { const n = new Set(s); if (on) n.add(m.id); else n.delete(m.id); return n; });
      setLikes((x) => ({ ...x, [m.id]: out.likeCount }));
    } catch (e) { kd.toast(FF.errorText(e, lang)); }
  };

  return (
    <section ref={root} className={cx('flex scroll-mt-32 flex-col gap-3.5', className)} aria-labelledby="mixes-h">
      <h2 id="mixes-h" className="kd-d3">{T.title}</h2>
      <ul className="flex flex-col">
        {items.map((m) => {
          const on = liked.has(m.id);
          return (
            <li key={m.id} className="flex flex-col gap-3 border-b border-line py-4 first:pt-0" data-mix={m.id}>
              {playing === m.id ? (
                <iframe
                  title={`${m.providerLabel}: ${m.title}`}
                  src={m.playSrc}
                  height={m.height}
                  loading="lazy"
                  allow="autoplay; encrypted-media; clipboard-write; fullscreen; picture-in-picture"
                  className="w-full rounded-card border-0 bg-carbon"
                />
              ) : (
                <button type="button" className="group flex min-w-0 items-center gap-3.5 text-left" onClick={() => play(m)} aria-label={fill(T.play, { t: m.title })}>
                  <span className="relative size-16 shrink-0 overflow-hidden rounded-tag">
                    <Art family="edm" cover={m.thumbnailUrl} className="absolute inset-0 rounded-none" />
                    <span className="absolute inset-0 grid place-items-center bg-void/30 text-paper transition-colors group-hover:bg-void/10" aria-hidden="true"><PlayIcon size={22} weight="fill" /></span>
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="kd-h kd-ell">{m.title}</span>
                    <span className="kd-s kd-ell">{[m.providerLabel, m.event ? fill(T.recordedAt, { e: m.event.title }) : null, m.durationS ? clock(m.durationS) : null].filter(Boolean).join(' · ')}</span>
                  </span>
                </button>
              )}
              <div className="flex items-center gap-1">
                <Button size="sm" tone="ghost" aria-pressed={on} onClick={() => toggleLike(m)} className={on ? 'text-acc' : undefined}>
                  <HeartIcon size={16} weight={on ? 'fill' : 'regular'} aria-hidden="true" />
                  <span className="kd-num">{count(likes[m.id] ?? m.likeCount, lang)}</span>
                  <span className="sr-only">{on ? T.liked : T.like}</span>
                </Button>
                <Button size="sm" tone="ghost" onClick={() => setOpen(m)}>
                  <ChatCircleIcon size={16} aria-hidden="true" />
                  <span className="kd-num">{count(comments[m.id] ?? m.commentCount, lang)}</span>
                  <span className="sr-only">{T.comments}</span>
                </Button>
                <a className="kd-nl ml-auto inline-flex items-center gap-1" href={m.url} target="_blank" rel="noopener">
                  {fill(T.openOn, { p: m.providerLabel })}<ArrowUpRightIcon size={14} aria-hidden="true" />
                </a>
              </div>
            </li>
          );
        })}
      </ul>
      {open ? <CommentsSheet lang={lang} mix={open} onClose={() => setOpen(null)} onTotal={(n) => setComments((x) => ({ ...x, [open.id]: n }))} /> : null}
    </section>
  );
}

function CommentsSheet({ lang, mix, onClose, onTotal }: { lang: Lang; mix: Mix; onClose: () => void; onTotal: (n: number) => void }) {
  const T = pick(MIXES, lang);
  const kd = useKd();
  const [items, setItems] = useState<Comment[] | null>(null);
  const [next, setNext] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const [at, setAt] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [reporting, setReporting] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [phoneFor, setPhoneFor] = useState<(() => void) | null>(null);

  const load = useCallback(async (cursor?: string) => {
    const out = await FF.maybe(FF.get(`/mixes/${mix.id}/comments${cursor ? '?cursor=' + encodeURIComponent(cursor) : ''}`), null);
    if (!out) return;
    setItems((xs) => (cursor && xs ? [...xs, ...out.items] : out.items));
    setNext(out.nextCursor);
    onTotal(out.total);
  }, [mix.id, onTotal]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [mix.id, kd.user]);

  /** A write: sign in first, or prove a phone when the API asks, then try again. */
  const write = async <R,>(run: () => Promise<R>): Promise<R | null> => {
    if (!kd.requireSignIn(undefined, T.signInToComment)) return null;
    try { return await run(); } catch (e) {
      if ((e as { code?: string }).code === 'phone_unverified') setPhoneFor(() => () => { void write(run); });
      else setErr(FF.errorText(e, lang));
      return null;
    }
  };
  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!body.trim() || busy) return;
    setBusy(true); setErr('');
    const out = await write(() => FF.post(`/mixes/${mix.id}/comments`, { body: body.trim(), ...(replyTo ? { parentId: replyTo.id } : {}), ...(at.trim() ? { at: at.trim() } : {}) }));
    setBusy(false);
    if (out) { setBody(''); setAt(''); setReplyTo(null); await load(); }
  };
  const remove = async (c: Comment) => { if (await write(() => FF.del(`/mix-comments/${c.id}`))) await load(); };
  const report = async (c: Comment, reason: string) => {
    setReporting(null);
    const out = await write<{ message?: unknown }>(() => FF.post(`/mix-comments/${c.id}/reports`, { reason }));
    if (out) kd.toast(FF.text(out.message, lang));
  };
  const reasons = [{ key: 'spam', label: T.rSpam }, { key: 'abuse', label: T.rAbuse }, { key: 'personal', label: T.rPersonal }, { key: 'other', label: T.rOther }];

  const row = (c: Comment, reply = false) => (
    <li key={c.id} className={cx('flex gap-3 py-3', reply ? 'pl-11' : 'border-t border-line')}>
      {c.author ? <Avatar name={c.author.name ?? T.member} src={c.author.photoUrl} size={32} /> : <span className="size-8 shrink-0" />}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {c.removed ? <p className="kd-s italic">{T.removed}</p> : (
          <>
            <span className="kd-hs flex flex-wrap items-center gap-2">
              {c.author?.name ?? T.member}
              {c.atS != null ? <span className="kd-tag kd-num">{T.at} {clock(c.atS)}</span> : null}
              {c.hidden ? <span className="kd-s text-warn">{T.hidden}</span> : null}
            </span>
            <p className="kd-t whitespace-pre-line text-paper">{c.body}</p>
            <span className="flex flex-wrap items-center gap-1">
              {!reply ? <Button size="sm" tone="ghost" className="-ml-3" onClick={() => setReplyTo(c)}><ArrowBendUpLeftIcon size={14} aria-hidden="true" />{T.reply}</Button> : null}
              {c.me?.mine || c.canModerate ? <IconButton size="sm" label={T.remove} onClick={() => remove(c)}><TrashIcon size={14} aria-hidden="true" /></IconButton> : null}
              {kd.user && !c.me?.mine ? <IconButton size="sm" label={T.report} onClick={() => setReporting(reporting === c.id ? null : c.id)}><FlagIcon size={14} aria-hidden="true" /></IconButton> : null}
            </span>
            {reporting === c.id ? (
              <span className="flex flex-wrap gap-1.5">{reasons.map((r) => <Button key={r.key} size="sm" onClick={() => report(c, r.key)}>{r.label}</Button>)}</span>
            ) : null}
          </>
        )}
      </div>
    </li>
  );

  return (
    <Sheet onClose={onClose} title={fill(T.commentsOn, { t: mix.title })} closeLabel={T.close} wide>
      <div className="flex flex-col gap-3 pt-1">
        {items === null ? <div className="kd-skel h-24" aria-hidden="true" /> : items.length ? (
          <ul className="flex flex-col">
            {items.map((c) => [row(c), ...(c.replies ?? []).map((r) => row(r, true))])}
          </ul>
        ) : <p className="kd-t text-fog">{T.none}</p>}
        {next ? <Button size="sm" tone="ghost" className="self-start" onClick={() => load(next)}>{T.more}</Button> : null}
        {kd.user ? (
          <form className="flex flex-col gap-2 border-t border-line pt-3" onSubmit={send}>
            {replyTo ? (
              <span className="kd-s flex items-center gap-2">{fill(T.replyingTo, { n: replyTo.author?.name ?? T.member })}<Button size="sm" tone="ghost" onClick={() => setReplyTo(null)}>{T.cancel}</Button></span>
            ) : null}
            <TextArea aria-label={T.write} placeholder={T.write} rows={2} maxLength={1000} value={body} onChange={(e) => setBody(e.target.value)} />
            <div className="flex items-center gap-2">
              {!replyTo ? <Input aria-label={T.at} placeholder={`${T.at} ${T.atHint}`} inputMode="numeric" maxLength={8} boxClass="w-32" className="kd-num" value={at} onChange={(e) => setAt(e.target.value.replace(/[^\d:]/g, ''))} /> : null}
              <Button type="submit" tone="acc" className="ml-auto" disabled={busy || !body.trim()}>{T.send}</Button>
            </div>
            <FieldError>{err}</FieldError>
          </form>
        ) : (
          <Button className="self-start" onClick={() => kd.openSignIn(T.signInToComment)}>{T.signInToComment}</Button>
        )}
      </div>
      {phoneFor ? <PhoneSheet lang={lang} onClose={() => setPhoneFor(null)} onDone={() => { const f = phoneFor; setPhoneFor(null); f(); }} /> : null}
    </Sheet>
  );
}
