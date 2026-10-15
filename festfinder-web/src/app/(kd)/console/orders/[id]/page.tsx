import { redirect } from 'next/navigation';

/** An order's own address opens the order list with its drawer. */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  redirect('/console/orders?id=' + encodeURIComponent((await params).id));
}
