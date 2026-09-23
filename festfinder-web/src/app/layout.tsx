import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { SITE_URL } from '@/lib/api';
import { ExtensionGuardRelease, ExtensionGuardScript } from '@/components/extension-guard';
import './globals.css';

/** Inter, Space Grotesk and JetBrains Mono: the design system's faces, all with Vietnamese. */
const FONTS =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'FeestFinder — lễ hội, show và chợ đêm ở TP.HCM', template: '%s · FeestFinder' },
  description:
    'Tìm lễ hội, show nhạc và chợ đêm ở TP.HCM tối nay và cuối tuần này. Festivals, gigs and night markets in Ho Chi Minh City.',
  applicationName: 'FeestFinder',
  openGraph: { siteName: 'FeestFinder', locale: 'vi_VN', alternateLocale: ['en_US'], type: 'website' },
  // The ICO first with its size, so browsers that read SVG favicons still choose the SVG,
  // which switches between ink and skywash with the browser's light or dark theme.
  icons: {
    icon: [
      { url: '/ui/assets/favicon.ico', sizes: '32x32' },
      { url: '/ui/assets/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/ui/assets/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#05060F',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <ExtensionGuardScript />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href={FONTS} precedence="ff-base" />
        <link rel="stylesheet" href="/ui/theme.css" precedence="ff-base" />
      </head>
      <body>
        {/* The page's own box, so no <div> of ours sits directly in <body>: see extension-guard.tsx. */}
        <ff-app>
          {children}
          <ExtensionGuardRelease />
        </ff-app>
      </body>
    </html>
  );
}
