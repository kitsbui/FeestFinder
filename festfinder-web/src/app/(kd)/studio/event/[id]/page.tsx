import { redirect } from 'next/navigation';

/** The old one-event address: the dashboard with that event picked. */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect('/studio?event=' + encodeURIComponent(id));
}
