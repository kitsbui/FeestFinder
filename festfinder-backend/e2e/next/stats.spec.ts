import { expect, test, type Page } from '@playwright/test';
import { watch } from '../checks.ts';

/*
 * One explore stat in Kính đêm (festfinder-web/src/kd/web/stats): what the compiled screen
 * showed at /stats/<key> (free entry, this weekend, the venues with something on, under the
 * filters in force), on the rebuilt page. The demo week: Monday 14 September, the weekend is
 * 18–20 September. Other specs may approve more events, so counts are read off the page.
 */

async function open(page: Page, path: string) {
  const problems = watch(page);
  await page.goto(path);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  return problems;
}

const chipCount = async (page: Page, name: RegExp) =>
  Number((await page.getByRole('navigation', { name: 'Danh sách' }).getByRole('link', { name }).innerText()).replace(/\D/g, ''));

test.describe('an explore stat', () => {
  test('arrives as HTML with its list, followed but not indexed; an unknown stat is not found', async ({ request }) => {
    const res = await request.get('/stats/free');
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toMatch(/<title>Vào cửa miễn phí, không cần vé · FeestFinder<\/title>/);
    expect(html).toMatch(/<meta name="robots" content="noindex, follow"/);
    expect(html).toMatch(/<h1[^>]*>Vào cửa miễn phí, không cần vé<\/h1>/);
    expect(html).toContain('href="/e/hozo"');
    expect(html).toContain('href="/e/outcast"');
    expect(html).not.toContain('href="/e/ravo"');
    expect(html).not.toContain('/ui/theme.css');

    const en = await (await request.get('/stats/weekend?lang=en')).text();
    expect(en).toMatch(/<h1[^>]*>On this weekend<\/h1>/);
    expect(en).toContain('href="/e/ravo?lang=en"');

    expect((await request.get('/stats/nothing-here')).status()).toBe(404);
  });

  test('free entry: this weekend’s free events, each to its page', async ({ page }) => {
    const problems = await open(page, '/stats/free');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Vào cửa miễn phí, không cần vé');
    await expect(page.getByRole('navigation', { name: 'Đường dẫn' }).getByRole('link', { name: 'Khám phá' })).toHaveAttribute('href', '/');

    const views = page.getByRole('navigation', { name: 'Danh sách' });
    await expect(views.getByRole('link', { name: /^Miễn phí/ })).toHaveAttribute('aria-current', 'true');
    await expect(views.getByRole('link', { name: /^Cuối tuần này/ })).toHaveAttribute('href', '/stats/weekend');
    await expect(views.getByRole('link', { name: /^Địa điểm/ })).toHaveAttribute('href', '/stats/venues');

    const list = page.getByRole('list', { name: 'Vào cửa miễn phí, không cần vé' });
    const hozo = list.getByRole('link', { name: /HOZO Super Fest/ });
    await expect(hozo).toHaveAttribute('href', '/e/hozo');
    await expect(hozo).toContainText('Miễn phí');
    await expect(hozo).toContainText('Công viên bờ sông Sài Gòn');
    await expect(list.getByRole('link', { name: /Saigon Outcast Night Market/ })).toBeVisible();
    await expect(list.getByRole('link', { name: /Ravolution/ })).toHaveCount(0);
    // The count, the chip and the rows agree.
    const n = await chipCount(page, /^Miễn phí/);
    await expect(page.getByRole('heading', { level: 2, name: `${n} sự kiện`, exact: true })).toBeVisible();
    await expect(list.getByRole('listitem')).toHaveCount(n);
    // The time picker starts on this weekend.
    await expect(page.getByRole('group', { name: 'Bộ lọc' }).getByRole('button', { name: 'Thời gian' })).toHaveText(/Cuối tuần này/);
    await expect(page.getByRole('link', { name: 'Bỏ lọc', exact: true })).toHaveCount(0);

    await hozo.click();
    await expect(page).toHaveURL(/\/e\/hozo$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('HOZO Super Fest');
    expect(problems).toEqual([]);
  });

  test('this weekend: paid and sold-out nights too, and the chips move between the stats', async ({ page }) => {
    const problems = await open(page, '/stats/weekend');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Diễn ra cuối tuần này');
    const list = page.getByRole('list', { name: 'Diễn ra cuối tuần này' });
    await expect(list.getByRole('link', { name: /^Ravolution Music Festival/ })).toHaveAttribute('href', '/e/ravo');
    await expect(list.getByRole('link', { name: /Rap Việt Live Stage/ })).toContainText('Hết vé');
    await expect(list.getByRole('link', { name: /HOZO Super Fest/ })).toBeVisible();
    // Nothing on Monday night belongs here.
    await expect(list.getByRole('link', { name: /Vietnam Blues Experience/ })).toHaveCount(0);
    // The weekend is always this weekend: no time picker.
    await expect(page.getByRole('button', { name: 'Thời gian' })).toHaveCount(0);
    await expect(list.getByRole('listitem')).toHaveCount(await chipCount(page, /^Cuối tuần này/));

    await page.getByRole('navigation', { name: 'Danh sách' }).getByRole('link', { name: /^Địa điểm/ }).click();
    await expect(page).toHaveURL(/\/stats\/venues$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Địa điểm đang có sự kiện');
    await expect(page.getByRole('navigation', { name: 'Danh sách' }).getByRole('link', { name: /^Địa điểm/ })).toHaveAttribute('aria-current', 'true');
    expect(problems).toEqual([]);
  });

  test('venues: each place with its events; a wider range adds places, and clearing takes it back', async ({ page }) => {
    const problems = await open(page, '/stats/venues');
    const list = page.getByRole('list', { name: 'Địa điểm đang có sự kiện' });
    const secc = list.getByRole('listitem').filter({ has: page.getByRole('heading', { level: 3, name: 'SECC — TT Hội chợ & Triển lãm Sài Gòn' }) });
    await expect(secc).toContainText('Quận 7');
    await expect(secc).toContainText(/\d+ sự kiện/);
    await expect(secc.getByRole('link', { name: /Ravolution Music Festival/ })).toHaveAttribute('href', '/e/ravo');
    await expect(page.getByRole('heading', { level: 2, name: `${await chipCount(page, /^Địa điểm/)} địa điểm`, exact: true })).toBeVisible();
    await expect(list.getByRole('heading', { level: 3, name: 'IDECAF' })).toHaveCount(0);

    const when = page.getByRole('group', { name: 'Bộ lọc' }).getByRole('button', { name: 'Thời gian' });
    await when.click();
    await expect(when).toHaveAttribute('aria-expanded', 'true');
    await page.getByRole('menu', { name: 'Thời gian' }).getByRole('menuitemradio', { name: 'Tháng này' }).click();
    await expect(page).toHaveURL(/\/stats\/venues\?time=month$/);
    await expect(when).toHaveText(/Tháng này/);
    // The Wednesday morning concert is this month, not this weekend.
    await expect(list.getByRole('heading', { level: 3, name: 'IDECAF' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Danh sách' }).getByRole('link', { name: /^Miễn phí/ })).toHaveAttribute('href', '/stats/free?time=month');

    await page.getByRole('group', { name: 'Bộ lọc' }).getByRole('link', { name: 'Bỏ lọc', exact: true }).click();
    await expect(page).toHaveURL(/\/stats\/venues$/);
    await expect(list.getByRole('heading', { level: 3, name: 'IDECAF' })).toHaveCount(0);
    expect(problems).toEqual([]);
  });

  test('nothing matching offers to widen the dates or clear the filters', async ({ page }) => {
    const problems = await open(page, '/stats/free?time=tonight');
    const empty = page.getByRole('status').filter({ hasText: 'Không có gì khớp bộ lọc' });
    await expect(empty).toBeVisible();
    await expect(empty.getByRole('link', { name: 'Bỏ lọc' })).toHaveAttribute('href', '/stats/free');
    // The weekend stat is always this weekend: its chip counts the whole weekend, not tonight's part of it.
    const weekend = await chipCount(page, /^Cuối tuần này/);
    expect(weekend).toBeGreaterThan(0);
    await empty.getByRole('link', { name: 'Xem cả tháng' }).click();
    await expect(page).toHaveURL(/\/stats\/free\?time=month$/);
    // Whatever is free this month (other specs change prices), as the API lists it.
    const month = await (await page.request.get('/explore/stats?view=free&time=month')).json();
    expect(month.rows.length).toBeGreaterThan(0);
    await expect(page.getByRole('list', { name: 'Vào cửa miễn phí, không cần vé' }).getByRole('link', { name: month.rows[0].title }).first()).toBeVisible();

    await page.getByRole('navigation', { name: 'Danh sách' }).getByRole('link', { name: /^Cuối tuần này/ }).click();
    await expect(page).toHaveURL(/\/stats\/weekend$/);
    await expect(page.getByRole('list', { name: 'Diễn ra cuối tuần này' }).getByRole('listitem')).toHaveCount(weekend);
    expect(problems).toEqual([]);
  });

  test('a genre, a search or a city from the address narrows it, and its chip takes it off', async ({ page }) => {
    const problems = await open(page, '/stats/weekend?family=edm');
    const filters = page.getByRole('group', { name: 'Bộ lọc' });
    const list = page.getByRole('list', { name: 'Diễn ra cuối tuần này' });
    await expect(list.getByRole('link', { name: /^Ravolution Music Festival/ })).toBeVisible();
    await expect(list.getByRole('link', { name: /HOZO Super Fest/ })).toHaveCount(0);
    // The other stats keep the genre.
    await expect(page.getByRole('navigation', { name: 'Danh sách' }).getByRole('link', { name: /^Địa điểm/ })).toHaveAttribute('href', '/stats/venues?family=edm');
    await filters.getByRole('link', { name: 'Bỏ lọc: EDM' }).click();
    await expect(page).toHaveURL(/\/stats\/weekend$/);
    await expect(list.getByRole('link', { name: /HOZO Super Fest/ })).toBeVisible();

    await open(page, '/stats/free?q=hozo');
    await expect(filters.getByRole('link', { name: 'Bỏ lọc: hozo' })).toBeVisible();
    // A search spans every date: no time picker.
    await expect(filters.getByRole('button', { name: 'Thời gian' })).toHaveCount(0);
    await expect(page.getByRole('list', { name: 'Vào cửa miễn phí, không cần vé' }).getByRole('listitem')).toHaveCount(1);

    await open(page, '/stats/weekend');
    await filters.getByRole('button', { name: 'Thành phố' }).click();
    await page.getByRole('menu', { name: 'Thành phố' }).getByRole('menuitemradio', { name: 'Hà Nội' }).click();
    await expect(page).toHaveURL(/\/stats\/weekend\?city=ha-noi$/);
    const empty = page.getByRole('status').filter({ hasText: 'Không có gì khớp bộ lọc' });
    await expect(empty).toBeVisible();
    await expect(empty.getByRole('link', { name: 'Xem cả tháng' })).toHaveCount(0);
    await empty.getByRole('link', { name: 'Bỏ lọc' }).click();
    await expect(page).toHaveURL(/\/stats\/weekend$/);
    await expect(page.getByRole('list', { name: 'Diễn ra cuối tuần này' }).getByRole('link', { name: /HOZO Super Fest/ })).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('opens in English at ?lang=en, and its links stay in English', async ({ page }) => {
    const problems = await open(page, '/stats/free?lang=en');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Free entry, no ticket needed');
    const views = page.getByRole('navigation', { name: 'Lists' });
    await expect(views.getByRole('link', { name: /^Free/ })).toHaveAttribute('aria-current', 'true');
    await expect(views.getByRole('link', { name: /^This weekend/ })).toHaveAttribute('href', '/stats/weekend?lang=en');
    await expect(page.getByRole('list', { name: 'Free entry, no ticket needed' }).getByRole('link', { name: /HOZO Super Fest/ })).toHaveAttribute('href', '/e/hozo?lang=en');
    await expect(page.getByRole('group', { name: 'Filters' }).getByRole('button', { name: 'When' })).toHaveText(/This weekend/);
    await expect(page.getByRole('navigation', { name: 'Footer' }).getByRole('link', { name: 'Tiếng Việt' })).toHaveAttribute('href', '/stats/free');
    expect(problems).toEqual([]);

    await open(page, '/stats/free');
    await expect(page.getByRole('navigation', { name: 'Chân trang' }).getByRole('link', { name: 'English' })).toHaveAttribute('href', '/stats/free?lang=en');
  });
});
