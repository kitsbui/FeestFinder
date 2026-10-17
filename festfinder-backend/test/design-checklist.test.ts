import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
// @ts-expect-error: a plain .mjs script of the CI, without types.
import { problems } from '../../.github/scripts/design-checklist.mjs';

/*
 * The design checklist a pull request must tick when it touches the front (design v2 phase 6,
 * .github/workflows/design-checklist.yml).
 */

const template = readFileSync(new URL('../../.github/pull_request_template.md', import.meta.url), 'utf8');
const tick = (body: string, pick: (line: string) => boolean) => body.split('\n').map((l) => (pick(l) ? l.replace('- [ ]', '- [x]') : l)).join('\n');
/** A line that is an open box of the design section (read in order). */
const inDesign = () => {
  let on = false;
  return (l: string) => { if (/^## /.test(l)) on = /Thiết kế/.test(l); return on && l.startsWith('- [ ]'); };
};

test('the template as it comes asks for every box', () => {
  const out = problems(template);
  assert.ok(out.length >= 7);
  assert.ok(out.every((p: string) => p.startsWith('Not ticked: ')));
});

test('every design box ticked passes; the other sections do not count', () => {
  const pick = inDesign();
  const body = tick(template, (l) => pick(l) && !/Không đổi giao diện/.test(l));
  assert.deepEqual(problems(body), []);
});

test('"Không đổi giao diện" ticked passes alone', () => {
  assert.deepEqual(problems(tick(template, (l) => l.includes('Không đổi giao diện'))), []);
});

test('one box left names it', () => {
  const pick = inDesign();
  const body = tick(template, (l) => pick(l) && !/Không đổi giao diện|Ba trạng thái/.test(l));
  assert.deepEqual(problems(body), ['Not ticked: Ba trạng thái: đang tải, rỗng (có việc để làm), lỗi (thử lại)']);
});

test('a description without the checklist, or empty, is told where it is', () => {
  assert.match(problems('Fix a typo')[0], /no "## Thiết kế" checklist/);
  assert.match(problems(null)[0], /no "## Thiết kế" checklist/);
  // A box inside a comment is not a box.
  assert.match(problems('## Thiết kế\n<!-- - [x] Không đổi giao diện -->')[0], /has no boxes/);
});
