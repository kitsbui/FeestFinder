import { expect, test, type Page } from '@playwright/test';
import { watch } from '../checks.ts';

/*
 * "Đi cùng bạn bè" is private by default (migration 045, owner 2026-10-18): friends see the nights
 * someone goes to only once they said yes. The first save asks once; settings change the answer.
 */

/** A new account, signed in with an email code (the test API shows the code). */
async function newAccount(page: Page) {
  const email = `share-${Date.now()}@example.com`;
  const start = await (await page.request.post('/auth/otp/start', { data: { channel: 'email', identifier: email } })).json();
  // The code alone signs the new account in (phase 17), on this browser's cookies.
  const verify = await page.request.post('/auth/otp/verify', { data: { challengeId: start.challengeId, code: start.devCode } });
  expect(verify.ok(), 'sign up as ' + email).toBeTruthy();
}

const shareNights = async (page: Page) => (await (await page.request.get('/auth/session')).json()).user.shareNights as boolean | null;

test('the first save asks once whether friends see the nights, and settings change the answer', async ({ page }) => {
  const problems = watch(page);
  await newAccount(page);
  expect(await shareNights(page)).toBeNull();
  await page.goto('/e/ravo');
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  // A new account is asked how it comes to music first; the question about friends waits for that.
  const role = page.getByRole('dialog', { name: 'Bạn đến với âm nhạc thế nào?' });
  await expect(role).toBeVisible();
  await role.getByRole('button', { name: 'Đóng' }).click();
  await expect(role).toHaveCount(0);
  await page.getByRole('button', { name: /^Lưu sự kiện/ }).first().click();
  const ask = page.getByRole('dialog', { name: 'Cho bạn bè thấy bạn đi những đêm nào?' });
  await expect(ask).toBeVisible();
  await ask.getByRole('button', { name: 'Để riêng tư' }).click();
  await expect(ask).toHaveCount(0);
  await expect.poll(() => shareNights(page)).toBe(false);
  // Answered: saving again asks nothing.
  await page.getByRole('button', { name: /^Lưu sự kiện|^Đã lưu/ }).first().click();
  await page.getByRole('button', { name: /^Lưu sự kiện|^Đã lưu/ }).first().click();
  await expect(ask).toHaveCount(0);
  // Settings: the same answer, changed with one switch.
  await page.goto('/app/settings');
  const sw = page.getByRole('switch', { name: 'Bạn bè thấy đêm tôi đi' });
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  await sw.click();
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  await expect.poll(() => shareNights(page)).toBe(true);
  expect(problems).toEqual([]);
});
