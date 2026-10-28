/**
 * One city's home page (app/(kd)/in/[city]): next.config.ts rewrites /?city=<slug> there, in every
 * language, while the address names nothing else the list reads. The server draws that city's
 * nights, so the browser asks the API nothing on load and nothing on screen is swapped.
 */
import { redirect } from 'next/navigation';
import { apiOr, type Lang } from '@/lib/api';
import type { Meta } from './browser';
import { ListPage } from './page';

/** The listed cities, built ahead (the rewrite takes the same slugs); one listed since renders on its first visit. */
export async function cityParams(): Promise<{ city: string }[]> {
  const meta = await apiOr<Pick<Meta, 'cities'>>('/meta/discovery', { cities: [] }, { revalidate: 300 });
  return meta.cities.filter((c) => /^[a-z0-9-]+$/.test(c.slug)).map((c) => ({ city: c.slug }));
}

/**
 * A slug the site does not list leads to the home page in the same language, so an invented
 * /?city=… renders nothing and asks the API for no list (each would be a page of its own).
 */
export function cityPage(lang: Lang) {
  return async function Page({ params }: { params: Promise<{ city: string }> }) {
    const { city } = await params;
    const listed = await cityParams();
    // An API that does not answer lists nothing: the page is then drawn as every city's, as before.
    if (listed.length && !listed.some((c) => c.city === city)) redirect(lang === 'vi' ? '/' : `/?lang=${lang}`);
    return <ListPage lang={lang} city={city} />;
  };
}
