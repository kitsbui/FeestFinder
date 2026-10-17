/**
 * Holds the screens to the design tokens (Kính đêm v2), as part of `npm run lint`:
 *
 * 1. No colour is written as a hex value in src/kd, src/app or any stylesheet but theme.css. A
 *    line that must carry a literal (metadata, the web manifest) says so with `tokens-ok`.
 * 2. No old, material-named token is left (bg-paper, var(--color-fog)…): scripts/tokens-v2.ts
 *    rewrites them, and would change nothing.
 * 3. Arbitrary pixel values in class names (h-[38px], text-[13px]) are counted against PX_BUDGET,
 *    which only goes down: use the spacing scale and the type tokens, and lower the budget when
 *    you remove some.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { rewrite } from './tokens-v2.ts';

/** Arbitrary px values in src (148 at design phase 0, 130 after phase 4 removed the app's discovery screens). Lower it when you fix some; never raise it. */
const PX_BUDGET = 126;

const WEB = join(import.meta.dirname, '..');
const SRC = join(WEB, 'src');
const THEME = join(SRC, 'kd', 'theme.css');

function* files(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* files(p);
    else if (/\.(tsx?|css)$/.test(name)) yield p;
  }
}

/** A colour written in hex: #rgb, #rgba, #rrggbb or #rrggbbaa, not part of a longer word (#about, #add-on). */
const HEX = /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{4}|[0-9a-f]{3})(?![\w-])/gi;
const PX = /\[-?\d+(?:\.\d+)?px\]/g;

const problems: string[] = [];
let px = 0;
for (const p of files(SRC)) {
  if (p === THEME) continue;
  const rel = relative(WEB, p);
  const text = readFileSync(p, 'utf8');
  const inScope = p.endsWith('.css') || rel.startsWith('src/kd/') || rel.startsWith('src/app/');
  if (inScope) {
    text.split('\n').forEach((line, i) => {
      if (line.includes('tokens-ok')) return;
      for (const m of line.matchAll(HEX)) problems.push(`${rel}:${i + 1}  hex colour ${m[0]}: use a token from src/kd/theme.css`);
    });
  }
  if (rewrite(text) !== text) problems.push(`${rel}  old token names: run node scripts/tokens-v2.ts`);
  if (p.endsWith('.tsx')) px += text.match(PX)?.length ?? 0;
}
if (px > PX_BUDGET) problems.push(`${px} arbitrary px values in class names, over the budget of ${PX_BUDGET}: use the spacing scale and type tokens`);

if (problems.length) {
  console.error(problems.join('\n'));
  console.error(`\ncheck-tokens: ${problems.length} problem${problems.length > 1 ? 's' : ''}`);
  process.exit(1);
}
console.log(`check-tokens: ok (${px}/${PX_BUDGET} arbitrary px values${px < PX_BUDGET ? ' — lower PX_BUDGET in scripts/check-tokens.ts' : ''})`);
