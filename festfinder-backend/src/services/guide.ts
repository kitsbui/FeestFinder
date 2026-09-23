import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import type { Lang } from '../lib/i18n.ts';

const Spot = z.object({
  name: z.string(),
  kind: z.enum(['food', 'drink', 'coffee', 'market', 'bar', 'latenight', 'sight', 'view', 'walk']),
  walk: z.string(),
  why: z.string(),
});

export const GuideSchema = z.object({
  before: z.array(Spot),
  after: z.array(Spot),
  explore: z.array(Spot),
  wear: z.object({ headline: z.string(), items: z.array(z.string()), avoid: z.string() }),
  tip: z.string(),
});
export type Guide = z.infer<typeof GuideSchema>;

export interface GuideEvent {
  title: string;
  genre: string | null;
  venueName: string | null;
  address: string | null;
  area: string | null;
  startTime: string | null;
  endTime: string | null;
  lineup: string[];
  age: string;
  priceFrom: number;
  entryMode: string;
}

export class GuideUnavailable extends Error {
  readonly reason: 'disabled' | 'refused' | 'truncated' | 'unparseable' | 'upstream';
  constructor(reason: GuideUnavailable['reason'], message?: string) {
    super(message ?? reason);
    this.reason = reason;
  }
}

export interface GuideGenerator {
  readonly model: string;
  generate(ev: GuideEvent, lang: Lang): Promise<Guide>;
}

const SYSTEM =
  "You are FeestFinder's local guide for Ho Chi Minh City, Vietnam. Name real, well-known places in or near the given district. " +
  'Keep every line under 18 words.';

function prompt(ev: GuideEvent, lang: Lang): string {
  return [
    `Event: ${ev.title}`,
    `Genre / theme: ${ev.genre ?? 'general'}`,
    `Venue: ${[ev.venueName, ev.address, ev.area, 'HCMC'].filter(Boolean).join(', ')}`,
    `Doors ${ev.startTime ?? '—'}, ends ${ev.endTime ?? '—'}`,
    `Lineup: ${ev.lineup.join(', ') || '—'}`,
    `Age: ${ev.age} · Ticket: ${ev.entryMode === 'free' || !ev.priceFrom ? 'free entry' : `${ev.priceFrom} VND`}`,
    '',
    '- before: 3 spots to eat or drink near the venue before doors (kind food, drink, coffee or market)',
    '- after: 3 late-night spots for when this show ends (kind bar, latenight, food or coffee)',
    '- explore: 2 things worth seeing nearby (kind sight, view or walk)',
    '- walk: short travel line, e.g. "6 min walk" or "8 min ride"',
    '- wear: outfit direction that fits THIS event theme, venue and hours; items = 3 short pieces; avoid = one thing not to wear',
    '- tip: one line to get the most out of this specific event',
    lang === 'vi' ? 'Write every value in Vietnamese.' : 'Write every value in English.',
  ].join('\n');
}

export class ClaudeGuide implements GuideGenerator {
  readonly model: string;
  private readonly client: Anthropic;

  constructor(model: string, client = new Anthropic()) {
    this.model = model;
    this.client = client;
  }

  async generate(ev: GuideEvent, lang: Lang): Promise<Guide> {
    let response;
    try {
      response = await this.client.beta.messages.parse({
        model: this.model,
        max_tokens: 16000,
        // A short, cached, latency-sensitive answer: low effort keeps the panel snappy.
        output_config: { effort: 'low', format: betaZodOutputFormat(GuideSchema) },
        // If a safety classifier declines, let the API retry on its recommended fallback model.
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        system: SYSTEM,
        messages: [{ role: 'user', content: prompt(ev, lang) }],
      });
    } catch (err) {
      if (err instanceof Anthropic.RateLimitError) throw new GuideUnavailable('upstream', 'rate limited');
      if (err instanceof Anthropic.APIError) throw new GuideUnavailable('upstream', `anthropic ${err.status}: ${err.message}`);
      throw err;
    }
    if (response.stop_reason === 'refusal') throw new GuideUnavailable('refused');
    if (response.stop_reason === 'max_tokens') throw new GuideUnavailable('truncated');
    const guide = response.parsed_output;
    if (!guide) throw new GuideUnavailable('unparseable');
    return guide;
  }
}

/** Caps each list at what the guide panel shows, whichever generator produced it. */
export function trimGuide(guide: Guide): Guide {
  return {
    ...guide,
    before: guide.before.slice(0, 3),
    after: guide.after.slice(0, 3),
    explore: guide.explore.slice(0, 2),
    wear: { ...guide.wear, items: guide.wear.items.slice(0, 4) },
  };
}

/** Used when no Anthropic credentials are configured, and in tests. */
export class DisabledGuide implements GuideGenerator {
  readonly model = 'none';
  async generate(): Promise<Guide> {
    throw new GuideUnavailable('disabled');
  }
}
