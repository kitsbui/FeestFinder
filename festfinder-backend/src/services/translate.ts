/**
 * Machine translation of event descriptions (design v2 phase 15): Feest Radar's finds arrive in
 * English and a Vietnamese page showed them in English. The translate job fills the other language
 * of a live event whose description has only one, marks that language in `auto_translated`
 * (migration 048) so the page says "bản dịch tự động" and keeps the original, and never touches a
 * language someone wrote. Claude does the translating when ANTHROPIC_API_KEY is set; without it the
 * job does nothing.
 */
import Anthropic from '@anthropic-ai/sdk';
import type { Ctx } from '../context.ts';
import { many } from '../db/index.ts';

export type TextLang = 'en' | 'vi';
const NAME: Record<TextLang, string> = { en: 'English', vi: 'Vietnamese' };

export interface Translator {
  readonly enabled: boolean;
  translate(text: string, from: TextLang, to: TextLang): Promise<string>;
}

export class DisabledTranslator implements Translator {
  readonly enabled = false;
  async translate(): Promise<string> { throw new Error('translation is off'); }
}

export function translateSystem(from: TextLang, to: TextLang): string {
  return `You translate nightlife and music event listings from ${NAME[from]} to ${NAME[to]} for FeestFinder, an EDM event site in Vietnam and Asia. Keep artist names, venue names, dates, times, prices and links exactly as written. Keep the paragraph breaks. Write naturally for someone going out, in the register of a listing, without adding or dropping information. Answer with the translation only.`;
}

export class ClaudeTranslator implements Translator {
  readonly enabled = true;
  private readonly model: string;
  private readonly client: Anthropic;
  constructor(model: string, client = new Anthropic()) { this.model = model; this.client = client; }

  async translate(text: string, from: TextLang, to: TextLang): Promise<string> {
    const res = await this.client.messages.create({
      model: this.model,
      max_tokens: 4000,
      system: translateSystem(from, to),
      messages: [{ role: 'user', content: text }],
    });
    const out = res.content.filter((c) => c.type === 'text').map((c) => c.text).join('').trim();
    if (!out || res.stop_reason === 'max_tokens') throw new Error(`translation ${res.stop_reason ?? 'empty'}`);
    return out;
  }
}

const MAX_CHARS = 6000;

/** Live events with a description in one language only, the other machine-written: a few per run. */
export async function translatePending(ctx: Ctx, limit = 10): Promise<{ translated: number; failed: number }> {
  if (!ctx.translator.enabled) return { translated: 0, failed: 0 };
  const rows = await many<{ id: string; description: { en?: string; vi?: string }; auto_translated: string[] }>(ctx.db,
    `select id, description, auto_translated from events
      where status = 'live' and ends_at >= $1
        and ((coalesce(description->>'en', '') <> '' and coalesce(description->>'vi', '') in ('', description->>'en') and not ('vi' = any(auto_translated)))
          or (coalesce(description->>'vi', '') <> '' and coalesce(description->>'en', '') in ('', description->>'vi') and not ('en' = any(auto_translated))))
      order by starts_at limit $2`, [ctx.clock.now(), limit]);
  let translated = 0, failed = 0;
  for (const r of rows) {
    const en = (r.description.en ?? '').trim(), vi = (r.description.vi ?? '').trim();
    const [from, to]: [TextLang, TextLang] = en && (!vi || vi === en) && !r.auto_translated.includes('vi') ? ['en', 'vi'] : ['vi', 'en'];
    const source = from === 'en' ? en : vi;
    if (!source) continue;
    try {
      const out = await ctx.translator.translate(source.slice(0, MAX_CHARS), from, to);
      await ctx.db.query(
        `update events set description = jsonb_set(description, $2::text[], to_jsonb($3::text)), auto_translated = array_append(array_remove(auto_translated, $4), $4), updated_at = now()
          where id = $1 and not ($4 = any(auto_translated))`,
        [r.id, [to], out, to]);
      translated++;
    } catch (e) {
      failed++;
      ctx.log(`translate ${r.id} ${from}→${to}: ${(e as Error).message}`);
    }
  }
  return { translated, failed };
}
