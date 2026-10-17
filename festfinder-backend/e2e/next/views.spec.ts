import { expect, test, type Page } from '@playwright/test';
import { signInWith, watch } from '../checks.ts';
import { ACCOUNTS } from './routes.ts';

/*
 * Pictures and motion (design v2 phase 8, artboard 23 "Trên 9"): a page never prints a name twice
 * (an event without a cover shows a poster of its date beside its H1; an organiser without a cover
 * has no banner); a quiet day of the list fills the row on a computer; every stamp of the passport
 * and every badge has its own art; the passport shares as a story; the Console counts the coming
 * listings with a real cover.
 *
 * Named to run after the flows (files run in name order), as wcag.spec.ts is: opening these pages
 * makes Next prefetch and cache the pages they link to (an artist page), which a later flow that
 * changes one of them (artist.spec adds a mix) would then read stale.
 */

async function open(page: Page, path: string) {
  const problems = watch(page);
  await page.goto(path);
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  return problems;
}

/** The names a page's tiles draw (data-t), which CSS sets as text. */
const tileNames = (page: Page) => page.locator('.kd-art [data-t]').evaluateAll((els) => els.map((e) => e.getAttribute('data-t')));

test('an event without a cover: a poster of its date beside the name, never the name twice', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const problems = await open(page, '/e/ravo');
  const hero = page.locator('.kd-art-hero');
  await expect(hero.locator('.kd-art-p b')).toHaveAttribute('data-t', /^\d{2}\.\d{2}$/);
  await expect(hero.locator('.kd-art-p i')).toHaveAttribute('data-m', /TP\.HCM/);
  expect(await tileNames(page)).not.toContain('Ravolution Music Festival');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ravolution Music Festival');
  expect(problems).toEqual([]);
});

test('an organiser without a cover has no banner repeating the name', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, '/o/ravoent');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Ravolution Entertainment');
  expect(await tileNames(page)).not.toContain('Ravolution Entertainment');
});

test('a computer: a day of one or two nights fills the row', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, '/');
  const days = page.locator('.kd-days > section');
  await expect(days.first()).toBeVisible();
  let quiet = 0;
  for (const day of await days.all()) {
    const cards = day.locator(':scope > .kd-day-solo .kd-ev, :scope > .kd-day-pair .kd-ev');
    const n = await cards.count();
    if (!n) continue;
    quiet++;
    const row = (await day.boundingBox())!.width;
    const used = (await Promise.all((await cards.all()).map(async (c) => (await c.boundingBox())!.width))).reduce((a, b) => a + b, 0);
    expect(used, `${await day.locator('h2').textContent()}: the cards use ${Math.round(used)} of ${Math.round(row)} px`).toBeGreaterThan(row * 0.9);
  }
  expect(quiet, 'the demo week has days of one and two nights').toBeGreaterThan(0);
});

test('every stamp and badge has its own art; the passport shares as a story', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signInWith(page, ACCOUNTS.fan);
  const problems = await open(page, '/profile');
  const stamps = page.locator('.kd-stamp .kd-tile');
  await expect(stamps.first()).toBeVisible();
  const art = await stamps.evaluateAll((els) => els.map((e) => ({
    tilt: (e as HTMLElement).style.getPropertyValue('--tilt'),
    mono: e.querySelector('.kd-stamp-mono')?.getAttribute('data-t') ?? null,
    cover: !!e.querySelector('.kd-stamp-img'),
  })));
  expect(art.length).toBeGreaterThan(1);
  expect(art.every((a) => a.cover || a.mono), 'a cover or the initials on every stamp').toBe(true);
  expect(new Set(art.map((a) => `${a.tilt}|${a.mono}|${a.cover}`)).size, 'no two stamps alike').toBeGreaterThan(1);
  await expect(page.getByRole('region', { name: 'Huy hiệu' }).locator('.kd-emb .kd-emb-i svg').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Chia sẻ thành story' })).toBeVisible();
  expect(problems).toEqual([]);
});

test('the Console counts the coming listings with a real cover', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signInWith(page, ACCOUNTS.admin);
  await open(page, '/console/insights');
  await expect(page.getByText('Có ảnh thật')).toBeVisible();
  await expect(page.getByText(/^trên \d+ tin sắp diễn$/)).toBeVisible();
});
