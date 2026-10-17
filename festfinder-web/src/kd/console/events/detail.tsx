'use client';
/**
 * /console/events/<id>: one listing. The head has its status, its organiser and its actions
 * (public page, the queue when it waits there, duplicate, orders, take down, cancel, restore);
 * below, its numbers, then three tabs kept in the address (?tab=): the event form in team mode,
 * moderation and change history, and sources with confidence.
 */
import {
  ArrowArcLeftIcon, ArrowRightIcon, CaretLeftIcon, CopyIcon, DotsThreeIcon, EyeIcon, ReceiptIcon, SealCheckIcon, StackIcon,
} from '@phosphor-icons/react/ssr';
import { useRouter } from 'next/navigation';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang } from '../../copy';
import { count, money } from '../../format';
import { KdLink } from '../../link';
import { useKd } from '../../runtime';
import { LinkButton } from '../../ui/actions';
import { Menu, MenuItem } from '../../ui/menu';
import { Avatar, Card as Panel, Stat, StatRow } from '../../ui/parts';
import { Tabs } from '../../ui/shell';
import { ago, Body, Loaded, PageHead, Pill, qs, stamp, useLoad, useQuery } from '../kit';
import { useConsole } from '../root';
import { EVENTS } from './copy';
import { EventForm } from './form';
import { statusTone, type EventDetail as Detail } from './model';
import { ProvenanceTab } from './provenance';
import { errorLine, statusItems, useStatusActions } from './status';

export function EventDetail({ id }: { id: string }) {
  const { lang, refreshCounts } = useConsole();
  const T = pick(EVENTS, lang);
  const kd = useKd();
  const router = useRouter();
  const load = useLoad<Detail>(`/admin/events/${id}`);
  const [p, setQuery] = useQuery();
  const tab = p.get('tab') ?? 'edit';
  const { run, dialog } = useStatusActions((out) => load.setData(out));
  const duplicate = async (ev: Detail) => {
    try { const out = await FF.post(`/admin/events/${ev.id}/duplicate`); kd.toast(FF.text(out.message, lang)); router.push('/console/events/' + out.id); } catch (e) { kd.toast(errorLine(e, lang)); }
  };
  const publish = async (eid: string) => {
    try { const out = await FF.post(`/admin/events/${eid}/status`, { action: 'publish' }); kd.toast(FF.text(out.message, lang)); refreshCounts(); load.setData(out); } catch (e) { kd.toast(errorLine(e, lang)); }
  };

  return (
    <Loaded load={load}>
      {(ev) => {
        const m = ev.metrics;
        const org = ev.organizer;
        return (
          <>
            <PageHead
              eyebrow={<>
                <KdLink href="/console/events" className="kd-m inline-flex items-center gap-1 hover:text-fg-1"><CaretLeftIcon size={12} aria-hidden="true" />{T.back}</KdLink>
                <Pill tone={statusTone(ev.status)}>{ev.statusLabel[lang]}</Pill>
                {ev.featured ? <Pill tone="live">{T.featured}</Pill> : null}
                {ev.heldForReports ? <Pill tone="bad">{T.held}</Pill> : null}
              </>}
              title={ev.title}
              sub={<span className="inline-flex flex-wrap items-center gap-1.5">
                {org ? <>
                  <Avatar org name={org.name} src={org.logoUrl} size={20} />
                  <KdLink className="hover:underline" href={'/console/organizers/' + org.id}>{org.name}</KdLink>
                  {org.verified ? <SealCheckIcon size={14} weight="fill" className="text-info" aria-label={T.verifiedOrg} /> : null}
                  <span aria-hidden="true">·</span>
                </> : null}
                <span>{fill(T.createdEdited, { c: stamp(ev.createdAt, lang), e: ago(ev.updatedAt, lang) })}</span>
              </span>}
              actions={<>
                <LinkButton href={ev.publicUrl} external target="_blank" rel="noopener"><EyeIcon size={16} aria-hidden="true" />{T.publicBtn}</LinkButton>
                {ev.status === 'in_review' ? <LinkButton href={'/console?id=' + ev.id}><StackIcon size={16} aria-hidden="true" />{T.queueBtn}</LinkButton> : null}
                <Menu align="end" label={T.more} trigger={(tp) => (
                  <button type="button" {...tp} ref={tp.ref} className="kd-ib kd-ib-line" aria-label={T.more}><DotsThreeIcon size={18} weight="bold" aria-hidden="true" /></button>
                )}>
                  <MenuItem icon={<CopyIcon size={16} aria-hidden="true" />} onSelect={() => duplicate(ev)}>{T.duplicate}</MenuItem>
                  <MenuItem icon={<ReceiptIcon size={16} aria-hidden="true" />} href={'/console/orders' + qs({ event: ev.id, eventLabel: ev.title })}>{T.orders}</MenuItem>
                  {/* eslint-disable-next-line @typescript-eslint/no-misused-promises -- run catches its own errors */}
                  {statusItems(ev, run, lang, { publish: false })}
                </Menu>
              </>}
            />
            <Body>
              <StatRow>
                <Stat label={<>{T.stViews} · {fill(T.stClicks, { n: count(m.clicks, lang) })}</>} value={count(m.views, lang)} />
                <Stat label={T.stHype} value={`${count(m.hype, lang)} · ${count(m.saves, lang)}`} />
                <Stat label={ev.capacity ? `${T.stSold} · ${fill(T.stOf, { n: count(ev.capacity, lang) })}` : T.stSold} value={count(m.tickets, lang)} />
                <Stat label={m.refunded ? `${T.stGross} · ${fill(T.stRefunded, { n: m.refunded })}` : T.stGross} value={money(m.gross, ev.currency, lang)} />
                {ev.shelves.length ? <Stat label={`${T.stShelves} · ${ev.shelves.map((s) => FF.text(s.name, lang)).join(', ')}`} value={ev.shelves.length} /> : null}
              </StatRow>
              <Tabs
                label={T.tabsLabel}
                current={tab}
                onSelect={(k) => setQuery({ tab: k === 'edit' ? null : k })}
                items={[
                  { key: 'edit', label: T.tabEdit },
                  { key: 'history', label: T.tabHistory, count: ev.history.length },
                  { key: 'sources', label: T.tabSources },
                ]}
              />
              {tab === 'sources' ? <ProvenanceTab eventId={ev.id} />
                : tab === 'history' ? <History ev={ev} lang={lang} />
                : (
                  <EventForm
                    key={`${ev.id}:${ev.status}:${ev.updatedAt}`}
                    draft={ev}
                    orgName={org?.name ?? null}
                    banner={ev.status === 'rejected' ? (
                      <Panel role="status" className="flex items-center gap-2 p-4">
                        <ArrowArcLeftIcon size={18} className="text-bad" aria-hidden="true" />
                        <span className="kd-hs">{T.sentBack}</span>
                        {ev.decisions[0]?.reason ? <span className="kd-s">· {ev.decisions[0].reason[lang]}</span> : null}
                      </Panel>
                    ) : null}
                    primary={['draft', 'rejected', 'in_review'].includes(ev.status) ? { label: ev.status === 'in_review' ? T.approvePublish : T.publishNow, run: publish } : null}
                    onSaved={(out) => { if (out) load.setData(out); }}
                  />
                )}
            </Body>
            {dialog}
          </>
        );
      }}
    </Loaded>
  );
}

function History({ ev, lang }: { ev: Detail; lang: Lang }) {
  const T = pick(EVENTS, lang);
  const ok = (d: string) => ['approved', 'overturned'].includes(d);
  return (
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <Panel as="section" aria-label={T.decisions} className="flex flex-col gap-3 p-5">
        <h2 className="kd-h">{T.decisions}</h2>
        {ev.decisions.length ? (
          <ul className="flex flex-col">
            {ev.decisions.map((d) => (
              <li key={d.id} className="flex flex-col gap-1 border-t border-line-1 py-3 first:border-t-0">
                <span className="text-sm text-fg-1">
                  <span className={`kd-st ${ok(d.decision) ? 'kd-ok' : 'kd-bad'}`}><strong>{d.decision}</strong></span>
                  {d.reason ? ` · ${d.reason[lang]}` : ''} — {d.by ?? 'FeestFinder'}
                </span>
                {d.message ? <span className="kd-s whitespace-pre-wrap">{d.message}</span> : null}
                <span className="kd-m">{stamp(d.at, lang)}</span>
              </li>
            ))}
          </ul>
        ) : <p className="kd-s">{T.noDecisions}</p>}
        {ev.appeal ? <p className="kd-s border-l-2 border-line-2 pl-3">{fill(T.appeal, { s: ev.appeal.state })}{ev.appeal.reply ? ` — “${ev.appeal.reply}”` : ''}</p> : null}
      </Panel>
      <Panel as="section" aria-label={T.changeLog} className="flex flex-col gap-3 p-5">
        <h2 className="kd-h">{T.changeLog}</h2>
        {ev.history.length ? (
          <ul className="flex flex-col">
            {ev.history.map((a) => (
              <li key={a.seq} className="flex flex-col gap-1 border-t border-line-1 py-3 first:border-t-0">
                <span className="text-sm text-fg-1"><strong>{a.actor}</strong> · {a.label[lang]}</span>
                {a.diff.length ? (
                  <ul className="flex flex-col gap-0.5">
                    {a.diff.slice(0, 6).map((d, i) => (
                      <li key={i} className="kd-s kd-num flex flex-wrap items-center gap-1.5">
                        <code className="kd-m">{d.field}</code><span className="line-through decoration-line-2">{d.before}</span><ArrowRightIcon size={12} aria-hidden="true" /><span className="text-fg-1">{d.after}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <span className="kd-m">{stamp(a.at, lang)}</span>
              </li>
            ))}
          </ul>
        ) : <p className="kd-s">{T.noChanges}</p>}
      </Panel>
    </div>
  );
}
