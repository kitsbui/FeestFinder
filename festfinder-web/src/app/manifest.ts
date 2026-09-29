import type { MetadataRoute } from 'next';

/** Makes the attendee app installable, so tickets and the plan sit on the home screen. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FeestFinder',
    short_name: 'FeestFinder',
    description: 'Lễ hội, show và chợ đêm ở TP.HCM — vé, kế hoạch nhóm và chế độ trực tiếp.',
    id: '/app',
    start_url: '/app',
    scope: '/',
    display: 'standalone',
    // Any way up: tablets and unfolded foldables are often held sideways.
    orientation: 'any',
    background_color: '#0E100F',
    theme_color: '#0E100F',
    lang: 'vi',
    categories: ['entertainment', 'music', 'lifestyle'],
    icons: [
      { src: '/icons/app-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/app-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/app-icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Vé của tôi', short_name: 'Vé', url: '/app/tickets' },
      { name: 'Đã lưu', short_name: 'Đã lưu', url: '/app/saved' },
    ],
  };
}
