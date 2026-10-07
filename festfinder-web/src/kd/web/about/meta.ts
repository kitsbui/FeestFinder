/**
 * The head of a site page that has one address per language (/about, /advertise): its title in
 * the reader's language, the canonical address and both languages' alternates, Open Graph.
 */
import type { Metadata } from 'next';
import type { Lang, Pair } from '../../copy';

export type SearchProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** ?lang=en opens the English page; anything else is Vietnamese. */
export const langOf = async (searchParams: SearchProps['searchParams']): Promise<Lang> => ((await searchParams).lang === 'en' ? 'en' : 'vi');

export function sitePageMetadata(path: string, title: Pair, description: Pair, lang: Lang): Metadata {
  const en = path + '?lang=en';
  const url = lang === 'en' ? en : path;
  return {
    title: { absolute: title[lang] },
    description: description[lang],
    alternates: { canonical: url, languages: { vi: path, en, 'x-default': path } },
    openGraph: {
      type: 'website', url, siteName: 'FeestFinder', title: title[lang], description: description[lang],
      locale: lang === 'vi' ? 'vi_VN' : 'en_US', alternateLocale: [lang === 'vi' ? 'en_US' : 'vi_VN'],
    },
  };
}
