import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';

/* FeestFinder for AI agents (growth plan card 6): /list.md and the read-only MCP at /mcp. */

describe('data for agents', () => {
  let env: TestEnv;
  before(async () => { env = await setup(); });
  after(async () => { await env.close(); });

  let id = 0;
  const rpc = (method: string, params?: unknown) => env.as().post('/mcp', { jsonrpc: '2.0', id: ++id, method, ...(params ? { params } : {}) });
  const tool = async (name: string, args: unknown = {}) => {
    const r = await rpc('tools/call', { name, arguments: args });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    return r.body;
  };

  it('starts a session-less MCP conversation and lists six tools', async () => {
    const init = await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } });
    assert.equal(init.status, 200);
    assert.equal(init.body.result.protocolVersion, '2025-06-18');
    assert.equal(init.body.result.serverInfo.name, 'feestfinder');
    assert.equal((await rpc('initialize', { protocolVersion: '1999-01-01' })).body.result.protocolVersion, '2025-06-18', 'an unknown version gets ours');
    const note = await env.as().post('/mcp', { jsonrpc: '2.0', method: 'notifications/initialized' });
    assert.equal(note.status, 202);
    const list = await rpc('tools/list');
    assert.deepEqual(list.body.result.tools.map((t: { name: string }) => t.name), ['search_events', 'get_event', 'search_artists', 'get_artist', 'list_places', 'list_styles']);
    assert.equal((await rpc('nope/never')).body.error.code, -32601);
    assert.equal((await env.as().get('/mcp')).status, 405);
  });

  it('searches live events only, with prices in the city’s currency and links through /go', async () => {
    const out = (await tool('search_events', { city: 'ho-chi-minh', time: 'all' })).result;
    assert.equal(out.isError, false);
    const events = out.structuredContent.events as { slug: string; city: string; price: string; tickets: string | null; page: string }[];
    assert.ok(events.length > 0);
    assert.ok(events.every((e) => e.city === 'ho-chi-minh'));
    const ravo = events.find((e) => e.slug === 'ravo')!;
    assert.match(ravo.tickets!, /\/go\/ravo\?src=agent$/);
    assert.match(ravo.page, /\/e\/ravo$/);
    assert.match(ravo.price, /^từ 1\.200\.000₫$/);
    // A draft or a held listing never shows.
    await env.ctx.db.query(`update events set held_for_reports = true where slug = 'ravo'`);
    const held = (await tool('search_events', { city: 'ho-chi-minh', time: 'all' })).result.structuredContent.events as { slug: string }[];
    assert.ok(!held.some((e) => e.slug === 'ravo'));
    await env.ctx.db.query(`update events set held_for_reports = false where slug = 'ravo'`);
    // priceMax keeps free nights and known prices under it; a price nobody gave never passes.
    const cheap = (await tool('search_events', { time: 'all', priceMax: 300000 })).result.structuredContent.events as { slug: string; price: string }[];
    assert.ok(!cheap.some((e) => e.slug === 'ravo'));
    assert.ok(cheap.every((e) => !/Chưa rõ giá/.test(e.price)));
    assert.equal(JSON.parse((await tool('search_events', { time: 'all', q: 'x'.repeat(500) })).result.content[0].text).events.length, 0, 'a long query is cut, not refused');
  });

  it('answers a bad argument or an unknown slug as a JSON-RPC error, never a 500', async () => {
    assert.equal((await tool('get_event', { slug: 'no-such-night' })).error.code, -32602);
    assert.equal((await tool('get_event', {})).error.code, -32602);
    assert.equal((await tool('search_events', { time: 'someday' })).error.code, -32602);
    assert.equal((await rpc('tools/call', { name: 'drop_tables' })).body.error.code, -32602);
    const ev = (await tool('get_event', { slug: 'ravo', lang: 'en' })).result.structuredContent;
    assert.equal(ev.slug, 'ravo');
    assert.ok(Array.isArray(ev.lineup));
    const places = (await tool('list_places')).result.structuredContent.cities;
    assert.ok(places.length >= 5);
    assert.ok((await tool('list_styles')).result.structuredContent.styles.length > 10);
    assert.ok(Array.isArray((await tool('search_artists', { q: 'hoaprox' })).result.structuredContent.artists));
    const nul = await env.as().post('/mcp', { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'search_events', arguments: { q: 'a\u0000b' } } });
    assert.equal(nul.status, 400);
    assert.equal(nul.body.error.code, 'invalid_input');
    const llms = await rpc('resources/read', { uri: 'feestfinder://llms.txt' });
    assert.match(llms.body.result.contents[0].text, /## Agents[\s\S]*\/list\.md[\s\S]*\/mcp/);
  });

  it('serves the list as Markdown with the same filters', async () => {
    const r = await env.as().get('/list.md?city=ho-chi-minh&time=all');
    assert.equal(r.status, 200);
    assert.match(String(r.headers['content-type']), /^text\/markdown/);
    const md = String(r.body);
    assert.match(md, /^# Sự kiện EDM ở TP\.HCM · FeestFinder/m);
    assert.match(md, /\[Ravolution Music Festival\]\(http:\/\/test\.local\/e\/ravo\)/);
    assert.match(md, /\/go\/ravo\?src=agent/);
    const en = String((await env.as().get('/list.md?time=all&lang=en')).body);
    assert.match(en, /^# EDM events · FeestFinder/m);
    assert.equal((await env.as().get('/list.md?time=someday')).status, 400);
  });

  it('limits an agent to 60 requests a minute', async () => {
    const hits = await Promise.all(Array.from({ length: 61 }, () => env.call('POST', '/mcp', { body: { jsonrpc: '2.0', id: 1, method: 'ping' }, headers: { 'x-forwarded-for': '203.0.113.9' } })));
    assert.ok(hits.some((h) => h.status === 429));
    assert.ok(hits.every((h) => h.status === 200 || h.status === 429));
  });
});
