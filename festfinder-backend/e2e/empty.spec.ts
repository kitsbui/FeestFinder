import { test } from '@playwright/test';
import { EMPTY_ACCOUNTS } from '../test/fixtures/empty-accounts.ts';
import { expectOps, expectScreen, signInWith } from './checks.ts';

/*
 * The same routes on a database the way production starts (test/fixtures/empty.ts): no
 * events, no venues, an organiser with no listings. Every screen still has to come up
 * clean with nothing to show.
 */
test.use({ baseURL: `http://localhost:${Number(process.env.EMPTY_PORT ?? 4101)}` });

test.describe('Web, empty', () => {
  const routes: [string, RegExp][] = [
    ['/', /Explore/],
    ['/map', /EVENTS NEAR YOU/i],
    ['/about', /ABOUT FEESTFINDER/i],
    ['/vi/ho-chi-minh/this-weekend', /Cuối tuần này chưa có sự kiện nào/],
    ['/en/ho-chi-minh/this-weekend', /Nothing is on this weekend yet/],
  ];
  for (const [path, shows] of routes) {
    test(`${path}`, async ({ page }) => expectScreen(page, path, shows));
  }
});

test.describe('App, empty', () => {
  test('/app signed out', async ({ page }) => expectScreen(page, '/app', /AROUND YOU/i));

  test.describe('signed in', () => {
    test.beforeEach(async ({ page }) => signInWith(page, EMPTY_ACCOUNTS.attendee));
    const routes: [string, RegExp][] = [
      ['/app', /HAPPENING/i],
      ['/app/saved', /SAVED EVENTS|NOTHING SAVED/i],
      ['/app/profile', /YOU'RE INTO/i],
      ['/app/tickets', /MY TICKETS/i],
    ];
    for (const [path, shows] of routes) {
      test(`${path}`, async ({ page }) => expectScreen(page, path, shows));
    }
  });
});

test.describe('Organizer, empty', () => {
  test.beforeEach(async ({ page }) => signInWith(page, EMPTY_ACCOUNTS.organizer));
  const routes: [string, RegExp][] = [
    ['/studio', /ORGANIZER DASHBOARD/i],
    ['/studio/new', /PUT YOUR EVENT IN FRONT/i],
    ['/studio/attendees', /AFTER THE SALE/i],
    ['/studio/announce', /REACH YOUR CROWD/i],
    ['/studio/door', /CHECK TICKET/i],
    ['/studio/promos', /PROMOS & GUEST LIST/i],
    ['/studio/revenue', /REVENUE & PAYOUTS/i],
    ['/studio/inbox', /MESSAGES FROM FEESTFINDER/i],
  ];
  for (const [path, shows] of routes) {
    test(`${path}`, async ({ page }) => expectScreen(page, path, shows));
  }
});

test.describe('Admin, empty', () => {
  test.beforeEach(async ({ page }) => signInWith(page, EMPTY_ACCOUNTS.admin));
  const routes: [string, RegExp][] = [
    ['/console', /MODERATION QUEUE/i],
    ['/console/verification', /ORGANIZER VERIFICATION/i],
    ['/console/reports', /USER REPORTS/i],
    ['/console/featured', /FEATURED SHELVES/i],
    ['/console/ads', /ADS & PARTNERS/i],
    ['/console/insights', /PLATFORM NUMBERS/i],
    ['/console/audit', /AUDIT LOG/i],
    ['/console/appeals', /AFTER REJECTION/i],
  ];
  for (const [path, shows] of routes) {
    test(`${path}`, async ({ page }) => expectScreen(page, path, shows));
  }
});

test.describe('Ops, empty', () => {
  test.describe('team', () => {
    test.beforeEach(async ({ page }) => signInWith(page, EMPTY_ACCOUNTS.admin));
    const routes: [string, RegExp][] = [
      ['/ops', /Việc cần làm/],
      ['/ops/review', /Duyệt tin đăng/],
      ['/ops/events', /Đặc điểm/],
      ['/ops/events/new', /Đăng ngay sau khi tạo/],
      ['/ops/reports', /Báo cáo người dùng/],
      ['/ops/organizers', /Thêm nhà tổ chức/],
      ['/ops/venues', /Thêm địa điểm/],
      ['/ops/featured', /Thêm dãy/],
      ['/ops/users', /Đăng ký qua/],
      ['/ops/orders', /Chờ thanh toán/i],
      ['/ops/audit', /Chuỗi hash hợp lệ/i],
    ];
    for (const [path, shows] of routes) {
      test(`${path}`, async ({ page }) => expectOps(page, path, shows));
    }
  });

  test.describe('organizer', () => {
    test.beforeEach(async ({ page }) => signInWith(page, EMPTY_ACCOUNTS.organizer));
    const routes: [string, RegExp][] = [
      ['/ops/org', /Cần bạn xử lý|Tạo sự kiện/],
      ['/ops/org/events', /Sự kiện của tôi/],
      ['/ops/org/events/new', /Thông tin cơ bản/],
      ['/ops/org/inbox', /Hộp thư kiểm duyệt/],
      ['/ops/org/profile', /Hồ sơ doanh nghiệp/],
    ];
    for (const [path, shows] of routes) {
      test(`${path}`, async ({ page }) => expectOps(page, path, shows));
    }
  });
});
