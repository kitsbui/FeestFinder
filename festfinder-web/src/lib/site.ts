/** What every page of the site shares in its head, whichever look renders it. */
import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/api';

export const siteMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'FeestFinder — club, rave và lễ hội EDM', template: '%s · FeestFinder' },
  description:
    'Tìm club, rave và lễ hội EDM tối nay và cuối tuần này. EDM club nights, raves and festivals in Asia.',
  applicationName: 'FeestFinder',
  openGraph: { siteName: 'FeestFinder', locale: 'vi_VN', alternateLocale: ['en_US'], type: 'website' },
  // The ICO first with its size, so browsers that read SVG favicons still choose the SVG: the
  // logo pack v2 flag pole on its own dark tile, which reads on a light or a dark tab bar.
  icons: {
    icon: [
      { url: '/ui/assets/favicon.ico', sizes: '32x32' },
      { url: '/ui/assets/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/ui/assets/apple-touch-icon.png',
  },
};
