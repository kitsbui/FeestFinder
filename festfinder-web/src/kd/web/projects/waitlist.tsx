'use client';
/**
 * A project's waitlist (owner, 2026-10-20): how many real accounts wait for the night, against
 * the owner's target, and "Vào danh sách chờ" (PUT / DELETE /projects/:slug/waitlist). The count
 * comes with the page; whether the viewer joined comes in the browser. The owner sees the count
 * only; a closed project or one that became an event takes nobody more.
 */
import { useEffect, useState } from 'react';
import { CheckIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { fill, pick, type Lang } from '../../copy';
import { count } from '../../format';
import { useKd } from '../../runtime';
import { Button } from '../../ui/actions';
import { PROJ_PAGE as PROJ } from './copy-page';
import type { Project } from './model';

export function Waitlist({ lang, slug, status, initial }: { lang: Lang; slug: string; status: Project['status']; initial: Project['waitlist'] }) {
  const T = pick(PROJ, lang);
  const kd = useKd();
  const [w, setW] = useState(initial);
  const [mine, setMine] = useState(false);
  const [busy, setBusy] = useState(false);
  const path = '/projects/' + encodeURIComponent(slug);
  useEffect(() => {
    if (!kd.user) { setW((x) => ({ ...x, joined: false })); setMine(false); return; }
    FF.maybe(FF.get(path), null).then((p: Project | null) => { if (p) { setW(p.waitlist); setMine(!!p.mine); } });
  }, [kd.user, path]);

  const toggle = async () => {
    if (busy || !kd.requireSignIn()) return;
    setBusy(true);
    try {
      const out = (await (w.joined ? FF.del(path + '/waitlist') : FF.put(path + '/waitlist', {}))) as Project['waitlist'];
      setW({ count: out.count, target: out.target, joined: out.joined });
    } catch (e) { kd.toast(FF.errorText(e, lang)); }
    setBusy(false);
  };

  const n = count(w.count, lang);
  const share = w.target ? Math.min(1, w.count / w.target) : 0;
  return (
    <div className="flex w-full max-w-sm flex-col gap-2.5">
      <span className="kd-hs kd-num" aria-live="polite">{w.target ? fill(T.waitlistOf, { n, t: count(w.target, lang) }) : fill(T.waitlistN, { n })}</span>
      {w.target ? (
        <span className="block h-1.5 overflow-hidden rounded-full bg-line-1" aria-hidden="true">
          <span className="block h-full rounded-full bg-info" style={{ width: `${Math.round(share * 100)}%` }} />
        </span>
      ) : null}
      {status === 'open' && !mine ? (
        <Button tone={w.joined ? 'default' : 'acc'} aria-pressed={w.joined} disabled={busy} onClick={toggle} className="self-start">
          {w.joined ? <CheckIcon size={18} aria-hidden="true" /> : null}
          {w.joined ? T.joined : T.join}
        </Button>
      ) : null}
    </div>
  );
}
