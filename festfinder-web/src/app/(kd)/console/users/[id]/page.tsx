import { redirect } from 'next/navigation';

/** An account's own address opens the account list with its drawer. */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  redirect('/console/users?id=' + encodeURIComponent((await params).id));
}
