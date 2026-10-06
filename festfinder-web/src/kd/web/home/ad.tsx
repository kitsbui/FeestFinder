'use client';
/**
 * A banner ad: always labelled, counted once when shown and on a click, and hideable. It is
 * never picked from what someone saved (routes/discovery.ts says why on the ad itself).
 */
import { useEffect, useState } from 'react';
import { ArrowUpRightIcon, XIcon } from '@phosphor-icons/react/ssr';
import { FF } from '@/runtime/ff';
import { pick, type Lang, type Pair } from '../../copy';
import { useKd } from '../../runtime';
import { buttonClass, IconButton } from '../../ui/actions';
import { HOME } from './copy';

export interface Ad { id: string; brand: string; logo: string | null; headline: Pair; body: Pair; cta: Pair; url: string | null; sponsoredLabel: Pair; why: Pair }

export function AdBanner({ ad, lang }: { ad: Ad; lang: Lang }) {
  const kd = useKd();
  const T = pick(HOME, lang);
  const [hidden, setHidden] = useState(false);
  useEffect(() => { FF.fire(FF.post('/ads/' + ad.id + '/impression')); }, [ad.id]);
  if (hidden) return null;
  const click = () => { FF.fire(FF.post('/ads/' + ad.id + '/click')); };
  const hide = async () => {
    setHidden(true);
    if (kd.user) {
      const out = await FF.maybe(FF.post('/ads/' + ad.id + '/hide'), null);
      if (out?.message) kd.toast(FF.text(out.message, lang));
    }
  };
  return (
    <aside aria-label={ad.sponsoredLabel[lang]} className="kd-card flex flex-wrap items-center gap-4 p-5">
      <span className="kd-av kd-av-sq h-12 w-12 text-base" aria-hidden="true">{ad.logo || ad.brand.slice(0, 2)}</span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="kd-m" title={ad.why[lang]}>{ad.sponsoredLabel[lang]} · {ad.brand}</span>
        <span className="kd-h">{ad.headline[lang]}</span>
        <span className="kd-s">{ad.body[lang]}</span>
      </div>
      {ad.url ? (
        <a className={buttonClass({ size: 'sm' })} href={ad.url} target="_blank" rel="noopener sponsored" onClick={click}>
          {ad.cta[lang]}<ArrowUpRightIcon size={14} aria-hidden="true" />
        </a>
      ) : null}
      <IconButton label={T.adHide} size="sm" onClick={hide}><XIcon size={16} aria-hidden="true" /></IconButton>
    </aside>
  );
}
