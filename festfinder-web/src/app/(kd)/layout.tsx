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
import { Vitals } from '@/kd/ui/vitals';
import { InstallCapture, Worker } from '@/kd/ui/worker';
import { PageLang } from '@/kd/ui/page-lang';

export const metadata: Metadata = siteMetadata;

/**
 * The page's language on <html> before React arrives (feedback FF-007, 2026-11-04): the server HTML is one ISR
 * copy per path and says "vi"; the address names the language (?lang=, kept by the rewrite), so this script sets
 * it at once for screen readers; PageLang (kd/ui/page-lang.tsx) sets it again once React has drawn.
 */
const PAGE_LANG = "(function(){var l=new URLSearchParams(location.search).get('lang');if(l&&/^(en|th|ja|id)$/.test(l))document.documentElement.lang=l})()";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#08090a', // tokens-ok: metadata needs a literal (theme.css surface-0)
  colorScheme: 'dark',
};

export default function KdLayout({ children }: { children: ReactNode }) {
  return (
    // Inline scripts mark <html> before React arrives (PAGE_LANG its lang, the home page data-asked), on purpose: not a mismatch to warn about.
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PAGE_LANG }} />
        <ExtensionGuardScript />
        <InstallCapture />
      </head>
      <body>
        {/* The page's own box, so no <div> of ours sits directly in <body>: see extension-guard.tsx. */}
        <ff-app>
          {children}
          <Scrollbars />
          <ScriptFonts />
          <BrokenCovers />
          <FeedbackWidget />
          <Vitals />
          <PageLang />
          <Worker />
          <ExtensionGuardRelease />
        </ff-app>
      </body>
    </html>
  );
}
