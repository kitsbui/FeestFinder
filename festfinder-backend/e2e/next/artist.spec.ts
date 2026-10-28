import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { signInWith, watch } from '../checks.ts';

/*
 * The artist page in Kính đêm (festfinder-web/src/kd/web/artist), one column since 2026-10-20:
 * the hero, the shows to come, everything about them, their music (the MP3 playlist, then the
 * mixes) and the moments last.
 */

const ATTENDEE = { identifier: 'minh@example.com', password: 'festfinder123' };

async function newAccount(page: Page, email: string) {
  const start = await (await page.request.post('/auth/otp/start', { data: { channel: 'email', identifier: email } })).json();
  // The code alone signs the new account in (phase 17), on this browser's cookies.
  const verify = await page.request.post('/auth/otp/verify', { data: { challengeId: start.challengeId, code: start.devCode } });
  expect(verify.ok(), 'sign up as ' + email).toBeTruthy();
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
    await expect(page.getByRole('heading', { name: 'Upcoming', level: 2 })).toBeVisible();
    await expect(page.getByRole('complementary'), 'no side column').toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Ravolution Music Festival' })).toHaveAttribute('href', '/e/ravo?lang=en');
    await expect(page.getByRole('link', { name: /Ravolution Entertainment/ })).toHaveAttribute('href', '/o/ravoent?lang=en');
    expect(problems).toEqual([]);
  });

  test('the next show buys through /go, and "Đã diễn" lists where they played', async ({ page }) => {
    await open(page, '/a/hoaprox');
    // The shows to come first, then who they are.
    const order = await page.getByRole('heading', { level: 2 }).allInnerTexts();
    expect(order.indexOf('Sắp diễn')).toBeLessThan(order.indexOf('Giới thiệu'));
    const buy = page.getByRole('region', { name: 'Sắp diễn' }).getByRole('link', { name: 'Mua vé' }).first();
    await expect(buy).toHaveAttribute('href', '/go/ravo?src=artist');
    await page.locator('#played summary').click();
    await expect(page.locator('#played').getByRole('link', { name: /Ravolution Music Festival 2025/ })).toBeVisible();
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
    // The bio, links and booking details are all under "Giới thiệu", open on the page.
    const about = page.getByRole('region', { name: 'Giới thiệu' });
    await expect(about.getByText('DJ ở Sài Gòn, chơi melodic techno.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Spotify' })).toHaveAttribute('href', 'https://open.spotify.com/artist/abc123');
    await expect(page.getByText('Đang nhận booking').first()).toBeVisible();
    await about.getByText('Lịch', { exact: true }).click();
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

  test('without a cover, their photo is the page’s main picture: fetched first, never lazily', async ({ page }) => {
    await newAccount(page, `photo${Date.now() % 1_000_000}@example.com`);
    expect((await page.request.post('/me/roles/artist', { data: { stageName: `Photo Owl ${Date.now() % 100000}`, roles: ['dj'] } })).ok()).toBeTruthy();
    const slug = (await (await page.request.get('/auth/session')).json()).artist.slug;
    // A link (the test API reads every https link as a picture).
    const photo = `https://img.example/photo-${slug}.png`;
    expect((await page.request.patch('/me/artist', { data: { imageUrl: photo } })).status()).toBe(200);
    const html = await (await page.request.get('/a/' + slug)).text();
    const high = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]).filter((t) => /\bfetchpriority="high"/i.test(t));
    expect(high, 'one picture first').toHaveLength(1);
    // A copy its size (kd/img.ts): 128px on a phone, 192px from 760px.
    const key = Buffer.from(photo).toString('base64url');
    expect(high[0]).toMatch(new RegExp(`src="/img/\\d+x\\d+/${key}\\.webp"`));
    expect(high[0]).toContain('sizes="(min-width: 760px) 192px, 128px"');
    expect(high[0]).not.toContain('loading="lazy"');
    // React preloads the same copies in the head.
    const head = html.slice(0, html.indexOf('</head>'));
    expect([...head.matchAll(/<link\b[^>]*>/g)].some(([t]) => /\brel="preload"/.test(t) && /\bas="image"/.test(t) && /\simagesrcset="[^"]*\/img\/192x192\//i.test(t) && t.includes(key))).toBe(true);
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
    // Without a playlist, the hero's "Phát" leads to the mixes under "Nghe".
    await page.getByRole('link', { name: 'Phát', exact: true }).click();
    await expect(page).toHaveURL(/#mix$/);
    const listen = page.getByRole('region', { name: 'Nghe' });
    await expect(listen).toBeVisible();
    await expect(listen.locator('iframe'), 'nothing from SoundCloud loads before play').toHaveCount(0);
    await listen.getByRole('button', { name: /Phát$/ }).click();
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

test.describe('the MP3 playlist on the artist page', () => {
  test('plays in its own waveform player, from the hero’s "Phát", track after track', async ({ page }) => {
    await newAccount(page, `waves${Date.now() % 1_000_000}@example.com`);
    const name = `Wave Rider ${Date.now() % 100000}`;
    expect((await page.request.post('/me/roles/artist', { data: { stageName: name, roles: ['dj'] } })).ok()).toBeTruthy();
    const slug = (await (await page.request.get('/auth/session')).json()).artist.slug;
    // The test API measures every link from a fixture; the browser is given the same file.
    for (const [i, title] of ['Sunrise', 'Night Drive'].entries()) {
      const added = await page.request.post('/me/artist/tracks', { data: { url: `https://cdn.example.com/${slug}-${i}.mp3`, title } });
      expect(added.status(), await added.text()).toBe(201);
    }
    const mp3 = await readFile(new URL('../../test/fixtures/audio/tone.mp3', import.meta.url));
    await page.route('https://cdn.example.com/**', (r) => r.fulfill({ body: mp3, contentType: 'audio/mpeg' }));

    const problems = await open(page, '/a/' + slug);
    const list = page.getByRole('region', { name: 'Playlist' });
    await expect(list.getByRole('button', { name: /Sunrise/ })).toHaveAttribute('aria-current', 'true');
    await expect(list.getByRole('button', { name: /Night Drive/ })).toContainText('0:02');
    await page.getByRole('button', { name: 'Phát', exact: true }).first().click();
    await expect(list.getByRole('button', { name: 'Tạm dừng' })).toBeVisible();
    await list.getByRole('button', { name: 'Bài sau' }).click();
    await expect(list.getByRole('button', { name: /Night Drive/ })).toHaveAttribute('aria-current', 'true');
    // The moments come after the music.
    const order = await page.getByRole('heading', { level: 2 }).allInnerTexts();
    expect(order.indexOf('Giới thiệu')).toBeLessThan(order.indexOf('Nghe'));
    expect(problems).toEqual([]);
  });
});
