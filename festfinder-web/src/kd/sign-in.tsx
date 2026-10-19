'use client';
/**
 * The sign-in sheet. Google first; then a one-time code by email, SMS, Zalo or WhatsApp (where the
 * server has them, phase 17: SMS and Zalo are real providers), which creates the account and sets a password; or a password for someone
 * who already has one. Only the ways in GET /auth/providers says are configured are shown.
 */
import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeftIcon, DeviceMobileIcon, EnvelopeSimpleIcon, GoogleLogoIcon, InstagramLogoIcon, KeyIcon, ChatCircleIcon, TiktokLogoIcon, WhatsappLogoIcon, FacebookLogoIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { COMMON, pick, type Lang } from './copy';
import { SIGN_IN } from './sign-in-copy';
import { Button } from './ui/actions';
import { FieldError, FieldLabel, Input } from './ui/forms';
import { Sheet } from './ui/sheet';

type Channel = 'email' | 'sms' | 'zalo' | 'wa';
type Step = 'method' | 'id' | 'otp' | 'pass' | 'loginId' | 'loginPass';
interface Ways { google?: boolean; fb?: boolean; ig?: boolean; tiktok?: boolean; sms?: boolean; zalo?: boolean; wa?: boolean; email?: boolean; password?: boolean }

const validId = (v: string, ch: Channel) => {
  const s = v.trim();
  if (ch === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
  return /^(0|\+?\d{2})\d{8,11}$/.test(s.replace(/[\s.-]/g, ''));
};

export function SignInSheet({ lang, note, intent, onClose, onDone }: {
  lang: Lang; note?: string; intent: string | null; onClose: () => void; onDone: (created: boolean) => void;
}) {
  const C = pick(COMMON, lang);
  const S = pick(SIGN_IN, lang);
  const [ways, setWays] = useState<Ways | null>(null);
  const [step, setStep] = useState<Step>('method');
  const [channel, setChannel] = useState<Channel>('email');
  const [id, setId] = useState('');
  const [code, setCode] = useState('');
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [challenge, setChallenge] = useState('');
  const [signupToken, setSignupToken] = useState('');
  const [sentLine, setSentLine] = useState('');
  const [err, setErr] = useState(note ?? '');
  const [busy, setBusy] = useState(false);

  useEffect(() => { FF.authProviders().then(setWays); }, []);

  const fail = (e: unknown) => { setErr(FF.errorText(e, lang)); setBusy(false); };
  const go = (s: Step) => { setErr(''); setStep(s); };

  const social = (provider: 'google' | 'fb' | 'ig' | 'tiktok') => {
    setBusy(true);
    setErr('');
    FF.oauthStart(provider, intent).catch(fail);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setErr('');
    if (step === 'id') {
      if (!validId(id, channel)) return setErr(channel === 'email' ? C.errEmail : C.errPhone);
      setBusy(true);
      try {
        // The email's link comes back to this page (phase 17).
        const out = await FF.post('/auth/otp/start', { channel, identifier: id.trim(), ...(channel === 'email' ? { redirectUri: location.href } : {}) });
        setChallenge(out.challengeId);
        const sent = channel === 'email' ? S.otpSentEmail : channel === 'sms' ? C.otpSentSms : channel === 'wa' ? C.otpSentWa : C.otpSentZalo;
        setSentLine(sent + ' ' + id.trim() + (out.devCode ? ' · dev code ' + out.devCode : '') + (channel === 'email' ? ' · ' + S.otpEmailLink : ''));
        setCode('');
        setBusy(false);
        go('otp');
      } catch (x) { fail(x); }
      return;
    }
    if (step === 'otp') {
      if (!/^\d{6}$/.test(code)) return setErr(C.errOtp);
      setBusy(true);
      try {
        const out = await FF.post('/auth/otp/verify', { challengeId: challenge, code });
        // No password step (phase 17): the code made or opened the account.
        onDone(!!out.created);
      } catch (x) { fail(x); }
      return;
    }
    if (step === 'pass') {
      if (pass.length < 8) return setErr(S.errPass);
      if (pass !== pass2) return setErr(S.errPass2);
      setBusy(true);
      try {
        await FF.post('/auth/password', { token: signupToken, password: pass, passwordConfirm: pass2 });
        onDone(true);
      } catch (x) { fail(x); }
      return;
    }
    if (step === 'loginId') {
      const ch: Channel = id.includes('@') ? 'email' : 'zalo';
      if (!validId(id, ch)) return setErr(S.errId);
      setPass('');
      go('loginPass');
      return;
    }
    if (step === 'loginPass') {
      if (!pass) return setErr(S.errLoginPass);
      setBusy(true);
      try {
        await FF.post('/auth/login', { identifier: id.trim(), password: pass });
        onDone(false);
      } catch (x) { fail(x); }
    }
  };

  const back = step === 'method' ? null : () => go(step === 'otp' ? 'id' : step === 'pass' ? 'otp' : step === 'loginPass' ? 'loginId' : 'method');
  const title = step === 'otp' ? C.otpTitle : step === 'pass' ? S.passTitle : step === 'loginId' || step === 'loginPass' ? S.loginTitle : C.signIn;

  return (
    <Sheet onClose={onClose} title={title} closeLabel={C.close}>
      <form onSubmit={submit} className="flex flex-col gap-3 pt-2" noValidate>
        {back ? (
          <button type="button" className="kd-more -mt-1 mb-1" onClick={back}>
            <ArrowLeftIcon size={14} aria-hidden="true" />
            {C.back}
          </button>
        ) : null}

        {step === 'method' ? (
          <>
            {ways?.google !== false ? (
              <Button size="lg" block onClick={() => social('google')} disabled={busy}>
                <GoogleLogoIcon size={18} weight="bold" aria-hidden="true" />
                {S.withGoogle}
              </Button>
            ) : null}
            {ways?.fb ? (
              <Button size="lg" block onClick={() => social('fb')} disabled={busy}>
                <FacebookLogoIcon size={18} aria-hidden="true" />
                {S.withFacebook}
              </Button>
            ) : null}
            {/* The phone ways first where they exist (Vietnam signs in by phone): Zalo, then SMS; then email. */}
            {ways?.zalo ? (
              <Button size="lg" block onClick={() => { setChannel('zalo'); setId(''); go('id'); }}>
                <ChatCircleIcon size={18} aria-hidden="true" />
                {S.withZalo}
              </Button>
            ) : null}
            {ways?.sms ? (
              <Button size="lg" block onClick={() => { setChannel('sms'); setId(''); go('id'); }}>
                <DeviceMobileIcon size={18} aria-hidden="true" />
                {S.withSms}
              </Button>
            ) : null}
            {ways?.email !== false ? (
              <Button size="lg" block onClick={() => { setChannel('email'); setId(''); go('id'); }}>
                <EnvelopeSimpleIcon size={18} aria-hidden="true" />
                {S.withEmail}
              </Button>
            ) : null}
            {ways?.wa ? (
              <Button size="lg" block onClick={() => { setChannel('wa'); setId(''); go('id'); }}>
                <WhatsappLogoIcon size={18} aria-hidden="true" />
                {S.withWa}
              </Button>
            ) : null}
            {ways?.ig ? (
              <Button size="lg" block onClick={() => social('ig')} disabled={busy}>
                <InstagramLogoIcon size={18} aria-hidden="true" />
                {S.withInstagram}
              </Button>
            ) : null}
            {ways?.tiktok ? (
              <Button size="lg" block onClick={() => social('tiktok')} disabled={busy}>
                <TiktokLogoIcon size={18} aria-hidden="true" />
                {S.withTiktok}
              </Button>
            ) : null}
            {ways?.password !== false ? (
              <Button tone="ghost" block onClick={() => { setId(''); go('loginId'); }}>
                <KeyIcon size={18} aria-hidden="true" />
                {S.withPassword}
              </Button>
            ) : null}
          </>
        ) : null}

        {step === 'id' ? (
          <>
            <FieldLabel htmlFor="kd-auth-id">{channel === 'email' ? C.emailLabel : channel === 'sms' ? C.smsLabel : channel === 'wa' ? C.waLabel : C.zaloLabel}</FieldLabel>
            <Input
              id="kd-auth-id"
              type={channel === 'email' ? 'email' : 'tel'}
              autoComplete={channel === 'email' ? 'email' : 'tel'}
              inputMode={channel === 'email' ? 'email' : 'tel'}
              placeholder={channel === 'email' ? C.emailPh : C.phonePh}
              value={id}
              onChange={(e) => setId(e.target.value)}
              autoFocus
              invalid={!!err}
            />
            <FieldError>{err}</FieldError>
            <Button type="submit" tone="acc" size="lg" block disabled={busy}>{C.sendCode}</Button>
          </>
        ) : null}

        {step === 'otp' ? (
          <>
            <p className="kd-s">{sentLine}</p>
            <FieldLabel htmlFor="kd-auth-otp" hint={C.otpHint}>{C.otpTitle}</FieldLabel>
            <Input
              id="kd-auth-otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="kd-num tracking-[0.3em]"
              autoFocus
              invalid={!!err}
            />
            <FieldError>{err}</FieldError>
            <Button type="submit" tone="acc" size="lg" block disabled={busy}>{C.verify}</Button>
          </>
        ) : null}

        {step === 'pass' ? (
          <>
            <FieldLabel htmlFor="kd-auth-pass" hint={S.passHint}>{S.passLabel}</FieldLabel>
            <Input id="kd-auth-pass" type="password" autoComplete="new-password" value={pass} onChange={(e) => setPass(e.target.value)} autoFocus />
            <FieldLabel htmlFor="kd-auth-pass2">{S.pass2Label}</FieldLabel>
            <Input id="kd-auth-pass2" type="password" autoComplete="new-password" value={pass2} onChange={(e) => setPass2(e.target.value)} invalid={!!err} />
            <FieldError>{err}</FieldError>
            <Button type="submit" tone="acc" size="lg" block disabled={busy}>{S.createAccount}</Button>
          </>
        ) : null}

        {step === 'loginId' ? (
          <>
            <FieldLabel htmlFor="kd-auth-login">{S.loginIdLabel}</FieldLabel>
            <Input id="kd-auth-login" autoComplete="username" value={id} onChange={(e) => setId(e.target.value)} autoFocus invalid={!!err} />
            <FieldError>{err}</FieldError>
            <Button type="submit" tone="acc" size="lg" block>{C.continue}</Button>
          </>
        ) : null}

        {step === 'loginPass' ? (
          <>
            <p className="kd-s">{id.trim()}</p>
            <FieldLabel htmlFor="kd-auth-lpass">{S.passLabel}</FieldLabel>
            <Input id="kd-auth-lpass" type="password" autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} autoFocus invalid={!!err} />
            <FieldError>{err}</FieldError>
            <Button type="submit" tone="acc" size="lg" block disabled={busy}>{C.signIn}</Button>
          </>
        ) : null}

        {step === 'method' && err ? <FieldError>{err}</FieldError> : null}
      </form>
    </Sheet>
  );
}
