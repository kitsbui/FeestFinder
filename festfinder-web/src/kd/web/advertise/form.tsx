'use client';
/**
 * The advertising request (POST /ad-inquiries): the brand (name, what it sells, logo, website and
 * social pages, a description, product images), a contact, and the campaign (budget, dates,
 * placements, cities, alcohol). Pictures are links, checked as they are pasted
 * (ui/image-link.tsx). Signed out, a sign-in card stands in for it (the API takes requests from
 * accounts only). Sent, it says so in place and can start another; the person's own requests
 * and the team's answers are listed under it.
 */
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { CheckCircleIcon, PlusIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { COMMON, fill, pick, type Lang, type Pair } from '../../copy';
import { dayMonth, money } from '../../format';
import { useKd } from '../../runtime';
import { Button, buttonClass, Chip } from '../../ui/actions';
import { FieldError, FieldLabel, Input, Select, TextArea } from '../../ui/forms';
import { ImageLinkField } from '../../ui/image-link';
import { Card, Status, type StatusTone } from '../../ui/parts';
import { ADVERTISE } from './copy';
import { AD_CURRENCY, CATEGORIES, LINKS, MAX_IMAGES, MIN_BUDGET, PLACEMENTS, looksLikeEmail, minBudgetLabel, type Category, type LinkKey, type Placement } from './model';

export function AdEnquiry({ lang }: { lang: Lang }) {
  const kd = useKd();
  const T = pick(ADVERTISE, lang);
  // Each request is a fresh form: "Send another" mounts a new one.
  const [round, setRound] = useState(0);
  if (kd.session === undefined) return <div className="kd-skel h-[560px]" aria-hidden="true" />;
  if (!kd.user) {
    return (
      <Card className="flex flex-col items-start gap-4 p-[clamp(20px,3vw,28px)]" data-ff-gate>
        <h2 className="kd-h">{T.gate}</h2>
        <button type="button" className={buttonClass({ tone: 'acc' })} onClick={() => kd.openSignIn(T.gate)}>{pick(COMMON, lang).signIn}</button>
      </Card>
    );
  }
  return (
    <div className="flex flex-col gap-8">
      <EnquiryForm
        key={kd.user.id + ':' + round} lang={lang} email={kd.user.email ?? ''} name={kd.user.name ?? ''}
        focusFirst={round > 0} onAnother={() => setRound((n) => n + 1)}
      />
      <MyRequests key={'mine:' + round} lang={lang} />
    </div>
  );
}

type Errors = Partial<Record<'brand' | 'email' | 'contact' | 'budget' | 'dates' | 'links' | 'form', string>>;
interface City { slug: string; name: Pair }

function EnquiryForm({ lang, email: accountEmail, name: accountName, focusFirst, onAnother }: { lang: Lang; email: string; name: string; focusFirst: boolean; onAnother: () => void }) {
  const kd = useKd();
  const T = pick(ADVERTISE, lang);
  const today = new Date(Date.now() + FF.clockOffset).toISOString().slice(0, 10);
  const [brand, setBrand] = useState('');
  const [cat, setCat] = useState<Category>('F&B');
  const [logo, setLogo] = useState<string | null>(null);
  const [website, setWebsite] = useState('');
  const [links, setLinks] = useState<Partial<Record<LinkKey, string>>>({});
  const [desc, setDesc] = useState('');
  const [images, setImages] = useState<(string | null)[]>([null]);
  const [contact, setContact] = useState(accountName);
  const [email, setEmail] = useState(accountEmail);
  const [phone, setPhone] = useState('');
  const [budget, setBudget] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [places, setPlaces] = useState<Record<Placement, boolean>>({ feed: true, banner: true, live: false });
  const [cities, setCities] = useState<string[]>([]);
  const [allCities, setAllCities] = useState<City[]>([]);
  const [alcohol, setAlcohol] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const brandRef = useRef<HTMLInputElement>(null);
  const sentRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    FF.once('kd:discovery', () => FF.maybe(FF.get('/meta/discovery'), null)).then((d: { cities?: City[] } | null) => setAllCities(d?.cities ?? []));
  }, []);
  useEffect(() => { if (sent) sentRef.current?.focus(); }, [sent]);
  // A new request after one was sent starts at its first field (the button that asked for it is gone).
  useEffect(() => { if (focusFirst) brandRef.current?.focus(); }, [focusFirst]);

  const url = (v: string) => { const t = v.trim(); return !t ? '' : /^https?:\/\//i.test(t) ? t : 'https://' + t; };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const amount = Number(budget) || 0;
    const cleanLinks = Object.fromEntries(Object.entries(links).map(([k, v]) => [k, url(v ?? '')]).filter(([, v]) => v));
    const check: Errors = {
      brand: brand.trim() ? undefined : T.errBrand,
      links: url(website) || Object.keys(cleanLinks).length ? undefined : T.errLinks,
      contact: contact.trim() ? undefined : T.errContact,
      email: looksLikeEmail(email.trim()) ? undefined : T.errEmail,
      budget: amount >= MIN_BUDGET ? undefined : fill(T.errBudget, { a: money(MIN_BUDGET, AD_CURRENCY, lang) }),
      dates: from && to ? undefined : T.errDates,
    };
    setErr(check);
    if (Object.values(check).some(Boolean)) return;
    const placements = PLACEMENTS.filter((p) => places[p.key]).map((p) => p.key);
    setBusy(true);
    try {
      const out = await FF.post('/ad-inquiries', {
        brand: brand.trim(), category: cat, logoUrl: logo, website: url(website) || null, links: cleanLinks, description: desc.trim(),
        productImages: images.filter((x): x is string => !!x), contactName: contact.trim(), email: email.trim(), phone: phone.trim() || undefined,
        budgetAmount: amount, startsOn: from, endsOn: to,
        // The API takes at least one; with none ticked, the feed card is the default.
        placements: placements.length ? placements : ['feed'],
        cities, isAlcohol: alcohol, message: msg.trim(),
      });
      setSent(FF.text((out as { message?: unknown } | null)?.message, lang) || T.submitted);
    } catch (x) {
      const { code, status } = x as { code?: string; status?: number };
      if (status === 401) kd.openSignIn(T.gate);
      if (code === 'invalid_email') setErr({ email: FF.errorText(x, lang) });
      else if (code === 'link_required') setErr({ links: FF.errorText(x, lang) });
      else if (code === 'dates_order' || code === 'starts_in_past') setErr({ dates: FF.errorText(x, lang) });
      else setErr({ form: FF.errorText(x, lang) });
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <Card className="flex flex-col items-start gap-3 p-[clamp(20px,3vw,28px)]">
        <CheckCircleIcon size={28} className="text-ok" aria-hidden="true" />
        <h2 ref={sentRef} tabIndex={-1} className="kd-h outline-none">{T.sentTitle}</h2>
        <p className="kd-s">{sent}</p>
        <Button size="sm" className="mt-1" onClick={onAnother}>{T.another}</Button>
      </Card>
    );
  }

  return (
    <form noValidate onSubmit={submit} aria-labelledby="ad-form-h" className="kd-card flex flex-col gap-5 p-[clamp(20px,3vw,28px)]">
      <h2 id="ad-form-h" className="kd-h">{T.form}</h2>

      <fieldset className="flex flex-col gap-4">
        <legend className="kd-m pb-1">{T.secBrand}</legend>
        <div className="grid gap-4 tab:grid-cols-2">
          <div className="flex flex-col gap-2">
            <FieldLabel htmlFor="ad-brand">{T.brandLabel}</FieldLabel>
            <Input id="ad-brand" ref={brandRef} value={brand} onChange={(e) => setBrand(e.target.value)} placeholder={T.brandPh} maxLength={80} autoComplete="organization" invalid={!!err.brand} />
            <FieldError>{err.brand}</FieldError>
          </div>
          <div className="flex flex-col gap-2">
            <FieldLabel htmlFor="ad-cat">{T.catLabel}</FieldLabel>
            <Select id="ad-cat" value={cat} onChange={(e) => setCat(e.target.value as Category)}>
              {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{T[c.label]}</option>)}
            </Select>
          </div>
        </div>
        <ImageLinkField lang={lang} purpose="logo" label={T.logoLabel} hint={T.logoHint} value={logo} onChange={setLogo} />
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="ad-web" hint={T.linksHint}>{T.websiteLabel}</FieldLabel>
          <Input id="ad-web" type="url" inputMode="url" placeholder="https://" maxLength={500} value={website} onChange={(e) => setWebsite(e.target.value)} invalid={!!err.links} />
        </div>
        <div className="grid gap-3 tab:grid-cols-2">
          {LINKS.map((l) => (
            <div key={l.key} className="flex flex-col gap-2">
              <FieldLabel htmlFor={'ad-l-' + l.key}>{l.label}</FieldLabel>
              <Input id={'ad-l-' + l.key} type="url" inputMode="url" placeholder="https://" maxLength={500} value={links[l.key] ?? ''} onChange={(e) => setLinks({ ...links, [l.key]: e.target.value })} />
            </div>
          ))}
        </div>
        <FieldError>{err.links}</FieldError>
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="ad-desc">{T.descLabel}</FieldLabel>
          <TextArea id="ad-desc" rows={3} maxLength={2000} placeholder={T.descPh} value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <span className="kd-flabel">{T.imagesLabel}</span>
          {images.map((v, i) => (
            <ImageLinkField key={i} lang={lang} purpose="moment" label={fill(T.imageN, { n: i + 1 })} hint={T.imageHint} value={v}
              onChange={(next) => setImages((xs) => xs.map((x, j) => (j === i ? next : x)))} />
          ))}
          {images.length < MAX_IMAGES ? <Button size="sm" tone="ghost" className="self-start" onClick={() => setImages((xs) => [...xs, null])}><PlusIcon size={14} aria-hidden="true" />{T.addImage}</Button> : null}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4 border-t border-line pt-5">
        <legend className="kd-m pb-1">{T.secContact}</legend>
        <div className="grid gap-4 tab:grid-cols-2">
          <div className="flex flex-col gap-2">
            <FieldLabel htmlFor="ad-contact">{T.contactLabel}</FieldLabel>
            <Input id="ad-contact" value={contact} onChange={(e) => setContact(e.target.value)} maxLength={80} autoComplete="name" invalid={!!err.contact} />
            <FieldError>{err.contact}</FieldError>
          </div>
          <div className="flex flex-col gap-2">
            <FieldLabel htmlFor="ad-phone">{T.phoneLabel}</FieldLabel>
            <Input id="ad-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} autoComplete="tel" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="ad-email">{T.emailLabel}</FieldLabel>
          <Input id="ad-email" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={T.emailPh} maxLength={200} autoComplete="email" invalid={!!err.email} />
          <FieldError>{err.email}</FieldError>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4 border-t border-line pt-5">
        <legend className="kd-m pb-1">{T.secCampaign}</legend>
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="ad-budget" hint={minBudgetLabel(T, lang)}>{fill(T.budgetAmount, { c: AD_CURRENCY })}</FieldLabel>
          <Input id="ad-budget" inputMode="numeric" className="kd-num" invalid={!!err.budget}
            value={budget ? Number(budget).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US') : ''} onChange={(e) => setBudget(e.target.value.replace(/\D/g, '').slice(0, 12))} />
          <FieldError>{err.budget}</FieldError>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2"><FieldLabel htmlFor="ad-from">{T.fromLabel}</FieldLabel><Input id="ad-from" type="date" min={today} value={from} onChange={(e) => setFrom(e.target.value)} invalid={!!err.dates} /></div>
          <div className="flex flex-col gap-2"><FieldLabel htmlFor="ad-to">{T.toLabel}</FieldLabel><Input id="ad-to" type="date" min={from || today} value={to} onChange={(e) => setTo(e.target.value)} invalid={!!err.dates} /></div>
        </div>
        <FieldError>{err.dates}</FieldError>
        <fieldset className="flex flex-col">
          <legend className="kd-flabel pb-1">{T.placeLabel}</legend>
          {PLACEMENTS.map((p) => (
            <label key={p.key} className="flex min-h-11 cursor-pointer items-center gap-3">
              <input type="checkbox" className="kd-check" checked={places[p.key]} onChange={(e) => setPlaces({ ...places, [p.key]: e.target.checked })} />
              <span className="kd-t text-paper">{T[p.label]}</span>
            </label>
          ))}
        </fieldset>
        {allCities.length ? (
          <fieldset className="flex flex-col gap-2">
            <legend className="kd-flabel pb-1">{T.citiesLabel} <span className="font-normal text-fog">· {T.citiesAll}</span></legend>
            <div className="flex flex-wrap gap-1.5">
              {allCities.map((c) => (
                <Chip key={c.slug} on={cities.includes(c.slug)} onClick={() => setCities((xs) => (xs.includes(c.slug) ? xs.filter((x) => x !== c.slug) : [...xs, c.slug]))}>{c.name[lang]}</Chip>
              ))}
            </div>
          </fieldset>
        ) : null}
        <label className="flex min-h-11 cursor-pointer items-center gap-3">
          <input type="checkbox" className="kd-check" checked={alcohol} onChange={(e) => setAlcohol(e.target.checked)} />
          <span className="kd-t text-paper">{T.alcohol}</span>
        </label>
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="ad-msg">{T.msgLabel}</FieldLabel>
          <TextArea id="ad-msg" rows={3} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={T.msgPh} maxLength={2000} />
        </div>
      </fieldset>

      <FieldError>{err.form}</FieldError>
      <Button type="submit" tone="acc" block disabled={busy}>{busy ? T.sending : T.submit}</Button>
    </form>
  );
}

interface Mine {
  id: string; brand: string; status: 'new' | 'approved' | 'declined'; budgetAmount: number | null; currency: string;
  startsOn: string | null; endsOn: string | null; reply: string | null;
}
const TONE: Record<Mine['status'], StatusTone> = { new: 'warn', approved: 'ok', declined: 'bad' };

/** The person's own requests, with the team's answer. Nothing sent yet: nothing shown. */
function MyRequests({ lang }: { lang: Lang }) {
  const T = pick(ADVERTISE, lang);
  const [items, setItems] = useState<Mine[]>([]);
  useEffect(() => { FF.maybe(FF.get('/me/ad-inquiries'), { items: [] }).then((r: { items: Mine[] }) => setItems(r.items)); }, []);
  if (!items.length) return null;
  const status = { new: T.stNew, approved: T.stApproved, declined: T.stDeclined };
  return (
    <section aria-labelledby="ad-mine-h" className="flex flex-col">
      <h2 id="ad-mine-h" className="kd-m pb-1.5">{T.mine}</h2>
      <ul className="flex flex-col border-t border-line">
        {items.map((r) => (
          <li key={r.id} className="flex flex-col gap-1 border-b border-line py-3">
            <span className="flex items-center justify-between gap-3">
              <span className="kd-hs kd-ell">{r.brand}</span>
              <Status tone={TONE[r.status]}>{status[r.status]}</Status>
            </span>
            <span className="kd-s kd-num">
              {[r.budgetAmount != null ? money(r.budgetAmount, r.currency, lang) : null, r.startsOn && r.endsOn ? `${dayMonth(r.startsOn, lang)} – ${dayMonth(r.endsOn, lang)}` : null].filter(Boolean).join(' · ')}
            </span>
            {r.reply ? <span className="kd-s text-mist">{fill(T.reply, { r: r.reply })}</span> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
