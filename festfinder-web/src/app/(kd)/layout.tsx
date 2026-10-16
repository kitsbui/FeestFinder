/**
 * The root layout of every page (the Kính đêm design).
 *
 * Fonts are self-hosted (the CSP allows no font CDN) and come from one family, Noto Sans:
 * variable weight, split by script so the browser fetches only the ranges a page uses
 * (latin, latin-ext and vietnamese for most pages). Noto Sans Thai and Noto Sans JP cover
 * titles from Bangkok and Tokyo, fetched only when such characters appear.
 */
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import '@fontsource-variable/noto-sans/wght.css';
import '@fontsource-variable/noto-sans-thai/wght.css';
import '@fontsource-variable/noto-sans-jp/wght.css';
import '@/kd/kd.css';
import { siteMetadata } from '@/lib/site';
import { ExtensionGuardRelease, ExtensionGuardScript } from '@/components/extension-guard';
import { BrokenCovers } from '@/kd/ui/covers';
import { Scrollbars } from '@/kd/ui/scrollbars';
import { FeedbackWidget } from '@/kd/feedback/widget';

export const metadata: Metadata = siteMetadata;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#08090a',
  colorScheme: 'dark',
};

export default function KdLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <ExtensionGuardScript />
      </head>
      <body>
        {/* The page's own box, so no <div> of ours sits directly in <body>: see extension-guard.tsx. */}
        <ff-app>
          {children}
          <Scrollbars />
          <BrokenCovers />
          <FeedbackWidget />
          <ExtensionGuardRelease />
        </ff-app>
      </body>
    </html>
  );
}
