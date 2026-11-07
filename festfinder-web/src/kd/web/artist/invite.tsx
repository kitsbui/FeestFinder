'use client';
import { pick, type Lang } from '../../copy';
import { KdLink } from '../../link';
import { buttonClass } from '../../ui/actions';
import { useViewer } from '../profile/parts';
import { ARTIST } from './copy';

/** "Mời biểu diễn" (persona review, 2026-11-07): Studio's booking request with this artist chosen; not on their own page. */
export function InviteButton({ lang, slug }: { lang: Lang; slug: string }) {
  const v = useViewer({ kind: 'artist', slug });
  if (v?.owner) return null;
  return <KdLink href={`/studio/gigs?invite=${encodeURIComponent(slug)}`} className={buttonClass({})}>{pick(ARTIST, lang).invite}</KdLink>;
}
