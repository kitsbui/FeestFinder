'use client';
/**
 * /console/reports: what people reported, in four tabs kept in the address (?tab=).
 * - reports: open user reports on listings, grouped by listing and kind, most reporters (or
 *   open longest) first, with what one of them wrote; filtered by kind (?cat=). Dismiss, warn
 *   the organiser (a third strike suspends) or take the listing down, each confirmed. The last
 *   30 days by kind above them.
 * - posts: discussion posts people reported on event pages: keep, hide or delete.
 * - moments: reported photos on profiles: remove or keep.
 * - mixes: reported comments under artists' mixes: remove or keep.
 * Appeals are answered in the queue (/console?filter=appeals); the head links there.
 */
import { useMemo } from 'react';
import { ArrowSquareOutIcon, EyeIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang, type Pair } from '../copy';
import { count } from '../format';
import { useKd } from '../runtime';
import { Button, LinkButton } from '../ui/actions';
import { Card as Panel, Status, type StatusTone } from '../ui/parts';
import { Row, Table, Tabs } from '../ui/shell';
import { CONSOLE } from './copy';
import { act, Body, Choice, Empty, FilterBar, Loaded, PageHead, stamp, useAsk, useLoad, useOptions, useQuery } from './kit';
import { MOD } from './moderation/copy';
import { useConsole } from './root';

interface Photo { id: string; url: string; caption: string | null; reports: number; reasons: { key: string; label: Pair }[]; owner: { kind: string; name: string | null; href: string | null } }
interface Report { id: string; eventId: string; category: string; categoryLabel: Pair; categories: { category: string; label: Pair; count: number }[]; subject: string; eventStatus: string; heldFromFeed: boolean; count: number; quote: string | null; ageMinutes: number }
interface Reports { items: Report[]; last30Days: { category: string; label: Pair; count: number }[] }
interface MixComment {
  id: string; body: string; hidden: boolean; reports: number; createdAt: string; author: string | null;
  reasons: { key: string; label: Pair }[]; mix: { id: string; title: string; href: string; artist: string };
}
interface Post {
  id: string; body: string; kind: string; kindLabel: Pair; status: 'visible' | 'hidden'; reports: number; codes: string[]; createdAt: string;
  event: { id: string; title: string; slug: string }; author: { id: string; name: string | null };
}

type Tab = 'reports' | 'posts' | 'moments' | 'mixes';
const TABS: Tab[] = ['reports', 'posts', 'moments', 'mixes'];

const ago = (min: number, lang: Lang) => (min < 60 ? `${min} ${lang === 'vi' ? 'phút' : 'min'}` : min < 1440 ? `${Math.floor(min / 60)} ${lang === 'vi' ? 'giờ' : 'h'}` : `${Math.floor(min / 1440)} ${lang === 'vi' ? 'ngày' : 'd'}`);
/** Refund claims and safety are the serious kinds. */
const CAT_TONE: Record<string, StatusTone> = { refund: 'bad', safety: 'bad', wrong: 'warn', price: 'warn' };

export function Reports() {
  const { lang, counts } = useConsole();
  const M = pick(MOD, lang);
  const [params, setParams] = useQuery();
  const tab: Tab = TABS.includes(params.get('tab') as Tab) ? params.get('tab') as Tab : 'reports';
  return (
    <>
      <PageHead
        title={M.title}
        actions={<LinkButton size="sm" href="/console?filter=appeals">{M.appeals}{counts?.appeals ? <span className="kd-num"> · {counts.appeals}</span> : null}</LinkButton>}
      />
      <Body>
        <Tabs
          label={M.tabsLabel}
          current={tab}
          onSelect={(k) => setParams({ tab: k === 'reports' ? null : k, cat: null, sort: null })}
          items={[
            { key: 'reports', label: M.tabReports, count: counts?.reports || null },
            { key: 'posts', label: M.tabPosts },
            { key: 'moments', label: M.tabMoments },
            { key: 'mixes', label: M.tabMixComments },
          ]}
        />
        {tab === 'posts' ? <PostsTab lang={lang} /> : tab === 'moments' ? <MomentsTab lang={lang} /> : tab === 'mixes' ? <MixCommentsTab lang={lang} /> : <ReportsTab lang={lang} params={params} setParams={setParams} />}
      </Body>
    </>
  );
}

function ReportsTab({ lang, params, setParams }: { lang: Lang; params: URLSearchParams; setParams: ReturnType<typeof useQuery>[1] }) {
  const { q, refreshCounts } = useConsole();
  const T = pick(CONSOLE, lang);
  const M = pick(MOD, lang);
  const kd = useKd();
  const ask = useAsk();
  const options = useOptions();
  const load = useLoad<Reports>('/admin/reports');
  const cat = params.get('cat') ?? '';
  // A notification about a listing hidden by reports opens its case (/console/reports?event=<id>).
  const only = params.get('event');
  const sort = params.get('sort') === 'age' ? 'age' : 'count';
  const statusLabel = (s: string) => options?.statuses?.find((x: { value: string; label: Pair }) => x.value === s)?.label[lang] ?? s;
  const needle = q.trim().toLowerCase();
  const rows = useMemo(() => (load.data?.items ?? [])
    .filter((r) => (!only || r.eventId === only) && (!cat || r.categories.some((c) => c.category === cat)) && (!needle || r.subject.toLowerCase().includes(needle)))
    .sort((a, b) => (sort === 'age' ? b.ageMinutes - a.ageMinutes : b.count - a.count)), [load.data, only, cat, sort, needle]);

  const decide = async (r: Report, kind: 'dismiss' | 'warn' | 'take-down') => {
    const ok = kind === 'dismiss' ? await ask({ title: M.dismissAsk, body: M.dismissBody, confirm: T.dismiss })
      : kind === 'warn' ? await ask({ title: M.warnAsk, body: M.warnBody, confirm: M.warnGo, danger: true })
      : await ask({ title: M.takeDownTitle, body: r.subject, confirm: T.takeDown, danger: true });
    if (!ok) return;
    const out = await act(kd, lang, () => FF.post(`/admin/reports/${r.eventId}/${kind}`, {}));
    if (out) { load.reload(); refreshCounts(); }
  };

  return (
    <Loaded load={load}>
      {(data) => (
        <>
          <FilterBar onReset={cat || only ? () => setParams({ cat: null, event: null }) : null}>
            <Choice
              label={M.category}
              value={cat}
              onChange={(v) => setParams({ cat: v })}
              options={data.last30Days.map((c) => ({ value: c.category, label: c.label[lang], aside: <span className="kd-num">{data.items.filter((x) => x.categories.some((y) => y.category === c.category)).length}</span> }))}
            />
            <Choice
              label={M.sort}
              any={false}
              value={sort}
              onChange={(v) => setParams({ sort: v === 'count' ? null : v })}
              options={[{ value: 'count', label: M.sortCount }, { value: 'age', label: M.sortAge }]}
            />
            <span className="kd-m ml-auto">{T.reports30}</span>
            {data.last30Days.map((c) => <span key={c.category} className="kd-s kd-num">{c.label[lang]} {count(c.count, lang)}</span>)}
          </FilterBar>
          {!rows.length ? <Empty title={T.noReports} /> : (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(420px,100%),1fr))] items-start gap-3">
              {rows.map((r) => (
                <li key={r.id}>
                  <Panel as="article" className="flex flex-col gap-3 p-5" aria-label={r.subject}>
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="kd-m">{fill(T.reporters, { n: r.count })} · {ago(r.ageMinutes, lang)}</span>
                      <h2 className="kd-h">{r.subject}</h2>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {r.categories.map((c) => <Status key={c.category} tone={CAT_TONE[c.category] ?? 'none'}>{r.categories.length > 1 ? `${c.label[lang]} · ${c.count}` : c.label[lang]}</Status>)}
                      <Status tone={r.eventStatus === 'live' ? 'live' : r.eventStatus === 'removed' ? 'bad' : 'none'}>{statusLabel(r.eventStatus)}</Status>
                      {r.heldFromFeed ? <Status tone="warn">{T.heldFromFeed}</Status> : null}
                    </div>
                    {r.quote ? <p className="kd-s border-l-2 border-line2 pl-3 text-mist">“{r.quote}”</p> : null}
                    <div className="flex flex-wrap gap-2">
                      <LinkButton size="sm" tone="ghost" href={`/console/events/${r.eventId}`}><EyeIcon size={14} aria-hidden="true" />{M.openListing}</LinkButton>
                      <span className="flex-1" />
                      <Button size="sm" onClick={() => decide(r, 'dismiss')}>{T.dismiss}</Button>
                      <Button size="sm" onClick={() => decide(r, 'warn')}>{T.warn}</Button>
                      {r.eventStatus !== 'removed' ? <Button size="sm" tone="ghost" className="text-hot" onClick={() => decide(r, 'take-down')}>{T.takeDown}</Button> : null}
                    </div>
                  </Panel>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Loaded>
  );
}

const CODE: Record<string, keyof typeof MOD> = { spam: 'codeSpam', scalping: 'codeScalping', abuse: 'codeAbuse', drugs: 'codeDrugs', personal: 'codePersonal', other: 'codeOther' };
const POST_COLS = 'minmax(260px,2.2fr) minmax(160px,1fr) minmax(140px,1fr) 70px 100px minmax(220px,auto)';

/** Discussion posts people reported, across every event page. Three reports hide a post until someone decides. */
function PostsTab({ lang }: { lang: Lang }) {
  const M = pick(MOD, lang);
  const kd = useKd();
  const ask = useAsk();
  const { q } = useConsole();
  const load = useLoad<{ items: Post[] }>('/admin/posts/reported');
  const needle = q.trim().toLowerCase();
  const run = async (p: Post, kind: 'keep' | 'hide' | 'remove') => {
    if (kind === 'remove' && !(await ask({ title: M.removeAsk, body: p.body.slice(0, 160), confirm: M.remove, danger: true }))) return;
    const out = await act(kd, lang, () => (kind === 'keep' ? FF.post(`/admin/posts/${p.id}/dismiss`) : kind === 'remove' ? FF.del(`/posts/${p.id}`) : FF.patch(`/posts/${p.id}`, { hidden: true })));
    if (out) load.reload();
  };
  return (
    <Loaded load={load}>
      {(data) => {
        const rows = data.items.filter((p) => !needle || p.body.toLowerCase().includes(needle) || p.event.title.toLowerCase().includes(needle));
        if (!rows.length) return <Empty title={M.noPosts} />;
        return (
          <Table cols={POST_COLS} label={M.tabPosts} head={[M.colPost, M.colEvent, M.colWhy, M.colReports, M.colStatus, '']}>
            {rows.map((p) => (
              <Row key={p.id} cols={POST_COLS} className="py-3">
                <span role="cell" className="flex min-w-0 flex-col gap-1">
                  <span className="text-sm text-paper">“{p.body}”</span>
                  <span className="kd-s">{p.author.name || M.member} · {p.kindLabel[lang]} · {stamp(p.createdAt, lang)}</span>
                </span>
                <span role="cell" className="min-w-0">
                  <a className="kd-s inline-flex items-center gap-1 hover:underline" href={`/e/${p.event.slug}#thao-luan`} target="_blank" rel="noopener">
                    <span className="kd-ell">{p.event.title}</span><ArrowSquareOutIcon size={12} aria-hidden="true" />
                  </a>
                </span>
                <span role="cell" className="flex flex-wrap gap-x-3 gap-y-1">
                  {p.codes.map((c) => <Status key={c} tone={c === 'scalping' || c === 'drugs' ? 'bad' : 'warn'}>{CODE[c] ? M[CODE[c]] : c}</Status>)}
                </span>
                <span role="cell" className="kd-num text-paper">{p.reports}</span>
                <span role="cell">{p.status === 'hidden' ? <Status tone="bad">{M.hidden}</Status> : <Status tone="ok">{M.visible}</Status>}</span>
                <span role="cell" className="flex flex-wrap justify-end gap-2">
                  <Button size="sm" onClick={() => run(p, 'keep')}>{M.keep}</Button>
                  {p.status === 'hidden' ? null : <Button size="sm" onClick={() => run(p, 'hide')}>{M.hide}</Button>}
                  <Button size="sm" tone="ghost" className="text-hot" onClick={() => run(p, 'remove')}>{M.remove}</Button>
                </span>
              </Row>
            ))}
          </Table>
        );
      }}
    </Loaded>
  );
}

function MomentsTab({ lang }: { lang: Lang }) {
  const { refreshCounts } = useConsole();
  const T = pick(CONSOLE, lang);
  const M = pick(MOD, lang);
  const kd = useKd();
  const load = useLoad<{ items: Photo[] }>('/admin/moments/reports');
  const decide = async (id: string, verdict: 'remove' | 'keep') => {
    if (await act(kd, lang, () => FF.post(`/admin/moments/${id}/${verdict}`))) { load.reload(); refreshCounts(); }
  };
  return (
    <section className="flex flex-col gap-3" aria-label={T.photoReports}>
      <Loaded load={load}>
        {(data) => !data.items.length ? <Empty title={M.noPhotos} /> : (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] gap-3">
            {data.items.map((p) => (
              <li key={p.id}>
                <Panel as="article" className="flex h-full flex-col overflow-hidden" aria-label={p.caption || p.url}>
                  { }
                  <img src={p.url} alt={p.caption ?? ''} className="aspect-square w-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    {p.caption ? <span className="kd-hs">{p.caption}</span> : null}
                    <span className="kd-s">{p.owner.href ? <a className="hover:underline" href={p.owner.href}>{fill(T.photoOn, { n: p.owner.name ?? '' })}</a> : T.photoFan}</span>
                    <span className="kd-m">{p.reasons.map((r) => r.label[lang]).join(' · ')} · {fill(T.reporters, { n: p.reports })}</span>
                    <div className="mt-auto flex gap-2 pt-1">
                      <Button size="sm" onClick={() => decide(p.id, 'remove')}>{T.photoRemove}</Button>
                      <Button size="sm" tone="ghost" onClick={() => decide(p.id, 'keep')}>{T.photoKeep}</Button>
                    </div>
                  </div>
                </Panel>
              </li>
            ))}
          </ul>
        )}
      </Loaded>
    </section>
  );
}

const MIX_COLS = 'minmax(260px,2.2fr) minmax(180px,1fr) minmax(140px,1fr) 70px 100px minmax(160px,auto)';

/** Comments people reported under artists' mixes. Three reports hide one until someone decides. */
function MixCommentsTab({ lang }: { lang: Lang }) {
  const M = pick(MOD, lang);
  const kd = useKd();
  const load = useLoad<{ items: MixComment[] }>('/admin/mix-comments/reported');
  const decide = async (id: string, verdict: 'remove' | 'keep') => {
    if (await act(kd, lang, () => FF.post(`/admin/mix-comments/${id}/${verdict}`))) load.reload();
  };
  return (
    <Loaded load={load}>
      {(data) => !data.items.length ? <Empty title={M.noMixComments} /> : (
        <Table cols={MIX_COLS} label={M.tabMixComments} head={[M.colComment, M.colMix, M.colWhy, M.colReports, M.colStatus, '']}>
          {data.items.map((c) => (
            <Row key={c.id} cols={MIX_COLS} className="py-3">
              <span role="cell" className="flex min-w-0 flex-col gap-1">
                <span className="text-sm text-paper">“{c.body}”</span>
                <span className="kd-s">{c.author || M.member} · {stamp(c.createdAt, lang)}</span>
              </span>
              <span role="cell" className="min-w-0">
                <a className="kd-s inline-flex items-center gap-1 hover:underline" href={c.mix.href} target="_blank" rel="noopener">
                  <span className="kd-ell">{c.mix.artist} · {c.mix.title}</span><ArrowSquareOutIcon size={12} aria-hidden="true" />
                </a>
              </span>
              <span role="cell" className="flex flex-wrap gap-x-3 gap-y-1">{c.reasons.map((r) => <Status key={r.key} tone="warn">{r.label[lang]}</Status>)}</span>
              <span role="cell" className="kd-num text-paper">{c.reports}</span>
              <span role="cell">{c.hidden ? <Status tone="bad">{M.hidden}</Status> : <Status tone="ok">{M.visible}</Status>}</span>
              <span role="cell" className="flex flex-wrap justify-end gap-2">
                <Button size="sm" onClick={() => decide(c.id, 'keep')}>{M.keepComment}</Button>
                <Button size="sm" tone="ghost" className="text-hot" onClick={() => decide(c.id, 'remove')}>{M.remove}</Button>
              </span>
            </Row>
          ))}
        </Table>
      )}
    </Loaded>
  );
}
