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

/*
 * /ops is plain scripts: it is ready when its own frame (or the sign-in card) is there.
 * It opens in Vietnamese.
 */
export async function expectOps(page: Page, path: string, shows: RegExp, landsOn: string | RegExp = path) {
  const problems = watch(page);
  await page.goto(path);
  await page.locator('.op-frame, .op-gate').first().waitFor({ state: 'attached' });
  await expect.poll(() => page.locator('body').innerText(), { message: `${path} shows ${shows}` }).toMatch(shows);
  // The queue and the inbox open their first item on a wide screen, which adds its id.
  const at = new URL(page.url()).pathname;
  if (typeof landsOn === 'string') expect(at, `${path} lands on ${landsOn}`).toBe(landsOn);
  else expect(at, `${path} lands on ${landsOn}`).toMatch(landsOn);
  expect(problems, `${path} loaded cleanly`).toEqual([]);
}
