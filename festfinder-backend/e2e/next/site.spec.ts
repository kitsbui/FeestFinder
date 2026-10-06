import { expect, test } from '@playwright/test';

/*
 * What the Next.js app adds on top of the screens: pages a search engine can read without
 * running JavaScript, the headers that lock the pages down, and the service worker that
 * keeps tickets on the phone.
 */

test.describe('pages for search engines', () => {
  test('an event page is complete HTML before any script runs', async ({ request }) => {
    const res = await request.get('/e/ravo');
    expect(res.status()).toBe(200);
    const html = await res.text();
    // The same head, graph and facts the API's own event pages carry (GET /seo/events/ravo).
    expect(html).toMatch(/<title>Ravolution Music Festival – 19\/9 · SECC[^<]*\| FeestFinder<\/title>/);
    expect(html).toMatch(/<link rel="canonical" href="http:\/\/localhost:\d+\/e\/ravo"/);
    expect(html).toMatch(/<link rel="alternate" hrefLang="en" href="http:\/\/localhost:\d+\/e\/ravo\?lang=en"/);
    expect(html).toMatch(/<meta name="robots" content="index, follow, max-image-preview:large/);
    expect(html).toMatch(/<h1[^>]*>Ravolution Music Festival<\/h1>/);
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    const nodes = blocks.flatMap((b) => b['@graph'] ?? [b]);
    const event = nodes.find((b) => b['@type'] === 'MusicEvent');
    expect(event, 'MusicEvent structured data').toBeTruthy();
    expect(event.location.address.addressCountry).toBe('VN');
    expect(event.offers['@type']).toBe('AggregateOffer');
    // The organiser's answers on the page are its FAQ, for search engines and AI answers.
    const faq = nodes.find((b) => b['@type'] === 'FAQPage');
    expect(faq?.mainEntity.length).toBeGreaterThan(0);
    expect(html).toContain('Câu hỏi thường gặp');
    expect(html).toContain('Ravolution Music Festival là sự kiện EDM');
    const en = await (await request.get('/e/ravo?lang=en')).text();
    expect(en).toMatch(/<link rel="canonical" href="http:\/\/localhost:\d+\/e\/ravo\?lang=en"/);
    expect(en).toContain('Ravolution Music Festival is an EDM event');
  });

  test('robots.txt welcomes AI search crawlers and turns training crawlers away', async ({ request }) => {
    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toMatch(/User-Agent: GPTBot[\s\S]*Disallow: \//i);
    expect(robots).not.toMatch(/OAI-SearchBot/);
  });

  test('the old landing pages redirect to the list with their filters', async ({ request }) => {
    const vi = await request.get('/vi/ho-chi-minh/free/this-weekend', { maxRedirects: 0 });
    expect(vi.status()).toBe(301);
    expect(vi.headers().location).toMatch(/\/list\?city=ho-chi-minh&time=weekend&lang=vi$/);
    const en = await request.get('/en/ho-chi-minh/edm', { maxRedirects: 0 });
    expect(en.headers().location).toMatch(/\/list\?city=ho-chi-minh&genre=EDM&lang=en$/);
    expect((await request.get('/e/not-a-real-event')).status()).toBe(404);
  });

  test('the sitemap lists live events and robots keeps the back offices out', async ({ request }) => {
    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect(sitemap).toMatch(/<loc>[^<]+\/e\/ravo<\/loc>/);
    expect(sitemap).toMatch(/<loc>[^<]+\/o\/ravoent<\/loc>/);
    expect(sitemap).toMatch(/<loc>[^<]+\/e\/ravo\?lang=en<\/loc>/);
    expect(sitemap).not.toMatch(/\/vi\/ho-chi-minh/);
    const robots = await (await request.get('/robots.txt')).text();
    for (const path of ['/app', '/studio', '/console']) expect(robots).toContain(`Disallow: ${path}`);
  });

  test('the app installs', async ({ request }) => {
    const manifest = await (await request.get('/manifest.webmanifest')).json();
    expect(manifest.start_url).toBe('/app');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons.some((i: { purpose: string }) => i.purpose === 'maskable')).toBe(true);
    // A missing icon, or one whose pixels differ from its declared size, is dropped by the browser.
    for (const icon of manifest.icons as { src: string; sizes: string }[]) {
      const res = await request.get(icon.src);
      expect(res.status(), icon.src).toBe(200);
      const png = await res.body();
      expect(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, `${icon.src} is ${icon.sizes}`).toBe(icon.sizes);
    }
  });
});

test('pages carry a strict policy with no eval', async ({ request }) => {
  const res = await request.get('/');
  const csp = res.headers()['content-security-policy'];
  expect(csp).toContain("script-src 'self'");
  expect(csp).not.toContain('unsafe-eval');
  expect(csp).toContain("frame-ancestors 'none'");
  expect(res.headers()['x-content-type-options']).toBe('nosniff');
});

test('tickets still open with no signal', async ({ page, context }) => {
  const login = await page.request.post('/auth/login', { data: { identifier: 'minh@example.com', password: 'festfinder123' } });
  expect(login.ok()).toBeTruthy();
  await page.goto('/app/tickets');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  // The first visit installed the worker; this one runs through it and fills the cache.
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await expect.poll(() => page.locator('body').innerText()).toMatch(/FF-RAVO-/);

  await context.setOffline(true);
  await page.reload();
  await expect.poll(() => page.locator('body').innerText()).toMatch(/Vé của tôi/);
  await expect.poll(() => page.locator('body').innerText()).toMatch(/FF-RAVO-/);
  await context.setOffline(false);
});

test('signing out drops the cached tickets from the device', async ({ page }) => {
  await page.request.post('/auth/login', { data: { identifier: 'minh@example.com', password: 'festfinder123' } });
  await page.goto('/app/tickets');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  // Personal answers: the session, and anything under /me (tickets, saves, plans…).
  const personal = () => page.evaluate(async () => {
    const found: string[] = [];
    for (const name of await caches.keys()) {
      for (const req of await (await caches.open(name)).keys()) {
        const path = new URL(req.url).pathname;
        if (path === '/auth/session' || path.startsWith('/me')) found.push(path);
      }
    }
    return found;
  });
  await expect.poll(async () => (await personal()).includes('/me/tickets')).toBe(true);
  await page.evaluate(() => fetch('/auth/session', { method: 'DELETE' }));
  // Public reads the app keeps making may cache again; nothing of the person's may.
  await expect.poll(personal).toEqual([]);
});

test('browser extensions adding <div>s to <body> do not break hydration', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && /hydrat/i.test(m.text())) errors.push(m.text()); });
  // What a cursor-trail extension did to a real visitor: its own <div>s in <body> while
  // the page was still loading, before React hydrated. One goes first, one goes last.
  await page.addInitScript(() => {
    new MutationObserver((_, obs) => {
      if (!document.body) return;
      obs.disconnect();
      const first = document.createElement('div');
      first.className = 'extension-overlay';
      document.body.prepend(first);
      const last = document.createElement('div');
      last.className = 'extension-widget';
      document.body.append(last);
    }).observe(document, { childList: true, subtree: true });
  });
  for (const path of ['/', '/e/ravo', '/list', '/app']) {
    await page.goto(path);
    // Once the page has hydrated, the extension's elements are back where it put them.
    await expect.poll(() => page.evaluate(() => ({
      first: document.body.firstElementChild?.className,
      widget: document.querySelector('.extension-widget')?.parentElement?.tagName,
    })), { message: path }).toEqual({ first: 'extension-overlay', widget: 'BODY' });
  }
  expect(errors).toEqual([]);
});
