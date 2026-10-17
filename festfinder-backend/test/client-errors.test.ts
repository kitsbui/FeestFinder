import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';
import type { ErrorContext, ErrorReporter } from '../src/services/errors.ts';

/*
 * The browser's uncaught errors reach the same reporter as the API's (design v2 phase 7),
 * without query strings, and robots or malformed reports are dropped.
 */

const BROWSER = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile/15E148 Safari/604.1';

class Captured implements ErrorReporter {
  seen: { err: Error; ctx: ErrorContext }[] = [];
  capture(err: unknown, ctx: ErrorContext = {}) { this.seen.push({ err: err as Error, ctx }); }
}

describe('client errors', () => {
  let env: TestEnv;
  const sink = new Captured();
  before(async () => { env = await setup({ errors: sink, seed: false }); });
  after(async () => { await env.close(); });

  const send = (body: unknown, headers: Record<string, string> = {}) =>
    env.call('POST', '/client-errors', { body, headers: { 'user-agent': BROWSER, referer: 'https://feestfinder.com/e/ravo?ref=abc', ...headers } });

  it('reports an error from a browser, by the page path, without query strings', async () => {
    const res = await send({ kind: 'error', message: 'x is undefined at /go/ravo?token=secret', source: 'https://feestfinder.com/_next/static/chunks/a.js?v=1', line: 3, col: 14 });
    assert.equal(res.status, 204);
    const last = sink.seen.at(-1)!;
    assert.equal(last.err.name, 'WebError');
    assert.equal(last.err.message, 'x is undefined at /go/ravo');
    assert.match(last.err.stack!, /chunks\/a\.js:3:14/);
    assert.ok(!last.err.stack!.includes('?'));
    assert.equal(last.ctx.url, '/e/ravo');
    assert.equal(last.ctx.method, 'error');
  });

  it('keeps a stack, and drops robots and anything malformed', async () => {
    await send({ kind: 'rejection', message: 'Failed to fetch', stack: 'TypeError: Failed to fetch\n    at load (https://feestfinder.com/_next/static/chunks/b.js?x=1:1:200)' });
    assert.match(sink.seen.at(-1)!.err.stack!, /chunks\/b\.js:1:200/);
    const n = sink.seen.length;
    assert.equal((await send({ kind: 'error', message: 'bot' }, { 'user-agent': 'Googlebot/2.1' })).status, 204);
    assert.equal((await send({ kind: 'panic', message: 'nope' })).status, 204);
    assert.equal((await send({ kind: 'error', message: '' })).status, 204);
    // sendBeacon posts text/plain.
    assert.equal((await send('not json', { 'content-type': 'text/plain' })).status, 204);
    assert.equal(sink.seen.length, n);
  });
});
