/**
 * One city's home page (app/(kd)/in/[city]): next.config.ts rewrites /?city=<slug> there, in every
 * language, while the address names nothing else the list reads. The server draws that city's
 * nights, so the browser asks the API nothing on load and nothing on screen is swapped.
 */
import { apiOr, type Lang } from '@/lib/api';
import type { Meta } from './browser';
import { ListPage } from './page';

/** The listed cities, built ahead (the rewrite takes the same slugs); another renders on its first visit. */
export async function cityParams(): Promise<{ city: string }[]> {
  const meta = await apiOr<Pick<Meta, 'cities'>>('/meta/discovery', { cities: [] }, { revalidate: 300 });
  return meta.cities.filter((c) => /^[a-z0-9-]+$/.test(c.slug)).map((c) => ({ city: c.slug }));
}

export function cityPage(lang: Lang) {
  return async function Page({ params }: { params: Promise<{ city: string }> }) {
    return <ListPage lang={lang} city={(await params).city} />;
  };
}
