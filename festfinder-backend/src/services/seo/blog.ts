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

const STEP = /^###\s+(?:Bước|Step)\s+\d+\s*[:.]\s*(.+)$/;
const PREPARE = /^##\s+(?:Bạn cần chuẩn bị|What you need)\s*$/;

/**
 * A lesson's steps for HowTo: each "### Bước n: …" ("### Step n: …") heading with the words under
 * it up to the next heading, and the list under "## Bạn cần chuẩn bị" ("## What you need") as its
 * tools. A post without three steps is not a how-to.
 */
function howToOf(md: string) {
  const steps: { name: string; text: string }[] = [];
  const tools: string[] = [];
  let step: { name: string; lines: string[] } | null = null;
  let preparing = false;
  const close = () => { if (step) steps.push({ name: plain(step.name), text: clip(plain(step.lines.join('\n')), 500) }); step = null; };
  for (const line of md.split('\n')) {
    const m = line.match(STEP);
    if (m) { close(); step = { name: m[1], lines: [] }; preparing = false; continue; }
    if (/^#{2,3}\s/.test(line)) { close(); preparing = PREPARE.test(line); continue; }
    if (step) step.lines.push(line);
    else if (preparing && /^\s*-\s+/.test(line)) tools.push(plain(line));
  }
  close();
  return steps.length >= 3 ? { steps, tools } : null;
}

/** A glossary's terms for a DefinedTermSet: the rows of every table whose first column is headed "Thuật ngữ" or "Term". */
function termsOf(md: string) {
  const cells = (row: string) => row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
  const terms: { name: string; description: string }[] = [];
  for (const chunk of md.split(/\n{2,}/)) {
    const rows = chunk.split('\n').filter((l) => l.trim());
    if (rows.length < 3 || !rows.every((l) => /^\s*\|.*\|\s*$/.test(l)) || !/^(Thuật ngữ|Term)$/i.test(cells(rows[0])[0])) continue;
    for (const row of rows.slice(2)) {
      const [name, description] = cells(row);
      if (name && description) terms.push({ name: plain(name), description: plain(description) });
    }
  }
  return terms.length >= 5 ? terms : null;
}

const VENUE_ADDRESS = /^-\s+\*\*(?:Địa chỉ|Address):\*\*\s*(.+)$/;
const VENUE_LINK = /^-\s+\*\*(?:Trang chính thức|Official page):\*\*\s*\[[^\]]*\]\((https:\/\/[^\s)]+)\)/;

/**
 * A club guide's venues for an ItemList of NightClub (the club guides, src/content/blog/club-guides):
 * every "## Name — what it is" section whose list gives an address, with its official link and
 * the words under the list. A post without three such sections is no venue list.
 */
function venuesOf(md: string) {
  const out: { name: string; address: string; url: string | null; description: string }[] = [];
  let cur: { name: string; address: string | null; url: string | null; lines: string[] } | null = null;
  const close = () => { if (cur?.address) out.push({ name: cur.name, address: cur.address, url: cur.url, description: clip(plain(cur.lines.join('\n')), 300) }); cur = null; };
  for (const line of md.split('\n')) {
    if (/^##\s/.test(line)) { close(); cur = { name: plain(line.replace(/^##\s+/, '')).split(/\s[—–]\s/)[0], address: null, url: null, lines: [] }; continue; }
    if (!cur) continue;
    const a = VENUE_ADDRESS.exec(line);
    if (a) { cur.address = plain(a[1]); continue; }
    const l = VENUE_LINK.exec(line);
    if (l) { cur.url = l[1]; continue; }
    if (/^-\s+\*\*/.test(line) || /^\s*\|/.test(line)) continue;
    cur.lines.push(line);
  }
  close();
  return out.length >= 3 ? out : null;
}

const EVENT_DATES = /^-\s+\*\*(?:Ngày|Dates):\*\*\s*(\d{4}-\d{2}-\d{2})(?:\s*[–-]\s*(\d{4}-\d{2}-\d{2}))?\s*$/;
const EVENT_PLACE = /^-\s+\*\*(?:Địa điểm|Place):\*\*\s*(.+)$/;
const EVENT_SITE = /^-\s+\*\*(?:Trang chính thức|Official site):\*\*\s*\[[^\]]*\]\((https:\/\/[^\s)]+)\)/;
const EVENT_LINEUP = /^-\s+\*\*(?:Lineup|Line-up):\*\*\s*(.+)$/;
const EVENT_CONFIRMED = /^-\s+\*\*(?:Trạng thái|Status):\*\*\s*(?:Đã xác minh|Confirmed)/;

/**
 * A news post's festivals for Event markup (the news pack's `eventSection`, src/content/blog/edm-news):
 * every "## Name — what it is" section whose list gives ISO dates, a place and the organiser's
 * page, and says the organiser confirmed them. A festival still to be checked stays words only.
 */
function eventsOf(md: string) {
  type Ev = { name: string; start: string | null; end: string | null; place: string | null; url: string | null; lineup: string[]; confirmed: boolean; lines: string[] };
  const out: { name: string; start: string; end: string | null; place: string; url: string; lineup: string[]; description: string }[] = [];
  let cur: Ev | null = null;
  const close = () => {
    if (cur?.confirmed && cur.start && cur.place && cur.url) out.push({ name: cur.name, start: cur.start, end: cur.end, place: cur.place, url: cur.url, lineup: cur.lineup, description: clip(plain(cur.lines.join('\n')), 300) });
    cur = null;
  };
  for (const line of md.split('\n')) {
    if (/^##\s/.test(line)) { close(); cur = { name: plain(line.replace(/^##\s+/, '')).split(/\s[—–]\s/)[0], start: null, end: null, place: null, url: null, lineup: [], confirmed: false, lines: [] }; continue; }
    if (!cur) continue;
    let m: RegExpExecArray | null;
    if ((m = EVENT_DATES.exec(line))) { cur.start = m[1]; cur.end = m[2] ?? null; continue; }
    if ((m = EVENT_PLACE.exec(line))) { cur.place = plain(m[1]); continue; }
    if ((m = EVENT_SITE.exec(line))) { cur.url = m[1]; continue; }
    if ((m = EVENT_LINEUP.exec(line))) { cur.lineup = m[1].split(',').map(plain).filter((x) => x && !/^(Chưa công bố|Not announced)$/.test(x)); continue; }
    if (EVENT_CONFIRMED.test(line)) { cur.confirmed = true; continue; }
    if (/^-\s+\*\*/.test(line) || /^\s*\|/.test(line)) continue;
    cur.lines.push(line);
  }
  close();
  return out.length ? out : null;
}

/**
 * A published post (services/blog.ts): Vietnamese at /blog/<slug>, English at ?lang=en, each
 * its own page with the other named, when the post is written in both; a post written in one
 * language has that one address. A guide adds its facts, its questions (FAQPage), its tracks
 * (ItemList of MusicRecording) and its sources (citation); a lesson its steps (HowTo), a
 * glossary its terms (DefinedTermSet), a club guide its venues (ItemList of NightClub) and a
 * playlist post its MusicPlaylist. Drafts, posts in review and posts the
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
  const ids = { page: url, post: `${canonical}#post`, crumbs: `${url}#breadcrumb`, faq: `${url}#faq`, tracks: `${url}#tracks`, topic: `${canonical}#topic`, howTo: `${url}#howto`, terms: `${url}#terms`, venues: `${url}#venues`, playlist: `${url}#playlist`, events: `${url}#events` };
  const guideTopic = post.category.key === 'styles' && post.facts.length > 0;
  const howTo = howToOf(say(body, written));
  const terms = termsOf(say(body, written));
  const venues = post.category.key === 'venues' ? venuesOf(say(body, written)) : null;
  const playlist = post.category.key === 'playlist' && post.tracks.length > 0;
  const news = post.category.key === 'news';
  const events = news ? eventsOf(say(body, written)) : null;
  const graph = [
    ...siteNodes(base),
    {
      '@type': 'WebPage', '@id': ids.page, url, name: `${title} | FeestFinder`, description, inLanguage: written,
      isPartOf: { '@id': `${base}/#website` }, breadcrumb: { '@id': ids.crumbs }, mainEntity: { '@id': ids.post },
      primaryImageOfPage: { '@type': 'ImageObject', url: image.url, width: image.width, height: image.height },
    },
    {
      // A news post is a NewsArticle (the news pack, services/news.ts's feed aside); every other post a BlogPosting.
      '@type': news ? 'NewsArticle' : 'BlogPosting', '@id': ids.post, headline: clip(title, 110), description, url: canonical, image: image.url, inLanguage: written,
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
    // A lesson that goes step by step (the DJ lessons: what to do, where to look, what to listen for).
    howTo ? {
      '@type': 'HowTo', '@id': ids.howTo, name: clip(title, 110), description, inLanguage: written, image: image.url,
      tool: howTo.tools.length ? howTo.tools.map((name) => ({ '@type': 'HowToTool', name })) : undefined,
      step: howTo.steps.map((x, i) => ({ '@type': 'HowToStep', position: i + 1, name: x.name, text: x.text })),
    } : null,
    terms ? {
      '@type': 'DefinedTermSet', '@id': ids.terms, name: title, inLanguage: written,
      hasDefinedTerm: terms.map((x) => ({ '@type': 'DefinedTerm', name: x.name, description: x.description })),
    } : null,
    // A club guide's venues, each a NightClub with its address and its own page.
    venues ? {
      '@type': 'ItemList', '@id': ids.venues, name: title, numberOfItems: venues.length,
      itemListElement: venues.map((v, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'NightClub', name: v.name, address: v.address, url: v.url ?? undefined, description: v.description || undefined } })),
    } : null,
    // A news post's confirmed festivals, each a MusicEvent with its days, its place and the organiser's page.
    events ? {
      '@type': 'ItemList', '@id': ids.events, name: title, numberOfItems: events.length,
      itemListElement: events.map((e, i) => ({
        '@type': 'ListItem', position: i + 1,
        item: {
          '@type': 'MusicEvent', name: e.name, startDate: e.start, endDate: e.end ?? undefined, url: e.url, description: e.description || undefined,
          eventStatus: 'https://schema.org/EventScheduled', eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
          location: { '@type': 'Place', name: e.place, address: e.place },
          performer: e.lineup.length ? e.lineup.map((name) => ({ '@type': 'PerformingGroup', name })) : undefined,
        },
      })),
    } : null,
    // A playlist post is a MusicPlaylist of its tracks (each also in the ItemList below).
    playlist ? {
      '@type': 'MusicPlaylist', '@id': ids.playlist, name: clip(title, 110), description, url: canonical, numTracks: post.tracks.length,
      track: post.tracks.map((tr) => ({ '@type': 'MusicRecording', name: tr.title, url: tr.url ?? undefined, datePublished: tr.year ? String(tr.year) : undefined, byArtist: tr.authorName ? { '@type': 'MusicGroup', name: tr.authorName } : undefined })),
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
