/**
 * The API's log lines in PostHog Logs (OpenTelemetry's OTLP over HTTP, JSON), when
 * POSTHOG_LOGS=1 and POSTHOG_KEY are set. No SDK: one POST of a batch. Every line still goes
 * to stdout (Vercel's logs); this is a copy. Before it leaves, a line loses the query of any
 * address in it and any email: logs never carry who did something (CLAUDE.md, Analytics).
 */

export interface LogShipper {
  ship(line: string): void;
  /** Sends what is waiting. Never throws. */
  flush(): Promise<void>;
}

const BATCH = 50;
const EVERY_MS = 2000;
const MAX_LINE = 4000;

/** WARN, ERROR or INFO from the words a line starts with. */
export function severityOf(line: string): { number: number; text: 'INFO' | 'WARN' | 'ERROR' } {
  if (/^(unhandled error|could not|error|.* failed\b)/i.test(line)) return { number: 17, text: 'ERROR' };
  if (/^warning\b/i.test(line)) return { number: 13, text: 'WARN' };
  return { number: 9, text: 'INFO' };
}

/** A line without the queries of its addresses, without emails, and not too long. */
export function scrub(line: string): string {
  return line
    // The query goes; punctuation that ends the address in the sentence stays.
    .replace(/([/\w.-]+)\?[^\s"')]*?([:,.;]?)(?=[\s"')]|$)/g, '$1$2')
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, '[email]')
    .slice(0, MAX_LINE);
}

export function logShipper(o: { key: string; host: string; environment: string; fetch?: typeof fetch; now?: () => number }): LogShipper {
  const send = o.fetch ?? fetch;
  const now = o.now ?? Date.now;
  const url = `${o.host.replace(/\/$/, '')}/otlp/v1/logs`;
  let queue: { at: number; line: string }[] = [];
  let timer: ReturnType<typeof setTimeout> | null = null;
  let inFlight: Promise<void> = Promise.resolve();

  const flush = (): Promise<void> => {
    if (timer) { clearTimeout(timer); timer = null; }
    if (!queue.length) return inFlight;
    const batch = queue;
    queue = [];
    const body = {
      resourceLogs: [{
        resource: { attributes: [
          { key: 'service.name', value: { stringValue: 'feestfinder-api' } },
          { key: 'deployment.environment', value: { stringValue: o.environment } },
        ] },
        scopeLogs: [{
          scope: { name: 'feestfinder' },
          logRecords: batch.map((r) => {
            const sev = severityOf(r.line);
            return { timeUnixNano: String(r.at * 1_000_000), severityNumber: sev.number, severityText: sev.text, body: { stringValue: r.line } };
          }),
        }],
      }],
    };
    inFlight = inFlight.then(() => send(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${o.key}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    }).then(() => undefined, () => undefined));
    return inFlight;
  };

  return {
    ship(line) {
      queue.push({ at: now(), line: scrub(line) });
      if (queue.length >= BATCH) void flush();
      else if (!timer) { timer = setTimeout(() => void flush(), EVERY_MS); timer.unref?.(); }
    },
    flush,
  };
}
