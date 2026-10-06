import { expect, test, type Page } from '@playwright/test';
import { expectOps, signInWith, watch } from '../checks.ts';

/*
 * The event page in Kính đêm (festfinder-web/src/kd/web/event): what the compiled screen's
 * tests in screens.spec.ts checked, on the rebuilt page, plus its own parts.
 */

const ATTENDEE = { identifier: 'minh@example.com', password: 'festfinder123' };
const ADMIN = { identifier: 'admin@feestfinder.com', password: 'festfinder-admin' };

/** Opens a page and waits until it has hydrated and read the session. */
async function open(page: Page, path: string) {
  const problems = watch(page);
  await page.goto(path);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  return problems;
}

test.describe('the event page', () => {
  test('arrives as HTML with its facts, FAQ, structured data and the other language', async ({ request }) => {
    const res = await request.get('/e/ravo');
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toMatch(/<title>Ravolution Music Festival[^<]*<\/title>/);
    expect(html).toMatch(/<link rel="canonical" href="http:\/\/localhost:\d+\/e\/ravo"/);
    expect(html).toMatch(/<link rel="alternate" hrefLang="en" href="http:\/\/localhost:\d+\/e\/ravo\?lang=en"/);
    expect(html).toMatch(/<meta property="og:image" content="http:\/\/localhost:\d+\/og\/v1\/edm\.png"/);
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    const types = blocks.flatMap((b) => (b['@graph'] ?? [b]).map((n: { '@type': string }) => n['@type']));
    for (const t of ['MusicEvent', 'FAQPage', 'WebPage', 'BreadcrumbList']) expect(types).toContain(t);
    // The real page, rendered on the server: the title, the answer first, the line-up, the tiers, the FAQ.
    expect(html).toMatch(/<h1[^>]*>Ravolution Music Festival<\/h1>[\s\S]*Ravolution Music Festival là sự kiện EDM[\s\S]*Hoaprox[\s\S]*Câu hỏi thường gặp[\s\S]*Vé thường/);
    expect(html).not.toContain('/ui/theme.css');
    expect((await request.get('/e/no-such-event')).status()).toBe(404);
    const en = await (await request.get('/e/ravo?lang=en')).text();
    expect(en).toMatch(/<link rel="canonical" href="http:\/\/localhost:\d+\/e\/ravo\?lang=en"/);
    expect(en).toContain('Frequently asked');
  });

  test('opens in Vietnamese with updates, hype goals, the FAQ, resale and the discussion', async ({ page }) => {
    const problems = await open(page, '/e/ravo');
    await expect(page.getByRole('heading', { level: 1, name: 'Ravolution Music Festival' })).toBeVisible();
    for (const text of [/Tin từ BTC/i, /Cổng số 3 mở sớm/, /Công bố nghệ sĩ bí mật/, /Câu hỏi thường gặp/i, /Đại sứ/i]) {
      await expect(page.getByText(text).first()).toBeVisible();
    }
    await expect(page.getByRole('heading', { name: /Thảo luận/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Hỏi đáp\s*3/ })).toHaveAttribute('aria-pressed', 'true');
    // Resale folds under the tickets.
    await page.locator('summary', { hasText: 'Pass vé' }).click();
    await expect(page.getByText('1.050.000₫').first()).toBeVisible();
    // Nothing of the compiled screens' look, even after the links on the page were prefetched.
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => [...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => l.getAttribute('href')).filter((h) => /theme\.css|screens_/.test(h ?? '')))).toEqual([]);
    expect(problems).toEqual([]);
  });

  test('opens in English at ?lang=en and keeps it in the address', async ({ page }) => {
    await open(page, '/e/ravo?lang=en');
    await expect(page.getByText('Frequently asked')).toBeVisible();
    await expect(page.getByRole('button', { name: /Questions\s*3/ })).toBeVisible();
    await expect(page).toHaveURL(/\/e\/ravo\?lang=en$/);
  });

  test('remembers English: a Vietnamese address moves to the English one, and back', async ({ page }) => {
    await open(page, '/e/ravo');
    await page.getByRole('link', { name: 'English' }).click();
    await expect(page).toHaveURL(/\/e\/ravo\?lang=en$/);
    await page.goto('/e/ravo');
    await expect(page).toHaveURL(/\/e\/ravo\?lang=en$/);
    await page.getByRole('link', { name: 'Tiếng Việt' }).click();
    await expect(page).toHaveURL(/\/e\/ravo$/);
    await expect(page.getByText('Câu hỏi thường gặp').first()).toBeVisible();
  });

  test('every ticket button goes through /go: a tier and a quantity to the checkout here', async ({ page }) => {
    await open(page, '/e/ravo');
    await page.getByRole('link', { name: /Chọn vé · từ 1\.200\.000₫/ }).click();
    await expect(page).toHaveURL(/#tickets$/);
    const tiers = page.getByRole('radiogroup', { name: 'Hạng vé' });
    await expect(tiers.getByRole('radio', { name: /Vé sớm/ })).toBeDisabled();
    await tiers.getByRole('radio', { name: /^VIP/ }).click();
    await page.getByRole('button', { name: 'Thêm một vé' }).click();
    const buy = page.getByRole('link', { name: /Mua 2 vé VIP · 4\.800\.000₫/ });
    const href = await buy.getAttribute('href');
    expect(href).toMatch(/^\/go\/ravo\?src=tier&tier=[0-9a-f-]{36}&qty=2$/);
    const hop = await page.request.get(href!, { maxRedirects: 0 });
    expect(hop.status()).toBe(302);
    expect(hop.headers().location).toMatch(/^\/app\/checkout\/ravo\?tier=[0-9a-f-]{36}&qty=2$/);
    await buy.click();
    await expect(page).toHaveURL(/\/app\/checkout\/ravo/);
  });

  test('a night sold elsewhere goes out to the seller through /go; a free night points the way', async ({ page }) => {
    await signInWith(page, ADMIN);
    const ev = await (await page.request.get('/events/nhacvien')).json();
    expect((await page.request.patch(`/admin/events/${ev.id}`, { data: { entryMode: 'paid', priceFrom: 250000, ticketUrl: 'https://tickets.example/nhacvien' } })).status()).toBe(200);
    await page.request.delete('/auth/session');
    await page.goto('/e/nhacvien');
    const buy = page.getByRole('link', { name: 'Mua vé', exact: true }).last();
    await expect(buy).toHaveAttribute('href', '/go/nhacvien?src=detail');
    const hop = await page.request.get('/go/nhacvien?src=detail', { maxRedirects: 0 });
    expect([hop.status(), hop.headers().location]).toEqual([302, 'https://tickets.example/nhacvien']);

    await open(page, '/e/outcast');
    await expect(page.getByRole('link', { name: 'Vào cửa miễn phí' })).toHaveAttribute('href', '#venue');
    await expect(page.getByRole('link', { name: 'Chỉ đường' }).last()).toHaveAttribute('href', 'https://www.google.com/maps/search/?api=1&query=10.8065%2C106.7411');
  });

  test('a line-up name opens the artist page', async ({ page, request }) => {
    const html = await (await request.get('/a/hoaprox')).text();
    expect(html).toMatch(/<link rel="canonical" href="http:\/\/localhost:\d+\/a\/hoaprox"/);
    await open(page, '/e/ravo');
    await page.getByRole('link', { name: /Hoaprox.*Headline/ }).click();
    await expect(page).toHaveURL(/\/a\/hoaprox$/);
    await expect(page.getByText('Ravolution Music Festival').first()).toBeVisible();
  });

  test('saving asks for sign-in, then saves and moves the count', async ({ page }) => {
    await open(page, '/e/ravo');
    await page.getByRole('button', { name: 'Lưu sự kiện' }).click();
    const sheet = page.getByRole('dialog', { name: 'Đăng nhập' });
    await expect(sheet.getByText('Đăng nhập để lưu sự kiện')).toBeVisible();
    await page.keyboard.press('Escape');
    await signInWith(page, ATTENDEE);
    await open(page, '/e/ravo');
    const count = async () => Number((await page.getByText(/quan tâm/i).first().innerText()).replace(/\D/g, ''));
    const before = await count();
    const save = page.getByRole('button', { name: /Lưu sự kiện|Đã lưu/ }).first();
    const was = (await save.getAttribute('aria-pressed')) === 'true';
    await save.click();
    await expect(save).toHaveAttribute('aria-pressed', was ? 'false' : 'true');
    await expect.poll(count).toBe(before + (was ? -1 : 1));
  });

  test('the share sheet saves a story image, makes a clip, and adds to a collection', async ({ page }) => {
    test.setTimeout(60_000);
    await signInWith(page, ATTENDEE);
    await open(page, '/e/ravo');
    await page.getByRole('button', { name: 'Chia sẻ' }).click();
    const sheet = page.getByRole('dialog', { name: 'Chia sẻ' });
    const image = page.waitForEvent('download');
    await sheet.getByRole('button', { name: 'Ảnh story' }).click();
    expect((await image).suggestedFilename()).toBe('ravo.png');

    const name = 'Cuối tuần ' + (Date.now() % 100000);
    await sheet.getByPlaceholder('Bộ sưu tập mới').fill(name);
    await sheet.getByRole('button', { name: 'Tạo' }).click();
    await expect(page.getByText('Đã thêm vào ' + name)).toBeVisible();
    const mine = await (await page.request.get('/me/collections?event=' + (await (await page.request.get('/events/ravo')).json()).id)).json();
    expect(mine.items.find((c: { name: string; has: boolean }) => c.name === name)?.has).toBe(true);

    const clip = page.waitForEvent('download', { timeout: 30_000 });
    await sheet.getByRole('button', { name: 'Video ngắn' }).click();
    await expect(page.getByText('Đang tạo video…')).toBeVisible();
    expect((await clip).suggestedFilename()).toMatch(/^ravo\.(mp4|webm)$/);
  });

  test('a signed-in attendee posts a question', async ({ page }) => {
    await signInWith(page, ATTENDEE);
    await open(page, '/e/ravo');
    const box = page.getByRole('textbox', { name: 'Viết gì đó…' });
    await box.fill('Có tủ gửi đồ cho balo không ạ?');
    await page.getByRole('button', { name: 'Đăng', exact: true }).click();
    await expect(page.getByText('Có tủ gửi đồ cho balo không ạ?').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Hỏi đáp\s*4/ })).toBeVisible();
  });

  test('picks sets into a plan from the stage timeline, and flags a clash', async ({ page }) => {
    await signInWith(page, ATTENDEE);
    // The demo attendee already has a plan: start from none.
    const ev = await (await page.request.get('/events/ravo')).json();
    await page.request.patch(`/me/plan/events/${ev.id}`, { data: { clear: true } });
    await open(page, '/e/ravo');
    await page.locator('summary', { hasText: 'Lịch theo sân khấu' }).click();
    await page.getByRole('button', { name: /^Thêm Alan Walker vào lịch/ }).click();
    await page.getByRole('button', { name: /^Thêm Triple D vào lịch/ }).click();
    await expect(page.getByText(/2 set trong lịch của bạn/)).toBeVisible();
    await expect(page.getByText(/Alan Walker và Triple D trùng nhau \d+ phút|Triple D và Alan Walker trùng nhau \d+ phút/)).toBeVisible();
    await page.getByRole('button', { name: 'Bỏ hết' }).click();
    await expect(page.getByText(/set trong lịch của bạn/)).toHaveCount(0);
  });

  test('signs up with Google, comes back to the page, and a new account picks a role', async ({ page }) => {
    await open(page, '/e/ravo');
    await page.getByRole('textbox', { name: 'Viết gì đó…' }).click();
    // The test API's Google stand-in answers at once; the real one asks which account.
    await page.getByRole('button', { name: 'Tiếp tục với Google' }).click();
    await expect(page.getByText(/Đã tạo tài khoản|Đã đăng nhập/).first()).toBeVisible();
    const back = new URL(page.url());
    expect(back.pathname + back.search, 'back where it started, with the sign-in result taken out').toBe('/e/ravo');
    const who = await (await page.request.get('/auth/session')).json();
    expect(who.user.signupMethod).toBe('google');

    await expect(page.getByRole('dialog', { name: 'Bạn đến với âm nhạc thế nào?' })).toBeVisible();
    await page.getByRole('button', { name: /Biểu diễn/ }).click();
    const name = `Night Owl ${Date.now() % 100000}`;
    await page.getByLabel('Nghệ danh').fill(name);
    await page.getByRole('button', { name: 'Tạo hồ sơ' }).click();
    await expect(page).toHaveURL(/\/ops\/artist/);
    const after = await (await page.request.get('/auth/session')).json();
    expect(after.user.role).toBe('user');
    expect(after.roles.artist).toBe('active');
    expect(after.artist.name).toBe(name);
    await expectOps(page, '/ops/artist', /Nghệ danh/);
    expect((await page.request.get('/admin/counts')).status()).toBe(403);
  });

  test('legacy screens open a rebuilt event page as a page of its own', async ({ page }) => {
    // A link on a compiled screen (/saved, until it is rebuilt) to an event: the rebuilt page
    // loads, not the old drawing of it.
    await signInWith(page, ATTENDEE);
    const ev = await (await page.request.get('/events/ravo')).json();
    await page.request.put('/me/saves/' + ev.id);
    await page.goto('/saved');
    await page.locator('#dc-root > .sc-host').waitFor({ state: 'attached' });
    await page.getByText('Ravolution Music Festival').first().click();
    await expect(page).toHaveURL(/\/e\/ravo/);
    await expect(page.getByRole('heading', { level: 1, name: 'Ravolution Music Festival' })).toBeVisible();
    expect(await page.evaluate(() => !!document.querySelector('#dc-root'))).toBe(false);
  });
});
