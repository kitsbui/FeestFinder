import type { Metadata } from 'next';
import WebScreen from '@/surfaces/web';

export const metadata: Metadata = { title: 'Đã lưu' };

export default function Page() {
  return <WebScreen />;
}
