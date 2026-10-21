import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';
import { PACKS } from '../src/content/blog/index.ts';
import { importBlogContent, type BlogPack } from '../src/services/blog-content.ts';
import { isStyle } from '../src/lib/styles.ts';

/*
 * The team's editorial posts (src/content/blog, services/blog-content.ts): what every pack post
 * must carry to be a page search engines and assistants rank (both languages, a short title, a
 * description, questions, sources, tracks that play), and how the import treats the admins' edits.
 */

describe('blog content packs: written once in the repository, edited by the team in the database', () => {
  let env: TestEnv;
  let admin: string;
  before(async () => {
    env = await setup();
    admin = await env.admin();
  });
  after(async () => { await env.close(); });

  const posts = PACKS.flatMap((p) => p.posts);
  const slugs = new Set(posts.map((p) => p.slug));

  it('gives every post both languages, a title and description of search-result length, and what a guide needs', () => {
    assert.equal(new Set(posts.map((p) => p.key)).size, posts.length, 'keys are unique');
    assert.equal(slugs.size, posts.length, 'slugs are unique');
    for (const p of posts) {
      for (const l of ['vi', 'en'] as const) {
        assert.ok(p.title[l].length >= 20 && p.title[l].length <= 65, `${p.slug} title ${l}: ${p.title[l].length}`);
        // The excerpt is the meta description: search results cut it after about 170 characters (design-kit blog_check).
        assert.ok(p.excerpt[l].length >= 140 && p.excerpt[l].length <= 170, `${p.slug} excerpt ${l}: ${p.excerpt[l].length}`);
        // A guide is 800 words at least, the pillar 1,200 (design-kit blog_check; Vietnamese counts syllables).
        const words = p.body[l].replace(/!\[[^\]]*\]\([^)]*\)/g, ' ').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/https?:\/\/\S+/g, ' ').replace(/[#>*_|`-]/g, ' ').split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
        assert.ok(words >= (p.parent ? 800 : 1200), `${p.slug} body ${l}: ${words} words`);
        // The answer first: the opening paragraph names the subject in bold.
        assert.match(p.body[l], /^\*\*[^*]+\*\*/, `${p.slug} body ${l} opens with its definition`);
        for (const f of p.faq) assert.ok(f.q[l] && f.a[l], `${p.slug} faq ${l}`);
        for (const f of p.facts) assert.ok(f.label[l] && f.value[l], `${p.slug} fact ${l}`);
      }
      assert.ok(p.faq.length >= 5, `${p.slug} has five questions`);
      assert.ok(p.facts.length >= 5, `${p.slug} has quick facts`);
      assert.ok(p.sources.length >= 4 && p.sources.every((s) => /^https:\/\//.test(s.url)), `${p.slug} cites its sources`);
      // From three publishers at least (en. and vi.wikipedia.org are one): not an encyclopedia alone.
      const site = (u: string) => new URL(u).hostname.split('.').slice(-2).join('.');
      assert.ok(new Set(p.sources.map((s) => site(s.url))).size >= 3, `${p.slug} cites three publishers`);
      assert.ok(p.styles.every(isStyle), `${p.slug} styles are the site's`);
      assert.ok(p.cover && /^https:\/\/(upload|thumb)\.wikimedia\.org\//.test(p.cover.url) && p.cover.credit.includes('commons.wikimedia.org'), `${p.slug} cover is credited`);
      // A genre guide plays five tracks; the guide above them and the DJ lessons need none.
      if (p.category === 'styles' && p.parent) assert.equal(p.tracks.length, 5, `${p.slug} has five tracks`);
      for (const t of p.tracks) assert.match(t.youtube, /^[A-Za-z0-9_-]{11}$/, `${p.slug} ${t.title}`);
      // Every guide it links to exists, in both languages.
      for (const l of ['vi', 'en'] as const) {
        for (const m of p.body[l].matchAll(/\]\(\/blog\/([a-z0-9-]+)/g)) assert.ok(slugs.has(m[1]), `${p.slug} links to /blog/${m[1]}`);
        for (const m of p.body[l].matchAll(/!\[[^\]]*\]\((\S+)/g)) assert.match(m[1], /^https:\/\/(upload|thumb)\.wikimedia\.org\//, `${p.slug} picture`);
      }
    }
  });

  it('adds new posts for the team’s review, with their tracks and their guide above them, and tells the admins', async () => {
    const first = await importBlogContent(env.ctx);
    assert.deepEqual(first, { added: posts.length, updated: 0 });
    const queue = (await env.as(admin).get('/admin/posts')).body;
    assert.equal(queue.items.length, posts.length);
    const techno = queue.items.find((p: { slug: string }) => p.slug === 'techno');
    assert.deepEqual([techno.author.name, techno.author.editorial, techno.imported, techno.tracks.length, techno.tracks[0].provider], ['FeestFinder', true, true, 5, 'youtube']);
    const row = await env.ctx.db.query<{ parent: string }>(`select p.slug as parent from blog_posts c join blog_posts p on p.id = c.parent_id where c.slug = 'techno'`);
    assert.equal(row.rows[0].parent, 'edm');
    const told = await env.ctx.db.query<{ n: number }>(`select count(*)::int as n from notifications where kind = 'blog_review'`);
    assert.ok(told.rows[0].n >= 1);
    // Nothing public before the team says so; a second run changes nothing.
    assert.equal((await env.as().get('/posts')).body.total, 0);
    assert.deepEqual(await importBlogContent(env.ctx), { added: 0, updated: 0 });
  });

  it('publishes a guide as two pages that speak to search engines: facts, questions, tracks, sources, its parent', async () => {
    for (const slug of ['edm', 'techno']) {
      const id = (await env.ctx.db.query<{ id: string }>('select id from blog_posts where slug = $1', [slug])).rows[0].id;
      assert.equal((await env.as(admin).post(`/admin/posts/${id}/decision`, { action: 'approve' })).body.status, 'published');
    }
    const page = (await env.as().get('/posts/techno')).body;
    assert.deepEqual([page.parent.slug, page.facts.length >= 5, page.faq.length, page.sources.length >= 4], ['edm', true, 5, true]);
    assert.equal((await env.as().get('/posts/edm')).body.children[0].slug, 'techno');
    const vi = (await env.as().get('/seo/blog/techno')).body;
    const en = (await env.as().get('/seo/blog/techno?lang=en')).body;
    assert.ok(vi.canonical.endsWith('/blog/techno') && en.canonical.endsWith('/blog/techno?lang=en'));
    const types = en.jsonLd['@graph'].map((n: { '@type': string }) => n['@type']);
    for (const t of ['BlogPosting', 'DefinedTerm', 'FAQPage', 'ItemList', 'BreadcrumbList']) assert.ok(types.includes(t), t);
    const post = en.jsonLd['@graph'].find((n: { '@type': string }) => n['@type'] === 'BlogPosting');
    assert.equal(post.inLanguage, 'en');
    assert.ok(post.citation.length >= 4);
    const crumbs = en.jsonLd['@graph'].find((n: { '@type': string }) => n['@type'] === 'BreadcrumbList').itemListElement.map((c: { name: string }) => c.name);
    assert.deepEqual(crumbs, ['FeestFinder', 'Blog', 'What is EDM? A map of electronic dance music genres', 'What is techno? BPM, Detroit roots and sub-genres']);
    const sitemap = (await env.app.inject({ method: 'GET', url: '/sitemap.xml' })).body;
    assert.match(sitemap, /<loc>[^<]+\/blog\/techno\?lang=en<\/loc>/);
    // The web's sitemap reads the same list: a post written in both languages is a pair, the blog too.
    const pages = (await env.as().get('/seo/sitemap')).body.pages as { path: string; langs: string }[];
    assert.equal(pages.find((p) => p.path === '/blog/techno')?.langs, 'pair');
    assert.equal(pages.find((p) => p.path === '/blog')?.langs, 'pair');
  });

  it('reads a DJ lesson’s steps as a HowTo and the glossary’s tables as a DefinedTermSet, under the course’s pillar', async () => {
    for (const slug of ['hoc-dj-tu-so-0', 'beatmatch-bang-tai', 'thuat-ngu-dj']) {
      const id = (await env.ctx.db.query<{ id: string }>('select id from blog_posts where slug = $1', [slug])).rows[0].id;
      assert.equal((await env.as(admin).post(`/admin/posts/${id}/decision`, { action: 'approve' })).body.status, 'published');
    }
    const graph = async (path: string) => (await env.as().get(path)).body.jsonLd['@graph'] as { '@type': string; [k: string]: unknown }[];
    const lesson = await graph('/seo/blog/beatmatch-bang-tai?lang=en');
    const how = lesson.find((n) => n['@type'] === 'HowTo') as unknown as { step: { name: string; text: string; position: number }[]; tool: { name: string }[]; inLanguage: string };
    assert.equal(how.inLanguage, 'en');
    assert.deepEqual(how.step.map((x) => x.position), [1, 2, 3, 4, 5]);
    assert.equal(how.step[0].name, 'Set a cue on beat one of track B');
    assert.match(how.step[2].text, /^Do: listen for a while\..*Listen for:/);
    assert.ok(how.tool.length >= 3 && how.tool.every((x) => !x.name.includes('**')));
    const vi = await graph('/seo/blog/beatmatch-bang-tai');
    assert.equal((vi.find((n) => n['@type'] === 'HowTo') as unknown as { step: { name: string }[] }).step[0].name, 'Đặt cue ở phách 1 của bài B');
    const crumbs = (vi.find((n) => n['@type'] === 'BreadcrumbList') as unknown as { itemListElement: { name: string }[] }).itemListElement.map((c) => c.name);
    assert.deepEqual(crumbs.slice(2), ['Học DJ từ số 0: lộ trình 16 bài thực hành trên controller', 'Cách beatmatch bằng tai: từng bước cho người mới']);
    // The glossary is no how-to, and the pillar lists its lessons.
    const glossary = await graph('/seo/blog/thuat-ngu-dj?lang=en');
    assert.equal(glossary.find((n) => n['@type'] === 'HowTo'), undefined);
    const set = glossary.find((n) => n['@type'] === 'DefinedTermSet') as unknown as { hasDefinedTerm: { name: string; description: string }[] };
    assert.equal(set.hasDefinedTerm.length, 25);
    assert.deepEqual(set.hasDefinedTerm[0], { '@type': 'DefinedTerm', name: 'Controller', description: 'A USB control surface that drives DJ software on a laptop; two decks and a mixer in one unit' });
    assert.deepEqual((await env.as().get('/posts/hoc-dj-tu-so-0')).body.children.map((c: { slug: string }) => c.slug).sort(), ['beatmatch-bang-tai', 'thuat-ngu-dj']);
    assert.equal((await graph('/seo/blog/techno')).find((n) => n['@type'] === 'HowTo'), undefined, 'a genre guide is no how-to');
  });

  it('takes a pack’s newer words until someone edits a post, and never after', async () => {
    const changed: BlogPack[] = PACKS.map((p) => ({ ...p, posts: p.posts.map((x) => ({ ...x, excerpt: { ...x.excerpt, en: `${x.excerpt.en} (revised)` } })) }));
    // An admin edits the techno guide in the Console.
    const id = (await env.ctx.db.query<{ id: string }>(`select id from blog_posts where slug = 'techno'`)).rows[0].id;
    const edited = await env.as(admin).patch(`/me/posts/${id}`, { excerpt: { vi: 'Bản tóm tắt do đội ngũ viết lại, đủ dài để làm mô tả cho công cụ tìm kiếm và trợ lý AI đọc được.', en: 'An excerpt the team rewrote, long enough to serve as the description search engines and assistants read.' } });
    assert.equal(edited.status, 200, JSON.stringify(edited.body));
    assert.equal(edited.body.status, 'published', 'the team’s own change keeps the post public');
    const out = await importBlogContent(env.ctx, changed);
    assert.equal(out.updated, posts.length - 1);
    const rows = await env.ctx.db.query<{ slug: string; excerpt: { en: string } }>(`select slug, excerpt from blog_posts where slug in ('techno', 'trance')`);
    const by = Object.fromEntries(rows.rows.map((r) => [r.slug, r.excerpt.en]));
    assert.match(by.trance, /\(revised\)$/);
    assert.match(by.techno, /^An excerpt the team rewrote/);
    // A post the team took down stays down; nothing is ever deleted.
    await env.as(admin).post(`/admin/posts/${id}/decision`, { action: 'hide' });
    await importBlogContent(env.ctx, changed);
    assert.equal((await env.ctx.db.query<{ status: string }>(`select status from blog_posts where slug = 'techno'`)).rows[0].status, 'hidden');
  });
});
