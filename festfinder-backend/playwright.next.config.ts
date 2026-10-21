import { defineConfig, devices } from '@playwright/test';

/**
 * The checks of the site and its back offices (e2e/next) against the Next.js app
 * (festfinder-web) in production mode. A fresh API runs behind it on its own port and database.
 *
 * FF_API_ORIGIN is read when the app is built (it becomes a rewrite), so the build runs
 * here with the test API's address.
 */
const API_PORT = Number(process.env.SCREENS_PORT ?? 4100);
const WEB_PORT = Number(process.env.WEB_PORT ?? 3100);
const API = `http://localhost:${API_PORT}`;
const WEB = `http://localhost:${WEB_PORT}`;

export default defineConfig({
  testDir: './e2e/next',
  // CI compares a pull request's screens with its base branch's, both taken on the same machine
  // (.github/workflows/visual.yml); locally the baselines stay next to visual.spec.ts.
  ...(process.env.FF_SNAPSHOT_DIR ? { snapshotPathTemplate: `${process.env.FF_SNAPSHOT_DIR}/{arg}{ext}` } : {}),
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    // The same zone on every machine (CI runs in UTC): a phone's zone picks the newcomer's city
    // (festfinder-web/src/kd/web/list/city-first.tsx); e2e/next/newcomer.spec.ts sets its own.
    timezoneId: 'UTC',
    baseURL: WEB,
    ...devices['Desktop Chrome'],
    trace: 'retain-on-failure',
    // Every page installs the service worker; what it fetches would slip past page.route() mocks.
    // The offline checks (site.spec.ts) allow it again.
    serviceWorkers: 'block',
  },
  webServer: [
    {
      // Not .env: that points at Supabase. The demo data goes into a throwaway embedded database.
      command: 'node test/fixtures/reset.ts && node src/server.ts',
      url: `${API}/health`,
      timeout: 180_000,
      reuseExistingServer: false,
      env: {
        PORT: String(API_PORT),
        // Behind the Next app, links and uploads use its address.
        PUBLIC_BASE_URL: WEB,
        DATABASE_URL: '',
        DATABASE_URL_FROM: '',
        PGLITE_DIR: './.data/pglite-screens',
        UPLOAD_DIR: './.data/uploads-screens',
        FF_NOW: '2026-09-14T10:00:00+07:00',
        JOBS_ENABLED: 'false',
        LINK_CHECKS_ENABLED: 'false',
        // Linked images and music embeds read from a fake network: no request leaves the machine.
        FAKE_REMOTE_MEDIA: '1',
        RATE_LIMIT_PER_MINUTE: '10000',
      },
    },
    {
      // The fetch cache would carry the last run's API answers (and its random ids) into this build.
      command: process.env.WEB_SKIP_BUILD
        ? `npx next start --port ${WEB_PORT}`
        : `node -e "require('fs').rmSync('.next/cache/fetch-cache',{recursive:true,force:true})" && npm run build && npx next start --port ${WEB_PORT}`,
      cwd: '../festfinder-web',
      url: `${WEB}/robots.txt`,
      timeout: 300_000,
      reuseExistingServer: false,
      env: {
        FF_API_ORIGIN: API,
        SITE_URL: WEB,
        NEXT_TELEMETRY_DISABLED: '1',
        // The Kính đêm component kit (/kit) answers 404 in production builds without it.
        FF_KIT: '1',
        // The checks read the Vietnamese site: a first visit there is Vietnamese (production's is English,
        // festfinder-web/src/kd/lang-pref.ts); e2e/next/languages.spec.ts checks the choice is kept.
        NEXT_PUBLIC_DEFAULT_LANG: 'vi',
      },
    },
  ],
});
