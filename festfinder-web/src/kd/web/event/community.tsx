'use client';
/**
 * The event's community: hype and its goals, the discussion (questions, talk, finding a
 * crew, track IDs and memories, depending on whether it is before, during or after), the
 * photo wall and the ambassadors who brought people in.
 */
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  ArrowBendUpLeftIcon, CameraIcon, CheckCircleIcon, FireIcon, FlagIcon, LockSimpleIcon, PushPinIcon, ThumbsUpIcon, TrashIcon, EyeSlashIcon, XIcon,
} from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang } from '../../copy';
import { cx } from '../../cx';
import { count } from '../../format';
import { PhoneSheet } from '../../phone';
import { useKd } from '../../runtime';
import { Button, Chip } from '../../ui/actions';
import { TextArea, Input } from '../../ui/forms';
import { Picker } from '../../ui/menu';
import { Avatar, BarTrack, Tag } from '../../ui/parts';
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

export function Hype({ lang }: { lang: Lang }) {
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
    <section aria-labelledby="hype-h" className="kd-card flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h2 id="hype-h" className="kd-m">{T.hype}</h2>
        <span className="kd-mb kd-num whitespace-nowrap">{fill(T.hypeCount, { n: count(H.count, lang) })}</span>
        {H.last24h ? <span className="kd-s whitespace-nowrap">{fill(T.hype24, { n: H.last24h })}</span> : null}
        <Button size="sm" className="ml-auto" aria-pressed={hyped} onClick={toggle}>
          <FireIcon size={16} weight={hyped ? 'fill' : 'regular'} className={hyped ? 'text-acc' : undefined} aria-hidden="true" />
          {hyped ? T.hyped : T.hypeIt}
        </Button>
      </div>
      {H.next ? (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="kd-s text-mist">{H.next.reward[lang]}</span>
            <span className="kd-m kd-num">{fill(T.hypeLeft, { n: count(H.next.left, lang) })}</span>
          </div>
          <BarTrack value={Math.round(H.next.progress * 100)} max={100} label={H.next.reward[lang]} />
        </div>
      ) : null}
      {H.goals.length ? (
        <ul className="flex flex-col">
          {H.goals.map((x) => (
            <li key={x.threshold} className="flex items-center gap-2.5 border-t border-line py-2 kd-s">
              {x.reached ? <CheckCircleIcon size={16} weight="fill" className="text-ok" aria-hidden="true" /> : <LockSimpleIcon size={16} className="text-ash" aria-hidden="true" />}
              <span className="kd-mb kd-num w-16">{count(x.threshold, lang)}</span>
              <span className={x.reached ? 'text-mist' : undefined}>{x.reward[lang]}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

// ---- discussion ----------------------------------------------------------------------

export function DiscussionSection({ lang }: { lang: Lang }) {
  const { ev, reload: reloadEvent } = useEvent();
  const kd = useKd();
  const T = pick(WEB, lang);
  const [kind, setKind] = useState<string | null>(null);
  const [sort, setSort] = useState<'top' | 'new'>('top');
  const [d, setD] = useState<Discussion | null>(null);
  const [more, setMore] = useState<Record<string, Post[]>>({});
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [phoneFor, setPhoneFor] = useState<(() => void) | null>(null);

  const load = useCallback(async (k = kind, s = sort) => {
    const qs = 'sort=' + s + (k ? '&kind=' + k : '');
    const out = await FF.maybe(FF.get('/events/' + ev.id + '/discussion?' + qs), null);
    if (out) { setD(out); setKind(out.kind); setMore({}); }
  }, [ev.id, kind, sort]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [ev.id, kd.user]);

  /** A write: sign in first, or prove a phone when the API asks, then retry. */
  const write = async <R,>(run: () => Promise<R>): Promise<R | null> => {
    if (!kd.requireSignIn(undefined, T.discSignin)) return null;
    try {
      return await run();
    } catch (e) {
      if ((e as { code?: string }).code === 'phone_unverified') setPhoneFor(() => () => { write(run); });
      else kd.toast(FF.errorText(e, lang));
      return null;
    }
  };

  const kinds = d?.kinds ?? [];
  const cur = kinds.find((k) => k.kind === kind);
  const gate = d?.me.canWrite ?? 'signin';

  return (
    <section id="discussion" aria-labelledby="disc-h" className="flex scroll-mt-32 flex-col gap-4">
      <div className="kd-sec items-center">
        <h2 id="disc-h" className="kd-d3">{T.discussion}{d ? <span className="kd-m kd-num ml-3 align-middle">{d.total}</span> : null}</h2>
        <Picker
          label={T.discSort}
          value={sort}
          onChange={(v) => { setSort(v); load(kind, v); }}
          options={[{ value: 'top', label: T.discTop }, { value: 'new', label: T.discNew }]}
        />
      </div>
      {kinds.length ? (
        <div className="kd-hscroll" role="group" aria-label={T.discussion}>
          {kinds.map((k) => (
            <Chip key={k.kind} on={k.kind === kind} count={k.count || null} onClick={() => { setKind(k.kind); setReplyTo(null); load(k.kind, sort); }}>
              {k.label[lang]}
            </Chip>
          ))}
        </div>
      ) : null}
      {d && cur && !cur.open ? <p className="kd-s">{T.discClosed}</p> : null}
      {d && cur?.open ? (
        gate === 'ok' || !kd.user ? (
          <Composer lang={lang} kind={kind!} onPosted={() => { load(); reloadEvent(); }} write={write} />
        ) : gate === 'verify_phone' ? (
          <Button onClick={() => setPhoneFor(() => () => load())}>{T.discVerify}</Button>
        ) : null
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
                replyOpen={replyTo === p.id}
                onReply={() => { if (kd.requireSignIn(undefined, T.discSignin)) setReplyTo(replyTo === p.id ? null : p.id); }}
                write={write}
                reload={() => load()}
              />
            ))}
          </ul>
        ) : <p className="kd-s">{T.discEmpty}</p>
      ) : <div className="kd-skel h-24" aria-hidden="true" />}
      {d?.rules ? <p className="kd-s">{d.rules[lang]}</p> : null}
      {phoneFor ? <PhoneSheet lang={lang} onClose={() => setPhoneFor(null)} onDone={() => { const f = phoneFor; setPhoneFor(null); f(); }} /> : null}
    </section>
  );
}

function Composer({ lang, kind, onPosted, write, parentId, onDone }: {
  lang: Lang; kind: string; onPosted: () => void; write: <R>(run: () => Promise<R>) => Promise<R | null>; parentId?: string; onDone?: () => void;
}) {
  const { ev } = useEvent();
  const kd = useKd();
  const T = pick(WEB, lang);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [setId, setSetId] = useState('');
  const [heard, setHeard] = useState('');
  const photoOk = !parentId && (kind === 'memory' || kind === 'talk');
  const sets = !parentId && kind === 'trackid' && ev.timetable
    ? ev.timetable.days.flatMap((d) => d.stages.flatMap((st) => st.sets.map((s) => ({ id: s.id, label: s.artist + ' · ' + st.name[lang] }))))
    : [];
  const send = async (e: FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text || busy) return;
    setBusy(true);
    const out = await write(async () => {
      const payload: Record<string, unknown> = parentId ? { parentId, body: text } : { kind, body: text };
      if (sets.length && setId) payload.setId = setId;
      if (!parentId && kind === 'trackid' && /^([01]\d|2[0-3]):[0-5]\d$/.test(heard)) payload.heardAt = heard;
      if (photoOk && photo) {
        const form = new FormData();
        form.append('file', photo);
        payload.photoUrl = (await FF.api('POST', '/uploads?purpose=recap', form)).url;
      }
      return FF.post('/events/' + ev.id + '/posts', payload);
    });
    setBusy(false);
    if (out) {
      setBody(''); setPhoto(null); setSetId(''); setHeard('');
      kd.toast(FF.text((out as { message?: unknown }).message, lang) || T.discPost);
      onPosted();
      onDone?.();
    }
  };
  return (
    <form onSubmit={send} className="flex flex-col gap-2">
      <TextArea
        rows={parentId ? 2 : 3}
        maxLength={4000}
        placeholder={parentId ? T.discReplyPh : T.discWritePh}
        aria-label={parentId ? T.discReplyPh : T.discWritePh}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onFocus={() => kd.requireSignIn(undefined, T.discSignin)}
      />
      {sets.length ? (
        <div className="kd-hscroll">
          {sets.map((s) => <Chip key={s.id} on={setId === s.id} onClick={() => setSetId(setId === s.id ? '' : s.id)}>{s.label}</Chip>)}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        {sets.length ? <Input boxClass="w-36" inputMode="numeric" placeholder="HH:MM" aria-label={T.discHeard} value={heard} onChange={(e) => setHeard(e.target.value)} /> : null}
        {photoOk ? (
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
        <Button type="submit" size="sm" className="ml-auto" disabled={!body.trim() || busy}>{parentId ? T.discReply : T.discPost}</Button>
      </div>
    </form>
  );
}

function Thread({ lang, post, replies, hasMore, onMore, team, replyOpen, onReply, write, reload }: {
  lang: Lang; post: Post; replies: Post[]; hasMore: boolean; onMore: () => void; team: boolean; replyOpen: boolean; onReply: () => void;
  write: <R>(run: () => Promise<R>) => Promise<R | null>; reload: () => void;
}) {
  const T = pick(WEB, lang);
  return (
    <li className="flex flex-col gap-3 border-t border-line py-4">
      <PostView lang={lang} post={post} team={team} write={write} reload={reload} onReply={post.removed ? undefined : onReply} />
      {replies.length || hasMore || replyOpen ? (
        <div className="ml-11 flex flex-col gap-3 border-l border-line pl-4">
          {replies.map((r) => <PostView key={r.id} lang={lang} post={r} team={team} write={write} reload={reload} />)}
          {hasMore ? <button type="button" className="kd-more" onClick={onMore}>{fill(T.discMore, { n: post.replyCount - (post.replies ?? []).length })}</button> : null}
          {replyOpen ? <Composer lang={lang} kind={post.kind} parentId={post.id} onPosted={reload} write={write} /> : null}
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
  const act = async (run: () => Promise<{ message?: unknown } | undefined>) => {
    const out = await write(run);
    if (out && out.message) kd.toast(FF.text(out.message, lang));
    reload();
  };
  const mine = !!p.me?.mine;
  return (
    <article className={cx('flex gap-3', p.hidden && 'opacity-60')}>
      <Avatar name={p.author?.name || T.discMember} src={p.author?.photoUrl} size={32} />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="kd-hs">{p.removed ? T.discRemoved : p.author?.name || T.discMember}</span>
          {p.author?.badges.map((b) => <Tag key={b.key} tone={b.key === 'team' || b.key === 'ff' ? 'bone' : 'line'}>{b.label[lang]}</Tag>)}
          {p.official ? <Tag tone="line">{T.discOfficial}</Tag> : null}
          {p.pinned ? <Tag>{T.discPinned}</Tag> : null}
          {p.hidden ? <Tag tone="line">{T.discHidden}</Tag> : null}
          <span className="kd-s">{ago(p.createdAt, lang)}</span>
        </div>
        {p.set || p.heardAt ? <span className="kd-m">{[p.set?.artist, p.heardAt].filter(Boolean).join(' · ')}</span> : null}
        <p className={cx('kd-t whitespace-pre-line', p.removed && 'text-fog')}>{p.removed ? T.discRemoved : p.body}</p>
        {p.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- uploaded to the API's file storage
          <img src={p.photoUrl} alt="" loading="lazy" className="max-h-80 w-auto max-w-full rounded-card object-cover" />
        ) : null}
        {!p.removed ? (
          <div className="-ml-2 flex flex-wrap items-center gap-1">
            <button
              type="button"
              className="kd-btn kd-btn-sm kd-btn-ghost"
              aria-pressed={!!p.me?.helped}
              disabled={mine}
              onClick={() => act(() => (p.me?.helped ? FF.del : FF.put)('/posts/' + p.id + '/helpful'))}
            >
              <ThumbsUpIcon size={16} weight={p.me?.helped ? 'fill' : 'regular'} className={p.me?.helped ? 'text-acc' : undefined} aria-hidden="true" />
              {T.discHelpful}{p.helpfulCount ? <span className="kd-num"> {p.helpfulCount}</span> : null}
            </button>
            {onReply ? <button type="button" className="kd-btn kd-btn-sm kd-btn-ghost" onClick={onReply}><ArrowBendUpLeftIcon size={16} aria-hidden="true" />{T.discReply}</button> : null}
            {team && !p.parentId ? (
              <button type="button" className="kd-btn kd-btn-sm kd-btn-ghost" onClick={() => act(() => FF.patch('/posts/' + p.id, { pinned: !p.pinned }))}>
                <PushPinIcon size={16} aria-hidden="true" />{p.pinned ? T.discUnpin : T.discPin}
              </button>
            ) : null}
            {team ? (
              <button type="button" className="kd-btn kd-btn-sm kd-btn-ghost" onClick={() => act(() => FF.patch('/posts/' + p.id, { hidden: !p.hidden }))}>
                <EyeSlashIcon size={16} aria-hidden="true" />{p.hidden ? T.discShow : T.discHide}
              </button>
            ) : null}
            {mine ? (
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
      <h2 id="photos-h" className="kd-m">{T.photos}</h2>
      <div className="kd-mgrid">
        {items.slice(0, 9).map((x) => (
          <figure key={x.url} className="kd-mtile m-0 cursor-default">
            {/* eslint-disable-next-line @next/next/no-img-element -- uploaded to the API's file storage */}
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
      <h2 id="amb-h" className="kd-m">{T.ambassadors}</h2>
      <ul className="flex flex-wrap gap-x-5 gap-y-2">
        {ev.ambassadors.map((a) => (
          <li key={a.name + a.initials} className="flex items-center gap-2">
            <Avatar name={a.initials} size={28} />
            <span className="kd-s text-mist">{a.name}</span>
            <span className="kd-m kd-num">{fill(T.ambVisits, { n: a.visits })}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
