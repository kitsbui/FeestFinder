import { expect, test, type Page } from '@playwright/test';

/*
 * Every route boots, shows the screen it names, and breaks nothing on the way:
 * no uncaught exception, no Content-Security-Policy violation, no server error, and no
 * runtime error banner from the design runtime.
 */

type Account = 'attendee' | 'organizer' | 'admin';
const ACCOUNTS: Record<Account, { identifier: string; password: string }> = {
  attendee: { identifier: 'minh@example.com', password: 'festfinder123' },
  organizer: { identifier: 'team@ravolution.vn', password: 'ravolution2026' },
  admin: { identifier: 'admin@festfinder.vn', password: 'festfinder-admin' },
};

/** Collects what should never happen while a screen loads. */
function watch(page: Page) {
  const problems: string[] = [];
  page.on('pageerror', (e) => problems.push(`uncaught: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error' && /Content Security Policy|Refused to (load|execute|apply)/i.test(m.text())) {
      problems.push(`csp: ${m.text()}`);
    }
  });
  page.on('response', (r) => {
    if (r.status() >= 500) problems.push(`${r.status()} ${r.url()}`);
  });
  return problems;
}

async function signIn(page: Page, who: Account) {
  const res = await page.request.post('/auth/login', { data: ACCOUNTS[who] });
  expect(res.ok(), `sign in as ${who}`).toBeTruthy();
}

/** Opens a route and waits for the screen that should be there. */
async function expectScreen(page: Page, path: string, shows: RegExp) {
  const problems = watch(page);
  await page.goto(path);
  // The screen itself (or the sign-in card that stands in for it), not the
  // server-rendered page some routes show until it mounts.
  await page.locator('#dc-root > .sc-host, [data-ff-gate]').first().waitFor({ state: 'attached' });
  // innerText is what a person sees: hidden sections are left out and text-transform
  // applies, so this proves the named screen is the one on show.
  await expect.poll(() => page.locator('body').innerText(), { message: `${path} shows ${shows}` }).toMatch(shows);
  const text = await page.locator('body').innerText();
  expect(text, `${path} rendered without a runtime error`).not.toMatch(/renderVals\(\)|is not a function|Cannot read properties/);
  expect(new URL(page.url()).pathname, `${path} kept its URL`).toBe(path);
  expect(problems, `${path} loaded cleanly`).toEqual([]);
}

test.describe('Web', () => {
  const routes: [string, RegExp][] = [
    ['/', /Explore/],
    ['/map', /EVENTS NEAR YOU/i],
    ['/about', /ABOUT FEESTFINDER/i],
    ['/e/ravo', /RAVOLUTION MUSIC FESTIVAL/i],
    ['/vi/ho-chi-minh/this-weekend', /SỰ KIỆN EDM & LỄ HỘI Ở TP\.HCM/i],
    ['/en/ho-chi-minh/this-weekend', /EDM & FESTIVAL EVENTS IN HO CHI MINH CITY/i],
  ];
  for (const [path, shows] of routes) {
    test(`${path}`, async ({ page }) => expectScreen(page, path, shows));
  }

  test('tabs change the URL and back returns to the previous screen', async ({ page }) => {
    await page.goto('/about');
    await expect.poll(() => page.locator('body').innerText()).toMatch(/ABOUT FEESTFINDER/i);
    await page.getByText('Map', { exact: true }).first().click();
    await expect(page).toHaveURL(/\/map$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/about$/);
    await expect.poll(() => page.locator('body').innerText()).toMatch(/ABOUT FEESTFINDER/i);
  });

  test('the logo and every icon the page links to load', async ({ page, request }) => {
    await page.goto('/');
    const logo = page.locator('img[src="/ui/assets/ff-logo.svg"]').first();
    await expect(logo).toBeVisible();
    await expect.poll(() => logo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    const icons = await page.locator('link[rel~="icon"], link[rel="apple-touch-icon"]').evaluateAll((links) => links.map((l) => l.getAttribute('href') ?? ''));
    expect(icons.length, 'the ICO, the SVG and the touch icon').toBeGreaterThanOrEqual(3);
    // Browsers also ask for /favicon.ico on their own.
    for (const href of [...icons, '/favicon.ico']) {
      const res = await request.get(href);
      expect(res.status(), href).toBe(200);
      expect(res.headers()['content-type'], href).toMatch(/^image\//);
    }
  });
});

test.describe('App', () => {
  test('/app signed out opens on onboarding', async ({ page }) => expectScreen(page, '/app', /AROUND YOU/i));

  test.describe('signed in', () => {
    test.beforeEach(async ({ page }) => signIn(page, 'attendee'));
    const routes: [string, RegExp][] = [
      ['/app', /HAPPENING/i],
      ['/app/saved', /SAVED EVENTS|NOTHING SAVED/i],
      ['/app/profile', /YOU'RE INTO/i],
      ['/app/tickets', /MY TICKETS/i],
      ['/app/e/ravo', /RAVOLUTION MUSIC FESTIVAL/i],
    ];
    for (const [path, shows] of routes) {
      test(`${path}`, async ({ page }) => expectScreen(page, path, shows));
    }
  });
});

test.describe('Organizer', () => {
  test('/studio signed out shows the sign-in gate', async ({ page }) =>
    expectScreen(page, '/studio', /SIGN IN TO LIST AND MANAGE YOUR EVENTS/i));

  test('/organizer redirects to /studio', async ({ page }) => {
    await page.goto('/organizer');
    await expect(page).toHaveURL(/\/studio$/);
  });

  test.describe('signed in', () => {
    test.beforeEach(async ({ page }) => signIn(page, 'organizer'));
    const routes: [string, RegExp][] = [
      ['/studio', /ORGANIZER DASHBOARD/i],
      ['/studio/new', /PUT YOUR EVENT IN FRONT/i],
      ['/studio/attendees', /AFTER THE SALE/i],
      ['/studio/announce', /REACH YOUR CROWD/i],
      ['/studio/door', /SCAN NEXT TICKET/i],
      ['/studio/promos', /PROMOS & GUEST LIST/i],
      ['/studio/revenue', /REVENUE & PAYOUTS/i],
      ['/studio/inbox', /MESSAGES FROM FEESTFINDER/i],
    ];
    for (const [path, shows] of routes) {
      test(`${path}`, async ({ page }) => expectScreen(page, path, shows));
    }
  });
});

test.describe('Admin', () => {
  test('/console signed out shows the sign-in card', async ({ page }) =>
    expectScreen(page, '/console', /Sign in to the admin console/));

  test.describe('signed in', () => {
    test.beforeEach(async ({ page }) => signIn(page, 'admin'));
    const routes: [string, RegExp][] = [
      ['/console', /MODERATION QUEUE/i],
      ['/console/verification', /ORGANIZER VERIFICATION/i],
      ['/console/reports', /USER REPORTS/i],
      ['/console/featured', /FEATURED SHELVES/i],
      ['/console/ads', /ADS & PARTNERS/i],
      ['/console/insights', /PLATFORM NUMBERS/i],
      ['/console/audit', /AUDIT LOG/i],
      ['/console/appeals', /AFTER REJECTION/i],
    ];
    for (const [path, shows] of routes) {
      test(`${path}`, async ({ page }) => expectScreen(page, path, shows));
    }
  });
});

/*
 * The operations back office is plain scripts rather than the design runtime, so it is
 * ready when its own frame (or the sign-in card) is there. It opens in Vietnamese.
 */
async function expectOps(page: Page, path: string, shows: RegExp, landsOn: string | RegExp = path) {
  const problems = watch(page);
  await page.goto(path);
  await page.locator('.op-frame, .op-gate').first().waitFor({ state: 'attached' });
  await expect.poll(() => page.locator('body').innerText(), { message: `${path} shows ${shows}` }).toMatch(shows);
  // The queue and the inbox open their first item on a wide screen, which adds its id.
  const at = new URL(page.url()).pathname;
  if (typeof landsOn === 'string') expect(at, `${path} lands on ${landsOn}`).toBe(landsOn);
  else expect(at, `${path} lands on ${landsOn}`).toMatch(landsOn);
  expect(problems, `${path} loaded cleanly`).toEqual([]);
}

test.describe('Ops', () => {
  test('/ops signed out shows the team sign-in', async ({ page }) => expectOps(page, '/ops', /Đăng nhập khu vận hành/));
  test('/ops/org signed out shows the organizer sign-in', async ({ page }) => expectOps(page, '/ops/org', /Đăng nhập cho nhà tổ chức/));

  test.describe('team', () => {
    test.beforeEach(async ({ page }) => signIn(page, 'admin'));
    const routes: [string, RegExp][] = [
      ['/ops', /Việc cần làm/],
      ['/ops/review', /Duyệt tin đăng/],
      ['/ops/events', /Đặc điểm/],
      ['/ops/events/new', /Đăng ngay sau khi tạo/],
      ['/ops/reports', /Báo cáo người dùng/],
      ['/ops/organizers', /Thêm nhà tổ chức/],
      ['/ops/venues', /Thêm địa điểm/],
      ['/ops/featured', /Thêm dãy/],
      ['/ops/users', /Đăng ký qua/],
      ['/ops/orders', /Chờ thanh toán/i],
      ['/ops/audit', /Chuỗi hash hợp lệ/i],
    ];
    for (const [path, shows] of routes) {
      test(`${path}`, async ({ page }) => expectOps(page, path, shows, path === '/ops/review' ? /^\/ops\/review(\/[0-9a-f-]{36})?$/ : path));
    }
    test('organizer mode explains an admin account has no organizer team', async ({ page }) =>
      expectOps(page, '/ops/org', /chưa thuộc nhà tổ chức nào/));
  });

  test.describe('organizer', () => {
    test.beforeEach(async ({ page }) => signIn(page, 'organizer'));
    const routes: [string, RegExp][] = [
      ['/ops/org', /Cần bạn xử lý/],
      ['/ops/org/events', /Sự kiện của tôi/],
      ['/ops/org/events/new', /Thông tin cơ bản/],
      ['/ops/org/inbox', /Hộp thư kiểm duyệt/],
      ['/ops/org/profile', /Hồ sơ doanh nghiệp/],
    ];
    for (const [path, shows] of routes) {
      test(`${path}`, async ({ page }) => expectOps(page, path, shows, path === '/ops/org/inbox' ? /^\/ops\/org\/inbox(\/[0-9a-f-]{36})?$/ : path));
    }
    test('/ops sends an organizer account to organizer mode', async ({ page }) => expectOps(page, '/ops', /Cần bạn xử lý/, '/ops/org'));
  });
});
