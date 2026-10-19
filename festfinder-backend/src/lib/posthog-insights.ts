/*
 * The four PostHog insights the team reads (design v2 phase 19, artboard 26): built here, made by
 * scripts/posthog-insights.ts with the owner's personal key from the environment. Every event
 * and property named is one the screens send (services/analytics.ts): the web sends no
 * page_view, so the funnel starts where a list card opens.
 */

interface EventsNode { kind: 'EventsNode'; event: string; name?: string; math?: 'total' | 'dau' | 'p75' | 'p90'; math_property?: string; custom_name?: string }
interface DateRange { date_from: string }

export interface TrendsQuery {
  kind: 'TrendsQuery';
  series: EventsNode[];
  interval: 'day' | 'week';
  dateRange: DateRange;
  breakdownFilter?: { breakdown: string; breakdown_type: 'event' };
  trendsFilter?: { display: 'ActionsLineGraph' | 'ActionsBar' | 'BoldNumber' };
}
export interface FunnelsQuery {
  kind: 'FunnelsQuery';
  series: EventsNode[];
  dateRange: DateRange;
  funnelsFilter: { funnelWindowInterval: number; funnelWindowIntervalUnit: 'day' | 'hour' };
}
export interface InsightDefinition { name: string; description: string; query: TrendsQuery | FunnelsQuery }

const ev = (event: string, extra: Partial<EventsNode> = {}): EventsNode => ({ kind: 'EventsNode', event, name: event, math: 'total', ...extra });

export const INSIGHTS: InsightDefinition[] = [
  {
    name: 'Phễu: danh sách → sự kiện → vé',
    description: 'Mở một thẻ trên danh sách → xem trang sự kiện → bấm mua vé, trong một ngày. Mục tiêu 9,5: ≥ 15 % người mới mở vé.',
    query: { kind: 'FunnelsQuery', series: [ev('card_open'), ev('event_view'), ev('ticket_click')], dateRange: { date_from: '-30d' }, funnelsFilter: { funnelWindowInterval: 1, funnelWindowIntervalUnit: 'day' } },
  },
  {
    name: 'Web Vitals p75 theo kind',
    description: 'web_vital.value p75 mỗi ngày, tách theo kind (LCP ms, INP ms, CLS ×1). Mục tiêu: LCP ≤ 2 000, INP ≤ 200, CLS ≤ 0,1.',
    query: { kind: 'TrendsQuery', series: [ev('web_vital', { math: 'p75', math_property: 'value' })], interval: 'day', dateRange: { date_from: '-30d' }, breakdownFilter: { breakdown: 'kind', breakdown_type: 'event' }, trendsFilter: { display: 'ActionsLineGraph' } },
  },
  {
    name: 'nav_click theo kind',
    description: 'Chỗ nào trên thanh điều hướng được bấm, mỗi tuần.',
    query: { kind: 'TrendsQuery', series: [ev('nav_click')], interval: 'week', dateRange: { date_from: '-90d' }, breakdownFilter: { breakdown: 'kind', breakdown_type: 'event' }, trendsFilter: { display: 'ActionsBar' } },
  },
  {
    name: 'wizard_step theo kind và role',
    description: 'Các bước của wizard đăng sự kiện tới đâu và ai gửi (kind: bước, role). Mục tiêu 10: nháp → gửi ≥ 60 %.',
    query: { kind: 'TrendsQuery', series: [ev('wizard_step')], interval: 'week', dateRange: { date_from: '-90d' }, breakdownFilter: { breakdown: 'kind', breakdown_type: 'event' }, trendsFilter: { display: 'ActionsBar' } },
  },
];

/** The body PostHog's insights API takes for one definition. */
export function insightBody(d: InsightDefinition): Record<string, unknown> {
  return { name: d.name, description: d.description, saved: true, query: { kind: 'InsightVizNode', source: d.query } };
}

export interface PostHogApi {
  get(path: string): Promise<unknown>;
  post(path: string, body: unknown): Promise<unknown>;
  patch(path: string, body: unknown): Promise<unknown>;
}

/** Makes or updates each insight by name in the project. Returns what it did, for the log. */
export async function syncInsights(api: PostHogApi, projectId: string, defs: InsightDefinition[] = INSIGHTS): Promise<{ name: string; action: 'created' | 'updated'; id: number | null }[]> {
  const out: { name: string; action: 'created' | 'updated'; id: number | null }[] = [];
  for (const d of defs) {
    const found = (await api.get(`/api/projects/${projectId}/insights/?search=${encodeURIComponent(d.name)}&limit=20`)) as { results?: { id: number; name: string }[] };
    const existing = found.results?.find((r) => r.name === d.name);
    if (existing) {
      await api.patch(`/api/projects/${projectId}/insights/${existing.id}/`, insightBody(d));
      out.push({ name: d.name, action: 'updated', id: existing.id });
    } else {
      const made = (await api.post(`/api/projects/${projectId}/insights/`, insightBody(d))) as { id?: number };
      out.push({ name: d.name, action: 'created', id: made.id ?? null });
    }
  }
  return out;
}
