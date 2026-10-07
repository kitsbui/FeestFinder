import { expect, test, type APIRequestContext, type Browser, type Page } from '@playwright/test';
import { signInWith, watch } from '../checks.ts';

/*
 * /saved in Kính đêm (festfinder-web/src/kd/web/saved): what the compiled screen did there (the
 * saved events, the person's collections as chips, a new one, rename, the public link and its
 * share sheet, delete with a second tap, Back between collections), plus putting an event in and
 * out of a collection from its folder button. Minh's saves and collections are set here and put
 * back after: other specs use the same account.
 */

const ATTENDEE = { identifier: 'minh@example.com', password: 'festfinder123' };
const run = Date.now() % 100000;
const WEEKEND = `Cuối tuần ${run}`;
const RENAMED = `Cuối tuần dài ${run}`;
const FRESH = `Để dành ${run}`;
const MADE_IN_SHEET = `Chợ đêm ${run}`;

const RAVO = 'Ravolution Music Festival';
const OUTCAST = 'Saigon Outcast Night Market';
const PAST = 'Ravolution Music Festival 2025';

let savedBefore = new Set<string>();
const ids: Record<string, string> = {};

/** Minh's request context, signed in. */
async function asMinh(browser: Browser) {
  const ctx = await browser.newContext();
  const res = await ctx.request.post('/auth/login', { data: ATTENDEE });
  expect(res.ok(), 'sign in as Minh').toBeTruthy();
  return ctx;
}

const savedIds = async (r: APIRequestContext) =>
  new Set<string>(((await (await r.get('/me/saves?limit=100')).json()).items as { id: string }[]).map((e) => e.id));

const mineNamed = async (r: APIRequestContext, name: string) =>
  ((await (await r.get('/me/collections')).json()).items as { id: string; name: string; slug: string | null; url: string | null; count: number }[])
    .find((c) => c.name === name);

test.beforeAll(async ({ browser }) => {
  const ctx = await asMinh(browser);
  const r = ctx.request;
  savedBefore = await savedIds(r);
  for (const s of ['ravo', 'outcast', 'ravo-2025']) {
    ids[s] = (await (await r.get('/events/' + s)).json()).id;
    expect((await r.put('/me/saves/' + ids[s])).ok()).toBeTruthy();
  }
  // A private collection with the festival in it.
  const c = await (await r.post('/me/collections', { data: { name: WEEKEND, eventId: ids.ravo } })).json();
  expect(c.isPublic).toBe(false);
  await ctx.close();
});

test.afterAll(async ({ browser }) => {
  const ctx = await asMinh(browser);
  const r = ctx.request;
  for (const c of (await (await r.get('/me/collections')).json()).items as { id: string; name: string }[]) {
    if (c.name.endsWith(' ' + run)) await r.delete('/me/collections/' + c.id);
  }
  const now = await savedIds(r);
  for (const e of now) if (!savedBefore.has(e)) await r.delete('/me/saves/' + e);
  for (const e of savedBefore) if (!now.has(e)) await r.put('/me/saves/' + e);
  await ctx.close();
});

async function open(page: Page, path: string) {
  const problems = watch(page);
  await page.goto(path);
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  return problems;
}

const chips = (page: Page) => page.getByRole('group', { name: 'Bộ sưu tập' });
const toast = (page: Page, text: string) => expect(page.getByText(text, { exact: true })).toBeVisible();

test('signed out, /saved asks to log in and is kept out of search', async ({ page }) => {
  const problems = await open(page, '/saved');
  const gate = page.locator('[data-ff-gate]');
  await expect(gate).toBeVisible();
  await expect(gate.getByRole('heading', { level: 1 })).toHaveText('Đã lưu');
  await gate.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  expect(problems).toEqual([]);
});

test('the saved events: upcoming as cards with their heart, the past folded away', async ({ page }) => {
  await signInWith(page, ATTENDEE);
  const problems = await open(page, '/saved');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Đã lưu');
  const n = (await savedIds(page.request)).size;
  const all = chips(page).getByRole('button', { name: /^Tất cả/ });
  await expect(all).toHaveAttribute('aria-pressed', 'true');
  await expect(all).toHaveAccessibleName(new RegExp(`^Tất cả\\s*${n}$`));
  await expect(chips(page).getByRole('button', { name: new RegExp(WEEKEND) })).toBeVisible();

  await expect(page.getByRole('link', { name: RAVO, exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: OUTCAST, exact: true })).toBeVisible();
  // Taking a heart off keeps the card (to take it back), and the count follows.
  const heart = page.getByRole('button', { name: 'Lưu ' + OUTCAST, exact: true });
  await expect(heart).toHaveAttribute('aria-pressed', 'true');
  await heart.click();
  await expect(heart).toHaveAttribute('aria-pressed', 'false');
  await expect(all).toHaveAccessibleName(new RegExp(`^Tất cả\\s*${n - 1}$`));
  await expect.poll(async () => (await savedIds(page.request)).has(ids.outcast)).toBe(false);
  await heart.click();
  await expect(heart).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(async () => (await savedIds(page.request)).has(ids.outcast)).toBe(true);

  // The past ones are folded under "Đã qua", with a heart of their own.
  const pastLink = page.getByRole('link', { name: PAST, exact: true });
  await expect(pastLink).toBeHidden();
  await page.getByText('Đã qua', { exact: true }).click();
  await expect(pastLink).toBeVisible();
  const pastHeart = page.getByRole('button', { name: 'Lưu ' + PAST, exact: true });
  await expect(pastHeart).toHaveAttribute('aria-pressed', 'true');
  await pastHeart.click();
  await expect(pastHeart).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(async () => (await savedIds(page.request)).has(ids['ravo-2025'])).toBe(false);
  await pastHeart.click();
  await expect.poll(async () => (await savedIds(page.request)).has(ids['ravo-2025'])).toBe(true);

  // The account menu leads here.
  await page.getByRole('button', { name: 'Tài khoản' }).click();
  await expect(page.getByRole('menuitem', { name: /^Đã lưu/ })).toHaveAttribute('href', '/saved');
  expect(problems).toEqual([]);
});

test('a collection: its own address, the public link and its share sheet, rename, delete', async ({ page, browser }) => {
  await signInWith(page, ATTENDEE);
  const problems = await open(page, '/saved');
  await chips(page).getByRole('button', { name: new RegExp(WEEKEND) }).click();
  await expect(page).toHaveURL(/\/saved\?c=[0-9a-f-]{36}$/);
  await expect(page.getByRole('heading', { level: 2, name: WEEKEND })).toBeVisible();
  await expect(page.getByText(/1 sự kiện · Riêng tư/)).toBeVisible();
  await expect(page.getByRole('link', { name: RAVO, exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: OUTCAST, exact: true })).toHaveCount(0);

  // Back to all and forward again, as the chips went.
  await page.goBack();
  await expect(page).toHaveURL(/\/saved$/);
  await expect(chips(page).getByRole('button', { name: /^Tất cả/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('link', { name: OUTCAST, exact: true })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole('heading', { level: 2, name: WEEKEND })).toBeVisible();

  // The public link, then sharing it.
  const sw = page.getByRole('switch', { name: 'Link công khai' });
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  await expect(page.getByRole('button', { name: 'Chia sẻ' })).toHaveCount(0);
  await sw.click();
  await toast(page, 'Đã bật link công khai');
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('button', { name: 'Chia sẻ' }).click();
  const sheet = page.getByRole('dialog', { name: 'Chia sẻ' });
  for (const name of ['Chép liên kết', 'Zalo', 'Messenger', 'Ảnh story', 'Video ngắn']) {
    await expect(sheet.getByRole('button', { name, exact: true })).toBeVisible();
  }
  const download = page.waitForEvent('download');
  await sheet.getByRole('button', { name: 'Ảnh story', exact: true }).click();
  expect((await download).suggestedFilename()).toMatch(/^feestfinder-.+\.png$/);
  await sheet.getByRole('button', { name: 'Đóng' }).click();

  // Anyone can open it now.
  const pub = await mineNamed(page.request, WEEKEND);
  expect(pub?.url).toBeTruthy();
  const visitor = await (await browser.newContext()).newPage();
  await visitor.goto(new URL(pub!.url!).pathname);
  await expect(visitor.getByRole('heading', { name: WEEKEND })).toBeVisible();
  await visitor.context().close();

  // Rename in place.
  await page.getByRole('button', { name: 'Đổi tên' }).click();
  const field = page.getByRole('textbox', { name: 'Tên bộ sưu tập' });
  await field.fill(RENAMED);
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(page.getByRole('heading', { level: 2, name: RENAMED })).toBeVisible();
  await expect(chips(page).getByRole('button', { name: new RegExp(RENAMED) })).toBeVisible();
  expect(await mineNamed(page.request, RENAMED)).toBeTruthy();

  // Delete takes a second tap.
  await page.getByRole('button', { name: 'Xoá', exact: true }).click();
  await page.getByRole('button', { name: 'Bấm lần nữa để xoá' }).click();
  await toast(page, 'Đã xoá bộ sưu tập');
  await expect(page).toHaveURL(/\/saved$/);
  await expect(chips(page).getByRole('button', { name: new RegExp(RENAMED) })).toHaveCount(0);
  expect(await mineNamed(page.request, RENAMED)).toBeUndefined();
  expect(problems).toEqual([]);
});

test('a new collection, and an event put in and taken out from its folder button', async ({ page }) => {
  await signInWith(page, ATTENDEE);
  const problems = await open(page, '/saved');
  await chips(page).getByRole('button', { name: 'Bộ sưu tập mới' }).click();
  const make = page.getByRole('dialog', { name: 'Bộ sưu tập mới' });
  await make.getByRole('textbox', { name: 'Tên bộ sưu tập' }).fill(FRESH);
  await make.getByRole('button', { name: 'Tạo' }).click();
  await toast(page, 'Đã tạo ' + FRESH);
  await expect(page).toHaveURL(/\/saved\?c=[0-9a-f-]{36}$/);
  await expect(page.getByRole('heading', { level: 2, name: FRESH })).toBeVisible();
  await expect(page.getByText('Bộ sưu tập chưa có sự kiện')).toBeVisible();

  // From all saved, into the new collection.
  await chips(page).getByRole('button', { name: /^Tất cả/ }).click();
  await page.getByRole('button', { name: `Lưu ${OUTCAST} vào bộ sưu tập` }).click();
  const pick = page.getByRole('dialog', { name: 'Lưu vào bộ sưu tập' });
  const box = pick.getByRole('checkbox', { name: new RegExp(FRESH) });
  await expect(box).toHaveAttribute('aria-checked', 'false');
  await box.click();
  await toast(page, 'Đã thêm vào ' + FRESH);
  await expect(box).toHaveAttribute('aria-checked', 'true');
  // And into one made right there.
  await pick.getByRole('textbox', { name: 'Tên bộ sưu tập' }).fill(MADE_IN_SHEET);
  await pick.getByRole('button', { name: 'Tạo' }).click();
  await expect(pick.getByRole('checkbox', { name: new RegExp(MADE_IN_SHEET) })).toHaveAttribute('aria-checked', 'true');
  await pick.getByRole('button', { name: 'Đóng' }).click();
  expect((await mineNamed(page.request, MADE_IN_SHEET))?.count).toBe(1);

  const fresh = chips(page).getByRole('button', { name: new RegExp(FRESH) });
  await expect(fresh).toHaveAccessibleName(new RegExp(`${FRESH}.*1$`));
  await fresh.click();
  await expect(page.getByRole('link', { name: OUTCAST, exact: true })).toBeVisible();

  // Out again, from inside the collection.
  await page.getByRole('button', { name: `Lưu ${OUTCAST} vào bộ sưu tập` }).click();
  await pick.getByRole('checkbox', { name: new RegExp(FRESH) }).click();
  await toast(page, 'Đã bỏ khỏi ' + FRESH);
  await pick.getByRole('button', { name: 'Đóng' }).click();
  await expect(page.getByText('Bộ sưu tập chưa có sự kiện')).toBeVisible();
  expect((await mineNamed(page.request, FRESH))?.count).toBe(0);
  expect(problems).toEqual([]);
});

test('a past night in a collection shows whether it is still saved', async ({ page }) => {
  await signInWith(page, ATTENDEE);
  const r = page.request;
  const name = `Đêm cũ ${run}`;
  // Collecting saves it; then the heart is taken off elsewhere.
  const c = await (await r.post('/me/collections', { data: { name, eventId: ids['ravo-2025'] } })).json();
  expect((await r.delete('/me/saves/' + ids['ravo-2025'])).ok()).toBeTruthy();
  const problems = await open(page, '/saved?c=' + c.id);
  await expect(page.getByRole('heading', { level: 2, name })).toBeVisible();
  // Nothing upcoming in it: the past ones are open.
  await expect(page.getByRole('link', { name: PAST, exact: true })).toBeVisible();
  const heart = page.getByRole('button', { name: 'Lưu ' + PAST, exact: true });
  await expect(heart).toHaveAttribute('aria-pressed', 'false');
  await heart.click();
  await expect(heart).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(async () => (await savedIds(r)).has(ids['ravo-2025'])).toBe(true);
  expect(problems).toEqual([]);
});

test('a collection that is not there leads back to all saved', async ({ page }) => {
  await signInWith(page, ATTENDEE);
  await open(page, '/saved?c=00000000-0000-4000-8000-000000000000');
  await toast(page, 'Không tìm thấy bộ sưu tập');
  await expect(page).toHaveURL(/\/saved$/);
  await expect(chips(page).getByRole('button', { name: /^Tất cả/ })).toHaveAttribute('aria-pressed', 'true');
});

test('in English at ?lang=en, and every address keeps it', async ({ page }) => {
  await signInWith(page, ATTENDEE);
  const r = page.request;
  const c = await (await r.post('/me/collections', { data: { name: `Weekend ${run}` } })).json();
  const problems = await open(page, '/saved?lang=en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Saved');
  const group = page.getByRole('group', { name: 'Collections' });
  await expect(group.getByRole('button', { name: /^All saved/ })).toHaveAttribute('aria-pressed', 'true');
  await group.getByRole('button', { name: new RegExp(`Weekend ${run}`) }).click();
  await expect(page).toHaveURL(new RegExp(`/saved\\?c=${c.id}&lang=en$`));
  await expect(page.getByText('Nothing in this collection yet')).toBeVisible();
  await expect(page.getByRole('switch', { name: 'Public link' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Tiếng Việt' })).toHaveAttribute('href', `/saved?c=${c.id}`);
  expect(problems).toEqual([]);
});
