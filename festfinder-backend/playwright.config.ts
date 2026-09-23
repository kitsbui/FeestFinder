import { defineConfig, devices } from '@playwright/test';

/**
 * Smoke tests for the four screens: every route boots, renders the screen it names and
 * throws nothing. The API is started fresh on its own port and database, so the run does
 * not touch a dev server or its data.
 */
const PORT = Number(process.env.SCREENS_PORT ?? 4100);

export default defineConfig({
  testDir: './e2e',
  // Next-only checks run with playwright.next.config.ts.
  testIgnore: ['next/**'],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...devices['Desktop Chrome'],
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node --env-file-if-exists=.env src/db/cli.ts reset && node src/server.ts',
    url: `http://localhost:${PORT}/health`,
    timeout: 180_000,
    reuseExistingServer: false,
    env: {
      PORT: String(PORT),
      PUBLIC_BASE_URL: `http://localhost:${PORT}`,
      PGLITE_DIR: './.data/pglite-screens',
      UPLOAD_DIR: './.data/uploads-screens',
      FF_NOW: '2026-09-14T10:00:00+07:00',
      JOBS_ENABLED: 'false',
      LINK_CHECKS_ENABLED: 'false',
      RATE_LIMIT_PER_MINUTE: '10000',
    },
  },
});
