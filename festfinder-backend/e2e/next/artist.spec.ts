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
    // The directory is rebuilt too.
    expect(await (await request.get('/a')).text()).not.toContain('/ui/theme.css');
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

  test('following an artist who runs their profile asks for sign-in, then follows and moves the count', async ({ page }) => {
    await open(page, '/a/slimv');
    await page.getByRole('button', { name: 'Theo dõi', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Đăng nhập' })).toBeVisible();
    await page.keyboard.press('Escape');

    await signInWith(page, ATTENDEE);
    await page.request.delete('/me/follows/artists/slimv');
    await open(page, '/a/slimv');
    const followers = page.locator('.kd-stat').filter({ hasText: 'Người theo dõi' }).locator('.kd-v');
    const n = async () => Number((await followers.innerText()).replace(/\D/g, ''));
    await expect(page.getByRole('button', { name: 'Theo dõi', exact: true })).toHaveAttribute('aria-pressed', 'false');
    // The count is read once the page's own answer is in (the button waits for it too).
    await expect(page.getByRole('button', { name: 'Theo dõi', exact: true })).toBeEnabled();
    const before = await n();
    await page.getByRole('button', { name: 'Theo dõi', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Đang theo dõi' })).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(n).toBe(before + 1);
    await expect.poll(async () => (await (await page.request.get('/artists/slimv')).json()).artist.following).toBe(true);
    await page.getByRole('button', { name: 'Đang theo dõi' }).click();
    await expect.poll(n).toBe(before);
  });

  test('a profile nobody runs: "Đây là tôi" to claim it, "Nhắc khi có show" instead of following', async ({ page }) => {
    const problems = await open(page, '/a/hoaprox');
    await expect(page.getByText('Chưa có người quản lý', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Theo dõi', exact: true })).toHaveCount(0);
    await expect(page.locator('.kd-stat').filter({ hasText: 'Người theo dõi' })).toHaveCount(0);
    await expect(page.getByRole('navigation', { name: 'Đường dẫn' }).getByRole('link', { name: 'Nghệ sĩ', exact: true })).toHaveAttribute('href', '/a');
    await page.getByRole('button', { name: 'Đây là tôi' }).click();
    await expect(page.getByRole('dialog', { name: 'Đăng nhập' })).toBeVisible();
    await page.keyboard.press('Escape');

    await signInWith(page, ATTENDEE);
    await open(page, '/a/hoaprox');
    await page.getByRole('button', { name: 'Nhắc khi có show' }).click();
    await expect(page.getByRole('button', { name: 'Sẽ nhắc bạn' })).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(async () => (await (await page.request.get('/me/alert')).json()).artists).toContain('Hoaprox');
    await page.getByRole('button', { name: 'Sẽ nhắc bạn' }).click();
    await expect.poll(async () => (await (await page.request.get('/me/alert')).json()).artists).not.toContain('Hoaprox');
    expect(problems).toEqual([]);
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
    await expect(page.getByRole('link', { name: 'Chỉnh hồ sơ' })).toHaveAttribute('href', '/studio/artist');
    await expect(page.getByRole('button', { name: 'Theo dõi', exact: true }), 'nobody follows their own page').toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Đây là tôi' })).toHaveCount(0);

    // Anyone else sees no edit link.
    const visitor = await (await browser.newContext()).newPage();
    await visitor.goto(new URL('/a/' + slug, page.url()).href);
    await visitor.locator('html[data-kd-session]').waitFor({ state: 'attached' });
    await expect(visitor.getByRole('heading', { level: 1 })).toHaveText(name);
    await expect(visitor.getByRole('link', { name: 'Chỉnh hồ sơ' })).toHaveCount(0);
  });
});

test.describe('mixes on the artist page', () => {
  const ADMIN = { identifier: 'admin@feestfinder.com', password: 'festfinder-admin' };

  test('a mix plays only when asked, in its service’s own player; a like asks a stranger to log in', async ({ page, request }) => {
    // The team adds a set to a profile nobody runs (the test API reads services from a fake network).
    expect((await request.post('/auth/login', { data: ADMIN })).ok()).toBeTruthy();
    const id = (await (await request.get('/artists/wukong')).json()).artist.id;
    const added = await request.post(`/admin/artists/${id}/mixes`, { data: { url: 'https://soundcloud.com/wukong/warehouse-set' } });
    expect(added.status(), await added.text()).toBe(201);

    const problems = await open(page, '/a/wukong');
    const listen = page.getByRole('region', { name: 'Nghe' });
    await expect(listen).toBeVisible();
    await expect(listen.locator('iframe'), 'nothing from SoundCloud loads before play').toHaveCount(0);
    await listen.getByRole('button', { name: /^Phát / }).click();
    await expect(listen.locator('iframe')).toHaveAttribute('src', /^https:\/\/w\.soundcloud\.com\/player\/\?url=https%3A%2F%2Fapi\.soundcloud\.com%2F.*auto_play=true/);
    await listen.getByRole('button', { name: /Thích/ }).click();
    await expect(page.getByText('Đăng nhập để thích mix')).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('a fan likes a mix and opens its comments', async ({ page }) => {
    await signInWith(page, ATTENDEE);
    await open(page, '/a/wukong');
    const listen = page.getByRole('region', { name: 'Nghe' });
    // "0 Thích", then "1 Đã thích" once pressed.
    const like = listen.getByRole('button', { name: /thích/i }).first();
    await like.click();
    await expect(like).toHaveAttribute('aria-pressed', 'true');
    await listen.getByRole('button', { name: /Bình luận/ }).first().click();
    const sheet = page.getByRole('dialog', { name: /Bình luận · / });
    await expect(sheet.getByText('Chưa có bình luận')).toBeVisible();
    await sheet.getByRole('textbox', { name: 'Viết bình luận' }).fill('Đoạn drop này đỉnh quá');
    await sheet.getByRole('textbox', { name: 'Tại' }).fill('45:30');
    await sheet.getByRole('button', { name: 'Đăng' }).click();
    await expect(sheet.getByText('Đoạn drop này đỉnh quá')).toBeVisible();
    await expect(sheet.getByText('Tại 45:30')).toBeVisible();
  });
});
