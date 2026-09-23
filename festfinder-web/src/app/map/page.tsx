import type { Metadata } from 'next';
import WebScreen from '@/surfaces/web';

export const metadata: Metadata = { title: 'Bản đồ sự kiện' };

export default function Page() {
  return <WebScreen />;
}
