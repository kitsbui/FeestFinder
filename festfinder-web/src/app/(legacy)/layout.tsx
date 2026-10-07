import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { siteMetadata } from '@/lib/site';
import { ExtensionGuardRelease, ExtensionGuardScript } from '@/components/extension-guard';
import './globals.css';

/** Be Vietnam Pro, the design system's one face, served from this site (public/ui/fonts). */
const FONTS = '/ui/fonts/be-vietnam-pro.css';

export const metadata: Metadata = siteMetadata;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0E100F',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <ExtensionGuardScript />
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
