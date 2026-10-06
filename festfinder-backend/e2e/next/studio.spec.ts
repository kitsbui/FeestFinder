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

async function eventId(page: Page, title: string): Promise<string> {
  const { items } = await (await page.request.get('/organizer/events')).json();
  return items.find((e: { title: string }) => e.title === title).id;
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
    await expect(page.getByText('Đã bán', { exact: true })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Nhịp bán' })).toBeVisible();
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
    // A draft continues in the wizard.
    await expect(page.getByRole('link', { name: 'Tiếp tục' })).toHaveAttribute('href', /\/studio\/new\?draft=/);
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
    await page.getByRole('checkbox').check();
    await send.click();
    await expect(page.getByText('Đã gửi duyệt')).toBeVisible();
    const { items } = await (await page.request.get('/organizer/events')).json();
    const made = items.find((e: { title: string }) => e.title === title);
    expect(made.status).toBe('in_review');
    expect(made.priceFrom).toBe(250000);

    await page.getByRole('button', { name: 'Đẩy tin' }).click();
    await expect(page.getByText('Đã gửi yêu cầu đẩy tin', { exact: true })).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('check-in: valid, then already used, then not a ticket', async ({ page }) => {
    const id = await eventId(page, 'Ravolution Warm-up · Rooftop');
    const { items } = await (await page.request.get(`/organizer/events/${id}/attendees?filter=out&limit=1`)).json();
    const problems = await open(page, '/studio/door?event=' + id);
    const code = page.getByRole('textbox', { name: 'Mã vé' });
    await code.fill(items[0].ticketCode);
    await page.getByRole('button', { name: 'Kiểm tra' }).click();
    await expect(page.getByText('Hợp lệ', { exact: true })).toBeVisible();
    await code.fill(items[0].ticketCode);
    await page.getByRole('button', { name: 'Kiểm tra' }).click();
    await expect(page.getByText('Đã dùng', { exact: true })).toBeVisible();
    await code.fill('NOPE-0000');
    await page.getByRole('button', { name: 'Kiểm tra' }).click();
    await expect(page.getByText('Không hợp lệ', { exact: true })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Vừa quét' }).getByText(items[0].name).first()).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('attendees: counts, filters and the CSV', async ({ page }) => {
    const problems = await open(page, '/studio/attendees');
    await expect(page.getByText('Vé đã phát')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Tải CSV' })).toHaveAttribute('href', /attendees\.csv$/);
    await page.getByRole('button', { name: /^Hoàn tiền/ }).click();
    await expect(page.getByRole('button', { name: /^Hoàn tiền/ })).toHaveAttribute('aria-pressed', 'true');
    expect(problems).toEqual([]);
  });

  test('promos and guests: a new code, a new guest', async ({ page }) => {
    await open(page, '/studio/promos');
    await page.getByLabel('Mã', { exact: true }).fill('STUDIO10');
    await page.getByLabel('Giảm (%)').fill('10');
    await page.getByRole('button', { name: 'Tạo mã' }).click();
    await expect(page.getByText('STUDIO10', { exact: true })).toBeVisible();
    await page.getByLabel('Tên khách').fill('Khách Studio');
    await page.getByRole('button', { name: 'Thêm khách' }).click();
    await expect(page.getByText('Khách Studio', { exact: true })).toBeVisible();
  });

  test('announcements: reach before sending, then it is listed', async ({ page }) => {
    await open(page, '/studio/announce');
    await page.getByRole('button', { name: /^Đã mua vé/ }).click();
    await expect(page.getByRole('status').filter({ hasText: /^Tới/ })).toBeVisible();
    await page.getByLabel('Tiêu đề').fill('Giờ mở cửa');
    await page.getByLabel('Nội dung').fill('Cổng mở lúc 19:00, nhớ mang vé.');
    await page.getByRole('button', { name: 'Gửi', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Đã gửi và đã hẹn' }).getByText('Giờ mở cửa')).toBeVisible();
  });

  test('revenue: what it made, the payouts and the account', async ({ page }) => {
    const problems = await open(page, '/studio/revenue');
    await expect(page.getByText('Thực nhận').first()).toBeVisible();
    await expect(page.getByText('Tạm ứng 50%', { exact: true })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Tài khoản nhận tiền' }).getByText('Vietcombank')).toBeVisible();
    expect(problems).toEqual([]);
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
    const payouts = page.getByRole('switch', { name: 'Thanh toán' });
    const was = (await payouts.getAttribute('aria-checked')) === 'true';
    await payouts.click();
    await expect.poll(async () => (await (await page.request.get('/organizer/notification-preferences')).json()).topics.find((t: { key: string }) => t.key === 'payouts').enabled).toBe(!was);
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

  test('business details save', async ({ page }) => {
    await open(page, '/studio/profile');
    await page.getByLabel('Hotline').fill('1900 1234');
    await page.getByRole('region', { name: 'Doanh nghiệp và liên hệ' }).getByRole('button', { name: 'Lưu' }).click();
    await expect.poll(async () => (await (await page.request.get('/organizer/profile')).json()).hotline).toBe('1900 1234');
  });
});
