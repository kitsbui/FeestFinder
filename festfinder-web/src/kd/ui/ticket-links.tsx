'use client';
/**
 * More sellers than the main ticket link, each for the viewers of some countries (growth plan
 * card D): /go sends a viewer in Singapore to the Singapore seller, everyone else to the main
 * link. Countries are ISO codes typed as "SG, MY". Used by the Studio editor and the Console form.
 */
import { PlusIcon, TrashIcon } from '@phosphor-icons/react/ssr';
import { pick, type Lang } from '../copy';
import { Button, IconButton } from './actions';
import { FieldLabel, Input } from './forms';

export interface TicketLinkRow { url: string; countries: string }

const COPY = {
  title: { en: 'Sellers by country', vi: 'Trang bán theo nước' },
  add: { en: 'Add a seller for a country', vi: 'Thêm trang bán cho một nước' },
  url: { en: 'Seller link', vi: 'Link trang bán' },
  countries: { en: 'Countries', vi: 'Nước' },
  countriesHint: { en: 'Codes, comma separated: SG, MY', vi: 'Mã nước, cách nhau bằng dấu phẩy: SG, MY' },
  remove: { en: 'Remove this seller', vi: 'Bỏ trang bán này' },
};

export const MAX_TICKET_LINKS = 5;

export const toRows = (links: { url: string; countries: string[] }[] | null | undefined): TicketLinkRow[] =>
  (links ?? []).map((l) => ({ url: l.url, countries: l.countries.join(', ') }));

/** The API's shape, keeping only rows with a link and at least one two-letter code. */
export const fromRows = (rows: TicketLinkRow[]) => rows
  .map((r) => ({ url: r.url.trim(), countries: [...new Set(r.countries.toUpperCase().split(/[^A-Z]+/).filter((c) => c.length === 2))] }))
  .filter((r) => r.url && r.countries.length);

export function TicketLinks({ lang, id, value, onChange }: { lang: Lang; id: string; value: TicketLinkRow[]; onChange: (v: TicketLinkRow[]) => void }) {
  const T = pick(COPY, lang);
  const set = (i: number, patch: Partial<TicketLinkRow>) => onChange(value.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <div className="flex min-w-0 flex-col gap-3">
      {value.length ? <span className="kd-hs">{T.title}</span> : null}
      {value.map((r, i) => (
        <div key={i} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-end gap-2 tab:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]">
          <div className="col-span-2 flex min-w-0 flex-col gap-2 tab:col-span-1">
            <FieldLabel htmlFor={`${id}-url-${i}`}>{T.url}</FieldLabel>
            <Input id={`${id}-url-${i}`} type="url" inputMode="url" placeholder="https://" value={r.url} onChange={(e) => set(i, { url: e.target.value })} />
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <FieldLabel htmlFor={`${id}-cc-${i}`} hint={i === 0 ? T.countriesHint : undefined}>{T.countries}</FieldLabel>
            <Input id={`${id}-cc-${i}`} autoCapitalize="characters" value={r.countries} onChange={(e) => set(i, { countries: e.target.value })} />
          </div>
          <IconButton label={T.remove} onClick={() => onChange(value.filter((_, j) => j !== i))}><TrashIcon size={18} aria-hidden="true" /></IconButton>
        </div>
      ))}
      {value.length < MAX_TICKET_LINKS ? (
        <Button size="sm" tone="ghost" className="self-start" onClick={() => onChange([...value, { url: '', countries: '' }])}>
          <PlusIcon size={16} aria-hidden="true" />{T.add}
        </Button>
      ) : null}
    </div>
  );
}
