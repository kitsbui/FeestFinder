import type { MetadataRoute } from 'next';

/**
 * Makes the attendee app installable, so tickets and the plan sit on the home screen. It opens on
 * the home page (design v2 phase 4: the app is the site), which asks a first-time device its city
 * and styles (web/list/first-run.tsx); `id` stays /app so installed copies keep their identity.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FeestFinder',
    short_name: 'FeestFinder',
    description: 'Club, rave và lễ hội EDM ở châu Á — vé, kế hoạch nhóm và chế độ trực tiếp.',
    id: '/app',
    start_url: '/?source=app',
    scope: '/',
    display: 'standalone',
    // Any way up: tablets and unfolded foldables are often held sideways.
    orientation: 'any',
    background_color: '#08090a', // tokens-ok: the manifest needs a literal (theme.css surface-0)
    theme_color: '#08090a', // tokens-ok
    lang: 'vi',
    categories: ['entertainment', 'music', 'lifestyle'],
    icons: [
      { src: '/icons/app-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/app-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/app-icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Vé của tôi', short_name: 'Vé', url: '/app/tickets' },
      { name: 'Đã lưu', short_name: 'Đã lưu', url: '/saved' },
    ],
  };
}
