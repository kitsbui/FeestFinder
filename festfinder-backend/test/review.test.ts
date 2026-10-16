import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';
import { phoneUser } from './people.ts';
import { many, one } from '../src/db/index.ts';

/*
 * Who reviews a listing: every one sent in waits in the Console's queue and every admin (the
 * ADMIN_EMAIL allowlist) is told, in the app and by email; what an admin posts goes live at once.
 */

const READY = (title: string) => ({
  title, startsOn: '2026-10-10', startTime: '20:00', endTime: '02:00', venueName: 'Kho Số 9', city: 'ho-chi-minh',
  description: { en: 'A long night of techno with two rooms and the full production crew back for the closing of the season.', vi: '' },
  entryMode: 'paid', priceFrom: 300000, ticketUrl: 'https://ticketbox.vn/night', eventUrl: 'https://example.com/night',
  logoUrl: 'https://assets.feestfinder.com/logos/ravoent.png', lineup: ['Hoaprox'], age: '18+',
});

describe('review of listings', () => {
  let env: TestEnv;
  let organizer: string;
  let admin: string;
  let adminId: string;
  before(async () => {
    env = await setup();
    organizer = await env.organizer();
    admin = await env.admin();
    adminId = (await one<{ id: string }>(env.ctx.db, `select id from users where role = 'admin' limit 1`))!.id;
  });
  after(async () => { await env.close(); });

  const reviewNotes = () => many<{ title: any; link: any }>(env.ctx.db, `select title, link from notifications where user_id = $1 and kind = 'review_needed' order by created_at`, [adminId]);
  const emails = () => many<{ address: string }>(env.ctx.db, `select address from outbox where channel = 'email' and template = 'review_needed'`);

  it('an organiser’s listing waits for review, and every admin is told in the app and by email', async () => {
    const draft = await env.as(organizer).post('/organizer/events', { title: 'Organiser Night' });
    await env.as(organizer).patch(`/organizer/events/${draft.body.id}`, READY('Organiser Night'));
    const sent = await env.as(organizer).post(`/organizer/events/${draft.body.id}/submit`);
    assert.equal(sent.status, 200, JSON.stringify(sent.body));
    assert.equal(sent.body.status, 'in_review');
    const notes = await reviewNotes();
    assert.equal(notes.length, 1);
    assert.equal(notes[0].title.vi, 'Cần duyệt: Organiser Night');
    assert.equal(notes[0].link.url, `/console?id=${draft.body.id}`);
    assert.ok((await emails()).some((e) => e.address === 'admin@feestfinder.com'), 'by email too');
    // In the Console's queue.
    assert.ok((await env.as(admin).get('/admin/queue')).body.items.some((x: any) => x.id === draft.body.id));
  });

  it('a change to a live listing goes back to review, and the admins hear it is to review again', async () => {
    const live = await one<{ id: string }>(env.ctx.db, `select e.id from events e join organizers o on o.id = e.organizer_id where o.slug = 'ravoent' and e.status = 'live' limit 1`);
    const before = (await reviewNotes()).length;
    const r = await env.as(organizer).patch(`/organizer/events/${live!.id}`, { startTime: '19:00' });
    assert.equal(r.body.status, 'in_review');
    const notes = await reviewNotes();
    assert.equal(notes.length, before + 1);
    assert.ok(notes.some((n) => n.title.vi.startsWith('Đã sửa, cần duyệt lại: ') && n.link.url === `/console?id=${live!.id}`));
  });

  it('a community listing waits for review too, and the admins are told', async () => {
    const scout = await phoneUser(env, '0915 222 333');
    const before = (await reviewNotes()).length;
    const sent = await env.as(scout).post('/community/events', {
      title: 'Community Rave', genre: 'EDM', startsOn: '2026-10-11', startTime: '21:00', endTime: '03:00', venueName: 'The Garden', city: 'ho-chi-minh',
      entryMode: 'free', sourceUrl: 'https://instagram.com/p/community-rave',
    });
    assert.equal(sent.status, 201, JSON.stringify(sent.body));
    assert.equal(sent.body.status, 'in_review');
    const notes = await reviewNotes();
    assert.equal(notes.length, before + 1);
    assert.ok(notes.some((n) => n.title.vi === 'Cần duyệt: Community Rave'));
  });

  it('what an admin posts needs no review: from Studio, from the community form, and their own changes', async () => {
    // The admin on an organiser's team, as the team sometimes is.
    const org = await one<{ id: string }>(env.ctx.db, `select id from organizers where slug = 'ravoent'`);
    await env.ctx.db.query(`insert into organizer_members (organizer_id, user_id, role) values ($1,$2,'manager') on conflict do nothing`, [org!.id, adminId]);
    const before = (await reviewNotes()).length;

    const draft = await env.as(admin).post('/organizer/events', { title: 'Team Night' });
    assert.equal(draft.status, 201, JSON.stringify(draft.body));
    await env.as(admin).patch(`/organizer/events/${draft.body.id}`, READY('Team Night'));
    const sent = await env.as(admin).post(`/organizer/events/${draft.body.id}/submit`);
    assert.equal(sent.body.status, 'live', JSON.stringify(sent.body));
    assert.equal(sent.body.message.vi, 'Đã đăng');
    const decided = await one<{ decided_by: string }>(env.ctx.db, 'select decided_by from moderation_decisions where event_id = $1', [draft.body.id]);
    assert.equal(decided!.decided_by, adminId);

    const changed = await env.as(admin).patch(`/organizer/events/${draft.body.id}`, { startTime: '21:00' });
    assert.equal(changed.body.status, 'live', 'the team’s own change stays live');

    const community = await env.as(admin).post('/community/events', {
      title: 'Team Find', genre: 'EDM', startsOn: '2026-10-12', startTime: '22:00', endTime: '04:00', venueName: 'Lot 7', city: 'ho-chi-minh',
      entryMode: 'free', sourceUrl: 'https://example.com/team-find',
    });
    assert.equal(community.status, 201, JSON.stringify(community.body));
    assert.equal(community.body.status, 'live');
    assert.equal((await reviewNotes()).length, before, 'nobody is asked to review the team’s own listings');
  });
});
