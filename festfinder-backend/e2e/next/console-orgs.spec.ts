import { expect, test, type Page } from '@playwright/test';
import { signInWith, watch } from '../checks.ts';

/*
 * The Console's organisers and venues (festfinder-web/src/kd/console/organizers, venues),
 * signed in as the demo admin. What these checks leave in the shared database: a contact name
 * and two members on Sunside Club, a new organiser, a new venue, and one listing without a pin
 * linked to SECC.
 */

const ADMIN = { identifier: 'admin@feestfinder.com', password: 'festfinder-admin' };

async function open(page: Page, path: string) {
  const problems = watch(page);
  await page.goto(path);
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  return problems;
}

const orgs = async (page: Page) => (await (await page.request.get('/admin/organizers')).json()).items as { id: string; name: string }[];
const orgId = async (page: Page, name: string) => (await orgs(page)).find((o) => o.name === name)!.id;
const venues = async (page: Page) => (await (await page.request.get('/admin/venues')).json()) as { items: { id: string; name: string }[]; unresolved: { id: string; title: string }[] };

test.describe('organisers and venues', () => {
  test.beforeEach(async ({ page }) => signInWith(page, ADMIN));

  test('organisers: a tile and the search narrow the directory, in the address', async ({ page }) => {
    const problems = await open(page, '/console/organizers');
    await expect(page.getByRole('heading', { level: 1, name: 'Nhà tổ chức' })).toBeVisible();
    // The tab row is shared with verification.
    await expect(page.getByRole('link', { name: 'Danh bạ' })).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('row', { name: /Sunside Club/ })).toBeVisible();

    await page.getByRole('button', { name: /Gắn cờ/ }).click();
    await expect(page).toHaveURL(/state=flagged/);
    await expect(page.getByRole('row', { name: /Tripside Travel/ })).toBeVisible();
    await expect(page.getByRole('row', { name: /Sunside Club/ })).toHaveCount(0);

    await page.getByRole('button', { name: /Gắn cờ/ }).click();
    await page.getByRole('searchbox', { name: 'Tìm nhà tổ chức' }).fill('w12');
    await expect(page).toHaveURL(/q=w12/);
    await expect(page.getByRole('row', { name: /W12 Collective/ })).toBeVisible();
    await expect(page.getByRole('row', { name: /Sunside Club/ })).toHaveCount(0);

    // The verification tab keeps the same row.
    await page.getByRole('link', { name: 'Xác minh' }).click();
    await expect(page).toHaveURL(/\/console\/verification/);
    await expect(page.getByRole('link', { name: 'Xác minh' })).toHaveAttribute('aria-current', 'page');
    expect(problems).toEqual([]);
  });

  test('organisers: a row opens the drawer, and a profile field saves', async ({ page }) => {
    const id = await orgId(page, 'Sunside Club');
    // The /ops address redirects to the drawer.
    const problems = await open(page, '/console/organizers/' + id);
    await expect(page).toHaveURL(new RegExp('/console/organizers\\?id=' + id));
    const drawer = page.getByRole('dialog', { name: 'Sunside Club' });
    await expect(drawer).toBeVisible();
    await drawer.getByRole('tab', { name: 'Hồ sơ' }).click();
    const contact = `Liên hệ ${Date.now()}`;
    await drawer.getByLabel('Người liên hệ', { exact: true }).fill(contact);
    await drawer.getByRole('button', { name: 'Lưu hồ sơ' }).click();
    await expect.poll(async () => (await (await page.request.get('/admin/organizers/' + id)).json()).contactName).toBe(contact);

    // Closing keeps the list; a row opens it again.
    await drawer.getByRole('button', { name: 'Đóng' }).click();
    await expect(page).not.toHaveURL(/id=/);
    await page.getByRole('row', { name: /Sunside Club/ }).click();
    await expect(page.getByRole('dialog', { name: 'Sunside Club' })).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('organisers: add a member; the last owner stays', async ({ page }) => {
    const id = await orgId(page, 'Sunside Club');
    await open(page, '/console/organizers?id=' + id);
    const drawer = page.getByRole('dialog', { name: 'Sunside Club' });
    await drawer.getByRole('tab', { name: /Thành viên/ }).click();
    const email = `crew-${Date.now()}@sunside.vn`;
    await drawer.getByRole('textbox', { name: 'Email thành viên' }).fill(email);
    await drawer.getByRole('button', { name: 'Thêm', exact: true }).click();
    await expect(drawer.getByText(email).first()).toBeVisible();
    const members = async () => (await (await page.request.get('/admin/organizers/' + id)).json()).members as { email: string; role: string }[];
    expect((await members()).some((m) => m.email === email && m.role === 'manager')).toBe(true);

    // An owner, when no other owner is left, cannot be removed.
    if (!(await members()).some((m) => m.role === 'owner')) {
      const owner = `owner-${Date.now()}@sunside.vn`;
      await drawer.getByRole('textbox', { name: 'Email thành viên' }).fill(owner);
      await drawer.getByRole('combobox', { name: 'Vai trò' }).selectOption('owner');
      await drawer.getByRole('button', { name: 'Thêm', exact: true }).click();
      await expect(drawer.getByText(owner).first()).toBeVisible();
      await drawer.getByRole('button', { name: 'Gỡ ' + owner }).click();
      await page.getByRole('alertdialog').getByRole('button', { name: 'Gỡ' }).click();
      await expect(page.getByRole('status').filter({ hasText: 'Mỗi nhà tổ chức cần ít nhất một chủ tài khoản' })).toBeVisible();
      expect((await members()).some((m) => m.email === owner)).toBe(true);
    }
  });

  test('organisers: onboard a new one, which then opens', async ({ page }) => {
    const problems = await open(page, '/console/organizers');
    await page.getByRole('button', { name: 'Thêm nhà tổ chức' }).click();
    const form = page.getByRole('dialog', { name: 'Thêm nhà tổ chức' });
    const name = `E2E Collective ${Date.now()}`;
    await form.getByLabel('Tên thương hiệu').fill(name);
    await form.getByLabel('Email chủ tài khoản').fill(`owner-${Date.now()}@e2e-collective.vn`);
    await form.getByRole('button', { name: 'Tạo nhà tổ chức' }).click();
    await expect(page.getByRole('dialog', { name })).toBeVisible();
    await expect(page).toHaveURL(/\?id=/);
    expect((await orgs(page)).some((o) => o.name === name)).toBe(true);
    expect(problems).toEqual([]);
  });

  test('venues: the registry lists venues and a district narrows it', async ({ page }) => {
    const problems = await open(page, '/console/venues');
    await expect(page.getByRole('heading', { level: 1, name: 'Địa điểm' })).toBeVisible();
    await expect(page.getByRole('row', { name: /SECC/ })).toBeVisible();
    await page.getByRole('button', { name: 'Khu vực' }).click();
    await page.getByRole('menuitemradio', { name: /^Quận 11/ }).click();
    await expect(page).toHaveURL(/area=/);
    await expect(page.getByRole('row', { name: /Sân vận động Phú Thọ/ })).toBeVisible();
    await expect(page.getByRole('row', { name: /SECC/ })).toHaveCount(0);
    expect(problems).toEqual([]);
  });

  test('venues: a new venue from a pasted map link', async ({ page }) => {
    const problems = await open(page, '/console/venues');
    await page.getByRole('button', { name: 'Thêm địa điểm' }).click();
    const drawer = page.getByRole('dialog', { name: 'Thêm địa điểm' });
    const name = `E2E Club ${Date.now()}`;
    await drawer.getByLabel('Tên địa điểm').fill(name);
    await drawer.getByLabel('Địa chỉ').fill('12 Lê Lợi, P. Bến Nghé');
    await drawer.getByLabel('Khu vực').fill('Quận 1');
    await drawer.getByLabel('Dán link bản đồ hoặc toạ độ').fill('https://www.google.com/maps/place/X/@10.7731,106.7008,17z');
    await expect(drawer.getByLabel('Vĩ độ')).toHaveValue('10.773100');
    await expect(drawer.getByLabel('Kinh độ')).toHaveValue('106.700800');
    await expect(drawer.getByRole('link', { name: 'Mở ghim này' })).toBeVisible();
    await drawer.getByRole('button', { name: 'Thêm địa điểm' }).click();
    await expect.poll(async () => (await venues(page)).items.some((v) => v.name === name)).toBe(true);
    expect(problems).toEqual([]);
  });

  test('venues: a pin outside the city is refused before saving', async ({ page }) => {
    await open(page, '/console/venues');
    await page.getByRole('button', { name: 'Thêm địa điểm' }).click();
    const drawer = page.getByRole('dialog', { name: 'Thêm địa điểm' });
    await drawer.getByLabel('Tên địa điểm').fill('Nowhere');
    await drawer.getByLabel('Địa chỉ').fill('1 Somewhere');
    await drawer.getByLabel('Khu vực').fill('Quận 1');
    await drawer.getByLabel('Dán link bản đồ hoặc toạ độ').fill('35.6762, 139.6503');
    await expect(drawer.getByText('Ghim nằm ngoài thành phố đã chọn')).toBeVisible();
    await expect(drawer.getByRole('button', { name: 'Thêm địa điểm' })).toBeDisabled();
  });

  test('venues: link a listing without a pin to a saved venue', async ({ page }) => {
    const { unresolved } = await venues(page);
    expect(unresolved.length, 'the demo data has listings without a pin').toBeGreaterThan(0);
    const listing = unresolved.find((e) => e.title === 'Ravolution After Hours') ?? unresolved[0];
    const problems = await open(page, '/console/venues?tab=unresolved');
    await expect(page.getByRole('tab', { name: /Tin chưa có ghim/ })).toHaveAttribute('aria-selected', 'true');
    const card = page.getByRole('article', { name: listing.title });
    await card.getByRole('combobox', { name: 'Gán địa điểm có sẵn…' }).fill('SECC');
    await card.getByRole('option', { name: /SECC/ }).click();
    await expect.poll(async () => (await venues(page)).unresolved.some((e) => e.id === listing.id)).toBe(false);
    await expect(page.getByRole('article', { name: listing.title })).toHaveCount(0);
    expect(problems).toEqual([]);
  });

  test('venues: the review queue link opens the drawer prefilled', async ({ page }) => {
    const { unresolved } = await venues(page);
    const event = unresolved[0]?.id ?? '';
    await open(page, `/console/venues?new=${encodeURIComponent('Warehouse X')}&address=${encodeURIComponent('12 Tôn Thất Thuyết')}&area=${encodeURIComponent('Quận 4')}&event=${event}`);
    const drawer = page.getByRole('dialog', { name: 'Thêm địa điểm' });
    await expect(drawer.getByLabel('Tên địa điểm')).toHaveValue('Warehouse X');
    await expect(drawer.getByLabel('Địa chỉ')).toHaveValue('12 Tôn Thất Thuyết');
    await expect(drawer.getByLabel('Khu vực')).toHaveValue('Quận 4');
    if (event) await expect(drawer.getByText(/^Gán cho/)).toBeVisible();
    // The address no longer carries the prefill.
    await expect(page).not.toHaveURL(/new=/);
    await drawer.getByRole('button', { name: 'Huỷ' }).click();
    await expect(drawer).toBeHidden();
  });
});
