/** What every page of the site shares in its head, whichever look renders it. */
import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/api';

export const siteMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'FeestFinder — lễ hội, show và chợ đêm ở TP.HCM', template: '%s · FeestFinder' },
  description:
    'Tìm lễ hội, show nhạc và chợ đêm ở TP.HCM tối nay và cuối tuần này. Festivals, gigs and night markets in Ho Chi Minh City.',
  applicationName: 'FeestFinder',
  openGraph: { siteName: 'FeestFinder', locale: 'vi_VN', alternateLocale: ['en_US'], type: 'website' },
  // The ICO first with its size, so browsers that read SVG favicons still choose the SVG,
  // which switches between ink and cream with the browser's light or dark theme.
  icons: {
    icon: [
      { url: '/ui/assets/favicon.ico', sizes: '32x32' },
      { url: '/ui/assets/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/ui/assets/apple-touch-icon.png',
  },
};
