import { expect, test, type Page } from '@playwright/test';
import { signInWith, watch } from '../checks.ts';

/*
 * The feedback button on every page (festfinder-web src/kd/feedback): it never covers the app's
 * tab bar or the ticket dock, a guest sends a bug report with an email and gets a ticket, and the
 * team finds it in the Console.
 */

const ATTENDEE = { identifier: 'minh@example.com', password: 'festfinder123' };
const ADMIN = { identifier: 'admin@feestfinder.com', password: 'festfinder-admin' };

async function open(page: Page, path: string) {
  const problems = watch(page);
  await page.goto(path);
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  return problems;
}

const fab = (page: Page) => page.getByRole('button', { name: 'Góp ý / Feedback' });

test('the button is on the site, the app and the back offices', async ({ page }) => {
  for (const path of ['/', '/e/ravo', '/a/hoaprox', '/?view=grid']) {
    await open(page, path);
    await expect(fab(page), path).toBeVisible();
  }
  await signInWith(page, ADMIN);
  await open(page, '/console');
  await expect(fab(page)).toBeVisible();
});

test('on a phone it sits above the ticket dock and the tab bar', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await signInWith(page, ATTENDEE);
  for (const [path, bar] of [['/app/e/ravo', '.kd-dock'], ['/app', '.kd-tabbar']] as const) {
    await open(page, path);
    const button = await fab(page).boundingBox();
    const under = await page.locator(bar).first().boundingBox();
    expect(button && under, path).toBeTruthy();
    expect(button!.y + button!.height, `${path}: above ${bar}`).toBeLessThanOrEqual(under!.y);
  }
});

test('a guest sends a bug report and gets a ticket; the team finds it', async ({ page }) => {
  const problems = await open(page, '/e/ravo');
  await fab(page).click();
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
