import { expect, test, type Page } from '@playwright/test';
import { signInWith, watch } from '../checks.ts';

/*
 * The organiser page in Kính đêm (festfinder-web/src/kd/web/org): what the compiled screen
 * showed (events, followers, its artists and venues), on the rebuilt page.
 */

const ATTENDEE = { identifier: 'minh@example.com', password: 'festfinder123' };

async function open(page: Page, path: string) {
  const problems = watch(page);
  await page.goto(path);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  return problems;
}

test.describe('the organiser page', () => {
  test('arrives as HTML with its events, structured data and the other language', async ({ request }) => {
    const res = await request.get('/o/ravoent');
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toMatch(/<h1[^>]*>Ravolution Entertainment/);
    expect(html).toMatch(/<link rel="alternate" hrefLang="en" href="http:\/\/localhost:\d+\/o\/ravoent\?lang=en"/);
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    const types = blocks.flatMap((b) => (b['@graph'] ?? [b]).map((n: { '@type': string }) => n['@type']));
    for (const t of ['Organization', 'ProfilePage', 'BreadcrumbList']) expect(types).toContain(t);
    expect(html).toContain('href="/e/ravo"');
    expect(html).not.toContain('/ui/theme.css');
    expect((await request.get('/o/nobody-here')).status()).toBe(404);
  });

  test('opens in English at ?lang=en, and its links stay in English', async ({ page }) => {
    const problems = await open(page, '/o/ravoent?lang=en');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ravolution Entertainment');
    await expect(page.getByRole('tab', { name: /Upcoming/ })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('link', { name: 'Ravolution Music Festival' })).toHaveAttribute('href', '/e/ravo?lang=en');
    await expect(page).toHaveURL(/\/o\/ravoent\?lang=en$/);
    expect(problems).toEqual([]);
  });

  test('following asks for sign-in, then follows and moves the count', async ({ page }) => {
    await open(page, '/o/ravoent');
    await page.getByRole('button', { name: 'Theo dõi', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Đăng nhập' })).toBeVisible();
    await page.keyboard.press('Escape');

    await signInWith(page, ATTENDEE);
    await page.request.delete('/me/follows/organizers/' + (await (await page.request.get('/organizers/ravoent')).json()).id);
    await open(page, '/o/ravoent');
    const followers = page.locator('.kd-stat').filter({ hasText: 'Người theo dõi' }).locator('.kd-v');
    const n = async () => Number((await followers.innerText()).replace(/\D/g, ''));
    const follow = page.getByRole('button', { name: 'Theo dõi', exact: true });
    await expect(follow).toHaveAttribute('aria-pressed', 'false');
    const before = await n();
    await follow.click();
    await expect(page.getByRole('button', { name: 'Đang theo dõi' })).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(n).toBe(before + 1);
    await expect.poll(async () => (await (await page.request.get('/organizers/ravoent')).json()).me.following).toBe(true);
    await page.getByRole('button', { name: 'Đang theo dõi' }).click();
    await expect.poll(n).toBe(before);
  });

  test('the past tab lists what it has run, by year, and opens it', async ({ page }) => {
    await open(page, '/o/ravoent');
    await page.getByRole('tab', { name: /Đã tổ chức/ }).click();
    const panel = page.getByRole('tabpanel', { name: 'Đã tổ chức' });
    await expect(panel.getByText(/^20\d\d$/).first()).toBeVisible();
    const first = panel.getByRole('link').first();
    const href = await first.getAttribute('href');
    expect(href).toMatch(/^\/e\/[a-z0-9-]+$/);
    await first.click();
    await expect(page).toHaveURL(new RegExp(href! + '$'));
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('its business details unfold, and the artists it books open their pages', async ({ page }) => {
    await open(page, '/o/ravoent');
    await page.getByText('Thông tin doanh nghiệp').click();
    await expect(page.getByRole('definition').filter({ hasText: /^Đơn vị tổ chức$/ })).toBeVisible();
    await expect(page.getByRole('link', { name: 'ravolution.vn' }).last()).toHaveAttribute('href', 'https://ravolution.vn');
    await page.getByRole('link', { name: /Hoaprox/ }).click();
    await expect(page).toHaveURL(/\/a\/hoaprox$/);
  });

  test('a listing not yet verified offers its people a way to claim it', async ({ page }) => {
    await open(page, '/o/ravoent');
    await expect(page.getByRole('button', { name: 'Bạn là nhà tổ chức này?' })).toHaveCount(0);
    await signInWith(page, ATTENDEE);
    await open(page, '/o/bside');
    await page.getByRole('button', { name: 'Bạn là nhà tổ chức này?' }).click();
    const picker = page.getByRole('dialog', { name: 'Bạn đến với âm nhạc thế nào?' });
    await expect(picker.getByRole('textbox').first()).toHaveValue('Bside Cafe');
    await expect(picker.getByText('Bside Cafe').first()).toBeVisible();
  });
});
