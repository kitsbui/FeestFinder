'use client';
/**
 * Hands a page's Thai, Japanese or Indonesian lines to tx() before anything under it renders
 * (design v2 phase 10). kd/ui/in-lang.tsx sends them from the server, with that page only.
 */
import type { ReactNode } from 'react';
import { learn, type Lang } from '../copy';

export function LangLines({ lang, lines, children }: { lang: Lang; lines: Record<string, string>; children: ReactNode }) {
  learn(lang, lines);
  return children;
}
