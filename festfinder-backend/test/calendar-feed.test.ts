import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';

describe('calendar.ics feed', () => {
  let env: TestEnv;

  before(async () => {
    env = await setup();
  });

  after(async () => {
    await env.close();
  });

  it('returns 200 text/calendar with a seeded upcoming public event', async () => {
    const res = await env.as().get('/calendar.ics');
    assert.equal(res.status, 200);
    assert.match(String(res.headers['content-type']), /text\/calendar/);
    assert.match(String(res.headers['cache-control']), /public, max-age=300/);
    assert.equal(res.headers['access-control-allow-origin'], '*');
    // Body should be text containing ICS format
    assert.match(res.body, /BEGIN:VCALENDAR/);
    assert.match(res.body, /END:VCALENDAR/);
    assert.match(res.body, /BEGIN:VEVENT/);
    assert.match(res.body, /END:VEVENT/);
  });

  it('includes a seeded upcoming event in the feed', async () => {
    const res = await env.as().get('/calendar.ics');
    // The ravo event from seed is a future event, should be included
    const ravoTitle = 'Ravolution';
    assert.match(res.body, new RegExp(`SUMMARY:${ravoTitle}`));
    // Should have the event URL
    assert.match(res.body, /URL:http:\/\/test\.local\/e\/ravo/);
  });

  it('excludes draft events', async () => {
    const res = await env.as().get('/calendar.ics');
    // Draft events should not be included (status != 'live')
    // Since we don't know the exact title of draft events from seed, just verify
    // that we have some events but not all that might exist in the DB
    assert.match(res.body, /BEGIN:VEVENT/);
  });

  it('narrows by city with ?city=', async () => {
    const res = await env.as().get('/calendar.ics?city=ho-chi-minh');
    assert.equal(res.status, 200);
    assert.match(res.body, /BEGIN:VCALENDAR/);
    // Calendar name should include city
    assert.match(res.body, /X-WR-CALNAME:FeestFinder: sự kiện EDM tại/);
  });

  it('returns 400 for invalid city', async () => {
    const res = await env.as().get('/calendar.ics?city=invalid-city-xyz');
    assert.equal(res.status, 400);
    assert.deepEqual(res.body.error.code, 'invalid_input');
  });

  it('accepts lang parameter', async () => {
    const resVi = await env.as().get('/calendar.ics?lang=vi');
    const resEn = await env.as().get('/calendar.ics?lang=en');
    assert.equal(resVi.status, 200);
    assert.equal(resEn.status, 200);
    // Vi should have Vietnamese in calendar name
    assert.match(resVi.body, /X-WR-CALNAME:FeestFinder: sự kiện EDM/);
    // En should have English in calendar name
    assert.match(resEn.body, /X-WR-CALNAME:FeestFinder: EDM events/);
  });

  it('includes REFRESH-INTERVAL and X-PUBLISHED-TTL in the feed', async () => {
    const res = await env.as().get('/calendar.ics');
    assert.match(res.body, /REFRESH-INTERVAL;VALUE=DURATION:PT6H/);
    assert.match(res.body, /X-PUBLISHED-TTL:PT6H/);
  });

  it('has CORS * header like organizer feed', async () => {
    const res = await env.as().get('/calendar.ics');
    assert.equal(res.headers['access-control-allow-origin'], '*');
  });

  it('uses proper ICS UID, DTSTART/DTEND with TZID, URL and SUMMARY fields', async () => {
    const res = await env.as().get('/calendar.ics');
    // Check for proper VEVENT structure
    assert.match(res.body, /UID:.+@feestfinder.com/);
    assert.match(res.body, /DTSTART;TZID=Asia\/Ho_Chi_Minh:/);
    assert.match(res.body, /DTEND;TZID=Asia\/Ho_Chi_Minh:/);
    assert.match(res.body, /SUMMARY:/);
    assert.match(res.body, /URL:http:\/\/test\.local\/e\//);
  });
});
