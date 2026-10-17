'use client';
/**
 * How fast each page is for the people who open it (design v2 phase 7): LCP, INP and CLS, as Next
 * measures them, go to analytics as `web_vital` {kind, value, rating} with the page's path. The
 * two-weekly numbers (docs/DESIGN_GOVERNANCE.md) read their 75th percentile. In the root layout.
 */
import { useReportWebVitals } from 'next/web-vitals';
import { FF } from '@/runtime/ff';

const KEEP = new Set(['LCP', 'INP', 'CLS']);

export function Vitals() {
  useReportWebVitals((m) => {
    if (!KEEP.has(m.name)) return;
    FF.track('web_vital', { kind: m.name, value: m.name === 'CLS' ? Math.round(m.value * 1000) / 1000 : Math.round(m.value), rating: m.rating });
  });
  return null;
}
