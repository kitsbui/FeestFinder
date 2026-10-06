'use client';
/**
 * /studio/door in Kính đêm (design/Studio-Checkin): a phone screen for the gate. The gate
 * picker, a QR viewfinder (the camera, where the browser can read QR codes), the code field a
 * hardware scanner types into, the result as a full-width banner (Hợp lệ green, Đã dùng amber,
 * Không hợp lệ red, each with its own icon shape and words), "x / capacity đã vào" with the rate,
 * and the last scans. Below it, the door staff and their invites.
 *
 * With no signal, scans are judged on the device from the ticket list downloaded when the screen
 * opened (refreshed every 20 seconds), kept on the device, and synced once the signal is back.
 */
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeftIcon, CameraIcon, CaretDownIcon, CheckIcon, PauseIcon, PlayIcon, TrashIcon, WarningIcon, XIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang, type Pair } from '../copy';
import { cx } from '../cx';
import { count, dayMonth } from '../format';
import { KdLink } from '../link';
import { useKd } from '../runtime';
import { Button, IconButton } from '../ui/actions';
import { FieldLabel, Input, Segmented, Select } from '../ui/forms';
import { Menu, MenuItem } from '../ui/menu';
import { BarTrack, Card as Panel, Status } from '../ui/parts';
import { STUDIO } from './copy';
import { useStudio } from './root';

type Gate = 'main' | 'vip' | 'side';
type Result = 'valid' | 'duplicate' | 'invalid';
interface Scan { result: Result; message: Pair; detail: Pair; name: string; tier: string | null; time: string; queued?: boolean; code?: string }
interface Staff { id: string; name: string; phone: string; gate: Gate; role: 'scanner' | 'lead'; status: 'scanning' | 'paused' | 'invited'; scanCount: number; online: boolean }
interface Summary { inside: number; capacity: number; throughputPerHour: number; recent: Scan[]; staff: Staff[]; scannersActive: number }
interface Manifest { event: { id: string }; scanKey: string; cursor: number; tickets: { code: string; status: string; tier: string | null; v: number; name: string }[] }
interface Queued { token: string; clientScanId: string; scannedAt: string; manual: boolean; gate: Gate }

const qKey = (id: string) => 'ff_door_q:' + id;
/** No signal, as far as the browser knows. */
const offline = () => typeof navigator !== 'undefined' && navigator.onLine === false;
function readQueue(id: string): Queued[] {
  try { return JSON.parse(localStorage.getItem(qKey(id)) || '[]'); } catch { return []; }
}
function writeQueue(id: string, q: Queued[]) {
  try { if (q.length) localStorage.setItem(qKey(id), JSON.stringify(q)); else localStorage.removeItem(qKey(id)); } catch { /* storage blocked: the queue stays in memory */ }
}

export function Door() {
  const { lang, event, events, setEvent } = useStudio();
  const T = pick(STUDIO, lang);
  // The door is for events with tickets: the live ones, soonest first.
  const list = events.filter((e) => e.status === 'live');
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="kd-bar sticky top-0 z-20 gap-2 border-b border-line bg-void pl-1">
        <KdLink className="kd-ib" href="/studio" aria-label={T.backToStudio}><ArrowLeftIcon size={20} aria-hidden="true" /></KdLink>
        <div className="flex min-w-0 flex-col">
          <h1 className="kd-hs">{T.door}</h1>
          {event ? (
            <Menu
              label={T.pickEvent}
              width={320}
              trigger={(p) => (
                <button type="button" {...p} ref={p.ref} className="kd-m kd-ell flex items-center gap-1 text-left hover:text-paper">
                  {event.title}{event.startsOn ? ' · ' + dayMonth(event.startsOn, lang) : ''}<CaretDownIcon size={12} aria-hidden="true" />
                </button>
              )}
            >
              {list.map((e) => (
                <MenuItem key={e.id} checked={e.id === event.id} aside={e.startsOn ? dayMonth(e.startsOn, lang) : null} onSelect={() => setEvent(e.id)}>{e.title}</MenuItem>
              ))}
            </Menu>
          ) : null}
        </div>
      </header>
      {event ? <Gatekeeper key={event.id} lang={lang} eventId={event.id} /> : <p className="kd-s p-4">{T.noEvent}</p>}
    </div>
  );
}

function Gatekeeper({ lang, eventId }: { lang: Lang; eventId: string }) {
  const T = pick(STUDIO, lang);
  const kd = useKd();
  const [gate, setGate] = useState<Gate>('main');
  const [code, setCode] = useState('');
  const [result, setResult] = useState<(Scan & { gate: Gate }) | null>(null);
  const [sum, setSum] = useState<Summary | null>(null);
  const [online, setOnline] = useState(true);
  const [queue, setQueue] = useState<Queued[]>([]);
  const [syncing, setSyncing] = useState(false);
  const manifest = useRef<Manifest | null>(null);
  const seen = useRef<Record<string, number>>({});
  const field = useRef<HTMLInputElement>(null);

  const reload = useCallback(async () => {
    const d = await FF.maybe(FF.get(`/door/events/${eventId}/summary`), null);
    if (d) setSum(d);
  }, [eventId]);

  // The summary, the ticket list for offline use (then only what changed, every 20 seconds), and any scans left on this device.
  useEffect(() => {
    setQueue(readQueue(eventId));
    setOnline(!offline());
    reload();
    FF.maybe(FF.get(`/door/events/${eventId}/manifest`), null).then((m: Manifest | null) => { if (m) manifest.current = m; });
    const tick = setInterval(async () => {
      const m = manifest.current;
      if (!m || offline()) return;
      const d: Manifest | null = await FF.maybe(FF.get(`/door/events/${eventId}/manifest?since=${m.cursor || 0}`), null);
      if (!d || manifest.current !== m) return;
      const at = new Map(m.tickets.map((t, i) => [t.code, i]));
      for (const t of d.tickets) { const i = at.get(t.code); if (i === undefined) m.tickets.push(t); else m.tickets[i] = t; }
      m.cursor = d.cursor;
    }, 20_000);
    const up = () => setOnline(true), down = () => setOnline(false);
    addEventListener('online', up);
    addEventListener('offline', down);
    return () => { clearInterval(tick); removeEventListener('online', up); removeEventListener('offline', down); };
  }, [eventId, reload]);

  const show = useCallback((s: Scan) => {
    setResult({ ...s, gate });
    setSum((x) => x && { ...x, inside: s.result === 'valid' ? x.inside + 1 : x.inside, recent: [s, ...x.recent].slice(0, 6) });
  }, [gate]);

  /** No signal: judge the scan from the downloaded list and keep it on the device. */
  const hold = useCallback(async (token: string) => {
    const dot = token.lastIndexOf('.');
    // A ticket that changed hands carries its version: "<code>~<v>.<sig>", signed over "<code>~<v>".
    const payload = dot > 0 ? token.slice(0, dot) : token, sig = dot > 0 ? token.slice(dot + 1) : null;
    const tilde = payload.lastIndexOf('~');
    const version = tilde > 0 && /^\d+$/.test(payload.slice(tilde + 1)) ? +payload.slice(tilde + 1) : 0;
    const code = version ? payload.slice(0, tilde) : payload;
    const m = manifest.current;
    let t = m?.tickets.find((x) => x.code === code) ?? null;
    const forged = !!(sig && m && (await FF.hmac22(m.scanKey, payload)) !== sig);
    // A genuine QR newer than this device's list: the ticket moved after the last download.
    if (!forged && sig && m && (!t || version > (t.v || 0))) {
      if (!t) { t = { code, status: 'valid', tier: null, name: '', v: version }; m.tickets.push(t); } else t.v = version;
    }
    const no = (en: string, vi: string): Pick<Scan, 'result' | 'message' | 'detail'> => ({ result: 'invalid', message: { en: 'Rejected', vi: 'Từ chối' }, detail: { en, vi } });
    const local: Pick<Scan, 'result' | 'message' | 'detail'> = !t || forged
      ? no('Not a ticket for this event', 'Không phải vé của sự kiện này')
      : sig && version < (t.v || 0) ? no('This QR was replaced when the ticket changed hands', 'Vé đã chuyển nhượng, QR này hết hiệu lực')
      : t.status === 'refunded' || t.status === 'void' ? no('Refunded ticket — do not admit', 'Vé đã hoàn tiền — không cho vào')
      : t.status === 'used' || (code in seen.current && seen.current[code] >= version)
        ? { result: 'duplicate', message: { en: 'Already used — call a gate lead', vi: 'Vé đã dùng — gọi trưởng cửa' }, detail: { en: 'Already scanned on this device', vi: 'Đã quét trên máy này' } }
        : { result: 'valid', message: { en: 'Valid — let them in', vi: 'Hợp lệ — mời vào' }, detail: { en: `${t.tier || 'GA'} · saved offline, will sync`, vi: `${t.tier || 'GA'} · lưu offline, chờ đồng bộ` } };
    if (local.result === 'valid') seen.current[code] = version;
    const at = FF.now().toISOString();
    setQueue((q) => { const next = [...q, { token, clientScanId: 'q' + Date.now(), scannedAt: at, manual: !sig, gate }]; writeQueue(eventId, next); return next; });
    show({ ...local, name: t?.name || '—', tier: t?.tier ?? null, time: FF.hhmm(at), queued: true, code });
  }, [eventId, gate, show]);

  const scan = useCallback(async (raw: string) => {
    const token = raw.trim();
    if (token.length < 4) { kd.toast(T.codeShort); return; }
    if (!online || offline()) return hold(token);
    try {
      const r = await FF.post(`/door/events/${eventId}/scans`, { token, deviceId: FF.deviceId(), clientScanId: 'c' + Date.now(), gate, manual: token.indexOf('.') < 0 });
      show({ result: r.result, message: r.message, detail: r.detail, name: r.holder?.name ?? '—', tier: r.holder?.tier ?? null, time: r.time });
    } catch (e) {
      // Lost signal on the way: keep the scan on the device instead of losing it.
      const status = (e as { status?: number }).status;
      if (offline() || !status) { setOnline(false); return hold(token); }
      kd.toast(FF.errorText(e, lang));
    }
  }, [T.codeShort, eventId, gate, hold, kd, lang, online, show]);

  const sync = useCallback(async () => {
    if (syncing || !queue.length) return;
    setSyncing(true);
    const sending = queue.slice();
    try {
      const out = await FF.post(`/door/events/${eventId}/scans/sync`, { deviceId: FF.deviceId(), scans: sending.map(({ token, clientScanId, scannedAt, manual, gate: g }) => ({ token, clientScanId, scannedAt, manual, gate: g })) });
      setQueue((q) => { const next = q.slice(sending.length); writeQueue(eventId, next); return next; });
      setOnline(true);
      kd.toast(FF.text(out.message, lang));
      reload();
    } catch { kd.toast(T.notSynced); }
    setSyncing(false);
  }, [T.notSynced, eventId, kd, lang, queue, reload, syncing]);

  // Back online with scans on the device: send them.
  useEffect(() => { if (online && queue.length) sync(); }, [online]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = (e: FormEvent) => { e.preventDefault(); const c = code; setCode(''); scan(c); field.current?.focus(); };
  const R = result ? {
    valid: { bg: 'bg-ok', icon: <CheckIcon size={26} weight="bold" aria-hidden="true" />, shape: 'rounded-full', color: 'text-ok', title: T.rValid },
    duplicate: { bg: 'bg-warn', icon: <WarningIcon size={26} weight="bold" aria-hidden="true" />, shape: 'rounded-xl', color: 'text-warn', title: T.rUsed },
    invalid: { bg: 'bg-hot', icon: <XIcon size={26} weight="bold" aria-hidden="true" />, shape: 'rounded-sm', color: 'text-hot', title: T.rInvalid },
  }[result.result] : null;
  const gates: { value: Gate; label: string }[] = [{ value: 'main', label: T.gateMain }, { value: 'vip', label: T.gateVip }, { value: 'side', label: T.gateSide }];

  return (
    <div className="mx-auto flex w-full max-w-[1080px] flex-wrap gap-x-8 gap-y-6 px-4 pb-10 pt-1.5">
      <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-3 md:max-w-[480px]">
        <div className="flex min-h-10 items-center justify-between gap-2">
          {online ? <Status tone="ok">{T.online}</Status> : <Status tone="warn">{queue.length ? fill(T.offline, { n: queue.length }) : T.offlineNone}</Status>}
          {queue.length ? <Button size="sm" disabled={syncing} onClick={sync}>{syncing ? T.syncing : T.sync}</Button> : null}
        </div>
        <Segmented full label={T.gatePick} value={gate} onChange={setGate} options={gates} />
        <Viewfinder lang={lang} onCode={scan} />
        <form className="flex gap-2" onSubmit={submit}>
          <label className="sr-only" htmlFor="doorCode">{T.code}</label>
          <Input ref={field} id="doorCode" boxClass="flex-1" className="kd-num font-mono text-sm tracking-[0.04em]" value={code} placeholder={T.codePh} autoComplete="off" autoCapitalize="characters" spellCheck={false} onChange={(e) => setCode(e.target.value)} />
          <Button tone="acc" type="submit">{T.check}</Button>
        </form>
        <div role="status" aria-live="polite">
          {result && R ? (
            <div className={cx('flex items-center gap-3.5 rounded-xl p-4 text-ink', R.bg)}>
              <span className={cx('flex size-13 shrink-0 items-center justify-center bg-void', R.shape, R.color)}>{R.icon}</span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="kd-num font-mono text-[11px] uppercase tracking-[0.03em]">{result.time} · {gates.find((x) => x.value === result.gate)?.label}{result.queued ? ' · ' + T.queued : ''}</span>
                <span className="text-[26px] font-medium leading-[1.1] tracking-[-0.03em]">{R.title}</span>
                <span className="text-[13px]">{[result.name !== '—' ? result.name : null, result.detail[lang]].filter(Boolean).join(' · ')}</span>
              </div>
            </div>
          ) : null}
        </div>
        {sum ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <span className="flex items-baseline gap-1.5"><span className="kd-d3 kd-num">{count(sum.inside, lang)}</span><span className="kd-s kd-num">{fill(T.inside, { n: count(sum.capacity, lang) })}</span></span>
              <span className="kd-m kd-num">{fill(T.perHour, { n: count(sum.throughputPerHour, lang) })}</span>
            </div>
            <BarTrack value={sum.inside} max={Math.max(sum.capacity, 1)} label={fill(T.inside, { n: sum.capacity })} />
          </div>
        ) : <div className="kd-skel h-12" aria-hidden="true" />}
        <section className="flex flex-col border-t border-line" aria-label={T.recentScans}>
          <span className="kd-m pb-1 pt-3">{T.recentScans}</span>
          {sum?.recent.length ? sum.recent.map((x, i) => (
            <div key={i} className="grid min-h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-line">
              <div className="flex min-w-0 flex-col">
                <span className="kd-hs kd-ell">{x.name}</span>
                <span className="kd-m kd-num kd-ell">{x.tier ?? x.detail[lang]}</span>
              </div>
              <Status tone={x.result === 'valid' ? 'ok' : x.result === 'duplicate' ? 'warn' : 'bad'}>{(x.result === 'valid' ? T.rValid : x.result === 'duplicate' ? T.rUsed : T.rInvalid) + ' · ' + x.time}</Status>
            </div>
          )) : <span className="kd-s py-3">{T.noScans}</span>}
        </section>
      </div>
      {sum ? <Crew lang={lang} eventId={eventId} staff={sum.staff} active={sum.scannersActive} onChange={reload} /> : null}
    </div>
  );
}

/** The camera, where the browser reads QR codes (BarcodeDetector); otherwise the frame alone, for a hardware scanner. */
function Viewfinder({ lang, onCode }: { lang: Lang; onCode: (code: string) => void }) {
  const T = pick(STUDIO, lang);
  const video = useRef<HTMLVideoElement>(null);
  const [can, setCan] = useState(false);
  const [on, setOn] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const last = useRef<{ v: string; t: number }>({ v: '', t: 0 });
  useEffect(() => { setCan('BarcodeDetector' in window && !!navigator.mediaDevices?.getUserMedia); }, []);
  useEffect(() => {
    if (!on) return;
    let stream: MediaStream | null = null, stop = false, timer = 0;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        if (stop || !video.current) return;
        video.current.srcObject = stream;
        await video.current.play();
        const Detector = (window as unknown as { BarcodeDetector: new (o: { formats: string[] }) => { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector;
        const reader = new Detector({ formats: ['qr_code'] });
        const look = async () => {
          if (stop || !video.current) return;
          try {
            const [hit] = await reader.detect(video.current);
            // The same code held in the frame scans once, not every frame.
            if (hit && (hit.rawValue !== last.current.v || Date.now() - last.current.t > 3000)) {
              last.current = { v: hit.rawValue, t: Date.now() };
              onCode(hit.rawValue);
            }
          } catch { /* a frame it could not read */ }
          timer = window.setTimeout(look, 250);
        };
        look();
      } catch { setBlocked(true); setOn(false); }
    })();
    return () => { stop = true; clearTimeout(timer); stream?.getTracks().forEach((t) => t.stop()); };
  }, [on, onCode]);
  const corner = 'absolute size-7 border-paper';
  return (
    <div className="relative h-[184px] overflow-hidden rounded-xl bg-carbon shadow-[inset_0_0_0_1px_var(--color-line)]" role="region" aria-label={T.viewfinder}>
      {on ? <video ref={video} className="absolute inset-0 size-full object-cover" muted playsInline aria-hidden="true" /> : null}
      <div className="absolute inset-y-6 left-1/2 w-[136px] -translate-x-1/2">
        <span className={cx(corner, 'left-0 top-0 rounded-tl-md border-l-[3px] border-t-[3px]')} />
        <span className={cx(corner, 'right-0 top-0 rounded-tr-md border-r-[3px] border-t-[3px]')} />
        <span className={cx(corner, 'bottom-0 left-0 rounded-bl-md border-b-[3px] border-l-[3px]')} />
        <span className={cx(corner, 'bottom-0 right-0 rounded-br-md border-b-[3px] border-r-[3px]')} />
        <span className="absolute inset-x-2 h-0.5 animate-kd-scan rounded-sm bg-acc shadow-[0_0_12px_rgba(228,242,34,0.6)]" aria-hidden="true" />
      </div>
      <div className="absolute inset-x-0 bottom-1.5 flex flex-col items-center gap-1.5">
        {can ? (
          <button type="button" className="kd-chip kd-glass" onClick={() => { setBlocked(false); setOn(!on); }}>
            <CameraIcon size={14} aria-hidden="true" />{on ? T.cameraOff : T.camera}
          </button>
        ) : null}
        <span className="kd-m text-center">{blocked ? T.cameraBlocked : T.aim}</span>
      </div>
    </div>
  );
}

function Crew({ lang, eventId, staff, active, onChange }: { lang: Lang; eventId: string; staff: Staff[]; active: number; onChange: () => void }) {
  const T = pick(STUDIO, lang);
  const kd = useKd();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', gate: 'main' as Gate, role: 'scanner' as 'scanner' | 'lead' });
  const [busy, setBusy] = useState(false);
  const act = async (run: () => Promise<{ message?: Pair | null }>) => {
    try { const out = await run(); if (out?.message) kd.toast(FF.text(out.message, lang)); onChange(); } catch (e) { kd.toast(FF.errorText(e, lang)); }
  };
  const invite = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await act(async () => { const out = await FF.post(`/organizer/events/${eventId}/staff`, form); setAdding(false); setForm({ name: '', phone: '', gate: 'main', role: 'scanner' }); return out; });
    setBusy(false);
  };
  const gateLabel = { main: T.gateMain, vip: T.gateVip, side: T.gateSide };
  return (
    <section className="flex min-w-0 flex-[1_1_320px] flex-col gap-3 md:pt-12" aria-label={T.crew}>
      <div className="flex items-baseline justify-between gap-3"><h2 className="kd-h">{T.crew}</h2><span className="kd-m kd-num">{fill(T.crewActive, { n: active })}</span></div>
      <Panel className="flex flex-col px-4">
        {staff.map((p) => (
          <div key={p.id} className="flex min-h-14 items-center gap-3 border-b border-line last:border-b-0">
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="kd-hs kd-ell">{p.name}</span>
              <span className="kd-s kd-num kd-ell">{[p.phone, gateLabel[p.gate], p.role === 'lead' ? T.crewLead : T.crewScanner, fill(T.crewScans, { n: p.scanCount })].join(' · ')}</span>
            </div>
            <Status tone={p.status === 'scanning' ? 'ok' : p.status === 'paused' ? 'warn' : 'none'}>{p.status === 'scanning' ? T.crewOn : p.status === 'paused' ? T.crewOff : T.crewInvited}</Status>
            {p.status !== 'invited' ? (
              <IconButton size="sm" label={p.status === 'scanning' ? T.crewPause : T.crewResume} onClick={() => act(() => FF.patch(`/organizer/events/${eventId}/staff/${p.id}`, { active: p.status !== 'scanning' }))}>
                {p.status === 'scanning' ? <PauseIcon size={16} aria-hidden="true" /> : <PlayIcon size={16} aria-hidden="true" />}
              </IconButton>
            ) : null}
            <IconButton size="sm" label={fill(T.crewRemove, { n: p.name })} onClick={() => act(() => FF.del(`/organizer/events/${eventId}/staff/${p.id}`))}><TrashIcon size={16} aria-hidden="true" /></IconButton>
          </div>
        ))}
        {adding ? (
          <form className="flex flex-col gap-3 py-4" onSubmit={invite}>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
              <div className="flex flex-col gap-2"><FieldLabel htmlFor="crewName">{T.crewName}</FieldLabel><Input id="crewName" required minLength={2} maxLength={80} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="flex flex-col gap-2"><FieldLabel htmlFor="crewPhone">{T.crewPhone}</FieldLabel><Input id="crewPhone" type="tel" inputMode="tel" required maxLength={30} className="kd-num" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="flex flex-col gap-2"><FieldLabel htmlFor="crewGate">{T.gatePick}</FieldLabel><Select id="crewGate" value={form.gate} onChange={(e) => setForm({ ...form, gate: e.target.value as Gate })}>{(['main', 'vip', 'side'] as Gate[]).map((g) => <option key={g} value={g}>{gateLabel[g]}</option>)}</Select></div>
              <div className="flex flex-col gap-2"><FieldLabel htmlFor="crewRole">{T.crewRole}</FieldLabel><Select id="crewRole" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as 'scanner' | 'lead' })}><option value="scanner">{T.crewScanner}</option><option value="lead">{T.crewLead}</option></Select></div>
            </div>
            <div className="flex gap-2"><Button tone="acc" type="submit" disabled={busy}>{T.crewSend}</Button><Button tone="ghost" onClick={() => setAdding(false)}>{T.cancel}</Button></div>
          </form>
        ) : (
          <Button tone="ghost" size="sm" className="-ml-3 my-2 self-start" onClick={() => setAdding(true)}>{T.crewAdd}</Button>
        )}
      </Panel>
    </section>
  );
}
