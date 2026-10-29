import { devices, expect, test, type Page } from '@playwright/test';
import { signInWith, watch } from '../checks.ts';

/*
 * The event page in Kính đêm (festfinder-web/src/kd/web/event): what the removed API
 * screen's tests checked, on the rebuilt page, plus its own parts.
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
    // No cover: logo pack v2's share picture.
    expect(html).toMatch(/<meta property="og:image" content="http:\/\/localhost:\d+\/ui\/assets\/og\.png"/);
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    const types = blocks.flatMap((b) => (b['@graph'] ?? [b]).map((n: { '@type': string }) => n['@type']));
    for (const t of ['MusicEvent', 'FAQPage', 'WebPage', 'BreadcrumbList']) expect(types).toContain(t);
    // The real page, rendered on the server: the title, the answer first, the line-up, the FAQ, and the way to the seller.
    expect(html).toMatch(/<h1[^>]*>Ravolution Music Festival<\/h1>[\s\S]*Ravolution Music Festival là sự kiện EDM[\s\S]*Hoaprox[\s\S]*Câu hỏi thường gặp/);
    expect(html).toContain('href="/go/ravo?src=detail"');
    expect(html).not.toContain('Hạng vé');
    expect(html).not.toContain('/ui/theme.css');
    expect((await request.get('/e/no-such-event')).status()).toBe(404);
    const en = await (await request.get('/e/ravo?lang=en')).text();
    expect(en).toMatch(/<link rel="canonical" href="http:\/\/localhost:\d+\/e\/ravo\?lang=en"/);
    expect(en).toContain('Frequently asked');
  });

  test('opens in Vietnamese with updates, hype goals, the FAQ and the discussion', async ({ page }) => {
    const problems = await open(page, '/e/ravo');
    await expect(page.getByRole('heading', { level: 1, name: 'Ravolution Music Festival' })).toBeVisible();
    // Bình luận and Hype are folded under "Thêm" (design v2 phase 12).
    await page.locator('summary', { hasText: /^Bình luận/ }).click();
    await page.locator('summary', { hasText: /^Hype/ }).click();
    for (const text of [/Tin từ BTC/i, /Cổng số 3 mở sớm/, /Công bố nghệ sĩ bí mật/, /Câu hỏi thường gặp/i, /Đại sứ/i]) {
      await expect(page.getByText(text).first()).toBeVisible();
    }
    // One stream of comments (owner, 2026-10-20): the organiser's answers, then everything, no tabs.
    await expect(page.getByRole('region', { name: 'Bình luận' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Câu hỏi\s*3/ })).toHaveCount(0);
    await expect(page.locator('#discussion').getByRole('textbox', { name: 'Viết bình luận…' })).toBeVisible();
    // FeestFinder sells no tickets: no resale under them.
    await expect(page.locator('summary', { hasText: 'Pass vé' })).toHaveCount(0);
    // Nothing of the Bảng phấn look (/ops's), even after the links on the page were prefetched.
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => [...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => l.getAttribute('href')).filter((h) => /theme\.css|screens_/.test(h ?? '')))).toEqual([]);
    expect(problems).toEqual([]);
  });

  test('opens in English at ?lang=en and keeps it in the address', async ({ page }) => {
    await open(page, '/e/ravo?lang=en');
    await page.locator('summary', { hasText: /^Comments/ }).click();
    await expect(page.getByText('Frequently asked')).toBeVisible();
    await expect(page.locator('#discussion').getByRole('textbox', { name: 'Write a comment…' })).toBeVisible();
    await expect(page).toHaveURL(/\/e\/ravo\?lang=en$/);
  });

  test('remembers English: a Vietnamese address moves to the English one, and back', async ({ page }) => {
    await open(page, '/e/ravo');
    // The footer's link (the bar's VI · EN does the same).
    await page.getByRole('contentinfo').getByRole('link', { name: 'English' }).click();
    await expect(page).toHaveURL(/\/e\/ravo\?lang=en$/);
    await page.goto('/e/ravo');
    await expect(page).toHaveURL(/\/e\/ravo\?lang=en$/);
    await page.getByRole('contentinfo').getByRole('link', { name: 'Tiếng Việt' }).click();
    await expect(page).toHaveURL(/\/e\/ravo$/);
    await expect(page.getByRole('heading', { level: 2, name: 'Thêm' })).toBeVisible();
  });

  test('every ticket button goes through /go to the seller: FeestFinder sells no tickets', async ({ page }) => {
    await open(page, '/e/ravo');
    await page.getByRole('link', { name: 'Mua vé', exact: true }).first().click();
    await expect(page).toHaveURL(/#tickets$/);
    const panel = page.locator('#tickets');
    await expect(panel.getByText('từ 1.200.000₫')).toBeVisible();
    await expect(panel.getByRole('radiogroup')).toHaveCount(0);
    await expect(panel.getByText('Bán ở ticketbox.vn. FeestFinder không bán vé.')).toBeVisible();
    const buy = panel.getByRole('link', { name: /^Mua vé/ });
    await expect(buy).toHaveAttribute('href', '/go/ravo?src=detail');
    const hop = await page.request.get('/go/ravo?src=detail', { maxRedirects: 0 });
    expect(hop.status()).toBe(302);
    expect(hop.headers().location).toMatch(/^https:\/\/ticketbox\.vn\/ravolution-2026\?utm_source=feestfinder&utm_medium=referral&utm_campaign=ravo&utm_content=detail$/);
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
    expect([hop.status(), hop.headers().location]).toEqual([302, 'https://tickets.example/nhacvien?utm_source=feestfinder&utm_medium=referral&utm_campaign=nhacvien&utm_content=detail']);

    await open(page, '/e/outcast');
    await expect(page.getByRole('link', { name: 'Vào cửa miễn phí' })).toHaveAttribute('href', '#venue');
    await expect(page.getByRole('link', { name: 'Chỉ đường' }).last()).toHaveAttribute('href', 'https://www.google.com/maps/dir/?api=1&destination=10.8065%2C106.7411');
  });

  test('a line-up name opens the artist page', async ({ page, request }) => {
    const html = await (await request.get('/a/hoaprox')).text();
    expect(html).toMatch(/<link rel="canonical" href="http:\/\/localhost:\d+\/a\/hoaprox"/);
    await open(page, '/e/ravo');
    await page.getByRole('link', { name: /Hoaprox.*Headline/ }).click();
    await expect(page).toHaveURL(/\/a\/hoaprox$/);
    await expect(page.getByText('Ravolution Music Festival').first()).toBeVisible();
  });

  // Before signing in a heart saves on the device (e2e/next/newcomer.spec.ts).
  test('a signed-in heart saves to the account and moves the count', async ({ page }) => {
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

  test('comments like a feed: post, reply to a reply with @name, like, edit, delete', async ({ page }) => {
    await signInWith(page, ATTENDEE);
    await open(page, '/e/ravo');
    await page.locator('summary', { hasText: /^Bình luận/ }).click();
    const box = page.locator('#discussion').getByRole('textbox', { name: 'Viết bình luận…' });
    await box.fill('Có tủ gửi đồ cho balo không ạ?');
    await page.getByRole('button', { name: 'Đăng', exact: true }).click();
    const mine = page.locator('#discussion article', { hasText: 'Có tủ gửi đồ cho balo không ạ?' }).first();
    await expect(mine).toBeVisible();
    // Reply to it, then reply to that reply: the second one stays in the thread and names whom it answers.
    await mine.getByRole('button', { name: 'Trả lời' }).click();
    const author = (await mine.locator('.kd-hs').first().innerText()).trim();
    await page.getByRole('textbox', { name: `Trả lời ${author}…` }).fill('Mình cũng muốn biết');
    await page.locator('form', { has: page.getByRole('textbox', { name: `Trả lời ${author}…` }) }).getByRole('button', { name: 'Trả lời', exact: true }).click();
    const reply = page.locator('#discussion article', { hasText: 'Mình cũng muốn biết' });
    await expect(reply).toBeVisible();
    await reply.getByRole('button', { name: 'Trả lời' }).click();
    await page.getByRole('textbox', { name: `Trả lời ${author}…` }).fill('Cảm ơn nhé');
    await page.locator('form', { has: page.getByRole('textbox', { name: `Trả lời ${author}…` }) }).getByRole('button', { name: 'Trả lời', exact: true }).click();
    await expect(page.locator('#discussion article', { hasText: 'Cảm ơn nhé' })).toContainText('@' + author);
    // Edit within 15 minutes, then delete.
    await mine.getByRole('button', { name: 'Sửa' }).click();
    const editing = page.locator('#discussion form', { has: page.getByRole('textbox', { name: 'Sửa' }) });
    await editing.getByRole('textbox', { name: 'Sửa' }).fill('Có tủ gửi đồ không ạ?');
    await editing.getByRole('button', { name: 'Lưu' }).click();
    const edited = page.locator('#discussion article', { hasText: 'Có tủ gửi đồ không ạ?' }).first();
    await expect(edited).toContainText('đã sửa');
    await edited.getByRole('button', { name: 'Xoá' }).click();
    await expect(page.locator('#discussion').getByText('Có tủ gửi đồ không ạ?')).toHaveCount(0);
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
    await page.locator('summary', { hasText: /^Bình luận/ }).click();
    await page.locator('#discussion').getByRole('textbox', { name: 'Viết bình luận…' }).click();
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
    await expect(page).toHaveURL(/\/studio\/artist$/);
    const after = await (await page.request.get('/auth/session')).json();
    expect(after.user.role).toBe('user');
    expect(after.roles.artist).toBe('active');
    expect(after.artist.name).toBe(name);
    await expect(page.getByLabel('Nghệ danh')).toHaveValue(name);
    expect((await page.request.get('/admin/counts')).status()).toBe(403);
  });
});

test.describe('the ride button', () => {
  test('on a computer, the sheet shows a QR code that opens it on the phone', async ({ page }) => {
    const problems = await open(page, '/e/ravo');
    await page.getByRole('button', { name: 'Đặt xe', exact: true }).first().click();
    const sheet = page.getByRole('dialog', { name: 'Đặt xe tới đây' });
    await expect(sheet.getByRole('img', { name: 'Mã QR mở sự kiện này trên điện thoại' })).toBeVisible();
    await expect(sheet.getByText(/^Tới SECC/)).toBeVisible();
    expect(problems).toEqual([]);
  });
});

// A phone's size, touch and Android user agent; the browser stays the configured one.
const { defaultBrowserType: _browser, ...PIXEL } = devices['Pixel 7'];

test.describe('the ride button on an Android phone', () => {
  test.use(PIXEL);

  test('lists Grab, Be and Green SM for a night in Vietnam, and opens with ?ride=1', async ({ page }) => {
    await open(page, '/app/e/ravo?ride=1');
    const sheet = page.getByRole('dialog', { name: 'Đặt xe tới đây' });
    await expect(sheet.locator('li button .kd-h')).toHaveText(['Grab', 'Be', 'Green SM']);
    // The links themselves come from the API: the app by its package, the Play Store when it is missing.
    const rides = (await (await page.request.get('/events/ravo')).json()).rides;
    expect(rides[0].android).toMatch(/^intent:\/\/open\?screenType=BOOKING#Intent;scheme=grab;package=com\.grabtaxi\.passenger;/);
  });
});

test('back from the group plan returns to the web event page it came from, not the app’s', async ({ page }) => {
  await signInWith(page, ATTENDEE);
  await page.goto('/e/ravo');
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  await page.evaluate(() => location.assign('/app/plan/ravo'));
  await expect(page).toHaveURL(/\/app\/plan\/ravo/);
  await page.getByRole('link', { name: 'Quay lại' }).first().click();
  await expect(page).toHaveURL(/\/e\/ravo$/);
});

test.describe('"Thêm" opening on a slow phone', () => {
  /** The live nights nobody has asked about yet (no comment, no organiser answer), first one first. */
  async function quiet(page: Page): Promise<{ id: string; slug: string }[]> {
    const { items } = await (await page.request.get('/events?time=all&upcoming=true&limit=60')).json() as { items: { slug: string }[] };
    const out: { id: string; slug: string }[] = [];
    for (const { slug } of items) {
      const ev = await (await page.request.get('/events/' + slug)).json();
      if (!ev.past && ev.discussion && ev.discussion.total === 0 && !ev.faq.length) out.push({ id: ev.id, slug });
    }
    return out;
  }

  test('"Bình luận" with nothing asked opens without moving what follows it', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const [ev] = await quiet(page);
    expect(ev, 'a live night nobody asked about').toBeTruthy();
    await open(page, '/e/' + ev.slug);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      const w = window as unknown as { __shifts: number };
      w.__shifts = 0;
      new PerformanceObserver((list) => {
        for (const e of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) if (!e.hadRecentInput) w.__shifts += e.value;
      }).observe({ type: 'layout-shift' });
    });
    // The section's code and the thread both arrive well after the tap.
    const late = async (route: import('@playwright/test').Route) => { await new Promise((r) => setTimeout(r, 800)); await route.continue(); };
    await page.route('**/_next/static/chunks/**', late);
    await page.route((u) => u.pathname.endsWith('/discussion'), late);
    const footer = page.locator('footer').first();
    await page.locator('summary', { hasText: /^Bình luận/ }).click();
    // At the tap the row takes the height of what it will show, before its code is in, and keeps it.
    await page.waitForTimeout(150);
    const atTap = (await footer.boundingBox())!.y;
    await expect(page.getByRole('button', { name: 'Viết bình luận' })).toBeVisible();
    await page.waitForTimeout(2000);
    expect(await page.evaluate(() => (window as unknown as { __shifts: number }).__shifts)).toBeLessThanOrEqual(0.01);
    expect((await footer.boundingBox())!.y).toBe(atTap);
  });

  test("a comment's photo sits in a box of its own size, from before it loads", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await signInWith(page, ATTENDEE);
    const [, ev] = await quiet(page);
    expect(ev, 'a second live night nobody asked about').toBeTruthy();
    const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
    const up = await page.request.post('/uploads?purpose=recap', { multipart: { file: { name: 'night.png', mimeType: 'image/png', buffer: PNG } } });
    expect(up.ok(), 'upload').toBeTruthy();
    const posted = await page.request.post(`/events/${ev.id}/posts`, { data: { kind: 'talk', body: 'Ảnh tối qua', photoUrl: (await up.json()).url } });
    expect(posted.ok(), 'post').toBeTruthy();
    const postId = (await posted.json()).post.id as string;
    try {
      // The photo takes its time: its box is already there, at its final height.
      await page.route((u) => u.pathname.startsWith('/files/recap/'), async (route) => { await new Promise((r) => setTimeout(r, 1500)); await route.continue(); });
      await open(page, '/e/' + ev.slug);
      await page.locator('summary', { hasText: /^Bình luận/ }).click();
      const box = page.locator('[data-post-photo]').first();
      await expect(box).toBeVisible();
      const early = (await box.boundingBox())!.height;
      expect(early).toBeGreaterThan(100);
      await expect(box.locator('img')).toHaveAttribute('referrerpolicy', 'no-referrer');
      await box.locator('img').evaluate((img: HTMLImageElement) => img.decode());
      expect((await box.boundingBox())!.height).toBe(early);
    } finally {
      if (postId) await page.request.delete('/posts/' + postId);
    }
  });
});
