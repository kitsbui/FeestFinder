import { expect, test, type Page } from '@playwright/test';
import { watch } from '../checks.ts';

/*
 * The artists and the projects of design v2 phase 3 (artboard 08 of the design review): the
 * directory's tabs by who runs the profile with their counts and square cards with the next show,
 * no explanatory line; an artist's page in tabs (shows, mixes, played, about) without a second
 * banner of their name; /p's empty state says one thing and offers one.
 */

async function open(page: Page, path: string) {
  const problems = watch(page);
  await page.goto(path);
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  return problems;
}

test('the directory: tabs by who runs the profile, with counts, and no line explaining them', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const problems = await open(page, '/a');
  const tabs = page.getByRole('navigation', { name: 'Ai quản lý hồ sơ' });
  await expect(tabs.getByRole('link', { name: /^Có hồ sơ\s*\d+/ })).toHaveAttribute('aria-current', 'page');
  await expect(tabs.getByRole('link', { name: /^Từ Radar\s*\d+/ })).toHaveAttribute('href', '/a/radar');
  await expect(page.getByText(/chưa có người quản lý$/)).toHaveCount(0);
  // A card: the name, what they do, the next show.
  const card = page.getByRole('list', { name: 'Danh sách nghệ sĩ' }).getByRole('listitem').first();
  await expect(card.getByRole('heading', { level: 2 })).toBeVisible();
  await expect(card.getByText(/^Sắp diễn:/)).toBeVisible();
  await tabs.getByRole('link', { name: /^Từ Radar/ }).click();
  await expect(page).toHaveURL(/\/a\/radar$/);
  await expect(tabs.getByRole('link', { name: /^Từ Radar/ })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('button', { name: 'Đây là tôi' }).first()).toBeVisible();
  await tabs.getByRole('link', { name: 'Nhận booking' }).click();
  await expect(page).toHaveURL(/\/a\?booking=1$/);
  expect(problems).toEqual([]);
});

test('a phone: two square cards to a row, the first names in the first screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, '/a/radar');
  const names = page.getByRole('list', { name: 'Danh sách nghệ sĩ' }).getByRole('heading', { level: 2 });
  const [a, b] = [await names.nth(0).boundingBox(), await names.nth(1).boundingBox()];
  expect(a!.y + a!.height).toBeLessThan(844);
  expect(Math.abs(a!.y - b!.y), 'side by side').toBeLessThan(4);
});

test('an artist: no banner repeating the name, the shows and the rest in tabs', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const problems = await open(page, '/a/hoaprox');
  await expect(page.getByRole('heading', { level: 1, name: 'Hoaprox' })).toBeVisible();
  await expect(page.locator('.kd-art-banner')).toHaveCount(0);
  const tabs = page.getByRole('tablist');
  await expect(tabs.getByRole('tab', { name: /^Sắp diễn/ })).toHaveAttribute('aria-selected', 'true');
  await tabs.getByRole('tab', { name: /^Đã diễn/ }).click();
  await expect(page.getByRole('tabpanel', { name: 'Đã diễn' })).toBeVisible();
  await expect(page.getByText('EDM', { exact: true })).toHaveCount(0);
  expect(problems).toEqual([]);
});

test('/p: one line and one thing to do when nothing matches', async ({ page }) => {
  await open(page, '/p?seeking=venue');
  const empty = page.getByRole('status');
  if (await empty.count()) {
    await empty.getByRole('button', { name: 'Bỏ lọc' }).click();
    await expect(page).not.toHaveURL(/seeking=/);
  }
  await expect(page.getByRole('link', { name: 'Tạo dự án' }).first()).toHaveAttribute('href', '/p/new');
});
