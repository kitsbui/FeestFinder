/**
 * An event: the art (cover, or a text tile with the name, style and date), its status tag, "Radar"
 * for what Feest Radar found, and the save toggle; then the title, marker + when · venue · city, the
 * price (turquoise when free) and "n quan tâm". One markup, three looks (kd.css):
 * - `card`: the art on top (grids); in the list's days (`.kd-days`) narrower than 600px it is a row;
 * - `lead`: the first night of a day on the home page, its art 16:9 and its name larger;
 * - `row`: a thumbnail beside the words, the tags in the line under the price.
 */
import { ViewTransition } from 'react';
import { KdLink as Link, inLang } from '../link';
import { fill, pick, type Lang, tx } from '../copy';
import { cx } from '../cx';
import { count, whenShort } from '../format';
import { familyOf, g, styleLabel } from '../genre';
import { RadarTag } from '../ui/origin';
import { Art } from '../ui/parts';
import { square, type Fit } from '../img';
import { CARD, LEAD } from './card-fit';
import type { Card } from '../types';
import { WEB } from './copy';
import { priceLine } from './price';
import { SaveToggle } from './save-toggle';

/** The Console's event form and the wizard's last step read it here; the wizard's other steps from ./price, without the card. */
export { priceLine };

/** The badges a card still shows (design v2 phase 12): the ones that change whether to go now. */
const URGENT = new Set(['low_tickets', 'selling_fast']);

/** At most one tag on a card, and only one that matters: off, sold out, a world festival, few tickets, a paid place. */
export function cardTag(e: Card, lang: Lang): string | null {
  const T = pick(WEB, lang);
  if (e.status === 'cancelled') return T.cancelled;
  if (e.past) return T.ended;
  if (e.soldOut) return T.soldOut;
  if (e.festival?.flagship && e.festival.label) return tx(e.festival.label, lang);
  if (e.badge && URGENT.has(e.badge.key)) return tx(e.badge.label, lang);
  if (e.featured) return T.featured;
  return null;
}

export type CardLook = 'card' | 'lead' | 'row';

/** The box a look draws its picture in (kd/img.ts); a card in the list's days says its own (DAY). */
const LOOK_FIT: Record<CardLook, Fit> = { card: CARD, lead: LEAD, row: square(88) };

/**
 * `morph`: the picture becomes the event page's hero when it opens (React's ViewTransition, design v2
 * phase 8). Only where an event appears once on the page (the list's days): two of one name would clash.
 */
export function EventCard({ e, lang, look = 'card', morph = false, eager = false, fit = LOOK_FIT[look] }: {
  e: Card; lang: Lang; look?: CardLook; morph?: boolean;
  /** Its picture loads first: the home page's first picture (list/page.tsx, days.tsx). */
  eager?: boolean;
  /** The box its picture is drawn in, when the look's own is not it. */
  fit?: Fit;
}) {
  const T = pick(WEB, lang);
  const fam = familyOf(e.genre);
  const tag = cardTag(e, lang);
  // Nổi bật and a flagship festival wear the accent gradient; every other tag is glass over the art.
  const lead = !e.past && !e.soldOut && e.status !== 'cancelled' && (!!e.festival?.flagship || (!e.badge && e.featured));
  const href = inLang('/e/' + e.slug, lang);
  const radar = e.origin === 'radar';
  const art = <Art family={fam} cover={e.coverUrl} title={e.title} kicker={e.styles[0] ? styleLabel(e.styles[0], lang) : null} meta={whenShort(e, lang)} off={e.past || e.soldOut} eager={eager} fit={fit} />;
  return (
    <article className={cx('kd-ev', look !== 'card' && `kd-ev-${look}`, g(fam))}>
      <div className="kd-ev-art relative">
        <Link href={href} tabIndex={-1} aria-hidden="true">
          {morph ? (
            <ViewTransition name={'ev-' + e.slug} share="morph" default="none">{art}</ViewTransition>
          ) : art}
        </Link>
        {tag ? <span className={cx('kd-ev-tag kd-tag pointer-events-none absolute left-2.5 top-2.5', lead ? 'kd-tag-featured' : 'kd-tag-glass text-fg-1')}>{tag}</span> : null}
        {radar ? <RadarTag lang={lang} glass compact className="kd-ev-radar pointer-events-none absolute bottom-2.5 left-2.5" /> : null}
      </div>
      <span className="kd-ev-save"><SaveToggle id={e.id} label={fill(T.saveEvent, { t: e.title })} /></span>
      <div className="kd-ev-text flex min-w-0 flex-col gap-1">
        <Link href={href} className="kd-h kd-ev-title">{e.title}</Link>
        <span className="kd-s flex min-w-0 items-center gap-1.5">
          <span className="kd-mk" aria-hidden="true" />
          <span className="kd-ell">{whenShort(e, lang)}{e.startTime ? ' · ' + e.startTime : ''}{e.venue.name ? ' · ' + e.venue.name : ''} · {tx(e.cityLabel, lang)}</span>
        </span>
        <span className="mt-0.5 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className={cx('kd-mb kd-num', (e.isFree || e.entryMode === 'free') && 'text-info')}>{priceLine(e, lang)}</span>
          {/* In a row the tags leave the art for this line (kd.css). */}
          {tag ? <span className={cx('kd-ev-inline kd-tag', lead && 'kd-tag-featured')}>{tag}</span> : null}
          {radar ? <RadarTag lang={lang} compact className="kd-ev-inline" /> : null}
          {e.saveCount ? <span className="kd-ev-hype kd-m kd-num ml-auto">{fill(T.interested, { n: count(e.saveCount, lang) })}</span> : null}
        </span>
      </div>
    </article>
  );
}
