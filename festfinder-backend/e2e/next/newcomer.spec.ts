import { expect, test } from '@playwright/test';
import { watch } from '../checks.ts';

/*
 * A newcomer on a phone (design v2 phase 11, artboard 24 of the design review): what someone who
 * has never used FeestFinder sees and can do, on data like Feest Radar's (no price, no age, no
 * cover, English text). Every check here is a promise to that person.
 */

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });




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
 * frame (the logo, search and the tabs). Like the JS budgets, controls only go down. 2026-11-06: the
 * home page's first screen is the map, whose pins are drawn without MapLibre until a touch, then the
 * calendar's toolbar (22 → 11).
 */
const IN_SIGHT = { home: 11, event: 13 };

test('the first screens ask little: few controls in sight', async ({ page }) => {
  const problems = watch(page);
  await page.goto('/');
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  // Home page: map section, calendar, highlight, footer.
  await expect(page.locator('section[aria-label*="Bản đồ"]')).toBeVisible();
  await expect(page.locator('section[aria-labelledby="cal-h"]')).toBeVisible();
  const home = await controlsInSight(page);
  expect(home.n, home.names.join(' | ')).toBeLessThanOrEqual(IN_SIGHT.home);
  // Event page: go directly to a known event.
  await page.goto('/e/ravo');
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  const event = await controlsInSight(page);
  expect(event.n, event.names.join(' | ')).toBeLessThanOrEqual(IN_SIGHT.event);
  // Only one way to the tickets in sight: the dock. The hero has no button of its own (the panel's is the one on a computer).
  await expect(page.getByRole('main').locator('a[href="#tickets"]').first()).toBeHidden();
  await page.locator('.kd-buy-dock').getByRole('link', { name: 'Mua vé' }).click();
  await expect(page.locator('#tickets')).toBeInViewport();
  expect(problems).toEqual([]);
});
