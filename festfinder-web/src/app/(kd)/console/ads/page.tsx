import { redirect } from 'next/navigation';

/** Ads live with the featured shelves now. */
export default function Page() {
  redirect('/console/featured#ads');
}
