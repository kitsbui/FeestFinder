/**
 * An event: the art (cover, or a text tile with the name, style and date), its status tag, "Radar"
 * for what Feest Radar found, and the save toggle; then the title, marker + when · venue · city, the
 * price (turquoise when free) and "n quan tâm". One markup, three looks (kd.css):
 * - `card`: the art on top (grids); in the list's days (`.kd-days`) narrower than 600px it is a row;
 * - `lead`: the first night of a day on the home page, its art 16:9 and its name larger;
 * - `row`: a thumbnail beside the words, the tags in the line under the price.
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

export type CardLook = 'card' | 'lead' | 'row';

export function EventCard({ e, lang, look = 'card' }: { e: Card; lang: Lang; look?: CardLook }) {
  const T = pick(WEB, lang);
  const fam = familyOf(e.genre);
  const tag = cardTag(e, lang);
  // Nổi bật and a flagship festival wear the accent gradient; every other tag is glass over the art.
  const lead = !e.past && !e.soldOut && e.status !== 'cancelled' && (!!e.festival?.flagship || (!e.badge && e.featured));
  const href = inLang('/e/' + e.slug, lang);
  const radar = e.origin === 'radar';
  return (
    <article className={cx('kd-ev', look !== 'card' && `kd-ev-${look}`, g(fam))}>
      <div className="kd-ev-art relative">
        <Link href={href} tabIndex={-1} aria-hidden="true">
          <Art family={fam} cover={e.coverUrl} title={e.title} kicker={e.styles[0] ? styleLabel(e.styles[0], lang) : null} meta={whenShort(e, lang)} off={e.past || e.soldOut} />
        </Link>
        {tag ? <span className={cx('kd-ev-tag kd-tag pointer-events-none absolute left-2.5 top-2.5', lead ? 'kd-tag-featured' : 'kd-tag-glass text-fg-1')}>{tag}</span> : null}
        {radar ? <RadarTag lang={lang} glass className="kd-ev-radar pointer-events-none absolute bottom-2.5 left-2.5" /> : null}
      </div>
      <span className="kd-ev-save"><SaveToggle id={e.id} label={fill(T.saveEvent, { t: e.title })} /></span>
      <div className="kd-ev-text flex min-w-0 flex-col gap-1">
        <Link href={href} className="kd-h kd-ev-title">{e.title}</Link>
        <span className="kd-s flex min-w-0 items-center gap-1.5">
          <span className="kd-mk" aria-hidden="true" />
          <span className="kd-ell">{whenShort(e, lang)}{e.startTime ? ' · ' + e.startTime : ''}{e.venue.name ? ' · ' + e.venue.name : ''} · {e.cityLabel[lang]}</span>
        </span>
        <span className="mt-0.5 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className={cx('kd-mb kd-num', (e.isFree || e.entryMode === 'free') && 'text-info')}>{priceLine(e, lang)}</span>
          {/* In a row the tags leave the art for this line (kd.css). */}
          {tag ? <span className={cx('kd-ev-inline kd-tag', lead && 'kd-tag-featured')}>{tag}</span> : null}
          {radar ? <RadarTag lang={lang} className="kd-ev-inline" /> : null}
          {e.saveCount ? <span className="kd-ev-hype kd-m kd-num ml-auto">{fill(T.interested, { n: count(e.saveCount, lang) })}</span> : null}
        </span>
      </div>
    </article>
  );
}
