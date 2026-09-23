import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Không tìm thấy trang', robots: { index: false } };

/** An unknown listing, organiser or landing page: say so in both languages and point home. */
export default function NotFound() {
  return (
    <>
    <div className="ff-atmos" aria-hidden="true"><div className="ff-aurora" /><div className="ff-grain" /></div>
    <main className="ff-ssr ff-404">
      <p className="meta">404</p>
      <h1>Không tìm thấy trang này</h1>
      <p>Sự kiện có thể đã kết thúc, bị gỡ, hoặc đường dẫn bị gõ sai.</p>
      <p className="meta">This page does not exist — the event may have ended or been taken down.</p>
      <p>
        <a className="ff-btn" href="/">Xem sự kiện ở TP.HCM →</a>
      </p>
    </main>
    </>
  );
}
