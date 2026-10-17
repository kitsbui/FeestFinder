import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { signInWith, watch } from '../checks.ts';
import { ACCOUNTS } from './routes.ts';

/*
 * The back offices after design v2 phase 5: rails of at most seven entries whose groups unfold
 * while one of their pages is open; Studio's wizard as four steps with a progress bar, open before
 * signing in (the form stays on the device and signing in comes at "Gửi duyệt"); the Console's
 * queue with the list beside the listing from 1200px, the bar for the rows picked, and the
 * listing's tabs, the keyboard as before. Nothing here decides a listing or sends a draft:
 * console.spec.ts approves from the same queue afterwards.
 */

async function open(page: Page, path: string) {
  const problems = watch(page);
  await page.goto(path);
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  return problems;
}

/** The rail's entries in sight, without the foot (Góp ý, Đăng xuất…, hidden in a folded rail). */
const entries = (page: Page, name: string) => page.getByRole('navigation', { name }).locator('a.kd-sn:not(.kd-sn-sub):not(.kd-sn-hide a)');

test.describe('Studio', () => {
  test('the rail: seven entries, a group unfolds on its page', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await signInWith(page, ACCOUNTS.organizer);
    const problems = await open(page, '/studio');
    const rail = page.getByRole('navigation', { name: 'Studio' });
    await expect(entries(page, 'Studio')).toHaveText([/^Hôm nay/, /^Sự kiện/, /^Khách và cửa/, /^Doanh thu/, /^Quảng bá/, /^Hộp thư/, /^Gig & booking/]);
    await expect(rail.getByRole('link', { name: /^Hôm nay/ })).toHaveAttribute('aria-current', 'page');
    // Folded: the group's pages are not listed.
    await expect(rail.getByRole('link', { name: 'Check-in' })).toHaveCount(0);
    await rail.getByRole('link', { name: /^Khách và cửa/ }).click();
    await expect(page).toHaveURL(/\/studio\/attendees/);
    await expect(rail.getByRole('link', { name: /^Người tham dự/ })).toHaveAttribute('aria-current', 'page');
    // The door is a page of its own, without the rail.
    await expect(rail.getByRole('link', { name: 'Check-in' })).toHaveAttribute('href', '/studio/door');
    // "Hôm nay": every row of the to-do carries its action.
    await page.goto('/studio');
    const todo = page.getByRole('region', { name: /^Việc cần làm/ });
    if (await todo.count()) {
      for (const row of await todo.getByRole('listitem').all()) await expect(row.getByRole('link')).toHaveCount(1);
    }
    expect(problems).toEqual([]);
  });

  test('the wizard opens before signing in: four steps, the form kept on the device, sign-in at submit', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const problems = await open(page, '/studio/new');
    const steps = page.getByRole('navigation', { name: 'Các bước' });
    await expect(steps.getByRole('button')).toHaveCount(4);
    await expect(steps.getByRole('button').first()).toHaveAttribute('aria-current', 'step');
    await expect(page.getByRole('heading', { level: 2, name: 'Cơ bản' })).toBeVisible();
    const title = 'Đêm thử trên máy';
    await page.getByLabel('Tên sự kiện').fill(title);
    await expect(page.getByText('Lưu trên máy này')).toBeVisible();
    // Kept on this device: a reload brings it back.
    await page.reload();
    await expect(page.getByLabel('Tên sự kiện')).toHaveValue(title);
    // One step on screen at a time; the stepper jumps.
    await page.getByRole('button', { name: 'Tiếp tục' }).click();
    await expect(steps.getByRole('button').nth(1)).toHaveAttribute('aria-current', 'step');
    await expect(page.getByLabel('Tên sự kiện')).toHaveCount(0);
    await steps.getByRole('button').nth(3).click();
    await expect(page.getByRole('heading', { level: 2, name: 'Xem lại & gửi duyệt' })).toBeVisible();
    // Uploading needs an account; sending asks for one.
    await page.getByRole('button', { name: 'Đăng nhập để gửi duyệt' }).click();
    await expect(page.getByRole('dialog', { name: 'Đăng nhập' })).toBeVisible();
    await page.keyboard.press('Escape');
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id)).toEqual([]);
    expect(problems).toEqual([]);
  });
});

test.describe('Console', () => {
  test.beforeEach(async ({ page }) => signInWith(page, ACCOUNTS.admin));

  test('the rail: seven entries, a group unfolds on its page', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await open(page, '/console/venues');
    const rail = page.getByRole('navigation', { name: 'Console' });
    await expect(entries(page, 'Console')).toHaveCount(7);
    await expect(rail.getByRole('link', { name: /^Địa điểm/ })).toHaveAttribute('aria-current', 'page');
    await expect(rail.getByRole('link', { name: /^Nghệ sĩ/ })).toBeVisible();
    // Another group stays folded.
    await expect(rail.getByRole('link', { name: /^Nhật ký/ })).toHaveCount(0);
  });

  test('a wide screen: the list beside the listing, the bar for the rows picked, the listing’s tabs', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const problems = await open(page, '/console');
    const list = page.getByRole('complementary', { name: 'Hàng chờ' });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const [l, d] = [await list.boundingBox(), await page.getByRole('heading', { level: 1 }).boundingBox()];
    expect(d!.x).toBeGreaterThan(l!.x + l!.width - 1);
    expect(d!.y).toBeLessThan(l!.y + l!.height);

    // The bar for the rows picked: count, approve, send back, clear.
    const boxes = list.getByRole('checkbox');
    await boxes.nth(0).check();
    await boxes.nth(1).check();
    const bar = page.getByRole('group', { name: 'Tin đã chọn' });
    await expect(bar).toContainText('Đã chọn 2');
    await expect(bar.getByRole('button')).toHaveText(['Duyệt 2 tin', 'Trả lại…', 'Bỏ chọn']);
    await bar.getByRole('button', { name: 'Bỏ chọn' }).click();
    await expect(bar).toHaveCount(0);

    // The tabs: the listing first; the arrows move along them; the choice stays on the next listing.
    const tabs = page.getByRole('tablist', { name: 'Các phần của tin' });
    const listing = tabs.getByRole('tab', { name: 'Toàn bộ tin' });
    await expect(listing).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel', { name: 'Toàn bộ tin' }).getByRole('heading', { name: 'Hình ảnh' })).toBeVisible();
    await listing.focus();
    await page.keyboard.press('ArrowRight');
    const evidence = tabs.getByRole('tab', { name: /^Nguồn và bằng chứng/ });
    await expect(evidence).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('heading', { name: /^Chất lượng · \d+\/100$/ })).toBeVisible();
    const first = await page.getByRole('heading', { level: 1 }).textContent();
    await page.locator('body').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('j');
    await expect(page.getByRole('heading', { level: 1 })).not.toHaveText(first!);
    await expect(evidence).toHaveAttribute('aria-selected', 'true');
    await tabs.getByRole('tab', { name: /^Lịch sử/ }).click();
    await expect(page.getByRole('tabpanel', { name: 'Lịch sử' }).getByText('Nhắn nhà tổ chức')).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('a phone: the listing under the list, and a tap goes to it', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page, '/console');
    const list = page.getByRole('complementary', { name: 'Hàng chờ' });
    const [l, d] = [await list.boundingBox(), await page.getByRole('heading', { level: 1 }).boundingBox()];
    expect(d!.y).toBeGreaterThan(l!.y + l!.height - 1);
    await list.getByRole('listitem').nth(1).getByRole('button').click();
    await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
  });
});
