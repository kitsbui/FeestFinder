import { expect, request, test, type APIRequestContext, type Page } from '@playwright/test';
import { signInWith, watch } from '../checks.ts';

/*
 * The artist studio in Kính đêm (festfinder-web/src/kd/artist): the artist mode of /ops at
 * /studio/artist. The demo data has no artist account, so each test signs up a new one by email
 * (the test API hands back the code) and makes it an artist; the demo organiser posts the gig and
 * sends the booking request, and the demo admin opens the brand campaign. Everything here is
 * created, never deleted: other specs see one more open gig and one more campaign.
 */

const ADMIN = { identifier: 'admin@feestfinder.com', password: 'festfinder-admin' };
const ATTENDEE = { identifier: 'minh@example.com', password: 'festfinder123' };
const ORGANIZER = { identifier: 'team@ravolution.vn', password: 'ravolution2026' };
const CITY = 'ho-chi-minh';

const stamp = () => String(Date.now() % 1_000_000);

async function open(page: Page, path: string) {
  const problems = watch(page);
  await page.goto(path);
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  return problems;
}

/** A new account by email that starts an artist profile; the page is signed in as it. */
async function newArtist(page: Page) {
  const n = stamp();
  const email = `artist${n}@example.com`;
  const start = await (await page.request.post('/auth/otp/start', { data: { channel: 'email', identifier: email } })).json();
  const verify = await (await page.request.post('/auth/otp/verify', { data: { challengeId: start.challengeId, code: start.devCode } })).json();
  const done = await page.request.post('/auth/password', { data: { token: verify.signupToken, password: 'longenough1', passwordConfirm: 'longenough1' } });
  expect(done.ok(), 'sign up as ' + email).toBeTruthy();
  const name = `Studio Owl ${n}`;
  expect((await page.request.post('/me/roles/artist', { data: { stageName: name, roles: ['dj'] } })).ok(), 'artist profile').toBeTruthy();
  const session = await (await page.request.get('/auth/session')).json();
  return { name, id: session.artist.id as string, slug: session.artist.slug as string };
}

/** Proves a phone number for the page's account (the test API hands back the code), as publishing needs. */
async function confirmPhone(page: Page) {
  const phone = '09' + String(Date.now()).slice(-8);
  const start = await (await page.request.post('/me/connections/zalo/start', { data: { phone } })).json();
  expect((await page.request.post('/me/connections/zalo/verify', { data: { challengeId: start.challengeId, code: start.devCode } })).ok(), 'confirm phone').toBeTruthy();
}

/** Another person's API session (the organiser, the admin), beside the artist's page. */
async function as(baseURL: string | undefined, account: { identifier: string; password: string }): Promise<APIRequestContext> {
  const ctx = await request.newContext({ baseURL });
  expect((await ctx.post('/auth/login', { data: account })).ok(), 'sign in as ' + account.identifier).toBeTruthy();
  return ctx;
}

test('one craft per account: from performing to organising and back, both profiles kept', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  const me = await newArtist(page);
  await open(page, '/');
  await page.getByRole('button', { name: 'Tài khoản' }).click();
  const menu = page.getByRole('menu', { name: 'Tài khoản' });
  await expect(menu.getByRole('menuitemradio', { name: 'Người tham dự' })).toHaveAttribute('aria-checked', 'true');
  await expect(menu.getByRole('menuitem', { name: 'Nghệ sĩ', exact: true })).toHaveAttribute('href', '/studio/artist');
  await menu.getByRole('menuitem', { name: 'Đổi sang Nhà tổ chức' }).click();
  // The picker says what switching does, then starts the organiser that does not exist yet.
  const sheet = page.getByRole('dialog');
  await expect(sheet.getByText('Mỗi tài khoản một vai nghề')).toBeVisible();
  await sheet.getByRole('button', { name: 'Đổi sang Nhà tổ chức' }).click();
  await sheet.getByLabel('Tên nhà tổ chức').fill(`Owl Nights ${stamp()}`);
  await sheet.getByRole('button', { name: 'Tạo hồ sơ' }).click();
  await expect(page).toHaveURL(/\/studio$/);
  // From Studio's rail back to performing: one step, the artist profile is still there.
  await page.getByRole('button', { name: 'Đổi sang Nghệ sĩ' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Đổi sang Nghệ sĩ' }).click();
  await expect(page).toHaveURL(/\/studio\/artist$/);
  await expect(page.getByText(me.name).first()).toBeVisible();
  const session = await (await page.request.get('/auth/session')).json();
  expect([session.craft, session.roles.artist, session.roles.organizer]).toEqual(['artist', 'active', 'disabled']);
});

test('signed out, the artist studio asks to log in', async ({ page }) => {
  await open(page, '/studio/artist');
  await expect(page.locator('[data-ff-gate]')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Đăng nhập để quản lý hồ sơ nghệ sĩ' })).toBeVisible();
});

test('an account that is not an artist is offered the artist profile', async ({ page }) => {
  await signInWith(page, ATTENDEE);
  const problems = await open(page, '/studio/artist/gigs');
  await expect(page.getByRole('heading', { name: 'Tài khoản này chưa có hồ sơ nghệ sĩ' })).toBeVisible();
  await page.getByRole('button', { name: 'Tạo hồ sơ nghệ sĩ' }).click();
  // The role picker opens at the artist step.
  await expect(page.getByLabel('Nghệ danh')).toBeVisible();
  expect(problems).toEqual([]);
});

test.describe('the artist studio, signed in', () => {
  test('the profile saves, and the rail names the artist', async ({ page }) => {
    const me = await newArtist(page);
    const problems = await open(page, '/studio/artist');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(me.name);
    const rail = page.getByRole('navigation', { name: 'Studio nghệ sĩ' });
    await expect(rail.getByRole('link', { name: new RegExp(me.name) })).toHaveAttribute('href', '/a/' + me.slug);
    await expect(rail.getByRole('link', { name: 'Hồ sơ nghệ sĩ' })).toHaveAttribute('aria-current', 'page');

    await page.getByLabel('Giới thiệu (tiếng Việt)').fill('DJ ở Sài Gòn, chơi melodic techno.');
    await page.getByRole('button', { name: 'Producer', exact: true }).click();
    await page.getByLabel('Hoạt động từ năm').fill('2018');
    await page.getByRole('switch', { name: 'Nhận hợp tác thương hiệu' }).click();
    await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
    await expect(page.getByRole('status')).toContainText('Đã lưu hồ sơ');
    await expect(page.getByRole('button', { name: 'Đã lưu', exact: true })).toBeDisabled();

    const { profile } = await (await page.request.get('/me/artist')).json();
    expect(profile.bio.vi).toBe('DJ ở Sài Gòn, chơi melodic techno.');
    expect(profile.roles).toEqual(['dj', 'producer']);
    expect(profile.activeSince).toBe(2018);
    expect(profile.openToBrands).toBe(true);

    // A link that is not what it says comes back on its field.
    await page.getByLabel('Website').fill('not a link');
    await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
    await expect(page.getByText('Link cần bắt đầu bằng https://')).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('applies to an open gig, sees it under applications and withdraws it', async ({ page, baseURL }) => {
    await newArtist(page);
    const title = `Rooftop warm-up slot ${stamp()}`;
    const org = await as(baseURL, ORGANIZER);
    expect((await org.post('/organizer/gigs', { data: { title, city: CITY, startsOn: '2026-11-21', feeMin: 3000000, feeMax: 5000000, gigType: 'club' } })).ok(), 'gig posted').toBeTruthy();

    const problems = await open(page, '/studio/artist/opportunities');
    await expect(page.getByRole('tab', { name: 'Gig đang mở' })).toHaveAttribute('aria-selected', 'true');
    const row = page.getByRole('row').filter({ hasText: title });
    await row.getByRole('button', { name: `Ứng tuyển · ${title}` }).click();
    const sheet = page.getByRole('dialog', { name: title });
    await sheet.getByLabel('Lời nhắn').fill('Melodic techno, 90 phút.');
    await sheet.getByRole('button', { name: 'Gửi hồ sơ' }).click();
    await expect(row).toContainText('Đã gửi');

    await page.getByRole('navigation', { name: 'Studio nghệ sĩ' }).getByRole('link', { name: 'Lịch diễn & booking' }).click();
    await expect(page).toHaveURL(/\/studio\/artist\/gigs$/);
    const mine = page.getByRole('row').filter({ hasText: title });
    await expect(mine).toContainText('Đã gửi');
    await mine.getByRole('button', { name: `Rút · ${title}` }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Rút', exact: true }).click();
    await expect(mine).toContainText('Đã rút');
    const { items } = await (await page.request.get('/me/artist/applications')).json();
    expect(items.find((a: { gig: { title: string } }) => a.gig.title === title).status).toBe('withdrawn');
    await org.dispose();
    expect(problems).toEqual([]);
  });

  test('answers a booking request with a reply', async ({ page, baseURL }) => {
    const me = await newArtist(page);
    const message = `Chơi closing set đêm 12.12? ${stamp()}`;
    const org = await as(baseURL, ORGANIZER);
    expect((await org.post('/organizer/inquiries', { data: { artistId: me.id, eventOn: '2026-12-12', city: CITY, message, feeOffer: 8000000 } })).ok(), 'request sent').toBeTruthy();

    const problems = await open(page, '/studio/artist/gigs?tab=requests');
    await expect(page.getByRole('tab', { name: 'Lời mời' })).toHaveAttribute('aria-selected', 'true');
    const row = page.getByRole('row').filter({ hasText: message });
    await row.getByRole('button', { name: /^Trả lời · / }).click();
    const sheet = page.getByRole('dialog');
    await sheet.getByLabel('Trả lời').fill('Được, mình rảnh hôm đó.');
    await sheet.getByRole('button', { name: 'Đồng ý trao đổi', exact: true }).click();
    await expect(row).toContainText('Được, mình rảnh hôm đó.');
    await expect(row.getByRole('button')).toHaveCount(0);

    const { items } = await (await org.get('/organizer/inquiries')).json();
    const sent = items.find((i: { message: string }) => i.message === message);
    expect(sent.status).toBe('accepted');
    expect(sent.reply).toBe('Được, mình rảnh hôm đó.');
    await org.dispose();
    expect(problems).toEqual([]);
  });

  test('brand campaigns: closed until the profile is open to brands, then interest is sent', async ({ page, baseURL }) => {
    await newArtist(page);
    const title = `Night run ${stamp()}`;
    const admin = await as(baseURL, ADMIN);
    expect((await admin.post('/admin/brand-campaigns', { data: { brandName: 'Owl Audio', title, cities: [CITY], feeMin: 2000000, status: 'open' } })).ok(), 'campaign').toBeTruthy();

    const problems = await open(page, '/studio/artist/opportunities?tab=brands');
    await expect(page.getByText('Bật "Nhận hợp tác thương hiệu" trong hồ sơ để xem chiến dịch')).toBeVisible();
    expect((await page.request.patch('/me/artist', { data: { openToBrands: true } })).ok()).toBeTruthy();

    await page.reload();
    await expect(page.getByRole('tab', { name: 'Thương hiệu' })).toHaveAttribute('aria-selected', 'true');
    const row = page.getByRole('row').filter({ hasText: title });
    await row.getByRole('button', { name: `Quan tâm · Owl Audio · ${title}` }).click();
    const sheet = page.getByRole('dialog', { name: `Owl Audio · ${title}` });
    await sheet.getByLabel('Lời nhắn').fill('Mình chạy bộ mỗi sáng.');
    await sheet.getByRole('button', { name: 'Gửi', exact: true }).click();
    await expect(row).toContainText('Đã gửi');
    const { items } = await (await page.request.get('/me/artist/brand-interests')).json();
    expect(items.some((i: { campaign: { title: string }; status: string }) => i.campaign.title === title && i.status === 'sent')).toBe(true);
    await admin.dispose();
    expect(problems).toEqual([]);
  });

  test('availability, gear suggested for the catalogue, and a reported gig', async ({ page }) => {
    await newArtist(page);
    const problems = await open(page, '/studio/artist/gigs?tab=dates');
    await page.getByRole('button', { name: 'Thêm khoảng' }).click();
    await page.getByLabel('Từ', { exact: true }).fill('2026-12-01');
    await page.getByLabel('Đến', { exact: true }).fill('2026-12-03');
    await page.getByLabel('Trạng thái', { exact: true }).selectOption('unavailable');
    await page.getByRole('button', { name: 'Lưu', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Đã lưu lịch trống');
    const dates = await (await page.request.get('/me/artist/availability')).json();
    expect(dates.items).toEqual([expect.objectContaining({ from: '2026-12-01', to: '2026-12-03', kind: 'unavailable' })]);

    const gig = `Owl warehouse ${stamp()}`;
    await page.getByRole('tab', { name: 'Lịch diễn đã báo' }).click();
    await expect(page).toHaveURL(/tab=report/);
    await page.getByLabel('Tên sự kiện').fill(gig);
    await page.getByLabel('Ngày', { exact: true }).fill('2027-04-10');
    await page.getByLabel('Thành phố', { exact: true }).selectOption(CITY);
    await page.getByLabel('Địa điểm', { exact: true }).fill(`Kho ${stamp()}`);
    await page.getByRole('button', { name: 'Gửi', exact: true }).click();
    await expect(page.getByRole('row').filter({ hasText: gig }).first()).toContainText('Có tên bạn');
    // Still in review: no link to a page that would answer 404.
    await expect(page.getByRole('row').filter({ hasText: gig }).first().getByRole('link', { name: gig })).toHaveCount(0);

    await open(page, '/studio/artist/gear');
    const item = `Owl Box ${stamp()}`;
    await page.getByLabel('Tên', { exact: true }).fill(item);
    await page.getByRole('button', { name: 'Thêm', exact: true }).click();
    const row = page.getByRole('row').filter({ hasText: item });
    await expect(row).toContainText('Chờ duyệt');
    await row.getByLabel(`Dùng cho · ${item}`).selectOption('live');
    await expect.poll(async () => (await (await page.request.get('/me/artist/gear')).json()).items.find((g: { name: string }) => g.name === item)?.usedFor).toBe('live');
    expect(problems).toEqual([]);
  });

  test('the /ops tabs that moved open on the gigs screen', async ({ page }) => {
    await newArtist(page);
    await open(page, '/studio/artist/opportunities?tab=requests');
    await expect(page).toHaveURL(/\/studio\/artist\/gigs\?tab=requests$/);
    await expect(page.getByRole('tab', { name: 'Lời mời' })).toHaveAttribute('aria-selected', 'true');
  });
});

test('mixes: a pasted link is previewed from the service, added, pinned, and shows on the page', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  const me = await newArtist(page);
  await confirmPhone(page);
  const problems = await open(page, '/studio/artist/mixes');
  await expect(page.getByText('Chưa có mix')).toBeVisible();
  await page.getByRole('button', { name: 'Thêm mix' }).click();
  const drawer = page.getByRole('dialog', { name: 'Thêm mix' });
  await drawer.getByLabel('Link SoundCloud, Mixcloud hoặc Spotify').fill('https://www.mixcloud.com/owl/sunrise-set/');
  await drawer.getByRole('button', { name: 'Xem trước' }).click();
  await expect(drawer.locator('iframe')).toHaveAttribute('src', 'https://www.mixcloud.com/widget/iframe/?hide_cover=1&light=0&feed=https%3A%2F%2Fwww.mixcloud.com%2Fowl%2Fsunrise-set%2F&autoplay=0');
  await drawer.getByRole('button', { name: 'Thêm vào trang' }).click();
  await expect(drawer).toHaveCount(0);
  const row = page.getByRole('row').filter({ hasText: 'sunrise set' });
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: 'Ghim lên đầu' }).click();
  await expect(row.getByText('Đã ghim')).toBeVisible();
  expect(((await (await page.request.get(`/artists/${me.slug}`)).json()).mixes as { pinned: boolean }[])[0].pinned).toBe(true);
  expect(problems).toEqual([]);
});
