import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type IncomingMessage, type Server } from 'node:http';
import { EsmsTransport, MemoryTokenStore, TwilioSmsTransport, ZaloZnsTransport, phoneText, stripAccents } from '../src/services/sms.ts';
import { PermanentDeliveryError, type OutboundMessage } from '../src/services/messaging.ts';

/*
 * Real phone delivery (phase 17) against fake providers on localhost: the request each provider
 * gets, what counts as sent, what is retried, what is given up on, and Zalo's rotating tokens.
 */

const otp = (code = '123456', lang = 'vi'): OutboundMessage => ({ id: 'msg-1', channel: 'sms', address: '+84912345678', template: 'otp', payload: { code, lang } });

/** A fake provider: records every request, answers as told. */
function fake(answer: (req: IncomingMessage, body: string) => { status: number; json?: unknown }) {
  const calls: { url: string; headers: Record<string, string | string[] | undefined>; body: string }[] = [];
  const server: Server = createServer((req, res) => {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      calls.push({ url: req.url!, headers: req.headers, body });
      const a = answer(req, body);
      res.writeHead(a.status, { 'content-type': 'application/json' });
      res.end(a.json === undefined ? '' : JSON.stringify(a.json));
    });
  });
  return { calls, server, start: () => new Promise<string>((ok) => server.listen(0, '127.0.0.1', () => ok(`http://127.0.0.1:${(server.address() as { port: number }).port}`))) };
}

describe('phone delivery', () => {
  const servers: Server[] = [];
  after(() => { for (const s of servers) s.close(); });

  it('says the code without accents for SMS, with them for Zalo, and never more than 300 characters', () => {
    assert.equal(phoneText(otp(), false), 'FeestFinder: ma xac nhan cua ban la 123456. Ma het han sau 10 phut. Khong chia se ma nay.');
    assert.equal(phoneText(otp(), true), 'FeestFinder: mã xác nhận của bạn là 123456. Mã hết hạn sau 10 phút. Không chia sẻ mã này.');
    assert.match(phoneText(otp('654321', 'en'), false), /^FeestFinder: your code is 654321/);
    assert.equal(stripAccents('Đêm nhạc điện tử'), 'Dem nhac dien tu');
    const long: OutboundMessage = { ...otp(), template: 'moderation', payload: { lang: 'vi', title: { vi: 'Tin đã lên' }, body: { vi: 'x'.repeat(400) } } };
    assert.ok(phoneText(long, false).length <= 300);
  });

  it('Twilio: basic auth, the E.164 number, a permanent error for a bad number, a retry for the rest', async () => {
    let status = 201;
    let json: unknown = { sid: 'SM1' };
    const f = fake(() => ({ status, json }));
    servers.push(f.server);
    const base = await f.start();
    const t = new TwilioSmsTransport({ accountSid: 'AC123', authToken: 'secret', from: '+15005550006', base });
    await t.send(otp());
    assert.equal(f.calls[0].url, '/2010-04-01/Accounts/AC123/Messages.json');
    assert.equal(f.calls[0].headers.authorization, 'Basic ' + Buffer.from('AC123:secret').toString('base64'));
    const form = new URLSearchParams(f.calls[0].body);
    assert.equal(form.get('To'), '+84912345678');
    assert.equal(form.get('From'), '+15005550006');
    assert.match(form.get('Body')!, /123456/);
    // A messaging service instead of a number.
    await new TwilioSmsTransport({ accountSid: 'AC123', authToken: 'secret', from: 'MG999', base }).send(otp());
    assert.equal(new URLSearchParams(f.calls[1].body).get('MessagingServiceSid'), 'MG999');
    status = 400; json = { code: 21211, message: 'Invalid To number' };
    await assert.rejects(t.send(otp()), (e: Error) => e instanceof PermanentDeliveryError && /21211/.test(e.message));
    status = 503; json = {};
    await assert.rejects(t.send(otp()), (e: Error) => !(e instanceof PermanentDeliveryError) && /503/.test(e.message));
    // The code never reaches an error message.
    status = 400; json = { code: 20003, message: 'Authenticate' };
    await assert.rejects(t.send(otp()), (e: Error) => !e.message.includes('123456'));
  });

  it('eSMS.vn: the keys, the brandname, the number without its plus, result codes', async () => {
    let json: unknown = { CodeResult: '100', SMSID: 'abc' };
    const f = fake(() => ({ status: 200, json }));
    servers.push(f.server);
    const base = await f.start();
    const t = new EsmsTransport({ apiKey: 'k', secretKey: 's', brandname: 'FEESTFINDER', base });
    await t.send(otp());
    const sent = JSON.parse(f.calls[0].body);
    assert.equal(f.calls[0].url, '/MainService.svc/json/SendMultipleMessage_V4_post_json/');
    assert.deepEqual([sent.ApiKey, sent.SecretKey, sent.Phone, sent.Brandname, sent.SmsType, sent.IsUnicode], ['k', 's', '84912345678', 'FEESTFINDER', 2, 0]);
    assert.match(sent.Content, /ma xac nhan cua ban la 123456/);
    json = { CodeResult: '104', ErrorMessage: 'Brandname not found' };
    await assert.rejects(t.send(otp()), (e: Error) => e instanceof PermanentDeliveryError && /104/.test(e.message));
    json = { CodeResult: '103', ErrorMessage: 'Balance' };
    await assert.rejects(t.send(otp()), (e: Error) => !(e instanceof PermanentDeliveryError) && /103/.test(e.message));
  });

  it('Zalo ZNS: refreshes the access token, keeps the rotated refresh token, retries once on an expired token', async () => {
    let refreshes = 0;
    // What the next sends answer, in order; the last one repeats.
    const answers: unknown[] = [{ error: 0, message: 'Success' }];
    const f = fake((req, body) => {
      if (req.url === '/v4/oa/access_token') {
        refreshes++;
        const form = new URLSearchParams(body);
        assert.equal(form.get('app_id'), 'app1');
        assert.equal(form.get('grant_type'), 'refresh_token');
        assert.equal(req.headers.secret_key, 'sekret');
        return { status: 200, json: { access_token: `at-${refreshes}`, refresh_token: `rt-${refreshes}`, expires_in: '3600' } };
      }
      return { status: 200, json: answers.length > 1 ? answers.shift() : answers[0] };
    });
    servers.push(f.server);
    const base = await f.start();
    const store = new MemoryTokenStore();
    let now = new Date('2026-10-19T10:00:00Z');
    const t = new ZaloZnsTransport({ appId: 'app1', secretKey: 'sekret', refreshToken: 'rt-0', otpTemplateId: 'tpl-otp', base, oauthBase: base }, store, fetch, () => now);
    const zalo: OutboundMessage = { ...otp(), channel: 'zalo' };
    await t.send(zalo);
    assert.equal(refreshes, 1, 'the first send fetched a token with the configured refresh token');
    assert.equal(new URLSearchParams(f.calls[0].body).get('refresh_token'), 'rt-0');
    const sent = JSON.parse(f.calls[1].body);
    assert.equal(f.calls[1].headers.access_token, 'at-1');
    assert.deepEqual([sent.phone, sent.template_id, sent.template_data, sent.tracking_id], ['84912345678', 'tpl-otp', { otp: '123456' }, 'msg-1']);
    assert.equal(store.tokens.get('zalo')?.refreshToken, 'rt-1', 'the rotated refresh token is kept');
    // Within the hour: no new refresh.
    await t.send(zalo);
    assert.equal(refreshes, 1);
    // The provider says the token expired early: one refresh with the rotated token, then the send again.
    answers.unshift({ error: -124, message: 'Access token invalid' });
    const before = f.calls.length;
    await t.send(zalo);
    assert.equal(refreshes, 2);
    assert.equal(f.calls.length, before + 3, 'a failed send, a refresh, a send');
    assert.equal(new URLSearchParams(f.calls[before + 1].body).get('refresh_token'), 'rt-1', 'the refresh used the rotated token');
    assert.equal(f.calls[before + 2].headers.access_token, 'at-2');
    assert.equal(store.tokens.get('zalo')?.refreshToken, 'rt-2');
    // An hour later the token is stale: refreshed before sending.
    now = new Date('2026-10-19T11:30:00Z');
    await t.send(zalo);
    assert.equal(refreshes, 3);
    // A number that is not on Zalo: permanent. Out of quota: retried later.
    answers.unshift({ error: -114, message: 'User inactive' });
    await assert.rejects(t.send(zalo), (e: Error) => e instanceof PermanentDeliveryError && /-114/.test(e.message));
    answers.unshift({ error: -118, message: 'Quota' });
    await assert.rejects(t.send(zalo), (e: Error) => !(e instanceof PermanentDeliveryError) && /-118/.test(e.message));
  });

  it('a new instance starts from the stored token, not the configured one', async () => {
    const f = fake((req) => (req.url === '/v4/oa/access_token' ? { status: 200, json: { access_token: 'at-x', refresh_token: 'rt-x', expires_in: 3600 } } : { status: 200, json: { error: 0 } }));
    servers.push(f.server);
    const base = await f.start();
    const store = new MemoryTokenStore();
    await store.save('zalo', { accessToken: 'at-stored', refreshToken: 'rt-stored', expiresAt: new Date(Date.now() + 3_600_000) });
    const t = new ZaloZnsTransport({ appId: 'a', secretKey: 's', refreshToken: 'rt-config', otpTemplateId: 'tpl', base, oauthBase: base }, store);
    await t.send({ ...otp(), channel: 'zalo' });
    assert.equal(f.calls.length, 1, 'no refresh needed');
    assert.equal(f.calls[0].headers.access_token, 'at-stored');
  });
});
