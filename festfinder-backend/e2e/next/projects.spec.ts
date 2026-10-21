import { expect, request, test, type APIRequestContext } from '@playwright/test';

/*
 * Projects (festfinder-web/src/kd/web/projects): a fan starts one, the team approves it, a brand
 * offers to sponsor from the public page, and the owner accepts and sees how to reach them.
 * Created, never deleted: other specs see one more project.
 */

const ADMIN = { identifier: 'admin@feestfinder.com', password: 'festfinder-admin' };
const ATTENDEE = { identifier: 'minh@example.com', password: 'festfinder123' };
const ORGANIZER = { identifier: 'team@ravolution.vn', password: 'ravolution2026' };

async function as(baseURL: string | undefined, account: { identifier: string; password: string }): Promise<APIRequestContext> {
  const ctx = await request.newContext({ baseURL });
  expect((await ctx.post('/auth/login', { data: account })).ok(), 'sign in as ' + account.identifier).toBeTruthy();
  return ctx;
}

test('a project from idea to an accepted sponsor, and its page for search engines', async ({ page, browser, baseURL }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  expect((await page.request.post('/auth/login', { data: ATTENDEE })).ok()).toBeTruthy();
  const n = Date.now() % 1_000_000;
  const title = `Rooftop Sunrise ${n}`;
  const newcomer = `Rooftop Newcomer ${n}`;

  // Started from the form: the draft opens its own page.
  await page.goto('/p/new');
  await page.getByLabel('Tên dự án').fill(title);
  await page.getByLabel('Một câu giới thiệu').fill('A sunrise house session on a Saigon rooftop for 300 people');
  await page.getByLabel('Ý tưởng').fill('We want a sunrise session on a rooftop in District 1: house and melodic techno from 4am, a local lineup and good coffee. We have the crew; we need a venue and sponsors to cover sound and lights.');
  await page.getByRole('button', { name: 'Tài trợ', exact: true }).click();
  await page.getByRole('button', { name: 'Địa điểm', exact: true }).click();
  // The budget in dollars from a preset, and a waitlist target (owner, 2026-10-20).
  await page.getByRole('button', { name: 'USD', exact: true }).click();
  await expect(page.getByLabel('Ngân sách (USD)')).toBeVisible();
  await page.getByRole('button', { name: /^25\s/ }).click();
  await expect(page.getByLabel('Ngân sách (USD)')).toHaveValue('25000');
  await page.getByRole('button', { name: '300', exact: true }).click();
  await expect(page.getByLabel('Mục tiêu danh sách chờ (người)')).toHaveValue('300');
  // The lineup: an artist's own profile from the suggestions, and a new name that waits to be claimed.
  const lineup = page.getByRole('combobox', { name: 'Nghệ sĩ' });
  await lineup.fill('slim');
  await page.getByRole('option', { name: /SlimV/ }).click();
  await lineup.fill(newcomer);
  await page.getByRole('option', { name: `Thêm “${newcomer}” thành hồ sơ mới` }).click();
  await expect(page.getByRole('button', { name: `Bỏ ${newcomer}` })).toBeVisible();
  await page.getByLabel('Link dự án').fill('https://instagram.com/rooftop.sunrise');
  await page.getByRole('button', { name: 'Tạo dự án' }).click();
  await expect(page).toHaveURL(/\/p\/[a-z0-9-]+\/manage$/);
  const slug = page.url().split('/p/')[1].split('/')[0];
  await expect(page.getByText('Nháp')).toBeVisible();
  await page.getByRole('button', { name: 'Gửi duyệt' }).click();
  await expect(page.getByText('Đang duyệt')).toBeVisible();

  // The team approves it.
  const admin = await as(baseURL, ADMIN);
  const queue = await (await admin.get('/admin/projects')).json();
  const mine = queue.items.find((p: { slug: string }) => p.slug === slug);
  expect((await admin.post(`/admin/projects/${mine.id}/decision`, { data: { action: 'approve' } })).ok()).toBeTruthy();

  // Public: listed under Tài trợ, with its structured data.
  const brand = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  expect((await brand.request.post('/auth/login', { data: ORGANIZER })).ok()).toBeTruthy();
  await brand.goto('/p?seeking=sponsorship');
  await expect(brand.getByRole('link', { name: title })).toBeVisible();
  await brand.goto(`/p/${slug}`);
  await expect(brand.getByRole('heading', { level: 1, name: title })).toBeVisible();
  const graph = JSON.parse((await brand.locator('script[type="application/ld+json"]').first().textContent())!)['@graph'];
  expect(graph.find((n: { '@type': string }) => n['@type'] === 'Project').seeks.map((d: { name: string }) => d.name)).toEqual(['Tài trợ', 'Địa điểm']);
  await expect(brand.getByText(/không nhận, giữ hay chuyển tiền/)).toBeVisible();
  await expect(brand.locator('.kd-v', { hasText: /25\.000\sUS\$/ })).toBeVisible();
  await expect(brand.getByRole('link', { name: 'instagram.com/rooftop.sunrise' })).toHaveAttribute('href', 'https://instagram.com/rooftop.sunrise');
  await expect(brand.getByRole('link', { name: 'SlimV' })).toHaveAttribute('href', '/a/slimv');
  await expect(brand.getByRole('link', { name: newcomer })).toHaveAttribute('href', `/a/rooftop-newcomer-${n}`);

  // The waitlist counts real accounts against the target; sharing opens the networks.
  await expect(brand.getByText('0/300 người chờ')).toBeVisible();
  await brand.getByRole('button', { name: 'Vào danh sách chờ' }).click();
  await expect(brand.getByText('1/300 người chờ')).toBeVisible();
  await expect(brand.getByRole('button', { name: 'Đã vào danh sách chờ' })).toHaveAttribute('aria-pressed', 'true');
  await brand.getByRole('button', { name: 'Chia sẻ' }).click();
  const share = brand.getByRole('dialog', { name: 'Chia sẻ' });
  await expect(share.getByRole('button', { name: 'Facebook' })).toBeVisible();
  await share.getByRole('button', { name: 'Đóng' }).click();

  // A brand offers to sponsor.
  await brand.getByRole('button', { name: 'Đề nghị tham gia' }).click();
  const sheet = brand.getByRole('dialog', { name: 'Đề nghị tham gia' });
  await sheet.getByLabel('Thương hiệu hoặc địa điểm').fill('Ravolution Drinks');
  await sheet.getByLabel('Lời nhắn cho chủ dự án').fill('We can cover the bar.');
  await sheet.getByRole('button', { name: 'Gửi đề nghị' }).click();
  await expect(brand.getByText(/Bạn đã đề nghị: Tài trợ · đang chờ/)).toBeVisible();

  // The owner accepts, and now sees how to reach them.
  await page.goto(`/p/${slug}/manage`);
  const offer = page.locator('li', { hasText: 'Ravolution Drinks' });
  await offer.getByRole('button', { name: 'Nhận' }).click();
  await expect(offer.getByText(/Liên hệ: team@ravolution\.vn/)).toBeVisible();
  await brand.close();
});

test('"Đăng sự kiện" goes straight to the wizard; "Dự án" is in the footer and "Tôi", split by what projects look for', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  // No sheet asking what to post (owner, 2026-10-17): a project starts from /p.
  await expect(page.getByRole('banner').getByRole('link', { name: 'Đăng sự kiện' })).toHaveAttribute('href', '/studio/new');
  await page.getByRole('contentinfo').getByRole('link', { name: 'Dự án' }).click();
  await expect(page).toHaveURL(/\/p$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Dự án đang kêu gọi' })).toBeVisible();
  await expect(page.getByRole('tablist', { name: 'Đang tìm' }).getByRole('tab', { name: /^Nghệ sĩ/ })).toBeVisible();
  // In English at ?lang=en, as every page.
  await page.goto('/p?lang=en');
  await expect(page.getByRole('heading', { level: 1, name: 'Projects looking for backers' })).toBeVisible();
});
