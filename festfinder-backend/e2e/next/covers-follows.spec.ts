import { expect, request, test, type Page } from '@playwright/test';
import { signInWith, watch } from '../checks.ts';

/*
 * The owner's changes of 2026-10-17: a picture is framed once for every place it shows (the link
 * carries it, kd/frame.ts), a saved cover shows on the public page and the directory at once
 * (kd/fresh.ts), the event page has no second bar of tabs, and a person manages who they follow
 * and sees who follows them on their own profile. The test API reads links from a fake network
 * (FAKE_REMOTE_MEDIA): every https link is a 1600×1000 PNG.
 */

const ATTENDEE = { identifier: 'minh@example.com', password: 'festfinder123' };
const SLIMV = { identifier: 'slimv@example.com', password: 'festfinder123' };

async function open(page: Page, path: string) {
  const problems = watch(page);
  await page.goto(path);
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  return problems;
}

/** A new account by email with an artist profile; the page is signed in as it. */
async function newArtist(page: Page) {
  const n = String(Date.now() % 1_000_000);
  const email = `frame${n}@example.com`;
  const start = await (await page.request.post('/auth/otp/start', { data: { channel: 'email', identifier: email } })).json();
  // The code alone signs the new account in (phase 17), on this browser's cookies.
  const verify = await page.request.post('/auth/otp/verify', { data: { challengeId: start.challengeId, code: start.devCode } });
  expect(verify.ok(), 'sign up as ' + email).toBeTruthy();
  const name = `Frame Owl ${n}`;
  expect((await page.request.post('/me/roles/artist', { data: { stageName: name, roles: ['dj'], styles: ['techno'] } })).ok()).toBeTruthy();
  const session = await (await page.request.get('/auth/session')).json();
  return { name, slug: session.artist.slug as string };
}

test('a cover is framed once and shows framed, at once, on the page and in the directory', async ({ page }) => {
  const me = await newArtist(page);
  // The public page is rendered (and cached) before the cover is set.
  await open(page, '/a/' + me.slug);
  await expect(page.locator('img.kd-cover')).toHaveCount(0);

  const problems = await open(page, '/studio/artist');
  const url = `https://img.example/cover-${me.slug}.png`;
  const field = page.getByRole('textbox', { name: /Ảnh bìa/ });
  await field.fill(url);
  await field.press('Enter');
  await page.getByRole('button', { name: 'Căn khung' }).last().click();
  const sheet = page.getByRole('dialog', { name: 'Căn khung ảnh' });
  const point = sheet.getByRole('slider', { name: 'Tâm ảnh' });
  await point.focus();
  for (let i = 0; i < 5; i++) await point.press('ArrowLeft');
  for (let i = 0; i < 10; i++) await point.press('ArrowUp');
  await sheet.locator('input[type="range"]').fill('2');
  // Every place the picture shows, framed the same way.
  await expect(sheet.getByText('Ảnh bìa', { exact: true })).toBeVisible();
  await expect(sheet.getByText('Thẻ', { exact: true })).toBeVisible();
  await sheet.getByRole('button', { name: 'Xong' }).click();
  await expect(sheet).toHaveCount(0);
  // The field shows the link itself; its framing is kept beside it.
  await expect(field).toHaveValue(url);
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(page.getByRole('status')).toContainText('Đã lưu hồ sơ');
  const { profile } = await (await page.request.get('/me/artist')).json();
  expect(profile.coverUrl).toBe(url + '#ff=40,30,2');

  // The page shows it now, not a minute later, drawn around the point chosen.
  await open(page, '/a/' + me.slug);
  const cover = page.locator('img.kd-cover').first();
  // A copy of the picture without its framing (kd/img.ts), twice as wide for a zoom of 2; the framing stays the style.
  const key = Buffer.from(url).toString('base64url');
  await expect(cover).toHaveAttribute('src', new RegExp(`^/img/\\d+x\\d+/${key}\\.webp$`));
  await expect(cover).toHaveAttribute('srcset', new RegExp(`^/img/1280x640/${key}\\.webp 640w,`));
  // (The fake host does not open in the browser, so the picture is hidden: its style is what counts.)
  await expect(cover).toHaveAttribute('style', /object-position:\s*40% 30%/);
  await expect(cover).toHaveAttribute('style', /transform:\s*scale\(2\)/);
  // And so does its card in the directory.
  await open(page, '/a?q=' + encodeURIComponent(me.name));
  await expect(page.locator(`img.kd-cover[src*="/${key}.webp"]`)).toHaveCount(1);
  expect(problems).toEqual([]);
});

test('a stored picture is drawn from a copy its size, and a dead one leaves the initials', async ({ page }) => {
  const me = await newArtist(page);
  // The test network: pics.example gives the API a real picture; img.example passes the check on saving but never opens.
  const cover = `https://pics.example/cover-${me.slug}.png`;
  const photo = `https://img.example/gone-${me.slug}.png`;
  expect((await page.request.patch('/me/artist', { data: { coverUrl: cover, imageUrl: photo } })).status()).toBe(200);
  await page.route('https://img.example/**', (route) => route.fulfill({ status: 404, body: '' }));

  const problems = await open(page, '/a/' + me.slug);
  const img = page.locator('img.kd-cover').first();
  const key = Buffer.from(cover).toString('base64url');
  await expect(img).toHaveAttribute('src', new RegExp(`^/img/\\d+x\\d+/${key}\\.webp$`));
  await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0 && new URL(i.currentSrc).pathname.startsWith('/img/'))).toBe(true);
  // Through the web app as the browser asks: a WebP kept a year, never the stored PNG.
  const copy = await page.request.get(await img.evaluate((i: HTMLImageElement) => i.currentSrc));
  expect(copy.status()).toBe(200);
  expect(copy.headers()['content-type']).toBe('image/webp');
  expect(copy.headers()['cache-control']).toContain('immutable');

  // The photo's copy cannot be made: /img sends the browser to the link, which is gone, and the initials stay.
  const av = page.locator('.kd-artist-photo img');
  const src = await av.getAttribute('src');
  expect(src).toMatch(new RegExp(`^/img/\\d+x\\d+/${Buffer.from(photo).toString('base64url')}\\.webp$`));
  const moved = await page.request.get(src!, { maxRedirects: 0 });
  expect(moved.status()).toBe(302);
  expect(moved.headers()['location']).toBe(photo);
  await expect(av).toHaveAttribute('data-broken', '');
  await expect(page.locator('.kd-artist-photo .kd-av-i')).toBeVisible();
  expect(problems).toEqual([]);
});

test('the event page has no second bar of tabs under the cover', async ({ page }) => {
  const problems = await open(page, '/e/ravo');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Mục trên trang' })).toHaveCount(0);
  await expect(page.locator('.sticky.top-16')).toHaveCount(0);
  expect(problems).toEqual([]);
});

test('a person unfollows and follows again from their profile, and follows back who follows them', async ({ page, baseURL }) => {
  await signInWith(page, ATTENDEE);
  const me = (await (await page.request.get('/auth/session')).json()).user.id as string;
  expect((await page.request.put('/me/follows/artists/slimv')).ok()).toBeTruthy();
  // SlimV's account follows Minh: a person among Minh's followers.
  const slim = await request.newContext({ baseURL });
  expect((await slim.post('/auth/login', { data: SLIMV })).ok()).toBeTruthy();
  const slimId = (await (await slim.get('/auth/session')).json()).user.id as string;
  expect((await slim.put('/me/follows/people/' + me)).ok()).toBeTruthy();
  await page.request.delete('/me/follows/people/' + slimId);

  const problems = await open(page, '/profile');
  const section = page.locator('section[aria-labelledby="pf-follow"]');
  const tabs = section.getByRole('tablist', { name: 'Đang theo dõi' });
  await expect(tabs.getByRole('tab', { name: /Đang theo dõi/ })).toHaveAttribute('aria-selected', 'true');
  const row = section.getByRole('button', { name: 'Đang theo dõi · SlimV' });
  await row.click();
  await expect(section.getByRole('button', { name: 'Theo dõi · SlimV' })).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(async () => (await (await page.request.get('/me/follows')).json()).profiles.some((p: { slug: string }) => p.slug === 'slimv')).toBe(false);
  await section.getByRole('button', { name: 'Theo dõi · SlimV' }).click();
  await expect.poll(async () => (await (await page.request.get('/me/follows')).json()).profiles.some((p: { slug: string }) => p.slug === 'slimv')).toBe(true);

  await tabs.getByRole('tab', { name: /Người theo dõi/ }).click();
  await section.getByRole('button', { name: /^Theo dõi lại · / }).first().click();
  await expect.poll(async () => (await (await page.request.get('/me/follows')).json()).people.some((p: { id: string }) => p.id === slimId)).toBe(true);
  // The numbers above count the same follows.
  await expect(page.getByText('Người theo dõi', { exact: true }).first()).toBeVisible();
  await slim.dispose();
  expect(problems).toEqual([]);
});

test('artist and organiser pages say how many follow them and how many they follow', async ({ page }) => {
  for (const path of ['/a/slimv', '/o/ravoent']) {
    await open(page, path);
    const stats = page.locator('.kd-stat');
    await expect(stats.filter({ hasText: 'Người theo dõi' })).toHaveCount(1);
    await expect(stats.filter({ hasText: 'Đang theo dõi' })).toHaveCount(1);
  }
});
