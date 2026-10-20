'use client';
/**
 * The writer's side of the blog: /blog/new starts a post, /blog/<slug>/edit edits it (the words,
 * the category, the styles and city, the cover, the tracks) and sends it for review (the team's
 * posts go up at once), /blog/mine lists one's posts. Anyone signed in may write.
 */
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { PlusIcon, XIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { freshen } from '../../fresh';
import { fill, pick, type Lang, type Pair, tx } from '../../copy';
import { KdLink as Link, inLang } from '../../link';
import { isTeam } from '../../craft';
import { useKd } from '../../runtime';
import { Button, Chip, IconButton, LinkButton } from '../../ui/actions';
import { FieldError, FieldLabel, Input, Select, TextArea } from '../../ui/forms';
import { ImageLinkField } from '../../ui/image-link';
import { Accordion, Card as Panel, Status, type StatusTone } from '../../ui/parts';
import { Tabs } from '../../ui/shell';
import { BLOG, CATEGORY_LABEL } from './copy';
import { CATEGORIES, say, text, type Post } from './model';

interface Meta { cities: { slug: string; name: Pair }[]; styles: { key: string; label: Pair }[] }

const STATUS_TONE: Record<Post['status'], StatusTone> = { draft: 'none', in_review: 'warn', published: 'ok', rejected: 'bad', hidden: 'none' };

function useStatusLabel(lang: Lang) {
  const T = pick(BLOG, lang);
  return { draft: T.sDraft, in_review: T.sReview, published: T.sPublished, rejected: T.sRejected, hidden: T.sHidden } as Record<Post['status'], string>;
}

/** Signed in, or the way in. */
function Gate({ lang, children }: { lang: Lang; children: ReactNode }) {
  const T = pick(BLOG, lang);
  const kd = useKd();
  if (kd.session === undefined) return <div className="kd-skel h-60" aria-hidden="true" />;
  if (kd.user) return <>{children}</>;
  return (
    <Panel className="flex max-w-sm flex-col items-start gap-4 p-7">
      <h1 className="kd-d3">{T.gate}</h1>
      <Button tone="acc" onClick={() => kd.openSignIn(T.gate)}>{T.signIn}</Button>
    </Panel>
  );
}

export function PostEditor({ lang, slug }: { lang: Lang; slug: string | null }) {
  return <Gate lang={lang}><Edit lang={lang} slug={slug} /></Gate>;
}

function Edit({ lang, slug }: { lang: Lang; slug: string | null }) {
  const T = pick(BLOG, lang);
  const kd = useKd();
  const [meta, setMeta] = useState<Meta | null>(null);
  const [post, setPost] = useState<Post | null | undefined>(slug ? undefined : null);
  useEffect(() => {
    FF.once('kd:discovery', () => FF.maybe(FF.get('/meta/discovery'), null)).then((d: Meta | null) => d && setMeta(d));
    if (slug) FF.maybe(FF.get('/posts/' + encodeURIComponent(slug)), null).then((x: Post | null) => setPost(x && x.mine ? x : null));
  }, [slug]);
  if (!meta || post === undefined) return <div className="kd-skel h-60" aria-hidden="true" />;
  if (slug && !post) return <Panel className="p-7"><span className="kd-h">{T.none}</span></Panel>;
  const saved = (x: Post) => {
    if (!post) { location.assign(`/blog/${encodeURIComponent(x.slug)}/edit`); return; }
    setPost(x);
    if (x.status === 'published') void freshen('blog', x.slug);
    kd.toast(T.saved);
  };
  return (
    <div className="flex flex-col gap-10">
      <div className="kd-sec items-end">
        <h1 className="kd-d2">{post ? say(post.title, lang) || T.newTitle : T.newTitle}</h1>
        {post?.status === 'published' ? <LinkButton href={inLang('/blog/' + encodeURIComponent(post.slug), lang)}>{T.view}</LinkButton> : null}
      </div>
      {post ? <StatusBar lang={lang} post={post} onChange={setPost} /> : null}
      <Fields lang={lang} meta={meta} post={post} onSaved={saved} />
      {post ? <Tracks lang={lang} post={post} onChange={setPost} /> : null}
    </div>
  );
}

function StatusBar({ lang, post, onChange }: { lang: Lang; post: Post; onChange: (p: Post) => void }) {
  const T = pick(BLOG, lang);
  const label = useStatusLabel(lang);
  const kd = useKd();
  const [err, setErr] = useState('');
  const submit = async () => {
    setErr('');
    try {
      const out = (await FF.post(`/me/posts/${post.id}/submit`)) as Post & { message?: Pair };
      onChange(out);
      if (out.status === 'published') void freshen('blog', out.slug);
      if (out.message) kd.toast(FF.text(out.message, lang));
    } catch (e) { setErr(FF.errorText(e, lang)); }
  };
  const draft = post.status === 'draft' || post.status === 'rejected';
  return (
    <Panel className="flex max-w-3xl flex-col gap-3 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-2"><span className="kd-m">{T.status}</span><Status tone={STATUS_TONE[post.status]}>{label[post.status]}</Status></span>
        {draft ? <Button tone="acc" disabled={!!post.missing?.length} onClick={submit}>{isTeam(kd.user) ? T.publish : T.submit}</Button> : null}
      </div>
      {post.decisionNote && post.status === 'rejected' ? <p className="kd-s text-fg-1">{fill(T.teamNote, { n: post.decisionNote })}</p> : null}
      {post.missing?.length ? <p className="kd-s">{fill(T.missing, { m: post.missing.map((m) => text(m, lang)).join(', ') })}</p> : null}
      <FieldError>{err}</FieldError>
    </Panel>
  );
}

type W = 'vi' | 'en';
const emptyPair = (): Pair => ({ en: '', vi: '' });

function Fields({ lang, meta, post, onSaved }: { lang: Lang; meta: Meta; post: Post | null; onSaved: (p: Post) => void }) {
  const T = pick(BLOG, lang);
  const C = pick(CATEGORY_LABEL, lang);
  const kd = useKd();
  const team = isTeam(kd.user);
  const [f, setF] = useState({
    category: post?.category.key ?? 'styles', lang: post?.lang ?? (lang === 'en' ? 'en' : 'vi'),
    title: post?.title ?? emptyPair(), excerpt: post?.excerpt ?? emptyPair(), body: post?.body ?? emptyPair(),
    coverUrl: post?.coverUrl ?? null, coverCredit: post?.coverCredit ?? '',
    styles: post?.styles.map((s) => s.key) ?? [], city: post?.city?.slug ?? '',
    facts: post?.facts ?? [], faq: post?.faq ?? [], sources: post?.sources ?? [], parentSlug: post?.parent?.slug ?? '',
  });
  // The language being written in the fields below; both are saved together.
  const [w, setW] = useState<W>(post?.lang ?? (lang === 'en' ? 'en' : 'vi'));
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const editable = !post || post.status !== 'hidden';
  const toggleStyle = (k: string) => setF((x) => ({ ...x, styles: x.styles.includes(k) ? x.styles.filter((y) => y !== k) : x.styles.length < 6 ? [...x.styles, k] : x.styles }));
  const setPair = (k: 'title' | 'excerpt' | 'body', v: string) => setF((x) => ({ ...x, [k]: { ...x[k], [w]: v } }));
  const setFact = (i: number, field: 'label' | 'value', v: string) =>
    setF((x) => ({ ...x, facts: x.facts.map((r, j) => (j === i ? { ...r, [field]: { ...r[field], [w]: v } } : r)) }));
  const setFaq = (i: number, field: 'q' | 'a', v: string) =>
    setF((x) => ({ ...x, faq: x.faq.map((r, j) => (j === i ? { ...r, [field]: { ...r[field], [w]: v } } : r)) }));
  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr('');
    const body = {
      category: f.category, lang: f.lang, title: f.title, excerpt: f.excerpt, body: f.body, coverUrl: f.coverUrl, coverCredit: f.coverCredit.trim() || null,
      styles: f.styles, city: f.city || null,
      facts: f.facts.filter((x) => x.label.vi || x.label.en), faq: f.faq.filter((x) => x.q.vi || x.q.en), sources: f.sources.filter((x) => x.title && x.url),
      ...(team ? { parentSlug: f.parentSlug.trim() || null } : {}),
    };
    try {
      onSaved((await (post ? FF.patch(`/me/posts/${post.id}`, body) : FF.post('/me/posts', body))) as Post);
    } catch (x) { setErr(FF.errorText(x, lang)); }
    setBusy(false);
  };
  const wl = w === 'vi' ? 'Tiếng Việt' : 'English';
  return (
    <form onSubmit={save} className="grid max-w-3xl grid-cols-1 gap-4 tab:grid-cols-2">
      <fieldset className="flex flex-col gap-2 tab:col-span-2" disabled={!editable}>
        <legend className="kd-flabel mb-2">{T.fCategory}</legend>
        <div className="flex flex-wrap gap-2">{CATEGORIES.map((k) => <Chip key={k} on={f.category === k} onClick={() => setF((x) => ({ ...x, category: k }))}>{C[k]}</Chip>)}</div>
      </fieldset>
      {/* Both languages in one form: the tabs switch what the fields below write. */}
      <div className="tab:col-span-2">
        <Tabs label={T.fWriting} current={w} onSelect={(k) => setW(k as W)} items={[{ key: 'vi', label: 'Tiếng Việt' }, { key: 'en', label: 'English' }]} />
      </div>
      <div className="flex flex-col gap-2 tab:col-span-2" lang={w}><FieldLabel htmlFor="bp-title">{`${T.fTitle} · ${wl}`}</FieldLabel><Input id="bp-title" maxLength={140} value={f.title[w]} disabled={!editable} onChange={(e) => setPair('title', e.target.value)} /></div>
      <div className="flex flex-col gap-2 tab:col-span-2" lang={w}><FieldLabel htmlFor="bp-excerpt">{`${T.fExcerpt} · ${wl}`}</FieldLabel><TextArea id="bp-excerpt" rows={2} maxLength={320} value={f.excerpt[w]} disabled={!editable} onChange={(e) => setPair('excerpt', e.target.value)} /></div>
      <div className="flex flex-col gap-2 tab:col-span-2" lang={w}><FieldLabel htmlFor="bp-body" hint={T.fBodyHint}>{`${T.fBody} · ${wl}`}</FieldLabel><TextArea id="bp-body" rows={18} maxLength={40000} value={f.body[w]} disabled={!editable} onChange={(e) => setPair('body', e.target.value)} /></div>
      <div className="flex flex-col gap-2"><FieldLabel htmlFor="bp-lang">{T.fLang}</FieldLabel>
        <Select id="bp-lang" value={f.lang} disabled={!editable} onChange={(e) => setF({ ...f, lang: e.target.value as W })}>
          <option value="vi">Tiếng Việt</option>
          <option value="en">English</option>
        </Select>
      </div>
      <div className="flex flex-col gap-2"><FieldLabel htmlFor="bp-city">{T.fCity}</FieldLabel>
        <Select id="bp-city" value={f.city} disabled={!editable} onChange={(e) => setF({ ...f, city: e.target.value })}>
          <option value="">{T.noCity}</option>
          {meta.cities.map((c) => <option key={c.slug} value={c.slug}>{tx(c.name, lang)}</option>)}
        </Select>
      </div>
      <fieldset className="flex flex-col gap-2 tab:col-span-2" disabled={!editable}>
        <legend className="kd-flabel mb-2">{T.fStyles}</legend>
        <div className="flex flex-wrap gap-2">{meta.styles.map((s) => <Chip key={s.key} family="edm" on={f.styles.includes(s.key)} onClick={() => toggleStyle(s.key)}>{tx(s.label, lang)}</Chip>)}</div>
      </fieldset>
      {/* A post's cover is a link (only event media is uploaded), checked as it is pasted. */}
      {editable ? (
        <ImageLinkField lang={lang} purpose="profile_cover" label={T.fCover} hint={T.fCoverHint} value={f.coverUrl} onChange={(v) => setF((x) => ({ ...x, coverUrl: v }))} className="tab:col-span-2" />
      ) : null}
      <div className="flex flex-col gap-2 tab:col-span-2"><FieldLabel htmlFor="bp-credit" hint={T.fCreditHint}>{T.fCredit}</FieldLabel><Input id="bp-credit" maxLength={300} value={f.coverCredit} disabled={!editable} onChange={(e) => setF({ ...f, coverCredit: e.target.value })} /></div>
      {/* A guide's extras: quick facts, questions and answers, the sources it rests on. */}
      <Accordion summary={T.facts} aside={f.facts.length || null} className="tab:col-span-2">
        <div className="flex flex-col gap-3" lang={w}>
          {f.facts.map((x, i) => (
            <div key={i} className="grid grid-cols-1 items-end gap-2 tab:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto]">
              <Input aria-label={`${T.fFactLabel} ${i + 1} · ${wl}`} placeholder={T.fFactLabel} maxLength={60} value={x.label[w]} disabled={!editable} onChange={(e) => setFact(i, 'label', e.target.value)} />
              <Input aria-label={`${T.fFactValue} ${i + 1} · ${wl}`} placeholder={T.fFactValue} maxLength={240} value={x.value[w]} disabled={!editable} onChange={(e) => setFact(i, 'value', e.target.value)} />
              <IconButton label={fill(T.removeRow, { n: i + 1 })} disabled={!editable} onClick={() => setF((y) => ({ ...y, facts: y.facts.filter((_, j) => j !== i) }))}><XIcon size={18} aria-hidden="true" /></IconButton>
            </div>
          ))}
          <Button disabled={!editable || f.facts.length >= 12} className="self-start" onClick={() => setF((y) => ({ ...y, facts: [...y.facts, { label: emptyPair(), value: emptyPair() }] }))}><PlusIcon size={16} aria-hidden="true" />{T.addFact}</Button>
        </div>
      </Accordion>
      <Accordion summary={T.faq} aside={f.faq.length || null} className="tab:col-span-2">
        <div className="flex flex-col gap-4" lang={w}>
          {f.faq.map((x, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="flex items-end gap-2">
                <Input boxClass="min-w-0 flex-1" aria-label={`${T.fQuestion} ${i + 1} · ${wl}`} placeholder={T.fQuestion} maxLength={300} value={x.q[w]} disabled={!editable} onChange={(e) => setFaq(i, 'q', e.target.value)} />
                <IconButton label={fill(T.removeRow, { n: i + 1 })} disabled={!editable} onClick={() => setF((y) => ({ ...y, faq: y.faq.filter((_, j) => j !== i) }))}><XIcon size={18} aria-hidden="true" /></IconButton>
              </div>
              <TextArea aria-label={`${T.fAnswer} ${i + 1} · ${wl}`} placeholder={T.fAnswer} rows={3} maxLength={2000} value={x.a[w]} disabled={!editable} onChange={(e) => setFaq(i, 'a', e.target.value)} />
            </div>
          ))}
          <Button disabled={!editable || f.faq.length >= 12} className="self-start" onClick={() => setF((y) => ({ ...y, faq: [...y.faq, { q: emptyPair(), a: emptyPair() }] }))}><PlusIcon size={16} aria-hidden="true" />{T.addQuestion}</Button>
        </div>
      </Accordion>
      <Accordion summary={T.sources} aside={f.sources.length || null} className="tab:col-span-2">
        <div className="flex flex-col gap-3">
          {f.sources.map((x, i) => (
            <div key={i} className="grid grid-cols-1 items-end gap-2 tab:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)_auto]">
              <Input aria-label={`${T.fSourceTitle} ${i + 1}`} placeholder={T.fSourceTitle} maxLength={200} value={x.title} disabled={!editable} onChange={(e) => setF((y) => ({ ...y, sources: y.sources.map((r, j) => (j === i ? { ...r, title: e.target.value } : r)) }))} />
              <Input aria-label={`${T.fSourceUrl} ${i + 1}`} placeholder="https://…" type="url" maxLength={500} value={x.url} disabled={!editable} onChange={(e) => setF((y) => ({ ...y, sources: y.sources.map((r, j) => (j === i ? { ...r, url: e.target.value } : r)) }))} />
              <Input aria-label={`${T.fSourcePublisher} ${i + 1}`} placeholder={T.fSourcePublisher} maxLength={100} value={x.publisher ?? ''} disabled={!editable} onChange={(e) => setF((y) => ({ ...y, sources: y.sources.map((r, j) => (j === i ? { ...r, publisher: e.target.value } : r)) }))} />
              <IconButton label={fill(T.removeRow, { n: i + 1 })} disabled={!editable} onClick={() => setF((y) => ({ ...y, sources: y.sources.filter((_, j) => j !== i) }))}><XIcon size={18} aria-hidden="true" /></IconButton>
            </div>
          ))}
          <Button disabled={!editable || f.sources.length >= 20} className="self-start" onClick={() => setF((y) => ({ ...y, sources: [...y.sources, { title: '', url: '', publisher: '' }] }))}><PlusIcon size={16} aria-hidden="true" />{T.addSource}</Button>
        </div>
      </Accordion>
      {team ? (
        <div className="flex flex-col gap-2 tab:col-span-2"><FieldLabel htmlFor="bp-parent" hint={T.fParentHint}>{T.fParent}</FieldLabel><Input id="bp-parent" maxLength={90} value={f.parentSlug} disabled={!editable} onChange={(e) => setF({ ...f, parentSlug: e.target.value })} /></div>
      ) : null}
      <FieldError>{err}</FieldError>
      {editable ? <Button type="submit" tone={post ? 'default' : 'acc'} disabled={busy} className="justify-self-start">{post ? T.save : T.create}</Button> : null}
    </form>
  );
}

/** The post's tracks: a link or an embed code each, resolved by the API (nothing from a service loads here). */
function Tracks({ lang, post, onChange }: { lang: Lang; post: Post; onChange: (p: Post) => void }) {
  const T = pick(BLOG, lang);
  const [source, setSource] = useState('');
  const [title, setTitle] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const editable = post.status !== 'hidden';
  const code = /<iframe\b/i.test(source);
  const add = async () => {
    if (!source.trim()) return;
    setBusy(true); setErr('');
    try {
      onChange((await FF.post(`/me/posts/${post.id}/tracks`, { source, title: code ? title : '' })) as Post);
      setSource(''); setTitle('');
    } catch (e) { setErr(FF.errorText(e, lang)); }
    setBusy(false);
  };
  const remove = async (id: string) => {
    try { onChange((await FF.del(`/me/posts/${post.id}/tracks/${id}`)) as Post); } catch (e) { setErr(FF.errorText(e, lang)); }
  };
  return (
    <section aria-labelledby="bt-h" className="flex max-w-3xl flex-col gap-3">
      <h2 id="bt-h" className="kd-h">{T.tracks}</h2>
      {post.tracks.length ? (
        <ol className="flex flex-col">
          {post.tracks.map((t) => (
            <li key={t.id} className="kd-lrow justify-between gap-3">
              <span className="flex min-w-0 flex-col"><span className="kd-hs kd-ell">{t.title}</span><span className="kd-s kd-ell">{[t.authorName, t.providerLabel].filter(Boolean).join(' · ')}</span></span>
              {editable ? <IconButton label={fill(T.removeTrack, { t: t.title })} onClick={() => remove(t.id)}><XIcon size={18} aria-hidden="true" /></IconButton> : null}
            </li>
          ))}
        </ol>
      ) : null}
      {editable ? (
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="bt-source" hint={T.fTrackHint}>{T.fTrack}</FieldLabel>
          <TextArea id="bt-source" rows={code ? 4 : 2} maxLength={4000} value={source} onChange={(e) => setSource(e.target.value)} />
          {code ? <><FieldLabel htmlFor="bt-title">{T.fTrackTitle}</FieldLabel><Input id="bt-title" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} /></> : null}
          <Button disabled={busy || !source.trim()} onClick={add} className="self-start">{T.addTrack}</Button>
          <FieldError>{err}</FieldError>
        </div>
      ) : null}
    </section>
  );
}

export function MyPosts({ lang }: { lang: Lang }) {
  return <Gate lang={lang}><Mine lang={lang} /></Gate>;
}

function Mine({ lang }: { lang: Lang }) {
  const T = pick(BLOG, lang);
  const label = useStatusLabel(lang);
  const [posts, setPosts] = useState<Post[] | null>(null);
  useEffect(() => { FF.maybe(FF.get('/me/posts'), { items: [] }).then((o: { items: Post[] }) => setPosts(o.items)); }, []);
  return (
    <div className="flex flex-col gap-10">
      <div className="kd-sec items-end">
        <h1 className="kd-d2">{T.mine}</h1>
        <LinkButton tone="acc" href={inLang('/blog/new', lang)}>{T.write}</LinkButton>
      </div>
      {!posts ? <div className="kd-skel h-24" aria-hidden="true" /> : !posts.length ? <p className="kd-s">{T.noneMine}</p> : (
        <ul className="flex max-w-3xl flex-col gap-2">
          {posts.map((p) => (
            <li key={p.id}>
              <Link href={`/blog/${encodeURIComponent(p.slug)}/edit`} className="kd-card flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-white/[0.04]">
                <span className="flex min-w-0 flex-col"><span className="kd-hs kd-ell">{say(p.title, lang)}</span><span className="kd-s">{text(p.category.label, lang)}</span></span>
                <Status tone={STATUS_TONE[p.status]}>{label[p.status]}</Status>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
