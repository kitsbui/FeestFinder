import type { Metadata } from 'next';
import WebScreen from '@/surfaces/web';

export const metadata: Metadata = { title: 'Về FeestFinder' };

export default function Page() {
  return <WebScreen />;
}
