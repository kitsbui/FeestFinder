import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setup, type TestEnv } from './helpers.ts';
import { translatePending, translateSystem, type TextLang, type Translator } from '../src/services/translate.ts';
import { one } from '../src/db/index.ts';

/** Answers with the language it was asked for in front of the text, so a test can see what was sent. */
class FakeTranslator implements Translator {
  readonly enabled = true;
  calls: [string, TextLang, TextLang][] = [];
  async translate(text: string, from: TextLang, to: TextLang) { this.calls.push([text, from, to]); return `[${to}] ${text}`; }
}

describe('machine translation of descriptions (phase 15)', () => {
  let env: TestEnv;
  const fake = new FakeTranslator();
  before(async () => { env = await setup({ translator: fake }); });
  after(async () => { await env.close(); });

  it('fills the missing language of a live listing, marks it, keeps the original, and does it once', async () => {
    const ravo = await one<{ id: string }>(env.ctx.db, "select id from events where slug = 'ravo'");
    // A Radar-like find: English only.
    await env.ctx.db.query(`update events set description = '{"en":"Techno all night at the old factory. Doors 22:00.","vi":""}', auto_translated = '{}' where id = $1`, [ravo!.id]);
    // One where the organiser wrote both: left alone.
    const warm = await one<{ id: string }>(env.ctx.db, "select id from events where slug = 'ravo-warmup'");
    const r1 = await translatePending(env.ctx, 10);
    assert.ok(r1.translated >= 1, JSON.stringify(r1));
    assert.ok(fake.calls.some(([text, from, to]) => text.startsWith('Techno all night') && from === 'en' && to === 'vi'));
    const row = (await one<{ description: { en: string; vi: string }; auto_translated: string[] }>(env.ctx.db, 'select description, auto_translated from events where id = $1', [ravo!.id]))!;
    assert.equal(row.description.vi, '[vi] Techno all night at the old factory. Doors 22:00.');
    assert.equal(row.description.en, 'Techno all night at the old factory. Doors 22:00.', 'the original stays');
    assert.deepEqual(row.auto_translated, ['vi']);
    const other = (await one<{ auto_translated: string[] }>(env.ctx.db, 'select auto_translated from events where id = $1', [warm!.id]))!;
    assert.deepEqual(other.auto_translated, []);
    // The page says which language a machine wrote.
    const page = await env.as().get('/events/ravo');
    assert.deepEqual(page.body.descriptionAuto, ['vi']);
    assert.equal(page.body.description.vi, '[vi] Techno all night at the old factory. Doors 22:00.');
    // Nothing left to do: a second pass sends nothing.
    const before = fake.calls.length;
    const r2 = await translatePending(env.ctx, 10);
    assert.equal(r2.translated, 0);
    assert.equal(fake.calls.length, before);
  });

  it('goes the other way for a Vietnamese-only listing, and the prompt keeps names and prices', async () => {
    const out = await one<{ id: string }>(env.ctx.db, "select id from events where slug = 'outcast'");
    await env.ctx.db.query(`update events set description = '{"en":"","vi":"Đêm nhạc miễn phí ở Quận 3."}', auto_translated = '{}' where id = $1`, [out!.id]);
    await translatePending(env.ctx, 10);
    const row = (await one<{ description: { en: string; vi: string }; auto_translated: string[] }>(env.ctx.db, 'select description, auto_translated from events where id = $1', [out!.id]))!;
    assert.equal(row.description.en, '[en] Đêm nhạc miễn phí ở Quận 3.');
    assert.deepEqual(row.auto_translated, ['en']);
    assert.match(translateSystem('en', 'vi'), /Keep artist names, venue names, dates, times, prices and links/);
  });

  it('does nothing without a translator', async () => {
    const off = await setup();
    try {
      const r = await translatePending(off.ctx, 10);
      assert.deepEqual(r, { translated: 0, failed: 0 });
    } finally { await off.close(); }
  });
});
