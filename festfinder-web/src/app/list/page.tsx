import type { Metadata } from 'next';
import WebScreen from '@/surfaces/web';

export const metadata: Metadata = { title: 'Tất cả sự kiện' };

export default function Page() {
  return <WebScreen />;
}
