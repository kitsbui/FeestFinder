import type { Metadata } from 'next';
import { ProjectsPage } from '@/kd/web/projects/page';

export const revalidate = 120;

export const metadata: Metadata = {
  title: { absolute: 'Dự án đang kêu gọi tài trợ, đầu tư và nghệ sĩ | FeestFinder' },
  description: 'Ý tưởng cho những đêm nhạc điện tử đang tìm nhà tài trợ, nhà đầu tư, nghệ sĩ, địa điểm và đối tác tổ chức. FeestFinder kết nối các bên, không giữ tiền.',
  alternates: { canonical: '/p', languages: { vi: '/p', en: '/p?lang=en', 'x-default': '/p' } },
};

export default function Page() {
  return <ProjectsPage lang="vi" />;
}
