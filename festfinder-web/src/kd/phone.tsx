'use client';
/**
 * Proving a phone number with a one-time code over Zalo (or WhatsApp): what the API asks for
 * before someone writes in a discussion (`phone_unverified`).
 */
import { useState, type FormEvent } from 'react';
import { FF } from '@/runtime/ff';
import { COMMON, pick, type Lang } from './copy';
import { Button } from './ui/actions';
import { FieldError, FieldLabel, Input, Segmented } from './ui/forms';
import { Sheet } from './ui/sheet';

const P = {
  title: { en: 'Confirm your phone', vi: 'Xác thực số điện thoại' },
  via: { en: 'Send the code on', vi: 'Gửi mã qua' },
} as const;

export function PhoneSheet({ lang, onDone, onClose }: { lang: Lang; onDone: () => void; onClose: () => void }) {
  const C = pick(COMMON, lang);
  const t = pick(P, lang);
  const [via, setVia] = useState<'zalo' | 'wa'>('zalo');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [challenge, setChallenge] = useState<string | null>(null);
  const [sent, setSent] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setErr('');
    if (!challenge) {
      if (!/^(0|\+?\d{2})\d{8,11}$/.test(phone.replace(/[\s.-]/g, ''))) return setErr(C.errPhone);
      setBusy(true);
      try {
        const out = await FF.post('/me/connections/' + via + '/start', { phone: phone.trim() });
        setChallenge(out.challengeId);
        setSent((via === 'wa' ? C.otpSentWa : C.otpSentZalo) + ' ' + phone.trim() + (out.devCode ? ' · dev code ' + out.devCode : ''));
      } catch (x) { setErr(FF.errorText(x, lang)); }
      setBusy(false);
      return;
    }
    if (!/^\d{6}$/.test(code)) return setErr(C.errOtp);
    setBusy(true);
    try {
      await FF.post('/me/connections/' + via + '/verify', { challengeId: challenge, code });
      await FF.refreshSession();
      onDone();
    } catch (x) { setErr(FF.errorText(x, lang)); setBusy(false); }
  };
  return (
    <Sheet title={t.title} closeLabel={C.close} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3 pt-2" noValidate>
        {!challenge ? (
          <>
            <span className="kd-flabel">{t.via}</span>
            <Segmented label={t.via} value={via} onChange={setVia} full options={[{ value: 'zalo', label: 'Zalo' }, { value: 'wa', label: 'WhatsApp' }]} />
            <FieldLabel htmlFor="kd-phone">{via === 'wa' ? C.waLabel : C.zaloLabel}</FieldLabel>
            <Input id="kd-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder={C.phonePh} value={phone} onChange={(e) => setPhone(e.target.value)} autoFocus invalid={!!err} />
            <FieldError>{err}</FieldError>
            <Button type="submit" tone="acc" size="lg" block disabled={busy}>{C.sendCode}</Button>
          </>
        ) : (
          <>
            <p className="kd-s">{sent}</p>
            <FieldLabel htmlFor="kd-phone-otp" hint={C.otpHint}>{C.otpTitle}</FieldLabel>
            <Input id="kd-phone-otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} autoFocus invalid={!!err} className="kd-num tracking-[0.3em]" />
            <FieldError>{err}</FieldError>
            <Button type="submit" tone="acc" size="lg" block disabled={busy}>{C.verify}</Button>
          </>
        )}
      </form>
    </Sheet>
  );
}
