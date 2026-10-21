import { expect, test } from '@playwright/test';
import { watch } from '../checks.ts';

/*
 * A newcomer on a phone (design v2 phase 11, artboard 24 of the design review): what someone who
 * has never used FeestFinder sees and can do, on data like Feest Radar's (no price, no age, no
 * cover, English text). Every check here is a promise to that person.
 */

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test('a night sold at a price nobody gave is never "free"', async ({ page }) => {
  const problems = watch(page);
  // As the API answers for a Radar find whose page gives no price (test/public.test.ts checks the API itself).
  await page.route(/\/events\/map\?/, async (route) => {
    const body = (await (await route.fetch()).json()) as { items: { title: string; isFree: boolean; priceFrom: number; priceUnknown?: boolean }[] };
    const items = body.items.map((e, i) => (i === 0 ? { ...e, isFree: false, priceFrom: 0, priceUnknown: true } : e));
    await route.fulfill({ json: { ...body, items } });
  });
  await page.goto('/?city=ho-chi-minh&view=map');
  const first = page.locator('[data-map-rows] > button').first();
  await expect(first).toBeVisible();
  const rows = page.locator('[data-map-rows] > button', { hasText: 'Chưa rõ giá' });
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).not.toContainText('Miễn phí');
  expect(problems).toEqual([]);
});

/** The phone's city chooser (above the list since design v2 phase 12). */
const cityOf = (page: import('@playwright/test').Page) => page.getByRole('button', { name: /^Thành phố:/ }).locator('visible=true');

test('the country comes first: a phone in Vietnam sees Vietnam\u2019s nights first, a chosen city is kept, and the page never jumps', async ({ browser, request }) => {
  // The demo's nights are all in TP.HCM: one in Bangkok, posted by the team for this test, gives the list an elsewhere.
  expect((await request.post('/auth/login', { data: { identifier: 'admin@feestfinder.com', password: 'festfinder-admin' } })).ok()).toBeTruthy();
  const org = (await (await request.get('/admin/organizers?q=Ravolution')).json()).items[0];
  const made = await request.post('/admin/events', { data: { organizerId: org.id, title: 'Bangkok Night Test', city: 'bangkok', venueName: 'Beam', address: '72 Sukhumvit 55', startsOn: '2026-11-21', startTime: '22:00', endTime: '04:00', entryMode: 'free', styles: ['techno'], publish: true } });
  expect(made.ok(), await made.text()).toBeTruthy();
  const bangkok = (await made.json()) as { id: string; slug: string };
  // The home page is cached a minute: render it again with the new night, as a save in Studio does (kd/fresh.ts).
  expect((await request.post('/kd-fresh', { data: { kind: 'e', slug: bangkok.slug } })).status()).toBe(204);
  // A phone in Vietnam: Vietnam's nights lead, the rest follow under "Nơi khác".
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, timezoneId: 'Asia/Ho_Chi_Minh' });
  const page = await ctx.newPage();
  const problems = watch(page);
  await page.addInitScript(() => {
    const w = window as unknown as { __shift: number };
    w.__shift = 0;
    new PerformanceObserver((l) => {
      for (const e of l.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) if (!e.hadRecentInput) w.__shift += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto('/');
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  await expect(page.locator('html')).not.toHaveAttribute('data-place-first', /./);
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { level: 2, name: 'Việt Nam' })).toBeVisible();
  await expect(main.getByRole('heading', { level: 2, name: 'Nơi khác' })).toBeAttached();
  // Every city still shows (no filter): the first card is a Vietnamese night, 0 taps.
  await expect(cityOf(page)).toContainText('Mọi thành phố');
  await expect(page.locator('[data-list] article').first()).toContainText('TP.HCM');
  expect(await page.evaluate(() => (window as unknown as { __shift: number }).__shift)).toBeLessThan(0.05);
  // No "Đăng sự kiện" on the phone's top bar: the top is the newcomer's.
  await expect(page.getByRole('banner').getByRole('link', { name: 'Đăng sự kiện' })).toBeHidden();
  // A city, chosen: the next visit opens on it instead of the grouped list.
  await cityOf(page).click();
  await page.getByRole('menuitemradio', { name: /^TP.HCM/ }).click();
  await expect(page).toHaveURL(/city=ho-chi-minh/);
  await page.goto('/');
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  await expect(cityOf(page)).toContainText('TP.HCM');
  await expect(main.getByRole('heading', { level: 2, name: 'Nơi khác' })).toHaveCount(0);
  expect(problems).toEqual([]);
  await ctx.close();
  // A phone whose zone and language are not ours: every city, nothing grouped, nothing held back.
  const far = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, timezoneId: 'Europe/Paris', locale: 'fr-FR' });
  const other = await far.newPage();
  await other.goto('/');
  await other.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  await expect(cityOf(other)).toContainText('Mọi thành phố');
  await expect(other.locator('html')).not.toHaveAttribute('data-place-first', /./);
  await expect(other.getByRole('main').getByRole('heading', { level: 2, name: 'Nơi khác' })).toHaveCount(0);
  await far.close();
  expect((await request.post(`/admin/events/${bangkok.id}/status`, { data: { action: 'take_down' } })).ok()).toBeTruthy();
  expect((await request.post('/kd-fresh', { data: { kind: 'e', slug: bangkok.slug } })).status()).toBe(204);
});

test('a heart works before signing in, and signing in keeps what was saved', async ({ page }) => {
  const problems = watch(page);
  await page.goto('/e/ravo');
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  const save = page.getByRole('button', { name: /^Lưu sự kiện|^Đã lưu/ }).first();
  await save.click();
  await expect(save).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('dialog', { name: 'Đăng nhập' })).toHaveCount(0);
  // Đã lưu shows it on this phone, with the way to keep it everywhere.
  await page.goto('/saved');
  await expect(page.getByRole('main').getByRole('link', { name: /Ravolution Music Festival/ }).first()).toBeVisible();
  await expect(page.getByRole('main').getByRole('button', { name: 'Đăng nhập' })).toBeVisible();
  // A new account: the nights saved on this phone move into it.
  const email = `saves-${Date.now()}@example.com`;
  const start = await (await page.request.post('/auth/otp/start', { data: { channel: 'email', identifier: email } })).json();
  // The code alone signs the new account in (phase 17), on this browser's cookies.
  const verify = await page.request.post('/auth/otp/verify', { data: { challengeId: start.challengeId, code: start.devCode } });
  expect(verify.ok(), await verify.text()).toBeTruthy();
  await page.goto('/e/ravo');
  await page.locator('html[data-kd-session="user"]').waitFor({ state: 'attached' });
  await expect.poll(async () => ((await (await page.request.get('/me/saves?limit=100')).json()).items as { slug: string }[]).map((e) => e.slug)).toContain('ravo');
  expect(await page.evaluate(() => localStorage.getItem('ff:saves'))).toBeNull();
  expect(problems).toEqual([]);
});

test('"Tôi" before signing in: signing in first, then what works without an account', async ({ page }) => {
  await page.goto('/profile');
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  const hub = page.getByRole('navigation', { name: 'Tôi' });
  await expect(page.getByRole('button', { name: 'Đăng nhập' }).first()).toBeVisible();
  await expect(hub.getByRole('link', { name: 'Đăng sự kiện' })).toHaveAttribute('href', '/studio/new');
  // Đã lưu, Nghệ sĩ and Blog are tabs (owner, 2026-10-21); "Tôi" keeps what the tab bar leaves.
  await expect(hub.getByRole('link', { name: 'Dự án' })).toHaveAttribute('href', '/p');
  await expect(hub.getByRole('link', { name: 'Nhà tổ chức' })).toHaveAttribute('href', '/studio');
});

test('signs in with a phone number by SMS: the way is offered, the code arrives, the account is made and the number proved', async ({ page }) => {
  const problems = watch(page);
  await page.goto('/profile');
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  await page.getByRole('button', { name: 'Đăng nhập' }).first().click();
  const sheet = page.getByRole('dialog', { name: 'Đăng nhập' });
  await expect(sheet).toBeVisible();
  // The phone ways come first (phase 17): Zalo, SMS, then email.
  const ways = await sheet.getByRole('button').allInnerTexts();
  expect(ways.findIndex((w) => /SMS/.test(w))).toBeLessThan(ways.findIndex((w) => /email/i.test(w)));
  await sheet.getByRole('button', { name: 'Tiếp tục bằng SMS' }).click();
  await sheet.getByLabel('Số điện thoại').fill('0977 123 456');
  await sheet.getByRole('button', { name: 'Gửi mã' }).click();
  // The sheet is now titled by its step ("Nhập mã xác minh"). The preview shows the code it sent (EXPOSE_DEV_CODES); production never does.
  const otp = page.getByRole('dialog', { name: 'Nhập mã xác minh' });
  const line = await otp.getByText(/Đã gửi SMS tới/).innerText();
  const code = /dev code (\d{6})/.exec(line)?.[1];
  expect(code, line).toBeTruthy();
  await otp.getByRole('textbox', { name: /Nhập mã xác minh/ }).fill(code!);
  await otp.getByRole('button', { name: 'Xác minh' }).click();
  await expect(otp).toBeHidden();
  const me = await (await page.request.get('/me')).json();
  expect([me.user.phone, me.user.phoneVerified, me.user.signupMethod]).toEqual(['+84977123456', true, 'sms']);
  expect(problems).toEqual([]);
});

test('signs in by email with a code alone, no password (phase 17)', async ({ page }) => {
  const problems = watch(page);
  await page.goto('/profile');
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  await page.getByRole('button', { name: 'Đăng nhập' }).first().click();
  const sheet = page.getByRole('dialog', { name: 'Đăng nhập' });
  await sheet.getByRole('button', { name: 'Tiếp tục với email' }).click();
  await sheet.getByLabel('Email').fill('new.phone.person@example.com');
  await sheet.getByRole('button', { name: 'Gửi mã' }).click();
  const otp = page.getByRole('dialog', { name: 'Nhập mã xác minh' });
  const line = await otp.getByText(/Đã gửi qua email tới/).innerText();
  expect(line).toContain('liên kết');
  const code = /dev code (\d{6})/.exec(line)?.[1];
  expect(code, line).toBeTruthy();
  await otp.getByRole('textbox', { name: /Nhập mã xác minh/ }).fill(code!);
  await otp.getByRole('button', { name: 'Xác minh' }).click();
  // Straight in: no "Đặt mật khẩu" step.
  await expect(page.getByRole('dialog', { name: 'Đặt mật khẩu' })).toHaveCount(0);
  await expect(otp).toBeHidden();
  const me = await (await page.request.get('/me')).json();
  expect([me.user.email, me.user.hasPassword]).toEqual(['new.phone.person@example.com', false]);
  expect(problems).toEqual([]);
});

test('an event page on a phone: the way there once in each place, no comments yet is one button', async ({ page, request }) => {
  const problems = watch(page);
  // A night nobody has asked about yet.
  const items = (await (await request.get('/events?time=all&limit=60')).json()).items as { id: string; slug: string }[];
  let quiet: string | null = null;
  for (const e of items) {
    const d = await (await request.get(`/events/${e.id}/discussion`)).json();
    const ev = await (await request.get('/events/' + e.slug)).json();
    if (!d.total && !ev.faq.length) { quiet = e.slug; break; }
  }
  test.skip(!quiet, 'every demo night has questions');
  await page.goto('/e/' + quiet);
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  // Under "Thêm" (design v2 phase 12): its row opens it.
  await page.locator('summary', { hasText: /^Bình luận/ }).click();
  const qa = page.getByRole('region', { name: 'Bình luận' });
  await expect(qa.getByRole('button', { name: 'Viết bình luận' })).toBeVisible();
  await expect(qa.getByRole('textbox')).toHaveCount(0);
  await qa.getByRole('button', { name: 'Viết bình luận' }).click();
  await expect(page.getByRole('region', { name: /^Bình luận/ }).getByRole('textbox')).toBeVisible();
  // "Chỉ đường": under the venue, once.
  expect(await page.getByRole('link', { name: /^Chỉ đường/ }).count()).toBeLessThanOrEqual(1);
  expect(problems).toEqual([]);
});

test('posting an event on a phone names its steps', async ({ page }) => {
  await page.goto('/studio/new');
  const steps = page.getByRole('navigation', { name: 'Các bước' });
  for (const name of ['Cơ bản', 'Thời gian & địa điểm', 'Vé', 'Xem lại & gửi duyệt']) await expect(steps.getByText(name)).toBeVisible();
});

/** What one can tap in the first screen (artboard 25's count): links, buttons and fields in sight. */
async function controlsInSight(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const seen = (el: Element) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width > 1 && r.height > 1 && r.top < innerHeight && r.bottom > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && !el.closest('[aria-hidden="true"]');
    };
    const all = [...document.querySelectorAll('a[href],button,[role=button],input,select,summary')].filter(seen);
    return { n: all.length, names: all.map((el) => (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30)) };
  });
}

/*
 * The first screens ask little (design v2 phase 12, owner 2026-10-18). The counts include the site's
 * frame (the logo, search and the tabs); like the JS budgets they only go down. 2026-10-21: the owner
 * made one navigation for both devices (five tabs) and the map a button of the list: two more at home,
 * one more on the event page.
 */
const IN_SIGHT = { home: 22, event: 13 };

test('the first screens ask little: few controls, a time in one tap, the tickets in two', async ({ page }) => {
  const problems = watch(page);
  await page.goto('/');
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  const card = page.locator('[data-list] article').first();
  await expect(card).toBeVisible();
  const home = await controlsInSight(page);
  expect(home.n, home.names.join(' | ')).toBeLessThanOrEqual(IN_SIGHT.home);
  // One tap: a time, from the bar.
  await page.locator('.kd-cmd').getByRole('button', { name: 'Tối nay' }).click();
  await expect(page).toHaveURL(/time=tonight/);
  await page.locator('.kd-cmd').getByRole('button', { name: 'Tất cả' }).click();
  // Two taps from a card to the tickets: the card, then the dock's "Mua vé".
  await page.locator('[data-list] article').filter({ has: page.locator('a[href="/e/ravo"]') }).first().locator('.kd-ev-title').click();
  await expect(page).toHaveURL(/\/e\/ravo$/);
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  const event = await controlsInSight(page);
  expect(event.n, event.names.join(' | ')).toBeLessThanOrEqual(IN_SIGHT.event);
  // Only one way to the tickets in sight: the dock.
  // The hero's own "Mua vé" is for a computer; on a phone the dock is the one way.
  await expect(page.getByRole('main').locator('a[href="#tickets"]').first()).toBeHidden();
  await page.locator('.kd-buy-dock').getByRole('link', { name: 'Mua vé' }).click();
  await expect(page.locator('#tickets')).toBeInViewport();
  expect(problems).toEqual([]);
});
