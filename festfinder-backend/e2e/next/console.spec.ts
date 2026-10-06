import { expect, test, type Page } from '@playwright/test';
import { signInWith, watch } from '../checks.ts';

/*
 * The Console in Kính đêm (festfinder-web/src/kd/console): the team's back office, signed in as
 * the demo admin. Moderation decisions are held five seconds before they are sent.
 */

const ADMIN = { identifier: 'admin@feestfinder.com', password: 'festfinder-admin' };
const ATTENDEE = { identifier: 'minh@example.com', password: 'festfinder123' };
const ORGANIZER = { identifier: 'team@ravolution.vn', password: 'ravolution2026' };

async function open(page: Page, path: string) {
  const problems = watch(page);
  await page.goto(path);
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  return problems;
}

const waiting = async (page: Page) => (await (await page.request.get('/admin/queue')).json()).items.map((i: { title: string }) => i.title) as string[];

test('signed out, the Console asks to log in', async ({ page }) => {
  await open(page, '/console');
  await expect(page.locator('[data-ff-gate]')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Đăng nhập Console' })).toBeVisible();
});

test('an account that is not an admin is told so', async ({ page }) => {
  await signInWith(page, ATTENDEE);
  await open(page, '/console');
  await expect(page.getByRole('heading', { name: 'Tài khoản này không vào được Console' })).toBeVisible();
});

test.describe('the Console, signed in', () => {
  test.beforeEach(async ({ page }) => signInWith(page, ADMIN));

  test('moderation: approve, undo, approve again; then a change request with its reason', async ({ page }) => {
    const problems = await open(page, '/console');
    const detail = page.getByRole('heading', { level: 1 });
    const first = (await detail.textContent())!;
    await page.getByRole('button', { name: 'Duyệt', exact: true }).click();
    const line = page.getByRole('status').filter({ hasText: 'Đã duyệt' });
    await expect(line).toContainText(first);
    // The next listing opens; undo brings this one back, and nothing was sent.
    await expect(detail).not.toHaveText(first);
    await line.getByRole('button', { name: 'Hoàn tác' }).click();
    await expect(detail).toHaveText(first);
    expect(await waiting(page)).toContain(first);

    // Approve again and let the hold run out.
    await page.getByRole('button', { name: 'Duyệt', exact: true }).click();
    await expect.poll(() => waiting(page), { timeout: 10_000 }).not.toContain(first);

    // "Yêu cầu sửa" is a menu of reasons the organiser can fix; picking one acts.
    const second = (await detail.textContent())!;
    await page.getByRole('button', { name: 'Yêu cầu sửa' }).click();
    await page.getByRole('menuitem', { name: 'Link vé lỗi' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Đã yêu cầu sửa' })).toContainText('Link vé lỗi');
    await expect.poll(() => waiting(page), { timeout: 10_000 }).not.toContain(second);
    expect(problems).toEqual([]);
  });

  test('moderation: several at once, and the keyboard', async ({ page }) => {
    await open(page, '/console');
    // j moves to the next listing, k back.
    const detail = page.getByRole('heading', { level: 1 });
    const at = (await detail.textContent())!;
    await page.keyboard.press('j');
    await expect(detail).not.toHaveText(at);
    await page.keyboard.press('k');
    await expect(detail).toHaveText(at);

    const before = await waiting(page);
    const rows = page.getByRole('complementary', { name: 'Hàng chờ' }).getByRole('checkbox');
    await rows.nth(0).check();
    await rows.nth(1).check();
    await page.getByRole('button', { name: 'Duyệt 2 tin' }).click();
    await expect.poll(async () => (await waiting(page)).length, { timeout: 10_000 }).toBe(before.length - 2);
  });

  test('appeals are a filter of the queue', async ({ page }) => {
    await open(page, '/console/appeals');
    await expect(page).toHaveURL(/\/console\?filter=appeals$/);
    await expect(page.getByRole('button', { name: /^Khiếu nại/ })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: 'Giữ quyết định' }).first()).toBeVisible();
  });

  test('verification: documents, then verify', async ({ page }) => {
    await open(page, '/console/verification');
    const card = page.getByRole('article').first();
    const name = (await card.getByRole('link').first().textContent())!;
    const id = card.getByRole('switch', { name: new RegExp('^Giấy tờ tuỳ thân') });
    if ((await id.getAttribute('aria-checked')) !== 'true') await id.click();
    await expect(card.getByRole('button', { name: 'Xác minh' })).toBeEnabled();
    await card.getByRole('button', { name: 'Xác minh' }).click();
    await expect.poll(async () => {
      const { items } = await (await page.request.get('/admin/organizers?state=verified')).json();
      return items.some((o: { name: string }) => o.name === name);
    }).toBe(true);
  });

  test('reports: dismiss one', async ({ page }) => {
    await open(page, '/console/reports');
    const before = (await (await page.request.get('/admin/reports')).json()).items.length;
    await page.getByRole('article').first().getByRole('button', { name: 'Bỏ qua' }).click();
    await expect.poll(async () => (await (await page.request.get('/admin/reports')).json()).items.length).toBe(before - 1);
  });

  test('featured: a boost request goes onto a shelf', async ({ page }) => {
    // The organiser asks for a boost on their next live event.
    await signInWith(page, ORGANIZER);
    const { items } = await (await page.request.get('/organizer/events')).json();
    const warm = items.find((e: { title: string }) => e.title === 'Ravolution Warm-up · Rooftop');
    expect((await page.request.post(`/organizer/events/${warm.id}/boost`, { data: {} })).ok()).toBe(true);
    await signInWith(page, ADMIN);

    const problems = await open(page, '/console/featured');
    const boosts = page.getByRole('region', { name: 'Yêu cầu đẩy tin' });
    await boosts.getByRole('button', { name: 'Đã đẩy' }).first().click();
    await page.getByRole('menuitem', { name: 'Đang hot tuần này' }).click();
    await expect(page.getByRole('article', { name: 'Đang hot tuần này' }).getByText('Ravolution Warm-up · Rooftop')).toBeVisible();
    await expect.poll(async () => {
      const { items: asked } = await (await page.request.get('/admin/boosts')).json();
      return asked.find((b: { event: { id: string } }) => b.event.id === warm.id).status;
    }).toBe('done');
    expect(problems).toEqual([]);
  });

  test('numbers: the week against the one before, eight weeks by family, areas, the log', async ({ page }) => {
    const problems = await open(page, '/console/insights');
    await expect(page.getByText('Sự kiện đang đăng')).toBeVisible();
    await expect(page.getByRole('region', { name: 'Sự kiện mới theo thể loại · 8 tuần' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Khu vực nhiều sự kiện' })).toBeVisible();
    await expect(page.getByText('Chuỗi băm hợp lệ')).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('the audit log filters by who', async ({ page }) => {
    await open(page, '/console/audit');
    await page.getByRole('button', { name: 'Admin', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Admin', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('link', { name: 'Tải 30 ngày (CSV)' })).toHaveAttribute('href', /actor=admin/);
  });
});
