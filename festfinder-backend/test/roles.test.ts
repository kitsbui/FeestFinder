import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';
import { emailUser, googleUser, phoneUser } from './people.ts';

describe('personas: artist and organiser, from the person’s side and the team’s', () => {
  let env: TestEnv;
  let admin: string;
  let dj: string;
  let promoter: string;
  before(async () => {
    env = await setup();
    admin = await env.admin();
    dj = await emailUser(env, 'dj.linh@example.com');
    promoter = await emailUser(env, 'promo@example.com');
  });
  after(async () => { await env.close(); });

  it('starts every account as a fan, asked once which other ways it uses FeestFinder', async () => {
    const me = await env.as(dj).get('/me/roles');
    assert.deepEqual([me.body.roles, me.body.artist, me.body.admin, me.body.onboarded], [{ artist: null, organizer: null }, null, false, false]);
    assert.equal((await env.as(dj).get('/auth/session')).body.user.onboarded, false);
    await env.as(dj).post('/me/onboarding');
    assert.equal((await env.as(dj).get('/me/roles')).body.onboarded, true);
    // The demo accounts were here before the picker.
    assert.equal((await env.as(await env.attendee()).get('/me/roles')).body.onboarded, true);
  });

  it('makes an artist profile of one’s own, and sends a listed name to a claim instead', async () => {
    const taken = await env.as(dj).post('/me/roles/artist', { stageName: 'HOAPROX' });
    assert.equal(taken.status, 409);
    assert.equal(taken.body.error.code, 'artist_exists');
    assert.equal(taken.body.error.details.slug, 'hoaprox');
    const res = await env.as(dj).post('/me/roles/artist', { stageName: 'Linh Ngo', roles: ['dj', 'producer'], basedCity: 'ha-noi', styles: ['hard-techno', 'techno'] });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    assert.deepEqual([res.body.roles.artist, res.body.artist.name, res.body.slug], ['active', 'Linh Ngo', 'linh-ngo']);
    const row = (await env.ctx.db.query<any>(`select artist_roles, based_city, based_country, styles from artists where slug = 'linh-ngo'`)).rows[0];
    assert.deepEqual([row.artist_roles, row.based_city, row.based_country, row.styles], [['dj', 'producer'], 'ha-noi', 'VN', ['hard-techno', 'techno']]);
    const session = (await env.as(dj).get('/auth/session')).body;
    assert.deepEqual([session.roles.artist, session.artist.slug], ['active', 'linh-ngo']);
  });

  it('suggests listed profiles to claim, then lets the team decide the claim', async () => {
    const sug = await env.as(promoter).get('/me/roles/suggestions?q=hoap');
    assert.equal(sug.body.artists[0].slug, 'hoaprox');
    const hoaprox = sug.body.artists[0].id;
    const claim = await env.as(promoter).post('/me/roles/artist', { claimArtistId: hoaprox, note: 'This is me', proofUrl: 'https://instagram.com/hoaprox' });
    assert.equal(claim.status, 202);
    assert.equal(claim.body.roles.artist, 'pending');
    assert.equal(claim.body.claims.artist[0].slug, 'hoaprox');
    assert.equal((await env.as(promoter).get('/admin/profile-claims')).status, 403, 'only the team decides');
    const list = await env.as(admin).get('/admin/profile-claims');
    const item = list.body.items.find((c: any) => c.kind === 'artist' && c.target.slug === 'hoaprox');
    assert.deepEqual([item.user.email, item.note, item.target.events > 0], ['promo@example.com', 'This is me', true]);
    const ok = await env.as(admin).post(`/admin/profile-claims/artist/${item.id}/decision`, { approve: true });
    assert.equal(ok.status, 200, JSON.stringify(ok.body));
    const me = await env.as(promoter).get('/me/roles');
    assert.deepEqual([me.body.roles.artist, me.body.artist.slug], ['active', 'hoaprox']);
    const notified = await env.ctx.db.query<{ n: number }>(`select count(*)::int as n from notifications n join users u on u.id = n.user_id where u.email = 'promo@example.com' and n.kind = 'profile_claim'`);
    assert.equal(notified.rows[0].n, 1);
    // Owned now: another claim cannot take it, and the owner cannot claim a second profile.
    const again = await env.as(admin).post(`/admin/profile-claims/artist/${item.id}/decision`, { approve: true });
    assert.equal(again.body.error.code, 'already_decided');
    const second = await env.as(promoter).post('/me/roles/artist', { claimArtistId: (await env.ctx.db.query<any>(`select id from artists where slug = 'wukong'`)).rows[0].id });
    assert.equal(second.body.error.code, 'has_profile');
  });

  it('creates an organiser waiting for verification, or claims a listed one as a manager', async () => {
    const taken = await env.as(dj).post('/me/roles/organizer', { name: 'Ravolution Entertainment' });
    assert.equal(taken.body.error.code, 'organizer_exists');
    const made = await env.as(dj).post('/me/roles/organizer', { name: 'Hanoi Warehouse Collective', type: 'collective', city: 'ha-noi' });
    assert.equal(made.status, 201, JSON.stringify(made.body));
    const org = (await env.ctx.db.query<any>(`select o.verification_state, o.type, o.markets, m.role from organizers o join organizer_members m on m.organizer_id = o.id where o.slug = $1`, [made.body.slug])).rows[0];
    assert.deepEqual([org.verification_state, org.type, org.markets, org.role, made.body.roles.organizer], ['pending', 'collective', ['ha-noi'], 'owner', 'active']);
    const ravo = (await env.ctx.db.query<any>(`select id from organizers where slug = 'ravoent'`)).rows[0].id;
    const claim = await env.as(promoter).post('/me/roles/organizer', { claimOrganizerId: ravo, note: 'I run bookings' });
    assert.equal(claim.body.roles.organizer, 'pending');
    const item = (await env.as(admin).get('/admin/profile-claims')).body.items.find((c: any) => c.kind === 'organizer');
    await env.as(admin).post(`/admin/profile-claims/organizer/${item.id}/decision`, { approve: true });
    const member = await env.ctx.db.query<any>(`select m.role from organizer_members m join users u on u.id = m.user_id where u.email = 'promo@example.com' and m.organizer_id = $1`, [ravo]);
    assert.equal(member.rows[0].role, 'manager', 'Ravolution has an owner already');
    assert.equal((await env.as(promoter).get('/me/roles')).body.roles.organizer, 'active');
  });

  it('turns a persona off without losing the profile, and back on', async () => {
    const off = await env.as(dj).delete('/me/roles/artist');
    assert.equal(off.body.roles.artist, 'disabled');
    assert.equal((await env.as().get('/artists/linh-ngo')).status, 200, 'the public profile stays');
    const on = await env.as(dj).put('/me/roles/artist');
    assert.equal(on.body.roles.artist, 'active');
    const none = await env.as(await emailUser(env, 'nobody.yet@example.com')).put('/me/roles/organizer');
    assert.equal(none.status, 404);
  });

  it('never lets anyone make themselves an admin', async () => {
    assert.equal((await env.as(dj).post('/me/roles/admin', {})).status, 404);
    assert.equal((await env.as(dj).put('/me/roles/admin')).status, 400);
    await env.as(dj).patch('/me', { name: 'Linh', role: 'admin' });
    assert.equal((await env.as(dj).get('/auth/session')).body.user.role, 'user');
    assert.equal((await env.as(dj).get('/admin/counts')).status, 403);
  });
});

describe('the admin allowlist', () => {
  let env: TestEnv;
  before(async () => { env = await setup({ config: { adminEmails: ['kieu.anh@gmail.com'] } }); });
  after(async () => { await env.close(); });

  it('gives admin rights to a listed address when its owner signs in with Google, and to no one else', async () => {
    const listed = await googleUser(env, 'mock:kieu.anh:Kiều Anh');
    const who = (await env.app.inject({ method: 'GET', url: '/auth/session', headers: { cookie: `ff_session=${listed}` } })).json().user;
    assert.deepEqual([who.email, who.role], ['kieu.anh@gmail.com', 'admin']);
    const other = await googleUser(env, 'mock:someone:Someone');
    const them = (await env.app.inject({ method: 'GET', url: '/auth/session', headers: { cookie: `ff_session=${other}` } })).json().user;
    assert.equal(them.role, 'user');
  });

  it('does not hand a Google sign-in to an account that only typed the address into its profile', async () => {
    const squatter = await phoneUser(env, '0909123456');
    await env.as(squatter).patch('/me', { email: 'victim.real@gmail.com' });
    const victim = await googleUser(env, 'mock:victim.real:Victim');
    const v = (await env.app.inject({ method: 'GET', url: '/auth/session', headers: { cookie: `ff_session=${victim}` } })).json().user;
    const s = (await env.as(squatter).get('/me')).body.user;
    assert.notEqual(v.id, s.id, 'the Google owner gets an account of their own');
    assert.equal(v.email, 'victim.real@gmail.com');
    assert.equal(s.email, null, 'the unproven copy of the address is dropped');
  });
});

describe('admin rights that need Google', () => {
  let env: TestEnv;
  before(async () => { env = await setup({ config: { adminSignIn: 'google' } }); });
  after(async () => { await env.close(); });

  it('lets an admin account signed in with a password act only as a user', async () => {
    const token = await env.admin();
    const me = (await env.as(token).get('/auth/session')).body.user;
    assert.deepEqual([me.role, me.adminNeedsGoogle], ['user', true]);
    assert.equal((await env.as(token).get('/admin/counts')).status, 403);
  });
});
