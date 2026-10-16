'use client';
/**
 * /studio/events: every listing the organiser has, by status (draft, in review, live, sent
 * back, ended), with what each one still needs. Filters live in the address (?status=, ?q=,
 * ?when=, ?sort=), so "my drafts" or "sent back" can be bookmarked. Each row opens the editor
 * (/studio/events/<id>) and has its actions: submit, appeal, duplicate, view the public page,
 * delete a draft.
 */
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DotsThreeIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang } from '../copy';
import { cx } from '../cx';
import { count, dayMonth } from '../format';
import { KdLink } from '../link';
import { useKd } from '../runtime';
import { buttonClass } from '../ui/actions';
import { Menu, MenuItem, MenuSeparator } from '../ui/menu';
import { Card as Panel, Status } from '../ui/parts';
import { Row, Table, Tabs } from '../ui/shell';
import { act, ago, Choice, Empty, FilterBar, SearchField, useAsk, useQuery } from '../console/kit';
import { STUDIO } from './copy';
import { statusTone } from './head';
import { Page } from './parts';
import { isPast, useStudio, type OrgEvent } from './root';

type Tab = 'all' | 'draft' | 'in_review' | 'live' | 'rejected' | 'past';
const TABS: Tab[] = ['all', 'draft', 'in_review', 'live', 'rejected', 'past'];

/** What submit still needs (the API's missingForSubmit keys), as the wizard names them. */
export const MISSING_KEY: Record<string, keyof typeof STUDIO> = {
  title: 'mTitle', genre: 'mGenre', dates: 'mDates', venue: 'mVenue', price: 'mPrice', logo: 'mLogo', eventUrl: 'mEventUrl',
};
export const missingText = (keys: string[], lang: Lang) => keys.map((k) => (MISSING_KEY[k] ? STUDIO[MISSING_KEY[k]][lang] : k)).join(', ');

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase();
const ended = (e: OrgEvent) => e.status === 'live' && isPast(e);

export function EventsList() {
  const { lang, events, reload } = useStudio();
  const T = pick(STUDIO, lang);
  const kd = useKd();
  const ask = useAsk();
  const router = useRouter();
  const [params, setParams] = useQuery();
  const status = (TABS.includes(params.get('status') as Tab) ? params.get('status') : 'all') as Tab;
  const q = params.get('q') ?? '';
  const when = params.get('when') ?? '';
  const sort = params.get('sort') ?? 'date';

  const counts = useMemo(() => {
    const c: Record<Tab, number> = { all: events.length, draft: 0, in_review: 0, live: 0, rejected: 0, past: 0 };
    for (const e of events) {
      if (ended(e)) c.past++;
      else if (e.status in c) c[e.status as Tab]++;
    }
    return c;
  }, [events]);
  const rows = useMemo(() => events
    .filter((e) => status === 'all' || (status === 'past' ? ended(e) : e.status === status && !ended(e)))
    .filter((e) => !q || fold(`${e.title} ${e.venueName ?? ''} ${e.area ?? ''}`).includes(fold(q)))
    .filter((e) => !when || (when === 'upcoming' ? !!e.startsOn && !isPast(e) : when === 'past' ? isPast(e) : !e.startsOn))
    .sort((a, b) => (sort === 'updated' ? String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? ''))
      : sort === 'quality' ? (b.qualityScore ?? 0) - (a.qualityScore ?? 0) : 0)), [events, status, q, when, sort]);

  const submit = async (e: OrgEvent) => {
    try {
      const out = await FF.post(`/organizer/events/${e.id}/submit`);
      kd.toast(FF.text(out.message, lang));
      void reload();
    } catch (x) {
      const miss = (x as { details?: { missing?: string[] } }).details?.missing;
      kd.toast(miss ? fill(T.stillMissing, { m: missingText(miss, lang) }) : FF.errorText(x, lang));
    }
  };
  const duplicate = async (e: OrgEvent) => {
    const out = await act(kd, lang, () => FF.post(`/organizer/events/${e.id}/duplicate`));
    if (out?.id) { await reload(); router.push('/studio/events/' + out.id); }
  };
  const appeal = async (e: OrgEvent) => {
    const ok = await ask({ title: T.appeal, body: e.title, note: 'required', noteLabel: T.appealPh, confirm: T.appealSend });
    if (!ok) return;
    if (ok.note.length < 10) { kd.toast(T.appealRule); return; }
    await act(kd, lang, () => FF.post(`/organizer/events/${e.id}/appeal`, { reply: ok.note }));
  };
  const remove = async (e: OrgEvent) => {
    if (!(await ask({ title: T.deleteDraftAsk, body: e.title, confirm: T.deleteDraft, danger: true }))) return;
    if (await act(kd, lang, () => FF.del(`/organizer/events/${e.id}`))) { kd.toast(T.deleted); void reload(); }
  };

  const labels: Record<Tab, string> = { all: T.evAll, draft: T.evDrafts, in_review: T.evReview, live: T.evLive, rejected: T.evRejected, past: T.evEnded };
  const filtered = !!(q || when);
  const year = FF.now().toISOString().slice(0, 4);
  const cols = 'minmax(64px,80px) minmax(220px,2.4fr) minmax(170px,1.3fr) 76px minmax(120px,1fr) 104px 52px';

  return (
    <Page>
      <h1 className="kd-d2 pb-1">{T.myEvents}</h1>
      <Tabs label={T.myEvents} current={status} onSelect={(k) => setParams({ status: k === 'all' ? null : k })} items={TABS.map((k) => ({ key: k, label: labels[k], count: counts[k] }))} />
      <FilterBar onReset={filtered ? () => setParams({ q: null, when: null }) : null}>
        <SearchField label={T.evSearch} value={q} onChange={(v) => setParams({ q: v })} />
        <Choice label={T.evWhen} value={when} onChange={(v) => setParams({ when: v })} options={[
          { value: 'upcoming', label: T.evUpcoming }, { value: 'past', label: T.evPast }, { value: 'undated', label: T.evUndated },
        ]} />
        <Choice label={T.evSort} any={false} value={sort} onChange={(v) => setParams({ sort: v === 'date' ? null : v })} options={[
          { value: 'date', label: T.sortDate }, { value: 'updated', label: T.sortUpdated }, { value: 'quality', label: T.sortQuality },
        ]} />
      </FilterBar>

      {!rows.length ? (
        events.length
          ? <Empty title={T.noMatchEvents}><button type="button" className={buttonClass({ size: 'sm' })} onClick={() => setParams({ q: null, when: null, status: null })}>{T.showAll}</button></Empty>
          : <Empty title={T.noEvents}><KdLink className={buttonClass({ size: 'sm' })} href="/studio/new">{T.createEvent}</KdLink></Empty>
      ) : (
        <Panel className="overflow-x-auto">
          <div className="min-w-[960px]">
            <Table cols={cols} label={T.myEvents} head={[T.colDate, T.colEvent, T.colStatus, T.colQuality, T.colPerf, T.colUpdated, '']}>
              {rows.map((e) => {
                const past = ended(e);
                const canSubmit = (e.status === 'draft' || e.status === 'rejected') && !e.missing?.length;
                return (
                  <Row key={e.id} cols={cols} className={cx(past && 'opacity-70')}>
                    <span role="cell" className="kd-mb kd-num">
                      {e.startsOn ? <>{dayMonth(e.startsOn, lang)}{e.startsOn.slice(0, 4) !== year ? <span className="kd-s block">{e.startsOn.slice(0, 4)}</span> : null}</> : <span className="kd-s">{T.noDateCell}</span>}
                    </span>
                    <span role="cell" className="flex min-w-0 flex-col gap-0.5">
                      <KdLink className="kd-hs kd-ell hover:underline" href={'/studio/events/' + e.id}>{e.title}</KdLink>
                      <span className="kd-s kd-ell">{e.meta[lang]}</span>
                    </span>
                    <span role="cell" className="flex min-w-0 flex-col gap-1">
                      <Status tone={past ? 'none' : statusTone(e.status)}>{past ? T.evEnded : e.statusLabel[lang]}</Status>
                      {e.status === 'rejected' && e.lastDecision?.reason ? <span className="kd-s text-hot">{e.lastDecision.reason[lang]}</span> : null}
                      {(e.status === 'draft' || e.status === 'rejected')
                        ? (e.missing?.length ? <span className="kd-s">{fill(T.missingList, { m: missingText(e.missing, lang) })}</span> : <span className="kd-s text-ok">{T.readyToSubmit}</span>)
                        : null}
                      {e.status === 'in_review' && e.submittedAt ? <span className="kd-s">{fill(T.submittedAgo, { t: ago(e.submittedAt, lang) })}</span> : null}
                    </span>
                    <span role="cell" className="kd-mb kd-num">{e.qualityScore ?? '—'}</span>
                    <span role="cell" className="kd-s kd-num">{e.views == null ? T.notLiveYet : `${count(e.views, lang)} · ${count(e.saves ?? 0, lang)} · ${count(e.clicks ?? 0, lang)}`}</span>
                    <span role="cell" className="kd-s kd-num">{ago(e.updatedAt, lang)}</span>
                    <span role="cell" className="flex justify-end">
                      <Menu label={fill(T.actions, { n: e.title })} align="end" width={240} trigger={(p) => (
                        <button type="button" {...p} ref={p.ref} className="kd-ib kd-ib-sm" aria-label={fill(T.actions, { n: e.title })}><DotsThreeIcon size={18} aria-hidden="true" /></button>
                      )}>
                        <MenuItem href={'/studio/events/' + e.id}>{T.openEdit}</MenuItem>
                        {canSubmit ? <MenuItem onSelect={() => submit(e)}>{e.status === 'rejected' ? T.resubmitShort : T.submit}</MenuItem> : null}
                        {e.status === 'rejected' ? <MenuItem onSelect={() => appeal(e)}>{T.appeal}</MenuItem> : null}
                        <MenuItem onSelect={() => duplicate(e)}>{T.duplicate}</MenuItem>
                        {e.status === 'live' ? <MenuItem href={'/e/' + e.slug}>{T.viewEventPage}</MenuItem> : null}
                        {e.status === 'draft' ? <><MenuSeparator /><MenuItem onSelect={() => remove(e)}>{T.deleteDraft}</MenuItem></> : null}
                      </Menu>
                    </span>
                  </Row>
                );
              })}
            </Table>
          </div>
        </Panel>
      )}
    </Page>
  );
}
