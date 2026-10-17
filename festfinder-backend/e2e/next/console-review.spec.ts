import { expect, test, type Page } from '@playwright/test';
import { signInWith, watch } from '../checks.ts';

/*
 * The Console's review queue in full (views, filters, sort, the listing's detail, send-back,
 * the keyboard, deep links, appeals), the overview and claims, signed in as the demo admin.
 * console.spec.ts runs after this file on the same database and approves listings from the
 * queue, so nothing here decides one: every send-back is undone inside its five-second hold,
 * and appeal confirms are cancelled. The one write is a profile claim on Bside Cafe by the demo
 * attendee, declined with a note.
 */

const ADMIN = { identifier: 'admin@feestfinder.com', password: 'festfinder-admin' };
const ATTENDEE = { identifier: 'minh@example.com', password: 'festfinder123' };

async function open(page: Page, path: string) {
  const problems = watch(page);
  await page.goto(path);
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  return problems;
}

interface Row { id: string; title: string; riskBand: string; startsOn: string | null; slug: string }
const queue = async (page: Page) => (await (await page.request.get('/admin/queue')).json()).items as Row[];
const byTitle = async (page: Page, title: string) => (await queue(page)).find((i) => i.title === title)!;

test.describe('the review queue', () => {
  test.beforeEach(async ({ page }) => signInWith(page, ADMIN));

  test('views, filters, sort and the top-bar search narrow the rows', async ({ page }) => {
    const problems = await open(page, '/console');
    const list = page.getByRole('complementary', { name: 'Hàng chờ' });
    const rows = list.getByRole('listitem');
    const items = await queue(page);
    await expect(rows).toHaveCount(items.length);

    // Past SLA: only listings waiting longer than the promise.
    await list.getByRole('button', { name: /^Quá hạn/ }).click();
    await expect(page).toHaveURL(/view=breach/);
    await expect(list.getByRole('button', { name: /^Quá hạn/ })).toHaveAttribute('aria-pressed', 'true');
    await expect(rows.first()).toContainText('EDM Beach Bus — Vũng Tàu');
    await list.getByRole('button', { name: /^Tất cả/ }).click();

    // Risk: high only.
    await list.getByRole('button', { name: 'Rủi ro', exact: true }).click();
    await page.getByRole('menuitemradio', { name: 'Cao' }).click();
    await expect(page).toHaveURL(/risk=high/);
    const high = items.filter((i) => i.riskBand === 'high').length;
    if (high) await expect(rows).toHaveCount(high);
    else await expect(list.getByText('Không có tin khớp bộ lọc')).toBeVisible();
    await list.getByRole('button', { name: 'Đặt lại' }).click();
    await expect(page).not.toHaveURL(/risk=/);

    // Happening soonest first.
    // The chip's name starts with its label, then the order it shows ("Sắp xếp: Mới nhất").
    await list.getByRole('button', { name: /^Sắp xếp:/ }).click();
    await page.getByRole('menuitemradio', { name: 'Diễn ra sớm nhất' }).click();
    const soonest = [...items].filter((i) => i.startsOn).sort((a, b) => a.startsOn!.localeCompare(b.startsOn!))[0];
    await expect(rows.first()).toContainText(soonest.title);

    // The top bar searches title, organiser, submitter and venue.
    await page.getByRole('searchbox', { name: 'Tìm trong Console' }).fill('Warehouse 12');
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText('Underground Techno — Warehouse 12');
    expect(problems).toEqual([]);
  });

  test('a deep link opens one listing in full, with the fixes in place', async ({ page }) => {
    const w12 = await byTitle(page, 'Underground Techno — Warehouse 12');
    const problems = await open(page, `/console?id=${w12.id}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(w12.title);
    // The venue has no pin: link a saved one, or create it with the address filled in.
    await expect(page.getByText('Chưa có ghim')).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Gán địa điểm có sẵn' })).toBeVisible();
    const create = page.getByRole('link', { name: 'Tạo địa điểm mới' });
    await expect(create).toHaveAttribute('href', new RegExp(`^/console/venues\\?new=Warehouse\\+12&.*event=${w12.id}`));
    // "Toàn bộ tin": images, details, links, description; "Nguồn và bằng chứng": quality and risk.
    await expect(page.getByRole('heading', { name: 'Hình ảnh' })).toBeVisible();
    await expect(page.getByText('Link bán vé')).toBeVisible();
    await page.getByRole('group', { name: 'Ngôn ngữ mô tả' }).getByRole('button', { name: 'EN' }).click();
    await expect(page.getByRole('group', { name: 'Ngôn ngữ mô tả' }).getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('tab', { name: /^Nguồn và bằng chứng/ }).click();
    await expect(page.getByRole('heading', { name: /^Chất lượng · \d+\/100$/ })).toBeVisible();
    const recheck = page.waitForResponse((r) => r.url().includes(`/admin/listings/${w12.id}/risk`) && r.ok());
    await page.getByRole('button', { name: 'Tính lại' }).click();
    await recheck;
    // Preview and full edit.
    await expect(page.getByRole('link', { name: 'Xem trang' })).toHaveAttribute('href', `/e/${w12.slug}`);
    await expect(page.getByRole('link', { name: 'Sửa đầy đủ' })).toHaveAttribute('href', `/console/events/${w12.id}`);
    expect(problems).toEqual([]);
  });

  test('the keyboard: r sends back with a message, x selects, e edits', async ({ page }) => {
    const [first] = await queue(page);
    await open(page, `/console?id=${first.id}`);
    const detail = page.getByRole('heading', { level: 1 });
    await expect(detail).toHaveText(first.title);

    await page.keyboard.press('r');
    const drawer = page.getByRole('dialog', { name: 'Trả lại tin cho nhà tổ chức' });
    await expect(drawer).toBeVisible();
    await drawer.getByLabel('Lý do').selectOption({ label: 'Link vé lỗi' });
    await expect(drawer.getByRole('textbox')).not.toHaveValue('');
    await expect(drawer.getByRole('switch', { name: 'Cho phép kháng nghị trong 7 ngày' })).toHaveAttribute('aria-checked', 'true');
    await drawer.getByRole('button', { name: 'Huỷ' }).click();
    await expect(drawer).toBeHidden();

    await page.keyboard.press('x');
    await expect(page.getByRole('checkbox', { name: `Chọn ${first.title}` })).toBeChecked();
    await page.keyboard.press('x');
    await expect(page.getByRole('checkbox', { name: `Chọn ${first.title}` })).not.toBeChecked();

    await page.keyboard.press('e');
    await expect(page).toHaveURL(new RegExp(`/console/events/${first.id}$`));
  });

  test('several sent back with a message, then undone', async ({ page }) => {
    await open(page, '/console');
    const before = (await queue(page)).length;
    const boxes = page.getByRole('complementary', { name: 'Hàng chờ' }).getByRole('checkbox');
    await boxes.nth(0).check();
    await boxes.nth(1).check();
    await page.getByRole('button', { name: 'Trả lại…' }).click();
    const drawer = page.getByRole('dialog', { name: 'Trả lại 2 tin' });
    await drawer.getByLabel('Lý do').selectOption({ label: 'Link vé lỗi' });
    await drawer.getByRole('group', { name: 'Ngôn ngữ mẫu' }).getByRole('button', { name: 'EN' }).click();
    await drawer.getByRole('button', { name: 'Trả lại', exact: true }).click();
    const line = page.getByRole('status').filter({ hasText: 'Đã yêu cầu sửa' });
    await expect(line).toContainText('Đã chọn 2');
    await line.getByRole('button', { name: 'Hoàn tác' }).click();
    // The hold would have run out by now: nothing was sent.
    await page.waitForTimeout(6000);
    expect((await queue(page)).length).toBe(before);
  });

  test('approving several asks first', async ({ page }) => {
    await open(page, '/console');
    const boxes = page.getByRole('complementary', { name: 'Hàng chờ' }).getByRole('checkbox');
    await boxes.nth(0).check();
    await boxes.nth(1).check();
    await page.getByRole('button', { name: 'Duyệt 2 tin' }).click();
    const ask = page.getByRole('alertdialog');
    await expect(ask.getByRole('heading', { name: 'Duyệt 2 tin?' })).toBeVisible();
    await ask.getByRole('button', { name: 'Huỷ' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Đã duyệt' })).toHaveCount(0);
  });

  test('appeals: both messages and the days left; overturning is confirmed', async ({ page }) => {
    const problems = await open(page, '/console?filter=appeals');
    const card = page.getByRole('article', { name: 'Rooftop NYE Countdown' });
    await expect(card.getByText('FeestFinder đã viết')).toBeVisible();
    await expect(card.getByText('Nhà tổ chức phản hồi')).toBeVisible();
    await expect(card.getByText(/^còn \d+ ngày$/)).toBeVisible();
    await expect(card.getByRole('link', { name: 'Xem tin' })).toHaveAttribute('href', /^\/console\/events\//);
    await card.getByRole('button', { name: 'Lật lại và đăng' }).click();
    const ask = page.getByRole('alertdialog');
    await expect(ask.getByRole('heading', { name: 'Lật lại quyết định và đăng tin?' })).toBeVisible();
    await ask.getByRole('button', { name: 'Huỷ' }).click();
    await expect(card).toBeVisible();
    expect(problems).toEqual([]);
  });
});

test.describe('overview and claims', () => {
  test('the overview: tiles, the to-do list into each screen, coming up, activity', async ({ page }) => {
    await signInWith(page, ADMIN);
    const problems = await open(page, '/console/overview');
    await expect(page.getByRole('heading', { level: 1, name: 'Tổng quan' })).toBeVisible();
    await expect(page.getByText('Chờ duyệt', { exact: true })).toBeVisible();
    await expect(page.getByText('Quyết định hôm nay')).toBeVisible();
    await expect(page.getByRole('region', { name: 'Sắp diễn ra' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Hoạt động gần đây' }).getByRole('listitem').first()).toBeVisible();
    const todo = page.getByRole('region', { name: 'Việc cần làm' });
    await todo.getByRole('link', { name: /kháng nghị đang mở/ }).click();
    await expect(page).toHaveURL(/\/console\?filter=appeals$/);
    await expect(page.getByRole('button', { name: /^Khiếu nại/ })).toHaveAttribute('aria-pressed', 'true');
    expect(problems).toEqual([]);
  });

  test('claims: a profile claim is declined with a note', async ({ page }) => {
    await signInWith(page, ADMIN);
    const { items: orgs } = await (await page.request.get('/admin/organizers?q=Bside')).json();
    const bside = orgs.find((o: { name: string }) => o.name === 'Bside Cafe');
    const note = `Tôi quản lý Bside Cafe · ${Date.now()}`;
    await signInWith(page, ATTENDEE);
    expect((await page.request.post('/me/roles/organizer', { data: { claimOrganizerId: bside.id, note } })).ok()).toBe(true);
    await signInWith(page, ADMIN);

    const problems = await open(page, '/console/claims');
    await expect(page.getByRole('tab', { name: 'Sự kiện' })).toHaveAttribute('aria-selected', 'true');
    await page.getByRole('tab', { name: 'Hồ sơ nghệ sĩ & BTC' }).click();
    await expect(page).toHaveURL(/what=profiles/);
    const row = page.getByRole('row').filter({ hasText: note });
    await expect(row).toContainText('Bside Cafe');
    await row.getByRole('button', { name: 'Từ chối' }).click();
    const ask = page.getByRole('alertdialog');
    await ask.getByRole('textbox', { name: 'Lời nhắn' }).fill('Chưa xác nhận được bạn là chủ hồ sơ');
    await ask.getByRole('button', { name: 'Từ chối' }).click();
    await expect(row).toHaveCount(0);
    await expect.poll(async () => {
      const { items } = await (await page.request.get('/admin/profile-claims?status=rejected')).json();
      return items.find((c: { note: string }) => c.note === note)?.decisionNote;
    }).toBe('Chưa xác nhận được bạn là chủ hồ sơ');

    await page.getByRole('tab', { name: 'Đã từ chối' }).click();
    await expect(page.getByRole('row').filter({ hasText: note })).toContainText('Chưa xác nhận được bạn là chủ hồ sơ');
    expect(problems).toEqual([]);
  });
});
