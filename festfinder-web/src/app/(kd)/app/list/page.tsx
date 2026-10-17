import { moved } from '@/kd/app/moved';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

// The app's map is the home page's map view.
export default async function Page({ searchParams }: Props) {
  await moved('/?view=map', searchParams);
}
