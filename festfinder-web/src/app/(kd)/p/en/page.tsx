import type { Metadata } from 'next';
import { ProjectsPage } from '@/kd/web/projects/page';

export const revalidate = 120;

// /p?lang=en, rewritten here in next.config.ts.
export const metadata: Metadata = {
  title: { absolute: 'Projects looking for sponsors, investors and artists | FeestFinder' },
  description: 'Ideas for electronic music nights looking for sponsors, investors, artists, a venue or an organising partner. FeestFinder introduces the people and never holds money.',
  alternates: { canonical: '/p?lang=en', languages: { vi: '/p', en: '/p?lang=en', 'x-default': '/p' } },
};

export default function Page() {
  return <ProjectsPage lang="en" />;
}
