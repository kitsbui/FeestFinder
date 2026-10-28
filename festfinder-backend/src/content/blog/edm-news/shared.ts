/**
 * What the news posts share (owner, 2026-10-22, from the "EDM News Hub" handoff): a pillar and
 * posts under it, in Vietnamese and English, category `news`, of five kinds (event coverage, trend
 * report, forecast, explainer, and the pillar's round-up). Every fact names its source; analysis
 * and forecasts say so in their words ("Phân tích" / "Analysis", "Dự báo" / "Forecast") and give
 * their assumptions and confidence. A festival or a night is an `eventSection`, which
 * `services/seo/blog.ts` reads back as an Event when it is verified. The automatic feed of the
 * press's headlines is something else (services/news.ts); these are the team's own pages.
 */
import type { Localized } from '../../../lib/i18n.ts';

export { coverOf } from '../club-guides/shared.ts';
export { credit, figure, guide, nights, wiki, type Media } from '../edm-genres/media.ts';

type Lang = 'vi' | 'en';

export const PILLAR = 'edm-news/tin-tuc-edm';

/** The day the pack's facts were last checked, said under each post's opening. */
export const UPDATED: Localized = { vi: '*Cập nhật ngày 23/10/2026.*', en: '*Last updated 23 October 2026.*' };

/** How a paragraph is to be read, at its start: what happened, what we make of it, what may come. */
export const LABEL = {
  fact: { vi: '**Sự kiện:**', en: '**Fact:**' },
  analysis: { vi: '**Phân tích:**', en: '**Analysis:**' },
  forecast: { vi: '**Dự báo:**', en: '**Forecast:**' },
} as const;

/** A confidence level as the forecasts write it. */
export const CONFIDENCE = {
  high: { vi: 'Cao', en: 'High' },
  medium: { vi: 'Trung bình', en: 'Medium' },
  low: { vi: 'Thấp', en: 'Low' },
} as const;

export interface NewsEvent {
  name: string;
  /** What it is in a few words, after its name in the heading. */
  tagline: Localized;
  /** ISO days (YYYY-MM-DD), as the organiser announced them. */
  start: string;
  end?: string;
  /** The venue or site, and the city and country, as the organiser names them. */
  place: Localized;
  /** ISO 3166 country code, for the Event's address. */
  country: string;
  /** Names the organiser has announced; empty when no line-up is out. */
  lineup: string[];
  tickets: Localized;
  /** The organiser's own page. */
  url: string;
  /** Dates and place confirmed by the organiser; false is said on the page and kept out of the Event markup. */
  verified: boolean;
  /** 60–120 words: what it is and why it matters, only what the sources say. */
  why: Localized;
}

const T = {
  dates: { vi: 'Ngày', en: 'Dates' },
  place: { vi: 'Địa điểm', en: 'Place' },
  lineup: { vi: 'Lineup', en: 'Line-up' },
  tickets: { vi: 'Vé', en: 'Tickets' },
  site: { vi: 'Trang chính thức', en: 'Official site' },
  status: { vi: 'Trạng thái', en: 'Status' },
  verified: { vi: 'Đã xác minh với ban tổ chức', en: 'Confirmed by the organiser' },
  unverified: { vi: 'Cần kiểm tra: chưa có xác nhận chính thức', en: 'To be checked: not confirmed by the organiser' },
  tba: { vi: 'Chưa công bố', en: 'Not announced' },
} as const;

const host = (url: string) => new URL(url).hostname.replace(/^www\./, '');

/** A festival or a night as a section: its facts as a list (read back as an Event), then why it matters. */
export function eventSection(e: NewsEvent, lang: Lang): string {
  const facts = [
    `- **${T.dates[lang]}:** ${e.end && e.end !== e.start ? `${e.start} – ${e.end}` : e.start}`,
    `- **${T.place[lang]}:** ${e.place[lang]}`,
    `- **${T.lineup[lang]}:** ${e.lineup.length ? e.lineup.join(', ') : T.tba[lang]}`,
    `- **${T.tickets[lang]}:** ${e.tickets[lang]}`,
    `- **${T.site[lang]}:** [${host(e.url)}](${e.url})`,
    `- **${T.status[lang]}:** ${e.verified ? T.verified[lang] : T.unverified[lang]}`,
  ].join('\n');
  return `## ${e.name} — ${e.tagline[lang]}\n\n${facts}\n\n${e.why[lang]}`;
}

/** A forecast table's row: the scenario, what may happen, how sure, and what it rests on. */
export interface Scenario { name: Localized; prediction: Localized; confidence: keyof typeof CONFIDENCE; drivers: Localized }

export function scenarioTable(rows: Scenario[], lang: Lang): string {
  const head = lang === 'vi' ? '| Kịch bản | Dự báo | Độ tin cậy | Dựa trên |' : '| Scenario | Forecast | Confidence | Rests on |';
  return [head, '| --- | --- | --- | --- |', ...rows.map((r) => `| ${r.name[lang]} | ${r.prediction[lang]} | ${CONFIDENCE[r.confidence][lang]} | ${r.drivers[lang]} |`)].join('\n');
}
