import { moved } from '@/kd/app/moved';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

// Saved events and collections live at /saved.
export default async function Page({ searchParams }: Props) {
  await moved('/saved', searchParams);
}
