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
    // The server HTML contains calendar chips linking to events
    for (const title of ['HOZO Super Fest', 'Ravolution Music Festival']) expect(html).toContain(title);
    expect(html).toContain('href="/e/hozo"');
    expect(html).toContain('href="/e/ravo"');
    expect(html).toMatch(/<link rel="alternate" hrefLang="en" href="[^"]*\/\?lang=en"/);
    expect(html).toMatch(/<link rel="canonical" href="https?:\/\/[^/"]+\/?"/);
    const en = await (await request.get('/?lang=en')).text();
    expect(en).toContain('HOZO Super Fest');
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
    // The page redirects and loads with the style filter
    await expect(page).toHaveURL(/\/\?style=techno/);
    await page.goto('/list?lang=en');
    await expect(page).toHaveURL(/\/\?lang=en$/);
    await page.goto('/map');
    // The /map address redirects to the home page (view parameter is ignored now)
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
    // A city's page, or a search, hides the highlight: testers read "Hà Nội · 0" over a Phuket festival as EDC in Hà Nội (2026-10-21).
    await page.goto('/?city=ho-chi-minh');
    await expect(page.locator('[data-surface]')).toHaveCount(0);
    await page.goto('/?q=ravolution');
    await expect(page.locator('[data-surface]')).toHaveCount(0);
  } finally {
    await page.request.put(`/admin/shelves/${shelf.id}/items`, { data: { eventIds: shelf.items.map((i) => i.id) } });
    await page.request.patch(`/admin/shelves/${shelf.id}`, { data: { enabled: shelf.enabled, sponsored: shelf.sponsored, startsOn: shelf.startsOn, endsOn: shelf.endsOn } });
    await fresh();
  }
});

/*
 * The map and calendar hold the screen's height, so the footer never rises into view.
 */
test('the footer stays below the first screen', async ({ page }) => {
  const problems = await open(page, '/?city=ha-noi');
  await page.setViewportSize({ width: 390, height: 844 });
  const top = await page.locator('footer').evaluate((f) => f.getBoundingClientRect().top);
  expect(top).toBeGreaterThanOrEqual(844);
  expect(problems).toEqual([]);
});


/** Every <img> tag of a page's HTML. */
const imgTags = (html: string) => [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);

/*
 * One picture is fetched first on the home page: the highlight's first card with a cover.
 * On a filtered address, the highlight never shows.
 */
test('the first picture is fetched first, and a filtered address never paints the highlight', async ({ page }) => {
  await page.request.post('/auth/login', { data: { identifier: 'admin@feestfinder.com', password: 'festfinder-admin' } });
  // The demo's live nights have no cover: the team posts one that has, in the highlight.
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
    // The shelf leads with the night that has a cover.
    await page.request.put(`/admin/shelves/${shelf.id}/items`, { data: { eventIds: [ev.id, ...others.slice(0, 2)] } });
    await page.request.patch(`/admin/shelves/${shelf.id}`, { data: { enabled: true, sponsored: false, startsOn: null, endsOn: null } });
    await fresh(page.request);
    const html = await (await page.request.get('/')).text();
    const imgs = imgTags(html);
    const high = imgs.filter((t) => /\bfetchpriority="high"/i.test(t));
    // The highlight's first picture is fetched first.
    expect(high.length).toBeGreaterThan(0);
    const key = Buffer.from(cover).toString('base64url');
    const eager = imgs.find((t) => /\bfetchpriority="high"/i.test(t) && t.includes(key));
    expect(eager).toBeTruthy();
    // React preloads the same picture.
    const head = html.slice(0, html.indexOf('</head>'));
    const preload = [...head.matchAll(/<link\b[^>]*>/g)].map(([t]) => t).filter((t) => /\brel="preload"/.test(t) && /\bas="image"/.test(t) && t.includes(key));
    expect(preload.length).toBeGreaterThan(0);

    // A filtered address on a phone: the highlight never shows.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      const w = window as unknown as { __shift: number; __highlight: boolean };
      w.__shift = 0;
      w.__highlight = false;
      new PerformanceObserver((l) => {
        for (const e of l.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) if (!e.hadRecentInput) w.__shift += e.value;
      }).observe({ type: 'layout-shift', buffered: true });
      const look = () => {
        const h = document.querySelector('[data-surface="shelf"]');
        if (h && h.getClientRects().length) w.__highlight = true;
        if (document.readyState !== 'complete' || h) requestAnimationFrame(look);
      };
      requestAnimationFrame(look);
    });
    const problems = await open(page, '/?style=techno');
    await expect(page.locator('[data-surface]')).toHaveCount(0);
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

/*
 * A night outside the visitor's country names its country after its city on its card (feedback, 2026-10-21:
 * "Phuket, Thailand" at a glance). Here nobody's country is known, so every card names one; the page of a
 * city leaves its own country off.
 */
