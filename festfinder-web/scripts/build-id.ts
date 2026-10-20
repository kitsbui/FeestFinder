/**
 * Which build this is: the commit Vercel builds (VERCEL_GIT_COMMIT_SHA), else the checkout's own
 * commit, else "dev". The service worker's cache name (scripts/copy-ui.ts writes it into
 * public/sw.js) and NEXT_PUBLIC_BUILD_ID (next.config.ts, "Phiên bản" in the settings, bug
 * reports) both come from here, so every deploy brings a new worker that installs itself.
 */
import { execSync } from 'node:child_process';

export function buildId(): string {
  const fromVercel = (process.env.VERCEL_GIT_COMMIT_SHA ?? '').trim();
  if (fromVercel) return fromVercel.slice(0, 12);
  try {
    return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim().slice(0, 12) || 'dev';
  } catch {
    return 'dev';
  }
}
