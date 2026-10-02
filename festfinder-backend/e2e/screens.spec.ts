import { expect, test, type Page } from '@playwright/test';
import { expectOps, expectScreen, signInWith } from './checks.ts';

/*
 * Every route of the four screens and Ops, on the demo data (test/fixtures/seed.ts): it
 * boots, shows the screen it names, and breaks nothing on the way (see checks.ts).
 */

type Account = 'attendee' | 'organizer' | 'admin';
const ACCOUNTS: Record<Account, { identifier: string; password: string }> = {
  attendee: { identifier: 'minh@example.com', password: 'festfinder123' },
  organizer: { identifier: 'team@ravolution.vn', password: 'ravolution2026' },
  admin: { identifier: 'admin@feestfinder.com', password: 'festfinder-admin' },
};

async function signIn(page: Page, who: Account) {
  await signInWith(page, ACCOUNTS[who]);
}

test.describe('Web', () => {
  const routes: [string, RegExp][] = [
    ['/', /Khám phá/],
    ['/list', /TẤT CẢ SỰ KIỆN/i],
    ['/about', /VỀ FEESTFINDER/i],
    ['/e/ravo', /RAVOLUTION MUSIC FESTIVAL/i],
    ['/o/ravoent', /RAVOLUTION ENTERTAINMENT/i],
  ];
  for (const [path, shows] of routes) {
    test(`${path}`, async ({ page }) => expectScreen(page, path, shows));
  }

  test('tabs change the URL and back returns to the previous screen', async ({ page }) => {
    await page.goto('/about');
    await expect.poll(() => page.locator('body').innerText()).toMatch(/VỀ FEESTFINDER/i);
    await page.getByText('Danh sách', { exact: true }).first().click();
    await expect(page).toHaveURL(/\/list$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/about$/);
    await expect.poll(() => page.locator('body').innerText()).toMatch(/VỀ FEESTFINDER/i);
  });

  test('opens in Vietnamese, switches to English and remembers it', async ({ page }) => {
    await expectScreen(page, '/list', /TẤT CẢ SỰ KIỆN/i);
    expect(await page.evaluate(() => document.documentElement.lang)).toBe('vi');
    await page.getByRole('button', { name: 'English' }).click();
    await expect.poll(() => page.locator('body').innerText()).toMatch(/EVERY EVENT/i);
    expect(await page.evaluate(() => document.documentElement.lang)).toBe('en');
    // An event page has an English address of its own.
    await page.goto('/e/ravo');
    await expect(page).toHaveURL(/\/e\/ravo\?lang=en$/);
    await expect.poll(() => page.locator('body').innerText()).toMatch(/Asked & answered/i);
    await page.getByRole('button', { name: 'Tiếng Việt' }).click();
    await expect(page).toHaveURL(/\/e\/ravo$/);
    await expect.poll(() => page.locator('body').innerText()).toMatch(/Hỏi & đáp/i);
  });

  test('the old map address lands on the list', async ({ page }) => {
    await page.goto('/map');
    await expect(page).toHaveURL(/\/list$/);
  });

  test('the old city landing pages land on the list with their filters', async ({ page }) => {
    await page.goto('/vi/ho-chi-minh/edm/this-weekend');
    await expect(page).toHaveURL(/\/list\?city=ho-chi-minh&genre=EDM&time=weekend$/);
    await expect.poll(() => page.locator('body').innerText()).toMatch(/TẤT CẢ SỰ KIỆN/i);
  });

  test('the list shows every event as a table or a grid, by city', async ({ page }) => {
    await expectScreen(page, '/list', /TẤT CẢ SỰ KIỆN/i);
    await expect(page.getByRole('row').filter({ hasText: 'Ravolution Music Festival' })).toHaveCount(1);
    await page.getByText('Lưới', { exact: true }).click();
    await expect(page.getByRole('row')).toHaveCount(0);
    await expect(page.getByText('Ravolution Music Festival').first()).toBeVisible();
    await page.getByText('Hà Nội · 0', { exact: true }).click();
    await expect(page.getByText('Không có sự kiện nào khớp')).toBeVisible();
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

test.describe('Event page community', () => {
  test('the event page arrives as HTML with its facts, FAQ and structured data', async ({ request }) => {
    const res = await request.get('/e/ravo');
    expect(res.status()).toBe(200);
    const html = await res.text();
    // Both fronts: the API's shell and the Next.js page.
    expect(html).toMatch(/<title>Ravolution Music Festival[^<]*<\/title>/);
    expect(html).toMatch(/<link rel="canonical" href="http:\/\/localhost:\d+\/e\/ravo"/);
    expect(html).toMatch(/<link rel="alternate" hrefLang="en" href="http:\/\/localhost:\d+\/e\/ravo\?lang=en"|<link rel="alternate" hreflang="en" href="http:\/\/localhost:\d+\/e\/ravo\?lang=en"/);
    expect(html).toMatch(/<meta property="og:image" content="http:\/\/localhost:\d+\/og\/v1\/edm\.png"/);
    // One schema.org graph: the site, the page, the event, its breadcrumbs and the organiser's FAQ.
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    const types = blocks.flatMap((b) => (b['@graph'] ?? [b]).map((n: { '@type': string }) => n['@type']));
    for (const t of ['MusicEvent', 'FAQPage', 'WebPage', 'BreadcrumbList']) expect(types).toContain(t);
    expect(html).toMatch(/<main class="ff-ssr" lang="vi">[\s\S]*<h1>Ravolution Music Festival<\/h1>[\s\S]*Ravolution Music Festival là sự kiện EDM[\s\S]*Câu hỏi thường gặp/);
    const og = await request.get('/og/v1/edm.png');
    expect(og.headers()['content-type']).toBe('image/png');
    expect((await request.get('/e/no-such-event')).status()).toBe(404);
  });

  test('organiser pages, Markdown versions and llms.txt are there for search engines and AI agents', async ({ request }) => {
    const html = await (await request.get('/o/ravoent')).text();
    expect(html).toMatch(/<link rel="canonical" href="http:\/\/localhost:\d+\/o\/ravoent"/);
    expect(html).toContain('Ravolution Entertainment là đơn vị tổ chức sự kiện');
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    expect(blocks.flatMap((b) => (b['@graph'] ?? [b]).map((n: { '@type': string }) => n['@type']))).toContain('ProfilePage');
    const md = await request.get('/e/ravo.md');
    expect(md.headers()['content-type']).toMatch(/^text\/markdown/);
    expect(await md.text()).toMatch(/^# Ravolution Music Festival/);
    expect(await (await request.get('/o/ravoent.md?lang=en')).text()).toMatch(/^# Ravolution Entertainment\n\n> Ravolution Entertainment is an event promoter/);
    expect(await (await request.get('/llms.txt')).text()).toMatch(/^# FeestFinder[\s\S]*\/e\/ravo\.md\)/);
  });

  test('opens in Vietnamese, the language search engines index it in, with hype goals, resale, the discussion and the FAQ', async ({ page }) => {
    await expectScreen(page, '/e/ravo', /RAVOLUTION MUSIC FESTIVAL/i);
    const text = await page.locator('body').innerText();
    expect(text).toMatch(/Hỏi & đáp/i);
    expect(text).toMatch(/Pass vé/);
    expect(text).toMatch(/1\.050\.000₫/);
    expect(text).toMatch(/Thảo luận/);
    expect(text).toMatch(/Hỏi đáp · 3/);
    expect(text).toMatch(/Công bố nghệ sĩ bí mật/);
    expect(text).toMatch(/Đại sứ/);
    expect(text).toMatch(/Tin từ BTC/);
    expect(text).toMatch(/Cổng số 3 mở sớm/);
  });

  test('opens in English at ?lang=en, and keeps it in the address', async ({ page }) => {
    await page.goto('/e/ravo?lang=en');
    await expect.poll(() => page.locator('body').innerText()).toMatch(/Asked & answered/i);
    expect(await page.locator('body').innerText()).toMatch(/Questions · 3/);
    await expect(page).toHaveURL(/\/e\/ravo\?lang=en$/);
  });

  test('the share sheet saves a story image', async ({ page }) => {
    await expectScreen(page, '/e/ravo', /RAVOLUTION MUSIC FESTIVAL/i);
    await page.getByText('Chia sẻ', { exact: true }).first().click();
    const download = page.waitForEvent('download');
    await page.getByText('Story', { exact: true }).click();
    expect((await download).suggestedFilename()).toBe('ravo.png');
  });

  test('signs up with Google first, and comes back to the same page', async ({ page }) => {
    await expectScreen(page, '/e/ravo', /RAVOLUTION MUSIC FESTIVAL/i);
    await page.getByText('Đăng nhập để đăng bài', { exact: true }).click();
    // The test API's Google stand-in answers at once; the real one asks which account.
    await page.getByText('Tiếp tục với Google', { exact: true }).click();
    await expect(page.getByText(/Đã tạo tài khoản|Đã đăng nhập/).first()).toBeVisible();
    const back = new URL(page.url());
    expect(back.pathname + back.search, 'back where it started, with the sign-in result taken out').toBe('/e/ravo');
    const who = await (await page.request.get('/auth/session')).json();
    expect(who.user.signupMethod).toBe('google');
  });

  test('a signed-in attendee posts a question', async ({ page }) => {
    await signIn(page, 'attendee');
    await expectScreen(page, '/e/ravo', /RAVOLUTION MUSIC FESTIVAL/i);
    await page.getByPlaceholder('Hỏi BTC và mọi người…').fill('Có tủ gửi đồ cho balo không ạ?');
    await page.getByText('Đăng', { exact: true }).click();
    await expect(page.getByText('Có tủ gửi đồ cho balo không ạ?').first()).toBeVisible();
    await expect(page.getByText('Hỏi đáp · 4')).toBeVisible();
  });
});

test.describe('App', () => {
  test('/app signed out opens on onboarding', async ({ page }) => expectScreen(page, '/app', /AROUND YOU/i));

  test('/app signs in with Google from the sign-in card', async ({ page }) => {
    await expectScreen(page, '/app/saved', /AROUND YOU/i);
    await page.getByText('Pick a city instead', { exact: true }).click();
    await page.getByText('Skip for now', { exact: true }).click();
    await page.getByText('Log in', { exact: true }).first().click();
    await page.getByText('Continue with Google', { exact: true }).click();
    await expect(page.getByText(/Logged in|Account created/).first()).toBeVisible();
    const back = new URL(page.url());
    expect(back.pathname + back.search).toBe('/app/saved');
    const who = await (await page.request.get('/auth/session')).json();
    expect(who.user.signupMethod).toBe('google');
  });

  test.describe('signed in', () => {
    test.beforeEach(async ({ page }) => signIn(page, 'attendee'));
    const routes: [string, RegExp][] = [
      ['/app', /HAPPENING/i],
      ['/app/saved', /SAVED EVENTS|NOTHING SAVED/i],
      ['/app/profile', /YOU'RE INTO/i],
      ['/app/tickets', /MY TICKETS/i],
      ['/app/e/ravo', /RAVOLUTION MUSIC FESTIVAL/i],
      ['/app/list', /EVERY EVENT/i],
    ];
    for (const [path, shows] of routes) {
      test(`${path}`, async ({ page }) => expectScreen(page, path, shows));
    }

    test('each ticket can be given away or resold from the wallet', async ({ page }) => {
      await expectScreen(page, '/app/tickets', /MY TICKETS/i);
      await expect(page.getByText('Resell', { exact: true })).toHaveCount(2);
      await page.getByText('Resell', { exact: true }).first().click();
      await expect(page.getByText('Pass on this ticket')).toBeVisible();
      await expect(page.getByText(/At most 1\.200\.000₫/)).toBeVisible();
    });

    test('the event sheet carries the organiser’s updates, the FAQ and the discussion', async ({ page }) => {
      await expectScreen(page, '/app/e/ravo', /RAVOLUTION MUSIC FESTIVAL/i);
      await expect(page.getByText('From the organiser')).toBeVisible();
      await expect(page.getByText('Frequently asked')).toBeVisible();
      await expect(page.getByText(/^Questions · \d+$/)).toBeVisible();
    });

    test('IG Stories in the share sheet saves a story image', async ({ page }) => {
      await expectScreen(page, '/app/e/ravo', /RAVOLUTION MUSIC FESTIVAL/i);
      await page.getByText('Share', { exact: true }).first().click();
      const download = page.waitForEvent('download');
      await page.getByText('IG Stories', { exact: true }).click();
      expect((await download).suggestedFilename()).toBe('ravo.png');
    });

    test('the profile shows the raver passport and opens Wrapped', async ({ page }) => {
      await expectScreen(page, '/app/profile', /RAVER PASSPORT/i);
      await expect(page.getByText('5 nights · 3 genres · 1 cities')).toBeVisible();
      await page.getByText(/^Wrapped 20\d\d$/).first().click();
      await expect(page.getByText(/nights out/)).toBeVisible();
    });

    test('a resale ticket opens its own checkout', async ({ page }) => {
      const listing = (await (await page.request.get('/events/rapviet/resale')).json()).items[0];
      await page.goto(`/app/checkout/rapviet?listing=${listing.id}`);
      await expect(page.getByText(/Resale ticket · General admission/)).toBeVisible();
      await expect(page.getByText('682.500₫')).toBeVisible();
    });
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
      ['/studio/door', /CHECK TICKET/i],
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

test.describe('Ops', () => {
  test('/ops signed out shows the team sign-in', async ({ page }) => expectOps(page, '/ops', /Đăng nhập khu vận hành/));
  test('/ops/org signed out shows the organizer sign-in', async ({ page }) => expectOps(page, '/ops/org', /Đăng nhập cho nhà tổ chức/));

  test.describe('team', () => {
    test.beforeEach(async ({ page }) => signIn(page, 'admin'));
    const routes: [string, RegExp][] = [
      ['/ops', /Việc cần làm/],
      ['/ops/review', /Duyệt tin đăng/],
      ['/ops/claims', /Nhận quản lý sự kiện/],
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
