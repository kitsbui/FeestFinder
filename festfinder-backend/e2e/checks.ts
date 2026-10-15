import { expect, type Page } from '@playwright/test';

/*
 * What every browser test checks: the route boots, shows what it names, and breaks
 * nothing on the way — no uncaught exception, no Content-Security-Policy violation, no
 * server error.
 */

/** Collects what should never happen while a screen loads. */
export function watch(page: Page) {
  const problems: string[] = [];
  page.on('pageerror', (e) => problems.push(`uncaught: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error' && /Content Security Policy|Refused to (load|execute|apply)/i.test(m.text())) {
      problems.push(`csp: ${m.text()}`);
    }
  });
  page.on('response', (r) => {
    if (r.status() >= 500) problems.push(`${r.status()} ${r.url()}`);
  });
  return problems;
}

export async function signInWith(page: Page, account: { identifier: string; password: string }) {
  const res = await page.request.post('/auth/login', { data: account });
  expect(res.ok(), `sign in as ${account.identifier}`).toBeTruthy();
}
