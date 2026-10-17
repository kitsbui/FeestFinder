/**
 * Kính đêm v2: the colour tokens are named for their role, not their material. This rewrites the
 * old names in every Tailwind colour utility (bg-paper, hover:text-fog, border-line2/50…) and every
 * var(--color-…) under src, theme.css excepted (it defines the new names by hand).
 *
 * Idempotent: run it again after merging work written with the old names.
 *   node scripts/tokens-v2.ts          rewrite
 *   node scripts/tokens-v2.ts --check  only list what would change (exit 1 if anything)
 *
 * `acc` becomes `info` (the turquoise information layer). The one action a screen exists for is
 * the accent gradient (kd-btn-acc, kd-tag-featured), which no utility names; set those by hand.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(import.meta.dirname, '..', 'src');
const SKIP = new Set([join(ROOT, 'kd', 'theme.css')]);

/** Old name → role name. Longer names first where one starts with another. */
export const RENAMES: [string, string][] = [
  ['line2', 'line-2'], ['line', 'line-1'],
  ['acc-ink', 'on-accent'], ['acc-hi', 'info'], ['acc', 'info'],
  ['ink2', 'on-inverse-2'], ['ink', 'on-inverse'],
  ['void', 'surface-0'], ['carbon', 'surface-1'], ['obsidian', 'surface-2'], ['slate', 'surface-2'],
  ['paper', 'fg-1'], ['mist', 'fg-2'], ['fog', 'fg-3'], ['ash', 'fg-3'],
  ['bone', 'inverse'], ['hot', 'bad'],
  ['fest', 'info'], ['live', 'info'], ['edm', 'info'], ['cult', 'info'],
];

/** Tailwind utilities that take a colour. */
const PREFIX = '(?:bg|text|border(?:-[trblxyse])?|divide|outline|ring(?:-offset)?|fill|stroke|from|via|to|decoration|accent|caret|placeholder|shadow|inset-shadow|inset-ring)';

const rules = RENAMES.flatMap(([from, to]) => [
  { re: new RegExp(`(?<![\\w-])(${PREFIX})-${from}(?![\\w-])`, 'g'), to: `$1-${to}` },
  { re: new RegExp(`--color-${from}(?![\\w-])`, 'g'), to: `--color-${to}` },
]);

export function rewrite(src: string): string {
  return rules.reduce((s, r) => s.replace(r.re, r.to), src);
}

function* files(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* files(p);
    else if (/\.(tsx?|css)$/.test(name) && !SKIP.has(p)) yield p;
  }
}

if (import.meta.main) {
  const check = process.argv.includes('--check');
  const changed: string[] = [];
  for (const p of files(ROOT)) {
    const before = readFileSync(p, 'utf8');
    const after = rewrite(before);
    if (after === before) continue;
    changed.push(relative(join(ROOT, '..'), p));
    if (!check) writeFileSync(p, after);
  }
  console.log(`${check ? 'would rewrite' : 'rewrote'} ${changed.length} files`);
  for (const p of changed) console.log('  ' + p);
  if (check && changed.length) process.exit(1);
}
