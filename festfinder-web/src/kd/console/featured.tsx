'use client';
/**
 * /console/featured: the shelves on Explore, each with its VI/EN name (edited in place), its
 * phase, shown or not, the date window (or none), and the listings in order, changed on a
 * local copy (add a live upcoming one, up, down, remove) and saved as a whole; organisers'
 * boost requests, answered by putting the listing on a shelf or declining; and ads (enquiries
 * to turn into campaigns, campaigns on or off with their numbers, the CPM rates).
 */
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { CaretDownIcon, CaretUpIcon, FloppyDiskIcon, XIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang, type Pair } from '../copy';
import { count, dayMonth, money, todayIn, whenShort } from '../format';
import { useKd } from '../runtime';
import { Button, Chip, IconButton } from '../ui/actions';
import { FieldLabel, Input, Switch } from '../ui/forms';
import { Menu, MenuItem } from '../ui/menu';
import { Art, Card as Panel, Status, type StatusTone } from '../ui/parts';
import { CONSOLE } from './copy';
import { act as run, AsyncPick, Body, Empty, ErrorBox, Loading, PageHead, type PickItem } from './kit';
import { MOD } from './moderation/copy';
import { useConsole } from './root';

/** A listing on a shelf: what /admin/shelves and /admin/events both give. */
interface Item { id: string; title: string; coverUrl: string | null; startsOn: string | null; endsOn?: string | null; venue?: { name: string | null } | null; venueName?: string | null }
interface Shelf {
  id: string; name: Pair; enabled: boolean; startsOn: string | null; endsOn: string | null;
  phase: 'live' | 'always' | 'scheduled' | 'ended' | 'off'; phaseLabel: Pair; items: Item[];
}
interface Boost {
  id: string; status: 'open' | 'approved' | 'done' | 'declined'; requestedAt: string; event: { id: string; title: string; startsOn: string | null }; organizer: string;
  placements: { key: string; label: Pair }[]; budget: number | null; currency: string; startsOn: string | null; endsOn: string | null; message: string | null; reply: string | null;
}
interface Inquiry {
  id: string; brand: string; category: string; categoryLabel: Pair | null; email: string; budget: string | null; budgetAmount: number | null; currency: string;
  placements: string[]; placementLabels: Pair[]; message: string | null; logoUrl: string | null; website: string | null; links: Record<string, string>;
  productImages: string[]; description: string | null; contactName: string | null; phone: string | null; startsOn: string | null; endsOn: string | null;
  isAlcohol: boolean; cities: { slug: string; label: Pair | null }[];
}
interface Ads {
  inquiries: Inquiry[];
  campaigns: { id: string; brand: string; placement: string; active: boolean; impressions: number; clicks: number; spend: number }[];
  rates: { feed: number; banner: number; live: number };
}
/** Ads are sold in đồng (ad_settings rates, campaign spend). */
const ADS_CURRENCY = 'VND';
const PHASE_TONE: Record<Shelf['phase'], StatusTone> = { live: 'live', always: 'ok', scheduled: 'warn', ended: 'none', off: 'none' };

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

/** 'YYYY-MM-DD' plus whole days. */
const addDays = (iso: string, n: number) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};

export function Featured() {
  const { lang, refreshCounts } = useConsole();
  const T = pick(CONSOLE, lang);
  const M = pick(MOD, lang);
  const [shelves, setShelves] = useState<Shelf[] | null>(null);
  const [shelfError, setShelfError] = useState<unknown>(null);
  const [boosts, setBoosts] = useState<Boost[] | null>(null);
  const [ads, setAds] = useState<Ads | null>(null);
  const load = useCallback(async () => {
    const [s, b, a] = await Promise.all([
      FF.get('/admin/shelves').then((x: { items: Shelf[] }) => { setShelfError(null); return x.items; }, (e: unknown) => { setShelfError(e); return null; }),
      FF.maybe(FF.get('/admin/boosts'), { items: [] }), FF.maybe(FF.get('/admin/ads'), null),
    ]);
    if (s) setShelves(s);
    setBoosts(b.items); setAds(a);
    refreshCounts();
  }, [refreshCounts]);
  useEffect(() => { void load(); }, [load]);
  // eslint-disable-next-line @typescript-eslint/no-misused-promises -- load catches its own errors
  const act = useAct(lang, load);
  const replace = (out: Shelf) => setShelves((all) => (all ?? []).map((x) => (x.id === out.id ? out : x)));

  return (
    <>
      <PageHead title={M.featuredTitle} />
      <Body>
        <div className="kd-split gap-3">
          <section className="kd-main flex flex-col gap-3" aria-label={T.shelves}>
            <h2 className="kd-h">{T.shelves}</h2>
            {shelfError && !shelves ? <ErrorBox error={shelfError} retry={load} />
              : shelves === null ? <Loading className="h-60" />
              : !shelves.length ? <Empty title={M.noShelves} />
              : shelves.map((s) => <ShelfCard key={s.id} lang={lang} shelf={s} onChange={replace} />)}
            <NewShelf lang={lang} onMade={(s) => setShelves((all) => [...(all ?? []), s])} />
          </section>
          <section className="kd-side flex flex-col gap-3" aria-label={T.boosts}>
            <h2 className="kd-h">{T.boosts}</h2>
            <Panel className="flex flex-col px-4">
              {boosts === null ? <div className="kd-skel my-4 h-24" aria-hidden="true" /> : !boosts.length ? <span className="kd-s py-4">{T.noBoosts}</span>
                : boosts.map((b) => <BoostRow key={b.id} lang={lang} b={b} shelves={shelves ?? []} act={act} />)}
            </Panel>
          </section>
        </div>
        {ads ? <AdsBlock lang={lang} ads={ads} act={act} /> : null}
      </Body>
    </>
  );
}

/** An organiser's advertising request: what they asked for, and the answer with a reply. */
function BoostRow({ lang, b, shelves, act }: { lang: Lang; b: Boost; shelves: Shelf[]; act: ReturnType<typeof useAct> }) {
  const T = pick(CONSOLE, lang);
  const [reply, setReply] = useState('');
  const yes = b.status === 'approved' || b.status === 'done';
  const answer = (status: 'approved' | 'declined') => FF.post('/admin/boosts/' + b.id, { status, reply: reply.trim() || undefined });
  return (
    <div className="flex flex-col gap-2 border-b border-line-1 py-3 last:border-b-0">
      <span className="flex items-center justify-between gap-2">
        <span className="kd-hs kd-ell">{b.event.title}</span>
        <Status tone={yes ? 'ok' : b.status === 'declined' ? 'bad' : 'warn'}>{yes ? T.boostApproved : b.status === 'declined' ? T.boostDeclined : T.boostOpen}</Status>
      </span>
      <span className="kd-s">{b.organizer}{b.event.startsOn ? ' · ' + dayMonth(b.event.startsOn, lang) : ''}</span>
      {b.placements.length || b.budget != null ? (
        <span className="kd-s kd-num">
          {[b.placements.map((p) => p.label[lang]).join(', '), b.budget != null ? money(b.budget, b.currency, lang) : null, b.startsOn && b.endsOn ? `${dayMonth(b.startsOn, lang)} – ${dayMonth(b.endsOn, lang)}` : null].filter(Boolean).join(' · ')}
        </span>
      ) : null}
      {b.message ? <span className="kd-s text-fg-2">“{b.message}”</span> : null}
      {b.reply ? <span className="kd-s text-fg-2">↳ {b.reply}</span> : null}
      {b.status === 'open' ? (
        <>
          <Input aria-label={T.replyPh} placeholder={T.replyPh} maxLength={1000} value={reply} onChange={(e) => setReply(e.target.value)} />
          <span className="flex flex-wrap gap-2">
            <Button size="sm" tone="acc" onClick={() => act(() => answer('approved'))}>{T.boostApprove}</Button>
            <Menu label={T.boostShelf} trigger={(p) => <button type="button" {...p} ref={p.ref} className="kd-btn kd-btn-sm">{T.boostShelf}</button>}>
              {shelves.map((s) => (
                <MenuItem key={s.id} onSelect={() => act(async () => {
                  if (!s.items.some((x) => x.id === b.event.id)) await FF.put(`/admin/shelves/${s.id}/items`, { eventIds: [b.event.id, ...s.items.map((x) => x.id)] });
                  return answer('approved');
                })}>{s.name[lang]}</MenuItem>
              ))}
            </Menu>
            <Button size="sm" tone="ghost" onClick={() => act(() => answer('declined'))}>{T.boostDecline}</Button>
          </span>
        </>
      ) : null}
    </div>
  );
}

/** One shelf: names saved on demand, switch and window saved at once, the list saved as a whole. */
function ShelfCard({ lang, shelf, onChange }: { lang: Lang; shelf: Shelf; onChange: (s: Shelf) => void }) {
  const T = pick(CONSOLE, lang);
  const M = pick(MOD, lang);
  const kd = useKd();
  const [name, setName] = useState<Pair>(shelf.name);
  const [items, setItems] = useState<Item[]>(shelf.items);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setName(shelf.name); setItems(shelf.items); }, [shelf]);
  const nameDirty = name.vi !== shelf.name.vi || name.en !== shelf.name.en;
  const orderDirty = items.map((i) => i.id).join() !== shelf.items.map((i) => i.id).join();
  // The picker hands back an id and a label; the rows it came from keep the rest.
  const found = useRef(new Map<string, Item>());

  const save = async (body: Record<string, unknown>) => {
    setBusy(true);
    const out = await run(kd, lang, () => FF.patch('/admin/shelves/' + shelf.id, body));
    setBusy(false);
    if (out && typeof out === 'object') { onChange(out as Shelf); kd.toast(M.saved); }
  };
  const saveItems = async () => {
    setBusy(true);
    const out = await run(kd, lang, () => FF.put(`/admin/shelves/${shelf.id}/items`, { eventIds: items.map((i) => i.id) }));
    setBusy(false);
    if (out && typeof out === 'object') { onChange(out as Shelf); kd.toast(M.listSaved); }
  };
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
  };
  const searchLive = useCallback(async (q: string): Promise<PickItem[]> => {
    const p = new URLSearchParams({ status: 'live', when: 'upcoming', limit: '20', sort: 'date' });
    if (q) p.set('q', q);
    const out: { items: (Item & { organizer: { name: string } })[] } = await FF.get('/admin/events?' + p);
    for (const e of out.items) found.current.set(e.id, e);
    return out.items.map((e) => ({ value: e.id, label: e.title, sub: [whenShort(e, lang), e.venueName, e.organizer.name].filter(Boolean).join(' · ') }));
  }, [lang]);
  const today = () => todayIn(Intl.DateTimeFormat().resolvedOptions().timeZone, FF.now());

  return (
    <Panel as="article" className="flex flex-col gap-4 p-5" aria-label={shelf.name[lang]}>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-[160px] flex-1 flex-col gap-1.5">
          <FieldLabel htmlFor={'shvi-' + shelf.id}>{M.nameVi}</FieldLabel>
          <Input id={'shvi-' + shelf.id} maxLength={80} value={name.vi} onChange={(e) => setName({ ...name, vi: e.target.value })} />
        </div>
        <div className="flex min-w-[160px] flex-1 flex-col gap-1.5">
          <FieldLabel htmlFor={'shen-' + shelf.id}>{M.nameEn}</FieldLabel>
          <Input id={'shen-' + shelf.id} maxLength={80} value={name.en} onChange={(e) => setName({ ...name, en: e.target.value })} />
        </div>
        {nameDirty ? <Button size="sm" disabled={busy || !name.vi.trim()} onClick={() => save({ name: { vi: name.vi.trim(), en: name.en.trim() || name.vi.trim() } })}>{M.saveName}</Button> : null}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Status tone={PHASE_TONE[shelf.phase] ?? 'none'}>{shelf.phaseLabel[lang]}</Status>
        <span className="flex-1" />
        <Switch checked={shelf.enabled} label={fill(T.shelfOn, { n: shelf.name[lang] })} onChange={(v) => save({ enabled: v })} />
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor={'shfrom-' + shelf.id}>{M.showFrom}</FieldLabel>
          <Input id={'shfrom-' + shelf.id} type="date" className="kd-num" value={shelf.startsOn ?? ''} onChange={(e) => save({ startsOn: e.target.value || null })} />
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor={'shto-' + shelf.id}>{M.until}</FieldLabel>
          <Input id={'shto-' + shelf.id} type="date" className="kd-num" min={shelf.startsOn ?? undefined} value={shelf.endsOn ?? ''} onChange={(e) => save({ endsOn: e.target.value || null })} />
        </div>
        <span className="flex flex-wrap gap-1.5 pb-1">
          <Chip onClick={() => { const d = today(); void save({ startsOn: d, endsOn: addDays(d, 6) }); }}>{M.week}</Chip>
          <Chip onClick={() => save({ startsOn: null, endsOn: null })}>{M.noWindow}</Chip>
        </span>
      </div>
      {items.length ? (
        <ol className="flex flex-col">
          {items.map((e, i) => (
            <li key={e.id} className="flex min-h-14 items-center gap-3 border-b border-line-1 py-1.5">
              <span className="kd-m kd-num w-5">{i + 1}</span>
              <Art title={e.title} family="edm" cover={e.coverUrl} className="h-10 w-16 shrink-0 rounded-md" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="kd-hs kd-ell">{e.title}</span>
                <span className="kd-s kd-ell">{[whenShort(e, lang), e.venue?.name ?? e.venueName].filter(Boolean).join(' · ')}</span>
              </span>
              <IconButton size="sm" label={fill(T.up, { t: e.title })} disabled={i === 0} onClick={() => move(i, -1)}><CaretUpIcon size={14} aria-hidden="true" /></IconButton>
              <IconButton size="sm" label={fill(M.down, { t: e.title })} disabled={i === items.length - 1} onClick={() => move(i, 1)}><CaretDownIcon size={14} aria-hidden="true" /></IconButton>
              <IconButton size="sm" label={fill(T.shelfRemove, { t: e.title })} onClick={() => setItems(items.filter((x) => x.id !== e.id))}><XIcon size={14} aria-hidden="true" /></IconButton>
            </li>
          ))}
        </ol>
      ) : <p className="kd-s">{M.noItems}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-[220px] flex-1">
          <AsyncPick
            label={T.shelfAdd}
            placeholder={M.addLive}
            load={searchLive}
            onPick={(it) => {
              const row = it && found.current.get(it.value);
              if (row && !items.some((x) => x.id === row.id)) setItems([...items, row]);
            }}
          />
        </div>
        {orderDirty ? <Button tone="acc" disabled={busy} onClick={saveItems}><FloppyDiskIcon size={16} aria-hidden="true" />{M.saveList}</Button> : null}
      </div>
    </Panel>
  );
}

function NewShelf({ lang, onMade }: { lang: Lang; onMade: (s: Shelf) => void }) {
  const T = pick(CONSOLE, lang);
  const M = pick(MOD, lang);
  const kd = useKd();
  const [vi, setVi] = useState('');
  const [en, setEn] = useState('');
  const make = async (e: FormEvent) => {
    e.preventDefault();
    const out = await run(kd, lang, () => FF.post('/admin/shelves', { name: { vi: vi.trim(), en: en.trim() || vi.trim() } }));
    if (out && typeof out === 'object') { onMade(out as Shelf); setVi(''); setEn(''); kd.toast(M.shelfMade); }
  };
  return (
    <Panel as="section" className="p-5" aria-label={T.shelfNew}>
      <form className="flex flex-wrap items-end gap-3" onSubmit={make}>
        <div className="flex min-w-[160px] flex-1 flex-col gap-2"><FieldLabel htmlFor="shVi">{M.nameVi}</FieldLabel><Input id="shVi" required maxLength={80} placeholder={M.nameViPh} value={vi} onChange={(e) => setVi(e.target.value)} /></div>
        <div className="flex min-w-[160px] flex-1 flex-col gap-2"><FieldLabel htmlFor="shEn">{M.nameEn}</FieldLabel><Input id="shEn" maxLength={80} value={en} onChange={(e) => setEn(e.target.value)} /></div>
        <Button type="submit" disabled={!vi.trim()}>{T.shelfCreate}</Button>
      </form>
    </Panel>
  );
}

/** A brand's request: everything it sent, and the answer with a reply. */
function InquiryRow({ lang, i, act }: { lang: Lang; i: Inquiry; act: ReturnType<typeof useAct> }) {
  const T = pick(CONSOLE, lang);
  const [reply, setReply] = useState('');
  const links = [...(i.website ? [['web', i.website]] : []), ...Object.entries(i.links ?? {})] as [string, string][];
  return (
    <div className="flex flex-col gap-2 border-b border-line-1 pb-3 last:border-b-0">
      <span className="flex items-center gap-3">
        { }
        {i.logoUrl ? <img src={i.logoUrl} alt="" referrerPolicy="no-referrer" className="size-10 shrink-0 rounded-lg object-cover" /> : null}
        <span className="flex min-w-0 flex-col">
          <span className="kd-hs">{i.brand}</span>
          <span className="kd-s">{[i.categoryLabel?.[lang] ?? i.category, i.isAlcohol ? T.adAlcohol : null].filter(Boolean).join(' · ')}</span>
        </span>
      </span>
      <span className="kd-s kd-num">
        {[i.budgetAmount != null ? money(i.budgetAmount, i.currency, lang) : i.budget, i.startsOn && i.endsOn ? `${dayMonth(i.startsOn, lang)} – ${dayMonth(i.endsOn, lang)}` : null,
          (i.placementLabels ?? []).map((p) => p[lang]).join(', '), i.cities.map((c) => c.label?.[lang] ?? c.slug).join(', ')].filter(Boolean).join(' · ')}
      </span>
      <span className="kd-s">{T.adContact}: {[i.contactName, i.email, i.phone].filter(Boolean).join(' · ')}</span>
      {links.length ? (
        <span className="flex flex-wrap gap-x-3 gap-y-1">
          {links.map(([k, u]) => <a key={k} className="kd-s underline decoration-line-2 underline-offset-4" href={u} target="_blank" rel="noopener nofollow">{k === 'web' ? u.replace(/^https?:\/\/(www\.)?/, '') : k}</a>)}
        </span>
      ) : null}
      {i.description ? <span className="kd-s text-fg-2">{i.description}</span> : null}
      {i.productImages.length ? (
        <span className="flex flex-wrap gap-2">
          {i.productImages.map((u, n) => <a key={u} href={u} target="_blank" rel="noopener nofollow"><img src={u} alt={fill(T.adImage, { n: n + 1 })} referrerPolicy="no-referrer" className="h-16 w-16 rounded-seg object-cover" /></a>)}
        </span>
      ) : null}
      {i.message ? <span className="kd-s text-fg-2">“{i.message}”</span> : null}
      <Input aria-label={T.replyPh} placeholder={T.replyPh} maxLength={1000} value={reply} onChange={(e) => setReply(e.target.value)} />
      <span className="flex gap-2">
        <Button size="sm" tone="acc" onClick={() => act(() => FF.post(`/admin/ads/inquiries/${i.id}/approve`, { reply: reply.trim() || undefined }))}>{T.adApprove}</Button>
        <Button size="sm" tone="ghost" onClick={() => act(() => FF.post(`/admin/ads/inquiries/${i.id}/decline`, { reply: reply.trim() || undefined }))}>{T.adDecline}</Button>
      </span>
    </div>
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
          {!ads.inquiries.length ? <span className="kd-s">{T.noAds}</span> : ads.inquiries.map((i) => <InquiryRow key={i.id} lang={lang} i={i} act={act} />)}
          <span className="kd-m pt-2">{T.adCampaigns}</span>
          {ads.campaigns.map((c) => (
            <div key={c.id} className="flex items-center gap-3 border-b border-line-1 py-2 last:border-b-0">
              <span className="flex min-w-0 flex-1 flex-col"><span className="kd-hs">{c.brand} · {c.placement}</span><span className="kd-s kd-num">{fill(T.adLine, { i: count(c.impressions, lang), c: count(c.clicks, lang), p: m(c.spend) })}</span></span>
              <Switch checked={c.active} label={fill(T.adActive, { b: c.brand })} onChange={(v) => act(() => FF.patch('/admin/ads/campaigns/' + c.id, { active: v }))} />
            </div>
          ))}
        </Panel>
        <Panel className="kd-side flex flex-col gap-3 self-start p-5">
          <span className="kd-m">{T.rates}</span>
          <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); void act(() => FF.put('/admin/ads/rates', rates)); }}>
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
