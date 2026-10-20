import type { Metadata } from 'next';
import { BlogPage } from '@/kd/web/blog/page';

export const revalidate = 120;

// /blog?lang=en (and th, ja, id), rewritten here in next.config.ts.
export const metadata: Metadata = {
  title: { absolute: 'Electronic music blog: styles, news, playlists, DJ skills, clubs and cafés | FeestFinder' },
  description: 'Posts by the FeestFinder community about electronic music styles, music news, playlists, DJ knowledge and skills, and round-ups and reviews of clubs and cafés in Asia.',
  alternates: { canonical: '/blog?lang=en', languages: { vi: '/blog', en: '/blog?lang=en', 'x-default': '/blog' } },
};

export default function Page() {
  return <BlogPage lang="en" />;
}
