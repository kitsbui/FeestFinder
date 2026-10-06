import { appMetadata, appViewport } from '@/kd/app/meta';
import { ChatScreen } from '@/kd/app/screens';

export const metadata = appMetadata;
export const viewport = appViewport;

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <ChatScreen friendId={(await params).id} />;
}
