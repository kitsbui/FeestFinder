import { expect, test, type Page } from '@playwright/test';
import { signInWith, watch } from '../checks.ts';

/*
 * The Console's reports, featured shelves and audit log (festfinder-web/src/kd/console/
 * reports.tsx, featured.tsx, audit.tsx), signed in as the demo admin. These create rather than
 * delete: a report on one discussion post (hidden, then kept), a new shelf (left off) and its
 * window changes in the log.
 */

const ADMIN = { identifier: 'admin@feestfinder.com', password: 'festfinder-admin' };
const ATTENDEE = { identifier: 'minh@example.com', password: 'festfinder123' };

async function open(page: Page, path: string) {
  const problems = watch(page);
  await page.goto(path);
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  return problems;
}

const addDays = (iso: string, n: number) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};

test.describe('Console moderation, signed in', () => {
  test.beforeEach(async ({ page }) => signInWith(page, ADMIN));

  test('reports: the category filter and the sort in the address, warn asks first, the tabs', async ({ page }) => {
    const { items } = await (await page.request.get('/admin/reports')).json();
    expect(items.length).toBeGreaterThan(0);
    const one = items[items.length - 1] as { category: string; categoryLabel: { vi: string } };
    const same = items.filter((r: { category: string }) => r.category === one.category).length;

    const problems = await open(page, '/console/reports');
    await expect(page.getByRole('tab', { name: /Báo cáo người dùng/ })).toHaveAttribute('aria-selected', 'true');
    await page.getByRole('button', { name: 'Loại báo cáo' }).click();
    await page.getByRole('menuitemradio', { name: new RegExp('^' + one.categoryLabel.vi) }).click();
    await expect(page).toHaveURL(new RegExp(`cat=${one.category}`));
    await expect(page.getByRole('article')).toHaveCount(same);
    for (const card of await page.getByRole('article').all()) await expect(card).toContainText(one.categoryLabel.vi);

    await page.getByRole('button', { name: 'Sắp xếp' }).click();
    await page.getByRole('menuitemradio', { name: 'Mở lâu nhất' }).click();
    await expect(page).toHaveURL(/sort=age/);

    // Warning is a strike: the dialog says the third one suspends. Cancel sends nothing.
    await page.getByRole('article').first().getByRole('button', { name: 'Cảnh cáo' }).click();
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toContainText('Cảnh cáo lần 3 sẽ tạm dừng tài khoản.');
    await dialog.getByRole('button', { name: 'Huỷ' }).click();
    await expect(dialog).toBeHidden();
    expect((await (await page.request.get('/admin/reports')).json()).items.length).toBe(items.length);
    await expect(page.getByRole('article').first().getByRole('link', { name: 'Xem tin' })).toHaveAttribute('href', /^\/console\/events\/[0-9a-f-]{36}$/);

    // Reset clears the category.
    await page.getByRole('button', { name: 'Đặt lại' }).click();
    await expect(page).not.toHaveURL(/cat=/);

    await page.getByRole('tab', { name: 'Khoảnh khắc' }).click();
    await expect(page).toHaveURL(/tab=moments/);
    await expect(page.getByRole('region', { name: 'Ảnh bị báo cáo' })).toBeVisible();
    await page.getByRole('tab', { name: 'Bài thảo luận' }).click();
    await expect(page).toHaveURL(/tab=posts/);
    // Appeals are answered in the queue.
    await expect(page.getByRole('link', { name: /Kháng nghị/ })).toHaveAttribute('href', '/console?filter=appeals');
    expect(problems).toEqual([]);
  });

  test('reports: a reported discussion post is hidden, delete asks first, then it is kept', async ({ page }) => {
    const { items: events } = await (await page.request.get('/admin/events?q=' + encodeURIComponent('Ravolution Music Festival'))).json();
    const ev = events.find((e: { title: string }) => e.title === 'Ravolution Music Festival');
    const body = 'Năm nay có khu ăn uống bên trong không ạ?';

    await signInWith(page, ATTENDEE);
    const disc = await (await page.request.get(`/events/${ev.id}/discussion?kind=talk&limit=30`)).json();
    const post = disc.items.find((p: { body: string }) => p.body === body);
    expect(post).toBeTruthy();
    expect((await page.request.post(`/posts/${post.id}/reports`, { data: { code: 'scalping' } })).ok()).toBe(true);
    await signInWith(page, ADMIN);

    const problems = await open(page, '/console/reports?tab=posts');
    await expect(page.getByRole('tab', { name: 'Bài thảo luận' })).toHaveAttribute('aria-selected', 'true');
    const row = page.getByRole('row').filter({ hasText: body });
    await expect(row.getByRole('link', { name: 'Ravolution Music Festival' })).toHaveAttribute('href', `/e/${ev.slug}#thao-luan`);
    await expect(row.getByText('Phe vé')).toBeVisible();
    await expect(row.getByText('Đang hiện')).toBeVisible();

    await row.getByRole('button', { name: 'Ẩn', exact: true }).click();
    await expect(row.getByText('Đang ẩn')).toBeVisible();
    await expect(row.getByRole('button', { name: 'Ẩn', exact: true })).toHaveCount(0);

    await row.getByRole('button', { name: 'Xoá' }).click();
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toContainText('Xoá bài này?');
    await dialog.getByRole('button', { name: 'Huỷ' }).click();

    // Keep closes the reports and shows the post again.
    await row.getByRole('button', { name: 'Giữ bài' }).click();
    await expect(row).toHaveCount(0);
    const after = await (await page.request.get(`/events/${ev.id}/discussion?kind=talk&limit=30`)).json();
    expect(after.items.find((p: { id: string }) => p.id === post.id)?.hidden).toBe(false);
    expect(problems).toEqual([]);
  });

  test('featured: create a shelf, rename it, give it a window, add listings, reorder and save', async ({ page }) => {
    const problems = await open(page, '/console/featured');
    const vi = `Kệ thử ${Date.now()}`;
    const form = page.getByRole('region', { name: 'Kệ mới' });
    await form.getByLabel('Tên (tiếng Việt)').fill(vi);
    await form.getByRole('button', { name: 'Tạo' }).click();
    const shelf = page.getByRole('article', { name: vi });
    await expect(shelf.getByText('Kệ chưa có tin nào.')).toBeVisible();
    const find = async () => ((await (await page.request.get('/admin/shelves')).json()).items as { id: string; name: { vi: string; en: string }; enabled: boolean; startsOn: string | null; endsOn: string | null; items: { id: string }[] }[])
      .find((s) => s.name.vi.startsWith(vi))!;
    expect((await find()).enabled).toBe(false);

    // Rename both languages, then save.
    await shelf.getByLabel('Tên (tiếng Việt)').fill(vi + ' mới');
    await shelf.getByLabel('Tên (tiếng Anh)').fill('Test shelf');
    await shelf.getByRole('button', { name: 'Lưu tên' }).click();
    await expect.poll(async () => (await find()).name).toEqual({ vi: vi + ' mới', en: 'Test shelf' });
    await expect(shelf.getByRole('button', { name: 'Lưu tên' })).toHaveCount(0);

    // Seven days from today, then no window, then seven days again.
    await shelf.getByRole('button', { name: '7 ngày từ hôm nay' }).click();
    await expect.poll(async () => (await find()).startsOn).not.toBeNull();
    const win = await find();
    expect(win.endsOn).toBe(addDays(win.startsOn!, 6));
    await shelf.getByRole('button', { name: 'Không giới hạn' }).click();
    await expect.poll(async () => (await find()).startsOn).toBeNull();

    // Two live upcoming listings from the search, on a local copy until saved.
    const pickNth = async (n: number) => {
      const box = shelf.getByRole('combobox', { name: 'Thêm tin đang đăng' });
      // The field keeps focus after a pick; the list opens again on the next focus.
      await box.blur();
      await box.click();
      await shelf.getByRole('option').nth(n).click();
    };
    await pickNth(0);
    await pickNth(1);
    const rows = shelf.locator('ol > li');
    await expect(rows).toHaveCount(2);
    expect((await find()).items).toHaveLength(0);
    const first = (await rows.nth(0).locator('.kd-hs').textContent())!;
    const second = (await rows.nth(1).locator('.kd-hs').textContent())!;
    await shelf.getByRole('button', { name: `Đưa ${second} lên` }).click();
    await expect(rows.nth(0)).toContainText(second);
    await shelf.getByRole('button', { name: 'Lưu danh sách' }).click();
    await expect(shelf.getByRole('button', { name: 'Lưu danh sách' })).toHaveCount(0);
    const { items: saved } = await (await page.request.get('/admin/events?status=live&limit=200')).json();
    const idOf = (t: string) => saved.find((e: { title: string }) => e.title === t).id;
    expect((await find()).items.map((i) => i.id)).toEqual([idOf(second), idOf(first)]);
    expect(problems).toEqual([]);
  });

  test('audit: the chain check, filter by area in the address, then load more', async ({ page }) => {
    // A shelf whose window changes enough times to fill more than one page of the shelf area.
    const made = await (await page.request.post('/admin/shelves', { data: { name: { vi: 'Kệ nhật ký', en: 'Log shelf' } } })).json();
    for (let i = 0; i < 42; i++) {
      const res = await page.request.patch('/admin/shelves/' + made.id, { data: { startsOn: i % 2 ? '2026-09-20' : '2026-09-21', endsOn: '2026-09-30' } });
      expect(res.ok()).toBe(true);
    }

    const problems = await open(page, '/console/audit');
    await expect(page.getByText(/Chuỗi hash hợp lệ · /)).toBeVisible();
    await page.getByRole('button', { name: 'Nhóm thao tác' }).click();
    await page.getByRole('menuitemradio', { name: 'Mục nổi bật' }).click();
    await expect(page).toHaveURL(/area=shelf/);
    const log = page.getByRole('region', { name: 'Nhật ký' });
    const rows = log.locator('li');
    await expect(rows).toHaveCount(40);
    await expect(rows.first()).toContainText('Log shelf');
    await expect(rows.first()).toContainText(/#\d+ · sha256:/);
    await expect(rows.first()).toContainText('window');
    await log.getByRole('button', { name: 'Xem thêm' }).click();
    await expect.poll(() => rows.count()).toBeGreaterThan(40);

    // The filter survives a reload; search narrows by who or what.
    await page.reload();
    await expect(page.getByRole('button', { name: 'Nhóm thao tác' })).toContainText('Mục nổi bật');
    await page.getByRole('searchbox', { name: 'Tìm người thực hiện hoặc đối tượng…' }).fill('Trending this week');
    await expect(page).toHaveURL(/q=Trending/);
    await expect(rows.first()).toContainText('Trending this week');
    expect(problems).toEqual([]);
  });
});
