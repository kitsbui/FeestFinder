import { expect, test, type Browser, type Page } from '@playwright/test';
import { signInWith, watch } from '../checks.ts';

/*
 * A public collection in Kính đêm (festfinder-web/src/kd/web/collection): what the compiled
 * screen showed at /c/<slug> (its events as cards, who made it, saving, sharing), on the rebuilt
 * page. The demo data has no collections, so Minh makes them here, and takes them away after.
 */

const ATTENDEE = { identifier: 'minh@example.com', password: 'festfinder123' };
const run = Date.now() % 100000;
const NAME = `Cuối tuần của Minh ${run}`;
const EMPTY = `Để dành ${run}`;

let slug = '';
let emptySlug = '';
let privateSlug = '';
const made: string[] = [];
let savedBefore = new Set<string>();

/** Minh's request context, signed in. */
async function asMinh(browser: Browser) {
  const ctx = await browser.newContext();
  const res = await ctx.request.post('/auth/login', { data: ATTENDEE });
  expect(res.ok(), 'sign in as Minh').toBeTruthy();
  return ctx;
}

const savedIds = async (r: Awaited<ReturnType<typeof asMinh>>['request']) =>
  new Set<string>(((await (await r.get('/me/saves?limit=100')).json()).items as { id: string }[]).map((e) => e.id));

test.beforeAll(async ({ browser }) => {
  const ctx = await asMinh(browser);
  const r = ctx.request;
  savedBefore = await savedIds(r);
  const id = async (s: string) => (await (await r.get('/events/' + s)).json()).id as string;
  const make = async (name: string, isPublic: boolean, events: string[]) => {
    const c = await (await r.post('/me/collections', { data: { name } })).json();
    made.push(c.id);
    for (const s of events) expect((await r.put(`/me/collections/${c.id}/events/${await id(s)}`)).ok()).toBeTruthy();
    return (await (await r.patch('/me/collections/' + c.id, { data: { isPublic } })).json()) as { id: string; slug: string | null };
  };
  // Two upcoming (one free) and one that has ended.
  slug = (await make(NAME, true, ['ravo', 'outcast', 'ravo-2025'])).slug!;
  emptySlug = (await make(EMPTY, true, [])).slug!;
  // Public once, so it has an address, then private again.
  const hidden = await make(`Riêng tư ${run}`, true, ['hozo']);
  privateSlug = hidden.slug!;
  await r.patch('/me/collections/' + hidden.id, { data: { isPublic: false } });
  // Collecting saves an event too: put Minh's saves back as they were.
  for (const e of await savedIds(r)) if (!savedBefore.has(e)) await r.delete('/me/saves/' + e);
  await ctx.close();
});

test.afterAll(async ({ browser }) => {
  const ctx = await asMinh(browser);
  for (const c of made) await ctx.request.delete('/me/collections/' + c);
  for (const e of await savedIds(ctx.request)) if (!savedBefore.has(e)) await ctx.request.delete('/me/saves/' + e);
  await ctx.close();
});

async function open(page: Page, path: string) {
  const problems = watch(page);
  await page.goto(path);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  return problems;
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

test.describe('a public collection', () => {
  test('arrives as HTML with its events, structured data and the other language', async ({ request }) => {
    const res = await request.get('/c/' + slug);
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toContain(`>${NAME}</h1>`);
    expect(html).toMatch(new RegExp(`<link rel="canonical" href="http://localhost:\\d+/c/${slug}"`));
    expect(html).toMatch(new RegExp(`<link rel="alternate" hrefLang="en" href="http://localhost:\\d+/c/${slug}\\?lang=en"`));
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    const types = blocks.flatMap((b) => (b['@graph'] ?? [b]).map((n: { '@type': string }) => n['@type']));
    for (const t of ['CollectionPage', 'ItemList', 'BreadcrumbList']) expect(types).toContain(t);
    expect(html).toContain('href="/e/ravo"');
    expect(html).not.toMatch(/<meta name="robots" content="[^"]*noindex/);
    expect(html).not.toContain('/ui/theme.css');

    const en = await (await request.get(`/c/${slug}?lang=en`)).text();
    expect(en).toMatch(new RegExp(`<link rel="canonical" href="http://localhost:\\d+/c/${slug}\\?lang=en"`));
    expect(en).toContain('Made by Minh Anh');
    expect(en).toContain(`href="/e/ravo?lang=en"`);

    // Unknown, or no longer public: not found.
    expect((await request.get('/c/nobody-here')).status()).toBe(404);
    expect((await request.get('/c/' + privateSlug)).status()).toBe(404);
  });

  test('shows who made it, its upcoming events as cards and the past ones folded', async ({ page }) => {
    const problems = await open(page, '/c/' + slug);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(NAME);
    await expect(page.getByText('Tạo bởi Minh Anh', { exact: true })).toBeVisible();

    const upcoming = page.getByRole('region', { name: 'Sắp tới' });
    await expect(upcoming.getByRole('article')).toHaveCount(2);
    await expect(upcoming.getByRole('link', { name: 'Ravolution Music Festival', exact: true })).toHaveAttribute('href', '/e/ravo');
    await expect(upcoming.getByRole('article').filter({ hasText: 'Saigon Outcast Night Market' }).getByText('Miễn phí')).toBeVisible();

    const past = page.getByRole('region', { name: 'Đã qua' });
    await expect(past.getByRole('link', { name: /Ravolution Music Festival 2025/ })).toBeHidden();
    await past.getByText('Đã qua', { exact: true }).click();
    await expect(past.getByText('2025', { exact: true })).toBeVisible();
    await past.getByRole('link', { name: /Ravolution Music Festival 2025/ }).click();
    await expect(page).toHaveURL(/\/e\/ravo-2025$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ravolution Music Festival 2025');
    expect(problems).toEqual([]);
  });

  test('opens in English at ?lang=en, and its links stay in English', async ({ page }) => {
    const problems = await open(page, `/c/${slug}?lang=en`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(NAME);
    await expect(page.getByText('Made by Minh Anh', { exact: true })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Upcoming' }).getByRole('link', { name: 'Ravolution Music Festival', exact: true })).toHaveAttribute('href', '/e/ravo?lang=en');
    await expect(page.getByRole('button', { name: 'Share', exact: true })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/c/${slug}\\?lang=en$`));
    expect(problems).toEqual([]);
  });

  test('saving an event asks for sign-in, then saves it', async ({ page }) => {
    await open(page, '/c/' + slug);
    await page.getByRole('button', { name: 'Lưu Saigon Outcast Night Market', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Đăng nhập' })).toBeVisible();
    await page.keyboard.press('Escape');

    await signInWith(page, ATTENDEE);
    await open(page, '/c/' + slug);
    const id = (await (await page.request.get('/events/outcast')).json()).id as string;
    const saved = async () => ((await (await page.request.get('/me/saves?limit=100')).json()).items as { id: string }[]).some((e) => e.id === id);
    const save = page.getByRole('button', { name: 'Lưu Saigon Outcast Night Market', exact: true });
    await expect(save).toHaveAttribute('aria-pressed', 'false');
    await save.click();
    await expect(save).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(saved).toBe(true);
    await save.click();
    await expect(save).toHaveAttribute('aria-pressed', 'false');
    await expect.poll(saved).toBe(false);
  });

  test('the share sheet copies the link, opens Facebook, saves a story image and makes a clip', async ({ page }) => {
    test.setTimeout(60_000);
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    const problems = await open(page, '/c/' + slug);
    await page.getByRole('button', { name: 'Chia sẻ', exact: true }).click();
    const sheet = page.getByRole('dialog', { name: 'Chia sẻ' });
    for (const name of ['Zalo', 'Messenger', 'Threads', 'X', 'Telegram']) await expect(sheet.getByRole('button', { name, exact: true })).toBeVisible();

    await sheet.getByRole('button', { name: 'Chép liên kết' }).click();
    await expect(page.getByText('Đã chép liên kết')).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(new RegExp(`/c/${slug}$`));

    const fb = await opened(page, () => sheet.getByRole('button', { name: 'Facebook' }).click());
    expect(fb).toMatch(new RegExp(`^https://www\\.facebook\\.com/sharer/sharer\\.php\\?u=.*%2Fc%2F${slug}$`));

    const image = page.waitForEvent('download');
    await sheet.getByRole('button', { name: 'Ảnh story' }).click();
    expect((await image).suggestedFilename()).toBe(`feestfinder-${slug}.png`);

    const clip = page.waitForEvent('download', { timeout: 30_000 });
    await sheet.getByRole('button', { name: 'Video ngắn' }).click();
    await expect(page.getByText('Đang tạo video…')).toBeVisible();
    expect((await clip).suggestedFilename()).toMatch(new RegExp(`^feestfinder-${slug}\\.(mp4|webm)$`));
    expect(problems).toEqual([]);
  });

  test('an empty one still opens, says so, leads back to the events, and is kept out of search', async ({ page, request }) => {
    const html = await (await request.get('/c/' + emptySlug)).text();
    expect(html).toMatch(/<meta name="robots" content="noindex, follow"/);

    const problems = await open(page, '/c/' + emptySlug);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(EMPTY);
    await expect(page.getByText('Bộ sưu tập chưa có sự kiện', { exact: true })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Đã qua' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Khám phá sự kiện' })).toHaveAttribute('href', '/');
    expect(problems).toEqual([]);
  });
});
