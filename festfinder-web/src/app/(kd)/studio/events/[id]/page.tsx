import { EventEditor } from '@/kd/studio/editor';

/** One listing in the editor, whatever its status. */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EventEditor key={id} id={id} />;
}
