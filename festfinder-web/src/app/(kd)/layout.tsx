/**
 * The root layout of every page (the Kính đêm design).
 *
 * Fonts are self-hosted (the CSP allows no font CDN) and come from one family, Noto Sans,
 * declared in kd/fonts.css (written by scripts/fonts-css.ts): a Vietnamese page fetches the
 * latin and vietnamese files (about 50 KB), Thai only for Thai text; Noto Sans JP's stylesheet is
 * added by ScriptFonts only on a page that shows CJK text.
 */
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import '@/kd/fonts.css';
import '@/kd/kd.css';
import { siteMetadata } from '@/lib/site';
import { ExtensionGuardRelease, ExtensionGuardScript } from '@/components/extension-guard';
import { BrokenCovers } from '@/kd/ui/covers';
import { Scrollbars } from '@/kd/ui/scrollbars';
import { ScriptFonts } from '@/kd/ui/script-fonts';
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
          <ScriptFonts />
          <BrokenCovers />
          <FeedbackWidget />
          <ExtensionGuardRelease />
        </ff-app>
      </body>
    </html>
  );
}
