import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/*
 * The icon fonts are cut to the icons the code names (festfinder-frontend/scripts/subset-icons.py).
 * This finds the names the same way and fails when one is missing from the cut, so a new icon
 * never shows as a blank square.
 */
const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const FRONT = join(ROOT, 'festfinder-frontend');
const RULE = /\.ph-(?:bold|fill)\.ph-([a-z0-9-]+):before \{\s*content: "\\([0-9a-f]+)";\s*\}/g;
const NOT_ICONS = new Set(['bold', 'fill', 'light', 'thin', 'regular', 'duotone']);

const namesIn = (css: string) => new Map([...css.matchAll(RULE)].map((m) => [m[1], m[2]]));
const read = (f: string) => readFileSync(f, 'utf8');

function* files(dir: string, exts: string[]): Generator<string> {
  for (const name of readdirSync(dir).sort()) {
    const f = join(dir, name);
    if (statSync(f).isDirectory()) {
      if (name !== 'vendor') yield* files(f, exts);
    } else if (exts.some((e) => f.endsWith(e))) yield f;
  }
}

describe('icon font cut', () => {
  const full = { bold: namesIn(read(join(FRONT, 'vendor-src/phosphor/bold/style.css'))), fill: namesIn(read(join(FRONT, 'vendor-src/phosphor/fill/style.css'))) };
  const cut = { bold: namesIn(read(join(FRONT, 'ui/vendor/phosphor/bold/style.css'))), fill: namesIn(read(join(FRONT, 'ui/vendor/phosphor/fill/style.css'))) };
  const known = new Set([...full.bold.keys()].filter((n) => full.fill.has(n)));

  it('holds every icon the code names, in both weights', () => {
    const used = new Set<string>();
    const roots: [string, string[]][] = [
      [join(FRONT, 'pages'), ['.html', '.js']], [join(FRONT, 'ui'), ['.js']],
      [join(ROOT, 'festfinder-backend/src'), ['.ts']], [join(ROOT, 'festfinder-web/src'), ['.ts', '.tsx']],
    ];
    for (const [dir, exts] of roots) {
      for (const f of files(dir, exts)) {
        const text = read(f);
        for (const m of text.matchAll(/ph-([a-z0-9-]+)/g)) if (known.has(m[1]) && !NOT_ICONS.has(m[1])) used.add(m[1]);
        // Ops passes bare names to Icon().
        if (relative(FRONT, f).split(sep).includes('ops')) for (const m of text.matchAll(/['"`]([a-z0-9-]+)['"`]/g)) if (known.has(m[1])) used.add(m[1]);
      }
    }
    assert.ok(used.has('google-logo') && used.has('seal-check'), 'the scan finds icons at all');
    const missing = [...used].filter((n) => !cut.bold.has(n) || !cut.fill.has(n)).sort();
    assert.deepEqual(missing, [], 'run: python3 festfinder-frontend/scripts/subset-icons.py');
  });

  it('names only icons Phosphor has', () => {
    const unknown = new Set<string>();
    // Ops names an icon with Icon('x') or icon: 'x'; the API with a ph-bold or ph-fill class.
    const checks: [string, string[], RegExp][] = [
      [join(FRONT, 'pages', 'ops'), ['.js'], /(?:icon:\s*|Icon\()['"]([a-z0-9-]+)['"]/g],
      [join(ROOT, 'festfinder-backend/src'), ['.ts'], /ph-(?:bold|fill) ph-([a-z0-9-]+)/g],
    ];
    for (const [dir, exts, re] of checks) {
      for (const f of files(dir, exts)) {
        for (const m of read(f).matchAll(re)) if (!known.has(m[1])) unknown.add(`${relative(ROOT, f)}: ${m[1]}`);
      }
    }
    assert.deepEqual([...unknown], [], 'these show as blank squares');
  });

  it('keeps each icon on its own code point', () => {
    for (const w of ['bold', 'fill'] as const) {
      for (const [name, code] of cut[w]) assert.equal(code, full[w].get(name), `${w} ${name}`);
    }
  });
});
