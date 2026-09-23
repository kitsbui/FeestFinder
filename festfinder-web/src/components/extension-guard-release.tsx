'use client';
/** The other half of extension-guard.tsx: puts parked elements back once the page has hydrated. */
import { useEffect } from 'react';

/** Goes in <body>: its effect runs once the page has hydrated. */
export function ExtensionGuardRelease() {
  useEffect(() => {
    (window as { __ffHydrated?: () => void }).__ffHydrated?.();
  }, []);
  return null;
}
