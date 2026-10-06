import type { Metadata, Viewport } from 'next';
import AppScreen from '@/surfaces/app';

// The same shell for every app path not yet rebuilt (/app itself is in (kd)): the screen reads the URL in the browser.
export const dynamic = 'force-static';

// Signed-in screens: nothing here for a search engine.
export const metadata: Metadata = {
  title: { absolute: 'Ứng dụng FeestFinder' },
  robots: { index: false, follow: false },
  // Opened from the home screen it runs full screen, under a see-through status bar.
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'FeestFinder' },
  formatDetection: { telephone: false },
};

// Edge to edge on notched and foldable phones (theme.css pads the safe areas); the
// on-screen keyboard shrinks the layout instead of covering the field.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
  themeColor: '#0E100F',
};

export default function Page() {
  return <AppScreen />;
}
