import type { Metadata } from 'next';
import { buttonClass } from '@/kd/ui/actions';

export const metadata: Metadata = { title: 'Không tìm thấy trang', robots: { index: false } };

/** An unknown event, organiser or artist: say so in both languages and point home. */
export default function NotFound() {
  return (
    <main className="kd-wrap flex min-h-dvh flex-col justify-center gap-4 py-24">
      <span className="kd-m">404</span>
      <h1 className="kd-d1">Không tìm thấy trang này</h1>
      <p className="kd-tl max-w-[560px]">Sự kiện có thể đã kết thúc, bị gỡ, hoặc đường dẫn bị gõ sai.</p>
      <p lang="en" className="kd-s">This page does not exist: the event may have ended or been taken down.</p>
      <p className="pt-2">
        <a className={buttonClass({ tone: 'light' })} href="/">Xem sự kiện</a>
      </p>
    </main>
  );
}
