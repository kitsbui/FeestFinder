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

test('the city comes first: guessed from the phone, kept when chosen, and the page never jumps', async ({ browser }) => {
  // A phone in Vietnam: the demo's nights are all in TP.HCM, more than enough for a guess.
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
  const asked: string[] = [];
  page.on('request', (r) => { if (/\/events\?/.test(r.url())) asked.push(r.url()); });
  await page.goto('/');
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  await expect(cityOf(page)).toContainText('TP.HCM');
  expect(asked.some((u) => u.includes('city=ho-chi-minh')), asked.join('\n')).toBeTruthy();
  await expect(page.locator('html')).not.toHaveAttribute('data-city-first', /./);
  await expect(page.locator('[data-list] article').first()).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __shift: number }).__shift)).toBeLessThan(0.05);
  // No "Đăng sự kiện" on the phone's top bar: the top is the newcomer's.
  await expect(page.getByRole('banner').getByRole('link', { name: 'Đăng sự kiện' })).toBeHidden();
  // Every city, chosen: the next visit keeps it instead of guessing.
  await cityOf(page).click();
  await page.getByRole('menuitemradio', { name: /^Mọi thành phố/ }).click();
  await page.goto('/');
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  await expect(cityOf(page)).toContainText('Mọi thành phố');
  expect(problems).toEqual([]);
  await ctx.close();
  // A phone where no listed city keeps the time: every city, nothing held back.
  const far = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, timezoneId: 'Europe/Paris' });
  const other = await far.newPage();
  await other.goto('/');
  await other.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  await expect(cityOf(other)).toContainText('Mọi thành phố');
  await expect(other.locator('html')).not.toHaveAttribute('data-city-first', /./);
  await far.close();
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
  const verify = await (await page.request.post('/auth/otp/verify', { data: { challengeId: start.challengeId, code: start.devCode } })).json();
  expect((await page.request.post('/auth/password', { data: { token: verify.signupToken, password: 'longenough1', passwordConfirm: 'longenough1' } })).ok()).toBeTruthy();
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
  await expect(hub.getByRole('link', { name: 'Đã lưu' })).toHaveAttribute('href', '/saved');
});

test('an event page on a phone: the way there once in each place, an empty Hỏi đáp is one button', async ({ page, request }) => {
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
  await page.locator('summary', { hasText: /^Hỏi đáp/ }).click();
  const qa = page.getByRole('region', { name: 'Hỏi đáp' });
  await expect(qa.getByRole('button', { name: 'Đặt câu hỏi' })).toBeVisible();
  await expect(qa.getByRole('textbox')).toHaveCount(0);
  await qa.getByRole('button', { name: 'Đặt câu hỏi' }).click();
  await expect(page.getByRole('region', { name: /^Hỏi đáp/ }).getByRole('textbox')).toBeVisible();
  // "Chỉ đường": in the facts and under the venue, no more.
  expect(await page.getByRole('link', { name: /^Chỉ đường/ }).count()).toBeLessThanOrEqual(2);
  expect(problems).toEqual([]);
});

test('posting an event on a phone names its steps', async ({ page }) => {
  await page.goto('/studio/new');
  const steps = page.getByRole('navigation', { name: 'Các bước' });
  for (const name of ['Cơ bản', 'Thời gian & địa điểm', 'Vé', 'Xem lại & gửi duyệt']) await expect(steps.getByText(name)).toBeVisible();
});
