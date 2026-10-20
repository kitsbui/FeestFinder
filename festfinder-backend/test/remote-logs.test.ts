import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { logShipper, scrub, severityOf } from '../src/services/remote-logs.ts';

describe('the API’s log lines in PostHog Logs', () => {
  it('reads the level from the words a line starts with', () => {
    assert.equal(severityOf('unhandled error on GET /x: boom').text, 'ERROR');
    assert.equal(severityOf('link check failed: timeout').text, 'ERROR');
    assert.equal(severityOf('warning: WEB_PROXY_SECRET is short').text, 'WARN');
    assert.equal(severityOf('ingest Ciné Saigon: fetched 3').text, 'INFO');
  });

  it('never sends a query or an email', () => {
    assert.equal(scrub('unhandled error on GET /events?q=minh&city=x: boom'), 'unhandled error on GET /events: boom');
    assert.equal(scrub('admin minh@example.com synced'), 'admin [email] synced');
  });

  it('sends a batch as OTLP JSON with the project key, and never throws when PostHog is down', async () => {
    const sent: { url: string; init: RequestInit }[] = [];
    const ship = logShipper({
      key: 'phc_test', host: 'https://us.i.posthog.com/', environment: 'staging', now: () => 1_700_000_000_000,
      fetch: (async (url: string, init: RequestInit) => { sent.push({ url, init }); return new Response(null, { status: 200 }); }) as typeof fetch,
    });
    ship.ship('warning: one');
    ship.ship('two');
    await ship.flush();
    assert.equal(sent.length, 1);
    assert.equal(sent[0].url, 'https://us.i.posthog.com/otlp/v1/logs');
    assert.equal((sent[0].init.headers as Record<string, string>).authorization, 'Bearer phc_test');
    const body = JSON.parse(String(sent[0].init.body));
    const recs = body.resourceLogs[0].scopeLogs[0].logRecords;
    assert.deepEqual(recs.map((r: { severityText: string; body: { stringValue: string } }) => [r.severityText, r.body.stringValue]), [['WARN', 'warning: one'], ['INFO', 'two']]);
    assert.equal(recs[0].timeUnixNano, '1700000000000000000');
    assert.equal(body.resourceLogs[0].resource.attributes[0].value.stringValue, 'feestfinder-api');
    await ship.flush();
    assert.equal(sent.length, 1, 'nothing waiting, nothing sent');

    const down = logShipper({ key: 'k', host: 'https://x', environment: 'production', fetch: (async () => { throw new Error('down'); }) as typeof fetch });
    down.ship('a');
    await down.flush();
  });
});
