'use client';
/**
 * The sign-in sheet. Google first; then a one-time code by email (or Zalo / WhatsApp where the
 * server has them), which creates the account and sets a password; or a password for someone
 * who already has one. Only the ways in GET /auth/providers says are configured are shown.
 */
import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeftIcon, EnvelopeSimpleIcon, GoogleLogoIcon, KeyIcon, ChatCircleIcon, WhatsappLogoIcon, FacebookLogoIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { COMMON, pick, type Lang } from './copy';
import { Button } from './ui/actions';
import { FieldError, FieldLabel, Input } from './ui/forms';
import { Sheet } from './ui/sheet';

type Channel = 'email' | 'zalo' | 'wa';
type Step = 'method' | 'id' | 'otp' | 'pass' | 'loginId' | 'loginPass';
interface Ways { google?: boolean; fb?: boolean; ig?: boolean; zalo?: boolean; wa?: boolean; email?: boolean; password?: boolean }

const validId = (v: string, ch: Channel) => {
  const s = v.trim();
  if (ch === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
  return /^(0|\+?\d{2})\d{8,11}$/.test(s.replace(/[\s.-]/g, ''));
};

export function SignInSheet({ lang, note, intent, onClose, onDone }: {
  lang: Lang; note?: string; intent: string | null; onClose: () => void; onDone: (created: boolean) => void;
}) {
  const C = pick(COMMON, lang);
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

  const social = (provider: 'google' | 'fb') => {
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
        const out = await FF.post('/auth/otp/start', { channel, identifier: id.trim() });
        setChallenge(out.challengeId);
        const sent = channel === 'email' ? C.otpSentEmail : channel === 'wa' ? C.otpSentWa : C.otpSentZalo;
        setSentLine(sent + ' ' + id.trim() + (out.devCode ? ' · dev code ' + out.devCode : ''));
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
        if (out.next === 'set_password') { setSignupToken(out.signupToken); setBusy(false); go('pass'); return; }
        onDone(false);
      } catch (x) { fail(x); }
      return;
    }
    if (step === 'pass') {
      if (pass.length < 8) return setErr(C.errPass);
      if (pass !== pass2) return setErr(C.errPass2);
      setBusy(true);
      try {
        await FF.post('/auth/password', { token: signupToken, password: pass, passwordConfirm: pass2 });
        onDone(true);
      } catch (x) { fail(x); }
      return;
    }
    if (step === 'loginId') {
      const ch: Channel = id.includes('@') ? 'email' : 'zalo';
      if (!validId(id, ch)) return setErr(C.errId);
      setPass('');
      go('loginPass');
      return;
    }
    if (step === 'loginPass') {
      if (!pass) return setErr(C.errLoginPass);
      setBusy(true);
      try {
        await FF.post('/auth/login', { identifier: id.trim(), password: pass });
        onDone(false);
      } catch (x) { fail(x); }
    }
  };

  const back = step === 'method' ? null : () => go(step === 'otp' ? 'id' : step === 'pass' ? 'otp' : step === 'loginPass' ? 'loginId' : 'method');
  const title = step === 'otp' ? C.otpTitle : step === 'pass' ? C.passTitle : step === 'loginId' || step === 'loginPass' ? C.loginTitle : C.signIn;

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
              <Button tone="light" size="lg" block onClick={() => social('google')} disabled={busy}>
                <GoogleLogoIcon size={18} weight="bold" aria-hidden="true" />
                {C.withGoogle}
              </Button>
            ) : null}
            {ways?.fb ? (
              <Button size="lg" block onClick={() => social('fb')} disabled={busy}>
                <FacebookLogoIcon size={18} aria-hidden="true" />
                {C.withFacebook}
              </Button>
            ) : null}
            {ways?.email !== false ? (
              <Button size="lg" block onClick={() => { setChannel('email'); setId(''); go('id'); }}>
                <EnvelopeSimpleIcon size={18} aria-hidden="true" />
                {C.withEmail}
              </Button>
            ) : null}
            {ways?.zalo ? (
              <Button size="lg" block onClick={() => { setChannel('zalo'); setId(''); go('id'); }}>
                <ChatCircleIcon size={18} aria-hidden="true" />
                {C.withZalo}
              </Button>
            ) : null}
            {ways?.wa ? (
              <Button size="lg" block onClick={() => { setChannel('wa'); setId(''); go('id'); }}>
                <WhatsappLogoIcon size={18} aria-hidden="true" />
                {C.withWa}
              </Button>
            ) : null}
            {ways?.password !== false ? (
              <Button tone="ghost" block onClick={() => { setId(''); go('loginId'); }}>
                <KeyIcon size={18} aria-hidden="true" />
                {C.withPassword}
              </Button>
            ) : null}
          </>
        ) : null}

        {step === 'id' ? (
          <>
            <FieldLabel htmlFor="kd-auth-id">{channel === 'email' ? C.emailLabel : channel === 'wa' ? C.waLabel : C.zaloLabel}</FieldLabel>
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
            <FieldLabel htmlFor="kd-auth-pass" hint={C.passHint}>{C.passLabel}</FieldLabel>
            <Input id="kd-auth-pass" type="password" autoComplete="new-password" value={pass} onChange={(e) => setPass(e.target.value)} autoFocus />
            <FieldLabel htmlFor="kd-auth-pass2">{C.pass2Label}</FieldLabel>
            <Input id="kd-auth-pass2" type="password" autoComplete="new-password" value={pass2} onChange={(e) => setPass2(e.target.value)} invalid={!!err} />
            <FieldError>{err}</FieldError>
            <Button type="submit" tone="acc" size="lg" block disabled={busy}>{C.createAccount}</Button>
          </>
        ) : null}

        {step === 'loginId' ? (
          <>
            <FieldLabel htmlFor="kd-auth-login">{C.loginIdLabel}</FieldLabel>
            <Input id="kd-auth-login" autoComplete="username" value={id} onChange={(e) => setId(e.target.value)} autoFocus invalid={!!err} />
            <FieldError>{err}</FieldError>
            <Button type="submit" tone="acc" size="lg" block>{C.continue}</Button>
          </>
        ) : null}

        {step === 'loginPass' ? (
          <>
            <p className="kd-s">{id.trim()}</p>
            <FieldLabel htmlFor="kd-auth-lpass">{C.passLabel}</FieldLabel>
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
