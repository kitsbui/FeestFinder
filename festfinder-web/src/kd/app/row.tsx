'use client';
/** An event as an app row (design/Main "Gần bạn"): art, title, marker + when, price and distance. */
import { pick, type Lang } from '../copy';
import { cx } from '../cx';
import { km, moneyShort, whenShort } from '../format';
import { familyOf, g } from '../genre';
import { KdLink as Link } from '../link';
import { useKd } from '../runtime';
import { Button } from '../ui/actions';
import { Art, Card as Panel, Marker } from '../ui/parts';
import type { Card } from '../types';
import { APP } from './copy';

export function EventRow({ e, lang, d, dim }: { e: Card; lang: Lang; d?: number | null; dim?: boolean }) {
  const T = pick(APP, lang);
  const fam = familyOf(e.genre);
  return (
    <Link className={cx('kd-row', g(fam), dim && 'opacity-60')} href={'/app/e/' + e.slug}>
      <Art family={fam} cover={e.coverUrl} off={e.soldOut || e.past} />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="kd-hs kd-ell">{e.title}</span>
        <span className="kd-s kd-ell flex items-center gap-1.5"><Marker family={fam} />{whenShort(e, lang)}{e.venue.area ? ' · ' + e.venue.area : ''}</span>
      </span>
      <span className="flex flex-col items-end gap-0.5">
        <span className={cx('kd-mb kd-num', e.isFree && 'text-acc')}>{e.isFree ? T.free : moneyShort(e.priceFrom, e.currency, lang)}</span>
        {d != null ? <span className="kd-s kd-num">{km(d, lang)}</span> : null}
      </span>
    </Link>
  );
}

/** What a signed-out person sees on a screen that is theirs: one line and the way in. */
export function SignInCard({ lang, note }: { lang: Lang; note: string }) {
  const T = pick(APP, lang);
  const kd = useKd();
  return (
    <Panel className="m-4 flex flex-col items-start gap-3 px-5 py-7">
      <span className="kd-h">{note}</span>
      <Button tone="acc" onClick={() => kd.openSignIn(note)}>{T.signIn}</Button>
    </Panel>
  );
}
