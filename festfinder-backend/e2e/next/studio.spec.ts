import { expect, test, type Page } from '@playwright/test';
import { signInWith, watch } from '../checks.ts';

/*
 * Studio in Kính đêm (festfinder-web/src/kd/studio): the organisers' back office. Signed in as
 * the demo organiser (Ravolution), whose next live event is the warm-up on 18.09.
 */

const ORGANIZER = { identifier: 'team@ravolution.vn', password: 'ravolution2026' };

/** A PNG header is all the upload checks read. */
const png = (w: number, h: number) => {
  const b = Buffer.alloc(64);
  b.writeUInt32BE(0x89504e47, 0); b.write('IHDR', 12, 'ascii'); b.writeUInt32BE(w, 16); b.writeUInt32BE(h, 20);
  return b;
};

async function open(page: Page, path: string) {
  const problems = watch(page);
  await page.goto(path);
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  return problems;
}

test('signed out, Studio asks to log in', async ({ page }) => {
  await open(page, '/studio');
  await expect(page.locator('[data-ff-gate]')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Đăng nhập để đăng và quản lý sự kiện' })).toBeVisible();
});

test.describe('Studio, signed in', () => {
  test.beforeEach(async ({ page }) => signInWith(page, ORGANIZER));

  test('the dashboard: the next live event, its numbers, and a row picks another', async ({ page }) => {
    const problems = await open(page, '/studio');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ravolution Warm-up · Rooftop');
    // FeestFinder sells no tickets: the numbers are views, saves and clicks on Mua vé.
    await expect(page.getByText('Lượt bấm mua vé', { exact: true })).toBeVisible();
    await expect(page.getByText('Đã bán', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'Bấm Mua vé mỗi ngày' })).toBeVisible();
    // The range asks for its own numbers.
    const asked = page.waitForRequest((r) => /\/performance\?range=30d/.test(r.url()));
    await page.getByRole('button', { name: '30 ngày' }).click();
    await asked;
    // A row picks the event for the whole page, and the address keeps it.
    await page.getByRole('table', { name: 'Sự kiện của bạn' }).getByRole('row', { name: /Ravolution Music Festival 19\.09/ }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ravolution Music Festival');
    await expect(page).toHaveURL(/\?event=/);
    // The title is a dropdown of every event.
    await page.getByRole('heading', { level: 1 }).getByRole('button').click();
    await page.getByRole('menuitemradio', { name: /Ravolution Warm-up/ }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ravolution Warm-up · Rooftop');
    // A draft continues in the wizard (other specs leave drafts of their own too).
    await expect(page.getByRole('link', { name: 'Tiếp tục' }).first()).toHaveAttribute('href', /\/studio\/new\?draft=/);
    expect(problems).toEqual([]);
  });

  test('the wizard: four steps, the draft saves itself, submit, then boost', async ({ page }) => {
    const problems = await open(page, '/studio/new');
    const title = `Đêm thử ${Date.now() % 100000}`;
    await expect(page.getByText('0 / 3 phần bắt buộc').first()).toBeVisible();
    await page.getByLabel('Tên sự kiện').fill(title);
    await page.getByRole('button', { name: 'EDM', exact: true }).click();
    await page.locator('input[type=file]').first().setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: png(400, 400) });
    await expect(page.getByRole('button', { name: 'Đổi · Logo' })).toBeVisible();
    // A cover is asked for before sending (design v2 phase 8).
    await page.locator('input[type=file]').nth(1).setInputFiles({ name: 'cover.png', mimeType: 'image/png', buffer: png(1600, 900) });
    await expect(page.getByRole('button', { name: 'Đổi · Ảnh bìa' })).toBeVisible();
    await page.getByLabel('Trang sự kiện').fill('https://example.com/dem-thu');
    await expect(page.getByRole('status').filter({ hasText: /Đã lưu/ })).toBeVisible();
    await expect(page).toHaveURL(/\?draft=/);
    await page.getByRole('button', { name: 'Tiếp tục' }).click();

    await page.getByLabel('Ngày', { exact: true }).fill('2026-10-10');
    await page.getByLabel('Mở cửa').fill('21:00');
    await page.getByLabel('Kết thúc', { exact: true }).fill('23:30');
    await page.getByRole('combobox', { name: 'Địa điểm' }).fill('Kho Số 9');
    await page.getByRole('button', { name: 'Tiếp tục' }).click();

    await page.getByLabel(/Giá từ/).fill('250000');
    await page.getByLabel('Link bán vé').fill('https://tickets.example.com/dem-thu');
    await page.getByRole('button', { name: 'Tiếp tục' }).click();

    await expect(page.getByText('Còn thiếu trước khi gửi')).toHaveCount(0);
    const send = page.getByRole('button', { name: 'Gửi duyệt', exact: true });
    await expect(send).toBeDisabled();
    // A primary that cannot act yet has no halo: the glow breathes only on one that can.
    const halo = (b: typeof send) => b.evaluate((el) => { const s = getComputedStyle(el, '::before'); return `${s.animationName} ${s.opacity}`; });
    expect(await halo(send)).toBe('none 0');
    await page.getByRole('checkbox').check();
    await expect(send).toBeEnabled();
    expect(await halo(send)).not.toMatch(/^none/);
    await send.click();
    await expect(page.getByText('Đã gửi duyệt')).toBeVisible();
    await expect(page.getByText('Nháp · tự lưu'), 'sent: no longer a draft').toHaveCount(0);
    const { items } = await (await page.request.get('/organizer/events')).json();
    const made = items.find((e: { title: string }) => e.title === title);
    expect(made.status).toBe('in_review');
    expect(made.priceFrom).toBe(250000);

    // "Đẩy tin" opens the advertising request on the event just sent.
    await page.getByRole('button', { name: 'Đẩy tin' }).click();
    await expect(page).toHaveURL(/\/studio\/ads\?event=/);
    await expect(page.getByRole('dialog', { name: 'Yêu cầu quảng cáo' }).getByLabel('Sự kiện')).toHaveValue(/.+/);
    expect(problems).toEqual([]);
  });

  test('the wizard: one tap for tonight, tomorrow or Saturday; a missing item leads to its field', async ({ page }) => {
    const problems = await open(page, '/studio/new');
    await page.getByLabel('Tên sự kiện').fill(`Đêm thử ${Date.now() % 100000}`);
    await page.getByRole('button', { name: 'EDM', exact: true }).click();
    await page.locator('input[type=file]').first().setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: png(400, 400) });
    await page.locator('input[type=file]').nth(1).setInputFiles({ name: 'cover.png', mimeType: 'image/png', buffer: png(1600, 900) });
    await page.getByLabel('Trang sự kiện').fill('https://example.com/dem-thu');
    await page.getByRole('button', { name: 'Tiếp tục' }).click();
    // The API's day in Hồ Chí Minh City, the wizard's first city.
    const now = new Date((await (await page.request.get('/auth/session?optional=1')).json()).time);
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(now);
    const plus = (n: number) => new Date(Date.parse(today + 'T00:00:00Z') + n * 86_400_000).toISOString().slice(0, 10);
    const date = page.getByLabel('Ngày', { exact: true });
    await page.getByRole('button', { name: 'Tối nay' }).click();
    await expect(date).toHaveValue(today);
    await expect(page.getByLabel('Mở cửa')).toHaveValue('22:00');
    await page.getByRole('button', { name: 'Ngày mai' }).click();
    await expect(date).toHaveValue(plus(1));
    await page.getByRole('button', { name: 'Thứ Bảy này' }).click();
    await expect(date).toHaveValue(plus(6 - new Date(today + 'T00:00:00Z').getUTCDay()));
    await expect(page.getByRole('button', { name: 'Thứ Bảy này' })).toHaveAttribute('aria-pressed', 'true');
    // No end time: the last step lists it, and its item lands on the date's field.
    await page.getByRole('combobox', { name: 'Địa điểm' }).fill('Kho Số 9');
    await page.getByRole('button', { name: 'Tiếp tục' }).click();
    await page.getByLabel(/Giá từ/).fill('250000');
    await page.getByLabel('Link bán vé').fill('https://tickets.example.com/dem-thu');
    await page.getByRole('button', { name: 'Tiếp tục' }).click();
    await page.getByRole('button', { name: 'Ngày, giờ mở cửa và kết thúc' }).click();
    await expect(date).toBeFocused();
    expect(problems).toEqual([]);
  });

  test('announcements: reach before sending, then it is listed', async ({ page }) => {
    await open(page, '/studio/announce');
    await page.getByRole('button', { name: /^Sẽ đi/ }).click();
    await expect(page.getByRole('status').filter({ hasText: /^Tới/ })).toBeVisible();
    await page.getByLabel('Tiêu đề').fill('Giờ mở cửa');
    await page.getByLabel('Nội dung').fill('Cổng mở lúc 19:00, nhớ mang vé.');
    await page.getByRole('button', { name: 'Gửi', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Đã gửi và đã hẹn' }).getByText('Giờ mở cửa')).toBeVisible();
  });

  test('the inbox: a thread and a reply; notifications; topics', async ({ page }) => {
    const problems = await open(page, '/studio/inbox');
    await page.getByRole('button', { name: /After Hours cần bổ sung hai thứ/ }).click();
    await page.getByRole('textbox', { name: 'Trả lời…' }).fill('Đã gửi ảnh và địa điểm');
    await page.getByRole('button', { name: 'Gửi', exact: true }).click();
    await expect(page.getByText('Đã gửi ảnh và địa điểm')).toBeVisible();
    await page.getByRole('tab', { name: 'Thông báo' }).click();
    await expect(page.getByRole('link', { name: /Tin bị trả lại/ })).toHaveAttribute('href', /\/studio\/inbox\?thread=/);
    await page.getByRole('tab', { name: 'Cài đặt' }).click();
    const bookings = page.getByRole('switch', { name: 'Booking' });
    const was = (await bookings.getAttribute('aria-checked')) === 'true';
    await bookings.click();
    await expect.poll(async () => (await (await page.request.get('/organizer/notification-preferences')).json()).topics.find((t: { key: string }) => t.key === 'bookings').enabled).toBe(!was);
    await expect(page.getByRole('switch', { name: 'Thanh toán' })).toHaveCount(0);
    expect(problems).toEqual([]);
  });

  test('gigs: post one and it is listed', async ({ page }) => {
    await open(page, '/studio/gigs');
    const title = `Slot Studio ${Date.now() % 100000}`;
    await page.getByLabel('Tiêu đề').fill(title);
    await page.getByLabel('Ngày diễn').fill('2027-04-10');
    await page.getByLabel(/Thù lao từ/).fill('2000000');
    await page.getByRole('button', { name: 'Đăng gig', exact: true }).click();
    await expect(page.getByText(title)).toBeVisible();
    await page.getByText(title).click();
    await expect(page.getByText('Chưa có hồ sơ')).toBeVisible();
  });

  test('"Mời nghệ sĩ" offers only artists who run their profile, who can read the request', async ({ page }) => {
    await open(page, '/studio/gigs');
    const pick = page.getByRole('combobox', { name: 'Nghệ sĩ' });
    await pick.fill('mie');
    await expect(page.getByRole('option', { name: /DJ Mie/ })).toHaveCount(0);
    await pick.fill('slim');
    await expect(page.getByRole('option', { name: /SlimV/ })).toBeVisible();
  });

  test('"Mời biểu diễn" on an artist’s page opens the booking request with that artist chosen', async ({ page }) => {
    // Not on a name nobody runs.
    await page.goto('/a/radar');
    await page.getByRole('list', { name: 'Danh sách nghệ sĩ' }).getByRole('listitem').first().getByRole('link').first().click();
    await expect(page.getByRole('button', { name: 'Đây là tôi' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Mời biểu diễn' })).toHaveCount(0);
    await page.goto('/a/slimv');
    const invite = page.getByRole('link', { name: 'Mời biểu diễn' });
    await invite.click();
    await expect(page).toHaveURL(/\/studio\/gigs\?invite=slimv$/);
    const form = page.locator('form').filter({ has: page.locator('#iqDate') });
    await expect(form.getByText('/a/slimv')).toBeVisible();
    await expect(page.locator('#iqDate')).toBeFocused();
    await page.locator('#iqDate').fill('2026-12-12');
    await page.getByLabel('Lời nhắn').fill('A closing set for our year-end night');
    await page.getByRole('button', { name: 'Gửi lời mời' }).click();
    await expect.poll(async () => ((await (await page.request.get('/organizer/inquiries')).json()).items as { eventOn: string; artist?: { slug: string } }[])
      .some((i) => i.artist?.slug === 'slimv' && i.eventOn === '2026-12-12')).toBe(true);
  });

  test('business details save', async ({ page }) => {
    await open(page, '/studio/profile');
    await page.getByLabel('Hotline').fill('1900 1234');
    await page.getByRole('region', { name: 'Doanh nghiệp và liên hệ' }).getByRole('button', { name: 'Lưu' }).click();
    await expect.poll(async () => (await (await page.request.get('/organizer/profile')).json()).hotline).toBe('1900 1234');
  });

  test('the calendar block: the two lines to embed and a preview (connecting a calendar left with Radar, 2026-11-04)', async ({ page }) => {
    await open(page, '/studio/profile');
    const block = page.getByRole('region', { name: 'Lịch' });
    await expect(block.getByLabel('Nhúng vào website')).toContainText('data-ff-org=');
    await block.getByRole('group', { name: 'Nền' }).getByRole('button', { name: 'Sáng' }).click();
    await expect(block.getByLabel('Nhúng vào website')).toContainText('data-ff-theme="light"');
    await block.getByRole('button', { name: 'Xem trước' }).click();
    await expect(block.locator('a[role="listitem"]').first()).toBeVisible();
    await expect(block.getByLabel('Địa chỉ lịch')).toHaveCount(0);
  });
});
