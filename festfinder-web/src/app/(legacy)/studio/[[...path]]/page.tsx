import type { Metadata } from 'next';
import OrganizerScreen from '@/surfaces/organizer';

// The same shell for every path: the screen reads the URL in the browser.
export const dynamic = 'force-static';

// Signed-in screens: nothing here for a search engine.
export const metadata: Metadata = { title: { absolute: 'FeestFinder cho nhà tổ chức' }, robots: { index: false, follow: false } };

export default function Page() {
  return <OrganizerScreen />;
}
