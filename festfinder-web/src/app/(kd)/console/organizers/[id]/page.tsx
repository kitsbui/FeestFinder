import { redirect } from 'next/navigation';

/** /console/organizers/<id>, the way /ops linked an organiser: the directory with its drawer open. */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect('/console/organizers?id=' + encodeURIComponent(id));
}
