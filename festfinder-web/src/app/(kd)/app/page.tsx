import { moved } from '@/kd/app/moved';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

// The app's Khám phá merged into the home page (owner, 2026-10-17; tech debt #18).
export default async function Page({ searchParams }: Props) {
  await moved('/', searchParams);
}
