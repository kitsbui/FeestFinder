'use client';
/**
 * The advertising enquiry (POST /ad-inquiries): brand, category, work email, monthly budget,
 * placements and a note. Signed out, a sign-in card stands in for it (the API takes enquiries
 * from accounts only). Sent, it says so in place and can start another.
 */
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { CheckCircleIcon, CoffeeIcon, HeartbeatIcon, TShirtIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { COMMON, pick, type Lang } from '../../copy';
import { useKd } from '../../runtime';
import { Button, buttonClass } from '../../ui/actions';
import { FieldError, FieldLabel, Input, Segmented, Select, TextArea } from '../../ui/forms';
import { Card } from '../../ui/parts';
import { ADVERTISE } from './copy';
import { BUDGETS, CATEGORIES, DEFAULT_BUDGET, PLACEMENTS, budgetLabel, looksLikeEmail, type Category, type Placement } from './model';

const CAT_ICON = { 'F&B': CoffeeIcon, Fashion: TShirtIcon, Healthcare: HeartbeatIcon } as const;

export function AdEnquiry({ lang }: { lang: Lang }) {
  const kd = useKd();
  const T = pick(ADVERTISE, lang);
  // Each enquiry is a fresh form: "Send another" mounts a new one.
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
    <EnquiryForm
      key={kd.user.id + ':' + round} lang={lang} email={kd.user.email ?? ''}
      focusFirst={round > 0} onAnother={() => setRound((n) => n + 1)}
    />
  );
}

type Errors = { brand?: string; email?: string; form?: string };

function EnquiryForm({ lang, email: accountEmail, focusFirst, onAnother }: { lang: Lang; email: string; focusFirst: boolean; onAnother: () => void }) {
  const kd = useKd();
  const T = pick(ADVERTISE, lang);
  const [brand, setBrand] = useState('');
  const [cat, setCat] = useState<Category>('F&B');
  const [email, setEmail] = useState(accountEmail);
  const [budget, setBudget] = useState(DEFAULT_BUDGET);
  const [places, setPlaces] = useState<Record<Placement, boolean>>({ feed: true, banner: true, live: false });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const brandRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const sentRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => { if (sent) sentRef.current?.focus(); }, [sent]);
  // A new enquiry after one was sent starts at its first field (the button that asked for it is gone).
  useEffect(() => { if (focusFirst) brandRef.current?.focus(); }, [focusFirst]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const check: Errors = {
      brand: brand.trim() ? undefined : T.errBrand,
      email: looksLikeEmail(email.trim()) ? undefined : T.errEmail,
    };
    setErr(check);
    if (check.brand) return brandRef.current?.focus();
    if (check.email) return emailRef.current?.focus();
    const placements = PLACEMENTS.filter((p) => places[p.key]).map((p) => p.key);
    setBusy(true);
    try {
      const out = await FF.post('/ad-inquiries', {
        brand: brand.trim(), category: cat, email: email.trim(), budget,
        // The API takes at least one; with none ticked, the feed card is the default.
        placements: placements.length ? placements : ['feed'],
        message: msg.trim(),
      });
      setSent(FF.text((out as { message?: unknown } | null)?.message, lang) || T.submitted);
    } catch (x) {
      const { code, status } = x as { code?: string; status?: number };
      if (status === 401) kd.openSignIn(T.gate);
      if (code === 'brand_required') { setErr({ brand: FF.errorText(x, lang) }); brandRef.current?.focus(); }
      else if (code === 'invalid_email') { setErr({ email: FF.errorText(x, lang) }); emailRef.current?.focus(); }
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

      <div className="flex flex-col gap-2">
        <FieldLabel htmlFor="ad-brand">{T.brandLabel}</FieldLabel>
        <Input
          id="ad-brand" ref={brandRef} value={brand} onChange={(e) => setBrand(e.target.value)} placeholder={T.brandPh}
          maxLength={80} autoComplete="organization" invalid={!!err.brand} aria-describedby={err.brand ? 'ad-brand-err' : undefined}
        />
        <FieldError id="ad-brand-err">{err.brand}</FieldError>
      </div>

      <div className="flex flex-col gap-2">
        <span className="kd-flabel" aria-hidden="true">{T.catLabel}</span>
        <Segmented
          label={T.catLabel}
          value={cat}
          onChange={setCat}
          full
          options={CATEGORIES.map((c) => {
            const Icon = CAT_ICON[c.key];
            return { value: c.key, label: <span className="flex items-center justify-center gap-1.5"><Icon size={16} aria-hidden="true" />{T[c.label]}</span> };
          })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <FieldLabel htmlFor="ad-email">{T.emailLabel}</FieldLabel>
        <Input
          id="ad-email" ref={emailRef} type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={T.emailPh}
          maxLength={200} autoComplete="email" invalid={!!err.email} aria-describedby={err.email ? 'ad-email-err' : undefined}
        />
        <FieldError id="ad-email-err">{err.email}</FieldError>
      </div>

      <div className="flex flex-col gap-2">
        <FieldLabel htmlFor="ad-budget">{T.budgetLabel}</FieldLabel>
        <Select id="ad-budget" value={budget} onChange={(e) => setBudget(e.target.value)}>
          {BUDGETS.map((b) => <option key={b.value} value={b.value}>{budgetLabel(b, T, lang)}</option>)}
        </Select>
      </div>

      <fieldset className="flex flex-col">
        <legend className="kd-flabel pb-1">{T.placeLabel}</legend>
        {PLACEMENTS.map((p) => (
          <label key={p.key} className="flex min-h-11 cursor-pointer items-center gap-3">
            <input type="checkbox" className="kd-check" checked={places[p.key]} onChange={(e) => setPlaces({ ...places, [p.key]: e.target.checked })} />
            <span className="kd-t text-paper">{T[p.label]}</span>
          </label>
        ))}
      </fieldset>

      <div className="flex flex-col gap-2">
        <FieldLabel htmlFor="ad-msg">{T.msgLabel}</FieldLabel>
        <TextArea id="ad-msg" rows={3} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={T.msgPh} maxLength={2000} />
      </div>

      <FieldError>{err.form}</FieldError>
      <Button type="submit" tone="acc" block disabled={busy}>{busy ? T.sending : T.submit}</Button>
    </form>
  );
}
