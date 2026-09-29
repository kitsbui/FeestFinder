import { expect, type Page } from '@playwright/test';

/*
 * What every screen test checks: the route boots, shows the screen it names, and breaks
 * nothing on the way — no uncaught exception, no Content-Security-Policy violation, no
 * server error, and no runtime error banner from the design runtime.
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

/** Opens a route and waits for the screen that should be there. */
export async function expectScreen(page: Page, path: string, shows: RegExp) {
  const problems = watch(page);
  await page.goto(path);
  // The screen itself (or the sign-in card that stands in for it), not the
  // server-rendered page some routes show until it mounts.
  await page.locator('#dc-root > .sc-host, [data-ff-gate]').first().waitFor({ state: 'attached' });
  // innerText is what a person sees: hidden sections are left out and text-transform
  // applies, so this proves the named screen is the one on show.
  await expect.poll(() => page.locator('body').innerText(), { message: `${path} shows ${shows}` }).toMatch(shows);
  const text = await page.locator('body').innerText();
  expect(text, `${path} rendered without a runtime error`).not.toMatch(/renderVals\(\)|is not a function|Cannot read properties/);
  expect(new URL(page.url()).pathname, `${path} kept its URL`).toBe(path);
  expect(problems, `${path} loaded cleanly`).toEqual([]);
}

/*
 * The operations back office is plain scripts rather than the design runtime, so it is
 * ready when its own frame (or the sign-in card) is there. It opens in Vietnamese.
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
