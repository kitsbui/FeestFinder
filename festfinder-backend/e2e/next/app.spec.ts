import { expect, test, type Page } from '@playwright/test';
import { signInWith, watch } from '../checks.ts';

/*
 * The app in Kính đêm (festfinder-web/src/kd/app): Explore and onboarding, the event, the map,
 * Saved, Tickets and the profile tab, phone-sized. What the compiled app's tests checked, on
 * the rebuilt screens, plus their own parts.
 */

const ATTENDEE = { identifier: 'minh@example.com', password: 'festfinder123' };

test.use({ viewport: { width: 390, height: 844 } });

/** A device that has been through onboarding (a city on file). */
async function returning(page: Page) {
  await page.addInitScript(() => { try { localStorage.setItem('ff_city', 'ho-chi-minh'); } catch { /* storage blocked */ } });
}

async function open(page: Page, path: string) {
  const problems = watch(page);
  await page.goto(path);
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  return problems;
}

test.describe('the app', () => {
  test('a first visit asks what you like and where, then opens on Explore', async ({ page }) => {
    const problems = await open(page, '/app');
    await expect(page.getByRole('heading', { level: 1, name: 'Có gì quanh bạn?' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Điều hướng chính' })).toHaveCount(0);
    await page.getByRole('button', { name: 'EDM' }).click();
    await expect(page.getByRole('button', { name: 'EDM' })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Chọn thành phố khác' }).click();
    await page.getByRole('button', { name: 'TP.HCM' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('có gì chơi?');
    // One family picked: Explore opens on it.
    await expect(page.getByRole('group', { name: 'Thể loại' }).getByRole('button', { name: 'EDM' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('navigation', { name: 'Điều hướng chính' }).getByRole('link', { name: 'Khám phá' })).toHaveAttribute('aria-current', 'page');
    // The choice stays on the device.
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('có gì chơi?');
    expect(problems).toEqual([]);
  });

  test('Explore: the time in the headline and the genre chips change the events', async ({ page }) => {
    await returning(page);
    await open(page, '/app');
    const line = page.getByText(/\d+ sự kiện$/).first();
    await expect(line).toBeVisible();
    const n = async () => Number((await line.textContent())!.match(/(\d+) sự kiện$/)![1]);
    const weekend = await n();
    await page.getByRole('button', { name: /Cuối tuần này/ }).click();
    await page.getByRole('menuitemradio', { name: /Tháng này/ }).click();
    await expect.poll(n).toBeGreaterThanOrEqual(weekend);
    await page.getByRole('group', { name: 'Thể loại' }).getByRole('button', { name: 'EDM' }).click();
    await expect(page.getByRole('link', { name: /Ravolution Music Festival/ }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /HOZO Super Fest/ })).toHaveCount(0);
    await page.getByRole('link', { name: /Ravolution Music Festival/ }).first().click();
    await expect(page).toHaveURL(/\/app\/e\/ravo$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Ravolution Music Festival' })).toBeVisible();
  });

  test('the event carries the organiser’s updates, the FAQ, the discussion and the tickets', async ({ page }) => {
    await returning(page);
    const problems = await open(page, '/app/e/ravo');
    await expect(page.getByRole('heading', { level: 2, name: 'Từ ban tổ chức' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Câu hỏi thường gặp' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Thảo luận' })).toBeVisible();
    await page.getByRole('link', { name: 'Mua vé', exact: true }).click();
    await expect(page.locator('#tickets')).toBeInViewport();
    await expect(page.locator('#tickets').getByRole('link', { name: /Mua 1 vé/ })).toHaveAttribute('href', /^\/go\/ravo\?src=tier&tier=/);
    // Back, from an event opened from outside the app, goes to Explore.
    await expect(page.getByRole('link', { name: 'Quay lại' })).toHaveAttribute('href', '/app');
    expect(problems).toEqual([]);
  });

  test('the map asks for the events once, and again only on "search this area"; the list shows the same', async ({ page }) => {
    await returning(page);
    const asked: string[] = [];
    page.on('request', (r) => { if (r.url().includes('/events/map?')) asked.push(r.url()); });
    await open(page, '/app/list');
    const map = page.locator('[data-kd-map]');
    await expect(map.locator('canvas')).toBeVisible();
    await expect.poll(() => asked.length).toBe(1);
    const box = (await map.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 - 120, box.y + box.height / 2 - 40, { steps: 10 });
    await page.mouse.up();
    await expect(page.getByRole('button', { name: 'Tìm trong khu vực này' })).toBeVisible();
    expect(asked).toHaveLength(1);
    await page.getByRole('button', { name: 'Tìm trong khu vực này' }).click();
    await expect.poll(() => asked.length).toBe(2);
    await page.getByRole('button', { name: 'Danh sách' }).click();
    await expect(page.getByRole('link', { name: /Ravolution Music Festival/ }).first()).toBeVisible();
    // A search from Explore lands on the rows.
    await page.goto('/app/list?q=ravolution');
    await expect(page.getByText('Kết quả cho “ravolution”')).toBeVisible();
    await expect(page.getByRole('link', { name: /Ravolution Music Festival/ }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /HOZO/ })).toHaveCount(0);
  });

  test('Saved asks for sign-in, then lists saves and collections with their public link', async ({ page }) => {
    await returning(page);
    await open(page, '/app/saved');
    await page.getByRole('button', { name: 'Đăng nhập' }).first().click();
    await expect(page.getByRole('dialog', { name: 'Đăng nhập' })).toBeVisible();
    await page.keyboard.press('Escape');
    await signInWith(page, ATTENDEE);
    const ravo = await (await page.request.get('/events/ravo')).json();
    const col = await (await page.request.post('/me/collections', { data: { name: 'Rave nights', eventId: ravo.id } })).json();
    await open(page, '/app/saved');
    await expect(page.getByRole('link', { name: /Ravolution Music Festival/ }).first()).toBeVisible();
    await page.getByRole('button', { name: /Rave nights/ }).click();
    const sw = page.getByRole('switch', { name: 'Link công khai' });
    await expect(sw).toHaveAttribute('aria-checked', 'false');
    await sw.click();
    await expect(sw).toHaveAttribute('aria-checked', 'true');
    await expect.poll(async () => (await (await page.request.get('/me/collections/' + col.id)).json()).collection.isPublic).toBe(true);
    await page.request.delete('/me/collections/' + col.id);
  });

  test('Tickets: a real QR per ticket, the doors countdown, and resale at no more than face value', async ({ page }) => {
    await returning(page);
    await signInWith(page, ATTENDEE);
    await open(page, '/app/tickets');
    const card = page.getByRole('article', { name: 'Ravolution Music Festival' });
    await expect(card.getByRole('img', { name: 'Mã QR của vé FF-RAVO-DEM1' })).toBeVisible();
    await expect(card.getByText(/Mở cửa sau \d+ ngày/)).toBeVisible();
    await card.getByRole('button', { name: 'Vé 2' }).click();
    await expect(card.getByRole('img', { name: 'Mã QR của vé FF-RAVO-DEM2' })).toBeVisible();
    await page.getByRole('button', { name: 'Pass vé', exact: true }).click();
    const sheet = page.getByRole('dialog', { name: 'Pass vé này' });
    await expect(sheet.getByText('Tối đa 1.200.000₫')).toBeVisible();
    await page.keyboard.press('Escape');
    // The past tab holds nothing yet.
    await page.getByRole('button', { name: 'Đã qua' }).click();
    await expect(page.getByText('Chưa có vé nào')).toBeVisible();
  });

  test('checkout takes the tier and quantity from /go, a promo code, and lands in the tickets', async ({ page }) => {
    await returning(page);
    await signInWith(page, ATTENDEE);
    const ev = await (await page.request.get('/events/ravo')).json();
    const vip = ev.tickets.tiers.find((t: { name: { en: string } }) => t.name.en === 'VIP');
    const problems = await open(page, `/app/checkout/ravo?tier=${vip.id}&qty=2`);
    await expect(page.getByRole('radio', { name: /^VIP/ })).toHaveAttribute('aria-checked', 'true');
    // 2 × 2.400.000₫ and the 5% service fee.
    await expect(page.getByRole('button', { name: 'Thanh toán 5.040.000₫' })).toBeVisible();
    await page.getByRole('textbox', { name: 'Mã giảm giá' }).fill('NOPE');
    await page.getByRole('button', { name: 'Áp dụng' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Mã này không dùng được' })).toBeVisible();
    await page.getByRole('textbox', { name: 'Mã giảm giá' }).fill('rave10');
    await page.getByRole('button', { name: 'Áp dụng' }).click();
    await page.getByRole('button', { name: 'Thanh toán 4.536.000₫' }).click();
    await expect(page).toHaveURL(/\/app\/tickets$/);
    await expect(page.getByRole('article', { name: 'Ravolution Music Festival' }).filter({ hasText: 'VIP' })).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('a resale ticket opens its own checkout', async ({ page }) => {
    await returning(page);
    await signInWith(page, ATTENDEE);
    const listing = (await (await page.request.get('/events/rapviet/resale')).json()).items[0];
    await open(page, `/app/checkout/rapviet?listing=${listing.id}`);
    await expect(page.getByText(/Vé pass · /)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Thanh toán 682.500₫' })).toBeVisible();
  });

  test('the profile tab: passport, Wrapped, following, and the language this device keeps', async ({ page }) => {
    await returning(page);
    await signInWith(page, ATTENDEE);
    await open(page, '/app/profile');
    await expect(page.getByText('5 đêm · 3 thể loại · 1 thành phố')).toBeVisible();
    await page.getByRole('button', { name: /^Wrapped 20\d\d$/ }).click();
    await expect(page.getByRole('dialog', { name: /^Wrapped 20\d\d$/ }).getByText('đêm đi chơi')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'Đang theo dõi' })).toBeVisible();
    await page.getByRole('button', { name: 'English' }).click();
    await expect(page.getByRole('heading', { name: 'Raver passport' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Raver passport' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Me' })).toHaveAttribute('aria-current', 'page');
    await page.getByRole('button', { name: 'Tiếng Việt' }).click();
    await page.getByRole('button', { name: 'Đăng xuất' }).click();
    await expect(page.getByText('Đăng nhập để có hộ chiếu, cảnh báo và cài đặt')).toBeVisible();
  });

  test('the app still installs its service worker', async ({ page }) => {
    await returning(page);
    await open(page, '/app');
    expect(await page.evaluate(async () => (await navigator.serviceWorker.ready).active?.scriptURL)).toMatch(/\/sw\.js$/);
  });
});
