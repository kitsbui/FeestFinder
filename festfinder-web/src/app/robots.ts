import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/api';

export default function robots(): MetadataRoute.Robots {
  return {
    // The signed-in screens have nothing public to index.
    // AI assistants' search crawlers (OAI-SearchBot, PerplexityBot, Claude-SearchBot…) answer with
    // links back here, so they read everything public. Training crawlers are turned away unless
    // ALLOW_AI_TRAINING is on; that changes nothing in Google Search or its AI Overviews.
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/app', '/studio', '/console', '/ops'] },
      ...(process.env.ALLOW_AI_TRAINING === 'true' ? [] : [{
        userAgent: ['GPTBot', 'ClaudeBot', 'anthropic-ai', 'Google-Extended', 'CCBot', 'Applebot-Extended', 'meta-externalagent', 'Bytespider', 'cohere-training-data-crawler'],
        disallow: ['/'],
      }]),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
