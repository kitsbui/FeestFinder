import { redirect } from 'next/navigation';

/** Appeals are a filter of the moderation queue now. */
export default function Page() {
  redirect('/console?filter=appeals');
}
