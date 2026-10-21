import type { Ctx } from '../../context.ts';
import { many } from '../../db/index.ts';
import type { Row } from '../../db/rows.ts';
import { cityLabel, launchedCities } from '../../lib/places.ts';
import { type ArtistSeo, baseOf, type BlogSeo, type CollectionSeo, type DirectorySeo, eventLine, type EventSeo, type LineRow, type OrganizerSeo, type ProjectSeo, PUBLIC_EVENT, t, text } from './shared.ts';

/* Pages as text for AI agents: Markdown and llms.txt. Part of services/seo.ts. */

const stamp = (iso: string) => `${iso.slice(11, 16)} ${iso.slice(8, 10)}/${Number(iso.slice(5, 7))}/${iso.slice(0, 4)}`;

/** A page as Markdown: the same answer, facts and lists as its HTML, with links made absolute. */
export function pageMarkdown(ctx: Ctx, seo: EventSeo | OrganizerSeo | CollectionSeo | ArtistSeo | DirectorySeo | ProjectSeo | BlogSeo): string {
  const base = baseOf(ctx);
  const absUrl = (href: string) => (/^https?:/.test(href) ? href : base + href);
  const md = (s: string) => s.replace(/([\\`*_[\]])/g, '\\$1');
  const p = seo.page;
  const out: string[] = [`# ${md(p.h1)}`, '', `> ${md(p.summary)}`, ''];
  const sec = (title: string, lines: string[]) => { if (lines.length) out.push(`## ${title}`, '', ...lines, ''); };
  const linkLine = (x: { title: string; path: string; line: string }) => `- [${md(x.title)}](${absUrl(x.path)}) · ${md(x.line)}`;
  sec(seo.headings.facts, p.facts.map((f) => `- **${md(f.label)}:** ${f.href ? `[${md(f.value)}](${absUrl(f.href)})` : md(f.value)}`));
  sec(seo.headings.about, p.about ? [md(p.about)] : []);
  if (seo.kind === 'event') {
    const e = seo.page, h = seo.headings;
    sec(h.lineup, e.lineup.map((a) => `- ${md(a)}`));
    sec(h.timetable, e.timetable.flatMap((d) => [`### ${d.day}`, '', ...d.sets.map((x) => `- ${x.time} · ${md(x.artist)}${x.stage ? ` · ${md(x.stage)}` : ''}`), '']));
    sec(h.tickets, e.tickets.map((x) => `- ${md(x.name)}: ${x.price} · ${x.state}`));
    sec(h.updates, e.updates.map((u) => `- ${u.atLabel} · ${md(u.kind)}: ${md(u.body)}`));
    sec(h.faq, e.faq.flatMap((f) => [`**${md(f.question)}**`, '', md(f.answer), '']));
    sec(h.editions, e.editions.map((x) => `- ${md(x.label)}: [${md(x.title)}](${absUrl(x.path)}) · ${md(x.line)}`));
    sec(h.related, e.related.map(linkLine));
  } else {
    sec(seo.headings.upcoming, seo.page.upcoming.map(linkLine));
    sec(seo.headings.past, seo.page.past.map(linkLine));
    if (seo.kind === 'artist') sec(seo.headings.mixes, seo.page.mixes.map((m) => `- [${md(m.title)}](${m.url}) · ${md(m.line)}`));
  }
  // The other language's Markdown: /e/<slug>.md and /e/<slug>.md?lang=en.
  const other = `${absUrl(p.otherLang.path.split('?')[0])}.md${seo.lang === 'vi' ? '?lang=en' : ''}`;
  out.push('---', '', `${seo.headings.updated} ${stamp(seo.updatedAt)} · ${t('source', seo.lang)}: ${seo.canonical} · [${p.otherLang.label}](${other})`, '');
  return out.join('\n');
}

/**
 * /llms.txt (llmstxt.org): what FeestFinder is, and where its pages are as Markdown. Search
 * engines do not use it yet; AI agents that browse on someone's behalf read it to find pages
 * without crawling the site.
 */
export async function llmsTxt(ctx: Ctx): Promise<string> {
  const now = ctx.clock.now();
  const base = baseOf(ctx);
  const [events, orgs, projects, posts] = await Promise.all([
    many<LineRow & Pick<Row<'events'>, 'slug' | 'title' | 'genre'>>(ctx.db,
      `select e.slug, e.title, e.genre, e.starts_on, e.start_time, e.venue_name, e.city, e.entry_mode, e.price_from, e.currency
         from events e where ${PUBLIC_EVENT} and e.status = 'live' and e.ends_at >= $1 order by e.starts_at limit 300`, [now]),
    many<{ slug: string; name: string; n: number; genres: string[] | null }>(ctx.db,
      `select o.slug, o.name, count(*)::int as n, array_agg(distinct e.genre) filter (where e.genre is not null) as genres
         from organizers o join events e on e.organizer_id = o.id
        where ${PUBLIC_EVENT} and e.status = 'live' and e.ends_at >= $1 and o.suspended_at is null
        group by o.slug, o.name order by count(*) desc, o.name limit 200`, [now]),
    many<Pick<Row<'projects'>, 'slug' | 'title' | 'pitch' | 'city' | 'seeking'>>(ctx.db, `select slug, title, pitch, city, seeking from projects where status = 'open' order by published_at desc limit 100`),
    many<{ slug: string; title: string; excerpt: string; category: string }>(ctx.db,
      `select slug, coalesce(nullif(title->>'en', ''), title->>'vi') as title, coalesce(nullif(excerpt->>'en', ''), excerpt->>'vi', '') as excerpt, category
         from blog_posts where status = 'published' order by published_at desc limit 100`),
  ]);
  const md = (s: string) => s.replace(/([\\`*_[\]])/g, '\\$1');
  return [
    '# FeestFinder',
    '',
    `> FeestFinder lists festivals, club nights and raves of electronic music in Asia (${launchedCities().map((c) => c.name.en).join(', ')}): dates, venues, ticket prices, lineups, organisers and the sources each event was confirmed from. Organisers, the community and public event pages feed it; moderators check each event before it goes live.`,
    '',
    'Every event and organiser page exists in Vietnamese (`/e/<slug>`, `/o/<slug>`) and English (add `?lang=en`), carries schema.org data in its HTML, and has a Markdown version at the same address plus `.md`. Prices are in the event\'s local currency (₫ in Vietnam); dates and times are local to the event\'s city. Ticket links go to the seller FeestFinder points to; FeestFinder sells no tickets.',
    '',
    '## Upcoming events',
    '',
    ...(events.length ? events.map((e) => `- [${md(e.title)}](${base}/e/${e.slug}.md): ${[e.genre, eventLine(e, 'en')].filter(Boolean).join(' · ')}`) : ['- Nothing is listed right now.']),
    '',
    '## Organisers',
    '',
    ...orgs.map((o) => `- [${md(o.name)}](${base}/o/${o.slug}.md): ${o.n} upcoming ${o.n === 1 ? 'event' : 'events'}${o.genres?.length ? ` · ${o.genres.join(', ')}` : ''}`),
    '',
    ...(projects.length ? [
      '## Projects looking for backers',
      '',
      'Ideas for nights that ask for investment, sponsors, artists, a venue or an organising partner. FeestFinder introduces the people and never handles the money.',
      '',
      ...projects.map((x) => `- [${md(x.title)}](${base}/p/${x.slug}.md): ${[text(cityLabel(x.city), 'en'), x.seeking.join(', '), md(x.pitch)].filter(Boolean).join(' · ')}`),
      '',
    ] : []),
    ...(posts.length ? [
      '## Blog',
      '',
      'Posts by the community and the team about music styles, music news, playlists, DJ skills, clubs and cafés, in Vietnamese and English (add `?lang=en`), each with a Markdown version.',
      '',
      ...posts.map((x) => `- [${md(x.title)}](${base}/blog/${x.slug}.md?lang=en): ${[x.category, md(x.excerpt)].filter(Boolean).join(' · ')}`),
      '',
    ] : []),
    '## Agents',
    '',
    'Read only, no account. Ticket links go through FeestFinder (`/go/<slug>?src=agent`) to the seller; FeestFinder sells no tickets.',
    '',
    `- [The list as Markdown](${base}/list.md): the same filters as the list, e.g. [techno in Ho Chi Minh City this weekend](${base}/list.md?city=ho-chi-minh&time=weekend&style=techno), [Bangkok this month, under 1,500 THB](${base}/list.md?city=bangkok&time=month&priceMax=1500&lang=en), [daytime parties](${base}/list.md?type=day&time=all)`,
    `- MCP server (Streamable HTTP, stateless): \`POST ${base}/mcp\` with the tools search_events, get_event, search_artists, get_artist, list_places and list_styles`,
    '',
    '## Optional',
    '',
    `- [Every event, by city](${base}/list): the list as people see it; filters \`?city=ho-chi-minh|ha-noi|da-nang|nha-trang\`, \`&genre=EDM\`, \`&time=tonight|weekend|7days|month\``,
    `- [Sitemap](${base}/sitemap.xml): every public page in both languages, with the date it last changed`,
    `- [About FeestFinder](${base}/about)`,
    '',
  ].join('\n');
}
