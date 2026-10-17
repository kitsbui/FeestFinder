/**
 * The head of a site page that has one address per language (/about, /advertise): its title in
 * the reader's language, the canonical address and both languages' alternates, Open Graph.
 */
import type { Metadata } from 'next';
import { type Lang, langOf as langFrom, LANGS, type Pair, tx } from '../../copy';

export type SearchProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** ?lang=en|th|ja|id opens that language's page; anything else is Vietnamese. */
export const langOf = async (searchParams: SearchProps['searchParams']): Promise<Lang> => langFrom((await searchParams).lang);

export function sitePageMetadata(path: string, title: Pair, description: Pair, lang: Lang): Metadata {
  const at = (l: Lang) => (l === 'vi' ? path : path + '?lang=' + l);
  const url = at(lang);
  return {
    title: { absolute: tx(title, lang) },
    description: tx(description, lang),
    alternates: { canonical: url, languages: { ...Object.fromEntries(LANGS.map((l) => [l, at(l)])), 'x-default': path } },
    openGraph: {
      type: 'website', url, siteName: 'FeestFinder', title: tx(title, lang), description: tx(description, lang),
      locale: lang === 'vi' ? 'vi_VN' : 'en_US', alternateLocale: [lang === 'vi' ? 'en_US' : 'vi_VN'],
    },
  };
}
