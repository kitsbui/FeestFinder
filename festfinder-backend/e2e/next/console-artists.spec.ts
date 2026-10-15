import { expect, test, type Page } from '@playwright/test';
import { signInWith, watch } from '../checks.ts';

/*
 * The Console's artists, gear and sources (festfinder-web/src/kd/console/artists, sources),
 * signed in as the demo admin. These tests add rows (a source or two, an affiliate link) and set
 * Kreo's other names; they delete nothing. "Run now" is never pressed: it reads the network.
 */

const ADMIN = { identifier: 'admin@feestfinder.com', password: 'festfinder-admin' };

async function open(page: Page, path: string) {
  const problems = watch(page);
  await page.goto(path);
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  return problems;
}

const artistsNamed = async (page: Page, q: string) =>
  (await (await page.request.get('/admin/artists?q=' + encodeURIComponent(q))).json()).items as { name: string; aliases: string[] }[];
const sources = async (page: Page) =>
  (await (await page.request.get('/admin/sources')).json()).items as { id: string; name: string; enabled: boolean; config: Record<string, unknown> }[];

test.describe('the Console: artists, gear and sources', () => {
  test.beforeEach(async ({ page }) => signInWith(page, ADMIN));

  test('artists: the catalogue, a search kept in the address, other names and the ID checks', async ({ page }) => {
    const problems = await open(page, '/console/artists');
    await expect(page.getByRole('heading', { level: 1, name: 'Nghệ sĩ' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Hoaprox', exact: true })).toHaveAttribute('href', '/a/hoaprox');

    await page.getByRole('searchbox', { name: 'Tìm nghệ sĩ' }).fill('Kreo');
    await expect(page).toHaveURL(/[?&]q=Kreo/);
    await expect(page.getByRole('link', { name: 'Hoaprox', exact: true })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Kreo', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Sửa Kreo' }).click();
    const drawer = page.getByRole('dialog', { name: 'Kreo' });
    await expect(drawer).toBeVisible();
    // A Wikidata ID is Q and digits: anything else is caught before it is sent.
    await drawer.getByLabel('Wikidata').fill('abc');
    await expect(drawer.getByText('Chữ Q và các chữ số, vd: Q123456')).toBeVisible();
    await expect(drawer.getByRole('button', { name: 'Lưu', exact: true })).toBeDisabled();
    await drawer.getByLabel('Wikidata').fill('');
    await drawer.getByLabel('Tên khác').fill('Kreo Music, KREO VN');
    await drawer.getByRole('button', { name: 'Lưu', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Đã lưu' })).toBeVisible();
    await expect(drawer).toBeHidden();
    await expect(page.getByRole('row').filter({ hasText: 'Kreo Music, KREO VN' })).toBeVisible();
    expect((await artistsNamed(page, 'Kreo')).find((a) => a.name === 'Kreo')?.aliases).toEqual(['Kreo Music', 'KREO VN']);

    // The search came back with the address.
    await page.reload();
    await expect(page.getByRole('searchbox', { name: 'Tìm nghệ sĩ' })).toHaveValue('Kreo');
    expect(problems).toEqual([]);
  });

  test('gear: waiting and all, and an affiliate link on an item', async ({ page }) => {
    const code = `e2e-gear-${Date.now().toString(36)}`;
    const made = await page.request.post('/admin/affiliate/links', { data: { label: 'E2E gear link', destinationUrl: 'https://www.bitwig.com/', kind: 'product', code } });
    expect(made.ok()).toBeTruthy();
    const link = await made.json();

    const problems = await open(page, '/console/artists?tab=gear');
    await expect(page.getByRole('tab', { name: 'Thiết bị' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tab', { name: 'Chờ duyệt' })).toHaveAttribute('aria-selected', 'true');
    await page.getByRole('tab', { name: 'Tất cả' }).click();
    await expect(page).toHaveURL(/[?&]pending=0/);
    await expect(page.getByRole('row').filter({ hasText: 'Pioneer DJ CDJ-3000' })).toBeVisible();

    const pickLink = page.getByRole('combobox', { name: 'Link affiliate cho Bitwig Bitwig Studio' });
    await pickLink.selectOption(link.id);
    await expect(page.getByRole('status').filter({ hasText: 'Đã lưu' })).toBeVisible();
    const gear = async () => ((await (await page.request.get('/admin/gear?pending=0')).json()).items as { slug: string; affiliateLinkId: string | null }[]).find((g) => g.slug === 'bitwig-studio');
    await expect.poll(async () => (await gear())?.affiliateLinkId).toBe(link.id);
    // And back to none.
    await pickLink.selectOption('');
    await expect.poll(async () => (await gear())?.affiliateLinkId).toBeNull();
    expect(problems).toEqual([]);
  });

  test('sources: add one (switched off), see it listed, open its runs and records, reprocess', async ({ page }) => {
    const name = `E2E nguồn ${Date.now().toString(36)}`;
    const problems = await open(page, '/console/sources');
    await expect(page.getByRole('heading', { level: 1, name: 'Nguồn dữ liệu' })).toBeVisible();

    await page.getByRole('button', { name: 'Thêm nguồn', exact: true }).click();
    const form = page.getByRole('dialog', { name: 'Thêm nguồn' });
    await expect(form.getByRole('button', { name: 'Trang web (schema.org)' })).toHaveAttribute('aria-pressed', 'true');
    await form.getByLabel('Tên', { exact: true }).fill(name);
    // Resident Advisor is never read automatically: the API says so under the address.
    await form.getByLabel('Địa chỉ trang').fill('https://ra.co/events/1');
    await form.getByRole('switch', { name: 'Đang bật' }).click();
    await form.getByRole('button', { name: 'Thêm nguồn', exact: true }).click();
    await expect(form.getByRole('alert').filter({ hasText: 'FeestFinder không tự động đọc trang này' })).toBeVisible();

    await form.getByLabel('Địa chỉ trang').fill(`https://example.org/events-${Date.now()}`);
    await form.getByLabel('Đọc cả các trang có đường dẫn chứa').fill('/event/');
    await form.getByRole('button', { name: 'Thêm nguồn', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Đã thêm nguồn' })).toBeVisible();
    await expect(form).toBeHidden();
    const row = page.getByRole('row').filter({ hasText: name });
    await expect(row).toContainText('Tắt');
    await expect(row).toContainText('Chưa chạy');
    const added = (await sources(page)).find((s) => s.name === name)!;
    expect(added.enabled).toBe(false);
    expect(added.config).toEqual({ follow: '/event/', maxPages: 20 });

    await row.getByRole('button', { name: 'Mở ' + name }).click();
    await expect(page).toHaveURL(new RegExp(`[?&]id=${added.id}`));
    const detail = page.getByRole('dialog', { name });
    await expect(detail.getByText('Chưa chạy lần nào')).toBeVisible();
    await detail.getByRole('tab', { name: 'Bản ghi' }).click();
    await expect(detail.getByText('Không có bản ghi')).toBeVisible();
    await detail.getByRole('group', { name: 'Kết quả' }).getByRole('button', { name: 'Lỗi' }).click();
    await expect(detail.getByText('Không có bản ghi')).toBeVisible();
    // Reprocessing reads the records kept, not the network.
    await detail.getByRole('button', { name: 'Xử lý lại' }).click();
    await expect(page.getByRole('status').filter({ hasText: '0 mới · 0 gộp · 0 bỏ qua' })).toBeVisible();
    await detail.getByRole('button', { name: 'Đóng' }).first().click();
    await expect(page).not.toHaveURL(/[?&]id=/);
    expect(problems).toEqual([]);
  });

  test('sources: editing keeps the config keys the form does not show', async ({ page }) => {
    const name = `E2E giữ cấu hình ${Date.now().toString(36)}`;
    const made = await page.request.post('/admin/sources', { data: {
      adapter: 'website', name, url: `https://example.net/calendar-${Date.now()}`, authority: 'listing', enabled: false,
      config: { follow: '^/event/', maxPages: 5, requireStyle: true, eventType: 'club' },
    } });
    expect(made.status()).toBe(201);

    const problems = await open(page, '/console/sources');
    await page.getByRole('button', { name: 'Sửa ' + name }).click();
    const form = page.getByRole('dialog', { name });
    await expect(form.getByLabel('Đọc cả các trang có đường dẫn chứa')).toHaveValue('^/event/');
    await form.getByLabel('Tối đa số trang').fill('8');
    await form.getByRole('button', { name: 'Lưu', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Đã lưu nguồn' })).toBeVisible();
    const saved = (await sources(page)).find((s) => s.name === name)!;
    expect(saved.config).toEqual({ follow: '^/event/', maxPages: 8, requireStyle: true, eventType: 'club' });
    expect(problems).toEqual([]);
  });
});
