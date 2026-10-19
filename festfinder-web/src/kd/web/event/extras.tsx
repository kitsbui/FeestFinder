'use client';
/** The photo wall and the ambassadors, at the foot of the event page: loaded after it (design v2 phase 14). */
import dynamic from 'next/dynamic';
import type { Lang } from '../../copy';

const PhotoWall = dynamic(() => import('./community').then((m) => m.PhotoWall), { ssr: false });
const Ambassadors = dynamic(() => import('./community').then((m) => m.Ambassadors), { ssr: false });

export function EventExtras({ lang }: { lang: Lang }) {
  return (
    <>
      <PhotoWall lang={lang} />
      <Ambassadors lang={lang} />
    </>
  );
}
