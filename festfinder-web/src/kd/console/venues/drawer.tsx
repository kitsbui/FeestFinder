'use client';
/**
 * Add or edit a venue: name, address, city and district, and the pin, from a pasted map link
 * or typed coordinates that must sit inside the city's box. The pin shows on the Kính đêm map
 * before saving. Saving an existing venue also updates its upcoming listings; the API's
 * message says how many.
 */
import { useEffect, useId, useState } from 'react';
import { ArrowSquareOutIcon, MagnifyingGlassIcon, MapPinIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang } from '../../copy';
import { useKd } from '../../runtime';
import { Button } from '../../ui/actions';
import { Input, Select, SwitchRow } from '../../ui/forms';
import { VenueMap } from '../../map/venue-map';
import { act, Drawer, Field, useOptions } from '../kit';
import { VENUES } from './copy';
import { inBox, onEarth, parseCoords } from './coords';

export interface Venue {
  id: string; name: string; address: string; area: string; city: string; lat: number; lng: number;
  verified: boolean; permitOnFile: boolean; events?: number; upcoming?: number;
}
export interface Preset { name?: string; address?: string; area?: string; city?: string; eventId?: string | null; eventTitle?: string | null }

export function VenueDrawer({ lang, venue, preset, onClose, onSaved }: {
  lang: Lang; venue?: Venue | null; preset?: Preset | null; onClose: () => void; onSaved: (out: Venue) => void;
}) {
  const T = pick(VENUES, lang);
  const kd = useKd();
  const opts = useOptions();
  const editing = !!venue?.id;
  const [f, setF] = useState(() => ({
    name: venue?.name ?? preset?.name ?? '', address: venue?.address ?? preset?.address ?? '', area: venue?.area ?? preset?.area ?? '', city: venue?.city ?? preset?.city ?? '',
    lat: venue ? String(venue.lat) : '', lng: venue ? String(venue.lng) : '', verified: venue?.verified ?? true, permitOnFile: venue?.permitOnFile ?? false,
  }));
  const [paste, setPaste] = useState('');
  const [busy, setBusy] = useState(false);
  const areas = useId();
  const cities = opts?.cities ?? [];
  // A new venue starts in the first listed city.
  useEffect(() => { if (!f.city && cities.length) setF((x) => ({ ...x, city: cities[0].value })); }, [cities, f.city]);
  const set = (k: 'name' | 'address' | 'area' | 'city' | 'lat' | 'lng') => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const lat = f.lat.trim() === '' ? null : Number(f.lat), lng = f.lng.trim() === '' ? null : Number(f.lng);
  const has = lat !== null && lng !== null && !Number.isNaN(lat) && !Number.isNaN(lng);
  const bbox = (cities.find((c) => c.value === f.city) as { bbox?: number[] } | undefined)?.bbox;
  const coordsOk = has && inBox(lat!, lng!, bbox);
  const ok = f.name.trim().length >= 2 && f.address.trim().length >= 3 && f.area.trim().length >= 2 && !!f.city && coordsOk;
  // The map follows the pin once typing pauses.
  const [shown, setShown] = useState<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setShown(has && onEarth(lat!, lng!) ? { lat: lat!, lng: lng! } : null), 400);
    return () => clearTimeout(t);
  }, [has, lat, lng]);

  const takePaste = (v: string) => {
    setPaste(v);
    const c = parseCoords(v);
    if (c) setF((x) => ({ ...x, lat: c.lat.toFixed(6), lng: c.lng.toFixed(6) }));
  };
  const save = async () => {
    setBusy(true);
    const body = { name: f.name.trim(), address: f.address.trim(), area: f.area.trim(), city: f.city, lat, lng, verified: f.verified, permitOnFile: f.permitOnFile };
    const out = await act(kd, lang, () => (editing ? FF.patch('/admin/venues/' + venue!.id, body) : FF.post('/admin/venues', body)));
    setBusy(false);
    if (out) onSaved(out as Venue);
  };
  const query = encodeURIComponent(`${f.name} ${f.address}`.trim());
  const groups: { label: { en: string; vi: string }; areas: string[] }[] = opts?.areaGroups ?? [];

  return (
    <Drawer
      title={editing ? venue!.name : T.addTitle}
      sub={preset?.eventId ? fill(T.linksTo, { e: preset.eventTitle || T.theListing }) : null}
      onClose={onClose}
      footer={(
        <>
          <Button onClick={onClose}>{T.cancel}</Button>
          <Button tone="acc" className="ml-auto" type="submit" form="venue-form" disabled={busy || !ok}>{editing ? T.save : T.create}</Button>
        </>
      )}
    >
      <form id="venue-form" className="grid gap-4 tab:grid-cols-2" onSubmit={(e) => { e.preventDefault(); if (ok) save(); }}>
        <div className="tab:col-span-2"><Field label={T.name} htmlFor="v-name"><Input id="v-name" required minLength={2} maxLength={160} autoFocus={!editing} value={f.name} onChange={set('name')} placeholder={T.namePh} /></Field></div>
        <div className="tab:col-span-2"><Field label={T.address} htmlFor="v-address"><Input id="v-address" required minLength={3} maxLength={240} value={f.address} onChange={set('address')} placeholder={T.addressPh} /></Field></div>
        <Field label={T.city} htmlFor="v-city">
          <Select id="v-city" value={f.city} onChange={set('city')}>
            {cities.length ? cities.map((c) => <option key={c.value} value={c.value}>{c.label[lang]}</option>) : <option value={f.city}>{f.city}</option>}
          </Select>
        </Field>
        <Field label={T.district} htmlFor="v-area">
          <Input id="v-area" required minLength={2} maxLength={60} list={areas} value={f.area} onChange={set('area')} placeholder={T.districtPh} />
          <datalist id={areas}>
            {groups.flatMap((g) => g.areas.map((a) => <option key={g.label.en + a} value={a} label={g.label[lang]} />))}
          </datalist>
        </Field>
        <div className="tab:col-span-2">
          <Field label={T.paste} htmlFor="v-paste" error={paste.trim() && !parseCoords(paste) ? T.noCoords : null}>
            <Input id="v-paste" value={paste} onChange={(e) => takePaste(e.target.value)} placeholder="https://maps.google.com/…@10.77,106.70" />
          </Field>
        </div>
        <Field label={T.lat} htmlFor="v-lat" error={has && !coordsOk ? T.outside : null}>
          <Input id="v-lat" required inputMode="decimal" value={f.lat} onChange={set('lat')} invalid={has && !coordsOk} />
        </Field>
        <Field label={T.lng} htmlFor="v-lng">
          <Input id="v-lng" required inputMode="decimal" value={f.lng} onChange={set('lng')} invalid={has && !coordsOk} />
        </Field>
        <div className="flex flex-col gap-2 tab:col-span-2">
          <div className="relative h-56 overflow-hidden rounded-lg bg-[#0b0c0d] shadow-[inset_0_0_0_1px_var(--color-line)]" role="img" aria-label={shown ? `${T.pinMap}: ${shown.lat}, ${shown.lng}` : T.noPin}>
            {shown
              ? <VenueMap key={`${shown.lat},${shown.lng}`} lat={shown.lat} lng={shown.lng} family="edm" label={f.name || T.pinMap} className="absolute inset-0" />
              : <span className="kd-s absolute inset-0 flex items-center justify-center gap-2"><MapPinIcon size={18} aria-hidden="true" />{T.noPin}</span>}
          </div>
          <div className="flex flex-wrap gap-4">
            <a className="kd-s inline-flex items-center gap-1.5 hover:text-paper" href={`https://www.google.com/maps/search/?api=1&query=${query}`} target="_blank" rel="noopener noreferrer">
              <MagnifyingGlassIcon size={14} aria-hidden="true" />{T.find}
            </a>
            {coordsOk ? (
              <a className="kd-s inline-flex items-center gap-1.5 hover:text-paper" href={`https://www.google.com/maps?q=${lat},${lng}`} target="_blank" rel="noopener noreferrer">
                <ArrowSquareOutIcon size={14} aria-hidden="true" />{T.openPin}
              </a>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col tab:col-span-2">
          <SwitchRow label={T.isVerified} checked={f.verified} onChange={(v) => setF((x) => ({ ...x, verified: v }))} />
          <SwitchRow label={T.permitOnFile} checked={f.permitOnFile} onChange={(v) => setF((x) => ({ ...x, permitOnFile: v }))} />
        </div>
      </form>
    </Drawer>
  );
}
