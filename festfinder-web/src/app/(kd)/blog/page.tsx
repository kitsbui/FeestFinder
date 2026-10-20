import type { Metadata } from 'next';
import { BlogPage } from '@/kd/web/blog/page';

export const revalidate = 120;

export const metadata: Metadata = {
  title: { absolute: 'Blog nhạc điện tử: dòng nhạc, tin tức, playlist, kỹ năng DJ, club và cafe | FeestFinder' },
  description: 'Bài viết của cộng đồng FeestFinder về các dòng nhạc điện tử, tin tức âm nhạc, playlist, kiến thức và kỹ năng DJ, tổng hợp và review club, cafe ở châu Á.',
  alternates: { canonical: '/blog', languages: { vi: '/blog', en: '/blog?lang=en', 'x-default': '/blog' } },
};

export default function Page() {
  return <BlogPage lang="vi" />;
}
