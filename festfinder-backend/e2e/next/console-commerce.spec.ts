import { expect, test, type Page } from '@playwright/test';
import { signInWith, watch } from '../checks.ts';

/*
 * The Console's commerce screens (festfinder-web/src/kd/console/{users,orders,partners,
 * affiliate,brands}), signed in as the demo admin. Nothing here refunds or pays out a seeded
 * order (other specs show the demo attendee's tickets); one synthetic account is made an admin
 * and put back; partners, links and campaigns are new ones with names of their own.
 */

const ADMIN = { identifier: 'admin@feestfinder.com', password: 'festfinder-admin' };

async function open(page: Page, path: string) {
  const problems = watch(page);
  await page.goto(path);
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  return problems;
}

const stamp = () => Date.now().toString(36);

test.describe('the Console: accounts, orders and partners', () => {
  test.beforeEach(async ({ page }) => signInWith(page, ADMIN));

  test('accounts: filter, open one, follow a recent order', async ({ page }) => {
    const problems = await open(page, '/console/users');
    await expect(page.getByRole('heading', { level: 1, name: 'Người dùng' })).toBeVisible();

    // The kind filter is in the address and narrows the list to the admin.
    await page.getByRole('button', { name: 'Loại tài khoản' }).click();
    await page.getByRole('menuitemradio', { name: 'Admin' }).click();
    await expect(page).toHaveURL(/kind=admin/);
    await expect(page.getByRole('row', { name: /admin@feestfinder\.com/ })).toBeVisible();
    await expect(page.getByRole('row', { name: /minh@example\.com/ })).toHaveCount(0);
    // Your own account has no role buttons.
    await page.getByRole('row', { name: /admin@feestfinder\.com/ }).click();
    const self = page.getByRole('dialog', { name: 'FeestFinder Admin' });
    await expect(self).toBeVisible();
    await expect(self.getByRole('button', { name: /quyền admin/ })).toHaveCount(0);
    await self.getByRole('button', { name: 'Đóng' }).click();

    // Reset, then search.
    await page.getByRole('button', { name: 'Đặt lại' }).click();
    await expect(page).not.toHaveURL(/kind=/);
    await page.getByRole('searchbox', { name: 'Tìm tài khoản' }).fill('minh@example.com');
    await expect(page).toHaveURL(/q=minh%40example\.com/);
    await page.getByRole('row', { name: /minh@example\.com/ }).click();
    await expect(page).toHaveURL(/[?&]id=/);
    const drawer = page.getByRole('dialog', { name: 'Minh Anh' });
    await expect(drawer.getByRole('heading', { name: 'Đơn hàng gần đây' })).toBeVisible();
    await drawer.getByRole('link', { name: /FFDEMO22/ }).click();
    await expect(page).toHaveURL(/\/console\/orders\?id=/);
    await expect(page.getByRole('dialog', { name: 'FFDEMO22' })).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('accounts: the drawer cannot grant admin, which comes only from ADMIN_EMAIL', async ({ page }) => {
    const { items } = await (await page.request.get('/admin/users?q=guest1%40example.com&kind=attendee')).json();
    const guest = items[0] as { id: string; name: string; email: string };
    await open(page, '/console/users/' + guest.id);
    await expect(page).toHaveURL(new RegExp(`/console/users\\?id=${guest.id}`));
    const drawer = page.getByRole('dialog', { name: guest.name });
    await expect(drawer.getByRole('heading', { name: 'Đơn hàng gần đây' })).toBeVisible();
    await expect(drawer.getByRole('button', { name: /quyền admin/i })).toHaveCount(0);
    expect((await page.request.patch('/admin/users/' + guest.id, { data: { role: 'admin' } })).status()).toBe(404);
  });

  test('orders: tiles, search, the event filter, and the refund asks for a reason', async ({ page }) => {
    const problems = await open(page, '/console/orders');
    await expect(page.getByRole('heading', { level: 1, name: 'Đơn hàng' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Đơn bán vé' })).toHaveAttribute('aria-selected', 'true');

    // A tile toggles its status.
    const refunded = page.getByRole('button', { name: /^Đã hoàn tiền/ });
    await refunded.click();
    await expect(refunded).toHaveAttribute('aria-pressed', 'true');
    await expect(page).toHaveURL(/status=refunded/);
    await expect(page.getByRole('row').filter({ hasText: 'Đã thanh toán' })).toHaveCount(0);
    await refunded.click();
    await expect(page).not.toHaveURL(/status=/);

    // The events screen links here with ?event=&eventLabel=.
    const ev = (await (await page.request.get('/admin/events?q=Warm-up&limit=5')).json()).items.find((e: { title: string }) => e.title === 'Ravolution Warm-up · Rooftop');
    await page.goto(`/console/orders?event=${ev.id}&eventLabel=${encodeURIComponent(ev.title)}`);
    await expect(page.getByText('Ravolution Warm-up · Rooftop').first()).toBeVisible();
    await expect(page.getByRole('row', { name: /^RW-/ }).first()).toBeVisible();
    await expect(page.getByRole('row', { name: /^RV-/ })).toHaveCount(0);

    // Search, open, and the refund needs a reason (cancelled here: other specs use this order).
    await page.goto('/console/orders');
    await page.getByRole('searchbox', { name: 'Tìm đơn hàng' }).fill('FFDEMO22');
    await expect(page).toHaveURL(/q=FFDEMO22/);
    await page.getByRole('row', { name: /FFDEMO22/ }).click();
    const drawer = page.getByRole('dialog', { name: 'FFDEMO22' });
    await expect(drawer.getByText('FF-RAVO-DEM1')).toBeVisible();
    await expect(drawer.getByRole('link', { name: 'Mở sự kiện' })).toHaveAttribute('href', /\/console\/events\//);
    await drawer.getByRole('button', { name: 'Hoàn tiền' }).click();
    const ask = page.getByRole('alertdialog', { name: 'Hoàn tiền đơn FFDEMO22?' });
    await ask.getByRole('button', { name: 'Hoàn tiền' }).click();
    await expect(ask.getByRole('alert')).toHaveText('Hãy viết ghi chú trước');
    await ask.getByRole('button', { name: 'Huỷ' }).click();
    const order = (await (await page.request.get('/admin/orders?q=FFDEMO22')).json()).items[0];
    expect(order.status).toBe('paid');
    expect(problems).toEqual([]);
  });

  test('orders: the resale tab and its states', async ({ page }) => {
    const problems = await open(page, '/console/orders?view=resale');
    await expect(page.getByRole('tab', { name: 'Pass vé' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('table', { name: 'Giao dịch pass vé' }).or(page.getByText('Không có giao dịch'))).toBeVisible();
    await page.getByRole('button', { name: 'Trạng thái' }).click();
    await page.getByRole('menuitemradio', { name: 'Cần hoàn cho người mua' }).click();
    await expect(page).toHaveURL(/rs=failed/);
    await expect(page.getByRole('table', { name: 'Giao dịch pass vé' }).or(page.getByText('Không có giao dịch'))).toBeVisible();
    await page.getByRole('tab', { name: 'Đơn bán vé' }).click();
    await expect(page).not.toHaveURL(/view=resale/);
    expect(problems).toEqual([]);
  });

  test('partners: add one, see its token once', async ({ page }) => {
    const problems = await open(page, '/console/partners');
    await expect(page.getByRole('heading', { level: 1, name: 'Đối tác bán vé' })).toBeVisible();
    const name = 'E2E Tickets ' + stamp();
    await page.getByRole('button', { name: 'Thêm đối tác', exact: true }).click();
    const form = page.getByRole('dialog', { name: 'Thêm đối tác bán vé' });
    await form.getByLabel('Tên', { exact: true }).fill(name);
    await form.getByLabel('Trang bán vé').fill('e2e-tickets.vn');
    await form.getByRole('button', { name: 'Thêm trang' }).click();
    await expect(form.getByRole('button', { name: 'Bỏ e2e-tickets.vn' })).toBeVisible();
    await form.getByLabel('Hoa hồng (%)').fill('7');
    // The network link must wrap {url}.
    await form.getByLabel(/Link theo dõi/).fill('https://network.example/click');
    await expect(form.getByRole('button', { name: 'Thêm đối tác', exact: true })).toBeDisabled();
    await form.getByLabel(/Link theo dõi/).fill('https://network.example/click?url={url}');
    await form.getByRole('button', { name: 'Thêm đối tác', exact: true }).click();

    const sheet = page.getByRole('dialog', { name: 'Mã nhận báo cáo bán vé' });
    await expect(sheet.getByText('Mã chỉ hiện một lần.')).toBeVisible();
    await expect(sheet.getByRole('textbox', { name: 'Mã', exact: true })).not.toHaveValue('');
    await expect(sheet.getByRole('textbox', { name: 'Địa chỉ gửi cho đối tác' })).toHaveValue(/postback\?token=(?!TOKEN)/);
    await sheet.getByRole('button', { name: 'Đã lưu mã' }).click();
    await expect(sheet).toBeHidden();

    // The partner is listed; its detail never shows the token again.
    const row = page.getByRole('row', { name: new RegExp(name) });
    await expect(row).toContainText('7%');
    await row.click();
    const detail = page.getByRole('dialog', { name });
    await expect(detail.getByRole('tab', { name: /Đơn bán/ })).toBeVisible();
    await expect(detail.getByText('Chưa có đơn nào')).toBeVisible();
    await expect(page.getByText('Mã chỉ hiện một lần.')).toHaveCount(0);
    const { items } = await (await page.request.get('/admin/partners')).json();
    const made = items.find((p: { name: string }) => p.name === name);
    expect(made.hosts).toEqual(['e2e-tickets.vn']);
    expect(made.linkTemplate).toBe('https://network.example/click?url={url}');
    expect(made.token).toBeUndefined();
    expect(problems).toEqual([]);
  });

  test('affiliate: the tabs are in the address; add a link', async ({ page }) => {
    const problems = await open(page, '/console/affiliate');
    await expect(page.getByRole('tab', { name: 'Tổng quan' })).toHaveAttribute('aria-selected', 'true');
    await page.getByRole('button', { name: 'Khoảng thời gian' }).click();
    await page.getByRole('menuitemradio', { name: '7 ngày' }).click();
    await expect(page).toHaveURL(/days=7/);
    await expect(page.getByRole('region', { name: 'Thiết bị' })).toBeVisible();

    await page.getByRole('tab', { name: 'Liên kết' }).click();
    await expect(page).toHaveURL(/tab=links/);
    const code = 'e2e-' + stamp();
    await page.getByRole('button', { name: 'Thêm liên kết' }).click();
    const form = page.getByRole('dialog', { name: 'Thêm liên kết' });
    await form.getByLabel('Tên', { exact: true }).fill('E2E merch drop');
    await form.getByLabel('Đích đến').fill('https://shop.example.com/merch');
    await form.getByLabel(/^Mã/).fill(code);
    await form.getByLabel('Loại').selectOption('product');
    await form.getByRole('button', { name: 'Lưu' }).click();
    await expect(form).toBeHidden();
    await expect(page.getByRole('button', { name: `Chép liên kết ${code}` })).toBeVisible();
    const { items } = await (await page.request.get('/admin/affiliate/links')).json();
    expect(items.find((l: { code: string }) => l.code === code)).toMatchObject({ label: 'E2E merch drop', kind: 'product', enabled: true });

    await page.getByRole('tab', { name: 'Thanh toán' }).click();
    await expect(page).toHaveURL(/tab=payouts/);
    await expect(page.getByRole('region', { name: 'Chốt kỳ thanh toán' })).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('brands: create a campaign, then open its interests', async ({ page }) => {
    const problems = await open(page, '/console/brands');
    await expect(page.getByRole('heading', { level: 1, name: 'Chiến dịch thương hiệu' })).toBeVisible();
    const { cities, styles } = await (await page.request.get('/meta/form-options')).json();
    const title = 'E2E night series ' + stamp();
    await page.getByRole('button', { name: 'Chiến dịch mới' }).click();
    const form = page.getByRole('dialog', { name: 'Chiến dịch mới' });
    await form.getByLabel('Thương hiệu').fill('E2E Energy');
    await form.getByLabel('Tiêu đề').fill(title);
    await form.getByLabel(/^Thành phố/).selectOption(cities[0].value);
    await form.getByLabel(/^Dòng nhạc/).selectOption(styles[0].value);
    await expect(form.getByRole('button', { name: `Bỏ ${cities[0].label.vi} · ${cities[0].currency}` })).toBeVisible();
    await form.getByLabel(/^Phí từ/).fill('2000000');
    await form.getByLabel(/^Phí đến/).fill('1000000');
    await expect(form.getByRole('alert')).toHaveText('Mức phí tối đa thấp hơn mức tối thiểu');
    await expect(form.getByRole('button', { name: 'Lưu' })).toBeDisabled();
    await form.getByLabel(/^Phí đến/).fill('5000000');
    await form.getByRole('button', { name: 'Lưu' }).click();
    await expect(form).toBeHidden();

    const row = page.getByRole('row', { name: new RegExp(title) });
    await expect(row).toContainText('Đang mở');
    const { items } = await (await page.request.get('/admin/brand-campaigns')).json();
    expect(items.find((c: { title: string }) => c.title === title)).toMatchObject({ brandName: 'E2E Energy', feeMin: 2000000, feeMax: 5000000, currency: cities[0].currency });
    // The row's button is named by what it shows (the title first), then what it opens.
    await row.getByRole('button', { name: /nghệ sĩ quan tâm$/ }).click();
    await expect(page.getByRole('dialog', { name: title }).getByText('Chưa có nghệ sĩ quan tâm')).toBeVisible();
    expect(problems).toEqual([]);
  });
});
