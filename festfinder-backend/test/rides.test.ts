import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';
import { ridesFor, type RideEvent } from '../src/lib/rides.ts';

const ev = (o: Partial<RideEvent> & { venue?: Partial<RideEvent['venue']> } = {}): RideEvent => ({
  city: 'ho-chi-minh', past: false, status: 'live', ...o,
  venue: { name: 'Kho Số 9', address: '9 Đường Số 1', area: 'Quận 4', lat: 10.76, lng: 106.7, ...o.venue },
});

describe('ride apps, pure', () => {
  it('opens Grab, Be and Green SM in Vietnam, by package on Android and by link on iPhone', () => {
    const rides = ridesFor(ev());
    assert.deepEqual(rides.map((r) => r.key), ['grab', 'be', 'greensm']);
    const [grab, be, gsm] = rides;
    assert.equal(grab.android, 'intent://open?screenType=BOOKING#Intent;scheme=grab;package=com.grabtaxi.passenger;S.browser_fallback_url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dcom.grabtaxi.passenger;end');
    assert.deepEqual(grab.ios, { app: 'grab://open?screenType=BOOKING', store: 'https://apps.apple.com/app/id647268330', universal: null });
    // Be: its own OneLink is a universal link on an iPhone, so it opens the app with no error page when missing.
    assert.equal(be.android, 'intent://home#Intent;scheme=xyz.be.customer;package=xyz.be.customer;S.browser_fallback_url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dxyz.be.customer;end');
    assert.deepEqual(be.ios, { app: 'xyz.be.customer://home', store: 'https://apps.apple.com/app/id1440565902', universal: 'https://begroup.onelink.me/ZOqn/becustomerapp' });
    assert.equal(gsm.android, 'intent://homepage#Intent;scheme=xanhsm.com;package=com.gsm.customer;S.browser_fallback_url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dcom.gsm.customer;end');
    assert.deepEqual(gsm.ios, { app: 'xanhsm.com://homepage', store: 'https://apps.apple.com/app/id6446425595', universal: null });
    // No app claims to fill the destination yet: the address is copied for it.
    assert.ok(rides.every((r) => !r.prefilled));
    assert.equal(grab.copyText, 'Kho Số 9, 9 Đường Số 1, Quận 4, TP.HCM');
    assert.equal(ridesFor(ev(), 'en')[0].copyText, 'Kho Số 9, 9 Đường Số 1, Quận 4, Ho Chi Minh City');
  });

  it('follows the country of the event’s city, never a hard-coded one', () => {
    assert.deepEqual(ridesFor(ev({ city: 'ha-noi' })).map((r) => r.key), ['grab', 'be', 'greensm']);
    assert.deepEqual(ridesFor(ev({ city: 'bangkok' })).map((r) => r.key), ['grab']);
    assert.deepEqual(ridesFor(ev({ city: 'singapore' })).map((r) => r.key), ['grab']);
    assert.deepEqual(ridesFor(ev({ city: 'tokyo' })), [], 'neither app rides in Japan');
    assert.deepEqual(ridesFor(ev({ city: null })), []);
  });

  it('only for a night still to come, with somewhere to go', () => {
    assert.deepEqual(ridesFor(ev({ past: true })), []);
    assert.deepEqual(ridesFor(ev({ status: 'cancelled' })), []);
    assert.deepEqual(ridesFor(ev({ venue: { name: null, address: null, area: null, lat: null, lng: null } })), []);
  });
});

describe('ride apps on the event page', () => {
  let env: TestEnv;
  let organizer: string;
  before(async () => {
    env = await setup();
    organizer = await env.organizer();
  });
  after(async () => { await env.close(); });

  it('the event says which apps to open; a press is counted for the organiser, once per half hour', async () => {
    const page = await env.as().get('/events/ravo?lang=vi');
    assert.deepEqual(page.body.rides.map((r: { key: string }) => r.key), ['grab', 'be', 'greensm']);
    assert.match(page.body.rides[0].copyText, /, TP\.HCM$/, 'the address in the reader’s language');
    const id = page.body.id;
    assert.equal((await env.as().post(`/events/${id}/track`, { type: 'ride_click' })).body.counted, true);
    assert.equal((await env.as().post(`/events/${id}/track`, { type: 'ride_click' })).body.counted, false, 'the same person again');
    const perf = await env.as(organizer).get(`/organizer/events/${id}/performance`);
    assert.equal(perf.status, 200, JSON.stringify(perf.body));
    assert.equal(perf.body.rideClicks, 1);
  });
});
