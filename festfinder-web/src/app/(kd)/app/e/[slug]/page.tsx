import { moved } from '@/kd/app/moved';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

// One event page: the site's, which has the group plan and the guide too.
export default async function Page({ params, searchParams }: Props) {
  await moved('/e/' + encodeURIComponent((await params).slug), searchParams);
}
