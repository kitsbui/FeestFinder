/**
 * An event card for grids: the art (cover, or the family's shapes, plain or bone by index),
 * a glass status tag and the save toggle over it, then the title, marker + when · venue, the
 * price (lime when free) and "n quan tâm".
 */
import { KdLink as Link, inLang } from '../link';
import { fill, pick, type Lang } from '../copy';
import { cx } from '../cx';
import { count, money, whenShort } from '../format';
import { familyOf, g } from '../genre';
import { Art } from '../ui/parts';
import type { Card } from '../types';
import { WEB } from './copy';
import { SaveToggle } from './save-toggle';

export function cardTag(e: Card, lang: Lang): string | null {
  const T = pick(WEB, lang);
  if (e.past) return T.ended;
  if (e.soldOut) return T.soldOut;
  if (e.badge) return e.badge.label[lang];
  if (e.featured) return T.featured;
  return null;
}

export function priceLine(e: Pick<Card, 'isFree' | 'priceFrom' | 'currency' | 'entryMode'>, lang: Lang): string {
  const T = pick(WEB, lang);
  if (e.isFree || e.entryMode === 'free') return T.free;
  return fill(T.fromPrice, { p: money(e.priceFrom, e.currency, lang) });
}

export function EventCard({ e, i, lang }: { e: Card; i: number; lang: Lang }) {
  const T = pick(WEB, lang);
  const fam = familyOf(e.genre);
  const tag = cardTag(e, lang);
  const href = inLang('/e/' + e.slug, lang);
  return (
    <article className={cx('kd-ev', g(fam))}>
      <div className="relative">
        <Link href={href} tabIndex={-1} aria-hidden="true">
          <Art family={fam} cover={e.coverUrl} bone={i % 2 === 1} off={e.past || e.soldOut} />
        </Link>
        <div className="pointer-events-none absolute inset-x-2.5 top-2.5 flex items-start justify-between">
          {tag ? <span className="kd-tag kd-tag-glass text-paper">{tag}</span> : <span />}
          <span className="pointer-events-auto"><SaveToggle id={e.id} label={fill(T.saveEvent, { t: e.title })} /></span>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <Link href={href} className="kd-h">{e.title}</Link>
        <span className="kd-s flex min-w-0 items-center gap-1.5">
          <span className="kd-mk" aria-hidden="true" />
          <span className="kd-ell">{whenShort(e, lang)}{e.venue.name ? ' · ' + e.venue.name : ''}</span>
        </span>
        <span className="mt-0.5 flex items-baseline justify-between gap-2">
          <span className={cx('kd-mb kd-num', (e.isFree || e.entryMode === 'free') && 'text-acc')}>{priceLine(e, lang)}</span>
          {e.saveCount ? <span className="kd-m kd-num">{fill(T.interested, { n: count(e.saveCount, lang) })}</span> : null}
        </span>
      </div>
    </article>
  );
}
