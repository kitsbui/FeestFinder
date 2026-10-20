import type { Ctx } from '../../context.ts';
import type { Lang, Localized } from '../../lib/i18n.ts';
import { loadPost, presentPost } from '../blog.ts';
import { OG_HEIGHT, OG_WIDTH } from '../ogimage.ts';
import { abs, baseOf, type BlogSeo, clip, crumbList, type Fact, inLang, longDate, ogFallback, ROBOTS, siteNodes, t, text, vnIso } from './shared.ts';

/* Blog posts for search engines and AI assistants. Part of services/seo.ts. */

/** A pair's words in a language, else the other's: a post may be written in one language only. */
const say = (p: Localized, lang: Lang) => (lang === 'vi' ? p.vi || p.en : p.en || p.vi);

/** Markdown words as plain text for a meta description or an answer (marks, pictures and tables out). */
const plain = (md: string) => md.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/^\|.*\|$/gm, '')
  .replace(/^[#>\-\d.]+\s*/gm, '').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();

/**
 * A published post (services/blog.ts): Vietnamese at /blog/<slug>, English at ?lang=en, each
 * its own page with the other named, when the post is written in both; a post written in one
 * language has that one address. A guide adds its facts, its questions (FAQPage), its tracks
 * (ItemList of MusicRecording) and its sources (citation). Drafts, posts in review and posts the
 * team took down have no page (null).
 */
export async function buildBlogSeo(ctx: Ctx, slug: string, lang: Lang = 'vi'): Promise<BlogSeo | null> {
  const x = await loadPost(ctx.db, { slug });
  if (!x || x.p.status !== 'published') return null;
  const post = presentPost(x.p, { tracks: x.tracks, parent: x.parent, children: x.children, full: true });
  const vi = lang === 'vi';
  const base = baseOf(ctx);
  const path = `/blog/${post.slug}`;
  const body = post.body ?? { en: '', vi: '' };
  // Both languages written: two pages. One: that language's address for both frames.
  const both = !!(post.title.en.trim() && post.title.vi.trim() && body.en.trim() && body.vi.trim());
  const written: Lang = both ? lang : (body.vi.trim() ? 'vi' : 'en');
  const pages = { vi: `${base}${path}`, en: `${base}${path}?lang=en` };
  const url = lang === 'vi' ? pages.vi : pages.en;
  const canonical = both ? url : pages[written];
  // One language written: one page, named for every language (no hreflang pair).
  const alternates = both ? { ...pages, 'x-default': pages.vi } : { vi: canonical, en: canonical, 'x-default': canonical };
  const category = text(post.category.label, lang);
  const author = post.author.name;
  const title = say(post.title, written);
  const description = clip(say(post.excerpt, written) || plain(say(body, written)), 160);
  const image = post.coverUrl
    ? { url: abs(ctx, post.coverUrl)!, width: 1600, height: 900, type: 'image/jpeg' }
    : { url: ogFallback(base), width: OG_WIDTH, height: OG_HEIGHT, type: 'image/png' };
  const crumbs = [
    { name: 'FeestFinder', path: inLang('/', lang) },
    { name: t('blog', lang), path: inLang('/blog', lang) },
    ...(post.parent ? [{ name: say(post.parent.title, lang), path: inLang(`/blog/${post.parent.slug}`, lang) }] : []),
    { name: title, path: inLang(path, lang) },
  ];
  const published = post.publishedAt ? new Date(post.publishedAt).toISOString().slice(0, 10) : null;
  const facts: Fact[] = [
    ...post.facts.map((f) => ({ label: say(f.label, lang), value: say(f.value, lang) })),
    { label: t('category', lang), value: category, href: inLang(`/blog?category=${post.category.key}`, lang) },
    { label: t('author', lang), value: author },
    { label: t('published', lang), value: published ? longDate(published, lang) : '', datetime: published ?? undefined },
    { label: t('readTime', lang), value: vi ? `${post.minutes[written]} phút` : `${post.minutes[written]} min` },
  ].filter((f) => f.value);
  const ids = { page: url, post: `${canonical}#post`, crumbs: `${url}#breadcrumb`, faq: `${url}#faq`, tracks: `${url}#tracks`, topic: `${canonical}#topic` };
  const guideTopic = post.category.key === 'styles' && post.facts.length > 0;
  const graph = [
    ...siteNodes(base),
    {
      '@type': 'WebPage', '@id': ids.page, url, name: `${title} | FeestFinder`, description, inLanguage: written,
      isPartOf: { '@id': `${base}/#website` }, breadcrumb: { '@id': ids.crumbs }, mainEntity: { '@id': ids.post },
      primaryImageOfPage: { '@type': 'ImageObject', url: image.url, width: image.width, height: image.height },
    },
    {
      '@type': 'BlogPosting', '@id': ids.post, headline: clip(title, 110), description, url: canonical, image: image.url, inLanguage: written,
      articleSection: category, keywords: post.styles.map((s) => text(s.label, lang)).join(', ') || undefined,
      author: post.author.editorial ? { '@id': `${base}/#organization` } : { '@type': 'Person', name: author },
      publisher: { '@id': `${base}/#organization` },
      datePublished: vnIso(post.publishedAt) ?? undefined, dateModified: vnIso(post.updatedAt),
      wordCount: say(body, written).trim().split(/\s+/).filter(Boolean).length,
      about: guideTopic ? { '@id': ids.topic } : undefined,
      isPartOf: post.parent ? { '@type': 'BlogPosting', url: `${base}${inLang(`/blog/${post.parent.slug}`, lang)}`, headline: say(post.parent.title, lang) } : undefined,
      hasPart: post.children.length ? post.children.map((c) => ({ '@type': 'BlogPosting', url: `${base}${inLang(`/blog/${c.slug}`, lang)}`, headline: say(c.title, lang) })) : undefined,
      // The sources a guide rests on, for readers and for assistants that weigh them.
      citation: post.sources.length ? post.sources.map((s) => ({ '@type': 'CreativeWork', name: s.title, url: s.url, publisher: s.publisher ? { '@type': 'Organization', name: s.publisher } : undefined })) : undefined,
    },
    // A genre guide names the genre it defines (schema.org has no MusicGenre type: a DefinedTerm does it).
    guideTopic ? {
      '@type': 'DefinedTerm', '@id': ids.topic, name: say(post.title, 'en').replace(/^What is (an? )?/i, '').replace(/\?.*$/, ''),
      description: clip(plain(say(body, written)), 300), inDefinedTermSet: { '@type': 'DefinedTermSet', name: vi ? 'Các dòng nhạc điện tử (EDM)' : 'Electronic dance music genres', url: `${base}${inLang('/blog?category=styles', lang)}` },
    } : null,
    post.faq.length ? {
      '@type': 'FAQPage', '@id': ids.faq, inLanguage: written,
      mainEntity: post.faq.map((f) => ({ '@type': 'Question', name: say(f.q, written), acceptedAnswer: { '@type': 'Answer', text: say(f.a, written) } })),
    } : null,
    post.tracks.length ? {
      '@type': 'ItemList', '@id': ids.tracks, name: t('tracks', lang), numberOfItems: post.tracks.length,
      itemListElement: post.tracks.map((tr, i) => ({
        '@type': 'ListItem', position: i + 1,
        item: { '@type': 'MusicRecording', name: tr.title, url: tr.url ?? undefined, datePublished: tr.year ? String(tr.year) : undefined, byArtist: tr.authorName ? { '@type': 'MusicGroup', name: tr.authorName } : undefined },
      })),
    } : null,
    crumbList(base, ids.crumbs, crumbs),
  ].filter(Boolean);
  return {
    kind: 'blog', lang, url, canonical, alternates, markdown: `${path}.md${vi ? '' : '?lang=en'}`,
    title: `${clip(title, 62)} | FeestFinder`, description, robots: ROBOTS,
    image: { ...image, alt: title },
    publishedAt: vnIso(post.publishedAt) ?? null,
    updatedAt: vnIso(post.updatedAt)!,
    headings: { facts: t('facts', lang), about: title, upcoming: t('tracks', lang), past: vi ? 'Câu hỏi thường gặp' : 'Frequently asked', updated: t('updated', lang) },
    page: {
      crumbs, kicker: [t('blog', lang), category].join(' · '), h1: title, summary: description, facts,
      about: [say(body, written), post.sources.length ? `${vi ? 'Nguồn tham khảo' : 'Sources'}:\n${post.sources.map((x) => `- ${x.title}${x.publisher ? ` (${x.publisher})` : ''}: ${x.url}`).join('\n')}` : ''].filter(Boolean).join('\n\n'),
      upcoming: post.tracks.map((tr) => ({ title: tr.title, path: tr.url ?? canonical, line: [tr.providerLabel, tr.authorName, say(tr.note, lang)].filter(Boolean).join(' · ') })),
      past: post.faq.map((f) => ({ title: say(f.q, written), path: `${canonical}#faq`, line: say(f.a, written) })),
      otherLang: { label: t('otherLang', lang), path: vi ? `${path}?lang=en` : path },
    },
    jsonLd: { '@context': 'https://schema.org', '@graph': JSON.parse(JSON.stringify(graph)) },
  };
}
