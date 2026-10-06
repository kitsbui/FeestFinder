import { expect, test, type Page } from '@playwright/test';
import { signInWith, watch } from '../checks.ts';

/*
 * The rest of the app in Kính đêm: notifications, Smart Alerts, notification settings, live
 * mode, the recap, the group plan and its chat, direct messages, hyped, following and the
 * guide. Signed in as the demo attendee, phone-sized.
 */

const ATTENDEE = { identifier: 'minh@example.com', password: 'festfinder123' };

test.use({ viewport: { width: 390, height: 844 } });

async function open(page: Page, path: string) {
  const problems = watch(page);
  await page.goto(path);
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  return problems;
}

test.describe('the app, signed in', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('ff_city', 'ho-chi-minh'); } catch { /* storage blocked */ } });
    await signInWith(page, ATTENDEE);
  });

  test('notifications open what they are about, and can all be marked read', async ({ page }) => {
    const problems = await open(page, '/app/notifications');
    await expect(page.getByRole('link', { name: /Vé đã vào mục Vé của tôi/ })).toHaveAttribute('href', '/app/tickets');
    await page.getByRole('button', { name: 'Đánh dấu đã đọc' }).click();
    await expect.poll(async () => (await (await page.request.get('/me/notifications?limit=1')).json()).unread).toBe(0);
    expect(problems).toEqual([]);
  });

  test('Smart Alerts take cities and music styles as they are tapped', async ({ page }) => {
    await open(page, '/app/alerts');
    await page.getByRole('group', { name: 'Thành phố' }).getByRole('button', { name: 'Bangkok' }).click();
    await expect.poll(async () => (await (await page.request.get('/me/alert')).json()).cities).toEqual(['bangkok']);
    await page.getByRole('group', { name: 'Phong cách nhạc' }).getByRole('button', { name: 'Techno', exact: true }).click();
    await expect.poll(async () => (await (await page.request.get('/me/alert')).json()).styles).toContain('techno');
    await expect(page.getByRole('status').filter({ hasText: /sự kiện đang khớp/ })).toBeVisible();
  });

  test('notification settings: a row per kind of update, a column per channel', async ({ page }) => {
    await open(page, '/app/settings');
    const weeklyEmail = page.getByRole('switch', { name: 'Gợi ý hằng tuần · Email' });
    const was = (await weeklyEmail.getAttribute('aria-checked')) === 'true';
    await weeklyEmail.click();
    await expect.poll(async () => (await (await page.request.get('/me/notification-preferences')).json()).matrix.weekly.email).toBe(!was);
  });

  test('live mode: what is on each stage, and a reminder 10 minutes before a set', async ({ page }) => {
    const problems = await open(page, '/app/live/hozo');
    await expect(page.getByText('Trực tiếp', { exact: true })).toBeVisible();
    await expect(page.getByRole('group', { name: 'Sân khấu' }).getByRole('button')).toHaveCount(3);
    const bell = page.getByRole('button', { name: /^Nhắc tôi: / }).first();
    await bell.click();
    await expect(bell).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('region', { name: 'Sơ đồ khu lễ hội' }).getByText('Food court')).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('the recap rates a night that was', async ({ page }) => {
    await open(page, '/app/recap/ravo-2025');
    await expect(page.getByRole('heading', { name: 'Đêm nhạc đã qua' })).toBeVisible();
    await page.getByRole('button', { name: 'Gửi đánh giá' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Chọn số sao trước đã' })).toBeVisible();
    await page.getByRole('radio', { name: '4 sao' }).click();
    await page.getByRole('button', { name: 'Âm thanh' }).click();
    await page.getByRole('button', { name: 'Gửi đánh giá' }).click();
    await expect(page.getByText(/Cảm ơn/)).toBeVisible();
  });

  test('the group plan: who is in, the meet spot, and the group chat', async ({ page }) => {
    await open(page, '/app/e/ravo');
    await page.getByRole('link', { name: 'Đi cùng bạn bè' }).click();
    await expect(page).toHaveURL(/\/app\/plan\/ravo$/);
    await expect(page.getByText('Linh Phạm')).toBeVisible();
    await page.getByRole('radio', { name: /Cà phê ở Quận 7/ }).click();
    await expect.poll(async () => {
      const list = await (await page.request.get('/me/plans')).json();
      return (await (await page.request.get('/plans/' + list.items[0].id)).json()).meetSpot;
    }).toBe('cafe');
    await page.getByRole('button', { name: 'Trò chuyện' }).click();
    await page.getByRole('textbox', { name: 'Nhắn cả nhóm…' }).fill('Gặp nhau ở quán cà phê nhé');
    await page.getByRole('button', { name: 'Gửi' }).click();
    await expect(page.getByText('Gặp nhau ở quán cà phê nhé')).toBeVisible();
  });

  test('a direct message thread', async ({ page }) => {
    const chats = await (await page.request.get('/me/chats')).json();
    await open(page, '/app/chat/' + chats.items[0].friendId);
    await expect(page.getByRole('heading', { name: chats.items[0].name })).toBeVisible();
    await page.getByRole('textbox', { name: 'Nhắn tin…' }).fill('Tối nay đi không?');
    await page.getByRole('button', { name: 'Gửi' }).click();
    await expect(page.getByText('Tối nay đi không?')).toBeVisible();
  });

  test('hyped and following', async ({ page }) => {
    await open(page, '/app/hyped');
    const hyped = (await (await page.request.get('/me/hypes')).json()).items;
    await expect(page.getByRole('link', { name: new RegExp(hyped[0].title) }).first()).toBeVisible();
    await open(page, '/app/following');
    const ravo = page.getByRole('listitem').filter({ hasText: 'Ravolution Entertainment' });
    await expect(ravo.getByRole('button', { name: 'Đang theo dõi' })).toBeVisible();
  });

  test('the guide says when it is off, and offers to try again', async ({ page }) => {
    await open(page, '/app/e/ravo');
    await page.getByRole('link', { name: 'Trước & sau show' }).click();
    await expect(page).toHaveURL(/\/app\/guide\/ravo$/);
    await expect(page.getByRole('button', { name: 'Thử lại' })).toBeVisible();
  });
});
