import { expect, test, type Page } from '@playwright/test';
import { signInWith, watch } from '../checks.ts';

/*
 * The artist page in Kính đêm (festfinder-web/src/kd/web/artist): what the compiled screen
 * showed (shows, who they play with, booking details, free dates), on the rebuilt page.
 */

const ATTENDEE = { identifier: 'minh@example.com', password: 'festfinder123' };

async function newAccount(page: Page, email: string) {
  const start = await (await page.request.post('/auth/otp/start', { data: { channel: 'email', identifier: email } })).json();
  const verify = await (await page.request.post('/auth/otp/verify', { data: { challengeId: start.challengeId, code: start.devCode } })).json();
  const done = await page.request.post('/auth/password', { data: { token: verify.signupToken, password: 'longenough1', passwordConfirm: 'longenough1' } });
  expect(done.ok(), 'sign up as ' + email).toBeTruthy();
}

async function open(page: Page, path: string) {
  const problems = watch(page);
  await page.goto(path);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  return problems;
}

test.describe('the artist page', () => {
  test('arrives as HTML with their shows, structured data and the other language', async ({ request }) => {
    const res = await request.get('/a/hoaprox');
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toMatch(/<h1[^>]*>Hoaprox/);
    expect(html).toMatch(/<link rel="canonical" href="http:\/\/localhost:\d+\/a\/hoaprox"/);
    expect(html).toMatch(/<link rel="alternate" hrefLang="en" href="http:\/\/localhost:\d+\/a\/hoaprox\?lang=en"/);
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    expect(blocks.flatMap((b) => (b['@graph'] ?? [b]).map((n: { '@type': string }) => n['@type']))).toContain('MusicGroup');
    expect(html).toContain('href="/e/ravo"');
    expect(html).not.toContain('/ui/theme.css');
    expect((await request.get('/a/nobody-here')).status()).toBe(404);
    // The directory is still the compiled screen.
    expect(await (await request.get('/a')).text()).toContain('/ui/theme.css');
  });

  test('opens in English at ?lang=en', async ({ page }) => {
    const problems = await open(page, '/a/hoaprox?lang=en');
    await expect(page.getByRole('tab', { name: /Upcoming/ })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('link', { name: 'Ravolution Music Festival' })).toHaveAttribute('href', '/e/ravo?lang=en');
    await expect(page.getByRole('link', { name: /Ravolution Entertainment/ })).toHaveAttribute('href', '/o/ravoent?lang=en');
    expect(problems).toEqual([]);
  });

  test('the next show buys through /go, and the past tab lists where they played', async ({ page }) => {
    await open(page, '/a/hoaprox');
    const buy = page.getByRole('link', { name: 'Mua vé' }).first();
    await expect(buy).toHaveAttribute('href', '/go/ravo?src=artist');
    await page.getByRole('tab', { name: /Đã diễn/ }).click();
    await expect(page.getByRole('tabpanel', { name: 'Đã diễn' }).getByRole('link', { name: /Ravolution Music Festival 2025/ })).toBeVisible();
  });

  test('following asks for sign-in, then follows the name and moves the count', async ({ page }) => {
    await open(page, '/a/hoaprox');
    await page.getByRole('button', { name: 'Theo dõi', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Đăng nhập' })).toBeVisible();
    await page.keyboard.press('Escape');

    await signInWith(page, ATTENDEE);
    await page.request.delete('/me/follows/artists/Hoaprox');
    await open(page, '/a/hoaprox');
    const followers = page.locator('.kd-stat').filter({ hasText: 'Người theo dõi' }).locator('.kd-v');
    const n = async () => Number((await followers.innerText()).replace(/\D/g, ''));
    await expect(page.getByRole('button', { name: 'Theo dõi', exact: true })).toHaveAttribute('aria-pressed', 'false');
    // The count is read once the page's own answer is in (the button waits for it too).
    await expect(page.getByRole('button', { name: 'Theo dõi', exact: true })).toBeEnabled();
    const before = await n();
    await page.getByRole('button', { name: 'Theo dõi', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Đang theo dõi' })).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(n).toBe(before + 1);
    await expect.poll(async () => (await (await page.request.get('/artists/hoaprox')).json()).artist.following).toBe(true);
    await page.getByRole('button', { name: 'Đang theo dõi' }).click();
    await expect.poll(n).toBe(before);
  });

  test('an artist’s own profile: their bio, links, booking and free dates, and the edit link only for them', async ({ page, browser }) => {
    // A new account by email (the test API hands back the code), which becomes an artist.
    await newAccount(page, `owl${Date.now() % 1_000_000}@example.com`);
    const name = `Night Owl ${Date.now() % 100000}`;
    expect((await page.request.post('/me/roles/artist', { data: { stageName: name, roles: ['dj'] } })).ok()).toBeTruthy();
    const slug = (await (await page.request.get('/auth/session')).json()).artist.slug;

    const patched = await page.request.patch('/me/artist', { data: {
      bio: { vi: 'DJ ở Sài Gòn, chơi melodic techno.', en: 'A Saigon DJ playing melodic techno.' },
      roles: ['dj', 'producer'], basedCity: 'ho-chi-minh', bookingStatus: 'available', travelScope: 'domestic',
      languages: ['vi', 'en'], links: { spotify: 'https://open.spotify.com/artist/abc123' },
    } });
    expect(patched.status()).toBe(200);
    await page.request.put('/me/artist/availability', { data: { items: [{ from: '2027-03-01', to: '2027-03-03', kind: 'available', note: 'private note' }] } });

    await open(page, '/a/' + slug);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(name);
    await expect(page.getByText('DJ ở Sài Gòn, chơi melodic techno.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Spotify' })).toHaveAttribute('href', 'https://open.spotify.com/artist/abc123');
    await expect(page.getByText('Đang nhận booking').first()).toBeVisible();
    await page.getByText('Lịch', { exact: true }).click();
    await expect(page.getByText('01/03 – 03/03')).toBeVisible();
    await expect(page.getByText('private note')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Chỉnh hồ sơ' })).toHaveAttribute('href', '/ops/artist');
    await expect(page.getByRole('button', { name: 'Bạn là nghệ sĩ này?' })).toHaveCount(0);

    // Anyone else sees no edit link.
    const visitor = await (await browser.newContext()).newPage();
    await visitor.goto(new URL('/a/' + slug, page.url()).href);
    await visitor.locator('html[data-kd-session]').waitFor({ state: 'attached' });
    await expect(visitor.getByRole('heading', { level: 1 })).toHaveText(name);
    await expect(visitor.getByRole('link', { name: 'Chỉnh hồ sơ' })).toHaveCount(0);
  });
});
