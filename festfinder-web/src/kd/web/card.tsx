/**
 * An event card for grids: the art (cover, or a text tile with the name, style and date),
 * a glass status tag and the save toggle over it (and "Radar" below, for what Feest Radar
 * found), then the title, marker + when · venue · city, the price (turquoise when free) and "n quan tâm".
 */
import { KdLink as Link, inLang } from '../link';
import { fill, pick, type Lang } from '../copy';
import { cx } from '../cx';
import { count, money, whenShort } from '../format';
import { familyOf, g, styleLabel } from '../genre';
import { RadarTag } from '../ui/origin';
import { Art } from '../ui/parts';
import type { Card } from '../types';
import { WEB } from './copy';
import { SaveToggle } from './save-toggle';

export function cardTag(e: Card, lang: Lang): string | null {
  const T = pick(WEB, lang);
  if (e.status === 'cancelled') return T.cancelled;
  if (e.past) return T.ended;
  if (e.soldOut) return T.soldOut;
  if (e.festival?.flagship && e.festival.label) return e.festival.label[lang];
  if (e.badge) return e.badge.label[lang];
  if (e.featured) return T.featured;
  return null;
}

export function priceLine(e: Pick<Card, 'isFree' | 'priceFrom' | 'currency' | 'entryMode'>, lang: Lang): string {
  const T = pick(WEB, lang);
  if (e.isFree || e.entryMode === 'free') return T.free;
  return fill(T.fromPrice, { p: money(e.priceFrom, e.currency, lang) });
}

export function EventCard({ e, lang }: { e: Card; lang: Lang }) {
  const T = pick(WEB, lang);
  const fam = familyOf(e.genre);
  const tag = cardTag(e, lang);
  // Nổi bật and a flagship festival wear the accent gradient; every other tag is glass over the art.
  const lead = !e.past && !e.soldOut && e.status !== 'cancelled' && (!!e.festival?.flagship || (!e.badge && e.featured));
  const href = inLang('/e/' + e.slug, lang);
  return (
    <article className={cx('kd-ev', g(fam))}>
      <div className="relative">
        <Link href={href} tabIndex={-1} aria-hidden="true">
          <Art family={fam} cover={e.coverUrl} title={e.title} kicker={e.styles[0] ? styleLabel(e.styles[0], lang) : null} meta={whenShort(e, lang)} off={e.past || e.soldOut} />
        </Link>
        <div className="pointer-events-none absolute inset-x-2.5 top-2.5 flex items-start justify-between">
          {tag ? <span className={cx('kd-tag', lead ? 'kd-tag-featured' : 'kd-tag-glass text-fg-1')}>{tag}</span> : <span />}
          <span className="pointer-events-auto"><SaveToggle id={e.id} label={fill(T.saveEvent, { t: e.title })} /></span>
        </div>
        {e.origin === 'radar' ? <RadarTag lang={lang} glass className="pointer-events-none absolute bottom-2.5 left-2.5" /> : null}
      </div>
      <div className="flex flex-col gap-1">
        <Link href={href} className="kd-h">{e.title}</Link>
        <span className="kd-s flex min-w-0 items-center gap-1.5">
          <span className="kd-mk" aria-hidden="true" />
          <span className="kd-ell">{whenShort(e, lang)}{e.venue.name ? ' · ' + e.venue.name : ''} · {e.cityLabel[lang]}</span>
        </span>
        <span className="mt-0.5 flex items-baseline justify-between gap-2">
          <span className={cx('kd-mb kd-num', (e.isFree || e.entryMode === 'free') && 'text-info')}>{priceLine(e, lang)}</span>
          {e.saveCount ? <span className="kd-m kd-num">{fill(T.interested, { n: count(e.saveCount, lang) })}</span> : null}
        </span>
      </div>
    </article>
  );
}
