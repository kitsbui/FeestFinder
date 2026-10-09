import { expect, test, type Page } from '@playwright/test';
import { expectOps, signInWith } from './checks.ts';

/*
 * Every /ops route on the demo data (test/fixtures/seed.ts): it boots, shows what it
 * names, and breaks nothing on the way (see checks.ts).
 */

type Account = 'organizer' | 'admin';
const ACCOUNTS: Record<Account, { identifier: string; password: string }> = {
  organizer: { identifier: 'team@ravolution.vn', password: 'ravolution2026' },
  admin: { identifier: 'admin@feestfinder.com', password: 'festfinder-admin' },
};

async function signIn(page: Page, who: Account) {
  await signInWith(page, ACCOUNTS[who]);
}

test.describe('Ops', () => {
  test('/ops signed out shows the team sign-in', async ({ page }) => expectOps(page, '/ops', /Đăng nhập khu vận hành/));
  test('/ops/org signed out shows the organizer sign-in', async ({ page }) => expectOps(page, '/ops/org', /Đăng nhập cho nhà tổ chức/));
  test('every icon the shell links to loads', async ({ page, request }) => {
    await expectOps(page, '/ops', /Đăng nhập khu vận hành/);
    const icons = await page.locator('link[rel~="icon"], link[rel="apple-touch-icon"]').evaluateAll((links) => links.map((l) => l.getAttribute('href') ?? ''));
    expect(icons.length, 'the ICO, the SVG and the touch icon').toBeGreaterThanOrEqual(3);
    // Browsers also ask for /favicon.ico on their own.
    for (const href of [...icons, '/favicon.ico']) {
      const res = await request.get(href);
      expect(res.status(), href).toBe(200);
      expect(res.headers()['content-type'], href).toMatch(/^image\//);
    }
  });

  test.describe('team', () => {
    test.beforeEach(async ({ page }) => signIn(page, 'admin'));
    const routes: [string, RegExp][] = [
      ['/ops', /Việc cần làm/],
      ['/ops/review', /Duyệt tin đăng/],
      ['/ops/claims', /Hồ sơ nghệ sĩ & BTC/],
      ['/ops/claims?what=profiles', /Không có yêu cầu nào|Duyệt/],
      ['/ops/artists', /Hoaprox/],
      ['/ops/artists?tab=gear', /Không có gì chờ duyệt|Duyệt/],
      ['/ops/events', /Đặc điểm/],
      ['/ops/events/new', /Đăng ngay sau khi tạo/],
      ['/ops/reports', /Báo cáo người dùng/],
      ['/ops/organizers', /Thêm nhà tổ chức/],
      ['/ops/venues', /Thêm địa điểm/],
      ['/ops/sources', /Thêm nguồn/],
      ['/ops/partners', /Đối tác bán vé/],
      ['/ops/brands', /Chiến dịch thương hiệu/],
      ['/ops/affiliate', /Vị trí bấm/],
      ['/ops/affiliate?tab=links', /Thêm liên kết/],
      ['/ops/affiliate?tab=payouts', /Chốt kỳ thanh toán/],
      ['/ops/featured', /Thêm dãy/],
      ['/ops/users', /Đăng ký qua/],
      ['/ops/orders', /Chờ thanh toán/i],
      ['/ops/audit', /Chuỗi hash hợp lệ/i],
    ];
    for (const [path, shows] of routes) {
      test(`${path}`, async ({ page }) => expectOps(page, path, shows, path === '/ops/review' ? /^\/ops\/review(\/[0-9a-f-]{36})?$/ : path.split('?')[0]));
    }
    test('adds a ticket partner and shows its report token once', async ({ page }) => {
      await expectOps(page, '/ops/partners', /Đối tác bán vé/);
      await page.getByRole('button', { name: 'Thêm đối tác' }).first().click();
      await page.getByPlaceholder('Ticketbox', { exact: true }).fill('Megatix');
      await page.getByPlaceholder('ticketbox.vn', { exact: true }).fill('megatix.vn');
      await page.getByPlaceholder('ticketbox.vn', { exact: true }).press('Enter');
      await page.locator('.op-drawer').getByRole('button', { name: 'Thêm đối tác' }).click();
      await expect(page.getByText('Mã chỉ hiện một lần.')).toBeVisible();
      await page.getByRole('button', { name: 'Đã lưu mã' }).click();
      await expect(page.getByRole('row').filter({ hasText: 'megatix.vn' })).toHaveCount(1);
    });
    test('organizer mode explains an admin account has no organizer team', async ({ page }) =>
      expectOps(page, '/ops/org', /chưa thuộc nhà tổ chức nào/));
  });

  test.describe('organizer', () => {
    test.beforeEach(async ({ page }) => signIn(page, 'organizer'));
    const routes: [string, RegExp][] = [
      ['/ops/org', /Cần bạn xử lý/],
      ['/ops/org/events', /Sự kiện của tôi/],
      ['/ops/org/events/new', /Thông tin cơ bản/],
      ['/ops/org/inbox', /Hộp thư kiểm duyệt/],
      ['/ops/org/profile', /Hồ sơ doanh nghiệp/],
      ['/ops/org/gigs', /Gig đã đăng/],
      ['/ops/org/gigs?tab=inquiries', /Mời nghệ sĩ/],
    ];
    for (const [path, shows] of routes) {
      test(`${path}`, async ({ page }) => expectOps(page, path, shows, path === '/ops/org/inbox' ? /^\/ops\/org\/inbox(\/[0-9a-f-]{36})?$/ : path.split('?')[0]));
    }
    test('/ops sends an organizer account to organizer mode', async ({ page }) => expectOps(page, '/ops', /Cần bạn xử lý/, '/ops/org'));
  });

  test.describe('artist', () => {
    // The test API's Google stand-in signs in the same account every time; on the Next run,
    // e2e/next/event.spec.ts has already made it an artist.
    test.beforeEach(async ({ page, baseURL }) => {
      const start = await page.request.get(`/auth/oauth/google/start?redirectUri=${encodeURIComponent(new URL('/ops/artist', baseURL).href)}`);
      const { url } = await start.json();
      // The way back sets the session; its redirect is not followed.
      const back = await page.request.get(url, { maxRedirects: 0 });
      expect(back.headers().location, 'signed in with Google').toContain('auth=google');
      const who = await (await page.request.get('/auth/session')).json();
      if (who.roles.artist !== 'active') {
        const made = await page.request.post('/me/roles/artist', { data: { stageName: `Night Owl ${Date.now() % 100000}` } });
        expect(made.ok(), 'artist profile').toBeTruthy();
      }
    });
    const routes: [string, RegExp][] = [
      ['/ops/artist', /Nghệ danh/],
      ['/ops/artist/gigs', /Báo lịch diễn/],
      ['/ops/artist/gear', /Thêm từ danh mục/],
      ['/ops/artist/opportunities', /Gig đang mở/],
      ['/ops/artist/opportunities?tab=dates', /Thêm khoảng/],
      ['/ops/artist/opportunities?tab=brands', /Nhận hợp tác thương hiệu/],
    ];
    for (const [path, shows] of routes) {
      test(`${path}`, async ({ page }) => expectOps(page, path, shows, path.split('?')[0]));
    }
    test('reports a gig, which waits for a moderator with them on its lineup', async ({ page }) => {
      await expectOps(page, '/ops/artist/gigs', /Báo lịch diễn/);
      const sent = await page.request.post('/me/artist/gigs', { data: { title: 'Owl warehouse', startsOn: '2027-03-06', city: 'ho-chi-minh', venueName: 'Lot 9' } });
      expect(sent.ok(), 'gig report').toBeTruthy();
      await page.reload();
      await expect(page.getByRole('row').filter({ hasText: 'Owl warehouse' }).first()).toContainText('Có tên bạn');
    });
    test('an artist account is not an admin', async ({ page }) => {
      expect((await page.request.get('/admin/counts')).status()).toBe(403);
    });
  });
});
