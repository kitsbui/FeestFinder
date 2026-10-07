/**
 * The artist directory in Kính đêm (not drawn: built from the web nav, the list's filter row and
 * the profile's cover and avatar): /a, /a/style/<style> and /a/city/<city>, each with an English
 * page at ?lang=en. The server renders the head and structured data the API builds
 * (GET /seo/directory/:key), and the first 24 artists as links; filters, search and more
 * artists come in the browser. /a renders the filters its query names too, so a shared link
 * opens on its list.
 */
import { notFound } from 'next/navigation';
import { api, apiOr, jsonLdHtml, type DirectorySeo, type Lang } from '@/lib/api';
import { loadDir } from '@/components/seo-meta';
import { KdProvider } from '../../runtime';
import { WebNav } from '../chrome';
import { DirectoryBrowser } from './browser';
import {
  apiQuery, fromScope, queryOf, readAddress, sameFilters, scopeKey,
  type DirMeta, type DirPage, type Filters, type Scope,
} from './model';

type Search = Record<string, string | string[] | undefined>;

export async function loadDirectory(scope: Scope, lang: Lang, search?: Search) {
  const [seo, all, meta] = await Promise.all([
    loadDir(scopeKey(scope), lang),
    api<DirPage>('/artists?' + apiQuery(fromScope(scope)), { lang, revalidate: 300 }),
    apiOr<DirMeta>('/meta/discovery', { cities: [], styles: [] }, { revalidate: 300 }),
  ]);
  // An unknown style or city has no page (the API says so for both).
  if (!seo || !all) return null;
  // Only what the filters show goes to the browser.
  const lists: DirMeta = {
    cities: (meta.cities ?? []).map((c) => ({ slug: c.slug, name: c.name })),
    styles: (meta.styles ?? []).map((x) => ({ key: x.key, label: x.label, genre: x.genre })),
  };
  const roles = all.filters?.roles ?? [];
  // The query of /a may name more filters (model.ts, addressOf): the list starts from them.
  let start: Filters = fromScope(scope);
  let first = all;
  if (search) {
    const at = readAddress('/a', queryOf(search), { roles, meta: lists });
    const out = sameFilters(at, start) ? null : await api<DirPage>('/artists?' + apiQuery(at), { lang });
    if (out) { start = at; first = out; }
  }
  const page: DirPage = { items: first.items, total: first.total, nextOffset: first.nextOffset, filters: { roles } };
  return { seo, first: page, meta: lists, start };
}

export function DirectoryPage({ data, scope, lang }: {
  data: { seo: DirectorySeo; first: DirPage; meta: DirMeta; start: Filters };
  scope: Scope;
  lang: Lang;
}) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(data.seo.jsonLd) }} />
      <KdProvider lang={lang}>
        <div className="flex min-h-dvh flex-col" lang={lang}>
          <WebNav lang={lang} current="artists" />
          <DirectoryBrowser lang={lang} scope={scope} h1={data.seo.page.h1} first={data.first} start={data.start} meta={data.meta} />
        </div>
      </KdProvider>
    </>
  );
}

/**
 * A route's page: which list its address names, in one language. Only /a reads its query
 * (`query`): it is rendered on every request anyway, while the style and city pages are cached.
 */
export const directoryRoute = (scopeOf: (slug?: string) => Scope, lang: Lang, opts: { query?: boolean } = {}) =>
  async function Page(props: { params: Promise<{ slug?: string }>; searchParams: Promise<Search> }) {
    const scope = scopeOf((await props.params).slug);
    const data = await loadDirectory(scope, lang, opts.query ? await props.searchParams : undefined);
    if (!data) notFound();
    return <DirectoryPage data={data} scope={scope} lang={lang} />;
  };
