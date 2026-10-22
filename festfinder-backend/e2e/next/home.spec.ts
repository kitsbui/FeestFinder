import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { watch } from '../checks.ts';

/*
 * The home page is the list of every event (owner, 2026-10-17; festfinder-web/src/kd/web/list):
 * no "Khám phá" page any more, /list and /map lead here with their filters, the banner and the
 * questions sit below the list, and the logo and icons both fronts serve load. The list itself is
 * checked in list.spec.ts.
 */

async function open(page: Page, path = '/') {
  const problems = watch(page);
  await page.goto(path);
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  return problems;
}

test.describe('the home page', () => {
  test('arrives as HTML with every event and its other language (the questions are on /about)', async ({ request }) => {
    const html = await (await request.get('/')).text();
    expect(html).toMatch(/<h1[^>]*>Tất cả sự kiện<\/h1>/);
    for (const title of ['HOZO Super Fest', 'Ravolution Music Festival']) expect(html).toContain(title);
    expect(html).toMatch(/<link rel="alternate" hrefLang="en" href="[^"]*\/\?lang=en"/);
    expect(html).toMatch(/<link rel="canonical" href="https?:\/\/[^/"]+\/?"/);
    const en = await (await request.get('/?lang=en')).text();
    expect(en).toMatch(/<h1[^>]*>Every event<\/h1>/);
    expect(en).toContain('<title>FeestFinder — EDM club nights, raves and festivals</title>');
  });

  test('has no "Khám phá": the nav names Sự kiện for the home page, on a computer and a phone', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const problems = await open(page);
    const nav = page.getByRole('navigation', { name: 'Chính' });
    await expect(nav.getByRole('link', { name: 'Khám phá' })).toHaveCount(0);
    await expect(nav.getByRole('link', { name: 'Sự kiện' })).toHaveAttribute('href', '/');
    await expect(nav.getByRole('link', { name: 'Sự kiện' })).toHaveAttribute('aria-current', 'page');
    // On a phone the tab bar is the nav.
    await page.setViewportSize({ width: 375, height: 812 });
    await expect(nav.getByRole('link', { name: 'Khám phá' })).toHaveCount(0);
    await expect(nav.getByRole('link', { name: 'Sự kiện', exact: true })).toHaveAttribute('aria-current', 'page');
    expect(problems).toEqual([]);
  });

  test('the old addresses of the list and the map lead here with their filters', async ({ page }) => {
    const moved = await page.request.get('/list?style=techno&view=grid', { maxRedirects: 0 });
    expect(moved.headers().location).toBe('/?style=techno&view=grid');
    await page.goto('/list?style=techno&view=grid');
    // Once its rows are in, the list writes its address without the view it shows by default (the grid).
    await expect(page).toHaveURL(/\/\?style=techno(&view=grid)?$/);
    await expect(page.getByRole('button', { name: /, Loại$/ })).toHaveText('Techno');
    await page.goto('/list?lang=en');
    await expect(page).toHaveURL(/\/\?lang=en$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Every event' })).toBeVisible();
    await page.goto('/map');
    await expect(page).toHaveURL(/\/\?view=map$/);
  });

  test('the search and its styles land on the home page’s list', async ({ page }) => {
    // A computer: the bar's field, reached with Ctrl+K (⌘K on a Mac).
    await page.setViewportSize({ width: 1280, height: 800 });
    await open(page, '/a');
    await page.keyboard.press('Control+k');
    const field = page.getByRole('banner').getByRole('searchbox', { name: 'Tìm kiếm' });
    await expect(field).toBeFocused();
    await field.fill('ravolution');
    await field.press('Enter');
    await expect(page).toHaveURL(/\/\?q=ravolution$/);
    // A phone: the search on top; its styles count every upcoming event.
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page, '/a');
    await page.getByRole('banner').getByRole('button', { name: 'Tìm kiếm' }).click();
    const sheet = page.getByRole('dialog', { name: 'Tìm kiếm' });
    const house = sheet.getByRole('link', { name: /^House\b/ });
    await expect(house).toContainText(/\d/);
    const counted = Number(((await house.innerText()).match(/\d+/) ?? ['0'])[0]);
    await house.click();
    // A phone opens the list on its cards, and the address says so.
    await expect(page).toHaveURL(/\/\?style=house(&view=grid)?$/);
    await expect(page.getByText('Không có sự kiện nào khớp')).toHaveCount(0);
    const listed = (await (await page.request.get('/events?time=all&upcoming=1&style=house&limit=1')).json()).total;
    expect(listed).toBe(counted);
  });

  test('no line counts the events or says when the list was updated', async ({ page }) => {
    await open(page);
    await expect(page.getByText(/sự kiện · Cập nhật/)).toHaveCount(0);
    await expect(page.getByText(/^Cập nhật \d/)).toHaveCount(0);
  });

  test('the logo and every icon the page links to load', async ({ page, request }) => {
    await open(page);
    const logo = page.locator('img[src="/kd/ff-wordmark.svg"]').first();
    await expect.poll(() => logo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    // Its height is in CSS too (Tailwind's img { height: auto } leaves it unsized, and traces then blame it for every shift).
    const footerLogo = page.locator('footer img[src="/kd/ff-wordmark.svg"]');
    await expect(footerLogo).toHaveCSS('height', '18px');
    await expect(footerLogo).toHaveAttribute('style', /height:\s*18px/);
    const icons = await page.locator('link[rel~="icon"], link[rel="apple-touch-icon"]').evaluateAll((links) => links.map((l) => l.getAttribute('href') ?? ''));
    expect(icons.length).toBeGreaterThanOrEqual(3);
    for (const href of [...icons, '/favicon.ico']) {
      const res = await request.get(href);
      expect(res.status(), href).toBe(200);
      expect(res.headers()['content-type'], href).toMatch(/^image\//);
    }
  });
});

/*
 * A featured shelf the team switched on takes the home page's one highlight slot (growth plan
 * card 5), with "Được tài trợ" when it was paid for. The demo shelves are outside their dates on
 * the test clock, so this turns one on and puts it back.
 */
test('a featured shelf takes the highlight slot, and says when it is paid for', async ({ page }) => {
  await page.request.post('/auth/login', { data: { identifier: 'admin@feestfinder.com', password: 'festfinder-admin' } });
  type Shelf = { id: string; slug: string; enabled: boolean; sponsored: boolean; startsOn: string | null; endsOn: string | null; items: { id: string }[] };
  const shelf = ((await (await page.request.get('/admin/shelves')).json()).items as Shelf[]).find((s) => s.slug === 'quiet-nights')!;
  const ids = (await (await page.request.get('/events?time=all&upcoming=true&city=ho-chi-minh&limit=3')).json()).items.map((e: { id: string }) => e.id);
  const fresh = () => page.request.post('/kd-fresh', { data: { kind: 's', slug: shelf.slug } });
  try {
    await page.request.put(`/admin/shelves/${shelf.id}/items`, { data: { eventIds: ids } });
    await page.request.patch(`/admin/shelves/${shelf.id}`, { data: { enabled: true, sponsored: true, startsOn: null, endsOn: null } });
    await fresh();
    await page.goto('/');
    const slot = page.getByRole('region', { name: 'Đêm nhạc nhẹ' });
    await expect(slot).toBeVisible();
    await expect(slot.getByText('Được tài trợ', { exact: true })).toBeVisible();
    await expect(slot.locator('a[href^="/e/"]').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Lễ hội lớn thế giới' })).toHaveCount(0);
  } finally {
    await page.request.put(`/admin/shelves/${shelf.id}/items`, { data: { eventIds: shelf.items.map((i) => i.id) } });
    await page.request.patch(`/admin/shelves/${shelf.id}`, { data: { enabled: shelf.enabled, sponsored: shelf.sponsored, startsOn: shelf.startsOn, endsOn: shelf.endsOn } });
    await fresh();
  }
});

/*
 * The home page's list changes after the first paint: the browser reads the address's city or the
 * city this device chose, and asks the API again. Its <main> holds a screen's height, so the footer
 * never rises into view (the 0.31 shift production measured on /?city=ho-chi-minh&lang=en).
 */
test('the footer stays below the first screen while the list changes after the first paint', async ({ browser }) => {
  // Hà Nội is launched and has no night in the demo data: every row gives way to the empty panel.
  for (const [path, city] of [['/?city=ha-noi', null], ['/', 'ha-noi']] as const) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    // The city this device chose before (city-first.tsx: data-city-first).
    if (city) await page.addInitScript((c) => localStorage.setItem('ff_city', c), city);
    const problems = await open(page, path);
    await expect(page.getByText('Không có sự kiện nào khớp')).toBeVisible();
    await page.waitForLoadState('networkidle');
    const top = await page.locator('footer').evaluate((f) => f.getBoundingClientRect().top);
    expect(top, path).toBeGreaterThanOrEqual(844);
    expect(problems).toEqual([]);
    await ctx.close();
  }
});

/*
 * The seven day headings count from the first night listed, never from the device's today, so a
 * browser whose day is not the server's draws the same sections (owner, 2026-10-22).
 */
test('the days are grouped the same on the server and in a browser whose day differs', async ({ browser, request }) => {
  const html = await (await request.get('/')).text();
  const server = [...html.matchAll(/<section\b[^>]*\bid="(day-[^"]+)"/g)].map((m) => m[1]);
  // The first night is on the API's day (14 Sep): the 20th still has its own heading.
  expect(server).toContain('day-2026-09-20');
  // The API's clock (10:00 on 14 Sep in Asia) is still 13 Sep in Pago Pago: the first night is tomorrow there.
  const ctx = await browser.newContext({ timezoneId: 'Pacific/Pago_Pago', viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const problems = await open(page);
  await expect(page.locator('#day-2026-09-14-h')).toContainText('ngày mai');
  await page.waitForLoadState('networkidle');
  expect(await page.locator('section[id^="day-"]').evaluateAll((all) => all.map((x) => x.id))).toEqual(server);
  expect(problems).toEqual([]);
  await ctx.close();
});

/** A 1×1 PNG: the fake host's picture. */
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

/** Every <img> tag of a page's HTML. */
const imgTags = (html: string) => [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);

/*
 * One picture is fetched first on the home page: the highlight's first card with a cover, else the
 * list's (Art eager: fetchpriority high, which React also preloads in the head). An address with a
 * filter other than the city never paints the highlight, and its list waits for its answer
 * (city-first.tsx: data-asked, data-list-wait), so nothing on screen moves.
 */
test('the first picture is fetched first, and a filtered address never paints the highlight', async ({ page }) => {
  await page.request.post('/auth/login', { data: { identifier: 'admin@feestfinder.com', password: 'festfinder-admin' } });
  // The demo's live nights have no cover: the team posts one that has, in the highlight and the list.
  const cover = 'https://pics.example/first-picture.png';
  const org = (await (await page.request.get('/admin/organizers?q=Ravolution')).json()).items[0];
  const made = await page.request.post('/admin/events', { data: { organizerId: org.id, title: 'First Picture Test', city: 'ho-chi-minh', venueName: 'The Deck', address: '38 Nguyễn Ư Dĩ, Thảo Điền', startsOn: '2026-09-16', startTime: '22:00', endTime: '03:00', entryMode: 'free', styles: ['techno'], coverUrl: cover, publish: true } });
  expect(made.ok(), await made.text()).toBeTruthy();
  const ev = (await made.json()) as { id: string; slug: string };
  type Shelf = { id: string; slug: string; enabled: boolean; sponsored: boolean; startsOn: string | null; endsOn: string | null; items: { id: string }[] };
  const shelf = ((await (await page.request.get('/admin/shelves')).json()).items as Shelf[]).find((x) => x.slug === 'quiet-nights')!;
  const others = (await (await page.request.get('/events?time=all&upcoming=true&city=ho-chi-minh&limit=3')).json()).items.map((e: { id: string }) => e.id).filter((id: string) => id !== ev.id);
  const fresh = (r: APIRequestContext) => Promise.all([r.post('/kd-fresh', { data: { kind: 's', slug: shelf.slug } }), r.post('/kd-fresh', { data: { kind: 'e', slug: ev.slug } })]);
  try {
    // The shelf leads with the night that has a cover; the list has it too.
    await page.request.put(`/admin/shelves/${shelf.id}/items`, { data: { eventIds: [ev.id, ...others.slice(0, 2)] } });
    await page.request.patch(`/admin/shelves/${shelf.id}`, { data: { enabled: true, sponsored: false, startsOn: null, endsOn: null } });
    await fresh(page.request);
    const html = await (await page.request.get('/')).text();
    const imgs = imgTags(html);
    const high = imgs.filter((t) => /\bfetchpriority="high"/i.test(t));
    expect(high, 'one picture first').toHaveLength(1);
    expect(high[0]).toBe(imgs.find((t) => /\bclass="kd-cover\b/.test(t) && /\bsrc="/.test(t)));
    expect(high[0]).toContain(`src="${cover}"`);
    expect(high[0]).not.toContain('loading="lazy"');
    // The list's card of the same night waits its turn.
    expect(imgs.filter((t) => t.includes(`src="${cover}"`))).toHaveLength(2);
    const head = html.slice(0, html.indexOf('</head>'));
    expect([...head.matchAll(/<link\b[^>]*>/g)].some(([t]) => /\brel="preload"/.test(t) && /\bas="image"/.test(t) && t.includes(`href="${cover}"`)), 'preloaded').toBe(true);

    // A filtered address on a phone: the highlight never shows, the list's first picture is the one.
    await page.route('https://pics.example/**', (route) => route.fulfill({ contentType: 'image/png', body: PNG }));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      const w = window as unknown as { __shift: number; __highlight: boolean };
      w.__shift = 0;
      w.__highlight = false;
      new PerformanceObserver((l) => {
        for (const e of l.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) if (!e.hadRecentInput) w.__shift += e.value;
      }).observe({ type: 'layout-shift', buffered: true });
      // Before every frame: is the highlight drawn?
      const look = () => {
        const h = document.querySelector('[data-surface="shelf"]');
        if (h && h.getClientRects().length) w.__highlight = true;
        if (document.readyState !== 'complete' || h) requestAnimationFrame(look);
      };
      requestAnimationFrame(look);
    });
    const problems = await open(page, '/?style=techno');
    await expect(page.locator('html')).not.toHaveAttribute('data-list-wait', /.*/);
    await expect(page.locator('html')).not.toHaveAttribute('data-asked', /.*/);
    await expect(page.locator('[data-surface]')).toHaveCount(0);
    const first = page.locator('[data-list] img.kd-cover').first();
    await expect(first).toHaveAttribute('src', cover);
    expect(await first.evaluate((img: HTMLImageElement) => img.fetchPriority)).toBe('high');
    await expect(page.locator('img[fetchpriority="high" i]')).toHaveCount(1);
    await page.waitForLoadState('networkidle');
    const seen = await page.evaluate(() => { const w = window as unknown as { __shift: number; __highlight: boolean }; return { shift: w.__shift, highlight: w.__highlight }; });
    expect(seen.highlight, 'the highlight was drawn').toBe(false);
    expect(seen.shift).toBeLessThanOrEqual(0.05);
    expect(problems).toEqual([]);
  } finally {
    await page.request.put(`/admin/shelves/${shelf.id}/items`, { data: { eventIds: shelf.items.map((i) => i.id) } });
    await page.request.patch(`/admin/shelves/${shelf.id}`, { data: { enabled: shelf.enabled, sponsored: shelf.sponsored, startsOn: shelf.startsOn, endsOn: shelf.endsOn } });
    await page.request.post(`/admin/events/${ev.id}/status`, { data: { action: 'take_down' } });
    await fresh(page.request);
  }
});
