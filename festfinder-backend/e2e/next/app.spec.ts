import { expect, test, type Page } from '@playwright/test';
import { signInWith, watch } from '../checks.ts';

/*
 * The app (festfinder-web/src/kd/app) after design v2 phase 4: it is the site. Its discovery, map,
 * saved, profile and event moved into the site's pages and their old addresses lead there with
 * their query; the installed app opens on the home page and asks a new device its city and styles;
 * the screens left (tickets, checkout, the plan, the guide, notifications) wear the site's frame,
 * so buying from the list never changes frame. Phone-sized.
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

/** The site's frame: its nav on top and, on a phone, its tab bar. */
async function inFrame(page: Page) {
  await expect(page.getByRole('banner').getByRole('link', { name: 'FeestFinder, trang chủ' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Chính' }).getByRole('link', { name: 'Tôi' })).toBeVisible();
}

test.describe('the app', () => {
  test('the old app addresses lead into the site, with their query', async ({ request }) => {
    const to = async (path: string) => {
      const res = await request.get(path, { maxRedirects: 0 });
      expect([301, 308], path).toContain(res.status());
      return res.headers().location;
    };
    expect(await to('/app?city=ha-noi')).toMatch(/\/\?city=ha-noi$/);
    expect(await to('/app/list?style=techno')).toMatch(/\/\?view=map&style=techno$/);
    expect(await to('/app/map')).toMatch(/\/\?view=map$/);
    expect(await to('/app/saved?c=abc')).toMatch(/\/saved\?c=abc$/);
    expect(await to('/app/profile')).toMatch(/\/profile$/);
    expect(await to('/app/e/ravo?ride=1')).toMatch(/\/e\/ravo\?ride=1$/);
  });

  test('the installed app asks a new device two things, then opens the list on them; a browser asks nothing', async ({ page }) => {
    // In a browser: the list is the first screen.
    await open(page, '/');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    // The installed app starts at /?source=app.
    const problems = await open(page, '/?source=app');
    const city = page.getByRole('dialog', { name: 'Bạn ở thành phố nào?' });
    await expect(city.getByText('Bước 1/2')).toBeVisible();
    await city.getByRole('group', { name: 'Thành phố' }).getByRole('button', { name: 'TP.HCM' }).click();
    const styles = page.getByRole('dialog', { name: 'Bạn thích nghe gì?' });
    await styles.getByRole('button', { name: 'Techno' }).click();
    await styles.getByRole('button', { name: 'Xem sự kiện' }).click();
    await expect(page).toHaveURL(/city=ho-chi-minh/);
    await expect(page).toHaveURL(/style=techno/);
    // The device keeps the city: the app opens on it next time, without asking again.
    await page.goto('/?source=app');
    await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
    await expect(page).toHaveURL(/city=ho-chi-minh/);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(await page.evaluate(async () => (await navigator.serviceWorker.ready).active?.scriptURL)).toMatch(/\/sw\.js$/);
    expect(problems).toEqual([]);
  });

  test('buying from the list reaches /go and the checkout without changing frame', async ({ page }) => {
    await returning(page);
    await signInWith(page, ATTENDEE);
    const problems = await open(page, '/');
    await inFrame(page);
    await page.getByRole('main').getByRole('link', { name: 'Ravolution Music Festival' }).first().click();
    await expect(page).toHaveURL(/\/e\/ravo$/);
    await inFrame(page);
    const buy = page.locator('#tickets').getByRole('link', { name: /^Mua 1 vé/ });
    await expect(buy).toHaveAttribute('href', /^\/go\/ravo\?/);
    await buy.click();
    await expect(page).toHaveURL(/\/app\/checkout\/ravo\?/);
    await inFrame(page);
    await expect(page.getByRole('button', { name: /^Thanh toán / })).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('Tickets: a real QR per ticket, the doors countdown, and resale at no more than face value', async ({ page }) => {
    await returning(page);
    await signInWith(page, ATTENDEE);
    await open(page, '/app/tickets');
    await inFrame(page);
    await expect(page.getByRole('navigation', { name: 'Chính' }).getByRole('link', { name: 'Tôi' })).toHaveAttribute('aria-current', 'page');
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
    // 2 × 2.400.000₫, no fee on top.
    await expect(page.getByRole('button', { name: 'Thanh toán 4.800.000₫' })).toBeVisible();
    await expect(page.getByText('Phí dịch vụ')).toHaveCount(0);
    await page.getByRole('textbox', { name: 'Mã giảm giá' }).fill('NOPE');
    await page.getByRole('button', { name: 'Áp dụng' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Mã này không dùng được' })).toBeVisible();
    await page.getByRole('textbox', { name: 'Mã giảm giá' }).fill('rave10');
    await page.getByRole('button', { name: 'Áp dụng' }).click();
    await page.getByRole('button', { name: 'Thanh toán 4.320.000₫' }).click();
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
    // The seller's price, no fee on top.
    await expect(page.getByRole('button', { name: 'Thanh toán 650.000₫' })).toBeVisible();
    await expect(page.getByText('Phí dịch vụ')).toHaveCount(0);
  });

  test('"Tôi" is /profile: passport, Wrapped, the language, signing out', async ({ page }) => {
    await returning(page);
    await signInWith(page, ATTENDEE);
    await open(page, '/app/profile');
    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.getByText('5 đêm · 3 dòng nhạc · 1 thành phố')).toBeVisible();
    await page.getByRole('button', { name: /^Wrapped 20\d\d$/ }).click();
    await expect(page.getByRole('dialog', { name: /^Wrapped 20\d\d$/ }).getByText('đêm đi chơi')).toBeVisible();
    await page.keyboard.press('Escape');
    const hub = page.getByRole('navigation', { name: 'Tôi' });
    await expect(hub.getByRole('link', { name: /^Cảnh báo thông minh/ })).toHaveAttribute('href', '/app/alerts');
    await hub.getByRole('link', { name: /^Ngôn ngữ/ }).click();
    await expect(page).toHaveURL(/\/profile\?lang=en$/);
    await expect(page.getByRole('heading', { name: 'Raver passport' })).toBeVisible();
    await page.getByRole('navigation', { name: 'Me' }).getByRole('button', { name: 'Sign out' }).click();
    await expect(page.getByRole('button', { name: 'Log in' }).first()).toBeVisible();
  });
});
