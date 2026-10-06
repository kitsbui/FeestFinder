'use client';
/**
 * /console/featured: the shelves on Explore (shown or not, the date window, the listings in
 * order: add a live one, move up, remove); organisers' boost requests, answered by putting the
 * listing on a shelf or declining; and ads (enquiries to turn into campaigns, campaigns on or
 * off with their numbers, the CPM rates).
 */
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ArrowUpIcon, XIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang, type Pair } from '../copy';
import { count, dayMonth, money } from '../format';
import { useKd } from '../runtime';
import { Button, IconButton } from '../ui/actions';
import { FieldLabel, Input, Switch } from '../ui/forms';
import { Menu, MenuItem } from '../ui/menu';
import { Card as Panel, Status } from '../ui/parts';
import { CONSOLE } from './copy';
import { useConsole } from './root';

interface Shelf { id: string; name: Pair; enabled: boolean; startsOn: string | null; endsOn: string | null; phaseLabel: Pair; items: { id: string; title: string; startsOn: string | null }[] }
interface Boost { id: string; status: 'open' | 'done' | 'declined'; requestedAt: string; event: { id: string; title: string; startsOn: string | null }; organizer: string }
interface Ads {
  inquiries: { id: string; brand: string; category: string; email: string; budget: string | number | null; placements: string[]; message: string | null }[];
  campaigns: { id: string; brand: string; placement: string; active: boolean; impressions: number; clicks: number; spend: number }[];
  rates: { feed: number; banner: number; live: number };
}
/** Ads are sold in đồng (ad_settings rates, campaign spend). */
const ADS_CURRENCY = 'VND';

function useAct(lang: Lang, after: () => void) {
  const kd = useKd();
  return async (run: () => Promise<{ message?: Pair } | unknown>) => {
    try {
      const out = (await run()) as { message?: Pair } | undefined;
      if (out && typeof out === 'object' && 'message' in out && out.message) kd.toast(FF.text(out.message, lang));
      after();
    } catch (e) { kd.toast(FF.errorText(e, lang)); }
  };
}

export function Featured() {
  const { lang, refreshCounts } = useConsole();
  const T = pick(CONSOLE, lang);
  const [shelves, setShelves] = useState<Shelf[] | null>(null);
  const [boosts, setBoosts] = useState<Boost[] | null>(null);
  const [ads, setAds] = useState<Ads | null>(null);
  const load = useCallback(async () => {
    const [s, b, a] = await Promise.all([
      FF.maybe(FF.get('/admin/shelves'), { items: [] }), FF.maybe(FF.get('/admin/boosts'), { items: [] }), FF.maybe(FF.get('/admin/ads'), null),
    ]);
    setShelves(s.items); setBoosts(b.items); setAds(a);
    refreshCounts();
  }, [refreshCounts]);
  useEffect(() => { load(); }, [load]);
  const act = useAct(lang, load);
  const setItems = (s: Shelf, ids: string[]) => act(() => FF.put(`/admin/shelves/${s.id}/items`, { eventIds: ids }));

  return (
    <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-3 p-[clamp(16px,3vw,32px)]">
      <div className="kd-split gap-3">
        <section className="kd-main flex flex-col gap-3" aria-label={T.shelves}>
          <h2 className="kd-h">{T.shelves}</h2>
          {shelves === null ? <div className="kd-skel h-60" aria-hidden="true" /> : shelves.map((s) => (
            <Panel as="article" key={s.id} className="flex flex-col gap-3 p-5" aria-label={s.name[lang]}>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="kd-hs flex-1">{s.name[lang]}</h3>
                <span className="kd-m">{s.phaseLabel[lang]}</span>
                <Switch checked={s.enabled} label={fill(T.shelfOn, { n: s.name[lang] })} onChange={(v) => act(() => FF.patch('/admin/shelves/' + s.id, { enabled: v }))} />
              </div>
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2 kd-s">{T.shelfFrom}<Input type="date" className="kd-num" value={s.startsOn ?? ''} onChange={(e) => act(() => FF.patch('/admin/shelves/' + s.id, { startsOn: e.target.value || null }))} /></label>
                <label className="flex items-center gap-2 kd-s">{T.shelfTo}<Input type="date" className="kd-num" value={s.endsOn ?? ''} onChange={(e) => act(() => FF.patch('/admin/shelves/' + s.id, { endsOn: e.target.value || null }))} /></label>
              </div>
              <ol className="flex flex-col">
                {s.items.map((e, i) => (
                  <li key={e.id} className="flex min-h-11 items-center gap-2 border-b border-line">
                    <span className="kd-m kd-num w-5">{i + 1}</span>
                    <span className="kd-s kd-ell flex-1 text-mist">{e.title}</span>
                    {i > 0 ? <IconButton size="sm" label={fill(T.up, { t: e.title })} onClick={() => { const ids = s.items.map((x) => x.id); [ids[i - 1], ids[i]] = [ids[i], ids[i - 1]]; setItems(s, ids); }}><ArrowUpIcon size={14} aria-hidden="true" /></IconButton> : null}
                    <IconButton size="sm" label={fill(T.shelfRemove, { t: e.title })} onClick={() => setItems(s, s.items.filter((x) => x.id !== e.id).map((x) => x.id))}><XIcon size={14} aria-hidden="true" /></IconButton>
                  </li>
                ))}
              </ol>
              <AddListing lang={lang} onPick={(id) => setItems(s, [...s.items.map((x) => x.id), id])} />
            </Panel>
          ))}
          <NewShelf lang={lang} onMade={load} />
        </section>
        <section className="kd-side flex flex-col gap-3" aria-label={T.boosts}>
          <h2 className="kd-h">{T.boosts}</h2>
          <Panel className="flex flex-col px-4">
            {boosts === null ? <div className="kd-skel my-4 h-24" aria-hidden="true" /> : !boosts.length ? <span className="kd-s py-4">{T.noBoosts}</span> : boosts.map((b) => (
              <div key={b.id} className="flex flex-col gap-2 border-b border-line py-3 last:border-b-0">
                <span className="flex items-center justify-between gap-2">
                  <span className="kd-hs kd-ell">{b.event.title}</span>
                  <Status tone={b.status === 'done' ? 'ok' : b.status === 'declined' ? 'bad' : 'warn'}>{b.status === 'done' ? T.boostDone : b.status === 'declined' ? T.boostDeclined : T.boostOpen}</Status>
                </span>
                <span className="kd-s">{b.organizer}{b.event.startsOn ? ' · ' + dayMonth(b.event.startsOn, lang) : ''}</span>
                {b.status === 'open' ? (
                  <span className="flex flex-wrap gap-2">
                    <Menu
                      label={T.boostDone}
                      trigger={(p) => <button type="button" {...p} ref={p.ref} className="kd-btn kd-btn-acc kd-btn-sm">{T.boostDone}</button>}
                    >
                      {(shelves ?? []).map((s) => (
                        <MenuItem key={s.id} onSelect={() => act(async () => {
                          if (!s.items.some((x) => x.id === b.event.id)) await FF.put(`/admin/shelves/${s.id}/items`, { eventIds: [b.event.id, ...s.items.map((x) => x.id)] });
                          return FF.post('/admin/boosts/' + b.id, { status: 'done' });
                        })}>{s.name[lang]}</MenuItem>
                      ))}
                    </Menu>
                    <Button size="sm" tone="ghost" onClick={() => act(() => FF.post('/admin/boosts/' + b.id, { status: 'declined' }))}>{T.boostDecline}</Button>
                  </span>
                ) : null}
              </div>
            ))}
          </Panel>
        </section>
      </div>
      {ads ? <AdsBlock lang={lang} ads={ads} act={act} /> : null}
    </div>
  );
}

function AddListing({ lang, onPick }: { lang: Lang; onPick: (id: string) => void }) {
  const T = pick(CONSOLE, lang);
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<{ id: string; title: string }[]>([]);
  useEffect(() => {
    if (q.trim().length < 2) { setHits([]); return; }
    const t = setTimeout(async () => setHits((await FF.maybe(FF.get('/events?limit=6&q=' + encodeURIComponent(q.trim())), { items: [] })).items), 250);
    return () => clearTimeout(t);
  }, [q]);
  return (
    <div className="flex flex-col gap-1.5">
      <Input value={q} placeholder={T.shelfAddPh} aria-label={T.shelfAdd} onChange={(e) => setQ(e.target.value)} />
      {hits.length ? (
        <ul className="flex flex-col">
          {hits.map((h) => <li key={h.id}><button type="button" className="kd-mi" onClick={() => { onPick(h.id); setQ(''); }}>{h.title}</button></li>)}
        </ul>
      ) : null}
    </div>
  );
}

function NewShelf({ lang, onMade }: { lang: Lang; onMade: () => void }) {
  const T = pick(CONSOLE, lang);
  const [vi, setVi] = useState('');
  const [en, setEn] = useState('');
  const act = useAct(lang, () => { setVi(''); setEn(''); onMade(); });
  const make = (e: FormEvent) => { e.preventDefault(); act(() => FF.post('/admin/shelves', { name: { vi: vi.trim(), en: en.trim() || vi.trim() } })); };
  return (
    <Panel as="section" className="p-5" aria-label={T.shelfNew}>
      <form className="flex flex-wrap items-end gap-3" onSubmit={make}>
        <div className="flex min-w-[160px] flex-1 flex-col gap-2"><FieldLabel htmlFor="shVi">{T.shelfName}</FieldLabel><Input id="shVi" required maxLength={80} value={vi} onChange={(e) => setVi(e.target.value)} /></div>
        <div className="flex min-w-[160px] flex-1 flex-col gap-2"><FieldLabel htmlFor="shEn">{T.shelfName} (English)</FieldLabel><Input id="shEn" maxLength={80} value={en} onChange={(e) => setEn(e.target.value)} /></div>
        <Button type="submit">{T.shelfCreate}</Button>
      </form>
    </Panel>
  );
}

function AdsBlock({ lang, ads, act }: { lang: Lang; ads: Ads; act: ReturnType<typeof useAct> }) {
  const T = pick(CONSOLE, lang);
  const [rates, setRates] = useState(ads.rates);
  const m = (n: number) => money(n, ADS_CURRENCY, lang);
  return (
    <section className="flex flex-col gap-3" aria-label={T.ads} id="ads">
      <h2 className="kd-h pt-2">{T.ads}</h2>
      <div className="kd-split gap-3">
        <Panel className="kd-main flex flex-col gap-3 p-5">
          <span className="kd-m">{T.adInquiries}</span>
          {!ads.inquiries.length ? <span className="kd-s">{T.noAds}</span> : ads.inquiries.map((i) => (
            <div key={i.id} className="flex flex-col gap-1.5 border-b border-line pb-3 last:border-b-0">
              <span className="kd-hs">{i.brand}</span>
              <span className="kd-s">{[i.category, i.email, i.budget, i.placements.join(', ')].filter(Boolean).join(' · ')}</span>
              {i.message ? <span className="kd-s text-mist">{i.message}</span> : null}
              <span className="flex gap-2">
                <Button size="sm" tone="acc" onClick={() => act(() => FF.post(`/admin/ads/inquiries/${i.id}/approve`, {}))}>{T.adApprove}</Button>
                <Button size="sm" tone="ghost" onClick={() => act(() => FF.post(`/admin/ads/inquiries/${i.id}/decline`, {}))}>{T.adDecline}</Button>
              </span>
            </div>
          ))}
          <span className="kd-m pt-2">{T.adCampaigns}</span>
          {ads.campaigns.map((c) => (
            <div key={c.id} className="flex items-center gap-3 border-b border-line py-2 last:border-b-0">
              <span className="flex min-w-0 flex-1 flex-col"><span className="kd-hs">{c.brand} · {c.placement}</span><span className="kd-s kd-num">{fill(T.adLine, { i: count(c.impressions, lang), c: count(c.clicks, lang), p: m(c.spend) })}</span></span>
              <Switch checked={c.active} label={fill(T.adActive, { b: c.brand })} onChange={(v) => act(() => FF.patch('/admin/ads/campaigns/' + c.id, { active: v }))} />
            </div>
          ))}
        </Panel>
        <Panel className="kd-side flex flex-col gap-3 self-start p-5">
          <span className="kd-m">{T.rates}</span>
          <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); act(() => FF.put('/admin/ads/rates', rates)); }}>
            {(['feed', 'banner', 'live'] as const).map((k) => (
              <div key={k} className="flex flex-col gap-2"><FieldLabel htmlFor={'rate-' + k}>{k}</FieldLabel><Input id={'rate-' + k} inputMode="numeric" className="kd-num" value={String(rates[k])} onChange={(e) => setRates({ ...rates, [k]: Number(e.target.value.replace(/\D/g, '')) || 0 })} /></div>
            ))}
            <Button type="submit" className="self-start">{T.ratesSave}</Button>
          </form>
        </Panel>
      </div>
    </section>
  );
}
