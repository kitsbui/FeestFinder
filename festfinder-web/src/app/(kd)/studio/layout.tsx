import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { StudioRoot } from '@/kd/studio/root';

// Signed-in screens: nothing here for a search engine.
export const metadata: Metadata = { title: { absolute: 'FeestFinder cho nhà tổ chức' }, robots: { index: false, follow: false } };

/** One root for every /studio screen, so moving between them keeps the organiser and the chosen event. */
export default function StudioLayout({ children }: { children: ReactNode }) {
  return <StudioRoot>{children}</StudioRoot>;
}
