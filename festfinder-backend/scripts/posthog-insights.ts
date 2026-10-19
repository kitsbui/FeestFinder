/**
 * Makes (or brings up to date) the four insights the team reads in PostHog, from the owner's own
 * machine with a personal API key that never leaves it:
 *
 *   POSTHOG_PERSONAL_API_KEY=phx_… POSTHOG_PROJECT_ID=12345 node scripts/posthog-insights.ts
 *   POSTHOG_HOST=https://eu.posthog.com (the default) or https://us.posthog.com
 *   --dry-run prints what would be sent and sends nothing.
 *
 * The key needs the insight:read and insight:write scopes. Each insight is found by its name, so
 * running it again changes nothing but the definition.
 */
import { INSIGHTS, insightBody, syncInsights, type PostHogApi } from '../src/lib/posthog-insights.ts';

const dry = process.argv.includes('--dry-run');
const key = process.env.POSTHOG_PERSONAL_API_KEY;
const project = process.env.POSTHOG_PROJECT_ID;
const host = (process.env.POSTHOG_HOST || 'https://eu.posthog.com').replace(/\/$/, '');

if (dry) {
  for (const d of INSIGHTS) console.log(JSON.stringify(insightBody(d), null, 2));
  process.exit(0);
}
if (!key || !project) {
  console.error('usage: POSTHOG_PERSONAL_API_KEY=phx_… POSTHOG_PROJECT_ID=… node scripts/posthog-insights.ts [--dry-run]');
  process.exit(2);
}

const call = async (method: string, path: string, body?: unknown) => {
  const res = await fetch(host + path, {
    method,
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${method} ${path}: ${res.status} ${(await res.text()).slice(0, 300)}`);
  return res.json();
};
const api: PostHogApi = { get: (p) => call('GET', p), post: (p, b) => call('POST', p, b), patch: (p, b) => call('PATCH', p, b) };

try {
  for (const r of await syncInsights(api, project)) console.log(`${r.action}: ${r.name}${r.id ? ` (${host}/project/${project}/insights/${r.id})` : ''}`);
} catch (e) {
  console.error(`failed: ${(e as Error).message}`);
  process.exit(1);
}
