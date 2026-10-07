import { notFound } from 'next/navigation';
import WebScreen from '@/surfaces/web';
import { EventSummary, OrganizerSummary } from '@/components/summaries';
import { jsonLdHtml, type Lang } from '@/lib/api';
import { load, loadDir, type DirKey, type DirProps, type Kind, type Props } from '@/components/seo-meta';

export { directoryMetadata, seoMetadata } from '@/components/seo-meta';

/*
 * An event, organiser, artist or public collection page in one language: Vietnamese at /e/<slug>, English at
 * /e/<slug>?lang=en (which next.config.ts rewrites to /e/<slug>/en, so both stay cached pages);
 * the same for /o/<slug>, /a/<slug> and /c/<slug>. The API builds the head, the structured data and the facts, the same
 * as for its own pages.
 */

export const SeoPage = (kind: Kind, lang: Lang) => async function Page({ params }: Props) {
  const seo = await load(kind, (await params).slug, lang);
  if (!seo) notFound();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(seo.jsonLd) }} />
      <WebScreen>{seo.kind === 'event' ? <EventSummary seo={seo} /> : <OrganizerSummary seo={seo} />}</WebScreen>
    </>
  );
};

export const DirectoryPage = (keyOf: DirKey, lang: Lang) => async function Page({ params }: DirProps) {
  const seo = await loadDir(keyOf((await params).slug), lang);
  if (!seo) notFound();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(seo.jsonLd) }} />
      <WebScreen><OrganizerSummary seo={seo} /></WebScreen>
    </>
  );
};
