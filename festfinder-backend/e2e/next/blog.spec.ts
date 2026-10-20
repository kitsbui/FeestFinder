import { expect, request, test } from '@playwright/test';
import { watch } from '../checks.ts';
import { ACCOUNTS } from './routes.ts';

/*
 * The blog (festfinder-web/src/kd/web/blog): a fan writes a playlist post with a track pasted as
 * an embed code, the team approves it, and a visitor finds it under its category, reads it, and
 * sees the track as a row that loads nothing before play. Created, never deleted.
 */

test('a post from draft to the blog, with a track from an embed code', async ({ page, browser, baseURL }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  expect((await page.request.post('/auth/login', { data: ACCOUNTS.fan })).ok()).toBeTruthy();
  const title = `Sunrise selectors ${Date.now() % 1_000_000}`;

  await page.goto('/blog/new');
  await page.getByRole('button', { name: 'Playlist', exact: true }).click();
  // Both languages in one form: the tabs switch what the fields write.
  await page.getByLabel('Tiêu đề · Tiếng Việt').fill(title);
  await page.getByLabel('Tóm tắt · Tiếng Việt').fill('Mười bài cho ánh sáng đầu tiên trên sân thượng Sài Gòn.');
  await page.getByLabel(/^Nội dung · Tiếng Việt/).fill('## Why sunrise\n\nThe hour after the night is the best one: **slow**, warm, melodic.\n\n- Start low\n- Let the light do the build\n\nMore at https://feestfinder.com/blog');
  await page.getByRole('tab', { name: 'English' }).click();
  await page.getByLabel('Tiêu đề · English').fill(`${title} (EN)`);
  await page.getByRole('button', { name: 'Lưu bản nháp' }).click();
  await expect(page).toHaveURL(/\/blog\/[a-z0-9-]+\/edit$/);
  const slug = page.url().split('/blog/')[1].split('/')[0];

  // A track from an embed code: its title is typed, the player's address rebuilt by the API.
  await page.getByLabel('Thêm bài nhạc').fill('<iframe src="https://open.spotify.com/embed/playlist/37i9dQZF1DX6J5NfMJS675?utm_source=generator" width="100%" height="352"></iframe>');
  await page.getByLabel('Tên bài nhạc').fill('Melodic sunrise');
  await page.getByRole('button', { name: 'Thêm', exact: true }).click();
  await expect(page.getByText('Melodic sunrise')).toBeVisible();
  await page.getByRole('button', { name: 'Gửi duyệt' }).click();
  await expect(page.getByText('Đang duyệt')).toBeVisible();

  // The team approves it.
  const admin = await request.newContext({ baseURL });
  expect((await admin.post('/auth/login', { data: ACCOUNTS.admin })).ok()).toBeTruthy();
  const queue = await (await admin.get('/admin/posts')).json();
  const mine = queue.items.find((p: { slug: string }) => p.slug === slug);
  expect((await admin.post(`/admin/posts/${mine.id}/decision`, { data: { action: 'approve' } })).ok()).toBeTruthy();

  // A visitor: "Blog" in the bar, the post under Playlist, its words and its track.
  const visitor = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const problems = watch(visitor);
  await visitor.goto('/');
  await visitor.getByRole('navigation', { name: 'Chính' }).getByRole('link', { name: 'Blog' }).click();
  await expect(visitor).toHaveURL(/\/blog$/);
  await visitor.getByRole('tablist', { name: 'Chuyên mục' }).getByRole('tab', { name: /^Playlist/ }).click();
  await expect(visitor).toHaveURL(/\/blog\?category=playlist$/);
  await visitor.getByRole('link', { name: title }).click();
  await expect(visitor.getByRole('heading', { level: 1, name: title })).toBeVisible();
  await expect(visitor.getByRole('heading', { level: 2, name: 'Why sunrise' })).toBeVisible();
  await expect(visitor.locator('article strong', { hasText: 'slow' })).toBeVisible();
  await expect(visitor.getByRole('link', { name: 'feestfinder.com/blog' })).toHaveAttribute('rel', /nofollow/);
  await expect(visitor.getByRole('button', { name: /Melodic sunrise/ })).toBeVisible();
  await expect(visitor.locator('iframe')).toHaveCount(0);
  const graph = JSON.parse((await visitor.locator('script[type="application/ld+json"]').first().textContent())!)['@graph'];
  expect(graph.find((n: { '@type': string }) => n['@type'] === 'BlogPosting').headline).toBe(title);
  expect(problems).toEqual([]);
  await visitor.close();
});

test('an editorial guide from the content packs: facts, tables, a credited picture, questions, sources, two languages', async ({ browser, baseURL }) => {
  const admin = await request.newContext({ baseURL });
  expect((await admin.post('/auth/login', { data: ACCOUNTS.admin })).ok()).toBeTruthy();
  expect((await admin.post('/admin/posts/import')).ok()).toBeTruthy();
  const queue = await (await admin.get('/admin/posts')).json();
  for (const slug of ['edm', 'techno']) {
    const post = queue.items.find((p: { slug: string }) => p.slug === slug);
    if (post) expect((await admin.post(`/admin/posts/${post.id}/decision`, { data: { action: 'approve' } })).ok()).toBeTruthy();
  }
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const problems = watch(page);
  await page.goto('/blog/techno');
  await expect(page.getByRole('heading', { level: 1, name: 'Techno là gì? BPM, nguồn gốc Detroit và các sub-genre' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Đường dẫn' }).getByRole('link', { name: /^EDM là gì\?/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Thông tin nhanh' })).toBeVisible();
  await expect(page.getByRole('table').first()).toBeVisible();
  await expect(page.locator('article figure img').first()).toHaveAttribute('referrerpolicy', 'no-referrer');
  await expect(page.locator('article figcaption a[href*="commons.wikimedia.org"]').first()).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Câu hỏi thường gặp' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Nguồn tham khảo' })).toBeVisible();
  await expect(page.getByRole('button', { name: /No UFO's/ })).toBeVisible();
  await expect(page.locator('iframe')).toHaveCount(0);
  const graph = JSON.parse((await page.locator('script[type="application/ld+json"]').first().textContent())!)['@graph'];
  for (const t of ['BlogPosting', 'FAQPage', 'ItemList', 'DefinedTerm']) expect(graph.some((n: { '@type': string }) => n['@type'] === t), t).toBeTruthy();
  // The same guide in English is a page of its own.
  await page.goto('/blog/techno?lang=en');
  await expect(page.getByRole('heading', { level: 1, name: 'What is techno? BPM, Detroit roots and sub-genres' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Frequently asked' })).toBeVisible();
  // On a phone its style chips wrap without overlapping (night build 2026-10-21, N1).
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/blog/techno');
  const chips = await page.locator('article header .kd-tag').evaluateAll((els) => els.map((e) => { const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; }));
  expect(chips.length).toBeGreaterThan(3);
  for (const [i, a] of chips.entries()) for (const b of chips.slice(i + 1)) {
    expect(a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h, 'two chips overlap').toBe(false);
  }
  expect(problems).toEqual([]);
  await page.close();
});
