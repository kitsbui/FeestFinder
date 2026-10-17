import 'server-only';
/**
 * Thai, Japanese and Indonesian for the public pages (design v2 phase 10). Only the server reads
 * these: a page in one of them sends its own dictionary to the browser (kd/ui/in-lang.tsx), so a
 * page in Vietnamese or English carries none of it. The server components know every language
 * from the start, as they render before the page's lines reach its client components.
 */
import { learn, type Lang } from '..';
import { ID } from './id';
import { JA } from './ja';
import { TH } from './th';

export const ASIA: Record<Exclude<Lang, 'vi' | 'en'>, Record<string, string>> = { th: TH, ja: JA, id: ID };
for (const [lang, lines] of Object.entries(ASIA)) learn(lang as Lang, lines);
