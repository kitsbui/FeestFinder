import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ConsoleRoot } from '@/kd/console/root';

// The team's back office: nothing here for a search engine.
export const metadata: Metadata = { title: { absolute: 'FeestFinder Console' }, robots: { index: false, follow: false } };

/** One root for every /console tab, so the admin gate and the counts load once. */
export default function ConsoleLayout({ children }: { children: ReactNode }) {
  return <ConsoleRoot>{children}</ConsoleRoot>;
}
