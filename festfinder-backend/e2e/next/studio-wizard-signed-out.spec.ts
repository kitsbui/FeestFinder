import { expect, test } from '@playwright/test';
import { watch } from '../checks.ts';

/*
 * The Studio wizard before signing in (festfinder-web/src/kd/studio/wizard.tsx): the form is filled
 * on this device, a picture chosen before signing in is kept through a reload, the account is made
 * by email, the organiser by the role picker, and the submit is sent once, on its own, with the
 * cover kept.
 */

/** A PNG header is all the upload checks read. */
const png = (w: number, h: number) => {
  const b = Buffer.alloc(64);
  b.writeUInt32BE(0x89504e47, 0); b.write('IHDR', 12, 'ascii'); b.writeUInt32BE(w, 16); b.writeUInt32BE(h, 20);
  return b;
};

test('signed out: fill, sign in, organiser, send; the logo and cover are kept', async ({ page }) => {
  const problems = watch(page);
  const stamp = Date.now();
  const title = `Đêm khách ${stamp % 100000}`;
  await page.goto('/studio/new');
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });

  // A logo asks for a sign-in first; the picture is chosen again once signed in.
  await page.getByRole('button', { name: 'Tải lên · Logo' }).click();
  const sheet = page.getByRole('dialog', { name: 'Đăng nhập' });
  await expect(sheet).toBeVisible();
  await sheet.getByRole('button', { name: 'Tiếp tục với email' }).click();
  await sheet.getByLabel('Email').fill(`wizard.${stamp}@example.com`);
  await sheet.getByRole('button', { name: 'Gửi mã' }).click();
  const otp = page.getByRole('dialog', { name: 'Nhập mã xác minh' });
  const line = await otp.getByText(/Đã gửi qua email tới/).innerText();
  const code = /dev code (\d{6})/.exec(line)?.[1];
  expect(code, line).toBeTruthy();
  await otp.getByRole('textbox', { name: /Nhập mã xác minh/ }).fill(code!);
  await otp.getByRole('button', { name: 'Xác minh' }).click();
  await expect(otp).toBeHidden();

  // The logo, kept on this device through a reload (the form is still the device's copy).
  await page.locator('input[type=file]').nth(0).setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: png(512, 512) });
  await expect(page.getByRole('button', { name: 'Đổi · Logo' })).toBeVisible();
  await page.reload();
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  await expect(page.getByRole('button', { name: 'Đổi · Logo' })).toBeVisible();
  // The first-run question is not asked on the wizard.
  await expect(page.getByRole('dialog', { name: 'Bạn đến với âm nhạc thế nào?' })).toHaveCount(0);

  // Step 1: the basics.
  await page.getByLabel('Tên sự kiện').fill(title);
  await page.getByRole('button', { name: 'EDM', exact: true }).click();
  await page.locator('input[type=file]').nth(1).setInputFiles({ name: 'cover.png', mimeType: 'image/png', buffer: png(1600, 900) });
  await expect(page.getByRole('button', { name: 'Đổi · Ảnh bìa' })).toBeVisible();
  await page.getByLabel('Trang sự kiện').fill('https://example.com/dem-khach');
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();

  // Step 2: when and where.
  await page.getByLabel('Ngày', { exact: true }).fill('2027-04-10');
  await page.getByLabel('Mở cửa', { exact: true }).fill('21:00');
  await page.getByLabel('Kết thúc', { exact: true }).fill('23:30');
  await page.getByRole('combobox', { name: 'Địa điểm' }).fill('Kho Số 9');
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();

  // Step 3: the price and the ticket link.
  await page.getByLabel(/Giá từ/).fill('250000');
  await page.getByLabel('Link bán vé').fill('https://tickets.example.com/dem-khach');
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();

  // Step 4: the review. Signed in with no organiser yet, the submit makes one.
  await expect(page.getByRole('dialog', { name: 'Bạn đến với âm nhạc thế nào?' })).toHaveCount(0);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Tạo hồ sơ nhà tổ chức để gửi', exact: true }).click();

  // The role picker opens on its organiser step; the send follows the organiser, with no second tap.
  const picker = page.getByRole('dialog', { name: 'Bạn đến với âm nhạc thế nào?' });
  await expect(picker).toBeVisible();
  await picker.getByLabel('Tên nhà tổ chức').fill(`Ban To Chuc ${stamp % 100000}`);
  await picker.getByRole('button', { name: 'Tạo hồ sơ', exact: true }).click();

  await expect(page.getByText('Đã gửi duyệt', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Nháp · tự lưu', { exact: true })).toHaveCount(0);

  // The listing was sent for review with its price and its cover.
  const list = (await (await page.request.get('/organizer/events')).json()) as { items: { id: string; title: string }[] };
  const mine = list.items.find((e) => e.title === title);
  expect(mine, title).toBeTruthy();
  const ev = await (await page.request.get(`/organizer/events/${mine!.id}`)).json();
  expect([ev.status, ev.priceFrom, ev.coverUrl !== null]).toEqual(['in_review', 250000, true]);
  expect(problems).toEqual([]);
});
