import { expect, test, type Page } from '@playwright/test';
import { signInWith, watch } from '../checks.ts';

/*
 * Phase 5 in Kính đêm: the fan's own profile on the web (/profile), badges on profiles, and
 * Moments: an organiser adds a photo on its page, a fan reports it, a moderator removes it.
 */

const ATTENDEE = { identifier: 'minh@example.com', password: 'festfinder123' };
const ORGANIZER = { identifier: 'team@ravolution.vn', password: 'ravolution2026' };
const ADMIN = { identifier: 'admin@feestfinder.com', password: 'festfinder-admin' };

/** A PNG header is all the upload checks read. */
const png = (w: number, h: number) => {
  const b = Buffer.alloc(64);
  b.writeUInt32BE(0x89504e47, 0); b.write('IHDR', 12, 'ascii'); b.writeUInt32BE(w, 16); b.writeUInt32BE(h, 20);
  return b;
};

async function open(page: Page, path: string) {
  const problems = watch(page);
  await page.goto(path);
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  return problems;
}

test('signed out, /profile asks to log in', async ({ page }) => {
  await open(page, '/profile');
  await expect(page.locator('[data-ff-gate]')).toBeVisible();
});

test('the fan’s own profile: numbers, passport, badges, and a photo of their own', async ({ page }) => {
  await signInWith(page, ATTENDEE);
  const problems = await open(page, '/profile');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Minh Anh');
  const badges = page.getByRole('region', { name: 'Huy hiệu' });
  await expect(badges).toBeVisible();
  await expect(badges.getByRole('button', { name: /Lần đầu/ })).toBeVisible();
  await badges.getByRole('button', { name: /Lần đầu/ }).click();
  await expect(badges.getByText('Tham dự sự kiện đầu tiên qua FeestFinder.')).toBeVisible();

  const moments = page.getByRole('region', { name: 'Khoảnh khắc' });
  await expect(moments).toBeVisible();
  await moments.locator('input[type=file]').setInputFiles({ name: 'night.png', mimeType: 'image/png', buffer: png(1200, 900) });
  await expect(moments.getByRole('button', { name: 'Mở ảnh' })).toHaveCount(1);
  expect((await (await page.request.get('/me/moments')).json()).items).toHaveLength(1);
  // The account menu leads here.
  await page.getByRole('button', { name: 'Tài khoản' }).click();
  await expect(page.getByRole('menuitem', { name: 'Hồ sơ của tôi' })).toHaveAttribute('href', '/profile');
  expect(problems).toEqual([]);
});

test('an organiser’s photo: added on its page, reported by a fan, removed by a moderator', async ({ page }) => {
  await signInWith(page, ORGANIZER);
  await open(page, '/o/ravoent');
  const moments = page.getByRole('region', { name: 'Khoảnh khắc' });
  await expect(moments.getByRole('button', { name: 'Thêm' })).toBeVisible();
  await moments.locator('input[type=file]').setInputFiles({ name: 'stage.png', mimeType: 'image/png', buffer: png(1600, 900) });
  await expect(moments.getByRole('button', { name: 'Mở ảnh' })).toHaveCount(1);
  // Its badges are on the page too.
  await expect(page.getByRole('region', { name: 'Huy hiệu' }).getByRole('button', { name: /Đã xác minh/ })).toBeVisible();

  await signInWith(page, ATTENDEE);
  await open(page, '/o/ravoent');
  const seen = page.getByRole('region', { name: 'Khoảnh khắc' });
  await expect(seen.getByRole('button', { name: 'Thêm' })).toHaveCount(0);
  await seen.getByRole('button', { name: 'Mở ảnh' }).first().click();
  await page.getByRole('button', { name: 'Báo cáo' }).click();
  await page.getByRole('button', { name: 'Spam hoặc quảng cáo' }).click();
  await expect(page.getByText('Cảm ơn bạn, kiểm duyệt viên sẽ xem')).toBeVisible();

  await signInWith(page, ADMIN);
  await open(page, '/console/reports');
  const reported = page.getByRole('region', { name: 'Ảnh bị báo cáo' });
  await expect(reported.getByText(/Trên Ravolution Entertainment/)).toBeVisible();
  await reported.getByRole('button', { name: 'Gỡ ảnh' }).first().click();
  await expect.poll(async () => (await (await page.request.get('/organizers/ravoent')).json()).moments.length).toBe(0);
});
