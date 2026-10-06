/** The head every app route shares: never indexed, full screen from the home screen. */
import type { Metadata, Viewport } from 'next';

export const appMetadata: Metadata = {
  title: { absolute: 'Ứng dụng FeestFinder' },
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'FeestFinder' },
  formatDetection: { telephone: false },
};

// Edge to edge on notched phones; the on-screen keyboard shrinks the layout instead of covering it.
export const appViewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
  themeColor: '#08090a',
};
