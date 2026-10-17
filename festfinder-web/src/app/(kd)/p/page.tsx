import type { Metadata } from 'next';
import { everyLang } from '@/components/seo-meta';
import { ProjectsPage } from '@/kd/web/projects/page';

export const revalidate = 120;

export const metadata: Metadata = {
  title: { absolute: 'Dự án đang kêu gọi tài trợ, đầu tư và nghệ sĩ | FeestFinder' },
  description: 'Ý tưởng cho những đêm nhạc điện tử đang tìm nhà tài trợ, nhà đầu tư, nghệ sĩ, địa điểm và đối tác tổ chức. FeestFinder kết nối các bên, không giữ tiền.',
  alternates: { canonical: '/p', languages: everyLang('/p') },
};

export default function Page() {
  return <ProjectsPage lang="vi" />;
}
