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

/*
 * Your own (design v2 phase 9): "Cho bạn" lists this device's city and styles, and asks for them the
 * first time; an event page lets you hear its lineup first, the player loading only on play; the
 * "with friends" row shows the friends going; the wizard leads with the common styles and finds the rest.
 */

test('"Cho bạn": the device’s city and styles, asked for the first time', async ({ page, browser }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    try { localStorage.setItem('ff_city', 'ho-chi-minh'); localStorage.setItem('ff_likes', JSON.stringify(['techno', 'house'])); } catch { /* storage blocked */ }
  });
  const problems = await open(page, '/');
  const chip = page.getByRole('group', { name: 'Bộ lọc' }).getByRole('button', { name: 'Cho bạn' });
  await chip.click();
  await expect(page).toHaveURL(/city=ho-chi-minh/);
  await expect(page).toHaveURL(/style=techno(%2C|,)house/);
  await expect(chip).toHaveAttribute('aria-pressed', 'true');
  await chip.click();
  await expect(page).not.toHaveURL(/style=/);
  expect(problems).toEqual([]);
  // A device that never said: the chip asks.
  const fresh = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await open(fresh, '/');
  await fresh.locator('.kd-cmd').getByRole('button', { name: 'Cho bạn' }).click();
  await expect(fresh.getByRole('dialog', { name: 'Bạn ở thành phố nào?' })).toBeVisible();
  await fresh.close();
});

test('an event page: hear the lineup first, the player only on play; friends going in the "with friends" row', async ({ page, request }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  // The team adds a set to an artist of the lineup (the test API reads services from a fake network).
  expect((await request.post('/auth/login', { data: ACCOUNTS.admin })).ok()).toBeTruthy();
  const ev = await (await request.get('/events/ravo')).json();
  const artist = ev.artistLinks[0];
  const id = (await (await request.get('/artists/' + artist.slug)).json()).artist.id;
  const added = await request.post(`/admin/artists/${id}/mixes`, { data: { url: `https://soundcloud.com/${artist.slug}/closing-set` } });
  expect(added.status(), await added.text()).toBe(201);
  await signInWith(page, ACCOUNTS.fan);
  const problems = await open(page, '/e/ravo');
  const listen = page.getByRole('region', { name: 'Nghe trước' });
  await expect(listen).toBeVisible();
  await expect(listen.locator('iframe'), 'nothing from the service before play').toHaveCount(0);
  await listen.getByRole('button', { name: new RegExp(`của ${artist.name}, nghe$`) }).first().click();
  await expect(listen.locator('iframe').first()).toHaveAttribute('src', /^https:\/\/w\.soundcloud\.com\/player\/.*auto_play=true/);
  const mine = await (await page.request.get('/events/ravo')).json();
  const going = mine.friends?.going?.length ?? 0;
  const row = page.getByRole('link', { name: /^Đi cùng bạn bè/ });
  if (going) await expect(row).toContainText(`${going} bạn sẽ đi`);
  else await expect(row).not.toContainText('bạn sẽ đi');
  expect(problems).toEqual([]);
});

test('the wizard leads with the common styles and finds the rest', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, '/studio/new');
  const styles = page.getByRole('group', { name: 'Dòng nhạc' });
  await expect(styles.getByRole('button', { name: 'Techno', exact: true })).toBeVisible();
  await expect(styles.getByRole('button', { name: 'Acid techno' })).toHaveCount(0);
  await styles.getByRole('searchbox', { name: 'Tìm dòng nhạc' }).fill('acid');
  await styles.getByRole('button', { name: 'Acid techno' }).click();
  await expect(styles.getByRole('button', { name: 'Acid techno' })).toHaveAttribute('aria-pressed', 'true');
  await styles.getByRole('searchbox', { name: 'Tìm dòng nhạc' }).fill('');
  // A chosen style stays in sight with the common ones; the rest are one press away.
  await expect(styles.getByRole('button', { name: 'Acid techno' })).toBeVisible();
  await styles.getByRole('button', { name: /^Thêm \d+ dòng nhạc$/ }).click();
  await expect(styles.getByRole('button', { name: 'Gabber' })).toBeVisible();
});
