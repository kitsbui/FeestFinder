/**
 * The root layout of every page (the Kính đêm design).
 *
 * Fonts are self-hosted (the CSP allows no font CDN): Be Vietnam Pro and JetBrains Mono,
 * 400 and 500, in the latin, latin-ext and vietnamese subsets the browser picks by range.
 */
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import '@fontsource/be-vietnam-pro/latin-400.css';
import '@fontsource/be-vietnam-pro/latin-500.css';
import '@fontsource/be-vietnam-pro/latin-ext-400.css';
import '@fontsource/be-vietnam-pro/latin-ext-500.css';
import '@fontsource/be-vietnam-pro/vietnamese-400.css';
import '@fontsource/be-vietnam-pro/vietnamese-500.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/latin-500.css';
import '@fontsource/jetbrains-mono/latin-ext-400.css';
import '@fontsource/jetbrains-mono/latin-ext-500.css';
import '@fontsource/jetbrains-mono/vietnamese-400.css';
import '@fontsource/jetbrains-mono/vietnamese-500.css';
import '@/kd/kd.css';
import { siteMetadata } from '@/lib/site';
import { ExtensionGuardRelease, ExtensionGuardScript } from '@/components/extension-guard';

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
          <ExtensionGuardRelease />
        </ff-app>
      </body>
    </html>
  );
}
