/**
 * The FeestFinder logo (logo pack v2): the compact wordmark wherever it is at most 32px high (the
 * nav, the footer, the rails), the flag pole (`mark`) where there is room for a square only. Every
 * placement is a link to the home page, named "FeestFinder, trang chủ" (the pack's rule);
 * `FlagLoader`, the waving pole, is the back offices' waiting screen. Server-safe.
 */
import { COMMON, pick, type Lang } from '../copy';
import { cx } from '../cx';
import { KdLink as Link, inLang } from '../link';

/** The compact wordmark's width for its height (its viewBox is 5560 × 1080). */
const RATIO = 5560 / 1080;

export function Logo({ lang = 'vi', height = 22, mark = false, className }: { lang?: Lang; height?: number; mark?: boolean; className?: string }) {
  return (
    <Link href={inLang('/', lang)} aria-label={pick(COMMON, lang).homeLink} className={cx('inline-flex h-11 min-w-11 shrink-0 items-center', className)}>
      {mark
        ? <img src="/kd/ff-mark.svg" alt="" width={height} height={height} />
        : <img src="/kd/ff-wordmark.svg" alt="" width={Math.round(height * RATIO)} height={height} />}
    </Link>
  );
}

/**
 * A screen that is waiting for the session (a back office before it knows who is there): the flag
 * pole, its flags waving (logo pack v2, `ff-mark-wave.svg`), still for someone who asks for less
 * motion. Design v2 phase 8.
 */
export function FlagLoader({ lang = 'vi', size = 56 }: { lang?: Lang; size?: number }) {
  return (
    <div role="status" aria-label={pick(COMMON, lang).loading} className="flex min-h-dvh items-center justify-center">
      <picture>
        <source media="(prefers-reduced-motion: reduce)" srcSet="/kd/ff-mark.svg" />
        <img src="/kd/ff-mark-wave.svg" alt="" width={size} height={size} />
      </picture>
    </div>
  );
}
