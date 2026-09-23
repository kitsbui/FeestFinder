import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/api';

export default function robots(): MetadataRoute.Robots {
  return {
    // The signed-in screens have nothing public to index.
    rules: [{ userAgent: '*', allow: '/', disallow: ['/app', '/studio', '/console'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
