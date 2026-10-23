import { expect, test } from '@playwright/test';
import { signInWith, watch } from '../checks.ts';

/*
 * The news feed (festfinder-web/src/kd/web/blog/news.tsx, kd/console/news): the EDM press's
 * headlines under the blog's News tab, each linking to its publisher, and the team's screen with
 * the publications and their headlines. The demo headlines come from test/fixtures/news.ts
 * (SEED_NEWS=1); no feed is read.
 */

const ADMIN = { identifier: 'admin@feestfinder.com', password: 'festfinder-admin' };

test('the News tab shows the press’s headlines with their publisher and a digest, filtered by topic', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const problems = watch(page);
  await page.goto('/blog?category=news');
  await expect(page.getByRole('heading', { level: 2, name: 'Tin mới từ báo chí EDM' })).toBeVisible();
  const card = page.getByRole('link', { name: 'Tomorrowland announces 2027 dates and pre-registration' });
  await expect(card).toBeVisible();
  await expect(card).toHaveAttribute('target', '_blank');
  await expect(card).toHaveAttribute('rel', /noopener/);
  await expect(card).toHaveAttribute('href', 'https://mixmag.example/news/tomorrowland-2027-dates');
  await expect(page.getByText('Tomorrowland đã chốt ngày tổ chức năm 2027 tại Boom và mở đăng ký trước vào tuần sau.')).toBeVisible();
  await expect(page.getByText('Tóm tắt tự động').first()).toBeVisible();
  // A headline without a picture is a text tile, never a broken image.
  await expect(page.locator('article .kd-art-t b[data-t="rekordbox adds stem separation on the CDJ-3000"]')).toHaveCount(1);
  await page.getByRole('group', { name: 'Chủ đề' }).getByRole('button', { name: /^Công nghệ/ }).click();
  await expect(page.getByRole('link', { name: 'rekordbox adds stem separation on the CDJ-3000' })).toBeVisible();
  await expect(card).toHaveCount(0);
  // In English the digest reads in English.
  await page.goto('/blog?category=news&lang=en');
  await expect(page.getByRole('heading', { level: 2, name: 'Latest from the EDM press' })).toBeVisible();
  await expect(page.getByText('Tomorrowland has set its 2027 dates in Boom and opens pre-registration next week.')).toBeVisible();
  expect(problems).toEqual([]);
});

test('the team switches a publication off and on, and hides a headline', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await signInWith(page, ADMIN);
  const problems = watch(page);
  await page.goto('/console/news');
  await expect(page.getByRole('heading', { level: 1, name: 'Tin tức' })).toBeVisible();
  const row = page.getByRole('row').filter({ hasText: 'Vietcetera (demo)' });
  await expect(row).toBeVisible();
  const sw = row.getByRole('switch', { name: 'Bật hoặc tắt Vietcetera (demo)' });
  await sw.click();
  await expect(row.getByText('Tắt')).toBeVisible();
  expect((await (await page.request.get('/news?region=vietnam')).json()).total).toBe(0);
  await sw.click();
  await expect(row.getByText('Tắt')).toHaveCount(0);
  // The headlines tab: hide one, then show it again.
  await page.getByRole('tab', { name: 'Tin' }).click();
  const item = page.getByRole('row').filter({ hasText: 'Boiler Room returns to Bangkok' });
  await item.getByRole('button', { name: 'Ẩn' }).click();
  await expect(item).toHaveCount(0);
  expect((await (await page.request.get('/news?region=asia')).json()).items.some((i: { title: string }) => i.title.startsWith('Boiler Room'))).toBe(false);
  await page.getByRole('switch', { name: 'Tin đã ẩn' }).click();
  const hidden = page.getByRole('row').filter({ hasText: 'Boiler Room returns to Bangkok' });
  await hidden.getByRole('button', { name: 'Hiện' }).click();
  await expect(hidden).toHaveCount(0);
  expect((await (await page.request.get('/news?region=asia')).json()).items.some((i: { title: string }) => i.title.startsWith('Boiler Room'))).toBe(true);
  expect(problems).toEqual([]);
});
