import { defineConfig, devices } from '@playwright/test';

/**
 * Smoke tests for the four screens: every route boots, renders the screen it names and
 * throws nothing. Two APIs start fresh on their own ports and embedded databases, so the
 * run touches neither a dev server nor Supabase: one on the demo data (screens.spec.ts), one
 * empty the way production starts (empty.spec.ts).
 */
const PORT = Number(process.env.SCREENS_PORT ?? 4100);
const EMPTY_PORT = Number(process.env.EMPTY_PORT ?? 4101);
const API_ENV = {
  DATABASE_URL: '',
  DATABASE_URL_FROM: '',
  JOBS_ENABLED: 'false',
  LINK_CHECKS_ENABLED: 'false',
  RATE_LIMIT_PER_MINUTE: '10000',
};

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
  // Not .env: that points at Supabase.
  webServer: [
    {
      command: 'node test/fixtures/reset.ts && node src/server.ts',
      url: `http://localhost:${PORT}/health`,
      timeout: 180_000,
      reuseExistingServer: false,
      env: {
        ...API_ENV,
        PORT: String(PORT),
        PUBLIC_BASE_URL: `http://localhost:${PORT}`,
        PGLITE_DIR: './.data/pglite-screens',
        UPLOAD_DIR: './.data/uploads-screens',
        FF_NOW: '2026-09-14T10:00:00+07:00',
      },
    },
    {
      command: 'node test/fixtures/empty.ts && node src/server.ts',
      url: `http://localhost:${EMPTY_PORT}/health`,
      timeout: 120_000,
      reuseExistingServer: false,
      env: {
        ...API_ENV,
        PORT: String(EMPTY_PORT),
        PUBLIC_BASE_URL: `http://localhost:${EMPTY_PORT}`,
        PGLITE_DIR: './.data/pglite-empty',
        UPLOAD_DIR: './.data/uploads-empty',
      },
    },
  ],
});
