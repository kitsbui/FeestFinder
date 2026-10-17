import { expect, test, type Page } from '@playwright/test';
import { signInWith, watch } from '../checks.ts';

/*
 * Feedback (festfinder-web src/kd/feedback): no button floats over the page since design v2 phase 1.
 * "Góp ý" is in the footer, the account menu, the "Tôi" hub on a phone and every back office's rail;
 * a guest sends a bug report with an email and gets a ticket, and the team finds it in the Console.
 */

const ATTENDEE = { identifier: 'minh@example.com', password: 'festfinder123' };
const ADMIN = { identifier: 'admin@feestfinder.com', password: 'festfinder-admin' };

async function open(page: Page, path: string) {
  const problems = watch(page);
  await page.goto(path);
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  return problems;
}

/** The footer's "Góp ý", on every public page. */
const footerFeedback = (page: Page) => page.getByRole('contentinfo').getByRole('button', { name: 'Góp ý' });

test('"Góp ý" is in the footer, the account menu, the phone\'s "Tôi" and the rails; nothing floats', async ({ page }) => {
  for (const path of ['/', '/e/ravo', '/a/hoaprox']) {
    await open(page, path);
    await expect(page.locator('.kd-fab'), path).toHaveCount(0);
    await footerFeedback(page).click();
    await expect(page.getByRole('dialog', { name: 'Góp ý' }), path).toBeVisible();
    await page.keyboard.press('Escape');
  }
  await page.setViewportSize({ width: 1280, height: 800 });
  await signInWith(page, ATTENDEE);
  await open(page, '/');
  await page.getByRole('button', { name: 'Tài khoản' }).click();
  await page.getByRole('menu', { name: 'Tài khoản' }).getByRole('menuitem', { name: 'Góp ý' }).click();
  await expect(page.getByRole('dialog', { name: 'Góp ý' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, '/profile');
  await page.getByRole('navigation', { name: 'Tôi' }).getByRole('button', { name: 'Góp ý' }).click();
  await expect(page.getByRole('dialog', { name: 'Góp ý' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 1280, height: 800 });
  await signInWith(page, ADMIN);
  await open(page, '/console');
  await page.getByRole('navigation', { name: 'Console' }).getByRole('button', { name: 'Gửi góp ý' }).click();
  await expect(page.getByRole('dialog', { name: 'Góp ý' })).toBeVisible();
});

test('a guest sends a bug report and gets a ticket; the team finds it', async ({ page }) => {
  const problems = await open(page, '/e/ravo');
  await footerFeedback(page).click();
  const sheet = page.getByRole('dialog', { name: 'Góp ý' });
  await sheet.getByRole('button', { name: 'Báo lỗi kỹ thuật' }).click();
  await sheet.getByRole('button', { name: 'Gửi' }).click();
  await expect(sheet.getByText('Hãy nhập tiêu đề, mô tả và email')).toBeVisible();
  const title = `Trang trắng ${Date.now() % 100000}`;
  await sheet.getByLabel('Tiêu đề').fill(title);
  await sheet.getByLabel('Mô tả').fill('Bấm Mua vé thì màn hình trắng.');
  await sheet.getByRole('radio', { name: 'Cao' }).click();
  await sheet.getByLabel('Các bước tái hiện').fill('1. Vào trang\n2. Bấm Mua vé');
  await sheet.getByLabel('Email').fill('tester@example.com');
  await sheet.getByText('Tự động đính kèm').click();
  await expect(sheet.getByText('/e/ravo', { exact: true })).toBeVisible();
  await sheet.getByRole('button', { name: 'Gửi' }).click();
  await expect(page.getByRole('dialog', { name: 'Cảm ơn bạn' }).getByText(/Mã của bạn: FF-FB-\d{8}-[A-Z2-9]{4}/)).toBeVisible();
  expect(problems).toEqual([]);

  await signInWith(page, ADMIN);
  await open(page, '/console/feedback');
  await page.getByRole('button', { name: new RegExp(title) }).click();
  const drawer = page.getByRole('dialog', { name: title });
  await expect(drawer.getByText('Bấm Mua vé thì màn hình trắng.')).toBeVisible();
  await expect(drawer.getByRole('link', { name: '/e/ravo' })).toBeVisible();
});
