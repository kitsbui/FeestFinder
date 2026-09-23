/**
 * Where unhandled errors go.
 *
 * Production sets SENTRY_DSN and every 500 lands in Sentry with the request that caused
 * it. Without a DSN the reporter is a no-op and the log line is all there is — which is
 * what development wants.
 */

export interface ErrorContext {
  method?: string;
  url?: string;
  userId?: string | null;
  requestId?: string;
}

export interface ErrorReporter {
  capture(err: unknown, ctx?: ErrorContext): void;
}

export class NoopReporter implements ErrorReporter {
  capture(): void {}
}

/**
 * Posts to Sentry's envelope endpoint directly. Sentry's own SDK brings a lot of
 * machinery we do not need here — one fetch of an event is the whole contract.
 */
export class SentryReporter implements ErrorReporter {
  private readonly endpoint: string;
  private readonly key: string;
  private readonly release: string;
  private readonly environment: string;
  private readonly log: (line: string) => void;

  /** @param dsn e.g. https://<key>@o123.ingest.sentry.io/456 */
  constructor(dsn: string, opts: { release: string; environment: string; log?: (line: string) => void }) {
    const u = new URL(dsn);
    const projectId = u.pathname.replace(/^\//, '');
    this.key = u.username;
    this.endpoint = `${u.protocol}//${u.host}/api/${projectId}/envelope/`;
    this.release = opts.release;
    this.environment = opts.environment;
    this.log = opts.log ?? ((l) => console.error(l));
  }

  capture(err: unknown, ctx: ErrorContext = {}): void {
    const e = err as Error;
    // Paths only: query strings can carry codes and tokens (OAuth callbacks, resets).
    const path = ctx.url?.split('?')[0];
    const event = {
      event_id: crypto.randomUUID().replace(/-/g, ''),
      timestamp: new Date().toISOString(),
      platform: 'node',
      level: 'error',
      release: this.release,
      environment: this.environment,
      server_name: undefined,
      transaction: path,
      request: path ? { method: ctx.method, url: path } : undefined,
      user: ctx.userId ? { id: ctx.userId } : undefined,
      tags: ctx.requestId ? { request_id: ctx.requestId } : undefined,
      exception: {
        values: [{
          type: e?.name || 'Error',
          value: String(e?.message ?? err).slice(0, 2000),
          stacktrace: e?.stack ? { frames: frames(e.stack) } : undefined,
        }],
      },
    };
    const envelope = [
      JSON.stringify({ event_id: event.event_id, sent_at: new Date().toISOString() }),
      JSON.stringify({ type: 'event' }),
      JSON.stringify(event),
    ].join('\n');

    // Reporting must never delay or break the response that failed.
    fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-sentry-envelope',
        'x-sentry-auth': `Sentry sentry_version=7, sentry_client=festfinder/1, sentry_key=${this.key}`,
      },
      body: envelope,
      signal: AbortSignal.timeout(5000),
    }).catch((e2) => this.log(`sentry report failed: ${e2}`));
  }
}

/** Sentry wants the innermost frame last. */
function frames(stack: string) {
  return stack
    .split('\n')
    .slice(1)
    .map((line) => {
      const m = /at (?:(.+) )?\(?(.+?):(\d+):(\d+)\)?$/.exec(line.trim());
      if (!m) return null;
      return { function: m[1] ?? '?', filename: m[2], lineno: Number(m[3]), colno: Number(m[4]), in_app: !m[2].includes('node_modules') };
    })
    .filter((f): f is NonNullable<typeof f> => !!f)
    .reverse()
    .slice(-50);
}
