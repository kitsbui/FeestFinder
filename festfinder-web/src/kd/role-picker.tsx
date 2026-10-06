'use client';
/**
 * After a first sign-in: fan, artist or organiser. Every account is a fan; an artist or an
 * organiser profile is created (or an existing listing claimed) and its workspace in /ops
 * opens. Admin never comes from here (CLAUDE.md: only the ADMIN_EMAIL allowlist).
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { HeadphonesIcon, MicrophoneStageIcon, StorefrontIcon, ArrowLeftIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { COMMON, pick, type Lang } from './copy';
import { Button, Chip } from './ui/actions';
import { FieldError, FieldLabel, Input } from './ui/forms';
import { Sheet } from './ui/sheet';

const R = {
  title: { en: 'How do you use music?', vi: 'Bạn đến với âm nhạc thế nào?' },
  fan: { en: 'Discover events', vi: 'Khám phá sự kiện' },
  fanSub: { en: 'Music fan', vi: 'Người yêu nhạc' },
  artist: { en: 'Perform music', vi: 'Biểu diễn' },
  artistSub: { en: 'DJ / Producer / Artist', vi: 'DJ / Producer / Nghệ sĩ' },
  org: { en: 'Organize events', vi: 'Tổ chức sự kiện' },
  orgSub: { en: 'Promoter / Venue / Festival', vi: 'Đơn vị tổ chức / Địa điểm / Lễ hội' },
  stage: { en: 'Stage name', vi: 'Nghệ danh' },
  orgName: { en: 'Organiser name', vi: 'Tên nhà tổ chức' },
  city: { en: 'Based in', vi: 'Thành phố' },
  create: { en: 'Create profile', vi: 'Tạo hồ sơ' },
  isYou: { en: 'Already listed? Claim it', vi: 'Đã có trên FeestFinder? Nhận quản lý' },
  claim: { en: 'Claim', vi: 'Nhận' },
  claimed: { en: 'Managed', vi: 'Đã có người quản lý' },
  kind: { en: 'What you do', vi: 'Bạn làm gì' },
  type: { en: 'Kind', vi: 'Loại' },
} as const;

export type RoleStep = 'menu' | 'artist' | 'organizer';
interface Suggestion { id: string; name: string; owned?: boolean; managed?: boolean; events?: number }

export function RolePicker({ lang, start = 'menu', onClose }: { lang: Lang; start?: RoleStep; onClose: (done: boolean) => void }) {
  const C = pick(COMMON, lang);
  const t = pick(R, lang);
  const [step, setStep] = useState<RoleStep>(start);
  const [name, setName] = useState('');
  const [roles, setRoles] = useState<Record<string, boolean>>({ dj: true });
  const [type, setType] = useState('promoter');
  const [city, setCity] = useState('');
  const [cities, setCities] = useState<{ slug: string; name: { vi: string; en: string } }[]>([]);
  const [sug, setSug] = useState<{ artists: Suggestion[]; organizers: Suggestion[] } | null>(null);
  const [err, setErr] = useState('');
  const [clash, setClash] = useState<Suggestion | null>(null);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    FF.once('kd:discovery', () => FF.maybe(FF.get('/meta/discovery'), null)).then((d: any) => d && setCities(d.cities));
  }, []);

  const fan = () => { FF.fire(FF.post('/me/onboarding')); onClose(true); };
  const suggest = (v: string) => {
    if (timer.current) clearTimeout(timer.current);
    if (v.trim().length < 2) { setSug(null); return; }
    timer.current = setTimeout(() => {
      FF.maybe(FF.get('/me/roles/suggestions?q=' + encodeURIComponent(v.trim())), null).then((out: any) => out && setSug(out));
    }, 250);
  };
  const create = async () => {
    if (name.trim().length < 2 || busy) return;
    setBusy(true); setErr(''); setClash(null);
    try {
      if (step === 'artist') {
        await FF.post('/me/roles/artist', { stageName: name.trim(), roles: Object.keys(roles).filter((k) => roles[k]), basedCity: city || null });
        location.assign('/ops/artist');
      } else {
        await FF.post('/me/roles/organizer', { name: name.trim(), type, city: city || null });
        location.assign('/ops/org');
      }
    } catch (e) {
      setBusy(false);
      setErr(FF.errorText(e, lang));
      const d = (e as { details?: Suggestion }).details;
      if (d && d.id) setClash(d);
    }
  };
  const claim = async (id: string) => {
    if (busy) return;
    setBusy(true); setErr('');
    try {
      await FF.post(step === 'artist' ? '/me/roles/artist' : '/me/roles/organizer', step === 'artist' ? { claimArtistId: id } : { claimOrganizerId: id });
      FF.fire(FF.post('/me/onboarding'));
      onClose(true);
    } catch (e) { setBusy(false); setErr(FF.errorText(e, lang)); }
  };

  const card = (label: string, sub: string, icon: ReactNode, go: () => void) => (
    <button type="button" className="kd-opt grid-cols-[auto_minmax(0,1fr)] gap-x-3.5 py-3.5" onClick={go}>
      <span className="row-span-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-paper">{icon}</span>
      <span className="kd-hs">{label}</span>
      <span className="kd-s">{sub}</span>
    </button>
  );
  const list = sug ? (step === 'artist' ? sug.artists : sug.organizers) : [];

  return (
    <Sheet title={t.title} closeLabel={C.close} onClose={fan}>
      {step === 'menu' ? (
        <div className="flex flex-col gap-2 pt-2">
          {card(t.fan, t.fanSub, <HeadphonesIcon size={20} aria-hidden="true" />, fan)}
          {card(t.artist, t.artistSub, <MicrophoneStageIcon size={20} aria-hidden="true" />, () => { setStep('artist'); setName(''); setSug(null); setErr(''); })}
          {card(t.org, t.orgSub, <StorefrontIcon size={20} aria-hidden="true" />, () => { setStep('organizer'); setName(''); setSug(null); setErr(''); })}
        </div>
      ) : (
        <form className="flex flex-col gap-3 pt-1" onSubmit={(e) => { e.preventDefault(); create(); }}>
          <button type="button" className="kd-more" onClick={() => { setStep('menu'); setErr(''); }}>
            <ArrowLeftIcon size={14} aria-hidden="true" />{C.back}
          </button>
          <FieldLabel htmlFor="kd-role-name">{step === 'artist' ? t.stage : t.orgName}</FieldLabel>
          <Input id="kd-role-name" value={name} onChange={(e) => { setName(e.target.value); suggest(e.target.value); }} autoFocus maxLength={80} />
          {list.length ? (
            <div className="flex flex-col gap-1">
              <span className="kd-m">{t.isYou}</span>
              {list.slice(0, 4).map((x) => (
                <div key={x.id} className="kd-lrow min-h-12">
                  <span className="kd-hs min-w-0 flex-1 kd-ell">{x.name}</span>
                  {x.owned || x.managed ? <span className="kd-s">{t.claimed}</span> : <Button size="sm" onClick={() => claim(x.id)} disabled={busy}>{t.claim}</Button>}
                </div>
              ))}
            </div>
          ) : null}
          {step === 'artist' ? (
            <fieldset className="flex flex-col gap-2">
              <legend className="kd-flabel mb-2">{t.kind}</legend>
              <div className="flex flex-wrap gap-2">
                {[['dj', 'DJ'], ['producer', 'Producer'], ['live', 'Live act'], ['band', lang === 'vi' ? 'Ban nhạc' : 'Band']].map(([k, l]) => (
                  <Chip key={k} on={!!roles[k]} onClick={() => setRoles((r) => ({ ...r, [k]: !r[k] }))}>{l}</Chip>
                ))}
              </div>
            </fieldset>
          ) : (
            <fieldset className="flex flex-col gap-2">
              <legend className="kd-flabel mb-2">{t.type}</legend>
              <div className="flex flex-wrap gap-2">
                {[['promoter', lang === 'vi' ? 'Đơn vị tổ chức' : 'Promoter'], ['venue', lang === 'vi' ? 'Club / địa điểm' : 'Club or venue'], ['festival', lang === 'vi' ? 'Lễ hội' : 'Festival'], ['collective', 'Collective']].map(([k, l]) => (
                  <Chip key={k} on={type === k} onClick={() => setType(k)}>{l}</Chip>
                ))}
              </div>
            </fieldset>
          )}
          {cities.length ? (
            <fieldset className="flex flex-col gap-2">
              <legend className="kd-flabel mb-2">{t.city}</legend>
              <div className="flex flex-wrap gap-2">
                {cities.map((c) => <Chip key={c.slug} on={city === c.slug} onClick={() => setCity(city === c.slug ? '' : c.slug)}>{c.name[lang]}</Chip>)}
              </div>
            </fieldset>
          ) : null}
          <FieldError>{err}</FieldError>
          {clash ? <Button onClick={() => claim(clash.id)} disabled={busy}>{t.claim} · {clash.name}</Button> : null}
          <Button type="submit" tone="acc" size="lg" block disabled={busy || name.trim().length < 2}>{t.create}</Button>
        </form>
      )}
    </Sheet>
  );
}
