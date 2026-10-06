import { sha256 } from '../lib/crypto.ts';

/*
 * Product analytics, first party. Screens send a few named events to /analytics/collect and
 * the server records a few of its own (a role picked, a gig reported, an application). With
 * POSTHOG_KEY set they are forwarded to PostHog; without it nothing leaves the server.
 *
 * What goes out is pseudonymous: a signed-in person is a hash of their id, a visitor the
 * random id their browser made. Never an email, a name, an IP address or a user agent, and
 * only the properties listed in ALLOWED_PROPS.
 */

/** Events a screen may send. Anything else is dropped. */
export const CLIENT_EVENTS = ['page_view', 'search', 'directory_filter', 'artist_view', 'event_view', 'ticket_click', 'role_picker_shown', 'share'] as const;
/** Events only the server records. */
export const SERVER_EVENTS = ['role_chosen', 'profile_claimed', 'gig_reported', 'gig_posted', 'gig_applied', 'booking_requested', 'signed_up'] as const;
export type AnalyticsEvent = (typeof CLIENT_EVENTS)[number] | (typeof SERVER_EVENTS)[number];

export const ALLOWED_PROPS = ['path', 'screen', 'slug', 'city', 'style', 'genre', 'source', 'lang', 'role', 'outcome', 'kind', 'surface'] as const;

export interface Analytics {
  readonly enabled: boolean;
  capture(event: AnalyticsEvent, distinctId: string, props?: Record<string, unknown>): Promise<void>;
}

/** Only listed keys, only short strings, numbers and booleans. */
export function cleanProps(props: Record<string, unknown> | undefined): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const k of ALLOWED_PROPS) {
    const v = props?.[k];
    if (typeof v === 'string' && v.length) out[k] = (k === 'path' ? v.split('?')[0] : v).slice(0, 120);
    else if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
    else if (typeof v === 'boolean') out[k] = v;
  }
  return out;
}

/** A signed-in person, as analytics sees them: not their id, a hash of it. */
export const personId = (userId: string) => `u_${sha256(`ff-analytics:${userId}`).slice(0, 24)}`;

export class NoopAnalytics implements Analytics {
  readonly enabled = false;
  async capture(): Promise<void> {}
}

/** Keeps what was captured, for tests. */
export class MemoryAnalytics implements Analytics {
  readonly enabled = true;
  readonly events: { event: string; distinctId: string; props: Record<string, unknown> }[] = [];
  async capture(event: AnalyticsEvent, distinctId: string, props?: Record<string, unknown>): Promise<void> {
    this.events.push({ event, distinctId, props: cleanProps(props) });
  }
}

/** PostHog's capture endpoint, one event per call, given at most 1.5 s. A failure is logged, never thrown. */
export class PostHogAnalytics implements Analytics {
  readonly enabled = true;
  private readonly key: string;
  private readonly host: string;
  private readonly log: (l: string) => void;
  constructor(key: string, host: string, log: (l: string) => void = console.error) {
    this.key = key;
    this.host = host;
    this.log = log;
  }
  async capture(event: AnalyticsEvent, distinctId: string, props?: Record<string, unknown>): Promise<void> {
    try {
      const res = await fetch(`${this.host.replace(/\/$/, '')}/capture/`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ api_key: this.key, event, distinct_id: distinctId, properties: { ...cleanProps(props), $process_person_profile: false } }),
        signal: AbortSignal.timeout(1500),
      });
      if (!res.ok) this.log(`analytics: PostHog answered ${res.status}`);
    } catch (e) {
      this.log(`analytics: ${(e as Error).message}`);
    }
  }
}
