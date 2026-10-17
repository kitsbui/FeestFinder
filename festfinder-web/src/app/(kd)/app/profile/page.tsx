import { moved } from '@/kd/app/moved';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

// "Tôi" is /profile: the profile and, on a phone, the hub.
export default async function Page({ searchParams }: Props) {
  await moved('/profile', searchParams);
}
