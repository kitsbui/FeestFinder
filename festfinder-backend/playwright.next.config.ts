import { defineConfig, devices } from '@playwright/test';

/**
 * The same screen tests, against the Next.js app (festfinder-web) in production mode,
 * plus what only it does: server-rendered pages for search engines, security headers,
 * the service worker. A fresh API runs behind it on its own port and database.
 *
 * FF_API_ORIGIN is read when the app is built (it becomes a rewrite), so the build runs
 * here with the test API's address.
 */
const API_PORT = Number(process.env.SCREENS_PORT ?? 4100);
const WEB_PORT = Number(process.env.WEB_PORT ?? 3100);
const API = `http://localhost:${API_PORT}`;
const WEB = `http://localhost:${WEB_PORT}`;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: WEB,
    ...devices['Desktop Chrome'],
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'node --env-file-if-exists=.env src/db/cli.ts reset && node src/server.ts',
      url: `${API}/health`,
      timeout: 180_000,
      reuseExistingServer: false,
      env: {
        PORT: String(API_PORT),
        // Behind the Next app, links and uploads use its address.
        PUBLIC_BASE_URL: WEB,
        PGLITE_DIR: './.data/pglite-screens',
        UPLOAD_DIR: './.data/uploads-screens',
        FF_NOW: '2026-09-14T10:00:00+07:00',
        JOBS_ENABLED: 'false',
        LINK_CHECKS_ENABLED: 'false',
        RATE_LIMIT_PER_MINUTE: '10000',
      },
    },
    {
      command: process.env.WEB_SKIP_BUILD
        ? `npx next start --port ${WEB_PORT}`
        : `npm run build && npx next start --port ${WEB_PORT}`,
      cwd: '../festfinder-web',
      url: `${WEB}/robots.txt`,
      timeout: 300_000,
      reuseExistingServer: false,
      env: {
        FF_API_ORIGIN: API,
        SITE_URL: WEB,
        NEXT_TELEMETRY_DISABLED: '1',
      },
    },
  ],
});
