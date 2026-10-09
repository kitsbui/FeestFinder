import { test } from '@playwright/test';
import { EMPTY_ACCOUNTS } from '../test/fixtures/empty-accounts.ts';
import { expectOps, signInWith } from './checks.ts';

/*
 * The /ops routes on a database the way production starts (test/fixtures/empty.ts): no
 * events, no venues, an organiser with no listings. Every page still has to come up
 * clean with nothing to show.
 */
test.use({ baseURL: `http://localhost:${Number(process.env.EMPTY_PORT ?? 4101)}` });

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
