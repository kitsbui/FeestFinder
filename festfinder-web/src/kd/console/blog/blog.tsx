'use client';
/**
 * /console/blog: posts people write (festfinder-backend routes/blog.ts). The team reads one in
 * review and approves it (it goes public) or sends it back with a reason; a public post can be
 * taken down and put back. Every decision renders the public pages again at once (kd/fresh.ts);
 * the editorial posts the import brings (content packs) can be approved together.
 */
import { useState } from 'react';
import { ArrowSquareOutIcon, CheckIcon, DownloadSimpleIcon, PencilSimpleIcon, XIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang } from '../../copy';
import { freshen } from '../../fresh';
import { useKd } from '../../runtime';
import { Button, LinkButton } from '../../ui/actions';
import { TextArea } from '../../ui/forms';
import { Row, Table, Tabs } from '../../ui/shell';
import { PostBody } from '../../web/blog/body';
import { say, type Post } from '../../web/blog/model';
import { act, Body, Drawer, Empty, ErrorBox, Field, Loading, PageHead, Pill, useLoad } from '../kit';
import { useConsole } from '../root';
import { Cell, Two } from '../parts';

type Status = 'in_review' | 'published' | 'rejected' | 'hidden';
type Item = Post & { authorEmail: string | null; imported: boolean; edited: boolean };

const B = {
  title: { en: 'Blog', vi: 'Blog' },
  in_review: { en: 'In review', vi: 'Chờ duyệt' },
  published: { en: 'Published', vi: 'Đã đăng' },
  rejected: { en: 'Sent back', vi: 'Đã gửi lại' },
  hidden: { en: 'Taken down', vi: 'Đã gỡ' },
  none: { en: 'Nothing here', vi: 'Không có bài nào' },
  cPost: { en: 'Post', vi: 'Bài viết' },
  cAuthor: { en: 'Author', vi: 'Tác giả' },
  cTracks: { en: 'Tracks', vi: 'Bài nhạc' },
  approve: { en: 'Approve', vi: 'Duyệt' },
  reject: { en: 'Send back', vi: 'Gửi lại' },
  hide: { en: 'Take down', vi: 'Gỡ bài' },
  restore: { en: 'Put back', vi: 'Đăng lại' },
  note: { en: 'Reason for the author', vi: 'Lý do gửi tác giả' },
  view: { en: 'Public page', vi: 'Trang công khai' },
  edit: { en: 'Edit post', vi: 'Sửa bài' },
  importPacks: { en: 'Import editorial posts', vi: 'Nhập bài biên tập' },
  approvePacks: { en: 'Approve editorial ({n})', vi: 'Duyệt bài biên tập ({n})' },
  approvedN: { en: '{n} approved', vi: 'Đã duyệt {n} bài' },
  fromPack: { en: 'Editorial', vi: 'Biên tập' },
  editedPack: { en: 'Editorial, edited', vi: 'Biên tập, đã sửa' },
};
const STATUSES: Status[] = ['in_review', 'published', 'rejected', 'hidden'];
const COLS = 'minmax(280px,2fr) minmax(200px,1fr) 90px';

export function ConsoleBlog() {
  const { lang, refreshCounts } = useConsole();
  const T = pick(B, lang);
  const [status, setStatus] = useState<Status>('in_review');
  const load = useLoad<{ items: Item[]; counts: Record<string, number> }>('/admin/posts?status=' + status);
  const [open, setOpen] = useState<Item | null>(null);
  const kd = useKd();
  const [importing, setImporting] = useState(false);
  // The editorial packs now rather than at the job's next run (services/blog-content.ts).
  const importPacks = async () => {
    setImporting(true);
    if (await act(kd, lang, () => FF.post('/admin/posts/import'))) { load.reload(); refreshCounts(); }
    setImporting(false);
  };
  // The editorial posts waiting, approved in one go (the team's own words; a person's post is read one by one).
  const packs = status === 'in_review' ? (load.data?.items ?? []).filter((p) => p.imported) : [];
  const approvePacks = async () => {
    setImporting(true);
    let done = 0;
    for (const p of packs) {
      try { await FF.post(`/admin/posts/${p.id}/decision`, { action: 'approve', note: '' }); done++; void freshen('blog', p.slug); } catch (e) { kd.toast(FF.errorText(e, lang)); break; }
    }
    if (done) kd.toast(fill(T.approvedN, { n: done }));
    setImporting(false);
    load.reload(); refreshCounts();
  };
  return (
    <>
      <PageHead title={T.title} actions={(
        <>
          {packs.length > 1 ? <Button tone="acc" disabled={importing} onClick={approvePacks}><CheckIcon size={16} aria-hidden="true" />{fill(T.approvePacks, { n: packs.length })}</Button> : null}
          <Button disabled={importing} onClick={importPacks}><DownloadSimpleIcon size={16} aria-hidden="true" />{T.importPacks}</Button>
        </>
      )} />
      <Body>
        <Tabs label={T.title} current={status} onSelect={(k) => setStatus(k as Status)} items={STATUSES.map((s) => ({ key: s, label: T[s], count: load.data?.counts[s] ?? null }))} />
        {load.error && !load.data ? <ErrorBox error={load.error} retry={load.reload} /> : !load.data ? <Loading /> : !load.data.items.length ? <Empty title={T.none} /> : (
          <Table label={T.title} cols={COLS} head={[T.cPost, T.cAuthor, T.cTracks]}>
            {load.data.items.map((p) => (
              <Row key={p.id} cols={COLS} current={open?.id === p.id}>
                <Cell>
                  <button type="button" className="flex min-h-11 w-full min-w-0 flex-col justify-center text-left hover:underline" onClick={() => setOpen(p)}>
                    <Two title={say(p.title, lang)} sub={[FF.text(p.category.label, lang), p.title.vi && p.title.en ? 'VI · EN' : p.lang.toUpperCase(), p.imported ? (p.edited ? T.editedPack : T.fromPack) : ''].filter(Boolean).join(' · ')} />
                  </button>
                </Cell>
                <Cell className="kd-s kd-ell">{[p.author.name, p.authorEmail].filter(Boolean).join(' · ')}</Cell>
                <Cell end className="kd-num text-sm text-fg-1">{p.trackCount}</Cell>
              </Row>
            ))}
          </Table>
        )}
      </Body>
      {open ? <Review key={open.id} lang={lang} p={open} onClose={(changed) => { setOpen(null); if (changed) { load.reload(); refreshCounts(); } }} /> : null}
    </>
  );
}

function Review({ lang, p, onClose }: { lang: Lang; p: Item; onClose: (changed: boolean) => void }) {
  const T = pick(B, lang);
  const kd = useKd();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const decide = async (action: 'approve' | 'reject' | 'hide' | 'restore') => {
    setBusy(true);
    const ok = await act(kd, lang, () => FF.post(`/admin/posts/${p.id}/decision`, { action, note }));
    setBusy(false);
    // The post's page and the blog's list render again now, not a minute later.
    if (ok) { void freshen('blog', p.slug); onClose(true); }
  };
  return (
    <Drawer
      title={say(p.title, lang)}
      sub={[FF.text(p.category.label, lang), p.author.name].filter(Boolean).join(' · ')}
      onClose={() => onClose(false)}
      footer={p.status === 'in_review' ? (
        <>
          <Button disabled={busy || !note.trim()} onClick={() => decide('reject')}><XIcon size={16} aria-hidden="true" />{T.reject}</Button>
          <span className="flex-1" />
          <Button tone="acc" disabled={busy} onClick={() => decide('approve')}><CheckIcon size={16} aria-hidden="true" />{T.approve}</Button>
        </>
      ) : p.status === 'published' ? <Button tone="danger" disabled={busy} onClick={() => decide('hide')}>{T.hide}</Button>
        : p.status === 'hidden' ? <Button disabled={busy} onClick={() => decide('restore')}>{T.restore}</Button> : null}
    >
      <div className="flex flex-col gap-4" lang={p.lang}>
        {p.styles.length ? <span className="flex flex-wrap gap-1.5">{p.styles.map((s) => <Pill key={s.key}>{FF.text(s.label, lang)}</Pill>)}</span> : null}
        {/* The team edits every word, both languages, in the post's own editor. */}
        <LinkButton href={`/blog/${encodeURIComponent(p.slug)}/edit`} className="self-start"><PencilSimpleIcon size={16} aria-hidden="true" />{T.edit}</LinkButton>
        {say(p.excerpt, lang) ? <p className="kd-t text-fg-1">{say(p.excerpt, lang)}</p> : null}
        <PostBody text={say(p.body, lang)} trusted={p.author.editorial} />
        {p.tracks.length ? (
          <ul className="flex flex-col">
            {p.tracks.map((t) => (
              <li key={t.id} className="kd-lrow justify-between gap-3">
                <span className="flex min-w-0 flex-col"><span className="kd-hs kd-ell">{t.title}</span><span className="kd-s kd-ell">{[t.authorName, t.providerLabel].filter(Boolean).join(' · ')}</span></span>
                {t.url ? <a className="kd-nl" href={t.url} target="_blank" rel="noopener" aria-label={t.title}><ArrowSquareOutIcon size={16} aria-hidden="true" /></a> : null}
              </li>
            ))}
          </ul>
        ) : null}
        {p.status === 'published' ? <a className="kd-s underline" href={`/blog/${encodeURIComponent(p.slug)}`} target="_blank" rel="noopener">{T.view}</a> : null}
        {p.status === 'in_review' ? (
          <Field label={T.note} htmlFor="bl-note"><TextArea id="bl-note" rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        ) : null}
      </div>
    </Drawer>
  );
}
