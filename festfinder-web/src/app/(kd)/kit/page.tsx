import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Kit } from '@/kd/kit';
import { KdProvider } from '@/kd/runtime';

export const metadata: Metadata = { title: 'Kính đêm · kit', robots: { index: false, follow: false } };

/** The component kit: development builds, or a production build made with FF_KIT=1 (the tests). */
export default function KitPage() {
  if (process.env.NODE_ENV === 'production' && process.env.FF_KIT !== '1') notFound();
  return (
    <KdProvider lang="vi">
      <Kit />
    </KdProvider>
  );
}
