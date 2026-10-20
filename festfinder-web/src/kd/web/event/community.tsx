'use client';
/**
 * The event's community: hype and its goals, the comments (one stream, like a feed), the
 * photo wall and the ambassadors who brought people in.
 */
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  ArrowBendUpLeftIcon, CameraIcon, CheckCircleIcon, FireIcon, FlagIcon, LockSimpleIcon, PencilSimpleIcon, PushPinIcon, ThumbsUpIcon, TrashIcon, EyeSlashIcon, XIcon,
} from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang, tx } from '../../copy';
import { cx } from '../../cx';
import { count } from '../../format';
import { PhoneSheet } from '../../phone';
import { useKd } from '../../runtime';
import { Button } from '../../ui/actions';
import { TextArea } from '../../ui/forms';
import { Accordion, Avatar, BarTrack, Tag } from '../../ui/parts';
import type { Discussion, Post } from '../../types';
import { WEB } from '../copy';
import { useEvent } from './context';

export function ago(iso: string, lang: Lang, now = FF.now().getTime()): string {
  const T = pick(WEB, lang);
  const m = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (m < 1) return T.justNow;
  if (m < 60) return fill(T.agoMin, { n: m });
  const h = Math.round(m / 60);
  if (h < 24) return fill(T.agoHour, { n: h });
  return fill(T.agoDay, { n: Math.round(h / 24) });
}

// ---- hype --------------------------------------------------------------------------

/** `bare`: inside the page's "Thêm" (more.tsx), whose row names it. */
export function Hype({ lang, bare }: { lang: Lang; bare?: boolean }) {
  const { ev, personal, reload } = useEvent();
  const kd = useKd();
  const T = pick(WEB, lang);
  const H = (personal ?? ev).hype;
  const [on, setOn] = useState<boolean | null>(null);
  if (!H) return null;
  const hyped = on ?? !!personal?.viewer?.hyped;
  const toggle = async () => {
    if (!kd.requireSignIn(undefined, T.hypeIt)) return;
    setOn(!hyped);
    try {
      await (hyped ? FF.del : FF.put)('/me/hypes/' + ev.id);
      if (!hyped) kd.toast(T.hyped);
      await reload();
      setOn(null);
    } catch (e) { setOn(hyped); kd.toast(FF.errorText(e, lang)); }
  };
  return (
    <section aria-labelledby={bare ? undefined : 'hype-h'} aria-label={bare ? T.hype : undefined} className={cx('flex max-w-read flex-col gap-3', !bare && 'kd-card p-4')}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {bare ? null : <h2 id="hype-h" className="kd-d3">{T.hype}</h2>}
        {H.count ? <span className="kd-mb kd-num whitespace-nowrap">{fill(T.hypeCount, { n: count(H.count, lang) })}</span> : null}
        {H.last24h ? <span className="kd-s whitespace-nowrap">{fill(T.hype24, { n: H.last24h })}</span> : null}
        <Button size="sm" className="ml-auto" aria-pressed={hyped} onClick={toggle}>
          <FireIcon size={16} weight={hyped ? 'fill' : 'regular'} className={hyped ? 'text-info' : undefined} aria-hidden="true" />
          {hyped ? T.hyped : T.hypeIt}
        </Button>
      </div>
      {H.next ? (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="kd-s text-fg-2">{tx(H.next.reward, lang)}</span>
            <span className="kd-m kd-num">{fill(T.hypeLeft, { n: count(H.next.left, lang) })}</span>
          </div>
          <BarTrack value={Math.round(H.next.progress * 100)} max={100} label={tx(H.next.reward, lang)} />
        </div>
      ) : null}
      {H.goals.length ? (
        <ul className="flex flex-col">
          {H.goals.map((x) => (
            <li key={x.threshold} className="flex items-center gap-2.5 border-t border-line-1 py-2 kd-s">
              {x.reached ? <CheckCircleIcon size={16} weight="fill" className="text-ok" aria-hidden="true" /> : <LockSimpleIcon size={16} className="text-fg-3" aria-hidden="true" />}
              <span className="kd-mb kd-num w-16">{count(x.threshold, lang)}</span>
              <span className={x.reached ? 'text-fg-2' : undefined}>{tx(x.reward, lang)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

// ---- comments -------------------------------------------------------------------------

/**
 * Comments like a feed (owner, 2026-10-20): one stream, newest first; anyone signed in writes; a
 * reply to any comment sits flat under the first post of its thread and starts with "@name";
 * like, edit for 15 minutes, delete your own; the organiser and the team hide, pin or delete any.
 * `bare`: inside the page's "Thêm" (more.tsx), whose row names it.
 */
export function DiscussionSection({ lang, bare }: { lang: Lang; bare?: boolean }) {
  const { ev, reload: reloadEvent } = useEvent();
  const kd = useKd();
  const T = pick(WEB, lang);
  const [d, setD] = useState<Discussion | null>(null);
  const [more, setMore] = useState<Record<string, Post[]>>({});
  /** The comment being answered: its thread, and the post (the first one or a reply). */
  const [replyTo, setReplyTo] = useState<{ thread: string; post: Post } | null>(null);
  const [phoneFor, setPhoneFor] = useState<(() => void) | null>(null);
  const [rules, setRules] = useState(false);
  const [writing, setWriting] = useState(false);

  const load = useCallback(async () => {
    const out = await FF.maybe(FF.get('/events/' + ev.id + '/discussion'), null);
    if (out) { setD(out); setMore({}); }
  }, [ev.id]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, [ev.id, kd.user]);

  /** A write: sign in first, or prove a phone when the API asks (REQUIRE_PHONE_TO_POST), then retry. */
  const write = async <R,>(run: () => Promise<R>): Promise<R | null> => {
    if (!kd.requireSignIn(undefined, T.discSignin)) return null;
    try {
      return await run();
    } catch (e) {
      if ((e as { code?: string }).code === 'phone_unverified') setPhoneFor(() => () => { void write(run); });
      else kd.toast(FF.errorText(e, lang));
      return null;
    }
  };

  const gate = d?.me.canWrite ?? 'signin';
  const posted = () => { setReplyTo(null); void load(); void reloadEvent(); };
  // Nothing written yet: one sentence and one action (design kit), not an empty field.
  if (d && !d.total && !ev.faq.length && !writing) {
    return (
      <section id="discussion" aria-labelledby={bare ? undefined : 'disc-h'} aria-label={bare ? T.discussion : undefined} className="flex max-w-read scroll-mt-32 flex-wrap items-center justify-between gap-3">
        {bare ? <p className="kd-s">{T.discEmpty}</p> : <h2 id="disc-h" className="kd-d3">{T.discussion}</h2>}
        <Button onClick={() => setWriting(true)}>{T.discAsk}</Button>
      </section>
    );
  }

  return (
    <section id="discussion" aria-labelledby={bare ? undefined : 'disc-h'} aria-label={bare ? T.discussion : undefined} className="flex max-w-read scroll-mt-32 flex-col gap-4">
      {bare ? null : <h2 id="disc-h" className="kd-d3">{T.discussion}{d?.total ? <span className="kd-m kd-num ml-3 align-middle">{d.total}</span> : null}</h2>}
      {/* The organiser's answers lead: they are the page's FAQ for search engines too. */}
      {ev.faq.length ? (
        <div className="flex flex-col">
          <h3 className="kd-hs pb-1.5">{T.orgAnswers}</h3>
          <div className="border-t border-line-1">
            {ev.faq.map((f) => (
              <Accordion key={f.question} small name="faq" summary={f.question}>
                <p className="kd-t text-fg-3">{f.answer}</p>
              </Accordion>
            ))}
          </div>
        </div>
      ) : null}
      {gate === 'verify_phone' && kd.user ? (
        <Button className="self-start" onClick={() => setPhoneFor(() => () => load())}>{T.discVerify}</Button>
      ) : (
        <Composer lang={lang} onPosted={posted} write={write} autoFocus={writing} />
      )}
      {/* The rules behind a link beside the field, not a line telling everyone off (design v2 phase 2). */}
      {d?.rules ? (
        <div className="flex flex-col gap-1.5">
          <button type="button" className="kd-more self-start" aria-expanded={rules} onClick={() => setRules((r) => !r)}>{T.discRules}</button>
          {rules ? <p className="kd-s">{tx(d.rules, lang)}</p> : null}
        </div>
      ) : null}
      {d ? (
        d.items.length ? (
          <ul className="flex flex-col">
            {d.items.map((p) => (
              <Thread
                key={p.id}
                lang={lang}
                post={p}
                replies={more[p.id] ?? p.replies ?? []}
                hasMore={!more[p.id] && p.replyCount > (p.replies ?? []).length}
                onMore={async () => {
                  const r = await FF.maybe(FF.get('/posts/' + p.id + '/replies'), null);
                  if (r) setMore((m) => ({ ...m, [p.id]: r.items }));
                }}
                team={!!d.me.isTeam}
                replying={replyTo?.thread === p.id ? replyTo.post : null}
                onReply={(target) => { if (kd.requireSignIn(undefined, T.discSignin)) setReplyTo(replyTo?.post.id === target.id ? null : { thread: p.id, post: target }); }}
                onPosted={posted}
                write={write}
                reload={() => load()}
              />
            ))}
          </ul>
        ) : null
      ) : <div className="kd-skel h-24" aria-hidden="true" />}
      {phoneFor ? <PhoneSheet lang={lang} onClose={() => setPhoneFor(null)} onDone={() => { const f = phoneFor; setPhoneFor(null); f(); }} /> : null}
    </section>
  );
}

/** A new comment, or (`to`) a reply to one: replying to a reply names its author first. */
function Composer({ lang, onPosted, write, to, autoFocus }: {
  lang: Lang; onPosted: () => void; write: <R>(run: () => Promise<R>) => Promise<R | null>; to?: Post; autoFocus?: boolean;
}) {
  const { ev } = useEvent();
  const kd = useKd();
  const T = pick(WEB, lang);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const send = async (e: FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text || busy) return;
    setBusy(true);
    const out = await write(async () => {
      const payload: Record<string, unknown> = to ? { parentId: to.id, body: text } : { kind: 'talk', body: text };
      if (!to && photo) {
        const form = new FormData();
        form.append('file', photo);
        payload.photoUrl = (await FF.api('POST', '/uploads?purpose=recap', form)).url;
      }
      return FF.post('/events/' + ev.id + '/posts', payload);
    });
    setBusy(false);
    if (out) {
      setBody(''); setPhoto(null);
      kd.toast(FF.text((out as { message?: unknown }).message, lang) || T.discPost);
      onPosted();
    }
  };
  const label = to ? fill(T.discReplyTo, { n: to.author?.name || T.discMember }) : T.discWritePh;
  return (
    <form onSubmit={send} className="flex flex-col gap-2">
      <TextArea
        rows={to ? 2 : 3}
        maxLength={1000}
        placeholder={label}
        aria-label={label}
        value={body}
        autoFocus={autoFocus || !!to}
        onChange={(e) => setBody(e.target.value)}
        onFocus={() => kd.requireSignIn(undefined, T.discSignin)}
      />
      <div className="flex flex-wrap items-center gap-2">
        {!to ? (
          photo ? (
            <span className="kd-tag kd-tag-line">
              {photo.name.slice(0, 24)}
              <button type="button" aria-label={T.close} onClick={() => setPhoto(null)}><XIcon size={12} aria-hidden="true" /></button>
            </span>
          ) : (
            <label className="kd-btn kd-btn-sm kd-btn-ghost cursor-pointer">
              <CameraIcon size={16} aria-hidden="true" />{T.discPhoto}
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => { setPhoto(e.target.files?.[0] ?? null); e.target.value = ''; }} />
            </label>
          )
        ) : null}
        <Button type="submit" size="sm" className="ml-auto" disabled={!body.trim() || busy}>{to ? T.discReply : T.discPost}</Button>
      </div>
    </form>
  );
}

function Thread({ lang, post, replies, hasMore, onMore, team, replying, onReply, onPosted, write, reload }: {
  lang: Lang; post: Post; replies: Post[]; hasMore: boolean; onMore: () => void; team: boolean; replying: Post | null;
  onReply: (target: Post) => void; onPosted: () => void; write: <R>(run: () => Promise<R>) => Promise<R | null>; reload: () => void;
}) {
  const T = pick(WEB, lang);
  return (
    <li className="flex flex-col gap-3 border-t border-line-1 py-4">
      <PostView lang={lang} post={post} team={team} write={write} reload={reload} onReply={post.removed ? undefined : () => onReply(post)} />
      {replies.length || hasMore || replying ? (
        <div className="ml-11 flex flex-col gap-3 border-l border-line-1 pl-4">
          {replies.map((r) => <PostView key={r.id} lang={lang} post={r} team={team} write={write} reload={reload} onReply={r.removed ? undefined : () => onReply(r)} />)}
          {hasMore ? <button type="button" className="kd-more" onClick={onMore}>{fill(T.discMore, { n: post.replyCount - (post.replies ?? []).length })}</button> : null}
          {replying ? <Composer lang={lang} to={replying} onPosted={onPosted} write={write} /> : null}
        </div>
      ) : null}
    </li>
  );
}

function PostView({ lang, post: p, team, write, reload, onReply }: {
  lang: Lang; post: Post; team: boolean; write: <R>(run: () => Promise<R>) => Promise<R | null>; reload: () => void; onReply?: () => void;
}) {
  const kd = useKd();
  const T = pick(WEB, lang);
  const [editing, setEditing] = useState<string | null>(null);
  const act = async (run: () => Promise<{ message?: unknown } | undefined>) => {
    const out = await write(run);
    if (out && out.message) kd.toast(FF.text(out.message, lang));
    reload();
  };
  const mine = !!p.me?.mine;
  const canEdit = mine && !!p.editableUntil && FF.now().getTime() < Date.parse(p.editableUntil);
  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (editing === null || !editing.trim()) return;
    const out = await write(() => FF.patch('/posts/' + p.id, { body: editing.trim() }));
    if (out) { setEditing(null); reload(); }
  };
  return (
    <article className="flex gap-3">
      <Avatar name={p.author?.name || T.discMember} src={p.author?.photoUrl} size={32} />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {/* A hidden post steps back in its name, never by dimming (contrast). */}
          <span className={cx('kd-hs', p.hidden && 'text-fg-3')}>{p.removed ? T.discRemoved : p.author?.name || T.discMember}</span>
          {p.official ? <Tag tone="line">{T.discOfficial}</Tag> : p.author?.badges.length ? <Tag tone={p.author.badges[0].key === 'team' || p.author.badges[0].key === 'ff' ? 'bone' : 'line'}>{tx(p.author.badges[0].label, lang)}</Tag> : null}
          {p.pinned ? <Tag>{T.discPinned}</Tag> : null}
          {p.hidden ? <Tag tone="line">{T.discHidden}</Tag> : null}
          <span className="kd-s">{ago(p.createdAt, lang)}{p.edited ? ` · ${T.discEdited}` : ''}</span>
        </div>
        {editing !== null ? (
          <form onSubmit={save} className="flex flex-col gap-2">
            <TextArea rows={2} maxLength={1000} aria-label={T.discEdit} value={editing} autoFocus onChange={(e) => setEditing(e.target.value)} />
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={!editing.trim()}>{T.discSave}</Button>
              <Button size="sm" tone="ghost" onClick={() => setEditing(null)}>{T.discCancel}</Button>
            </div>
          </form>
        ) : (
          <p className={cx('kd-t whitespace-pre-line', p.removed && 'text-fg-3')}>
            {!p.removed && p.replyTo?.name ? <span className="text-info">@{p.replyTo.name} </span> : null}
            {p.removed ? T.discRemoved : p.body}
          </p>
        )}
        {p.photoUrl ? <img src={p.photoUrl} alt="" loading="lazy" className="max-h-80 w-auto max-w-full rounded-card object-cover" /> : null}
        {!p.removed && editing === null ? (
          <div className="-ml-2 flex flex-wrap items-center gap-1">
            <button
              type="button"
              className="kd-btn kd-btn-sm kd-btn-ghost"
              aria-pressed={!!p.me?.helped}
              disabled={mine}
              onClick={() => act(() => (p.me?.helped ? FF.del : FF.put)('/posts/' + p.id + '/helpful'))}
            >
              <ThumbsUpIcon size={16} weight={p.me?.helped ? 'fill' : 'regular'} className={p.me?.helped ? 'text-info' : undefined} aria-hidden="true" />
              {T.discHelpful}{p.helpfulCount ? <span className="kd-num"> {p.helpfulCount}</span> : null}
            </button>
            {onReply ? <button type="button" className="kd-btn kd-btn-sm kd-btn-ghost" onClick={onReply}><ArrowBendUpLeftIcon size={16} aria-hidden="true" />{T.discReply}</button> : null}
            {canEdit ? <button type="button" className="kd-btn kd-btn-sm kd-btn-ghost" onClick={() => setEditing(p.body)}><PencilSimpleIcon size={16} aria-hidden="true" />{T.discEdit}</button> : null}
            {team && !p.parentId ? (
              <button type="button" className="kd-btn kd-btn-sm kd-btn-ghost" onClick={() => act(() => FF.patch('/posts/' + p.id, { pinned: !p.pinned }))}>
                <PushPinIcon size={16} aria-hidden="true" />{p.pinned ? T.discUnpin : T.discPin}
              </button>
            ) : null}
            {team && !mine ? (
              <button type="button" className="kd-btn kd-btn-sm kd-btn-ghost" onClick={() => act(() => FF.patch('/posts/' + p.id, { hidden: !p.hidden }))}>
                <EyeSlashIcon size={16} aria-hidden="true" />{p.hidden ? T.discShow : T.discHide}
              </button>
            ) : null}
            {mine || team ? (
              <button type="button" className="kd-btn kd-btn-sm kd-btn-ghost" onClick={() => act(() => FF.del('/posts/' + p.id))}>
                <TrashIcon size={16} aria-hidden="true" />{T.discDelete}
              </button>
            ) : (
              <button type="button" className="kd-btn kd-btn-sm kd-btn-ghost" onClick={async () => {
                const out = await write(() => FF.post('/posts/' + p.id + '/reports', { code: 'other' }));
                if (out) kd.toast(T.discReported);
              }}>
                <FlagIcon size={16} aria-hidden="true" />{T.discReport}
              </button>
            )}
          </div>
        ) : null}
      </div>
    </article>
  );
}

// ---- photos and ambassadors -----------------------------------------------------------

export function PhotoWall({ lang }: { lang: Lang }) {
  const { ev } = useEvent();
  const T = pick(WEB, lang);
  const [items, setItems] = useState<{ url: string; caption: string | null; author: { name: string | null } }[] | null>(null);
  useEffect(() => { FF.maybe(FF.get('/events/' + ev.id + '/photos'), null).then((r: any) => r && setItems(r.items)); }, [ev.id]);
  if (!items?.length) return null;
  return (
    <section aria-labelledby="photos-h" className="flex flex-col gap-3">
      <h2 id="photos-h" className="kd-d3">{T.photos}</h2>
      <div className="kd-mgrid">
        {items.slice(0, 9).map((x) => (
          <figure key={x.url} className="kd-mtile m-0 cursor-default">
            { }
            <img src={x.url} alt={x.caption ?? ''} loading="lazy" />
          </figure>
        ))}
      </div>
    </section>
  );
}

export function Ambassadors({ lang }: { lang: Lang }) {
  const { ev } = useEvent();
  const T = pick(WEB, lang);
  if (!ev.ambassadors.length) return null;
  return (
    <section aria-labelledby="amb-h" className="flex flex-col gap-2">
      <h2 id="amb-h" className="kd-d3">{T.ambassadors}</h2>
      <ul className="flex flex-wrap gap-x-5 gap-y-2">
        {ev.ambassadors.map((a) => (
          <li key={a.name + a.initials} className="flex items-center gap-2">
            <Avatar name={a.initials} size={28} />
            <span className="kd-s text-fg-2">{a.name}</span>
            <span className="kd-m kd-num">{fill(T.ambVisits, { n: a.visits })}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
