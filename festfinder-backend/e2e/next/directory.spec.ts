import { expect, test, type Page } from '@playwright/test';
import { watch } from '../checks.ts';

/*
 * The artist directory in Kính đêm (festfinder-web/src/kd/web/directory): /a, /a/style/<style>
 * and /a/city/<city>, with what the compiled screen did (role, style, city, taking bookings,
 * playing soon, search, more artists, a card opens the artist) on the rebuilt page.
 */

type Meta = { styles: { key: string; label: { vi: string; en: string } }[]; cities: { slug: string; name: { vi: string; en: string } }[] };

async function open(page: Page, path: string) {
  const problems = watch(page);
  await page.goto(path);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  return problems;
}

const meta = async (page: Page): Promise<Meta> => (await page.request.get('/meta/discovery')).json();
const results = (page: Page, name = 'Danh sách nghệ sĩ') => page.getByRole('list', { name });

test.describe('the artist directory', () => {
  test('arrives as HTML with its artists, structured data and the other language', async ({ request }) => {
    const res = await request.get('/a');
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toMatch(/<h1[^>]*>Nghệ sĩ trên FeestFinder</);
    expect(html).toMatch(/<link rel="canonical" href="http:\/\/localhost:\d+\/a"/);
    expect(html).toMatch(/<link rel="alternate" hrefLang="en" href="http:\/\/localhost:\d+\/a\?lang=en"/);
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    const types = blocks.flatMap((b) => (b['@graph'] ?? [b]).map((n: { '@type': string }) => n['@type']));
    for (const t of ['CollectionPage', 'ItemList', 'BreadcrumbList']) expect(types).toContain(t);
    expect(html).toContain('href="/a/hoaprox"');
    expect(html).not.toContain('/ui/theme.css');

    // One style's and one city's artists have pages of their own; an unknown one has none.
    const { styles, cities } = (await (await request.get('/meta/discovery')).json()) as Meta;
    const styled = await (await request.get(`/a/style/${styles[0].key}`)).text();
    expect(styled).toMatch(new RegExp(`<link rel="canonical" href="http://localhost:\\d+/a/style/${styles[0].key}"`));
    expect(styled).toContain(`>Nghệ sĩ ${styles[0].label.vi}</h1>`);
    const city = await (await request.get(`/a/city/${cities[0].slug}?lang=en`)).text();
    expect(city).toMatch(new RegExp(`<link rel="canonical" href="http://localhost:\\d+/a/city/${cities[0].slug}\\?lang=en"`));
    expect(city).toContain(`>Artists in ${cities[0].name.en}</h1>`);
    expect((await request.get('/a/style/no-such-style')).status()).toBe(404);
    expect((await request.get('/a/city/atlantis')).status()).toBe(404);
  });

  test('a style alone has its own address, more filters keep the list on /a, and back steps through them', async ({ page }) => {
    const { styles } = await meta(page);
    const style = styles[0];
    const problems = await open(page, '/a');
    await expect(results(page).getByRole('link', { name: 'Hoaprox', exact: true })).toBeVisible();

    await page.getByRole('button', { name: /^Phong cách/ }).click();
    await page.getByRole('menuitemradio', { name: style.label.vi, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/a/style/${style.key}$`));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(`Nghệ sĩ ${style.label.vi}`);
    await expect(page.getByRole('button', { name: `Phong cách: ${style.label.vi}` })).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('navigation', { name: 'Đường dẫn' }).getByRole('link', { name: 'Nghệ sĩ', exact: true })).toHaveAttribute('href', '/a');

    const booking = page.getByRole('button', { name: 'Nhận booking' });
    await expect(booking).toHaveAttribute('aria-pressed', 'false');
    await booking.click();
    await expect(booking).toHaveAttribute('aria-pressed', 'true');
    await expect(page).toHaveURL(new RegExp(`/a\\?style=${style.key}&booking=1$`));

    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`/a/style/${style.key}$`));
    await expect(booking).toHaveAttribute('aria-pressed', 'false');

    await page.getByRole('button', { name: 'Bỏ lọc' }).first().click();
    await expect(page).toHaveURL(/\/a$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nghệ sĩ trên FeestFinder');
    await expect(results(page).getByRole('link', { name: 'Hoaprox', exact: true })).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('search finds an artist by part of the name, and the card opens their page', async ({ page }) => {
    const problems = await open(page, '/a');
    await page.getByRole('searchbox', { name: 'Tìm nghệ sĩ' }).fill('hoap');
    await expect(page).toHaveURL(/\/a\?q=hoap$/);
    await expect(results(page).getByRole('listitem')).toHaveCount(1);
    await expect(page.getByText('1 nghệ sĩ', { exact: true })).toBeVisible();
    await results(page).getByRole('link', { name: 'Hoaprox', exact: true }).click();
    await expect(page).toHaveURL(/\/a\/hoaprox$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hoaprox');
    expect(problems).toEqual([]);
  });

  test('an address with filters opens the same list', async ({ page }) => {
    // The server renders it already filtered.
    const html = await (await page.request.get('/a?upcoming=1&q=hoap')).text();
    expect(html).toContain('href="/a/hoaprox"');
    expect(html).not.toContain('href="/a/hoang-minh"');
    expect(html).toMatch(/<input[^>]*value="hoap"/);

    await open(page, '/a?upcoming=1&q=hoap');
    await expect(page.getByRole('button', { name: 'Sắp diễn' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('searchbox', { name: 'Tìm nghệ sĩ' })).toHaveValue('hoap');
    await expect(results(page).getByRole('listitem')).toHaveCount(1);
    // Nobody in the demo data takes bookings yet.
    await page.getByRole('button', { name: 'Nhận booking' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Không có nghệ sĩ nào khớp' })).toBeVisible();
    await expect(page).toHaveURL(/\/a\?q=hoap&booking=1&upcoming=1$/);
  });

  test('a link back to the directory clears the filters', async ({ page }) => {
    const { cities } = await meta(page);
    const city = cities[0];
    const problems = await open(page, '/a');
    await page.getByRole('button', { name: /^Thành phố/ }).click();
    await page.getByRole('menuitemradio', { name: city.name.vi, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/a/city/${city.slug}$`));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(`Nghệ sĩ ở ${city.name.vi}`);

    await page.getByRole('navigation', { name: 'Đường dẫn' }).getByRole('link', { name: 'Nghệ sĩ', exact: true }).click();
    await expect(page).toHaveURL(/\/a$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nghệ sĩ trên FeestFinder');
    await expect(page.getByRole('button', { name: 'Thành phố: Mọi thành phố' })).toBeVisible();
    await expect(results(page).getByRole('link', { name: 'Hoaprox', exact: true })).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('more artists come 24 at a time, next show first', async ({ page }) => {
    const all = await (await page.request.get('/artists?limit=60')).json();
    test.skip(all.total <= 24, 'the demo data lists one page of artists');
    await open(page, '/a');
    const items = results(page).getByRole('listitem');
    await expect(items).toHaveCount(24);
    // The API's order, never follower counts: the artist who plays soonest leads.
    await expect(items.first().getByRole('heading', { level: 2 })).toHaveText(all.items[0].name);
    await page.getByRole('button', { name: 'Xem thêm', exact: true }).click();
    await expect(items).toHaveCount(Math.min(all.total, 48));
    if (all.total <= 48) await expect(page.getByRole('button', { name: 'Xem thêm', exact: true })).toHaveCount(0);
  });

  test('opens in English at ?lang=en, and its links and filters stay in English', async ({ page }) => {
    const { cities } = await meta(page);
    const city = cities[0];
    const problems = await open(page, '/a?lang=en');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Artists on FeestFinder');
    await expect(results(page, 'Artists').getByRole('link', { name: 'Hoaprox', exact: true })).toHaveAttribute('href', '/a/hoaprox?lang=en');

    await page.getByRole('button', { name: /^City/ }).click();
    await page.getByRole('menuitemradio', { name: city.name.en, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/a/city/${city.slug}\\?lang=en$`));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(`Artists in ${city.name.en}`);
    // The footer offers the same list in Vietnamese.
    await expect(page.getByRole('contentinfo').getByRole('link', { name: 'Tiếng Việt' })).toHaveAttribute('href', `/a/city/${city.slug}`);
    expect(problems).toEqual([]);
  });
});
