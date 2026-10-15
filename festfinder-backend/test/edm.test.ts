import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { setup, type TestEnv } from './helpers.ts';
import { one } from '../src/db/index.ts';
import { splitSql } from '../src/db/migrate.ts';
import { finalize } from '../src/services/ingest/normalize.ts';
import type { NormalizedEvent } from '../src/services/ingest/types.ts';

/*
 * FeestFinder lists electronic music only. Migration 031 empties the catalogue for the switch
 * (it ran on the empty test database before the seed; here it runs again on the seeded one,
 * as it does in production), imports drop other genres, and an unclassified import a
 * moderator approves becomes EDM.
 */

const MIGRATION = readFileSync(new URL('../src/db/migrations/031_edm_only.sql', import.meta.url), 'utf8');
const BACKUP = readFileSync(new URL('../src/db/migrations/030_9_backup_before_edm.sql', import.meta.url), 'utf8');
const count = async (env: TestEnv, table: string) => (await one<{ n: number }>(env.ctx.db, `select count(*)::int as n from ${table}`))!.n;

describe('EDM only', () => {
  let env: TestEnv;
  before(async () => { env = await setup(); });
  after(async () => { await env.close(); });

  it('drops an import that names another genre, keeps one that names an EDM style, and queues one that names none', () => {
    const now = new Date('2026-09-14T03:00:00Z');
    const draft = (tags: string[], title: string) => ({ title, start: '2026-10-02T21:00', venueName: 'Lot 4', tags });
    const rock = finalize(draft(['Rock'], 'Friday Night'), { now, fallbackCity: 'ho-chi-minh' }) as NormalizedEvent;
    assert.equal(rock.otherGenre, 'Rock');
    const both = finalize(draft(['Rock', 'Techno'], 'Friday Night'), { now, fallbackCity: 'ho-chi-minh' }) as NormalizedEvent;
    assert.deepEqual([both.genre, both.otherGenre], ['EDM', null], 'an EDM style wins');
    const none = finalize(draft([], 'Friday Night'), { now, fallbackCity: 'ho-chi-minh' }) as NormalizedEvent;
    assert.deepEqual([none.genre, none.otherGenre], [null, null], 'unclassified: it waits for a moderator');
  });

  it('makes an unclassified listing EDM when a moderator approves it, and refuses other genres', async () => {
    const admin = await env.admin();
    const id = env.ids.event['underground-techno-w12'];
    await env.ctx.db.query('update events set genre = null where id = $1', [id]);
    assert.equal((await env.as(admin).post('/admin/listings/approve', { ids: [id] })).status, 200);
    assert.equal((await one<{ genre: string }>(env.ctx.db, 'select genre from events where id = $1', [id]))!.genre, 'EDM');
    await assert.rejects(env.ctx.db.query(`update events set genre = 'Jazz' where id = $1`, [id]), /events_genre_check/);
    assert.equal((await env.as().get('/events?genre=Jazz')).status, 400);
  });

  it('migration 031 deletes every event and what hangs off it (after a copy), keeps people, places and sources, and lets sources start over', async () => {
    const kept = { users: await count(env, 'users'), organizers: await count(env, 'organizers'), venues: await count(env, 'venues'), artists: await count(env, 'artists') };
    assert.ok((await count(env, 'events')) > 0 && (await count(env, 'orders')) > 0 && (await count(env, 'tickets')) > 0);
    await env.ctx.db.query(`insert into ingest_sources (adapter, name, url, authority, config, etag, content_hash, next_run_at)
      values ('website', 'TicketGo · Âm nhạc', 'https://ticketgo.vn/event/category/am-nhac', 'ticketing', '{"maxPages": 20}', 'W/"1"', 'abc', '2030-01-01')`);
    await env.ctx.db.query(`update artists set styles = '{rock,techno}' where id = (select id from artists order by name limit 1)`);

    const events = await count(env, 'events');
    // Applied the way migrate() applies a file: in one transaction, statement by statement. In
    // production the copy runs first (030_9 sorts before 031); here it ran on the empty database,
    // so it is taken again.
    await env.ctx.db.query('drop schema backup_before_031 cascade');
    await env.ctx.db.tx(async (q) => { for (const s of splitSql(BACKUP)) await q.query(s); });
    await env.ctx.db.tx(async (q) => { for (const s of splitSql(MIGRATION)) await q.query(s); });
    assert.equal(await count(env, 'backup_before_031.events'), events, 'every event is kept in the copy');
    assert.ok((await count(env, 'backup_before_031.orders')) > 0, 'with its orders');

    for (const t of ['events', 'orders', 'tickets', 'ticket_tiers', 'saves', 'raw_events', 'event_sources']) assert.equal(await count(env, t), 0, t);
    assert.deepEqual({ users: await count(env, 'users'), organizers: await count(env, 'organizers'), venues: await count(env, 'venues'), artists: await count(env, 'artists') }, kept);
    const src = (await one<any>(env.ctx.db, `select config, etag, content_hash, next_run_at from ingest_sources where name = 'TicketGo · Âm nhạc'`))!;
    assert.equal(src.config.requireStyle, true, 'a general music listing now needs an EDM style');
    assert.deepEqual([src.etag, src.content_hash], [null, null], 'it forgets the page it last read');
    assert.ok(new Date(src.next_run_at) <= new Date(), 'and runs again now');
    const artist = (await one<{ styles: string[] }>(env.ctx.db, 'select styles from artists order by name limit 1'))!;
    assert.deepEqual(artist.styles, ['techno']);
  });
});
