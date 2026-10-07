import { expect, test, type Page } from '@playwright/test';
import { signInWith, watch } from '../checks.ts';

/*
 * /about and /advertise in Kính đêm (festfinder-web/src/kd/web/about and advertise): what the
 * compiled screen showed (who to write to, where to follow, the office, the rate card and the
 * advertising enquiry), on the rebuilt pages, in both languages.
 */

const ATTENDEE = { identifier: 'minh@example.com', password: 'festfinder123' };

async function open(page: Page, path: string) {
  const problems = watch(page);
  await page.goto(path);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.locator('html[data-kd-session]').waitFor({ state: 'attached' });
  return problems;
}

test.describe('the about page', () => {
  test('arrives as HTML with its contacts and the other language', async ({ request }) => {
    const res = await request.get('/about');
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toMatch(/<title>Về FeestFinder<\/title>/);
    expect(html).toMatch(/<h1[^>]*>Một nơi để biết tối nay có gì/);
    expect(html).toMatch(/<link rel="alternate" hrefLang="en" href="http:\/\/localhost:\d+\/about\?lang=en"/);
    for (const mail of ['hello', 'organisers', 'partners']) expect(html).toContain(`href="mailto:${mail}@feestfinder.com"`);
    expect(html).toContain('href="/advertise"');
    expect(html).not.toContain('/ui/theme.css');

    const en = await (await request.get('/about?lang=en')).text();
    expect(en).toMatch(/<title>About FeestFinder<\/title>/);
    expect(en).toMatch(/<h1[^>]*>One place to see what is on tonight/);
  });

  test('its numbers, cities, contacts, social links and office', async ({ page }) => {
    const problems = await open(page, '/about');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Một nơi để biết tối nay có gì');
    await expect(page.getByRole('main')).toContainText(/VỀ FEESTFINDER/i);

    const numbers = page.getByRole('region', { name: 'FeestFinder qua các con số' });
    await expect(numbers.getByText('Sự kiện sắp diễn ra')).toBeVisible();
    await expect(numbers.getByText('Phí đặt vé')).toBeVisible();

    // The cities come from the API; one with events leads to the list filtered to it.
    const cities = page.getByRole('region', { name: 'Thành phố' });
    await expect(cities.getByRole('link', { name: /^TP\.HCM: \d+ sự kiện sắp diễn ra$/ })).toHaveAttribute('href', '/list?city=ho-chi-minh');

    const contact = page.getByRole('region', { name: 'Liên hệ' });
    await expect(contact.getByRole('heading', { level: 3 })).toHaveText(['Cho người đi chơi', 'Cho nhà tổ chức', 'Cho thương hiệu & báo chí']);
    await expect(contact.getByRole('link', { name: 'Gửi email tới hello@feestfinder.com' })).toHaveAttribute('href', 'mailto:hello@feestfinder.com');
    await expect(contact.getByRole('link', { name: 'Gửi email tới partners@feestfinder.com' })).toHaveAttribute('href', 'mailto:partners@feestfinder.com');
    await expect(contact.getByRole('link', { name: 'Đặt quảng cáo' })).toHaveAttribute('href', '/advertise');

    const social = page.getByRole('region', { name: 'Theo dõi chúng tôi' });
    await expect(social.getByRole('link')).toHaveCount(4);
    await expect(social.getByRole('link', { name: /Facebook/ })).toHaveAttribute('href', 'https://facebook.com/festfinder.vn');
    await expect(social.getByRole('link', { name: /Zalo/ })).toHaveAttribute('href', 'https://zalo.me/festfinder');

    const office = page.getByRole('region', { name: 'Văn phòng và hỗ trợ' });
    await expect(office.getByRole('link', { name: '1900 8386' })).toHaveAttribute('href', 'tel:19008386');
    await expect(office.getByText('Thứ Hai – Thứ Bảy, 09:00 – 18:00')).toBeVisible();

    // The footer offers the English page.
    await expect(page.getByRole('navigation', { name: 'Chân trang' }).getByRole('link', { name: 'English' })).toHaveAttribute('href', '/about?lang=en');
    expect(problems).toEqual([]);
  });

  test('opens in English at ?lang=en, and its links stay in English', async ({ page }) => {
    const problems = await open(page, '/about?lang=en');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('One place to see what is on tonight');
    await expect(page.getByRole('region', { name: 'Cities' }).getByRole('link', { name: /^Ho Chi Minh City: \d+ upcoming events$/ }))
      .toHaveAttribute('href', '/list?city=ho-chi-minh&lang=en');
    await expect(page.getByRole('navigation', { name: 'Footer' }).getByRole('link', { name: 'Tiếng Việt' })).toHaveAttribute('href', '/about');
    await page.getByRole('region', { name: 'Contact' }).getByRole('link', { name: 'Advertise' }).click();
    await expect(page).toHaveURL(/\/advertise\?lang=en$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Advertise on FeestFinder');
    expect(problems).toEqual([]);
  });

  test('the nav leaves it, and back returns to it', async ({ page }) => {
    await open(page, '/about');
    await page.getByRole('navigation', { name: 'Chính' }).getByRole('link', { name: 'Khám phá' }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Một nơi để biết tối nay có gì');
  });
});

test.describe('the advertising page', () => {
  test('arrives as HTML with the rate card', async ({ request }) => {
    const res = await request.get('/advertise');
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toMatch(/<title>Quảng cáo trên FeestFinder<\/title>/);
    expect(html).toMatch(/<h1[^>]*>Quảng cáo trên FeestFinder/);
    expect(html).toContain('Thẻ trong feed');
    expect(html).toContain('href="mailto:partners@feestfinder.com"');
    expect(html).not.toContain('/ui/theme.css');
  });

  test('signed out: the rate card, and a sign-in card in place of the form', async ({ page }) => {
    const problems = await open(page, '/advertise');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Quảng cáo trên FeestFinder');
    const rates = page.getByRole('region', { name: 'Bảng giá' });
    for (const p of ['Thẻ trong feed', 'Banner trang Khám phá', 'Trong sự kiện (chế độ trực tiếp)']) await expect(rates.getByText(p)).toBeVisible();
    await expect(rates.getByText(/^[\d.]+₫ CPM$/)).toHaveCount(3);

    const gate = page.locator('[data-ff-gate]');
    await expect(gate.getByRole('heading', { name: 'Đăng nhập để đặt quảng cáo' })).toBeVisible();
    await expect(page.getByRole('form', { name: 'Đặt quảng cáo' })).toHaveCount(0);
    await gate.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(page.getByRole('dialog', { name: 'Đăng nhập' })).toBeVisible();
    await page.keyboard.press('Escape');
    expect(problems).toEqual([]);
  });

  test('signed in: the enquiry checks its fields, then reaches the team', async ({ page }) => {
    await signInWith(page, ATTENDEE);
    const problems = await open(page, '/advertise');
    const form = page.getByRole('form', { name: 'Đặt quảng cáo' });
    await expect(form).toBeVisible();
    const brand = form.getByLabel('Tên thương hiệu');
    const email = form.getByLabel('Email công việc');
    const send = form.getByRole('button', { name: 'Gửi yêu cầu' });
    // The account's email is the starting point.
    await expect(email).toHaveValue('minh@example.com');

    await send.click();
    await expect(form.getByRole('alert')).toHaveText('Nhập tên thương hiệu');
    await expect(brand).toBeFocused();
    await expect(brand).toHaveAttribute('aria-invalid', 'true');

    await brand.fill('Zenkai Energy');
    await email.fill('not-an-email');
    await send.click();
    await expect(form.getByRole('alert')).toHaveText('Email chưa đúng định dạng');
    await expect(email).toBeFocused();

    await email.fill('brand@zenkai.vn');
    const category = form.getByRole('group', { name: 'Ngành hàng' });
    await category.getByRole('button', { name: 'Thời trang' }).click();
    await expect(category.getByRole('button', { name: 'Thời trang' })).toHaveAttribute('aria-pressed', 'true');
    await expect(category.getByRole('button', { name: 'Ăn uống' })).toHaveAttribute('aria-pressed', 'false');
    await form.getByLabel('Ngân sách tháng').selectOption('150–400tr₫');
    await form.getByRole('checkbox', { name: 'Banner trang Khám phá' }).uncheck();
    await form.getByRole('checkbox', { name: 'Trong sự kiện (chế độ trực tiếp)' }).check();
    await form.getByLabel('Thông tin thêm').fill('Lễ hội tháng 10');

    const sent = page.waitForResponse((r) => r.url().endsWith('/ad-inquiries') && r.request().method() === 'POST');
    await send.click();
    const res = await sent;
    expect(res.status()).toBe(201);
    expect(res.request().postDataJSON()).toEqual({
      brand: 'Zenkai Energy', category: 'Fashion', email: 'brand@zenkai.vn', budget: '150–400tr₫', placements: ['feed', 'live'], message: 'Lễ hội tháng 10',
    });
    await expect(page.getByRole('heading', { name: 'Đã gửi yêu cầu' })).toBeFocused();
    await expect(page.getByText(/đội đối tác sẽ phản hồi trong hai ngày làm việc/)).toBeVisible();

    // Another one starts from a clean form, at its first field.
    await page.getByRole('button', { name: 'Gửi yêu cầu khác' }).click();
    const again = page.getByRole('form', { name: 'Đặt quảng cáo' });
    await expect(again.getByLabel('Tên thương hiệu')).toHaveValue('');
    await expect(again.getByLabel('Tên thương hiệu')).toBeFocused();
    await expect(again.getByLabel('Email công việc')).toHaveValue('minh@example.com');
    await expect(again.getByRole('group', { name: 'Ngành hàng' }).getByRole('button', { name: 'Ăn uống' })).toHaveAttribute('aria-pressed', 'true');
    await expect(again.getByRole('checkbox', { name: 'Trong sự kiện (chế độ trực tiếp)' })).not.toBeChecked();
    expect(problems).toEqual([]);
  });

  test('in English, the form and the rate card are in English', async ({ page }) => {
    await signInWith(page, ATTENDEE);
    const problems = await open(page, '/advertise?lang=en');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Advertise on FeestFinder');
    const form = page.getByRole('form', { name: 'Book advertising' });
    await expect(form.getByRole('button', { name: 'Send enquiry' })).toBeVisible();
    await expect(form.getByLabel('Monthly budget').locator('option')).toHaveText([/^Under /, / – /, / – /, / and up$/]);
    await expect(page.getByRole('region', { name: 'Rate card' }).getByText('Feed card')).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Footer' }).getByRole('link', { name: 'Tiếng Việt' })).toHaveAttribute('href', '/advertise');
    expect(problems).toEqual([]);
  });
});
