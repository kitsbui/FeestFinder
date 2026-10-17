'use client';
/**
 * /console/brands: brand campaigns. The team posts a campaign for a brand (cities and styles,
 * a fee range in the first city's currency, a closing day); artists who are open to brands
 * say they are interested; the team shortlists, selects or declines each one, and the artist
 * is told.
 */
import { useState } from 'react';
import { CheckIcon, PencilSimpleIcon, PlusIcon, XIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang, type Pair } from '../../copy';
import { dayMonth, money } from '../../format';
import { useKd } from '../../runtime';
import { Button } from '../../ui/actions';
import { Input, Select, TextArea } from '../../ui/forms';
import { Row, Table } from '../../ui/shell';
import { act, Body, Drawer, Empty, ErrorBox, Field, Loading, PageHead, Pill, useLoad, useOptions, type FormOptions } from '../kit';
import { useConsole } from '../root';
import { Cell, Tile, Tiles, Two } from '../orders/parts';
import { BRANDS } from './copy';

type Status = 'draft' | 'open' | 'closed';
type Interest = 'sent' | 'shortlisted' | 'declined' | 'selected';
interface Campaign {
  id: string; brandName: string; title: string; brief: string; cities: { slug: string; label: Pair | null }[]; styles: { key: string; label: Pair }[];
  feeMin: number | null; feeMax: number | null; currency: string; closesOn: string | null; status: Status; interests?: number;
}
interface InterestRow {
  id: string; status: Interest; message: string;
  artist: { slug: string; name: string; basedIn: Pair | null; styles: { key: string; label: Pair }[]; email: string | null };
}

const STATUSES: Status[] = ['draft', 'open', 'closed'];
const TONE: Record<Status, 'ok' | 'none' | 'warn'> = { draft: 'none', open: 'ok', closed: 'none' };
const ITONE: Record<Interest, 'ok' | 'none' | 'bad' | 'live'> = { sent: 'none', shortlisted: 'live', declined: 'bad', selected: 'ok' };
const day = (iso: string, lang: Lang) => `${dayMonth(iso, lang)}${lang === 'vi' ? '.' : ' '}${iso.slice(0, 4)}`;

export function Brands() {
  const { lang } = useConsole();
  const T = pick(BRANDS, lang);
  const load = useLoad<{ items: Campaign[]; artistsOpenToBrands: number }>('/admin/brand-campaigns');
  const [form, setForm] = useState<{ campaign?: Campaign } | null>(null);
  const [open, setOpen] = useState<Campaign | null>(null);
  const status: Record<Status, string> = { draft: T.sDraft, open: T.sOpen, closed: T.sClosed };
  const fee = (c: Campaign) => (c.feeMin == null && c.feeMax == null ? '—' : [c.feeMin, c.feeMax].filter((x): x is number => x != null).map((x) => money(x, c.currency, lang)).join(' – '));
  const COLS = 'minmax(260px,2fr) 200px 100px 110px 100px';
  return (
    <>
      <PageHead title={T.title} actions={<Button tone="acc" onClick={() => setForm({})}><PlusIcon size={16} aria-hidden="true" />{T.add}</Button>} />
      <Body>
        {load.error && !load.data ? <ErrorBox error={load.error} retry={load.reload} /> : !load.data ? <Loading /> : (
          <>
            <Tiles><Tile label={T.openArtists} value={load.data.artistsOpenToBrands.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')} /></Tiles>
            {!load.data.items.length ? <Empty title={T.none} /> : (
              <Table label={T.table} cols={COLS} head={[T.cCampaign, T.cFee, T.cInterested, '', '']}>
                {load.data.items.map((c) => (
                  <Row key={c.id} cols={COLS} current={open?.id === c.id}>
                    <Cell>
                      <button type="button" className="flex min-h-11 w-full min-w-0 flex-col justify-center text-left hover:underline" onClick={() => setOpen(c)}>
                        <Two title={c.title} sub={[c.brandName, c.cities.map((x) => FF.text(x.label, lang) || x.slug).join(', '), c.closesOn ? fill(T.closes, { d: day(c.closesOn, lang) }) : ''].filter(Boolean).join(' · ')} />
                        {/* The name starts with what the row shows (WCAG 2.5.3); what it opens comes after. */}
                        <span className="sr-only">, {T.openWhat}</span>
                      </button>
                    </Cell>
                    <Cell end className="kd-num text-sm">{fee(c)}</Cell>
                    <Cell end className="kd-num text-sm text-fg-1">{c.interests ?? 0}</Cell>
                    <Cell><Pill tone={TONE[c.status]}>{status[c.status]}</Pill></Cell>
                    <Cell end>
                      <Button size="sm" aria-label={fill(T.editLabel, { t: c.title })} onClick={() => setForm({ campaign: c })}><PencilSimpleIcon size={14} aria-hidden="true" />{T.edit}</Button>
                    </Cell>
                  </Row>
                ))}
              </Table>
            )}
          </>
        )}
      </Body>
      {form ? <CampaignForm key={form.campaign?.id ?? 'new'} lang={lang} campaign={form.campaign} status={status} onClose={() => setForm(null)} onSaved={() => { setForm(null); load.reload(); }} /> : null}
      {open ? <Interests key={open.id} lang={lang} campaign={open} onClose={() => { setOpen(null); load.reload(); }} /> : null}
    </>
  );
}

/** Several values from a list: a select to add one, chips to take one off. */
function Many({ id, value, onChange, options, placeholder, max, removeLabel }: {
  id: string; value: string[]; onChange: (v: string[]) => void; options: { value: string; label: string }[]; placeholder: string; max: number; removeLabel: string;
}) {
  const label = (v: string) => options.find((o) => o.value === v)?.label ?? v;
  return (
    <>
      <Select id={id} value="" disabled={value.length >= max} onChange={(e) => { const v = e.target.value; if (v && !value.includes(v)) onChange([...value, v]); }}>
        <option value="">{placeholder}</option>
        {options.filter((o) => !value.includes(o.value)).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </Select>
      {value.length ? (
        <ul className="flex flex-wrap gap-1.5 pt-1">
          {value.map((v) => (
            <li key={v}>
              <button type="button" className="kd-chip kd-chip-on" aria-label={fill(removeLabel, { x: label(v) })} onClick={() => onChange(value.filter((x) => x !== v))}>
                {label(v)}<XIcon size={12} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

function CampaignForm({ lang, campaign, status, onClose, onSaved }: { lang: Lang; campaign?: Campaign; status: Record<Status, string>; onClose: () => void; onSaved: () => void }) {
  const T = pick(BRANDS, lang);
  const kd = useKd();
  const opts: FormOptions | null = useOptions();
  const [f, setF] = useState(() => ({
    brandName: campaign?.brandName ?? '', title: campaign?.title ?? '', brief: campaign?.brief ?? '',
    cities: campaign?.cities.map((c) => c.slug) ?? [], styles: campaign?.styles.map((s) => s.key) ?? [],
    feeMin: campaign?.feeMin != null ? String(campaign.feeMin) : '', feeMax: campaign?.feeMax != null ? String(campaign.feeMax) : '',
    closesOn: campaign?.closesOn ?? '', status: campaign?.status ?? 'open',
  }));
  const [busy, setBusy] = useState(false);
  const upd = (p: Partial<typeof f>) => setF((x) => ({ ...x, ...p }));
  const feeOk = f.feeMin === '' || f.feeMax === '' || Number(f.feeMax) >= Number(f.feeMin);
  const ok = f.brandName.trim().length >= 2 && f.title.trim().length >= 3 && feeOk;
  const cityOpts = (opts?.cities ?? []).map((c) => ({ value: c.value, label: c.label[lang] + (c.currency ? ` · ${c.currency}` : '') }));
  const styleOpts = (opts?.styles ?? []).map((s) => ({ value: s.value, label: s.label[lang] }));
  const save = async () => {
    setBusy(true);
    const body = {
      brandName: f.brandName.trim(), title: f.title.trim(), brief: f.brief.trim(), cities: f.cities, styles: f.styles, status: f.status,
      feeMin: f.feeMin === '' ? null : Number(f.feeMin), feeMax: f.feeMax === '' ? null : Number(f.feeMax), closesOn: f.closesOn || null,
    };
    const out = await act(kd, lang, () => (campaign ? FF.patch('/admin/brand-campaigns/' + campaign.id, body) : FF.post('/admin/brand-campaigns', body)));
    setBusy(false);
    if (out) { kd.toast(T.saved); onSaved(); }
  };
  const opt = (s: string) => <>{s} <span className="kd-s">({T.optional})</span></>;
  return (
    <Drawer
      title={campaign ? campaign.title : T.add}
      onClose={onClose}
      footer={<><Button onClick={onClose}>{T.cancel}</Button><span className="flex-1" /><Button tone="acc" disabled={!ok || busy} onClick={save}><CheckIcon size={16} aria-hidden="true" />{T.save}</Button></>}
    >
      <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); if (ok && !busy) void save(); }}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={T.brand} htmlFor="bc-brand"><Input id="bc-brand" value={f.brandName} autoFocus={!campaign} onChange={(e) => upd({ brandName: e.target.value })} /></Field>
          <Field label={T.status} htmlFor="bc-status">
            <Select id="bc-status" value={f.status} onChange={(e) => upd({ status: e.target.value as Status })}>
              {STATUSES.map((s) => <option key={s} value={s}>{status[s]}</option>)}
            </Select>
          </Field>
        </div>
        <Field label={T.cTitle} htmlFor="bc-title"><Input id="bc-title" value={f.title} onChange={(e) => upd({ title: e.target.value })} /></Field>
        <Field label={opt(T.brief)} htmlFor="bc-brief"><TextArea id="bc-brief" rows={4} value={f.brief} onChange={(e) => upd({ brief: e.target.value })} /></Field>
        <Field label={opt(T.cities)} htmlFor="bc-cities" hint={T.citiesHint}>
          <Many id="bc-cities" value={f.cities} onChange={(v) => upd({ cities: v })} options={cityOpts} placeholder={T.addCity} max={10} removeLabel={T.remove} />
        </Field>
        <Field label={opt(T.styles)} htmlFor="bc-styles">
          <Many id="bc-styles" value={f.styles} onChange={(v) => upd({ styles: v })} options={styleOpts} placeholder={T.addStyle} max={8} removeLabel={T.remove} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={opt(T.feeMin)} htmlFor="bc-min">
            <Input id="bc-min" inputMode="numeric" className="kd-num" value={f.feeMin} onChange={(e) => upd({ feeMin: e.target.value.replace(/\D/g, '') })} />
          </Field>
          <Field label={opt(T.feeMax)} htmlFor="bc-max" error={feeOk ? null : T.feeBad}>
            <Input id="bc-max" inputMode="numeric" className="kd-num" value={f.feeMax} invalid={!feeOk} onChange={(e) => upd({ feeMax: e.target.value.replace(/\D/g, '') })} />
          </Field>
          <Field label={opt(T.closesOn)} htmlFor="bc-closes">
            <Input id="bc-closes" type="date" className="kd-num" value={f.closesOn} onChange={(e) => upd({ closesOn: e.target.value })} />
          </Field>
        </div>
      </form>
    </Drawer>
  );
}

function Interests({ lang, campaign, onClose }: { lang: Lang; campaign: Campaign; onClose: () => void }) {
  const T = pick(BRANDS, lang);
  const kd = useKd();
  const load = useLoad<{ items: InterestRow[] }>(`/admin/brand-campaigns/${campaign.id}/interests`);
  const [busy, setBusy] = useState<string | null>(null);
  const label: Record<Interest, string> = { sent: T.iSent, shortlisted: T.iShortlisted, declined: T.iDeclined, selected: T.iSelected };
  const decide = async (i: InterestRow, status: Interest) => {
    setBusy(i.id + status);
    if (await act(kd, lang, () => FF.post(`/admin/brand-campaigns/${campaign.id}/interests/${i.id}`, { status }))) load.reload();
    setBusy(null);
  };
  const COLS = 'minmax(200px,1fr) minmax(200px,1.2fr) 260px';
  return (
    <Drawer wide title={campaign.title} sub={campaign.brandName} onClose={onClose}>
      {load.error && !load.data ? <ErrorBox error={load.error} retry={load.reload} /> : !load.data ? <Loading /> : !load.data.items.length ? <Empty title={T.noInterest} /> : (
        <Table label={T.interests} cols={COLS} head={[T.iArtist, T.iMessage, '']}>
          {load.data.items.map((i) => (
            <Row key={i.id} cols={COLS} className="py-2">
              <Cell>
                <span className="flex min-w-0 flex-col">
                  <a className="kd-ell text-sm text-fg-1 hover:underline" href={'/a/' + i.artist.slug} target="_blank" rel="noopener">{i.artist.name}</a>
                  <span className="kd-s text-xs">{[i.artist.basedIn ? FF.text(i.artist.basedIn, lang) : '', i.artist.styles.map((s) => FF.text(s.label, lang)).join(', '), i.artist.email].filter(Boolean).join(' · ')}</span>
                </span>
              </Cell>
              <Cell className="kd-s whitespace-pre-wrap">{i.message || '—'}</Cell>
              <Cell end>
                {i.status === 'selected' || i.status === 'declined' ? <Pill tone={ITONE[i.status]}>{label[i.status]}</Pill> : (
                  <span className="flex flex-wrap items-center justify-end gap-1.5">
                    {i.status === 'sent'
                      ? <Button size="sm" disabled={!!busy} aria-label={fill(T.actOn, { a: T.shortlist, n: i.artist.name })} onClick={() => decide(i, 'shortlisted')}>{T.shortlist}</Button>
                      : <Pill tone={ITONE[i.status]}>{label[i.status]}</Pill>}
                    <Button size="sm" disabled={!!busy} aria-label={fill(T.actOn, { a: T.select, n: i.artist.name })} onClick={() => decide(i, 'selected')}><CheckIcon size={14} aria-hidden="true" />{T.select}</Button>
                    <Button size="sm" className="kd-btn-danger" disabled={!!busy} aria-label={fill(T.actOn, { a: T.decline, n: i.artist.name })} onClick={() => decide(i, 'declined')}>{T.decline}</Button>
                  </span>
                )}
              </Cell>
            </Row>
          ))}
        </Table>
      )}
    </Drawer>
  );
}
