import { expect, request, test, type Page } from '@playwright/test';
import { signInWith, watch } from '../checks.ts';

/*
 * Studio's events (festfinder-web/src/kd/studio/events.tsx and editor.tsx): the organiser's
 * listings by status, and the editor for any of them. Signed in as the demo organiser
 * (Ravolution): two live events and a past edition, After Hours in review, the Vũng Tàu bus a
 * draft. What these tests change they put back (a duplicate is deleted, a goal and an update
 * removed), so the other Studio checks see the same data.
 */

const ORGANIZER = { identifier: 'team@ravolution.vn', password: 'ravolution2026' };
const ADMIN = { identifier: 'admin@feestfinder.com', password: 'festfinder-admin' };

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

test.describe('Studio events', () => {
  test.beforeEach(async ({ page }) => signInWith(page, ORGANIZER));

  test('the list: every status, a tab and the search narrow it, the address keeps them', async ({ page }) => {
    const problems = await open(page, '/studio/events');
    const table = page.getByRole('table', { name: 'Sự kiện của tôi' });
    await expect(table.getByRole('link', { name: 'Ravolution Warm-up · Rooftop' })).toBeVisible();
    await expect(table.getByRole('link', { name: 'Ravolution After Hours' })).toBeVisible();
    await expect(table.getByRole('link', { name: 'Ravolution Bus · Vũng Tàu' })).toBeVisible();
    await expect(table.getByRole('row').filter({ hasText: 'Ravolution Music Festival 2025' }).getByText('Đã diễn ra')).toBeVisible();
    // The side rail has the screen.
    await expect(page.getByRole('navigation', { name: 'Studio' }).getByRole('link', { name: 'Sự kiện', exact: true })).toHaveAttribute('aria-current', 'page');

    await page.getByRole('tab', { name: /^Nháp/ }).click();
    await expect(page).toHaveURL(/status=draft/);
    await expect(table.getByRole('link', { name: 'Ravolution Bus · Vũng Tàu' })).toBeVisible();
    await expect(table.getByRole('link', { name: 'Ravolution Warm-up · Rooftop' })).toHaveCount(0);
    await expect(table.getByRole('row').filter({ hasText: 'Ravolution Bus' }).getByText(/^Thiếu:/)).toBeVisible();

    await page.getByRole('tab', { name: /^Tất cả/ }).click();
    await page.getByRole('searchbox', { name: 'Tìm theo tên, địa điểm…' }).fill('after hours');
    await expect(table.getByRole('link', { name: 'Ravolution After Hours' })).toBeVisible();
    await expect(table.getByRole('link', { name: 'Ravolution Bus · Vũng Tàu' })).toHaveCount(0);
    await expect(page).toHaveURL(/q=after/);

    // A row opens the editor.
    await table.getByRole('link', { name: 'Ravolution After Hours' }).click();
    await expect(page).toHaveURL(/\/studio\/events\/[0-9a-f-]{36}$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ravolution After Hours');
    expect(problems).toEqual([]);
  });

  test('edit a live event: a field saves and it stays live; a date change asks first', async ({ page }) => {
    const id = await eventId(page, 'Ravolution Warm-up · Rooftop');
    const problems = await open(page, '/studio/events/' + id);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ravolution Warm-up · Rooftop');
    const text = `Rooftop warm-up ${Date.now() % 100000}`;
    await page.getByLabel('Mô tả (tiếng Anh)').fill(text);
    await page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
    await expect.poll(async () => (await (await page.request.get('/organizer/events/' + id)).json()).description.en).toBe(text);
    expect((await (await page.request.get('/organizer/events/' + id)).json()).status).toBe('live');

    // A date change waits for the team's review: the editor names it and asks; cancelling changes nothing.
    await page.getByLabel('Ngày', { exact: true }).fill('2026-09-25');
    await page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
    const dialog = page.getByRole('alertdialog');
    await expect(dialog.getByRole('heading', { name: 'Lưu và gửi thay đổi để duyệt?' })).toBeVisible();
    await expect(dialog.getByText('Bạn đã sửa: ngày. Trang vẫn hiện trong lúc đội FeestFinder duyệt.')).toBeVisible();
    await dialog.getByRole('button', { name: 'Huỷ' }).click();
    const after = await (await page.request.get('/organizer/events/' + id)).json();
    expect(after.status).toBe('live');
    expect(after.startsOn).toBe('2026-09-18');

    expect(problems).toEqual([]);
  });

  test('saving a date change keeps a live event live and its page up, with the change waiting', async ({ page }) => {
    // An event of its own, so the specs that share this API keep tonight's Warm-up as it is:
    // a copy of Warm-up with a later date, published by the team.
    const source = await eventId(page, 'Ravolution Warm-up · Rooftop');
    const copy = await (await page.request.post(`/organizer/events/${source}/duplicate`)).json();
    expect((await page.request.patch('/organizer/events/' + copy.id, { data: { title: `Warm-up copy ${Date.now() % 100000}`, startsOn: '2026-10-09', endsOn: '2026-10-09' } })).ok()).toBeTruthy();
    await page.goto('/studio');
    const base = new URL(page.url()).origin;
    const admin = await request.newContext({ baseURL: base });
    expect((await admin.post('/auth/login', { data: ADMIN })).ok()).toBeTruthy();
    const published = await admin.post(`/admin/events/${copy.id}/status`, { data: { action: 'publish' } });
    expect(published.ok(), await published.text()).toBeTruthy();

    const problems = await open(page, '/studio/events/' + copy.id);
    await page.getByLabel('Ngày', { exact: true }).fill('2026-10-10');
    await page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Lưu', exact: true }).click();
    await expect(page.getByText('Thay đổi đang chờ duyệt')).toBeVisible();
    const saved = await (await page.request.get('/organizer/events/' + copy.id)).json();
    expect(saved.status).toBe('live');
    expect(saved.startsOn).toBe('2026-10-10');
    expect((await page.request.get('/events/' + saved.slug)).status()).toBe(200);
    // The team's queue shows it as a change to a live listing.
    const queue = await (await admin.get('/admin/queue')).json();
    expect(queue.items.find((i: { id: string }) => i.id === copy.id)?.kind).toBe('revision');
    await admin.post('/admin/listings/approve', { data: { ids: [copy.id] } });
    await admin.dispose();
    expect(problems).toEqual([]);
  });

  test('the editor says what Google and AI assistants read, and each gap opens its field', async ({ page }) => {
    // After Hours has no cover: the gap is the media block.
    const id = await eventId(page, 'Ravolution After Hours');
    const problems = await open(page, '/studio/events/' + id);
    const card = page.getByRole('region', { name: 'Hiển thị trên Google & AI' });
    await expect(card.getByText('/ 100')).toBeVisible();
    await card.getByRole('button', { name: /Có ảnh ngang/ }).click();
    await expect(page.locator('#edMedia')).toBeFocused();
    // The dashboard lists the weakest listings with what to add first.
    await page.goto('/studio');
    await expect(page.getByRole('region', { name: 'Hiển thị trên Google & AI' }).getByRole('link').first()).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('duplicate from the list, then delete the copy', async ({ page }) => {
    const problems = await open(page, '/studio/events?status=past');
    const table = page.getByRole('table', { name: 'Sự kiện của tôi' });
    await table.getByRole('button', { name: 'Thao tác cho Ravolution Music Festival 2025' }).click();
    await page.getByRole('menuitem', { name: 'Nhân bản thành nháp' }).click();
    await expect(page).toHaveURL(/\/studio\/events\/[0-9a-f-]{36}$/);
    const copy = page.url().split('/').pop()!;
    const made = await (await page.request.get('/organizer/events/' + copy)).json();
    expect(made.status).toBe('draft');
    expect(made.title).toBe('Ravolution Music Festival 2025');
    await expect(page.getByRole('button', { name: 'Gửi duyệt', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Thêm thao tác' }).click();
    await page.getByRole('menuitem', { name: 'Xoá bản nháp' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Xoá bản nháp' }).click();
    await expect(page).toHaveURL(/\/studio\/events$/);
    expect((await page.request.get('/organizer/events/' + copy)).status()).toBe(404);
    expect(problems).toEqual([]);
  });

  test('hype goals and live updates on a live event', async ({ page }) => {
    const id = await eventId(page, 'Ravolution Warm-up · Rooftop');
    const before = (await (await page.request.get(`/organizer/events/${id}/hype-goals`)).json()).goals;
    const problems = await open(page, '/studio/events/' + id);

    const goals = page.getByRole('region', { name: 'Mốc hype' });
    await goals.getByRole('button', { name: 'Thêm mốc' }).click();
    await goals.getByLabel('Số hype').last().fill('777');
    await goals.getByLabel('Phần thưởng (tiếng Việt)').last().fill('Thêm 50 vé early bird');
    await goals.getByRole('button', { name: 'Lưu mốc hype' }).click();
    await expect.poll(async () => (await (await page.request.get(`/organizer/events/${id}/hype-goals`)).json()).goals.some((g: { threshold: number }) => g.threshold === 777)).toBe(true);
    await page.request.put(`/organizer/events/${id}/hype-goals`, { data: { goals: before.map((g: { threshold: number; reward: unknown }) => ({ threshold: g.threshold, reward: g.reward })) } });

    const updates = page.getByRole('region', { name: 'Bảng tin trực tiếp' });
    const body = `Cổng 2 mở sớm ${Date.now() % 100000}`;
    await updates.getByLabel('Nội dung bảng tin').fill(body);
    await updates.getByRole('switch', { name: 'Gửi thông báo cho người có vé và người sẽ đi' }).click();
    await updates.getByRole('button', { name: 'Đăng bảng tin' }).click();
    const row = updates.getByRole('listitem').filter({ hasText: body });
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: 'Gỡ' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Gỡ' }).click();
    await expect(updates.getByText(body)).toHaveCount(0);
    expect(problems).toEqual([]);
  });

  test('the inbox filters by topic', async ({ page }) => {
    const problems = await open(page, '/studio/inbox');
    await expect(page.getByRole('button', { name: /After Hours cần bổ sung hai thứ/ })).toBeVisible();
    await page.getByRole('button', { name: 'Chủ đề' }).click();
    await page.getByRole('menuitemradio', { name: 'Hợp tác' }).click();
    await expect(page.getByRole('button', { name: /After Hours cần bổ sung hai thứ/ })).toHaveCount(0);
    expect(problems).toEqual([]);
  });

  test('the dashboard links to the events and to the editor', async ({ page }) => {
    await open(page, '/studio');
    await expect(page.getByRole('link', { name: 'Sửa sự kiện' })).toHaveAttribute('href', /\/studio\/events\/[0-9a-f-]{36}$/);
    await expect(page.getByRole('region', { name: 'Sự kiện của bạn' }).getByRole('link', { name: 'Tất cả' })).toHaveAttribute('href', '/studio/events');
  });
});
