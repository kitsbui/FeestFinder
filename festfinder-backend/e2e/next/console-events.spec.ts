import { expect, test, type Page } from '@playwright/test';
import { signInWith, watch } from '../checks.ts';

/*
 * The Console's events (festfinder-web/src/kd/console/events): the catalogue with its filters in
 * the address, one listing with its tabs, and the team's event form. Every listing these checks
 * change is one they created first (titles start with "E2E"), so the demo data stays as seeded.
 */

const ADMIN = { identifier: 'admin@feestfinder.com', password: 'festfinder-admin' };

async function open(page: Page, path: string) {
  const problems = watch(page);
  await page.goto(path);
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  return problems;
}

async function ravolution(page: Page): Promise<{ id: string; name: string }> {
  const out = await (await page.request.get('/admin/organizers?q=Ravolution')).json();
  const org = out.items.find((o: { name: string }) => o.name === 'Ravolution Entertainment');
  expect(org, 'the demo organiser').toBeTruthy();
  return { id: org.id, name: org.name };
}

/** A draft made through the API, for the checks that change a listing. */
async function draft(page: Page, title: string): Promise<string> {
  const org = await ravolution(page);
  const res = await page.request.post('/admin/events', { data: { organizerId: org.id, title, startsOn: '2026-11-07', startTime: '22:00', endTime: '04:00', entryMode: 'free' } });
  expect(res.ok()).toBeTruthy();
  return (await res.json()).id;
}

test.describe('Console events', () => {
  test.beforeEach(async ({ page }) => signInWith(page, ADMIN));

  test('the catalogue: search and status narrow it, and stay in the address', async ({ page }) => {
    const problems = await open(page, '/console/events');
    await expect(page.getByRole('heading', { level: 1, name: 'Sự kiện' })).toBeVisible();
    const table = page.getByRole('table', { name: 'Sự kiện' });
    await expect(table.getByRole('link', { name: 'Ravolution Warm-up · Rooftop' })).toBeVisible();
    await expect(table.getByRole('link', { name: /HOZO Super Fest$/ })).toBeVisible();

    await page.getByRole('searchbox', { name: 'Tìm sự kiện' }).fill('Ravolution');
    await expect(page).toHaveURL(/q=Ravolution/);
    await expect(table.getByRole('link', { name: /HOZO Super Fest$/ })).toHaveCount(0);
    await expect(table.getByRole('link', { name: 'Ravolution Warm-up · Rooftop' })).toBeVisible();

    // Drafts only: the bus trip is a draft, the warm-up is live.
    await page.getByRole('button', { name: 'Trạng thái' }).click();
    await page.getByRole('menuitemradio', { name: /^Nháp/ }).click();
    await expect(page).toHaveURL(/status=draft/);
    await expect(table.getByRole('link', { name: 'Ravolution Bus · Vũng Tàu' })).toBeVisible();
    await expect(table.getByRole('link', { name: 'Ravolution Warm-up · Rooftop' })).toHaveCount(0);

    // The CSV carries the same filters.
    const csv = await page.getByRole('link', { name: 'CSV' }).getAttribute('href');
    expect(csv).toMatch(/^\/admin\/events\.csv\?/);
    expect(csv).toContain('status=draft');
    expect(csv).toContain('q=Ravolution');

    // Reloading keeps the filters.
    await page.reload();
    await expect(table.getByRole('link', { name: 'Ravolution Bus · Vũng Tàu' })).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('a listing opens with its numbers and tabs', async ({ page }) => {
    const problems = await open(page, '/console/events?q=Warm-up');
    await page.getByRole('link', { name: 'Ravolution Warm-up · Rooftop' }).click();
    await expect(page).toHaveURL(/\/console\/events\/[0-9a-f-]{36}$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Ravolution Warm-up · Rooftop' })).toBeVisible();
    await expect(page.getByText('Lượt xem', { exact: false }).first()).toBeVisible();
    await expect(page.getByLabel('Tên sự kiện')).toHaveValue('Ravolution Warm-up · Rooftop');
    await page.getByRole('tab', { name: /Kiểm duyệt & lịch sử/ }).click();
    await expect(page).toHaveURL(/tab=history/);
    await expect(page.getByRole('heading', { name: 'Nhật ký thay đổi' })).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('the form: edit and save a field, then duplicate as a draft', async ({ page }) => {
    const id = await draft(page, 'E2E Edit Night');
    const problems = await open(page, `/console/events/${id}`);
    const name = page.getByLabel('Tên sự kiện');
    await expect(name).toHaveValue('E2E Edit Night');
    await name.fill('E2E Edit Night · Renamed');
    await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'E2E Edit Night · Renamed' })).toBeVisible();
    await expect.poll(async () => (await (await page.request.get(`/admin/events/${id}`)).json()).title).toBe('E2E Edit Night · Renamed');

    await page.getByRole('button', { name: 'Thao tác khác' }).click();
    await page.getByRole('menuitem', { name: 'Nhân bản thành nháp' }).click();
    await expect(page).not.toHaveURL(new RegExp(id));
    await expect(page).toHaveURL(/\/console\/events\/[0-9a-f-]{36}$/);
    const copy = page.url().split('/').pop()!;
    const out = await (await page.request.get(`/admin/events/${copy}`)).json();
    expect(out.status).toBe('draft');
    expect(out.title).toContain('E2E Edit Night');
    expect(problems).toEqual([]);
  });

  test('a new listing for an organiser, picked in the form or passed in the address', async ({ page }) => {
    const org = await ravolution(page);
    const problems = await open(page, '/console/events/new');
    await expect(page.getByRole('heading', { level: 1, name: 'Tạo sự kiện' })).toBeVisible();
    await page.getByRole('combobox', { name: 'Nhà tổ chức' }).fill('Ravolution');
    await page.getByRole('option', { name: /Ravolution Entertainment/ }).click();
    await page.getByLabel('Tên sự kiện').fill('E2E Team Listing');
    await page.getByRole('button', { name: 'Tạo bản nháp' }).click();
    await expect(page).toHaveURL(/\/console\/events\/[0-9a-f-]{36}$/);
    await expect(page.getByRole('heading', { level: 1, name: 'E2E Team Listing' })).toBeVisible();
    const made = await (await page.request.get(`/admin/events/${page.url().split('/').pop()}`)).json();
    expect(made.status).toBe('draft');
    expect(made.organizer.id).toBe(org.id);

    // ?org=&orgName= picks the organiser beforehand.
    await open(page, `/console/events/new?org=${org.id}&orgName=${encodeURIComponent(org.name)}`);
    await expect(page.getByText(org.name).first()).toBeVisible();
    await page.getByLabel('Tên sự kiện').fill('E2E Prefilled Listing');
    await page.getByRole('button', { name: 'Tạo bản nháp' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'E2E Prefilled Listing' })).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('sources: add a link, see it, detach it', async ({ page }) => {
    const id = await draft(page, 'E2E Sources Night');
    const problems = await open(page, `/console/events/${id}?tab=sources`);
    const sources = page.getByRole('region', { name: 'Nguồn', exact: true });
    await expect(sources).toBeVisible();
    await expect(page.getByRole('region', { name: 'Độ tin cậy' })).toBeVisible();
    await sources.getByRole('textbox', { name: 'Link thêm làm nguồn' }).fill('https://ra.co/events/2099001');
    await sources.getByRole('button', { name: 'Thêm' }).click();
    await expect(sources.getByRole('link', { name: /ra\.co/ })).toBeVisible();
    await sources.getByRole('button', { name: /^Gỡ nguồn này · ra\.co/ }).click();
    await expect(sources.getByRole('link', { name: /ra\.co/ })).toHaveCount(0);
    expect(problems).toEqual([]);
  });
});
