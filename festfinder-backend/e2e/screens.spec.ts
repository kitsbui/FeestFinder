import { expect, test, type Page } from '@playwright/test';
import { expectOps, expectScreen, signInWith, skipRebuilt, watch } from './checks.ts';

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

/** What a click hands to window.open, without leaving for another site. */
async function opened(page: Page, click: () => Promise<void>): Promise<string> {
  await page.evaluate(() => {
    const w = window as unknown as { __opened: string[]; open: (u?: string | URL) => null };
    w.__opened = [];
    w.open = (u) => { w.__opened.push(String(u)); return null; };
  });
  await click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __opened: string[] }).__opened.length)).toBeGreaterThan(0);
  return page.evaluate(() => (window as unknown as { __opened: string[] }).__opened[0]);
}

test.describe('Web', () => {
  const routes: [string, RegExp][] = [
    ['/', /Khám phá/],
    ['/list', /TẤT CẢ SỰ KIỆN/i],
    ['/about', /VỀ FEESTFINDER/i],
    ['/e/ravo', /RAVOLUTION MUSIC FESTIVAL/i],
    ['/o/ravoent', /RAVOLUTION ENTERTAINMENT/i],
    ['/a/hoaprox', /HOAPROX/i],
    ['/a', /NGHỆ SĨ/],
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
    skipRebuilt('/e/ravo');
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

  test('the old map address lands on the list as a map', async ({ page }) => {
    await page.goto('/map');
    await expect(page).toHaveURL(/\/list\?view=map/);
  });

  test('the map asks for the events in view once, and again only on "search this area"', async ({ page }) => {
    skipRebuilt('/list');
    const problems = watch(page);
    const asked: string[] = [];
    page.on('request', (r) => { if (r.url().includes('/events/map?')) asked.push(r.url()); });
    await page.goto('/list?city=ho-chi-minh&view=map');
    await expect(page.locator('#ff-map canvas')).toBeVisible();
    await expect.poll(() => asked.length).toBe(1);
    // Moving the map asks nothing until the visitor says so.
    const box = (await page.locator('#ff-map').boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 - 140, box.y + box.height / 2 - 50, { steps: 10 });
    await page.mouse.up();
    await expect(page.getByText('Tìm trong khu vực này')).toBeVisible();
    expect(asked).toHaveLength(1);
    await page.getByText('Tìm trong khu vực này').click();
    await expect.poll(() => asked.length).toBe(2);
    await expect(page.getByText('Tìm trong khu vực này')).toHaveCount(0);
    await expect(page).toHaveURL(/view=map&bbox=/);
    expect(problems).toEqual([]);
  });

  test('a lineup name opens the artist page, with their shows and its own HTML for search engines', async ({ page, request }) => {
    const html = await (await request.get('/a/hoaprox')).text();
    expect(html).toMatch(/<link rel="canonical" href="http:\/\/localhost:\d+\/a\/hoaprox"/);
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    expect(blocks.flatMap((b) => (b['@graph'] ?? [b]).map((n: { '@type': string }) => n['@type']))).toContain('MusicGroup');
    await expectScreen(page, '/e/ravo', /RAVOLUTION MUSIC FESTIVAL/i);
    await page.getByRole('link', { name: 'Trang nghệ sĩ · Hoaprox' }).click();
    await expect(page).toHaveURL(/\/a\/hoaprox$/);
    await expect(page.getByText('Show sắp tới')).toBeVisible();
    await expect(page.getByText('Ravolution Music Festival').first()).toBeVisible();
  });

  test('the artist directory filters by style, and one style alone has its own address', async ({ page, request }) => {
    await expectScreen(page, '/a', /NGHỆ SĨ/);
    await expect(page.getByText('Hoaprox').first()).toBeVisible();
    const style = (await (await request.get('/meta/discovery')).json()).styles[0];
    await page.getByRole('button', { name: style.label.vi, exact: true }).first().click();
    await expect(page).toHaveURL(new RegExp(`/a/style/${style.key}$`));
    await page.getByRole('button', { name: /Nhận booking$/ }).click();
    await expect(page).toHaveURL(/\/a$/);
    const html = await (await request.get(`/a/style/${style.key}`)).text();
    expect(html).toMatch(new RegExp(`<link rel="canonical" href="http://localhost:\\d+/a/style/${style.key}"`));
  });

  test('an organiser page lists the artists it has worked with', async ({ page }) => {
    await expectScreen(page, '/o/ravoent', /RAVOLUTION ENTERTAINMENT/i);
    await expect(page.getByText('Nghệ sĩ đã hợp tác')).toBeVisible();
    await expect(page.getByText('Hoaprox').first()).toBeVisible();
  });

  test('a new Google account picks a role: an artist gets a profile and the artist workspace, never admin', async ({ page }) => {
    await expectScreen(page, '/e/ravo', /RAVOLUTION MUSIC FESTIVAL/i);
    await page.getByText('Đăng nhập để đăng bài', { exact: true }).click();
    await page.getByText('Tiếp tục với Google', { exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Bạn đến với âm nhạc thế nào?' })).toBeVisible();
    await page.getByText('Biểu diễn', { exact: true }).click();
    const name = `Night Owl ${Date.now() % 100000}`;
    await page.getByLabel('Nghệ danh').fill(name);
    await page.getByText('Tạo hồ sơ', { exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    const who = await (await page.request.get('/auth/session')).json();
    expect(who.user.role).toBe('user');
    expect(who.roles.artist).toBe('active');
    expect(who.artist.name).toBe(name);
    await expectOps(page, '/ops/artist', /Nghệ danh/);
    expect((await page.request.get('/admin/counts')).status()).toBe(403);
    // A gig they report waits for a moderator.
    await expectOps(page, '/ops/artist/gigs', /Báo lịch diễn/);
    await page.request.post('/me/artist/gigs', { data: { title: 'Owl warehouse', startsOn: '2027-03-06', city: 'ho-chi-minh', venueName: 'Lot 9' } });
    await page.reload();
    await expect(page.getByRole('row').filter({ hasText: 'Owl warehouse' })).toContainText('Có tên bạn');
    await expectOps(page, '/ops/artist/gear', /Thêm từ danh mục/);
    await expectOps(page, '/ops/artist/opportunities', /Gig đang mở/);
    await expectOps(page, '/ops/artist/opportunities?tab=dates', /Thêm khoảng/, '/ops/artist/opportunities');
    await expectOps(page, '/ops/artist/opportunities?tab=brands', /Nhận hợp tác thương hiệu/, '/ops/artist/opportunities');
    // Dates they set show on their public page, without the note.
    await page.request.put('/me/artist/availability', { data: { items: [{ from: '2027-03-01', to: '2027-03-03', kind: 'available', note: 'private note' }] } });
    await expectScreen(page, `/a/${who.artist.slug}`, new RegExp(name, 'i'));
    await expect(page.getByText('01/03 – 03/03')).toBeVisible();
    await expect(page.getByText('private note')).toHaveCount(0);
  });

  test('ticket buttons go to the checkout here, or out to the seller, and count the press', async ({ page }) => {
    // FeestFinder sells Ravolution: the button goes to its checkout, in the same tab.
    await expectScreen(page, '/e/ravo', /RAVOLUTION MUSIC FESTIVAL/i);
    const go = page.waitForResponse((r) => r.url().includes('/go/ravo?src=detail'));
    await page.getByText('Mua vé', { exact: true }).first().click();
    expect((await go).headers().location).toBe('/app/checkout/ravo');
    await expect(page).toHaveURL(/\/app\//);

    // A night sold elsewhere: the seller's page opens in a new tab, no sign-in asked for it.
    await signIn(page, 'admin');
    const ev = await (await page.request.get('/events/nhacvien')).json();
    const patched = await page.request.patch(`/admin/events/${ev.id}`, { data: { entryMode: 'paid', priceFrom: 250000, ticketUrl: 'https://tickets.example/nhacvien' } });
    expect(patched.status()).toBe(200);
    await page.request.delete('/auth/session');
    await expectScreen(page, '/e/nhacvien', /HÒA NHẠC NHẠC VIỆN/i);
    const url = await opened(page, () => page.getByText('Mua vé', { exact: true }).first().click());
    expect(url).toBe('/go/nhacvien?src=detail');
    const hop = await page.request.get(url, { maxRedirects: 0 });
    expect([hop.status(), hop.headers().location]).toEqual([302, 'https://tickets.example/nhacvien']);
    // The app does the same, where it used to say no tier was on sale.
    await expectScreen(page, '/app/e/nhacvien', /HÒA NHẠC NHẠC VIỆN/i);
    expect(await opened(page, () => page.getByText(/^Get tickets · from/).first().click())).toBe('/go/nhacvien?src=app');

    // A free night opens the map.
    await expectScreen(page, '/e/outcast', /SAIGON OUTCAST NIGHT MARKET/i);
    expect(await opened(page, () => page.getByText('Vào cửa miễn phí', { exact: true }).first().click()))
      .toBe('https://www.google.com/maps/search/?api=1&query=10.8065%2C106.7411');
  });

  test('the list filters by city, style and kind of night, and the API answers each', async ({ page }) => {
    await expectScreen(page, '/list', /TẤT CẢ SỰ KIỆN/i);
    await expect(page.getByText('Bangkok · 0', { exact: true })).toBeVisible();
    await page.getByText('Techno', { exact: true }).click();
    await expect(page).toHaveURL(/style=techno/);
    await expect(page.getByText('Không có sự kiện nào khớp')).toBeVisible();
    // The same chip again turns it off.
    await page.getByText('Techno', { exact: true }).click();
    await expect(page.getByRole('row').filter({ hasText: 'Ravolution Music Festival' })).toHaveCount(1);
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
    skipRebuilt('/');
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
    skipRebuilt('/e/ravo');
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
    skipRebuilt('/e/ravo/en');
    await page.goto('/e/ravo?lang=en');
    await expect.poll(() => page.locator('body').innerText()).toMatch(/Asked & answered/i);
    expect(await page.locator('body').innerText()).toMatch(/Questions · 3/);
    await expect(page).toHaveURL(/\/e\/ravo\?lang=en$/);
  });

  test('the share sheet saves a story image for Instagram', async ({ page }) => {
    await expectScreen(page, '/e/ravo', /RAVOLUTION MUSIC FESTIVAL/i);
    await page.getByText('Chia sẻ', { exact: true }).first().click();
    const download = page.waitForEvent('download');
    await page.getByText('Instagram', { exact: true }).click();
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

  test('collects an event, makes the collection public, and anyone can open it', async ({ page, browser }) => {
    await signIn(page, 'attendee');
    await expectScreen(page, '/e/ravo', /RAVOLUTION MUSIC FESTIVAL/i);
    await page.getByText('Thêm vào bộ sưu tập', { exact: true }).click();
    await page.getByPlaceholder('Tên bộ sưu tập').fill('Cuối tuần của Minh');
    await page.getByText('Tạo', { exact: true }).click();
    await expect(page.getByText('Đã thêm vào Cuối tuần của Minh')).toBeVisible();
    await page.getByLabel('Close').click();

    await page.goto('/saved');
    await page.getByText('Cuối tuần của Minh', { exact: true }).click();
    await expect(page).toHaveURL(/\/saved\?c=/);
    await page.getByRole('switch').click();
    await expect(page.getByText('Đã bật link công khai')).toBeVisible();
    await page.getByText('Chia sẻ', { exact: true }).first().click();
    for (const name of ['Messenger', 'Instagram', 'TikTok', 'Zalo']) await expect(page.getByText(name, { exact: true })).toBeVisible();

    const mine = await (await page.request.get('/me/collections')).json();
    const url = new URL(mine.items.find((c: any) => c.name === 'Cuối tuần của Minh').url);
    const visitor = await (await browser.newContext()).newPage();
    await expectScreen(visitor, url.pathname, /Cuối tuần của Minh/);
    await expect(visitor.getByText(/RAVOLUTION MUSIC FESTIVAL/i).first()).toBeVisible();
    await visitor.context().close();
  });

  test('makes a vertical clip for TikTok', async ({ page }) => {
    test.setTimeout(60_000);
    await expectScreen(page, '/e/ravo', /RAVOLUTION MUSIC FESTIVAL/i);
    await page.getByText('Chia sẻ', { exact: true }).first().click();
    const download = page.waitForEvent('download', { timeout: 30_000 });
    await page.getByText('TikTok', { exact: true }).click();
    await expect(page.getByText('Đang tạo video…')).toBeVisible();
    expect((await download).suggestedFilename()).toMatch(/^ravo\.(mp4|webm)$/);
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

    test('the list opens as a map that asks for events once, and again only on "search this area"', async ({ page }) => {
      const asked: string[] = [];
      page.on('request', (r) => { if (r.url().includes('/events/map?')) asked.push(r.url()); });
      await expectScreen(page, '/app/list', /EVERY EVENT/i);
      await page.getByRole('button', { name: 'Map', exact: true }).click();
      await expect(page.locator('#ff-app-map canvas')).toBeVisible();
      await expect.poll(() => asked.length).toBe(1);
      const box = (await page.locator('#ff-app-map').boundingBox())!;
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 - 120, box.y + box.height / 2 - 40, { steps: 10 });
      await page.mouse.up();
      await expect(page.getByText('Search this area')).toBeVisible();
      expect(asked).toHaveLength(1);
      await page.getByText('Search this area').click();
      await expect.poll(() => asked.length).toBe(2);
    });

    test('Smart Alerts take cities and music styles', async ({ page }) => {
      await expectScreen(page, '/app/alerts', /ALERT SETTINGS/i);
      await expect(page.getByText('Music styles', { exact: true })).toBeVisible();
      await page.getByText('Bangkok', { exact: true }).click();
      await expect.poll(async () => (await (await page.request.get('/me/alert')).json()).cities).toEqual(['bangkok']);
    });

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

    test('collects an event into a new collection and finds it on Saved', async ({ page }) => {
      await expectScreen(page, '/app/e/ravo', /RAVOLUTION MUSIC FESTIVAL/i);
      await page.getByText('Collect', { exact: true }).click();
      await page.getByPlaceholder('Collection name').fill('Rave nights');
      await page.getByText('Create', { exact: true }).click();
      await expect(page.getByText('Added to Rave nights')).toBeVisible();
      await expectScreen(page, '/app/saved', /SAVED/i);
      await page.getByText('Rave nights', { exact: true }).click();
      await expect(page.getByRole('switch')).toBeVisible();
      await expect(page.getByText(/RAVOLUTION MUSIC FESTIVAL/i).first()).toBeVisible();
    });

    test('TikTok in the share sheet makes a vertical clip', async ({ page }) => {
      test.setTimeout(60_000);
      await expectScreen(page, '/app/e/ravo', /RAVOLUTION MUSIC FESTIVAL/i);
      await page.getByText('Share', { exact: true }).first().click();
      const download = page.waitForEvent('download', { timeout: 30_000 });
      await page.getByText('TikTok', { exact: true }).click();
      expect((await download).suggestedFilename()).toMatch(/^ravo\.(mp4|webm)$/);
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
      ['/studio/gigs', /GIGS & BOOKINGS/i],
    ];
    for (const [path, shows] of routes) {
      test(`${path}`, async ({ page }) => expectScreen(page, path, shows));
    }
    test('posts a gig from the studio and lists it', async ({ page }) => {
      await expectScreen(page, '/studio/gigs', /GIGS & BOOKINGS/i);
      const title = `Studio slot ${Date.now() % 100000}`;
      await page.getByLabel('e.g. Saturday warm-up').fill(title);
      await page.getByLabel('date').fill('2027-04-10');
      await page.getByLabel('Fee from').fill('2000000');
      await page.getByRole('button', { name: 'Post', exact: true }).click();
      await expect(page.getByText(title)).toBeVisible();
      await page.getByText(title).click();
      await expect(page.getByText('No applications yet')).toBeVisible();
    });
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
      ['/ops/claims', /Hồ sơ nghệ sĩ & BTC/],
      ['/ops/claims?what=profiles', /Không có yêu cầu nào|Duyệt/],
      ['/ops/artists', /Hoaprox/],
      ['/ops/artists?tab=gear', /Không có gì chờ duyệt|Duyệt/],
      ['/ops/events', /Đặc điểm/],
      ['/ops/events/new', /Đăng ngay sau khi tạo/],
      ['/ops/reports', /Báo cáo người dùng/],
      ['/ops/organizers', /Thêm nhà tổ chức/],
      ['/ops/venues', /Thêm địa điểm/],
      ['/ops/sources', /Thêm nguồn/],
      ['/ops/partners', /Đối tác bán vé/],
      ['/ops/brands', /Chiến dịch thương hiệu/],
      ['/ops/affiliate', /Vị trí bấm/],
      ['/ops/affiliate?tab=links', /Thêm liên kết/],
      ['/ops/affiliate?tab=payouts', /Chốt kỳ thanh toán/],
      ['/ops/featured', /Thêm dãy/],
      ['/ops/users', /Đăng ký qua/],
      ['/ops/orders', /Chờ thanh toán/i],
      ['/ops/audit', /Chuỗi hash hợp lệ/i],
    ];
    for (const [path, shows] of routes) {
      test(`${path}`, async ({ page }) => expectOps(page, path, shows, path === '/ops/review' ? /^\/ops\/review(\/[0-9a-f-]{36})?$/ : path.split('?')[0]));
    }
    test('adds a ticket partner and shows its report token once', async ({ page }) => {
      await expectOps(page, '/ops/partners', /Đối tác bán vé/);
      await page.getByRole('button', { name: 'Thêm đối tác' }).first().click();
      await page.getByPlaceholder('Ticketbox', { exact: true }).fill('Megatix');
      await page.getByPlaceholder('ticketbox.vn', { exact: true }).fill('megatix.vn');
      await page.getByPlaceholder('ticketbox.vn', { exact: true }).press('Enter');
      await page.locator('.op-drawer').getByRole('button', { name: 'Thêm đối tác' }).click();
      await expect(page.getByText('Mã chỉ hiện một lần.')).toBeVisible();
      await page.getByRole('button', { name: 'Đã lưu mã' }).click();
      await expect(page.getByRole('row').filter({ hasText: 'megatix.vn' })).toHaveCount(1);
    });
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
      ['/ops/org/gigs', /Gig đã đăng/],
      ['/ops/org/gigs?tab=inquiries', /Mời nghệ sĩ/],
    ];
    for (const [path, shows] of routes) {
      test(`${path}`, async ({ page }) => expectOps(page, path, shows, path === '/ops/org/inbox' ? /^\/ops\/org\/inbox(\/[0-9a-f-]{36})?$/ : path.split('?')[0]));
    }
    test('/ops sends an organizer account to organizer mode', async ({ page }) => expectOps(page, '/ops', /Cần bạn xử lý/, '/ops/org'));
  });
});
