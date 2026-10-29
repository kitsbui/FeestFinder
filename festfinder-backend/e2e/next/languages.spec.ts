import { expect, test, type Page, type Request } from '@playwright/test';
import { langRedirect } from '../../../festfinder-web/src/kd/lang-pref.ts';
import { watch } from '../checks.ts';

/*
 * Thai, Japanese and Indonesian (design v2 phase 10): every public page at ?lang=th|ja|id, each its
 * own address for search engines, the site's lines in that language (English where a line has
 * none, and for what organisers write), dates the local way; the lines reach the browser only with
 * a page in that language.
 */

/** Opens a page and waits until it has hydrated and read the session. */
async function open(page: Page, path: string) {
  const problems = watch(page);
  await page.goto(path);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  return problems;
}

test('a page names its five languages to search engines and arrives in its own', async ({ request }) => {
  const html = await (await request.get('/e/ravo?lang=th')).text();
  for (const l of ['vi', 'en', 'th', 'ja', 'id']) {
    expect(html).toMatch(new RegExp(`<link rel="alternate" hrefLang="${l}" href="http://localhost:\\d+/e/ravo${l === 'vi' ? '' : `\\?lang=${l}`}"`));
  }
  expect(html).toMatch(/<link rel="canonical" href="http:\/\/localhost:\d+\/e\/ravo\?lang=th"/);
  expect(html).toContain('<meta property="og:locale" content="th_TH"/>');
  expect(html).toContain('ราคา');
  const home = await (await request.get('/?lang=ja')).text();
  expect(home).toMatch(/<h1[^>]*>すべてのイベント<\/h1>/);
  expect(home).toMatch(/<link rel="alternate" hrefLang="id" href="[^"]*\/\?lang=id"/);
  // A Vietnamese or English page carries none of the other languages' lines.
  for (const path of ['/e/ravo', '/e/ravo?lang=en']) expect(await (await request.get(path)).text()).not.toContain('ราคา');
  // The sitemap lists every page in every language.
  const sitemap = await (await request.get('/sitemap.xml')).text();
  for (const l of ['th', 'ja', 'id']) expect(sitemap).toMatch(new RegExp(`<loc>[^<]+/e/ravo\\?lang=${l}</loc>`));
  // The language as a folder of the address is the page with ?lang=.
  const moved = await request.get('/e/ravo/ja', { maxRedirects: 0 });
  expect(moved.status()).toBe(308);
  expect(moved.headers().location).toBe('/e/ravo?lang=ja');
});

/*
 * One city's list (/?city=<slug>, drawn on the server: festfinder-web/src/kd/web/list/city.tsx) is
 * the home page to search engines in every language: the same title, canonical and hreflang links.
 */
test("one city's list has the home page's head in every language", async ({ request }) => {
  /** The head's title, meta tags and canonical and alternate links. */
  const head = (html: string) => {
    const h = html.slice(0, html.indexOf('</head>'));
    return [...h.matchAll(/<title>[^<]*<\/title>|<meta\b[^>]*>|<link rel="(?:canonical|alternate)"[^>]*>/g)].map((m) => m[0]);
  };
  for (const l of ['vi', 'en', 'th', 'ja', 'id']) {
    const q = l === 'vi' ? '' : `lang=${l}`;
    const home = await (await request.get(`/${q ? '?' + q : ''}`)).text();
    const city = await (await request.get(`/?city=ho-chi-minh${q ? '&' + q : ''}`)).text();
    expect(head(city), l).toEqual(head(home));
    expect(head(city).some((t) => t.startsWith('<link rel="canonical"')), l).toBe(true);
    expect(city, l).toContain(`lang="${l}"`);
  }
});

test('a Thai page reads Thai from the list to an event, and offers every language', async ({ page }) => {
  const problems = await open(page, '/?lang=th');
  await expect(page.getByRole('heading', { level: 1, name: 'ทุกอีเวนต์' })).toBeVisible();
  const footer = page.getByRole('contentinfo');
  await expect(footer.getByRole('link', { name: 'Tiếng Việt' })).toHaveAttribute('href', '/');
  await expect(footer.getByRole('link', { name: 'English' })).toHaveAttribute('href', '/?lang=en');
  await expect(footer.getByRole('link', { name: '日本語' })).toHaveAttribute('href', '/?lang=ja');
  await expect(footer.getByRole('link', { name: 'Bahasa Indonesia' })).toHaveAttribute('href', '/?lang=id');
  await expect(footer.getByRole('link', { name: 'ไทย' })).toHaveCount(0);
  await page.getByRole('link', { name: /Ravolution Music Festival/ }).first().click();
  await expect(page).toHaveURL(/\/e\/ravo\?lang=th$/);
  await expect(page.getByText('ราคา', { exact: true }).first()).toBeVisible();
  // What the organiser wrote stays as written; the API answers in English.
  await expect(page.getByRole('heading', { level: 1, name: 'Ravolution Music Festival' })).toBeVisible();
  expect(problems).toEqual([]);
});

test('a Japanese event page writes its dates the Japanese way and brings its font', async ({ page }) => {
  const problems = await open(page, '/e/ravo?lang=ja');
  await expect(page.getByText('料金', { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/\d{1,2}月\d{1,2}日/).first()).toBeVisible();
  await expect(page.locator('link[href="/fonts/noto-sans-jp.css"]')).toHaveCount(1);
  expect(problems).toEqual([]);
});

test('the Indonesian artist directory and about page', async ({ page }) => {
  const problems = await open(page, '/a?lang=id');
  await expect(page.getByText('Punya profil').first()).toBeVisible();
  await page.goto('/about?lang=id');
  await expect(page.getByRole('region', { name: 'FeestFinder dalam angka' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'Satu tempat untuk tahu ada apa malam ini' })).toBeVisible();
  expect(problems).toEqual([]);
});

/** A person's browser: crawlers, previews and headless browsers are never moved (kd/lang-pref.ts). */
const CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';

test('a first visit reads English; the language a person picks is kept, and a shared link never moves them back', async ({ browser, baseURL }) => {
  // The rule itself, with production's first-visit language (this build's is Vietnamese: playwright.next.config.ts).
  const at = (path: string, search: string, cookie: 'vi' | 'en' | null, ua = CHROME) => langRedirect({ path, search, cookie, ua, fallback: 'en' })?.to ?? null;
  expect(at('/e/ravo', '', null)).toBe('/e/ravo?lang=en');
  expect(at('/', '?view=map', null)).toBe('/?view=map&lang=en');
  expect(at('/e/ravo', '?lang=th', null)).toBeNull();
  expect(at('/e/ravo', '?lang=en', 'vi')).toBe('/e/ravo');
  expect(at('/e/ravo', '', 'vi')).toBeNull();
  expect(at('/blog/some-post', '', 'en')).toBe('/blog/some-post?lang=en');
  expect(at('/e/ravo', '', null, 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')).toBeNull();
  for (const p of ['/studio', '/p/new', '/blog/new', '/console', '/e/ravo.md']) expect(at(p, '', null)).toBeNull();
  // A language link keeps the choice and opens the clean address, for anyone.
  expect(langRedirect({ path: '/e/ravo', search: '?setlang=vi&lang=en', cookie: 'en', ua: CHROME })).toEqual({ to: '/e/ravo', set: 'vi' });
  expect(langRedirect({ path: '/', search: '?view=map&setlang=en', cookie: null, ua: null })).toEqual({ to: '/?view=map&lang=en', set: 'en' });

  // In a browser: the flags keep the choice in the cookie the proxy reads.
  const ctx = await browser.newContext({ userAgent: CHROME, viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const problems = watch(page);
  const cookie = async () => (await ctx.cookies(baseURL)).find((c) => c.name === 'ff_lang')?.value;
  await page.goto('/e/ravo');
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  const flags = page.getByRole('banner').getByRole('group', { name: 'Ngôn ngữ' });
  await flags.getByRole('link', { name: 'English' }).click();
  await expect(page).toHaveURL(/\/e\/ravo\?lang=en$/);
  expect(await cookie()).toBe('en');
  // Every Vietnamese address now opens in English.
  await page.goto('/o/ravoent');
  await expect(page).toHaveURL(/\/o\/ravoent\?lang=en$/);
  // Back to Vietnamese: kept, even when someone shares an English link.
  await page.getByRole('banner').getByRole('group', { name: 'Language' }).getByRole('link', { name: 'Tiếng Việt' }).click();
  await expect(page).toHaveURL(/\/o\/ravoent$/);
  expect(await cookie()).toBe('vi');
  await page.goto('/e/ravo?lang=en');
  await expect(page).toHaveURL(/\/e\/ravo$/);
  await expect(page.getByRole('banner').getByRole('group', { name: 'Ngôn ngữ' }).getByRole('link', { name: 'Tiếng Việt' })).toHaveAttribute('aria-current', 'true');
  expect(problems).toEqual([]);
  await ctx.close();
});

test('the router\'s prefetch is never moved to another language; a page load and a navigation still are', async ({ request, browser, baseURL }) => {
  const get = (path: string, headers: Record<string, string>) => request.get(path, { headers: { 'user-agent': CHROME, ...headers }, maxRedirects: 0 });
  const prefetch = { rsc: '1', 'next-router-prefetch': '1', 'next-router-segment-prefetch': '/_tree' };
  // Someone who reads English, and a link's path without its query (Next prefetches that too): no content, cached by nobody.
  let res = await get('/a?_rsc=abc12', { ...prefetch, cookie: 'ff_lang=en' });
  expect(res.status()).toBe(204);
  expect(res.headers()['cache-control']).toBe('private, no-store');
  expect(res.headers().location).toBeUndefined();
  expect(res.headers()['set-cookie']).toBeUndefined();
  // The same address navigated to (the router's request) or opened moves, without the router's _rsc.
  res = await get('/a?_rsc=abc12', { rsc: '1', cookie: 'ff_lang=en' });
  expect(res.status()).toBe(307);
  expect(res.headers().location).toBe('/a?lang=en');
  res = await get('/a', { cookie: 'ff_lang=en' });
  expect(res.status()).toBe(307);
  expect(res.headers().location).toBe('/a?lang=en');
  // Someone who chose Vietnamese and an English link: the prefetch is not moved, the click is, and a language link's prefetch keeps no choice.
  res = await get('/e/ravo?lang=en&_rsc=abc12', { ...prefetch, cookie: 'ff_lang=vi' });
  expect(res.status()).toBe(204);
  res = await get('/e/ravo?lang=en&_rsc=abc12', { rsc: '1', cookie: 'ff_lang=vi' });
  expect(res.status()).toBe(307);
  expect(res.headers().location).toBe('/e/ravo');
  res = await get('/e/ravo?setlang=en&_rsc=abc12', { ...prefetch, cookie: 'ff_lang=vi' });
  expect(res.status()).toBe(204);
  expect(res.headers()['set-cookie']).toBeUndefined();
  // A path the API answers still reaches it (without the router's headers and _rsc, which the proxy now sees).
  res = await get('/health?_rsc=abc12', prefetch);
  expect(res.status()).toBe(200);

  // In a browser that reads English: the tab bar's places are prefetched with and without their query,
  // none of them moved, every prefetch answered, and the page goes quiet.
  const ctx = await browser.newContext({ userAgent: CHROME, viewport: { width: 390, height: 844 } });
  await ctx.addCookies([{ name: 'ff_lang', value: 'en', url: baseURL! }]);
  const page = await ctx.newPage();
  const problems = watch(page);
  const moved: string[] = [];
  const empty: string[] = [];
  const pending = new Set<Request>();
  page.on('request', (r) => { if (r.headers()['next-router-prefetch']) pending.add(r); });
  page.on('requestfinished', (r) => pending.delete(r));
  page.on('requestfailed', (r) => pending.delete(r));
  page.on('response', (r) => {
    if (!r.request().headers()['next-router-prefetch']) return;
    if (r.status() === 307) moved.push(r.url());
    if (r.status() === 204) empty.push(new URL(r.url()).pathname);
  });
  await page.goto('/?lang=en');
  await expect(page.getByRole('heading', { level: 1, name: 'Every event' })).toBeVisible();
  await expect.poll(() => empty).toContain('/blog');
  await expect.poll(() => pending.size).toBe(0);
  await page.waitForLoadState('networkidle', { timeout: 10_000 });
  expect(moved).toEqual([]);
  expect(page.url()).toMatch(/\/\?lang=en$/);
  expect(problems).toEqual([]);
  await ctx.close();
});

test("the skip link is in the page's own language in its HTML, and leads to its <main>", async ({ request }) => {
  const skip = (html: string) => [...html.matchAll(/<a href="#main" class="kd-skip"[^>]*>([^<]*)<\/a>/g)].map((m) => m[1]);
  for (const path of ['/?lang=en', '/e/ravo?lang=en', '/a?lang=en', '/o/ravoent?lang=en', '/blog?lang=en', '/about?lang=en']) {
    const html = await (await request.get(path)).text();
    expect(skip(html), path).toEqual(['Skip to content']);
    expect(html, path).toMatch(/<main id="main"/);
  }
  for (const path of ['/', '/e/ravo']) expect(skip(await (await request.get(path)).text()), path).toEqual(['Bỏ qua tới nội dung']);
});
