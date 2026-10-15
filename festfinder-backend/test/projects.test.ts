import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';
import { emailUser, phoneUser } from './people.ts';

describe('projects: an idea for a night, and the people who offer to make it happen', () => {
  let env: TestEnv;
  let admin: string;
  let owner: string;
  let fan: string;
  let dj: string;
  let id: string;
  let slug: string;
  before(async () => {
    env = await setup();
    admin = await env.admin();
    owner = await phoneUser(env, '0912 300 400');
    fan = await emailUser(env, 'brand.manager@example.com');
    dj = await emailUser(env, 'dj.mai@example.com');
    await env.as(dj).post('/me/roles/artist', { stageName: 'Mai Pulse', roles: ['dj'], styles: ['techno'] });
  });
  after(async () => { await env.close(); });

  const STORY = 'A warehouse techno night by the river in Thủ Đức, with a local lineup and one headliner from Tokyo. We have the sound system and a crew of twelve; we need a venue partner and sponsors.';

  it('starts as a draft that anyone can make, says what is missing, and needs a confirmed phone to go to review', async () => {
    const made = await env.as(owner).post('/me/projects', { title: 'River Warehouse', city: 'ho-chi-minh' });
    assert.equal(made.status, 201, JSON.stringify(made.body));
    ({ id, slug } = made.body);
    assert.deepEqual([made.body.status, made.body.currency, made.body.mine, made.body.missing.length], ['draft', 'VND', true, 3]);
    assert.equal((await env.as(owner).post(`/me/projects/${id}/submit`)).body.error.code, 'incomplete');
    const filled = await env.as(owner).patch(`/me/projects/${id}`, {
      pitch: 'A riverside warehouse techno night for 800 people', story: STORY, styles: ['techno', 'hard-techno'], eventType: 'rave',
      targetOn: '2026-12-12', capacity: 800, budget: 450_000_000, raiseAmount: 200_000_000, seeking: ['sponsorship', 'artists', 'venue', 'investment'],
    });
    assert.deepEqual(filled.body.missing, []);
    await env.as(owner).put(`/me/projects/${id}/packages`, { items: [{ title: 'Main sponsor', amount: 100_000_000, perks: 'Logo on stage, 20 tickets', slots: 1 }, { title: 'Bar partner', amount: 30_000_000 }] });
    // Not public yet: the owner sees it, nobody else does.
    assert.equal((await env.as(fan).get(`/projects/${slug}`)).status, 404);
    assert.equal((await env.as(owner).get(`/projects/${slug}`)).body.packages.length, 2);
    // Someone without a confirmed phone cannot publish (Decree 147/2024, as for every post).
    const other = await env.as(fan).post('/me/projects', { title: 'Brand pop-up', city: 'ha-noi', pitch: 'x'.repeat(30), story: STORY, seeking: ['artists'] });
    assert.equal((await env.as(fan).post(`/me/projects/${other.body.id}/submit`)).body.error.code, 'phone_unverified');
    const sent = await env.as(owner).post(`/me/projects/${id}/submit`);
    assert.equal(sent.body.status, 'in_review', JSON.stringify(sent.body));
    assert.equal((await env.as().get('/projects')).body.total, 0);
  });

  it('is reviewed by the team: sent back with a reason, then approved and listed', async () => {
    assert.equal((await env.as(owner).get('/admin/projects')).status, 403);
    const queue = (await env.as(admin).get('/admin/projects')).body;
    assert.deepEqual(queue.items.map((p: any) => p.slug), [slug]);
    assert.equal((await env.as(admin).post(`/admin/projects/${id}/decision`, { action: 'reject' })).body.error.code, 'note_required');
    await env.as(admin).post(`/admin/projects/${id}/decision`, { action: 'reject', note: 'Say who runs the sound' });
    const back = (await env.as(owner).get(`/me/projects/${id}`)).body;
    assert.deepEqual([back.status, back.decisionNote], ['rejected', 'Say who runs the sound']);
    await env.as(owner).patch(`/me/projects/${id}`, { story: `${STORY} Sound by our own crew, Funktion-One rig.` });
    await env.as(owner).post(`/me/projects/${id}/submit`);
    const ok = await env.as(admin).post(`/admin/projects/${id}/decision`, { action: 'approve' });
    assert.equal(ok.body.status, 'open');
    const notes = await env.ctx.db.query<{ n: number }>(`select count(*)::int as n from notifications n join users u on u.id = n.user_id where u.phone like '%300400' and n.kind = 'project_review'`);
    assert.equal(notes.rows[0].n, 2);

    const list = (await env.as().get('/projects')).body;
    assert.deepEqual([list.total, list.items[0].slug, list.seeking.sponsorship, list.seeking.partner], [1, slug, 1, 0]);
    assert.equal((await env.as().get('/projects?seeking=partner')).body.total, 0);
    assert.equal((await env.as().get('/projects?city=ha-noi')).body.total, 0);
    const page = (await env.as(fan).get(`/projects/${slug}`)).body;
    assert.equal(page.mine, undefined, 'the owner fields stay the owner’s');
    assert.match(page.disclaimer.vi, /không nhận, giữ hay chuyển tiền/);
  });

  it('takes offers that answer what it asks for, from the right people', async () => {
    const pkg = (await env.as().get(`/projects/${slug}`)).body.packages[0].id;
    assert.equal((await env.as(owner).post(`/projects/${slug}/offers`, { kind: 'sponsor', orgName: 'Self' })).body.error.code, 'own_project');
    assert.equal((await env.as(fan).post(`/projects/${slug}/offers`, { kind: 'partner' })).body.error.code, 'not_needed');
    assert.equal((await env.as(fan).post(`/projects/${slug}/offers`, { kind: 'sponsor' })).body.error.code, 'org_name');
    assert.equal((await env.as(fan).post(`/projects/${slug}/offers`, { kind: 'perform' })).body.error.code, 'no_artist');
    const sponsor = await env.as(fan).post(`/projects/${slug}/offers`, { kind: 'sponsor', orgName: 'Saigon Beer Co.', packageId: pkg, amount: 100_000_000, message: 'We like the river' });
    assert.equal(sponsor.status, 201, JSON.stringify(sponsor.body));
    assert.equal((await env.as(fan).post(`/projects/${slug}/offers`, { kind: 'sponsor', orgName: 'Again' })).body.error.code, 'offer_exists');
    const play = await env.as(dj).post(`/projects/${slug}/offers`, { kind: 'perform', message: 'Two hours of hard techno' });
    assert.equal(play.status, 201);

    const offers = (await env.as(owner).get(`/me/projects/${id}/offers`)).body.items;
    assert.deepEqual(offers.map((o: any) => [o.kind, o.from, o.contact]).sort(), [['perform', 'Mai Pulse', null], ['sponsor', 'Saigon Beer Co.', null]]);
    assert.equal(offers.find((o: any) => o.kind === 'sponsor').package, 'Main sponsor');
    const owners = await env.ctx.db.query<{ n: number }>(`select count(*)::int as n from notifications n join users u on u.id = n.user_id where u.phone like '%300400' and n.kind = 'project_offer'`);
    assert.equal(owners.rows[0].n, 2);

    // Accepting shows each side how to reach the other; FeestFinder never sees money.
    const s = offers.find((o: any) => o.kind === 'sponsor');
    await env.as(owner).post(`/me/projects/${id}/offers/${s.id}`, { accept: true });
    const after = (await env.as(owner).get(`/me/projects/${id}/offers`)).body.items.find((o: any) => o.id === s.id);
    assert.deepEqual([after.status, after.contact.email], ['accepted', 'brand.manager@example.com']);
    const mine = (await env.as(fan).get('/me/offers')).body.items[0];
    assert.equal(mine.status, 'accepted');
    assert.match(mine.contact.phone, /300400/);
    assert.equal((await env.as(owner).post(`/me/projects/${id}/offers/${s.id}`, { accept: false })).body.error.code, 'already_decided');
    // The artist withdraws; the page counts who is on board.
    const p = offers.find((o: any) => o.kind === 'perform');
    assert.equal((await env.as(dj).post(`/me/offers/${p.id}/withdraw`)).body.status, 'withdrawn');
    assert.deepEqual((await env.as().get(`/projects/${slug}`)).body.onBoard, { sponsor: 1 });
  });

  it('becomes an event: the event names its sponsors, and the project page speaks to search engines and AI', async () => {
    // The owner organises Ravolution's nights too.
    await env.ctx.db.query(`insert into organizer_members (organizer_id, user_id, role)
      select o.id, u.id, 'manager' from organizers o, users u where o.slug = 'ravoent' and u.phone like '%300400'`);
    assert.equal((await env.as(owner).post(`/me/projects/${id}/event`, { slug: 'no-such-night' })).status, 404);
    const linked = await env.as(owner).post(`/me/projects/${id}/event`, { slug: 'ravo' });
    assert.deepEqual([linked.body.status, linked.body.event.slug], ['realized', 'ravo']);
    assert.deepEqual((await env.as().get('/events/ravo')).body.sponsors, [{ name: 'Saigon Beer Co.' }]);
    const eventSeo = (await env.as().get('/seo/events/ravo')).body;
    const ev = eventSeo.jsonLd['@graph'].find((n: any) => n['@type'] === 'MusicEvent');
    assert.deepEqual(ev.sponsor, [{ '@type': 'Organization', name: 'Saigon Beer Co.' }]);

    const seo = (await env.as().get(`/seo/projects/${slug}`)).body;
    const project = seo.jsonLd['@graph'].find((n: any) => n['@type'] === 'Project');
    assert.deepEqual(project.seeks.map((d: any) => d.name), ['Tài trợ', 'Nghệ sĩ', 'Địa điểm', 'Đầu tư']);
    assert.equal(project.subjectOf.url.endsWith('/e/ravo'), true);
    assert.equal(seo.robots.startsWith('index'), true);
    const md = (await env.app.inject({ method: 'GET', url: `/p/${slug}.md?lang=en` })).body;
    assert.match(md, /^# River Warehouse/);
    assert.match(md, /does not take, hold or move money/);
    assert.match((await env.app.inject({ method: 'GET', url: '/sitemap.xml' })).body, new RegExp(`/p/${slug}<`));
    assert.equal((await env.as().get('/seo/projects/no-such-project')).status, 404);
  });
});
