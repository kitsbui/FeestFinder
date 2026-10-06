import { appMetadata, appViewport } from '@/kd/app/meta';
import { CheckoutScreen } from '@/kd/app/screens';

export const metadata = appMetadata;
export const viewport = appViewport;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <CheckoutScreen slug={(await params).slug} />;
}
