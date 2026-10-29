import { expect, test } from '@playwright/test';
import { homeRewrite } from '../../../festfinder-web/src/kd/home-place.ts';
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

/** Records whether the page ever held its list back (city-first.tsx's data-city-first or data-list-wait). */
const held = () => {
  const w = window as unknown as { __held: boolean };
  w.__held = false;
  const marks = ['data-city-first', 'data-list-wait', 'data-place-first'];
  new MutationObserver(() => { if (marks.some((m) => document.documentElement?.hasAttribute(m))) w.__held = true; })
    .observe(document, { attributes: true, subtree: true, attributeFilter: marks });
};
const wasHeld = (page: import('@playwright/test').Page) => page.evaluate(() => (window as unknown as { __held: boolean }).__held);

/** Vercel's edge names the visitor's country in this header; the screens' build reads it as production does. */
const IN_VIETNAM = { 'x-vercel-ip-country': 'VN' };
const GOOGLEBOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
/** The country heading the server drew above the list, if any. */
const here = (html: string) => html.match(/<h2 id="here-h"[^>]*>([^<]*)<\/h2>/)?.[1] ?? null;

test('the home page a request is served: the chosen city, else the visitor’s listed country, else every city', () => {
  const listed = { cities: ['ho-chi-minh', 'ha-noi', 'bangkok'], countries: ['VN', 'TH'] };
  const PHONE = 'Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Mobile Safari/537.36';
  const at = (search: string, o: { cookie?: string | null; country?: string | null; ua?: string | null; path?: string } = {}) =>
    homeRewrite({ path: o.path ?? '/', search, cookie: o.cookie ?? null, country: o.country ?? null, ua: o.ua === undefined ? PHONE : o.ua, listed });
  expect(at('', { country: 'VN' })).toBe('/from/vn');
  expect(at('?lang=en', { country: 'vn' })).toBe('/from/vn/en');
  expect(at('?lang=vi', { country: 'TH' })).toBe('/from/th');
  expect(at('?lang=ja&utm_source=x', { country: 'TH' })).toBe('/from/th/ja');
  // Not a listed country, or none: the home page as it is.
  expect(at('', { country: 'FR' })).toBeNull();
  expect(at('', {})).toBeNull();
  // The city this device chose comes first, in its language; 'all' is no city.
  expect(at('?lang=en', { cookie: 'ha-noi', country: 'TH' })).toBe('/in/ha-noi/en');
  expect(at('', { cookie: 'all', country: 'VN' })).toBe('/from/vn');
  expect(at('', { cookie: 'atlantis', country: 'VN' })).toBe('/from/vn');
  // An address that says what to show, another page, or a language the site has not: as it is.
  for (const q of ['?city=bangkok', '?style=techno', '?view=map', '?time=tonight', '?source=app', '?lang=xx']) expect(at(q, { cookie: 'ha-noi', country: 'VN' }), q).toBeNull();
  expect(at('', { country: 'VN', path: '/a' })).toBeNull();
  // Search engines and link previews read every city; Lighthouse and headless browsers are people from where they are.
  for (const ua of [GOOGLEBOT, 'facebookexternalhit/1.1', 'Zalo', null]) expect(at('', { country: 'VN', cookie: 'ha-noi', ua }), String(ua)).toBeNull();
  for (const ua of ['Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/140.0.0.0 Safari/537.36', `${PHONE} Chrome-Lighthouse`]) {
    expect(at('', { country: 'VN', ua }), ua).toBe('/from/vn');
  }
});

test('the country comes first, decided on the server: a phone in Vietnam gets Vietnam’s nights first in the first HTML, a chosen city is kept, and the page never jumps', async ({ browser, request }) => {
  // The demo's nights are all in TP.HCM: grouping them would change nothing, so a phone in Vietnam is shown
  // the list as every city's, never held back.
  const alone = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, extraHTTPHeaders: IN_VIETNAM });
  const first = await alone.newPage();
  await first.addInitScript(held);
  await first.goto('/');
  await first.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  await expect(first.getByRole('main').getByRole('heading', { level: 2, name: 'Nơi khác' })).toHaveCount(0);
  expect(await wasHeld(first)).toBe(false);
  await alone.close();
  // One in Bangkok, posted by the team for this test, gives the list an elsewhere.
  expect((await request.post('/auth/login', { data: { identifier: 'admin@feestfinder.com', password: 'festfinder-admin' } })).ok()).toBeTruthy();
  const org = (await (await request.get('/admin/organizers?q=Ravolution')).json()).items[0];
  const made = await request.post('/admin/events', { data: { organizerId: org.id, title: 'Bangkok Night Test', city: 'bangkok', venueName: 'Beam', address: '72 Sukhumvit 55', startsOn: '2026-11-21', startTime: '22:00', endTime: '04:00', entryMode: 'free', styles: ['techno'], publish: true } });
  expect(made.ok(), await made.text()).toBeTruthy();
  const bangkok = (await made.json()) as { id: string; slug: string };
  // The home pages are cached a minute: render them again with the new night, as a save in Studio does (kd/fresh.ts).
  expect((await request.post('/kd-fresh', { data: { kind: 'e', slug: bangkok.slug } })).status()).toBe(204);
  // The first HTML is already in its order: Vietnam's nights under its name, Thailand's under "Nơi khác".
  const vn = await (await request.get('/', { headers: IN_VIETNAM })).text();
  expect(here(vn)).toBe('Việt Nam');
  expect(vn).toContain('id="elsewhere-h"');
  expect(vn.indexOf('/e/' + bangkok.slug)).toBeGreaterThan(vn.indexOf('id="elsewhere-h"'));
  expect(vn).not.toContain('data-place-first');
  expect(here(await (await request.get('/?lang=en', { headers: IN_VIETNAM })).text())).toBe('Vietnam');
  expect(here(await (await request.get('/', { headers: { 'x-vercel-ip-country': 'TH' } })).text())).toBe('Thái Lan');
  // No country, one the site does not list, or a search engine: the home page of every city, as it is.
  for (const headers of [{}, { 'x-vercel-ip-country': 'FR' }, { ...IN_VIETNAM, 'user-agent': GOOGLEBOT }] as Record<string, string>[]) {
    const html = await (await request.get('/', { headers })).text();
    expect(here(html), JSON.stringify(headers)).toBeNull();
    expect(html).not.toContain('id="elsewhere-h"');
    expect(html).toContain('/e/' + bangkok.slug);
  }
  // A phone in Vietnam: Vietnam's nights lead, the rest follow under "Nơi khác", drawn so from the first paint.
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, extraHTTPHeaders: IN_VIETNAM });
  const page = await ctx.newPage();
  const problems = watch(page);
  await page.addInitScript(() => {
    const w = window as unknown as { __shift: number };
    w.__shift = 0;
    new PerformanceObserver((l) => {
      for (const e of l.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) if (!e.hadRecentInput) w.__shift += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.addInitScript(held);
  await page.goto('/');
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  expect(await wasHeld(page), 'never held back').toBe(false);
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { level: 2, name: 'Việt Nam' })).toBeVisible();
  await expect(main.getByRole('heading', { level: 2, name: 'Nơi khác' })).toBeAttached();
  // Every city still shows (no filter): the first card is a Vietnamese night, 0 taps.
  await expect(cityOf(page)).toContainText('Mọi thành phố');
  await expect(page.locator('[data-list] article').first()).toContainText('TP.HCM');
  expect(await page.evaluate(() => (window as unknown as { __shift: number }).__shift)).toBeLessThan(0.05);
  // No "Đăng sự kiện" on the phone's top bar: the top is the newcomer's.
  await expect(page.getByRole('banner').getByRole('link', { name: 'Đăng sự kiện' })).toBeHidden();
  // A city, chosen: kept as a cookie too, so the next visit is that city's page from the server, never held back.
  await cityOf(page).click();
  await page.getByRole('menuitemradio', { name: /^TP.HCM/ }).click();
  await expect(page).toHaveURL(/city=ho-chi-minh/);
  expect((await ctx.cookies()).find((c) => c.name === 'ff_city')?.value).toBe('ho-chi-minh');
  await page.goto('/');
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  await expect(cityOf(page)).toContainText('TP.HCM');
  await expect(main.getByRole('heading', { level: 2, name: 'Nơi khác' })).toHaveCount(0);
  expect(await wasHeld(page), 'the chosen city is drawn on the server').toBe(false);
  await expect(page).toHaveURL(/\/\?city=ho-chi-minh$/);
  expect(problems).toEqual([]);
  await ctx.close();
  // A city chosen before the cookie existed (only in the device's storage): it still comes first, held back
  // while it loads, and its cookie is written so the next visit is drawn on the server.
  const old = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, extraHTTPHeaders: IN_VIETNAM });
  await old.addInitScript(() => { try { if (!localStorage.getItem('ff_city')) localStorage.setItem('ff_city', 'ho-chi-minh'); } catch { /* storage blocked */ } });
  const kept = await old.newPage();
  await kept.addInitScript(held);
  await kept.goto('/');
  await kept.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  await expect(cityOf(kept)).toContainText('TP.HCM');
  expect(await wasHeld(kept), 'held back while the city loads').toBe(true);
  expect((await old.cookies()).find((c) => c.name === 'ff_city')?.value).toBe('ho-chi-minh');
  await kept.goto('/');
  await kept.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  await expect(cityOf(kept)).toContainText('TP.HCM');
  expect(await wasHeld(kept), 'then drawn on the server').toBe(false);
  await old.close();
  // A phone from a country the site does not list: every city, nothing grouped, nothing held back.
  const far = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, timezoneId: 'Europe/Paris', locale: 'fr-FR', extraHTTPHeaders: { 'x-vercel-ip-country': 'FR' } });
  const other = await far.newPage();
  await other.addInitScript(held);
  await other.goto('/');
  await other.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  await expect(cityOf(other)).toContainText('Mọi thành phố');
  expect(await wasHeld(other)).toBe(false);
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
