import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import WebScreen from '@/surfaces/web';
import { LandingSummary } from '@/components/summaries';
import { api, jsonLdHtml, SITE_URL, type Landing, type Lang } from '@/lib/api';

/**
 * The city landing pages (/vi/ho-chi-minh/this-weekend, /en/ho-chi-minh/free/tonight, …). The API
 * writes their copy, answers, FAQs and structured data; this page puts them on the right
 * URL with the right canonical and alternate links.
 */
type Params = { params: Promise<{ city: string; facets: string[] }> };

/** Facets stack: /vi/ho-chi-minh/free/this-weekend is free events this weekend. */
const load = (lang: Lang, city: string, facets: string[]) =>
  api<Landing>(`/seo/landing/${lang}/${encodeURIComponent(city)}/${facets.map(encodeURIComponent).join('/')}`, { lang, revalidate: 900 });

/**
 * The design has one landing screen, this weekend in the city. That URL opens it; every
 * other facet (a genre, a district, free, a month) is served as the server-rendered page.
 */
const DESIGNED = 'ho-chi-minh/this-weekend';


/** The API links pages with its own base URL; the site serves them at its own. */
const onSite = (url: string) => {
  try {
    const u = new URL(url);
    return SITE_URL + u.pathname + u.search;
  } catch {
    return url;
  }
};

export function landingMetadata(lang: Lang) {
  return async function generateMetadata({ params }: Params): Promise<Metadata> {
    const { city, facets } = await params;
    const l = await load(lang, city, facets);
    if (!l) return { title: lang === 'vi' ? 'Không tìm thấy trang' : 'Page not found' };
    return {
      title: { absolute: l.meta.title },
      description: l.meta.description,
      alternates: {
        canonical: onSite(l.meta.canonical),
        languages: Object.fromEntries(Object.entries(l.meta.alternates).map(([k, v]) => [k, onSite(v)])),
      },
      openGraph: { title: l.meta.title, description: l.meta.description, url: onSite(l.meta.canonical), locale: lang === 'vi' ? 'vi_VN' : 'en_US' },
    };
  };
}

export function LandingPage(lang: Lang) {
  return async function Page({ params }: Params) {
    const { city, facets } = await params;
    const l = await load(lang, city, facets);
    if (!l) notFound();
    return (
      <>
        {l.jsonLd.map((block, i) => (
          <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(block) }} />
        ))}
        {`${city}/${facets.join('/')}` === DESIGNED ? (
          <WebScreen>
            <LandingSummary l={l} />
          </WebScreen>
        ) : (
          <>
            <div className="ff-atmos" aria-hidden="true"><div className="ff-aurora" /><div className="ff-grain" /></div>
            <LandingSummary l={l} standalone />
          </>
        )}
      </>
    );
  };
}
