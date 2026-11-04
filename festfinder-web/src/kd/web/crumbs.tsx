/**
 * A detail page's breadcrumbs: its list and itself, never the home crumb. A server component, so
 * no page carries its code in the browser.
 */
import { CaretRightIcon } from '@phosphor-icons/react/ssr';
import { cx } from '../cx';
import { KdLink as Link } from '../link';

/** `width` lines the crumbs up with a page's centred column (`read` for an article, `page` for a profile). */
export function Crumbs({ items, label, width }: { items: { name: string; href?: string }[]; label: string; width?: 'read' | 'page' }) {
  const shown = items.filter((c, i) => !(i === 0 && c.name === 'FeestFinder'));
  if (shown.length < 2) return null;
  const row = 'flex min-h-12 flex-wrap items-center gap-2 kd-s';
  const trail = shown.map((c, i) => (
    <span key={i} className="flex min-w-0 items-center gap-2">
      {i ? <CaretRightIcon size={12} className="shrink-0 text-fg-3" aria-hidden="true" /> : null}
      {/* A short crumb ("Artists") still gets 44px to tap: a minimum width, the text where it was. */}
      {c.href ? <Link href={c.href} className="inline-flex min-h-11 min-w-11 items-center text-fg-3 hover:text-fg-1">{c.name}</Link> : <span className="kd-ell text-fg-2" aria-current="page">{c.name}</span>}
    </span>
  ));
  return (
    <nav aria-label={label} className={cx('kd-wrap', !width && row)}>
      {width ? <div className={cx('mx-auto w-full', row, width === 'read' ? 'max-w-read' : 'max-w-page')}>{trail}</div> : trail}
    </nav>
  );
}
