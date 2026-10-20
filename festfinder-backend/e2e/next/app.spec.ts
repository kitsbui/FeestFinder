import { expect, test, type Page } from '@playwright/test';
import { signInWith, watch } from '../checks.ts';

/*
 * The app (festfinder-web/src/kd/app) after design v2 phase 4: it is the site. Its discovery, map,
 * saved, profile and event moved into the site's pages and their old addresses lead there with
 * their query; the installed app opens on the home page and asks a new device its city and styles;
 * the screens left (the plan, the guide, notifications, live mode, recap) wear the site's frame,
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

  test.describe('installed', () => {
    // This one checks the service worker too (the config blocks it elsewhere).
    test.use({ serviceWorkers: 'allow' });
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
  });  });


  test('from the list to the seller: "Mua vé" goes through /go and leaves for the seller, FeestFinder sells no tickets', async ({ page }) => {
    await returning(page);
    await signInWith(page, ATTENDEE);
    const problems = await open(page, '/');
    await inFrame(page);
    await page.getByRole('main').getByRole('link', { name: 'Ravolution Music Festival' }).first().click();
    await expect(page).toHaveURL(/\/e\/ravo$/);
    await inFrame(page);
    const buy = page.locator('#tickets').getByRole('link', { name: /^Mua vé/ });
    await expect(buy).toHaveAttribute('href', '/go/ravo?src=detail');
    const hop = await page.request.get('/go/ravo?src=detail', { maxRedirects: 0 });
    expect(hop.status()).toBe(302);
    expect(hop.headers().location).toMatch(/^https:\/\/ticketbox\.vn\/ravolution-2026\?utm_source=feestfinder&utm_medium=referral&utm_campaign=ravo&utm_content=detail$/);
    await expect(page.locator('#tickets').getByText('Pass vé')).toHaveCount(0);
    expect(problems).toEqual([]);
  });

  test('the old ticket screens lead to their nearest place', async ({ page }) => {
    await signInWith(page, ATTENDEE);
    await page.goto('/app/tickets');
    await expect(page).toHaveURL(/\/profile$/);
    await page.goto('/app/checkout/ravo?tier=x&qty=2');
    await expect(page).toHaveURL(/\/e\/ravo(\?|$)/);
  });

  test('badges on the profile: the row, the sheet by group, pin one and it leads the row', async ({ page }) => {
    await signInWith(page, ATTENDEE);
    await page.goto('/profile');
    const section = page.getByRole('region', { name: 'Huy hiệu' }).first();
    await expect(section).toBeVisible();
    // Everyone's 42, plus the artist or organiser set of a craft they run.
    await expect(section.getByText(/^\d+\/(42|47|48)$/)).toBeVisible();
    await section.getByRole('button', { name: 'Xem tất cả huy hiệu' }).click();
    const sheet = page.getByRole('dialog', { name: 'Huy hiệu' });
    await expect(sheet.getByRole('region', { name: 'Đêm' })).toBeVisible();
    const pin = sheet.getByRole('button', { name: /^Khoe: / }).first();
    const name = (await pin.getAttribute('aria-label'))!.replace(/^Khoe: /, '');
    await pin.click();
    await expect(sheet.getByRole('button', { name: `Bỏ khoe: ${name}` })).toBeVisible();
    await expect.poll(async () => (await (await page.request.get('/me/badges')).json()).pins.length).toBeGreaterThan(0);
    await sheet.getByRole('button', { name: `Bỏ khoe: ${name}` }).click();
    await expect(sheet.getByRole('button', { name: `Khoe: ${name}` })).toBeVisible();
    // The story: the badge drawn large, saved as a picture where the browser cannot share files.
    const download = page.waitForEvent('download');
    await sheet.getByRole('button', { name: `Chia sẻ: ${name}` }).click();
    const file = await download;
    expect(file.suggestedFilename()).toMatch(/^badge-[a-z0-9_]+\.png$/);
    expect((await import('node:fs')).statSync((await file.path())!).size).toBeGreaterThan(20_000);
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
