/**
 * The style hub (festfinder-backend routes/styles.ts, GET /styles/:key): everything the site has
 * about one style in a row of links (its coming nights, its artists, its guide, its playlists, its
 * news) and, when a chart is read for it (services/charts.ts), the chart's top ten with a link to
 * the provider. Rendered on the server where a style leads a page: a blog post's first style, the
 * artist directory's style page.
 */
import { ArrowSquareOutIcon } from '@phosphor-icons/react/ssr';
import { api, type Lang } from '@/lib/api';
import { fill, pick, type Pair } from '../../copy';
import { dayMonth } from '../../format';
import { inLang } from '../../link';
import { BLOG } from './copy';
import { text } from './model';

interface Hub {
  style: { key: string; label: Pair };
  nights: number; artists: number; news: number;
  guide: { slug: string; title: Pair } | null;
  playlists: { slug: string; title: Pair }[];
  posts: { slug: string; title: Pair; category: string }[];
  charts: { id: string; provider: string; name: string; url: string; fetchedAt: string | null; entries: { rank: number; artist: string; title: string; label: string | null; url: string | null }[] }[];
  links: { nights: string; artists: string; news: string; guide: string | null };
}

export async function StyleHub({ style, lang, except }: { style: string; lang: Lang; except?: string }) {
  const hub = await api<Hub>(`/styles/${encodeURIComponent(style)}`, { lang, revalidate: 300 }).catch(() => null);
  if (!hub) return null;
  const T = pick(BLOG, lang);
  const name = text(hub.style.label, lang);
  const links: { href: string; label: string; external?: boolean }[] = [
    { href: inLang(hub.links.nights, lang), label: hub.nights ? fill(T.hubNightsN, { n: hub.nights }) : T.hubNights },
    { href: inLang(hub.links.artists, lang), label: hub.artists ? fill(T.hubArtistsN, { n: hub.artists }) : T.hubArtists },
    ...(hub.guide && hub.guide.slug !== except ? [{ href: inLang(`/blog/${hub.guide.slug}`, lang), label: T.hubGuide }] : []),
    ...hub.playlists.filter((p) => p.slug !== except).slice(0, 3).map((p) => ({ href: inLang(`/blog/${p.slug}`, lang), label: `${T.hubPlaylist}: ${text(p.title, lang)}` })),
    ...(hub.news ? [{ href: inLang(hub.links.news, lang), label: fill(T.hubNewsN, { n: hub.news }) }] : []),
  ];
  return (
    <section aria-labelledby={`hub-${style}`} className="flex max-w-read flex-col gap-3" lang={lang}>
      <h2 id={`hub-${style}`} className="kd-h">{fill(T.hubTitle, { s: name })}</h2>
      <ul className="flex flex-wrap gap-x-1.5 gap-y-2">
        {links.map((l) => <li key={l.href + l.label}><a href={l.href} className="kd-hit inline-flex items-center"><span className="kd-tag">{l.label}</span></a></li>)}
      </ul>
      {hub.charts.map((c) => (
        <div key={c.id} className="flex flex-col gap-2 rounded-card bg-surface-1 p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h3 className="kd-hs">{c.name}</h3>
            <span className="kd-m kd-num">{c.fetchedAt ? fill(T.hubChartAt, { d: dayMonth(c.fetchedAt.slice(0, 10), lang) }) : ''}</span>
          </div>
          <ol className="flex flex-col">
            {c.entries.map((e) => (
              <li key={e.rank} className="flex min-w-0 items-baseline gap-3 border-t border-line-1 py-2">
                <span className="kd-num w-6 shrink-0 text-right text-fg-3">{e.rank}</span>
                <span className="flex min-w-0 flex-1 flex-col">
                  {e.url ? <a href={e.url} target="_blank" rel="noopener" className="kd-hit kd-hs kd-ell hover:underline">{e.artist} — {e.title}</a> : <span className="kd-hs kd-ell">{e.artist} — {e.title}</span>}
                  {e.label ? <span className="kd-s kd-ell text-xs">{e.label}</span> : null}
                </span>
              </li>
            ))}
          </ol>
          <a href={c.url} target="_blank" rel="noopener" className="kd-s kd-hit inline-flex items-center gap-1 self-start text-info underline underline-offset-2">
            {fill(T.hubChartMore, { s: c.provider === 'beatport' ? 'Beatport' : 'Spotify' })}<ArrowSquareOutIcon size={12} aria-hidden="true" />
          </a>
        </div>
      ))}
    </section>
  );
}
