'use client';
/**
 * Feedback from any page (the root layout): "Góp ý" in the footer, the account menu, the "Tôi" hub
 * and every rail sends `ff:feedback`, which opens the sheet (sheet.tsx). The sheet and its parts are
 * loaded the first time someone opens it, so a page that nobody reports on does not carry them
 * (design v2 phase 7). The error log the report attaches, and the reports of uncaught errors to
 * the API, start with every page (telemetry.ts).
 */
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { installErrorLog } from './telemetry';

const FeedbackSheet = dynamic(() => import('./sheet'), { ssr: false });

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    installErrorLog();
    const show = () => setOpen(true);
    window.addEventListener('ff:feedback', show);
    return () => window.removeEventListener('ff:feedback', show);
  }, []);
  return open ? <FeedbackSheet onClose={() => setOpen(false)} /> : null;
}
