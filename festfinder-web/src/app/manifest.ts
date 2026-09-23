import type { MetadataRoute } from 'next';

/** Makes the attendee app installable, so tickets and the plan sit on the home screen. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FeestFinder',
    short_name: 'FeestFinder',
    description: 'Lễ hội, show và chợ đêm ở TP.HCM — vé, kế hoạch nhóm và chế độ trực tiếp.',
    start_url: '/app',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#05060F',
    theme_color: '#05060F',
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
