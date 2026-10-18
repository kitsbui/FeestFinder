import type { Metadata } from 'next';
import { everyLang } from '@/components/seo-meta';
import { ProjectsPage } from '@/kd/web/projects/page';

export const revalidate = 120;

// /p?lang=th, rewritten here in next.config.ts.
export const metadata: Metadata = {
  title: { absolute: 'Projects looking for sponsors, investors and artists | FeestFinder' },
  description: 'Ideas for electronic music nights looking for sponsors, investors, artists, a venue or an organising partner. FeestFinder introduces the people and never holds money.',
  alternates: { canonical: '/p?lang=th', languages: everyLang('/p') },
};

export default function Page() {
  return <ProjectsPage lang="th" />;
}
