import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ArtistRoot } from '@/kd/artist/root';

// Signed-in screens: nothing here for a search engine.
export const metadata: Metadata = { title: { absolute: 'FeestFinder cho nghệ sĩ' }, robots: { index: false, follow: false } };

/** One root for every /studio/artist screen: the artist gate and the side rail (Studio's root passes these paths through). */
export default function ArtistStudioLayout({ children }: { children: ReactNode }) {
  return <ArtistRoot>{children}</ArtistRoot>;
}
