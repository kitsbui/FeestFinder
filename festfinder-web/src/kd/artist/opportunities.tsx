'use client';
/**
 * /studio/artist/opportunities: open gigs, best fit first (a fixed score from styles, place,
 * kind of gig, dates and booking status; never followers), to apply to with a message; and
 * brand campaigns for an artist open to brands (?tab=brands, linked from notifications); and
 * projects looking for artists (?tab=projects), offered to from the project's own page.
 * /ops kept applications, requests and dates here too (?tab=mine|requests|dates): those links
 * now open the same tab of /studio/artist/gigs.
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FF } from '@/runtime/ff';
import { pick, type Lang, type Pair } from '../copy';
import { dayMonth } from '../format';
import { KdLink } from '../link';
import { useKd } from '../runtime';
import { Button, LinkButton } from '../ui/actions';
import { TextArea } from '../ui/forms';
import { Status } from '../ui/parts';
import { Sheet } from '../ui/sheet';
import { Row, Table, Tabs } from '../ui/shell';
import { act, Body, Empty, Field, Loaded, PageHead, useLoad, useQuery } from '../console/kit';
import { ARTIST } from './copy';
import { Block, closesText, feeText, statusOf } from './parts';
import { useArtist } from './root';

type Tab = 'open' | 'brands' | 'projects';
const MOVED = ['mine', 'requests', 'dates'];

interface Gig {
  id: string; title: string; description: string; startsOn: string; cityLabel: Pair | null; gigType: { label: Pair } | null; setLength: { label: Pair } | null;
  feeMin: number | null; feeMax: number | null; currency: string; travelCovered: boolean; closesOn: string | null;
  organizer?: { slug: string; name: string; verified: boolean }; match: { score: number; unavailable?: boolean } | null; applied: string | null;
}
interface Campaign {
  id: string; brandName: string; title: string; brief: string; cities: { slug: string; label: Pair | null }[]; feeMin: number | null; feeMax: number | null;
  currency: string; closesOn: string | null; interest: string | null;
}

export function ArtistOpportunities() {
  const { lang } = useArtist();
  const T = pick(ARTIST, lang);
  const router = useRouter();
  const [params, setParams] = useQuery();
  const asked = params.get('tab');
  useEffect(() => { if (asked && MOVED.includes(asked)) router.replace('/studio/artist/gigs?tab=' + asked); }, [asked, router]);
  const tab: Tab = asked === 'brands' || asked === 'projects' ? asked : 'open';
  return (
    <>
      <PageHead title={T.opportunities} />
      <Body>
        <Tabs
          label={T.opportunities}
          current={tab}
          onSelect={(k) => setParams({ tab: k === 'open' ? null : k })}
          items={[{ key: 'open', label: T.tabOpen }, { key: 'brands', label: T.tabBrands }, { key: 'projects', label: T.tabProjects }]}
        />
        {tab === 'brands' ? <Brands lang={lang} /> : tab === 'projects' ? <Projects lang={lang} /> : <Open lang={lang} />}
      </Body>
    </>
  );
}

// ---- open gigs ----------------------------------------------------------------------------

const OPEN_COLS = 'minmax(260px,2fr) minmax(70px,auto) minmax(160px,1fr) minmax(120px,auto)';

function Open({ lang }: { lang: Lang }) {
  const T = pick(ARTIST, lang);
  const kd = useKd();
  const load = useLoad<{ items: Gig[] }>('/gigs');
  const [applying, setApplying] = useState<Gig | null>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const send = async () => {
    if (!applying) return;
    setBusy(true);
    const ok = await act(kd, lang, () => FF.post(`/gigs/${applying.id}/apply`, { message: msg.trim() }));
    setBusy(false);
    if (ok) { setApplying(null); setMsg(''); load.reload(); }
  };
  return (
    <>
      <Loaded load={load}>
        {({ items }) => !items.length ? <Empty title={T.noOpen} /> : (
          <Table cols={OPEN_COLS} label={T.tabOpen} head={[T.gig, T.fit, T.fee, '']}>
            {items.map((g) => {
              const st = g.applied ? statusOf(g.applied, lang) : null;
              return (
                <Row key={g.id} cols={OPEN_COLS} className="py-3">
                  <span role="cell" className="flex min-w-0 flex-col gap-0.5">
                    <span className="kd-hs kd-ell">{g.title}</span>
                    <span className="kd-s kd-num">
                      {g.organizer ? <><KdLink className="hover:underline" href={'/o/' + g.organizer.slug}>{g.organizer.name}</KdLink> · </> : null}
                      {[dayMonth(g.startsOn, lang), g.cityLabel?.[lang], g.gigType?.label[lang], g.setLength?.label[lang], g.travelCovered ? T.travelCovered : null, g.closesOn ? closesText(g.closesOn, lang) : null].filter(Boolean).join(' · ')}
                    </span>
                    {g.description ? <span className="kd-s line-clamp-2 whitespace-pre-line">{g.description}</span> : null}
                  </span>
                  <span role="cell" className="kd-num text-right text-fg-1" title={g.match?.unavailable ? T.busyThatDay : undefined}>
                    {g.match ? `${g.match.score}/100` : '—'}
                    {g.match?.unavailable ? <span className="sr-only"> · {T.busyThatDay}</span> : null}
                  </span>
                  <span role="cell" className="kd-num text-right">{feeText(g.feeMin, g.feeMax, g.currency, lang)}</span>
                  <span role="cell" className="flex justify-end">
                    {st ? <Status tone={st.tone}>{st.label}</Status> : <Button size="sm" tone="acc" aria-label={`${T.apply} · ${g.title}`} onClick={() => { setMsg(''); setApplying(g); }}>{T.apply}</Button>}
                  </span>
                </Row>
              );
            })}
          </Table>
        )}
      </Loaded>
      {applying ? (
        <Sheet title={applying.title} closeLabel={T.close} onClose={() => setApplying(null)}>
          <div className="flex flex-col gap-4 pt-1">
            <span className="kd-s kd-num">{[applying.organizer?.name, dayMonth(applying.startsOn, lang), applying.cityLabel?.[lang], feeText(applying.feeMin, applying.feeMax, applying.currency, lang)].filter(Boolean).join(' · ')}</span>
            <Field label={<>{T.message} <span className="font-normal text-fg-3">{T.optional}</span></>} htmlFor="op-msg">
              <TextArea id="op-msg" rows={4} maxLength={2000} value={msg} onChange={(e) => setMsg(e.target.value)} />
            </Field>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setApplying(null)}>{T.cancel}</Button>
              <Button tone="acc" disabled={busy} onClick={send}>{T.sendApplication}</Button>
            </div>
          </div>
        </Sheet>
      ) : null}
    </>
  );
}

// ---- brand campaigns ----------------------------------------------------------------------

const BRAND_COLS = 'minmax(280px,2fr) minmax(160px,1fr) minmax(120px,auto)';

function Brands({ lang }: { lang: Lang }) {
  const T = pick(ARTIST, lang);
  const kd = useKd();
  const load = useLoad<{ openToBrands: boolean; items: Campaign[] }>('/brand-campaigns');
  const mine = useLoad<{ items: { id: string; status: string; campaign: Campaign }[] }>('/me/artist/brand-interests');
  const [writing, setWriting] = useState<Campaign | null>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const send = async () => {
    if (!writing) return;
    setBusy(true);
    const ok = await act(kd, lang, () => FF.post(`/brand-campaigns/${writing.id}/interest`, { message: msg.trim() }));
    setBusy(false);
    if (ok) { setWriting(null); setMsg(''); load.reload(); mine.reload(); }
  };
  const picked = (mine.data?.items ?? []).filter((i) => i.status === 'selected');
  return (
    <>
      <Loaded load={load}>
        {(data) => !data.openToBrands ? (
          <Empty title={T.brandsOff}><LinkButton size="sm" href="/studio/artist">{T.toProfile}</LinkButton></Empty>
        ) : !data.items.length ? <Empty title={T.noCampaigns} /> : (
          <Table cols={BRAND_COLS} label={T.tabBrands} head={[T.campaign, T.fee, '']}>
            {data.items.map((c) => {
              const st = c.interest ? statusOf(c.interest, lang) : null;
              const name = `${c.brandName} · ${c.title}`;
              return (
                <Row key={c.id} cols={BRAND_COLS} className="py-3">
                  <span role="cell" className="flex min-w-0 flex-col gap-0.5">
                    <span className="kd-hs">{name}</span>
                    <span className="kd-s kd-num">{[c.cities.map((x) => x.label?.[lang] ?? x.slug).join(', '), c.closesOn ? closesText(c.closesOn, lang) : null].filter(Boolean).join(' · ')}</span>
                    {c.brief ? <span className="kd-s whitespace-pre-line">{c.brief}</span> : null}
                  </span>
                  <span role="cell" className="kd-num text-right">{feeText(c.feeMin, c.feeMax, c.currency, lang)}</span>
                  <span role="cell" className="flex justify-end">
                    {st ? <Status tone={st.tone}>{st.label}</Status> : <Button size="sm" tone="acc" aria-label={`${T.interested} · ${name}`} onClick={() => { setMsg(''); setWriting(c); }}>{T.interested}</Button>}
                  </span>
                </Row>
              );
            })}
          </Table>
        )}
      </Loaded>
      {picked.length ? (
        <Block title={T.pickedYou}>
          <ul className="flex flex-col">
            {picked.map((i) => <li key={i.id} className="kd-lrow min-h-11"><span className="kd-hs">{i.campaign.brandName} · {i.campaign.title}</span></li>)}
          </ul>
        </Block>
      ) : null}
      {writing ? (
        <Sheet title={`${writing.brandName} · ${writing.title}`} closeLabel={T.close} onClose={() => setWriting(null)}>
          <div className="flex flex-col gap-4 pt-1">
            <Field label={<>{T.message} <span className="font-normal text-fg-3">{T.optional}</span></>} htmlFor="br-msg">
              <TextArea id="br-msg" rows={4} maxLength={2000} value={msg} onChange={(e) => setMsg(e.target.value)} />
            </Field>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setWriting(null)}>{T.cancel}</Button>
              <Button tone="acc" disabled={busy} onClick={send}>{T.send}</Button>
            </div>
          </div>
        </Sheet>
      ) : null}
    </>
  );
}

// ---- projects looking for artists ---------------------------------------------------------

interface ProjectRow { id: string; slug: string; title: string; pitch: string; city: { label: Pair | null }; targetOn: string | null; styles: { key: string; label: Pair }[] }
const PROJECT_COLS = 'minmax(260px,2fr) minmax(160px,1fr) minmax(120px,auto)';

function Projects({ lang }: { lang: Lang }) {
  const T = pick(ARTIST, lang);
  const load = useLoad<{ items: ProjectRow[] }>('/projects?seeking=artists&limit=60');
  return (
    <Loaded load={load}>
      {({ items }) => !items.length ? <Empty title={T.noProjects} /> : (
        <Table cols={PROJECT_COLS} label={T.tabProjects} head={[T.project, T.styles, '']}>
          {items.map((p) => (
            <Row key={p.id} cols={PROJECT_COLS} className="py-3">
              <span role="cell" className="flex min-w-0 flex-col gap-0.5">
                <span className="kd-hs kd-ell">{p.title}</span>
                <span className="kd-s kd-num">{[p.city.label?.[lang], p.targetOn ? dayMonth(p.targetOn, lang) : null].filter(Boolean).join(' · ')}</span>
                {p.pitch ? <span className="kd-s line-clamp-2">{p.pitch}</span> : null}
              </span>
              <span role="cell" className="kd-s kd-ell">{p.styles.map((s) => s.label[lang]).join(', ')}</span>
              <span role="cell" className="flex justify-end"><LinkButton size="sm" tone="acc" href={'/p/' + encodeURIComponent(p.slug)}>{T.offerToPlay}</LinkButton></span>
            </Row>
          ))}
        </Table>
      )}
    </Loaded>
  );
}
